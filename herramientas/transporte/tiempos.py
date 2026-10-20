#!/usr/bin/env python3
"""Lectura de los GTFS del Consorcio y comprobación contra Renfe. Lo usa
herramientas/transporte/isocronas.py, que es el que escribe datos/transporte.js.

Por su cuenta, este script calcula el primer enfoque, que se descartó: el
tiempo desde cada punto de cada ciudad hasta Sol, Atocha, Nuevos Ministerios
y Plaza de Castilla. Lo deja en herramientas/transporte/salida/, fuera de la
web. Con --comprobar contrasta tiempos de estación a estación con la consulta
oficial de horarios de Renfe Cercanías.

Método, supuestos y cautelas en herramientas/transporte/fuentes/isocronas.md.

Resumen:
  - Horarios: GTFS oficiales del Consorcio Regional de Transportes de Madrid
    (Cercanías, Metro, Metro Ligero, autobuses urbanos e interurbanos).
  - Orígenes: centros de una rejilla de 250 m (EPSG:25830, alineada a
    múltiplos de 250 m) que caen dentro del término municipal de
    datos/mapa/<id>.js.
  - Cálculo: «Connection Scan Algorithm» en su versión de perfiles con límite
    de transbordos (Dibbelt, Pajor, Strasser y Wagner, 2013/2018), hacia
    atrás desde cada destino. Da, para cada parada y cada hora de salida, la
    llegada más temprana al destino con 1, 2, 3 o 4 vehículos.
  - Para cada celda y cada minuto de salida de la ventana: andar hasta
    cualquier parada a menos de 1.200 m, esperar, viajar. Se guarda la
    mediana, el percentil 25 y el 75 del tiempo total de los 61 minutos.

Uso:
    python3 herramientas/transporte/tiempos.py --descargar      # baja los GTFS
    python3 herramientas/transporte/tiempos.py                  # calcula
    python3 herramientas/transporte/tiempos.py --ciudades parla getafe \\
        --fecha 2026-10-27 --ventana 07:30 08:30 --comprobar

Solo biblioteca estándar. Los GTFS (≈ 120 MB descomprimidos) van a
/var/tmp/transporte/, nunca al repositorio.
"""
import argparse
import bisect
import csv
import datetime as dt
import io
import json
import math
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
GTFS_DIR = Path('/var/tmp/transporte')

# ----------------------------------------------------------------- fuentes
# Portal de datos abiertos del CRTM: https://datos.crtm.es/ . Cada conjunto es
# un elemento de ArcGIS Online; el zip se sirve en .../items/<id>/data.
ARCGIS = 'https://www.arcgis.com/sharing/rest/content/items/'
FEEDS = {
    # nombre: (id del elemento en datos.crtm.es, título, modo, prefijo de ids)
    'cercanias': ('1a25440bf66f499bae2657ec7fb40144', 'GTFS Red de Cercanías', 'cercanias', 'c5_'),
    'metro': ('5c7f2951962540d69ffe8f640d94c246', 'GTFS Red de Metro', 'metro', ''),
    'ligero': ('aaed26cc0ff64b0c947ac0bc3e033196', 'GTFS Red de Metro Ligero', 'ligero', ''),
    'urbanos': ('357e63c2904f43aeb5d8a267a64346d8', 'GTFS Red de Autobuses Urbanos', 'bus', ''),
    'interurbanos': ('885399f83408473c8d815e40c5e702b7', 'GTFS Red de Autobuses Interurbanos', 'bus', ''),
}
# Horarios oficiales de Renfe Cercanías (la consulta de horarios.renfe.com/cer),
# solo para --comprobar.
RENFE_HORARIOS = 'https://horarios.renfe.com/cer/HorariosServlet'

# ---------------------------------------------------------------- supuestos
CELDA = 250                 # m, lado de la celda
ANDAR_FACTOR = 1.3          # la calle no es una recta
ANDAR_V = 4.5 / 3.6         # m/s
ANDAR_MAX = 1200            # m en línea recta, de la celda a la primera parada
TRANSBORDO_MAX = 400        # m en línea recta entre paradas para transbordar
TRANSBORDO_MARGEN = 180     # s que se suman a cada transbordo (andenes, pasillos)
MAX_VEHICULOS = 4           # 3 transbordos
LIMITE = 120 * 60           # s; más es «no se llega»
MARGEN_ZONA = 8000          # m alrededor de ciudades y destinos que se carga

# Destinos: paradas en las que «llegar» = bajarse de un vehículo. Ids de
# stops.txt (Cercanías con el prefijo c5_). La justificación está en el .md.
DESTINOS = [
    {'id': 'sol', 'nombre': 'Sol', 'paradas': {
        'c5_18101': 'Cercanías Sol (C-3, C-4)',
        'par_4_12': 'Metro Sol L1', 'par_4_35': 'Metro Sol L2', 'par_4_48': 'Metro Sol L3'}},
    {'id': 'atocha', 'nombre': 'Atocha', 'paradas': {
        'c5_18000': 'Cercanías Madrid-Atocha',
        'par_4_16': 'Metro Atocha L1 (antes Atocha Renfe)'}},
    {'id': 'nuevos_ministerios', 'nombre': 'Nuevos Ministerios', 'paradas': {
        'c5_18002': 'Cercanías Madrid-Nuevos Ministerios',
        'par_4_120': 'Metro Nuevos Ministerios L6', 'par_4_155': 'Metro Nuevos Ministerios L10',
        'par_4_193': 'Metro Nuevos Ministerios L8'}},
    {'id': 'plaza_castilla', 'nombre': 'Plaza de Castilla', 'paradas': {
        'par_4_1': 'Metro Plaza de Castilla L1', 'par_4_164': 'Metro Plaza de Castilla L9',
        'par_4_190': 'Metro Plaza de Castilla L10'}},
]
# Las dársenas de autobús interurbano del intercambiador de Plaza de Castilla
# también cuentan como llegar; se añaden por nombre al cargar (ver
# paradas_intercambiador()).
INTERCAMBIADORES = {'plaza_castilla': ('PLAZA DE CASTILLA', 300)}

INF = 10 ** 9


# ------------------------------------------------------------- proyección
def utm30(lat, lon):
    """WGS84/ETRS89 geográficas -> EPSG:25830 (UTM huso 30N), en metros.
    Serie de Krüger (error < 1 mm en el huso)."""
    a = 6378137.0
    f = 1 / 298.257222101  # GRS80 (ETRS89); con WGS84 la diferencia es < 0,1 mm
    k0 = 0.9996
    lon0 = math.radians(-3.0)
    n = f / (2 - f)
    A = a / (1 + n) * (1 + n * n / 4 + n ** 4 / 64)
    al = [n / 2 - 2 * n * n / 3 + 5 * n ** 3 / 16,
          13 * n * n / 48 - 3 * n ** 3 / 5,
          61 * n ** 3 / 240]
    phi = math.radians(lat)
    lam = math.radians(lon) - lon0
    e = math.sqrt(f * (2 - f))
    t = math.sinh(math.atanh(math.sin(phi)) - e * math.atanh(e * math.sin(phi)))
    xi = math.atan2(t, math.cos(lam))
    eta = math.atanh(math.sin(lam) / math.sqrt(1 + t * t))
    E = eta + sum(al[j] * math.cos(2 * (j + 1) * xi) * math.sinh(2 * (j + 1) * eta) for j in range(3))
    N = xi + sum(al[j] * math.sin(2 * (j + 1) * xi) * math.cosh(2 * (j + 1) * eta) for j in range(3))
    return 500000 + k0 * A * E, k0 * A * N


# ------------------------------------------------------------------- mapas
def leer_mapa(cid):
    txt = (RAIZ / f'datos/mapa/{cid}.js').read_text(encoding='utf-8')
    m = re.search(r"window\.MAPA\['%s'\]\s*=\s*(\{.*\});?\s*$" % re.escape(cid), txt, re.S)
    return json.loads(m.group(1))


def dentro(x, y, anillos):
    """Par-impar sobre todos los anillos (los huecos restan solos)."""
    d = False
    for r in anillos:
        n = len(r)
        for i in range(n):
            x1, y1 = r[i]
            x2, y2 = r[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                d = not d
    return d


def rejilla(mapa):
    cx, cy = mapa['centro']
    anillos = [[(cx + p[0], cy + p[1]) for p in r] for r in mapa['limite']]
    xs = [p[0] for r in anillos for p in r]
    ys = [p[1] for r in anillos for p in r]
    celdas = []
    x0 = math.floor(min(xs) / CELDA) * CELDA
    y0 = math.floor(min(ys) / CELDA) * CELDA
    y = y0
    while y < max(ys):
        x = x0
        while x < max(xs):
            px, py = x + CELDA / 2, y + CELDA / 2
            if dentro(px, py, anillos):
                celdas.append((px, py))
            x += CELDA
        y += CELDA
    return celdas, anillos


# -------------------------------------------------------------------- GTFS
def leer_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as fh:
        yield from csv.DictReader(fh)


def hms(s):
    h, m, ss = s.strip().split(':')
    return int(h) * 3600 + int(m) * 60 + int(ss)


def servicios_activos(d, fecha, avisos):
    """service_id activos en la fecha. Si el feed no cubre la fecha (el de
    Metro del CRTM caducó), se usa el servicio del mismo día de la semana
    y se avisa."""
    ymd = fecha.strftime('%Y%m%d')
    dia = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][fecha.weekday()]
    activos, rango = set(), []
    if (d / 'calendar.txt').exists():
        for r in leer_csv(d / 'calendar.txt'):
            rango.append((r['start_date'], r['end_date']))
            if r[dia] == '1' and r['start_date'] <= ymd <= r['end_date']:
                activos.add(r['service_id'])
    if (d / 'calendar_dates.txt').exists():
        for r in leer_csv(d / 'calendar_dates.txt'):
            if r['date'] == ymd:
                (activos.add if r['exception_type'] == '1' else activos.discard)(r['service_id'])
    if not activos and rango:
        fin = max(b for a, b in rango)
        if fin < ymd:
            for r in leer_csv(d / 'calendar.txt'):
                if r[dia] == '1':
                    activos.add(r['service_id'])
            avisos.append(f'{d.name}: el feed acaba el {fin}; se usa su servicio de '
                          f'{dia} ({", ".join(sorted(activos))}) para {ymd}')
    return activos


class Red:
    def __init__(self):
        self.stops = {}      # id -> (x, y, nombre, feed)
        self.conex = []      # (td, ta, u, v, viaje, sube_u, baja_v)
        self.avisos = []
        self.feeds = {}      # nombre -> metadatos

    def cargar(self, nombre, fecha, t0, t1, caja):
        item, titulo, modo, pref = FEEDS[nombre]
        d = GTFS_DIR / nombre
        meta = {'titulo': titulo, 'url': ARCGIS + item + '/data',
                'portal': f'https://datos.crtm.es/datasets/{item}', 'modo': modo}
        if (d / 'meta.json').exists():
            meta.update(json.loads((d / 'meta.json').read_text()))
        self.feeds[nombre] = meta
        xmin, ymin, xmax, ymax = caja
        for r in leer_csv(d / 'stops.txt'):
            if r.get('location_type', '0') not in ('', '0'):
                continue
            x, y = utm30(float(r['stop_lat']), float(r['stop_lon']))
            self.stops[pref + r['stop_id']] = (x, y, r['stop_name'].strip(), nombre)
        activos = servicios_activos(d, fecha, self.avisos)
        viajes = {}
        for r in leer_csv(d / 'trips.txt'):
            if r['service_id'] in activos:
                viajes[r['trip_id']] = r['route_id']
        frec = {}
        if (d / 'frequencies.txt').exists():
            for r in leer_csv(d / 'frequencies.txt'):
                if r['trip_id'] in viajes:
                    frec.setdefault(r['trip_id'], []).append(
                        (hms(r['start_time']), hms(r['end_time']), int(r['headway_secs'])))
        tiempos = {}
        for r in leer_csv(d / 'stop_times.txt'):
            if r['trip_id'] in viajes:
                tiempos.setdefault(r['trip_id'], []).append((
                    int(r['stop_sequence']), hms(r['arrival_time']), hms(r['departure_time']),
                    pref + r['stop_id'], r.get('pickup_type') or '0', r.get('drop_off_type') or '0'))
        n0 = len(self.conex)
        for tid, st in tiempos.items():
            st.sort()
            salidas = [0]
            if tid in frec:      # viaje plantilla: se repite cada headway
                base = st[0][2]
                salidas = []
                for a, b, h in frec[tid]:
                    s = a
                    while s < b:
                        salidas.append(s - base)
                        s += h
            for k, desfase in enumerate(salidas):
                vid = f'{nombre}:{tid}:{k}'
                for i in range(len(st) - 1):
                    _, _, td, u, pu, _ = st[i]
                    _, ta, _, v, _, dv = st[i + 1]
                    td += desfase
                    ta += desfase
                    if td < t0 or ta > t1:
                        continue
                    if u not in self.stops or v not in self.stops:
                        continue
                    xu, yu = self.stops[u][:2]
                    xv, yv = self.stops[v][:2]
                    if not (xmin <= xu <= xmax and ymin <= yu <= ymax and
                            xmin <= xv <= xmax and ymin <= yv <= ymax):
                        continue
                    self.conex.append((td, ta, u, v, vid, pu != '1', dv != '1'))
        print(f'  {nombre}: {len(activos)} servicios, {len(viajes)} viajes activos, '
              f'{len(self.conex) - n0} conexiones en la ventana', file=sys.stderr)

    def transbordos(self):
        """Vecinos a pie (incluida la propia parada) para cada parada usada."""
        usadas = set()
        for c in self.conex:
            usadas.add(c[2])
            usadas.add(c[3])
        self.usadas = usadas
        cub = {}
        for s in usadas:
            x, y = self.stops[s][:2]
            cub.setdefault((int(x // TRANSBORDO_MAX), int(y // TRANSBORDO_MAX)), []).append(s)
        self.cubos = cub
        self.vec = {}
        for s in usadas:
            x, y = self.stops[s][:2]
            cx, cy = int(x // TRANSBORDO_MAX), int(y // TRANSBORDO_MAX)
            l = []
            for i in (-1, 0, 1):
                for j in (-1, 0, 1):
                    for w in cub.get((cx + i, cy + j), ()):
                        xw, yw = self.stops[w][:2]
                        dd = math.hypot(x - xw, y - yw)
                        if dd <= TRANSBORDO_MAX:
                            l.append((w, round(dd * ANDAR_FACTOR / ANDAR_V) + TRANSBORDO_MARGEN))
            self.vec[s] = l
        # transfers.txt (solo lo trae Cercanías): sustituye al cálculo.
        tf = GTFS_DIR / 'cercanias' / 'transfers.txt'
        if tf.exists():
            for r in leer_csv(tf):
                a, b = 'c5_' + r['from_stop_id'], 'c5_' + r['to_stop_id']
                if a in self.vec and b in self.stops and r.get('min_transfer_time'):
                    m = int(r['min_transfer_time'])
                    self.vec[a] = [(w, t) for w, t in self.vec[a] if w != b] + [(b, m)]

    def cercanas(self, x, y, radio):
        r = []
        cx, cy = int(x // TRANSBORDO_MAX), int(y // TRANSBORDO_MAX)
        k = math.ceil(radio / TRANSBORDO_MAX)
        for i in range(-k, k + 1):
            for j in range(-k, k + 1):
                for w in self.cubos.get((cx + i, cy + j), ()):
                    xw, yw = self.stops[w][:2]
                    dd = math.hypot(x - xw, y - yw)
                    if dd <= radio:
                        r.append((w, dd))
        return r


# ------------------------------------------------- CSA de perfiles, hacia atrás
def perfiles(red, destino):
    """Para cada parada s, lista de (salida, [llegada con ≤1, ≤2, ≤3, ≤4
    vehículos]) ordenada por salida decreciente, de forma que la última
    entrada con salida ≥ t es la mejor opción saliendo de s en t."""
    K = MAX_VEHICULOS
    neg = {}     # s -> lista de -salida (creciente)
    vals = {}    # s -> lista de vectores
    viaje = {}
    meta = destino
    infv = [INF] * K
    for td, ta, u, v, vid, sube, baja in red.conex_ord:
        # 1) bajarse en el destino
        if baja and v in meta:
            tau = [ta] * K
        else:
            tau = list(infv)
        # 2) seguir en el mismo vehículo
        tv = viaje.get(vid)
        if tv is not None:
            tau = [a if a < b else b for a, b in zip(tau, tv)]
        # 3) bajarse en v y transbordar (andando a w, con margen)
        if baja:
            for w, tw in red.vec[v]:
                nl = neg.get(w)
                if nl is None:
                    continue
                i = bisect.bisect_right(nl, -(ta + tw)) - 1
                if i < 0:
                    continue
                p = vals[w][i]
                for k in range(1, K):
                    if p[k - 1] < tau[k]:
                        tau[k] = p[k - 1]
        if tau[K - 1] >= INF:
            continue
        viaje[vid] = tau
        if not sube:
            continue
        nl = neg.get(u)
        if nl is None:
            neg[u] = [-td]
            vals[u] = [tau]
            continue
        ult = vals[u][-1]
        if all(a <= b for a, b in zip(ult, tau)):
            continue
        nuevo = [a if a < b else b for a, b in zip(ult, tau)]
        if nl[-1] == -td:
            vals[u][-1] = nuevo
        else:
            nl.append(-td)
            vals[u].append(nuevo)
    return neg, vals


def consulta(neg, vals, s, t):
    nl = neg.get(s)
    if nl is None:
        return INF
    i = bisect.bisect_right(nl, -t) - 1
    return vals[s][i][-1] if i >= 0 else INF


def percentiles(v):
    """Rango más cercano sobre los 61 valores (INF = no se llega)."""
    v = sorted(v)
    n = len(v)
    out = []
    for q in (0.5, 0.25, 0.75):
        x = v[round(q * (n - 1))]
        out.append(None if x > LIMITE else round(x / 60))
    return out


# -------------------------------------------------------------- estaciones
def estaciones(red, anillos, centro):
    """Paradas de Cercanías, Metro y Metro Ligero dentro del término,
    agrupadas por nombre y cercanía (< 300 m)."""
    grupos = []
    for s, (x, y, nom, feed) in red.stops.items():
        modo = FEEDS[feed][2]
        if modo == 'bus' or s not in red.usadas or not dentro(x, y, anillos):
            continue
        nom = nom.strip()
        if feed in ('metro', 'ligero'):
            nom = nom.title().replace(' De ', ' de ').replace(' Del ', ' del ').replace(' La ', ' la ')
        for g in grupos:
            if math.hypot(g['_x'] - x, g['_y'] - y) < 300 and (
                    g['_n'][0].lower() == nom.lower() or modo not in g['modos']):
                g['_p'].append((x, y))
                g['_n'].append(nom)
                if modo not in g['modos']:
                    g['modos'].append(modo)
                break
        else:
            grupos.append({'_x': x, '_y': y, '_p': [(x, y)], '_n': [nom], 'modos': [modo]})
    out = []
    for g in grupos:
        xs = [p[0] for p in g['_p']]
        ys = [p[1] for p in g['_p']]
        nombres = []
        for n in g['_n']:
            if n.lower() not in [m.lower() for m in nombres]:
                nombres.append(n)
        out.append({'nombre': ' / '.join(nombres), 'modos': sorted(g['modos']),
                    'x': round(sum(xs) / len(xs) - centro[0]),
                    'y': round(sum(ys) / len(ys) - centro[1])})
    out.sort(key=lambda e: (e['nombre']))
    return out


# --------------------------------------------------------------- descargas
def descargar():
    for nombre, (item, titulo, _, _) in FEEDS.items():
        d = GTFS_DIR / nombre
        d.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(ARCGIS + item + '?f=json') as r:
            info = json.load(r)
        url = ARCGIS + item + '/data'
        print('descargando', url, file=sys.stderr)
        with urllib.request.urlopen(url) as r:
            datos = r.read()
        (d / 'feed.zip').write_bytes(datos)
        with zipfile.ZipFile(io.BytesIO(datos)) as z:
            for n in z.namelist():
                if n.endswith('.txt') and '/' not in n:
                    (d / n).write_bytes(z.read(n))
        version = ''
        if (d / 'feed_info.txt').exists():
            for r in leer_csv(d / 'feed_info.txt'):
                version = r.get('feed_version', '')
                break
        modificado = dt.datetime.fromtimestamp(info['modified'] / 1000, dt.timezone.utc)
        (d / 'meta.json').write_text(json.dumps({
            'fichero': info.get('name'), 'bytes': len(datos),
            'modificado': modificado.strftime('%Y-%m-%d'),
            'descargado': dt.date.today().isoformat(), 'version': version}))


# ------------------------------------------------------------ comprobación
def renfe_oficial(origen, destino, fecha):
    """Trenes directos de la consulta oficial de Renfe Cercanías (núcleo 10)."""
    cuerpo = json.dumps({'nucleo': '10', 'origen': origen, 'destino': destino,
                         'fchaViaje': fecha.strftime('%Y%m%d'), 'validaReglaNegocio': True,
                         'tiempoReal': False, 'servicioHorarios': 'VTI',
                         'horaViajeOrigen': '06', 'horaViajeLlegada': '11',
                         'accesibilidadTrenes': True}).encode()
    req = urllib.request.Request(RENFE_HORARIOS, data=cuerpo,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        d = json.load(r)
    trenes = []
    for h in d.get('horario', []):
        if h.get('trans'):
            continue
        trenes.append((hms(h['horaSalida'] + ':00'), hms(h['horaLlegada'] + ':00'), h['linea']))
    return trenes


def mediana_estacion(neg, vals, paradas, v0, v1):
    tt = []
    for t in range(v0, v1 + 1, 60):
        a = min(consulta(neg, vals, s, t) for s in paradas)
        tt.append(a - t)
    return percentiles(tt)


def mediana_oficial(trenes, v0, v1):
    tt = []
    for t in range(v0, v1 + 1, 60):
        a = min([ll for sa, ll, _ in trenes if sa >= t] or [INF])
        tt.append(a - t)
    return percentiles(tt)


# -------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ciudades', nargs='+', default=['parla', 'getafe'])
    ap.add_argument('--fecha', default='2026-10-27', help='martes laborable dentro de la validez de los feeds')
    ap.add_argument('--ventana', nargs=2, default=['07:30', '08:30'])
    ap.add_argument('--descargar', action='store_true', help='baja los GTFS a /var/tmp/transporte y sale')
    ap.add_argument('--comprobar', action='store_true', help='contrasta con los horarios oficiales de Renfe')
    ap.add_argument('--salida', default=str(RAIZ / 'herramientas/transporte/salida/destinos.js'))
    a = ap.parse_args()
    if a.descargar:
        descargar()
        return
    fecha = dt.date.fromisoformat(a.fecha)
    v0, v1 = hms(a.ventana[0] + ':00'), hms(a.ventana[1] + ':00')

    mapas = {c: leer_mapa(c) for c in a.ciudades}
    rej = {c: rejilla(mapas[c]) for c in a.ciudades}
    # caja de carga: ciudades + destinos (Madrid centro) + margen
    xs, ys = [], []
    for c in a.ciudades:
        for r in rej[c][1]:
            for x, y in r:
                xs.append(x)
                ys.append(y)
    for x, y in [utm30(40.4669, -3.68917), utm30(40.40659, -3.68938), utm30(40.41688, -3.70326)]:
        xs.append(x)
        ys.append(y)
    caja = (min(xs) - MARGEN_ZONA, min(ys) - MARGEN_ZONA, max(xs) + MARGEN_ZONA, max(ys) + MARGEN_ZONA)

    print('cargando GTFS', file=sys.stderr)
    red = Red()
    for f in FEEDS:
        red.cargar(f, fecha, v0, v1 + LIMITE, caja)
    for av in red.avisos:
        print('AVISO', av, file=sys.stderr)
    red.conex_ord = sorted(red.conex, key=lambda c: (-c[0], -c[1]))
    red.transbordos()

    # paradas de destino
    for d in DESTINOS:
        d['ids'] = set(d['paradas'])
        if d['id'] in INTERCAMBIADORES:
            nombre, radio = INTERCAMBIADORES[d['id']]
            x0, y0 = red.stops['par_4_1'][:2]
            for s, (x, y, nom, feed) in red.stops.items():
                if feed in ('interurbanos', 'urbanos') and nombre in nom.upper() and \
                        math.hypot(x - x0, y - y0) <= radio:
                    d['ids'].add(s)
                    d['paradas'][s] = f'Interurbano {nom} ({s})'
        falta = [s for s in d['paradas'] if s not in red.stops]
        if falta:
            sys.exit(f'faltan paradas de destino {falta}')

    prof = {}
    for d in DESTINOS:
        print('perfiles hacia', d['nombre'], file=sys.stderr)
        prof[d['id']] = perfiles(red, d['ids'])

    salida = {'fecha': fecha.isoformat(), 'ventana': a.ventana, 'celda': CELDA,
              'destinos': [{'id': d['id'], 'nombre': d['nombre']} for d in DESTINOS],
              'fuentes': [], 'ciudades': {}}
    for nombre, m in red.feeds.items():
        texto = f"Consorcio Regional de Transportes de Madrid, {m['titulo']}"
        if m.get('modificado'):
            texto += f" (publicado el {m['modificado']}, descargado el {m['descargado']})"
        salida['fuentes'].append([texto, m['portal']])
    salida['fuentes'].append(['Instituto Geográfico Nacional, términos municipales (vía datos/mapa)',
                              'https://www.ign.es/wfs-inspire/unidades-administrativas'])

    minutos = list(range(v0, v1 + 1, 60))
    for c in a.ciudades:
        celdas, anillos = rej[c]
        cx, cy = mapas[c]['centro']
        filas = []
        for x, y in celdas:
            cerca = [(s, round(dd * ANDAR_FACTOR / ANDAR_V)) for s, dd in red.cercanas(x, y, ANDAR_MAX)]
            med, p25, p75 = [], [], []
            for d in DESTINOS:
                neg, vals = prof[d['id']]
                cs = [(s, w) for s, w in cerca if s in neg]
                tt = []
                for t in minutos:
                    best = INF
                    for s, w in cs:
                        ar = consulta(neg, vals, s, t + w)
                        if ar < best:
                            best = ar
                    tt.append(best - t)
                m_, a_, b_ = percentiles(tt)
                med.append(m_)
                p25.append(a_)
                p75.append(b_)
            filas.append([round(x - cx), round(y - cy), med, p25, p75])
        salida['ciudades'][c] = {'centro': [cx, cy], 'celdas': filas,
                                 'estaciones': estaciones(red, anillos, (cx, cy))}
        print(f'{c}: {len(filas)} celdas', file=sys.stderr)

    cab = ('/* GENERADO por herramientas/transporte/tiempos.py. No se edita a mano.\n'
           f'   Tiempo en transporte público desde el centro de cada celda de {CELDA} m hasta\n'
           '   cada destino (llegar en un vehículo a una de sus paradas), saliendo cada\n'
           f'   minuto de {a.ventana[0]} a {a.ventana[1]} del {fecha.isoformat()} (martes laborable).\n'
           '   celdas: [x, y, [mediana por destino], [percentil 25], [percentil 75]] en\n'
           '   minutos; null = no se llega en 120 min. x, y en metros respecto a centro\n'
           '   (EPSG:25830), el mismo de datos/mapa/<id>.js.\n'
           '   Supuestos: a pie, línea recta x 1,3 a 4,5 km/h; hasta 1.200 m a la primera\n'
           '   parada; transbordos a pie de hasta 400 m + 3 min; como mucho 3 transbordos.\n'
           '   Fuentes: GTFS del Consorcio Regional de Transportes de Madrid\n'
           '   (https://datos.crtm.es/): Cercanías, Metro, Metro Ligero, autobuses urbanos\n'
           '   e interurbanos. Método: herramientas/transporte/fuentes/tiempos.md */\n')
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    Path(a.salida).write_text(cab + 'window.TRANSPORTE = ' +
                              json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n',
                              encoding='utf-8')
    print('escrito', a.salida, file=sys.stderr)

    # resumen
    for c in a.ciudades:
        filas = salida['ciudades'][c]['celdas']
        for j, d in enumerate(DESTINOS):
            vals_ = [f[2][j] for f in filas if f[2][j] is not None]
            centro = min(filas, key=lambda f: f[0] ** 2 + f[1] ** 2)[2][j]
            print(f'{c:8s} -> {d["nombre"]:20s} centro {centro}  mejor {min(vals_) if vals_ else None}  '
                  f'peor {max(vals_) if vals_ else None}  sin llegar {sum(1 for f in filas if f[2][j] is None)}'
                  f'/{len(filas)}', file=sys.stderr)

    if a.comprobar:
        comprobar(red, prof, fecha, v0, v1)


COMPROBACIONES = [
    # (origen Renfe, nombre, destino Renfe, id destino del modelo)
    ('37012', 'Parla', '18000', 'atocha'),
    ('37012', 'Parla', '18101', 'sol'),
    ('37002', 'Getafe-Centro', '18000', 'atocha'),
    ('37002', 'Getafe-Centro', '18101', 'sol'),
    ('37002', 'Getafe-Centro', '18002', 'nuevos_ministerios'),
]


def comprobar(red, prof, fecha, v0, v1):
    print('\nComprobación contra horarios.renfe.com (de estación a estación, sin andar):', file=sys.stderr)
    for o, on, de, did in COMPROBACIONES:
        trenes = renfe_oficial(o, de, fecha)
        neg, vals = prof[did]
        mod = mediana_estacion(neg, vals, ['c5_' + o], v0, v1)
        ofi = mediana_oficial(trenes, v0, v1)
        dur = sorted({(ll - sa) // 60 for sa, ll, _ in trenes if v0 <= sa <= v1})
        # mismo cálculo solo con Cercanías del GTFS, tren a tren
        gt = []
        for sa, ll, _ in trenes:
            if v0 <= sa <= v1:
                gt.append((sa, ll))
        print(f'  {on} -> {de} ({did}): oficial mediana/p25/p75 {ofi} min, '
              f'duración de los trenes {dur}; modelo {mod}', file=sys.stderr)


if __name__ == '__main__':
    main()

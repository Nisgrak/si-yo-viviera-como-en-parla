#!/usr/bin/env python3
"""Hasta dónde se llega en transporte público
saliendo del ayuntamiento de cada ciudad en 15, 30, 45 y 60 minutos,
un martes laborable, saliendo entre las 7:30 y las 8:30.

No es lo que pinta la web (eso es ciudad.py): es el mapa al revés, que se
descartó, y queda para otra medida, los empleos a los que se llega en 45
minutos. Método, supuestos y cautelas en herramientas/transporte/fuentes/isocronas.md.

Resumen:
  - Horarios: GTFS oficiales del Consorcio Regional de Transportes de Madrid
    (Cercanías, Metro, Metro Ligero, EMT, autobuses urbanos e interurbanos),
    leídos con herramientas/transporte/tiempos.py.
  - Origen: el ayuntamiento, geocodificado con CartoCiudad (IGN).
  - Cálculo: «Connection Scan Algorithm» hacia delante (Dibbelt, Pajor,
    Strasser y Wagner), una vez por cada minuto de salida de la ventana.
    Da la hora de llegada más temprana a cada parada.
  - Destinos: los centros de una rejilla de 250 m a menos de 1.200 m de una
    parada a la que se llega, o del ayuntamiento. A cada uno se llega andando
    desde la parada que antes lo permita. Para cada celda se guarda la mediana
    de los 61 minutos de salida.
  - Isócronas: la unión de las celdas con mediana igual o menor que cada
    umbral, con las esquinas redondeadas (100 m) y simplificada (15 m).
  - Contexto del mapa: términos municipales del IGN y líneas de Cercanías,
    Metro y Metro Ligero de los mismos GTFS.

Uso:
    python3 herramientas/transporte/tiempos.py --descargar    # baja los GTFS (y EMT con este)
    python3 herramientas/transporte/isocronas.py --ciudades parla getafe

Necesita numpy y shapely (como herramientas/accesos/accesos.py):
    pip install --user numpy shapely
Los GTFS van a /var/tmp/transporte/ y la caché del IGN a herramientas/.cache/.
"""
import argparse
import bisect
import datetime as dt
import json
import math
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

try:
    import numpy as np
    from shapely.geometry import LineString, Polygon, box
    from shapely.ops import unary_union
except ImportError as e:  # pragma: no cover
    sys.exit(f'Falta una dependencia ({e.name}). Mira el encabezado de este fichero.')

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tiempos as T  # noqa: E402

RAIZ = T.RAIZ
CACHE = RAIZ / 'herramientas/.cache/transporte'
T.FEEDS['emt'] = ('868df0e58fca47e79b942902dffd7da0', 'GTFS Red de EMT', 'bus', 'emt_')

UMBRALES = [15, 30, 45, 60]
MAX_T = UMBRALES[-1] * 60
CELDA = 250
ANDAR_MAX = T.ANDAR_MAX
RADIO = 45000            # m alrededor de Sol que se carga y se pinta
REDONDEO = 150           # m: se cierran y se abren las isócronas con este radio para quitar la escalera
SIMPLIFICA = 15          # m
MODOS = ['tren', 'todo']  # solo Cercanías, Metro y Metro Ligero; y con autobuses
TREN = {'cercanias', 'metro', 'ligero'}

GEOCODER = 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp'
# Origen: el ayuntamiento (Casa Consistorial). Dirección y municipio para
# CartoCiudad; se guarda la referencia catastral que devuelve.
ORIGENES = {
    'parla': ('Ayuntamiento de Parla', 'Plaza de la Constitucion 1, Parla', '28106'),
    'getafe': ('Ayuntamiento de Getafe', 'Plaza de la Constitucion 1, Getafe', '28065'),
    'leganes': ('Ayuntamiento de Leganés', 'Plaza Mayor 1, Leganes', '28074'),
    'fuenlabrada': ('Ayuntamiento de Fuenlabrada', 'Plaza de la Constitucion 1, Fuenlabrada', '28058'),
    'mostoles': ('Ayuntamiento de Móstoles', 'Plaza de España 1, Mostoles', '28092'),
    # CartoCiudad no tiene la plaza de los Reyes de España: se usa su topónimo.
    'alcorcon': ('Ayuntamiento de Alcorcón', 'Ayuntamiento de Alcorcón, Alcorcón', '28007'),
    'alcobendas': ('Ayuntamiento de Alcobendas', 'Plaza Mayor 1, Alcobendas', '28006'),
    'pinto': ('Ayuntamiento de Pinto', 'Plaza de la Constitucion 1, Pinto', '28113'),
    'torrejon': ('Ayuntamiento de Torrejón de Ardoz', 'Plaza Mayor 1, Torrejon de Ardoz', '28148'),
    'pozuelo': ('Ayuntamiento de Pozuelo de Alarcón', 'Plaza Mayor 1, Pozuelo de Alarcon', '28115'),
    'majadahonda': ('Ayuntamiento de Majadahonda', 'Plaza Mayor 3, Majadahonda', '28080'),
}
SOL = (40.41688, -3.70326)      # Puerta del Sol, km 0: el centro común de los mapas
WFS = 'https://www.ign.es/wfs-inspire/unidades-administrativas'


# ---------------------------------------------------------------- origen
def geocodifica(cid):
    nombre, q, ine = ORIGENES[cid]
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / f'origen-{cid}.json'
    if not f.exists():
        url = GEOCODER + '?' + urllib.parse.urlencode({'q': q, 'limit': 5})
        with urllib.request.urlopen(url, timeout=60) as r:
            txt = r.read().decode('utf-8')
        f.write_text(re.search(r'callback\((.*)\)\s*$', txt, re.S).group(1))
    d = json.loads(f.read_text())
    # Si la dirección es ambigua, CartoCiudad devuelve una lista.
    if isinstance(d, list):
        d = next((x for x in d if x.get('muniCode') == ine), {})
    if d.get('muniCode') != ine:
        sys.exit(f'{cid}: CartoCiudad no devuelve el municipio {ine}')
    x, y = T.utm30(d['lat'], d['lng'])
    direccion = (f"{d['tip_via'].lower().capitalize()} {d['address'].title()}, {d['portalNumber']}"
                 if d.get('type') == 'portal' else d['address'])
    return {'nombre': nombre, 'direccion': direccion, 'refCatastral': d.get('refCatastral'),
            'x': x, 'y': y, 'fuente': GEOCODER + '?' + urllib.parse.urlencode({'q': q, 'limit': 1})}


# ------------------------------------------------------- CSA hacia delante
def llegadas(red, conex_td, conex, ox, oy, t):
    """Llegada más temprana a cada parada saliendo de (ox, oy) a las t."""
    INF = T.INF
    arr = {}       # llegar (para andar hasta el destino)
    sube = {}      # poder subir (con el margen de transbordo)
    for s, dd in red.cercanas(ox, oy, ANDAR_MAX):
        w = t + round(dd * T.ANDAR_FACTOR / T.ANDAR_V)
        if w < arr.get(s, INF):
            arr[s] = w
            sube[s] = w
    fin = t + MAX_T
    viajes = set()
    for i in range(bisect.bisect_left(conex_td, t), len(conex)):
        td, ta, u, v, vid, pu, dv = conex[i]
        if td > fin:
            break
        if vid not in viajes:
            if not pu or sube.get(u, INF) > td:
                continue
            viajes.add(vid)
        if dv and ta < arr.get(v, INF):
            arr[v] = ta
            for w, tw in red.vec[v]:
                if ta + tw < sube.get(w, INF):
                    sube[w] = ta + tw
    return arr


# -------------------------------------------------------------- rejilla
def rejilla(red, paradas, origenes, sol):
    """Celdas de 250 m a menos de ANDAR_MAX de una parada o de un origen, y
    los pares (celda, parada, segundos andando)."""
    sx, sy = sol
    idx = {}
    pares_c, pares_s, pares_w = [], [], []
    k = math.ceil(ANDAR_MAX / CELDA)

    def celdas_cerca(x, y):
        i0, j0 = int((x - sx) // CELDA), int((y - sy) // CELDA)
        for i in range(i0 - k, i0 + k + 1):
            for j in range(j0 - k, j0 + k + 1):
                cx, cy = sx + (i + .5) * CELDA, sy + (j + .5) * CELDA
                dd = math.hypot(cx - x, cy - y)
                if dd <= ANDAR_MAX:
                    yield (i, j), round(dd * T.ANDAR_FACTOR / T.ANDAR_V)

    for n, s in enumerate(paradas):
        x, y = red.stops[s][:2]
        if abs(x - sx) > RADIO or abs(y - sy) > RADIO:
            continue
        for c, w in celdas_cerca(x, y):
            pares_c.append(idx.setdefault(c, len(idx)))
            pares_s.append(n)
            pares_w.append(w)
    for x, y in origenes:
        for c, w in celdas_cerca(x, y):
            idx.setdefault(c, len(idx))
    celdas = [None] * len(idx)
    for c, n in idx.items():
        celdas[n] = c
    return celdas, idx, np.array(pares_c), np.array(pares_s), np.array(pares_w, dtype=np.int64)


# ------------------------------------------------------------ geometría
def anillos(g, sol, tol):
    """Polígonos de shapely -> [[[x, y], ...], ...] relativos a Sol, en metros."""
    sx, sy = sol
    out = []
    geoms = getattr(g, 'geoms', [g])
    for p in geoms:
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        p = p.simplify(tol)
        for r in [p.exterior] + list(p.interiors):
            cs = [[round(x - sx), round(y - sy)] for x, y in r.coords[:-1]]
            if len(cs) >= 3:
                out.append(cs)
    return out


def isocronas(celdas, med, sol):
    sx, sy = sol
    out, area = {}, {}
    for u in UMBRALES:
        cajas = [box(sx + i * CELDA, sy + j * CELDA, sx + (i + 1) * CELDA, sy + (j + 1) * CELDA)
                 for (i, j), m in zip(celdas, med) if m <= u * 60]
        # Cerrar (sumar y restar) y abrir (restar y sumar): redondea las
        # esquinas hacia fuera y hacia dentro, sin mover los bordes rectos.
        g = unary_union(cajas).buffer(REDONDEO, quad_segs=8).buffer(-2 * REDONDEO, quad_segs=8).buffer(REDONDEO, quad_segs=8)
        out[str(u)] = anillos(g, sol, SIMPLIFICA)
        area[str(u)] = round(g.area / 1e6, 1)
    return out, area


# ------------------------------------------------------------- contexto
def municipios(sol):
    """Términos municipales del IGN que tocan la caja, simplificados."""
    sx, sy = sol
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / f'municipios-{RADIO}.xml'
    if not f.exists():
        q = urllib.parse.urlencode({
            'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature',
            'typeNames': 'au:AdministrativeUnit',
            'bbox': f'{sx-RADIO},{sy-RADIO},{sx+RADIO},{sy+RADIO},urn:ogc:def:crs:EPSG::25830',
            'srsName': 'urn:ogc:def:crs:EPSG::25830', 'count': '400'})
        print('bajando términos del IGN', file=sys.stderr)
        with urllib.request.urlopen(WFS + '?' + q, timeout=600) as r:
            f.write_bytes(r.read())
    t = f.read_text(encoding='utf-8')
    out = []
    for m in re.finditer(r'<wfs:member>(.*?)</wfs:member>', t, re.S):
        bloque = m.group(1)
        # 4thOrder son los municipios; lo demás, comunidades y provincias.
        nivel = re.search(r'<au:nationalLevel[^>]*href="[^"]*/(\w+)"', bloque)
        if not nivel or nivel.group(1) != '4thOrder':
            continue
        nombre = re.search(r'<gn:text>([^<]+)</gn:text>', bloque)
        codigo = re.search(r'gml:id="AU_ADMINISTRATIVEUNIT_(\d+)"', bloque)
        polys = []
        for pm in re.findall(r'<gml:Polygon.*?</gml:Polygon>', bloque, re.S):
            rr = [list(map(float, p.split())) for p in re.findall(r'<gml:posList[^>]*>(.*?)</gml:posList>', pm, re.S)]
            rr = [list(zip(a[0::2], a[1::2])) for a in rr]
            polys.append(Polygon(rr[0], rr[1:]))
        if not polys:
            continue
        g = unary_union(polys)
        rp = g.representative_point()
        out.append({'nombre': nombre.group(1).strip() if nombre else '',
                    'ine': codigo.group(1)[-5:] if codigo else '',
                    'anillos': anillos(g, sol, 60),
                    'rx': round(rp.x - sx), 'ry': round(rp.y - sy)})
    return out


def lineas(sol):
    """Recorridos de Cercanías, Metro y Metro Ligero (shapes.txt), uno por
    línea y sentido, simplificados."""
    sx, sy = sol
    out = []
    for feed, modo in (('cercanias', 'cercanias'), ('metro', 'metro'), ('ligero', 'ligero')):
        d = T.GTFS_DIR / feed
        rutas = {r['route_id']: r.get('route_short_name') or r.get('route_long_name') for r in T.leer_csv(d / 'routes.txt')}
        forma_ruta = {}
        for r in T.leer_csv(d / 'trips.txt'):
            if r.get('shape_id'):
                forma_ruta.setdefault(r['shape_id'], rutas.get(r['route_id'], ''))
        pts = {}
        for r in T.leer_csv(d / 'shapes.txt'):
            pts.setdefault(r['shape_id'], []).append((int(r['shape_pt_sequence']), float(r['shape_pt_lat']), float(r['shape_pt_lon'])))
        vistas = []
        for sid, p in pts.items():
            p.sort()
            cs = [T.utm30(la, lo) for _, la, lo in p]
            g = LineString(cs)
            # Un recorrido que repite casi entero otro ya guardado no aporta.
            if any(g.length > 0 and g.buffer(30).difference(v).area < g.buffer(30).area * 0.05 for v in vistas):
                continue
            vistas.append(g.buffer(30))
            g = g.simplify(25)
            c = [[round(x - sx), round(y - sy)] for x, y in g.coords]
            if any(abs(x) <= RADIO and abs(y) <= RADIO for x, y in c):
                out.append({'modo': modo, 'nombre': forma_ruta.get(sid, ''), 'c': c})
    return out


def medianas(red, conex_td, conex, ox, oy, salidas, celdas, idx, pc, ps, pw, paradas, pos, destinos, sol, rotulo):
    """Mediana de las salidas, por celda, y minutos a las estaciones clave."""
    # andando desde el ayuntamiento, sin subir a nada
    directo = np.full(len(celdas), np.iinfo(np.int64).max // 4, dtype=np.int64)
    i0, j0 = int((ox - sol[0]) // CELDA), int((oy - sol[1]) // CELDA)
    k = math.ceil(ANDAR_MAX / CELDA)
    for i in range(i0 - k, i0 + k + 1):
        for j in range(j0 - k, j0 + k + 1):
            if (i, j) in idx:
                dd = math.hypot(sol[0] + (i + .5) * CELDA - ox, sol[1] + (j + .5) * CELDA - oy)
                if dd <= ANDAR_MAX:
                    directo[idx[(i, j)]] = round(dd * T.ANDAR_FACTOR / T.ANDAR_V)
    tiempos = np.empty((len(salidas), len(celdas)), dtype=np.int64)
    claves = {d['nombre']: [] for d in destinos}
    for n, t in enumerate(salidas):
        arr = llegadas(red, conex_td, conex, ox, oy, t)
        va = np.full(len(paradas), T.INF, dtype=np.int64)
        for s, x in arr.items():
            if s in pos:
                va[pos[s]] = x
        cel = np.full(len(celdas), T.INF, dtype=np.int64)
        np.minimum.at(cel, pc, va[ps] + pw)
        tiempos[n] = np.minimum(cel - t, directo)
        for d in destinos:
            claves[d['nombre']].append(min([arr.get(s, T.INF) for s in d['ids']] or [T.INF]) - t)
        if n % 10 == 0:
            print(f'  {rotulo}: salida {n + 1}/{len(salidas)}', file=sys.stderr)
    med = np.median(tiempos, axis=0)
    llega = {}
    for nom, v in claves.items():
        m = sorted(v)[len(v) // 2]
        llega[nom] = None if m > MAX_T else round(m / 60)
    return med, llega


# -------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ciudades', nargs='+', default=['parla', 'getafe'])
    ap.add_argument('--fecha', default='2026-10-27', help='martes laborable dentro de la validez de los feeds')
    ap.add_argument('--ventana', nargs=2, default=['07:30', '08:30'])
    ap.add_argument('--paso', type=int, default=60, help='segundos entre salidas')
    ap.add_argument('--salida', default=str(RAIZ / 'herramientas/transporte/salida/isocronas.js'))
    ap.add_argument('--rehacer', action='store_true', help='recalcula los tiempos aunque estén en la caché')
    a = ap.parse_args()
    fecha = dt.date.fromisoformat(a.fecha)
    v0, v1 = T.hms(a.ventana[0] + ':00'), T.hms(a.ventana[1] + ':00')
    sol = T.utm30(*SOL)
    caja = (sol[0] - RADIO - 5000, sol[1] - RADIO - 5000, sol[0] + RADIO + 5000, sol[1] + RADIO + 5000)

    origen = {c: geocodifica(c) for c in a.ciudades}

    print('cargando GTFS', file=sys.stderr)
    red = T.Red()
    for f in T.FEEDS:
        red.cargar(f, fecha, v0, v1 + MAX_T, caja)
    for av in red.avisos:
        print('AVISO', av, file=sys.stderr)
    red.transbordos()
    conex = sorted(red.conex, key=lambda c: (c[0], c[1]))
    conex_td = [c[0] for c in conex]
    paradas = sorted(red.usadas)
    pos = {s: n for n, s in enumerate(paradas)}
    print(f'{len(conex)} conexiones, {len(paradas)} paradas', file=sys.stderr)

    celdas, idx, pc, ps, pw = rejilla(red, paradas, [(o['x'], o['y']) for o in origen.values()], sol)
    print(f'{len(celdas)} celdas', file=sys.stderr)

    destinos = [{'nombre': d['nombre'], 'ids': [s for s in d['paradas'] if s in pos]} for d in T.DESTINOS]

    salidas = list(range(v0, v1 + 1, a.paso))
    res = {}
    # Dos cuentas: solo tren (Cercanías, Metro y Metro Ligero) y con los
    # autobuses. Los autobuses van con su horario, que en hora punta no
    # siempre cumplen; la web enseña primero la de solo tren.
    conex_modo = {'todo': conex, 'tren': [x for x in conex if x[4].split(':', 1)[0] in TREN]}
    for c in a.ciudades:
        ox, oy = origen[c]['x'], origen[c]['y']
        res[c] = {'origen': {'nombre': origen[c]['nombre'], 'direccion': origen[c]['direccion'],
                             'x': round(ox - sol[0]), 'y': round(oy - sol[1])}, 'modos': {}}
        for modo in MODOS:
            cache = CACHE / f'medianas-{c}-{modo}-{fecha.isoformat()}-{a.ventana[0]}-{a.ventana[1]}-{a.paso}.json'
            if cache.exists() and not a.rehacer:
                print(f'{c} {modo}: tiempos de la caché {cache.name}', file=sys.stderr)
                g = json.loads(cache.read_text())
                med, llega = np.array(g['med']), g['llega']
                cel = [tuple(x) for x in g['celdas']]
            else:
                cx = conex_modo[modo]
                med, llega = medianas(red, [x[0] for x in cx], cx, ox, oy, salidas, celdas, idx,
                                      pc, ps, pw, paradas, pos, destinos, sol, f'{c} {modo}')
                cel = celdas
                cache.write_text(json.dumps({'celdas': celdas, 'med': [float(x) for x in med], 'llega': llega}))
            iso, area = isocronas(cel, med, sol)
            res[c]['modos'][modo] = {'isocronas': iso, 'km2': area, 'llega': llega}
            print(c, modo, area, llega, file=sys.stderr)

    print('contexto', file=sys.stderr)
    salida = {
        'fecha': fecha.isoformat(), 'ventana': a.ventana, 'umbrales': UMBRALES, 'celda': CELDA,
        'radio': RADIO, 'fuentes': [], 'ciudades': res,
        'contexto': {'municipios': municipios(sol), 'lineas': lineas(sol),
                     'rotulos': [{'t': d['nombre'], 'x': round(sum(red.stops[s][0] for s in d['ids']) / len(d['ids']) - sol[0]),
                                  'y': round(sum(red.stops[s][1] for s in d['ids']) / len(d['ids']) - sol[1])}
                                 for d in destinos if d['ids']]},
    }
    for nombre, m in red.feeds.items():
        texto = f"Consorcio Regional de Transportes de Madrid, {m['titulo']}"
        if m.get('modificado'):
            texto += f" ({m['modificado']})"
        salida['fuentes'].append([texto, m['portal']])
    salida['fuentes'].append(['IGN, CartoCiudad: dirección de los ayuntamientos', 'https://www.cartociudad.es/'])
    salida['fuentes'].append(['IGN, términos municipales', WFS])
    cab = ('/* GENERADO por herramientas/transporte/isocronas.py. No se edita a mano.\n'
           '   Hasta dónde se llega en transporte público saliendo del ayuntamiento de cada\n'
           f'   ciudad, mediana de las salidas de {a.ventana[0]} a {a.ventana[1]} del {fecha.isoformat()}.\n'
           '   Coordenadas en metros respecto a la Puerta del Sol (EPSG:25830).\n'
           '   Método y cautelas: herramientas/transporte/fuentes/isocronas.md */\n')
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    Path(a.salida).write_text(cab + 'window.TRANSPORTE = ' +
                              json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('escrito', a.salida, Path(a.salida).stat().st_size, 'bytes', file=sys.stderr)
    for av in red.avisos:
        print('AVISO', av, file=sys.stderr)


if __name__ == '__main__':
    main()

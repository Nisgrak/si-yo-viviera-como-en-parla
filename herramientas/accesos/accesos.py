#!/usr/bin/env python3
"""Por qué puertas sale y entra la gente en coche de cada ciudad.

Para las 11 ciudades de datos/datos.js se reparten los viajes por carretera
que salen o entran del término entre las «puertas» por las que cruzan su
límite, con el día entero y dos ventanas de mañana (6-10 h y 7-8 h).

Qué se hace:
  1. Los límites municipales, del WFS INSPIRE del IGN (los mismos ficheros
     que usa herramientas/zonas-verdes.py, en herramientas/.cache).
  2. La red del estudio de rutas por carretera del Ministerio de Transportes
     (Open Data Movilidad, estudios_rutas/geometria): cada tramo que corta el
     límite de una ciudad es un cruce; los cruces a menos de 1.100 m entre sí
     se juntan en una puerta, y la puerta se nombra con sus vías y su lado
     (N, NE...) visto desde el centroide del término.
  3. Los viajes, de estudios_rutas: OD_rutas (viajes al día por par origen-
     destino y ruta) y tramo_ruta (los tramos de cada ruta, en orden). La
     puerta de salida es el primer tramo-puerta de la ruta; la de entrada, el
     último.
  4. Las ventanas horarias, del estudio básico por municipios
     (estudios_basicos/por-municipios/viajes): qué parte de los viajes de
     cada par origen-destino cae entre las 6 y las 10, o entre las 7 y las 8.
     Se aplica esa fracción a los viajes por carretera del mismo par.

Lo que NO se hace, y conviene tenerlo presente:
  · Son viajeros (personas), no vehículos. No se convierte a coches.
  · La fracción horaria es de todos los modos, no solo del coche, porque el
    estudio de rutas no tiene hora. Las ventanas son una estimación.
  · Una ruta que no pisa ningún tramo de la red en el límite queda como
    «(sin tramo de red en el límite)»; una ruta sin tramos, como «(ruta sin
    tramos)». No se reparten.
  · Es un día laborable de cada año (16-10-2024 y 17-10-2023), no una media.

Uso:
    python3 -m venv .venv && .venv/bin/pip install requests shapely pyshp
    .venv/bin/python herramientas/accesos/accesos.py [fecha ...] [--cache DIR] [--mapa]

Sin fechas, hace 20241016 y 20231017. Deja en herramientas/accesos/salida/
puertas11_<fecha>.csv (cada puerta, cada sentido, cada ventana) y
ciudades11_<fecha>.csv (una fila por ciudad).

Con --mapa escribe además datos/mapa/<id>.js, uno por ciudad, del día
MAPA_FECHA (20241016). Cada uno es un script que se carga con <script> desde
file:// y deja window.MAPA['<id>'] = {...}. Coordenadas en metros enteros,
EPSG:25830 (x al este, y al norte), restado el centroide del término:
  · limite   anillos del término (IGN), simplificado a 15 m.
  · vias     tramos de la red a menos de 4 km del límite con s >= 50; s son
             viajeros con origen en la ciudad que pasan por el tramo de 6 a
             10 (cada ruta pesa sus viajes de 6-10, como en el reparto; un
             viaje cuenta en todos los tramos que pisa, dentro o fuera).
             n, el nombre de la vía. Los tramos de la red no tienen sentido
             propio: la misma geometría sirve a los dos y está dibujada
             como venga. Se orienta en el sentido en que la recorren la
             mayoría de esos viajeros, sacado del orden de la ruta; si no se
             puede, hacia fuera del centroide. Los tramos seguidos de la
             misma vía y la misma carga se funden. Simplificado a 20 m.
  · puertas  las de puertas11: id, x, y, v (viajeros que salen por ella de
             6 a 10) y pct (sobre todos los que salen de 6 a 10, como en el
             CSV). sin_puerta, los que salen de 6 a 10 por rutas que no
             pisan la red en el límite; sale_6_10, todos.
  · fondo    las carreteras con matrícula (A-42, M-408...) en la misma zona,
             sin carga, simplificadas a 40 m. Solo de contexto.
Las rutas de MAPA_FECHA salen de tr11 (relaciones tramo-ruta ya filtradas),
así que con --cache no se baja nada nuevo.

Las descargas van a herramientas/.cache/accesos (o a --cache). De OD_rutas,
tramo_ruta y el estudio básico solo se guarda lo filtrado para las 11
ciudades; tramo_ruta pesa 1,5 GB por día y se filtra al vuelo, sin tocar
disco. Si un fichero ya está en la caché, no se vuelve a bajar.
"""

import collections
import csv
import gzip
import json
import math
import os
import re
import shutil
import sys

try:
    import requests
    import shapefile
    from shapely.geometry import LineString, MultiPoint, Polygon
    from shapely.ops import linemerge, unary_union
    from shapely.prepared import prep
except ImportError as e:  # pragma: no cover
    sys.exit(f'Falta una dependencia ({e.name}). Mira el encabezado de este fichero.')

AQUI = os.path.dirname(os.path.abspath(__file__))
CACHE_IGN = os.path.join(AQUI, '..', '.cache')
CACHE = os.path.join(CACHE_IGN, 'accesos')
SALIDA = os.path.join(AQUI, 'salida')
FECHAS = ['20241016', '20231017']

MITMA = 'https://movilidad-opendata.mitma.es'
GEOMETRIA = 'estudios_rutas/geometria/Geometria_tramos_2023_2024'
WFS = 'https://www.ign.es/wfs-inspire/unidades-administrativas'

# Código INE, nombre en el IGN y un punto dentro del término en UTM 30N (el
# mismo de zonas-verdes.py, ya proyectado). El orden cuenta: numera las puertas.
CIUDADES = {
    '28106': ('Parla',              434381, 4454292),
    '28065': ('Getafe',             437798, 4462222),
    '28074': ('Leganés',            435147, 4465220),
    '28058': ('Fuenlabrada',        432489, 4459604),
    '28092': ('Móstoles',           426520, 4463889),
    '28007': ('Alcorcón',           429943, 4466476),
    '28006': ('Alcobendas',         445667, 4487948),
    '28115': ('Pozuelo de Alarcón', 430960, 4476358),
    '28148': ('Torrejón de Ardoz',  459326, 4478404),
    '28080': ('Majadahonda',        426083, 4480678),
    '28113': ('Pinto',              440488, 4455218),
}

# Población a 1-1-2025 (INE), la de datos/datos.js.
POB = {'28065': 193238, '28106': 137471, '28113': 56651, '28058': 190076, '28074': 195734,
       '28007': 175719, '28006': 123342, '28092': 214817, '28148': 143526, '28115': 89770,
       '28080': 73625}

# Las zonas de OD_rutas son municipios (5 cifras) o distritos (7); las del
# estudio básico por municipios, solo municipios.
COD = '|'.join(CIUDADES)
ZONA_RUTAS = re.compile(rf'^({COD})([0-9][0-9])?$'.encode())
ZONA_BASICO = re.compile(rf'^({COD})$'.encode())

GRUPO_M = 1100  # metros: cruces más cerca que esto son la misma puerta
VENTANAS = {'6_10': (6, 10), '7_8': (7, 8)}
SIN_PUERTA = ('(sin tramo de red en el límite)', '(ruta sin tramos)')
LADOS = ['E', 'NE', 'N', 'NO', 'O', 'SO', 'S', 'SE']


def aviso(*a):
    print(*a, file=sys.stderr, flush=True)


# ── Descargas ────────────────────────────────────────────────────────────────

def abre(url):
    """La respuesta en crudo, para leerla a trozos sin cargarla entera."""
    r = requests.get(url, stream=True, timeout=600)
    r.raise_for_status()
    return r.raw


def baja(ruta_remota, destino):
    """Un fichero tal cual, a la caché."""
    if os.path.exists(destino):
        return destino
    aviso('bajando', ruta_remota)
    with abre(f'{MITMA}/{ruta_remota}') as r, open(destino + '.part', 'wb') as f:
        shutil.copyfileobj(r, f, 1 << 20)
    os.replace(destino + '.part', destino)
    return destino


def filtra(ruta_remota, destino, quedarse):
    """Un .csv.gz remoto, descomprimido al vuelo; solo se escriben las líneas
    para las que quedarse(nº de línea, línea) es cierto."""
    if os.path.exists(destino):
        return destino
    aviso('bajando y filtrando', ruta_remota)
    with abre(f'{MITMA}/{ruta_remota}') as r, gzip.open(r) as g, open(destino + '.part', 'wb') as f:
        for n, linea in enumerate(g, 1):
            if quedarse(n, linea):
                f.write(linea)
    os.replace(destino + '.part', destino)
    return destino


def campos(linea, sep):
    return linea.rstrip(b'\r\n').split(sep)


def descarga(fecha, cache):
    """Lo que hace falta de un día, filtrado para las 11 ciudades."""
    od = filtra(f'estudios_rutas/od_rutas/{fecha}_OD_rutas.csv.gz',
                os.path.join(cache, f'od11_{fecha}.psv'),
                lambda n, l: (lambda c: bool(ZONA_RUTAS.match(c[1]) or ZONA_RUTAS.match(c[2])))(campos(l, b'|')))
    # las rutas que usan esos viajes, y de tramo_ruta solo sus tramos
    rutas = {campos(l, b'|')[3] for l in open(od, 'rb')}
    tr = filtra(f'estudios_rutas/tramo_ruta/{fecha}_Relaciones_tramos_rutas.csv.gz',
                os.path.join(cache, f'tr11_{fecha}.csv'),
                lambda n, l: l.split(b';', 1)[0].rstrip(b'\r\n') in rutas)
    mes = f'{fecha[:4]}-{fecha[4:6]}'
    eb = filtra(f'estudios_basicos/por-municipios/viajes/ficheros-diarios/{mes}/{fecha}_Viajes_municipios.csv.gz',
                os.path.join(cache, f'eb11_{fecha}.psv'),
                lambda n, l: n == 1 or (lambda c: bool(ZONA_BASICO.match(c[2]) or ZONA_BASICO.match(c[3])))(campos(l, b'|')))
    return od, tr, eb


# ── Límites y puertas ────────────────────────────────────────────────────────

def xml_ign(nombre, x, y):
    """El término del WFS del IGN, guardado como lo guarda zonas-verdes.py."""
    ruta = os.path.join(CACHE_IGN, f'ign-{nombre}.xml')
    if os.path.exists(ruta):
        return ruta
    aviso('bajando el término de', nombre)
    radio = 4000
    r = requests.get(WFS, params={
        'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature',
        'typeNames': 'au:AdministrativeUnit',
        'bbox': f'{x-radio},{y-radio},{x+radio},{y+radio},urn:ogc:def:crs:EPSG::25830',
        'srsName': 'urn:ogc:def:crs:EPSG::25830', 'count': '30'}, timeout=240)
    r.raise_for_status()
    for m in re.finditer(r'<wfs:member>(.*?)</wfs:member>', r.text, re.S):
        t = re.search(r'<gn:text>([^<]+)</gn:text>', m.group(1))
        if t and t.group(1).strip() == nombre:
            os.makedirs(CACHE_IGN, exist_ok=True)
            open(ruta, 'w', encoding='utf-8').write(m.group(1))
            return ruta
    raise SystemExit(f'{nombre}: el WFS del IGN no ha devuelto su término')


def termino(codigo):
    nombre, x, y = CIUDADES[codigo]
    t = open(xml_ign(nombre, x, y), encoding='utf-8').read()
    polys = []
    for m in re.finditer(r'<au:AdministrativeUnit[^>]*gml:id="AU_ADMINISTRATIVEUNIT_(\d+)".*?</au:AdministrativeUnit>', t, re.S):
        if not m.group(1).endswith(codigo):
            continue
        for pm in re.findall(r'<gml:Polygon.*?</gml:Polygon>', m.group(0), re.S):
            anillos = [list(map(float, p.split())) for p in re.findall(r'<gml:posList[^>]*>(.*?)</gml:posList>', pm, re.S)]
            anillos = [list(zip(a[0::2], a[1::2])) for a in anillos]
            polys.append(Polygon(anillos[0], anillos[1:]))
    g = unary_union(polys)
    if g.is_empty:
        raise SystemExit(f'{nombre}: sin polígono en el XML del IGN')
    return g


def puertas(cache):
    """Por ciudad: sus puertas, cada una con sus tramos de la red."""
    for ext in ('shp', 'shx', 'dbf', 'prj'):
        baja(f'{GEOMETRIA}/Geometria_tramos.{ext}', os.path.join(cache, f'Geometria_tramos.{ext}'))
    baja(f'{GEOMETRIA}/rt_tramo_val.csv', os.path.join(cache, 'rt_tramo_val.csv'))

    T = {c: termino(c) for c in CIUDADES}
    minx, miny, maxx, maxy = unary_union(list(T.values())).buffer(3000).bounds
    via = {}
    with open(os.path.join(cache, 'rt_tramo_val.csv'), encoding='utf-8-sig') as f:
        for fila in csv.DictReader(f):
            via[fila['id_tramo']] = fila['nombre']

    # cada tramo que corta un límite, con el punto medio de sus cortes
    r = shapefile.Reader(os.path.join(cache, 'Geometria_tramos.shp'))
    cruces = {c: [] for c in T}
    for i in range(len(r)):
        s = r.shape(i)
        b = s.bbox
        if b[2] < minx or b[0] > maxx or b[3] < miny or b[1] > maxy or len(s.points) < 2:
            continue
        g = LineString(s.points)
        for c, P in T.items():
            if not g.intersects(P.boundary):
                continue
            x = g.intersection(P.boundary)
            pts = [x] if x.geom_type == 'Point' else [p for p in getattr(x, 'geoms', []) if p.geom_type == 'Point']
            if not pts:
                pts = [x.centroid]
            p = MultiPoint(pts).centroid
            tid = r.record(i)[0]
            cruces[c].append({'tramo': tid, 'nombre': via.get(tid, ''), 'x': p.x, 'y': p.y})

    # cruces en puertas: enlace simple a menos de GRUPO_M
    res = {}
    for c, cr in cruces.items():
        n = len(cr)
        padre = list(range(n))

        def raiz(a):
            while padre[a] != a:
                padre[a] = padre[padre[a]]
                a = padre[a]
            return a
        for i in range(n):
            for j in range(i + 1, n):
                if math.hypot(cr[i]['x'] - cr[j]['x'], cr[i]['y'] - cr[j]['y']) < GRUPO_M:
                    padre[raiz(i)] = raiz(j)
        grupos = {}
        for i in range(n):
            grupos.setdefault(raiz(i), []).append(cr[i])
        cen = T[c].centroid
        lista = []
        for g in grupos.values():
            x = sum(e['x'] for e in g) / len(g)
            y = sum(e['y'] for e in g) / len(g)
            a = math.degrees(math.atan2(y - cen.y, x - cen.x))
            lado = LADOS[int(((a + 22.5) % 360) // 45)]
            # las carreteras con matrícula (A-42, M-408...) primero
            vias = sorted({e['nombre'] or '?' for e in g}, key=lambda v: (not re.match(r'^[A-Z]{1,2}-\d', v), v))
            lista.append({'nombre': f"{' / '.join(vias)} ({lado})", 'tramos': [e['tramo'] for e in g], 'x': x, 'y': y})
        lista.sort(key=lambda p: p['nombre'])
        for i, p in enumerate(lista):
            p['id'] = f'{c}-{i+1:02d}'
        res[c] = lista
        aviso(f'{CIUDADES[c][0]}: {n} tramos en el límite, {len(lista)} puertas')
    return res


# ── Reparto ──────────────────────────────────────────────────────────────────

def ciudad(z):
    """La ciudad de una zona de OD_rutas (municipio o distrito), o None."""
    if z in POB:
        return z
    if len(z) == 7 and z.isdigit() and z[:5] in POB:
        return z[:5]
    return None


def zona_basico(z):
    """Zona de OD_rutas → zona del estudio básico: el distrito pasa a municipio."""
    return z[:5] if (len(z) == 7 and z.isdigit()) else z


def metricas(cnt):
    """Concentración entre puertas: la mayor, cuántas hacen el 80 %, HHI."""
    T = sum(cnt.values())
    G = {k: v for k, v in cnt.items() if k not in SIN_PUERTA}
    TG = sum(G.values())
    cuotas = sorted((v / TG for v in G.values()), reverse=True)
    acc = 0
    n80 = 0
    for s in cuotas:
        acc += s
        n80 += 1
        if acc >= 0.8:
            break
    return {'top': cuotas[0] if cuotas else 0, 'n80': n80, 'hhi': sum(s * s for s in cuotas) * 10000,
            'nored': 1 - TG / T if T else 0, 'ngates_used': sum(1 for s in cuotas if s >= 0.01)}


def fracciones(eb):
    """Viajes al día de cada par origen-destino y qué fracción cae en cada ventana."""
    tot = collections.Counter()
    win = {k: collections.Counter() for k in VENTANAS}
    for r in csv.DictReader(open(eb), delimiter='|'):
        k = (r['origen'], r['destino'])
        v = float(r['viajes'])
        h = int(r['periodo'])
        tot[k] += v
        for w, (a, b) in VENTANAS.items():
            if a <= h < b:
                win[w][k] += v
    return tot, {w: {k: win[w][k] / tot[k] for k in tot if tot[k] > 0} for w in VENTANAS}


def reparto(fecha, PU, od, tr, eb, salida):
    puerta = {c: {t: p['id'] for p in PU[c] for t in p['tramos']} for c in PU}
    pnombre = {p['id']: p['nombre'] for c in PU for p in PU[c]}
    tramos_puerta = set().union(*[set(d) for d in puerta.values()])

    # de cada ruta, sus tramos-puerta en orden de recorrido, y si tiene tramos
    rseq = collections.defaultdict(list)
    con_tramos = set()
    for linea in open(tr):
        r, t = linea.rstrip('\n').split(';')
        if t:
            con_tramos.add(r)
            if t in tramos_puerta:
                rseq[r].append(t)

    tot, frac = fracciones(eb)

    # de contexto: lo que sale y entra de cada ciudad en todos los modos
    ebc = collections.Counter()
    for (o, d), v in tot.items():
        if o in POB and d != o:
            ebc[(o, 'sale')] += v
        if d in POB and o != d:
            ebc[(d, 'entra')] += v

    R = collections.defaultdict(collections.Counter)  # (ciudad, sentido, ventana) → puerta → viajes
    sinfrac = collections.Counter()
    for linea in open(od):
        _, o, d, ruta, _dist, v = linea.rstrip('\n').split('|')
        v = float(v)
        co, cd = ciudad(o), ciudad(d)
        for c, sentido in ((co, 'sale'), (cd, 'entra')):
            if c is None or co == cd:
                continue
            seq = [puerta[c][t] for t in rseq.get(ruta, []) if t in puerta[c]]
            if ruta not in con_tramos:
                g = '(ruta sin tramos)'
            elif not seq:
                g = '(sin tramo de red en el límite)'
            else:
                g = seq[0] if sentido == 'sale' else seq[-1]
            k = (zona_basico(o), zona_basico(d))
            R[(c, sentido, 'dia')][g] += v
            for w in VENTANAS:
                f = frac[w].get(k)
                if f is None:
                    f = 0
                    sinfrac[(c, sentido, w)] += v
                R[(c, sentido, w)][g] += v * f

    filas = []
    det = []
    for c in sorted(POB, key=lambda c: CIUDADES[c][0]):
        n = CIUDADES[c][0]
        fila = {'codigo': c, 'ciudad': n, 'poblacion': POB[c], 'puertas_red': len(PU[c])}
        for s in ('sale', 'entra'):
            for w in ('dia', '6_10', '7_8'):
                cnt = R[(c, s, w)]
                T = sum(cnt.values())
                fila[f'{s}_{w}'] = T
                fila[f'{s}_{w}_x1000hab'] = 1000 * T / POB[c]
                for g, v in cnt.items():
                    det.append([fecha, c, n, s, w, g, pnombre.get(g, g), f'{v:.2f}', f'{100*v/T if T else 0:.2f}'])
            m = metricas(R[(c, s, '6_10')])
            for k, v in m.items():
                fila[f'{s}_6_10_{k}'] = v
            md = metricas(R[(c, s, 'dia')])
            fila[f'{s}_dia_top'] = md['top']
            fila[f'{s}_dia_hhi'] = md['hhi']
            top = max(((g, v) for g, v in R[(c, s, '6_10')].items() if g not in SIN_PUERTA), key=lambda x: x[1])
            fila[f'{s}_6_10_puerta_top'] = pnombre[top[0]]
            fila[f'{s}_sinfrac_dia'] = sinfrac[(c, s, '6_10')]
        fila['eb_sale_dia_todos_modos'] = ebc[(c, 'sale')]
        fila['eb_entra_dia_todos_modos'] = ebc[(c, 'entra')]
        filas.append(fila)

    os.makedirs(salida, exist_ok=True)
    with open(os.path.join(salida, f'ciudades11_{fecha}.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0]), delimiter=';')
        w.writeheader()
        for r in filas:
            w.writerow({k: (f'{v:.4f}' if isinstance(v, float) else v) for k, v in r.items()})
    with open(os.path.join(salida, f'puertas11_{fecha}.csv'), 'w', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['fecha', 'codigo', 'ciudad', 'sentido', 'ventana', 'puerta_id', 'puerta', 'viajes', 'pct'])
        w.writerows(sorted(det, key=lambda x: (x[2], x[3], x[4], -float(x[7]))))

    for r in filas:
        aviso(f"{r['ciudad']:20s} sale/día {r['sale_dia']:9.1f}  6-10 {r['sale_6_10']:8.1f}  "
              f"entra/día {r['entra_dia']:9.1f}  6-10 {r['entra_6_10']:8.1f}  "
              f"puerta 6-10 {100*r['sale_6_10_top']:4.1f} %  {r['sale_6_10_puerta_top']}")


# ── Mapa ─────────────────────────────────────────────────────────────────────

MAPA_FECHA = '20241016'
MAPA_DIR = os.path.join(AQUI, '..', '..', 'datos', 'mapa')
ZONA_M = 4000     # metros alrededor del límite
MIN_S = 50        # viajeros de 6 a 10 para pintar un tramo
TOL_LIMITE = 15   # metros de Douglas-Peucker
TOL_VIA = 20
TOL_FONDO = 40
TOCA_M = 30       # extremos de dos tramos seguidos más cerca que esto se tocan
MATRICULA = re.compile(r'^[A-Z]{1,3}-\d')

# Código INE → id de la web (datos/datos.js).
IDS = {'28106': 'parla', '28065': 'getafe', '28074': 'leganes', '28058': 'fuenlabrada',
       '28092': 'mostoles', '28007': 'alcorcon', '28006': 'alcobendas', '28113': 'pinto',
       '28148': 'torrejon', '28115': 'pozuelo', '28080': 'majadahonda'}


def pesos_salida(od, eb):
    """Ruta → ciudad → viajeros de 6 a 10 con origen en la ciudad y destino fuera."""
    _, frac = fracciones(eb)
    peso = collections.defaultdict(collections.Counter)
    for linea in open(od):
        _, o, d, ruta, _dist, v = linea.rstrip('\n').split('|')
        co = ciudad(o)
        if co is None or co == ciudad(d):
            continue
        f = frac['6_10'].get((zona_basico(o), zona_basico(d)), 0)
        if f:
            peso[ruta][co] += float(v) * f
    return peso


def rutas(tr):
    """(ruta, [tramos en orden]) de tramo_ruta, que viene agrupado por ruta."""
    actual, seq = None, []
    for linea in open(tr):
        r, t = linea.rstrip('\n').split(';')
        if r != actual:
            if actual is not None:
                yield actual, seq
            actual, seq = r, []
        if t:
            seq.append(t)
    if actual is not None:
        yield actual, seq


def hacia_delante(P, Q, Q_sigue):
    """Si la ruta recorre P de su primer punto al último, mirando el tramo Q
    que va justo después (Q_sigue) o justo antes. None si no se tocan."""
    d = lambda a, b: math.hypot(a[0] - b[0], a[1] - b[1])
    fin = min(d(P[-1], Q[0]), d(P[-1], Q[-1]))
    ini = min(d(P[0], Q[0]), d(P[0], Q[-1]))
    if min(fin, ini) > TOCA_M or fin == ini:
        return None
    return (fin < ini) == Q_sigue


def funde(trozos):
    """Une los trozos (nombre, s, puntos) que siguen uno a otro, de la misma vía
    y con la misma carga, en un nudo sin más ramas de las pintadas."""
    k = lambda p: (round(p[0]), round(p[1]))
    salen = collections.defaultdict(list)
    llegan = collections.defaultdict(list)
    for i, (_, _, p) in enumerate(trozos):
        salen[k(p[0])].append(i)
        llegan[k(p[-1])].append(i)

    def siguiente(i):
        n, s, p = trozos[i]
        a, b = salen[k(p[-1])], llegan[k(p[-1])]
        if len(a) == 1 and len(b) == 1 and a[0] != i:
            j = a[0]
            if trozos[j][0] == n and abs(trozos[j][1] - s) < 0.05:
                return j
        return None
    previo = {}
    for i in range(len(trozos)):
        j = siguiente(i)
        if j is not None:
            previo[j] = i
    hecho = set()
    res = []
    # primero las cabezas de cadena; lo que quede son ciclos
    for i in [i for i in range(len(trozos)) if i not in previo] + list(range(len(trozos))):
        if i in hecho:
            continue
        n, s, p = trozos[i]
        pts = list(p)
        hecho.add(i)
        j = siguiente(i)
        while j is not None and j not in hecho:
            pts += list(trozos[j][2])[1:]
            hecho.add(j)
            j = siguiente(j)
        res.append((n, s, pts))
    return res


def plano(geom, cx, cy, tol):
    """Puntos simplificados, en metros enteros respecto al centroide, sin repetidos."""
    out = []
    for x, y in geom.simplify(tol).coords:
        q = [round(x - cx), round(y - cy)]
        if not out or q != out[-1]:
            out.append(q)
    return out


def mapa(fecha, PU, cache, od, tr, eb, salida, destino):
    T = {c: termino(c) for c in CIUDADES}
    Z = {c: T[c].buffer(ZONA_M) for c in CIUDADES}
    minx, miny, maxx, maxy = unary_union(list(Z.values())).buffer(2000).bounds
    via = {}
    with open(os.path.join(cache, 'rt_tramo_val.csv'), encoding='utf-8-sig') as f:
        for fila in csv.DictReader(f):
            via[fila['id_tramo']] = fila['nombre']

    # extremos de todos los tramos de la caja (para orientar), puntos de los
    # que caen en alguna zona
    ZP = {c: prep(z) for c, z in Z.items()}
    ext, pts, zona = {}, {}, {c: set() for c in CIUDADES}
    r = shapefile.Reader(os.path.join(cache, 'Geometria_tramos.shp'))
    for i in range(len(r)):
        s = r.shape(i)
        b = s.bbox
        if b[2] < minx or b[0] > maxx or b[3] < miny or b[1] > maxy or len(s.points) < 2:
            continue
        tid = r.record(i)[0]
        ext[tid] = (s.points[0], s.points[-1])
        g = LineString(s.points)
        for c, P in ZP.items():
            if P.intersects(g):
                zona[c].add(tid)
                pts[tid] = s.points
    en_zona = set(pts)

    # carga de cada tramo de la zona, por sentido de recorrido (True: del
    # primer punto al último; None: no se sabe)
    peso = pesos_salida(od, eb)
    carga = {c: collections.defaultdict(collections.Counter) for c in CIUDADES}
    for ruta, seq in rutas(tr):
        w = peso.get(ruta)
        if not w:
            continue
        for i, t in enumerate(seq):
            if t not in en_zona:
                continue
            P = ext[t]
            sentido = None
            if i + 1 < len(seq) and seq[i + 1] in ext:
                sentido = hacia_delante(P, ext[seq[i + 1]], True)
            if sentido is None and i > 0 and seq[i - 1] in ext:
                sentido = hacia_delante(P, ext[seq[i - 1]], False)
            for c, v in w.items():
                if t in zona[c]:
                    carga[c][t][sentido] += v

    # lo que sale por cada puerta de 6 a 10, del CSV del reparto
    porp, calles = {}, collections.Counter()
    with open(os.path.join(salida, f'puertas11_{fecha}.csv'), encoding='utf-8') as f:
        for fila in csv.DictReader(f, delimiter=';'):
            if fila['sentido'] == 'sale' and fila['ventana'] == '6_10':
                porp[fila['puerta_id']] = (float(fila['viajes']), float(fila['pct']))
                if fila['puerta_id'] in SIN_PUERTA:
                    calles[fila['codigo']] += float(fila['viajes'])
    sale = collections.Counter()
    for fila in csv.DictReader(open(os.path.join(salida, f'ciudades11_{fecha}.csv'), encoding='utf-8'), delimiter=';'):
        sale[fila['codigo']] = float(fila['sale_6_10'])

    os.makedirs(destino, exist_ok=True)
    for c, (nombre, _, _) in CIUDADES.items():
        cen = T[c].centroid
        cx, cy = round(cen.x), round(cen.y)

        trozos, contra, sin = [], 0.0, 0.0
        for t in zona[c]:
            k = carga[c][t]
            s = sum(k.values())
            if s < MIN_S:
                continue
            p = pts[t]
            if k[True] != k[False]:
                al_reves = k[False] > k[True]
            else:  # hacia fuera del centroide
                al_reves = math.hypot(p[0][0] - cx, p[0][1] - cy) > math.hypot(p[-1][0] - cx, p[-1][1] - cy)
            contra += k[True] if al_reves else k[False]
            sin += k[None]
            trozos.append((via.get(t, ''), s, p[::-1] if al_reves else list(p)))
        total_s = sum(s for _, s, _ in trozos)
        vias = []
        for n, s, p in sorted(funde(trozos), key=lambda x: x[1]):
            q = plano(LineString(p), cx, cy, TOL_VIA)
            if len(q) >= 2:
                vias.append({'n': n, 's': round(s, 1), 'c': q})

        fondo = []
        porvia = collections.defaultdict(list)
        for t in zona[c]:
            n = via.get(t, '')
            if MATRICULA.match(n):
                porvia[n].append(LineString(pts[t]))
        for n in sorted(porvia):
            g = unary_union(porvia[n])
            if g.geom_type == 'MultiLineString':
                g = linemerge(g)
            for parte in (g.geoms if hasattr(g, 'geoms') else [g]):
                q = plano(parte, cx, cy, TOL_FONDO)
                if len(q) >= 2 and parte.length > 200:
                    fondo.append({'n': n, 'c': q})

        limite = []
        g = T[c].simplify(TOL_LIMITE)
        for poly in (g.geoms if hasattr(g, 'geoms') else [g]):
            for anillo in [poly.exterior, *poly.interiors]:
                limite.append(plano(anillo, cx, cy, 0))

        pu = []
        for p in PU[c]:
            v, pct = porp.get(p['id'], (0.0, 0.0))
            pu.append({'id': p['id'], 'nombre': p['nombre'], 'x': round(p['x'] - cx), 'y': round(p['y'] - cy),
                       'v': round(v, 1), 'pct': pct})

        datos = {'id': IDS[c], 'codigo': c, 'ciudad': nombre, 'fecha': fecha,
                 'crs': 'EPSG:25830', 'centro': [cx, cy], 'sale_6_10': round(sale[c], 1),
                 'sin_puerta': round(calles[c], 1),
                 'limite': limite, 'puertas': pu, 'vias': vias, 'fondo': fondo}
        cabecera = (f'/* GENERADO por herramientas/accesos/accesos.py --mapa. No se edita a mano.\n'
                    f'   {nombre}, {fecha[6:]}-{fecha[4:6]}-{fecha[:4]}. Metros respecto a centro (EPSG:25830).\n'
                    f'   vias.s: viajeros con origen en la ciudad que pasan por el tramo de 6 a 10\n'
                    f'   (estimación). Fuente: Ministerio de Transportes, rutas por carretera y\n'
                    f'   estudio básico de movilidad; término municipal del IGN. */\n')
        ruta = os.path.join(destino, f'{IDS[c]}.js')
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(cabecera)
            f.write(f"window.MAPA = window.MAPA || {{}};\nwindow.MAPA['{IDS[c]}'] = ")
            f.write(json.dumps(datos, ensure_ascii=False, separators=(',', ':')))
            f.write(';\n')

        # control: lo que pasa por los tramos de cada puerta frente al reparto
        lim = sum(sum(carga[c][t].values()) for p in PU[c] for t in p['tramos'])
        enp = sum(porp.get(p['id'], (0, 0))[0] for p in PU[c])
        aviso(f'{nombre:20s} {os.path.getsize(ruta)/1024:6.1f} KB  {len(vias):4d} vías ({len(trozos)} tramos)  '
              f'{len(fondo):3d} de fondo  tramos de puerta {lim:8.1f} / reparto por puertas {enp:8.1f}  '
              f'contra el dibujo {100*contra/total_s if total_s else 0:4.1f} %  sin sentido {100*sin/total_s if total_s else 0:4.1f} %')


def main():
    args = sys.argv[1:]
    cache = CACHE
    if '--cache' in args:
        i = args.index('--cache')
        cache = args[i + 1]
        del args[i:i + 2]
    con_mapa = '--mapa' in args
    if con_mapa:
        args.remove('--mapa')
    fechas = args or FECHAS
    os.makedirs(cache, exist_ok=True)
    PU = puertas(cache)
    for fecha in fechas:
        aviso(f'── {fecha}')
        od, tr, eb = descarga(fecha, cache)
        reparto(fecha, PU, od, tr, eb, SALIDA)
    if con_mapa:
        aviso(f'── mapa {MAPA_FECHA}')
        od, tr, eb = descarga(MAPA_FECHA, cache)
        if MAPA_FECHA not in fechas:
            reparto(MAPA_FECHA, PU, od, tr, eb, SALIDA)
        mapa(MAPA_FECHA, PU, cache, od, tr, eb, SALIDA, MAPA_DIR)


if __name__ == '__main__':
    main()

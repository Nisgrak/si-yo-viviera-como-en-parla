#!/usr/bin/env python3
"""Escribe datos/a42.js: cuánta gente va por la A-42 hacia Madrid en cada
punto, de Toledo a Madrid, y de dónde viene.

Con el estudio de rutas por carretera del Ministerio de Transportes (el mismo
que accesos.py), pero sin filtrar por ciudad: todos los viajes de España cuya
ruta pisa la A-42.

  1. Los tramos de la red llamados A-42 (rt_tramo_val.csv) que cortan una
     línea horizontal (misma coordenada norte, EPSG:25830) en cada punto de
     control de CORTES.
  2. tramo_ruta, al vuelo (1,5 GB): las rutas que pisan esos tramos y en qué
     sentido, mirando si el tramo que va después en la ruta está más al
     norte que el de antes.
  3. OD_rutas: los viajes al día de cada ruta, con su origen y su destino.
  4. La parte de 6 a 10 y de 7 a 8, del estudio básico por municipios de ese
     par origen-destino, como en accesos.py (el estudio de rutas no tiene
     hora). Si el par no está, la de su origen; si no, la de todo el día.

Son viajeros, no vehículos.

Uso:
    python3 herramientas/accesos/a42.py          # todo (lee 1,5 GB la primera vez)
    python3 herramientas/accesos/a42.py --web    # solo datos/a42.js, de la caché

Necesita pyshp y shapely. Caché en herramientas/.cache/accesos.

Los carriles hacia Madrid son de OpenStreetMap: las vías motorway y trunk
con ref A-42 de la zona, que se bajan una vez de Overpass (vias_osm()) y se
guardan en la caché. En los siete cortes con nombre van en CARRILES, mirados
a mano; para el mapa, los de cada punto cada PASO metros (web()).
"""
import collections
import csv
import gzip
import json
import math
import sys
import urllib.request
from pathlib import Path

import shapefile
from shapely.geometry import LineString

AQUI = Path(__file__).resolve().parent
CACHE = AQUI.parent / '.cache' / 'accesos'
EB = AQUI.parent / '.cache' / 'transporte'
MITMA = 'https://movilidad-opendata.mitma.es'
FECHA = '20241016'

# Puntos de control, de sur a norte: (coordenada norte, nombre).
CORTES = [
    (4438000, 'Illescas (Toledo)'),
    (4446000, 'Torrejón de la Calzada, antes de Parla'),
    (4451500, 'Parla, por el sur'),
    (4457500, 'Al salir de Parla, hacia Fuenlabrada y Getafe'),
    (4461500, 'Fuenlabrada y Getafe'),
    (4465500, 'Leganés'),
    (4469500, 'Madrid, antes de la M-40'),
]
# Para el mapa, además, una línea cada 500 m (sin nombre).
PASO = 500
CORTES += [(y, None) for y in range(4436000, 4471001, PASO)]
X_A42 = (420000, 445000)
CARRILES = [2, 2, 2, 4, 3, 3, 3]
OSM = 'https://www.openstreetmap.org/'
# Las 11 ciudades de la web, por su código INE.
IDS = {'28106': 'parla', '28065': 'getafe', '28074': 'leganes', '28058': 'fuenlabrada',
       '28092': 'mostoles', '28007': 'alcorcon', '28006': 'alcobendas', '28113': 'pinto',
       '28148': 'torrejon', '28115': 'pozuelo', '28080': 'majadahonda'}
VENTANAS = {'6_10': range(6, 10), '7_8': range(7, 8)}
NOMBRES = {'28106': 'Parla', '28058': 'Fuenlabrada', '28065': 'Getafe', '28074': 'Leganés',
           '28079': 'Madrid', '28148': 'Torrejón de Ardoz', '28149': 'Torrejón de la Calzada',
           '28150': 'Torrejón de Velasco', '28068': 'Griñón', '28073': 'Humanes', '28161': 'Valdemoro',
           '28113': 'Pinto', '28092': 'Móstoles', '28007': 'Alcorcón', '28066': 'Casarrubuelos',
           '28063': 'Cubas de la Sagra'}


def aviso(*a):
    print(*a, file=sys.stderr, flush=True)


def abre_gz(ruta):
    req = urllib.request.Request(f'{MITMA}/{ruta}', headers={'User-Agent': 'si-yo-viviera-como-en-parla'})
    return gzip.open(urllib.request.urlopen(req, timeout=900))


def tramos():
    """Los tramos de A-42 en cada corte y el centro de todos los tramos de la zona."""
    via = {}
    with open(CACHE / 'rt_tramo_val.csv', encoding='utf-8-sig') as f:
        for fila in csv.DictReader(f):
            via[fila['id_tramo']] = fila['nombre']
    r = shapefile.Reader(str(CACHE / 'Geometria_tramos.shp'))
    centro, corte = {}, collections.defaultdict(list)
    xs = collections.defaultdict(list)
    for i in range(len(r)):
        s = r.shape(i)
        b = s.bbox
        if b[2] < 400000 or b[0] > 460000 or b[3] < 4420000 or b[1] > 4480000 or len(s.points) < 2:
            continue
        tid = str(r.record(i)[0])
        centro[tid] = ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)
        if via.get(tid) != 'A-42' or b[2] < X_A42[0] or b[0] > X_A42[1]:
            continue
        g = LineString(s.points)
        for k, (y, _) in enumerate(CORTES):
            linea = LineString([(X_A42[0], y), (X_A42[1], y)])
            if b[1] <= y <= b[3] and g.intersects(linea):
                corte[tid].append(k)
                p = g.intersection(linea)
                xs[k].append(p.x if p.geom_type == 'Point' else p.centroid.x)
    por = collections.Counter(k for v in corte.values() for k in v)
    for k, (_, n) in enumerate(CORTES):
        if n:
            aviso(f'  corte {k} ({n}): {por[k]} tramos de A-42')
    # dónde cruza la autovía cada línea: el punto medio de sus calzadas
    donde = {k: sum(v) / len(v) for k, v in xs.items()}
    return dict(corte), centro, donde


def rutas_que_pisan(corte, centro):
    """{ruta: [(corte, hacia el norte)]} leyendo tramo_ruta al vuelo."""
    f = CACHE / f'a42_rutas_{FECHA}_{PASO}.json'
    if f.exists():
        return {r: [tuple(x) for x in v] for r, v in json.loads(f.read_text()).items()}
    aviso('leyendo tramo_ruta (1,5 GB)')
    out = {}

    def mira(ruta, seq):
        res = []
        for i, t in enumerate(seq):
            ks = corte.get(t)
            if not ks:
                continue
            antes = next((centro[s] for s in reversed(seq[:i]) if s in centro), None)
            despues = next((centro[s] for s in seq[i + 1:] if s in centro), None)
            if antes and despues:
                res.extend((k, despues[1] > antes[1]) for k in ks)
        if res:
            out[ruta] = res

    actual, seq = None, []
    with abre_gz(f'estudios_rutas/tramo_ruta/{FECHA}_Relaciones_tramos_rutas.csv.gz') as g:
        next(g)
        for n, linea in enumerate(g):
            r, _, t = linea.decode().rstrip('\r\n').partition(';')
            if r != actual:
                if seq:
                    mira(actual, seq)
                actual, seq = r, []
            if t:
                seq.append(t)
            if n % 20_000_000 == 0:
                aviso(f'  {n:,} líneas, {len(out):,} rutas')
    if seq:
        mira(actual, seq)
    f.write_text(json.dumps(out))
    return out


def viajes(rutas):
    """[(origen, destino, ruta, viajes al día)] de OD_rutas."""
    f = CACHE / f'a42_od_{FECHA}_{PASO}.json'
    if f.exists():
        return json.loads(f.read_text())
    aviso('leyendo OD_rutas')
    out = []
    with abre_gz(f'estudios_rutas/od_rutas/{FECHA}_OD_rutas.csv.gz') as g:
        next(g)
        for linea in g:
            c = linea.decode().rstrip('\r\n').split('|')
            if c[3] in rutas:
                out.append([c[1], c[2], c[3], float(c[5])])
    f.write_text(json.dumps(out))
    return out


def horas():
    """Fracción de cada ventana por par de municipios, por origen y en total."""
    f = CACHE / f'a42_horas_{FECHA}.json'
    if f.exists():
        return json.loads(f.read_text())
    aviso('leyendo el estudio básico')
    par = collections.defaultdict(collections.Counter)
    ori = collections.defaultdict(collections.Counter)
    tot = collections.Counter()
    with gzip.open(EB / f'{FECHA}_Viajes_municipios.csv.gz', 'rt', encoding='utf-8') as g:
        cab = next(g).rstrip('\n').split('|')
        k = {n: i for i, n in enumerate(cab)}
        for linea in g:
            c = linea.rstrip('\n').split('|')
            o, d, h, v = c[k['origen']][:5], c[k['destino']][:5], int(c[k['periodo']]), float(c[k['viajes']])
            for x in (par[f'{o}>{d}'], ori[o], tot):
                x['dia'] += v
                for w, rg in VENTANAS.items():
                    if h in rg:
                        x[w] += v
    fr = lambda x: {w: x[w] / x['dia'] for w in VENTANAS} if x['dia'] else None
    out = {'par': {p: fr(x) for p, x in par.items() if x['dia'] >= 20},
           'ori': {o: fr(x) for o, x in ori.items()}, 'tot': fr(tot)}
    f.write_text(json.dumps(out))
    return out


def grupo(zona):
    m = zona[:5]
    if m in IDS:
        return IDS[m]
    if m in NOMBRES:
        return NOMBRES[m]
    if m.startswith('45'):
        return 'Toledo (provincia)'
    if m.startswith('28'):
        return 'otros de Madrid'
    return 'resto de España'


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    corte, centro, donde = tramos()
    rutas = rutas_que_pisan(corte, centro)
    od = viajes(rutas)
    fr = horas()
    res = {k: {w: collections.Counter() for w in ('dia', *VENTANAS)} for k in range(len(CORTES))}
    for o, d, ruta, v in od:
        f = (fr['par'].get(f'{o[:5]}>{d[:5]}') or fr['ori'].get(o[:5]) or fr['tot'])
        for k, norte in set(rutas[ruta]):
            if not norte:
                continue
            for w in res[k]:
                res[k][w][grupo(o)] += v * (1 if w == 'dia' else f[w])
    out = []
    for k, (y, nombre) in enumerate(CORTES):
        fila = {'corte': nombre, 'y': y, 'x': round(donde[k]) if k in donde else None}
        for w, c in res[k].items():
            fila[w] = {'total': round(sum(c.values())), 'origen': {g: round(x) for g, x in c.most_common()}}
        out.append(fila)
        if nombre:
            aviso(f"{nombre:48} día {fila['dia']['total']:>8,}  6-10 {fila['6_10']['total']:>7,}  7-8 {fila['7_8']['total']:>6,}  "
              + ', '.join(f'{g} {x:,}' for g, x in list(fila['6_10']['origen'].items())[:5]))
    (CACHE / f'a42_{FECHA}.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    web(out)


# El mapa: la caja, las carreteras de contexto y el kilómetro 0 de la A-42
# (Plaza Elíptica), para situar los puntos kilométricos del BOE.
CAJA = (419000, 4434500, 447500, 4473500)
CONTEXTO = ['A-4', 'A-5', 'M-50', 'M-45', 'M-40', 'Calle 30', 'M-506', 'R-4', 'R-5', 'AP-41', 'M-410', 'M-407',
            'M-408', 'M-404', 'M-406']
# Los enlaces que se rotulan: la carretera que cruza y cómo se dice.
ENLACES = {'M-40': 'M-40', 'M-45': 'M-45', 'M-406': 'M-406, Getafe y Leganés', 'M-50': 'M-50',
           'M-506': 'M-506, Fuenlabrada', 'M-410': 'M-410, hospital de Parla', 'M-404': 'M-404, Torrejón de la Calzada'}
# Y los que no se pueden sacar de un cruce, con su punto kilométrico del BOE.
ENLACES_BOE = [(19, 'Parla Norte'), (23, 'Parla Sur')]
# Capacidad: 2.350 vehículos por carril y hora, la del manual de capacidad
# (HCM) que usa para este tramo el estudio de tráfico de la Comunidad (4.700
# por dos carriles). Personas por vehículo: 1,65, lo que sale de comparar en
# el kilómetro 23,9 el aforo del Ministerio (36.200 vehículos al día hacia
# Madrid en 2023) con este estudio (unas 60.000 personas).
CAPACIDAD = 2350
PERSONAS = 1.65
OSM_A42 = CACHE / 'osm_a42.json'
OVERPASS = 'https://overpass-api.de/api/interpreter'


def vias_osm():
    """Las vías de la A-42 de OpenStreetMap, con sus etiquetas y su trazado."""
    if not OSM_A42.exists():
        import time
        import urllib.parse
        import sys as _s
        _s.path.insert(0, str(AQUI.parent / 'transporte'))
        import carriles
        la0, lo0 = carriles.geograficas(X_A42[0], 4436000)
        la1, lo1 = carriles.geograficas(X_A42[1], 4471000)
        q = (f'[out:json][timeout:120];way["highway"~"^(motorway|trunk)$"]["ref"~"A-42"]'
             f'({la0},{lo0},{la1},{lo1});out tags geom;')
        for intento in range(6):
            try:
                req = urllib.request.Request(OVERPASS, data=urllib.parse.urlencode({'data': q}).encode(),
                                             headers={'User-Agent': 'si-yo-viviera-como-en-parla/1.0'})
                with urllib.request.urlopen(req, timeout=200) as r:
                    OSM_A42.write_bytes(r.read())
                break
            except OSError as e:
                aviso('  Overpass:', e)
                time.sleep(20 * (intento + 1))
    return json.loads(OSM_A42.read_text())
PK0 = (40.3855, -3.7180)
# Enlaces con su punto kilométrico según el BOE, para cuadrar los kilómetros
# medidos por el eje (que empieza más al sur que el kilómetro 0 real).
PK_BOE = {'M-45': 10, 'M-506': 17}
# Retenciones de 7 a 9 en día laborable, sentido Madrid (BOE-A-2023-2208).
RETENCIONES = [(17, 23, 'M-506 a Parla Sur'), (10, 14, 'M-45 a Getafe (M-406)')]
WFS_MUNICIPIOS = AQUI.parent / '.cache' / 'transporte' / 'municipios-45000.xml'
ROTULOS = {'28106': 'Parla', '28065': 'Getafe', '28074': 'Leganés', '28058': 'Fuenlabrada', '28079': 'Madrid',
           '45081': 'Illescas', '28149': 'Torrejón de la Calzada', '28150': 'Torrejón de Velasco',
           '28113': 'Pinto', '28073': 'Humanes', '28068': 'Griñón', '28092': 'Móstoles', '28007': 'Alcorcón',
           '45199': 'Yeles', '28066': 'Casarrubuelos', '28063': 'Cubas de la Sagra', '45161': 'Seseña'}


def rel(x, y, c):
    return [round(x - c[0]), round(y - c[1])]


def municipios(centro):
    """Los términos del IGN que tocan la caja, simplificados a 80 m."""
    import re
    from shapely.geometry import Polygon, box
    from shapely.ops import unary_union
    t = WFS_MUNICIPIOS.read_text(encoding='utf-8')
    marco = box(*CAJA)
    out = []
    for m in re.finditer(r'<wfs:member>(.*?)</wfs:member>', t, re.S):
        b = m.group(1)
        nivel = re.search(r'<au:nationalLevel[^>]*href="[^"]*/(\w+)"', b)
        if not nivel or nivel.group(1) != '4thOrder':
            continue
        cod = re.search(r'gml:id="AU_ADMINISTRATIVEUNIT_(\d+)"', b).group(1)[-5:]
        polys = []
        for pm in re.findall(r'<gml:Polygon.*?</gml:Polygon>', b, re.S):
            rr = [list(map(float, q.split())) for q in re.findall(r'<gml:posList[^>]*>(.*?)</gml:posList>', pm, re.S)]
            rr = [list(zip(a[0::2], a[1::2])) for a in rr]
            polys.append(Polygon(rr[0], rr[1:]))
        g = unary_union(polys)
        if not g.intersects(marco):
            continue
        rp = g.intersection(marco).representative_point()
        g = g.simplify(80)
        anillos = []
        for pg in getattr(g, 'geoms', [g]):
            anillos.append([rel(x, y, centro) for x, y in pg.exterior.coords])
        ign = re.search(r'<gn:text>([^<]+)</gn:text>', b)
        out.append({'ine': cod, 'id': IDS.get(cod), 'nombre': ROTULOS.get(cod), 'anillos': anillos,
                    'r': rel(rp.x, rp.y, centro), 'ign': ign.group(1).strip() if ign else ''})
    return out


def contexto(centro):
    """Las carreteras principales de la red del Ministerio, fundidas por
    nombre y simplificadas a 40 m."""
    from shapely.geometry import box
    from shapely.ops import linemerge, unary_union
    via = {}
    with open(CACHE / 'rt_tramo_val.csv', encoding='utf-8-sig') as f:
        for fila in csv.DictReader(f):
            if fila['nombre'] in CONTEXTO or fila['nombre'] == 'A-42':
                via[fila['id_tramo']] = fila['nombre']
    r = shapefile.Reader(str(CACHE / 'Geometria_tramos.shp'))
    marco = box(*CAJA).buffer(2000)
    trozos = collections.defaultdict(list)
    for i in range(len(r)):
        tid = str(r.record(i)[0])
        if tid not in via:
            continue
        s = r.shape(i)
        b = s.bbox
        if b[2] < CAJA[0] - 2000 or b[0] > CAJA[2] + 2000 or b[3] < CAJA[1] - 2000 or b[1] > CAJA[3] + 2000:
            continue
        trozos[via[tid]].append(LineString(s.points))
    out = []
    for n, ls in trozos.items():
        g = linemerge(unary_union(ls)).intersection(marco).simplify(40)
        for l in getattr(g, 'geoms', [g]):
            if l.geom_type == 'LineString' and l.length > 300:
                out.append({'n': n, 'c': [rel(x, y, centro) for x, y in l.coords]})
    return out


def web(out):
    """datos/a42.js: los siete puntos con nombre (gente de 7 a 8 hacia Madrid
    por origen y carriles), el perfil cada PASO metros para el mapa, y el
    fondo: términos, carreteras y los tramos con retenciones."""
    import math

    def reparto(fila):
        o = fila['7_8']['origen']
        de = {k: v for k, v in o.items() if k in IDS.values()}
        de['toledo'] = o.get('Toledo (provincia)', 0)
        de['resto'] = fila['7_8']['total'] - sum(de.values())
        return de

    nombrados = [f for f in out if f['corte']]
    densos = sorted([f for f in out if not f['corte'] and f['x'] is not None], key=lambda f: f['y'])
    centro = ((CAJA[0] + CAJA[2]) // 2, (CAJA[1] + CAJA[3]) // 2)
    cortes = [{'nombre': f['corte'], 'carriles': n, 'total': f['7_8']['total'], 'dia': f['dia']['total'],
               'de': reparto(f), 'p': rel(f['x'], f['y'], centro)} for f, n in zip(nombrados, CARRILES)]
    # El eje: los puntos de cruce, suavizados con sus vecinos (las dos
    # calzadas y los ramales bailan unos metros).
    xs = [f['x'] for f in densos]
    lisa = [sum(xs[max(0, i - 1):i + 2]) / len(xs[max(0, i - 1):i + 2]) for i in range(len(xs))]
    # La carga, con la mediana de cada punto y sus dos vecinos: donde la línea
    # corta también un ramal o una vía colectora con el nombre A-42, un punto
    # suelto sale de más o de menos.
    def mediana(i):
        v = sorted(densos[max(0, i - 1):i + 2], key=lambda f: f['7_8']['total'])
        return v[len(v) // 2]
    perfil = [{'p': rel(x, f['y'], centro), 'total': mediana(i)['7_8']['total'], 'de': reparto(mediana(i))}
              for i, (x, f) in enumerate(zip(lisa, densos))]
    # Carriles hacia Madrid de OpenStreetMap en cada punto; se queda el más
    # repetido en 2,5 km (el punto y dos a cada lado), para que un carril de
    # incorporación o de salida no cuente como uno más de la autovía.
    import sys as _s
    _s.path.insert(0, str(AQUI.parent / 'transporte'))
    import tiempos as T
    osm = []
    for w in vias_osm()["elements"]:
        q = [T.utm30(g['lat'], g['lon']) for g in w['geometry']]
        if len(q) > 1 and q[-1][1] > q[0][1] and w['tags'].get('lanes', '').isdigit():
            osm.append((LineString(q), int(w['tags']['lanes'])))
    crudo = []
    for f in densos:
        linea = LineString([(X_A42[0], f['y']), (X_A42[1], f['y'])])
        n = [c for g, c in osm if g.intersects(linea)]
        crudo.append(max(n) if n else None)
    for i, f in enumerate(perfil):
        v = collections.Counter(x for x in crudo[max(0, i - 2):i + 3] if x).most_common()
        top = v[0][1]
        f['carriles'] = min(x for x, n in v if n == top)
    # El término por el que pasa cada punto.
    from shapely.geometry import Point, Polygon
    terminos = municipios(centro)
    for f in perfil:
        pt = Point(*f['p'])
        for m in terminos:
            if any(Polygon(a).contains(pt) for a in m['anillos']):
                f['ine'] = m['ine']
                break
    # Desde que entra en la Comunidad de Madrid.
    primero = next(i for i, f in enumerate(perfil) if f.get('ine', '').startswith('28'))
    perfil = perfil[primero:]
    lisa, densos = lisa[primero:], densos[primero:]
    # Punto kilométrico de cada punto del perfil: distancia por el eje desde
    # el kilómetro 0, en Plaza Elíptica, contando hacia el sur.
    x0, y0 = T.utm30(*PK0)
    pts = [(lisa[i], densos[i]['y']) for i in range(len(densos))][::-1]
    pk = [math.hypot(pts[0][0] - x0, pts[0][1] - y0)]
    for a, b in zip(pts, pts[1:]):
        pk.append(pk[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    pk = [round(v / 1000, 1) for v in pk][::-1]
    vias = contexto(centro)
    desfase = []
    for n, real in PK_BOE.items():
        cerca = min((math.hypot(q[0] - f['p'][0], q[1] - f['p'][1]), k)
                    for v in vias if v['n'] == n for q in v['c'] for f, k in zip(perfil, pk))
        desfase.append(real - cerca[1])
    desfase = sum(desfase) / len(desfase)
    print(f'kilómetros: {desfase:+.1f} km para cuadrar con el BOE', file=sys.stderr)
    for f, k in zip(perfil, pk):
        f['pk'] = round(k + desfase, 1)
    enlaces = []
    for n, rotulo in ENLACES.items():
        cerca = [(math.hypot(q[0] - f['p'][0], q[1] - f['p'][1]), f['pk']) for v in vias if v['n'] == n
                 for q in v['c'] for f in perfil]
        if cerca and min(cerca)[0] < 400:
            enlaces.append({'pk': min(cerca)[1], 'n': rotulo})
    enlaces += [{'pk': k, 'n': r} for k, r in ENLACES_BOE]
    enlaces.sort(key=lambda e: e['pk'])
    # Los tramos entre salidas (las que distan menos de un kilómetro, juntas):
    # la gente, la mediana de sus puntos; los carriles, los que más se
    # repiten; el reparto por origen, la media de las proporciones.
    import statistics
    limites = []
    for e in enlaces:
        if limites and e['pk'] - limites[-1]['pk'] < 1:
            limites[-1]['n'] += ' · ' + e['n']
        else:
            limites.append(dict(e))
    bordes = [min(f['pk'] for f in perfil) - 0.25] + [e['pk'] for e in limites] + [max(f['pk'] for f in perfil) + 0.25]
    nombres_b = ['Madrid'] + [e['n'] for e in limites] + ['Toledo']
    tramos = []
    for (a, b), (na, nb) in zip(zip(bordes, bordes[1:]), zip(nombres_b, nombres_b[1:])):
        pts = [f for f in perfil if a <= f['pk'] < b]
        if not pts:
            continue
        total = statistics.median(f['total'] for f in pts)
        cuota = collections.Counter()
        for f in pts:
            for k, v in f['de'].items():
                cuota[k] += v / f['total'] / len(pts)
        carr = collections.Counter(f['carriles'] for f in pts).most_common()
        tramos.append({'de': a, 'a': b, 'norte': na, 'sur': nb, 'total': round(total),
                       'carriles': min(x for x, n in carr if n == carr[0][1]),
                       'de_': {k: round(v * total) for k, v in cuota.items()},
                       'ine': collections.Counter(f.get('ine') for f in pts).most_common(1)[0][0]})
    d = {'fecha': FECHA, 'ventana': ['07:00', '08:00'], 'paso': PASO, 'cortes': cortes, 'perfil': perfil,
         'caja': [rel(CAJA[0], CAJA[1], centro), rel(CAJA[2], CAJA[3], centro)],
         'municipios': terminos, 'vias': vias,
         'retenciones': [{'de': a, 'a': b, 'que': q} for a, b, q in RETENCIONES],
         'enlaces': limites, 'tramos': [dict(t, de_origen=t.pop('de_')) for t in tramos], 'capacidad': CAPACIDAD, 'personas': PERSONAS,
         'nombres': {m['ine']: m['nombre'] or m['ign'] for m in terminos if m['ine'] in {f.get('ine') for f in perfil}},
         'fuentes': {'rutas': f'{MITMA}/', 'osm': OSM,
                     'boe': 'https://www.boe.es/boe/dias/2023/01/27/pdfs/BOE-A-2023-2208.pdf'}}
    (AQUI.parent.parent / 'datos/a42.js').write_text(
        '/* GENERADO por herramientas/accesos/a42.py. No se edita a mano.\n'
        '   Viajeros que van por la A-42 hacia Madrid de 7 a 8 de la mañana de un\n'
        '   día laborable (16-10-2024), por origen: en siete puntos con nombre y\n'
        '   cada 500 m para el mapa. Coordenadas en metros (EPSG:25830) desde el\n'
        '   centro de la caja. Fuentes: Ministerio de Transportes, rutas por\n'
        '   carretera y estudio básico de movilidad; términos, IGN; carriles,\n'
        '   OpenStreetMap; retenciones, BOE-A-2023-2208. */\n'
        'window.A42 = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('datos/a42.js:', len(perfil), 'puntos,', len(d['municipios']), 'términos,', len(d['vias']), 'vías',
          file=sys.stderr)


if __name__ == '__main__':
    if '--web' in sys.argv:
        web(json.loads((CACHE / f'a42_{FECHA}.json').read_text(encoding='utf-8')))
    else:
        main()

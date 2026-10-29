#!/usr/bin/env python3
"""Escribe herramientas/transporte/fuentes/capacidad.json: las plazas de
transporte público que salen de cada ciudad hacia Madrid capital en hora
punta, por línea, y cuánta gente va a Madrid a esa hora.

  - Horarios: GTFS del Consorcio (los mismos que tiempos.py), martes
    27-10-2026, salidas de 7:00 a 9:00; las cifras son por hora (la mitad).
  - Un viaje cuenta para una ciudad si recoge viajeros en una parada de su
    término dentro de la ventana y, más adelante, deja viajeros en una parada
    del término de Madrid. Cuenta una vez aunque pare en varias paradas de la
    ciudad. Un tren de la C-4 que sale de Parla y para en Getafe cuenta en
    las dos: es la oferta que pasa por cada ciudad, no la que le queda libre.
  - Plazas por vehículo: PLAZAS (abajo, con su fuente).
  - Términos: datos/mapa/<id>.js para las 11; Madrid, del WFS del IGN que ya
    bajó isocronas.py (herramientas/.cache/transporte/municipios-45000.xml).
  - La gente que va a Madrid: estudio básico por municipios del Ministerio
    de Transportes (16-10-2024), viajes de cada ciudad a Madrid con salida
    entre las 7 y las 9, en cualquier medio y por cualquier motivo. El
    fichero lo deja en la caché el propio script.

Uso:
    python3 herramientas/transporte/capacidad.py

Necesita shapely. Método y cautelas en fuentes/capacidad.md.
"""
import collections
import datetime as dt
import gzip
import json
import re
import sys
import urllib.request
from pathlib import Path

from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
from shapely.prepared import prep

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tiempos as T  # noqa: E402
from cobertura import IDS  # noqa: E402

AQUI = Path(__file__).resolve().parent
CACHE = T.RAIZ / 'herramientas/.cache/transporte'
FECHA = dt.date(2026, 10, 27)
T0, T1 = 7 * 3600, 9 * 3600
FEEDS = ['cercanias', 'metro', 'ligero', 'interurbanos', 'urbanos']
MITMA = 'https://movilidad-opendata.mitma.es/estudios_basicos/por-municipios/viajes/ficheros-diarios'
DIA = '20241016'
INE = {'28106': 'parla', '28065': 'getafe', '28074': 'leganes', '28058': 'fuenlabrada',
       '28092': 'mostoles', '28007': 'alcorcon', '28006': 'alcobendas', '28113': 'pinto',
       '28148': 'torrejon', '28115': 'pozuelo', '28080': 'majadahonda'}

# Plazas por vehículo (sentadas y de pie). El GTFS no dice si un tren va
# simple o doble: se cuenta simple.
PLAZAS = {
    'cercanias': (997, 'Renfe, Civia de cinco coches (serie 465): 277 sentadas y 720 de pie',
                  'https://www.renfe.com/es/es/cercanias/cercanias-madrid/rodajes/unidad-465'),
    'metro10a': (1260, 'Metro de Madrid, serie 7000 de seis coches (línea 10, tramo A)',
                 'https://en.wikipedia.org/wiki/Line_10_(Madrid_Metro)'),
    'metro10b': (630, 'serie 9000 de tres coches (línea 10, tramo B): la mitad que la de seis',
                 'https://en.wikipedia.org/wiki/Line_10_(Madrid_Metro)'),
    'metro11': (840, 'serie 8000 de cuatro coches (línea 11), a 210 plazas por coche como la serie 7000',
                'https://en.wikipedia.org/wiki/Line_11_(Madrid_Metro)'),
    'ligero': (200, 'Metro Ligero, tranvía de unos 30 m', None),
    'bus': (80, 'autobús interurbano de 12 m', None),
}


def plazas(feed, linea, ciudad):
    if feed == 'cercanias':
        return PLAZAS['cercanias'][0]
    if feed == 'metro':
        if linea == '10':
            return PLAZAS['metro10b' if ciudad == 'alcobendas' else 'metro10a'][0]
        return PLAZAS['metro11'][0]
    if feed == 'ligero':
        return PLAZAS['ligero'][0]
    return PLAZAS['bus'][0]


def nombre_linea(feed, linea):
    """C4a, C4b y C4 son la misma línea: C-4. Los autobuses, juntos."""
    if feed == 'cercanias':
        return 'C-' + re.match(r'C(\d+)', linea).group(1)
    if feed == 'metro':
        return 'Metro ' + linea
    if feed == 'ligero':
        return 'Metro Ligero ' + linea.replace('ML', '')
    return 'autobús'


def madrid():
    t = (CACHE / 'municipios-45000.xml').read_text(encoding='utf-8')
    for m in re.finditer(r'<wfs:member>(.*?)</wfs:member>', t, re.S):
        b = m.group(1)
        if 'gml:id="AU_ADMINISTRATIVEUNIT_34132828079"' not in b:
            continue
        polys = []
        for pm in re.findall(r'<gml:Polygon.*?</gml:Polygon>', b, re.S):
            rr = [list(map(float, p.split())) for p in re.findall(r'<gml:posList[^>]*>(.*?)</gml:posList>', pm, re.S)]
            rr = [list(zip(a[0::2], a[1::2])) for a in rr]
            polys.append(Polygon(rr[0], rr[1:]))
        return unary_union(polys)
    sys.exit('no encuentro Madrid en el WFS')


def termino(cid):
    m = T.leer_mapa(cid)
    cx, cy = m['centro']
    an = [[(cx + p[0], cy + p[1]) for p in r] for r in m['limite']]
    return unary_union([Polygon(r) for r in an]).buffer(0)


def oferta():
    """{ciudad: {(feed, línea): viajes de 7 a 9}}"""
    zonas = {c: prep(termino(c)) for c in IDS}
    mad = prep(madrid())
    out = {c: collections.Counter() for c in IDS}
    for feed in FEEDS:
        d = T.GTFS_DIR / feed
        donde = {}
        for r in T.leer_csv(d / 'stops.txt'):
            if r.get('location_type', '0') not in ('', '0'):
                continue
            p = Point(*T.utm30(float(r['stop_lat']), float(r['stop_lon'])))
            z = 'madrid' if mad.contains(p) else next((c for c in IDS if zonas[c].contains(p)), None)
            if z:
                donde[r['stop_id']] = z
        av = []
        act = T.servicios_activos(d, FECHA, av)
        for a in av:
            print('  aviso:', a, file=sys.stderr)
        ruta = {r['route_id']: r.get('route_short_name') or r['route_id'] for r in T.leer_csv(d / 'routes.txt')}
        viajes = {r['trip_id']: ruta.get(r['route_id'], r['route_id'])
                  for r in T.leer_csv(d / 'trips.txt') if r['service_id'] in act}
        frec = collections.defaultdict(list)
        if (d / 'frequencies.txt').exists():
            for r in T.leer_csv(d / 'frequencies.txt'):
                if r['trip_id'] in viajes:
                    frec[r['trip_id']].append((T.hms(r['start_time']), T.hms(r['end_time']), int(r['headway_secs'])))
        st = collections.defaultdict(list)
        for r in T.leer_csv(d / 'stop_times.txt'):
            if r['trip_id'] in viajes:
                st[r['trip_id']].append((int(r['stop_sequence']), T.hms(r['departure_time']), r['stop_id'],
                                         (r.get('pickup_type') or '0') != '1', (r.get('drop_off_type') or '0') != '1'))
        for tid, s in st.items():
            s.sort()
            desfases = [0]
            if tid in frec:
                base = s[0][1]
                desfases = [k - base for a, b, h in frec[tid] for k in range(a, b, h)]
            for df in desfases:
                ya = set()
                for i, (_, t, sid, sube, _) in enumerate(s):
                    c = donde.get(sid)
                    if c in (None, 'madrid') or c in ya or not sube or not (T0 <= t + df < T1):
                        continue
                    if any(donde.get(s2) == 'madrid' and baja for _, _, s2, _, baja in s[i + 1:]):
                        ya.add(c)
                        out[c][(feed, viajes[tid])] += 1
        print(feed, {c: sum(v for (f, _), v in out[c].items() if f == feed) for c in IDS}, file=sys.stderr)
    return out


def demanda():
    """Viajes de cada ciudad a Madrid con salida de 7 a 9 (estudio básico)."""
    f = CACHE / f'{DIA}_Viajes_municipios.csv.gz'
    url = f'{MITMA}/{DIA[:4]}-{DIA[4:6]}/{DIA}_Viajes_municipios.csv.gz'
    if not f.exists():
        print('bajando', url, file=sys.stderr)
        urllib.request.urlretrieve(url, f)
    out = collections.Counter()
    with gzip.open(f, 'rt', encoding='utf-8') as g:
        cab = next(g).rstrip('\n').split('|')
        k = {n: i for i, n in enumerate(cab)}
        for linea in g:
            c = linea.rstrip('\n').split('|')
            if c[k['origen']] in INE and c[k['destino']] == '28079' and c[k['periodo']] in ('07', '08'):
                out[INE[c[k['origen']]]] += float(c[k['viajes']])
    return out, url


def main():
    of = oferta()
    dem, url = demanda()
    res = {'_meta': {
        'fecha': FECHA.isoformat(), 'ventana': ['07:00', '09:00'],
        'plazas': {k: {'plazas': v[0], 'que': v[1], 'fuente': v[2]} for k, v in PLAZAS.items()},
        'demanda': {'fecha': DIA, 'fuente': url}}}
    for c in IDS:
        lineas = collections.defaultdict(lambda: [0.0, 0.0])
        for (feed, l), n in of[c].items():
            k = nombre_linea(feed, l)
            lineas[k][0] += n / 2
            lineas[k][1] += n / 2 * plazas(feed, l, c)
        res[c] = {'lineas': {k: {'vehiculos': round(v[0], 1), 'plazas': round(v[1])}
                             for k, v in sorted(lineas.items(), key=lambda kv: -kv[1][1])},
                  'vanMadrid': round(dem[c] / 2)}
        print(c, res[c], file=sys.stderr)
    (AQUI / 'fuentes/capacidad.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Escribe herramientas/transporte/fuentes/cobertura.json: de cada 100
viviendas de cada ciudad, cuántas tienen una estación de Cercanías o de
Metro a 10 minutos andando.

  - Viviendas: los edificios del Catastro (INSPIRE Buildings, un fichero por
    municipio) con su número de viviendas (numberOfDwellings); cada edificio
    cuenta en el centro de su planta.
  - Estaciones: las paradas de Cercanías, de Metro y de las líneas de Metro
    Ligero que salen de su municipio y enlazan con la red (ML1, ML2, ML3),
    de los GTFS del Consorcio y de cualquier municipio (un edificio de Parla
    junto a una estación de Pinto cuenta). El tranvía de Parla (ML4) no: es
    un anillo que no sale de la ciudad (ver el README).
  - 10 minutos andando: 750 m a 4,5 km/h, en línea recta × 1,3, el mismo
    criterio del mapa de tiempos; es decir, 577 m en línea recta. Se da
    también a 5 y a 15 minutos.

Uso:
    python3 herramientas/transporte/cobertura.py [--ciudades parla getafe …]

Los ficheros del Catastro van a /var/tmp/catastro-bu/.
"""
import argparse
import io
import json
import math
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tiempos as T  # noqa: E402

IDS = ['parla', 'getafe', 'leganes', 'fuenlabrada', 'mostoles', 'alcorcon',
       'alcobendas', 'pinto', 'torrejon', 'pozuelo', 'majadahonda']
ATOM = 'https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/28/ES.SDGC.BU.atom_28.xml'
CACHE = Path('/var/tmp/catastro-bu')
MINUTOS = [5, 10, 15]
CUBO = 250


def edificios(ine):
    """[(x, y, viviendas)] de los edificios con alguna vivienda."""
    d = CACHE / ine
    if not d.exists():
        with urllib.request.urlopen(ATOM, timeout=120) as r:
            atom = r.read().decode('latin-1')
        url = re.search(r'(https[^"<]*/%s-[^"<]*\.zip)' % ine, atom).group(1)
        url = urllib.parse.quote(url, safe=':/')   # «TORREJON DE ARDOZ» lleva espacios
        print('bajando', url, file=sys.stderr)
        with urllib.request.urlopen(url, timeout=900) as r:
            z = zipfile.ZipFile(io.BytesIO(r.read()))
        d.mkdir(parents=True, exist_ok=True)
        for n in z.namelist():
            if n.endswith('.building.gml') or n.endswith('.xml'):
                z.extract(n, d)
    t = next(d.glob('*.building.gml')).read_text(encoding='latin-1')
    out = []
    for m in re.finditer(r'<bu-ext2d:Building .*?</bu-ext2d:Building>', t, re.S):
        b = m.group(0)
        n = re.search(r'<bu-ext2d:numberOfDwellings>(\d+)<', b)
        if not n or int(n.group(1)) == 0:
            continue
        pos = re.search(r'<gml:posList[^>]*>(.*?)</gml:posList>', b, re.S)
        if not pos:
            continue
        v = list(map(float, pos.group(1).split()))
        xs, ys = v[0::2], v[1::2]
        out.append((sum(xs) / len(xs), sum(ys) / len(ys), int(n.group(1))))
    return out


LIGERO_SI = {'ML1', 'ML2', 'ML3'}


def estaciones():
    """Paradas de Cercanías, de Metro y del Metro Ligero que sale de su
    municipio, en cubos de 250 m."""
    d = T.GTFS_DIR / 'ligero'
    rutas = {r['route_id']: r['route_short_name'] for r in T.leer_csv(d / 'routes.txt')}
    viaje = {r['trip_id']: rutas[r['route_id']] for r in T.leer_csv(d / 'trips.txt')}
    ligero = {r['stop_id'] for r in T.leer_csv(d / 'stop_times.txt') if viaje.get(r['trip_id']) in LIGERO_SI}
    cubos = {}
    for feed in ('cercanias', 'metro', 'ligero'):
        for r in T.leer_csv(T.GTFS_DIR / feed / 'stops.txt'):
            if (r.get('location_type') or '0') not in ('', '0'):
                continue
            if feed == 'ligero' and r['stop_id'] not in ligero:
                continue
            x, y = T.utm30(float(r['stop_lat']), float(r['stop_lon']))
            cubos.setdefault((int(x // CUBO), int(y // CUBO)), []).append((x, y))
    return cubos


def minutos_a_estacion(x, y, cubos, tope):
    """Minutos andando a la estación más cercana (None si pasa del tope)."""
    radio = tope * 60 * T.ANDAR_V / T.ANDAR_FACTOR
    k = math.ceil(radio / CUBO)
    cx, cy = int(x // CUBO), int(y // CUBO)
    mejor = None
    for i in range(-k, k + 1):
        for j in range(-k, k + 1):
            for sx, sy in cubos.get((cx + i, cy + j), ()):
                d = math.hypot(x - sx, y - sy)
                if d <= radio and (mejor is None or d < mejor):
                    mejor = d
    return None if mejor is None else mejor * T.ANDAR_FACTOR / T.ANDAR_V / 60


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ciudades', nargs='+', default=IDS)
    a = ap.parse_args()
    f = Path(__file__).resolve().parent / 'fuentes/cobertura.json'
    out = json.loads(f.read_text()) if f.exists() else {}
    out['_meta'] = {
        'fuentes': {'catastro': 'https://www.catastro.hacienda.gob.es/webinspire/index.html',
                    'atom': ATOM, 'gtfs': 'https://datos.crtm.es/'},
        'notas': ['Viviendas: numberOfDwellings de los edificios del Catastro (INSPIRE Buildings), '
                  'contadas en el centro de su planta.',
                  'Estaciones: paradas de Cercanías, Metro y Metro Ligero ML1, ML2 y ML3 de los GTFS del '
                  'Consorcio, de cualquier municipio. Sin el tranvía de Parla (ML4), que no sale de la ciudad.',
                  'Andando: línea recta × 1,3 a 4,5 km/h; 10 minutos = 750 m andando = 577 m en línea recta.']}
    cubos = estaciones()
    for c in a.ciudades:
        ine = T.leer_mapa(c)['codigo']
        ed = edificios(ine)
        total = sum(n for _, _, n in ed)
        cerca = {m: 0 for m in MINUTOS}
        for x, y, n in ed:
            t = minutos_a_estacion(x, y, cubos, MINUTOS[-1])
            for m in MINUTOS:
                if t is not None and t <= m:
                    cerca[m] += n
        out[c] = {'viviendas': total, 'edificios': len(ed),
                  'cerca': {str(m): cerca[m] for m in MINUTOS},
                  'pct': {str(m): round(cerca[m] / total * 100, 1) for m in MINUTOS}}
        print(c, total, out[c]['pct'], file=sys.stderr)
        f.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

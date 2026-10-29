"""La línea principal de cada ciudad y sus viajes, para «Si falla la C-4».

La línea principal es la de tren, Metro o Metro Ligero que más plazas lleva
hacia Madrid de 7 a 9 (fuentes/capacidad.json, de capacidad.py). En Parla y
en Getafe, la C-4. Lo usan sin_cercanias.py (los tiempos sin ella) y
cobertura.py (las estaciones a mano sin ella).
"""
import json
import re
from pathlib import Path

import tiempos as T

AQUI = Path(__file__).resolve().parent


def principales():
    """{ciudad: nombre de la línea}, p. ej. {'parla': 'C-4', 'alcorcon': 'Metro 10'}."""
    d = json.loads((AQUI / 'fuentes/capacidad.json').read_text(encoding='utf-8'))
    out = {}
    for c, v in d.items():
        if c == '_meta':
            continue
        tren = [(k, x['plazas']) for k, x in v['lineas'].items() if k != 'autobús']
        out[c] = max(tren, key=lambda r: r[1])[0]
    return out


def feed_y_rutas(linea):
    """El feed del GTFS y la condición sobre route_short_name de una línea
    con el nombre de capacidad.py («C-4» son C4, C4a y C4b)."""
    if linea.startswith('C-'):
        n = linea[2:]
        return 'cercanias', lambda r: re.fullmatch(r'C%s[a-z]?' % n, r) is not None
    if linea.startswith('Metro Ligero '):
        n = linea.split()[-1]
        return 'ligero', lambda r: r == 'ML' + n
    if linea.startswith('Metro '):
        n = linea.split()[-1]
        return 'metro', lambda r: r == n
    raise ValueError(linea)


def viajes(linea):
    """(feed, ids de los viajes de esa línea)."""
    feed, es = feed_y_rutas(linea)
    d = T.GTFS_DIR / feed
    rutas = {r['route_id'] for r in T.leer_csv(d / 'routes.txt') if es(r['route_short_name'])}
    return feed, {r['trip_id'] for r in T.leer_csv(d / 'trips.txt') if r['route_id'] in rutas}


def paradas_solo_de(linea):
    """(feed, paradas en las que solo para esa línea): sin ella, dejan de ser
    estación."""
    feed, es = feed_y_rutas(linea)
    d = T.GTFS_DIR / feed
    ruta = {r['route_id']: r['route_short_name'] for r in T.leer_csv(d / 'routes.txt')}
    viaje = {r['trip_id']: ruta[r['route_id']] for r in T.leer_csv(d / 'trips.txt')}
    suya, otras = set(), set()
    for r in T.leer_csv(d / 'stop_times.txt'):
        n = viaje.get(r['trip_id'])
        if n is None:
            continue
        (suya if es(n) else otras).add(r['stop_id'])
    return feed, suya - otras

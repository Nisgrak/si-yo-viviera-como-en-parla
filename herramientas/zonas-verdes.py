#!/usr/bin/env python3
"""Zonas verdes y deportivas por habitante, para datos/datos.js.

No hay ninguna estadística oficial de zonas verdes por municipio en la
Comunidad de Madrid, así que este dato lo calculamos nosotros y aquí queda el
cómo, para que cualquiera pueda rehacerlo o discutirlo.

Qué se hace:
  1. Los límites municipales, del WFS INSPIRE del IGN (unidades
     administrativas), que es cartografía oficial.
  2. Las superficies, del Urban Atlas 2018 de Copernicus (servicio del portal
     Discomap de la EEA, capa «Land Use vector»), recortando los polígonos
     contra el límite de cada municipio.
  3. Se cuentan dos clases:
       14100  zonas verdes urbanas
       14200  instalaciones deportivas y de ocio   ← el «y de ocio» es del
              Urban Atlas, no nuestro
     y se devuelven los metros cuadrados de cada una por municipio.

Lo que NO se hace, y conviene tenerlo presente:
  · No se decide a mano qué parque cuenta: quien marca los polígonos es el
    Urban Atlas, con su guía de cartografiado y una unidad mínima de 0,25 ha.
  · No se distingue público de privado. Un club privado con césped cuenta
    igual que un parque municipal.
  · Es de 2018, la última edición publicada. La edición de 2012 da cifras
    bastante más bajas, así que el número no vale para comparar años.

Uso:
    python3 -m venv .venv && .venv/bin/pip install requests shapely pyproj
    .venv/bin/python herramientas/zonas-verdes.py

Sin argumentos: imprime el bloque listo para pegar en datos/datos.js. Los
recortes se guardan en herramientas/.cache para no volver a bajarlos.
"""

import json
import os
import re
import sys
import time

try:
    import requests
    from pyproj import Transformer
    from shapely.geometry import MultiPolygon, Polygon, mapping, shape
    from shapely.validation import make_valid
except ImportError as e:  # pragma: no cover
    sys.exit(f'Falta una dependencia ({e.name}). Mira el encabezado de este fichero.')

WFS = 'https://www.ign.es/wfs-inspire/unidades-administrativas'
URBAN_ATLAS = ('https://image.discomap.eea.europa.eu/arcgis/rest/services/'
               'UrbanAtlas/UA_UrbanAtlas_2018/MapServer/2/query')
CLASES = {'14100': 'verde', '14200': 'deporte'}
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache')
TRANSFORMADOR = Transformer.from_crs(4326, 25830, always_xy=True)

# Un punto dentro de cada municipio, para pedirle al IGN el término que lo
# contiene. El identificador de datos/datos.js va primero.
MUNICIPIOS = {
    'getafe':      ('Getafe',      40.3082, -3.7320),
    'parla':       ('Parla',       40.2365, -3.7714),
    'pinto':       ('Pinto',       40.2453, -3.6997),
    'fuenlabrada': ('Fuenlabrada', 40.2842, -3.7942),
    'leganes':     ('Leganés',     40.3350, -3.7635),
    'alcorcon':    ('Alcorcón',    40.3459, -3.8249),
    'alcobendas':  ('Alcobendas',  40.5405, -3.6416),
    'mostoles':    ('Móstoles',    40.3223, -3.8649),
}


def anillo(texto):
    numeros = [float(v) for v in texto.split()]
    return [(numeros[i], numeros[i + 1]) for i in range(0, len(numeros) - 1, 2)]


def poligonos_de(bloque):
    """Cada <gml:Polygon> del MultiSurface, con su exterior y sus huecos."""
    fuera = []
    for pol in re.finditer(r'<gml:Polygon\b.*?</gml:Polygon>', bloque, re.S):
        p = pol.group(0)
        ext = re.search(r'<gml:exterior>\s*<gml:LinearRing>\s*<gml:posList>([^<]+)</gml:posList>', p)
        if not ext:
            continue
        huecos = [anillo(m.group(1)) for m in
                  re.finditer(r'<gml:interior>\s*<gml:LinearRing>\s*'
                              r'<gml:posList>([^<]+)</gml:posList>', p)]
        fuera.append(Polygon(anillo(ext.group(1)), huecos))
    return fuera


def limite_municipal(nombre, lat, lon):
    """El término municipal, del WFS del IGN, en UTM 30N."""
    os.makedirs(CACHE, exist_ok=True)
    ruta = os.path.join(CACHE, f'ign-{nombre}.xml')
    if not os.path.exists(ruta):
        x, y = TRANSFORMADOR.transform(lon, lat)
        radio = 4000
        r = requests.get(WFS, params={
            'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature',
            'typeNames': 'au:AdministrativeUnit',
            'bbox': f'{x-radio:.0f},{y-radio:.0f},{x+radio:.0f},{y+radio:.0f},'
                    'urn:ogc:def:crs:EPSG::25830',
            'srsName': 'urn:ogc:def:crs:EPSG::25830', 'count': '30'}, timeout=240)
        r.raise_for_status()
        for m in re.finditer(r'<wfs:member>(.*?)</wfs:member>', r.text, re.S):
            t = re.search(r'<gn:text>([^<]+)</gn:text>', m.group(1))
            if t and t.group(1).strip() == nombre:
                open(ruta, 'w', encoding='utf-8').write(m.group(1))
                break
        else:
            raise SystemExit(f'{nombre}: el WFS del IGN no ha devuelto su término')
    partes = poligonos_de(open(ruta, encoding='utf-8').read())
    g = MultiPolygon(partes) if len(partes) > 1 else partes[0]
    return g if g.is_valid else make_valid(g)


def pide_urban_atlas(bbox, desde):
    r = requests.get(URBAN_ATLAS, params={
        'where': 'code_2018 IN (' + ','.join(f"'{c}'" for c in CLASES) + ')',
        'geometry': ','.join(f'{v:.2f}' for v in bbox),
        'geometryType': 'esriGeometryEnvelope', 'inSR': 25830, 'outSR': 25830,
        'spatialRel': 'esriSpatialRelIntersects',
        'outFields': 'code_2018', 'returnGeometry': 'true',
        'resultOffset': desde, 'resultRecordCount': 1000, 'f': 'geojson'}, timeout=300)
    r.raise_for_status()
    return r.json().get('features', [])


def superficies(municipio_id):
    nombre, lat, lon = MUNICIPIOS[municipio_id]
    g = limite_municipal(nombre, lat, lon)
    suma = {v: 0.0 for v in CLASES.values()}
    trozos = {v: 0 for v in CLASES.values()}
    desde = 0
    while True:
        features = pide_urban_atlas(g.bounds, desde)
        for f in features:
            clave = CLASES[f['properties']['code_2018']]
            poly = shape(f['geometry'])
            if not poly.is_valid:
                poly = poly.buffer(0)
            inter = poly.intersection(g)
            if not inter.is_empty:
                suma[clave] += inter.area
                trozos[clave] += 1
        if len(features) < 1000:
            break
        desde += 1000
        time.sleep(0.5)
    return nombre, g.area, suma, trozos


def main():
    print(f'{"municipio":14s}{"término km²":>13s}{"verde km²":>11s}{"deporte km²":>13s}'
          f'{"m²/hab":>10s}   piezas', file=sys.stderr)
    filas = {}
    for municipio_id in MUNICIPIOS:
        nombre, area, suma, trozos = superficies(municipio_id)
        filas[municipio_id] = suma
        total = suma['verde'] + suma['deporte']
        print(f'{nombre:14s}{area/1e6:13.2f}{suma["verde"]/1e6:11.3f}{suma["deporte"]/1e6:13.3f}'
              f'{total/1e6:10.2f}   {trozos["verde"]}+{trozos["deporte"]}', file=sys.stderr)
    print('\n// Bloque para datos/datos.js\n', file=sys.stderr)
    print('    zonasVerdes: {')
    print("      fuenteId: 'urbanAtlas',")
    print('      valores: {')
    for municipio_id in MUNICIPIOS:
        s = filas[municipio_id]
        print(f'        {municipio_id}: {{ verde: {round(s["verde"])}, '
              f'deporte: {round(s["deporte"])} }},')
    print('      }')
    print('    },')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Escribe herramientas/transporte/fuentes/distancia.json: lo lejos que queda
el trabajo de los vecinos de cada ciudad.

Ministerio de Transportes, estudio básico de movilidad por municipios (Open
Data Movilidad, a partir de los teléfonos móviles): los viajes de un día por
origen, destino, tramo de distancia, actividad en cada punta y kilómetros.
Todos los medios de transporte, viajes de más de 500 m.

  - De casa al trabajo o a estudiar: los viajes que salen de casa en la
    ciudad (actividad_origen = casa) hacia el trabajo o el centro de estudios
    (actividad_destino = trabajo_estudio), vayan adonde vayan. Su distancia
    media (viajes_km / viajes) y cuántos de cada 100 pasan de 10 km.
  - Kilómetros por vecino: los de todos los viajes que salen de casa en la
    ciudad o vuelven a casa en ella, entre su población (padrón de 2025, de
    datos/datos.js). No están los viajes entre dos sitios que no son casa.

Los mismos días que las rutas por carretera (accesos.py): el miércoles
16-10-2024 y, de control, el martes 17-10-2023.

Uso:
    python3 herramientas/transporte/distancia.py

Lee el fichero del día al vuelo, sin guardarlo (unos 5 minutos por día).
Solo usa la biblioteca estándar.
"""
import collections
import gzip
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
MITMA = 'https://movilidad-opendata.mitma.es'
FICHA = 'https://www.transportes.gob.es/ministerio/proyectos-singulares/estudios-de-movilidad-con-big-data/opendata-movilidad'
FECHAS = ['20241016', '20231017']
CODIGOS = {
    '28106': 'parla', '28065': 'getafe', '28074': 'leganes', '28058': 'fuenlabrada',
    '28092': 'mostoles', '28007': 'alcorcon', '28006': 'alcobendas', '28113': 'pinto',
    '28148': 'torrejon', '28115': 'pozuelo', '28080': 'majadahonda',
}
LEJOS = ('10-50', '>50')   # tramos de distancia del estudio por encima de 10 km


def url(fecha):
    return (f'{MITMA}/estudios_basicos/por-municipios/viajes/ficheros-diarios/'
            f'{fecha[:4]}-{fecha[4:6]}/{fecha}_Viajes_municipios.csv.gz')


def dia(fecha):
    a = collections.defaultdict(collections.Counter)
    with urllib.request.urlopen(url(fecha), timeout=900) as r:
        f = io.TextIOWrapper(gzip.GzipFile(fileobj=r), encoding='utf-8')
        cab = next(f).rstrip('\n').split('|')
        k = {n: i for i, n in enumerate(cab)}
        for linea in f:
            c = linea.rstrip('\n').split('|')
            o, d = c[k['origen']], c[k['destino']]
            if o not in CODIGOS and d not in CODIGOS:
                continue
            v, km = float(c[k['viajes']]), float(c[k['viajes_km']])
            if o in CODIGOS and c[k['actividad_origen']] == 'casa':
                x = a[CODIGOS[o]]
                x['casa_km'] += km
                if c[k['actividad_destino']] == 'trabajo_estudio':
                    x['trabajo'] += v
                    x['trabajo_km'] += km
                    if c[k['distancia']] in LEJOS:
                        x['trabajo_lejos'] += v
            if d in CODIGOS and c[k['actividad_destino']] == 'casa':
                a[CODIGOS[d]]['casa_km'] += km
    return a


def poblacion():
    t = (RAIZ / 'datos/datos.js').read_text(encoding='utf-8')
    # BASES.total.valores, el padrón que usa toda la web
    m = re.search(r"total:\s*\{.*?valores:\s*(\{[^}]*\})", t, re.S)
    return json.loads(re.sub(r'(\w+):', r'"\1":', m.group(1)))


def main():
    pob = poblacion()
    out = {'_meta': {'fuentes': {'ficha': FICHA, **{f: url(f) for f in FECHAS}}, 'fechas': FECHAS}}
    for fecha in FECHAS:
        print('leyendo', fecha, file=sys.stderr)
        for c, x in dia(fecha).items():
            out.setdefault(c, {})[fecha] = {
                'viajesTrabajo': round(x['trabajo']),
                'kmTrabajo': round(x['trabajo_km'] / x['trabajo'], 2),
                'pctLejos': round(100 * x['trabajo_lejos'] / x['trabajo'], 1),
                'kmVecino': round(x['casa_km'] / pob[c], 1),
            }
    (AQUI / 'fuentes/distancia.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for c in sorted(CODIGOS.values(), key=lambda c: -out[c][FECHAS[0]]['kmTrabajo']):
        print(c, out[c][FECHAS[0]], file=sys.stderr)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Escribe herramientas/economia/fuentes/ocupacion.json: en qué trabajan los
vecinos de cada ciudad.

INE, Censo anual de población, tabla 69986: ocupados de 16 y más años que
viven en la ciudad, por ocupación (CNO-11, a un dígito), 2021-2023. Es la
misma tabla del lugar de trabajo de trabajo.json; aquí se coge el total de
cada ocupación, trabajen donde trabajen.

Uso:
    python3 herramientas/economia/ocupacion.py [69986.csv]

Sin argumento descarga el CSV del INE. Solo usa la biblioteca estándar.
"""
import csv
import io
import json
import sys
import urllib.request
from pathlib import Path

AQUI = Path(__file__).resolve().parent
TABLA = 'https://www.ine.es/jaxiT3/Tabla.htm?t=69986'
CSV = 'https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/69986.csv'

IDS = {
    '28106': 'parla', '28065': 'getafe', '28074': 'leganes', '28058': 'fuenlabrada',
    '28092': 'mostoles', '28007': 'alcorcon', '28006': 'alcobendas', '28113': 'pinto',
    '28148': 'torrejon', '28115': 'pozuelo', '28080': 'majadahonda',
}

GRANDES = {
    '1': 'Directores y gerentes',
    '2': 'Técnicos y profesionales científicos e intelectuales',
    '3': 'Técnicos; profesionales de apoyo',
    '4': 'Empleados contables, administrativos y otros empleados de oficina',
    '5': 'Trabajadores de los servicios de restauración, personales, protección y vendedores',
    '6': 'Trabajadores cualificados en el sector agrícola, ganadero, forestal y pesquero',
    '7': 'Artesanos y trabajadores cualificados de las industrias manufactureras y la construcción',
    '8': 'Operadores de instalaciones y maquinaria, y montadores',
    '9': 'Ocupaciones elementales',
}


def leer(ruta):
    if ruta:
        return Path(ruta).read_text(encoding='utf-8-sig')
    with urllib.request.urlopen(CSV, timeout=120) as r:
        return r.read().decode('utf-8-sig')


def main():
    texto = leer(sys.argv[1] if len(sys.argv) > 1 else None)
    out = {i: {} for i in IDS.values()}
    for r in csv.reader(io.StringIO(texto), delimiter=';'):
        if len(r) < 6 or r[0][:5] not in IDS or r[1] != 'Total' or r[2] != 'Total':
            continue
        oc = r[3]
        clave = 'total' if oc == 'Total' else 'no_consta' if oc == 'No consta' else oc.split(' ')[0]
        out[IDS[r[0][:5]]].setdefault(r[4], {})[clave] = int(r[5].replace('.', ''))

    # Las nueve ocupaciones y «no consta» suman el total en todas.
    for i, anios in out.items():
        for a, d in anios.items():
            assert sum(d[k] for k in GRANDES) + d['no_consta'] == d['total'], (i, a)

    salida = {
        '_meta': {
            'fuentes': {'censo_ocupacion': TABLA, 'censo_ocupacion_csv': CSV},
            'ocupaciones': GRANDES,
            'nota': 'Ocupados residentes por gran grupo de la CNO-11; sexo y lugar de trabajo = Total.',
        },
        **out,
    }
    (AQUI / 'fuentes/ocupacion.json').write_text(
        json.dumps(salida, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    p = out['parla']['2023']
    print('parla 2023:', p['total'], 'ocupados;', p['no_consta'], 'sin ocupación')


if __name__ == '__main__':
    main()

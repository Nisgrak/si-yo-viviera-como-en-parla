#!/usr/bin/env python3
"""Escribe datos/infraestructura.js: por dónde se sale de cada ciudad en coche.

Lee las tablas que deja herramientas/accesos/ (rutas por carretera del
Ministerio de Transportes, cruzadas con los términos municipales del IGN):

    salida/ciudades11_<fecha>.csv   una fila por ciudad
    salida/puertas11_<fecha>.csv    una fila por ciudad, sentido, franja y puerta

y se queda con lo que pinta la web: los viajeros que salen y entran cada día,
de 6 a 10 y de 7 a 8, y el reparto entre puertas de los que salen de 6 a 10.

Uso:
    python3 herramientas/infraestructura.py [carpeta-de-salida]

Sin argumento lee herramientas/accesos/salida/. Solo usa la biblioteca
estándar.
"""
import csv
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FECHA = '20241016'      # miércoles 16 de octubre de 2024
FECHA_CONTROL = '20231017'  # martes 17 de octubre de 2023: el mismo reparto

# Código INE del estudio → id de la web (datos/datos.js).
IDS = {
    '28106': 'parla', '28065': 'getafe', '28074': 'leganes', '28058': 'fuenlabrada',
    '28092': 'mostoles', '28007': 'alcorcon', '28006': 'alcobendas', '28113': 'pinto',
    '28148': 'torrejon', '28115': 'pozuelo', '28080': 'majadahonda',
}

RUMBO = {
    'N': 'al norte', 'NE': 'al noreste', 'E': 'al este', 'SE': 'al sureste',
    'S': 'al sur', 'SO': 'al suroeste', 'O': 'al oeste', 'NO': 'al noroeste',
}

# Las de Parla se conocen una a una (auditadas sobre el mapa): se rotulan por
# su nombre de uso. El resto se rotula con sus carreteras y el rumbo.
ROTULOS = {
    '28106-01': ('A-42', 'hacia Madrid'),
    '28106-02': ('A-42 y M-410', 'hacia el sur'),
    '28106-03': ('M-408', 'hacia Pinto'),
    '28106-04': ('R-4', 'de peaje'),
}

CALLES = ('(sin tramo de red en el límite)', '(ruta sin tramos)')


def rotulo(pid, nombre):
    if pid in ROTULOS:
        return ROTULOS[pid]
    vias = []
    for v in re.findall(r'\b[A-Z]{1,2}-\d+\b', nombre):
        if v not in vias:
            vias.append(v)
    rumbo = re.search(r'\(([NSEO]{1,2})\)\s*$', nombre)
    # Las dos primeras bastan para reconocerla; un rótulo con cinco carreteras
    # no se lee en un andén.
    return (' y '.join(vias[:2]), RUMBO.get(rumbo.group(1), '') if rumbo else '')


def leer(carpeta, fecha):
    with open(carpeta / f'ciudades11_{fecha}.csv', newline='', encoding='utf-8') as f:
        ciudades = {r['codigo']: r for r in csv.DictReader(f, delimiter=';')}
    with open(carpeta / f'puertas11_{fecha}.csv', newline='', encoding='utf-8') as f:
        puertas = list(csv.DictReader(f, delimiter=';'))
    return ciudades, puertas


def main():
    carpeta = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'herramientas/accesos/salida'
    ciudades, puertas = leer(carpeta, FECHA)
    ciudades_c, puertas_c = leer(carpeta, FECHA_CONTROL)

    def reparto(filas, codigo):
        lista, calles = [], 0.0
        for r in filas:
            if r['codigo'] != codigo or r['sentido'] != 'sale' or r['ventana'] != '6_10':
                continue
            v = float(r['viajes'])
            if r['puerta_id'] in CALLES:
                calles += v
                continue
            via, hacia = rotulo(r['puerta_id'], r['puerta'])
            lista.append({'via': via, 'hacia': hacia, 'v': round(v, 1)})
        lista.sort(key=lambda p: -p['v'])
        return lista, round(calles, 1)

    salida = {}
    for codigo, idw in IDS.items():
        c = ciudades[codigo]
        lista, calles = reparto(puertas, codigo)
        control, _ = reparto(puertas_c, codigo)
        total_c = sum(p['v'] for p in control) + reparto(puertas_c, codigo)[1]
        salida[idw] = {
            'pob': int(c['poblacion']),
            'sale': {'dia': round(float(c['sale_dia']), 1),
                     'h610': round(float(c['sale_6_10']), 1),
                     'h78': round(float(c['sale_7_8']), 1)},
            'entra': {'dia': round(float(c['entra_dia']), 1),
                      'h610': round(float(c['entra_6_10']), 1),
                      'h78': round(float(c['entra_7_8']), 1)},
            'puertas': lista,
            'calles': calles,
            # La puerta más usada en 2023, en tanto por uno: para decir que el
            # reparto no es cosa de un día.
            'primera2023': round(control[0]['v'] / total_c, 4) if control else None,
        }

    js = ('/* GENERADO por herramientas/infraestructura.py. No se edita a mano.\n'
          '   Viajeros por carretera que salen y entran de cada ciudad un día\n'
          '   laborable (16-10-2024), y por qué puerta salen de 6 a 10.\n'
          '   Fuente: Ministerio de Transportes, Rutas por carretera y estudio\n'
          '   básico de movilidad; términos municipales del IGN. */\n'
          'window.ACCESOS = ' + json.dumps({'fecha': FECHA, 'ciudades': salida},
                                          ensure_ascii=False, indent=1) + ';\n')
    (RAIZ / 'datos/infraestructura.js').write_text(js, encoding='utf-8')
    p = salida['parla']
    print('parla', p['sale']['h610'], [x['via'] for x in p['puertas']], p['calles'])


if __name__ == '__main__':
    main()

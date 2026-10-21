#!/usr/bin/env python3
"""Escribe datos/sanidad.js: lo que se espera en el hospital de cada ciudad.

Lee herramientas/sanidad/espera.json, que escribe sanidad/espera.py con lo
que publica el servicio de consulta de listas de espera del SERMAS (opción
«Total», por hospital y mes) y la población de referencia de la memoria de
cada hospital. Se queda con lo que pinta la web: por cada lista
(operación, primera consulta, pruebas) la demora media y los pacientes por
cada 1.000 personas de su población de referencia, el último mes y el mismo
mes de dos años antes. Aquí no se calcula nada más.

    python3 herramientas/sanidad.py
"""
import json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(RAIZ, 'herramientas/sanidad/espera.json'), encoding='utf-8'))

# El nombre corto con que se nombra cada hospital en las frases.
CORTO = {
    'infanta_cristina': 'el Infanta Cristina',
    'getafe': 'el Hospital de Getafe',
    'fuenlabrada': 'el Hospital de Fuenlabrada',
    'severo_ochoa': 'el Severo Ochoa',
    'alcorcon': 'la Fundación Alcorcón',
    'infanta_sofia': 'el Infanta Sofía',
    'mostoles': 'el Hospital de Móstoles',
    'torrejon': 'el Hospital de Torrejón',
    'puerta_hierro': 'el Puerta de Hierro',
}
# Dónde está el hospital, cuando no es en la propia ciudad.
FUERA = {'pinto': 'Getafe', 'pozuelo': 'Majadahonda', 'alcobendas': 'San Sebastián de los Reyes'}

LISTAS = ['quirurgica', 'consultas', 'pruebas']
ANTES = '2024'


def lista(c, k):
    x = c.get(k)
    if not x:
        return None
    a = (c.get(k + 'Anterior') or {}).get(ANTES)
    return {'dias': round(x['demoraDias'], 1), 'pacientes': x['pacientes'], 'por1000': x['por1000'],
            'antes': round(a['demoraDias'], 1) if a else None}


ciudades = {}
for cid, c in E['ciudades'].items():
    pob = c['poblacionReferencia']
    ciudades[cid] = {
        'hospital': c['hospital'].split(' (')[0],
        'corto': CORTO[c['hospitalId']],
        'hid': c['hospitalId'],
        'pobFuente': pob['fuente'],
        'gestion': c['gestion'],
        'fuera': FUERA.get(cid),
        'pob': pob['valor'], 'pobFecha': pob['fecha'],
        **{k: lista(c, k) for k in LISTAS},
        'sinDato': c.get('sinDato') or [],
    }

f = E['fuentes']
salida = {
    'mes': E['mes'],
    'antes': 'agosto de ' + ANTES,
    'ciudades': ciudades,
    'fuentes': {
        'consulta': ['SERMAS · Situación de las listas de espera por hospital, ' + E['mes'],
                     f['servicioConsulta']['urls']['quirurgica']],
        'portal': [f['portalQuirurgica']['titulo'], f['portalQuirurgica']['url']],
    },
    # La memoria de cada hospital, de donde sale su población de referencia.
    'memorias': {hid: f['memoria2024_' + hid]['url'] for hid in CORTO},
}
destino = os.path.join(RAIZ, 'datos/sanidad.js')
with open(destino, 'w', encoding='utf-8') as s:
    s.write('/* Escrito por herramientas/sanidad.py desde herramientas/sanidad/espera.json. No editar a mano. */\n')
    s.write('window.SANIDAD = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('datos/sanidad.js:', len(ciudades), 'ciudades,', E['mes'])

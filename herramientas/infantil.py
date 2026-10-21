#!/usr/bin/env python3
"""Escribe datos/infantil.js: quién se queda sin plaza en una escuela infantil
pública (primer ciclo, 0 a 2 años).

Lee herramientas/infantil/infantil.json, que escribe infantil/infantil.py
(python3 -I; guarda lo descargado en /var/tmp/infantil/ y puede rehacerse sin
red con --sin-red) con las gráficas «Proceso de admisión» y «Número de
alumnos» de la ficha de cada centro público en el buscador de colegios de la
Comunidad de Madrid. Se queda con lo que pinta la web: solicitudes, admitidos
y sin plaza en el proceso de admisión, y matriculados en la pública por cada
100 niños de 0 a 2 años del padrón.

    python3 herramientas/infantil.py
"""
import json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I = json.load(open(os.path.join(RAIZ, 'herramientas/infantil/infantil.json'), encoding='utf-8'))

ciudades = {}
for cid, c in I['ciudades'].items():
    ciudades[cid] = {
        'solicitudes': c['solicitudes'], 'admitidos': c['admitidos'], 'sinPlaza': c['sinPlaza'],
        'pctSinPlaza': c['pctSinPlaza'], 'solicitudesPor100': c['solicitudesPor100Ninos'],
        'matriculados': c['matriculadosPublica0a2'], 'matriculadosPor100': c['matriculadosPublicaPor100Ninos'],
        'ninos': c['ninos0a2'],
    }
F = I['fuentes']
salida = {
    'cursoAdmision': I['cursoAdmision'], 'cursoMatricula': I['cursoMatricula'],
    'ciudades': ciudades,
    'fuentes': {'buscador': ['Comunidad de Madrid · Buscador de colegios: proceso de admisión y alumnos de cada escuela infantil pública', F[0]['url']]},
}
with open(os.path.join(RAIZ, 'datos/infantil.js'), 'w', encoding='utf-8') as s:
    s.write('/* Escrito por herramientas/infantil.py desde herramientas/infantil/infantil.json. No editar a mano. */\n')
    s.write('window.INFANTIL = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('datos/infantil.js:', len(ciudades), 'ciudades,', salida['cursoAdmision'])

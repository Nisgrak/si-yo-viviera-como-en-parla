#!/usr/bin/env python3
"""Escribe datos/primaria.js: cuántas tarjetas sanitarias hay por cada plaza de
médico de familia y de pediatra en los centros de salud de cada ciudad.

Lee herramientas/primaria/primaria.json, que escriben primaria/descarga.py y
primaria/primaria.py (python3 -I; necesita pdftotext) con la plantilla
orgánica de Atención Primaria del SERMAS (plazas por centro de salud), las
tarjetas sanitarias de cada centro del Observatorio de Resultados y el
buscador de libre elección (qué centros hay en cada ciudad). Se queda con lo
que pinta la web: los dos cocientes por ciudad y los de la Comunidad. Las
tarjetas de 0 a 13 años van contra los pediatras; las de 14 o más, contra
los médicos de familia.

    python3 herramientas/primaria.py
"""
import json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(RAIZ, 'herramientas/primaria/primaria.json'), encoding='utf-8'))

ciudades = {}
for cid, c in P['ciudades'].items():
    ciudades[cid] = {
        'familia': c['tsiPorMedico'], 'pediatria': c['tsiInfantilPorPediatra'],
        'medicos': c['medicosFamilia'], 'pediatras': c['pediatras'],
        'tsiAdultos': c['tsiAdultos'], 'tsiInfantil': c['tsiPediatria'],
    }
uno = next(iter(P['ciudades'].values()))
cm = P['comunidadDeMadrid']
F = {f['titulo']: f['url'] for f in P['fuentes']}
plantilla = next(t for t in F if t.startswith('SERMAS. Plantilla orgánica'))
tarjetas = next(t for t in F if 'resultados 2024 (CSV)' in t)
salida = {
    'anioTarjetas': uno['anio'], 'fechaPlantilla': uno['fechaPlantilla'],
    'comunidad': {'familia': cm['tsiPorMedico'], 'pediatria': cm['tsiInfantilPorPediatra']},
    'ciudades': ciudades,
    'fuentes': {
        'plantilla': ['SERMAS · Plantilla orgánica de Atención Primaria, plazas por centro de salud, octubre de 2026', F[plantilla]],
        'tarjetas': ['Observatorio de Resultados del SERMAS · Tarjetas sanitarias por centro de salud, 2024', F[tarjetas]],
    },
}
with open(os.path.join(RAIZ, 'datos/primaria.js'), 'w', encoding='utf-8') as s:
    s.write('/* Escrito por herramientas/primaria.py desde herramientas/primaria/primaria.json. No editar a mano. */\n')
    s.write('window.PRIMARIA = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('datos/primaria.js:', len(ciudades), 'ciudades')

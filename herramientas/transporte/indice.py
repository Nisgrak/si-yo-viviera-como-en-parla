#!/usr/bin/env python3
"""Añade a datos/transporte.js la cobertura (cobertura.py), el abono
(abono.py), lo que se tarda desde la vivienda mediana (vivienda_media.py) y
lo lejos que queda el trabajo (distancia.py) y lo que queda si falla la línea
principal (capacidad.py y sin_cercanias.py) de cada ciudad, sin recalcular los tiempos. Lo llama también
ciudad.py al terminar.

Uso:
    python3 herramientas/transporte/indice.py
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
F = Path(__file__).resolve().parent / 'fuentes'


def estacion(ciudad, celda, destinos):
    """Lo mismo que estacion() de assets/infraestructura-tp.js: la celda de
    100 m más cercana a la estación de Cercanías más cercana al ayuntamiento."""
    import math
    t = (RAIZ / 'datos/transporte' / (ciudad + '.js')).read_text(encoding='utf-8')
    c = json.loads(t[t.index('= {') + 2:t.rindex('}') + 1])
    ay = c.get('ayuntamiento') or [0, 0]
    es = sorted((e for e in c['estaciones'] if 'cercanias' in e['modos']),
                key=lambda e: math.hypot(e['x'] - ay[0], e['y'] - ay[1]))
    if not es:
        return None
    e = es[0]
    k = min(range(len(c['celdas'])), key=lambda k: math.hypot(c['origen'][0] + c['celdas'][k][0] * celda - e['x'],
                                                             c['origen'][1] + c['celdas'][k][1] * celda - e['y']))
    def minutos(mo, dest):
        v = c['modos'][mo][dest]['t'][2 * k:2 * k + 2]
        return None if v == '--' else int(v, 36)
    return {'nombre': e['nombre'].split(' / ')[0],
            'tren': {x: minutos('tren', x) for x in destinos}, 'todo': {x: minutos('todo', x) for x in destinos}}


def main():
    js = RAIZ / 'datos/transporte.js'
    t = js.read_text(encoding='utf-8')
    m = re.search(r'window\.TRANSPORTE = (\{.*\});\s*$', t, re.S)
    d = json.loads(m.group(1))
    ab = json.loads((F / 'abono.json').read_text())
    co = json.loads((F / 'cobertura.json').read_text())
    d['abono'] = {'joven': ab['_meta']['joven'], 'fuente': ab['_meta']['fuentes']['precios'],
                  'ciudades': {c: {'zona': v['zona'], 'precio': v['abono30']}
                               for c, v in ab.items() if c != '_meta'}}
    d['cobertura'] = {'fuente': co['_meta']['fuentes']['catastro'],
                      'ciudades': {c: {'viviendas': v['viviendas'], 'cerca': v['cerca'], 'pct': v['pct'],
                                       'pctSin': v.get('pctSinLinea'), 'linea': v.get('sinLinea')}
                                   for c, v in co.items() if c != '_meta'}}
    vm = F / 'vivienda_media.json'
    if vm.exists():
        vm = json.loads(vm.read_text())
        d['casa'] = {c: {m: {k: [x['mediana'], x['masHora']] for k, x in v[m].items()} for m in ('tren', 'todo', 'sin') if m in v}
                     for c, v in vm.items() if c != '_meta'}
    di = F / 'distancia.json'
    if di.exists():
        di = json.loads(di.read_text())
        f0, f1 = di['_meta']['fechas']
        d['distancia'] = {'fechas': [f0, f1], 'fuente': di['_meta']['fuentes']['ficha'],
                          'ciudades': {c: {'km': v[f0]['kmTrabajo'], 'lejos': v[f0]['pctLejos'],
                                           'kmVecino': v[f0]['kmVecino'], 'kmAntes': v[f1]['kmTrabajo']}
                                       for c, v in di.items() if c != '_meta'}}
    # Las plazas por línea, para «Si falla la C-4» (capacidad.py)
    ca = F / 'capacidad.json'
    if ca.exists():
        ca = json.loads(ca.read_text())
        d['redundancia'] = {
            'ventana': ca['_meta']['ventana'], 'plazas': ca['_meta']['plazas'], 'demanda': ca['_meta']['demanda'],
            'ciudades': {c: {'lineas': [[k, v['vehiculos'], v['plazas']] for k, v in x['lineas'].items()],
                             'vanMadrid': x['vanMadrid']}
                         for c, x in ca.items() if c != '_meta'}}
    # La estación de Cercanías de cada ciudad (la más cercana al ayuntamiento)
    # y los minutos desde ella hasta cada destino, en tren y con todo: la
    # cabecera y «Hasta el centro» los dicen sin tener que bajar el fichero
    # grande de cada ciudad, que solo hace falta para los mapas.
    d['estacion'] = {c: estacion(c, d['celda'], [x['id'] for x in d['destinos']]) for c in d['ciudades']}
    # Las estaciones en obras, en metros desde el centro del mapa de su ciudad.
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import tiempos as T
    ob = json.loads((F / 'obras.json').read_text())
    d['obras'] = []
    for e in ob['estaciones']:
        cx, cy = T.leer_mapa(e['ciudad'])['centro']
        x, y = T.utm30(e['lat'], e['lon'])
        d['obras'].append({'nombre': e['nombre'], 'ciudad': e['ciudad'], 'linea': e['linea'],
                           'x': round(x - cx), 'y': round(y - cy), 'fuente': e['fuentes'][0]})
    js.write_text(t[:m.start(1)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n',
                  encoding='utf-8')
    print('datos/transporte.js: abono de', len(d['abono']['ciudades']), 'ciudades, cobertura de',
          len(d['cobertura']['ciudades']))


if __name__ == '__main__':
    main()

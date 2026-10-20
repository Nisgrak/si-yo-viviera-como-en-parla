#!/usr/bin/env python3
"""Añade a datos/transporte.js la cobertura (cobertura.py) y el abono
(abono.py) de cada ciudad, sin recalcular los tiempos. Lo llama también
ciudad.py al terminar.

Uso:
    python3 herramientas/transporte/indice.py
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
F = Path(__file__).resolve().parent / 'fuentes'


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
                      'ciudades': {c: {'viviendas': v['viviendas'], 'cerca': v['cerca'], 'pct': v['pct']}
                                   for c, v in co.items() if c != '_meta'}}
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

#!/usr/bin/env python3
"""Aligera datos/transporte/<id>.js sin cambiar lo que se ve. Lo llama
ciudad.py al escribir cada ciudad, y se puede pasar sobre los ficheros ya
escritos:

    python3 herramientas/transporte/aligerar.py

  - Quita las celdas sin tiempo para ningún destino ni con autobús ni sin
    él (campo a más de 1.200 m de cualquier parada): el mapa no las pinta.
  - Recorta las manzanas al encuadre del mapa (con un margen), que es lo
    único que se dibuja.
  - Guarda los tiempos como texto: «t» lleva dos caracteres por celda, los
    minutos en base 36 («--» sin tiempo), y «m», otros dos con lo que se
    separan de la mediana el percentil 25 y el 75, en base 36 y topados en
    35 («z»; «-» sin dato). Una ciudad ya aligerada se deja como está.
"""
B36 = '0123456789abcdefghijklmnopqrstuvwxyz'


def b36(v, ancho):
    if v is None:
        return '-' * ancho
    v = min(v, 36 ** ancho - 1)
    return ''.join(B36[(v // 36 ** i) % 36] for i in reversed(range(ancho)))
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
MARGEN = 300   # m de manzanas que se dejan fuera del encuadre, para que no se corten en seco


def aligerar(d):
    if any(isinstance(v['t'], str) for mo in d['modos'].values() for v in mo.values()):
        return d
    # 1. Celdas con algún tiempo, en algún modo y destino.
    vals = [v for mo in d['modos'].values() for v in mo.values()]
    sirve = [k for k in range(len(d['celdas'])) if any(v['t'][k] is not None for v in vals)]
    if 'm' in vals[0]:   # ya sin celdas de campo, de una pasada anterior
        sirve = list(range(len(d['celdas'])))
    d['celdas'] = [d['celdas'][k] for k in sirve]
    for v in vals:
        t = v['t']
        p25 = v.get('p25') or [None if x is None or m is None or m[0] is None else x - m[0] for x, m in zip(t, v['m'])]
        p75 = v.get('p75') or [None if x is None or m is None or m[1] is None else x + m[1] for x, m in zip(t, v['m'])]
        v['t'] = ''.join(b36(t[k], 2) for k in sirve)
        # El percentil 75 puede no tener tiempo (pasa de 2 horas) aunque la mediana sí.
        v['m'] = ''.join(b36(None if t[k] is None or p25[k] is None else t[k] - p25[k], 1) +
                         b36(None if t[k] is None or p75[k] is None else p75[k] - t[k], 1) for k in sirve)
        v.pop('p25', None)
        v.pop('p75', None)
    # 2. Manzanas que tocan el encuadre.
    if d.get('encuadre'):
        x0, y0, x1, y1 = d['encuadre']
        x0, y0, x1, y1 = x0 - MARGEN, y0 - MARGEN, x1 + MARGEN, y1 + MARGEN
        d['manzanas'] = [r for r in d['manzanas']
                         if any(x0 <= p[0] <= x1 and y0 <= p[1] <= y1 for p in r)]
    return d


def fichero(f):
    t = f.read_text(encoding='utf-8')
    m = re.search(r'(window\.TRANSPORTE_CIUDAD\[[^\]]+\] = )(\{.*\});\n$', t, re.S)
    d = aligerar(json.loads(m.group(2)))
    f.write_text(t[:m.start(2)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n',
                 encoding='utf-8')


def main():
    for f in sorted((RAIZ / 'datos/transporte').glob('*.js')):
        antes = f.stat().st_size
        fichero(f)
        print(f'{f.stem:12s} {antes / 1e6:5.2f} MB -> {f.stat().st_size / 1e6:5.2f} MB')


if __name__ == '__main__':
    main()

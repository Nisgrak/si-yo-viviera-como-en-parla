#!/usr/bin/env python3
"""Escribe herramientas/transporte/fuentes/vivienda_media.json: cuánto se
tarda en transporte público hasta cada destino desde la vivienda mediana de
cada ciudad, no desde su estación.

  - Tiempos: los de datos/transporte/<id>.js (ciudad.py), la mediana de las
    salidas de 7:30 a 8:30 de un martes desde el centro de cada celda de
    100 m. Cada edificio toma el tiempo de la celda en la que cae.
  - Viviendas: los edificios del Catastro con su número de viviendas, los
    mismos de cobertura.py (/var/tmp/catastro-bu/).
  - La vivienda mediana: ordenadas todas las viviendas de la ciudad por lo
    que tardan, la del medio. Las que no tienen ninguna parada a 1.200 m
    cuentan como las que más tardan. También el percentil 75 (la cuarta
    parte que más tarda) y cuántas pasan de una hora.

Uso:
    python3 herramientas/transporte/vivienda_media.py [--ciudades parla …]

Solo usa la biblioteca estándar.
"""
import argparse
import json
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
sys.path.insert(0, str(AQUI))
import cobertura  # noqa: E402
import tiempos as T  # noqa: E402

B36 = '0123456789abcdefghijklmnopqrstuvwxyz'
HORA = 60


def leer_ciudad(c):
    t = (RAIZ / f'datos/transporte/{c}.js').read_text(encoding='utf-8')
    return json.loads(re.search(r'window\.TRANSPORTE_CIUDAD\[[^\]]+\] = (\{.*\});\s*$', t, re.S).group(1))


def minutos(s):
    """Los tiempos de aligerar.py: dos caracteres en base 36 por celda, «--» sin tiempo."""
    return [None if s[k] == '-' else B36.index(s[k]) * 36 + B36.index(s[k + 1]) for k in range(0, len(s), 2)]


def percentil(pares, q):
    """pares = [(minutos o None, viviendas)]; None va al final."""
    total = sum(n for _, n in pares)
    acum = 0
    for t, n in sorted(pares, key=lambda p: (p[0] is None, p[0] or 0)):
        acum += n
        if acum >= q * total:
            return t
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ciudades', nargs='+', default=cobertura.IDS)
    a = ap.parse_args()
    f = AQUI / 'fuentes/vivienda_media.json'
    out = json.loads(f.read_text()) if f.exists() else {}
    out['_meta'] = {
        'notas': ['Tiempos de datos/transporte/<id>.js (ciudad.py): mediana de las salidas de 7:30 a 8:30 '
                  'de un martes, desde el centro de cada celda de 100 m.',
                  'Viviendas: numberOfDwellings de los edificios del Catastro (INSPIRE Buildings), en el centro '
                  'de su planta; cada edificio toma el tiempo de su celda.',
                  'Sin tiempo (ninguna parada a 1.200 m andando): cuentan como las que más tardan.']}
    for c in a.ciudades:
        d = leer_ciudad(c)
        cx, cy = d['centro']
        ox, oy = d['origen']
        celda = {tuple(ij): k for k, ij in enumerate(d['celdas'])}
        ed = cobertura.edificios(T.leer_mapa(c)['codigo'])
        # cada edificio, en su celda de 100 m (el centro de la celda [i, j] está en origen + 100·[i, j])
        donde = [(celda.get((round((x - cx - ox) / 100), round((y - cy - oy) / 100))), n) for x, y, n in ed]
        total = sum(n for _, n in donde)
        res = {'viviendas': total}
        for modo, dests in d['modos'].items():
            res[modo] = {}
            for dest, v in dests.items():
                tt = minutos(v['t'])
                pares = [(None if k is None else tt[k], n) for k, n in donde]
                res[modo][dest] = {
                    'mediana': percentil(pares, .5),
                    'p75': percentil(pares, .75),
                    'masHora': round(100 * sum(n for t, n in pares if t is None or t > HORA) / total, 1),
                    'sinTiempo': round(100 * sum(n for t, n in pares if t is None) / total, 1),
                }
        out[c] = res
        print(c, total, {m: res[m]['sol'] for m in res if m != 'viviendas'}, file=sys.stderr)
    f.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

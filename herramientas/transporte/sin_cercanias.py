#!/usr/bin/env python3
"""Escribe herramientas/transporte/fuentes/sin_cercanias.json: si un día no hay Cercanías,
cuánto se tarda desde la vivienda mediana de cada ciudad hasta Sol y Atocha
con lo que queda (Metro, Metro Ligero y autobuses), frente a con todo.

  - Mismo cálculo que ciudad.py (CSA de perfiles de tiempos.py, martes
    27-10-2026, salidas de 7:30 a 8:30, mediana de las 61 salidas), pero en
    celdas de 200 m para que vaya más deprisa.
  - Viviendas: los edificios del Catastro (cobertura.edificios); cada uno toma
    el tiempo de la celda en la que cae. Sin parada a 1.200 m, cuentan como
    las que más tardan.

Con --mapa calcula, celda a celda (las de 100 m de datos/transporte/<id>.js)
y para los cuatro destinos, lo que se tarda si falla la línea principal de
cada ciudad (principal.py: en Parla y Getafe, la C-4), con todo lo demás:
el resto de Cercanías, Metro, Metro Ligero y autobuses. Lo añade a ese
fichero como el modo «sin», con sus zonas, para «Si falla la C-4».

Uso:
    python3 herramientas/transporte/sin_cercanias.py [--ciudades parla getafe]
    python3 herramientas/transporte/sin_cercanias.py --mapa [--ciudades …]

Sin --mapa es la primera exploración (sin ninguna línea de Cercanías, desde la
vivienda mediana); la web ya no la usa.
"""
import argparse
import datetime as dt
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import cobertura  # noqa: E402
import tiempos as T  # noqa: E402
from ciudad import tiempos_celdas  # noqa: E402
from vivienda_media import percentil  # noqa: E402

CELDA = 200
MODOS = {'todo': {'cercanias', 'metro', 'ligero', 'urbanos', 'interurbanos'},
         'sin_cercanias': {'metro', 'ligero', 'urbanos', 'interurbanos'}}
DESTINOS = ['sol', 'atocha']


def rejilla(mapa):
    cx, cy = mapa['centro']
    an = [[(cx + p[0], cy + p[1]) for p in r] for r in mapa['limite']]
    xs = [p[0] for r in an for p in r]
    ys = [p[1] for r in an for p in r]
    x0 = math.floor(min(xs) / CELDA) * CELDA
    y0 = math.floor(min(ys) / CELDA) * CELDA
    celdas = {}
    for i in range(int((max(xs) - x0) // CELDA) + 1):
        for j in range(int((max(ys) - y0) // CELDA) + 1):
            px, py = x0 + (i + .5) * CELDA, y0 + (j + .5) * CELDA
            if T.dentro(px, py, an):
                celdas[(i, j)] = (px, py)
    return celdas, x0, y0, an


def mapa(ciudades):
    """El modo «sin» en datos/transporte/<id>.js, celda a celda."""
    import re
    import ciudad
    import aligerar
    fecha = dt.date(2026, 10, 27)
    v0, v1 = T.hms('07:30:00'), T.hms('08:30:00')
    minutos = list(range(v0, v1 + 1, 60))
    indice = json.loads(re.search(r'window\.TRANSPORTE = (\{.*\});', (T.RAIZ / 'datos/transporte.js')
                                  .read_text(encoding='utf-8'), re.S).group(1))
    umbrales = {d['id']: d['umbrales'] for d in indice['destinos']}
    datos, celdas, terminos = {}, {}, {}
    for c in ciudades:
        f = T.RAIZ / f'datos/transporte/{c}.js'
        t = f.read_text(encoding='utf-8')
        m = re.search(r'(window\.TRANSPORTE_CIUDAD\[[^\]]+\] = )(\{.*\});\n$', t, re.S)
        datos[c] = (f, t, m, json.loads(m.group(2)))
        d = datos[c][3]
        (cx, cy), (ox, oy) = d['centro'], d['origen']
        celdas[c] = [(cx + ox + 100 * i, cy + oy + 100 * j) for i, j in d['celdas']]
        terminos[c] = ciudad.rejilla(T.leer_mapa(c))[2]
    xs = [x for c in ciudades for x, _ in celdas[c]]
    ys = [y for c in ciudades for _, y in celdas[c]]
    for la, lo in ((40.4669, -3.68917), (40.40659, -3.68938), (40.41688, -3.70326), (40.4669, -3.6889)):
        x, y = T.utm30(la, lo)
        xs.append(x)
        ys.append(y)
    caja = (min(xs) - T.MARGEN_ZONA, min(ys) - T.MARGEN_ZONA, max(xs) + T.MARGEN_ZONA, max(ys) + T.MARGEN_ZONA)
    import principal
    red = T.Red()
    for f in MODOS['todo']:
        red.cargar(f, fecha, v0, v1 + T.LIMITE, caja)
    red.transbordos()
    todas = sorted(red.conex, key=lambda x: (-x[0], -x[1]))
    lineas = principal.principales()
    grupos = {}
    for c in ciudades:
        grupos.setdefault(lineas[c], []).append(c)
    for d in T.DESTINOS:
        d['ids'] = set(d['paradas'])
        if d['id'] in T.INTERCAMBIADORES:
            nombre, radio = T.INTERCAMBIADORES[d['id']]
            x0, y0 = red.stops['par_4_1'][:2]
            for sid, (x, y, nom, feed) in red.stops.items():
                if feed in ('interurbanos', 'urbanos') and nombre in nom.upper() and math.hypot(x - x0, y - y0) <= radio:
                    d['ids'].add(sid)
    sin = {c: {} for c in ciudades}
    for linea, cs in grupos.items():
        feed, fuera = principal.viajes(linea)
        red.conex_ord = [x for x in todas
                         if not (x[4].startswith(feed + ':') and x[4].split(':', 1)[1].rsplit(':', 1)[0] in fuera)]
        print(f'sin {linea} ({", ".join(cs)}): {len(todas) - len(red.conex_ord)} conexiones fuera', file=sys.stderr)
        for d in T.DESTINOS:
            prof = T.perfiles(red, d['ids'])
            for c in cs:
                tt = ciudad.tiempos_celdas(red, prof, celdas[c], minutos)
                med = [v[0] for v in tt]
                cen = datos[c][3]['centro']
                sin[c][d['id']] = {
                    't': ''.join(aligerar.b36(v[0], 2) for v in tt),
                    'm': ''.join(aligerar.b36(None if v[0] is None or v[1] is None else v[0] - v[1], 1) +
                                 aligerar.b36(None if v[0] is None or v[2] is None else v[2] - v[0], 1) for v in tt),
                    'zonas': ciudad.zonas(celdas[c], med, umbrales[d['id']], terminos[c], cen)}
                ok = [x for x in med if x is not None]
                print(f'  {c}: de {min(ok) if ok else "-"} a {max(ok) if ok else "-"} min', file=sys.stderr)
    for c in ciudades:
        f, t, m, d = datos[c]
        d['modos']['sin'] = sin[c]
        f.write_text(t[:m.start(2)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n',
                     encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ciudades', nargs='+', default=cobertura.IDS)
    ap.add_argument('--mapa', action='store_true')
    a = ap.parse_args()
    if a.mapa:
        mapa(a.ciudades)
        return
    fecha = dt.date(2026, 10, 27)
    v0, v1 = T.hms('07:30:00'), T.hms('08:30:00')
    minutos = list(range(v0, v1 + 1, 60))
    mapas = {c: T.leer_mapa(c) for c in a.ciudades}
    rej = {c: rejilla(mapas[c]) for c in a.ciudades}
    xs = [p[0] for c in a.ciudades for r in rej[c][3] for p in r]
    ys = [p[1] for c in a.ciudades for r in rej[c][3] for p in r]
    for la, lo in ((40.40659, -3.68938), (40.41688, -3.70326)):
        x, y = T.utm30(la, lo)
        xs.append(x)
        ys.append(y)
    caja = (min(xs) - T.MARGEN_ZONA, min(ys) - T.MARGEN_ZONA, max(xs) + T.MARGEN_ZONA, max(ys) + T.MARGEN_ZONA)
    red = T.Red()
    for f in MODOS['todo']:
        red.cargar(f, fecha, v0, v1 + T.LIMITE, caja)
    red.transbordos()
    todas = sorted(red.conex, key=lambda c: (-c[0], -c[1]))
    dest = {d['id']: set(d['paradas']) for d in T.DESTINOS}

    ed = {c: cobertura.edificios(mapas[c]['codigo']) for c in a.ciudades}
    out = {}
    for modo, feeds in MODOS.items():
        red.conex_ord = [x for x in todas if x[4].split(':', 1)[0] in feeds]
        for d in DESTINOS:
            print(modo, d, file=sys.stderr)
            prof = T.perfiles(red, dest[d])
            for c in a.ciudades:
                celdas, x0, y0, _ = rej[c]
                claves = list(celdas)
                tt = tiempos_celdas(red, prof, [celdas[k] for k in claves], minutos)
                med = {k: v[0] for k, v in zip(claves, tt)}
                pares = [(med.get((int((x - x0) // CELDA), int((y - y0) // CELDA))), n) for x, y, n in ed[c]]
                total = sum(n for _, n in pares)
                out.setdefault(c, {}).setdefault(modo, {})[d] = {
                    'mediana': percentil(pares, .5), 'p75': percentil(pares, .75),
                    'masHora': round(100 * sum(n for t, n in pares if t is None or t > 60) / total, 1)}
    for c in a.ciudades:
        print(c, out[c], file=sys.stderr)
    (Path(__file__).resolve().parent / 'fuentes/sin_cercanias.json').write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

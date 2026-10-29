#!/usr/bin/env python3
"""Exploración (no escribe nada para la web): cuántos carriles tiene cada
salida por carretera de datos/mapa/<id>.js, según OpenStreetMap.

Para cada puerta (el punto en el que la ruta cruza el término), las vías
principales (motorway, trunk, primary, secondary y sus enlaces) a menos de
RADIO metros. En las calzadas de un solo sentido, sus carriles; en las de
doble sentido, lanes:forward/backward o la mitad de lanes. Se guarda, por
puerta, la calzada de un sentido con más carriles de cada vía con nombre
(ref) que aparezca en el nombre de la puerta.

Uso:
    python3 herramientas/transporte/carriles.py

Deja el resultado en herramientas/.cache/transporte/carriles.json.
"""
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tiempos as T  # noqa: E402
from cobertura import IDS  # noqa: E402

CACHE = T.RAIZ / 'herramientas/.cache/transporte'
OVERPASS = 'https://overpass-api.de/api/interpreter'
RADIO = 250
TIPOS = 'motorway|trunk|primary|secondary|motorway_link|trunk_link|primary_link'


def geograficas(x, y):
    """Inversa de T.utm30 por Newton (basta para buscar en un radio)."""
    la, lo = 40.3, -3.7
    for _ in range(8):
        x0, y0 = T.utm30(la, lo)
        xa, _ = T.utm30(la, lo + 1e-4)
        _, yb = T.utm30(la + 1e-4, lo)
        lo += (x - x0) / ((xa - x0) / 1e-4)
        la += (y - y0) / ((yb - y0) / 1e-4)
    return la, lo


def vias(caja):
    f = CACHE / 'osm-{:.3f}-{:.3f}-{:.3f}-{:.3f}.json'.format(*caja)
    if not f.exists():
        q = f'[out:json][timeout:120];way["highway"~"^({TIPOS})$"]({caja[0]},{caja[1]},{caja[2]},{caja[3]});out tags geom;'
        req = urllib.request.Request(OVERPASS, data=urllib.parse.urlencode({'data': q}).encode(),
                                     headers={'User-Agent': 'si-yo-viviera-como-en-parla/1.0'})
        for intento in range(5):
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    f.write_bytes(r.read())
                break
            except OSError as e:
                print('  Overpass:', e, file=sys.stderr)
                time.sleep(15 * (intento + 1))
        time.sleep(5)
    return json.loads(f.read_text())['elements']


def por_sentido(tags):
    n = tags.get('lanes')
    try:
        n = int(n) if n else None
    except ValueError:
        n = None
    if tags.get('oneway') in ('yes', '1', '-1') or tags.get('highway', '').startswith('motorway'):
        return n, True
    fw = tags.get('lanes:forward')
    if fw and fw.isdigit():
        return int(fw), False
    return (n // 2 if n else 1), False


def main():
    out = {}
    for c in IDS:
        m = T.leer_mapa(c)
        cx, cy = m['centro']
        pts = [(cx + p['x'], cy + p['y']) for p in m['puertas']]
        lat = [geograficas(x, y) for x, y in pts]
        caja = (min(a for a, _ in lat) - .005, min(b for _, b in lat) - .006,
                max(a for a, _ in lat) + .005, max(b for _, b in lat) + .006)
        ws = vias(caja)
        for w in ws:
            w['_xy'] = [T.utm30(g['lat'], g['lon']) for g in w.get('geometry', [])]
        res = []
        for p, (x, y) in zip(m['puertas'], pts):
            cerca = {}
            for w in ws:
                if not w['_xy'] or min(math.hypot(a - x, b - y) for a, b in w['_xy']) > RADIO:
                    continue
                t = w.get('tags', {})
                ref = (t.get('ref') or t.get('name') or '?').split(';')[0]
                n, uno = por_sentido(t)
                k = (ref, t.get('highway'))
                if n and n > cerca.get(k, (0,))[0]:
                    cerca[k] = (n, uno, t.get('maxspeed'))
            res.append({'puerta': p['nombre'], 'v': p['v'],
                        'vias': [{'ref': r, 'tipo': h, 'carriles': n, 'unSentido': u, 'vmax': vm}
                                 for (r, h), (n, u, vm) in sorted(cerca.items())]})
        out[c] = res
        print(c, file=sys.stderr)
        for r in res:
            print('  ', r['puerta'], round(r['v']), [(v['ref'], v['tipo'], v['carriles']) for v in r['vias']], file=sys.stderr)
    (CACHE / 'carriles.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()

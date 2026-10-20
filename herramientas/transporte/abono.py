#!/usr/bin/env python3
"""Escribe herramientas/transporte/fuentes/abono.json: la zona tarifaria de
cada ciudad y lo que cuesta su abono de 30 días en 2026.

  - Zona: la del campo zone_id de las paradas de Metro, Metro Ligero y
    autobús (GTFS del Consorcio) que caen dentro del término municipal; se
    queda la más repetida y se guarda el recuento.
  - Precio: la tabla «Abono transporte: precios aplicables con descuento desde
    1/1/2026» del BOCM del 31-12-2025, que publica el Consorcio. Se copian
    aquí a mano las filas que hacen falta (A, B1, B2, B3 y el joven); el PDF
    se descarga y se comprueba que las cifras siguen ahí.

Uso:
    python3 herramientas/transporte/abono.py

Necesita pdftotext (poppler-utils) para la comprobación.
"""
import collections
import csv
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tiempos as T  # noqa: E402

RAIZ = T.RAIZ
IDS = ['parla', 'getafe', 'leganes', 'fuenlabrada', 'mostoles', 'alcorcon',
       'alcobendas', 'pinto', 'torrejon', 'pozuelo', 'majadahonda']
BOCM = 'https://www.crtm.es/media/s1qi0nmo/bocm-20251231-precios_transporte.pdf'
TARIFAS = 'https://www.crtm.es/billetes-y-tarifas/'
# Título 30 días, perfil normal, ordinario, con descuento desde el 1-1-2026.
PRECIO_30 = {'A': 32.70, 'B1': 38.20, 'B2': 43.20, 'B3': 49.20}
JOVEN_30 = 10.00
CACHE = Path('/var/tmp/crtm')


def comprobar():
    CACHE.mkdir(parents=True, exist_ok=True)
    pdf = CACHE / 'precios.pdf'
    if not pdf.exists():
        urllib.request.urlretrieve(BOCM, pdf)
    txt = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True).stdout
    for z, p in PRECIO_30.items():
        euros = f'{p:.2f}'.replace('.', ',') + ' €'
        if not re.search(r'\b%s\s+%s' % (z, re.escape(euros)), txt):
            sys.exit(f'El BOCM ya no dice {euros} para la zona {z}: revisa PRECIO_30')
    if not re.search(r'JOVEN\s+10,00 €', txt):
        sys.exit('El BOCM ya no dice 10,00 € para el abono joven')


def zonas():
    mapas = {c: T.leer_mapa(c) for c in IDS}
    terminos = {}
    for c, m in mapas.items():
        cx, cy = m['centro']
        an = [[(cx + p[0], cy + p[1]) for p in r] for r in m['limite']]
        xs = [p[0] for r in an for p in r]
        ys = [p[1] for r in an for p in r]
        terminos[c] = (an, min(xs), min(ys), max(xs), max(ys))
    cuenta = {c: collections.Counter() for c in IDS}
    for feed in ('metro', 'ligero', 'urbanos', 'interurbanos'):
        for r in T.leer_csv(T.GTFS_DIR / feed / 'stops.txt'):
            z = (r.get('zone_id') or '').strip()
            if not z:
                continue
            x, y = T.utm30(float(r['stop_lat']), float(r['stop_lon']))
            for c, (an, x0, y0, x1, y1) in terminos.items():
                if x0 <= x <= x1 and y0 <= y <= y1 and T.dentro(x, y, an):
                    cuenta[c][z] += 1
    return cuenta


def main():
    comprobar()
    cuenta = zonas()
    out = {'_meta': {
        'fuentes': {'precios': BOCM, 'tarifas': TARIFAS, 'zonas': 'https://datos.crtm.es/'},
        'notas': ['Precio del título de 30 días, perfil normal, ordinario, con los descuentos aplicables '
                  'desde el 1-1-2026 (BOCM 31-12-2025). El anual cuesta 10 veces el de 30 días.',
                  'Zona: la más repetida en el zone_id de las paradas de Metro, Metro Ligero y autobús '
                  'del GTFS del Consorcio que caen dentro del término. Cercanías no trae zone_id.'],
        'joven': JOVEN_30}}
    for c in IDS:
        z, n = cuenta[c].most_common(1)[0]
        out[c] = {'zona': z, 'abono30': PRECIO_30[z], 'paradas': dict(cuenta[c])}
        print(c, z, PRECIO_30[z], dict(cuenta[c]))
    (Path(__file__).resolve().parent / 'fuentes/abono.json').write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

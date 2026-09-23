"""Genera assets/qr.js: un QR por municipio, como trazo SVG embebido.

Se ejecuta a mano cuando cambie la URL o se añada un municipio:
    python3 herramientas/qr.py
Así la web no necesita ninguna librería de QR en el navegador ni pide
nada a un servidor de terceros.
"""
import json, re, subprocess, sys
import segno

BASE = 'https://siyovivieracomoenparla.netlify.app/'

def trazo(qr):
    """Un solo <path>, fusionando cada fila de módulos contiguos."""
    m = [list(f) for f in qr.matrix]
    n = len(m)
    partes = []
    for y, fila in enumerate(m):
        x = 0
        while x < n:
            if fila[x]:
                ancho = 1
                while x + ancho < n and fila[x + ancho]:
                    ancho += 1
                partes.append('M%d %dh%dv1h-%dz' % (x, y, ancho, ancho))
                x += ancho
            else:
                x += 1
    return ''.join(partes), n

# los municipios salen de datos.js, para no mantener dos listas
datos = open('datos/datos.js', encoding='utf-8').read()
ids = re.findall(r"\{ id: '([a-z-]+)', nombre:", datos)
if not ids:
    sys.exit('no he encontrado los municipios en datos/datos.js')

salida = {}
for mid in ids:
    url = BASE + '#' + mid
    qr = segno.make(url, error='m')
    d, n = trazo(qr)
    salida[mid] = {'d': d, 'n': n, 'url': url}
qr = segno.make(BASE, error='m')
d, n = trazo(qr)
salida['_'] = {'d': d, 'n': n, 'url': BASE}

js = ('/* GENERADO por herramientas/qr.py · no editar a mano.\n'
      '   Un QR por municipio, ya trazado, para que el cartel no dependa\n'
      '   de ninguna librería ni de ninguna petición externa. */\n'
      'window.QR = ' + json.dumps(salida, ensure_ascii=False, indent=1) + ';\n')
open('assets/qr.js', 'w', encoding='utf-8').write(js)
print('assets/qr.js ·', len(ids) + 1, 'códigos ·', len(js), 'bytes')
for k, v in salida.items():
    print('  %-12s %2dx%-2d  %s' % (k, v['n'], v['n'], v['url']))

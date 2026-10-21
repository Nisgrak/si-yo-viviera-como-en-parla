#!/usr/bin/env python3
"""Escribe datos/impuestos.js: lo que paga un vecino en impuestos municipales.

Lee herramientas/impuestos/impuestos.json, que escribe impuestos/impuestos.py
con los tipos de 2026 de Hacienda (IBI e impuesto de vehículos), el valor
catastral medio de las viviendas del Catastro y las ordenanzas de la tasa de
basuras. Se queda con lo que pinta la web:

    - la casa media de cada ciudad: su recibo del IBI y el impuesto de un coche
      de 12 a 15,99 caballos fiscales;
    - la misma casa en las once (el valor catastral mediano de las once), para
      que solo cambie lo que cobra cada ayuntamiento;
    - la tasa de basuras, aparte y con su nota, porque en 2026 no está clara en
      todas (Parla la tiene aprobada y ha anunciado que no la cobra; Alcorcón ha
      aplazado el cobro; Pinto no publica el coeficiente).

Aquí no se calcula nada más que sumas.

    python3 herramientas/impuestos.py
"""
import json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I = json.load(open(os.path.join(RAIZ, 'herramientas/impuestos/impuestos.json'), encoding='utf-8'))
F = I['fuentes']

# La nota corta de la tasa de basuras que sale en la página, con su fuente.
# Sale de las notas de impuestos.json; solo se dice lo que consta en ellas.
BASURAS = {
    'parla': ('aprobada para 2026, pero según la prensa el alcalde anunció en junio que no se '
              'cobrará; no hay acto oficial publicado que lo confirme.', 'parla_basuras'),
    'getafe': ('se cobra en 2026, con la misma ordenanza que en 2025.', 'getafe_basuras'),
    'leganes': ('no tiene tasa de basuras para viviendas en 2026.', 'leganes_calendario'),
    'fuenlabrada': ('se cobra en 2026.', 'fuenlabrada_basuras'),
    'mostoles': ('se cobra en 2026.', 'mostoles_basuras'),
    'alcorcon': ('aprobada, pero el cobro de 2026 se ha aplazado hasta julio de 2027.', 'alcorcon_aplazamiento'),
    'alcobendas': ('se cobra en 2026 (distrito Centro).', 'alcobendas_basuras'),
    'pinto': ('se cobra en 2026, pero depende de un coeficiente que el Ayuntamiento no publica: '
              'no se puede calcular.', 'pinto_basuras'),
    'torrejon': ('se cobra en 2026; la cifra es sin las reducciones por separar bien y domiciliar.', 'torrejon_basuras'),
    'pozuelo': ('se cobra en 2026; la cifra es una estimación a partir de las cuotas oficiales de su '
                'tramo de superficie.', 'pozuelo_estudio'),
    'majadahonda': ('se cobra en 2026.', 'majadahonda_basuras_2026'),
}

ciudades = {}
for cid, c in I['ciudades'].items():
    comun = I['caso_comun'][cid]
    nota, fid = BASURAS[cid]
    ciudades[cid] = {
        'tipo': c['ibi']['tipo'],
        'vc': round(c['ibi']['valorCatastralMedio']),
        'ibi': c['ibi']['recibo'],
        'coche': c['ivtm']['cuota12a16cv'],
        'comunIbi': comun['ibi'],
        'basuras': c['basuras']['importe'] if c['basuras']['cobra'] else 0,
        'basurasNota': nota,
        'basurasFuente': F[fid]['url'],
    }
    assert abs(comun['ivtm'] - c['ivtm']['cuota12a16cv']) < 0.01, cid

salida = {
    'anio': I['_meta']['anio'],
    'comun': {'vc': round(I['_meta']['caso_comun']['valorCatastral'])},
    'ciudades': ciudades,
    'fuentes': {
        'tipos': [F['hacienda_tipos']['titulo'], F['hacienda_tipos']['url']],
        'valor': [F['catastro_valor']['titulo'], F['catastro_valor']['url']],
    },
}
destino = os.path.join(RAIZ, 'datos/impuestos.js')
with open(destino, 'w', encoding='utf-8') as s:
    s.write('/* Escrito por herramientas/impuestos.py desde herramientas/impuestos/impuestos.json. No editar a mano. */\n')
    s.write('window.IMPUESTOS = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('datos/impuestos.js:', len(ciudades), 'ciudades,', salida['anio'])

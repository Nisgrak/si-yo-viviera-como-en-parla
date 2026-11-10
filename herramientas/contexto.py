#!/usr/bin/env python3
"""Escribe datos/contexto.js: cuatro datos sueltos que acompañan a otras secciones.

    estudios     INE, Indicadores Urbanos: población de 25 a 64 años con la ESO
                 como máximo, 2024 (educacion.html)
    esperanza    Instituto de Estadística de la Comunidad de Madrid: esperanza
                 de vida al nacer, total y por sexo, 2024; solo para municipios
                 de más de 100.000 habitantes (sanidad.html)
    pension      Instituto de Estadística de la Comunidad de Madrid, a partir
                 del INSS: pensión contributiva media por pensionista, a 1 de
                 enero de 2025 (economia.html)
    coches       Dirección General de Tráfico, publicado por el Instituto de
                 Estadística: antigüedad media de los turismos a 31-12-2025, y
                 turismos por cada 1.000 habitantes (infraestructura.html)

Descarga lo que falta a la carpeta de caché (por defecto herramientas/.cache/
contexto/, que no se sube) y no ejecuta nada de lo descargado. Los habitantes
para los turismos por cada 1.000 son los de datos/datos.js (INE, 1 de enero de
2025). Las páginas pintan lo que escribe este script; los turismos por 1.000 habitantes son una cuenta nuestra.

Uso:
    python3 -I herramientas/contexto.py [carpeta-de-caché]

Solo usa la biblioteca estándar.
"""
import csv
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'herramientas/.cache/contexto'
UA = {'User-Agent': 'Mozilla/5.0'}

IECM = 'https://datos.comunidad.madrid/dataset/'
DESCARGAS = {
    'esperanza.csv': IECM + '1da2283b-19c3-4f3f-b567-35bdd30ddb34/resource/1b5b713e-259f-43f3-8adc-7f7869a0d6b9/download/esperanza-de-vida-al-nacer-por-sexo-y-por-municipios-mayores-de-100.000-habitantes.csv',
    'pensiones.csv': IECM + '7d5b5938-e902-47bf-ae17-5b4e5daaf509/resource/827d76a0-9f30-4dc6-a4c9-5a392af05102/download/pensiones-contributivas-por-sexo.-municipios.csv',
    'antiguedad.csv': IECM + '665126a2-53a7-4de0-9b32-90c10e3c835e/resource/da932446-e4e2-4035-acdb-543db0b07526/download/transporte-por-carretera.-parque-de-vehiculos-por-antiguedad.-municipios.csv',
    'tipo.csv': IECM + 'e241373e-685b-48c0-8f43-15aa549218dc/resource/3ee4e302-1def-496a-96bf-e4574302c7f6/download/transporte-por-carretera.-parque-de-vehiculos-por-tipo-de-vehiculo.-municipios.csv',
    'ine69332.json': 'https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/69332?nult=3',
}

# Las páginas de cada conjunto, a donde enlaza el pie de fuente.
FUENTES = {
    'estudios': ['INE, Indicadores Urbanos: población de 25 a 64 años por nivel de estudios, 2024',
                 'https://www.ine.es/jaxiT3/Tabla.htm?t=69332'],
    'esperanza': ['Instituto de Estadística de la Comunidad de Madrid: esperanza de vida al nacer por sexo, municipios de más de 100.000 habitantes',
                  IECM + 'esperanza_vida_municipios_mayores_100000_hab_por_sexo'],
    'pension': ['Instituto de Estadística de la Comunidad de Madrid, a partir del Registro de Prestaciones Sociales Públicas (INSS): pensiones contributivas por sexo, municipios',
                IECM + 'pensiones_contributivas_por_sexo'],
    'coches': ['Dirección General de Tráfico, publicado por el Instituto de Estadística de la Comunidad de Madrid: parque de vehículos por antigüedad, municipios',
               IECM + 'parque_vehiculos_por_antiguedad'],
    'cochesTipo': ['Dirección General de Tráfico, publicado por el Instituto de Estadística de la Comunidad de Madrid: parque de vehículos por tipo de vehículo, municipios',
                   IECM + 'parque_vehiculos_por_tipo'],
}

# id de la web → nombre del municipio en las fuentes
NOMBRES = {
    'parla': 'Parla', 'getafe': 'Getafe', 'leganes': 'Leganés', 'fuenlabrada': 'Fuenlabrada',
    'mostoles': 'Móstoles', 'alcorcon': 'Alcorcón', 'alcobendas': 'Alcobendas', 'pinto': 'Pinto',
    'torrejon': 'Torrejón de Ardoz', 'pozuelo': 'Pozuelo de Alarcón', 'majadahonda': 'Majadahonda',
}
# Los dos municipios cuyo parque de turismos es de 2.500 por cada 1.000
# habitantes o más: la media de edad no es comparable (lo dice la propia fuente).
FUERA_COCHES = ['alcobendas', 'majadahonda']


def norm(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower().strip()


POR_NOMBRE = {norm(n): i for i, n in NOMBRES.items()}


def idde(nombre):
    return POR_NOMBRE.get(norm(nombre))


def traer():
    CACHE.mkdir(parents=True, exist_ok=True)
    for f, u in DESCARGAS.items():
        if not (CACHE / f).exists():
            print('descargando', f)
            (CACHE / f).write_bytes(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read())


def filas(f):
    with open(CACHE / f, encoding='utf-8-sig') as a:
        return list(csv.DictReader(a, delimiter=';'))


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def poblacion():
    txt = (RAIZ / 'datos/datos.js').read_text(encoding='utf-8')
    bl = txt[txt.index('valores:'):]
    bl = bl[:bl.index('}')]
    return {k: int(v) for k, v in re.findall(r'(\w+):\s*(\d+)', bl)}


def estudios():
    d = json.loads((CACHE / 'ine69332.json').read_text(encoding='utf-8'))
    val, cod = {}, {}
    for s in d:
        nm = s['Nombre']
        if 'ISCED 0, 1 ó 2' not in nm or not nm.endswith('Total. '):
            continue
        for i, n in NOMBRES.items():
            if nm.startswith(n + '. '):
                for x in s['Data']:
                    if x['Anyo'] == 2024:
                        val[i] = x['Valor']
                        cod[i] = s['COD']
    return {'anio': 2024, 'valores': val, 'series': cod, 'fuente': FUENTES['estudios']}


def esperanza():
    out = {'total': {}, 'hombres': {}, 'mujeres': {}}
    parla = {}
    for r in filas('esperanza.csv'):
        cn = r['Concepto']
        if ' en el municipio de ' not in cn:
            continue
        i = idde(cn.split(' en el municipio de ')[1])
        if not i:
            continue
        k = 'total' if 'ambos sexos' in cn else 'mujeres' if 'las mujeres' in cn else 'hombres'
        v = num(r['Valor'])
        if r['Año'] == '2024' and v is not None:
            out[k][i] = v
        if i == 'parla' and k == 'total' and v is not None:
            parla[int(r['Año'])] = v
    lo = min(parla, key=lambda a: parla[a])
    hi = max(parla, key=lambda a: parla[a])
    out['parla'] = {'desde': min(parla), 'min': [lo, parla[lo]], 'max': [hi, parla[hi]]}
    out.update({'anio': 2024, 'fuente': FUENTES['esperanza']})
    return out


def pension():
    out = {'total': {}, 'hombres': {}, 'mujeres': {}}
    for r in filas('pensiones.csv'):
        if r['Año'] != '2025' or r['Tipo territorio'] != 'Municipios' or not r['Medida'].startswith('Importe'):
            continue
        i = idde(r['Territorio'])
        if i:
            out[r['Sexo'].lower()][i] = num(r['Valor'])
    out.update({'fecha': '1 de enero de 2025', 'fuente': FUENTES['pension']})
    return out


def coches():
    pob = poblacion()
    an, tu = {}, {}
    for r in filas('antiguedad.csv'):
        if r['Año'] == '2025' and r['Tipo territorio'] == 'Municipios' and r['Antigüedad'] == 'Turismos':
            i = idde(r['Territorio'])
            if i:
                an[i] = num(r['Valor'])
    for r in filas('tipo.csv'):
        if r['Año'] == '2025' and r['Tipo territorio'] == 'Municipios' and r['Tipo'] == 'Turismos':
            i = idde(r['Territorio'])
            if i:
                tu[i] = num(r['Valor'])
    por1000 = {i: round(1000 * tu[i] / pob[i]) for i in tu}
    return {'fecha': '31 de diciembre de 2025', 'anios': an, 'por1000': por1000, 'fuera': FUERA_COCHES,
            'fuente': FUENTES['coches'], 'fuenteTipo': FUENTES['cochesTipo']}


if __name__ == '__main__':
    traer()
    salida = {'estudios': estudios(), 'esperanza': esperanza(), 'pension': pension(),
              'coches': coches()}
    for k, v in salida.items():
        for sub in ('valores', 'total', 'anios'):
            if sub in v:
                assert len(v[sub]) == (8 if k == 'esperanza' else 11), (k, sub, len(v[sub]))
    destino = RAIZ / 'datos/contexto.js'
    destino.write_text(
        '/* Escrito por herramientas/contexto.py. No editar a mano. */\n'
        'window.CONTEXTO = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n',
        encoding='utf-8')
    print('datos/contexto.js escrito')

#!/usr/bin/env python3
"""Pone al día con el Atlas de Distribución de Renta de los Hogares (ADRH) del
INE los datos de renta de la página de la vivienda:

    parque.json     renta por hogar y por persona, y tamaño medio del hogar
    alquiler.json   el esfuerzo: doce meses de alquiler mediano (SERPAVI)
                    entre la renta neta media por hogar, el mismo año
    barrios.json    la sección censal con menos renta por hogar y la que más

Lee las tablas de la provincia de Madrid en CSV (el INE las numera por
provincia: 31097 renta, 31105 indicadores demográficos):

    https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/31097.csv
    https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/31105.csv

Uso:
    python3 herramientas/vivienda/adrh.py [AÑO] [--trabajo DIR]

Descarga los dos CSV en DIR (por defecto, /tmp/adrh) si no están. Después,
python3 herramientas/vivienda.py. Solo usa la biblioteca estándar.
"""
import csv
import json
import sys
import urllib.request
from collections import Counter
from pathlib import Path

F = Path(__file__).resolve().parent / 'fuentes'
URL = 'https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/{}.csv'
INE = {'parla': '28106', 'getafe': '28065', 'leganes': '28074', 'fuenlabrada': '28058',
       'mostoles': '28092', 'alcorcon': '28007', 'alcobendas': '28006', 'pinto': '28113',
       'torrejon': '28148', 'pozuelo': '28115', 'majadahonda': '28080'}
# Un valor de renta por hogar repetido en más secciones que esto es un tope del INE.
TOPE_MIN = 20


def numero(t):
    t = t.strip()
    if t in ('', '.', '..'):
        return None
    return float(t.replace('.', '').replace(',', '.'))


def bajar(tabla, trabajo):
    p = trabajo / f'{tabla}.csv'
    if not p.exists():
        print('descargando', tabla)
        urllib.request.urlretrieve(URL.format(tabla), p)
    return p


def filas(p, anio):
    with open(p, encoding='utf-8-sig', newline='') as f:
        for r in csv.reader(f, delimiter=';'):
            if len(r) >= 5 and r[-2] == str(anio):
                yield r


def leer(nombre):
    return json.loads((F / f'{nombre}.json').read_text(encoding='utf-8'))


def escribir(nombre, d):
    (F / f'{nombre}.json').write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def main():
    args = sys.argv[1:]
    trabajo = Path('/tmp/adrh')
    if '--trabajo' in args:
        k = args.index('--trabajo')
        trabajo = Path(args[k + 1])
        del args[k:k + 2]
    anio = int(args[0]) if args else 2024
    trabajo.mkdir(parents=True, exist_ok=True)

    # Municipios: renta (31097) e indicadores demográficos (31105).
    mun = {i: {} for i in INE}
    cod = {v: k for k, v in INE.items()}
    secc = {i: {} for i in INE}
    todas = Counter()
    for r in filas(bajar(31097, trabajo), anio):
        m, dist, sec, ind, v = r[0][:5], r[1], r[2], r[3], numero(r[5])
        if ind == 'Renta neta media por hogar' and sec and v is not None:
            todas[v] += 1
            if m in cod:
                secc[cod[m]][sec.split(' ')[0]] = v
        if m in cod and not dist and not sec:
            mun[cod[m]][ind] = v
    for r in filas(bajar(31105, trabajo), anio):
        m, dist, sec, ind, v = r[0][:5], r[1], r[2], r[3], numero(r[5])
        if m in cod and not dist and not sec:
            mun[cod[m]][ind] = v

    tope, veces = max(todas.items(), key=lambda x: (x[0], x[1]))
    tope = tope if veces >= TOPE_MIN else None
    print('máximo por sección', max(todas), 'repetido', todas[max(todas)], 'veces; tope:', tope)

    parque, alquiler, barrios = leer('parque'), leer('alquiler'), leer('barrios')
    for i in INE:
        x = mun[i]
        a = parque[i]['adrh']
        a.update({
            'anyo': anio,
            'renta_neta_media_por_hogar': round(x['Renta neta media por hogar']),
            'renta_neta_media_por_persona': round(x['Renta neta media por persona']),
            'renta_bruta_media_por_hogar': round(x['Renta bruta media por hogar']),
            'renta_bruta_media_por_persona': round(x['Renta bruta media por persona']),
            'media_renta_por_unidad_consumo': round(x['Media de la renta por unidad de consumo']),
            'mediana_renta_por_unidad_consumo': round(x['Mediana de la renta por unidad de consumo']),
            'tamano_medio_hogar': x['Tamaño medio del hogar'],
            'pct_hogares_unipersonales': x['Porcentaje de hogares unipersonales'],
        })

        # El esfuerzo, con el alquiler de SERPAVI del mismo año.
        sp = alquiler[i]['serpavi']['serie'][str(anio)]
        renta, mes = a['renta_neta_media_por_hogar'], sp['renta_mediana_mes_eur_colectiva']
        alquiler[i].pop('esfuerzo_2023_calc', None)
        alquiler[i]['esfuerzo_calc'] = {
            'anio': anio,
            'renta_neta_media_hogar_eur_adrh': renta,
            'serpavi_renta_mediana_mes_colectiva': mes,
            'pct_serpavi_mediana_colectiva_x12_sobre_renta_hogar_calc': round(mes * 12 / renta * 100, 1),
        }

        s = secc[i]
        lo, hi = min(s, key=s.get), max(s, key=s.get)
        barrios[i]['renta'] = {'anio': anio, 'secciones': len(s),
                               'min': {'seccion': lo, 'eur': s[lo]}, 'max': {'seccion': hi, 'eur': s[hi]},
                               'tope': tope is not None and s[hi] == tope}

    parque['_meta'].setdefault('notas', [])
    alquiler['_meta']['esfuerzo'] = (f'esfuerzo_calc: SERPAVI {anio}, renta mediana mensual de vivienda colectiva, '
                                     f'por 12, entre la renta neta media por hogar del ADRH {anio}. Lo escribe '
                                     'herramientas/vivienda/adrh.py.')
    barrios['_meta']['notas'] = [n for n in barrios['_meta']['notas'] if not n.startswith('Renta:')] + [
        f'Renta: renta neta media por hogar {anio} por sección censal (ADRH, tabla 31097). '
        + (f'{entero(tope)} € aparece repetido en {todas[tope]} secciones de la Comunidad: se trata como tope y, '
           'si el máximo de una ciudad es ese valor, la distancia no se calcula.' if tope else
           'Ningún valor se repite lo bastante para parecer un tope.')]
    for n, d in (('parque', parque), ('alquiler', alquiler), ('barrios', barrios)):
        escribir(n, d)
    for i in INE:
        print(i, mun[i]['Renta neta media por hogar'], mun[i]['Tamaño medio del hogar'],
              alquiler[i]['esfuerzo_calc']['pct_serpavi_mediana_colectiva_x12_sobre_renta_hogar_calc'],
              barrios[i]['renta']['min']['eur'], barrios[i]['renta']['max']['eur'], barrios[i]['renta']['tope'])


def entero(v):
    return f'{v:,.0f}'.replace(',', '.')


if __name__ == '__main__':
    main()

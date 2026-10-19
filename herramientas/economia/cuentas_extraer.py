#!/usr/bin/env python3
"""Las cuentas del ayuntamiento: deuda que se paga, gasto por área, ingresos por
capítulo, remanente y ahorro (CONPREL, liquidaciones 2021-2024) y periodo medio de
pago a proveedores (Hacienda, PMP de las entidades locales).

Solo biblioteca estándar + `mdb-export` (mdbtools) por subprocess.

Uso:
    python3 -I herramientas/economia/cuentas_extraer.py \
        --bruto /tmp/claude-1000/economia-cuentas \
        --trabajo /var/tmp/economia-cuentas \
        --salida herramientas/economia/fuentes/cuentas.json

--bruto   descargas (zip de CONPREL, xlsx del PMP).
--trabajo bases Access descomprimidas (≈1,7 GB los cuatro años: no caben en un
          /tmp de 2 GB en memoria) y CSV filtrados a la provincia 28 como caché.

Método (el mismo del README, «CONPREL» y «Servicios sociales»):
  * tb_economica_cons y tb_funcional_cons (consolidado ayuntamiento + organismos
    autónomos), columna importer = obligaciones reconocidas netas (gastos) o
    derechos reconocidos netos (ingresos).
  * Capítulo N = fila de cuenta «N» de tb_economica_cons, que ya incluye la fila
    «Nt» (ajuste de consolidación): no se suma aparte.
  * Por habitante con la población INE a 1-1-2025 de BASES.total (datos/datos.js),
    la misma todos los años; media simple de los ejercicios disponibles (Pozuelo:
    2021 y 2024).
  * Media de la Comunidad: cada año, suma de todos los ayuntamientos de la
    provincia 28 que liquidaron entre la suma de su población (tb_inventario de
    ese ejercicio); media simple de los cuatro años. Con y sin Madrid capital
    (28079).
"""
import argparse
import csv
import io
import json
import os
import re
import subprocess
import sys
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ANIOS = [2021, 2022, 2023, 2024]
URL_CONPREL = ('https://serviciostelematicosext.hacienda.gob.es/SGFAL/CONPREL/Consulta/'
               'DescargaFichero?CCAA=&TipoDato=Liquidaciones&Ejercicio={a}&TipoPublicacion=Access')
URL_PMP_CONSULTA = ('https://serviciostelematicosext.hacienda.gob.es/SGCIEF/PMP_NET/aspx/'
                    'consulta/consulta.aspx?tipoPublicacion=2')
URL_PMP = ('https://serviciostelematicosext.hacienda.gob.es/SGCIEF/PMP_NET/aspx/consulta/'
           'descarga.aspx?ejercicio={a}&periodo={p}&tipoPublicacion=2&fichero={f}')

MUNICIPIOS = {
    'parla': '28106', 'getafe': '28065', 'leganes': '28074', 'fuenlabrada': '28058',
    'mostoles': '28092', 'alcorcon': '28007', 'alcobendas': '28006', 'pinto': '28113',
    'torrejon': '28148', 'pozuelo': '28115', 'majadahonda': '28080',
}
CAPITAL = '28079'
AREAS = {
    '0': 'deuda_publica', '1': 'servicios_publicos_basicos',
    '2': 'proteccion_promocion_social', '3': 'bienes_publicos_preferentes',
    '4': 'actuaciones_economicas', '9': 'actuaciones_generales',
}
TABLAS = ['tb_inventario', 'tb_economica_cons', 'tb_funcional_cons', 'tb_remanente']

# PMP: últimos 12 meses publicados (agosto 2025 - julio 2026). Los meses de fin de
# trimestre solo vienen en el fichero «Cesión y variables» (fichero2).
MESES = ['Enero', 'febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
         'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']


def descargar(url, destino):
    destino = Path(destino)
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=600) as r, open(destino, 'wb') as f:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b)
    return destino


def base_access(bruto, trabajo, anio):
    d = Path(trabajo) / str(anio)
    encontrados = sorted(list(d.glob('*.mdb')) + list(d.glob('*.accdb'))) if d.exists() else []
    if encontrados:
        return encontrados[0]
    z = descargar(URL_CONPREL.format(a=anio), Path(bruto) / f'liq{anio}.zip')
    d.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(z) as zf:
        zf.extractall(d)
    return sorted(list(d.glob('*.mdb')) + list(d.glob('*.accdb')))[0]


def exportar_madrid(mdb, tabla, ids, cache):
    """mdb-export de una tabla filtrada a la provincia 28, con caché en CSV."""
    cache = Path(cache)
    if cache.exists():
        with open(cache, newline='', encoding='utf-8') as f:
            return list(csv.DictReader(f))
    p = subprocess.Popen(['mdb-export', str(mdb), tabla], stdout=subprocess.PIPE,
                         text=True, encoding='utf-8', errors='replace')
    lector = csv.DictReader(p.stdout)
    filas = []
    for fila in lector:
        if tabla == 'tb_inventario':
            if fila['codbdgel'].startswith('28'):
                filas.append(fila)
        elif fila['id'] in ids:
            filas.append(fila)
    if p.wait() != 0:
        sys.exit(f'mdb-export falló: {mdb} {tabla}')
    tmp = cache.with_suffix('.tmp')
    with open(tmp, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=lector.fieldnames)
        w.writeheader()
        w.writerows(filas)
    tmp.rename(cache)
    return filas


def poblacion_bases(datos_js):
    txt = Path(datos_js).read_text(encoding='utf-8')
    bloque = re.search(r'total:\s*\{.*?valores:\s*\{(.*?)\}', txt, re.S).group(1)
    return {k: int(v) for k, v in re.findall(r'(\w+):\s*(\d+)', bloque)}


def cargar_anio(bruto, trabajo, anio):
    mdb = base_access(bruto, trabajo, anio)
    cache = Path(trabajo) / 'csv28'
    cache.mkdir(parents=True, exist_ok=True)
    inv = exportar_madrid(mdb, 'tb_inventario', None, cache / f'{anio}_tb_inventario.csv')
    ayto = {}   # id del grupo -> (código INE, población, nombre)
    for f in inv:
        cod = f['codbdgel'].strip()
        if re.fullmatch(r'28\d{3}AA000', cod) and f['idente'] == f['id']:
            ayto[f['id']] = (cod[:5], int(float(f['poblacion'] or 0)), f['nombreppal'].strip())
    ids = set(ayto)
    eco = exportar_madrid(mdb, 'tb_economica_cons', ids, cache / f'{anio}_tb_economica_cons.csv')
    fun = exportar_madrid(mdb, 'tb_funcional_cons', ids, cache / f'{anio}_tb_funcional_cons.csv')
    rem = exportar_madrid(mdb, 'tb_remanente', ids, cache / f'{anio}_tb_remanente.csv')

    datos = {}  # código INE -> dict de importes en euros
    for i, (ine, pob, nombre) in ayto.items():
        datos[ine] = {'_pob_inventario': pob, '_nombre': nombre, '_id': i,
                      'G': {}, 'I': {}, 'F': {}, 'R': {}}
    por_id = {i: ayto[i][0] for i in ayto}
    for f in eco:
        ine = por_id[f['id']]
        cta = f['cdcta'].strip()
        datos[ine][f['tipreig'].strip()][cta] = float(f['importer'] or 0)
    for f in fun:
        ine = por_id[f['id']]
        clave = (f['cdcta'].strip(), f['cdfgr'].strip())
        datos[ine]['F'][clave] = datos[ine]['F'].get(clave, 0.0) + float(f['importe'] or 0)
    for f in rem:
        # Solo la entidad principal (el ayuntamiento), sin organismos autónomos:
        # el remanente no se consolida en la fuente.
        if f['idente'] != f['id']:
            continue
        datos[por_id[f['id']]]['R'][f['cdrmte'].strip()] = float(f['importe'] or 0)
    return datos


def cap(d, tipo, n):
    """Capítulo n consolidado. La fila «n» ya incluye el ajuste «nt»."""
    return d[tipo].get(str(n), 0.0)


def indicadores(d):
    """Importes en euros de un ayuntamiento en un ejercicio."""
    g = {n: cap(d, 'G', n) for n in range(1, 10)}
    i = {n: cap(d, 'I', n) for n in range(1, 10)}
    gasto_total = sum(g.values())
    r = {
        'gasto_total': gasto_total,
        'g3_intereses': g[3],
        'g3_art31_intereses_deuda': d['G'].get('31', 0.0),
        'g3_art35_intereses_demora_otros': d['G'].get('35', 0.0),
        'g9_amortizacion': g[9],
        'deuda_3_mas_9': g[3] + g[9],
        'g6_inversion': g[6],
        'i1_directos': i[1], 'i2_indirectos': i[2], 'i3_tasas': i[3],
        'i123_propios': i[1] + i[2] + i[3],
        'i4_transf_corrientes': i[4],
        'i4_art42_estado': d['I'].get('42', 0.0),
        'i7_transf_capital': i[7],
        'i9_pasivos_financieros': i[9],
        'ingreso_total': sum(i.values()),
        # Ahorro calculado sobre la liquidación (no es el ahorro neto legal del
        # art. 53 TRLRHL, que usa la anualidad teórica de amortización).
        'ingresos_corrientes_1a5': sum(i[n] for n in range(1, 6)),
        'gastos_corrientes_1a4': sum(g[n] for n in range(1, 5)),
    }
    r['ahorro_bruto'] = r['ingresos_corrientes_1a5'] - r['gastos_corrientes_1a4']
    r['ahorro_neto_liquidacion'] = r['ahorro_bruto'] - g[9]
    areas = {}
    for (c, area), v in d['F'].items():
        if len(area) == 1 and len(c) == 1:
            areas[area] = areas.get(area, 0.0) + v
    for k, nombre in AREAS.items():
        r['area_' + k + '_' + nombre] = areas.get(k, 0.0)
    r['_suma_areas'] = sum(areas.values())
    r['_areas_raras'] = {k: v for k, v in areas.items() if k not in AREAS}
    rem = d['R']
    r['remanente_gg'] = rem.get('0')
    r['remanente_gg_ajustado'] = rem.get('1')
    return r


CAMPOS_HAB = ['gasto_total', 'g3_intereses', 'g3_art31_intereses_deuda',
              'g3_art35_intereses_demora_otros', 'g9_amortizacion', 'deuda_3_mas_9',
              'g6_inversion', 'i1_directos', 'i2_indirectos', 'i3_tasas', 'i123_propios',
              'i4_transf_corrientes', 'i4_art42_estado', 'i7_transf_capital',
              'i9_pasivos_financieros', 'ingreso_total', 'ahorro_bruto', 'ahorro_neto_liquidacion',
              'remanente_gg', 'remanente_gg_ajustado'] + \
             ['area_' + k + '_' + v for k, v in AREAS.items()]


PCTS = [('pct_deuda_sobre_gasto', 'deuda_3_mas_9'),
        ('pct_intereses_sobre_gasto', 'g3_intereses'),
        ('pct_amortizacion_sobre_gasto', 'g9_amortizacion')]


def r2(x):
    return None if x is None else round(x, 2)


def media(vals):
    vals = [v for v in vals if v is not None]
    return sum(vals) / len(vals) if vals else None


NOTAS = [
    'Importes de CONPREL: liquidaciones, consolidado (tb_economica_cons y tb_funcional_cons, ayuntamiento + organismos autónomos), columna importer: obligaciones reconocidas netas (gastos) y derechos reconocidos netos (ingresos). La fila del capítulo ya incluye el ajuste de consolidación «Nt».',
    'Por habitante: población INE a 1-1-2025 (BASES.total de datos/datos.js), la misma para los cuatro ejercicios. media_2021_2024 = media simple de los ejercicios publicados. Pozuelo de Alarcón: solo 2021 y 2024 (Hacienda no publica sus liquidaciones de 2022 y 2023).',
    'Media de la Comunidad: cada año, suma de todos los ayuntamientos de la provincia 28 con liquidación (152-158) entre la suma de su población en tb_inventario de ese ejercicio; luego media simple de los cuatro años. Reproduce 1.345/1.032 € de gasto y 139/112 € de inversión del README. Los porcentajes de la media son el cociente de las sumas de cada año.',
    'Deuda: capítulo 3 (gastos financieros) + capítulo 9 (pasivos financieros, amortización). El capítulo 3 no es todo deuda: el artículo 35 son intereses de demora y otros gastos financieros (sentencias, pagos tarde), que en Parla superan a los intereses de préstamos (artículo 31) en la media 2021-2024. Se dan por separado. El capítulo 9 recoge también amortizaciones anticipadas y refinanciaciones, de ahí los saltos (Móstoles 2021, Fuenlabrada 2021).',
    'Áreas de gasto (primer dígito de la clasificación por programas, tb_funcional_cons): la suma de las seis áreas cuadra al céntimo con el gasto total en los 11 y los cuatro años. Pero el reparto entre áreas 1, 4 y 9 no es comparable: Parla apunta el tranvía en la 44 (transporte, ~104 €/hab, área 4) y Pinto las vías públicas en la 45 (~127 €/hab, área 4) que otros llevan a la 15 (área 1). El área 0 es solo intereses de préstamos y amortización; los intereses de demora suelen ir al área 9. Solo el área 2 (ya usada como política 23) y, con cautela, la 3 aguantan.',
    'Ingresos: capítulos 1+2+3 = lo propio (impuestos directos, indirectos, tasas y otros ingresos). Capítulo 4 = transferencias corrientes; artículo 42 = del Estado (sobre todo participación en tributos). Capítulo 7 = transferencias de capital (volátil). ingreso_total incluye el capítulo 9 (préstamos recibidos): no es un indicador de financiación.',
    'Ahorro bruto = ingresos corrientes (cap. 1-5) − gastos corrientes (cap. 1-4); ahorro_neto_liquidacion = ahorro bruto − capítulo 9. Calculado por nosotros sobre la liquidación: NO es el ahorro neto legal del art. 53 TRLRHL (que usa la anualidad teórica de amortización) ni el que Hacienda publica.',
    'Remanente de tesorería: tb_remanente, solo la entidad principal (el ayuntamiento, sin organismos autónomos; la fuente no lo consolida). remanente_gg = cuenta 0 (para gastos generales), remanente_gg_ajustado = cuenta 1 (descontadas las obligaciones pendientes de aplicar al presupuesto). Es un saldo a 31 de diciembre: el dato a usar es el de 2024, no la media.',
    'PMP: Hacienda, PMP_NET, informe ejecutivo mensual (RD 635/2014), columna «Periodo Medio de Pago» de la fila del ayuntamiento (código 12-28-XXX-A-A-000). Los meses de marzo, junio, septiembre y diciembre solo están en el fichero «Cesión y variables». Pinto y Majadahonda están en el modelo de variables y solo publican trimestralmente: su media es de 4 trimestres (T3 2025-T2 2026). Media simple, no ponderada por importe. El máximo legal es 30 días.',
]


# ---------------------------------------------------------------- PMP (xlsx)
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def leer_xlsx(path):
    def col(ref):
        n = 0
        for ch in re.match(r'[A-Z]+', ref).group():
            n = n * 26 + ord(ch) - 64
        return n - 1
    z = zipfile.ZipFile(path)
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(NS + 'si'):
            ss.append(''.join(t.text or '' for t in si.iter(NS + 't')))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    nombres = [s.get('name') for s in wb.find(NS + 'sheets')]
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    destino = {r.get('Id'): r.get('Target') for r in rels}
    rid = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
    hojas = {}
    for s, nombre in zip(wb.find(NS + 'sheets'), nombres):
        ruta = 'xl/' + destino[s.get(rid)].lstrip('/').replace('xl/', '')
        filas = []
        for row in ET.fromstring(z.read(ruta)).iter(NS + 'row'):
            vals = {}
            for c in row.findall(NS + 'c'):
                v = c.find(NS + 'v')
                if v is None:
                    continue
                vals[col(c.get('r'))] = ss[int(v.text)] if c.get('t') == 's' else v.text
            if vals:
                filas.append([vals.get(i) for i in range(max(vals) + 1)])
        hojas[nombre] = filas
    return hojas


def pmp_fichero(bruto, anio, mes, fichero):
    url = URL_PMP.format(a=anio, p=mes, f=fichero)
    path = descargar(url, Path(bruto) / 'pmp' / f'{anio}-{mes}-{fichero}.xlsx')
    hojas = leer_xlsx(path)
    out = {}
    for hoja, filas in hojas.items():
        if hoja not in ('Cesión', 'Variables'):
            continue
        for f in filas:
            if len(f) > 10 and f[3] and re.fullmatch(r'\d\d-28-\d{3}-A-A-000', str(f[3])):
                ine = '28' + f[3][6:9]
                try:
                    out[ine] = (hoja, float(f[10]))
                except (TypeError, ValueError):
                    out[ine] = (hoja, None)
    return url, out


def pmp(bruto):
    # Agosto 2025 - julio 2026: los 12 últimos meses publicados a 19-10-2026.
    periodos = [(2025, m) for m in range(8, 13)] + [(2026, m) for m in range(1, 8)]
    urls, serie = [], {k: [] for k in MUNICIPIOS}
    for anio, m in periodos:
        trimestral = m in (3, 6, 9, 12)
        fichero = 'fichero2' if trimestral else 'fichero1'
        url, datos = pmp_fichero(bruto, anio, MESES[m - 1], fichero)
        urls.append(url)
        for k, ine in MUNICIPIOS.items():
            if ine in datos:
                hoja, v = datos[ine]
                serie[k].append({'periodo': f'{anio}-{m:02d}', 'modelo': hoja, 'pmp_dias': v})
    res = {}
    for k, s in serie.items():
        vals = [x['pmp_dias'] for x in s if x['pmp_dias'] is not None]
        res[k] = {
            'ultimo_periodo': s[-1]['periodo'] if s else None,
            'ultimo_pmp_dias': s[-1]['pmp_dias'] if s else None,
            'modelo': s[-1]['modelo'] if s else None,
            'n_periodos': len(vals),
            'media_12_meses_dias': r2(media(vals)),
            'serie': s,
        }
    return urls, res


# ---------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bruto', default='/tmp/claude-1000/economia-cuentas')
    ap.add_argument('--trabajo', default='/var/tmp/economia-cuentas')
    ap.add_argument('--datos', default=str(Path(__file__).resolve().parents[2] / 'datos' / 'datos.js'))
    ap.add_argument('--salida', default=str(Path(__file__).resolve().parent / 'fuentes' / 'cuentas.json'))
    args = ap.parse_args()

    pob = poblacion_bases(args.datos)
    por_anio = {a: cargar_anio(args.bruto, args.trabajo, a) for a in ANIOS}

    salida = {'_meta': {}}

    # Media de la Comunidad: Σ importes / Σ población del inventario, cada año.
    medias = {'con_capital': {}, 'sin_capital': {}}
    for clave, excluir in (('con_capital', set()), ('sin_capital', {CAPITAL})):
        anual = {}
        for a, datos in por_anio.items():
            sel = {ine: d for ine, d in datos.items() if ine not in excluir and (d['G'] or d['I'])}
            pob_tot = sum(d['_pob_inventario'] for d in sel.values())
            ind = {ine: indicadores(d) for ine, d in sel.items()}
            fila = {'municipios': len(sel), 'poblacion': pob_tot}
            for c in CAMPOS_HAB:
                if c.startswith('remanente'):
                    continue  # no es consolidado; sin media regional
                fila[c] = r2(sum(i[c] for i in ind.values()) / pob_tot)
            gt = sum(i['gasto_total'] for i in ind.values())
            for nombre, campo in PCTS:
                fila[nombre] = r2(100 * sum(i[campo] for i in ind.values()) / gt)
            anual[str(a)] = fila
        m = {c: r2(media([anual[str(a)].get(c) for a in ANIOS]))
             for c in CAMPOS_HAB + [n for n, _ in PCTS] if not c.startswith('remanente')}
        medias[clave] = {'por_anio': anual, 'media_2021_2024': m}
    salida['media'] = medias

    controles = []
    for k, ine in MUNICIPIOS.items():
        anual = {}
        for a, datos in por_anio.items():
            d = datos.get(ine)
            if not d or not (d['G'] or d['I']):
                continue
            ind = indicadores(d)
            fila = {'euros': {c: r2(v) for c, v in ind.items() if not c.startswith('_')}}
            fila['por_habitante'] = {c: r2(ind[c] / pob[k]) if ind[c] is not None else None
                                     for c in CAMPOS_HAB}
            for nombre, campo in PCTS:
                fila[nombre] = r2(100 * ind[campo] / ind['gasto_total'])
            if abs(ind['_suma_areas'] - ind['gasto_total']) > 1:
                controles.append(f'{k} {a}: suma de áreas {ind["_suma_areas"]:.2f} ≠ gasto {ind["gasto_total"]:.2f}')
            if ind['_areas_raras']:
                controles.append(f'{k} {a}: áreas fuera del catálogo {ind["_areas_raras"]}')
            anual[str(a)] = fila
        anios = sorted(anual)
        m = {c: r2(media([anual[a]['por_habitante'][c] for a in anios])) for c in CAMPOS_HAB}
        for c, _ in PCTS:
            m[c] = r2(media([anual[a][c] for a in anios]))
        salida[k] = {'ine': ine, 'poblacion_ine_2025': pob[k], 'anios': anios,
                     'por_anio': anual, 'media_2021_2024': m}

    urls_pmp, res_pmp = pmp(args.bruto)
    for k in MUNICIPIOS:
        salida[k]['pmp'] = res_pmp[k]

    salida['_meta'] = {
        'extraido': '2026-10-19',
        'fuentes': {
            'conprel_liquidaciones': {str(a): URL_CONPREL.format(a=a) for a in ANIOS},
            'conprel_consulta': 'https://serviciostelematicosext.hacienda.gob.es/SGFAL/CONPREL',
            'pmp_consulta': URL_PMP_CONSULTA,
            'pmp_ficheros': urls_pmp,
            'poblacion': 'datos/datos.js, BASES.total (INE, cifras oficiales del Padrón a 1-1-2025)',
        },
        'controles': controles,
        'notas': NOTAS,
    }
    Path(args.salida).parent.mkdir(parents=True, exist_ok=True)
    Path(args.salida).write_text(json.dumps(salida, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('escrito', args.salida)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Escribe datos/economia.js: el trabajo, la renta, las empresas y las cuentas
del ayuntamiento de cada ciudad.

Lee las tablas ya extraídas de las fuentes oficiales, una por tema, en
herramientas/economia/fuentes/ (cada .json lleva sus URL y cada .md sus
cautelas y lo que no se pudo conseguir):

    trabajo.json     Comunidad de Madrid (Seguridad Social): afiliados por
                     centro de trabajo y por residencia; INE, Censo anual:
                     lugar de trabajo y población de 16 a 64 años; SEPE: paro
                     registrado y contratos
    ocupacion.json   INE, Censo anual: los vecinos que trabajan, por
                     ocupación (lo escribe economia/ocupacion.py)
    renta.json       INE, Atlas de Distribución de Renta de los Hogares:
                     renta, fuentes de ingreso y desigualdad; Agencia
                     Tributaria: IRPF por municipios
    empresas.json    INE, DIRCE: empresas activas; Comunidad de Madrid: PIB
                     municipal por rama
    cuentas.json     Ministerio de Hacienda, CONPREL: liquidaciones de 2021 a
                     2024; periodo medio de pago a proveedores

y se queda con lo que pinta la web. Las cuentas que hace aquí son las que
cita la página, y nada más.

Uso:
    python3 herramientas/economia.py

Solo usa la biblioteca estándar.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / 'herramientas/economia/fuentes'

IDS = ['parla', 'getafe', 'leganes', 'fuenlabrada', 'mostoles', 'alcorcon',
       'alcobendas', 'pinto', 'torrejon', 'pozuelo', 'majadahonda']

PUESTOS_DESDE, PUESTOS_HASTA = 2013, 2025
PARO_DESDE, PARO_HASTA = 2015, 2025
RENTA_DESDE, RENTA_HASTA = 2015, 2024


def leer(nombre):
    p = F / f'{nombre}.json'
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


def serie(d, desde, hasta, clave=None):
    """Una lista de desde a hasta; None donde falta el año."""
    out = []
    for a in range(desde, hasta + 1):
        v = d.get(str(a))
        if clave is not None and v is not None:
            v = v.get(clave)
        out.append(v)
    return out


def trabajo(t):
    dt = t['detalle']
    p25 = dt['paro_2025_media']
    um = dt['paro_ultimo_mes']
    c = dt['contratos_2025']
    censo = dt['censo_lugar_trabajo']['2023']
    return {
        'puestos': serie(dt['afiliados_serie'], PUESTOS_DESDE, PUESTOS_HASTA, 'puestos_por_100_residentes'),
        'enCentro': t['afiliados_lugar_trabajo_31dic2025'],
        'residentes': t['afiliados_residentes_1ene2026'],
        'mismoMun': censo['pct_mismo_municipio'],
        'ocupados': censo['ocupados_residentes'],
        'enSuCiudad': censo['trabajan_mismo_municipio'],
        'paro': serie(dt['paro_serie_media_anual'], PARO_DESDE, PARO_HASTA, 'paro_pct_16_64'),
        'parados': round(p25['total']),
        'paroJoven': p25['paro_menores25_pct_16_24'],
        'paroMujer': p25['paro_mujeres_pct_mujeres_16_64'],
        'pctMujeres': p25['pct_mujeres_sobre_parados'],
        'ultimoMes': {'mes': um['mes'], 'n': um['total'], 'pct': um['paro_pct_16_64']},
        'contratos': c['total'],
        'indefinidos': c['pct_indefinidos'],
    }


def ocupacion(o, anio='2023'):
    """De cada 100 vecinos ocupados cuya ocupación consta, los de cada gran
    grupo de la CNO-11, del 1 al 9, y cuántos no la tienen."""
    d = o[anio]
    conocidos = d['total'] - d['no_consta']
    return {
        'pct': [round(100 * d[str(k)] / conocidos, 2) for k in range(1, 10)],
        'n': d['total'],
        'sinOcupacion': d['no_consta'],
    }


def renta(r):
    a = r['adrh']
    i = r['irpf_2024']
    fi = a['fuentes_ingreso_pct_renta_bruta_2024']
    return {
        'persona': serie(a['renta_neta_media_persona'], RENTA_DESDE, RENTA_HASTA),
        'hogar': a['renta_neta_media_hogar'][str(RENTA_HASTA)],
        'fuentes': [fi['salario'], fi['pensiones'], fi['prestaciones_desempleo'],
                    fi['otras_prestaciones'], fi['otros_ingresos']],
        'gini': a['gini_2024'],
        'p80p20': a['p80_p20_2024'],
        'irpf': {
            'bruta': i['renta_bruta_media'],
            'disponible': i['renta_disponible_media'],
            'trabajo': i['rto_trabajo_neto_reducido_media'],
            'declarativo': i['indice_declarativo'],
        },
    }


def empresas(e):
    rm = e['pct_pib_ramas_2023']
    return {
        'por1000': e['empresas_por_1000hab_2025'],
        'n': e['empresas_2025'],
        'sectores': [e['pct_empresas_industria_2025'], e['pct_empresas_construccion_2025'],
                     e['pct_empresas_comercio_transporte_hosteleria_2025'],
                     e['pct_empresas_resto_servicios_2025']],
        'pib': [e['pib_pc_serie_base2021'][str(a)] for a in (2021, 2022, 2023)],
        'pibRamas': [rm['industria_energia'], rm['construccion'],
                     round(100 - rm['industria_energia'] - rm['construccion'], 2)],
        'afilConstruccion': e['pct_afiliados_construccion_31dic2025'],
    }


def cuentas(c):
    m = c['media_2021_2024']
    r24 = c['por_anio'].get('2024', {}).get('por_habitante', {})
    pmp = c['pmp']
    return {
        'intereses': m['g3_intereses'],
        'demora': m['g3_art35_intereses_demora_otros'],
        'amortizacion': m['g9_amortizacion'],
        'deuda': m['deuda_3_mas_9'],
        'pctDeuda': m['pct_deuda_sobre_gasto'],
        'propios': m['i123_propios'],
        'directos': m['i1_directos'],
        'tasas': m['i3_tasas'],
        'estado': m['i4_art42_estado'],
        # El remanente es un saldo a 31 de diciembre: vale el último, no la media.
        'remanente': r24['remanente_gg'],
        'remanenteAjustado': r24['remanente_gg_ajustado'],
        'remanenteEuros': {a: c['por_anio'][a]['euros']['remanente_gg_ajustado']
                           for a in ('2021', '2024') if a in c['por_anio']},
        'prestamos2223': sum(c['por_anio'][a]['euros']['i9_pasivos_financieros']
                             for a in ('2022', '2023') if a in c['por_anio']),
        'pmp': pmp['media_12_meses_dias'],
        'pmpUltimo': pmp['ultimo_pmp_dias'],
        'pmpPeriodo': pmp['ultimo_periodo'],
        'pmpN': pmp['n_periodos'],
    }


def main():
    tr, re, em, cu, oc = (leer(n) for n in ('trabajo', 'renta', 'empresas', 'cuentas', 'ocupacion'))

    ciudades = {}
    for i in IDS:
        c = {
            'trabajo': trabajo(tr[i]),
            'ocupacion': ocupacion(oc[i]),
            'renta': renta(re[i]),
            'empresas': empresas(em[i]),
        }
        if cu and i in cu:
            c['cuentas'] = cuentas(cu[i])
        ciudades[i] = c

    # Las fuentes que cita la página, con el enlace de cada .json.
    def f(d, k):
        return d['_meta']['fuentes'][k]
    fuentes = {
        'afilCentro': ['Comunidad de Madrid · Afiliados a la Seguridad Social por ubicación del centro de trabajo',
                       f(tr, 'afiliados_lugar_trabajo')],
        'afilResidencia': ['Comunidad de Madrid · Afiliados a la Seguridad Social por lugar de residencia',
                           f(tr, 'afiliados_residencia')],
        'censoTrabajo': ['INE · Censo anual de población: lugar de trabajo, 2023', f(tr, 'censo_lugar_trabajo')],
        'censoOcupacion': ['INE · Censo anual de población: ocupados por ocupación, 2023',
                           oc['_meta']['fuentes']['censo_ocupacion']],
        'censoEdad': ['INE · Censo anual de población por edad, 2021-2025', f(tr, 'censo_anual_edad')],
        'sepeParo': ['SEPE · Paro registrado por municipios', f(tr, 'sepe_paro_ficha')],
        'sepeContratos': ['SEPE · Contratos registrados por municipios, 2025', f(tr, 'sepe_contratos_ficha')],
        'adrh': ['INE · Atlas de Distribución de Renta de los Hogares, 2015-2024', f(re, 'adrh_31097')],
        'adrhFuentes': ['INE · Atlas de renta: fuentes de ingreso, 2024', f(re, 'adrh_31098')],
        'adrhGini': ['INE · Atlas de renta: Gini y P80/P20, 2024', f(re, 'adrh_37727')],
        'irpf': ['Agencia Tributaria · Estadística de los declarantes del IRPF por municipios, 2024',
                 f(re, 'aeat_irpf_municipios_2024')],
        'dirce': ['INE · Directorio Central de Empresas: empresas activas por municipio, 2025',
                  f(em, 'dirce_empresas_municipio')],
        'dirceRuptura': ['INE · Nota de prensa del DIRCE 2025', f(em, 'dirce_ruptura_serie')],
        'pibRamas': ['Comunidad de Madrid · PIB municipal por rama de actividad, en porcentaje, base 2021',
                     f(em, 'pib_porcentaje_ramas_base2021')],
        'afilRama': ['Comunidad de Madrid · Afiliados por ubicación del centro de trabajo y rama',
                     f(em, 'afiliados_centro_trabajo_rama')],
    }
    if cu:
        fuentes['pmp'] = ['Ministerio de Hacienda · Periodo medio de pago a proveedores de las entidades locales, '
                          'agosto de 2025 a julio de 2026', cu['_meta']['fuentes']['pmp_consulta']]

    salida = {
        'fuentes': fuentes,
        'anios': {
            'puestos': [PUESTOS_DESDE, PUESTOS_HASTA],
            'paro': [PARO_DESDE, PARO_HASTA],
            'renta': [RENTA_DESDE, RENTA_HASTA],
        },
        'ciudades': ciudades,
    }
    if cu and 'media' in cu:
        salida['media'] = {k: {c: cu['media'][k]['media_2021_2024'][c]
                               for c in ('g3_intereses', 'deuda_3_mas_9', 'i123_propios', 'i4_art42_estado')}
                           for k in ('con_capital', 'sin_capital')}

    js = ('/* GENERADO por herramientas/economia.py. No se edita a mano.\n'
          '   El trabajo, la renta, las empresas y las cuentas del ayuntamiento de\n'
          '   cada ciudad. Las fuentes, una por una, en herramientas/economia/fuentes/\n'
          '   y en la propia página. */\n'
          'window.ECONOMIA = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
    (RAIZ / 'datos/economia.js').write_text(js, encoding='utf-8')
    print('datos/economia.js:', len(js), 'bytes')


if __name__ == '__main__':
    main()

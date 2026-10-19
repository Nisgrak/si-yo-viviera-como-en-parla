#!/usr/bin/env python3
"""Escribe datos/vivienda.js: lo que cuesta vivir en cada ciudad.

Lee las tablas ya extraídas de las fuentes oficiales, una por tema, en
herramientas/vivienda/fuentes/ (cada .json lleva sus URL y cada .md sus
cautelas y lo que no se pudo conseguir):

    compra.json      MIVAU: valor tasado de la vivienda libre (2005-2026) y
                     compraventas de viviendas (notarios)
    alquiler.json    MIVAU, SERPAVI (IRPF): viviendas alquiladas y renta
                     mediana; AEAT: alquiler medio y nuevos contratos;
                     INE Censo 2021: régimen de tenencia
    propiedad.json   Catastro: titulares de los inmuebles residenciales;
                     AEAT: declarantes con alquileres; Agencia de Vivienda
                     Social: su parque por municipio
    parque.json      INE Censo 2021: viviendas, vacías, antigüedad,
                     superficie; ADRH: renta (la pone al día vivienda/adrh.py); Catastro (Almudena):
                     unidades residenciales; padrón
    desahucios.json  CGPJ: lanzamientos y demandas por partido judicial
    publica.json     Comunidad de Madrid: ayudas al alquiler por municipio,
                     adjudicaciones de la Agencia de Vivienda Social y las
                     localidades con viviendas del Plan Vive
    ibi.json         Hacienda y Catastro: tipo del IBI y valor catastral
    hogares.json     INE Censo 2021: jóvenes con sus padres; Censo 2011:
                     viviendas sin ascensor
    barrios.json     SERPAVI y ADRH por sección censal: el barrio más barato
                     y el más caro, el más pobre y el más rico

y se queda con lo que pinta la web. Las cuentas que hace aquí son las que
cita la página: divisiones por la población o por los hogares, y nada más.

Uso:
    python3 herramientas/vivienda.py

Solo usa la biblioteca estándar.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / 'herramientas/vivienda/fuentes'

IDS = ['parla', 'getafe', 'leganes', 'fuenlabrada', 'mostoles', 'alcorcon',
       'alcobendas', 'pinto', 'torrejon', 'pozuelo', 'majadahonda']

# Los años del alquiler: SERPAVI empieza en 2011, pero la web arranca en 2015,
# el año de base del índice del INE y el último antes de la subida.
ALQ_DESDE, ALQ_HASTA = 2015, 2024
LANZ_DESDE, LANZ_HASTA = 2013, 2025


def leer(nombre):
    return json.loads((F / f'{nombre}.json').read_text(encoding='utf-8'))


def r(x, d=1):
    return None if x is None else round(x, d)


def main():
    compra, alq, prop, parque, desa, pub, ibi, hog, bar = (leer(n) for n in (
        'compra', 'alquiler', 'propiedad', 'parque', 'desahucios', 'publica', 'ibi', 'hogares', 'barrios'))

    ciudades = {}
    for i in IDS:
        c, a, p, q = compra[i], alq[i], prop[i], parque[i]
        pob = p['poblacion_ine_2025']

        # ── Comprar ──────────────────────────────────────────────────
        vt = c['valor_tasado']
        serie = vt['serie']
        res = vt['resumen']
        cv = c['compraventas']['resumen']
        ultimo = res['ultimo']
        tasado = {
            'desde': serie[0]['periodo'],
            's': [x['valor_eur_m2'] for x in serie],
            'ult': {'p': ultimo['periodo'], 'v': ultimo['valor_eur_m2'], 'n': ultimo['tasaciones']},
            'hace10': {'p': res['hace_10_anios']['periodo'], 'v': res['hace_10_anios']['valor_eur_m2']},
            'max': {'p': res['maximo_burbuja_2007_2008']['periodo'],
                    'v': res['maximo_burbuja_2007_2008']['valor_eur_m2']},
            'min': {'p': res['minimo_posterior']['periodo'], 'v': res['minimo_posterior']['valor_eur_m2']},
        }
        a25 = cv['anual_2025']
        compraventas = {'anio': 2025, 'total': a25['total'], 'nueva': a25['nueva'],
                        'protegida': a25['protegida'], 'por1000': cv['por_1000_hab_2025']}

        # ── Alquilar ─────────────────────────────────────────────────
        sp = a['serpavi']['serie']
        anios = [str(y) for y in range(ALQ_DESDE, ALQ_HASTA + 1)]
        u = sp[str(ALQ_HASTA)]
        ae = a['aeat_viviendas_irpf']
        esf = a['esfuerzo_calc']
        alquiler = {
            'desde': ALQ_DESDE,
            'm2': [sp[y]['renta_mediana_m2_mes_eur_colectiva'] for y in anios],
            'mes': [sp[y]['renta_mediana_mes_eur_colectiva'] for y in anios],
            'viv': [sp[y]['viviendas_alquiler_total_calc'] for y in anios],
            'pob': [sp[y]['poblacion_padron_1_enero'] for y in anios],
            'por100k': u['viviendas_alquiler_por_100000_hab_calc'],
            'sup': u['superficie_mediana_m2_colectiva'],
            # AEAT: medias, no medianas; los nuevos contratos solo en 2024.
            'medio': ae['2024']['alquiler_medio_mensual_eur'],
            'nuevos': ae['2024_nuevos_contratos']['alquiler_medio_mensual_eur_nuevos_contratos'],
            'esfuerzo': {'anio': esf['anio'], 'renta': esf['renta_neta_media_hogar_eur_adrh'],
                         'alquiler': esf['serpavi_renta_mediana_mes_colectiva'],
                         'pct': esf['pct_serpavi_mediana_colectiva_x12_sobre_renta_hogar_calc']},
            'cobertura': a['cobertura_serpavi_2021_sobre_censo_alquiler_pct_calc'],
        }

        # ── El parque y los hogares ──────────────────────────────────
        cz = q['censo2021']
        ce = q['consumo_electrico_2020']
        cat = q['catastro_unidades_residenciales']
        pad = q['padron']
        censo = {
            'viviendas': cz['viviendas_totales'],
            'hogares': cz['viviendas_principales'],
            'alquiler': a['censo_2021']['en_alquiler'],
            'pctAlquiler': cz['pct_alquiler'],
            'vacias': ce['viviendas_vacias'],
            'pctVacias': ce['pct_vacias'],
            'pctAntes1981': cz['pct_viviendas_edificio_anterior_1981'],
            'pct60': cz['pct_principales_60m2_o_menos'],
            'hog5en60': cz['hogares_5omas_en_60m2_o_menos'],
            'pctHog5en60': cz['pct_hogares_5omas_en_60m2_o_menos'],
            'superficie': q['superficie_media_viviendas_familiares_m2_censo2021'],
        }
        renta = {'anio': q['adrh']['anyo'], 'hogar': q['adrh']['renta_neta_media_por_hogar'],
                 'persona': q['adrh']['renta_neta_media_por_persona'],
                 'tamano': q['adrh']['tamano_medio_hogar']}
        # Año a año, de 2015 a 2025: el padrón a 1 de enero y las unidades
        # residenciales del Catastro con la etiqueta del mismo año.
        ys = [str(y) for y in range(2015, 2026)]
        crece = {'desde': 2015, 'pob': [pad['serie'][y] for y in ys],
                 'casas': [cat['serie'][y] for y in ys]}

        # ── De quién son ─────────────────────────────────────────────
        t = p['catastro_titularidad_residencial']
        titular = {
            'inm': t['inmuebles_residenciales'],
            'pf': t['inmuebles_personas_fisicas'], 'soc': t['inmuebles_sociedades'],
            'aapp': t['inmuebles_aapp'],
            'soc100': {'n': t['sociedades_mas_100_en_municipio']['titulares'],
                       'inm': t['sociedades_mas_100_en_municipio']['inmuebles']},
            'soc10': {'n': t['sociedades_mas_10_en_municipio']['titulares'],
                      'inm': t['sociedades_mas_10_en_municipio']['inmuebles']},
        }
        ir = p['aeat_arrendadores_particulares_irpf_2024']
        caseros = {'decl': ir['declaraciones_con_rendimientos_capital_inmobiliario'],
                   'por1000': ir['por_1000_habitantes']}
        avs = {'viv': p['agencia_vivienda_social']['viviendas'],
               'por1000': p['agencia_vivienda_social']['viviendas_por_1000_habitantes']}

        # ── Vivienda pública y ayudas ────────────────────────────────
        u = pub[i]
        ay = u['ayudas']
        publica = {
            'adj': [u['avs_segunda_adjudicacion'][y] for y in ('2023', '2024', '2025')],
            'planVive': u['plan_vive_disponibles_2026'],
            'solucionJoven': u['plan_vive_solucion_joven_obras'],
            # Convocatoria de 2023: los dos programas juntos.
            'ayudas2023': {'sol': ay['escasos']['2023']['solicitudes'] + ay['jovenes']['2023']['solicitudes'],
                           'ok': ay['escasos']['2023']['aceptadas'] + ay['jovenes']['2023']['aceptadas']},
            'bono2022': {'sol': ay['bono2022']['solicitudes'], 'ok': ay['bono2022']['aceptadas']},
        }

        # ── El IBI, los hogares y los barrios ────────────────────────
        b = ibi[i]
        vc = b['valor_catastral_residencial_eur'] / b['inmuebles_residenciales']
        ibi_c = {'tipo': b['tipo_2026_pct'], 'revision': b['revision_catastral'], 'vc': r(vc, 2),
                 'recibo': r(vc * b['tipo_2026_pct'] / 100, 2)}
        h = hog[i]
        hogares = {'jovenes': h['jovenes_25_34'], 'conPadres': h['jovenes_con_padres'],
                   'pctConPadres': h['pct_jovenes_con_padres'], 'sinAscensor': h['viv_4plantas_sin_ascensor_2011'],
                   'viv2011': h['viv_principales_2011'], 'pctSinAscensor': h['pct_sin_ascensor_2011']}
        ba = bar[i]
        barrios = {'alq': [ba['alquiler']['min']['m2'], ba['alquiler']['max']['m2']], 'alqSecc': ba['alquiler']['secciones'],
                   'renta': [ba['renta']['min']['eur'], ba['renta']['max']['eur']], 'rentaTope': ba['renta']['tope'],
                   'rentaSecc': ba['renta']['secciones'], 'rentaAnio': ba['renta']['anio']}

        ciudades[i] = {
            'pob': pob, 'tasado': tasado, 'compraventas': compraventas, 'alquiler': alquiler,
            'censo': censo, 'renta': renta, 'crece': crece, 'titular': titular,
            'caseros': caseros, 'avs': avs, 'publica': publica,
            'ibi': ibi_c, 'hogares': hogares, 'barrios': barrios, 'partido': desa['municipio_a_partido'][i]['partido'],
        }

    # ── Los juzgados: por partido judicial ───────────────────────────
    partidos = {}
    for pid, pj in desa['partidos'].items():
        ys = [str(y) for y in range(LANZ_DESDE, LANZ_HASTA + 1)]
        L, A = pj['lanzamientos'], pj['asuntos_juzgados_civil']
        partidos[pid] = {
            'municipios': [m['nombre'] for m in pj['municipios']],
            'pob': [pj['poblacion_ine'][y] for y in ys],
            'hogaresAlquiler': pj['censo2021_viviendas_principales_alquiler'],
            'total': [L[y]['total'] for y in ys],
            'lau': [L[y]['lau_arrendamientos'] for y in ys],
            'hipoteca': [L[y]['ejecucion_hipotecaria'] for y in ys],
            'demandas': [A[y]['verbales_arrendaticios_ingresados'] for y in ys],
        }
    cm = desa['comunidad_madrid']
    ys = [str(y) for y in range(LANZ_DESDE, LANZ_HASTA + 1)]
    region = {'pob': [cm['poblacion_ine'][y] for y in ys],
              'total': [cm['lanzamientos_total'][y] for y in ys]}

    js = ('/* GENERADO por herramientas/vivienda.py. No se edita a mano.\n'
          '   Comprar, alquilar, de quién son las casas, cuántas hay y los\n'
          '   desahucios, de cada ciudad. Las fuentes, una por una, en\n'
          '   herramientas/vivienda/fuentes/ y en la propia página. */\n'
          'window.VIVIENDA = ' + json.dumps({
              'lanzDesde': LANZ_DESDE, 'ciudades': ciudades, 'partidos': partidos, 'region': region,
          }, ensure_ascii=False, separators=(',', ':')) + ';\n')
    (RAIZ / 'datos/vivienda.js').write_text(js, encoding='utf-8')
    p = ciudades['parla']
    print('parla', p['tasado']['ult'], p['alquiler']['mes'][-1], p['titular']['soc'], p['partido'])


if __name__ == '__main__':
    main()

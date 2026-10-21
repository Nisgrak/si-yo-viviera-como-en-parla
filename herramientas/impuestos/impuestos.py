#!/usr/bin/env python3
"""«Lo que paga un vecino»: impuestos y tasas municipales de un vecino tipo, 2026.

Uso:  python3 -I herramientas/impuestos/impuestos.py

Lee:
  /var/tmp/impuestos/hacienda/madrid2026.xls  Hacienda (SGFAL), tipos impositivos 2026
                                                de los municipios de Madrid (lo descarga
                                                si no existe; es HTML con extensión .xls).
  herramientas/vivienda/fuentes/ibi.json       Catastro 2026: valor catastral e inmuebles
                                                residenciales (ya en el repo).
  datos/vivienda.js                            superficie media (Censo 2021) y tamaño medio
                                                del hogar (ADRH 2024), solo lectura.
Escribe: herramientas/impuestos/impuestos.json

Las tarifas de la tasa de basuras están copiadas a mano de cada ordenanza fiscal
(BOCM o web municipal); la URL de cada una va en `fuentes`.
"""
import html
import json
import os
import re
import statistics
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
DESCARGA = '/var/tmp/impuestos/hacienda/madrid2026.xls'
URL_HACIENDA = ('https://serviciostelematicosext.hacienda.gob.es/SGFAL/ConsultaTipos/aspx/'
                'ImpuestosExcel.aspx?provincia=28&anosel=2026')

INE = {'parla': '28106', 'getafe': '28065', 'leganes': '28074', 'fuenlabrada': '28058',
       'mostoles': '28092', 'alcorcon': '28007', 'alcobendas': '28006', 'pinto': '28113',
       'torrejon': '28148', 'pozuelo': '28115', 'majadahonda': '28080'}

# Cuotas mínimas del art. 95.1 TRLRHL (turismos)
IVTM_MIN = {'8a12': 34.08, '12a16': 71.94}

CASO_M2 = 80          # vivienda del caso común
CASO_PERSONAS = 3     # el tamaño medio del hogar redondeado da 3 en las once


def num(s):
    s = s.strip().replace('.', '').replace(',', '.')
    return float(s) if s else None


def hacienda():
    if not os.path.exists(DESCARGA):
        os.makedirs(os.path.dirname(DESCARGA), exist_ok=True)
        urllib.request.urlretrieve(URL_HACIENDA, DESCARGA)
    s = open(DESCARGA, encoding='utf-8').read()
    out = {}
    cod2c = {v: k for k, v in INE.items()}
    for r in re.findall(r'<tr.*?</tr>', s, re.S | re.I):
        c = [html.unescape(re.sub(r'<.*?>', '', x)).strip()
             for x in re.findall(r'<t[dh].*?</t[dh]>', r, re.S | re.I)]
        if len(c) != 45 or not re.match(r'\d\d-28-\d{3}$', c[0]):
            continue
        cod = '28' + c[0][-3:]
        if cod not in cod2c:
            continue
        # 4 ident. | IBI 5 (urbana, coef act, revisión, rústica, caract esp) | IAE 2 |
        # IVTM 24 (turismos 5 ...) | IIVTNU 9 | ICIO 1
        out[cod2c[cod]] = {
            'nombre': c[1], 'ibi': num(c[4]), 'revision': int(c[6]),
            'iae_max': num(c[9]), 'iae_min': num(c[10]),
            'ivtm_menos8': num(c[11]), 'ivtm_8a12': num(c[12]), 'ivtm_12a16': num(c[13]),
            'ivtm_16a20': num(c[14]), 'ivtm_mas20': num(c[15]),
            'iivtnu_hacienda': [num(x) for x in c[35:44]], 'icio': num(c[44]),
        }
    assert len(out) == 11, out.keys()
    return out


def vivienda_js():
    s = open(os.path.join(RAIZ, 'datos', 'vivienda.js'), encoding='utf-8').read()
    return json.loads(s[s.find('{'):s.rfind('}') + 1])['ciudades']


def tramo(v, tabla):
    """tabla: [(limite_superior_inclusive, valor), ...] con None = sin límite."""
    for lim, x in tabla:
        if lim is None or v <= lim:
            return x
    raise ValueError(v)


# ── Tasa de basuras: una función por ciudad (vc €, m² construidos, personas) ──
# Devuelve (importe o None, texto del cálculo)

def b_parla(vc, m2, p):
    cvs = tramo(m2, [(50, 6), (75, 9), (125, 15), (200, 28), (None, 84)])
    cve = tramo(p, [(2, 7.80), (4, 14.40), (6, 22.50), (None, 60.00)])
    return 84 + cvs + cve, f'84 (fija) + {cvs} (tramo de superficie) + {cve} (empadronados)'


def b_getafe(vc, m2, p):
    cf = tramo(vc, [(50000, 55.70), (100000, 74.34), (200000, 87.53), (None, 95.48)])
    cv = [22, 42, 60, 76, 90, 102][min(p, 6) - 1]
    return cf + cv, f'{cf} (fija por tramo de VC) + {cv} ({p} empadronados)'


def b_leganes(vc, m2, p):
    return 0.0, 'Leganés no tiene tasa de basuras para viviendas en 2026'


def b_fuenlabrada(vc, m2, p):
    return 0.000847078315 * vc + 13.40 * p, f'0,000847078315 × {vc:.0f} + 13,40 × {p}'


def b_mostoles(vc, m2, p):
    cvc = tramo(vc, [(24000, .60), (36000, .70), (60000, .80), (96000, 1.00), (120000, 1.10), (None, 1.23)])
    cgo = tramo(vc, [
        (36000, [.55, .75, .90, 1.00, 1.05, 1.20, 1.30, 1.40]),
        (60000, [.55, .80, .90, 1.00, 1.10, 1.25, 1.35, 1.40]),
        (96000, [.55, .75, 1.00, 1.05, 1.10, 1.20, 1.35, 1.40]),
        (120000, [.55, .75, 1.00, 1.10, 1.15, 1.25, 1.35, 1.40]),
        (None, [.55, .80, 1.00, 1.10, 1.20, 1.25, 1.35, 1.40])])[min(p, 7)]
    return 112.48 * cvc * cgo, f'112,48 × CVC {cvc} × CGO {cgo}'


def b_alcorcon(vc, m2, p):
    cf = tramo(vc, [(59000, 46.36), (100000, 81.13), (127000, 115.90), (169000, 127.49),
                    (254000, 139.08), (338000, 150.68), (423000, 162.27), (507000, 173.86),
                    (592000, 185.45)], ) if vc <= 592000 else 185.45 + 0.0005 * (vc - 592000)
    cv = 11.68 * min(p, 4)
    return cf + cv, f'{cf} (fija, vivienda colectiva, tramo de VC) + 11,68 × {min(p, 4)} (variable al 100 %)'


def b_alcobendas(vc, m2, p):
    v = m2 * 0.90177180531 * 0.357249840998
    return 21.58 + v, f'21,58 + {m2:.2f} m² × 0,90177 (distrito Centro) × 0,35725'


def b_pinto(vc, m2, p):
    return None, ('cuota = coste del servicio repartido en proporción al valor catastral; '
                  'el coeficiente anual no se publica: no calculable')


def b_torrejon(vc, m2, p):
    if vc > 120000 and m2 >= 75:
        return 250.0, 'VC > 120.000 €: 250'
    if m2 < 75:
        return 117.0, '< 75 m² construidos: 117'
    return 180.0, '≥ 75 m² y VC ≤ 120.000 €: 180'


POZUELO = [(75, 30, 85), (100, 85.01, 115), (120, 115.01, 135), (150, 135.01, 160),
           (175, 160.01, 190), (200, 190.01, 215), (250, 215.01, 235)]
POZUELO_MEDIA = {75: 77.67, 100: 110.79}   # cuota media del tramo según el estudio 2026


def b_pozuelo(vc, m2, p):
    for lim, lo, hi in POZUELO:
        if m2 <= lim:
            if lim in POZUELO_MEDIA:
                return POZUELO_MEDIA[lim], f'cuota media oficial del tramo ≤{lim} m² (rango {lo}–{hi})'
            return (lo + hi) / 2, (f'punto medio del rango oficial {lo}–{hi} € del tramo ≤{lim} m² '
                                  '(estimación: depende de ruta y empadronados del portal)')
    raise ValueError(m2)


MAJA = [(49999.99, 20, .34), (69999.99, 30, .50), (99999.99, 35, .54), (119999.99, 40, .58),
        (149999.99, 45, .62), (179999.99, 50, .66), (209999.99, 55, .70), (249999.99, 60, .74)]


def b_majadahonda(vc, m2, p):
    cf, k = tramo(vc, [(l, (a, b)) for l, a, b in MAJA])
    return cf + k * min(m2, 250), f'{cf} (fija por tramo de VC) + {k} × {m2:.2f} m²'


BASURAS = {'parla': b_parla, 'getafe': b_getafe, 'leganes': b_leganes, 'fuenlabrada': b_fuenlabrada,
           'mostoles': b_mostoles, 'alcorcon': b_alcorcon, 'alcobendas': b_alcobendas, 'pinto': b_pinto,
           'torrejon': b_torrejon, 'pozuelo': b_pozuelo, 'majadahonda': b_majadahonda}

BASURAS_INFO = {
    'parla': dict(cobra=True, formula='CF 84 € + CVS por tramo de m² construidos (0-50: 6; 51-75: 9; 76-125: 15; 126-200: 28; >200: 84) + CVE por empadronados (≤2: 7,80; 3-4: 14,40; 5-6: 22,50; >6: 60)',
                  nota='Ordenanza en vigor desde 27-12-2025 (primer año 2026). Según la prensa, el alcalde anunció el 25-06-2026 que no se cobrará a los vecinos; no hay acto oficial publicado que lo confirme ni padrón 2026 de la tasa en el BOCM. Periodo voluntario previsto 1-sep a 20-nov.',
                  fuente='parla_basuras'),
    'getafe': dict(cobra=True, formula='79,57 € × coef. por tramo de VC (≤50.000: 0,7; ≤100.000: 0,93; ≤200.000: 1,1; >200.000: 1,2) + variable por empadronados (1: 22; 2: 42; 3: 60; 4: 76; 5: 90; 6+: 102)',
                   nota='Ordenanza 3.11 de 2024, sin cambios para 2026. Bonificaciones por reciclaje con tarjeta, familia numerosa (-20/-40 % de la variable) y exclusión social.', fuente='getafe_basuras'),
    'leganes': dict(cobra=False, formula=None,
                    nota='No hay tasa de residuos para viviendas: el calendario fiscal 2026 solo recoge la de establecimientos industriales y comerciales.', fuente='leganes_calendario'),
    'fuenlabrada': dict(cobra=True, formula='0,000847078315 × valor catastral + 13,40 € × empadronados',
                        nota='Ordenanza 16, modificada para 2026. -30 % por recogida separada, -10 % compostaje, -70 % IMV/RMI.', fuente='fuenlabrada_basuras'),
    'mostoles': dict(cobra=True, formula='112,48 € × CVC (tramo de VC: 0,60-1,23) × CGO (ocupantes: 0,55-1,40)',
                     nota='En vigor desde 2025, modificada para 2026. -15 % familia numerosa, -50 % Móstoles Composta, -90 % IMV/RMI.', fuente='mostoles_basuras'),
    'alcorcon': dict(cobra=True, formula='Cuota fija por tramo de VC (colectiva 46,36-185,45; unifamiliar 83,25-332,99) + 11,68 € por empadronado (máx. 4), reducible hasta el 50 % según toneladas',
                     nota='Ordenanza 17 en vigor; el cobro de 2026 se ha aplazado a un periodo que acaba el 31-07-2027 (BOCM 25-05-2026) y el Ayuntamiento estudia suspenderlo. No consta qué tramo de reducción de la variable se aplica en 2026: se usa el 100 %. Se supone vivienda colectiva.', fuente='alcorcon_basuras'),
    'alcobendas': dict(cobra=True, formula='21,58 € + m² construidos × coef. de distrito (Centro 0,9018; Norte 0,6461; Urbanizaciones 1,9450) × 0,357249840998',
                       nota='Se usa el distrito Centro. Familia numerosa propietaria: -40 a -85 % según VC. Padrón 2026 publicado (BOCM 27-07-2026).', fuente='alcobendas_basuras'),
    'pinto': dict(cobra=True, formula='Parte fija + variable, ambas = coste del grupo × (VC del inmueble / suma de VC del grupo): en la práctica cuota = K × VC, con K recalculado cada año y no publicado',
                  nota='Se cobra en 2026 (calendario fiscal: 21-sep a 23-nov). Importe de una vivienda tipo no disponible en fuente oficial.', fuente='pinto_basuras'),
    'torrejon': dict(cobra=True, formula='< 75 m² construidos: 117 €; ≥ 75 m² y VC ≤ 120.000: 180 €; VC > 120.000: 250 €',
                     nota='Sin cambios en 2026. Reducción por calidad de la separación (0-10 %, en 2026 el 10 %) y 5 % por domiciliar: el Ayuntamiento anuncia «-15 %» (180 → 153). Se usa la tarifa sin reducciones.', fuente='torrejon_basuras'),
    'pozuelo': dict(cobra=True, formula='Coste por habitante de la ruta × empadronados del portal, repartido entre viviendas por m² construidos, × coef. de generación y de calidad; con mínimos y máximos por tramo de superficie (p. ej. 76-100 m²: 85,01-115 €; 101-120 m²: 115,01-135 €)',
                    nota='No calculable con exactitud para una vivienda tipo. Se usa la cuota media oficial del tramo cuando el estudio la da (≤75 m²: 77,67; 76-100 m²: 110,79) y, si no, el punto medio del rango.', fuente='pozuelo_basuras'),
    'majadahonda': dict(cobra=True, formula='Cuota fija por tramo de VC (20-100 €) + coef. por tramo de VC (0,34-0,90 €/m²) × m² construidos',
                        nota='Tabla de vivienda sin cambios en 2026. Bonificaciones acumulables hasta el 70 % (IMV, pensionistas, familia numerosa, vive solo, punto limpio).', fuente='majadahonda_basuras'),
}

# Plusvalía (IIVTNU): tipo según ordenanza (Hacienda no lo publica tras el RDL 26/2021)
PLUSVALIA = {
    'parla': (30, None, 'parla_plusvalia'),
    'getafe': (29, '29 % (1-5 años), 27 % (6-11), 25 % (12-15), 24 % (16-19), 23 % (20)', 'getafe_plusvalia'),
    'leganes': (27, '27 % (<1 a 5 años), 26 % (6-19), 25 % (20 o más)', 'leganes_plusvalia'),
    'fuenlabrada': (None, 'no encontrado en los BOCM revisados (2020-2026)', None),
    'mostoles': (25, None, 'mostoles_plusvalia'),
    'alcorcon': (30, '30 % (hasta 5 años), 29 % (6-10), 28 % (11-15), 27 % (16-20)', 'alcorcon_plusvalia'),
    'alcobendas': (29.5, None, 'alcobendas_plusvalia'),
    'pinto': (28, None, 'pinto_plusvalia'),
    'torrejon': (30, None, 'torrejon_plusvalia'),
    'pozuelo': (29, None, 'pozuelo_plusvalia'),
    'majadahonda': (20, None, 'majadahonda_plusvalia'),
}

# Cuotas IVTM de la ordenanza, para contrastar con Hacienda (8-11,99 CV, 12-15,99 CV)
IVTM_ORDENANZA = {
    'getafe': (60.00, 128.92), 'fuenlabrada': (61.51, 133.27), 'mostoles': (62.60, 132.87),
    'alcorcon': (66.93, 141.29), 'torrejon': (68.16, 143.88), 'pozuelo': (56.00, 119.00),
    'majadahonda': (34.08, 71.94), 'pinto': (46.69, 98.56),
}

FUENTES = {
    'hacienda_tipos': ('Ministerio de Hacienda (SGFAL), tipos impositivos de los municipios 2026, Madrid (Excel)', URL_HACIENDA),
    'hacienda_consulta': ('Ministerio de Hacienda, consulta de información impositiva municipal', 'https://serviciostelematicosext.hacienda.gob.es/SGFAL/ConsultaTipos/aspx/listado_municipiosm.aspx'),
    'catastro_valor': ('Catastro, estadística 2026: valor catastral por usos', 'https://www.catastro.hacienda.gob.es/jaxi/tabla.do?path=/est2026/catastro/urbano/&file=URBO4228.px&type=pcaxis&L=0'),
    'catastro_inmuebles': ('Catastro, estadística 2026: inmuebles por usos', 'https://www.catastro.hacienda.gob.es/jaxi/tabla.do?path=/est2026/catastro/urbano/&file=URAO4228.px&type=pcaxis&L=0'),
    'trlrhl': ('Real Decreto Legislativo 2/2004 (TRLRHL), art. 95: cuotas mínimas del IVTM', 'https://www.boe.es/buscar/act.php?id=BOE-A-2004-4214'),
    'parla_basuras': ('Parla, Ordenanza fiscal de la tasa por recogida y reciclaje de residuos sólidos urbanos (BOCM 307, 26-12-2025)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/26/BOCM-20251226-95.PDF'),
    'getafe_basuras': ('Getafe, Ordenanza fiscal 3.11 de la tasa de residuos (BOCM 311, 31-12-2024)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/12/31/BOCM-20241231-40.PDF'),
    'leganes_calendario': ('Leganés, calendario fiscal 2026 (BOCM 305, 23-12-2025)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/23/BOCM-20251223-65.PDF'),
    'fuenlabrada_basuras': ('Fuenlabrada, modificación de la Ordenanza fiscal 16, tasa de gestión de residuos domésticos (BOCM 296, 12-12-2025)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/12/BOCM-20251212-77.PDF'),
    'mostoles_basuras': ('Móstoles, Ordenanza fiscal de la tasa de gestión de residuos, modificación 2026 (BOCM 304, 22-12-2025)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/22/BOCM-20251222-66.PDF'),
    'alcorcon_basuras': ('Alcorcón, Ordenanza 17, tasa de gestión de residuos (BOCM 305, 23-12-2025)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/23/BOCM-20251223-46.PDF'),
    'alcorcon_aplazamiento': ('Alcorcón, calendario de cobro de la tasa de residuos 2026 (BOCM 122, 25-05-2026)', 'https://bocm.es/boletin/CM_Orden_BOCM/2026/05/25/BOCM-20260525-54.PDF'),
    'alcobendas_basuras': ('Alcobendas, Ordenanza fiscal 3.17, tasa de gestión de residuos (BOCM 305, 23-12-2024)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/12/23/BOCM-20241223-50.PDF'),
    'alcobendas_padron': ('Alcobendas, padrón 2026 de la tasa de residuos (BOCM 27-07-2026)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2026/07/27/BOCM-20260727-46.PDF'),
    'pinto_basuras': ('Pinto, Ordenanza fiscal 2.22, tasa de recogida, transporte y tratamiento de residuos (BOCM 311, 31-12-2024)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/12/31/BOCM-20241231-49.PDF'),
    'pinto_calendario': ('Pinto, calendario fiscal 2026 (BOCM 12-02-2026)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2026/02/12/BOCM-20260212-64.PDF'),
    'torrejon_basuras': ('Torrejón de Ardoz, Ordenanza fiscal de la tasa de residuos (BOCM 308, 27-12-2024)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/12/27/BOCM-20241227-117.PDF'),
    'pozuelo_basuras': ('Pozuelo de Alarcón, Ordenanza fiscal 317, tasa de recogida y tratamiento de residuos, texto 2026', 'https://www.pozuelodealarcon.org/sites/default/files/2026-01/317.%20ORD.FISCAL%20SERVICIO%20RECOGIDA%20Y%20TRATAMIENTO%20DE%20RESIDUOS%202026.pdf'),
    'pozuelo_estudio': ('Pozuelo de Alarcón, estudio técnico-económico de la tasa de residuos 2026', 'https://www.pozuelodealarcon.org/sites/default/files/2026-03/Estudio%20tec.-econ.%20Ord.%20Recogida%20Residuos%202026.pdf'),
    'majadahonda_basuras': ('Majadahonda, Ordenanza fiscal 21, tasa de gestión de residuos (BOCM 260, 31-10-2024)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/10/31/BOCM-20241031-58.PDF'),
    'majadahonda_basuras_2026': ('Majadahonda, modificación 2026 de la Ordenanza fiscal 21 (BOCM 242, 10-10-2025)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/10/10/BOCM-20251010-71.PDF'),
    'parla_plusvalia': ('Parla, Ordenanza fiscal del IIVTNU (BOCM 12-07-2022)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2022/07/12/BOCM-20220712-68.PDF'),
    'getafe_plusvalia': ('Getafe, Ordenanza fiscal 1.5 del IIVTNU (BOCM 13-02-2024)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/02/13/BOCM-20240213-49.PDF'),
    'leganes_plusvalia': ('Leganés, Ordenanza fiscal 4 del IIVTNU (BOCM 2, 03-01-2026)', 'https://bocm.es/boletin/CM_Orden_BOCM/2026/01/03/BOCM-20260103-22.PDF'),
    'mostoles_plusvalia': ('Móstoles, Ordenanza fiscal del IIVTNU 2026', 'https://www.mostoles.es/mostoles/cm/images?idMmedia=1434709'),
    'alcorcon_plusvalia': ('Alcorcón, Ordenanza 22 del IIVTNU 2026', 'https://portalciudadano.ayto-alcorcon.es/portal/formularios/ordenanzas/2026/ordenanza_22.pdf'),
    'alcobendas_plusvalia': ('Alcobendas, Ordenanza fiscal 4.4 del IIVTNU (BOCM 29-12-2023)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2023/12/29/BOCM-20231229-19.PDF'),
    'pinto_plusvalia': ('Pinto, Ordenanza fiscal 1.5 del IIVTNU (BOCM 16-05-2023)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2023/05/16/BOCM-20230516-85.PDF'),
    'torrejon_plusvalia': ('Torrejón de Ardoz, Ordenanza fiscal 5 del IIVTNU', 'https://www.ayto-torrejon.es/sites/default/files/inline-files/05.-ORDENANZA%20FISCAL%20REGULADORA%20DEL%20IMPUESTO%20SOBRE%20EL%20INCREMENTO%20DEL%20VAL....pdf'),
    'pozuelo_plusvalia': ('Pozuelo de Alarcón, Ordenanza fiscal 203 del IIVTNU 2026', 'https://www.pozuelodealarcon.org/sites/default/files/2026-02/203.%20ORD.%20FISCAL%20IIVTNU%202026%20coeficientes.pdf'),
    'majadahonda_plusvalia': ('Majadahonda, Ordenanza fiscal 4 del IIVTNU', 'https://cultura.majadahonda.org/documents/36614/61593/Ordenanza+Fiscal+N%C2%BA4%2C+Impuesto+sobre+el+Incremento+de+Valor+de+los+Terrenos+de+Naturaleza+Urbana.pdf/ce85d3e2-ff3d-1687-90f6-5cd411e82913'),
    'pinto_ivtm': ('Pinto, modificación de la Ordenanza fiscal 1.4 del IVTM (BOCM 18-09-2014)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2014/09/18/BOCM-20140918-41.PDF'),
    'pozuelo_ivtm': ('Pozuelo de Alarcón, Ordenanza fiscal 202 del IVTM 2026', 'https://www.pozuelodealarcon.org/sites/default/files/2026-01/202.%20ORD.%20FISCAL%20IVTM%202026.pdf'),
    'alcorcon_ivtm': ('Alcorcón, Ordenanza 21 del IVTM 2026', 'https://portalciudadano.ayto-alcorcon.es/portal/formularios/ordenanzas/2026/ordenanza_21.pdf'),
    'parla_tasa_prensa': ('(Prensa, no oficial) Anuncio del alcalde de Parla de no cobrar la tasa de basuras, 25-06-2026: madridiario.es, elespanol.com, noticiasparamunicipios.com (sin URL oficial)', None),
}

NOTAS = [
    'Vecino tipo de cada ciudad = su vivienda residencial media (valor catastral residencial 2026 / inmuebles residenciales, Catastro), con la superficie media de las viviendas familiares del Censo 2021 y 3 empadronados (tamaño medio del hogar ADRH 2024 redondeado: 2,6-3,1 en las once), más un turismo de 12 a 15,99 CV.',
    'Caso común = misma vivienda para las once: valor catastral igual a la mediana de las once medias, 80 m² construidos y 3 empadronados; solo cambian las ordenanzas.',
    'Recibo IBI = valor catastral × tipo general 2026 (Hacienda). Cuota íntegra, sin bonificaciones, sin garaje ni trastero. En Pinto la base liquidable es el 97,1 % del VC y en Parla el 99,77 %: su recibo real es algo menor.',
    'IVTM: cuota de Hacienda 2026 para turismos de 12 a 15,99 CV (la mínima legal es 71,94 €; 68,16 € no es la de ese tramo, sino 2 × 34,08 del tramo 8-11,99). Coincide con la ordenanza en todas las ciudades contrastadas salvo Pinto: Hacienda da la mínima (71,94; coef. 1) y la ordenanza de 2014 encontrada aplica coef. 1,37 (98,56 €); no se ha encontrado el texto vigente, se usa Hacienda. IVTM de Parla, Leganés y Alcobendas solo de Hacienda (ordenanza no localizada).',
    'Basuras: tarifas de la ordenanza, sin reducciones ni bonificaciones. La superficie de las ordenanzas es construida; la del Censo es útil (algo menor): en tramos cerca del límite (Parla 72 m² frente a 75; Torrejón 73 m² frente a 75) el resultado puede cambiar de tramo.',
    'Parla: la tasa está aprobada y en vigor para 2026, pero según la prensa el alcalde anunció que no se cobrará; no hay acto oficial. Se dan los totales con y sin ella.',
    'Alcorcón: el cobro de 2026 se ha aplazado (periodo que acaba el 31-07-2027) y podría suspenderse. Pinto: cobra en 2026 pero su cuota (K × VC) no es calculable con fuentes públicas: su total va sin basuras. Pozuelo: cuota estimada (media o punto medio oficial del tramo de superficie).',
    'Plusvalía e ICIO no entran en el total anual (no son pagos recurrentes). La tabla de Hacienda deja a cero las columnas del IIVTNU (sistema anterior al RDL 26/2021): los tipos salen de las ordenanzas.',
    'IAE: coeficiente de situación máximo y mínimo (Hacienda); no lo paga un hogar.',
    'Bonificaciones generales (no calculadas): IBI familia numerosa en la mayoría; basuras con rebajas por familia numerosa (Getafe, Móstoles, Alcobendas, Pozuelo, Majadahonda), renta baja/IMV (todas las que cobran), compostaje y reciclaje; 5 % por domiciliación o pago fraccionado en varias.',
]


def r2(x):
    return None if x is None else round(x, 2)


def main():
    h = hacienda()
    ibi = json.load(open(os.path.join(RAIZ, 'herramientas', 'vivienda', 'fuentes', 'ibi.json'), encoding='utf-8'))
    viv = vivienda_js()
    vcs = {c: ibi[c]['valor_catastral_residencial_eur'] / ibi[c]['inmuebles_residenciales'] for c in INE}
    vc_comun = statistics.median(vcs.values())
    out = {'_meta': {'anio': 2026, 'caso_comun': {'valorCatastral': r2(vc_comun), 'm2': CASO_M2, 'personas': CASO_PERSONAS}},
           'ciudades': {}, 'caso_comun': {}}
    for c in INE:
        hc = h[c]
        assert abs(hc['ibi'] - ibi[c]['tipo_2026_pct']) < 1e-9, (c, hc['ibi'], ibi[c]['tipo_2026_pct'])
        vc, m2 = vcs[c], viv[c]['censo']['superficie']
        personas = round(viv[c]['renta']['tamano'])
        recibo = vc * hc['ibi'] / 100
        b, calc = BASURAS[c](vc, m2, personas)
        info = BASURAS_INFO[c]
        ptipo, pdet, pf = PLUSVALIA[c]
        ivtm = hc['ivtm_12a16']
        orden = IVTM_ORDENANZA.get(c)
        total = recibo + ivtm + (b or 0)
        d = {
            'nombre': hc['nombre'],
            'ibi': {'tipo': hc['ibi'], 'revisionCatastral': hc['revision'], 'valorCatastralMedio': r2(vc), 'recibo': r2(recibo)},
            'ivtm': {'coef': round(ivtm / IVTM_MIN['12a16'], 3), 'cuota12a16cv': ivtm, 'cuota8a12cv': hc['ivtm_8a12'],
                     'ordenanza': None if not orden else {'cuota8a12cv': orden[0], 'cuota12a16cv': orden[1]}},
            'basuras': {'cobra': info['cobra'], 'importe': r2(b), 'calculo': calc, 'formula': info['formula'],
                        'nota': info['nota'], 'vivienda': {'valorCatastral': r2(vc), 'm2': m2, 'personas': personas}},
            'plusvalia': {'tipo': ptipo, 'detalle': pdet},
            'icio': {'tipo': hc['icio']},
            'iae': {'coefSituacionMax': hc['iae_max'], 'coefSituacionMin': hc['iae_min']},
            'total': r2(total),
            'totalSinBasuras': r2(recibo + ivtm),
            'totalCompleto': b is not None,
        }
        out['ciudades'][c] = d
        bc, calcc = BASURAS[c](vc_comun, CASO_M2, CASO_PERSONAS)
        rc = vc_comun * hc['ibi'] / 100
        out['caso_comun'][c] = {'ibi': r2(rc), 'ivtm': ivtm, 'basuras': r2(bc), 'basurasCalculo': calcc,
                                'total': r2(rc + ivtm + (bc or 0)), 'totalSinBasuras': r2(rc + ivtm),
                                'totalCompleto': bc is not None}
    out['fuentes'] = {k: {'titulo': t, 'url': u} for k, (t, u) in FUENTES.items()}
    out['notas'] = NOTAS
    with open(os.path.join(AQUI, 'impuestos.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"VC caso común {vc_comun:.0f} €")
    print(f"{'ciudad':12} {'tipo':>6} {'VC':>8} {'IBI':>7} {'IVTM':>7} {'basura':>7} {'total':>8} | común: {'IBI':>6} {'bas':>6} {'total':>7}")
    for c, d in sorted(out['ciudades'].items(), key=lambda kv: kv[1]['total']):
        k = out['caso_comun'][c]
        print(f"{c:12} {d['ibi']['tipo']:6.4f} {d['ibi']['valorCatastralMedio']:8.0f} {d['ibi']['recibo']:7.2f} "
              f"{d['ivtm']['cuota12a16cv']:7.2f} {str(d['basuras']['importe']):>7} {d['total']:8.2f} | "
              f"{k['ibi']:6.2f} {str(k['basuras']):>6} {k['total']:7.2f}")


if __name__ == '__main__':
    main()

"""Listas de espera del hospital de referencia de cada una de las once ciudades.

Lee lo que dejó descarga_espera.py en /var/tmp/espera/leq/raw/ (respuestas HTML
del servicio de consulta del SERMAS, opción «Total» de cada hospital) y las
memorias 2024 de los hospitales (PDF en /var/tmp/espera/memorias/, convertidas
con pdftotext -layout) para la población de referencia. Escribe espera.json.

Uso: python3 -I espera.py
Requiere: pdftotext (poppler-utils).
"""
import html
import json
import os
import re
import subprocess

RAW = '/var/tmp/espera/leq/raw'
MEMORIAS = '/var/tmp/espera/memorias'
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'espera.json')
NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
               'septiembre', 'octubre', 'noviembre', 'diciembre']


def etiqueta_mes(aaaamm):
    return f'{NOMBRES_MES[int(aaaamm[4:]) - 1]} de {aaaamm[:4]}'


ACTUAL, HACE1, HACE2 = '202608', '202508', '202408'

BASE_MEM = 'https://www.comunidad.madrid/docs/assets/2025/11/06/'

# código del servicio de consulta, nombre, gestión, fichero de memoria 2024
HOSPITALES = {
    'infanta_cristina': ('2664', 'Hospital Universitario Infanta Cristina (Parla)', 'pública', 'memoria_2024_hui_cristrina'),
    'getafe': ('2558', 'Hospital Universitario de Getafe', 'pública', 'memoria_2024_hu_getafe'),
    'fuenlabrada': ('2555', 'Hospital Universitario de Fuenlabrada', 'pública', 'memoria_2024_hu_fuenlabrada'),
    'severo_ochoa': ('2544', 'Hospital Universitario Severo Ochoa (Leganés)', 'pública', 'memoria_2024_hu_severo_ochoa_'),
    'alcorcon': ('2541', 'Hospital Universitario Fundación Alcorcón', 'pública', 'memoria_2024_hu_fundacion_alcorcon'),
    'infanta_sofia': ('2660', 'Hospital Universitario Infanta Sofía (San Sebastián de los Reyes)', 'pública', 'memoria_2024_hu_infanta_sofia'),
    'mostoles': ('2540', 'Hospital Universitario de Móstoles', 'pública', 'memoria_2024_hu_mostoles'),
    'rey_juan_carlos': ('2829', 'Hospital Universitario Rey Juan Carlos (Móstoles)', 'concesión', 'memoria_2024_hu_rey_juan_carlos'),
    'torrejon': ('2828', 'Hospital Universitario de Torrejón', 'concesión', 'memoria_2024_hu_torrejon'),
    'puerta_hierro': ('2712', 'Hospital Universitario Puerta de Hierro Majadahonda', 'pública', 'memoria_2024_hu_puerta_de_hierro'),
}

CIUDADES = {
    'parla': 'infanta_cristina',
    'getafe': 'getafe',
    'pinto': 'getafe',
    'fuenlabrada': 'fuenlabrada',
    'leganes': 'severo_ochoa',
    'alcorcon': 'alcorcon',
    'alcobendas': 'infanta_sofia',
    'mostoles': 'mostoles',
    'torrejon': 'torrejon',
    'pozuelo': 'puerta_hierro',
    'majadahonda': 'puerta_hierro',
}

TIPOS = {'quirurgica': 'quirurgica', 'consultas': 'consultas', 'pruebas': 'pruebas'}


def numero(s):
    return float(s.replace('.', '').replace(',', '.'))


def leer_resultado(tipo, codigo, mes):
    fich = os.path.join(RAW, f'{tipo}_{codigo}_{mes}.html')
    if not os.path.exists(fich):
        return None
    t = open(fich, encoding='utf8').read()
    x = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t)))
    m = re.search(r'Nº total de pacientes en la lista de espera:\s*([\d.]+)\s*Demora media:\s*([\d.,]+)\s*días', x)
    if not m:
        return None
    pac, dem = int(numero(m.group(1))), round(numero(m.group(2)), 2)
    if pac == 0 and dem == 0:  # el servicio publica 0 / 0 cuando el hospital no ha enviado datos
        return None
    return {'pacientes': pac, 'demoraDias': dem, 'mes': etiqueta_mes(mes)}


def ultimo_disponible(tipo, codigo, desde):
    """Mes más reciente anterior a «desde» con dato descargado (no cero)."""
    meses = sorted({f.rsplit('_', 1)[1][:6] for f in os.listdir(RAW) if f.startswith(f'{tipo}_{codigo}_') and f.endswith('.html')}, reverse=True)
    for mes in meses:
        if mes < desde:
            r = leer_resultado(tipo, codigo, mes)
            if r:
                return r
    return None


def hospitales_servicio(tipo):
    out = {}
    for linea in open(os.path.join(RAW, f'{tipo}_hospitales.tsv'), encoding='utf8'):
        cod, nombre = linea.rstrip('\n').split('\t')
        out[cod] = nombre
    return out


def texto_memoria(nombre):
    pdf = os.path.join(MEMORIAS, nombre + '.pdf')
    txt = os.path.join(MEMORIAS, nombre + '.txt')
    if not os.path.exists(txt):
        subprocess.run(['pdftotext', '-layout', pdf, txt], check=True, stderr=subprocess.DEVNULL)
    return open(txt, encoding='utf8', errors='replace').read()


def tabla_poblacion(nombre):
    """Devuelve filas [(nombre_centro, total)], total declarado (o None) y fecha de la tabla."""
    t = texto_memoria(nombre)
    m = re.search(r'^\s*Población de referencia\s*$(.*?)Fuente: SIP-CIBELES\. Población a (\d\d/\d\d/\d{4})', t, re.S | re.M)
    bloque, fecha = m.group(1), m.group(2)
    filas, total, previo = [], None, ''
    for linea in bloque.splitlines():
        nums = re.findall(r'(?<![\w.])\d{1,3}(?:\.\d{3})*(?![\w.])', linea)
        etiqueta = re.sub(r'[\d.]+', '', linea).strip()
        if '≥' in linea or 'AÑOS' in linea or 'GRUPOS' in linea:
            continue  # cabeceras (0-2, 3-15, ..., ≥ 80)
        if len(nums) >= 3:
            valor = int(nums[-1].replace('.', ''))
            if re.match(r'^\s*(TOTAL|TOTALES)\b', linea.strip()) or re.search(r'\bTOTALES?\s*$', etiqueta):
                total = valor
            else:
                filas.append(((previo + ' ' + etiqueta).strip(), valor))
            previo = ''
        elif linea.strip():
            previo = linea.strip()
    return filas, total, fecha


def poblacion(clave):
    nombre = HOSPITALES[clave][3]
    filas, total, fecha = tabla_poblacion(nombre)
    suma = sum(v for _, v in filas)
    anio = fecha[-4:]
    res = {'fuente': 'memoria2024_' + clave, 'fecha': fecha, 'sumaFilas': suma}
    if total is not None:
        res['valor'] = total
        res['metodo'] = 'fila TOTAL de la tabla «Población de referencia» (SIP-CIBELES)'
        res['cuadra'] = (total == suma)
    else:
        res['valor'] = suma
        res['metodo'] = 'suma de las filas por centro de salud de la tabla «Población de referencia» (la tabla no trae fila TOTAL)'
    res['anio'] = int(anio)
    return res, filas


def main():
    fuentes = {
        'servicioConsulta': {
            'titulo': 'SERMAS. Servicio de consulta de la situación de listas de espera por hospital (opción «Total», intervalo mensual)',
            'urls': {
                'quirurgica': 'https://servicioselectronicos.sanidadmadrid.org/LEQ/Consulta.aspx',
                'consultas': 'https://servicioselectronicos.sanidadmadrid.org/LEQ/ConsultaEspecialidades.aspx',
                'pruebas': 'https://servicioselectronicos.sanidadmadrid.org/LEQ/ConsultaPruebas.aspx',
            },
        },
        'portalQuirurgica': {'titulo': 'Comunidad de Madrid. Lista de espera quirúrgica (datos globales mensuales)',
                             'url': 'https://www.comunidad.madrid/salud/lista-espera-quirurgica'},
        'portalConsultas': {'titulo': 'Comunidad de Madrid. Lista de espera en consultas externas',
                            'url': 'https://www.comunidad.madrid/salud/lista-espera-consultas-externas'},
        'portalPruebas': {'titulo': 'Comunidad de Madrid. Lista de espera de pruebas diagnósticas y terapéuticas',
                          'url': 'https://www.comunidad.madrid/salud/lista-espera-pruebas-diagnosticas-terapeuticas'},
        'globalQuirurgicaAgosto2026': {'titulo': 'Datos del Registro Unificado de LEQ, agosto 2026 (CSV)',
                                       'url': 'https://www.comunidad.madrid/docs/2026-09/le_q_agosto_2026.csv'},
        'globalConsultasAgosto2026': {'titulo': 'Datos de lista de espera de consultas externas, agosto 2026 (CSV)',
                                      'url': 'https://www.comunidad.madrid/docs/2026-09/le_c_agosto_2026.csv'},
        'globalPruebasAgosto2026': {'titulo': 'Datos de lista de espera de pruebas diagnósticas/terapéuticas, agosto 2026 (CSV)',
                                    'url': 'https://www.comunidad.madrid/docs/2026-09/le_t_agosto_2026.csv'},
        'concesiones': {'titulo': 'Comunidad de Madrid. H.U. Rey Juan Carlos: hospitales «gestionados bajo la modalidad de concesión administrativa» (Infanta Elena, Rey Juan Carlos, Torrejón, Villalba)',
                        'url': 'https://www.comunidad.madrid/hospital/reyjuancarlos/node/276'},
        'datosAbiertosAnuales': {'titulo': 'datos.comunidad.madrid. Lista de espera quirúrgica / consultas / pruebas por hospitales (a 31 de diciembre; no usados aquí, solo referencia)',
                                 'url': 'https://datos.comunidad.madrid/dataset/lista_de_espera_quirurgica_por_hospitales'},
    }
    for clave, (_, nombre, _, mem) in HOSPITALES.items():
        fuentes['memoria2024_' + clave] = {'titulo': f'Memoria 2024 del {nombre}. Servicio Madrileño de Salud (apartado «Área de influencia» / «Población de referencia»)',
                                           'url': BASE_MEM + mem + '.pdf'}

    hospitales = {}
    for clave, (cod, nombre, gestion, _) in HOSPITALES.items():
        pob, filas = poblacion(clave)
        h = {'nombre': nombre, 'codigoServicio': cod, 'gestion': gestion, 'poblacionReferencia': pob}
        for tipo in TIPOS:
            act = leer_resultado(tipo, cod, ACTUAL)
            if act:
                act['por1000'] = round(act['pacientes'] / pob['valor'] * 1000, 1)
            else:
                ult = ultimo_disponible(tipo, cod, ACTUAL)
                if ult:
                    ult['por1000'] = round(ult['pacientes'] / pob['valor'] * 1000, 1)
                h[tipo + 'UltimoDisponible'] = ult
                h.setdefault('sinDato', []).append(f'{tipo}: {etiqueta_mes(ACTUAL)} publicado como 0 pacientes / 0 días')
            h[tipo] = act
            h[tipo + 'Anterior'] = {'2025': leer_resultado(tipo, cod, HACE1), '2024': leer_resultado(tipo, cod, HACE2)}
        hospitales[clave] = (h, filas)

    # Reparto de Móstoles entre sus dos hospitales (centros de salud del municipio)
    _, filas_hum = hospitales['mostoles']
    _, filas_rjc = hospitales['rey_juan_carlos']
    mostoles_hum = sum(v for n, v in filas_hum if 'ARROYOMOLINOS' not in n.upper())
    mostoles_rjc = sum(v for n, v in filas_rjc if re.search(r'BARCELONA|PRINCESA|PRESENTACI', n.upper()))

    ciudades = {}
    for ciudad, clave in CIUDADES.items():
        h = hospitales[clave][0]
        c = {'hospital': h['nombre'], 'hospitalId': clave, 'gestion': h['gestion'],
             'poblacionReferencia': {k: h['poblacionReferencia'][k] for k in ('valor', 'anio', 'fecha', 'metodo', 'fuente')}}
        for tipo in TIPOS:
            c[tipo] = h[tipo]
            if tipo + 'UltimoDisponible' in h:
                c[tipo + 'UltimoDisponible'] = h[tipo + 'UltimoDisponible']
            c[tipo + 'Anterior'] = h[tipo + 'Anterior']
        if 'sinDato' in h:
            c['sinDato'] = h['sinDato']
        ciudades[ciudad] = c
    ciudades['mostoles']['hospitalSecundario'] = {
        'hospital': hospitales['rey_juan_carlos'][0]['nombre'], 'hospitalId': 'rey_juan_carlos', 'gestion': 'concesión',
        'poblacionReferencia': {k: hospitales['rey_juan_carlos'][0]['poblacionReferencia'][k] for k in ('valor', 'anio', 'fecha', 'fuente')},
        **{t: hospitales['rey_juan_carlos'][0][t] for t in TIPOS},
        **{t + 'Anterior': hospitales['rey_juan_carlos'][0][t + 'Anterior'] for t in TIPOS},
    }
    ciudades['mostoles']['repartoMunicipio'] = {
        'hospitalMostoles': mostoles_hum, 'reyJuanCarlos': mostoles_rjc,
        'cuotaHospitalMostoles': round(mostoles_hum / (mostoles_hum + mostoles_rjc), 3),
        'nota': 'Población (SIP-CIBELES, 31/12/2024) de los centros de salud situados en Móstoles en cada tabla: H.U. de Móstoles = todos sus centros salvo el consultorio de Arroyomolinos; Rey Juan Carlos = C.S. Barcelona, La Princesa y Presentación Sabio.',
    }

    # Comprobación: suma de todos los hospitales del servicio frente al total regional
    comprobacion = {}
    for tipo in TIPOS:
        cods = hospitales_servicio(tipo)
        tot = pond = 0
        sin = []
        for cod, nom in cods.items():
            r = leer_resultado(tipo, cod, ACTUAL)
            if r:
                tot += r['pacientes']
                pond += r['pacientes'] * r['demoraDias']
            else:
                sin.append(nom)
        comprobacion[tipo] = {'sumaHospitalesAgosto2026': tot, 'demoraMediaPonderada': round(pond / tot, 2),
                              'hospitales': len(cods), 'hospitalesSinDato': sin}
    comprobacion['quirurgica'].update({'totalRegionalLEQ': 120168, 'totalRegionalEstructural': 92525, 'demoraRegionalEstructural': 71.88})
    comprobacion['consultas'].update({'totalRegionalEstructural': 698522, 'demoraRegional': 76.62})
    comprobacion['pruebas'].update({'totalRegionalEstructural': 168443, 'demoraRegional': 66.51})

    notas = [
        'Último mes publicado: agosto de 2026 (actualización del 16/09/2026). Se da también agosto de 2025 y agosto de 2024, el mismo mes, para evitar el efecto estacional (agosto es un mes de poca actividad programada y las listas suelen crecer).',
        'Las cifras por hospital son la opción «Total» del servicio de consulta del SERMAS: número de pacientes en lista y demora media en días naturales «a fecha de corte» (lo que llevan esperando los que siguen en lista, no lo que esperaron los ya atendidos). Consultas = primera consulta externa (no incluye Obstetricia); pruebas = TC, RM, ecografía, mamografía, hemodinámica, ecocardiografía, ergometría, electromiograma, densitometría, colonoscopia y gastroscopia.',
        'Qué cuenta cada cifra por hospital (ver «comprobacion»). Consultas y pruebas: la suma de hospitales y la demora ponderada cuadran con el total regional de espera ESTRUCTURAL (698.522 pacientes, 76,62 días; 168.441 frente a 168.443 y 66,51 días en pruebas). Quirúrgica: la suma de hospitales da 120.168, que es el TOTAL de la lista (estructural + rechazo de derivación + transitoriamente no programables), no los 92.525 estructurales que la Comunidad destaca; y la demora ponderada (79,79 días) no coincide con la «demora media estructural» regional (71,88). Las cifras quirúrgicas por hospital son comparables entre sí, pero NO con el titular regional de 92.525 / 71,88.',
        'Torrejón (concesión, Ribera Salud): el servicio publica 0 pacientes y 0 días en consultas y en pruebas en julio y agosto de 2026, lo que es ausencia de dato, no lista vacía. Se deja a null y se da el último mes con dato (junio de 2026) en «consultasUltimoDisponible» / «pruebasUltimoDisponible». El total regional de consultas de agosto de 2026 (698.522) no incluye, por tanto, a Torrejón (unos 21.000 pacientes en junio). La quirúrgica de Torrejón sí está publicada en agosto de 2026.',
        'Rey Juan Carlos (concesión, Quirónsalud) muestra demoras mucho menores que el resto (19 días en quirúrgica frente a 50-120). Es el dato oficial; no se ha corregido.',
        'Libre elección (Decreto 51/2010): cualquier madrileño puede apuntarse en la lista de otro hospital, y los hospitales con servicios de referencia atienden a pacientes de fuera de su área. La lista de un hospital no son solo vecinos de su área ni todos los vecinos del área esperan en él. Los «por1000» (pacientes / población de referencia × 1.000) son por eso una aproximación de la presión sobre el hospital, no una tasa de vecinos en espera.',
        'Población de referencia: tabla «Población de referencia» de la Memoria 2024 de cada hospital (SIP-CIBELES, tarjetas sanitarias a 31/12/2024; Torrejón la da a 31/12/2023). Es de un año y medio antes que las listas. No hay cifra de 2025 publicada en las memorias consultadas.',
        'Getafe: la tabla no trae fila TOTAL; se suman los diez centros de salud (242.715). El texto de la misma memoria dice «algo más de 223.000 habitantes», cifra que no cuadra con su propia tabla; usamos la tabla.',
        'Infanta Sofía: la tabla no trae fila TOTAL; la suma de sus filas por centro da 353.796, mientras el texto de la misma memoria dice que «atiende una población de 330.756 habitantes». Usamos la tabla (mismo criterio que en el resto de hospitales); la diferencia es de un 7 %.',
        'Fuenlabrada: la fila TOTAL de su tabla (226.428) es 40 personas menor que la suma de sus propias filas (226.468). Usamos la fila TOTAL; la diferencia es despreciable.',
        'Puerta de Hierro: la tabla suma 424.164 (31/12/2024); el texto habla de 411.922 habitantes de diez municipios y de más de 586.922 en especialidades en las que es referencia del noroeste. Es el hospital de Majadahonda y de Pozuelo (C.S. Pozuelo-Estación, San Juan de la Cruz y Somosaguas), así que ambas ciudades comparten las mismas cifras.',
        'Pinto no tiene hospital. Según la Memoria 2024 del H.U. de Getafe, «el área de referencia del Hospital Universitario de Getafe se corresponde en la actualidad con la totalidad de los centros de salud de las localidades de Getafe y Pinto» (C.S. Pinto y C.S. Parque Europa). No es el Infanta Cristina (Parla) ni el Infanta Elena (Valdemoro). Getafe y Pinto comparten cifras.',
        'Móstoles tiene dos hospitales de referencia: el H.U. de Móstoles (gestión pública; centros de salud de Móstoles salvo tres, más Arroyomolinos) y el H.U. Rey Juan Carlos (concesión, Quirónsalud; C.S. Barcelona, La Princesa y Presentación Sabio de Móstoles, más Villaviciosa, Navalcarnero y la Sierra Oeste). Se toma como principal el H.U. de Móstoles, que cubre a la mayoría de la población del municipio (ver «repartoMunicipio»); el Rey Juan Carlos va en «hospitalSecundario».',
        'Gestión: Rey Juan Carlos y Torrejón son concesiones administrativas (la Comunidad lo dice así en la web del Rey Juan Carlos; la Memoria 2024 de Torrejón: «gestión de servicios públicos en la modalidad de concesión administrativa»). Infanta Cristina e Infanta Sofía son de gestión sanitaria pública, pero se construyeron por concesión de obra: una sociedad concesionaria explota el edificio y los servicios no sanitarios. Fundación Alcorcón es una fundación pública del sector público.',
        'Los datos abiertos de datos.comunidad.madrid por hospital son anuales (a 31 de diciembre) y llegan a 2025 en quirúrgica y a 2024 en consultas y pruebas; no se usan aquí, pero sirven para contrastar.',
        'Datos globales de consultas de agosto 2026: la Comunidad publica «Tasa por 1000 habitantes 140,26» con 698.522 pacientes y 7.175.375 habitantes asignados, pero 698.522 / 7.175.375 × 1.000 = 97,3. No usamos esa tasa.',
    ]

    salida = {
        'generado': 'herramientas/sanidad/espera.py',
        'mes': etiqueta_mes(ACTUAL),
        'ciudades': ciudades,
        'hospitales': {k: v[0] for k, v in hospitales.items()},
        'comprobacion': comprobacion,
        'fuentes': fuentes,
        'notas': notas,
    }
    with open(SALIDA, 'w', encoding='utf8') as f:
        json.dump(salida, f, ensure_ascii=False, indent=1)
    print('escrito', SALIDA)


if __name__ == '__main__':
    main()

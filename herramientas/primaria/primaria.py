#!/usr/bin/env python3
"""Escribe herramientas/primaria/primaria.json: médicos de familia y pediatras
de los centros de salud públicos de cada ciudad frente a las tarjetas
sanitarias (TSI) que tienen asignadas.

Lee lo que baja herramientas/primaria/descarga.py (por defecto en
/var/tmp/medicos/):

- plantilla_ap.pdf: plantilla orgánica de personal estatutario de la Gerencia
  Asistencial de Atención Primaria del SERMAS (anexo «Plazas estatutarias en
  centro de salud»): plazas (dotación) de médico de familia y de pediatra de
  cada centro de salud. Se pasa a texto con `pdftotext -layout` (poppler).
- resultados_ap_2024.csv: indicadores de Atención Primaria del Observatorio de
  Resultados del SERMAS, año 2024: población asignada (personas con TSI
  vinculada al centro) por tramos de edad y centro de salud.
- le/: buscador de libre elección sanitaria del SERMAS. Da qué centros de
  salud hay en cada municipio (y su dirección) y la relación nominal de
  profesionales de medicina de familia y de pediatría que publica cada centro
  el día de la descarga.

Cuentas: la población de 14 años o más se reparte entre médicos de familia y
la de 0 a 13 años entre pediatras (en la Comunidad de Madrid la pediatría de
atención primaria atiende hasta los 14 años). Por ciudad se suman TSI y
profesionales de todos sus centros y luego se divide.

    python3 -I herramientas/primaria/primaria.py [/var/tmp/medicos]
"""
import csv, glob, html, json, os, re, subprocess, sys, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = sys.argv[1] if len(sys.argv) > 1 else '/var/tmp/medicos'
ANIO_TSI = 2024

URL_PLANTILLA = ('https://www.comunidad.madrid/docs/2026-06/rrhh-plantillas_organicas-estatutarios-at-primariar.pdf'
                 '?VersionId=Z5aEsyOAB6njawngvB6.E_MFLj4g_RGZ')
URL_OBS = 'https://observatorioresultados.sanidadmadrid.org/Descargas/resultados_ap_2024.csv'
URL_LE = 'https://www.libreeleccion.sanidadmadrid.org/Seleccione/'

# Código del centro en libre elección -> (nombre en la plantilla, nombre en el Observatorio).
# None: el centro no aparece en esa fuente (ver notas).
CENTROS = {
    'parla': {'2450': ('PINTORES', 'Los Pintores'), '2451': ('ISABEL II', 'Isabel II'),
              '2452': ('SAN BLAS', 'San Blas'), '2453': ('LAS AMERICAS', 'Las Américas'),
              '4172': ('PARLA ESTE', None)},
    'getafe': {'2456': ('JUAN DE LA CIERVA', 'Juan de la Cierva'), '2457': ('LAS MARGARITAS', 'Las Margaritas'),
               '2458': ('EL GRECO', 'El Greco'), '2459': ('LAS CIUDADES', 'Ciudades'),
               '2460': ('SECTOR 3', 'Sector III'), '2461': ('EL BERCIAL', 'El Bercial'),
               '2463': ('SANCHEZ MORATE', 'Sánchez Morate'), '2464': ('GETAFE NORTE', 'Getafe Norte'),
               '2506': ('PERALES DEL RIO', 'Perales del Río')},
    'pinto': {'2454': ('PINTO', 'Pinto'), '2455': ('PARQUE EUROPA', 'Parque Europa')},
    'fuenlabrada': {'2419': ('CUZCO', 'Cuzco'), '2420': ('ALICANTE', 'Alicante'),
                    '2421': ('CASTILLA LA NUEVA', 'Castilla la Nueva'), '2422': ('EL NARANJO', 'El Naranjo'),
                    '2425': ('PANADERAS', 'Panaderas'), '2426': ('FRANCIA', 'Francia'),
                    '2440': ('PARQUE LORANCA', 'Parque Loranca'), '2441': (None, None)},
    'leganes': {'2432': ('HUERTA DE LOS FRAILES', 'Huerta de los Frailes'),
                '2433': ('MARIA JESUS HEREZA', 'Maria Jesús Hereza'), '2434': ('SANTA ISABEL', 'Santa Isabel'),
                '2435': ('MARIA ANGELES LOPEZ GOMEZ', 'M. Angeles López Gómez'),
                '2436': ('JAIME VERA - LEGANES', 'Jaime Vera - Leganés'), '2437': ('MARIA MONTESSORI', 'María Montessori'),
                '2438': ('MARIE CURIE', 'Marie Curie'), '2439': ('DOCTOR MENDIGUCHIA CARRICHE', 'Dr. Mendiguchía Carriche'),
                '2442': ('LEGANES NORTE', 'Leganés Norte')},
    'alcorcon': {'2378': ('MIGUEL SERVET', 'Miguel Servet'), '2380': ('RAMON Y CAJAL', 'Ramón y Cajal'),
                 '2381': ('LOS CASTILLOS', 'Los Castillos'), '2382': ('PEDRO LAIN ENTRALGO', 'Doctor Pedro Laín Entralgo'),
                 '2383': ('GREGORIO MARAÑON', 'Gregorio Marañón'), '2384': ('LA RIVOTA', 'La Rivota'),
                 '2386': ('DOCTOR TRUETA', 'Dr. Trueta'), '4086': ('PARQUE OESTE', 'Parque Oeste')},
    'alcobendas': {'2189': ('LA CHOPERA', 'La Chopera'), '2191': ('MIRAFLORES', 'Miraflores'),
                   '2193': ('MARQUES DE LA VALDAVIA', 'Marqués de Valdavia'),
                   '2786': ('ARROYO DE LA VEGA', 'Arroyo de la Vega'), '2837': ('VALDELASFUENTES', 'Valdelasfuentes')},
    'mostoles': {'2389': ('EL SOTO', 'El Soto'), '2390': ('PRESENTACION SABIO', 'Presentación Sabio'),
                 '2391': ('BARCELONA', 'Barcelona'), '2392': ('FELIPE II', 'Felipe II'),
                 '2393': ('DOCTOR LUENGO RODRIGUEZ', 'Dr. Luengo Rodríguez'), '2394': ('DOS DE MAYO', 'Dos de Mayo'),
                 '2395': ('ALCALDE BARTOLOME GONZALEZ', 'Bartolomé González'),
                 '2397': ('PARQUE COIMBRA', 'Parque Coimbra'), '2610': ('LA PRINCESA', 'La Princesa')},
    'torrejon': {'2125': ('FRONTERAS', 'Fronteras'), '2126': ('LAS VEREDILLAS', 'La Veredilla'),
                 '2127': ('JUNCAL', 'Juncal'), '2128': ('BRUJULA', 'Brújula'), '2129': ('LA PLATA', 'La Plata'),
                 '2131': ('LOS FRESNOS', 'Los Fresnos')},
    'pozuelo': {'2293': ('SAN JUAN DE LA CRUZ', 'San Juan de la Cruz'),
                '2306': ('POZUELO - ESTACION', 'Pozuelo - Estación'), '2623': ('SOMOSAGUAS', 'Somosaguas')},
    'majadahonda': {'2301': ('CERRO DEL AIRE', 'Cerro del Aire'), '2625': ('VALLE DE LA OLIVA', 'Valle de la Oliva')},
}
MUNICIPIO = {'parla': 'PARLA', 'getafe': 'GETAFE', 'pinto': 'PINTO', 'fuenlabrada': 'FUENLABRADA',
             'leganes': 'LEGANES', 'alcorcon': 'ALCORCON', 'alcobendas': 'ALCOBENDAS', 'mostoles': 'MOSTOLES',
             'torrejon': 'TORREJON DE ARDOZ', 'pozuelo': 'POZUELO DE ALARCON', 'majadahonda': 'MAJADAHONDA'}


def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().upper()
    return re.sub(r'\s+', ' ', s).strip()


def num(s):
    s = (s or '').strip().replace('.', '')
    return int(s) if s else None


def plantilla():
    """{nombre del centro: (plazas médico de familia, plazas pediatra)} y la fecha de efectos."""
    txt = subprocess.run(['pdftotext', '-layout', os.path.join(DATOS, 'plantilla_ap.pdf'), '-'],
                         capture_output=True, text=True, check=True).stdout
    fecha = re.search(r'FECHA DE EFECTOS:\s*(\d\d)/(\d\d)/(\d{4})', txt)
    cols, out = None, {}
    for l in txt.splitlines():
        if re.search(r'\bGRUPO\s+A1\s+A1\b', l):
            # centro de cada columna (A1 médico de familia, A1 pediatra, ...)
            g = l.index('GRUPO') + 5
            cols = [(m.start() + m.end()) / 2 for m in re.finditer(r'\S+', l[g:])]
            cols = [c + g for c in cols]
            continue
        m = re.match(r'^\s*\S*\s+C\.S\.\s+(.+?)\s{2,}(\d.*)$', l)
        if not m or not cols:
            continue
        nombre = m.group(1).strip()
        valores = [None] * len(cols)
        for t in re.finditer(r'[\d.]+', l[m.start(2):]):
            centro = m.start(2) + (t.start() + t.end()) / 2
            i = min(range(len(cols)), key=lambda k: abs(cols[k] - centro))
            valores[i] = num(t.group())
        out[nombre] = (valores[0] or 0, valores[1] or 0)
    return out, f'{fecha.group(3)}-{fecha.group(2)}-{fecha.group(1)}'


def observatorio():
    """{nombre (sin «C.S. »): {tramo: personas}}"""
    with open(os.path.join(DATOS, 'resultados_ap_2024.csv'), encoding='latin-1', newline='') as f:
        filas = list(csv.reader(f, delimiter=';'))
    tramos = {'Población asignada 0-2 años': '0-2', 'Población asignada 3-6 años': '3-6',
              'Población asignada 7-13 años': '7-13', 'Población asignada 14-64 años': '14-64',
              'Población asignada igual o mayor de 65 años': '65+'}
    out = {}
    for r in filas[1:]:
        if len(r) >= 4 and r[1].strip() in tramos:
            out.setdefault(r[2].replace('C.S. ', '', 1).strip(), {})[tramos[r[1].strip()]] = num(r[3])
    return out


def libre_eleccion(codigo):
    """(municipio, dirección, nº de médicos de familia, nº de pediatras) que publica el centro."""
    le = os.path.join(DATOS, 'le')
    t = open(os.path.join(le, f'centro_{codigo}.html'), encoding='utf-8').read()
    s = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', t)))
    muni = re.search(r'Municipio:\s*(.+?)\s+Código postal', s).group(1)
    dire = re.search(r'Dirección postal:\s*(.+?)\s+Municipio', s).group(1)
    n = {}
    for cat, etiqueta in (('familia', 'Medicina de Familia'), ('pediatria', 'Pediatría')):
        p = open(os.path.join(le, f'{cat}_{codigo}.html'), encoding='utf-8').read()
        filas = re.findall(r'<tr[^>]*>(.*?)</tr>', p, re.S)
        n[cat] = sum(1 for f in filas
                     if [html.unescape(re.sub('<[^>]+>', '', c)).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', f, re.S)][1:2] == [etiqueta])
    return muni, dire, n['familia'], n['pediatria']


def ratio(a, b):
    return round(a / b) if a and b else None


def main():
    pl, fecha_pl = plantilla()
    obs = observatorio()
    indice = json.load(open(os.path.join(DATOS, 'le', 'indice.json'), encoding='utf-8'))
    ciudades = {}
    for cid, centros in CENTROS.items():
        # todos los centros que el buscador da para el municipio, y ninguno más
        assert {c['codigo'] for c in indice['municipios'][cid]} == set(centros), cid
        nombres = {c['codigo']: c['nombre'] for c in indice['municipios'][cid]}
        lista = []
        for cod, (npl, nobs) in centros.items():
            muni, dire, mf_le, pe_le = libre_eleccion(cod)
            assert norm(muni) == MUNICIPIO[cid], (cid, cod, muni)
            c = {'nombre': nombres[cod], 'codigoLibreEleccion': cod, 'direccion': f'{dire}, {muni}'}
            if nobs:
                p = obs[nobs]
                c['tsi'] = sum(p.values())
                c['tsiAdultos'] = p['14-64'] + p['65+']
                c['tsiPediatria'] = p['0-2'] + p['3-6'] + p['7-13']
            if npl:
                c['medicosFamilia'], c['pediatras'] = pl[npl]
            c['medicosFamiliaConNombre'], c['pediatrasConNombre'] = mf_le, pe_le
            if nobs and npl:
                c['tsiPorMedico'] = ratio(c['tsiAdultos'], c['medicosFamilia'])
                c['tsiInfantilPorPediatra'] = ratio(c['tsiPediatria'], c['pediatras'])
            lista.append(c)
        suma = lambda k: sum(c.get(k) or 0 for c in lista)
        d = {'centros': lista, 'tsi': suma('tsi'), 'tsiAdultos': suma('tsiAdultos'),
             'tsiPediatria': suma('tsiPediatria'), 'medicosFamilia': suma('medicosFamilia'),
             'pediatras': suma('pediatras'), 'medicosFamiliaConNombre': suma('medicosFamiliaConNombre'),
             'pediatrasConNombre': suma('pediatrasConNombre')}
        d['tsiPorMedico'] = ratio(d['tsiAdultos'], d['medicosFamilia'])
        d['tsiInfantilPorPediatra'] = ratio(d['tsiPediatria'], d['pediatras'])
        d['tsiPorMedicoConNombre'] = ratio(d['tsiAdultos'], d['medicosFamiliaConNombre'])
        d['tsiInfantilPorPediatraConNombre'] = ratio(d['tsiPediatria'], d['pediatrasConNombre'])
        d['medicosFamiliaPor10000Tsi'] = round(d['medicosFamilia'] / d['tsiAdultos'] * 1e4, 2)
        d['pediatrasPor10000TsiInfantil'] = round(d['pediatras'] / d['tsiPediatria'] * 1e4, 2)
        d['plazasMedicoFamiliaSinNombre'] = d['medicosFamilia'] - d['medicosFamiliaConNombre']
        d['plazasPediatraSinNombre'] = d['pediatras'] - d['pediatrasConNombre']
        d['anio'] = ANIO_TSI
        d['fechaPlantilla'] = fecha_pl
        d['fechaProfesionalesConNombre'] = indice['descargado']
        ciudades[cid] = d

    # Toda la Comunidad de Madrid, para tener referencia (mismas fuentes)
    tot_mf = sum(v[0] for v in pl.values()); tot_pe = sum(v[1] for v in pl.values())
    tot_ad = sum(p['14-64'] + p['65+'] for p in obs.values())
    tot_in = sum(p['0-2'] + p['3-6'] + p['7-13'] for p in obs.values())
    region = {'tsiAdultos': tot_ad, 'tsiPediatria': tot_in, 'medicosFamilia': tot_mf, 'pediatras': tot_pe,
              'tsiPorMedico': ratio(tot_ad, tot_mf), 'tsiInfantilPorPediatra': ratio(tot_in, tot_pe),
              'centrosEnPlantilla': len(pl), 'centrosEnObservatorio': len(obs)}

    out = {
        'descripcion': 'Plazas de médico de familia y de pediatra de los centros de salud públicos (SERMAS) de cada ciudad '
                       'frente a las tarjetas sanitarias (TSI) asignadas a esos centros.',
        'ciudades': ciudades,
        'comunidadDeMadrid': region,
        'fuentes': [
            {'titulo': f'SERMAS. Plantilla orgánica de personal estatutario de Atención Primaria (fecha de efectos {fecha_pl}), '
                       'anexo I «Plazas estatutarias en centro de salud»', 'url': URL_PLANTILLA},
            {'titulo': 'Comunidad de Madrid. Plantillas orgánicas de los centros sanitarios del Servicio Madrileño de Salud',
             'url': 'https://www.comunidad.madrid/salud/plantillas-organicas-centros-sanitarios-servicio-madrileno-salud'},
            {'titulo': 'Observatorio de Resultados del SERMAS. Indicadores de Atención Primaria, resultados 2024 (CSV): '
                       'población asignada por tramos etarios y centro de salud (TSI; fuente CIBELES)', 'url': URL_OBS},
            {'titulo': 'Observatorio de Resultados del SERMAS. Ficha «Población asignada total y por tramos etarios»',
             'url': 'https://observatorioresultados.sanidadmadrid.org/AtencionPrimariaFicha.aspx?ID=66'},
            {'titulo': f'SERMAS. Libre elección sanitaria: buscador de centros de atención primaria por municipio y '
                       f'relación de profesionales de cada centro (consultado el {indice["descargado"]})',
             'url': URL_LE + 'AtencionPrimaria.aspx'},
        ],
        'notas': [
            'TSI: personas con tarjeta sanitaria individual vinculada a cada centro de salud en 2024, según el Observatorio de '
            'Resultados del SERMAS (último año publicado). No es el padrón: incluye a quien tiene tarjeta aunque no esté empadronado '
            'y excluye a mutualistas (MUFACE, ISFAS, MUGEJU) que eligieron entidad privada.',
            'tsiPorMedico = TSI de 14 años o más / plazas de médico de familia. tsiInfantilPorPediatra = TSI de 0 a 13 años / plazas '
            'de pediatra. En la Comunidad de Madrid el pediatra de atención primaria atiende hasta los 14 años, así que el corte de '
            'edad del Observatorio (0-2, 3-6, 7-13, 14-64, 65+) coincide con el reparto entre pediatría y medicina de familia.',
            f'«medicosFamilia» y «pediatras» son plazas (dotación numérica) de la plantilla orgánica con fecha de efectos {fecha_pl}, '
            'no personas ni equivalentes a jornada completa: una plaza puede estar vacante o cubierta. Solo cuenta las plazas '
            'asignadas al centro de salud (no las de apoyo, urgencias, ESAPD ni consultorios rurales).',
            '«medicosFamiliaConNombre» y «pediatrasConNombre» son los profesionales con nombre y apellidos que el buscador de libre '
            f'elección publicaba para cada centro el {indice["descargado"]}. Es lo más parecido a médicos de verdad que publica el '
            'SERMAS por centro, pero no es un dato estadístico oficial: puede incluir sustitutos y no dice cuántos cupos están '
            'vacíos. «plazasMedicoFamiliaSinNombre» y «plazasPediatraSinNombre» (plazas de plantilla menos profesionales listados) '
            'son, por tanto, solo una aproximación de las plazas sin cubrir; si es negativo hay más profesionales listados que plazas.',
            'Las fechas no coinciden: TSI de 2024 frente a plantilla de octubre de 2026. En ciudades que crecen deprisa (Parla, '
            'Getafe con El Bercial y Los Molinos, Fuenlabrada con Loranca) la población de 2026 será algo mayor y la ratio real '
            'algo peor que la calculada.',
            'Cada centro se asigna a la ciudad del municipio que da su ficha de libre elección (el buscador por municipio del SERMAS '
            'devuelve exactamente esos centros). Una zona básica puede atender a vecinos de un municipio vecino o urbanizaciones '
            'limítrofes; no hay dato oficial por municipio de residencia, solo por centro.',
            'C.S. Parla Este (Parla) figura en la plantilla y en libre elección pero no en el Observatorio 2024: es posterior. Sus '
            'pacientes estaban asignados en 2024 a los otros centros de Parla, así que la ratio de la ciudad sí es comparable, '
            'pero no las de cada centro de Parla por separado.',
            'El consultorio Parque Miraflores (Fuenlabrada) aparece en libre elección con sus propios profesionales, pero en la '
            'plantilla y en el Observatorio sus plazas y su población van dentro de su centro de salud de referencia; solo suma en '
            'los totales «ConNombre» de Fuenlabrada.',
            'El SIAP del Ministerio de Sanidad (población asignada por profesional) no sirve para comparar ciudades: llega como mucho '
            'al área de salud y la Comunidad de Madrid es área única. Tampoco hay en datos.comunidad.madrid un conjunto de '
            'profesionales de atención primaria por centro; el portal estadístico de personal del SERMAS solo da totales de la '
            'Gerencia de Atención Primaria.',
            'Referencia regional (comunidadDeMadrid): todas las plazas de médico de familia y pediatra en centro de salud de la '
            'plantilla y toda la TSI del Observatorio. Los centros abiertos después de 2024 tienen plazas pero no TSI y algunos '
            'centros pueden diferir de nombre entre fuentes, así que es solo orientativa.',
        ],
    }
    with open(os.path.join(AQUI, 'primaria.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write('\n')
    for cid, d in sorted(ciudades.items(), key=lambda x: x[1]['tsiPorMedico']):
        print(f"{cid:12} TSI14+/MF {d['tsiPorMedico']:5} ({d['tsiAdultos']}/{d['medicosFamilia']})  "
              f"TSI0-13/ped {d['tsiInfantilPorPediatra']:5} ({d['tsiPediatria']}/{d['pediatras']})  "
              f"listados MF {d['medicosFamiliaConNombre']} ped {d['pediatrasConNombre']} -> "
              f"{d['tsiPorMedicoConNombre']} / {d['tsiInfantilPorPediatraConNombre']}")
    print('Comunidad', region)


if __name__ == '__main__':
    main()

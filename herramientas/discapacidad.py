#!/usr/bin/env python3
"""Escribe datos/discapacidad.js: los centros para personas con discapacidad
intelectual, de atención temprana y de salud mental de cada ciudad, los
colegios de educación especial, y cuántas personas tienen reconocida una
discapacidad.

Descarga y guarda lo que usa de las once ciudades en
herramientas/discapacidad/discapacidad.json:
  - el Registro de centros de atención social de la Comunidad de Madrid:
    cada centro, con su sector, su tipo, sus plazas autorizadas y quién lo
    gestiona;
  - las personas con discapacidad reconocida por municipio, a 31 de diciembre
    (la valoración de los Centros Base): por tipo y por edad. La de tipo oculta
    las cifras pequeñas por secreto estadístico, así que el total sale de la
    de edad;
  - los centros educativos de la Comunidad, para los colegios de educación
    especial dados de alta;
  - los niños de 0 a 5 años del padrón (INE, tabla 68543, edad año a año),
    contra los que se cuenta la atención temprana;
  - las aulas TEA de la lista oficial de centros de atención preferente;
  - los alumnos de educación especial de cada municipio (estadística de
    alumnos de la Comunidad), y del directorio de centros educativos, además
    de los colegios de educación especial, las UFIL, los CEPA y los equipos de
    orientación;
  - los programas profesionales de modalidad especial, del anexo IX de sus
    instrucciones de admisión (hace falta pdftotext). La lista va a mano en
    PPME y el script comprueba que coincide con el PDF.

Entran los centros públicos y los privados con plazas concertadas: la red
pública. El registro no dice cuántas de las plazas de un centro son
concertadas, así que se cuentan todas las autorizadas de esos centros.

    python3 -I herramientas/discapacidad.py            descarga y escribe
    python3 -I herramientas/discapacidad.py --sin-red  escribe con lo guardado
"""
import csv, html, io, json, os, re, subprocess, sys, tempfile, unicodedata
from urllib.request import urlopen

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUARDADO = os.path.join(RAIZ, 'herramientas/discapacidad/discapacidad.json')
API = 'https://datos.comunidad.madrid/api/3/action/package_show?id='
CATALOGO = 'https://datos.comunidad.madrid/catalogo/dataset/'
REGISTRO = 'atencion_social_registro_centros'
POR_TIPO = 'personas_discapacidad_por_tipo_y_sexo'
POR_EDAD = 'personas_discapacidad_por_edad_y_sexo'
COLEGIOS = 'centros_educativos'
EDADES = 'https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/68543.csv'
EDADES_WEB = 'https://www.ine.es/jaxiT3/Tabla.htm?t=68543'
ANIO_PADRON = '2025'
TEA = 'https://www.comunidad.madrid/educacion/atencion-preferente-necesidades-educativas-especiales'
ALUMNOS = 'spacm_estadisticas_alumnos'
PPME_PDF = ('https://www.comunidad.madrid/transparencia/sites/default/files/regulation/documents/'
            '2024-05-31_instrucciones_ppme_2024-2025_vfinal.pdf')
PPME_CURSO = '2024-2025'
# Anexo IX de las instrucciones de 2024-2025, la última oferta publicada: los
# centros de las once ciudades y sus programas (código y perfil).
PPME = [
    ('28044720', 'IES El Olivo', 'Parla', 'público', [('ARGP01', 'Reprografía')]),
    ('28042632', 'IES Ícaro', 'Getafe', 'público', [('COMP01', 'Actividades auxiliares de comercio')]),
    ('28074050', 'IES José Luis López Aranguren', 'Fuenlabrada', 'público', [('MAMP01', 'Trabajos de carpintería y mueble')]),
    ('28042991', 'IES Victoria Kent', 'Fuenlabrada', 'público',
     [('AGAP01', 'Actividades auxiliares en viveros, jardines y centros de jardinería')]),
    ('28042024', 'IES Pablo Neruda', 'Leganés', 'público',
     [('ADGP01', 'Operaciones auxiliares de servicios administrativos y generales')]),
    ('28072223', 'IES Pedro Duque', 'Leganés', 'público', [('IMPP01', 'Servicios auxiliares de peluquería')]),
    ('28038291', 'IES Salvador Dalí', 'Leganés', 'público',
     [('ADGP01', 'Operaciones auxiliares de servicios administrativos y generales')]),
    ('28026092', 'IES Los Castillos', 'Alcorcón', 'público',
     [('AGAP01', 'Actividades auxiliares en viveros, jardines y centros de jardinería'),
      ('ADGP01', 'Operaciones auxiliares de servicios administrativos y generales')]),
    ('28042668', 'IES Europa', 'Móstoles', 'público',
     [('AGAP01', 'Actividades auxiliares en viveros, jardines y centros de jardinería')]),
    ('28050720', 'IES Miguel de Cervantes', 'Móstoles', 'público',
     [('ADGP01', 'Operaciones auxiliares de servicios administrativos y generales')]),
    ('28044719', 'IES Rayuela', 'Móstoles', 'público',
     [('MAMP01', 'Trabajos de carpintería y mueble'), ('HOTP02', 'Operaciones básicas de restaurante y bar')]),
    ('28030228', 'IES León Felipe', 'Torrejón de Ardoz', 'público', [('MAMP01', 'Trabajos de carpintería y mueble')]),
    ('28022803', 'Virgen de Lourdes', 'Majadahonda', 'concertado',
     [('ADGP01', 'Operaciones auxiliares de servicios administrativos y generales'),
      ('AGAP01', 'Actividades auxiliares en viveros, jardines y centros de jardinería'),
      ('FMEP01', 'Operaciones auxiliares de fabricación mecánica'), ('HOTP01', 'Operaciones básicas de cocina'),
      ('MAMP01', 'Trabajos de carpintería y mueble'),
      ('VICP01', 'Operaciones de reproducción manual o semiautomática de productos cerámicos')]),
]
# Lo que se coge del directorio de centros, además de los colegios de educación especial.
OTROS_TIPOS = {'UFIL': 'ufil', 'CEPA': 'cepa', 'EOEP GENERAL': 'eoep', 'EOEP ATEN-TEMPR': 'eoepTemprana',
               'EOEP ESPECÍFICO': 'eoepEspecifico'}

CIUDADES = {
    'Getafe': 'getafe', 'Parla': 'parla', 'Pinto': 'pinto', 'Fuenlabrada': 'fuenlabrada',
    'Leganés': 'leganes', 'Alcorcón': 'alcorcon', 'Alcobendas': 'alcobendas', 'Móstoles': 'mostoles',
    'Torrejón de Ardoz': 'torrejon', 'Pozuelo de Alarcón': 'pozuelo', 'Majadahonda': 'majadahonda',
}
# Su código en el INE, para el padrón.
INE = {'28065': 'getafe', '28106': 'parla', '28113': 'pinto', '28058': 'fuenlabrada', '28074': 'leganes',
       '28007': 'alcorcon', '28006': 'alcobendas', '28092': 'mostoles', '28148': 'torrejon',
       '28115': 'pozuelo', '28080': 'majadahonda'}
INTELECTUAL = 'Personas con discapacidad intelectual'
MENTAL = 'Personas con enfermedad mental crónica'


def sin_tildes(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t.upper()) if unicodedata.category(c) != 'Mn')


def es_temprana(c):
    return c['tipo'] == 'CENTROS DE REHABILITACIÓN' and 'ATENCION TEMPRANA' in sin_tildes(c['denominacion'])


# Lo que pinta la web: qué centros del registro entran en cada cosa.
TIPOS = {
    'residencial': lambda c: c['sector'] == INTELECTUAL and c['tipo'] == 'CENTROS RESIDENCIALES',
    'dia': lambda c: c['sector'] == INTELECTUAL and c['tipo'] == 'CENTROS DE DÍA',
    'ocupacional': lambda c: c['sector'] == INTELECTUAL and c['tipo'] == 'CENTROS OCUPACIONALES',
    'mental': lambda c: c['sector'] == MENTAL,
    'temprana': es_temprana,
}
CAMPOS = ('sector', 'tipo', 'subtipo', 'denominacion', 'plazas_autorizadas_numero',
          'municipio_nombre', 'entidad_naturaleza', 'tipo_gestion')


def leer(url):
    with urlopen(url, timeout=180) as r:
        b = r.read()
    try:
        t = b.decode('utf-8-sig')
    except UnicodeDecodeError:
        t = b.decode('cp1252')
    return list(csv.DictReader(io.StringIO(t), delimiter=';'))


def dataset(nombre):
    with urlopen(API + nombre, timeout=60) as r:
        m = json.load(r)['result']
    url = next(x['url'] for x in m['resources'] if x['format'].upper() == 'CSV')
    return m['metadata_modified'][:10], leer(url)


def ninos():
    """Los niños de 0 a 5 años de cada ciudad, del padrón a 1 de enero."""
    n = {cid: 0 for cid in INE.values()}
    vistas = set()
    with urlopen(EDADES, timeout=300) as r:
        for f in csv.DictReader(io.TextIOWrapper(r, encoding='utf-8-sig', errors='replace'), delimiter=';'):
            cid = INE.get(f['Capitales de provincia y principales ciudades'][:5])
            edad = re.fullmatch(r'(\d+) años?', f['Edad'])
            if (cid and edad and int(edad[1]) <= 5 and f['Sexo'] == 'Total' and f['Nacionalidad'] == 'Total'
                    and f['Periodo'] == ANIO_PADRON):
                n[cid] += int(f['Total'].replace('.', ''))
                vistas.add((cid, int(edad[1])))
    if len(vistas) != 6 * len(INE):
        raise SystemExit('Faltan edades de 0 a 5 años en el padrón')
    return n


def aulas_tea():
    """Las aulas de apoyo para alumnado con TEA de cada centro de las once."""
    with urlopen(TEA, timeout=120) as r:
        t = r.read().decode('utf-8')
    x = html.unescape(re.sub(r'<[^>]+>', ' ', t)).replace('\xa0', ' ')
    x = re.sub(r'\s+', ' ', x)
    inicio = x.find('derivadas de trastorno del espectro autista')
    if inicio < 0:
        raise SystemExit('No encuentro la lista de centros TEA')
    x = x[inicio:]
    centros = []
    for m in re.finditer(r'LOCALIDAD (.+?) Nº DE AULAS DE APOYO (\d+) aulas? CÓDIGO DEL CENTRO (\d{8}) '
                         r'NOMBRE DEL CENTRO (.+?) DIRECCIÓN DEL CENTRO', x):
        localidad = sin_tildes(m[1].strip())
        ciudad = next((c for c in CIUDADES if sin_tildes(c) == localidad or
                       (c == 'Móstoles' and localidad == 'MOSTOLES')), None)
        if ciudad:
            centros.append({'municipio': ciudad, 'codigo': m[3], 'nombre': m[4].strip(), 'aulas': int(m[2])})
    if not any(c['municipio'] == 'Parla' for c in centros):
        raise SystemExit('La lista de centros TEA no trae Parla: ¿ha cambiado la página?')
    return centros


def ppme_comprobado():
    """Comprueba que la lista PPME coincide con el anexo IX del PDF."""
    with urlopen(PPME_PDF, timeout=120) as r, tempfile.TemporaryDirectory() as d:
        pdf = os.path.join(d, 'ppme.pdf')
        open(pdf, 'wb').write(r.read())
        texto = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True, check=True).stdout
    anexo = texto[texto.rfind('ANEXO IX'):]
    en_pdf = set()
    for linea in anexo.splitlines():
        m = re.match(r'\s*(\d{8})\s', linea)
        if m and any(c in linea for c in CIUDADES):
            en_pdf.add(m[1])
    if en_pdf != {c[0] for c in PPME}:
        raise SystemExit('La lista PPME no coincide con el anexo IX: ' + str(en_pdf ^ {c[0] for c in PPME}))
    for c in PPME:
        for codigo, _ in c[4]:
            if codigo not in anexo:
                raise SystemExit('Falta el perfil ' + codigo + ' en el anexo IX')


def alumnos_especial():
    """Alumnos de educación especial de cada municipio, en centros públicos y
    concertados, el último curso publicado."""
    with urlopen(API + ALUMNOS, timeout=60) as r:
        m = json.load(r)['result']
    url = next(x['url'] for x in m['resources']
               if x['format'].upper() == 'CSV' and 'regimen_general_por_titularidad_y_financiacion' in x['url'])
    filas = [f for f in leer(url) if f['ENSENANZA'] == 'Educación Especial' and f['ADES_MUNICIPIO'] in CIUDADES]
    curso = max(f['CURSO_ACADEMICO'] for f in filas)
    n = {cid: 0 for cid in CIUDADES.values()}
    for f in filas:
        if f['CURSO_ACADEMICO'] == curso and f['TCENTRO'] in ('C. Públicos', 'C. Concertados'):
            n[CIUDADES[f['ADES_MUNICIPIO']]] += int(f['DATO'])
    return {'curso': curso.replace('/', '-'), 'actualizado': m['metadata_modified'][:10], 'url': CATALOGO + ALUMNOS,
            'alumnos': n}


def descargar():
    f_reg, reg = dataset(REGISTRO)
    f_tip, tip = dataset(POR_TIPO)
    f_eda, eda = dataset(POR_EDAD)
    f_col, col = dataset(COLEGIOS)
    centros = [{k: r[k].strip() for k in CAMPOS} for r in reg
               if r['municipio_nombre'] in CIUDADES and any(t(r) for t in TIPOS.values())]
    anio = max(int(r['Año']) for r in eda if r['Territorio'] in CIUDADES)
    personas = {cid: {} for cid in CIUDADES.values()}
    for r in tip:
        if (r['Territorio'] in CIUDADES and int(r['Año']) == anio and r['Sexo'] == 'Total'
                and r['Tipo'] == 'Intelectual o trastorno del desarrollo'):
            personas[CIUDADES[r['Territorio']]]['intelectual'] = int(r['Valor'])
    for r in eda:
        if r['Territorio'] in CIUDADES and int(r['Año']) == anio and r['Sexo'] == 'Total':
            clave = {'Total': 'total', 'De 0 a 64 años': 'menos65'}.get(r['Edad'])
            if clave:
                personas[CIUDADES[r['Territorio']]][clave] = int(r['Valor'])
    colegios = [{'municipio': r['MUNICIPIO'], 'nombre': r['CENTRO'].strip(), 'tipo': r['TIPO_ABRV'],
                 'titularidad': r['TITULARIDAD']} for r in col
                if r['MUNICIPIO'] in CIUDADES and r['TIPO_ABRV'] in ('CP EE', 'CPR EE') and r['SITUACIÓN'] == 'ALTA']
    otros = [{'municipio': r['MUNICIPIO'], 'nombre': r['CENTRO'].strip(), 'tipo': OTROS_TIPOS[r['TIPO_ABRV']]} for r in col
             if r['MUNICIPIO'] in CIUDADES and r['TIPO_ABRV'] in OTROS_TIPOS and r['SITUACIÓN'] == 'ALTA']
    ppme_comprobado()
    return {'registro': {'actualizado': f_reg, 'url': CATALOGO + REGISTRO},
            'reconocidas': {'actualizado': max(f_tip, f_eda), 'anio': anio, 'url': CATALOGO + POR_TIPO,
                            'urlEdad': CATALOGO + POR_EDAD},
            'colegios': {'actualizado': f_col, 'url': CATALOGO + COLEGIOS, 'centros': colegios, 'otros': otros},
            'tea': {'url': TEA, 'centros': aulas_tea()},
            'especial': alumnos_especial(),
            'padron': {'anio': ANIO_PADRON, 'url': EDADES_WEB, 'ninos0a5': ninos()},
            'centros': centros, 'personas': personas}


# El registro escribe los nombres en mayúsculas y casi siempre sin tildes. Se
# pasan a nombre propio: las siglas de las entidades se quedan como están.
SIGLAS = {'APANID', 'AFANIAS', 'APAMA', 'APANSA', 'APSURIA', 'ASTOR', 'CAMP', 'INTRESS', 'ISFAS', 'APNIC',
          'CRPS', 'AMAS', 'COFOIL', 'CEPRI', 'AUCAVI', 'S.L.', 'C/'}
MENORES = {'de', 'del', 'y', 'para', 'con', 'a', 'en'}
ARTICULOS = {'el', 'la', 'los', 'las'}
TILDES = {'rehabilitacion': 'rehabilitación', 'dia': 'día', 'atencion': 'atención', 'fundacion': 'fundación',
          'alcorcon': 'alcorcón', 'leganes': 'leganés', 'torrejon': 'torrejón', 'mostoles': 'móstoles',
          'jardineria': 'jardinería', 'minusvalidos': 'minusválidos', 'angeles': 'ángeles', 'ramon': 'ramón',
          'jimenez': 'jiménez', 'garcia': 'garcía', 'diaz': 'díaz', 'dali': 'dalí', 'zurbaran': 'zurbarán',
          'jaen': 'jaén', 'accion': 'acción', 'asociacion': 'asociación', 'gestion': 'gestión',
          'psiquicos': 'psíquicos', 'gudal': 'gúdal', 'pesonas': 'personas', 'maria': 'maría',
          'ines': 'inés', 'educacion': 'educación'}


def palabra(p, anterior):
    """Una palabra: siglas y números romanos tal cual; «de», «y»… y el artículo
    detrás de «de», en minúscula; el resto, con mayúscula."""
    limpio = p.strip(',"()')
    if limpio in SIGLAS or limpio.rstrip('.') in SIGLAS or re.fullmatch(r'[IVX]+', limpio):
        return p
    q = p.lower()
    base = q.strip(',"()')
    q = q.replace(base, TILDES.get(base, base))
    if anterior is not None and (base in MENORES or base in ARTICULOS and (anterior in ('de', 'del') or re.fullmatch(r'[ivx]+', anterior))):
        return q
    return re.sub(r'[a-záéíóúüñ]', lambda m: m[0].upper(), q, count=1)


def nombre_propio(t):
    t = re.sub(r'\.(?=\w)', '. ', t)
    t = re.sub(r'\bNTRA\. ', 'Nuestra ', re.sub(r'\bSRA\. ', 'Señora ', re.sub(r'\bD\. ', 'Don ', t)))
    t = re.sub(r'\s*-\s*', ' - ', t)
    t = re.sub(r'\s+', ' ', t.replace(' ,', ',')).strip()
    t = re.sub(r'S\. ?L\.?$', 'S.L.', t).rstrip(' -')
    salida, anterior = [], None
    for p in t.split(' '):
        salida.append(p if p == '-' else palabra(p, anterior))
        anterior = p.lower().strip(',"()')
    t = ' '.join(salida).replace(' - ', ', ').replace(',,', ',')
    return re.sub(r'^([A-Z]+)\. ', r'\1, ', t if t.endswith('S.L.') else t.rstrip('.'))


MESES = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()


def fecha(iso):
    a, m, d = iso.split('-')
    return f'{int(d)} de {MESES[int(m) - 1]} de {a}'


def red_publica(c):
    return c['entidad_naturaleza'] == 'PÚBLICA' or 'CONCERTADA' in c['tipo_gestion']


def escribir(g):
    for cid in CIUDADES.values():
        if sorted(g['personas'][cid]) != ['intelectual', 'menos65', 'total']:
            raise SystemExit('Faltan personas con discapacidad reconocida en ' + cid)
    ciudades = {cid: dict(g['personas'][cid], ninos0a5=g['padron']['ninos0a5'][cid]) for cid in CIUDADES.values()}
    for clave, entra in TIPOS.items():
        for cid in CIUDADES.values():
            ciudades[cid][clave] = {'plazas': 0, 'centros': []}
        for c in g['centros']:
            if not entra(c) or not red_publica(c):
                continue
            if not c['plazas_autorizadas_numero'].isdigit():
                raise SystemExit('Centro sin cifra de plazas: ' + c['denominacion'])
            n = int(c['plazas_autorizadas_numero'])
            x = ciudades[CIUDADES[c['municipio_nombre']]][clave]
            x['plazas'] += n
            x['centros'].append([nombre_propio(c['denominacion']), n, 'pública' if c['entidad_naturaleza'] == 'PÚBLICA' else 'concertada'])
    # Los colegios de educación especial: públicos y concertados, sin plazas.
    for cid in CIUDADES.values():
        ciudades[cid]['especial'] = {'colegios': 0, 'centros': []}
    for c in g['colegios']['centros']:
        if c['titularidad'] not in ('PÚBLICO', 'PRIVADO CONCERTADO'):
            continue
        x = ciudades[CIUDADES[c['municipio']]]['especial']
        x['colegios'] += 1
        x['centros'].append([nombre_propio(c['nombre']), None, 'público' if c['titularidad'] == 'PÚBLICO' else 'concertado'])
    # Sus alumnos: los de los colegios de educación especial y los de las aulas
    # de educación especial de los colegios ordinarios.
    for cid in CIUDADES.values():
        ciudades[cid]['especial']['alumnos'] = g['especial']['alumnos'][cid]
    # Las aulas TEA, públicas y concertadas («CPR» es un centro privado).
    for cid in CIUDADES.values():
        ciudades[cid]['tea'] = {'aulas': 0, 'centros': []}
    for c in g['tea']['centros']:
        x = ciudades[CIUDADES[c['municipio']]]['tea']
        x['aulas'] += c['aulas']
        x['centros'].append([c['nombre'], c['aulas'], 'concertado' if c['nombre'].startswith('CPR') else 'público'])
    # Los programas profesionales de modalidad especial: uno por perfil.
    for cid in CIUDADES.values():
        ciudades[cid]['ppme'] = {'programas': 0, 'centros': []}
    for codigo, nombre, municipio, titularidad, perfiles in PPME:
        x = ciudades[CIUDADES[municipio]]['ppme']
        x['programas'] += len(perfiles)
        x['centros'].append([nombre + ': ' + ', '.join(p[1].lower() for p in perfiles), len(perfiles), titularidad])
    # Las UFIL, los CEPA y los equipos de orientación, con sus nombres.
    for cid in CIUDADES.values():
        ciudades[cid]['orientacion'] = {k: [] for k in OTROS_TIPOS.values()}
    for c in g['colegios']['otros']:
        ciudades[CIUDADES[c['municipio']]]['orientacion'][c['tipo']].append(nombre_propio(c['nombre']))
    for x in ciudades.values():
        for v in x['orientacion'].values():
            v.sort()
        for clave in list(TIPOS) + ['especial', 'tea', 'ppme']:
            x[clave]['centros'].sort(key=lambda c: (-(c[1] or 0), c[2] != 'público', c[0]))
    salida = {
        'anio': g['reconocidas']['anio'],
        'anioPadron': g['padron']['anio'],
        'cursoEspecial': g['especial']['curso'],
        'cursoPpme': PPME_CURSO,
        'fuentes': {
            'registro': ['Comunidad de Madrid · Registro de centros de atención social, a ' + fecha(g['registro']['actualizado']),
                         g['registro']['url']],
            'reconocidas': ['Comunidad de Madrid · Personas con discapacidad reconocida por tipo, a 31 de diciembre de ' +
                            str(g['reconocidas']['anio']), g['reconocidas']['url']],
            'reconocidasEdad': ['Comunidad de Madrid · Personas con discapacidad reconocida por edad, a 31 de diciembre de ' +
                                str(g['reconocidas']['anio']), g['reconocidas']['urlEdad']],
            'colegios': ['Comunidad de Madrid · Centros educativos, a ' + fecha(g['colegios']['actualizado']),
                         g['colegios']['url']],
            'ninos': ['INE · Población por edad año a año, 1 de enero de ' + g['padron']['anio'], g['padron']['url']],
            'tea': ['Comunidad de Madrid · Centros de atención preferente para alumnado con TEA', g['tea']['url']],
            'alumnos': ['Comunidad de Madrid · Estadística de alumnos, curso ' + g['especial']['curso'], g['especial']['url']],
            'ppme': ['Comunidad de Madrid · Programas profesionales de modalidad especial, oferta ' + PPME_CURSO +
                     ' (anexo IX)', PPME_PDF],
        },
        'ciudades': ciudades,
    }
    with open(os.path.join(RAIZ, 'datos/discapacidad.js'), 'w', encoding='utf-8') as s:
        s.write('/* Escrito por herramientas/discapacidad.py desde herramientas/discapacidad/discapacidad.json. No editar a mano. */\n')
        s.write('window.DISCAPACIDAD = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('ciudad       personas intel. 0-5 |', *TIPOS, '| especial alumnos tea ppme | ufil cepa eoep')
    for cid, x in ciudades.items():
        o = x['orientacion']
        print(cid.ljust(12), x['total'], x['intelectual'], x['ninos0a5'], '|', *(x[k]['plazas'] for k in TIPOS), '|',
              x['especial']['colegios'], x['especial']['alumnos'], x['tea']['aulas'], x['ppme']['programas'], '|',
              len(o['ufil']), len(o['cepa']), len(o['eoep']) + len(o['eoepTemprana']) + len(o['eoepEspecifico']))


if __name__ == '__main__':
    if '--sin-red' in sys.argv:
        g = json.load(open(GUARDADO, encoding='utf-8'))
    else:
        g = descargar()
        os.makedirs(os.path.dirname(GUARDADO), exist_ok=True)
        with open(GUARDADO, 'w', encoding='utf-8') as s:
            json.dump(g, s, ensure_ascii=False, indent=1)
            s.write('\n')
    escribir(g)

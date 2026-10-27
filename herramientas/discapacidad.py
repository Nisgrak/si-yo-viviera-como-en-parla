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
    contra los que se cuenta la atención temprana.

Entran los centros públicos y los privados con plazas concertadas: la red
pública. El registro no dice cuántas de las plazas de un centro son
concertadas, así que se cuentan todas las autorizadas de esos centros.

    python3 -I herramientas/discapacidad.py            descarga y escribe
    python3 -I herramientas/discapacidad.py --sin-red  escribe con lo guardado
"""
import csv, io, json, os, re, sys, unicodedata
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
    return {'registro': {'actualizado': f_reg, 'url': CATALOGO + REGISTRO},
            'reconocidas': {'actualizado': max(f_tip, f_eda), 'anio': anio, 'url': CATALOGO + POR_TIPO,
                            'urlEdad': CATALOGO + POR_EDAD},
            'colegios': {'actualizado': f_col, 'url': CATALOGO + COLEGIOS, 'centros': colegios},
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
    for x in ciudades.values():
        for clave in list(TIPOS) + ['especial']:
            x[clave]['centros'].sort(key=lambda c: (-(c[1] or 0), c[2] != 'público', c[0]))
    salida = {
        'anio': g['reconocidas']['anio'],
        'anioPadron': g['padron']['anio'],
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
        },
        'ciudades': ciudades,
    }
    with open(os.path.join(RAIZ, 'datos/discapacidad.js'), 'w', encoding='utf-8') as s:
        s.write('/* Escrito por herramientas/discapacidad.py desde herramientas/discapacidad/discapacidad.json. No editar a mano. */\n')
        s.write('window.DISCAPACIDAD = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('ciudad       personas intel. 0-5 |', *TIPOS, 'especial')
    for cid, x in ciudades.items():
        print(cid.ljust(12), x['total'], x['intelectual'], x['ninos0a5'], '|', *(x[k]['plazas'] for k in TIPOS), x['especial']['colegios'])


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

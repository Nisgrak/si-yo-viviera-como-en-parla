#!/usr/bin/env python3
"""Escribe herramientas/infantil/infantil.json: plazas públicas de 0 a 2 años
frente a la demanda, en Parla y las otras diez ciudades.

De dónde sale cada número:

1. La lista de centros: el catálogo de centros educativos de la Comunidad de
   Madrid (datos abiertos), centros en ALTA de los once municipios que pueden
   tener primer ciclo de Educación Infantil (escuelas infantiles, casas de
   niños, colegios y escuelas infantiles privadas, por si alguna está
   sostenida con fondos públicos).

2. Por cada centro, el «Buscador de colegios» de la Comunidad de Madrid
   (gestiona.comunidad.madrid/wpad_pub, ficha del centro). La ficha pinta dos
   gráficas para la etapa «Infantil I Ciclo» (código 10) y los números van en
   la respuesta del servicio DWR que la dibuja:
     - gráfica 1, «Número de alumnos»: alumnos matriculados por curso;
     - gráfica 3, «Proceso de admisión»: solicitudes presentadas en el centro
       (en primera opción), admitidas de las presentadas en el centro,
       admitidas de las presentadas en otro centro y no admitidas.
   Se guardan las respuestas en /var/tmp/infantil/dwr/ para no volver a
   pedirlas.

3. Niños de 0 a 2 años: BASES.infantil de datos/datos.js (INE, tabla 68543,
   padrón a 1 de enero de 2025), los mismos que ya usa la web.

    python3 -I herramientas/infantil/infantil.py [--sin-red]
"""
import csv, json, os, re, sys, time, urllib.request
from collections import defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TMP = '/var/tmp/infantil'
CACHE = os.path.join(TMP, 'dwr')
SALIDA = os.path.join(RAIZ, 'herramientas/infantil/infantil.json')
SIN_RED = '--sin-red' in sys.argv

URL_CENTROS = ('https://datos.comunidad.madrid/dataset/c750856d-3166-4dac-8e80-d1b824c968b5/'
               'resource/28d60557-1d73-4281-ab08-6cfd3b2f5f83/download/centros_educativos.csv')
URL_DWR = 'https://gestiona.comunidad.madrid/wpad_pub/dwr/exec/GraficasDWRAccion.obtenerGrafica.dwr'
URL_FICHA = 'https://gestiona.comunidad.madrid/wpad_pub/run/j/MostrarFichaCentro.icm?cdCentro={}'
UA = {'User-Agent': 'Mozilla/5.0 (si-yo-viviera-como-en-parla)'}

CIUDADES = {
    'Parla': 'parla', 'Getafe': 'getafe', 'Pinto': 'pinto', 'Fuenlabrada': 'fuenlabrada',
    'Leganés': 'leganes', 'Alcorcón': 'alcorcon', 'Alcobendas': 'alcobendas',
    'Móstoles': 'mostoles', 'Torrejón de Ardoz': 'torrejon', 'Pozuelo de Alarcón': 'pozuelo',
    'Majadahonda': 'majadahonda',
}
# Tipos de centro que pueden impartir primer ciclo (0-2 años).
TIPOS = ('EEI', 'EEI-CN', 'ZNAS.CN.', 'AULA.C.N. EN E.I.', 'EIPR', 'CPR INF', 'CPR INF-PRI',
         'CPR INF-PRI-SEC', 'CPR INF-SEC', 'CP INF-PRI', 'CP INF-PRI-SEC')


def baja(url, ruta, datos=None):
    if os.path.exists(ruta) and os.path.getsize(ruta) > 0:
        return open(ruta, 'rb').read()
    if SIN_RED:
        raise SystemExit('Falta ' + ruta + ' y se ha pedido --sin-red')
    req = urllib.request.Request(url, data=datos, headers=dict(UA, **({'Content-Type': 'text/plain'} if datos else {})))
    for intento in range(4):
        try:
            b = urllib.request.urlopen(req, timeout=90).read()
            break
        except Exception as e:  # noqa: BLE001
            if intento == 3:
                raise
            time.sleep(3 * (intento + 1))
    open(ruta, 'wb').write(b)
    time.sleep(0.25)
    return b


def grafica(centro, cd_grafica):
    """Pide una gráfica de la ficha del centro para Infantil I Ciclo y devuelve
    {nombreSerie: {curso: valor}}."""
    extra_e = 'c0-e5=string:0\n' if cd_grafica == 3 else ''
    extra_p = ', tipoSolicitud:reference:c0-e5' if cd_grafica == 3 else ''
    cuerpo = ('callCount=1\nc0-scriptName=GraficasDWRAccion\nc0-methodName=obtenerGrafica\nc0-id=1_1\n'
              f'c0-e1=string:{centro}\nc0-e2=string:10\nc0-e3=string:{cd_grafica}\nc0-e4=string:1\n{extra_e}'
              'c0-param0=Object:{cdCentro:reference:c0-e1, cdnivelEducativo:reference:c0-e2, '
              f'cdGrafica:reference:c0-e3, tipoGrafica:reference:c0-e4{extra_p}}}\nxml=true\n')
    t = baja(URL_DWR, os.path.join(CACHE, f'{centro}_{cd_grafica}.js'), cuerpo.encode()).decode('utf-8', 'replace')
    return lee_dwr(t)


def lee_dwr(t):
    """Interpreta la respuesta DWR 1.x (asignaciones de variables JS) sin eval."""
    v = {}

    def val(x):
        x = x.strip()
        if x == 'null':
            return None
        if x in ('true', 'false'):
            return x == 'true'
        if x == '{}':
            return {}
        if x == '[]':
            return []
        if x.startswith('"'):
            return json.loads(x)
        if re.fullmatch(r'-?\d+(\.\d+)?', x):
            return float(x) if '.' in x else int(x)
        return v[x]

    for st in re.findall(r'(?:var\s+)?([^;\n]+?=[^;\n]*);', t.split('DWREngine._handleResponse')[0]):
        izq, der = st.split('=', 1)
        izq = izq.replace('var ', '').strip()
        m = re.fullmatch(r'(s\d+)\.(\w+)', izq)
        n = re.fullmatch(r'(s\d+)\[(\d+)\]', izq)
        if m:
            v[m[1]][m[2]] = val(der)
        elif n:
            lst = v[n[1]]
            i = int(n[2])
            while len(lst) <= i:
                lst.append(None)
            lst[i] = val(der)
        else:
            v[izq] = val(der)
    raiz = v.get('s0') or {}
    out = {}
    for s in raiz.get('listaSeries') or []:
        out[s['nombreSerie']] = dict(zip(s['serieX'], s['serieY']))
    return out


def ninos_0a2():
    js = open(os.path.join(RAIZ, 'datos/datos.js'), encoding='utf-8').read()
    bloque = re.search(r"infantil:\s*\{.*?valores:\s*\{(.*?)\}", js, re.S)[1]
    return {k: int(n) for k, n in re.findall(r'(\w+):\s*(\d+)', bloque)}


def escuelas_web():
    js = open(os.path.join(RAIZ, 'datos/datos.js'), encoding='utf-8').read()
    bloque = js[js.index("id: 'escuelas-infantiles'"):js.index("id: 'colegios'")]
    return {k: int(n) for k, n in re.findall(r'(\w+):\s*\{\s*n:\s*(\d+)', bloque)}


def main():
    os.makedirs(CACHE, exist_ok=True)
    raw = baja(URL_CENTROS, os.path.join(TMP, 'centros.csv')).decode('utf-8-sig')
    filas = list(csv.DictReader(raw.splitlines(), delimiter=';'))
    col_sit = [c for c in filas[0] if c.startswith('SITUACI')][0]
    centros = [f for f in filas if f['MUNICIPIO'] in CIUDADES and f[col_sit] == 'ALTA'
               and f['TIPO_ABRV'] in TIPOS]

    SER_PRES = 'Presentadas en el centro'
    SER_ADM = 'Admitidas (presentadas en el centro)'
    SER_ADM_OTRO = 'Admitidas (presentadas en otro centro)'
    SER_NO = 'No admitidas (presentadas en el centro)'

    por_ciudad = defaultdict(lambda: {'centros': []})
    cursos_adm, cursos_alu = set(), set()
    for f in centros:
        cod = f['CODIGO']
        alu = grafica(cod, 1).get('Infantil I Ciclo', {})
        adm = grafica(cod, 3)
        if not alu and not adm:
            continue
        cursos_adm.update(k for s in adm.values() for k in s)
        cursos_alu.update(alu)
        por_ciudad[CIUDADES[f['MUNICIPIO']]]['centros'].append({
            'codigo': cod, 'nombre': f['CENTRO'].strip(), 'tipo': f['TIPO_ABRV'],
            'titularidad': f['TITULARIDAD'], 'titular': f['TITULAR'],
            'alumnos': alu, 'admision': adm,
        })

    curso_adm = max(cursos_adm)
    curso_alu = max(cursos_alu)
    ninos = ninos_0a2()
    n_web = escuelas_web()

    ciudades = {}
    for cid in CIUDADES.values():
        cs = por_ciudad[cid]['centros']

        def suma(serie, curso, lista=cs):
            vals = [c['admision'].get(serie, {}).get(curso) for c in lista]
            return sum(x for x in vals if x is not None)

        # La escuela infantil de la Base Aérea de Torrejón (Ministerio de Defensa)
        # es pública pero no entra en el proceso de admisión general: fuera.
        publicos = [c for c in cs if c['titularidad'].startswith('PÚBLICO') and 'DEFENSA' not in c['titular']]
        privados = [c for c in cs if not c['titularidad'].startswith('PÚBLICO')]
        aulas_colegio = [c for c in publicos if c['tipo'].startswith('CP ')]
        pres = suma(SER_PRES, curso_adm, publicos)
        adm = suma(SER_ADM, curso_adm, publicos)
        adm_otro = suma(SER_ADM_OTRO, curso_adm, publicos)
        no = suma(SER_NO, curso_adm, publicos)
        sin_plaza = max(no - adm_otro, 0)
        matr = sum(c['alumnos'].get(curso_alu) or 0 for c in publicos)
        matr_priv = sum(c['alumnos'].get(curso_alu) or 0 for c in privados)
        historico = {}
        for cu in sorted(cursos_adm):
            p, a, ao, n = (suma(s, cu, publicos) for s in (SER_PRES, SER_ADM, SER_ADM_OTRO, SER_NO))
            historico[cu] = {'solicitudes': p, 'admitidas': a, 'admitidasDeOtroCentro': ao,
                             'noAdmitidas': n, 'sinPlazaEstimado': max(n - ao, 0)}
        n0 = ninos[cid]
        ciudades[cid] = {
            'curso': curso_adm,
            'solicitudes': pres,
            'admitidos': adm + adm_otro,
            'admitidosPrimeraOpcion': adm,
            'noAdmitidosEnPrimeraOpcion': no,
            'sinPlaza': sin_plaza,
            'pctSinPlaza': round(100 * sin_plaza / pres, 1) if pres else None,
            'solicitudesPorPlaza': round(pres / (adm + adm_otro), 2) if adm + adm_otro else None,
            'plazasOfertadas': None,
            'plazasTotales': None,
            'cursoMatricula': curso_alu,
            'matriculadosPublica0a2': matr,
            'matriculadosPrivadaConDatos0a2': matr_priv,
            'ninos0a2': n0,
            'matriculadosPublicaPor100Ninos': round(100 * matr / n0, 1),
            'solicitudesPor100Ninos': round(100 * pres / n0, 1),
            'sinPlazaPor100Ninos': round(100 * sin_plaza / n0, 1),
            'centrosPublicosConDatos': len(publicos),
            'escuelasPublicasConDatos': len(publicos) - len(aulas_colegio),
            'colegiosConAula2Anos': len(aulas_colegio),
            'solicitudesEnColegios': suma(SER_PRES, curso_adm, aulas_colegio),
            'matriculadosEnColegios': sum(c['alumnos'].get(curso_alu) or 0 for c in aulas_colegio),
            'matriculaPorCurso': {cu: sum(c['alumnos'].get(cu) or 0 for c in publicos) for cu in sorted(cursos_alu)},
            'centrosPrivadosConDatos': len(privados),
            'escuelasEnLaWeb': n_web.get(cid),
            'historico': historico,
            'centros': cs,
        }

    out = {
        'generado': time.strftime('%Y-%m-%d'),
        'cursoAdmision': curso_adm,
        'cursoMatricula': curso_alu,
        'ciudades': ciudades,
        'fuentes': [
            {'t': 'Comunidad de Madrid · Buscador de colegios: ficha de cada centro, gráficas «Número de alumnos» y «Proceso de admisión» (solicitudes presentadas, admitidas, no admitidas), etapa Infantil I Ciclo',
             'url': 'https://gestiona.comunidad.madrid/wpad_pub/run/j/MostrarConsultaGeneral.icm',
             'ejemplo': URL_FICHA.format('28043961')},
            {'t': 'Comunidad de Madrid · Centros educativos (catálogo de centros, datos abiertos)',
             'url': 'https://datos.comunidad.madrid/catalogo/dataset/centros_educativos'},
            {'t': 'INE · Población por sexo, edad año a año y nacionalidad, 1 enero 2025 (niños de 0 a 2 años, tomados de datos/datos.js BASES.infantil)',
             'url': 'https://www.ine.es/jaxiT3/Tabla.htm?t=68543'},
            {'t': 'Comunidad de Madrid · Admisión en el primer ciclo de Educación Infantil (normativa y calendario)',
             'url': 'https://www.comunidad.madrid/servicios/educacion/admision-alumnos-escuelas-infantiles-casas-ninos'},
        ],
        'notas': [],  # se rellenan abajo
    }
    out['notas'] = NOTAS
    json.dump(out, open(SALIDA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    print(f'admisión {curso_adm} · matrícula {curso_alu}')
    print(f"{'ciudad':12} {'sol':>5} {'adm':>5} {'noAdm':>5} {'admOt':>5} {'sinP':>5} {'%sin':>5} {'s/pl':>5} {'matr':>5} {'n0-2':>5} {'m/100':>5} {'ctr':>3} {'web':>3}")
    for cid, c in sorted(ciudades.items(), key=lambda x: -(x[1]['pctSinPlaza'] or 0)):
        print(f"{cid:12} {c['solicitudes']:5} {c['admitidos']:5} {c['noAdmitidosEnPrimeraOpcion']:5} "
              f"{c['admitidos'] - c['admitidosPrimeraOpcion']:5} {c['sinPlaza']:5} {c['pctSinPlaza']!s:>5} "
              f"{c['solicitudesPorPlaza']!s:>5} {c['matriculadosPublica0a2']:5} {c['ninos0a2']:5} "
              f"{c['matriculadosPublicaPor100Ninos']:5} {c['centrosPublicosConDatos']:3} {c['escuelasEnLaWeb']!s:>3}")


NOTAS = [
    'Ni la Comunidad de Madrid ni los ayuntamientos publican, de forma comparable para los once, las plazas vacantes ofertadas ni la capacidad autorizada de cada escuela infantil por municipio. plazasOfertadas y plazasTotales quedan en null. En su lugar se usan los admitidos (aproxima las plazas libres que se cubrieron) y los matriculados.',
    'Solicitudes = «presentadas en el centro» en la ficha del Buscador de colegios: cada solicitud cuenta una sola vez, en el centro que la familia puso en primera opción. Sumar por municipio no duplica familias. Una familia que pide en un municipio y otro centro de otro municipio cuenta en el de su primera opción.',
    'admitidos = admitidas de las presentadas en el centro + admitidas de las presentadas en otro centro (familias que no entraron en su primera opción y sí en otra de la lista).',
    'sinPlaza = no admitidas (presentadas en el centro) − admitidas procedentes de otro centro, sumado por municipio, con mínimo cero. Según la ayuda del Buscador (https://gestiona.comunidad.madrid/wpad_pub/pdf/datosEstadisticos.pdf), las «admitidas presentadas en otro centro» son de otro centro del mismo Servicio de apoyo a la escolarización (SAE), y en estas ciudades el SAE de 0-3 es municipal. Es una estimación de las familias que se quedaron sin ninguna plaza pública en el proceso ordinario. No incluye a quien renunció o fue excluido, ni a quien entró después desde la lista de espera a lo largo del curso.',
    'Según esa misma ayuda, los datos son del proceso ordinario de admisión: no incluyen el proceso de reserva (niños que ya estaban en la escuela y siguen) ni el proceso extraordinario. Por eso los admitidos no son todas las plazas, solo las vacantes que salieron a concurso.',
    'Lo que no aparece aquí: las familias que ni siquiera piden plaza pública porque saben que no la van a conseguir, y los niños de 2 años escolarizados en aulas de colegios privados o concertados.',
    'Centros públicos = escuelas infantiles, escuelas infantiles-casa de niños y casas de niños de titularidad pública (Comunidad de Madrid o ayuntamiento) del catálogo de centros en ALTA, más un centro «PÚBLICO-TITULARIDAD PRIVADA» en Torrejón, si tiene datos. Solo cuentan los centros cuya ficha devuelve datos de Infantil I Ciclo; los privados con datos se dan aparte (matriculadosPrivadaConDatos0a2) y no entran en solicitudes.',
    'El curso que la ficha llama «2024-2025» en el proceso de admisión es el último que publica; la ficha no aclara si es la admisión para ese curso (primavera de 2024) o la celebrada durante ese curso (primavera de 2025, para 2025-26). La matrícula llega a 2025-2026.',
    'Desde la admisión 2025-26 la solicitud es única por SAE con hasta doce centros por orden; los cursos anteriores permitían menos opciones. Por eso la serie histórica no es del todo homogénea.',
    'Niños de 0 a 2 años: padrón a 1 de enero de 2025 (INE). La matrícula por cada 100 niños mezcla un curso escolar con un padrón; es orientativa. Además, los nacidos en el año de la admisión piden plaza de 0 años y no siempre están en ese padrón.',
    'Se incluyen las aulas de 2 años de los colegios públicos (CEIP), que también son primer ciclo público y entran en el mismo proceso de admisión: colegiosConAula2Anos, solicitudesEnColegios y matriculadosEnColegios lo separan. Parla no tiene ninguna; otras ciudades tienen de 1 a 5. Se excluye la escuela infantil de la Base Aérea de Torrejón (Ministerio de Defensa), que no participa en el proceso general.',
    'escuelasEnLaWeb es el recuento que ya usa la web (indicador escuelas-infantiles, datos/datos.js). centrosPublicosConDatos puede diferir: la web cuenta escuelas por nombre y aquí se cuentan códigos de centro con datos de admisión o matrícula (las zonas de casas de niños tienen un código propio).',
]


if __name__ == '__main__':
    main()

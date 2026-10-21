#!/usr/bin/env python3
"""Descarga lo que lee primaria.py a /var/tmp/medicos/ (o al directorio que se pase).

1. Plantilla orgánica de personal estatutario de Atención Primaria del SERMAS
   (PDF; plazas de médico de familia y pediatra por centro de salud).
2. Resultados de los indicadores de Atención Primaria del Observatorio de
   Resultados del SERMAS, 2024 (CSV; población asignada por tramos de edad y
   centro de salud: tarjetas sanitarias individuales, TSI).
3. Buscador de libre elección sanitaria del SERMAS: los centros de salud de
   cada municipio (con su municipio) y la relación de profesionales de
   medicina de familia y de pediatría que cada uno publica hoy.

    python3 -I herramientas/primaria/descarga.py [/var/tmp/medicos]
"""
import html, http.cookiejar, json, os, re, sys, time, urllib.parse, urllib.request

DEST = sys.argv[1] if len(sys.argv) > 1 else '/var/tmp/medicos'
PLANTILLA = ('https://www.comunidad.madrid/docs/2026-06/rrhh-plantillas_organicas-estatutarios-at-primariar.pdf'
             '?VersionId=Z5aEsyOAB6njawngvB6.E_MFLj4g_RGZ')
OBSERVATORIO = 'https://observatorioresultados.sanidadmadrid.org/Descargas/resultados_ap_2024.csv'
LE = 'https://www.libreeleccion.sanidadmadrid.org/Seleccione/'
MUNICIPIOS = {'parla': 'Parla', 'getafe': 'Getafe', 'pinto': 'Pinto', 'fuenlabrada': 'Fuenlabrada',
              'leganes': 'Leganés', 'alcorcon': 'Alcorcón', 'alcobendas': 'Alcobendas', 'mostoles': 'Móstoles',
              'torrejon': 'Torrejón de Ardoz', 'pozuelo': 'Pozuelo de Alarcón', 'majadahonda': 'Majadahonda'}
UA = {'User-Agent': 'Mozilla/5.0 (datos para si-yo-viviera-como-en-parla)'}


def baja(url, ruta, op=None, datos=None):
    op = op or urllib.request.build_opener()
    req = urllib.request.Request(url, data=datos, headers=UA)
    for intento in range(4):
        try:
            b = op.open(req, timeout=90).read()
            break
        except Exception as e:  # reintenta, el servidor a veces corta
            if intento == 3:
                raise
            time.sleep(3)
    if ruta:
        with open(ruta, 'wb') as f:
            f.write(b)
    return b


def main():
    os.makedirs(DEST, exist_ok=True)
    le = os.path.join(DEST, 'le'); os.makedirs(le, exist_ok=True)
    baja(PLANTILLA, os.path.join(DEST, 'plantilla_ap.pdf'))
    baja(OBSERVATORIO, os.path.join(DEST, 'resultados_ap_2024.csv'))
    indice = {'descargado': time.strftime('%Y-%m-%d'), 'municipios': {}}
    for cid, muni in MUNICIPIOS.items():
        cj = http.cookiejar.CookieJar()
        op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        t = baja(LE + 'AtencionPrimaria.aspx', None, op).decode('utf-8')
        f = dict(re.findall(r'<input type="hidden" name="([^"]+)" id="[^"]*" value="([^"]*)"', t))
        p = 'ctl00$ContenedorContenidoSeccion$BuscadorCentroPrimaria$'
        f.update({p + 'BuscadorCentroAPCriterioMunicipio': muni, p + 'CriterioCodPostal': '',
                  p + 'CriterioLikeValor': '', p + 'btnBuscar': 'Buscar'})
        r = baja(LE + 'AtencionPrimaria.aspx', os.path.join(le, f'buscar_{cid}.html'), op,
                 urllib.parse.urlencode(f).encode()).decode('utf-8')
        centros = sorted(set(re.findall(r'CentroAtencionPrimaria\.aspx/(\d+)[^"]*"[^>]*>([^<]*)', r)))
        indice['municipios'][cid] = [{'codigo': c, 'nombre': html.unescape(n).strip()} for c, n in centros]
        for c, _ in centros:
            baja(LE + f'CentroAtencionPrimaria.aspx/{c}', os.path.join(le, f'centro_{c}.html'))
            for cat in ('Familia', 'Pediatria'):
                baja(LE + f'ProfesionalesCentroAtencionPrimaria.aspx/{c}/{cat}', os.path.join(le, f'{cat.lower()}_{c}.html'))
            time.sleep(0.5)
        print(cid, len(centros), file=sys.stderr)
    with open(os.path.join(le, 'indice.json'), 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()

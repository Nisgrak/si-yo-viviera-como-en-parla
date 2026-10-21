"""Descarga las listas de espera por hospital del SERMAS.

Fuente: servicio de consulta de la Comunidad de Madrid
https://servicioselectronicos.sanidadmadrid.org/LEQ/
  - Consulta.aspx               lista de espera quirúrgica por especialidad (opción «Total»)
  - ConsultaEspecialidades.aspx primera consulta externa por especialidad (opción «Total»)
  - ConsultaPruebas.aspx        pruebas diagnósticas/terapéuticas (opción «TOTAL»)

Son formularios ASP.NET: se elige hospital, luego especialidad, luego mes, y se
envía. Cada respuesta HTML se guarda tal cual en /var/tmp/espera/leq/raw/ para
que espera.py la lea. Se descargan todos los hospitales (no solo los once de
referencia) para poder comprobar que la suma cuadra con el total regional.

Uso: python3 -I descarga_espera.py [--hospital COD[,COD]] [AAAA-MM ...]   (por defecto 2026-08 2025-08 2024-08)
"""
import html
import http.cookiejar
import os
import re
import sys
import time
import urllib.parse
import urllib.request

BASE = 'https://servicioselectronicos.sanidadmadrid.org/LEQ/'
P = 'ctl00$ContenedorContenidoSeccion$'
DESTINO = '/var/tmp/espera/leq/raw'
FORMULARIOS = {
    'quirurgica': ('Consulta.aspx', 'ZTOT'),
    'consultas': ('ConsultaEspecialidades.aspx', 'ZTOT'),
    'pruebas': ('ConsultaPruebas.aspx', 'zTOT'),
}


def abrir():
    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


def pedir(op, url, datos=None):
    cuerpo = urllib.parse.urlencode(datos).encode() if datos else None
    req = urllib.request.Request(url, data=cuerpo, headers={'User-Agent': 'Mozilla/5.0 (datos civicos)'})
    for intento in range(4):
        try:
            return op.open(req, timeout=60).read().decode('utf8', 'replace')
        except Exception as e:  # reintento sencillo
            print('  reintento', intento, e, file=sys.stderr)
            time.sleep(3 * (intento + 1))
    raise RuntimeError('sin respuesta: ' + url)


def ocultos(t):
    return {m.group(1): html.unescape(m.group(2)) for m in
            re.finditer(r'<input type="hidden" name="([^"]+)" id="[^"]*" value="([^"]*)"', t)}


def opciones(t, nombre):
    m = re.search(r'<select name="' + re.escape(nombre) + r'".*?</select>', t, re.S)
    return [(v, html.unescape(e)) for v, e in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)', m.group(0))] if m else []


def main():
    args = sys.argv[1:]
    solo = None
    if '--hospital' in args:  # p. ej. --hospital 2828 para bajar solo un hospital
        i = args.index('--hospital')
        solo = set(args[i + 1].split(','))
        del args[i:i + 2]
    meses = args or ['2026-08', '2025-08', '2024-08']
    os.makedirs(DESTINO, exist_ok=True)
    for tipo, (pagina, total) in FORMULARIOS.items():
        url = BASE + pagina
        op = abrir()
        t0 = pedir(op, url)
        hospitales = [(v, e) for v, e in opciones(t0, P + 'ddlHospital') if v]
        with open(os.path.join(DESTINO, f'{tipo}_hospitales.tsv'), 'w') as f:
            for v, e in hospitales:
                f.write(f'{v}\t{e}\n')
        for cod, nombre in hospitales:
            if solo and cod not in solo:
                continue
            for mes in meses:
                a, m = mes.split('-')
                fecha = f'01/{m}/{a} 0:00:00'
                fich = os.path.join(DESTINO, f'{tipo}_{cod}_{a}{m}.html')
                if os.path.exists(fich):
                    continue
                op = abrir()
                t = pedir(op, url)
                d = ocultos(t)
                d.update({'__EVENTTARGET': P + 'ddlHospital', P + 'ddlHospital': cod})
                t = pedir(op, url, d)
                if total not in [v for v, _ in opciones(t, P + 'ddlEspecialidad')]:
                    print('sin total', tipo, cod, nombre, file=sys.stderr)
                    continue
                d = ocultos(t)
                d.update({'__EVENTTARGET': P + 'ddlEspecialidad', P + 'ddlHospital': cod,
                          P + 'ddlEspecialidad': total, P + 'rblTipo': 'mes'})
                t = pedir(op, url, d)
                if fecha not in [v for v, _ in opciones(t, P + 'ddlFecha')]:
                    print('sin mes', tipo, cod, nombre, mes, file=sys.stderr)
                    continue
                d = ocultos(t)
                d.update({'__EVENTTARGET': P + 'btnEnviar', P + 'ddlHospital': cod,
                          P + 'ddlEspecialidad': total, P + 'rblTipo': 'mes', P + 'ddlFecha': fecha})
                t = pedir(op, url, d)
                with open(fich, 'w') as f:
                    f.write(t)
                print(tipo, cod, nombre, mes, 'ok')
                time.sleep(0.3)


if __name__ == '__main__':
    main()

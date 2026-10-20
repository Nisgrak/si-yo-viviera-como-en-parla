#!/usr/bin/env python3
"""Escribe datos/transporte.js y datos/transporte/<id>.js: cuánto se tarda en
transporte público desde cada punto de cada ciudad hasta Sol, Atocha, Nuevos
Ministerios y Plaza de Castilla, un martes laborable, saliendo entre las 7:30
y las 8:30.

Método, supuestos y cautelas en herramientas/transporte/fuentes/ciudad.md.

Resumen:
  - Horarios: GTFS oficiales del Consorcio Regional de Transportes de Madrid,
    leídos con tiempos.py (Cercanías, Metro, Metro Ligero, autobuses urbanos
    e interurbanos). Dos cuentas: solo tren y con autobuses.
  - Cálculo: perfiles de llegada hacia atrás desde cada destino (CSA de
    perfiles, en tiempos.py) y, para el centro de cada celda de 100 m del
    término, la mejor combinación andando hasta una parada a menos de
    1.200 m, saliendo cada minuto de la ventana. Se guarda la mediana y los
    percentiles 25 y 75 de las 61 salidas.
  - Zonas: para cada destino, cinco umbrales de 10 en 10 minutos que
    empiezan en la decena del mejor tiempo de todas las ciudades calculadas;
    la unión de las celdas con mediana igual o menor, redondeada (60 m) y
    recortada por el término municipal.
  - Fondo del mapa: las manzanas del Catastro (INSPIRE, CadastralZoning) y
    los recorridos de Cercanías, Metro y Metro Ligero de los GTFS.

Uso:
    python3 herramientas/transporte/tiempos.py --descargar      # GTFS
    python3 herramientas/transporte/ciudad.py --ciudades parla getafe

Necesita numpy y shapely (pip install --user numpy shapely). Los GTFS van a
/var/tmp/transporte/ y el Catastro a /var/tmp/catastro/.
"""
import argparse
import datetime as dt
import io
import json
import math
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

try:
    import numpy as np
    from shapely.geometry import LineString, Polygon, box
    from shapely.ops import unary_union
except ImportError as e:  # pragma: no cover
    sys.exit(f'Falta una dependencia ({e.name}). Mira el encabezado de este fichero.')

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tiempos as T  # noqa: E402
from isocronas import ORIGENES, geocodifica  # noqa: E402

RAIZ = T.RAIZ
CELDA = 100
REDONDEO = 60
MODOS = {'tren': {'cercanias', 'metro', 'ligero'},
         'todo': {'cercanias', 'metro', 'ligero', 'urbanos', 'interurbanos'}}
CATASTRO = Path('/var/tmp/catastro')
ATOM = 'https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/28/ES.SDGC.CP.atom_28.xml'


# ---------------------------------------------------------------- rejilla
def rejilla(mapa):
    """Centros de las celdas de 100 m dentro del término (EPSG:25830)."""
    cx, cy = mapa['centro']
    anillos = [[(cx + p[0], cy + p[1]) for p in r] for r in mapa['limite']]
    xs = [p[0] for r in anillos for p in r]
    ys = [p[1] for r in anillos for p in r]
    celdas = []
    x0 = math.floor(min(xs) / CELDA) * CELDA
    y0 = math.floor(min(ys) / CELDA) * CELDA
    for i in range(int((max(xs) - x0) // CELDA) + 1):
        for j in range(int((max(ys) - y0) // CELDA) + 1):
            x, y = x0 + (i + .5) * CELDA, y0 + (j + .5) * CELDA
            if T.dentro(x, y, anillos):
                celdas.append((x, y))
    termino = unary_union([Polygon(r) for r in anillos]) if len(anillos) > 1 else Polygon(anillos[0])
    return celdas, anillos, termino.buffer(0)


def anillos_rel(g, centro, tol):
    cx, cy = centro
    out = []
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        p = p.simplify(tol)
        for r in [p.exterior] + list(p.interiors):
            cs = [[round(x - cx), round(y - cy)] for x, y in r.coords[:-1]]
            if len(cs) >= 3:
                out.append(cs)
    return out


# --------------------------------------------------------------- Catastro
def leer_xml(ruta):
    """Un XML del Catastro con la codificación que declara (unos van en
    UTF-8 y otros en ISO-8859-1)."""
    crudo = ruta.read_bytes()
    m = re.search(rb'encoding="([^"]+)"', crudo[:200])
    return crudo.decode(m.group(1).decode() if m else 'utf-8')


def manzanas(ine, termino, centro):
    """Las manzanas del Catastro (CadastralZoning, nivel MANZANA)."""
    d = CATASTRO / ine
    if not d.exists():
        with urllib.request.urlopen(ATOM, timeout=120) as r:
            atom = r.read().decode('latin-1')
        url = re.search(r'(https[^"<]*/%s-[^"<]*\.zip)' % ine, atom).group(1)
        url = urllib.parse.quote(url, safe=':/')   # «TORREJON DE ARDOZ» lleva espacios
        print('bajando', url, file=sys.stderr)
        with urllib.request.urlopen(url, timeout=600) as r:
            z = zipfile.ZipFile(io.BytesIO(r.read()))
        d.mkdir(parents=True, exist_ok=True)
        z.extractall(d)
    t = leer_xml(next(d.glob('*cadastralzoning.gml')))
    polys = []
    for m in re.finditer(r'<cp:CadastralZoning .*?</cp:CadastralZoning>', t, re.S):
        if 'MANZANA' not in m.group(0):
            continue
        for pm in re.findall(r'<gml:Surface.*?</gml:Surface>|<gml:Polygon.*?</gml:Polygon>', m.group(0), re.S):
            rr = [list(map(float, p.split())) for p in re.findall(r'<gml:posList[^>]*>(.*?)</gml:posList>', pm, re.S)]
            rr = [list(zip(a[0::2], a[1::2])) for a in rr if len(a) >= 6]
            if rr:
                polys.append(Polygon(rr[0], rr[1:]).buffer(0))
    g = unary_union(polys).intersection(termino)
    return anillos_rel(g, centro, 4), len(polys)


def lineas(termino, centro):
    """Recorridos de Cercanías, Metro y Metro Ligero que pasan por el término."""
    zona = termino.buffer(1500)
    out = []
    for feed, modo in (('cercanias', 'cercanias'), ('metro', 'metro'), ('ligero', 'ligero')):
        d = T.GTFS_DIR / feed
        pts = {}
        for r in T.leer_csv(d / 'shapes.txt'):
            pts.setdefault(r['shape_id'], []).append((int(r['shape_pt_sequence']), float(r['shape_pt_lat']), float(r['shape_pt_lon'])))
        vistas = []
        for p in pts.values():
            p.sort()
            g = LineString([T.utm30(la, lo) for _, la, lo in p])
            if not g.intersects(zona):
                continue
            g = g.intersection(zona)
            if any(g.buffer(20).difference(v).area < g.buffer(20).area * 0.05 for v in vistas):
                continue
            vistas.append(g.buffer(20))
            for s in getattr(g, 'geoms', [g]):
                if s.geom_type != 'LineString':
                    continue
                s = s.simplify(8)
                out.append({'modo': modo, 'c': [[round(x - centro[0]), round(y - centro[1])] for x, y in s.coords]})
    return out


def encuadre(ine, centro):
    """La caja de las viviendas de la ciudad (edificios del Catastro con
    viviendas, sin el 1 % más apartado de cada lado, para que un cortijo
    suelto no la estire) y 500 m de margen, relativa al centro."""
    import cobertura
    ed = cobertura.edificios(ine)
    xs = sorted(x for x, _, _ in ed)
    ys = sorted(y for _, y, _ in ed)
    k = len(xs) // 100
    m = 500
    return [round(xs[k] - m - centro[0]), round(ys[k] - m - centro[1]),
            round(xs[-1 - k] + m - centro[0]), round(ys[-1 - k] + m - centro[1])]


# ----------------------------------------------------------------- cálculo
def tiempos_celdas(red, prof, celdas, minutos):
    """Para cada celda: [mediana, p25, p75] en minutos (None si no se llega)."""
    neg, vals = prof
    out = []
    for x, y in celdas:
        cerca = [(s, round(dd * T.ANDAR_FACTOR / T.ANDAR_V)) for s, dd in red.cercanas(x, y, T.ANDAR_MAX)]
        cs = [(s, w) for s, w in cerca if s in neg]
        tt = []
        for t in minutos:
            best = T.INF
            for s, w in cs:
                ar = T.consulta(neg, vals, s, t + w)
                if ar < best:
                    best = ar
            tt.append(best - t)
        out.append(T.percentiles(tt))
    return out


def zonas(celdas, med, umbrales, termino, centro):
    out = {}
    for u in umbrales:
        cajas = [box(x - CELDA / 2, y - CELDA / 2, x + CELDA / 2, y + CELDA / 2)
                 for (x, y), m in zip(celdas, med) if m is not None and m <= u]
        if not cajas:
            out[str(u)] = []
            continue
        g = unary_union(cajas).buffer(REDONDEO, quad_segs=8).buffer(-2 * REDONDEO, quad_segs=8).buffer(REDONDEO, quad_segs=8)
        out[str(u)] = anillos_rel(g.intersection(termino), centro, 6)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ciudades', nargs='+', default=['parla', 'getafe'])
    ap.add_argument('--fecha', default='2026-10-27')
    ap.add_argument('--ventana', nargs=2, default=['07:30', '08:30'])
    a = ap.parse_args()
    fecha = dt.date.fromisoformat(a.fecha)
    v0, v1 = T.hms(a.ventana[0] + ':00'), T.hms(a.ventana[1] + ':00')
    minutos = list(range(v0, v1 + 1, 60))

    mapas = {c: T.leer_mapa(c) for c in a.ciudades}
    rej = {c: rejilla(mapas[c]) for c in a.ciudades}
    xs, ys = [], []
    for c in a.ciudades:
        for r in rej[c][1]:
            for x, y in r:
                xs.append(x)
                ys.append(y)
    for la, lo in ((40.4669, -3.68917), (40.40659, -3.68938), (40.41688, -3.70326), (40.4669, -3.6889)):
        x, y = T.utm30(la, lo)
        xs.append(x)
        ys.append(y)
    caja = (min(xs) - T.MARGEN_ZONA, min(ys) - T.MARGEN_ZONA, max(xs) + T.MARGEN_ZONA, max(ys) + T.MARGEN_ZONA)

    print('cargando GTFS', file=sys.stderr)
    red = T.Red()
    for f in ('cercanias', 'metro', 'ligero', 'urbanos', 'interurbanos'):
        red.cargar(f, fecha, v0, v1 + T.LIMITE, caja)
    for av in red.avisos:
        print('AVISO', av, file=sys.stderr)
    red.transbordos()
    todas = sorted(red.conex, key=lambda c: (-c[0], -c[1]))

    for d in T.DESTINOS:
        d['ids'] = set(d['paradas'])
        if d['id'] in T.INTERCAMBIADORES:
            nombre, radio = T.INTERCAMBIADORES[d['id']]
            x0, y0 = red.stops['par_4_1'][:2]
            for s, (x, y, nom, feed) in red.stops.items():
                if feed in ('interurbanos', 'urbanos') and nombre in nom.upper() and math.hypot(x - x0, y - y0) <= radio:
                    d['ids'].add(s)

    # tiempos[modo][destino][ciudad] = lista de [med, p25, p75]
    tiempos = {}
    for modo, feeds in MODOS.items():
        red.conex_ord = [c for c in todas if c[4].split(':', 1)[0] in feeds]
        tiempos[modo] = {}
        for d in T.DESTINOS:
            print(f'{modo}: perfiles hacia {d["nombre"]}', file=sys.stderr)
            prof = T.perfiles(red, d['ids'])
            tiempos[modo][d['id']] = {c: tiempos_celdas(red, prof, rej[c][0], minutos) for c in a.ciudades}

    # Umbrales por destino: cinco, de 10 en 10, desde la decena del mejor tiempo.
    umbrales = {}
    for d in T.DESTINOS:
        mejor = min(v[0] for modo in tiempos for c in a.ciudades for v in tiempos[modo][d['id']][c] if v[0] is not None)
        u0 = max(10, math.ceil(mejor / 10) * 10)
        umbrales[d['id']] = [u0 + 10 * k for k in range(5)]

    indice = {'fecha': fecha.isoformat(), 'ventana': a.ventana, 'celda': CELDA,
              'destinos': [{'id': d['id'], 'nombre': d['nombre'], 'umbrales': umbrales[d['id']]} for d in T.DESTINOS],
              'modos': list(MODOS), 'ciudades': a.ciudades, 'fuentes': []}
    for nombre, m in red.feeds.items():
        texto = f"Consorcio Regional de Transportes de Madrid, {m['titulo']}"
        if m.get('modificado'):
            texto += f" ({m['modificado']})"
        indice['fuentes'].append([texto, m['portal']])
    indice['fuentes'].append(['Dirección General del Catastro, cartografía INSPIRE: manzanas',
                              'https://www.catastro.hacienda.gob.es/webinspire/index.html'])
    indice['fuentes'].append(['IGN, términos municipales', 'https://www.ign.es/wfs-inspire/unidades-administrativas'])

    (RAIZ / 'datos/transporte').mkdir(exist_ok=True)
    for c in a.ciudades:
        celdas, anillos, termino = rej[c]
        centro = mapas[c]['centro']
        mz, n = manzanas(mapas[c]['codigo'], termino, centro)
        x0 = min(x for x, _ in celdas)
        y0 = min(y for _, y in celdas)
        # El ayuntamiento, para elegir la estación de referencia del resumen.
        ay = geocodifica(c) if c in ORIGENES else None
        sal = {'id': c, 'centro': centro, 'origen': [round(x0 - centro[0]), round(y0 - centro[1])],
               'ayuntamiento': [round(ay['x'] - centro[0]), round(ay['y'] - centro[1])] if ay else None,
               # cada celda como [i, j] desde la primera, de 100 en 100 m
               'celdas': [[round((x - x0) / CELDA), round((y - y0) / CELDA)] for x, y in celdas],
               'manzanas': mz, 'lineas': lineas(termino, centro),
               'encuadre': encuadre(mapas[c]['codigo'], centro),
               'estaciones': T.estaciones(red, anillos, centro), 'modos': {}}
        for modo in MODOS:
            sal['modos'][modo] = {}
            for d in T.DESTINOS:
                tt = tiempos[modo][d['id']][c]
                med = [v[0] for v in tt]
                sal['modos'][modo][d['id']] = {
                    't': [v[0] for v in tt], 'p25': [v[1] for v in tt], 'p75': [v[2] for v in tt],
                    'zonas': zonas(celdas, med, umbrales[d['id']], termino, centro)}
                ok = [m for m in med if m is not None]
                print(f'{c} {modo} -> {d["nombre"]}: de {min(ok)} a {max(ok)} min', file=sys.stderr)
        cab = (f'/* GENERADO por herramientas/transporte/ciudad.py. No se edita a mano.\n'
               f'   {mapas[c]["ciudad"]}: tiempo en transporte público desde cada celda de {CELDA} m\n'
               '   hasta cada destino, mediana de las salidas de cada minuto de la ventana.\n'
               '   Coordenadas en metros respecto al centro de datos/mapa/<id>.js. */\n')
        import aligerar
        sal = aligerar.aligerar(sal)
        (RAIZ / f'datos/transporte/{c}.js').write_text(
            cab + 'window.TRANSPORTE_CIUDAD = window.TRANSPORTE_CIUDAD || {};\n'
            f'window.TRANSPORTE_CIUDAD[{json.dumps(c)}] = ' + json.dumps(sal, ensure_ascii=False, separators=(',', ':')) + ';\n',
            encoding='utf-8')
        print(c, n, 'manzanas', (RAIZ / f'datos/transporte/{c}.js').stat().st_size, 'bytes', file=sys.stderr)

    cab = ('/* GENERADO por herramientas/transporte/ciudad.py. No se edita a mano.\n'
           '   Qué ciudades están calculadas, los destinos y sus umbrales. Cada ciudad, en\n'
           '   datos/transporte/<id>.js. Método: herramientas/transporte/fuentes/ciudad.md */\n')
    (RAIZ / 'datos/transporte.js').write_text(
        cab + 'window.TRANSPORTE = ' + json.dumps(indice, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('escrito datos/transporte.js', file=sys.stderr)
    # La cobertura y el abono, de sus propios scripts.
    import indice
    indice.main()


if __name__ == '__main__':
    main()

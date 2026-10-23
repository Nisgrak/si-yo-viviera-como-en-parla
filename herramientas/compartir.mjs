/* El build de Netlify (`npm run build`, en netlify.toml). Monta dist/ con:
     la web tal cual                 index.html, assets/, datos/
     dist/<id>/index.html            una página mínima por municipio, con sus
                                     etiquetas og, que manda a /#<id>
     dist/<id>/infraestructura/      la página de las infraestructuras, ya
                                     con la ciudad puesta
     dist/<id>/vivienda/             la página de la vivienda, igual
     dist/<id>/economia/             la página de la economía, igual
     dist/<id>/sanidad/              la página de la sanidad, igual
     dist/<id>/educacion/            la de la educación, igual
     dist/<id>/espera/, cabecera/    una página mínima con la vista previa de
       infantil/                     cada sección, que manda a su página
     dist/<id>/impuestos/            y la de «Lo que paga un vecino», que
                                     manda a la economía
     dist/assets/compartir/*.png     la imagen de vista previa general y la de
                                     cada municipio, con su total; y la de cada
                                     página de cada municipio, con su dato

   WhatsApp y las redes no ejecutan JavaScript ni leen lo que va detrás de «#»,
   así que la cifra de cada ciudad tiene que ir escrita en un HTML propio. No se
   teclea: sale de assets/calculo.js, la misma cuenta que pinta la web. Y como
   se rehace en cada publicación, no puede quedarse vieja.

   Las imágenes las pinta Takumi, sin navegador. En local:
       npm install && npm run build
   y se sirve dist/ con cualquier servidor estático. */
import { Renderer } from '@takumi-rs/core';
import { fromHtml } from '@takumi-rs/helpers/html';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'dist');
const BASE = 'https://siyovivieracomoenparla.netlify.app/';

/* datos.js y calculo.js son los mismos que carga el navegador. */
globalThis.window = globalThis;
const require = createRequire(import.meta.url);
require(join(RAIZ, 'datos/datos.js'));
/* Y las cifras de las otras páginas, para su vista previa. */
require(join(RAIZ, 'datos/economia.js'));
require(join(RAIZ, 'datos/vivienda.js'));
require(join(RAIZ, 'datos/transporte.js'));
require(join(RAIZ, 'datos/sanidad.js'));
require(join(RAIZ, 'datos/impuestos.js'));
require(join(RAIZ, 'datos/primaria.js'));
require(join(RAIZ, 'datos/infantil.js'));
const CALCULO = require(join(RAIZ, 'assets/calculo.js'));
const HOSPITALES = require(join(RAIZ, 'assets/hospitales.js'));
const D = globalThis.DATOS;

/* ── La web ─────────────────────────────────────────────────────────── */

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST);
for (const x of ['index.html', 'infraestructura.html', 'vivienda.html', 'economia.html', 'sanidad.html', 'educacion.html',
  'consulta.html', 'assets', 'datos']) {
  await cp(join(RAIZ, x), join(DIST, x), { recursive: true });
}
/* La marca que le dice a app.js que aquí sí existen /getafe/ y compañía, así
   que puede poner esa ruta en la barra de direcciones. Sin build no la hay. */
const indice = join(DIST, 'index.html');
const html = await readFile(indice, 'utf8');
if (!html.includes('<html lang="es">')) throw new Error('index.html: no encuentro <html lang="es">');
await writeFile(indice, html.replace('<html lang="es">', '<html lang="es" data-rutas>'));
const infra = await readFile(join(RAIZ, 'infraestructura.html'), 'utf8');
if (!infra.includes('<html lang="es">')) throw new Error('infraestructura.html: no encuentro <html lang="es">');
await writeFile(join(DIST, 'infraestructura.html'),
  infra.replace('<html lang="es">', '<html lang="es" data-rutas>'));
const viv = await readFile(join(RAIZ, 'vivienda.html'), 'utf8');
if (!viv.includes('<html lang="es">')) throw new Error('vivienda.html: no encuentro <html lang="es">');
await writeFile(join(DIST, 'vivienda.html'),
  viv.replace('<html lang="es">', '<html lang="es" data-rutas>'));
const eco = await readFile(join(RAIZ, 'economia.html'), 'utf8');
if (!eco.includes('<html lang="es">')) throw new Error('economia.html: no encuentro <html lang="es">');
await writeFile(join(DIST, 'economia.html'),
  eco.replace('<html lang="es">', '<html lang="es" data-rutas>'));
const san = await readFile(join(RAIZ, 'sanidad.html'), 'utf8');
const edu = await readFile(join(RAIZ, 'educacion.html'), 'utf8');
for (const [f, h] of [['sanidad.html', san], ['educacion.html', edu]]) {
  if (!h.includes('<html lang="es">')) throw new Error(f + ': no encuentro <html lang="es">');
  await writeFile(join(DIST, f), h.replace('<html lang="es">', '<html lang="es" data-rutas>'));
}

/* ── Las imágenes ───────────────────────────────────────────────────── */

const fuentes = await Promise.all(['archivo-latin.woff2', 'archivo-latin-ext.woff2']
  .map((f) => readFile(join(RAIZ, 'assets/fuentes', f))));
const renderer = new Renderer();

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => '&#' + c.charCodeAt(0) + ';');

/* La cola de la ballena (assets/ballena.svg), en dos tonos que se eligen. */
const svgBallena = (await readFile(join(RAIZ, 'assets/ballena.svg'), 'utf8')).replace(/<!--[\s\S]*?-->\s*/, '');
const ballena = (sombra, luz) => 'data:image/svg+xml;base64,' + Buffer.from(
  svgBallena.replace('fill="#161616"', `fill="${sombra}"`).replace('fill="#8c8c8c"', `fill="${luz}"`)
).toString('base64');
const PROPORCION = 384 / 256;

/* El hueco, el mismo de la web: esquina corta y un trazo largo centrado en
   cada lado. Y la unidad llena, lo que hay. */
const HUECO = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" stroke="#c02719" stroke-width="1.5">' +
  '<path d="M.75 4.25V3.75a3 3 0 0 1 3-3H4.25M10.75 .75h0.5a3 3 0 0 1 3 3V4.25M14.25 10.75v0.5a3 3 0 0 1-3 3H10.75' +
  'M4.25 14.25H3.75a3 3 0 0 1-3-3V10.75M5.5 .75H9.5M14.25 5.5V9.5M9.5 14.25H5.5M.75 9.5V5.5"/></svg>').toString('base64');
const LLENO = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect width="15" height="15" rx="3" fill="#161616"/></svg>'
).toString('base64');

/* Lo que hay en negro y detrás los huecos, con el lado más grande que deje
   caber todo en 150 px de alto. */
function tira(hay, faltan, ancho) {
  const n = hay + faltan;
  let lado = 30, gap = 7;
  while (lado > 8) {
    const porFila = Math.floor((ancho + gap) / (lado + gap));
    if (Math.ceil(n / porFila) * (lado + gap) <= 150) break;
    lado -= 1; gap = Math.max(4, Math.round(lado / 4));
  }
  const u = (src) => `<img src="${src}" style="width:${lado}px;height:${lado}px">`;
  return `<div style="display:flex;flex-wrap:wrap;gap:${gap}px;width:${ancho}px">${u(LLENO).repeat(hay)}${u(HUECO).repeat(faltan)}</div>`;
}

const LIENZO = 'width:1200px;height:630px;padding:64px 72px;background:#fff;color:#161616;' +
  'font-family:Archivo;display:flex;flex-direction:column;justify-content:space-between;position:relative';

/* La marca: la ballena y el nombre. */
function marca() {
  return `<div style="display:flex;align-items:center;gap:18px">
    <img src="${ballena('#161616', '#8c8c8c')}" style="width:${Math.round(40 * PROPORCION)}px;height:40px">
    <span style="font-size:30px;font-weight:800;font-stretch:85%;letter-spacing:.14em;text-transform:uppercase">${esc(D.NOMBRE_WEB)}</span>
  </div>`;
}

/* La cola de la ballena, grande y muy clara, saliendo del borde de abajo a la
   derecha, como en la portada de la web. Va en todas las vistas previas, que
   lo que más se comparte es la página de una ciudad. */
function fondoBallena(alto = 400, derecha = 40) {
  return `<img src="${ballena('#e6e6e6', '#f1f1f1')}" style="position:absolute;right:${derecha}px;bottom:0;width:${Math.round(alto * PROPORCION)}px;height:${alto}px">`;
}

/* La general: el titular y la ballena grande, de fondo, saliendo del borde. */
function imagenGeneral() {
  const alto = 400;
  return `<div style="${LIENZO}">
    ${fondoBallena(alto)}
    ${marca()}
    <div style="display:flex;flex-direction:column;text-transform:uppercase;font-weight:800;font-stretch:62%;line-height:.88">
      <span style="font-size:96px;color:#161616">¿Y si en Parla</span>
      <span style="font-size:64px;font-weight:600;font-stretch:80%;color:#717171">viviéramos como en</span>
      <span style="font-size:120px;color:#1a67c2">Getafe, Leganés…<span style="color:#161616">?</span></span>
    </div>
    <div style="font-size:32px;line-height:1.25;color:#525252;width:760px"><span style="color:#161616;font-weight:700">Lo que le falta a Parla</span> para estar dotada como las ciudades de alrededor. Con datos oficiales.</div>
  </div>`;
}

/* La de cada ciudad: lo que le falta a Parla y la tira de lo que hay y lo
   que falta. */
function imagenCiudad(nombre, total, tiene) {
  return `<div style="${LIENZO}">
    ${fondoBallena(430, 20)}
    ${marca()}
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:${nombre.length > 12 ? 38 : 46}px;font-weight:700;font-stretch:75%;line-height:1;color:#525252;text-transform:uppercase">¿Y si en Parla viviéramos como en <span style="color:#1a67c2;font-weight:800">${esc(nombre)}</span>?</div>
      <div style="display:flex;align-items:center;gap:32px">
        <span style="font-size:230px;font-weight:800;font-stretch:62%;line-height:.8;color:#c02719">${total}</span>
        <div style="display:flex;flex-direction:column;font-size:48px;font-weight:700;line-height:1.1">
          <span>equipamientos y</span><span>servicios públicos</span><span style="color:#c02719">más</span>
        </div>
      </div>
    </div>
    ${tira(tiene, total, 1056)}
  </div>`;
}

/* Las páginas de vivienda, economía e infraestructuras: su dato principal,
   Parla en azul y la ciudad en tinta, con la misma regla que la página. */
const num = (v, d) => v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
function imagenPareja(seccion, titulo, nombre, vRef, vAqui, unidad, pie) {
  const cifra = (quien, v, color) => `<div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-size:38px;font-weight:800;font-stretch:75%;text-transform:uppercase;color:${color}">${esc(quien)}</span>
      <span style="font-size:190px;font-weight:800;font-stretch:62%;line-height:.85;color:${color}">${esc(v)}<span style="font-size:96px">${esc(unidad)}</span></span>
    </div>`;
  return `<div style="${LIENZO}">
    ${fondoBallena(400, 30)}
    <div style="display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;align-items:center;gap:18px">
        <img src="${ballena('#161616', '#8c8c8c')}" style="width:${Math.round(40 * PROPORCION)}px;height:40px">
        <span style="font-size:28px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#161616">${esc(D.NOMBRE_WEB)}</span>
        <span style="font-size:28px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#717171">· ${esc(seccion)}</span>
      </div>
      <span style="font-size:50px;font-weight:700;font-stretch:80%;line-height:1.08;color:#161616">${esc(titulo)}</span>
    </div>
    <div style="display:flex;gap:110px">${cifra('Parla', vRef, '#1a67c2')}${cifra(nombre, vAqui, '#161616')}</div>
    <div style="font-size:26px;line-height:1.25;color:#525252">${esc(pie)}</div>
  </div>`;
}

const E = globalThis.ECONOMIA, V = globalThis.VIVIENDA, TP = globalThis.TRANSPORTE;
const SA = globalThis.SANIDAD, IM = globalThis.IMPUESTOS, PR = globalThis.PRIMARIA, IN = globalThis.INFANTIL;
const ultimo = (xs) => xs[xs.length - 1];
/* El dato de cada página, como lo calcula la propia página. */
const CIFRAS = {
  economia: {
    titulo: 'Puestos de trabajo en la ciudad por cada 100 vecinos que trabajan',
    seccion: 'Economía', unidad: '',
    v: (id) => num(ultimo(E.ciudades[id].trabajo.puestos), 1),
    pie: 'Afiliados a la Seguridad Social por centro de trabajo y por residencia, a finales de 2025. Comunidad de Madrid.',
    desc: (n, a, b) => `Por cada 100 vecinos de Parla que trabajan hay ${a} puestos de trabajo en Parla; en ${n}, ${b}. El trabajo, la renta, las empresas y las cuentas del ayuntamiento, con datos oficiales.`
  },
  infraestructura: {
    titulo: 'De cada 100 viviendas, las que tienen una estación de Cercanías, Metro o Metro Ligero a 15 minutos andando',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => num(TP.cobertura.ciudades[id].pct['15'], 0),
    pie: 'Edificios del Catastro y horarios del Consorcio Regional de Transportes de Madrid, 2026.',
    desc: (n, a, b) => `De cada 100 viviendas de Parla, ${a} tienen una estación a 15 minutos andando; en ${n}, ${b}. Por dónde sale la gente en coche, cuánto se tarda en tren hasta el centro y lo que cuesta el abono.`
  },
  espera: {
    titulo: 'Días que llevan de media en lista los que esperan una operación, en el hospital que le toca a cada ciudad',
    seccion: 'La espera', unidad: ' días',
    v: (id) => SA.ciudades[id] ? num(SA.ciudades[id].quirurgica.dias, 1) : null,
    pie: 'Servicio Madrileño de Salud, listas de espera por hospital, ' + SA.mes + '.',
    desc: (n, a, b) => `Quien espera una operación en el hospital de Parla lleva de media ${a} días; en el que le toca a ${n}, ${b} días. La espera para operarse, para el especialista y para una prueba, con datos oficiales.`
  },
  cabecera: {
    titulo: 'Tarjetas sanitarias de 14 años o más por cada plaza de médico de familia en los centros de salud',
    seccion: 'El médico de cabecera', unidad: '',
    v: (id) => PR.ciudades[id] ? PR.ciudades[id].familia.toLocaleString('es-ES', { useGrouping: true }) : null,
    pie: 'Plantilla de Atención Primaria del SERMAS, octubre de 2026, y tarjetas sanitarias de ' + PR.anioTarjetas + '.',
    desc: (n, a, b) => `En los centros de salud de Parla hay una plaza de médico de familia por cada ${a} tarjetas sanitarias; en los de ${n}, una por cada ${b}. Y la espera en el hospital, con datos oficiales.`
  },
  hospital: {
    titulo: 'Camas del hospital público por cada 1.000 personas que atiende',
    seccion: 'El hospital', unidad: '',
    v: (id) => { const h = HOSPITALES.de(D, SA, id); return h && h.por1000 != null ? num(h.por1000, 1) : null; },
    pie: 'Camas: Catálogo Nacional de Hospitales 2025. Población asignada: memoria de 2024 de cada hospital del SERMAS.',
    desc: (n, a, b) => `El hospital de Parla tiene ${a} camas por cada 1.000 personas que atiende; el que le toca a ${n}, ${b}. Lo que le falta al hospital, el médico de cabecera y la espera, con datos oficiales.`
  },
  fp: {
    titulo: 'Alumnos de FP pública por cada 100 chicos y chicas de 12 a 17 años',
    seccion: 'Educación', unidad: '',
    v: (id) => { const f = D.indicadores.find((i) => i.id === 'fp'); return num(f.datos[id].n / D.BASES[f.base].valores[id] * 100, 1); },
    pie: 'Comunidad de Madrid, alumnos de régimen general, 2024, y padrón del INE a 1 de enero de 2025.',
    desc: (n, a, b) => {
      /* Lo del campus y el conservatorio, de los datos: solo si de verdad no los tiene. */
      const no = ['universidad', 'conservatorio'].filter((k) => D.indicadores.find((i) => i.id === k).datos[D.REFERENCIA].n === 0);
      const falta = no.length === 2 ? ' Y Parla no tiene campus universitario público ni conservatorio profesional.'
        : no.length ? ' Y Parla no tiene ' + (no[0] === 'universidad' ? 'campus universitario público.' : 'conservatorio profesional.') : '';
      return `En Parla hay ${a} alumnos de FP pública por cada 100 jóvenes de 12 a 17 años; en ${n}, ${b}.${falta} Con datos oficiales.`;
    }
  },
  artes: {
    titulo: 'Alumnos de música, idiomas y artes en centros públicos por cada 1.000 vecinos',
    seccion: 'Música, idiomas y artes', unidad: '',
    v: (id) => { const a = D.indicadores.find((i) => i.id === 'artes'); return num(a.datos[id].n / D.BASES.total.valores[id] * 1000, 1); },
    pie: 'Comunidad de Madrid, alumnos de enseñanzas de régimen especial, y padrón del INE a 1 de enero de 2025.',
    desc: (n, a, b) => `En Parla estudian música, idiomas o artes en centros públicos ${a} personas por cada 1.000 vecinos; en ${n}, ${b}. Con datos oficiales.`
  },
  infantil: {
    titulo: 'De cada 100 niños de 0 a 2 años, los que van a una escuela infantil pública',
    seccion: 'La escuela infantil', unidad: '',
    v: (id) => IN.ciudades[id] ? num(IN.ciudades[id].matriculadosPor100, 1) : null,
    pie: 'Comunidad de Madrid, alumnos de cada escuela infantil pública, curso ' + IN.cursoMatricula + ', y padrón del INE.',
    desc: (n, a, b) => `De cada 100 niños de 0 a 2 años, en Parla van a una escuela infantil pública ${a}; en ${n}, ${b}. Y los que se quedan sin plaza, con datos oficiales.`
  },
  impuestos: {
    titulo: 'IBI y coche al año con la vivienda media de cada ciudad, ' + IM.anio,
    seccion: 'Lo que paga un vecino', unidad: ' €',
    v: (id) => IM.ciudades[id] ? num(IM.ciudades[id].ibi + IM.ciudades[id].coche, 0) : null,
    pie: 'Tipos del Ministerio de Hacienda y valor catastral del Catastro, ' + IM.anio + '.',
    desc: (n, a, b) => `Con su casa media y un coche, un vecino de Parla paga ${a} € al año de IBI e impuesto de vehículos; uno de ${n}, ${b} €. Y con la misma casa en las dos, lo que cobra cada ayuntamiento.`
  },
  vivienda: {
    titulo: 'Viviendas nuevas por cada 100 vecinos nuevos, de 2015 a 2025',
    seccion: 'Vivienda', unidad: '',
    v: (id) => {
      const c = V.ciudades[id].crece, n = c.pob.length - 1;
      const p = c.pob[n] - c.pob[0];
      return p > 0 ? num((c.casas[n] - c.casas[0]) / p * 100, 1) : null;
    },
    pie: 'Catastro, unidades residenciales, y padrón del INE, 2015-2025.',
    desc: (n, a, b) => `Por cada 100 vecinos nuevos desde 2015, Parla ha sumado ${a} viviendas; ${n}, ${b}. Lo que cuesta comprar y alquilar, de quién son las casas y los desahucios, con datos oficiales.`
  }
};

async function pintar(html, destino) {
  const png = await renderer.render(fromHtml(html).node, { width: 1200, height: 630, fonts: fuentes });
  await writeFile(destino, png);
}

/* ── Las páginas de cada municipio ──────────────────────────────────── */

function pagina(id, nombre, total) {
  const titulo = '¿Y si en Parla viviéramos como en ' + nombre + '? Tendríamos ' + total +
    ' equipamientos públicos más';
  const desc = 'Cuántos equipamientos y servicios públicos le faltan a Parla para estar dotada como ' +
    nombre + '. Hueco a hueco, con sus fuentes oficiales.';
  const url = BASE + id + '/';
  return `<!doctype html>
<!-- GENERADO por herramientas/compartir.mjs en cada publicación.
     Solo existe para que la vista previa del enlace lleve la cifra de
     ${esc(nombre)}. Quien lo abre va directo a la web. -->
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}assets/compartir/${id}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(titulo)}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=../#${id}">
<script>location.replace('../#${id}');</script>
</head>
<body>
<p><a href="../#${id}">${esc(D.NOMBRE_WEB)} · Parla y ${esc(nombre)}</a></p>
</body>
</html>
`;
}

/* La vista previa de una sección: una página mínima, como la de cada
   municipio, que manda a la sección con ?ir= (assets/indice.js baja hasta
   ella) y deja el # para la ciudad. */
function paginaSeccion(id, ruta, destino, titulo, previa) {
  const url = BASE + id + '/' + ruta;
  return `<!doctype html>
<!-- GENERADO por herramientas/compartir.mjs en cada publicación. Solo existe
     para la vista previa del enlace; quien lo abre va a la sección. -->
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(titulo)} · ${esc(D.NOMBRE_WEB)}</title>
<meta name="description" content="${esc(previa.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(previa.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}assets/compartir/${previa.imagen}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(titulo)}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${destino}">
<script>location.replace('${destino}');</script>
</head>
<body>
<p><a href="${destino}">${esc(titulo)}</a></p>
</body>
</html>
`;
}

/* Las páginas de los accesos, la vivienda y la economía son la página entera, no una
   redirección: la ciudad va escrita en el <html> y las rutas relativas se
   resuelven desde la raíz con <base>. Así /getafe/infraestructura/ es el
   enlace que se copia. */
function paginaCiudad(id, titulo, fuente, archivo, ruta, base = '../../', previa = null) {
  const url = BASE + id + '/' + ruta;
  let h = fuente
    .replace(/<html lang="es"[^>]*>/, (m) => m.replace('>', ` data-rutas data-ciudad="${id}">`))
    .replace('<head>', `<head>\n<base href="${base}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)} · ${esc(D.NOMBRE_WEB)}</title>`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(titulo)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">\n<link rel="canonical" href="${url}">`);
  /* La vista previa con la cifra de la ciudad, si la hay. */
  if (previa) {
    h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(previa.desc)}">`)
      .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${BASE}assets/compartir/${previa.imagen}">`)
      .replace(/<meta property="og:image:alt" content="[^"]*">\n?/, '')
      .replace(/(<meta property="og:image" content="[^"]*">)/, `$1\n<meta property="og:image:alt" content="${esc(titulo)}">`);
    if (!h.includes(previa.imagen)) throw new Error(archivo + ': no se pudo poner la imagen de ' + id);
  }
  for (const a of ['data-ciudad', '<base', url]) {
    if (!h.includes(a)) throw new Error(archivo + ': no se pudo marcar ' + a);
  }
  return h;
}
const paginaInfra = (id, nombre, previa) => paginaCiudad(id, 'Salir de Parla y salir de ' + nombre,
  infra, 'infraestructura.html', 'infraestructura/', undefined, previa);
const paginaVivienda = (id, nombre, previa) => paginaCiudad(id, 'Una casa en Parla y una casa en ' + nombre,
  viv, 'vivienda.html', 'vivienda/', undefined, previa);
const paginaEconomia = (id, nombre, previa) => paginaCiudad(id, 'El dinero de Parla y el dinero de ' + nombre,
  eco, 'economia.html', 'economia/', undefined, previa);
const paginaSanidad = (id, nombre, previa) => paginaCiudad(id, 'La sanidad de Parla y la sanidad de ' + nombre,
  san, 'sanidad.html', 'sanidad/', undefined, previa);
const paginaEducacion = (id, nombre, previa) => paginaCiudad(id, 'La educación de Parla y la educación de ' + nombre,
  edu, 'educacion.html', 'educacion/', undefined, previa);

/* Lo que le falta al hospital: la cifra en rojo y las unidades más graves,
   cada una con su hueco. */
function imagenCartera(nombre, k) {
  const muestra = (k.graves.length ? k.graves : k.faltan).slice(0, 6);
  const chip = (u) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 18px 10px 14px;border:2px solid #c02719;border-radius:10px;background:#fbeceb;font-size:28px;font-weight:700;color:#c02719"><img src="${HUECO}" style="width:22px;height:22px">${esc(u)}</div>`;
  return `<div style="${LIENZO}">
    ${fondoBallena(400, 20)}
    ${marca()}
    <div style="display:flex;align-items:center;gap:32px">
      <span style="font-size:200px;font-weight:800;font-stretch:62%;line-height:.8;color:#c02719">${k.faltan.length}</span>
      <div style="display:flex;font-size:42px;font-weight:700;line-height:1.12;width:760px">unidades que tiene ${esc(k.hospital.corto)}${k.duena === nombre.id ? '' : ', el que le toca a ' + esc(nombre.nombre) + ','} y el hospital de Parla no</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;width:1056px">${muestra.map(chip).join('')}</div>
  </div>`;
}

/* La imagen y el texto de la vista previa de una página para una ciudad. */
async function previa(clave, m) {
  const c = CIFRAS[clave];
  const a = c.v(D.REFERENCIA), b = c.v(m.id);
  if (a == null || b == null) return null;
  const imagen = `${m.id}-${clave}.png`;
  await pintar(imagenPareja(c.seccion, c.titulo, m.nombre, a, b, c.unidad, c.pie), join(DIST, 'assets/compartir', imagen));
  return { imagen, desc: c.desc(m.nombre, a, b) };
}

await mkdir(join(DIST, 'assets/compartir'), { recursive: true });
await pintar(imagenGeneral(), join(DIST, 'assets/compartir/general.png'));

/* «Todos los datos»: el título y las once en barras con un dato de verdad,
   la renta neta por persona, como se ven en la página. */
function imagenConsulta() {
  const filas = D.MUNICIPIOS.map((m) => ({ id: m.id, n: m.nombre, v: ultimo(E.ciudades[m.id].renta.persona) }))
    .sort((a, b) => b.v - a.v);
  const tope = filas[0].v;
  const barras = filas.map((f) => {
    const ref = f.id === D.REFERENCIA, color = ref ? '#1a67c2' : '#717171';
    return `<div style="display:flex;align-items:center;gap:14px;height:24px">
      <span style="width:170px;font-size:21px;font-weight:${ref ? 800 : 400};color:${ref ? '#1a67c2' : '#3a3a3a'}">${esc(f.n.replace(' de Alarcón', '').replace(' de Ardoz', ''))}</span>
      <span style="width:${Math.round(f.v / tope * 240)}px;height:12px;border-radius:6px;background:${color}"></span>
    </div>`;
  }).join('');
  return `<div style="${LIENZO};flex-direction:row;align-items:stretch;gap:56px">
    <div style="display:flex;flex-direction:column;justify-content:space-between;flex:0 0 500px;width:500px">
      <div style="display:flex;flex-direction:column;text-transform:uppercase;font-weight:800;font-stretch:62%;line-height:.9">
        <span style="font-size:96px;color:#161616">Todos los datos</span>
        <span style="font-size:48px;font-weight:700;color:#525252;margin-top:10px">de las once ciudades</span>
      </div>
      <div style="font-size:26px;line-height:1.3;color:#525252">Equipamientos, renta, trabajo, vivienda y transporte, con sus fuentes oficiales.</div>
      <div style="display:flex;align-items:center;gap:16px">
        <img src="${ballena('#161616', '#8c8c8c')}" style="width:${Math.round(34 * PROPORCION)}px;height:34px">
        <span style="font-size:24px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#161616">${esc(D.NOMBRE_WEB)}</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;justify-content:center;gap:11px;flex:1;border-left:2px solid #161616;padding-left:40px">
      <span style="font-size:20px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#717171">Renta neta por persona, 2024</span>
      ${barras}
    </div>
  </div>`;
}
await pintar(imagenConsulta(), join(DIST, 'assets/compartir/consulta.png'));
{
  const f = join(DIST, 'consulta.html');
  const h = await readFile(f, 'utf8');
  await writeFile(f, h.replace(/(<meta property="og:image" content="[^"]*)general\.png"/, '$1consulta.png"'));
}

for (const m of D.MUNICIPIOS) {
  if (m.id === D.REFERENCIA) continue;
  /* Redondeado igual que la cifra grande de la portada. */
  const cuenta = CALCULO.faltan(D, m.id);
  const total = Math.round(cuenta.TOTAL);
  await pintar(imagenCiudad(m.nombre, total, cuenta.TIENE), join(DIST, 'assets/compartir', m.id + '.png'));
  await mkdir(join(DIST, m.id), { recursive: true });
  await writeFile(join(DIST, m.id, 'index.html'), pagina(m.id, m.nombre, total));
  await mkdir(join(DIST, m.id, 'infraestructura'), { recursive: true });
  await writeFile(join(DIST, m.id, 'infraestructura', 'index.html'), paginaInfra(m.id, m.nombre, await previa('infraestructura', m)));
  await mkdir(join(DIST, m.id, 'vivienda'), { recursive: true });
  await writeFile(join(DIST, m.id, 'vivienda', 'index.html'), paginaVivienda(m.id, m.nombre, await previa('vivienda', m)));
  await mkdir(join(DIST, m.id, 'economia'), { recursive: true });
  await writeFile(join(DIST, m.id, 'economia', 'index.html'), paginaEconomia(m.id, m.nombre, await previa('economia', m)));
  /* La sanidad y la educación, con la vista previa de su sección principal. */
  for (const [ruta, hacer, clave] of [['sanidad', paginaSanidad, 'hospital'], ['educacion', paginaEducacion, 'fp']]) {
    await mkdir(join(DIST, m.id, ruta), { recursive: true });
    await writeFile(join(DIST, m.id, ruta, 'index.html'), hacer(m.id, m.nombre, await previa(clave, m)));
  }
  /* Las secciones con enlace propio. */
  for (const [clave, destino, titulo] of [
    ['hospital', `../sanidad/?ir=hospital`, 'Las camas del hospital de Parla y del que le toca a ' + m.nombre],
    ['espera', `../sanidad/?ir=espera`, 'La espera en el hospital de Parla y en el que le toca a ' + m.nombre],
    ['cabecera', `../sanidad/?ir=cabecera`, 'El médico de cabecera en Parla y en ' + m.nombre],
    ['infantil', `../educacion/?ir=infantil`, 'La escuela infantil en Parla y en ' + m.nombre],
    ['fp', `../educacion/?ir=fp`, 'La FP pública en Parla y en ' + m.nombre],
    ['artes', `../educacion/?ir=artes`, 'La música, los idiomas y las artes en Parla y en ' + m.nombre],
    ['impuestos', `../economia/?ir=paga`, 'Lo que paga un vecino de Parla y uno de ' + m.nombre]]) {
    const p = await previa(clave, m);
    if (!p) continue;
    await mkdir(join(DIST, m.id, clave), { recursive: true });
    await writeFile(join(DIST, m.id, clave, 'index.html'), paginaSeccion(m.id, clave + '/', destino, titulo, p));
  }
  /* Lo que le falta al hospital, con su propia imagen. */
  const k = HOSPITALES.cartera(D, SA, m.id);
  if (k && k.faltan.length) {
    const imagen = `${m.id}-cartera.png`;
    await pintar(imagenCartera(m, k), join(DIST, 'assets/compartir', imagen));
    const titulo = 'Lo que tiene el hospital que le toca a ' + m.nombre + ' y el de Parla no';
    const desc = `${k.faltan.length} unidades que tiene ${k.hospital.corto} y el Infanta Cristina no` +
      (k.graves.length ? `, entre ellas ${k.graves.slice(0, 3).join(', ')}` : '') + '. Con datos oficiales.';
    await mkdir(join(DIST, m.id, 'cartera'), { recursive: true });
    await writeFile(join(DIST, m.id, 'cartera', 'index.html'),
      paginaSeccion(m.id, 'cartera/', '../sanidad/?ir=cartera', titulo, { imagen, desc }));
  }
  console.log(m.id.padEnd(12), total);
}

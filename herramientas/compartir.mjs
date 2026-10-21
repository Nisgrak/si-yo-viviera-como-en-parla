/* El build de Netlify (`npm run build`, en netlify.toml). Monta dist/ con:
     la web tal cual                 index.html, assets/, datos/
     dist/<id>/index.html            una página mínima por municipio, con sus
                                     etiquetas og, que manda a /#<id>
     dist/<id>/infraestructura/      la página de las infraestructuras, ya
                                     con la ciudad puesta
     dist/<id>/vivienda/             la página de la vivienda, igual
     dist/<id>/economia/             la página de la economía, igual
     dist/<id>/espera/               una página mínima con la vista previa de
                                     «La espera», que manda al recuento
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
const CALCULO = require(join(RAIZ, 'assets/calculo.js'));
const D = globalThis.DATOS;

/* ── La web ─────────────────────────────────────────────────────────── */

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST);
for (const x of ['index.html', 'infraestructura.html', 'vivienda.html', 'economia.html', 'consulta.html', 'assets', 'datos']) {
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

/* ── Las imágenes ───────────────────────────────────────────────────── */

const fuentes = await Promise.all(['archivo-latin.woff2', 'archivo-latin-ext.woff2']
  .map((f) => readFile(join(RAIZ, 'assets/fuentes', f))));
const renderer = new Renderer();

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => '&#' + c.charCodeAt(0) + ';');

/* La unidad tachada, la misma del cartel. */
const UNIDAD = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<rect x="1.6" y="1.6" width="28.8" height="28.8" rx="4.8" fill="#f3f1ec" stroke="#c02719" stroke-width="3.2"/>' +
  '<path d="M0 32 32 0" stroke="#c02719" stroke-width="8.15"/></svg>').toString('base64');

/* Los cuadrados caben en una fila si son pocos y en dos si no: el lado se
   aprieta lo justo. Con el lado máximo caben 19 en el ancho. */
function tira(n) {
  const porFila = n <= 19 ? n : Math.ceil(n / 2);
  const lado = Math.min(44, Math.floor((1040 - 10 * (porFila - 1)) / porFila));
  const u = `<img src="${UNIDAD}" style="width:${lado}px;height:${lado}px">`;
  const ancho = porFila * lado + (porFila - 1) * 10;   /* las dos filas, iguales */
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;width:${ancho}px">${u.repeat(n)}</div>`;
}

const LIENZO = 'width:1200px;height:630px;padding:72px 80px;background:#fff;color:#161616;' +
  'font-family:Archivo;display:flex;flex-direction:column;justify-content:space-between';

function imagenGeneral() {
  return `<div style="${LIENZO}">
    <div style="display:flex;flex-direction:column;text-transform:uppercase;font-weight:800;font-stretch:62%;line-height:.88">
      <span style="font-size:92px;font-weight:700;color:#525252">Si yo viviera como en</span>
      <span style="font-size:230px;color:#c02719">Parla</span>
    </div>
    ${tira(18)}
    <div style="font-size:34px;line-height:1.25;color:#525252"><span style="color:#161616;font-weight:700">Cuántos servicios públicos perdería tu ciudad</span> si estuviera dotada igual que Parla. Con datos oficiales y con sus nombres.</div>
  </div>`;
}

function imagenCiudad(nombre, total) {
  return `<div style="${LIENZO}">
    <div style="font-size:50px;font-weight:700;font-stretch:75%;line-height:1;color:#525252;text-transform:uppercase">Si <span style="color:#1a67c2;font-weight:800">${esc(nombre)}</span> estuviera dotada como Parla</div>
    <div style="display:flex;align-items:center;gap:36px">
      <span style="font-size:250px;font-weight:800;font-stretch:62%;line-height:.8;color:#c02719">${total}</span>
      <div style="display:flex;flex-direction:column;font-size:52px;font-weight:700;line-height:1.1">
        <span>equipamientos y</span><span>servicios públicos</span><span style="color:#c02719">menos</span>
      </div>
    </div>
    ${tira(total)}
    <div style="font-size:26px;line-height:1.25;color:#525252">Con sus nombres y sus fuentes oficiales. Datos del INE, la Comunidad de Madrid y los ministerios.</div>
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
    <div style="display:flex;flex-direction:column;gap:14px">
      <span style="font-size:28px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#525252">${esc(seccion)} · Si yo viviera como en Parla</span>
      <span style="font-size:50px;font-weight:700;font-stretch:80%;line-height:1.08;color:#161616">${esc(titulo)}</span>
    </div>
    <div style="display:flex;gap:110px">${cifra('Parla', vRef, '#1a67c2')}${cifra(nombre, vAqui, '#161616')}</div>
    <div style="font-size:26px;line-height:1.25;color:#525252">${esc(pie)}</div>
  </div>`;
}

const E = globalThis.ECONOMIA, V = globalThis.VIVIENDA, TP = globalThis.TRANSPORTE;
const SA = globalThis.SANIDAD, IM = globalThis.IMPUESTOS;
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
  const titulo = 'Si ' + nombre + ' estuviera dotada como Parla: ' + total +
    ' equipamientos públicos menos';
  const desc = 'Cuántos equipamientos y servicios públicos desaparecerían de ' + nombre +
    ' si estuviera dotada igual que Parla. Con sus nombres y sus fuentes oficiales.';
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
<p><a href="../#${id}">Si yo viviera como en Parla · ${esc(nombre)}</a></p>
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
<title>${esc(titulo)}</title>
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
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)} · Si yo viviera como en Parla</title>`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(titulo)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">\n<link rel="canonical" href="${url}">`);
  /* La vista previa con la cifra de la ciudad, si la hay. */
  if (previa) {
    h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(previa.desc)}">`)
      .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${BASE}assets/compartir/${previa.imagen}">`);
    if (!h.includes(previa.imagen)) throw new Error(archivo + ': no se pudo poner la imagen de ' + id);
  }
  for (const a of ['data-ciudad', '<base', url]) {
    if (!h.includes(a)) throw new Error(archivo + ': no se pudo marcar ' + a);
  }
  return h;
}
const paginaInfra = (id, nombre, previa) => paginaCiudad(id, 'Salir de ' + nombre + ' y salir de Parla',
  infra, 'infraestructura.html', 'infraestructura/', undefined, previa);
const paginaVivienda = (id, nombre, previa) => paginaCiudad(id, 'Una casa en ' + nombre + ' y una casa en Parla',
  viv, 'vivienda.html', 'vivienda/', undefined, previa);
const paginaEconomia = (id, nombre, previa) => paginaCiudad(id, 'El dinero de ' + nombre + ' y el dinero de Parla',
  eco, 'economia.html', 'economia/', undefined, previa);

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
      <span style="font-size:22px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#c02719">Si yo viviera como en Parla</span>
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
  const total = Math.round(CALCULO.comparar(D, m.id).TOTAL);
  await pintar(imagenCiudad(m.nombre, total), join(DIST, 'assets/compartir', m.id + '.png'));
  await mkdir(join(DIST, m.id), { recursive: true });
  await writeFile(join(DIST, m.id, 'index.html'), pagina(m.id, m.nombre, total));
  await mkdir(join(DIST, m.id, 'infraestructura'), { recursive: true });
  await writeFile(join(DIST, m.id, 'infraestructura', 'index.html'), paginaInfra(m.id, m.nombre, await previa('infraestructura', m)));
  await mkdir(join(DIST, m.id, 'vivienda'), { recursive: true });
  await writeFile(join(DIST, m.id, 'vivienda', 'index.html'), paginaVivienda(m.id, m.nombre, await previa('vivienda', m)));
  await mkdir(join(DIST, m.id, 'economia'), { recursive: true });
  await writeFile(join(DIST, m.id, 'economia', 'index.html'), paginaEconomia(m.id, m.nombre, await previa('economia', m)));
  /* Las dos secciones con enlace propio. */
  for (const [clave, destino, titulo] of [
    ['espera', `../../?ir=espera#${m.id}`, 'La espera en el hospital que le toca a ' + m.nombre + ' y en el de Parla'],
    ['impuestos', `../economia/?ir=paga`, 'Lo que paga un vecino de ' + m.nombre + ' y uno de Parla']]) {
    const p = await previa(clave, m);
    if (!p) continue;
    await mkdir(join(DIST, m.id, clave), { recursive: true });
    await writeFile(join(DIST, m.id, clave, 'index.html'), paginaSeccion(m.id, clave + '/', destino, titulo, p));
  }
  console.log(m.id.padEnd(12), total);
}

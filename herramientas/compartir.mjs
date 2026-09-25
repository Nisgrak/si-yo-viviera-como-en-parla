/* El build de Netlify (`npm run build`, en netlify.toml). Monta dist/ con:
     la web tal cual                 index.html, assets/, datos/
     dist/<id>/index.html            una página mínima por municipio, con sus
                                     etiquetas og, que manda a /#<id>
     dist/assets/compartir/*.png     la imagen de vista previa general y la de
                                     cada municipio, con su total

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
const CALCULO = require(join(RAIZ, 'assets/calculo.js'));
const D = globalThis.DATOS;

/* ── La web ─────────────────────────────────────────────────────────── */

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST);
for (const x of ['index.html', 'assets', 'datos']) {
  await cp(join(RAIZ, x), join(DIST, x), { recursive: true });
}
/* La marca que le dice a app.js que aquí sí existen /getafe/ y compañía, así
   que puede poner esa ruta en la barra de direcciones. Sin build no la hay. */
const indice = join(DIST, 'index.html');
const html = await readFile(indice, 'utf8');
if (!html.includes('<html lang="es">')) throw new Error('index.html: no encuentro <html lang="es">');
await writeFile(indice, html.replace('<html lang="es">', '<html lang="es" data-rutas>'));

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

await mkdir(join(DIST, 'assets/compartir'), { recursive: true });
await pintar(imagenGeneral(), join(DIST, 'assets/compartir/general.png'));

for (const m of D.MUNICIPIOS) {
  if (m.id === D.REFERENCIA) continue;
  /* Redondeado igual que la cifra grande de la portada. */
  const total = Math.round(CALCULO.comparar(D, m.id).TOTAL);
  await pintar(imagenCiudad(m.nombre, total), join(DIST, 'assets/compartir', m.id + '.png'));
  await mkdir(join(DIST, m.id), { recursive: true });
  await writeFile(join(DIST, m.id, 'index.html'), pagina(m.id, m.nombre, total));
  console.log(m.id.padEnd(12), total);
}

/* PROTOTIPO · Las vistas previas al compartir, con Parla en el centro.
   El mismo motor que herramientas/compartir.mjs (Takumi, sin navegador) y la
   cuenta de calculo.js con los papeles cambiados, como en prototipo.js.
   Escribe prototipos/compartir/*.png; no toca el build de la web.
       node prototipos/carteles.mjs                                        */
import { Renderer } from '@takumi-rs/core';
import { fromHtml } from '@takumi-rs/helpers/html';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SALIDA = join(RAIZ, 'prototipos/compartir');
globalThis.window = globalThis;
const require = createRequire(import.meta.url);
require(join(RAIZ, 'datos/datos.js'));
const CALCULO = require(join(RAIZ, 'assets/calculo.js'));
const D = globalThis.DATOS;
const PARLA = 'parla';

/* Lo que le falta a Parla con la proporción de cada ciudad: lo mismo que la
   portada del prototipo. */
function falta(ref) {
  const r = CALCULO.comparar(Object.assign({}, D, { REFERENCIA: ref }), PARLA);
  return Math.round(r.ganancias
    .filter((c) => c.ind.enTotal !== false && c.ind.medida !== 'cartera')
    .reduce((t, c) => t - c.delta, 0));
}
const TIENE = D.indicadores.filter((i) => i.enTotal !== false)
  .reduce((t, i) => t + i.datos[PARLA].n, 0);

/* La ballena, del mismo SVG que usa el prototipo. */
const svgBallena = await readFile(join(RAIZ, 'prototipos/ballena.svg'), 'utf8');
const ballena = (sombra, luz) => 'data:image/svg+xml;base64,' + Buffer.from(
  svgBallena.replace(/<!--[\s\S]*?-->\s*/, '')
    .replace('fill="#161616"', `fill="${sombra}"`).replace('fill="#8c8c8c"', `fill="${luz}"`)
).toString('base64');
const PROPORCION = 384 / 256;

/* El hueco: esquina corta y un trazo largo centrado en cada lado. */
const HUECO = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" stroke="#c02719" stroke-width="1.5">' +
  '<path d="M.75 4.25V3.75a3 3 0 0 1 3-3H4.25M10.75 .75h0.5a3 3 0 0 1 3 3V4.25M14.25 10.75v0.5a3 3 0 0 1-3 3H10.75M4.25 14.25H3.75a3 3 0 0 1-3-3V10.75M5.5 .75H9.5M14.25 5.5V9.5M9.5 14.25H5.5M.75 9.5V5.5"/></svg>'
).toString('base64');
const LLENO = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect width="15" height="15" rx="3" fill="#161616"/></svg>'
).toString('base64');

/* Lo que hay en negro y, detrás, los huecos, en tantas filas como haga falta
   para que quepan en el ancho. */
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

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => '&#' + c.charCodeAt(0) + ';');
const LIENZO = 'width:1200px;height:630px;padding:64px 72px;background:#fff;color:#161616;' +
  'font-family:Archivo;display:flex;flex-direction:column;justify-content:space-between;position:relative';

function marca(nombre) {
  return `<div style="display:flex;align-items:center;gap:18px">
    <img src="${ballena('#161616', '#8c8c8c')}" style="width:${Math.round(40 * PROPORCION)}px;height:40px">
    <span style="font-size:30px;font-weight:800;font-stretch:85%;letter-spacing:.14em;text-transform:uppercase">${esc(nombre)}</span>
  </div>`;
}

/* La general: el nombre y la ballena grande, de fondo, saliendo del borde. */
function general(nombre) {
  const alto = 400;
  return `<div style="${LIENZO}">
    <img src="${ballena('#e2e2e2', '#efefef')}" style="position:absolute;right:40px;bottom:0;width:${Math.round(alto * PROPORCION)}px;height:${alto}px">
    ${marca(nombre)}
    <div style="display:flex;flex-direction:column;text-transform:uppercase;font-weight:800;font-stretch:62%;line-height:.88">
      <span style="font-size:96px;color:#161616">Vivo en Parla</span>
      <span style="font-size:64px;font-weight:600;font-stretch:80%;color:#717171">y si viviera como en</span>
      <span style="font-size:150px;color:#1a67c2">Getafe, Leganés…</span>
    </div>
    <div style="font-size:32px;line-height:1.25;color:#525252;width:760px"><span style="color:#161616;font-weight:700">Lo que le falta a Parla</span> para estar dotada como las ciudades de alrededor. Con datos oficiales.</div>
  </div>`;
}

/* La de cada ciudad: la cifra y la tira de lo que hay y lo que falta. */
function ciudad(nombreWeb, ref, n) {
  return `<div style="${LIENZO}">
    ${marca(nombreWeb)}
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:${ref.length > 12 ? 38 : 46}px;font-weight:700;font-stretch:75%;line-height:1;color:#525252;text-transform:uppercase">Si Parla estuviera dotada como <span style="color:#1a67c2;font-weight:800">${esc(ref)}</span></div>
      <div style="display:flex;align-items:center;gap:32px">
        <span style="font-size:230px;font-weight:800;font-stretch:62%;line-height:.8;color:#c02719">${n}</span>
        <div style="display:flex;flex-direction:column;font-size:48px;font-weight:700;line-height:1.1">
          <span>equipamientos y</span><span>servicios públicos</span><span style="color:#c02719">más</span>
        </div>
      </div>
    </div>
    ${tira(TIENE, n, 1056)}
  </div>`;
}

const fuentes = await Promise.all(['archivo-latin.woff2', 'archivo-latin-ext.woff2']
  .map((f) => readFile(join(RAIZ, 'assets/fuentes', f))));
const renderer = new Renderer();
async function pintar(html, destino) {
  const png = await renderer.render(fromHtml(html).node, { width: 1200, height: 630, fonts: fuentes });
  await writeFile(join(SALIDA, destino), png);
}

await mkdir(SALIDA, { recursive: true });
const NOMBRES = { cola: 'Parla, a la cola', pobre: 'Pobre Parla' };
for (const [k, nombre] of Object.entries(NOMBRES)) await pintar(general(nombre), `general-${k}.png`);
for (const m of D.MUNICIPIOS) {
  if (m.id === PARLA) continue;
  const n = falta(m.id);
  await pintar(ciudad(NOMBRES.cola, m.nombre, n), `${m.id}.png`);
  console.log(m.nombre.padEnd(20), n);
}

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
     dist/<id>/inclusion/            la de la inclusión, igual
     dist/<id>/espera/, cabecera/    una página mínima con la vista previa de
       infantil/, residencia/…       cada sección con «Compartir esta
                                     sección», que manda a su página
     dist/<id>/impuestos/            y la de «Lo que paga un vecino», que
                                     manda a la economía
     dist/<id>/ind-metro/…           una por cada ficha del recuento de la portada
                                     (ind-<id>), con su imagen <id>-ind-<id>.png,
                                     que manda a la portada con la ficha abierta
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
require(join(RAIZ, 'datos/discapacidad.js'));
require(join(RAIZ, 'datos/contexto.js'));
require(join(RAIZ, 'datos/infraestructura.js'));
const CALCULO = require(join(RAIZ, 'assets/calculo.js'));
const HOSPITALES = require(join(RAIZ, 'assets/hospitales.js'));
const D = globalThis.DATOS;

/* ── La web ─────────────────────────────────────────────────────────── */

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST);
for (const x of ['index.html', 'infraestructura.html', 'vivienda.html', 'economia.html', 'sanidad.html', 'educacion.html',
  'inclusion.html', 'consulta.html', 'assets', 'datos']) {
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
const inc = await readFile(join(RAIZ, 'inclusion.html'), 'utf8');
for (const [f, h] of [['sanidad.html', san], ['educacion.html', edu], ['inclusion.html', inc]]) {
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
function imagenPareja(seccion, titulo, nombre, vRef, vAqui, unidad, pie, sola, x) {
  /* x (opcional): { nota: [Parla, otra], linea: [Parla, otra], pos } — una línea bajo el nombre
     (el hospital, la salida), las líneas bajo la cifra (una o varias) y una frase de puesto. */
  const extra = !!(x && (x.nota || x.linea || x.pos));
  /* La cifra llena su columna: 190 px, y menos si es larga («288.935 €»), que si no se sale de la imagen.
     Con líneas debajo, 140 px, para que todo quepa en 630 de alto. */
  const tope = extra ? 140 : 190;
  const lado = (v) => Math.min(tope, Math.floor(470 / (String(v).length * 0.39 + unidad.length * 0.2)));
  const lineas = (k, i) => [].concat((x && x.linea && x.linea[i]) || []);
  const cifra = (quien, v, color, i) => `<div style="display:flex;flex-direction:column;gap:${extra ? 4 : 6}px${extra ? ';width:470px' : ''}">
      <span style="font-size:${extra ? 34 : 38}px;font-weight:800;font-stretch:75%;text-transform:uppercase;color:${color}">${esc(quien)}</span>
      ${x && x.nota && x.nota[i] ? `<span style="font-size:24px;font-weight:600;line-height:1.05;color:#525252">${esc(x.nota[i])}</span>` : ''}
      <span style="font-size:${lado(v)}px;font-weight:800;font-stretch:62%;line-height:.85;color:${color};white-space:nowrap">${esc(v)}<span style="font-size:${Math.round(lado(v) * 0.505)}px">${esc(unidad)}</span></span>
      ${lineas('linea', i).map((t, n) => `<span style="font-size:24px;font-weight:600;line-height:1.1;color:#161616;margin-top:${n ? 0 : 14}px">${esc(t)}</span>`).join('')}
    </div>`;
  const pequeno = extra;
  return `<div style="${LIENZO}">
    ${fondoBallena(400, 30)}
    <div style="display:flex;flex-direction:column;gap:${extra ? 12 : 18}px">
      <div style="display:flex;align-items:center;gap:18px">
        <img src="${ballena('#161616', '#8c8c8c')}" style="width:${Math.round(40 * PROPORCION)}px;height:40px">
        <span style="font-size:28px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#161616">${esc(D.NOMBRE_WEB)}</span>
        <span style="font-size:28px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#717171">· ${esc(seccion)}</span>
      </div>
      <span style="font-size:${pequeno ? 40 : 50}px;font-weight:700;font-stretch:80%;line-height:1.08;color:#161616">${esc(titulo)}</span>
    </div>
    ${vAqui == null
    /* Sin dato de la otra ciudad: Parla sola, con su puesto y el motivo. */
    ? `<div style="display:flex;align-items:flex-end;gap:70px">${cifra('Parla', vRef, '#1a67c2', 0)}<div style="display:flex;flex:1;font-size:34px;font-weight:700;line-height:1.2;color:#161616">${esc(sola)}</div></div>`
    : `<div style="display:flex;gap:${extra ? 60 : 110}px">${cifra('Parla', vRef, '#1a67c2', 0)}${cifra(nombre, vAqui, '#161616', 1)}</div>`}
    ${x && x.pos ? `<div style="display:flex;font-size:26px;font-weight:700;line-height:1.15;color:#161616">${esc(x.pos)}</div>` : ''}
    <div style="font-size:${extra ? 22 : 26}px;line-height:1.2;color:#525252">${esc(pie)}</div>
  </div>`;
}

/* La ficha del recuento de la portada: su título, Parla y la otra ciudad frente
   a frente con las dos cifras que enseña la ficha, el hueco como lo dice su
   titular y el pie con la fuente. d: ver fichaDatos(). */
function imagenFicha(d) {
  const lado = (v) => Math.min(170, Math.floor(480 / (String(v).length * 0.39)));
  const cifra = (quien, v, color) => `<div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-size:36px;font-weight:800;font-stretch:75%;text-transform:uppercase;color:${color}">${esc(quien)}</span>
      <span style="font-size:${lado(v)}px;font-weight:800;font-stretch:62%;line-height:.85;color:${color};white-space:nowrap">${esc(v)}</span>
    </div>`;
  const tono = d.modo === 'sobra' ? '#17652c' : '#c02719';
  return `<div style="${LIENZO}">
    ${fondoBallena(400, 30)}
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:18px">
        <img src="${ballena('#161616', '#8c8c8c')}" style="width:${Math.round(40 * PROPORCION)}px;height:40px">
        <span style="font-size:28px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#161616">${esc(D.NOMBRE_WEB)}</span>
        <span style="font-size:28px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#717171">· ${esc(d.grupo)}</span>
      </div>
      <span style="font-size:${d.titulo.length > 40 ? 44 : 50}px;font-weight:700;font-stretch:80%;line-height:1.08;color:#161616">${esc(d.titulo)}</span>
      <span style="font-size:28px;font-weight:600;color:#525252">${esc(d.ley)}</span>
    </div>
    <div style="display:flex;gap:110px">${cifra('Parla', d.parla, '#1a67c2')}${cifra(d.nombre, d.otra, '#161616')}</div>
    <div style="display:flex;font-size:38px;font-weight:700;font-stretch:85%;line-height:1.1;color:${tono}">${esc(d.linea)}</div>
    <div style="font-size:22px;line-height:1.25;color:#525252">${esc(d.pie)}</div>
  </div>`;
}

const E = globalThis.ECONOMIA, V = globalThis.VIVIENDA, TP = globalThis.TRANSPORTE;
const SA = globalThis.SANIDAD, IM = globalThis.IMPUESTOS, PR = globalThis.PRIMARIA, IN = globalThis.INFANTIL;
const DI = globalThis.DISCAPACIDAD, CX = globalThis.CONTEXTO;
/* Lo de discapacidad.js como lo cuenta assets/servicios.js: cada cosa contra su base. */
const adultos = (id) => D.contexto.edades.tramos.reduce((t, x) => t - x.valores[id], D.contexto.edades.total[id]);
const tasaDis = (k, base, por, campo = 'plazas') => (id) => {
  const v = DI.ciudades[id][k][campo] / base(id) * por;
  return num(v, v === 0 ? 0 : 1);
};
const PIE_DIS = 'Registro de centros de atención social de la Comunidad de Madrid: centros públicos y concertados.';
const ultimo = (xs) => xs[xs.length - 1];
/* Miles con punto siempre, también en cuatro cifras, como la web. */
const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/* Entre qué cifras, redondeadas a la decena, están los turismos por 1.000 de las ciudades que se comparan. */
function rangoCoches() {
  const r = Object.keys(CX.coches.por1000).filter((i) => !CX.coches.fuera.includes(i)).map((i) => CX.coches.por1000[i]);
  return [Math.round(Math.min(...r) / 10) * 10, Math.round(Math.max(...r) / 10) * 10];
}
/* El puesto de Parla entre las ciudades con dato, como lo cuenta assets/contexto.js. */
const LETRAS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once'];
function puesto(vals) {
  const ids = Object.keys(vals).filter((i) => vals[i] != null);
  const mayores = ids.filter((i) => vals[i] > vals[D.REFERENCIA]).length;
  const menores = ids.filter((i) => vals[i] < vals[D.REFERENCIA]).length;
  const alta = mayores <= menores, p = (alta ? mayores : menores) + 1, lado = alta ? 'alta' : 'baja';
  return { texto: p === 1 ? 'la más ' + lado : p === 2 ? 'la segunda más ' + lado : 'la ' + p + '.ª más ' + lado,
    letra: LETRAS[ids.length] || String(ids.length) };
}
/* Las cuentas de las piezas nuevas (vivienda, dinero del ayuntamiento, paro,
   renta, PIB, pediatras y discapacidad): las mismas que hacen assets/vivienda.js,
   assets/economia.js y assets/servicios.js, con su redondeo. Miles con punto
   siempre, también en cuatro cifras, como en el navegador. */
const numG = (n, d) => n.toLocaleString('es-ES', { useGrouping: true, minimumFractionDigits: d, maximumFractionDigits: d });
const enteroG = (n) => numG(Math.round(n), 0);
const eurHab = (v) => numG(v, Math.abs(v) >= 10 || v === 0 ? 0 : 2);
const VC = (id) => V.ciudades[id];
const dPob = (id) => { const c = VC(id).crece; return c.pob[c.pob.length - 1] - c.pob[0]; };
const dCasas = (id) => { const c = VC(id).crece; return c.casas[c.casas.length - 1] - c.casas[0]; };
const desdeViv = () => VC(D.REFERENCIA).crece.desde;
const hastaViv = () => desdeViv() + VC(D.REFERENCIA).crece.pob.length - 1;
const trimestreViv = (p) => p.slice(5) + '.º trimestre de ' + p.slice(0, 4);
const pjDe = (id) => V.partidos[VC(id).partido];
const anioLanz = () => V.lanzDesde + pjDe(D.REFERENCIA).total.length - 1;
const demandasPor100k = (id) => { const pj = pjDe(id), u = pj.total.length - 1; return pj.demandas[u] / pj.pob[u] * 1e5; };
/* La fecha del pie de «Vivienda pública», la que lleva la página. */
const fechaAvs = (() => {
  const f = viv.match(/viviendas en propiedad por municipio<\/a>,\s*(a \d{1,2} de [a-zé]+ de \d{4})/);
  return f ? ', ' + f[1] : '';
})();
const serieDinero = (id) => D.contexto.dinero.find((x) => x.id === id);
const cifraSerie = (s) => (id) => s.unidad === '%' ? numG(s.valores[id], s.decimales != null ? s.decimales : 2) : eurHab(s.valores[id]);
/* La fuente de una serie, como la lista del método de la página de economía. */
const fuenteEco = (id) => (E.fuentes[id] ? E.fuentes[id][0] : D.fuentes[id].t).replace(' · ', ', ').replace(/\s*\(XLSX\)/, '') + '.';
/* Lo que Parla pondría al año al ritmo de la otra ciudad, y si queda en lo mismo (menos de un 1 %). */
const anualDin = (s, id) => {
  const pob = D.BASES.total.valores[D.REFERENCIA];
  const dif = (s.valores[id] - s.valores[D.REFERENCIA]) * pob;
  return { dif, igual: Math.abs(dif) < s.valores[D.REFERENCIA] * pob * 0.01 };
};
const enEurosEco = (e) => (e >= 1e6 ? numG(e / 1e6, 1) + ' millones de euros' : enteroG(Math.round(e / 1000) * 1000) + ' euros');
const fraseAnual = (s, id, n) => {
  const a = anualDin(s, id);
  return a.igual ? `Con ${s.alAnio.con} de ${n}, Parla se quedaría prácticamente igual.`
    : `Con ${s.alAnio.con} de ${n}, Parla ${s.alAnio.verbo} ${enEurosEco(Math.abs(a.dif))} ${a.dif > 0 ? 'más' : 'menos'} al año.`;
};
/* «Pie de la ciudad: nota. » → la nota va al pie de la imagen y lo que mide, al título. */
const pieCiudad = (s, id) => (s.pieCiudad && s.pieCiudad[id]) || s.pie;
const tituloSerie = (s) => (id) => pieCiudad(s, id).split(':')[0];
const notaSerie = (s, id) => { const p = pieCiudad(s, id); return p.includes(':') ? p.split(':').slice(1).join(':').trim() + '. ' : ''; };
function serieEco(clave, idSerie, desc) {
  const s = serieDinero(idSerie);
  return {
    titulo: tituloSerie(s), seccion: 'Economía', unidad: s.unidad === '%' ? ' %' : ' €',
    v: cifraSerie(s),
    pie: (id) => notaSerie(s, id) + fuenteEco(s.fuenteId),
    desc: (n, a, b, id) => desc(s, n, a, b, id)
  };
}

/* ── Las piezas de infraestructuras, vivienda, economía y la espera con dos botones ──
   Las mismas cuentas que hacen assets/infraestructura-tp.js, infraestructura.js,
   vivienda.js, economia.js y servicios.js, con su redondeo. El puesto de Parla se
   calcula de los datos; la imagen enseña lo que enseña el cartel: la cifra de cada
   ciudad, lo que va bajo ella y una frase de puesto. */
const TODAS = D.MUNICIPIOS.map((m) => m.id);
const todasV = (f) => Object.fromEntries(TODAS.map((id) => [id, f(id)]).filter(([, v]) => v != null));
const entreLas = (vals, que) => { const p = puesto(vals); return `Parla es ${p.texto} de las ${p.letra} en ${que}.`; };
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (iso) => { const f = iso.split('-'); return Number(f[2]) + ' de ' + MESES_L[Number(f[1]) - 1] + ' de ' + f[0]; };
const AC = globalThis.ACCESOS.ciudades;
const COB = (id) => (TP.cobertura.ciudades[id] || null);
const fuenteTp = (demanda) => (demanda ? '' : 'Dirección General del Catastro, edificios (INSPIRE); ') +
  'Consorcio Regional de Transportes de Madrid, GTFS, horarios del martes ' + fechaLarga(TP.fecha) +
  (demanda ? '; Ministerio de Transportes, estudio básico de movilidad, 16 de octubre de 2024.' : '.');
const RED = (id) => (TP.redundancia.ciudades[id] || null);
const plazasTp = (id) => RED(id).lineas.reduce((t, l) => t + l[2], 0);
/* Las líneas de tren o Metro que llevan las plazas máximas (en Majadahonda, dos: la C-10 y la C-7). */
const principalesTp = (id) => {
  const ls = RED(id).lineas.filter((l) => l[0] !== 'autobús');
  const mx = Math.max(...ls.map((l) => l[2]));
  return ls.filter((l) => l[2] === mx);
};
const artLinea = (n) => (/^C-/.test(n) ? 'la ' : 'el ') + n;
const quedanTp = (id) => plazasTp(id) - principalesTp(id)[0][2];
const pctQuedan = (id) => 100 * quedanTp(id) / plazasTp(id);
const sinLinea = (id) => 'sin ' + principalesTp(id).map((l) => artLinea(l[0])).join(' o ');
const primeraSalida = (id) => AC[id].puertas[0].v / (AC[id].puertas.reduce((t, p) => t + p.v, 0) + AC[id].calles);
const FUENTE_CARRETERA = 'Ministerio de Transportes, Open Data Movilidad, rutas por carretera y estudio básico, 16-10-2024.';
const salenMas = (id) => AC[id].sale.h610 >= AC[id].entra.h610;
const razonSentido = (id) => (salenMas(id) ? AC[id].sale.h610 / AC[id].entra.h610 : AC[id].entra.h610 / AC[id].sale.h610);
const soc100 = (id) => VC(id).titular.soc100;
const sociedades = (id) => (soc100(id).n ? miles(soc100(id).inm) + ' viviendas de ' + (soc100(id).n === 1 ? 'una sociedad' : soc100(id).n + ' sociedades')
  : 'ninguna sociedad con más de 100');
const pctSoc100 = (id) => VC(id).titular.soc100.inm / VC(id).titular.inm * 100;
const alqRango = (id) => VC(id).barrios.alq;
const hog5 = (id) => VC(id).censo.pctHog5en60;
const cuentas = (id) => E.ciudades[id].cuentas;
const menos = (v) => v.replace('-', '−');
/* El puesto de Parla como lo dice economia.js: de la cifra más alta a la más baja. */
const puestoEco = (v) => {
  const k = TODAS.filter((id) => v(id) > v(D.REFERENCIA)).length + 1;
  const N = LETRAS[TODAS.length] || String(TODAS.length);
  if (k === TODAS.length) return `Parla tiene la cifra más baja de las ${N}.`;
  if (k === 1) return `Parla tiene la cifra más alta de las ${N}.`;
  return `Parla es la ${k}.ª de las ${N}, de la cifra más alta a la más baja.`;
};
const enNegativoEco = () => {
  const neg = TODAS.filter((id) => cuentas(id).remanenteAjustado < 0);
  const N = LETRAS[TODAS.length];
  if (neg.length === 1 && neg[0] === D.REFERENCIA) return `Parla es la única de las ${N} en negativo.`;
  if (!neg.length) return `Ninguna de las ${N} está en negativo.`;
  return 'Están en negativo ' + neg.map((id) => D.MUNICIPIOS.find((m) => m.id === id).nombre).join(', ') + '.';
};
const pieCuenta = (t, id) => (id === 'pozuelo' ? t + ' (Pozuelo de Alarcón, media de 2021 y 2024)' : t);
const fuenteConprel = D.fuentes.conprel.t.replace(' · ', ', ').replace(/\s*\(XLSX\)/, '') + '.';
/* Lo que dice la nota de la ficha: contando también los fondos del Estado y de la Unión Europea. */
const estadoUe = (id, n) => {
  const cap = serieDinero('comunidad').extra.capital;
  return `Contando también los fondos del Estado y de la Unión Europea, Parla recibe ${eurHab(cap[D.REFERENCIA])} € por habitante y ${n}, ${eurHab(cap[id])} €.`;
};
const sinArt = (c) => c.corto.replace(/^(el|la) /, '');
const mesCap = SA.mes.charAt(0).toUpperCase() + SA.mes.slice(1);
const listaEspera = (k, tit, sub) => ({
  titulo: tit, seccion: 'La espera', unidad: ' días',
  v: (id) => (SA.ciudades[id] && SA.ciudades[id][k] ? num(SA.ciudades[id][k].dias, 1) : null),
  nota: (id) => sinArt(SA.ciudades[id]),
  pie: 'Servicio Madrileño de Salud, listas de espera por hospital, ' + SA.mes + '.',
  desc: (n, a, b, id) => `${sub} ${a} días de media en el hospital de Parla, ${sinArt(SA.ciudades[D.REFERENCIA])}, y ${b} en el que le toca a ${n}, ${sinArt(SA.ciudades[id])}. ${mesCap}, con datos oficiales.`
});
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
    desc: (n, a, b) => `De cada 100 viviendas de Parla, ${a} tienen una estación a 15 minutos andando; en ${n}, ${b}. Por dónde sale la gente en coche, lo llena que va la A-42 y qué pasa si falla el tren.`
  },
  espera: {
    titulo: 'Días que llevan de media en lista los que esperan una operación, en el hospital que le toca a cada ciudad',
    seccion: 'La espera', unidad: ' días',
    v: (id) => SA.ciudades[id] ? num(SA.ciudades[id].quirurgica.dias, 1) : null,
    nota: (id) => sinArt(SA.ciudades[id]),
    linea: (id) => 'Primera consulta: ' + (SA.ciudades[id].consultas ? num(SA.ciudades[id].consultas.dias, 1) + ' días' : 'sin dato'),
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
  residencia: {
    titulo: 'Plazas en residencias y viviendas con apoyo para personas con discapacidad intelectual',
    seccion: 'Inclusión', unidad: '',
    v: (id) => DI.ciudades[id].residencial.plazas.toLocaleString('es-ES', { useGrouping: true }),
    pie: 'Registro de centros de atención social de la Comunidad de Madrid: centros públicos y concertados.',
    desc: (n, a, b) => {
      const sin = D.MUNICIPIOS.filter((m) => DI.ciudades[m.id].residencial.plazas === 0);
      const unica = sin.length === 1 && sin[0].id === D.REFERENCIA ? ' Es la única de las once sin ninguna.' : '';
      return `Parla ${a === '0' ? 'no tiene ninguna plaza' : 'tiene ' + a + ' plazas'} de residencia para personas con discapacidad intelectual; ${n}, ${b}.${unica} Los centros de día, los ocupacionales y la atención temprana, con datos oficiales.`;
    }
  },
  dia: {
    titulo: 'Plazas en centros de día por cada 100 personas con discapacidad intelectual reconocida',
    seccion: 'Inclusión', unidad: '', pie: PIE_DIS,
    v: tasaDis('dia', (id) => DI.ciudades[id].intelectual, 100),
    desc: (n, a, b) => `En Parla hay ${a} plazas de centro de día por cada 100 personas con discapacidad intelectual reconocida; en ${n}, ${b}. Con datos oficiales.`
  },
  ocupacional: {
    titulo: 'Plazas en centros ocupacionales por cada 100 personas con discapacidad intelectual reconocida',
    seccion: 'Inclusión', unidad: '', pie: PIE_DIS,
    v: tasaDis('ocupacional', (id) => DI.ciudades[id].intelectual, 100),
    desc: (n, a, b) => `En Parla hay ${a} plazas de centro ocupacional por cada 100 personas con discapacidad intelectual reconocida; en ${n}, ${b}. Con datos oficiales.`
  },
  temprana: {
    titulo: 'Plazas de atención temprana por cada 1.000 niños de 0 a 5 años',
    seccion: 'Inclusión', unidad: '', pie: PIE_DIS,
    v: tasaDis('temprana', (id) => DI.ciudades[id].ninos0a5, 1000),
    desc: (n, a, b) => `En Parla hay ${a} plazas de atención temprana por cada 1.000 niños de 0 a 5 años; en ${n}, ${b}. Con datos oficiales.`
  },
  mental: {
    titulo: 'Plazas de la red de salud mental por cada 10.000 vecinos de 18 a 64 años',
    seccion: 'Sanidad', unidad: '', pie: PIE_DIS,
    v: tasaDis('mental', adultos, 10000),
    desc: (n, a, b) => `En Parla hay ${a} plazas de la red de atención social a la enfermedad mental grave por cada 10.000 adultos; en ${n}, ${b}. Con datos oficiales.`
  },
  especial: {
    titulo: 'Alumnos de educación especial por cada 1.000 niños y jóvenes de 3 a 17 años',
    seccion: 'Educación', unidad: '',
    pie: 'Estadística de alumnos de la Comunidad de Madrid: centros públicos y concertados, curso ' + DI.cursoEspecial + '.',
    v: tasaDis('especial', (id) => D.BASES.primaria.valores[id] + D.BASES.secundaria.valores[id], 1000, 'alumnos'),
    desc: (n, a, b) => `En Parla estudian en educación especial ${a} alumnos por cada 1.000 niños y jóvenes de 3 a 17 años; en ${n}, ${b}. Las aulas TEA y la FP de modalidad especial, con datos oficiales.`
  },
  tea: {
    titulo: 'Aulas TEA por cada 10.000 niños y jóvenes de 3 a 17 años',
    seccion: 'Educación', unidad: '',
    pie: 'Centros de atención preferente para alumnado con TEA de la Comunidad de Madrid: públicos y concertados.',
    v: tasaDis('tea', (id) => D.BASES.primaria.valores[id] + D.BASES.secundaria.valores[id], 10000, 'aulas'),
    desc: (n, a, b) => `En Parla hay ${a} aulas TEA por cada 10.000 niños y jóvenes de 3 a 17 años; en ${n}, ${b}. Con datos oficiales.`
  },
  ppme: {
    titulo: 'Programas de FP de modalidad especial por cada 10.000 chicos y chicas de 12 a 17 años',
    seccion: 'Educación', unidad: '',
    pie: 'Oferta de programas profesionales de modalidad especial de la Comunidad de Madrid, curso ' + DI.cursoPpme + '.',
    v: tasaDis('ppme', (id) => D.BASES.secundaria.valores[id], 10000, 'programas'),
    desc: (n, a, b) => `En Parla hay ${a} programas de FP de modalidad especial por cada 10.000 chicos y chicas de 12 a 17 años; en ${n}, ${b}. Con datos oficiales.`
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
    linea: (id) => 'Con la misma casa en las dos: ' + num(IM.ciudades[id].comunIbi + IM.ciudades[id].coche, 0) + ' €',
    pie: 'Tipos del Ministerio de Hacienda y valor catastral del Catastro, ' + IM.anio + '.',
    desc: (n, a, b) => `Con su casa media y un coche, un vecino de Parla paga ${a} € al año de IBI e impuesto de vehículos; uno de ${n}, ${b} €. Y con la misma casa en las dos, lo que cobra cada ayuntamiento.`
  },
  estudios: {
    titulo: 'De cada 100 vecinos de 25 a 64 años, los que tienen como máximo la ESO',
    seccion: 'Educación', unidad: ' %',
    v: (id) => num(CX.estudios.valores[id], 1),
    pie: CX.estudios.fuente[0] + '.',
    desc: (n, a, b) => `De cada 100 vecinos de Parla de 25 a 64 años, ${a} tienen como máximo la ESO; en ${n}, ${b}. Datos de ${CX.estudios.anio}, del INE.`
  },
  vida: {
    titulo: 'Esperanza de vida al nacer, ' + CX.esperanza.anio,
    seccion: 'Sanidad', unidad: ' años',
    v: (id) => CX.esperanza.total[id] != null ? num(CX.esperanza.total[id], 1) : null,
    pie: 'Cifras de ' + CX.esperanza.anio + '. ' + CX.esperanza.fuente[0] + '.',
    desc: (n, a, b) => `La esperanza de vida al nacer en ${CX.esperanza.anio} es de ${a} años en Parla y de ${b} en ${n}. Con datos oficiales.`,
    /* Sin dato de la otra ciudad (Pinto, Pozuelo de Alarcón, Majadahonda). */
    sola: (n) => {
      const p = puesto(CX.esperanza.total);
      return `Parla es ${p.texto} de las ${p.letra} con dato. La fuente no publica el de ${n}: solo lo da para municipios de más de 100.000 habitantes.`;
    },
    descSola: (n, a) => {
      const p = puesto(CX.esperanza.total);
      return `La esperanza de vida al nacer en ${CX.esperanza.anio} es de ${a} años en Parla, ${p.texto} de las ${p.letra} con dato. La fuente no publica el de ${n}.`;
    }
  },
  pensiones: {
    titulo: 'Pensión contributiva media por pensionista, euros al mes, a ' + CX.pension.fecha,
    seccion: 'Economía', unidad: ' €',
    v: (id) => miles(Math.round(CX.pension.total[id])),
    pie: 'Datos a ' + CX.pension.fecha + '. ' + CX.pension.fuente[0] + '.',
    desc: (n, a, b) => `A ${CX.pension.fecha}, la pensión contributiva media por pensionista es de ${a} euros al mes en Parla y de ${b} en ${n}. Con datos oficiales.`
  },
  coches: {
    titulo: 'Antigüedad media en años de los turismos, solo los de menos de 25 años',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => num(CX.coches.anios[id], 2),
    fuera: (id) => CX.coches.fuera.includes(id),
    pie: 'Turismos matriculados a ' + CX.coches.fecha + '. ' + CX.coches.fuente[0] + '.',
    desc: (n, a, b) => `A ${CX.coches.fecha}, los turismos de Parla tienen ${a} años de media y los de ${n}, ${b}. Solo cuenta turismos de menos de 25 años.`,
    /* Alcobendas y Majadahonda no se comparan: Parla sola, con su puesto entre las comparables. */
    sola: (n, id) => {
      const comp = {};
      for (const i of Object.keys(CX.coches.anios)) if (!CX.coches.fuera.includes(i)) comp[i] = CX.coches.anios[i];
      const p = puesto(comp), r = rangoCoches();
      return `Parla es ${p.texto} de las ${p.letra} comparables. ${n} no se compara: tiene ${miles(CX.coches.por1000[id])} turismos por cada 1.000 habitantes, frente a entre ${miles(r[0])} y ${miles(r[1])} en las demás.`;
    },
    descSola: (n, a, id) => {
      const comp = {};
      for (const i of Object.keys(CX.coches.anios)) if (!CX.coches.fuera.includes(i)) comp[i] = CX.coches.anios[i];
      const p = puesto(comp), r = rangoCoches();
      return `A ${CX.coches.fecha}, los turismos de Parla tienen ${a} años de media, ${p.texto} de las ${p.letra} comparables. ${n} no se compara: tiene ${miles(CX.coches.por1000[id])} turismos por cada 1.000 habitantes, frente a entre ${miles(r[0])} y ${miles(r[1])} en las demás.`;
    }
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
  },
  /* ── Vivienda: una por sección con su cifra titular ── */
  casas: {
    titulo: 'Viviendas nuevas por cada 100 vecinos nuevos, de 2015 a 2025',
    seccion: 'Vivienda', unidad: '',
    v: (id) => (dPob(id) > 0 ? numG(dCasas(id) / dPob(id) * 100, 1) : null),
    pie: () => `Catastro, unidades urbanas de uso residencial; INE, padrón a 1 de enero, ${desdeViv()} a ${hastaViv()}.`,
    desc: (n, a, b) => `Por cada 100 vecinos nuevos entre ${desdeViv()} y ${hastaViv()}, Parla ha sumado ${a} viviendas; ${n}, ${b}. Con datos oficiales.`,
    /* Sin vecinos nuevos no hay cifra por cada 100: Parla sola, con el motivo. */
    sola: (n, id) => `${n} perdió ${enteroG(-dPob(id))} vecinos y ganó ${enteroG(dCasas(id))} viviendas: no hay cifra por cada 100 vecinos nuevos.`,
    descSola: (n, a, id) => `Por cada 100 vecinos nuevos entre ${desdeViv()} y ${hastaViv()}, Parla ha sumado ${a} viviendas. ${n} perdió ${enteroG(-dPob(id))} vecinos y ganó ${enteroG(dCasas(id))} viviendas.`
  },
  comprar: {
    titulo: 'Valor de la vivienda media, en euros',
    seccion: 'Vivienda', unidad: ' €',
    v: (id) => enteroG(VC(id).tasado.ult.v * VC(id).censo.superficieConstruida),
    pie: () => 'Ministerio de Vivienda, valor tasado de la vivienda libre, ' + trimestreViv(VC(D.REFERENCIA).tasado.ult.p) + '.',
    desc: (n, a, b) => `La vivienda media de Parla vale ${a} euros; la de ${n}, ${b}. Lo que cuesta comprar, con datos oficiales.`
  },
  alquilar: {
    titulo: 'Alquiler mediano de un piso, en euros al mes',
    seccion: 'Vivienda', unidad: ' €',
    v: (id) => { const a = VC(id).alquiler; return enteroG(a.mes[a.mes.length - 1]); },
    pie: () => 'Ministerio de Vivienda, Sistema Estatal de Referencia del Precio del Alquiler, ' +
      (VC(D.REFERENCIA).alquiler.desde + VC(D.REFERENCIA).alquiler.m2.length - 1) + '.',
    desc: (n, a, b) => `El alquiler mediano de un piso en Parla es de ${a} euros al mes; en ${n}, ${b}. Lo que cuesta alquilar, con datos oficiales.`
  },
  publica: {
    titulo: 'Viviendas de la Agencia de Vivienda Social por cada 1.000 habitantes',
    seccion: 'Vivienda', unidad: '',
    v: (id) => numG(VC(id).avs.por1000, 2),
    pie: () => 'Agencia de Vivienda Social, viviendas en propiedad por municipio' + fechaAvs + '.',
    desc: (n, a, b) => `Parla tiene ${a} viviendas de la Agencia de Vivienda Social por cada 1.000 habitantes; ${n}, ${b}. Con datos oficiales.`
  },
  desahucios: {
    titulo: () => 'Demandas por alquiler en los juzgados por cada 100.000 habitantes, ' + anioLanz(),
    seccion: 'Vivienda', unidad: '',
    v: (id) => numG(demandasPor100k(id), 1),
    pie: () => 'CGPJ, base de datos de la estadística judicial, ' + anioLanz() + '; INE, padrón.',
    desc: (n, a, b) => `En ${anioLanz()} llegaron a los juzgados ${a} demandas por alquiler por cada 100.000 habitantes en el partido judicial de Parla; en el de ${n}, ${b}. Con datos oficiales.`
  },
  /* ── Economía ── */
  paro: serieEco('paro', 'paro', (s, n, a, b) => `${s.pie}: el ${a} % en Parla y el ${b} % en ${n}. Con datos oficiales.`),
  renta: serieEco('renta', 'renta', (s, n, a, b) => `${s.pie}: ${a} euros en Parla y ${b} en ${n}. Con datos oficiales.`),
  produce: serieEco('produce', 'pib', (s, n, a, b) => `${s.pie}: ${a} euros en Parla y ${b} en ${n}. Con datos oficiales.`),
  inversion: Object.assign(serieEco('inversion', 'inversion', (s, n, a, b, id) =>
    `Parla invierte ${a} euros por vecino al año; ${n}, ${b}. ${fraseAnual(s, id, n)}`), {
    omitir: (id) => anualDin(serieDinero('inversion'), id).igual
  }),
  gasto: Object.assign(serieEco('gasto', 'gasto', (s, n, a, b, id) =>
    `El ayuntamiento de Parla gasta ${a} euros por vecino al año; el de ${n}, ${b}. ${fraseAnual(s, id, n)}`), {
    omitir: (id) => anualDin(serieDinero('gasto'), id).igual
  }),
  deuda: {
    titulo: () => serieDinero('deuda').pie,
    seccion: 'Economía', unidad: ' €',
    v: cifraSerie(serieDinero('deuda')),
    pie: () => fuenteEco('deudaViva'),
    desc: (n, a, b) => `${serieDinero('deuda').pie}: ${a} euros en Parla y ${b} en ${n}. Con datos oficiales.`
  },
  pmp: {
    titulo: 'Periodo medio de pago a proveedores del ayuntamiento, en días',
    seccion: 'Economía', unidad: ' días',
    v: (id) => enteroG(E.ciudades[id].cuentas.pmp),
    pie: () => fuenteEco('pmp'),
    desc: (n, a, b) => `El ayuntamiento de Parla tarda de media ${a} días en pagar a sus proveedores; el de ${n}, ${b}. La ley pide 30.`
  },
  /* ── Sanidad e inclusión ── */
  pediatras: {
    titulo: 'Tarjetas sanitarias de 0 a 13 años por cada plaza de pediatra en los centros de salud',
    seccion: 'Sanidad', unidad: '',
    v: (id) => (PR.ciudades[id] ? enteroG(PR.ciudades[id].pediatria) : null),
    pie: () => PR.fuentes.plantilla[0].replace(' · ', ', ') + '; ' + PR.fuentes.tarjetas[0].replace(' · ', ', ') + '.',
    desc: (n, a, b) => `En los centros de salud de Parla hay una plaza de pediatra por cada ${a} tarjetas sanitarias de 0 a 13 años; en los de ${n}, una por cada ${b}. Con datos oficiales.`
  },
  /* ── Infraestructuras ── */
  tren: {
    titulo: 'De cada 100 viviendas, las que tienen una estación de Cercanías, Metro o Metro Ligero a 15 minutos andando',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => (COB(id) ? num(COB(id).pct['15'], 1) : null),
    linea: (id) => miles(COB(id).cerca['15']) + ' de ' + miles(COB(id).viviendas) + ' viviendas',
    pos: () => entreLas(todasV((id) => (COB(id) ? COB(id).pct['15'] : null)), 'viviendas con una estación a 15 minutos andando'),
    pie: () => fuenteTp(),
    desc: (n, a, b) => `De cada 100 viviendas de Parla, ${a} tienen una estación de Cercanías, Metro o Metro Ligero a 15 minutos andando; en ${n}, ${b}. Con datos oficiales.`
  },
  atocha: {
    titulo: 'Minutos hasta Atocha desde la vivienda mediana, saliendo un martes de ' + TP.ventana.map((h) => h.replace(/^0/, '')).join(' a '),
    seccion: 'Infraestructuras', unidad: ' min',
    v: (id) => (TP.casa[id] && TP.casa[id].todo.atocha ? String(TP.casa[id].todo.atocha[0]) : null),
    pos: () => entreLas(todasV((id) => (TP.casa[id] && TP.casa[id].todo.atocha ? TP.casa[id].todo.atocha[0] : null)), 'minutos hasta Atocha'),
    pie: () => fuenteTp(),
    desc: (n, a, b) => `Desde la vivienda mediana, hasta Atocha se tardan ${a} minutos desde Parla y ${b} desde ${n}, andando hasta la parada y en tren, Metro o autobús. Con datos oficiales.`
  },
  plazas: {
    titulo: 'Plazas de tren, Metro y autobús hacia Madrid de 7 a 9 de la mañana, por hora y por cada 1.000 vecinos',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => (RED(id) && AC[id] ? num(1000 * plazasTp(id) / AC[id].pob, 0) : null),
    linea: (id) => miles(plazasTp(id)) + ' plazas en total cada hora',
    pos: () => entreLas(todasV((id) => (RED(id) && AC[id] ? 1000 * plazasTp(id) / AC[id].pob : null)), 'plazas por cada 1.000 vecinos'),
    pie: () => fuenteTp(true),
    desc: (n, a, b) => `Cada hora, de 7 a 9, salen hacia Madrid ${a} plazas de tren, Metro y autobús por cada 1.000 vecinos de Parla; de ${n}, ${b}. Con datos oficiales.`
  },
  falla: {
    titulo: 'Si falla la línea principal, de las plazas hacia Madrid que salen cada hora de 7 a 9, las que quedan, por ciento',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => (RED(id) ? num(pctQuedan(id), 0) : null),
    nota: (id) => sinLinea(id),
    linea: (id) => miles(quedanTp(id)) + ' de ' + miles(plazasTp(id)) + ' cada hora',
    pos: (id) => entreLas(todasV((i) => (RED(i) ? pctQuedan(i) : null)), 'plazas que quedan sin su línea principal') +
      (principalesTp(id).length > 1 ? ' ' + principalesTp(id).map((l) => artLinea(l[0])).join(' y ').replace(/^l/, 'L') +
        ' llevan las mismas plazas: queda lo mismo con cualquiera de las dos.' : ''),
    pie: () => fuenteTp(true),
    desc: (n, a, b, id) => `Un día en que falla la línea principal, quedan el ${a} % de las plazas hacia Madrid en Parla (${sinLinea(D.REFERENCIA)}) y el ${b} % en ${n} (${sinLinea(id)}). Con datos oficiales.`
  },
  colas: {
    titulo: 'De cada 100 personas que salen por carretera de 6 a 10 de la mañana, las que salen por la salida más usada',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => (AC[id] ? num(primeraSalida(id) * 100, 1) : null),
    nota: (id) => AC[id].puertas[0].via + ' ' + AC[id].puertas[0].hacia,
    pos: () => entreLas(todasV((id) => (AC[id] ? Math.round(primeraSalida(id) * 1000) : null)), 'la parte que se lleva la salida más usada'),
    pie: () => FUENTE_CARRETERA,
    desc: (n, a, b) => `De cada 100 personas que salen de Parla por carretera de 6 a 10 de la mañana, ${a} salen por la salida más usada; en ${n}, ${b}. Con datos oficiales.`
  },
  sentidos: {
    titulo: 'Personas que salen y entran por carretera de 6 a 10 de la mañana',
    seccion: 'Infraestructuras', unidad: '',
    v: (id) => (AC[id] ? num(razonSentido(id), 1) : null),
    linea: (id) => [salenMas(id) ? 'salen por cada una que entra' : 'entran por cada una que sale',
      'Salen ' + miles(Math.round(AC[id].sale.h610)) + ' · entran ' + miles(Math.round(AC[id].entra.h610))],
    pie: () => FUENTE_CARRETERA,
    desc: (n, a, b, id) => `De 6 a 10 de la mañana, de Parla ${salenMas(D.REFERENCIA) ? 'salen' : 'entran'} ${a} personas por cada una que ${salenMas(D.REFERENCIA) ? 'entra' : 'sale'}; en ${n}, ${salenMas(id) ? 'salen' : 'entran'} ${b} por cada una que ${salenMas(id) ? 'entra' : 'sale'}. Con datos oficiales.`
  },
  /* ── Vivienda ── */
  barrios: {
    titulo: 'Entre la zona más barata y la más cara, cuántas veces se multiplica el alquiler del metro cuadrado',
    seccion: 'Vivienda', unidad: '',
    v: (id) => '×' + numG(alqRango(id)[1] / alqRango(id)[0], 2),
    linea: (id) => 'de ' + numG(alqRango(id)[0], 2) + ' € a ' + numG(alqRango(id)[1], 2) + ' €',
    pie: () => 'Ministerio de Vivienda, SERPAVI, ' + (VC(D.REFERENCIA).alquiler.desde + VC(D.REFERENCIA).alquiler.m2.length - 1) + '. Zonas de unos pocos miles de vecinos, con 30 o más alquileres declarados.',
    desc: (n, a, b) => `El alquiler del metro cuadrado se multiplica por ${a.slice(1)} entre la zona más barata y la más cara de Parla; en ${n}, por ${b.slice(1)}. Con datos oficiales.`
  },
  sociedades: {
    titulo: 'De cada 100 viviendas, las de sociedades con más de 100 viviendas en la ciudad',
    seccion: 'Vivienda', unidad: '',
    v: (id) => numG(pctSoc100(id), 2),
    linea: (id) => sociedades(id),
    pie: () => 'Dirección General del Catastro, padrón del IBI de 2026, uso residencial por tipo de titular.',
    desc: (n, a, b) => `De cada 100 viviendas de Parla, ${a} son de sociedades con más de 100 viviendas en la ciudad; en ${n}, ${b}. Con datos oficiales.`
  },
  hacinamiento: {
    titulo: 'De cada 100 hogares, los de 5 o más personas que viven en 60 m² o menos, Censo de 2021',
    seccion: 'Vivienda', unidad: '',
    v: (id) => numG(hog5(id), 2),
    linea: (id) => miles(VC(id).censo.hog5en60) + ' de ' + miles(VC(id).censo.hogares) + ' hogares',
    pos: () => entreLas(todasV((id) => Math.round(hog5(id) * 100)), 'hogares de 5 o más personas en viviendas de 60 m² o menos'),
    pie: () => 'INE, Censo de Población y Viviendas 2021, hogares por tamaño y superficie.',
    desc: (n, a, b) => `De cada 100 hogares de Parla, ${a} son de 5 o más personas y viven en 60 m² o menos; en ${n}, ${b}. Censo de 2021.`
  },
  /* ── Economía: las cuentas del ayuntamiento ── */
  remanente: {
    titulo: 'Remanente de tesorería a 31 de diciembre de 2024, euros por habitante',
    seccion: 'Economía', unidad: ' €',
    v: (id) => menos(eurHab(cuentas(id).remanenteAjustado)),
    pos: () => puestoEco((id) => cuentas(id).remanenteAjustado) + ' ' + enNegativoEco(),
    pie: () => 'Remanente de tesorería por habitante, descontadas las facturas pendientes de aplicar, 31 de diciembre de 2024. ' + fuenteConprel,
    desc: (n, a, b) => `El remanente de tesorería a 31 de diciembre de 2024 es de ${a} euros por habitante en el ayuntamiento de Parla y de ${b} en el de ${n}. ${enNegativoEco()}`
  },
  'deuda-anual': {
    titulo: 'Intereses y devolución de préstamos, euros por habitante al año',
    seccion: 'Economía', unidad: ' €',
    v: (id) => eurHab(cuentas(id).deuda),
    linea: (id) => numG(cuentas(id).pctDeuda, 1) + ' de cada 100 euros que gasta',
    pos: () => puestoEco((id) => cuentas(id).deuda),
    pie: (id) => pieCuenta('Intereses y devolución de préstamos por habitante, media de 2021 a 2024', id) + '. ' + fuenteConprel,
    desc: (n, a, b) => `El ayuntamiento de Parla destina ${a} euros por habitante al año a intereses y devolución de préstamos; el de ${n}, ${b}. Media de 2021 a 2024.`
  },
  'ingresos-propios': {
    titulo: 'Impuestos, tasas y otros ingresos propios, euros por habitante al año',
    seccion: 'Economía', unidad: ' €',
    v: (id) => eurHab(cuentas(id).propios),
    pos: () => puestoEco((id) => cuentas(id).propios),
    pie: (id) => pieCuenta('Impuestos, tasas y otros ingresos propios por habitante, media de 2021 a 2024', id) + '. ' + fuenteConprel,
    desc: (n, a, b) => `El ayuntamiento de Parla recauda ${a} euros por habitante al año con sus ingresos propios; el de ${n}, ${b}. Media de 2021 a 2024.`
  },
  comunidad: {
    titulo: 'Transferencias de capital de la Comunidad de Madrid, euros por habitante al año',
    seccion: 'Economía', unidad: ' €',
    v: cifraSerie(serieDinero('comunidad')),
    pos: (id, n) => estadoUe(id, n),
    pie: (id) => pieCiudad(serieDinero('comunidad'), id) + '. ' + fuenteConprel,
    desc: (n, a, b, id) => `La Comunidad de Madrid transfiere ${a} euros por habitante al año para invertir al ayuntamiento de Parla y ${b} al de ${n}. ${estadoUe(id, n)}`
  },
  personas: {
    titulo: 'Personas con discapacidad reconocida por cada 1.000 vecinos',
    seccion: 'Inclusión', unidad: '',
    v: (id) => numG(DI.ciudades[id].total / D.BASES.total.valores[id] * 1000, 1),
    pie: () => DI.fuentes.reconocidas[0].replace(' · ', ', ') + '; ' + D.fuentes[D.BASES.total.fuenteId].t.replace(' · ', ', ') + '.',
    desc: (n, a, b) => `Por cada 1.000 vecinos, ${a} personas de Parla tienen una discapacidad reconocida; en ${n}, ${b}. Con datos oficiales.`
  }
};
CIFRAS.consultas = listaEspera('consultas',
  'Días que llevan de media en lista los que esperan la primera consulta con el especialista, en el hospital que le toca a cada ciudad',
  'Quien espera la primera consulta con el especialista lleva en lista');
CIFRAS.pruebas = listaEspera('pruebas',
  'Días que llevan de media en lista los que esperan una prueba diagnóstica (escáner, resonancia, ecografía, colonoscopia…), en el hospital que le toca a cada ciudad',
  'Quien espera una prueba diagnóstica lleva en lista');
/* La sección de trabajo es la misma cifra que la imagen de la página de economía. */
CIFRAS.trabajo = CIFRAS.economia;

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
const paginaInclusion = (id, nombre, previa) => paginaCiudad(id, 'La inclusión en Parla y en ' + nombre,
  inc, 'inclusion.html', 'inclusion/', undefined, previa);
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
  if (c.omitir && c.omitir(m.id)) return null;
  const a = c.v(D.REFERENCIA), b = c.fuera && c.fuera(m.id) ? null : c.v(m.id);
  if (a == null || (b == null && !c.sola)) return null;
  const imagen = `${m.id}-${clave}.png`;
  /* El título y el pie pueden depender de la ciudad (Pozuelo no tiene todos los años). */
  const titulo = typeof c.titulo === 'function' ? c.titulo(m.id) : c.titulo;
  const pie = typeof c.pie === 'function' ? c.pie(m.id) : c.pie;
  /* Lo que va bajo el nombre, bajo la cifra y la frase de puesto, si la pieza lo lleva. */
  const R = D.REFERENCIA;
  const par = (f) => (f ? [f(R, 'Parla'), f(m.id, m.nombre)] : null);
  const x = c.nota || c.linea || c.pos ? { nota: par(c.nota), linea: par(c.linea), pos: c.pos ? c.pos(m.id, m.nombre) : null } : null;
  if (process.env.PIEZAS_JSON) (PIEZAS[clave] = PIEZAS[clave] || {})[m.id] = { a, b, x };
  await pintar(imagenPareja(c.seccion, titulo, m.nombre, a, b, c.unidad, pie, b == null ? c.sola(m.nombre, m.id) : null, x), join(DIST, 'assets/compartir', imagen));
  return { imagen, desc: b == null ? c.descSola(m.nombre, a, m.id) : c.desc(m.nombre, a, b, m.id) };
}

await mkdir(join(DIST, 'assets/compartir'), { recursive: true });
const FICHAS = [];
const PIEZAS = {};
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
  /* La sanidad, la educación y la inclusión, con la vista previa de su sección principal. */
  for (const [ruta, hacer, clave] of [['sanidad', paginaSanidad, 'hospital'], ['educacion', paginaEducacion, 'fp'],
    ['inclusion', paginaInclusion, 'residencia']]) {
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
    ['residencia', `../inclusion/?ir=residencia`, 'Dónde vivir con discapacidad intelectual en Parla y en ' + m.nombre],
    ['dia', `../inclusion/?ir=dia`, 'Los centros de día para la discapacidad intelectual en Parla y en ' + m.nombre],
    ['ocupacional', `../inclusion/?ir=ocupacional`, 'Los centros ocupacionales en Parla y en ' + m.nombre],
    ['temprana', `../inclusion/?ir=temprana`, 'La atención temprana en Parla y en ' + m.nombre],
    ['mental', `../sanidad/?ir=mental`, 'La red de salud mental en Parla y en ' + m.nombre],
    ['especial', `../educacion/?ir=especial`, 'La educación especial en Parla y en ' + m.nombre],
    ['tea', `../educacion/?ir=tea`, 'Las aulas TEA en Parla y en ' + m.nombre],
    ['ppme', `../educacion/?ir=ppme`, 'La FP de modalidad especial en Parla y en ' + m.nombre],
    ['estudios', `../educacion/?ir=estudios`, 'El nivel de estudios en Parla y en ' + m.nombre],
    ['vida', `../sanidad/?ir=vida`, 'La esperanza de vida en Parla y en ' + m.nombre],
    ['pensiones', `../economia/?ir=pensiones`, 'La pensión media en Parla y en ' + m.nombre],
    ['coches', `../infraestructura/?ir=coches`, 'La edad de los coches en Parla y en ' + m.nombre],
    ['impuestos', `../economia/?ir=paga`, 'Lo que paga un vecino de Parla y uno de ' + m.nombre],
    ['casas', `../vivienda/?ir=casas`, 'Vecinos nuevos y casas nuevas en Parla y en ' + m.nombre],
    ['comprar', `../vivienda/?ir=comprar`, 'Lo que cuesta comprar en Parla y en ' + m.nombre],
    ['alquilar', `../vivienda/?ir=alquilar`, 'Lo que cuesta alquilar en Parla y en ' + m.nombre],
    ['publica', `../vivienda/?ir=publica`, 'La vivienda pública en Parla y en ' + m.nombre],
    ['desahucios', `../vivienda/?ir=desahucios`, 'Las demandas de alquiler en Parla y en ' + m.nombre],
    ['trabajo', `../economia/?ir=trabajo`, 'Dónde se trabaja en Parla y en ' + m.nombre],
    ['paro', `../economia/?ir=dinero-paro`, 'El paro en Parla y en ' + m.nombre],
    ['renta', `../economia/?ir=dinero-renta`, 'Lo que gana quien vive en Parla y en ' + m.nombre],
    ['produce', `../economia/?ir=dinero-pib`, 'Lo que se produce en Parla y en ' + m.nombre],
    ['inversion', `../economia/?ir=dinero-inversion`, 'Lo que construye el ayuntamiento en Parla y en ' + m.nombre],
    ['gasto', `../economia/?ir=dinero-gasto`, 'Lo que gasta el ayuntamiento en Parla y en ' + m.nombre],
    ['deuda', `../economia/?ir=dinero-deuda`, 'La deuda del ayuntamiento de Parla y la del de ' + m.nombre],
    ['pmp', `../economia/?ir=pmp`, 'Lo que tarda en pagar el ayuntamiento de Parla y el de ' + m.nombre],
    ['pediatras', `../sanidad/?ir=cabecera-pediatria`, 'Los pediatras en Parla y en ' + m.nombre],
    ['personas', `../inclusion/?ir=personas`, 'Cuánta gente tiene una discapacidad reconocida en Parla y en ' + m.nombre],
    ['tren', `../infraestructura/?ir=tren-a-mano`, 'El tren a mano en Parla y en ' + m.nombre],
    ['atocha', `../infraestructura/?ir=casa`, 'Cuánto se tarda hasta el centro desde Parla y desde ' + m.nombre],
    ['plazas', `../infraestructura/?ir=plazas`, 'Las plazas hacia Madrid desde Parla y desde ' + m.nombre],
    ['falla', `../infraestructura/?ir=falla`, 'Si falla el tren en Parla y en ' + m.nombre],
    ['colas', `../infraestructura/?ir=colas`, 'La salida más usada en Parla y en ' + m.nombre],
    ['sentidos', `../infraestructura/?ir=sentidos`, 'Quién sale y quién entra por carretera en Parla y en ' + m.nombre],
    ['barrios', `../vivienda/?ir=barrios-alquiler`, 'De un barrio a otro en Parla y en ' + m.nombre],
    ['sociedades', `../vivienda/?ir=duenos`, 'De quién son las casas en Parla y en ' + m.nombre],
    ['hacinamiento', `../vivienda/?ir=hacinamiento`, 'Las familias grandes en pisos pequeños en Parla y en ' + m.nombre],
    ['remanente', `../economia/?ir=remanente`, 'Lo que le queda en caja al ayuntamiento de Parla y al de ' + m.nombre],
    ['deuda-anual', `../economia/?ir=dinero-deuda-anual`, 'Lo que se va en la deuda cada año en Parla y en ' + m.nombre],
    ['ingresos-propios', `../economia/?ir=ingresos-propios`, 'Lo que recauda el ayuntamiento de Parla y el de ' + m.nombre],
    ['comunidad', `../economia/?ir=dinero-comunidad`, 'Lo que pone la Comunidad para invertir en Parla y en ' + m.nombre],
    ['consultas', `../sanidad/?ir=espera-consultas`, 'La primera consulta con el especialista en Parla y en ' + m.nombre],
    ['pruebas', `../sanidad/?ir=espera-pruebas`, 'La espera para una prueba en Parla y en ' + m.nombre]]) {
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

  /* Una vista previa por ficha del recuento (las que pinta app.js para esta
     ciudad: lo que le falta, lo que queda fuera y donde Parla tiene más; las
     filas de «Donde están igual» no tienen ficha). Las cifras, el titular y el
     redondeo salen de calculo.js, que es lo que pinta la portada. La ficha del
     hospital, cuando le faltan unidades, usa la imagen `<id>-cartera.png`. */
  for (const { c, modo } of CALCULO.fichas(D, m.id)) {
    const i = c.ind, clave = 'ind-' + i.id;
    const t = CALCULO.tasasFicha(c);
    const linea = CALCULO.titularFicha(c, modo, { nombre: m.nombre, deFuera: !!(SA.ciudades[m.id] || {}).fuera })
      .replace(/<[^>]*>/g, '');
    const fuentes = [i.fuenteId].concat(i.medida === 'cartera' ? [] : [D.BASES[i.base || 'total'].fuenteId])
      .filter((x, n, xs) => xs.indexOf(x) === n).map((x) => D.fuentes[x].t.replace(' · ', ', '));
    const pie = 'Fuente: ' + fuentes[0] + '.' + (fuentes[1] ? ' Población de referencia: ' + fuentes[1] + '.' : '');
    const d = { clave, grupo: i.grupo, titulo: i.titulo, nombre: m.nombre, ley: t.ley, parla: t.parla, otra: t.otra,
      linea, modo, pie, ciudad: m.id };
    if (i.medida === 'cartera' && modo === 'falta') {
      if (!k || k.faltan.length !== c.lista.length) throw new Error(m.id + ': la ficha del hospital y su imagen dicen cifras distintas');
      d.imagen = `${m.id}-cartera.png`;
    } else {
      d.imagen = `${m.id}-${clave}.png`;
      await pintar(imagenFicha(d), join(DIST, 'assets/compartir', d.imagen));
    }
    d.desc = `${t.ley}: Parla, ${t.parla}; ${m.nombre}, ${t.otra}. ${linea}. Con datos oficiales.`;
    FICHAS.push(d);
    await mkdir(join(DIST, m.id, clave), { recursive: true });
    /* A la portada con la ficha abierta: app.js la abre con ?ir=ind-<id> e indice.js baja hasta su fila. */
    await writeFile(join(DIST, m.id, clave, 'index.html'),
      paginaSeccion(m.id, clave + '/', `../../?ir=${clave}#${m.id}`, i.titulo + ' en Parla y en ' + m.nombre, d));
  }
  console.log(m.id.padEnd(12), total);
}
/* Para la prueba de las cifras: lo que se pintó en cada imagen. */
if (process.env.FICHAS_JSON) await writeFile(process.env.FICHAS_JSON, JSON.stringify(FICHAS));
/* Para la prueba de las piezas con dos botones: cifras, líneas y puesto de cada imagen. */
if (process.env.PIEZAS_JSON) await writeFile(process.env.PIEZAS_JSON, JSON.stringify(PIEZAS));

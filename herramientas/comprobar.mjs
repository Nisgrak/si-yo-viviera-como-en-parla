/* La prueba de la web (`npm run comprobar`, y antes de cada build de Netlify).
   Sirve la carpeta en un puerto local y abre cada página con cada ciudad en
   jsdom, que ejecuta el JavaScript igual que un navegador pero sin pintar.
   Falla si hay un error de JavaScript o si algo que tiene que salir sale
   vacío: la frase de arriba, el recuento, las fichas, los mapas.

   No mira cómo se ve (para eso está `npm run revisar`, con un navegador de verdad):
   mira que cada página arranca y escribe sus cifras para las diez ciudades, y
   las comprobaciones de calidad de herramientas/comprobar/ (README, «Las
   comprobaciones»):
     a  toda pieza con cifra tiene sus dos botones      piezas.mjs
     b  cartel, vista previa y pantalla dicen lo mismo  cartel.mjs, previa.mjs
     c  forma de los carteles y de las vistas previas   cartel.mjs
     d  sin columnas vacías ni «undefined»/«NaN»        cartel.mjs, previa.mjs
     e  las cuentas del recuento cuadran                cuentas.mjs
     f  texto público: sin antítesis ni nombres de fichero   texto.mjs
     g  enlaces e ids que existen, fuentes con https    enlaces.mjs
     h  rutas y vistas previas (aquí en seco; tras el build, dist.mjs)   dist.mjs
   Las excepciones, con su motivo, están en herramientas/comprobar/excepciones.mjs. */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { crearInforme, aparece, plano, sinUnidad, textoRoto } from './comprobar/comun.mjs';
import { auditarBotones } from './comprobar/piezas.mjs';
import { auditarCarteles } from './comprobar/cartel.mjs';
import { auditarCuentas } from './comprobar/cuentas.mjs';
import { recogerEnlaces, comprobarEnlaces, comprobarFuentes, comprobarRedirecciones } from './comprobar/enlaces.mjs';
import { antitesis, antitesisEnFuentes, ficheroVisible, textoVisible } from './comprobar/texto.mjs';
import { cargarPrevias, paginasDePrevia, textoDeImagen } from './comprobar/previa.mjs';
import { revisarRutas } from './comprobar/dist.mjs';
import { SIN_BOTONES } from './comprobar/excepciones.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require(join(RAIZ, 'datos/datos.js'));
for (const f of ['economia', 'vivienda', 'transporte', 'sanidad', 'impuestos', 'primaria', 'infantil', 'discapacidad', 'contexto', 'infraestructura']) {
  require(join(RAIZ, 'datos', f + '.js'));
}
require(join(RAIZ, 'assets/consulta-catalogo.js'));
const D = globalThis.DATOS;
const CONSULTA = globalThis.CONSULTA;
const T0 = Date.now();
const tiempos = {};
const cronometrar = async (k, f) => { const t = Date.now(); const r = await f(); tiempos[k] = (tiempos[k] || 0) + Date.now() - t; return r; };
const informe = crearInforme();

/* Lo que tiene que salir con texto en cada página. */
const PAGINAS = {
  'index.html': ['#golpe', '#resumen-total', '#dinero-cuerpo', '#salir-txt', '#salir-tren', '#servicios-sanidad', '#servicios-educacion', '#servicios-inclusion', '#vivienda-txt'],
  'economia.html': ['#golpe', '#trabajo-cifras', '#paro-fichas', '#renta-fichas', '#produce-fichas', '#ayto-fichas', '#ayto-mas', '#paga-fichas', '#paga-cierre', '#paga-basuras-pie',
    '#pensiones-txt', '#pensiones-cifras .tp-cifra', '#pensiones-pos', '#pensiones-notas', '#pensiones-pie a'],
  'vivienda.html': ['#golpe', '#comprar-cifras', '#alquilar-cifras', '#barrios-rangos', '#desahucios-cifras'],
  'infraestructura.html': ['#golpe', '#golpe-tren', '#cob-cifras .tp-cifra', '#casa-cifras .tp-cifra', '#plazas-cifras .tp-cifra', '#falla-tabla table', '#falla-filas li', '#tp-frase', '#tj-dato-parla-todo', '#tj-dato-aqui-sin',
    '#coches-txt', '#coches-cifras .tp-cifra', '#coches-pos', '#coches-notas', '#coches-pie a'],
  'sanidad.html': ['#golpe', '#hospital-cifras', '#hospital-filas', '#hay-listas', '#espera-txt', '#espera-cuenta', '#cabecera-txt', '#cabecera-cifras', '#cabecera-cuenta', '#mental-cifras', '#mental-cuenta',
    '#vida-txt', '#vida-cifras .tp-cifra', '#vida-pos', '#vida-notas', '#vida-pie a'],
  'educacion.html': ['#golpe', '#despues-matriz', '#despues-txt', '#fp-cifras', '#fp-filas', '#artes-cifras', '#artes-filas', '#hay-listas', '#infantil-txt', '#infantil-cifras', '#infantil-cuenta', '#especial-cifras', '#especial-cuenta',
    '#tea-cifras', '#tea-cuenta', '#ppme-cifras', '#ppme-cuenta', '#orientacion-txt',
    '#estudios-txt', '#estudios-cifras .tp-cifra', '#estudios-pos', '#estudios-notas', '#estudios-pie a'],
  'inclusion.html': ['#golpe', '#residencia-cifras', '#residencia-nota', '#residencia-cuenta', '#dia-cifras', '#dia-cuenta',
    '#ocupacional-cifras', '#ocupacional-cuenta', '#temprana-cifras', '#temprana-cuenta', '#personas-cifras', '#personas-cuenta',
    '#especial-cifras', '#tea-cifras', '#ppme-cifras'],
  'consulta.html': ['#cat-lista', '#resultados', '#cat-total']
};
/* Y lo que tiene que existir, aunque no lleve texto. */
const PIEZAS = {
  'index.html': ['.sentido', '#portada-inclusion', '#recuento .rec > .ind'],
  'vivienda.html': ['.sentido', '#casas-botones .compartir:nth-child(2)', '#comprar-botones .compartir:nth-child(2)', '#alquilar-botones .compartir:nth-child(2)',
    '#publica-botones .compartir:nth-child(2)', '#desahucios-botones .compartir:nth-child(2)',
    '#barrios-botones .compartir:nth-child(2)', '#sociedades-botones .compartir:nth-child(2)', '#hacinamiento-botones .compartir:nth-child(2)'],
  'infraestructura.html': ['.sentido', '#coches-botones .compartir:nth-child(2)', '#tren-botones .compartir:nth-child(2)', '#atocha-botones .compartir:nth-child(2)',
    '#plazas-botones .compartir:nth-child(2)', '#falla-botones .compartir:nth-child(2)', '#colas-botones .compartir:nth-child(2)', '#sentidos-botones .compartir:nth-child(2)', '#coches-cifras .tp-cifra:nth-child(2)', '#tj-parla-todo svg .tp__zona', '#tj-aqui-todo svg .tp__zona', '#tp-ley li'],
  'sanidad.html': ['.sentido', '#vida-cifras + .sentido', '#vida-botones .compartir:nth-child(2)', '#consultas-botones .compartir:nth-child(2)', '#pruebas-botones .compartir:nth-child(2)', '#espera-botones .compartir', '#cabecera-botones .compartir', '#pediatras-botones .compartir:nth-child(2)', '#mental-botones .compartir'],
  'educacion.html': ['.sentido', '#estudios-cifras + .sentido', '#estudios-botones .compartir:nth-child(2)', '#infantil-botones .compartir', '#especial-botones .compartir', '#tea-botones .compartir',
    '#ppme-botones .compartir', '#orientacion-matriz td'],
  'inclusion.html': ['.sentido', '#residencia-filas li', '#residencia-botones .compartir', '#temprana-botones .compartir', '#personas-filas li', '#personas-botones .compartir:nth-child(2)'],
  'economia.html': ['.sentido', '#pensiones-cifras + .sentido', '#pensiones-botones .compartir:nth-child(2)', '#trabajo-graf svg', '#renta-reparto .reparto__barra', '#paga-botones .compartir',
    '#trabajo-botones .compartir:nth-child(2)', '#paro-botones .compartir:nth-child(2)', '#renta-botones .compartir:nth-child(2)', '#produce-botones .compartir:nth-child(2)',
    '#deuda-botones .compartir:nth-child(2)', '#pmp-botones .compartir:nth-child(2)', '#remanente-botones .compartir:nth-child(2)',
    '#deuda-anual-botones .compartir:nth-child(2)', '#ingresos-propios-botones .compartir:nth-child(2)', '#comunidad-botones .compartir:nth-child(2)'],
  'consulta.html': ['.sentido', '#resultados .res__fila', '.cat__item input', '.con__herr > #con-enlace.compartir']
};

/* Inversión y gasto llevan cartel y vista previa salvo cuando Parla se quedaría
   prácticamente igual (menos de un 1 % de diferencia: el gasto de Leganés). */
const sinCambio = (idSerie, ciudad) => {
  const s = D.contexto.dinero.find((x) => x.id === idSerie);
  const pob = D.BASES.total.valores[D.REFERENCIA];
  return Math.abs((s.valores[ciudad] - s.valores[D.REFERENCIA]) * pob) < s.valores[D.REFERENCIA] * pob * 0.01;
};
const DINERO = (ciudad) => ['inversion', 'gasto'].filter((k) => !sinCambio(k, ciudad)).map((k) => `#${k}-botones .compartir:nth-child(2)`);
const CONDICIONALES = { 'economia.html': DINERO, 'index.html': DINERO };

/* «Todos los datos» no depende de la ciudad, sino de lo elegido: se abre
   una vez en cada vista, con datos de varias medidas y alguno negativo. */
const CONSULTAS = {
  'consulta.html?d=renta-persona,remanente,cobertura,hogares-alquiler,casas-por-vecino&vista=tabla': ['.tabla td'],
  'consulta.html?d=renta-persona,remanente,cobertura,hogares-alquiler,casas-por-vecino&vista=grafica': ['.gj__lin', '.gj__zona'],
  'consulta.html?d=remanente,abono&vista=grafica&f=columnas': ['.gj__col'],
  'consulta.html?d=paro-registrado,renta-persona&vista=grafica&g=cruce': ['.graf__p', '.graf__q']
};

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const servidor = createServer(async (pet, res) => {
  const ruta = normalize(decodeURIComponent(new URL(pet.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const cuerpo = await readFile(join(RAIZ, ruta === '/' ? 'index.html' : ruta));
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
    res.end(cuerpo);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

function abrir(pagina, ciudad) {
  const errores = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errores.push(String(e.message || e)));
  return JSDOM.fromURL(BASE + pagina + '#' + ciudad, {
    runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} });
      w.scrollTo = () => {};
      /* Imprimir no hace nada, y «copiar el enlace» sin portapapeles lo enseña con prompt: así la prueba
         pulsa los botones de compartir y lee la dirección que copiarían. */
      w.print = () => {};
      w.__urls = [];
      w.prompt = (m, u) => { w.__urls.push(u); return null; };
      Object.defineProperty(w, 'isSecureContext', { value: true });
      Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: (u) => { w.__urls.push(u); return Promise.resolve(); } } });
      /* Sin canvas de verdad: un contexto que acepta todo y no dibuja. */
      w.HTMLCanvasElement.prototype.getContext = function () {
        return new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => ({ width: 0 })), set: (o, k, v) => { o[k] = v; return true; } });
      };
    }
  }).then((dom) => new Promise((ok) => {
    dom.window.addEventListener('load', () => setTimeout(() => ok({ dom, errores }), 400));
  }));
}

/* Los mapas de transporte cargan un fichero por ciudad: se espera a que estén. */
async function esperar(doc, selectores, ms = 4000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (selectores.every((s) => doc.querySelector(s))) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

const fallos = [];
const ciudades = D.MUNICIPIOS.filter((m) => m.id !== D.REFERENCIA);
const IDS_CIUDAD = ciudades.map((m) => m.id);

/* Las vistas previas, en seco: las cifras y las rutas que publicaría el build. */
const previas = cargarPrevias(RAIZ);
const paginasPrevia = paginasDePrevia(previas.dir, IDS_CIUDAD, CONSULTA.CAT.map((d) => d.id), '.html');
const ogDe = new Map(paginasPrevia.map((p) => [(p.ciudad || '') + '/' + p.clave, p.og]));
previas.og = (ciudad, clave) => ogDe.get(ciudad + '/' + clave) || null;

const reg = { ids: {}, enlaces: [], consulta: [], copiados: 0 };
const sinFuente = {};
const excepcionesUsadas = new Set();

/* Inversión y gasto no llevan botones cuando Parla se quedaría igual (menos de un 1 %). */
const sinCambioDe = (ciudad) => (clave) => (clave === 'inversion' || clave === 'gasto') && sinCambio(clave, ciudad);

/* Cuatro ciudades a la vez: jsdom pasa la mayor parte del tiempo esperando a que carguen los scripts. */
async function enParalelo(lista, n, f) {
  const cola = lista.slice();
  await Promise.all(Array.from({ length: n }, async () => { for (let x; (x = cola.shift());) await f(x); }));
}
const AL_MISMO_TIEMPO = 4;
/* Para trabajar con una sola página o ciudad: COMPROBAR_PAGINA=economia.html COMPROBAR_CIUDAD=getafe npm run comprobar */
const SOLO_PAGINA = process.env.COMPROBAR_PAGINA, SOLO_CIUDAD = process.env.COMPROBAR_CIUDAD;

for (const [pagina, conTexto] of Object.entries(PAGINAS).filter(([p]) => !SOLO_PAGINA || p === SOLO_PAGINA)) {
  const marcas = {};
  await enParalelo(ciudades.filter((m) => !SOLO_CIUDAD || m.id === SOLO_CIUDAD), AL_MISMO_TIEMPO, async (m) => {
    const { dom, errores } = await cronometrar('abrir', () => abrir(pagina, m.id));
    const doc = dom.window.document;
    const piezas = (PIEZAS[pagina] || []).concat((CONDICIONALES[pagina] || (() => []))(m.id));
    await cronometrar('esperar', () => esperar(doc, piezas));
    const mal = [];
    errores.forEach((e) => mal.push('error: ' + e.split('\n')[0]));
    conTexto.forEach((s) => {
      const n = doc.querySelector(s);
      if (!n) mal.push('falta ' + s);
      else if (!n.textContent.trim()) mal.push('vacío ' + s);
    });
    piezas.forEach((s) => { if (!doc.querySelector(s)) mal.push('falta ' + s); });
    /* Cada título con cadena lleva un id puesto a mano: si no, indice.js lo
       saca del texto, y el enlace compartido se rompe al cambiar el texto. */
    doc.querySelectorAll('[data-id-texto]').forEach((h) => mal.push('título sin nombre en clave: «' + h.textContent.trim() + '»'));
    if (mal.length) fallos.push(`${pagina} #${m.id}: ${mal.join('; ')}`);

    /* Las comprobaciones de calidad. */
    const w = dom.window;
    const donde = { pagina, ciudad: m.id };
    if (pagina !== 'consulta.html') {
      await cronometrar('botones', async () => auditarBotones({ doc, pagina, ciudad: m.id, informe, sinCambio: sinCambioDe(m.id), usadas: excepcionesUsadas }));
      /* el texto visible, antes de que los clics de abajo lo cambien */
      informe.caso('f');
      const visible = await cronometrar('texto', async () => textoVisible(doc));
      for (const h of await cronometrar('antitesis', async () => antitesis(visible))) informe.fallo('f', donde, `antítesis en el texto: «${h}»`);
      const fich = ficheroVisible(visible);
      if (fich) informe.fallo('f', donde, `nombre de fichero en el texto visible: «${fich}»`);
      const roto = textoRoto(visible);
      if (roto) informe.fallo('d', donde, `el texto de la página dice «${roto}»`);
      informe.caso('d');
      doc.querySelectorAll('main *, body > *').forEach((e) => {
        if (!e.children.length && /^[—–]$/.test(plano(e.textContent)) && !e.closest('script, style, th, td, [aria-hidden="true"]')) {
          informe.fallo('d', { ...donde, pieza: e.closest('[id]') ? e.closest('[id]').id : '' }, '«' + plano(e.textContent) + '» suelto en la pieza (un dato que falta tiene que decir por qué)');
        }
      });
      if (pagina === 'economia.html') {
        const pen = doc.getElementById('pensiones');
        if (pen && /jubilaci[oó]n/i.test(pen.textContent)) informe.fallo('f', { ...donde, pieza: 'pensiones' }, 'la pieza de las pensiones dice «jubilación»');
      }
      if (pagina === 'index.html') await cronometrar('cuentas', async () => auditarCuentas({ doc, win: w, ciudad: m.id, previas, informe }));
      await cronometrar('enlaces', () => recogerEnlaces({ doc, win: w, pagina, ciudad: m.id, ciudades: IDS_CIUDAD, reg }));
      /* El cartel mide con getComputedStyle, que en jsdom recorre toda la hoja de estilos en cada llamada y no
         devuelve nada útil (no hay maquetación): se le da una respuesta fija. */
      const gcs = w.getComputedStyle;
      w.getComputedStyle = () => ({ fontFamily: 'Archivo' });
      await cronometrar('carteles', async () => auditarCarteles({ doc, win: w, pagina, ciudad: m.id, previas, informe, sinFuente }));
      w.getComputedStyle = gcs;
    }
    marcas[m.id] = mal.length ? '✗' : '·';
    dom.window.close();
  });
  process.stdout.write(ciudades.map((m) => marcas[m.id] || ' ').join('') + ' ' + pagina + '\n');
}
for (const [url, piezas] of Object.entries(CONSULTAS)) {
  const { dom, errores } = await abrir(url, 'getafe');
  const doc = dom.window.document;
  const mal = errores.map((e) => 'error: ' + e.split('\n')[0]);
  piezas.forEach((s) => { if (!doc.querySelector(s)) mal.push('falta ' + s); });
  /* Cada vista de la consulta lleva «Compartir esta vista». */
  const bc = doc.querySelector('#con-enlace');
  if (!bc || bc.textContent.trim() !== 'Compartir esta vista') mal.push('consulta sin el botón «Compartir esta vista»');
  if (mal.length) fallos.push(`${url}: ${mal.join('; ')}`);
  process.stdout.write(mal.length ? '✗' : '·');
  dom.window.close();
}
process.stdout.write(' consulta.html, sus vistas\n');

/* «Todos los datos»: lo que dice la imagen de cada dato es lo que dice su tabla (b). */
{
  const todos = CONSULTA.CAT.map((d) => d.id).join(',');
  const { dom, errores } = await abrir(`consulta.html?d=${todos}&vista=tabla`, 'getafe');
  const doc = dom.window.document;
  errores.forEach((e) => informe.fallo('b', { pagina: 'consulta.html' }, 'error: ' + e.split('\n')[0]));
  const cols = [...doc.querySelectorAll('#resultados .tabla thead th.tabla__dato .tabla__q')].map((x) => plano(x.textContent));
  const filas = [...doc.querySelectorAll('#resultados .tabla tbody tr[data-id]')].map((tr) => [tr.dataset.id, [...tr.querySelectorAll('td')].map((td) => plano(td.textContent))]);
  if (cols.length !== CONSULTA.CAT.length) informe.fallo('b', { pagina: 'consulta.html' }, `la tabla enseña ${cols.length} datos y el catálogo tiene ${CONSULTA.CAT.length}`);
  CONSULTA.CAT.forEach((d, i) => {
    informe.caso('b');
    const img = previas.consulta[d.id];
    if (!img) { informe.fallo('b', { pagina: 'consulta.html', pieza: d.id }, 'el dato no tiene imagen de vista previa'); return; }
    for (const [ciudad, celdas] of filas) {
      const enImagen = img.filas.find((f) => f[0] === ciudad);
      if (!enImagen || celdas[i] == null) { informe.fallo('b', { pagina: 'consulta.html', ciudad, pieza: d.id }, 'falta la fila en la tabla o en la imagen'); continue; }
      if (sinUnidad(enImagen[1]) !== sinUnidad(celdas[i])) {
        informe.fallo('b', { pagina: 'consulta.html', ciudad, pieza: d.id }, `la imagen dice «${enImagen[1]}» y la tabla «${celdas[i]}»`);
      }
    }
  });
  dom.window.close();
}

/* Las vistas previas: lo que dicen sus imágenes y sus descripciones (c, d, f) y que las rutas existen (h). */
{
  const imagenesPieza = new Map();       /* imagen → { donde, fuente: ¿debe llevarla? } */
  for (const [clave, porCiudad] of Object.entries(previas.piezas)) {
    for (const [c, e] of Object.entries(porCiudad)) {
      imagenesPieza.set(`${c}-${clave}`, { ciudad: c, pieza: clave, sola: e.b == null, pie: e.pie });
      /* una columna vacía en la imagen: la cifra de Parla o la de la otra ciudad en blanco */
      informe.caso('d');
      for (const [q, v] of [['Parla', e.a], [c, e.b]]) {
        if (v !== null && !String(v).trim()) informe.fallo('d', { pagina: `${c}/${clave}/`, ciudad: c, pieza: clave }, `la imagen de vista previa lleva la cifra de ${q} vacía`);
      }
    }
  }
  previas.fichas.forEach((f) => { if (!/cartera/.test(f.imagen)) imagenesPieza.set(f.imagen.replace(/\.png$/, ''), { ciudad: f.ciudad, pieza: f.clave, pie: f.pie }); });
  CONSULTA.CAT.forEach((d) => imagenesPieza.set('consulta-' + d.id, { ciudad: null, pieza: 'consulta/' + d.id, consulta: true }));
  for (const p of paginasPrevia) {
    const donde = { pagina: (p.ciudad ? p.ciudad + '/' : '') + p.clave + '/', ciudad: p.ciudad, pieza: p.clave };
    const og = p.og;
    informe.caso('d');
    for (const k of ['title', 'description']) {
      const r = textoRoto(og[k] || '');
      if (r) informe.fallo('d', donde, `og:${k} dice «${r}»`);
      for (const h of antitesis(og[k] || '')) informe.fallo('f', donde, `antítesis en og:${k}: «${h}»`);
      const fich = ficheroVisible(og[k] || '');
      if (fich) informe.fallo('f', donde, `nombre de fichero en og:${k}: «${fich}»`);
    }
    if (!p.hayImagen) continue;
    const t = textoDeImagen(p);
    const nombre = p.imagen.replace(/\.png$/, '');
    const r = textoRoto(t);
    if (r) informe.fallo('d', donde, `la imagen dice «${r}»`);
    if (/(^|\s)[—–](\s|$)/.test(t)) informe.fallo('d', donde, 'la imagen lleva un «—» suelto');
    for (const h of antitesis(t)) informe.fallo('f', donde, `antítesis en la imagen: «${h}»`);
    const fich = ficheroVisible(t);
    if (fich) informe.fallo('f', donde, `nombre de fichero en la imagen: «${fich}»`);
    if (/por ciento/i.test(t)) informe.fallo('c', donde, 'la imagen lleva la línea «por ciento»: el % va en la cifra');
    const info = imagenesPieza.get(nombre);
    if (info) {
      informe.caso('c');
      if (info.consulta ? !/Fuente:/.test(t) : !info.pie || !info.pie.trim() || !t.includes(plano(info.pie).slice(0, 25))) informe.fallo('c', donde, 'la imagen no lleva su fuente');
    } else if (/cartera/.test(nombre)) {
      informe.caso('c');
      if (!/Fuente:/.test(t)) informe.fallo('c', donde, 'la imagen de la cartera del hospital no lleva fuente en el pie');
    }
  }
  /* Las imágenes «Parla sola» llevan su motivo: hay texto más allá de la cifra de Parla (la frase que lo explica). */
  for (const [nombre, info] of imagenesPieza) {
    if (!info.sola) continue;
    const f = join(previas.dir, 'assets/compartir', nombre + '.html');
    informe.caso('d');
    const html = readFileSync(f, 'utf8');
    const t = plano(html.replace(/<[^>]*>/g, ' '));
    if (!/(no tiene|no da|sin dato|no hay|no publica|no se |falta|no dispone|ninguna)/i.test(t)) informe.fallo('d', { pagina: nombre, ciudad: info.ciudad, pieza: info.pieza }, 'imagen «Parla sola» sin el motivo de que falte la otra ciudad');
  }
  revisarRutas({ dir: previas.dir, ext: '.html', ciudades: IDS_CIUDAD, idsConsulta: CONSULTA.CAT.map((d) => d.id), rutas: previas.rutas, informe });
}

/* Enlaces, fuentes y texto de los fuentes (g, f). */
comprobarEnlaces({ reg, informe, consulta: CONSULTA });
comprobarRedirecciones({ paginas: paginasPrevia, reg, informe, consulta: CONSULTA, leer: (f) => readFileSync(f, 'utf8'), parcial: !!(SOLO_PAGINA || SOLO_CIUDAD) });
comprobarFuentes({ globales: globalThis, consulta: CONSULTA, informe });
for (const h of await antitesisEnFuentes(RAIZ, informe)) informe.fallo('f', { pagina: h.fichero }, `antítesis en el texto del fuente: «${h.frase}»`);

/* Excepciones que ya no hacen falta. */
for (const k of Object.keys(SIN_BOTONES)) {
  if (!SOLO_PAGINA && !SOLO_CIUDAD && !excepcionesUsadas.has(k) && !k.endsWith('#metodo')) informe.aviso('a', { pagina: k.split('#')[0], pieza: k.split('#')[1] }, 'la excepción de SIN_BOTONES ya no hace falta (la sección tiene sus botones): quítala');
}
/* Carteles sin línea de fuente: una sola nota, con las piezas. */
const sinLinea = Object.keys(sinFuente).sort();
if (sinLinea.length) {
  informe.fallo('c', { pagina: 'carteles' }, `${sinLinea.length} piezas tienen cartel sin línea de fuente (regla: ningún número sin su fuente): ${sinLinea.join(', ')}`);
}
previas.limpiar();
servidor.close();

/* ── El informe ─────────────────────────────────────────────────────── */
const NOMBRES = { a: 'a  botones de cartel y de enlace', b: 'b  cifras de cartel, vista previa y pantalla', c: 'c  forma de carteles y vistas previas',
  d: 'd  casos sin dato', e: 'e  cuentas del recuento', f: 'f  texto público', g: 'g  enlaces y fuentes', h: 'h  rutas y vistas previas' };
console.log('');
for (const b of Object.keys(NOMBRES)) {
  const f = informe.fallos.filter((x) => x.b === b).length, av = informe.avisos.filter((x) => x.b === b).length;
  console.log(`  ${f ? '✗' : '✓'} ${NOMBRES[b].padEnd(46)} ${String(informe.casos[b] || 0).padStart(6)} casos${f ? `, ${f} fallos` : ''}${av ? `, ${av} avisos` : ''}`);
}
const segundos = ((Date.now() - T0) / 1000).toFixed(0);
if (informe.avisos.length) {
  /* Los avisos que solo cambian de ciudad o de cifra se enseñan una vez, con cuántos son. */
  const grupos = new Map();
  for (const a of informe.avisos) {
    const k = a.texto.replace(new RegExp(Object.values(CONSULTA.NOMBRE).join('|'), 'g'), 'X').replace(/ #[a-z]+/, '').replace(/^\[(.)\] [^ ]+\/ /, '[$1] ').replace(/[\d][\d.,]*/g, 'N').replace(/«[^»]*»/g, '«»');
    if (!grupos.has(k)) grupos.set(k, { texto: a.texto, n: 0 });
    grupos.get(k).n++;
  }
  console.log(`\n${informe.avisos.length} avisos (no hacen fallar; necesitan una decisión del dueño):\n  ` +
    [...grupos.values()].map((g) => g.texto + (g.n > 1 ? `  (${g.n} casos)` : '')).join('\n  '));
}
if (process.env.COMPROBAR_TIEMPOS) console.log('tiempos (ms):', tiempos);
const todos = fallos.concat(informe.fallos.map((x) => x.texto));
const LIMITE = process.env.COMPROBAR_COMPLETO ? Infinity : 200;
if (todos.length) {
  console.error('\n' + todos.length + ' fallos (' + segundos + ' s):\n  ' + todos.slice(0, LIMITE).join('\n  ') + (todos.length > LIMITE ? `\n  … y ${todos.length - LIMITE} más` : ''));
  process.exit(1);
}
console.log(`\nBien: ${Object.keys(PAGINAS).length} páginas × ${ciudades.length} ciudades. (${segundos} s)`);

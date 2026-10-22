/* La prueba de la web (`npm run comprobar`, y antes de cada build de Netlify).
   Sirve la carpeta en un puerto local y abre cada página con cada ciudad en
   jsdom, que ejecuta el JavaScript igual que un navegador pero sin pintar.
   Falla si hay un error de JavaScript o si algo que tiene que salir sale
   vacío: la frase de arriba, el recuento, las fichas, los mapas.

   No mira cómo se ve (para eso hace falta un navegador de verdad): mira que
   cada página arranca y escribe sus cifras para las diez ciudades. */
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require(join(RAIZ, 'datos/datos.js'));
const D = globalThis.DATOS;

/* Lo que tiene que salir con texto en cada página. */
const PAGINAS = {
  'index.html': ['#golpe', '#resumen-total', '#dinero-cuerpo', '#salir-txt', '#salir-tren', '#servicios-sanidad', '#servicios-educacion', '#vivienda-txt'],
  'economia.html': ['#golpe', '#trabajo-cifras', '#paro-fichas', '#renta-fichas', '#produce-fichas', '#ayto-fichas', '#ayto-mas', '#paga-fichas', '#paga-cierre', '#paga-basuras-pie'],
  'vivienda.html': ['#golpe', '#comprar-cifras', '#alquilar-cifras', '#barrios-rangos', '#desahucios-cifras'],
  'infraestructura.html': ['#golpe', '#golpe-tren', '#cob-cifras', '#abono-cifras', '#tp-frase', '#tp-dato-parla', '#tp-dato-aqui'],
  'sanidad.html': ['#golpe', '#hospital-cifras', '#hospital-filas', '#hay-listas', '#espera-txt', '#espera-cuenta', '#cabecera-txt', '#cabecera-cifras', '#cabecera-cuenta'],
  'educacion.html': ['#golpe', '#despues-matriz', '#despues-txt', '#fp-cifras', '#fp-filas', '#artes-cifras', '#artes-filas', '#hay-listas', '#infantil-txt', '#infantil-cifras', '#infantil-cuenta'],
  'consulta.html': ['#cat-lista', '#resultados', '#cat-total']
};
/* Y lo que tiene que existir, aunque no lleve texto. */
const PIEZAS = {
  'index.html': ['.sentido'],
  'vivienda.html': ['.sentido'],
  'infraestructura.html': ['.sentido', '#tp-parla svg .tp__zona', '#tp-aqui svg .tp__zona', '#tp-ley li'],
  'sanidad.html': ['.sentido', '#espera-botones .compartir', '#cabecera-botones .compartir'],
  'educacion.html': ['.sentido', '#infantil-botones .compartir'],
  'economia.html': ['.sentido', '#trabajo-graf svg', '#renta-reparto .reparto__barra', '#paga-botones .compartir'],
  'consulta.html': ['.sentido', '#resultados .res__fila', '.cat__item input']
};

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
for (const [pagina, conTexto] of Object.entries(PAGINAS)) {
  for (const m of ciudades) {
    const { dom, errores } = await abrir(pagina, m.id);
    const doc = dom.window.document;
    await esperar(doc, PIEZAS[pagina] || []);
    const mal = [];
    errores.forEach((e) => mal.push('error: ' + e.split('\n')[0]));
    conTexto.forEach((s) => {
      const n = doc.querySelector(s);
      if (!n) mal.push('falta ' + s);
      else if (!n.textContent.trim()) mal.push('vacío ' + s);
    });
    (PIEZAS[pagina] || []).forEach((s) => { if (!doc.querySelector(s)) mal.push('falta ' + s); });
    /* Cada título con cadena lleva un id puesto a mano: si no, indice.js lo
       saca del texto, y el enlace compartido se rompe al cambiar el texto. */
    doc.querySelectorAll('[data-id-texto]').forEach((h) => mal.push('título sin nombre en clave: «' + h.textContent.trim() + '»'));
    if (mal.length) fallos.push(`${pagina} #${m.id}: ${mal.join('; ')}`);
    process.stdout.write(mal.length ? '✗' : '·');
    dom.window.close();
  }
  process.stdout.write(' ' + pagina + '\n');
}
for (const [url, piezas] of Object.entries(CONSULTAS)) {
  const { dom, errores } = await abrir(url, 'getafe');
  const doc = dom.window.document;
  const mal = errores.map((e) => 'error: ' + e.split('\n')[0]);
  piezas.forEach((s) => { if (!doc.querySelector(s)) mal.push('falta ' + s); });
  if (mal.length) fallos.push(`${url}: ${mal.join('; ')}`);
  process.stdout.write(mal.length ? '✗' : '·');
  dom.window.close();
}
process.stdout.write(' consulta.html, sus vistas\n');
servidor.close();

if (fallos.length) {
  console.error('\n' + fallos.length + ' fallos:\n  ' + fallos.join('\n  '));
  process.exit(1);
}
console.log(`Bien: ${Object.keys(PAGINAS).length} páginas × ${ciudades.length} ciudades.`);

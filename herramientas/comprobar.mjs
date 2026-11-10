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
  'consulta.html': ['.sentido', '#resultados .res__fila', '.cat__item input']
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
    const piezas = (PIEZAS[pagina] || []).concat((CONDICIONALES[pagina] || (() => []))(m.id));
    await esperar(doc, piezas);
    const mal = [];
    errores.forEach((e) => mal.push('error: ' + e.split('\n')[0]));
    conTexto.forEach((s) => {
      const n = doc.querySelector(s);
      if (!n) mal.push('falta ' + s);
      else if (!n.textContent.trim()) mal.push('vacío ' + s);
    });
    piezas.forEach((s) => { if (!doc.querySelector(s)) mal.push('falta ' + s); });
    /* Cada ficha del recuento lleva los dos botones: el cartel y «Compartir esta sección». */
    if (pagina === 'index.html') {
      doc.querySelectorAll('#recuento .rec > .ind').forEach((f) => {
        const b = [...f.querySelectorAll(':scope > .ind__acciones > .compartir')].map((x) => x.textContent.trim());
        if (b.length !== 2 || !/Cartel/.test(b[0]) || b[1] !== 'Compartir esta sección') mal.push('ficha sin sus dos botones: #' + f.id);
      });
    }
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

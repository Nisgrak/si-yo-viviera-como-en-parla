/* La revisión con navegador (`npm run revisar`). Es la segunda mitad de la calidad: lo que jsdom no ve
   porque no pinta nada. Se corre a mano antes de publicar, no en Netlify. Abre la web en Chromium de
   verdad, en un servidor local propio (un puerto libre, que cierra al acabar), y mira:

     i  los carteles: todos los del sitio × diez ciudades × los dos fondos (papel y barrio). Ningún texto
        fuera del cartel, de su columna o de su caja; nada se pisa; nada invade la banda del pie; y sobre
        el fondo del barrio, contraste suficiente.
     j  las páginas: las ocho × diez ciudades, en escritorio (1280) y en móvil (390), en claro y en oscuro.
        Sin errores de consola, sin desborde horizontal, y las comparaciones Parla | otra ciudad que en
        escritorio van en dos columnas, también en dos columnas en el móvil.
     k  los enlaces ?ir=: a la última sección de cada página y a tres fichas del recuento, el título queda
        visible bajo la cabecera fija y la ficha llega abierta; si el usuario hace scroll, el reintento
        no le devuelve.
     l  el recuento de portada: abrir y cerrar con clic y con teclado, aria-expanded, y las fichas abiertas
        se conservan al cambiar de ciudad.
     n  los mapas de infraestructura.html en ventanas de portátil bajo (1366×650, 1280×600): cada mapa se ve
        entero a la vez que su leyenda, Parla y la otra ciudad del mismo tamaño, y nada en blanco.
     m  si existe dist/ (`npm run build`): tres rutas de vista previa por tipo (sección, ficha, dato de
        «Todos los datos») redirigen bien.

   Opciones:   npm run revisar -- --pagina economia --ciudad getafe --bloque i,k --concurrencia 3
   Sale con código 1 si algo falla, y dice página, ciudad y pieza. Playwright no está en el build de
   Netlify: se resuelve desde una instalación normal o desde herramientas/video/node_modules
   (`cd herramientas/video && npm install`). */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearInforme } from './comprobar/comun.mjs';
import { PAREJAS_EN_DOS_COLUMNAS, PAREJAS_APILADAS_A_PROPOSITO } from './comprobar/parejas.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);

/* ── Opciones ───────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const opcion = (n, defecto = null) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : defecto; };
if (args.includes('--ayuda') || args.includes('-h')) {
  console.log('npm run revisar -- [--pagina economia] [--ciudad getafe] [--bloque i,j,k,l,m,n] [--concurrencia 3]');
  process.exit(0);
}
const SOLO_PAGINA = opcion('pagina');
const SOLO_CIUDAD = opcion('ciudad');
const BLOQUES = (opcion('bloque') || 'i,j,k,l,m,n').split(',').map((x) => x.trim());
const N = Number(opcion('concurrencia', Math.max(2, Math.min(4, (require('node:os').cpus().length || 4) - 1))));

/* ── Playwright: de una instalación normal o de herramientas/video ───── */
function cargarPlaywright() {
  for (const desde of [import.meta.url, pathToFileURLDe(join(RAIZ, 'herramientas/video/package.json'))]) {
    try { return createRequire(desde)('playwright'); } catch { /* el siguiente */ }
  }
  console.error('No encuentro Playwright. Instálalo con:  cd herramientas/video && npm install  (y  npx playwright install chromium)');
  process.exit(2);
}
function pathToFileURLDe(p) { return new URL('file://' + p).href; }
const { chromium } = cargarPlaywright();

/* ── Datos de la web: las ciudades y las páginas ────────────────────── */
globalThis.window = globalThis;
require(join(RAIZ, 'datos/datos.js'));
const D = globalThis.DATOS;
const CIUDADES = D.MUNICIPIOS.filter((m) => m.id !== D.REFERENCIA).map((m) => m.id).filter((c) => !SOLO_CIUDAD || c === SOLO_CIUDAD);
const TODAS = ['index', 'economia', 'vivienda', 'infraestructura', 'sanidad', 'educacion', 'inclusion', 'consulta'];
const PAGINAS = TODAS.filter((p) => !SOLO_PAGINA || p === SOLO_PAGINA.replace(/\.html$/, ''));
const PAGINAS_CON_CARTEL = PAGINAS.filter((p) => p !== 'consulta');
if (!CIUDADES.length || !PAGINAS.length) { console.error('Ciudad o página desconocida.'); process.exit(2); }

/* ── Servidor estático en un puerto libre ───────────────────────────── */
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
function servir(dir) {
  const srv = createServer(async (pet, res) => {
    let ruta = normalize(decodeURIComponent(new URL(pet.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
      let f = join(dir, ruta);
      if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
      const cuerpo = await readFile(f);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(f)] || 'application/octet-stream' });
      res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ base: `http://127.0.0.1:${srv.address().port}`, cerrar: () => new Promise((r) => srv.close(r)) })));
}

const informe = crearInforme();
const tiemposBloque = {};
async function enParalelo(lista, n, f) {
  const cola = lista.slice();
  await Promise.all(Array.from({ length: n }, async () => { for (let x; (x = cola.shift());) await f(x); }));
}
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

/* Una página con lo habitual: errores de consola recogidos, y sin imprimir de verdad. */
async function pagina(contexto, errores, { imprimir = false } = {}) {
  const p = await contexto.newPage();
  p.on('pageerror', (e) => errores.push('error de JavaScript: ' + String(e.message).split('\n')[0]));
  p.on('console', (m) => { if (m.type() === 'error') errores.push('consola: ' + m.text().split('\n')[0]); });
  p.on('requestfailed', (r) => errores.push('petición fallida: ' + r.url().replace(/^https?:\/\/[^/]+/, '')));
  if (imprimir) {
    await p.addInitScript(() => {
      window.print = () => {};
      const st = window.setTimeout;
      window.setTimeout = (f, t, ...a) => (t === 1500 ? 0 : st(f, t, ...a));   /* que el cartel no se limpie solo */
    });
  }
  return p;
}
const ir = (p, base, pag, ciudad, extra = '') => p.goto(`${base}/${pag}.html${extra}#${ciudad}`, { waitUntil: 'networkidle', timeout: 30000 });

/* ═══ i · los carteles ═══════════════════════════════════════════════ */

/* Se ejecuta en la página, con el cartel ya montado y el medio «print»: devuelve lo que mide. */
function medirCartel() {
  const c = document.getElementById('cartel');
  if (!c || !document.documentElement.hasAttribute('data-cartel')) return { err: 'el cartel no se monta' };
  const R = c.getBoundingClientRect();
  const rel = (r) => ({ l: r.left - R.left, t: r.top - R.top, r: r.right - R.left, b: r.bottom - R.top });
  const textos = [];
  const w = document.createTreeWalker(c.querySelector('.kcapa'), NodeFilter.SHOW_TEXT);
  let nd;
  while ((nd = w.nextNode())) {
    if (!nd.textContent.trim()) continue;
    const e = nd.parentElement, rg = document.createRange();
    rg.selectNodeContents(nd);
    const cs = getComputedStyle(e);
    textos.push({
      txt: nd.textContent.trim().slice(0, 30), cls: String(e.className || e.tagName), color: cs.color, size: parseFloat(cs.fontSize),
      rects: [...rg.getClientRects()].map(rel),
      col: e.closest('.ktit__col') ? rel(e.closest('.ktit__col').getBoundingClientRect()) : null,
      caja: e.closest('.kcaja') ? rel(e.closest('.kcaja').getBoundingClientRect()) : null,
      desborda: e.matches('.ktit__n') && e.scrollWidth > e.clientWidth + 1
    });
  }
  const bl = (s) => { const e = c.querySelector(s); return e ? rel(e.getBoundingClientRect()) : null; };
  return { W: R.width, H: R.height, textos, banda: bl('.kbanda'), pre: bl('.kpre'), tit: bl('.ktit'), sub: bl('.ksub'),
    cajas: bl('.kcajas'), areas: bl('.kareas'), cajasItems: [...c.querySelectorAll('.kcaja')].map((e) => rel(e.getBoundingClientRect())) };
}

/* Contraste del texto sobre la foto: se pinta el cartel sin texto y se mira el fondo bajo cada trozo. */
async function contraste(p, med) {
  const css = await p.addStyleTag({ content: '#cartel .kcapa *{color:transparent!important}' });
  const buf = await p.locator('#cartel').screenshot({ type: 'png' });
  await css.evaluate((e) => e.remove());
  return p.evaluate(async ([b64, textos]) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const sal = [];
    for (const t of textos) {
      const m = t.color.match(/[\d.]+/g).map(Number); const Lt = lum(m[0], m[1], m[2]);
      const cs = [];
      for (const r of t.rects) {
        const x0 = Math.max(0, Math.floor(r.l)), y0 = Math.max(0, Math.floor(r.t));
        const w = Math.min(im.width - x0, Math.ceil(r.r - r.l)), h = Math.min(im.height - y0, Math.ceil(r.b - r.t));
        if (w < 1 || h < 1) continue;
        const d = cx.getImageData(x0, y0, w, h).data;
        for (let q = 0; q < d.length; q += 16) { const Lb = lum(d[q], d[q + 1], d[q + 2]); cs.push((Math.max(Lt, Lb) + 0.05) / (Math.min(Lt, Lb) + 0.05)); }
      }
      cs.sort((a, b) => a - b);
      sal.push({ txt: t.txt, p10: cs.length ? cs[Math.floor(cs.length * 0.1)] : null });
    }
    return sal;
  }, [buf.toString('base64'), med.textos]);
}

function problemasDeCartel(med, fondo) {
  const T = 2, probs = [];
  for (const t of med.textos) for (const r of t.rects) {
    if (r.l < -T || r.r > med.W + T || r.t < -T || r.b > med.H + T) probs.push('texto fuera del cartel: «' + t.txt + '»');
    if (t.col && (r.r > t.col.r + T || r.l < t.col.l - T)) probs.push('texto fuera de su columna: «' + t.txt + '» (' + Math.round(r.r - t.col.r) + ' px)');
    if (t.caja && (r.r > t.caja.r + T || r.l < t.caja.l - T)) probs.push('texto fuera de su caja: «' + t.txt + '»');
    if (med.banda && r.b > med.banda.t + T) probs.push('invade la banda del pie: «' + t.txt + '» (' + Math.round(r.b - med.banda.t) + ' px)');
  }
  for (const t of med.textos) if (t.desborda) probs.push('la cifra desborda su caja: «' + t.txt + '»');
  for (const cj of med.cajasItems) if (med.banda && cj.b > med.banda.t + T) probs.push('una caja invade la banda del pie (' + Math.round(cj.b - med.banda.t) + ' px)');
  const seq = [['frase de entrada', med.pre], ['titular', med.tit], ['frase', med.sub], ['cajas', med.cajas || med.areas]].filter((x) => x[1]);
  for (let k = 1; k < seq.length; k++) if (seq[k][1].t < seq[k - 1][1].b - T) probs.push(`se pisan ${seq[k - 1][0]} y ${seq[k][0]} (${Math.round(seq[k - 1][1].b - seq[k][1].t)} px)`);
  const ult = seq[seq.length - 1][1];
  if (med.banda && ult.b > med.banda.t + T) probs.push('el bloque de cifras invade la banda del pie (' + Math.round(ult.b - med.banda.t) + ' px)');
  /* líneas de una misma columna que se pisan */
  const porCol = {};
  for (const t of med.textos) if (t.col) (porCol[Math.round(t.col.l)] = porCol[Math.round(t.col.l)] || []).push(t);
  for (const ts of Object.values(porCol)) {
    for (let a = 0; a < ts.length; a++) for (let b = a + 1; b < ts.length; b++) {
      for (const x of ts[a].rects) for (const y of ts[b].rects) {
        const ov = Math.min(x.b, y.b) - Math.max(x.t, y.t);
        if (ov > 0.6 * Math.min(x.b - x.t, y.b - y.t) && Math.min(x.r, y.r) > Math.max(x.l, y.l)) probs.push(`se pisan «${ts[a].txt}» y «${ts[b].txt}»`);
      }
    }
  }
  return [...new Set(probs)];
}

async function bloqueCarteles(browser, base) {
  const unidades = [];
  for (const pag of PAGINAS_CON_CARTEL) for (const c of CIUDADES) unidades.push([pag, c]);
  await enParalelo(unidades, N, async ([pag, ciudad]) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    const errores = [];
    const p = await pagina(ctx, errores, { imprimir: true });
    try {
      await ir(p, base, pag, ciudad);
      await pausa(500);
      await p.emulateMedia({ media: 'print' });
      const n = await p.evaluate(() => [...document.querySelectorAll('button.compartir')].filter((b) => /Cartel/.test(b.textContent)).length);
      for (let i = 0; i < n; i++) {
        for (const fondo of ['papel', 'barrio']) {
          const id = await p.evaluate(async ([i, fondo]) => {
            const b = [...document.querySelectorAll('button.compartir')].filter((x) => /Cartel/.test(x.textContent))[i];
            const cont = b.closest('[id]');
            b.click();
            await new Promise((r) => setTimeout(r, 20));
            const f = document.querySelector('dialog[open] .fondo[data-fondo=' + fondo + ']');
            if (!f) return (cont ? cont.id : '?') + '\u0000sin diálogo';
            f.click();
            const img = document.querySelector('.cartel--afiche .kfondo');
            if (img && img.decode) await img.decode().catch(() => {});
            await new Promise((r) => setTimeout(r, 60));
            return cont ? cont.id : '?';
          }, [i, fondo]);
          const [pieza, err] = id.split('\u0000');
          const donde = { pagina: pag + '.html', ciudad, pieza: pieza.replace(/-botones$/, '') + ' (' + fondo + ')' };
          informe.caso('i');
          if (err) { informe.fallo('i', donde, err); continue; }
          const med = await p.evaluate(medirCartel);
          if (med.err) { informe.fallo('i', donde, med.err); continue; }
          for (const m of problemasDeCartel(med, fondo)) informe.fallo('i', donde, m);
          if (fondo === 'barrio') {
            for (const c of await contraste(p, med)) if (c.p10 != null && c.p10 < 3) informe.fallo('i', donde, `poco contraste sobre el fondo del barrio (${c.p10.toFixed(1)}:1, mínimo 3:1): «${c.txt}»`);
          }
          await p.evaluate(() => { const d = document.querySelector('dialog[open]'); if (d) d.close(); });
        }
      }
      for (const e of errores) informe.fallo('i', { pagina: pag + '.html', ciudad }, e);
    } catch (e) {
      informe.fallo('i', { pagina: pag + '.html', ciudad }, 'la revisión de carteles se ha parado: ' + String(e.message).split('\n')[0]);
    } finally { await ctx.close(); }
  });
}

/* ═══ j · las páginas, en escritorio y móvil, claro y oscuro ═════════ */

/* Las parejas Parla | otra ciudad (los elementos con data-quien) y si están una al lado de la otra. */
function leerParejas() {
  const salida = [];
  const visto = {};
  document.querySelectorAll('[data-quien="referencia"]').forEach((a) => {
    const b = [...(a.parentElement ? a.parentElement.children : [])].find((x) => x.getAttribute('data-quien') === 'aqui');
    if (!b) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if (ra.width < 2 || rb.width < 2) return;
    const caja = a.closest('[id]');
    const clave = (caja ? caja.id : '') + ':' + String(a.className);
    visto[clave] = (visto[clave] || 0) + 1;
    salida.push({ clave: clave + '#' + visto[clave], juntas: Math.abs(ra.top - rb.top) < 6 && rb.left > ra.left + 1 });
  });
  return salida;
}

async function bloquePaginas(browser, base) {
  const juntasMovil = new Set();
  const unidades = [];
  for (const pag of PAGINAS) for (const c of CIUDADES) unidades.push([pag, c]);
  const perfiles = [
    ['escritorio 1280, claro', { viewport: { width: 1280, height: 800 }, colorScheme: 'light' }],
    ['móvil 390, claro', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' }],
    ['escritorio 1280, oscuro', { viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }],
    ['móvil 390, oscuro', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' }]
  ];
  await enParalelo(unidades, N, async ([pag, ciudad]) => {
    let referencia = null;      /* las parejas en escritorio y claro */
    for (const [nombre, opciones] of perfiles) {
      const ctx = await browser.newContext(opciones);
      const errores = [];
      const p = await pagina(ctx, errores);
      const donde = { pagina: pag + '.html', ciudad, pieza: nombre };
      try {
        await ir(p, base, pag, ciudad);
        await pausa(300);
        informe.caso('j');
        for (const e of [...new Set(errores)]) informe.fallo('j', donde, e);
        const r = await p.evaluate(() => {
          const ancho = document.documentElement.clientWidth;
          const sobresale = [...document.querySelectorAll('body *')].filter((e) => {
            const cs = getComputedStyle(e);
            if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (e.closest('[hidden], [aria-hidden="true"], svg, .oculto, .tabla-caja, .scroll, [data-indice-ancho]')) return false;
            const q = e.getBoundingClientRect();
            return q.width > 0 && q.right > ancho + 1;
          }).slice(0, 3).map((e) => (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0]);
          return { sw: document.documentElement.scrollWidth, cw: ancho, sobresale };
        });
        if (r.sw > r.cw + 1) informe.fallo('j', donde, `desborde horizontal: la página mide ${r.sw} px y la ventana ${r.cw}` + (r.sobresale.length ? ` (se salen: ${r.sobresale.join(', ')})` : ''));
        const parejas = await p.evaluate(leerParejas);
        if (nombre === perfiles[0][0]) referencia = parejas;
        else if (opciones.isMobile) {
          for (const x of parejas) {
            const clave = x.clave.replace(/#\d+$/, '');
            const enEscritorio = referencia && referencia.find((q) => q.clave === x.clave);
            informe.caso('j');
            if (x.juntas) juntasMovil.add(clave);
            /* Las que ya iban en dos columnas en el móvil siguen yendo. */
            if (!x.juntas && PAREJAS_EN_DOS_COLUMNAS.includes(clave)) {
              informe.fallo('j', donde, `Parla y ${ciudad} iban en dos columnas en el móvil y ahora van una debajo de otra: ${clave}`);
            }
            /* Las que van en dos columnas en escritorio y se apilan en el móvil, sin ser una excepción decidida: error. */
            if (!x.juntas && !PAREJAS_EN_DOS_COLUMNAS.includes(clave) && !PAREJAS_APILADAS_A_PROPOSITO[clave] && enEscritorio && enEscritorio.juntas) {
              informe.fallo('j', donde, `Parla y ${ciudad} van en dos columnas en escritorio y una debajo de otra en el móvil: ${clave}. La regla es frente a frente también en el móvil; si es a propósito, va en PAREJAS_APILADAS_A_PROPOSITO (herramientas/comprobar/parejas.mjs) con su motivo`);
            }
          }
        }
      } catch (e) {
        informe.fallo('j', donde, 'no se pudo abrir la página: ' + String(e.message).split('\n')[0]);
      } finally { await ctx.close(); }
    }
  });
  if (args.includes('--parejas')) console.log('\nParejas en dos columnas en el móvil (para parejas.mjs):\n' + JSON.stringify([...juntasMovil].sort(), null, 2));
}

/* ═══ k · los enlaces ?ir= ═══════════════════════════════════════════ */

/* La altura de lo que queda fijo arriba (la cabecera) y dónde está el título del destino. */
function medirDestino(id) {
  const e = document.getElementById(id);
  if (!e) return { falta: true };
  const fila = e.closest('.rec');
  const caja = fila || e;
  const t = /^H\d$/.test(e.tagName) ? e : (fila ? fila.querySelector('.rec__h') : null) || e.querySelector('h1, h2, h3, h4, .rec__h') || e;
  const q = t.getBoundingClientRect();
  let fijo = 0;
  document.querySelectorAll('body *').forEach((x) => {
    const cs = getComputedStyle(x);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = x.getBoundingClientRect();
    if (r.top <= 1 && r.height > 10 && r.height < 200 && r.width > innerWidth * 0.5 && r.bottom > 0) fijo = Math.max(fijo, r.bottom);
  });
  return { y: Math.round(scrollY), titulo: Math.round(q.top), fijo: Math.round(fijo), alto: innerHeight, visible: q.height > 0 && q.top >= fijo - 1 && q.top < innerHeight - 40,
    abierta: e.matches('article.ind') ? !e.hidden : null, filaTop: Math.round(caja.getBoundingClientRect().top), max: document.documentElement.scrollHeight - innerHeight };
}

async function bloqueEnlaces(browser, base) {
  const ciudad = SOLO_CIUDAD || 'getafe';
  const perfiles = [['escritorio', { viewport: { width: 1280, height: 800 } }], ['móvil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]];
  const unidades = [];
  for (const pag of PAGINAS) for (const pf of perfiles) unidades.push([pag, pf]);
  await enParalelo(unidades, N, async ([pag, [nombre, opciones]]) => {
    const ctx = await browser.newContext(opciones);
    const errores = [];
    try {
      const sondeo = await pagina(ctx, errores);
      await ir(sondeo, base, pag, ciudad);
      await pausa(300);
      const ids = await sondeo.evaluate(() => {
        const secs = [...document.querySelectorAll('[data-indice]')].filter((e) => e.id);
        const fichas = [...document.querySelectorAll('#recuento .rec > .ind')].map((e) => e.id);
        return { ultima: secs.length ? secs[secs.length - 1].id : null, media: secs.length ? secs[Math.floor(secs.length / 2)].id : null, fichas };
      });
      await sondeo.close();
      const destinos = [];
      if (ids.ultima) destinos.push([ids.ultima, 'última sección']);
      if (pag === 'index' && ids.fichas.length) {
        [0, Math.floor(ids.fichas.length / 2), ids.fichas.length - 1].forEach((i, k) => { if (ids.fichas[i]) destinos.push([ids.fichas[i], 'ficha ' + (k + 1) + ' del recuento']); });
      }
      for (const [id, que] of destinos) {
        const p = await pagina(ctx, errores);
        informe.caso('k');
        const donde = { pagina: pag + '.html', ciudad, pieza: `?ir=${id} (${nombre}, ${que})` };
        await p.goto(`${base}/${pag}.html?ir=${encodeURIComponent(id)}#${ciudad}`, { waitUntil: 'load' });
        await pausa(3300);
        const r = await p.evaluate(medirDestino, id);
        if (r.falta) informe.fallo('k', donde, 'el id del enlace no existe en la página');
        else {
          /* Si la página no puede bajar más, el título queda donde esté: basta con que se vea. */
          if (!r.visible) informe.fallo('k', donde, `el título queda a ${r.titulo} px, ${r.titulo < r.fijo ? 'tapado por la cabecera fija (' + r.fijo + ' px)' : 'fuera de la pantalla'} (scroll ${r.y} de ${r.max})`);
          if (r.abierta === false) informe.fallo('k', donde, 'la ficha llega cerrada');
        }
        await p.close();
      }
      /* Si el usuario hace scroll, el reintento no le devuelve. */
      if (pag === 'economia' && ids.media) {
        const acciones = nombre === 'escritorio'
          ? [['rueda', (q) => q.mouse.wheel(0, -900)], ['tecla Re Pág', (q) => q.keyboard.press('PageUp')]]
          : [['toque', (q) => q.evaluate(() => { window.dispatchEvent(new Event('touchstart')); window.scrollBy(0, -900); })]];
        for (const [que, accion] of acciones) {
          const p = await pagina(ctx, errores);
          informe.caso('k');
          await p.goto(`${base}/${pag}.html?ir=${ids.media}#${ciudad}`, { waitUntil: 'load' });
          /* El usuario hace scroll antes del primer reintento (0,7 s). Si los reintentos le devolvieran, la sección
             volvería a quedar arriba (top ≈ 0); si lo respetan, queda unos 900 px más abajo. Se mira la sección y no
             scrollY porque plegar.js pliega notas y la página se recoloca sola. */
          await pausa(150);
          await accion(p);
          await pausa(2600);
          const top = await p.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), ids.media);
          if (top < 400) informe.fallo('k', { pagina: pag + '.html', ciudad, pieza: `?ir=${ids.media} (${nombre}, ${que})` }, `tras hacer scroll (${que}) el reintento devuelve a la sección: queda a ${top} px del borde de arriba (debería quedar unos 900 px más abajo)`);
          await p.close();
        }
      }
      for (const e of [...new Set(errores)]) informe.fallo('k', { pagina: pag + '.html', ciudad, pieza: nombre }, e);
    } catch (e) {
      informe.fallo('k', { pagina: pag + '.html', ciudad, pieza: nombre }, 'la revisión de enlaces se ha parado: ' + String(e.message).split('\n')[0]);
    } finally { await ctx.close(); }
  });
}

/* ═══ l · el recuento de portada ═════════════════════════════════════ */

async function bloqueRecuento(browser, base) {
  const ciudad = SOLO_CIUDAD || 'getafe';
  const otra = ciudad === 'pinto' ? 'getafe' : 'pinto';
  for (const [nombre, opciones] of [['escritorio', { viewport: { width: 1280, height: 800 } }], ['móvil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(opciones);
    const errores = [];
    const p = await pagina(ctx, errores);
    const donde = (pieza) => ({ pagina: 'index.html', ciudad, pieza: `${pieza} (${nombre})` });
    try {
      await ir(p, base, 'index', ciudad);
      await pausa(500);
      const estado = (id) => p.evaluate((id) => {
        const a = document.getElementById(id);
        const b = document.querySelector(`button.rec__a[aria-controls="${id}"]`);
        return { oculta: a.hidden, expandido: b.getAttribute('aria-expanded'), fila: b.closest('.rec').dataset.abierta };
      }, id);
      const ids = await p.$$eval('#recuento .rec > .ind', (xs) => xs.map((x) => x.id));
      if (ids.length < 3) { informe.fallo('l', donde('recuento'), `solo hay ${ids.length} fichas en el recuento`); continue; }
      const boton = (id) => p.locator(`button.rec__a[aria-controls="${id}"]`);
      const [a, b, c] = [ids[0], ids[1], ids[2]];
      /* con el ratón */
      informe.caso('l');
      let s = await estado(a);
      if (!s.oculta || s.expandido !== 'false') informe.fallo('l', donde(a), `la ficha empieza abierta (aria-expanded ${s.expandido})`);
      await boton(a).click();
      s = await estado(a);
      if (s.oculta || s.expandido !== 'true' || s.fila !== '1') informe.fallo('l', donde(a), `tras el clic no queda abierta (oculta ${s.oculta}, aria-expanded ${s.expandido})`);
      await boton(a).click();
      s = await estado(a);
      if (!s.oculta || s.expandido !== 'false') informe.fallo('l', donde(a), `el segundo clic no la cierra (oculta ${s.oculta}, aria-expanded ${s.expandido})`);
      /* con el teclado: se llega con el foco, Intro abre, Espacio cierra */
      informe.caso('l');
      await boton(b).focus();
      await p.keyboard.press('Enter');
      s = await estado(b);
      if (s.oculta || s.expandido !== 'true') informe.fallo('l', donde(b), `con Intro no se abre (oculta ${s.oculta}, aria-expanded ${s.expandido})`);
      await p.keyboard.press('Space');
      s = await estado(b);
      if (!s.oculta || s.expandido !== 'false') informe.fallo('l', donde(b), `con Espacio no se cierra (oculta ${s.oculta}, aria-expanded ${s.expandido})`);
      /* fichas abiertas que se conservan al cambiar de ciudad */
      await boton(b).click();
      await boton(c).click();
      informe.caso('l');
      await p.locator('.selector__boton').first().click();
      await p.locator(`#ciudad-${otra}`).click();
      await pausa(600);
      const ahora = await p.$$eval('#recuento .rec > .ind', (xs) => xs.map((x) => ({ id: x.id, abierta: !x.hidden })));
      for (const id of [b, c]) {
        const f = ahora.find((x) => x.id === id);
        if (!f) continue;       /* esa ciudad no tiene esa ficha */
        if (!f.abierta) informe.fallo('l', donde(id), `la ficha estaba abierta y al cambiar a ${otra} se cierra`);
      }
      const cerradasQueNo = ahora.filter((x) => x.abierta && ![b, c].includes(x.id));
      if (cerradasQueNo.length) informe.fallo('l', donde('recuento'), `al cambiar de ciudad se abren fichas que no se habían abierto: ${cerradasQueNo.map((x) => x.id).join(', ')}`);
      for (const e of [...new Set(errores)]) informe.fallo('l', donde('recuento'), e);
    } catch (e) {
      informe.fallo('l', donde('recuento'), 'la revisión del recuento se ha parado: ' + String(e.message).split('\n')[0]);
    } finally { await ctx.close(); }
  }
}

/* ═══ m · las rutas de vista previa de dist/ ═════════════════════════ */

async function bloqueDist(browser) {
  const dist = join(RAIZ, 'dist');
  if (!existsSync(join(dist, 'index.html'))) {
    informe.aviso('m', { pagina: 'dist/' }, 'no hay dist/: corre `npm run build` para revisar las rutas de vista previa');
    return;
  }
  const srv = await servir(dist);
  try {
    const ciudad = SOLO_CIUDAD || 'getafe';
    const lista = (d) => (existsSync(d) ? readdirSync(d).filter((x) => existsSync(join(d, x, 'index.html'))) : []);
    const claves = lista(join(dist, ciudad));
    const fichas = claves.filter((k) => k.startsWith('ind-')).slice(0, 1).concat(claves.filter((k) => k.startsWith('ind-')).slice(-1));
    const secciones = ['espera', 'pensiones', 'comprar'].filter((k) => claves.includes(k));
    const datos = ['renta-persona', 'abono', 'metro'].filter((k) => existsSync(join(dist, 'consulta', k, 'index.html')));
    const casos = [
      ...secciones.slice(0, 3).map((k) => ['sección', `/${ciudad}/${k}/`, k]),
      ...fichas.map((k) => ['ficha', `/${ciudad}/${k}/`, k]),
      ...datos.map((k) => ['dato de consulta', `/consulta/${k}/`, k])
    ];
    if (!secciones.length || !fichas.length || !datos.length) informe.fallo('m', { pagina: 'dist/', ciudad }, `faltan rutas de vista previa en dist/ (secciones ${secciones.length}, fichas ${fichas.length}, datos ${datos.length})`);
    const unidades = [];
    for (const perfil of [{ viewport: { width: 1280, height: 800 } }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]) {
      for (const c of casos) unidades.push([perfil, c]);
    }
    await enParalelo(unidades, N, async ([perfil, [tipo, ruta, clave]]) => {
      const ctx = await browser.newContext(perfil);
      {
        const errores = [];
        const p = await pagina(ctx, errores);
        const donde = { pagina: ruta, ciudad: tipo === 'dato de consulta' ? null : ciudad, pieza: `${tipo} ${clave} (${perfil.isMobile ? 'móvil' : 'escritorio'})` };
        informe.caso('m');
        try {
          /* adónde tiene que mandar: lo dice la propia página de vista previa de dist/ */
          const html = readFileSync(join(dist, ruta, 'index.html'), 'utf8');
          const meta = /http-equiv="refresh" content="0; url=([^"]+)"/.exec(html);
          if (!meta) { informe.fallo('m', donde, 'la página de vista previa no tiene redirección'); await p.close(); await ctx.close(); return; }
          const esperado = new URL(meta[1], 'http://x' + ruta);
          const ir = esperado.searchParams.get('ir');
          await p.goto(srv.base + ruta, { waitUntil: 'load' });
          await p.waitForURL((u) => u.pathname !== ruta, { timeout: 8000 }).catch(() => {});
          await pausa(2300);
          const url = new URL(p.url());
          if (url.pathname === ruta) informe.fallo('m', donde, 'la ruta no redirige');
          else if (tipo === 'dato de consulta') {
            if (!/consulta\.html$/.test(url.pathname) || url.searchParams.get('d') !== clave) informe.fallo('m', donde, `redirige a ${url.pathname}${url.search}, no a consulta.html?d=${clave}`);
            const r = await p.evaluate(() => ({ marcados: document.querySelectorAll('.cat__item input:checked').length, resultados: document.querySelectorAll('#resultados > *').length }));
            if (r.marcados !== 1) informe.fallo('m', donde, `el dato llega con ${r.marcados} marcados en la lista`);
            if (!r.resultados) informe.fallo('m', donde, 'la página llega sin resultados');
          } else {
            /* la sección: la página de la ciudad; la ficha: la portada, que pone /<ciudad>/ en la barra */
            const llegada = tipo === 'ficha' ? ['/', `/${ciudad}/`] : [esperado.pathname];
            if (!llegada.includes(url.pathname)) informe.fallo('m', donde, `redirige a ${url.pathname}${url.search}, y se esperaba ${llegada.join(' o ')}`);
            if (!ir) informe.fallo('m', donde, 'la redirección no lleva ?ir=');
            else {
              const r = await p.evaluate(medirDestino, ir);
              if (r.falta) informe.fallo('m', donde, `llega a ${url.pathname} y el id ${ir} no existe`);
              else {
                if (!r.visible) informe.fallo('m', donde, `llega a ${url.pathname} y el título queda a ${r.titulo} px (cabecera fija ${r.fijo} px)`);
                if (r.abierta === false) informe.fallo('m', donde, 'la ficha llega cerrada');
              }
            }
          }
          for (const e of [...new Set(errores)]) informe.fallo('m', donde, e);
        } catch (e) {
          informe.fallo('m', donde, 'la revisión se ha parado: ' + String(e.message).split('\n')[0]);
        }
        await p.close();
      }
      await ctx.close();
    });
  } finally { await srv.cerrar(); }
}

/* ═══ n · los mapas en un portátil bajo ═══════════════════════════════ */

/* Alto útil de un portátil con la barra del navegador y ventanas pequeñas. En cada una, cada mapa de
   infraestructura.html tiene que verse entero a la vez que su leyenda (el de salidas, con su rótulo; la A-42,
   con su leyenda de arriba; los de transporte público, que van fijos mientras se baja, con sus pasos, nombres y
   leyenda, sin la barra del índice encima de la leyenda). Frente a frente, del mismo tamaño. En ventanas anchas y
   bajas (≥ 60rem de ancho, ≤ 50rem de alto) la leyenda de transporte público va a la derecha de los mapas, a la
   vez a la vista y sin pisarlos; 1093×520 es un portátil de 1366×650 con el zoom al 125 %. */
const VENTANAS_PORTATIL = [[1366, 650], [1280, 600], [1093, 520], [1024, 600]];

/* Se ejecuta en la página. Devuelve, por mapa, lo que ocupa respecto a la ventana. */
async function medirMapas(p) {
  return p.evaluate(async () => {
    const q = (s) => document.querySelector(s), vh = innerHeight;
    const caja = (e) => { const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, w: r.width, h: r.height }; };
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const ir = (y) => scrollTo({ top: y, behavior: 'instant' });   /* la página hace scroll suave */
    const a = (e, arriba) => { ir(scrollY + e.getBoundingClientRect().top - arriba); };
    const sal = [...document.querySelectorAll('#mapas .mapa__lienzo')];
    const out = {};
    /* el lienzo pintado: algún píxel con color */
    const pintado = (c) => { try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4000) if (d[i]) return true; } catch (e) { return false; } return false; };

    if (sal.length === 2) {
      a(sal[0].closest('.mapa'), 8); await espera(300);
      const f = sal.map((c) => caja(c)), top = caja(sal[0].closest('.mapa')).t;
      out.salidas = { arriba: top, abajo: Math.max(...f.map((x) => x.b)), ancho: f.map((x) => Math.round(x.w)), alto: f.map((x) => Math.round(x.h)), pintado: sal.every(pintado), mapa: Math.max(...f.map((x) => x.h)) };
    }
    const ley = q('#a42-ley'), m42 = q('#a42-mapa svg');
    if (ley && m42) {
      a(ley, 8); await espera(300);
      const l = caja(ley), m = caja(m42);
      out.a42 = { arriba: l.t, abajo: m.b, leyenda: l.h > 0, mapa: m.h, ancho: [Math.round(m.w)], alto: [Math.round(m.h)] };
    }
    const fijo = q('.tp__fijo');
    if (fijo) {
      const c = fijo.closest('.falla-juntos');
      ir(scrollY + c.getBoundingClientRect().top + 60);   /* ya fijo, en su sitio de arriba */
      for (let i = 0; i < 40 && !q('.tp__capas .tp__svg path'); i++) await espera(250);
      await espera(600);
      const svgs = [...document.querySelectorAll('.tp__capas .tp__svg')];
      const f = caja(fijo), l = q('#tp-ley') ? caja(q('#tp-ley')) : null, bar = q('.indice-barra[data-visible="1"]');
      const barra = bar && getComputedStyle(bar).position === 'fixed' ? Math.max(0, vh - bar.getBoundingClientRect().top) : 0;
      const vis = svgs.filter((s) => s.getBoundingClientRect().width > 0).map(caja);
      if (!vis.length) return out;
      out.tp = { arriba: f.t, leyArriba: l ? l.t : 0, leyIzq: l ? l.l : 0, mapasDer: Math.max(...vis.map((x) => x.r)), mapasAbajo: Math.max(...vis.map((x) => x.b)),
        lateral: matchMedia('(min-width: 60rem) and (max-height: 50rem)').matches,
         abajo: Math.max(f.b, l ? l.b : 0), leyendaAbajo: l ? l.b : 0, barra, leyenda: !!l && l.h > 0,
        mapa: Math.max(...vis.map((x) => x.h)), ancho: vis.map((x) => Math.round(x.w)), alto: vis.map((x) => Math.round(x.h)),
        pintado: svgs.every((s) => s.querySelectorAll('path').length > 3) };
    }
    out.vh = vh;
    return out;
  });
}

async function bloqueMapas(browser, base) {
  const ciudades = SOLO_CIUDAD ? [SOLO_CIUDAD] : CIUDADES;
  if (SOLO_PAGINA && SOLO_PAGINA !== 'infraestructura') return;
  const tareas = [];
  for (const ciudad of ciudades) for (const v of VENTANAS_PORTATIL) tareas.push([ciudad, v]);
  await enParalelo(tareas, N, async ([ciudad, [w, h]]) => {
    const donde = (pieza) => ({ pagina: 'infraestructura.html', ciudad, pieza: `${pieza}, ventana ${w}×${h}` });
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const errores = [];
    try {
      const p = await pagina(ctx, errores);
      await ir(p, base, 'infraestructura', ciudad);
      await p.waitForTimeout(1500);
      const m = await medirMapas(p);
      const nombres = { salidas: 'mapas de salida por carretera', a42: 'mapa de la A-42', tp: 'mapas de transporte público' };
      for (const k of ['salidas', 'a42', 'tp']) {
        informe.caso('n');
        const x = m[k];
        if (!x) { informe.fallo('n', donde(nombres[k]), 'no se encuentra el mapa'); continue; }
        const lim = k === 'tp' ? h - x.barra : h;
        if (x.arriba < -1) informe.fallo('n', donde(nombres[k]), `el bloque empieza a ${Math.round(x.arriba)} px: se sale por arriba`);
        if (x.abajo > lim + 1) informe.fallo('n', donde(nombres[k]), `mapa y leyenda no caben a la vez: el bloque llega a ${Math.round(x.abajo)} px y la ventana deja ${Math.round(lim)}${k === 'tp' && x.barra ? ' (con la barra del índice)' : ''}`);
        if (x.mapa > h * 0.85) informe.fallo('n', donde(nombres[k]), `el mapa mide ${Math.round(x.mapa)} px, ${Math.round(100 * x.mapa / h)} % del alto de la ventana (máximo 85 %)`);
        if (k !== 'salidas' && !x.leyenda) informe.fallo('n', donde(nombres[k]), 'la leyenda no se ve');
        if (k === 'tp' && x.leyenda) {
          if (x.leyArriba < -1) informe.fallo('n', donde(nombres[k]), `la leyenda empieza a ${Math.round(x.leyArriba)} px: se sale por arriba`);
          if (x.lateral && x.leyIzq < x.mapasDer - 1) informe.fallo('n', donde(nombres[k]), 'la leyenda debería ir a la derecha de los mapas y los pisa');
          if (!x.lateral && x.leyArriba < x.mapasAbajo - 1) informe.fallo('n', donde(nombres[k]), 'la leyenda debería ir debajo de los mapas y los pisa');
        }
        if (x.pintado === false) informe.fallo('n', donde(nombres[k]), 'el mapa está en blanco');
        if (Math.max(...x.ancho) - Math.min(...x.ancho) > 1 || Math.max(...x.alto) - Math.min(...x.alto) > 1) informe.fallo('n', donde(nombres[k]), `los mapas de Parla y ${ciudad} no miden lo mismo (anchos ${x.ancho.join('/')}, altos ${x.alto.join('/')})`);
      }
      for (const e of [...new Set(errores)]) informe.fallo('n', donde('consola'), e);
    } catch (e) {
      informe.fallo('n', donde('revisión'), 'la revisión de mapas se ha parado: ' + String(e.message).split('\n')[0]);
    }
    await ctx.close();
  });
}

/* ═══ Todo junto ═════════════════════════════════════════════════════ */

const NOMBRES = { i: 'i  carteles (papel y barrio)', j: 'j  páginas: escritorio, móvil, claro, oscuro', k: 'k  enlaces ?ir=', l: 'l  recuento de portada', m: 'm  rutas de vista previa (dist/)', n: 'n  mapas en un portátil bajo' };
const T0 = Date.now();
const servidor = await servir(RAIZ);
let navegador;
try {
  navegador = await chromium.launch();
} catch (e) {
  await servidor.cerrar();
  console.error('Chromium no arranca: ' + String(e.message).split('\n')[0] + '\n  Instálalo con:  npx playwright install chromium');
  process.exit(2);
}
console.log(`Revisión con Chromium: ${PAGINAS.length} páginas × ${CIUDADES.length} ciudades, bloques ${BLOQUES.join(', ')}, ${N} a la vez.`);
try {
  const hacer = { i: () => bloqueCarteles(navegador, servidor.base), j: () => bloquePaginas(navegador, servidor.base),
    k: () => bloqueEnlaces(navegador, servidor.base), l: () => bloqueRecuento(navegador, servidor.base), m: () => bloqueDist(navegador), n: () => bloqueMapas(navegador, servidor.base) };
  for (const b of BLOQUES) {
    if (!hacer[b]) { console.error('Bloque desconocido: ' + b); continue; }
    const t = Date.now();
    await hacer[b]();
    tiemposBloque[b] = (Date.now() - t) / 1000;
    const f = informe.fallos.filter((x) => x.b === b).length;
    console.log(`  ${f ? '✗' : '✓'} ${NOMBRES[b].padEnd(46)} ${String(informe.casos[b] || 0).padStart(6)} casos${f ? `, ${f} fallos` : ''}  (${tiemposBloque[b].toFixed(0)} s)`);
  }
} finally {
  await navegador.close();
  await servidor.cerrar();
}
const segundos = ((Date.now() - T0) / 1000).toFixed(0);
if (informe.avisos.length) console.log('\nAvisos:\n  ' + informe.avisos.map((x) => x.texto).join('\n  '));
if (informe.fallos.length) {
  const LIMITE = process.env.REVISAR_COMPLETO ? Infinity : 150;
  console.error(`\n${informe.fallos.length} fallos (${segundos} s):\n  ` + informe.fallos.slice(0, LIMITE).map((x) => x.texto).join('\n  ') +
    (informe.fallos.length > LIMITE ? `\n  … y ${informe.fallos.length - LIMITE} más (REVISAR_COMPLETO=1 para verlos todos)` : ''));
  process.exit(1);
}
console.log(`\nBien. Revisión completa en ${segundos} s.`);

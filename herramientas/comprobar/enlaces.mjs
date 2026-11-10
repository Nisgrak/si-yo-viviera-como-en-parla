/* (g) Enlaces: todo `href="#…"` y todo destino `?ir=` que genera la página (los botones de cadena, los de
   «Compartir esta sección» y los enlaces entre páginas) apunta a un id que existe en esa página y ciudad;
   toda fuente citada tiene URL https. Los destinos se recogen al abrir cada página y se comprueban al final,
   cuando se conocen los ids de todas. */
import { plano } from './comun.mjs';

const PAGINA_DE = (ruta) => { const p = ruta.split('/').filter(Boolean).pop() || ''; return /\.html$/.test(p) ? p : p ? p + '.html' : 'index.html'; };

export async function recogerEnlaces({ doc, win, pagina, ciudad, ciudades, reg }) {
  const clave = pagina + '#' + ciudad;
  reg.ids[clave] = new Set([...doc.querySelectorAll('[id]')].map((e) => e.id));

  /* Los href. */
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:|javascript:)/.test(href)) return;
    const u = new URL(href, 'http://x/' + pagina);
    const destino = u.pathname === '/' + pagina || href.startsWith('#') ? pagina : PAGINA_DE(u.pathname);
    const ir = u.searchParams.get('ir');
    const hash = decodeURIComponent(u.hash.replace('#', ''));
    const id = ir || (hash && !ciudades.includes(hash) ? hash : '');
    if (destino === 'consulta.html') { reg.consulta.push({ pagina, ciudad, texto: plano(a.textContent).slice(0, 40), d: u.searchParams.get('d'), href }); }
    if (!id) return;
    reg.enlaces.push({ pagina, ciudad, destino, id, de: 'enlace «' + plano(a.textContent).slice(0, 40) + '»', ciudadDestino: ciudad });
  });

  /* Los botones que copian una dirección: se pulsan y se lee lo que copiarían. */
  win.__urls = [];
  const botones = [...doc.querySelectorAll('button.cadena, button.compartir')].filter((b) => !/^Cartel/.test(plano(b.textContent)));
  const cuales = [];
  for (const b of botones) {
    const antes = win.__urls.length;
    b.click();
    cuales.push([b, antes]);
  }
  await new Promise((r) => setTimeout(r, 5));     /* la cadena copia con una promesa */
  const titulo = (b) => b.classList.contains('cadena') ? 'cadena de «' + plano((b.closest('h2,h3,h4') || b.parentElement).textContent).slice(0, 40) + '»' : plano(b.textContent);
  for (const u of win.__urls) {
    const url = new URL(u);
    const destino = PAGINA_DE(url.pathname);
    const ir = url.searchParams.get('ir');
    const c = decodeURIComponent(url.hash.replace('#', ''));
    reg.enlaces.push({ pagina, ciudad, destino, id: ir, de: 'dirección copiada (' + (u.length > 80 ? u.slice(-60) : u) + ')', ciudadDestino: c, copiado: true });
  }
  reg.copiados += win.__urls.length;
}

/* Al final: cada destino existe. */
export function comprobarEnlaces({ reg, informe, consulta }) {
  for (const e of reg.enlaces) {
    informe.caso('g');
    const donde = { pagina: e.pagina, ciudad: e.ciudad, pieza: e.id || '(sin ?ir=)' };
    if (e.copiado && !e.id) { informe.fallo('g', donde, `${e.de} no lleva ?ir=`); continue; }
    if (e.copiado && e.ciudadDestino !== e.ciudad) informe.fallo('g', donde, `${e.de} lleva a otra ciudad (#${e.ciudadDestino})`);
    const ids = reg.ids[e.destino + '#' + e.ciudad];
    if (!ids) continue;      /* consulta.html y lo que no se abre por ciudad */
    if (!ids.has(e.id)) informe.fallo('g', donde, `${e.de} apunta a #${e.id}, que no existe en ${e.destino}`);
  }
  for (const c of reg.consulta) {
    if (!c.d) continue;
    informe.caso('g');
    for (const id of c.d.split(',')) {
      if (!consulta.POR_ID[id]) informe.fallo('g', { pagina: c.pagina, ciudad: c.ciudad, pieza: c.texto }, `el enlace a «Todos los datos» pide el dato «${id}», que no está en el catálogo`);
    }
  }
}

/* Toda fuente citada en los datos tiene una URL https. */
export function comprobarFuentes({ globales, consulta, informe }) {
  const url = (f) => (typeof f === 'string' ? f : Array.isArray(f) ? f[1] : f && f.url);
  for (const [nombre, g] of Object.entries(globales)) {
    const fs = g && g.fuentes;
    if (!fs || typeof fs !== 'object') continue;
    for (const [id, f] of Object.entries(fs)) {
      informe.caso('g');
      const u = url(f);
      if (!u || !/^https:\/\/[^\s]+$/.test(u)) informe.fallo('g', { pagina: 'datos/*.js', pieza: nombre + '.fuentes.' + id }, `la fuente no tiene URL https (${u || 'sin URL'})`);
    }
  }
  for (const d of consulta.CAT) {
    informe.caso('g');
    if (!d.fuente) informe.fallo('c', { pagina: 'consulta.html', pieza: d.id }, 'el dato del catálogo no tiene fuente, y su vista previa la lleva en el pie');
    else if (!/^https:\/\/[^\s]+$/.test(d.fuente[1] || '')) informe.fallo('g', { pagina: 'consulta.html', pieza: d.id }, `la fuente del dato no tiene URL https (${d.fuente[1] || 'sin URL'})`);
  }
}

/* (g, h) Cada página de vista previa que escribe compartir.mjs manda a una sección con ?ir=: ese id tiene
   que existir en la página de destino, para esa ciudad. */
export function comprobarRedirecciones({ paginas, reg, informe, consulta, leer, parcial }) {
  for (const p of paginas) {
    const html = leer(p.ruta);
    const m = /http-equiv="refresh" content="0; url=([^"]+)"/.exec(html);
    if (!m) continue;
    informe.caso('g');
    const donde = { pagina: (p.ciudad ? p.ciudad + '/' : '') + p.clave + '/', ciudad: p.ciudad, pieza: p.clave };
    const base = new URL(p.ciudad ? `http://x/${p.ciudad}/${p.clave}/` : `http://x/${p.clave}/`);
    const u = new URL(m[1], base);
    if (u.pathname === '/consulta.html') {
      for (const id of (u.searchParams.get('d') || '').split(',').filter(Boolean)) {
        if (!consulta.POR_ID[id]) informe.fallo('g', donde, `la vista previa manda a un dato que no existe: ${id}`);
      }
      continue;
    }
    const partes = u.pathname.split('/').filter(Boolean);
    const ciudad = p.ciudad || decodeURIComponent(u.hash.replace('#', ''));
    const destino = partes.length === 0 ? 'index.html' : partes.length === 1 ? partes[0] + '.html' : partes[1] + '.html';
    const id = u.searchParams.get('ir');
    const ids = reg.ids[destino + '#' + ciudad];
    if (!ids) { if (id && !parcial) informe.fallo('g', donde, `la vista previa manda a ${m[1]}: no hay página ${destino} para ${ciudad}`); continue; }
    if (id && !ids.has(id)) informe.fallo('g', donde, `la vista previa manda a ${destino}?ir=${id} y ese id no existe en la página de ${ciudad}`);
  }
}

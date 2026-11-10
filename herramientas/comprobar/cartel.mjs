/* Los carteles, vistos desde jsdom. Pulsa cada «Cartel para compartir» de la página (jsdom no tiene
   diálogo, así que el cartel se monta directamente) y lee lo que ha escrito en #cartel. Con eso mira, por
   cada cartel y ciudad:
     (b) que su cifra grande es la de la vista previa (la imagen y la descripción og) y la de la pantalla;
     (c) que enseña a Parla y a la otra ciudad en dos columnas, con el rojo solo en la de Parla, solo donde el
         dato tiene sentido marcado y a Parla le va peor, y sin la línea «por ciento»;
     (d) que no hay columna vacía ni «undefined», «NaN», «null», «Infinity»;
     (f) que su texto no lleva antítesis ni nombres de fichero.
   La forma en pantalla (que nada se salga ni se pise) la mira `npm run revisar`, con un navegador. */
import { UNA_CIFRA, CLAVE_DE_PIEZA, SENTIDO_DE_PIEZA } from './excepciones.mjs';
import { aparece, numero, plano, sinUnidad, textoRoto } from './comun.mjs';
import { antitesis, ficheroVisible } from './texto.mjs';

const texto = (e) => plano(e.textContent);
/* El texto de un trozo de página con un espacio entre elementos, para que «16.871» y «69,8 %», que son
   dos elementos, no se lean como un solo número. */
function textoSeparado(e) {
  const partes = [];
  const w = e.ownerDocument.createTreeWalker(e, 4);
  let n;
  while ((n = w.nextNode())) { const t = n.textContent.trim(); if (t) partes.push(t); }
  return partes.join(' ').replace(/\u00a0|\u202f/g, ' ');
}

/* Lo que enseña el cartel montado. */
export function leerCartel(c) {
  const t = (s) => [...c.querySelectorAll(s)].map(texto);
  const cols = [...c.querySelectorAll('.ktit__col')].map((col) => ({
    quien: texto(col.querySelector('.ktit__a') || col),
    n: texto(col.querySelector('.ktit__n') || col),
    rojo: !!col.querySelector('.ktit__n--rojo')
  }));
  return {
    cols, texto: texto(c), pre: t('.kpre')[0] || '', antes: t('.ktit > .ktit__a'), q: t('.ktit__q'), fin: t('.ktit__m'),
    sub: t('.ksub')[0] || '', cajas: [...c.querySelectorAll('.kcaja')].map((x) => ({ q: texto(x.querySelector('b') || { textContent: '' }), v: texto(x) })),
    unica: t('.ktit > .ktit__n')
  };
}

/* El sentido (mas / menos) de la pieza. Primero, el de los títulos marcados (data-sentido) de lo más cercano
   que los tenga alrededor del botón; si ahí hay de los dos sentidos, el del título más cercano por encima del
   botón, dentro de su sección (si lo más cercano es un título sin marca, el dato no tiene sentido: null). */
function sentidoDe(boton, id, win) {
  if (id.startsWith('ind-')) return (win.SENTIDO && win.SENTIDO.de(id.slice(4))) || null;
  const fijo = SENTIDO_DE_PIEZA[id.replace(/-botones$/, '')];
  if (fijo) return fijo[0];
  const doc = boton.ownerDocument;
  for (let e = boton.parentElement; e && e !== doc.body; e = e.parentElement) {
    const marcados = [...e.querySelectorAll('[data-sentido]')].map((x) => x.getAttribute('data-sentido'));
    if (e.hasAttribute('data-sentido')) marcados.push(e.getAttribute('data-sentido'));
    const distintos = [...new Set(marcados)];
    if (distintos.length === 1) return distintos[0];
    if (distintos.length > 1) break;
  }
  const sec = boton.closest('[data-indice]');
  let ultimo = null;
  for (const t of doc.querySelectorAll('h1, h2, h3, h4, [data-sentido]')) {
    if (sec && !sec.contains(t)) continue;
    if (!(boton.compareDocumentPosition(t) & 2 /* t precede al botón */) || t.contains(boton)) continue;
    ultimo = t;
  }
  return (ultimo && ultimo.getAttribute('data-sentido')) || null;
}

export function auditarCarteles({ doc, win, pagina, ciudad, previas, informe, sinFuente }) {
  const botones = [...doc.querySelectorAll('button.compartir')].filter((b) => /Cartel/.test(b.textContent));
  for (const b of botones) {
    const cont = b.closest('[id]');
    const id = cont ? cont.id : '(sin id)';
    const donde = { pagina, ciudad, pieza: id.replace(/-botones$/, '') };
    b.click();
    const raiz = doc.getElementById('cartel');
    if (!raiz || !raiz.querySelector('.ktit')) { informe.fallo('b', donde, 'el cartel no se monta al pulsar el botón'); continue; }
    const k = leerCartel(raiz);
    const clave = CLAVE_DE_PIEZA[id.replace(/-botones$/, '')] || id.replace(/-botones$/, '');
    const esFicha = id.startsWith('ind-');
    const pz = !esFicha && previas.piezas[clave] ? previas.piezas[clave][ciudad] : null;
    const ficha = esFicha ? previas.fichas.find((f) => f.ciudad === ciudad && f.clave === id) : null;

    /* (d) sin columnas vacías ni palabras de programador */
    informe.caso('d');
    const roto = textoRoto(k.texto);
    if (roto) informe.fallo('d', donde, `el cartel dice «${roto}»`);
    for (const x of k.cols) {
      if (!sinUnidad(x.n) || !x.quien) informe.fallo('d', donde, `columna vacía en el cartel (${x.quien || '?'}: «${x.n}»)`);
      else if (/^[—–-]$/.test(sinUnidad(x.n))) informe.fallo('d', donde, `«${x.n}» suelto como cifra en la columna de ${x.quien}`);
    }
    if (!k.cols.length && !k.unica.every((x) => sinUnidad(x))) informe.fallo('d', donde, 'cartel sin cifra');

    /* (c) la forma */
    informe.caso('c');
    const sola = !!pz && pz.b == null;
    if (k.cols.length !== 2 && !UNA_CIFRA[id] && !sola) {
      informe.fallo('c', donde, `el cartel no está frente a frente (${k.cols.length} columnas) y no es una de las excepciones`);
    }
    if (sola) {
      informe.caso('d');
      if (!k.sub && !k.q.length && !k.fin.length) informe.fallo('d', donde, 'cartel «Parla sola» sin su motivo');
      if (k.cols.length === 2) informe.fallo('b', donde, 'el cartel compara y la vista previa dice «Parla sola»');
    }
    if (k.q.concat(k.fin, k.antes).some((x) => /por ciento/i.test(x))) {
      informe.fallo('c', donde, 'el cartel lleva la línea «por ciento»: el % va en la cifra');
    }
    const rojas = k.cols.filter((x) => x.rojo);
    if (rojas.length) {
      informe.caso('c');
      const parla = k.cols[0];
      if (!parla || !parla.rojo || rojas.length > 1 || parla.quien !== 'Parla') {
        informe.fallo('c', donde, `el rojo no está solo en la columna de Parla (rojo en: ${rojas.map((x) => x.quien).join(', ')})`);
      } else {
        const s = sentidoDe(b, id, win);
        const a = numero(k.cols[0].n), o = numero(k.cols[1] && k.cols[1].n);
        if (s !== 'mas' && s !== 'menos') informe.fallo('c', donde, `Parla sale en rojo y el dato no tiene sentido marcado (${s || 'ninguno'}): assets/sentido.js`);
        else if (a == null || o == null || (s === 'mas' ? !(a < o) : !(a > o))) {
          informe.fallo('c', donde, `Parla sale en rojo y no le va peor (${k.cols[0].n} frente a ${k.cols[1] && k.cols[1].n}, ${s === 'mas' ? 'cuanto más, mejor' : 'cuanto menos, mejor'})`);
        }
      }
    }

    /* (f) texto público */
    informe.caso('f');
    for (const h of antitesis(k.texto)) informe.fallo('f', donde, `antítesis en el cartel: «${h}»`);
    const fich = ficheroVisible(k.texto);
    if (fich) informe.fallo('f', donde, `nombre de fichero en el cartel: «${fich}»`);
    if (/pensiones/.test(id) && /jubilaci[oó]n/i.test(k.texto)) informe.fallo('f', donde, 'el cartel de las pensiones dice «jubilación»');

    /* la fuente: la lleva una caja del cartel («Fuente»). */
    if (!/Fuente/i.test(k.texto)) (sinFuente[id.replace(/-botones$/, '')] = sinFuente[id.replace(/-botones$/, '')] || new Set()).add(ciudad);

    /* (h) «Compartir esta sección» lleva a /<ciudad>/<clave>/: esa página tiene que existir en el build */
    const conEnlace = [...b.parentElement.children].some((x) => /^Compartir esta/.test(plano(x.textContent)));
    if (conEnlace && !previas.og(ciudad, clave)) {
      informe.fallo('h', donde, `«Compartir esta sección» lleva a /${ciudad}/${clave}/ y el build no escribe esa página (previa() devuelve null)`);
    }

    /* (b) las tres cifras */
    const sec = b.closest('article.ind, [data-indice-sub], [data-indice]');
    const pantalla = sec ? textoSeparado(sec) : '';
    if (k.cols.length === 2 && !UNA_CIFRA[id]) {
      const [A, B] = k.cols.map((x) => x.n);
      informe.caso('b');
      if (pz) {
        if (sinUnidad(A) !== sinUnidad(pz.a)) informe.fallo('b', donde, `la cifra de Parla en el cartel (${A}) no es la de la vista previa (${pz.a})`);
        if (pz.b != null && sinUnidad(B) !== sinUnidad(pz.b)) informe.fallo('b', donde, `la cifra de ${k.cols[1].quien} en el cartel (${B}) no es la de la vista previa (${pz.b})`);
        const p = previas.og(ciudad, clave);
        if (p) {
          const desc = p.description || '';
          for (const [q, v] of [['Parla', pz.a], [k.cols[1].quien, pz.b]]) {
            /* un cero se puede decir con palabras: «no hay ninguna» */
            if (v != null && !aparece(desc, v) && !(String(v) === '0' && /ning[uú]n|no (?:hay|tiene|llega)|sin /i.test(desc))) informe.fallo('b', donde, `la descripción de la vista previa no lleva la cifra de ${q} (${v}): «${desc.slice(0, 120)}»`);
          }
        } else informe.fallo('b', donde, 'no hay página de vista previa para esta pieza');
      } else if (!esFicha) {
        informe.fallo('b', donde, 'el cartel existe pero no hay vista previa de esta pieza en esta ciudad (previa() devuelve null)');
      }
      if (!esFicha && sec) {
        for (const [x, c] of [[A, 'Parla'], [B, k.cols[1].quien]]) {
          if (aparece(pantalla, x)) continue;
          /* ¿Sale en pantalla con otro redondeo? (el cartel dice 458 y la página, 457,77) */
          const v = numero(x);
          const otro = v != null && (pantalla.match(/[−-]?\d[\d.]*(?:,\d+)?/g) || []).some((t) => { const u = numero(t); return u != null && u !== v && Math.abs(u - v) < 1 && Math.round(u) === v; });
          if (otro) informe.fallo('b', donde, `el cartel y la vista previa redondean la cifra de ${c} (${x}) y la pieza en pantalla la enseña con decimales`);
          else informe.fallo('b', donde, `la cifra de ${c} del cartel (${x}) no sale en la pieza de la pantalla`);
        }
      }
      if (esFicha) auditarFicha({ k, ficha, sec, donde, informe, og: previas.og(ciudad, id) });
    }
  }
}

/* Una ficha del recuento: el cartel lleva en grande cuántas hay y en las cajas la tasa de la ficha; la imagen
   enseña la tasa. Tres sitios, una cifra cada uno: el cartel, la imagen y la ficha en pantalla. */
function auditarFicha({ k, ficha, sec, donde, informe, og }) {
  if (!ficha) { informe.fallo('b', donde, 'ficha sin vista previa en el build'); return; }
  const oculto = sec && sec.querySelector('.oculto') ? texto(sec.querySelector('.oculto')) : '';
  const m = /^Parla tiene (.+?) y (.+?) tiene (.+?)\. Medido/.exec(oculto);
  /* Zonas verdes: la ficha cuenta en km² y el cartel en metros cuadrados por habitante, como su columna. */
  if (m && /km²|ha$/.test(m[1])) {
    const tp = sec ? [...sec.querySelectorAll('.tasa__valor')].map(texto) : [];
    k.cols.forEach((c, i) => { if (tp[i] != null && numero(c.n) !== numero(tp[i])) informe.fallo('b', donde, `el cartel dice ${c.n} para ${c.quien} y la ficha en pantalla ${tp[i]} por habitante`); });
  } else if (m) {
    for (const [i, v] of [[0, m[1]], [1, m[3]]]) {
      if (sinUnidad(k.cols[i].n) !== sinUnidad(v)) informe.fallo('b', donde, `el cartel dice ${k.cols[i].n} para ${k.cols[i].quien} y la ficha en pantalla, ${v}`);
    }
  }
  const tasa = (q) => { const c = k.cajas.find((x) => x.q === q); const t = c && /^[A-Za-zÀ-ÿ ]*?([−-]?[\d.]+(?:,\d+)?)/.exec(c.v.replace(q, '').trim()); return t ? t[1] : null; };
  const [ta, to] = [tasa('Parla'), tasa(k.cols[1].quien)];
  if (ficha.ley && ficha.ley !== 'Unidades asistenciales que se comparan' && ta != null) {
    if (ta !== ficha.parla) informe.fallo('b', donde, `la tasa de Parla en el cartel (${ta}) no es la de la imagen (${ficha.parla})`);
    if (to !== ficha.otra) informe.fallo('b', donde, `la tasa de ${k.cols[1].quien} en el cartel (${to}) no es la de la imagen (${ficha.otra})`);
  }
  const titular = sec && sec.querySelector('.ind__titular') ? texto(sec.querySelector('.ind__titular')) : '';
  if (titular && plano(ficha.linea) !== titular) informe.fallo('b', donde, `el titular de la ficha («${titular}») no es el de la imagen («${plano(ficha.linea)}»)`);
  const desc = og ? og.description || '' : '';
  if (ficha.ley !== 'Unidades asistenciales que se comparan') {
    for (const [q, v] of [['Parla', ficha.parla], [k.cols[1].quien, ficha.otra]]) {
      if (!aparece(desc, v)) informe.fallo('b', donde, `la descripción de la vista previa no lleva la cifra de ${q} (${v})`);
    }
  }
  const tasasPantalla = sec ? [...sec.querySelectorAll('.tasa__valor')].map(texto) : [];
  if (tasasPantalla.length === 2 && (tasasPantalla[0] !== ficha.parla || tasasPantalla[1] !== ficha.otra)) {
    informe.fallo('b', donde, `la imagen dice ${ficha.parla} y ${ficha.otra} y la ficha en pantalla ${tasasPantalla.join(' y ')}`);
  }
}

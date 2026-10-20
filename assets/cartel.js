/* ═══════════════════════════════════════════════════════════════════════
   EL CARTEL DE LAS OTRAS PÁGINAS · economía e infraestructuras
   El mismo A4 que el de la portada (estilos .cartel y .k* de estilos.css,
   los dos fondos de assets/cartel/ y el QR de assets/qr.js), pero con el
   dato que le pase cada página: una frase de entrada, la cifra grande, lo
   que mide en rojo y dos o tres cajas con las cifras que la explican.
   La portada sigue con el suyo, en app.js, que sabe del recuento.

   Uso:
     CARTEL.boton({ titulo, id, ciudad, datos: function () {
       return { pre, cifra, que, fin, cajas: [{ q, v, ref }] };
     } })
   devuelve el botón «Cartel para compartir»; el dato se calcula al pulsar,
   con la ciudad elegida en ese momento.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /* Los fondos, precargados: una imagen a medio cargar saldría en blanco. La
     ruta se resuelve al cargar, antes de que la barra pase a /getafe/…/. */
  const FONDOS = ['papel', 'barrio'];
  const ROTULO_FONDO = { papel: 'Papel', barrio: 'El barrio' };
  const RUTA = new URL('assets/cartel/', document.baseURI).href;
  FONDOS.forEach(function (f) { (new Image()).src = RUTA + f + '.jpg'; });

  function fondoElegido() {
    try {
      const g = localStorage.getItem('fondo');
      if (FONDOS.indexOf(g) >= 0) return g;
    } catch (e) { /* sin almacenamiento: el de siempre */ }
    return FONDOS[0];
  }

  function hoja() {
    let r = document.getElementById('cartel');
    if (!r) {
      r = el('div', 'cartel');
      r.id = 'cartel';
      r.setAttribute('aria-hidden', 'true');
      document.body.appendChild(r);
    }
    return r;
  }

  function qr(ciudad) {
    const q = (window.QR || {})[ciudad] || (window.QR || {})._;
    if (!q) return null;
    const caja = el('div', 'kqr');
    const lado = q.n + 8;
    caja.innerHTML = '<svg viewBox="-4 -4 ' + lado + ' ' + lado + '" role="img" aria-label="Código QR a ' +
      esc(q.url) + '"><rect x="-4" y="-4" width="' + lado + '" height="' + lado + '" fill="#fff"/>' +
      '<path d="' + q.d + '" fill="#161616"/></svg>';
    return caja;
  }

  function montar(d, ciudad, fondo) {
    const raiz = hoja();
    while (raiz.firstChild) raiz.removeChild(raiz.firstChild);
    raiz.className = 'cartel cartel--afiche';
    raiz.setAttribute('data-fondo', fondo);
    const img = el('img', 'kfondo');
    img.src = RUTA + fondo + '.jpg';
    img.alt = '';
    raiz.appendChild(img);

    const capa = el('div', 'kcapa');
    capa.appendChild(el('p', 'kpre', esc(d.pre)));
    const tit = el('h1', 'ktit');
    tit.appendChild(el('span', 'ktit__n', esc(d.cifra)));
    tit.appendChild(el('span', 'ktit__q', esc(d.que)));
    if (d.fin) tit.appendChild(el('span', 'ktit__m', esc(d.fin)));
    capa.appendChild(tit);
    const fila = el('ul', 'kcajas');
    d.cajas.forEach(function (c) {
      fila.appendChild(el('li', 'kcaja' + (c.ref ? ' kcaja--ref' : ''), '<b>' + esc(c.q) + '</b>' + esc(c.v)));
    });
    fila.dataset.n = String(d.cajas.length);
    capa.appendChild(fila);
    raiz.appendChild(capa);

    const banda = el('div', 'kbanda');
    const q = qr(ciudad);
    if (q) banda.appendChild(q);
    const txt = el('div', 'kbanda__txt');
    txt.appendChild(el('p', 'kbanda__h', 'Si yo viviera<br>como en Parla'));
    txt.appendChild(el('span', 'kbanda__raya'));
    txt.appendChild(el('p', 'kbanda__url', 'siyovivieracomoenparla.netlify.app'));
    banda.appendChild(txt);
    raiz.appendChild(banda);
    ajustar(raiz, tit, fondo);
  }

  /* El mayor cuerpo de titular que cabe: ninguna palabra más ancha que la
     hoja, y el bloque por encima del suelo de cada fondo (en «papel», la
     banda del pie; en «barrio», el tejado de la foto). Como en app.js. */
  const SUELO = { papel: 231, barrio: 130 };
  function ajustar(raiz, tit, fondo) {
    raiz.classList.add('midiendo');
    const capa = raiz.querySelector('.kcapa');
    const cajas = raiz.querySelector('.kcajas');
    const marco = raiz.getBoundingClientRect();
    const mm = marco.height / 297;
    const ancho = tit.clientWidth;
    const manda = fondo === 'barrio' ? tit : (cajas || tit);
    const tope = marco.top + (SUELO[fondo] || SUELO.papel) * mm;
    const regla = el('span');
    regla.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;' +
      'font-weight:800;font-stretch:62%;letter-spacing:-.035em;text-transform:uppercase;';
    regla.style.fontFamily = getComputedStyle(tit).fontFamily;
    capa.appendChild(regla);
    const palabras = [];
    tit.querySelectorAll('span').forEach(function (sp) {
      const e = sp.classList.contains('ktit__n') ? 1.35 : 1;
      sp.textContent.split(/\s+/).forEach(function (w) { if (w) palabras.push({ t: w, e: e }); });
    });
    let pt = 160;
    for (; pt > 28; pt -= 2) {
      let cabe = true;
      for (let k = 0; k < palabras.length; k++) {
        regla.style.fontSize = (pt * palabras[k].e) + 'pt';
        regla.textContent = palabras[k].t;
        if (regla.offsetWidth > ancho) { cabe = false; break; }
      }
      if (!cabe) continue;
      tit.style.fontSize = pt + 'pt';
      if (manda.getBoundingClientRect().bottom <= tope) break;
    }
    tit.style.fontSize = pt + 'pt';
    capa.removeChild(regla);
    raiz.classList.remove('midiendo');
  }

  function imprimir(op) {
    const d = op.datos();
    montar(d, op.ciudad(), fondoElegido());
    const antes = document.title;
    document.title = op.titulo();      /* el nombre que el navegador propone para el PDF */
    document.documentElement.setAttribute('data-cartel', op.id);
    let limpio = false;
    function limpiar() {
      if (limpio) return;
      limpio = true;
      document.documentElement.removeAttribute('data-cartel');
      document.title = antes;
      window.removeEventListener('afterprint', limpiar);
    }
    window.addEventListener('afterprint', limpiar);
    window.print();
    setTimeout(limpiar, 1500);   /* Safari no siempre dispara afterprint */
  }

  let pendiente = null;
  function dialogo() {
    let d = document.getElementById('elige-fondo');
    if (d) return d;
    d = el('dialog', 'fondos');
    d.id = 'elige-fondo';
    d.appendChild(el('h2', 'fondos__h', 'Elige el cartel'));
    d.appendChild(el('p', 'fondos__p', 'Se abrirá el diálogo de impresión: elige ' +
      '«Guardar como PDF» para quedártelo, o imprime directamente en A4.'));
    const fila = el('div', 'fondos__fila');
    FONDOS.forEach(function (f) {
      const b = el('button', 'fondo');
      b.type = 'button';
      b.dataset.fondo = f;
      const im = el('img');
      im.src = RUTA + f + '.jpg';
      im.alt = '';
      b.appendChild(im);
      b.appendChild(el('span', 'fondo__n', ROTULO_FONDO[f]));
      b.addEventListener('click', function () {
        try { localStorage.setItem('fondo', f); } catch (e) { /* da igual */ }
        d.close();
        if (pendiente) imprimir(pendiente);
      });
      fila.appendChild(b);
    });
    d.appendChild(fila);
    const cerrar = el('button', 'fondos__x', 'Cancelar');
    cerrar.type = 'button';
    cerrar.addEventListener('click', function () { d.close(); });
    d.appendChild(cerrar);
    document.body.appendChild(d);
    return d;
  }

  /* El mismo icono que el botón de la portada (TRAZOS.descarga, en app.js). */
  const DESCARGA = '<span class="compartir__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 3.4v11.2"/><path d="M7.6 10.4 12 14.8l4.4-4.4"/>' +
    '<path d="M4.2 16.6v2.6a1.4 1.4 0 0 0 1.4 1.4h12.8a1.4 1.4 0 0 0 1.4-1.4v-2.6"/></svg></span>';

  function boton(op) {
    const b = el('button', 'compartir', DESCARGA + '<span>Cartel para compartir</span>');
    b.type = 'button';
    b.title = 'Genera un cartel A4 con este dato, listo para imprimir o guardar en PDF';
    b.addEventListener('click', function () {
      pendiente = op;
      const d = dialogo();
      const elegido = fondoElegido();
      d.querySelectorAll('.fondo').forEach(function (x) { x.dataset.activo = x.dataset.fondo === elegido ? '1' : '0'; });
      if (d.showModal) d.showModal(); else imprimir(op);
    });
    return b;
  }

  window.CARTEL = { boton: boton };
})();

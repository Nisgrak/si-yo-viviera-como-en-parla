/* ═══════════════════════════════════════════════════════════════════════
   EL ÍNDICE · para no perderse entre secciones
   Lo usan todas las páginas. No lleva nada escrito a mano: lo lee de la
   página.
     - Una sección entra si lleva data-indice="Título corto" y un id. Si
       lleva data-indice-dato, la cifra sale a su lado (data-indice-tono:
       loss o gain, para el color).
     - Dentro de una sección, cualquier elemento con data-indice-sub y un id
       es un apartado (las áreas de «Lo que perderías», por ejemplo).
     - Un elemento con data-indice-ancho ocupa también los márgenes: mientras
       está en pantalla, el índice lateral se aparta.
     - Las otras páginas de la web van en PAGINAS, aquí abajo. Para añadir
       una: una línea aquí, su id en <body data-pagina> y su ruta en
       herramientas/compartir.mjs.
   Con sitio en el margen izquierdo, el índice va fijo ahí. Sin sitio (en el
   móvil, sobre todo), una barra abajo dice dónde estás y abre una hoja con
   todo. Los enlaces no tocan la dirección: el #getafe elige la ciudad.
   Cada página llama a INDICE.refrescar() cuando se vuelve a pintar.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const PAGINAS = [
    { id: 'recuento', titulo: function (n) { return 'El recuento de ' + n; }, ruta: '', archivo: 'index.html' },
    { id: 'infraestructura', titulo: function () { return 'Salir en coche'; },
      ruta: 'infraestructura/', archivo: 'infraestructura.html' },
    { id: 'vivienda', titulo: function () { return 'Vivienda'; },
      ruta: 'vivienda/', archivo: 'vivienda.html' },
    { id: 'economia', titulo: function () { return 'Economía'; },
      ruta: 'economia/', archivo: 'economia.html' }
  ];

  const RAIL_REM = 15.5;    /* lo que necesita el índice lateral, con su aire */
  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const RAIZ = new URL('.', document.baseURI).pathname;
  const PAGINA = document.body.getAttribute('data-pagina');
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ciudad = null, nombre = '';
  let secciones = [];
  let activa = -1, activaSub = null;

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  const FLECHA = '<svg width="14" height="11" viewBox="0 0 16 12" fill="none" aria-hidden="true">' +
    '<path d="M1 6h13M9.5 1l5 5-5 5" stroke="currentColor" stroke-width="1.7"/></svg>';

  /* ── Lo fijo: el lateral, la barra de abajo y la hoja ───────────────── */

  const lateral = el('nav', 'indice');
  lateral.setAttribute('aria-label', 'Índice de la página');
  lateral.dataset.visible = '0';

  const barra = el('button', 'indice-barra');
  barra.type = 'button';
  barra.setAttribute('aria-haspopup', 'dialog');
  barra.setAttribute('aria-controls', 'indice-hoja');
  barra.dataset.visible = '0';
  barra.innerHTML =
    '<span class="indice-barra__progreso" aria-hidden="true"><i></i></span>' +
    '<span class="indice-barra__n" aria-hidden="true"></span>' +
    '<span class="indice-barra__actual"></span>' +
    '<span class="indice-barra__abre" aria-hidden="true">' +
    '<svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M1 1.5h16M1 7h16M1 12.5h10" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>';

  const hoja = el('dialog', 'indice-hoja');
  hoja.id = 'indice-hoja';
  hoja.setAttribute('aria-label', 'Índice de la página');
  const hojaCab = el('div', 'indice-hoja__cab');
  hojaCab.appendChild(el('p', 'indice-hoja__h', 'Índice'));
  const cerrar = el('button', 'indice-hoja__cerrar');
  cerrar.type = 'button';
  cerrar.setAttribute('aria-label', 'Cerrar el índice');
  cerrar.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  hojaCab.appendChild(cerrar);
  hoja.appendChild(hojaCab);
  const hojaCuerpo = el('div', 'indice-hoja__cuerpo');
  hoja.appendChild(hojaCuerpo);

  document.body.appendChild(lateral);
  document.body.appendChild(barra);
  document.body.appendChild(hoja);

  barra.addEventListener('click', function () {
    hoja.showModal();
    const actual = hoja.querySelector('[aria-current]');
    if (actual) actual.scrollIntoView({ block: 'center' });
  });
  cerrar.addEventListener('click', function () { hoja.close(); });
  /* un clic fuera de la hoja (en el velo) la cierra */
  hoja.addEventListener('click', function (e) { if (e.target === hoja) hoja.close(); });

  /* ── Leer la página y pintar las listas ─────────────────────────────── */

  function leer() {
    secciones = Array.prototype.filter.call(document.querySelectorAll('[data-indice]'), function (n) {
      return n.id && !n.hidden;
    }).map(function (n) {
      return {
        nodo: n, id: n.id, titulo: n.getAttribute('data-indice'),
        dato: n.getAttribute('data-indice-dato') || '', tono: n.getAttribute('data-indice-tono') || '',
        subs: Array.prototype.filter.call(n.querySelectorAll('[data-indice-sub]'), function (s) { return s.id; })
          .map(function (s) { return { nodo: s, id: s.id, titulo: s.getAttribute('data-indice-sub') }; })
      };
    });
  }

  function ir(nodo) {
    if (hoja.open) hoja.close();
    nodo.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' });
    /* el foco va con la vista, para el teclado y los lectores de pantalla */
    if (!nodo.hasAttribute('tabindex')) nodo.setAttribute('tabindex', '-1');
    nodo.focus({ preventScroll: true });
  }

  function enlace(cls, nodo, k, titulo) {
    const a = el('a', cls);
    a.href = '#' + nodo.id;
    a.dataset.k = k;
    a.addEventListener('click', function (e) { e.preventDefault(); ir(nodo); });
    if (titulo) a.appendChild(el('span', 'indice__t', titulo));
    return a;
  }

  function lista(destino) {
    const ol = el('ol', 'indice__lista');
    secciones.forEach(function (s, k) {
      const li = el('li', 'indice__item');
      const a = enlace('indice__a', s.nodo, String(k));
      a.appendChild(el('span', 'indice__n', String(k + 1).padStart(2, '0')));
      a.appendChild(el('span', 'indice__t', s.titulo));
      if (s.dato) {
        const d = el('span', 'indice__dato', s.dato);
        if (s.tono) d.dataset.tono = s.tono;
        a.appendChild(d);
      }
      li.appendChild(a);
      if (s.subs.length) {
        const sub = el('ol', 'indice__subs');
        s.subs.forEach(function (x) {
          const li2 = el('li');
          li2.appendChild(enlace('indice__sub', x.nodo, k + ':' + x.id, x.titulo));
          sub.appendChild(li2);
        });
        li.appendChild(sub);
      }
      ol.appendChild(li);
    });
    destino.appendChild(ol);

    const otras = PAGINAS.filter(function (p) { return p.id !== PAGINA; });
    if (otras.length) {
      destino.appendChild(el('p', 'indice__h indice__h--paginas', 'Otras páginas'));
      const ul = el('ul', 'indice__paginas');
      otras.forEach(function (p) {
        const li = el('li');
        const a = el('a', 'indice__pagina');
        a.href = RUTAS && ciudad ? RAIZ + ciudad + '/' + p.ruta : p.archivo + (ciudad ? '#' + ciudad : '');
        a.appendChild(el('span', null, p.titulo(nombre)));
        a.insertAdjacentHTML('beforeend', FLECHA);
        li.appendChild(a);
        ul.appendChild(li);
      });
      destino.appendChild(ul);
    }
  }

  function pintar() {
    leer();
    lateral.textContent = '';
    lateral.appendChild(el('p', 'indice__h', 'Índice'));
    lista(lateral);
    hojaCuerpo.textContent = '';
    lista(hojaCuerpo);
    activa = -2; activaSub = undefined;   /* que medir() marque de nuevo */
  }

  /* ── Dónde se está ──────────────────────────────────────────────────── */

  function modo() {
    const env = document.querySelector('main .env');
    let rail = false;
    if (env) {
      const izq = env.getBoundingClientRect().left + parseFloat(getComputedStyle(env).paddingLeft || 0);
      rail = izq >= RAIL_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    document.documentElement.dataset.indice = rail ? 'lateral' : 'barra';
  }

  function marcar(k, subId) {
    if (k === activa && subId === activaSub) return;
    activa = k; activaSub = subId;
    [lateral, hojaCuerpo].forEach(function (raiz) {
      raiz.querySelectorAll('[aria-current]').forEach(function (n) { n.removeAttribute('aria-current'); });
      raiz.querySelectorAll('.indice__item--abierto').forEach(function (n) { n.classList.remove('indice__item--abierto'); });
      if (k < 0) return;
      const a = raiz.querySelector('.indice__a[data-k="' + k + '"]');
      if (a) { a.setAttribute('aria-current', 'location'); a.parentNode.classList.add('indice__item--abierto'); }
      if (subId) {
        const s = raiz.querySelector('.indice__sub[data-k="' + k + ':' + subId + '"]');
        if (s) s.setAttribute('aria-current', 'location');
      }
    });
    const s = secciones[k];
    barra.querySelector('.indice-barra__actual').textContent = s ? s.titulo : '';
    barra.querySelector('.indice-barra__n').textContent = s ? (k + 1) + '/' + secciones.length : '';
    barra.setAttribute('aria-label', 'Índice de la página' + (s ? '. Estás en ' + s.titulo : ''));
  }

  let pedido = false;
  function medir() {
    pedido = false;
    if (!secciones.length) return;
    const alto = window.innerHeight, linea = alto * 0.3;
    let k = -1;
    secciones.forEach(function (s, i) { if (s.nodo.getBoundingClientRect().top <= linea) k = i; });
    let subId = null;
    if (k >= 0) {
      secciones[k].subs.forEach(function (x) { if (x.nodo.getBoundingClientRect().top <= linea) subId = x.id; });
    }
    marcar(k, subId);

    /* se enseña al dejar atrás la portada */
    const dentro = secciones[0].nodo.getBoundingClientRect().top < alto * 0.6;
    let ancho = false;
    document.querySelectorAll('[data-indice-ancho]').forEach(function (n) {
      const r = n.getBoundingClientRect();
      if (r.top < alto * 0.9 && r.bottom > alto * 0.1) ancho = true;
    });
    lateral.dataset.visible = dentro && !ancho ? '1' : '0';
    barra.dataset.visible = dentro ? '1' : '0';
    const max = document.documentElement.scrollHeight - alto;
    barra.style.setProperty('--progreso', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
  }
  function alScroll() { if (!pedido) { pedido = true; requestAnimationFrame(medir); } }

  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', function () { modo(); alScroll(); }, { passive: true });

  window.INDICE = {
    /* ciudad: el id de la ciudad elegida; nombre: cómo se escribe */
    refrescar: function (o) {
      if (o && o.ciudad) { ciudad = o.ciudad; nombre = o.nombre || o.ciudad; }
      pintar();
      modo();
      medir();
    }
  };
})();

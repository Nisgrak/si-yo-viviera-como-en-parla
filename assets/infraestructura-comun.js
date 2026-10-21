/* ═══════════════════════════════════════════════════════════════════════
   SALIR · lo común de infraestructura.html: qué ciudad, el
   selector, los enlaces, la frase de arriba y la carga de geometrías.
   Cada parte de la página (mapa, colas) se apunta con
   INFRA.alPintar y se repinta al cambiar de ciudad.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const A = window.ACCESOS.ciudades;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const $ = function (s, r) { return (r || document).querySelector(s); };

  function entero(n) { return Math.round(n).toLocaleString('es-ES', { useGrouping: true }); }
  function num(n, dec) {
    return n.toLocaleString('es-ES',
      { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function deCadaDiez(x) { return Math.round(x * 10) + ' de cada 10'; }
  function total(c) { return c.puertas.reduce(function (s, p) { return s + p.v; }, 0) + c.calles; }

  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const RAIZ_WEB = new URL('.', document.baseURI).pathname;
  function valida(id) { return !!(id && A[id] && NOMBRE[id] && id !== REF); }

  const I = {
    D: D, A: A, REF: REF, NOMBRE: NOMBRE, $: $,
    entero: entero, num: num, deCadaDiez: deCadaDiez, total: total,
    quieto: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    AQUI: (function () {
      const fija = document.documentElement.getAttribute('data-ciudad');
      if (valida(fija)) return fija;
      const h = (location.hash || '').replace('#', '');
      if (valida(h)) return h;
      try {
        const g = localStorage.getItem('municipio');
        if (valida(g)) return g;
      } catch (e) { /* sin almacenamiento */ }
      return 'getafe';
    })(),
    pintores: []
  };
  I.alPintar = function (fn) { I.pintores.push(fn); };
  function pintar() {
    I.pintores.forEach(function (fn) { fn(); });
    if (window.INDICE) window.INDICE.refrescar({ ciudad: I.AQUI, nombre: NOMBRE[I.AQUI] });
  }

  function enlace() {
    if (!history.replaceState) { location.hash = I.AQUI; return; }
    history.replaceState(null, '', RUTAS ? RAIZ_WEB + I.AQUI + '/infraestructura/' : '#' + I.AQUI);
  }

  /* Geometrías de datos/mapa/<id>.js, con un <script> para que funcione
     también abriendo el HTML desde la carpeta. */
  const cargando = {};
  I.cargar = function (id) {
    window.MAPA = window.MAPA || {};
    if (window.MAPA[id]) return Promise.resolve(window.MAPA[id]);
    if (cargando[id]) return cargando[id];
    cargando[id] = new Promise(function (ok, mal) {
      const s = document.createElement('script');
      s.src = 'datos/mapa/' + id + '.js';
      s.onload = function () { window.MAPA[id] ? ok(window.MAPA[id]) : mal(new Error(id)); };
      s.onerror = function () { mal(new Error(id)); };
      document.head.appendChild(s);
    });
    return cargando[id];
  };

  I.golpe = function () {
    const p = A[REF], a = A[I.AQUI];
    const sp = p.puertas[0].v / total(p), sa = a.puertas[0].v / total(a);
    const n = $('#golpe');
    if (!n) return;
    n.textContent = '';
    n.appendChild(document.createTextNode('Un miércoles laborable, entre las 6 y las 10 de la mañana, salen de Parla por carretera '));
    const b = document.createElement('b'); b.className = 'parla'; b.textContent = entero(total(p)) + ' personas';
    n.appendChild(b);
    n.appendChild(document.createTextNode('. ' + deCadaDiez(sp).replace(/^./, function (x) { return x.toUpperCase(); }) +
      ' lo hacen por la misma carretera: la ' + p.puertas[0].via + ' ' + p.puertas[0].hacia + '. En ' +
      NOMBRE[I.AQUI] + ', la salida más usada se lleva ' + deCadaDiez(sa) + '.'));
  };

  function comun() {
    $('#sel-texto').textContent = NOMBRE[I.AQUI];
    document.querySelectorAll('[data-aqui]').forEach(function (n) { n.textContent = NOMBRE[I.AQUI]; });
    const vuelta = RUTAS ? RAIZ_WEB + I.AQUI + '/' : 'index.html#' + I.AQUI;
    document.querySelectorAll('.js-volver').forEach(function (a) { a.href = vuelta; });
    document.title = 'Salir de Parla y salir de ' + NOMBRE[I.AQUI] + ' · ' + D.NOMBRE_WEB;
    I.golpe();
  }

  I.arrancar = function () {
    const sel = $('#sel-municipio');
    D.MUNICIPIOS.filter(function (m) { return valida(m.id); }).forEach(function (m) {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.nombre; o.selected = m.id === I.AQUI;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      I.AQUI = sel.value;
      try { localStorage.setItem('municipio', I.AQUI); } catch (e) { /* sin almacenamiento */ }
      enlace();
      comun();
      pintar();
    });
    enlace();
    comun();
    pintar();
  };

  window.INFRA = I;
})();

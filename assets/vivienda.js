/* ═══════════════════════════════════════════════════════════════════════
   UNA CASA EN PARLA · el render de vivienda.html
   Los datos, en datos/vivienda.js (los escribe herramientas/vivienda.py).
   Aquí solo se divide y se dibuja: Parla en azul, la ciudad elegida en gris, como
   en el resto de la web. Nada se colorea de bueno o malo: las dos cifras,
   una al lado de la otra.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const V = window.VIVIENDA;
  const C = V.ciudades;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Formato ──────────────────────────────────────────────────────── */

  function num(n, dec) {
    return n.toLocaleString('es-ES',
      { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function entero(n) { return num(Math.round(n), 0); }
  function euros(n) { return entero(n) + ' €'; }
  function pct(n, dec) { return num(n, dec == null ? 1 : dec) + ' %'; }
  /* El tipo del IBI, con los decimales que fija cada ordenanza (0,433; 0,4872). */
  function tipo(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }
  function conSigno(n, dec) { return (n > 0 ? '+' : n < 0 ? '−' : '') + num(Math.abs(n), dec == null ? 1 : dec); }
  /* «2026T2» → «2.º trimestre de 2026» */
  function trimestre(p, corto) {
    const t = p.slice(5);
    return corto ? t + '.º trim. ' + p.slice(0, 4) : t + '.º trimestre de ' + p.slice(0, 4);
  }

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, at) {
    const n = document.createElementNS(SVG, tag);
    Object.keys(at || {}).forEach(function (k) { n.setAttribute(k, at[k]); });
    return n;
  }

  /* ── Qué ciudad ───────────────────────────────────────────────────── */

  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const RAIZ_WEB = new URL('.', document.baseURI).pathname;
  function valida(id) { return !!(id && C[id] && NOMBRE[id] && id !== REF); }
  let AQUI = (function () {
    const fija = document.documentElement.getAttribute('data-ciudad');
    if (valida(fija)) return fija;
    const h = (location.hash || '').replace('#', '');
    if (valida(h)) return h;
    try {
      const g = localStorage.getItem('municipio');
      if (valida(g)) return g;
    } catch (e) { /* sin almacenamiento */ }
    return 'getafe';
  })();

  function enlace() {
    if (!history.replaceState) { location.hash = AQUI; return; }
    history.replaceState(null, '', RUTAS ? RAIZ_WEB + AQUI + '/vivienda/' : '#' + AQUI);
  }

  /* ── Las cuentas ──────────────────────────────────────────────────
     Todas las que enseña la página, en un sitio. */

  function m(id) {
    const c = C[id];
    const t = c.tasado, a = c.alquiler, ti = c.titular, pj = V.partidos[c.partido];
    const ult = pj.total.length - 1;
    return {
      tasado: t.ult.v,
      subida10: (t.ult.v / t.hace10.v - 1) * 100,
      frenteMax: (t.ult.v / t.max.v - 1) * 100,
      caida: (t.min.v / t.max.v - 1) * 100,
      aniosRenta: t.ult.v * c.censo.superficie / c.renta.hogar,
      compraventas: c.compraventas.por1000,
      alquilerMes: a.mes[a.mes.length - 1],
      alquilerM2: a.m2[a.m2.length - 1],
      subidaAlquiler: (a.m2[a.m2.length - 1] / a.m2[0] - 1) * 100,
      nuevos: a.nuevos,
      esfuerzo: a.esfuerzo.pct,
      pctAlquiler: c.censo.pctAlquiler,
      alquiladas: a.por100k,
      pctSoc: ti.soc / ti.inm * 100,
      pctSoc100: ti.soc100.inm / ti.inm * 100,
      pctPf: ti.pf / ti.inm * 100,
      pctAapp: ti.aapp / ti.inm * 100,
      caseros: c.caseros.por1000,
      avs: c.avs.por1000,
      demandas: pj.demandas[ult] / pj.pob[ult] * 1e5,
      demandasHog: pj.demandas[ult] / pj.hogaresAlquiler * 1e3,
      lanz: pj.total[ult] / pj.pob[ult] * 1e5,
      lanzLau: pj.lau[ult] / pj.total[ult] * 100,
      dPob: c.crece.pob[c.crece.pob.length - 1] - c.crece.pob[0],
      dCasas: c.crece.casas[c.crece.casas.length - 1] - c.crece.casas[0],
      pisoMedio: t.ult.v * c.censo.superficie,
      vacias: c.censo.pctVacias,
      antes81: c.censo.pctAntes1981,
      hog5: c.censo.pctHog5en60
    };
  }
  /* En los gráficos, «Pozuelo de Alarcón» y «Torrejón de Ardoz» no caben al final de la línea. */
  function corto(id) { return NOMBRE[id].split(' de ')[0]; }
  function casasPor100(x) { return x.dPob > 0 ? x.dCasas / x.dPob * 100 : null; }

  /* ── Las piezas ───────────────────────────────────────────────────── */

  /* Dos cifras grandes, una por ciudad. */
  function pareja(nodo, titulo, fmt, clave, pie) {
    vaciar(nodo);
    const p = m(REF), a = m(AQUI);
    [[REF, 'referencia', p], [AQUI, 'aqui', a]].forEach(function (g) {
      const c = el('div', 'cifra');
      c.dataset.quien = g[1];
      c.appendChild(el('p', 'cifra__quien', NOMBRE[g[0]]));
      c.appendChild(el('p', 'cifra__v', fmt(g[2][clave])));
      c.appendChild(el('p', 'cifra__que', typeof pie === 'function' ? pie(g[0]) : pie));
      nodo.appendChild(c);
    });
    if (titulo) nodo.setAttribute('aria-label', titulo);
  }

  /* Un hecho: título, y las dos ciudades con su barra a la misma escala.
     Sin barra cuando la cifra puede ser negativa. */
  function hecho(cont, h) {
    const art = el('article', 'hecho');
    if (h.id) art.id = h.id;
    const t = el('h3', 'hecho__h', h.titulo);
    if (h.sentido) t.dataset.sentido = h.sentido;
    art.appendChild(t);
    if (h.pie) art.appendChild(el('p', 'hecho__pie', h.pie));
    const filas = [
      { q: NOMBRE[AQUI], v: h.v(AQUI), quien: 'aqui' },
      { q: NOMBRE[REF], v: h.v(REF), quien: 'referencia' }
    ];
    if (h.extra) filas.unshift(h.extra);
    const tope = filas.reduce(function (t, f) { return Math.max(t, Math.abs(f.v)); }, 0);
    const ul = el('ul', 'mun' + (h.barra === false ? ' mun--sin' : ''));
    filas.forEach(function (f) {
      const li = el('li', 'mun__fila');
      li.dataset.quien = f.quien;
      li.appendChild(el('span', 'mun__q', f.q));
      li.appendChild(el('span', 'mun__v', h.fmt(f.v)));
      if (h.barra !== false) {
        const b = el('span', 'mun__barra');
        const i = el('i');
        i.style.width = (tope ? Math.abs(f.v) / tope * 100 : 0).toFixed(1) + '%';
        b.appendChild(i);
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
    art.appendChild(ul);
    if (h.nota) art.appendChild(el('p', 'hecho__nota', h.nota));
    cont.appendChild(art);
  }
  function hechos(sel, lista) {
    const cont = $(sel);
    vaciar(cont);
    lista.forEach(function (h) { hecho(cont, h); });
  }

  const linea = window.LINEA.dibujar;

  /* ── La rejilla de 100 ────────────────────────────────────────────
     De cada 100 viviendas: personas, sociedades, administraciones. Las de
     las sociedades con más de 100 viviendas en la ciudad, con borde. Se
     reparte con el método del resto mayor para que sumen 100 justas. */

  function cien(id) {
    const x = m(id);
    const partes = [
      { k: 'pf', v: x.pctPf, n: 'Personas' },
      { k: 'soc100', v: x.pctSoc100, n: 'Sociedades con más de 100' },
      { k: 'soc', v: x.pctSoc - x.pctSoc100, n: 'Otras sociedades' },
      { k: 'aapp', v: x.pctAapp, n: 'Administraciones' }
    ];
    const resto = 100 - partes.reduce(function (s, p) { return s + p.v; }, 0);
    partes.push({ k: 'otro', v: Math.max(0, resto), n: 'Otros' });
    partes.forEach(function (p) { p.c = Math.floor(p.v); p.r = p.v - p.c; });
    let faltan = 100 - partes.reduce(function (s, p) { return s + p.c; }, 0);
    partes.slice().sort(function (a, b) { return b.r - a.r; }).forEach(function (p) {
      if (faltan > 0) { p.c++; faltan--; }
    });

    const caja = el('div', 'cien');
    caja.dataset.quien = id === REF ? 'referencia' : 'aqui';
    caja.appendChild(el('h3', 'cien__nombre', NOMBRE[id]));
    const rej = el('div', 'cien__rejilla');
    rej.setAttribute('role', 'img');
    rej.setAttribute('aria-label', NOMBRE[id] + ': de cada 100 viviendas, ' +
      partes.filter(function (p) { return p.c; }).map(function (p) { return p.c + ' ' + p.n.toLowerCase(); }).join(', '));
    let k = 0;
    partes.forEach(function (p) {
      for (let i = 0; i < p.c; i++) {
        const u = el('i', 'cien__u cien__u--' + p.k);
        u.style.setProperty('--i', k++);
        rej.appendChild(u);
      }
    });
    caja.appendChild(rej);
    const ley = el('ul', 'cien__ley');
    [['pf', 'De personas', x.pctPf], ['soc', 'De sociedades', x.pctSoc],
      ['soc100', 'De ellas, de sociedades con más de 100 viviendas aquí', x.pctSoc100],
      ['aapp', 'De administraciones', x.pctAapp]].forEach(function (f) {
      const li = el('li', 'cien__l cien__l--' + f[0]);
      li.appendChild(el('i'));
      li.appendChild(el('span', null, f[1]));
      li.appendChild(el('b', null, pct(f[2], 2)));
      ley.appendChild(li);
    });
    caja.appendChild(ley);
    return caja;
  }

  const miraCien = 'IntersectionObserver' in window && !quieto ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      miraCien.unobserve(e.target);
      e.target.classList.add('cien--visto');
    });
  }, { threshold: 0.3 }) : null;

  /* ── Las secciones ────────────────────────────────────────────────── */

  function golpe() {
    const p = m(REF), a = m(AQUI);
    const n = $('#golpe');
    vaciar(n);
    const b = el('b', 'parla', entero(p.dPob) + ' vecinos y ' + entero(p.dCasas) + ' viviendas');
    n.appendChild(document.createTextNode('Entre 2015 y 2025 Parla ganó '));
    n.appendChild(b);
    n.appendChild(document.createTextNode(': ' + num(casasPor100(p), 1) + ' viviendas por cada 100 vecinos nuevos. '));
    if (a.dPob > 0) {
      n.appendChild(document.createTextNode(NOMBRE[AQUI] + ' ganó ' + entero(a.dPob) + ' vecinos y ' +
        entero(a.dCasas) + ' viviendas: ' + num(casasPor100(a), 1) + ' por cada 100.'));
    } else {
      n.appendChild(document.createTextNode(NOMBRE[AQUI] + ' perdió ' + entero(-a.dPob) + ' vecinos y ganó ' +
        entero(a.dCasas) + ' viviendas.'));
    }
  }

  /* ── Unidades que se llenan ───────────────────────────────────────
     Una fila de piezas iguales en las que la cifra llena las enteras y
     la parte que sobra de la última, sin redondear: 4,9 años son cuatro
     piezas llenas y nueve décimas de la quinta. */

  let casaId = 0;
  function casa(lleno, hueco) {
    const id = 'casa-' + (casaId++);
    const d = svg('svg', { viewBox: '0 0 20 20', class: 'hog__u' + (hueco ? ' hog__u--hueco' : ''), 'aria-hidden': 'true' });
    const forma = 'M10 1.5 19 9v9.5H1V9z';
    const cp = svg('clipPath', { id: id });
    cp.appendChild(svg('path', { d: forma }));
    d.appendChild(cp);
    if (hueco) d.appendChild(svg('path', { d: forma, class: 'hog__borde' }));
    if (lleno > 0) {
      d.appendChild(svg('rect', { x: 0, y: 0, width: (20 * Math.min(1, lleno)).toFixed(2), height: 20,
        'clip-path': 'url(#' + id + ')', class: 'hog__lleno' }));
    }
    return d;
  }

  /* ── Vecinos nuevos, casas nuevas ─────────────────────────────────
     Por cada 100 vecinos nuevos: los hogares que serían al tamaño medio
     de hogar de la ciudad (con borde) y las viviendas que se registraron
     (llenas). Debajo, la cuenta año a año. */

  function casas() {
    const cp = C[REF], ca = C[AQUI];
    $('#casas-intro').textContent =
      'Por cada 100 vecinos nuevos entre 2015 y 2025, las viviendas nuevas que registró el Catastro. ' +
      'Con borde, los hogares que forman 100 personas al tamaño medio de hogar de cada ciudad.';
    const cont = $('#casas-hogares');
    vaciar(cont);
    [[REF, 'referencia', cp], [AQUI, 'aqui', ca]].forEach(function (g) {
      const x = m(g[0]);
      const caja = el('div', 'hog');
      caja.dataset.quien = g[1];
      caja.appendChild(el('h3', 'cien__nombre', NOMBRE[g[0]]));
      const r = casasPor100(x);
      if (r == null) {
        caja.appendChild(el('p', 'hog__v', conSigno(x.dPob, 0)));
        caja.appendChild(el('p', 'hog__que', 'vecinos entre 2015 y 2025, y ' + conSigno(x.dCasas, 0) +
          ' viviendas.'));
        cont.appendChild(caja);
        return;
      }
      const tam = g[2].renta.tamano;
      const hogares = 100 / tam;
      caja.appendChild(el('p', 'hog__v', num(r, 1)));
      caja.appendChild(el('p', 'hog__que', 'viviendas nuevas por cada 100 vecinos nuevos'));
      const fila = el('div', 'hog__fila');
      fila.setAttribute('role', 'img');
      fila.setAttribute('aria-label', NOMBRE[g[0]] + ': ' + num(r, 1) + ' viviendas nuevas por cada 100 vecinos nuevos; ' +
        '100 personas son ' + num(hogares, 1) + ' hogares de ' + num(tam, 1) + ' personas.');
      const total = Math.max(Math.round(hogares), Math.ceil(r));
      for (let i = 0; i < total; i++) fila.appendChild(casa(r - i, i < Math.round(hogares)));
      caja.appendChild(fila);
      caja.appendChild(el('p', 'hog__pie', '100 vecinos, a ' + num(tam, 1) + ' personas por hogar, son ' +
        num(hogares, 1) + ' hogares. En total: ' + entero(x.dPob) + ' vecinos y ' + entero(x.dCasas) + ' viviendas.'));
      cont.appendChild(caja);
    });

    /* Año a año, con la misma escala en las dos ciudades. */
    const gc = $('#casas-graf');
    vaciar(gc);
    const acum = function (s) { return s.map(function (v) { return v - s[0]; }); };
    let lo = 0, hi = 0;
    [cp, ca].forEach(function (c) {
      acum(c.crece.pob).concat(acum(c.crece.casas)).forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    });
    const desde = cp.crece.desde;
    [[REF, 'referencia', cp], [AQUI, 'aqui', ca]].forEach(function (g) {
      const fig = el('figure', 'graf graf--media');
      gc.appendChild(fig);
      linea(fig, {
        titulo: [NOMBRE[g[0]], g[1]],
        etiquetas: g[2].crece.pob.map(function (_, i) { return String(desde + i); }),
        series: [
          { nombre: 'Vecinos', quien: g[1], fina: true, v: acum(g[2].crece.pob) },
          { nombre: 'Viviendas', quien: g[1], v: acum(g[2].crece.casas) }
        ],
        rango: [lo, hi],
        alto: function (e) { return e ? 200 : 220; },
        izq: 52,
        der: 80,
        paso: function (r) { return r > 20000 ? 10000 : 5000; },
        fmtEje: function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + entero(Math.abs(v)); },
        fmtValor: function (v) { return conSigno(v, 0); },
        fmtX: function (i) { return '1 de enero de ' + (desde + i) + ', frente a 2015'; },
        marcasX: function (n, e) { return e ? [0, 5, 10] : [0, 2, 4, 6, 8, 10]; },
        descripcion: NOMBRE[g[0]] + ', de 2015 a 2025: ' + conSigno(m(g[0]).dPob, 0) + ' vecinos y ' +
          conSigno(m(g[0]).dCasas, 0) + ' viviendas.'
      });
    });
  }

  function comprar() {
    const cp = C[REF], ca = C[AQUI];
    pareja($('#comprar-cifras'), 'Valor de la vivienda media', function (v) { return euros(v); }, 'pisoMedio',
      function (id) {
        return 'la vivienda media, ' + num(C[id].censo.superficie, 2) + ' m² a ' + euros(C[id].tasado.ult.v) +
          ' el metro cuadrado (' + trimestre(C[id].tasado.ult.p, true) + ')';
      });

    /* Años de renta: una pieza por año, a la misma escala. */
    const an = $('#comprar-anios');
    vaciar(an);
    an.appendChild(el('p', 'anios__h', 'Años de renta de un hogar para pagarla entera'));
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const v = m(g[0]).aniosRenta;
      const fila = el('div', 'anios__fila');
      fila.dataset.quien = g[1];
      fila.appendChild(el('span', 'anios__q', NOMBRE[g[0]]));
      const ps = el('span', 'anios__piezas');
      ps.setAttribute('role', 'img');
      ps.setAttribute('aria-label', NOMBRE[g[0]] + ': ' + num(v, 1) + ' años');
      for (let i = 0; i < Math.ceil(v); i++) {
        const u = el('i', 'anios__u');
        const f = el('b');
        f.style.width = (Math.min(1, v - i) * 100).toFixed(1) + '%';
        u.appendChild(f);
        ps.appendChild(u);
      }
      fila.appendChild(ps);
      fila.appendChild(el('span', 'anios__v', num(v, 1) + ' años'));
      an.appendChild(fila);
    });
    an.appendChild(el('p', 'anios__pie', 'Sin gastar nada en otra cosa, con la renta neta media de un hogar en ' + cp.renta.anio + ': ' +
      euros(cp.renta.hogar) + ' al año en Parla y ' + euros(ca.renta.hogar) + ' en ' + NOMBRE[AQUI] + '.'));

    /* Las dos series empiezan el mismo trimestre (2005T1). */
    const etiquetas = cp.tasado.s.map(function (_, i) {
      return String(2005 + Math.floor(i / 4)) + 'T' + (i % 4 + 1);
    });
    const iMax = etiquetas.indexOf(cp.tasado.max.p), iMin = etiquetas.indexOf(cp.tasado.min.p);
    linea($('#comprar-graf'), {
      etiquetas: etiquetas,
      series: [
        { nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: ca.tasado.s },
        { nombre: 'Parla', quien: 'referencia', v: cp.tasado.s }
      ],
      paso: function (mx) { return mx > 4000 ? 1000 : 500; },
      fmtEje: function (v) { return entero(v); },
      fmtValor: function (v) { return euros(v); },
      marcasX: function (n, e) {
        const out = [];
        for (let i = 0; i < n; i += e ? 32 : 20) out.push(i);
        return out;
      },
      notas: [
        { serie: 1, i: iMax, texto: 'Máximo: ' + euros(cp.tasado.max.v) },
        { serie: 1, i: iMin, texto: 'Mínimo: ' + euros(cp.tasado.min.v), arriba: false }
      ],
      fmtX: function (i) { return trimestre(etiquetas[i]); },
      descripcion: 'Valor tasado por metro cuadrado desde 2005. Parla: de ' + euros(cp.tasado.s[0]) + ' a ' +
        euros(cp.tasado.ult.v) + '. ' + NOMBRE[AQUI] + ': de ' + euros(ca.tasado.s[0]) + ' a ' + euros(ca.tasado.ult.v) + '.',
      leyenda: 'Valor tasado, euros por metro cuadrado construido, por trimestre.'
    });

    const p = m(REF);
    hechos('#comprar-hechos', [
      { id: 'subida-10', titulo: 'Subida en diez años',
        pie: 'Del ' + trimestre(cp.tasado.hace10.p) + ' al ' + trimestre(cp.tasado.ult.p) + '.',
        v: function (id) { return m(id).subida10; }, fmt: function (v) { return conSigno(v) + ' %'; } },
      { id: 'frente-maximo', titulo: 'Frente al máximo de 2007-2008',
        pie: 'Cuánto está hoy por encima o por debajo de lo más alto de la burbuja.',
        v: function (id) { return m(id).frenteMax; }, fmt: function (v) { return conSigno(v) + ' %'; }, barra: false,
        nota: 'De la burbuja al suelo, el metro cuadrado cayó un ' + num(-p.caida, 1) + ' % en Parla y un ' +
          num(-m(AQUI).caida, 1) + ' % en ' + NOMBRE[AQUI] + '.' },
      { id: 'ibi', titulo: 'El recibo del IBI de una vivienda media, 2026', sentido: 'menos',
        pie: 'El valor catastral medio de las viviendas por el tipo del impuesto que fija cada ayuntamiento.',
        v: function (id) { return C[id].ibi.recibo; }, fmt: function (v) { return euros(v) + '/año'; },
        nota: 'Parla: ' + euros(cp.ibi.vc) + ' de valor catastral al ' + tipo(cp.ibi.tipo) + ' %, con la última revisión del Catastro en ' +
          cp.ibi.revision + '. ' + NOMBRE[AQUI] + ': ' + euros(ca.ibi.vc) + ' al ' + tipo(ca.ibi.tipo) +
          ' %, revisión de ' + ca.ibi.revision + '.' },
      { id: 'compraventas', titulo: 'Compraventas de viviendas por 1.000 habitantes, 2025',
        v: function (id) { return m(id).compraventas; }, fmt: function (v) { return num(v, 2); },
        nota: 'Parla: ' + entero(cp.compraventas.total) + ', de ellas ' + entero(cp.compraventas.nueva) + ' nuevas. ' +
          NOMBRE[AQUI] + ': ' + entero(ca.compraventas.total) + ', de ellas ' + entero(ca.compraventas.nueva) + ' nuevas.' }
    ]);
  }

  function alquilar() {
    const cp = C[REF], ca = C[AQUI];

    /* De cada 100 hogares, los que viven de alquiler: cien casas, llenas
       las de alquiler, con la parte de la última sin redondear. */
    const ch = $('#alquilar-hogares');
    vaciar(ch);
    [[REF, 'referencia', cp], [AQUI, 'aqui', ca]].forEach(function (g) {
      const v = g[2].censo.pctAlquiler;
      const caja = el('div', 'hog');
      caja.dataset.quien = g[1];
      caja.appendChild(el('h3', 'cien__nombre', NOMBRE[g[0]]));
      caja.appendChild(el('p', 'hog__v', pct(v)));
      caja.appendChild(el('p', 'hog__que', 'de los hogares vive de alquiler'));
      const fila = el('div', 'hog__fila hog__fila--cien');
      fila.setAttribute('role', 'img');
      fila.setAttribute('aria-label', NOMBRE[g[0]] + ': ' + num(v, 1) + ' de cada 100 hogares viven de alquiler');
      for (let i = 0; i < 100; i++) fila.appendChild(casa(v - i, true));
      caja.appendChild(fila);
      caja.appendChild(el('p', 'hog__pie', entero(g[2].censo.alquiler) + ' de ' + entero(g[2].censo.hogares) +
        ' hogares en el Censo de 2021.'));
      ch.appendChild(caja);
    });
    pareja($('#alquilar-cifras'), 'Alquiler mediano', function (v) { return euros(v); }, 'alquilerMes',
      function (id) { return 'al mes, el alquiler mediano de un piso en 2024 (' + num(C[id].alquiler.sup, 0) + ' m²)'; });
    $('#alquilar-cifras').dataset.sentido = 'menos';

    /* De cada 100 euros que entran en un hogar medio. */
    const ce = $('#alquilar-euros');
    vaciar(ce);
    const hE = el('p', 'anios__h', 'De cada 100 € que entran en un hogar medio, los que se llevaría el alquiler');
    hE.dataset.sentido = 'menos';
    ce.appendChild(hE);
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const e = C[g[0]].alquiler.esfuerzo;
      const fila = el('div', 'euros__fila');
      fila.dataset.quien = g[1];
      fila.appendChild(el('span', 'anios__q', NOMBRE[g[0]]));
      const b = el('span', 'euros__barra');
      b.setAttribute('role', 'img');
      b.setAttribute('aria-label', NOMBRE[g[0]] + ': ' + num(e.pct, 1) + ' euros de cada 100');
      const i = el('i');
      i.style.width = e.pct.toFixed(2) + '%';
      b.appendChild(i);
      fila.appendChild(b);
      fila.appendChild(el('span', 'anios__v', num(e.pct, 1) + ' €'));
      ce.appendChild(fila);
    });
    ce.appendChild(el('p', 'anios__pie', 'En ' + cp.alquiler.esfuerzo.anio + ', doce meses de alquiler mediano entre la renta neta media de un hogar. Parla: ' +
      euros(cp.alquiler.esfuerzo.alquiler * 12) + ' de ' + euros(cp.alquiler.esfuerzo.renta) + '. ' +
      NOMBRE[AQUI] + ': ' + euros(ca.alquiler.esfuerzo.alquiler * 12) + ' de ' + euros(ca.alquiler.esfuerzo.renta) + '.'));

    const desde = cp.alquiler.desde;
    linea($('#alquilar-graf'), {
      etiquetas: cp.alquiler.m2.map(function (_, i) { return String(desde + i); }),
      series: [
        { nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: ca.alquiler.m2 },
        { nombre: 'Parla', quien: 'referencia', v: cp.alquiler.m2 }
      ],
      paso: function (mx) { return mx > 12 ? 4 : 2; },
      fmtEje: function (v) { return num(v, 0); },
      fmtValor: function (v) { return num(v, 2) + ' €'; },
      marcasX: function (n, e) { return e ? [0, 3, 6, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; },
      descripcion: 'Renta mediana por metro cuadrado de 2015 a 2024. Parla: de ' + num(cp.alquiler.m2[0], 2) +
        ' a ' + num(cp.alquiler.m2[cp.alquiler.m2.length - 1], 2) + ' euros.',
      leyenda: 'Euros por metro cuadrado al mes, renta mediana de cada año. Parla: ' +
        conSigno(m(REF).subidaAlquiler) + ' % desde 2015. ' + NOMBRE[AQUI] + ': ' + conSigno(m(AQUI).subidaAlquiler) + ' %.'
    });
    hechos('#alquilar-hechos', [
      { id: 'contratos-nuevos', titulo: 'Los contratos nuevos de 2024', sentido: 'menos',
        pie: 'Alquiler medio de los contratos firmados en el año, según Hacienda.',
        v: function (id) { return m(id).nuevos; }, fmt: function (v) { return euros(v) + '/mes'; },
        nota: 'Los contratos en vigor ese año salían de media a ' + euros(cp.alquiler.medio) + ' en Parla y a ' +
          euros(ca.alquiler.medio) + ' en ' + NOMBRE[AQUI] + '.' },
      { id: 'pisos-alquilados', titulo: 'Pisos alquilados por 100.000 habitantes, 2024',
        pie: 'Los que los caseros particulares declaran a Hacienda como alquiler de vivienda.',
        v: function (id) { return m(id).alquiladas; }, fmt: function (v) { return num(v, 1); } }
    ]);
    $('#alquilar-cautela').textContent =
      'Hacienda y el Censo no cuentan lo mismo. En 2021 los pisos que los caseros declaraban alquilados eran, en ' +
      'Parla, el ' + pct(cp.alquiler.cobertura) + ' de los hogares que el Censo contaba de alquiler; en ' +
      NOMBRE[AQUI] + ', el ' + pct(ca.alquiler.cobertura) + '.';
  }

  function duenos() {
    const cont = $('#duenos-cien');
    vaciar(cont);
    [REF, AQUI].forEach(function (id) {
      const c = cien(id);
      cont.appendChild(c);
      if (miraCien) miraCien.observe(c); else c.classList.add('cien--visto');
    });
    const cp = C[REF], ca = C[AQUI];
    hechos('#duenos-hechos', [
      { id: 'grandes-tenedores', titulo: 'Viviendas de sociedades con más de 100 en la ciudad',
        v: function (id) { return m(id).pctSoc100; }, fmt: function (v) { return pct(v, 2); },
        nota: 'Parla: ' + entero(cp.titular.soc100.inm) + ' viviendas de ' + cp.titular.soc100.n + ' sociedades. ' +
          NOMBRE[AQUI] + ': ' + entero(ca.titular.soc100.inm) + ' de ' + ca.titular.soc100.n + '.' },
      { id: 'caseros', titulo: 'Vecinos que cobran un alquiler, por 1.000 habitantes',
        pie: 'Declaraciones del IRPF de 2024 con rendimientos de inmuebles alquilados. Cuenta dónde vive el casero, no dónde está el piso.',
        v: function (id) { return m(id).caseros; }, fmt: function (v) { return num(v, 1); } }
    ]);
  }

  /* ── De un barrio a otro ──────────────────────────────────────────
     Una línea por ciudad, del extremo bajo al alto, a la misma escala
     para las dos. Si el alto es el tope del INE, se marca y no se divide. */

  function barrios() {
    const cont = $('#barrios-rangos');
    vaciar(cont);
    [
      { id: 'barrios-alquiler', h: 'Alquiler del metro cuadrado, 2024', k: 'alq', fmt: function (v) { return num(v, 2) + ' €'; },
        pie: function (b) { return b.alqSecc + ' secciones con 30 o más alquileres'; } },
      { id: 'barrios-renta', h: 'Renta neta media por hogar, ' + C[REF].barrios.rentaAnio, k: 'renta', fmt: function (v) { return entero(v) + ' €'; },
        pie: function (b) { return b.rentaSecc + ' secciones'; } }
    ].forEach(function (g) {
      const art = el('article', 'rango');
      art.id = g.id;
      art.appendChild(el('h3', 'hecho__h', g.h));
      let lo = Infinity, hi = 0;
      [REF, AQUI].forEach(function (id) { const r = C[id].barrios[g.k]; lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); });
      const pad = (hi - lo) * 0.04;
      lo -= pad; hi += pad;
      const pos = function (v) { return ((v - lo) / (hi - lo) * 100).toFixed(2) + '%'; };
      [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (c) {
        const b = C[c[0]].barrios, r = b[g.k];
        const tope = g.k === 'renta' && b.rentaTope;
        const fila = el('div', 'rango__fila');
        fila.dataset.quien = c[1];
        fila.appendChild(el('span', 'anios__q', NOMBRE[c[0]]));
        const pista = el('span', 'rango__pista');
        pista.setAttribute('role', 'img');
        pista.setAttribute('aria-label', NOMBRE[c[0]] + ': de ' + g.fmt(r[0]) + ' a ' + (tope ? 'al menos ' : '') + g.fmt(r[1]));
        const seg = el('i', 'rango__seg');
        seg.style.left = pos(r[0]);
        seg.style.width = 'calc(' + pos(r[1]) + ' - ' + pos(r[0]) + ')';
        pista.appendChild(seg);
        [[r[0], 'lo'], [r[1], 'hi']].forEach(function (p) {
          const d = el('b', 'rango__punto rango__punto--' + p[1]);
          d.style.left = pos(p[0]);
          pista.appendChild(d);
          const t = el('span', 'rango__v rango__v--' + p[1], (p[1] === 'hi' && tope ? '≥ ' : '') + g.fmt(p[0]));
          t.style.left = pos(p[0]);
          pista.appendChild(t);
        });
        fila.appendChild(pista);
        fila.appendChild(el('span', 'anios__v', tope ? '—' : '×' + num(r[1] / r[0], 2)));
        art.appendChild(fila);
      });
      art.appendChild(el('p', 'anios__pie', 'A la derecha, cuántas veces el extremo alto es el bajo. Parla: ' +
        g.pie(C[REF].barrios) + '. ' + NOMBRE[AQUI] + ': ' + g.pie(C[AQUI].barrios) + '.'));
      cont.appendChild(art);
    });
  }

  function publica() {
    const cp = C[REF], ca = C[AQUI];
    pareja($('#publica-cifras'), 'Viviendas públicas de la Comunidad', function (v) { return num(v, 2); }, 'avs',
      function (id) { return 'viviendas de la Agencia de Vivienda Social por cada 1.000 habitantes: ' + entero(C[id].avs.viv) + ' en total'; });

    const suma = function (xs) { return xs.reduce(function (s, v) { return s + v; }, 0); };
    const plan = function (id) {
      const u = C[id].publica;
      return u.planVive ? 'está entre las doce localidades con viviendas del Plan Vive'
        : u.solucionJoven ? 'no tiene viviendas del Plan Vive, pero está entre las ciudades con obras próximas de Solución Joven'
        : 'no está entre las doce localidades con viviendas del Plan Vive ni entre las de obras próximas de Solución Joven';
    };
    const conc = function (x) { return x.ok / x.sol * 100; };
    const porHog = function (id, x) { return x.ok / C[id].censo.alquiler * 1000; };
    hechos('#publica-hechos', [
      { id: 'avs-adjudicadas', titulo: 'Viviendas de la Agencia adjudicadas a nuevos inquilinos, 2023-2025', sentido: 'mas',
        pie: 'Viviendas que ya eran de la Agencia y que quedan libres y se entregan a otro hogar.',
        v: function (id) { return suma(C[id].publica.adj); }, fmt: function (v) { return entero(v); },
        nota: 'Por años, 2023, 2024 y 2025: ' + cp.publica.adj.join(', ') + ' en Parla y ' + ca.publica.adj.join(', ') +
          ' en ' + NOMBRE[AQUI] + '.' },
      { id: 'plan-vive', titulo: 'El Plan Vive en agosto de 2026',
        pie: 'El programa de alquiler asequible de la Comunidad de Madrid.',
        v: function (id) { return C[id].publica.planVive ? 1 : 0; }, fmt: function (v) { return v ? 'Sí' : 'No'; }, barra: false,
        nota: 'Parla ' + plan(REF) + '. ' + NOMBRE[AQUI] + ' ' + plan(AQUI) + '.' },
      { id: 'ayudas-alquiler', titulo: 'Ayudas al alquiler concedidas por 1.000 hogares de alquiler, 2023', sentido: 'mas',
        pie: 'Las dos ayudas de la Comunidad de 2023, a jóvenes y a hogares con pocos recursos o mayores de 65, entre los hogares de alquiler del Censo.',
        v: function (id) { return porHog(id, C[id].publica.ayudas2023); }, fmt: function (v) { return num(v, 1); },
        nota: 'Parla: ' + entero(cp.publica.ayudas2023.ok) + ' concedidas de ' + entero(cp.publica.ayudas2023.sol) +
          ' pedidas, el ' + pct(conc(cp.publica.ayudas2023)) + '. ' + NOMBRE[AQUI] + ': ' + entero(ca.publica.ayudas2023.ok) +
          ' de ' + entero(ca.publica.ayudas2023.sol) + ', el ' + pct(conc(ca.publica.ayudas2023)) + '.' },
      { id: 'bono-joven', titulo: 'Bono Alquiler Joven concedido por 1.000 hogares de alquiler, 2022', sentido: 'mas',
        pie: 'La ayuda estatal para menores de 35 años, que gestiona la Comunidad.',
        v: function (id) { return porHog(id, C[id].publica.bono2022); }, fmt: function (v) { return num(v, 1); },
        nota: 'Parla: ' + entero(cp.publica.bono2022.ok) + ' concedidos de ' + entero(cp.publica.bono2022.sol) +
          ' pedidos, el ' + pct(conc(cp.publica.bono2022)) + '. ' + NOMBRE[AQUI] + ': ' + entero(ca.publica.bono2022.ok) +
          ' de ' + entero(ca.publica.bono2022.sol) + ', el ' + pct(conc(ca.publica.bono2022)) + '.' }
    ]);
  }

  function desahucios() {
    const P = V.partidos;
    const pp = P[C[REF].partido], pa = P[C[AQUI].partido];
    const mismo = C[AQUI].partido === C[REF].partido;
    const ult = pp.total.length - 1;
    function quienes(pj) { return pj.municipios.length === 1 ? 'solo ' + pj.municipios[0] : lista(pj.municipios); }
    function lista(xs) { return xs.length === 1 ? xs[0] : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]; }
    $('#desahucios-intro').textContent = mismo
      ? 'Los juzgados cuentan por partido judicial, y Parla y ' + NOMBRE[AQUI] + ' comparten el mismo: las cifras de esta sección son las de las dos ciudades juntas.'
      : 'Los juzgados cuentan por partido judicial, no por ciudad. El de Parla incluye Parla y Pinto; el de ' +
        NOMBRE[AQUI] + ', ' + quienes(pa) + '.';

    pareja($('#desahucios-cifras'), 'Demandas por alquiler', function (v) { return num(v, 1); }, 'demandas',
      function (id) {
        const pj = P[C[id].partido];
        return 'demandas por alquiler por cada 100.000 habitantes en 2025: ' + entero(pj.demandas[ult]) +
          ' en el año, ' + num(pj.demandas[ult] / 52, 1) + ' a la semana';
      });

    const desde = V.lanzDesde;
    const etiquetas = pp.total.map(function (_, i) { return String(desde + i); });
    const tasa = function (xs, pj) { return xs.map(function (v, i) { return v / pj.pob[i] * 1e5; }); };
    const marcas = function (n, e) { const o = []; for (let i = 0; i < n; i += e ? 4 : 2) o.push(i); return o; };

    const dem = [];
    if (!mismo) dem.push({ nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: tasa(pa.demandas, pa) });
    dem.push({ nombre: 'Parla', quien: 'referencia', v: tasa(pp.demandas, pp) });
    linea($('#demandas-graf'), {
      etiquetas: etiquetas,
      series: dem,
      paso: function (mx) { return mx > 200 ? 100 : 50; },
      fmtEje: function (v) { return entero(v); },
      fmtValor: function (v) { return num(v, 1); },
      marcasX: marcas,
      descripcion: 'Demandas por alquiler por 100.000 habitantes de 2013 a 2025, por partido judicial.',
      leyenda: 'Juicios verbales por alquiler que entran en los juzgados, por cada 100.000 habitantes del partido judicial.'
    });

    const R = V.region;
    const lz = [{ nombre: 'Comunidad de Madrid', corto: 'Comunidad', quien: 'region', v: tasa(R.total, R) }];
    if (!mismo) lz.push({ nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: tasa(pa.total, pa) });
    lz.push({ nombre: 'Parla', quien: 'referencia', v: tasa(pp.total, pp) });
    linea($('#desahucios-graf'), {
      etiquetas: etiquetas,
      series: lz,
      paso: function (mx) { return mx > 120 ? 50 : 25; },
      fmtEje: function (v) { return entero(v); },
      fmtValor: function (v) { return num(v, 1); },
      marcasX: marcas,
      descripcion: 'Desahucios practicados por 100.000 habitantes de 2013 a 2025, por partido judicial.',
      leyenda: 'Desahucios practicados por cada 100.000 habitantes. Parla en 2025: ' + entero(pp.total[ult]) +
        ' en el partido, ' + entero(pp.lau[ult]) + ' por alquiler y ' + entero(pp.hipoteca[ult]) + ' por hipoteca.' +
        (mismo ? '' : ' ' + NOMBRE[AQUI] + ': ' + entero(pa.total[ult]) + ', ' + entero(pa.lau[ult]) +
          ' por alquiler y ' + entero(pa.hipoteca[ult]) + ' por hipoteca.')
    });

    hechos('#desahucios-hechos', [
      { id: 'demandas', titulo: 'Demandas por alquiler por 1.000 hogares de alquiler', sentido: 'menos',
        pie: 'Las demandas de 2025 entre los hogares que vivían de alquiler en el Censo de 2021.',
        v: function (id) { return m(id).demandasHog; }, fmt: function (v) { return num(v, 2); } }
    ]);

    const part = function (id) {
      const pj = P[C[id].partido];
      return pj.municipios.length === 1 ? 'el de ' + NOMBRE[id] + ' es solo ' + NOMBRE[id]
        : 'el de ' + pj.municipios[0] + ' suma ' + lista(pj.municipios) + ' (' + entero(pj.pob[ult]) + ' habitantes)';
    };
    $('#metodo-partido').textContent =
      'Los desahucios y las demandas los cuenta el Consejo General del Poder Judicial por partido judicial. ' +
      'El de Parla suma Parla y Pinto (' + entero(pp.pob[ult]) + ' habitantes)' +
      (mismo ? '.' : '; ' + part(AQUI) + '.') +
      ' Se usa la composición de 2026 para todos los años. En 2025 parte de los desahucios los practicaron los ' +
      'nuevos servicios comunes de los tribunales de instancia, y están sumados.';
  }

  function parque() {
    const cp = C[REF], ca = C[AQUI];
    hechos('#parque-hechos', [
      { id: 'vacias', titulo: 'Viviendas vacías, 2021',
        pie: 'Sin contrato de luz o con un consumo mínimo durante todo 2020.',
        v: function (id) { return m(id).vacias; }, fmt: function (v) { return pct(v, 2); },
        nota: 'Parla: ' + entero(cp.censo.vacias) + ' de ' + entero(cp.censo.viviendas) + '. ' +
          NOMBRE[AQUI] + ': ' + entero(ca.censo.vacias) + ' de ' + entero(ca.censo.viviendas) + '.' },
      { id: 'antiguas', titulo: 'Viviendas en edificios de 1980 o antes',
        v: function (id) { return m(id).antes81; }, fmt: function (v) { return pct(v, 2); } },
      { id: 'hacinamiento', titulo: 'Hogares de 5 o más personas en 60 m² o menos', sentido: 'menos',
        v: function (id) { return m(id).hog5; }, fmt: function (v) { return pct(v, 2); },
        nota: 'Parla: ' + entero(cp.censo.hog5en60) + ' hogares. ' + NOMBRE[AQUI] + ': ' + entero(ca.censo.hog5en60) + '.' },
      { id: 'jovenes-padres', titulo: 'Jóvenes de 25 a 34 años que viven con sus padres, 2021', sentido: 'menos',
        v: function (id) { return C[id].hogares.pctConPadres; }, fmt: function (v) { return pct(v); },
        nota: 'Parla: ' + entero(cp.hogares.conPadres) + ' de ' + entero(cp.hogares.jovenes) + '. ' + NOMBRE[AQUI] + ': ' +
          entero(ca.hogares.conPadres) + ' de ' + entero(ca.hogares.jovenes) + '.' },
      { id: 'sin-ascensor', titulo: 'Viviendas en edificios de 4 o más plantas sin ascensor, 2011', sentido: 'menos',
        v: function (id) { return C[id].hogares.pctSinAscensor; }, fmt: function (v) { return pct(v); },
        nota: 'Parla: ' + entero(cp.hogares.sinAscensor) + ' de ' + entero(cp.hogares.viv2011) + ' viviendas principales. ' +
          NOMBRE[AQUI] + ': ' + entero(ca.hogares.sinAscensor) + ' de ' + entero(ca.hogares.viv2011) + '.' },
      { id: 'superficie', titulo: 'Superficie media de las viviendas',
        v: function (id) { return C[id].censo.superficie; }, fmt: function (v) { return num(v, 2) + ' m²'; } }
    ]);
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  function comun() {
    $('#sel-texto').textContent = NOMBRE[AQUI];
    /* Los nombres largos («Majadahonda») van más pequeños para caber en un móvil. */
    document.querySelector('.portada__titulo .t3').dataset.largo = NOMBRE[AQUI].length > 9 ? '1' : '0';
    document.querySelectorAll('[data-aqui]').forEach(function (n) { n.textContent = NOMBRE[AQUI]; });
    const vuelta = RUTAS ? RAIZ_WEB + AQUI + '/' : 'index.html#' + AQUI;
    document.querySelectorAll('.js-volver').forEach(function (a) { a.href = vuelta; });
    document.title = 'Una casa en Parla y una casa en ' + NOMBRE[AQUI] + ' · ' + D.NOMBRE_WEB;
  }

  function pintar() {
    window.LINEA.olvidar();
    comun();
    golpe();
    casas();
    comprar();
    alquilar();
    barrios();
    duenos();
    publica();
    desahucios();
    parque();
    if (window.INDICE) window.INDICE.refrescar({ ciudad: AQUI, nombre: NOMBRE[AQUI] });
  }

  const sel = $('#sel-municipio');
  D.MUNICIPIOS.filter(function (x) { return valida(x.id); }).forEach(function (x) {
    const o = document.createElement('option');
    o.value = x.id; o.textContent = x.nombre; o.selected = x.id === AQUI;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function () {
    AQUI = sel.value;
    try { localStorage.setItem('municipio', AQUI); } catch (e) { /* sin almacenamiento */ }
    enlace();
    pintar();
  });
  enlace();
  pintar();
})();

/* ═══════════════════════════════════════════════════════════════════════
   EN TRANSPORTE PÚBLICO · el mapa de tiempos de infraestructura.html
   Se elige a dónde se va (Atocha, Sol…) y cada mapa enseña su término
   municipal pintado por zonas de 10 minutos: capas semitransparentes que
   se cargan de color donde se tarda menos, sobre las manzanas del
   Catastro y las líneas de tren. Parla en azul y la ciudad elegida en tinta.

   Como los mapas de las carreteras: el mismo marco en los dos, cada uno
   con su escala para que su término lo llene (la barra de 1 km lo dice).
   El índice va en datos/transporte.js y cada ciudad en
   datos/transporte/<id>.js (los escribe herramientas/transporte/ciudad.py),
   en metros respecto al mismo centro que datos/mapa/<id>.js.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const I = window.INFRA;
  const T = window.TRANSPORTE;
  if (!I || !T) return;
  const REF = I.REF, NOMBRE = I.NOMBRE, $ = I.$;
  const SVG = 'http://www.w3.org/2000/svg';

  /* De entrada, Atocha: adonde llega el C-4 desde Parla. */
  let destino = Math.max(0, T.destinos.map(function (d) { return d.id; }).indexOf('atocha'));
  /* Con Cercanías («todo») o sin («sin»); en los dos cuentan Metro, Metro
     Ligero y autobuses. Los mapas van los cuatro a la vez; modo es el que
     se usa por defecto (la frase de arriba de la página lo cambia un
     momento a «tren»). */
  let modo = 'todo';

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function svg(tag, at) {
    const n = document.createElementNS(SVG, tag);
    Object.keys(at || {}).forEach(function (k) { n.setAttribute(k, at[k]); });
    return n;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function D() { return T.destinos[destino]; }

  /* Los tiempos vienen como texto (herramientas/transporte/aligerar.py):
     dos caracteres por celda en base 36, «--» sin tiempo; y el margen,
     otros dos con lo que se separan el percentil 25 y el 75 de la mediana. */
  const leidos = new WeakMap();
  function tiempos(v) {
    if (!leidos.has(v)) {
      const t = [];
      for (let k = 0; k < v.t.length; k += 2) {
        const x = v.t.substr(k, 2);
        t.push(x === '--' ? null : parseInt(x, 36));
      }
      leidos.set(v, t);
    }
    return leidos.get(v);
  }
  function margen(v, k) {
    const a = v.m.charAt(2 * k), b = v.m.charAt(2 * k + 1);
    return [a === '-' ? null : parseInt(a, 36), b === '-' ? null : parseInt(b, 36)];
  }

  /* Cada ciudad, con un <script>, para que funcione también abriendo el
     HTML desde la carpeta. */
  const cargando = {};
  function cargar(id) {
    window.TRANSPORTE_CIUDAD = window.TRANSPORTE_CIUDAD || {};
    if (T.ciudades.indexOf(id) < 0) return Promise.resolve(null);
    if (window.TRANSPORTE_CIUDAD[id]) return Promise.resolve(window.TRANSPORTE_CIUDAD[id]);
    if (cargando[id]) return cargando[id];
    cargando[id] = new Promise(function (ok, mal) {
      const s = document.createElement('script');
      s.src = 'datos/transporte/' + id + '.js';
      s.onload = function () { window.TRANSPORTE_CIUDAD[id] ? ok(window.TRANSPORTE_CIUDAD[id]) : mal(new Error(id)); };
      s.onerror = function () { mal(new Error(id)); };
      document.head.appendChild(s);
    });
    return cargando[id];
  }

  /* ── Lo fijo: destinos, casilla, fuentes ──────────────────────────── */

  function fijo() {
    const cont = $('#tp-destinos');
    vaciar(cont);
    T.destinos.forEach(function (d, k) {
      const b = el('button', 'tp__min', d.nombre);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(k === destino));
      b.addEventListener('click', function () {
        destino = k;
        cont.querySelectorAll('.tp__min').forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === k)); });
        pintar();
      });
      cont.appendChild(b);
    });
    const f = $('#tp-fuentes');
    vaciar(f);
    f.appendChild(document.createTextNode('Fuentes: '));
    T.fuentes.forEach(function (x, k) {
      if (k) f.appendChild(document.createTextNode('; '));
      const a = el('a', null, x[0]);
      a.href = x[1];
      f.appendChild(a);
    });
    f.appendChild(document.createTextNode('. Horarios del martes ' + fecha(T.fecha) + '.'));
  }
  function fecha(iso) {
    const M = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const p = iso.split('-');
    return Number(p[2]) + ' de ' + M[Number(p[1]) - 1] + ' de ' + p[0];
  }

  /* La leyenda: cada tramo con tantas capas como lleva en el mapa. */
  function leyenda() {
    const u = D().umbrales;
    const ley = $('#tp-ley');
    vaciar(ley);
    u.forEach(function (v, k) {
      const li = el('li', 'tp__l');
      const i = el('i', 'tp__c');
      i.style.setProperty('--capas', String(u.length - k));
      li.appendChild(i);
      li.appendChild(el('span', null, k ? 'De ' + u[k - 1] + ' a ' + v + ' min' : 'Hasta ' + v + ' min'));
      ley.appendChild(li);
    });
    const mas = el('li', 'tp__l');
    mas.appendChild(el('i', 'tp__c tp__c--nada'));
    mas.appendChild(el('span', null, 'Más de ' + u[u.length - 1] + ' o sin parada cerca'));
    ley.appendChild(mas);
    const tren = el('li', 'tp__l');
    tren.appendChild(el('i', 'tp__c tp__c--linea'));
    tren.appendChild(el('span', null, 'Cercanías'));
    ley.appendChild(tren);
    if ((T.obras || []).some(function (o) { return o.ciudad === REF || o.ciudad === I.AQUI; })) {
      const obra = el('li', 'tp__l');
      obra.appendChild(el('i', 'tp__c tp__c--obra'));
      obra.appendChild(el('span', null, 'Estación en obras, sin servicio'));
      ley.appendChild(obra);
    }
  }

  /* ── Un mapa ──────────────────────────────────────────────────────── */

  const ANCHO = 600, ALTO = 600, AIRE = 20;

  function mapa(cont, id, m, c, mo) {
    mo = mo || modo;
    vaciar(cont);
    if (!c) {
      cont.appendChild(el('p', 'tp__falta', 'Todavía no está calculado para ' + NOMBRE[id] +
        '. De momento solo están Parla y Getafe.'));
      return null;
    }
    /* El encuadre: donde hay viviendas (lo calcula ciudad.py con los
       edificios del Catastro), también las que quedan lejos del tren. Lo
       demás, campo y polígonos casi siempre, queda fuera del marco. */
    let x0 = c.encuadre[0], y0 = c.encuadre[1], x1 = c.encuadre[2], y1 = c.encuadre[3];
    /* Sin pasarse del término. */
    let l0 = Infinity, m0 = Infinity, l1 = -Infinity, m1 = -Infinity;
    m.limite.forEach(function (r) {
      r.forEach(function (p) {
        l0 = Math.min(l0, p[0]); l1 = Math.max(l1, p[0]);
        m0 = Math.min(m0, p[1]); m1 = Math.max(m1, p[1]);
      });
    });
    x0 = Math.max(x0, l0); y0 = Math.max(y0, m0); x1 = Math.min(x1, l1); y1 = Math.min(y1, m1);
    const mpp = Math.max((x1 - x0) / (ANCHO - 2 * AIRE), (y1 - y0) / (ALTO - 2 * AIRE));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const px = function (x) { return ANCHO / 2 + (x - cx) / mpp; };
    const py = function (y) { return ALTO / 2 - (y - cy) / mpp; };
    function trazo(anillos) {
      let d = '';
      anillos.forEach(function (r) {
        r.forEach(function (p, i) { d += (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1); });
        d += 'Z';
      });
      return d;
    }

    const d = svg('svg', { viewBox: '0 0 ' + ANCHO + ' ' + ALTO, class: 'tp__svg', role: 'img', overflow: 'hidden' });
    const ancho = cont.getBoundingClientRect().width;
    const kRot = ancho ? Math.min(2, Math.max(1, ANCHO / ancho)) : 1;
    d.appendChild(svg('path', { d: trazo(m.limite), class: 'tp__termino' }));
    d.appendChild(svg('path', { d: trazo(c.manzanas), class: 'tp__manzanas', 'fill-rule': 'evenodd' }));

    /* Las zonas, de la de más minutos a la de menos: cada una pinta encima
       de la anterior, así que el color se carga donde se tarda menos. */
    const u = D().umbrales, z = c.modos[mo][D().id].zonas;
    const capas = svg('g', { class: 'tp__zonas' });
    for (let k = u.length - 1; k >= 0; k--) {
      const r = z[String(u[k])];
      if (r && r.length) capas.appendChild(svg('path', { d: trazo(r), 'fill-rule': 'evenodd', class: 'tp__zona' }));
    }
    d.appendChild(capas);

    /* Las líneas de tren, cortadas por el término. */
    const recorte = 'tp-recorte-' + id;
    const cp = svg('clipPath', { id: recorte });
    cp.appendChild(svg('path', { d: trazo(m.limite) }));
    d.appendChild(cp);
    const lin = svg('g', { 'clip-path': 'url(#' + recorte + ')' });
    c.lineas.forEach(function (l) {
      let dl = '';
      l.c.forEach(function (p, i) { dl += (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1); });
      lin.appendChild(svg('path', { d: dl, class: 'tp__linea tp__linea--' + l.modo }));
    });
    d.appendChild(lin);
    d.appendChild(svg('path', { d: trazo(m.limite), class: 'tp__limite' }));
    const rot = svg('g', { class: 'tp__rotulos' });
    /* Con nombre, solo las de Cercanías; las de Metro y Metro Ligero son
       muchas y muy juntas, y van como puntos. */
    c.estaciones.forEach(function (e) {
      const cer = e.modos.indexOf('cercanias') >= 0;
      rot.appendChild(svg('circle', { cx: px(e.x).toFixed(1), cy: py(e.y).toFixed(1), r: cer ? 4 : 2.2,
        class: 'tp__est' + (cer ? '' : ' tp__est--metro') }));
      if (!cer) return;
      /* Si el nombre no cabe a la derecha, va a la izquierda de la estación
         (a su tamaño en pantalla: 6,5 px por letra, más o menos). */
      const x = px(e.x), largo = e.nombre.split(' / ')[0].length * 6.5 * kRot;
      const izq = x + 7 + largo > ANCHO - 6;
      const t = svg('text', { x: (x + (izq ? -7 : 7)).toFixed(1), y: (py(e.y) + 4).toFixed(1),
        class: 'tp__rest', 'text-anchor': izq ? 'end' : 'start' });
      t.textContent = e.nombre.split(' / ')[0];
      rot.appendChild(t);
    });
    /* Las estaciones en obras, en amarillo: no tienen horario, así que no
       cuentan en los tiempos. */
    (T.obras || []).filter(function (o) { return o.ciudad === id; }).forEach(function (o) {
      rot.appendChild(svg('circle', { cx: px(o.x).toFixed(1), cy: py(o.y).toFixed(1), r: 6, class: 'tp__obra' }));
      const x = px(o.x), texto = o.nombre + ' · en obras';
      const izq = x + 9 + texto.length * 6.5 * kRot > ANCHO - 6;
      const t = svg('text', { x: (x + (izq ? -9 : 9)).toFixed(1), y: (py(o.y) + 4).toFixed(1),
        class: 'tp__rest tp__rest--obra', 'text-anchor': izq ? 'end' : 'start' });
      t.textContent = texto;
      rot.appendChild(t);
    });
    d.appendChild(rot);

    const km = 1000 / mpp;
    d.appendChild(svg('path', { d: 'M12 ' + (ALTO - 14) + 'h' + km.toFixed(1), class: 'tp__km' }));
    const tk = svg('text', { x: 12, y: ALTO - 20, class: 'tp__km-t' });
    tk.textContent = '1 km';
    d.appendChild(tk);

    const t = tiempos(c.modos[mo][D().id]).filter(function (v) { return v != null; });
    const r = { mn: Math.min.apply(null, t), mx: Math.max.apply(null, t), est: estacion(c, mo) };
    d.setAttribute('aria-label', NOMBRE[id] + ', hasta ' + D().nombre + ': de ' + r.mn + ' a ' + r.mx +
      ' minutos según el punto.');
    cont.appendChild(d);
    escala(d);
    tip(cont, d, id, c, { px: px, py: py, mpp: mpp, cx: cx, cy: cy, mo: mo });
    return r;
  }

  /* El mapa se encoge con la pantalla, pero los rótulos no: --k es lo que
     hay que agrandarlos para que midan lo mismo que en el ancho de diseño. */
  function escala(d) {
    const w = d.getBoundingClientRect().width;
    const k = w ? Math.min(2, Math.max(1, ANCHO / w)) : 1;
    d.style.setProperty('--k', k.toFixed(2));
  }
  let espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () { document.querySelectorAll('.tp__svg').forEach(escala); }, 150);
  });

  /* El tiempo desde la estación de Cercanías más cercana al ayuntamiento:
     la celda más cercana a ella. */
  function estacion(c, mo) {
    const ay = c.ayuntamiento || [0, 0];
    const e = c.estaciones.filter(function (x) { return x.modos.indexOf('cercanias') >= 0; })
      .sort(function (a, b) { return Math.hypot(a.x - ay[0], a.y - ay[1]) - Math.hypot(b.x - ay[0], b.y - ay[1]); })[0];
    if (!e) return null;
    const tt = tiempos(c.modos[mo || modo][D().id]);
    let mejor = -1, dmin = Infinity;
    c.celdas.forEach(function (q, k) {
      const x = c.origen[0] + q[0] * T.celda, y = c.origen[1] + q[1] * T.celda;
      const dd = Math.hypot(x - e.x, y - e.y);
      if (dd < dmin) { dmin = dd; mejor = k; }
    });
    return mejor >= 0 ? { nombre: e.nombre.split(' / ')[0], t: tt[mejor] } : null;
  }

  /* Al pasar el ratón o el dedo: los minutos de ese punto. */
  function tip(cont, d, id, c, g) {
    const pos = {};
    c.celdas.forEach(function (q, k) { pos[q[0] + ',' + q[1]] = k; });
    const t = el('div', 'graf__tip tp__tip');
    t.hidden = true;
    cont.appendChild(t);
    function mostrar(e) {
      const rs = d.getBoundingClientRect();
      const sx = (e.clientX - rs.left) * ANCHO / rs.width, sy = (e.clientY - rs.top) * ALTO / rs.height;
      const x = g.cx + (sx - ANCHO / 2) * g.mpp, y = g.cy - (sy - ALTO / 2) * g.mpp;
      const k = pos[Math.round((x - c.origen[0]) / T.celda) + ',' + Math.round((y - c.origen[1]) / T.celda)];
      if (k === undefined) { t.hidden = true; return; }
      const v = c.modos[g.mo][D().id];
      const tk = tiempos(v)[k], mg = margen(v, k);
      vaciar(t);
      t.appendChild(el('p', 'graf__tip-h', 'Desde aquí hasta ' + D().nombre));
      /* Sin tiempo: no hay parada a menos de 1.200 m andando (con autobuses,
         o casi siempre; sin ellos, de tren). */
      t.appendChild(el('p', 'tp__tip-v', tk == null
        ? 'Sin parada a menos de 1,2 km andando'
        : tk + ' min'));
      if (tk != null && mg[0] != null && mg[1] != null && mg[0] + mg[1] > 0) {
        t.appendChild(el('p', 'tp__tip-m', 'Entre ' + (tk - mg[0]) + ' y ' + (tk + mg[1]) + ' según la hora de salida'));
      }
      t.hidden = false;
      const rc = cont.getBoundingClientRect();
      const ancho = t.offsetWidth;
      t.style.left = Math.max(0, Math.min(rc.width - ancho, e.clientX - rc.left - ancho / 2)) + 'px';
      t.style.top = (e.clientY - rc.top - 14) + 'px';
    }
    /* Con ratón, sigue al puntero. Con el dedo, un toque lo enseña y otro
       toque (en el mapa, en el propio cuadro o fuera) lo quita, y al mover
       la página se va solo: si no, tapa el mapa y no hay manera de quitarlo. */
    d.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') mostrar(e); });
    d.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') t.hidden = true; });
    d.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      if (!t.hidden) { t.hidden = true; return; }
      mostrar(e);
    });
    t.addEventListener('pointerdown', function () { t.hidden = true; });
    document.addEventListener('pointerdown', function (e) { if (!cont.contains(e.target)) t.hidden = true; });
    window.addEventListener('scroll', function () { t.hidden = true; }, { passive: true });
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  function dato(sel, r) {
    const n = $(sel);
    n.textContent = !r ? '' : (r.est && r.est.t != null ? r.est.t + ' min desde la estación de ' + r.est.nombre + ' · ' : '') +
      'de ' + r.mn + ' a ' + r.mx + ' según el punto';
  }
  /* Desde la estación de Cercanías de cada ciudad: un día normal y sin la
     línea principal. */
  function frase(r) {
    const n = $('#tp-frase');
    vaciar(n);
    const t = function (k) { return r[k] && r[k].est && r[k].est.t != null ? r[k].est.t : null; };
    if (t('parlatodo') == null || t('parlasin') == null) return;
    n.appendChild(document.createTextNode('Hasta ' + D().nombre + ', desde la estación de Parla se tardan ' +
      t('parlatodo') + ' minutos un día normal y '));
    n.appendChild(el('b', 'parla', t('parlasin') + ' sin ' + laLinea(REF)));
    n.appendChild(document.createTextNode(t('aquitodo') != null && t('aquisin') != null
      ? '. Desde la de ' + r.aquitodo.est.nombre + ', ' + t('aquitodo') + ' y ' + t('aquisin') + ' sin ' + laLinea(I.AQUI) + '.'
      : '.'));
  }


  /* La frase de arriba de la página habla del coche; aquí se le suma el
     tren hasta Atocha, siempre solo tren, salga el destino que salga abajo. */
  function golpe() {
    const n = $('#golpe');
    if (!n) return;
    let s = $('#golpe-tren');
    if (!s) { s = el('span', null); s.id = 'golpe-tren'; n.appendChild(s); }
    const ato = T.destinos.filter(function (d) { return d.id === 'atocha'; })[0];
    const tAto = function (id) {
      const c = window.TRANSPORTE_CIUDAD && window.TRANSPORTE_CIUDAD[id];
      if (!c || !ato) return null;
      const m0 = modo, d0 = destino;
      modo = 'tren'; destino = T.destinos.indexOf(ato);
      const r = estacion(c);
      modo = m0; destino = d0;
      return r;
    };
    const p = tAto(REF), a = tAto(I.AQUI);
    vaciar(s);
    if (!p) return;
    s.appendChild(document.createTextNode(' En tren, de la estación de Parla a Atocha se tardan '));
    s.appendChild(el('b', 'parla', p.t + ' minutos'));
    s.appendChild(document.createTextNode(a ? '; de la de ' + a.nombre + ', ' + a.t + '.' : '.'));
  }

  /* ── El tren a mano y el abono: las once ciudades, sin mapas ──────── */

  const IDS = Object.keys(NOMBRE);
  const LETRA = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  function num(n, d) { return n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pareja(sel, v, fmt, pie) {
    const cont = $(sel);
    vaciar(cont);
    [[REF, 'referencia'], [I.AQUI, 'aqui']].forEach(function (g) {
      const c = el('div', 'tp-cifra');
      c.dataset.quien = g[1];
      c.appendChild(el('p', 'tp-cifra__quien', NOMBRE[g[0]]));
      c.appendChild(el('p', 'tp-cifra__v', fmt(v(g[0]))));
      c.appendChild(el('p', 'tp-cifra__que', pie(g[0])));
      cont.appendChild(c);
    });
  }
  /* ── Un día normal: el tren a mano, hasta el centro, las plazas ───── */

  /* La línea principal de cada ciudad (capacidad.py): la de tren, Metro o
     Metro Ligero con más plazas hacia Madrid. En Parla, la C-4. */
  function principal(id) {
    const R = T.redundancia && T.redundancia.ciudades;
    if (!R || !R[id]) return null;
    return R[id].lineas.filter(function (l) { return l[0] !== 'autobús'; })
      .sort(function (a, b) { return b[2] - a[2]; })[0];
  }
  /* «la C-4», «el Metro 10», sin partirse al final de la línea. */
  function laLinea(id) {
    const l = principal(id);
    if (!l) return '';
    return (/^C-/.test(l[0]) ? 'la\u00a0' : 'el\u00a0') + l[0].replace('-', '\u2011').replace(' ', '\u00a0');
  }
  /* Las plazas hacia Madrid de 7 a 9: todas y sin la línea principal. */
  function plazas(id) {
    const R = T.redundancia && T.redundancia.ciudades;
    if (!R || !R[id]) return null;
    const total = R[id].lineas.reduce(function (s, l) { return s + l[2]; }, 0);
    return [total, total - principal(id)[2]];
  }
  function deLas(ids, v, mas) {
    const orden = ids.slice().sort(function (a, b) { return mas ? v(b) - v(a) : v(a) - v(b); });
    const k = orden.indexOf(REF) + 1, N = LETRA[ids.length];
    return k === ids.length ? 'la última de las ' + N : 'la ' + k + '.ª de las ' + N;
  }
  const ATOCHA = 'atocha';

  function cobertura() {
    const C = T.cobertura && T.cobertura.ciudades;
    if (!C || !C[REF] || !C[I.AQUI]) return;
    const p = function (id) { return C[id] ? C[id].pct['15'] : null; };
    pareja('#cob-cifras', p, function (v) { return num(v, 1) + ' %'; }, function (id) {
      return 'de las viviendas, a 15 minutos andando de una estación: ' + C[id].cerca['15'].toLocaleString('es-ES') +
        ' de ' + C[id].viviendas.toLocaleString('es-ES');
    });
    const ids = IDS.filter(function (id) { return C[id]; });
    $('#cob-nota').textContent = 'Parla es ' + deLas(ids, p, true) + ': la mitad de sus casas queda a más de un ' +
      'cuarto de hora andando del tren. A 10 minutos, el ' + num(C[REF].pct['10'], 1) + ' % en Parla y el ' +
      num(C[I.AQUI].pct['10'], 1) + ' % en ' + NOMBRE[I.AQUI] + '; a 5, el ' + num(C[REF].pct['5'], 1) +
      ' % y el ' + num(C[I.AQUI].pct['5'], 1) + ' %.';
  }

  function casa() {
    const K = T.casa;
    if (!K || !K[REF] || !K[I.AQUI]) return;
    const v = function (id) { return K[id] && K[id].todo[ATOCHA] ? K[id].todo[ATOCHA][0] : null; };
    pareja('#casa-cifras', v, function (x) { return x == null ? '—' : String(x); }, function () {
      return 'minutos hasta Atocha desde la vivienda mediana';
    });
    const ids = IDS.filter(function (id) { return v(id) != null; });
    const c = function (id) { return window.TRANSPORTE_CIUDAD && window.TRANSPORTE_CIUDAD[id]; };
    const est = function (id) {
      if (!c(id)) return null;
      const d0 = destino;
      destino = T.destinos.map(function (d) { return d.id; }).indexOf(ATOCHA);
      const e = estacion(c(id), 'todo');
      destino = d0;
      return e && e.t != null ? e : null;
    };
    const ep = est(REF), ea = est(I.AQUI);
    $('#casa-nota').textContent = 'Parla es ' + deLas(ids, v, false) + '. ' +
      (ep && ea ? 'Desde la estación se tarda ' + ep.t + ' minutos en Parla y ' + ea.t + ' en ' + NOMBRE[I.AQUI] +
        ': llegar hasta ella desde casa suma ' + (v(REF) - ep.t) + ' minutos en Parla y ' + (v(I.AQUI) - ea.t) +
        ' en ' + NOMBRE[I.AQUI] + '. ' : '') +
      (Math.round(K[REF].todo[ATOCHA][1]) === 0 && Math.round(K[I.AQUI].todo[ATOCHA][1]) === 0
        ? 'Casi ninguna vivienda de Parla ni de ' + NOMBRE[I.AQUI] + ' queda a más de una hora de Atocha.'
        : 'A más de una hora de Atocha están ' + num(K[REF].todo[ATOCHA][1], 0) + ' de cada 100 viviendas de Parla y ' +
          num(K[I.AQUI].todo[ATOCHA][1], 0) + ' de ' + NOMBRE[I.AQUI] + '.');
  }

  function plazasCifras() {
    const R = T.redundancia && T.redundancia.ciudades;
    if (!R || !R[REF] || !R[I.AQUI]) return;
    const pob = function (id) { return I.A[id] && I.A[id].pob; };
    const v = function (id) { return plazas(id) && pob(id) ? 1000 * plazas(id)[0] / pob(id) : null; };
    pareja('#plazas-cifras', v, function (x) { return num(x, 0); }, function (id) {
      return 'plazas por hora por cada 1.000 vecinos: ' + I.entero(plazas(id)[0]) + ' en total';
    });
    const ids = IDS.filter(function (id) { return v(id) != null; });
    const pp = function (id) { return num(plazas(id)[0] / R[id].vanMadrid, 1); };
    const deC4 = LETRA[Math.round(10 * (1 - plazas(REF)[1] / plazas(REF)[0]))];
    const unas = function (x) { return I.entero(Math.round(x / 50) * 50); };
    $('#plazas-nota').textContent = 'Parla es ' + deLas(ids, v, true) + '. De cada diez de sus plazas, ' + deC4 +
      ' son de la C-4. Van a Madrid a esa hora unas ' + unas(R[REF].vanMadrid) + ' personas de Parla y ' + unas(R[I.AQUI].vanMadrid) +
      ' de ' + NOMBRE[I.AQUI] + ', en cualquier medio: ' + pp(REF) + ' plazas por persona en Parla y ' + pp(I.AQUI) +
      ' en ' + NOMBRE[I.AQUI] + '.';
  }

  /* ── Si falla el tren: lo demás sin la línea principal, en una tabla ─ */

  function tabla() {
    const cont = $('#falla-tabla');
    if (!cont) return;
    vaciar(cont);
    const C = T.cobertura && T.cobertura.ciudades, K = T.casa;
    const filas = [
      { q: 'Viviendas con una estación a 15 minutos andando', v: function (id) {
        return C && C[id] && C[id].pctSin ? [C[id].pct['15'], C[id].pctSin['15']] : null;
      }, f: function (x) { return num(x, 0) + ' %'; } },
      { q: 'De la vivienda mediana a Atocha', v: function (id) {
        return K && K[id] && K[id].sin ? [K[id].todo[ATOCHA][0], K[id].sin[ATOCHA][0]] : null;
      }, f: function (x) { return x == null ? '—' : x + ' min'; } }
    ];
    const t = el('table', 'falla-t');
    const th = el('thead');
    /* Cada dato, con su pregunta en una fila a todo el ancho y las cifras
       debajo: en el móvil no cabe una columna de preguntas al lado. */
    const tr0 = el('tr');
    [[REF, 'referencia'], [I.AQUI, 'aqui']].forEach(function (g) {
      const h = el('th', null, NOMBRE[g[0]]);
      h.dataset.quien = g[1];
      h.colSpan = 3;
      tr0.appendChild(h);
    });
    th.appendChild(tr0);
    const tr1 = el('tr', 'falla-t__sub');
    [REF, I.AQUI].forEach(function (id) {
      tr1.appendChild(el('th', null, 'Un día normal'));
      tr1.appendChild(el('th', 'falla-t__flecha', ''));
      tr1.appendChild(el('th', null, 'Sin ' + laLinea(id)));
    });
    th.appendChild(tr1);
    t.appendChild(th);
    const tb = el('tbody');
    filas.forEach(function (fi) {
      const trq = el('tr', 'falla-t__fq');
      const q = el('th', 'falla-t__q', fi.q);
      q.colSpan = 6;
      q.scope = 'rowgroup';
      trq.appendChild(q);
      tb.appendChild(trq);
      const tr = el('tr', 'falla-t__fv');
      [[REF, 'referencia'], [I.AQUI, 'aqui']].forEach(function (g) {
        const v = fi.v(g[0]);
        const sinC = el('td', 'falla-t__sin', v ? fi.f(v[1]) : '—');
        /* Y cuánto cambia, en %: +89 % son 89 de cada 100 minutos más. */
        if (v && v[0]) {
          const d = Math.round(100 * (v[1] - v[0]) / v[0]);
          sinC.appendChild(el('span', 'falla-t__dif', (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + '\u00a0%'));
        }
        [el('td', 'falla-t__con', v ? fi.f(v[0]) : '—'), el('td', 'falla-t__flecha', '→'), sinC]
          .forEach(function (n) { n.dataset.quien = g[1]; tr.appendChild(n); });
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    cont.appendChild(t);
  }

  /* Si falla el tren (capacidad.py): las plazas que salen
     cada hora hacia Madrid de 7 a 9 y lo que queda sin la línea de tren o
     de Metro que más lleva. No depende del destino ni de la casilla. */
  function falla() {
    const R = T.redundancia && T.redundancia.ciudades;
    if (!R || !R[REF] || !R[I.AQUI]) return;
    const ent = I.entero;
    const total = function (id) { return R[id].lineas.reduce(function (s, l) { return s + l[2]; }, 0); };
    /* La principal: la línea de tren o Metro con más plazas. */
    const principal = function (id) {
      return R[id].lineas.filter(function (l) { return l[0] !== 'autobús'; })
        .sort(function (a, b) { return b[2] - a[2]; })[0];
    };
    const queda = function (id) { return total(id) - principal(id)[2]; };
    const pct = function (id) { return 100 * queda(id) / total(id); };
    /* Sin partir «C-10» ni «Metro 10» al final de la línea. */
    const del = function (l) {
      return (/^C-/.test(l) ? 'la\u00a0' : 'el\u00a0') + l.replace('-', '\u2011').replace(' ', '\u00a0');
    };
    const sin = function (id) { return 'sin ' + del(principal(id)[0]); };

    pareja('#falla-cifras', pct, function (v) { return num(v, 0) + '\u00a0%'; }, function (id) {
      return 'de las plazas hacia Madrid quedan ' + sin(id) + ': ' + ent(queda(id)) + ' de ' + ent(total(id)) + ' cada hora';
    });
    const ids = IDS.filter(function (id) { return R[id]; }).sort(function (a, b) { return pct(b) - pct(a); });
    const cont = $('#falla-filas');
    vaciar(cont);
    ids.forEach(function (id) {
      const li = el('li', 'mun__fila');
      li.dataset.quien = id === REF ? 'referencia' : id === I.AQUI ? 'aqui' : 'otro';
      li.appendChild(el('span', 'mun__q', NOMBRE[id] + ', ' + sin(id)));
      li.appendChild(el('span', 'mun__v', num(pct(id), 0) + ' %'));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = pct(id).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      cont.appendChild(li);
    });

    /* Qué sale de cada ciudad, dicho con palabras. */
    const lista = function (id) {
      const p = R[id].lineas.map(function (l) {
        return l[0] === 'autobús' ? num(l[1], 0) + ' autobuses' : del(l[0]) + ' (' + num(l[1], l[1] % 1 ? 1 : 0) + ' trenes)';
      });
      return p.length > 1 ? p.slice(0, -1).join(', ') + ' y ' + p[p.length - 1] : p[0];
    };
    const porPersona = function (id) { return num(queda(id) / R[id].vanMadrid, 2); };
    const lugar = ids.indexOf(REF) === ids.length - 1 ? 'Parla es la que menos conserva de las ' + LETRA[ids.length] + '. '
      : 'Parla es la ' + (ids.indexOf(REF) + 1) + '.ª de las ' + LETRA[ids.length] + ' en lo que conserva. ';
    $('#falla-nota').textContent = lugar + 'Cada hora salen hacia Madrid, de Parla, ' + lista(REF) + '; de ' +
      NOMBRE[I.AQUI] + ', ' + lista(I.AQUI) + '. Por cada persona que va a Madrid a esa hora quedan ' + porPersona(REF) +
      ' plazas en Parla ' + sin(REF) + ' y ' + porPersona(I.AQUI) + ' en ' + NOMBRE[I.AQUI] + ' ' + sin(I.AQUI) + '.';

    const pie = $('#falla-fuentes');
    vaciar(pie);
    pie.appendChild(document.createTextNode('Fuentes: horarios del '));
    const a1 = el('a', null, 'Consorcio Regional de Transportes de Madrid (GTFS)');
    a1.href = 'https://datos.crtm.es/';
    pie.appendChild(a1);
    pie.appendChild(document.createTextNode(', martes 27 de octubre de 2026; plazas por tren, de '));
    const a2 = el('a', null, 'Renfe');
    a2.href = T.redundancia.plazas.cercanias.fuente;
    pie.appendChild(a2);
    pie.appendChild(document.createTextNode('; gente que va a Madrid, '));
    const a3 = el('a', null, 'Ministerio de Transportes, estudio básico de movilidad');
    a3.href = T.redundancia.demanda.fuente;
    pie.appendChild(a3);
    pie.appendChild(document.createTextNode(', 16 de octubre de 2024.'));

    const P = T.redundancia.plazas;
    $('#falla-cautela').textContent = 'Cuentan los trenes, metros y autobuses que salen de la ciudad entre las 7 y ' +
      'las 9 y llegan a Madrid capital, divididos entre dos para dar la hora. Un tren cuenta en todas las ciudades ' +
      'en las que para: los de la C-4 que salen de Parla son los mismos que luego paran en Getafe. Plazas por ' +
      'vehículo, sentadas y de pie: ' + ent(P.cercanias.plazas) + ' por tren de Cercanías (un Civia de cinco coches; ' +
      'el horario no dice si un tren va doble, y se cuenta simple), ' + ent(P.metro10a.plazas) + ' por tren de la línea 10 entre Alcorcón y Madrid, ' +
      ent(P.metro10b.plazas) + ' en la de Alcobendas, ' + ent(P.metro11.plazas) + ' en la 11, ' + ent(P.ligero.plazas) +
      ' por Metro Ligero y ' + ent(P.bus.plazas) + ' por autobús; las de Metro y autobús son aproximadas. La gente que ' +
      'va a Madrid es la que sale de 7 a 9 en cualquier medio, también en coche, y viene de los teléfonos móviles. ' +
      'Los minutos sin la línea principal salen del mismo cálculo que el mapa de arriba, con los horarios de los ' +
      'autobuses, que no cuentan el tráfico: un día sin esa línea, con su gente en el autobús, se tardaría más.';
  }

  /* ── Los mapas, un día normal y sin la línea principal ───────────── */

  let pidiendo = 0, geo = null;
  function mapas() {
    if (!geo) return;
    const r = geo, res = {};
    [['parla', REF, r[0], r[2]], ['aqui', I.AQUI, r[1], r[3]]].forEach(function (g) {
      ['todo', 'sin'].forEach(function (mo) {
        res[g[0] + mo] = mapa($('#tj-' + g[0] + '-' + mo), g[1], g[2], g[3], mo);
        dato('#tj-dato-' + g[0] + '-' + mo, res[g[0] + mo]);
      });
    });
    frase(res);
  }

  function pintar() {
    const AQUI = I.AQUI, yo = ++pidiendo;
    leyenda();
    document.querySelectorAll('[data-linea]').forEach(function (n) {
      n.textContent = laLinea(n.dataset.linea === 'parla' ? REF : I.AQUI);
    });
    const fi = $('#falla-intro');
    if (fi && principal(REF) && principal(I.AQUI)) {
      fi.textContent = 'Lo de arriba, un día en que falla la línea de tren principal de cada ciudad, la que más ' +
        'plazas lleva hacia Madrid, con todo lo demás funcionando: las otras líneas de Cercanías, el Metro, el ' +
        'Metro Ligero y los autobuses. ' +
        (principal(I.AQUI)[0] === principal(REF)[0]
          ? 'En Parla y en ' + NOMBRE[I.AQUI] + ', ' + laLinea(REF) + ', que en Parla es la única línea de tren.'
          : 'En Parla, ' + laLinea(REF) + ', su única línea de tren; en ' + NOMBRE[I.AQUI] + ', ' + laLinea(I.AQUI) + '.');
    }
    cobertura();
    plazasCifras();
    tabla();
    falla();
    Promise.all([I.cargar(REF), I.cargar(AQUI), cargar(REF), cargar(AQUI)]).then(function (r) {
      if (yo !== pidiendo) return;
      geo = r;
      mapas();
      golpe();
      casa();
    }).catch(function () {
      $('#tj-parla-todo').textContent = 'No se pudo cargar el mapa.';
    });
  }

  fijo();
  I.alPintar(pintar);
  pintar();
})();

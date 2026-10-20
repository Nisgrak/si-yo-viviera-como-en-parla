/* ═══════════════════════════════════════════════════════════════════════
   EN TRANSPORTE PÚBLICO · el mapa de tiempos de infraestructura.html
   Se elige a dónde se va (Sol, Atocha…) y cada mapa enseña su término
   municipal pintado por zonas de 10 minutos: capas semitransparentes que
   se cargan de color donde se tarda menos, sobre las manzanas del
   Catastro y las líneas de tren. Parla en azul y tu ciudad en tinta.

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

  let destino = 0;
  /* De entrada, solo el tren: los autobuses no siempre cumplen su horario
     en hora punta. */
  let modo = 'tren';

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
    const bus = $('#tp-bus');
    bus.checked = false;
    bus.addEventListener('change', function () { modo = bus.checked ? 'todo' : 'tren'; pintar(); });
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

  function mapa(cont, id, m, c) {
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
    const u = D().umbrales, z = c.modos[modo][D().id].zonas;
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

    const t = tiempos(c.modos[modo][D().id]).filter(function (v) { return v != null; });
    const r = { mn: Math.min.apply(null, t), mx: Math.max.apply(null, t), est: estacion(c) };
    d.setAttribute('aria-label', NOMBRE[id] + ', hasta ' + D().nombre + ': de ' + r.mn + ' a ' + r.mx +
      ' minutos según el punto.');
    cont.appendChild(d);
    escala(d);
    tip(cont, d, id, c, { px: px, py: py, mpp: mpp, cx: cx, cy: cy });
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
  function estacion(c) {
    const ay = c.ayuntamiento || [0, 0];
    const e = c.estaciones.filter(function (x) { return x.modos.indexOf('cercanias') >= 0; })
      .sort(function (a, b) { return Math.hypot(a.x - ay[0], a.y - ay[1]) - Math.hypot(b.x - ay[0], b.y - ay[1]); })[0];
    if (!e) return null;
    const tt = tiempos(c.modos[modo][D().id]);
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
      const v = c.modos[modo][D().id];
      const tk = tiempos(v)[k], mg = margen(v, k);
      vaciar(t);
      t.appendChild(el('p', 'graf__tip-h', 'Desde aquí hasta ' + D().nombre));
      /* Sin tiempo: no hay parada a menos de 1.200 m andando (con autobuses,
         o casi siempre; sin ellos, de tren). */
      t.appendChild(el('p', 'tp__tip-v', tk == null
        ? (modo === 'tren' ? 'Sin estación' : 'Sin parada') + ' a menos de 1,2 km andando'
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
    d.addEventListener('pointermove', mostrar);
    d.addEventListener('pointerdown', mostrar);
    d.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') t.hidden = true; });
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  function dato(sel, r) {
    const n = $(sel);
    n.textContent = !r ? '' : (r.est && r.est.t != null ? r.est.t + ' min desde la estación de ' + r.est.nombre + ' · ' : '') +
      'de ' + r.mn + ' a ' + r.mx + ' según el punto';
  }
  function frase(rp, ra) {
    const n = $('#tp-frase');
    vaciar(n);
    if (!rp || !rp.est) return;
    n.appendChild(document.createTextNode('Hasta ' + D().nombre + (modo === 'tren' ? ' en tren' : ' en tren o autobús') +
      ', desde la estación de Parla se tardan '));
    n.appendChild(el('b', 'parla', rp.est.t + ' minutos'));
    n.appendChild(document.createTextNode(ra && ra.est
      ? '. Desde la de ' + ra.est.nombre + ', ' + ra.est.t + '.'
      : '.'));
  }

  /* La frase de arriba de la página habla del coche; aquí se le suma el
     tren hasta Sol, siempre solo tren, salga el destino que salga abajo. */
  function golpe() {
    const n = $('#golpe');
    if (!n) return;
    let s = $('#golpe-tren');
    if (!s) { s = el('span', null); s.id = 'golpe-tren'; n.appendChild(s); }
    const sol = T.destinos.filter(function (d) { return d.id === 'sol'; })[0];
    const tSol = function (id) {
      const c = window.TRANSPORTE_CIUDAD && window.TRANSPORTE_CIUDAD[id];
      if (!c || !sol) return null;
      const m0 = modo, d0 = destino;
      modo = 'tren'; destino = T.destinos.indexOf(sol);
      const r = estacion(c);
      modo = m0; destino = d0;
      return r;
    };
    const p = tSol(REF), a = tSol(I.AQUI);
    vaciar(s);
    if (!p) return;
    s.appendChild(document.createTextNode(' En tren, de la estación de Parla a Sol se tardan '));
    s.appendChild(el('b', 'parla', p.t + ' minutos'));
    s.appendChild(document.createTextNode(a ? '; de la de ' + a.nombre + ', ' + a.t + '.' : '.'));
  }

  /* ── El tren a mano y el abono: las once ciudades, sin mapas ──────── */

  const IDS = Object.keys(NOMBRE);
  const LETRA = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  function num(n, d) { return n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  /* El botón del cartel A4 (assets/cartel.js), detrás de la nota. Sin
     datos, no hay botón. */
  function cartelEn(sel, id, titulo, datos) {
    const nota = $(sel);
    const viejo = nota.parentNode.querySelector('.compartir[data-cartel="' + id + '"]');
    if (viejo) viejo.remove();
    if (!datos || !window.CARTEL) return;
    const b = window.CARTEL.boton({
      id: id, datos: datos,
      ciudad: function () { return I.AQUI; },
      titulo: function () { return 'Parla y ' + NOMBRE[I.AQUI] + ' · ' + titulo; }
    });
    b.dataset.cartel = id;
    nota.after(b);
  }
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
  /* Dónde queda Parla entre las once, de la cifra más alta a la más baja. */
  function puesto(v) {
    const ids = IDS.filter(function (id) { return v(id) != null; });
    const N = LETRA[ids.length] || String(ids.length);
    const k = ids.filter(function (id) { return v(id) > v(REF); }).length + 1;
    if (k === ids.length) return 'Parla tiene la cifra más baja de las ' + N + '.';
    if (k === 1) return 'Parla tiene la cifra más alta de las ' + N + '.';
    return 'Parla es la ' + k + '.ª de las ' + N + ', de la cifra más alta a la más baja.';
  }

  function cobertura() {
    const C = T.cobertura && T.cobertura.ciudades;
    if (!C || !C[REF] || !C[I.AQUI]) return;
    /* La cifra grande, a 15 minutos; en la nota, a 5 y a 10. */
    const p = function (id) { return C[id] ? C[id].pct['15'] : null; };
    pareja('#cob-cifras', p, function (v) { return num(v, 1) + '\u00a0%'; }, function (id) {
      return 'de las viviendas, a 15 minutos andando de una estación: ' + C[id].cerca['15'].toLocaleString('es-ES') +
        ' de ' + C[id].viviendas.toLocaleString('es-ES');
    });
    cartelEn('#cob-nota', 'tren', 'El tren a mano', function () {
      return {
        pre: 'De cada 100 viviendas de Parla,', cifra: num(p(REF), 0),
        que: 'tienen una estación de tren o de metro a 15 minutos andando',
        cajas: [{ q: NOMBRE[I.AQUI], v: num(p(I.AQUI), 0) + ' de cada 100' },
          { q: 'Parla', v: C[REF].cerca['15'].toLocaleString('es-ES') + ' de ' + C[REF].viviendas.toLocaleString('es-ES') + ' viviendas', ref: true }]
      };
    });
    const menos = IDS.filter(function (id) { return C[id] && C[id].pct['15'] < C[REF].pct['15']; });
    $('#cob-nota').textContent = puesto(p) +
      (menos.length && menos.length <= 3 ? ' Por debajo quedan ' + menos.map(function (id) {
        return NOMBRE[id] + ' (' + num(C[id].pct['15'], 1) + '\u00a0%)';
      }).join(' y ').replace(/ y (?=[^y]* y )/, ', ') + '.' : '') +
      ' A 10 minutos, el ' + num(C[REF].pct['10'], 1) + '\u00a0% en Parla y el ' + num(C[I.AQUI].pct['10'], 1) + '\u00a0% en ' +
      NOMBRE[I.AQUI] + '; a 5, el ' + num(C[REF].pct['5'], 1) + '\u00a0% y el ' + num(C[I.AQUI].pct['5'], 1) + '\u00a0%.';
  }

  function abono() {
    const A = T.abono && T.abono.ciudades;
    if (!A || !A[REF] || !A[I.AQUI]) return;
    const eur = function (v) { return num(v, Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2) + '\u00a0€'; };
    pareja('#abono-cifras', function (id) { return A[id].precio; }, eur, function (id) {
      return 'el abono de 30 días, zona ' + A[id].zona;
    });
    const dif = A[REF].precio - A[I.AQUI].precio;
    /* Con el mismo precio no hay cartel: no hay nada que contar. */
    cartelEn('#abono-nota', 'abono', 'Lo que cuesta el abono', Math.abs(dif) < 0.005 ? null : function () {
      return {
        pre: 'Un vecino de Parla paga al año', cifra: eur(Math.abs(dif) * 12),
        que: (dif > 0 ? 'más' : 'menos') + ' por su abono que uno de ' + NOMBRE[I.AQUI],
        cajas: [{ q: NOMBRE[I.AQUI], v: eur(A[I.AQUI].precio) + ' al mes, zona ' + A[I.AQUI].zona },
          { q: 'Parla', v: eur(A[REF].precio) + ' al mes, zona ' + A[REF].zona, ref: true }]
      };
    });
    const igual = IDS.filter(function (id) { return id !== REF && A[id] && A[id].zona === A[REF].zona; });
    $('#abono-nota').textContent = (Math.abs(dif) < 0.005
      ? 'Parla y ' + NOMBRE[I.AQUI] + ' están en la misma zona y pagan lo mismo.'
      : 'Con un abono de 30 días cada mes, un vecino de Parla paga al año ' + eur(Math.abs(dif) * 12) +
        (dif > 0 ? ' más' : ' menos') + ' que uno de ' + NOMBRE[I.AQUI] + '; con el anual, que vale lo que diez de 30 días, ' +
        eur(Math.abs(dif) * 10) + (dif > 0 ? ' más.' : ' menos.')) +
      ' En la zona ' + A[REF].zona + ' de Parla están también ' + igual.map(function (id) { return NOMBRE[id]; })
        .join(', ').replace(/, ([^,]*)$/, ' y $1') + '. El abono joven cuesta ' + eur(T.abono.joven) + ' en todas.';
  }

  let pidiendo = 0;
  function pintar() {
    const AQUI = I.AQUI, yo = ++pidiendo;
    leyenda();
    cobertura();
    abono();
    Promise.all([I.cargar(REF), I.cargar(AQUI), cargar(REF), cargar(AQUI)]).then(function (r) {
      if (yo !== pidiendo) return;
      const rp = mapa($('#tp-parla'), REF, r[0], r[2]);
      const ra = mapa($('#tp-aqui'), AQUI, r[1], r[3]);
      dato('#tp-dato-parla', rp);
      dato('#tp-dato-aqui', ra);
      frase(rp, ra);
      golpe();
    }).catch(function () {
      $('#tp-parla').textContent = 'No se pudo cargar el mapa.';
    });
  }

  fijo();
  I.alPintar(pintar);
  pintar();
})();

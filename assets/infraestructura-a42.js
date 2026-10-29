/* ═══════════════════════════════════════════════════════════════════════
   SALIR · lo llena que va la A-42 (datos/a42.js, que escribe
   herramientas/accesos/a42.py). Un mapa: la autovía hacia Madrid, de salida
   en salida, con tantos carriles dibujados como tiene cada tramo, en el color
   de lo llena que va de 7 a 8 (la gente que pasa sobre lo que cabe), como en
   los mapas de tráfico. Al este, en negro discontinuo, los tramos con
   retenciones según el Ministerio.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const I = window.INFRA;
  const A = window.A42;
  if (!I || !A || !A.perfil || !A.tramos) return;
  const REF = I.REF, NOMBRE = I.NOMBRE, $ = I.$;
  const SVG = 'http://www.w3.org/2000/svg';
  const MARGEN = 3500;            /* metros alrededor de la autovía */
  /* Lo lleno que va, en cuatro escalones, de más a menos. El rojo empieza
     en el 85 %, cerca de donde el manual de capacidad pasa al nivel de
     servicio E (la cautela lo explica). */
  const ESCALONES = [[0.85, '85 % o más de lo que cabe'], [0.75, 'Del 75 al 85 %'],
    [0.6, 'Del 60 al 75 %'], [0, 'Menos del 60 %']];

  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function svg(tag, at, txt) {
    const n = document.createElementNS(SVG, tag);
    Object.keys(at || {}).forEach(function (k) { n.setAttribute(k, at[k]); });
    if (txt != null) n.textContent = txt;
    return n;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function redondo(v) { return I.entero(Math.round(v / 50) * 50); }
  function trazo(pts, cerrar) {
    return pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') +
      (cerrar ? 'Z' : '');
  }
  function cabe(t) { return t.carriles * A.capacidad * A.personas; }
  function lleno(t) { return t.total / cabe(t); }
  function escalon(t) {
    const l = lleno(t);
    for (let i = 0; i < ESCALONES.length; i++) if (l >= ESCALONES[i][0]) return i;
    return ESCALONES.length - 1;
  }

  function leyenda() {
    const u = $('#a42-ley');
    vaciar(u);
    ESCALONES.slice().reverse().forEach(function (e, k) {
      const li = el('li', 'a42__ley-i');
      li.dataset.e = String(ESCALONES.length - 1 - k);
      li.appendChild(el('i'));
      li.appendChild(document.createTextNode(e[1]));
      u.appendChild(li);
    });
    const li = el('li', 'a42__ley-i');
    li.dataset.k = 'reten';
    li.appendChild(el('i'));
    li.appendChild(document.createTextNode('Retenciones de 7 a 9, según el Ministerio'));
    u.appendChild(li);
  }

  /* ── El mapa ──────────────────────────────────────────────────────── */

  function mapa() {
    const cont = $('#a42-mapa');
    vaciar(cont);
    const W = cont.clientWidth || 360;
    const estrecho = W < 520;
    const P = A.perfil, TR = A.tramos;
    /* El encuadre: la autovía y un margen; a los lados, sitio para rótulos. */
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    P.forEach(function (c) {
      bx0 = Math.min(bx0, c.p[0]); bx1 = Math.max(bx1, c.p[0]);
      by0 = Math.min(by0, c.p[1]); by1 = Math.max(by1, c.p[1]);
    });
    const ancho = (bx1 - bx0) + 2 * MARGEN * (estrecho ? 1.6 : 2.2);
    const x0 = (bx0 + bx1) / 2 - ancho / 2, y1 = by1 + MARGEN * 0.6, y0 = by0 - MARGEN * 0.6;
    const s = W / ancho;
    const H = Math.round((y1 - y0) * s);
    const px = function (x) { return (x - x0) * s; };
    const py = function (y) { return (y1 - y) * s; };
    const enPx = function (c) { return c.map(function (p) { return [px(p[0]), py(p[1])]; }); };
    const d = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'a42-mapa__svg', role: 'img',
      'aria-label': 'Mapa de la A-42 hacia Madrid: los carriles de cada tramo, lo llena que va de 7 a 8 y las retenciones' });
    const recorte = svg('clipPath', { id: 'a42-recorte' });
    recorte.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H }));
    d.appendChild(recorte);
    const fondo = svg('g', { 'clip-path': 'url(#a42-recorte)' });
    const quien = function (id) { return id === REF ? 'referencia' : id && id === I.AQUI ? 'aqui' : 'otro'; };

    const gm = svg('g', { class: 'a42-mapa__terminos' });
    A.municipios.forEach(function (m) {
      const p = svg('path', { d: m.anillos.map(function (a) { return trazo(enPx(a), true); }).join('') });
      p.dataset.quien = quien(m.id);
      gm.appendChild(p);
    });
    fondo.appendChild(gm);
    const gv = svg('g', { class: 'a42-mapa__vias' });
    A.vias.forEach(function (v) { if (v.n !== 'A-42') gv.appendChild(svg('path', { d: trazo(enPx(v.c)) })); });
    fondo.appendChild(gv);
    const gt = svg('g', { class: 'a42-mapa__nombres' });
    A.municipios.forEach(function (m) {
      if (!m.nombre) return;
      /* En pantallas estrechas, solo Parla, la ciudad elegida y Madrid: los demás chocan con las cifras. */
      if (estrecho && quien(m.id) === 'otro' && m.ine !== '28079') return;
      let tx = px(m.r[0]), ty = py(m.r[1]);
      /* Si el nombre cae encima de la autovía, se aparta al oeste. */
      P.forEach(function (c) {
        const ex = px(c.p[0]), ey = py(c.p[1]);
        if (Math.abs(ey - ty) < 10 && Math.abs(ex - tx) < 45) tx = ex - 60;
      });
      const t = svg('text', { x: tx.toFixed(1), y: ty.toFixed(1) }, m.nombre);
      t.dataset.quien = quien(m.id);
      gt.appendChild(t);
    });
    fondo.appendChild(gt);
    d.appendChild(fondo);

    /* El eje en píxeles y su normal (hacia el este para quien va al norte). */
    const ejes = enPx(P.map(function (c) { return c.p; }));
    const normal = ejes.map(function (_, i) {
      const a = ejes[Math.max(0, i - 1)], b = ejes[Math.min(ejes.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    });
    const LC = estrecho ? 5 : 7.5;              /* píxeles por carril */
    const maxW = Math.max.apply(null, TR.map(function (t) { return t.carriles; })) * LC;

    /* El eje por punto kilométrico: posición y normal interpoladas entre los
       puntos del perfil, para cortar los tramos justo en su salida. */
    const orden = P.map(function (c, i) { return [c.pk, i]; }).sort(function (a, b) { return a[0] - b[0]; });
    function en(pk) {
      let k = 0;
      while (k < orden.length - 2 && orden[k + 1][0] < pk) k++;
      const a = orden[k], b = orden[k + 1];
      const f = Math.max(0, Math.min(1, (pk - a[0]) / ((b[0] - a[0]) || 1)));
      const pa = ejes[a[1]], pb = ejes[b[1]], na = normal[a[1]], nb = normal[b[1]];
      const nx = na[0] + (nb[0] - na[0]) * f, ny = na[1] + (nb[1] - na[1]) * f, l = Math.hypot(nx, ny) || 1;
      return { x: pa[0] + (pb[0] - pa[0]) * f, y: pa[1] + (pb[1] - pa[1]) * f, nx: nx / l, ny: ny / l };
    }
    /* El ancho: el de los carriles de su tramo, y donde la autovía gana un
       carril, una transición de 900 m en vez de un escalón. */
    const TRANSICION = 0.9;
    function anchoEn(pk, i) {
      const t = TR[i], w = t.carriles * LC;
      let r = w;
      [[i - 1, t.de], [i + 1, t.a]].forEach(function (v) {
        const n = TR[v[0]];
        if (!n || n.carriles * LC >= w) return;
        const dd = Math.abs(pk - v[1]);
        if (dd < TRANSICION) r = Math.min(r, n.carriles * LC + (w - n.carriles * LC) * dd / TRANSICION);
      });
      return r;
    }
    function muestras(de, a) {
      const r = [];
      for (let k = de; k < a; k += 0.05) r.push(k);
      r.push(a);
      return r;
    }
    function borde(pks, i, lado, extra) {
      return pks.map(function (k) {
        const q = en(k), o = lado * (anchoEn(k, i) / 2 + (extra || 0));
        return [q.x + q.nx * o, q.y + q.ny * o];
      });
    }
    function cinta(pks, i, extra) {
      return trazo(borde(pks, i, -1, extra).concat(borde(pks, i, 1, extra).reverse()), true);
    }

    /* Las retenciones, detrás: una sombra ancha a lo largo de la autovía. */
    const gr = svg('g', { class: 'a42-mapa__reten' });
    A.retenciones.forEach(function (r) {
      const pks = muestras(Math.max(r.de, TR[0].de), Math.min(r.a, TR[TR.length - 1].a));
      if (pks.length < 2) return;
      gr.appendChild(svg('path', { d: trazo(pks.map(function (k) { const q = en(k); return [q.x, q.y]; })),
        'stroke-width': maxW + (estrecho ? 14 : 20) }));
    });
    d.appendChild(gr);

    /* La autovía: un borde de una pieza y, encima, cada tramo en su color. */
    const gc = svg('g', { class: 'a42-mapa__autovia' });
    TR.forEach(function (t, i) {
      gc.appendChild(svg('path', { class: 'a42-mapa__borde', d: cinta(muestras(t.de, t.a), i, 1.5) }));
    });
    TR.forEach(function (t, i) {
      const pks = muestras(t.de, t.a);
      const p = svg('path', { class: 'a42-mapa__tramo', d: cinta(pks, i, 0) });
      p.dataset.e = String(escalon(t));
      gc.appendChild(p);
      /* Las rayas de carril, solo donde el tramo ya tiene todos sus carriles. */
      const lleno_ = pks.filter(function (k) { return anchoEn(k, i) >= t.carriles * LC - 0.01; });
      if (lleno_.length < 2) return;
      for (let j = 1; j < t.carriles; j++) {
        gc.appendChild(svg('path', { class: 'a42-mapa__raya', d: trazo(lleno_.map(function (k) {
          const q = en(k), o = -t.carriles * LC / 2 + j * LC;
          return [q.x + q.nx * o, q.y + q.ny * o];
        })) }));
      }
    });
    d.appendChild(gc);

    /* El punto del eje más cercano a un punto kilométrico. */
    function enPk(pk) {
      let m = 0;
      P.forEach(function (c, i) { if (Math.abs(c.pk - pk) < Math.abs(P[m].pk - pk)) m = i; });
      return m;
    }

    /* Salidas, al este, con su nombre. */
    const ge = svg('g', { class: 'a42-mapa__salidas' });
    let ultima = Infinity;      /* de sur a norte: cada rótulo, por encima del anterior */
    A.enlaces.slice().sort(function (a, b) { return b.pk - a.pk; }).forEach(function (e) {
      if (e.pk <= TR[0].de || e.pk >= TR[TR.length - 1].a) return;
      const i = enPk(e.pk), o = maxW / 2 + 12;
      const ax = ejes[i][0] + normal[i][0] * (maxW / 2 + 1), ay = ejes[i][1] + normal[i][1] * (maxW / 2 + 1);
      const bx = ejes[i][0] + normal[i][0] * o + 10;
      const ty = Math.min(ay + 4, ultima - 13);
      ultima = ty - (e.n.split(' · ').length - 1) * 12;
      ge.appendChild(svg('path', { d: 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'L' + bx.toFixed(1) + ' ' + (ty - 4).toFixed(1) }));
      /* En pantallas estrechas, solo la carretera («M-406», no «M-406, Getafe y Leganés»). */
      const lineas = e.n.split(' · ').map(function (x) { return estrecho ? x.split(',')[0] : x; });
      lineas.forEach(function (p, k) {
        ge.appendChild(svg('text', { x: (bx + 3).toFixed(1), y: (ty - (lineas.length - 1 - k) * 12).toFixed(1) }, p));
      });
    });
    d.appendChild(ge);

    /* Lo lleno que va y los carriles, al oeste, a media altura de cada tramo. */
    const gp = svg('g', { class: 'a42-mapa__pcts' });
    TR.forEach(function (t) {
      if (t.a - t.de < 1.6) return;
      const i = enPk((t.de + t.a) / 2);
      const o = -(t.carriles * LC / 2 + 12);
      const x = ejes[i][0] + normal[i][0] * o, yy = ejes[i][1] + normal[i][1] * o;
      const g = svg('g');
      g.dataset.e = String(escalon(t));
      g.appendChild(svg('text', { class: 'a42-mapa__pct', x: x.toFixed(1), y: (yy + 2).toFixed(1) }, Math.round(100 * lleno(t)) + ' %'));
      g.appendChild(svg('text', { class: 'a42-mapa__carr', x: x.toFixed(1), y: (yy + 15).toFixed(1) }, t.carriles + ' carriles'));
      gp.appendChild(g);
    });
    d.appendChild(gp);

    cont.appendChild(d);
  }

  function nota() {
    const TR = A.tramos;
    const pc = function (t) { return Math.round(100 * lleno(t)) + ' %'; };
    const parla = TR.filter(function (t) { return t.ine === '28106'; })[0];
    const llega = TR[TR.indexOf(parla) + 1];
    const sale = TR[TR.indexOf(parla) - 1];
    const pico = TR.reduce(function (m, t) { return lleno(t) > lleno(m) ? t : m; }, TR[0]);
    $('#a42-nota').textContent =
      'La A-42 llega a Parla con ' + llega.carriles + ' carriles hacia Madrid, al ' + pc(llega) + ' de lo que cabe; ' +
      Math.round(10 * (llega.de_origen.toledo || 0) / llega.total) + ' de cada 10 personas vienen de la provincia de ' +
      'Toledo. Cruza Parla con los mismos ' + parla.carriles + ' carriles, al ' + pc(parla) + '. En Parla Norte entra ' +
      'la gente de Parla y la autovía pasa a ' + sale.carriles + ' carriles, al ' + pc(sale) +
      (pico === sale ? ', el tramo más lleno del recorrido. ' : '. ') +
      'El Ministerio de Transportes sitúa las retenciones de los días laborables de 7 a 9 entre el enlace de la M-506 ' +
      'y Parla Sur, y entre la M-45 y Getafe.';
  }

  function pintar() {
    leyenda();
    mapa();
    nota();
  }

  let espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(mapa, 150);
  });
  I.alPintar(pintar);
  pintar();
})();

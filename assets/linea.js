/* ═══════════════════════════════════════════════════════════════════════
   EL GRÁFICO DE LÍNEAS · lo comparten vivienda.html y economia.html.
   LINEA.dibujar(figura, opciones) lo pinta y lo apunta para rehacerlo al
   cambiar el ancho; LINEA.olvidar() vacía la lista antes de repintar.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  /* ── El gráfico de líneas ─────────────────────────────────────────
     Las dos ciudades, y a veces la Comunidad de fondo. Se dibuja al ancho
     real de la figura para que los textos no se deformen, y se rehace al
     cambiar el ancho. La línea entra de izquierda a derecha al verse. */

  const graficos = [];

  function linea(fig, op) {
    graficos.push({ fig: fig, op: op });
    dibujarLinea(fig, op, true);
  }

  function dibujarLinea(fig, op, nuevo) {
    vaciar(fig);
    const W = Math.max(280, fig.clientWidth || 600);
    const estrecho = W < 520;
    const H = op.alto ? op.alto(estrecho) : (estrecho ? 220 : 280);
    /* A la derecha caben los nombres del final de la línea: se mide el más
       largo (unos 7 px por letra) para que «Móstoles» no se corte. */
    const largo = op.series.reduce(function (m, s) { return Math.max(m, (s.corto || s.nombre || '').length); }, 0);
    const M = { t: 18, r: op.der || Math.max(estrecho ? 58 : 92, Math.round(largo * 7 + 14)), b: 26, l: op.izq || (estrecho ? 38 : 48) };
    const n = op.etiquetas.length;
    let max = 0, min = 0;
    op.series.forEach(function (s) {
      s.v.forEach(function (v) { if (v != null) { max = Math.max(max, v); min = Math.min(min, v); } });
    });
    /* Una escala fija cuando dos gráficos se comparan uno al lado del otro. */
    if (op.rango) { min = op.rango[0]; max = op.rango[1]; }
    const paso = op.paso(max - min);
    const tope = Math.ceil(max / paso) * paso;
    const suelo = Math.floor(min / paso) * paso;
    const x = function (i) { return M.l + (W - M.l - M.r) * i / (n - 1); };
    const y = function (v) { return M.t + (H - M.t - M.b) * (tope - v) / (tope - suelo); };

    const d = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'graf__svg',
      role: 'img', 'aria-label': op.descripcion });

    for (let v = suelo; v <= tope + 1e-9; v += paso) {
      d.appendChild(svg('line', { class: 'graf__rejilla' + (v === 0 && suelo < 0 ? ' graf__rejilla--cero' : ''),
        x1: M.l, x2: W - M.r, y1: y(v), y2: y(v) }));
      const t = svg('text', { class: 'graf__eje', x: M.l - 6, y: y(v) + 4, 'text-anchor': 'end' });
      t.textContent = op.fmtEje(v);
      d.appendChild(t);
    }
    op.marcasX(n, estrecho).forEach(function (i) {
      const t = svg('text', { class: 'graf__eje', x: x(i), y: H - 6, 'text-anchor': 'middle' });
      t.textContent = op.etiquetas[i].slice(0, 4);
      d.appendChild(t);
    });

    /* Etiquetas al final de cada línea, sin pisarse. */
    const finales = [];
    op.series.forEach(function (s) {
      let pts = '';
      let ultimo = -1;
      s.v.forEach(function (v, i) {
        if (v == null) return;
        pts += (pts ? ' L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1);
        ultimo = i;
      });
      const p = svg('path', { d: pts, class: 'graf__linea graf__linea--' + s.quien + (s.fina ? ' graf__linea--fina' : '') });
      d.appendChild(p);
      if (ultimo >= 0) {
        d.appendChild(svg('circle', { cx: x(ultimo), cy: y(s.v[ultimo]), r: 3.2, class: 'graf__punto graf__punto--' + s.quien }));
        finales.push({ s: s, y: y(s.v[ultimo]), x: x(ultimo), v: s.v[ultimo] });
      }
    });
    /* Hacia abajo lo justo para que no se pisen, y si la última se sale
       del gráfico, todas hacia arriba. */
    finales.sort(function (a, b) { return a.y - b.y; });
    for (let i = 1; i < finales.length; i++) {
      if (finales[i].y - finales[i - 1].y < 26) finales[i].y = finales[i - 1].y + 26;
    }
    const sobra = finales.length ? finales[finales.length - 1].y - (H - M.b - 14) : 0;
    if (sobra > 0) finales.forEach(function (f) { f.y -= sobra; });
    finales.forEach(function (f) {
      const t = svg('text', { class: 'graf__nombre graf__nombre--' + f.s.quien, x: f.x + 7, y: f.y - 1 });
      t.textContent = f.s.corto || f.s.nombre;
      d.appendChild(t);
      const v = svg('text', { class: 'graf__valor graf__valor--' + f.s.quien, x: f.x + 7, y: f.y + 12 });
      v.textContent = op.fmtValor(f.v);
      d.appendChild(v);
    });

    /* Las anotaciones: un punto concreto de una serie, con su texto. */
    (op.notas || []).forEach(function (a) {
      const s = op.series[a.serie];
      const v = s.v[a.i];
      if (v == null) return;
      const cx = x(a.i), cy = y(v);
      d.appendChild(svg('circle', { cx: cx, cy: cy, r: 3.2, class: 'graf__punto graf__punto--' + s.quien }));
      const arriba = a.arriba !== false;
      const t = svg('text', { class: 'graf__nota', x: cx, y: arriba ? cy - 9 : cy + 17,
        'text-anchor': a.i < n * 0.15 ? 'start' : a.i > n * 0.85 ? 'end' : 'middle' });
      t.textContent = a.texto;
      d.appendChild(t);
    });

    /* Al pasar el ratón, el dedo o las flechas: una guía en el momento más
       cercano, un punto en cada línea y un recuadro con las cifras. */
    const guia = svg('line', { class: 'graf__guia', x1: 0, x2: 0, y1: M.t, y2: H - M.b, visibility: 'hidden' });
    d.appendChild(guia);
    const marcas = op.series.map(function (s) {
      const c = svg('circle', { r: 4.5, class: 'graf__punto graf__punto--' + s.quien + ' graf__marca', visibility: 'hidden' });
      d.appendChild(c);
      return c;
    });
    const tip = el('div', 'graf__tip');
    tip.hidden = true;
    tip.setAttribute('aria-live', 'polite');
    let actual = -1;
    function mostrar(i) {
      i = Math.max(0, Math.min(n - 1, i));
      actual = i;
      const cx = x(i);
      guia.setAttribute('x1', cx); guia.setAttribute('x2', cx);
      guia.setAttribute('visibility', 'visible');
      const filas = [];
      op.series.forEach(function (s, k) {
        const v = s.v[i];
        if (v == null) { marcas[k].setAttribute('visibility', 'hidden'); return; }
        marcas[k].setAttribute('cx', cx); marcas[k].setAttribute('cy', y(v));
        marcas[k].setAttribute('visibility', 'visible');
        filas.push({ s: s, v: v });
      });
      filas.sort(function (a, b) { return b.v - a.v; });
      vaciar(tip);
      tip.appendChild(el('p', 'graf__tip-h', op.fmtX ? op.fmtX(i) : op.etiquetas[i]));
      filas.forEach(function (f) {
        const p = el('p', 'graf__tip-f graf__tip-f--' + f.s.quien);
        p.appendChild(el('i', f.s.fina ? 'graf__tip-c graf__tip-c--fina' : 'graf__tip-c'));
        p.appendChild(el('span', null, f.s.corto || f.s.nombre));
        p.appendChild(el('b', null, op.fmtValor(f.v)));
        tip.appendChild(p);
      });
      tip.hidden = false;
      /* Encima de la línea más alta, al lado de la guía y sin salirse de
         la figura. */
      const rs = d.getBoundingClientRect(), rf = fig.getBoundingClientRect();
      const escala = rs.width / W || 1;
      const arriba = filas.length ? Math.min.apply(null, filas.map(function (f) { return y(f.v); })) : M.t;
      const gx = rs.left - rf.left + cx * escala;
      const ancho = tip.offsetWidth;
      let izq = cx > W * 0.55 ? gx - 12 - ancho : gx + 12;
      izq = Math.max(0, Math.min(rf.width - ancho, izq));
      tip.style.left = izq + 'px';
      tip.style.top = Math.max(ancho ? tip.offsetHeight : 0, rs.top - rf.top + arriba * escala - 10) + 'px';
    }
    function ocultar() {
      actual = -1;
      tip.hidden = true;
      guia.setAttribute('visibility', 'hidden');
      marcas.forEach(function (c) { c.setAttribute('visibility', 'hidden'); });
    }
    function indice(e) {
      const r = d.getBoundingClientRect();
      const px = (e.clientX - r.left) * W / r.width;
      return Math.round((px - M.l) / (W - M.l - M.r) * (n - 1));
    }
    d.addEventListener('pointermove', function (e) { mostrar(indice(e)); });
    d.addEventListener('pointerdown', function (e) { mostrar(indice(e)); });
    d.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ocultar(); });
    d.setAttribute('tabindex', '0');
    d.addEventListener('focus', function () { if (actual < 0) mostrar(n - 1); });
    d.addEventListener('blur', ocultar);
    d.addEventListener('keydown', function (e) {
      const paso = e.shiftKey ? 4 : 1;
      if (e.key === 'ArrowLeft') { mostrar(actual - paso); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { mostrar(actual + paso); e.preventDefault(); }
      else if (e.key === 'Home') { mostrar(0); e.preventDefault(); }
      else if (e.key === 'End') { mostrar(n - 1); e.preventDefault(); }
      else if (e.key === 'Escape') ocultar();
    });

    if (op.titulo) fig.appendChild(el('p', 'graf__titulo graf__titulo--' + op.titulo[1], op.titulo[0]));
    fig.appendChild(d);
    fig.appendChild(tip);
    if (op.leyenda) fig.appendChild(el('figcaption', 'graf__pie', op.leyenda));

    if (nuevo && !quieto && 'IntersectionObserver' in window) {
      fig.classList.add('graf--espera');
      const mira = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          mira.disconnect();
          fig.classList.remove('graf--espera');
          fig.classList.add('graf--visto');
        });
      }, { threshold: 0.35 });
      mira.observe(fig);
    }
  }

  let espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      graficos.forEach(function (g) { dibujarLinea(g.fig, g.op, false); });
    }, 150);
  });

  window.LINEA = {
    dibujar: linea,
    olvidar: function () { graficos.length = 0; }
  };
})();

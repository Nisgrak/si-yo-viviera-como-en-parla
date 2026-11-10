/* ═══════════════════════════════════════════════════════════════════════
   TODOS LOS DATOS · consulta.html
   Un catálogo con casi todos los datos de la web y las once ciudades a la
   vez. Se eligen uno o varios: cada uno sale con las once en barras,
   ordenadas; en tabla se comparan varios; en gráfica, los que se miden
   igual (todos en %, todos en euros…) van juntos en líneas, o se cruzan
   dos, uno en cada eje. Las cuentas son las mismas que
   hacen las páginas, sobre los mismos ficheros de datos/: aquí no se
   calcula nada nuevo, solo se junta.

   La selección va en la dirección (?d=id,id&vista=grafica&g=cruce&x=id&y=id), para poder
   compartir un enlace con los datos ya elegidos.

   El catálogo (cada dato con su cuenta, su unidad y su fuente) está en
   assets/consulta-catalogo.js, que también carga el build para pintar la
   vista previa de cada dato.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const REF = D.REFERENCIA;
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const ultimo = function (xs) { return xs[xs.length - 1]; };

  const C = window.CONSULTA, CAT = C.CAT, POR_ID = C.POR_ID, GRUPOS = C.GRUPOS, NOMBRE = C.NOMBRE, IDS = C.IDS;
  const num = C.num, cifra = C.cifra, filas = C.filas, puesto = C.puesto;

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }


  /* ── Estado: qué está elegido y cómo se ve ─────────────────────────── */

  const POR_DEFECTO = ['dinero-renta', 'cobertura', 'puestos', 'dinero-inversion'];
  const VISTAS = ['barras', 'tabla', 'grafica'];
  let elegidos = [], vista = 'barras', orden = { id: null, desc: true }, ejes = { x: null, y: null }, modo = 'juntos', forma = 'lineas';
  (function () {
    const q = new URLSearchParams(location.search);
    const d = (q.get('d') || '').split(',').filter(function (x) { return POR_ID[x]; });
    elegidos = d.length ? d : POR_DEFECTO.filter(function (x) { return POR_ID[x]; });
    vista = VISTAS.indexOf(q.get('vista')) > 0 ? q.get('vista') : 'barras';
    ejes = { x: q.get('x'), y: q.get('y') };
    modo = q.get('g') === 'cruce' ? 'cruce' : 'juntos';
    forma = q.get('f') === 'columnas' ? 'columnas' : 'lineas';
  })();
  function guardar() {
    if (!history.replaceState) return;
    const q = new URLSearchParams();
    if (elegidos.length) q.set('d', elegidos.join(','));
    if (vista !== 'barras') q.set('vista', vista);
    if (vista === 'grafica' && modo === 'juntos' && forma === 'columnas') q.set('f', 'columnas');
    if (vista === 'grafica' && modo === 'cruce') {
      q.set('g', 'cruce');
      if (elegidos.length > 1) { q.set('x', ejes.x); q.set('y', ejes.y); }
    }
    const s = q.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  /* ── Movimiento ──────────────────────────────────────────────────────
     Solo entra lo nuevo: una tarjeta recién elegida, una columna nueva en
     la tabla, una gráfica que cambia. Lo que ya estaba no se mueve, salvo
     las filas de la tabla al reordenar, que se deslizan a su sitio. Con
     «reducir movimiento», nada (estilos.css lo anula todo). */
  const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pintado = { vista: null, claves: [], graficas: {} };

  /* Quitar: la tarjeta se va y luego se repinta. */
  function despedir(key, luego) {
    const art = !quieto && $('#resultados [data-clave="' + key + '"]');
    if (!art) { luego(); return; }
    art.classList.add('res--sale');
    setTimeout(luego, 180);
  }

  /* «· cuanto más, mejor», donde no cabe la línea entera (assets/sentido.js). */
  function sentidoCorto(id) {
    const s = window.SENTIDO && window.SENTIDO.de(id);
    return s ? ' · ' + window.SENTIDO.texto(s).toLowerCase() : '';
  }

  /* ── El catálogo, a la izquierda ──────────────────────────────────── */

  function catalogo() {
    const cont = $('#cat-lista');
    vaciar(cont);
    const filtro = ($('#cat-buscar').value || '').trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    GRUPOS.forEach(function (g) {
      const items = CAT.filter(function (d) {
        if (d.grupo !== g) return false;
        if (!filtro) return true;
        const t = (d.titulo + ' ' + d.unidad + ' ' + d.grupo).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        return t.indexOf(filtro) >= 0;
      });
      if (!items.length) return;
      const sec = el('fieldset', 'cat__grupo');
      sec.appendChild(el('legend', 'cat__g', g));
      items.forEach(function (d) {
        const lab = el('label', 'cat__item');
        const ch = el('input');
        ch.type = 'checkbox';
        ch.checked = elegidos.indexOf(d.id) >= 0;
        ch.addEventListener('change', function () {
          if (ch.checked) { if (elegidos.indexOf(d.id) < 0) elegidos.push(d.id); }
          else elegidos = elegidos.filter(function (x) { return x !== d.id; });
          guardar();
          cuenta();
          if (ch.checked || vista !== 'barras') resultados();
          else despedir(d.id, resultados);
        });
        lab.appendChild(ch);
        const t = el('span', 'cat__t');
        t.appendChild(el('span', 'cat__q', d.titulo));
        t.appendChild(el('span', 'cat__u', d.unidad));
        lab.appendChild(t);
        sec.appendChild(lab);
      });
      cont.appendChild(sec);
    });
    if (!cont.firstChild) cont.appendChild(el('p', 'cat__nada', 'Ningún dato tiene esas palabras.'));
  }
  function cuenta() {
    const c = $('#cat-cuenta');
    const antes = c.textContent;
    c.textContent = elegidos.length === 1 ? '1 dato elegido' : elegidos.length + ' datos elegidos';
    if (antes && antes !== c.textContent) {
      c.classList.remove('cat__cuenta--salta');
      void c.offsetWidth;   /* para que la animación vuelva a empezar */
      c.classList.add('cat__cuenta--salta');
    }
    $('#cat-limpiar').hidden = !elegidos.length;
  }

  /* ── Los resultados ───────────────────────────────────────────────── */


  function barras(cont) {
    elegidos.forEach(function (key) {
      const d = POR_ID[key];
      const art = el('article', 'res');
      art.dataset.clave = key;
      if (!quieto && (pintado.vista !== 'barras' || pintado.claves.indexOf(key) < 0)) art.classList.add('res--nuevo');
      art.appendChild(el('p', 'res__g', d.grupo));
      const hd = el('h3', 'res__h', d.titulo);
      const sen = window.SENTIDO && window.SENTIDO.de(d.id);
      if (sen) hd.dataset.sentido = sen;
      art.appendChild(hd);
      art.appendChild(el('p', 'res__u', d.unidad));
      const fs = filas(d);
      /* Las barras van de cero a la mayor; si hay negativos, sin barra. */
      const tope = fs.reduce(function (t, x) { return x.v != null ? Math.max(t, x.v) : t; }, 0);
      const ul = el('ul', 'res__filas');
      fs.forEach(function (x, n) {
        const li = el('li', 'res__fila');
        li.style.setProperty('--i', n);
        if (x.id === REF) li.dataset.quien = 'referencia';
        /* Los empates comparten puesto. */
        const pos = puesto(d, fs, x);
        li.appendChild(el('span', 'res__n', pos ? pos + '.' : ''));
        li.appendChild(el('span', 'res__q', NOMBRE[x.id] + (d.etiqueta && x.v != null ? ' · ' + d.etiqueta(x.id) : '')));
        li.appendChild(el('span', 'res__v', cifra(d, x.v)));
        const b = el('span', 'res__barra');
        const i = el('i');
        i.style.width = (tope && x.v > 0 ? x.v / tope * 100 : 0).toFixed(1) + '%';
        b.appendChild(i);
        li.appendChild(b);
        ul.appendChild(li);
      });
      art.appendChild(ul);
      const pie = el('p', 'res__pie');
      if (d.fuente) {
        pie.appendChild(document.createTextNode('Fuente: '));
        const a = el('a', null, d.fuente[0].replace(' · ', ', '));
        a.href = d.fuente[1];
        pie.appendChild(a);
        pie.appendChild(document.createTextNode('. '));
      }
      if (d.pagina) {
        const ir = el('a', 'res__ir', 'Ver en su página');
        ir.href = d.pagina;
        pie.appendChild(ir);
      }
      art.appendChild(pie);
      const quitar = el('button', 'res__x', 'Quitar');
      quitar.type = 'button';
      quitar.setAttribute('aria-label', 'Quitar ' + d.titulo);
      quitar.addEventListener('click', function () {
        elegidos = elegidos.filter(function (x) { return x !== key; });
        guardar();
        catalogo();
        cuenta();
        despedir(key, resultados);
      });
      art.appendChild(quitar);
      cont.appendChild(art);
    });
  }

  function tabla(cont) {
    const caja = el('div', 'tabla-caja');
    const t = el('table', 'tabla');
    const cab = el('tr');
    const leyenda = el('caption', 'oculto', 'Los datos elegidos, ciudad a ciudad. Los botones de cada columna ordenan la tabla.');
    t.appendChild(leyenda);
    const thc = el('th', 'tabla__ciudad', 'Ciudad');
    thc.setAttribute('scope', 'col');
    cab.appendChild(thc);
    elegidos.forEach(function (key) {
      const d = POR_ID[key];
      const th = el('th', 'tabla__dato');
      th.setAttribute('scope', 'col');
      const b = el('button', 'tabla__orden');
      b.type = 'button';
      b.appendChild(el('span', 'tabla__q', d.titulo));
      b.appendChild(el('span', 'tabla__u', d.unidad + sentidoCorto(d.id)));
      if (orden.id === key) {
        th.setAttribute('aria-sort', orden.desc ? 'descending' : 'ascending');
        b.appendChild(el('span', 'tabla__flecha', orden.desc ? '↓' : '↑'));
      }
      b.addEventListener('click', function () {
        orden = { id: key, desc: orden.id === key ? !orden.desc : true };
        resultados();
      });
      th.appendChild(b);
      cab.appendChild(th);
    });
    const thead = el('thead');
    thead.appendChild(cab);
    t.appendChild(thead);
    let ids = IDS.slice();
    if (orden.id && POR_ID[orden.id] && elegidos.indexOf(orden.id) >= 0) {
      const d = POR_ID[orden.id];
      ids.sort(function (a, b) {
        const va = d.v(a), vb = d.v(b);
        if (va == null) return vb == null ? 0 : 1;
        if (vb == null) return -1;
        return orden.desc ? vb - va : va - vb;
      });
    }
    const tb = el('tbody');
    ids.forEach(function (id) {
      const tr = el('tr');
      tr.dataset.id = id;
      if (id === REF) tr.dataset.quien = 'referencia';
      const th = el('th', 'tabla__ciudad', NOMBRE[id]);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      elegidos.forEach(function (key) {
        const d = POR_ID[key];
        const nueva = !quieto && pintado.vista === 'tabla' && pintado.claves.indexOf(key) < 0;
        tr.appendChild(el('td', 'tabla__v' + (nueva ? ' tabla__v--nuevo' : ''), cifra(d, d.v(id))));
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    caja.appendChild(t);
    cont.appendChild(caja);
    const fu = el('ul', 'tabla__fuentes');
    elegidos.forEach(function (key) {
      const d = POR_ID[key];
      if (!d.fuente) return;
      const li = el('li');
      li.appendChild(document.createTextNode(d.titulo + ': '));
      const a = el('a', null, d.fuente[0].replace(' · ', ', '));
      a.href = d.fuente[1];
      li.appendChild(a);
      fu.appendChild(li);
    });
    cont.appendChild(fu);
  }

  /* ── En gráfica: un dato en cada eje, una ciudad en cada punto ────── */

  /* Marcas «redondas» para un eje: 1, 2 o 5 por una potencia de diez. */
  function marcas(min, max, n) {
    const paso0 = (max - min) / n || 1;
    const p = Math.pow(10, Math.floor(Math.log10(paso0)));
    const f = paso0 / p;
    const paso = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
    const ini = Math.floor(min / paso) * paso, fin = Math.ceil(max / paso) * paso;
    const xs = [];
    for (let v = ini; v <= fin + paso / 2; v += paso) xs.push(+v.toFixed(10));
    return { xs: xs, dec: Math.max(0, -Math.floor(Math.log10(paso))) };
  }

  function ejesValidos() {
    if (elegidos.indexOf(ejes.x) < 0) ejes.x = elegidos[0];
    if (elegidos.indexOf(ejes.y) < 0 || ejes.y === ejes.x) {
      ejes.y = elegidos.filter(function (k) { return k !== ejes.x; })[0];
    }
  }

  const SVG = 'http://www.w3.org/2000/svg';
  function s(tag, at, txt) {
    const e = document.createElementNS(SVG, tag);
    Object.keys(at || {}).forEach(function (k) { e.setAttribute(k, at[k]); });
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  /* Juntos: los datos que se miden igual comparten gráfica, una línea de
     cada color por dato. Se juntan por el símbolo (%, días, años, m²); los
     euros, por lo que dividen (por habitante, por persona, por hogar, por
     declaración); y los demás, por la cifra y la población de su «por cada»:
     10.000 niños de 3 a 11 años no son 10.000 personas de 65 o más, y en la
     misma escala no se comparan. */
  const MAX_SERIES = 6;
  function familia(d) {
    if (d.familia) return d.familia;
    if (d.sim === '€') {
      const e = /por (habitante|persona|hogar|declaración)\b/.exec(d.titulo + ' ' + d.unidad);
      return e ? '€ ' + e[0] : 'solo:' + d.id;
    }
    if (['%', 'días', 'años', 'm²'].indexOf(d.sim) >= 0) return d.sim;
    const m = /por cada [\d.]+ [^,(]+/.exec(d.unidad);
    return m ? m[0].trim() : 'solo:' + d.id;
  }
  const NOMBRE_FAMILIA = { '%': 'De cada 100', 'días': 'En días', 'años': 'En años', 'm²': 'En metros cuadrados',
    '€ por habitante': 'En euros por habitante', '€ por persona': 'En euros por persona', '€ por hogar': 'En euros por hogar',
    '€ por declaración': 'En euros por declaración' };
  const ordenJuntos = {};

  /* La gráfica de siempre: las ciudades en el eje horizontal, ordenadas
     por el dato elegido; las cifras en el vertical, de cero a la mayor; una
     línea (o una columna) de un color por dato. Al pasar por una ciudad, o
     al tocarla, sale una caja con sus cifras. */
  function dibujo(ds, ids, cont) {
    const W = Math.max(300, Math.round(cont.clientWidth || 640));
    const estrecho = W < 700;
    const H = estrecho ? 360 : 420;
    const M = { l: 52, r: 12, t: 14, b: estrecho ? 84 : 40 };
    const n = ids.length, bw = (W - M.l - M.r) / n;
    const CX = function (i) { return M.l + bw * (i + .5); };
    /* De cero a la mayor; si alguna es negativa (el remanente de Parla),
       el eje baja de cero hasta ella. */
    const vs = [];
    ds.forEach(function (d) { ids.forEach(function (id) { const v = d.v(id); if (v != null) vs.push(v); }); });
    const my = marcas(Math.min(0, Math.min.apply(null, vs)), Math.max(0, Math.max.apply(null, vs)) || 1, 5);
    const y0 = my.xs[0], y1 = ultimo(my.xs);
    const Y = function (v) { return H - M.b - (v - y0) / (y1 - y0) * (H - M.t - M.b); };
    const svg = s('svg', { class: 'gj__svg', width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': ds.map(function (d) { return d.titulo; }).join(', ') + ', las once ciudades' });

    ids.forEach(function (id, i) {
      if (id === REF) svg.appendChild(s('rect', { class: 'gj__ref', x: M.l + bw * i, y: M.t, width: bw, height: H - M.t - M.b }));
    });
    my.xs.forEach(function (v) {
      svg.appendChild(s('line', { class: v ? 'graf__rej' : 'gj__cero', x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }));
      svg.appendChild(s('text', { class: 'graf__m', x: M.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }, num(v, my.dec)));
    });
    ids.forEach(function (id, i) {
      const nom = NOMBRE[id].replace(' de Alarcón', '').replace(' de Ardoz', '');
      const at = estrecho
        ? { class: 'gj__x', x: CX(i), y: H - M.b + 14, 'text-anchor': 'end', transform: 'rotate(-45 ' + CX(i) + ' ' + (H - M.b + 14) + ')' }
        : { class: 'gj__x', x: CX(i), y: H - M.b + 20, 'text-anchor': 'middle' };
      const t = s('text', at, nom);
      if (id === REF) t.setAttribute('data-quien', 'referencia');
      svg.appendChild(t);
    });

    const guia = s('line', { class: 'gj__guia', y1: M.t, y2: H - M.b, x1: 0, x2: 0, visibility: 'hidden' });
    svg.appendChild(guia);
    if (forma === 'columnas') {
      const gw = bw * .78, cw = gw / ds.length;
      ds.forEach(function (d, k) {
        ids.forEach(function (id, i) {
          const v = d.v(id);
          if (v == null || v === 0) return;
          svg.appendChild(s('rect', { class: 'gj__col', 'data-s': k + 1, x: CX(i) - gw / 2 + cw * k + .5, y: Y(Math.max(v, 0)),
            width: Math.max(1, cw - 1), height: Math.abs(Y(0) - Y(v)), style: '--i:' + i }));
        });
      });
    } else {
      ds.forEach(function (d, k) {
        /* Si a una ciudad le falta el dato, la línea se corta ahí. */
        let camino = '', antes = false;
        ids.forEach(function (id, i) {
          const v = d.v(id);
          if (v == null) { antes = false; return; }
          camino += (antes ? 'L' : 'M') + CX(i).toFixed(1) + ' ' + Y(v).toFixed(1);
          antes = true;
        });
        svg.appendChild(s('path', { class: 'gj__lin', 'data-s': k + 1, d: camino, pathLength: 1, style: '--k:' + k }));
        ids.forEach(function (id, i) {
          const v = d.v(id);
          if (v == null) return;
          svg.appendChild(s('circle', { class: 'gj__pt', 'data-s': k + 1, cx: CX(i), cy: Y(v), r: id === REF ? 4.5 : 3.5,
            style: '--i:' + i + ';--k:' + k }));
        });
      });
    }

    const caja = el('div', 'gj__caja');
    const tip = el('div', 'gj__tip');
    tip.hidden = true;
    function ver(i) {
      const id = ids[i];
      vaciar(tip);
      tip.appendChild(el('p', 'gj__tip-h', NOMBRE[id]));
      ds.forEach(function (d, k) {
        const fila = el('p', 'gj__tip-f');
        fila.dataset.s = String(k + 1);
        fila.appendChild(el('i', 'gj__color'));
        fila.appendChild(el('span', null, d.titulo));
        fila.appendChild(el('b', null, cifra(d, d.v(id))));
        tip.appendChild(fila);
      });
      tip.hidden = false;
      guia.setAttribute('x1', CX(i));
      guia.setAttribute('x2', CX(i));
      guia.setAttribute('visibility', 'visible');
      const izq = CX(i) > W / 2;
      tip.style.left = izq ? '' : (CX(i) + 12) + 'px';
      tip.style.right = izq ? (W - CX(i) + 12) + 'px' : '';
    }
    function ocultar() { tip.hidden = true; guia.setAttribute('visibility', 'hidden'); }
    ids.forEach(function (id, i) {
      const r = s('rect', { class: 'gj__zona', x: M.l + bw * i, y: M.t, width: bw, height: H - M.t });
      r.addEventListener('pointerenter', function () { ver(i); });
      r.addEventListener('click', function () { ver(i); });
      svg.appendChild(r);
    });
    svg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ocultar(); });
    teclado(svg, n, ver, ocultar);
    tip.setAttribute('role', 'status');
    caja.appendChild(svg);
    caja.appendChild(tip);
    return caja;
  }

  /* Con el teclado: la gráfica se enfoca con el tabulador y las flechas
     pasan de una ciudad a otra; Inicio y Fin, a la primera y la última;
     Escape cierra la caja. La caja lo dice en voz alta (role=status). */
  function teclado(svg, n, ver, ocultar) {
    let i = -1;
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End Escape');
    svg.addEventListener('focus', function () { i = Math.max(0, i); ver(i); });
    svg.addEventListener('blur', ocultar);
    svg.addEventListener('keydown', function (e) {
      const k = e.key;
      if (k === 'Escape') { ocultar(); return; }
      const sig = k === 'ArrowRight' || k === 'ArrowDown' ? i + 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? i - 1 :
        k === 'Home' ? 0 : k === 'End' ? n - 1 : null;
      if (sig === null) return;
      e.preventDefault();
      i = Math.min(n - 1, Math.max(0, sig));
      ver(i);
    });
  }

  function juntos(cont, barra) {
    const formas = el('div', 'vista vista--sub');
    formas.setAttribute('role', 'group');
    formas.setAttribute('aria-label', 'Líneas o columnas');
    [['lineas', 'Líneas'], ['columnas', 'Columnas']].forEach(function (o) {
      const b = el('button', 'vista__op tp__min', o[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(forma === o[0]));
      b.addEventListener('click', function () { forma = o[0]; guardar(); resultados(); });
      formas.appendChild(b);
    });
    barra.appendChild(formas);
    const fams = [];
    elegidos.forEach(function (k) {
      const f = familia(POR_ID[k]);
      let x = fams.filter(function (y) { return y.f === f; })[0];
      if (!x) { x = { f: f, ks: [] }; fams.push(x); }
      x.ks.push(k);
    });
    fams.forEach(function (fam) {
      const ks = fam.ks.slice(0, MAX_SERIES);
      const ds = ks.map(function (k) { return POR_ID[k]; });
      const art = el('article', 'res gj');
      const firma = forma + '|' + ks.join(',') + '|' + (ordenJuntos[fam.f] || '');
      if (pintado.graficas['j:' + fam.f] !== firma && !redibujo && !quieto) art.classList.add('gj--anima');
      pintado.graficas['j:' + fam.f] = firma;
      art.appendChild(el('p', 'res__g', NOMBRE_FAMILIA[fam.f] ||
        (fam.f.indexOf('solo:') === 0 ? ds[0].grupo : fam.f.charAt(0).toUpperCase() + fam.f.slice(1))));
      if (ks.length === 1) {
        art.appendChild(el('h3', 'res__h', ds[0].titulo));
        art.appendChild(el('p', 'res__u', ds[0].unidad));
      }

      /* La leyenda: pulsar un dato ordena por él. */
      let por = ks.indexOf(ordenJuntos[fam.f]) >= 0 ? ordenJuntos[fam.f] : ks[0];
      if (ks.length > 1) {
        const ley = el('ul', 'gj__ley');
        ks.forEach(function (k, i) {
          const li = el('li');
          const b = el('button', 'gj__serie');
          b.type = 'button';
          b.dataset.s = String(i + 1);
          b.setAttribute('aria-pressed', String(k === por));
          b.title = 'Ordenar por este dato';
          b.appendChild(el('i', 'gj__color'));
          const t = el('span', 'gj__t');
          t.appendChild(el('span', 'gj__q', POR_ID[k].titulo));
          t.appendChild(el('span', 'gj__u', POR_ID[k].unidad + sentidoCorto(k) + (k === por ? ' · ordenado por este' : '')));
          b.appendChild(t);
          b.addEventListener('click', function () { ordenJuntos[fam.f] = k; resultados(); });
          li.appendChild(b);
          ley.appendChild(li);
        });
        art.appendChild(ley);
      }
      if (fam.ks.length > MAX_SERIES) {
        art.appendChild(el('p', 'res__u', 'Caben ' + MAX_SERIES + ' datos por gráfica; los demás de esta ' +
          'medida salen en «Uno a uno» o en tabla.'));
      }

      const dp = POR_ID[por];
      const ids = IDS.slice().sort(function (a, b) {
        const va = dp.v(a), vb = dp.v(b);
        if (va == null) return vb == null ? 0 : 1;
        if (vb == null) return -1;
        return vb - va;
      });
      art.appendChild(dibujo(ds, ids, cont));

      const fu = el('ul', 'tabla__fuentes');
      ds.forEach(function (d) {
        const li = el('li');
        li.appendChild(document.createTextNode(d.titulo + ': '));
        if (d.fuente) {
          const a = el('a', null, d.fuente[0].replace(' · ', ', '));
          a.href = d.fuente[1];
          li.appendChild(a);
          li.appendChild(document.createTextNode('. '));
        }
        if (d.pagina) {
          const ir = el('a', 'res__ir', 'Ver en su página');
          ir.href = d.pagina;
          li.appendChild(ir);
        }
        fu.appendChild(li);
      });
      art.appendChild(fu);
      cont.appendChild(art);
    });
  }

  function grafica(cont) {
    const barra = el('div', 'graf__barra');
    const sel = el('div', 'vista vista--sub');
    sel.setAttribute('role', 'group');
    sel.setAttribute('aria-label', 'Qué gráfica');
    [['juntos', 'Juntos, por medida'], ['cruce', 'Uno frente a otro']].forEach(function (o) {
      const b = el('button', 'vista__op tp__min', o[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(modo === o[0]));
      b.addEventListener('click', function () {
        modo = o[0];
        if (modo === 'cruce' && elegidos.length > 1) ejesValidos();
        guardar();
        resultados();
      });
      sel.appendChild(b);
    });
    barra.appendChild(sel);
    cont.appendChild(barra);
    if (modo === 'juntos') juntos(cont, barra); else cruce(cont);
  }

  function cruce(cont) {
    if (elegidos.length < 2) {
      cont.appendChild(el('p', 'res__vacio', 'Esta gráfica cruza dos datos: uno va en horizontal y el otro ' +
        'en vertical. Elige otro en la lista.'));
      return;
    }
    ejesValidos();
    const dx = POR_ID[ejes.x], dy = POR_ID[ejes.y];

    /* Qué dato va en cada eje. */
    const mando = el('div', 'graf__mando');
    [['x', 'En horizontal'], ['y', 'En vertical']].forEach(function (e) {
      const lab = el('label', 'graf__eje');
      lab.appendChild(el('span', 'graf__eje-t', e[1]));
      const sel = el('select');
      elegidos.forEach(function (k) {
        const o = el('option', null, POR_ID[k].titulo);
        o.value = k;
        o.selected = ejes[e[0]] === k;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        const otro = e[0] === 'x' ? 'y' : 'x';
        if (ejes[otro] === sel.value) ejes[otro] = ejes[e[0]];   /* el mismo en los dos: se cambian */
        ejes[e[0]] = sel.value;
        guardar();
        resultados();
      });
      lab.appendChild(sel);
      mando.appendChild(lab);
    });
    const cambiar = el('button', 'graf__cambiar tp__min', 'Cambiar los ejes');
    cambiar.type = 'button';
    cambiar.addEventListener('click', function () {
      ejes = { x: ejes.y, y: ejes.x };
      guardar();
      resultados();
    });
    mando.appendChild(cambiar);
    cont.appendChild(mando);

    const art = el('article', 'res graf');
    const firma = ejes.x + '|' + ejes.y;
    if (pintado.graficas.cruce !== firma && !redibujo && !quieto) art.classList.add('graf--anima');
    pintado.graficas.cruce = firma;
    art.appendChild(el('p', 'graf__ey', '↑ ' + dy.titulo + ', ' + dy.unidad + sentidoCorto(dy.id)));

    const pts = IDS.map(function (id) { return { id: id, x: dx.v(id), y: dy.v(id) }; })
      .filter(function (p) { return p.x != null && p.y != null; });
    const sin = IDS.filter(function (id) { return pts.every(function (p) { return p.id !== id; }); });

    /* Al ancho real de la caja, para que la letra no encoja en el móvil. */
    const W = Math.max(300, Math.round(cont.clientWidth || 640));
    const H = Math.round(Math.min(520, Math.max(360, W * 0.62)));
    const M = { l: 52, r: 26, t: 12, b: 30 };
    function rango(c) {
      const vs = pts.map(function (p) { return p[c]; });
      let a = Math.min.apply(null, vs), b = Math.max.apply(null, vs);
      if (a === b) { a -= 1; b += 1; }
      const m = (b - a) * 0.06;
      return marcas(a - m, b + m, W < 520 ? 4 : 6);
    }
    const mx = rango('x'), my = rango('y');
    const x0 = mx.xs[0], x1 = ultimo(mx.xs), y0 = my.xs[0], y1 = ultimo(my.xs);
    const X = function (v) { return M.l + (v - x0) / (x1 - x0) * (W - M.l - M.r); };
    const Y = function (v) { return H - M.b - (v - y0) / (y1 - y0) * (H - M.t - M.b); };

    const svg = s('svg', { class: 'graf__svg', width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': dx.titulo + ' frente a ' + dy.titulo + ', las once ciudades' });
    mx.xs.forEach(function (v) {
      svg.appendChild(s('line', { class: 'graf__rej', x1: X(v), x2: X(v), y1: M.t, y2: H - M.b }));
      svg.appendChild(s('text', { class: 'graf__m', x: X(v), y: H - M.b + 18, 'text-anchor': 'middle' }, num(v, mx.dec)));
    });
    my.xs.forEach(function (v) {
      svg.appendChild(s('line', { class: 'graf__rej', x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }));
      svg.appendChild(s('text', { class: 'graf__m', x: M.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }, num(v, my.dec)));
    });

    /* Los nombres, sin pisarse: a la derecha del punto, y si no cabe o
       choca con otro, a la izquierda, encima o debajo; si tampoco, un poco
       más arriba o más abajo, con una raya hasta el punto. El ancho se
       estima por letras (en el servidor de pruebas no hay medida de texto). */
    const puestos = [];
    function choca(r) {
      return r.x < M.l || r.x + r.w > W - 2 || r.y < 0 || r.y + r.h > H - M.b ||
        puestos.some(function (o) { return r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h; }) ||
        pts.some(function (p) { const px = X(p.x), py = Y(p.y); return px > r.x - 4 && px < r.x + r.w + 4 && py > r.y - 4 && py < r.y + r.h + 4; });
    }
    /* Parla primero, que su nombre no se quede sin sitio. */
    const turno = pts.slice().sort(function (a, b) { return (b.id === REF) - (a.id === REF); });
    const g = s('g');
    turno.forEach(function (p) {
      const px = X(p.x), py = Y(p.y), ref = p.id === REF;
      const c = s('circle', { class: 'graf__p', cx: px, cy: py, r: ref ? 6.5 : 5, style: '--i:' + IDS.indexOf(p.id) });
      if (ref) c.setAttribute('data-quien', 'referencia');
      c.addEventListener('pointerenter', function () { verPunto(pts.indexOf(p)); });
      c.addEventListener('click', function () { verPunto(pts.indexOf(p)); });
      p.nodo = c;
      g.appendChild(c);
      const nom = NOMBRE[p.id].replace(' de Alarcón', '').replace(' de Ardoz', '');
      const w = nom.length * (ref ? 7.6 : 6.9), h = 14;
      const op = [
        { x: px + 9, y: py - h / 2, a: 'start' },
        { x: px - 9 - w, y: py - h / 2, a: 'end' },
        { x: px - w / 2, y: py - 10 - h, a: 'middle' },
        { x: px - w / 2, y: py + 9, a: 'middle' }
      ];
      [16, 30, 44, 58].forEach(function (d) {
        [-d, d].forEach(function (dd) {
          op.push({ x: px + 12, y: py - h / 2 + dd, a: 'start', raya: true });
          op.push({ x: px - 12 - w, y: py - h / 2 + dd, a: 'end', raya: true });
        });
      });
      let elegido = null;
      for (let i = 0; i < op.length && !elegido; i++) {
        if (!choca({ x: op[i].x, y: op[i].y, w: w, h: h })) elegido = op[i];
      }
      if (!elegido) elegido = op[px + 9 + w > W - 2 ? 1 : 0];
      puestos.push({ x: elegido.x, y: elegido.y, w: w, h: h });
      const tx = elegido.a === 'start' ? elegido.x : elegido.a === 'end' ? elegido.x + w : elegido.x + w / 2;
      if (elegido.raya) {
        g.appendChild(s('line', { class: 'graf__raya', x1: px, y1: py,
          x2: elegido.a === 'start' ? tx - 2 : tx + 2, y2: elegido.y + h / 2 }));
      }
      const t = s('text', { class: 'graf__q', x: tx, y: elegido.y + 11, 'text-anchor': elegido.a, style: '--i:' + IDS.indexOf(p.id) }, nom);
      if (ref) t.setAttribute('data-quien', 'referencia');
      g.appendChild(t);
    });
    svg.appendChild(g);
    const caja = el('div', 'graf__caja');
    const tip = el('div', 'gj__tip');
    tip.hidden = true;
    tip.setAttribute('role', 'status');
    /* Con el teclado se recorren de izquierda a derecha. */
    pts.sort(function (a, b) { return a.x - b.x; });
    function verPunto(i) {
      const p = pts[i];
      pts.forEach(function (q) { q.nodo.classList.toggle('graf__p--activo', q === p); });
      vaciar(tip);
      tip.appendChild(el('p', 'gj__tip-h', NOMBRE[p.id]));
      [[dx, p.x, '→'], [dy, p.y, '↑']].forEach(function (x) {
        const f = el('p', 'gj__tip-f gj__tip-f--eje');
        f.appendChild(el('i', null, x[2]));
        f.appendChild(el('span', null, x[0].titulo));
        f.appendChild(el('b', null, cifra(x[0], x[1])));
        tip.appendChild(f);
      });
      tip.hidden = false;
      const px = X(p.x), py = Y(p.y);
      tip.style.left = px > W / 2 ? '' : (px + 14) + 'px';
      tip.style.right = px > W / 2 ? (W - px + 14) + 'px' : '';
      tip.style.top = Math.max(0, Math.min(H - 110, py - 40)) + 'px';
    }
    function ocultarPunto() {
      tip.hidden = true;
      pts.forEach(function (q) { q.nodo.classList.remove('graf__p--activo'); });
    }
    svg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ocultarPunto(); });
    teclado(svg, pts.length, verPunto, ocultarPunto);
    caja.appendChild(svg);
    caja.appendChild(tip);
    art.appendChild(caja);
    art.appendChild(el('p', 'graf__ex', dx.titulo + ', ' + dx.unidad + sentidoCorto(dx.id) + ' →'));
    if (sin.length) art.appendChild(el('p', 'res__u', 'Sin dato: ' + sin.map(function (id) { return NOMBRE[id]; }).join(', ') + '.'));
    cont.appendChild(art);

    const fu = el('ul', 'tabla__fuentes');
    [dx, dy].forEach(function (d) {
      const li = el('li');
      li.appendChild(document.createTextNode(d.titulo + ': '));
      if (d.fuente) {
        const a = el('a', null, d.fuente[0].replace(' · ', ', '));
        a.href = d.fuente[1];
        li.appendChild(a);
        li.appendChild(document.createTextNode('. '));
      }
      if (d.pagina) {
        const ir = el('a', 'res__ir', 'Ver en su página');
        ir.href = d.pagina;
        li.appendChild(ir);
      }
      fu.appendChild(li);
    });
    cont.appendChild(fu);
  }

  let redibujo = false;   /* al cambiar el ancho: se rehace, sin animar */
  function resultados() {
    const cont = $('#resultados');
    /* Dónde estaba cada fila de la tabla, para deslizarla luego. */
    const antes = {};
    if (!quieto && pintado.vista === 'tabla' && vista === 'tabla') {
      cont.querySelectorAll('tr[data-id]').forEach(function (tr) { antes[tr.dataset.id] = tr.getBoundingClientRect().top; });
    }
    if (pintado.vista !== vista) cont.classList.remove('con__cambia');
    vaciar(cont);
    document.querySelectorAll('.vista > .vista__op[data-vista]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.vista === vista)); });
    if (!elegidos.length) {
      cont.appendChild(el('p', 'res__vacio', 'Elige uno o varios datos en la lista y aquí saldrán las once ciudades.'));
      return;
    }
    if (vista === 'tabla') tabla(cont); else if (vista === 'grafica') grafica(cont); else barras(cont);
    if (pintado.vista !== vista && pintado.vista !== null && !quieto) {
      void cont.offsetWidth;
      cont.classList.add('con__cambia');
    }
    Object.keys(antes).forEach(function (id) {
      const tr = cont.querySelector('tr[data-id="' + id + '"]');
      if (!tr) return;
      const d = antes[id] - tr.getBoundingClientRect().top;
      if (!d) return;
      /* Celda a celda: la fila de una tabla no se mueve bien con la
         columna de la ciudad fija al hacer scroll. */
      const celdas = tr.querySelectorAll('th, td');
      celdas.forEach(function (c) { c.style.transition = 'none'; c.style.transform = 'translateY(' + d + 'px)'; });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          celdas.forEach(function (c) { c.style.transition = ''; c.style.transform = ''; });
        });
      });
    });
    pintado.vista = vista;
    pintado.claves = elegidos.slice();
    herramientas();
  }

  /* ── Arranque ─────────────────────────────────────────────────────── */

  /* En el móvil la lista va plegada, para que se vean los resultados. */
  const cat = $('.cat'), abrir = $('#cat-abrir');
  function plegar(abierta) {
    cat.classList.toggle('cat--abierta', abierta);
    abrir.setAttribute('aria-expanded', String(abierta));
    abrir.textContent = abierta ? 'Plegar la lista' : 'Ver la lista de datos';
  }
  abrir.addEventListener('click', function () { plegar(!cat.classList.contains('cat--abierta')); });

  /* El CSV: punto y coma y coma decimal, como lo abre una hoja de cálculo
     en español, y con BOM para que respete las tildes. */
  function csv() {
    const c = function (t) { t = String(t); return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const filas = [['Ciudad'].concat(elegidos.map(function (k) { return POR_ID[k].titulo + ' (' + POR_ID[k].unidad + ')'; }))];
    IDS.forEach(function (id) {
      filas.push([NOMBRE[id]].concat(elegidos.map(function (k) {
        const d = POR_ID[k], v = d.v(id);
        return v == null ? '' : v.toFixed(d.dec).replace('.', ',');
      })));
    });
    filas.push([]);
    filas.push(['Dato', 'Unidad', 'Fuente', 'Enlace']);
    elegidos.forEach(function (k) {
      const d = POR_ID[k];
      filas.push([d.titulo, d.unidad + (d.sim && d.sim !== '%' ? ' (' + d.sim + ')' : ''), d.fuente ? d.fuente[0] : '', d.fuente ? d.fuente[1] : '']);
    });
    filas.push([]);
    filas.push([D.NOMBRE_WEB, location.href]);
    return '\ufeff' + filas.map(function (f) { return f.map(c).join(';'); }).join('\r\n');
  }
  $('#con-csv').addEventListener('click', function () {
    if (!elegidos.length) return;
    const url = URL.createObjectURL(new Blob([csv()], { type: 'text/csv;charset=utf-8' }));
    const a = el('a');
    a.href = url;
    a.download = 'parla-a-la-cola-datos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  /* «Compartir esta vista»: el mismo botón y el mismo aviso que «Compartir esta
     sección» (CARTEL.enlace). Con un solo dato y la vista de siempre, en la web
     publicada va la ruta con su propia vista previa (/consulta/<dato>/, que escribe
     herramientas/compartir.mjs); si no, la dirección con todo lo elegido. */
  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const bEnlace = window.CARTEL.enlace({
    rotulo: 'Compartir esta vista',
    url: function () {
      guardar();
      if (RUTAS && elegidos.length === 1 && vista === 'barras') return 'consulta/' + elegidos[0] + '/';
      return location.href;
    },
    titulo: function () { return elegidos.length === 1 ? POR_ID[elegidos[0]].titulo : 'Todos los datos de las once ciudades'; }
  });
  bEnlace.id = 'con-enlace';
  $('#con-csv').parentNode.insertBefore(bEnlace, $('#con-csv'));
  function herramientas() {
    $('#con-csv').disabled = !elegidos.length;
    bEnlace.disabled = !elegidos.length;
  }

  $('#cat-buscar').addEventListener('input', function () {
    if ($('#cat-buscar').value) plegar(true);
    catalogo();
  });
  $('#cat-limpiar').addEventListener('click', function () {
    elegidos = [];
    guardar();
    catalogo();
    cuenta();
    if (quieto) { resultados(); return; }
    $('#resultados').querySelectorAll('.res, .tabla-caja, .tabla__fuentes').forEach(function (n) { n.classList.add('res--sale'); });
    setTimeout(resultados, 180);
  });
  document.querySelectorAll('.vista__op[data-vista]').forEach(function (b) {
    b.addEventListener('click', function () {
      vista = b.dataset.vista;
      if (vista === 'grafica' && modo === 'cruce' && elegidos.length > 1) ejesValidos();
      guardar();
      resultados();
    });
  });
  /* La gráfica se dibuja al ancho de la caja: se rehace si cambia. */
  let ancho = window.innerWidth, espera = null;
  window.addEventListener('resize', function () {
    if (vista !== 'grafica' || window.innerWidth === ancho) return;
    ancho = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(function () { redibujo = true; resultados(); redibujo = false; }, 150);
  });
  /* ── De cuándo es cada dato ────────────────────────────────────────
     A mano: la fecha de la cifra que usa la web y cada cuánto sale una
     nueva. Al actualizar un fichero de datos/, cámbiese aquí también. */
  const AL_DIA = [
    ['Padrón (INE): habitantes y edades', '1 de enero de 2025', 'Cada año'],
    ['Equipamientos: estaciones, farmacias, bibliotecas, centros de salud, colegios, residencias, oficinas', '2025 y 2026', 'Se revisa a mano'],
    ['Camas de hospital (Catálogo Nacional de Hospitales)', '2025', 'Cada año'],
    ['Listas de espera de los hospitales (SERMAS)', (window.SANIDAD || {}).mes || '—', 'Cada mes'],
    ['Población asignada a cada hospital (memorias de los hospitales)', '31 de diciembre de 2024', 'Cada año'],
    ['Plazas de médico de familia y pediatra (plantilla del SERMAS)', '15 de octubre de 2026', 'Cuando cambia la plantilla'],
    ['Tarjetas sanitarias por centro de salud (Observatorio del SERMAS)', '2024', 'Cada año'],
    ['Admisión y alumnos de las escuelas infantiles públicas (Comunidad de Madrid)', 'Admisión ' + ((window.INFANTIL || {}).cursoAdmision || '—') + '; alumnos ' + ((window.INFANTIL || {}).cursoMatricula || '—'), 'Cada curso'],
    ['Centros para la discapacidad y la salud mental (Registro de centros de atención social)', ((window.DISCAPACIDAD || {}).fuentes || { registro: ['—'] }).registro[0].replace(/^.*, a /, ''), 'Cada mes'],
    ['Personas con discapacidad reconocida (Comunidad de Madrid)', '31 de diciembre de ' + ((window.DISCAPACIDAD || {}).anio || '—'), 'Cada año'],
    ['Colegios de educación especial (directorio de centros educativos)', ((window.DISCAPACIDAD || {}).fuentes || { colegios: ['—'] }).colegios[0].replace(/^.*, a /, ''), 'Cada año'],
    ['Zonas verdes (Copernicus, Urban Atlas)', '2018', 'Cada seis años'],
    ['Paro registrado (SEPE)', 'Media de 2025; último mes, septiembre de 2026', 'Cada mes'],
    ['Contratos (SEPE)', '2025', 'Cada mes'],
    ['Puestos de trabajo (afiliados por centro de trabajo)', 'Finales de 2025', 'Cada trimestre'],
    ['Dónde trabajan los vecinos (Censo anual, INE)', '2023', 'Cada año'],
    ['Tasa de paro municipal (INE, Indicadores Urbanos)', '2024', 'Cada año'],
    ['Renta, Gini y fuentes de ingreso (Atlas de renta, INE)', '2024', 'Cada año, con dos de retraso'],
    ['IRPF por municipios (Agencia Tributaria)', '2024', 'Cada año, con dos de retraso'],
    ['Empresas activas (DIRCE, INE)', '2025', 'Cada año'],
    ['PIB municipal (Comunidad de Madrid)', '2023', 'Cada año'],
    ['Cuentas del ayuntamiento (liquidaciones, Hacienda)', '2021 a 2024', 'Cada año'],
    ['Deuda viva (Hacienda)', '31 de diciembre de 2025', 'Cada año'],
    ['Periodo medio de pago (Hacienda)', 'Agosto de 2026', 'Cada mes'],
    ['Valor tasado de la vivienda (Ministerio de Vivienda)', 'Último trimestre publicado', 'Cada trimestre'],
    ['Alquiler (SERPAVI, Ministerio de Vivienda)', '2024', 'Cada año'],
    ['Compraventas (Ministerio de Vivienda)', '2025', 'Cada trimestre'],
    ['Censo de viviendas y hogares (INE)', '2021', 'Cada diez años'],
    ['Titulares de las viviendas (padrón del IBI, Catastro)', '2026', 'Cada año'],
    ['Tipos del IBI y del impuesto de vehículos (Hacienda)', '2026', 'Cada año'],
    ['Valor catastral de las viviendas (Catastro)', '2026', 'Cada año'],
    ['Tasa de basuras (ordenanzas en el BOCM)', '2026', 'Cada año'],
    ['Viajes en coche (Ministerio de Transportes)', '16 de octubre de 2024', 'Sin fecha fija'],
    ['Horarios del transporte público (Consorcio Regional de Transportes)', 'Los de octubre de 2026', 'Cuando cambian los horarios'],
    ['Precio del abono (BOCM)', '2026', 'Cada año'],
    ['Nivel de estudios (Indicadores Urbanos, INE)', '2024', 'Cada año'],
    ['Esperanza de vida (Instituto de Estadística de la Comunidad de Madrid)', '2024', 'Cada año'],
    ['Pensiones contributivas (Instituto de Estadística de la Comunidad de Madrid, a partir del INSS)', '1 de enero de 2025', 'Cada año'],
    ['Antigüedad de los turismos (DGT, vía Instituto de Estadística)', '31 de diciembre de 2025', 'Cada año']
  ];
  (function () {
    const t = $('#al-dia-tabla');
    if (!t) return;
    const cab = el('thead');
    const tr = el('tr');
    ['Datos', 'La cifra es de', 'Sale una nueva'].forEach(function (x, i) {
      const th = el('th', i ? null : 'tabla__ciudad', x);
      th.setAttribute('scope', 'col');
      tr.appendChild(th);
    });
    cab.appendChild(tr);
    t.appendChild(cab);
    const tb = el('tbody');
    AL_DIA.forEach(function (f) {
      const r = el('tr');
      const th = el('th', 'tabla__ciudad', f[0]);
      th.setAttribute('scope', 'row');
      r.appendChild(th);
      r.appendChild(el('td', null, f[1]));
      r.appendChild(el('td', null, f[2]));
      tb.appendChild(r);
    });
    t.appendChild(tb);
    document.querySelectorAll('[data-actualizado]').forEach(function (n) { n.textContent = D.ACTUALIZADO; });
  })();

  $('#cat-total').textContent = CAT.length + ' datos de las ' + IDS.length + ' ciudades';
  catalogo();
  cuenta();
  resultados();
  window.CONSULTA = { catalogo: CAT };
})();

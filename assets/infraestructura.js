/* ═══════════════════════════════════════════════════════════════════════
   SALIR · las colas, los dos sentidos y el método de infraestructura.html
   Los datos, en datos/infraestructura.js (los escribe
   herramientas/infraestructura.py). Aquí no se calcula nada que no sea
   repartir y contar: un punto por cada 100 personas. La ciudad, el
   selector y la frase de arriba los lleva infraestructura-comun.js.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const I = window.INFRA;
  const A = I.A, REF = I.REF, NOMBRE = I.NOMBRE;

  const POR_PUNTO = 100;
  const MINIMA = 0.01;     /* una puerta con menos del 1 % va con «otras» */

  const quieto = I.quieto;
  const $ = I.$;

  /* ── Formato ──────────────────────────────────────────────────────── */

  function entero(n) { return Math.round(n).toLocaleString('es-ES', { useGrouping: true }); }
  function num(n, dec) {
    return n.toLocaleString('es-ES',
      { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function pct(x) { return num(x * 100, 1) + ' %'; }

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* ── Las puertas de una ciudad ────────────────────────────────────── */

  function total(c) {
    return c.puertas.reduce(function (s, p) { return s + p.v; }, 0) + c.calles;
  }

  /* Las filas que se pintan: las puertas con al menos el 1 %, las demás
     juntas, y lo que sale por calles. */
  function filas(c) {
    const t = total(c);
    const grandes = c.puertas.filter(function (p) { return p.v / t >= MINIMA; });
    const chicas = c.puertas.filter(function (p) { return p.v / t < MINIMA; });
    const out = grandes.map(function (p) {
      return { via: p.via, hacia: p.hacia, v: p.v, tipo: 'puerta' };
    });
    /* Las calles antes que «otras»: si la fila no cabe, que baje lo más
       pequeño. */
    if (c.calles >= POR_PUNTO / 2) {
      out.push({ via: 'Calles', hacia: 'sin pasar por una carretera principal', v: c.calles, tipo: 'calles' });
    }
    const resto = chicas.reduce(function (s, p) { return s + p.v; }, 0);
    if (resto >= POR_PUNTO / 2) {
      out.push({ via: null, hacia: chicas.length === 1 ? 'Otra salida' : 'Otras ' + chicas.length + ' salidas', v: resto, tipo: 'resto' });
    }
    return { t: t, filas: out, n: grandes.length };
  }

  /* ── El dibujo de cada cola ───────────────────────────────────────
     Cada puerta es un dintel con su rótulo encima, y la gente hace cola
     debajo, de seis en fondo: la cola crece hacia abajo y la de la puerta
     más cargada es la más larga. Llegan desde abajo, andando hacia la
     puerta. */

  const colas = [];   /* { lienzo, n, quien, tipo, hecha, t0 } */
  const FONDO = 6;    /* personas por fila de cola */

  function medidas() {
    const ancho = window.innerWidth >= 736;
    return { d: ancho ? 7 : 6, paso: ancho ? 10 : 9, dintel: 3, jamba: 9, hueco: 8 };
  }

  function colorDe(quien) {
    const raiz = getComputedStyle(document.documentElement);
    return {
      gente: (quien === 'referencia' ? raiz.getPropertyValue('--ref') : raiz.getPropertyValue('--ink-3')).trim(),
      puerta: raiz.getPropertyValue('--ink').trim(),
      calle: raiz.getPropertyValue('--line-alta').trim()
    };
  }

  function colocar(c) {
    const m = medidas();
    const ancho = FONDO * m.paso + 6;
    const filasN = Math.max(1, Math.ceil(c.n / FONDO));
    const alto = m.dintel + m.hueco + filasN * m.paso;
    const r = window.devicePixelRatio || 1;
    c.lienzo.width = Math.round(ancho * r);
    c.lienzo.height = Math.round(alto * r);
    c.lienzo.style.width = ancho + 'px';
    c.lienzo.style.height = alto + 'px';
    c.m = m; c.ancho = ancho; c.alto = alto; c.r = r;
    /* De dónde llega cada uno: de más abajo, con un poco de desorden, que
       una cola no se forma en fila india. */
    c.salida = [];
    for (let i = 0; i < c.n; i++) {
      c.salida.push({ dx: ((i * 37) % 11) - 5, y: alto + 6 + ((i * 17) % 40) });
    }
  }

  function puerta(ctx, c, col) {
    const m = c.m;
    ctx.fillStyle = c.tipo === 'calles' ? col.calle : col.puerta;
    ctx.fillRect(0, 0, c.ancho, m.dintel);                /* dintel */
    ctx.fillRect(0, 0, 1.5, m.dintel + m.jamba);           /* jambas */
    ctx.fillRect(c.ancho - 1.5, 0, 1.5, m.dintel + m.jamba);
  }

  function dibujar(c, ahora) {
    const ctx = c.lienzo.getContext('2d');
    const m = c.m;
    const col = colorDe(c.quien);
    ctx.setTransform(c.r, 0, 0, c.r, 0, 0);
    ctx.clearRect(0, 0, c.ancho, c.alto);
    puerta(ctx, c, col);

    ctx.fillStyle = col.gente;
    const rad = m.d / 2;
    const paso = 9;            /* ms entre uno y el siguiente */
    const viaje = 1000;        /* ms que tarda cada uno en llegar */
    let quedan = false;
    for (let i = 0; i < c.n; i++) {
      const fila = Math.floor(i / FONDO), colN = i % FONDO;
      const tx = 3 + colN * m.paso + m.paso / 2;
      const ty = m.dintel + m.hueco + fila * m.paso + m.paso / 2;
      let x = tx, y = ty;
      if (c.t0 !== null) {
        const t = Math.min(1, Math.max(0, (ahora - c.t0 - i * paso) / viaje));
        if (t < 1) quedan = true;
        if (t === 0) continue;
        const e = 1 - Math.pow(1 - t, 4);
        const s = c.salida[i];
        x = tx + s.dx * (1 - e);
        y = s.y + (ty - s.y) * e;
      }
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    return quedan;
  }

  function soloPuerta(c) {
    const ctx = c.lienzo.getContext('2d');
    ctx.setTransform(c.r, 0, 0, c.r, 0, 0);
    ctx.clearRect(0, 0, c.ancho, c.alto);
    puerta(ctx, c, colorDe(c.quien));
  }

  function animar(c) {
    if (quieto) { c.t0 = null; dibujar(c, 0); return; }
    c.t0 = performance.now();
    (function bucle(ahora) {
      if (dibujar(c, ahora)) requestAnimationFrame(bucle);
      else { c.t0 = null; dibujar(c, 0); }
    })(c.t0);
  }

  /* Las colas de una misma ciudad arrancan a la vez, cuando asoma su fila. */
  const mira = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      mira.unobserve(e.target);
      colas.forEach(function (c) {
        if (c.fila === e.target && !c.hecha) { c.hecha = true; animar(c); }
      });
    });
  }, { threshold: 0.15 }) : null;

  function cola(contenedor, f, t, quien) {
    const caja = el('div', 'cola' + (f.tipo !== 'puerta' ? ' cola--' + f.tipo : ''));

    const rot = el('div', 'cola__rotulo');
    if (f.via) rot.appendChild(el('span', 'rotulo', f.via));
    rot.appendChild(el('span', 'cola__hacia', f.hacia));
    caja.appendChild(rot);

    const cifra = el('p', 'cola__cifra');
    cifra.appendChild(el('b', null, entero(f.v)));
    cifra.appendChild(el('span', null, pct(f.v / t)));
    caja.appendChild(cifra);

    const n = Math.round(f.v / POR_PUNTO);
    const lienzo = el('canvas', 'cola__gente');
    lienzo.setAttribute('role', 'img');
    lienzo.setAttribute('aria-label', 'Cola de ' + n + (n === 1 ? ' punto' : ' puntos') +
      ', uno por cada 100 personas');
    caja.appendChild(lienzo);
    contenedor.appendChild(caja);

    const c = { lienzo: lienzo, n: n, quien: quien, tipo: f.tipo, hecha: false, t0: null,
      fila: contenedor };
    colas.push(c);
    colocar(c);
    if (quieto || !mira) { c.hecha = true; dibujar(c, 0); }
    else soloPuerta(c);     /* hasta que se ve, solo la puerta */
  }

  function grupo(id, nodo, quien) {
    vaciar(nodo);
    const c = A[id];
    const r = filas(c);
    const cab = el('div', 'colas__h');
    cab.appendChild(el('h3', 'colas__nombre', NOMBRE[id]));
    const res = el('p', 'colas__resumen');
    res.appendChild(el('b', null, String(r.n)));
    res.appendChild(document.createTextNode((r.n === 1 ? ' salida' : ' salidas') + ' con al menos el 1 %'));
    cab.appendChild(res);
    nodo.appendChild(cab);
    const fila = el('div', 'colas__puertas');
    nodo.appendChild(fila);
    r.filas.forEach(function (f) { cola(fila, f, r.t, quien); });
    if (mira && !quieto) mira.observe(fila);
  }

  /* ── Textos que salen de los datos ────────────────────────────────── */

  /* De 6 a 10, como un embudo por ciudad: arriba los que salen, abajo
     los que entran, con la misma escala en las dos ciudades y la forma que
     los une. Si salen más, se estrecha; si entran más, se ensancha. Encima,
     la proporción, dicha en el sentido que pesa más. */
  const miraSentidos = 'IntersectionObserver' in window && !I.quieto ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      miraSentidos.unobserve(e.target);
      e.target.classList.add('sent--visto');
    });
  }, { threshold: 0.3 }) : null;

  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, at) {
    const n = document.createElementNS(SVG, tag);
    Object.keys(at).forEach(function (k) { n.setAttribute(k, at[k]); });
    return n;
  }

  function sentidos() {
    const p = A[REF], a = A[I.AQUI];
    $('#sentidos-intro').textContent =
      'Personas que salen y que entran por carretera, en coche o en autobús, de 6 a 10 de la mañana.';
    const caja = $('#sentidos-filas');
    vaciar(caja);
    const max = Math.max(p.sale.h610, p.entra.h610, a.sale.h610, a.entra.h610);
    [[REF, 'referencia', p], [I.AQUI, 'aqui', a]].forEach(function (g) {
      const c = g[2], sale = c.sale.h610, entra = c.entra.h610;
      const col = el('div', 'sent');
      col.setAttribute('data-quien', g[1]);
      col.appendChild(el('h3', 'sent__nombre', NOMBRE[g[0]]));
      const frase = el('p', 'sent__frase');
      const salenMas = sale >= entra;
      frase.appendChild(el('b', null, num(salenMas ? sale / entra : entra / sale, 1)));
      frase.appendChild(document.createTextNode(salenMas ? ' salen por cada una que entra' : ' entran por cada una que sale'));
      col.appendChild(frase);

      const arriba = el('p', 'sent__dato');
      arriba.appendChild(el('span', null, 'Salen'));
      arriba.appendChild(el('b', null, entero(sale)));
      col.appendChild(arriba);

      /* 100 de ancho = la cifra mayor de las cuatro */
      const ws = 100 * sale / max, we = 100 * entra / max, H = 120, B = 14;
      const d = svg('svg', { viewBox: '0 0 100 ' + H, preserveAspectRatio: 'none', class: 'sent__embudo',
        role: 'img', 'aria-label': NOMBRE[g[0]] + ': salen ' + entero(sale) + ' y entran ' + entero(entra) });
      d.appendChild(svg('rect', { class: 'sent__sale', x: 50 - ws / 2, y: 0, width: ws, height: B }));
      d.appendChild(svg('path', { class: 'sent__cuello',
        d: 'M' + (50 - ws / 2) + ' ' + B + ' L' + (50 + ws / 2) + ' ' + B + ' L' + (50 + we / 2) + ' ' + (H - B) +
           ' L' + (50 - we / 2) + ' ' + (H - B) + ' Z' }));
      d.appendChild(svg('rect', { class: 'sent__entra', x: 50 - we / 2, y: H - B, width: we, height: B }));
      col.appendChild(d);

      const abajo = el('p', 'sent__dato');
      abajo.appendChild(el('span', null, 'Entran'));
      abajo.appendChild(el('b', null, entero(entra)));
      col.appendChild(abajo);

      caja.appendChild(col);
      if (miraSentidos) miraSentidos.observe(col); else col.classList.add('sent--visto');
    });
  }

  function metodo2023() {
    $('#metodo-2023').textContent =
      'El martes 17 de octubre de 2023 el reparto es casi el mismo: la salida más usada de Parla ' +
      'se llevaba el ' + pct(A[REF].primera2023) + ' de las salidas de la mañana, y la de ' +
      NOMBRE[I.AQUI] + ' el ' + pct(A[I.AQUI].primera2023) + '.';
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  I.alPintar(function () {
    colas.length = 0;
    grupo(REF, $('#colas-parla'), 'referencia');
    grupo(I.AQUI, $('#colas-aqui'), 'aqui');
    sentidos();
    metodo2023();
  });

  /* Al cambiar el ancho o el tema se recoloca y se repinta sin animar. */
  let espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      colas.forEach(function (c) { colocar(c); if (c.hecha) dibujar(c, 0); else soloPuerta(c); });
    }, 120);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    colas.forEach(function (c) { if (c.hecha) dibujar(c, 0); else soloPuerta(c); });
  });

  /* Es el último script de la página: con todas las partes apuntadas, arranca. */
  I.arrancar();
})();

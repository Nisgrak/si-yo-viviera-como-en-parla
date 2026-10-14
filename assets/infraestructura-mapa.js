/* ═══════════════════════════════════════════════════════════════════════
   SALIR EN COCHE · el mapa de infraestructura.html
   La misma gente que en las colas, pero sobre las carreteras de verdad.
   Las geometrías van en datos/mapa/<id>.js, en metros desde el centro de
   cada término (las escribe herramientas/accesos/accesos.py --mapa).

   Lo que se compara a simple vista tiene que ser comparable:
     - los dos mapas tienen el mismo tamaño, y cada uno su escala para que
       su término llene el marco (la barra de 1 km lo dice en cada uno);
     - el ancho de cada carretera es proporcional a la gente que sale por
       ella, con la misma regla en los dos;
     - los puntos se mueven repartidos dentro de ese ancho e igual de
       juntos en todas partes, así que una carretera con el doble de gente
       lleva el doble de puntos en una banda el doble de ancha. Los puntos
       no son personas contadas una a una.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const I = window.INFRA;
  const A = I.A, REF = I.REF, NOMBRE = I.NOMBRE, $ = I.$;
  const quieto = I.quieto, entero = I.entero, num = I.num, total = I.total;
  const cargar = I.cargar;

  /* ── Geometría ────────────────────────────────────────────────────── */

  function coords(v) { return v.c || v.coords || v.g || v.geometria || v; }

  function caja(m) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function mira(p) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    m.limite.forEach(function (anillo) { anillo.forEach(mira); });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  /* Una vía como polilínea con su longitud acumulada, para poner puntos a
     una distancia dada del principio. */
  function preparar(m) {
    if (m._listo) return m;
    m.vias.forEach(function (v) {
      const c = coords(v);
      const acc = [0];
      for (let i = 1; i < c.length; i++) {
        acc.push(acc[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
      }
      v._c = c; v._acc = acc; v._len = acc[acc.length - 1];
      /* La normal en cada vértice, media de las de sus dos tramos: así los
         puntos apartados del eje giran con la curva en vez de seguir recto
         hasta el vértice y saltar. */
      const nt = [];
      for (let i = 1; i < c.length; i++) {
        const l = acc[i] - acc[i - 1] || 1;
        nt.push([-(c[i][1] - c[i - 1][1]) / l, (c[i][0] - c[i - 1][0]) / l]);
      }
      v._n = c.map(function (_, i) {
        const a = nt[Math.max(0, i - 1)], b = nt[Math.min(nt.length - 1, i)];
        const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1;
        return [x / l, y / l];
      });
    });
    m._listo = true;
    return m;
  }

  /* El punto a una distancia d del principio, y la normal (en metros, con
     y hacia arriba) para apartarse del eje, interpolada entre las de los
     dos vértices del tramo. */
  /* mulberry32: un azar pequeño y repetible a partir de una semilla */
  function aleatorio(semilla) {
    let a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function enPunto(v, d) {
    const acc = v._acc, c = v._c, n = v._n;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < d) i++;
    const tramo = acc[i] - acc[i - 1] || 1;
    const t = Math.max(0, Math.min(1, (d - acc[i - 1]) / tramo));
    const nx = n[i - 1][0] + (n[i][0] - n[i - 1][0]) * t, ny = n[i - 1][1] + (n[i][1] - n[i - 1][1]) * t;
    const l = Math.hypot(nx, ny) || 1;
    return [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * t, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t, nx / l, ny / l];
  }

  /* ── Los dos mapas ────────────────────────────────────────────────── */

  const MARGEN = 3200;       /* metros alrededor del término */
  const VELOCIDAD = 700;     /* metros de mapa por segundo, para que se vea fluir */
  const ANCHO_MAX = 26;      /* píxeles de la carretera más cargada de las dos */
  const ANCHO_MIN = 1.25;    /* para que se vean las que llevan poca gente */
  const AIRE = 13;           /* píxeles² de banda por punto, en los dos mapas */
  let mapas = [];
  let reloj = null, visibles = new Set();

  function colores(quien) {
    const r = getComputedStyle(document.documentElement);
    const v = function (n) { return r.getPropertyValue(n).trim(); };
    return {
      gente: quien === 'referencia' ? v('--ref') : v('--ink-3'),
      via: v('--line-alta'), fondo: v('--line'), limite: v('--ink'),
      suelo: quien === 'referencia' ? v('--aura-ref') : v('--surface'),
      texto: v('--ink'), papel: v('--bg')
    };
  }

  function montar(lienzo, m, id, quien, escala) {
    const ancho = lienzo.parentNode.clientWidth;
    const bx = caja(m);
    const w = (bx.x1 - bx.x0) + 2 * MARGEN, h = (bx.y1 - bx.y0) + 2 * MARGEN;
    const alto = escala.alto;                     /* el mismo marco en los dos */
    const mpp = Math.max(w / ancho, h / alto);    /* metros por píxel, de cada uno */
    const r = window.devicePixelRatio || 1;
    lienzo.width = Math.round(ancho * r); lienzo.height = Math.round(alto * r);
    lienzo.style.height = alto + 'px';
    const cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2;
    const map = {
      lienzo: lienzo, m: preparar(m), id: id, quien: quien, r: r, ancho: ancho, alto: alto, mpp: mpp,
      px: function (p) { return [ancho / 2 + (p[0] - cx) / mpp, alto / 2 - (p[1] - cy) / mpp]; },
      puntos: []
    };
    /* Puntos por vía: tantos como quepan en su banda a razón de uno por
       AIRE píxeles², con la misma regla en los dos mapas. Cada uno sale de
       un sitio al azar de su hueco, a una altura al azar dentro de la banda
       y con su propia velocidad, como coches en distintos carriles: así no
       forman filas. El azar lleva semilla fija y el mapa sale igual cada vez. */
    const azar = aleatorio(id.length * 7919 + 17);
    m.vias.forEach(function (v) {
      if (!v.s || !v._len) return;
      v._w = Math.max(ANCHO_MIN, v.s * escala.ppp);
      const n = Math.round(v.s * escala.ppp * (v._len / mpp) / AIRE);
      for (let i = 0; i < n; i++) {
        map.puntos.push({ v: v, d: (i + azar()) * v._len / n, u: azar() - 0.5, vel: 0.75 + azar() * 0.5 });
      }
    });
    lienzo.setAttribute('aria-label', 'Mapa de ' + NOMBRE[id] + ' con las carreteras por las que sale la gente de 6 a 10 de la mañana');
    return map;
  }

  function bandas(map, col) {
    if (map._bandas) return map._bandas;
    const c = document.createElement('canvas');
    c.width = map.lienzo.width; c.height = map.lienzo.height;
    const b = c.getContext('2d');
    b.setTransform(map.r, 0, 0, map.r, 0, 0);
    b.strokeStyle = col.gente; b.lineCap = 'round'; b.lineJoin = 'round';
    map.m.vias.forEach(function (v) {
      if (!v._w) return;
      b.lineWidth = v._w;
      b.beginPath();
      v._c.forEach(function (p, i) { const q = map.px(p); i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1]); });
      b.stroke();
    });
    map._bandas = c;
    return c;
  }

  function dibujar(map, dt) {
    const ctx = map.lienzo.getContext('2d');
    const col = colores(map.quien);
    const m = map.m;
    ctx.setTransform(map.r, 0, 0, map.r, 0, 0);
    ctx.clearRect(0, 0, map.ancho, map.alto);

    /* el término */
    ctx.beginPath();
    m.limite.forEach(function (anillo) {
      anillo.forEach(function (p, i) { const q = map.px(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
    });
    ctx.fillStyle = col.suelo; ctx.fill('evenodd');
    ctx.lineWidth = 1.5; ctx.strokeStyle = col.limite; ctx.stroke();

    /* el resto de la red, muy tenue */
    if (m.fondo) {
      ctx.lineWidth = 1; ctx.strokeStyle = col.fondo;
      m.fondo.forEach(function (l) {
        ctx.beginPath();
        coords(l).forEach(function (p, i) { const q = map.px(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.stroke();
      });
    }

    /* las carreteras con gente: el ancho es la gente que sale por ellas.
       Se pintan opacas en una capa aparte y la capa entera se pone
       transparente, para que los tramos que se solapan no hagan manchas. */
    ctx.globalAlpha = map.quien === 'referencia' ? 0.24 : 0.2;
    ctx.drawImage(bandas(map, col), 0, 0, map.ancho, map.alto);
    ctx.globalAlpha = 1;

    /* la gente, repartida a lo ancho de su banda */
    ctx.fillStyle = col.gente;
    const avance = VELOCIDAD * dt;
    map.puntos.forEach(function (p) {
      if (avance) p.d = (p.d + avance * p.vel) % p.v._len;
      const e = enPunto(p.v, p.d);
      const q = map.px(e);
      const a = p.u * (p.v._w - 2);
      ctx.beginPath();
      ctx.arc(q[0] + e[2] * a, q[1] - e[3] * a, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });

    /* un kilómetro, abajo a la izquierda: la misma barra en los dos */
    const km = 1000 / map.mpp;
    ctx.fillStyle = col.texto;
    ctx.fillRect(12, map.alto - 14, km, 2);
    ctx.fillRect(12, map.alto - 19, 1.5, 7); ctx.fillRect(12 + km - 1.5, map.alto - 19, 1.5, 7);
    ctx.font = '600 11px Archivo, sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('1 km', 12, map.alto - 22);

    /* las puertas con al menos el 5 %, con su parte */
    ctx.font = '800 13px Archivo, sans-serif';
    ctx.textBaseline = 'middle';
    (m.puertas || []).forEach(function (g) {
      const parte = (g.pct !== undefined ? g.pct : g.p) / 100;
      if (!(parte >= 0.05)) return;
      const q = map.px([g.x, g.y]);
      const t = num(parte * 100, 0) + ' %';
      const w = ctx.measureText(t).width + 10;
      const x = Math.min(map.ancho - w - 2, Math.max(2, q[0] + 6)), y = Math.min(map.alto - 12, Math.max(12, q[1] - 12));
      ctx.fillStyle = col.papel; ctx.fillRect(x, y - 9, w, 18);
      ctx.strokeStyle = map.quien === 'referencia' ? col.gente : col.texto; ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y - 9, w, 18);
      ctx.fillStyle = map.quien === 'referencia' ? col.gente : col.texto;
      ctx.fillText(t, x + 5, y + 1);
    });
  }

  function bucle(ahora) {
    const dt = Math.min(0.05, (ahora - (bucle.t || ahora)) / 1000);
    bucle.t = ahora;
    mapas.forEach(function (map) { if (visibles.has(map.lienzo)) dibujar(map, dt); });
    reloj = visibles.size ? requestAnimationFrame(bucle) : null;
  }
  function arrancar() {
    if (quieto || reloj) return;
    bucle.t = 0;
    reloj = requestAnimationFrame(bucle);
  }

  const mira = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target); });
    arrancar();
  }) : null;

  /* ── Pintar ───────────────────────────────────────────────────────── */

  function marcoComun(mm) {
    /* Lo que comparten los dos mapas: el alto del marco y los píxeles de
       ancho por persona. La escala la pone cada uno en montar(). */
    const ancho = $('#mapa-parla').parentNode.clientWidth;
    let tope = 0;
    mm.forEach(function (m) {
      preparar(m).vias.forEach(function (v) { tope = Math.max(tope, v.s || 0); });
    });
    /* píxeles de ancho por persona: la vía más cargada de las dos, a
       ANCHO_MAX; en pantallas estrechas, algo menos */
    const max = ancho < 500 ? ANCHO_MAX * 0.7 : ANCHO_MAX;
    return { alto: Math.round(ancho * 0.8), ppp: max / Math.max(tope, 1) };
  }

  function pintar() {
    const AQUI = I.AQUI;
    $('#dato-parla').textContent = entero(total(A[REF])) + ' personas';
    $('#dato-aqui').textContent = entero(total(A[AQUI])) + ' personas';

    const quien = AQUI;
    Promise.all([cargar(REF), cargar(AQUI), document.fonts ? document.fonts.ready : null]).then(function (r) {
      if (quien !== I.AQUI) return;
      const escala = marcoComun([r[0], r[1]]);
      mapas = [
        montar($('#mapa-parla'), r[0], REF, 'referencia', escala),
        montar($('#mapa-aqui'), r[1], AQUI, 'aqui', escala)
      ];
      mapas.forEach(function (map) { dibujar(map, 0); });
      $('#escala').textContent = '';
      if (mira) { mapas.forEach(function (map) { mira.observe(map.lienzo); }); }
    }).catch(function () {
      $('#escala').textContent = 'No se han podido cargar los mapas.';
    });
  }

  let espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(pintar, 150);
  });

  /* si cambia el tema, las bandas se vuelven a pintar con el color nuevo */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    mapas.forEach(function (map) { map._bandas = null; dibujar(map, 0); });
  });

  I.alPintar(pintar);
})();

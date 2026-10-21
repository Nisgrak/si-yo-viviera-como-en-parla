/* ═══════════════════════════════════════════════════════════════════════
   EL DINERO DE PARLA · el render de economia.html
   Los datos nuevos, en datos/economia.js (los escribe
   herramientas/economia.py); los de siempre del dinero, en
   DATOS.contexto.dinero, los mismos que resume la portada. Aquí solo se
   divide y se dibuja: Parla en azul, tu ciudad en gris.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const E = window.ECONOMIA;
  const C = E.ciudades;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const IDS = D.MUNICIPIOS.map(function (m) { return m.id; });
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const linea = window.LINEA.dibujar;

  /* ── Formato ──────────────────────────────────────────────────────── */

  function num(n, dec) {
    return n.toLocaleString('es-ES',
      { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec }).replace('-', '−');
  }
  function entero(n) { return num(Math.round(n), 0); }
  function euros(n) { return entero(n) + ' €'; }
  function pct(n, dec) { return num(n, dec == null ? 1 : dec) + ' %'; }
  const LETRA = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  const N = LETRA[IDS.length] || String(IDS.length);
  /* En los gráficos, «Pozuelo de Alarcón» y «Torrejón de Ardoz» no caben al final de la línea. */
  function corto(id) { return NOMBRE[id].split(' de ')[0]; }

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

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
    history.replaceState(null, '', RUTAS ? RAIZ_WEB + AQUI + '/economia/' : '#' + AQUI);
  }

  /* {N}, {ref}, {aqui} y lo que traiga vars, como en la portada. */
  function texto(t, vars) {
    const v = Object.assign({ aqui: NOMBRE[AQUI], ref: NOMBRE[REF] }, vars || {});
    return (t || '').replace(/\{N\}/g, N)
      .replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; });
  }

  /* Dónde queda Parla entre las once, de la cifra más alta a la más baja.
     Sin decir si es bueno o malo: eso lo dice la nota cuando hace falta. */
  function puesto(v) {
    const pv = v(REF);
    const k = IDS.filter(function (id) { return v(id) > pv; }).length + 1;
    if (k === IDS.length) return 'Parla tiene la cifra más baja de las ' + N + '.';
    if (k === 1) return 'Parla tiene la cifra más alta de las ' + N + '.';
    return 'Parla es la ' + k + '.ª de las ' + N + ', de la cifra más alta a la más baja.';
  }

  /* Un enlace a una fuente: de datos/economia.js o, si no está, de DATOS.fuentes. */
  function fuente(id) {
    const f = E.fuentes[id];
    if (f) return { t: f[0], url: f[1] };
    const g = D.fuentes[id];
    return g ? { t: g.t, url: g.url } : null;
  }
  function pieFuente(ids) {
    const p = el('p', 'ind__fuente');
    ids.forEach(function (id, i) {
      const f = fuente(id);
      if (!f) return;
      p.appendChild(document.createTextNode(i === 0 ? 'Fuente: ' : '. '));
      const a = el('a', null, f.t);
      a.href = f.url; a.target = '_blank'; a.rel = 'noopener';
      p.appendChild(a);
    });
    return p;
  }

  /* ── Las piezas ───────────────────────────────────────────────────── */

  /* Una ficha: título, pie, a veces una frase, las filas con barra (las
     medias de referencia, tu ciudad y Parla) y la nota. Es la misma pieza
     que el dinero de la portada. */
  function ficha(cont, f) {
    const art = el('article', 'plata' + (f.saldo ? ' plata--saldo' : ''));
    if (f.id) art.id = f.id;
    const h = el('h3', 'plata__h', f.titulo);
    const sen = f.sentido || (window.SENTIDO && f.id && window.SENTIDO.de(f.id));
    if (sen) h.dataset.sentido = sen;
    art.appendChild(h);
    if (f.pie) art.appendChild(el('p', 'plata__pie', f.pie));
    if (f.titular) {
      const t = el('p', 'plata__titular');
      t.innerHTML = f.titular;
      art.appendChild(t);
    }
    const filas = (f.medias || []).map(function (m) { return { q: m[0], v: m[1], quien: 'otro' }; });
    filas.push({ q: NOMBRE[AQUI], v: f.v(AQUI), quien: 'aqui' });
    filas.push({ q: NOMBRE[REF], v: f.v(REF), quien: 'referencia' });
    const tope = filas.reduce(function (t, x) { return Math.max(t, x.v); }, 0);
    const ul = el('ul', 'mun');
    filas.forEach(function (x) {
      const li = el('li', 'mun__fila');
      li.dataset.quien = x.quien;
      li.appendChild(el('span', 'mun__q', x.q));
      li.appendChild(el('span', 'mun__v', f.fmt(x.v)));
      const b = el('span', 'mun__barra');
      const i = el('i');
      /* Un saldo negativo se queda sin barra: no hay nada que llenar. */
      i.style.width = (tope && x.v > 0 ? x.v / tope * 100 : 0).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
    art.appendChild(ul);
    if (f.cartel && window.CARTEL) art.appendChild(cartel(f.cartel.id, f.titulo, f.cartel.datos));
    if (f.nota) art.appendChild(el('p', 'renta__nota', f.nota));
    if (f.fuentes) art.appendChild(pieFuente(f.fuentes));
    cont.appendChild(art);
  }

  /* El botón del cartel A4 (assets/cartel.js), con la ciudad elegida. */
  function cartel(id, titulo, datos) {
    return window.CARTEL.boton({
      id: id, datos: datos,
      ciudad: function () { return AQUI; },
      titulo: function () { return 'Parla y ' + NOMBRE[AQUI] + ' · ' + titulo; }
    });
  }

  function fichas(sel, lista) {
    const cont = $(sel);
    vaciar(cont);
    lista.forEach(function (f) { ficha(cont, f); });
  }

  /* Las series del dinero de siempre, en forma de ficha. */
  function serieDinero(id) {
    return D.contexto.dinero.find(function (s) { return s.id === id; });
  }
  function enEuros(e, redondearMiles) {
    if (e >= 1e6) return num(e / 1e6, 1) + ' millones de euros';
    return entero(redondearMiles === false ? e : Math.round(e / 1000) * 1000) + ' euros';
  }
  function desdeDinero(id) {
    const s = serieDinero(id);
    const cifra = function (v) {
      return s.decimales != null ? num(v, s.decimales) : s.saldoEuros ? num(v, 2) : entero(v);
    };
    const huecos = {};
    Object.keys(s.extra || {}).forEach(function (k) {
      huecos[k + 'Aqui'] = cifra(s.extra[k][AQUI]);
      huecos[k + 'Ref'] = cifra(s.extra[k][REF]);
    });
    const medias = [];
    if (s.mediaRegional != null) medias.push([s.refNombre, s.mediaRegional]);
    if (s.mediaSinCapital != null) medias.push(['Sin la capital', s.mediaSinCapital]);
    let titular = null;
    if (s.alAnio) {
      const pob = D.BASES.total.valores[AQUI];
      const dif = (s.valores[AQUI] - s.valores[REF]) * pob;
      titular = Math.abs(dif) < s.valores[AQUI] * pob * 0.01
        ? 'Con ' + s.alAnio.con + ' de Parla, ' + NOMBRE[AQUI] + ' se quedaría prácticamente igual.'
        : 'Con ' + s.alAnio.con + ' de Parla, ' + NOMBRE[AQUI] + ' ' + s.alAnio.verbo +
          ' <span class="cifra">' + enEuros(Math.abs(dif)) + '</span> ' + (dif > 0 ? 'menos' : 'más') + ' al año.';
    } else if (s.saldoEuros) {
      titular = 'Parla debe <span class="cifra">' + enEuros(s.saldoEuros[REF], false) + '</span>. ' +
        NOMBRE[AQUI] + ' debe ' + enEuros(s.saldoEuros[AQUI], false) + '.';
    }
    return {
      id: 'dinero-' + s.id,
      titulo: s.titulo,
      pie: (s.pieCiudad && s.pieCiudad[AQUI]) || s.pie,
      titular: titular,
      saldo: !!s.saldoEuros,
      medias: medias,
      v: function (m) { return s.valores[m]; },
      fmt: s.unidad === '%'
        ? function (v) { return pct(v, s.decimales != null ? s.decimales : 2); }
        : function (v) { return cifra(v) + ' €'; },
      nota: texto(s.nota, huecos),
      fuentes: [s.fuenteId].concat((s.masFuentes || []).map(function (x) { return x[0]; }),
        s.saldoEuros ? ['deudaMetodo'] : [])
    };
  }

  /* Dos cifras grandes, una por ciudad. */
  function pareja(nodo, fmt, v, pie) {
    vaciar(nodo);
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const c = el('div', 'cifra');
      c.dataset.quien = g[1];
      c.appendChild(el('p', 'cifra__quien', NOMBRE[g[0]]));
      c.appendChild(el('p', 'cifra__v', fmt(v(g[0]))));
      c.appendChild(el('p', 'cifra__que', pie(g[0])));
      nodo.appendChild(c);
    });
  }

  /* De cada 100: una barra partida por ciudad y debajo la tabla con las
     cifras de las dos, parte por parte. */
  function reparto(sel, partes, v, fmt) {
    const cont = $(sel);
    vaciar(cont);
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const fila = el('div', 'reparto__fila');
      fila.dataset.quien = g[1];
      fila.appendChild(el('p', 'reparto__quien', NOMBRE[g[0]]));
      const barra = el('div', 'reparto__barra');
      const xs = v(g[0]);
      barra.setAttribute('role', 'img');
      barra.setAttribute('aria-label', NOMBRE[g[0]] + ': ' + partes.map(function (p, i) {
        return p.toLowerCase() + ' ' + fmt(xs[i]);
      }).join(', '));
      xs.forEach(function (x, i) {
        const s = el('i', 'reparto__s reparto__s--' + i);
        s.style.flexGrow = Math.max(0, x);
        s.dataset.i = i;
        barra.appendChild(s);
      });
      fila.appendChild(barra);
      cont.appendChild(fila);
    });
    const t = el('table', 'reparto__tabla');
    const cab = el('tr');
    cab.appendChild(el('th', null, ''));
    cab.appendChild(el('th', 'reparto__th--referencia', corto(REF)));
    cab.appendChild(el('th', null, corto(AQUI)));
    const thead = el('thead');
    thead.appendChild(cab);
    t.appendChild(thead);
    const tb = el('tbody');
    const vr = v(REF), va = v(AQUI);
    partes.forEach(function (p, i) {
      const tr = el('tr');
      const th = el('th');
      th.scope = 'row';
      th.appendChild(el('i', 'reparto__marca reparto__s--' + i));
      th.appendChild(document.createTextNode(p));
      tr.appendChild(th);
      tr.appendChild(el('td', 'reparto__td--referencia', fmt(vr[i])));
      tr.appendChild(el('td', null, fmt(va[i])));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    cont.appendChild(t);
    tipReparto(cont, partes, vr, va, fmt);
  }

  /* Al pasar el ratón o el dedo por una parte: el recuadro con esa parte en
     las dos ciudades, como el de los gráficos de líneas, y la misma parte
     marcada en las dos barras y en la tabla. */
  function tipReparto(cont, partes, vr, va, fmt) {
    const tip = el('div', 'graf__tip reparto__tip');
    tip.hidden = true;
    tip.setAttribute('aria-hidden', 'true');
    cont.appendChild(tip);
    const filas = cont.querySelectorAll('.reparto__tabla tbody tr');
    let actual = -1;
    function marcar(i) {
      cont.querySelectorAll('.reparto__s').forEach(function (s) {
        s.classList.toggle('reparto__s--foco', Number(s.dataset.i) === i);
      });
      filas.forEach(function (f, k) { f.classList.toggle('reparto__foco', k === i); });
    }
    function mostrar(seg) {
      const i = Number(seg.dataset.i);
      if (i !== actual) {
        actual = i;
        vaciar(tip);
        tip.appendChild(el('p', 'graf__tip-h', partes[i]));
        [[REF, 'referencia', vr], [AQUI, 'aqui', va]].forEach(function (g) {
          const p = el('p', 'graf__tip-f graf__tip-f--' + g[1]);
          p.appendChild(el('i', 'graf__tip-c'));
          p.appendChild(el('span', null, corto(g[0])));
          p.appendChild(el('b', null, fmt(g[2][i])));
          tip.appendChild(p);
        });
        marcar(i);
      }
      tip.hidden = false;
      /* Encima de la parte, centrado y sin salirse de la caja. */
      const rc = cont.getBoundingClientRect(), rs = seg.getBoundingClientRect();
      const ancho = tip.offsetWidth;
      const izq = Math.max(0, Math.min(rc.width - ancho, rs.left - rc.left + rs.width / 2 - ancho / 2));
      tip.style.left = izq + 'px';
      tip.style.top = (rs.top - rc.top - 8) + 'px';
    }
    function ocultar() {
      actual = -1;
      tip.hidden = true;
      marcar(-1);
    }
    cont.querySelectorAll('.reparto__s').forEach(function (seg) {
      seg.addEventListener('pointerenter', function () { mostrar(seg); });
      seg.addEventListener('pointerdown', function () { mostrar(seg); });
    });
    cont.querySelectorAll('.reparto__barra').forEach(function (b) {
      b.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ocultar(); });
    });
    cont.ocultarTip = ocultar;
  }
  /* En el móvil, tocar fuera de las barras cierra el recuadro. */
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.reparto__barra')) return;
    document.querySelectorAll('.reparto').forEach(function (c) { if (c.ocultarTip) c.ocultarTip(); });
  });

  function anios(par) {
    const o = [];
    for (let a = par[0]; a <= par[1]; a++) o.push(String(a));
    return o;
  }
  function marcas(paso) {
    return function (n, e) {
      const o = [];
      for (let i = 0; i < n; i += e ? paso * 2 : paso) o.push(i);
      if (o[o.length - 1] !== n - 1) o.push(n - 1);
      return o;
    };
  }
  const ultimo = function (xs) { return xs[xs.length - 1]; };

  /* ── La frase de arriba ───────────────────────────────────────────── */

  function golpe() {
    const p = C[REF].trabajo, a = C[AQUI].trabajo;
    const n = $('#golpe');
    vaciar(n);
    n.appendChild(document.createTextNode('Por cada 100 vecinos de Parla que trabajan hay '));
    n.appendChild(el('b', 'parla', num(ultimo(p.puestos), 1) + ' puestos de trabajo'));
    n.appendChild(document.createTextNode(' en Parla. En ' + NOMBRE[AQUI] + ', ' +
      num(ultimo(a.puestos), 1) + '.'));
  }

  /* ── Dónde se trabaja ─────────────────────────────────────────────── */

  function trabajo() {
    const t = function (id) { return C[id].trabajo; };
    pareja($('#trabajo-cifras'), function (v) { return num(v, 1); },
      function (id) { return ultimo(t(id).puestos); },
      function (id) {
        return 'puestos de trabajo en la ciudad por cada 100 vecinos que trabajan: ' +
          entero(t(id).enCentro) + ' puestos y ' + entero(t(id).residentes) + ' vecinos afiliados, a finales de 2025';
      });
    const viejo = $('#trabajo-cartel');
    if (viejo) viejo.remove();
    if (window.CARTEL) {
      const b = cartel('trabajo', 'Dónde se trabaja', function () {
        return {
          pre: 'Por cada 100 vecinos de Parla que trabajan, hay',
          cifra: num(ultimo(t(REF).puestos), 1), que: 'puestos de trabajo en Parla',
          cajas: [{ q: NOMBRE[AQUI], v: num(ultimo(t(AQUI).puestos), 1) + ' por cada 100 vecinos que trabajan' },
            { q: 'Parla', v: entero(t(REF).enCentro) + ' puestos para ' + entero(t(REF).residentes) + ' vecinos afiliados', ref: true }]
        };
      });
      b.id = 'trabajo-cartel';
      $('#trabajo-cifras').after(b);
    }
    const pp = t(REF).puestos, pa = t(AQUI).puestos;
    linea($('#trabajo-graf'), {
      etiquetas: anios(E.anios.puestos),
      series: [
        { nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: pa },
        { nombre: 'Parla', quien: 'referencia', v: pp }
      ],
      paso: function (mx) { return mx > 150 ? 50 : 25; },
      fmtEje: function (v) { return entero(v); },
      fmtValor: function (v) { return num(v, 1); },
      marcasX: marcas(2),
      descripcion: 'Puestos de trabajo por cada 100 vecinos que trabajan, de 2013 a 2025. Parla: de ' +
        num(pp[0], 1) + ' a ' + num(ultimo(pp), 1) + '. ' + NOMBRE[AQUI] + ': de ' + num(pa[0], 1) +
        ' a ' + num(ultimo(pa), 1) + '.',
      leyenda: 'Afiliaciones con centro de trabajo en la ciudad a 31 de diciembre por cada 100 vecinos ' +
        'afiliados a 1 de enero siguiente. Con 100, la ciudad tendría un puesto por cada vecino que trabaja.'
    });
    fichas('#trabajo-fichas', [
      { titulo: 'Quien trabaja en su propia ciudad',
        pie: 'De cada 100 vecinos ocupados, los que trabajan dentro del municipio, 2023',
        v: function (id) { return t(id).mismoMun; }, fmt: function (v) { return pct(v); },
        nota: 'En Parla, ' + entero(t(REF).ocupados) + ' vecinos tenían trabajo y ' +
          entero(t(REF).enSuCiudad) + ' lo tenían en Parla. ' +
          puesto(function (id) { return t(id).mismoMun; }),
        fuentes: ['censoTrabajo'] }
    ]);
  }

  /* En qué trabajan los vecinos: los nueve grandes grupos de ocupación del
     INE, juntados en cinco para que la barra se lea. */
  const OCUPACION = [
    ['Dirección y profesiones con carrera', [0, 1]],
    ['Técnicos de apoyo y oficina', [2, 3]],
    ['Hostelería, comercio, cuidados y seguridad', [4]],
    ['Oficios de obra, taller y fábrica, y conductores', [5, 6, 7]],
    ['Limpieza, peones y reparto', [8]]
  ];
  function ocupacion() {
    const o = function (id) {
      const p = C[id].ocupacion.pct;
      return OCUPACION.map(function (g) { return g[1].reduce(function (s, i) { return s + p[i]; }, 0); });
    };
    reparto('#ocupacion-reparto', OCUPACION.map(function (g) { return g[0]; }), o, function (v) { return pct(v); });
    /* Dónde queda Parla en las dos puntas, si está en una de ellas. */
    const extremo = function (i) {
      const vs = IDS.map(function (id) { return o(id)[i]; }), v = o(REF)[i];
      return v === Math.max.apply(null, vs) ? 'más' : v === Math.min.apply(null, vs) ? 'menos' : null;
    };
    const dichos = [0, 4].filter(extremo).map(function (i, k) {
      return 'la que ' + extremo(i) + (k ? '' : ' vecinos tiene') + ' en ' + OCUPACION[i][0].toLowerCase();
    });
    const r = C[REF].ocupacion;
    $('#ocupacion-nota').textContent =
      (dichos.length ? 'De las ' + N + ', Parla es ' + dichos.join(' y ') + '. ' : '') +
      'A ' + entero(r.sinOcupacion) + ' de los ' + entero(r.n) +
      ' vecinos de Parla con trabajo no les consta la ocupación.';
  }

  /* ── Quien no encuentra trabajo ───────────────────────────────────── */

  function paro() {
    const t = function (id) { return C[id].trabajo; };
    const pp = t(REF).paro, pa = t(AQUI).paro;
    linea($('#paro-graf'), {
      etiquetas: anios(E.anios.paro),
      series: [
        { nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: pa },
        { nombre: 'Parla', quien: 'referencia', v: pp }
      ],
      paso: function () { return 5; },
      fmtEje: function (v) { return entero(v); },
      fmtValor: function (v) { return num(v, 1); },
      marcasX: marcas(2),
      descripcion: 'Parados registrados por cada 100 habitantes de 16 a 64 años, de 2015 a 2025. Parla: de ' +
        num(pp[0], 1) + ' a ' + num(ultimo(pp), 1) + '. ' + NOMBRE[AQUI] + ': de ' + num(pa[0], 1) +
        ' a ' + num(ultimo(pa), 1) + '.',
      leyenda: 'Parados registrados, media del año, por cada 100 habitantes de 16 a 64 años. Sin dato en 2020. ' +
        'Último mes publicado, ' + mes(t(REF).ultimoMes.mes) + ': ' + entero(t(REF).ultimoMes.n) + ' parados en Parla y ' +
        entero(t(AQUI).ultimoMes.n) + ' en ' + NOMBRE[AQUI] + '.'
    });
    fichas('#paro-fichas', [
      desdeDinero('paro'),
      { titulo: 'Apuntados al paro', sentido: 'menos',
        pie: 'Parados registrados por cada 100 habitantes de 16 a 64 años, media de 2025',
        v: function (id) { return ultimo(t(id).paro); }, fmt: function (v) { return num(v, 2); },
        nota: (siempreArriba() ? 'Parla tiene la cifra más alta de las ' + N + ' todos los años desde 2015 en los que hay dato. ' :
          puesto(function (id) { return ultimo(t(id).paro); }) + ' ') +
          'En 2025 había de media ' + entero(t(REF).parados) + ' parados en Parla; el ' +
          num(t(REF).pctMujeres, 0) + ' % eran mujeres. Por cada 100 mujeres de 16 a 64 años, ' +
          num(t(REF).paroMujer, 2) + ' paradas en Parla y ' + num(t(AQUI).paroMujer, 2) + ' en ' + NOMBRE[AQUI] +
          '. Por cada 100 vecinos de 16 a 24 años, ' + num(t(REF).paroJoven, 2) + ' parados menores de 25 en Parla y ' +
          num(t(AQUI).paroJoven, 2) + ' en ' + NOMBRE[AQUI] + '; los jóvenes se apuntan poco, así que esta cifra se queda corta en todas.',
        fuentes: ['sepeParo', 'censoEdad'] },
      { titulo: 'Los contratos indefinidos', sentido: 'mas',
        pie: 'De cada 100 contratos firmados en 2025, los indefinidos y las conversiones a indefinido',
        v: function (id) { return t(id).indefinidos; }, fmt: function (v) { return pct(v); },
        nota: (IDS.every(function (id) { return t(id).indefinidos <= t(REF).indefinidos; })
          ? 'Aquí Parla sale mejor: tiene la cifra más alta de las ' + N + '.'
          : puesto(function (id) { return t(id).indefinidos; })) +
          ' Se firmaron ' + entero(t(REF).contratos) + ' contratos en Parla y ' + entero(t(AQUI).contratos) +
          ' en ' + NOMBRE[AQUI] + '. Cuentan los fijos discontinuos como indefinidos.',
        fuentes: ['sepeContratos'] }
    ]);
  }
  /* Si Parla tiene el paro registrado más alto todos los años con dato. */
  function siempreArriba() {
    return C[REF].trabajo.paro.every(function (v, i) {
      return v == null || IDS.every(function (id) { return C[id].trabajo.paro[i] == null || C[id].trabajo.paro[i] <= v; });
    });
  }
  /* Qué ciudades acaban 2024 con el remanente en negativo. */
  function enNegativo() {
    const neg = IDS.filter(function (id) { return C[id].cuentas.remanenteAjustado < 0; });
    if (neg.length === 1 && neg[0] === REF) return 'Parla es la única de las ' + N + ' en negativo.';
    if (!neg.length) return 'Ninguna de las ' + N + ' está en negativo.';
    return 'Están en negativo ' + neg.map(function (id) { return NOMBRE[id]; }).join(', ') + '.';
  }
  function mes(p) {
    const M = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return M[Number(p.slice(5)) - 1] + ' de ' + p.slice(0, 4);
  }

  /* ── Lo que entra en casa ─────────────────────────────────────────── */

  function renta() {
    const r = function (id) { return C[id].renta; };
    const pp = r(REF).persona, pa = r(AQUI).persona;
    linea($('#renta-graf'), {
      etiquetas: anios(E.anios.renta),
      series: [
        { nombre: NOMBRE[AQUI], corto: corto(AQUI), quien: 'aqui', v: pa },
        { nombre: 'Parla', quien: 'referencia', v: pp }
      ],
      paso: function (mx) { return mx > 20000 ? 10000 : 5000; },
      fmtEje: function (v) { return v ? num(v / 1000, 0) + ' mil' : '0'; },
      fmtValor: function (v) { return euros(v); },
      marcasX: marcas(1),
      descripcion: 'Renta neta media por persona de 2015 a 2024. Parla: de ' + euros(pp[0]) + ' a ' +
        euros(ultimo(pp)) + '. ' + NOMBRE[AQUI] + ': de ' + euros(pa[0]) + ' a ' + euros(ultimo(pa)) + '.',
      leyenda: 'Euros al año por persona, después de impuestos y cotizaciones. En 2015 la de Parla era el ' +
        num(pp[0] / pa[0] * 100, 0) + ' % de la de ' + NOMBRE[AQUI] + '; en 2024, el ' +
        num(ultimo(pp) / ultimo(pa) * 100, 0) + ' %.'
    });
    fichas('#renta-fichas', [
      desdeDinero('renta'),
      { titulo: 'Lo que entra en un hogar', sentido: 'mas',
        pie: 'Renta neta media por hogar, 2024',
        v: function (id) { return r(id).hogar; }, fmt: euros,
        nota: puesto(function (id) { return r(id).hogar; }),
        fuentes: ['adrh'] },
      { titulo: 'Lo que se declara a Hacienda', sentido: 'mas',
        pie: 'Renta bruta media por declaración del IRPF, 2024',
        v: function (id) { return r(id).irpf.bruta; }, fmt: euros,
        nota: 'Después de impuestos, ' + euros(r(REF).irpf.disponible) + ' por declaración en Parla y ' +
          euros(r(AQUI).irpf.disponible) + ' en ' + NOMBRE[AQUI] + '. ' + puesto(function (id) { return r(id).irpf.bruta; }) +
          ' Lo que deja de media el trabajo o la pensión, después de gastos y reducciones: ' + euros(r(REF).irpf.trabajo) +
          ' por declaración en Parla y ' + euros(r(AQUI).irpf.trabajo) + ' en ' + NOMBRE[AQUI] + '.',
        fuentes: ['irpf'] },
      desdeDinero('pobreza'),
      { titulo: 'Cómo se reparte dentro', sentido: 'menos',
        pie: 'Índice de Gini de la renta por unidad de consumo, 2024',
        v: function (id) { return r(id).gini; }, fmt: function (v) { return num(v, 1); },
        nota: 'De 0, si todos los vecinos ingresaran lo mismo, a 100, si uno se lo llevara todo: cuanto más bajo, ' +
          'más parecidos son los ingresos dentro de la ciudad, sean altos o bajos. ' +
          puesto(function (id) { return r(id).gini; }) + ' El 20 % que más ingresa tiene ' +
          num(r(REF).p80p20, 1) + ' veces lo del 20 % que menos en Parla y ' + num(r(AQUI).p80p20, 1) +
          ' en ' + NOMBRE[AQUI] + '.',
        fuentes: ['adrhGini'] }
    ]);
    reparto('#renta-reparto', ['Salario', 'Pensiones', 'Prestaciones por desempleo', 'Otras prestaciones', 'Otros ingresos'],
      function (id) { return r(id).fuentes; }, function (v) { return pct(v); });
  }

  /* ── Lo que se produce ────────────────────────────────────────────── */

  function produce() {
    const e = function (id) { return C[id].empresas; };
    fichas('#produce-fichas', [
      desdeDinero('pib'),
      { titulo: 'Las empresas que hay', sentido: 'mas',
        pie: 'Empresas activas con sede en la ciudad por cada 1.000 habitantes, 1 de enero de 2025',
        v: function (id) { return e(id).por1000; }, fmt: function (v) { return num(v, 1); },
        nota: entero(e(REF).n) + ' empresas en Parla y ' + entero(e(AQUI).n) + ' en ' + NOMBRE[AQUI] + '. ' +
          puesto(function (id) { return e(id).por1000; }),
        fuentes: ['dirce', 'ine'] },
      { titulo: 'El peso de la construcción',
        pie: 'De cada 100 euros del PIB municipal, los de la construcción, 2023',
        v: function (id) { return e(id).pibRamas[1]; }, fmt: function (v) { return pct(v, 1); },
        nota: 'Y de cada 100 puestos de trabajo de la ciudad, ' + num(e(REF).afilConstruccion, 1) +
          ' son de la construcción en Parla y ' + num(e(AQUI).afilConstruccion, 1) + ' en ' + NOMBRE[AQUI] +
          '. La industria pone ' + num(e(REF).pibRamas[0], 1) + ' de cada 100 euros en Parla y ' +
          num(e(AQUI).pibRamas[0], 1) + ' en ' + NOMBRE[AQUI] + '. ' + puesto(function (id) { return e(id).pibRamas[1]; }),
        fuentes: ['pibRamas', 'afilRama'] }
    ]);
    reparto('#produce-reparto', ['Industria', 'Construcción', 'Comercio, transporte y hostelería', 'Resto de servicios'],
      function (id) { return e(id).sectores; }, function (v) { return pct(v); });
  }

  /* ── Las cuentas del ayuntamiento ─────────────────────────────────── */

  function ayuntamiento() {
    const fs = ['inversion', 'gasto', 'servicios-sociales', 'comunidad', 'deuda'].map(desdeDinero);
    const deuda = serieDinero('deuda');
    fs[4].cartel = { id: 'deuda', datos: function () {
      return {
        pre: 'El Ayuntamiento de Parla debe', cifra: entero(deuda.valores[REF]) + ' €', que: 'por cada vecino',
        cajas: [{ q: NOMBRE[AQUI], v: entero(deuda.valores[AQUI]) + ' € por vecino' },
          { q: 'Parla', v: enEuros(deuda.saldoEuros[REF], false) + ' en total, a finales de 2025', ref: true }]
      };
    } };
    fichas('#ayto-fichas', fs);
    const imp = D.contexto.impuestosDirectos;
    $('#ayto-cierre').textContent = texto(D.contexto.dineroNota, {
      impuestosAqui: entero(imp[AQUI]), impuestosRef: entero(imp[REF])
    });
    cuentas();
  }

  /* ── Lo que paga un vecino ───────────────────────────────────────────
     El IBI y el impuesto de un coche de 12 a 15,99 caballos, en 2026, con
     los tipos de cada ayuntamiento (herramientas/impuestos.py). Dos casos:
     la misma casa en las once, para que solo cambie lo que cobra cada uno, y
     la casa media de cada ciudad. Las basuras, aparte. */
  function paga() {
    const P = window.IMPUESTOS;
    const caja = $('#paga');
    if (!P || !P.ciudades[REF] || !P.ciudades[AQUI]) { if (caja) caja.hidden = true; return; }
    const c = function (id) { return P.ciudades[id]; };
    const misma = function (id) { return c(id).comunIbi + c(id).coche; };
    const suya = function (id) { return c(id).ibi + c(id).coche; };
    /* Con espacio duro: la cifra y su unidad no se separan de línea. */
    const eur = function (v) { return num(v, 2) + '\u00a0€'; };
    const tipo = function (v) {
      return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '\u00a0%';
    };
    /* El puesto de la más barata a la más cara; los empates lo comparten. */
    const barato = function (v, id) { return 1 + IDS.filter(function (x) { return v(x) < v(id) - 0.005; }).length; };

    function todas(f) {
      const ids = IDS.slice().sort(function (a, b) { return f.v(a) - f.v(b); });
      const art = el('article', 'plata');
      const h = el('h3', 'plata__h', f.titulo);
      if (f.sentido) h.dataset.sentido = f.sentido;
      art.appendChild(h);
      art.appendChild(el('p', 'plata__pie', f.pie));
      const t = el('p', 'plata__titular');
      t.innerHTML = f.titular;
      art.appendChild(t);
      const tope = f.v(ids[ids.length - 1]);
      const ul = el('ul', 'mun');
      ids.forEach(function (id) {
        const li = el('li', 'mun__fila');
        li.dataset.quien = id === REF ? 'referencia' : id === AQUI ? 'aqui' : 'otro';
        li.appendChild(el('span', 'mun__q', NOMBRE[id]));
        li.appendChild(el('span', 'mun__v', eur(f.v(id))));
        const b = el('span', 'mun__barra');
        const i = el('i');
        i.style.width = (f.v(id) / tope * 100).toFixed(1) + '%';
        b.appendChild(i);
        li.appendChild(b);
        ul.appendChild(li);
      });
      art.appendChild(ul);
      if (f.nota) art.appendChild(el('p', 'renta__nota', f.nota));
      return art;
    }
    const cont = $('#paga-fichas');
    vaciar(cont);
    const k1 = barato(misma, REF), k2 = barato(suya, REF);
    cont.appendChild(todas({
      titulo: 'La misma casa en las once', v: misma, sentido: 'menos',
      pie: 'IBI y coche al año, ' + P.anio + ', para una vivienda de ' + entero(P.comun.vc) +
        ' € de valor catastral (la mediana de las once) y un coche de 12 a 15,99 caballos fiscales',
      titular: 'Con la misma casa, en Parla se pagan <b>' + eur(misma(REF)) + '</b>; en ' + NOMBRE[AQUI] + ', <b>' +
        eur(misma(AQUI)) + '</b>. Parla es la ' + k1 + '.ª más barata de las ' + N + '.',
      nota: 'El tipo del IBI de Parla es del ' + tipo(c(REF).tipo) + '; el de ' + NOMBRE[AQUI] + ', del ' +
        tipo(c(AQUI).tipo) + '. ' +
        'De las ' + N + ', ' + IDS.filter(function (id) { return c(id).tipo < c(REF).tipo; }).length + ' cobran un tipo más bajo que Parla.'
    }));
    cont.appendChild(todas({
      titulo: 'La casa media de cada ciudad', v: suya, sentido: 'menos',
      pie: 'IBI de la vivienda media de cada ciudad y el mismo coche, ' + P.anio,
      titular: 'Con su casa media, un vecino de Parla paga <b>' + eur(suya(REF)) + '</b>; uno de ' + NOMBRE[AQUI] +
        ', <b>' + eur(suya(AQUI)) + '</b>. Parla es la ' + k2 + '.ª más barata de las ' + N + '.',
      nota: 'Para el Catastro, la vivienda media vale ' + entero(c(REF).vc) + ' € en Parla y ' + entero(c(AQUI).vc) +
        ' € en ' + NOMBRE[AQUI] + '. El recibo es antes de bonificaciones, como la de familia numerosa.'
    }));
    /* El cierre dice qué pesa más, el tipo o el valor de las casas, solo si
       los dos puestos lo dicen. */
    const lugar = 'Con la misma casa, Parla es la ' + k1 + '.ª más barata de las ' + N + '; con la suya, la ' + k2 + '.ª. ';
    $('#paga-cierre').textContent = lugar + (k2 < k1
      ? 'Los tipos son los mismos en las dos cuentas; lo que cambia es el valor de la casa. Para el Catastro, la vivienda media de Parla es la ' +
        barato(function (id) { return c(id).vc; }, REF) + '.ª más barata de las ' + N + '.'
      : k2 > k1 ? 'Los tipos son los mismos en las dos cuentas; lo que cambia es el valor de la casa.' : '');

    const ul = $('#paga-basuras');
    vaciar(ul);
    const tb = Math.max.apply(null, IDS.map(function (id) { return c(id).basuras || 0; }));
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const x = c(g[0]);
      const li = el('li', 'mun__fila');
      li.dataset.quien = g[1];
      li.appendChild(el('span', 'mun__q', NOMBRE[g[0]]));
      li.appendChild(el('span', 'mun__v', x.basuras == null ? 'sin calcular' : x.basuras ? eur(x.basuras) : 'no hay'));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = ((x.basuras || 0) / tb * 100).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
    const pie = $('#paga-basuras-pie');
    vaciar(pie);
    pie.appendChild(document.createTextNode('Para la casa media de cada ciudad y tres vecinos empadronados, sin reducciones. '));
    [REF, AQUI].forEach(function (id) {
      pie.appendChild(document.createTextNode(NOMBRE[id] + ': '));
      const a = el('a', null, c(id).basurasNota);
      a.href = c(id).basurasFuente;
      pie.appendChild(a);
      pie.appendChild(document.createTextNode(' '));
    });
    pie.appendChild(document.createTextNode('Tipos: '));
    const f1 = el('a', null, P.fuentes.tipos[0]);
    f1.href = P.fuentes.tipos[1];
    pie.appendChild(f1);
    pie.appendChild(document.createTextNode('. Valor de las viviendas: '));
    const f2 = el('a', null, P.fuentes.valor[0]);
    f2.href = P.fuentes.valor[1];
    pie.appendChild(f2);
    pie.appendChild(document.createTextNode('.'));

    /* El cartel y el enlace con su vista previa (/getafe/impuestos/). */
    const bot = $('#paga-botones');
    vaciar(bot);
    if (!window.CARTEL) return;
    bot.appendChild(cartel('impuestos', 'Lo que paga un vecino', function () {
      return {
        pre: 'Con su casa media y un coche, un vecino de ' + NOMBRE[AQUI] + ' paga al año',
        cifra: entero(suya(AQUI)) + ' €', que: 'de IBI e impuesto de vehículos', fin: String(P.anio),
        cajas: [{ q: 'Parla, con su casa media', v: entero(suya(REF)) + ' €', ref: true },
          { q: 'Con la misma casa en las dos', v: NOMBRE[AQUI] + ' ' + entero(misma(AQUI)) + ' €; Parla ' + entero(misma(REF)) + ' €' }]
      };
    }));
    bot.appendChild(window.CARTEL.enlace({
      url: function () { return RUTAS ? RAIZ_WEB + AQUI + '/impuestos/' : 'economia.html?ir=paga#' + AQUI; },
      titulo: function () { return 'Lo que paga un vecino de ' + NOMBRE[AQUI] + ' y uno de Parla'; }
    }));
  }

  /* Lo que añade cuentas.json: lo que se paga por la deuda, los ingresos y
     el plazo de pago. Si no está, la sección se queda con lo de siempre. */
  function cuentas() {
    const cont = $('#ayto-mas');
    vaciar(cont);
    if (!C[REF].cuentas) { cont.hidden = true; return; }
    cont.hidden = false;
    const k = function (id) { return C[id].cuentas; };
    const medias = function (c) {
      return [['Media de la Comunidad', E.media.con_capital[c]], ['Sin la capital', E.media.sin_capital[c]]];
    };
    const eur = function (v) { return num(v, 2) + ' €'; };
    const pie = function (t) {
      return AQUI === 'pozuelo' ? t + ' (Pozuelo de Alarcón, media de 2021 y 2024)' : t;
    };
    fichas('#ayto-mas', [
      { id: 'dinero-deuda-anual',
        titulo: 'Lo que se va en la deuda cada año', sentido: 'menos',
        pie: pie('Intereses y devolución de préstamos por habitante, media de 2021 a 2024'),
        medias: medias('deuda_3_mas_9'),
        v: function (id) { return k(id).deuda; }, fmt: eur,
        nota: 'Los capítulos 3 y 9 del gasto: ' + num(k(REF).pctDeuda, 1) + ' de cada 100 euros que gasta Parla y ' +
          num(k(AQUI).pctDeuda, 1) + ' en ' + NOMBRE[AQUI] + '. ' + puesto(function (id) { return k(id).deuda; }) +
          ' En intereses, ' + eur(k(REF).intereses) + ' en Parla y ' + eur(k(AQUI).intereses) + ' en ' + NOMBRE[AQUI] + '; ' +
          (IDS.every(function (id) { return k(id).intereses <= k(REF).intereses; }) ? 'Parla paga más que ninguna de las ' + N + ', y de ellos ' : 'de los de Parla, ') +
          eur(k(REF).demora) + ' son intereses de demora, los que se pagan por pagar tarde. En devolución de préstamos, Parla pone ' +
          eur(k(REF).amortizacion) + ' al año; en 2022 y 2023 recibió ' + num(k(REF).prestamos2223 / 1e6, 0) + ' millones de euros en préstamos nuevos.',
        fuentes: ['conprel'] },
      { titulo: 'Lo que recauda',
        pie: pie('Impuestos, tasas y otros ingresos propios por habitante, media de 2021 a 2024'),
        medias: medias('i123_propios'),
        v: function (id) { return k(id).propios; }, fmt: eur,
        nota: 'Los capítulos 1, 2 y 3 de ingresos. En tasas y precios públicos, ' + eur(k(REF).tasas) + ' por habitante en Parla y ' +
          eur(k(AQUI).tasas) + ' en ' + NOMBRE[AQUI] + '. ' + puesto(function (id) { return k(id).propios; }),
        fuentes: ['conprel'] },
      { titulo: 'Lo que llega del Estado',
        pie: pie('Transferencias corrientes del Estado por habitante, media de 2021 a 2024'),
        medias: medias('i4_art42_estado'),
        v: function (id) { return k(id).estado; }, fmt: eur,
        nota: 'El artículo 42 de ingresos, sobre todo la participación en los tributos del Estado. Las ciudades de ' +
          'más de 75.000 habitantes la reciben con un sistema distinto del de las pequeñas, y la media de la Comunidad ' +
          'mezcla los dos. ' + puesto(function (id) { return k(id).estado; }),
        fuentes: ['conprel'] },
      { titulo: 'Lo que tarda en pagar', sentido: 'menos',
        pie: 'Periodo medio de pago a proveedores en días, media de agosto de 2025 a julio de 2026',
        medias: [['Máximo legal', 30]],
        v: function (id) { return k(id).pmp; }, fmt: function (v) { return entero(v) + ' días'; },
        nota: 'Los días que pasan de media desde que el ayuntamiento da por buena una factura hasta que la paga. En ' + mes(k(REF).pmpPeriodo) +
          ', ' + entero(k(REF).pmpUltimo) + ' días en Parla. ' + puesto(function (id) { return k(id).pmp; }) +
          (k(AQUI).pmpN < 12 ? ' ' + NOMBRE[AQUI] + ' lo publica por trimestres: es la media de cuatro.' : ''),
        fuentes: ['pmp'],
        cartel: { id: 'pmp', datos: function () {
          return {
            pre: 'El Ayuntamiento de Parla tarda de media', cifra: entero(k(REF).pmp) + ' días',
            que: 'en pagar a sus proveedores',
            cajas: [{ q: 'Máximo legal', v: '30 días' }, { q: NOMBRE[AQUI], v: entero(k(AQUI).pmp) + ' días' }]
          };
        } } },
      { titulo: 'Lo que le queda en caja', sentido: 'mas',
        pie: 'Remanente de tesorería por habitante, descontadas las facturas pendientes de aplicar, 31 de diciembre de 2024',
        v: function (id) { return k(id).remanenteAjustado; }, fmt: eur,
        nota: 'Lo que tendría el ayuntamiento si cobrara lo que le deben y pagara lo que debe a corto plazo. ' +
          enNegativo() + ' A Parla le faltaban ' + num(-k(REF).remanenteEuros['2024'] / 1e6, 1) +
          ' millones de euros, después de llegar a ' + num(-k(REF).remanenteEuros['2021'] / 1e6, 0) + ' millones ' +
          'en 2021. Sin descontar las facturas pendientes, ' + eur(k(REF).remanente) + ' por habitante. Solo cuenta el ' +
          'ayuntamiento, sin sus organismos autónomos.',
        fuentes: ['conprel'] }
    ]);
  }

  /* ── Las fuentes del método ───────────────────────────────────────── */

  function fuentesMetodo() {
    const ul = $('#metodo-fuentes');
    vaciar(ul);
    Object.keys(E.fuentes).concat(['conprel', 'deudaViva', 'paro', 'renta', 'pobreza', 'pib', 'ine'])
      .forEach(function (id) {
        const f = fuente(id);
        if (!f) return;
        const li = el('li');
        const a = el('a', null, f.t);
        a.href = f.url;
        li.appendChild(a);
        ul.appendChild(li);
      });
    document.querySelectorAll('a[data-fuente]').forEach(function (a) {
      const f = fuente(a.getAttribute('data-fuente'));
      if (!f) return;
      a.href = f.url;
      a.textContent = f.t.replace(' · ', ', ');
    });
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  function comun() {
    $('#sel-texto').textContent = NOMBRE[AQUI];
    document.querySelectorAll('[data-aqui]').forEach(function (n) { n.textContent = NOMBRE[AQUI]; });
    const vuelta = RUTAS ? RAIZ_WEB + AQUI + '/' : 'index.html#' + AQUI;
    document.querySelectorAll('.js-volver').forEach(function (a) { a.href = vuelta; });
    document.title = 'El dinero de ' + NOMBRE[AQUI] + ' y el dinero de Parla · Si yo viviera como en Parla';
  }

  function pintar() {
    window.LINEA.olvidar();
    comun();
    golpe();
    trabajo();
    ocupacion();
    paro();
    renta();
    produce();
    ayuntamiento();
    paga();
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
  fuentesMetodo();
  enlace();
  pintar();
})();

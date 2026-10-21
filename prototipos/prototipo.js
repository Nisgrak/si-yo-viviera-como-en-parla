/* ═══════════════════════════════════════════════════════════════════════
   PROTOTIPO · Parla en el centro
   La misma cuenta de calculo.js con los papeles cambiados: Parla es la
   ciudad de la que se habla y la elegida hace de vara de medir.
     lo que tendría = servicios(otra) / base(otra) × base(Parla)
     falta          = lo que tendría − servicios(Parla)
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const PARLA = 'parla';
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const T = window.ICONOS.TRAZOS;
  const ICONO = window.ICONOS.ICONO;
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = function (s, r) { return (r || document).querySelector(s); };

  let REF = NOMBRE[location.hash.slice(1)] && location.hash.slice(1) !== PARLA
    ? location.hash.slice(1) : 'getafe';

  /* ── Formato ──────────────────────────────────────────────────────── */

  function entero(n) { return n.toLocaleString('es-ES'); }
  function num(n, dec) {
    const d = dec == null ? 1 : dec;
    const r = Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
    return r.toLocaleString('es-ES', { maximumFractionDigits: d });
  }
  function enSuperficie(m2) {
    return m2 >= 10000 ? num(m2 / 10000, 1) + ' ha' : entero(Math.round(m2)) + ' m²';
  }
  function cantidad(c, v) { return c.ind.medida === 'superficie' ? enSuperficie(v) : num(v); }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function icono(clave, cls) {
    const w = el('span', cls || 'ico');
    if (T[clave]) {
      w.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + T[clave] + '</svg>';
    }
    return w;
  }

  /* ── Cálculo ──────────────────────────────────────────────────────── */

  let faltan, sobran, TOTAL, SOBRA, TIENE, hospital;

  function calcular() {
    const r = window.CALCULO.comparar(Object.assign({}, D, { REFERENCIA: REF }), PARLA);
    /* En calculo.js la cartera se mira desde la ciudad elegida; aquí se hace aparte. */
    const sinHospital = function (c) { return c.ind.medida !== 'cartera'; };
    faltan = r.ganancias.filter(sinHospital).map(function (c) {
      return Object.assign({}, c, { falta: -c.delta });
    });
    sobran = r.perdidas.filter(sinHospital);

    const fuera = D.hospitales.noComparables;
    const h = D.hospitales[REF];
    hospital = {
      nombre: h.nombre, unidades: h.unidades, parla: D.hospitales[PARLA].unidades,
      faltan: h.faltanEnReferencia.filter(function (u) { return fuera.indexOf(u) < 0; }),
      sobran: h.faltanAqui.filter(function (u) { return fuera.indexOf(u) < 0; })
    };

    const cuenta = function (c) { return c.ind.enTotal !== false; };
    TOTAL = faltan.filter(cuenta).reduce(function (t, c) { return t + c.falta; }, 0);
    SOBRA = sobran.filter(cuenta).reduce(function (t, c) { return t + c.delta; }, 0);
    TIENE = D.indicadores.filter(function (i) { return i.enTotal !== false; })
      .reduce(function (t, i) { return t + i.datos[PARLA].n; }, 0);
  }

  /* ── Piezas ───────────────────────────────────────────────────────── */

  /* Lo que hay en negro y, detrás, un hueco por cada cosa que falta. */
  function tira(hay, falta, cls) {
    const cont = el('div', 'tira' + (hay + falta > 70 ? ' tira--microscopica'
      : hay + falta > 24 ? ' tira--densa' : '') + (cls ? ' ' + cls : ''));
    cont.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < hay; i++) cont.appendChild(el('span', 'u'));
    const enteros = Math.floor(falta + 1e-9);
    const parte = falta - enteros;
    for (let j = 0; j < enteros; j++) {
      const u = el('span', 'u u--hueco');
      u.style.setProperty('--retraso', Math.min(j, 40) * 34 + 'ms');
      cont.appendChild(u);
    }
    if (parte > 0.15) {
      const u = el('span', 'u u--hueco u--hueco-parte');
      u.style.setProperty('--parte', (parte * 100).toFixed(0) + '%');
      u.style.setProperty('--retraso', Math.min(enteros, 40) * 34 + 'ms');
      cont.appendChild(u);
    }
    return cont;
  }

  function fila(texto, cls, cola) {
    const li = el('li', 'nombre' + (cls ? ' ' + cls : ''));
    li.appendChild(el('span', 'nombre__m'));
    li.appendChild(el('span', 'nombre__t', texto));
    li.appendChild(el('span', 'nombre__p', cola || ''));
    return li;
  }

  function plegado(titulo, items, cls) {
    const det = el('details', 'plegable');
    det.appendChild(el('summary', null, titulo));
    const ul = el('ul', 'nombres');
    items.forEach(function (n) { ul.appendChild(fila(n, cls)); });
    det.appendChild(ul);
    return det;
  }

  function tasas(c) {
    const max = Math.max(c.tasaA, c.tasaB) || 1;
    const cont = el('div', 'tasas');
    cont.appendChild(el('p', 'tasas__ley', c.ind.medida === 'superficie'
      ? 'Metros cuadrados por habitante' : 'Por cada ' + entero(c.por) + ' ' + c.base.etiqueta));
    [[PARLA, c.tasaA], [REF, c.tasaB]].forEach(function (f) {
      const t = el('div', 'tasa');
      t.dataset.quien = f[0] === REF ? 'referencia' : 'aqui';
      t.appendChild(el('span', 'tasa__quien', NOMBRE[f[0]]));
      const pista = el('span', 'tasa__pista');
      const barra = el('i');
      barra.style.setProperty('--v', (f[1] / max).toFixed(4));
      pista.appendChild(barra);
      t.appendChild(pista);
      t.appendChild(el('span', 'tasa__valor', num(f[1], f[1] < 10 ? 1 : 0)));
      cont.appendChild(t);
    });
    return cont;
  }

  function cabecera(art, ind) {
    const cab = el('p', 'ind__grupo');
    cab.appendChild(icono(ICONO[ind.id], 'ind__ico'));
    cab.appendChild(el('span', null, ind.grupo));
    art.appendChild(cab);
    art.appendChild(el('h3', 'ind__h', ind.titulo));
  }

  /* Una ficha de lo que falta. Los nombres son los de Parla; los huecos no
     tienen nombre porque no existen, y los de la otra ciudad van debajo,
     plegados, para comparar. */
  function fichaFalta(c) {
    const i = c.ind;
    const sup = i.medida === 'superficie';
    const art = el('article', 'ind');
    art.id = 'ind-' + i.id;
    cabecera(art, i);

    let titular;
    if (sup) {
      titular = 'Le faltan <span class="cifra">' + enSuperficie(c.falta) + '</span>' +
        ' <span class="resto">a las ' + enSuperficie(c.n) + ' que tiene</span>';
    } else if (c.n === 0) {
      titular = 'No tiene <span class="cifra cifra--cero">ningun' + (i.gen === 'f' ? 'a' : 'o') +
        '</span> <span class="resto">y le corresponderían ' + num(c.equivalente) + '</span>';
    } else {
      titular = 'Le faltan <span class="cifra">' + num(c.falta) + '</span>' +
        ' <span class="resto">a ' + (i.gen === 'f' ? 'las ' : 'los ') + entero(c.n) + ' que tiene</span>';
    }
    art.appendChild(el('p', 'ind__titular', titular));

    if (!sup && c.n + c.falta <= 400) art.appendChild(tira(c.n, c.falta));
    art.appendChild(tasas(c));
    art.appendChild(el('p', 'tasas__pie', 'Con la proporción de ' + NOMBRE[REF] + ', Parla tendría ' +
      cantidad(c, c.equivalente) + '. Tiene ' + cantidad(c, c.n) + '.'));

    if (!sup && i.enTotal !== false) {
      const bloque = el('div', 'nombres-bloque');
      bloque.appendChild(el('p', 'nombres__rot nombres__rot--falta', 'Lo que falta'));
      const ul = el('ul', 'nombres');
      /* Cada hueco es «la tercera biblioteca»: la que vendría detrás de las
         que hay. Así cada fila dice algo y no se repite «falta una». */
      const enteros = Math.floor(c.falta + 1e-9);
      const ord = function (k) {
        return i.gen === 'f' ? 'La ' + k + '.ª' : 'El ' + k + (k === 1 || k === 3 ? '.er' : '.º');
      };
      for (let k = 1; k <= enteros; k++) {
        ul.appendChild(fila(ord(c.n + k) + ' ' + i.sing, 'nombre--hueco', 'no existe'));
      }
      const parte = c.falta - enteros;
      if (parte > 0.15) {
        ul.appendChild(fila('Y ' + (i.gen === 'f' ? 'la ' : 'el ') + (c.n + enteros + 1) +
          (i.gen === 'f' ? '.ª' : '.º') + ', a medias', 'nombre--hueco nombre--parte',
          'falta el ' + num(parte * 100, 0) + ' %'));
      }
      bloque.appendChild(ul);

      const lista = c.lista || [];
      if (lista.length) {
        if (lista.length <= 8) {
          bloque.appendChild(el('p', 'nombres__rot', 'Lo que hay en Parla'));
          const ul2 = el('ul', 'nombres');
          lista.forEach(function (n) { ul2.appendChild(fila(n)); });
          bloque.appendChild(ul2);
        } else {
          bloque.appendChild(plegado('Ver ' + (i.gen === 'f' ? 'las ' : 'los ') + lista.length +
            ' que hay en Parla', lista));
        }
      }
      const suya = i.datos[REF].lista || [];
      if (suya.length) {
        const art2 = i.gen === 'f' ? ['la', 'las'] : ['el', 'los'];
        bloque.appendChild(plegado('Ver ' + (suya.length === 1 ? art2[0] + ' de ' : art2[1] + ' ' + suya.length + ' de ') +
          NOMBRE[REF], suya, 'nombre--ref'));
      }
      art.appendChild(bloque);
    }
    return art;
  }

  /* El hospital: aquí los huecos sí tienen nombre, porque lo que falta son
     unidades que el otro hospital declara y el de Parla no. */
  function fichaHospital() {
    const h = hospital;
    const ind = { id: 'hospital', grupo: 'Sanidad', titulo: 'Servicios del hospital público' };
    const art = el('article', 'ind');
    art.id = 'ind-hospital';
    cabecera(art, ind);
    if (!h.unidades) {
      art.appendChild(el('p', 'ind__titular', '<span class="resto">' + NOMBRE[REF] +
        ' no tiene hospital público. El Infanta Cristina de Parla declara ' + h.parla + ' unidades.</span>'));
      return art;
    }
    art.appendChild(el('p', 'ind__titular', 'Le faltan <span class="cifra">' + h.faltan.length +
      '</span> <span class="resto">unidades que sí tiene el ' + h.nombre + '</span>'));
    art.appendChild(tira(h.parla, h.faltan.length));
    const b = el('div', 'nombres-bloque');
    b.appendChild(el('p', 'nombres__rot nombres__rot--falta', 'Lo que falta en el Infanta Cristina'));
    const ul = el('ul', 'nombres');
    h.faltan.forEach(function (u) { ul.appendChild(fila(u, 'nombre--hueco nombre--nombrado')); });
    b.appendChild(ul);
    if (h.sobran.length) {
      b.appendChild(el('p', 'nombres__rot nombres__rot--mejor', 'Y al revés: lo que solo tiene Parla'));
      const ul2 = el('ul', 'nombres');
      h.sobran.forEach(function (u) { ul2.appendChild(fila(u, 'nombre--mejor')); });
      b.appendChild(ul2);
    }
    art.appendChild(b);
    return art;
  }

  /* ── Portada ──────────────────────────────────────────────────────── */

  function golpe() {
    const ids = Object.keys(NOMBRE);
    const cuentan = D.indicadores.filter(function (i) { return i.enTotal !== false; });
    let ultima = 0;
    cuentan.forEach(function (ind) {
      const base = D.BASES[ind.base || 'total'];
      const tasa = function (m) { return ind.datos[m].n / base.valores[m]; };
      if (ids.every(function (m) { return tasa(PARLA) <= tasa(m) + 1e-12; })) ultima++;
    });
    $('#golpe').innerHTML = 'De las ' + ids.length + ' ciudades, Parla es <b>la última</b> en ' +
      '<b>' + ultima + ' de los ' + cuentan.length + '</b> equipamientos. Da igual con cuál la compares.';
  }

  function portada() {
    $('#pob-parla').textContent = entero(D.BASES.total.valores[PARLA]);
    $('#pob-ref').textContent = entero(D.BASES.total.valores[REF]);
    Array.prototype.forEach.call(document.querySelectorAll('[data-ref]'), function (n) {
      n.textContent = NOMBRE[REF];
    });
    $('#sel-texto').textContent = NOMBRE[REF];

    const sobra = Math.round(SOBRA);
    $('#gana-portada').textContent = sobra > 0
      ? 'Y tendría ' + sobra + ' menos en ' + areas(sobran) + ', donde Parla está mejor.' : '';

    const marcas = Math.round(TOTAL);
    const rejilla = $('#rejilla');
    vaciar(rejilla);
    rejilla.appendChild(tira(TIENE, marcas, 'tira--portada'));
    $('#rejilla-ley').innerHTML = '<span class="ley ley--hay"></span>' + TIENE + ' que hay ' +
      '<span class="ley ley--hueco"></span>' + marcas + ' que faltan';

    const n = $('#total-n');
    if (quieto) { n.textContent = marcas; return; }
    const ini = performance.now();
    (function paso(t) {
      const p = Math.min(1, (t - ini) / 1400);
      n.textContent = Math.round((1 - Math.pow(1 - p, 4)) * marcas);
      if (p < 1) requestAnimationFrame(paso);
    })(ini);
  }

  function areas(lista) {
    const a = [];
    lista.forEach(function (c) {
      if (c.ind.enTotal === false) return;
      const k = c.ind.grupo.toLowerCase();
      if (a.indexOf(k) < 0) a.push(k);
    });
    return a.join(' y ');
  }

  /* ── Recuento ─────────────────────────────────────────────────────── */

  function filaRec(c, modo, n) {
    const li = el('li', 'rec' + (modo ? ' rec--' + modo : ''));
    const a = el('a', 'rec__a');
    a.href = '#ind-' + c.ind.id;
    a.appendChild(icono(ICONO[c.ind.id], 'rec__ico'));
    a.appendChild(el('span', 'rec__q', c.ind.titulo));
    a.appendChild(el('span', 'rec__n', n));
    li.appendChild(a);
    return li;
  }

  function area(titulo, cifra, cls) {
    const b = el('div', 'area' + (cls ? ' ' + cls : ''));
    const cab = el('div', 'area__cab');
    cab.appendChild(el('h3', 'area__q', titulo));
    if (cifra) cab.appendChild(el('span', 'area__n', cifra));
    b.appendChild(cab);
    const ul = el('ul', 'area__filas');
    b.appendChild(ul);
    return { b: b, ul: ul };
  }

  function resumen() {
    const cont = $('#recuento');
    vaciar(cont);
    const mapa = {};
    const orden = [];
    faltan.forEach(function (c) {
      if (c.ind.enTotal === false) return;
      if (!mapa[c.ind.grupo]) { mapa[c.ind.grupo] = []; orden.push(c.ind.grupo); }
      mapa[c.ind.grupo].push(c);
    });
    const suma = function (l) { return l.reduce(function (t, c) { return t + c.falta; }, 0); };
    orden.sort(function (x, y) { return suma(mapa[y]) - suma(mapa[x]); });

    const cab = el('div', 'rec__columnas');
    cab.appendChild(el('span', null, ''));
    cab.appendChild(el('span', null, 'Le faltan'));
    cont.appendChild(cab);

    orden.forEach(function (k) {
      const a = area(k, num(suma(mapa[k])));
      mapa[k].forEach(function (c) { a.ul.appendChild(filaRec(c, null, num(c.falta))); });
      cont.appendChild(a.b);
    });

    const aparte = area('Fuera del recuento', null, 'area--extra');
    faltan.forEach(function (c) {
      if (c.ind.enTotal === false) aparte.ul.appendChild(filaRec(c, 'aparte', cantidad(c, c.falta)));
    });
    if (hospital.faltan.length) {
      aparte.ul.appendChild(filaRec({ ind: { id: 'hospital', titulo: 'Servicios del hospital público' } },
        'aparte', String(hospital.faltan.length)));
    }
    if (aparte.ul.children.length) cont.appendChild(aparte.b);

    if (sobran.length) {
      const m = area('Donde Parla tiene más', '+' + num(SOBRA), 'area--mejor');
      sobran.forEach(function (c) {
        m.ul.appendChild(filaRec(c, 'mejor', '+' + cantidad(c, c.delta)));
      });
      cont.appendChild(m.b);
    }

    const f = Math.round(TOTAL);
    const s = Math.round(SOBRA);
    $('#resumen-total').innerHTML = s > 0
      ? 'A Parla le faltan <b>' + f + '</b> y tiene <b class="mejor">' + s + '</b> de más: ' +
        (f - s) + ' menos en neto.'
      : 'A Parla le faltan <b>' + f + ' equipamientos</b> en total.';
  }

  /* ── Listas ───────────────────────────────────────────────────────── */

  function listas() {
    const l = $('#lista-faltan');
    vaciar(l);
    faltan.forEach(function (c) {
      if (c.ind.enTotal !== false) l.appendChild(fichaFalta(c));
    });
    l.appendChild(fichaHospital());
    faltan.forEach(function (c) {
      if (c.ind.enTotal === false) l.appendChild(fichaFalta(c));
    });

    const m = $('#lista-mejor');
    vaciar(m);
    $('#mejor-intro').textContent = sobran.length
      ? 'También se dice. Con la proporción de ' + NOMBRE[REF] + ', Parla tendría menos de esto:'
      : 'Con ' + NOMBRE[REF] + ' no hay nada en lo que Parla esté mejor dotada.';
    sobran.forEach(function (c) {
      const art = el('article', 'ind ind--mejor');
      art.id = 'ind-' + c.ind.id;
      cabecera(art, c.ind);
      art.appendChild(el('p', 'ind__titular', 'Tiene <span class="cifra">' + cantidad(c, c.delta) +
        '</span> <span class="resto">de más</span>'));
      art.appendChild(tasas(c));
      m.appendChild(art);
    });
    movimiento();
  }

  function movimiento() {
    const cosas = document.querySelectorAll('.ind, .marcador');
    if (quieto || !('IntersectionObserver' in window)) {
      cosas.forEach(function (n) { n.classList.add('visto'); });
      return;
    }
    const obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    cosas.forEach(function (n) { n.classList.remove('visto'); obs.observe(n); });
  }

  /* ── Mandos ───────────────────────────────────────────────────────── */

  const sel = $('#sel-municipio');
  D.MUNICIPIOS.forEach(function (m) {
    if (m.id === PARLA) return;
    const o = el('option', null, m.nombre);
    o.value = m.id;
    sel.appendChild(o);
  });
  sel.value = REF;
  sel.addEventListener('change', function () {
    REF = sel.value;
    history.replaceState(null, '', '#' + REF);
    pintar();
  });

  const NOMBRES = { cola: 'Parla, a la cola', pobre: 'Pobre Parla' };
  document.querySelectorAll('input[name="nombre"]').forEach(function (r) {
    r.addEventListener('change', function () {
      $('#marca-txt').textContent = NOMBRES[r.value];
      document.title = NOMBRES[r.value] + ' · prototipo';
    });
  });
  document.querySelectorAll('input[name="marca"]').forEach(function (r) {
    r.addEventListener('change', function () { document.body.dataset.marca = r.value; });
  });

  function pintar() {
    calcular();
    portada();
    resumen();
    listas();
  }

  golpe();
  pintar();
})();

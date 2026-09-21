/* ═══════════════════════════════════════════════════════════════════════
   SI YO VIVIERA COMO EN PARLA · render
   La única cuenta que hace esta web:
     equivalente = servicios(referencia) / población(referencia) × población(aquí)
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const AQUI = 'getafe';
  const REF = D.referencia;                       // 'parla'
  const POB_A = D.POBLACIONES[AQUI];
  const POB_B = D.POBLACIONES[REF];
  const NOMBRE_A = 'Getafe';
  const NOMBRE_B = 'Parla';

  /* Por debajo de este umbral la diferencia es ruido, no una pérdida */
  const UMBRAL = 0.15;

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);

  /* ── Formato ──────────────────────────────────────────────────────── */

  const entero = (n) => n.toLocaleString('es-ES');

  function num(n, dec) {
    if (dec === undefined) {               // titulares: entero si redondea limpio
      dec = Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1;
    }
    return n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  const baseDe = (ind) => D.BASES[ind.base || 'total'];
  const tasa = (n, pob, por) => (n / pob) * por;

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ── Cálculo ──────────────────────────────────────────────────────── */

  const calculados = D.indicadores.map(function (ind) {
    const a = ind.datos[AQUI];
    const b = ind.datos[REF];
    const base = baseDe(ind);                    // contra qué población se mide
    const baseA = base.valores[AQUI];
    const baseB = base.valores[REF];
    const equivalente = (b.n / baseB) * baseA;
    const delta = a.n - equivalente;             // > 0 → se pierde
    return {
      ind: ind,
      base: base,
      baseA: baseA,
      baseB: baseB,
      n: a.n,
      nRef: b.n,
      lista: a.lista,
      equivalente: equivalente,
      delta: delta,
      pct: a.n > 0 ? delta / a.n : 0,
      tasaA: tasa(a.n, baseA, base.por),
      tasaB: tasa(b.n, baseB, base.por),
    };
  });

  const perdidas = calculados
    .filter((c) => c.delta > UMBRAL)
    .sort(function (x, y) {
      const ax = x.ind.enTotal === false ? 1 : 0;
      const ay = y.ind.enTotal === false ? 1 : 0;
      return (ax - ay) || (y.pct - x.pct) || (y.delta - x.delta);
    });

  const ganancias = calculados
    .filter((c) => c.delta < -UMBRAL)
    .sort((x, y) => x.delta - y.delta);

  const empates = calculados.filter((c) => Math.abs(c.delta) <= UMBRAL);

  const cuenta = (c) => c.ind.enTotal !== false;
  const TOTAL = perdidas.filter(cuenta).reduce((s, c) => s + c.delta, 0);

  /* ── Piezas reutilizables ─────────────────────────────────────────── */

  /**
   * Tira de unidades. Las últimas `delta` caen: las enteras del todo,
   * y la anterior a media asta según el decimal. `ganadas` añade al final
   * las unidades que se sumarían, en verde.
   */
  function tira(total, delta, ganadas) {
    ganadas = ganadas || 0;
    const cont = el('div', 'tira' + (total + ganadas > 70 ? ' tira--microscopica'
                                   : total + ganadas > 24 ? ' tira--densa' : ''));
    cont.setAttribute('aria-hidden', 'true');
    const enteras = Math.floor(delta);
    const parcial = delta - enteras;
    const primeraQueCae = total - enteras;
    const indiceParcial = parcial > 0.04 ? primeraQueCae - 1 : -1;

    for (let i = 0; i < total; i++) {
      const u = el('span', 'u');
      if (delta > 0 && i >= primeraQueCae) {
        u.classList.add('u--cae');
        u.style.setProperty('--retraso', Math.min(i - primeraQueCae, 30) * 26 + 'ms');
      } else if (delta > 0 && i === indiceParcial) {
        u.classList.add('u--media');
        u.style.setProperty('--parte', ((1 - parcial) * 100).toFixed(1) + '%');
      }
      cont.appendChild(u);
    }
    for (let j = 0; j < ganadas; j++) {
      cont.appendChild(el('span', 'u u--gana'));
    }
    return cont;
  }

  /** Comparativa por 100.000 habitantes */
  function tasas(c, modo) {
    const max = Math.max(c.tasaA, c.tasaB) || 1;
    const cont = el('div', 'tasas');

    if (c.ind.base && c.ind.base !== 'total') {
      cont.appendChild(el('p', 'tasas__base',
        'Medido sobre la <b>' + c.base.corto + '</b>: ' +
        NOMBRE_A + ' ' + entero(c.baseA) + ' · ' + NOMBRE_B + ' ' + entero(c.baseB)));
    }

    [
      { id: AQUI, nombre: NOMBRE_A, v: c.tasaA },
      { id: REF, nombre: NOMBRE_B, v: c.tasaB },
    ].forEach(function (f) {
      const fila = el('div', 'tasa');
      fila.dataset.quien = f.id;
      fila.appendChild(el('span', 'tasa__quien', f.nombre));
      const pista = el('span', 'tasa__pista');
      const barra = el('i');
      barra.style.setProperty('--v', (f.v / max).toFixed(4));
      pista.appendChild(barra);
      fila.appendChild(pista);
      fila.appendChild(el('span', 'tasa__valor', num(f.v, 2)));
      cont.appendChild(fila);
    });
    const unidad = 'por cada ' + entero(c.base.por) + ' ' + c.base.etiqueta;
    const exacto = modo === 'gana'
      ? unidad + ' · con la tasa de ' + NOMBRE_B + ' habría ' +
        num(c.equivalente, 2) + ' en ' + NOMBRE_A
      : unidad + ' · con la tasa de ' + NOMBRE_B + ' quedarían ' +
        num(c.equivalente, 2) + ' de ' + c.n;
    cont.appendChild(el('p', 'tasas__pie', exacto));
    return cont;
  }

  /**
   * Reparte la pérdida sobre la lista de nombres: las últimas caen enteras,
   * la anterior se queda a medias. El reparto concreto es ilustrativo; el
   * número de bajas, no.
   */
  function reparto(c) {
    const lista = c.lista || [];
    const total = lista.length;
    const enteras = Math.floor(c.delta);
    const parcial = c.delta - enteras;
    const desde = total - enteras;
    const iParcial = parcial > 0.04 ? desde - 1 : -1;
    return {
      total: total,
      caen: lista.slice(Math.max(desde, 0)),
      parcial: iParcial >= 0 ? { nombre: lista[iParcial], queda: (1 - parcial) * 100 } : null,
      sobreviven: lista.slice(0, Math.max(iParcial >= 0 ? iParcial : desde, 0)),
    };
  }

  /** Lista de nombres, con los que caen tachados */
  function nombres(c) {
    if (!c.lista || !c.lista.length) return null;

    const cont = el('div', 'nombres-bloque');

    /* La lista no enumera unidades (p. ej. plazas): va como contexto */
    if (c.lista.length !== c.n) {
      const ul = el('ul', 'nombres');
      c.lista.forEach(function (nombre) {
        const li = el('li', 'nombre');
        li.appendChild(el('span', 'nombre__m'));
        li.appendChild(el('span', 'nombre__t', nombre));
        li.appendChild(el('span', 'nombre__p', ''));
        ul.appendChild(li);
      });
      cont.appendChild(el('p', 'nombres__rot', 'Dónde están esas plazas'));
      cont.appendChild(ul);
      return cont;
    }

    const r = reparto(c);

    if (r.caen.length || r.parcial) {
      cont.appendChild(el('p', 'nombres__rot nombres__rot--cae',
        r.caen.length === c.n ? 'Desaparecen todas' : 'Lo que desaparece'));
      const ul = el('ul', 'nombres');
      r.caen.forEach(function (nombre) {
        const li = el('li', 'nombre nombre--cae');
        li.appendChild(el('span', 'nombre__m'));
        li.appendChild(el('span', 'nombre__t', nombre));
        li.appendChild(el('span', 'nombre__p', 'desaparece'));
        ul.appendChild(li);
      });
      if (r.parcial) {
        const li = el('li', 'nombre nombre--media');
        li.appendChild(el('span', 'nombre__m'));
        li.appendChild(el('span', 'nombre__t', r.parcial.nombre));
        li.appendChild(el('span', 'nombre__p', 'se queda al ' + num(r.parcial.queda, 0) + ' %'));
        ul.appendChild(li);
      }
      cont.appendChild(ul);
    }

    if (r.sobreviven.length) {
      const det = el('details', 'plegable');
      det.appendChild(el('summary', null,
        'Ver ' + (r.sobreviven.length === 1 ? 'el que aguanta' : 'los ' + r.sobreviven.length + ' que aguantan')));
      const ul = el('ul', 'nombres');
      r.sobreviven.forEach(function (nombre) {
        const li = el('li', 'nombre');
        li.appendChild(el('span', 'nombre__m'));
        li.appendChild(el('span', 'nombre__t', nombre));
        li.appendChild(el('span', 'nombre__p', ''));
        ul.appendChild(li);
      });
      det.appendChild(ul);
      cont.appendChild(det);
    }

    return cont;
  }

  /** Un indicador completo */
  function bloqueIndicador(c, modo) {
    const i = c.ind;
    const art = el('article', 'ind' + (modo === 'gana' ? ' ind--gana' : ''));
    art.id = 'ind-' + i.id;
    if (i.enTotal !== false) art.dataset.delta = c.delta.toFixed(4);

    art.appendChild(el('p', 'ind__grupo', i.grupo));
    art.appendChild(el('h3', 'ind__h', i.titulo));

    /* Titular */
    let titular;
    if (modo === 'gana') {
      const resto = c.n === 0 ? 'donde ahora no hay nada' : 'más de las que hay ahora';
      titular = 'Ganarías <span class="cifra">' + num(-c.delta) + '</span> ' +
                '<span class="resto">' + resto + '</span>';
    } else if (c.nRef === 0) {
      titular = 'Perderías <span class="cifra">' + num(c.n) + '</span> ' +
                '<span class="resto">de ' + c.n + '. Sin excepción.</span>';
    } else {
      titular = 'Perderías <span class="cifra">' + num(c.delta) + '</span> ' +
                '<span class="resto">de ' + c.n + '</span>';
    }
    art.appendChild(el('p', 'ind__titular', titular));

    /* Recuento accesible, equivalente a la tira */
    const sr = el('p', 'oculto');
    sr.textContent = NOMBRE_A + ' tiene ' + c.n + ' y ' + NOMBRE_B + ' tiene ' + c.nRef + '. ' +
      'Medido sobre la ' + c.base.corto + '. ' +
      'Con la tasa de ' + NOMBRE_B + ', en ' + NOMBRE_A + ' quedarían ' + num(c.equivalente, 1) + '.';
    art.appendChild(sr);

    /* Tira */
    if (modo === 'gana') {
      art.appendChild(tira(c.n, 0, Math.round(-c.delta)));
    } else if (c.n > 0 && c.n <= 200) {
      art.appendChild(tira(c.n, c.delta, 0));
    }

    art.appendChild(tasas(c, modo));

    if (modo === 'gana') {
      const refLista = i.datos[REF].lista;
      if (refLista && refLista.length && refLista.length <= 10) {
        art.appendChild(el('p', 'ind__nota',
          'En ' + NOMBRE_B + ': ' + refLista.join(' · ') + '.'));
      }
    } else {
      const lista = nombres(c);
      if (lista) art.appendChild(lista);
    }

    if (i.nota) art.appendChild(el('p', 'ind__nota', i.nota));

    let pieFuente = 'Fuente: <a href="' + i.fuente.url + '" target="_blank" rel="noopener">' +
      i.fuente.t + '</a>';
    if (i.base && i.base !== 'total') {
      const fb = D.fuentes[c.base.fuenteId];
      pieFuente += '. Población de referencia: <a href="' + fb.url +
        '" target="_blank" rel="noopener">' + fb.t + '</a>';
    }
    art.appendChild(el('p', 'ind__fuente', pieFuente));

    return art;
  }

  /* ── Portada ──────────────────────────────────────────────────────── */

  function portada() {
    const sel = $('#sel-municipio');
    D.MUNICIPIOS.forEach(function (m) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.activo ? m.nombre : m.nombre + ' — pronto';
      o.dataset.corto = m.nombre;
      o.disabled = !m.activo;
      o.selected = m.id === AQUI;
      sel.appendChild(o);
    });
    const eco = $('#sel-texto');
    const pintar = () => { eco.textContent = sel.options[sel.selectedIndex].dataset.corto; };
    sel.addEventListener('change', pintar);
    pintar();

    $('#pob-a').textContent = entero(POB_A);
    $('#pob-b').textContent = entero(POB_B);

    /* Rejilla: una marca por cada servicio que cae */
    const rejilla = $('#rejilla');
    const marcas = Math.round(TOTAL);
    rejilla.className = 'marcador__rejilla tira' + (marcas > 24 ? ' tira--densa' : '');
    for (let i = 0; i < marcas; i++) {
      const u = el('span', 'u u--cae');
      u.style.setProperty('--retraso', 300 + i * 34 + 'ms');
      rejilla.appendChild(u);
    }

    const marcador = document.querySelector('.marcador');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { marcador.classList.add('visto'); });
    });

    /* El número sube hasta el total */
    const salida = $('#total-n');
    if (quieto) {
      salida.textContent = marcas;
      return;
    }
    const fin = performance.now() + 1400;
    (function paso(t) {
      const queda = Math.max(0, fin - t);
      const p = 1 - queda / 1400;
      const suave = 1 - Math.pow(1 - p, 4);
      salida.textContent = Math.round(suave * marcas);
      if (queda > 0) requestAnimationFrame(paso);
      else salida.textContent = marcas;
    })(performance.now());
  }

  /* ── Renta ────────────────────────────────────────────────────────── */

  function renta() {
    const r = D.contexto.renta;
    const cont = $('#renta');
    const max = Math.max(r.valores.madrid, r.valores.getafe, r.valores.parla);

    [
      { id: 'madrid', nombre: 'Comunidad de Madrid', v: r.valores.madrid },
      { id: 'getafe', nombre: 'Getafe', v: r.valores.getafe },
      { id: 'parla', nombre: 'Parla', v: r.valores.parla },
    ].forEach(function (f) {
      const fila = el('div', 'renta__fila');
      fila.dataset.destacar = f.id;
      fila.appendChild(el('p', 'renta__quien', f.nombre));
      fila.appendChild(el('p', 'renta__cuanto', entero(f.v) + ' €'));
      const barra = el('div', 'renta__barra');
      const i = el('i');
      i.style.width = ((f.v / max) * 100).toFixed(1) + '%';
      barra.appendChild(i);
      fila.appendChild(barra);
      fila.appendChild(el('p', 'renta__pct',
        f.id === 'madrid'
          ? 'referencia regional'
          : num((f.v / r.valores.madrid) * 100, 1) + ' % de la media regional'));
      cont.appendChild(fila);
    });

    cont.appendChild(el('p', 'renta__nota', r.nota));
    cont.appendChild(el('p', 'ind__fuente',
      'Fuente: <a href="' + r.fuente.url + '" target="_blank" rel="noopener">' + r.fuente.t + '</a>'));
  }

  /* ── El recuento: todo lo que cae, de un vistazo ──────────────────── */

  function frase(nombres, y) {
    if (nombres.length === 1) return nombres[0];
    return nombres.slice(0, -1).join(', ') + ' ' + (y || 'y') + ' ' + nombres[nombres.length - 1];
  }

  function resumen() {
    const ol = $('#recuento');

    perdidas.forEach(function (c) {
      const li = el('li', 'rec' + (c.ind.enTotal === false ? ' rec--aparte' : ''));
      const a = el('a', 'rec__a');
      a.href = '#ind-' + c.ind.id;

      a.appendChild(el('span', 'rec__n', '−' + num(c.delta)));

      const cuerpo = el('span', 'rec__cuerpo');
      cuerpo.appendChild(el('span', 'rec__q', c.ind.titulo));

      let detalle;
      if (c.lista && c.lista.length === c.n) {
        const r = reparto(c);
        const trozos = r.caen.slice();
        if (r.parcial) trozos.push(r.parcial.nombre + ' (al ' + num(r.parcial.queda, 0) + ' %)');
        detalle = frase(trozos);
      } else {
        detalle = 'el ' + num(c.pct * 100, 0) + ' % del total de la ciudad';
      }
      cuerpo.appendChild(el('span', 'rec__d', detalle));
      a.appendChild(cuerpo);
      li.appendChild(a);
      ol.appendChild(li);
    });

    /* El hospital no se reparte por habitante: va como línea propia */
    const h = D.hospital;
    const li = el('li', 'rec rec--aparte');
    const a = el('a', 'rec__a');
    a.href = '#hospital';
    a.appendChild(el('span', 'rec__n', '−' + h.faltan.length));
    const cuerpo = el('span', 'rec__cuerpo');
    cuerpo.appendChild(el('span', 'rec__q', 'Unidades del hospital público'));
    cuerpo.appendChild(el('span', 'rec__d',
      h.faltan.slice(0, 6).join(', ') + ' y ' + (h.faltan.length - 6) + ' más'));
    a.appendChild(cuerpo);
    li.appendChild(a);
    ol.appendChild(li);

    $('#resumen-n').textContent = Math.round(TOTAL);
  }

  /* ── Estructura de edad ───────────────────────────────────────────── */

  function edades() {
    const e = D.contexto.edades;
    const cont = $('#edades');
    const refPct = (e.total[REF] / e.total[AQUI]) * 100;

    cont.appendChild(el('p', 'edades__ley',
      'Población de ' + NOMBRE_B + ' como porcentaje de la de ' + NOMBRE_A +
      ', por tramo de edad'));

    const graf = el('div', 'edades__grafico');
    graf.style.setProperty('--linea', refPct.toFixed(2) + '%');

    e.tramos.concat([{ etiqueta: 'Todas las edades', getafe: e.total[AQUI], parla: e.total[REF], esTotal: true }])
      .forEach(function (t) {
        const pct = (t[REF] / t[AQUI]) * 100;
        const fila = el('div', 'edad' + (t.esTotal ? ' edad--total' : ''));
        fila.appendChild(el('span', 'edad__q', t.etiqueta));
        const pista = el('span', 'edad__pista');
        const barra = el('i');
        barra.style.setProperty('--v', (pct / 100).toFixed(4));
        pista.appendChild(barra);
        fila.appendChild(pista);
        fila.appendChild(el('span', 'edad__v', num(pct, 0) + ' %'));
        const sr = el('span', 'oculto');
        sr.textContent = NOMBRE_A + ' ' + entero(t[AQUI]) + ', ' + NOMBRE_B + ' ' + entero(t[REF]);
        fila.appendChild(sr);
        graf.appendChild(fila);
      });
    cont.appendChild(graf);

    cont.appendChild(el('p', 'edades__marca',
      'La línea gris marca el ' + num(refPct, 0) + ' %: el tamaño de ' + NOMBRE_B +
      ' respecto a ' + NOMBRE_A + ' contando a todo el mundo. Todo lo que la pasa es un tramo ' +
      'de edad en el que ' + NOMBRE_B + ' pesa más de lo que le tocaría.'));
    cont.appendChild(el('p', 'renta__nota', e.nota));
    cont.appendChild(el('p', 'ind__fuente',
      'Fuente: <a href="' + e.fuente.url + '" target="_blank" rel="noopener">' + e.fuente.t + '</a>'));
  }

  /* ── Listas ───────────────────────────────────────────────────────── */

  function listas() {
    const lp = $('#lista-perdidas');
    const env = el('div', 'env');
    perdidas.forEach((c) => env.appendChild(bloqueIndicador(c, 'pierde')));

    if (empates.length) {
      const art = el('article', 'ind');
      art.appendChild(el('p', 'ind__grupo', 'Empate técnico'));
      art.appendChild(el('h3', 'ind__h',
        'Y en esto las dos ciudades están igual'));
      const ul = el('ul', 'pendientes');
      empates.forEach(function (c) {
        ul.appendChild(el('li', null,
          c.ind.titulo + ' — ' + NOMBRE_A + ' ' + c.n + ', ' + NOMBRE_B + ' ' + c.nRef +
          ' (diferencia: ' + num(Math.abs(c.delta), 2) + ')'));
      });
      art.appendChild(ul);
      env.appendChild(art);
    }
    lp.appendChild(env);

    const lg = $('#lista-ganancias');
    const env2 = el('div', 'env');
    ganancias.forEach((c) => env2.appendChild(bloqueIndicador(c, 'gana')));
    lg.appendChild(env2);
  }

  /* ── Hospital ─────────────────────────────────────────────────────── */

  function hospital() {
    const h = D.hospital;
    $('#hosp-a').textContent = h.getafe.unidades;
    $('#hosp-b').textContent = h.parla.unidades;
    const ul = $('#unidades');
    h.faltan.forEach(function (u, i) {
      ul.appendChild(el('li', 'unidad' + (i < 4 ? ' unidad--grave' : ''), u));
    });
    $('#hosp-cautela').textContent = h.cautela;
  }

  /* ── Método ───────────────────────────────────────────────────────── */

  function metodo() {
    const p = $('#pendientes');
    D.pendientes.forEach((t) => p.appendChild(el('li', null, t)));

    const vistas = {};
    const f = $('#fuentes');
    [{ fuente: D.fuentes.ine }, { fuente: D.fuentes.edades }]
      .concat(D.indicadores, [D.hospital, D.contexto.renta]).forEach(function (i) {
      const s = i.fuente;
      if (!s || vistas[s.url]) return;
      vistas[s.url] = 1;
      f.appendChild(el('li', null,
        '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.t + '</a>'));
    });

    $('#actualizado').textContent = D.ACTUALIZADO;
  }

  /* ── Movimiento ───────────────────────────────────────────────────── */

  function movimiento() {
    const bloques = Array.prototype.slice.call(document.querySelectorAll('.ind'));

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visto');
            obs.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      bloques.forEach((b) => obs.observe(b));
    } else {
      bloques.forEach((b) => b.classList.add('visto'));
    }

    /* Contador acumulado */
    const chip = $('#contador');
    const salida = $('#contador-n');
    const perdidasDOM = Array.prototype.slice
      .call(document.querySelectorAll('#lista-perdidas .ind[data-delta]'));
    const finZona = $('#hospital');
    let pedido = false;
    let ultimo = -1;

    function medir() {
      pedido = false;
      const corte = window.innerHeight * 0.55;
      let suma = 0;
      for (let i = 0; i < perdidasDOM.length; i++) {
        if (perdidasDOM[i].getBoundingClientRect().top < corte) {
          suma += parseFloat(perdidasDOM[i].dataset.delta);
        }
      }
      const visible = suma >= 1 && finZona.getBoundingClientRect().top > 120;
      chip.dataset.visible = visible ? '1' : '0';
      chip.setAttribute('aria-hidden', visible ? 'false' : 'true');
      const v = Math.round(suma);
      if (v !== ultimo) {
        ultimo = v;
        salida.textContent = v;
      }
    }

    function alScroll() {
      if (!pedido) { pedido = true; requestAnimationFrame(medir); }
    }

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll, { passive: true });
    medir();
  }

  /* ── Arranque ─────────────────────────────────────────────────────── */

  portada();
  resumen();
  renta();
  edades();
  listas();
  hospital();
  metodo();
  movimiento();
})();

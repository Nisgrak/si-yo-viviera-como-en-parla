/* ═══════════════════════════════════════════════════════════════════════
   SI YO VIVIERA COMO EN PARLA · render
   La única cuenta que hace esta web:
     equivalente = servicios(Parla) / base(Parla) × base(tu ciudad)
   donde `base` es la población total o el tramo de edad que corresponda.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const NOMBRE_REF = NOMBRE[REF];

  /* Por debajo de este umbral la diferencia es ruido, no una pérdida */
  const UMBRAL = 0.15;

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = function (s, r) { return (r || document).querySelector(s); };

  let AQUI = arranque();
  let calculados, perdidas, ganancias, empates, TOTAL;

  function arranque() {
    const h = (location.hash || '').replace('#', '');
    if (NOMBRE[h] && h !== REF) return h;
    try {
      const g = localStorage.getItem('municipio');
      if (NOMBRE[g] && g !== REF) return g;
    } catch (e) { /* navegador sin almacenamiento: seguimos */ }
    return 'getafe';
  }

  /* ── Formato ──────────────────────────────────────────────────────── */

  function entero(n) { return n.toLocaleString('es-ES'); }

  function num(n, dec) {
    if (dec === undefined) dec = Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1;
    return n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* "Una biblioteca pública por cada 32.206 habitantes" */
  const UNO = { f: 'Una', m: 'Un' };
  const uno = { f: 'una', m: 'uno' };
  const ninguno = { f: 'ninguna', m: 'ninguno' };

  function cadaCuantos(n, base) {
    return n > 0 ? entero(Math.round(base / n)) : null;
  }

  function enCristiano(c) {
    const g = c.ind.gen || 'm';
    const aqui = cadaCuantos(c.n, c.baseA);
    const ref = cadaCuantos(c.nRef, c.baseB);
    const quien = c.base.etiqueta;
    if (!aqui && !ref) return '';
    if (!ref) {
      return UNO[g] + ' ' + c.ind.sing + ' por cada ' + aqui + ' ' + quien + ' en ' +
        NOMBRE[AQUI] + '. En ' + NOMBRE_REF + ' no hay ' + ninguno[g] + '.';
    }
    if (!aqui) {
      return 'En ' + NOMBRE[AQUI] + ' no hay ' + ninguno[g] + '. ' + UNO[g] + ' ' +
        c.ind.sing + ' por cada ' + ref + ' ' + quien + ' en ' + NOMBRE_REF + '.';
    }
    return UNO[g] + ' ' + c.ind.sing + ' por cada ' + aqui + ' ' + quien + ' en ' +
      NOMBRE[AQUI] + '; ' + uno[g] + ' por cada ' + ref + ' en ' + NOMBRE_REF + '.';
  }

  function pieFuente(ids) {
    const vistas = {};
    const trozos = [];
    ids.forEach(function (id) {
      const f = D.fuentes[id];
      if (!f || vistas[id]) return;
      vistas[id] = 1;
      trozos.push((trozos.length === 0 ? 'Fuente: ' : 'Población de referencia: ') +
        '<a href="' + f.url + '" target="_blank" rel="noopener">' + f.t + '</a>');
    });
    return el('p', 'ind__fuente', trozos.join('. '));
  }


  /* ── Iconos ───────────────────────────────────────────────────────────
     Trazo de 1.7, rejilla de 24, currentColor. Dibujados a mano para que
     todos pesen lo mismo: ninguno más grueso ni más detallado que el resto. */

  const TRAZOS = {
    metro:
      '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14"/>' +
      '<path d="M9.5 21 11 17M14.5 21 13 17"/>' +
      '<circle cx="9.2" cy="13.5" r=".9"/><circle cx="14.8" cy="13.5" r=".9"/>',
    cercanias:
      '<rect x="4" y="4" width="16" height="10" rx="2.5"/><path d="M4 9h16"/>' +
      '<circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/>' +
      '<path d="M2.5 21h19"/>',
    tranvia:
      '<path d="M12 2v3"/><rect x="5.5" y="5" width="13" height="12" rx="2.5"/>' +
      '<path d="M5.5 11h13"/><path d="M8.5 21 10 17.5M15.5 21 14 17.5"/>',
    farmacia:
      '<path d="M9.6 3h4.8v6.6H21v4.8h-6.6V21H9.6v-6.6H3V9.6h6.6z"/>',
    biblioteca:
      '<path d="M12 6.8C10.4 5.2 7.9 4.6 4 4.6v12.8c3.9 0 6.4.6 8 2.2 1.6-1.6 4.1-2.2 8-2.2V4.6c-3.9 0-6.4.6-8 2.2z"/>' +
      '<path d="M12 6.8v12.8"/>',
    salud:
      '<path d="M3.6 10.4 12 3.4l8.4 7v9.1a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z"/>' +
      '<path d="M12 11v5.4M9.3 13.7h5.4"/>',
    hospital:
      '<path d="M4.5 21V6.4a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1V21"/><path d="M2.5 21h19"/>' +
      '<path d="M12 8.6v6M9 11.6h6"/>',
    bebe:
      '<circle cx="9.6" cy="9.6" r="5.1"/><path d="M13.3 13.3 19 19"/>' +
      '<path d="M17.4 17.4 21 21"/>',
    colegio:
      '<path d="M4 20.2 5 16 16.4 4.6a2.2 2.2 0 0 1 3 3L8 19z"/><path d="M14.4 6.6l3 3"/>',
    instituto:
      '<path d="M5 3.5v17h16z"/><path d="M8.5 17h3M8.5 13.6h1.6"/>',
    universidad:
      '<path d="M2.5 9 12 4.6 21.5 9 12 13.4z"/>' +
      '<path d="M6.4 11.2v4.9c0 1.5 2.5 2.7 5.6 2.7s5.6-1.2 5.6-2.7v-4.9"/>',
    musica:
      '<path d="M9.2 17.6V5.2l9.6-2v11.4"/><circle cx="6.7" cy="17.8" r="2.6"/>' +
      '<circle cx="16.3" cy="16.1" r="2.6"/>',
    cama:
      '<path d="M3 19.5V9"/><path d="M3 13h11.5a6.5 6.5 0 0 1 6.5 6.5"/>' +
      '<path d="M21 19.5v-1"/><circle cx="7.4" cy="9.6" r="2.3"/>'
  };

  const ICONO = {
    metro: 'metro', cercanias: 'cercanias', tranvia: 'tranvia',
    farmacias: 'farmacia', bibliotecas: 'biblioteca', 'centros-salud': 'salud',
    'escuelas-infantiles': 'bebe', colegios: 'colegio', institutos: 'instituto',
    universidad: 'universidad', conservatorio: 'musica', 'plazas-residencia': 'cama'
  };

  function icono(clave, cls) {
    const d = TRAZOS[clave];
    if (!d) return el('span', cls || 'ico');
    const w = el('span', cls || 'ico');
    w.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + d + '</svg>';
    return w;
  }

  /* ── Cálculo ──────────────────────────────────────────────────────── */

  function calcular() {
    calculados = D.indicadores.map(function (ind) {
      const a = ind.datos[AQUI];
      const b = ind.datos[REF];
      const base = D.BASES[ind.base || 'total'];
      const baseA = base.valores[AQUI];
      const baseB = base.valores[REF];
      const equivalente = (b.n / baseB) * baseA;
      const delta = a.n - equivalente;              /* > 0 se pierde */
      return {
        ind: ind, base: base, baseA: baseA, baseB: baseB,
        n: a.n, nRef: b.n, lista: a.lista,
        equivalente: equivalente, delta: delta,
        pct: a.n > 0 ? delta / a.n : 0,
        tasaA: (a.n / baseA) * base.por,
        tasaB: (b.n / baseB) * base.por
      };
    });

    perdidas = calculados
      .filter(function (c) { return c.delta > UMBRAL; })
      .sort(function (x, y) {
        const ax = x.ind.enTotal === false ? 1 : 0;
        const ay = y.ind.enTotal === false ? 1 : 0;
        return (ax - ay) || (y.pct - x.pct) || (y.delta - x.delta);
      });

    ganancias = calculados.filter(function (c) { return c.delta < -UMBRAL; })
      .sort(function (x, y) { return x.delta - y.delta; });
    empates = calculados.filter(function (c) { return Math.abs(c.delta) <= UMBRAL; });
    TOTAL = perdidas.filter(function (c) { return c.ind.enTotal !== false; })
      .reduce(function (s, c) { return s + c.delta; }, 0);
  }

  /* ── Piezas ───────────────────────────────────────────────────────── */

  function tira(total, delta, ganadas) {
    ganadas = ganadas || 0;
    const n = total + ganadas;
    const cont = el('div', 'tira' + (n > 70 ? ' tira--microscopica' : n > 24 ? ' tira--densa' : ''));
    cont.setAttribute('aria-hidden', 'true');
    const enteras = Math.floor(delta);
    const parcial = delta - enteras;
    const desde = total - enteras;
    const iParcial = parcial > 0.04 ? desde - 1 : -1;

    for (let i = 0; i < total; i++) {
      const u = el('span', 'u');
      if (delta > 0 && i >= desde) {
        u.classList.add('u--cae');
        u.style.setProperty('--retraso', Math.min(i - desde, 30) * 26 + 'ms');
      } else if (delta > 0 && i === iParcial) {
        u.classList.add('u--media');
        u.style.setProperty('--parte', ((1 - parcial) * 100).toFixed(1) + '%');
      }
      cont.appendChild(u);
    }
    for (let j = 0; j < ganadas; j++) cont.appendChild(el('span', 'u u--gana'));
    return cont;
  }

  function tasas(c, modo) {
    const max = Math.max(c.tasaA, c.tasaB) || 1;
    const cont = el('div', 'tasas');

    if (c.ind.base && c.ind.base !== 'total') {
      cont.appendChild(el('p', 'tasas__base',
        'Medido sobre la <b>' + c.base.corto + '</b>: ' +
        NOMBRE[AQUI] + ' ' + entero(c.baseA) + ' · ' + NOMBRE_REF + ' ' + entero(c.baseB)));
    }

    [{ id: AQUI, v: c.tasaA }, { id: REF, v: c.tasaB }].forEach(function (f) {
      const fila = el('div', 'tasa');
      fila.dataset.quien = f.id === REF ? 'referencia' : 'aqui';
      fila.appendChild(el('span', 'tasa__quien', NOMBRE[f.id]));
      const pista = el('span', 'tasa__pista');
      const barra = el('i');
      barra.style.setProperty('--v', (f.v / max).toFixed(4));
      pista.appendChild(barra);
      fila.appendChild(pista);
      fila.appendChild(el('span', 'tasa__valor', num(f.v, 2)));
      cont.appendChild(fila);
    });

    cont.appendChild(el('p', 'tasas__llano', enCristiano(c)));

    const unidad = num(c.tasaA, 2) + ' y ' + num(c.tasaB, 2) + ' por cada ' +
      entero(c.base.por) + ' ' + c.base.etiqueta;
    cont.appendChild(el('p', 'tasas__pie', modo === 'gana'
      ? unidad + ' · con la tasa de ' + NOMBRE_REF + ' habría ' + num(c.equivalente, 2) +
        ' en ' + NOMBRE[AQUI]
      : unidad + ' · con la tasa de ' + NOMBRE_REF + ' quedarían ' + num(c.equivalente, 2) +
        ' de ' + c.n));
    return cont;
  }

  function reparto(c) {
    const lista = c.lista || [];
    const total = lista.length;
    const enteras = Math.floor(c.delta);
    const parcial = c.delta - enteras;
    const desde = total - enteras;
    const iParcial = parcial > 0.04 ? desde - 1 : -1;
    return {
      caen: lista.slice(Math.max(desde, 0)),
      parcial: iParcial >= 0 ? { nombre: lista[iParcial], queda: (1 - parcial) * 100 } : null,
      sobreviven: lista.slice(0, Math.max(iParcial >= 0 ? iParcial : desde, 0))
    };
  }

  function filaNombre(nombre, cls, cola) {
    const li = el('li', 'nombre' + (cls ? ' ' + cls : ''));
    li.appendChild(el('span', 'nombre__m'));
    li.appendChild(el('span', 'nombre__t', nombre));
    li.appendChild(el('span', 'nombre__p', cola || ''));
    return li;
  }

  /* Lo que se pierde, siempre visible. Lo que aguanta, plegado. */
  function nombres(c) {
    if (!c.lista || !c.lista.length) return null;
    const cont = el('div', 'nombres-bloque');

    if (c.lista.length !== c.n) {
      cont.appendChild(el('p', 'nombres__rot', 'Dónde están'));
      const ul = el('ul', 'nombres');
      c.lista.forEach(function (n) { ul.appendChild(filaNombre(n)); });
      cont.appendChild(ul);
      return cont;
    }

    const r = reparto(c);
    if (r.caen.length || r.parcial) {
      const g = c.ind.gen || 'm';
      cont.appendChild(el('p', 'nombres__rot nombres__rot--cae',
        r.caen.length !== c.n ? 'Lo que desaparece'
        : c.n === 1 ? 'Desaparece' : 'Desaparecen tod' + (g === 'f' ? 'as' : 'os')));
      const ul = el('ul', 'nombres');
      r.caen.forEach(function (n) { ul.appendChild(filaNombre(n, 'nombre--cae', 'desaparece')); });
      if (r.parcial) {
        ul.appendChild(filaNombre(r.parcial.nombre, 'nombre--media',
          'se queda al ' + num(r.parcial.queda, 0) + ' %'));
      }
      cont.appendChild(ul);
    }
    if (r.sobreviven.length) {
      const det = el('details', 'plegable');
      det.appendChild(el('summary', null, 'Ver ' + (r.sobreviven.length === 1
        ? 'el que aguanta' : 'los ' + r.sobreviven.length + ' que aguantan')));
      const ul = el('ul', 'nombres');
      r.sobreviven.forEach(function (n) { ul.appendChild(filaNombre(n)); });
      det.appendChild(ul);
      cont.appendChild(det);
    }
    return cont;
  }

  function bloqueIndicador(c, modo) {
    const i = c.ind;
    const art = el('article', 'ind' + (modo === 'gana' ? ' ind--gana' : ''));
    art.id = 'ind-' + i.id;
    if (i.enTotal !== false) art.dataset.delta = c.delta.toFixed(4);

    const cab = el('p', 'ind__grupo');
    cab.appendChild(icono(ICONO[i.id], 'ind__ico'));
    cab.appendChild(el('span', null, i.grupo));
    art.appendChild(cab);
    art.appendChild(el('h3', 'ind__h', i.titulo));

    let titular;
    if (modo === 'gana') {
      titular = 'Ganarías <span class="cifra">' + num(-c.delta) + '</span> <span class="resto">' +
        (c.n === 0 ? 'donde ahora no hay nada' : 'más de las que hay ahora') + '</span>';
    } else if (c.nRef === 0) {
      const g = i.gen || 'm';
      const cola = c.n === 1
        ? 'de 1: ' + (g === 'f' ? 'la única' : 'el único') + ' que hay.'
        : 'de ' + c.n + '. Sin excepción.';
      titular = 'Perderías <span class="cifra">' + num(c.n) + '</span> <span class="resto">' +
        cola + '</span>';
    } else {
      titular = 'Perderías <span class="cifra">' + num(c.delta) + '</span> <span class="resto">de ' +
        c.n + '</span>';
    }
    art.appendChild(el('p', 'ind__titular', titular));

    const sr = el('p', 'oculto');
    sr.textContent = NOMBRE[AQUI] + ' tiene ' + c.n + ' y ' + NOMBRE_REF + ' tiene ' + c.nRef +
      '. Medido sobre la ' + c.base.corto + '. Con la tasa de ' + NOMBRE_REF + ', en ' +
      NOMBRE[AQUI] + ' quedarían ' + num(c.equivalente, 1) + '.';
    art.appendChild(sr);

    if (modo === 'gana') art.appendChild(tira(c.n, 0, Math.round(-c.delta)));
    else if (c.n > 0 && c.n <= 400) art.appendChild(tira(c.n, c.delta, 0));

    art.appendChild(tasas(c, modo));

    if (modo === 'gana') {
      const refLista = i.datos[REF].lista;
      if (refLista && refLista.length && refLista.length <= 10) {
        art.appendChild(el('p', 'ind__nota', 'En ' + NOMBRE_REF + ': ' + refLista.join(' · ') + '.'));
      }
    } else {
      const lista = nombres(c);
      if (lista) art.appendChild(lista);
    }

    if (i.nota) art.appendChild(el('p', 'ind__nota', i.nota));
    art.appendChild(pieFuente([i.fuenteId, c.base.fuenteId]));
    return art;
  }

  /* ── Portada ──────────────────────────────────────────────────────── */

  function portada() {
    $('#pob-a').textContent = entero(D.BASES.total.valores[AQUI]);
    $('#pob-b').textContent = entero(D.BASES.total.valores[REF]);

    const marcas = Math.round(TOTAL);
    const rejilla = $('#rejilla');
    vaciar(rejilla);
    rejilla.className = 'marcador__rejilla tira' + (marcas > 24 ? ' tira--densa' : '');
    for (let i = 0; i < marcas; i++) {
      const u = el('span', 'u u--cae');
      u.style.setProperty('--retraso', 300 + i * 30 + 'ms');
      rejilla.appendChild(u);
    }

    const marcador = document.querySelector('.marcador');
    marcador.classList.remove('visto');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { marcador.classList.add('visto'); });
    });

    const salida = $('#total-n');
    if (quieto) { salida.textContent = marcas; return; }
    const ini = performance.now();
    (function paso(t) {
      const p = Math.min(1, (t - ini) / 1400);
      salida.textContent = Math.round((1 - Math.pow(1 - p, 4)) * marcas);
      if (p < 1) requestAnimationFrame(paso);
      else salida.textContent = marcas;
    })(ini);
  }

  /* ── El recuento ──────────────────────────────────────────────────── */


  /* Un ejemplo con números reales explica la cuenta mejor que un párrafo */
  function comoSeLee() {
    const caja = $('#como-se-lee');
    vaciar(caja);
    let c = null;
    for (let i = 0; i < perdidas.length; i++) {
      if (perdidas[i].ind.id === 'bibliotecas') { c = perdidas[i]; break; }
    }
    if (!c) c = perdidas.filter(function (x) { return x.nRef > 0 && x.n > 1; })[0];
    if (!c) { caja.hidden = true; return; }
    caja.hidden = false;

    caja.appendChild(el('p', 'lee__rot', 'Un ejemplo'));
    caja.appendChild(el('p', 'lee__txt',
      NOMBRE_REF + ' tiene <b>' + c.nRef + '</b> ' + c.ind.titulo.toLowerCase() + ' para ' +
      entero(c.baseB) + ' ' + c.base.etiqueta + '. A ese ritmo, a ' + NOMBRE[AQUI] +
      ' le tocarían <b>' + num(c.equivalente, 1) + '</b>. Tiene <b>' + c.n +
      '</b>, así que abajo aparece <b class="lee__dif">−' + num(c.delta) + '</b>.'));
  }

  function filaRecuento(c, modo) {
    const i = c.ind;
    const li = el('li', 'rec' + (modo ? ' rec--' + modo : ''));
    const a = el('a', 'rec__a');
    a.href = '#ind-' + i.id;
    a.appendChild(icono(ICONO[i.id], 'rec__ico'));
    a.appendChild(el('span', 'rec__q', i.titulo));
    a.appendChild(el('span', 'rec__n',
      (modo === 'gana' ? '+' : '−') + num(Math.abs(c.delta))));
    li.appendChild(a);
    return li;
  }

  function resumen() {
    comoSeLee();
    const cont = $('#recuento');
    vaciar(cont);

    /* Agrupado por área, con su subtotal: un recuento se lee por bloques,
       no como una lista de doce cosas seguidas. */
    const areas = [];
    const porArea = {};
    perdidas.forEach(function (c) {
      if (c.ind.enTotal === false) return;   /* estos van al final, aparte */
      const k = c.ind.grupo;
      if (!porArea[k]) { porArea[k] = []; areas.push(k); }
      porArea[k].push(c);
    });

    areas.sort(function (x, y) { return suma(porArea[y]) - suma(porArea[x]); });

    function suma(lista) {
      return lista.reduce(function (t, c) {
        return t + (c.ind.enTotal === false ? 0 : c.delta);
      }, 0);
    }

    areas.forEach(function (k) {
      const lista = porArea[k];
      const t = suma(lista);
      const bloque = el('div', 'area');
      const cab = el('div', 'area__cab');
      cab.appendChild(el('h3', 'area__q', k));
      cab.appendChild(el('span', 'area__n', '−' + num(t)));
      bloque.appendChild(cab);
      const ul = el('ul', 'area__filas');
      lista.forEach(function (c) { ul.appendChild(filaRecuento(c, null)); });
      bloque.appendChild(ul);
      cont.appendChild(bloque);
    });

    /* El hospital y, si toca, lo que sale ganando */
    const h = D.hospitales[AQUI];
    const hr = D.hospitales[REF];
    const extra = [];
    perdidas.forEach(function (c) {
      if (c.ind.enTotal !== false) return;
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo, n: '−' + num(c.delta),
        modo: 'aparte', href: '#ind-' + c.ind.id });
    });
    if (h.unidades > 0 && h.faltanEnReferencia.length) {
      extra.push({ ico: 'hospital', q: 'Unidades del hospital público',
        n: '−' + h.faltanEnReferencia.length, modo: 'aparte' });
    } else if (h.unidades === 0) {
      extra.push({ ico: 'hospital', q: 'Unidades de hospital público',
        n: '+' + hr.unidades, modo: 'gana' });
    }
    ganancias.forEach(function (c) {
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo,
        n: '+' + num(-c.delta), modo: 'gana', href: '#ind-' + c.ind.id });
    });

    if (extra.length) {
      const bloque = el('div', 'area area--extra');
      const cab = el('div', 'area__cab');
      cab.appendChild(el('h3', 'area__q', 'Fuera del recuento'));
      bloque.appendChild(cab);
      const ul = el('ul', 'area__filas');
      extra.forEach(function (x) {
        const li = el('li', 'rec rec--' + x.modo);
        const a = el('a', 'rec__a');
        a.href = x.href || '#hospital';
        a.appendChild(icono(x.ico, 'rec__ico'));
        a.appendChild(el('span', 'rec__q', x.q));
        a.appendChild(el('span', 'rec__n', x.n));
        li.appendChild(a);
        ul.appendChild(li);
      });
      bloque.appendChild(ul);
      cont.appendChild(bloque);
    }

    $('#resumen-n').textContent = Math.round(TOTAL);
  }

  /* ── El punto de partida ──────────────────────────────────────────── */

  function renta() {
    const r = D.contexto.renta;
    const cont = $('#renta');
    vaciar(cont);
    const max = Math.max(r.mediaRegional, r.valores[AQUI], r.valores[REF]);

    [{ nombre: 'Comunidad de Madrid', v: r.mediaRegional, tipo: 'ref' },
     { nombre: NOMBRE[AQUI], v: r.valores[AQUI], tipo: 'aqui' },
     { nombre: NOMBRE_REF, v: r.valores[REF], tipo: 'referencia' }]
    .forEach(function (f) {
      const fila = el('div', 'renta__fila');
      fila.dataset.destacar = f.tipo;
      fila.appendChild(el('p', 'renta__quien', f.nombre));
      fila.appendChild(el('p', 'renta__cuanto', entero(f.v) + ' €'));
      const barra = el('div', 'renta__barra');
      const i = el('i');
      i.style.width = ((f.v / max) * 100).toFixed(1) + '%';
      barra.appendChild(i);
      fila.appendChild(barra);
      fila.appendChild(el('p', 'renta__pct', f.tipo === 'ref'
        ? 'referencia regional'
        : num((f.v / r.mediaRegional) * 100, 1) + ' % de la media regional'));
      cont.appendChild(fila);
    });

    cont.appendChild(el('p', 'renta__nota', r.nota));
    cont.appendChild(pieFuente([r.fuenteId]));
  }

  function edades() {
    const e = D.contexto.edades;
    const cont = $('#edades');
    vaciar(cont);
    const refPct = (e.total[REF] / e.total[AQUI]) * 100;

    cont.appendChild(el('p', 'edades__ley',
      'Cuánto se desvía cada tramo de edad del tamaño que ' + NOMBRE_REF + ' tiene respecto a ' +
      NOMBRE[AQUI] + ' contando a todo el mundo'));

    const filas = e.tramos.map(function (t) {
      const pct = (t.valores[REF] / t.valores[AQUI]) * 100;
      return { etiqueta: t.etiqueta, pct: pct, dev: pct - refPct };
    });
    /* La escala es la desviación máxima: así el gráfico funciona igual en ciudades
       más grandes y más pequeñas que la de referencia. */
    let tope = 0;
    filas.forEach(function (f) { tope = Math.max(tope, Math.abs(f.dev)); });
    tope = tope * 1.12 || 1;

    const graf = el('div', 'edades__grafico');
    filas.forEach(function (f) {
      const fila = el('div', 'edad' + (f.dev >= 0 ? ' edad--mas' : ' edad--menos'));
      fila.appendChild(el('span', 'edad__q', f.etiqueta));
      const pista = el('span', 'edad__pista');
      const barra = el('i');
      barra.style.setProperty('--w', (Math.abs(f.dev) / tope * 50).toFixed(2) + '%');
      pista.appendChild(barra);
      fila.appendChild(pista);
      fila.appendChild(el('span', 'edad__v', num(f.pct, 0) + ' %'));
      const sr = el('span', 'oculto');
      sr.textContent = NOMBRE_REF + ' tiene en este tramo el ' + num(f.pct, 0) +
        ' % de la población de ' + NOMBRE[AQUI] + ', ' + num(Math.abs(f.dev), 0) +
        ' puntos ' + (f.dev >= 0 ? 'por encima' : 'por debajo') + ' de su tamaño general.';
      fila.appendChild(sr);
      graf.appendChild(fila);
    });
    cont.appendChild(graf);

    const base = el('div', 'edades__base');
    base.appendChild(el('span', 'edades__base-q', 'Todas las edades'));
    base.appendChild(el('span', 'edades__base-v', num(refPct, 0) + ' %'));
    cont.appendChild(base);

    cont.appendChild(el('p', 'edades__marca',
      'Contando a todo el mundo, ' + NOMBRE_REF + ' es el ' + num(refPct, 0) + ' % de ' +
      NOMBRE[AQUI] + ': esa es la línea del centro. Las barras hacia la derecha son tramos de ' +
      'edad en los que ' + NOMBRE_REF + ' pesa más de lo que le tocaría por tamaño; hacia la ' +
      'izquierda, menos.'));
    cont.appendChild(el('p', 'renta__nota', e.nota));
    cont.appendChild(pieFuente([e.fuenteId]));
  }

  /* ── Listas ───────────────────────────────────────────────────────── */

  function listas() {
    const lp = $('#lista-perdidas');
    vaciar(lp);
    const env = el('div', 'env');
    perdidas.forEach(function (c) { env.appendChild(bloqueIndicador(c, 'pierde')); });
    if (empates.length) {
      const art = el('article', 'ind');
      art.appendChild(el('p', 'ind__grupo', 'Empate técnico'));
      art.appendChild(el('h3', 'ind__h', 'Y en esto las dos ciudades están igual'));
      const ul = el('ul', 'pendientes');
      empates.forEach(function (c) {
        ul.appendChild(el('li', null, c.ind.titulo + ' — ' + NOMBRE[AQUI] + ' ' + c.n + ', ' +
          NOMBRE_REF + ' ' + c.nRef + ' (diferencia: ' + num(Math.abs(c.delta), 2) + ')'));
      });
      art.appendChild(ul);
      env.appendChild(art);
    }
    lp.appendChild(env);

    const lg = $('#lista-ganancias');
    vaciar(lg);
    const env2 = el('div', 'env');
    if (!ganancias.length) {
      env2.appendChild(el('p', 'bloque__intro',
        'Ninguno. De todos los servicios medidos, no hay uno solo en el que ' + NOMBRE_REF +
        ' esté por encima de ' + NOMBRE[AQUI] + '.'));
    }
    ganancias.forEach(function (c) { env2.appendChild(bloqueIndicador(c, 'gana')); });
    lg.appendChild(env2);
  }

  /* ── El hospital ──────────────────────────────────────────────────── */

  function hospital() {
    const h = D.hospitales[AQUI];
    const hr = D.hospitales[REF];
    const cont = $('#hospital-cuerpo');
    vaciar(cont);

    if (h.unidades === 0) {
      cont.appendChild(el('p', 'bloque__intro',
        NOMBRE[AQUI] + ' no tiene hospital. ' + NOMBRE_REF + ' sí: el ' + hr.nombre + ', con ' +
        hr.unidades + ' unidades asistenciales declaradas. Así que en sanidad hospitalaria ' +
        NOMBRE[AQUI] + ' queda por debajo de ' + NOMBRE_REF + '.'));
      cont.appendChild(el('p', 'hospital__golpe hospital__golpe--gana',
        'Estas <b>' + hr.faltanAqui.length + '</b> unidades existen en ' + NOMBRE_REF + ' y no en ' +
        NOMBRE[AQUI] + ', porque aquí no hay hospital donde ponerlas:'));
      const ul = el('ul', 'unidades unidades--gana');
      hr.faltanAqui.forEach(function (u, i) {
        ul.appendChild(el('li', 'unidad' + (i < 4 ? ' unidad--grave' : ''), u));
      });
      cont.appendChild(ul);
      cont.appendChild(el('p', 'cautela', D.cautelaHospital));
      cont.appendChild(pieFuente(['sanitarios']));
      return;
    }

    cont.appendChild(el('p', 'bloque__intro',
      'Cada ciudad tiene su hospital, así que contarlos por habitante no dice nada. Lo que se ' +
      'compara aquí es su cartera de servicios. El Registro de Centros Sanitarios de la Comunidad ' +
      'de Madrid declara <b>' +
      h.unidades + '</b> unidades asistenciales en el ' + h.nombre + ' y <b>' + hr.unidades +
      '</b> en el ' + hr.nombre + '.'));

    if (h.faltanEnReferencia.length) {
      cont.appendChild(el('p', 'hospital__golpe',
        'Estas <b>' + h.faltanEnReferencia.length + '</b> se quedan fuera en ' + NOMBRE_REF + ':'));
      const ul = el('ul', 'unidades');
      h.faltanEnReferencia.forEach(function (u, i) {
        ul.appendChild(el('li', 'unidad' + (i < 4 ? ' unidad--grave' : ''), u));
      });
      cont.appendChild(ul);
    }

    if (h.faltanAqui.length) {
      cont.appendChild(el('p', 'hospital__golpe hospital__golpe--gana',
        'Y al revés: estas <b>' + h.faltanAqui.length + '</b> las tiene ' + NOMBRE_REF + ' y no ' +
        NOMBRE[AQUI] + '.'));
      const ul = el('ul', 'unidades unidades--gana');
      h.faltanAqui.forEach(function (u) { ul.appendChild(el('li', 'unidad', u)); });
      cont.appendChild(ul);
    } else {
      cont.appendChild(el('p', 'hospital__golpe hospital__golpe--gana',
        'Al revés no hay ninguna. La cartera de ' + NOMBRE_REF + ' cabe entera dentro de la de ' +
        NOMBRE[AQUI] + '.'));
    }

    cont.appendChild(el('p', 'cautela', D.cautelaHospital));
    cont.appendChild(pieFuente(['sanitarios']));
  }

  /* ── Método ───────────────────────────────────────────────────────── */

  function metodo() {
    const tb = $('#tabla-bases');
    vaciar(tb);
    D.indicadores.forEach(function (i) {
      if (!i.base || i.base === 'total') return;
      tb.appendChild(el('li', null, i.titulo + ' → ' + D.BASES[i.base].corto));
    });
    tb.appendChild(el('li', null, 'Todo lo demás → población total'));

    const p = $('#pendientes');
    vaciar(p);
    D.pendientes.forEach(function (t) { p.appendChild(el('li', null, t)); });

    const f = $('#fuentes');
    vaciar(f);
    Object.keys(D.fuentes).forEach(function (k) {
      const s = D.fuentes[k];
      f.appendChild(el('li', null,
        '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.t + '</a>'));
    });

    $('#actualizado').textContent = D.ACTUALIZADO;
    $('#pob-metodo').textContent =
      NOMBRE[AQUI] + ' ' + entero(D.BASES.total.valores[AQUI]) + ' habitantes, ' +
      NOMBRE_REF + ' ' + entero(D.BASES.total.valores[REF]);
    Array.prototype.forEach.call(document.querySelectorAll('[data-aqui]'), function (n) {
      n.textContent = NOMBRE[AQUI];
    });
  }

  /* ── Movimiento ───────────────────────────────────────────────────── */

  let obs = null;

  function movimiento() {
    if (obs) obs.disconnect();
    const bloques = Array.prototype.slice.call(document.querySelectorAll('.ind'));
    if ('IntersectionObserver' in window) {
      obs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      bloques.forEach(function (b) { obs.observe(b); });
    } else {
      bloques.forEach(function (b) { b.classList.add('visto'); });
    }
  }

  function contador() {
    const chip = $('#contador');
    const salida = $('#contador-n');
    const finZona = $('#hospital');
    let pedido = false, ultimo = -1;

    function medir() {
      pedido = false;
      const corte = window.innerHeight * 0.55;
      let suma = 0;
      const nodos = document.querySelectorAll('#lista-perdidas .ind[data-delta]');
      for (let i = 0; i < nodos.length; i++) {
        if (nodos[i].getBoundingClientRect().top < corte) suma += parseFloat(nodos[i].dataset.delta);
      }
      const visible = suma >= 1 && finZona.getBoundingClientRect().top > 120;
      chip.dataset.visible = visible ? '1' : '0';
      chip.setAttribute('aria-hidden', visible ? 'false' : 'true');
      const v = Math.round(suma);
      if (v !== ultimo) { ultimo = v; salida.textContent = v; }
    }
    function alScroll() { if (!pedido) { pedido = true; requestAnimationFrame(medir); } }

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll, { passive: true });
    medir();
  }

  /* ── Selector ─────────────────────────────────────────────────────── */

  function selector() {
    const sel = $('#sel-municipio');
    vaciar(sel);
    D.MUNICIPIOS.filter(function (m) { return m.id !== REF; }).forEach(function (m) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.nombre;
      o.selected = m.id === AQUI;
      sel.appendChild(o);
    });
    $('#sel-texto').textContent = NOMBRE[AQUI];

    sel.addEventListener('change', function () {
      AQUI = sel.value;
      try { localStorage.setItem('municipio', AQUI); } catch (e) { /* sin almacenamiento */ }
      if (history.replaceState) history.replaceState(null, '', '#' + AQUI);
      else location.hash = AQUI;
      $('#sel-texto').textContent = NOMBRE[AQUI];
      pintar();
    });

    window.addEventListener('hashchange', function () {
      const h = (location.hash || '').replace('#', '');
      if (NOMBRE[h] && h !== REF && h !== AQUI) {
        sel.value = h;
        sel.dispatchEvent(new Event('change'));
      }
    });
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  function pintar() {
    calcular();
    portada();
    resumen();
    renta();
    edades();
    listas();
    hospital();
    metodo();
    movimiento();
    document.title = 'Si yo viviera como en Parla · ' + NOMBRE[AQUI];
  }

  selector();
  pintar();
  contador();
})();

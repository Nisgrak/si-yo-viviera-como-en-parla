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
  let calculados, perdidas, ganancias, empates, TOTAL, GANADO;

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

  /* useGrouping explícito: el formato es-ES por defecto deja los cuatro
     dígitos sin punto («1345») y aquí conviven cifras de tres y de seis. */
  function entero(n) { return n.toLocaleString('es-ES', { useGrouping: true }); }

  function num(n, dec) {
    if (dec === undefined) dec = Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1;
    return n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  /* Dos decimales sobre 281 es ruido; sobre 1,45 es información. */
  function numTasa(v) {
    return num(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
  }

  /* Una superficie, en la unidad que se lea: kilómetros cuadrados, hectáreas o
     metros, según el tamaño. `redonda` quita los decimales, para el cartel. */
  function enSuperficie(m2, redonda) {
    if (m2 >= 1000000) return num(m2 / 1000000, redonda ? 1 : 2) + ' km²';
    if (m2 >= 10000) return num(m2 / 10000, redonda ? 0 : 1) + ' ha';
    return entero(Math.round(m2)) + ' m²';
  }

  /* Casi todos los indicadores cuentan cosas; el verde mide superficie. Estas
     dos funciones son el único sitio donde eso importa al escribir la cifra. */
  function esSuperficie(c) { return c.ind.medida === 'superficie'; }
  function cantidad(c, v, dec) { return esSuperficie(c) ? enSuperficie(v) : num(v, dec); }

  /* Por debajo del umbral es empate. En superficie, 0,15 m² no significa nada:
     el umbral es un 2 % de lo que hay. */
  function umbral(c) { return esSuperficie(c) ? c.n * 0.02 : UMBRAL; }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* Los textos dicen "de los {N} municipios": el número lo pone el propio
     listado, así que añadir una ciudad no deja ninguna frase desfasada. */
  const CIFRA_LETRA = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  function letra(n) { return CIFRA_LETRA[n] || String(n); }
  /* Además de {N}, una nota puede llevar {aqui}, {ref} o cualquier clave de
     `vars`, que se rellena con la ciudad elegida. */
  function texto(t, vars) {
    const v = Object.assign({ aqui: NOMBRE[AQUI], ref: NOMBRE_REF }, vars || {});
    return (t || '').replace(/\{N\}/g, letra(D.MUNICIPIOS.length))
      .replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; });
  }

  /* "Una biblioteca pública por cada 32.206 habitantes" */
  const UNO = { f: 'Una', m: 'Un' };
  const uno = { f: 'una', m: 'uno' };
  const ninguno = { f: 'ninguna', m: 'ninguno' };

  function cadaCuantos(n, base) {
    return n > 0 ? entero(Math.round(base / n)) : null;
  }

  function enCristiano(c) {
    if (esSuperficie(c)) {
      return num(c.tasaA, 1) + ' m² por habitante en ' + NOMBRE[AQUI] + '; ' +
        num(c.tasaB, 1) + ' en ' + NOMBRE_REF + '.';
    }
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

  /* Cada id puede ir suelto o como [id, rótulo] cuando el rótulo es otro. */
  function pieFuente(ids, despues) {
    const vistas = {};
    const trozos = [];
    ids.forEach(function (x) {
      const id = Array.isArray(x) ? x[0] : x;
      const f = D.fuentes[id];
      if (!f || vistas[id]) return;
      vistas[id] = 1;
      const rot = Array.isArray(x) ? x[1]
        : trozos.length === 0 ? 'Fuente: ' : (despues || 'Población de referencia: ');
      trozos.push(rot + '<a href="' + f.url + '" target="_blank" rel="noopener">' + f.t + '</a>');
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
      '<path d="M21 19.5v-1"/><circle cx="7.4" cy="9.6" r="2.3"/>',
    paleta:
      '<path d="M12 3.3c-5 0-8.9 3.6-8.9 8.2 0 4.6 4 8.2 8.9 8.2 1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2' +
      '-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 2-1.8h1.5c3 0 5.5-2.4 5.5-5.3 0-3.9-4.2-7.1-10-7.1z"/>' +
      '<circle cx="7.5" cy="10.6" r="1.1"/><circle cx="11" cy="7.5" r="1.1"/>' +
      '<circle cx="15.5" cy="8.4" r="1.1"/>',
    descarga:
      '<path d="M12 3.4v11.2"/><path d="M7.6 10.4 12 14.8l4.4-4.4"/>' +
      '<path d="M4.2 16.6v2.6a1.4 1.4 0 0 0 1.4 1.4h12.8a1.4 1.4 0 0 0 1.4-1.4v-2.6"/>',
    /* La unidad tachada, con las proporciones de la tira de la portada: borde
       del 10 % del lado y raya gruesa de puntas planas. La raya se recorta
       contra el cuadrado —como hace la web con su caja— para que las puntas
       queden cortadas en las esquinas en vez de asomar por fuera. */
    unidad:
      '<defs><clipPath id="clip-unidad">' +
      '<rect x="1.45" y="1.45" width="21.1" height="21.1" rx="3.85"/></clipPath></defs>' +
      '<rect x="2.4" y="2.4" width="19.2" height="19.2" rx="2.9" stroke-width="1.9"/>' +
      '<path d="M1.2 22.8 22.8 1.2" stroke-width="4.88" stroke-linecap="butt" ' +
      'clip-path="url(#clip-unidad)"/>',
    hacienda:
      '<path d="M6 3.2h7.4L19 8.8V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1z"/>' +
      '<path d="M13.2 3.4v5.5h5.5"/>' +
      '<path d="M14.6 13.2a2.9 2.9 0 1 0 0 4.4"/><path d="M8.4 14.3h4.2M8.4 16.2h4.2"/>',
    ventanilla:
      '<path d="M2.4 9.8 12 4.1l9.6 5.7"/>' +
      '<path d="M5.4 9.8v8M9.8 9.8v8M14.2 9.8v8M18.6 9.8v8"/>' +
      '<path d="M3.2 17.8h17.6"/><path d="M1.8 21h20.4"/>',
    residencia:
      '<path d="M3.6 10.4 12 3.4l8.4 7v9.1a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z"/>' +
      '<path d="M12 18.3c-.6-.5-3.1-2.1-3.1-4a1.85 1.85 0 0 1 3.1-1.35 1.85 1.85 0 0 1 3.1 1.35' +
      'c0 1.9-2.5 3.5-3.1 4z"/>',
    /* Una moneda con el euro. */
    euro:
      '<circle cx="12" cy="12" r="8.6"/>' +
      '<path d="M15.2 8.9a4.2 4.2 0 1 0 0 6.2"/><path d="M7.6 11h5.6M7.6 13.2h5.6"/>',
    /* Un pino: copa, tronco y suelo. */
    arbol:
      '<path d="M12 3.4 5.6 12.8h12.8z"/>' +
      '<path d="M12 12.8v7.6"/>' +
      '<path d="M6.4 20.4h11.2"/>'
  };

  const ICONO = {
    metro: 'metro', cercanias: 'cercanias',
    farmacias: 'farmacia', bibliotecas: 'biblioteca', 'centros-salud': 'salud',
    'escuelas-infantiles': 'bebe', colegios: 'colegio', institutos: 'instituto',
    universidad: 'universidad', conservatorio: 'musica',
    'plazas-residencia': 'residencia', camas: 'cama', artes: 'paleta',
    hacienda: 'hacienda', 'seguridad-social': 'ventanilla',
    'zonas-verdes': 'arbol', hospital: 'hospital'
  };

  /* No hay un icono por área, así que el cartel general toma prestado el del
     equipamiento que mejor la representa. */
  const ICONO_AREA = {
    'Educación': 'universidad',
    'Sanidad': 'salud',
    'Transporte': 'metro',
    'Administración': 'ventanilla',
    'Servicios sociales': 'residencia',
    'Cultura': 'biblioteca',
    'Medio ambiente': 'arbol'
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
      /* La superficie se lee por habitante, no por cada 100.000. */
      const por = ind.medida === 'superficie' ? 1 : base.por;
      return {
        ind: ind, base: base, baseA: baseA, baseB: baseB,
        n: a.n, nRef: b.n, lista: a.lista,
        equivalente: equivalente, delta: delta,
        pct: a.n > 0 ? delta / a.n : 0,
        por: por,
        tasaA: (a.n / baseA) * por,
        tasaB: (b.n / baseB) * por
      };
    });

    perdidas = calculados
      .filter(function (c) { return c.delta > umbral(c); })
      .sort(function (x, y) {
        const ax = x.ind.enTotal === false ? 1 : 0;
        const ay = y.ind.enTotal === false ? 1 : 0;
        return (ax - ay) || (y.pct - x.pct) || (y.delta - x.delta);
      });

    ganancias = calculados.filter(function (c) { return c.delta < -umbral(c); })
      .sort(function (x, y) { return x.delta - y.delta; });
    empates = calculados.filter(function (c) { return Math.abs(c.delta) <= umbral(c); });
    /* La cartera del hospital entra en las listas como una ficha más. */
    const k = cartera();
    if (k.delta > 0) perdidas.push(k);
    else if (k.delta < 0) ganancias.push(k);
    /* Las ganancias, como las pérdidas: primero lo que suma y, detrás, lo que
       no, junto a lo de su misma área. */
    ganancias.sort(function (x, y) {
      const ax = x.ind.enTotal === false ? 1 : 0;
      const ay = y.ind.enTotal === false ? 1 : 0;
      return (ax - ay) || (ax ? x.ind.grupo.localeCompare(y.ind.grupo, 'es') : 0) ||
        (x.delta - y.delta);
    });

    TOTAL = perdidas.filter(function (c) { return c.ind.enTotal !== false; })
      .reduce(function (s, c) { return s + c.delta; }, 0);
    /* Lo que se gana, en las mismas unidades que el total. No se le resta: la
       portada da lo que se pierde, y esto va al lado para que no se esconda. */
    GANADO = -sumaDelta(ganancias);
  }

  /* Las ganancias que cuentan como equipamientos, las mismas que suma GANADO. */
  function gananciasEnTotal() {
    return ganancias.filter(function (c) { return c.ind.enTotal !== false; });
  }

  /* La cartera del hospital va como una ficha de Sanidad, pero no sale de la
     tasa por habitante: un hospital no se reparte. Se compara qué unidades
     asistenciales declara uno y no el otro. Tiene la forma de un cálculo para
     que la recorran las mismas listas, el recuento y el cartel. */
  const CARTERA = {
    id: 'hospital', medida: 'cartera', enTotal: false, gen: 'f',
    grupo: 'Sanidad', titulo: 'Servicios del hospital público',
    mide: 'unidades asistenciales', fuenteId: 'sanitarios',
    nota: 'Un hospital no se reparte por habitante, así que aquí se comparan las unidades ' +
      'asistenciales que el Registro de Centros Sanitarios de la Comunidad de Madrid declara en ' +
      'cada uno. Algunas diferencias menores pueden deberse a cómo declara cada centro su cartera.'
  };

  function cartera() {
    const h = D.hospitales[AQUI];
    const caen = h.faltanEnReferencia;
    const nuevas = h.faltanAqui;
    const delta = caen.length ? caen.length : -nuevas.length;
    return {
      ind: CARTERA, n: h.unidades, nRef: D.hospitales[REF].unidades,
      lista: caen, nuevas: nuevas, delta: delta,
      pct: h.unidades > 0 ? delta / h.unidades : 0
    };
  }
  function esCartera(c) { return c.ind.medida === 'cartera'; }

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

    /* Las dos barras son dos números sueltos si no se dice de qué. El titular
       del bloque ya dice qué se cuenta, así que aquí basta el divisor. */
    cont.appendChild(el('p', 'tasas__ley', esSuperficie(c)
      ? 'Metros cuadrados por habitante'
      : 'Por cada ' + entero(c.por) + ' ' + c.base.etiqueta));

    if (c.ind.base && c.ind.base !== 'total') {
      cont.appendChild(el('p', 'tasas__base',
        'En ese tramo: ' + NOMBRE[AQUI] + ' <b>' + entero(c.baseA) + '</b>, ' +
        NOMBRE_REF + ' <b>' + entero(c.baseB) + '</b>.'));
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
      fila.appendChild(el('span', 'tasa__valor', esSuperficie(c) ? num(f.v, 1) : numTasa(f.v)));
      cont.appendChild(fila);
    });

    cont.appendChild(el('p', 'tasas__llano', enCristiano(c)));

    const eq = esSuperficie(c) ? enSuperficie(c.equivalente) : numTasa(c.equivalente);
    const hay = esSuperficie(c) ? enSuperficie(c.n) : c.n;
    cont.appendChild(el('p', 'tasas__pie', modo === 'gana'
      ? 'Con la tasa de ' + NOMBRE_REF + ' habría ' + eq + ' en ' + NOMBRE[AQUI]
      : 'Con la tasa de ' + NOMBRE_REF + ' quedarían ' + eq + ' de ' + hay));
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

    if (esCartera(c)) return fichaCartera(art, c, modo);

    let titular;
    if (esSuperficie(c)) {
      /* Una superficie no tiene «la única que hay»: siempre es tanto de tanto. */
      titular = (modo === 'gana' ? 'Ganarías' : 'Perderías') + ' <span class="cifra">' +
        enSuperficie(Math.abs(c.delta)) + '</span> <span class="resto">' +
        (modo === 'gana' ? 'más de las que hay ahora' : 'de ' + enSuperficie(c.n)) + '</span>';
    } else if (modo === 'gana') {
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
    sr.textContent = NOMBRE[AQUI] + ' tiene ' + cantidad(c, c.n) + ' y ' + NOMBRE_REF +
      ' tiene ' + cantidad(c, c.nRef) + '. Medido sobre la ' + c.base.corto + '. Con la tasa de ' +
      NOMBRE_REF + ', en ' + NOMBRE[AQUI] + ' quedarían ' + cantidad(c, c.equivalente, 1) + '.';
    art.appendChild(sr);

    /* La tira es un cuadrado por unidad: no hay tira de metros cuadrados. */
    if (esSuperficie(c)) { /* sin tira */ }
    else if (modo === 'gana') art.appendChild(tira(c.n, 0, Math.round(-c.delta)));
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

    if (i.nota) art.appendChild(el('p', 'ind__nota', texto(i.nota)));
    art.appendChild(pieFuente([i.fuenteId, c.base.fuenteId].concat(
      i.limitesFuenteId ? [[i.limitesFuenteId, 'Límites municipales: ']] : [])));
    art.appendChild(botonCartel(c, modo));
    return art;
  }

  /* El cuerpo de la ficha del hospital: la tira con una unidad por servicio,
     lo que desaparece tachado y, si lo hay, lo que se ganaría. Sin barras de
     tasa, porque aquí no hay tasa. */
  function fichaCartera(art, c, modo) {
    const i = c.ind;
    const ref = D.hospitales[REF];
    let titular;
    if (modo === 'gana') {
      titular = 'Ganarías <span class="cifra">' + c.nuevas.length + '</span> <span class="resto">' +
        (c.n === 0 ? 'donde ahora no hay hospital' : 'más de las que hay ahora') + '</span>';
    } else {
      titular = 'Perderías <span class="cifra">' + c.lista.length + '</span> <span class="resto">de ' +
        c.n + '</span>';
    }
    art.appendChild(el('p', 'ind__titular', titular));

    /* Por ciudad y no por hospital: Móstoles tiene dos y se suman sus carteras. */
    const cuenta = c.n
      ? 'Unidades asistenciales declaradas: ' + c.n + ' en ' + NOMBRE[AQUI] + ', ' + c.nRef +
        ' en ' + NOMBRE_REF + '.'
      : NOMBRE[AQUI] + ' no tiene hospital público. En ' + NOMBRE_REF + ', el ' + ref.nombre +
        ' declara ' + c.nRef + ' unidades asistenciales.';
    const sr = el('p', 'oculto');
    sr.textContent = cuenta + ' ' + c.lista.length + ' no están en ' + NOMBRE_REF + ' y ' +
      c.nuevas.length + ' están solo en ' + NOMBRE_REF + '.';
    art.appendChild(sr);

    art.appendChild(tira(c.n, c.lista.length, c.nuevas.length));
    art.appendChild(el('p', 'ind__nota', cuenta));

    const cont = el('div', 'nombres-bloque');
    if (c.lista.length) {
      cont.appendChild(el('p', 'nombres__rot nombres__rot--cae', 'Lo que desaparece'));
      const ul = el('ul', 'nombres');
      c.lista.forEach(function (n) { ul.appendChild(filaNombre(n, 'nombre--cae', 'desaparece')); });
      cont.appendChild(ul);
    }
    if (c.nuevas.length) {
      cont.appendChild(el('p', 'nombres__rot',
        c.lista.length ? 'Y al revés, lo que ganarías' : 'Lo que tendrías'));
      const ul = el('ul', 'nombres');
      c.nuevas.forEach(function (n) { ul.appendChild(filaNombre(n, 'nombre--gana')); });
      cont.appendChild(ul);
    }
    art.appendChild(cont);

    art.appendChild(el('p', 'ind__nota', texto(i.nota)));
    art.appendChild(pieFuente([i.fuenteId]));
    art.appendChild(botonCartel(c, modo));
    return art;
  }

  /* ── Portada ──────────────────────────────────────────────────────── */

  function portada() {
    $('#pob-a').textContent = entero(D.BASES.total.valores[AQUI]);
    $('#pob-b').textContent = entero(D.BASES.total.valores[REF]);

    const hueco = $('#portada-cartel');
    vaciar(hueco);
    hueco.appendChild(botonCartelGeneral());

    /* "Y ganarías 3, en educación." Las áreas, y no los servicios uno a uno,
       porque en la portada no cabe una lista. */
    const gana = $('#gana-portada');
    const ganadas = Math.round(GANADO);
    if (ganadas > 0) {
      const areas = [];
      gananciasEnTotal().forEach(function (c) {
        const k = c.ind.grupo.toLowerCase();
        if (areas.indexOf(k) < 0) areas.push(k);
      });
      gana.textContent = 'Y ganarías ' + ganadas + ', en ' + areas.join(' y ') + '.';
    } else {
      gana.textContent = '';
    }

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

  /* ── El golpe de la portada ───────────────────────────────────────────
     Se calcula en vivo: si cambian los datos, cambia la frase. */

  function golpe() {
    const ids = Object.keys(NOMBRE);
    /* Solo lo que suma al recuento: la frase habla de equipamientos, y camas,
       alumnos, plazas o superficie no lo son. Un empate a la cola cuenta como
       última: ninguna tiene menos. */
    const cuentan = D.indicadores.filter(function (ind) { return ind.enTotal !== false; });
    let ultimos = 0;
    cuentan.forEach(function (ind) {
      const base = D.BASES[ind.base || 'total'];
      let min = Infinity;
      ids.forEach(function (m) {
        const t = ind.datos[m].n / base.valores[m];
        if (t < min) min = t;
      });
      const tRef = ind.datos[REF].n / base.valores[REF];
      if (tRef <= min + 1e-12) ultimos++;
    });

    const r = serieDinero('renta').valores;
    const masPobre = ids.every(function (m) { return r[REF] <= r[m]; });

    const trozos = [];
    if (masPobre) trozos.push('en renta por habitante');
    if (ultimos) {
      trozos.push('en <b>' + ultimos + ' de los ' + cuentan.length + '</b> equipamientos');
    }
    if (!trozos.length) { $('#golpe').hidden = true; return; }

    $('#golpe').hidden = false;
    /* "Da igual la ciudad que elijas" ya acota de qué conjunto es la última:
       las que hay en el desplegable. No hace falta repetirlo. */
    $('#golpe').innerHTML = 'Da igual la ciudad que elijas: ' + NOMBRE_REF +
      ' es <b>la última</b> ' + trozos.join(' y ') + '.';
  }

  /* ── El recuento ──────────────────────────────────────────────────── */


  /* La cuenta, hecha delante del lector con números reales de su ciudad.
     En prosa no se seguía: faltaba ver las dos poblaciones una al lado de otra. */
  function comoSeLee() {
    const caja = $('#como-se-lee');
    vaciar(caja);

    let c = null;
    for (let i = 0; i < perdidas.length; i++) {
      if (perdidas[i].ind.id === 'bibliotecas') { c = perdidas[i]; break; }
    }
    if (!c) c = perdidas.filter(function (x) { return x.nRef > 0 && x.n > 1 && !esSuperficie(x); })[0];
    if (!c) { caja.hidden = true; return; }
    caja.hidden = false;

    const g = c.ind.gen || 'm';
    const etiqueta = c.base.etiqueta.charAt(0).toUpperCase() + c.base.etiqueta.slice(1);

    caja.appendChild(el('p', 'lee__rot', 'Cómo se hace la cuenta'));

    const tabla = el('div', 'lee__tabla');
    const cab = el('div', 'lee__fila lee__fila--cab');
    cab.appendChild(el('span', 'lee__et', ''));
    cab.appendChild(el('span', 'lee__v', NOMBRE_REF));
    cab.appendChild(el('span', 'lee__v', NOMBRE[AQUI]));
    tabla.appendChild(cab);

    [[etiqueta, entero(c.baseB), entero(c.baseA)],
     [c.ind.titulo, String(c.nRef), String(c.n)],
     [etiqueta + ' por ' + c.ind.sing,
      cadaCuantos(c.nRef, c.baseB), cadaCuantos(c.n, c.baseA)]
    ].forEach(function (f, i) {
      const fila = el('div', 'lee__fila' + (i === 2 ? ' lee__fila--clave' : ''));
      fila.appendChild(el('span', 'lee__et', f[0]));
      fila.appendChild(el('span', 'lee__v', f[1]));
      fila.appendChild(el('span', 'lee__v', f[2]));
      tabla.appendChild(fila);
    });
    caja.appendChild(tabla);

    caja.appendChild(el('p', 'lee__txt',
      'En ' + NOMBRE_REF + ' hay <b>' + uno[g] + ' ' + c.ind.sing + ' por cada ' +
      cadaCuantos(c.nRef, c.baseB) + ' ' + c.base.etiqueta + '</b>. ' + NOMBRE[AQUI] +
      ' tiene ' + entero(c.baseA) + ', así que con esa proporción le corresponderían <b>' +
      num(c.equivalente, 1) + '</b>. Tiene <b>' + c.n + '</b>. La diferencia es ' +
      '<b class="lee__dif">−' + num(c.delta) + '</b>, y así sale cada línea del recuento.'));
  }

  function filaRecuento(c, modo) {
    const i = c.ind;
    const li = el('li', 'rec' + (modo ? ' rec--' + modo : ''));
    const a = el('a', 'rec__a');
    a.href = '#ind-' + i.id;
    a.appendChild(icono(ICONO[i.id], 'rec__ico'));
    a.appendChild(el('span', 'rec__q', i.titulo));
    a.appendChild(el('span', 'rec__n',
      (modo === 'gana' ? '+' : '−') + cantidad(c, Math.abs(c.delta))));
    li.appendChild(a);
    return li;
  }

  function sumaDelta(lista) {
    return lista.reduce(function (t, c) {
      return t + (c.ind.enTotal === false ? 0 : c.delta);
    }, 0);
  }

  /* El orden en que se leen las pérdidas: por áreas, primero la que más pierde,
     y dentro de cada una como vengan ordenadas. Lo calcula una sola función
     para que el recuento de arriba y la lista con nombres de abajo no puedan
     acabar contando lo mismo en distinto orden. */
  function porAreas() {
    const areas = [];
    const mapa = {};
    const aparte = {};
    perdidas.forEach(function (c) {
      const k = c.ind.grupo;
      if (c.ind.enTotal === false) { (aparte[k] = aparte[k] || []).push(c); return; }
      if (!mapa[k]) { mapa[k] = []; areas.push(k); }
      mapa[k].push(c);
    });
    areas.sort(function (x, y) { return sumaDelta(mapa[y]) - sumaDelta(mapa[x]); });

    /* Lo que no suma va al final, tras el separador, agrupado por área para
       que camas y hospital se lean juntos. */
    let orden = [];
    areas.forEach(function (k) { orden = orden.concat(mapa[k]); });
    Object.keys(aparte).sort(function (x, y) { return x.localeCompare(y, 'es'); })
      .forEach(function (k) { orden = orden.concat(aparte[k]); });
    return { areas: areas, mapa: mapa, orden: orden };
  }

  function resumen() {
    comoSeLee();
    const cont = $('#recuento');
    vaciar(cont);

    /* Agrupado por área, con su subtotal: un recuento se lee por bloques,
       no como una lista de quince cosas seguidas. */
    const g = porAreas();
    const areas = g.areas;
    const porArea = g.mapa;
    const suma = sumaDelta;

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

    /* Lo que se gana en equipamientos va dentro del recuento, con su subtotal:
       se cuenta en las mismas unidades, así que no es «fuera del recuento». */
    const suyas = gananciasEnTotal();
    if (suyas.length) {
      const bloque = el('div', 'area area--gana');
      const cab = el('div', 'area__cab');
      cab.appendChild(el('h3', 'area__q', 'Lo que ganarías'));
      cab.appendChild(el('span', 'area__n', '+' + num(GANADO)));
      bloque.appendChild(cab);
      const ul = el('ul', 'area__filas');
      suyas.forEach(function (c) { ul.appendChild(filaRecuento(c, 'gana')); });
      bloque.appendChild(ul);
      cont.appendChild(bloque);
    }

    /* Lo que no suma: pérdidas y ganancias en su propia unidad. */
    const extra = [];
    /* En el orden de la lista de abajo: agrupado por área. */
    g.orden.forEach(function (c) {
      if (c.ind.enTotal !== false) return;
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo, n: '−' + cantidad(c, c.delta),
        modo: 'aparte', href: '#ind-' + c.ind.id });
    });

    /* Lo que el ayuntamiento invierte y gasta, en euros al año: la misma cuenta
       que todo lo demás, y en su ficha de «Detrás de todo, el dinero». */
    D.contexto.dinero.filter(function (s) { return s.alAnio; }).reverse().forEach(function (s) {
      const a = alAnio(s);
      extra.push({
        ico: 'euro',
        q: (s.id === 'inversion' ? 'Inversión' : 'Gasto') + ' municipal al año',
        n: a.igual ? '≈' : (a.dif > 0 ? '−' : '+') + num(Math.abs(a.dif) / 1e6, 1) + ' M€',
        modo: a.dif < 0 && !a.igual ? 'gana' : 'aparte',
        href: '#dinero-' + s.id
      });
    });
    ganancias.forEach(function (c) {
      if (c.ind.enTotal !== false) return;   /* esas van arriba, en el recuento */
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo,
        n: '+' + cantidad(c, -c.delta), modo: 'gana', href: '#ind-' + c.ind.id });
    });
    /* Un empate fuera del recuento también se enseña: que no salga nada daría
       a entender que no se ha medido. */
    empates.forEach(function (c) {
      if (c.ind.enTotal !== false) return;
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo, n: '≈', modo: 'aparte',
        href: '#lista-perdidas' });
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
        a.href = x.href;
        a.appendChild(icono(x.ico, 'rec__ico'));
        a.appendChild(el('span', 'rec__q', x.q));
        a.appendChild(el('span', 'rec__n', x.n));
        li.appendChild(a);
        ul.appendChild(li);
      });
      bloque.appendChild(ul);
      cont.appendChild(bloque);
    }

    /* Bruto, y al lado lo que se gana. El neto se da restando los dos números
       ya redondeados, para que la cuenta cuadre a la vista. */
    const pierdes = Math.round(TOTAL);
    const ganas = Math.round(GANADO);
    $('#resumen-total').innerHTML = ganas > 0
      ? '<b>Pierdes ' + pierdes + ' equipamientos</b> y ganas <b class="gana">' + ganas + '</b>: ' +
        (pierdes - ganas) + ' menos en neto.'
      : '<b>' + pierdes + ' equipamientos</b> en total.';
  }

  /* ── El punto de partida ──────────────────────────────────────────── */

  function serieDinero(id) {
    return D.contexto.dinero.find(function (s) { return s.id === id; });
  }

  /* Las filas de una serie de dinero: la media de referencia, si la hay, tu
     ciudad y Parla, cada una con su barra proporcional a la mayor. */
  function filasDinero(s, formato) {
    const filas = [];
    if (s.mediaRegional != null) filas.push({ q: s.refNombre, v: s.mediaRegional, quien: 'otro' });
    if (s.mediaSinCapital != null) {
      filas.push({ q: 'Sin la capital', v: s.mediaSinCapital, quien: 'otro' });
    }
    filas.push({ q: NOMBRE[AQUI], v: s.valores[AQUI], quien: 'aqui' });
    filas.push({ q: NOMBRE_REF, v: s.valores[REF], quien: 'referencia' });
    const tope = filas.reduce(function (t, f) { return Math.max(t, f.v); }, 0);

    const ul = el('ul', 'mun');
    filas.forEach(function (f) {
      const li = el('li', 'mun__fila');
      li.dataset.quien = f.quien;
      li.appendChild(el('span', 'mun__q', f.q));
      li.appendChild(el('span', 'mun__v', formato(f.v)));
      const barra = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = ((f.v / tope) * 100).toFixed(1) + '%';
      barra.appendChild(i);
      li.appendChild(barra);
      ul.appendChild(li);
    });
    return ul;
  }

  /* Lo que el ayuntamiento gasta o invierte, en euros al año, si lo hiciera al
     ritmo de Parla. Es la cuenta de toda la web: la tasa por habitante de Parla
     por la población de tu ciudad. */
  function enEuros(e) {
    if (e >= 1e6) return num(e / 1e6, 1) + ' millones de euros';
    return entero(Math.round(e / 1000) * 1000) + ' euros';
  }

  function alAnio(s) {
    const pob = D.BASES.total.valores[AQUI];
    const dif = (s.valores[AQUI] - s.valores[REF]) * pob;
    return { dif: dif, igual: Math.abs(dif) < s.valores[AQUI] * pob * 0.01 };
  }

  function titularAnual(s) {
    const a = alAnio(s);
    const t = el('p', 'plata__titular');
    if (a.igual) {
      t.innerHTML = 'Con ' + s.alAnio.con + ' de ' + NOMBRE_REF + ', ' + NOMBRE[AQUI] +
        ' se quedaría prácticamente igual.';
    } else {
      t.innerHTML = 'Con ' + s.alAnio.con + ' de ' + NOMBRE_REF + ', ' + NOMBRE[AQUI] + ' ' +
        s.alAnio.verbo + ' <span class="cifra">' + enEuros(Math.abs(a.dif)) + '</span> ' +
        (a.dif > 0 ? 'menos' : 'más') + ' al año.';
    }
    return t;
  }

  /* Arriba, lo que decide el ayuntamiento, con su cifra en euros al año y su
     cartel: la inversión primero, que es donde más distancia hay. Debajo, en
     fila de tres, lo que describe a los vecinos: paro, renta y PIB. */
  function dinero() {
    const arriba = $('#dinero-cuerpo');
    const abajo = $('#dinero-contexto');
    vaciar(arriba);
    vaciar(abajo);
    const series = D.contexto.dinero;
    const destacadas = series.filter(function (s) { return s.alAnio; }).reverse();
    const resto = series.filter(function (s) { return !s.alAnio; });
    destacadas.concat(resto).forEach(function (s) {
      const cont = s.alAnio ? arriba : abajo;
      const art = el('article', 'plata');
      art.id = 'dinero-' + s.id;
      art.appendChild(el('h3', 'plata__h', s.titulo));
      art.appendChild(el('p', 'plata__pie', s.pie));
      if (s.alAnio) art.appendChild(titularAnual(s));
      art.appendChild(filasDinero(s, s.id === 'paro'
        ? function (v) { return num(v, 2) + ' %'; }
        : function (v) { return entero(v) + ' €'; }));
      art.appendChild(el('p', 'renta__nota', texto(s.nota, s.industria && {
        industriaAqui: entero(s.industria[AQUI]), industriaRef: entero(s.industria[REF])
      })));
      art.appendChild(pieFuente([s.fuenteId]));
      if (s.alAnio && !alAnio(s).igual) art.appendChild(botonCartel({ dinero: s }, null));
      cont.appendChild(art);
    });
    const imp = D.contexto.impuestosDirectos;
    $('#dinero-cierre').textContent = texto(D.contexto.dineroNota, {
      impuestosAqui: entero(imp[AQUI]), impuestosRef: entero(imp[REF])
    });
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
    cont.appendChild(el('p', 'renta__nota', texto(e.nota)));
    cont.appendChild(pieFuente([e.fuenteId]));
  }

  /* Cuánto suelo hay que repartir. Parla es la más pequeña de los ocho y la más
     densa, y eso ayuda a leer el resto: la comparación es por habitante, no por
     kilómetro cuadrado. */
  function tamano() {
    const s = D.contexto.superficie.valores;
    const cont = $('#tamano');
    vaciar(cont);
    const ids = Object.keys(NOMBRE);
    const pob = D.BASES.total.valores;
    const dens = function (m) { return pob[m] / s[m]; };

    let t = NOMBRE[AQUI] + ' reparte sus ' + entero(pob[AQUI]) + ' habitantes en ' +
      num(s[AQUI], 1) + ' km², ' + entero(Math.round(dens(AQUI))) + ' por kilómetro cuadrado; ' +
      NOMBRE_REF + ' reparte los suyos en ' + num(s[REF], 1) + ' km², ' +
      entero(Math.round(dens(REF))) + '.';
    const cola = [];
    if (ids.every(function (m) { return s[REF] <= s[m]; })) cola.push('la de menos suelo');
    if (ids.every(function (m) { return dens(REF) >= dens(m); })) cola.push('la más densa');
    if (cola.length) {
      t += ' ' + NOMBRE_REF + ' es ' + cola.join(' y ') + ' de los ' + letra(ids.length) + '.';
    }
    cont.appendChild(el('p', 'tamano__txt', t));
    cont.appendChild(pieFuente([D.contexto.superficie.fuenteId]));
  }

  /* ── Listas ───────────────────────────────────────────────────────── */

  /* Las fichas en orden y, antes de la primera que no suma, un corte con
     título propio. El texto dice en qué se mide lo de debajo, con las unidades
     que de verdad aparecen para esta ciudad. Si no hay nada encima que sí sume,
     no hay nada que separar y el corte no se pone. */
  function fichasConSeparador(env, lista, modo, arranque) {
    const fuera = lista.filter(function (c) { return c.ind.enTotal === false; });
    const unidades = [];
    fuera.forEach(function (c) {
      if (unidades.indexOf(c.ind.mide) < 0) unidades.push(c.ind.mide);
    });
    const en = unidades.length > 1
      ? unidades.slice(0, -1).join(', ') + ' o ' + unidades[unidades.length - 1]
      : unidades[0];
    let cortado = false;
    lista.forEach(function (c, n) {
      if (!cortado && c.ind.enTotal === false && n > 0) {
        cortado = true;
        const sep = el('div', 'separador');
        sep.appendChild(el('h3', 'separador__h', 'Fuera del recuento'));
        sep.appendChild(el('p', 'separador__p', arranque + ': se mide en ' + en + '.'));
        env.appendChild(sep);
      }
      env.appendChild(bloqueIndicador(c, modo));
    });
  }

  function listas() {
    const lp = $('#lista-perdidas');
    vaciar(lp);
    const env = el('div', 'env');
    fichasConSeparador(env, porAreas().orden, 'pierde',
      'No suma a los ' + Math.round(TOTAL) + ' de la portada');
    if (empates.length) {
      const art = el('article', 'ind');
      art.appendChild(el('p', 'ind__grupo', 'Empate técnico'));
      art.appendChild(el('h3', 'ind__h', 'Y en esto las dos ciudades están igual'));
      const ul = el('ul', 'pendientes');
      empates.forEach(function (c) {
        ul.appendChild(el('li', null, c.ind.titulo + ' — ' + NOMBRE[AQUI] + ' ' +
          cantidad(c, c.n) + ', ' + NOMBRE_REF + ' ' + cantidad(c, c.nRef) + ' (diferencia: ' +
          (esSuperficie(c) ? enSuperficie(Math.abs(c.delta)) : num(Math.abs(c.delta), 2)) + ')'));
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
    fichasConSeparador(env2, ganancias, 'gana', Math.round(GANADO) > 0
      ? 'No suma a los ' + Math.round(GANADO) + ' que ganarías'
      : 'No suma al recuento');
    lg.appendChild(env2);
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
    Array.prototype.forEach.call(document.querySelectorAll('[data-n]'), function (n) {
      n.textContent = letra(D.MUNICIPIOS.length);
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

    let pedido = false, ultimo = -1;

    function medir() {
      pedido = false;
      const corte = window.innerHeight * 0.55;
      let suma = 0;
      const nodos = document.querySelectorAll('#lista-perdidas .ind[data-delta]');
      for (let i = 0; i < nodos.length; i++) {
        if (nodos[i].getBoundingClientRect().top < corte) suma += parseFloat(nodos[i].dataset.delta);
      }
      /* Se apaga donde deja de sumar: en el separador, o en las ganancias si no
         hay nada fuera del recuento. Se busca cada vez porque cambiar de ciudad
         vuelve a pintar la lista. */
      const fin = document.querySelector('#lista-perdidas .separador') || $('#ganancias');
      const visible = suma >= 1 && fin.getBoundingClientRect().top > 120;
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


  /* ── Cartel A4 ────────────────────────────────────────────────────────
     Un cartel por indicador, con formato de anuncio: la cifra, lo que se
     tacha y un QR a la web. El PDF lo hace el propio navegador desde el
     diálogo de impresión, así que no hace falta ninguna librería. El QR va
     ya trazado en assets/qr.js, generado por herramientas/qr.py. */

  function qrSvg() {
    const q = (window.QR || {})[AQUI] || (window.QR || {})._;
    if (!q) return null;
    const caja = el('div', 'kqr');
    const lado = q.n + 8;                       /* zona de silencio: 4 módulos */
    caja.innerHTML =
      '<svg viewBox="-4 -4 ' + lado + ' ' + lado + '" role="img" ' +
      'aria-label="Código QR a ' + q.url + '">' +
      '<rect x="-4" y="-4" width="' + lado + '" height="' + lado + '" fill="#fff"/>' +
      '<path d="' + q.d + '" fill="#161616"/></svg>';
    return caja;
  }

  /* La tira de unidades: un cuadrado tachado por equipamiento. Es lo que en la
     portada se ve crecer con el contador, aquí ya terminado y en tamaño de
     imprenta. El lado lo fija quien la monta, en --ku. */
  function tiraUnidades(cuantos) {
    const r = el('div', 'krejilla');
    for (let i = 0; i < cuantos; i++) {
      const u = el('span', 'ku');
      u.innerHTML = UNIDAD;
      r.appendChild(u);
    }
    return r;
  }

  /* La unidad tachada, copiada de la web —la tira de la portada (`.u--cae`)—:
     cuadrado de esquinas redondeadas, borde fino y raya gruesa de puntas
     planas, más ancha que el borde. Va en SVG y no en sombra y degradado porque
     al imprimir el degradado engordaba todavía más la raya. Las medidas salen
     de la web: borde 10 % del lado, radio 20 %, y la raya con el mismo ancho
     que le da allí el degradado (41 %–59 % de la diagonal). */
  const UNIDAD =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<rect x="1.6" y="1.6" width="28.8" height="28.8" rx="4.8" fill="#f3f1ec" ' +
    'stroke="#c02719" stroke-width="3.2"/>' +
    '<path d="M0 32 32 0" stroke="#c02719" stroke-width="8.15"/></svg>';

  /* Reparto entero de los subtotales de área, por resto mayor, para que las
     cifras de las cajas sumen exactamente los cuadrados del titular. Redondear
     cada área por su cuenta dejaría al lector sumando y sin cuadrar. */
  function repartoEntero(valores, total) {
    const n = valores.map(Math.floor);
    const orden = valores
      .map(function (v, i) { return { i: i, r: v - Math.floor(v) }; })
      .sort(function (a, b) { return b.r - a.r; });
    let falta = total - n.reduce(function (s, v) { return s + v; }, 0);
    for (let k = 0; falta > 0 && k < 300; k++) {
      n[orden[k % orden.length].i]++; falta--;
    }
    for (let k = 0; falta < 0 && k < 300; k++) {
      const i = orden[orden.length - 1 - (k % orden.length)].i;
      if (n[i] > 0) { n[i]--; falta++; }
    }
    return n;
  }

  /* Los dos fondos van precargados: el cartel se monta y se imprime en el
     mismo gesto, y una imagen a medio cargar saldría en blanco. */
  const FONDOS = ['papel', 'barrio'];
  FONDOS.forEach(function (f) { (new Image()).src = 'assets/cartel/' + f + '.jpg'; });

  function fondoElegido() {
    try {
      const g = localStorage.getItem('fondo');
      if (FONDOS.indexOf(g) >= 0) return g;
    } catch (e) { /* sin almacenamiento: el de siempre */ }
    return FONDOS[0];
  }

  /* Las tres piezas que comparten el cartel de un indicador y el general: el
     fondo, el titular y la banda del pie. Se montan en este orden porque la
     banda va después de la capa, y el titular lo mide ajustarTitular(). */
  function montarCartel(raiz, fondo, pre) {
    vaciar(raiz);
    raiz.className = 'cartel cartel--afiche';
    raiz.setAttribute('data-fondo', fondo);

    const img = el('img', 'kfondo');
    img.src = 'assets/cartel/' + fondo + '.jpg';
    img.alt = '';
    raiz.appendChild(img);

    const capa = el('div', 'kcapa');
    capa.appendChild(el('p', 'kpre', pre ||
      'Si ' + NOMBRE[AQUI] + ' estuviera dotada como ' + NOMBRE_REF));
    raiz.appendChild(capa);
    return capa;
  }

  /* Titular corto y siempre con la misma forma: cifra, servicio, «menos».
     El rojo lo lleva el servicio, como en los carteles de barrio. */
  function titularCartel(capa, cifra, servicio, gana) {
    const tit = el('h1', 'ktit');
    tit.appendChild(el('span', 'ktit__n', cifra));
    tit.appendChild(el('span', 'ktit__q', servicio));
    tit.appendChild(el('span', 'ktit__m', gana ? 'más' : 'menos'));
    capa.appendChild(tit);
    return tit;
  }

  /* Banda inferior: el cuadro blanco de la referencia es el QR. */
  function bandaCartel(raiz) {
    const banda = el('div', 'kbanda');
    const qr = qrSvg();
    if (qr) banda.appendChild(qr);
    const txt = el('div', 'kbanda__txt');
    txt.appendChild(el('p', 'kbanda__h', 'Si yo viviera<br>como en ' + NOMBRE_REF));
    txt.appendChild(el('span', 'kbanda__raya'));
    txt.appendChild(el('p', 'kbanda__url', 'siyovivieracomoenparla.netlify.app'));
    banda.appendChild(txt);
    raiz.appendChild(banda);
  }

  function cartelIndicador(c, modo) {
    const gana = modo === 'gana';
    const cuantos = gana ? -c.delta : c.delta;
    const raiz = $('#cartel');
    const fondo = fondoElegido();
    const capa = montarCartel(raiz, fondo);
    const tit = titularCartel(capa, esSuperficie(c)
      ? enSuperficie(cuantos, cifraElegida() === 'redonda')
      : cifraCartel(cuantos), c.ind.titulo, gana);

    /* Fila de cajas: los nombres que se tachan o, si no hay, las dos tasas. */
    const fila = el('ul', 'kcajas');
    const lista = (!gana && c.lista) ? c.lista : [];
    const caen = lista.length ? Math.min(cuantosTachados(cuantos), lista.length) : 0;
    if (caen) {
      const tope = fondo === 'barrio' ? 4 : 8;
      const muestra = lista.slice(0, Math.min(caen, tope));
      muestra.forEach(function (x) {
        const li = el('li', 'kcaja kcaja--tacha');
        const ico = ICONO[c.ind.id];
        if (ico) li.appendChild(icono(ico, 'kcaja__ico'));
        const t = el('span', 'kcaja__t');
        t.textContent = x;
        li.appendChild(t);
        fila.appendChild(li);
      });
      if (caen > muestra.length) {
        fila.appendChild(el('li', 'kcaja', 'y ' + (caen - muestra.length) + ' más'));
      }
    } else if (esCartera(c)) {
      fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
        (c.n ? c.n + ' unidades asistenciales' : 'sin hospital público')));
      fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
        c.nRef + ' unidades asistenciales'));
    } else if (esSuperficie(c)) {
      fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
        num(c.tasaA, 1) + ' m² por habitante'));
      fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
        num(c.tasaB, 1) + ' m² por habitante'));
    } else {
      const u = entero(c.base.por) + ' ' + c.base.etiqueta;
      fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
        numTasa(c.tasaA) + ' por cada ' + u));
      fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
        numTasa(c.tasaB) + ' por cada ' + u));
    }
    fila.dataset.n = String(fila.children.length);
    capa.appendChild(fila);

    bandaCartel(raiz);
    ajustarTitular(raiz, tit, fondo);
  }

  /* El cartel del gasto o la inversión: la cifra en euros al año y, en las
     cajas, lo que cada ayuntamiento pone por habitante. */
  function cartelDinero(s) {
    const a = alAnio(s);
    const raiz = $('#cartel');
    const fondo = fondoElegido();
    const capa = montarCartel(raiz, fondo,
      'Si ' + NOMBRE[AQUI] + ' ' + s.alAnio.si + ' como ' + NOMBRE_REF);
    const cifra = cifraElegida() === 'exacta' || a.dif < 1e7
      ? num(Math.abs(a.dif) / 1e6, 1) : entero(Math.round(Math.abs(a.dif) / 1e6));
    const tit = titularCartel(capa, cifra + ' M€',
      (s.id === 'inversion' ? 'de inversión' : 'de gasto') + ' al año', a.dif < 0);
    const fila = el('ul', 'kcajas');
    fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
      entero(s.valores[AQUI]) + ' € por habitante'));
    fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
      entero(s.valores[REF]) + ' € por habitante'));
    fila.dataset.n = '2';
    capa.appendChild(fila);
    bandaCartel(raiz);
    ajustarTitular(raiz, tit, fondo);
  }

  /* El cartel de la situación general: la misma composición, con el total del
     recuento en el titular y, debajo, cada área con su cifra y su fila de
     cuadrados tachados —uno por equipamiento—, para que se vea de dónde cae
     cada cosa. Las cifras se reparten en enteros para que sumen el titular. */
  function cartelGeneral() {
    const raiz = $('#cartel');
    const fondo = fondoElegido();
    const capa = montarCartel(raiz, fondo);
    const total = Math.round(TOTAL);
    const tit = titularCartel(capa, entero(total),
      'equipamientos y servicios públicos', false);

    const g = porAreas();
    const cuantos = repartoEntero(
      g.areas.map(function (k) { return sumaDelta(g.mapa[k]); }), total);

    /* Todos los cuadrados de un área caben en su fila: el lado se aprieta lo
       justo para que entre la que más tiene. Leganés llega a treinta. */
    const mayor = cuantos.length ? Math.max.apply(null, cuantos) : 0;
    const lado = Math.min(7, mayor ? (176 - 1.4 * (mayor - 1)) / mayor : 7);

    const lista = el('ul', 'kareas');
    lista.style.setProperty('--ku', lado.toFixed(2) + 'mm');
    g.areas.forEach(function (k, i) {
      const li = el('li', 'karea');
      const cab = el('div', 'karea__cab');
      const ico = ICONO_AREA[k];
      if (ico) cab.appendChild(icono(ico, 'karea__ico'));
      cab.appendChild(el('b', 'karea__q', k));
      cab.appendChild(el('span', 'karea__n', entero(cuantos[i])));
      li.appendChild(cab);
      li.appendChild(tiraUnidades(cuantos[i]));
      lista.appendChild(li);
    });
    capa.appendChild(lista);

    bandaCartel(raiz);
    ajustarTitular(raiz, tit, fondo, lista);
  }

  /* El titular tiene que llenar el ancho sin desbordar ni pisar lo que hay
     debajo. Lo que manda es la palabra más larga, no el número de caracteres,
     y una palabra que envuelve no ensancha su bloque: hay que medirla suelta.
     Se pinta fuera de pantalla, se busca el mayor cuerpo que cabe, y se apaga.

     El suelo se mide desde el borde superior del A4, no desde el titular, y
     cambia con el fondo. En «papel» manda la banda oscura del pie: el bloque
     entero —titular y cajas— tiene que quedar por encima. En «barrio» manda el
     tejado de la foto: el titular no puede pisarlo, pero las cajas sí, que
     llevan su propio fondo claro y sobre la foto se leen igual. */
  const SUELO = { papel: 231, barrio: 130 };
  function ajustarTitular(raiz, tit, fondo, ultimo) {
    raiz.classList.add('midiendo');
    const capa = raiz.querySelector('.kcapa');
    const cajas = raiz.querySelector('.kcajas');
    const marco = raiz.getBoundingClientRect();
    const mm = marco.height / 297;
    /* El ancho que de verdad tiene el titular, no el de la capa: el de la capa
       incluye los 11 mm de padding a cada lado y una palabra larga se saldría
       de la hoja. */
    const ancho = tit.clientWidth;
    const manda = fondo === 'barrio' ? tit : (ultimo || cajas || tit);
    const tope = marco.top + (SUELO[fondo] || SUELO.papel) * mm;

    /* regla para medir palabras sueltas, con la misma tipografía */
    const regla = el('span');
    regla.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;' +
      'font-weight:800;font-stretch:62%;letter-spacing:-.035em;text-transform:uppercase;';
    regla.style.fontFamily = getComputedStyle(tit).fontFamily;
    capa.appendChild(regla);

    const palabras = [];
    tit.querySelectorAll('span').forEach(function (sp) {
      const escala = sp.classList.contains('ktit__n') ? 1.35 : 1;
      sp.textContent.split(/\s+/).forEach(function (w) {
        if (w) palabras.push({ t: w, e: escala });
      });
    });

    let pt = 160;
    for (; pt > 28; pt -= 2) {
      let cabe = true;
      for (let k = 0; k < palabras.length; k++) {
        regla.style.fontSize = (pt * palabras[k].e) + 'pt';
        regla.textContent = palabras[k].t;
        if (regla.offsetWidth > ancho) { cabe = false; break; }
      }
      if (!cabe) continue;
      tit.style.fontSize = pt + 'pt';
      if (manda.getBoundingClientRect().bottom <= tope) break;
    }
    tit.style.fontSize = pt + 'pt';
    capa.removeChild(regla);
    raiz.classList.remove('midiendo');
  }

  const ROTULO_FONDO = { papel: 'Papel', barrio: 'El barrio' };

  /* El cartel es un anuncio, no una tabla: «21,6 oficinas de farmacia» chirría
     dicha en la calle. Por defecto la cifra va redondeada y el decimal se queda
     en la web, que sí puede explicarlo; quien quiera el número exacto lo elige
     en el diálogo. Lo que no llega a uno se deja como está: redondear a cero
     dejaría el titular sin cifra. */
  const CIFRAS = ['redonda', 'exacta'];
  function cifraElegida() {
    try {
      const g = localStorage.getItem('cifra');
      if (CIFRAS.indexOf(g) >= 0) return g;
    } catch (e) { /* sin almacenamiento: la de siempre */ }
    return CIFRAS[0];
  }
  function cifraCartel(v) {
    if (cifraElegida() === 'exacta') return num(v);
    const r = Math.round(v);
    return num(Math.abs(r) < 1 ? v : r);
  }

  /* Cuántos nombres se tachan, que no es lo mismo que cuántos sobran. Un nombre
     de más se lee como un error: si el titular dice 3, no pueden caer cuatro, y
     por eso manda la cifra que se enseña. Con la cifra redondeada, tantos como
     diga; con la exacta, los enteros que desaparecen enteros —los mismos que
     tacha la web, que deja el resto a medias—. Por debajo de uno no cae ninguno
     y el cartel enseña entonces las dos tasas. */
  function cuantosTachados(cuantos) {
    const r = Math.round(cuantos);
    if (cifraElegida() === 'redonda' && Math.abs(r) >= 1) return Math.abs(r);
    return Math.floor(cuantos + 0.0001);
  }

  let pendiente = null;

  function dialogoFondo() {
    let d = $('#elige-fondo');
    if (d) return d;
    d = el('dialog', 'fondos');
    d.id = 'elige-fondo';
    d.appendChild(el('h2', 'fondos__h', 'Elige el cartel'));
    d.appendChild(el('p', 'fondos__p', 'Se abrirá el diálogo de impresión: elige ' +
      '«Guardar como PDF» para quedártelo, o imprime directamente en A4.'));

    /* Cómo sale la cifra del titular. Va antes de los fondos porque el fondo
       es el botón que genera: se elige primero el número y luego el papel. */
    const cif = el('div', 'cifra');
    cif.appendChild(el('span', 'cifra__rot', 'La cifra'));
    const seg = el('div', 'cifra__seg');
    [{ v: 'redonda', t: 'Redondeada' }, { v: 'exacta', t: 'Con decimales' }]
      .forEach(function (o) {
        const b = el('button', 'cifra__op', o.t);
        b.type = 'button';
        b.dataset.cifra = o.v;
        b.addEventListener('click', function () {
          try { localStorage.setItem('cifra', o.v); } catch (e) { /* da igual */ }
          marcarCifra(d);
        });
        seg.appendChild(b);
      });
    cif.appendChild(seg);
    d.appendChild(cif);

    const fila = el('div', 'fondos__fila');
    FONDOS.forEach(function (f) {
      const b = el('button', 'fondo');
      b.type = 'button';
      b.dataset.fondo = f;
      const im = el('img');
      im.src = 'assets/cartel/' + f + '.jpg';
      im.alt = '';
      b.appendChild(im);
      b.appendChild(el('span', 'fondo__n', ROTULO_FONDO[f] || f));
      b.addEventListener('click', function () {
        try { localStorage.setItem('fondo', f); } catch (e) { /* da igual */ }
        d.close();
        if (pendiente) generar(pendiente.c, pendiente.modo);
      });
      fila.appendChild(b);
    });
    d.appendChild(fila);
    const cerrar = el('button', 'fondos__x', 'Cancelar');
    cerrar.type = 'button';
    cerrar.addEventListener('click', function () { d.close(); });
    d.appendChild(cerrar);
    document.body.appendChild(d);
    return d;
  }

  function marcarCifra(d) {
    const c = cifraElegida();
    d.querySelectorAll('.cifra__op').forEach(function (b) {
      const activa = b.dataset.cifra === c;
      b.dataset.activo = activa ? '1' : '0';
      b.setAttribute('aria-pressed', activa ? 'true' : 'false');
    });
  }

  function compartir(c, modo) {
    pendiente = { c: c, modo: modo };
    const d = dialogoFondo();
    const elegido = fondoElegido();
    d.querySelectorAll('.fondo').forEach(function (b) {
      b.dataset.activo = b.dataset.fondo === elegido ? '1' : '0';
    });
    marcarCifra(d);
    if (d.showModal) d.showModal(); else generar(c, modo);
  }

  /* `caso` es la comparación de un indicador o la cadena 'general' para el
     cartel del recuento entero. */
  function generar(caso, modo) {
    const general = caso === 'general';
    if (general) cartelGeneral();
    else if (caso.dinero) cartelDinero(caso.dinero);
    else cartelIndicador(caso, modo);
    const antes = document.title;
    /* El título es el nombre que el navegador propone para el PDF. */
    document.title = NOMBRE[AQUI] + ' como Parla · ' +
      (general ? 'La situación general' : caso.dinero ? caso.dinero.titulo : caso.ind.titulo);
    document.documentElement.setAttribute('data-cartel',
      general ? 'general' : caso.dinero ? 'dinero-' + caso.dinero.id : caso.ind.id);

    let limpio = false;
    function limpiar() {
      if (limpio) return;
      limpio = true;
      document.documentElement.removeAttribute('data-cartel');
      document.title = antes;
      window.removeEventListener('afterprint', limpiar);
    }
    window.addEventListener('afterprint', limpiar);
    window.print();
    setTimeout(limpiar, 1500);   /* Safari no siempre dispara afterprint */
  }

  function botonCartel(c, modo) {
    const b = el('button', 'compartir');
    b.type = 'button';
    b.title = 'Genera un cartel A4 con este dato, listo para imprimir o guardar en PDF';
    b.appendChild(icono('descarga', 'compartir__ico'));
    b.appendChild(el('span', null, 'Cartel para compartir'));
    b.addEventListener('click', function () { compartir(c, modo); });
    return b;
  }

  /* El botón de la portada: el mismo cartel, con el total. Lleva la unidad
     tachada en rojo, que es la marca de lo que desaparece. */
  function botonCartelGeneral() {
    const b = el('button', 'compartir compartir--general');
    b.type = 'button';
    b.title = 'Genera un cartel A4 con el total, listo para imprimir o guardar en PDF';
    b.appendChild(icono('unidad', 'compartir__ico'));
    b.appendChild(el('span', null, 'Cartel de la situación general'));
    b.addEventListener('click', function () { compartir('general', null); });
    return b;
  }

  function pintar() {
    calcular();
    portada();
    golpe();
    resumen();
    edades();
    tamano();
    dinero();
    listas();
    metodo();
    movimiento();
    document.title = 'Si yo viviera como en Parla · ' + NOMBRE[AQUI];
  }

  selector();
  pintar();
  contador();
})();

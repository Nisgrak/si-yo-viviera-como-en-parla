/* ═══════════════════════════════════════════════════════════════════════
   PARLA, A LA COLA · render
   La única cuenta que hace esta web:
     lo que tendría Parla = servicios(otra) / base(otra) × base(Parla)
   donde `base` es la población total o el tramo de edad que corresponda, y
   «otra» es la ciudad que se elige en el titular. Por dentro, REF es Parla y
   AQUI la ciudad elegida, como en el resto de páginas.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const NOMBRE_REF = NOMBRE[REF];

  const UMBRAL = window.CALCULO.UMBRAL;

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = function (s, r) { return (r || document).querySelector(s); };

  let AQUI = arranque();
  let faltan, sobran, empates, TOTAL, SOBRA, TIENE;

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
    return n.toLocaleString('es-ES',
      { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec });
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
  const esSuperficie = window.CALCULO.esSuperficie;
  function cantidad(c, v, dec) { return esSuperficie(c) ? enSuperficie(v) : num(v, dec); }


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

  /* «Una biblioteca pública por cada 68.736 habitantes en Parla; una por
     cada 32.206 en Getafe.» Parla siempre delante. */
  function enCristiano(c) {
    if (esSuperficie(c)) {
      return num(c.tasaParla, 1) + ' m² por habitante en ' + NOMBRE_REF + '; ' +
        num(c.tasaOtra, 1) + ' en ' + NOMBRE[AQUI] + '.';
    }
    const g = c.ind.gen || 'm';
    const parla = cadaCuantos(c.parla, c.baseParla);
    const otra = cadaCuantos(c.otra, c.baseOtra);
    const quien = c.base.etiqueta;
    if (!parla && !otra) return '';
    if (!otra) {
      return UNO[g] + ' ' + c.ind.sing + ' por cada ' + parla + ' ' + quien + ' en ' +
        NOMBRE_REF + '. En ' + NOMBRE[AQUI] + ' no hay ' + ninguno[g] + '.';
    }
    if (!parla) {
      return 'En ' + NOMBRE_REF + ' no hay ' + ninguno[g] + '. ' + UNO[g] + ' ' +
        c.ind.sing + ' por cada ' + otra + ' ' + quien + ' en ' + NOMBRE[AQUI] + '.';
    }
    return UNO[g] + ' ' + c.ind.sing + ' por cada ' + parla + ' ' + quien + ' en ' +
      NOMBRE_REF + '; ' + uno[g] + ' por cada ' + otra + ' en ' + NOMBRE[AQUI] + '.';
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
    /* Un cochecito: capota, cuna, asa y dos ruedas. */
    bebe:
      '<path d="M4 10.4h13.2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/>' +
      '<path d="M4 10.4a6.4 6.4 0 0 1 6.4-6.4v6.4"/><path d="M17.2 10.4 18.8 5.6h2"/>' +
      '<circle cx="8" cy="19" r="1.8"/><circle cx="14.6" cy="19" r="1.8"/>',
    /* Una mochila: cuerpo, asa y bolsillo. */
    colegio:
      '<rect x="5" y="6.4" width="14" height="14.4" rx="3.6"/>' +
      '<path d="M9.2 6.4V5a1.8 1.8 0 0 1 1.8-1.8h2A1.8 1.8 0 0 1 14.8 5v1.4"/>' +
      '<path d="M8.6 14.2h6.8v3.6H8.6z"/><path d="M5 11.4h14"/>',
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
    /* Una llave inglesa: mango y cabeza abierta. */
    llave:
      '<path d="M14.6 3.4a4.6 4.6 0 0 0-4.3 6.3l-6.4 6.4a2 2 0 0 0 2.9 2.9l6.4-6.4a4.6 4.6 0 0 0 ' +
      '6.3-4.3l-2.8 2.8-2.9-.9-.9-2.9z"/>',
    descarga:
      '<path d="M12 3.4v11.2"/><path d="M7.6 10.4 12 14.8l4.4-4.4"/>' +
      '<path d="M4.2 16.6v2.6a1.4 1.4 0 0 0 1.4 1.4h12.8a1.4 1.4 0 0 0 1.4-1.4v-2.6"/>',
    /* El hueco: el mismo dibujo que la tira (esquina corta y un trazo largo
       centrado en cada lado), llevado a la rejilla de 24. */
    hueco:
      '<path transform="translate(2.4 2.4) scale(1.28)" stroke-width="1.35" stroke-linecap="butt" ' +
      'd="M.75 4.25V3.75a3 3 0 0 1 3-3H4.25M10.75 .75h0.5a3 3 0 0 1 3 3V4.25M14.25 10.75v0.5a3 3 0 0 1-3 3H10.75' +
      'M4.25 14.25H3.75a3 3 0 0 1-3-3V10.75M5.5 .75H9.5M14.25 5.5V9.5M9.5 14.25H5.5M.75 9.5V5.5"/>',
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
    'plazas-residencia': 'residencia', camas: 'cama', artes: 'paleta', fp: 'llave',
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

  /* La cuenta vive en calculo.js (faltan); aquí solo se guarda para pintarla.
     Cada ficha lleva parla, otra, tendria y falta: lo que tiene Parla, lo que
     tiene la otra ciudad, lo que tendría Parla con su proporción y la
     diferencia (> 0, le falta a Parla). */
  function calcular() {
    const r = window.CALCULO.faltan(D, AQUI);
    faltan = r.falta;
    sobran = r.sobra;
    empates = r.empates;
    TOTAL = r.TOTAL;
    SOBRA = r.SOBRA;
    TIENE = r.TIENE;
  }

  /* Donde Parla tiene más y cuenta como equipamiento: lo mismo que suma SOBRA. */
  function sobranEnTotal() {
    return sobran.filter(function (c) { return c.ind.enTotal !== false; });
  }

  function esCartera(c) { return c.ind.medida === 'cartera'; }

  /* ── Piezas ───────────────────────────────────────────────────────── */

  /* Lo que hay, en negro, y detrás un hueco por cada cosa que falta. El hueco
     de la parte que no llega a una entera solo lleva en rojo ese trozo. */
  function tira(hay, falta) {
    const n = hay + Math.ceil(falta);
    const cont = el('div', 'tira' + (n > 70 ? ' tira--microscopica' : n > 24 ? ' tira--densa' : ''));
    cont.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < hay; i++) cont.appendChild(el('span', 'u'));
    const enteros = Math.floor(falta + 1e-9);
    const parte = falta - enteros;
    for (let j = 0; j < enteros; j++) {
      const u = el('span', 'u u--hueco');
      u.style.setProperty('--retraso', Math.min(j, 40) * 34 + 'ms');
      cont.appendChild(u);
    }
    if (parte > 0.04) {
      const u = el('span', 'u u--hueco u--hueco-parte');
      u.style.setProperty('--parte', (parte * 100).toFixed(1) + '%');
      u.style.setProperty('--retraso', Math.min(enteros, 40) * 34 + 'ms');
      cont.appendChild(u);
    }
    return cont;
  }

  function tasas(c) {
    const max = Math.max(c.tasaParla, c.tasaOtra) || 1;
    const cont = el('div', 'tasas');

    /* Las dos barras son dos números sueltos si no se dice de qué. El titular
       del bloque ya dice qué se cuenta, así que aquí basta el divisor. */
    cont.appendChild(el('p', 'tasas__ley', esSuperficie(c)
      ? 'Metros cuadrados por habitante'
      : 'Por cada ' + entero(c.por) + ' ' + c.base.etiqueta));

    if (c.ind.base && c.ind.base !== 'total') {
      cont.appendChild(el('p', 'tasas__base',
        'En ese tramo: ' + NOMBRE_REF + ' <b>' + entero(c.baseParla) + '</b>, ' +
        NOMBRE[AQUI] + ' ' + entero(c.baseOtra) + '.'));
    }

    [{ id: REF, v: c.tasaParla }, { id: AQUI, v: c.tasaOtra }].forEach(function (f) {
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

    /* Un decimal, como el titular: es la misma cifra vista desde el otro lado. */
    cont.appendChild(el('p', 'tasas__pie', 'Con la proporción de ' + NOMBRE[AQUI] +
      ', Parla tendría ' + (esSuperficie(c) ? enSuperficie(c.tendria) : num(c.tendria)) +
      '. Tiene ' + (esSuperficie(c) ? enSuperficie(c.parla) : entero(c.parla)) + '.'));
    return cont;
  }

  function filaNombre(nombre, cls, cola) {
    const li = el('li', 'nombre' + (cls ? ' ' + cls : ''));
    li.appendChild(el('span', 'nombre__m'));
    li.appendChild(el('span', 'nombre__t', nombre));
    li.appendChild(el('span', 'nombre__p', cola || ''));
    return li;
  }

  function plegado(titulo, nombres, cls) {
    const det = el('details', 'plegable');
    det.appendChild(el('summary', null, titulo));
    const ul = el('ul', 'nombres');
    nombres.forEach(function (n) { ul.appendChild(filaNombre(n, cls)); });
    det.appendChild(ul);
    return det;
  }

  /* «La 3.ª biblioteca pública»: la que vendría detrás de las que hay. */
  function ordinal(k, g) {
    /* Primero, tercero (y vigésimo primero…) se abrevian «.er»; el resto, «.º». */
    const er = (k % 10 === 1 || k % 10 === 3) && k % 100 !== 11 && k % 100 !== 13;
    return g === 'f' ? 'La ' + k + '.ª' : 'El ' + k + (er ? '.er' : '.º');
  }

  /* Lo que falta, siempre a la vista; lo que hay en Parla, debajo; lo que hay
     en la otra ciudad, plegado. Los huecos no tienen nombre porque no existen:
     se nombran por su puesto. Con muchos, los dos primeros y el resto en una
     fila, que la tira ya los dibuja todos. */
  function huecos(c) {
    const i = c.ind;
    const g = i.gen || 'm';
    const cont = el('div', 'nombres-bloque');
    cont.appendChild(el('p', 'nombres__rot nombres__rot--falta', 'Lo que falta'));
    const ul = el('ul', 'nombres');
    const enteros = Math.floor(c.falta + 1e-9);
    const sueltos = enteros > 6 ? 2 : enteros;
    for (let k = 1; k <= sueltos; k++) {
      ul.appendChild(filaNombre(ordinal(c.parla + k, g) + ' ' + i.sing, 'nombre--hueco', 'no existe'));
    }
    if (enteros > sueltos) {
      const h = ordinal(c.parla + enteros, g);
      ul.appendChild(filaNombre('Y ' + (enteros - sueltos) + ' más, hasta ' + h.charAt(0).toLowerCase() + h.slice(1),
        'nombre--hueco', 'no existen'));
    }
    const parte = c.falta - enteros;
    if (parte > 0.04) {
      /* «Y» solo si va detrás de otros huecos: si es el único, empieza la lista. */
      const o = ordinal(c.parla + enteros + 1, g);     /* «La 3.ª», «El 1.er» */
      ul.appendChild(filaNombre((enteros ? 'Y ' + o.charAt(0).toLowerCase() + o.slice(1) : o + ' ' + i.sing) +
        ', a medias', 'nombre--hueco nombre--parte',
        'falta el ' + num(parte * 100, 0) + ' %'));
    }
    cont.appendChild(ul);

    const hay = c.lista || [];
    if (hay.length && hay.length === c.parla) {
      if (hay.length <= 8) {
        cont.appendChild(el('p', 'nombres__rot', 'Lo que hay en Parla'));
        const ul2 = el('ul', 'nombres');
        hay.forEach(function (n) { ul2.appendChild(filaNombre(n)); });
        cont.appendChild(ul2);
      } else {
        cont.appendChild(plegado('Ver ' + (g === 'f' ? 'las ' : 'los ') + hay.length +
          ' que hay en Parla', hay));
      }
    }
    const suya = i.datos[AQUI].lista || [];
    if (suya.length) {
      cont.appendChild(plegado('Ver ' + (suya.length === 1 ? (g === 'f' ? 'la' : 'el') + ' de '
        : (g === 'f' ? 'las ' : 'los ') + suya.length + ' de ') + NOMBRE[AQUI], suya, 'nombre--otra'));
    }
    return cont;
  }

  /* modo: 'falta' (le falta a Parla) o 'sobra' (Parla tiene más). */
  function bloqueIndicador(c, modo) {
    const i = c.ind;
    const sobra = modo === 'sobra';
    const art = el('article', 'ind' + (sobra ? ' ind--sobra' : ''));
    art.id = 'ind-' + i.id;
    if (i.enTotal !== false && !sobra) art.dataset.falta = c.falta.toFixed(4);

    const cab = el('p', 'ind__grupo');
    cab.appendChild(icono(ICONO[i.id], 'ind__ico'));
    cab.appendChild(el('span', null, i.grupo));
    art.appendChild(cab);
    const hi = el('h3', 'ind__h', i.titulo);
    hi.dataset.sentido = (window.SENTIDO && window.SENTIDO.de(i.id)) || 'mas';
    art.appendChild(hi);

    if (esCartera(c)) return fichaCartera(art, c, modo);

    const g = i.gen || 'm';
    let titular;
    if (sobra) {
      titular = 'Tiene <span class="cifra">' + cantidad(c, -c.falta) + '</span> <span class="resto">' +
        (c.otra === 0 ? 'donde ' + NOMBRE[AQUI] + ' no tiene ' + ninguno[g] : 'más de ' +
        (g === 'f' ? 'las' : 'los') + ' que le tocarían') + '</span>';
    } else if (esSuperficie(c)) {
      titular = 'Le faltan <span class="cifra">' + enSuperficie(c.falta) + '</span> <span class="resto">' +
        'a ' + (c.parla ? 'los ' + enSuperficie(c.parla) + ' que tiene' : 'lo que tiene') + '</span>';
    } else if (c.parla === 0) {
      titular = 'No tiene <span class="cifra cifra--palabra">' + ninguno[g] + '</span> ' +
        '<span class="resto">y le ' + (c.tendria < 1.5 ? 'correspondería' : 'corresponderían') + ' ' +
        num(c.tendria) + '</span>';
    } else {
      titular = 'Le faltan <span class="cifra">' + num(c.falta) + '</span> <span class="resto">a ' +
        (g === 'f' ? 'las ' : 'los ') + entero(c.parla) + ' que tiene</span>';
    }
    art.appendChild(el('p', 'ind__titular', titular));

    const sr = el('p', 'oculto');
    sr.textContent = NOMBRE_REF + ' tiene ' + cantidad(c, c.parla) + ' y ' + NOMBRE[AQUI] +
      ' tiene ' + cantidad(c, c.otra) + '. Medido sobre la ' + c.base.corto + '. Con la proporción de ' +
      NOMBRE[AQUI] + ', Parla tendría ' + cantidad(c, c.tendria, 1) + '.';
    art.appendChild(sr);

    /* La tira es un cuadrado por unidad: no hay tira de metros cuadrados. */
    if (!esSuperficie(c) && !sobra && c.parla + c.falta <= 400) art.appendChild(tira(c.parla, c.falta));

    art.appendChild(tasas(c));

    if (!sobra && !esSuperficie(c) && i.enTotal !== false) art.appendChild(huecos(c));
    if (sobra && c.lista && c.lista.length && c.lista.length <= 10) {
      art.appendChild(el('p', 'ind__nota', 'En Parla: ' + c.lista.join(' · ') + '.'));
    }

    /* La nota del giro solo es verdad donde el divisor le da la vuelta: con la
       población total Parla saldría bien, con la de su edad sale mal. */
    const gira = i.notaGiro && c.faltaTotal <= UMBRAL && c.falta > UMBRAL;
    const nota = gira ? i.notaGiro : i.nota;
    if (nota) art.appendChild(el('p', 'ind__nota', texto(nota)));
    art.appendChild(pieFuente([i.fuenteId, c.base.fuenteId].concat(
      i.limitesFuenteId ? [[i.limitesFuenteId, 'Límites municipales: ']] : [])));
    art.appendChild(botonCartel(c, modo));
    return art;
  }

  /* La ficha del hospital: sin tasa, porque un hospital no se reparte. Aquí
     los huecos sí tienen nombre: son unidades que el otro hospital declara y
     el de Parla no. */
  function fichaCartera(art, c, modo) {
    const i = c.ind;
    const sobra = modo === 'sobra';
    let titular;
    if (sobra) {
      titular = 'Tiene <span class="cifra">' + c.soloParla.length + '</span> <span class="resto">' +
        (c.otra ? 'unidades que no tiene el ' + c.nombre : 'unidades donde ' + NOMBRE[AQUI] +
        ' no tiene hospital público') + '</span>';
    } else {
      titular = 'Le faltan <span class="cifra">' + c.lista.length + '</span> <span class="resto">' +
        'unidades que sí tiene el ' + c.nombre + '</span>';
    }
    art.appendChild(el('p', 'ind__titular', titular));

    /* Por ciudad y no por hospital: Móstoles tiene dos y se suman sus carteras. */
    const cuenta = c.otra
      ? 'Unidades asistenciales declaradas: ' + c.parla + ' en ' + NOMBRE_REF + ', ' + c.otra +
        ' en ' + NOMBRE[AQUI] + '.'
      : NOMBRE[AQUI] + ' no tiene hospital público. En ' + NOMBRE_REF + ', el ' +
        D.hospitales[REF].nombre + ' declara ' + c.parla + ' unidades asistenciales.';
    const sr = el('p', 'oculto');
    sr.textContent = cuenta + (c.lista.length ? ' ' + c.lista.length + ' no están en ' + NOMBRE_REF + '.' : '');
    art.appendChild(sr);

    if (!sobra) art.appendChild(tira(c.parla, c.lista.length));
    art.appendChild(el('p', 'ind__nota', cuenta));

    const cont = el('div', 'nombres-bloque');
    if (c.lista.length) {
      cont.appendChild(el('p', 'nombres__rot nombres__rot--falta', 'Lo que falta en el ' +
        D.hospitales[REF].nombre.replace(/^Hospital Universitario /, '')));
      const ul = el('ul', 'nombres');
      c.lista.forEach(function (n) { ul.appendChild(filaNombre(n, 'nombre--hueco nombre--nombrado')); });
      cont.appendChild(ul);
    }
    if (c.soloParla.length) {
      cont.appendChild(el('p', 'nombres__rot nombres__rot--sobra',
        c.lista.length ? 'Y al revés: lo que solo tiene Parla' : 'Lo que tiene Parla'));
      const ul = el('ul', 'nombres');
      c.soloParla.forEach(function (n) { ul.appendChild(filaNombre(n, 'nombre--sobra')); });
      /* Sin hospital en la otra son las 54 unidades de Parla: se pliegan. */
      if (c.soloParla.length > 8) {
        const det = el('details', 'plegable');
        det.appendChild(el('summary', null, 'Ver las ' + c.soloParla.length + ' unidades'));
        det.appendChild(ul);
        cont.appendChild(det);
      } else {
        cont.appendChild(ul);
      }
    }
    art.appendChild(cont);

    art.appendChild(el('p', 'ind__nota', texto(i.nota)));
    art.appendChild(pieFuente([i.fuenteId]));
    art.appendChild(botonCartel(c, modo));
    return art;
  }

  /* ── Portada ──────────────────────────────────────────────────────── */

  /* Los atajos a las otras páginas: un icono, el nombre corto y la flecha. */
  const ICONO_PAGINA = {
    tren: '<svg class="compartir__icono" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="6" y="3" width="12" height="14" rx="3"/>' +
      '<path d="M6 10h12"/><circle cx="9.5" cy="13.5" r=".9" fill="currentColor"/><circle cx="14.5" cy="13.5" r=".9" fill="currentColor"/>' +
      '<path d="M8.5 17 6.5 21M15.5 17l2 4"/></svg>',
    casa: '<svg class="compartir__icono" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/>' +
      '<path d="M10 20v-5.5h4V20"/></svg>',
    tabla: '<svg class="compartir__icono" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/>' +
      '<path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/></svg>',
    cruz: '<svg class="compartir__icono" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"/></svg>',
    libro: '<svg class="compartir__icono" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/>' +
      '<path d="M12 6.5v13"/></svg>',
    euro: '<svg class="compartir__icono" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M17.5 6.5A7 7 0 1 0 17.5 17.5"/>' +
      '<path d="M4 10.5h9M4 13.5h9"/></svg>'
  };
  const FLECHA = '<svg class="compartir__flecha" width="16" height="12" viewBox="0 0 16 12" ' +
        'fill="none" aria-hidden="true"><path d="M1 6h13M9.5 1l5 5-5 5" stroke="currentColor" stroke-width="1.8"/></svg>';

  function portada() {
    $('#pob-a').textContent = entero(D.BASES.total.valores[REF]);
    $('#pob-b').textContent = entero(D.BASES.total.valores[AQUI]);

    const hueco = $('#portada-cartel');
    vaciar(hueco);
    hueco.appendChild(botonCartelGeneral());
    /* Y el atajo a la página de los accesos, que si no queda al final */
    if ((window.ACCESOS || {}).ciudades) {
      const a = el('a', 'compartir compartir--salir');
      a.id = 'portada-salir';
      a.href = RUTAS ? RAIZ_WEB + AQUI + '/infraestructura/' : 'infraestructura.html#' + AQUI;
      a.innerHTML = ICONO_PAGINA.tren + '<span>Infraestructuras</span>' + FLECHA;
      hueco.appendChild(a);
    }
    if ((window.VIVIENDA || {}).ciudades) {
      const v = el('a', 'compartir compartir--salir');
      v.id = 'portada-vivienda';
      v.href = RUTAS ? RAIZ_WEB + AQUI + '/vivienda/' : 'vivienda.html#' + AQUI;
      v.innerHTML = ICONO_PAGINA.casa + '<span>Vivienda</span>' + FLECHA;
      hueco.appendChild(v);
    }
    if (window.ECONOMIA) {
      const e = el('a', 'compartir compartir--salir');
      e.id = 'portada-economia';
      e.href = RUTAS ? RAIZ_WEB + AQUI + '/economia/' : 'economia.html#' + AQUI;
      e.innerHTML = ICONO_PAGINA.euro + '<span>Economía</span>' + FLECHA;
      hueco.appendChild(e);
    }
    if (window.SANIDAD) {
      const s = el('a', 'compartir compartir--salir');
      s.id = 'portada-sanidad';
      s.href = RUTAS ? RAIZ_WEB + AQUI + '/sanidad/' : 'sanidad.html#' + AQUI;
      s.innerHTML = ICONO_PAGINA.cruz + '<span>Sanidad</span>' + FLECHA;
      hueco.appendChild(s);
    }
    if (window.INFANTIL) {
      const e = el('a', 'compartir compartir--salir');
      e.id = 'portada-educacion';
      e.href = RUTAS ? RAIZ_WEB + AQUI + '/educacion/' : 'educacion.html#' + AQUI;
      e.innerHTML = ICONO_PAGINA.libro + '<span>Educación</span>' + FLECHA;
      hueco.appendChild(e);
    }
    /* Y la consulta de todos los datos, que es de las once a la vez. */
    const todos = el('a', 'compartir compartir--salir');
    todos.href = (RUTAS ? RAIZ_WEB : '') + 'consulta.html';
    todos.innerHTML = ICONO_PAGINA.tabla + '<span>Todos los datos</span>' + FLECHA;
    hueco.appendChild(todos);

    /* "Y tendríamos 7 menos en educación, donde estamos mejor." Las áreas, y
       no los servicios uno a uno, porque en la portada no cabe una lista. */
    const gana = $('#gana-portada');
    const sobra = Math.round(SOBRA);
    if (sobra > 0) {
      const areas = [];
      sobranEnTotal().forEach(function (c) {
        const k = c.ind.grupo.toLowerCase();
        if (areas.indexOf(k) < 0) areas.push(k);
      });
      gana.textContent = 'Y tendríamos ' + sobra + ' menos en ' + areas.join(' y ') +
        ', donde estamos mejor.';
    } else {
      gana.textContent = '';
    }

    /* Lo que hay en Parla, en negro, y detrás un hueco por cada cosa que falta. */
    const marcas = Math.round(TOTAL);
    const rejilla = $('#rejilla');
    vaciar(rejilla);
    rejilla.className = 'marcador__rejilla';
    const t = tira(TIENE, marcas);
    t.querySelectorAll('.u--hueco').forEach(function (u, i) {
      u.style.setProperty('--retraso', 300 + i * 30 + 'ms');
    });
    rejilla.appendChild(t);
    $('#rejilla-ley').innerHTML = '<span class="ley ley--hay"></span>' + TIENE + ' que hay ' +
      '<span class="ley ley--hueco"></span>' + marcas + ' que faltan';

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


  /* La cuenta, hecha delante del lector con números reales. En prosa no se
     seguía: faltaba ver las dos poblaciones una al lado de otra. */
  function comoSeLee() {
    const caja = $('#como-se-lee');
    vaciar(caja);

    let c = null;
    for (let i = 0; i < faltan.length; i++) {
      if (faltan[i].ind.id === 'bibliotecas') { c = faltan[i]; break; }
    }
    if (!c) c = faltan.filter(function (x) { return x.otra > 0 && x.parla > 1 && !esSuperficie(x) && !esCartera(x); })[0];
    if (!c) { caja.hidden = true; return; }
    caja.hidden = false;

    const g = c.ind.gen || 'm';
    const etiqueta = c.base.etiqueta.charAt(0).toUpperCase() + c.base.etiqueta.slice(1);

    caja.appendChild(el('p', 'lee__rot', 'Cómo se hace la cuenta'));

    const tabla = el('div', 'lee__tabla');
    const cab = el('div', 'lee__fila lee__fila--cab');
    cab.appendChild(el('span', 'lee__et', ''));
    cab.appendChild(el('span', 'lee__v', NOMBRE[AQUI]));
    cab.appendChild(el('span', 'lee__v', NOMBRE_REF));
    tabla.appendChild(cab);

    [[etiqueta, entero(c.baseOtra), entero(c.baseParla)],
     [c.ind.titulo, entero(c.otra), entero(c.parla)],
     [etiqueta + ' por ' + c.ind.sing,
      cadaCuantos(c.otra, c.baseOtra), cadaCuantos(c.parla, c.baseParla)]
    ].forEach(function (f, i) {
      const fila = el('div', 'lee__fila' + (i === 2 ? ' lee__fila--clave' : ''));
      fila.appendChild(el('span', 'lee__et', f[0]));
      fila.appendChild(el('span', 'lee__v', f[1]));
      fila.appendChild(el('span', 'lee__v', f[2]));
      tabla.appendChild(fila);
    });
    caja.appendChild(tabla);

    caja.appendChild(el('p', 'lee__txt',
      'En ' + NOMBRE[AQUI] + ' hay <b>' + uno[g] + ' ' + c.ind.sing + ' por cada ' +
      cadaCuantos(c.otra, c.baseOtra) + ' ' + c.base.etiqueta + '</b>. ' + NOMBRE_REF +
      ' tiene ' + entero(c.baseParla) + ', así que con esa proporción le corresponderían <b>' +
      num(c.tendria, 1) + '</b>. Tiene <b>' + entero(c.parla) + '</b>. Le faltan ' +
      '<b class="lee__dif">' + num(c.falta) + '</b>, y así sale cada línea del recuento.'));
  }

  function filaRecuento(c, modo) {
    const i = c.ind;
    const li = el('li', 'rec' + (modo ? ' rec--' + modo : ''));
    const a = el('a', 'rec__a');
    a.href = '#ind-' + i.id;
    a.appendChild(icono(ICONO[i.id], 'rec__ico'));
    a.appendChild(el('span', 'rec__q', i.titulo));
    a.appendChild(el('span', 'rec__n', modo === 'sobra'
      ? '+' + cantidad(c, -c.falta) : esCartera(c) ? String(c.falta) : cantidad(c, c.falta)));
    li.appendChild(a);
    return li;
  }

  function sumaFalta(lista) {
    return lista.reduce(function (t, c) {
      return t + (c.ind.enTotal === false ? 0 : c.falta);
    }, 0);
  }

  /* El orden en que se lee lo que falta: por áreas, primero la que más le
     falta, y dentro de cada una como vengan ordenadas. Lo calcula una sola
     función para que el recuento de arriba y las fichas de abajo no puedan
     acabar contando lo mismo en distinto orden. */
  function porAreas() {
    const areas = [];
    const mapa = {};
    const aparte = {};
    faltan.forEach(function (c) {
      const k = c.ind.grupo;
      if (c.ind.enTotal === false) { (aparte[k] = aparte[k] || []).push(c); return; }
      if (!mapa[k]) { mapa[k] = []; areas.push(k); }
      mapa[k].push(c);
    });
    areas.sort(function (x, y) { return sumaFalta(mapa[y]) - sumaFalta(mapa[x]); });

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

    const cols = el('div', 'rec__columnas');
    cols.appendChild(el('span', null, 'Le faltan'));
    cont.appendChild(cols);

    /* Agrupado por área, con su subtotal: un recuento se lee por bloques,
       no como una lista de quince cosas seguidas. */
    const g = porAreas();
    g.areas.forEach(function (k) {
      const lista = g.mapa[k];
      const bloque = el('div', 'area');
      const cab = el('div', 'area__cab');
      cab.appendChild(el('h3', 'area__q', k));
      cab.appendChild(el('span', 'area__n', num(sumaFalta(lista))));
      bloque.appendChild(cab);
      const ul = el('ul', 'area__filas');
      lista.forEach(function (c) { ul.appendChild(filaRecuento(c, null)); });
      bloque.appendChild(ul);
      cont.appendChild(bloque);
    });

    /* Lo que no suma: lo que falta en su propia unidad, y el dinero. */
    const extra = [];
    g.orden.forEach(function (c) {
      if (c.ind.enTotal !== false) return;
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo,
        n: esCartera(c) ? String(c.falta) : cantidad(c, c.falta), modo: 'aparte', href: '#ind-' + c.ind.id });
    });

    /* Lo que el ayuntamiento invierte y gasta, en euros al año: la misma cuenta
       que todo lo demás, y en su ficha de «Detrás de todo, el dinero». */
    D.contexto.dinero.filter(function (s) { return s.alAnio; }).reverse().forEach(function (s) {
      const a = alAnio(s);
      extra.push({
        ico: 'euro',
        q: (s.id === 'inversion' ? 'Inversión' : 'Gasto') + ' municipal al año',
        n: a.igual ? '≈' : (a.dif < 0 ? '+' : '') + num(Math.abs(a.dif) / 1e6, 1) + ' M€',
        modo: a.dif < 0 && !a.igual ? 'sobra' : 'aparte',
        href: '#dinero-' + s.id
      });
    });
    /* Un empate fuera del recuento también se enseña: que no salga nada daría
       a entender que no se ha medido. */
    empates.forEach(function (c) {
      if (c.ind.enTotal !== false) return;
      extra.push({ ico: ICONO[c.ind.id], q: c.ind.titulo, n: '≈', modo: 'aparte',
        href: '#lista-faltan' });
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

    /* Y donde Parla tiene más, también en el recuento, en verde y con signo. */
    if (sobran.length) {
      const bloque = el('div', 'area area--sobra');
      const cab = el('div', 'area__cab');
      cab.appendChild(el('h3', 'area__q', 'Donde Parla tiene más'));
      if (Math.round(SOBRA) > 0) cab.appendChild(el('span', 'area__n', '+' + num(SOBRA)));
      bloque.appendChild(cab);
      const ul = el('ul', 'area__filas');
      sobran.forEach(function (c) { ul.appendChild(filaRecuento(c, 'sobra')); });
      bloque.appendChild(ul);
      cont.appendChild(bloque);
    }

    /* Lo que falta y, al lado, lo que sobra. El neto se da restando los dos
       números ya redondeados, para que la cuenta cuadre a la vista. */
    const f = Math.round(TOTAL);
    const s = Math.round(SOBRA);
    $('#resumen-total').innerHTML = s > 0
      ? 'A Parla le faltan <b>' + f + ' equipamientos</b> y tiene <b class="gana">' + s +
        '</b> de más: ' + (f - s) + ' menos en neto.'
      : 'A Parla le faltan <b>' + f + ' equipamientos</b> en total.';
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
    filas.push({ q: NOMBRE_REF, v: s.valores[REF], quien: 'referencia' });
    filas.push({ q: NOMBRE[AQUI], v: s.valores[AQUI], quien: 'aqui' });
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

  /* Importes grandes en millones. En los flujos anuales, los pequeños se
     redondean al millar; los saldos pequeños se pueden conservar exactos. */
  function enEuros(e, redondearMiles) {
    if (e >= 1e6) return num(e / 1e6, 1) + ' millones de euros';
    return entero(redondearMiles === false ? e : Math.round(e / 1000) * 1000) + ' euros';
  }

  /* La tasa por habitante de la otra ciudad por la población de Parla: lo que
     el ayuntamiento de Parla gastaría o invertiría al año a ese ritmo. */
  function alAnio(s) {
    const pob = D.BASES.total.valores[REF];
    const dif = (s.valores[AQUI] - s.valores[REF]) * pob;   /* > 0, le falta a Parla */
    return { dif: dif, igual: Math.abs(dif) < s.valores[REF] * pob * 0.01 };
  }

  function titularAnual(s) {
    const a = alAnio(s);
    const t = el('p', 'plata__titular');
    if (a.igual) {
      t.innerHTML = 'Con ' + s.alAnio.con + ' de ' + NOMBRE[AQUI] + ', ' + NOMBRE_REF +
        ' se quedaría prácticamente igual.';
    } else {
      t.innerHTML = 'Con ' + s.alAnio.con + ' de ' + NOMBRE[AQUI] + ', ' + NOMBRE_REF + ' ' +
        s.alAnio.verbo + ' <span class="cifra">' + enEuros(Math.abs(a.dif)) + '</span> ' +
        (a.dif > 0 ? 'más' : 'menos') + ' al año.';
    }
    return t;
  }

  /* Solo el resumen: inversión y gasto en euros al año, con su cartel, y el
     saldo de deuda. Las demás series, y lo que describe a los vecinos, van
     en economia.html. */
  function dinero() {
    const arriba = $('#dinero-cuerpo');
    vaciar(arriba);
    const series = D.contexto.dinero.filter(function (s) { return s.portada; });
    const destacadas = series.filter(function (s) { return s.alAnio; }).reverse();
    const saldos = series.filter(function (s) { return s.saldoEuros; });
    destacadas.concat(saldos).forEach(function (s) {
      const cont = arriba;
      const art = el('article', 'plata' + (s.saldoEuros ? ' plata--saldo' : ''));
      art.id = 'dinero-' + s.id;
      const hs = el('h3', 'plata__h', s.titulo);
      const sen = window.SENTIDO && window.SENTIDO.de('dinero-' + s.id);
      if (sen) hs.dataset.sentido = sen;
      art.appendChild(hs);
      /* Donde a una ciudad le faltan años, su pie lo dice. */
      art.appendChild(el('p', 'plata__pie', (s.pieCiudad && s.pieCiudad[AQUI]) || s.pie));
      if (s.alAnio) art.appendChild(titularAnual(s));
      if (s.saldoEuros) {
        art.appendChild(el('p', 'plata__titular', NOMBRE_REF + ' debe <span class="cifra">' +
          enEuros(s.saldoEuros[REF], false) + '</span>. ' + NOMBRE[AQUI] + ' debe ' +
          enEuros(s.saldoEuros[AQUI], false) + '.'));
      }
      /* Los decimales, los que trae la fuente; sin indicarlos, la cifra tal cual. */
      const cifra = function (v) {
        return s.decimales != null ? num(v, s.decimales) : s.saldoEuros ? num(v, 2) : entero(v);
      };
      art.appendChild(filasDinero(s, s.unidad === '%'
        ? function (v) { return num(v, s.decimales != null ? s.decimales : 2) + ' %'; }
        : function (v) { return cifra(v) + ' €'; }));
      /* Cada serie de extra da a la nota {claveRef} y {claveAqui}. */
      const huecos = {};
      Object.keys(s.extra || {}).forEach(function (k) {
        huecos[k + 'Aqui'] = cifra(s.extra[k][AQUI]);
        huecos[k + 'Ref'] = cifra(s.extra[k][REF]);
      });
      art.appendChild(el('p', 'renta__nota', texto(s.nota, huecos)));
      art.appendChild(pieFuente([s.fuenteId].concat(s.masFuentes || [], s.saldoEuros
        ? [D.BASES.total.fuenteId, ['deudaMetodo', 'Definición: ']] : [])));
      if (s.alAnio && !alAnio(s).igual) art.appendChild(botonCartel({ dinero: s }, null));
      cont.appendChild(art);
    });
    const imp = D.contexto.impuestosDirectos;
    $('#dinero-cierre').textContent = texto(D.contexto.dineroNota, {
      impuestosAqui: entero(imp[AQUI]), impuestosRef: entero(imp[REF])
    });
    const ir = RUTAS ? RAIZ_WEB + AQUI + '/economia/' : 'economia.html#' + AQUI;
    $('#dinero-ir').href = ir;
    const atajo = $('#portada-economia');
    if (atajo) atajo.href = ir;
  }

  /* Qué parte de la población tiene cada edad, una ciudad al lado de la otra.
     Numerador y denominador salen de la misma operación del INE (la de edad
     año a año), así que los porcentajes no mezclan fuentes. Todas las barras
     comparten escala: un tramo pequeño se ve pequeño. */
  function edades() {
    const e = D.contexto.edades;
    const cont = $('#edades');
    vaciar(cont);

    cont.appendChild(el('p', 'edades__ley', 'Qué parte de la población tiene cada edad'));

    const pct = function (t, m) { return (t.valores[m] / e.total[m]) * 100; };
    let tope = 0;
    e.tramos.forEach(function (t) { tope = Math.max(tope, pct(t, AQUI), pct(t, REF)); });

    const graf = el('div', 'edades__grafico');
    e.tramos.forEach(function (t) {
      const tramo = el('div', 'edad');
      tramo.appendChild(el('p', 'edad__q', t.etiqueta));
      [REF, AQUI].forEach(function (m) {
        const v = pct(t, m);
        const fila = el('div', 'tasa');
        fila.dataset.quien = m === REF ? 'referencia' : 'aqui';
        fila.appendChild(el('span', 'tasa__quien', NOMBRE[m]));
        const pista = el('span', 'tasa__pista');
        const barra = el('i');
        barra.style.setProperty('--v', (v / tope).toFixed(4));
        pista.appendChild(barra);
        fila.appendChild(pista);
        fila.appendChild(el('span', 'tasa__valor', num(v, 1) + ' %'));
        tramo.appendChild(fila);
      });
      graf.appendChild(tramo);
    });
    cont.appendChild(graf);

    cont.appendChild(el('p', 'renta__nota', texto(e.nota)));
    cont.appendChild(pieFuente([e.fuenteId]));
  }

  /* Cuánto suelo hay que repartir. Parla es la más pequeña de los once y la más
     densa, y eso ayuda a leer el resto: la comparación es por habitante, no por
     kilómetro cuadrado. */
  function tamano() {
    const s = D.contexto.superficie.valores;
    const cont = $('#tamano');
    vaciar(cont);
    const ids = Object.keys(NOMBRE);
    const pob = D.BASES.total.valores;
    const dens = function (m) { return pob[m] / s[m]; };

    let t = NOMBRE_REF + ' reparte sus ' + entero(pob[REF]) + ' habitantes en ' +
      num(s[REF], 1) + ' km², ' + entero(Math.round(dens(REF))) + ' por kilómetro cuadrado; ' +
      NOMBRE[AQUI] + ' reparte los suyos en ' + num(s[AQUI], 1) + ' km², ' +
      entero(Math.round(dens(AQUI))) + '.';
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
    /* Lo que va aparte por su unidad (camas, alumnos…) y lo que va aparte por
       otro motivo, que lo dice su propia frase (las farmacias). */
    const unidades = [];
    const porQue = [];
    fuera.forEach(function (c) {
      if (c.ind.porQueFuera) { if (porQue.indexOf(c.ind.porQueFuera) < 0) porQue.push(c.ind.porQueFuera); return; }
      if (unidades.indexOf(c.ind.mide) < 0) unidades.push(c.ind.mide);
    });
    const en = unidades.length > 1
      ? unidades.slice(0, -1).join(', ') + ' o ' + unidades[unidades.length - 1]
      : unidades[0];
    let cortado = false, area = null;
    lista.forEach(function (c, n) {
      if (!cortado && c.ind.enTotal === false && n > 0) {
        cortado = true;
        const sep = el('div', 'separador');
        sep.id = 'fuera-' + modo;
        sep.dataset.indiceSub = 'Fuera del recuento';
        sep.appendChild(el('h3', 'separador__h', 'Fuera del recuento'));
        sep.appendChild(el('p', 'separador__p', (unidades.length
          ? arranque + ': se mide en ' + en + '.' + (porQue.length ? ' ' : '')
          : arranque + '. ') + porQue.join(' ')));
        env.appendChild(sep);
      }
      const art = bloqueIndicador(c, modo);
      /* La primera ficha de cada área es un apartado del índice (assets/indice.js) */
      if (!cortado && c.ind.grupo !== area) { area = c.ind.grupo; art.dataset.indiceSub = area; }
      env.appendChild(art);
    });
  }

  function listas() {
    const lf = $('#lista-faltan');
    vaciar(lf);
    const env = el('div', 'env');
    fichasConSeparador(env, porAreas().orden, 'falta',
      'No suma a los ' + Math.round(TOTAL) + ' de la portada');
    if (empates.length) {
      const art = el('article', 'ind');
      art.id = 'ind-empates';
      art.appendChild(el('p', 'ind__grupo', 'Empate técnico'));
      art.appendChild(el('h3', 'ind__h', 'Y en esto las dos ciudades están igual'));
      const ul = el('ul', 'pendientes');
      empates.forEach(function (c) {
        ul.appendChild(el('li', null, c.ind.titulo + ' — ' + NOMBRE_REF + ' ' +
          cantidad(c, c.parla) + ', ' + NOMBRE[AQUI] + ' ' + cantidad(c, c.otra) + ' (diferencia: ' +
          (esSuperficie(c) ? enSuperficie(Math.abs(c.falta)) : num(Math.abs(c.falta), 2)) + ')'));
      });
      art.appendChild(ul);
      env.appendChild(art);
    }
    lf.appendChild(env);

    const ls = $('#lista-sobran');
    vaciar(ls);
    const env2 = el('div', 'env');
    $('#sobran-intro').textContent = sobran.length
      ? 'Hay servicios en los que ' + NOMBRE_REF + ' está por encima de ' + NOMBRE[AQUI] +
        ' una vez ajustada la población de referencia. También se dicen. Con la proporción de ' +
        NOMBRE[AQUI] + ', Parla tendría menos de esto.'
      : 'Ninguno. De todos los servicios medidos, no hay uno solo en el que ' + NOMBRE_REF +
        ' esté por encima de ' + NOMBRE[AQUI] + '.';
    fichasConSeparador(env2, sobran, 'sobra', Math.round(SOBRA) > 0
      ? 'No suma a los ' + Math.round(SOBRA) + ' que tiene de más'
      : 'No suma al recuento');
    ls.appendChild(env2);
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
      NOMBRE_REF + ' ' + entero(D.BASES.total.valores[REF]) + ' habitantes, ' +
      NOMBRE[AQUI] + ' ' + entero(D.BASES.total.valores[AQUI]);
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
      const nodos = document.querySelectorAll('#lista-faltan .ind[data-falta]');
      for (let i = 0; i < nodos.length; i++) {
        if (nodos[i].getBoundingClientRect().top < corte) suma += parseFloat(nodos[i].dataset.falta);
      }
      /* Se apaga donde deja de sumar: en el separador, o donde Parla tiene más
         si no hay nada fuera del recuento. Se busca cada vez porque cambiar de
         ciudad vuelve a pintar la lista. */
      const fin = document.querySelector('#lista-faltan .separador') || $('#sobran');
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

  /* La barra de direcciones enseña /getafe/ y no /#getafe: es el enlace que se
     copia, y solo /getafe/ tiene su propia vista previa en WhatsApp (la página
     que genera el build, herramientas/compartir.mjs, y que devuelve aquí con el
     «#»). Esas páginas solo existen en lo publicado, que el build marca con
     data-rutas; abierta desde la carpeta, se queda el «#». */
  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const RAIZ_WEB = location.pathname.replace(/[^/]*$/, '');   /* antes de tocarla */
  function enlace() {
    if (!history.replaceState) { location.hash = AQUI; return; }
    history.replaceState(null, '', RUTAS ? RAIZ_WEB + AQUI + '/' : '#' + AQUI);
  }

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
    /* Los nombres largos («Majadahonda») van más pequeños para caber en un móvil. */
    document.querySelector('.portada__titulo .t3').dataset.largo = NOMBRE[AQUI].length > 9 ? '1' : '0';

    sel.addEventListener('change', function () {
      AQUI = sel.value;
      try { localStorage.setItem('municipio', AQUI); } catch (e) { /* sin almacenamiento */ }
      enlace();
      $('#sel-texto').textContent = NOMBRE[AQUI];
      /* Los nombres largos («Majadahonda») van más pequeños para caber en un móvil. */
      document.querySelector('.portada__titulo .t3').dataset.largo = NOMBRE[AQUI].length > 9 ? '1' : '0';
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
     Un cartel por indicador, con formato de anuncio: la cifra, lo que le
     falta a Parla y un QR a la web. El PDF lo hace el propio navegador desde el
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

  /* La tira de unidades: un hueco por equipamiento que le falta a Parla. Es
     lo que en la portada se ve aparecer, aquí ya terminado y en tamaño de
     imprenta. El lado lo fija quien la monta, en --ku. */
  function tiraUnidades(cuantos) {
    const r = el('div', 'krejilla');
    for (let i = 0; i < cuantos; i++) {
      const u = el('span', 'ku');
      u.innerHTML = HUECO;
      r.appendChild(u);
    }
    return r;
  }

  /* El hueco, el mismo de la web: esquina corta y un trazo largo centrado en
     cada lado, en rojo. Va en SVG para que imprima igual que se ve. */
  const HUECO =
    '<svg viewBox="0 0 15 15" fill="none" stroke="#c02719" stroke-width="1.5" aria-hidden="true" focusable="false">' +
    '<path d="M.75 4.25V3.75a3 3 0 0 1 3-3H4.25M10.75 .75h0.5a3 3 0 0 1 3 3V4.25M14.25 10.75v0.5a3 3 0 0 1-3 3H10.75' +
    'M4.25 14.25H3.75a3 3 0 0 1-3-3V10.75M5.5 .75H9.5M14.25 5.5V9.5M9.5 14.25H5.5M.75 9.5V5.5"/></svg>';

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

  /* Los dos fondos (medio mega) se piden cuando alguien va a por un
     cartel: al pasar por un botón o llegar a él con el teclado. Antes de
     imprimir se espera a que estén, que a medio cargar saldrían en blanco. */
  const FONDOS = ['papel', 'barrio'];
  /* La ruta se resuelve ya, al cargar: luego la barra de direcciones pasa a
     /getafe/ y una ruta relativa se iría a buscar a /getafe/assets/. */
  const CARTEL = new URL('assets/cartel/', location.href).href;
  let precargados = false;
  function precargar(e) {
    if (precargados || !e.target.closest || !e.target.closest('.compartir, .fondos')) return;
    precargados = true;
    FONDOS.forEach(function (f) { (new Image()).src = CARTEL + f + '.jpg'; });
  }
  ['pointerover', 'focusin', 'touchstart'].forEach(function (t) { document.addEventListener(t, precargar, { passive: true }); });

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
    img.src = CARTEL + fondo + '.jpg';
    img.alt = '';
    raiz.appendChild(img);

    const capa = el('div', 'kcapa');
    capa.appendChild(el('p', 'kpre', pre ||
      'Si en ' + NOMBRE_REF + ' viviéramos como en ' + NOMBRE[AQUI]));
    raiz.appendChild(capa);
    return capa;
  }

  /* Titular corto y siempre con la misma forma: cifra, servicio, «más».
     El rojo lo lleva el servicio, como en los carteles de barrio. */
  function titularCartel(capa, cifra, servicio, sobra) {
    const tit = el('h1', 'ktit');
    tit.appendChild(el('span', 'ktit__n', cifra));
    tit.appendChild(el('span', 'ktit__q', servicio));
    tit.appendChild(el('span', 'ktit__m', sobra ? 'menos' : 'más'));
    capa.appendChild(tit);
    return tit;
  }

  /* Banda inferior: el cuadro blanco de la referencia es el QR. */
  function bandaCartel(raiz) {
    const banda = el('div', 'kbanda');
    const qr = qrSvg();
    if (qr) banda.appendChild(qr);
    const txt = el('div', 'kbanda__txt');
    txt.appendChild(el('p', 'kbanda__h', D.NOMBRE_WEB.replace(', ', ',<br>')));
    txt.appendChild(el('span', 'kbanda__raya'));
    txt.appendChild(el('p', 'kbanda__url', 'siyovivieracomoenparla.netlify.app'));
    banda.appendChild(txt);
    raiz.appendChild(banda);
  }

  function cartelIndicador(c, modo) {
    const sobra = modo === 'sobra';
    const cuantos = Math.abs(c.falta);
    const raiz = $('#cartel');
    const fondo = fondoElegido();
    const capa = montarCartel(raiz, fondo);
    const tit = titularCartel(capa, esSuperficie(c)
      ? enSuperficie(cuantos, cifraElegida() === 'redonda')
      : esCartera(c) ? entero(cuantos) : cifraCartel(cuantos), c.ind.titulo, sobra);

    /* Fila de cajas: del hospital, las unidades que faltan, con su nombre y en
       hueco; de lo demás, las dos tasas, Parla primero. */
    const fila = el('ul', 'kcajas');
    if (esCartera(c) && !sobra && c.lista.length) {
      const tope = fondo === 'barrio' ? 4 : 8;
      c.lista.slice(0, tope).forEach(function (x) {
        const li = el('li', 'kcaja kcaja--hueco');
        const t = el('span', 'kcaja__t');
        t.textContent = x;
        li.appendChild(t);
        fila.appendChild(li);
      });
      if (c.lista.length > tope) fila.appendChild(el('li', 'kcaja', 'y ' + (c.lista.length - tope) + ' más'));
    } else if (esCartera(c)) {
      fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
        c.parla + ' unidades asistenciales'));
      fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
        (c.otra ? c.otra + ' unidades asistenciales' : 'sin hospital público')));
    } else if (esSuperficie(c)) {
      fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
        num(c.tasaParla, 1) + ' m² por habitante'));
      fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
        num(c.tasaOtra, 1) + ' m² por habitante'));
    } else {
      const u = entero(c.base.por) + ' ' + c.base.etiqueta;
      fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
        numTasa(c.tasaParla) + ' por cada ' + u));
      fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
        numTasa(c.tasaOtra) + ' por cada ' + u));
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
      'Si ' + NOMBRE_REF + ' ' + s.alAnio.si + ' como ' + NOMBRE[AQUI]);
    const cifra = cifraElegida() === 'exacta' || a.dif < 1e7
      ? num(Math.abs(a.dif) / 1e6, 1) : entero(Math.round(Math.abs(a.dif) / 1e6));
    const tit = titularCartel(capa, cifra + ' M€',
      (s.id === 'inversion' ? 'de inversión' : 'de gasto') + ' al año', a.dif < 0);
    const fila = el('ul', 'kcajas');
    fila.appendChild(el('li', 'kcaja kcaja--ref', '<b>' + NOMBRE_REF + '</b>' +
      entero(s.valores[REF]) + ' € por habitante'));
    fila.appendChild(el('li', 'kcaja', '<b>' + NOMBRE[AQUI] + '</b>' +
      entero(s.valores[AQUI]) + ' € por habitante'));
    fila.dataset.n = '2';
    capa.appendChild(fila);
    bandaCartel(raiz);
    ajustarTitular(raiz, tit, fondo);
  }

  /* El cartel de la situación general: la misma composición, con el total del
     recuento en el titular y, debajo, cada área con su cifra y su fila de
     huecos —uno por equipamiento que falta—, para que se vea dónde. Las
     cifras se reparten en enteros para que sumen el titular. */
  function cartelGeneral() {
    const raiz = $('#cartel');
    const fondo = fondoElegido();
    const capa = montarCartel(raiz, fondo);
    const total = Math.round(TOTAL);
    const tit = titularCartel(capa, entero(total),
      'equipamientos y servicios públicos', false);

    const g = porAreas();
    const cuantos = repartoEntero(
      g.areas.map(function (k) { return sumaFalta(g.mapa[k]); }), total);

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
      im.src = CARTEL + f + '.jpg';
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
    document.title = 'Parla como ' + NOMBRE[AQUI] + ' · ' +
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
    const fondo = document.querySelector('.cartel--afiche .kfondo');
    const listo = fondo && fondo.decode ? fondo.decode().catch(function () {}) : Promise.resolve();
    listo.then(function () {
      window.print();
      setTimeout(limpiar, 1500);   /* Safari no siempre dispara afterprint */
    });
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

  /* El botón de la portada: el mismo cartel, con el total. Lleva el hueco
     en rojo, que es la marca de lo que falta. */
  function botonCartelGeneral() {
    const b = el('button', 'compartir compartir--general');
    b.type = 'button';
    b.title = 'Genera un cartel A4 con el total, listo para imprimir o guardar en PDF';
    b.appendChild(icono('hueco', 'compartir__ico'));
    b.appendChild(el('span', null, 'Cartel de la situación general'));
    b.addEventListener('click', function () { compartir('general', null); });
    return b;
  }


  /* ── Salir de la ciudad: el resumen de infraestructura.html ──────────
     Los datos los escribe herramientas/infraestructura.py; aquí solo se
     enseña la puerta más usada de cada ciudad y se manda a la página. */
  function salir() {
    const A = (window.ACCESOS || {}).ciudades;
    const caja = $('#salir');
    if (!A || !A[REF] || !A[AQUI]) { if (caja) caja.hidden = true; return; }
    function primera(c) {
      const t = c.puertas.reduce(function (s, p) { return s + p.v; }, 0) + c.calles;
      return { p: c.puertas[0], s: c.puertas[0].v / t, t: t };
    }
    const r = primera(A[REF]), a = primera(A[AQUI]);
    $('#salir-txt').textContent =
      'Entre las 6 y las 10 de la mañana salen de Parla por carretera ' +
      entero(Math.round(r.t)) + ' personas, y el ' + num(r.s * 100, 1) + ' % lo hace por la ' +
      'misma carretera: la ' + r.p.via + ' ' + r.p.hacia + '. En ' + NOMBRE[AQUI] +
      ', la salida más usada se lleva el ' + num(a.s * 100, 1) + ' %.';
    const ul = $('#salir-filas');
    vaciar(ul);
    [[REF, 'referencia', r], [AQUI, 'aqui', a]].forEach(function (g) {
      const li = el('li', 'mun__fila');
      li.setAttribute('data-quien', g[1]);
      const q = el('span', 'mun__q');
      q.textContent = NOMBRE[g[0]] + ', por la ' + g[2].p.via;
      li.appendChild(q);
      li.appendChild(el('span', 'mun__v', num(g[2].s * 100, 1) + ' %'));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = (g[2].s * 100).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
    salirTren();
    const ir = RUTAS ? RAIZ_WEB + AQUI + '/infraestructura/' : 'infraestructura.html#' + AQUI;
    $('#salir-ir').href = ir;
    const atajo = $('#portada-salir');
    if (atajo) atajo.href = ir;
  }

  /* Y el tren: de cada 100 viviendas, las que tienen una estación a 15
     minutos andando (herramientas/transporte/cobertura.py). Si no está el
     dato, el bloque se queda con el coche. */
  function salirTren() {
    const C = ((window.TRANSPORTE || {}).cobertura || {}).ciudades;
    const n = $('#salir-tren'), ul = $('#salir-tren-filas'), pie = $('#salir-tren-pie');
    const hay = !!(C && C[REF] && C[AQUI]);
    [n, ul, pie].forEach(function (x) { if (x) x.hidden = !hay; });
    if (!hay) return;
    const p = function (id) { return C[id].pct['15']; };
    n.textContent = 'En tren, de cada 100 viviendas de Parla, ' + num(p(REF), 0) +
      ' tienen una estación a 15 minutos andando. En ' + NOMBRE[AQUI] + ', ' + num(p(AQUI), 0) + '.';
    vaciar(ul);
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const li = el('li', 'mun__fila');
      li.setAttribute('data-quien', g[1]);
      li.appendChild(el('span', 'mun__q', NOMBRE[g[0]]));
      li.appendChild(el('span', 'mun__v', num(p(g[0]), 1) + ' %'));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = p(g[0]).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  /* ── Sanidad y educación: el resumen de sanidad.html y educacion.html ─
     Dos datos de cada una, en frase y en barras, y el enlace. Lo demás, en
     assets/servicios.js. Las barras van de cero a la ciudad más alta de las
     once, para que una diferencia pequeña no parezca grande. */
  function servicios() {
    const S = window.SANIDAD, P = window.PRIMARIA, I = window.INFANTIL;
    const cs = $('#sanidad'), ce = $('#educacion');

    const haySanidad = !!(S && P && S.ciudades[AQUI] && P.ciudades[AQUI]);
    cs.hidden = !haySanidad;
    if (haySanidad) {
      /* Las camas del hospital que le toca a cada ciudad, contra toda la gente
         que tiene asignada: la misma cuenta que sanidad.html (assets/hospitales.js). */
      const H = window.HOSPITALES;
      const camas = {};
      D.MUNICIPIOS.forEach(function (m) {
        const h = H.de(D, S, m.id);
        camas[m.id] = { v: h && h.por1000 != null ? h.por1000 : null };
      });
      const hr = H.de(D, S, REF), ha = H.de(D, S, AQUI);
      $('#servicios-sanidad').textContent = 'El hospital de Parla tiene ' + num(hr.por1000, 1) +
        ' camas por cada 1.000 personas que atiende; ' + (ha.por1000 == null
          ? 'del ' + ha.corto.replace(/^(el|la) /, '') + ', el que le toca a ' + NOMBRE[AQUI] + ', no hay cifra.'
          : ha === hr ? 'es el mismo que le toca a ' + NOMBRE[AQUI] + '.'
          : ha.corto + (ha.duena === AQUI ? '' : ', el que le toca a ' + NOMBRE[AQUI]) + ', ' + num(ha.por1000, 1) + '.') +
        ' Y en los centros de salud hay una plaza de médico de familia por cada ' +
        entero(P.ciudades[REF].familia) + ' tarjetas sanitarias en Parla y por cada ' +
        entero(P.ciudades[AQUI].familia) + ' en ' + NOMBRE[AQUI] + '.';
      const graf = $('#servicios-sanidad-graf');
      vaciar(graf);
      graf.appendChild(barrasPar('resumen-camas', 'Camas del hospital por cada 1.000 personas que atiende', 'mas',
        camas, function (c) { return c.v; }, function (v) { return num(v, 1); }));
      graf.appendChild(barrasPar('resumen-cabecera', 'Tarjetas sanitarias por plaza de médico de familia', 'menos', P.ciudades,
        function (c) { return c.familia; }, entero));
      const fc = D.fuentes.camas;
      fuentesPie($('#servicios-sanidad-pie'), [[fc.t, fc.url],
        ['Población asignada: memoria de 2024 ' + hr.corto.replace(/^el /, 'del '), S.memorias[hr.hid]]].concat(ha === hr ? []
        : [['memoria de 2024 ' + ha.corto.replace(/^el /, 'del ').replace(/^la /, 'de la '), S.memorias[ha.hid]]]).concat([
        P.fuentes.plantilla, P.fuentes.tarjetas]));
    }

    /* Educación: lo que hay del recuento y la FP pública, que no suma a él. */
    const fp = D.indicadores.find(function (i) { return i.id === 'fp'; });
    const baseFp = D.BASES[fp.base];
    const fpPor100 = {};
    D.MUNICIPIOS.forEach(function (m) { fpPor100[m.id] = { v: fp.datos[m.id].n / baseFp.valores[m.id] * 100 }; });
    const hayEducacion = !!(I && I.ciudades[AQUI]);
    ce.hidden = !hayEducacion;
    if (hayEducacion) {
      const area = deArea('Educación');
      $('#servicios-educacion').textContent = fraseArea(area, 'equipamientos educativos públicos') +
        ' Y por cada 100 chicos y chicas de 12 a 17 años hay ' +
        num(fpPor100[REF].v, 1) + ' alumnos de Formación Profesional pública en Parla y ' +
        num(fpPor100[AQUI].v, 1) + ' en ' + NOMBRE[AQUI] + '.';
      const ge = $('#servicios-educacion-graf');
      vaciar(ge);
      ge.appendChild(tiraArea('resumen-educacion', 'Equipamientos educativos públicos del recuento', area));
      ge.appendChild(barrasPar('resumen-fp', 'Alumnos de FP pública por cada 100 chicos y chicas de 12 a 17 años', 'mas',
        fpPor100, function (c) { return c.v; }, function (v) { return num(v, 1); }));
      const f = D.fuentes[fp.fuenteId], fb = D.fuentes[baseFp.fuenteId];
      fuentesPie($('#servicios-educacion-pie'), area.fuentes.concat([[f.t, f.url], [fb.t, fb.url]]));
    }

    const s = RUTAS ? RAIZ_WEB + AQUI + '/sanidad/' : 'sanidad.html#' + AQUI;
    const e = RUTAS ? RAIZ_WEB + AQUI + '/educacion/' : 'educacion.html#' + AQUI;
    $('#sanidad-ir').href = s;
    $('#educacion-ir').href = e;
    const ps = $('#portada-sanidad'), pe = $('#portada-educacion');
    if (ps) ps.href = s;
    if (pe) pe.href = e;
  }

  /* El estado de un área entera: los equipamientos del recuento que tiene
     Parla y los que tendría con la proporción de la otra, sumados. Es la
     misma cuenta que el recuento, área a área. */
  function deArea(grupo) {
    const orden = D.indicadores.map(function (i) { return i.id; });
    const cosas = faltan.concat(sobran, empates).filter(function (c) {
      return c.ind.grupo === grupo && c.ind.enTotal !== false && !esCartera(c);
    }).sort(function (x, y) { return orden.indexOf(x.ind.id) - orden.indexOf(y.ind.id); });
    const hay = cosas.reduce(function (t, c) { return t + c.parla; }, 0);
    const tendria = cosas.reduce(function (t, c) { return t + c.tendria; }, 0);
    const fuentes = [];
    cosas.forEach(function (c) {
      const f = D.fuentes[c.ind.fuenteId];
      if (f && !fuentes.some(function (x) { return x[1] === f.url; })) fuentes.push([f.t, f.url]);
    });
    return { hay: hay, tendria: tendria, falta: tendria - hay, cosas: cosas, fuentes: fuentes };
  }

  function fraseArea(a, que) {
    const base = 'Parla tiene ' + entero(a.hay) + ' ' + que + '. Con la proporción de ' +
      NOMBRE[AQUI] + ' tendría ' + num(a.tendria) + ': ';
    if (Math.abs(a.falta) < 0.5) return base + 'prácticamente los mismos.';
    return base + (a.falta > 0 ? 'le faltan ' + num(a.falta) + '.' : 'tiene ' + num(-a.falta) + ' de más.');
  }

  /* Los nombres cortos de lo que entra en cada área, para el pie de su tira. */
  const CORTO = {
    'centros-salud': 'centros de salud',
    'escuelas-infantiles': 'escuelas infantiles', colegios: 'colegios', institutos: 'institutos',
    conservatorio: 'conservatorio', universidad: 'campus universitario'
  };

  /* La tira del área: lo que hay, en negro, y un hueco por cada cosa que
     falta, como la de la portada. Si Parla tiene más, solo lo que hay. */
  function tiraArea(id, titulo, a) {
    const caja = el('div');
    const h = el('h3', 'espera__h', titulo);
    h.id = id;   /* el nombre en clave del enlace de la cadena (indice.js) */
    caja.appendChild(h);
    const t = tira(a.hay, Math.max(0, a.falta));
    t.classList.add('tira--resumen');
    t.querySelectorAll('.u--hueco').forEach(function (u) { u.style.opacity = '1'; u.style.transform = 'none'; });
    caja.appendChild(t);
    const ley = el('p', 'marcador__ley');
    ley.setAttribute('aria-hidden', 'true');
    ley.innerHTML = '<span class="ley ley--hay"></span>' + entero(a.hay) + ' que hay' +
      (a.falta > 0.04 ? ' <span class="ley ley--hueco"></span>' + num(a.falta) + ' que faltan' : '');
    caja.appendChild(ley);
    const nombres = a.cosas.map(function (c) { return CORTO[c.ind.id] || c.ind.titulo.toLowerCase(); });
    const cuenta = el('p', 'salir__pie');
    cuenta.textContent = 'Cuentan ' + (nombres.length > 1
      ? nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1] : nombres[0]) +
      (a.cosas.every(function (c) { return (c.ind.base || 'total') === 'total'; })
        ? ', contra toda la población.'
        : a.cosas.every(function (c) { return c.ind.base && c.ind.base !== 'total'; })
          ? ', cada uno contra los vecinos de su edad.'
          : ', cada uno contra los vecinos de su edad o contra todos, según lo que sea.');
    caja.appendChild(cuenta);
    return caja;
  }

  /* Un dato en dos barras: Parla y la ciudad elegida, con un título pequeño
     y la línea de «cuanto menos, mejor» que pone sentido.js. */
  function barrasPar(id, titulo, sentido, ciudades, valor, formato) {
    const caja = el('div');
    const h = el('h3', 'espera__h', titulo);
    h.id = id;   /* el nombre en clave del enlace de la cadena (indice.js) */
    caja.appendChild(h);
    const ul = el('ul', 'mun salir__filas espera__filas');
    ul.dataset.sentido = sentido;
    const tope = Object.keys(ciudades).reduce(function (t, id) {
      const v = valor(ciudades[id]); return v > t ? v : t;
    }, 0) || 1;
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const v = valor(ciudades[g[0]] || {});
      const li = el('li', 'mun__fila');
      li.setAttribute('data-quien', g[1]);
      li.appendChild(el('span', 'mun__q', NOMBRE[g[0]]));
      li.appendChild(el('span', 'mun__v', v == null ? 'sin dato' : formato(v)));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = v == null ? '0' : (v / tope * 100).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
    caja.appendChild(ul);
    return caja;
  }

  /* El pie de unas barras: sus fuentes, cada una con su enlace. */
  function fuentesPie(pie, fuentes) {
    vaciar(pie);
    fuentes.forEach(function (f, i) {
      if (i) pie.appendChild(document.createTextNode(' · '));
      const a = el('a', null, f[0]);
      a.href = f[1];
      pie.appendChild(a);
    });
    pie.appendChild(document.createTextNode('.'));
  }

  /* ── Vivienda: el resumen de vivienda.html ───────────────────────────
     Los datos los escribe herramientas/vivienda.py; aquí solo se enseñan
     las viviendas nuevas por cada 100 vecinos nuevos y se manda a la página. */
  function vivienda() {
    const V = (window.VIVIENDA || {}).ciudades;
    const caja = $('#vivienda');
    if (!V || !V[REF] || !V[AQUI]) { if (caja) caja.hidden = true; return; }
    function crece(c) {
      const n = c.crece.pob.length - 1;
      const p = c.crece.pob[n] - c.crece.pob[0], v = c.crece.casas[n] - c.crece.casas[0];
      return { p: p, v: v, r: p > 0 ? v / p * 100 : null };
    }
    const r = crece(V[REF]), a = crece(V[AQUI]);
    $('#vivienda-txt').textContent =
      'Entre 2015 y 2025 Parla ganó ' + entero(r.p) + ' vecinos, y el Catastro registró ' + entero(r.v) +
      ' viviendas más. ' + (a.r === null
        ? NOMBRE[AQUI] + ' perdió ' + entero(-a.p) + ' vecinos y sumó ' + entero(a.v) + ' viviendas.'
        : NOMBRE[AQUI] + ' ganó ' + entero(a.p) + ' vecinos y sumó ' + entero(a.v) + ' viviendas.') +
      ' Abajo, la misma cuenta por cada 100 vecinos nuevos: con borde, los hogares que forman 100 personas al ' +
      'tamaño medio de hogar de cada ciudad; llenas, las viviendas nuevas.';
    const NS = 'http://www.w3.org/2000/svg';
    let uid = 0;
    function casa(lleno, hueco) {
      const d = document.createElementNS(NS, 'svg');
      d.setAttribute('viewBox', '0 0 20 20'); d.setAttribute('class', 'hogm__u'); d.setAttribute('aria-hidden', 'true');
      const forma = 'M10 1.5 19 9v9.5H1V9z', id = 'hogm-' + (uid++);
      const cp = document.createElementNS(NS, 'clipPath'); cp.setAttribute('id', id);
      const f = document.createElementNS(NS, 'path'); f.setAttribute('d', forma); cp.appendChild(f); d.appendChild(cp);
      if (hueco) { const b = document.createElementNS(NS, 'path'); b.setAttribute('d', forma); b.setAttribute('class', 'hogm__borde'); d.appendChild(b); }
      if (lleno > 0) {
        const q = document.createElementNS(NS, 'rect');
        q.setAttribute('width', (20 * Math.min(1, lleno)).toFixed(2)); q.setAttribute('height', 20);
        q.setAttribute('clip-path', 'url(#' + id + ')'); q.setAttribute('class', 'hogm__lleno');
        d.appendChild(q);
      }
      return d;
    }
    const cont = $('#vivienda-hogares');
    vaciar(cont);
    [[REF, 'referencia', r], [AQUI, 'aqui', a]].forEach(function (g) {
      const c = el('div', 'hogm');
      c.setAttribute('data-quien', g[1]);
      c.appendChild(el('p', 'hogm__nombre', NOMBRE[g[0]]));
      if (g[2].r === null) {
        c.appendChild(el('p', 'hogm__que', 'Pierde vecinos: no hay vecinos nuevos que contar.'));
        cont.appendChild(c);
        return;
      }
      const tam = V[g[0]].renta.tamano, hog = 100 / tam;
      c.appendChild(el('p', 'hogm__v', num(g[2].r, 1)));
      c.appendChild(el('p', 'hogm__que', 'viviendas nuevas por cada 100 vecinos nuevos, que son ' + num(hog, 1) +
        ' hogares de ' + num(tam, 1) + ' personas'));
      const fila = el('div', 'hogm__fila');
      fila.setAttribute('role', 'img');
      fila.setAttribute('aria-label', NOMBRE[g[0]] + ': ' + num(g[2].r, 1) + ' viviendas nuevas por cada 100 vecinos nuevos, que son ' +
        num(hog, 1) + ' hogares');
      const total = Math.max(Math.round(hog), Math.ceil(g[2].r));
      for (let i = 0; i < total; i++) fila.appendChild(casa(g[2].r - i, i < Math.round(hog)));
      c.appendChild(fila);
      cont.appendChild(c);
    });
    const ir = RUTAS ? RAIZ_WEB + AQUI + '/vivienda/' : 'vivienda.html#' + AQUI;
    $('#vivienda-ir').href = ir;
    const atajo = $('#portada-vivienda');
    if (atajo) atajo.href = ir;
  }

  function pintar() {
    calcular();
    portada();
    golpe();
    resumen();
    edades();
    tamano();
    dinero();
    salir();
    servicios();
    vivienda();
    listas();
    metodo();
    movimiento();
    document.title = '¿Y si en Parla viviéramos como en ' + NOMBRE[AQUI] + '? · ' + D.NOMBRE_WEB;
    indice();
  }

  /* El índice lee la página; aquí solo se le dan las cifras de las dos
     listas y la ciudad, para los enlaces a las otras páginas. */
  function indice() {
    if (!window.INDICE) return;
    const p = $('#faltan'), g = $('#sobran');
    p.dataset.indiceDato = Math.round(TOTAL) > 0 ? String(Math.round(TOTAL)) : '';
    p.dataset.indiceTono = 'loss';
    g.dataset.indiceDato = Math.round(SOBRA) > 0 ? String(Math.round(SOBRA)) : '';
    g.dataset.indiceTono = 'gain';
    window.INDICE.refrescar({ ciudad: AQUI, nombre: NOMBRE[AQUI] });
  }

  selector();
  pintar();
  enlace();
  contador();
})();

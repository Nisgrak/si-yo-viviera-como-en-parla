/* ═══════════════════════════════════════════════════════════════════════
   HACIA DÓNDE ES MEJOR · lo usan todas las páginas
   Debajo del título de cada dato, una línea pequeña: «Cuanto más, mejor» o
   «Cuanto menos, mejor». Es una lectura, no un dato, así que solo va donde
   está claro para un vecino: más equipamientos, más renta; menos paro,
   menos espera, menos deuda. Donde depende de quién mire (lo que vale una
   casa, la gente de 65 años o más, el peso de la industria) no hay línea.

   Cómo se usa:
     - en el HTML o al pintar, el título lleva data-sentido="mas" o "menos";
       este script pone la línea justo debajo de las cifras que siguen a ese
       título (las barras de Parla y tu ciudad, el gráfico, las dos cifras
       grandes), o debajo del título si no las encuentra. También en lo que
       se pinte más tarde: lo vigila con un MutationObserver;
     - SENTIDO.de(id) da el sentido de un dato del catálogo de «Todos los
       datos» (assets/consulta.js), para que todas las páginas digan lo
       mismo del mismo dato.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MAS = 'mas', MENOS = 'menos';
  /* Por id del catálogo de assets/consulta.js. Lo que no está, sin línea. */
  const MAPA = {
    /* Equipamientos: el recuento entero va de que más es mejor. */
    metro: MAS, cercanias: MAS, farmacias: MAS, bibliotecas: MAS, 'centros-salud': MAS, camas: MAS,
    'escuelas-infantiles': MAS, colegios: MAS, institutos: MAS, universidad: MAS, conservatorio: MAS,
    artes: MAS, fp: MAS, 'plazas-residencia': MAS, hacienda: MAS, 'seguridad-social': MAS, 'zonas-verdes': MAS,
    'infantil-sin-plaza': MENOS, 'casa-atocha': MENOS, 'casa-atocha-hora': MENOS, 'infantil-matriculados': MAS,
    /* Vecinos y economía */
    'dinero-paro': MENOS, 'dinero-renta': MAS, 'dinero-pobreza': MENOS, 'dinero-pib': MAS,
    puestos: MAS, 'paro-registrado': MENOS, 'paro-mujeres': MENOS, 'paro-jovenes': MENOS, indefinidos: MAS,
    'renta-persona': MAS, 'renta-hogar': MAS, irpf: MAS, 'irpf-trabajo': MAS, gini: MENOS, empresas: MAS,
    /* Cuentas del ayuntamiento: lo que gasta e invierte por vecino, más;
       lo que debe y lo que tarda en pagar, menos. Lo que recauda, sin
       línea: más recaudación es también más impuestos. */
    'dinero-gasto': MAS, 'dinero-inversion': MAS, 'dinero-servicios-sociales': MAS, 'dinero-comunidad': MAS,
    'dinero-deuda': MENOS, 'deuda-anual': MENOS, intereses: MENOS, demora: MENOS, pmp: MENOS, remanente: MAS,
    'paga-misma': MENOS, 'paga-suya': MENOS, 'ibi-tipo': MENOS, coche: MENOS,
    /* Vivienda: para quien busca casa. Lo que vale una casa, sin línea:
       al que la tiene le conviene que suba. */
    'anios-renta': MENOS, 'alquiler-m2': MENOS, 'alquiler-mes': MENOS, esfuerzo: MENOS,
    'casas-por-vecino': MAS, 'jovenes-padres': MENOS, 'sin-ascensor': MENOS, avs: MAS, ibi: MENOS,
    /* Infraestructuras */
    cobertura: MAS, 'cobertura-10': MAS, 'cobertura-5': MAS, abono: MENOS,
    /* Sanidad */
    'espera-operarse': MENOS, 'espera-consulta': MENOS, 'espera-prueba': MENOS, 'lista-operarse': MENOS,
    'tarjetas-medico': MENOS, 'tarjetas-pediatra': MENOS
  };
  const TEXTO = { mas: 'Cuanto más, mejor', menos: 'Cuanto menos, mejor' };
  const FLECHA = { mas: '↑', menos: '↓' };

  function linea(s) {
    const p = document.createElement('p');
    p.className = 'sentido';
    p.dataset.s = s;
    /* La flecha dibujada, no el carácter: el de la fuente queda más bajo
       que las letras. */
    const ns = 'http://www.w3.org/2000/svg';
    const f = document.createElementNS(ns, 'svg');
    f.setAttribute('class', 'sentido__f');
    f.setAttribute('viewBox', '0 0 12 12');
    f.setAttribute('aria-hidden', 'true');
    const d = document.createElementNS(ns, 'path');
    d.setAttribute('d', s === MAS ? 'M6 10.5V1.8M2.4 5.2 6 1.6l3.6 3.6' : 'M6 1.5v8.7M2.4 6.8 6 10.4l3.6-3.6');
    f.appendChild(d);
    p.appendChild(f);
    p.appendChild(document.createElement('span')).textContent = TEXTO[s];
    return p;
  }

  /* Lo que cuenta como «las cifras» de un dato, en cada página: un bloque
     entero (la lista de barras, el gráfico, las dos cifras grandes) o una
     tanda de filas sueltas. Dentro de algunos bloques, la línea va tras su
     última fila o tras el dibujo, antes de las frases que los explican. */
  const CIFRAS = '.mun, .tasas, .res__filas, .graf, figure, .tp-cifras, .mapas, .pareja, .hogares-pareja, .tabla-caja, .cifras';
  const FILAS = '.euros__fila, .mun__fila, .tasa';
  const DENTRO = { '.tasas': '.tasa', '.graf': '.graf__svg', 'figure': '.graf__svg' };

  /* Dónde va la línea de un título: el elemento tras el que se pone. */
  function anclaDe(t) {
    if (t.matches(CIFRAS)) return dentro(t);   /* el bloque marcado es la cifra */
    let filas = null;
    for (let n = t.nextElementSibling; n; n = n.nextElementSibling) {
      if (n.matches(FILAS)) { filas = n; continue; }
      if (filas) return filas;
      if (/^H[1-4]$/.test(n.tagName) || n.hasAttribute('data-sentido')) return t;
      if (n.matches(CIFRAS)) return dentro(n);
    }
    return filas || t;
  }
  function dentro(bloque) {
    for (const sel in DENTRO) {
      if (!bloque.matches(sel)) continue;
      const hijos = Array.prototype.filter.call(bloque.children, function (h) { return h.matches(DENTRO[sel]); });
      if (hijos.length) return hijos[hijos.length - 1];
    }
    return bloque;
  }

  /* Pone la línea debajo de las cifras de cada título marcado. Cada título
     recuerda su línea: si sus cifras se pintan después (un gráfico que se
     dibuja al verse), la línea se mueve en vez de repetirse. */
  function marcar(raiz) {
    raiz = raiz || document;
    if (!raiz || !raiz.querySelectorAll) return;   /* la página ya se cerró */
    raiz.querySelectorAll('[data-sentido]').forEach(function (t) {
      const s = t.getAttribute('data-sentido');
      if (!TEXTO[s]) return;
      const ancla = anclaDe(t);
      const vieja = t._sentido;
      if (vieja && vieja.isConnected && vieja.dataset.s === s && vieja.previousElementSibling === ancla) return;
      if (vieja) vieja.remove();
      const nueva = linea(s);
      ancla.after(nueva);
      t._sentido = nueva;
    });
  }

  window.SENTIDO = {
    de: function (id) { return MAPA[id] || null; },
    texto: function (s) { return TEXTO[s] || ''; },
    flecha: function (s) { return FLECHA[s] || ''; },
    marcar: marcar
  };

  function vigilar() {
    marcar(document);
    if (!('MutationObserver' in window)) return;
    let pendiente = false;
    new MutationObserver(function () {
      if (pendiente) return;
      pendiente = true;
      /* Una vez por tanda de cambios, cuando la página ha terminado de pintar. */
      Promise.resolve().then(function () { pendiente = false; if (typeof document !== 'undefined') marcar(document); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) vigilar();
  else document.addEventListener('DOMContentLoaded', vigilar);
})();

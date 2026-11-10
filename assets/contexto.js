/* ═══════════════════════════════════════════════════════════════════════
   CUATRO DATOS SUELTOS · educacion, sanidad, economia e infraestructura
   Cada uno es una pieza pequeña dentro de la página de su tema, con Parla
   y la ciudad elegida en dos columnas (datos/contexto.js, que escribe
   herramientas/contexto.py):
     educacion.html       #estudios   vecinos con la ESO como máximo
     sanidad.html         #vida       esperanza de vida al nacer
     economia.html        #pensiones  pensión contributiva media
     infraestructura.html #coches     antigüedad media de los turismos
   Ninguno suma al recuento de la portada. La posición de Parla se calcula
   de los datos: nada de «la más alta» está escrito a mano.
   Lo pinta cada vez que cambia la ciudad del selector de la página.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS, C = window.CONTEXTO;
  if (!D || !C) return;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const IDS = D.MUNICIPIOS.map(function (m) { return m.id; });
  const PAGINA = document.body.getAttribute('data-pagina');
  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const RAIZ_WEB = new URL('.', document.baseURI).pathname;
  const NBSP = ' ';
  const LETRA = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once'];

  const $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* El separador de miles siempre, también en cuatro cifras. */
  function num(n, dec) {
    const s = n.toFixed(dec).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return s.join(',');
  }
  function mayuscula(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* La ciudad que está elegida en el selector de la página. */
  function aqui() {
    const s = $('sel-municipio');
    const v = (s && s.value) || (location.hash || '').replace('#', '');
    return v && v !== REF && NOMBRE[v] ? v : 'getafe';
  }

  /* Dos columnas, como el resto de la página: nombre, cifra grande y las
     líneas que la explican. Una columna sin dato lo dice con la misma forma. */
  function cifras(cont, cols) {
    vaciar(cont);
    cols.forEach(function (c) {
      const d = el('div', 'tp-cifra' + (c.sin ? ' tp-cifra--sin' : ''));
      d.dataset.quien = c.quien;
      d.appendChild(el('p', 'tp-cifra__quien', c.nombre));
      d.appendChild(el('p', 'tp-cifra__v', c.v));
      c.que.forEach(function (t) { d.appendChild(el('p', 'tp-cifra__que', t)); });
      cont.appendChild(d);
    });
  }

  /* El puesto de Parla entre las ciudades con dato, desde el lado más
     cercano: «la más alta», «la segunda más baja», «la 4.ª más alta». */
  function posicion(vals) {
    const ids = Object.keys(vals);
    const n = ids.length;
    const mayores = ids.filter(function (i) { return vals[i] > vals[REF]; }).length;
    const menores = ids.filter(function (i) { return vals[i] < vals[REF]; }).length;
    const alta = mayores <= menores;
    const p = (alta ? mayores : menores) + 1;
    const lado = alta ? 'alta' : 'baja';
    const que = p === 1 ? 'la más ' + lado : p === 2 ? 'la segunda más ' + lado : 'la ' + p + '.ª más ' + lado;
    return { texto: que, n: n, letra: LETRA[n] || String(n) };
  }

  function pie(el_, texto, fuentes) {
    vaciar(el_);
    el_.appendChild(document.createTextNode(texto + ' '));
    fuentes.forEach(function (f, i) {
      if (i) el_.appendChild(document.createTextNode('; '));
      const a = el('a', null, f[0]);
      a.href = f[1];
      el_.appendChild(a);
    });
    el_.appendChild(document.createTextNode('.'));
  }

  /* La fuente y la fecha, en una línea, para el pie del cartel: el mismo
     texto que el pie de la pieza. */
  function fuenteLinea(texto, fuentes) {
    return texto + ' ' + fuentes.map(function (f) { return f[0]; }).join('; ') + '.';
  }

  /* El botón «Cartel para compartir» (assets/cartel.js) al final de la
     pieza. El dato se calcula al pulsar: pre, titular, `dos` (Parla y la otra
     ciudad frente a frente) o una sola cifra, la frase de posición en `sub`
     y, en las cajas, lo que explica y la fuente. */
  function cartel(cont, id, titulo, datos, vinculo) {
    const caja = $(cont);
    if (!caja) return;
    vaciar(caja);
    if (!window.CARTEL) return;
    caja.appendChild(window.CARTEL.boton({
      id: id, datos: datos, ciudad: aqui,
      titulo: function () { return 'Parla y ' + NOMBRE[aqui()] + ' · ' + titulo; }
    }));
    /* «Compartir esta sección», para las piezas con vista previa propia
       (/getafe/estudios/, que escribe herramientas/compartir.mjs). */
    if (vinculo) {
      caja.appendChild(window.CARTEL.enlace({
        url: function () {
          return RUTAS ? RAIZ_WEB + aqui() + '/' + id + '/' : PAGINA + '.html?ir=' + id + '#' + aqui();
        },
        titulo: function () { return vinculo(NOMBRE[aqui()]); }
      }));
    }
  }
  function pre(titulo) { return NOMBRE[REF] + ' frente a ' + NOMBRE[aqui()] + ' · ' + titulo; }
  /* Las dos ciudades con su cifra; Parla en rojo si va peor que la otra. */
  function frente(id, fmt, parlaPeor) {
    return [{ quien: NOMBRE[REF], cifra: fmt(REF), rojo: parlaPeor }, { quien: NOMBRE[id], cifra: fmt(id) }];
  }

  function columnas(id, v, que, extra) {
    return [REF, id].map(function (i) {
      const c = { quien: i === REF ? 'referencia' : 'aqui', nombre: NOMBRE[i] };
      if (v[i] == null || (extra && extra.sin && extra.sin(i))) {
        c.sin = true;
        c.v = extra && extra.textoSin ? extra.textoSin : 'Sin dato';
        c.que = [extra && extra.queSin ? extra.queSin(i) : ''].filter(Boolean);
      } else {
        c.v = que.v(i);
        c.que = que.lineas(i);
      }
      return c;
    });
  }

  /* ── Nivel de estudios ─────────────────────────────────────────────── */
  function estudios() {
    if (!$('estudios-cifras')) return;
    const id = aqui(), E = C.estudios, v = E.valores;
    const f = function (i) { return num(v[i], 1) + NBSP + '%'; };
    $('estudios-txt').textContent = 'De cada 100 vecinos de 25 a 64 años, ' + num(v[REF], 1) + ' en Parla y ' +
      num(v[id], 1) + ' en ' + NOMBRE[id] + ' tienen como máximo la ESO. Datos de ' + E.anio + '.';
    cifras($('estudios-cifras'), columnas(id, v, {
      v: f, lineas: function () { return ['de los vecinos de 25 a 64 años tiene como máximo la ESO']; }
    }));
    const p = posicion(v);
    $('estudios-pos').textContent = 'Parla es ' + p.texto + ' de las ' + p.letra + ' en vecinos con la ESO como máximo.';
    $('estudios-notas').textContent = 'Cuenta a quienes no pasaron de la educación secundaria obligatoria, ' +
      'según el máximo nivel de estudios de cada persona. El INE lo publica por ciudad en sus Indicadores Urbanos.';
    pie($('estudios-pie'), 'Cifras de ' + E.anio + '.', [E.fuente]);
    cartel('estudios-botones', 'estudios', 'El nivel de estudios', function () {
      return {
        pre: pre('El nivel de estudios'),
        antes: 'De cada 100 vecinos de 25 a 64 años',
        dos: frente(id, function (i) { return num(v[i], 1); }, v[REF] > v[id]), que: 'tienen como máximo la ESO',
        sub: 'Parla es ' + p.texto + ' de las ' + p.letra + ' en vecinos con la ESO como máximo.',
        cajas: [{ q: 'Fuente', v: fuenteLinea('Cifras de ' + E.anio + '.', [E.fuente]) }]
      };
    }, function (n) { return 'El nivel de estudios en Parla y en ' + n; });
  }

  /* ── Esperanza de vida ─────────────────────────────────────────────── */
  function vida() {
    if (!$('vida-cifras')) return;
    const id = aqui(), V = C.esperanza, t = V.total;
    const tiene = t[id] != null;
    const lineas = function (i) {
      return ['años de esperanza de vida al nacer, ' + V.anio,
        'Hombres ' + num(V.hombres[i], 1) + ' · Mujeres ' + num(V.mujeres[i], 1)];
    };
    $('vida-txt').textContent = tiene
      ? 'La esperanza de vida al nacer en ' + V.anio + ' es de ' + num(t[REF], 1) + ' años en Parla y de ' +
        num(t[id], 1) + ' en ' + NOMBRE[id] + '.'
      : 'La esperanza de vida al nacer en ' + V.anio + ' es de ' + num(t[REF], 1) + ' años en Parla. ' +
        NOMBRE[id] + ' no tiene dato.';
    cifras($('vida-cifras'), columnas(id, t, { v: function (i) { return num(t[i], 1); }, lineas: lineas }, {
      queSin: function () { return 'La fuente no lo publica para esta ciudad'; }
    }));
    const p = posicion(t);
    const pos = $('vida-pos');
    pos.textContent = (tiene ? '' : 'La fuente solo publica este dato para municipios de más de 100.000 habitantes. ') +
      'Parla es ' + p.texto + ' de las ' + p.letra + ' con dato en esperanza de vida al nacer.';
    const s = V.parla;
    $('vida-notas').textContent = (tiene ? 'La fuente solo publica este dato para municipios de más de 100.000 habitantes. ' : '') +
      'Es el dato de un solo año y cambia de un año a otro: en Parla, desde ' + s.desde + ', ha estado entre ' +
      num(s.min[1], 2) + ' años (' + s.min[0] + ') y ' + num(s.max[1], 2) + ' (' + s.max[0] + '). ' +
      'La fuente no publica cómo lo calcula.';
    pie($('vida-pie'), 'Cifras de ' + V.anio + '.', [V.fuente]);
    cartel('vida-botones', 'vida', 'La esperanza de vida', function () {
      const fuente = { q: 'Fuente', v: fuenteLinea('Cifras de ' + V.anio + '.', [V.fuente]) };
      const hm = function (i) { return 'Hombres ' + num(V.hombres[i], 1) + ' · Mujeres ' + num(V.mujeres[i], 1); };
      if (!tiene) {
        /* Sin dato de la otra ciudad: Parla sola, con su puesto entre las que lo tienen. */
        return {
          pre: pre('La esperanza de vida'),
          antes: 'Esperanza de vida al nacer en Parla', cifra: num(t[REF], 1), que: 'años',
          sub: 'Parla es ' + p.texto + ' de las ' + p.letra + ' con dato. La fuente no publica el de ' + NOMBRE[id] + '.',
          cajas: [{ q: 'Parla', v: hm(REF), ref: true }, fuente]
        };
      }
      return {
        pre: pre('La esperanza de vida'),
        antes: 'Esperanza de vida al nacer',
        dos: frente(id, function (i) { return num(t[i], 1); }, t[REF] < t[id]), que: 'años',
        sub: 'Parla es ' + p.texto + ' de las ' + p.letra + ' con dato en esperanza de vida al nacer.',
        cajas: [{ q: 'Parla', v: hm(REF), ref: true }, { q: NOMBRE[id], v: hm(id) }, fuente]
      };
    }, function (n) { return 'La esperanza de vida en Parla y en ' + n; });
  }

  /* ── Pensión contributiva media ────────────────────────────────────── */
  function pensiones() {
    if (!$('pensiones-cifras')) return;
    const id = aqui(), P = C.pension, t = P.total;
    const eur = function (x) { return num(Math.round(x), 0); };
    $('pensiones-txt').textContent = 'A ' + P.fecha + ', la pensión contributiva media por pensionista es de ' +
      eur(t[REF]) + ' euros al mes en Parla y de ' + eur(t[id]) + ' en ' + NOMBRE[id] + '.';
    cifras($('pensiones-cifras'), columnas(id, t, {
      v: function (i) { return eur(t[i]) + NBSP + '€'; },
      lineas: function (i) {
        return ['al mes por pensionista, pensión contributiva media',
          'Mujeres ' + eur(P.mujeres[i]) + NBSP + '€ · Hombres ' + eur(P.hombres[i]) + NBSP + '€'];
      }
    }));
    const p = posicion(t);
    $('pensiones-pos').textContent = 'Parla es ' + p.texto + ' de las ' + p.letra + ' en pensión contributiva media por pensionista.';
    $('pensiones-notas').textContent = 'La fuente no detalla qué clases de pensión incluye. Los importes van redondeados al euro.';
    pie($('pensiones-pie'), 'Datos a ' + P.fecha + '.', [P.fuente]);
    cartel('pensiones-botones', 'pensiones', 'La pensión media', function () {
      return {
        pre: pre('La pensión media'),
        antes: 'Pensión contributiva media por pensionista',
        dos: frente(id, function (i) { return eur(t[i]); }, t[REF] < t[id]), que: 'euros al mes',
        sub: 'Parla es ' + p.texto + ' de las ' + p.letra + ' en pensión contributiva media por pensionista.',
        cajas: [
          { q: 'Parla', v: 'Mujeres ' + eur(P.mujeres[REF]) + NBSP + '€ · Hombres ' + eur(P.hombres[REF]) + NBSP + '€', ref: true },
          { q: NOMBRE[id], v: 'Mujeres ' + eur(P.mujeres[id]) + NBSP + '€ · Hombres ' + eur(P.hombres[id]) + NBSP + '€' },
          { q: 'Fuente', v: fuenteLinea('Datos a ' + P.fecha + '.', [P.fuente]) }]
      };
}, function (n) { return 'La pensión media en Parla y en ' + n; });
  }

  /* ── Antigüedad de los coches ──────────────────────────────────────── */
  function coches() {
    if (!$('coches-cifras')) return;
    const id = aqui(), K = C.coches;
    const fuera = function (i) { return K.fuera.indexOf(i) >= 0; };
    const comparables = {};
    IDS.forEach(function (i) { if (!fuera(i)) comparables[i] = K.anios[i]; });
    const mil = function (i) { return num(K.por1000[i], 0); };
    const edad = function (i) { return num(K.anios[i], 2); };
    const noComp = fuera(id);

    $('coches-txt').textContent = noComp
      ? 'A ' + K.fecha + ', los turismos de Parla tienen ' + edad(REF) + ' años de media.'
      : 'A ' + K.fecha + ', los turismos de Parla tienen ' + edad(REF) + ' años de media y los de ' + NOMBRE[id] + ', ' + edad(id) + '.';
    cifras($('coches-cifras'), columnas(id, K.anios, {
      v: edad,
      lineas: function () { return ['años de media, solo turismos de menos de 25 años']; }
    }, {
      sin: fuera, textoSin: 'Sin comparar',
      queSin: function (i) { return mil(i) + ' turismos por cada 1.000 habitantes'; }
    }));

    const p = posicion(comparables);
    const orden = Object.keys(comparables).sort(function (a, b) { return comparables[b] - comparables[a]; });
    const tres = orden.slice(0, 3);
    const SUR = ['parla', 'mostoles', 'fuenlabrada', 'getafe', 'leganes', 'alcorcon', 'pinto'];
    const sur = tres.every(function (i) { return SUR.indexOf(i) >= 0; });
    const lista = tres.map(function (i) { return NOMBRE[i] + ' (' + edad(i) + ')'; });
    const bajo = orden[orden.length - 1];
    const pos = 'Parla es ' + p.texto + ' de las ' + p.letra + ' comparables en antigüedad media de los turismos. ' +
      'Las tres con la cifra más alta' + (sur ? ', todas del sur de Madrid,' : '') + ' son ' +
      lista[0] + ', ' + lista[1] + ' y ' + lista[2] + '. La más baja de las ' + p.letra + ' es ' + NOMBRE[bajo] +
      ' (' + edad(bajo) + ').';
    $('coches-pos').textContent = pos;

    const dos = K.fuera;
    const altos = dos.map(function (i) { return K.por1000[i]; });
    const medio = Math.round((altos[0] + altos[1]) / 2 / 100) * 100;
    const resto = IDS.filter(function (i) { return !fuera(i); }).map(function (i) { return K.por1000[i]; });
    const minimo = Math.round(Math.min.apply(null, resto) / 10) * 10, maximo = Math.round(Math.max.apply(null, resto) / 10) * 10;
    const exento = 'tienen matriculados unos ' + num(medio, 0) + ' turismos por cada 1.000 habitantes, frente a entre ' +
      num(minimo, 0) + ' y ' + num(maximo, 0) + ' en las demás. La fuente lo atribuye a ventajas en el impuesto de vehículos de tracción mecánica.';
    $('coches-notas').textContent = 'La media solo cuenta turismos de menos de 25 años. ' +
      (noComp ? '' : mayuscula(dos.map(function (i) { return NOMBRE[i] + ' (' + edad(i) + ')'; }).join(' y ')) +
        ' no se comparan: ' + exento);
    const aviso = $('coches-aviso');
    aviso.hidden = !noComp;
    aviso.textContent = noComp
      ? NOMBRE[id] + ' tiene matriculados ' + mil(id) + ' turismos por cada 1.000 habitantes, frente a entre ' + num(minimo, 0) + ' y ' +
        num(maximo, 0) + ' en las demás ciudades. La fuente lo atribuye a ventajas en el impuesto de vehículos de tracción mecánica. ' +
        'Por eso su antigüedad media (' + edad(id) + ' años) no se compara con la de Parla.'
      : '';
    const fuentesK = [K.fuente, K.fuenteTipo, [D.fuentes.ine.t, D.fuentes.ine.url]];
    const textoK = 'Turismos matriculados a ' + K.fecha + '; habitantes a 1 de enero de 2025.';
    pie($('coches-pie'), textoK, fuentesK);
    cartel('coches-botones', 'coches', 'La edad de los coches', function () {
      const fuente = { q: 'Fuente', v: fuenteLinea(textoK, [K.fuente, fuentesK[2]]) };
      const solo = 'solo turismos de menos de 25 años';
      if (noComp) {
        /* Alcobendas y Majadahonda no se comparan: Parla sola, con su puesto entre las comparables. */
        return {
          pre: pre('La edad de los coches'),
          antes: 'Antigüedad media de los turismos en Parla', cifra: edad(REF), que: 'años',
          sub: 'Parla es ' + p.texto + ' de las ' + p.letra + ' comparables. ' + NOMBRE[id] + ' no se compara: tiene ' + mil(id) +
            ' turismos por cada 1.000 habitantes, frente a entre ' + num(minimo, 0) + ' y ' + num(maximo, 0) + ' en las demás.',
          cajas: [{ q: 'Parla', v: solo, ref: true }, fuente]
        };
      }
      return {
        pre: pre('La edad de los coches'),
        antes: 'Antigüedad media de los turismos',
        dos: frente(id, edad), que: 'años',
        sub: 'Parla es ' + p.texto + ' de las ' + p.letra + ' comparables' +
          (sur ? '; las tres cifras más altas son del sur de Madrid.' : '.'),
        cajas: [{ q: 'Las tres más altas', v: lista.join(' · ') }, { q: 'Cuenta', v: solo }, fuente]
      };
}, function (n) { return 'La edad de los coches en Parla y en ' + n; });
  }

  function pintar() {
    estudios(); vida(); pensiones(); coches();
  }

  const sel = $('sel-municipio');
  if (sel) sel.addEventListener('change', pintar);
  pintar();
})();

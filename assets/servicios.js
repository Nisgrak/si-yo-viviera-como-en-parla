/* ═══════════════════════════════════════════════════════════════════════
   SANIDAD · sanidad.html,  EDUCACIÓN · educacion.html  y
   INCLUSIÓN · inclusion.html
   Un solo script para las tres páginas: cada una pinta las secciones que
   tiene (<body data-pagina>). Arriba, lo que hay de su área en el recuento
   (los mismos indicadores de datos/datos.js, con la misma base); después,
   lo que no cuenta el recuento:
     sanidad    la espera en el hospital (datos/sanidad.js), el médico de
                cabecera (datos/primaria.js) y la salud mental
                (datos/discapacidad.js)
     educación  la escuela infantil de 0 a 2 años (datos/infantil.js)
     inclusión  todo es de fuera del recuento: las plazas para la
                discapacidad intelectual (datos/discapacidad.js)
   Cada sección lleva su cartel y su enlace con vista previa.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const PAGINA = document.body.getAttribute('data-pagina');
  const $ = function (s, r) { return (r || document).querySelector(s); };

  function entero(n) { return n.toLocaleString('es-ES', { useGrouping: true }); }
  function num(n, dec) {
    if (dec === undefined) dec = Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1;
    return n.toLocaleString('es-ES', { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  const CIFRA_LETRA = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  function letra(n) { return CIFRA_LETRA[n] || String(n); }

  /* ── Qué ciudad ───────────────────────────────────────────────────── */

  const RUTAS = document.documentElement.hasAttribute('data-rutas');
  const RAIZ_WEB = new URL('.', document.baseURI).pathname;
  function valida(id) { return !!(id && NOMBRE[id] && id !== REF); }
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
    history.replaceState(null, '', RUTAS ? RAIZ_WEB + AQUI + '/' + PAGINA + '/' : '#' + AQUI);
  }

  /* El cartel A4 y «Compartir esta sección» al final de una sección. La
     vista previa de /<ciudad>/<clave>/ la escribe herramientas/compartir.mjs. */
  function botones(sel, clave, titulo, datos, tituloEnlace) {
    const bot = $(sel);
    if (!bot) return;
    vaciar(bot);
    if (!window.CARTEL) return;
    bot.appendChild(window.CARTEL.boton({
      id: clave, datos: datos, ciudad: function () { return AQUI; },
      titulo: function () { return 'Parla y ' + NOMBRE[AQUI] + ' · ' + titulo; }
    }));
    bot.appendChild(window.CARTEL.enlace({
      url: function () { return RUTAS ? RAIZ_WEB + AQUI + '/' + clave + '/' : PAGINA + '.html?ir=' + clave + '#' + AQUI; },
      titulo: function () { return tituloEnlace; }
    }));
  }

  /* ── Lo que hay: los indicadores del recuento de esta área ───────────
     Los mismos números y la misma base que el recuento; aquí solo Parla y
     la ciudad elegida, con el enlace al apartado de cada uno. */
  const GRUPO = { sanidad: 'Sanidad', educacion: 'Educación' }[PAGINA];
  function hay() {
    const cont = $('#hay-listas');
    if (!cont) return;
    vaciar(cont);
    /* Las camas no: en sanidad.html van arriba, contra la gente que atiende el
       hospital, y dos cifras de camas distintas se leerían como un error. */
    D.indicadores.filter(function (i) { return i.grupo === GRUPO && i.id !== 'camas'; }).forEach(function (ind) {
      const base = D.BASES[ind.base];
      const tasa = function (id) { return ind.datos[id].n / base.valores[id] * base.por; };
      const todas = IDS_TODAS();
      const tope = Math.max.apply(null, todas.map(tasa));
      const dec = function (v) { return num(v, v >= 100 ? 0 : v >= 10 ? 1 : 2); };
      const cuenta = function (id) {
        const n = ind.datos[id].n;
        return ind.mide ? '' : ' · ' + entero(n) + ' en total';
      };
      filasPar(cont, ind.titulo + ', por cada ' + entero(base.por) + ' ' + (base.etiqueta || 'habitantes'),
        [['Parla' + cuenta(REF), tasa(REF), 'referencia'], [NOMBRE[AQUI] + cuenta(AQUI), tasa(AQUI), 'aqui']], tope, dec,
        (window.SENTIDO && window.SENTIDO.de(ind.id)) || 'mas', 'hay-' + ind.id);
      const ir = el('a', 'hay__ir', 'Ver en el recuento');
      ir.href = (RUTAS ? RAIZ_WEB : 'index.html') + '?ir=ind-' + ind.id + '#' + AQUI;
      cont.appendChild(ir);
    });
  }

  /* ── La espera: las listas del hospital de cada ciudad ───────────────
     Los datos los escribe herramientas/sanidad.py. Se compara el hospital
     que le corresponde a cada ciudad (Pinto no tiene: le toca el de
     Getafe), con la demora media de los que siguen en lista. Si en alguna
     lista Parla espera menos, se dice. */
  function espera() {
    const S = window.SANIDAD;
    const caja = $('#espera');
    if (!S || !S.ciudades[REF] || !S.ciudades[AQUI]) { if (caja) caja.hidden = true; return; }
    const r = S.ciudades[REF], a = S.ciudades[AQUI];
    const dias = function (v) { return num(v, 1) + ' días'; };
    const de = function (c, id) {
      if (c.fuera) return c.corto + (c.corto.indexOf(c.fuera) >= 0 ? '' : ', en ' + c.fuera) + ', que es el que le toca a ' + NOMBRE[id];
      /* «el Hospital de Getafe» ya dice de dónde es. */
      return c.corto.indexOf(NOMBRE[id].split(' ')[0]) >= 0 ? c.corto : c.corto + ', el hospital de ' + NOMBRE[id];
    };
    $('#espera-txt').textContent = 'Lo que llevan esperando de media los que siguen en lista en el hospital que ' +
      'le toca a cada ciudad: para operarse, para la primera consulta con el especialista y para una prueba.';

    /* La espera para operarse, en grande, y cómo ha cambiado cada agosto. */
    const cif = $('#espera-cifras');
    vaciar(cif);
    [[REF, r, 'referencia'], [AQUI, a, 'aqui']].forEach(function (g) {
      const d = el('div', 'tp-cifra');
      d.dataset.quien = g[2];
      d.appendChild(el('p', 'tp-cifra__quien', NOMBRE[g[0]]));
      d.appendChild(el('p', 'tp-cifra__v', num(g[1].quirurgica.dias, 1)));
      d.appendChild(el('p', 'tp-cifra__que', 'días de espera media para operarse en ' + g[1].corto + ', ' + S.mes));
      cif.appendChild(d);
    });
    const ev = $('#espera-evol');
    vaciar(ev);
    const misma0 = r.hid === a.hid;
    const series = [[REF, r, 'referencia']].concat(misma0 ? [] : [[AQUI, a, 'aqui']]);
    const topeEv = Math.max.apply(null, series.reduce(function (t, g) {
      return t.concat(g[1].quirurgica.serie.filter(function (v) { return v != null; }));
    }, []));
    series.forEach(function (g) {
      const panel = el('div', 'evol__panel');
      panel.dataset.quien = g[2];
      panel.appendChild(el('p', 'evol__quien', mayuscula(g[1].corto)));
      const cols = el('div', 'evol__cols');
      cols.setAttribute('role', 'img');
      cols.setAttribute('aria-label', mayuscula(g[1].corto) + ': ' + S.anios.map(function (y, i) {
        const v = g[1].quirurgica.serie[i]; return y + ', ' + (v == null ? 'sin dato' : dias(v));
      }).join('; '));
      S.anios.forEach(function (y, i) {
        const v = g[1].quirurgica.serie[i];
        const c = el('div', 'evol__col' + (i === S.anios.length - 1 ? ' evol__col--ultimo' : ''));
        c.appendChild(el('span', 'evol__v', v == null ? '—' : num(v, 0)));
        const barra = el('span', 'evol__barra');
        barra.style.height = (v == null ? 0 : v / topeEv * 100).toFixed(1) + '%';
        c.appendChild(barra);
        c.appendChild(el('span', 'evol__y', y));
        cols.appendChild(c);
      });
      panel.appendChild(cols);
      ev.appendChild(panel);
    });
    const subida = function (c) {
      const se = c.quirurgica.serie, ini = se[0], fin = se[se.length - 1];
      if (ini == null) return null;
      return fin - ini;
    };
    const sr = subida(r), sa = subida(a);
    const cambio = function (v) { return v > 0 ? 'ha subido ' + dias(v) : 'ha bajado ' + dias(-v); };
    $('#espera-evol-txt').textContent = sr == null ? '' : 'Desde ' + S.antes + ', la espera para operarse en ' +
      r.corto + ' ' + cambio(sr) + (misma0 || sa == null ? '.' : '; en ' + a.corto + ', ' + cambio(sa) + '.');

    const LISTAS = [['consultas', 'Para la primera consulta con el especialista'],
      ['pruebas', 'Para una prueba: escáner, resonancia, ecografía, colonoscopia…']];
    const cont = $('#espera-listas');
    vaciar(cont);
    let menos = 0, comparadas = 0;
    LISTAS.forEach(function (L) {
      const k = L[0];
      /* La barra va contra la espera más larga de los hospitales de las once. */
      const tope = Object.keys(S.ciudades).reduce(function (t, id) {
        const x = S.ciudades[id][k]; return x ? Math.max(t, x.dias) : t;
      }, 0);
      const hL = el('h3', 'espera__h', L[1]);
      hL.id = 'espera-' + k;
      hL.dataset.sentido = 'menos';
      cont.appendChild(hL);
      const ul = el('ul', 'mun salir__filas espera__filas');
      [[REF, 'referencia', r], [AQUI, 'aqui', a]].forEach(function (g) {
        const x = g[2][k];
        const li = el('li', 'mun__fila');
        li.setAttribute('data-quien', g[1]);
        li.appendChild(el('span', 'mun__q', NOMBRE[g[0]] + ' · ' + g[2].corto.replace(/^(el|la) /, '')));
        li.appendChild(el('span', 'mun__v', x ? dias(x.dias) : 'sin dato'));
        const b = el('span', 'mun__barra');
        const i = el('i');
        i.style.width = (x ? x.dias / tope * 100 : 0).toFixed(1) + '%';
        b.appendChild(i);
        li.appendChild(b);
        ul.appendChild(li);
      });
      cont.appendChild(ul);
      if (r[k] && a[k]) { comparadas++; if (r[k].dias < a[k].dias) menos++; }
      else if (!a[k]) {
        cont.appendChild(el('p', 'salir__pie', a.corto.charAt(0).toUpperCase() + a.corto.slice(1) +
          ' da esta lista a cero, sin pacientes ni días, desde julio de 2026. Se trata como sin dato.'));
      }
    });

    /* El balance de las tres listas, sin adornos. */
    if (r.quirurgica && a.quirurgica) { comparadas++; if (r.quirurgica.dias < a.quirurgica.dias) menos++; }
    const misma = r.hid === a.hid;
    const cuantas = ['', 'una', 'dos', 'tres'];
    let t = misma ? '' : comparadas === 1
      ? 'En la única lista que publican los dos, la de operarse, se espera ' + (menos ? 'menos' : 'más') + ' en el hospital de Parla. '
      : menos === comparadas ? 'En las ' + cuantas[comparadas] + ' listas se espera menos en el hospital de Parla. '
      : menos === 0 ? 'En las ' + cuantas[comparadas] + ' listas se espera más en el hospital de Parla. '
      : 'En ' + cuantas[menos] + ' de las ' + cuantas[comparadas] + ' listas se espera menos en el hospital de Parla. ';
    $('#espera-cuenta').textContent = t;

    const pie = $('#espera-pie');
    vaciar(pie);
    pie.appendChild(document.createTextNode('Demora media, en días naturales, de los que seguían en lista en ' + S.mes +
      '. Con la libre elección, cualquiera puede pedir otro hospital, y cada hospital atiende también a gente de fuera de su zona, ' +
      'así que la lista no es solo de los vecinos. Pacientes en lista para operarse por cada 1.000 personas que tiene asignadas: ' +
      num(r.quirurgica.por1000, 1) + ' en ' + r.corto + ' y ' + num(a.quirurgica.por1000, 1) + ' en ' + a.corto + '. '));
    const f1 = el('a', null, S.fuentes.consulta[0]);
    f1.href = S.fuentes.consulta[1];
    pie.appendChild(f1);
    pie.appendChild(document.createTextNode('; población asignada, memorias de 2024 '));
    [r, a].filter(function (c, i, xs) { return xs.indexOf(c) === i && (i === 0 || c.hid !== r.hid); }).forEach(function (c, i) {
      if (i) pie.appendChild(document.createTextNode(' y '));
      const m = el('a', null, c.corto.replace(/^el /, 'del ').replace(/^la /, 'de la '));
      m.href = S.memorias[c.hid];
      pie.appendChild(m);
    });
    pie.appendChild(document.createTextNode('.'));

    /* El cartel y el enlace con su vista previa (/getafe/espera/). */
    const bot = $('#espera-botones');
    vaciar(bot);
    if (!window.CARTEL) return;
    const sinArticulo = function (c) { return c.corto.replace(/^(el|la) /, ''); };
    bot.appendChild(window.CARTEL.boton({
      id: 'espera', ciudad: function () { return AQUI; },
      titulo: function () { return 'Parla y ' + NOMBRE[AQUI] + ' · La espera'; },
      datos: function () {
        return {
          pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · La espera, ' + S.mes,
          antes: 'Para operarse en Parla se esperan', cifra: num(r.quirurgica.dias, 0), que: 'días',
          sub: 'En ' + a.corto + ', ' + num(a.quirurgica.dias, 0) + '.',
          cajas: [{ q: 'Parla, primera consulta', v: dias(r.consultas.dias), ref: true },
            { q: NOMBRE[AQUI] + ', primera consulta', v: a.consultas ? dias(a.consultas.dias) : 'sin dato' }]
        };
      }
    }));
    bot.appendChild(window.CARTEL.enlace({
      url: function () { return RUTAS ? RAIZ_WEB + AQUI + '/espera/' : 'sanidad.html?ir=espera#' + AQUI; },
      titulo: function () { return 'La espera en el hospital de Parla y en el que le toca a ' + NOMBRE[AQUI]; }
    }));
  }

  /* Dos filas con barra (Parla y la ciudad elegida, y si hace falta una tercera
     de referencia), con un título encima: lo que usan el médico de cabecera
     y la escuela infantil. La barra va contra la mayor de las once. */
  function filasPar(cont, titulo, filas, tope, fmt, sentido, id) {
    const h = el('h3', 'espera__h', titulo);
    if (id) h.id = id;   /* el nombre en clave del enlace de la cadena (indice.js) */
    if (sentido) h.dataset.sentido = sentido;
    cont.appendChild(h);
    const ul = el('ul', 'mun salir__filas espera__filas');
    filas.forEach(function (f) {
      const li = el('li', 'mun__fila');
      li.setAttribute('data-quien', f[2]);
      li.appendChild(el('span', 'mun__q', f[0]));
      li.appendChild(el('span', 'mun__v', fmt(f[1])));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = (f[1] / tope * 100).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
    cont.appendChild(ul);
  }
  /* El puesto de Parla de la cifra más baja a la más alta; los empates lo comparten. */
  function deMenos(v) { return 1 + IDS_TODAS().filter(function (id) { return v(id) < v(REF); }).length; }
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaLarga(iso) { const f = iso.split('-'); return +f[2] + ' de ' + MESES[+f[1] - 1] + ' de ' + f[0]; }
  function IDS_TODAS() { return D.MUNICIPIOS.map(function (m) { return m.id; }); }
  function pieFuentes(pie, texto, fuentes) {
    vaciar(pie);
    pie.appendChild(document.createTextNode(texto + ' '));
    fuentes.forEach(function (f, i) {
      if (i) pie.appendChild(document.createTextNode('; '));
      const a = el('a', null, f[0]);
      a.href = f[1];
      pie.appendChild(a);
    });
    pie.appendChild(document.createTextNode('.'));
  }

  /* ── El hospital ──────────────────────────────────────────────────────
     Las camas del hospital que le toca a cada ciudad, contra toda la gente que
     tiene asignada. La cuenta está en assets/hospitales.js, la misma de la
     portada y de las vistas previas. */
  const HOSP = window.HOSPITALES;
  function hospitalDe(id) { return HOSP.de(D, window.SANIDAD, id); }
  /* «el Hospital de Getafe» → «del Hospital de Getafe»; «la Fundación…» → «de la Fundación…». */
  function del_(t) { return t.replace(/^el /, 'del ').replace(/^la /, 'de la '); }
  function mayuscula(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function listaY(xs) { return xs.length > 1 ? xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1] : xs[0]; }

  function hospital() {
    const S = window.SANIDAD;
    const caja = $('#hospital');
    if (!S || !S.ciudades[REF] || !S.ciudades[AQUI]) { if (caja) caja.hidden = true; return; }
    const ic = D.indicadores.find(function (i) { return i.id === 'camas'; });
    const r = hospitalDe(REF), a = hospitalDe(AQUI);
    const misma = r === a;

    const cif = $('#hospital-cifras');
    vaciar(cif);
    [[REF, r, 'referencia'], [AQUI, a, 'aqui']].forEach(function (g) {
      const d = el('div', 'tp-cifra');
      d.dataset.quien = g[2];
      d.appendChild(el('p', 'tp-cifra__quien', NOMBRE[g[0]]));
      d.appendChild(el('p', 'tp-cifra__v', g[1].por1000 != null ? num(g[1].por1000, 1) : 'sin dato'));
      d.appendChild(el('p', 'tp-cifra__que', g[1].por1000 != null
        ? 'camas por cada 1.000 personas asignadas · ' + mayuscula(g[1].corto) + ': ' + entero(g[1].camas) +
          ' camas para ' + entero(g[1].pob) + ' personas'
        : mayuscula(g[1].corto) + ': el catálogo no da sus camas'));
      cif.appendChild(d);
    });

    /* Todos los hospitales, de más a menos camas por persona. */
    const lista = HOSP.clasificacion(D, S).map(function (h) {
      return h.hid === r.hid ? r : h.hid === a.hid ? a : h;
    });
    const puesto = lista.indexOf(r) + 1;
    const tope = lista[0].por1000;
    const ul = $('#hospital-filas');
    vaciar(ul);
    lista.forEach(function (h) {
      const li = el('li', 'mun__fila');
      li.setAttribute('data-quien', h === r ? 'referencia' : h === a ? 'aqui' : 'otro');
      li.appendChild(el('span', 'mun__q', mayuscula(h.corto) + ' · ' +
        listaY(h.ciudades.map(function (id) { return NOMBRE[id]; }))));
      li.appendChild(el('span', 'mun__v', num(h.por1000, 1)));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = (h.por1000 / tope * 100).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });

    const ultimo = puesto === lista.length;
    $('#hospital-txt').textContent = (ultimo
      ? 'De los ' + letra(lista.length) + ' hospitales que les tocan a las once ciudades, el de Parla es el que menos camas tiene por persona. '
      : 'De los ' + letra(lista.length) + ' hospitales que les tocan a las once ciudades, el de Parla es el ' + puesto + '.º en camas por persona. ') +
      (misma ? ''
        : a.por1000 == null ? ''
        : 'Con las camas por persona ' + del_(a.corto) + ', el Infanta Cristina tendría ' +
          entero(Math.round(a.por1000 * r.pob / 1000)) + ' camas; tiene ' + entero(r.camas) + '.');
    pieFuentes($('#hospital-pie'), 'Camas instaladas, del Catálogo Nacional de Hospitales; población asignada a 31 de ' +
      'diciembre de 2024, de la memoria de cada hospital. Las personas asignadas incluyen ' +
      'a los pueblos de alrededor que les tocan. Del Infanta Sofía, el hospital de Alcobendas, el catálogo no da camas.',
      [[D.fuentes[ic.fuenteId].t, D.fuentes[ic.fuenteId].url],
        ['Población asignada: memoria de 2024 ' + del_(r.corto), S.memorias[r.hid]]].concat(misma ? []
        : [['memoria de 2024 ' + del_(a.corto), S.memorias[a.hid]]]));

    botones('#hospital-botones', 'hospital', 'El hospital', function () {
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · El hospital',
        antes: 'El hospital de Parla tiene', cifra: entero(r.camas), que: 'camas',
        sub: 'para ' + entero(r.pob) + ' personas. ' + (a.camas != null && a !== r
          ? mayuscula(a.corto) + ' tiene ' + entero(a.camas) + ' para ' + entero(a.pob) + '.' : ''),
        cajas: [{ q: 'El Infanta Cristina', v: entero(r.camas) + ' camas para ' + entero(r.pob) + ' personas', ref: true }]
      };
    }, 'Las camas del hospital de Parla y del que le toca a ' + NOMBRE[AQUI]);
  }

  /* ── Lo que le falta al hospital ─────────────────────────────────────
     Las unidades asistenciales que declara el hospital de la otra ciudad y
     el de Parla no (datos/datos.js, «hospitales»), ordenadas de más a menos
     grave. Si la ciudad no tiene hospital, el que le toca. */
  function cartera() {
    const S = window.SANIDAD;
    const caja = $('#cartera');
    const k = S && S.ciudades[AQUI] ? HOSP.cartera(D, S, AQUI) : null;
    if (!k) { if (caja) caja.hidden = true; return; }
    caja.hidden = false;
    const h = k.hospital, duena = k.duena, faltan = k.faltan, solo = k.soloParla, parla = k.parla;
    const graves = k.graves;
    const de = duena === AQUI ? h.corto : h.corto + ', el que le toca a ' + NOMBRE[AQUI];

    $('#cartera-intro').textContent = 'Las especialidades y unidades que declara cada hospital en el registro de la ' +
      'Comunidad de Madrid. Cada una es algo que se atiende en el hospital de la ciudad o hay que ir a buscar a otro.';
    const cif = $('#cartera-cifra');
    vaciar(cif);
    cif.appendChild(el('p', 'cartera-cifra__v', String(faltan.length)));
    cif.appendChild(el('p', 'cartera-cifra__que', faltan.length === 1
      ? 'unidad que tiene ' + de + ' y el Infanta Cristina no'
      : 'unidades que tiene ' + de + ' y el Infanta Cristina no'));

    const t = $('#cartera-tira');
    vaciar(t);
    t.appendChild(tira(parla, faltan.length));
    const ley = el('p', 'marcador__ley');
    ley.setAttribute('aria-hidden', 'true');
    ley.innerHTML = '<span class="ley ley--hay"></span>' + parla + ' unidades en el Infanta Cristina' +
      (faltan.length ? ' <span class="ley ley--hueco"></span>' + faltan.length + ' que no tiene' : '');
    t.appendChild(ley);

    const ul = $('#cartera-huecos');
    vaciar(ul);
    /* En rojo, las de la cabeza de la lista de gravedad (assets/hospitales.js). */
    faltan.forEach(function (u) {
      const li = el('li', 'hueco-nombre' + (k.esGrave(u) ? ' hueco-nombre--grave' : ''));
      li.appendChild(el('span', 'hueco-nombre__m'));
      li.appendChild(el('span', null, u));
      ul.appendChild(li);
    });

    $('#cartera-txt').textContent = (graves.length
      ? 'En rojo, ' + (graves.length === 1 ? 'la más grave' : 'las ' + letra(graves.length) + ' más graves') +
        ': lo que atiende una urgencia vital o una cirugía compleja. '
      : faltan.length ? ''
      : 'El Infanta Cristina declara todo lo que declara ' + h.corto + '. ') +
      (solo.length ? 'Al revés, el Infanta Cristina declara ' + solo.length + ' que ' + h.corto + ' no: ' +
        listaY(solo.map(function (u) { return u.toLowerCase(); })) + '.' : '') +
      (duena === 'mostoles' ? ' En Móstoles se suman las carteras de sus dos hospitales.' : '');
    botones('#cartera-botones', 'cartera', 'Lo que le falta al hospital', function () {
      const muestra = (graves.length ? graves : faltan).slice(0, 3);
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · Lo que le falta al hospital',
        cifra: String(faltan.length), que: 'servicios',
        sub: 'que tiene ' + h.corto + ' y el de Parla no.',
        cajas: muestra.map(function (u) { return { q: 'Falta', v: u }; })
      };
    }, 'Lo que tiene el hospital que le toca a ' + NOMBRE[AQUI] + ' y el de Parla no');
    pieFuentes($('#cartera-pie'), 'Unidades asistenciales que declara cada hospital. No se cuentan «Otras unidades asistenciales», ' +
      'que no dice qué servicio es, ni el laboratorio clínico y la vacunación, que el Infanta Cristina declara con otros nombres. ' +
      'El orden de gravedad es nuestro, y está en el repositorio.',
      [[D.fuentes.sanitarios.t, D.fuentes.sanitarios.url]]);
  }

  /* La tira de la web: lo que hay en negro y un hueco por lo que falta. */
  function tira(hay, falta) {
    const n = hay + Math.ceil(falta);
    const cont = el('div', 'tira tira--quieta' + (n > 70 ? ' tira--microscopica' : n > 24 ? ' tira--densa' : ''));
    cont.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < hay; i++) cont.appendChild(el('span', 'u'));
    const enteros = Math.floor(falta + 1e-9);
    for (let j = 0; j < enteros; j++) cont.appendChild(el('span', 'u u--hueco'));
    const parte = falta - enteros;
    if (parte > 0.04) {
      const u = el('span', 'u u--hueco u--hueco-parte');
      u.style.setProperty('--parte', (parte * 100).toFixed(1) + '%');
      cont.appendChild(u);
    }
    return cont;
  }

  /* ── El médico de cabecera ────────────────────────────────────────────
     Tarjetas sanitarias por cada plaza de médico de familia y de pediatra
     en los centros de salud de cada ciudad (herramientas/primaria.py). Más
     tarjetas por plaza es más gente para cada médico. */
  function cabecera() {
    const P = window.PRIMARIA;
    const caja = $('#cabecera');
    if (!P || !P.ciudades[REF] || !P.ciudades[AQUI]) { if (caja) caja.hidden = true; return; }
    const c = function (id) { return P.ciudades[id]; };
    $('#cabecera-txt').textContent = 'La gente que le toca a cada médico de familia en los centros de salud: las tarjetas ' +
      'sanitarias de 14 años o más por cada plaza. Cuantas más, menos tiempo para cada paciente.';
    const cif = $('#cabecera-cifras');
    vaciar(cif);
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const d = el('div', 'tp-cifra');
      d.dataset.quien = g[1];
      d.appendChild(el('p', 'tp-cifra__quien', NOMBRE[g[0]]));
      d.appendChild(el('p', 'tp-cifra__v', entero(c(g[0]).familia)));
      d.appendChild(el('p', 'tp-cifra__que', 'tarjetas sanitarias de 14 años o más por cada médico de familia · ' +
        entero(c(g[0]).medicos) + ' plazas'));
      cif.appendChild(d);
    });
    /* Y la media de la Comunidad, que no depende de la ciudad elegida. */
    cif.classList.add('tp-cifras--tres');
    const m = el('div', 'tp-cifra');
    m.dataset.quien = 'otro';
    m.appendChild(el('p', 'tp-cifra__quien', 'Toda la Comunidad'));
    m.appendChild(el('p', 'tp-cifra__v', entero(P.comunidad.familia)));
    m.appendChild(el('p', 'tp-cifra__que', 'de media; Parla tiene ' + entero(Math.abs(c(REF).familia - P.comunidad.familia)) +
      (c(REF).familia > P.comunidad.familia ? ' más por médico' : ' menos por médico')));
    cif.appendChild(m);
    /* Con las tarjetas por médico de la otra ciudad, cuántos médicos de
       familia tendría Parla: la misma cuenta que el recuento. */
    const tendria = c(REF).tsiAdultos / c(AQUI).familia;
    const faltan = tendria - c(REF).medicos;
    const tt = $('#cabecera-tira');
    vaciar(tt);
    tt.appendChild(tira(c(REF).medicos, Math.max(0, faltan)));
    const ley = el('p', 'marcador__ley');
    ley.setAttribute('aria-hidden', 'true');
    ley.innerHTML = '<span class="ley ley--hay"></span>' + c(REF).medicos + ' plazas de médico de familia' +
      (faltan > 0.04 ? ' <span class="ley ley--hueco"></span>' + num(faltan) + ' que faltan' : '');
    tt.appendChild(ley);
    $('#cabecera-faltan-txt').textContent = 'Con la gente que tiene cada médico en ' + NOMBRE[AQUI] + ', Parla tendría ' +
      num(tendria) + ' médicos de familia. Tiene ' + c(REF).medicos + (faltan > 0.5 ? ': le faltan ' + num(faltan) + '.'
        : faltan < -0.5 ? ': tiene ' + num(-faltan) + ' de más.' : ': prácticamente los mismos.');

    const cont = $('#cabecera-listas');
    vaciar(cont);
    [['pediatria', 'Tarjetas de 0 a 13 años por plaza de pediatra']].forEach(function (L) {
      const k = L[0];
      const tope = Math.max.apply(null, IDS_TODAS().map(function (id) { return c(id)[k]; }));
      filasPar(cont, L[1], [['Parla', c(REF)[k], 'referencia'], [NOMBRE[AQUI], c(AQUI)[k], 'aqui'],
        ['Toda la Comunidad de Madrid', P.comunidad[k], 'otro']], tope, entero, 'menos', 'cabecera-' + k);
    });
    $('#cabecera-cuenta').textContent = 'Ordenadas de menos a más tarjetas por plaza, Parla es la ' +
      deMenos(function (id) { return c(id).familia; }) + '.ª de las ' + letra(IDS_TODAS().length) + ' en medicina de familia y la ' +
      deMenos(function (id) { return c(id).pediatria; }) + '.ª en pediatría.';
    botones('#cabecera-botones', 'cabecera', 'El médico de cabecera', function () {
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · El médico de cabecera',
        cifra: entero(c(REF).familia), que: 'pacientes por médico',
        sub: 'de familia en Parla. En ' + NOMBRE[AQUI] + ', ' + entero(c(AQUI).familia) + '.',
        cajas: [{ q: 'Pediatría en Parla', v: entero(c(REF).pediatria) + ' tarjetas por plaza', ref: true },
          { q: 'Pediatría en ' + NOMBRE[AQUI], v: entero(c(AQUI).pediatria) + ' tarjetas por plaza' }]
      };
    }, 'El médico de cabecera en Parla y en ' + NOMBRE[AQUI]);
    pieFuentes($('#cabecera-pie'), 'Se cuentan las plazas de la plantilla del Servicio Madrileño de Salud a ' +
      fechaLarga(P.fechaPlantilla) + '; una plaza puede estar vacante. Las tarjetas son de ' + P.anioTarjetas +
      ': donde haya más vecinos desde entonces, hoy habrá más tarjetas por plaza. Entran los centros de salud de cada ' +
      'término, que pueden atender también a vecinos de al lado.', [P.fuentes.plantilla, P.fuentes.tarjetas]);
  }

  /* ── Piezas comunes: cifras grandes y clasificación de las once ─────── */

  /* Dos cifras grandes, Parla y la otra, como en infraestructura.html. */
  function cifrasPar(cont, valor, que) {
    vaciar(cont);
    [[REF, 'referencia'], [AQUI, 'aqui']].forEach(function (g) {
      const d = el('div', 'tp-cifra');
      d.dataset.quien = g[1];
      d.appendChild(el('p', 'tp-cifra__quien', NOMBRE[g[0]]));
      d.appendChild(el('p', 'tp-cifra__v', valor(g[0])));
      d.appendChild(el('p', 'tp-cifra__que', que(g[0])));
      cont.appendChild(d);
    });
  }

  /* Las once, de más a menos: Parla en azul, la elegida en tinta, las demás
     apagadas. Devuelve el puesto de Parla. */
  function clasificacion(ul, valor, fmt) {
    vaciar(ul);
    const ids = IDS_TODAS().slice().sort(function (x, y) { return valor(y) - valor(x); });
    const tope = valor(ids[0]) || 1;
    ids.forEach(function (id) {
      const li = el('li', 'mun__fila');
      li.setAttribute('data-quien', id === REF ? 'referencia' : id === AQUI ? 'aqui' : 'otro');
      li.appendChild(el('span', 'mun__q', NOMBRE[id]));
      li.appendChild(el('span', 'mun__v', fmt(valor(id))));
      const b = el('span', 'mun__barra');
      const i = el('i');
      i.style.width = (valor(id) / tope * 100).toFixed(1) + '%';
      b.appendChild(i);
      li.appendChild(b);
      ul.appendChild(li);
    });
    return ids.indexOf(REF) + 1;
  }
  function puestoDe(p, total) {
    return p === 1 ? 'la primera' : p === total ? 'la última' : p === total - 1 ? 'la penúltima' : 'la ' + p + '.ª';
  }

  /* ── Después del instituto ────────────────────────────────────────────
     Quién tiene campus universitario público y conservatorio profesional
     (los del recuento), y los alumnos de FP pública por cada 100 jóvenes. */
  function indDe(id) { return D.indicadores.find(function (i) { return i.id === id; }); }
  function despues() {
    const uni = indDe('universidad'), con = indDe('conservatorio'), fp = indDe('fp');
    const tiene = function (ind, id) { return ind.datos[id].n > 0; };
    const cuantos = function (id) { return (tiene(uni, id) ? 1 : 0) + (tiene(con, id) ? 1 : 0); };
    const m = $('#despues-matriz');
    vaciar(m);
    const tabla = el('table', 'matriz__t');
    const cab = el('tr');
    ['', 'Campus universitario público', 'Conservatorio profesional'].forEach(function (t) { cab.appendChild(el('th', null, t)); });
    const thead = el('thead'); thead.appendChild(cab); tabla.appendChild(thead);
    const tb = el('tbody');
    IDS_TODAS().slice().sort(function (x, y) {
      return (cuantos(y) - cuantos(x)) || NOMBRE[x].localeCompare(NOMBRE[y], 'es');
    }).forEach(function (id) {
      const tr = el('tr');
      tr.dataset.quien = id === REF ? 'referencia' : id === AQUI ? 'aqui' : 'otro';
      tr.appendChild(el('th', null, NOMBRE[id]));
      [uni, con].forEach(function (ind) {
        const td = el('td');
        const si = tiene(ind, id);
        const marca = el('span', 'matriz__m' + (si ? '' : ' matriz__m--no'));
        marca.setAttribute('aria-label', si ? (ind.datos[id].lista || [])[0] || 'Sí' : 'No');
        marca.setAttribute('role', 'img');
        if (si) marca.title = (ind.datos[id].lista || []).join(' · ');
        td.appendChild(marca);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    tabla.appendChild(tb);
    m.appendChild(tabla);
    const nUni = IDS_TODAS().filter(function (id) { return tiene(uni, id); }).length;
    const nCon = IDS_TODAS().filter(function (id) { return tiene(con, id); }).length;
    const suyo = function (ind) {
      return tiene(ind, AQUI) ? NOMBRE[AQUI] + ' tiene ' + ind.datos[AQUI].lista[0].replace(' · ', ', ') : NOMBRE[AQUI] + ' tampoco';
    };
    $('#despues-txt').textContent = 'Parla ' + (tiene(uni, REF) ? 'tiene' : 'no tiene') + ' campus universitario público: ' +
      (tiene(uni, REF) ? '' : 'lo tienen ' + letra(nUni) + ' de las ' + letra(IDS_TODAS().length) + '. ') + suyo(uni) + '. ' +
      'Ni conservatorio profesional de música: lo tienen ' + letra(nCon) + '. ' + suyo(con) + '.';

    /* La FP pública, por cada 100 jóvenes de 12 a 17 años. */
    const base = D.BASES[fp.base];
    const v = function (id) { return fp.datos[id].n / base.valores[id] * 100; };
    cifrasPar($('#fp-cifras'), function (id) { return num(v(id), 1); }, function (id) {
      return 'alumnos de FP pública por cada 100 chicos y chicas de 12 a 17 años · ' + entero(fp.datos[id].n) + ' alumnos';
    });
    const p = clasificacion($('#fp-filas'), v, function (x) { return num(x, 1); });
    const tendria = v(AQUI) / 100 * base.valores[REF];
    $('#fp-txt').textContent = 'Parla es ' + puestoDe(p, IDS_TODAS().length) + ' de las ' + letra(IDS_TODAS().length) +
      ' en alumnos de FP pública. ' + (tendria > fp.datos[REF].n
        ? 'Con la proporción de ' + NOMBRE[AQUI] + ', tendría ' + entero(Math.round(tendria)) + ' alumnos; tiene ' +
          entero(fp.datos[REF].n) + '.'
        : 'Con la proporción de ' + NOMBRE[AQUI] + ', tendría menos: ' + entero(Math.round(tendria)) + '.');
    botones('#fp-botones', 'fp', 'La FP pública', function () {
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · La FP pública',
        antes: 'Parla tiene', cifra: entero(fp.datos[REF].n), que: 'alumnos de FP',
        sub: 'pública para ' + entero(base.valores[REF]) + ' jóvenes. ' + NOMBRE[AQUI] + ' tiene ' +
          entero(fp.datos[AQUI].n) + ' para ' + entero(base.valores[AQUI]) + '.',
        cajas: [{ q: 'Parla', v: puestoDe(p, IDS_TODAS().length) + ' de las ' + letra(IDS_TODAS().length), ref: true },
          { q: 'Y en Parla', v: (uni.datos[REF].n ? 'con' : 'sin') + ' campus universitario público' }]
      };
    }, 'La FP pública en Parla y en ' + NOMBRE[AQUI]);
    pieFuentes($('#despues-pie'), 'Campus y conservatorios dentro de cada término; alumnos de FP presencial en centros públicos, ' +
      'donde se estudia, contra los jóvenes de 12 a 17 años del padrón.',
      [[D.fuentes[uni.fuenteId].t, D.fuentes[uni.fuenteId].url], [D.fuentes[con.fuenteId].t, D.fuentes[con.fuenteId].url],
        [D.fuentes[fp.fuenteId].t, D.fuentes[fp.fuenteId].url], [D.fuentes[base.fuenteId].t, D.fuentes[base.fuenteId].url]]);
  }

  /* ── Música, idiomas y artes ──────────────────────────────────────── */
  function artes() {
    const ind = indDe('artes');
    const pob = D.BASES.total.valores;
    const v = function (id) { return ind.datos[id].n / pob[id] * 1000; };
    cifrasPar($('#artes-cifras'), function (id) { return num(v(id), 1); }, function (id) {
      return 'alumnos por cada 1.000 vecinos · ' + entero(ind.datos[id].n) + ' alumnos';
    });
    const p = clasificacion($('#artes-filas'), v, function (x) { return num(x, 1); });
    const tendria = v(AQUI) / 1000 * pob[REF];
    $('#artes-txt').textContent = 'Parla es ' + puestoDe(p, IDS_TODAS().length) + ' de las ' + letra(IDS_TODAS().length) + '. ' +
      'Con la proporción de ' + NOMBRE[AQUI] + ', estudiarían música, idiomas o artes en Parla ' +
      entero(Math.round(tendria)) + ' personas; lo hacen ' + entero(ind.datos[REF].n) + '.';
    botones('#artes-botones', 'artes', 'Música, idiomas y artes', function () {
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · Música, idiomas y artes',
        antes: 'En Parla estudian música, idiomas o artes', cifra: entero(ind.datos[REF].n), que: 'personas',
        sub: 'de ' + entero(D.BASES.total.valores[REF]) + ' vecinos. En ' + NOMBRE[AQUI] + ', ' + entero(ind.datos[AQUI].n) +
          ' de ' + entero(D.BASES.total.valores[AQUI]) + '.',
        cajas: [{ q: 'Parla', v: puestoDe(p, IDS_TODAS().length) + ' de las ' + letra(IDS_TODAS().length), ref: true }]
      };
    }, 'La música, los idiomas y las artes en Parla y en ' + NOMBRE[AQUI]);
    pieFuentes($('#artes-pie'), 'Mide matrícula, no plazas, y suma lo autonómico (escuelas oficiales de idiomas, conservatorios) ' +
      'con lo municipal (escuelas de música y danza).', [[D.fuentes[ind.fuenteId].t, D.fuentes[ind.fuenteId].url]]);
  }

  /* ── Colegios e institutos: lo que hay en Parla y lo que tendría ─────── */
  function escuelas() {
    const cont = $('#hay-listas');
    vaciar(cont);
    ['escuelas-infantiles', 'colegios', 'institutos'].forEach(function (k) {
      const ind = indDe(k);
      const base = D.BASES[ind.base];
      const hay = ind.datos[REF].n;
      const tendria = ind.datos[AQUI].n / base.valores[AQUI] * base.valores[REF];
      const falta = tendria - hay;
      const h = el('h3', 'espera__h', ind.titulo);
      h.id = 'hay-' + k;
      cont.appendChild(h);
      cont.appendChild(tira(hay, Math.max(0, falta)));
      const ley = el('p', 'marcador__ley');
      ley.setAttribute('aria-hidden', 'true');
      ley.innerHTML = '<span class="ley ley--hay"></span>' + hay + ' en Parla' +
        (falta > 0.04 ? ' <span class="ley ley--hueco"></span>' + num(falta) + ' que faltan' : '');
      cont.appendChild(ley);
      cont.appendChild(el('p', 'tp-nota tp-nota--corta', 'Con la proporción de ' + NOMBRE[AQUI] + ', Parla tendría ' +
        num(tendria) + ' para sus ' + entero(base.valores[REF]) + ' ' + base.etiqueta + '. Tiene ' + hay +
        (falta > 0.5 ? ': le faltan ' + num(falta) + '.' : falta < -0.5 ? ': tiene ' + num(-falta) + ' de más.' : ': prácticamente los mismos.')));
      const ir = el('a', 'hay__ir', 'Ver los nombres en el recuento');
      ir.href = (RUTAS ? RAIZ_WEB : 'index.html') + '?ir=ind-' + k + '#' + AQUI;
      cont.appendChild(ir);
    });
  }

  /* ── La escuela infantil ─────────────────────────────────────────────
     Quién se queda sin plaza en la pública de 0 a 2 años, en el proceso
     de admisión, y cuántos niños van a ella (herramientas/infantil.py). */
  function infantil() {
    const I = window.INFANTIL;
    const caja = $('#infantil');
    if (!I || !I.ciudades[REF] || !I.ciudades[AQUI]) { if (caja) caja.hidden = true; return; }
    const c = function (id) { return I.ciudades[id]; };
    const frase = function (id) {
      return entero(c(id).solicitudes) + ' solicitudes y ' + entero(c(id).admitidos) + ' admitidos; sin plaza, unos ' +
        entero(c(id).sinPlaza) + ', ' + num(c(id).pctSinPlaza, 1) + ' de cada 100';
    };
    $('#infantil-txt').textContent = 'Cuántos niños de 0 a 2 años van a una escuela infantil pública, y cuántas familias ' +
      'que la piden se quedan sin plaza.';
    /* En grande, los niños que van; debajo, los que se quedan sin plaza. */
    cifrasPar($('#infantil-cifras'), function (id) { return num(c(id).matriculadosPor100, 1); }, function (id) {
      return 'de cada 100 niños de 0 a 2 años van a una escuela infantil pública · ' + entero(c(id).matriculados) + ' niños';
    });
    const cont = $('#infantil-listas');
    vaciar(cont);
    const todas = IDS_TODAS();
    [['pctSinPlaza', 'De cada 100 solicitudes, sin plaza', 'menos', 'infantil-sin-plaza']].forEach(function (L) {
      const k = L[0];
      const tope = Math.max.apply(null, todas.map(function (id) { return c(id)[k]; }));
      filasPar(cont, L[1], [['Parla', c(REF)[k], 'referencia'], [NOMBRE[AQUI], c(AQUI)[k], 'aqui']], tope,
        function (v) { return num(v, 1); }, L[2], L[3]);
    });
    $('#infantil-cuenta').textContent = 'De las ' + letra(todas.length) + ', Parla es la ' +
      deMenos(function (id) { return c(id).pctSinPlaza; }) + '.ª que menos solicitudes deja sin plaza. En Parla se presentan ' +
      num(c(REF).solicitudesPor100, 0) + ' solicitudes por cada 100 niños de 0 a 2 años; en ' + NOMBRE[AQUI] + ', ' +
      num(c(AQUI).solicitudesPor100, 0) + '.';
    botones('#infantil-botones', 'infantil', 'La escuela infantil', function () {
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · La escuela infantil, curso ' + I.cursoMatricula,
        cifra: num(c(REF).matriculadosPor100, 0), que: 'de cada 100 niños',
        sub: 'de 0 a 2 años van a una escuela infantil pública en Parla. En ' + NOMBRE[AQUI] + ', ' +
          num(c(AQUI).matriculadosPor100, 0) + '.',
        cajas: [{ q: 'Parla, sin plaza', v: num(c(REF).pctSinPlaza, 1) + ' de cada 100 solicitudes', ref: true },
          { q: NOMBRE[AQUI] + ', sin plaza', v: num(c(AQUI).pctSinPlaza, 1) + ' de cada 100 solicitudes' }]
      };
    }, 'La escuela infantil en Parla y en ' + NOMBRE[AQUI]);
    pieFuentes($('#infantil-pie'), 'Sin plaza es una estimación: las solicitudes no admitidas menos las que entraron desde la ' +
      'lista de otra escuela de la ciudad. Solo cuenta el proceso ordinario: no están los niños que siguen del curso anterior ni ' +
      'las familias que no piden plaza. Niños en la escuela infantil pública: matriculados en el curso ' + I.cursoMatricula +
      ', contra los niños de 0 a 2 años del padrón a 1 de enero de 2025.', [I.fuentes.buscador,
      ['INE · Población por edad, 1 de enero de 2025', 'https://www.ine.es/jaxiT3/Tabla.htm?t=68543']]);
  }


  /* ── La discapacidad ──────────────────────────────────────────────────
     Plazas de la red pública (centros públicos y concertados) en cada
     ciudad, del registro de centros de la Comunidad, y colegios de
     educación especial (herramientas/discapacidad.py). Cada cosa, contra
     quien la usa: la discapacidad intelectual, contra quien la tiene
     reconocida; la atención temprana, contra los niños de 0 a 5 años; la
     salud mental (en sanidad.html), contra los vecinos de 18 a 64; los
     colegios (en educacion.html), contra los de 3 a 17. Nada suma al
     recuento. */
  const X_ = function () { return window.DISCAPACIDAD.ciudades; };
  const INTEL = { base: function (id) { return X_()[id].intelectual; }, por: 100,
    baseTxt: 'personas con discapacidad intelectual reconocida' };
  const PIE_INTEL = 'Personas con discapacidad intelectual o trastorno del desarrollo reconocida, de todas las edades.';
  const DIS = {
    residencia: Object.assign({ k: 'residencial', titulo: 'Dónde vivir',
      enlace: 'Dónde vivir con discapacidad intelectual en Parla y en ',
      intro: 'Las residencias y las viviendas con apoyo para personas con discapacidad intelectual que no viven con su familia.' }, INTEL),
    dia: Object.assign({ k: 'dia', titulo: 'El centro de día',
      enlace: 'Los centros de día para la discapacidad intelectual en Parla y en ',
      intro: 'Los centros de día atienden durante el día a personas con discapacidad intelectual que necesitan apoyo continuo, y que vuelven a dormir a casa.' }, INTEL),
    ocupacional: Object.assign({ k: 'ocupacional', titulo: 'El centro ocupacional',
      enlace: 'Los centros ocupacionales en Parla y en ',
      intro: 'Los centros ocupacionales dan talleres y formación a adultos con discapacidad intelectual que no tienen un empleo.' }, INTEL),
    temprana: { k: 'temprana', titulo: 'La atención temprana',
      base: function (id) { return X_()[id].ninos0a5; }, por: 1000, baseTxt: 'niños de 0 a 5 años',
      enlace: 'La atención temprana en Parla y en ',
      intro: 'Los centros de atención temprana tratan a niños de 0 a 5 años con un trastorno del desarrollo o con riesgo de tenerlo: estimulación, fisioterapia, logopedia.' },
    mental: { k: 'mental', titulo: 'La salud mental', base: adultos, por: 10000, baseTxt: 'vecinos de 18 a 64 años',
      enlace: 'La red de salud mental en Parla y en ',
      intro: 'La red de atención social a personas con enfermedad mental grave: residencias y pisos supervisados, centros de día y centros de rehabilitación psicosocial y laboral.' },
    especial: { k: 'especial', titulo: 'La educación especial', unidad: 'colegios',
      base: function (id) { return D.BASES.primaria.valores[id] + D.BASES.secundaria.valores[id]; }, por: 10000,
      baseTxt: 'niños y jóvenes de 3 a 17 años',
      enlace: 'Los colegios de educación especial en Parla y en ',
      intro: 'Los colegios de educación especial escolarizan a alumnos con discapacidad que necesitan más apoyo del que da un colegio ordinario.' }
  };
  /* Los vecinos de 18 a 64 años: todos menos los tramos de edad que ya se usan. */
  function adultos(id) {
    const E = D.contexto.edades;
    return E.tramos.reduce(function (t, x) { return t - x.valores[id]; }, E.total[id]);
  }
  function seccionDis(clave) {
    const X = window.DISCAPACIDAD, cfg = DIS[clave];
    const colegios = cfg.unidad === 'colegios';
    const unidad = colegios ? 'colegios' : 'plazas';
    const de = function (k) { return entero(k) + ' ' + (k === 1 ? unidad.replace(/s$/, '') : unidad); };
    const c = function (id) { return X.ciudades[id]; };
    const cuantos = function (id) { return c(id)[cfg.k][unidad]; };
    const base = cfg.base, por = cfg.por;
    const v = function (id) { return cuantos(id) / base(id) * por; };
    const dec = function (x) { return num(x, x === 0 ? 0 : 1); };
    /* Los colegios son pocos: «tendría 2,6» dice más que redondear. */
    const n = function (x) { return colegios ? num(x) : entero(Math.round(x)); };
    const ninguno = colegios ? 'ninguno' : 'ninguna';

    $('#' + clave + '-txt').textContent = cfg.intro;
    cifrasPar($('#' + clave + '-cifras'), function (id) { return dec(v(id)); }, function (id) {
      return unidad + ' por cada ' + entero(por) + ' ' + cfg.baseTxt + ' · ' + de(cuantos(id)) + ' para ' +
        entero(base(id));
    });
    const tendria = v(AQUI) / por * base(REF);
    $('#' + clave + '-nota').textContent = (cuantos(REF) === 0 ? 'Parla no tiene ' + ninguno + '. ' : '') +
      (cuantos(AQUI) === 0 ? NOMBRE[AQUI] + (cuantos(REF) === 0 ? ' tampoco.' : ' no tiene ' + ninguno + '.')
        : 'Con la proporción de ' + NOMBRE[AQUI] + ', Parla tendría ' + n(tendria) + ' ' + unidad +
          (cuantos(REF) === 0 ? '.' : tendria < cuantos(REF) ? ', menos de ' + (colegios ? 'los ' : 'las ') + entero(cuantos(REF)) + ' que tiene.'
            : '; tiene ' + entero(cuantos(REF)) + '.'));

    const p = clasificacion($('#' + clave + '-filas'), v, dec);
    const todas = IDS_TODAS();
    const ceros = todas.filter(function (id) { return cuantos(id) === 0; });
    $('#' + clave + '-cuenta').textContent = cuantos(REF) === 0
      ? (ceros.length === 1 ? 'Parla es la única de las ' + letra(todas.length) + ' sin ' + ninguno + '.'
        : 'Parla es una de las ' + letra(ceros.length) + ' sin ' + ninguno + ', con ' +
          listaY(ceros.filter(function (id) { return id !== REF; }).map(function (id) { return NOMBRE[id]; })) + '.')
      : 'Parla es ' + puestoDe(p, todas.length) + ' de las ' + letra(todas.length) + '.' +
        (ceros.length ? ' ' + listaY(ceros.map(function (id) { return NOMBRE[id]; })) +
          (ceros.length === 1 ? ' no tiene ' : ' no tienen ') + ninguno + '.' : '');

    /* Lo que hay en Parla, a la vista; lo de la otra ciudad, plegado. */
    const cont = $('#' + clave + '-centros');
    vaciar(cont);
    const nombres = function (id) {
      const ul = el('ul', 'nombres');
      c(id)[cfg.k].centros.forEach(function (x) {
        const li = el('li', 'nombre');
        li.appendChild(el('span', 'nombre__m'));
        li.appendChild(el('span', 'nombre__t', x[0]));
        li.appendChild(el('span', 'nombre__p', (x[1] == null ? '' : entero(x[1]) + ' plazas · ') + x[2]));
        ul.appendChild(li);
      });
      return ul;
    };
    if (cuantos(REF)) cont.appendChild(nombres(REF));
    if (cuantos(AQUI)) {
      const det = el('details', 'plegable');
      det.appendChild(el('summary', null, (colegios ? 'Los colegios de ' : 'Los centros de ') + NOMBRE[AQUI]));
      det.appendChild(nombres(AQUI));
      cont.appendChild(det);
    }

    const pies = {
      mental: ['Vecinos de 18 a 64 años a 1 de enero de 2025.', [[D.fuentes.edades.t, D.fuentes.edades.url]]],
      temprana: ['Niños de 0 a 5 años a 1 de enero de ' + X.anioPadron + '.', [X.fuentes.ninos]],
      especial: ['Niños y jóvenes de 3 a 17 años a 1 de enero de 2025; estos colegios llegan hasta los 21.',
        [[D.fuentes.edades.t, D.fuentes.edades.url]]]
    };
    const pie = pies[clave] || [PIE_INTEL, [X.fuentes.reconocidas]];
    pieFuentes($('#' + clave + '-pie'), (colegios
      ? 'Colegios públicos y concertados de educación especial dados de alta, en el término de cada ciudad. Escolarizan también a alumnos de otras ciudades. '
      : 'Plazas autorizadas en centros públicos o con plazas concertadas, en el término de cada ciudad. Las adjudica la ' +
        'Comunidad de Madrid y atienden también a gente de otras ciudades. ') + pie[0],
      [colegios ? X.fuentes.colegios : X.fuentes.registro].concat(pie[1]));

    botones('#' + clave + '-botones', clave, cfg.titulo, function () {
      return {
        pre: 'Parla frente a ' + NOMBRE[AQUI] + ' · ' + cfg.titulo,
        antes: 'Parla tiene', cifra: dec(v(REF)), que: unidad,
        sub: 'por cada ' + entero(por) + ' ' + cfg.baseTxt + '. ' + NOMBRE[AQUI] + ' tiene ' + dec(v(AQUI)) + '.',
        cajas: [{ q: 'Parla', v: cuantos(REF) === 0 && ceros.length === 1 ? 'la única de las ' + letra(todas.length) + ' sin ' + ninguno
          : puestoDe(p, todas.length) + ' de las ' + letra(todas.length), ref: true }]
      };
    }, cfg.enlace + NOMBRE[AQUI]);
  }

  /* Cuánta gente tiene reconocida una discapacidad en cada ciudad, por cada
     1.000 vecinos: el punto de partida, sin «más» ni «menos» mejor. */
  function personas() {
    const X = window.DISCAPACIDAD, c = function (id) { return X.ciudades[id]; };
    const pob = D.BASES.total.valores;
    const v = function (id) { return c(id).total / pob[id] * 1000; };
    const vi = function (id) { return c(id).intelectual / pob[id] * 1000; };
    const jov = function (id) { return c(id).menos65 / c(id).total * 100; };
    $('#personas-txt').textContent = 'Las personas a las que la Comunidad de Madrid ha reconocido una discapacidad, ' +
      'de cualquier tipo y edad, por cada 1.000 vecinos.';
    cifrasPar($('#personas-cifras'), function (id) { return num(v(id), 1); }, function (id) {
      return 'personas con discapacidad reconocida por cada 1.000 vecinos · ' + entero(c(id).total) + ' personas';
    });
    clasificacion($('#personas-filas'), v, function (x) { return num(x, 1); });
    const cont = $('#personas-listas');
    vaciar(cont);
    const topeI = Math.max.apply(null, IDS_TODAS().map(vi));
    filasPar(cont, 'Con discapacidad intelectual o trastorno del desarrollo, por cada 1.000 vecinos',
      [['Parla · ' + entero(c(REF).intelectual) + ' personas', vi(REF), 'referencia'],
        [NOMBRE[AQUI] + ' · ' + entero(c(AQUI).intelectual) + ' personas', vi(AQUI), 'aqui']], topeI,
      function (x) { return num(x, 1); }, null, 'personas-intelectual');
    $('#personas-cuenta').textContent = 'En Parla, ' + num(jov(REF), 0) + ' de cada 100 tienen menos de 65 años; en ' +
      NOMBRE[AQUI] + ', ' + num(jov(AQUI), 0) + '. Ordenadas de más a menos personas con discapacidad intelectual ' +
      'reconocida por vecino, Parla es ' + puestoDe(deMenos(function (id) { return -vi(id); }), IDS_TODAS().length) +
      ' de las ' + letra(IDS_TODAS().length) + '.';
    pieFuentes($('#personas-pie'), 'Personas valoradas por los Centros Base de la Comunidad de Madrid, a 31 de diciembre de ' +
      X.anio + ', contra los vecinos del padrón.',
      [X.fuentes.reconocidasEdad, X.fuentes.reconocidas, [D.fuentes[D.BASES.total.fuenteId].t, D.fuentes[D.BASES.total.fuenteId].url]]);
  }

  function discapacidad() {
    if (!window.DISCAPACIDAD) return;
    ['residencia', 'dia', 'ocupacional', 'temprana'].forEach(seccionDis);
    personas();
  }

  /* ── Pintar ───────────────────────────────────────────────────────── */

  const TITULO = { sanidad: 'La sanidad de', educacion: 'La educación de', inclusion: 'La inclusión en' }[PAGINA];
  function golpe() {
    const n = $('#golpe');
    if (!n) return;
    vaciar(n);
    if (PAGINA === 'sanidad' && window.SANIDAD) {
      const r = hospitalDe(REF), a = hospitalDe(AQUI);
      /* En escritorio, la misma cifra en grande a la derecha del titular. */
      const dato = $('#portada-dato');
      if (dato) {
        vaciar(dato);
        dato.appendChild(el('p', 'portada__dato-v', num(r.por1000, 1)));
        dato.appendChild(el('p', 'portada__dato-que', 'camas por cada 1.000 personas que atiende el hospital de Parla'));
        if (a !== r && a.por1000 != null) {
          dato.appendChild(el('p', 'portada__dato-otra', mayuscula(a.corto) + ': ' + num(a.por1000, 1)));
        }
      }
      n.appendChild(document.createTextNode('El hospital de Parla tiene '));
      n.appendChild(el('b', 'parla', num(r.por1000, 1) + ' camas por cada 1.000 personas'));
      /* «el Severo Ochoa» no dice de dónde es: se añade la ciudad. */
      const deQuien = a.corto.indexOf(NOMBRE[AQUI].split(' ')[0]) >= 0 ? ''
        : a.duena === AQUI ? ', el de ' + NOMBRE[AQUI] : ', el que le toca a ' + NOMBRE[AQUI];
      n.appendChild(document.createTextNode(' que atiende' + (a !== r && a.por1000 != null
        ? '; ' + a.corto + deQuien + ', ' + num(a.por1000, 1) + '.' : '.')));
    } else if (PAGINA === 'educacion') {
      const fp = indDe('fp'), base = D.BASES[fp.base];
      const v = function (id) { return fp.datos[id].n / base.valores[id] * 100; };
      const uni = indDe('universidad');
      n.appendChild(document.createTextNode('Parla ' + (uni.datos[REF].n ? 'tiene' : 'no tiene') + ' campus universitario público, y en FP pública tiene '));
      n.appendChild(el('b', 'parla', num(v(REF), 1) + ' alumnos por cada 100 jóvenes'));
      n.appendChild(document.createTextNode('. ' + NOMBRE[AQUI] + ', ' + num(v(AQUI), 1) + '.'));
      const dato = $('#portada-dato');
      if (dato) {
        vaciar(dato);
        dato.appendChild(el('p', 'portada__dato-v', num(v(REF), 1)));
        dato.appendChild(el('p', 'portada__dato-que', 'alumnos de FP pública por cada 100 jóvenes de 12 a 17 años en Parla'));
        dato.appendChild(el('p', 'portada__dato-otra', NOMBRE[AQUI] + ': ' + num(v(AQUI), 1)));
      }
    } else if (PAGINA === 'inclusion' && window.DISCAPACIDAD) {
      const X = window.DISCAPACIDAD.ciudades, r = X[REF], a = X[AQUI];
      const enDos = function (x) {
        return entero(x.residencial.plazas) + ' plazas en residencias y ' + entero(x.dia.plazas) + ' en centros de día';
      };
      n.appendChild(document.createTextNode('En Parla hay ' + entero(r.intelectual) + ' personas con discapacidad intelectual reconocida, y '));
      n.appendChild(el('b', 'parla', r.residencial.plazas === 0 && r.dia.plazas === 0
        ? 'ninguna plaza para ellas en una residencia ni en un centro de día' : enDos(r)));
      n.appendChild(document.createTextNode('. ' + NOMBRE[AQUI] + ', con ' + entero(a.intelectual) + ', tiene ' + enDos(a) + '.'));
      const dato = $('#portada-dato');
      if (dato) {
        vaciar(dato);
        dato.appendChild(el('p', 'portada__dato-v', entero(r.residencial.plazas)));
        dato.appendChild(el('p', 'portada__dato-que', 'plazas en residencias para personas con discapacidad intelectual en Parla'));
        dato.appendChild(el('p', 'portada__dato-otra', NOMBRE[AQUI] + ': ' + entero(a.residencial.plazas)));
      }
    }
  }
  function comun() {
    $('#sel-texto').textContent = NOMBRE[AQUI];
    /* Los nombres largos («Majadahonda») van más pequeños para caber en un móvil. */
    document.querySelector('.portada__titulo .t3').dataset.largo = NOMBRE[AQUI].length > 9 ? '1' : '0';
    document.querySelectorAll('[data-aqui]').forEach(function (n) { n.textContent = NOMBRE[AQUI]; });
    const vuelta = RUTAS ? RAIZ_WEB + AQUI + '/' : 'index.html#' + AQUI;
    document.querySelectorAll('.js-volver').forEach(function (a) { a.href = vuelta; });
    document.title = (PAGINA === 'inclusion' ? TITULO + ' Parla y en '
      : TITULO + ' Parla y ' + TITULO.replace(/ de$/, '').toLowerCase() + ' de ') + NOMBRE[AQUI] + ' · ' + D.NOMBRE_WEB;
  }
  function pintar() {
    comun();
    golpe();
    if (PAGINA === 'sanidad') { hay(); hospital(); cartera(); cabecera(); espera(); if (window.DISCAPACIDAD) seccionDis('mental'); }
    if (PAGINA === 'educacion') { despues(); artes(); escuelas(); infantil(); if (window.DISCAPACIDAD) seccionDis('especial'); }
    if (PAGINA === 'inclusion') discapacidad();
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
  window.addEventListener('hashchange', function () {
    const h = (location.hash || '').replace('#', '');
    if (valida(h) && h !== AQUI) { sel.value = h; sel.dispatchEvent(new Event('change')); }
  });
  enlace();
  pintar();
})();

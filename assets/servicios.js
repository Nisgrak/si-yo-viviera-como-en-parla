/* ═══════════════════════════════════════════════════════════════════════
   SANIDAD · sanidad.html  y  EDUCACIÓN · educacion.html
   Un solo script para las dos páginas: cada una pinta las secciones que
   tiene (<body data-pagina>). Arriba, lo que hay de su área en el recuento
   (los mismos indicadores de datos/datos.js, con la misma base); después,
   lo que no cuenta el recuento:
     sanidad    la espera en el hospital (datos/sanidad.js) y el médico de
                cabecera (datos/primaria.js)
     educación  la escuela infantil de 0 a 2 años (datos/infantil.js)
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
    D.indicadores.filter(function (i) { return i.grupo === GRUPO; }).forEach(function (ind) {
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
    $('#espera-txt').textContent = 'Quien espera una operación en ' + de(r, REF) + ', lleva de media ' +
      dias(r.quirurgica.dias) + '. En ' + de(a, AQUI) + ', ' + dias(a.quirurgica.dias) + '.';

    const LISTAS = [['quirurgica', 'Para operarse'], ['consultas', 'Para la primera consulta con el especialista'],
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

    /* El balance, sin adornos, y cómo ha cambiado la espera en Parla. */
    const misma = r.hid === a.hid;
    const cuantas = ['', 'una', 'dos', 'tres'];
    let t = misma ? '' : comparadas === 1
      ? 'En la única lista que publican los dos, la de operarse, se espera ' + (menos ? 'menos' : 'más') + ' en el hospital de Parla. '
      : menos === comparadas ? 'En las ' + cuantas[comparadas] + ' listas se espera menos en el hospital de Parla. '
      : menos === 0 ? 'En las ' + cuantas[comparadas] + ' listas se espera más en el hospital de Parla. '
      : 'En ' + cuantas[menos] + ' de las ' + cuantas[comparadas] + ' listas se espera menos en el hospital de Parla. ';
    const q = r.quirurgica;
    if (q.antes != null) {
      t += 'Hace dos años, en ' + S.antes + ', la espera para operarse en ' + r.corto + ' era de ' + dias(q.antes) +
        (q.dias > q.antes ? '; ha subido ' + dias(q.dias - q.antes) + '.' : '; ha bajado ' + dias(q.antes - q.dias) + '.');
    }
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
          pre: 'Parla · ' + r.hospital + ' · ' + S.mes,
          cifra: num(r.quirurgica.dias, 1), que: 'días de espera media para operarse',
          cajas: [{ q: NOMBRE[AQUI] + ' · ' + sinArticulo(a), v: dias(a.quirurgica.dias) + ' para operarse' },
            { q: 'Parla, primera consulta', v: dias(r.consultas.dias), ref: true },
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
     El hospital público que le toca a cada ciudad (datos/sanidad.js, el de
     su memoria de 2024) y sus camas instaladas (el indicador «camas» del
     recuento), contra toda la población que tiene asignada. Pinto y Pozuelo
     no tienen hospital y se les cuenta el que les toca; del Infanta Sofía,
     el de Alcobendas, no hay camas en el catálogo que usa la web. */
  function hospitales() {
    const S = window.SANIDAD;
    const ic = D.indicadores.find(function (i) { return i.id === 'camas'; });
    const H = {};
    IDS_TODAS().forEach(function (id) {
      const s = S.ciudades[id];
      if (!s) return;
      const h = H[s.hid] || (H[s.hid] = { hid: s.hid, nombre: s.hospital, corto: s.corto, pob: s.pob,
        ciudades: [], camas: null, duena: null });
      h.ciudades.push(id);
      (ic.datos[id].lista || []).forEach(function (x) {
        const m = x.match(/^(.*?)\s*·\s*([\d.]+) camas$/);
        if (m && m[1].trim() === s.hospital) { h.camas = +m[2].replace(/\./g, ''); h.duena = id; }
      });
    });
    Object.keys(H).forEach(function (k) {
      const h = H[k];
      h.por1000 = h.camas != null && h.pob ? h.camas / h.pob * 1000 : null;
    });
    return H;
  }
  function hospitalDe(id) {
    const H = hospitales();
    return H[window.SANIDAD.ciudades[id].hid];
  }
  /* «el Hospital de Getafe» → «del Hospital de Getafe»; «la Fundación…» → «de la Fundación…». */
  function del_(t) { return t.replace(/^el /, 'del ').replace(/^la /, 'de la '); }
  function mayuscula(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function listaY(xs) { return xs.length > 1 ? xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1] : xs[0]; }

  function hospital() {
    const S = window.SANIDAD;
    const caja = $('#hospital');
    if (!S || !S.ciudades[REF] || !S.ciudades[AQUI]) { if (caja) caja.hidden = true; return; }
    const H = hospitales();
    const ic = D.indicadores.find(function (i) { return i.id === 'camas'; });
    const r = H[S.ciudades[REF].hid], a = H[S.ciudades[AQUI].hid];
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
    const lista = Object.keys(H).map(function (k) { return H[k]; }).filter(function (h) { return h.por1000 != null; })
      .sort(function (x, y) { return y.por1000 - x.por1000; });
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
    pieFuentes($('#hospital-pie'), 'Camas instaladas, y población asignada a 31 de diciembre de 2024, de la memoria de ' +
      'cada hospital. Las personas asignadas incluyen ' +
      'a los pueblos de alrededor que les tocan. Del Infanta Sofía, el hospital de Alcobendas, el catálogo no da camas.',
      [[D.fuentes[ic.fuenteId].t, D.fuentes[ic.fuenteId].url], ['Memorias de 2024 de los hospitales del SERMAS', S.memorias[r.hid]]]);

    const bot = $('#hospital-botones');
    vaciar(bot);
    if (window.CARTEL) {
      bot.appendChild(window.CARTEL.boton({
        id: 'hospital', ciudad: function () { return AQUI; },
        titulo: function () { return 'Parla y ' + NOMBRE[AQUI] + ' · El hospital'; },
        datos: function () {
          return {
            pre: 'Parla · ' + r.nombre,
            cifra: num(r.por1000, 1), que: 'camas por cada 1.000 personas que atiende',
            cajas: [{ q: NOMBRE[AQUI] + ' · ' + a.corto.replace(/^(el|la) /, ''), v: a.por1000 != null ? num(a.por1000, 1) + ' camas por cada 1.000' : 'sin dato' },
              { q: 'Parla', v: entero(r.camas) + ' camas para ' + entero(r.pob) + ' personas', ref: true }]
          };
        }
      }));
    }
  }

  /* ── Lo que le falta al hospital ─────────────────────────────────────
     Las unidades asistenciales que declara el hospital de la otra ciudad y
     el de Parla no (datos/datos.js, «hospitales»), ordenadas de más a menos
     grave. Si la ciudad no tiene hospital, el que le toca. */
  function cartera() {
    const S = window.SANIDAD;
    const caja = $('#cartera');
    const h = S && S.ciudades[AQUI] ? hospitalDe(AQUI) : null;
    const duena = h && h.duena;
    if (!duena || !D.hospitales[duena] || !D.hospitales[duena].unidades) { if (caja) caja.hidden = true; return; }
    caja.hidden = false;
    const fuera = D.hospitales.noComparables;
    const vale = function (u) { return fuera.indexOf(u) < 0; };
    const orden = D.hospitales.gravedad || [];
    const puesto = function (u) { const i = orden.indexOf(u); return i < 0 ? orden.length : i; };
    const otro = D.hospitales[duena];
    const faltan = otro.faltanEnReferencia.filter(vale).sort(function (x, y) {
      return (puesto(x) - puesto(y)) || x.localeCompare(y, 'es');
    });
    const solo = otro.faltanAqui.filter(vale);
    const parla = D.hospitales[REF].unidades;
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
    /* Se destacan las de la cabeza de la lista de gravedad: lo que atiende una
       urgencia vital o una cirugía compleja (hasta Angiología). */
    const GRAVES = orden.slice(0, orden.indexOf('Angiología y Cirugía Vascular') + 1);
    const graves = faltan.filter(function (u) { return GRAVES.indexOf(u) >= 0; });
    faltan.forEach(function (u) {
      const li = el('li', 'hueco-nombre' + (GRAVES.indexOf(u) >= 0 ? ' hueco-nombre--grave' : ''));
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
        pre: 'Centros de salud de Parla: tarjetas sanitarias de 14 años o más por cada plaza de médico de familia',
        cifra: entero(c(REF).familia), que: 'tarjetas por plaza',
        cajas: [{ q: NOMBRE[AQUI], v: entero(c(AQUI).familia) + ' tarjetas por plaza' },
          { q: 'Pediatría en Parla', v: entero(c(REF).pediatria) + ' tarjetas por plaza', ref: true },
          { q: 'Pediatría en ' + NOMBRE[AQUI], v: entero(c(AQUI).pediatria) + ' tarjetas por plaza' }]
      };
    }, 'El médico de cabecera en Parla y en ' + NOMBRE[AQUI]);
    pieFuentes($('#cabecera-pie'), 'Se cuentan las plazas de la plantilla del Servicio Madrileño de Salud a ' +
      fechaLarga(P.fechaPlantilla) + '; una plaza puede estar vacante. Las tarjetas son de ' + P.anioTarjetas +
      ': donde haya más vecinos desde entonces, hoy habrá más tarjetas por plaza. Entran los centros de salud de cada ' +
      'término, que pueden atender también a vecinos de al lado.', [P.fuentes.plantilla, P.fuentes.tarjetas]);
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
    $('#infantil-txt').textContent = 'En el proceso de admisión «' + I.cursoAdmision +
      '» de las escuelas infantiles públicas, de 0 a 2 años, Parla tuvo ' + frase(REF) + '. En ' + NOMBRE[AQUI] + ', ' + frase(AQUI) + '.';
    const cont = $('#infantil-listas');
    vaciar(cont);
    const todas = IDS_TODAS();
    [['pctSinPlaza', 'De cada 100 solicitudes, sin plaza', 'menos', 'infantil-sin-plaza'],
      ['matriculadosPor100', 'Niños de 0 a 2 años en la escuela infantil pública, por cada 100', 'mas', 'infantil-matriculados']].forEach(function (L) {
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
        pre: 'Escuelas infantiles públicas de Parla, admisión «' + I.cursoAdmision + '»: de cada 100 solicitudes',
        cifra: num(c(REF).pctSinPlaza, 1), que: 'se quedan sin plaza',
        cajas: [{ q: NOMBRE[AQUI], v: num(c(AQUI).pctSinPlaza, 1) + ' de cada 100 sin plaza' },
          { q: 'Parla', v: 'unos ' + entero(c(REF).sinPlaza) + ' niños sin plaza', ref: true },
          { q: NOMBRE[AQUI], v: 'unos ' + entero(c(AQUI).sinPlaza) + ' niños sin plaza' }]
      };
    }, 'La escuela infantil en Parla y en ' + NOMBRE[AQUI]);
    pieFuentes($('#infantil-pie'), 'Sin plaza es una estimación: las solicitudes no admitidas menos las que entraron desde la ' +
      'lista de otra escuela de la ciudad. Solo cuenta el proceso ordinario: no están los niños que siguen del curso anterior ni ' +
      'las familias que no piden plaza. Niños en la escuela infantil pública: matriculados en el curso ' + I.cursoMatricula +
      ', contra los niños de 0 a 2 años del padrón a 1 de enero de 2025.', [I.fuentes.buscador,
      ['INE · Población por edad, 1 de enero de 2025', 'https://www.ine.es/jaxiT3/Tabla.htm?t=68543']]);
  }


  /* ── Pintar ───────────────────────────────────────────────────────── */

  const TITULO = { sanidad: 'La sanidad de', educacion: 'La educación de' }[PAGINA];
  function golpe() {
    const n = $('#golpe');
    if (!n) return;
    vaciar(n);
    if (PAGINA === 'sanidad' && window.SANIDAD) {
      const r = hospitalDe(REF), a = hospitalDe(AQUI);
      n.appendChild(document.createTextNode('El hospital de Parla tiene '));
      n.appendChild(el('b', 'parla', num(r.por1000, 1) + ' camas por cada 1.000 personas'));
      n.appendChild(document.createTextNode(' que atiende' + (a !== r && a.por1000 != null
        ? '; ' + a.corto + ', ' + num(a.por1000, 1) + '.' : '.')));
    } else if (PAGINA === 'educacion' && window.INFANTIL) {
      const I = window.INFANTIL.ciudades;
      n.appendChild(document.createTextNode('De cada 100 solicitudes de plaza en una escuela infantil pública de Parla, '));
      n.appendChild(el('b', 'parla', num(I[REF].pctSinPlaza, 1) + ' se quedan sin plaza'));
      n.appendChild(document.createTextNode('. En ' + NOMBRE[AQUI] + ', ' + num(I[AQUI].pctSinPlaza, 1) + '.'));
    }
  }
  function comun() {
    $('#sel-texto').textContent = NOMBRE[AQUI];
    /* Los nombres largos («Majadahonda») van más pequeños para caber en un móvil. */
    document.querySelector('.portada__titulo .t3').dataset.largo = NOMBRE[AQUI].length > 9 ? '1' : '0';
    document.querySelectorAll('[data-aqui]').forEach(function (n) { n.textContent = NOMBRE[AQUI]; });
    const vuelta = RUTAS ? RAIZ_WEB + AQUI + '/' : 'index.html#' + AQUI;
    document.querySelectorAll('.js-volver').forEach(function (a) { a.href = vuelta; });
    document.title = TITULO + ' Parla y ' + TITULO.replace(/ de$/, '').toLowerCase() + ' de ' + NOMBRE[AQUI] + ' · ' + D.NOMBRE_WEB;
  }
  function pintar() {
    comun();
    golpe();
    hay();
    if (PAGINA === 'sanidad') { hospital(); cartera(); cabecera(); espera(); }
    if (PAGINA === 'educacion') infantil();
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

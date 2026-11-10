/* ═══════════════════════════════════════════════════════════════════════
   EL CARTEL A4 · el de todas las páginas
   Un cartel con formato de anuncio: una frase de entrada, la cifra grande,
   lo que mide en rojo, una frase debajo y unas cajas con las cifras que la
   explican, sobre uno de los dos fondos de assets/cartel/ y con el QR de
   assets/qr.js en la banda del pie. El PDF lo hace el propio navegador
   desde el diálogo de impresión, así que no hace falta ninguna librería.
   Estilos: .cartel y .k* de estilos.css.

   Uso desde una página:
     CARTEL.boton({ titulo, id, ciudad, datos: function () {
       return { pre, antes, cifra, que, fin, sub, cajas: [{ q, v, ref }] };
     } })
   devuelve el botón «Cartel para compartir»; el dato se calcula al pulsar,
   con la ciudad elegida en ese momento. Y CARTEL.enlace({ url, titulo }),
   el de «Compartir esta sección».

   La portada monta sus carteles con las piezas (CARTEL.piezas: base,
   titular, banda, ajustar, tira) y los abre con CARTEL.abrir({ titulo, id,
   montar(fondo), cifra: true }), que además deja elegir entre la cifra
   redondeada y con decimales (CARTEL.cifra()).
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /* Los fondos (medio mega) se piden al ir a por un cartel: al pasar por el
     botón o llegar a él con el teclado. Antes de imprimir se espera a que
     estén, que a medio cargar saldrían en blanco. La ruta se resuelve al
     cargar: luego la barra pasa a /getafe/ y una ruta relativa se iría a
     buscar a /getafe/assets/. */
  const FONDOS = ['papel', 'barrio'];
  const ROTULO_FONDO = { papel: 'Papel', barrio: 'El barrio' };
  const RUTA = new URL('assets/cartel/', document.baseURI).href;
  let precargados = false;
  function precargar(e) {
    if (precargados || !e.target.closest || !e.target.closest('.compartir, .fondos')) return;
    precargados = true;
    FONDOS.forEach(function (f) { (new Image()).src = RUTA + f + '.jpg'; });
  }
  ['pointerover', 'focusin', 'touchstart'].forEach(function (t) { document.addEventListener(t, precargar, { passive: true }); });

  function guardado(clave, valores) {
    try {
      const g = localStorage.getItem(clave);
      if (valores.indexOf(g) >= 0) return g;
    } catch (e) { /* sin almacenamiento: el de siempre */ }
    return valores[0];
  }
  function guardar(clave, v) {
    try { localStorage.setItem(clave, v); } catch (e) { /* da igual */ }
  }
  function fondoElegido() { return guardado('fondo', FONDOS); }

  /* El cartel es un anuncio, no una tabla: «21,6 oficinas de farmacia»
     chirría dicha en la calle. En la portada la cifra va redondeada por
     defecto y el decimal se queda en la web, que sí puede explicarlo; quien
     quiera el número exacto lo elige en el diálogo. */
  const CIFRAS = ['redonda', 'exacta'];
  function cifraElegida() { return guardado('cifra', CIFRAS); }

  function hoja() {
    let r = document.getElementById('cartel');
    if (!r) {
      r = el('div', 'cartel');
      r.id = 'cartel';
      r.setAttribute('aria-hidden', 'true');
      document.body.appendChild(r);
    }
    return r;
  }

  /* ── Las piezas ─────────────────────────────────────────────────────── */

  /* El fondo y la capa con la frase de entrada. Devuelve la capa, donde se
     monta lo demás. */
  function base(raiz, fondo, pre) {
    while (raiz.firstChild) raiz.removeChild(raiz.firstChild);
    raiz.className = 'cartel cartel--afiche';
    raiz.setAttribute('data-fondo', fondo);
    const img = el('img', 'kfondo');
    img.src = RUTA + fondo + '.jpg';
    img.alt = '';
    raiz.appendChild(img);
    const capa = el('div', 'kcapa');
    capa.appendChild(el('p', 'kpre', esc(pre)));
    raiz.appendChild(capa);
    return capa;
  }

  /* El titular se lee solo, pegado en una farola: quién («A Parla le
     faltan»), la cifra, qué (en rojo, como los carteles de barrio) y, debajo,
     una frase corta que dice contra qué se mide. */
  function titular(capa, d) {
    const tit = el('h1', 'ktit');
    if (d.antes) tit.appendChild(el('span', 'ktit__a', esc(d.antes)));
    /* Con `dos`, las dos ciudades frente a frente, cada una con su cifra:
       [{ quien, cifra, rojo }]. La que se queda corta, en rojo. */
    if (d.dos) {
      const g = el('div', 'ktit__dos');
      d.dos.forEach(function (x) {
        const c = el('div', 'ktit__col');
        c.appendChild(el('span', 'ktit__a', esc(x.quien)));
        /* `nota`: una línea corta bajo el nombre (el hospital, la salida). */
        if (x.nota) c.appendChild(el('span', 'ktit__h ktit__h--nota', esc(x.nota)));
        c.appendChild(el('span', 'ktit__n ktit__n--col' + (x.rojo ? ' ktit__n--rojo' : ''), esc(x.cifra)));
        /* `pie`: lo que dice la cifra, pegado a ella («salen por cada una que entra»). */
        if (x.pie) c.appendChild(el('span', 'ktit__h ktit__h--pie', esc(x.pie)));
        g.appendChild(c);
      });
      tit.appendChild(g);
    } else tit.appendChild(el('span', 'ktit__n', esc(d.cifra)));
    tit.appendChild(el('span', 'ktit__q', esc(d.que)));
    if (d.fin) tit.appendChild(el('span', 'ktit__m', esc(d.fin)));
    capa.appendChild(tit);
    if (d.sub) capa.appendChild(el('p', 'ksub', esc(d.sub)));
    return tit;
  }

  /* Las cajas de debajo: { q, v, ref } con el rótulo en negrita, o
     { hueco: texto } para una unidad que falta, con su nombre y en hueco. */
  function cajas(capa, lista) {
    const fila = el('ul', 'kcajas');
    lista.forEach(function (c) {
      if (c.hueco != null) {
        const li = el('li', 'kcaja kcaja--hueco');
        li.appendChild(el('span', 'kcaja__t', esc(c.hueco)));
        fila.appendChild(li);
      } else {
        fila.appendChild(el('li', 'kcaja' + (c.ref ? ' kcaja--ref' : ''),
          (c.q ? '<b>' + esc(c.q) + '</b>' : '') + esc(c.v)));
      }
    });
    fila.dataset.n = String(lista.length);
    capa.appendChild(fila);
    return fila;
  }

  function qr(ciudad) {
    const q = (window.QR || {})[ciudad] || (window.QR || {})._;
    if (!q) return null;
    const caja = el('div', 'kqr');
    const lado = q.n + 8;                       /* zona de silencio: 4 módulos */
    caja.innerHTML = '<svg viewBox="-4 -4 ' + lado + ' ' + lado + '" role="img" aria-label="Código QR a ' +
      esc(q.url) + '"><rect x="-4" y="-4" width="' + lado + '" height="' + lado + '" fill="#fff"/>' +
      '<path d="' + q.d + '" fill="#161616"/></svg>';
    return caja;
  }

  /* La banda del pie: el QR a la ciudad elegida, la marca y la dirección. */
  function banda(raiz, ciudad) {
    const b = el('div', 'kbanda');
    const q = qr(ciudad);
    if (q) b.appendChild(q);
    const txt = el('div', 'kbanda__txt');
    const marca = el('div', 'kbanda__marca');
    const cola = document.querySelector('.marca__ballena');
    if (cola) marca.appendChild(cola.cloneNode(true));
    marca.appendChild(el('p', 'kbanda__h', window.DATOS.NOMBRE_WEB.replace(', ', ',<br>')));
    txt.appendChild(marca);
    txt.appendChild(el('span', 'kbanda__raya'));
    txt.appendChild(el('p', 'kbanda__url', 'siyovivieracomoenparla.netlify.app'));
    b.appendChild(txt);
    raiz.appendChild(b);
  }

  /* El hueco, el mismo de la web: esquina corta y un trazo largo centrado en
     cada lado, en rojo. Va en SVG para que imprima igual que se ve. */
  const HUECO =
    '<svg viewBox="0 0 15 15" fill="none" stroke="#c02719" stroke-width="1.5" aria-hidden="true" focusable="false">' +
    '<path d="M.75 4.25V3.75a3 3 0 0 1 3-3H4.25M10.75 .75h0.5a3 3 0 0 1 3 3V4.25M14.25 10.75v0.5a3 3 0 0 1-3 3H10.75' +
    'M4.25 14.25H3.75a3 3 0 0 1-3-3V10.75M5.5 .75H9.5M14.25 5.5V9.5M9.5 14.25H5.5M.75 9.5V5.5"/></svg>';
  /* Una tira de huecos, uno por equipamiento que falta. El lado lo fija quien
     la monta, en --ku. */
  function tira(cuantos) {
    const r = el('div', 'krejilla');
    for (let i = 0; i < cuantos; i++) r.appendChild(el('span', 'ku', HUECO));
    return r;
  }

  /* El titular tiene que llenar el ancho sin desbordar ni pisar lo que hay
     debajo. Lo que manda es la palabra más larga, no el número de caracteres,
     y una palabra que envuelve no ensancha su bloque: hay que medirla suelta.
     Se pinta fuera de pantalla, se busca el mayor cuerpo que cabe, y se apaga.

     El suelo se mide desde el borde superior del A4 y cambia con el fondo. En
     «papel» manda la banda oscura del pie: el bloque entero —titular y lo de
     debajo— tiene que quedar por encima. En «barrio» manda el tejado de la
     foto: el titular no puede pisarlo, pero las cajas sí, que llevan su
     propio fondo claro y sobre la foto se leen igual. */
  const SUELO = { papel: 231, barrio: 130 };
  function ajustar(raiz, tit, fondo, ultimo) {
    raiz.classList.add('midiendo');
    const capa = raiz.querySelector('.kcapa');
    const marco = raiz.getBoundingClientRect();
    const mm = marco.height / 297;
    /* El ancho que de verdad tiene el titular, no el de la capa: el de la
       capa incluye el margen de los lados y una palabra larga se saldría. */
    const ancho = tit.clientWidth;
    const manda = fondo === 'barrio' ? tit : (ultimo || raiz.querySelector('.kcajas') || tit);
    const tope = marco.top + (SUELO[fondo] || SUELO.papel) * mm;
    const regla = el('span');
    regla.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;' +
      'font-weight:800;font-stretch:62%;letter-spacing:-.035em;text-transform:uppercase;';
    regla.style.fontFamily = getComputedStyle(tit).fontFamily;
    capa.appendChild(regla);
    const palabras = [];
    /* Con dos columnas, lo que va dentro de una (el nombre, la línea bajo él, la cifra, lo que va pegado
       a ella) tiene que caber en el ancho de la columna, que es la mitad. */
    const col = tit.querySelector('.ktit__col');
    const anchoCol = col ? col.clientWidth : ancho;
    tit.querySelectorAll('span').forEach(function (sp) {
      /* El nombre y las líneas pequeñas llevan menos cierre de letras que el titular (que es lo que mide la regla): se les da un poco de aire. */
      const e = sp.classList.contains('ktit__n') ? 1.35 :
        sp.classList.contains('ktit__a') ? 0.42 * 1.1 : sp.classList.contains('ktit__h') ? 0.3 * 1.1 : 1;
      const lim = sp.closest('.ktit__col') ? anchoCol : ancho;
      /* La cifra (.ktit__n) hereda el cierre de letras del titular en puntos, no en em de su propio
         cuerpo (1,35 veces mayor): la regla lo copia, o se queda corta y la cifra se sale de su columna. */
      const cifra = sp.classList.contains('ktit__n');
      sp.textContent.split(/\s+/).forEach(function (w) { if (w) palabras.push({ t: w, e: e, lim: lim, cifra: cifra }); });
    });
    let pt = 160;
    for (; pt > 28; pt -= 2) {
      let cabe = true;
      for (let k = 0; k < palabras.length; k++) {
        regla.style.fontSize = (pt * palabras[k].e) + 'pt';
        regla.style.letterSpacing = palabras[k].cifra ? (-0.035 * pt) + 'pt' : '-.035em';
        regla.textContent = palabras[k].t;
        if (regla.offsetWidth > palabras[k].lim) { cabe = false; break; }
      }
      if (!cabe) continue;
      tit.style.fontSize = pt + 'pt';
      if (manda.getBoundingClientRect().bottom <= tope) break;
    }
    tit.style.fontSize = pt + 'pt';
    capa.removeChild(regla);
    raiz.classList.remove('midiendo');
  }

  /* El cartel de un dato, el de las páginas: todas las piezas en orden. */
  function montarDatos(d, ciudad, fondo) {
    const raiz = hoja();
    const capa = base(raiz, fondo, d.pre);
    const tit = titular(capa, d);
    cajas(capa, d.cajas || []);
    banda(raiz, ciudad);
    ajustar(raiz, tit, fondo);
  }

  /* Las dos ciudades frente a frente, para `dos`: Parla en rojo solo si va peor
     y el dato tiene sentido marcado (peor). nombres: { id: nombre }; f(id) da la
     cifra; extra.nota(id) y extra.pie(id), si hay, van bajo el nombre y bajo la cifra. */
  function frente(nombres, ref, aqui, f, peor, extra) {
    return [ref, aqui].map(function (id) {
      const x = { quien: nombres[id], cifra: f(id), rojo: id === ref && !!peor };
      if (extra && extra.nota) x.nota = extra.nota(id);
      if (extra && extra.pie) x.pie = extra.pie(id);
      return x;
    });
  }

  /* El puesto de Parla entre las ciudades con dato, desde el lado más
     cercano: «la más alta», «la segunda más baja», «la 4.ª más alta». */
  const LETRA = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
  function puesto(vals, ref) {
    const ids = Object.keys(vals).filter(function (i) { return vals[i] != null; });
    const mayores = ids.filter(function (i) { return vals[i] > vals[ref]; }).length;
    const menores = ids.filter(function (i) { return vals[i] < vals[ref]; }).length;
    const alta = mayores <= menores;
    const p = (alta ? mayores : menores) + 1;
    const lado = alta ? 'alta' : 'baja';
    return { texto: p === 1 ? 'la más ' + lado : p === 2 ? 'la segunda más ' + lado : 'la ' + p + '.ª más ' + lado,
      n: ids.length, letra: LETRA[ids.length] || String(ids.length) };
  }

  /* ── Imprimir ───────────────────────────────────────────────────────── */

  /* op: { titulo(), id(), montar(fondo) }. */
  function imprimir(op) {
    op.montar(fondoElegido());
    const antes = document.title;
    document.title = op.titulo();      /* el nombre que el navegador propone para el PDF */
    document.documentElement.setAttribute('data-cartel', op.id());
    let limpio = false;
    function limpiar() {
      if (limpio) return;
      limpio = true;
      document.documentElement.removeAttribute('data-cartel');
      document.title = antes;
      window.removeEventListener('afterprint', limpiar);
    }
    window.addEventListener('afterprint', limpiar);
    const img = document.querySelector('.cartel--afiche .kfondo');
    const listo = img && img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    listo.then(function () {
      window.print();
      setTimeout(limpiar, 1500);   /* Safari no siempre dispara afterprint */
    });
  }

  /* ── El diálogo: la cifra (solo en la portada) y el fondo ───────────── */

  let pendiente = null;
  function marcar(d) {
    const c = cifraElegida(), f = fondoElegido();
    d.querySelectorAll('.cifra__op').forEach(function (b) {
      const activa = b.dataset.cifra === c;
      b.dataset.activo = activa ? '1' : '0';
      b.setAttribute('aria-pressed', activa ? 'true' : 'false');
    });
    d.querySelectorAll('.fondo').forEach(function (x) { x.dataset.activo = x.dataset.fondo === f ? '1' : '0'; });
  }
  function dialogo() {
    let d = document.getElementById('elige-fondo');
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
    [{ v: 'redonda', t: 'Redondeada' }, { v: 'exacta', t: 'Con decimales' }].forEach(function (o) {
      const b = el('button', 'cifra__op', o.t);
      b.type = 'button';
      b.dataset.cifra = o.v;
      b.addEventListener('click', function () { guardar('cifra', o.v); marcar(d); });
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
      im.src = RUTA + f + '.jpg';
      im.alt = '';
      b.appendChild(im);
      b.appendChild(el('span', 'fondo__n', ROTULO_FONDO[f] || f));
      b.addEventListener('click', function () {
        guardar('fondo', f);
        d.close();
        if (pendiente) imprimir(pendiente);
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

  /* op: { titulo(), id(), montar(fondo), cifra }: con `cifra`, el diálogo
     deja elegir entre la cifra redondeada y con decimales. */
  function abrir(op) {
    pendiente = op;
    const d = dialogo();
    d.querySelector('.cifra').hidden = !op.cifra;
    marcar(d);
    if (d.showModal) d.showModal(); else imprimir(op);
  }

  /* El mismo icono que los demás botones de la web (TRAZOS.descarga, en app.js). */
  const DESCARGA = '<span class="compartir__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 3.4v11.2"/><path d="M7.6 10.4 12 14.8l4.4-4.4"/>' +
    '<path d="M4.2 16.6v2.6a1.4 1.4 0 0 0 1.4 1.4h12.8a1.4 1.4 0 0 0 1.4-1.4v-2.6"/></svg></span>';

  function boton(op) {
    const b = el('button', 'compartir', DESCARGA + '<span>Cartel para compartir</span>');
    b.type = 'button';
    b.title = 'Genera un cartel A4 con este dato, listo para imprimir o guardar en PDF';
    b.addEventListener('click', function () {
      abrir({
        titulo: op.titulo, id: function () { return op.id; },
        montar: function (fondo) { montarDatos(op.datos(), op.ciudad(), fondo); }
      });
    });
    return b;
  }

  /* «Compartir esta sección»: el enlace con su propia vista previa
     (/getafe/espera/, que escribe herramientas/compartir.mjs). En el móvil
     abre el menú de compartir del sistema; si no, lo copia. */
  const ENLACE = '<span class="compartir__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.8 5.8"/>' +
    '<path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/></svg></span>';
  function enlace(op) {
    const b = el('button', 'compartir', ENLACE + '<span>Compartir esta sección</span>');
    b.type = 'button';
    const rotulo = b.lastChild;
    function avisar(t) {
      rotulo.textContent = t;
      setTimeout(function () { rotulo.textContent = 'Compartir esta sección'; }, 1800);
    }
    b.addEventListener('click', function () {
      const url = new URL(op.url(), location.href).href;
      const tactil = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      if (tactil && navigator.share) {
        navigator.share({ title: op.titulo(), url: url }).catch(function () { /* cancelado */ });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { avisar('Enlace copiado'); },
          function () { window.prompt('Copia el enlace:', url); });
      } else {
        window.prompt('Copia el enlace:', url);
      }
    });
    return b;
  }

  window.CARTEL = {
    boton: boton, enlace: enlace, abrir: abrir, cifra: cifraElegida, frente: frente, puesto: puesto,
    montar: montarDatos,
    piezas: { hoja: hoja, base: base, titular: titular, cajas: cajas, banda: banda, tira: tira, ajustar: ajustar }
  };
})();

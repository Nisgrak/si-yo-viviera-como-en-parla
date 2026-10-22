/* ═══════════════════════════════════════════════════════════════════════
   EL SELECTOR DE CIUDAD
   El desplegable del titular, dibujado por la web en vez del del navegador,
   que en cada móvil se abría distinto y a veces no se abría al tocar la
   flecha. El <select id="sel-municipio"> se queda en la página, oculto, como
   el estado: cada página lo rellena, lee su valor y escucha su «change», así
   que este script no sabe nada de ellas. Solo pone delante un botón (todo el
   nombre y la flecha) y una lista que, al elegir, cambia el select y avisa.

   Teclado: Intro, espacio o flecha abajo abren; flechas, Inicio y Fin se
   mueven; una letra salta a la ciudad que empieza por ella; Intro elige;
   Escape o Tab cierran. Una página puede poner al lado de cada ciudad una
   cifra con window.SELECTOR_DATO = function (id) { return '21'; }.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function montar() {
    const sel = document.getElementById('sel-municipio');
    const caja = sel && sel.closest('.selector');
    const linea = caja && caja.closest('.t3, .t1');
    if (!sel || !caja || !linea || linea.querySelector('.selector__boton')) return;

    /* El select deja de recibir clics y foco: es solo el estado. */
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    caja.classList.add('selector--propio');

    const boton = el('button', 'selector__boton');
    boton.type = 'button';
    boton.setAttribute('aria-haspopup', 'listbox');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-controls', 'ciudades');
    linea.appendChild(boton);

    const lista = el('ul', 'ciudades');
    lista.id = 'ciudades';
    lista.setAttribute('role', 'listbox');
    lista.setAttribute('aria-label', 'Elige con qué ciudad comparar');
    lista.tabIndex = -1;
    lista.hidden = true;
    linea.appendChild(lista);

    function rotular() {
      const o = sel.options[sel.selectedIndex];
      boton.setAttribute('aria-label', 'Ciudad con la que se compara: ' + (o ? o.textContent : '') + '. Cambiar');
    }
    rotular();
    sel.addEventListener('change', rotular);

    let activa = -1;
    function opciones() { return Array.prototype.slice.call(lista.children); }
    function marcar(i) {
      const os = opciones();
      if (!os.length) return;
      activa = (i + os.length) % os.length;
      os.forEach(function (o, k) { o.classList.toggle('ciudad--activa', k === activa); });
      lista.setAttribute('aria-activedescendant', os[activa].id);
      os[activa].scrollIntoView({ block: 'nearest' });
    }

    function pintar() {
      while (lista.firstChild) lista.removeChild(lista.firstChild);
      Array.prototype.forEach.call(sel.options, function (o, i) {
        const li = el('li', 'ciudad');
        li.id = 'ciudad-' + o.value;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', o.selected ? 'true' : 'false');
        li.dataset.valor = o.value;
        li.appendChild(el('span', 'ciudad__n', o.textContent));
        const dato = typeof window.SELECTOR_DATO === 'function' ? window.SELECTOR_DATO(o.value) : null;
        if (dato != null && dato !== '') li.appendChild(el('span', 'ciudad__d', dato));
        li.addEventListener('mousemove', function () { if (activa !== i) marcar(i); });
        li.addEventListener('click', function () { elegir(o.value); });
        lista.appendChild(li);
      });
    }

    function abrir() {
      pintar();
      lista.hidden = false;
      boton.setAttribute('aria-expanded', 'true');
      linea.classList.add('t3--abierto');
      marcar(sel.selectedIndex);
      lista.focus({ preventScroll: true });
      document.addEventListener('pointerdown', fuera, true);
    }
    function cerrar(devolverFoco) {
      if (lista.hidden) return;
      lista.hidden = true;
      boton.setAttribute('aria-expanded', 'false');
      linea.classList.remove('t3--abierto');
      document.removeEventListener('pointerdown', fuera, true);
      if (devolverFoco) boton.focus({ preventScroll: true });
    }
    function fuera(e) {
      if (!lista.contains(e.target) && e.target !== boton) cerrar(false);
    }
    function elegir(valor) {
      cerrar(true);
      if (valor === sel.value) return;
      sel.value = valor;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    boton.addEventListener('click', function () { if (lista.hidden) abrir(); else cerrar(true); });
    boton.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(); }
    });
    lista.addEventListener('keydown', function (e) {
      const os = opciones();
      if (e.key === 'ArrowDown') { e.preventDefault(); marcar(activa + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(activa - 1); }
      else if (e.key === 'Home') { e.preventDefault(); marcar(0); }
      else if (e.key === 'End') { e.preventDefault(); marcar(os.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (os[activa]) elegir(os[activa].dataset.valor); }
      else if (e.key === 'Escape') { e.preventDefault(); cerrar(true); }
      else if (e.key === 'Tab') { cerrar(false); }
      else if (e.key.length === 1) {
        /* Una letra salta a la siguiente ciudad que empieza por ella. */
        const l = e.key.toLowerCase();
        for (let k = 1; k <= os.length; k++) {
          const j = (activa + k) % os.length;
          if (os[j].textContent.trim().toLowerCase().normalize('NFD').charAt(0) === l) { marcar(j); break; }
        }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();

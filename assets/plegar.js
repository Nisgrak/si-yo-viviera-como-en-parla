/* ═══════════════════════════════════════════════════════════════════════
   Ver más · las cautelas, fuentes y notas de letra pequeña que pasan de
   LARGO letras se pliegan a tres líneas con un botón «Ver más». Vale para
   todas las páginas: busca por clase (cautela, *__pie, *__nota, *-pie,
   *-nota, *fuente*) y solo pliega lo que se ve en letra pequeña, así que
   las notas de texto normal, donde va el dato, no se tocan. Muchas se
   pintan o se reescriben con JavaScript al cambiar de ciudad: se vuelve a
   mirar cada vez que cambia la página.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const LARGO = 360;
  const PEQUENA = 15;     /* px: por encima es texto normal */
  const SEL = 'main .cautela, main [class*="__pie"], main [class*="__nota"], main [class*="-pie"], ' +
    'main [class*="-nota"], main [class*="fuente"]';

  function plegar() {
    document.querySelectorAll(SEL).forEach(function (n) {
      if (n.dataset.plegable === 'no' || n.classList.contains('ver-mas')) return;
      if (n.tagName !== 'P' && n.tagName !== 'DIV') return;
      if (n.querySelector('p, div, ul, ol, table, svg, canvas')) return;   /* contenedores, no párrafos */
      if (n.textContent.length < LARGO) return;
      if (parseFloat(getComputedStyle(n).fontSize) >= PEQUENA) { n.dataset.plegable = 'no'; return; }
      const sig = n.nextElementSibling;
      if (sig && sig.classList.contains('ver-mas')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ver-mas';
      b.textContent = 'Ver más';
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function () {
        const abre = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(abre));
        b.textContent = abre ? 'Ver menos' : 'Ver más';
        n.classList.toggle('plegado', !abre);
      });
      n.classList.add('plegado');
      n.after(b);
    });
  }

  let espera = null;
  function pronto() {
    if (espera) return;
    espera = setTimeout(function () { espera = null; plegar(); }, 120);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pronto);
  else pronto();
  window.addEventListener('load', pronto);
  if ('MutationObserver' in window) {
    new MutationObserver(pronto).observe(document.body, { childList: true, subtree: true });
  }
})();

/* (a) Toda pieza con cifra tiene sus dos botones: «Cartel para compartir» y «Compartir esta sección».
   Las piezas no salen de una lista: se derivan de la propia página (secciones [data-indice], apartados
   [data-indice-sub], huecos *-botones, fichas del recuento y cada botón de cartel). Lo único que se
   enumera a mano son las excepciones, con su motivo (excepciones.mjs). Una sección nueva sin botones y
   sin excepción hace fallar la prueba. */
import { CARTEL_SIN_ENLACE, SIN_BOTONES } from './excepciones.mjs';
import { plano } from './comun.mjs';

const ES_CARTEL = (b) => /^Cartel/.test(plano(b.textContent));
const ES_ENLACE = (b) => /^Compartir esta/.test(plano(b.textContent));

export function auditarBotones({ doc, pagina, ciudad, informe, sinCambio, usadas }) {
  const botones = [...doc.querySelectorAll('button.compartir')];
  const cartel = botones.filter(ES_CARTEL), enlace = botones.filter(ES_ENLACE);

  /* Las secciones y apartados */
  doc.querySelectorAll('[data-indice], [data-indice-sub]').forEach((s) => {
    if (!s.id || s.closest('[hidden]')) return;      /* una sección oculta (la cartera sin unidades) no se ve */
    informe.caso('a');
    const tiene = [...s.querySelectorAll('button.compartir')];
    const completa = tiene.some(ES_CARTEL) && tiene.some(ES_ENLACE);
    const clave = pagina + '#' + s.id;
    const excepcion = SIN_BOTONES[clave];
    if (excepcion) { if (!completa) usadas.add(clave); return; }
    if (!completa) {
      const titulo = plano((s.querySelector('h2, h3, h4') || s).textContent).slice(0, 50);
      informe.fallo('a', { pagina, ciudad, pieza: s.id }, `la sección «${titulo}» no tiene los dos botones (cartel: ${tiene.filter(ES_CARTEL).length}, enlace: ${tiene.filter(ES_ENLACE).length}). Ponlos, o añádela a SIN_BOTONES en herramientas/comprobar/excepciones.mjs con su motivo`);
    }
  });

  /* Los huecos *-botones: dos botones, en ese orden. Inversión y gasto no los llevan cuando Parla se quedaría igual. */
  doc.querySelectorAll('[id$="-botones"]').forEach((h) => {
    if (h.closest('[hidden]')) return;
    informe.caso('a');
    const clave = h.id.replace(/-botones$/, '');
    const hijos = [...h.querySelectorAll('button.compartir')].map((b) => plano(b.textContent));
    if (!hijos.length && sinCambio(clave)) return;
    if (hijos.length !== 2 || !/^Cartel/.test(hijos[0]) || !/^Compartir esta/.test(hijos[1])) {
      informe.fallo('a', { pagina, ciudad, pieza: clave }, `el hueco #${h.id} no tiene «Cartel para compartir» y «Compartir esta sección» (tiene: ${hijos.join(' | ') || 'nada'})`);
    }
  });

  /* Cada cartel con su enlace al lado (y al revés), salvo los de la lista. */
  cartel.forEach((b) => {
    informe.caso('a');
    const cont = b.closest('[id]');
    const id = cont ? cont.id : '';
    if (CARTEL_SIN_ENLACE[id]) return;
    if (![...b.parentElement.children].some(ES_ENLACE)) {
      informe.fallo('a', { pagina, ciudad, pieza: id || '(sin id)' }, 'hay un «Cartel para compartir» sin su «Compartir esta sección» al lado');
    }
  });
  enlace.forEach((b) => {
    if (/vista/.test(plano(b.textContent))) return;     /* «Compartir esta vista»: consulta.html */
    informe.caso('a');
    const cont = b.closest('[id]');
    if (![...b.parentElement.children].some(ES_CARTEL)) {
      informe.fallo('a', { pagina, ciudad, pieza: (cont && cont.id) || '(sin id)' }, 'hay un «Compartir esta sección» sin su «Cartel para compartir» al lado');
    }
  });

  /* Las fichas del recuento */
  doc.querySelectorAll('#recuento .rec > .ind').forEach((f) => {
    informe.caso('a');
    const b = [...f.querySelectorAll(':scope > .ind__acciones > .compartir')].map((x) => plano(x.textContent));
    if (b.length !== 2 || !/^Cartel/.test(b[0]) || b[1] !== 'Compartir esta sección') {
      informe.fallo('a', { pagina, ciudad, pieza: f.id }, 'la ficha no tiene sus dos botones');
    }
  });
}

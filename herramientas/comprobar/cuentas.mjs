/* (e) Las cuentas del recuento de la portada: cada subtotal de área es la suma de sus líneas visibles;
   en cada ficha, «tendría − tiene = falta» cuadra con las cifras tal como se ven; el total de portada es
   el entero de la suma, y es el mismo en la frase, en el índice, en el cartel y en la vista previa. */
import { aparece, numero, plano } from './comun.mjs';

const decimales = (t) => { const m = /,(\d+)/.exec(String(t)); return m ? m[1].length : 0; };

export function auditarCuentas({ doc, win, ciudad, previas, informe }) {
  const donde = (pieza) => ({ pagina: 'index.html', ciudad, pieza });
  let sumaAreas = 0, lineas = 0;
  doc.querySelectorAll('#recuento .area').forEach((a) => {
    const n = a.querySelector('.area__n');
    if (!n) return;
    informe.caso('e');
    /* las líneas que suman: las que cuentan en el total (no las camas, plazas ni unidades de hospital) */
    const cuenta = (id) => id !== 'ind-hospital' && (win.DATOS.indicadores.find((i) => 'ind-' + i.id === id) || {}).enTotal !== false;
    const visibles = [...a.querySelectorAll('.rec--abre')].filter((li) => cuenta(li.querySelector('button.rec__a').getAttribute('aria-controls'))).map((li) => numero(li.querySelector('.rec__n').textContent));
    const suma = visibles.reduce((t, v) => t + Math.abs(v), 0);
    const mostrado = Math.abs(numero(n.textContent.replace('~', '')));
    if (Math.abs(suma - mostrado) > 0.0501) {
      informe.fallo('e', donde(a.id), `el subtotal «${plano(n.textContent)}» no es la suma de sus líneas visibles (${visibles.map((v) => String(v).replace('.', ',')).join(' + ')} = ${suma.toFixed(1).replace('.', ',')})`);
    }
    if (!a.classList.contains('area--sobra')) { sumaAreas += mostrado; lineas += visibles.length; }
  });

  doc.querySelectorAll('#recuento .rec').forEach((li) => {
    const f = li.querySelector('.ind');
    const pie = f && f.querySelector('.tasas__pie');
    const falta = li.querySelector('.rec__n');
    if (!pie || !falta) return;
    const U = '(?: (?:km²|ha|m²))?';
    const m = new RegExp('tendría ([−-]?\\d(?:[\\d.]*\\d)?(?:,\\d+)?)' + U + '\\. Tiene ([−-]?\\d(?:[\\d.]*\\d)?(?:,\\d+)?)' + U).exec(plano(pie.textContent));
    if (!m) return;
    informe.caso('e');
    /* La falta mostrada es la diferencia de las dos cifras mostradas, en la misma unidad (km², ha o m²): sin una unidad de margen. */
    const unidad = (t) => (/\d (km²|ha|m²)/.exec(plano(t)) || [])[1] || '';
    const dec = Math.max(decimales(m[1]), decimales(m[2]), decimales(falta.textContent));
    const e = 10 ** dec;
    const diff = Math.round(Math.abs(numero(m[1]) - numero(m[2])) * e);
    const mostrada = Math.round(Math.abs(numero(falta.textContent)) * e);
    if (unidad(pie.textContent) !== unidad(falta.textContent)) {
      informe.fallo('e', donde(f.id), `la cuenta «tendría − tiene» y la línea van en unidades distintas: «${plano(pie.textContent)}» y «${plano(falta.textContent)}»`);
    } else if (diff !== mostrada) {
      informe.fallo('e', donde(f.id), `«tendría ${m[1]} − tiene ${m[2]}» da ${(diff / e).toFixed(dec).replace('.', ',')} y la línea dice ${plano(falta.textContent)}`);
    }
  });

  /* El total de portada */
  const tot = doc.querySelector('#resumen-total b');
  if (tot) {
    informe.caso('e');
    const T = numero(tot.textContent);
    const cuenta = win.CALCULO.faltan(win.DATOS, ciudad);
    if (T !== Math.round(cuenta.TOTAL)) informe.fallo('e', donde('resumen-total'), `el total de portada dice ${T} y la suma redondeada es ${Math.round(cuenta.TOTAL)} (${cuenta.TOTAL})`);
    if (Math.abs(sumaAreas - T) > 0.5 + 0.05 * lineas) informe.fallo('e', donde('resumen-total'), `el total de portada (${T}) no es el entero de la suma de las áreas (${sumaAreas.toFixed(1).replace('.', ',')})`);
    const dato = doc.querySelector('#resumen').getAttribute('data-indice-dato');
    if (Number(dato) !== T) informe.fallo('e', donde('resumen-total'), `el índice dice ${dato} y la frase, ${T}`);
    const og = previas.og(ciudad, '');
    if (og && !aparece(og.title || '', String(T))) informe.fallo('e', donde('resumen-total'), `el título de la vista previa de la ciudad no lleva el total (${T}): «${og.title}»`);
  }
}

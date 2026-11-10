/* Lo que comparten las comprobaciones (herramientas/comprobar.mjs y herramientas/revisar.mjs):
   el informe (qué se miró, qué falló y dónde) y unas funciones de cifras y texto. */

/* Cada comprobación tiene una letra (a, b, c…, la de la lista del README). Un fallo dice
   siempre página, ciudad y pieza. Un aviso es lo que ha destapado la prueba y necesita decisión
   del dueño: se cuenta y se enseña, pero no hace fallar. */
export function crearInforme() {
  const casos = {}, fallos = [], avisos = [];
  const donde = (d) => [d.pagina, d.ciudad && '#' + d.ciudad, d.pieza && '«' + d.pieza + '»'].filter(Boolean).join(' ');
  return {
    casos, fallos, avisos,
    caso(b, n = 1) { casos[b] = (casos[b] || 0) + n; },
    fallo(b, d, msg) { fallos.push({ b, texto: `[${b}] ${donde(d)}: ${msg}` }); },
    aviso(b, d, msg) { avisos.push({ b, texto: `[${b}] ${donde(d)}: ${msg}` }); }
  };
}

/* «1.257», «12,35 %», «−586», «×1,47», «2,24 km²»: el número que dice un texto, o null. */
export function numero(t) {
  const m = /[−\-]?\s?\d[\d.]*(?:,\d+)?/.exec(String(t).replace(/ | /g, ' '));
  if (!m) return null;
  let s = m[0].replace(/\s/g, '').replace('−', '-');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}
/* La cifra sin unidad ni espacios, para comparar la del cartel con la de la imagen y la de la pantalla. */
export const sinUnidad = (t) => String(t).replace(/ | /g, ' ').replace(/[\s]*(%|€|km²|min|días|años)\s*$/, '').replace(/^×/, '').replace(/−/g, '-').trim();
/* ¿Aparece la cifra en el texto como número entero, no dentro de otro? */
export function aparece(texto, cifra) {
  const c = sinUnidad(cifra).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('-', '[−-]?');
  return new RegExp('(?<![\\d.,])' + c + '(?![\\d]|,\\d|\\.\\d)').test(String(texto).replace(/ | /g, ' '));
}
export const plano = (t) => String(t).replace(/\s+/g, ' ').replace(/ | /g, ' ').trim();
/* Una entidad numérica de las que escribe compartir.mjs (&#34;) vuelve a ser su carácter. */
export const sinEntidades = (t) => String(t).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n)).replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
/* El texto visible de un trozo de HTML (una imagen de vista previa). */
export const textoDeHtml = (h) => plano(sinEntidades(String(h).replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ')));

/* Lo que no puede salir nunca en una pieza ni en un cartel ni en una vista previa. */
export function textoRoto(t) {
  const m = /\b(undefined|NaN|null|Infinity)\b/.exec(t);
  return m ? m[1] : null;
}

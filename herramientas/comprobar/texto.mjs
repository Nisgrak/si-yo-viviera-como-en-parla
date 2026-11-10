/* (f) Texto público: sin antítesis («no es X: es Y», «no X, sino Y», «no se trata de»), sin nombres de
   fichero ni extensiones a la vista, y sin «jubilación» en la pieza de las pensiones. Los patrones son
   conservadores: mejor dejar pasar una frase dudosa que dar un falso fallo cada día. */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ANTITESIS_VALIDAS } from './excepciones.mjs';
import { plano } from './comun.mjs';

const PATRONES = [
  /\bno (?:es|son|era|eran|fue|fueron|está|están|hay|existe|ocurre|pasa)\b[^.!?;:\n]{0,70}[:;]\s*(?:es|son|era|eran|fue|fueron|está|están|hay|sino|se trata|lo que)\b/i,
  /\bno\b[^.!?:;\n]{1,70},\s*sino\b/i,
  /\bno se trata (?:de|del)\b/i,
  /\bno\s+(?:es|son)\s+(?:solo|sólo|tanto)?[^.!?:;\n]{1,50}\bsino\b/i
];

export function antitesis(texto) {
  const t = plano(texto);
  const hallazgos = [];
  for (const p of PATRONES) {
    const m = p.exec(t);
    if (m && !ANTITESIS_VALIDAS.some(([frase]) => m[0].includes(frase) || t.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).includes(frase))) {
      hallazgos.push(m[0].length > 90 ? m[0].slice(0, 90) + '…' : m[0]);
    }
  }
  return hallazgos;
}

/* Un nombre de fichero o una extensión de fichero en texto que lee el vecino. */
const FICHERO = /(?:^|[\s«"(])[\w-]*\.(?:csv|xlsx?|json|js|mjs|py)(?=[\s.,;:)»"]|$)/i;
export function ficheroVisible(texto) {
  const m = FICHERO.exec(plano(texto));
  return m ? m[0].trim() : null;
}

/* El texto que se ve en una página: todo el texto salvo scripts, estilos y el cartel oculto. */
export function textoVisible(doc) {
  const partes = [];
  const w = doc.createTreeWalker(doc.body, 4 /* SHOW_TEXT */);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentElement;
    if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName) || p.closest('#cartel')) continue;
    const t = n.textContent.trim();
    if (t) partes.push(t);
  }
  return partes.join(' ');
}

/* ── Las cadenas de assets/*.js y datos/*.js, sin comentarios ─────────── */

/* Recorre un fuente de JavaScript y devuelve sus cadenas literales (no los comentarios). Entiende
   '…', "…", `…` (con ${…} sin anidar) y las expresiones regulares, para no tomar una comilla suya
   por el principio de una cadena. */
export function cadenasDe(fuente) {
  const salida = [];
  const n = fuente.length;
  let i = 0, previo = '';
  while (i < n) {
    const c = fuente[i], d = fuente[i + 1];
    if (c === '/' && d === '/') { while (i < n && fuente[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const f = fuente.indexOf('*/', i + 2); i = f < 0 ? n : f + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1, s = '';
      while (j < n && fuente[j] !== c) {
        if (fuente[j] === '\\') { s += fuente[j + 1] === 'n' ? ' ' : fuente[j + 1]; j += 2; continue; }
        if (c === '`' && fuente[j] === '$' && fuente[j + 1] === '{') {
          let prof = 1; j += 2;
          while (j < n && prof) { if (fuente[j] === '{') prof++; else if (fuente[j] === '}') prof--; j++; }
          s += ' ';
          continue;
        }
        if (c !== '`' && fuente[j] === '\n') break;
        s += fuente[j++];
      }
      salida.push(s);
      i = j + 1; previo = c;
      continue;
    }
    if (c === '/' && /[(,=:[!&|?{};]|^$/.test(previo)) {
      /* una expresión regular */
      let j = i + 1, clase = false;
      while (j < n && (fuente[j] !== '/' || clase) && fuente[j] !== '\n') {
        if (fuente[j] === '\\') j++;
        else if (fuente[j] === '[') clase = true;
        else if (fuente[j] === ']') clase = false;
        j++;
      }
      i = j + 1; previo = ')';
      continue;
    }
    if (!/\s/.test(c)) previo = c;
    i++;
  }
  return salida;
}

export async function antitesisEnFuentes(raiz, informe) {
  const hallazgos = [];
  for (const carpeta of ['assets', 'datos']) {
    const ficheros = (await readdir(join(raiz, carpeta))).filter((f) => f.endsWith('.js')).sort();
    for (const f of ficheros) {
      const cs = cadenasDe(await readFile(join(raiz, carpeta, f), 'utf8'));
      informe.caso('f', cs.length ? 1 : 0);
      for (const s of cs) {
        if (s.length < 12) continue;
        for (const h of antitesis(s)) hallazgos.push({ fichero: carpeta + '/' + f, frase: h });
      }
    }
  }
  return hallazgos;
}

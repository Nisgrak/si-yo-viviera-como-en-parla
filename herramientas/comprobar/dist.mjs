/* (h) Tras el build: cada página de vista previa de dist/ tiene og:title, og:description y og:image, la
   imagen existe y no está vacía; ninguna clave de CIFRAS se queda sin ruta. Se usa de dos maneras:
   `node herramientas/comprobar/dist.mjs` (último paso de `npm run build`, sobre dist/ con las .png de
   verdad) y desde comprobar.mjs, en seco, sobre las páginas y las «imágenes» de la prueba. */
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { paginasDePrevia } from './previa.mjs';
import { crearInforme } from './comun.mjs';

export function revisarRutas({ dir, ext, ciudades, idsConsulta, rutas, informe }) {
  const paginas = paginasDePrevia(dir, ciudades, idsConsulta, ext);
  for (const p of paginas) {
    const donde = { pagina: p.ciudad ? `${p.ciudad}/${p.clave}/` : p.clave + '/', ciudad: p.ciudad, pieza: p.clave };
    informe.caso('h');
    for (const k of ['title', 'description', 'image']) {
      if (!p.og[k] || !p.og[k].trim()) informe.fallo('h', donde, `falta og:${k}`);
    }
    if (p.og.image && !p.hayImagen) informe.fallo('h', donde, `la imagen ${p.imagen} no existe o está vacía`);
  }
  for (const c of ciudades) {
    for (const p of ['', 'infraestructura', 'vivienda', 'economia', 'sanidad', 'educacion', 'inclusion']) {
      const f = join(dir, c, p, 'index.html');
      informe.caso('h');
      if (!existsSync(f)) informe.fallo('h', { pagina: `${c}/${p}`, ciudad: c }, 'no existe la página de la ciudad');
    }
  }
  if (rutas) {
    for (const k of rutas.cifras) {
      informe.caso('h');
      if (!rutas.usadas.includes(k)) informe.fallo('h', { pagina: 'compartir.mjs', pieza: k }, 'la clave de CIFRAS no tiene ruta ni vista previa');
    }
  }
  return paginas.length;
}

/* Como programa: lo último de `npm run build`. */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
  const require = createRequire(import.meta.url);
  globalThis.window = globalThis;
  for (const f of ['datos', 'economia', 'vivienda', 'transporte', 'sanidad', 'impuestos', 'primaria', 'infantil', 'discapacidad', 'contexto', 'infraestructura']) require(join(RAIZ, 'datos', f + '.js'));
  require(join(RAIZ, 'assets/consulta-catalogo.js'));
  const D = globalThis.DATOS;
  const informe = crearInforme();
  const dir = join(RAIZ, 'dist');
  if (!existsSync(dir)) { console.error('No hay dist/: corre antes `npm run build`.'); process.exit(1); }
  const ciudades = D.MUNICIPIOS.filter((m) => m.id !== D.REFERENCIA).map((m) => m.id);
  const n = revisarRutas({ dir, ext: '.png', ciudades, idsConsulta: globalThis.CONSULTA.CAT.map((d) => d.id), rutas: null, informe });
  /* La clave de CIFRAS sin ruta solo se sabe corriendo compartir.mjs: la prueba en seco lo mira. */
  if (informe.fallos.length) {
    console.error(`dist/: ${informe.fallos.length} fallos:\n  ` + informe.fallos.map((f) => f.texto).join('\n  '));
    process.exit(1);
  }
  console.log(`dist/ bien: ${n} páginas de vista previa con sus etiquetas og y su imagen.`);
}

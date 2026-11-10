/* Las vistas previas, sin pintarlas. Corre herramientas/compartir.mjs en seco (COMPARTIR_SECO): hace
   todo lo que hace el build salvo pintar las imágenes, que quedan como el HTML con que se pintarían.
   Así la prueba lee las mismas cifras y las mismas descripciones que se publican, en unos segundos,
   y a ellas se añaden las comprobaciones de las rutas y de cada imagen. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sinEntidades, textoDeHtml } from './comun.mjs';

export function cargarPrevias(raiz) {
  const dir = mkdtempSync(join(tmpdir(), 'parla-previas-'));
  const json = (n) => join(dir, n + '.json');
  const r = spawnSync(process.execPath, [join(raiz, 'herramientas/compartir.mjs')], {
    cwd: raiz, encoding: 'utf8',
    env: { ...process.env, COMPARTIR_SECO: join(dir, 'seco'), PIEZAS_JSON: json('piezas'), FICHAS_JSON: json('fichas'),
      CONSULTA_JSON: json('consulta'), RUTAS_JSON: json('rutas') }
  });
  if (r.status !== 0) throw new Error('compartir.mjs en seco ha fallado:\n' + (r.stderr || r.stdout));
  const leer = (n) => JSON.parse(readFileSync(json(n), 'utf8'));
  return {
    dir: join(dir, 'seco'), raiz: dir,
    piezas: leer('piezas'), fichas: leer('fichas'), consulta: leer('consulta'), rutas: leer('rutas'),
    limpiar() { rmSync(dir, { recursive: true, force: true }); }
  };
}

/* Las etiquetas og de una página de vista previa. */
export function og(html) {
  const m = {};
  for (const x of html.matchAll(/<meta property="og:([a-z:]+)" content="([^"]*)"/g)) m[x[1]] = sinEntidades(x[2]);
  return m;
}

/* Todas las páginas de vista previa de `dir` (en seco o en dist/): <ciudad>/<clave>/index.html y
   consulta/<dato>/index.html, con sus etiquetas og. `ext` es la extensión de la imagen en esa carpeta
   (.png en dist/, .html en seco). */
export function paginasDePrevia(dir, ciudades, datosConsulta, ext) {
  const salida = [];
  for (const c of ciudades) {
    const base = join(dir, c);
    if (!existsSync(base)) continue;
    const portada = join(base, 'index.html');
    if (existsSync(portada)) salida.push({ ciudad: c, clave: '', ruta: portada, og: og(readFileSync(portada, 'utf8')) });
    for (const clave of readdirSync(base)) {
      if (clave === 'index.html') continue;
      const f = join(base, clave, 'index.html');
      if (!existsSync(f)) continue;
      salida.push({ ciudad: c, clave, ruta: f, og: og(readFileSync(f, 'utf8')) });
    }
  }
  for (const id of datosConsulta) {
    const f = join(dir, 'consulta', id, 'index.html');
    if (existsSync(f)) salida.push({ ciudad: null, clave: 'consulta/' + id, ruta: f, og: og(readFileSync(f, 'utf8')) });
  }
  return salida.map((p) => {
    const nombre = (p.og.image || '').replace(/^.*\/assets\/compartir\//, '');
    const img = join(dir, 'assets/compartir', ext === '.html' ? nombre.replace(/\.png$/, '.html') : nombre);
    return { ...p, imagen: nombre, rutaImagen: img, hayImagen: !!nombre && existsSync(img) && statSync(img).size > 0 };
  });
}

/* El texto de la imagen de una página de vista previa (solo en seco). */
export const textoDeImagen = (p) => (p.hayImagen ? textoDeHtml(readFileSync(p.rutaImagen, 'utf8')) : '');

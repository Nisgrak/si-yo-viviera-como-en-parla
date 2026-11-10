/* ═══════════════════════════════════════════════════════════════════════
   EL HOSPITAL DE CADA CIUDAD · la cuenta
   El hospital público que le toca a cada ciudad (datos/sanidad.js, el de su
   memoria de 2024) con sus camas instaladas (el indicador «camas» de
   datos/datos.js) contra toda la población que tiene asignada. Pinto y
   Pozuelo no tienen hospital y se les cuenta el que les toca; del Infanta
   Sofía, el de Alcobendas, el catálogo no da camas.

   Sin nada de pantalla: lo usan la portada (app.js), sanidad.html
   (servicios.js) y el build (herramientas/compartir.mjs), para que las tres
   den la misma cifra.
   ═══════════════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';

  /* Todos los hospitales, por id: nombre, camas, población asignada, camas
     por cada 1.000 personas, las ciudades a las que les toca y la ciudad en
     cuyo término está (la que tiene sus camas y su cartera en datos.js). */
  function todos(D, S) {
    const camas = D.indicadores.find(function (i) { return i.id === 'camas'; });
    const H = {};
    D.MUNICIPIOS.forEach(function (m) {
      const s = S.ciudades[m.id];
      if (!s) return;
      const h = H[s.hid] || (H[s.hid] = { hid: s.hid, nombre: s.hospital, corto: s.corto, pob: s.pob,
        ciudades: [], camas: null, duena: null, por1000: null });
      h.ciudades.push(m.id);
      (camas.datos[m.id].lista || []).forEach(function (x) {
        const t = x.match(/^(.*?)\s*·\s*([\d.]+) camas$/);
        if (t && t[1].trim() === s.hospital) { h.camas = +t[2].replace(/\./g, ''); h.duena = m.id; }
      });
    });
    Object.keys(H).forEach(function (k) {
      const h = H[k];
      if (h.camas != null && h.pob) h.por1000 = h.camas / h.pob * 1000;
    });
    return H;
  }

  /* Cuántos hospitales públicos hay entre todas: los que les tocan más los
     que una ciudad tiene además del suyo (en Móstoles, el Rey Juan Carlos). */
  function cuantos(D, S) {
    const H = todos(D, S);
    const nombres = Object.keys(H).map(function (k) { return H[k].nombre; });
    const camas = D.indicadores.find(function (i) { return i.id === 'camas'; });
    D.MUNICIPIOS.forEach(function (m) {
      (camas.datos[m.id].lista || []).forEach(function (x) {
        const n = x.split('·')[0].trim();
        if (nombres.indexOf(n) < 0) nombres.push(n);
      });
    });
    return nombres.length;
  }

  /* El hospital que le toca a una ciudad. */
  function de(D, S, id) {
    return todos(D, S)[S.ciudades[id].hid];
  }

  /* Los que tienen cifra, de más a menos camas por persona. */
  function clasificacion(D, S) {
    const H = todos(D, S);
    return Object.keys(H).map(function (k) { return H[k]; })
      .filter(function (h) { return h.por1000 != null; })
      .sort(function (x, y) { return y.por1000 - x.por1000; });
  }

  /* Las unidades que tiene el hospital que le toca a la ciudad y el de Parla
     no (y al revés), sin las que no se pueden comparar, de más a menos grave.
     Null si de ese hospital no hay cartera. */
  function cartera(D, S, id) {
    const h = de(D, S, id);
    const otro = h && h.duena && D.hospitales[h.duena];
    if (!otro || !otro.unidades) return null;
    const fuera = D.hospitales.noComparables;
    const vale = function (u) { return fuera.indexOf(u) < 0; };
    const orden = D.hospitales.gravedad || [];
    const puesto = function (u) { const i = orden.indexOf(u); return i < 0 ? orden.length : i; };
    /* La cabeza de la lista de gravedad: lo que atiende una urgencia vital o
       una cirugía compleja, hasta Angiología. */
    const CORTE = 'Angiología y Cirugía Vascular';
    const hasta = orden.indexOf(CORTE);
    if (hasta < 0 && typeof console !== 'undefined') {
      console.warn('hospitales.js: «' + CORTE + '» no está en el orden de gravedad; no se marca ninguna en rojo.');
    }
    const graves = orden.slice(0, hasta + 1);
    const faltan = otro.faltanEnReferencia.filter(vale).sort(function (x, y) {
      return (puesto(x) - puesto(y)) || x.localeCompare(y, 'es');
    });
    /* Cuántos hospitales suma esa cartera (en Móstoles, dos): los que tiene
       la ciudad en el indicador de camas. */
    const camas = D.indicadores.find(function (i) { return i.id === 'camas'; });
    const varios = Math.max(1, ((camas && camas.datos[h.duena].lista) || []).length);
    return {
      hospital: h, duena: h.duena, unidades: otro.unidades, varios: varios,
      parla: D.hospitales[D.REFERENCIA].unidades,
      faltan: faltan, soloParla: otro.faltanAqui.filter(vale),
      graves: faltan.filter(function (u) { return graves.indexOf(u) >= 0; }),
      esGrave: function (u) { return graves.indexOf(u) >= 0; }
    };
  }

  const HOSPITALES = { todos: todos, cuantos: cuantos, de: de, clasificacion: clasificacion, cartera: cartera };
  if (typeof module === 'object' && module.exports) module.exports = HOSPITALES;
  else raiz.HOSPITALES = HOSPITALES;
})(typeof window !== 'undefined' ? window : globalThis);

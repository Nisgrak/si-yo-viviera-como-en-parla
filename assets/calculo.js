/* ═══════════════════════════════════════════════════════════════════════
   SI YO VIVIERA COMO EN PARLA · la cuenta
   Todo lo que decide qué se pierde, qué se gana y cuánto suma la portada.
   Sin nada de pantalla: lo usan la web (app.js) y el build
   (herramientas/compartir.mjs), que escribe la cifra de cada ciudad en su
   vista previa. Una sola cuenta, así que no pueden decir cosas distintas.
   ═══════════════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';

  /* Por debajo de este umbral la diferencia es ruido, no una pérdida */
  const UMBRAL = 0.15;

  /* Casi todos los indicadores cuentan cosas; el verde mide superficie. */
  function esSuperficie(c) { return c.ind.medida === 'superficie'; }

  /* Por debajo del umbral es empate. En superficie, 0,15 m² no significa nada:
     el umbral es un 2 % de lo que hay. */
  function umbral(c) { return esSuperficie(c) ? c.n * 0.02 : UMBRAL; }

  function comparar(D, AQUI) {
    const REF = D.REFERENCIA;
    const calculados = D.indicadores.map(function (ind) {
      const a = ind.datos[AQUI];
      const b = ind.datos[REF];
      const base = D.BASES[ind.base || 'total'];
      const baseA = base.valores[AQUI];
      const baseB = base.valores[REF];
      const equivalente = (b.n / baseB) * baseA;
      const delta = a.n - equivalente;              /* > 0 se pierde */
      const total = D.BASES.total.valores;
      const deltaTotal = a.n - (b.n / total[REF]) * total[AQUI];
      /* La superficie se lee por habitante, no por cada 100.000. */
      const por = ind.medida === 'superficie' ? 1 : base.por;
      return {
        ind: ind, base: base, baseA: baseA, baseB: baseB,
        n: a.n, nRef: b.n, lista: a.lista,
        equivalente: equivalente, delta: delta, deltaTotal: deltaTotal,
        pct: a.n > 0 ? delta / a.n : 0,
        por: por,
        tasaA: (a.n / baseA) * por,
        tasaB: (b.n / baseB) * por
      };
    });

    /* Por la parte de lo que hay que se pierde: quedarse sin la única
       universidad pesa más que perder 3 institutos de 13. */
    const perdidas = calculados
      .filter(function (c) { return c.delta > umbral(c); })
      .sort(function (x, y) {
        const ax = x.ind.enTotal === false ? 1 : 0;
        const ay = y.ind.enTotal === false ? 1 : 0;
        return (ax - ay) || (y.pct - x.pct) || (y.delta - x.delta);
      });

    const ganancias = calculados.filter(function (c) { return c.delta < -umbral(c); })
      .sort(function (x, y) { return x.delta - y.delta; });
    const empates = calculados.filter(function (c) { return Math.abs(c.delta) <= umbral(c); });
    /* La cartera del hospital entra en las listas como una ficha más. */
    const k = cartera(D, AQUI);
    if (k.delta > 0) perdidas.push(k);
    else if (k.delta < 0) ganancias.push(k);
    /* Las ganancias, como las pérdidas: primero lo que suma y, detrás, lo que
       no, junto a lo de su misma área. */
    ganancias.sort(function (x, y) {
      const ax = x.ind.enTotal === false ? 1 : 0;
      const ay = y.ind.enTotal === false ? 1 : 0;
      return (ax - ay) || (ax ? x.ind.grupo.localeCompare(y.ind.grupo, 'es') : 0) ||
        (x.delta - y.delta);
    });

    const TOTAL = perdidas.filter(function (c) { return c.ind.enTotal !== false; })
      .reduce(function (s, c) { return s + c.delta; }, 0);
    /* Lo que se gana, en las mismas unidades que el total. No se le resta: la
       portada da lo que se pierde, y esto va al lado para que no se esconda. */
    const GANADO = -ganancias.reduce(function (t, c) {
      return t + (c.ind.enTotal === false ? 0 : c.delta);
    }, 0);
    return {
      calculados: calculados, perdidas: perdidas, ganancias: ganancias, empates: empates,
      TOTAL: TOTAL, GANADO: GANADO
    };
  }

  /* La cartera del hospital va como una ficha de Sanidad, pero no sale de la
     tasa por habitante: un hospital no se reparte. Se compara qué unidades
     asistenciales declara uno y no el otro. Tiene la forma de un cálculo para
     que la recorran las mismas listas, el recuento y el cartel. */
  const CARTERA = {
    id: 'hospital', medida: 'cartera', enTotal: false, gen: 'f',
    grupo: 'Sanidad', titulo: 'Servicios del hospital público',
    mide: 'unidades asistenciales', fuenteId: 'sanitarios',
    nota: 'Un hospital no se reparte por habitante, así que aquí se comparan las unidades ' +
      'asistenciales que el Registro de Centros Sanitarios de la Comunidad de Madrid declara en ' +
      'cada uno. Algunas diferencias menores pueden deberse a cómo declara cada centro su cartera. ' +
      'No se cuentan «Otras unidades asistenciales», que no dice qué servicio es, ni el laboratorio ' +
      'clínico y la vacunación, que el hospital de Parla declara con otros nombres.'
  };

  function cartera(D, AQUI) {
    const REF = D.REFERENCIA;
    const fuera = D.hospitales.noComparables;
    const vale = function (u) { return fuera.indexOf(u) < 0; };
    const h = D.hospitales[AQUI];
    /* De más a menos grave, que es lo que decide qué cabe en el cartel. */
    const orden = D.hospitales.gravedad || [];
    const puesto = function (u) { const i = orden.indexOf(u); return i < 0 ? orden.length : i; };
    const caen = h.faltanEnReferencia.filter(vale).sort(function (x, y) {
      return (puesto(x) - puesto(y)) || x.localeCompare(y, 'es');
    });
    const nuevas = h.faltanAqui.filter(vale);
    const delta = caen.length ? caen.length : -nuevas.length;
    /* Del total solo se quita lo que la ciudad declara: lo que Parla no tiene. */
    const n = h.unidades ? h.unidades - (h.faltanEnReferencia.length - caen.length) : 0;
    return {
      ind: CARTERA, n: n, nRef: D.hospitales[REF].unidades,
      lista: caen, nuevas: nuevas, delta: delta,
      pct: n > 0 ? delta / n : 0
    };
  }

  const CALCULO = { comparar: comparar, UMBRAL: UMBRAL, esSuperficie: esSuperficie, umbral: umbral };
  if (typeof module === 'object' && module.exports) module.exports = CALCULO;
  else raiz.CALCULO = CALCULO;
})(typeof window !== 'undefined' ? window : globalThis);

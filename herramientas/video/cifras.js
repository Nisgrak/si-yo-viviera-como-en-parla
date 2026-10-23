/* Las cifras y el guion del vídeo, sacados de los datos de la web. Nada va
   escrito a mano: si cambian los datos, cambian el vídeo y la voz.
   Lo usan video.html (en el navegador, con los datos ya cargados) y
   guion.cjs, que se lo pasa a voz.py.
   El vídeo se cuenta como una historia, en primera persona: una vecina de
   Parla y su día. Los tiempos no se fijan aquí: los marca la voz (voz.py
   coloca cada frase detrás de la anterior y los deja en salida/tiempos.js),
   y video.html saca a escena cada cosa cuando la voz la dice.
   La ciudad con la que se compara es OTRA. */
(function (raiz) {
  'use strict';

  const OTRA = 'getafe';

  /* ── Las cifras en letra, para que la voz no dependa de cómo lee números ── */
  const UNI = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
    'veintiocho', 'veintinueve'];
  const DEC = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const CEN = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos',
    'setecientos', 'ochocientos', 'novecientos'];
  function hasta999(n) {
    if (n === 100) return 'cien';
    const c = Math.floor(n / 100), r = n % 100;
    const d = r < 30 ? (r ? UNI[r] : '') : DEC[Math.floor(r / 10)] + (r % 10 ? ' y ' + UNI[r % 10] : '');
    return [CEN[c], d].filter(Boolean).join(' ');
  }
  /* genero: 'm' para «veintiún equipamientos», 'f' para «veintiuna camas». */
  function entero(n, genero) {
    if (n === 0) return 'cero';
    const mill = Math.floor(n / 1e6), miles = Math.floor(n / 1000) % 1000, resto = n % 1000;
    const p = [];
    if (mill) p.push(mill === 1 ? 'un millón' : apocope(hasta999(mill), 'm') + ' millones');
    if (miles) p.push(miles === 1 ? 'mil' : apocope(hasta999(miles), genero || 'm') + ' mil');
    if (resto) p.push(hasta999(resto));
    return apocope(p.join(' '), genero);
  }
  function apocope(s, genero) {
    if (genero === 'm') return s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
    if (genero === 'f') return s.replace(/veintiuno$/, 'veintiuna').replace(/uno$/, 'una').replace(/ientos/g, 'ientas');
    return s;
  }
  /* 4,27 con un decimal → «cuatro coma tres» */
  function letra(v, dec, genero) {
    const k = Math.pow(10, dec || 0), r = Math.round(Math.abs(v) * k) / k;
    const e = Math.floor(r), f = Math.round((r - e) * k);
    return entero(e, f ? null : genero) + (f ? ' coma ' + entero(f) : '');
  }
  /* «una cama», «dos coma dos camas» */
  function cuantas(v, dec, uno, varios, genero) {
    const t = letra(v, dec, genero);
    return t + ' ' + (t === 'una' || t === 'un' ? uno : varios);
  }
  /* 0,698 → «siete de cada diez» */
  function deCadaDiez(p) { return entero(Math.round(p * 10), 'f') + ' de cada diez'; }
  function mayus(s) { return s[0].toUpperCase() + s.slice(1); }
  /* 6,78 → «casi siete veces más»; 2,2 → «más del doble» */
  function vecesMas(r) {
    if (r < 2) return letra(r, 1, 'f') + ' veces más';
    if (r < 3) return 'más del doble';
    const n = Math.round(r);
    return (r < n ? 'casi ' : 'más de ') + entero(n, 'f') + ' veces más';
  }
  /* «A-42» → «A cuarenta y dos», que si no la voz lee el guion */
  function carretera(v) { return v.replace(/([AMR])-(\d+)/g, function (_, l, n) { return l + ' ' + entero(+n, 'f'); }); }

  /* Las cifras como en la pantalla: 32.206 · 4,3 */
  function num(v, dec) {
    return v.toLocaleString('es-ES', { useGrouping: 'always', minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }

  /* Segundos entre hueco y hueco en el recuento final: la voz los espera. */
  const PASO = 0.07;
  /* Lo que dura el cierre detrás de la última frase. */
  const COLA = 2.5;

  function calcular(W) {
    const D = W.DATOS, C = W.CALCULO, SA = W.SANIDAD, TP = W.TRANSPORTE, AC = W.ACCESOS;
    const P = D.REFERENCIA;
    const NOMBRE = {};
    D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
    const r = C.faltan(D, OTRA);
    const ind = function (id) { return r.falta.concat(r.sobra, r.empates).find(function (c) { return c.ind.id === id; }); };
    const dinero = function (id) { return D.contexto.dinero.find(function (s) { return s.id === id; }); };

    /* Por dónde sale la gente de 6 a 10: la salida más usada de cada una */
    const salida = function (id) {
      const c = AC.ciudades[id], p = c.puertas.slice().sort(function (a, b) { return b.v - a.v; })[0];
      return { via: p.via, parte: p.v / c.sale.h610, personas: c.sale.h610 };
    };

    const H = W.HOSPITALES, hp = H.de(D, SA, P), ho = H.de(D, SA, OTRA);
    const inv = dinero('inversion');
    const metro = ind('metro');

    return {
      OTRA: OTRA, otra: NOMBRE[OTRA], web: D.NOMBRE_WEB,
      total: Math.round(r.TOTAL), tiene: r.TIENE,
      sale: { parla: salida(P), otra: salida(OTRA), fecha: AC.fecha },
      atocha: { parla: TP.casa[P].tren.atocha[0], otra: TP.casa[OTRA].tren.atocha[0] },
      metro: { parla: metro.parla, otra: metro.otra, tendria: metro.tendria },
      camas: { parla: hp.por1000, otra: ho.por1000, nParla: hp.camas, nOtra: ho.camas, hospital: ho.corto, hParla: hp.corto },
      inversion: { parla: inv.valores[P], otra: inv.valores[OTRA], media: inv.mediaRegional, pie: inv.pie }
    };
  }

  /* La locución, frase a frase: [id, escena, pausa antes en segundos, texto].
     Habla una vecina de Parla, en primera persona. Las cifras, las de la
     pantalla; las pausas dejan que cada cifra se oiga antes de la siguiente. */
  function guion(F) {
    const O = F.otra;
    const hospital = F.camas.hParla.replace(/^el /, 'al ');
    const veces = F.camas.otra / F.camas.parla;
    return [
      ['vivo', 'portada', 0.5, 'Vivo en Parla.'],
      ['cuenta', 'portada', 0.7, 'Y un día me puse a hacer una cuenta.'],

      ['manana', 'coche', 1.4, 'Por la mañana, Parla se va a trabajar.'],
      ['a42', 'coche', 0.8, mayus(deCadaDiez(F.sale.parla.parte)) + ' que salen por carretera lo hacen por el mismo sitio: la ' +
        carretera(F.sale.parla.via) + '.'],
      ['repartida', 'coche', 1.2, 'En ' + O + ', la gente sale repartida por muchas carreteras.'],

      /* el quinto campo marca la palabra en la que tiene que salir algo en pantalla */
      ['atocha', 'tren', 1.4, 'En tren, desde la mitad de las casas, se tarda más de ' + entero(F.atocha.parla, 'm') +
        ' minutos hasta Atocha.', { marca: entero(F.atocha.parla, 'm') }],
      ['atocha-otra', 'tren', 0.9, 'Desde ' + O + ', ' + entero(F.atocha.otra, 'm') + '.'],
      ['metro', 'tren', 1.0, F.metro.parla === 0 ? 'De Metro, ni una estación.' : ''],

      ['malo', 'hospital', 1.4, 'Si alguien se pone malo, vamos ' + hospital + '.'],
      ['cama', 'hospital', 0.6, 'Tiene ' + cuantas(F.camas.parla, 1, 'cama', 'camas', 'f') + ' por cada mil personas que atiende.'],
      ['cama-otra', 'hospital', 0.9, 'El de ' + O + ', ' + (veces >= 2 ? 'más del doble' : letra(F.camas.otra, 1, 'f')) + '.'],

      ['invierte', 'dinero', 1.4, 'Luego miré las cuentas: nuestro ayuntamiento invierte ' + entero(F.inversion.parla, 'm') +
        ' euros por vecino al año.', { marca: entero(F.inversion.parla, 'm') }],
      /* «ciento» no lo dice bien la voz: la otra cifra va como cuántas veces más */
      ['invierte-otra', 'dinero', 0.9, 'El de ' + O + ', ' + vecesMas(F.inversion.otra / F.inversion.parla) + '.'],

      ['todo', 'total', 1.4, 'Al final lo conté todo: colegios, centros de salud, bibliotecas, estaciones…'],
      ['ajustado', 'total', 0.5, 'Cada cosa, a la medida de los que somos.'],
      /* de un tirón: los huecos van saliendo detrás y el último cae en la cifra */
      ['si', 'total', 0.8, 'Si Parla estuviera como ' + O + ', tendríamos ' + entero(F.total, 'm') +
        ' equipamientos y servicios públicos más.', { marca: entero(F.total, 'm') }],

      ['haz', 'cierre', 1.6, 'En la web puedes hacer la cuenta con tu ciudad.'],
      /* el final, más despacio y para abajo: lo que hay, no una orden */
      ['cola', 'cierre', 1.0, 'Y Parla sigue a la cola.', { vel: 0.88 }]
    ].filter(function (f) { return f[3]; });
  }

  const CIFRAS = { OTRA: OTRA, PASO: PASO, COLA: COLA, calcular: calcular, guion: guion, num: num, letra: letra,
    entero: entero, cuantas: cuantas };
  if (typeof module === 'object' && module.exports) module.exports = CIFRAS;
  else raiz.CIFRAS = CIFRAS;
})(typeof window !== 'undefined' ? window : globalThis);

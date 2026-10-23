/* Las cifras y el guion del vídeo, sacados de los datos de la web. Nada va
   escrito a mano: si cambian los datos, cambia el vídeo y cambia la voz.
   Lo usan video.html (en el navegador, con los datos ya cargados) y
   guion.cjs, que se lo pasa a voz.py y audio.py.
   La ciudad con la que se compara es OTRA. */
(function (raiz) {
  'use strict';

  const OTRA = 'getafe';

  /* Cuándo empieza cada escena, en segundos. Las cortinillas van centradas en
     el cambio de capítulo. */
  const S = {
    portada: 0, cuenta: 4, total: 13.5, cero: 20,
    camas: 27.5, unidades: 33, medico: 38, espera: 45.5,
    estacion: 53, atocha: 59.5,
    renta: 66, inversion: 73,
    diez: 82, golpe: 89.5, cierre: 94.5
  };
  const DUR = 100;
  const CAPITULOS = [
    ['cuenta', '01', 'La cuenta'], ['camas', '02', 'Sanidad'], ['estacion', '03', 'El tren'],
    ['renta', '04', 'El dinero'], ['diez', '05', 'Las diez ciudades'], ['golpe', '', '']
  ];

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
    const r = Math.round(Math.abs(v) * Math.pow(10, dec || 0)) / Math.pow(10, dec || 0);
    const e = Math.floor(r), f = Math.round((r - e) * Math.pow(10, dec || 0));
    return entero(e, f ? null : genero) + (f ? ' coma ' + entero(f) : '');
  }

  /* «una cama», «dos coma dos camas» */
  function cuantas(v, dec, uno, varios, genero) {
    const t = letra(v, dec, genero);
    return t + ' ' + (t === 'una' || t === 'un' ? uno : varios);
  }

  /* Las cifras como en la pantalla: 32.206 · 4,3 */
  function num(v, dec) {
    return v.toLocaleString('es-ES', { useGrouping: 'always', minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }

  function calcular(W) {
    const D = W.DATOS, C = W.CALCULO, SA = W.SANIDAD, PR = W.PRIMARIA, TP = W.TRANSPORTE;
    const P = D.REFERENCIA;
    const NOMBRE = {};
    D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
    const r = C.faltan(D, OTRA);
    const ind = function (id) { return r.falta.concat(r.sobra, r.empates).find(function (c) { return c.ind.id === id; }); };
    const dinero = function (id) { return D.contexto.dinero.find(function (s) { return s.id === id; }).valores; };
    const pob = D.BASES.total.valores;

    /* La biblioteca, el ejemplo de la portada de la web */
    const bib = ind('bibliotecas');
    const metro = ind('metro');
    /* Lo que en Parla es cero y en la otra no: va en el orden del recuento */
    const cero = r.falta.filter(function (c) { return c.ind.enTotal !== false && c.parla === 0; });

    /* El hospital */
    const H = W.HOSPITALES, hp = H.de(D, SA, P), ho = H.de(D, SA, OTRA);
    const cartera = r.falta.find(function (c) { return c.ind.medida === 'cartera'; });

    /* Las diez, de más a menos */
    const diez = D.MUNICIPIOS.filter(function (m) { return m.id !== P; }).map(function (m) {
      const x = C.faltan(D, m.id);
      return { id: m.id, nombre: m.nombre, falta: Math.round(x.TOTAL), sobra: Math.round(x.SOBRA) };
    }).sort(function (a, b) { return b.falta - a.falta; });
    const masDeLoQueFalta = diez.filter(function (d) { return d.sobra > d.falta; });

    /* El golpe, con la misma cuenta que la portada (app.js, golpe()) */
    const cuentan = D.indicadores.filter(function (i) { return i.enTotal !== false; });
    const ultimos = cuentan.filter(function (i) {
      const b = D.BASES[i.base || 'total'].valores;
      const t = function (m) { return i.datos[m].n / b[m]; };
      return Object.keys(NOMBRE).every(function (m) { return t(P) <= t(m) + 1e-12; });
    }).length;
    const renta = dinero('renta');
    const masPobre = Object.keys(NOMBRE).every(function (m) { return renta[P] <= renta[m]; });
    const inv = dinero('inversion');

    return {
      OTRA: OTRA, otra: NOMBRE[OTRA], web: D.NOMBRE_WEB,
      total: Math.round(r.TOTAL), totalExacto: r.TOTAL, tiene: r.TIENE,
      pobParla: pob[P], pobOtra: pob[OTRA],
      bib: { otra: bib.otra, parla: bib.parla, cada: Math.round(bib.baseOtra / bib.otra), tendria: bib.tendria, falta: bib.falta },
      metro: { otra: metro.otra, tendria: metro.tendria },
      cero: cero.map(function (c) { return { id: c.ind.id, titulo: c.ind.titulo, otra: c.otra, tendria: c.tendria }; }),
      camas: { parla: hp.por1000, otra: ho.por1000, nParla: hp.camas, nOtra: ho.camas, hospital: ho.corto, hParla: hp.corto },
      unidades: cartera ? cartera.lista : [],
      medico: { parla: PR.ciudades[P].familia, otra: PR.ciudades[OTRA].familia },
      espera: { parla: SA.ciudades[P].quirurgica.dias, otra: SA.ciudades[OTRA].quirurgica.dias, mes: SA.mes },
      estacion: { parla: TP.cobertura.ciudades[P].pct['15'], otra: TP.cobertura.ciudades[OTRA].pct['15'] },
      atocha: { parla: TP.casa[P].tren.atocha[0], otra: TP.casa[OTRA].tren.atocha[0] },
      abono: { parla: TP.abono.ciudades[P].precio, otra: TP.abono.ciudades[OTRA].precio },
      renta: { parla: renta[P], otra: renta[OTRA] },
      inversion: { parla: inv[P], otra: inv[OTRA], alAnio: (inv[OTRA] - inv[P]) * pob[P] },
      diez: diez, masDeLoQueFalta: masDeLoQueFalta,
      ultimos: ultimos, cuentan: cuentan.length, masPobre: masPobre
    };
  }

  /* La locución: (escena, segundos desde su inicio, texto). Habla una vecina,
     en plural, como la cabecera de la web. Las cifras, las de la pantalla. */
  function guion(F) {
    const O = F.otra;
    const cero = F.cero.filter(function (c) { return c.id !== 'metro'; });
    const corto = { universidad: 'campus', conservatorio: 'conservatorio', 'seguridad-social': 'Seguridad Social',
      hacienda: 'Hacienda', cercanias: 'Cercanías', bibliotecas: 'biblioteca' };
    const lista = cero.map(function (c) { return corto[c.id] || c.titulo.toLowerCase(); });
    const ni = lista.length ? 'Ni ' + lista.join(', ni ') + '.' : '';
    const diezMas = F.masDeLoQueFalta.map(function (d) { return d.nombre; });
    const masDeLo = diezMas.length === 0 ? '' : diezMas.length === 1
      ? ' Con ' + diezMas[0] + ' tenemos más de lo que nos falta.'
      : ' Con ' + diezMas.slice(0, -1).join(', ') + ' y ' + diezMas[diezMas.length - 1] +
        ' tenemos más de lo que nos falta.';
    const primera = F.diez[0];
    return [
      ['portada', 0.4, '¿Y si en Parla viviéramos como en ' + O + '?'],
      ['cuenta', 0.4, O + ' tiene una biblioteca pública por cada ' + entero(F.bib.cada, 'm') + ' vecinos.'],
      ['cuenta', 4.5, 'Con los que somos, nos tocarían ' + letra(F.bib.tendria, 1, 'f') + '. Tenemos ' + entero(F.bib.parla, 'f') + '.'],
      ['total', 0.4, 'Haciendo la misma cuenta con todo, nos faltan ' + entero(F.total, 'm') + ' equipamientos y servicios públicos.'],
      ['cero', 0.4, 'Ni una estación de Metro: nos tocarían ' + letra(F.metro.tendria, 1, 'f') + '. ' + ni],
      ['camas', 0.4, 'Nuestro hospital tiene ' + cuantas(F.camas.parla, 1, 'cama', 'camas', 'f') + ' por cada mil personas que atiende. ' +
        'El de ' + O + ', ' + letra(F.camas.otra, 1, 'f') + '.'],
      ['unidades', 0.4, 'Y ' + entero(F.unidades.length, 'f') + ' unidades que el nuestro no tiene, como ' +
        F.unidades.slice(2, 4).map(function (u) { return u.toLowerCase(); }).join(' o ') + '.'],
      ['medico', 0.4, 'Cada médico de familia tiene ' + entero(F.medico.parla, 'f') +
        ' tarjetas sanitarias. En ' + O + ', ' + entero(F.medico.otra, 'f') + '.'],
      ['espera', 0.4, 'En esto estamos mejor: quien espera una operación lleva ' +
        letra(F.espera.parla, 1, 'm') + ' días de media en lista. En ' + O + ', ' + letra(F.espera.otra, 1, 'm') + '.'],
      ['estacion', 0.4, 'De cada cien casas, ' + letra(F.estacion.parla, 0, 'f') + ' tienen una estación a quince minutos andando. ' +
        'En ' + O + ', ' + letra(F.estacion.otra, 0, 'f') + '.'],
      ['atocha', 0.4, 'Hasta Atocha en tren, la mitad de las casas tarda más de ' + entero(F.atocha.parla, 'm') + ' minutos. ' +
        'En ' + O + ', ' + entero(F.atocha.otra, 'm') + '.'],
      ['renta', 0.4, 'La renta media en Parla es de ' + entero(F.renta.parla, 'm') + ' euros por vecino. En ' + O + ', ' +
        entero(F.renta.otra, 'm') + '.'],
      ['inversion', 0.4, 'El ayuntamiento invierte ' + entero(F.inversion.parla, 'm') + ' euros por vecino al año. El de ' + O + ', ' +
        entero(F.inversion.otra, 'm') + '. A su ritmo, serían ' + letra(F.inversion.alAnio / 1e6, 1, 'm') + ' millones más al año.'],
      ['diez', 0.4, 'Y no es solo ' + O + ': con ' + primera.nombre + ' nos faltan ' + entero(primera.falta, 'm') + '.' + masDeLo],
      ['golpe', 0.3, 'Da igual la ciudad que elijas: Parla es la última' +
        (F.masPobre ? ' en renta' : '') + (F.ultimos ? (F.masPobre ? ' y' : '') + ' en ' + entero(F.ultimos, 'm') + ' de los ' +
          entero(F.cuentan, 'm') + ' equipamientos' : '') + '.'],
      ['cierre', 0.6, F.web + '. Elige tu ciudad y mira lo que nos falta.']
    ];
  }

  const CIFRAS = { cuantas: cuantas, OTRA: OTRA, S: S, DUR: DUR, CAPITULOS: CAPITULOS, calcular: calcular, guion: guion, num: num, letra: letra, entero: entero };
  if (typeof module === 'object' && module.exports) module.exports = CIFRAS;
  else raiz.CIFRAS = CIFRAS;
})(typeof window !== 'undefined' ? window : globalThis);

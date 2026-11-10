/* ═══════════════════════════════════════════════════════════════════════
   EL CATÁLOGO DE «TODOS LOS DATOS»
   Los ~108 datos de consulta.html con su cuenta, su unidad, su fuente y la
   forma de escribir cada cifra. Lo cargan la página (assets/consulta.js) y
   el build (herramientas/compartir.mjs, que con él pinta la vista previa de
   cada dato): las cifras de la imagen y las de la tabla salen de aquí, del
   mismo código. Solo lee window.DATOS y los demás ficheros de datos/; no
   toca la página.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const D = window.DATOS, E = window.ECONOMIA, V = window.VIVIENDA, A = window.ACCESOS, T = window.TRANSPORTE;
  const REF = D.REFERENCIA;
  const NOMBRE = {};
  D.MUNICIPIOS.forEach(function (m) { NOMBRE[m.id] = m.nombre; });
  const IDS = D.MUNICIPIOS.map(function (m) { return m.id; });

  function num(n, dec) {
    return n.toLocaleString('es-ES', { useGrouping: true, minimumFractionDigits: dec, maximumFractionDigits: dec })
      .replace('-', '−');
  }

  /* Euros por habitante: de 10 € para arriba, sin céntimos, que sobre 780 €
     son ruido; por debajo, con ellos, para que 0,02 € no se lea 0. Los
     recibos (lo que paga un vecino) van siempre con céntimos. En la tabla
     que se descarga, todos con sus decimales. */
  function eurHab(v) { return num(v, Math.abs(v) >= 10 || v === 0 ? 0 : 2); }
  const ultimo = function (xs) { return xs[xs.length - 1]; };
  const F = function (id) { const f = D.fuentes[id]; return f ? [f.t, f.url] : null; };
  const FE = function (id) { return (E && E.fuentes[id]) || null; };

  /* ── El catálogo ───────────────────────────────────────────────────
     Cada dato: id, grupo, título, unidad (lo que sale debajo del título),
     símbolo tras la cifra, decimales, v(ciudad) (null si no hay dato),
     fuente [texto, url] y la página donde se cuenta. */

  const CAT = [];
  function dato(o) { CAT.push(o); }

  /* Población */
  dato({ id: 'habitantes', grupo: 'Población', titulo: 'Habitantes', unidad: 'a 1 de enero de 2025', dec: 0,
    v: function (id) { return D.BASES.total.valores[id]; }, fuente: F('ine'), pagina: 'index.html#partida' });
  dato({ id: 'mayores', grupo: 'Población', titulo: 'Personas de 65 años o más', unidad: 'de cada 100 habitantes', sim: '%', dec: 1,
    v: function (id) { return D.BASES.mayores.valores[id] / D.BASES.total.valores[id] * 100; }, fuente: F('edades'), pagina: 'index.html#partida' });
  dato({ id: 'menores', grupo: 'Población', titulo: 'Menores de 18 años', unidad: 'de cada 100 habitantes', sim: '%', dec: 1,
    v: function (id) {
      const B = D.BASES;
      return (B.infantil.valores[id] + B.primaria.valores[id] + B.secundaria.valores[id]) / B.total.valores[id] * 100;
    }, fuente: F('edades'), pagina: 'index.html#partida' });

  /* Equipamientos: los del recuento, contra su población, como en la portada. */
  D.indicadores.forEach(function (ind) {
    const base = D.BASES[ind.base || 'total'];
    if (ind.medida === 'superficie') {
      dato({ id: ind.id, grupo: 'Equipamientos', titulo: ind.titulo, unidad: 'metros cuadrados por habitante', sim: 'm²', dec: 1,
        v: function (id) { return ind.datos[id].n / base.valores[id]; }, fuente: F(ind.fuenteId), pagina: 'index.html#ind-' + ind.id });
      return;
    }
    dato({ id: ind.id, grupo: 'Equipamientos', titulo: ind.titulo,
      unidad: 'por cada ' + base.por.toLocaleString('es-ES') + ' ' + base.etiqueta, dec: 2,
      v: function (id) { return ind.datos[id].n / base.valores[id] * base.por; },
      fuente: F(ind.fuenteId), pagina: 'index.html#ind-' + ind.id });
  });

  /* El dinero de siempre: las series de la portada y de economía. */
  D.contexto.dinero.forEach(function (s) {
    const vecinos = ['paro', 'renta', 'pobreza', 'pib'].indexOf(s.id) >= 0;
    dato({ id: 'dinero-' + s.id, grupo: vecinos ? 'Vecinos y economía' : 'Cuentas del ayuntamiento',
      titulo: s.titulo, unidad: s.pie, sim: s.unidad === '%' ? '%' : '€',
      dec: s.decimales != null ? s.decimales : 2, porHab: s.unidad !== '%',
      v: function (id) { return s.valores[id]; }, fuente: F(s.fuenteId), pagina: 'economia.html#dinero-' + s.id });
  });

  /* Economía */
  if (E) {
    const t = function (id) { return E.ciudades[id].trabajo; };
    const r = function (id) { return E.ciudades[id].renta; };
    const e = function (id) { return E.ciudades[id].empresas; };
    const k = function (id) { return E.ciudades[id].cuentas; };
    const o = function (id) { return E.ciudades[id].ocupacion.pct; };
    const G = 'Vecinos y economía', C = 'Cuentas del ayuntamiento';
    [
      ['puestos', G, 'Puestos de trabajo en la ciudad', 'por cada 100 vecinos que trabajan, finales de 2025', '', 1, function (id) { return ultimo(t(id).puestos); }, 'afilCentro', 'economia.html#trabajo'],
      ['mismo-municipio', G, 'Quien trabaja en su propia ciudad', 'de cada 100 vecinos ocupados, 2023', '%', 1, function (id) { return t(id).mismoMun; }, 'censoTrabajo', 'economia.html#trabajo'],
      ['ocup-carrera', G, 'Vecinos en dirección y profesiones con carrera', 'de cada 100 vecinos con trabajo, 2023', '%', 1, function (id) { return o(id)[0] + o(id)[1]; }, 'censoOcupacion', 'economia.html#trabajo'],
      ['ocup-servicios', G, 'Vecinos en hostelería, comercio, cuidados y seguridad', 'de cada 100 vecinos con trabajo, 2023', '%', 1, function (id) { return o(id)[4]; }, 'censoOcupacion', 'economia.html#trabajo'],
      ['ocup-oficios', G, 'Vecinos en oficios de obra, taller y fábrica, y conductores', 'de cada 100 vecinos con trabajo, 2023', '%', 1, function (id) { return o(id)[5] + o(id)[6] + o(id)[7]; }, 'censoOcupacion', 'economia.html#trabajo'],
      ['ocup-elementales', G, 'Vecinos en limpieza, peones y reparto', 'de cada 100 vecinos con trabajo, ocupaciones elementales, 2023', '%', 1, function (id) { return o(id)[8]; }, 'censoOcupacion', 'economia.html#trabajo'],
      ['paro-registrado', G, 'Apuntados al paro', 'por cada 100 habitantes de 16 a 64 años, media de 2025', '', 2, function (id) { return ultimo(t(id).paro); }, 'sepeParo', 'economia.html#paro'],
      ['paro-mujeres', G, 'Paradas registradas', 'por cada 100 mujeres de 16 a 64 años, media de 2025', '', 2, function (id) { return t(id).paroMujer; }, 'sepeParo', 'economia.html#paro'],
      ['paro-jovenes', G, 'Parados de menos de 25 años', 'por cada 100 habitantes de 16 a 24 años, media de 2025', '', 2, function (id) { return t(id).paroJoven; }, 'sepeParo', 'economia.html#paro'],
      ['indefinidos', G, 'Contratos indefinidos', 'de cada 100 contratos firmados en 2025', '%', 1, function (id) { return t(id).indefinidos; }, 'sepeContratos', 'economia.html#paro'],
      ['renta-persona', G, 'Renta neta por persona', '2024', '€', 0, function (id) { return ultimo(r(id).persona); }, 'adrh', 'economia.html#renta'],
      ['renta-hogar', G, 'Renta neta por hogar', '2024', '€', 0, function (id) { return r(id).hogar; }, 'adrh', 'economia.html#renta'],
      ['irpf', G, 'Renta bruta por declaración del IRPF', '2024', '€', 0, function (id) { return r(id).irpf.bruta; }, 'irpf', 'economia.html#renta'],
      ['irpf-trabajo', G, 'Rendimiento neto del trabajo', 'por declaración que lo tiene, 2024', '€', 0, function (id) { return r(id).irpf.trabajo; }, 'irpf', 'economia.html#renta'],
      ['salario', G, 'Lo que sale del salario', 'de cada 100 € de renta bruta, 2024', '%', 1, function (id) { return r(id).fuentes[0]; }, 'adrhFuentes', 'economia.html#renta'],
      ['pensiones', G, 'Lo que sale de las pensiones', 'de cada 100 € de renta bruta, 2024', '%', 1, function (id) { return r(id).fuentes[1]; }, 'adrhFuentes', 'economia.html#renta'],
      ['gini', G, 'Índice de Gini', 'de la renta por unidad de consumo, 2024 (0, todos igual; 100, uno lo tiene todo)', '', 1, function (id) { return r(id).gini; }, 'adrhGini', 'economia.html#renta'],
      ['empresas', G, 'Empresas activas', 'con sede en la ciudad, por cada 1.000 habitantes, 2025', '', 1, function (id) { return e(id).por1000; }, 'dirce', 'economia.html#produce'],
      ['pib-construccion', G, 'Peso de la construcción en el PIB', 'de cada 100 € del PIB municipal, 2023', '%', 1, function (id) { return e(id).pibRamas[1]; }, 'pibRamas', 'economia.html#produce'],
      ['pib-industria', G, 'Peso de la industria en el PIB', 'de cada 100 € del PIB municipal, 2023', '%', 1, function (id) { return e(id).pibRamas[0]; }, 'pibRamas', 'economia.html#produce'],
      ['deuda-anual', C, 'Lo que se va en la deuda cada año', 'intereses y devolución de préstamos por habitante, media de 2021 a 2024', '€', 2, function (id) { return k(id).deuda; }, null, 'economia.html#ayuntamiento'],
      ['intereses', C, 'Intereses', 'gastos financieros por habitante, media de 2021 a 2024', '€', 2, function (id) { return k(id).intereses; }, null, 'economia.html#ayuntamiento'],
      ['demora', C, 'Intereses de demora', 'los que se pagan por pagar tarde, por habitante, media de 2021 a 2024', '€', 2, function (id) { return k(id).demora; }, null, 'economia.html#ayuntamiento'],
      ['ingresos-propios', C, 'Lo que recauda', 'impuestos, tasas y otros ingresos propios por habitante, media de 2021 a 2024', '€', 2, function (id) { return k(id).propios; }, null, 'economia.html#ayuntamiento'],
      ['estado', C, 'Lo que llega del Estado', 'transferencias corrientes por habitante, media de 2021 a 2024', '€', 2, function (id) { return k(id).estado; }, null, 'economia.html#ayuntamiento'],
      ['pmp', C, 'Lo que tarda en pagar', 'periodo medio de pago a proveedores, septiembre de 2025 a agosto de 2026', 'días', 0, function (id) { return k(id).pmp; }, 'pmp', 'economia.html#ayuntamiento'],
      ['remanente', C, 'Lo que le queda en caja', 'remanente de tesorería ajustado por habitante, 31-12-2024', '€', 2, function (id) { return k(id).remanenteAjustado; }, null, 'economia.html#ayuntamiento']
    ].forEach(function (x) {
      dato({ id: x[0], grupo: x[1], titulo: x[2], unidad: x[3], sim: x[4], dec: x[5], v: x[6],
        porHab: x[4] === '€' && /por habitante/.test(x[3]),
        fuente: x[7] ? FE(x[7]) : F('conprel'), pagina: x[8] });
    });
  }

  /* Vivienda: las cuentas de vivienda.js. */
  if (V) {
    const c = function (id) { return V.ciudades[id]; };
    const MIVAU = ['Ministerio de Vivienda, valor tasado de la vivienda libre', 'https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/valor-tasado-vivienda'];
    const SERPAVI = ['Ministerio de Vivienda, SERPAVI', 'https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi'];
    const CENSO = ['INE, Censo de Población y Viviendas 2021', 'https://www.ine.es/jaxi/Tabla.htm?tpx=59529'];
    const CATASTRO = ['Dirección General del Catastro', 'https://www.catastro.hacienda.gob.es/es-ES/estadisticas_3_1.html'];
    const ALMUDENA = ['Catastro, unidades residenciales (Comunidad de Madrid)', 'https://gestiona.comunidad.madrid/desvan/almudena/AccionDatosTemaMunicipal.icm?codTema=1002048'];
    const G = 'Vivienda';
    [
      ['tasado', 'Valor tasado de la vivienda', 'euros por metro cuadrado, último trimestre', '€', 0, function (id) { return c(id).tasado.ult.v; }, MIVAU, 'vivienda.html#comprar'],
      ['anios-renta', 'Años de renta para comprar la vivienda media', 'con la renta neta media de un hogar, 2024', 'años', 1, function (id) { return c(id).tasado.ult.v * c(id).censo.superficieConstruida / c(id).renta.hogar; }, MIVAU, 'vivienda.html#comprar'],
      ['alquiler-m2', 'Alquiler', 'euros por metro cuadrado al mes, mediana de 2024', '€', 2, function (id) { return ultimo(c(id).alquiler.m2); }, SERPAVI, 'vivienda.html#alquilar'],
      ['alquiler-mes', 'Alquiler', 'euros al mes, mediana de 2024', '€', 0, function (id) { return ultimo(c(id).alquiler.mes); }, SERPAVI, 'vivienda.html#alquilar'],
      ['esfuerzo', 'Lo que se lleva el alquiler', 'de cada 100 € que entran en un hogar medio, 2024', '%', 1, function (id) { return c(id).alquiler.esfuerzo.pct; }, SERPAVI, 'vivienda.html#alquilar'],
      ['hogares-alquiler', 'Hogares de alquiler', 'de cada 100 hogares, 2021', '%', 1, function (id) { return c(id).censo.pctAlquiler; }, CENSO, 'vivienda.html#alquilar'],
      ['compraventas', 'Compraventas de vivienda', 'por cada 1.000 habitantes, 2025', '', 1, function (id) { return c(id).compraventas.por1000; }, ['Ministerio de Vivienda, transacciones inmobiliarias', 'https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/transacciones-inmobiliarias-compraventa'], 'vivienda.html#comprar'],
      ['casas-por-vecino', 'Viviendas nuevas', 'por cada 100 vecinos nuevos, 2015-2025 (sin dato si la ciudad perdió vecinos)', '', 1, function (id) {
        const x = c(id).crece, n = x.pob.length - 1, p = x.pob[n] - x.pob[0];
        return p > 0 ? (x.casas[n] - x.casas[0]) / p * 100 : null;
      }, ALMUDENA, 'vivienda.html#casas'],
      ['vacias', 'Viviendas vacías', 'de cada 100, por consumo eléctrico', '%', 2, function (id) { return c(id).censo.pctVacias; }, CENSO, 'vivienda.html#parque'],
      ['antiguas', 'Viviendas en edificios anteriores a 1981', 'de cada 100', '%', 1, function (id) { return c(id).censo.pctAntes1981; }, CENSO, 'vivienda.html#parque'],
      ['jovenes-padres', 'Jóvenes de 25 a 34 años que viven con sus padres', 'de cada 100, 2021', '%', 1, function (id) { return c(id).hogares.pctConPadres; }, ['INE, Censo 2021, tablas a medida', 'https://www.ine.es/Censo2021/Inicio.do'], 'vivienda.html#parque'],
      ['sin-ascensor', 'Viviendas en edificios de 4 o más plantas sin ascensor', 'de cada 100, 2011', '%', 1, function (id) { return c(id).hogares.pctSinAscensor; }, ['INE, Censo 2011, tablas a medida', 'https://www.ine.es/censos2011/tablas/Inicio.do'], 'vivienda.html#parque'],
      ['sociedades', 'Viviendas a nombre de sociedades', 'de cada 100, padrón del IBI de 2026', '%', 1, function (id) { return c(id).titular.soc / c(id).titular.inm * 100; }, CATASTRO, 'vivienda.html#duenos'],
      ['avs', 'Viviendas públicas de la Comunidad', 'de la Agencia de Vivienda Social por cada 1.000 habitantes', '', 2, function (id) { return c(id).avs.por1000; }, ['Agencia de Vivienda Social', 'https://www.comunidad.madrid/gobierno/estadistica/patrimonio-datos-estadisticos-agencia-vivienda-social'], 'vivienda.html#publica'],
      ['ibi', 'Recibo del IBI de la vivienda media', 'estimado, 2026', '€', 0, function (id) { return c(id).ibi.recibo; }, ['Ministerio de Hacienda, tipos del IBI de 2026', 'https://serviciostelematicosext.hacienda.gob.es/SGFAL/ConsultaTipos/aspx/listado_municipiosm.aspx'], 'vivienda.html#comprar']
    ].forEach(function (x) {
      dato({ id: x[0], grupo: G, titulo: x[1], unidad: x[2], sim: x[3], dec: x[4], v: x[5], fuente: x[6], pagina: x[7] });
    });
  }

  /* Infraestructuras */
  const MITMA = ['Ministerio de Transportes, rutas por carretera, 16-10-2024', 'https://www.transportes.gob.es/ministerio/proyectos-singulares/estudios-de-movilidad-con-big-data/rutas-por-carretera'];
  if (A) {
    const total = function (c) { return c.puertas.reduce(function (s, p) { return s + p.v; }, 0) + c.calles; };
    dato({ id: 'salida-mas-usada', grupo: 'Infraestructuras', titulo: 'Gente que sale por la salida más usada',
      unidad: 'de cada 100 que salen por carretera de 6 a 10 de la mañana', sim: '%', dec: 1,
      v: function (id) { const c = A.ciudades[id]; return c.puertas[0].v / total(c) * 100; }, fuente: MITMA, pagina: 'infraestructura.html#mapas' });
    dato({ id: 'salen-coche', grupo: 'Infraestructuras', titulo: 'Gente que sale por carretera por la mañana',
      unidad: 'de 6 a 10, por cada 1.000 habitantes', dec: 0,
      v: function (id) { const c = A.ciudades[id]; return c.sale.h610 / c.pob * 1000; }, fuente: MITMA, pagina: 'infraestructura.html#colas' });
  }
  if (T && T.cobertura) {
    [['15', 'cobertura'], ['10', 'cobertura-10'], ['5', 'cobertura-5']].forEach(function (x) {
      dato({ id: x[1], grupo: 'Infraestructuras', titulo: 'Viviendas con el tren a ' + x[0] + ' minutos andando',
        unidad: 'de cada 100, con estación de Cercanías, Metro o Metro Ligero', sim: '%', dec: 1,
        v: function (id) { return T.cobertura.ciudades[id] ? T.cobertura.ciudades[id].pct[x[0]] : null; },
        fuente: ['Catastro, edificios, y horarios del Consorcio Regional de Transportes', T.cobertura.fuente], pagina: 'infraestructura.html#tren-a-mano' });
    });
  }
  if (T && T.distancia) {
    const MOV = ['Ministerio de Transportes, Open Data Movilidad, 16-10-2024', T.distancia.fuente];
    dato({ id: 'trabajo-km', grupo: 'Infraestructuras', titulo: 'Lo lejos que queda el trabajo',
      unidad: 'km de media de casa al trabajo o a estudiar, todos los medios', dec: 1,
      v: function (id) { return T.distancia.ciudades[id] ? T.distancia.ciudades[id].km : null; }, fuente: MOV, pagina: null });
    dato({ id: 'trabajo-lejos', grupo: 'Infraestructuras', titulo: 'Viajes al trabajo o a estudiar de más de 10 km',
      unidad: 'de cada 100', sim: '%', dec: 1,
      v: function (id) { return T.distancia.ciudades[id] ? T.distancia.ciudades[id].lejos : null; }, fuente: MOV, pagina: null });
    dato({ id: 'km-vecino', grupo: 'Infraestructuras', titulo: 'Kilómetros al día por vecino',
      unidad: 'de los viajes que salen de casa o vuelven a ella', dec: 1,
      v: function (id) { return T.distancia.ciudades[id] ? T.distancia.ciudades[id].kmVecino : null; }, fuente: MOV, pagina: null });
  }
  if (T && T.casa) {
    dato({ id: 'casa-atocha', grupo: 'Infraestructuras', titulo: 'Desde la vivienda mediana hasta Atocha, en tren, Metro o autobús',
      unidad: 'minutos, un martes de 7:30 a 8:30', dec: 0,
      v: function (id) { return T.casa[id] ? T.casa[id].todo.atocha[0] : null; },
      fuente: ['Catastro, edificios, y horarios del Consorcio Regional de Transportes', T.cobertura ? T.cobertura.fuente : 'https://datos.crtm.es/'], pagina: 'infraestructura.html#casa' });
    dato({ id: 'casa-atocha-hora', grupo: 'Infraestructuras', titulo: 'Viviendas a más de una hora de Atocha en tren, Metro o autobús',
      unidad: 'de cada 100, un martes de 7:30 a 8:30', sim: '%', dec: 1,
      v: function (id) { return T.casa[id] ? T.casa[id].todo.atocha[1] : null; },
      fuente: ['Catastro, edificios, y horarios del Consorcio Regional de Transportes', T.cobertura ? T.cobertura.fuente : 'https://datos.crtm.es/'], pagina: 'infraestructura.html#casa' });
  }
  if (T && T.abono) {
    dato({ id: 'abono', grupo: 'Infraestructuras', titulo: 'Abono de transporte de 30 días', unidad: 'ordinario, 2026, según la zona tarifaria',
      sim: '€', dec: 2, v: function (id) { return T.abono.ciudades[id] ? T.abono.ciudades[id].precio : null; },
      etiqueta: function (id) { return 'zona ' + T.abono.ciudades[id].zona; },
      fuente: ['BOCM del 31-12-2025, precios del transporte público para 2026', T.abono.fuente], pagina: null });
  }

  /* Lo que paga un vecino: el IBI y el coche, con los tipos de 2026. */
  const IM = window.IMPUESTOS;
  if (IM) {
    const c = function (id) { return IM.ciudades[id]; };
    const fT = IM.fuentes.tipos;
    dato({ id: 'paga-misma', grupo: 'Cuentas del ayuntamiento', titulo: 'IBI y coche de la misma casa',
      unidad: 'euros al año, vivienda de ' + IM.comun.vc.toLocaleString('es-ES') + ' € de valor catastral y coche de 12 a 15,99 CV, ' + IM.anio,
      sim: '€', dec: 2, v: function (id) { return c(id).comunIbi + c(id).coche; }, fuente: fT, pagina: 'economia.html#paga' });
    dato({ id: 'paga-suya', grupo: 'Cuentas del ayuntamiento', titulo: 'IBI y coche de la casa media',
      unidad: 'euros al año, la vivienda media de cada ciudad y un coche de 12 a 15,99 CV, ' + IM.anio,
      sim: '€', dec: 2, v: function (id) { return c(id).ibi + c(id).coche; }, fuente: fT, pagina: 'economia.html#paga' });
    dato({ id: 'ibi-tipo', grupo: 'Cuentas del ayuntamiento', titulo: 'Tipo del IBI',
      unidad: 'de cada 100 € de valor catastral de una vivienda, ' + IM.anio,
      sim: '%', dec: 3, v: function (id) { return c(id).tipo; }, fuente: fT, pagina: 'economia.html#paga' });
    dato({ id: 'coche', grupo: 'Cuentas del ayuntamiento', titulo: 'Impuesto de un coche',
      unidad: 'de 12 a 15,99 caballos fiscales, euros al año, ' + IM.anio,
      sim: '€', dec: 2, v: function (id) { return c(id).coche; }, fuente: fT, pagina: 'economia.html#paga' });
  }

  /* El médico de cabecera y la escuela infantil. */
  const PR = window.PRIMARIA, IN = window.INFANTIL;
  if (PR) {
    const fP = PR.fuentes.plantilla;
    dato({ id: 'tarjetas-medico', grupo: 'Sanidad', titulo: 'Tarjetas sanitarias por plaza de médico de familia',
      unidad: 'de 14 años o más, en los centros de salud de la ciudad; plazas de octubre de 2026, tarjetas de ' + PR.anioTarjetas,
      dec: 0, v: function (id) { return PR.ciudades[id].familia; }, fuente: fP, pagina: 'sanidad.html#cabecera' });
    dato({ id: 'tarjetas-pediatra', grupo: 'Sanidad', titulo: 'Tarjetas sanitarias por plaza de pediatra',
      unidad: 'de 0 a 13 años, en los centros de salud de la ciudad; plazas de octubre de 2026, tarjetas de ' + PR.anioTarjetas,
      dec: 0, v: function (id) { return PR.ciudades[id].pediatria; }, fuente: fP, pagina: 'sanidad.html#cabecera' });
  }
  if (IN) {
    const fI = IN.fuentes.buscador;
    dato({ id: 'infantil-sin-plaza', grupo: 'Equipamientos', titulo: 'Solicitudes sin plaza en la escuela infantil pública',
      unidad: 'de cada 100, de 0 a 2 años, proceso de admisión ' + IN.cursoAdmision, sim: '%', dec: 1,
      v: function (id) { return IN.ciudades[id].pctSinPlaza; }, fuente: fI, pagina: 'educacion.html#infantil' });
    dato({ id: 'infantil-matriculados', grupo: 'Equipamientos', titulo: 'Niños en la escuela infantil pública',
      unidad: 'por cada 100 niños de 0 a 2 años, curso ' + IN.cursoMatricula, dec: 1,
      v: function (id) { return IN.ciudades[id].matriculadosPor100; }, fuente: fI, pagina: 'educacion.html#infantil' });
  }

  /* La espera: la del hospital que le toca a cada ciudad (Pinto, el de
     Getafe; Pozuelo y Majadahonda comparten el Puerta de Hierro). */
  const SA = window.SANIDAD;
  if (SA) {
    const h = function (id) { return SA.ciudades[id]; };
    const nombreH = function (id) { return h(id).corto.replace(/^(el|la) /, ''); };
    const fuenteSA = SA.fuentes.consulta;
    [['espera-operarse', 'quirurgica', 'Espera para operarse'],
      ['espera-consulta', 'consultas', 'Espera para la primera consulta con el especialista'],
      ['espera-prueba', 'pruebas', 'Espera para una prueba diagnóstica']].forEach(function (x) {
      dato({ id: x[0], grupo: 'Sanidad', titulo: x[2],
        unidad: 'días de media en el hospital que le toca, ' + SA.mes, sim: 'días', dec: 1,
        v: function (id) { return h(id) && h(id)[x[1]] ? h(id)[x[1]].dias : null; },
        etiqueta: nombreH, fuente: fuenteSA, pagina: 'sanidad.html#espera' });
    });
    dato({ id: 'lista-operarse', grupo: 'Sanidad', titulo: 'En lista para operarse',
      unidad: 'por cada 1.000 personas que tiene asignadas su hospital, ' + SA.mes, sim: '', dec: 1,
      v: function (id) { return h(id) ? h(id).quirurgica.por1000 : null; },
      etiqueta: nombreH, fuente: fuenteSA, pagina: 'sanidad.html#espera' });
  }

  /* La discapacidad: plazas de la red pública (públicas y concertadas), cada
     una contra quien la usa, como en inclusion.html; la salud mental y la
     educación especial, como en sanidad.html y educacion.html. */
  const DI = window.DISCAPACIDAD;
  if (DI) {
    const c = function (id) { return DI.ciudades[id]; };
    const fR = DI.fuentes.registro;
    const adultos = function (id) {
      const Ed = D.contexto.edades;
      return Ed.tramos.reduce(function (t, x) { return t - x.valores[id]; }, Ed.total[id]);
    };
    dato({ id: 'dis-personas', grupo: 'Inclusión', titulo: 'Personas con discapacidad reconocida',
      unidad: 'por cada 1.000 habitantes, a 31 de diciembre de ' + DI.anio, dec: 1,
      v: function (id) { return c(id).total / D.BASES.total.valores[id] * 1000; },
      fuente: DI.fuentes.reconocidasEdad, pagina: 'inclusion.html#personas' });
    dato({ id: 'dis-intelectual', grupo: 'Inclusión', titulo: 'Personas con discapacidad intelectual reconocida',
      unidad: 'por cada 1.000 habitantes, a 31 de diciembre de ' + DI.anio, dec: 1,
      v: function (id) { return c(id).intelectual / D.BASES.total.valores[id] * 1000; },
      fuente: DI.fuentes.reconocidas, pagina: 'inclusion.html#personas' });
    [['dis-residencia', 'residencial', 'Plazas en residencias y viviendas con apoyo', 'residencia'],
      ['dis-dia', 'dia', 'Plazas en centros de día', 'dia'],
      ['dis-ocupacional', 'ocupacional', 'Plazas en centros ocupacionales', 'ocupacional']].forEach(function (x) {
      dato({ id: x[0], grupo: 'Inclusión', titulo: x[2] + ' para la discapacidad intelectual',
        unidad: 'por cada 100 personas con discapacidad intelectual reconocida', dec: 1,
        v: function (id) { return c(id)[x[1]].plazas / c(id).intelectual * 100; },
        fuente: fR, pagina: 'inclusion.html#' + x[3] });
    });
    dato({ id: 'dis-temprana', grupo: 'Inclusión', titulo: 'Plazas de atención temprana',
      unidad: 'por cada 1.000 niños de 0 a 5 años', dec: 1,
      v: function (id) { return c(id).temprana.plazas / c(id).ninos0a5 * 1000; },
      fuente: fR, pagina: 'inclusion.html#temprana' });
    const escolares = function (id) { return D.BASES.primaria.valores[id] + D.BASES.secundaria.valores[id]; };
    dato({ id: 'educacion-especial', grupo: 'Inclusión', titulo: 'Alumnos de educación especial',
      unidad: 'en centros públicos y concertados, por cada 1.000 niños y jóvenes de 3 a 17 años, curso ' + DI.cursoEspecial, dec: 1,
      v: function (id) { return c(id).especial.alumnos / escolares(id) * 1000; },
      fuente: DI.fuentes.alumnos, pagina: 'educacion.html#especial' });
    dato({ id: 'aulas-tea', grupo: 'Inclusión', titulo: 'Aulas TEA',
      unidad: 'en colegios e institutos públicos y concertados, por cada 10.000 niños y jóvenes de 3 a 17 años', dec: 1,
      v: function (id) { return c(id).tea.aulas / escolares(id) * 10000; },
      fuente: DI.fuentes.tea, pagina: 'educacion.html#tea' });
    dato({ id: 'ppme', grupo: 'Inclusión', titulo: 'Programas de FP de modalidad especial',
      unidad: 'por cada 10.000 chicos y chicas de 12 a 17 años, oferta ' + DI.cursoPpme, dec: 1,
      v: function (id) { return c(id).ppme.programas / D.BASES.secundaria.valores[id] * 10000; },
      fuente: DI.fuentes.ppme, pagina: 'educacion.html#ppme' });
    dato({ id: 'salud-mental', grupo: 'Sanidad', titulo: 'Plazas de la red de salud mental',
      unidad: 'de atención social a la enfermedad mental grave, por cada 10.000 vecinos de 18 a 64 años', dec: 1,
      v: function (id) { return c(id).mental.plazas / adultos(id) * 10000; },
      fuente: fR, pagina: 'sanidad.html#mental' });
  }

  /* Cinco datos sueltos de datos/contexto.js (herramientas/contexto.py). Donde la
     fuente no tiene dato (la esperanza de vida, en las ciudades de menos de
     100.000 habitantes) o la cifra no se compara (la antigüedad de los
     coches en Alcobendas y Majadahonda), «sin dato». */
  const CX = window.CONTEXTO;
  if (CX) {
    const ci = function (k) { return function (id) { return CX[k].valores[id] != null ? CX[k].valores[id] : null; }; };
    dato({ id: 'estudios-eso', grupo: 'Vecinos y economía', titulo: 'Vecinos con la ESO como máximo',
      unidad: 'de cada 100 de 25 a 64 años, ' + CX.estudios.anio, sim: '%', dec: 1, v: ci('estudios'),
      fuente: CX.estudios.fuente, pagina: 'educacion.html#estudios' });
    dato({ id: 'esperanza-vida', grupo: 'Sanidad', titulo: 'Esperanza de vida al nacer',
      unidad: 'años, ' + CX.esperanza.anio + '; solo ciudades de más de 100.000 habitantes', sim: 'años', dec: 2,
      v: function (id) { return CX.esperanza.total[id] != null ? CX.esperanza.total[id] : null; },
      fuente: CX.esperanza.fuente, pagina: 'sanidad.html#vida' });
    dato({ id: 'pension-media', grupo: 'Vecinos y economía', titulo: 'Pensión contributiva media por pensionista',
      unidad: 'euros al mes, a ' + CX.pension.fecha, sim: '€', dec: 0,
      v: function (id) { return CX.pension.total[id]; }, fuente: CX.pension.fuente, pagina: 'economia.html#pensiones' });
    dato({ id: 'edad-coches', grupo: 'Infraestructuras', titulo: 'Antigüedad media de los turismos',
      unidad: 'años, solo turismos de menos de 25 años, a ' + CX.coches.fecha + '; sin Alcobendas ni Majadahonda, que no se comparan', sim: 'años', dec: 2,
      v: function (id) { return CX.coches.fuera.indexOf(id) >= 0 ? null : CX.coches.anios[id]; },
      fuente: CX.coches.fuente, pagina: 'infraestructura.html#coches' });
  }

  const POR_ID = {};
  CAT.forEach(function (d) { POR_ID[d.id] = d; });
  const GRUPOS = [];
  CAT.forEach(function (d) { if (GRUPOS.indexOf(d.grupo) < 0) GRUPOS.push(d.grupo); });

  /* La cifra como la escribe la tabla de la página. */
  function cifra(d, v) {
    if (v == null) return 'sin dato';
    const n = d.porHab ? eurHab(v) : num(v, d.dec);
    return d.sim === '€' || d.sim === '%' ? n + ' ' + d.sim : d.sim ? n + ' ' + d.sim : n;
  }

  /* Las once, de la mayor a la menor; sin dato, al final. */
  function filas(d) {
    return IDS.map(function (id) { return { id: id, v: d.v(id) }; }).sort(function (a, b) {
      if (a.v == null) return b.v == null ? 0 : 1;
      if (b.v == null) return -1;
      return b.v - a.v;
    });
  }

  /* El puesto de una fila entre las que tienen dato. Los empates comparten puesto. */
  function puesto(d, fs, x) {
    return x.v == null ? '' : 1 + fs.filter(function (y) {
      return y.v != null && y.v > x.v && cifra(d, y.v) !== cifra(d, x.v);
    }).length;
  }

  window.CONSULTA = { CAT: CAT, POR_ID: POR_ID, GRUPOS: GRUPOS, IDS: IDS, NOMBRE: NOMBRE, num: num, eurHab: eurHab,
    cifra: cifra, filas: filas, puesto: puesto };
})();

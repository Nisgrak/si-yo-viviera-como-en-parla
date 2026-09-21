/* ─────────────────────────────────────────────────────────────────────────
   SI YO VIVIERA COMO EN PARLA · datos
   ─────────────────────────────────────────────────────────────────────────
   Todas las cifras proceden de fuentes oficiales y llevan su fuente y fecha.
   Para añadir un municipio nuevo:
     1. añade su población en POBLACIONES
     2. añade su bloque en `datos` dentro de cada indicador
     3. añádelo a MUNICIPIOS con activo: true
   ───────────────────────────────────────────────────────────────────────── */

window.DATOS = (function () {
  const ACTUALIZADO = 'septiembre de 2026';

  /* Cifras oficiales de población a 1 de enero de 2025 (INE, Padrón) */
  const POBLACIONES = {
    getafe: 193238,
    parla: 137471,
    fuenlabrada: 190076,
    leganes: 195734,
    alcorcon: 175719,
    mostoles: 214817,
  };

  /* Bases de comparación.
     No todo se mide contra la población total: un colegio se mide contra los
     niños que tienen edad de ir al colegio. Parla es mucho más joven que Getafe,
     así que usar la población total le daría una ventaja que no es real.
     Tramos de edad: INE, año a año, 1 de enero de 2025. */
  const BASES = {
    total: {
      etiqueta: 'habitantes',
      corto: 'población total',
      por: 100000,
      valores: { getafe: 193238, parla: 137471 },
      fuenteId: 'ine',
    },
    infantil: {
      etiqueta: 'niños y niñas de 0 a 2 años',
      corto: 'población de 0 a 2 años',
      por: 10000,
      valores: { getafe: 4497, parla: 3315 },
      fuenteId: 'edades',
    },
    primaria: {
      etiqueta: 'niños y niñas de 3 a 11 años',
      corto: 'población de 3 a 11 años',
      por: 10000,
      valores: { getafe: 17671, parla: 14212 },
      fuenteId: 'edades',
    },
    secundaria: {
      etiqueta: 'chicos y chicas de 12 a 17 años',
      corto: 'población de 12 a 17 años',
      por: 10000,
      valores: { getafe: 12760, parla: 11919 },
      fuenteId: 'edades',
    },
    mayores: {
      etiqueta: 'personas de 65 años o más',
      corto: 'población de 65 años o más',
      por: 10000,
      valores: { getafe: 38119, parla: 19323 },
      fuenteId: 'edades',
    },
  };

  const MUNICIPIOS = [
    { id: 'getafe', nombre: 'Getafe', activo: true },
    { id: 'fuenlabrada', nombre: 'Fuenlabrada', activo: false },
    { id: 'leganes', nombre: 'Leganés', activo: false },
    { id: 'alcorcon', nombre: 'Alcorcón', activo: false },
    { id: 'mostoles', nombre: 'Móstoles', activo: false },
    { id: 'madrid-distritos', nombre: 'Distritos de Madrid', activo: false },
  ];

  const F = {
    ine: {
      t: 'INE · Cifras oficiales de población de los municipios españoles, 1 enero 2025',
      url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=2881',
    },
    edades: {
      t: 'INE · Población por sexo, edad año a año y nacionalidad, 1 enero 2025',
      url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=68543',
    },
    metro: {
      t: 'Metro de Madrid · Línea 12 (MetroSur) y Ayuntamiento de Getafe',
      url: 'https://getafe.es/la-ciudad/comunicaciones-2/metro/',
    },
    cercanias: {
      t: 'Renfe Cercanías Madrid · líneas C-3 y C-4',
      url: 'https://www.renfe.com/es/es/cercanias/cercanias-madrid',
    },
    tranvia: {
      t: 'Consorcio Regional de Transportes de Madrid · Metro Ligero ML-4',
      url: 'https://www.crtm.es/tu-transporte-publico/metro-ligero/',
    },
    sanitarios: {
      t: 'Comunidad de Madrid · Registro de centros, servicios y establecimientos sanitarios (datos abiertos)',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/centros_servicios_establecimientos_sanitarios',
    },
    farmacias: {
      t: 'Comunidad de Madrid · Recursos sanitarios: farmacias por municipio, 2025',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/farmacias',
    },
    educacion: {
      t: 'Comunidad de Madrid · Centros educativos (datos abiertos), centros públicos en alta',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/centros_educativos',
    },
    bibliotecas: {
      t: 'Comunidad de Madrid · Total bibliotecas públicas por municipio, 2025',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/701042',
    },
    sociales: {
      t: 'Comunidad de Madrid · Centros de servicios sociales por tipo y municipio, 2025',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/centros_servicios_sociales_por_tipo',
    },
    renta: {
      t: 'Comunidad de Madrid · Indicador de Renta Disponible Bruta Municipal, 2023',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/irpf_indicador_renta',
    },
    atencionSocial: {
      t: 'Comunidad de Madrid · Registro de centros de atención social (datos abiertos)',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/atencion_social_registro_centros',
    },
    teatros: {
      t: 'Red de Teatros de la Comunidad de Madrid · Ayuntamientos de Getafe y Parla',
      url: 'https://www.madrid.org/clas_artes/red/',
    },
  };

  /* ── Indicadores ─────────────────────────────────────────────────────── */
  const indicadores = [
    {
      id: 'metro',
      grupo: 'Transporte',
      titulo: 'Estaciones de Metro',
      sing: 'estación de Metro',
      plur: 'estaciones de Metro',
      forma: 'linea',
      fuente: F.metro,
      nota:
        'Parla no tiene Metro. Es el único municipio de más de 100.000 habitantes del sur ' +
        'metropolitano que se quedó fuera de MetroSur cuando la línea 12 se abrió en 2003.',
      datos: {
        getafe: {
          n: 8,
          lista: ['El Bercial', 'Los Espartales', 'El Casar', 'Juan de la Cierva',
                  'Getafe Central', 'Alonso de Mendoza', 'Conservatorio', 'Arroyo Culebro'],
        },
        parla: { n: 0, lista: [] },
      },
    },

    {
      id: 'cercanias',
      grupo: 'Transporte',
      titulo: 'Estaciones de Cercanías',
      sing: 'estación de Cercanías',
      plur: 'estaciones de Cercanías',
      forma: 'linea',
      fuente: F.cercanias,
      nota:
        'Parla tiene una sola estación de Cercanías, final de la línea C-4, para todo el municipio. ' +
        'Getafe tiene cinco repartidas entre las líneas C-3 y C-4.',
      datos: {
        getafe: {
          n: 5,
          lista: ['Getafe Centro (C-4)', 'Las Margaritas-Universidad (C-4)',
                  'Getafe Industrial (C-3)', 'El Casar (C-3)', 'Getafe Sector 3 (C-4)'],
        },
        parla: { n: 1, lista: ['Parla (C-4)'] },
      },
    },

    {
      id: 'farmacias',
      grupo: 'Sanidad',
      titulo: 'Oficinas de farmacia',
      sing: 'farmacia',
      plur: 'farmacias',
      forma: 'puntos',
      fuente: F.farmacias,
      nota:
        'La apertura de farmacias está planificada por la Comunidad de Madrid en función de la ' +
        'población, así que la diferencia por habitante no es casualidad: es reparto.',
      datos: {
        getafe: { n: 61, lista: [] },
        parla: { n: 28, lista: [] },
      },
    },

    {
      id: 'bibliotecas',
      grupo: 'Cultura',
      titulo: 'Bibliotecas públicas',
      sing: 'biblioteca pública',
      plur: 'bibliotecas públicas',
      forma: 'lista',
      fuente: F.bibliotecas,
      nota:
        'Getafe tiene una biblioteca central y cinco de barrio. Parla tiene dos para 137.471 personas.',
      datos: {
        getafe: {
          n: 6,
          lista: ['Ricardo de la Vega · Centro', 'José Luis Sampedro · Juan de la Cierva',
                  'Jorge Luis Borges · Sector III', 'Carmen Martín Gaite · El Bercial',
                  'Almudena Grandes · La Alhóndiga', 'Lorenzo Silva · Getafe Norte'],
        },
        parla: { n: 2, lista: ['Gloria Fuertes', 'Isaac Albéniz'] },
      },
    },

    {
      id: 'centros-salud',
      grupo: 'Sanidad',
      titulo: 'Centros de salud',
      sing: 'centro de salud',
      plur: 'centros de salud',
      forma: 'lista',
      fuente: F.sanitarios,
      nota:
        'Atención primaria del Servicio Madrileño de Salud. Parla abrió el centro de Parla Este ' +
        'en 2026 y aun así sigue por debajo de Getafe por habitante.',
      datos: {
        getafe: {
          n: 9,
          lista: ['Las Ciudades', 'Juan de la Cierva', 'Getafe Norte', 'Las Margaritas',
                  'El Greco', 'El Bercial', 'Perales del Río', 'Sánchez Morate', 'Sector III'],
        },
        parla: {
          n: 5,
          lista: ['Isabel II', 'Los Pintores', 'Las Américas', 'San Blas', 'Parla Este'],
        },
      },
    },

    {
      id: 'escuelas-infantiles',
      base: 'infantil',
      grupo: 'Educación',
      titulo: 'Escuelas infantiles públicas y casas de niños',
      sing: 'escuela infantil pública',
      plur: 'escuelas infantiles públicas',
      forma: 'lista',
      fuente: F.educacion,
      nota:
        'Centros públicos de 0 a 3 años y casas de niños, en alta en el registro autonómico. ' +
        'Se compara contra los niños de 0 a 2 años de cada ciudad, no contra la población total.',
      datos: {
        getafe: {
          n: 14,
          lista: ['Acuarela', 'Arcoíris', 'Arte', 'Cancionero', 'Casa de los Niños',
                  'Cascanueces', 'Casiopea', 'Colorines', 'El Duende', 'El Prado',
                  'La Luna', 'Mafalda', 'Marta Mata', 'Santa Madre Maravillas'],
        },
        parla: {
          n: 9,
          lista: ['El Bosque', 'El Limonero', 'El Manzano', 'El Naranjo', 'Los Abetos',
                  'Momo', 'Pilocha', 'Tris-Tras', 'Zarabanda'],
        },
      },
    },

    {
      id: 'universidad',
      grupo: 'Educación',
      titulo: 'Universidad pública',
      sing: 'campus universitario público',
      plur: 'campus universitarios públicos',
      forma: 'lista',
      fuente: F.educacion,
      nota:
        'En Parla no hay universidad. Estudiar una carrera pública sin salir de tu ciudad no es ' +
        'una comodidad: es dinero, tiempo y probabilidad de terminarla.',
      datos: {
        getafe: { n: 1, lista: ['Universidad Carlos III · Campus de Getafe'] },
        parla: { n: 0, lista: [] },
      },
    },

    {
      id: 'conservatorio',
      grupo: 'Educación',
      titulo: 'Conservatorio profesional de música',
      sing: 'conservatorio profesional',
      plur: 'conservatorios profesionales',
      forma: 'lista',
      fuente: F.educacion,
      nota:
        'Parla tiene escuela municipal de música, pero no conservatorio profesional: las enseñanzas ' +
        'regladas que dan titulación oficial hay que ir a buscarlas fuera.',
      datos: {
        getafe: { n: 1, lista: ['Conservatorio Profesional de Música de Getafe'] },
        parla: { n: 0, lista: [] },
      },
    },

    {
      id: 'institutos',
      base: 'secundaria',
      grupo: 'Educación',
      titulo: 'Institutos públicos de secundaria',
      sing: 'instituto público',
      plur: 'institutos públicos',
      forma: 'lista',
      fuente: F.educacion,
      nota:
        'El tramo más sangrante. Parla tiene casi tantos adolescentes como Getafe —11.919 frente a ' +
        '12.760, un 93 %— y cuatro institutos públicos menos. Es la comparación en la que la ' +
        'estructura de edad más cambia el resultado.',
      datos: {
        getafe: {
          n: 13,
          lista: ['Alarnes', 'Altaír', 'Antonio López García', 'Elisa Soriano Fischer', 'Ícaro',
                  'Ignacio Aldecoa', 'José Hierro', 'La Senda', 'Laguna de Joatzel', 'León Felipe',
                  'Matemático Puig Adam', 'Menéndez Pelayo', 'Satafi'],
        },
        parla: {
          n: 9,
          lista: ['El Olivo', 'Enrique Tierno Galván', 'Humanejos', 'José Pedro Pérez Llorca',
                  'La Laguna', 'Las Américas', 'Manuel Elkin Patarroyo', 'Narcís Monturiol',
                  'Nicolás Copérnico'],
        },
      },
    },

    {
      id: 'plazas-residencia',
      base: 'mayores',
      enTotal: false,
      grupo: 'Servicios sociales',
      titulo: 'Plazas en residencias públicas de mayores',
      sing: 'plaza residencial pública',
      plur: 'plazas residenciales públicas',
      forma: 'puntos',
      fuente: F.atencionSocial,
      nota:
        'Aquí no se cuentan centros, se cuentan camas, que es lo que de verdad se ocupa. Solo ' +
        'residencias de titularidad pública: Getafe tiene dos y Parla una. Contando también las ' +
        'privadas, Getafe suma 843 plazas en 7 centros y Parla 493 en 5, pero esas plazas se pagan. ' +
        'Este apartado se mide en plazas, no en equipamientos, así que no suma al recuento de la portada.',
      datos: {
        getafe: {
          n: 134,
          lista: ['Residencia de Personas Mayores de Getafe · 64 plazas · gestión directa',
                  'Getafe Alzheimer · 70 plazas · gestión indirecta'],
        },
        parla: {
          n: 64,
          lista: ['Residencia de Personas Mayores de Parla · 64 plazas · gestión directa'],
        },
      },
    },

    {
      id: 'colegios',
      base: 'primaria',
      grupo: 'Educación',
      titulo: 'Colegios públicos de infantil y primaria',
      sing: 'colegio público',
      plur: 'colegios públicos',
      forma: 'lista',
      fuente: F.educacion,
      nota:
        'Medido sobre la población total, Parla saldría ganando. Medido sobre los niños que tienen ' +
        'edad de ir al colegio, que es lo que importa, sale perdiendo: Parla tiene un 80 % de los ' +
        'niños de 3 a 11 años de Getafe y solo un 76 % de sus colegios públicos.',
      datos: {
        getafe: {
          n: 29,
          lista: ['Ana María Matute', 'Ciudad de Getafe', 'Ciudad de Madrid', 'Concepción Arenal',
                  'Daoiz y Velarde', 'Doctor Severo Ochoa', 'El Bercial', 'Emperador Carlos V',
                  'Enrique Tierno Galván', 'Fernando de los Ríos', 'Francisco de Quevedo',
                  'Gabriel García Márquez', 'Gloria Fuertes', 'Jorge Guillén', 'Julián Besteiro',
                  'Julio Cortázar', 'La Alhóndiga', 'Manuel Núñez de Arenas', 'María Blanchard',
                  'Mariana Pineda', 'Miguel de Cervantes', 'Miguel Hernández', 'Ortiz Echagüe',
                  'Rosalía de Castro', 'Sagrado Corazón', 'San José de Calasanz',
                  'Santa Margarita María Alacoque', 'Seseña y Benavente', 'Vicente Ferrer'],
        },
        parla: {
          n: 22,
          lista: ['Antonio Machado', 'Blas de Lezo', 'Ciudad de Mérida', 'Ciudad de Parla',
                  'Clara Campoamor', 'Gerardo Diego', 'Giner de los Ríos', 'José Hierro',
                  'Julián Besteiro', 'La Paloma', 'Los Lagos', 'Luis Vives',
                  'Madre Teresa de Calcuta', 'Magerit', 'María Moliner', 'Miguel Delibes',
                  'Miguel Hernández', 'Pablo Picasso', 'Rosa Luxemburgo', 'Rosa Montero',
                  'Séneca', 'Virgen del Carmen'],
        },
      },
    },

    {
      id: 'teatros',
      grupo: 'Cultura',
      titulo: 'Teatros y espacios escénicos municipales',
      sing: 'teatro municipal',
      plur: 'teatros municipales',
      forma: 'lista',
      fuente: F.teatros,
      nota: 'Dos y dos, así que por habitante Parla sale ligeramente mejor.',
      datos: {
        getafe: { n: 2, lista: ['Teatro Federico García Lorca', 'Espacio Mercado'] },
        parla: { n: 2, lista: ['Teatro Jaime Salom', 'Teatro Dulce Chacón'] },
      },
    },

    {
      id: 'centros-sociales',
      grupo: 'Servicios sociales',
      titulo: 'Centros de servicios sociales',
      sing: 'centro de servicios sociales',
      plur: 'centros de servicios sociales',
      forma: 'puntos',
      fuente: F.sociales,
      nota:
        'Registro autonómico completo: mayores, discapacidad, infancia, mujer y otros colectivos, ' +
        'de titularidad pública y privada.',
      datos: {
        getafe: { n: 53, lista: [] },
        parla: { n: 39, lista: [] },
      },
    },

    {
      id: 'tranvia',
      grupo: 'Transporte',
      titulo: 'Paradas de tranvía',
      sing: 'parada de tranvía',
      plur: 'paradas de tranvía',
      forma: 'puntos',
      fuente: F.tranvia,
      nota:
        'Parla sí tiene lo que Getafe no: un tranvía, el ML-4, con 15 paradas. Es una línea ' +
        'circular que no sale del municipio, y su construcción dejó al ayuntamiento una deuda de ' +
        'unos 256 millones de euros.',
      datos: {
        getafe: { n: 0, lista: [] },
        parla: { n: 15, lista: [] },
      },
    },
  ];

  /* ── El hospital: comparación de cartera, no de recuento ─────────────── */
  const hospital = {
    titulo: 'El hospital',
    getafe: { nombre: 'Hospital Universitario de Getafe', unidades: 74 },
    parla: { nombre: 'Hospital Universitario Infanta Cristina', unidades: 54 },
    faltan: [
      'Quemados',
      'Neurocirugía',
      'Hemodinámica',
      'Cuidados intensivos neonatales',
      'Cirugía torácica',
      'Angiología y Cirugía Vascular',
      'Cirugía plástica y reparadora',
      'Medicina nuclear',
      'Neurofisiología',
      'Genética',
      'Banco de tejidos',
      'Inseminación artificial',
      'Laboratorio de semen para capacitación espermática',
      'Planificación familiar',
      'Logopedia',
      'Foniatría',
      'Odontología/Estomatología',
      'Vacunación',
      'Laboratorio clínico',
      'Otras unidades asistenciales',
    ],
    fuente: F.sanitarios,
    cautela:
      'Son las unidades asistenciales que el Registro de Centros de la Comunidad de Madrid tiene ' +
      'declaradas en el hospital de Getafe y no en el de Parla. Ninguna está declarada al revés: ' +
      'la cartera de Parla es un subconjunto exacto de la de Getafe. Algunas diferencias menores ' +
      'pueden deberse a cómo declara cada centro sus servicios.',
  };

  /* ── Contexto económico ──────────────────────────────────────────────── */
  const contexto = {
    renta: {
      titulo: 'Renta disponible bruta por habitante',
      unidad: '€',
      anio: 2023,
      valores: { getafe: 19413, parla: 13534, madrid: 23159 },
      fuente: F.renta,
      nota:
        'Parla vive con el 58,4 % de la renta media de la Comunidad de Madrid. Getafe, con el 83,8 %. ' +
        'Menos servicios públicos donde menos dinero hay para pagárselos por fuera.',
    },
  };

  /* Estructura de edad: por qué no vale comparar colegios por habitante */
  contexto.edades = {
    titulo: 'Y no tienen la misma edad',
    total: { getafe: 195628, parla: 138012 },
    tramos: [
      { etiqueta: '0 a 2 años', getafe: 4497, parla: 3315 },
      { etiqueta: '3 a 11 años', getafe: 17671, parla: 14212 },
      { etiqueta: '12 a 17 años', getafe: 12760, parla: 11919 },
      { etiqueta: '65 años o más', getafe: 38119, parla: 19323 },
    ],
    fuente: F.edades,
    nota:
      'Parla tiene un 29 % menos de población que Getafe, pero solo un 7 % menos de adolescentes ' +
      'y la mitad de personas mayores. Por eso los colegios, los institutos y las escuelas ' +
      'infantiles no se comparan aquí por habitante, sino contra los niños que tienen esa edad. ' +
      'Con la población total, Parla saldría mejor de lo que está.',
  };

  const pendientes = [
    'Instalaciones deportivas municipales',
    'Zonas verdes por habitante',
    'Plantilla de Policía Local',
    'Tarjetas sanitarias por médico de familia',
    'Frecuencia real del transporte a Madrid',
  ];

  return {
    ACTUALIZADO, POBLACIONES, MUNICIPIOS, BASES,
    referencia: 'parla',
    indicadores, hospital, contexto, pendientes,
    fuentes: F,
  };
})();

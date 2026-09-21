/* ─────────────────────────────────────────────────────────────────────────
   SI YO VIVIERA COMO EN PARLA · datos
   ─────────────────────────────────────────────────────────────────────────
   Este archivo es el único sitio donde hay que tocar para actualizar la web.
   Todas las cifras proceden de fuentes oficiales, y cada indicador lleva
   enlazada la suya en la propia página.

   Poblaciones totales: INE, cifras oficiales del Padrón a 1-1-2025.
   Tramos de edad:      INE, población por edad año a año a 1-1-2025.
   Equipamientos:       registros oficiales de la Comunidad de Madrid,
                        Metro de Madrid, Renfe Cercanías y CRTM.
   ───────────────────────────────────────────────────────────────────────── */

window.DATOS = (function () {
  const ACTUALIZADO = 'septiembre de 2026';
  const REFERENCIA = 'parla';

  const MUNICIPIOS = [
    { id: 'getafe', nombre: 'Getafe', activo: true },
    { id: 'parla', nombre: 'Parla', activo: true },
    { id: 'pinto', nombre: 'Pinto', activo: true },
    { id: 'fuenlabrada', nombre: 'Fuenlabrada', activo: true },
    { id: 'leganes', nombre: 'Leganés', activo: true },
    { id: 'alcorcon', nombre: 'Alcorcón', activo: true },
    { id: 'alcobendas', nombre: 'Alcobendas', activo: true },
    { id: 'mostoles', nombre: 'Móstoles', activo: true }
  ];

  /* Contra qué población se mide cada indicador. Un colegio no se mide contra
     los habitantes de una ciudad, sino contra los niños que tienen edad de ir. */
  const BASES = {
    total: {
      etiqueta: 'habitantes',
      corto: 'población total',
      por: 100000,
      fuenteId: 'ine',
      valores: {
        getafe: 193238,
        parla: 137471,
        pinto: 56651,
        fuenlabrada: 190076,
        leganes: 195734,
        alcorcon: 175719,
        alcobendas: 123342,
        mostoles: 214817
      }
    },
    infantil: {
      etiqueta: 'niños y niñas de 0 a 2 años',
      corto: 'población de 0 a 2 años',
      por: 10000,
      fuenteId: 'edades',
      valores: {
        getafe: 4497,
        parla: 3315,
        pinto: 1278,
        fuenlabrada: 3634,
        leganes: 3573,
        alcorcon: 3226,
        alcobendas: 2631,
        mostoles: 4219
      }
    },
    primaria: {
      etiqueta: 'niños y niñas de 3 a 11 años',
      corto: 'población de 3 a 11 años',
      por: 10000,
      fuenteId: 'edades',
      valores: {
        getafe: 17671,
        parla: 14212,
        pinto: 5322,
        fuenlabrada: 14531,
        leganes: 14771,
        alcorcon: 13351,
        alcobendas: 10914,
        mostoles: 17039
      }
    },
    secundaria: {
      etiqueta: 'chicos y chicas de 12 a 17 años',
      corto: 'población de 12 a 17 años',
      por: 10000,
      fuenteId: 'edades',
      valores: {
        getafe: 12760,
        parla: 11919,
        pinto: 4456,
        fuenlabrada: 12772,
        leganes: 12991,
        alcorcon: 11288,
        alcobendas: 9160,
        mostoles: 12992
      }
    },
    mayores: {
      etiqueta: 'personas de 65 años o más',
      corto: 'población de 65 años o más',
      por: 10000,
      fuenteId: 'edades',
      valores: {
        getafe: 38119,
        parla: 19323,
        pinto: 8130,
        fuenlabrada: 36611,
        leganes: 44465,
        alcorcon: 40010,
        alcobendas: 21998,
        mostoles: 49845
      }
    }
  };

  const F = {
    ine: {
      t: 'INE · Cifras oficiales de población de los municipios españoles, 1 enero 2025',
      url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=2881'
    },
    edades: {
      t: 'INE · Población por sexo, edad año a año y nacionalidad, 1 enero 2025',
      url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=68543'
    },
    metro: {
      t: 'Metro de Madrid · Línea 12 (MetroSur)',
      url: 'https://www.comunidad.madrid/transporte/linea-12-metrosur-metro-madrid'
    },
    cercanias: {
      t: 'Renfe Cercanías Madrid · líneas C-3, C-4 y C-5',
      url: 'https://www.renfe.com/es/es/cercanias/cercanias-madrid'
    },
    tranvia: {
      t: 'Consorcio Regional de Transportes de Madrid · Metro Ligero ML-4',
      url: 'https://www.crtm.es/tu-transporte-publico/metro-ligero/'
    },
    sanitarios: {
      t: 'Comunidad de Madrid · Registro de centros, servicios y establecimientos sanitarios',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/centros_servicios_establecimientos_sanitarios'
    },
    farmacias: {
      t: 'Comunidad de Madrid · Recursos sanitarios: farmacias por municipio, 2025',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/farmacias'
    },
    educacion: {
      t: 'Comunidad de Madrid · Centros educativos, centros públicos en alta',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/centros_educativos'
    },
    universidades: {
      t: 'Universidad Carlos III y Universidad Rey Juan Carlos · campus oficiales',
      url: 'https://www.urjc.es/universidad/campus'
    },
    bibliotecas: {
      t: 'Comunidad de Madrid · Total bibliotecas públicas por municipio, 2025',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/701042'
    },
    atencionSocial: {
      t: 'Comunidad de Madrid · Registro de centros de atención social',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/atencion_social_registro_centros'
    },
    renta: {
      t: 'Comunidad de Madrid · Indicador de Renta Disponible Bruta Municipal, 2023',
      url: 'https://datos.comunidad.madrid/catalogo/dataset/irpf_indicador_renta'
    },
    camas: {
      t: 'Ministerio de Sanidad · Catálogo Nacional de Hospitales 2025, camas instaladas',
      url: 'https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/home.htm'
    }
  };

  const indicadores = [
    {
      id: 'metro',
      sing: 'estación de Metro',
      gen: 'f',
      base: 'total',
      grupo: 'Transporte',
      titulo: 'Estaciones de Metro',
      fuenteId: 'metro',
      nota: 'La línea 12 (MetroSur) abrió en 2003 rodeando Alcorcón, Móstoles, Fuenlabrada, Leganés y Getafe. Parla se quedó fuera del trazado y sigue sin Metro.',
      datos: {
        getafe: {
          n: 8,
          lista: [
            'El Bercial', 'Los Espartales', 'El Casar', 'Juan de la Cierva', 'Getafe Central',
            'Alonso de Mendoza', 'Conservatorio', 'Arroyo Culebro'
          ]
        },
        parla: { n: 0, lista: [] },
        pinto: { n: 0, lista: [] },
        fuenlabrada: {
          n: 5,
          lista: [
            'Loranca', 'Hospital de Fuenlabrada', 'Parque Europa', 'Fuenlabrada Central',
            'Parque de los Estados'
          ]
        },
        leganes: {
          n: 6,
          lista: [
            'El Carrascal', 'Julián Besteiro', 'Casa del Reloj', 'Hospital Severo Ochoa',
            'Leganés Central', 'San Nicasio'
          ]
        },
        alcorcon: { n: 4, lista: ['Puerta del Sur', 'Parque Lisboa', 'Alcorcón Central', 'Parque Oeste'] },
        alcobendas: {
          n: 5,
          lista: ['La Granja', 'La Moraleja', 'Marqués de la Valdavia', 'Manuel de Falla', 'Baunatal']
        },
        mostoles: {
          n: 5,
          lista: [
            'Universidad Rey Juan Carlos', 'Móstoles Central', 'Pradillo',
            'Hospital de Móstoles', 'Manuela Malasaña'
          ]
        }
      }
    },

    {
      id: 'cercanias',
      sing: 'estación de Cercanías',
      gen: 'f',
      base: 'total',
      grupo: 'Transporte',
      titulo: 'Estaciones de Cercanías',
      fuenteId: 'cercanias',
      nota: 'Una sola estación para todo el municipio, y además es final de línea de la C-4.',
      datos: {
        getafe: {
          n: 5,
          lista: [
            'Getafe Centro (C-4)', 'Las Margaritas-Universidad (C-4)',
            'Getafe Industrial (C-3)', 'El Casar (C-3)', 'Getafe Sector 3 (C-4)'
          ]
        },
        parla: { n: 1, lista: ['Parla (C-4)'] },
        pinto: { n: 1, lista: ['Pinto (C-3)'] },
        fuenlabrada: { n: 2, lista: ['Fuenlabrada (C-5)', 'La Serna (C-5)'] },
        leganes: { n: 3, lista: ['Leganés (C-5)', 'Zarzaquemada (C-5)', 'Parque Polvoranca (C-5)'] },
        alcorcon: { n: 3, lista: ['Alcorcón (C-5)', 'San José de Valderas (C-5)', 'Las Retamas (C-5)'] },
        alcobendas: {
          n: 2,
          lista: ['Alcobendas-San Sebastián de los Reyes (C-4)', 'Valdelasfuentes (C-4)']
        },
        mostoles: { n: 2, lista: ['Móstoles (C-5)', 'Móstoles-El Soto (C-5)'] }
      }
    },

    {
      id: 'farmacias',
      sing: 'farmacia',
      gen: 'f',
      base: 'total',
      grupo: 'Sanidad',
      titulo: 'Oficinas de farmacia',
      fuenteId: 'farmacias',
      nota: 'La Comunidad de Madrid planifica la apertura de oficinas de farmacia con módulos de población por zona farmacéutica.',
      datos: {
        getafe: { n: 61, lista: [] },
        parla: { n: 28, lista: [] },
        pinto: { n: 17, lista: [] },
        fuenlabrada: { n: 65, lista: [] },
        leganes: { n: 68, lista: [] },
        alcorcon: { n: 69, lista: [] },
        alcobendas: { n: 37, lista: [] },
        mostoles: { n: 73, lista: [] }
      }
    },

    {
      id: 'bibliotecas',
      sing: 'biblioteca pública',
      gen: 'f',
      base: 'total',
      grupo: 'Cultura',
      titulo: 'Bibliotecas públicas',
      fuenteId: 'bibliotecas',
      nota: 'Dos bibliotecas públicas para 137.471 habitantes. Es la ratio más baja de los {N} municipios comparados aquí.',
      datos: {
        getafe: {
          n: 6,
          lista: [
            'Ricardo de la Vega · Centro', 'José Luis Sampedro · Juan de la Cierva',
            'Jorge Luis Borges · Sector III', 'Carmen Martín Gaite · El Bercial',
            'Almudena Grandes · La Alhóndiga', 'Lorenzo Silva · Getafe Norte'
          ]
        },
        parla: { n: 2, lista: ['Gloria Fuertes', 'Isaac Albéniz'] },
        pinto: { n: 2, lista: ['Casa de la Cadena', 'Javier Lapeña'] },
        fuenlabrada: {
          n: 7,
          lista: [
            'Tomás y Valiente', 'Antonio Machado', 'El Arroyo', 'Fernando de los Ríos',
            'José Manuel Caballero Bonald', 'Parque de la Paz', 'Loranca'
          ]
        },
        leganes: {
          n: 6,
          lista: [
            'Biblioteca Central', 'Julio Caro Baroja', 'Centro Cultural Julián Besteiro',
            'Enrique Tierno Galván', 'Rigoberta Menchú', 'Santiago Amón'
          ]
        },
        alcorcon: {
          n: 7,
          lista: [
            'José Hierro', 'Ciudad de Nejapa', 'Almudena Grandes', 'Alcalde Jesús Salvador',
            'Joaquín Vilumbrales', 'Fuente Cisneros', 'Miguel Delibes'
          ]
        },
        alcobendas: { n: 4, lista: ['Anabel Segura', 'Centro de Arte', 'Miguel Delibes', 'Pablo Iglesias'] },
        mostoles: {
          n: 6,
          lista: [
            'Almudena Grandes', 'Norte-Universidad', 'Parque Coimbra', 'El Soto', 'Joan Miró',
            'Caleidoscopio'
          ]
        }
      }
    },

    {
      id: 'centros-salud',
      sing: 'centro de salud',
      gen: 'm',
      base: 'total',
      grupo: 'Sanidad',
      titulo: 'Centros de salud',
      fuenteId: 'sanitarios',
      nota: 'Atención primaria del Servicio Madrileño de Salud. Parla abrió el centro de Parla Este en 2026 y sigue a la cola por habitante.',
      datos: {
        getafe: {
          n: 9,
          lista: [
            'Las Ciudades', 'Juan de la Cierva', 'Getafe Norte', 'Las Margaritas', 'El Greco',
            'El Bercial', 'Perales del Río', 'Sánchez Morate', 'Sector III'
          ]
        },
        parla: { n: 5, lista: ['Isabel II', 'Los Pintores', 'Las Américas', 'San Blas', 'Parla Este'] },
        pinto: { n: 2, lista: ['Pinto', 'Parque Europa'] },
        fuenlabrada: {
          n: 7,
          lista: [
            'Alicante', 'Castilla la Nueva', 'Cuzco', 'Francia', 'Panaderas', 'Parque Loranca',
            'El Naranjo'
          ]
        },
        leganes: {
          n: 9,
          lista: [
            'Doctor Mendiguchía Carriche', 'Huerta de los Frailes', 'Jaime Vera',
            'Leganés Norte', 'María Ángeles López Gómez', 'María Jesús Hereza',
            'María Montessori', 'Marie Curie · La Fortuna', 'Santa Isabel'
          ]
        },
        alcorcon: {
          n: 8,
          lista: [
            'Ramón y Cajal', 'Gregorio Marañón', 'Miguel Servet', 'Los Castillos',
            'Doctor Pedro Laín Entralgo', 'Doctor Trueta', 'La Rivota', 'Parque Oeste'
          ]
        },
        alcobendas: {
          n: 5,
          lista: [
            'Arroyo de la Vega', 'La Chopera', 'Marqués de la Valdavia', 'Miraflores',
            'Valdelasfuentes'
          ]
        },
        mostoles: {
          n: 10,
          lista: [
            'Alcalde Bartolomé González', 'Barcelona', 'Doctor Luengo Rodríguez', 'Dos de Mayo',
            'El Soto', 'Enfermera Carmen Vázquez', 'Felipe II', 'La Princesa', 'Parque Coimbra',
            'Presentación Sabio'
          ]
        }
      }
    },

    {
      id: 'camas',
      sing: 'cama de hospital público',
      gen: 'f',
      base: 'total',
      enTotal: false,
      grupo: 'Sanidad',
      titulo: 'Camas de hospital público',
      fuenteId: 'camas',
      nota: 'Camas instaladas en los hospitales públicos generales del municipio. Se dividen entre sus habitantes, aunque cada hospital atiende también a municipios vecinos. En los dos casos en que la Comunidad de Madrid publica la cobertura sale casi lo mismo: el de Parla atiende a ocho municipios y 182.030 personas, el de Getafe a dos y 249.889. Quedan fuera los hospitales privados y los psiquiátricos. Al medirse en camas, esto no suma al recuento de la portada.',
      datos: {
        getafe: { n: 543, lista: ['Hospital Universitario de Getafe · 543 camas'] },
        parla: { n: 188, lista: ['Hospital Universitario Infanta Cristina · 188 camas'] },
        pinto: { n: 0, lista: [] },
        fuenlabrada: { n: 413, lista: ['Hospital Universitario de Fuenlabrada · 413 camas'] },
        leganes: { n: 386, lista: ['Hospital Universitario Severo Ochoa · 386 camas'] },
        alcorcon: { n: 401, lista: ['Hospital Universitario Fundación Alcorcón · 401 camas'] },
        alcobendas: { n: 0, lista: [] },
        mostoles: {
          n: 690,
          lista: [
            'Hospital Universitario de Móstoles · 328 camas',
            'Hospital Universitario Rey Juan Carlos · 362 camas'
          ]
        }
      }
    },

    {
      id: 'escuelas-infantiles',
      sing: 'escuela infantil pública',
      gen: 'f',
      base: 'infantil',
      grupo: 'Educación',
      titulo: 'Escuelas infantiles públicas y casas de niños',
      fuenteId: 'educacion',
      nota: 'Centros públicos de 0 a 3 años. Se comparan contra los niños de 0 a 2 años de cada ciudad, no contra la población total.',
      datos: {
        getafe: {
          n: 14,
          lista: [
            'Acuarela', 'Arcoíris', 'Arte', 'Cancionero', 'Casa de los Niños', 'Cascanueces',
            'Casiopea', 'Colorines', 'El Duende', 'El Prado', 'La Luna', 'Mafalda',
            'Marta Mata', 'Santa Madre Maravillas'
          ]
        },
        parla: {
          n: 9,
          lista: [
            'El Bosque', 'El Limonero', 'El Manzano', 'El Naranjo', 'Los Abetos', 'Momo',
            'Pilocha', 'Tris-Tras', 'Zarabanda'
          ]
        },
        pinto: {
          n: 5,
          lista: ['Pimpollitos', 'Tragaluz', 'Triángulo', 'Trébol', 'Virgen de la Asunción']
        },
        fuenlabrada: {
          n: 16,
          lista: [
            'El Bonsái', 'El Cocherito Leré', 'El Escondite', 'El Lago', 'El Molino',
            'El Naranjo', 'El Sacapuntas', 'Gallipatos', 'La Alameda', 'La Linterna Mágica',
            'La Mimosa', 'La Piñata', 'Las Cigüeñas', 'Los Gorriones', 'Pablo Picasso',
            'Valle de Ordesa'
          ]
        },
        leganes: {
          n: 18,
          lista: [
            'Aventuras', 'Burbujas', 'Dulcinea', 'El Cuco', 'El Romancero', 'Fortuna',
            'Jeromín', 'Koala', 'La Comba', 'La Noria', 'Las Flores de la Fortuna',
            'Lope de Vega', 'Los Pinos', 'Pandora', 'Primeros Pasos', 'Rincón Infantil',
            'Rosa Caramelo', 'Valle Inclán'
          ]
        },
        alcorcon: {
          n: 15,
          lista: [
            'Adivinanzas', 'Andersen', 'Arco Iris', 'Campanilla', 'El Corro de la Patata',
            'Gloria Fuertes', 'La Princesa', 'Las Flores', 'Los Pingüinos',
            'Los Pinos de Maeve', 'Mago de Oz', 'Nanas', 'Rodari', 'Sol y Luna', 'Sueños'
          ]
        },
        alcobendas: {
          n: 6,
          lista: ['Cascabeles', 'El Cuquillo', 'Fuentelucha', 'La Chopera', 'Pío Pío', 'Valdelaparra']
        },
        mostoles: {
          n: 12,
          lista: [
            'Antusana', 'Caleidoscopio', 'Colores', 'El Columpio', 'El Juglar',
            'El Pequeño Sauce', 'El Soto', 'Fabulas y Leyendas', 'Joan Miró', 'Osa Mayor',
            'Parque Coimbra', 'Villaamil'
          ]
        }
      }
    },

    {
      id: 'colegios',
      sing: 'colegio público',
      gen: 'm',
      base: 'primaria',
      grupo: 'Educación',
      titulo: 'Colegios públicos de infantil y primaria',
      fuenteId: 'educacion',
      nota: 'Con la población total como divisor, Parla saldría bien parada. Al dividir entre los niños en edad escolar deja de estarlo, porque es el municipio más joven de los {N}.',
      datos: {
        getafe: {
          n: 29,
          lista: [
            'Ana María Matute', 'Ciudad de Getafe', 'Ciudad de Madrid', 'Concepción Arenal',
            'Daoiz y Velarde', 'Doctor Severo Ochoa', 'El Bercial', 'Emperador Carlos V',
            'Enrique Tierno Galván', 'Fernando de los Ríos', 'Francisco de Quevedo',
            'Gabriel García Márquez', 'Gloria Fuertes', 'Jorge Guillén', 'Julio Cortázar',
            'Julián Besteiro', 'La Alhóndiga', 'Manuel Núñez de Arenas', 'Mariana Pineda',
            'María Blanchard', 'Miguel Hernández', 'Miguel de Cervantes', 'Ortiz Echagüe',
            'Rosalía de Castro', 'Sagrado Corazón', 'San José de Calasanz',
            'Santa Margarita María Alacoque', 'Seseña y Benavente', 'Vicente Ferrer'
          ]
        },
        parla: {
          n: 22,
          lista: [
            'Antonio Machado', 'Blas de Lezo', 'Ciudad de Mérida', 'Ciudad de Parla',
            'Clara Campoamor', 'Gerardo Diego', 'Giner de los Ríos', 'José Hierro',
            'Julián Besteiro', 'La Paloma', 'Los Lagos', 'Luis Vives',
            'Madre Teresa de Calcuta', 'Magerit', 'María Moliner', 'Miguel Delibes',
            'Miguel Hernández', 'Pablo Picasso', 'Rosa Luxemburgo', 'Rosa Montero', 'Séneca',
            'Virgen del Carmen'
          ]
        },
        pinto: {
          n: 6,
          lista: [
            'Buenos Aires', 'Dos de Mayo', 'El Prado', 'Europa', 'Isabel la Católica',
            'Las Artes'
          ]
        },
        fuenlabrada: {
          n: 37,
          lista: [
            'Andrés Manjón', 'Antonio Machado', 'Arcipreste de Hita', 'Aula 3',
            'Benito Pérez Galdós', 'Carlos Cano', 'Cervantes', 'Clara Campoamor',
            'Dulce Chacón', 'El Trigal', 'Enrique Tierno Galván', 'Francisco de Goya',
            'Francisco de Quevedo', 'Fregacedos', 'Giner de los Ríos', 'Green Peace',
            'John Lennon', 'Juan de la Cierva', 'La Cañada', 'León Felipe', 'Lope de Vega',
            'Loranca', 'Maestra Trinidad García', 'Manuel de Falla', 'Manuela Malasaña',
            'Miguel Hernández', 'Pablo Neruda', 'Poetisa Celia Viñas', 'Rayuela',
            'Rosalía de Castro', 'Salvador Dalí', 'San Esteban', 'Santiago Ramón y Cajal',
            'Velázquez', 'Vicente Blasco Ibáñez', 'Víctor Jara', 'Yvonne Blake'
          ]
        },
        leganes: {
          n: 33,
          lista: [
            'Aben Hazam', 'Andrés Segovia', 'Antonio Machado', 'Calderón de la Barca',
            'Carmen Conde', 'Concepción Arenal', 'Constitución de 1812',
            'Federico García Lorca', 'Francisco de Quevedo', 'Gabriela Morreale',
            'Gerardo Diego', 'Giner de los Ríos', 'Gonzalo de Berceo', 'Jacinto Benavente',
            'Joan Miró', 'José María de Pereda', 'Juan de Austria', 'Lepanto', 'León Felipe',
            'Lope de Vega', 'Luis de Góngora', 'Manuel Vázquez Montalbán', 'Marqués de Leganés',
            'Miguel Delibes', 'Miguel Hernández', 'Miguel de Cervantes', 'Ortega y Gasset',
            'Pardo Bazán', 'Pérez Galdós', 'Pío Baroja', 'Trabenco', 'Víctor Pradera',
            'Ángel González'
          ]
        },
        alcorcon: {
          n: 23,
          lista: [
            'Agustín de Argüelles', 'Bellas Vistas', 'Blas de Otero', 'Carmen Conde',
            'Chaves Nogales', 'Clara Campoamor', 'Claudio Sánchez Albornoz', 'Daniel Martín',
            'Federico García Lorca', 'Fernando de los Ríos', 'Fuente del Palomar',
            'Isabel la Católica', 'Jesús Varela', 'Joaquín Costa', 'Los Castillos',
            'Miguel Hernández', 'Miguel de Cervantes', 'Parque de Lisboa',
            'Párroco D. Víctoriano', 'San José de Valderas', 'Santiago Ramón y Cajal',
            'Santo Domingo', 'Vicente Aleixandre'
          ]
        },
        alcobendas: {
          n: 14,
          lista: [
            'Antonio Machado', 'Bachiller Alonso López', 'Castilla', 'Daoiz y Velarde',
            'Emilio Casado', 'Federico García Lorca', 'Gabriel y Galan', 'Luis Buñuel',
            'Miguel Hernández', 'Miraflores', 'Parque de Cataluña', 'Profesor Tierno Galván',
            'Seis de Diciembre', 'Valdepalitos'
          ]
        },
        mostoles: {
          n: 36,
          lista: [
            'Alfonso R. Castelao', 'Alonso Cano', 'Andrés Segovia', 'Andrés Torrejon',
            'Antonio Hernández', 'Antusana', 'Beato Simón de Rojas', 'Benito Pérez Galdós',
            'Blas de Otero', 'Celso Emilio Ferreiro', 'Ciudad de Roma', 'Federico García Lorca',
            'Gabriel Celaya', 'Joan Miró', 'Jorge Guillén', 'Juan Ocaña',
            'Juan Pérez Villaamil', 'Julián Besteiro', 'Las Cumbres', 'Leonardo Da Vinci',
            'León Felipe', 'Luis Álvarez Lencero', 'Margarita Xirgu', 'Maruja Mallo',
            'María Montessori', 'Miguel Delibes', 'Pablo Sarasate', 'Pablo Sorozabal',
            'Principe de Asturias', 'Pío Baroja', 'Rafael Alberti', 'Rio Bidasoa',
            'Rosalía de Castro', 'Salzillo-valle Inclán', 'Severo Ochoa', 'Vicente Aleixandre'
          ]
        }
      }
    },

    {
      id: 'institutos',
      sing: 'instituto público',
      gen: 'm',
      base: 'secundaria',
      grupo: 'Educación',
      titulo: 'Institutos públicos de secundaria',
      fuenteId: 'educacion',
      nota: 'Es la mayor diferencia de los tres tramos educativos. Parla tiene 11.919 chicos y chicas de 12 a 17 años, casi los mismos que Leganés (12.991), que tiene 58.000 habitantes más.',
      datos: {
        getafe: {
          n: 13,
          lista: [
            'Alarnes', 'Altaír', 'Antonio López García', 'Elisa Soriano Fischer',
            'Ignacio Aldecoa', 'José Hierro', 'La Senda', 'Laguna de Joatzel', 'León Felipe',
            'Matemático Puig Adam', 'Menéndez Pelayo', 'Satafi', 'Ícaro'
          ]
        },
        parla: {
          n: 9,
          lista: [
            'El Olivo', 'Enrique Tierno Galván', 'Humanejos', 'José Pedro Pérez Llorca',
            'La Laguna', 'Las Américas', 'Manuel Elkin Patarroyo', 'Narcís Monturiol',
            'Nicolás Copérnico'
          ]
        },
        pinto: { n: 3, lista: ['Calderón de la Barca', 'Pablo Picasso', 'Vicente Aleixandre'] },
        fuenlabrada: {
          n: 13,
          lista: [
            'Barrio Loranca', 'Carpe Diem', 'Dionisio Aguado', 'Dolores Ibárruri',
            'Gaspar Melchor de Jovellanos', 'Jimena Menéndez Pidal', 'Joaquín Araujo',
            'José Luis López Aranguren', 'Julio Caro Baroja', 'La Serna', 'Salvador Allende',
            'Victoria Kent', 'África'
          ]
        },
        leganes: {
          n: 16,
          lista: [
            'Arquitecto Peridis', 'Butarque', 'Enrique Tierno Galván', 'Gabriel García Márquez',
            'Isaac Albéniz', 'José de Churriguera', 'Julio Verne', 'La Fortuna', 'Luis Vives',
            'María Zambrano', 'Pablo Neruda', 'Pedro Duque', 'Rafael Frühbeck de Burgos',
            'Salvador Dalí', 'San Nicasio', 'Siglo XXI'
          ]
        },
        alcorcon: {
          n: 11,
          lista: [
            'Centro Integral de Formación Profesional a Distancia Ignacio Ellacuría',
            'El Pinar', 'Galileo Galilei', 'Jorge Guillén', 'Josefina Aldecoa', 'La Arboleda',
            'Los Castillos', 'Luis Buñuel', 'Parque de Lisboa', 'Prado de Santo Domingo',
            'Ítaca'
          ]
        },
        alcobendas: {
          n: 6,
          lista: [
            'Agora', 'Aldebaran', 'Francisco Giner de los Ríos', 'Gloria Fuertes',
            'Severo Ochoa', 'Virgen de la Paz'
          ]
        },
        mostoles: {
          n: 17,
          lista: [
            'Antonio Gala', 'Antonio de Nebrija', 'Benjamin Rua', 'Clara Campoamor',
            'El Cañaveral', 'Europa', 'Felipe Trigo', 'Gabriel Cisneros', 'Juan Gris',
            'Los Rosales', 'Luis Buñuel', 'Manuel de Falla', 'Manuela Malasaña',
            'Miguel Hernández', 'Miguel de Cervantes', 'Rayuela', 'Velázquez'
          ]
        }
      }
    },

    {
      id: 'universidad',
      sing: 'campus universitario público',
      gen: 'm',
      base: 'total',
      grupo: 'Educación',
      titulo: 'Campus universitario público',
      fuenteId: 'universidades',
      nota: 'En Parla no hay campus universitario público. Quien estudia una carrera pública la cursa fuera del municipio.',
      datos: {
        getafe: { n: 1, lista: ['Universidad Carlos III · Campus de Getafe'] },
        parla: { n: 0, lista: [] },
        pinto: { n: 0, lista: [] },
        fuenlabrada: { n: 1, lista: ['Universidad Rey Juan Carlos · Campus de Fuenlabrada'] },
        leganes: { n: 1, lista: ['Universidad Carlos III · Campus de Leganés'] },
        alcorcon: { n: 1, lista: ['Universidad Rey Juan Carlos · Campus de Alcorcón'] },
        alcobendas: { n: 0, lista: [] },
        mostoles: { n: 1, lista: ['Universidad Rey Juan Carlos · Campus de Móstoles'] }
      }
    },

    {
      id: 'conservatorio',
      sing: 'conservatorio profesional',
      gen: 'm',
      base: 'total',
      grupo: 'Educación',
      titulo: 'Conservatorio profesional de música',
      fuenteId: 'educacion',
      nota: 'Parla tiene escuela municipal de música. Las enseñanzas regladas que dan titulación oficial hay que cursarlas fuera del municipio.',
      datos: {
        getafe: { n: 1, lista: ['Conservatorio Profesional de Música de Getafe'] },
        parla: { n: 0, lista: [] },
        pinto: { n: 0, lista: [] },
        fuenlabrada: { n: 0, lista: [] },
        leganes: { n: 1, lista: ['Conservatorio Profesional Manuel Rodríguez Sales'] },
        alcorcon: { n: 1, lista: ['Conservatorio Profesional Manuel de Falla'] },
        alcobendas: { n: 0, lista: [] },
        mostoles: { n: 1, lista: ['Conservatorio Profesional Rodolfo Halffter'] }
      }
    },

    {
      id: 'plazas-residencia',
      sing: 'plaza residencial pública',
      gen: 'f',
      base: 'mayores',
      grupo: 'Servicios sociales',
      titulo: 'Plazas en residencias públicas de mayores',
      enTotal: false,
      fuenteId: 'atencionSocial',
      nota: 'Se cuentan plazas y no centros, que es la unidad que se ocupa. Solo residencias de titularidad pública. Al medirse en plazas, queda fuera del recuento de la portada.',
      datos: {
        getafe: {
          n: 134,
          lista: [
            'Residencia de Personas Mayores de Getafe · 64 plazas',
            'Getafe Alzheimer · 70 plazas'
          ]
        },
        parla: { n: 64, lista: ['Residencia de Personas Mayores de Parla · 64 plazas'] },
        pinto: { n: 0, lista: [] },
        fuenlabrada: { n: 63, lista: ['Residencia Municipal de Fuenlabrada · 63 plazas'] },
        leganes: { n: 220, lista: ['Parque de los Frailes · 220 plazas'] },
        alcorcon: { n: 208, lista: ['Residencia de Personas Mayores de Alcorcón · 208 plazas'] },
        alcobendas: { n: 201, lista: ['Gastón Baquero · 201 plazas'] },
        mostoles: { n: 249, lista: ['Parque Coimbra · 220 plazas', 'Juan XXIII · 29 plazas'] }
      }
    },

    {
      id: 'tranvia',
      sing: 'parada de tranvía',
      gen: 'f',
      base: 'total',
      grupo: 'Transporte',
      titulo: 'Paradas de tranvía',
      fuenteId: 'tranvia',
      nota: 'Parla es la única de las {N} ciudades con tranvía: el ML-4, con 15 paradas. Es una línea circular dentro del municipio, así que para ir a Madrid hay que cambiar al Cercanías.',
      datos: {
        getafe: { n: 0, lista: [] },
        parla: { n: 15, lista: [] },
        pinto: { n: 0, lista: [] },
        fuenlabrada: { n: 0, lista: [] },
        leganes: { n: 0, lista: [] },
        alcorcon: { n: 0, lista: [] },
        alcobendas: { n: 0, lista: [] },
        mostoles: { n: 0, lista: [] }
      }
    }
  ];

  /* Los hospitales no se reparten por habitante: se compara su cartera de servicios. */
  const hospitales = {
    getafe: {
      nombre: 'Hospital Universitario de Getafe',
      unidades: 74,
      faltanEnReferencia: [
        'Angiología y Cirugía Vascular', 'Banco de tejidos', 'Cirugía plástica y reparadora',
        'Cirugía torácica', 'Cuidados intensivos neonatales', 'Foniatría', 'Genética',
        'Hemodinámica', 'Inseminación artificial', 'Laboratorio Clínico',
        'Laboratorio de semen para capacitación espermática', 'Logopedia', 'Medicina nuclear',
        'Neurocirugía', 'Neurofisiología', 'Odontología/Estomatología',
        'Otras unidades asistenciales', 'Planificación familiar', 'Quemados', 'Vacunación'
      ],
      faltanAqui: []
    },
    parla: {
      nombre: 'Hospital Universitario Infanta Cristina',
      unidades: 54,
      faltanEnReferencia: [],
      faltanAqui: []
    },
    pinto: {
      nombre: null,
      unidades: 0,
      faltanEnReferencia: [],
      faltanAqui: [
        'Alergología', 'Anatomía patológica', 'Anestesia y Reanimación', 'Aparato digestivo',
        'Atención Continuada en Atención Primaria', 'Atención sanitaria domiciliaria',
        'Bioquímica clínica', 'Cardiología', 'Cirugía general y digestivo',
        'Cirugía mayor ambulatoria', 'Cirugía menor ambulatoria',
        'Cirugía ortopédica y Traumatología', 'Cuidados intermedios neonatales',
        'Cuidados paliativos', 'Dermatología', 'Diálisis', 'Endocrinología', 'Enfermería',
        'Enfermería obstétrico-ginecológica (matrona)', 'Extracción de sangre para donación',
        'Extracción de órganos', 'Farmacia', 'Fisioterapia', 'Geriatría', 'Ginecología',
        'Hematología clínica', 'Hospital de día', 'Implantación de tejidos',
        'Laboratorio de hematología', 'Medicina del trabajo', 'Medicina intensiva',
        'Medicina interna', 'Medicina preventiva', 'Microbiología y Parasitología',
        'Nefrología', 'Neumología', 'Neurología', 'Nutrición y Dietética', 'Obstetricia',
        'Obtención de muestras', 'Obtención de tejidos', 'Oftalmología', 'Oncología',
        'Otorrinolaringología', 'Pediatría', 'Psicología clínica', 'Psiquiatría',
        'Radiodiagnóstico', 'Rehabilitación', 'Reumatología', 'Servicio de transfusión',
        'Terapia ocupacional', 'Tratamiento del dolor', 'Urología'
      ]
    },
    fuenlabrada: {
      nombre: 'Hospital Universitario de Fuenlabrada',
      unidades: 69,
      faltanEnReferencia: [
        'Cirugía refractiva', 'Cuidados intensivos neonatales', 'Foniatría', 'Hemodinámica',
        'Inseminación artificial', 'Interrupción voluntaria del embarazo',
        'Laboratorio Clínico', 'Laboratorio de semen para capacitación espermática',
        'Logopedia', 'Medicina general/de familia', 'Medicina nuclear', 'Neurofisiología',
        'Otras unidades asistenciales', 'Planificación familiar', 'Radioterapia', 'Vacunación'
      ],
      faltanAqui: ['Diálisis']
    },
    leganes: {
      nombre: 'Hospital Universitario Severo Ochoa',
      unidades: 62,
      faltanEnReferencia: [
        'Angiología y Cirugía Vascular', 'Banco de tejidos', 'Cuidados intensivos neonatales',
        'Farmacología clínica', 'Hemodinámica', 'Inseminación artificial',
        'Laboratorio Clínico', 'Laboratorio de semen para capacitación espermática',
        'Planificación familiar', 'Vacunación'
      ],
      faltanAqui: ['Atención sanitaria domiciliaria', 'Terapia ocupacional']
    },
    alcorcon: {
      nombre: 'Hospital Universitario Fundación Alcorcón',
      unidades: 70,
      faltanEnReferencia: [
        'Angiología y Cirugía Vascular', 'Banco de embriones', 'Banco de oocitos',
        'Banco de semen', 'Banco de tejidos', 'Cuidados intensivos neonatales',
        'Fecundación in vitro', 'Hemodinámica', 'Inseminación artificial',
        'Interrupción voluntaria del embarazo', 'Laboratorio Clínico',
        'Laboratorio de semen para capacitación espermática', 'Litotricia renal',
        'Medicina nuclear', 'Neurofisiología', 'Otras unidades asistenciales',
        'Planificación familiar', 'Recuperación de oocitos', 'Vacunación'
      ],
      faltanAqui: ['Atención sanitaria domiciliaria', 'Bioquímica clínica', 'Cuidados paliativos']
    },
    alcobendas: {
      nombre: null,
      unidades: 0,
      faltanEnReferencia: [],
      faltanAqui: [
        'Alergología', 'Anatomía patológica', 'Anestesia y Reanimación', 'Aparato digestivo',
        'Atención Continuada en Atención Primaria', 'Atención sanitaria domiciliaria',
        'Bioquímica clínica', 'Cardiología', 'Cirugía general y digestivo',
        'Cirugía mayor ambulatoria', 'Cirugía menor ambulatoria',
        'Cirugía ortopédica y Traumatología', 'Cuidados intermedios neonatales',
        'Cuidados paliativos', 'Dermatología', 'Diálisis', 'Endocrinología', 'Enfermería',
        'Enfermería obstétrico-ginecológica (matrona)', 'Extracción de sangre para donación',
        'Extracción de órganos', 'Farmacia', 'Fisioterapia', 'Geriatría', 'Ginecología',
        'Hematología clínica', 'Hospital de día', 'Implantación de tejidos',
        'Laboratorio de hematología', 'Medicina del trabajo', 'Medicina intensiva',
        'Medicina interna', 'Medicina preventiva', 'Microbiología y Parasitología',
        'Nefrología', 'Neumología', 'Neurología', 'Nutrición y Dietética', 'Obstetricia',
        'Obtención de muestras', 'Obtención de tejidos', 'Oftalmología', 'Oncología',
        'Otorrinolaringología', 'Pediatría', 'Psicología clínica', 'Psiquiatría',
        'Radiodiagnóstico', 'Rehabilitación', 'Reumatología', 'Servicio de transfusión',
        'Terapia ocupacional', 'Tratamiento del dolor', 'Urología'
      ]
    },
    mostoles: {
      nombre: 'Hospital Universitario de Móstoles y Hospital Universitario Rey Juan Carlos',
      unidades: 79,
      faltanEnReferencia: [
        'Angiología y Cirugía Vascular', 'Banco de embriones', 'Banco de oocitos',
        'Banco de semen', 'Cirugía cardiaca', 'Cirugía maxilofacial', 'Cirugía pediátrica',
        'Cirugía plástica y reparadora', 'Cirugía torácica', 'Cuidados intensivos neonatales',
        'Fecundación in vitro', 'Genética', 'Hemodinámica', 'Inseminación artificial',
        'Laboratorio Clínico', 'Laboratorio de semen para capacitación espermática',
        'Logopedia', 'Medicina nuclear', 'Neurocirugía', 'Neurofisiología',
        'Otras unidades asistenciales', 'Planificación familiar', 'Radioterapia',
        'Recuperación de oocitos', 'Vacunación'
      ],
      faltanAqui: []
    }
  };

  const cautelaHospital = 'Son las unidades asistenciales que el Registro de Centros de la Comunidad de Madrid tiene declaradas en un hospital y no en el otro. Algunas diferencias menores pueden deberse a cómo declara cada centro su cartera.';

  const contexto = {
    renta: {
      anio: 2023,
      fuenteId: 'renta',
      mediaRegional: 23159,
      valores: {
        getafe: 19413,
        parla: 13534,
        pinto: 18803,
        fuenlabrada: 15909,
        leganes: 17438,
        alcorcon: 19055,
        alcobendas: 29659,
        mostoles: 16710
      },
      nota: 'Parla vive con el 58,4 % de la renta media de la Comunidad de Madrid, la más baja de los {N} municipios comparados. Menos servicios públicos donde menos dinero hay para pagárselos por fuera.'
    },
    edades: {
      fuenteId: 'edades',
      total: {
        getafe: 195628,
        parla: 138012,
        pinto: 56592,
        fuenlabrada: 189814,
        leganes: 195946,
        alcorcon: 176806,
        alcobendas: 123222,
        mostoles: 214293
      },
      tramos: [
        {
          etiqueta: '0 a 2 años',
          valores: {
            getafe: 4497,
            parla: 3315,
            pinto: 1278,
            fuenlabrada: 3634,
            leganes: 3573,
            alcorcon: 3226,
            alcobendas: 2631,
            mostoles: 4219
          }
        },
        {
          etiqueta: '3 a 11 años',
          valores: {
            getafe: 17671,
            parla: 14212,
            pinto: 5322,
            fuenlabrada: 14531,
            leganes: 14771,
            alcorcon: 13351,
            alcobendas: 10914,
            mostoles: 17039
          }
        },
        {
          etiqueta: '12 a 17 años',
          valores: {
            getafe: 12760,
            parla: 11919,
            pinto: 4456,
            fuenlabrada: 12772,
            leganes: 12991,
            alcorcon: 11288,
            alcobendas: 9160,
            mostoles: 12992
          }
        },
        {
          etiqueta: '65 años o más',
          valores: {
            getafe: 38119,
            parla: 19323,
            pinto: 8130,
            fuenlabrada: 36611,
            leganes: 44465,
            alcorcon: 40010,
            alcobendas: 21998,
            mostoles: 49845
          }
        }
      ],
      nota: 'Parla es el municipio más joven de los {N} comparados. De ahí que los colegios, los institutos y las escuelas infantiles se midan contra los niños de esa edad y no contra el total de vecinos.'
    }
  };

  return {
    ACTUALIZADO, REFERENCIA, MUNICIPIOS, BASES,
    indicadores, hospitales, cautelaHospital, contexto,
    fuentes: F,
  };
})();

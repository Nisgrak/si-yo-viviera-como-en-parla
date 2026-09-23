# Si yo viviera como en Parla

Web reivindicativa que responde a una pregunta muy concreta:

> **¿Cuántos servicios públicos desaparecerían de mi ciudad si estuviera dotada exactamente
> igual que Parla?**

Siete ciudades del área metropolitana de Madrid comparadas contra Parla, con nombre y apellidos:

| Ciudad | Habitantes | Equipamientos que perdería |
|---|---:|---:|
| Leganés | 195.734 | **69** |
| Fuenlabrada | 190.076 | **63** |
| Móstoles | 214.817 | **61** |
| Alcorcón | 175.719 | **61** |
| Getafe | 193.238 | **50** |
| Alcobendas | 123.342 | **24** |
| Pinto | 56.651 | **9** |

**Pinto y Alcobendas** pierden poco, y por motivos opuestos. Pinto ya está casi tan mal dotado
como Parla. Alcobendas es rica —29.659 € de renta por habitante, más del doble que Parla— pero
pequeña, y tampoco tiene universidad ni conservatorio. Ninguno de los dos tiene hospital público
propio, así que en sanidad hospitalaria están **por debajo** de Parla. La web lo dice.

**Móstoles** es el único con dos hospitales públicos (el Universitario de Móstoles y el Rey Juan
Carlos); se compara la unión de sus dos carteras, 79 unidades frente a las 54 de Parla.

## Cómo funciona

Para cada servicio:

```
lo que quedaría = servicios(Parla) / base(Parla) × base(tu ciudad)
pérdida         = servicios(tu ciudad) − lo que quedaría
```

La **base** no siempre es la población total. Una farmacia sirve a todo el mundo; un colegio
solo a los niños que tienen edad de ir. Parla es la ciudad más joven de la comarca, así que
usar la población total en educación la favorecería sin motivo:

| Indicador | Base |
|---|---|
| Escuelas infantiles y casas de niños | población de 0 a 2 años |
| Colegios públicos | población de 3 a 11 años |
| Institutos públicos | población de 12 a 17 años |
| Plazas en residencias públicas | población de 65 años o más |
| Todo lo demás | población total |

Con la población total como base, los colegios de Parla salían por encima de los de Getafe;
con los niños en edad escolar, salen por debajo.

Alcobendas no es del sur: está al norte de Madrid. Entró para tener un contraste de renta alta
en la comparación, y por eso los textos hablan de «área metropolitana» y no de «el sur».

Poblaciones totales: cifras oficiales del INE a 1 de enero de 2025.
Tramos de edad: INE, población por edad año a año, misma fecha (tabla 68543). Los totales de
las dos operaciones difieren en unos miles; ningún cálculo mezcla las dos.

La **superficie** (INE Indicadores Urbanos, 2024) se enseña al final del punto de partida: Parla
es la más pequeña de las ocho y la más densa, y eso se lee mejor con el dato delante.

La web abre el recuento con un ejemplo resuelto con números reales del municipio elegido
(«Parla tiene 2 bibliotecas para 137.471 habitantes: una por cada 68.736; a ese ritmo a Getafe
le tocarían 2,8 y tiene 6»), y cada indicador enseña su ratio en lenguaje llano —«una
biblioteca pública por cada 32.206 habitantes en Getafe; una por cada 68.736 en Parla»— además
de la cifra por 100.000.

Cuando el cálculo dice que sobran tres bibliotecas, la web tacha tres nombres concretos.
**Qué tres es ilustrativo** — no hay criterio técnico para decidir cuál cierra — y la web lo
dice en su apartado de método. Lo que no es ilustrativo es *cuántas*.

## Lo que no suma al total de portada

Varios indicadores se calculan igual pero se muestran aparte, porque no se miden en
equipamientos y sumarlos sería mezclar peras con manzanas:

- **Plazas en residencias públicas de mayores.** Se cuentan camas, no centros: es lo que de
  verdad se ocupa. Solo titularidad pública.
- **Camas de hospital público.** Instaladas, según el Catálogo Nacional de Hospitales.
- **Alumnos en música, idiomas y artes.** Enseñanzas de régimen especial en centros públicos.
  Mide matrícula, no plazas ofertadas, y suma lo autonómico (escuelas oficiales de idiomas,
  conservatorios) con lo municipal (escuelas de música y danza), porque la fuente no los separa
  por titularidad del centro. Sirve para comparar cuánta enseñanza de este tipo recibe cada
  municipio, no para auditar a su ayuntamiento.
- **Unidades asistenciales del hospital público.** Un hospital no se reparte por habitante; lo
  que se compara es su cartera de servicios, en los dos sentidos.

Se marcan con `enTotal: false` en `datos/datos.js`.

## Estructura

```
index.html            estructura y textos fijos
assets/estilos.css    todo el diseño
assets/app.js         el cálculo y el render
assets/fuentes/       la tipografía Archivo, servida desde aquí (OFL 1.1)
assets/cartel/        los dos fondos del cartel para compartir
assets/qr.js          el QR de cada municipio, ya trazado (lo traza herramientas/qr.py)
datos/datos.js        LOS DATOS  ←  lo único que hay que tocar
```

No hay build, ni dependencias, ni framework. Se abre `index.html` y funciona.
El municipio se guarda en la URL (`#leganes`) y en el navegador, así que los enlaces son
compartibles.

## Añadir un municipio

En `datos/datos.js`:

1. Añádelo a `MUNICIPIOS`.
2. Añade su población y sus tramos de edad en cada entrada de `BASES.valores`.
3. Añade su bloque en `datos` dentro de **cada** indicador, con `n` y `lista`.
4. Añade su entrada en `hospitales` y en `contexto.renta` / `contexto.edades`.

El recuento de arriba y la lista con nombres de abajo van **en el mismo orden**: por áreas, la
que más pierde primero, y dentro de cada una por porcentaje perdido. Lo calcula `porAreas()` una
sola vez y lo usan las dos, para que no puedan separarse al tocar cualquiera de las dos.

La web decide sola si cada indicador es pérdida, ganancia o empate (umbral: 0,15 unidades), lo
ordena por gravedad y recalcula el total de la portada.

## Fuentes

Todas oficiales y enlazadas una por una en el apartado «Cómo está hecho esto»:

- **INE** · Cifras oficiales de población de los municipios españoles, 1 enero 2025
- **INE** · Población por sexo, edad año a año y nacionalidad, 1 enero 2025 (tabla 68543)
- **INE** · Indicadores Urbanos (Urban Audit): superficie total del municipio y tasa de paro, 2024
  (tablas 69333 y 69331)
- **Comunidad de Madrid, datos abiertos** · registro de centros sanitarios, centros educativos,
  bibliotecas públicas, farmacias, registro de centros de atención social, renta disponible
  bruta municipal
- **Metro de Madrid** (líneas 10 y 12), **Renfe Cercanías** (C-3, C-4, C-5)
- **UC3M** y **URJC** · campus oficiales
- **Agencia Tributaria** y **Seguridad Social** · sus propios buscadores de oficinas
- **Comunidad de Madrid** · PIB municipal per cápita por rama de actividad
- **Ministerio de Hacienda** · liquidaciones de los presupuestos de las entidades locales
- **Ministerio de Sanidad** · Catálogo Nacional de Hospitales 2025

### Lo que todavía no está

**Esto es nota interna, no sale en la web.** Son los indicadores que se han mirado y descartado,
con el motivo. Sirve para no volver a investigarlos desde cero y para saber qué haría falta para
incorporarlos:

- **Teatros y espacios escénicos municipales.** Cada ayuntamiento cuenta con criterios
  distintos: Fuenlabrada lista cinco espacios incluyendo salas pequeñas, Alcorcón uno,
  Leganés incluye un teatro de verano al aire libre de 1.520 plazas. No es comparable.
  **Se volvió a mirar midiendo por aforo en vez de por número**, que es la idea correcta —60
  butacas y 900 dejan de pesar igual— pero no hay fuente. Ver abajo.
- **Centros de servicios sociales.** El registro autonómico da 82 en Leganés y 33 en Alcorcón,
  una diferencia de 2,5× entre vecinos que huele a criterio de registro, no a realidad.
- **Instalaciones deportivas municipales.** El último Censo Nacional de Instalaciones
  Deportivas del CSD es de 2005 y la Comunidad de Madrid no publica un registro municipal.
- **Zonas verdes por habitante.** El INE publica la superficie total de cada municipio en sus
  Indicadores Urbanos, pero deja vacíos los porcentajes de uso del suelo para todos ellos. La
  única vía sería calcularlo yo sobre el Copernicus Urban Atlas, y eso sería una estimación
  mía, no una cifra oficial citable.
- **Plantilla policial, local y nacional.** Ningún organismo publica efectivos por municipio.
  Castilla y León sí publica los de su policía local; la Comunidad de Madrid no. Y el Ministerio
  del Interior da los de la Policía Nacional **por provincia**, nunca por comisaría: su catálogo
  de datos abiertos no tiene ningún conjunto municipal.

  Las comisarías sí se pueden localizar —los siete municipios grandes tienen una, Pinto no—, pero
  como indicador es inservible: es binario, la de Alcobendas es compartida con San Sebastián de
  los Reyes, y por habitante se invierte. Parla saldría con 1 comisaría cada 137.471 vecinos y
  Móstoles con 1 cada 214.817, o sea que la web diría que Parla está mejor servida sólo por ser
  más pequeña. Lo que cuenta de una comisaría es su plantilla, que es justo lo que no se publica.
- **Tarjetas sanitarias por médico de familia.** La Comunidad de Madrid no lo publica por
  municipio.
- **Limpieza viaria.** Descartado, pero por una razón distinta: el dato existe y es bueno, y es
  la clasificación la que no aguanta la comparación. Ver abajo.
- **Paradas de tranvía.** Estuvo como indicador propio y se quitó. Parla es la única de las ocho
  con tranvía, así que el cálculo le daba a todas las demás una «ganancia» de unas veintiuna
  paradas que no dice nada de ellas: es un artefacto de que sólo una ciudad tiene la cosa que se
  cuenta, el mismo defecto por el que se descartaron las comisarías. Y sumar las 15 paradas del
  ML-4 a las estaciones de Metro dejaría a Parla primera de las ocho en transporte ferroviario,
  que es falso en cualquier sentido práctico: el ML-4 es un anillo de 8,3 km que no sale del
  municipio. La comparación honesta no es cuántas paradas hay sino a dónde llevan, y esa va ahora
  en la nota del bloque de Metro: catorce paradas alcanzables desde el tranvía, todas en Parla,
  frente a veintisiete estaciones en cinco municipios desde cualquier estación de MetroSur.
- **Oficinas de empleo.** Hay dato bueno —el buscador de la Comunidad de Madrid lista las 43 de
  la región— pero no hay historia: Getafe, Leganés, Alcorcón y Móstoles tienen dos; Parla,
  Fuenlabrada, Alcobendas y Pinto, una. Por habitante Parla sale séptima de ocho, y Fuenlabrada
  peor. Además el denominador correcto no es la población sino el paro registrado, y por ahí
  Parla queda segunda por la cola: 7.041 parados por oficina frente a los 4.094 de Getafe, pero
  Fuenlabrada aguanta 9.355. Con recuentos de uno o dos, una oficina de más o de menos le da la
  vuelta a la tabla. Queda descartado por lumpy, no por falta de fuente.
- **Accesos a autovías y autopistas.** No hay estadística municipal oficial. Contar enlaces sobre
  un mapa sería un constructo propio.
- **Escuelas deportivas municipales.** Sin registro, el mismo muro que los polideportivos.
- **Autobuses urbanos e interurbanos.** El GTFS del CRTM trae los horarios reales, y el id de
  línea lleva dentro el código INE del municipio (`9__1__065_` es Getafe). Pero ese atajo miente:
  Fuenlabrada sale con cero líneas urbanas y Leganés con una, porque sus servicios urbanos están
  clasificados dentro de la red interurbana. Hacerlo bien exige cruzar las coordenadas de cada
  parada con los límites municipales del IGN. Es viable, pero es un día de trabajo.

### CONPREL: qué se puede sacar de los presupuestos municipales

La aplicación de Hacienda para consultar presupuestos y liquidaciones de las entidades locales
—[CONPREL](https://serviciostelematicosext.hacienda.gob.es/SGFAL/CONPREL)— parece interactiva,
pero publica un volcado descargable con el máximo desglose, una base Access por ejercicio y unos
50 MB comprimidos:

```
https://serviciostelematicosext.hacienda.gob.es/SGFAL/CONPREL/Consulta/DescargaFichero
    ?CCAA=&TipoDato=Liquidaciones&Ejercicio=2024&TipoPublicacion=Access
```

Se lee con `mdbtools`. Dentro: `tb_inventario` (entidades y población), `tb_funcional`
(gasto por entidad × capítulo económico × programa), `tb_economica` y sus dos versiones
consolidadas, que eliminan las transferencias internas entre un ayuntamiento y sus organismos
autónomos. Los ocho municipios están los cuatro ejercicios.

**Limpieza viaria (programa 163) no sirve, y el dato lo demuestra.** Parla aparece como la que
más gasta de las ocho: 90,30 € por habitante en 2024, frente a 53,30 de Getafe y 43,79 de
Alcobendas. Pinto aparece con cero. No es que Parla barra más ni que Pinto no barra: cada
ayuntamiento reparte el gasto entre el 163 y el 162 (recogida de residuos) como quiere. Parla
declara 17,43 €/hab en el 162 y Getafe 63,12. Sumando los dos programas, Parla queda en 107,73 y
Getafe en 116,42, y el orden se da la vuelta. Lo mismo pasa con instalaciones deportivas —el
programa 342 sale a cero en Parla, Alcorcón y Móstoles, que lo imputan al 340 o al 341— y con
seguridad. El desglose por programa de esta fuente sirve para leer un ayuntamiento, no para
comparar ocho.

**Lo que sí aguanta la comparación es el capítulo económico**, que no depende de cómo cada quien
etiquete sus programas. Consolidado, por habitante —con las cifras oficiales del INE a 1 de enero de 2025, las mismas
que usa la web— y en todos los ejercicios:

| Inversión real, € por habitante | 2021 | 2022 | 2023 | 2024 | media |
|---------------------------------|-----:|-----:|-----:|-----:|------:|
| **Parla**                       |    8 |   18 |   57 |    8 | **23** |
| Móstoles                        |  109 |   51 |   27 |   21 |    52 |
| Pinto                           |   16 |   35 |  117 |   53 |    55 |
| Alcorcón                        |   56 |   48 |   40 |   89 |    58 |
| Alcobendas                      |   46 |   63 |  185 |   79 |    93 |
| Fuenlabrada                     |   55 |   61 |  132 |  146 |    98 |
| Leganés                         |  129 |  200 |   73 |   26 |   107 |
| Getafe                          |   93 |  175 |  265 |   92 |   156 |

Parla invierte una séptima parte que Getafe por habitante, y es la última de las ocho en tres de
los cuatro ejercicios. El gasto total por habitante también la deja abajo (media de 780 €), pero
ahí Leganés está a un pelo (782 €) y 2022 fue un año raro en Parla, así que no es un dato
redondo. El de inversión sí.

Estas dos cifras están en la web, en la sección **«Y ahora, el dinero»**, junto a la renta, al
PIB municipal y a la tasa de paro. Van aparte del recuento porque son euros y no equipamientos, y
la nota de cierre dice expresamente lo que la fuente no puede separar: cuánto de la inversión que
falta es infrafinanciación y cuánto es la deuda que Parla arrastra en su plan de ajuste.

La **tasa de paro** (INE Indicadores Urbanos, 2024) abre esa sección y es la única de las cinco
cifras que no se dibuja con barras contra la media regional: en las otras cuatro, más alto es
mejor, y en el paro es al revés, así que va la lista entera de los ocho municipios, ordenada, con
Parla al final. No es el paro registrado: mide a quien busca trabajo y no lo encuentra sobre la
población activa.

La media de referencia que se enseña es la de **todos** los municipios de Madrid que liquidaron
—entre 153 y 158 según el año, unos 6,7 millones de habitantes—, incluida la capital. Madrid
capital la empuja hacia arriba: 1.345 € de gasto y 139 € de inversión con ella, 1.032 € y 112 €
sin ella. Se enseña la más alta y se da la más baja en la nota, porque el argumento aguanta con
las dos y así no hay nada que discutir.

### Plantilla médica de los hospitales: mirado y descartado

Sí se publica, y con mucho detalle. Dos fuentes:

- La **SIAE** del Ministerio de Sanidad recoge el personal de todos los hospitales de España, pero
  los microdatos salen *anonimizados*: cada centro es un `NCODI` sin nombre, con comunidad
  autónoma, finalidad y si es público o privado. No se puede decir qué hospital es cuál sin
  reidentificar un fichero que el Ministerio ha anonimizado a propósito, así que no.
- La Comunidad de Madrid publica la **plantilla orgánica hospital por hospital**, en
  [esta página](https://www.comunidad.madrid/servicios/salud/plantillas-organicas-centros-sanitarios-servicio-madrileno-salud),
  un PDF por centro y con fechas de efectos de 2026. De ahí salen estas cifras:

| Hospital | Facultativos | Camas | Plantilla | Méd./1.000 hab | Méd./cama |
|---|---:|---:|---:|---:|---:|
| Getafe | 504 | 543 | 2.492 | 2,61 | 0,93 |
| Fuenlabrada | 422 | 413 | 1.884 | 2,22 | 1,02 |
| **Infanta Cristina (Parla)** | **276** | **188** | **962** | **2,01** | **1,47** |
| F. Alcorcón | 352 | 401 | 1.750 | 2,00 | 0,88 |
| Severo Ochoa (Leganés) | 383 | 386 | 1.863 | 1,96 | 0,99 |
| Móstoles | 386 | 690 | 1.969 | 1,80 | 0,56 |

No entra por tres motivos, y el primero es el que manda:

1. **No dice lo que la web dice.** Por habitante del municipio Parla queda cuarta de seis, por
   encima de Leganés y de Móstoles. Y por cama sale la primera con diferencia. Meterlo obligaría
   a enseñarlo como ventaja de Parla, que es exactamente lo contrario de lo que el dato significa.
2. **Dos de los ocho no se pueden medir igual.** El Rey Juan Carlos de Móstoles no aparece: la
   Comunidad sólo publica plantilla de los hospitales de gestión directa, así que faltan las
   cuatro concesiones y la Jiménez Díaz. Móstoles sale sistemáticamente corto. Y el PDF de la
   Fundación Alcorcón es de **efectivos a 31 de diciembre de 2018**, otro concepto y siete años
   viejo.
3. **Plantilla orgánica no es gente trabajando.** Son puestos dotados; las vacantes no se ven.

Lo que sí deja el dato es una lectura para las camas: el Infanta Cristina tiene 1,47 facultativos
por cama y el de Getafe 0,93. El cuello de botella de Parla está en las camas, y eso ya está en
la web.

### Teatros por aforo: la idea es buena, la fuente no existe

Contar butacas en vez de salas arregla el defecto que descartó los teatros, así que se buscó en
serio. Cuatro vías; la cuarta tiene el dato pero no se puede usar:

1. **Datos abiertos de la Comunidad.** Publica `Teatros por municipios` de 2017 a 2025, pero es un
   recuento sin aforo, y el recuento en sí no se sostiene: da **1 teatro a Alcorcón**, una ciudad
   de 175.719 habitantes cuyo Buero Vallejo pasa de mil butacas. Móstoles salta de 5 a 7 en 2023 y
   Getafe baja de 3 a 2 el mismo año. No es un registro estable. Y además no diría lo que la web
   dice: por ese recuento Parla tiene 3 teatros y Getafe 2, y Parla queda quinta de las ocho. Hay
   otro conjunto con tramos de aforo («espacios escénicos con aforo de 101 a 200 personas») pero
   sólo para el total regional, sin desglose municipal.
2. **Red de Teatros de la Comunidad de Madrid.** Es el universo correcto —64 municipios, teatros y
   auditorios municipales— y la Comunidad tiene los aforos: en su propia nota cita las 120 butacas
   del más pequeño y las 989 del Teatro Auditorio Ciudad de Alcobendas. Pero no publica la tabla.
   La página de la Red no lista los espacios, y en el BOCM sólo salen los convenios municipio a
   municipio, sin capacidades.
3. **redescena.net**, el directorio de la Red Española de Teatros de titularidad pública: 80
   espacios en la Comunidad de Madrid y los ocho municipios presentes. Pero es el **listado de
   socios de una asociación, no un registro**. Alcorcón figura sólo con Los Castillos y falta su
   teatro principal, el Buero Vallejo; de Móstoles está el Teatro del Bosque y no el Teatro Villa
   de Móstoles; de Getafe, un espacio. Usarlo descontaría justo a los municipios cuyo teatro
   grande no es socio, que es el mismo defecto por el que se cayó la plantilla hospitalaria con el
   Rey Juan Carlos fuera.

4. **MIRE**, el [Mapa Informatizado de Recintos Escénicos](https://www.proyectomire.org/web/mireinicio.php)
   de la Fundación SGAE, que es con diferencia lo mejor que hay: ficha técnica por recinto con
   aforo, titularidad, cubierto o al aire libre y fecha de actualización, y con los ocho
   municipios dentro, el Buero Vallejo de Alcorcón incluido. Filtrando a teatro cubierto de
   titularidad pública sale esto:

   | | Teatros | Butacas | Por 1.000 hab |
   |---|---:|---:|---:|
   | Pinto | 2 | 735 | 12,97 |
   | Leganés | 4 | 2.085 | 10,65 |
   | Alcobendas | 2 | 1.189 | 9,64 |
   | Móstoles | 5 | 2.037 | 9,48 |
   | Fuenlabrada | 3 | 1.335 | 7,02 |
   | Alcorcón | 2 | 1.203 | 6,85 |
   | **Parla** | **2** | **702** | **5,11** |
   | Getafe | 2 | 913 | 4,72 |

   Tampoco entra, por tres motivos y el primero es insalvable:

   - **No se puede republicar.** La propia página dice que la base de datos es propiedad de la
     Fundación SGAE y que «queda prohibida su reproducción, distribución, comunicación pública,
     transformación y cualquier otro acto que no haya sido expresamente autorizado». Sacar el
     aforo de veinte recintos y publicarlo es justo eso. Habría que pedir permiso.
   - **No dice lo que dice la web.** Parla queda séptima de ocho y **Getafe última**: con la tasa
     de Parla, Getafe ganaría butacas.
   - **La cobertura y la frescura son desiguales.** Las fichas de Getafe se actualizaron por
     última vez en 1999 y 2000; las de Parla, en marzo de 2025. Los recintos por municipio van de
     2 a 5, y en unos entran los salones de actos de los centros culturales y en otros no.
     La mitad de las butacas de Leganés son el auditorio de la Universidad Carlos III, que es
     público pero ni municipal ni de programación teatral.

Quedaría ir teatro por teatro a la web de cada ayuntamiento: una veintena de espacios, cada uno
declarando su aforo a su manera —con palcos o sin ellos, ampliable o no— y cada ayuntamiento
decidiendo qué sala merece llamarse teatro. Sería una recopilación nuestra, como las zonas verdes.

### Zonas verdes: mirado y descartado

No existe estadística oficial de metros cuadrados de zona verde por municipio en Madrid. El
portal de datos abiertos de la Comunidad devuelve un único resultado buscando «zonas verdes», y
es una tabla del censo de vivienda de 2001. El INE publica la superficie total de cada municipio
en sus Indicadores Urbanos pero deja vacíos los usos del suelo. El País Vasco sí lo publica como
indicador municipal; Madrid no. Las cifras que circulan en prensa salen de estudios sueltos o de
lo que declara cada ayuntamiento, que es el mismo problema que descartó los teatros.

Se podría calcular con el Copernicus Urban Atlas (clase «Green urban areas», resolución de 0,25
ha) o con el SIOSE del IGN, cruzando polígonos con los límites municipales. Sería el único dato
de la web calculado por nosotros, y por tanto el primero que atacaría cualquiera que quisiera
desmontarla. Descartado por eso, no por falta de medios.

### Superficie industrial: mirado y sustituido

Las hectáreas de suelo industrial tampoco se publican de forma comparable. Los datos
alfanuméricos del [Sistema de Información Urbana](https://www.mivau.gob.es/urbanismo-y-suelo/sistema-de-informacion-urbana)
del Ministerio de Vivienda traen la superficie de cada sector con su uso predominante, pero entre
el 30 % y el 50 % sale sin uso asignado según la comunidad que lo reportara —Alcorcón tiene 1.165
ha sin clasificar— y Alcobendas aparece con cero hectáreas industriales, lo cual es falso de
partida. Además son áreas de desarrollo, es decir suelo pendiente, no el que ya existe.

Lo que ese suelo produce sí está publicado, y es lo que entró en la web: el **PIB municipal per
cápita por rama de actividad** de la Comunidad de Madrid. Parla se queda en el 32 % de la media
regional y es la última de los 24 municipios de la región que pasan de 50.000 habitantes; por
detrás de ella sólo hay pueblos de mil vecinos. En la rama industrial, 1.398 € por habitante
frente a los 6.509 de Getafe.

## Cómo está escrita

Es una web pública, así que la copia sigue tres reglas:

1. **Ninguna afirmación sin respaldo.** Los superlativos van acotados a los municipios
   comparados, no a «la comarca» ni «el sur metropolitano», que no se han medido enteros. La
   única excepción son las dos notas de oficinas del Estado, que afirman algo de toda la
   Comunidad de Madrid: ahí el listado completo de la fuente se cruzó con los 180 municipios de
   la región, uno a uno, antes de escribir la frase. El
   número va como `{N}` en los textos y lo rellena `texto()` a partir de `MUNICIPIOS.length`,
   así que añadir una ciudad no deja ninguna frase desfasada.
2. **Las tesis se distinguen de los datos.** Las cifras se enseñan; las lecturas se escriben
   como lecturas y van en las notas, no en los titulares.
3. **Nada de jerga de desarrollo en la cara pública.** Para avisar de un error se enlaza el
   repositorio, no un nombre de archivo.
4. **Las frases con fuerza también salen de los datos.** El golpe de la portada («Parla es la
   última en renta por habitante y en 9 de los 16 servicios») no está escrito a mano:
   `golpe()` recorre los indicadores en cada carga y cuenta en cuántos la tasa de Parla es la
   mínima. Si cambian los datos, cambia la frase.
5. **Nada de antítesis.** La construcción «no es X: es Y» estaba doce veces y es lo que hacía
   que la web sonara a texto generado. Los datos se enuncian y punto.

**La población de referencia de cada hospital** se descartó como indicador, pero la búsqueda dio
fruto por otro lado: el Catálogo Nacional de Hospitales sí publica camas instaladas por centro,
y eso sí entró. El motivo de descartar la población de referencia es que el dato existe pero
desmonta la hipótesis de partida. El SERMAS publica que el Infanta Cristina de Parla
cubre ocho municipios (Parla, Torrejón de Velasco, Torrejón de la Calzada, Batres, Cubas de la
Sagra, Casarrubuelos, Serranillos del Valle y Griñón), que suman 182.030 habitantes, mientras
que el de Getafe cubre Getafe y Pinto, 249.889. El hospital de Parla atiende a más municipios
pero a 68.000 personas menos. La lista de espera quirúrgica de la Comunidad de Madrid lo
confirma: en 2025, 88 días de demora media en Getafe frente a 64 en Parla. Además, ni
Fuenlabrada ni el Severo Ochoa publican su cobertura, así que tampoco sería un indicador
uniforme.

## Desplegar

Es una web estática. Sirve la carpeta tal cual:

```bash
python3 -m http.server 8000      # en local
```

En GitHub Pages, Netlify, Cloudflare Pages o Vercel: subir la carpeta, sin configuración.

Nota: el contenido se calcula en el navegador, así que un buscador sin JavaScript solo verá
la estructura. Si en algún momento importa el posicionamiento, el siguiente paso sería un
pequeño script de pre-render que escriba el HTML a partir de `datos/datos.js`.

## Accesibilidad

Contraste verificado, foco visible, navegación por teclado, textos alternativos para las
visualizaciones (cada indicador incluye su recuento en texto para lectores de pantalla) y
respeto a `prefers-reduced-motion`. La paleta está validada para daltonismo: el rojo y el
verde nunca aparecen juntos como única diferencia, siempre van con etiqueta.

Sin cookies, sin analítica y **sin una sola petición a servidores de terceros**: la tipografía
Archivo se sirve desde el propio dominio (`assets/fuentes/`, bajo SIL Open Font License 1.1, con
su licencia incluida). Eso significa que abrir la web no manda la IP de nadie a Google ni a nadie
más.

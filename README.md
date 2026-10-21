# Si yo viviera como en Parla

Web reivindicativa que responde a una pregunta muy concreta:

> **¿Cuántos servicios públicos desaparecerían de mi ciudad si estuviera dotada exactamente
> igual que Parla?**

Diez ciudades del área metropolitana de Madrid comparadas contra Parla, con nombre y apellidos:

| Ciudad | Habitantes | Equipamientos que perdería |
|---|---:|---:|
| Leganés | 195.734 | **69** |
| Fuenlabrada | 190.076 | **63** |
| Móstoles | 214.817 | **61** |
| Alcorcón | 175.719 | **61** |
| Getafe | 193.238 | **50** |
| Alcobendas | 123.342 | **24** |
| Pozuelo de Alarcón | 89.770 | **18** |
| Torrejón de Ardoz | 143.526 | **14** |
| Majadahonda | 73.625 | **12** |
| Pinto | 56.651 | **9** |

**Pinto y Alcobendas** pierden poco, y por motivos opuestos. Pinto ya está casi tan mal dotado
como Parla. Alcobendas es rica —32.405 € de renta por habitante en 2024, más del doble que Parla— pero
pequeña, y tampoco tiene universidad ni conservatorio. Ninguno de los dos tiene hospital público
propio, así que en sanidad hospitalaria están **por debajo** de Parla. La web lo dice.

**Móstoles** es el único con dos hospitales públicos (el Universitario de Móstoles y el Rey Juan
Carlos); se compara la unión de sus dos carteras, 76 unidades frente a las 54 de Parla.

**Torrejón de Ardoz** tiene más habitantes que Parla y pierde 14. Tampoco tiene Metro, empata en
colegios y gana escuelas infantiles. Su campus público, de la Universidad de Alcalá, abrió en
septiembre de 2025 con Enfermería y Fisioterapia: es pequeño, pero cuenta como los demás.

**Pozuelo de Alarcón y Majadahonda** son, con Alcobendas, las ciudades ricas de la comparación:
47.217 y 35.059 € de renta por habitante en 2024. Pozuelo pierde 18 y gana 9,2, casi todo en educación:
tiene campus (Somosaguas, de la Complutense), Hacienda y Seguridad Social, y no tiene hospital
público. Majadahonda pierde 12 y tiene el Puerta de Hierro, con 613 camas y todas las unidades del
Infanta Cristina más 23; pero no tiene Hacienda ni Seguridad Social, y con una sola biblioteca
para 73.625 vecinos queda por debajo de Parla.

Las 16 paradas de Metro Ligero de Pozuelo (ML-2 y ML-3) no cuentan como Metro, igual que el
tranvía de Parla. La estación de El Barrial-Centro Comercial Pozuelo está en el término de Madrid
y tampoco cuenta. Hacienda no publica las liquidaciones de Pozuelo de 2022 ni de 2023: su gasto,
inversión e impuestos directos son la media de 2021 y 2024, y su pie en la web lo dice.

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
| Alumnos de FP pública | población de 12 a 17 años |
| Plazas en residencias públicas | población de 65 años o más |
| Todo lo demás | población total |

Con la población total como base, los colegios de Parla salían por encima de los de Getafe;
con los niños en edad escolar, salen por debajo.

Alcobendas no es del sur: está al norte de Madrid. Entró para tener un contraste de renta alta
en la comparación, y por eso los textos hablan de «área metropolitana» y no de «el sur». Torrejón
de Ardoz, en el corredor del Henares, tampoco es del sur, ni Pozuelo y Majadahonda, al oeste.

Poblaciones totales: cifras oficiales del INE a 1 de enero de 2025.
Tramos de edad: INE, población por edad año a año, misma fecha (tabla 68543). Los totales de
las dos operaciones difieren en unos miles; ningún cálculo mezcla las dos.

La **superficie** (INE Indicadores Urbanos, 2024) se enseña al final del punto de partida: Parla
es la más pequeña de las once y la más densa, y eso se lee mejor con el dato delante.

La web abre el recuento con un ejemplo resuelto con números reales del municipio elegido
(«Parla tiene 2 bibliotecas para 137.471 habitantes: una por cada 68.736; a ese ritmo a Getafe
le tocarían 2,8 y tiene 6»), y cada indicador enseña su ratio en lenguaje llano —«una
biblioteca pública por cada 32.206 habitantes en Getafe; una por cada 68.736 en Parla»— además
de la cifra por 100.000.

Cuando el cálculo dice que sobran tres bibliotecas, la web tacha tres nombres concretos.
**Qué tres es ilustrativo** — no hay criterio técnico para decidir cuál cierra — y la web lo
dice en su apartado de método. Lo que no es ilustrativo es *cuántas*.

## Lo que no suma al total de portada

Varios indicadores se muestran aparte porque no se miden en equipamientos y sumarlos sería
mezclar peras con manzanas. En la lista de la web van al final de «Lo que perderías» (y de «Lo que
ganarías»), detrás de un separador, «Fuera del recuento», cuyo texto dice en qué se mide lo de
debajo con las unidades que de verdad aparecen para esa ciudad:

- **Plazas en residencias públicas de mayores.** Se cuentan camas, no centros: es lo que de
  verdad se ocupa. Solo titularidad pública.
- **Camas de hospital público.** Instaladas, según el Catálogo Nacional de Hospitales.
- **Alumnos en música, idiomas y artes.** Enseñanzas de régimen especial en centros públicos.
  Mide matrícula, no plazas ofertadas, y suma lo autonómico (escuelas oficiales de idiomas,
  conservatorios) con lo municipal (escuelas de música y danza), porque la fuente no los separa
  por titularidad del centro. Sirve para comparar cuánta enseñanza de este tipo recibe cada
  municipio, no para auditar a su ayuntamiento.
- **Alumnos de Formación Profesional pública.** FP Básica, Grado Medio y Grado Superior
  presenciales en centros públicos, curso 2023-24 (dataset `alumnos_no_universitarios_general_
  por_tipo_y_ensenanza`). Mide matrícula, no plazas: la Comunidad no publica las plazas
  ofertadas por centro ni por municipio, solo totales regionales en notas de prensa. Cuenta donde
  se estudia, no donde se vive. Se deja fuera la FP a distancia, que se concentra en pocos
  centros de toda la región (Alcorcón tiene 2.883 alumnos a distancia; Móstoles, 1.133). La base
  es la de 12 a 17 años porque `BASES` no tiene un tramo de 16 a 24. Las unidades escolares
  (grupos) de FP sí se publican, pero sumarlas al recuento lo desbordaba —Getafe pasaba de 50 a
  unos 95— y un grupo no pesa lo que un centro de salud; van en un comentario de `datos.js`.
- **Zonas verdes e instalaciones deportivas.** Una superficie, y el único dato que calculamos
  nosotros. Ver «Zonas verdes», más abajo.
- **Servicios del hospital público.** Un hospital no se reparte por habitante, así que no sale de
  la tasa: se compara su cartera, las unidades asistenciales que declara uno y no el otro, en los
  dos sentidos. Es una ficha más de Sanidad, montada en `app.js` (`cartera()`) a partir de
  `hospitales`, y se tachan sus nombres como los de las bibliotecas. No suma porque una unidad
  asistencial no pesa lo que una farmacia —entre las de Getafe están Neurocirugía y Logopedia—,
  porque parte de la diferencia es cómo declara cada centro su cartera, y porque en Pinto y
  Alcobendas, sin hospital, un solo hospital pesaría como 54 farmacias.

  Tres unidades del registro no entran (`hospitales.noComparables`): «Otras unidades
  asistenciales», que no dice qué servicio es, y «Laboratorio Clínico» y «Vacunación», que los
  demás declaran y el Infanta Cristina cubre con otros epígrafes (Bioquímica clínica,
  Laboratorio de hematología, Microbiología, Medicina preventiva). Salían como algo que Parla no
  tiene, y es la réplica más fácil de toda la web. Se quitan de las listas y del total de
  unidades de cada ciudad.

  Lo que se pierde va ordenado de más a menos grave (`hospitales.gravedad`), y es lo que decide
  qué nombres caben en el cartel: sin orden, el de Getafe abría con Angiología y Banco de tejidos
  y dejaba fuera Neurocirugía. El orden no sale de ninguna fuente, es nuestro: primero lo que
  atiende una urgencia vital, después la cirugía y el diagnóstico complejos, luego lo que se hace
  con cita y al final la reproducción asistida.

Se marcan con `enTotal: false` en `datos/datos.js`, con un campo `mide` que dice en qué se miden.

**La portada da lo que se pierde, no el neto.** Si la ciudad también gana algo que sí suma
—Pinto gana colegios e institutos—, la portada lo dice debajo del total («Y ganarías 3, en
educación»), el recuento lo enseña como un área más, «Lo que ganarías», y su pie da las dos cifras
y la resta: «Pierdes 9 equipamientos y ganas 3: 6 menos en neto». No se resta del número grande
porque lo que desaparece desaparece aunque aparezca otra cosa.

## Estructura

```
index.html            estructura y textos fijos
assets/estilos.css    todo el diseño
assets/calculo.js     la cuenta: qué se pierde, qué se gana y cuánto suma la portada
assets/app.js         el render
assets/cartel.js      el cartel A4 de economía e infraestructuras (la portada tiene el suyo en app.js)
consulta.html         todos los datos de las once ciudades a la vez (assets/consulta.css/.js)
assets/indice.js      el índice de cada página (lateral o barra de abajo); lo lee de la página
assets/fuentes/       la tipografía Archivo, servida desde aquí (OFL 1.1)
assets/cartel/        los dos fondos del cartel para compartir
assets/qr.js          el QR de cada municipio, ya trazado (lo traza herramientas/qr.py)
datos/datos.js        LOS DATOS  ←  lo único que hay que tocar
infraestructura.html  la página de las infraestructuras: en coche y en transporte público (/<ciudad>/infraestructura/)
assets/infraestructura*.css/.js   su diseño y su render: lo común, el mapa y las colas
datos/infraestructura.js   sus cifras; las escribe herramientas/infraestructura.py
datos/mapa/<id>.js    las geometrías de cada mapa; las escribe herramientas/accesos/accesos.py --mapa
assets/infraestructura-tp.js   el mapa de tiempos en transporte público de infraestructura.html
datos/transporte.js, datos/transporte/<id>.js   sus tiempos y su fondo; los escribe herramientas/transporte/ciudad.py
vivienda.html         la página de la vivienda (/<ciudad>/vivienda/)
assets/vivienda.css/.js   su diseño y su render: casas por cada 100 vecinos, líneas, barras y la rejilla de 100
datos/vivienda.js     sus cifras; las escribe herramientas/vivienda.py
herramientas/vivienda/fuentes/   lo extraído de cada fuente (.json) con sus URL y cautelas (.md)
economia.html         la página de la economía (/<ciudad>/economia/)
assets/economia.css/.js   su diseño y su render: fichas del dinero, líneas y el «de cada 100»
assets/linea.js       el gráfico de líneas, compartido por vivienda.html y economia.html
datos/economia.js     sus cifras; las escribe herramientas/economia.py
herramientas/economia/fuentes/   lo extraído de cada fuente (.json) con sus URL y cautelas (.md)
herramientas/         lo que rehace lo que no se teclea: el QR, las zonas verdes, los accesos,
                      la prueba de la web (comprobar.mjs) y el build que añade la vista
                      previa de cada ciudad (compartir.mjs)
```

La web no necesita build, ni dependencias, ni framework: se abre `index.html` y funciona. El
municipio se guarda en la URL y en el navegador, así que los enlaces son compartibles.

### El índice: añadir una sección o una página

Las páginas son largas, así que llevan un índice (`assets/indice.js`, con sus estilos en
`estilos.css`). Con sitio en el margen izquierdo es una lista fija que marca dónde estás y
despliega los apartados de esa sección. Sin sitio (en el móvil, sobre todo) es una barra abajo con
la sección actual y el progreso, que abre una hoja con todo. Sale al dejar atrás la portada. Los
enlaces mueven la vista sin tocar la dirección, porque el `#getafe` elige la ciudad.

No hay nada escrito a mano en él:
- **Una sección nueva** entra sola si lleva `data-indice="Título corto"` y un `id`. Con
  `data-indice-dato` saca una cifra al lado (`data-indice-tono="loss"` o `"gain"` para el color).
- **Un apartado** dentro de una sección es cualquier elemento con `data-indice-sub="Nombre"` y un
  `id`. Las áreas de «Lo que perderías» y «Lo que ganarías» las marca `app.js` al pintarlas.
- **Algo que ocupe también los márgenes** (como los mapas) lleva `data-indice-ancho`: mientras está
  en pantalla, el índice lateral se aparta.
- **Una página nueva**: una línea en `PAGINAS` (en `indice.js`), su id en `<body data-pagina>`,
  `<script src="assets/indice.js">` antes de su render, una llamada a `INDICE.refrescar()` cada vez
  que se pinta, y su ruta por ciudad en `herramientas/compartir.mjs`.

### La vista previa de cada ciudad

WhatsApp y las redes no ejecutan JavaScript ni leen lo que va detrás de `#`, así que para que
el enlace de cada ciudad enseñe su cifra hace falta un HTML propio con sus etiquetas `og` y su
imagen. Eso lo monta Netlify en cada publicación (`netlify.toml` → `npm run build` →
`herramientas/compartir.mjs`), en `dist/`:

- la web tal cual;
- `dist/leganes/index.html`, una página mínima con la cifra en el título, que manda a
  `/#leganes`;
- `dist/assets/compartir/leganes.png`, la imagen con la cifra, y `general.png`, la de la portada;
- `dist/assets/compartir/leganes-economia.png`, `-infraestructura.png` y `-vivienda.png`: el dato
  principal de cada página, Parla frente a la ciudad, con su texto de vista previa. Si el dato no
  tiene sentido para una ciudad (Fuenlabrada ha perdido vecinos desde 2015, así que no hay
  viviendas por cada 100 vecinos nuevos), esa página se queda con la imagen general.

La cifra no se teclea: el build carga `datos.js` y `calculo.js`, los mismos archivos que el
navegador, así que no hay una segunda cuenta que pueda separarse. Y como se rehace en cada push,
no hay nada que acordarse de regenerar. Las imágenes las pinta
[Takumi](https://takumi.kane.tw), en Node y sin navegador.

En lo publicado, la web cambia la barra de direcciones a `/leganes/`, que es el enlace que se
copia. Lo sabe porque el build marca el `<html>` con `data-rutas`. Abierta desde la carpeta no
existen esas páginas, así que se queda con `#leganes`.

Para verlo en local: `npm install && npm run build`, y servir `dist/`.

## Añadir un municipio

En `datos/datos.js`:

1. Añádelo a `MUNICIPIOS`.
2. Añade su población y sus tramos de edad en cada entrada de `BASES.valores`.
3. Añade su bloque en `datos` dentro de **cada** indicador, con `n` y `lista`.
4. Añade su entrada en `hospitales` y en `contexto`: `edades`, `superficie`, cada serie de
   `dinero` y `zonasVerdes`, que imprime `herramientas/zonas-verdes.py`.
5. Rehaz el QR (`python3 herramientas/qr.py`). La vista previa se genera sola al publicar.

El recuento de arriba y la lista con nombres de abajo van **en el mismo orden**: por áreas, la
que más pierde primero, y dentro de cada una por porcentaje perdido: quedarse sin la única
universidad pesa más que perder 3 institutos de 13. Lo calcula `porAreas()` una sola vez y lo
usan las dos, para que no puedan separarse al tocar cualquiera de las dos. Lo que no suma va al
final de la lista, tras el separador, agrupado por área.

La web decide sola si cada indicador es pérdida, ganancia o empate (umbral: 0,15 unidades; en
superficie, un 2 % de lo que hay), lo ordena por gravedad y recalcula el total de la portada.

## Fuentes

Todas oficiales y enlazadas una por una en el apartado «Cómo está hecho esto»:

- **INE** · Cifras oficiales de población de los municipios españoles, 1 enero 2025
- **INE** · Población por sexo, edad año a año y nacionalidad, 1 enero 2025 (tabla 68543)
- **INE** · Indicadores Urbanos (Urban Audit): superficie total del municipio y tasa de paro, 2024
  (tablas 69333 y 69331)
- **INE** · Atlas de Distribución de Renta de los Hogares: renta bruta por persona y población bajo umbrales relativos, 2024
  (tablas 31097, 31102 y 31103, las de la provincia de Madrid)
- **Copernicus** · Urban Atlas 2018: zonas verdes urbanas e instalaciones deportivas y de ocio
- **IGN** · Unidades administrativas (WFS INSPIRE): términos municipales
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
- **Ingreso Mínimo Vital.** La Seguridad Social y el INE lo publican por provincia, no por
  municipio ni por código postal. Las cifras municipales que circulan salen de peticiones de
  transparencia.
- **Renta Mínima de Inserción.** El informe anual de la Comunidad sí da familias perceptoras
  por municipio, pero la prestación se está extinguiendo con el paso al IMV: 19 familias en
  Parla en 2025, 0 en Majadahonda. Con esos números, un caso le da la vuelta.
- **Desahucios.** El CGPJ publica los lanzamientos por partido judicial, no por municipio. Solo
  Getafe, Leganés, Alcorcón y Pozuelo tienen partido propio; Parla va con Pinto, Fuenlabrada con
  Humanes, y Móstoles, Alcobendas, Torrejón y Majadahonda mezclan otros municipios. Además el
  fichero de 2025 no cuadra con el anual del propio CGPJ.
- **Centros de día de mayores.** El registro de atención social da las plazas de titularidad
  pública (Parla 30, Getafe 40, tres ciudades a cero), pero no separa las concertadas, que son la
  mayor parte de la red, y en Fuenlabrada hay un posible duplicado (Ramón Rubial, C3255 y C9718).
- **Centros de educación de adultos.** Hay un CEPA por municipio, salvo Alcobendas: binario, como
  las comisarías. El alumnado de adultos mide demanda, no dotación.
- **Becas de comedor y bono social.** Solo hay totales regionales o provinciales.
- **Accesos a autovías y autopistas, contados sobre el mapa.** Sigue fuera: no hay estadística
  municipal oficial y contar enlaces es un constructo propio. Lo que sí entró es por dónde sale
  la gente, que viene del Ministerio de Transportes. Ver «Infraestructuras: salir en coche», abajo.
- **Escuelas deportivas municipales.** Sin registro, el mismo muro que los polideportivos.
- **Autobuses urbanos e interurbanos.** El GTFS del CRTM trae los horarios reales, y el id de
  línea lleva dentro el código INE del municipio (`9__1__065_` es Getafe). Pero ese atajo miente:
  Fuenlabrada sale con cero líneas urbanas y Leganés con una, porque sus servicios urbanos están
  clasificados dentro de la red interurbana. Hacerlo bien exige cruzar las coordenadas de cada
  parada con los límites municipales del IGN. Es viable, pero es un día de trabajo.

### Infraestructuras: salir en coche

**La parte pública** está en `infraestructura.html`, que se publica como `/<ciudad>/infraestructura/`, y
en la web principal: el bloque «Salir de la ciudad» antes del método y un botón azul en la portada
(«Infraestructuras»). La página se titula «Salir de [ciudad] y salir de Parla» y tiene dos partes, cada
una con su cabecera (`.grupo`) y sus apartados dentro, que el índice enseña en dos niveles: «En
coche» (mapa, colas y hora punta) y «En transporte público» (ver la sección
siguiente).
Cuenta por qué acceso cruzan el límite del municipio las personas que salen por carretera entre
las 6 y las 10 de la mañana, de dos maneras:
- **El mapa.** Las carreteras reales con la gente fluyendo. Los dos mapas tienen el mismo tamaño y cada uno su escala, para que cada término llene su marco; la barra de 1 km lo indica. El ancho de cada carretera es proporcional a la gente que sale por ella, con la misma regla en los dos mapas, y los puntos van igual de juntos dentro de cada banda. En escritorio los mapas se salen del ancho del texto.
- **Las colas.** Un punto por cada 100 personas: la cifra absoluta.

**De dónde sale.** De los estudios de movilidad con telefonía móvil del Ministerio de
Transportes (Open Data Movilidad):
- **Rutas por carretera:** el recorrido de los viajes de más de 5 km entre municipios, tramo a tramo. Solo hay días sueltos; se usa el 16-10-2024 y, de control, el 17-10-2023.
- **Estudio básico por municipios:** los viajes por hora, de todos los medios.

Cada viaje se asigna al primer tramo de su ruta que corta el término del IGN. Las rutas no
llevan hora, así que la franja de 6 a 10 es una estimación: a cada origen y destino se le aplica
la parte de sus viajes de esa franja según el estudio básico.

**Para rehacerlo:**

```
.venv/bin/python herramientas/accesos/accesos.py --mapa   # descarga, filtra, salida/*.csv y datos/mapa/
python3 herramientas/infraestructura.py                   # escribe datos/infraestructura.js
```

`tramo_ruta` pesa 1,5 GB por día y se filtra al vuelo; la caché va en `herramientas/.cache/accesos/`.

**Cautelas:**
- Cuenta personas, no coches, y no separa el coche del autobús.
- Comparado con los aforos, el dataset sale entre un 28 % y un 88 % por encima de los vehículos ligeros contados.

**Lo que se miró y no entró:**

- **Las salidas de Parla, una a una.** Estuvo en la página hasta el 20-10-2026 y se quitó: la ficha
  de cada salida con el aforo de 7 a 8 de la M-408 (1.304 vehículos por hora, estación 430 de la
  Comunidad, septiembre a diciembre de 2024), el proyecto del tercer carril de la A-42 y el peaje
  de la R-4.

- **Contar accesos sobre OpenStreetMap, con capacidades de manual** (HCM, glorietas de Fomento). Parla, auditada vía a vía, tiene 5 accesos reales de las 87 vías que cruzan su límite:
  - los tres enlaces de la A-42;
  - una glorieta sobre la M-410;
  - la M-408 hacia Pinto.

  El resto son troncos sin salida, ramales del peaje de la R-4 que acaban en caminos privados y caminos de tierra. No hay carretera asfaltada hacia Humanes, Torrejón de la Calzada ni el norte. Contando solo conexiones con la red de carreteras, Parla tiene 5 y Getafe 18, o 9 si solo cuentan las que sirven a su casco. Con cualquier definición, Parla es la última de las 11 en capacidad teórica de salida por habitante (53–81 vehículos por hora por cada 1.000 habitantes). No entra por dos motivos:
  - la capacidad depende de supuestos;
  - Torrejón y Móstoles salen de descargas de OSM sin auditar.
- **Horas de congestión del Mapa de tráfico del Ministerio.** En 2024, en sentido Madrid, la estación de la A-42 en Parla (km 23,9) suma 373 horas; las de Getafe, entre 340 y 394 (A-42 km 11 y 15, A-4 km 13). Es el mismo orden: la congestión de la autovía no distingue a Parla. Además, no hay ninguna estación entre el km 16 y el 23,9, que es el tramo de Parla Norte.
- **La R-4.** Es de peaje (0,55 € de Pinto-Parla a la M-50 en 2026) y apenas se usa: el 3 % de los viajes que salen de Parla pasa por ella. Su IMD creció un 37 % entre 2019 y 2025, frente al 3,6 % de la A-42.
- **Concentración comparada.** Alcobendas concentra casi igual que Parla: el 62,6 % de sus salidas de la mañana va por la A-1 y la M-40. La página no dice que Parla sea la única.

### En transporte público: cuánto se tarda hasta el centro

En `infraestructura.html`, sección «En transporte público», para las once ciudades. Se elige
a dónde se va (Sol, Atocha, Nuevos Ministerios o Plaza de Castilla) y cada mapa enseña su término
municipal pintado por zonas de 10 minutos: capas semitransparentes que se cargan de color donde se
tarda menos, sobre las manzanas del Catastro y las líneas de tren. Parla en azul y la otra ciudad
en tinta; al pasar el ratón, los minutos de ese punto. De entrada cuenta solo el tren (Cercanías,
Metro y Metro Ligero); una casilla añade los autobuses, que en hora punta no siempre cumplen su
horario. Tiempo mediano de salir a cada minuto entre las 7:30 y las 8:30 de un martes.

Es, como las zonas verdes, una cuenta nuestra sobre los GTFS oficiales del Consorcio; de estación
a estación da los mismos minutos que la consulta oficial de horarios de Renfe. Método, fuentes,
resultados y cautelas en `herramientas/transporte/fuentes/ciudad.md`.

```
python3 herramientas/transporte/tiempos.py --descargar     # GTFS del Consorcio a /var/tmp/transporte
python3 herramientas/transporte/ciudad.py --ciudades parla getafe leganes fuenlabrada mostoles alcorcon alcobendas pinto torrejon pozuelo majadahonda
python3 herramientas/transporte/comprobar.py               # contrasta con horarios.renfe.com
```

Antes del mapa va **el tren a mano** (de cada 100 viviendas del Catastro, las que tienen una
estación de Cercanías, Metro o Metro Ligero que sale de su municipio a 15 minutos andando, con 5 y
10 en la nota; `cobertura.py` y `fuentes/cobertura.md`), y después **lo que cuesta el
abono** (zona tarifaria de cada ciudad y precio del de 30 días en 2026 según el BOCM; `abono.py` y
`fuentes/abono.md`). `indice.py` los junta en `datos/transporte.js` sin recalcular los tiempos, junto con las estaciones
en obras de `fuentes/obras.json` (hoy, Parla Norte, en amarillo en el mapa de Parla: sin horario,
no cuenta en ningún cálculo), y la
portada saca de ahí la línea del tren de «Salir de la ciudad». `aligerar.py` deja cada
`datos/transporte/<id>.js` en la mitad sin cambiar lo que se ve: quita las celdas de campo sin
tiempo, recorta las manzanas al encuadre y guarda los tiempos como texto en base 36 (dos
caracteres por celda); `ciudad.py` lo aplica al escribir.

Necesita numpy y shapely, como `accesos.py`. Las once tardan unos 25 minutos y caben en una
máquina de 2 GB. Para otra ciudad, su ayuntamiento en `ORIGENES` de `isocronas.py` (para la
estación de referencia) y añadirla a `--ciudades`. Mientras no esté calculada, su mapa lo dice. `isocronas.py` hace el mapa al revés (hasta dónde se llega desde el
ayuntamiento), que se descartó para la web y queda para medir los empleos a los que se llega.

### Los carteles de economía e infraestructuras

Además del cartel de la portada (en `app.js`, que sabe del recuento), cinco datos de las otras
páginas tienen su botón «Cartel para compartir»: los puestos de trabajo por cada 100 vecinos que
trabajan, el plazo de pago a proveedores y la deuda por vecino, en economía; el tren a mano y el
abono, en infraestructuras. Los monta `assets/cartel.js` con la misma maqueta, los mismos fondos y
el mismo QR que el de la portada; cada página le pasa la frase de entrada, la cifra, lo que mide y
las cajas, calculados al pulsar con la ciudad elegida. El del abono no sale si las dos ciudades
están en la misma zona.

### Todos los datos: la página de consulta

`consulta.html` junta casi todos los datos de la web (73: población, equipamientos, vecinos y
economía, cuentas del ayuntamiento, vivienda e infraestructuras) con las once ciudades a la vez.
A la izquierda, la lista, con buscador; a la derecha, cada dato elegido con las once ordenadas en
barras, Parla en azul, su fuente y un enlace a la página que lo explica; todos en una tabla,
ordenable por cualquier columna; o en gráfica, de dos formas: juntos, con los que se miden igual
(%, euros, «por cada 100.000»…) en líneas o columnas de colores sobre una misma escala, o uno frente a
otro, en una gráfica de puntos con un dato en cada eje. La selección va en la dirección
(`?d=dinero-renta,cobertura&vista=grafica&g=cruce&x=dinero-renta&y=cobertura`) para compartirla.

No calcula nada nuevo: el catálogo (`assets/consulta.js`) repite las cuentas de cada página sobre
los mismos ficheros de `datos/`. Al añadir un dato a una página, añádelo también ahí. Se quedan
fuera los desahucios (por partido judicial) y los tiempos de los mapas de transporte (cambian de
un punto a otro). Enlaza desde un botón de la portada y desde el índice de las demás páginas.

### Una casa: la página de la vivienda

**La parte pública** está en `vivienda.html`, que se publica como `/<ciudad>/vivienda/`, y en la
web principal: el bloque «Vivienda» antes del método, con las casas por cada 100 vecinos nuevos,
y un botón azul con una casa en la portada («Vivienda»). Abre con los vecinos nuevos frente a las viviendas nuevas, y
después una sección por tema:

| Sección | Qué enseña | Fuente |
|---|---|---|
| Vecinos y viviendas | Viviendas nuevas por cada 100 vecinos nuevos 2015-2025, frente a los hogares que forman 100 personas al tamaño medio de hogar; vecinos y viviendas sumados año a año | Catastro (unidades residenciales) vía Almudena; INE padrón; INE ADRH 2024 |
| Comprar | Valor de la vivienda media (tasado × superficie media); años de renta de un hogar; valor tasado €/m² trimestral 2005-2026; subida en 10 años; frente al máximo de 2007-08; recibo del IBI estimado de la vivienda media; compraventas por 1.000 hab. | MIVAU (valor tasado, transacciones); INE ADRH 2024; Censo 2021 vía Almudena; Hacienda (tipos IBI 2026) y Catastro (valor catastral residencial 2026) |
| Alquilar | Alquiler mediano €/mes; de cada 100 € de renta del hogar, los del alquiler; €/m² 2015-2024; contratos nuevos 2024; % de hogares de alquiler | MIVAU SERPAVI (IRPF); AEAT viviendas declaradas en el IRPF; INE Censo 2021 |
| De quién son | De cada 100 viviendas: personas, sociedades (y las de más de 100 en la ciudad), administraciones; vecinos que cobran un alquiler; vivienda pública de la AVS; la venta del IVIMA | Catastro (padrón del IBI 2026); AEAT IRPF por municipios 2024; AVS; Cámara de Cuentas y BOCM |
| De un barrio a otro | Sección censal más barata y más cara en alquiler €/m² (≥ 30 alquileres) y más pobre y más rica en renta por hogar | SERPAVI por sección 2024; INE ADRH 2024 por sección |
| Vivienda pública y ayudas | Viviendas de la AVS por 1.000 hab.; adjudicaciones a nuevos inquilinos 2023-2025; si la ciudad tiene viviendas del Plan Vive; ayudas al alquiler 2023 y Bono Alquiler Joven 2022 concedidos por 1.000 hogares de alquiler | AVS (patrimonio e informes de gestión); nota de prensa de la Comunidad (19-08-2026); datos abiertos de la Comunidad de Madrid |
| Cuando no se puede pagar | Demandas por alquiler y desahucios por 100.000 hab., 2013-2025, en dos gráficos | CGPJ, por partido judicial |
| Cómo son las casas | Vacías; antigüedad; hogares de 5 en 60 m²; jóvenes de 25-34 con sus padres; viviendas en edificios de 4+ plantas sin ascensor (2011); superficie media | INE Censo 2021 y Censo 2011 (tablas a medida) |

**Para rehacerlo:**

```
python3 herramientas/vivienda/adrh.py 2024   # pone al día la renta del INE (ADRH) en parque, alquiler y barrios
python3 herramientas/vivienda.py       # lee herramientas/vivienda/fuentes/*.json, escribe datos/vivienda.js
```

Los `.json` de `herramientas/vivienda/fuentes/` son lo extraído de cada fichero oficial, con la URL
exacta del fichero y de la página; cada `.md` dice cómo se sacó, las cautelas y lo que no se
encontró.

**Cautelas que la página dice:**
- La tasación no es el precio de venta.
- SERPAVI y la AEAT solo ven el alquiler que los particulares declaran en el IRPF. En 2021 los pisos declarados en Parla eran el 65,4 % de los hogares de alquiler del Censo, la cobertura más baja de las once.
- Los juzgados cuentan por partido judicial. Parla comparte el suyo con Pinto, así que en esa sección Pinto y Parla tienen las mismas cifras. Getafe, Leganés, Alcorcón y Pozuelo coinciden con su partido; los demás incluyen otros municipios, y la página dice cuáles.
- En 2025 parte de los desahucios los practicaron los servicios comunes de ejecución de los tribunales de instancia, que el Excel del CGPJ no incluye: se suman desde la base PC-Axis (tabla OUSCEJ008).
- Las demandas «por alquiler» son los verbales arrendaticios ingresados: también las que reclaman el piso al acabar el contrato.

**Lo que se buscó y no está:**
- **% de fondos buitre.** No hay fuente oficial por municipio. El Catastro distingue personas de sociedades, pero no da nombres, y cuenta el tamaño de cada sociedad dentro del municipio.
- **Fianzas de la Comunidad de Madrid.** Serían el dato de alquiler más reciente; no se publican por municipio.
- **Precio notarial por municipio.** Exige registrarse en penotariado.com.
- **Viviendas terminadas y protegidas por municipio.** Solo por provincia; la serie municipal de licencias de Almudena acaba en 2019 y tiene huecos.
- **Reparto por municipio de la venta del IVIMA.** Solo en prensa (Público, 2022: 240 en Parla); la página lo dice así.
- **Ayudas al alquiler por municipio.** Existen en datos abiertos de la Comunidad (2022-2023), pero son convocatorias sueltas y no entraron.

### Lo que paga un vecino: los impuestos municipales

Sección `#paga` de `economia.html` (`paga()` en `assets/economia.js`), con `datos/impuestos.js`,
que escribe `herramientas/impuestos.py` desde `herramientas/impuestos/impuestos.json`. Ese JSON
lo saca `herramientas/impuestos/impuestos.py` (`python3 -I`; descargas en `/var/tmp/impuestos/`)
de los tipos de 2026 de Hacienda (IBI, vehículos, ICIO, IAE), el valor catastral medio
residencial del Catastro (tablas URBO4228 y URAO4228) y la ordenanza de basuras de cada ciudad.
Los tipos del IBI cuadran con los que ya usa la vivienda.

- **Dos cuentas**: la misma vivienda en las once (valor catastral mediano, 83.647 €) y la
  vivienda media de cada una; en las dos, IBI más un coche de 12 a 15,99 CV (cuota mínima legal
  de 71,94 € por el coeficiente de cada ciudad). Responde a «Parla recauda lo que menos: ¿cobra
  menos o sus vecinos tienen menos?». En 2026, con la misma casa Parla es la 7.ª más barata de 11
  y su tipo del IBI (0,433 %) es más alto que el de seis; con su casa, la 3.ª. Lo que la abarata
  es el valor de las casas.
- **Basuras, aparte y sin sumar**: Parla tiene la tasa aprobada para 2026 y, según la prensa, el
  alcalde anunció que no se cobrará, sin acto oficial; Alcorcón aplazó el cobro a 2027; Pinto
  cobra con un coeficiente anual que no publica; Pozuelo es una estimación por tramo. Las notas
  cortas que salen en la página están en `BASURAS`, en `herramientas/impuestos.py`.
- **Fuera**: plusvalía e ICIO (en el JSON, no en la página) y las bonificaciones.

### El dinero: la página de la economía

**La parte pública** está en `economia.html`, que se publica como `/<ciudad>/economia/`. En la web
principal, «Detrás de todo, el dinero» se queda con inversión, gasto (con su cartel) y deuda viva
—las series de `contexto.dinero` con `portada: true`— y enlaza a la página, que también tiene botón
en la portada («Economía»). Abre con los puestos de trabajo por cada 100 vecinos que trabajan, y
después:

| Sección | Qué enseña | Fuente |
|---|---|---|
| Dónde se trabaja | Puestos de trabajo (afiliaciones por centro de trabajo, 31-12) por cada 100 vecinos afiliados (1-1 siguiente), 2013-2025; % de ocupados que trabaja en su municipio (2023) | Comunidad de Madrid (Seguridad Social), por ubicación y por residencia; INE, Censo anual (tabla 69986) |
| Quien no encuentra trabajo | Tasa de paro (la de siempre); parados registrados por 100 hab. de 16-64, 2015-2025, con mujeres y menores de 25 en la nota; % de contratos indefinidos 2025 | INE Indicadores Urbanos; SEPE (paro y contratos); INE, Censo anual y padrón por edad |
| Lo que entra en casa | Renta bruta por persona 2024 (la serie `renta` de `datos.js`, que antes era el indicador de la Comunidad de 2023: coincide al euro con el ADRH; la Comunidad no ha publicado 2024, así que su media va solo en la nota, con su año); renta neta por persona 2015-2024; por hogar; renta bruta por declaración, con el rendimiento del trabajo en la nota; pobreza (la de siempre); Gini y P80/P20; de cada 100 € de renta, de dónde salen | INE, ADRH 2024 (tablas 31097, 31098, 37727); Agencia Tributaria, IRPF por municipios 2024 |
| Lo que se produce | PIB por habitante (el de siempre); empresas por 1.000 hab.; peso de la construcción en el PIB y en el empleo; de cada 100 empresas, de qué sector | INE, DIRCE 2025 (tabla 4721); Comunidad de Madrid, PIB por rama y afiliados por rama |
| Las cuentas del ayuntamiento | Las cinco series municipales de siempre, y además: intereses + amortización (cap. 3 + 9 de gasto) y su peso en el gasto, con los intereses y la demora en la nota; ingresos propios (cap. 1-3); transferencias del Estado (art. 42); periodo medio de pago; remanente de tesorería ajustado a 31-12-2024 | CONPREL 2021-2024, con el mismo método que gasto e inversión; Hacienda, PMP mensual |

**Para rehacerlo:**

```
python3 herramientas/economia/cuentas_extraer.py   # CONPREL y PMP → fuentes/cuentas.json (la primera vez, ~20 min)
python3 herramientas/economia.py                   # lee herramientas/economia/fuentes/*.json, escribe datos/economia.js
```

Cada `.json` de `herramientas/economia/fuentes/` lleva la URL exacta de los ficheros, y cada `.md`
cómo se sacó, las cautelas y lo que no se encontró.

**Cautelas que la página dice:**
- Un puesto es una afiliación con centro de trabajo en la ciudad, la ocupe quien la ocupe; los autónomos cuentan donde declaran el centro, y desde 2021 cada régimen va redondeado a 5.
- El Censo saca el lugar de trabajo de registros: no ve el teletrabajo, y el porcentaje sale bajo en todas.
- El paro registrado no es la tasa de paro, y los jóvenes se apuntan poco. En 2020 no hay cociente: no hay población por edad de ese año.
- En contratos indefinidos Parla sale la primera de las once, y la página lo dice.
- ADRH y Agencia Tributaria no se mezclan: uno divide entre personas y hogares; la otra, entre declaraciones, y Parla tiene el índice declarativo más bajo (51,5 por cada 100 habitantes).
- El DIRCE cuenta la sede, y en 2023 rompió la serie: no se compara con años anteriores.
- En los intereses de Parla, más de la mitad son de demora. Su amortización es baja porque ha refinanciado: 408 M€ de préstamos nuevos en 2022 y 2023.
- El remanente es solo del ayuntamiento, sin organismos autónomos; es un saldo, así que vale el de 2024 y no la media.
- Pinto y Majadahonda publican el periodo medio de pago por trimestres.

**Lo que se buscó y no está:**
- **Áreas de gasto (primer dígito de programas).** Cuadran con el total, pero el reparto entre las áreas 1, 4 y 9 depende de cada ayuntamiento: Parla apunta el tranvía en la 4 y Pinto las vías públicas, que el resto lleva a la 1.
- **Ahorro neto.** El legal usa la anualidad teórica y Hacienda no lo publica por municipio; el calculado sobre la liquidación es nuestro, así que no entra.
- **Plan de ajuste.** No hay una relación oficial descargable por municipio.
- **Matriz origen-destino del Censo.** El INE no la publica en tablas.
- **Locales, sociedades nuevas y altas de autónomos por municipio.** Solo por provincia o región.

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
autónomos. Los once municipios están los cuatro ejercicios, salvo Pozuelo de Alarcón, que no
aparece en 2022 ni en 2023.

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
| Pozuelo de Alarcón              |  120 |    — |    — |  119 |   119 |
| Majadahonda                     |   30 |   44 |  307 |  160 |   135 |
| Torrejón de Ardoz               |   97 |  128 |  163 |  182 |   142 |
| Getafe                          |   93 |  175 |  265 |   92 |   156 |

**Impuestos directos** (capítulo 1 de ingresos, derechos reconocidos netos, consolidado, media
de 2021 a 2024): Parla 254 € por habitante, la última de las once; Leganés 326, Torrejón de
Ardoz 358, Fuenlabrada 367, Móstoles 370, Pinto 433, Getafe 460, Alcorcón 470, Majadahonda 518,
Alcobendas 707 y Pozuelo de Alarcón 733 (media de 2021 y 2024). Los usa la nota de cierre del
dinero, que compara Parla con la ciudad elegida.

Parla invierte una séptima parte que Getafe por habitante, y es la última de las once en tres de
los cuatro ejercicios. El gasto total por habitante también la deja abajo (media de 780 €), pero
ahí Leganés está a un pelo (782 €) y 2022 fue un año raro en Parla, así que no es un dato
redondo. El de inversión sí.

Estas dos cifras están en la web, en la sección **«Detrás de todo, el dinero»**, y en
`economia.html`, junto a la renta, al PIB municipal y a la tasa de paro. Van aparte del recuento porque son euros y no equipamientos, y
la nota de cierre dice expresamente lo que la fuente no puede separar: cuánto de la inversión que
falta es infrafinanciación y cuánto es la deuda que Parla arrastra en su plan de ajuste.

Gasto e inversión se dicen además **en euros al año**, con la misma cuenta que el resto de la web:
lo que Parla pone por habitante, por la población de tu ciudad. «Con la inversión de Parla, Getafe
invertiría 25,7 millones de euros menos al año.» Por debajo de un 1 % de diferencia la web dice
que se quedaría prácticamente igual —es el caso del gasto de Leganés— y no ofrece cartel. Renta,
PIB y paro no se dicen así: describen a los vecinos, no lo que decide el ayuntamiento.

Las series comparan como el resto de la web, tu ciudad contra Parla, con una fila más
arriba cuando hay una media de referencia comparable. La **tasa de paro** (INE Indicadores
Urbanos, 2024) no lleva esa fila: la fuente da la tasa por ciudad y no publica una media de la
Comunidad comparable, y la de la EPA es otra encuesta. No es el paro registrado: mide a quien
busca trabajo y no lo encuentra sobre la población activa.

En gasto e inversión la media es la de **todos** los municipios de Madrid que liquidaron —entre
153 y 158 según el año, unos 6,7 millones de habitantes—, incluida la capital. Madrid capital la
empuja hacia arriba: 1.345 € de gasto y 139 € de inversión con ella, 1.032 € y 112 € sin ella.
Se enseñan las dos en la gráfica, una fila cada una, porque el argumento aguanta con
las dos y así no hay nada que discutir.

### Deuda viva: saldo a 31 de diciembre de 2025

En **«Detrás de todo, el dinero»** se añade la deuda viva, separada del gasto y la inversión
anuales. Fuente: [Ministerio de Hacienda, ayuntamientos a 31/12/2025 (XLSX)](https://www.hacienda.gob.es/cdi/sist%20financiacion%20y%20deuda/informacioneells/2025/deuda-viva-ayuntamientos-202512.xlsx),
hoja `Datos`, provincia `28`, códigos municipales `006`, `007`, `058`, `065`, `074`, `092`, `106`,
`113`, `148`, `115` y `080`. Los nombres llevan espacios finales. Los importes originales están
en **miles de euros**: se multiplican por 1.000 y se guardan como euros en `saldoEuros` de `datos/datos.js`.

| Municipio | Deuda viva, € | € por habitante |
|---|---:|---:|
| Parla | 520.280.348,98 | 3.784,66 |
| Torrejón de Ardoz | 84.343.046,60 | 587,65 |
| Alcorcón | 88.015.077,75 | 500,89 |
| Fuenlabrada | 66.913.976,00 | 352,04 |
| Leganés | 22.803.520,30 | 116,50 |
| Getafe | 8.244.964,00 | 42,67 |
| Alcobendas | 2.329.165,00 | 18,88 |
| Móstoles | 3.020.356,00 | 14,06 |
| Pozuelo de Alarcón | 278.975,00 | 3,11 |
| Majadahonda | 185.111,00 | 2,51 |
| Pinto | 1.333,00 | 0,02 |

La tasa se calcula con las cifras oficiales del Padrón a **1 de enero de 2025** de `BASES.total`,
las mismas que usa la web. Se conserva el cociente sin redondear y se muestran dos decimales:
Pinto tiene un saldo pequeño, pero distinto de cero. No se añade una media regional sin calcularla
con un perímetro y una población comparables.

El titular compara los dos saldos totales con el mismo formato legible que el resto del dinero:
millones de euros con un decimal. Los importes inferiores al millón se mantienen sin redondear
al millar, para que los 1.333 € de Pinto sigan apareciendo como 1.333. Las cifras exactas se conservan
en los datos y en la tabla anterior.

Hacienda [define el saldo financiero](https://www.hacienda.gob.es/es-ES/CDI/Paginas/SistemasFinanciacionDeuda/InformacionEELLs/DeudaViva.aspx)
a partir de información del Banco de España. No representa toda la deuda comercial ni el pago
anual de intereses y amortización. No se convierte a «euros menos al año», no genera un cartel de
gasto y no entra en `indicadores`, en las pérdidas o ganancias ni en el total de equipamientos.
El saldo por sí solo no cuantifica cuánto explica de la baja inversión de Parla; para eso harían
falta, entre otros datos, intereses y amortizaciones de las liquidaciones.

### Pobreza: el Atlas de Distribución de Renta de los Hogares del INE

En `economia.html`, en «Lo que entra en casa». Porcentaje de población con ingresos
por unidad de consumo por debajo del 60 % de la mediana, 2024. Desde la edición de 2023 la
mediana es la de **toda España** (antes, solo territorio fiscal común), así que el umbral es el
mismo para las once y se pueden comparar sin más. No hay fila de media: el atlas publica
municipios, distritos y secciones, no la Comunidad.

| | bajo el 60 % | bajo el 40 % | menores de 18, bajo el 60 % |
|---|---:|---:|---:|
| Parla | 25,8 | 11,4 | 34,3 |
| Leganés | 17,6 | 7,3 | 24,1 |
| Móstoles | 17,2 | 7,2 | 24,4 |
| Fuenlabrada | 16,3 | 6,5 | 24,8 |
| Torrejón de Ardoz | 16,0 | 6,6 | 21,6 |
| Alcorcón | 15,0 | 6,1 | 20,0 |
| Getafe | 14,9 | 6,2 | 19,8 |
| Alcobendas | 14,5 | 6,6 | 18,7 |
| Pinto | 13,9 | 5,6 | 17,6 |
| Majadahonda | 10,9 | 5,0 | 13,2 |
| Pozuelo de Alarcón | 7,8 | 4,2 | 9,6 |

Los de 2023, que estaban antes en la web, coinciden con los que da hoy el INE: la edición de 2024
(publicada el 19-10-2026) no los revisó.

Las barras son el 60 %; el 40 % y los menores van en la nota (`extra` en `datos.js`). Las
tablas son de la provincia de Madrid: el INE las numera por provincia y el nombre no lo dice
(la 31111, por ejemplo, es Málaga). La serie llega a 2015 si algún día se quiere la evolución.

### Servicios sociales y lo que pone la Comunidad

Dos series más de CONPREL, con el mismo método que gasto e inversión (consolidado, media de
2021 a 2024, población del INE a 1 de enero de 2025; Pozuelo, media de 2021 y 2024). Van arriba,
con lo que decide o recibe el ayuntamiento (`municipal: true`), pero **sin euros al año ni
cartel**.

**Gasto en servicios sociales: política de gasto 23**, obligaciones reconocidas. A diferencia de
limpieza, aguanta: la política solo tiene un programa en el catálogo (231), así que no hay
reparto entre programas, y ninguno de los once sale con cero ni con valores raros. El único
organismo autónomo con gasto en la 23 fue el Patronato de Bienestar Social de Alcobendas en 2021,
y el consolidado lo recoge. Lo que no se puede comprobar es la frontera con otras políticas
(empleo, escuelas infantiles), y lo dice la nota. La media con Madrid capital (105,83 €) dobla
la de sin ella (54,44 €); se enseñan las dos. Entre 18 y 21 municipios pequeños declaran cero,
probablemente porque lo prestan por mancomunidad.

**Lo que pone la Comunidad: artículo 75 de ingresos** (transferencias de capital de la
comunidad autónoma), derechos reconocidos. Parla, 1,49 € por habitante; media sin la capital,
19,43. Cautelas: lo que la Comunidad contrata y paga directamente (buena parte del PIR) no pasa
por el presupuesto municipal, y uno o dos convenios dominan la media —el salto de Torrejón en
2024 son 30,3 millones del concepto 750.60, convenios con la Comunidad—. Aquí Madrid capital
tira la media hacia abajo (13,26). La nota da también el capítulo 7 entero (Estado, Comunidad
y UE): ahí Parla queda en 23,88 €, casi todo del concepto 797, otras transferencias de la UE.
El capítulo 7 entero no va como serie: es demasiado volátil, y en Alcobendas 2021 sale negativo
por un ajuste de consolidación (cuenta `7t`, −2.716.967,45 €).

### La espera: las listas de espera de los hospitales

Sección `#espera` del recuento (`espera()` en `assets/app.js`), con `datos/sanidad.js`, que
escribe `herramientas/sanidad.py` desde `herramientas/sanidad/espera.json`. Ese JSON lo
sacan `herramientas/sanidad/descarga_espera.py` (descarga en `/var/tmp/espera/`) y
`espera.py`, del servicio de consulta del SERMAS por hospital (opción «Total», mes a mes) y
de la tabla «Población de referencia» de la memoria 2024 de cada hospital (tarjetas
sanitarias a 31-12-2024; Torrejón, a 31-12-2023).

- **El hospital de cada ciudad**, según las memorias: Parla, Infanta Cristina; Getafe y
  **Pinto**, el de Getafe («la totalidad de los centros de salud de las localidades de Getafe y
  Pinto»); Fuenlabrada, el suyo; Leganés, Severo Ochoa; Alcorcón, Fundación Alcorcón;
  Alcobendas, Infanta Sofía; Móstoles, el de Móstoles (68 % de su población; el 32 % restante
  va al Rey Juan Carlos, que no se usa); Torrejón, el suyo (concesión); Pozuelo y Majadahonda,
  Puerta de Hierro.
- **Lo que se enseña**: la demora media (días naturales que llevan esperando los que siguen en
  lista, no lo que esperaron los atendidos) para operarse, para la primera consulta y para las
  pruebas, en el último mes publicado y el mismo mes de dos años antes. Y los pacientes por cada
  1.000 personas asignadas, solo en el pie: con la libre elección, la lista de un hospital no es
  solo de sus vecinos, así que eso mide la presión sobre el hospital, no cuántos vecinos esperan.
- **Quirúrgica completa**: la suma de los hospitales (120.168 en agosto de 2026) es la lista
  entera, no los 92.525 «estructurales» del titular de la Comunidad. Son comparables entre sí,
  no con ese titular.
- **Torrejón** publica consultas y pruebas a cero desde julio de 2026: se trata como sin dato.
- **Para actualizar**: `python3 -I herramientas/sanidad/descarga_espera.py AAAA-MM …` (el mes
  nuevo y el mismo mes de uno y dos años antes; por defecto 2026-08 2025-08 2024-08),
  `python3 -I herramientas/sanidad/espera.py` (necesita `pdftotext` para las memorias) y
  `python3 herramientas/sanidad.py`. El año de comparación es `ANTES` en `sanidad.py`.

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

### Zonas verdes: el único dato que calculamos nosotros

No existe estadística oficial de metros cuadrados de zona verde por municipio en Madrid: el portal
de datos abiertos de la Comunidad devuelve un único resultado buscando «zonas verdes» —una tabla
del censo de vivienda de 2001—, y el País Vasco sí publica el indicador municipal pero Madrid no.
El INE sí publica los usos del suelo en sus Indicadores Urbanos, pero **solo para 2014** y **sin
Pinto**, y en una clase que mezcla el verde con las instalaciones deportivas y de ocio. Con siete
municipios no puede entrar en el recuento.

Así que se calcula, y el cómo está en `herramientas/zonas-verdes.py`, para que se pueda rehacer o
discutir:

1. **Los términos municipales**, del WFS INSPIRE del IGN. Cuadran con la superficie del INE
   (Getafe 78,58 km² frente a 78,4), lo que sirve de comprobación.
2. **Las superficies**, del Urban Atlas 2018 de Copernicus: las clases 14100 (zonas verdes
   urbanas) y 14200 (instalaciones deportivas y de ocio, el «y de ocio» es del Urban Atlas),
   recortadas contra el término municipal.
3. **El total, por habitante**, con el padrón.

Va fuera del recuento porque es una superficie y no un equipamiento que se pueda contar y tachar.
Es un indicador más (`medida: 'superficie'`), con su ficha, sus barras en m² por habitante y su
cartel, y **se dice cuánta superficie se perdería** con la tasa de Parla. Dato incómodo pero
honesto: **con este cálculo Parla no es la última** (lo es Móstoles, y por poco; en Móstoles sale
como empate). La nota de la web no lo comenta: las barras ya lo enseñan.

Lo que hay que saber del dato: quien marca los polígonos es el Urban Atlas, no nosotros, y con una
unidad mínima de 0,25 ha; **no distingue titularidad**, así que un club privado con césped cuenta
igual que un parque; y la edición de 2012 da cifras hasta un 50 % más bajas, de modo que el número
no sirve para comparar años entre sí.

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
   última en renta por habitante y en 7 de los 12 equipamientos») no está escrito a mano:
   `golpe()` recorre en cada carga los indicadores que suman al recuento y cuenta en cuántos la
   tasa de Parla es la mínima. Los dos números de la frase salen de ahí, así que si cambian los
   datos la frase cambia sola. Un empate a la cola cuenta como última, porque ninguna tiene
   menos: de esos ocho, en cinco (Metro, universidad, conservatorio, Hacienda y Seguridad Social)
   Parla tiene cero y alguna otra también.
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
confirma: en 2025, 88 días de demora media en Getafe frente a 64 en Parla. Esa lista sí entró
después, en su propia sección («La espera», más arriba), y ahí se dice cuando Parla espera
menos. La población que tiene asignada cada hospital sale de su memoria de 2024, que también
la publican Fuenlabrada y el Severo Ochoa; se usa solo para dar los pacientes por cada 1.000,
en el pie.

## Desplegar

Es una web estática. Sirve la carpeta tal cual:

```bash
python3 -m http.server 8000      # en local
```

En GitHub Pages, Netlify, Cloudflare Pages o Vercel: subir la carpeta, sin configuración.

**La prueba.** Antes de cada build de Netlify, `herramientas/comprobar.mjs` abre las cuatro
páginas con cada una de las diez ciudades en jsdom (JavaScript de verdad, sin pintar) y para el
build si hay un error o si algo que tiene que salir sale vacío: la frase de arriba, el recuento,
las fichas, los mapas de transporte. Tarda medio minuto. En local:

```bash
npm install && npm run comprobar
```

Mira que cada página arranca y escribe sus cifras, no cómo se ve: eso sigue haciendo falta
mirarlo en un navegador.

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

# Si yo viviera como en Parla

Web reivindicativa que responde a una pregunta muy concreta:

> **¿Cuántos servicios públicos desaparecerían de mi ciudad si estuviera dotada exactamente
> igual que Parla?**

Cinco ciudades del sur de Madrid comparadas contra Parla, con nombre y apellidos:

| Ciudad | Habitantes | Equipamientos que perdería |
|---|---:|---:|
| Leganés | 195.734 | **67** |
| Fuenlabrada | 190.076 | **61** |
| Móstoles | 214.817 | **59** |
| Alcorcón | 175.719 | **58** |
| Getafe | 193.238 | **47** |
| Alcobendas | 123.342 | **21** |
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

La web abre el recuento con un ejemplo resuelto con números reales del municipio elegido
(«Parla tiene 2 bibliotecas para 137.471 habitantes: una por cada 68.736; a ese ritmo a Getafe
le tocarían 2,8 y tiene 6»), y cada indicador enseña su ratio en lenguaje llano —«una
biblioteca pública por cada 32.206 habitantes en Getafe; una por cada 68.736 en Parla»— además
de la cifra por 100.000.

Cuando el cálculo dice que sobran tres bibliotecas, la web tacha tres nombres concretos.
**Qué tres es ilustrativo** — no hay criterio técnico para decidir cuál cierra — y la web lo
dice en su apartado de método. Lo que no es ilustrativo es *cuántas*.

## Lo que no suma al total de portada

Dos indicadores se calculan igual pero se muestran aparte, porque no se cuentan en
equipamientos y sumarlos sería mezclar peras con manzanas:

- **Plazas en residencias públicas de mayores.** Se cuentan camas, no centros: es lo que de
  verdad se ocupa. Solo titularidad pública.
- **Unidades asistenciales del hospital público.** Un hospital no se reparte por habitante; lo
  que se compara es su cartera de servicios, en los dos sentidos.

Se marcan con `enTotal: false` en `datos/datos.js`.

## Estructura

```
index.html            estructura y textos fijos
assets/estilos.css    todo el diseño
assets/app.js         el cálculo y el render
assets/fuentes/       la tipografía Archivo, servida desde aquí (OFL 1.1)
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

La web decide sola si cada indicador es pérdida, ganancia o empate (umbral: 0,15 unidades), lo
ordena por gravedad y recalcula el total de la portada.

## Fuentes

Todas oficiales y enlazadas una por una en el apartado «Cómo está hecho esto»:

- **INE** · Cifras oficiales de población de los municipios españoles, 1 enero 2025
- **INE** · Población por sexo, edad año a año y nacionalidad, 1 enero 2025 (tabla 68543)
- **Comunidad de Madrid, datos abiertos** · registro de centros sanitarios, centros educativos,
  bibliotecas públicas, farmacias, registro de centros de atención social, renta disponible
  bruta municipal
- **Metro de Madrid** (línea 12), **Renfe Cercanías** (C-3, C-4, C-5), **CRTM** (ML-4)
- **UC3M** y **URJC** · campus oficiales

### Lo que todavía no está

**Esto es nota interna, no sale en la web.** Son los indicadores que se han mirado y descartado,
con el motivo. Sirve para no volver a investigarlos desde cero y para saber qué haría falta para
incorporarlos:

- **Teatros y espacios escénicos municipales.** Cada ayuntamiento cuenta con criterios
  distintos: Fuenlabrada lista cinco espacios incluyendo salas pequeñas, Alcorcón uno,
  Leganés incluye un teatro de verano al aire libre de 1.520 plazas. No es comparable.
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

Cada uno aparece en la web con su motivo al lado, no solo con el nombre.

## Cómo está escrita

Es una web pública, así que la copia sigue tres reglas:

1. **Ninguna afirmación sin respaldo.** Los superlativos van acotados a los municipios
   comparados, no a «la comarca» ni «el sur metropolitano», que no se han medido enteros. El
   número va como `{N}` en los textos y lo rellena `texto()` a partir de `MUNICIPIOS.length`,
   así que añadir una ciudad no deja ninguna frase desfasada.
2. **Las tesis se distinguen de los datos.** Las cifras se enseñan; las lecturas se escriben
   como lecturas y van en las notas, no en los titulares.
3. **Nada de jerga de desarrollo en la cara pública.** Para avisar de un error se enlaza el
   repositorio, no un nombre de archivo.
4. **Las frases con fuerza también salen de los datos.** El golpe de la portada («Parla es la
   última en renta por habitante y en 7 de los 12 servicios») no está escrito a mano:
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

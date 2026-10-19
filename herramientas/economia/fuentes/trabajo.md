# Trabajo: empleo en el municipio, paro registrado y temporalidad

Extraído el **19-10-2026**. Datos en `trabajo.json` (mismo directorio). Descargas en bruto fuera del repo
(`/tmp/claude-1000/economia-trabajo/`, enlace a `/var/tmp/economia-trabajo/`).

| Indicador | Fuente | Tabla / fichero | Fecha de referencia |
|---|---|---|---|
| Puestos de trabajo por cada 100 residentes que trabajan | Comunidad de Madrid (explotación de ficheros de la TGSS) | [afiliados por ubicación del centro de trabajo](https://datos.comunidad.madrid/dataset/afiliados_por_ubicacion_y_regimen) ÷ [afiliados por lugar de residencia](https://datos.comunidad.madrid/dataset/afiliados_por_residencia_y_sexo) | 31-12-2025 / 1-1-2026 |
| % de ocupados que trabaja en su propio municipio | INE, Censo anual de población | [tabla 69986](https://www.ine.es/jaxiT3/Tabla.htm?t=69986) | 2021, 2022, 2023 |
| Paro registrado | SEPE, datos abiertos | [Paro registrado por municipio](https://datos.gob.es/es/catalogo/ea0041513-paro-registrado-por-municipio) | media mensual 2015-2025; agosto de 2026 |
| Población de 16 a 64 años (denominador del paro) | INE, Padrón continuo 2015-2019 y Censo anual 2021-2025 | [padrón, fichero 00028006](https://www.ine.es/jaxi/Tabla.htm?path=/t20/e245/p05/a2015/l0/&file=00028006.px); [tabla 68543](https://www.ine.es/jaxiT3/Tabla.htm?t=68543) | 1 de enero de cada año |
| Contratos y % de indefinidos | SEPE, datos abiertos | [Contratos registrados por municipio](https://datos.gob.es/es/catalogo/ea0041513-contratos-registrados-por-municipio) | año 2025 completo |
| Temporalidad de los vecinos afiliados | Comunidad de Madrid | [afiliados por residencia y tipo de contrato](https://datos.comunidad.madrid/dataset/afiliados_por_residencia_y_contrato) | 1-1-2026 |

## Resultados

### 1. Empleo en el municipio

| Municipio | Afiliados con centro de trabajo en el municipio (31-12-2025) | Afiliados residentes (1-1-2026) | **Puestos por cada 100 residentes que trabajan** | Ocupados residentes, Censo 2023 | Trabajan en su municipio | **% que trabaja en su municipio** |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 19.110 | 58.796 | **32,5** | 57.167 | 7.111 | **12,4** |
| Getafe | 83.410 | 87.710 | **95,1** | 84.531 | 16.145 | **19,1** |
| Leganés | 64.705 | 86.556 | **74,8** | 81.948 | 12.631 | **15,4** |
| Fuenlabrada | 47.920 | 91.755 | **52,2** | 86.670 | 13.267 | **15,3** |
| Móstoles | 46.245 | 94.844 | **48,8** | 90.150 | 13.567 | **15,0** |
| Alcorcón | 51.630 | 80.702 | **64,0** | 75.835 | 12.068 | **15,9** |
| Alcobendas | 133.415 | 58.632 | **227,5** | 53.265 | 11.889 | **22,3** |
| Pinto | 22.020 | 24.677 | **89,2** | 26.529 | 4.516 | **17,0** |
| Torrejón de Ardoz | 40.175 | 65.933 | **60,9** | 64.817 | 12.748 | **19,7** |
| Pozuelo de Alarcón | 86.730 | 40.362 | **214,9** | 38.924 | 6.309 | **16,2** |
| Majadahonda | 35.530 | 33.541 | **105,9** | 31.814 | 5.242 | **16,5** |

Parla es la última de los once en los dos indicadores. Su cociente de puestos por cada 100 residentes no ha
cambiado desde 2013 (entre 32,5 y 34,6 todos los años; serie completa en el JSON).

### 2. Paro registrado (media de los 12 meses de 2025)

Los parados registrados se dividen entre la población de 16 a 64 años a 1-1-2025 (Censo anual del INE).
**El resultado no es la tasa de paro** (que se calcula sobre la población activa): son parados registrados
por cada 100 personas en edad de trabajar.

| Municipio | Parados (media 2025) | Pob. 16-64 | **Parados / 100 hab. 16-64** | Parados <25 | Pob. 16-24 | **Parados <25 / 100 hab. 16-24** | Paradas | Mujeres 16-64 | **Paradas / 100 mujeres 16-64** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Parla | 7.077 | 93.075 | **7,60** | 568 | 15.029 | **3,78** | 4.510 | 46.347 | **9,73** |
| Getafe | 8.270 | 126.795 | **6,52** | 651 | 18.927 | **3,44** | 5.065 | 63.880 | **7,93** |
| Leganés | 8.445 | 124.626 | **6,78** | 671 | 19.466 | **3,45** | 5.105 | 62.947 | **8,11** |
| Fuenlabrada | 9.246 | 126.822 | **7,29** | 821 | 20.672 | **3,97** | 5.763 | 64.537 | **8,93** |
| Móstoles | 9.389 | 134.511 | **6,98** | 673 | 19.446 | **3,46** | 5.694 | 67.903 | **8,38** |
| Alcorcón | 7.092 | 112.856 | **6,28** | 522 | 18.024 | **2,90** | 4.330 | 56.999 | **7,60** |
| Alcobendas | 3.792 | 81.564 | **4,65** | 201 | 13.356 | **1,50** | 2.266 | 42.250 | **5,36** |
| Pinto | 2.394 | 38.869 | **6,16** | 202 | 6.099 | **3,31** | 1.580 | 19.578 | **8,07** |
| Torrejón de Ardoz | 6.343 | 97.738 | **6,49** | 481 | 14.417 | **3,34** | 3.945 | 49.014 | **8,05** |
| Pozuelo de Alarcón | 1.914 | 57.323 | **3,34** | 78 | 11.509 | **0,68** | 1.085 | 29.859 | **3,63** |
| Majadahonda | 1.827 | 47.501 | **3,85** | 81 | 9.112 | **0,89** | 1.031 | 24.879 | **4,14** |

Parla tiene el mayor cociente general y el mayor entre mujeres de los once. En menores de 25 la primera es Fuenlabrada.
En Parla el 64 % de los parados son mujeres.

Último mes publicado (agosto de 2026; denominador: población a 1-1-2025): Parla 6.732 parados (7,23 por
cada 100 hab. de 16-64), 567 menores de 25, 4.198 mujeres. El resto está en `detalle.paro_ultimo_mes`.

**Serie: parados (media anual) por cada 100 habitantes de 16 a 64 años**

| Municipio | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Parla | 15,52 | 14,19 | 12,62 | 11,43 | 10,71 | — | 12,54 | 9,88 | 9,12 | 8,33 | 7,60 |
| Getafe | 12,25 | 11,16 | 9,91 | 8,98 | 8,40 | — | 10,36 | 7,79 | 7,38 | 6,97 | 6,52 |
| Leganés | 13,40 | 12,16 | 10,83 | 9,81 | 9,22 | — | 10,69 | 8,37 | 7,71 | 7,19 | 6,78 |
| Fuenlabrada | 13,54 | 12,09 | 10,71 | 9,88 | 9,42 | — | 11,08 | 8,67 | 8,35 | 7,75 | 7,29 |
| Móstoles | 12,99 | 11,84 | 10,62 | 9,74 | 9,13 | — | 10,90 | 8,55 | 7,96 | 7,49 | 6,98 |
| Alcorcón | 12,49 | 11,35 | 10,10 | 9,12 | 8,61 | — | 9,97 | 7,62 | 7,09 | 6,62 | 6,28 |
| Alcobendas | 8,82 | 7,98 | 6,98 | 6,26 | 5,93 | — | 7,53 | 5,65 | 5,13 | 4,97 | 4,65 |
| Pinto | 12,37 | 11,27 | 9,96 | 9,21 | 8,57 | — | 9,93 | 7,70 | 7,10 | 6,63 | 6,16 |
| Torrejón de Ardoz | 13,72 | 12,38 | 10,86 | 9,79 | 9,22 | — | 11,24 | 8,54 | 7,72 | 7,07 | 6,49 |
| Pozuelo de Alarcón | 5,59 | 4,94 | 4,58 | 4,21 | 4,03 | — | 4,81 | 3,80 | 3,63 | 3,58 | 3,34 |
| Majadahonda | 6,75 | 6,07 | 5,36 | 4,88 | 4,60 | — | 5,84 | 4,42 | 4,09 | 4,02 | 3,85 |

Parla está la primera los once años. El número absoluto de parados (media anual) de 2020 sí está en el JSON. Lo que falta en 2020 es el denominador (ver cautelas).

### 3. Temporalidad

| Municipio | Contratos 2025 | Iniciales indefinidos | Iniciales temporales | Convertidos en indefinidos | **% indefinidos** | **% temporales entre los vecinos afiliados con contrato (1-1-2026)** |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 10.677 | 5.641 | 4.729 | 307 | **55,7** | **9,8** |
| Getafe | 63.645 | 25.642 | 36.547 | 1.456 | **42,6** | **9,9** |
| Leganés | 37.537 | 15.552 | 20.652 | 1.333 | **45,0** | **10,4** |
| Fuenlabrada | 31.656 | 15.444 | 15.466 | 746 | **51,1** | **9,8** |
| Móstoles | 22.397 | 11.196 | 10.554 | 647 | **52,9** | **9,5** |
| Alcorcón | 30.477 | 14.319 | 15.021 | 1.137 | **50,7** | **9,1** |
| Alcobendas | 45.982 | 22.048 | 22.423 | 1.511 | **51,2** | **8,0** |
| Pinto | 16.901 | 5.947 | 10.379 | 575 | **38,6** | **9,5** |
| Torrejón de Ardoz | 30.342 | 11.798 | 17.584 | 960 | **42,1** | **9,4** |
| Pozuelo de Alarcón | 32.736 | 13.050 | 19.105 | 581 | **41,6** | **7,2** |
| Majadahonda | 17.573 | 8.112 | 8.958 | 503 | **49,0** | **7,8** |

En este indicador Parla sale **mejor** que los demás: tiene el mayor porcentaje de contratos indefinidos de los once.
También firma muy pocos contratos para su tamaño (10.677, frente a 63.645 en Getafe), lo que concuerda con que
tiene pocos puestos de trabajo. La temporalidad de los vecinos con empleo apenas cambia entre municipios (entre el 7,2 % y el 10,4 %).

## Cómo se sacó, paso a paso

### 1a. Puestos de trabajo por cada 100 residentes que trabajan (Seguridad Social)

1. Lugar de trabajo: [Trabajadores afiliados en alta laboral a la Seguridad Social por ubicación del centro de trabajo y régimen. Municipios](https://datos.comunidad.madrid/dataset/afiliados_por_ubicacion_y_regimen),
   [CSV](https://datos.comunidad.madrid/dataset/3bb17a03-5689-46fa-8cea-14e09111d834/resource/e2542872-7859-4c1b-9a2a-bb2fb0ae3398/download/trabajadores-afiliados-en-alta-laboral-a-la-seguridad-social-por-ubicacion-del-centro-de-trabajo.csv).
   Instituto de Estadística de la Comunidad de Madrid, datos a 31 de diciembre de 1999 a 2025. Asigna cada afiliado al municipio
   donde está **su centro de trabajo**, no la sede de la empresa ni la cuenta de cotización. El fichero no trae fila de total. Se
   suman los seis regímenes (general, autónomos, empleados del hogar, agrario, mar y carbón). Los municipios llevan el código de 4 cifras de la Comunidad:
   las 3 primeras son el código INE (Parla = 1065 → 28106).
2. Lugar de residencia: [Afiliados a la Seguridad Social por lugar de residencia y sexo. Municipios](https://datos.comunidad.madrid/dataset/afiliados_por_residencia_y_sexo),
   [CSV](https://datos.comunidad.madrid/dataset/ec2166a6-2988-45a1-a1bc-71450ce95c18/resource/419f7aa5-221a-4b20-9347-4f007519525e/download/afiliados-a-la-seguridad-social-por-lugar-de-residencia-y-sexo.-municipios.csv).
   Datos a 1 de enero de 2014 a 2026. Municipio de residencia según la Seguridad Social. Se usa la fila `Sexo = Total`.
3. Cociente = afiliados con centro de trabajo en el municipio a 31-12-A × 100 / afiliados residentes a 1-1-(A+1).
   Las dos fechas distan un día. Hay serie de 2013 a 2025.
4. Qué cuenta: afiliaciones en alta a la Seguridad Social. **No cuenta** a los funcionarios del régimen de clases pasivas
   (MUFACE, ISFAS, MUGEJU) ni el empleo sin alta. Una persona con dos empleos puede contar dos veces en el lugar de trabajo.

### 1b. % de ocupados que trabaja en su propio municipio (Censo)

1. INE, Censo anual de población, [tabla 69986](https://www.ine.es/jaxiT3/Tabla.htm?t=69986) «Ocupados de 16 y más años por sexo,
   ocupación 1d y lugar de trabajo (Capitales de provincia y principales ciudades)». [CSV completo](https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/69986.csv).
   Están los once municipios. Hay datos de 2021, 2022 y 2023.
2. Filtro: `Sexo = Total`, `Ocupación = Total`. Categorías de «Lugar trabajo»: mismo municipio de residencia; distinto municipio de la misma
   provincia; distinta provincia de la misma comunidad (0 en Madrid, que es uniprovincial); otra comunidad autónoma; trabaja pero no hay
   información sobre el lugar de trabajo. Las cinco suman exactamente el total en los 11 municipios y los 3 años.
3. Cociente = «mismo municipio» / total de ocupados residentes. El JSON también da el cociente sin los casos sin información
   (Parla 2023: 12,7 %).
4. Cómo asigna el INE el lugar de trabajo ([metodología del Censo 2021](https://www.ine.es/censos2021/censos2021_meto.pdf), págs. 50-52).
   Parte de la provincia de la cuenta de cotización. Para los asalariados usa el «domicilio de la actividad» a nivel de municipio del fichero de afiliaciones de la TGSS,
   o el municipio de trabajo de los contratos del SEPE. Para los autónomos usa el DIRCE. El propio INE avisa: «no va a reflejar situaciones como el teletrabajo o el
   trabajo en varios municipios distintos», y llama a estas matrices de movilidad «una primera aproximación».

### 2. Paro registrado

1. SEPE, datos abiertos, [Paro registrado por municipio](https://datos.gob.es/es/catalogo/ea0041513-paro-registrado-por-municipio).
   Un CSV por año: `https://sede.sepe.gob.es/es/portaltrabaja/resources/sede/datos_abiertos/datos/Paro_por_municipios_AAAA_csv.csv`, de 2015 a 2026
   (por ejemplo, [2025](https://sede.sepe.gob.es/es/portaltrabaja/resources/sede/datos_abiertos/datos/Paro_por_municipios_2025_csv.csv)).
   Codificación latin-1, separador `;`, columnas «total Paro Registrado» y paro por sexo y tramo de edad (<25, 25-44, ≥45).
   Datos del último día de cada mes. El de 2026 llega hasta agosto.
2. **Falta diciembre de 2020** en el CSV de 2020. Se tomó del [PDF mensual del SEPE de municipios de Madrid, diciembre de 2020](https://www.sepe.es/HomeSepe/dam/jcr:2fe83352-24ee-4052-99e1-e53d72c7ef2b/MUNI_MADRID_1220.pdf)
   (el XLS gemelo está corrupto) y se comprobó que el total es la suma de los seis grupos de sexo y edad.
3. Media anual = media de los 12 meses. Menores de 25 = hombres <25 + mujeres <25. Mujeres = suma de los tres tramos de mujeres.
   Comprobado: hombres + mujeres = total en agosto de 2026 en los 11.
4. Denominador, población a 1 de enero del mismo año, edad año a año, sumando las edades de 16 a 64:
   - 2015-2019: INE, Estadística del Padrón Continuo, «Población por sexo, municipios y edad (año a año)», Madrid, fichero `00028006.px`
     ([2015](https://www.ine.es/jaxi/Tabla.htm?path=/t20/e245/p05/a2015/l0/&file=00028006.px); PX en
     `https://www.ine.es/jaxi/files/_px/es/px/t20/e245/p05/aAAAA/l0/00028006.px`). La suma de edades coincide con la fila Total.
   - 2021-2025: INE, Censo anual de población, [tabla 68543](https://www.ine.es/jaxiT3/Tabla.htm?t=68543)
     «Población por sexo, edad (año a año) y nacionalidad» (capitales y principales ciudades, entre ellas las 11), [CSV](https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/68543.csv),
     con `Nacionalidad = Total`. Se suman las edades de 16 a 64 (ambos sexos y mujeres) y de 16 a 24.
   - 2020: sin denominador. El fichero del padrón no existe para 2020 ni para años posteriores (el INE devuelve vacío), y el Censo anual empieza en 2021.

### 3. Temporalidad

1. SEPE, datos abiertos, [Contratos registrados por municipio](https://datos.gob.es/es/catalogo/ea0041513-contratos-registrados-por-municipio),
   [CSV 2025](https://sede.sepe.gob.es/es/portaltrabaja/resources/sede/datos_abiertos/datos/Contratos_por_municipios_2025_csv.csv). Se suman los 12 meses.
2. Total = iniciales indefinidos + iniciales temporales + convertidos en indefinidos. Cuadra al contrato en los 11 municipios y ninguna celda
   viene como «<5». % indefinidos = (iniciales indefinidos + convertidos) / total.
3. Complemento: [Afiliados por lugar de residencia y tipo de contrato](https://datos.comunidad.madrid/dataset/afiliados_por_residencia_y_contrato),
   [CSV](https://datos.comunidad.madrid/dataset/005b7b16-a8eb-4f47-b249-9af13a5f7c4c/resource/6328dfff-92f8-4628-87c1-09cf755a055f/download/afiliados-a-la-seguridad-social-por-lugar-de-residencia-y-tipo-de-contrato.-municipios.csv),
   a 1-1-2026. Temporales / (indefinidos + temporales). «No consta» (sobre todo autónomos) queda fuera.

## Cautelas

- **Las dos medidas de empleo local no miden lo mismo y no deben mezclarse.** La de la Seguridad Social cuenta puestos que hay en el municipio, los ocupe quien los ocupe.
  La del Censo cuenta vecinos que trabajan en el mismo municipio. En Parla, en 2023, había 18.570 afiliaciones con centro de trabajo en el municipio y
  7.111 vecinos con trabajo registrado en Parla. El resto de esos puestos lo ocupan personas de fuera, o son pluriempleo, o son errores de asignación del registro.
- El % del Censo es bajo en todos los municipios, también en Getafe (19 %) y Alcobendas (22 %). Hasta la ciudad de Madrid da un 70 %. Es una medida
  hecha con registros que tiende a infravalorar el trabajo local: una cadena que da de alta a sus empleados en la sede de otro municipio
  «saca» ese empleo. Sirve para comparar municipios entre sí y no como cifra absoluta. No es comparable con el Censo 2011, que preguntaba directamente.
- Afiliados de la Comunidad de Madrid: desde 2021 cada régimen viene redondeado a múltiplos de 5, y la suma puede desviarse unas decenas. A los autónomos
  se les asigna su centro de trabajo declarado, que muchas veces es su casa. Eso sube algo el cociente de los municipios con más autónomos en proporción
  (en Parla, 6.315 de los 19.110 son autónomos).
- Paro registrado ≠ tasa de paro EPA. Solo cuenta a quien se inscribe en la oficina de empleo. Los jóvenes se inscriben poco, y por eso los cocientes de menores de 25 son
  bajos. La web ya cita la tasa de paro estimada del INE (Indicadores Urbanos, [tabla 69331](https://www.ine.es/jaxiT3/Tabla.htm?t=69331)), que es otra medida.
- La serie del denominador cambia de fuente en 2021 (padrón → Censo anual). La diferencia es pequeña (Parla, 16-64: 87.454 en 2019 según el padrón y 87.179 en 2021 según el Censo),
  pero existe. El Censo anual da a Parla 138.012 habitantes a 1-1-2025, frente a los 137.471 de las cifras oficiales del padrón (+0,4 %).
  El salto de 2021 en la serie (12,5 frente a 10,7 en 2019) es real: es el paro de la pandemia.
- Contratos: se asignan al municipio del centro de trabajo. Es el criterio habitual del SEPE, pero la ficha del fichero no lo dice expresamente.
  Miden contratos firmados, no personas ni empleos: un empleo de una semana renovado cincuenta veces suma 50 contratos, y por eso los municipios con
  logística o industria (Getafe, Pinto) salen con más temporalidad. Desde la reforma laboral de 2022 los fijos discontinuos cuentan como indefinidos.

## Lo que se buscó y no se encontró

- **Matriz origen-destino municipal del Censo 2021** (cuántos trabajan en Parla viniendo de cada municipio): el INE no la publica en tablas.
  Por eso los «puestos por cada 100 ocupados residentes» no se pueden calcular con el Censo y salen de la Seguridad Social.
- **Ocupados por municipio de trabajo en el Censo**: la tabla 69986 y las demás «por lugar de trabajo» están ordenadas por residencia, no por lugar de trabajo.
- **Padrón por edad simple, 2020-2025**: el fichero municipal del padrón continuo por edad año a año solo existe hasta 2019 en la ruta del INE.
  Desde 2021 el INE (y la propia Comunidad de Madrid) publican la edad municipal con el Censo anual. No hay una fuente del INE con edad simple a 1-1-2020 para estos municipios,
  así que 2020 queda sin cociente.
- **XLS de diciembre de 2020 del SEPE**: corrupto (no se puede leer). Se usó el PDF.
- **Paro de septiembre de 2026**: el SEPE aún no lo ha subido a los CSV de datos abiertos. El último mes es agosto de 2026.
- **Nota metodológica del SEPE** que diga expresamente a qué municipio se asigna cada contrato: no se encontró.

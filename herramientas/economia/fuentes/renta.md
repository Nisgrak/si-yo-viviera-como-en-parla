# Renta: fuentes y extracción

Extraído el **19-10-2026**. Datos en `renta.json` (mismo formato que `herramientas/vivienda/fuentes/hogares.json`:
`_meta` con fuentes y notas, y una clave por municipio). Descargas en bruto en `/tmp/claude-1000/economia-renta/`
(fuera del repo).

## 1. INE · Atlas de Distribución de Renta de los Hogares (ADRH)

**Último año: 2024.** El INE publicó el ADRH 2024 el 19-10-2026 (las tablas llevan fecha de
modificación 15-10-2026); la web usa todavía 2023. Comprobado en
[Últimos datos del ADRH](https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177088&menu=ultiDatos&idp=1254735976608).
Los valores 2023 descargados hoy son idénticos a los que ya usa la web: no hay revisión.

Tablas de la **provincia de Madrid** (el INE numera por provincia; la lista sale de
`https://servicios.ine.es/wstempus/js/ES/TABLAS_OPERACION/353`):

| Qué | Tabla | API usada |
|---|---|---|
| Renta neta y bruta media por persona y por hogar; media y mediana por unidad de consumo, 2015-2024 | [31097](https://www.ine.es/jaxiT3/Tabla.htm?t=31097) | `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/31097?nult=12` |
| Distribución por fuente de ingresos (% sobre renta bruta) | [31098](https://www.ine.es/jaxiT3/Tabla.htm?t=31098) | `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/31098?nult=12` |
| Índice de Gini y P80/P20 | [37727](https://www.ine.es/jaxiT3/Tabla.htm?t=37727) | `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/37727?nult=12` |
| (control) Población bajo umbrales relativos | [31102](https://www.ine.es/jaxiT3/Tabla.htm?t=31102) | `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/31102?nult=2` |

La tabla de Gini de Madrid (37727) no sigue la numeración 310xx: se localizó recorriendo las
tablas «Índice de Gini y Distribución de la renta P80/P20» de la operación 353 y mirando qué
municipios contenía cada una. Las series de municipio se identifican por el nombre exacto
(`"Parla. Dato base. Renta neta media por persona. "`, etc.), lo que deja fuera distritos y secciones.

Definiciones: [metodología del ADRH](https://www.ine.es/metodologia/metodologia_adrh.pdf).

### Renta neta media por persona (€ corrientes)

| | 2015 | 2019 | 2023 | **2024** | 2015→2024 | por hogar 2024 |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 8.522 | 9.717 | 11.522 | **12.175** | +42,9 % | 37.572 |
| Fuenlabrada | 9.400 | 11.099 | 13.454 | **14.321** | +52,4 % | 40.350 |
| Móstoles | 10.499 | 11.980 | 14.045 | **14.858** | +41,5 % | 40.872 |
| Torrejón de Ardoz | 10.519 | 12.165 | 14.463 | **15.331** | +45,7 % | 44.015 |
| Leganés | 10.959 | 12.462 | 14.531 | **15.370** | +40,3 % | 40.995 |
| Pinto | 11.412 | 13.013 | 15.301 | **16.162** | +41,6 % | 45.164 |
| Alcorcón | 11.917 | 13.355 | 15.667 | **16.534** | +38,7 % | 44.058 |
| Getafe | 11.729 | 13.326 | 15.867 | **16.767** | +43,0 % | 44.326 |
| Alcobendas | 17.417 | 18.653 | 21.644 | **23.325** | +33,9 % | 70.503 |
| Majadahonda | 18.627 | 20.652 | 24.019 | **25.878** | +38,9 % | 80.332 |
| Pozuelo de Alarcón | 23.861 | 26.367 | 30.524 | **32.612** | +36,7 % | 102.629 |

La serie completa 2015-2024 (neta y bruta, por persona y por hogar, media y mediana por unidad de
consumo) está en `renta.json`.

### Fuentes de ingreso, 2024 (% de la renta bruta)

| | salario | pensiones | desempleo | otras prestaciones | otros ingresos |
|---|---:|---:|---:|---:|---:|
| Parla | 71,2 | 15,2 | 2,0 | 4,8 | 6,9 |
| Getafe | 68,1 | 17,5 | 1,3 | 3,7 | 9,4 |
| Leganés | 65,3 | 21,0 | 1,4 | 3,9 | 8,4 |
| Fuenlabrada | 67,5 | 19,6 | 1,7 | 4,4 | 6,9 |
| Móstoles | 63,8 | 23,1 | 1,5 | 4,1 | 7,4 |
| Alcorcón | 66,1 | 20,2 | 1,3 | 3,7 | 8,8 |
| Alcobendas | 63,5 | 11,5 | 0,8 | 2,5 | 21,8 |
| Pinto | 72,4 | 13,7 | 1,4 | 3,4 | 9,0 |
| Torrejón de Ardoz | 71,3 | 15,7 | 1,6 | 3,8 | 7,6 |
| Pozuelo de Alarcón | 59,8 | 11,2 | 0,4 | 2,0 | 26,6 |
| Majadahonda | 62,8 | 14,6 | 0,6 | 2,5 | 19,5 |

**Cautela: el INE ya no publica euros por persona por fuente.** Desde la edición 2023 solo da el
porcentaje sobre la renta bruta (antes daba importes). Lo que pide «euros por persona de salario»
solo se puede obtener multiplicando el porcentaje por la renta bruta media por persona del mismo
año: está en `renta.json` como `fuentes_ingreso_eur_persona_2024_derivado`, marcado como cálculo
propio. Ejemplo: Parla, salario 71,2 % × 14.349 € = 10.216 €; Pozuelo, 59,8 % × 47.217 € = 28.236 €.
Las cinco categorías son exhaustivas y suman 100 ± 0,1. «Otros ingresos» agrupa capital
mobiliario, alquileres, actividades económicas y rentas imputadas: por eso pesa tanto en Pozuelo,
Alcobendas y Majadahonda. También se guarda el reparto de 2023.

### Desigualdad dentro de cada municipio, 2024

| | Gini | P80/P20 |
|---|---:|---:|
| Parla | 28,3 | 2,4 |
| Getafe | 29,1 | 2,5 |
| Leganés | 28,8 | 2,4 |
| Fuenlabrada | 25,5 | 2,2 |
| Móstoles | 27,2 | 2,4 |
| Alcorcón | 28,5 | 2,5 |
| Alcobendas | 42,5 | 3,2 |
| Pinto | 27,8 | 2,3 |
| Torrejón de Ardoz | 27,9 | 2,4 |
| Pozuelo de Alarcón | 40,4 | 3,2 |
| Majadahonda | 37,0 | 3,2 |

Gini en escala 0-100, sobre la renta por unidad de consumo; antes de calcularlo el INE sustituye
el 1,5 % de valores más bajos y más altos por el más próximo, así que sale más bajo que un Gini sin
recortar. P80/P20 = percentil 80 / percentil 20 de la renta por unidad de consumo. Mide la
desigualdad **interna** de cada municipio: que Parla tenga un Gini bajo no quiere decir que esté
bien, sino que es pobre de forma bastante homogénea. Se guarda también 2023.

## 2. Agencia Tributaria · Estadística de los declarantes del IRPF por municipios, 2024

[Portada](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/irpfmunicipios/2024/home.html)
→ «Detalle municipios con más de 1.000 hab.» → «Datos municipales por ámbito territorial y
tamaño» → Madrid → municipio. Las URL de la ficha de cada municipio son las mismas que ya usa
`herramientas/vivienda/fuentes/propiedad.json` y están en `_meta.fuentes.aeat_irpf_2024_<id>` y en
`irpf_2024.url` de cada municipio. Se comprobó que cada ficha descargada lleva el código INE correcto.
Descargadas con `curl -k`. El ejercicio 2025 no está publicado (`.../irpfmunicipios/2025/home.html`
da 404 el 19-10-2026).

| | declaraciones | renta bruta media | renta disponible media | rto. trabajo medio (neto reducido) | decl. con rto. trabajo | % de las declaraciones |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 63.046 | 26.851 | 22.420 | 21.372 | 58.326 | 92,5 |
| Getafe | 109.662 | 34.579 | 27.854 | 27.744 | 103.087 | 94,0 |
| Leganés | 103.691 | 31.320 | 25.628 | 25.070 | 97.186 | 93,7 |
| Fuenlabrada | 101.195 | 28.306 | 23.472 | 22.703 | 94.912 | 93,8 |
| Móstoles | 112.543 | 30.029 | 24.752 | 24.198 | 105.665 | 93,9 |
| Alcorcón | 97.232 | 33.865 | 27.371 | 27.299 | 91.345 | 93,9 |
| Alcobendas | 62.698 | 68.574 | 50.731 | 47.023 | 57.537 | 91,8 |
| Pinto | 30.703 | 34.299 | 27.613 | 27.351 | 28.892 | 94,1 |
| Torrejón de Ardoz | 76.322 | 32.045 | 26.009 | 25.731 | 71.905 | 94,2 |
| Pozuelo de Alarcón | 49.827 | 92.564 | 66.690 | 64.833 | 44.507 | 89,3 |
| Majadahonda | 40.119 | 64.268 | 48.089 | 48.567 | 36.382 | 90,7 |

Qué es cada columna:

- **Renta bruta media / renta disponible media**: importe total / número de declaraciones (se
  comprobó que cuadra al euro). Renta disponible = bruta − cotizaciones sociales − cuota
  resultante de la autoliquidación.
- **Rendimiento del trabajo medio**: es la partida «RENDIMIENTOS DEL TRABAJO (neto reducido)»; su
  media la publica la AEAT dividiendo entre las declaraciones que **tienen** esa partida (en Parla,
  52.574), no entre todas. Junto a ella se guardan los ingresos íntegros del trabajo (media 24.839
  en Parla, sobre 58.326 declaraciones), que es lo que está en la columna «decl. con rto. trabajo».
  El porcentaje es 58.326 / 63.046, cálculo propio.
- `rentas_trabajo_media_por_declaracion` (en el JSON) es cálculo propio: rentas del trabajo del
  bloque de renta bruta / todas las declaraciones.
- Los rendimientos del trabajo de la AEAT incluyen pensiones y prestaciones por desempleo sujetas,
  no solo salarios.
- También se guardan titulares, habitantes según la AEAT (coinciden con las cifras oficiales a
  1-1-2025) e índice declarativo (declaraciones por cada 100 habitantes: Parla 51,5, la más baja de
  las once; Alcobendas 54,8; las demás entre 57,9 y 62,3).

## Comprobación de plausibilidad

- La «renta por habitante» que ya publica la web (Comunidad de Madrid, *Indicador de Renta
  Disponible Bruta Municipal* 2023: Parla 13.534, Alcobendas 29.659, Pozuelo 44.016,
  Majadahonda 32.413, y las demás) coincide **al euro** con la **renta bruta media por persona**
  del ADRH 2023 (tabla 31097) en los once municipios. O sea: la cifra de la Comunidad es la renta
  bruta del INE, no la neta, aunque se llame «disponible». Si la web pasa a 2024, la cifra
  equivalente es Parla 14.349 (en `renta_bruta_media_persona.2024`).
- Pobreza 2023 (tabla 31102, bajo el 60 % de la mediana) descargada hoy: Parla 27,2, Getafe 15,8,
  Pozuelo 8,5, etc. Idéntica a la tabla del README.
- Renta neta y bruta media por hogar de Parla 2023 (35.177 y 41.321) coinciden con las que usan
  `herramientas/vivienda/fuentes/parque.json` y `alquiler.json`.
- Orden: Parla es la última de las once en renta neta por persona y por hogar (ADRH) y en renta
  bruta y disponible por declaración (AEAT 2024).

## Cautelas

1. **ADRH y AEAT no se pueden mezclar.** El ADRH reparte la renta entre todas las personas y
   hogares, incluidos los que no declaran (usa también los modelos 190, etc.); la AEAT divide
   entre declaraciones (una conjunta puede llevar dos titulares) y deja fuera a quien no declara.
   Por eso la renta bruta de Parla es 14.349 € por persona en el ADRH y 26.851 € por declaración
   en la AEAT. El denominador de cada cifra va en su nombre.
2. El ADRH divide entre la «población encontrada» (residentes con información fiscal), no entre el
   padrón. No incluye retribuciones en especie ni el alquiler imputado de la vivienda propia.
3. Euros corrientes: las subidas 2015-2024 no descuentan la inflación.
4. En la serie del ADRH, Alcobendas y Pozuelo **bajan** de 2018 a 2019 (Alcobendas 20.148 → 18.653;
   Pozuelo 28.326 → 26.367 por persona). Está así en el dato publicado; no se ha encontrado
   explicación oficial. Es probable que pese la acotación de rentas individuales a ±3 millones de
   euros, que afecta sobre todo a los municipios ricos, pero no está verificado.
5. Los euros por persona por fuente de ingreso son derivados (porcentaje × renta bruta por
   persona), con un error de redondeo de hasta ±0,05 puntos del porcentaje.
6. Gini y P80/P20 miden la desigualdad dentro de cada municipio, no entre municipios.
7. IRPF: excluye País Vasco y Navarra (aquí no afecta) y a quien no declara. El índice declarativo
   más bajo de Parla quiere decir que en Parla falta, en proporción, más gente en la estadística
   de la AEAT (lo esperable es que sean sobre todo rentas bajas que no están obligadas a
   declarar). Si es así, la media por declaración favorece a Parla más que a los demás; la
   diferencia real sería mayor, no menor. Es una inferencia, no un dato.

## Lo que se buscó y no salió

- **ADRH, euros por persona por fuente de ingreso**: ya no se publican (solo porcentajes desde la
  edición 2023, también para años anteriores). Solo derivados, ver arriba.
- **AEAT 2025**: no publicado (404). Lo último es 2024.
- **Media de la Comunidad de Madrid en el ADRH**: las tablas provinciales 31097/31098/37727 dan
  municipios, distritos y secciones, no el total provincial o regional (está en las tablas
  nacionales por comunidades y provincias, que no se han descargado). En la AEAT el total de la
  Comunidad sí existe en la misma estadística, pero tampoco se ha extraído.
- **Mediana de la renta por persona**: el ADRH solo publica la mediana **por unidad de consumo**
  (guardada en el JSON, con la media por unidad de consumo), no por persona ni por hogar.

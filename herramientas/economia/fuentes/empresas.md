# Empresas y tejido productivo

Extracción: 19-10-2026. Datos en `empresas.json` (mismo directorio). Las descargas en bruto se quedaron fuera del repo, en `/tmp/claude-1000/economia-empresas/`.

## 1. Empresas activas (INE, DIRCE municipal)

- Tabla: «Empresas por municipio y actividad principal», INE tabla 4721 — https://www.ine.es/jaxiT3/Tabla.htm?t=4721
- Cómo se sacó: con la API JSON del INE, `DATOS_TABLA/4721?nult=1` para localizar las series de los 11 municipios (por nombre exacto) y `DATOS_SERIE/<COD>?nult=30` para la serie 2012-2025. Los códigos de serie están en `ine_series` de cada municipio (Parla, total: DIR450461).
- Nota metodológica: https://www.ine.es/daco/daco42/dirce/metodologia_municipios_dirce.pdf
- Denominador: padrón INE a 1 de enero del mismo año (tabla 2881, https://www.ine.es/jaxiT3/Tabla.htm?t=2881). Las empresas también son a 1 de enero, así que se cuentan el mismo día.

| | Empresas 2025 | por 1.000 hab. 2025 | % industria | % construcción | % comercio, transporte y hostelería | % resto de servicios | Empresas 2015* | por 1.000 hab. 2015* | Var. 2023-2025 |
|---|---|---|---|---|---|---|---|---|---|
| Parla | 5.376 | 39,1 | 3,1 | 19,7 | 42,3 | 34,8 | 4.393 | 35,1 | +5,4 % |
| Getafe | 9.655 | 50,0 | 4,0 | 14,2 | 36,3 | 45,5 | 8.526 | 48,7 | +4,0 % |
| Leganés | 9.301 | 47,5 | 4,3 | 15,7 | 37,2 | 42,8 | 9.357 | 50,1 | +2,2 % |
| Fuenlabrada | 10.090 | 53,1 | 6,0 | 15,8 | 43,9 | 34,3 | 10.608 | 54,4 | +2,1 % |
| Móstoles | 9.200 | 42,8 | 3,9 | 15,8 | 36,1 | 44,2 | 9.567 | 46,4 | +1,7 % |
| Alcorcón | 8.883 | 50,6 | 4,1 | 13,2 | 34,8 | 47,9 | 8.891 | 53,2 | +3,1 % |
| Alcobendas | 10.393 | 84,3 | 3,5 | 8,5 | 25,4 | 62,7 | 10.056 | 89,0 | +6,3 % |
| Pinto | 3.306 | 58,4 | 7,0 | 11,0 | 38,1 | 44,0 | 2.980 | 61,2 | +6,3 % |
| Torrejón | 6.457 | 45,0 | 5,2 | 14,6 | 38,1 | 42,1 | 5.965 | 47,0 | +3,5 % |
| Pozuelo | 10.835 | 120,7 | 2,1 | 6,8 | 17,0 | 74,1 | 10.451 | 123,6 | +3,7 % |
| Majadahonda | 6.667 | 90,6 | 2,0 | 5,8 | 18,6 | 73,6 | 6.549 | 92,5 | +1,8 % |
| Comunidad (ref.) | 526.588 | 73,8 | 3,3 | 10,3 | 27,2 | 59,2 | 508.612 | 79,0 | |

\* La comparación con 2015 no es homogénea (ver la primera cautela).

Cautelas:
- **Ruptura de serie.** El INE (https://www.ine.es/dyngs/Prensa/es/DIRCE2025.htm) dice: «La nueva definición de empresa económicamente activa, implementada en 2022, afecta al cómputo del número de empresas activas, por lo que existe una ruptura de serie en 2022 y los datos no son comparables con los de años anteriores». En la serie municipal la ruptura aparece como una caída de alrededor del 8 % entre el dato a 1-1-2022 y el de 1-1-2023, en los 11 municipios a la vez (en España, de 3.430.663 a 3.207.580). Por eso **no se debe publicar una evolución 2015-2025**. La variación comparable más larga es 2023-2025. Los datos de 2015 se guardan marcados con `comparable_2015_2025: false`.
- **Cada empresa cuenta donde tiene la sede**, no donde tiene locales o trabajadores. Esto infla los municipios donde se domicilian sociedades (Pozuelo, Majadahonda, Alcobendas) y desinfla los municipios dormitorio.
- No incluye agricultura (A), Administración pública (O) ni hogares como empleadores (T).
- La API del INE llama a la industria «Industrias extractivas (excepto construcción)», pero según la nota metodológica es A2 = secciones B, C, D y E, es decir, toda la industria. Los cuatro grandes sectores suman exactamente el total (comprobado en los 11 municipios, en 2015 y en 2025).
- La referencia de la Comunidad incluye Madrid capital, donde se concentran las sedes. No sirve como media de municipios comparables.

## 2. Locales y establecimientos

**No salió nada comparable y reciente.**
- El INE solo publica locales del DIRCE por provincia (tablas 295, 303, 306 y 73023), no por municipio. La difusión municipal del DIRCE se limita a empresas por sede (tabla 4721).
- La Comunidad de Madrid tiene «Locales por 1000 hab. Municipios» (https://datos.comunidad.madrid/catalogo/dataset/1003325) y «Locales en edificios» (dataset 1003056). Los dos son del **Censo de 2001**: miden recintos físicos, no establecimientos con actividad, y son demasiado antiguos. Se descartan.

## 3. Qué se produce y en qué se trabaja: PIB por rama y afiliados por rama

### PIB municipal (Comunidad de Madrid, base 2021)
- Per cápita por rama: https://datos.comunidad.madrid/catalogo/dataset/pib_municipal_per_capita_2021
- Porcentaje por rama (oficial, no calculado aquí): https://datos.comunidad.madrid/catalogo/dataset/pib_municipal_porcentaje_2021
- Serie anterior, base 2015 actualizada (2015-2020): https://datos.comunidad.madrid/catalogo/dataset/pib_municipal_per_capita_2015_act
- Comprobación: las cifras de 2023 coinciden con `datos/datos.js` (Parla 14.021 €, Getafe 37.722 €, …; industria en Parla 1.398 €, en Pinto 7.505 €, …). Las ramas per cápita suman el total.

| | PIB per cápita 2021 | 2022 | 2023 (prov.) | % industria y energía 2023 | % construcción 2023 | % servicios 2023 | % de la media regional 2015 (base 2015) | % de la media regional 2023 (base 2021) |
|---|---|---|---|---|---|---|---|---|
| Parla | 11.594 | 12.953 | 14.021 | 9,97 | 14,82 | 75,15 | 30,7 | 32,3 |
| Getafe | 30.336 | 35.262 | 37.722 | 17,25 | 9,92 | 72,78 | 79,2 | 86,9 |
| Leganés | 24.512 | 27.815 | 28.654 | 11,68 | 11,64 | 76,65 | 68,6 | 66,0 |
| Fuenlabrada | 20.830 | 23.709 | 25.566 | 15,64 | 11,89 | 72,41 | 57,7 | 58,9 |
| Móstoles | 16.127 | 17.765 | 18.993 | 9,25 | 10,53 | 80,15 | 44,8 | 43,7 |
| Alcorcón | 24.607 | 28.315 | 28.390 | 11,54 | 10,17 | 77,80 | 64,2 | 65,4 |
| Alcobendas | 70.139 | 79.655 | 85.853 | 11,81 | 4,60 | 83,57 | 208,7 | 197,8 |
| Pinto | 30.098 | 34.837 | 36.822 | 20,38 | 8,87 | 70,69 | 84,2 | 84,8 |
| Torrejón | 22.175 | 25.056 | 26.657 | 24,81 | 7,33 | 67,83 | 66,0 | 61,4 |
| Pozuelo | 60.271 | 65.052 | 72.166 | 2,73 | 3,31 | 93,91 | 175,2 | 166,2 |
| Majadahonda | 32.121 | 36.227 | 40.886 | 2,39 | 4,29 | 93,26 | 89,9 | 94,2 |
| Comunidad | 35.312 | 39.940 | 43.413 | | | | 100 | 100 |

Servicios = distribución y hostelería + servicios a empresas y financieros + otros servicios. Lo que falta hasta 100 es agricultura, que no llega al 0,1 % en ninguno de los 11.

Cautelas: el PIB mide lo que se genera en el municipio, no lo que ganan sus vecinos. Las bases 2015 y 2021 no se empalman en euros: en el JSON van por separado (`pib_pc_serie_base2015act` y `pib_pc_serie_base2021`). Entre bases solo es razonable comparar la posición relativa respecto a la media regional, y aun así con prudencia.

### Afiliados por ubicación del centro de trabajo y rama (Comunidad de Madrid, a partir de la Seguridad Social)
- https://datos.comunidad.madrid/catalogo/dataset/afiliados_por_ubicacion_y_rama, a 31 de diciembre.
- Autónomos: https://datos.comunidad.madrid/catalogo/dataset/afiliados_por_ubicacion_y_regimen (Régimen de autónomos).

| | Afiliados 31-12-2025 | % industria | % construcción | % servicios | Afiliados por 1.000 hab. 31-12-2024 | 31-12-2014 | Autónomos por 1.000 hab. 31-12-2024 | 31-12-2014 |
|---|---|---|---|---|---|---|---|---|
| Parla | 19.115 | 7,7 | 17,1 | 74,8 | 135,8 | 112,4 | 45,1 | 38,7 |
| Getafe | 83.410 | 21,2 | 10,4 | 68,4 | 406,1 | 333,4 | 47,4 | 45,1 |
| Leganés | 64.700 | 8,1 | 11,6 | 79,6 | 316,3 | 266,9 | 44,4 | 45,1 |
| Fuenlabrada | 47.920 | 15,9 | 12,2 | 71,7 | 250,8 | 213,5 | 48,3 | 50,2 |
| Móstoles | 46.245 | 10,6 | 10,1 | 79,1 | 211,9 | 196,4 | 44,1 | 46,8 |
| Alcorcón | 51.625 | 8,7 | 10,7 | 80,5 | 292,4 | 240,5 | 46,5 | 46,5 |
| Alcobendas | 133.420 | 12,5 | 3,3 | 84,2 | 1.056,4 | 879,4 | 62,0 | 57,3 |
| Pinto | 22.015 | 18,9 | 11,4 | 69,5 | 372,4 | 502,5 | 50,9 | 48,9 |
| Torrejón | 40.165 | 16,2 | 8,9 | 74,8 | 272,3 | 214,6 | 45,3 | 44,9 |
| Pozuelo | 86.730 | 1,8 | 3,0 | 95,1 | 1.004,7 | 796,2 | 94,2 | 87,4 |
| Majadahonda | 35.530 | 1,9 | 4,5 | 93,5 | 461,6 | 385,1 | 76,8 | 68,8 |

Cautelas: desde 2021 todas las cifras salvo el total están redondeadas a múltiplos de 5, así que los porcentajes pueden no sumar exactamente 100. El municipio es el del centro de trabajo **declarado**. Una empresa puede declarar a toda su plantilla en un solo centro, de modo que un salto puede deberse a una sola empresa: la caída de Pinto entre 2014 y 2024 hay que investigarla antes de publicarla. Para el «por 1.000 habitantes» se usa el dato a 31-12 con el padrón a 1-1 del año siguiente (por eso se publica 2024 y no 2025: el padrón a 1-1-2026 aún no está). Es posible que otra extracción de afiliados (trabajo) solape con esta; las cifras salen del mismo fichero.

## 4. Nuevas sociedades y altas de autónomos

**No hay fuente oficial municipal de flujos.**
- La estadística de Sociedades Mercantiles del INE y su versión en la Comunidad (https://datos.comunidad.madrid/catalogo/dataset/sociedades_mercantiles y dataset 1403002) llegan como mucho a la provincia o la comunidad.
- «Autónomos por rama de actividad» de la Comunidad (dataset 1914024) solo da el total regional.
- La Coyuntura demográfica de empresas del INE (estadística experimental) no baja a municipio.
- Lo más cercano que sí es municipal es el número de autónomos (RETA) a 31 de diciembre, que está en la tabla de arriba. Es un stock, no altas.

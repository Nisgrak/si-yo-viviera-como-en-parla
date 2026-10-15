# Impagos, desahucios y ejecuciones: lanzamientos judiciales por partido judicial

Fuente principal: CGPJ (lanzamientos practicados por partido judicial, 2013-2025, y base PC-Axis). Unidad: **partido judicial**, no municipio. Elaborado el 15-10-2026.

## Resumen

- El CGPJ publica los lanzamientos practicados por partido judicial (PJ) y por causa (Ley de Arrendamientos Urbanos, ejecución hipotecaria, otros) en un Excel 2013-2025. Las cifras coinciden una a una con la tabla OUJII021 de su base PC-Axis.
- No existe dato oficial por municipio. **Parla se mide junto con Pinto**: el PJ de Parla lo forman Parla y Pinto. Pinto no está en el PJ de Valdemoro.
- 2025 es año de transición a los tribunales de instancia: parte de los lanzamientos los practicaron los servicios comunes de ejecución. El total 2025 de este fichero suma juzgados y servicio común; así cuadra con el total provincial del CGPJ (2.267).
- En la Comunidad de Madrid los lanzamientos pasaron de 8.753 en 2013 a 2.267 en 2025 (serie provincial CGPJ).

## Partidos judiciales y municipios

| PJ | Municipios (INE 1-1-2025) | Población PJ 2025 | Municipios del proyecto | ¿PJ = municipio? |
|---|---|---:|---|---|
| Parla | Parla (137.471), Pinto (56.651) | 194.122 | parla, pinto | no |
| Getafe | Getafe (193.238) | 193.238 | getafe | sí |
| Leganés | Leganés (195.734) | 195.734 | leganes | sí |
| Fuenlabrada | Fuenlabrada (190.076), Humanes de Madrid (20.500) | 210.576 | fuenlabrada | no |
| Móstoles | Móstoles (214.817), Boadilla del Monte (66.349), Brunete (11.287), Quijorna (4.044), Villanueva de la Cañada (24.028), Villaviciosa de Odón (30.127) | 350.652 | mostoles | no |
| Alcorcón | Alcorcón (175.719) | 175.719 | alcorcon | sí |
| Alcobendas | Alcobendas (123.342), San Sebastián de los Reyes (96.992), San Agustín del Guadalix (13.825), Molar, El (9.999), Pedrezuela (6.606), Talamanca de Jarama (4.607), Valdepiélagos (612) | 255.983 | alcobendas | no |
| Torrejón de Ardoz | Torrejón de Ardoz (143.526), Ajalvir (4.868), Algete (21.144), Cobeña (7.670), Daganzo de Arriba (10.764), Fresno de Torote (2.561), Fuente el Saz de Jarama (7.413), Paracuellos de Jarama (27.650), Ribatejada (905), Valdeolmos-Alalpardo (4.626), Valdetorres de Jarama (5.175) | 236.302 | torrejon | no |
| Pozuelo de Alarcón | Pozuelo de Alarcón (89.770) | 89.770 | pozuelo | sí |
| Majadahonda | Majadahonda (73.625), Rozas de Madrid, Las (99.037) | 172.662 | majadahonda | no |

Fuente de la composición: fichas cartográficas del Ministerio de Justicia por PJ (2026). La población de cada ficha coincide con la suma INE de sus municipios.

## Lanzamientos practicados, 2025 y 2024

| PJ | 2025 total | LAU | Hipot. | Otros | por 100.000 hab. | LAU por 1.000 hogares alquiler* | 2024 total | 2024 por 100.000 hab. |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Parla | 38 | 31 | 6 | 1 | 19,6 | 2,56 | 66 | 34,6 |
| Getafe | 32 | 26 | 3 | 3 | 16,6 | 2,37 | 46 | 24,2 |
| Leganés | 46 | 37 | 5 | 4 | 23,5 | 3,29 | 62 | 31,9 |
| Fuenlabrada | 37 | 27 | 7 | 3 | 17,6 | 2,70 | 45 | 21,3 |
| Móstoles | 121 | 96 | 19 | 6 | 34,5 | 5,52 | 181 | 52,0 |
| Alcorcón | 33 | 21 | 3 | 9 | 18,8 | 2,22 | 55 | 31,7 |
| Alcobendas | 60 | 54 | 2 | 4 | 23,4 | 3,11 | 95 | 37,7 |
| Torrejón de Ardoz | 71 | 51 | 17 | 3 | 30,0 | 3,79 | 82 | 35,2 |
| Pozuelo de Alarcón | 21 | 16 | 5 | 0 | 23,4 | 3,17 | 36 | 40,3 |
| Majadahonda | 22 | 18 | 3 | 1 | 12,7 | 1,64 | 39 | 22,7 |
| Comunidad de Madrid (provincia) | 2.267 | 1.931 | 252 | 84 | 31,8 | — | 2.756 | 39,4 |

\* Hogares en alquiler = viviendas principales en alquiler del Censo 2021 (suma de los municipios del PJ). Desfase temporal: orientativo.

2025 = juzgados + servicio común de ejecución. Detalle en `lanzamientos[año].juzgados` y `lanzamientos[año].servicio_comun_ejecucion` del JSON.

## Serie de lanzamientos totales por PJ (2013-2025)

| PJ | 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Parla | 280 | 244 | 235 | 200 | 179 | 160 | 157 | 80 | 80 | 75 | 49 | 66 | 38 |
| Getafe | 139 | 159 | 131 | 163 | 118 | 110 | 117 | 73 | 71 | 68 | 45 | 46 | 32 |
| Leganés | 236 | 224 | 205 | 196 | 150 | 188 | 173 | 71 | 140 | 78 | 47 | 62 | 46 |
| Fuenlabrada | 206 | 169 | 147 | 172 | 136 | 168 | 171 | 65 | 104 | 88 | 32 | 45 | 37 |
| Móstoles | 478 | 411 | 415 | 384 | 412 | 388 | 448 | 185 | 220 | 230 | 121 | 181 | 121 |
| Alcorcón | 181 | 119 | 179 | 142 | 114 | 188 | 120 | 70 | 122 | 46 | 53 | 55 | 33 |
| Alcobendas | 179 | 226 | 217 | 222 | 266 | 244 | 158 | 47 | 111 | 132 | 77 | 95 | 60 |
| Torrejón de Ardoz | 287 | 244 | 243 | 221 | 236 | 250 | 277 | 96 | 145 | 124 | 79 | 82 | 71 |
| Pozuelo de Alarcón | 75 | 74 | 66 | 48 | 67 | 65 | 85 | 43 | 61 | 44 | 19 | 36 | 21 |
| Majadahonda | 123 | 133 | 108 | 76 | 98 | 89 | 75 | 26 | 70 | 45 | 21 | 39 | 22 |
| Comunidad de Madrid | 8.753 | 7.966 | 7.194 | 6.674 | 6.476 | 6.435 | 5.936 | 2.872 | 4.039 | 3.679 | 2.367 | 2.756 | 2.267 |

## Asuntos que entran en los juzgados (ingresados), 2025

| PJ | Verbales arrendaticios | Verbales por ocupación ilegal | Ejecuciones hipotecarias |
|---|---:|---:|---:|
| Parla | 307 | 8 | 118 |
| Getafe | 163 | 7 | 83 |
| Leganés | 139 | 2 | 55 |
| Fuenlabrada | 180 | 7 | 127 |
| Móstoles | 396 | 5 | 141 |
| Alcorcón | 149 | 1 | 57 |
| Alcobendas | 240 | 2 | 77 |
| Torrejón de Ardoz | 254 | 4 | 104 |
| Pozuelo de Alarcón | 80 | 0 | 44 |
| Majadahonda | 154 | 1 | 50 |

Fuente: CGPJ PC-Axis, tabla OUJII008 (situación «ingresados»). Serie 2013-2025 en el JSON. Los verbales arrendaticios incluyen las demandas de desahucio por falta de pago y otras acciones arrendaticias. Que una demanda entre no significa que acabe en lanzamiento.

## Ejecuciones hipotecarias (INE, solo provincial)

INE (provincia de Madrid, solo provincial): viviendas con ejecución hipotecaria iniciada e inscrita en los registros de la propiedad: 1.343 en 2025 y 1.161 en 2024. No existe desagregación municipal ni por PJ en la estadística del INE; la que hay por PJ es la del CGPJ (ejecuciones hipotecarias ingresadas en los juzgados, tabla anterior).

## Ayudas al alquiler concedidas por municipio (Comunidad de Madrid)

| Municipio | Plan Estatal 2023: solicitudes | aceptadas | aceptadas por 10.000 hab.** | Bono Alquiler Joven 2022: solicitudes | aceptadas |
|---|---:|---:|---:|---:|---:|
| alcobendas | 367 | 120 | 9,73 | 605 | 158 |
| alcorcon | 398 | 146 | 8,31 | 1.006 | 265 |
| fuenlabrada | 536 | 227 | 11,94 | 898 | 239 |
| getafe | 653 | 236 | 12,21 | 1.209 | 282 |
| leganes | 618 | 224 | 11,44 | 1.143 | 234 |
| majadahonda | 87 | 30 | 4,07 | 189 | 40 |
| mostoles | 632 | 204 | 9,50 | 1.269 | 367 |
| parla | 376 | 151 | 10,98 | 604 | 128 |
| pinto | 183 | 67 | 11,83 | 476 | 136 |
| pozuelo | 95 | 45 | 5,01 | 166 | 25 |
| torrejon | 388 | 117 | 8,15 | 895 | 257 |

\*\* Plan Estatal 2023 = programas 2.0 y 5.1 sumados (desglose y 2022 en el JSON). Tasa con población INE 1-1-2025, no la de 2023: orientativa. Aquí sí hay dato por municipio.

## Cautelas

- Desahucio no es impago: un lanzamiento es la ejecución material de una orden judicial de entrega de un inmueble. Muchos impagos acaban en acuerdo, abandono o pago sin llegar a lanzamiento. La categoría «otros» del CGPJ no se desglosa; previsiblemente recoge lanzamientos de otros procedimientos (precario, ocupación, etc.), pero el CGPJ no lo detalla.
- Los datos son por juzgado y se agregan por partido judicial; no hay dato oficial por municipio. Parla se mide junto con Pinto (PJ Parla); Fuenlabrada con Humanes; Móstoles con 5 municipios; Alcobendas con 6; Torrejón con 10; Majadahonda con Las Rozas. Solo Getafe, Leganés, Alcorcón y Pozuelo coinciden con su municipio.
- Pinto NO pertenece al PJ de Valdemoro: según la ficha del Ministerio de Justicia, el PJ de Parla lo forman Parla y Pinto (194.122 hab.), y el de Valdemoro Valdemoro, Chinchón, Ciempozuelos, San Martín de la Vega, Titulcia, Torrejón de la Calzada, Torrejón de Velasco y Valdelaguna.
- Se cuenta un lanzamiento por inmueble, incluidas las entregas voluntarias de posesión acordadas (definición CGPJ). Un lanzamiento se registra en el PJ del juzgado que lo practica, no necesariamente donde vive el hogar.
- 2025 es año de transición a los tribunales de instancia (Ley Orgánica 1/2025): parte de los lanzamientos de 2025 los practicaron los servicios comunes de ejecución (SCEJ/SCT). El total 2025 de este fichero = juzgados (Excel CGPJ) + servicio común (OUSCEJ008). Para Getafe, Móstoles y Pozuelo no aparece servicio común con lanzamientos en 2025. La suma de los 21 PJ de Madrid más los servicios comunes reproduce el total provincial del CGPJ (2.132 + 135 = 2.267).
- Composición de los PJ: la de las fichas ministeriales de 2026. No se ha comprobado si hubo cambios de demarcación entre 2013 y 2025; las tasas de cada año usan la población de esos mismos municipios a 1 de enero de cada año.
- Cifras pequeñas: en 2025 varios PJ tienen entre 20 y 40 lanzamientos; una variación de 10 casos mueve mucho la tasa.
- Tasa por 1.000 hogares en alquiler: numerador de 2024 o 2025, denominador del Censo 2021 (viviendas principales en alquiler). Desfase temporal; orientativa.
- Verbales posesorios por ocupación: el procedimiento existe desde la Ley 5/2018 (junio de 2018); antes de 2018 el campo es null.

## Lo que no se pudo conseguir

- Lanzamientos, ejecuciones hipotecarias o verbales por municipio: no existen; la unidad mínima oficial es el partido judicial (órgano judicial).
- INE ejecuciones hipotecarias: solo nacional, comunidad autónoma y provincia.
- Tabla CGPJ ANEXOVIV (lanzamientos de vivienda habitual suspendidos por vulnerabilidad y peticiones de suspensión): por PJ casi todo a cero en Madrid 2020-2025 (registro aparentemente incompleto); no se usa.
- Oficinas de intermediación hipotecaria / servicios municipales de vivienda: no se ha encontrado estadística oficial publicada por municipio.
- Bono Alquiler Joven por municipio: solo la convocatoria 2022 en datos abiertos de la Comunidad de Madrid; ayudas al alquiler del Plan Estatal: solo convocatorias 2022 y 2023.
- Hogares en alquiler posteriores a 2021 por municipio: no hay dato oficial anual.

## Fuentes

- **Consejo General del Poder Judicial (CGPJ), Sección de Estadística Judicial**: Lanzamientos por partidos judiciales 2013-2025 (Excel). https://www.poderjudicial.es/stfls/ESTADISTICA/FICHEROS/Crisis/Lanzamientos%20por%20PJs_2013_%202025.xlsx (página: https://www.poderjudicial.es/cgpj/es/Temas/Estadistica-Judicial/Estadistica-por-temas/Datos-penales--civiles-y-laborales/Civil-y-laboral/Efecto-de-la-Crisis-en-los-organos-judiciales/)
- **CGPJ**: Base de datos de la Estadística Judicial en PC-Axis para uso en equipo local (BOL19952025.zip, 1995-2025). https://www5.poderjudicial.es/estad/BOL19952025.zip (página: https://www.poderjudicial.es/cgpj/es/Temas/Estadistica-Judicial/Base-de-datos-de-la-estadistica-judicial--PC-AXIS-/Estadistica-Judicial-en-PC-Axis-para-uso-en-equipo-local)
- **CGPJ**: Series - Efecto de la crisis en los órganos judiciales por provincias 1T-2026 (revisado). https://www.poderjudicial.es/stfls/ESTADISTICA/FICHEROS/Crisis/Series%20-%20Efecto%20de%20la%20crisis%20en%20los%20organos%20judiciales%20por%20provincias%201T-2026_revisado.xlsx
- **Ministerio de la Presidencia, Justicia y Relaciones con las Cortes**: Cartografía judicial: mapa del partido judicial y municipios de su ámbito territorial (fichas de abril-mayo de 2026). https://www.mjusticia.gob.es/es/JusticiaEspana/OrganizacionJusticia/InstLibraryCartographyJudProv/Madrid/
- **INE**: Padrón. Población por municipios. Madrid: población por municipios y sexo (tabla 2881), 1-1-2013 a 1-1-2025. https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/2881?nult=13&tip=A (página: https://www.ine.es/jaxiT3/Tabla.htm?t=2881)
- **Comunidad de Madrid (Instituto de Estadística) a partir del Censo de Población y Viviendas 2021 del INE**: Censo de vivienda y locales 2021. Viviendas familiares principales por régimen de tenencia. Municipios. https://datos.comunidad.madrid/dataset/e50045e7-5f31-4bfc-bccd-7f502ed7c95e/resource/9c9e2b00-a74d-461c-af49-82b1c168b23a/download/censo-de-vivienda-y-locales-2021.-viviendas-familiares-principales-por-regimen-de-tenencia.-muni.csv
- **INE**: Estadística sobre Ejecuciones Hipotecarias. Viviendas con ejecución hipotecaria iniciada según estado de la vivienda por provincia (tabla 10744). https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/10744?nult=12
- **Comunidad de Madrid**: Ayudas al alquiler de vivienda para jóvenes y sectores de escasos recursos (2022 y 2023). https://datos.comunidad.madrid/dataset/54bce6b2-5259-40e6-9c2b-063c24fc2b51/resource/e6fe51b8-5b5f-4649-998d-34b0f073ebd9/download/spacm_ayudas_alquiler_vivienda_jovenes_sectores_escasos_recursos.csv (página: https://datos.comunidad.madrid/catalogo/dataset/spacm_ayudas_alquiler_vivienda_jovenes_sectores_escasos_recursos)
- **Comunidad de Madrid**: Bono Alquiler Joven (2022). https://datos.comunidad.madrid/dataset/ff697366-36f4-41a1-a966-f5ccf3b6db7c/resource/6fbda6ce-b479-4319-83c6-0b977d3fa8d5/download/spacm_bono_alquiler_joven_2022.csv (página: https://datos.comunidad.madrid/catalogo/dataset/spacm_bono_alquiler_joven_2022)

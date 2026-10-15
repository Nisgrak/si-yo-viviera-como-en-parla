# Alquiler y régimen de tenencia: 11 municipios

Datos descargados el 15-10-2026. JSON completo con series 2011-2024: `alquiler.json` (ids: parla, getafe, leganes, fuenlabrada, mostoles, alcorcon, alcobendas, pinto, torrejon, pozuelo, majadahonda). Las columnas con * son cálculo propio.

## Fuentes

| Bloque | Fuente | Página / tabla | Último dato |
|---|---|---|---|
| Testigos y renta mediana | MIVAU, SERPAVI (IRPF AEAT + Catastro) | [página](https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi) · [xlsx 2011-2024](https://cdn.mivau.gob.es/portal-web-mivau/vivienda/serpavi/2026-03_09_bd_SERPAVI_2011-2024%20-%20DEFINITIVO%20WEB_v2.xlsx) (hoja «Municipios») | 2024 |
| Alquiler medio, nuevos contratos, rentabilidad | AEAT, Estadística de viviendas declaradas en el IRPF | [página](https://sede.agenciatributaria.gob.es/Sede/estadisticas/estadisticas-impuesto/estadistica-viviendas-declaradas-irpf.html) · [tabla 2024](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/irpfvivienda/2024/jrubikf51e805519b77c14638914bf8be47b12345122c36.html) · [nuevos contratos 2024](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/irpfvivienda/2024/jrubik16a4b116943de994823993a0e8a448e24ac90bcd.html) · [tabla 2023](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/irpfvivienda/2023/jrubik398550fc8595f66d9764a92a177519b0c947b77.html) | 2024 |
| Índice de precios | INE, IPVA (experimental), base 2015 | [tabla 59060](https://www.ine.es/jaxiT3/Tabla.htm?t=59060) | 2024 (publ. 11-05-2026) |
| Tenencia | INE, Censo 2021 | [tabla 59529](https://www.ine.es/jaxi/Tabla.htm?tpx=59529) | 1-1-2021 |
| Principales / no principales | INE, Censo 2021 | [tabla 59526](https://www.ine.es/jaxi/Tabla.htm?tpx=59526) | 1-1-2021 |
| Vacías y uso esporádico | INE, Censo 2021 (consumo eléctrico) | [tabla 59531](https://www.ine.es/jaxi/Tabla.htm?tpx=59531) | 2021 |
| Renta de los hogares | INE, ADRH | [tabla 31097](https://www.ine.es/jaxiT3/Tabla.htm?t=31097) | 2023 |
| Población | INE, Padrón (cifras oficiales) | [tabla 2881](https://www.ine.es/jaxiT3/Tabla.htm?t=2881) | 1-1-2025 |

Población para «por 100.000 hab.»: padrón a 1 de enero del mismo año del dato IRPF (2024 → padrón 1-1-2024).

## Tablas

### SERPAVI (MIVAU): viviendas en alquiler declaradas en IRPF

| Municipio | 2015 | 2024 | Var. 2015-24 | Por 100.000 hab. 2024* |
|---|---:|---:|---:|---:|
| Parla | 3.691 | 6.207 | 68,2 % | 4.603,5 |
| Getafe | 6.948 | 12.554 | 80,7 % | 6.610,6 |
| Leganés | 6.754 | 10.775 | 59,5 % | 5.551,7 |
| Fuenlabrada | 6.078 | 8.768 | 44,3 % | 4.595,6 |
| Móstoles | 6.252 | 9.939 | 59,0 % | 4.644,3 |
| Alcorcón | 5.674 | 9.390 | 65,5 % | 5.408,2 |
| Alcobendas | 5.063 | 7.493 | 48,0 % | 6.173,5 |
| Pinto | 2.035 | 3.127 | 53,7 % | 5.583,6 |
| Torrejón de Ardoz | 4.803 | 7.626 | 58,8 % | 5.422,9 |
| Pozuelo de Alarcón | 3.338 | 4.650 | 39,3 % | 5.202,6 |
| Majadahonda | 3.324 | 4.443 | 33,7 % | 6.056,8 |

### SERPAVI: renta mediana, vivienda colectiva

| Municipio | €/mes 2015 | €/mes 2024 | €/m²/mes 2015 | €/m²/mes 2024 | Subida €/m² 2015-24* |
|---|---:|---:|---:|---:|---:|
| Parla | 450,00 | 650,00 | 5,74 | 8,21 | 43,0 % |
| Getafe | 471,88 | 700,00 | 7,04 | 10,20 | 44,9 % |
| Leganés | 500,00 | 690,00 | 7,03 | 9,76 | 38,8 % |
| Fuenlabrada | 500,00 | 682,75 | 6,56 | 9,04 | 37,8 % |
| Móstoles | 500,00 | 700,00 | 6,67 | 9,22 | 38,2 % |
| Alcorcón | 530,00 | 740,00 | 7,47 | 10,19 | 36,4 % |
| Alcobendas | 600,00 | 834,00 | 8,52 | 11,84 | 39,0 % |
| Pinto | 500,00 | 700,00 | 6,79 | 9,43 | 38,9 % |
| Torrejón de Ardoz | 500,00 | 710,00 | 6,52 | 9,21 | 41,3 % |
| Pozuelo de Alarcón | 850,00 | 1.246,25 | 9,74 | 13,67 | 40,3 % |
| Majadahonda | 800,00 | 1.127,50 | 9,38 | 13,21 | 40,8 % |

### SERPAVI: renta mediana, vivienda unifamiliar (muestras pequeñas)

| Municipio | Viviendas 2024 | €/mes 2024 | €/m²/mes 2015 | €/m²/mes 2024 | Subida €/m² 2015-24* |
|---|---:|---:|---:|---:|---:|
| Parla | 305 | 800,00 | 5,00 | 7,50 | 50,0 % |
| Getafe | 434 | 1.027,06 | 5,35 | 7,56 | 41,3 % |
| Leganés | 112 | 1.171,56 | 5,15 | 6,57 | 27,6 % |
| Fuenlabrada | 117 | 906,67 | 5,08 | 6,86 | 35,0 % |
| Móstoles | 206 | 1.100,00 | 5,48 | 8,36 | 52,6 % |
| Alcorcón | 67 | 1.000,00 | 5,93 | 8,61 | 45,2 % |
| Alcobendas | 560 | 2.279,83 | 10,88 | 15,80 | 45,2 % |
| Pinto | 63 | 775,00 | 5,21 | 6,82 | 30,9 % |
| Torrejón de Ardoz | 159 | 837,56 | 5,32 | 7,46 | 40,2 % |
| Pozuelo de Alarcón | 696 | 2.012,49 | 7,44 | 11,06 | 48,7 % |
| Majadahonda | 212 | 2.005,49 | 8,33 | 11,78 | 41,4 % |

### AEAT, viviendas declaradas en IRPF: alquiler como vivienda habitual (medias)

| Municipio | Arrendadas 2023 | Arrendadas 2024 | €/mes 2023 | €/mes 2024 | €/m²/mes 2024 | €/mes nuevos contratos 2024 | Rentab. bruta 2024 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Parla | 5.894 | 6.037 | 638 | 670 | 8,6 | 769 | 7,3 % |
| Getafe | 11.776 | 12.377 | 714 | 752 | 10,6 | 871 | 6,1 % |
| Leganés | 10.237 | 10.646 | 679 | 715 | 10,2 | 804 | 6,4 % |
| Fuenlabrada | 8.385 | 8.611 | 668 | 700 | 9,4 | 792 | 6,5 % |
| Móstoles | 9.377 | 9.788 | 703 | 741 | 9,6 | 849 | 6,6 % |
| Alcorcón | 8.905 | 9.206 | 725 | 760 | 10,6 | 866 | 5,9 % |
| Alcobendas | 7.228 | 7.406 | 1.062 | 1.115 | 12,7 | 1.415 | 4,7 % |
| Pinto | 3.013 | 3.082 | 688 | 721 | 9,8 | 799 | 6,0 % |
| Torrejón de Ardoz | 7.299 | 7.494 | 702 | 736 | 9,6 | 855 | 6,4 % |
| Pozuelo de Alarcón | 4.462 | 4.550 | 1.421 | 1.494 | 13,8 | 1.785 | 4,1 % |
| Majadahonda | 4.309 | 4.409 | 1.192 | 1.261 | 13,6 | 1.428 | 4,6 % |

### INE IPVA (experimental): índice 2015 = 100

| Municipio | 2020 | 2023 | 2024 | Var. anual 2024 |
|---|---:|---:|---:|---:|
| Parla | 112,897 | 120,418 | 123,939 | 2,9 % |
| Getafe | 112,476 | 119,795 | 123,577 | 3,2 % |
| Leganés | 111,049 | 117,995 | 121,440 | 2,9 % |
| Fuenlabrada | 110,512 | 117,865 | 121,421 | 3,0 % |
| Móstoles | 110,176 | 116,905 | 120,667 | 3,2 % |
| Alcorcón | 110,725 | 117,293 | 120,649 | 2,9 % |
| Alcobendas | 109,184 | 115,806 | 118,896 | 2,7 % |
| Pinto | 112,294 | 118,480 | 122,240 | 3,2 % |
| Torrejón de Ardoz | 110,720 | 116,699 | 120,210 | 3,0 % |
| Pozuelo de Alarcón | 110,116 | 116,902 | 120,558 | 3,1 % |
| Majadahonda | 110,825 | 117,439 | 121,046 | 3,1 % |

### Censo 2021: régimen de tenencia de las viviendas principales

| Municipio | Principales | Propiedad | Alquiler | Otro | % alquiler* | % propiedad* |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 44.570 | 34.097 | 8.614 | 1.859 | 19,3 % | 76,5 % |
| Getafe | 70.627 | 56.955 | 10.990 | 2.682 | 15,6 % | 80,6 % |
| Leganés | 72.285 | 57.836 | 11.236 | 3.213 | 15,5 % | 80,0 % |
| Fuenlabrada | 67.078 | 55.353 | 8.969 | 2.756 | 13,4 % | 82,5 % |
| Móstoles | 76.662 | 62.012 | 11.193 | 3.457 | 14,6 % | 80,9 % |
| Alcorcón | 65.867 | 53.514 | 9.468 | 2.885 | 14,4 % | 81,2 % |
| Alcobendas | 40.084 | 30.002 | 8.584 | 1.498 | 21,4 % | 74,8 % |
| Pinto | 19.481 | 15.287 | 3.506 | 688 | 18,0 % | 78,5 % |
| Torrejón de Ardoz | 47.253 | 36.371 | 8.842 | 2.040 | 18,7 % | 77,0 % |
| Pozuelo de Alarcón | 27.767 | 21.762 | 5.046 | 959 | 18,2 % | 78,4 % |
| Majadahonda | 23.827 | 17.692 | 5.178 | 957 | 21,7 % | 74,3 % |

### Censo 2021: viviendas por tipo y uso

| Municipio | Total | No principales | % no princ.* | Vacías (consumo eléctrico) | % vacías* | Uso esporádico |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 47.256 | 2.686 | 5,7 % | 1.506 | 3,2 % | 2.560 |
| Getafe | 79.835 | 9.208 | 11,5 % | 2.885 | 3,6 % | 5.034 |
| Leganés | 77.962 | 5.677 | 7,3 % | 2.545 | 3,3 % | 4.643 |
| Fuenlabrada | 70.944 | 3.866 | 5,4 % | 2.085 | 2,9 % | 3.323 |
| Móstoles | 82.103 | 5.441 | 6,6 % | 2.568 | 3,1 % | 4.775 |
| Alcorcón | 70.601 | 4.734 | 6,7 % | 2.263 | 3,2 % | 4.201 |
| Alcobendas | 42.744 | 2.660 | 6,2 % | 1.434 | 3,4 % | 2.322 |
| Pinto | 21.507 | 2.026 | 9,4 % | 586 | 2,7 % | 1.031 |
| Torrejón de Ardoz | 50.494 | 3.241 | 6,4 % | 1.752 | 3,5 % | 2.767 |
| Pozuelo de Alarcón | 32.327 | 4.560 | 14,1 % | 2.180 | 6,7 % | 1.340 |
| Majadahonda | 25.577 | 1.750 | 6,8 % | 684 | 2,7 % | 1.156 |

### Esfuerzo 2023 (cálculo propio): alquiler anual / renta neta media por hogar (ADRH)

| Municipio | Renta neta media hogar 2023 | Mediana SERPAVI colectiva €/mes | % esfuerzo (SERPAVI)* | Media AEAT €/mes | % esfuerzo (AEAT)* |
|---|---:|---:|---:|---:|---:|
| Parla | 35.177 | 606,61 | 20,7 % | 638 | 21,8 % |
| Getafe | 41.792 | 670,83 | 19,3 % | 714 | 20,5 % |
| Leganés | 38.660 | 650,00 | 20,2 % | 679 | 21,1 % |
| Fuenlabrada | 38.299 | 650,00 | 20,4 % | 668 | 20,9 % |
| Móstoles | 38.622 | 676,88 | 21,0 % | 703 | 21,8 % |
| Alcorcón | 41.634 | 700,00 | 20,2 % | 725 | 20,9 % |
| Alcobendas | 65.139 | 800,00 | 14,7 % | 1.062 | 19,6 % |
| Pinto | 42.700 | 660,00 | 18,5 % | 688 | 19,3 % |
| Torrejón de Ardoz | 41.459 | 686,36 | 19,9 % | 702 | 20,3 % |
| Pozuelo de Alarcón | 96.290 | 1.200,00 | 15,0 % | 1.421 | 17,7 % |
| Majadahonda | 74.987 | 1.078,40 | 17,3 % | 1.192 | 19,1 % |

## Cautelas

- **Qué cuentan SERPAVI y AEAT.** Las dos salen del IRPF cruzado con Catastro. Solo recogen viviendas de **personas físicas** que declaran el alquiler como vivienda habitual del inquilino. Quedan fuera las viviendas de sociedades y fondos, la vivienda pública en alquiler (EMV, AVS) y el alquiler que no se declara. No son el número de hogares que viven de alquiler.
- **Cobertura frente al Censo (cálculo propio).** Testigos SERPAVI 2021 / hogares en alquiler del Censo 2021: Parla 65,4 %, Getafe 98,7 %, Leganés 85,3 %, Fuenlabrada 89,7 %, Móstoles 78,6 %, Alcorcón 88,2 %, Alcobendas 79,9 %, Pinto 81,8 %, Torrejón 77,8 %, Pozuelo 86,1 %, Majadahonda 80,1 %. Las dos cifras se miden de forma distinta (la del Censo es a 1-1-2021 y la de SERPAVI, para todo el año), así que el cociente solo sirve para ver cuánto alquiler queda fuera de la base fiscal en cada municipio. Esa diferencia afecta a las comparaciones por 100.000 habitantes.
- **Mediana frente a media.** SERPAVI da la mediana y separa colectiva de unifamiliar. AEAT da la media de todas las tipologías. No hay que mezclarlas. Las dos miden el stock de contratos vigentes en el año, no solo los nuevos. AEAT publica aparte la renta de los nuevos contratos, pero solo para 2024.
- **Unifamiliar.** En varios municipios hay pocos testigos (Pinto 63, Alcorcón 67 y Leganés 112 en 2024). Esas medianas y sus subidas son poco estables.
- **SERPAVI frente a AEAT en número de viviendas.** No coinciden (Parla 2024: 6.207 frente a 6.037) porque usan filtros distintos (por ejemplo, la exclusión de parientes). Las dos son oficiales. Hay que indicar cuál se usa en cada caso.
- **El IPVA es un índice.** Mide la evolución de cada municipio con 2015 = 100. No sirve para comparar niveles de renta entre municipios.
- **Vacías.** Las «vacías» y de «uso esporádico» de la tabla 59531 se definen por consumo eléctrico. «No principal» (tabla 59526) es otra clasificación del mismo censo y las dos no se suman.
- **Esfuerzo (cálculo propio).** Se calcula como renta de alquiler × 12 / renta neta media por hogar del ADRH de 2023, el mismo año. Al denominador entran todos los hogares, propietarios incluidos, que suelen tener más renta que los inquilinos. Por eso el porcentaje se queda corto frente al esfuerzo real de quien alquila. No es la tasa de esfuerzo oficial de ningún organismo.
- **Redondeos.** Los porcentajes del JSON llevan un decimal. Las rentas SERPAVI llevan 2 decimales, recortadas del original de la fuente.

## Lo que no se pudo conseguir

- **Fianzas de la Comunidad de Madrid** (Agencia de Vivienda Social): no hay ninguna estadística pública por municipio, ni trimestral ni anual, con número de contratos o renta media. No aparece en el catálogo de datos.comunidad.madrid (la búsqueda «fianzas» no da resultados), ni en el banco de datos del Instituto de Estadística regional, ni en la [web de fianzas](https://www.comunidad.madrid/vivienda/fianzas-arrendamiento). Solo constan totales regionales citados en prensa a partir de respuestas parlamentarias, que no sirven para comparar municipios. Por eso no hay datos oficiales de alquiler de 2025 ni de 2026 por municipio.
- **IPVA**: no publica número de viviendas ni renta media en euros por municipio, solo el índice y la variación anual.
- **Censo 2021, tenencia**: por municipio solo hay propiedad, alquiler y otro régimen. No hay desglose de propiedad con o sin hipoteca, por herencia ni de vivienda cedida.
- **AEAT con precios**: solo hay ediciones de 2023 y 2024.

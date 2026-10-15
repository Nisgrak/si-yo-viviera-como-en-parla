# Quién es dueño de las casas y vivienda pública — 11 municipios

Fecha de la investigación: 15-10-2026. Datos en `propiedad.json` (claves por id y bloque `fuentes`). Los porcentajes están calculados aquí con dos decimales sobre los totales oficiales.

## Resumen

- **Catastro (oficial, los 11)**: publica para cada municipio los inmuebles urbanos de uso residencial según el tipo de NIF del contribuyente del IBI: personas físicas, sociedades, administraciones públicas y otras categorías. También los reparte por tramos según cuántos inmuebles tiene ese titular **dentro del propio municipio**. Es la mejor aproximación oficial a «particulares frente a empresas». Ver la cautela 1.
- **AEAT (oficial, los 11)**: número de declaraciones de IRPF 2024 con rendimientos del capital inmobiliario, es decir, arrendadores particulares. Se asignan por **municipio de residencia del declarante**, no por el lugar donde está la vivienda.
- **Agencia de Vivienda Social (oficial, los 11)**: viviendas propiedad de la AVS por municipio a 30-09-2026.
- **INE (oficial y experimental, los 11)**: viviendas turísticas en mayo de 2026.
- **Venta del IVIMA a Encasa Cibeles en 2013**: el total es oficial (2.935 viviendas; se recuperaron 1.721). **El desglose por municipio solo aparece en prensa** (Parla 240), sin documento oficial localizado.
- **«% de fondos buitre» por municipio: no es medible con fuentes oficiales.** Ver la sección correspondiente.
- **Zonas tensionadas**: ningún municipio de la Comunidad de Madrid aparece en las resoluciones trimestrales del BOE que se han revisado.

## 1. Titularidad de los inmuebles residenciales (Catastro, padrón AREF 2026)

Fuente: [P_SPI_mun_V_TPF.csv 2026](https://www.catastro.hacienda.gob.es/documentos/estadisticas/propietarios/2026/P_SPI_mun_V_TPF.csv) · [metodología](https://www.catastro.hacienda.gob.es/documentos/estadisticas/metodologia_SujetosPasivos.pdf) · [página](https://www.catastro.hacienda.gob.es/es-ES/estadisticas_3_1.html)

| Municipio | Inmuebles resid. | % personas físicas | % sociedades | % AAPP | Sociedades con >10 en el municipio (nº · inmuebles · %) | Sociedades con >100 en el municipio (nº · inmuebles · %) |
|---|---:|---:|---:|---:|---|---|
| Parla | 47.303 | 90,33 | 7,44 | 2,04 | 32 · 2.855 · 6,04 | 8 · 2.149 · 4,54 |
| Getafe | 80.928 | 94,97 | 4,30 | 0,62 | 49 · 2.185 · 2,70 | 5 · 1.043 · 1,29 |
| Leganés | 78.271 | 96,28 | 2,07 | 1,45 | 12 · 888 · 1,13 | 2 · 369 · 0,47 |
| Fuenlabrada | 71.778 | 96,55 | 2,19 | 1,17 | 30 · 752 · 1,05 | 0 · 0 · 0,00 |
| Móstoles | 83.453 | 95,02 | 3,76 | 1,07 | 27 · 2.330 · 2,79 | 6 · 1.547 · 1,85 |
| Alcorcón | 71.233 | 96,69 | 1,97 | 1,17 | 13 · 830 · 1,17 | 2 · 435 · 0,61 |
| Alcobendas | 42.765 | 92,34 | 6,35 | 0,98 | 30 · 1.157 · 2,71 | 1 · 403 · 0,94 |
| Pinto | 21.583 | 91,73 | 7,24 | 0,79 | 14 · 1.188 · 5,50 | 5 · 913 · 4,23 |
| Torrejón de Ardoz | 53.453 | 93,50 | 4,78 | 1,35 | 28 · 1.760 · 3,29 | 4 · 1.187 · 2,22 |
| Pozuelo de Alarcón | 31.439 | 91,58 | 7,52 | 0,69 | 13 · 565 · 1,80 | 2 · 301 · 0,96 |
| Majadahonda | 26.206 | 90,99 | 7,86 | 0,92 | 34 · 934 · 3,56 | 1 · 200 · 0,76 |

El resto, hasta el 100 %, corresponde a asociaciones, comunidades de bienes, herencias yacentes, entidades extranjeras y NIF sin clasificar: entre 51 y 203 inmuebles por municipio. En el JSON está el dato de 2025 para comparar. En Parla había 47.174 inmuebles residenciales, un 7,39 % de sociedades y 8 sociedades con más de 100 que sumaban 2.149 inmuebles (4,59 %).

**Cautelas de Catastro**
1. **Los tramos de tamaño se cuentan dentro del municipio.** Comprobación: si se suman los municipios, la provincia de Madrid tiene 135 pares titular-municipio con más de 100 inmuebles, que reúnen 44.904; el fichero provincial da 126 titulares con 52.387. Un fondo con 60 pisos en Parla y miles en España queda en el tramo 26-100. **No sirve para aplicar la definición legal de gran tenedor** (más de 10 inmuebles en toda España, art. 3.k de la Ley 12/2023).
2. **«Sociedades» es una categoría muy amplia.** Incluye las S.A. y S.L. de cualquier tipo: fondos y socimis, bancos, Sareb, promotoras con viviendas sin vender, cooperativas (letra F) y **empresas municipales de vivienda constituidas como sociedad anónima**. Las administraciones públicas (letras P, Q y S) van aparte. En Parla las AAPP suman 965 inmuebles, casi todos de la AVS (953).
3. Cuenta el contribuyente del IBI: si hay varios cotitulares, figura uno solo. No hay nombres de titulares. El ámbito excluye el País Vasco y Navarra. El servidor del Catastro usa un certificado FNMT, por eso se descargó con `curl -k`.

## 2. Arrendadores particulares (AEAT, IRPF 2024)

Fuente: [Estadística de los declarantes del IRPF por municipios 2024](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/irpfmunicipios/2024/home.html). Las URL de la tabla de cada municipio están en el JSON. La partida es «Suma de rendimientos del capital inmobiliario».

| Municipio | Declaraciones | Con rendimientos del capital inmobiliario | % declaraciones | Por 1.000 hab. | Rendimiento neto total (€) | Media (€) |
|---|---:|---:|---:|---:|---:|---:|
| Parla | 63.046 | 5.662 | 8,98 | 41,19 | 16.283.034 | 2.876 |
| Getafe | 109.662 | 16.600 | 15,14 | 85,90 | 53.898.127 | 3.247 |
| Leganés | 103.691 | 13.585 | 13,10 | 69,41 | 39.933.114 | 2.940 |
| Fuenlabrada | 101.195 | 9.358 | 9,25 | 49,23 | 27.064.304 | 2.892 |
| Móstoles | 112.543 | 11.856 | 10,53 | 55,19 | 33.548.982 | 2.830 |
| Alcorcón | 97.232 | 12.605 | 12,96 | 71,73 | 36.737.328 | 2.915 |
| Alcobendas | 62.698 | 11.078 | 17,67 | 89,82 | 57.341.735 | 5.176 |
| Pinto | 30.703 | 4.289 | 13,97 | 75,71 | 12.147.068 | 2.832 |
| Torrejón de Ardoz | 76.322 | 8.853 | 11,60 | 61,68 | 23.982.590 | 2.709 |
| Pozuelo de Alarcón | 49.827 | 13.751 | 27,60 | 153,18 | 84.420.230 | 6.139 |
| Majadahonda | 40.119 | 9.022 | 22,49 | 122,54 | 46.445.703 | 5.148 |

**Cautelas.**
- Las cifras corresponden al **lugar de residencia del arrendador**, no al de la vivienda alquilada. Un vecino de Pozuelo con un piso alquilado en Parla cuenta en Pozuelo. Este indicador mide cuántos vecinos son caseros, no cuántas viviendas del municipio están alquiladas.
- El importe es el rendimiento **neto**, después de gastos deducibles, y no la renta cobrada.
- Las cifras son declaraciones, no personas: una declaración conjunta puede incluir dos titulares.
- La población usada por la AEAT coincide con la del INE a 1-1-2025.
- La edición 2025 está prevista para septiembre de 2027.

## 3. Vivienda pública de la Comunidad (Agencia de Vivienda Social, a 30-09-2026)

Fuente: [02_agvs_inmuebles.xls](https://www.comunidad.madrid/docs/assets/2025/07/09/02_agvs_inmuebles.xls?VersionId=eCQ5N6ntpzAz3Po5qK8Yrrb6QM6n9W8E) · [página](https://www.comunidad.madrid/gobierno/estadistica/patrimonio-datos-estadisticos-agencia-vivienda-social). Total regional: 24.991 viviendas.

| Municipio | Viviendas AVS | Garajes | Locales | Por 1.000 hab. | % sobre inmuebles residenciales del Catastro* |
|---|---:|---:|---:|---:|---:|
| Parla | 953 | 937 | 27 | 6,93 | 2,01 |
| Getafe | 398 | 375 | 8 | 2,06 | 0,49 |
| Leganés | 995 | 1.045 | 10 | 5,08 | 1,27 |
| Fuenlabrada | 563 | 546 | 5 | 2,96 | 0,78 |
| Móstoles | 811 | 762 | 0 | 3,78 | 0,97 |
| Alcorcón | 758 | 848 | 9 | 4,31 | 1,06 |
| Alcobendas | 225 | 197 | 0 | 1,82 | 0,53 |
| Pinto | 116 | 113 | 6 | 2,05 | 0,54 |
| Torrejón de Ardoz | 565 | 454 | 44 | 3,94 | 1,06 |
| Pozuelo de Alarcón | 14 | 0 | 0 | 0,16 | 0,04 |
| Majadahonda | 167 | 164 | 0 | 2,27 | 0,64 |

\* La columna cruza dos fuentes: AVS a septiembre de 2026 y Catastro AREF 2026. Es orientativa.

La tabla recoge solo el parque **en propiedad de la AVS**. No incluye las viviendas de las empresas municipales ni la vivienda protegida privada. Las 1.721 viviendas recuperadas de Encasa vuelven a formar parte de este parque, pero no hay desglose municipal de ellas.

## 4. Venta del IVIMA a Encasa Cibeles (Goldman Sachs/Azora), 2013

**Datos oficiales**
- [Cámara de Cuentas, informe de fiscalización de las enajenaciones del IVIMA, ejercicios 2012-2013](https://www.camaradecuentasmadrid.org/admin/uploads/definitivo-4.pdf). Se vendieron 32 promociones con 2.935 viviendas (2.371 VPPAOC-J, 459 VPPA y 105 VPPAOC), 3.084 garajes, 1.865 trasteros y 45 locales, en total 7.929 inmuebles, por 201.000.007 €. La escritura se firmó el 25-10-2013. **El informe no desglosa las 2.935 viviendas por municipio.** Sí contiene dos tablas útiles:
  - Cuadro 28: contratos de arrendamiento de Encasa presentados a visado entre 2013 y el primer trimestre de 2015. Parla 71, Móstoles 95, Torrejón 103, Majadahonda 37 (también Madrid 168, Arroyomolinos 44, Valdemoro 4 y Navalcarnero 2). Esto confirma que había viviendas vendidas en esos municipios.
  - Cuadro 32: una promoción en Leganés (parcela RB-10.2, 18 VPPA con préstamo subrogado).
- [BOCM 23-10-2025, Decreto 85/2025](https://www.bocm.es/boletin/CM_Orden_BOCM/2025/10/23/BOCM-20251023-23.PDF). La venta quedó anulada por la sentencia 118/2018 del Juzgado de lo Contencioso-Administrativo nº 29, el auto 20/2021 (que extiende la anulación a las 32 promociones) y la sentencia 889/2021 del TSJM. La AVS recuperó **1.721 viviendas, 224 garajes y 34 locales** que no se habían transmitido a terceros, y pagó 107.722.508,95 € el 27-06-2022. Las 1.214 restantes (2.935 − 1.721) estaban en manos de terceros de buena fe.

**Desglose por municipio (solo prensa)**
[Público](https://www.publico.es/economia/madrid-pagara-fondo-inversion-encasa-cibeles-107-millones-retorno-1-721-pisos-ivima.html), que lo atribuye a la resolución judicial sin citar el número del documento: Madrid 1.380, Majadahonda 332, Móstoles 259, **Parla 240**, Torrejón 224, Navalcarnero 192, Arroyomolinos 127, Valdemoro 80, Collado Villalba 44, Leganés 36 y Tielmes 21. La suma da 2.935, igual que el total oficial. En los 11 municipios: Getafe, Fuenlabrada, Alcorcón, Alcobendas, Pinto y Pozuelo tienen **0**, porque no figuran en la lista. **No hay ninguna fuente, oficial o de prensa, que diga cuántas de las viviendas recuperadas están en Parla.**

**EMVS de Madrid → Fidere (Blackstone), 2013**: son viviendas de la empresa municipal del Ayuntamiento de Madrid y están en la capital. No afecta a ninguno de los 11 municipios.

## 5. Viviendas turísticas (INE, estadística experimental, mayo de 2026)

Fuente: [INE, tabla 39363](https://www.ine.es/jaxiT3/Tabla.htm?t=39363) y [tabla 39366](https://www.ine.es/jaxiT3/Tabla.htm?t=39366).

| Municipio | Viviendas turísticas 2026M05 | Plazas | % de viviendas | 2025M05 (viviendas · %) |
|---|---:|---:|---:|---|
| Parla | 28 | 63 | 0,06 | 46 · 0,10 |
| Getafe | 69 | 217 | 0,09 | 97 · 0,12 |
| Leganés | 54 | 173 | 0,07 | 53 · 0,07 |
| Fuenlabrada | 27 | 64 | 0,04 | 25 · 0,04 |
| Móstoles | 55 | 156 | 0,07 | 62 · 0,08 |
| Alcorcón | 40 | 123 | 0,06 | 75 · 0,11 |
| Alcobendas | 55 | 171 | 0,13 | 80 · 0,19 |
| Pinto | 29 | 114 | 0,13 | 31 · 0,14 |
| Torrejón de Ardoz | 64 | 227 | 0,13 | 90 · 0,18 |
| Pozuelo de Alarcón | 67 | 203 | 0,21 | 105 · 0,32 |
| Majadahonda | 23 | 68 | 0,09 | 34 · 0,13 |

Se obtiene por *web scraping* de plataformas como Airbnb y Booking, con eliminación de duplicados. Mide anuncios activos, no registros administrativos. Las cifras son muy pequeñas en todos los municipios.

## 6. Zonas tensionadas

Ningún municipio de la Comunidad de Madrid aparece en las resoluciones trimestrales de la Secretaría de Estado de Vivienda que se han revisado: [1T2024](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-5214), [4T2024](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-1721), [2T2025](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-15728), [3T2025](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21901), [4T2025](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-2448), [1T2026](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-9175) y [2T2026](https://boe.es/boe/dias/2026/07/29/pdfs/BOE-A-2026-16532.pdf). Las comunidades que aparecen son Cataluña, País Vasco, Navarra, Galicia y Asturias. No se revisaron 2T2024, 3T2024 ni 1T2025. La página consolidada del MIVAU devuelve un error 403 a las descargas automáticas. Según el art. 18 de la Ley 12/2023, la declaración corresponde a la comunidad autónoma.

## ¿Se puede medir el «% de fondos buitre» por municipio?

**No con fuentes oficiales.** Motivos:
1. El Catastro solo separa por la letra del NIF. Un fondo o una socimi aparece como «sociedad», igual que un banco, Sareb, una promotora, una cooperativa o la empresa municipal de vivienda. No publica nombres de titulares.
2. Los tramos de tamaño del Catastro se cuentan por municipio, no en el conjunto de España. Por eso no permiten aplicar la definición legal de gran tenedor.
3. No existe un registro oficial de grandes tenedores por municipio. Las zonas tensionadas, que obligarían a identificarlos, no se han declarado en Madrid.
4. Sareb no publica su cartera por municipio en ninguna estadística oficial localizada.

**Lo que sí puede decirse con fuentes oficiales**: «inmuebles residenciales cuyo titular es una sociedad mercantil». En Parla son el 7,44 %. «De ellos, los de sociedades con más de 100 inmuebles en el municipio» son el 4,54 % (8 sociedades, 2.149 inmuebles). El texto debe aclarar que en esta categoría entran fondos, bancos, promotoras y empresas públicas constituidas como sociedad.

## Lo que no existe o no se ha localizado de forma oficial

- Desglose oficial por municipio de las 2.935 viviendas vendidas a Encasa y de las 1.721 recuperadas. Solo hay prensa para la venta y nada para la recuperación. Fuentes que podrían tenerlo: la sentencia 118/2018 del Juzgado C-A nº 29, el pliego del expediente 50-EI-00011.2/2013 (anuncio en el [BOCM de 7-6-2013](https://w3.bocm.es/boletin/CM_Orden_BOCM/2013/06/07/BOCM-20130607-31.PDF), cuyo PDF es un paquete que no se pudo extraer) o el anexo de la escritura de 25-10-2013.
- Viviendas protegidas calificadas o terminadas **por municipio**. El MIVAU y el boletín trimestral de vivienda de la Comunidad de Madrid publican datos por comunidad o provincia. No se encontró una serie municipal: el banco ALMUDENA no se pudo consultar porque su árbol se carga de forma dinámica.
- Vivienda de la empresa municipal de Parla: no se localizó ninguna empresa municipal de vivienda activa ni datos sobre su parque. Queda pendiente consultar el Inventario de Entes del Sector Público Local de Hacienda.
- Censo 2021 del INE: tiene régimen de tenencia (propiedad, alquiler, cedida) por municipio, pero **no distingue si el arrendador es persona física o jurídica**.
- Sareb por municipio: no hay estadística oficial.

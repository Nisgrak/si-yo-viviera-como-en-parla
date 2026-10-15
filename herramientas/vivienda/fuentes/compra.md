# Precio de compra y compraventas — 11 municipios

Generado el 15-10-2026. Datos completos (series trimestrales de los 11) en `compra.json`.

## 1. Valor tasado de la vivienda libre (MIVAU), euros/m²

- Página: https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/valor-tasado-vivienda
- Fichero: https://apps.fomento.gob.es/BoletinOnline2/sedal/35103500.XLS (Tabla 4, una hoja por trimestre, 2005T1–2026T2; 86 trimestres para los 11)
- Metodología: https://www.mivau.gob.es/recursos_mfom/comodin/recursos/metodologia_valor_tasado_de_vivienda.pdf
- Publicación: fichero modificado en el servidor el 17-09-2026 (cabecera HTTP). Último trimestre: 2026T2.

Columna «Total» (todas las antigüedades). «5 años» y «10 años» comparan con el mismo trimestre de 2021 y 2016. «Máx. 2007-08» es el trimestre más alto entre 2007T1 y 2008T4; en los 11 coincide con el máximo de 2005-2008. «Mín. posterior» es el trimestre más bajo tras ese máximo. Porcentajes: (último / referencia − 1) × 100, a 1 decimal.

| Municipio | 2026T2 | 2021T2 | 2016T2 | Máx. 2007-08 (trim.) | Mín. posterior (trim.) | 5 años | 10 años | Desde mín. | vs máx. 2007-08 | Tasaciones 2026T2 |
|---|---:|---:|---:|---|---|---:|---:|---:|---:|---:|
| Parla | 2.410,0 | 1.384,8 | 971,4 | 2.485,4 (2007T2) | 919,7 (2015T3) | +74,0 % | +148,1 % | +162,0 % | -3,0 % | 437 |
| Getafe | 3.272,2 | 1.906,2 | 1.426,0 | 3.214,1 (2008T2) | 1.345,5 (2015T1) | +71,7 % | +129,5 % | +143,2 % | +1,8 % | 453 |
| Leganés | 3.253,9 | 1.937,2 | 1.462,6 | 3.096,9 (2007T2) | 1.400,1 (2014T4) | +68,0 % | +122,5 % | +132,4 % | +5,1 % | 467 |
| Fuenlabrada | 2.922,0 | 1.739,8 | 1.238,3 | 2.607,4 (2007T3) | 1.187,3 (2015T4) | +68,0 % | +136,0 % | +146,1 % | +12,1 % | 523 |
| Móstoles | 3.074,5 | 1.754,3 | 1.240,5 | 2.722,2 (2008T1) | 1.167,0 (2015T3) | +75,3 % | +147,8 % | +163,5 % | +12,9 % | 579 |
| Alcorcón | 3.561,5 | 2.134,8 | 1.539,8 | 3.281,3 (2007T4) | 1.424,1 (2014T4) | +66,8 % | +131,3 % | +150,1 % | +8,5 % | 405 |
| Alcobendas | 4.914,2 | 3.121,5 | 2.407,3 | 3.729,2 (2007T1) | 2.292,1 (2016T4) | +57,4 % | +104,1 % | +114,4 % | +31,8 % | 322 |
| Pinto | 2.951,6 | 1.888,1 | 1.444,9 | 2.841,6 (2007T3) | 1.289,0 (2015T2) | +56,3 % | +104,3 % | +129,0 % | +3,9 % | 151 |
| Torrejón de Ardoz | 3.042,7 | 1.789,6 | 1.242,9 | 2.779,2 (2007T1) | 1.170,8 (2014T4) | +70,0 % | +144,8 % | +159,9 % | +9,5 % | 428 |
| Pozuelo de Alarcón | 5.206,2 | 3.483,2 | 2.538,8 | 3.710,3 (2007T3) | 2.351,3 (2013T3) | +49,5 % | +105,1 % | +121,4 % | +40,3 % | 324 |
| Majadahonda | 5.005,5 | 3.348,2 | 2.447,1 | 3.700,7 (2007T1) | 2.230,2 (2013T3) | +49,5 % | +104,5 % | +124,4 % | +35,3 % | 193 |

Parla es el único de los 11 cuyo valor de 2026T2 sigue por debajo de su máximo de 2007-08; en los otros diez el máximo de toda la serie es 2026T2.

## 2. Compraventas de viviendas (MIVAU, datos notariales)

- Página: https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/transacciones-inmobiliarias-compraventa
- Ficheros (trimestrales por municipio, 2004T1–2026T2):
  - Total: https://apps.fomento.gob.es/BoletinOnline2/sedal/34010210.XLS
  - Libre: https://apps.fomento.gob.es/BoletinOnline2/sedal/34010220.XLS
  - Protegida: https://apps.fomento.gob.es/BoletinOnline2/sedal/34010230.XLS
  - Nueva: https://apps.fomento.gob.es/BoletinOnline2/sedal/34010240.XLS
  - Segunda mano: https://apps.fomento.gob.es/BoletinOnline2/sedal/34010250.XLS
- Metodología: https://www.mivau.gob.es/recursos_mfom/comodin/recursos/metodologia_transacciones_inmobiliarias_compraventas.pdf
- Publicación: ficheros modificados en el servidor el 01-10-2026. 2026T2 es provisional; 2025 es definitivo.
- Población: INE, cifras oficiales del Padrón a 1-1-2025 (https://www.ine.es/jaxiT3/Tabla.htm?t=2881), las mismas que usa `datos/datos.js`.

2025 = suma de los cuatro trimestres. Comprobado que total = libre + protegida = nueva + segunda mano en todos los trimestres. Año máx./mín. se calcula sobre años completos 2004-2025; la serie empieza en 2004, así que un máximo en 2004 puede no ser el pico real del ciclo.

| Municipio | Total 2025 | Nueva | Segunda mano | Libre | Protegida | % nueva | Población 1-1-2025 | Por 1.000 hab. | Año máx. (total) | Año mín. (total) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| Parla | 1.379 | 50 | 1.329 | 1.293 | 86 | 3,6 % | 137.471 | 10,03 | 2007 (4.587) | 2011 (631) |
| Getafe | 2.429 | 652 | 1.777 | 2.372 | 57 | 26,8 % | 193.238 | 12,57 | 2007 (2.904) | 2009 (945) |
| Leganés | 1.615 | 23 | 1.592 | 1.586 | 29 | 1,4 % | 195.734 | 8,25 | 2004 (3.252) | 2011 (770) |
| Fuenlabrada | 1.625 | 77 | 1.548 | 1.602 | 23 | 4,7 % | 190.076 | 8,55 | 2005 (2.450) | 2013 (709) |
| Móstoles | 1.864 | 129 | 1.735 | 1.834 | 30 | 6,9 % | 214.817 | 8,68 | 2018 (2.138) | 2013 (989) |
| Alcorcón | 1.274 | 8 | 1.266 | 1.263 | 11 | 0,6 % | 175.719 | 7,25 | 2010 (2.823) | 2008 (616) |
| Alcobendas | 1.223 | 120 | 1.103 | 1.214 | 9 | 9,8 % | 123.342 | 9,92 | 2009 (2.268) | 2011 (438) |
| Pinto | 501 | 23 | 478 | 488 | 13 | 4,6 % | 56.651 | 8,84 | 2005 (802) | 2007 (173) |
| Torrejón de Ardoz | 1.433 | 166 | 1.267 | 1.393 | 40 | 11,6 % | 143.526 | 9,98 | 2004 (2.564) | 2013 (798) |
| Pozuelo de Alarcón | 929 | 141 | 788 | 925 | 4 | 15,2 % | 89.770 | 10,35 | 2004 (1.110) | 2013 (372) |
| Majadahonda | 766 | 42 | 724 | 763 | 3 | 5,5 % | 73.625 | 10,40 | 2006 (1.384) | 2011 (284) |

Último semestre publicado (total de compraventas):

| Municipio | 2026T1 | 2026T2 (prov.) |
|---|---:|---:|
| Parla | 329 | 616 |
| Getafe | 451 | 427 |
| Leganés | 376 | 409 |
| Fuenlabrada | 400 | 373 |
| Móstoles | 472 | 442 |
| Alcorcón | 341 | 342 |
| Alcobendas | 265 | 242 |
| Pinto | 217 | 159 |
| Torrejón de Ardoz | 379 | 327 |
| Pozuelo de Alarcón | 188 | 217 |
| Majadahonda | 133 | 133 |


## Cautelas

- **Tasación no es precio de venta.** Es el valor que fija una sociedad de tasación, casi siempre para una hipoteca. Suele ir por detrás del precio de mercado y solo cubre las viviendas que se tasan, no todas las que se venden.
- **La muestra cambia cada trimestre.** Se tasan viviendas distintas en cada trimestre. MIVAU estratifica y pondera por el parque catastral, pero con 150-200 tasaciones (Pinto, Majadahonda) un trimestre aislado puede moverse por pura composición. Para comparar municipios conviene usar varios trimestres.
- **El euro/m² es de superficie construida**, no útil.
- **La serie de compraventas cuenta escrituras**, no precio. Los picos de vivienda nueva corresponden a la entrega de promociones (por ejemplo Parla 2007: 3.757 nuevas de 4.587; Alcorcón 2009-2010; Getafe 2025: 652 nuevas). Un año puntual puede deberse a una sola promoción.
- **2026T2 es provisional.** El salto de Parla (329 → 616, de ellas 608 de segunda mano) está sin revisar: hay que esperar a la próxima publicación antes de usarlo.
- Compraventas por 1.000 habitantes mide actividad, no precio ni acceso.

## Lo que no se pudo conseguir

- **Precio notarial €/m² por municipio** (Portal Estadístico del Notariado, penotariado.com). El portal tiene un mapa municipal, pero su configuración (`/inmobiliario/rest/v1/public/configurations/mapUrl`) responde «User does not have required permission» y las estadísticas (`/private/statistics`) piden usuario registrado. No hay descarga abierta. No se incluye ninguna cifra.
- **Compraventas por extranjeros por municipio.** MIVAU solo las publica por comunidad autónoma y provincia (tablas 1.6.x).
- **Valor medio declarado de las compraventas por municipio.** Solo se publica por comunidad autónoma y provincia (tablas 3.x).
- La estadística de valor tasado cubre municipios de más de 25.000 habitantes; los 11 están incluidos, con datos en todos los trimestres.

## Ficheros brutos y scripts

- Descargas: `raw/compra/35103500/`, `raw/compra/340102[1-5]0/`, metodologías en `raw/compra/metodologia_*`.
- Scripts: `scripts/parse_tasado.py`, `scripts/parse_trans.py`, `scripts/build_compra.py`, `scripts/final_compra.py`, `scripts/md_tables.py`.

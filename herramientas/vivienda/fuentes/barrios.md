# De un barrio a otro

> **Al día con el ADRH 2024 (19-10-2026).** La renta, el tamaño del hogar y las secciones de renta del `.json` son ya de 2024: los escribe `herramientas/vivienda/adrh.py`, que con el año 2023 reproduce exactamente las cifras de las tablas de abajo. Estas tablas se quedan como estaban, de 2023.

Extraído el 15-10-2026. Datos en `barrios.json`.

- Alquiler: [Ministerio de Vivienda, SERPAVI](https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi), [base de datos 2011-2024](https://cdn.mivau.gob.es/portal-web-mivau/vivienda/serpavi/2026-03_09_bd_SERPAVI_2011-2024%20-%20DEFINITIVO%20WEB_v2.xlsx), hoja «Secciones censales», campos `ALQM2_LV_M_VC_24` (mediana €/m² al mes, vivienda colectiva) y `BI_ALVHEPCO_TVC_24` (alquileres declarados). Solo secciones con 30 o más alquileres: los extremos con pocos casos son ruido.
- Renta: [INE, Atlas de Distribución de Renta de los Hogares, tabla 31097](https://www.ine.es/jaxiT3/Tabla.htm?t=31097), renta neta media por hogar 2023 por sección censal.
- Cautelas: las secciones no tienen nombre de barrio. 104.774 € aparece repetido en 134 secciones de la Comunidad; se trata como un tope y en Alcobendas, Pozuelo y Majadahonda la distancia de renta no se calcula. No se cruzan las dos fuentes sección a sección (el seccionado puede no coincidir). Los distritos no sirven: Parla y Alcobendas tienen uno solo.

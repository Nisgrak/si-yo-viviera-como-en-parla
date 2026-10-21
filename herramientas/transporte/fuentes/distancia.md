# Lo lejos que queda el trabajo

Calculado el **21-10-2026** con `herramientas/transporte/distancia.py`. Datos en `distancia.json`.

| Indicador | Fuente | Fichero | Fecha |
|---|---|---|---|
| Viajes y kilómetros por origen, destino, actividad y tramo de distancia | Ministerio de Transportes, [Open Data Movilidad](https://www.transportes.gob.es/ministerio/proyectos-singulares/estudios-de-movilidad-con-big-data/opendata-movilidad), estudio básico por municipios | [16-10-2024](https://movilidad-opendata.mitma.es/estudios_basicos/por-municipios/viajes/ficheros-diarios/2024-10/20241016_Viajes_municipios.csv.gz), [17-10-2023](https://movilidad-opendata.mitma.es/estudios_basicos/por-municipios/viajes/ficheros-diarios/2023-10/20231017_Viajes_municipios.csv.gz) | miércoles 16-10-2024; control, martes 17-10-2023 |

- **De casa al trabajo o a estudiar:** viajes con `actividad_origen = casa` y origen en la ciudad, y `actividad_destino =
  trabajo_estudio`, vayan adonde vayan. Media = `viajes_km / viajes`; «más de 10 km» = tramos `10-50` y `>50`.
- **Km por vecino:** `viajes_km` de los viajes que salen de casa en la ciudad o vuelven a casa en ella, entre el padrón
  de 2025 (`BASES.total` de `datos/datos.js`). Faltan los viajes entre dos sitios que no son casa.
- El campo `residencia` del estudio por municipios es la provincia, no el municipio: por eso se usa la casa como origen.

## Resultados

| Ciudad | Km casa → trabajo, 2024 | Más de 10 km (%), 2024 | Km casa → trabajo, 2023 | Km por vecino y día, 2024 |
|---|---:|---:|---:|---:|
| Parla | 9,0 | 33,5 | 9,4 | 18,5 |
| Fuenlabrada | 8,0 | 29,9 | 8,1 | 16,4 |
| Pinto | 7,9 | 28,7 | 7,5 | 20,8 |
| Móstoles | 7,7 | 29,9 | 7,7 | 15,8 |
| Alcorcón | 7,5 | 31,8 | 7,7 | 15,4 |
| Torrejón de Ardoz | 7,3 | 26,5 | 7,1 | 16,0 |
| Getafe | 6,9 | 26,5 | 7,3 | 14,9 |
| Leganés | 6,7 | 25,8 | 6,7 | 14,6 |
| Majadahonda | 6,2 | 22,8 | 7,3 | 17,5 |
| Alcobendas | 6,1 | 21,6 | 6,2 | 15,1 |
| Pozuelo de Alarcón | 5,5 | 19,0 | 6,1 | 16,5 |

Parla es la primera los dos años en distancia media y en viajes de más de 10 km. En km por vecino es la 2.ª, tras Pinto.

## Cautelas

- Un día suelto por año, los mismos de las rutas por carretera.
- Todos los medios y solo viajes de más de 500 m. «Trabajo o estudios» incluye el colegio, que baja la media de las
  ciudades con más niños.
- Kilómetros, no minutos: el estudio no da la duración.
- El Ministerio reconoce casa y trabajo por dónde pasa el teléfono de noche y en horas de trabajo.

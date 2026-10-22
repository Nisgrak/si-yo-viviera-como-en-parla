# Cuánto se tarda desde cada punto de la ciudad hasta el centro de Madrid

Calculado el 19-10-2026 con `herramientas/transporte/ciudad.py`. Datos en `datos/transporte.js`
(índice) y `datos/transporte/<id>.js` (cada ciudad, que la página carga al verla). Las once
ciudades, recalculadas el 20-10-2026 (unos 25 minutos en total).

## La pregunta

Eliges a dónde vas (Sol, Atocha, Nuevos Ministerios o Plaza de Castilla) y el mapa enseña el
término de cada ciudad pintado por lo que se tarda desde cada punto, un martes laborable saliendo
entre las 7:30 y las 8:30. Es lo que pidió el usuario después de ver dos versiones descartadas: una
rejilla de cuadros que tapaba la ciudad y un mapa de isócronas desde el ayuntamiento hacia fuera
(`isocronas.py`, que se queda para otra medida, los empleos a los que se llega en 45 minutos).

## Fuentes

- **Horarios**: GTFS del [Consorcio Regional de Transportes de Madrid](https://datos.crtm.es/),
  descargados el 19-10-2026 (`tiempos.py --descargar`): Cercanías (19-10-2026), Metro
  (30-05-2025, **caducado el 27-05-2026**), Metro Ligero, autobuses urbanos e interurbanos
  (16-10-2026). Detalle y enlaces en `isocronas.md`.
- **Término municipal**: el de `datos/mapa/<id>.js` (IGN), el mismo de los mapas de carreteras.
- **Manzanas**: cartografía INSPIRE de la [Dirección General del Catastro](https://www.catastro.hacienda.gob.es/webinspire/index.html),
  `CadastralZoning` de nivel MANZANA, del fichero de cada municipio
  ([Parla](https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/28/28106-PARLA/A.ES.SDGC.CP.28106.zip),
  [Getafe](https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/28/28065-GETAFE/A.ES.SDGC.CP.28065.zip)),
  recortadas por el término y simplificadas a 4 m. Solo son el fondo del mapa.
- **Ayuntamiento** (para elegir la estación de referencia del resumen): CartoCiudad (IGN), como en
  `isocronas.md`.

## Método

1. **Dos cuentas**: solo tren (Cercanías, Metro y Metro Ligero), que es la que la web enseña al
   entrar, y con autobuses (urbanos e interurbanos). Los autobuses van con su horario, que en hora
   punta no siempre cumplen por los atascos.
2. **Perfiles**: para cada destino, CSA de perfiles hacia atrás (en `tiempos.py`): para cada
   parada y hora de salida, la llegada más temprana con hasta 4 vehículos. Destinos: el conjunto
   de paradas de cada estación (Cercanías y Metro; en Plaza de Castilla, también las dársenas del
   intercambiador).
3. **Puntos**: el centro de cada celda de 100 m dentro del término. Para cada salida (cada minuto
   de 7:30 a 8:30) se anda hasta cualquier parada a menos de 1.200 m (línea recta × 1,3 a
   4,5 km/h) y se toma la mejor llegada. Se guarda la mediana y los percentiles 25 y 75 de las 61
   salidas. Una celda sin parada a menos de 1.200 m (o sin estación, en la cuenta de solo tren)
   no tiene tiempo: el mapa la deja sin color y el recuadro lo dice.
4. **Zonas**: para cada destino, cinco umbrales de 10 en 10 minutos que empiezan en la decena del
   mejor tiempo de todas las ciudades calculadas (Sol: 30 a 70; Atocha: 20 a 60; Nuevos
   Ministerios: 30 a 70; Plaza de Castilla: 40 a 80). Cada zona es la unión de las celdas con
   mediana igual o menor, cerrada y abierta con un radio de 60 m para quitar la escalera,
   recortada por el término y simplificada a 6 m. En la página se pintan unas encima de otras con
   transparencia, así que el color se carga donde se tarda menos.
5. **Resumen**: el tiempo desde la estación de Cercanías más cercana al ayuntamiento (la celda que
   la contiene) y el mejor y el peor punto del término.
6. **Encuadre**: la caja de los edificios con viviendas del Catastro (los de `cobertura.py`), sin
   el 1 % más apartado de cada lado y con 500 m de margen. Así entra toda la ciudad, también lo que
   queda lejos del tren (el oeste de Majadahonda, Perales del Río en Getafe), y quedan fuera los
   campos. Se probó antes encuadrar lo que tiene estación cerca, y escondía esos barrios.

La comprobación contra Renfe es la de `isocronas.md`: el mismo GTFS y los mismos supuestos dan, de
estación a estación, los minutos de la consulta oficial de horarios.

## Resultados (mediana, minutos, hasta Sol)

| Ciudad | Estación de referencia | Solo tren: mejor y peor punto |
|---|---|---|
| Parla | Parla, 36 | 36 a 83 |
| Getafe | Getafe-Centro, 27 | 24 a 59 |
| Leganés | Leganés, 29 | 26 a 67 |
| Fuenlabrada | Fuenlabrada, 36 | 34 a 69 |
| Móstoles | Móstoles, 37 | 37 a 69 |
| Alcorcón | Alcorcón, 32 | 30 a 70 |
| Alcobendas | Alcobendas-S. S. de los Reyes, 36 | 33 a 72 |
| Pinto | Pinto, 34 | 34 a 74 |
| Torrejón de Ardoz | Torrejón de Ardoz, 41 | 41 a 66 |
| Pozuelo de Alarcón | Pozuelo, 29 | 29 a 67 |
| Majadahonda | Majadahonda, 38 | 38 a 58 |

El ayuntamiento de Alcorcón no está en CartoCiudad por su dirección (plaza de los Reyes de España,
1): se usa su topónimo, «Ayuntamiento de Alcorcón».

### Piloto, Parla y Getafe (mediana, minutos)

| | Estación de referencia → Sol | Mejor punto | Peor punto con tiempo |
|---|---:|---:|---:|
| Parla, solo tren | 36 (Parla) | 36 | 83 |
| Getafe, solo tren | 27 (Getafe-Centro) | 24 | 59 |
| Parla, con autobuses | 36 | 36 | 97 |
| Getafe, con autobuses | 27 | 24 | 120 |

Celdas sin tiempo en la cuenta de solo tren: 984 de 2.495 en Parla y 5.764 de 7.868 en Getafe,
casi todas campo (el término de Getafe es grande y la ciudad ocupa el oeste).

## Desde la vivienda mediana (`vivienda_media.py`)

Cada edificio con viviendas del Catastro (los de `cobertura.py`) toma el tiempo de su celda de 100 m y cuenta tantas
veces como viviendas tiene. Las que no tienen parada a 1.200 m cuentan como las que más tardan. Mediana, en minutos,
y de cada 100 viviendas las que pasan de una hora:

| Ciudad | Sol, tren | Sol, con bus | Plaza de Castilla, tren | Sol, tren, > 1 h |
|---|---:|---:|---:|---:|
| Parla | 49 | 48 | 63 | 2,1 |
| Getafe | 38 | 38 | 52 | 5,8 |
| Leganés | 41 | 40 | 55 | 0,3 |
| Fuenlabrada | 48 | 47 | 62 | 11,4 |
| Móstoles | 52 | 52 | 62 | 14,2 |
| Alcorcón | 43 | 43 | 51 | 12,0 |
| Alcobendas | 47 | 43 | 40 | 11,5 |
| Pinto | 46 | 46 | 61 | 27,4 |
| Torrejón de Ardoz | 61 | 45 | 70 | 51,9 |
| Pozuelo de Alarcón | 47 | 46 | 51 | 15,3 |
| Majadahonda | sin estación | 55 | sin estación | 89,4 |

Parla no es la peor hasta Sol; sí hasta Plaza de Castilla. El tranvía de Parla cuenta como tren aquí (lleva a la
estación), por eso en Parla casi ninguna vivienda se queda sin tiempo.

## Cautelas

- Es una cuenta nuestra sobre horarios oficiales: no cuenta retrasos, trenes llenos ni obras.
- Andar en línea recta × 1,3 aproxima la red de calles.
- El color cubre todo el término, también campos y polígonos: las manzanas grises son la ciudad.
- El GTFS de Metro está caducado: se usa su servicio de los martes.
- El fichero de Getafe pesa 1,1 MB (muchas celdas de campo); la página solo lo carga al verlo.

## Estaciones en obras

`obras.json` lista las que se están construyendo y aún no dan servicio. Se pintan en amarillo y no
cuentan en los tiempos ni en el tren a mano, porque no están en los GTFS. Hoy solo está **Parla
Norte** (C-4, entre Getafe Sector 3 y Parla): el Ministerio de Transportes dio por terminados el
edificio y los andenes el 8-7-2026 y quedan las instalaciones, la señalización y la autorización de
la Agencia Estatal de Seguridad Ferroviaria, sin fecha. La posición es la de OpenStreetMap (nodo
14063949035), que coincide a unos 40 m con la de Wikidata: ninguna fuente oficial publica las
coordenadas. Cuando abra y entre en el GTFS, hay que quitarla de `obras.json` y recalcular.


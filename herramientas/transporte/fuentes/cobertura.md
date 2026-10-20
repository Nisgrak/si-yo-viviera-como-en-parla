# El tren a mano: viviendas a 15 minutos andando de una estación

Calculado el 20-10-2026 con `herramientas/transporte/cobertura.py`. Datos en `cobertura.json` y,
para la web, en `datos/transporte.js` (`indice.py`).

## Fuentes

- **Viviendas**: los edificios del [Catastro, INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/index.html)
  ([índice de descargas de Madrid](https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/28/ES.SDGC.BU.atom_28.xml)),
  un fichero por municipio, con `numberOfDwellings`. Cada edificio con viviendas cuenta en el centro
  de su planta (media de los vértices del contorno). Los ficheros van en ISO-8859-1.
- **Estaciones**: paradas de Cercanías, Metro y Metro Ligero ML1, ML2 y ML3 de los GTFS del
  [Consorcio](https://datos.crtm.es/), de cualquier municipio. El tranvía de Parla (ML4) no cuenta,
  por lo mismo que no cuenta en el recuento (README, «Paradas de tranvía»): no sale de la ciudad.
  ML1, ML2 y ML3 sí, porque son la conexión de Sanchinarro, Pozuelo y Boadilla con el Metro: sin
  ellas, Pozuelo bajaba del 43,9 % al 10,9 %.

## Método

La página da la cifra a 15 minutos andando (1.125 m a 4,5 km/h; con el mismo factor de 1,3 del
mapa de tiempos, 865 m en línea recta desde el centro del edificio a la parada más cercana), y en
la nota, a 5 y a 10. Al principio la cifra grande era la de 10 minutos; se cambió a 15 el
20-10-2026.

## Resultado (de cada 100 viviendas)

| | Viviendas | a 5 min | a 10 min | a 15 min |
|---|---:|---:|---:|---:|
| Leganés | 78.280 | 25,8 | 74,6 | 92,4 |
| Alcobendas | 42.589 | 17,4 | 63,0 | 81,2 |
| Getafe | 81.340 | 16,5 | 62,6 | 83,0 |
| Alcorcón | 71.222 | 20,5 | 61,5 | 79,3 |
| Móstoles | 83.419 | 14,7 | 59,5 | 82,5 |
| Fuenlabrada | 71.748 | 15,8 | 55,9 | 82,8 |
| Pozuelo de Alarcón | 31.435 | 18,1 | 43,9 | 67,2 |
| Pinto | 21.418 | 6,9 | 30,2 | 55,9 |
| **Parla** | 47.197 | 7,3 | **27,0** | 50,1 |
| Torrejón de Ardoz | 53.437 | 5,5 | 18,5 | 36,3 |
| Majadahonda | 26.191 | 0,7 | 4,7 | 7,7 |

Parla es la 9.ª de 11 a 10 y a 15 minutos; la página nombra a las dos que quedan por debajo.

## Cautelas

- Cuenta viviendas, no personas: una vivienda vacía cuenta igual.
- La distancia es a la parada del GTFS, no a la boca de metro más cercana; en estaciones grandes
  puede haber unos minutos de diferencia.
- No mide frecuencia: una estación con un tren cada media hora cuenta como una con uno cada cinco
  minutos.

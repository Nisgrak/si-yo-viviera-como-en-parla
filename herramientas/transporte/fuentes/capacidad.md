# Las plazas hacia Madrid y «Si falla el tren»

Lo escribe `herramientas/transporte/capacidad.py` en `capacidad.json`; `indice.py` lo pasa a
`datos/transporte.js` (`redundancia`). Lo pintan «Las plazas hacia Madrid» y «Si falla el tren»
de `infraestructura.html` (`assets/infraestructura-tp.js`).

## Método

- **Horarios:** GTFS del [Consorcio Regional de Transportes de Madrid](https://datos.crtm.es/)
  (Cercanías, Metro, Metro Ligero y autobuses interurbanos), martes 27 de octubre de 2026, salidas
  de 7:00 a 9:00. Las cifras son por hora: la mitad de lo que sale en las dos horas.
- **Qué viaje cuenta:** el que recoge viajeros en una parada del término de la ciudad dentro de la
  ventana y, más adelante, deja viajeros en una parada del término de Madrid. Cuenta una vez
  aunque pare en varias paradas de la ciudad. Un tren de la C-4 que sale de Parla y para en Getafe
  cuenta en las dos: es la oferta que pasa por cada ciudad, no la que le queda libre.
- **Términos municipales:** `datos/mapa/<id>.js` para las once; Madrid, del WFS del IGN.
- **La gente que va a Madrid:** estudio básico de movilidad por municipios del Ministerio de
  Transportes, miércoles 16 de octubre de 2024, viajes de cada ciudad a Madrid capital con salida
  de 7 a 9, en cualquier medio y por cualquier motivo, divididos entre dos.
- **La línea principal** de cada ciudad (`principal.py`) es la de tren, Metro o Metro Ligero que
  más plazas lleva hacia Madrid. «Si falla el tren» quita solo sus viajes y deja todo lo demás.

## Plazas por vehículo

Sentadas y de pie, como las da cada fabricante u operador. Las de Renfe, Vía Libre y AnsaldoBreda
cuentan seis personas de pie por metro cuadrado; la de Metro Ligero Oeste, cuatro.

| Vehículo | Plazas | Fuente |
|---|---:|---|
| Cercanías, Civia de cinco coches (serie 465) | 997 | [Renfe, unidad 465](https://www.renfe.com/es/es/cercanias/cercanias-madrid/rodajes/unidad-465): 277 sentadas y 720 de pie |
| Metro, línea 10 tramo A: serie 7000 de seis coches | 1.260 | [Ficha técnica de AnsaldoBreda](https://web.archive.org/web/20070308012348/http://www.ansaldobreda.it/files/prodotti/Madridserie7000.pdf) (copia del Internet Archive), «Total pasajeros por u.d.t. 1260» |
| Metro, línea 10 tramo B (MetroNorte): serie 8000 de tres coches | 609 | [Vía Libre, mayo de 2010](https://vialibre-ffe.com/pdf/5536_27a31.pdf): 72 sentadas, 2 sillas de ruedas y 535 de pie |
| Metro, línea 11: serie 9000 de tres coches | 637 | [Vía Libre, 4-3-2006](https://vialibre-ffe.com/noticias.asp?not=512): la mitad de las 1.274 de la de seis coches (178 sentadas, 1.094 de pie y 2 sillas) |
| Metro Ligero, Citadis 302 de 32 m | 204 | [Metro Ligero Oeste, folleto técnico](https://www.metroligero-oeste.es/uploads/files/358.folleto-tecnico-espanol-v2.pdf): 54 sentadas, a 4 de pie por m² |
| Autobús interurbano | 79 | [Consorcio, 11-6-2024](https://crtm.es/comunicacion/sala-de-prensa/noticias/noticias/11062024-la-comunidad-de-madrid-incorpora-73-autobuses-interurbanos-hibridos-a-su-flota/): los híbridos de 13 m incorporados en 2024 |

## Cautelas

- Hasta noviembre de 2026 las cifras de Metro citaban la Wikipedia en inglés, que no da ninguna
  capacidad, y dos vehículos estaban desfasados: MetroNorte lleva la serie 8000 de tres coches
  desde 2021 (antes, 630 con la 9000) y la línea 11 la serie 9000 de tres coches desde enero de
  2025 (antes, 840 con la 8000 de cuatro). Los vehículos de cada línea salen de la Wikipedia en
  español («MetroNorte», «Línea 11»), que no cita fuente para eso.
- Vía Libre da 838 plazas para la serie 9000 de tres coches, pero sus 757 de pie no cuadran con
  los 1.094 de la de seis (darían unos 547): parece una errata y se usa la mitad de la de seis.
- El horario no dice si un tren de Cercanías va en doble composición: se cuenta simple.
- El autobús es el último modelo incorporado, no la media de la flota, que el Consorcio no publica.
- Los horarios de los autobuses no cuentan el tráfico de la hora punta.

# Hasta dónde se llega en transporte público

> **No es lo que pinta la web.** El usuario prefirió el mapa al revés (`ciudad.md`). Esto queda para
> otra medida: los empleos a los que se llega en 45 minutos. Las fuentes y la comprobación de
> abajo valen también para `ciudad.py`.

Calculado el 19-10-2026 con `herramientas/transporte/isocronas.py`. Datos en `datos/transporte.js`.
Piloto: Parla y Getafe. El script admite las once (`--ciudades parla getafe leganes …`), pero
hay que añadir cada ayuntamiento a `ORIGENES`.

## La pregunta

Saliendo del ayuntamiento un martes laborable por la mañana, ¿hasta dónde se llega en 15, 30, 45
y 60 minutos en Cercanías, Metro, Metro Ligero y autobús, andando al principio y al final?

Se descartó un primer enfoque (el tiempo desde cada punto de la ciudad hasta Sol, Atocha, Nuevos
Ministerios y Plaza de Castilla, en una rejilla que tapaba el término): el usuario prefirió un mapa
radial, como los de «desde París, ¿hasta dónde llegas en una hora?». El cálculo de aquel enfoque
sigue en `tiempos.py` y escribe fuera de la web.

## Fuentes

- **Horarios**: GTFS del [Consorcio Regional de Transportes de Madrid](https://datos.crtm.es/),
  descargados el 19-10-2026 de su portal (`tiempos.py --descargar`):
  - [Cercanías](https://datos.crtm.es/datasets/1a25440bf66f499bae2657ec7fb40144) (publicado el 19-10-2026; origen: Renfe)
  - [Metro](https://datos.crtm.es/datasets/5c7f2951962540d69ffe8f640d94c246) (publicado el 30-05-2025, **validez hasta el 27-05-2026**)
  - [Metro Ligero](https://datos.crtm.es/datasets/aaed26cc0ff64b0c947ac0bc3e033196) (16-10-2026)
  - [Autobuses urbanos](https://datos.crtm.es/datasets/357e63c2904f43aeb5d8a267a64346d8) (16-10-2026)
  - [Autobuses interurbanos](https://datos.crtm.es/datasets/885399f83408473c8d815e40c5e702b7) (16-10-2026)
  - [EMT Madrid](https://datos.crtm.es/datasets/868df0e58fca47e79b942902dffd7da0) (16-10-2026)
- **Origen**: la dirección de cada ayuntamiento, geocodificada con
  [CartoCiudad](https://www.cartociudad.es/) (IGN): Parla, plaza de la Constitución, 1
  (ref. catastral 4347817VK3544N); Getafe, plaza de la Constitución, 1 (7921806VK3672S).
- **Plano**: términos municipales del [WFS INSPIRE del IGN](https://www.ign.es/wfs-inspire/unidades-administrativas)
  (simplificados a 60 m) y recorridos de Cercanías, Metro y Metro Ligero de los mismos GTFS
  (`shapes.txt`, simplificados a 25 m).

## Método

Se hacen dos cuentas: **solo tren** (Cercanías, Metro y Metro Ligero), que es la que la web enseña
al entrar, y **con autobuses** (urbanos, interurbanos y EMT), que se ve marcando una casilla. Los
autobuses van con su horario, que en hora punta no siempre cumplen por los atascos.

1. **Día**: martes 27-10-2026, laborable normal. El GTFS de Metro caducó el 27-05-2026; se usa
   su servicio de los martes (`4_I14`) y la página lo dice.
2. **Algoritmo**: *Connection Scan Algorithm* hacia delante (Dibbelt, Pajor, Strasser y Wagner),
   una vez por cada minuto de salida entre las 7:30 y las 8:30 (61 salidas). Da la llegada más
   temprana a cada parada, sin límite de transbordos.
3. **Andar**: línea recta × 1,3 a 4,5 km/h. Hasta 1.200 m del ayuntamiento a la primera parada y
   de la última parada al destino. Transbordos a pie de hasta 400 m más 3 minutos de margen
   (andenes, pasillos); el `transfers.txt` de Cercanías sustituye ese cálculo donde lo trae.
4. **Destinos**: los centros de una rejilla de 250 m (EPSG:25830, alineada con la Puerta del Sol)
   a menos de 1.200 m de una parada o del ayuntamiento, en 45 km alrededor de Sol. Para cada
   celda, la mediana de las 61 salidas. Las celdas a las que no se llega no cuentan.
5. **Isócronas**: unión de las celdas con mediana igual o menor que cada umbral; se cierra y se
   abre con un radio de 150 m para redondear la escalera de la rejilla, y se simplifica a 15 m.
   El área (km²) se mide sobre ese polígono.
6. **Coordenadas**: metros respecto a la Puerta del Sol (40,41688 N, 3,70326 O), en EPSG:25830,
   iguales para todas las ciudades: los mapas comparten escala.

## Comprobación

`python3 herramientas/transporte/comprobar.py` calcula con el mismo algoritmo el tiempo mediano de
estación a estación y lo contrasta con la consulta oficial de horarios de Renfe Cercanías
(horarios.renfe.com, núcleo de Madrid, mismo día y ventana). Resultado del 19-10-2026, en
minutos (mediana, percentil 25, percentil 75):

| Trayecto | Modelo | Renfe |
|---|---|---|
| Parla → Atocha | 31, 29, 32 | 31, 29, 32 |
| Parla → Sol | 35, 33, 36 | 35, 33, 36 |
| Getafe Centro → Atocha | 22, 20, 23 | 22, 20, 23 |
| Getafe Centro → Sol | 26, 24, 27 | 26, 24, 27 |
| Getafe Centro → Nuevos Ministerios | 31, 29, 32 | 31, 29, 32 |

## Resultados del piloto

Desde el ayuntamiento, mediana de las salidas de 7:30 a 8:30. Minutos hasta las estaciones (en las
dos cuentas salen iguales) y km² alcanzables:

| | Sol | Atocha | Nuevos Ministerios | Plaza de Castilla | 30 min | 45 min | 1 hora |
|---|---:|---:|---:|---:|---:|---:|---:|
| Parla, solo tren | 43 | 39 | 48 | 57 | 18,4 | 55,7 | 139,1 |
| Getafe, solo tren | 35 | 31 | 40 | 49 | 24,6 | 99,9 | 223,8 |
| Parla, con autobuses | 43 | 39 | 48 | 57 | 22,1 | 74,1 | 202,6 |
| Getafe, con autobuses | 35 | 31 | 40 | 49 | 32,2 | 129,7 | 336,0 |

## Cautelas

- Es una cuenta nuestra sobre horarios oficiales: no cuenta retrasos, trenes llenos ni obras.
- El ayuntamiento es un solo punto. Un vecino que vive junto a otra estación tarda distinto.
- Andar en línea recta × 1,3 es una aproximación: no hay red de calles.
- El área mide superficie alcanzable, no gente ni empleos.
- El GTFS de Metro está caducado (ver arriba).

## Lo que no está

- **Las otras nueve ciudades**: pendiente de añadir su ayuntamiento a `ORIGENES` y recalcular
  (unos 6 minutos por ciudad).
- **Empleos o población alcanzables**: sería la medida más útil (cuántos puestos de trabajo
  quedan a 45 minutos), cruzando las isócronas con los afiliados por municipio; no se ha hecho.

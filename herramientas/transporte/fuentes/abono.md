# Lo que cuesta el abono

Calculado el 20-10-2026 con `herramientas/transporte/abono.py`. Datos en `abono.json` y, para la
web, en `datos/transporte.js` (`indice.py`).

## Fuentes

- **Precios**: [BOCM del 31-12-2025, precios del transporte público para 2026](https://www.crtm.es/media/s1qi0nmo/bocm-20251231-precios_transporte.pdf),
  enlazado desde la página de [tarifas del Consorcio](https://www.crtm.es/billetes-y-tarifas/). Tabla «Abono
  transporte: precios aplicables con descuento desde 1/1/2026», título de 30 días, perfil normal,
  ordinario. El script descarga el PDF y comprueba que las cifras que usa siguen ahí.
- **Zona de cada ciudad**: el `zone_id` de las paradas de Metro, Metro Ligero y autobús de los GTFS
  del [Consorcio](https://datos.crtm.es/) que caen dentro del término; la más repetida. Cercanías
  no trae `zone_id`.

## Resultado

| Zona | Abono 30 días | Ciudades |
|---|---:|---|
| B1 | 38,20 € | Getafe, Leganés, Alcorcón, Alcobendas, Pozuelo de Alarcón |
| B2 | 43,20 € | **Parla**, Pinto, Fuenlabrada, Móstoles, Torrejón de Ardoz, Majadahonda |

El abono joven cuesta 10 € en todas las zonas. El anual vale 10 veces el de 30 días. Recuento de
paradas por zona en cada término, en `abono.json`: hay alguna parada suelta de la zona vecina en el
borde (Getafe, 18 de 686 en B2), nunca una mayoría.

## Cautelas

- La zona va por distancia a Madrid: que Parla pague más que Getafe se explica por eso, y la página
  lo dice.
- Solo el ordinario: hay descuentos de familia numerosa y discapacidad, y precios por tramo de edad.

---
version: 1
slug: "infraestructura-html"
primary_target: "infraestructura.html"
related_targets: []
---

# Infraestructura: salir en coche

Scope: página /<ciudad>/infraestructura/ (local: infraestructura.html#<ciudad>) y un bloque resumen en index.html. Modo: Persuade, dentro del mundo ya establecido (PRODUCT.md y assets/estilos.css; sin paleta nueva).

Audiencia y trabajo: el mismo vecino del andén. Sale sabiendo por cuántas puertas se sale de Parla en coche por la mañana y cuánta gente se agolpa en la principal, frente a su ciudad. Prueba: Rutas por carretera y estudio básico del Ministerio (16-10-2024, estable en 2023), aforo CAM 2024 de la M-408, notas oficiales del Ministerio sobre la A-42, tarifas SEITT de la R-4.

Restricciones: voz seca, sin antítesis, ningún número sin fuente enlazada; cifras de 6-10 h declaradas como estimación; viajeros, no vehículos. Parla en azul (--ref), tu ciudad en tinta gris (--ink-3); el rojo solo para pérdida. Sin dashboard, sin tooltips.

## Direction contract

THESIS: Cada acceso por carretera es una puerta y la gente que sale de 6 a 10 hace cola delante de la suya, un punto por cada 100 personas. Rechaza el mapa con flechas y el gráfico de barras de tráfico.

OWN-WORLD: Blanco/negro automático de la web, Archivo condensado 800 en mayúsculas, Parla en azul, tu ciudad en gris tinta, rejilla de puntos de 6-8 px como la rejilla de unidades de la portada, filetes de 1px, cada puerta rotulada con su carretera como un letrero de andén.

STORY: Ve que de Parla se sale por tres puertas y que en una se agolpan 7 de cada 10; ve las de su ciudad repartidas; lee que por la mañana sale de Parla mucha más gente de la que entra; lee lo que dice el Ministerio de la A-42 y lo que cuesta la R-4; vuelve al recuento.

FIRST VIEWPORT: Titular-selector «Salir de [Getafe] en coche, y salir de Parla» arriba; golpe calculado en una línea; debajo, a todo el ancho, las colas de Parla: las puertas una al lado de otra, cada una con su dintel, su rótulo y su cifra, y debajo su cola de seis en fondo; la de la A-42 crece hacia abajo mucho más que las otras. Enlace de vuelta discreto arriba.

FORM: La cola en cada puerta, posición 6 de mi lista ordenada, seed key 80d1a0db. Interacción firma: al entrar en pantalla los puntos llegan andando desde abajo hacia su puerta y se colocan en su cola, escalonados (desde abajo y no desde la izquierda: las colas son columnas que cuelgan de la puerta, y se llega a ellas por detrás); se apaga con prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Cambio de estructura (14-10-2026)

Tras comparar cuatro versiones (colas, mapa, perímetro, cartel), el usuario eligió juntar tres en la misma página, en este orden: el mapa real con la gente fluyendo (pieza principal), los paneles de salida (la parte relativa; primero con cien cuadros, luego un treemap) y las colas (la parte absoluta). El perímetro se descartó. Después el usuario quitó también el treemap: la página queda en mapa y colas, y los mapas pasan a tener el mismo tamaño con escalas distintas.

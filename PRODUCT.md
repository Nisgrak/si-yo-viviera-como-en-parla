# Si yo viviera como en Parla

**Register:** brand — el diseño *es* el producto. Es una página de campaña, no una herramienta.

## Qué es

Una web reivindicativa que convierte una desigualdad abstracta («Parla está peor dotada») en una
lista concreta de cosas con nombre que desaparecerían de tu ciudad. El argumento no lo pone el
texto: lo pone el recuento.

## A quién va dirigida

Vecinos del sur de Madrid, en el móvil, probablemente en el bus o el Cercanías. Gente que ya
intuye el agravio y necesita munición verificable para discutirlo. Secundariamente: periodistas
locales, concejales de la oposición, plataformas vecinales.

## La escena

Las siete de la tarde de un martes de noviembre, en el andén. Alguien abre el enlace que le han
pasado por WhatsApp, lo lee entero de pie y reenvía la captura del hospital. De ahí salen las
decisiones: fondo oscuro, una sola columna, cifras enormes, cero adornos, todo legible en
treinta segundos y a la vez auditable hasta la fuente.

## Voz

Municipal, seca, exacta. Un acta, no un panfleto. La web nunca grita: enumera. La fuerza viene de
que cada afirmación lleva pegado su origen y de que admite en voz alta los casos en los que Parla
está mejor. Un dato que no aguanta una réplica no entra.

## Principio irrenunciable

**Ningún número sin fuente, y ninguna fuente sin enlace.** Si un dato no se puede obtener de una
fuente oficial comparable entre municipios, se declara pendiente en la propia web.

**Y ningún cociente sin el denominador correcto.** Los colegios se miden contra los niños en edad
escolar, no contra los habitantes: Parla es bastante más joven que Getafe y la comparación fácil
la habría favorecido sin motivo. La base de cada indicador se enseña en su propio apartado.

La credibilidad es el producto; sin ella esto es un cartel más.

## Sistema visual

- **Registro:** aviso de obra pública / señalética de transporte, no revista editorial.
- **Fondo:** negro neutro `#0a0a0a`, croma cero. La emoción la llevan los tres acentos.
- **Papeles semánticos** (validados para daltonismo y contraste antes de escribir una línea):
  - rojo `#f44f3c` — lo que desaparece
  - azul `#3f93f9` — Parla, la vara de medir
  - verde `#26a55a` — lo que se ganaría
  - hueso `#f5f5f5` — lo que sobrevive
- **Tipografía:** Archivo variable, una sola familia. Titulares en ancho condensado y peso 800;
  texto en ancho normal. El contraste lo dan el peso y el ancho, no una segunda fuente.
- **Jerarquía de lectura:** portada → «El recuento» (todo lo que cae, con nombre, en una
  pantalla) → contexto → el detalle de cada cosa. Quien solo lea una sección tiene que salir
  sabiendo qué desaparece y cómo se llama.
- **Regla de los nombres:** lo que se pierde se ve siempre; lo que sobrevive se pliega. Nunca
  al revés.
- **Marca recurrente:** la unidad tachada. Un cuadrado que se convierte en contorno rojo con una
  diagonal. Es el único pictograma del sistema y aparece en todas las escalas.
- **Movimiento:** el tachado entra escalonado cuando la sección se ve, y el contador de cabecera
  acumula pérdidas según bajas. Nada más. Todo se apaga con `prefers-reduced-motion`.

## Lo que no es

- No es un dashboard. No hay filtros, ni selectores de rango, ni tooltips.
- No es una revista. Nada de serif italic, capitulares ni rejilla de broadsheet.
- No es neutral, pero tampoco es tramposa: la sección «Y esto lo ganarías» existe precisamente
  para que la parte reivindicativa se sostenga.

## Estado

v1: Getafe contra Parla, 14 indicadores, 47 equipamientos perdidos, más 7,7 plazas
residenciales públicas y 20 unidades de hospital que se cuentan aparte.
Siguiente: Fuenlabrada, Leganés, Alcorcón, Móstoles y distritos de Madrid; después, deporte y
zonas verdes cuando haya fuente comparable.

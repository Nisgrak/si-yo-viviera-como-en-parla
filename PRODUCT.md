# Si yo viviera como en Parla

**Register:** brand — el diseño *es* el producto. Es una página de campaña, no una herramienta.

## Qué es

Una web reivindicativa que convierte una desigualdad abstracta («Parla está peor dotada») en una
lista concreta de cosas con nombre que desaparecerían de tu ciudad. El argumento no lo pone el
texto: lo pone el recuento.

## A quién va dirigida

Vecinos de las ciudades del sur de Madrid —el municipio se elige en la portada—, en el móvil, probablemente en el bus o el Cercanías. Gente que ya
intuye el agravio y necesita munición verificable para discutirlo. Secundariamente: periodistas
locales, concejales de la oposición, plataformas vecinales.

## La escena

Las siete de la tarde de un martes de noviembre, en el andén. Alguien abre el enlace que le han
pasado por WhatsApp, lo lee entero de pie y reenvía la captura del hospital. De ahí salen las
decisiones: fondo oscuro, una sola columna, cifras enormes, cero adornos, todo legible en
treinta segundos y a la vez auditable hasta la fuente.

## Voz

Municipal, seca, exacta. Y con una prohibición concreta: **nada de antítesis**. La construcción
«no es X: es Y» es adictiva y, repetida, delata a una máquina. Los datos se enuncian y se dejan
estar; la interpretación va aparte y se nota que es interpretación. Un acta, no un panfleto. La web nunca grita: enumera. La fuerza viene de
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
- **Fondo:** blanco puro por defecto, con tema oscuro automático según el sistema. Se lee de día,
  se comparte en capturas y se parece más a un aviso público que a un panel de control.
- **Papeles semánticos** (validados para daltonismo y contraste antes de escribir una línea):
  - rojo `#c02719` — lo que desaparece
  - azul `#1a67c2` — Parla, la vara de medir
  - verde `#1d7635` — lo que se ganaría
  - tinta `#161616` — lo que sobrevive
- **Tipografía:** Archivo variable, una sola familia, servida desde el propio dominio para que
  abrir la web no genere ni una petición a terceros. Titulares en ancho condensado y peso 800;
  texto en ancho normal. El contraste lo dan el peso y el ancho, no una segunda fuente.
- **El golpe se calcula, no se escribe.** La frase de la portada que resume el agravio sale de
  contar posiciones en los datos. Así no puede quedarse obsoleta ni decir más de lo que hay.
- **El selector es la frase.** Elegir municipio no es un control aparte: es la primera palabra
  del titular. «Vivo en [Getafe] y si viviera como en Parla… me faltarían 47». El desplegable
  lleva el mismo tipo y el mismo peso que el resto del titular, en azul y subrayado para que se
  vea que se toca.
- **Jerarquía de lectura:** portada → «El recuento» (todo lo que cae, con nombre, en una
  pantalla) → contexto → el detalle de cada cosa. Quien solo lea una sección tiene que salir
  sabiendo qué desaparece y cómo se llama.
- **Regla de los nombres:** lo que se pierde se ve siempre; lo que sobrevive se pliega. Nunca
  al revés.
- **Iconos:** un glifo de trazo por indicador, dibujados con la misma rejilla y el mismo grosor
  para que ninguno pese más que otro. Aparecen en el recuento y en la cabecera de cada apartado,
  nunca grandes ni decorativos.
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

v3: siete ciudades contra Parla —Leganés 67, Fuenlabrada 61, Móstoles 59, Alcorcón 58,
Getafe 47, Alcobendas 21, Pinto 9—
con 12 indicadores, más las plazas residenciales públicas y la cartera del hospital, que se
cuentan aparte. Pinto es el contraejemplo que sostiene la credibilidad: pierde poco y en
hospital está por debajo de Parla, y la web lo dice en su propia portada.

Siguiente: distritos de Madrid; después, deporte, zonas verdes y teatros cuando haya una fuente
comparable entre municipios.

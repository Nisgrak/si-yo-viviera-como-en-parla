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
  del titular. «Vivo en [Getafe] y si viviera como en Parla… me faltarían 50». El desplegable
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
- **Marca recurrente:** la unidad tachada, que es también el icono de la web (`assets/icono.svg`):
  un cuadrado de contorno rojo con una diagonal, sobre fondo blanco para que se lea en pestañas
  claras y oscuras. Un cuadrado que se convierte en contorno rojo con una
  diagonal. Es el único pictograma del sistema y aparece en todas las escalas.
- **Movimiento:** el tachado entra escalonado cuando la sección se ve, y el contador de cabecera
  acumula pérdidas según bajas. Nada más. Todo se apaga con `prefers-reduced-motion`.

## Lo que no es

- No es un dashboard. No hay filtros ni selectores de rango. La excepción va aparte y avisada:
  «Todos los datos» (`consulta.html`), una página de consulta para quien quiere contrastar
  (periodistas, plataformas vecinales), con las once ciudades a la vez. Las páginas de campaña
  siguen siendo Parla frente a tu ciudad. Los gráficos de líneas y las barras
  de «de cada 100» enseñan un recuadro con las cifras de las dos ciudades al pasar el ratón o el
  dedo, y nada más: lo importante ya está escrito en la página sin tener que buscarlo.
- No es una revista. Nada de serif italic, capitulares ni rejilla de broadsheet.
- No es neutral, pero tampoco es tramposa: la sección «Y esto lo ganarías» existe precisamente
  para que la parte reivindicativa se sostenga.

## Estado

v6 (octubre de 2026): diez ciudades contra Parla —Leganés 69, Fuenlabrada 63, Alcorcón 61,
Móstoles 61, Getafe 50, Alcobendas 24, Pozuelo de Alarcón 18, Torrejón de Ardoz 14,
Majadahonda 12, Pinto 9— con 12 indicadores que suman, y aparte, fuera del recuento, las camas,
las plazas residenciales públicas, los alumnos de enseñanzas artísticas, las zonas verdes y la
cartera del hospital. Pinto es el contraejemplo que sostiene la credibilidad: pierde poco y en
hospital está por debajo de Parla, y la web lo dice en su propia portada.

Además del recuento, cinco páginas por ciudad, cada una con su resumen en la portada:

- **Vivienda**: comprar, alquilar, de quién son las casas, barrios, vivienda pública,
  desahucios y cómo son las casas.
- **Economía**: dónde se trabaja, el paro, lo que entra en casa, lo que se produce y las cuentas
  del ayuntamiento.
- **Infraestructuras**: en coche (por dónde sale la gente) y en transporte público (el tren a
  mano, cuánto se tarda hasta el centro y lo que cuesta el abono).

- **Sanidad**: lo que hay del recuento, la espera en el hospital que le toca a cada ciudad y las
  tarjetas sanitarias por plaza de médico de familia y de pediatra.
- **Educación**: lo que hay del recuento y quién se queda sin plaza en la escuela infantil
  pública de 0 a 2 años.

En la espera y en la escuela infantil Parla sale mejor que varias, y se dice. En economía, «Lo que paga un vecino»: el IBI y el coche
con la misma casa y con la de cada ciudad. Y aparte, «Todos los datos», la consulta de las once
ciudades a la vez.

Siguiente: los empleos a los que se llega en 45 minutos y los distritos de Madrid; después,
deporte y teatros cuando haya una fuente comparable entre municipios.

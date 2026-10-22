# Parla, a la cola

**Register:** brand — el diseño *es* el producto. Es una página de campaña, no una herramienta.

## Qué es

Una web reivindicativa que convierte una desigualdad abstracta («Parla está peor dotada») en una
lista concreta de huecos: lo que le falta a Parla para estar dotada como cada ciudad de
alrededor. El argumento no lo pone el texto: lo pone el recuento.

Empezó como «Si yo viviera como en Parla», que le hablaba a la gente de las otras ciudades de lo
que perderían. En octubre de 2026 se le dio la vuelta para hablarle a la gente de Parla: la
cuenta es la misma con los papeles cambiados (`calculo.js`, `faltan`). El nombre recoge la cola
de la ballena, el monumento del Parque de la Ballena, que ya usaba Urge Parla («Salvemos la
ballena»).

## A quién va dirigida

Vecinos de Parla, en el móvil, probablemente en el bus o el Cercanías. Gente que ya intuye el
agravio y necesita munición verificable para discutirlo; la ciudad con la que se compara se
elige en la portada. Secundariamente: periodistas locales, concejales, plataformas vecinales
como Urge Parla.

## La escena

Las siete de la tarde de un martes de noviembre, en el andén de Parla. Alguien abre el enlace que
le han pasado por WhatsApp, lo lee entero de pie y reenvía la captura del hospital. De ahí salen las
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
  - rojo `#c02719` — lo que le falta a Parla
  - azul `#1a67c2` — Parla en los gráficos, y la ciudad que se elige en el titular, que es lo
    que se toca
  - verde `#1d7635` — donde Parla tiene más
  - tinta `#161616` — lo que hay
- **Tipografía:** Archivo variable, una sola familia, servida desde el propio dominio para que
  abrir la web no genere ni una petición a terceros. Titulares en ancho condensado y peso 800;
  texto en ancho normal. El contraste lo dan el peso y el ancho, no una segunda fuente.
- **El golpe se calcula, no se escribe.** La frase de la portada que resume el agravio sale de
  contar posiciones en los datos. Así no puede quedarse obsoleta ni decir más de lo que hay.
- **El selector es la frase.** Elegir ciudad no es un control aparte: es la palabra grande del
  titular, que es una pregunta en primera persona del plural, porque quien la hace es un vecino:
  «¿Y si en Parla viviéramos como en [Getafe]? Tendríamos 37 más». El desplegable lleva
  el mismo tipo y el mismo peso que el resto del titular, en azul y subrayado para que se vea
  que se toca. En las páginas temáticas, igual: «La sanidad de Parla y la sanidad de [Getafe]».
- **Dos voces:** la cabecera de la portada habla en plural, como vecinos («tendríamos»,
  «donde estamos mejor»); el resto de la web, en tercera persona y seca, como un acta («A Parla
  le faltan…»).
- **Jerarquía de lectura:** portada → «El recuento» (todo lo que falta, en una pantalla) →
  contexto → el detalle de cada cosa. Quien solo lea una sección tiene que salir sabiendo qué le
  falta a Parla.
- **Regla de los huecos:** lo que falta se ve siempre; lo que hay en la otra ciudad se pliega.
  Lo que falta no existe y no tiene nombre: cada hueco se nombra por su puesto («la 3.ª
  biblioteca pública»). Con más de seis, los dos primeros y el resto en una fila. La excepción
  es el hospital, donde lo que falta son unidades con nombre.
- **Iconos:** un glifo de trazo por indicador, dibujados con la misma rejilla y el mismo grosor
  para que ninguno pese más que otro. Aparecen en el recuento y en la cabecera de cada apartado,
  nunca grandes ni decorativos.
- **El hueco:** la unidad que falta. Un cuadrado vacío en rojo con la curva de cada esquina
  entera y un trazo largo centrado en cada lado, dibujado con una máscara (`--hueco`) para que
  sea igual a cualquier tamaño. En la tira va detrás de los cuadrados negros de lo que hay; la
  parte de un hueco solo lleva en rojo el trozo que falta.
- **La ballena:** la marca de Parla. La cola de la escultura del Parque de la Ballena, vista de
  lado, recortada de una foto y en dos tonos, como al sol: la cara iluminada más clara que la
  que queda en sombra (en oscuro se invierten). Va junto al nombre en todas las cabeceras, de
  icono de la web y, entera y muy clara, de fondo en la portada saliendo del borde inferior. Se
  usa siempre entera: recortada a la aleta se confunde con otras siluetas.
- **Movimiento:** los huecos aparecen escalonados cuando la sección se ve, y el contador de
  cabecera suma lo que falta según bajas. Nada más. Todo se apaga con `prefers-reduced-motion`.

## Lo que no es

- No es un dashboard. No hay filtros ni selectores de rango. La excepción va aparte y avisada:
  «Todos los datos» (`consulta.html`), una página de consulta para quien quiere contrastar
  (periodistas, plataformas vecinales), con las once ciudades a la vez. Las páginas de campaña
  siguen siendo Parla frente a una ciudad. Los gráficos de líneas y las barras
  de «de cada 100» enseñan un recuadro con las cifras de las dos ciudades al pasar el ratón o el
  dedo, y nada más: lo importante ya está escrito en la página sin tener que buscarlo.
- No es una revista. Nada de serif italic, capitulares ni rejilla de broadsheet.
- No es neutral, pero tampoco es tramposa: la sección «Donde Parla tiene más» existe
  precisamente para que la parte reivindicativa se sostenga.

## Estado

v7 (octubre de 2026): Parla en el centro. Lo que le falta para estar dotada como cada una de las
otras diez —Leganés 55, Fuenlabrada 51, Alcorcón 51, Móstoles 43, Getafe 37, Pozuelo de
Alarcón 27, Alcobendas 26, Majadahonda 23, Pinto 22, Torrejón de Ardoz 13— con 12 indicadores
que suman, y aparte, fuera del recuento, las camas, las plazas residenciales públicas, los
alumnos de enseñanzas artísticas, las zonas verdes y la cartera del hospital. Las cifras no son
las de antes con el signo cambiado: se ajustan al tamaño de Parla y no al de la otra ciudad (Pinto
pasa de 9 a 22). Pozuelo, Alcobendas, Majadahonda, Pinto y Torrejón son el contraejemplo que
sostiene la credibilidad: con ellas Parla tiene más en algo, y la portada lo dice.

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

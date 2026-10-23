# El vídeo

Un vídeo vertical (1080×1920, unos 70 s) para el móvil: una vecina de Parla cuenta
su día y, por el camino, lo que le falta a Parla frente a Getafe. Termina en el
recuento, «tendríamos 21 equipamientos y servicios públicos más». Está pensado
para WhatsApp, Reels y TikTok.

Nada va escrito a mano. Las cifras salen de los mismos datos que la web
(`datos/*.js`) y de la misma cuenta (`assets/calculo.js`). La voz decide los
tiempos y la imagen se ajusta a ella. Si cambian los datos, basta con volver a
sacarlo.

## Sacarlo

```
cd herramientas/video
npm install          # la primera vez: Playwright
npm run video        # voz + audio + render → salida/parla-vs-getafe.mp4
```

Por partes:

| Comando | Qué hace | Tarda |
|---|---|---|
| `python3 voz.py` | La locución (`salida/voz.wav`) y los tiempos (`salida/tiempos.js`). Solo sintetiza las frases que han cambiado: el resto lo saca de la caché `salida/voz/`. | segundos; ~1 min si cambian todas |
| `python3 audio.py` | Mezcla la música, los efectos y la voz (`salida/audio.wav`). | segundos |
| `node fotogramas.cjs 0 16.8 60` | Saca fotogramas sueltos de esos segundos (`salida/fotograma-NN.png`), para revisar sin renderizar. | segundos |
| `node render.cjs` | El vídeo entero. Va en paralelo, un navegador por núcleo (o los que diga `PARTES=n`), y escribe una línea por cada 1 % con lo que lleva y lo que queda. | ~3 min con 4 núcleos |

En segundo plano: `npm run video > salida/render.log 2>&1` y se sigue con
`tail -f salida/render.log`.

`salida/` no va al repositorio: es todo lo que se genera.

### Lo que necesita

- **Node, Python 3 con numpy y ffmpeg.**
- **La voz, Phonon** (`gradium/phonon-40m-es`, licencia CC BY-NC), que corre en local.
  `voz.py` busca el comando `ptts` en `PTTS`, luego en el `PATH` y por último en
  `~/phonon-build/xn-ptts/target/release/ptts`. La primera vez se descarga el modelo
  de Hugging Face (`HF_TOKEN` o `hf auth login`).
- **La voz por defecto es Alba.** Otras: `python3 voz.py Noa` (y Lucía-Sol, Candela,
  Celia, Alicia, Nerea). Las de Kokoro (`ef_dora`…) van por la API de NaN, con
  `NAN_KEY` en el `.env` de la raíz.

## Cómo está hecho

```
cifras.js   las cifras (calcular) y el guion (guion), a partir de los datos
   │
   ├─ guion.cjs ─→ voz.py ─→ salida/voz.wav + salida/tiempos.js
   │                                   │
   │                                   ├─→ audio.py ─→ salida/audio.wav
   │                                   │
   └──────────────→ video.html ←───────┘   (render(t) pinta el segundo t)
                        │
                        └─ render.cjs / fotogramas.cjs (Chromium + ffmpeg)
```

- **`cifras.js`** tiene la ciudad con la que se compara (`OTRA`), las cifras
  (`calcular`), el guion frase a frase (`guion`) y cómo se pasan los números a letra.
  Lo usan el navegador y Node.
- **El guion** es una lista de `[id, escena, pausa antes, texto, {opciones}]`:
  - `voz.py` coloca cada frase detrás de la anterior, con su pausa.
  - Cada escena empieza 0,9 s antes que su primera frase.
  - `marca: 'veintiún'` apunta cuándo se dice esa palabra, para que la cifra salga
    en pantalla en ese momento. Se estima por su posición en el texto.
  - `vel: 0.88` dice esa frase más despacio.
- **`salida/tiempos.js`**, que escribe `voz.py`, guarda dónde empieza cada escena
  (`S`), dónde empieza y acaba cada frase (`F`, `E`), las marcas (`M`) y lo que dura
  todo (`DUR`). En `video.html` se usan con `en('a42')`, `fin('a42')` y
  `marca('si')`. **Si cambias el guion, vuelve a pasar `voz.py` antes de mirar
  fotogramas.**
- **`video.html`** monta las escenas con los datos y expone `render(t)`, que deja la
  página como está en el segundo `t`. Todo lo que se mueve depende solo de `t`
  (también los puntos de los mapas), así que un fotograma sale igual cada vez y se
  puede renderizar por trozos.
- **Los mapas de carreteras** son los de «Por dónde sale la gente», en
  `infraestructura.html`: los datos de `datos/mapa/<id>.js` y la misma regla de
  ancho en los dos, adaptada de `assets/infraestructura-mapa.js`.

## La historia, escena a escena

| Escena | Qué cuenta | Dato |
|---|---|---|
| portada | «Vivo en Parla. Y un día me puse a hacer una cuenta.» | la pregunta, sin el 21 |
| coche | Por la mañana, siete de cada diez salen por la A-42; en Getafe, repartidos | mapas de Parla y Getafe, 70 % |
| tren | 45 min hasta Atocha desde la casa del medio, 34 en Getafe; Metro, ninguno | |
| hospital | El Infanta Cristina: 1,0 camas por cada 1.000 personas que atiende; Getafe, más del doble | |
| dinero | Inversión del ayuntamiento: 23 € por vecino y año; Getafe, casi siete veces más (156 €) | |
| total | Lo conté todo… tendríamos 21 más | los 48 que hay y los 21 huecos |
| cierre | «En la web puedes hacer la cuenta con tu ciudad.» «Y Parla sigue a la cola.» | |

## Criterios

Lo que se ha decidido y por qué, para no deshacerlo sin querer.

**La historia**
- **Se cuenta como una historia, no como una lista de datos.** Una vecina, en primera
  persona, cuenta su día, y cada dato aparece cuando la historia lo pide. La primera
  versión, con 16 frases y 9 bloques de datos en 100 s, «vomitaba datos» e iba
  demasiado rápido.
- **Pocos datos y despacio.** Cuatro datos con voz y el total. Antes de añadir uno,
  pregúntate cuál quitas. La espera de los hospitales se quitó, y también la «parte
  honesta» (Pozuelo y Majadahonda); esa honestidad ya la cubre la web.
- **El 21 va al final**, como desenlace. La portada solo hace la pregunta.
- **El final es triste, no una orden.** «Parla, a la cola» dicho a secas suena a
  mandar a alguien a la cola. Por eso se dice «Y Parla sigue a la cola», más
  despacio, detrás de la invitación a hacer la cuenta.

**La voz**
- **Va a su paso.** `BASE = -0.05` en `voz.py`. Las pausas son de 1,4 s entre escenas
  y de 0,6 a 0,9 s entre frases. La cifra de Parla y la de la otra ciudad van en
  frases separadas, con una pausa entre medias, para que se oiga el contraste.
- **No dejes frases sueltas de tres palabras** («Y en tren, se tarda»): suenan raras.
  Júntalas con la siguiente.
- **Las cifras van en letra** (`entero`, `letra`, `cuantas`), con el género bien puesto
  («veintiún equipamientos», «mil seiscientas cincuenta tarjetas»), y son las de la
  pantalla.
- **Las carreteras se escriben en letra**, «A cuarenta y dos» (`carretera()`): si no,
  la voz lee el guion.
- **Phonon no sabe decir «ciento»**: lee «cien cincuenta y seis». Cuando la cifra
  pasa de cien, dila como proporción («casi siete veces más», con `vecesMas()`;
  «más del doble») y deja la cifra exacta en pantalla.
- **Si un número no suena bien, escúchalo antes de cambiarlo.** Saca variantes con
  `ptts` a un `.wav` y compáralas. Desde Claude no se puede escuchar el audio.
- **Nada de antítesis** («no es X, es Y»), como en toda la web (PRODUCT.md). Una
  interpretación se dice como tal: «Luego miré las cuentas», no «la culpa es del
  dinero».

**La imagen**
- **Vertical, 1080×1920.** Lo importante va entre 300 y 1540 px de alto, porque arriba
  y abajo Reels y TikTok ponen sus botones. El margen es de 80 px a cada lado.
- **El primer fotograma es la miniatura**: tiene que estar completo en `t = 0`, sin
  animaciones a medias, y sin la mitad de abajo vacía.
- **La marca** (la ballena y «Parla, a la cola») está en el mismo sitio y con el
  mismo tamaño desde el primer fotograma hasta el cierre, para que no salte.
- **Sin flecha en el selector de ciudad**: en el vídeo no se toca.
- **Una idea por pantalla.** Cada cosa sale cuando la voz la dice y se queda quieta.
  Entre escenas, un fundido corto. No hay rótulos de capítulo: suenan a informe.
- **En los mapas**, el 70 % va a un lado de la A-42 para que se vea entera la banda
  de gente.
- **Los colores son los de la web**: azul `#1a67c2` para Parla, rojo `#c02719` para lo
  que falta y tinta para lo que hay. El hueco es la máscara `--hueco` de la web.

**El sonido**
- **La música** son acordes suaves, bajo y punteo en la menor, a 84 por minuto, de
  fondo durante todo el vídeo. Baja un 45 % cuando habla la voz y queda unos 7 dB por
  debajo. En el recuento se calla el punteo y suenan los huecos.
- **Los golpes** (un golpe grave y una campana) van en el 70 %, el 0 del Metro, el 21
  y el cierre. Nada más.

## Cambiar cosas

- **Otra ciudad:** cambia `OTRA` en `cifras.js` y saca el vídeo (`npm run video`). Sale
  en `salida/parla-vs-<id>.mp4`. Revisa los fotogramas: el guion tiene casos para
  cuando la otra no tiene Metro o tiene menos del doble de camas, pero los mapas y
  las frases no se han mirado con las diez ciudades.
- **Una frase:** cámbiala en `guion()`, en `cifras.js`. Si una cifra tiene que salir
  justo cuando se dice, ponle `marca`. Luego `python3 voz.py` y `node fotogramas.cjs …`.
- **Una escena:** su HTML va en `video.html`, dentro de `escena('id', …)`. Los efectos
  (`fx('fade' | 'left' | 'up' | 'grow' | 'pop' | 'slam', segundo, duración)`) llevan el
  segundo absoluto del vídeo, casi siempre `en(…)`, `fin(…)` o `marca(…)`.
- **Revisar sin renderizar:** saca fotogramas de los segundos clave y júntalos en una
  hoja: `ffmpeg -framerate 1 -i salida/fotograma-%02d.png -vf "scale=360:640,tile=8x2" -frames:v 1 salida/revision.png`.

## Trampas conocidas

- **`<use>` no sirve para la ballena.** Las variables CSS de color no llegan a los
  trazos de un `<symbol>`, así que la ballena va entera en cada sitio (`ballena()`).
- **El normalizador de `ptts` deja los números tal cual**: «156» lo lee el modelo a su
  manera.
- **Un `pkill -f` puede matar su propio comando** si el patrón aparece en él.
  Para parar un render, usa el PID.
- **`render.cjs` necesita `salida/tiempos.json`**: pasa `voz.py` antes.

## Pendiente

- **Un vídeo por ciudad**, con `OTRA` como parámetro y las diez en una pasada. Se
  aparcó en octubre de 2026.
- **La dirección de la web** sigue siendo `siyovivieracomoenparla.netlify.app`. Si cambia,
  hay que cambiarla en el cierre de `video.html`.

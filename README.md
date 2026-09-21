# Si yo viviera como en Parla

Web reivindicativa que responde a una pregunta muy concreta:

> **¿Cuántos servicios públicos desaparecerían de mi ciudad si estuviera dotada exactamente
> igual que Parla?**

Cinco ciudades del sur de Madrid comparadas contra Parla, con nombre y apellidos:

| Ciudad | Habitantes | Equipamientos que perdería |
|---|---:|---:|
| Leganés | 195.734 | **67** |
| Fuenlabrada | 190.076 | **61** |
| Alcorcón | 175.719 | **58** |
| Getafe | 193.238 | **47** |
| Pinto | 56.651 | **9** |

Pinto es el caso interesante: pierde poco porque ya está casi tan mal dotado como Parla, y en
sanidad hospitalaria está **peor** (no tiene hospital; Parla sí). La web lo dice.

## Cómo funciona

Para cada servicio:

```
lo que quedaría = servicios(Parla) / base(Parla) × base(tu ciudad)
pérdida         = servicios(tu ciudad) − lo que quedaría
```

La **base** no siempre es la población total. Una farmacia sirve a todo el mundo; un colegio
solo a los niños que tienen edad de ir. Parla es la ciudad más joven de la comarca, así que
usar la población total en educación la favorecería sin motivo:

| Indicador | Base |
|---|---|
| Escuelas infantiles y casas de niños | población de 0 a 2 años |
| Colegios públicos | población de 3 a 11 años |
| Institutos públicos | población de 12 a 17 años |
| Plazas en residencias públicas | población de 65 años o más |
| Todo lo demás | población total |

Con la población total como base, los colegios de Parla salían por encima de los de Getafe;
con los niños en edad escolar, salen por debajo.

Poblaciones totales: cifras oficiales del INE a 1 de enero de 2025.
Tramos de edad: INE, población por edad año a año, misma fecha (tabla 68543). Los totales de
las dos operaciones difieren en unos miles; ningún cálculo mezcla las dos.

Cuando el cálculo dice que sobran tres bibliotecas, la web tacha tres nombres concretos.
**Qué tres es ilustrativo** — no hay criterio técnico para decidir cuál cierra — y la web lo
dice en su apartado de método. Lo que no es ilustrativo es *cuántas*.

## Lo que no suma al total de portada

Dos indicadores se calculan igual pero se muestran aparte, porque no se cuentan en
equipamientos y sumarlos sería mezclar peras con manzanas:

- **Plazas en residencias públicas de mayores.** Se cuentan camas, no centros: es lo que de
  verdad se ocupa. Solo titularidad pública.
- **Unidades asistenciales del hospital público.** Un hospital no se reparte por habitante; lo
  que se compara es su cartera de servicios, en los dos sentidos.

Se marcan con `enTotal: false` en `datos/datos.js`.

## Estructura

```
index.html            estructura y textos fijos
assets/estilos.css    todo el diseño
assets/app.js         el cálculo y el render
datos/datos.js        LOS DATOS  ←  lo único que hay que tocar
```

No hay build, ni dependencias, ni framework. Se abre `index.html` y funciona.
El municipio se guarda en la URL (`#leganes`) y en el navegador, así que los enlaces son
compartibles.

## Añadir un municipio

En `datos/datos.js`:

1. Añádelo a `MUNICIPIOS`.
2. Añade su población y sus tramos de edad en cada entrada de `BASES.valores`.
3. Añade su bloque en `datos` dentro de **cada** indicador, con `n` y `lista`.
4. Añade su entrada en `hospitales` y en `contexto.renta` / `contexto.edades`.

La web decide sola si cada indicador es pérdida, ganancia o empate (umbral: 0,15 unidades), lo
ordena por gravedad y recalcula el total de la portada.

## Fuentes

Todas oficiales y enlazadas una por una en el apartado «Cómo está hecho esto»:

- **INE** · Cifras oficiales de población de los municipios españoles, 1 enero 2025
- **INE** · Población por sexo, edad año a año y nacionalidad, 1 enero 2025 (tabla 68543)
- **Comunidad de Madrid, datos abiertos** · registro de centros sanitarios, centros educativos,
  bibliotecas públicas, farmacias, registro de centros de atención social, renta disponible
  bruta municipal
- **Metro de Madrid** (línea 12), **Renfe Cercanías** (C-3, C-4, C-5), **CRTM** (ML-4)
- **UC3M** y **URJC** · campus oficiales

### Lo que todavía no está

No se han incluido por no tener una fuente oficial comparable entre municipios:

- **Teatros y espacios escénicos municipales.** Cada ayuntamiento cuenta con criterios
  distintos: Fuenlabrada lista cinco espacios incluyendo salas pequeñas, Alcorcón uno,
  Leganés incluye un teatro de verano al aire libre de 1.520 plazas. No es comparable.
- **Centros de servicios sociales.** El registro autonómico da 82 en Leganés y 33 en Alcorcón,
  una diferencia de 2,5× entre vecinos que huele a criterio de registro, no a realidad.
- Instalaciones deportivas municipales, zonas verdes por habitante, plantilla de Policía Local,
  tarjetas sanitarias por médico de familia y frecuencia real del transporte hasta Madrid.

Antes que inventar una cifra, la web dice que falta.

## Desplegar

Es una web estática. Sirve la carpeta tal cual:

```bash
python3 -m http.server 8000      # en local
```

En GitHub Pages, Netlify, Cloudflare Pages o Vercel: subir la carpeta, sin configuración.

Nota: el contenido se calcula en el navegador, así que un buscador sin JavaScript solo verá
la estructura. Si en algún momento importa el posicionamiento, el siguiente paso sería un
pequeño script de pre-render que escriba el HTML a partir de `datos/datos.js`.

## Accesibilidad

Contraste verificado, foco visible, navegación por teclado, textos alternativos para las
visualizaciones (cada indicador incluye su recuento en texto para lectores de pantalla) y
respeto a `prefers-reduced-motion`. La paleta está validada para daltonismo: el rojo y el
verde nunca aparecen juntos como única diferencia, siempre van con etiqueta.

Sin cookies, sin analítica, sin recursos de terceros salvo la tipografía (Google Fonts).

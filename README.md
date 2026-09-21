# Si yo viviera como en Parla

Web reivindicativa que responde a una pregunta muy concreta:

> **¿Cuántos servicios públicos desaparecerían de mi ciudad si estuviera dotada exactamente
> igual que Parla?**

Primera versión: **Getafe vs Parla**. La respuesta son **47 equipamientos**, con nombre y
apellidos.

## Cómo funciona

Para cada servicio:

```
lo que quedaría = servicios(Parla) / base(Parla) × base(Getafe)
pérdida         = servicios(Getafe) − lo que quedaría
```

La **base** no siempre es la población total. Una farmacia sirve a todo el mundo; un colegio
solo a los niños que tienen edad de ir al colegio. Y Parla es bastante más joven que Getafe,
así que usar la población total en educación la favorecería sin motivo:

| Indicador | Base | Getafe | Parla |
|---|---|---|---|
| Escuelas infantiles | población 0-2 años | 4.497 | 3.315 |
| Colegios públicos | población 3-11 años | 17.671 | 14.212 |
| Institutos públicos | población 12-17 años | 12.760 | 11.919 |
| Plazas en residencias públicas | población 65+ | 38.119 | 19.323 |
| Todo lo demás | población total | 193.238 | 137.471 |

Parla tiene un 29 % menos de población que Getafe pero solo un **7 % menos de adolescentes**.
Con la población total como base, sus colegios salían por encima de los de Getafe; con los
niños en edad escolar, salen por debajo.

Poblaciones totales: cifras oficiales del INE a 1 de enero de 2025.
Tramos de edad: INE, población por edad año a año, misma fecha (tabla 68543). Los totales de
las dos operaciones difieren en unos miles; ningún cálculo mezcla las dos.

Cuando el cálculo dice que sobran tres bibliotecas, la web tacha tres nombres concretos.
**Qué tres es ilustrativo** — no hay criterio técnico para decidir cuál cierra — y la web lo
dice en su apartado de método. Lo que no es ilustrativo es *cuántas*.

## Lo que no suma al total de portada

Dos indicadores se calculan igual pero se muestran aparte, porque no se cuentan en
equipamientos y sumarlos al «47» sería mezclar peras con manzanas:

- **Plazas en residencias públicas de mayores** (134 en Getafe, 64 en Parla) → −7,7 plazas.
  Se cuentan camas, no centros: es lo que de verdad se ocupa. Solo titularidad pública;
  contando las privadas Getafe suma 843 plazas y Parla 493, pero esas se pagan.
- **Unidades asistenciales del hospital público** (74 en Getafe, 54 en Parla) → 20 que faltan.
  Un hospital no se reparte por habitante; lo que se compara es su cartera de servicios.

Se marcan con `enTotal: false` en `datos/datos.js`.

## Estructura

```
index.html            estructura y textos fijos
assets/estilos.css    todo el diseño
assets/app.js         el cálculo y el render
datos/datos.js        LOS DATOS  ←  lo único que hay que tocar para actualizar
```

No hay build, ni dependencias, ni framework. Se abre `index.html` y funciona.

## Añadir un municipio

En `datos/datos.js`:

1. Añade su población a `POBLACIONES` (INE, cifras oficiales).
2. Pon `activo: true` en su entrada de `MUNICIPIOS`.
3. Añade su bloque `datos.<id>` en **cada** indicador, con `n` y `lista`.
4. En `assets/app.js`, `AQUI` toma el municipio de partida.

Los siguientes en la lista: Fuenlabrada, Leganés, Alcorcón, Móstoles y distritos de Madrid.

## Añadir un indicador

Un objeto más en `indicadores`, con esta forma:

```js
{
  id: 'algo',
  grupo: 'Sanidad',                  // Transporte · Sanidad · Educación · Cultura · Servicios sociales
  base: 'total',                     // o infantil · primaria · secundaria · mayores (ver BASES)
  titulo: 'Nombre visible',
  fuente: { t: 'Fuente oficial y año', url: 'https://…' },
  nota: 'Una o dos frases de contexto.',
  datos: {
    getafe: { n: 9, lista: ['Uno', 'Dos', …] },   // lista puede ir vacía
    parla:  { n: 5, lista: […] },
  },
}
```

La web decide sola si es pérdida, ganancia o empate (umbral: 0,15 unidades), lo ordena por
gravedad y actualiza el total de la portada.

## Fuentes

Todas oficiales y enlazadas una por una en el apartado «Cómo está hecho esto»:

- **INE** · Cifras oficiales de población de los municipios españoles, 1 enero 2025
- **INE** · Población por sexo, edad año a año y nacionalidad, 1 enero 2025 (tabla 68543)
- **Comunidad de Madrid** · Registro de centros de atención social (plazas autorizadas)
- **Comunidad de Madrid, datos abiertos** · registro de centros sanitarios, centros educativos,
  bibliotecas públicas, farmacias, centros de servicios sociales, renta disponible bruta municipal
- **Metro de Madrid**, **Renfe Cercanías**, **Consorcio Regional de Transportes**
- **Ayuntamientos** de Getafe y Parla

### Lo que todavía no está

No se han incluido por no tener una fuente oficial comparable entre municipios:
instalaciones deportivas municipales, zonas verdes por habitante, plantilla de Policía Local,
tarjetas sanitarias por médico de familia y frecuencia real del transporte a Madrid.

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

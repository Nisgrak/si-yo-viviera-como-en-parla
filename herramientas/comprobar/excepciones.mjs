/* LAS EXCEPCIONES de la prueba de la web, con su motivo. Todo lo demás se deriva de la propia página:
   lo que no está aquí tiene que cumplir la regla. Añadir una línea exige decir por qué. Si una
   excepción deja de hacer falta (la pieza ya cumple), `npm run comprobar` lo avisa para quitarla. */

/* (a) Secciones y apartados de la página que se decidió dejar sin «Cartel para compartir» y sin
   «Compartir esta sección». Clave: «pagina#id». Las que no están aquí, y no tienen los dos botones
   ni en ellas ni en lo que contienen, hacen fallar la prueba. */
const RESUMEN = 'Resumen de portada: cuenta lo que explica otra página, que ya tiene sus botones.';
const METODO = 'Cómo está hecho: fuentes y método, sin cifra que compartir.';
export const SIN_BOTONES = {
  'index.html#sobran': 'Donde Parla tiene más: lo que sobra no se comparte como queja; sus fichas se enseñan en la portada y no llevan cartel.',
  'index.html#salir': RESUMEN,
  'index.html#vivienda': RESUMEN,
  'index.html#sanidad': RESUMEN,
  'index.html#educacion': RESUMEN,
  'index.html#inclusion': RESUMEN,
  'index.html#partida': 'Punto de partida: habitantes y edades de cada ciudad, la base de la cuenta; no es un dato que se compare.',
  'index.html#metodo': METODO,
  'economia.html#metodo': METODO,
  'vivienda.html#metodo': METODO,
  'infraestructura.html#metodo': METODO,
  'sanidad.html#metodo': METODO,
  'educacion.html#metodo': METODO,
  'inclusion.html#metodo': METODO,
  'infraestructura.html#mapas': 'Mapas de por dónde sale la gente: dibujo sin cifra propia; la cifra va en «La salida más usada» y «Quién sale y quién entra».',
  'infraestructura.html#a42': 'La A-42 hacia Madrid: mapa de carga por tramos; su cifra va en el cartel de «colas» (la salida más usada).',
  'sanidad.html#hay': 'Lo que hay: varios indicadores del recuento sin cifra que encabece, y ya tienen su cartel en la portada.',
  'educacion.html#hay': 'Escuelas, colegios e institutos: varios indicadores del recuento sin cifra que encabece, y ya tienen su cartel en la portada.',
  'educacion.html#orientacion': 'Volver a estudiar y orientación: una matriz de caminos, sin cifra que comparar.'
};

/* (a) Botones «Cartel para compartir» que no llevan al lado «Compartir esta sección». */
export const CARTEL_SIN_ENLACE = {
  'portada-cartel': 'El cartel general de portada («le faltan N»): la propia web es el enlace, y la portada tiene su vista previa por ciudad.'
};

/* (c) Carteles de una sola cifra por naturaleza: no enseñan a Parla frente a otra ciudad. Los «Parla sola»
   por falta de dato de la otra ciudad no están aquí: se reconocen porque la vista previa de esa ciudad lo
   dice (la otra cifra es null) y llevan su motivo. */
export const UNA_CIFRA = {
  'portada-cartel': 'Cartel general de portada: «a Parla le faltan N», una sola cifra.',
  'cartera-botones': 'La cartera del hospital: cuántas unidades faltan, una sola cifra, con la lista de cuáles.',
  'ind-hospital': 'La ficha del hospital en el recuento usa el cartel de la cartera: cuántas unidades faltan, una sola cifra.'
};

/* (c) Piezas cuya sección lleva más de un título con sentido marcado (assets/sentido.js): se dice a cuál
   se refiere el cartel. Sin esto el rojo no se puede comprobar. */
export const SENTIDO_DE_PIEZA = {
  infantil: ['mas', 'El cartel enseña las plazas por cada 100 niños (cuanto más, mejor); la sección lleva también las solicitudes sin plaza (cuanto menos).']
};

/* (b) Piezas cuyo cartel y vista previa llevan otra cifra grande que la que se ve en pantalla por una razón
   conocida. Clave: clave de la pieza. Vacío mientras no haga falta. */
export const CIFRA_DISTINTA_EN_PANTALLA = {};

/* (b) Los botones cuyo id no es la clave de su vista previa. */
export const CLAVE_DE_PIEZA = { paga: 'impuestos' };

/* (f) Frases que parecen una antítesis y no lo son. Cada una: un trozo exacto del texto y por qué vale. */
export const ANTITESIS_VALIDAS = [];

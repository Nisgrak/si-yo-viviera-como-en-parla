/* Las comparaciones Parla | otra ciudad que en el móvil (390 px) ya van una al lado de la otra, en dos
   columnas. `npm run revisar` falla si una de ellas se apila. Clave: «id de la caja:clase de la pareja».
   Para rehacer la lista tras un cambio de diseño a propósito: `npm run revisar -- --bloque j --ciudad getafe
   --parejas` imprime las que van en dos columnas ahora.
   Toda comparación que va en dos columnas en escritorio tiene que ir también en dos columnas en el móvil:
   o está en esta lista, o en PAREJAS_APILADAS_A_PROPOSITO con su motivo. Si no, `npm run revisar` falla. */
export const PAREJAS_EN_DOS_COLUMNAS = [
  'alquilar-cifras:cifra',
  'alquilar-hogares:hog',
  'artes-cifras:tp-cifra',
  'cabecera-cifras:tp-cifra',
  'casa-cifras:tp-cifra',
  'casas-hogares:hog',
  'cob-cifras:tp-cifra',
  'coches-cifras:tp-cifra',
  'colas-parla:colas',
  'comprar-cifras:cifra',
  'desahucios-cifras:cifra',
  'dia-cifras:tp-cifra',
  'duenos-cien:cien',
  'especial-cifras:tp-cifra',
  'espera-cifras:tp-cifra',
  'espera-evol:evol__panel',
  'estudios-cifras:tp-cifra',
  'falla-cifras:tp-cifra',
  'falla-juntos:tp__col',
  'falla-tabla:falla-t__con',
  'falla-tabla:falla-t__flecha',
  'falla-tabla:falla-t__sin',
  'fp-cifras:tp-cifra',
  'hospital-cifras:tp-cifra',
  'infantil-cifras:tp-cifra',
  'mental-cifras:tp-cifra',
  'ocupacional-cifras:tp-cifra',
  'pensiones-cifras:tp-cifra',
  'personas-cifras:tp-cifra',
  'plazas-cifras:tp-cifra',
  'ppme-cifras:tp-cifra',
  'publica-cifras:cifra',
  'residencia-cifras:tp-cifra',
  'sentidos-filas:sent',
  'tea-cifras:tp-cifra',
  'temprana-cifras:tp-cifra',
  'trabajo-cifras:cifra',
  'vida-cifras:tp-cifra',
  'vivienda-hogares:hogm'
];

/* Las que se apilan en el móvil POR DECISIÓN DEL DUEÑO, con el motivo. Clave: la misma que arriba. */
export const PAREJAS_APILADAS_A_PROPOSITO = {
  'mapas:mapa': 'Los mapas de por dónde sale la gente: a media anchura los mapas no se leen (se probaron dos maquetas en dos columnas y se descartaron); en el móvil van uno debajo de otro.'
};

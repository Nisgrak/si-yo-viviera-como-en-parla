/* Copia de los iconos de assets/app.js, solo para el prototipo. */
window.ICONOS = (function () {
  const TRAZOS = {
    metro:
      '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14"/>' +
      '<path d="M9.5 21 11 17M14.5 21 13 17"/>' +
      '<circle cx="9.2" cy="13.5" r=".9"/><circle cx="14.8" cy="13.5" r=".9"/>',
    cercanias:
      '<rect x="4" y="4" width="16" height="10" rx="2.5"/><path d="M4 9h16"/>' +
      '<circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/>' +
      '<path d="M2.5 21h19"/>',
    farmacia:
      '<path d="M9.6 3h4.8v6.6H21v4.8h-6.6V21H9.6v-6.6H3V9.6h6.6z"/>',
    biblioteca:
      '<path d="M12 6.8C10.4 5.2 7.9 4.6 4 4.6v12.8c3.9 0 6.4.6 8 2.2 1.6-1.6 4.1-2.2 8-2.2V4.6c-3.9 0-6.4.6-8 2.2z"/>' +
      '<path d="M12 6.8v12.8"/>',
    salud:
      '<path d="M3.6 10.4 12 3.4l8.4 7v9.1a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z"/>' +
      '<path d="M12 11v5.4M9.3 13.7h5.4"/>',
    hospital:
      '<path d="M4.5 21V6.4a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1V21"/><path d="M2.5 21h19"/>' +
      '<path d="M12 8.6v6M9 11.6h6"/>',
    /* Un cochecito: capota, cuna, asa y dos ruedas. */
    bebe:
      '<path d="M4 10.4h13.2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/>' +
      '<path d="M4 10.4a6.4 6.4 0 0 1 6.4-6.4v6.4"/><path d="M17.2 10.4 18.8 5.6h2"/>' +
      '<circle cx="8" cy="19" r="1.8"/><circle cx="14.6" cy="19" r="1.8"/>',
    /* Una mochila: cuerpo, asa y bolsillo. */
    colegio:
      '<rect x="5" y="6.4" width="14" height="14.4" rx="3.6"/>' +
      '<path d="M9.2 6.4V5a1.8 1.8 0 0 1 1.8-1.8h2A1.8 1.8 0 0 1 14.8 5v1.4"/>' +
      '<path d="M8.6 14.2h6.8v3.6H8.6z"/><path d="M5 11.4h14"/>',
    instituto:
      '<path d="M5 3.5v17h16z"/><path d="M8.5 17h3M8.5 13.6h1.6"/>',
    universidad:
      '<path d="M2.5 9 12 4.6 21.5 9 12 13.4z"/>' +
      '<path d="M6.4 11.2v4.9c0 1.5 2.5 2.7 5.6 2.7s5.6-1.2 5.6-2.7v-4.9"/>',
    musica:
      '<path d="M9.2 17.6V5.2l9.6-2v11.4"/><circle cx="6.7" cy="17.8" r="2.6"/>' +
      '<circle cx="16.3" cy="16.1" r="2.6"/>',
    cama:
      '<path d="M3 19.5V9"/><path d="M3 13h11.5a6.5 6.5 0 0 1 6.5 6.5"/>' +
      '<path d="M21 19.5v-1"/><circle cx="7.4" cy="9.6" r="2.3"/>',
    paleta:
      '<path d="M12 3.3c-5 0-8.9 3.6-8.9 8.2 0 4.6 4 8.2 8.9 8.2 1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2' +
      '-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 2-1.8h1.5c3 0 5.5-2.4 5.5-5.3 0-3.9-4.2-7.1-10-7.1z"/>' +
      '<circle cx="7.5" cy="10.6" r="1.1"/><circle cx="11" cy="7.5" r="1.1"/>' +
      '<circle cx="15.5" cy="8.4" r="1.1"/>',
    /* Una llave inglesa: mango y cabeza abierta. */
    llave:
      '<path d="M14.6 3.4a4.6 4.6 0 0 0-4.3 6.3l-6.4 6.4a2 2 0 0 0 2.9 2.9l6.4-6.4a4.6 4.6 0 0 0 ' +
      '6.3-4.3l-2.8 2.8-2.9-.9-.9-2.9z"/>',
    descarga:
      '<path d="M12 3.4v11.2"/><path d="M7.6 10.4 12 14.8l4.4-4.4"/>' +
      '<path d="M4.2 16.6v2.6a1.4 1.4 0 0 0 1.4 1.4h12.8a1.4 1.4 0 0 0 1.4-1.4v-2.6"/>',
    /* La unidad tachada, con las proporciones de la tira de la portada: borde
       del 10 % del lado y raya gruesa de puntas planas. La raya se recorta
       contra el cuadrado —como hace la web con su caja— para que las puntas
       queden cortadas en las esquinas en vez de asomar por fuera. */
    unidad:
      '<defs><clipPath id="clip-unidad">' +
      '<rect x="1.45" y="1.45" width="21.1" height="21.1" rx="3.85"/></clipPath></defs>' +
      '<rect x="2.4" y="2.4" width="19.2" height="19.2" rx="2.9" stroke-width="1.9"/>' +
      '<path d="M1.2 22.8 22.8 1.2" stroke-width="4.88" stroke-linecap="butt" ' +
      'clip-path="url(#clip-unidad)"/>',
    hacienda:
      '<path d="M6 3.2h7.4L19 8.8V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1z"/>' +
      '<path d="M13.2 3.4v5.5h5.5"/>' +
      '<path d="M14.6 13.2a2.9 2.9 0 1 0 0 4.4"/><path d="M8.4 14.3h4.2M8.4 16.2h4.2"/>',
    ventanilla:
      '<path d="M2.4 9.8 12 4.1l9.6 5.7"/>' +
      '<path d="M5.4 9.8v8M9.8 9.8v8M14.2 9.8v8M18.6 9.8v8"/>' +
      '<path d="M3.2 17.8h17.6"/><path d="M1.8 21h20.4"/>',
    residencia:
      '<path d="M3.6 10.4 12 3.4l8.4 7v9.1a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z"/>' +
      '<path d="M12 18.3c-.6-.5-3.1-2.1-3.1-4a1.85 1.85 0 0 1 3.1-1.35 1.85 1.85 0 0 1 3.1 1.35' +
      'c0 1.9-2.5 3.5-3.1 4z"/>',
    /* Una moneda con el euro. */
    euro:
      '<circle cx="12" cy="12" r="8.6"/>' +
      '<path d="M15.2 8.9a4.2 4.2 0 1 0 0 6.2"/><path d="M7.6 11h5.6M7.6 13.2h5.6"/>',
    /* Un pino: copa, tronco y suelo. */
    arbol:
      '<path d="M12 3.4 5.6 12.8h12.8z"/>' +
      '<path d="M12 12.8v7.6"/>' +
      '<path d="M6.4 20.4h11.2"/>'
  };

  const ICONO = {
    metro: 'metro', cercanias: 'cercanias',
    farmacias: 'farmacia', bibliotecas: 'biblioteca', 'centros-salud': 'salud',
    'escuelas-infantiles': 'bebe', colegios: 'colegio', institutos: 'instituto',
    universidad: 'universidad', conservatorio: 'musica',
    'plazas-residencia': 'residencia', camas: 'cama', artes: 'paleta', fp: 'llave',
    hacienda: 'hacienda', 'seguridad-social': 'ventanilla',
    'zonas-verdes': 'arbol', hospital: 'hospital'
  };
  return { TRAZOS: TRAZOS, ICONO: ICONO };
})();

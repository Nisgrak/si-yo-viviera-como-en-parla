/* El guion del vídeo en JSON, para voz.py: las frases, con las cifras de los
   datos de la web (cifras.js) ya en letra.
       node guion.cjs            imprime el JSON */
const { join } = require('path');
const R = join(__dirname, '..', '..');
globalThis.window = globalThis;
for (const f of ['datos', 'sanidad', 'transporte', 'infraestructura']) require(join(R, 'datos', f + '.js'));
globalThis.CALCULO = require(join(R, 'assets/calculo.js'));
globalThis.HOSPITALES = require(join(R, 'assets/hospitales.js'));
const CIFRAS = require('./cifras.js');
const F = CIFRAS.calcular(globalThis);
process.stdout.write(JSON.stringify({ F, COLA: CIFRAS.COLA, PASO: CIFRAS.PASO, guion: CIFRAS.guion(F) }, null, 1));

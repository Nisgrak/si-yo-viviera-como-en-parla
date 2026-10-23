/* El vídeo, en vertical para el móvil: Parla frente a la ciudad de cifras.js.
   Pinta video.html fotograma a fotograma con Chromium, le pone el audio de
   audio.py y la portada como carátula.
       npm install && npm run video:voz
   Sale en salida/parla-vs-<ciudad>.mp4. Las cifras no se escriben a mano: video.html
   carga los datos de la web y la misma cuenta (assets/calculo.js), así que si
   cambian los datos basta con volver a renderizarlo. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
process.chdir(__dirname);
require('fs').mkdirSync('salida', { recursive: true });
(async () => {
  /* la duración la marca la voz: python3 voz.py antes */
  const { OTRA } = require('./cifras.js'), { DUR } = require('./salida/tiempos.json');
  const FPS = 30, N = Math.round(FPS * DUR), SALIDA = `salida/parla-vs-${OTRA}.mp4`;
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', 'salida/audio.wav', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'salida/cuerpo.mp4'],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/video.html');
  await p.waitForFunction(() => window.listo);
  for (let f = 0; f < N; f++) {
    await p.evaluate((t) => render(t), f / FPS);
    const buf = await p.screenshot({ type: 'png' });
    if (f === 0) require('fs').writeFileSync('salida/portada.png', buf);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  /* la portada, también como carátula del MP4: la usan Finder y algunos reproductores */
  const cab = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-i', 'salida/cuerpo.mp4', '-i', 'salida/portada.png',
    '-map', '0', '-map', '1', '-c', 'copy', '-c:v:1', 'png', '-disposition:v:1', 'attached_pic',
    '-movflags', '+faststart', SALIDA], { stdio: 'inherit' });
  await new Promise((r) => cab.on('close', r));
  console.log('hecho: ' + SALIDA);
})();

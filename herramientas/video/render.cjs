/* El vídeo de 84,5 segundos, Getafe frente a Parla. Pinta video.html fotograma a
   fotograma con Chromium, le pone el audio de audio.py y la portada como carátula.
       npm install && npm run video
   Sale en salida/parla-vs-getafe.mp4. Las cifras de video.html están escritas a
   mano y salen de datos/datos.js y assets/calculo.js: si cambian los datos, hay
   que tocarlas allí. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
process.chdir(__dirname);
require('fs').mkdirSync('salida', { recursive: true });
(async () => {
  const FPS = 30, DUR = 84.5, N = FPS * DUR;
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', 'salida/audio.wav', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'salida/cuerpo.mp4'],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
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
    '-movflags', '+faststart', 'salida/parla-vs-getafe.mp4'], { stdio: 'inherit' });
  await new Promise((r) => cab.on('close', r));
  console.log('hecho: salida/parla-vs-getafe.mp4');
})();

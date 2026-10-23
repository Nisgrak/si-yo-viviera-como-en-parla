/* El vídeo, en vertical para el móvil: Parla frente a la ciudad de cifras.js.
   Pinta video.html fotograma a fotograma con Chromium, le pone el audio de
   audio.py y la portada como carátula.
       npm install && npm run video:voz
   Sale en salida/parla-vs-<ciudad>.mp4. Las cifras no se escriben a mano: video.html
   carga los datos de la web y la misma cuenta (assets/calculo.js), así que si
   cambian los datos basta con volver a renderizarlo.
   Va en paralelo: cada parte (una por núcleo, o las que diga PARTES) pinta un
   tramo seguido en su propio navegador, y al final se juntan. Mientras, dice
   por dónde va. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
process.chdir(__dirname);
fs.mkdirSync('salida', { recursive: true });

const correr = (args) => new Promise((ok, mal) => {
  const p = spawn('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  p.on('close', (c) => (c ? mal(new Error('ffmpeg ha fallado: ' + c)) : ok()));
  return p;
});
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

(async () => {
  /* la duración la marca la voz: python3 voz.py antes */
  const { OTRA } = require('./cifras.js'), { DUR } = require('./salida/tiempos.json');
  const FPS = 30, N = Math.round(FPS * DUR), SALIDA = `salida/parla-vs-${OTRA}.mp4`;
  const PARTES = +process.env.PARTES || Math.min(require('os').cpus().length, 6);
  const tramo = Math.ceil(N / PARTES);
  console.log(`${N} fotogramas (${DUR} s a ${FPS} fps) en ${PARTES} partes`);

  const hechos = new Array(PARTES).fill(0), t0 = Date.now();
  let avisado = -1;
  const avisa = () => {
    const h = hechos.reduce((a, b) => a + b, 0), pct = Math.floor(h / N * 100);
    if (pct === avisado) return;
    avisado = pct;
    const s = (Date.now() - t0) / 1000, fps = h / s;
    console.log(`${String(h).padStart(5)}/${N} · ${String(pct).padStart(3)} % · ${fps.toFixed(1)} fotogramas/s · ` +
      `llevo ${mmss(s)} · quedan ${fps ? mmss((N - h) / fps) : '?'}`);
  };

  const b = await chromium.launch();
  await Promise.all(Array.from({ length: PARTES }, async (_, k) => {
    const desde = k * tramo, hasta = Math.min(N, desde + tramo);
    const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', `salida/parte-${k}.mp4`],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const cerrado = new Promise((r) => ff.on('close', r));
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.goto('file://' + __dirname + '/video.html');
    await p.waitForFunction(() => window.listo);
    for (let f = desde; f < hasta; f++) {
      await p.evaluate((t) => render(t), f / FPS);
      const buf = await p.screenshot({ type: 'png' });
      if (f === 0) fs.writeFileSync('salida/portada.png', buf);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      hechos[k]++; avisa();
    }
    ff.stdin.end();
    await cerrado;
    await p.close();
  }));
  await b.close();

  console.log('juntando las partes y poniendo el audio…');
  fs.writeFileSync('salida/partes.txt', Array.from({ length: PARTES }, (_, k) => `file 'parte-${k}.mp4'`).join('\n') + '\n');
  await correr(['-f', 'concat', '-safe', '0', '-i', 'salida/partes.txt', '-i', 'salida/audio.wav', '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'salida/cuerpo.mp4']);
  /* la portada, también como carátula del MP4: la usan Finder y algunos reproductores */
  await correr(['-i', 'salida/cuerpo.mp4', '-i', 'salida/portada.png', '-map', '0', '-map', '1', '-c', 'copy', '-c:v:1', 'png',
    '-disposition:v:1', 'attached_pic', '-movflags', '+faststart', SALIDA]);
  for (let k = 0; k < PARTES; k++) fs.rmSync(`salida/parte-${k}.mp4`, { force: true });
  console.log(`hecho: ${SALIDA} · ${mmss((Date.now() - t0) / 1000)}`);
})();

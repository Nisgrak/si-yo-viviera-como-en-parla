/* Fotogramas sueltos para revisar sin renderizar todo: node fotogramas.cjs 0 12.5 40 */
process.chdir(__dirname);
require('fs').mkdirSync('salida', { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/video.html');
  await p.waitForFunction(() => window.listo);
  const ts = process.argv.slice(2).map(Number);
  for (const [k, t] of ts.entries()) {
    await p.evaluate((t) => render(t), t);
    await p.screenshot({ path: `salida/fotograma-${String(k).padStart(2, '0')}.png` });
  }
  await b.close();
})();

# La locución del vídeo. Las frases y los tiempos salen de cifras.js (por
# guion.cjs), con las cifras de los datos de la web ya en letra; cada frase
# entra en su escena a los segundos que dice el guion. La deja en
# salida/voz.wav; audio.py la mezcla con los efectos.
#     python3 voz.py [voz]      por defecto Alba
# Las voces sin guion bajo son de Phonon (gradium/phonon-40m-es, CC BY-NC), que
# corre en local con el comando ptts (o el que diga PTTS) y HF_TOKEN o `hf auth login`.
#     mujeres de España: Noa, Lucía-Sol, Candela, Celia, Alba, Alicia, Nerea
# Las de Kokoro (ef_dora, em_alex, em_santa) van por la API de NaN, con la
# clave NAN_KEY en el .env de la raíz.
import os, sys, json, shutil, hashlib, subprocess
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import numpy as np, wave

VOZ = sys.argv[1] if len(sys.argv) > 1 else 'Alba'
PTTS = os.environ.get('PTTS') or shutil.which('ptts') or os.path.expanduser('~/phonon-build/xn-ptts/target/release/ptts')
# Phonon no tiene speed: duration_delta negativo habla más deprisa. Lee más
# despacio que Kokoro, así que parte de BASE para que las frases quepan
BASE = -0.25
SR = 48000

G = json.loads(subprocess.run(['node', 'guion.cjs'], capture_output=True, text=True, check=True).stdout)
S, D, GUION = G['S'], G['DUR'], G['guion']

def clave():
  for l in open('../../.env'):
    if l.startswith('NAN_KEY='): return l.split('=', 1)[1].strip()
  sys.exit('falta NAN_KEY en el .env')

def sintetiza(texto, vel=1.0):
  """Una frase, a 48 kHz mono. Se guarda por texto, voz y velocidad: solo se pide lo que cambia."""
  dd = f'{BASE - (vel - 1) * 1.15:.3f}'
  h = hashlib.sha1(f'{VOZ}|{vel}|{texto}'.encode() if '_' in VOZ else f'{VOZ}|{dd}|{texto}'.encode()).hexdigest()[:12]
  bruto, fino = f'salida/voz/{h}.wav', f'salida/voz/{h}-48k.wav'
  if not os.path.exists(fino):
    os.makedirs('salida/voz', exist_ok=True)
    if '_' not in VOZ:
      subprocess.run([PTTS, '--lang', 'es', '-m', 'hf://gradium/phonon-40m-es', '--voice', VOZ,
        '--condition', f'duration_delta={dd}', texto, '-o', bruto], check=True, capture_output=True)
    else:
      cuerpo = json.dumps(dict(model='kokoro', voice=VOZ, input=texto, speed=vel, response_format='wav'))
      # la clave entra por stdin (-K -) para que no salga en ningún mensaje de error
      subprocess.run(['curl', '-sSf', '-m', '120', '--retry', '4', '--retry-all-errors', '-K', '-',
        'https://api.nan.builders/v1/audio/speech', '-o', bruto, '-H', 'Content-Type: application/json', '-d', cuerpo],
        input=f'header = "Authorization: Bearer {clave()}"\n', text=True, check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', bruto, '-ac', '1', '-ar', str(SR), fino], check=True)
  with wave.open(fino) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
  # fuera el silencio de los bordes, para que la frase entre cuando dice el guion
  i = np.flatnonzero(np.abs(x) > 0.01)
  return x[max(0, i[0] - int(SR * .03)):i[-1] + int(SR * .12)] if len(i) else x

pista = np.zeros(int(SR * D)); fin_ant = 0; ok = True
for esc, dt, texto in GUION:
  x = sintetiza(texto); t0 = S[esc] + dt; t1 = t0 + len(x) / SR
  fin_esc = min([v for v in S.values() if v > S[esc]] + [D])
  aviso = ' ← pisa la anterior' if t0 < fin_ant + 0.15 else ''
  if t1 > D - 0.3: aviso += ' ← se sale del vídeo'
  ok &= not aviso
  sobra = f'+{t1 - fin_esc:.1f}' if t1 > fin_esc else ''
  print(f'{t0:5.1f}–{t1:5.1f}  {esc:9} {t1 - t0:4.1f}s {sobra:>5}  {texto[:60]}{aviso}')
  i = int(t0 * SR); pista[i:i + len(x)] += x[:len(pista) - i]; fin_ant = t1

with wave.open('salida/voz.wav', 'wb') as w:
  w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
  w.writeframes((np.clip(pista, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok' if ok else 'hay frases que se pisan', '· salida/voz.wav ·', VOZ)

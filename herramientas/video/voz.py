# La locución del vídeo, que marca sus tiempos. Las frases salen de cifras.js
# (por guion.cjs), con las cifras de los datos de la web ya en letra. Cada una
# va detrás de la anterior, con la pausa que dice el guion; el inicio de cada
# frase y de cada escena queda en salida/tiempos.js, que leen video.html y
# audio.py. La voz, en salida/voz.wav.
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
# Phonon no tiene speed: duration_delta negativo habla más deprisa. Se cuenta
# como una historia, así que va casi a su paso
BASE = -0.05
SR = 48000

G = json.loads(subprocess.run(['node', 'guion.cjs'], capture_output=True, text=True, check=True).stdout)
GUION, COLA = G['guion'], G['COLA']

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

# cada frase detrás de la anterior, con su pausa
frases, t = [], 0.0
for fid, esc, pausa, texto in GUION:
  x = sintetiza(texto); t += pausa
  frases.append((fid, esc, t, x, texto)); t += len(x) / SR
D = round(t + COLA, 1)

F, E, S = {}, {}, {}
pista = np.zeros(int(SR * D))
for fid, esc, t0, x, texto in frases:
  F[fid] = round(t0, 3); E[fid] = round(t0 + len(x) / SR, 3)
  # la escena entra un poco antes que su primera frase
  if esc not in S: S[esc] = 0.0 if not S else round(max(0.0, t0 - 0.9), 3)
  print(f'{t0:5.1f}–{t0 + len(x) / SR:5.1f}  {esc:9} {fid:13} {texto[:60]}')
  i = int(t0 * SR); pista[i:i + len(x)] += x[:len(pista) - i]

with wave.open('salida/voz.wav', 'wb') as w:
  w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
  w.writeframes((np.clip(pista, -1, 1) * 32767).astype(np.int16).tobytes())
T = dict(DUR=D, S=S, F=F, E=E, voz=VOZ)
json.dump(T, open('salida/tiempos.json', 'w'), indent=1)
open('salida/tiempos.js', 'w').write('/* GENERADO por voz.py: cuándo empieza cada escena y cada frase. */\nwindow.TIEMPOS = ' + json.dumps(T) + ';\n')
print(f'ok · {D} s · salida/voz.wav y salida/tiempos.js ·', VOZ)

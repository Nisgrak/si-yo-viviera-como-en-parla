# La locución del vídeo: cada frase con la escena en la que entra (los mismos
# data-from de video.html) y los segundos desde ese inicio. La sintetiza Kokoro
# en la API de NaN (clave NAN_KEY en el .env de la raíz) y la deja en
# salida/voz.wav, con las frases ya colocadas; audio.py la mezcla con los efectos.
#     python3 voz.py [voz]      voces: ef_dora (por defecto), em_alex, em_santa
# Una voz sin guion bajo es de Phonon (gradium/phonon-40m-es, CC BY-NC), que corre
# en local con el comando ptts (o el que diga PTTS) y HF_TOKEN o `hf auth login`:
#     python3 voz.py Alicia     mujeres de España: Noa, Lucía-Sol, Candela, Celia, Alba, Alicia, Nerea
# Las cifras van en letra para que no dependan de cómo lea los números el modelo,
# y son las de la pantalla, sin redondear.
import os, sys, json, hashlib, subprocess
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import numpy as np, wave

VOZ = sys.argv[1] if len(sys.argv) > 1 else 'ef_dora'
# Phonon no tiene speed: duration_delta -0,2 habla un 18 % más deprisa. Lee más
# despacio que Kokoro, así que parte de BASE para que las frases quepan en su escena
BASE = -0.15
SR = 48000; D = 84.5
S = dict(s1=0, sq=4, sa=9.5, s2=15.5, s3=21, s4=28.5, s5=34, s6=40.5, c1=47.5, c2=52,
         m0=56.5, m1=60, m2=67.5, s8=75, s9=79.5)

# (escena, segundos desde su inicio, texto, velocidad)
GUION = [
  ('s1', 0.3, 'Vivo en Getafe. ¿Y si viviera como en Parla?', 1.0),
  ('sq', 0.5, '¿Qué perdería mi ciudad? He hecho la cuenta, con datos oficiales.', 1.0),
  ('sa', 0.4, 'Te lo cuento en cuatro partes: la cuenta, lo que perdería, el hospital y el dinero.', 1.05),
  ('s2', 0.4, 'Getafe tiene más vecinos que Parla. Por eso no comparo a lo bruto: todo va por habitante.', 1.05),
  ('s3', 0.25, 'Un ejemplo: bibliotecas. Parla tiene dos. A su ritmo, a Getafe le tocarían dos coma ocho. Tenemos seis: perderíamos tres coma dos.', 1.16),
  ('s4', 0.4, 'Y si hago eso con todo, me faltarían…', 1.0),
  ('s4', 3.1, 'cincuenta equipamientos y servicios públicos.', 1.05),
  ('s5', 0.5, 'Las ocho estaciones de Metro, fuera. La universidad, fuera. El conservatorio, la Seguridad Social, Hacienda… fuera.', 1.15),
  ('s6', 0.4, 'Lo que más se pierde es sanidad: farmacias y centros de salud. ¿Y algo que ganaría? Nada. Ni un solo servicio.', 1.05),
  ('c1', 0.4, 'En el hospital, perdería más de la mitad de las camas.', 1.0),
  ('c2', 0.35, 'Y diecisiete unidades que el de Parla no tiene, como neurocirugía o quemados.', 1.1),
  ('m0', 0.5, 'Y detrás de todo esto, hay dinero.', 1.0),
  ('m1', -0.3, 'Getafe invierte ciento cincuenta y seis euros por vecino al año. Parla, veintitrés. Son veinticinco coma siete millones menos.', 1.12),
  ('m2', 0.35, 'En gasto total, novecientos setenta y ocho euros frente a setecientos ochenta: treinta y ocho coma tres millones menos.', 1.12),
  ('s8', 0.4, 'Compárala con quien quieras: Parla es la última en renta, y en ocho de los doce equipamientos.', 1.15),
  ('s9', 1.0, 'Para Getafe, esto es un supuesto. Para Parla, es lo de cada día.', 1.05),
]

def clave():
  for l in open('../../.env'):
    if l.startswith('NAN_KEY='): return l.split('=', 1)[1].strip()
  sys.exit('falta NAN_KEY en el .env')

def sintetiza(texto, vel):
  """Una frase, a 48 kHz mono. Se guarda por texto, voz y velocidad: solo se pide lo que cambia."""
  dd = f'{BASE - (vel - 1) * 1.15:.3f}'
  h = hashlib.sha1(f'{VOZ}|{vel}|{texto}'.encode() if '_' in VOZ else f'{VOZ}|{dd}|{texto}'.encode()).hexdigest()[:12]
  bruto, fino = f'salida/voz/{h}.wav', f'salida/voz/{h}-48k.wav'
  if not os.path.exists(fino):
    os.makedirs('salida/voz', exist_ok=True)
    if '_' not in VOZ:
      subprocess.run([os.environ.get('PTTS', 'ptts'), '--lang', 'es', '-m', 'hf://gradium/phonon-40m-es', '--voice', VOZ,
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
for esc, dt, texto, vel in GUION:
  x = sintetiza(texto, vel); t0 = S[esc] + dt; t1 = t0 + len(x) / SR
  fin_esc = min([v for v in S.values() if v > S[esc]] + [D])
  aviso = ' ← pisa la anterior' if t0 < fin_ant + 0.15 else ''
  if t1 > D - 0.3: aviso += ' ← se sale del vídeo'
  ok &= not aviso
  sobra = f'+{t1 - fin_esc:.1f}' if t1 > fin_esc else ''
  print(f'{t0:5.1f}–{t1:5.1f}  {esc:3} {t1 - t0:4.1f}s {sobra:>5}  {texto[:60]}{aviso}')
  i = int(t0 * SR); pista[i:i + len(x)] += x[:len(pista) - i]; fin_ant = t1

with wave.open('salida/voz.wav', 'wb') as w:
  w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
  w.writeframes((np.clip(pista, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok' if ok else 'hay frases que se pisan', '· salida/voz.wav ·', VOZ)

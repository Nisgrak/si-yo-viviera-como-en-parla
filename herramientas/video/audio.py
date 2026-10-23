# El audio del vídeo: una música suave de fondo (acordes, bajo y punteo,
# sintetizados con numpy), la voz de salida/voz.wav encima y los sonidos de
# cada momento. Los tiempos los marca la voz: salen de salida/tiempos.json, que
# escribe voz.py, así que va después de él.
#     python3 voz.py && python3 audio.py
# La música baja cuando habla la voz y vuelve a subir en los silencios.
import os, json, subprocess
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import numpy as np, wave

T = json.load(open('salida/tiempos.json'))
G = json.loads(subprocess.run(['node', 'guion.cjs'], capture_output=True, text=True, check=True).stdout)
S, F, E, D = T['S'], T['F'], T['E'], T['DUR']
TOTAL, PASO = G['F']['total'], G['PASO']
SR = 48000; N = int(SR * D)
rng = np.random.default_rng(3)

def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, k):
    w = np.hanning(k); w /= w.sum(); return np.convolve(x, w, 'same')

class Pista:
    def __init__(self): self.L = np.zeros(N); self.R = np.zeros(N)
    def add(self, sig, t, g=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N or i < 0: return
        j = min(N, i + len(sig)); s = sig[:j - i] * g
        self.L[i:j] += s * np.sqrt((1 - pan) / 2); self.R[i:j] += s * np.sqrt((1 + pan) / 2)
    def st(self): return np.stack([self.L, self.R], 1)

# ── La música: tranquila, en la menor, a 84 por minuto ──────────────────
mus = Pista()
BPM = 84; B = 60 / BPM; BAR = 4 * B
CH = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]   # Am – F – C – G
ROOT = [45, 41, 48, 43]
def acorde(t): return int(t // (2 * BAR)) % 4

def pad(notas, dur):
    n = int(SR * (dur + 1.5)); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notas + [notas[0] + 12]:
        f = mtof(m)
        for det in (-0.12, 0.12):
            s += np.sin(2 * np.pi * f * (1 + det / 100) * t + rng.random() * 6) + 0.25 * np.sin(2 * np.pi * 2 * f * (1 + det / 100) * t)
    e = np.minimum(1, t / 1.2) * np.clip((dur + 1.5 - t) / 1.5, 0, 1)
    return s * e * (1 + 0.15 * np.sin(2 * np.pi * 0.2 * t))
def bajo(m, dur):
    n = int(SR * dur); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.02) * np.exp(-t / 1.2)
def pluck(m, g=1.0):
    n = int(SR * 0.8); t = np.arange(n) / SR; f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.08)
    return s * np.minimum(1, t / 0.004) * np.exp(-t / 0.3) * g

FIN = S['cierre']
t = 0.0
while t < FIN:
    c = acorde(t)
    mus.add(pad(CH[c], 2 * BAR), t, 0.010, pan=-0.2); mus.add(pad(CH[c], 2 * BAR), t + 0.01, 0.010, pan=0.2)
    t += 2 * BAR
mus.add(pad([57, 60, 64, 69], D - FIN + 1), FIN, 0.014)
t = S['coche'] - S['coche'] % BAR
while t < FIN - 0.2:
    mus.add(bajo(ROOT[acorde(t)], BAR), t, 0.09); t += BAR
mus.add(bajo(45, D - FIN), FIN, 0.11)
# el punteo, desde la mañana; se calla en el recuento, que suenan los huecos
PAT = [0, 2, 1, 2, 0, 2, 1, 3]
t = S['coche'] - S['coche'] % B; k = 0
while t < FIN - 0.2:
    if not (F['si'] - 0.5 < t < E['veintiuno']):
        c = acorde(t); notas = CH[c] + [CH[c][0] + 12]
        mus.add(pluck(notas[PAT[k % 8]] + 12, 0.9 if k % 2 == 0 else 0.55), t, 0.022, pan=0.3 * np.sin(k * 0.7))
    t += B / 2; k += 1

# ── Los sonidos de cada momento ─────────────────────────────────────────
sfx = Pista()
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
def tock(m, dec=0.07):
    n = int(SR * 0.3); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 3 * f * t)) * np.minimum(1, t / 0.002) * np.exp(-t / dec)
def bell(m):
    n = int(SR * 2.0); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t / 0.4)) * np.minimum(1, t / 0.003) * np.exp(-t / 0.7)
def thump():
    n = int(SR * 0.8); t = np.arange(n) / SR; f = 48 + 30 * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.006) * np.exp(-t / 0.3)
def air(dur=0.6):
    n = int(SR * dur); x = np.linspace(0, 1, n)
    return lp(rng.standard_normal(n), 60) * np.sin(np.pi * x) ** 2 * 4

sfx.add(bell(69), 0.05, 0.03)
# el 70 % de la A-42, el cero del Metro, el 21 y el cierre
T0 = E['si'] + 0.5
for tt, m, g in [(E['a42'] - 1.2, 76, 1.0), (F['metro'] + 0.9, 72, 0.8), (T0 + TOTAL * PASO, 81, 1.2), (S['cierre'] + 0.4, 81, 0.8)]:
    sfx.add(thump(), tt, 0.2 * g); sfx.add(bell(m), tt, 0.045 * g)
for i in range(TOTAL): sfx.add(tock(PENTA[i % 10] + (12 if i >= 10 else 0), 0.04), T0 + i * PASO + 0.03, 0.035, pan=(i % 13 - 6) / 8)
for k in list(S)[1:]: sfx.add(air(0.55), S[k] - 0.3, 0.02)

# ── La voz y la mezcla ──────────────────────────────────────────────────
with wave.open('salida/voz.wav') as w: v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
voz = np.zeros(N); voz[:min(N, len(v))] = v[:N] / np.abs(v).max()
# la música se aparta mientras habla: un 45 % más baja, con subidas y bajadas suaves
habla = np.convolve((np.abs(voz) > 0.02).astype(float), np.ones(int(SR * 0.25)), 'same') > 0
env = lp(habla.astype(float), int(SR * 0.5))
M = mus.st() * (1 - 0.45 * env)[:, None]
M *= 0.16 / np.abs(M).max()
X = sfx.st(); X *= 0.22 / np.abs(X).max()
tt = np.arange(N) / SR
fundido = np.clip(tt / 0.4, 0, 1) * np.clip((D - tt) / 1.5, 0, 1)
mezcla = (M + X) * fundido[:, None] + voz[:, None] * 0.75
mezcla = np.tanh(mezcla * 1.2) / 1.2
mezcla *= 0.89 / np.abs(mezcla).max()
with wave.open('salida/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mezcla * 32767).astype(np.int16).tobytes())
print('ok · salida/audio.wav ·', D, 's')

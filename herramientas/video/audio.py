# El audio del vídeo: colchón de acordes, bajo, punteo y los sonidos de cada
# hueco, sintetizados con numpy. Los tiempos salen de cifras.js, como los de
# video.html. Con `python3 audio.py voz` no hay música: los
# tachados van debajo de la locución de salida/voz.wav (la hace voz.py).
import os, sys; os.chdir(os.path.dirname(os.path.abspath(__file__))); os.makedirs('salida', exist_ok=True)
VOZ = 'voz' in sys.argv[1:]
import json, subprocess
import numpy as np, wave
# los tiempos de cada escena, los mismos de video.html (salen de cifras.js)
G=json.loads(subprocess.run(['node','guion.cjs'],capture_output=True,text=True,check=True).stdout)
S=G['S']; F=G['F']
SR=48000; D=G['DUR']; N=int(SR*D)
L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(3)
def mtof(m): return 440*2**((m-69)/12)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR)
    if i>=N: return
    j=min(N,i+len(sig)); s=sig[:j-i]*g
    L[i:j]+=s*np.sqrt((1-pan)/2); R[i:j]+=s*np.sqrt((1+pan)/2)
def lp(x,k):
    w=np.hanning(k); w/=w.sum(); return np.convolve(x,w,'same')

BPM=100; B=60/BPM; BAR=4*B
CH=[[57,60,64],[53,57,60],[48,55,64],[55,59,62]]   # Am – F – C – G
ROOT=[45,41,48,43]
def chord_at(t): return int(t//(2*BAR))%4

def pad(notes,dur):
    n=int(SR*(dur+1.5)); t=np.arange(n)/SR; s=np.zeros(n)
    for m in notes+[notes[0]+12]:
        f=mtof(m)
        for det in (-0.12,0.12):
            s+=np.sin(2*np.pi*f*(1+det/100)*t+rng.random()*6)+0.25*np.sin(2*np.pi*2*f*(1+det/100)*t)
    e=np.minimum(1,t/1.2)*np.clip((dur+1.5-t)/1.5,0,1)
    return s*e*(1+0.15*np.sin(2*np.pi*0.2*t))
t=0.0
while t<S['cierre'] and not VOZ:
    c=chord_at(t); g=0.010 if t<S['cuenta'] else 0.013
    add(pad(CH[c],2*BAR),t,g,pan=-0.2); add(pad(CH[c],2*BAR),t+0.01,g,pan=0.2); t+=2*BAR
if not VOZ: add(pad([57,60,64,69],3.2),S['cierre'],0.016)

def bass(m,dur):
    n=int(SR*dur); t=np.arange(n)/SR; f=mtof(m)
    return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t))*np.minimum(1,t/0.02)*np.exp(-t/0.9)
t=4.0-4.0%BAR
while t<S['cierre']-0.2 and not VOZ:
    add(bass(ROOT[chord_at(t)],BAR),t,0.10); t+=BAR
if not VOZ: add(bass(45,3.5),S['cierre'],0.12)

def pluck(m,g=1.0):
    n=int(SR*0.6); t=np.arange(n)/SR; f=mtof(m)
    s=np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.08)
    return s*np.minimum(1,t/0.004)*np.exp(-t/0.22)*g
PAT=[0,2,1,2,0,2,1,3]
t=S['cuenta']-S['cuenta']%(B/2); k=0
while t<S['golpe']-0.2 and not VOZ:
    c=chord_at(t); notes=CH[c]+[CH[c][0]+12]
    vel=0.9 if k%2==0 else 0.6
    if t>=S['renta'] and k%2==1: vel=0          # en el dinero, más quieto
    if vel: add(pluck(notes[PAT[k%8]]+12,vel),t,0.028,pan=0.3*np.sin(k*0.7))
    t+=B/2; k+=1

PENTA=[69,72,74,76,79,81,84,86,88,91]
def tock(m,dec=0.07):
    n=int(SR*0.3); t=np.arange(n)/SR; f=mtof(m)
    return (np.sin(2*np.pi*f*t)+0.2*np.sin(2*np.pi*3*f*t))*np.minimum(1,t/0.002)*np.exp(-t/dec)
def bell(m):
    n=int(SR*2.0); t=np.arange(n)/SR; f=mtof(m)
    return (np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*2.01*f*t)*np.exp(-t/0.4))*np.minimum(1,t/0.003)*np.exp(-t/0.7)
def thump():
    n=int(SR*0.8); t=np.arange(n)/SR; f=48+30*np.exp(-t/0.05)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.minimum(1,t/0.006)*np.exp(-t/0.3)
def air(dur=0.6):
    n=int(SR*dur); x=np.linspace(0,1,n)
    return lp(rng.standard_normal(n),60)*np.sin(np.pi*x)**2*4
def sweep(dur=0.9):
    n=int(SR*dur); x=np.linspace(0,1,n)
    a=lp(rng.standard_normal(n),200); b=lp(rng.standard_normal(n),25)
    return (a*(1-x)+b*x)*np.sin(np.pi*x)**1.5*5

add(bell(69),0.05,0.035)
# los golpes: el «le faltan», el total, las unidades, los millones, el golpe y el cierre
T0=S['total']+1.0; PASO=0.11
for tt,m in [(S['cuenta']+7.9,76),(T0+F['total']*PASO,81),(S['unidades']+0.3,74),
             (S['inversion']+4.7,76),(S['golpe']+0.55,69),(S['cierre']+0.05,81)]:
    add(thump(),tt,0.22); add(bell(m),tt,0.05)
# los huecos de las bibliotecas, al ritmo de la tira de video.html
for k,i in enumerate(range(F['bib']['parla'],int(F['bib']['tendria'])+1)): add(tock(PENTA[k]+12),S['cuenta']+5.2+i*0.35,0.07)
for i in range(F['total']): add(tock(PENTA[i%10]+(12 if i>=10 else 0),0.035),T0+i*PASO+0.03,0.03,pan=(i%13-6)/8)
for i in range(len(F['cero'])): add(tock(PENTA[i+2],0.09),S['cero']+0.6+i*0.9,0.07)
for i in range(len(F['unidades'])): add(tock(PENTA[i%10]+12,0.03),S['unidades']+1.0+i*0.16,0.022)
for i in range(10): add(tock(PENTA[i],0.06),S['diez']+0.6+i*0.18,0.04)
wipes=[3.55]+[S[k]-0.45 for k in ('camas','estacion','renta','diez','golpe')]
for tt in wipes: add(sweep(0.9),tt,0.05)
for k in ['total','cero','unidades','medico','espera','atocha','inversion']: add(air(0.55),S[k]-0.45,0.025)

tt=np.arange(N)/SR
fade=np.clip(tt/0.4,0,1)*np.clip((D-tt)/2.0,0,1)
M=np.stack([L,R],1)*fade[:,None]
M=np.tanh(M*1.4)/1.4
if VOZ:
    # los efectos, a un tercio de la voz en pico; la voz no se funde al final
    with wave.open('salida/voz.wav') as w: v=np.frombuffer(w.readframes(w.getnframes()),np.int16)/32768
    v=v[:N]/np.abs(v).max(); M*=0.25/np.abs(M).max(); M[:len(v)]+=v[:,None]*0.75
M*=0.89/np.abs(M).max()
with wave.open('salida/audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((M*32767).astype(np.int16).tobytes())
print('ok')

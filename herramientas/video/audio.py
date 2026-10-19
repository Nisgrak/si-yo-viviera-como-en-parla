# El audio del vídeo: colchón de acordes, bajo, punteo y los sonidos de cada
# tachado, sintetizados con numpy. Los tiempos de S tienen que ser los mismos
# data-from de video.html. Con `python3 audio.py voz` no hay música: los
# tachados van debajo de la locución de salida/voz.wav (la hace voz.py).
import os, sys; os.chdir(os.path.dirname(os.path.abspath(__file__))); os.makedirs('salida', exist_ok=True)
VOZ = 'voz' in sys.argv[1:]
import numpy as np, wave
SR=48000; D=84.5; N=int(SR*D)
L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(3)
# inicio de cada escena, igual que en video.html
S=dict(sq=4,sa=9.5,s2=15.5,s3=21,s4=28.5,s5=34,s6=40.5,c1=47.5,c2=52,m0=56.5,m1=60,m2=67.5,s8=75,s9=79.5)
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
while t<S['s9'] and not VOZ:
    c=chord_at(t); g=0.010 if t<S['s2'] else 0.013
    add(pad(CH[c],2*BAR),t,g,pan=-0.2); add(pad(CH[c],2*BAR),t+0.01,g,pan=0.2); t+=2*BAR
if not VOZ: add(pad([57,60,64,69],3.2),S['s9'],0.016)

def bass(m,dur):
    n=int(SR*dur); t=np.arange(n)/SR; f=mtof(m)
    return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t))*np.minimum(1,t/0.02)*np.exp(-t/0.9)
t=4.0-4.0%BAR
while t<S['s9']-0.2 and not VOZ:
    add(bass(ROOT[chord_at(t)],BAR),t,0.10); t+=BAR
if not VOZ: add(bass(45,3.5),S['s9'],0.12)

def pluck(m,g=1.0):
    n=int(SR*0.6); t=np.arange(n)/SR; f=mtof(m)
    s=np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.08)
    return s*np.minimum(1,t/0.004)*np.exp(-t/0.22)*g
PAT=[0,2,1,2,0,2,1,3]
t=S['s2']-S['s2']%(B/2); k=0
while t<S['s8']-0.2 and not VOZ:
    c=chord_at(t); notes=CH[c]+[CH[c][0]+12]
    vel=0.9 if k%2==0 else 0.6
    if t>=S['m0'] and k%2==1: vel=0          # en el dinero, más quieto
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
for tt,m in [(S['s3']+4.2,76),(S['s4']+1.0+50*0.042,81),(S['c1']+0.6,72),(S['c2']+0.5,74),
             (S['m1']+3.35,76),(S['m2']+3.25,76),(S['s8']+0.7,69),(S['s9']+0.05,81)]:
    add(thump(),tt,0.22); add(bell(m),tt,0.05)
for i in range(3): add(tock(PENTA[3-i]+12),S['s3']+3.0+i*0.3,0.07)
add(tock(PENTA[0]+12),S['s3']+3.9,0.07)
for i in range(50): add(tock(PENTA[i%10]+(12 if i>=30 else 0),0.035),S['s4']+1.0+i*0.042+0.06,0.028,pan=(i%13-6)/8)
for i,d in enumerate([1.05,1.85,2.65,3.45,4.25]): add(tock(PENTA[i+2],0.09),S['s5']+d,0.07)
for i in range(5): add(tock(PENTA[i],0.08),S['s6']+0.6+i*0.4,0.05)
for i in range(17): add(tock(PENTA[i%10]+12,0.03),S['c2']+1.2+i*0.1,0.022)
for tt in [3.65,S['s4']-0.45,S['c1']-0.45,S['m0']-0.45,S['s8']-0.45]: add(sweep(0.9),tt,0.05)
for k in ['sa','s2','s3','s5','s6','c2','m1','m2']: add(air(0.55),S[k]-0.45,0.025)

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

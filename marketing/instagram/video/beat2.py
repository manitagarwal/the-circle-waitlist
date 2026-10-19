# Beat for the group chat reel: a pop on every message, kick and hats on the grid, a hit on day changes, a drop at the end. Usage: beat2.py events.json out.wav
import json, math, random, struct, sys, wave
random.seed(3)
d = json.load(open(sys.argv[1])); ev, total, u = d['events'], d['total'] + 0.4, d['u']
sr = 44100; n = int(total * sr); buf = [0.0] * n
def add(t, s, g):
    a = int(t * sr)
    for i, v in enumerate(s):
        if a + i < n: buf[a + i] += v * g
def kick():
    o = []; ph = 0.0
    for i in range(int(0.26 * sr)):
        t = i / sr; ph += 2 * math.pi * (45 + 110 * math.exp(-t * 28)) / sr; o.append(math.sin(ph) * math.exp(-t * 9))
    return o
def hat():
    o = []; p = 0.0
    for i in range(int(0.04 * sr)):
        x = random.random() * 2 - 1; o.append((x - p) * math.exp(-(i / sr) * 100)); p = x
    return o
def blip(f0, f1, dur=0.09):
    o = []; ph = 0.0
    for i in range(int(dur * sr)):
        t = i / sr; f = f0 + (f1 - f0) * t / dur; ph += 2 * math.pi * f / sr; o.append(math.sin(ph) * math.exp(-t * 28))
    return o
def bass(f, dur):
    return [math.sin(2 * math.pi * f * i / sr) * math.exp(-(i / sr) * 2.2) for i in range(int(dur * sr))]
K, H = kick(), hat()
t = 0.0; k = 0
while t < total - 0.1:
    if k % 2 == 0: add(t, K, 0.55)
    add(t, H, 0.2 if k % 2 else 0.11); t += u; k += 1
notes = [660, 740, 830, 880, 990]
for j, e in enumerate(ev):
    if e['k'] == 'pop': add(e['t'], blip(notes[j % 5], notes[j % 5] * 1.5), 0.55)
    elif e['k'] == 'popLow': add(e['t'], blip(520, 760), 0.5)
    elif e['k'] == 'hit': add(e['t'], kick(), 0.9); add(e['t'], bass(55, 0.9), 0.6)
    elif e['k'] == 'end': add(e['t'], kick(), 1.0); add(e['t'], bass(55, 1.8), 0.7); add(e['t'] + 0.02, blip(300, 900, 0.5), 0.35)
peak = max(abs(v) for v in buf) or 1
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v / peak * 0.9)) * 32767)) for v in buf)); w.close()

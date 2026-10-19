# Synthesises a simple punchy beat that lands a kick and clap on every cut. Usage: python3 beat.py cuts.json out.wav
import json, math, random, struct, sys, wave
random.seed(7)
d = json.load(open(sys.argv[1])); cuts, total = d['cuts'], d['total'] + 0.3
sr = 44100; n = int(total * sr); buf = [0.0] * n
def add(t, samples, gain):
    s = int(t * sr)
    for i, v in enumerate(samples):
        if s + i < n: buf[s + i] += v * gain
def kick():
    out = []; ph = 0.0
    for i in range(int(0.28 * sr)):
        t = i / sr; f = 45 + 110 * math.exp(-t * 28); ph += 2 * math.pi * f / sr
        out.append(math.sin(ph) * math.exp(-t * 9))
    return out
def clap():
    return [(random.random() * 2 - 1) * math.exp(-(i / sr) * 24) for i in range(int(0.16 * sr))]
def hat():
    out = []; prev = 0.0
    for i in range(int(0.05 * sr)):
        x = random.random() * 2 - 1; y = x - prev; prev = x
        out.append(y * math.exp(-(i / sr) * 90))
    return out
def bass(f, dur):
    return [math.sin(2 * math.pi * f * i / sr) * math.exp(-(i / sr) * 3.2) for i in range(int(dur * sr))]
K, C, H = kick(), clap(), hat()
step = 60 / 128 / 2  # eighth notes at 128 bpm
t = 0.0; k = 0
while t < total - 0.1:
    add(t, H, 0.22 if k % 2 else 0.12); t += step; k += 1
for i, c in enumerate(cuts):
    add(c, K, 0.95); 
    if i > 0: add(c + 0.02, C, 0.42)
    if i > 0 and i % 2 == 0: add(c, bass(55, 0.45), 0.45)
# final tag: a soft rising note under the logo card
add(cuts[-1], bass(110, 1.8), 0.25)
peak = max(abs(v) for v in buf) or 1
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v / peak * 0.9)) * 32767)) for v in buf)); w.close()

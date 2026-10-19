# Soft evolving pad for the monologue. Usage: pad.py total_seconds out.wav
import math, struct, sys, wave
total = float(sys.argv[1]); sr = 22050; n = int(total * sr); buf = [0.0] * n
chords = [(0, 8.5, [110, 164.8, 220, 261.6]), (8, 8.5, [87.3, 130.8, 174.6, 220]), (16, 8.5, [110, 164.8, 220, 261.6]), (24, 8.5, [87.3, 130.8, 174.6, 220]),
          (32, 8.5, [130.8, 196, 261.6, 329.6]), (40, 8.5, [98, 146.8, 196, 246.9]), (48, 8.5, [130.8, 196, 261.6, 329.6, 392])]
for start, dur, notes in chords:
    s0 = int(start * sr); ln = int(dur * sr)
    for f in notes:
        for det in (0.997, 1.003):
            ph = 0.0; w = 2 * math.pi * f * det / sr
            for i in range(ln):
                j = s0 + i
                if j >= n: break
                t = i / sr; env = min(1, t / 2.5) * min(1, (dur - t) / 2.5)
                buf[j] += math.sin(ph) * env * 0.16 * (0.85 + 0.15 * math.sin(2 * math.pi * 0.2 * t)); ph += w
fade = int(3 * sr)
for i in range(min(fade, n)): buf[n - 1 - i] *= i / fade; buf[i] *= i / fade
peak = max(abs(v) for v in buf) or 1
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(b''.join(struct.pack('<h', int(v / peak * 0.8 * 32767)) for v in buf)); w.close()

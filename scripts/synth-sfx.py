#!/usr/bin/env python3
"""
Sons synthétisés maison (œuvre originale, CC0) : public/sfx/synth/*.wav
  python3 scripts/synth-sfx.py && npm run sfx:index

drop-swoosh : petit souffle grave et doux pour la dépose d'une carte (kanban).
  Bruit rose, enveloppe en cloche asymétrique, passe-bas qui s'ouvre puis se referme
  (300 -> 1400 -> 350 Hz), plus un « tap » feutré très bas (95 Hz) à l'atterrissage.
Déterministe (graine fixe).
"""
import os, wave
import numpy as np

SR = 44100
OUT = 'public/sfx/synth'


def pink(n, rng):
    # Voss-McCartney simplifié : somme de bruits blancs filtrés (approx. 1/f).
    w = rng.standard_normal(n)
    b = [0.99886, 0.99332, 0.96900, 0.86650, 0.55000, -0.7616]
    g = [0.0555179, 0.0750759, 0.1538520, 0.3104856, 0.5329522, -0.0168980]
    s = np.zeros(6); out = np.empty(n)
    for i in range(n):
        s = s * b + w[i] * np.array(g)
        out[i] = s.sum() + w[i] * 0.5362
    return out / np.abs(out).max()


def onepole_lp(x, cutoff):
    y = np.empty_like(x); z = 0.0
    for i in range(len(x)):
        a = 1 - np.exp(-2 * np.pi * cutoff[i] / SR)
        z += a * (x[i] - z); y[i] = z
    return y


def write(name, x, peak_db):
    x = x / np.abs(x).max() * 10 ** (peak_db / 20)
    os.makedirs(os.path.dirname(f'{OUT}/{name}'), exist_ok=True)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((x * 32767).astype('<i2').tobytes())
    print(f'{OUT}/{name}.wav', round(len(x) / SR, 3), 's')


def drop_swoosh(dur=0.42, land=0.26):
    rng = np.random.default_rng(7)
    n = int(dur * SR); t = np.arange(n) / SR
    # Cloche : montée douce jusqu'à 'land', retombée rapide.
    env = np.where(t < land, np.sin(0.5 * np.pi * t / land) ** 2, np.exp(-(t - land) / 0.03))
    cut = np.interp(t, [0, land * 0.8, dur], [300, 1400, 350])
    noise = onepole_lp(onepole_lp(pink(n, rng), cut), cut)  # 2 pôles : plus rond
    swoosh = noise * env
    # Tap feutré à l'atterrissage.
    tt = np.clip(t - land, 0, None)
    tap = np.sin(2 * np.pi * 95 * tt) * np.exp(-tt / 0.035) * (t >= land)
    x = swoosh / np.abs(swoosh).max() + 0.45 * tap
    # Micro fondus anti-clic.
    f = int(0.004 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    return x


write('drop-swoosh', drop_swoosh(), -6)

# Silence (20 ms) : rôle « hover » du thème classic, qui n'a pas de son de survol.
with wave.open(f'{OUT}/silence.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(b'\x00\x00' * int(0.02 * SR))
print(f'{OUT}/silence.wav 0.02 s')

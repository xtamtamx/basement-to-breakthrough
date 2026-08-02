#!/usr/bin/env python3
"""
composeMusic.py — the studio for Settling Up's score.

Four composed tracks, written as data (chords, riffs, drum patterns) and
rendered through a small SNES-flavoured synth: pulse/triangle/saw voices with
vibrato and a one-pole filter, synthesized drums, tempo-synced ping-pong delay,
and a soft-clipped master. Deliberately NOT a random-note generator — every
part is authored, with voice-leading, call-and-response and fills.

Seamless loops: each song is rendered TWICE back to back and the second pass is
kept, so the delay/decay tails of bar N land at the top exactly as they will
when the loop wraps. The exported file is sample-exact to the musical length.

Output: public/assets/music/<name>.m4a (AAC via afconvert — writes the gapless
iTunSMPB metadata browsers honour in decodeAudioData) + a manifest printed for
src/utils/musicManifest.ts.

Run:  python3 scripts/composeMusic.py        (brew python has numpy)
"""

import numpy as np
import subprocess
import wave
import os
import sys

SR = 44100

# ───────────────────────────── pitch helpers ─────────────────────────────

NOTE_INDEX = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4,
              "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9,
              "A#": 10, "Bb": 10, "B": 11}

def hz(name: str) -> float:
    """'A4' → 440.0. The one tuning table everything reads."""
    pitch, octave = name[:-1], int(name[-1])
    semis = NOTE_INDEX[pitch] + (octave + 1) * 12 - 69
    return 440.0 * 2 ** (semis / 12)

# ───────────────────────────── synth voices ──────────────────────────────

def _env(n, attack, decay, sustain, release, dur_n):
    """Attack/decay-to-sustain envelope with a release tail inside the note."""
    env = np.zeros(n)
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    body = max(a + 1, dur_n - r)
    env[:a] = np.linspace(0, 1, a)
    dd = min(d, body - a)
    if dd > 0:
        env[a:a + dd] = np.linspace(1, sustain, dd)
        env[a + dd:body] = sustain
    tail = n - body
    if tail > 0:
        env[body:] = env[body - 1] * np.linspace(1, 0, tail)
    return env

def tone(freq, dur, wave_kind="pulse", duty=0.25, vibrato=0.0, vib_rate=5.5,
         cutoff=None, attack=0.004, decay=0.10, sustain=0.6, release=0.05,
         detune=0.0):
    """One synth note. Returns mono float array, length dur+release."""
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    f = freq * (1 + vibrato * np.sin(2 * np.pi * vib_rate * t))
    phase = np.cumsum(f) / SR
    if detune:
        f2 = freq * (1 + detune) * (1 + vibrato * np.sin(2 * np.pi * vib_rate * t + 1.3))
        phase2 = np.cumsum(f2) / SR
    if wave_kind == "pulse":
        sig = np.where((phase % 1.0) < duty, 1.0, -1.0)
        if detune:
            sig = 0.6 * sig + 0.4 * np.where((phase2 % 1.0) < duty, 1.0, -1.0)
    elif wave_kind == "tri":
        sig = 2 * np.abs(2 * (phase % 1.0) - 1) - 1
    elif wave_kind == "saw":
        sig = 2 * (phase % 1.0) - 1
        if detune:
            sig = 0.6 * sig + 0.4 * (2 * (phase2 % 1.0) - 1)
    else:
        sig = np.sin(2 * np.pi * phase)
    if cutoff:
        # one-pole lowpass — the SNES-ish warmth
        alpha = 1 - np.exp(-2 * np.pi * cutoff / SR)
        out = np.empty_like(sig)
        acc = 0.0
        for i in range(len(sig)):  # small n; fine in numpy-adjacent python
            acc += alpha * (sig[i] - acc)
            out[i] = acc
        sig = out
    return sig * _env(n, attack, decay, sustain, release, int(dur * SR))

# drums — synthesized, punchy, short
def kick(vel=1.0):
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 28) + 44
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    click = (np.random.default_rng(7).uniform(-1, 1, n) * np.exp(-t * 320)) * 0.4
    return (body + click) * vel

def snare(vel=1.0, bright=False, seed=11):
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).uniform(-1, 1, n)
    noise = np.diff(noise, prepend=0.0) * (3.2 if bright else 2.2)  # highpass-ish
    tone_part = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 42) * 0.5
    return (noise * np.exp(-t * (30 if bright else 38)) + tone_part) * vel

def hat(vel=1.0, open_=False, seed=23):
    n = int((0.10 if open_ else 0.035) * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).uniform(-1, 1, n)
    noise = np.diff(np.diff(noise, prepend=0.0), prepend=0.0)  # double diff = bright
    return noise * np.exp(-t * (48 if open_ else 130)) * vel * 0.5

def crash(vel=1.0, seed=31):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).uniform(-1, 1, n)
    noise = np.diff(noise, prepend=0.0) * 2.0
    return noise * np.exp(-t * 5.0) * vel * 0.6

# ───────────────────────────── the sequencer ─────────────────────────────

class Song:
    """A stereo mix bus with beat-addressed placement + tempo-synced delay."""

    def __init__(self, bpm, bars, beats_per_bar=4):
        self.bpm = bpm
        self.bars = bars
        self.spb = 60 / bpm                      # seconds per beat
        self.length_s = bars * beats_per_bar * self.spb
        n = int(round(self.length_s * SR))
        # two passes so pass-1 tails wrap into pass-2's head (see module doc)
        self.L = np.zeros(2 * n)
        self.R = np.zeros(2 * n)
        self.n = n
        self.delay_bufL = np.zeros(2 * n)
        self.delay_bufR = np.zeros(2 * n)

    def _place(self, sig, beat, gain, pan, delay_send=0.0, both_passes=True):
        for p in (0, 1) if both_passes else (1,):
            i = int(round((beat * self.spb) * SR)) + p * self.n
            j = min(i + len(sig), len(self.L))
            if j <= i:
                continue
            seg = sig[: j - i]
            lg = gain * min(1.0, 1.0 - pan)
            rg = gain * min(1.0, 1.0 + pan)
            self.L[i:j] += seg * lg
            self.R[i:j] += seg * rg
            if delay_send > 0:
                self.delay_bufL[i:j] += seg * lg * delay_send
                self.delay_bufR[i:j] += seg * rg * delay_send

    def note(self, name, beat, dur_beats, voice, gain=0.2, pan=0.0, delay_send=0.0, **kw):
        sig = tone(hz(name), dur_beats * self.spb, **{**voice, **kw})
        self._place(sig, beat, gain, pan, delay_send)

    def drum(self, sig, beat, gain=0.6, pan=0.0):
        self._place(sig, beat, gain, pan)

    def render(self):
        # ping-pong delay: dotted-eighth, 3 taps, L→R
        d = int(round(self.spb * 0.75 * SR))
        outL, outR = self.L, self.R
        fb = 0.42
        srcL, srcR = self.delay_bufL, self.delay_bufR
        for tap in range(1, 4):
            g = fb ** tap
            off = d * tap
            if off >= len(outL):
                break
            # alternate channels per tap = ping-pong
            a, b = (srcR, srcL) if tap % 2 else (srcL, srcR)
            outL[off:] += a[:-off] * g
            outR[off:] += b[:-off] * g
        # keep the SECOND pass only — pass-1 tails have wrapped into it
        L, R = outL[self.n:], outR[self.n:]
        mix = np.stack([L, R])
        mix = np.tanh(mix * 1.15)                      # gentle glue
        peak = np.max(np.abs(mix)) or 1.0
        return (mix / peak * 0.89)                     # ≈ -1 dBFS

# ───────────────────────────── voices (presets) ───────────────────────────

LEAD_WARM  = dict(wave_kind="pulse", duty=0.25, vibrato=0.006, cutoff=3800,
                  attack=0.012, decay=0.16, sustain=0.55, release=0.10)
LEAD_PUNK  = dict(wave_kind="pulse", duty=0.50, vibrato=0.004, cutoff=5200,
                  attack=0.003, decay=0.06, sustain=0.62, release=0.04)
LEAD_BIG   = dict(wave_kind="saw", detune=0.006, vibrato=0.005, cutoff=4600,
                  attack=0.01, decay=0.12, sustain=0.65, release=0.12)
BASS_TRI   = dict(wave_kind="tri", cutoff=900, attack=0.006, decay=0.10,
                  sustain=0.8, release=0.05)
BASS_DRIVE = dict(wave_kind="saw", cutoff=1100, attack=0.004, decay=0.05,
                  sustain=0.85, release=0.03)
PAD_SOFT   = dict(wave_kind="pulse", duty=0.5, cutoff=1600, attack=0.30,
                  decay=0.4, sustain=0.7, release=0.5)
PAD_STAB   = dict(wave_kind="saw", detune=0.005, cutoff=2600, attack=0.004,
                  decay=0.10, sustain=0.35, release=0.06)

# ─────────────────────────────── the songs ────────────────────────────────

def basement_light():
    """Title — 92 BPM, 16 bars in A minor. Standing in the empty room before
    the show: warm arps, a melody that asks a question and half-answers it."""
    s = Song(92, 16)
    prog = [("A2", ["A3", "C4", "E4", "B4"]),   # Am(add9)
            ("F2", ["F3", "A3", "C4", "E4"]),   # Fmaj7
            ("C3", ["C4", "E4", "G4", "B4"]),   # Cmaj7
            ("G2", ["G3", "B3", "D4", "F#4"])]  # G(add7-ish lift)
    for rep in range(4):                        # 4 × 4-bar cycle
        for bar, (root, chord) in enumerate(prog):
            b0 = (rep * 4 + bar) * 4
            s.note(root, b0, 3.6, BASS_TRI, gain=0.30)
            # broken-chord arp, eighths — the "lights humming" texture
            for k in range(8):
                s.note(chord[k % len(chord)], b0 + k * 0.5, 0.45, LEAD_WARM,
                       gain=0.085, pan=(-0.3 if k % 2 else 0.25), delay_send=0.35)
            s.drum(hat(0.5), b0 + 2, gain=0.16)
            if bar % 2 == 1:
                s.drum(snare(0.4, seed=11), b0 + 2, gain=0.14)
    # the melody — enters second half of the loop, call and half-answer
    mel = [  # (bar, beat, note, dur)
        (8, 0.0, "E5", 1.5), (8, 1.5, "C5", 0.5), (8, 2.0, "D5", 2.0),
        (9, 0.0, "C5", 1.0), (9, 1.5, "A4", 1.0), (9, 3.0, "G4", 1.0),
        (10, 0.0, "A4", 2.5), (10, 3.0, "B4", 1.0),
        (11, 0.0, "B4", 1.5), (11, 2.0, "D5", 2.0),
        (12, 0.0, "E5", 1.5), (12, 1.5, "C5", 0.5), (12, 2.0, "D5", 1.0), (12, 3.0, "E5", 1.0),
        (13, 0.0, "F5", 1.5), (13, 2.0, "E5", 2.0),
        (14, 0.0, "D5", 1.0), (14, 1.5, "C5", 1.0), (14, 3.0, "B4", 1.0),
        (15, 0.0, "A4", 3.5),                       # settle home, unresolved 9th feel
    ]
    for bar, beat, note, dur in mel:
        s.note(note, bar * 4 + beat, dur, LEAD_WARM, gain=0.16, pan=0.08,
               delay_send=0.45, vibrato=0.010)
    return s

def day_off():
    """City bed — 100 BPM, 32 bars, C major. Errands with your headphones on:
    bouncy bass, plucky motif that trades fours with its own echo."""
    s = Song(100, 32)
    A = [("C2", ["C4", "E4", "G4", "B4"]), ("A2", ["A3", "C4", "E4", "G4"]),
         ("F2", ["F3", "A3", "C4", "E4"]), ("G2", ["G3", "B3", "D4", "F4"])]
    B = [("F2", ["F3", "A3", "C4", "E4"]), ("E2", ["E3", "G3", "B3", "D4"]),
         ("D2", ["D3", "F3", "A3", "C4"]), ("G2", ["G3", "B3", "D4", "F4"])]
    form = A + A + B + A + A + A + B + A                      # 32 bars
    rng = np.random.default_rng(4)
    for bar, (root, chord) in enumerate(form):
        b0 = bar * 4
        # bass: root, up a fifth, sixth walk — the head-nod
        fifth = hz(root) * 1.5
        s.note(root, b0 + 0.0, 0.9, BASS_TRI, gain=0.33)
        s.note(root, b0 + 1.5, 0.4, BASS_TRI, gain=0.26)
        s.note(root, b0 + 2.0, 0.9, BASS_TRI, gain=0.33)
        s.note(chord[0], b0 + 3.0, 0.9, BASS_TRI, gain=0.24)
        # drums
        s.drum(kick(1.0), b0 + 0, gain=0.5); s.drum(kick(0.9), b0 + 2.5, gain=0.42)
        s.drum(snare(0.8, seed=11), b0 + 1, gain=0.34)
        s.drum(snare(0.9, seed=11), b0 + 3, gain=0.36)
        for k in range(8):
            s.drum(hat(0.5 if k % 2 else 0.7, seed=23), b0 + k * 0.5, gain=0.14)
        s.drum(hat(0.8, open_=True), b0 + 3.5, gain=0.12)
        if bar % 8 == 7:                                      # turn-around fill
            for k, v in enumerate([0.5, 0.6, 0.8, 1.0]):
                s.drum(snare(v, bright=True, seed=13), b0 + 3.0 + k * 0.25, gain=0.30)
        # comping chords on the off-beats, quiet
        s.note(chord[1], b0 + 1.5, 0.4, PAD_STAB, gain=0.055, pan=-0.2)
        s.note(chord[2], b0 + 3.5, 0.4, PAD_STAB, gain=0.055, pan=0.2)
    # the motif — pentatonic, syncopated, answers itself every other 2 bars
    motif = [(0.0, "E5", 0.75), (0.75, "G5", 0.25), (1.0, "A5", 0.75),
             (2.0, "G5", 0.5), (2.5, "E5", 0.5), (3.0, "D5", 1.0)]
    answer = [(0.5, "C5", 0.5), (1.0, "D5", 0.5), (1.5, "E5", 1.0),
              (3.0, "D5", 0.5), (3.5, "C5", 0.5)]
    for cyc in range(8):
        base = cyc * 16                                       # every 4 bars
        seq = motif if cyc % 2 == 0 else answer
        transpose = 0 if cyc < 6 else 1                       # last cycles lift
        for beat, note, dur in seq:
            nm = note if not transpose else note[0] + str(int(note[-1]))  # same register
            s.note(nm, base + beat, dur, LEAD_WARM, gain=0.14,
                   pan=0.1 if cyc % 2 == 0 else -0.1, delay_send=0.4)
    return s

def load_in():
    """Run heating up — 152 BPM, 16 bars, E minor. Doors in an hour: driving
    eighths, a stabby riff, and a chorus that jumps the octave."""
    s = Song(152, 16)
    prog = [("E2", ["E3", "G3", "B3"]), ("C2", ["C3", "E3", "G3"]),
            ("G2", ["G3", "B3", "D4"]), ("D2", ["D3", "F#3", "A3"])]
    for rep in range(4):
        for bar, (root, chord) in enumerate(prog):
            b0 = (rep * 4 + bar) * 4
            for k in range(8):                                # driving 8ths bass
                s.note(root, b0 + k * 0.5, 0.42, BASS_DRIVE,
                       gain=0.30 if k % 2 == 0 else 0.24)
            s.drum(kick(1.0), b0 + 0, gain=0.55)
            s.drum(kick(0.95), b0 + 2, gain=0.5)
            s.drum(kick(0.8), b0 + 3.5, gain=0.4)
            s.drum(snare(1.0, bright=True, seed=11), b0 + 1, gain=0.4)
            s.drum(snare(1.0, bright=True, seed=11), b0 + 3, gain=0.4)
            for k in range(8):
                s.drum(hat(0.9 if k % 2 == 0 else 0.6, seed=23), b0 + k * 0.5, gain=0.16)
            # power-chord stab at each bar top
            for nn in chord:
                s.note(nn, b0, 0.6, PAD_STAB, gain=0.07, pan=0.0)
        s.drum(crash(0.8), rep * 16, gain=0.3)
    # riff (verse bars 0-7): tight, palm-mute-short
    riff = [(0.0, "E4", 0.4), (0.5, "E4", 0.4), (1.0, "G4", 0.4), (1.5, "A4", 0.65),
            (2.5, "B4", 0.4), (3.0, "A4", 0.4), (3.5, "G4", 0.4)]
    for bar in range(0, 8, 2):
        for beat, note, dur in riff:
            s.note(note, bar * 4 + beat, dur, LEAD_PUNK, gain=0.15, delay_send=0.15)
    # chorus (bars 8-15): same shape an octave up, longer notes — the lift
    chorus = [(0.0, "E5", 1.5), (1.5, "D5", 0.5), (2.0, "B4", 1.0), (3.0, "D5", 1.0)]
    chorus2 = [(0.0, "G5", 1.5), (1.5, "F#5", 0.5), (2.0, "E5", 1.0), (3.0, "D5", 1.0)]
    for bar in range(8, 16):
        seq = chorus if bar % 4 < 2 else chorus2
        for beat, note, dur in seq:
            s.note(note, bar * 4 + beat, dur, LEAD_PUNK, gain=0.16,
                   delay_send=0.3, vibrato=0.008)
    # fill into the wrap
    for k, v in enumerate([0.6, 0.7, 0.85, 1.0, 1.0, 1.0]):
        s.drum(snare(v, bright=True, seed=13), 15 * 4 + 2.5 + k * 0.25, gain=0.34)
    return s

def big_stage():
    """Festival — 126 BPM, 16 bars, C major anthem. They actually made it:
    pumping octaves, off-beat stabs, a chorus you could yell from a field."""
    s = Song(126, 16)
    prog = [("F2", ["F3", "A3", "C4"]), ("G2", ["G3", "B3", "D4"]),
            ("A2", ["A3", "C4", "E4"]), ("A2", ["A3", "C4", "E4"]),
            ("F2", ["F3", "A3", "C4"]), ("G2", ["G3", "B3", "D4"]),
            ("C3", ["C4", "E4", "G4"]), ("C3", ["C4", "E4", "G4"])]
    for rep in range(2):
        for bar, (root, chord) in enumerate(prog):
            b0 = (rep * 8 + bar) * 4
            root_hi = root[0] + str(int(root[-1]) + 1)
            for k in range(8):                                # octave-pump bass
                nm = root if k % 2 == 0 else root_hi
                s.note(nm, b0 + k * 0.5, 0.4, BASS_DRIVE, gain=0.28)
            s.drum(kick(1.0), b0 + 0, gain=0.55); s.drum(kick(1.0), b0 + 1, gain=0.55)
            s.drum(kick(1.0), b0 + 2, gain=0.55); s.drum(kick(1.0), b0 + 3, gain=0.55)
            s.drum(snare(0.9, seed=11), b0 + 1, gain=0.34)
            s.drum(snare(0.9, seed=11), b0 + 3, gain=0.34)
            for k in range(4):                                # open hats off-beat
                s.drum(hat(0.8, open_=True, seed=29), b0 + k + 0.5, gain=0.14)
            for nn in chord:                                  # off-beat stabs (the pump)
                s.note(nn, b0 + 0.5, 0.35, PAD_STAB, gain=0.075, pan=-0.15)
                s.note(nn, b0 + 2.5, 0.35, PAD_STAB, gain=0.075, pan=0.15)
        s.drum(crash(1.0), rep * 32, gain=0.34)
    # anthem melody — long notes, wide, doubled an octave below at low mix
    anthem = [
        (0, 0.0, "A4", 3.0), (0, 3.0, "G4", 1.0),
        (1, 0.0, "B4", 3.0), (1, 3.0, "C5", 1.0),
        (2, 0.0, "C5", 2.0), (2, 2.0, "E5", 2.0),
        (3, 0.0, "E5", 4.0),
        (4, 0.0, "F5", 2.0), (4, 2.0, "E5", 1.0), (4, 3.0, "D5", 1.0),
        (5, 0.0, "D5", 2.0), (5, 2.0, "C5", 1.0), (5, 3.0, "B4", 1.0),
        (6, 0.0, "C5", 4.0),
        (7, 0.0, "G4", 2.0), (7, 2.0, "E4", 2.0),
    ]
    for rep in range(2):
        for bar, beat, note, dur in anthem:
            b = (rep * 8 + bar) * 4 + beat
            s.note(note, b, dur, LEAD_BIG, gain=0.15, delay_send=0.35, vibrato=0.009)
            low = note[:-1] + str(int(note[-1]) - 1)
            s.note(low, b, dur, LEAD_BIG, gain=0.06, delay_send=0.2)
    # riser into the wrap: filtered noise swell, last bar
    n = int(4 * s.spb * SR)
    t = np.arange(n) / SR
    rise = np.random.default_rng(41).uniform(-1, 1, n) * (t / t[-1]) ** 2 * 0.25
    s._place(rise, 15 * 4, gain=0.5, pan=0.0)
    return s

# ───────────────────────────── render + encode ────────────────────────────

TRACKS = {
    "basement-light": basement_light,   # title
    "day-off":        day_off,          # chill
    "load-in":        load_in,          # intense
    "big-stage":      big_stage,        # festival
}

def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "music")
    os.makedirs(out_dir, exist_ok=True)
    manifest = []
    for name, fn in TRACKS.items():
        song = fn()
        mix = song.render()
        pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
        wav_path = os.path.join(out_dir, f"{name}.wav")
        with wave.open(wav_path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(pcm.T.reshape(-1).tobytes())
        m4a_path = os.path.join(out_dir, f"{name}.m4a")
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "192000",
                        wav_path, m4a_path], check=True)
        os.remove(wav_path)                                    # only ship the m4a
        dur = song.n / SR
        size = os.path.getsize(m4a_path)
        manifest.append((name, song.bpm, song.bars, dur, size))
        print(f"{name:16} {song.bpm:>3} bpm  {song.bars:>2} bars  "
              f"{dur:7.3f}s  {size/1024:6.0f} KB")
    print("\n// musicManifest loop durations (exact, seconds):")
    for name, bpm, bars, dur, _ in manifest:
        print(f"//   {name}: {dur:.6f}")

if __name__ == "__main__":
    sys.exit(main())

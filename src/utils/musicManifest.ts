/**
 * The composed score — real authored tracks rendered by scripts/composeMusic.py
 * and bundled locally (never fetched over the network; capacitor:// has no CDN).
 *
 * gameAudio tries these first and keeps the old procedural synth as the
 * fallback, so a failed decode can only ever sound like the game used to.
 *
 * `loopEnd` is the EXACT musical length in seconds (printed by the composer at
 * render time). AAC decoding can append encoder padding; looping the buffer via
 * loopStart/loopEnd instead of its raw duration is what keeps the wrap
 * seamless. The render itself uses a two-pass trick so bar N's delay tails land
 * at bar 1 exactly as they will when the loop wraps.
 */

export type MusicTrackType = "title" | "chill" | "intense" | "festival";

export interface ComposedTrack {
  /** Bundle-rooted path (public/ is served at the app root in dev + Capacitor). */
  src: string;
  /** Exact loop length in seconds — from the composer's render log, not the file. */
  loopEnd: number;
  /** Tempo, for the synthetic beat clock that drives beat-synced visuals. */
  bpm: number;
  /** Per-track trim into the shared music gain (levels matched at render, so ~1). */
  gain: number;
  /** Display credit — the score is part of the fiction. */
  title: string;
}

export const COMPOSED_TRACKS: Record<MusicTrackType, ComposedTrack> = {
  title: {
    src: "/assets/music/basement-light.m4a",
    loopEnd: 41.739138,
    bpm: 92,
    gain: 0.9,
    title: "Basement Light",
  },
  chill: {
    src: "/assets/music/day-off.m4a",
    loopEnd: 76.8,
    bpm: 100,
    gain: 1.0,
    title: "Day Off in Bagel Hamlet",
  },
  intense: {
    src: "/assets/music/load-in.m4a",
    loopEnd: 25.263152,
    bpm: 152,
    gain: 1.0,
    title: "Load-In at Eight",
  },
  festival: {
    src: "/assets/music/big-stage.m4a",
    loopEnd: 30.47619,
    bpm: 126,
    gain: 1.0,
    title: "The Big Stage",
  },
};

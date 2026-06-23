/**
 * fxQuality — user-tunable graphics-FX tier, persisted across sessions.
 *
 * Gates the optional Pixi particle overlay (and any future GPU post-FX). The
 * map's core Canvas-2D render + bloom are always on; this only governs the
 * extra GPU layer so low-end devices / reduced-motion users can dial it down.
 */
import { create } from 'zustand';
import { safeStorage } from '@utils/safeStorage';

export type FxQuality = 'ultra' | 'high' | 'low' | 'off';
const KEY = 'fx-quality';
// 'ultra' is appended so it's only reachable by deliberately cycling past 'off'
// — it's a heavy opt-in GPU-compositor tier, never a fresh-user default.
const ORDER: FxQuality[] = ['high', 'low', 'off', 'ultra'];

/** The opt-in GPU post-FX compositor tier (CRT + bloom over the whole map). */
export const isUltra = (q: FxQuality) => q === 'ultra';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initialQuality(): FxQuality {
  const saved = safeStorage.getItem(KEY);
  if (saved === 'high' || saved === 'low' || saved === 'off' || saved === 'ultra') return saved;
  // First run: honour the OS reduced-motion preference, else default to high.
  return prefersReducedMotion() ? 'off' : 'high';
}

interface FxState {
  quality: FxQuality;
  setQuality: (q: FxQuality) => void;
  cycleQuality: () => void;
}

export const useFxQuality = create<FxState>((set, get) => ({
  quality: initialQuality(),
  setQuality: (q) => {
    safeStorage.setItem(KEY, q);
    set({ quality: q });
  },
  cycleQuality: () => {
    const next = ORDER[(ORDER.indexOf(get().quality) + 1) % ORDER.length];
    safeStorage.setItem(KEY, next);
    set({ quality: next });
  },
}));

/** Particle budget per tier — capped low so the overlay stays cheap on mobile.
 * Ultra keeps the high mote budget (it composites through the same Pixi path). */
export const fxParticleCount = (q: FxQuality): number => (q === 'high' || q === 'ultra' ? 80 : q === 'low' ? 34 : 0);

/** Burst-particle pool cap per tier (big-moment confetti/sparks). 0 = off, so
 * reduced-motion / off-tier users never see bursts (the layer early-returns). */
export const fxBurstCap = (q: FxQuality): number => (q === 'high' || q === 'ultra' ? 64 : q === 'low' ? 28 : 0);

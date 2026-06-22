/**
 * fxQuality — user-tunable graphics-FX tier, persisted across sessions.
 *
 * Gates the optional Pixi particle overlay (and any future GPU post-FX). The
 * map's core Canvas-2D render + bloom are always on; this only governs the
 * extra GPU layer so low-end devices / reduced-motion users can dial it down.
 */
import { create } from 'zustand';
import { safeStorage } from '@utils/safeStorage';

export type FxQuality = 'high' | 'low' | 'off';
const KEY = 'fx-quality';
const ORDER: FxQuality[] = ['high', 'low', 'off'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initialQuality(): FxQuality {
  const saved = safeStorage.getItem(KEY);
  if (saved === 'high' || saved === 'low' || saved === 'off') return saved;
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

/** Particle budget per tier — capped low so the overlay stays cheap on mobile. */
export const fxParticleCount = (q: FxQuality): number => (q === 'high' ? 80 : q === 'low' ? 34 : 0);

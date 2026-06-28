import { describe, it, expect, beforeEach, vi } from 'vitest';

// Drive the unlock logic against controlled meta state (the manager + mode-win
// reads are mocked in-memory so thresholds are deterministic).
const h = vi.hoisted(() => ({
  unlocks: new Set<string>(),
  stats: { totalRuns: 0, totalShows: 0, totalFans: 0, totalRevenue: 0 },
  beaten: new Set<string>(),
}));

vi.mock('@game/mechanics/MetaProgressionManager', () => ({
  metaProgressionManager: {
    hasUnlock: (id: string) => h.unlocks.has(id),
    recordUnlock: (id: string) => { if (h.unlocks.has(id)) return false; h.unlocks.add(id); return true; },
    getProgression: () => ({ totalRuns: h.stats.totalRuns, stats: { ...h.stats } }),
  },
}));
vi.mock('@game/mechanics/modeUnlocks', () => ({
  MODE_ORDER: ['classic', 'speed', 'festival', 'hardcore'],
  isModeBeaten: (m: string) => h.beaten.has(m),
}));

import { isBandUnlocked, bandLockInfo, recordBandUnlocks, STARTER_BAND_IDS } from '../bandUnlocks';

const names = [
  { id: 'two-drink-minimum', name: 'Everything Was Alright At The Start' },
  { id: 'scene-veterans', name: 'Mind the Bollards' },
  { id: 'audience-of-phones', name: 'Neon Cathedral' },
  { id: 'blink-twice-fastcore', name: 'Total Discocrap' },
];

beforeEach(() => {
  h.unlocks.clear(); h.beaten.clear();
  h.stats.totalRuns = 0; h.stats.totalShows = 0; h.stats.totalFans = 0; h.stats.totalRevenue = 0;
});

describe('bandUnlocks', () => {
  it('starter bands are always unlocked; locked bands start locked', () => {
    expect(isBandUnlocked('basement-punks')).toBe(true);     // starter (punk floor)
    expect(STARTER_BAND_IDS.has('almost-licensed')).toBe(true);
    expect(isBandUnlocked('two-drink-minimum')).toBe(false); // locked: needs 1 run
    expect(isBandUnlocked('blink-twice-fastcore')).toBe(false); // locked: win Speed
  });

  it('exposes a hint + numeric progress for a locked counter gate', () => {
    h.stats.totalShows = 5;
    const info = bandLockInfo('road-dogs'); // shows >= 8
    expect(info.unlocked).toBe(false);
    expect(info.hint).toBe('Book 8 shows all-time');
    expect(info.progress).toEqual({ current: 5, target: 8 });
  });

  it('a mode-win gate has a hint but no numeric progress', () => {
    const info = bandLockInfo('blink-twice-fastcore');
    expect(info.hint).toBe('Win a Speed run');
    expect(info.progress).toBeNull();
  });

  it('records a cumulative-counter unlock once, when the threshold is met', () => {
    expect(recordBandUnlocks(names)).toEqual([]); // nothing met at zero
    h.stats.totalRuns = 1;
    const first = recordBandUnlocks(names);
    expect(first.map((b) => b.id)).toContain('two-drink-minimum');
    expect(first.find((b) => b.id === 'two-drink-minimum')!.name).toBe('Everything Was Alright At The Start');
    expect(isBandUnlocked('two-drink-minimum')).toBe(true);
    expect(recordBandUnlocks(names)).toEqual([]); // idempotent — no re-fire
  });

  it('records revenue/fans gates and a mode-win gate', () => {
    h.stats.totalRevenue = 2500; // scene-veterans
    h.stats.totalFans = 1500;    // audience-of-phones
    h.beaten.add('speed');       // blink-twice-fastcore
    const fresh = recordBandUnlocks(names).map((b) => b.id);
    expect(fresh).toEqual(expect.arrayContaining(['scene-veterans', 'audience-of-phones', 'blink-twice-fastcore']));
  });
});

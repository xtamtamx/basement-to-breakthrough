import { describe, it, expect, beforeEach, vi } from 'vitest';

// Drive the LI-roster unlock logic against controlled meta state (manager,
// mode-win, and stake reads are mocked in-memory so every gate is deterministic).
// Feat gates are checked via hasUnlock, so adding `feat_*` ids to the unlocks set
// simulates earning a feat.
const h = vi.hoisted(() => ({
  unlocks: new Set<string>(),
  stats: { totalRuns: 0, totalShows: 0, totalFans: 0, totalRevenue: 0 },
  beaten: new Set<string>(),
  stakeTier: 0,
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
vi.mock('@game/mechanics/StakesManager', () => ({
  stakesManager: { getUnlockedTier: (_m: string) => h.stakeTier },
  STAKE_TIERS: [{ name: 'Open Mic' }, { name: 'Pay to Play' }, { name: 'Sellout Pressure' }, { name: 'No Future' }],
}));

import { isBandUnlocked, bandLockInfo, recordBandUnlocks, recordRunFeats, STARTER_BAND_IDS } from '../bandUnlocks';

const names = [
  { id: 'automedication', name: 'Automedication' },
  { id: 'bliss-to-eviction', name: 'From Bliss to Eviction' },
  { id: 'your-favorite-weakness', name: 'Your Favorite Weakness' },
  { id: 'needles-in-the-spaces', name: 'Needles in the Spaces' },
  { id: 'tell-all-frenemies', name: 'Tell All Your Frenemies' },
  { id: 'an-affluent-man', name: 'An Affluent Man' },
];

beforeEach(() => {
  h.unlocks.clear(); h.beaten.clear();
  h.stats.totalRuns = 0; h.stats.totalShows = 0; h.stats.totalFans = 0; h.stats.totalRevenue = 0;
  h.stakeTier = 0;
});

describe('bandUnlocks (Long Island roster — modern starters / legacy unlocks)', () => {
  it('active starters are unlocked; legacy acts start locked', () => {
    expect(isBandUnlocked('the-constant-ache')).toBe(true);     // active starter (Iron Chic)
    expect(STARTER_BAND_IDS.has('cost-of-leaving')).toBe(true); // active starter (Incendiary)
    expect(isBandUnlocked('save-each-otter')).toBe(false);      // Patent Pending — not touring, now locked
    expect(isBandUnlocked('automedication')).toBe(false);       // legacy, locked: book 10 shows
    expect(isBandUnlocked('an-affluent-man')).toBe(false);      // capstone, locked: $100k all-time
  });

  it('hints by gate kind; only cumulative gates show numeric progress', () => {
    h.stats.totalShows = 4;
    expect(bandLockInfo('automedication')).toMatchObject({ hint: 'Book 10 shows all-time', progress: { current: 4, target: 10 } });
    expect(bandLockInfo('bliss-to-eviction')).toMatchObject({ hint: 'Win a Festival run', progress: null });
    expect(bandLockInfo('your-favorite-weakness')).toMatchObject({ hint: 'Win a Pay to Play run', progress: null });
    expect(bandLockInfo('an-affluent-man')).toMatchObject({ hint: 'Earn $100,000 all-time', progress: { current: 0, target: 100000 } });
  });

  it('unlocks a cumulative gate, a mode win, and a stake clear', () => {
    h.stats.totalShows = 10;  // automedication
    h.beaten.add('festival'); // bliss-to-eviction
    h.stakeTier = 2;          // your-favorite-weakness (Pay to Play)
    const fresh = recordBandUnlocks(names).map((b) => b.id);
    expect(fresh).toEqual(expect.arrayContaining(['automedication', 'bliss-to-eviction', 'your-favorite-weakness']));
  });

  it('recordRunFeats grants feat flags that unlock feat-gated legends', () => {
    expect(recordBandUnlocks(names)).toEqual([]);
    recordRunFeats({ isWin: true, pathAlignment: 'PURE_DIY', stakeTier: 3, disasters: 0, perfectShows: 3 });
    const fresh = recordBandUnlocks(names).map((b) => b.id);
    expect(fresh).toEqual(expect.arrayContaining([
      'needles-in-the-spaces', // DIY win
      'tell-all-frenemies',    // won No Future
    ]));
  });

  it('the Billy Joel capstone needs $100k all-time', () => {
    h.stats.totalRevenue = 99999;
    expect(recordBandUnlocks(names).map((b) => b.id)).not.toContain('an-affluent-man');
    h.stats.totalRevenue = 100000;
    expect(recordBandUnlocks(names).map((b) => b.id)).toContain('an-affluent-man');
  });

  it('a loss records no feats; unlock is idempotent', () => {
    recordRunFeats({ isWin: false, pathAlignment: 'PURE_DIY', stakeTier: 3, disasters: 0, perfectShows: 5 });
    expect(recordBandUnlocks(names)).toEqual([]);
    h.stats.totalShows = 10;
    expect(recordBandUnlocks(names).map((b) => b.id)).toContain('automedication');
    expect(recordBandUnlocks(names)).toEqual([]); // no re-fire
  });
});

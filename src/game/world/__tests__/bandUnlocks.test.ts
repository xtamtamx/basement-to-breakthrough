import { describe, it, expect, beforeEach, vi } from 'vitest';

// Drive the unlock logic against controlled meta state (manager, mode-win, and
// stake reads are mocked in-memory so every gate is deterministic). City/feat
// gates are checked via hasUnlock, so adding `city_*` / `feat_*` ids to the
// unlocks set simulates touring a city / earning a feat.
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

import { isBandUnlocked, bandLockInfo, recordBandUnlocks, recordRunFeats, isBandHidden, STARTER_BAND_IDS } from '../bandUnlocks';

const names = [
  { id: 'frostbitten-cul-de-sac', name: 'Enthrone The Frost' },
  { id: 'technical-death', name: 'Spite Sells' },
  { id: 'road-dogs', name: 'Yours Cruelly' },
  { id: 'mutual-aid-abettors', name: 'How to Ruin Everything' },
  { id: 'scene-veterans', name: 'Mind the Bollards' },
  { id: 'blastbeat-yourself-up', name: 'Redaction Bars' },
  { id: 'x-disappointed-dad-x', name: 'The Weight We Carry' },
  { id: 'landlord-deathwish', name: 'Die For The Paperwork' },
];

beforeEach(() => {
  h.unlocks.clear(); h.beaten.clear();
  h.stats.totalRuns = 0; h.stats.totalShows = 0; h.stats.totalFans = 0; h.stats.totalRevenue = 0;
  h.stakeTier = 0;
});

describe('bandUnlocks (variety-weighted)', () => {
  it('starter bands are always unlocked; locked bands start locked', () => {
    expect(isBandUnlocked('basement-punks')).toBe(true);
    expect(STARTER_BAND_IDS.has('almost-licensed')).toBe(true);
    expect(isBandUnlocked('frostbitten-cul-de-sac')).toBe(false); // win Classic
    expect(isBandUnlocked('road-dogs')).toBe(false);              // tour Bostland
  });

  it('hints read by gate kind; only cumulative gates show numeric progress', () => {
    h.stats.totalShows = 10;
    expect(bandLockInfo('landlord-deathwish')).toMatchObject({
      hint: 'Book 30 shows all-time', progress: { current: 10, target: 30 },
    });
    expect(bandLockInfo('frostbitten-cul-de-sac')).toMatchObject({ hint: 'Win a Classic run', progress: null });
    expect(bandLockInfo('technical-death')).toMatchObject({ hint: 'Win a Pay to Play run', progress: null });
    expect(bandLockInfo('road-dogs')).toMatchObject({ hint: 'Tour Bostland', progress: null });
    expect(bandLockInfo('mutual-aid-abettors')).toMatchObject({ hint: 'Win a DIY-aligned run', progress: null });
  });

  it('unlocks a mode-win, a stake clear, and a city tour', () => {
    h.beaten.add('classic');                 // frostbitten-cul-de-sac
    h.stakeTier = 2;                          // technical-death (Pay to Play)
    h.unlocks.add('city_bostland');          // road-dogs (toured)
    const fresh = recordBandUnlocks(names).map((b) => b.id);
    expect(fresh).toEqual(expect.arrayContaining(['frostbitten-cul-de-sac', 'technical-death', 'road-dogs']));
  });

  it('recordRunFeats grants feat flags that unlock feat-gated bands', () => {
    expect(recordBandUnlocks(names)).toEqual([]); // nothing met yet
    recordRunFeats({ isWin: true, pathAlignment: 'PURE_DIY', stakeTier: 3, disasters: 0, perfectShows: 3 });
    const fresh = recordBandUnlocks(names).map((b) => b.id);
    expect(fresh).toEqual(expect.arrayContaining([
      'mutual-aid-abettors',   // DIY win
      'scene-veterans',        // zero disasters
      'blastbeat-yourself-up', // 3 sold-out shows
      'x-disappointed-dad-x',  // won No Future
    ]));
  });

  it('Long Island bands stay HIDDEN through normal play; reveal only via the secret flag', () => {
    expect(isBandHidden('tell-all-frenemies')).toBe(true);   // secret + locked
    expect(isBandHidden('road-dogs')).toBe(false);           // locked but not secret
    expect(isBandHidden('basement-punks')).toBe(false);      // starter
    // No amount of normal-play progress unlocks them...
    h.stats.totalRuns = 50; h.stats.totalFans = 999999; h.beaten.add('hardcore'); h.stakeTier = 3;
    expect(recordBandUnlocks([{ id: 'tell-all-frenemies', name: 'x' }]).map((b) => b.id)).not.toContain('tell-all-frenemies');
    expect(isBandHidden('tell-all-frenemies')).toBe(true);
    // ...only the private trigger does.
    h.unlocks.add('feat_long_island');
    const fresh = recordBandUnlocks([{ id: 'tell-all-frenemies', name: 'Tell All Your Frenemies' }]).map((b) => b.id);
    expect(fresh).toContain('tell-all-frenemies');
    expect(isBandHidden('tell-all-frenemies')).toBe(false);
  });

  it('a loss records no feats; unlock is idempotent', () => {
    recordRunFeats({ isWin: false, pathAlignment: 'PURE_DIY', stakeTier: 3, disasters: 0, perfectShows: 5 });
    expect(recordBandUnlocks(names)).toEqual([]); // a loss earns no feats
    h.stats.totalShows = 30;
    expect(recordBandUnlocks(names).map((b) => b.id)).toContain('landlord-deathwish');
    expect(recordBandUnlocks(names)).toEqual([]); // no re-fire
  });
});

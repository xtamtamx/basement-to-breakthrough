import { describe, it, expect, beforeEach } from 'vitest';
import { Band, Genre, TraitType, TraitModifier } from '@game/types';
import { factionSystem } from '../FactionSystem';
import { bandRelationships } from '../BandRelationships';
import { computeLineupChemistry } from '../lineupChemistry';

// Minimal band with an explicit faction membership trait, so chemistry is driven
// by faction identity (not the alignment math, which other tests cover).
function band(id: string, faction: string): Band {
  return {
    id,
    name: id,
    genre: Genre.PUNK,
    authenticity: 70,
    energy: 70,
    technicalSkill: 50,
    popularity: 30,
    traits: faction
      ? [{ id: `faction-${faction}`, name: `${faction} Member`, description: '', type: TraitType.PERSONALITY, modifier: {} as TraitModifier }]
      : [],
    hometown: 'Test',
  } as unknown as Band;
}

describe('lineupChemistry', () => {
  beforeEach(() => {
    factionSystem.reset();
    bandRelationships.clearRelationships();
  });

  it('a solo bill has neutral chemistry (mult 1, no conflicts)', () => {
    const chem = computeLineupChemistry([band('a', 'diy-purists')]);
    expect(chem.mult).toBe(1);
    expect(chem.conflicts).toHaveLength(0);
    expect(chem.hostile).toBe(false);
  });

  it('same-faction bands draw a friendly crowd bump (>1, not hostile)', () => {
    const chem = computeLineupChemistry([band('a', 'diy-purists'), band('b', 'diy-purists')]);
    expect(chem.mult).toBeGreaterThan(1);
    expect(chem.hostile).toBe(false);
  });

  it('rival-faction bands are hostile and dampen the crowd (<1 + a warning)', () => {
    // diy-purists vs new-wave is -70 in the rivalry web → bad blood.
    const chem = computeLineupChemistry([band('a', 'diy-purists'), band('b', 'new-wave')]);
    expect(chem.mult).toBeLessThan(1);
    expect(chem.hostile).toBe(true);
    expect(chem.conflicts.length).toBeGreaterThan(0);
  });

  it('stays clamped to a side-grade even at the extremes', () => {
    const chem = computeLineupChemistry([band('a', 'diy-purists'), band('b', 'new-wave')]);
    expect(chem.mult).toBeGreaterThanOrEqual(0.88);
    expect(chem.mult).toBeLessThanOrEqual(1.12);
  });

  it('co-billing drift layers on top of faction affinity', () => {
    const a = band('a', 'metal-elite');
    const b = band('b', 'metal-elite');
    const before = computeLineupChemistry([a, b]).avg;
    // Successful shows together push them closer.
    bandRelationships.updateRelationshipsFromShow(['a', 'b'], true, 1);
    bandRelationships.updateRelationshipsFromShow(['a', 'b'], true, 2);
    const after = computeLineupChemistry([a, b]).avg;
    expect(after).toBeGreaterThan(before);
  });
});

describe('FactionSystem faction helpers', () => {
  beforeEach(() => factionSystem.reset());

  it('getBandFaction reads an explicit membership trait', () => {
    expect(factionSystem.getBandFaction(band('a', 'metal-elite'))).toBe('metal-elite');
  });

  it('factionPairAffinity: same faction friendly, rivals hostile, unaffiliated neutral', () => {
    expect(factionSystem.factionPairAffinity(band('a', 'diy-purists'), band('b', 'diy-purists'))).toBe(40);
    expect(factionSystem.factionPairAffinity(band('a', 'diy-purists'), band('b', 'new-wave'))).toBe(-50);
    expect(factionSystem.factionPairAffinity(band('a', 'diy-purists'), band('b', ''))).toBe(0);
  });

  it('reset() clears standings back to neutral', () => {
    factionSystem.setStanding('diy-purists', 80);
    factionSystem.reset();
    expect(factionSystem.getStanding('diy-purists')).toBe(0);
  });
});

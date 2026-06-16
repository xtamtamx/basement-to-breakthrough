import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gentrificationSystem } from '../GentrificationSystem';
import { useGameStore } from '@stores/gameStore';
import { difficultySystem } from '../DifficultySystem';

vi.mock('@stores/gameStore');
vi.mock('../DifficultySystem');

interface MockDistrict {
  id: string;
  name: string;
  sceneStrength: number;
  gentrificationLevel: number;
}

describe('GentrificationSystem', () => {
  let districts: MockDistrict[];
  let updates: Array<{ id: string; changes: Partial<MockDistrict> }>;

  beforeEach(() => {
    vi.clearAllMocks();
    districts = [
      { id: 'eastside', name: 'Eastside', sceneStrength: 80, gentrificationLevel: 30 },
      { id: 'downtown', name: 'Downtown', sceneStrength: 60, gentrificationLevel: 70 },
    ];
    updates = [];

    const state = {
      districts,
      // Mirror the real store: replace the element with a new object rather
      // than mutating in place, so a captured `district` ref keeps its old
      // value (the real store uses districts.map(d => ({...d, ...changes}))).
      updateDistrictGentrification: vi.fn(
        (id: string, changes: Partial<MockDistrict>) => {
          updates.push({ id, changes });
          const idx = districts.findIndex((x) => x.id === id);
          if (idx >= 0) districts[idx] = { ...districts[idx], ...changes };
        },
      ),
    };
    vi.mocked(useGameStore).getState = vi.fn().mockReturnValue(state);
    vi.mocked(difficultySystem).getCurrentDifficulty = vi
      .fn()
      .mockReturnValue({ gentrificationRate: 0.05 });
  });

  describe('getRentMultiplier', () => {
    it('raises rent with gentrification level', () => {
      // downtown at 70% gentrification → 1 + 0.7 * 0.6 = 1.42
      expect(gentrificationSystem.getRentMultiplier('downtown')).toBeCloseTo(1.42);
    });

    it('returns 1 for an unknown district', () => {
      expect(gentrificationSystem.getRentMultiplier('nope')).toBe(1);
    });
  });

  describe('getAttendanceMultiplier', () => {
    it('is 1 below the free threshold', () => {
      districts[0].gentrificationLevel = 30; // below 40
      expect(gentrificationSystem.getAttendanceMultiplier('eastside')).toBe(1);
    });

    it('penalizes turnout at high gentrification', () => {
      districts[1].gentrificationLevel = 100; // full penalty
      expect(gentrificationSystem.getAttendanceMultiplier('downtown')).toBeCloseTo(
        0.75,
      );
    });
  });

  describe('applyTurnGentrification', () => {
    it('raises gentrification faster where shows happened', () => {
      gentrificationSystem.applyTurnGentrification(new Set(['eastside']));

      const eastside = districts.find((d) => d.id === 'eastside')!;
      const downtown = districts.find((d) => d.id === 'downtown')!;
      // both rise, but the active district rises more
      expect(eastside.gentrificationLevel).toBeGreaterThan(30);
      expect(downtown.gentrificationLevel).toBeGreaterThan(70);
      const eastsideRise = eastside.gentrificationLevel - 30;
      const downtownRise = downtown.gentrificationLevel - 70;
      expect(eastsideRise).toBeGreaterThan(downtownRise);
    });

    it('erodes scene strength past the soul threshold', () => {
      // downtown starts at 70 gentrification (>= 60 threshold)
      const before = districts.find((d) => d.id === 'downtown')!.sceneStrength;
      gentrificationSystem.applyTurnGentrification(new Set());
      const after = districts.find((d) => d.id === 'downtown')!.sceneStrength;
      expect(after).toBeLessThan(before);
    });

    it('leaves scene strength alone below the threshold', () => {
      districts[0].gentrificationLevel = 20; // eastside well below 60
      gentrificationSystem.applyTurnGentrification(new Set());
      expect(districts.find((d) => d.id === 'eastside')!.sceneStrength).toBe(80);
    });

    it('emits a turnout notice when a district first crosses the attendance threshold (40)', () => {
      districts[0].gentrificationLevel = 39; // eastside about to cross 40
      const result = gentrificationSystem.applyTurnGentrification(
        new Set(['eastside']),
      );
      expect(districts.find((d) => d.id === 'eastside')!.gentrificationLevel)
        .toBeGreaterThanOrEqual(40);
      expect(result.notices.some((n) => n.includes('different crowd'))).toBe(true);
    });

    it('emits a soul-decay notice when a district first crosses the soul threshold (60)', () => {
      districts[0].gentrificationLevel = 59; // eastside about to cross 60
      const result = gentrificationSystem.applyTurnGentrification(
        new Set(['eastside']),
      );
      expect(districts.find((d) => d.id === 'eastside')!.gentrificationLevel)
        .toBeGreaterThanOrEqual(60);
      expect(result.notices.some((n) => n.includes('soul is leaving'))).toBe(true);
    });

    it('does not re-emit a threshold notice once already past it', () => {
      // eastside already well past both thresholds; should announce neither.
      districts[0].gentrificationLevel = 75;
      districts[1].gentrificationLevel = 75;
      const result = gentrificationSystem.applyTurnGentrification(new Set());
      expect(result.notices.some((n) => n.includes('different crowd'))).toBe(false);
      expect(result.notices.some((n) => n.includes('soul is leaving'))).toBe(false);
    });

    it('clamps gentrification at 100', () => {
      districts[1].gentrificationLevel = 99.9;
      gentrificationSystem.applyTurnGentrification(new Set(['downtown']));
      expect(
        districts.find((d) => d.id === 'downtown')!.gentrificationLevel,
      ).toBeLessThanOrEqual(100);
    });

    it('grows scene strength on a DIY-aligned show in the district', () => {
      districts[0].gentrificationLevel = 20; // below soul threshold, no decay
      const before = districts[0].sceneStrength; // 80
      gentrificationSystem.applyTurnGentrification(new Set(['eastside']), 50);
      expect(
        districts.find((d) => d.id === 'eastside')!.sceneStrength,
      ).toBeGreaterThan(before);
    });

    it('does not grow scene strength for a sellout (negative diyPoints)', () => {
      districts[0].gentrificationLevel = 20;
      gentrificationSystem.applyTurnGentrification(new Set(['eastside']), -50);
      expect(districts.find((d) => d.id === 'eastside')!.sceneStrength).toBe(80);
    });

    it('a DIY anchor slows the gentrification creep in its district', () => {
      districts[0].gentrificationLevel = 30;
      const baseline = { ...districts[0] };
      // no anchor
      gentrificationSystem.applyTurnGentrification(new Set(['eastside']), 0);
      const riseNoAnchor = districts[0].gentrificationLevel - 30;
      // reset and run again WITH a halving anchor
      districts[0] = { ...baseline };
      const mods = new Map([['eastside', { creepMult: 0.5, sceneFloor: 0 }]]);
      gentrificationSystem.applyTurnGentrification(new Set(['eastside']), 0, mods);
      const riseWithAnchor = districts[0].gentrificationLevel - 30;
      expect(riseWithAnchor).toBeLessThan(riseNoAnchor);
      expect(riseWithAnchor).toBeCloseTo(riseNoAnchor * 0.5, 5);
    });

    it('an anchor floors scene strength against soul decay', () => {
      districts[1].gentrificationLevel = 80; // past soul threshold → would erode
      districts[1].sceneStrength = 56;
      const mods = new Map([['downtown', { creepMult: 1, sceneFloor: 55 }]]);
      gentrificationSystem.applyTurnGentrification(new Set(), 0, mods);
      // decay would take 56 → 54.5, but the floor holds it at 55.
      expect(districts.find((d) => d.id === 'downtown')!.sceneStrength).toBe(55);
    });
  });
});

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

    it('emits a notice when a district crosses a gentrification threshold', () => {
      districts[0].gentrificationLevel = 49; // eastside about to cross 50
      const result = gentrificationSystem.applyTurnGentrification(
        new Set(['eastside']),
      );
      expect(result.notices.some((n) => n.includes('gentrifying'))).toBe(true);
    });

    it('clamps gentrification at 100', () => {
      districts[1].gentrificationLevel = 99.9;
      gentrificationSystem.applyTurnGentrification(new Set(['downtown']));
      expect(
        districts.find((d) => d.id === 'downtown')!.gentrificationLevel,
      ).toBeLessThanOrEqual(100);
    });
  });
});

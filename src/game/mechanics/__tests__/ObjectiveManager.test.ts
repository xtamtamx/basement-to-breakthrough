import { describe, it, expect } from 'vitest';
import { objectiveManager, ObjectiveTurnDelta } from '../ObjectiveManager';
import { RunObjectives } from '@game/types';

const noShows: ObjectiveTurnDelta = {
  selloutShows: 0,
  combosFired: 0,
  turnIncome: 0,
  shows: 0,
  incidents: 0,
  maxVenueCapacity: 0,
  usedDayJob: false,
  turn: 1,
};

// Build a RunObjectives seeded with specific objective ids for deterministic tests.
const withObjectives = (ids: string[]): RunObjectives => ({
  selected: ids,
  progress: ids.map((id) => ({
    id,
    current: 0,
    target: objectiveManager.getDefinition(id)!.target,
    completed: false,
  })),
  stats: objectiveManager.emptyState().stats,
});

describe('ObjectiveManager', () => {
  it('selects only mode-eligible objectives', () => {
    const ro = objectiveManager.selectForRun('hardcore', 3);
    // never_worked / sellout-only-everywhere etc. — hardcore excludes never_worked & zero_disasters.
    expect(ro.progress.length).toBeGreaterThan(0);
    ro.selected.forEach((id) => {
      const def = objectiveManager.getDefinition(id)!;
      expect(def.modes.length === 0 || def.modes.includes('hardcore')).toBe(true);
    });
  });

  it('completes a live objective once its threshold is crossed', () => {
    let ro = withObjectives(['sellout_three']);
    ro = objectiveManager.recordTurn(ro, { ...noShows, selloutShows: 2 }).updated;
    expect(ro.progress[0].completed).toBe(false);
    const res = objectiveManager.recordTurn(ro, { ...noShows, selloutShows: 1 });
    expect(res.updated.progress[0].completed).toBe(true);
    expect(res.newlyCompleted).toContain('sellout_three');
  });

  it('tracks bank_thousand as the MAX single-turn income, not a sum', () => {
    let ro = withObjectives(['bank_thousand']);
    ro = objectiveManager.recordTurn(ro, { ...noShows, turnIncome: 600 }).updated;
    ro = objectiveManager.recordTurn(ro, { ...noShows, turnIncome: 500 }).updated;
    expect(ro.progress[0].completed).toBe(false); // 600 and 500 separately, never 1000
    ro = objectiveManager.recordTurn(ro, { ...noShows, turnIncome: 1000 }).updated;
    expect(ro.progress[0].completed).toBe(true);
  });

  it('does NOT award an avoidance objective that was violated (the failure-fame bug)', () => {
    let ro = withObjectives(['never_worked']);
    // Worked a day job at some point → must NOT complete, even at run end.
    ro = objectiveManager.recordTurn(ro, { ...noShows, usedDayJob: true }).updated;
    ro = objectiveManager.finalize(ro);
    expect(ro.progress[0].completed).toBe(false);
    expect(objectiveManager.fameBonus(ro)).toBe(0);
  });

  it('awards a clean avoidance objective only at run end', () => {
    let ro = withObjectives(['never_worked']);
    ro = objectiveManager.recordTurn(ro, { ...noShows, shows: 1 }).updated;
    expect(ro.progress[0].completed).toBe(false); // not mid-run
    ro = objectiveManager.finalize(ro);
    expect(ro.progress[0].completed).toBe(true);
    expect(objectiveManager.fameBonus(ro)).toBe(150);
  });

  it('zero_disasters needs 10+ shows AND no incidents, resolved at run end', () => {
    let clean = withObjectives(['zero_disasters']);
    for (let i = 0; i < 11; i++) clean = objectiveManager.recordTurn(clean, { ...noShows, shows: 1 }).updated;
    expect(objectiveManager.finalize(clean).progress[0].completed).toBe(true);

    let marred = withObjectives(['zero_disasters']);
    for (let i = 0; i < 11; i++) marred = objectiveManager.recordTurn(marred, { ...noShows, shows: 1 }).updated;
    marred = objectiveManager.recordTurn(marred, { ...noShows, shows: 1, incidents: 1 }).updated;
    expect(objectiveManager.finalize(marred).progress[0].completed).toBe(false);
  });
});

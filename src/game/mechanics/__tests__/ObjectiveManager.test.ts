import { describe, it, expect } from 'vitest';
import { objectiveManager, ObjectiveTurnDelta } from '../ObjectiveManager';
import { OBJECTIVE_DEFINITIONS } from '@game/data/objectiveDefinitions';
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
  allAgesShows: 0,
  multiBandShows: 0,
  smallRoomShows: 0,
  maxBillSize: 0,
  gouged: false,
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

describe('objective pool variety', () => {
  const MODES = ['classic', 'speed', 'festival', 'hardcore'] as const;

  it('gives every mode more eligible objectives than it rolls', () => {
    // selectForRun rolls 3. A pool of exactly 3 hands out the SAME three every
    // run — which is what Speed and Hardcore did before this pool was widened.
    for (const mode of MODES) {
      const pool = Object.values(OBJECTIVE_DEFINITIONS).filter(
        (d) => d.modes.length === 0 || d.modes.includes(mode),
      );
      expect(pool.length, `${mode} pool must exceed the 3 it rolls`).toBeGreaterThan(3);
    }
  });

  it('actually rolls different sets for the same mode', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      seen.add([...objectiveManager.selectForRun('speed', 3).selected].sort().join('|'));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('every objective is reachable — its id is wired into currentValue', () => {
    // A def with no case in the switch sits at 0 forever and can never complete.
    const stats = { ...objectiveManager.emptyState().stats, totalShows: 99, selloutShows: 99,
      combosFired: 99, maxTurnIncome: 99999, maxVenueCapacity: 9999, smallRoomShows: 99,
      allAgesShows: 99, multiBandShows: 99, maxBillSize: 9, reachedTurn: 99 };
    for (const def of Object.values(OBJECTIVE_DEFINITIONS)) {
      const ro = { selected: [def.id], progress: [{ id: def.id, current: 0, target: def.target, completed: false }], stats };
      const { updated } = objectiveManager.recordTurn(ro, { ...noShows, turn: 99 });
      const p = updated.progress[0];
      const done = def.finalizeOnly
        ? objectiveManager.finalize(ro).progress[0].completed
        : p.completed;
      expect(done, `${def.id} never completes — is it in currentValue/finalizeComplete?`).toBe(true);
    }
  });
});

describe('the new run stats', () => {
  const showTurn = (over: Partial<ObjectiveTurnDelta>): ObjectiveTurnDelta =>
    ({ ...noShows, shows: 1, ...over });

  it('counts all-ages, small-room and multi-band shows, and tracks the deepest bill', () => {
    let ro = withObjectives(['all_ages_three', 'small_room_four', 'bills_six', 'full_bill']);
    ro = objectiveManager.recordTurn(ro, showTurn({ allAgesShows: 1, smallRoomShows: 1, multiBandShows: 1, maxBillSize: 2 })).updated;
    ro = objectiveManager.recordTurn(ro, showTurn({ allAgesShows: 1, smallRoomShows: 1, multiBandShows: 1, maxBillSize: 3 })).updated;
    expect(ro.stats.allAgesShows).toBe(2);
    expect(ro.stats.smallRoomShows).toBe(2);
    expect(ro.stats.multiBandShows).toBe(2);
    expect(ro.stats.maxBillSize).toBe(3); // max, not a sum
    expect(ro.progress.find((p) => p.id === 'full_bill')!.completed).toBe(true);
  });

  it('gouging is sticky — one pricey door loses Five Bucks At The Door for the whole run', () => {
    let clean = withObjectives(['never_gouged']);
    clean = objectiveManager.recordTurn(clean, showTurn({})).updated;
    expect(objectiveManager.finalize(clean).progress[0].completed).toBe(true);

    let greedy = withObjectives(['never_gouged']);
    greedy = objectiveManager.recordTurn(greedy, showTurn({ gouged: true })).updated;
    greedy = objectiveManager.recordTurn(greedy, showTurn({})).updated; // a fair night later cannot undo it
    expect(greedy.stats.gouged).toBe(true);
    expect(objectiveManager.finalize(greedy).progress[0].completed).toBe(false);
  });

  it('short-run incident goal needs the shows AND a clean sheet', () => {
    const five = () => {
      let ro = withObjectives(['no_incidents_five']);
      for (let i = 0; i < 5; i++) ro = objectiveManager.recordTurn(ro, showTurn({})).updated;
      return ro;
    };
    expect(objectiveManager.finalize(five()).progress[0].completed).toBe(true);

    let messy = five();
    messy = objectiveManager.recordTurn(messy, showTurn({ incidents: 1 })).updated;
    expect(objectiveManager.finalize(messy).progress[0].completed).toBe(false);
  });
});

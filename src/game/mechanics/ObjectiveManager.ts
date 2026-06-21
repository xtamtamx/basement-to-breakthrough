import {
  ObjectiveDefinition,
  ObjectiveRunStats,
  RunObjectives,
  RunMode,
} from '@game/types';
import { OBJECTIVE_DEFINITIONS } from '@game/data/objectiveDefinitions';

/** One turn's worth of objective-relevant outcomes, summed/maxed into run stats. */
export interface ObjectiveTurnDelta {
  selloutShows: number;
  combosFired: number;
  turnIncome: number;
  shows: number;
  incidents: number;
  maxVenueCapacity: number;
  usedDayJob: boolean;
  turn: number;
}

const emptyStats = (): ObjectiveRunStats => ({
  selloutShows: 0,
  combosFired: 0,
  maxTurnIncome: 0,
  totalShows: 0,
  showsWithIncident: 0,
  maxVenueCapacity: 0,
  usedDayJob: false,
  reachedTurn: 0,
});

/**
 * Stateless evaluator for the optional run-challenge layer. Holds no state of its
 * own — it reads/returns the RunObjectives snapshot the store persists. Rewards
 * are meta fame only (granted in TurnResolutionEngine.concludeRun).
 */
class ObjectiveManager {
  emptyState(): RunObjectives {
    return { selected: [], progress: [], stats: emptyStats() };
  }

  /** Pick a few mode-eligible objectives at run start. */
  selectForRun(mode: RunMode, count = 3): RunObjectives {
    const pool = Object.values(OBJECTIVE_DEFINITIONS).filter(
      (d) => d.modes.length === 0 || d.modes.includes(mode),
    );
    const chosen = this.shuffle(pool).slice(0, Math.min(count, pool.length));
    return {
      selected: chosen.map((d) => d.id),
      progress: chosen.map((d) => ({ id: d.id, current: 0, target: d.target, completed: false })),
      stats: emptyStats(),
    };
  }

  /** Fold a turn's outcomes into the run stats and re-evaluate live objectives. */
  recordTurn(
    ro: RunObjectives | undefined,
    d: ObjectiveTurnDelta,
  ): { updated: RunObjectives; newlyCompleted: string[] } {
    const base = ro ?? this.emptyState();
    const stats: ObjectiveRunStats = {
      selloutShows: base.stats.selloutShows + d.selloutShows,
      combosFired: base.stats.combosFired + d.combosFired,
      maxTurnIncome: Math.max(base.stats.maxTurnIncome, d.turnIncome),
      totalShows: base.stats.totalShows + d.shows,
      showsWithIncident: base.stats.showsWithIncident + d.incidents,
      maxVenueCapacity: Math.max(base.stats.maxVenueCapacity, d.maxVenueCapacity),
      usedDayJob: base.stats.usedDayJob || d.usedDayJob,
      reachedTurn: Math.max(base.stats.reachedTurn, d.turn),
    };
    return this.evaluate({ ...base, stats }, false);
  }

  /** Resolve avoidance objectives ("never…", "zero…") at run end. */
  finalize(ro: RunObjectives | undefined): RunObjectives {
    return this.evaluate(ro ?? this.emptyState(), true).updated;
  }

  private evaluate(
    ro: RunObjectives,
    atRunEnd: boolean,
  ): { updated: RunObjectives; newlyCompleted: string[] } {
    const newlyCompleted: string[] = [];
    const progress = ro.progress.map((p) => {
      const def = OBJECTIVE_DEFINITIONS[p.id];
      if (!def || p.completed) {
        return { ...p, current: def ? this.currentValue(p.id, ro.stats) : p.current };
      }
      const current = this.currentValue(p.id, ro.stats);
      const completed = def.finalizeOnly
        ? atRunEnd && this.finalizeComplete(p.id, ro.stats)
        : current >= def.target;
      if (completed) newlyCompleted.push(p.id);
      return { ...p, current, completed };
    });
    return { updated: { ...ro, progress }, newlyCompleted };
  }

  private currentValue(id: string, s: ObjectiveRunStats): number {
    switch (id) {
      case 'bank_thousand':
        return s.maxTurnIncome;
      case 'sellout_three':
        return s.selloutShows;
      case 'eight_combos':
        return s.combosFired;
      case 'theater_tier':
        return s.maxVenueCapacity;
      case 'workhorse':
        return s.totalShows;
      case 'never_worked':
        return s.usedDayJob ? 0 : 1;
      case 'zero_disasters':
        return s.totalShows;
      default:
        return 0;
    }
  }

  /** Avoidance objectives can only be confirmed once the run is over. */
  private finalizeComplete(id: string, s: ObjectiveRunStats): boolean {
    switch (id) {
      case 'never_worked':
        return !s.usedDayJob;
      case 'zero_disasters':
        return s.totalShows >= 10 && s.showsWithIncident === 0;
      default:
        return false;
    }
  }

  /** Total meta fame earned from completed objectives this run. */
  fameBonus(ro: RunObjectives | undefined): number {
    if (!ro) return 0;
    return ro.progress
      .filter((p) => p.completed)
      .reduce((sum, p) => sum + (OBJECTIVE_DEFINITIONS[p.id]?.fameReward ?? 0), 0);
  }

  getDefinition(id: string): ObjectiveDefinition | undefined {
    return OBJECTIVE_DEFINITIONS[id];
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

export const objectiveManager = new ObjectiveManager();

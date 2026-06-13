/**
 * runLifecycle - THE single way a run starts.
 *
 * App's main menu and the run-end "Play Again" button both go through
 * startNewRun so every run gets the same treatment: full state reset,
 * run-config starting resources, and meta-progression bonuses. (Before this
 * existed, "Try Again" silently restarted with the bare store defaults.)
 */

import { useGameStore } from '@stores/gameStore';
import { runManager, RunState } from './RunManager';
import { metaProgressionManager } from './MetaProgressionManager';
import { turnResolutionEngine } from './TurnResolutionEngine';
import { dayJobSystem } from './DayJobSystem';

let lastConfigId = 'classic';

export interface RunStartInfo {
  run: RunState;
  bonuses: {
    startingMoney: number;
    startingReputation: number;
  };
}

export async function startNewRun(
  configId: string = lastConfigId,
): Promise<RunStartInfo> {
  lastConfigId = configId;

  // Wipe any previous run so a finished (GAME_OVER) run can't bleed through
  useGameStore.getState().resetGame();
  turnResolutionEngine.reset();

  const run = runManager.startRun(configId);
  const bonuses = metaProgressionManager.getRunStartBonuses();

  // Set starting resources: run config + earned meta bonuses
  const store = useGameStore.getState();
  store.addMoney(
    -store.money + run.config.startingMoney + bonuses.startingMoney,
  );
  store.addReputation(
    -store.reputation +
      run.config.startingReputation +
      bonuses.startingReputation,
  );
  store.addConnections(-store.connections + run.config.startingConnections);

  await store.loadInitialGameData();
  dayJobSystem.refreshJobs();

  // Some modes (Hardcore) start with weaker bands. Apply once to the roster.
  const bandQuality = runManager.getStartingBandQualityModifier();
  if (bandQuality !== 0) {
    const fresh = useGameStore.getState();
    fresh.allBands.forEach((band) => {
      fresh.updateBand(band.id, {
        popularity: Math.max(1, band.popularity + bandQuality),
        technicalSkill: Math.max(1, band.technicalSkill + bandQuality),
      });
    });
  }

  return {
    run,
    bonuses: {
      startingMoney: bonuses.startingMoney,
      startingReputation: bonuses.startingReputation,
    },
  };
}

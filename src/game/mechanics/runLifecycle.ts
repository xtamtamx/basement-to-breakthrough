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
import { synergyManager, STARTER_SYNERGIES } from './SynergyManager';
import { captureRuntimeSnapshot } from '@game/persistence/runtimeSnapshot';
import { cityRosterSlotBonus } from '@game/world/cityUnlocks';
import { BASE_ROSTER_SLOTS, ROSTER_SLOT_FLOOR } from '@game/constants/runConstants';

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
  // Seed the venue-ladder high-water mark so a mode that starts with rep
  // already past a tier (e.g. Festival) opens those venues from turn 1.
  useGameStore.setState({ peakReputation: useGameStore.getState().reputation });
  store.addConnections(-store.connections + run.config.startingConnections);

  await store.loadInitialGameData();
  dayJobSystem.refreshJobs();

  // Roster slot cap (Balatro-joker style) = base + this mode's delta
  // (Hardcore −1, Festival +1) + permanent Scene Expansion meta upgrade +
  // city-unlock bonuses. Floored at the per-show bill cap so you can always
  // field a full lineup.
  const rosterSlotSources = {
    base: BASE_ROSTER_SLOTS,
    mode: runManager.getRosterSlotDelta(),
    meta: bonuses.rosterSlotBonus,
    city: cityRosterSlotBonus(),
  };
  const maxRosterSize = Math.max(
    ROSTER_SLOT_FLOOR,
    rosterSlotSources.base + rosterSlotSources.mode + rosterSlotSources.meta + rosterSlotSources.city,
  );
  useGameStore.setState({ maxRosterSize, rosterSlotSources });

  // Starting band quality: a flat run-modifier shift (Hardcore −10) plus the
  // meta Talent Scout multiplier (+10%/level). Apply once to the roster.
  const bandQualityShift = runManager.getStartingBandQualityModifier();
  const bandQualityMult = bonuses.bandQualityMultiplier;
  if (bandQualityShift !== 0 || bandQualityMult !== 1) {
    const fresh = useGameStore.getState();
    const adjust = (stat: number) =>
      Math.max(1, Math.round((stat + bandQualityShift) * bandQualityMult));
    fresh.allBands.forEach((band) => {
      fresh.updateBand(band.id, {
        popularity: adjust(band.popularity),
        technicalSkill: adjust(band.technicalSkill),
      });
    });
  }

  // Grant a starter equipped synergy ("joker") so the Balatro loop is live from
  // turn 1. synergyManager was just cleared by turnResolutionEngine.reset(); a
  // deterministic gentle COMMON (DIY Hustle, +$10/turn) keeps onboarding stable.
  synergyManager.acquireSynergy(STARTER_SYNERGIES[0], 1);
  // Snapshot NOW so a refresh before the first turn keeps the starter (snapshots
  // are otherwise only captured at end-of-turn / on booking).
  useGameStore.setState({ runtimeSnapshot: captureRuntimeSnapshot() });

  return {
    run,
    bonuses: {
      startingMoney: bonuses.startingMoney,
      startingReputation: bonuses.startingReputation,
    },
  };
}

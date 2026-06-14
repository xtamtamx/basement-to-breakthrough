/**
 * runtimeSnapshot - durable resume for in-memory singleton state.
 *
 * The Zustand store persists (zustand `persist` + SaveGameManager), but the
 * run's live mechanics live in module singletons that reset to empty on any
 * page refresh or save-load: the active run (RunManager), the scheduled-show
 * Map (ShowPromotionSystem), the one-turn raid/drama blocks (DifficultySystem),
 * and equipped synergies (SynergyManager). Without restoring them a resumed run
 * loses its win conditions + fame payout, strands booked shows, and desyncs
 * loss state. (consecutiveBrokeTurns is a plain store field, so it persists on
 * its own and is not part of this snapshot.)
 *
 * A RuntimeSnapshot is stored in the Zustand store (so it rides both
 * persistence layers automatically), captured at end-of-turn and on booking,
 * and restored on rehydrate (page refresh) and loadGame (save slot).
 */

import { runManager, RunState } from '../mechanics/RunManager';
import {
  showPromotionSystem,
  SerializedScheduledShow,
} from '../mechanics/ShowPromotionSystem';
import { difficultySystem } from '../mechanics/DifficultySystem';
import { synergyManager, SynergyState } from '../mechanics/SynergyManager';

export interface RuntimeSnapshot {
  run: RunState | null;
  scheduledShows: SerializedScheduledShow[];
  difficultyBlocks: { raided: string[]; unavailable: string[] };
  synergy: SynergyState;
}

export function captureRuntimeSnapshot(): RuntimeSnapshot {
  return {
    run: runManager.serializeRun(),
    scheduledShows: showPromotionSystem.serialize(),
    difficultyBlocks: difficultySystem.serializeBlocks(),
    synergy: synergyManager.serialize(),
  };
}

export function restoreRuntimeSnapshot(snap?: RuntimeSnapshot | null): void {
  if (!snap) return;
  runManager.restoreRun(snap.run);
  showPromotionSystem.restore(snap.scheduledShows);
  difficultySystem.restoreBlocks(snap.difficultyBlocks);
  if (snap.synergy) synergyManager.deserialize(snap.synergy);
}

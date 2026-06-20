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

import { useGameStore } from '@stores/gameStore';
import { runManager, RunState } from '../mechanics/RunManager';
import {
  showPromotionSystem,
  SerializedScheduledShow,
} from '../mechanics/ShowPromotionSystem';
import { difficultySystem } from '../mechanics/DifficultySystem';
import { synergyManager, SynergyState } from '../mechanics/SynergyManager';
import { progressionPathSystem } from '../mechanics/ProgressionPathSystem';

export interface RuntimeSnapshot {
  run: RunState | null;
  scheduledShows: SerializedScheduledShow[];
  difficultyBlocks: { raided: string[]; unavailable: string[] };
  synergy: SynergyState;
  /** Chosen progression path (run-scoped singleton state). Optional for old saves. */
  progression?: string;
}

export function captureRuntimeSnapshot(): RuntimeSnapshot {
  return {
    run: runManager.serializeRun(),
    scheduledShows: showPromotionSystem.serialize(),
    difficultyBlocks: difficultySystem.serializeBlocks(),
    synergy: synergyManager.serialize(),
    progression: progressionPathSystem.serialize(),
  };
}

export function restoreRuntimeSnapshot(snap?: RuntimeSnapshot | null): void {
  if (!snap) return;
  runManager.restoreRun(snap.run);

  // Idempotency guard: a refresh mid-turn can leave the persisted snapshot
  // describing a show the store already resolved (completeShow removed it from
  // scheduledShows + recorded it in showHistory before the snapshot was
  // recaptured). Drop any already-completed show so it can't be re-injected
  // into the live Map and fire — and pay out — a second time.
  const completedIds = new Set(
    useGameStore.getState().showHistory.map((s) => s.id),
  );
  const liveShows = (snap.scheduledShows ?? []).filter(
    (s) => !completedIds.has(s.id),
  );
  showPromotionSystem.restore(liveShows);

  difficultySystem.restoreBlocks(snap.difficultyBlocks);
  if (snap.synergy) synergyManager.deserialize(snap.synergy);
  if (snap.progression) progressionPathSystem.deserialize(snap.progression);
}

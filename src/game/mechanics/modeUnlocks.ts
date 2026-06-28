/**
 * modeUnlocks — game modes unlock as a PROGRESSION CHAIN.
 *
 * "Classic" is always open; each other mode unlocks once you've WON the previous
 * one in the ladder (at any stake). Derived purely from StakesManager's persisted
 * per-mode win record (getUnlockedTier(mode) >= 1 ⇒ that mode has been beaten), so
 * there's no extra state to store and past wins count retroactively.
 */
import { stakesManager } from './StakesManager';
import { TOURING_ENABLED } from '@/config/featureFlags';

export const MODE_ORDER = ['classic', 'speed', 'festival', 'hardcore'] as const;
export type ModeId = (typeof MODE_ORDER)[number];

// Hardcore's brutal economy is balanced around multi-city travel; the single-city
// demo caps the ladder at Festival. Re-enabling touring restores Hardcore.
export const ACTIVE_MODES: readonly ModeId[] = TOURING_ENABLED
  ? MODE_ORDER
  : MODE_ORDER.filter((m) => m !== 'hardcore');

const idx = (modeId: string) => ACTIVE_MODES.indexOf(modeId as ModeId);

/** A mode counts as "beaten" once it's been won at least once (any stake). */
export const isModeBeaten = (modeId: string): boolean =>
  stakesManager.getUnlockedTier(modeId) >= 1;

/** Is this mode unlocked? Classic (and any non-ladder mode) is always open. */
export const isModeUnlocked = (modeId: string): boolean => {
  const i = idx(modeId);
  if (i <= 0) return true;
  return isModeBeaten(ACTIVE_MODES[i - 1]);
};

/** The mode id you must WIN to unlock this one, or null if always open. */
export const modeUnlockRequiresId = (modeId: string): string | null => {
  const i = idx(modeId);
  return i <= 0 ? null : ACTIVE_MODES[i - 1];
};

/** The next mode that beating `modeId` opens, or null if it's last/unknown. */
export const nextModeAfter = (modeId: string): string | null => {
  const i = idx(modeId);
  return i >= 0 && i < ACTIVE_MODES.length - 1 ? ACTIVE_MODES[i + 1] : null;
};

/** Sort index for laying the selector out in progression order (unknown last). */
export const modeOrderIndex = (modeId: string): number => {
  const i = idx(modeId);
  return i < 0 ? 99 : i;
};

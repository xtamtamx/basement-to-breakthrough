import { describe, it, expect } from 'vitest';
import { stakesManager } from '../StakesManager';
import {
  isModeUnlocked,
  modeUnlockRequiresId,
  nextModeAfter,
  modeOrderIndex,
  MODE_ORDER,
  ACTIVE_MODES,
} from '../modeUnlocks';

// NOTE: asserts the SHIPPED config (TOURING_ENABLED=false → single-city demo),
// where the active ladder caps at Festival. The full 4-mode ladder (incl. Hardcore)
// returns when touring is re-enabled.
describe('modeUnlocks — game-mode progression chain', () => {
  it('exposes the ladder relationships (pure, no state)', () => {
    expect([...MODE_ORDER]).toEqual(['classic', 'speed', 'festival', 'hardcore']);
    expect([...ACTIVE_MODES]).toEqual(['classic', 'speed', 'festival']); // demo: Hardcore held
    // classic is always open; every other ACTIVE mode requires the previous one
    expect(isModeUnlocked('classic')).toBe(true);
    expect(modeUnlockRequiresId('classic')).toBeNull();
    expect(modeUnlockRequiresId('speed')).toBe('classic');
    expect(modeUnlockRequiresId('festival')).toBe('speed');
    // beating a mode opens the next ACTIVE one (Festival is last → nothing)
    expect(nextModeAfter('classic')).toBe('speed');
    expect(nextModeAfter('speed')).toBe('festival');
    expect(nextModeAfter('festival')).toBeNull();
    // selector lays them out in progression order
    expect(modeOrderIndex('classic')).toBeLessThan(modeOrderIndex('speed'));
    expect(modeOrderIndex('speed')).toBeLessThan(modeOrderIndex('festival'));
  });

  it('unlocks each ACTIVE mode only after beating the previous one', () => {
    // fresh module (vitest isolates per file) → no wins recorded yet
    expect(isModeUnlocked('speed')).toBe(false);
    expect(isModeUnlocked('festival')).toBe(false);

    stakesManager.recordWin('classic', 0); // beat Classic
    expect(isModeUnlocked('speed')).toBe(true);
    expect(isModeUnlocked('festival')).toBe(false);

    stakesManager.recordWin('speed', 0); // beat Speed
    expect(isModeUnlocked('festival')).toBe(true);
  });
});

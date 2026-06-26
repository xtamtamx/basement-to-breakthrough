import { describe, it, expect } from 'vitest';
import { stakesManager } from '../StakesManager';
import {
  isModeUnlocked,
  modeUnlockRequiresId,
  nextModeAfter,
  modeOrderIndex,
  MODE_ORDER,
} from '../modeUnlocks';

describe('modeUnlocks — game-mode progression chain', () => {
  it('exposes the ladder relationships (pure, no state)', () => {
    expect([...MODE_ORDER]).toEqual(['classic', 'speed', 'festival', 'hardcore']);
    // classic is always open; every other mode requires the previous one
    expect(isModeUnlocked('classic')).toBe(true);
    expect(modeUnlockRequiresId('classic')).toBeNull();
    expect(modeUnlockRequiresId('speed')).toBe('classic');
    expect(modeUnlockRequiresId('festival')).toBe('speed');
    expect(modeUnlockRequiresId('hardcore')).toBe('festival');
    // beating a mode opens the next one (last opens nothing)
    expect(nextModeAfter('classic')).toBe('speed');
    expect(nextModeAfter('festival')).toBe('hardcore');
    expect(nextModeAfter('hardcore')).toBeNull();
    // selector lays them out in progression order
    expect(modeOrderIndex('classic')).toBeLessThan(modeOrderIndex('speed'));
    expect(modeOrderIndex('speed')).toBeLessThan(modeOrderIndex('hardcore'));
  });

  it('unlocks each mode only after beating the previous one', () => {
    // fresh module (vitest isolates per file) → no wins recorded yet
    expect(isModeUnlocked('speed')).toBe(false);
    expect(isModeUnlocked('festival')).toBe(false);
    expect(isModeUnlocked('hardcore')).toBe(false);

    stakesManager.recordWin('classic', 0); // beat Classic
    expect(isModeUnlocked('speed')).toBe(true);
    expect(isModeUnlocked('festival')).toBe(false);

    stakesManager.recordWin('speed', 0); // beat Speed
    expect(isModeUnlocked('festival')).toBe(true);
    expect(isModeUnlocked('hardcore')).toBe(false);

    stakesManager.recordWin('festival', 0); // beat Festival
    expect(isModeUnlocked('hardcore')).toBe(true);
  });
});

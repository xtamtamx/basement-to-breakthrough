import { describe, it, expect } from 'vitest';
import { stakesManager, STAKE_TIERS } from '../StakesManager';

let seq = 0;
const freshMode = () => `test-mode-${Date.now()}-${seq++}`;

describe('StakesManager', () => {
  it('base tier (Open Mic) applies no modifiers', () => {
    const t0 = stakesManager.getTier(0);
    expect(t0.tier).toBe(0);
    expect(t0.rentMult).toBe(1);
    expect(t0.gainMult).toBe(1);
    expect(t0.stressMult).toBe(1);
    expect(t0.incidentMult).toBe(1);
    expect(t0.turnMult).toBe(1);
  });

  it('clamps tier lookups to the valid range', () => {
    expect(stakesManager.getTier(-5).tier).toBe(0);
    expect(stakesManager.getTier(999).tier).toBe(STAKE_TIERS.length - 1);
  });

  it('only the base tier is unlocked for a fresh mode', () => {
    const mode = freshMode();
    expect(stakesManager.isUnlocked(mode, 0)).toBe(true);
    expect(stakesManager.isUnlocked(mode, 1)).toBe(false);
  });

  it('a win unlocks exactly the next tier (no skipping), and the top is terminal', () => {
    const mode = freshMode();
    const top = STAKE_TIERS.length - 1;

    expect(stakesManager.recordWin(mode, 0)).toBe(1); // win T0 → unlock T1
    expect(stakesManager.isUnlocked(mode, 1)).toBe(true);
    expect(stakesManager.isUnlocked(mode, 2)).toBe(false); // didn't skip to T2

    expect(stakesManager.recordWin(mode, 0)).toBeNull(); // re-winning T0 unlocks nothing new
    expect(stakesManager.recordWin(mode, 1)).toBe(2); // win T1 → unlock T2

    // Walk to the top, then confirm winning the top tier unlocks nothing.
    for (let t = 2; t < top; t++) stakesManager.recordWin(mode, t);
    expect(stakesManager.isUnlocked(mode, top)).toBe(true);
    expect(stakesManager.recordWin(mode, top)).toBeNull();
  });

  it('escalating tiers are monotonically harder', () => {
    for (let i = 1; i < STAKE_TIERS.length; i++) {
      const prev = STAKE_TIERS[i - 1];
      const cur = STAKE_TIERS[i];
      expect(cur.rentMult).toBeGreaterThanOrEqual(prev.rentMult);
      expect(cur.gainMult).toBeLessThanOrEqual(prev.gainMult);
      expect(cur.incidentMult).toBeGreaterThanOrEqual(prev.incidentMult);
      expect(cur.turnMult).toBeLessThanOrEqual(prev.turnMult);
    }
  });

  it('select/getSelectedTier round-trips and clamps', () => {
    stakesManager.select(2);
    expect(stakesManager.getSelected()).toBe(2);
    expect(stakesManager.getSelectedTier().tier).toBe(2);
    stakesManager.select(99);
    expect(stakesManager.getSelected()).toBe(STAKE_TIERS.length - 1);
    stakesManager.select(0); // reset for other suites
  });
});

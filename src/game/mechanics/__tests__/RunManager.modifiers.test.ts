import { describe, it, expect, beforeEach } from 'vitest';
import { runManager } from '../RunManager';

// The run configs ship with modifiers (Speed = Fast Scene, Hardcore = Brutal
// Scene). These tests lock in that the engine-facing merge reflects them, so
// modes actually play differently rather than being a starting-resource reskin.
describe('RunManager run modifiers', () => {
  beforeEach(() => {
    // Ensure no run is active between cases
    runManager.abandonRun();
  });

  it('returns neutral multipliers with no active run', () => {
    const mods = runManager.getRunModifiers();
    expect(mods).toEqual({
      moneyMultiplier: 1,
      reputationMultiplier: 1,
      stressMultiplier: 1,
      venueRentMultiplier: 1,
    });
    expect(runManager.getStartingBandQualityModifier()).toBe(0);
  });

  it('Classic run has no modifiers (plays straight)', () => {
    runManager.startRun('classic');
    expect(runManager.getRunModifiers()).toEqual({
      moneyMultiplier: 1,
      reputationMultiplier: 1,
      stressMultiplier: 1,
      venueRentMultiplier: 1,
    });
    expect(runManager.getStartingBandQualityModifier()).toBe(0);
  });

  it('Speed run boosts reputation and stress (Fast Scene)', () => {
    runManager.startRun('speed');
    const mods = runManager.getRunModifiers();
    expect(mods.reputationMultiplier).toBe(1.5);
    expect(mods.stressMultiplier).toBe(1.5);
    expect(mods.moneyMultiplier).toBe(1);
  });

  it('Hardcore run raises rent, cuts money, weakens bands (Brutal Scene)', () => {
    runManager.startRun('hardcore');
    const mods = runManager.getRunModifiers();
    expect(mods.venueRentMultiplier).toBe(1.5);
    expect(mods.moneyMultiplier).toBe(0.8);
    expect(runManager.getStartingBandQualityModifier()).toBe(-10);
  });
});

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

  const NEUTRAL = {
    moneyMultiplier: 1,
    reputationMultiplier: 1,
    fansMultiplier: 1,
    stressMultiplier: 1,
    venueRentMultiplier: 1,
  };

  it('returns neutral multipliers with no active run', () => {
    expect(runManager.getRunModifiers()).toEqual(NEUTRAL);
    expect(runManager.getStartingBandQualityModifier()).toBe(0);
    expect(runManager.getRosterSlotDelta()).toBe(0);
  });

  it('Classic run has no modifiers (plays straight)', () => {
    runManager.startRun('classic');
    expect(runManager.getRunModifiers()).toEqual(NEUTRAL);
    expect(runManager.getStartingBandQualityModifier()).toBe(0);
    expect(runManager.getRosterSlotDelta()).toBe(0);
  });

  it('Hardcore tightens roster slots (−1), Festival loosens them (+1)', () => {
    runManager.startRun('hardcore');
    expect(runManager.getRosterSlotDelta()).toBe(-1);
    runManager.startRun('festival');
    expect(runManager.getRosterSlotDelta()).toBe(1);
    runManager.startRun('speed');
    expect(runManager.getRosterSlotDelta()).toBe(0);
  });

  it('Speed run boosts reputation and stress (Fast Scene)', () => {
    runManager.startRun('speed');
    const mods = runManager.getRunModifiers();
    expect(mods.reputationMultiplier).toBe(1.5);
    expect(mods.stressMultiplier).toBe(1.5);
    expect(mods.moneyMultiplier).toBe(1);
  });

  it('Hardcore run raises rent and weakens bands (Brutal Scene)', () => {
    runManager.startRun('hardcore');
    const mods = runManager.getRunModifiers();
    expect(mods.venueRentMultiplier).toBe(1.05);
    expect(runManager.getStartingBandQualityModifier()).toBe(-3);
  });

  it('Festival run boosts crowd size (Bill Specialist)', () => {
    runManager.startRun('festival');
    expect(runManager.getRunModifiers().fansMultiplier).toBe(1.6);
  });
});

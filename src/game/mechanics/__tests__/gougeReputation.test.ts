import { describe, it, expect } from 'vitest';
import {
  difficultySystem,
  gougeReputationMultiplier,
  FAIR_DOOR_PRICE,
} from '../DifficultySystem';

// Gouging the door costs cred. The point of this rule is to kill a DEAD ZONE: the
// attendance price-penalty floors at 0.5 (around $20-30), so above it a higher
// price shrank the crowd no further while revenue kept scaling — more was always
// free money. The rep penalty deliberately has no floor of its own so it keeps
// biting past the point where the crowd penalty stops.
describe('gougeReputationMultiplier', () => {
  it('is free at or under the fair door price', () => {
    expect(gougeReputationMultiplier(0)).toBe(1);
    expect(gougeReputationMultiplier(5)).toBe(1);
    expect(gougeReputationMultiplier(FAIR_DOOR_PRICE)).toBe(1);
  });

  it('bites harder the more you gouge, and never rewards a higher price', () => {
    const prices = [15, 20, 25, 30, 40, 50];
    const mults = prices.map(gougeReputationMultiplier);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeLessThan(mults[i - 1]);
    }
    expect(mults[0]).toBe(1);
    expect(mults[mults.length - 1]).toBeCloseTo(0.25, 5); // clamped at the bottom
  });

  it('keeps separating prices ABOVE the attendance-penalty floor (the dead zone)', () => {
    // The crowd penalty is identical at $30 and $50 (both floored at 0.5)...
    const att30 = difficultySystem.getShowDifficultyModifiers(0, 30).attendanceMultiplier;
    const att50 = difficultySystem.getShowDifficultyModifiers(0, 50).attendanceMultiplier;
    expect(att50).toBeCloseTo(att30, 5);
    // ...so without this rule those prices were indistinguishable except for cash.
    expect(gougeReputationMultiplier(50)).toBeLessThan(gougeReputationMultiplier(30));
  });

  it('treats a missing or garbage price as fair rather than NaN-ing out the rep', () => {
    // Regression: an undefined ticketPrice made `price - FAIR` NaN, which silently
    // zeroed the show's ENTIRE reputation gain (caught by the resolver's own suite).
    for (const bad of [undefined, null, NaN, Infinity, 'abc']) {
      expect(gougeReputationMultiplier(bad as unknown as number)).toBe(1);
    }
  });

  it('leaves the balance-sim price ($12) completely untouched', () => {
    // The sim books at $12, so the tuned win rates are unaffected by this rule —
    // it only changes runs where the player chooses to gouge.
    expect(gougeReputationMultiplier(12)).toBe(1);
  });

  it('costs a meaningful slice of rep at festival scale', () => {
    // A floored-crowd festival night (~225 in) earns ⌊225/11⌋ = 20 base rep.
    const base = Math.floor(225 / 11);
    expect(Math.floor(base * gougeReputationMultiplier(30))).toBe(12);
    expect(Math.floor(base * gougeReputationMultiplier(50))).toBe(5);
  });
});

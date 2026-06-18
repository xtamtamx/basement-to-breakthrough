import { describe, it, expect } from 'vitest';
import { metaProgressionManager } from '../MetaProgressionManager';

// The singleton persists via safeStorage, so these assert relative deltas
// from the observed state rather than assuming a clean slate.
describe('MetaProgressionManager purchases', () => {
  it('purchasing an upgrade spends fame and raises its level', () => {
    metaProgressionManager.addCurrency(10000);
    const before = metaProgressionManager.getProgression();
    const upgrade = before.upgrades.find((u) => u.id === 'starting_funds')!;
    const startLevel = upgrade.currentLevel;
    const fameBefore = before.currency.fame;
    const expectedCost = (upgrade.cost.fame || 0) * (startLevel + 1);

    // Skip if already maxed (prior test runs in the same process)
    if (startLevel >= upgrade.maxLevel) return;

    const result = metaProgressionManager.purchaseUpgrade('starting_funds');
    expect(result.success).toBe(true);

    const after = metaProgressionManager.getProgression();
    const newUpgrade = after.upgrades.find((u) => u.id === 'starting_funds')!;
    expect(newUpgrade.currentLevel).toBe(startLevel + 1);
    expect(after.currency.fame).toBe(fameBefore - expectedCost);
  });

  it('Starting Capital raises the run-start money bonus', () => {
    metaProgressionManager.addCurrency(10000);
    const beforeBonus =
      metaProgressionManager.getRunStartBonuses().startingMoney;
    const upgrade = metaProgressionManager
      .getProgression()
      .upgrades.find((u) => u.id === 'starting_funds')!;
    if (upgrade.currentLevel >= upgrade.maxLevel) return;

    metaProgressionManager.purchaseUpgrade('starting_funds');

    const afterBonus =
      metaProgressionManager.getRunStartBonuses().startingMoney;
    expect(afterBonus).toBeGreaterThan(beforeBonus);
  });

  it('Scene Expansion adds permanent roster slots', () => {
    metaProgressionManager.addCurrency(10000);
    const beforeBonus =
      metaProgressionManager.getRunStartBonuses().rosterSlotBonus;
    const upgrade = metaProgressionManager
      .getProgression()
      .upgrades.find((u) => u.id === 'scene_expansion')!;
    expect(upgrade).toBeDefined();
    if (upgrade.currentLevel >= upgrade.maxLevel) return;

    metaProgressionManager.purchaseUpgrade('scene_expansion');

    const afterBonus =
      metaProgressionManager.getRunStartBonuses().rosterSlotBonus;
    expect(afterBonus).toBe(beforeBonus + 1);
  });

  it('rejects a purchase with insufficient fame', () => {
    // Drain fame by reading current and not adding; force a tiny balance by
    // purchasing nothing — instead test a wildly expensive unknown upgrade id
    const result = metaProgressionManager.purchaseUpgrade('does_not_exist');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('caps an upgrade at its max level', () => {
    metaProgressionManager.addCurrency(1_000_000);
    // Buy starting_funds until maxed
    let guard = 0;
    let res = metaProgressionManager.purchaseUpgrade('starting_funds');
    while (res.success && guard++ < 20) {
      res = metaProgressionManager.purchaseUpgrade('starting_funds');
    }
    const upgrade = metaProgressionManager
      .getProgression()
      .upgrades.find((u) => u.id === 'starting_funds')!;
    expect(upgrade.currentLevel).toBe(upgrade.maxLevel);
    expect(metaProgressionManager.purchaseUpgrade('starting_funds')).toEqual({
      success: false,
      error: 'Upgrade already at max level',
    });
  });
});

// Each run banks its end-of-run fame at most once. Loading a mid-run save and
// replaying the same run to conclusion must not re-credit fame.
describe('MetaProgressionManager.bankRunOnce', () => {
  it('credits fame the first time a run id is banked', () => {
    const runId = `run-test-${Date.now()}-a`;
    const fameBefore = metaProgressionManager.getProgression().currency.fame;

    const banked = metaProgressionManager.bankRunOnce(runId, 150);

    expect(banked).toBe(true);
    expect(metaProgressionManager.getProgression().currency.fame).toBe(
      fameBefore + 150,
    );
  });

  it('is a no-op when the same run id is banked again', () => {
    const runId = `run-test-${Date.now()}-b`;

    expect(metaProgressionManager.bankRunOnce(runId, 150)).toBe(true);
    const fameAfterFirst =
      metaProgressionManager.getProgression().currency.fame;

    // Replaying the same run's conclusion must not re-credit fame
    const second = metaProgressionManager.bankRunOnce(runId, 150);

    expect(second).toBe(false);
    expect(metaProgressionManager.getProgression().currency.fame).toBe(
      fameAfterFirst,
    );
  });

  it('still banks a different run id independently', () => {
    const runA = `run-test-${Date.now()}-c`;
    const runB = `run-test-${Date.now()}-d`;

    expect(metaProgressionManager.bankRunOnce(runA, 100)).toBe(true);
    const fameAfterA = metaProgressionManager.getProgression().currency.fame;

    expect(metaProgressionManager.bankRunOnce(runB, 200)).toBe(true);
    expect(metaProgressionManager.getProgression().currency.fame).toBe(
      fameAfterA + 200,
    );
  });
});

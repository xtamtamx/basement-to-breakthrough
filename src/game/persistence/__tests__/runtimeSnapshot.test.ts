import { describe, it, expect, beforeEach } from 'vitest';
import {
  captureRuntimeSnapshot,
  restoreRuntimeSnapshot,
} from '../runtimeSnapshot';
import { runManager } from '@game/mechanics/RunManager';
import {
  showPromotionSystem,
  SerializedScheduledShow,
} from '@game/mechanics/ShowPromotionSystem';
import { difficultySystem } from '@game/mechanics/DifficultySystem';
import { synergyManager } from '@game/mechanics/SynergyManager';
import { PromotionType } from '@game/mechanics/ShowPromotionSystem';

// The whole point of durable resume: capture -> JSON round-trip (as the
// persistence layer does) -> restore must rebuild the in-memory singletons,
// including the nested Map (promotionInvestment) and Set (raid blocks).
describe('runtimeSnapshot round-trip', () => {
  beforeEach(() => {
    showPromotionSystem.reset();
    difficultySystem.resetBlocks();
    synergyManager.reset();
    runManager.abandonRun();
  });

  const seedShow = (): SerializedScheduledShow => ({
    id: 'show-rt-1',
    bandId: 'b1',
    venueId: 'v1',
    date: new Date(),
    ticketPrice: 15,
    status: 'SCHEDULED',
    lineup: ['b1', 'b2'],
    turnsUntilShow: 2,
    promotionInvestment: [[PromotionType.FLYERS, 3]],
    totalPromotionEffectiveness: 1.2,
    expectedAttendance: 40,
    hype: 25,
  });

  it('rebuilds scheduled shows (incl. the promotionInvestment Map) through a JSON round-trip', () => {
    showPromotionSystem.restore([seedShow()]);
    difficultySystem.restoreBlocks({ raided: ['v1'], unavailable: ['b9'] });

    // Capture -> serialize -> deserialize (what persistence does) -> restore
    const snap = captureRuntimeSnapshot();
    const roundTripped = JSON.parse(JSON.stringify(snap));

    // wipe, then restore from the round-tripped blob
    showPromotionSystem.reset();
    difficultySystem.resetBlocks();
    restoreRuntimeSnapshot(roundTripped);

    const shows = showPromotionSystem.getScheduledShows();
    expect(shows).toHaveLength(1);
    expect(shows[0].id).toBe('show-rt-1');
    expect(shows[0].turnsUntilShow).toBe(2);
    expect(shows[0].hype).toBe(25);
    // the nested Map must be a real Map again, not an array
    expect(shows[0].promotionInvestment instanceof Map).toBe(true);
    expect(shows[0].promotionInvestment.get(PromotionType.FLYERS)).toBe(3);

    // difficulty blocks (Sets) restored
    expect(difficultySystem.isVenueRaided('v1')).toBe(true);
    expect(difficultySystem.isBandUnavailable('b9')).toBe(true);
  });

  it('restores the active run so win conditions and fame survive a load', () => {
    const run = runManager.startRun('hardcore');
    run.stats.totalShows = 7;
    const snap = JSON.parse(JSON.stringify(captureRuntimeSnapshot()));

    runManager.abandonRun();
    expect(runManager.getCurrentRun()).toBeNull();

    restoreRuntimeSnapshot(snap);
    const restored = runManager.getCurrentRun();
    expect(restored?.config.id).toBe('hardcore');
    expect(restored?.stats.totalShows).toBe(7);
  });

  it('no-ops safely on an undefined snapshot', () => {
    expect(() => restoreRuntimeSnapshot(undefined)).not.toThrow();
    expect(() => restoreRuntimeSnapshot(null)).not.toThrow();
  });
});

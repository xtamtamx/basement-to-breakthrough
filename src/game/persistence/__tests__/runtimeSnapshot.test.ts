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
import { eventCardSystem } from '@game/mechanics/EventCardSystem';
import { dayJobSystem, DayJob } from '@game/mechanics/DayJobSystem';
import { factionSystem } from '@game/mechanics/FactionSystem';
import { PromotionType } from '@game/mechanics/ShowPromotionSystem';
import { useGameStore } from '@stores/gameStore';

// The whole point of durable resume: capture -> JSON round-trip (as the
// persistence layer does) -> restore must rebuild the in-memory singletons,
// including the nested Map (promotionInvestment) and Set (raid blocks).
describe('runtimeSnapshot round-trip', () => {
  beforeEach(() => {
    showPromotionSystem.reset();
    difficultySystem.resetBlocks();
    synergyManager.reset();
    eventCardSystem.reset();
    dayJobSystem.setJob(null);
    factionSystem.reset();
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

  it('restores the event-draw dedup history so a same-run reload cannot redraw a resolved card', () => {
    // A run resolved cards on turns 8 and 15.
    eventCardSystem.restore([
      { cardId: 'venue_fire', turn: 8, choice: 'rebuild' },
      { cardId: 'record_label_scout', turn: 15 },
    ]);
    const snap = JSON.parse(JSON.stringify(captureRuntimeSnapshot()));

    // A mid-run reload: the singleton is reset (prior-run bleed guard) then must
    // be re-synced from the snapshot.
    eventCardSystem.reset();
    expect(eventCardSystem.getEventHistory()).toHaveLength(0);

    restoreRuntimeSnapshot(snap);
    const history = eventCardSystem.getEventHistory();
    expect(history.map((e) => e.cardId)).toEqual(['venue_fire', 'record_label_scout']);
    expect(history[0].turn).toBe(8);
  });

  it('restores the held day job (+turns worked) so its per-turn income survives a reload', () => {
    const job = {
      id: 'record-store', type: 'record_store', category: 'retail',
      name: 'Record Store Clerk', description: 'x',
      moneyPerTurn: 40, reputationChange: 1, fanChange: 0, stressGain: 3,
    } as unknown as DayJob;
    dayJobSystem.setJob(job);
    const snap = JSON.parse(JSON.stringify(captureRuntimeSnapshot()));

    dayJobSystem.setJob(null); // a fresh module / prior-run guard leaves no job
    expect(dayJobSystem.getCurrentJob()).toBeNull();

    restoreRuntimeSnapshot(snap);
    expect(dayJobSystem.getCurrentJob()?.id).toBe('record-store');
  });

  it('re-hydrates faction standings from the store so the next show cannot wipe them', () => {
    // A loaded save's standings live in the store; the singleton must reflect them
    // (a bare reset would leave it neutral, and the next show would push neutral
    // back over the loaded values).
    useGameStore.setState({ factionStandings: { punk: 40, artschool: -25 } });
    factionSystem.setStanding('punk', -99); // stale prior-run value in the singleton
    restoreRuntimeSnapshot({
      run: null, scheduledShows: [], difficultyBlocks: { raided: [], unavailable: [] },
      synergy: synergyManager.serialize(),
    });
    expect(factionSystem.getStanding('punk')).toBe(40);
    expect(factionSystem.getStanding('artschool')).toBe(-25);
    useGameStore.setState({ factionStandings: {} });
  });

  it('no-ops safely on an undefined snapshot', () => {
    expect(() => restoreRuntimeSnapshot(undefined)).not.toThrow();
    expect(() => restoreRuntimeSnapshot(null)).not.toThrow();
  });

  it('drops a show already in showHistory (idempotent — no duplicate re-fire)', () => {
    // Simulate a mid-turn-refresh snapshot: it still lists a show the store
    // already resolved into showHistory, plus a genuinely-pending one.
    useGameStore.setState({
      showHistory: [{ id: 'done-1', status: 'COMPLETED' }] as never,
    });
    const done = { ...seedShow(), id: 'done-1' };
    const pending = { ...seedShow(), id: 'pending-1' };

    restoreRuntimeSnapshot({
      run: null,
      scheduledShows: [done, pending],
      difficultyBlocks: { raided: [], unavailable: [] },
      synergy: synergyManager.serialize(),
    });

    const ids = showPromotionSystem.getScheduledShows().map((s) => s.id);
    expect(ids).toContain('pending-1');
    expect(ids).not.toContain('done-1'); // already resolved → not re-injected

    useGameStore.setState({ showHistory: [] });
  });
});

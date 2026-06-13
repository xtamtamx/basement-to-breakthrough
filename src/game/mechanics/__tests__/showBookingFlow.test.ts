/**
 * Integration test for the show booking → execution → payout loop.
 *
 * Regression guard for the booking↔execution disconnect: a show booked through
 * the canonical store action (`scheduleShow`, the same path the Show Builder UI
 * uses) must be registered with the ShowPromotionSystem so that
 * TurnResolutionEngine actually runs it and pays it out. Before the fix, booking
 * only pushed to `store.scheduledShows` while the engine ran shows out of the
 * promotion system's separate map, so UI-booked shows never executed.
 *
 * Unlike TurnResolutionEngine.test.ts (which mocks the store and the promotion
 * system), this test wires the REAL store, REAL showPromotionSystem and REAL
 * turnResolutionEngine together so it exercises the actual booking path.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem } from '../ShowPromotionSystem';
import { turnResolutionEngine } from '../TurnResolutionEngine';
import { Show } from '@game/types';

/** Build a Show exactly the way ShowBuilderView does on "Book This Show". */
const makeShow = (): Show => {
  const store = useGameStore.getState();
  const venue = store.venues[0];
  const band = store.allBands.find((b) => store.rosterBandIds.includes(b.id))!;
  return {
    id: `show-test-${band.id}-${venue.id}`,
    venueId: venue.id,
    bandId: band.id,
    lineup: [band.id],
    ticketPrice: 20,
    date: new Date(),
    status: 'SCHEDULED',
    revenue: 0,
  };
};

describe('show booking → execution flow (real path)', () => {
  beforeEach(async () => {
    // Fresh run state, then load the real starter venues/bands/roster.
    useGameStore.getState().resetGame();
    turnResolutionEngine.reset(); // also clears the promotion system schedule
    await useGameStore.getState().loadInitialGameData();
    useGameStore.setState({ money: 1000 });
    // Keep incidents (10% base) out of the deterministic assertions.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    turnResolutionEngine.reset();
  });

  it('registers a UI-booked show with the promotion system (the path that executes)', () => {
    const show = makeShow();

    expect(showPromotionSystem.getScheduledShows()).toHaveLength(0);

    useGameStore.getState().scheduleShow(show, 3);

    // Display mirror used by nav badges / map markers / completeShow lookup.
    expect(useGameStore.getState().scheduledShows).toContainEqual(show);

    // The execution + promotion owner now actually knows about the show.
    const scheduled = showPromotionSystem.getScheduledShows();
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].id).toBe(show.id);
    expect(scheduled[0].turnsUntilShow).toBe(3); // countdown starts here
  });

  it('clamps turnsInAdvance into the promotion system 1-5 window', () => {
    useGameStore.getState().scheduleShow(makeShow(), 99);
    expect(showPromotionSystem.getScheduledShows()[0].turnsUntilShow).toBe(5);
  });

  it('counts a booked show down and executes it through the engine, paying out', async () => {
    const show = makeShow();
    // Make this a clearly profitable gig so the payout is unambiguous regardless
    // of how the starter venue/band balance is tuned: a big, lively, cheap room
    // and a popular band. (The wiring under test is the same for any economics.)
    useGameStore.setState((s) => ({
      venues: s.venues.map((v) =>
        v.id === show.venueId
          ? { ...v, capacity: 200, atmosphere: 90, rent: 50, equipment: [] }
          : v,
      ),
    }));
    useGameStore.getState().updateBand(show.bandId, { popularity: 90 });

    useGameStore.getState().scheduleShow(show, 2);
    expect(showPromotionSystem.getScheduledShows()[0].turnsUntilShow).toBe(2);

    // Turn 1: countdown ticks, show has not happened yet.
    await turnResolutionEngine.executeFullTurn();
    expect(showPromotionSystem.getScheduledShows()[0].turnsUntilShow).toBe(1);
    expect(useGameStore.getState().scheduledShows).toHaveLength(1);
    expect(useGameStore.getState().showHistory).toHaveLength(0);

    // Turn 2: countdown hits 0 → the show resolves.
    const moneyBeforeShow = useGameStore.getState().money;
    const result = await turnResolutionEngine.executeFullTurn();

    // It resolved into a real ShowResult.
    expect(result.showResults).toHaveLength(1);
    const showResult = result.showResults[0];
    expect(showResult.showId).toBe(show.id);
    expect(showResult.attendance).toBeGreaterThan(0);
    expect(showResult.revenue).toBeGreaterThan(0);
    expect(showResult.financials.profit).toBeGreaterThan(0);

    // It left both schedules and landed in history (completeShow ran).
    expect(showPromotionSystem.getScheduledShows()).toHaveLength(0);
    expect(useGameStore.getState().scheduledShows).toHaveLength(0);
    expect(
      useGameStore.getState().showHistory.some((s) => s.id === show.id),
    ).toBe(true);

    // It paid out through completeShow (gross revenue banked) with the engine
    // deducting the show's costs and the turn's upkeep. The delta is exactly the
    // show's contribution (no synergies/day-job/passive income in this fixture),
    // and it's positive — pre-fix the show never fired and money only fell by
    // living costs.
    const money = useGameStore.getState().money;
    expect(money).toBeGreaterThan(moneyBeforeShow);
    expect(money).toBeGreaterThanOrEqual(
      moneyBeforeShow +
        showResult.revenue -
        showResult.financials.costs -
        result.totalUpkeep,
    );
  });
});

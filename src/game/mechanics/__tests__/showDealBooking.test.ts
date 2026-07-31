/**
 * The terms are settled at BOOKING, and gameStore.scheduleShow is the one place
 * that happens. The balance sim and any future caller construct shows directly
 * rather than through the React form, so a rule enforced only in ShowBuilderView
 * is not a rule at all — this pins it at the canonical entry point.
 *
 * Like showBookingFlow.test.ts (and unlike showDeal.test.ts, which mocks the
 * store to drive the resolver), this wires the REAL store.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useGameStore } from '@stores/gameStore';
import { turnResolutionEngine } from '../TurnResolutionEngine';
import { DOOR_DEAL_ROOM_CAP } from '../bandEconomy';
import { ShowDeal } from '@game/types';

/**
 * Booking is the ONE place the terms are checked. The sim and any future caller
 * construct shows directly, so a rule enforced only in the React form is not a
 * rule — gameStore.scheduleShow settles the deal for every path.
 */
describe('scheduleShow settles the terms', () => {
  beforeEach(async () => {
    useGameStore.getState().resetGame();
    turnResolutionEngine.reset();
    await useGameStore.getState().loadInitialGameData();
    useGameStore.setState({ money: 100000, reputation: 0 });
  });

  afterEach(() => {
    turnResolutionEngine.reset();
  });

  const bookAt = (venuePredicate: (v: { capacity: number }) => boolean, deal: ShowDeal) => {
    const s = useGameStore.getState();
    const venue = s.venues.find(venuePredicate)!;
    const band = s.allBands.find((b) => s.rosterBandIds.includes(b.id))!;
    s.scheduleShow(
      {
        id: `deal-test-${venue.id}-${deal}`,
        venueId: venue.id,
        bandId: band.id,
        lineup: [band.id],
        ticketPrice: 15,
        deal,
        date: new Date(),
        status: 'SCHEDULED',
        revenue: 0,
      },
      1,
    );
    return useGameStore.getState().scheduledShows.at(-1)!;
  };

  it('honours a door deal in a room that will take one', () => {
    const booked = bookAt((v) => v.capacity <= DOOR_DEAL_ROOM_CAP, 'door');
    expect(booked.deal).toBe('door');
  });

  it('settles a door deal back to a guarantee in a room that books on contracts', () => {
    // The exploit this closes: pick the biggest room, offer the door, pay no
    // deposit and no fees, and buy a huge crowd for nothing.
    const booked = bookAt((v) => v.capacity > DOOR_DEAL_ROOM_CAP, 'door');
    expect(booked.deal).toBe('guarantee');
  });

  it('charges the deposit it settled on, not the one that was asked for', () => {
    const before = useGameStore.getState().money;
    const booked = bookAt((v) => v.capacity > DOOR_DEAL_ROOM_CAP, 'door');
    const spent = before - useGameStore.getState().money;
    // Downgraded to a guarantee, so the rent hold is real — a door deal that
    // silently kept its zero deposit would be the exploit wearing a disguise.
    expect(booked.deal).toBe('guarantee');
    expect(spent).toBeGreaterThan(0);
    expect(booked.bookingDeposit).toBe(spent);
  });
});

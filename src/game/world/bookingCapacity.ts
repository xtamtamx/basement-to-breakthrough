/**
 * Booking-capacity ramp — how many shows the promoter can have on the calendar
 * (booked + awaiting their date) at once.
 *
 * You start as a nobody who can only juggle ONE show at a time; as the scene's
 * clout grows you unlock parallel booking slots and can keep several shows
 * cooking in promotion simultaneously. Gated on PEAK reputation (one-way, like
 * the venue ladder) so a rep dip never strips a slot you already earned.
 */

/** Peak-reputation needed to have earned each slot: index 0 → slot 1 (always),
 *  index 1 → slot 2, etc. Tuned alongside the venue ladder + balance sim. */
export const BOOKING_SLOT_TIERS = [0, 18, 40, 65] as const;

/** Max concurrent booked-and-waiting shows at the given peak reputation. */
export function bookingCapacity(peakReputation: number): number {
  let slots = 1;
  for (let i = 1; i < BOOKING_SLOT_TIERS.length; i++) {
    if (peakReputation >= BOOKING_SLOT_TIERS[i]) slots = i + 1;
  }
  return slots;
}

/** Peak reputation at which the NEXT slot unlocks, or null if already maxed —
 *  for the "another slot at X rep" hint in the booking UI. */
export function nextBookingSlotAt(peakReputation: number): number | null {
  for (const tier of BOOKING_SLOT_TIERS) {
    if (peakReputation < tier) return tier;
  }
  return null;
}

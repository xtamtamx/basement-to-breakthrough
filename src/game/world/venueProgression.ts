/**
 * Venue scene-growth ladder — venues open on the map / become bookable as the
 * scene's reputation climbs. Gated on PEAK reputation (one-way) so a venue you
 * earned never disappears after a rep dip. A venue with no unlockReputation
 * (or 0) is available from the start; cities without a ladder are ungated.
 */
import { Venue } from "@game/types";

export const isVenueUnlocked = (venue: Venue, peakReputation: number): boolean =>
  (venue.unlockReputation ?? 0) <= peakReputation;

export const unlockedVenues = (venues: Venue[], peakReputation: number): Venue[] =>
  venues.filter((v) => isVenueUnlocked(v, peakReputation));

/** Venues still locked, sorted by how soon they open — for "coming soon" UI. */
export const lockedVenues = (venues: Venue[], peakReputation: number): Venue[] =>
  venues
    .filter((v) => !isVenueUnlocked(v, peakReputation))
    .sort((a, b) => (a.unlockReputation ?? 0) - (b.unlockReputation ?? 0));

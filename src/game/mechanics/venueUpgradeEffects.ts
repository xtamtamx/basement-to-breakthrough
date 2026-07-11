/**
 * venueUpgradeEffects — pure sums over a venue's purchased upgrades, shared by
 * the resolver (TurnResolutionEngine.executeShow) AND the ShowBuilder preview
 * so an effect advertised on an upgrade card can never differ between the
 * previewed and resolved show.
 *
 * Capacity is deliberately NOT summed here: VenueUpgradeSystem.applyUpgrade
 * bakes effects.capacity into venue.capacity at purchase, and every consumer
 * (resolver, attendance projection, venue cards) reads venue.capacity
 * directly — summing it again at show time double-counts the room.
 */
import { Venue } from '@game/types';

/** Summed percent revenue bonus (VIP Area +20, Install Bar +30, …). */
export function upgradeRevenueBonus(venue: Venue): number {
  return (
    venue.upgrades?.reduce((sum, u) => sum + (u.effects.revenue || 0), 0) || 0
  );
}

/** Summed signed incident-chance delta in percentage points — security
 *  upgrades negative (fewer incidents), the outdoor expansion positive. */
export function upgradeIncidentDelta(venue: Venue): number {
  return (
    venue.upgrades?.reduce(
      (sum, u) => sum + (u.effects.incidentChance || 0),
      0,
    ) || 0
  );
}

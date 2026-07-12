import { Band, Venue, Genre } from '@game/types';
import { synergyEngine } from './SynergyEngine';
import { COMBO_MULT_CAP } from '@game/constants/runConstants';
import { cityGenreFit, homeCityFit } from '@game/world/citySynergy';
import { computeLineupChemistry } from './lineupChemistry';
import { factionSystem } from './FactionSystem';
import { difficultySystem } from './DifficultySystem';
import { computeEquipmentEffects } from './venueEquipmentEffects';

/**
 * The SINGLE source of truth for a bill's PROJECTED (pre-promotion) attendance —
 * the deterministic crowd it draws before promotion/hype, mirroring the factors
 * TurnResolutionEngine applies at resolution (avg popularity × venue atmosphere,
 * +20%/extra band, band↔venue combos capped, city scene-fit, hometown crowd, bill
 * chemistry, faction standing). Used by BOTH the ShowBuilder booking preview AND
 * the Promote screen's expected-attendance so the two can never disagree (the
 * old promo formula omitted bill/scene-fit/chemistry and "lied" vs the preview).
 *
 * ALSO folds in the DETERMINISTIC difficulty modifiers the resolver applies
 * (scene-expectations decay, plus ticket-price resistance when a ticketPrice is
 * passed) — every multiplier known at booking is included, so rising pressure
 * reads as pressure in the preview, not as RNG at resolution. The engine layers
 * the remaining run-modifiers (gentrification / city-signature) on top at
 * resolution. Capped at the room's effective capacity (after any active-event
 * capacity penalty).
 */
export function projectBaseAttendance(opts: {
  bands: Band[];
  venue: Venue;
  cityPrimaryGenre?: Genre;
  currentCityId: string;
  factionStandings: Record<string, number>;
  eventCapacityPenalty?: number;
  /** When set, the price-resistance penalty (>$10 shrinks the crowd) is
   *  projected too — the price is fully known at booking, so omitting it made
   *  the ticket slider's preview monotonically (and falsely) rise with price. */
  ticketPrice?: number;
}): number {
  const { bands, venue, cityPrimaryGenre, currentCityId, factionStandings, eventCapacityPenalty, ticketPrice } = opts;
  if (!bands.length) return 0;
  const headliner = bands[0];
  const totalMultiplier = Math.min(
    synergyEngine.getTotalMultiplier(synergyEngine.calculateSynergies(bands, venue)),
    COMBO_MULT_CAP,
  );
  const sceneFit = cityGenreFit(cityPrimaryGenre, headliner.genre);
  const homeFit = homeCityFit(headliner.homeCity, currentCityId);
  const avgPopularity = bands.reduce((sum, b) => sum + b.popularity, 0) / bands.length;
  const billMultiplier = 1 + 0.2 * Math.max(0, bands.length - 1);
  const lineupChem = computeLineupChemistry(bands);
  const fMods = factionSystem.getShowModifiersFrom(headliner, factionStandings);
  const factionAttMult = Math.max(0.92, Math.min(1.08, 1 + (fMods.fanBonus - 1) * 0.4));
  // Owned/rented gear lifts the room exactly as executeShow applies it (shared
  // helper): capacity ×bonus feeds the ceiling, acoustics/atmosphere lift the
  // draw (venue.atmosphere + qualityBonus, capped 1.4). Omitting this made the
  // preview under-count the crowd for any venue with gear installed.
  const equip = computeEquipmentEffects(venue);
  const effectiveCapacity = Math.max(
    1,
    Math.floor(venue.capacity * equip.capacityMult - (eventCapacityPenalty ?? 0)),
  );
  const venueBonus = Math.min(1.4, (venue.atmosphere + equip.qualityBonus) / 100);
  const base = Math.floor(effectiveCapacity * (avgPopularity / 100) * venueBonus);
  // Deterministic difficulty term (same helper the resolver uses): scene
  // expectations always; price resistance only when the caller knows the price
  // (a ticketPrice of 0 applies no price penalty — see getShowDifficultyModifiers).
  const difficultyMult = difficultySystem.getShowDifficultyModifiers(
    base,
    ticketPrice ?? 0,
  ).attendanceMultiplier;
  const projected = Math.floor(
    base * billMultiplier * totalMultiplier * sceneFit.multiplier * homeFit.multiplier * lineupChem.mult * factionAttMult * difficultyMult,
  );
  return Math.min(projected, effectiveCapacity);
}

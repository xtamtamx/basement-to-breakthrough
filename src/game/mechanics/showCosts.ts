/**
 * showCosts — the ONE venue-rent formula, shared by the resolver
 * (TurnResolutionEngine.executeShow) AND the ShowBuilder preview so the previewed
 * Net can never lie about rent.
 *
 * A venue's real cost is the difficulty-scaled base rent bent by every environmental
 * multiplier: the district's rent tier, gentrification creep, the run modifier, the
 * meta venue-discount, and the city's signature. The preview used to apply ONLY the
 * difficulty scaling, so a priced room could resolve at ~1.8× the previewed rent and
 * a "break-even" bill quietly lost money.
 *
 * NOTE: difficulty scaling reads LIVE store state at call time, so a booking's preview
 * (now) and its resolution (later, at a higher difficulty / possibly in escalation)
 * can still differ slightly — that drift is inherent and unknowable at booking. Every
 * multiplier that IS known at booking is included here.
 */
import { Venue, District } from '@game/types';
import { difficultySystem } from './DifficultySystem';
import { gentrificationSystem } from './GentrificationSystem';
import { getCitySignature } from '../world/citySignatures';

export interface VenueCostContext {
  /** Live districts (their rentMultiplier + id match the venue's location). */
  districts: District[];
  /** Current city id, for the per-city signature rent multiplier. */
  currentCityId: string;
  /** Run modifier on venue rent (RunManager.getRunModifiers().venueRentMultiplier). */
  runVenueRentMult: number;
  /** Meta venue-discount multiplier (MetaProgression getRunStartBonuses). */
  metaVenueDiscountMult: number;
}

/** Rent actually charged for a show at this venue — matches executeShow exactly. */
export function resolveVenueCost(venue: Venue, ctx: VenueCostContext): number {
  const districtRentMult =
    ctx.districts.find((d) => d.id === venue.location.id)?.rentMultiplier ?? 1;
  const sig = getCitySignature(ctx.currentCityId);
  return Math.floor(
    difficultySystem.getScaledVenueCost(venue.rent) *
      districtRentMult *
      gentrificationSystem.getRentMultiplier(venue.location.id) *
      ctx.runVenueRentMult *
      ctx.metaVenueDiscountMult *
      (sig?.rentMult ?? 1),
  );
}

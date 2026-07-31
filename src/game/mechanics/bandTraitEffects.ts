/**
 * bandTraitEffects — the ONE place that turns a bill's band traits into show
 * effects, shared by the resolver (TurnResolutionEngine.executeShow) AND the
 * booking preview (attendanceProjection / ShowBuilder), exactly like
 * venueEquipmentEffects does for gear.
 *
 * Every condition in BAND_TRAIT_CATALOG is knowable while you are still building
 * the bill (room size, all-ages vs bar, solo vs shared), so the preview can list
 * precisely the traits that will fire — one summation, two callers, no divergence.
 *
 * Unknown trait ids are ignored on purpose: the roster (and procedurally generated
 * bands) may carry flavor traits the catalogue has never heard of.
 */
import { Band, Venue } from '@game/types';
import { BAND_TRAIT_CATALOG, TraitCondition } from '@game/data/bandTraits';

export interface SummedTraitEffects {
  /** Crowd multiplier for the whole bill (starts at 1, capped 1.5). */
  attendanceMult: number;
  /** Show reputation multiplier (starts at 1, capped 1.5). */
  repMult: number;
  /** Night's-take multiplier (starts at 1, capped 1.5). */
  moneyMult: number;
  /** Fans-gained multiplier (starts at 1, capped 1.5). */
  fanMult: number;
  /** Signed flat stress this bill adds (+) or shaves (-), clamped [-6, 12]. */
  stressDelta: number;
  /** Only the traits whose condition is MET, one per band+trait, for the UI. */
  firing: { bandName: string; traitName: string; blurb: string }[];
}

/** Multipliers stack across a bill, so a 3-band mono-trait lineup is capped here. */
/** Floors sit BELOW 1 so a trait's miss-case can actually bite. */
const MULT_MIN = 0.75;
const MULT_MAX = 1.5;
/** Fans and reputation ARE the win conditions, so a multiplier on them shortens
 *  the run directly — and attendance already feeds both. Capped hardest. */
const WIN_MULT_MAX = 1.18;
/** Crowd is the MASTER stat — it compounds into fans, reputation and money at
 *  once, so it gets a tighter ceiling than the single-currency multipliers. */
const ATTENDANCE_MULT_MAX = 1.15;
const STRESS_MIN = -6;
const STRESS_MAX = 12;
const FEE_MIN = 0.5;
const FEE_MAX = 1.5;

const clamp = (v: number, lo: number, hi: number): number =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;

/** A missing/garbage multiplier must read as "no effect", never as NaN. */
const mult = (v: number | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 1;

const delta = (v: number | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0;

/** Does this condition hold for the room + bill the player has assembled? */
export function traitFires(
  when: TraitCondition,
  venue: Venue,
  billSize: number,
): boolean {
  const capacity = Number.isFinite(venue?.capacity) ? venue.capacity : 0;
  const size = Number.isFinite(billSize) ? billSize : 0;
  switch (when) {
    case 'always':
      return true;
    case 'smallRoom':
      return capacity <= 90;
    case 'bigRoom':
      return capacity >= 300;
    case 'allAges':
      return !!venue?.allowsAllAges;
    case 'bar':
      return !!venue?.hasBar;
    case 'soloBill':
      return size <= 1;
    case 'fullBill':
      return size >= 2;
    default:
      return false;
  }
}

export function computeTraitEffects(
  bands: Band[],
  venue: Venue,
  billSize: number,
): SummedTraitEffects {
  let attendanceMult = 1;
  let repMult = 1;
  let moneyMult = 1;
  let fanMult = 1;
  let stressDelta = 0;
  const firing: SummedTraitEffects['firing'] = [];

  (bands ?? []).forEach((band) => {
    (band?.traits ?? []).forEach((trait) => {
      const entry = BAND_TRAIT_CATALOG[trait?.id];
      if (!entry) return;
      const hit = traitFires(entry.effect.when, venue, billSize);
      // Two-sided: the miss-case is what stops a roster-wide trait pass from
      // simply making every band better (see bandTraits' header note).
      const fx = hit ? entry.effect : entry.otherwise;
      if (!fx) return;
      attendanceMult *= mult(fx.attendanceMult);
      repMult *= mult(fx.repMult);
      moneyMult *= mult(fx.moneyMult);
      fanMult *= mult(fx.fanMult);
      stressDelta += delta(fx.stressDelta);
      if (hit) {
        firing.push({
          bandName: band.name,
          traitName: entry.trait.name,
          blurb: entry.blurb,
        });
      }
    });
  });

  return {
    attendanceMult: clamp(attendanceMult, MULT_MIN, ATTENDANCE_MULT_MAX),
    repMult: clamp(repMult, MULT_MIN, WIN_MULT_MAX),
    moneyMult: clamp(moneyMult, MULT_MIN, MULT_MAX),
    fanMult: clamp(fanMult, MULT_MIN, WIN_MULT_MAX),
    stressDelta: clamp(stressDelta, STRESS_MIN, STRESS_MAX),
    firing,
  };
}

/**
 * PER-BAND booking-fee multiplier — the fee is charged per act, so it can't ride
 * in the bill-wide summation above. Only unconditional (`always`) fee traits
 * count: the fee is quoted per band, not per room.
 */
export function traitFeeMult(band: Band): number {
  let feeMult = 1;
  (band?.traits ?? []).forEach((trait) => {
    const entry = BAND_TRAIT_CATALOG[trait?.id];
    if (!entry || entry.effect.when !== 'always') return;
    feeMult *= mult(entry.effect.feeMult);
  });
  return clamp(feeMult, FEE_MIN, FEE_MAX);
}

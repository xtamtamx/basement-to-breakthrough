import { ShowDeal } from '@game/types';

/**
 * bandEconomy — the promoter side of booking a band.
 *
 * A band's GUARANTEE (appearance fee) scales with its popularity: scrappy starters
 * are cheap but draw small crowds; legends cost a fortune but pack the room. (Crowd
 * size already scales with popularity in the resolver, so a bigger guarantee buys a
 * bigger draw.) You can book any UNLOCKED band:
 *  - UNSIGNED guest → you pay the FULL guarantee.
 *  - SIGNED to your roster → you take your PROMOTER_CUT, so you only pay the rest —
 *    cheaper to re-book AND the payoff for spending a roster slot.
 *
 * ONE formula, imported by BOTH the ShowBuilder preview and the resolver, so the
 * previewed band fees always equal what actually gets charged.
 */

/** Share of a signed act's guarantee the promoter keeps (so you pay 1 - this). */
export const PROMOTER_CUT = 0.6;

/** Base appearance fee for an act of the given popularity (0-100). Quadratic so the
 *  curve stays cheap for starters and ramps hard for the legends. */
export function bandGuarantee(popularity: number): number {
  return Math.round(8 + (popularity * popularity) / 28);
}

/** What the promoter actually pays this act, before difficulty scaling: the full
 *  guarantee for a guest, only the (1 - cut) share for a signed act. */
export function bandBookingFee(popularity: number, isSigned: boolean): number {
  return bandGuarantee(popularity) * (isSigned ? 1 - PROMOTER_CUT : 1);
}

/** Popularity at/above which an act is a "big draw" that won't play on a handshake:
 *  it holds a slice of its fee UP FRONT at booking (a deposit), the rest paid on show
 *  day. Below this, small local acts book on show-day money alone. */
export const DEPOSIT_POPULARITY_THRESHOLD = 45;
/** Fraction of the booking fee a big act wants held up front at booking. */
export const DEPOSIT_FRACTION = 0.5;

/** Up-front deposit this act demands at booking (0 for acts under the threshold).
 *  A slice of what the PROMOTER pays (guest guarantee, or your cut if signed) — so
 *  the commitment scales with the act's size and you can't book a legend you can't
 *  half-afford. The remainder is charged on show day like everyone else's fee. */
export function bandDeposit(popularity: number, isSigned: boolean): number {
  if (popularity < DEPOSIT_POPULARITY_THRESHOLD) return 0;
  return Math.round(bandBookingFee(popularity, isSigned) * DEPOSIT_FRACTION);
}

/* ────────────────────────── guarantee vs. the door ──────────────────────────
 * The oldest argument in booking. You can pay the bill a GUARANTEE — a flat fee,
 * theirs whether four people come or four hundred — and keep the whole gate. Or
 * you can offer them the DOOR: no fee at all, they take a share of what comes
 * through it. One is a fixed cost against an unknown night; the other is an
 * unknown cost against a night you no longer carry alone.
 *
 * Which is better is genuinely a judgement call, and the numbers say something
 * true: in a 30-cap basement a guarantee eats most of the gate, so splitting the
 * door is how a broke promoter operates. In a 300-cap room the same guarantee is
 * pocket change and handing over 60% is lunacy. Graduating from door deals to
 * guarantees IS the arc of getting good at this.
 */

/** Share of the raw gate (heads × ticket price) the whole bill takes on a door
 *  deal — the headliner negotiates it and the openers get paid out of it, which
 *  is both how it works and why one number covers any bill. The house keeps the
 *  rest AND every dollar behind the bar: bar money has never been the band's. */
export const DOOR_SPLIT_BAND_SHARE = 0.6;

/** A band on a door deal only eats if people come, so it promotes the thing
 *  itself — flyers its own show, drags its own friends out. Deliberately small:
 *  attendance is the master stat, feeding fans AND rep AND the gate. */
export const DOOR_DEAL_DRAW_BONUS = 1.08;

/** Cred for putting the night's risk on yourself instead of the band. Slow drift
 *  (events move diyPoints in tens) — a run of door deals is a scene identity you
 *  build, not a switch you flip. Kept to 1: with touring parked, event cards are
 *  the only other live source (~40 points a run), and a per-show drip of 2 would
 *  quietly outweigh the whole event budget with nothing pulling the other way. */
export const DOOR_DEAL_DIY_POINTS = 1;

/** Reputation at which acts trust your rooms enough to gamble on a percentage. */
export const DOOR_DEAL_TRUST_REP = 40;

/**
 * Biggest room that will do a night on a handshake. Above this an act has an
 * agent, the room has a contract, and nobody is splitting anything.
 *
 * This is the load-bearing limit, and it is doing two jobs at once. A door deal
 * waives the booking deposit — which is the ONLY brake on booking an act far
 * bigger than you can afford — and no run is won with money, so without a
 * ceiling the deal converts cash you don't need into attendance, which is the
 * master stat feeding both win bars. The balance sim was unambiguous: uncapped,
 * always taking the door with the biggest bookable guest HALVED a Classic run
 * (23 turns to 11) and pushed the win rate UP. Capped, the deal can only ever
 * buy a small room's worth of crowd.
 *
 * The same line fixes the opposite failure. Above ~120 cap the gate dwarfs the
 * guarantee (a 300-cap room's fees are 3-7% of the door), so handing over 60%
 * there isn't a choice, it's a trap — door-always in big rooms dropped Classic
 * from a 100% win rate to 28%. So the ceiling puts the deal exactly where the
 * arithmetic already said it belonged: the rooms you start in.
 */
export const DOOR_DEAL_ROOM_CAP = 120;

/** Why this room won't do a door deal, or null if it will. */
export function doorDealRoomRefusal(venue: { name: string; capacity: number }): string | null {
  if (venue.capacity <= DOOR_DEAL_ROOM_CAP) return null;
  return `${venue.name} books on contracts`;
}

/** Authenticity at/above which an act plays for the door on principle — the same
 *  purist line bandResponse reads. */
export const DOOR_DEAL_PURIST_AUTHENTICITY = 75;

/** What the bill is owed on a door deal: a straight share of the gate. Bar sales
 *  are the house's, so they never enter it. */
export function doorSplitCost(attendance: number, ticketPrice: number): number {
  // Non-finite in means zero out, never NaN out: a missing ticketPrice once
  // turned a whole show's reputation into NaN, and a NaN cost would silently
  // wreck the player's balance the same way.
  if (!Number.isFinite(attendance) || !Number.isFinite(ticketPrice)) return 0;
  const gate = Math.max(0, attendance) * Math.max(0, ticketPrice);
  return Math.round(gate * DOOR_SPLIT_BAND_SHARE);
}

/** Draw multiplier for the deal — a band with skin in the night works the night. */
export function dealDrawMult(deal: ShowDeal | undefined): number {
  return deal === 'door' ? DOOR_DEAL_DRAW_BONUS : 1;
}

/**
 * Why this act won't play for a percentage, or null if it will. Acts big enough
 * to demand a deposit are the acts with a van payment and a booking agent — they
 * want the number in writing. They'll still do it if they're YOURS (signed), if
 * they're purists who'd play for gas money anyway, or once your name is good
 * enough that a percentage of YOUR door is a safe bet.
 */
export function doorDealRefusal(
  band: { name: string; popularity: number; authenticity: number },
  opts: { isSigned: boolean; reputation: number },
): string | null {
  if (band.popularity < DEPOSIT_POPULARITY_THRESHOLD) return null;
  if (opts.isSigned) return null;
  if (band.authenticity >= DOOR_DEAL_PURIST_AUTHENTICITY) return null;
  if (opts.reputation >= DOOR_DEAL_TRUST_REP) return null;
  return `${band.name} wants a guarantee`;
}

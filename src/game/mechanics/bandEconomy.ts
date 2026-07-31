import { ShowDeal } from '@game/types';

/**
 * bandEconomy — the promoter side of booking a band.
 *
 * A band's GUARANTEE is quoted FOR THE ROOM: it scales with the draw that act can
 * plausibly deliver in the space you're offering, because that is what you're
 * buying. Scrappy starters in small rooms are cheap; a name act in a real room is
 * a real investment, and the same act is worth different money in different rooms.
 * You can book any UNLOCKED band:
 *  - UNSIGNED guest → you pay the FULL guarantee.
 *  - SIGNED to your roster → you take your PROMOTER_CUT, so you only pay the rest —
 *    cheaper to re-book AND the payoff for spending a roster slot.
 *
 * Or you pay no fee at all and split the door instead. See the deal section below.
 *
 * ONE formula, imported by BOTH the ShowBuilder preview and the resolver, so the
 * previewed band fees always equal what actually gets charged.
 */

/** Share of a signed act's guarantee the promoter keeps (so you pay 1 - this). */
export const PROMOTER_CUT = 0.6;

/**
 * Heads an act can plausibly pull in a given room — the same shape the resolver
 * builds its base attendance from (capacity × popularity × how much the room
 * itself pulls). This is the number both sides of a booking are really arguing
 * about, so it is the number the fee is quoted off.
 */
export function expectedDraw(
  popularity: number,
  venue: { capacity: number; atmosphere: number },
): number {
  const roomPull = Math.min(1.4, Math.max(0, venue.atmosphere) / 100);
  return Math.max(0, venue.capacity) * (Math.max(0, popularity) / 100) * roomPull;
}

/** Nobody plays for nothing — gas money and a couple of drink tickets. */
export const GUARANTEE_FLOOR = 10;
/** What an act is worth per head it can pull into the room you're offering. */
export const GUARANTEE_PER_HEAD = 3;

/**
 * Base appearance fee, QUOTED FOR THE ROOM.
 *
 * It used to be a function of popularity alone, which meant the same $225 bought
 * you a 20-head basement or a 222-head lodge — so a guarantee ran 42-75% of the
 * gate downstairs and 3-7% upstairs, and past the first few rooms *which band you
 * booked barely cost anything*. The popularity curve wasn't a constraint, it was
 * a rounding error, and no percentage deal could compete with it.
 *
 * Pricing off the expected draw fixes both at once: the fee holds a roughly
 * steady share of the gate all the way up the ladder, a bigger act in a bigger
 * room is a real investment, and putting a small act in a big room now loses
 * money instead of quietly making some.
 */
export function bandGuarantee(
  popularity: number,
  venue: { capacity: number; atmosphere: number },
): number {
  return Math.round(GUARANTEE_FLOOR + GUARANTEE_PER_HEAD * expectedDraw(popularity, venue));
}

/** What the promoter actually pays this act, before difficulty scaling: the full
 *  guarantee for a guest, only the (1 - cut) share for a signed act. */
export function bandBookingFee(
  popularity: number,
  isSigned: boolean,
  venue: { capacity: number; atmosphere: number },
): number {
  return bandGuarantee(popularity, venue) * (isSigned ? 1 - PROMOTER_CUT : 1);
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
export function bandDeposit(
  popularity: number,
  isSigned: boolean,
  venue: { capacity: number; atmosphere: number },
): number {
  if (popularity < DEPOSIT_POPULARITY_THRESHOLD) return 0;
  return Math.round(bandBookingFee(popularity, isSigned, venue) * DEPOSIT_FRACTION);
}

/* ────────────────────────── guarantee vs. the door ──────────────────────────
 * The oldest argument in booking. You can pay the bill a GUARANTEE — a flat fee,
 * theirs whether four people come or four hundred — and keep the whole gate. Or
 * you can offer them the DOOR: no fee at all, they take a share of what comes
 * through it. One is a fixed cost against an unknown night; the other is an
 * unknown cost against a night you no longer carry alone.
 *
 * Which is better is genuinely a judgement call, and since guarantees became
 * room-quoted the lever that decides it is the DOOR PRICE. A guarantee costs
 * roughly GUARANTEE_PER_HEAD a head whatever you charge; the split costs
 * DOOR_SPLIT_BAND_SHARE x the ticket price a head. So a cheap door favours the
 * split and a dear one favours the guarantee, which is exactly the argument
 * promoters actually have — and it plugs straight into the gouging rule, where a
 * cheap door already buys you a bigger crowd and more cred.
 *
 * What you get for the premium at a normal price: nothing owed if nobody comes,
 * nothing held at booking, a band that promotes its own night, and cred.
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
 * This is the load-bearing limit and it is not a taste call — the sim found it.
 * A door deal waives the booking deposit, which is the ONLY brake on booking a
 * room you cannot afford, and no run is won with money, so the deal converts cash
 * you don't need into attendance: the master stat feeding both win bars.
 *
 * Measured, uncapped, always taking the door with the biggest bookable guest:
 * before the room-quoted guarantee retune it HALVED a Classic run (23 turns to
 * 11) at a rising win rate. The retune blunted that (19 turns) but did NOT fix
 * it — Speed still fell 13 to 8 at a 100% win rate — and a 300 ceiling was no
 * better (Speed 8). At 120 the line finally prices itself: fast when it lands,
 * but a 73% Classic win rate with real evictions, which is a gamble rather than
 * a shortcut.
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

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

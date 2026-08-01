/**
 * Promotion pricing — pure helpers, so this file mocks NOTHING.
 *
 * (showDeal.test.ts vi.mocks ShowPromotionSystem to drive the resolver, which
 * auto-mocks every export here to undefined — this repo's classic NaN trap.)
 */
import { describe, it, expect } from 'vitest';
import {
  PROMOTION_ACTIVITIES,
  PromotionType,
  promotionCost,
  promotionStress,
  promoBudgetFor,
  promosUsed,
  MAX_PROMO_EFFECTIVENESS,
  PROMO_REFERENCE_CAPACITY,
  DAY_JOB_PROMO_COST,
} from '../ShowPromotionSystem';

/**
 * Promotion had no price and no ceiling.
 *
 * Six activities stacking multiplicatively (3.15x), two of them free, applied to
 * every show in the pipeline every turn — and the balance sim had never promoted
 * once, so every pacing number this project produced described a player ignoring
 * the strongest lever in the game. The moment the sim used it, a Classic run fell
 * from 22 turns to EIGHT at a 100% win rate with the 1200-cap room full.
 */
describe('promotion is priced, capped and bounded', () => {
  const flyers = PROMOTION_ACTIVITIES[PromotionType.FLYERS];
  const wordOfMouth = PROMOTION_ACTIVITIES[PromotionType.WORD_OF_MOUTH];

  it('quotes a paid promo for the room, like everything else in this economy', () => {
    expect(promotionCost(flyers, { capacity: PROMO_REFERENCE_CAPACITY })).toBe(flyers.cost);
    expect(promotionCost(flyers, { capacity: 30 })).toBeLessThan(flyers.cost);
    expect(promotionCost(flyers, { capacity: 300 })).toBeGreaterThan(flyers.cost);
    // Same defect the guarantee retune fixed: $30 of street team bought ~5 heads
    // in a basement and ~78 at the lodge for the same money.
    expect(promotionCost(flyers, { capacity: 300 })).toBe(flyers.cost * 3);
  });

  it('leaves legwork free of money but not of effort', () => {
    expect(promotionCost(wordOfMouth, { capacity: 300 })).toBe(0);
    expect(promotionStress(wordOfMouth)).toBeGreaterThan(0);
    // Paid activities cost money instead — you either buy it or you do it.
    expect(promotionStress(flyers)).toBe(0);
  });

  it('caps what promotion alone can do to a crowd', () => {
    // Attendance is the master stat; an uncapped multiplicative stack is the same
    // runaway the door deal was, wearing a different hat.
    expect(MAX_PROMO_EFFECTIVENESS).toBeLessThanOrEqual(1.15);
    const stacked = Object.values(PROMOTION_ACTIVITIES).reduce((m, a) => m * a.effectiveness, 1);
    expect(stacked).toBeGreaterThan(MAX_PROMO_EFFECTIVENESS); // the cap has to bind
  });

  it('bounds pushes by the lead time the show was booked on', () => {
    const investment = new Map<PromotionType, number>();
    expect(promoBudgetFor({ promoBudget: 3, turnsUntilShow: 1 })).toBe(3); // the lead booked, not turns left
    expect(promosUsed({ promotionInvestment: investment })).toBe(0);
    investment.set(PromotionType.FLYERS, 2);
    investment.set(PromotionType.RADIO, 1);
    expect(promosUsed({ promotionInvestment: investment })).toBe(3);
    // A show from a save written before budgets falls back to its remaining turns.
    expect(promoBudgetFor({ turnsUntilShow: 4 })).toBe(4);
  });
});

/**
 * A day job used to cost only money and reputation, which made "take a shift" a
 * purely economic decision with no bearing on the thing you're actually doing.
 * The hours come out of promotion now — you can work a shift and still book a
 * show, you just can't work the show as well.
 */
describe('a day job costs you the week', () => {
  it('takes a push out of every show while you are employed', () => {
    const show = { promoBudget: 3, turnsUntilShow: 3 };
    expect(promoBudgetFor(show)).toBe(3);
    expect(promoBudgetFor(show, { workingDayJob: true })).toBe(3 - DAY_JOB_PROMO_COST);
  });

  it('never goes negative on a show booked for tomorrow', () => {
    // Lead time 1 minus the job leaves nothing — that IS the lesson (book
    // further out if you're working), but it must not go below zero and start
    // handing pushes back.
    expect(promoBudgetFor({ promoBudget: 1, turnsUntilShow: 1 }, { workingDayJob: true })).toBe(0);
  });
});

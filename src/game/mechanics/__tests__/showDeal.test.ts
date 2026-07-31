import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GamePhase, VenueType, Genre, Band, Venue, ShowDeal } from '@game/types';

/**
 * Guarantee vs. the door — the oldest argument in booking, now a booking CHOICE.
 *
 * A guarantee is a flat fee and the whole gate is yours. The door is no fee at
 * all: the bill takes DOOR_SPLIT_BAND_SHARE of the raw gate (heads × ticket
 * price), the house keeps the bar, and an empty room costs you nothing. The pure
 * helpers are pinned first; the real prize is the last block, which runs a door
 * show through the ACTUAL resolver and checks that what the ShowBuilder preview
 * quotes is the number the night charges.
 *
 * The engine's collaborators are stubbed the way TurnResolutionEngine's own suite
 * stubs them, but bandEconomy and attendanceProjection are DELIBERATELY NOT
 * mocked — they are the shared helpers whose agreement is the thing under test,
 * and vi.mock would auto-mock them to undefined (this repo's classic NaN trap),
 * leaving us testing the mock instead of the arithmetic the player is shown.
 */
vi.mock('@stores/gameStore');
vi.mock('../SynergyManager');
vi.mock('../DayJobSystem');
vi.mock('../DifficultySystem');
vi.mock('../ShowPromotionSystem');
vi.mock('../VenueUpgradeSystem');
vi.mock('../RunManager');
vi.mock('../MetaProgressionManager');
vi.mock('../GentrificationSystem');

import {
  bandBookingFee,
  dealDrawMult,
  bandDeposit,
  bandGuarantee,
  expectedDraw,
  doorDealRefusal,
  doorDealRoomRefusal,
  GUARANTEE_FLOOR,
  BILL_POSITION_SHARE,
  billPositionShare,
  PROMOTER_CUT,
  doorSplitCost,
  DEPOSIT_POPULARITY_THRESHOLD,
  DOOR_DEAL_DIY_POINTS,
  DOOR_DEAL_DRAW_BONUS,
  DOOR_DEAL_PURIST_AUTHENTICITY,
  DOOR_DEAL_ROOM_CAP,
  DOOR_DEAL_TRUST_REP,
  DOOR_SPLIT_BAND_SHARE,
} from '../bandEconomy';
import { turnResolutionEngine } from '../TurnResolutionEngine';
import { projectBaseAttendance } from '../attendanceProjection';
import { resolveVenueCost } from '../showCosts';
import { bandResponseMult } from '../bandResponse';
import { traitFeeMult } from '../bandTraitEffects';
import { factionSystem } from '../FactionSystem';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem, ScheduledShow, PromotionType } from '../ShowPromotionSystem';
import { difficultySystem, gougeReputationMultiplier } from '../DifficultySystem';
import { dayJobSystem } from '../DayJobSystem';
import { synergyManager } from '../SynergyManager';
import { venueUpgradeSystem } from '../VenueUpgradeSystem';
import { runManager } from '../RunManager';
import { metaProgressionManager } from '../MetaProgressionManager';
import { gentrificationSystem } from '../GentrificationSystem';

const act = (over: Partial<Band> = {}): Band =>
  ({
    id: 'b1',
    name: 'Test Band',
    genre: Genre.PUNK,
    isRealArtist: false,
    subgenres: [],
    traits: [],
    popularity: 50,
    authenticity: 70,
    energy: 80,
    technicalSkill: 60,
    technicalRequirements: [],
    reputation: 40,
    fanbase: 100,
    stress: 20,
    ...over,
  }) as unknown as Band;

// ─────────────────────────────── pure helpers ───────────────────────────────

describe('doorSplitCost — the bill takes a share of what walks in', () => {
  it('charges 60% of the raw gate, rounded to the dollar', () => {
    expect(doorSplitCost(50, 10)).toBe(300); // 500 gate → 300 theirs, 200 yours
    expect(doorSplitCost(37, 15)).toBe(333);
    // Rounded, not floored: 91 × 0.6 = 54.6. Truncating would quietly shave a
    // dollar off the band every night in a basement.
    expect(doorSplitCost(7, 13)).toBe(55);
  });

  it('is exactly the documented share, so retuning the constant retunes the deal', () => {
    for (const [heads, price] of [[12, 5], [88, 15], [301, 22]]) {
      expect(doorSplitCost(heads, price)).toBe(
        Math.round(heads * price * DOOR_SPLIT_BAND_SHARE),
      );
    }
  });

  it('leaves the house the whole bar tab — bar money never enters the split', () => {
    // The split reads heads × TICKET price only. A room with a bar owes the same
    // as a dry room; that asymmetry is the entire reason to own the bar.
    expect(doorSplitCost(60, 12)).toBe(432); // 60 × 12 × 0.6 — no +$5/head anywhere
  });

  it('costs nothing when nobody comes, or when the door is free', () => {
    // The whole pitch of a door deal to a broke promoter: a dead night is a $0
    // night, not a fee you still owe.
    expect(doorSplitCost(0, 15)).toBe(0);
    expect(doorSplitCost(40, 0)).toBe(0);
    expect(doorSplitCost(0, 0)).toBe(0);
  });

  it('never pays the promoter for a negative crowd or price', () => {
    // A negative product would flip the split into INCOME. Both terms are
    // clamped at 0, so garbage state costs zero instead of printing money.
    expect(doorSplitCost(-10, 15)).toBe(0);
    expect(doorSplitCost(40, -15)).toBe(0);
    expect(doorSplitCost(-40, -15)).toBe(0);
  });

  it('stays finite and non-negative across the whole realistic domain', () => {
    for (const heads of [0, 1, 7, 37, 250, 1200]) {
      for (const price of [0, 1, 5, 12, 15, 45]) {
        const cost = doorSplitCost(heads, price);
        expect(Number.isFinite(cost)).toBe(true);
        expect(cost).toBeGreaterThanOrEqual(0);
        expect(cost).toBeLessThanOrEqual(heads * price); // never more than the gate
      }
    }
  });
});

describe('dealDrawMult — skin in the night', () => {
  it('leaves a guarantee show exactly where it was', () => {
    expect(dealDrawMult('guarantee')).toBe(1);
  });

  it('reads a missing deal as a guarantee, so old saves draw the same crowd', () => {
    // Shows written before the deal existed have no `deal` field. If undefined
    // fell through to the door bonus (or worse, NaN'd), every resumed run would
    // silently re-tune itself.
    expect(dealDrawMult(undefined)).toBe(1);
    expect(dealDrawMult('handshake' as ShowDeal)).toBe(1); // corrupt save, not a bonus
  });

  it('gives a door bill the small self-promotion bump', () => {
    expect(dealDrawMult('door')).toBe(DOOR_DEAL_DRAW_BONUS);
    expect(dealDrawMult('door')).toBeCloseTo(1.08, 5);
    // Deliberately small — attendance is the master stat (it feeds fans AND rep
    // AND the gate), so this must stay a nudge, not a strategy.
    expect(DOOR_DEAL_DRAW_BONUS).toBeLessThan(1.15);
  });
});

describe('doorDealRefusal — who will play for a percentage', () => {
  const broke = { isSigned: false, reputation: 0 };

  it('lets any small local act take the door, from a nobody, on principle or not', () => {
    const small = act({
      name: 'Basement Openers',
      popularity: DEPOSIT_POPULARITY_THRESHOLD - 1,
      authenticity: 10,
    });
    expect(doorDealRefusal(small, broke)).toBeNull();
    // Even a cynical little act with a no-name promoter: below the deposit line
    // there is no van payment to protect, so a percentage is fine.
    expect(doorDealRefusal(act({ popularity: 0, authenticity: 0 }), broke)).toBeNull();
  });

  it('refuses for a big non-purist guest whose promoter has no name yet', () => {
    const bigDraw = act({ name: 'Bill Em All', popularity: 80, authenticity: 50 });
    const refusal = doorDealRefusal(bigDraw, {
      isSigned: false,
      reputation: DOOR_DEAL_TRUST_REP - 1,
    });

    expect(refusal).not.toBeNull();
    // The message is what the ShowBuilder prints under the locked option, so it
    // has to name the act that killed the offer on a three-band bill.
    expect(refusal).toContain('Bill Em All');
    expect(refusal).toBe('Bill Em All wants a guarantee');
  });

  it('takes the door once the act is YOURS, is a purist, or your name is good', () => {
    const bigDraw = act({ name: 'Bill Em All', popularity: 80, authenticity: 50 });
    // Signed to your roster — you already share their upside.
    expect(doorDealRefusal(bigDraw, { isSigned: true, reputation: 0 })).toBeNull();
    // A purist would play for gas money anyway.
    const purist = act({
      name: 'Bill Em All',
      popularity: 80,
      authenticity: DOOR_DEAL_PURIST_AUTHENTICITY,
    });
    expect(doorDealRefusal(purist, broke)).toBeNull();
    // Or your rooms are a safe enough bet to gamble on.
    expect(doorDealRefusal(bigDraw, { isSigned: false, reputation: DOOR_DEAL_TRUST_REP })).toBeNull();
  });

  it('pins the three boundaries, because each one is a progression gate', () => {
    // Popularity: the refusal starts exactly where the DEPOSIT does — "big enough
    // to want money up front" and "big enough to want it in writing" are one act.
    const atLine = act({ name: 'At The Line', popularity: DEPOSIT_POPULARITY_THRESHOLD, authenticity: 50 });
    expect(doorDealRefusal(atLine, broke)).not.toBeNull();
    expect(
      doorDealRefusal(act({ name: 'Under', popularity: DEPOSIT_POPULARITY_THRESHOLD - 1, authenticity: 50 }), broke),
    ).toBeNull();

    // Reputation: 40 unlocks the door deal for every big act at once — a real,
    // felt graduation moment, so the edge must not drift.
    const big = act({ name: 'Big', popularity: 70, authenticity: 50 });
    expect(doorDealRefusal(big, { isSigned: false, reputation: DOOR_DEAL_TRUST_REP })).toBeNull();
    expect(doorDealRefusal(big, { isSigned: false, reputation: DOOR_DEAL_TRUST_REP - 1 })).not.toBeNull();

    // Authenticity: the same purist line bandResponse reads (75), not a second one.
    expect(
      doorDealRefusal(act({ name: 'Purist', popularity: 70, authenticity: DOOR_DEAL_PURIST_AUTHENTICITY }), broke),
    ).toBeNull();
    expect(
      doorDealRefusal(act({ name: 'Nearly', popularity: 70, authenticity: DOOR_DEAL_PURIST_AUTHENTICITY - 1 }), broke),
    ).not.toBeNull();
  });
});

// ──────────────── the deal at resolution (and in the preview) ────────────────

describe('the deal at resolution', () => {
  const TICKET_PRICE = 12;

  const mockVenue = {
    id: 'v1',
    name: 'Test Venue',
    type: VenueType.DIY_SPACE,
    capacity: 100,
    acoustics: 70,
    authenticity: 80,
    atmosphere: 75,
    location: {
      id: 'downtown',
      name: 'Downtown',
      sceneStrength: 75,
      gentrificationLevel: 30,
      policePresence: 40,
      rentMultiplier: 1.5,
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      color: '#FF0000',
    },
    rent: 200,
    equipment: [],
    modifiers: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 3,
  };

  const headliner = act();
  const opener = act({ id: 'b2', name: 'The Openers' });

  const mockShow = (over: Partial<ScheduledShow> = {}): ScheduledShow =>
    ({
      id: 'show1',
      bandId: 'b1',
      venueId: 'v1',
      date: new Date(),
      lineup: ['b1'],
      ticketPrice: TICKET_PRICE,
      status: 'SCHEDULED',
      turnsUntilShow: 1,
      promotionInvestment: new Map<PromotionType, number>(),
      // Pre-promo, no hype: the resolver's crowd is then exactly the crowd the
      // BOOKING preview projected, which is what makes preview==resolution
      // testable as an equality rather than a vibe.
      totalPromotionEffectiveness: 1,
      expectedAttendance: 50,
      hype: 0,
      ...over,
    }) as ScheduledShow;

  const makeState = (overrides: Record<string, unknown> = {}) => ({
    currentRound: 1,
    reputation: 50,
    money: 1000,
    fans: 100,
    stress: 20,
    connections: 10,
    diyPoints: 0,
    consecutiveBrokeTurns: 0,
    phase: GamePhase.PLANNING,
    difficulty: 'NORMAL',
    scheduledShows: [] as ScheduledShow[],
    venues: [mockVenue],
    allBands: [headliner, opener],
    rosterBandIds: ['b1'],
    currentCityId: 'test-city', // no city signature → no resolution-only multiplier
    showHistory: [],
    lastTurnResults: [],
    discoveredSynergies: [],
    completedFestivals: [],
    districts: [],
    walkers: [],
    factionStandings: {},
    eventCapacityPenalty: 0,
    nextRound: vi.fn(),
    addMoney: vi.fn(),
    addFans: vi.fn(),
    addReputation: vi.fn(),
    addStress: vi.fn(),
    completeShow: vi.fn(),
    discoverSynergy: vi.fn(),
    setPhase: vi.fn(),
    setFactionStandings: vi.fn(),
    makePathChoice: vi.fn(),
    resetGame: vi.fn(),
    ...overrides,
  });

  let state: ReturnType<typeof makeState>;

  /** The venue rent the resolver charges, via the shared showCosts helper. */
  const venueCostOf = () =>
    resolveVenueCost(mockVenue as unknown as Venue, {
      districts: [],
      currentCityId: 'test-city',
      runVenueRentMult: 1,
      metaVenueDiscountMult: 1,
    });

  /**
   * The ShowBuilder preview, replicated formula for formula (no React needed):
   * the crowd from projectBaseAttendance, and the bill's cost from doorSplitCost
   * on a door deal / the per-act fee on a guarantee. If either call site ever
   * stops routing through these shared helpers and duplicates the maths instead,
   * this diverges from the resolver and the tests below fail.
   */
  const previewFor = (bands: Band[], deal: ShowDeal, ticketPrice = TICKET_PRICE) => {
    const expectedAttendance = projectBaseAttendance({
      bands,
      venue: mockVenue as unknown as Venue,
      cityPrimaryGenre: undefined,
      currentCityId: 'test-city',
      factionStandings: {},
      eventCapacityPenalty: 0,
      ticketPrice,
      deal,
    });
    const bandCost =
      deal === 'door'
        ? doorSplitCost(expectedAttendance, ticketPrice)
        : bands.reduce(
            (sum, b) =>
              sum +
              difficultySystem.getScaledBandCost(
                bandBookingFee(b.popularity, state.rosterBandIds.includes(b.id), mockVenue) *
                  bandResponseMult(b, state.diyPoints, state.reputation) *
                  traitFeeMult(b),
              ),
            0,
          );
    return { expectedAttendance, bandCost, venueCost: venueCostOf() };
  };

  /** Book the given show and resolve the turn; returns its ShowResult. */
  const resolve = async (show: ScheduledShow) => {
    vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
      showsToExecute: [show],
      promotionUpdates: [] as string[],
    });
    const result = await turnResolutionEngine.executeFullTurn();
    return result.showResults[0];
  };

  /** Fresh store + run singletons, so a second show in a test draws like a first. */
  const resetRunState = () => {
    state = makeState();
    turnResolutionEngine.reset();
    // Faction standing DRIFTS on every resolved night and the singleton only
    // re-hydrates from store.factionStandings (empty here), so without this the
    // second show of a test resolves against a different scene than the first.
    factionSystem.reset();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // No incidents (a repair bill would land on top of the costs we're asserting).
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
      showsToExecute: [] as ScheduledShow[],
      promotionUpdates: [] as string[],
    });

    vi.mocked(difficultySystem).applyPassiveDifficulty = vi
      .fn()
      .mockReturnValue({ reputationLost: 0, message: '' });
    vi.mocked(difficultySystem).getDifficultyMilestone = vi.fn().mockReturnValue(null);
    // Auto-mocked module exports come back undefined, which has NaN'd this
    // engine's rep math before — stub every one we depend on, explicitly.
    vi.mocked(gougeReputationMultiplier).mockReturnValue(1);
    vi.mocked(difficultySystem).getShowDifficultyModifiers = vi
      .fn()
      .mockReturnValue({ attendanceMultiplier: 1, revenueMultiplier: 1 });
    vi.mocked(difficultySystem).getScaledVenueCost = vi
      .fn()
      .mockImplementation((cost: number) => cost);
    // Identity (rounded) rather than a flat number, so the REAL guarantee formula
    // shows through and the guarantee assertions below mean something.
    vi.mocked(difficultySystem).getScaledBandCost = vi
      .fn()
      .mockImplementation((cost: number) => Math.round(cost));
    vi.mocked(difficultySystem).isVenueRaided = vi.fn().mockReturnValue(false);
    vi.mocked(difficultySystem).isBandUnavailable = vi.fn().mockReturnValue(false);
    vi.mocked(difficultySystem).consumeTurnBlocks = vi.fn();
    vi.mocked(difficultySystem).resetBlocks = vi.fn();

    vi.mocked(venueUpgradeSystem).calculateUpkeepCost = vi.fn().mockReturnValue(0);
    vi.mocked(venueUpgradeSystem).calculatePassiveIncome = vi
      .fn()
      .mockReturnValue({ money: 0, fans: 0 });
    vi.mocked(venueUpgradeSystem).degradeEquipment = vi.fn();

    vi.mocked(gentrificationSystem).getRentMultiplier = vi.fn().mockReturnValue(1);
    vi.mocked(gentrificationSystem).getAttendanceMultiplier = vi.fn().mockReturnValue(1);
    vi.mocked(gentrificationSystem).applyTurnGentrification = vi
      .fn()
      .mockReturnValue({ notices: [] });

    vi.mocked(dayJobSystem).processJobIncome = vi.fn().mockReturnValue(null);

    vi.mocked(synergyManager).triggerSynergies = vi.fn().mockReturnValue([]);
    vi.mocked(synergyManager).calculateEffectTotal = vi.fn().mockReturnValue(0);
    vi.mocked(synergyManager).getPassiveEffects = vi.fn().mockReturnValue([]);
    vi.mocked(synergyManager).reset = vi.fn();

    vi.mocked(runManager).getCurrentRun = vi.fn().mockReturnValue(null);
    vi.mocked(runManager).syncTurn = vi.fn();
    vi.mocked(runManager).updateRunStats = vi.fn();
    vi.mocked(runManager).endRun = vi.fn();
    vi.mocked(runManager).checkWinConditions = vi.fn().mockReturnValue(false);
    vi.mocked(runManager).getRunModifiers = vi.fn().mockReturnValue({
      moneyMultiplier: 1,
      reputationMultiplier: 1,
      fansMultiplier: 1,
      stressMultiplier: 1,
      venueRentMultiplier: 1,
    });
    vi.mocked(runManager).getStartingBandQualityModifier = vi.fn().mockReturnValue(0);
    vi.mocked(runManager).getStakeIncidentMult = vi.fn().mockReturnValue(1);

    vi.mocked(metaProgressionManager).calculateFameEarned = vi.fn().mockReturnValue(0);
    vi.mocked(metaProgressionManager).updateStats = vi.fn();
    vi.mocked(metaProgressionManager).addAchievements = vi.fn();
    vi.mocked(metaProgressionManager).addCurrency = vi.fn();
    vi.mocked(metaProgressionManager).bankRunOnce = vi.fn().mockReturnValue(true);
    vi.mocked(metaProgressionManager).getProgression = vi.fn().mockReturnValue({
      totalRuns: 0,
      totalScore: 0,
      achievements: [],
      unlocks: [],
      currency: { fame: 0, legacy: 0 },
      stats: {},
      upgrades: [],
    });
    vi.mocked(metaProgressionManager).getRunStartBonuses = vi.fn().mockReturnValue({
      startingMoney: 0,
      startingReputation: 0,
      bandQualityMultiplier: 1,
      venueDiscountMultiplier: 1,
      stressReductionMultiplier: 1,
    });

    resetRunState();
    vi.mocked(useGameStore).getState = vi.fn().mockImplementation(() => state);
    vi.mocked(useGameStore).setState = vi.fn().mockImplementation((patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      Object.assign(state, next);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('a door deal', () => {
    // ── THE IMPORTANT ONE ──
    it('charges a door bill EXACTLY what the ShowBuilder preview quoted', async () => {
      const preview = previewFor([headliner], 'door');
      const result = await resolve(mockShow({ deal: 'door' }));

      // Same crowd: the preview's projectBaseAttendance folds in the deal's draw
      // bonus, so the two agree head for head at zero promo / zero hype.
      expect(result.attendance).toBe(preview.expectedAttendance);
      // Same bill: everything the resolver charged beyond rent IS the door split,
      // and it is the number the player was shown before they booked.
      expect(result.financials.costs - preview.venueCost).toBe(preview.bandCost);
      expect(preview.bandCost).toBe(doorSplitCost(result.attendance, TICKET_PRICE));
      expect(preview.bandCost).toBeGreaterThan(0); // the assertion would be vacuous at 0
    });

    it('quotes and charges the same door split at any ticket price', async () => {
      // The split is the ONE cost that moves when you drag the price slider, so
      // the two call sites have to track each other across the whole range.
      for (const ticketPrice of [5, 12, 25]) {
        resetRunState();
        const preview = previewFor([headliner], 'door', ticketPrice);
        const result = await resolve(mockShow({ deal: 'door', ticketPrice }));

        expect(result.attendance).toBe(preview.expectedAttendance);
        expect(result.financials.costs).toBe(preview.venueCost + preview.bandCost);
      }
    });

    it('charges NO band fees — rent plus a share of the gate, nothing else', async () => {
      const result = await resolve(mockShow({ deal: 'door' }));

      expect(result.financials.costs).toBe(
        venueCostOf() + doorSplitCost(result.attendance, TICKET_PRICE),
      );
      // Zero fee means the per-act guarantee formula is never consulted for this
      // bill: the resolver made no getScaledBandCost call at all.
      expect(difficultySystem.getScaledBandCost).not.toHaveBeenCalled();
    });

    it('charges one split for the whole bill, however many acts are on it', async () => {
      // The headliner negotiates the percentage and the openers get paid out of
      // it, so a two-band door show costs the promoter the same 60% a solo one
      // does. (A guarantee bill, by contrast, pays every act separately.)
      const solo = await resolve(mockShow({ deal: 'door' }));
      const soloSplit = solo.financials.costs - venueCostOf();

      resetRunState();
      const stacked = await resolve(mockShow({ deal: 'door', lineup: ['b1', 'b2'] }));
      const stackedSplit = stacked.financials.costs - venueCostOf();

      expect(soloSplit).toBe(doorSplitCost(solo.attendance, TICKET_PRICE));
      expect(stackedSplit).toBe(doorSplitCost(stacked.attendance, TICKET_PRICE));
      // An equally-popular opener draws more heads (+20% bill bonus), so the
      // split is bigger in dollars — but it is still ONE share of the gate at
      // the same rate per head, not a second act's fee stacked on top.
      expect(stacked.attendance).toBeGreaterThan(solo.attendance);
      expect(stackedSplit / stacked.attendance).toBeCloseTo(soloSplit / solo.attendance, 1);
    });

    it('costs nothing but rent when nobody shows up', async () => {
      // A percentage of an empty room is zero. This is the promise the deal makes
      // to a broke promoter, and the only reason it is worth the 60%.
      state = makeState({ allBands: [act({ popularity: 0 }), opener] });
      const result = await resolve(mockShow({ deal: 'door' }));

      expect(result.attendance).toBe(0);
      expect(result.financials.costs).toBe(venueCostOf());
    });

    it('keeps the split out of reach of escalation and cost-cutting instincts', async () => {
      // A share of the door is a FRACTION, not a dollar amount: an escalation
      // turn can't inflate it and Budget Booker can't trim it. Rent takes both
      // hits; the band's cut is untouched by either.
      state = makeState({ currentRound: 31 }); // inside the last-5-turn escalation window
      vi.mocked(synergyManager).getPassiveEffects = vi
        .fn()
        .mockReturnValue([{ type: 'COST_REDUCTION_PERCENT', value: 20 }]);

      const result = await resolve(mockShow({ deal: 'door' }));

      const rentAfterTransforms = Math.floor(Math.floor(venueCostOf() * 1.5) * 0.8);
      expect(result.financials.costs).toBe(
        rentAfterTransforms + doorSplitCost(result.attendance, TICKET_PRICE),
      );
    });

    it('drifts the promoter DIY for putting the night on themselves', async () => {
      await resolve(mockShow({ deal: 'door' }));

      expect(state.makePathChoice).toHaveBeenCalledWith('door_deal', DOOR_DEAL_DIY_POINTS);
      // Slow drift: events move diyPoints in tens, so a run of door deals is an
      // identity you build rather than a switch you flip.
      expect(DOOR_DEAL_DIY_POINTS).toBeLessThanOrEqual(5);
    });
  });

  // Regression guard: everything about the old flat-fee path — fees, crowd, cred
  // — has to resolve exactly as it did before the deal existed, including for
  // saved shows that carry no `deal` field at all.
  describe('a guarantee show is untouched by any of this', () => {
    it('still pays the flat per-act fee the preview quoted, plus rent', async () => {
      const preview = previewFor([headliner], 'guarantee');
      const result = await resolve(mockShow({ deal: 'guarantee' }));

      expect(result.attendance).toBe(preview.expectedAttendance);
      expect(result.financials.costs).toBe(preview.venueCost + preview.bandCost);
      expect(preview.bandCost).toBeGreaterThan(0);
    });

    it('resolves a save written before deals existed exactly like a guarantee', async () => {
      // `deal` is optional precisely so old saves keep resolving; an absent field
      // must not fall through to a free bill (or a bonus crowd).
      const legacy = await resolve(mockShow({ deal: undefined }));
      const legacyCosts = legacy.financials.costs;
      const legacyAttendance = legacy.attendance;

      resetRunState();
      const preview = previewFor([headliner], 'guarantee');
      const explicit = await resolve(mockShow({ deal: 'guarantee' }));

      expect(legacyAttendance).toBe(explicit.attendance);
      expect(legacyCosts).toBe(explicit.financials.costs);
      expect(legacyCosts).toBe(preview.venueCost + preview.bandCost);
    });

    it('draws a smaller crowd than the same bill on the door', async () => {
      const guaranteed = await resolve(mockShow({ deal: 'guarantee' }));

      resetRunState();
      const onTheDoor = await resolve(mockShow({ deal: 'door' }));

      // The only difference between these two nights is the deal, so the gap IS
      // the draw bonus: a band with skin in the night works the night.
      expect(onTheDoor.attendance).toBeGreaterThan(guaranteed.attendance);
      expect(onTheDoor.attendance).toBe(
        Math.floor(guaranteed.attendance * DOOR_DEAL_DRAW_BONUS),
      );
    });

    it('costs no cred — only the door deal moves the scene-identity needle', async () => {
      await resolve(mockShow({ deal: 'guarantee' }));
      expect(state.makePathChoice).not.toHaveBeenCalled();
    });
  });
});

/**
 * The handshake ceiling — the rule the whole deal balances on.
 *
 * A door deal waives the booking deposit, and no run is won with money, so
 * without a ceiling the deal converts cash you don't need into attendance, which
 * IS both win bars. The balance sim measured it: uncapped, always taking the door
 * with the biggest bookable guest halved a Classic run (23 turns → 11) and pushed
 * the win rate UP. The same line stops the opposite failure — in a big room the
 * gate dwarfs the guarantee, so 60% of it is a trap, not a choice.
 */
describe('the handshake ceiling', () => {
  const room = (capacity: number, name = 'Some Room') => ({ name, capacity });

  it('lets the small rooms deal on a handshake', () => {
    expect(doorDealRoomRefusal(room(30))).toBeNull(); // the basement you start in
    expect(doorDealRoomRefusal(room(DOOR_DEAL_ROOM_CAP))).toBeNull(); // inclusive
  });

  it('turns down anything above the ceiling, and says which room', () => {
    const refusal = doorDealRoomRefusal(room(300, 'Elks Lodge #420'));
    expect(refusal).not.toBeNull();
    expect(refusal).toContain('Elks Lodge #420');
  });

  it('keeps the ceiling below the rooms where the split becomes a trap', () => {
    // Measured: a guarantee is 42-75% of the gate in the 30-cap basement but only
    // 3-7% at 300 cap. The ceiling has to sit under that inversion or the deal
    // reads as a punishment for taking it.
    expect(DOOR_DEAL_ROOM_CAP).toBeLessThan(160);
  });
});

/**
 * The guarantee is quoted FOR THE ROOM.
 *
 * It used to be a function of popularity alone, so the same $225 bought a 20-head
 * basement or a 222-head lodge: a guarantee ran 42-75% of the gate downstairs and
 * 3-7% upstairs, which meant that past the first few rooms *which band you booked
 * cost you almost nothing*. Pricing off the expected draw holds the fee at a
 * roughly steady share of the gate all the way up, which is what makes a
 * percentage deal a live alternative instead of a tax.
 */
describe('a guarantee is quoted for the room', () => {
  const room = (capacity: number, atmosphere = 80) => ({ capacity, atmosphere });

  it('charges more for the same act in a bigger room', () => {
    const act = 55;
    expect(bandGuarantee(act, room(300))).toBeGreaterThan(bandGuarantee(act, room(30)));
  });

  it('charges more for a bigger act in the same room', () => {
    expect(bandGuarantee(85, room(120))).toBeGreaterThan(bandGuarantee(25, room(120)));
  });

  it('holds a roughly steady share of the gate up the whole ladder', () => {
    // The actual defect being guarded. At a $15 door, across the demo's venue
    // ladder, the fee's share of the gate must stay inside one band — not swing
    // 25x from basement to lodge the way the popularity-only curve did.
    const P = 15;
    const shares = [30, 70, 90, 120, 200, 300, 500].map((cap) => {
      const v = room(cap);
      const heads = expectedDraw(55, v);
      return bandGuarantee(55, v) / (heads * P);
    });
    const spread = Math.max(...shares) / Math.min(...shares);
    expect(spread).toBeLessThan(2); // was ~25 before the retune
  });

  it('never quotes below the floor, however small the room or the act', () => {
    expect(bandGuarantee(0, room(0, 0))).toBe(GUARANTEE_FLOOR);
    expect(bandGuarantee(-5, room(-10, -10))).toBe(GUARANTEE_FLOOR);
  });

  it('still discounts a signed act to the promoter cut', () => {
    const v = room(120);
    expect(bandBookingFee(55, true, v)).toBeCloseTo(bandGuarantee(55, v) * (1 - PROMOTER_CUT), 5);
    expect(bandBookingFee(55, false, v)).toBe(bandGuarantee(55, v));
  });

  it('sizes the deposit to the room too, so a big room is a real commitment', () => {
    const small = bandDeposit(55, false, room(30));
    const big = bandDeposit(55, false, room(300));
    expect(big).toBeGreaterThan(small);
    // Under the threshold nobody asks for anything, whatever the room.
    expect(bandDeposit(DEPOSIT_POPULARITY_THRESHOLD - 1, false, room(300))).toBe(0);
  });
});

/**
 * Building a bill has to pay for itself.
 *
 * Room-quoted guarantees nearly broke this. An extra act lifts the crowd by only
 * +20%, so quoting every act its own full room price meant each addition needed
 * pricePenalty × (ticket + bar) to clear GUARANTEE_PER_HEAD / 0.2 a head just to
 * break even — measured, the third act lost $80-$181 in every bar room. Festival
 * is won by running 18 multi-band bills, and two of the run challenges ask for
 * bill depth, so "adding an act is a mistake" is not a balance nudge, it is the
 * game arguing with itself. Openers are paid like openers instead.
 */
describe('building a bill pays for itself', () => {
  const room = { capacity: 200, atmosphere: 80 };

  it('pays an opener a fraction of a headliner, for the same act', () => {
    const head = bandBookingFee(60, false, room, 0);
    expect(bandBookingFee(60, false, room, 1)).toBeLessThan(head);
    expect(bandBookingFee(60, false, room, 2)).toBeLessThan(bandBookingFee(60, false, room, 1));
  });

  it('treats slot 0 as the headliner and clamps anything past the bill', () => {
    expect(billPositionShare(0)).toBe(1);
    expect(billPositionShare(-3)).toBe(1); // garbage index can't pay MORE than the headliner
    expect(billPositionShare(9)).toBe(BILL_POSITION_SHARE[BILL_POSITION_SHARE.length - 1]);
  });

  it('keeps every extra act cheaper than the crowd it brings', () => {
    // The actual regression guard, in the resolver's own terms: an act at slot n
    // costs its share of the quote, and brings +20% of the bill's crowd. If a
    // marginal act ever costs more than it grosses at a fair door, deep bills
    // become a trap again.
    const BILL_ATTENDANCE_STEP = 0.2;
    for (const cap of [30, 90, 200, 500]) {
      for (const price of [10, 15, 25]) {
        const v = { capacity: cap, atmosphere: 80 };
        const soloHeads = expectedDraw(60, v);
        for (const slot of [1, 2]) {
          const marginalFee = bandBookingFee(60, false, v, slot);
          // Deliberately pessimistic: no bar, and the crowd step is taken off the
          // SOLO draw rather than the fuller bill's.
          const marginalGross = BILL_ATTENDANCE_STEP * soloHeads * price;
          expect(
            marginalGross,
            `slot ${slot} in a ${cap}-cap room at $${price} costs more than it brings`,
          ).toBeGreaterThan(marginalFee);
        }
      }
    }
  });
});

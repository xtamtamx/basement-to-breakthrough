import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { turnResolutionEngine } from '../TurnResolutionEngine';
import { useGameStore } from '@stores/gameStore';
import { GamePhase, VenueType, Genre } from '@game/types';

// Mock dependencies
vi.mock('@stores/gameStore');
vi.mock('../SynergyManager');
vi.mock('../DayJobSystem');
vi.mock('../DifficultySystem');
vi.mock('../ShowPromotionSystem');
vi.mock('../VenueUpgradeSystem');
vi.mock('../RunManager');
vi.mock('../MetaProgressionManager');
vi.mock('../GentrificationSystem');

// Import after mocking
import { showPromotionSystem, ScheduledShow, PromotionType } from '../ShowPromotionSystem';
import { difficultySystem } from '../DifficultySystem';
import { dayJobSystem } from '../DayJobSystem';
import { synergyManager } from '../SynergyManager';
import { venueUpgradeSystem } from '../VenueUpgradeSystem';
import { runManager } from '../RunManager';
import { metaProgressionManager } from '../MetaProgressionManager';
import { gentrificationSystem } from '../GentrificationSystem';

describe('TurnResolutionEngine', () => {
  const mockBand = {
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
  };

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

  const mockShow: ScheduledShow = {
    id: 'show1',
    bandId: 'b1',
    venueId: 'v1',
    date: new Date(),
    bill: {
      headliner: 'b1',
      openers: [],
      dynamics: {
        chemistryScore: 0,
        dramaRisk: 0,
        crowdAppeal: 0,
        sceneAlignment: 0,
      },
    },
    ticketPrice: 10,
    status: 'SCHEDULED',
    turnsUntilShow: 1,
    promotionInvestment: new Map<PromotionType, number>(),
    totalPromotionEffectiveness: 1,
    expectedAttendance: 50,
    hype: 0,
  };

  const makeState = (overrides: Record<string, unknown> = {}) => ({
    currentRound: 1,
    reputation: 50,
    money: 1000,
    fans: 100,
    stress: 20,
    connections: 10,
    consecutiveBrokeTurns: 0,
    phase: GamePhase.PLANNING,
    difficulty: 'NORMAL',
    scheduledShows: [mockShow],
    venues: [mockVenue],
    allBands: [mockBand],
    rosterBandIds: ['b1'],
    showHistory: [],
    lastTurnResults: [],
    discoveredSynergies: [],
    completedFestivals: [],
    districts: [],
    walkers: [],
    factionStandings: {},
    nextRound: vi.fn(),
    addMoney: vi.fn(),
    addFans: vi.fn(),
    addReputation: vi.fn(),
    addStress: vi.fn(),
    completeShow: vi.fn(),
    discoverSynergy: vi.fn(),
    setPhase: vi.fn(),
    setFactionStandings: vi.fn(),
    resetGame: vi.fn(),
    ...overrides,
  });

  let state: ReturnType<typeof makeState>;

  beforeEach(() => {
    vi.clearAllMocks();

    // No incidents during tests (10% base chance otherwise)
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
      showsToExecute: [] as ScheduledShow[],
      promotionUpdates: [] as string[],
    });

    vi.mocked(difficultySystem).applyPassiveDifficulty = vi.fn().mockReturnValue({
      reputationLost: 0,
      message: '',
    });
    vi.mocked(difficultySystem).getDifficultyMilestone = vi.fn().mockReturnValue(null);
    vi.mocked(difficultySystem).getShowDifficultyModifiers = vi.fn().mockReturnValue({
      attendanceMultiplier: 1,
      revenueMultiplier: 1,
    });
    vi.mocked(difficultySystem).getScaledVenueCost = vi
      .fn()
      .mockImplementation((cost: number) => cost);
    vi.mocked(difficultySystem).getScaledBandCost = vi.fn().mockReturnValue(25);
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
    vi.mocked(gentrificationSystem).getAttendanceMultiplier = vi
      .fn()
      .mockReturnValue(1);
    vi.mocked(gentrificationSystem).applyTurnGentrification = vi
      .fn()
      .mockReturnValue({ notices: [] });

    vi.mocked(dayJobSystem).processJobIncome = vi.fn().mockReturnValue(null);

    vi.mocked(synergyManager).triggerSynergies = vi.fn().mockReturnValue([]);
    vi.mocked(synergyManager).calculateEffectTotal = vi.fn().mockReturnValue(0);
    vi.mocked(synergyManager).getPassiveEffects = vi.fn().mockReturnValue([]);
    vi.mocked(synergyManager).reset = vi.fn();

    // No formal run by default — ceremony paths are tested explicitly
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
    vi.mocked(runManager).getStartingBandQualityModifier = vi
      .fn()
      .mockReturnValue(0);
    // Without this the auto-mock returns undefined and incidentChance goes
    // NaN — which never fires, but for the wrong reason. With it, the real
    // 10% base applies and the 0.99 random mock above keeps tests incident-free.
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

    state = makeState();
    vi.mocked(useGameStore).getState = vi.fn().mockImplementation(() => state);
    // Merge writes into `state` (like real zustand) so store-backed counters
    // such as consecutiveBrokeTurns accumulate across executeFullTurn calls.
    vi.mocked(useGameStore).setState = vi.fn().mockImplementation((patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      Object.assign(state, next);
    });

    // Singleton holds broke-turn state between tests
    turnResolutionEngine.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeFullTurn', () => {
    it('returns a result compatible with TurnResultsModal plus run structure', async () => {
      const result = await turnResolutionEngine.executeFullTurn();

      expect(Array.isArray(result.showResults)).toBe(true);
      expect(typeof result.totalUpkeep).toBe('number');
      expect(result.turn).toBe(1);
      expect(result.isEscalation).toBe(false);
      expect(result.runEnd).toBeNull();
      expect(result.ceremony).toBeNull();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.synergyEffects)).toBe(true);
    });

    it('advances the round when the run continues', async () => {
      await turnResolutionEngine.executeFullTurn();

      expect(state.nextRound).toHaveBeenCalled();
      expect(state.setPhase).not.toHaveBeenCalledWith(GamePhase.GAME_OVER);
    });

    it('charges scene overhead (scaled by fans + rep) instead of per-venue rent', async () => {
      const result = await turnResolutionEngine.executeFullTurn();

      // sceneOverheadPerTurn(fans=100, rep=50) = 14 + 10 + 25 = 49, times the
      // mocked run rent multiplier (1) + mocked equipment upkeep (0); venue
      // rent is paid per show, never per turn for unbooked city venues
      expect(result.totalUpkeep).toBe(49);
      expect(state.addMoney).toHaveBeenCalledWith(-49);
    });

    it('passes through day job results', async () => {
      vi.mocked(dayJobSystem).processJobIncome = vi.fn().mockReturnValue({
        money: 50,
        reputationLoss: 2,
        fanLoss: 1,
        stressGain: 5,
        message: 'Worked at the record store',
      });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.dayJobResult?.money).toBe(50);
    });

    it('passes through difficulty events', async () => {
      vi.mocked(difficultySystem).applyPassiveDifficulty = vi.fn().mockReturnValue({
        reputationLost: 0,
        message: 'Increased police presence in the area',
      });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.difficultyEvent?.message).toBe(
        'Increased police presence in the area',
      );
    });

    it('executes scheduled shows and records them', async () => {
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.showResults).toHaveLength(1);
      expect(result.showResults[0].success).toBe(true);
      expect(result.showResults[0].attendance).toBeGreaterThan(0);
      expect(state.completeShow).toHaveBeenCalled();
    });

    it('deducts each show\'s band + venue costs from money', async () => {
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });

      const result = await turnResolutionEngine.executeFullTurn();
      const costs = result.showResults[0].financials.costs;

      // completeShow banks gross revenue; the engine then deducts the costs
      // (without this, venue rent / gentrification creep would be cosmetic)
      expect(costs).toBeGreaterThan(0);
      expect(state.addMoney).toHaveBeenCalledWith(-costs);
    });

    it('applies the run reputation modifier to show rep gains', async () => {
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });
      vi.mocked(runManager).getRunModifiers = vi.fn().mockReturnValue({
        moneyMultiplier: 1,
        reputationMultiplier: 2,
        fansMultiplier: 1,
        stressMultiplier: 1,
        venueRentMultiplier: 1,
      });

      const result = await turnResolutionEngine.executeFullTurn();

      // base rep gain is attendance/10; ×2 from the Speed-style modifier
      expect(result.showResults[0].reputationChange).toBeGreaterThan(0);
      expect(result.showResults[0].stressGain).toBeGreaterThan(0);
    });

    it('creates a failed result when venue or band is missing', async () => {
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [{ ...mockShow, venueId: 'invalid-venue-id' }],
        promotionUpdates: [] as string[],
      });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.showResults).toHaveLength(1);
      expect(result.showResults[0].success).toBe(false);
      expect(result.showResults[0].reputationChange).toBeLessThan(0);
    });

    it('cancels shows at a raided venue instead of executing them', async () => {
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });
      vi.mocked(difficultySystem).isVenueRaided = vi
        .fn()
        .mockImplementation((id: string) => id === 'v1');

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.showResults).toHaveLength(1);
      expect(result.showResults[0].success).toBe(false);
      expect(result.showResults[0].attendance).toBe(0);
      expect(result.showResults[0].reputationChange).toBe(-8);
      // Raid blocks are consumed so the penalty lasts exactly one turn
      expect(difficultySystem.consumeTurnBlocks).toHaveBeenCalled();
      // The -8 routes ONLY through completeShow (reputationChange); it must
      // NOT also be applied directly, or it lands twice (-16).
      expect(state.addReputation).not.toHaveBeenCalled();
    });

    it('counts every band in a multi-band lineup for cost and draw', async () => {
      const opener = { ...mockBand, id: 'b2', name: 'Opener', popularity: 90 };
      state = makeState({ allBands: [mockBand, opener] });
      const billed = { ...mockShow, lineup: ['b1', 'b2'] };
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [billed],
        promotionUpdates: [] as string[],
      });

      const result = await turnResolutionEngine.executeFullTurn();

      // Two bands x mocked getScaledBandCost(25) = 50 band cost + 200 rent = 250
      expect(result.showResults[0].financials.costs).toBe(250);
    });

    it('refuses to resolve a turn once the run is over', async () => {
      state = makeState({ phase: GamePhase.GAME_OVER });
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.showResults).toHaveLength(0);
      expect(state.nextRound).not.toHaveBeenCalled();
      expect(state.addMoney).not.toHaveBeenCalled();
    });

    it('pays passive income from owned recording gear', async () => {
      vi.mocked(venueUpgradeSystem).calculatePassiveIncome = vi
        .fn()
        .mockReturnValue({ money: 120, fans: 8 });

      await turnResolutionEngine.executeFullTurn();

      expect(state.addMoney).toHaveBeenCalledWith(120);
      expect(state.addFans).toHaveBeenCalledWith(8);
    });
  });

  describe('venue upgrade effects', () => {
    const makeUpgrade = (effects: Record<string, number>) => ({
      id: 'test-upgrade',
      name: 'Test Upgrade',
      description: '',
      cost: 1000,
      type: 'AMENITIES',
      tier: 1,
      effects,
    });

    // Book the same show at the given venue and return its resolved result.
    const runShowAt = async (venue: Record<string, unknown>) => {
      state = makeState({ venues: [venue] });
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });
      const result = await turnResolutionEngine.executeFullTurn();
      return result.showResults[0];
    };

    it('raises show revenue by the summed upgrade revenue percent', async () => {
      const baseline = await runShowAt(mockVenue);
      const upgraded = await runShowAt({
        ...mockVenue,
        upgrades: [makeUpgrade({ revenue: 20 })],
      });

      // Same room, same bill, same RNG — the +20% VIP-style bonus is the only
      // difference, so the take must be exactly 1.2x (floored).
      expect(upgraded.attendance).toBe(baseline.attendance);
      expect(upgraded.revenue).toBe(Math.floor(baseline.revenue * 1.2));
      expect(upgraded.revenue).toBeGreaterThan(baseline.revenue);
    });

    it('lowers incident chance with a security upgrade', async () => {
      // 0.05 lands under the 10% base incident chance, so the unsecured show
      // rolls an incident...
      vi.spyOn(Math, 'random').mockReturnValue(0.05);
      const unsecured = await runShowAt(mockVenue);
      expect(unsecured.incidentOccurred).toBe(true);

      // ...while Hire Security's -20 points floor the chance at 0.
      const secured = await runShowAt({
        ...mockVenue,
        upgrades: [makeUpgrade({ incidentChance: -20, authenticity: -10 })],
      });
      expect(secured.incidentOccurred).toBe(false);
      expect(secured.incidents).toHaveLength(0);
    });

    it('raises incident chance with the outdoor-expansion gamble', async () => {
      // 0.12 clears the 10% base but not base+5 points from the upgrade.
      vi.spyOn(Math, 'random').mockReturnValue(0.12);
      const indoor = await runShowAt(mockVenue);
      expect(indoor.incidentOccurred).toBe(false);

      const outdoor = await runShowAt({
        ...mockVenue,
        upgrades: [makeUpgrade({ incidentChance: 5 })],
      });
      expect(outdoor.incidentOccurred).toBe(true);
    });

    it('does not double-count upgrade capacity already baked into venue.capacity', async () => {
      // applyUpgrade bakes +25 into capacity at purchase; the upgrade entry
      // remains on the venue. Resolution must read the baked 125 only.
      const bakedOnly = await runShowAt({ ...mockVenue, capacity: 125 });
      const bakedWithUpgradeEntry = await runShowAt({
        ...mockVenue,
        capacity: 125,
        upgrades: [makeUpgrade({ capacity: 25 })],
      });

      expect(bakedWithUpgradeEntry.attendance).toBe(bakedOnly.attendance);
      expect(bakedWithUpgradeEntry.revenue).toBe(bakedOnly.revenue);
    });
  });

  describe('endgame', () => {
    it('ends the run with BREAKTHROUGH_WIN at the thresholds', async () => {
      state = makeState({ reputation: 100, fans: 600 });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.runEnd?.reason).toBe('BREAKTHROUGH_WIN');
      expect(state.setPhase).toHaveBeenCalledWith(GamePhase.GAME_OVER);
      expect(state.nextRound).not.toHaveBeenCalled();
    });

    it('ends the run with BURNOUT_LOSS at max stress', async () => {
      state = makeState({ stress: 100 });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.runEnd?.reason).toBe('BURNOUT_LOSS');
      expect(state.setPhase).toHaveBeenCalledWith(GamePhase.GAME_OVER);
      // No formal run active → no ceremony, and nothing recorded
      expect(result.ceremony).toBeNull();
      expect(metaProgressionManager.updateStats).not.toHaveBeenCalled();
    });

    it('ends the run with FADE_OUT_LOSS at the turn cap', async () => {
      state = makeState({ currentRound: 35 });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.runEnd?.reason).toBe('FADE_OUT_LOSS');
      expect(result.runEnd?.turn).toBe(35);
    });

    it("honors the active run's per-config turn cap (Speed = 20)", async () => {
      const speedRun = {
        config: { id: 'speed', maxTurns: 20 },
        stats: { totalShows: 0, totalRevenue: 0, totalFans: 0, bandsManaged: 0, disasters: 0 },
      };
      vi.mocked(runManager).getCurrentRun = vi.fn().mockReturnValue(speedRun);
      vi.mocked(runManager).checkWinConditions = vi.fn().mockReturnValue(false);
      // runEnd fires → concludeRun runs, so endRun must return a real result
      vi.mocked(runManager).endRun = vi.fn().mockReturnValue({
        success: false, score: 0, achievements: [], unlocks: [],
        stats: speedRun.stats, newHighScore: false,
      });
      state = makeState({ currentRound: 20 });

      const result = await turnResolutionEngine.executeFullTurn();

      // Fades out at the config cap (20), not the global 35
      expect(result.runEnd?.reason).toBe('FADE_OUT_LOSS');
    });

    it('opens escalation in the last 5 turns relative to the cap', async () => {
      vi.mocked(runManager).getCurrentRun = vi.fn().mockReturnValue({
        config: { id: 'speed', maxTurns: 20 },
        stats: { totalShows: 0, totalRevenue: 0, totalFans: 0, disasters: 0 },
      });
      vi.mocked(runManager).checkWinConditions = vi.fn().mockReturnValue(false);
      state = makeState({ currentRound: 16 }); // 20 - 4

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.isEscalation).toBe(true);
    });

    it('evicts after three consecutive broke turns, with warnings first', async () => {
      state = makeState({ money: 0 });

      const first = await turnResolutionEngine.executeFullTurn();
      expect(first.runEnd).toBeNull();
      expect(first.warnings.some((w) => w.includes('EVICTION WARNING: 1/3'))).toBe(true);

      const second = await turnResolutionEngine.executeFullTurn();
      expect(second.runEnd).toBeNull();

      const third = await turnResolutionEngine.executeFullTurn();
      expect(third.runEnd?.reason).toBe('EVICTION_LOSS');
    });

    it('recovers the broke counter after a solvent turn', async () => {
      state = makeState({ money: 0 });
      await turnResolutionEngine.executeFullTurn();
      await turnResolutionEngine.executeFullTurn();

      state = makeState({ money: 500 });
      await turnResolutionEngine.executeFullTurn();

      state = makeState({ money: 0 });
      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.runEnd).toBeNull();
      expect(result.warnings.some((w) => w.includes('EVICTION WARNING: 1/3'))).toBe(true);
    });

    it('flags escalation turns and raises show costs', async () => {
      state = makeState({ currentRound: 31 });
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow],
        promotionUpdates: [] as string[],
      });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.isEscalation).toBe(true);
      expect(result.warnings.some((w) => w.includes('ESCALATION'))).toBe(true);
      // Base costs: 1 band x 25 + 200 rent = 225; escalated x1.5 = 337
      expect(result.showResults[0].financials.costs).toBe(337);
    });
  });

  describe('ceremony', () => {
    const activeRun = {
      runId: 'run-1',
      config: { id: 'classic', maxTurns: 50 },
      currentTurn: 1,
      stats: {
        totalShows: 2,
        totalRevenue: 800,
        totalFans: 40,
        peakReputation: 60,
        bandsManaged: 3,
        venuesPlayed: 1,
        billsCreated: 0,
        perfectShows: 0,
        disasters: 0,
      },
    };

    beforeEach(() => {
      vi.mocked(runManager).getCurrentRun = vi
        .fn()
        .mockReturnValue(activeRun);
      vi.mocked(runManager).checkWinConditions = vi.fn().mockReturnValue(true);
      vi.mocked(runManager).endRun = vi.fn().mockReturnValue({
        success: true,
        score: 1234.6,
        achievements: [
          { id: 'a1', name: 'Sold Out', description: 'Packed the house' },
        ],
        unlocks: [],
        stats: activeRun.stats,
        newHighScore: true,
      });
      vi.mocked(metaProgressionManager).calculateFameEarned = vi
        .fn()
        .mockReturnValue(123);
      vi.mocked(metaProgressionManager).getProgression = vi
        .fn()
        .mockReturnValue({
          totalRuns: 5,
          totalScore: 9000,
          achievements: [],
          unlocks: [],
          currency: { fame: 500, legacy: 0 },
          stats: {},
          upgrades: [],
        });
      vi.mocked(metaProgressionManager).getRunStartBonuses = vi
        .fn()
        .mockReturnValue({
          startingMoney: 50,
          startingReputation: 5,
          bandQualityMultiplier: 1,
          venueDiscountMultiplier: 1,
          stressReductionMultiplier: 1,
        });
    });

    it('banks the run into meta-progression and returns the payload on a win', async () => {
      state = makeState({ reputation: 100, fans: 600 });

      const result = await turnResolutionEngine.executeFullTurn();

      expect(result.ceremony).not.toBeNull();
      expect(result.ceremony?.isWin).toBe(true);
      expect(result.ceremony?.score).toBe(1235);
      expect(result.ceremony?.fameEarned).toBe(123);
      expect(result.ceremony?.newHighScore).toBe(true);
      expect(result.ceremony?.achievements[0].name).toBe('Sold Out');
      expect(result.ceremony?.lifetime).toEqual({ totalRuns: 5, fame: 500 });
      expect(result.ceremony?.nextRunBonuses).toEqual({
        startingMoney: 50,
        startingReputation: 5,
      });

      // Engine verdict overrides RunManager's own win check
      expect(runManager.endRun).toHaveBeenCalledWith(expect.anything(), true);
      // Fame is banked once, keyed on the run id, not via a raw addCurrency
      expect(metaProgressionManager.bankRunOnce).toHaveBeenCalledWith(
        'run-1',
        123,
      );
      expect(metaProgressionManager.updateStats).toHaveBeenCalled();
      expect(metaProgressionManager.addAchievements).toHaveBeenCalled();
    });

    it('feeds run stats and the turn counter every turn', async () => {
      await turnResolutionEngine.executeFullTurn();

      expect(runManager.syncTurn).toHaveBeenCalledWith(1);
      expect(runManager.updateRunStats).toHaveBeenCalled();
    });
  });

  describe('getEscalationStatus', () => {
    it('reports escalation multipliers inside the window', () => {
      const status = turnResolutionEngine.getEscalationStatus(32);

      expect(status.isEscalation).toBe(true);
      expect(status.costMultiplier).toBe(1.5);
      expect(status.incidentMultiplier).toBe(2.0);
      expect(status.turnsRemaining).toBe(3);
    });

    it('reports no escalation before the window', () => {
      const status = turnResolutionEngine.getEscalationStatus(10);

      expect(status.isEscalation).toBe(false);
      expect(status.costMultiplier).toBe(1);
    });
  });
});

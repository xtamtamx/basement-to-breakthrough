/**
 * TurnResolutionEngine - THE single authoritative turn-resolution entrypoint
 *
 * Turn Resolution Order (per PRD.md):
 * 1. Turn start triggers (synergies)
 * 2. Player actions (handled by UI, before this is called)
 * 3. Show resolution (promotion pipeline, bills, equipment, difficulty)
 * 4. Turn economy (venue rent/upkeep, day jobs, passive difficulty)
 * 5. End-of-turn triggers
 * 6. Endgame check, then turn increment
 */

import { useGameStore } from '@stores/gameStore';
import { synergyManager, SynergyTriggerResult } from './SynergyManager';
import { synergyEngine } from './SynergyEngine';
import { eventCardSystem } from './EventCardSystem';
import { walkerSystem } from './WalkerSystem';
import { dayJobSystem } from './DayJobSystem';
import { difficultySystem } from './DifficultySystem';
import { showPromotionSystem } from './ShowPromotionSystem';
import { venueUpgradeSystem } from './VenueUpgradeSystem';
import { runManager } from './RunManager';
import { metaProgressionManager } from './MetaProgressionManager';
import { gentrificationSystem } from './GentrificationSystem';
import {
  getCityLandmarks,
  districtLandmarkMods,
  landmarkPassiveMoney,
  metaProgressValue,
} from '../world/landmarks';
import { recordCityUnlocks } from '../world/cityUnlocks';
import { cityGenreFit } from '../world/citySynergy';
import { getCitySignature } from '../world/citySignatures';
import { captureRuntimeSnapshot } from '../persistence/runtimeSnapshot';
import { devLog } from '@utils/devLogger';
import {
  MAX_TURNS,
  ESCALATION_START_TURN,
  ESCALATION_COST_MULTIPLIER,
  ESCALATION_INCIDENT_MULTIPLIER,
  BREAKTHROUGH_REPUTATION_THRESHOLD,
  BREAKTHROUGH_FANS_THRESHOLD,
  BURNOUT_STRESS_CAP,
  EVICTION_TURNS_BROKE,
  LIVING_COSTS_PER_TURN,
  SHOW_STRESS_BASE,
  STRESS_RECOVERY_PER_TURN,
  COMBO_MULT_CAP,
  SYNERGY_REWARD_TURNS,
  EVENT_CARD_TURNS,
  RunEndState,
} from '../constants/runConstants';
import {
  Show,
  ShowResult,
  Incident,
  IncidentType,
  ConsequenceType,
  GamePhase,
} from '@game/types';

export interface DayJobTurnResult {
  money: number;
  reputationLoss: number;
  fanLoss: number;
  stressGain: number;
  message: string;
  randomEvent?: {
    message: string;
    effects: {
      money?: number;
      reputation?: number;
      fans?: number;
      stress?: number;
    };
  };
}

export interface DifficultyTurnEvent {
  message: string;
  reputationLost: number;
}

/** End-of-run ceremony payload: score, meta-currency, and legacy context */
export interface RunCeremony {
  isWin: boolean;
  score: number;
  fameEarned: number;
  newHighScore: boolean;
  achievements: { id: string; name: string; description: string }[];
  unlocks: string[];
  lifetime: {
    totalRuns: number;
    fame: number;
  };
  nextRunBonuses: {
    startingMoney: number;
    startingReputation: number;
  };
}

export interface TurnResult {
  // Consumed by TurnResultsModal
  showResults: ShowResult[];
  /** Flat living costs + equipment upkeep (venue rent is per-show, not per-turn) */
  totalUpkeep: number;
  /** Per-turn passive payout from owned gear + sellout landmarks (recording sales, etc.) */
  passiveIncome?: { money: number; fans: number };
  dayJobResult?: DayJobTurnResult;
  difficultyEvent?: DifficultyTurnEvent;
  // Phase A run structure
  turn: number;
  isEscalation: boolean;
  warnings: string[];
  runEnd: RunEndState | null;
  ceremony: RunCeremony | null;
  synergyEffects: SynergyTriggerResult[];
}

export class TurnResolutionEngine {
  // The active run's turn cap and the turn its escalation window opens. Modes
  // differ in length (Speed 20 ... Hardcore 100); escalation is always the
  // last (MAX_TURNS - ESCALATION_START_TURN + 1) turns of whatever the cap is.
  private getRunBounds(): { maxTurns: number; escalationStart: number } {
    const maxTurns = runManager.getCurrentRun()?.config.maxTurns ?? MAX_TURNS;
    const escalationStart = maxTurns - (MAX_TURNS - ESCALATION_START_TURN);
    return { maxTurns, escalationStart };
  }

  async executeFullTurn(): Promise<TurnResult> {
    const store = useGameStore.getState();
    const turn = store.currentRound;
    const { maxTurns, escalationStart } = this.getRunBounds();
    const isEscalation = turn >= escalationStart;

    // The run is over — refuse to re-resolve (guards a same-tick double-tap on
    // the run-ending turn, which would double-charge upkeep and re-run events).
    if (store.phase === GamePhase.GAME_OVER) {
      return {
        showResults: [],
        totalUpkeep: 0,
        turn,
        isEscalation,
        warnings: [],
        runEnd: null,
        ceremony: null,
        synergyEffects: [],
      };
    }

    // 1. Turn start triggers
    const turnStartEffects = this.applySynergyPhase('TURN_START');

    // 3. Show resolution (player actions in step 2 happened before this call)
    const { showsToExecute } = showPromotionSystem.processScheduledShows();
    const showResults: ShowResult[] = [];
    // Districts that hosted a show this turn gentrify faster
    const activeDistrictIds = new Set<string>();

    showsToExecute.forEach((scheduledShow) => {
      // Refund the booking deposit now that the show resolves — the full cost
      // is charged below (or, for a cancelled show, nothing is owed).
      const deposit = scheduledShow.bookingDeposit ?? 0;
      if (deposit > 0) store.addMoney(deposit);

      // A venue raided by last turn's police crackdown can't host — the show
      // is cancelled with a reputation hit instead of resolving.
      if (difficultySystem.isVenueRaided(scheduledShow.venueId)) {
        const cancelled = this.createRaidedShowResult(scheduledShow.id);
        showResults.push(cancelled);
        store.completeShow(scheduledShow.id, cancelled);
        return;
      }

      const result = this.executeShow(
        scheduledShow,
        scheduledShow.totalPromotionEffectiveness,
        scheduledShow.hype,
        isEscalation,
      );
      showResults.push(result);
      store.completeShow(scheduledShow.id, result);
      // completeShow banks gross revenue; deduct the show's band + venue costs
      // so rent (gentrification creep, escalation, Hardcore) actually bites.
      if (result.financials.costs > 0) {
        store.addMoney(-result.financials.costs);
      }

      const venue = store.venues.find((v) => v.id === scheduledShow.venueId);
      const band = store.allBands.find((b) => b.id === scheduledShow.bandId);
      if (venue) activeDistrictIds.add(venue.location.id);
      if (venue && band) {
        if (store.venues[0]) {
          walkerSystem.createMusicianWalker(band, store.venues[0], venue);
        }
        const success =
          result.financials.profit > 0 &&
          result.attendance > venue.capacity * 0.5;
        walkerSystem.spawnShowResultWalkers(venue, result.attendance, success);
      }
    });

    // One-turn raid/drama blocks have now done their job this turn; clear them
    // before step 4 declares fresh ones for next turn.
    difficultySystem.consumeTurnBlocks();

    // SHOW_END triggers scale with what the shows actually produced
    const showEndEffects = this.applyShowEndPhase(showResults);

    // 4. Turn economy: living costs + equipment upkeep, day jobs, passive
    // difficulty. Venue rent is paid per show (in executeShow) — charging it
    // again per turn for every city venue double-billed the player.
    // Landmarks your scene has earned (Pillar B). Derived once from current
    // state + cross-run meta, then fed to the economy and gentrification below.
    const landmarks = getCityLandmarks(store.districts, {
      diyPoints: store.diyPoints,
      discoveredCount: store.discoveredSynergies.length,
      cityId: store.currentCityId,
      metaProgress: metaProgressValue(metaProgressionManager.getProgression()),
    });

    let totalUpkeep = LIVING_COSTS_PER_TURN;
    let passiveMoney = landmarkPassiveMoney(landmarks); // sellout monuments pay out
    let passiveFans = 0;
    useGameStore.getState().venues.forEach((venue) => {
      totalUpkeep += venueUpgradeSystem.calculateUpkeepCost(venue);
      const passive = venueUpgradeSystem.calculatePassiveIncome(venue);
      passiveMoney += passive.money;
      passiveFans += passive.fans;
      venueUpgradeSystem.degradeEquipment(venue);
    });
    store.addMoney(-totalUpkeep);
    // Recording gear sells EPs between shows
    if (passiveMoney > 0) store.addMoney(passiveMoney);
    if (passiveFans > 0) store.addFans(passiveFans);

    // Rest between shows sheds some stress (clamped at 0 by addStress), so
    // Burnout is a paced resource, not an inevitable death timer.
    store.addStress(-STRESS_RECOVERY_PER_TURN);

    const jobResult = dayJobSystem.processJobIncome();
    if (jobResult) {
      devLog.log(
        `Day job: +$${jobResult.money}, -${jobResult.reputationLoss} rep, "${jobResult.message}"`,
      );
    }

    const difficultyEvent = difficultySystem.applyPassiveDifficulty();
    const milestone = difficultySystem.getDifficultyMilestone(turn);
    if (milestone && difficultyEvent.message) {
      difficultyEvent.message = `${milestone} ${difficultyEvent.message}`;
    } else if (milestone) {
      difficultyEvent.message = milestone;
    }

    // Districts gentrify with the scene's success — and a DIY scene grows where
    // you play genuine. Fold any threshold-crossing notices into the difficulty msg.
    const gentrification = gentrificationSystem.applyTurnGentrification(
      activeDistrictIds,
      useGameStore.getState().diyPoints,
      districtLandmarkMods(landmarks), // DIY anchors slow the creep + floor the scene
    );
    if (gentrification.notices.length > 0) {
      const notice = gentrification.notices.join(' ');
      difficultyEvent.message = difficultyEvent.message
        ? `${difficultyEvent.message} ${notice}`
        : notice;
    }

    // 5. End-of-turn triggers
    const turnEndEffects = this.applySynergyPhase('TURN_END');

    // Track broke turns for eviction. Lives in the store so it survives a
    // refresh/load (an in-memory counter would reset and grant a free escape
    // from an imminent eviction).
    const postTurnStore = useGameStore.getState();
    const brokeTurns =
      postTurnStore.money <= 0
        ? (postTurnStore.consecutiveBrokeTurns ?? 0) + 1
        : 0;
    useGameStore.setState({ consecutiveBrokeTurns: brokeTurns });

    // Feed the formal run record (score inputs for the ceremony)
    const activeRun = runManager.getCurrentRun();
    if (activeRun) {
      runManager.syncTurn(turn);
      runManager.updateRunStats({
        totalShows: activeRun.stats.totalShows + showResults.length,
        totalRevenue:
          activeRun.stats.totalRevenue +
          showResults.reduce((sum, r) => sum + r.revenue, 0),
        totalFans:
          activeRun.stats.totalFans +
          showResults.reduce((sum, r) => sum + r.fansGained, 0),
        peakReputation: postTurnStore.reputation,
        disasters:
          activeRun.stats.disasters +
          showResults.filter((r) => r.incidentOccurred).length,
      });
    }

    // One-way venue scene-growth ladder: bank the high-water reputation so
    // newly-opened venues stay open (and appear on the map next turn) even if
    // reputation later dips.
    useGameStore.setState((s) => ({
      peakReputation: Math.max(s.peakReputation, s.reputation),
    }));

    const warnings: string[] = [];
    if (isEscalation) {
      warnings.push(
        `ESCALATION: Turn ${turn}/${maxTurns} - Costs +50%, incidents +100%`,
      );
    }
    if (brokeTurns > 0) {
      warnings.push(
        `EVICTION WARNING: ${brokeTurns}/${EVICTION_TURNS_BROKE} turns broke`,
      );
    }
    if (postTurnStore.stress >= BURNOUT_STRESS_CAP - 20) {
      warnings.push(
        `BURNOUT WARNING: Stress at ${postTurnStore.stress}/${BURNOUT_STRESS_CAP}`,
      );
    }

    // Reputation may have crossed a city's unlock threshold — record it (persists
    // cross-run) and announce any newly reachable tour stops.
    const unlockedCities = recordCityUnlocks(postTurnStore.cities ?? [], postTurnStore.reputation);
    unlockedCities.forEach((c) => warnings.push(`NEW CITY UNLOCKED: ${c.name} — book a tour!`));

    // 6. Endgame check, then turn increment
    const runEnd = this.checkEndgame(postTurnStore, turn, brokeTurns);
    let ceremony: RunCeremony | null = null;
    if (runEnd) {
      store.setPhase(GamePhase.GAME_OVER);
      ceremony = this.concludeRun(runEnd, postTurnStore);
    } else {
      store.nextRound();
    }

    // Milestone reward: offer a new equipped synergy ("joker") on reward turns,
    // as long as the run continues and the pool isn't exhausted. The UI shows the
    // SynergyAcquireModal; the offer is transient (re-derives next milestone).
    if (!runEnd && SYNERGY_REWARD_TURNS.includes(turn)) {
      const offer = synergyManager.getRandomAvailableSynergy();
      if (offer) useGameStore.setState({ pendingSynergyOffer: offer });
    }

    // Event card: on event turns (offset from synergy turns so they never share a
    // turn), draw a band-drama / scene crisis that pauses for the player's choice.
    if (!runEnd && EVENT_CARD_TURNS.includes(turn) && !SYNERGY_REWARD_TURNS.includes(turn)) {
      const card = eventCardSystem.drawEventCard({
        turn,
        reputation: postTurnStore.reputation,
        // sceneState is derived (the store has no such field): a DIY-leaning scene
        // is "underground" — this revives police_crackdown's gated requirement.
        sceneState: postTurnStore.diyPoints >= 25 ? 'underground' : 'mainstream',
        activeSynergies: synergyManager.getEquippedSynergies()?.length ?? 0,
        totalCards: postTurnStore.discoveredSynergies?.length ?? 0,
      });
      if (card) useGameStore.setState({ pendingEventCard: card });
    }

    // Persist the run's singleton state so a refresh/load resumes intact.
    useGameStore.setState({
      lastTurnResults: showResults,
      runtimeSnapshot: captureRuntimeSnapshot(),
    });

    return {
      showResults,
      totalUpkeep,
      passiveIncome:
        passiveMoney > 0 || passiveFans > 0
          ? { money: passiveMoney, fans: passiveFans }
          : undefined,
      dayJobResult: jobResult || undefined,
      difficultyEvent: difficultyEvent.message
        ? {
            message: difficultyEvent.message,
            reputationLost: difficultyEvent.reputationLost,
          }
        : undefined,
      turn,
      isEscalation,
      warnings,
      runEnd,
      ceremony,
      synergyEffects: [...turnStartEffects, ...showEndEffects, ...turnEndEffects],
    };
  }

  /**
   * Close out the formal run: score it, bank fame and lifetime stats into
   * meta-progression, and build the ceremony payload for the end screen.
   * Returns null when no formal run is active (e.g. dev hot-reload).
   */
  private concludeRun(
    runEnd: RunEndState,
    store: ReturnType<typeof useGameStore.getState>,
  ): RunCeremony | null {
    const run = runManager.getCurrentRun();
    if (!run) return null;

    const isWin = runEnd.reason === 'BREAKTHROUGH_WIN';
    const configId = run.config.id;
    // Capture before endRun() nulls the active run — banking is keyed on this so
    // a replayed conclusion (load a mid-run save, play it out again) is a no-op
    // for currency.
    const runId = run.runId;
    const result = runManager.endRun(
      {
        money: store.money,
        reputation: store.reputation,
        stress: store.stress,
        connections: store.connections,
      },
      isWin,
    );

    const fameEarned = metaProgressionManager.calculateFameEarned(
      result.score,
      configId,
    );
    metaProgressionManager.updateStats({
      score: result.score,
      totalShows: result.stats.totalShows,
      totalRevenue: result.stats.totalRevenue,
      totalFans: result.stats.totalFans,
      bandsManaged: result.stats.bandsManaged,
    });
    if (result.achievements.length > 0) {
      metaProgressionManager.addAchievements(result.achievements);
    }
    // Credit fame at most once per run id; a replayed conclusion is a no-op.
    metaProgressionManager.bankRunOnce(runId, fameEarned);

    const progression = metaProgressionManager.getProgression();
    const bonuses = metaProgressionManager.getRunStartBonuses();

    return {
      isWin,
      score: Math.round(result.score),
      fameEarned,
      newHighScore: result.newHighScore,
      achievements: result.achievements.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
      })),
      unlocks: result.unlocks.map((u) =>
        typeof u === 'string' ? u : (u as { name?: string }).name ?? String(u),
      ),
      lifetime: {
        totalRuns: progression.totalRuns,
        fame: progression.currency.fame,
      },
      nextRunBonuses: {
        startingMoney: bonuses.startingMoney,
        startingReputation: bonuses.startingReputation,
      },
    };
  }

  /**
   * Trigger a synergy phase and apply its flat resource effects.
   */
  private applySynergyPhase(
    trigger: 'TURN_START' | 'TURN_END',
  ): SynergyTriggerResult[] {
    const store = useGameStore.getState();
    const context = {
      currentTurn: store.currentRound,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
    };

    const effects = synergyManager.triggerSynergies(trigger, context);

    const money = synergyManager.calculateEffectTotal('MONEY_FLAT', effects);
    const reputation = synergyManager.calculateEffectTotal(
      'REPUTATION_FLAT',
      effects,
    );
    const fans = synergyManager.calculateEffectTotal('FANS_FLAT', effects);
    const stress = synergyManager.calculateEffectTotal('STRESS_FLAT', effects);

    if (money !== 0) store.addMoney(money);
    if (reputation !== 0) store.addReputation(reputation);
    if (fans !== 0) store.addFans(fans);
    if (stress !== 0) store.addStress(stress);

    return effects;
  }

  /**
   * SHOW_END triggers fire once after all shows resolve; percentage effects
   * scale with the totals the shows produced this turn.
   */
  private applyShowEndPhase(showResults: ShowResult[]): SynergyTriggerResult[] {
    const store = useGameStore.getState();
    const context = {
      currentTurn: store.currentRound,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
    };

    const effects = synergyManager.triggerSynergies('SHOW_END', context);

    const flatMoney = synergyManager.calculateEffectTotal('MONEY_FLAT', effects);
    const flatRep = synergyManager.calculateEffectTotal(
      'REPUTATION_FLAT',
      effects,
    );
    const flatFans = synergyManager.calculateEffectTotal('FANS_FLAT', effects);
    const pctMoney = synergyManager.calculateEffectTotal(
      'MONEY_PERCENT',
      effects,
    );
    const pctRep = synergyManager.calculateEffectTotal(
      'REPUTATION_PERCENT',
      effects,
    );
    const pctFans = synergyManager.calculateEffectTotal('FANS_PERCENT', effects);

    if (showResults.length > 0) {
      const totalRevenue = showResults.reduce((sum, r) => sum + r.revenue, 0);
      const totalRep = showResults.reduce(
        (sum, r) => sum + (r.reputationChange ?? 0),
        0,
      );
      const totalFans = showResults.reduce((sum, r) => sum + r.fansGained, 0);

      if (pctMoney > 0) store.addMoney(Math.floor((totalRevenue * pctMoney) / 100));
      if (pctRep > 0) store.addReputation(Math.floor((totalRep * pctRep) / 100));
      if (pctFans > 0) store.addFans(Math.floor((totalFans * pctFans) / 100));
    }

    if (flatMoney !== 0) store.addMoney(flatMoney);
    if (flatRep !== 0) store.addReputation(flatRep);
    if (flatFans !== 0) store.addFans(flatFans);

    return effects;
  }

  private executeShow(
    show: Show,
    promotionEffectiveness: number = 1.0,
    hype: number = 0,
    isEscalation: boolean = false,
  ): ShowResult {
    const store = useGameStore.getState();
    const venue = store.venues.find((v) => v.id === show.venueId);
    const mainBand = store.allBands.find((b) => b.id === show.bandId);

    if (!venue || !mainBand) {
      return this.createFailedShowResult(show.id);
    }

    // City↔band scene fit: the local scene turns out for its own sound.
    const currentCity = store.cities?.find((c) => c.id === store.currentCityId);
    const sceneFit = cityGenreFit(currentCity?.primaryGenre, mainBand.genre);
    // Per-city signature: each town plays differently (rent, crowds, incidents…).
    const sig = getCitySignature(store.currentCityId);

    // Get all bands in the show. The live booking path sets show.lineup
    // (band ids, headliner first); the older show.bill is a legacy shape.
    // Support both so multi-band bills actually draw a crowd and get charged.
    const allShowBands = [mainBand];
    const openerIds: string[] = show.lineup
      ? show.lineup.filter((id) => id !== mainBand.id)
      : show.bill
        ? show.bill.openers
        : [];
    openerIds.forEach((bandId) => {
      const band = store.allBands.find((b) => b.id === bandId);
      if (band) allShowBands.push(band);
    });

    // Band+venue COMBO synergies (the "discover powerful combos" pillar): the
    // SAME calculator the ShowBuilder preview shows, now ACTUALLY applied to the
    // result. The product is capped (COMBO_MULT_CAP) so it can't balloon when it
    // stacks on top of the joker/scene-fit/hype/bill/gentrification multipliers.
    const combos = synergyEngine.calculateSynergies(allShowBands, venue);
    const comboMult = Math.min(
      synergyEngine.getTotalMultiplier(combos),
      COMBO_MULT_CAP,
    );
    const comboRep = synergyEngine.getTotalReputationBonus(combos);

    // Trigger SHOW_START synergies
    const synergyContext = {
      currentTurn: store.currentRound,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
      venueType: venue.type,
      bandGenre: mainBand.genre,
    };
    const synergyResults = synergyManager.triggerSynergies(
      'SHOW_START',
      synergyContext,
    );
    const attendanceBonus = synergyManager.calculateEffectTotal(
      'ATTENDANCE_PERCENT',
      synergyResults,
    );

    // Calculate equipment effects. Each scales with condition (gear at <20%
    // condition is treated as broken and contributes nothing).
    let equipmentCapacityBonus = 1;
    let equipmentReputationMultiplier = 1;
    let equipmentQualityBonus = 0; // flat add to venue atmosphere (acoustics + vibe)
    let equipmentStressReduction = 0; // flat stress points shaved off the show
    let equipmentIncidentReduction = 0; // flat % off incident chance

    venue.equipment.forEach((equipment) => {
      if (equipment.owned && equipment.condition > 20) {
        // Equipment needs 20%+ condition to work; effects scale with condition
        const effectMultiplier = equipment.condition / 100;
        const fx = equipment.effects;

        if (fx.capacityBonus) {
          equipmentCapacityBonus += (fx.capacityBonus / 100) * effectMultiplier;
        }
        if (fx.reputationMultiplier) {
          equipmentReputationMultiplier *=
            1 + (fx.reputationMultiplier - 1) * effectMultiplier;
        }
        // A better PA + a better-lit, better-sounding room draws a bigger crowd.
        if (fx.acousticsBonus) equipmentQualityBonus += fx.acousticsBonus * effectMultiplier;
        if (fx.atmosphereBonus) equipmentQualityBonus += fx.atmosphereBonus * effectMultiplier;
        // Backline / green-room gear means bands haul less and rest more.
        if (fx.stressReduction) equipmentStressReduction += fx.stressReduction * effectMultiplier;
        // Pro gear + a door person heads off trouble before it starts.
        if (fx.incidentReduction) equipmentIncidentReduction += fx.incidentReduction * effectMultiplier;
      }
    });

    // Apply venue upgrades to capacity
    const upgradeCapacityBonus =
      venue.upgrades?.reduce((total, upgrade) => {
        return total + (upgrade.effects.capacity || 0);
      }, 0) || 0;

    const effectiveCapacity = Math.floor(
      (venue.capacity + upgradeCapacityBonus) * equipmentCapacityBonus,
    );

    // Calculate base attendance
    const avgPopularity =
      allShowBands.reduce((acc, b) => acc + b.popularity, 0) /
      allShowBands.length;
    // Equipment quality (acoustics + atmosphere) lifts the room's draw, capped
    // so a fully-kitted venue tops out ~1.4x rather than ballooning.
    const venueBonus = Math.min(1.4, (venue.atmosphere + equipmentQualityBonus) / 100);
    const baseAttendance = Math.floor(
      effectiveCapacity * (avgPopularity / 100) * venueBonus,
    );

    const synergyMultiplier = 1 + attendanceBonus / 100;
    const difficultyModifiers = difficultySystem.getShowDifficultyModifiers(
      baseAttendance,
      show.ticketPrice,
    );
    const promotedAttendance = baseAttendance * promotionEffectiveness;
    const hypeMultiplier = 1 + hype / 200; // Up to 50% bonus at max hype
    // A fuller bill draws a bigger crowd (+20% per opener) — this is what
    // makes multi-band shows worth their extra band fees and gives Festival
    // mode its identity.
    const billMultiplier = 1 + 0.2 * Math.max(0, allShowBands.length - 1);
    // Gentrified neighborhoods draw thinner, less authentic crowds
    const gentrificationAttendance = gentrificationSystem.getAttendanceMultiplier(
      venue.location.id,
    );

    const finalAttendance = Math.min(
      Math.floor(
        promotedAttendance *
          synergyMultiplier *
          difficultyModifiers.attendanceMultiplier *
          hypeMultiplier *
          billMultiplier *
          gentrificationAttendance *
          sceneFit.multiplier *
          comboMult *
          (sig?.attendanceMult ?? 1),
      ),
      effectiveCapacity,
    );

    // Calculate revenue
    const ticketRevenue = finalAttendance * show.ticketPrice;
    const barRevenue = venue.hasBar ? finalAttendance * 5 : 0;
    const totalRevenue = ticketRevenue + barRevenue;

    // Per-run modifiers (Speed/Hardcore bend these; Classic = all 1) plus the
    // permanent meta-upgrade bonuses bought with fame (Venue Connections,
    // Zen Master).
    const runMods = runManager.getRunModifiers();
    const metaBonuses = metaProgressionManager.getRunStartBonuses();

    const moneyBonus = synergyManager.calculateEffectTotal(
      'MONEY_PERCENT',
      synergyResults,
    );
    const revenueMultiplier = 1 + moneyBonus / 100;
    const finalRevenue = Math.floor(
      totalRevenue * revenueMultiplier * runMods.moneyMultiplier * (sig?.revenueMult ?? 1),
    );

    // Calculate costs with difficulty scaling; escalation turns raise costs.
    // Rent also creeps up with district gentrification and the run's rent
    // modifier (Hardcore), and varies by the district's base rentMultiplier
    // (looked up live — the value the City view shows the player).
    const liveDistrict = store.districts.find(
      (d) => d.id === venue.location.id,
    );
    const districtRentMult = liveDistrict?.rentMultiplier ?? 1;
    const bandCosts = allShowBands.length * difficultySystem.getScaledBandCost();
    const venueCost = Math.floor(
      difficultySystem.getScaledVenueCost(venue.rent) *
        districtRentMult *
        gentrificationSystem.getRentMultiplier(venue.location.id) *
        runMods.venueRentMultiplier *
        metaBonuses.venueDiscountMultiplier *
        (sig?.rentMult ?? 1),
    );
    let totalCosts = bandCosts + venueCost;
    if (isEscalation) {
      totalCosts = Math.floor(totalCosts * ESCALATION_COST_MULTIPLIER);
    }
    // Budget Booker (PASSIVE joker) trims show costs.
    const costReduction = synergyManager
      .getPassiveEffects()
      .filter((e) => e.type === 'COST_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);
    if (costReduction > 0) {
      totalCosts = Math.floor(totalCosts * (1 - costReduction / 100));
    }

    // Calculate reputation and fan gains with equipment bonus. (Balance pass:
    // gains were ~1 order of magnitude below the win thresholds, making every
    // mode unwinnable; raised the per-show yield so a competent run can climb.)
    let reputationGain = Math.floor(
      (finalAttendance / 5) * equipmentReputationMultiplier,
    );
    let fanGain = Math.floor(finalAttendance / 2);

    const fansBonus = synergyManager.calculateEffectTotal(
      'FANS_PERCENT',
      synergyResults,
    );
    const repBonus = synergyManager.calculateEffectTotal(
      'REPUTATION_PERCENT',
      synergyResults,
    );
    fanGain = Math.floor(fanGain * (1 + fansBonus / 100) * runMods.fansMultiplier * (sig?.fanMult ?? 1));
    reputationGain = Math.floor(
      reputationGain * (1 + repBonus / 100) * runMods.reputationMultiplier * (sig?.repMult ?? 1),
    );
    // Flat reputation from band+venue combos (e.g. True DIY +10).
    reputationGain += comboRep;

    // Playing a show is tiring — base stress scaled by the run's modifier.
    // This is what makes Burnout reachable through normal play.
    // Backline / green-room gear shaves a slice off show stress (treated as a
    // percentage, capped at 60% so it can never fully negate burnout).
    const stressGain = Math.max(
      0,
      Math.round(
        SHOW_STRESS_BASE *
          runMods.stressMultiplier *
          metaBonuses.stressReductionMultiplier *
          (1 - Math.min(0.6, equipmentStressReduction / 100)),
      ),
    );

    // Check for incidents with escalation and synergy modifiers
    const passiveEffects = synergyManager.getPassiveEffects();
    const incidentReduction = passiveEffects
      .filter((e) => e.type === 'INCIDENT_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);
    let incidentChance = 0.1 * (sig?.incidentMult ?? 1); // 10% base chance, bent by the city
    if (isEscalation) {
      incidentChance *= ESCALATION_INCIDENT_MULTIPLIER;
    }
    incidentChance = Math.max(
      0,
      incidentChance - (incidentReduction + equipmentIncidentReduction) / 100,
    );

    const incidents: Incident[] = [];
    if (Math.random() < incidentChance) {
      incidents.push({
        type: IncidentType.NOISE_COMPLAINT,
        severity: 3,
        description: 'Neighbors complained about the noise',
        consequences: [{ type: ConsequenceType.REPUTATION_LOSS, value: 5 }],
      });
      reputationGain -= 5;
    }

    // Record any combos this bill+venue triggered (idempotent + persisted for
    // free via store.discoveredSynergies); flag the ones first found TONIGHT for
    // the results modal's "NEW SYNERGY DISCOVERED" beat.
    const prevDiscovered = new Set(store.discoveredSynergies);
    combos.forEach((c) => store.discoverSynergy(c.id));

    return {
      showId: show.id,
      success: true,
      attendance: finalAttendance,
      revenue: finalRevenue,
      reputationChange: reputationGain,
      fansGained: fanGain,
      stressGain,
      incidentOccurred: incidents.length > 0,
      financials: {
        revenue: finalRevenue,
        costs: totalCosts,
        profit: finalRevenue - totalCosts,
      },
      incidents,
      isSuccess: finalRevenue > totalCosts,
      venueSynergies: combos.map((c) => ({
        name: c.name,
        description: c.description,
      })),
      combosDiscovered: combos
        .filter((c) => !prevDiscovered.has(c.id))
        .map((c) => c.id),
    };
  }

  private createFailedShowResult(showId: string): ShowResult {
    return {
      showId,
      success: false,
      attendance: 0,
      revenue: 0,
      reputationChange: -10,
      fansGained: 0,
      incidentOccurred: true,
      financials: {
        revenue: 0,
        costs: 0,
        profit: 0,
      },
      incidents: [
        {
          type: IncidentType.BAND_NO_SHOW,
          severity: 8,
          description: 'Show could not be executed',
          consequences: [{ type: ConsequenceType.REPUTATION_LOSS, value: 10 }],
        },
      ],
      isSuccess: false,
      venueSynergies: [],
      combosDiscovered: [],
    };
  }

  /** A show cancelled because its venue was raided by the police this turn. */
  private createRaidedShowResult(showId: string): ShowResult {
    // The -8 reputation hit routes through completeShow (reputationChange);
    // do NOT also apply it directly here, or it lands twice (-16).
    return {
      showId,
      success: false,
      attendance: 0,
      revenue: 0,
      reputationChange: -8,
      fansGained: 0,
      incidentOccurred: true,
      financials: { revenue: 0, costs: 0, profit: 0 },
      incidents: [
        {
          type: IncidentType.POLICE_SHUTDOWN,
          severity: 7,
          description: 'Police shut the venue down — show cancelled',
          consequences: [{ type: ConsequenceType.REPUTATION_LOSS, value: 8 }],
        },
      ],
      isSuccess: false,
      venueSynergies: [],
      combosDiscovered: [],
    };
  }

  /**
   * Check all endgame conditions
   */
  private checkEndgame(
    store: ReturnType<typeof useGameStore.getState>,
    turn: number,
    brokeTurns: number,
  ): RunEndState | null {
    const finalStats = {
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
      showsPlayed: store.showHistory.length,
    };

    // WIN: the active run's win conditions (per-mode), falling back to the
    // default breakthrough thresholds when no formal run is active. The
    // 35-turn escalation spine (below) is unchanged — modes differ in their
    // win bar, not their pacing.
    const activeRun = runManager.getCurrentRun();
    const won = activeRun
      ? runManager.checkWinConditions({
          money: store.money,
          reputation: store.reputation,
          stress: store.stress,
          connections: store.connections,
        })
      : store.reputation >= BREAKTHROUGH_REPUTATION_THRESHOLD &&
        store.fans >= BREAKTHROUGH_FANS_THRESHOLD;
    if (won) {
      return { reason: 'BREAKTHROUGH_WIN', turn, finalStats };
    }

    // LOSS: Burnout
    if (store.stress >= BURNOUT_STRESS_CAP) {
      return { reason: 'BURNOUT_LOSS', turn, finalStats };
    }

    // LOSS: Eviction
    if (brokeTurns >= EVICTION_TURNS_BROKE) {
      return { reason: 'EVICTION_LOSS', turn, finalStats };
    }

    // LOSS: Fade Out (reached the run's turn cap without winning)
    if (turn >= this.getRunBounds().maxTurns) {
      return { reason: 'FADE_OUT_LOSS', turn, finalStats };
    }

    return null;
  }

  /**
   * Get escalation status for current turn
   */
  getEscalationStatus(turn: number): {
    isEscalation: boolean;
    turnsRemaining: number;
    costMultiplier: number;
    incidentMultiplier: number;
  } {
    const { maxTurns, escalationStart } = this.getRunBounds();
    const isEscalation = turn >= escalationStart;
    return {
      isEscalation,
      turnsRemaining: Math.max(0, maxTurns - turn),
      costMultiplier: isEscalation ? ESCALATION_COST_MULTIPLIER : 1,
      incidentMultiplier: isEscalation ? ESCALATION_INCIDENT_MULTIPLIER : 1,
    };
  }

  /**
   * Reset for new run
   */
  reset(): void {
    useGameStore.setState({ consecutiveBrokeTurns: 0 });
    difficultySystem.resetBlocks();
    synergyManager.reset();
    showPromotionSystem.reset();
  }
}

// Export singleton
export const turnResolutionEngine = new TurnResolutionEngine();

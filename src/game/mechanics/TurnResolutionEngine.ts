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
import { synergyManager, Synergy, SynergyTriggerResult } from './SynergyManager';
import { synergyEngine } from './SynergyEngine';
import { eventCardSystem } from './EventCardSystem';
import { dayJobSystem } from './DayJobSystem';
import { difficultySystem } from './DifficultySystem';
import { showPromotionSystem } from './ShowPromotionSystem';
import { venueUpgradeSystem } from './VenueUpgradeSystem';
import { runManager } from './RunManager';
import { metaProgressionManager } from './MetaProgressionManager';
import { objectiveManager } from './ObjectiveManager';
import { stakesManager, STAKE_TIERS } from './StakesManager';
import { isModeBeaten, nextModeAfter } from './modeUnlocks';
import { recordBandUnlocks, recordRunFeats } from '@game/world/bandUnlocks';
import { bandBookingFee } from './bandEconomy';
import { bandResponseMult } from './bandResponse';
import { resolveVenueCost } from './showCosts';
import { upgradeRevenueBonus, upgradeIncidentDelta } from './venueUpgradeEffects';
import { computeEquipmentEffects } from './venueEquipmentEffects';
import { TOURING_ENABLED } from '@/config/featureFlags';
import { gentrificationSystem } from './GentrificationSystem';
import { factionSystem } from './FactionSystem';
import { bandRelationships } from './BandRelationships';
import { computeLineupChemistry } from './lineupChemistry';
import {
  getCityLandmarks,
  districtLandmarkMods,
  landmarkPassiveMoney,
  metaProgressValue,
} from '../world/landmarks';
import { recordCityUnlocks } from '../world/cityUnlocks';
import { cityGenreFit, homeCityFit } from '../world/citySynergy';
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
  sceneOverheadPerTurn,
  SHOW_STRESS_BASE,
  SHOW_STRESS_PER_EXTRA_ACT,
  STRESS_RECOVERY_PER_TURN,
  ESCALATION_RECOVERY_PENALTY,
  COMBO_MULT_CAP,
  synergyRewardTurns,
  eventCardTurns,
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
  /** Bonus meta fame from completed optional challenges (already in fameEarned). */
  objectiveBonus: number;
  /** Completed optional challenges, for the end-screen breakdown. */
  completedObjectives: { id: string; title: string; fameReward: number }[];
  /** The difficulty stake this run was played at (0 = Open Mic). */
  stakeTier: number;
  /** Name of a newly-unlocked stake tier (a win advanced the ladder), else null. */
  unlockedStakeName: string | null;
  /** Name of a newly-unlocked game MODE (beating this mode opened the next), else null. */
  unlockedModeName: string | null;
  /** Names of bands whose cumulative milestone unlocked them THIS run (Balatro drip). */
  unlockedBandNames: string[];
  /** The mode this run was played in — lets the run-end screen one-tap re-launch it. */
  configId: string;
  /** Scene Points reward multiplier from the stake tier (1.0 at Open Mic → 2.0 at No Future). */
  stakeFameMult: number;
  /** Stake tiers cleared in this mode so far (the "how high have I climbed" badge). */
  stakesCleared: number;
  /** Total stake tiers (so the badge reads N/total). */
  stakeCount: number;
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
  /** Venues newly opened by this turn's peak-reputation climb ("name (N cap)") —
   *  the basement-to-festival ascent beat, for the results modal to announce. */
  venueUnlocks?: string[];
  /** Optional run challenges completed THIS turn (mid-run payoff beat). */
  objectivesCompleted?: { id: string; name: string }[];
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
    // Optional-objective tallies for this turn (folded into run stats below).
    const objDelta = {
      selloutShows: 0,
      combosFired: 0,
      turnIncome: 0,
      shows: 0,
      incidents: 0,
      maxVenueCapacity: 0,
    };
    // Resolved, non-cancelled shows with 2+ acts — feeds RunStats.billsCreated
    // (Festival's 'bills' win condition and the run score's bill count).
    let billsThisTurn = 0;

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
        // A police shutdown IS a disaster — count it for objectives too (run-stats
        // already counts it via incidentOccurred), so zero_disasters / "Flawless Run"
        // can't be falsely awarded. Not a played show, so objDelta.shows is left alone.
        objDelta.incidents += 1;
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
        const success =
          result.financials.profit > 0 &&
          result.attendance > venue.capacity * 0.5;

        // Scene politics: the bill's faction(s) react to how the show went, and
        // the bands on the bill drift closer/apart. Persist the new standings so
        // they survive refresh + feed next turn's faction show-modifiers.
        factionSystem.updateStandingsFromShow(band, venue, success);
        const billIds = scheduledShow.lineup
          ?? [scheduledShow.bandId, ...(scheduledShow.bill?.openers ?? [])];
        if (billIds.length > 1) {
          bandRelationships.updateRelationshipsFromShow(billIds, success, store.currentRound);
        }
        store.setFactionStandings(Object.fromEntries(factionSystem.getPlayerStandings()));
      }

      // Tally objective progress for this (non-cancelled) show.
      objDelta.shows += 1;
      const actCount = scheduledShow.lineup
        ? scheduledShow.lineup.length
        : 1 + (scheduledShow.bill?.openers.length ?? 0);
      if (actCount >= 2) billsThisTurn += 1;
      objDelta.turnIncome += result.revenue;
      objDelta.combosFired += result.venueSynergies?.length ?? 0;
      if (result.incidentOccurred) objDelta.incidents += 1;
      if (venue) {
        objDelta.maxVenueCapacity = Math.max(objDelta.maxVenueCapacity, venue.capacity);
        if (result.attendance >= venue.capacity * 0.9) objDelta.selloutShows += 1;
      }
    });

    // One-turn raid/drama blocks have now done their job this turn; clear them
    // before step 4 declares fresh ones for next turn.
    difficultySystem.consumeTurnBlocks();
    // Single-show equipment rentals applied to tonight's shows above; strip them.
    venueUpgradeSystem.clearRentals();

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

    // Scene overhead: grows with the scene you carry (fans + rep) and is scaled
    // by the run's rent multiplier (stakes + Hardcore) — so "count the door"
    // stays live money pressure mid-run and Eviction has teeth at higher stakes.
    let totalUpkeep = Math.round(
      sceneOverheadPerTurn(store.fans, store.reputation) *
        runManager.getRunModifiers().venueRentMultiplier,
    );
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
    // Burnout is a paced resource, not an inevitable death timer. In the endgame
    // escalation turns rest is less effective (the previously-dead
    // ESCALATION_RECOVERY_PENALTY), so the stress vector finally bites when it matters.
    store.addStress(-Math.round(STRESS_RECOVERY_PER_TURN * (isEscalation ? ESCALATION_RECOVERY_PENALTY : 1)));

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
        // Only resolved shows count — a police-cancelled show is a disaster,
        // not a show played (it must not advance Festival's calendar).
        totalShows: activeRun.stats.totalShows + objDelta.shows,
        billsCreated: activeRun.stats.billsCreated + billsThisTurn,
        // "Perfect" = sold out (>=90% capacity) — feeds the score's per-perfect
        // bonus and the FEAT.soldOut band unlock, which were dead counters.
        perfectShows: activeRun.stats.perfectShows + objDelta.selloutShows,
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
    // reputation later dips. Diff pre/post peak so newly-crossed venue gates
    // get ANNOUNCED (the climb is the core fantasy — it must not be silent).
    const prevPeak = postTurnStore.peakReputation ?? 0;
    useGameStore.setState((s) => ({
      peakReputation: Math.max(s.peakReputation, s.reputation),
    }));
    const newPeak = Math.max(prevPeak, postTurnStore.reputation);
    const venueUnlocks =
      newPeak > prevPeak
        ? postTurnStore.venues
            .filter((v) => {
              const gate = v.unlockReputation ?? 0;
              return gate > prevPeak && gate <= newPeak;
            })
            .map((v) => `${v.name} (${v.capacity} cap)`)
        : [];

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
    // cross-run) and announce any newly reachable tour stops. Skipped in the
    // single-city demo: you can't travel, so recording a "city unlock" only leaks
    // a phantom +roster-slot (cityRosterSlotBonus) for a town you can never visit.
    if (TOURING_ENABLED) {
      const unlockedCities = recordCityUnlocks(postTurnStore.cities ?? [], postTurnStore.reputation);
      unlockedCities.forEach((c) => warnings.push(`NEW CITY UNLOCKED: ${c.name} — book a tour!`));
    }

    // Fold this turn into the optional-objective stats (meta-fame challenges).
    // Live objectives may complete here (surfaced on the TurnResult so the
    // payoff isn't silent until the end screen); avoidance ones resolve in
    // concludeRun.
    let objectivesCompleted: { id: string; name: string }[] = [];
    {
      const { updated, newlyCompleted } = objectiveManager.recordTurn(postTurnStore.runObjectives, {
        ...objDelta,
        usedDayJob: !!jobResult,
        turn,
      });
      useGameStore.setState({ runObjectives: updated });
      objectivesCompleted = newlyCompleted.map((id) => ({
        id,
        name: objectiveManager.getDefinition(id)?.title ?? id,
      }));
    }

    // 6. Endgame check, then turn increment
    const runEnd = this.checkEndgame(postTurnStore, turn, brokeTurns);
    let ceremony: RunCeremony | null = null;
    if (runEnd) {
      store.setPhase(GamePhase.GAME_OVER);
      ceremony = this.concludeRun(runEnd, postTurnStore);
    } else {
      store.nextRound();
    }

    // Milestone reward: offer new equipped synergies ("instincts") on reward
    // turns — a DRAFT of 2-3 distinct candidates so the player can steer a build
    // (pendingSynergyOffer mirrors offers[0] for the current take-or-skip modal).
    // Reward turns are derived from the run's turn budget so the drip spans the
    // whole run in every mode. Transient (re-derives next milestone).
    const offerTurns = synergyRewardTurns(maxTurns);
    if (!runEnd && offerTurns.includes(turn)) {
      const offers: Synergy[] = [];
      // getRandomAvailableSynergy excludes equipped but can repeat across calls;
      // bounded redraws collect distinct candidates (pool may be nearly empty).
      for (let draws = 0; draws < 12 && offers.length < 3; draws++) {
        const o = synergyManager.getRandomAvailableSynergy();
        if (!o) break;
        if (!offers.some((x) => x.id === o.id)) offers.push(o);
      }
      if (offers.length > 0) {
        useGameStore.setState({
          pendingSynergyOffer: offers[0],
          pendingSynergyOffers: offers,
        });
      }
    }

    // Event card: on event turns (offset from synergy turns so they never share a
    // turn), draw a band-drama / scene crisis that pauses for the player's choice.
    if (!runEnd && eventCardTurns(maxTurns).includes(turn) && !offerTurns.includes(turn)) {
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
      // The crisis capacity penalty was a one-turn effect — consumed by the shows
      // just resolved above, so clear it. Any new crisis drawn below sets its own.
      eventCapacityPenalty: 0,
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
      venueUnlocks: venueUnlocks.length > 0 ? venueUnlocks : undefined,
      objectivesCompleted:
        objectivesCompleted.length > 0 ? objectivesCompleted : undefined,
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
    const stakeTier = run.stakeTier ?? 0;
    // Beating a mode for the FIRST time opens the next mode in the progression
    // ladder — check BEFORE recordWin flips this mode to "beaten".
    const modeWasUnbeaten = isWin && !isModeBeaten(configId);
    // Winning a stake unlocks the next tier for this mode (persisted cross-run).
    const unlockedStake = isWin ? stakesManager.recordWin(configId, stakeTier) : null;
    const newModeId = modeWasUnbeaten ? nextModeAfter(configId) : null;
    const unlockedModeName = newModeId
      ? ((runManager.getRunConfigs() ?? []).find((c) => c.id === newModeId)?.name ?? null)
      : null;
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

    // Ascension reward: climbing the stake ladder PAYS more Scene Points (×1 at
    // Open Mic → ×2 at No Future), so a harsher economy (which scores lower) is
    // worth the climb instead of punishing it.
    const stake = stakesManager.getTier(stakeTier);
    const fameEarned = Math.round(
      metaProgressionManager.calculateFameEarned(result.score, configId) * stake.fameMult,
    );
    // Stake tiers cleared in this mode: getUnlockedTier == #cleared (winning T
    // unlocks T+1), but beating the TOP tier doesn't bump it — fold that in.
    const stakeCount = stakesManager.getTiers().length;
    const stakesCleared = Math.min(
      stakeCount,
      stakesManager.getUnlockedTier(configId) +
        (isWin && stakeTier === stakeCount - 1 ? 1 : 0),
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

    // Resolve avoidance challenges + tally bonus meta fame. Read runObjectives
    // FRESH — recordTurn mutated it this turn, so the captured snapshot is stale.
    const finalizedObjectives = objectiveManager.finalize(
      useGameStore.getState().runObjectives,
    );
    useGameStore.setState({ runObjectives: finalizedObjectives });
    const objectiveBonus = objectiveManager.fameBonus(finalizedObjectives);
    const completedObjectives = finalizedObjectives.progress
      .filter((p) => p.completed)
      .map((p) => {
        const def = objectiveManager.getDefinition(p.id);
        return { id: p.id, title: def?.title ?? p.id, fameReward: def?.fameReward ?? 0 };
      });
    const totalFame = fameEarned + objectiveBonus;

    // Credit fame at most once per run id; a replayed conclusion is a no-op.
    metaProgressionManager.bankRunOnce(runId, totalFame);

    // Band unlocks (Balatro drip, weighted toward replay variety). First record
    // the variety FEAT flags this run earned (DIY/sellout/clean/sold-out/top-stake
    // win), THEN evaluate band unlocks — AFTER updateStats folds the run into the
    // lifetime totals and AFTER recordWin marks any beaten mode, so this run counts.
    // recordUnlock is idempotent (replay-safe). Band unlocks accrue on win OR loss.
    recordRunFeats({
      isWin,
      pathAlignment: store.pathAlignment,
      stakeTier,
      disasters: result.stats.disasters,
      perfectShows: result.stats.perfectShows,
    });
    const unlockedBandNames = recordBandUnlocks(store.allBands).map((b) => b.name);

    const progression = metaProgressionManager.getProgression();
    const bonuses = metaProgressionManager.getRunStartBonuses();

    return {
      isWin,
      score: Math.round(result.score),
      fameEarned: totalFame,
      objectiveBonus,
      completedObjectives,
      stakeTier,
      unlockedStakeName: unlockedStake !== null ? STAKE_TIERS[unlockedStake].name : null,
      unlockedModeName,
      unlockedBandNames,
      configId,
      stakeFameMult: stake.fameMult,
      stakesCleared,
      stakeCount,
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
      // Guard the BASE too: a net-negative rep turn (small crowd + incidents) would
      // otherwise turn a positive REPUTATION_PERCENT instinct into a rep PENALTY.
      // (Money/fans bases are never negative, so they only need the multiplier guard.)
      if (pctRep > 0 && totalRep > 0) store.addReputation(Math.floor((totalRep * pctRep) / 100));
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
    // Hometown crowd: the headliner playing its OWN home city draws extra (a
    // band-specific bonus that stacks on the genre scene fit). Rewards touring.
    const homeFit = homeCityFit(mainBand.homeCity, store.currentCityId);
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

    // --- Scene politics: faction standing + bill chemistry -------------------
    // Hydrate the stateless faction calculator from the persisted store standings,
    // then read this bill's faction show-modifiers. Every term below is EXACTLY
    // identity when standings are neutral (run start), so this can't move the
    // early game; each is also double-bounded (swing-compressed AND clamped) so
    // even a maxed faction stays a side-grade smaller than a single co-billed band.
    Object.entries(store.factionStandings ?? {}).forEach(([id, v]) =>
      factionSystem.setStanding(id, v),
    );
    const fMods = factionSystem.getShowModifiers(mainBand, venue);
    const factionAttendanceMult = Math.max(0.92, Math.min(1.08, 1 + (fMods.fanBonus - 1) * 0.4));
    const factionRepMult = Math.max(0.95, Math.min(1.05, 1 + (fMods.reputationMultiplier - 1) * 0.3));
    const factionMoneyMult = 1 + Math.max(-0.05, Math.min(0.05, fMods.moneyModifier));
    // Bill chemistry: faction affinity (same scene = friendly, rivals = bad blood)
    // plus co-billing drift, as a compressed+clamped crowd multiplier. 1 for solo.
    const lineupChem = computeLineupChemistry(allShowBands);

    // Band+venue COMBO synergies (the "discover powerful combos" pillar): the
    // SAME calculator the ShowBuilder preview shows, now ACTUALLY applied to the
    // result. The product is capped (COMBO_MULT_CAP) so it can't balloon when it
    // stacks on top of the instinct/scene-fit/hype/bill/gentrification multipliers.
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

    // Equipment effects — summed by the shared helper so the booking/promotion
    // preview folds in the EXACT same owned/rented-gear bonuses (preview==resolution).
    const equip = computeEquipmentEffects(venue);
    const equipmentCapacityBonus = equip.capacityMult;
    const equipmentReputationMultiplier = equip.reputationMult;
    const equipmentQualityBonus = equip.qualityBonus;
    const equipmentStressReduction = equip.stressReduction;
    const equipmentIncidentReduction = equip.incidentReduction;

    // Venue upgrades. Capacity is baked into venue.capacity at purchase
    // (VenueUpgradeSystem.applyUpgrade) — the ONE source, which the booking
    // preview and attendance projection also read, so it must NOT be summed
    // again here (that double-counted the room). Revenue (+%) and
    // incidentChance (signed percentage points) only exist on the upgrade
    // list and are applied at show time below.
    const revenueBonusFromUpgrades = upgradeRevenueBonus(venue);
    const incidentDeltaFromUpgrades = upgradeIncidentDelta(venue);

    // A crisis event (e.g. police_crackdown) can impose a transient, single-turn
    // capacity penalty on every venue. It's applied here as an EFFECTIVE reduction
    // (never written into base capacity) and floored so a room stays bookable.
    const eventCapacityPenalty = store.eventCapacityPenalty ?? 0;
    const effectiveCapacity = Math.max(
      1,
      Math.floor(
        venue.capacity * equipmentCapacityBonus - eventCapacityPenalty,
      ),
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
          homeFit.multiplier *
          comboMult *
          (sig?.attendanceMult ?? 1) *
          factionAttendanceMult *
          lineupChem.mult,
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
    // Bar/VIP-style venue upgrades lift the whole take by their summed
    // percent (the same bonus the ShowBuilder preview folds into its gross).
    const upgradeRevenueMultiplier = 1 + revenueBonusFromUpgrades / 100;
    let finalRevenue = Math.floor(
      totalRevenue * revenueMultiplier * upgradeRevenueMultiplier * runMods.moneyMultiplier * (sig?.revenueMult ?? 1) * factionMoneyMult,
    );

    // Calculate costs with difficulty scaling; escalation turns raise costs.
    // Per-band guarantee (popularity-scaled, difficulty-scaled); signed acts cost
    // only your cut-share, then bent by how the band responds to your alignment +
    // reputation. Same formula the ShowBuilder preview shows.
    const bandCosts = allShowBands.reduce(
      (sum, b) =>
        sum +
        difficultySystem.getScaledBandCost(
          bandBookingFee(b.popularity, store.rosterBandIds.includes(b.id)) *
            bandResponseMult(b, store.diyPoints, store.reputation),
        ),
      0,
    );
    const venueCost = resolveVenueCost(venue, {
      districts: store.districts,
      currentCityId: store.currentCityId,
      runVenueRentMult: runMods.venueRentMultiplier,
      metaVenueDiscountMult: metaBonuses.venueDiscountMultiplier,
    });
    let totalCosts = bandCosts + venueCost;
    if (isEscalation) {
      totalCosts = Math.floor(totalCosts * ESCALATION_COST_MULTIPLIER);
    }
    // Budget Booker (PASSIVE instinct) trims show costs.
    const costReduction = synergyManager
      .getPassiveEffects()
      .filter((e) => e.type === 'COST_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);
    if (costReduction > 0) {
      totalCosts = Math.floor(totalCosts * (1 - costReduction / 100));
    }

    // Calculate reputation and fan gains with equipment bonus. (Pacing pass:
    // attendance/5 + /2 hit the win bars by turn ~10 of 50 — the whole back half
    // of every run was dead air. Trimmed so a competent Classic run needs most
    // of its clock; the difficulty ramp + late-run rep decay do the rest.)
    let reputationGain = Math.floor(
      (finalAttendance / 11) * equipmentReputationMultiplier,
    );
    let fanGain = Math.floor(finalAttendance / 5);

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
      reputationGain * (1 + repBonus / 100) * runMods.reputationMultiplier * (sig?.repMult ?? 1) * factionRepMult,
    );
    // Flat reputation from band+venue combos (e.g. True DIY +10).
    reputationGain += comboRep;
    // Soft cap: rep gains diminish as reputation climbs (the scene's harder to
    // impress once you're known). This spreads the rep→venue→attendance ladder
    // across the WHOLE run instead of rep hitting 100 by turn ~5, and makes the
    // final push to the win bar a real climb against late-run decay.
    if (reputationGain > 0) {
      const damping = Math.max(0.25, 1 - store.reputation / 125);
      reputationGain = Math.max(1, Math.floor(reputationGain * damping));
    }

    // Playing a show is tiring — base stress plus a slice per extra act (a
    // bigger bill is a longer night), scaled by the run's modifier. This is
    // what makes Burnout reachable through normal play and "book big vs
    // breathe" a real choice.
    // Backline / green-room gear shaves a slice off show stress (treated as a
    // percentage, capped at 60% so it can never fully negate burnout).
    let stressGain = Math.max(
      0,
      Math.round(
        (SHOW_STRESS_BASE +
          SHOW_STRESS_PER_EXTRA_ACT * Math.max(0, allShowBands.length - 1)) *
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
    // 10% base, bent by the city signature AND the run's difficulty stake.
    let incidentChance = 0.1 * (sig?.incidentMult ?? 1) * runManager.getStakeIncidentMult();
    if (isEscalation) {
      incidentChance *= ESCALATION_INCIDENT_MULTIPLIER;
    }
    // Venue upgrades shift the chance in signed percentage points under the
    // same floor — security negative (fewer incidents), the outdoor
    // expansion positive (a weather gamble).
    incidentChance = Math.max(
      0,
      incidentChance +
        incidentDeltaFromUpgrades / 100 -
        (incidentReduction + equipmentIncidentReduction) / 100,
    );

    const incidents: Incident[] = [];
    if (Math.random() < incidentChance) {
      // Varied show-time incident table. Severity weights tilt heavier under
      // escalation and in bigger rooms, so rising incident FREQUENCY (stakes,
      // endgame) also raises what's at stake — the old roll was always the same
      // -5 rep noise complaint. Each outcome is bounded and named so failure
      // teaches. (Distinct from DifficultySystem's between-turn passive events,
      // which shut venues/bands down for the NEXT turn.)
      const heavy = isEscalation || venue.capacity >= 150;
      const wNoise = heavy ? 25 : 45;
      const wPa = heavy ? 30 : 25;
      const wCops = heavy ? 25 : 15;
      const wFight = heavy ? 20 : 15;
      const roll = Math.random() * (wNoise + wPa + wCops + wFight);
      if (roll < wNoise) {
        incidents.push({
          type: IncidentType.NOISE_COMPLAINT,
          severity: 3,
          description: 'Neighbors complained about the noise',
          consequences: [{ type: ConsequenceType.REPUTATION_LOSS, value: 5 }],
        });
        reputationGain -= 5;
      } else if (roll < wNoise + wPa) {
        // Repair bill scales with the room (a bigger PA costs more to revive).
        const repair = 40 + Math.round(venue.capacity / 4);
        incidents.push({
          type: IncidentType.EQUIPMENT_FAILURE,
          severity: 5,
          description: `The PA finally gave out mid-set — $${repair} in emergency repairs`,
          consequences: [{ type: ConsequenceType.MONEY_LOSS, value: repair }],
        });
        totalCosts += repair;
      } else if (roll < wNoise + wPa + wCops) {
        const lostRevenue = Math.floor(finalRevenue * 0.3);
        incidents.push({
          type: IncidentType.COPS_CALLED,
          severity: 6,
          description: 'Cops posted up out front — a third of the door walked',
          consequences: [{ type: ConsequenceType.MONEY_LOSS, value: lostRevenue }],
        });
        finalRevenue -= lostRevenue;
      } else {
        incidents.push({
          type: IncidentType.FIGHT,
          severity: 4,
          description: 'A scuffle broke out by the merch table — you spent the set breaking it up',
          consequences: [{ type: ConsequenceType.SCENE_DRAMA, value: 5 }],
        });
        stressGain += 5;
      }
    }

    // Relationship-gated band drama: a bill with a HOSTILE pair (rival factions
    // or soured co-billing history) risks a backstage blowup. Small, bounded, and
    // only possible when the player deliberately books enemies together — so the
    // typical/sim bill (friendly or neutral) never triggers it.
    if (lineupChem.hostile && Math.random() < 0.15) {
      incidents.push({
        type: IncidentType.BAND_DRAMA,
        severity: 4,
        description: lineupChem.conflicts[0] ?? 'The bands clashed backstage',
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
      politics: (() => {
        const factionAttendancePct = Math.round((factionAttendanceMult - 1) * 100);
        const factionRepPct = Math.round((factionRepMult - 1) * 100);
        const lineupPct = Math.round((lineupChem.mult - 1) * 100);
        if (factionAttendancePct === 0 && factionRepPct === 0 && lineupPct === 0 && lineupChem.conflicts.length === 0) {
          return null;
        }
        return { factionAttendancePct, factionRepPct, lineupPct, conflicts: lineupChem.conflicts };
      })(),
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
    // The run's actual turn cap (mode + stake adjusted) for the end-screen display.
    const maxTurns = this.getRunBounds().maxTurns;

    // WIN: the active run's win conditions (per-mode), falling back to the
    // default breakthrough thresholds when no formal run is active. The
    // 35-turn escalation spine (below) is unchanged — modes differ in their
    // win bar, not their pacing.
    const activeRun = runManager.getCurrentRun();
    const won = activeRun
      ? runManager.checkWinConditions({
          money: store.money,
          reputation: store.reputation,
          fans: store.fans, // the 'fans' win reads the live following, matching the HUD
          stress: store.stress,
          connections: store.connections,
        })
      : store.reputation >= BREAKTHROUGH_REPUTATION_THRESHOLD &&
        store.fans >= BREAKTHROUGH_FANS_THRESHOLD;
    if (won) {
      return { reason: 'BREAKTHROUGH_WIN', turn, maxTurns, finalStats };
    }

    // LOSS: Burnout
    if (store.stress >= BURNOUT_STRESS_CAP) {
      return { reason: 'BURNOUT_LOSS', turn, maxTurns, finalStats };
    }

    // LOSS: Eviction
    if (brokeTurns >= EVICTION_TURNS_BROKE) {
      return { reason: 'EVICTION_LOSS', turn, maxTurns, finalStats };
    }

    // LOSS: Fade Out (reached the run's turn cap without winning)
    if (turn >= this.getRunBounds().maxTurns) {
      return { reason: 'FADE_OUT_LOSS', turn, maxTurns, finalStats };
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

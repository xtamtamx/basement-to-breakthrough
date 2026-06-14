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
import { walkerSystem } from './WalkerSystem';
import { dayJobSystem } from './DayJobSystem';
import { difficultySystem } from './DifficultySystem';
import { showPromotionSystem } from './ShowPromotionSystem';
import { venueUpgradeSystem } from './VenueUpgradeSystem';
import { runManager } from './RunManager';
import { metaProgressionManager } from './MetaProgressionManager';
import { gentrificationSystem } from './GentrificationSystem';
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
    let totalUpkeep = LIVING_COSTS_PER_TURN;
    let passiveMoney = 0;
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

    // Districts gentrify with the scene's success; fold any threshold-crossing
    // notices into the turn's difficulty message.
    const gentrification =
      gentrificationSystem.applyTurnGentrification(activeDistrictIds);
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

    // 6. Endgame check, then turn increment
    const runEnd = this.checkEndgame(postTurnStore, turn, brokeTurns);
    let ceremony: RunCeremony | null = null;
    if (runEnd) {
      store.setPhase(GamePhase.GAME_OVER);
      ceremony = this.concludeRun(runEnd, postTurnStore);
    } else {
      store.nextRound();
    }

    // Persist the run's singleton state so a refresh/load resumes intact.
    useGameStore.setState({
      lastTurnResults: showResults,
      runtimeSnapshot: captureRuntimeSnapshot(),
    });

    return {
      showResults,
      totalUpkeep,
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
    metaProgressionManager.addCurrency(fameEarned);

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

    // Calculate equipment effects
    let equipmentCapacityBonus = 1;
    let equipmentReputationMultiplier = 1;

    venue.equipment.forEach((equipment) => {
      if (equipment.owned && equipment.condition > 20) {
        // Equipment needs 20%+ condition to work; effects scale with condition
        const effectMultiplier = equipment.condition / 100;

        if (equipment.effects.capacityBonus) {
          equipmentCapacityBonus +=
            (equipment.effects.capacityBonus / 100) * effectMultiplier;
        }
        if (equipment.effects.reputationMultiplier) {
          equipmentReputationMultiplier *=
            1 + (equipment.effects.reputationMultiplier - 1) * effectMultiplier;
        }
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
    const venueBonus = venue.atmosphere / 100;
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
          gentrificationAttendance,
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
      totalRevenue * revenueMultiplier * runMods.moneyMultiplier,
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
        metaBonuses.venueDiscountMultiplier,
    );
    let totalCosts = bandCosts + venueCost;
    if (isEscalation) {
      totalCosts = Math.floor(totalCosts * ESCALATION_COST_MULTIPLIER);
    }

    // Calculate reputation and fan gains with equipment bonus
    let reputationGain = Math.floor(
      (finalAttendance / 10) * equipmentReputationMultiplier,
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
    fanGain = Math.floor(fanGain * (1 + fansBonus / 100));
    reputationGain = Math.floor(
      reputationGain * (1 + repBonus / 100) * runMods.reputationMultiplier,
    );

    // Playing a show is tiring — base stress scaled by the run's modifier.
    // This is what makes Burnout reachable through normal play.
    const stressGain = Math.round(
      SHOW_STRESS_BASE *
        runMods.stressMultiplier *
        metaBonuses.stressReductionMultiplier,
    );

    // Check for incidents with escalation and synergy modifiers
    const passiveEffects = synergyManager.getPassiveEffects();
    const incidentReduction = passiveEffects
      .filter((e) => e.type === 'INCIDENT_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);
    let incidentChance = 0.1; // 10% base chance
    if (isEscalation) {
      incidentChance *= ESCALATION_INCIDENT_MULTIPLIER;
    }
    incidentChance = Math.max(0, incidentChance - incidentReduction / 100);

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

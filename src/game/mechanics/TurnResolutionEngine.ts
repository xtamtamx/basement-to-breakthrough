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

export interface TurnResult {
  // Consumed by TurnResultsModal
  showResults: ShowResult[];
  totalVenueRent: number;
  dayJobResult?: DayJobTurnResult;
  difficultyEvent?: DifficultyTurnEvent;
  // Phase A run structure
  turn: number;
  isEscalation: boolean;
  warnings: string[];
  runEnd: RunEndState | null;
  synergyEffects: SynergyTriggerResult[];
}

export class TurnResolutionEngine {
  private consecutiveBrokeTurns: number = 0;

  async executeFullTurn(): Promise<TurnResult> {
    const store = useGameStore.getState();
    const turn = store.currentRound;
    const isEscalation = turn >= ESCALATION_START_TURN;

    // 1. Turn start triggers
    const turnStartEffects = this.applySynergyPhase('TURN_START');

    // 3. Show resolution (player actions in step 2 happened before this call)
    const { showsToExecute } = showPromotionSystem.processScheduledShows();
    const showResults: ShowResult[] = [];

    showsToExecute.forEach((scheduledShow) => {
      const result = this.executeShow(
        scheduledShow,
        scheduledShow.totalPromotionEffectiveness,
        scheduledShow.hype,
        isEscalation,
      );
      showResults.push(result);
      store.completeShow(scheduledShow.id, result);

      const venue = store.venues.find((v) => v.id === scheduledShow.venueId);
      const band = store.allBands.find((b) => b.id === scheduledShow.bandId);
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

    // SHOW_END triggers scale with what the shows actually produced
    const showEndEffects = this.applyShowEndPhase(showResults);

    // 4. Turn economy: venue rent + upkeep, day jobs, passive difficulty
    let totalVenueCosts = 0;
    useGameStore.getState().venues.forEach((venue) => {
      const scaledRent = difficultySystem.getScaledVenueCost(venue.rent);
      const upkeepCost = venueUpgradeSystem.calculateUpkeepCost(venue);
      const totalCost = scaledRent + upkeepCost;

      totalVenueCosts += totalCost;
      store.addMoney(-totalCost);

      venueUpgradeSystem.degradeEquipment(venue);
    });

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

    // 5. End-of-turn triggers
    const turnEndEffects = this.applySynergyPhase('TURN_END');

    // Track broke turns for eviction
    const postTurnStore = useGameStore.getState();
    if (postTurnStore.money <= 0) {
      this.consecutiveBrokeTurns++;
    } else {
      this.consecutiveBrokeTurns = 0;
    }

    const warnings: string[] = [];
    if (isEscalation) {
      warnings.push(
        `ESCALATION: Turn ${turn}/${MAX_TURNS} - Costs +50%, incidents +100%`,
      );
    }
    if (this.consecutiveBrokeTurns > 0) {
      warnings.push(
        `EVICTION WARNING: ${this.consecutiveBrokeTurns}/${EVICTION_TURNS_BROKE} turns broke`,
      );
    }
    if (postTurnStore.stress >= BURNOUT_STRESS_CAP - 20) {
      warnings.push(
        `BURNOUT WARNING: Stress at ${postTurnStore.stress}/${BURNOUT_STRESS_CAP}`,
      );
    }

    // 6. Endgame check, then turn increment
    const runEnd = this.checkEndgame(postTurnStore, turn);
    if (runEnd) {
      store.setPhase(GamePhase.GAME_OVER);
    } else {
      store.nextRound();
    }

    useGameStore.setState({ lastTurnResults: showResults });

    return {
      showResults,
      totalVenueRent: totalVenueCosts,
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
      synergyEffects: [...turnStartEffects, ...showEndEffects, ...turnEndEffects],
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

    // Get all bands in the show
    const allShowBands = [mainBand];
    if (show.bill) {
      show.bill.openers.forEach((bandId) => {
        const band = store.allBands.find((b) => b.id === bandId);
        if (band) allShowBands.push(band);
      });
    }

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

    const finalAttendance = Math.min(
      Math.floor(
        promotedAttendance *
          synergyMultiplier *
          difficultyModifiers.attendanceMultiplier *
          hypeMultiplier,
      ),
      effectiveCapacity,
    );

    // Calculate revenue
    const ticketRevenue = finalAttendance * show.ticketPrice;
    const barRevenue = venue.hasBar ? finalAttendance * 5 : 0;
    const totalRevenue = ticketRevenue + barRevenue;

    const moneyBonus = synergyManager.calculateEffectTotal(
      'MONEY_PERCENT',
      synergyResults,
    );
    const revenueMultiplier = 1 + moneyBonus / 100;
    const finalRevenue = Math.floor(totalRevenue * revenueMultiplier);

    // Calculate costs with difficulty scaling; escalation turns raise costs
    const bandCosts = allShowBands.length * difficultySystem.getScaledBandCost();
    const venueCost = difficultySystem.getScaledVenueCost(venue.rent);
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
    reputationGain = Math.floor(reputationGain * (1 + repBonus / 100));

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

  /**
   * Check all endgame conditions
   */
  private checkEndgame(
    store: ReturnType<typeof useGameStore.getState>,
    turn: number,
  ): RunEndState | null {
    const finalStats = {
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
      showsPlayed: store.showHistory.length,
    };

    // WIN: Breakthrough Show
    if (
      store.reputation >= BREAKTHROUGH_REPUTATION_THRESHOLD &&
      store.fans >= BREAKTHROUGH_FANS_THRESHOLD
    ) {
      return { reason: 'BREAKTHROUGH_WIN', turn, finalStats };
    }

    // LOSS: Burnout
    if (store.stress >= BURNOUT_STRESS_CAP) {
      return { reason: 'BURNOUT_LOSS', turn, finalStats };
    }

    // LOSS: Eviction
    if (this.consecutiveBrokeTurns >= EVICTION_TURNS_BROKE) {
      return { reason: 'EVICTION_LOSS', turn, finalStats };
    }

    // LOSS: Fade Out (turn 35 without win)
    if (turn >= MAX_TURNS) {
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
    const isEscalation = turn >= ESCALATION_START_TURN;
    return {
      isEscalation,
      turnsRemaining: Math.max(0, MAX_TURNS - turn),
      costMultiplier: isEscalation ? ESCALATION_COST_MULTIPLIER : 1,
      incidentMultiplier: isEscalation ? ESCALATION_INCIDENT_MULTIPLIER : 1,
    };
  }

  /**
   * Reset for new run
   */
  reset(): void {
    this.consecutiveBrokeTurns = 0;
    synergyManager.reset();
  }
}

// Export singleton
export const turnResolutionEngine = new TurnResolutionEngine();

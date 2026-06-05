/**
 * TurnResolutionEngine - THE single deterministic turn-resolution entrypoint
 *
 * Turn Resolution Order (per PRD.md):
 * 1. Turn start triggers (synergies)
 * 2. Player actions (handled by UI, before this is called)
 * 3. Show resolution
 * 4. Incident resolution
 * 5. End-of-turn triggers
 * 6. Turn increment
 * 7. Endgame check
 */

import { useGameStore } from '@stores/gameStore';
import { synergyManager, SynergyTriggerResult } from './SynergyManager';
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
import { ShowResult, GamePhase, IncidentType } from '@game/types';

export interface TurnStartResult {
  turn: number;
  isEscalation: boolean;
  synergyEffects: SynergyTriggerResult[];
  resourceChanges: {
    money: number;
    reputation: number;
    fans: number;
    stress: number;
  };
}

export interface ShowResolutionResult {
  showResults: ShowResult[];
  synergyEffects: SynergyTriggerResult[];
  totalRevenue: number;
  totalCosts: number;
}

export interface TurnEndResult {
  turn: number;
  synergyEffects: SynergyTriggerResult[];
  resourceChanges: {
    money: number;
    reputation: number;
    fans: number;
    stress: number;
  };
  runEnd: RunEndState | null;
  warnings: string[];
}

export interface FullTurnResult {
  turnStart: TurnStartResult;
  showResolution: ShowResolutionResult | null;
  turnEnd: TurnEndResult;
}

class TurnResolutionEngine {
  private consecutiveBrokeTurns: number = 0;

  /**
   * Process the START of a turn
   * Called at the beginning of the player's turn
   */
  processTurnStart(): TurnStartResult {
    const store = useGameStore.getState();
    const turn = store.currentRound;
    const isEscalation = turn >= ESCALATION_START_TURN;

    // Get current game state for synergy context
    const context = {
      currentTurn: turn,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
    };

    // Trigger TURN_START synergies
    const synergyEffects = synergyManager.triggerSynergies('TURN_START', context);

    // Calculate resource changes from synergies
    const resourceChanges = {
      money: synergyManager.calculateEffectTotal('MONEY_FLAT', synergyEffects),
      reputation: synergyManager.calculateEffectTotal('REPUTATION_FLAT', synergyEffects),
      fans: synergyManager.calculateEffectTotal('FANS_FLAT', synergyEffects),
      stress: synergyManager.calculateEffectTotal('STRESS_FLAT', synergyEffects),
    };

    // Apply resource changes
    if (resourceChanges.money !== 0) store.addMoney(resourceChanges.money);
    if (resourceChanges.reputation !== 0) store.addReputation(resourceChanges.reputation);
    if (resourceChanges.fans !== 0) store.addFans(resourceChanges.fans);
    if (resourceChanges.stress !== 0) store.addStress(resourceChanges.stress);

    return {
      turn,
      isEscalation,
      synergyEffects,
      resourceChanges,
    };
  }

  /**
   * Process shows scheduled for this turn
   * Called after player actions
   */
  processShows(): ShowResolutionResult {
    const store = useGameStore.getState();
    const turn = store.currentRound;
    const isEscalation = turn >= ESCALATION_START_TURN;

    // Get synergy context
    const context = {
      currentTurn: turn,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
    };

    // Trigger SHOW_START synergies
    const showStartSynergies = synergyManager.triggerSynergies('SHOW_START', context);

    // Get passive effects for show modifications
    const passiveEffects = synergyManager.getPassiveEffects();

    // Calculate synergy modifiers
    const attendanceBonus = synergyManager.calculateEffectTotal('ATTENDANCE_PERCENT', showStartSynergies);
    const costReduction = passiveEffects
      .filter(e => e.type === 'COST_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);
    const incidentReduction = passiveEffects
      .filter(e => e.type === 'INCIDENT_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);

    // Process scheduled shows
    const showResults: ShowResult[] = [];
    let totalRevenue = 0;
    let totalCosts = 0;

    const scheduledShows = store.scheduledShows.filter(s => s.status === 'SCHEDULED');

    for (const show of scheduledShows) {
      const venue = store.venues.find(v => v.id === show.venueId);
      const band = store.allBands.find(b => b.id === show.bandId);

      if (!venue || !band) continue;

      // Base calculations
      const baseAttendance = Math.floor(venue.capacity * (band.popularity / 100) * (venue.atmosphere / 100));
      const synergyAttendance = Math.floor(baseAttendance * (1 + attendanceBonus / 100));
      const finalAttendance = Math.min(synergyAttendance, venue.capacity);

      // Revenue calculation
      const ticketRevenue = finalAttendance * show.ticketPrice;
      const barRevenue = venue.hasBar ? finalAttendance * 5 : 0;
      const rawRevenue = ticketRevenue + barRevenue;

      // Cost calculation with escalation
      let baseCost = venue.rent + (band.popularity > 50 ? 50 : 25);
      if (isEscalation) {
        baseCost = Math.floor(baseCost * ESCALATION_COST_MULTIPLIER);
      }
      const finalCost = Math.floor(baseCost * (1 - costReduction / 100));

      // Incident check with escalation
      let incidentChance = 0.1;
      if (isEscalation) {
        incidentChance *= ESCALATION_INCIDENT_MULTIPLIER;
      }
      incidentChance = Math.max(0, incidentChance - incidentReduction / 100);
      const incidentOccurred = Math.random() < incidentChance;

      // Calculate gains
      const reputationGain = Math.floor(finalAttendance / 10);
      const fansGained = Math.floor(finalAttendance / 5);
      const stressGain = incidentOccurred ? 10 : 5;

      const result: ShowResult = {
        showId: show.id,
        success: true,
        attendance: finalAttendance,
        revenue: rawRevenue,
        reputationChange: reputationGain,
        reputationGain,
        fansGained,
        stressGain,
        incidentOccurred,
        financials: {
          revenue: rawRevenue,
          costs: finalCost,
          profit: rawRevenue - finalCost,
        },
        incidents: incidentOccurred ? [{
          type: IncidentType.NOISE_COMPLAINT,
          severity: 3,
          description: 'Minor incident during the show',
          consequences: [],
        }] : [],
        isSuccess: rawRevenue > finalCost,
      };

      showResults.push(result);
      store.completeShow(show.id, result);

      totalRevenue += rawRevenue;
      totalCosts += finalCost;
    }

    // Trigger SHOW_END synergies after all shows
    const updatedContext = {
      ...context,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
    };
    const showEndSynergies = synergyManager.triggerSynergies('SHOW_END', updatedContext);

    // Apply SHOW_END synergy effects
    const showEndMoney = synergyManager.calculateEffectTotal('MONEY_FLAT', showEndSynergies);
    const showEndMoneyPercent = synergyManager.calculateEffectTotal('MONEY_PERCENT', showEndSynergies);
    const showEndRep = synergyManager.calculateEffectTotal('REPUTATION_FLAT', showEndSynergies);
    const showEndRepPercent = synergyManager.calculateEffectTotal('REPUTATION_PERCENT', showEndSynergies);
    const showEndFans = synergyManager.calculateEffectTotal('FANS_FLAT', showEndSynergies);
    const showEndFansPercent = synergyManager.calculateEffectTotal('FANS_PERCENT', showEndSynergies);

    // Apply percentage bonuses based on what was gained this turn
    if (showResults.length > 0) {
      const totalRepGained = showResults.reduce((sum, r) => sum + (r.reputationGain || 0), 0);
      const totalFansGained = showResults.reduce((sum, r) => sum + r.fansGained, 0);

      if (showEndMoneyPercent > 0) {
        store.addMoney(Math.floor(totalRevenue * showEndMoneyPercent / 100));
      }
      if (showEndRepPercent > 0) {
        store.addReputation(Math.floor(totalRepGained * showEndRepPercent / 100));
      }
      if (showEndFansPercent > 0) {
        store.addFans(Math.floor(totalFansGained * showEndFansPercent / 100));
      }
    }

    // Apply flat bonuses
    if (showEndMoney !== 0) store.addMoney(showEndMoney);
    if (showEndRep !== 0) store.addReputation(showEndRep);
    if (showEndFans !== 0) store.addFans(showEndFans);

    return {
      showResults,
      synergyEffects: [...showStartSynergies, ...showEndSynergies],
      totalRevenue,
      totalCosts,
    };
  }

  /**
   * Process the END of a turn
   * Includes endgame checks
   */
  processTurnEnd(): TurnEndResult {
    const store = useGameStore.getState();
    const turn = store.currentRound;
    const isEscalation = turn >= ESCALATION_START_TURN;

    // Get current state for synergy context
    const context = {
      currentTurn: turn,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
    };

    // Trigger TURN_END synergies
    const synergyEffects = synergyManager.triggerSynergies('TURN_END', context);

    // Calculate resource changes
    const resourceChanges = {
      money: synergyManager.calculateEffectTotal('MONEY_FLAT', synergyEffects),
      reputation: synergyManager.calculateEffectTotal('REPUTATION_FLAT', synergyEffects),
      fans: synergyManager.calculateEffectTotal('FANS_FLAT', synergyEffects),
      stress: synergyManager.calculateEffectTotal('STRESS_FLAT', synergyEffects),
    };

    // Apply resource changes
    if (resourceChanges.money !== 0) store.addMoney(resourceChanges.money);
    if (resourceChanges.reputation !== 0) store.addReputation(resourceChanges.reputation);
    if (resourceChanges.fans !== 0) store.addFans(resourceChanges.fans);
    if (resourceChanges.stress !== 0) store.addStress(resourceChanges.stress);

    // Track broke turns for eviction
    if (store.money <= 0) {
      this.consecutiveBrokeTurns++;
    } else {
      this.consecutiveBrokeTurns = 0;
    }

    // Generate warnings
    const warnings: string[] = [];
    if (isEscalation) {
      warnings.push(`ESCALATION: Turn ${turn}/${MAX_TURNS} - Costs +50%, incidents +100%`);
    }
    if (this.consecutiveBrokeTurns > 0) {
      warnings.push(`EVICTION WARNING: ${this.consecutiveBrokeTurns}/${EVICTION_TURNS_BROKE} turns broke`);
    }
    if (store.stress >= BURNOUT_STRESS_CAP - 20) {
      warnings.push(`BURNOUT WARNING: Stress at ${store.stress}/${BURNOUT_STRESS_CAP}`);
    }

    // Check endgame conditions
    const runEnd = this.checkEndgame(store, turn);

    // Advance turn (if game not over)
    if (!runEnd) {
      store.nextRound();
    } else {
      store.setPhase(GamePhase.GAME_OVER);
    }

    return {
      turn,
      synergyEffects,
      resourceChanges,
      runEnd,
      warnings,
    };
  }

  /**
   * Check all endgame conditions
   */
  private checkEndgame(
    store: ReturnType<typeof useGameStore.getState>,
    turn: number
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
      return {
        reason: 'BREAKTHROUGH_WIN',
        turn,
        finalStats,
      };
    }

    // LOSS: Burnout
    if (store.stress >= BURNOUT_STRESS_CAP) {
      return {
        reason: 'BURNOUT_LOSS',
        turn,
        finalStats,
      };
    }

    // LOSS: Eviction
    if (this.consecutiveBrokeTurns >= EVICTION_TURNS_BROKE) {
      return {
        reason: 'EVICTION_LOSS',
        turn,
        finalStats,
      };
    }

    // LOSS: Fade Out (turn 35 without win)
    if (turn >= MAX_TURNS) {
      return {
        reason: 'FADE_OUT_LOSS',
        turn,
        finalStats,
      };
    }

    return null;
  }

  /**
   * Execute a full turn (convenience method)
   */
  executeFullTurn(hasShows: boolean = true): FullTurnResult {
    const turnStart = this.processTurnStart();

    let showResolution: ShowResolutionResult | null = null;
    if (hasShows) {
      showResolution = this.processShows();
    }

    const turnEnd = this.processTurnEnd();

    return {
      turnStart,
      showResolution,
      turnEnd,
    };
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

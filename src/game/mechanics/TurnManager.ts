import { GamePhase, GameState } from '@game/types';
import { useGameStore } from '@stores/gameStore';

export interface TurnPhase {
  phase: GamePhase;
  name: string;
  description: string;
  duration?: number; // Optional time limit in seconds
  actions: string[]; // Available actions in this phase
}

export interface Turn {
  number: number;
  currentPhase: GamePhase;
  completedPhases: GamePhase[];
  startTime: number;
  endTime?: number;
}

class TurnManager {
  private phases: TurnPhase[] = [
    {
      phase: GamePhase.PLANNING,
      name: 'Planning Phase',
      description: 'Review your resources and plan your strategy',
      actions: ['view_stats', 'check_bands', 'browse_venues'],
    },
    {
      phase: GamePhase.BOOKING,
      name: 'Booking Phase',
      description: 'Book bands at venues to create shows',
      duration: 120, // 2 minutes
      actions: ['book_show', 'cancel_booking', 'preview_synergies'],
    },
    {
      phase: GamePhase.SHOW,
      name: 'Show Night',
      description: 'Watch your shows unfold and collect rewards',
      actions: ['view_results', 'handle_incidents'],
    },
    {
      phase: GamePhase.AFTERMATH,
      name: 'Aftermath',
      description: 'Deal with the consequences and prepare for next turn',
      actions: ['pay_expenses', 'upgrade_equipment', 'recruit_bands'],
    },
  ];

  private currentTurn: Turn = {
    number: 1,
    currentPhase: GamePhase.PLANNING,
    completedPhases: [],
    startTime: Date.now(),
  };

  getCurrentPhase(): TurnPhase {
    return this.phases.find(p => p.phase === this.currentTurn.currentPhase) || this.phases[0];
  }

  getNextPhase(): TurnPhase | null {
    const currentIndex = this.phases.findIndex(p => p.phase === this.currentTurn.currentPhase);
    if (currentIndex === -1 || currentIndex === this.phases.length - 1) {
      return null; // No next phase in this turn
    }
    return this.phases[currentIndex + 1];
  }

  canAdvancePhase(gameState: GameState): { canAdvance: boolean; reason?: string } {
    const currentPhase = this.getCurrentPhase();

    switch (currentPhase.phase) {
      case GamePhase.PLANNING:
        // Always can advance from planning
        return { canAdvance: true };

      case GamePhase.BOOKING:
        // Must have at least one booking
        if (gameState.bookedShows.length === 0) {
          return { 
            canAdvance: false, 
            reason: 'You must book at least one show before proceeding' 
          };
        }
        return { canAdvance: true };

      case GamePhase.SHOW:
        // All shows must be resolved
        const unresolvedShows = gameState.bookedShows.filter(s => !s.result);
        if (unresolvedShows.length > 0) {
          return { 
            canAdvance: false, 
            reason: 'All shows must be completed first' 
          };
        }
        return { canAdvance: true };

      case GamePhase.AFTERMATH:
        // Check if all required actions are done
        if (gameState.resources.money < 0) {
          return { 
            canAdvance: false, 
            reason: 'You must resolve your debts before continuing' 
          };
        }
        return { canAdvance: true };

      default:
        return { canAdvance: true };
    }
  }

  advancePhase(): GamePhase {
    const nextPhase = this.getNextPhase();
    
    if (nextPhase) {
      // Move to next phase in current turn
      this.currentTurn.completedPhases.push(this.currentTurn.currentPhase);
      this.currentTurn.currentPhase = nextPhase.phase;
    } else {
      // End current turn and start new one
      this.endTurn();
      this.startNewTurn();
    }

    return this.currentTurn.currentPhase;
  }

  private endTurn() {
    this.currentTurn.endTime = Date.now();
    // Could save turn history here
  }

  private startNewTurn() {
    this.currentTurn = {
      number: this.currentTurn.number + 1,
      currentPhase: GamePhase.PLANNING,
      completedPhases: [],
      startTime: Date.now(),
    };
  }

  getTurnNumber(): number {
    return this.currentTurn.number;
  }

  getPhaseProgress(): number {
    const totalPhases = this.phases.length;
    const completedPhases = this.currentTurn.completedPhases.length;
    return completedPhases / totalPhases;
  }

  getRemainingPhaseTime(): number | null {
    const currentPhase = this.getCurrentPhase();
    if (!currentPhase.duration) return null;

    const phaseStartTime = this.getPhaseStartTime();
    const elapsed = (Date.now() - phaseStartTime) / 1000;
    const remaining = currentPhase.duration - elapsed;

    return Math.max(0, remaining);
  }

  private getPhaseStartTime(): number {
    // For now, assume phase started when it became current
    // In a real implementation, track this separately
    return Date.now() - 30000; // Mock: phase started 30s ago
  }

  // Check if an action is allowed in current phase
  isActionAllowed(action: string): boolean {
    const currentPhase = this.getCurrentPhase();
    return currentPhase.actions.includes(action);
  }

  // Get summary of current game state
  getTurnSummary(): {
    turn: number;
    phase: string;
    phaseDescription: string;
    canAdvance: boolean;
    nextPhase: string | null;
    progress: number;
  } {
    const currentPhase = this.getCurrentPhase();
    const nextPhase = this.getNextPhase();

    return {
      turn: this.currentTurn.number,
      phase: currentPhase.name,
      phaseDescription: currentPhase.description,
      canAdvance: true, // Simplified for now
      nextPhase: nextPhase?.name || 'Next Turn',
      progress: this.getPhaseProgress(),
    };
  }
}

export const turnManager = new TurnManager();
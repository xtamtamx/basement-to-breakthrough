import { useGameStore } from '@stores/gameStore';

// Difficulty scaling factors based on round progression
export interface DifficultyFactors {
  // Economic factors
  rentMultiplier: number;         // How much venue rent increases
  bandCostMultiplier: number;     // How much bands charge
  ticketPriceResistance: number;  // How resistant fans are to high prices
  
  // Scene factors
  fanExpectations: number;        // How hard it is to please fans
  reputationDecay: number;        // How fast reputation decreases
  competitionLevel: number;       // How many competing shows
  
  // Risk factors
  policeAttention: number;        // Chance of police intervention
  equipmentFailure: number;       // Chance of gear breaking
  bandDrama: number;              // Chance of band conflicts
  
  // Gentrification
  gentrificationRate: number;     // How fast neighborhoods change
  venueClosureRisk: number;       // Chance of venues shutting down
}

export class DifficultySystem {
  // Transient one-turn penalties declared by passive difficulty events.
  // A raided venue can't host and a band on a drama break can't be booked
  // for the turn after the event fires. The engine consumes these after the
  // affected turn's shows resolve; the booking UI reads them to disable picks.
  private raidedVenueIds = new Set<string>();
  private unavailableBandIds = new Set<string>();

  isVenueRaided(venueId: string): boolean {
    return this.raidedVenueIds.has(venueId);
  }

  isBandUnavailable(bandId: string): boolean {
    return this.unavailableBandIds.has(bandId);
  }

  // Clear the one-turn blocks (called by the engine once the affected turn's
  // shows have resolved, so the penalty lasts exactly one turn).
  consumeTurnBlocks(): void {
    this.raidedVenueIds.clear();
    this.unavailableBandIds.clear();
  }

  // Full reset for a new run
  resetBlocks(): void {
    this.raidedVenueIds.clear();
    this.unavailableBandIds.clear();
  }

  // --- durable resume: the one-turn blocks must survive a refresh/load ---
  serializeBlocks(): { raided: string[]; unavailable: string[] } {
    return {
      raided: Array.from(this.raidedVenueIds),
      unavailable: Array.from(this.unavailableBandIds),
    };
  }

  restoreBlocks(data?: { raided?: string[]; unavailable?: string[] }): void {
    this.raidedVenueIds = new Set(data?.raided ?? []);
    this.unavailableBandIds = new Set(data?.unavailable ?? []);
  }

  // Get current difficulty factors based on game progression
  getCurrentDifficulty(): DifficultyFactors {
    const state = useGameStore.getState();
    const { currentRound, reputation, fans } = state;
    
    // Base difficulty increases with rounds
    const roundFactor = Math.min(currentRound / 50, 2); // Cap at 2x after 50 rounds
    
    // Success makes things harder (tall poppy syndrome)
    const successFactor = Math.min((reputation + fans) / 1000, 1.5);
    
    return {
      // Economic pressure increases over time (balance pass: the original
      // ramps outran revenue and bankrupted competent players by mid-run)
      rentMultiplier: 1 + (roundFactor * 0.25) + (successFactor * 0.15),
      bandCostMultiplier: 1 + (roundFactor * 0.15) + (successFactor * 0.1),
      ticketPriceResistance: 1 + (roundFactor * 0.4),

      // Scene becomes more demanding
      fanExpectations: 1 + (roundFactor * 0.6) + (successFactor * 0.4),
      reputationDecay: Math.min(roundFactor * 1, 3), // Max 3 rep lost per turn
      competitionLevel: Math.floor(1 + (roundFactor * 3)), // More competing shows
      
      // Risks increase with visibility
      policeAttention: 0.05 + (roundFactor * 0.1) + (successFactor * 0.05),
      equipmentFailure: 0.02 + (roundFactor * 0.03),
      bandDrama: 0.1 + (successFactor * 0.1),
      
      // Gentrification accelerates
      gentrificationRate: 0.02 + (roundFactor * 0.03),
      venueClosureRisk: 0.01 + (roundFactor * 0.02) + (successFactor * 0.01)
    };
  }
  
  // Apply passive difficulty effects each turn
  applyPassiveDifficulty(): {
    reputationLost: number;
    message?: string;
  } {
    const state = useGameStore.getState();
    const difficulty = this.getCurrentDifficulty();
    
    // Reputation naturally decays
    const repLoss = Math.floor(difficulty.reputationDecay);
    if (repLoss > 0) {
      state.addReputation(-repLoss);
    }
    
    // Check for random difficulty events
    const events: string[] = [];
    
    // Police crackdown — the venue is shut down for the next turn (its shows
    // get cancelled; booking is disabled until it clears)
    if (Math.random() < difficulty.policeAttention && state.venues.length > 0) {
      const venue = state.venues[Math.floor(Math.random() * state.venues.length)];
      this.raidedVenueIds.add(venue.id);
      events.push(`Police shut down ${venue.name} — no shows there next turn!`);
    }
    
    // Equipment failure
    if (Math.random() < difficulty.equipmentFailure) {
      const cost = Math.floor(50 + difficulty.bandCostMultiplier * 50);
      state.addMoney(-cost);
      events.push(`PA system blew out! Emergency repairs cost $${cost}`);
    }
    
    // Band drama — the band takes the next turn off (can't be booked)
    if (Math.random() < difficulty.bandDrama && state.rosterBandIds.length > 1) {
      // Pick a RANDOM roster band (like the police-crackdown venue pick above) —
      // .find() always returned the first band in allBands order, so drama hit the
      // same band every time.
      const rosterBands = state.allBands.filter(b => state.rosterBandIds.includes(b.id));
      const band = rosterBands[Math.floor(Math.random() * rosterBands.length)];
      if (band) {
        this.unavailableBandIds.add(band.id);
        events.push(`${band.name} is having internal conflicts — they're sitting out next turn.`);
      }
    }
    
    return {
      reputationLost: repLoss,
      message: events.length > 0 ? events.join(' ') : undefined
    };
  }
  
  // Calculate show difficulty modifiers
  getShowDifficultyModifiers(_baseAttendance: number, ticketPrice: number): {
    attendanceMultiplier: number;
    revenueMultiplier: number;
  } {
    const difficulty = this.getCurrentDifficulty();
    
    // Higher expectations mean lower attendance
    const expectationPenalty = 1 / difficulty.fanExpectations;
    
    // Price resistance reduces attendance at higher prices
    const pricePenalty = ticketPrice > 10 
      ? Math.max(0.5, 1 - ((ticketPrice - 10) * 0.05 * difficulty.ticketPriceResistance))
      : 1;
    
    return {
      attendanceMultiplier: expectationPenalty * pricePenalty,
      revenueMultiplier: 1 // Could add more modifiers here
    };
  }
  
  // Get venue cost with difficulty scaling
  getScaledVenueCost(baseRent: number): number {
    const difficulty = this.getCurrentDifficulty();
    return Math.floor(baseRent * difficulty.rentMultiplier);
  }
  
  // Get band cost with difficulty scaling
  getScaledBandCost(baseCost: number = 24): number {
    const difficulty = this.getCurrentDifficulty();
    return Math.floor(baseCost * difficulty.bandCostMultiplier);
  }
  
  // Check if player is struggling (for adaptive difficulty)
  isPlayerStruggling(): boolean {
    const state = useGameStore.getState();
    return state.money < 100 && state.stress > 70;
  }
  
  // Get difficulty milestone messages
  getDifficultyMilestone(round: number): string | null {
    const milestones: Record<number, string> = {
      10: "The scene is taking notice. Expectations are rising.",
      20: "You're becoming known. With fame comes pressure.",
      30: "The underground isn't so underground anymore.",
      40: "Gentrification is accelerating. The old venues are disappearing.",
      50: "You've made it this far, but the scene is changing fast.",
      75: "The city barely resembles what it was. Can you keep the spirit alive?",
      100: "Legendary status achieved. But at what cost?"
    };
    
    return milestones[round] || null;
  }
}

export const difficultySystem = new DifficultySystem();
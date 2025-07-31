import { Band, Venue, Show, ShowResult, GameState, Incident } from '@game/types';
import { synergyEngine } from './SynergyEngine';
import { incidentSystem } from './IncidentSystem';
import { factionSystem } from './FactionSystem';
import { equipmentManager } from './EquipmentManager';
import { equipmentManagerV2 } from './EquipmentManagerV2';

export interface ShowOutcome {
  show: Show;
  result: ShowResult;
  incidents: Incident[];
  synergies: ReturnType<typeof synergyEngine.calculateSynergies>;
}

class ShowExecutor {
  private executeShowInternal(
    band: Band,
    venue: Venue,
    ticketPrice: number,
    gameState: GameState
  ): ShowOutcome {
    const show: Show = {
      id: `show-${Date.now()}`,
      bandId: band.id,
      venueId: venue.id,
      date: gameState.turn, // Using turn as date for now
      ticketPrice,
      ticketsSold: 0,
      revenue: 0,
      reputationGain: 0,
      fansGained: 0,
      stress: 0,
    };

    // Calculate base attendance
    const baseAttendance = this.calculateBaseAttendance(band, venue);
    
    // Initialize incidents array
    const incidents: Incident[] = [];
    
    // Apply synergies
    const synergies = synergyEngine.calculateSynergies([band], venue);
    let attendanceMultiplier = 1;
    let reputationMultiplier = 1;
    let moneyMultiplier = 1;

    synergies.forEach(synergy => {
      attendanceMultiplier *= synergy.multiplier;
      if (synergy.reputationBonus) {
        reputationMultiplier += synergy.reputationBonus / 100;
      }
    });

    // Get faction modifiers
    const factionMods = factionSystem.getShowModifiers(band, venue);
    
    // Apply faction modifiers
    attendanceMultiplier *= factionMods.fanBonus;
    reputationMultiplier *= factionMods.reputationMultiplier;
    moneyMultiplier *= (1 + factionMods.moneyModifier);
    
    // Check for faction-related drama
    const dramaRoll = Math.random();
    if (dramaRoll < factionMods.dramaChance) {
      incidents.push({
        type: 'FACTION_DRAMA',
        description: 'Faction tensions cause problems at the show',
        effects: { reputationChange: -5 }
      });
    }

    // Get equipment effects (V2)
    const equipmentEffects = equipmentManagerV2.getVenueEquipmentEffects(venue.id);
    
    // Apply equipment capacity bonus
    let equipmentCapacityBonus = 1;
    if (equipmentEffects.capacityBonus) {
      equipmentCapacityBonus = 1 + (equipmentEffects.capacityBonus / 100);
    }
    
    // Apply equipment reputation multiplier
    if (equipmentEffects.reputationMultiplier) {
      reputationMultiplier *= equipmentEffects.reputationMultiplier;
    }
    
    // Check band equipment requirements
    const equipmentRequirements = equipmentManagerV2.checkBandRequirements(band, venue);
    if (!equipmentRequirements.met) {
      // Missing equipment causes problems
      attendanceMultiplier *= 0.7; // 30% attendance penalty
      incidents.push({
        type: 'EQUIPMENT_MISSING',
        description: `Missing required equipment: ${equipmentRequirements.missing.join(', ')}`,
        effects: { 
          attendanceChange: -30, 
          stressIncrease: 20,
          reputationChange: -3
        }
      });
    }
    
    // Calculate final attendance with equipment effects
    let finalAttendance = Math.floor(baseAttendance * attendanceMultiplier * equipmentCapacityBonus);
    finalAttendance = Math.min(finalAttendance, venue.capacity);

    // Check for incidents from incident system
    const systemIncidents = incidentSystem.checkForIncidents(band, venue, gameState);
    incidents.push(...systemIncidents);
    
    // Apply incident effects
    incidents.forEach(incident => {
      if (incident.effects.attendanceChange) {
        finalAttendance = Math.max(0, Math.floor(finalAttendance * (1 + incident.effects.attendanceChange / 100)));
      }
    });

    // Calculate base results
    const baseRevenue = finalAttendance * ticketPrice * moneyMultiplier;
    const baseReputationGain = this.calculateReputationGain(band, venue, finalAttendance, reputationMultiplier);
    const baseFansGained = this.calculateFansGained(band, venue, finalAttendance);
    let baseStress = this.calculateStress(band, venue, incidents.length > 0);
    
    // Apply stress increase from incidents
    incidents.forEach(incident => {
      if (incident.effects.stressIncrease) {
        baseStress += incident.effects.stressIncrease;
      }
    });
    
    // Apply equipment stress reduction
    if (equipmentEffects.stressReduction) {
      baseStress = Math.max(0, baseStress - equipmentEffects.stressReduction);
    }

    // Apply equipment effects
    const equipmentResults = equipmentManager.applyEffectsToShow(
      finalAttendance,
      baseRevenue,
      baseReputationGain,
      baseFansGained,
      band,
      venue
    );

    // Final values (using old equipment system effects for compatibility)
    const revenue = equipmentResults.revenue;
    let reputationGain = equipmentResults.reputation;
    const fansGained = equipmentResults.fans;
    const stress = baseStress; // Already includes V2 equipment stress reduction
    
    // Add flat reputation bonuses from synergies
    synergies.forEach(synergy => {
      if (synergy.reputationBonus) {
        reputationGain += synergy.reputationBonus;
      }
    });

    // Update faction standings based on show result
    const showSuccess = finalAttendance >= venue.capacity * 0.5;
    factionSystem.updateStandingsFromShow(band, venue, showSuccess);
    
    // Degrade equipment after show
    equipmentManagerV2.degradeEquipment(1);

    // Update show object
    show.ticketsSold = finalAttendance;
    show.revenue = Math.floor(revenue);
    show.reputationGain = Math.floor(reputationGain);
    show.fansGained = Math.floor(fansGained);
    show.stress = stress;

    // Create result
    const result: ShowResult = {
      showId: show.id,
      success: finalAttendance >= venue.capacity * 0.5, // 50% capacity = success
      attendance: finalAttendance,
      revenue: show.revenue,
      reputationChange: show.reputationGain,
      reputationGain: show.reputationGain,
      fansGained: show.fansGained,
      incidentOccurred: incidents.length > 0,
      incidents: incidents,
      isSuccess: finalAttendance >= venue.capacity * 0.5,
      financials: {
        revenue: show.revenue,
        costs: venue.rent,
        profit: show.revenue - venue.rent
      }
    };

    return {
      show,
      result,
      incidents,
      synergies,
    };
  }

  private calculateBaseAttendance(band: Band, venue: Venue): number {
    // Base formula considering band popularity and venue atmosphere
    const popularityFactor = band.popularity / 100;
    const atmosphereFactor = venue.atmosphere / 100;
    const authenticityMatch = Math.abs(band.authenticity - venue.authenticity) < 20 ? 1.2 : 0.8;
    
    const basePercentage = (popularityFactor + atmosphereFactor) / 2 * authenticityMatch;
    
    // Add some randomness (80% to 120% of calculated value)
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    return Math.floor(venue.capacity * basePercentage * randomFactor);
  }

  private calculateReputationGain(
    band: Band,
    venue: Venue,
    attendance: number,
    multiplier: number
  ): number {
    const capacityRatio = attendance / venue.capacity;
    const authenticityBonus = band.authenticity > 80 ? 1.5 : 1;
    
    let baseRep = 0;
    if (capacityRatio >= 0.9) {
      baseRep = 10; // Packed show
    } else if (capacityRatio >= 0.7) {
      baseRep = 5; // Good turnout
    } else if (capacityRatio >= 0.5) {
      baseRep = 2; // Decent show
    } else if (capacityRatio >= 0.3) {
      baseRep = 0; // Poor turnout
    } else {
      baseRep = -5; // Embarrassing
    }
    
    return baseRep * authenticityBonus * multiplier;
  }

  private calculateFansGained(band: Band, venue: Venue, attendance: number): number {
    // Gain fans based on performance and venue type
    const energyFactor = band.energy / 100;
    const venueBonus = this.getVenueTypeBonus(venue.type);
    
    const baseFans = attendance * 0.1 * energyFactor * venueBonus;
    
    // Add randomness
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    return Math.floor(baseFans * randomFactor);
  }

  private calculateStress(band: Band, venue: Venue, hadIncident: boolean): number {
    let stress = 0;
    
    // Base stress from performing
    stress += 5;
    
    // Venue difficulty
    stress += venue.bookingDifficulty;
    
    // Incident stress
    if (hadIncident) {
      stress += 10;
    }
    
    // Technical requirements stress
    if (band.technicalSkill < 70 && venue.capacity > 100) {
      stress += 5;
    }
    
    return stress;
  }

  private getVenueTypeBonus(type: string): number {
    const bonuses: Record<string, number> = {
      BASEMENT: 0.5,
      GARAGE: 0.6,
      HOUSE_SHOW: 0.7,
      DIY_SPACE: 0.8,
      DIVE_BAR: 0.9,
      PUNK_CLUB: 1.0,
      METAL_VENUE: 1.0,
      WAREHOUSE: 1.1,
      THEATER: 1.2,
      CONCERT_HALL: 1.3,
      ARENA: 1.5,
      FESTIVAL_GROUNDS: 2.0,
    };
    
    return bonuses[type] || 1.0;
  }

  // Execute multiple shows at once (for turn-based gameplay)
  executeAllShows(bookings: Array<{ band: Band; venue: Venue; ticketPrice: number }>, gameState: GameState): ShowOutcome[] {
    return bookings.map(booking => 
      this.executeShowInternal(booking.band, booking.venue, booking.ticketPrice, gameState)
    );
  }

  // Async wrapper for UI compatibility
  async executeShow(
    show: Show,
    band: Band,
    venue: Venue,
    gameState: { reputation: number; factionStandings: Map<string, number> }
  ): Promise<ShowResult> {
    // Create a proper GameState object
    const fullGameState: GameState = {
      id: 'current',
      turn: 1, // This should come from the actual game state
      phase: 'PERFORMANCE' as const,
      resources: {
        money: 0,
        reputation: gameState.reputation,
        connections: 0,
        stress: 0,
        fans: 0
      },
      bookedShows: [],
      availableBands: [],
      sceneReputation: {
        overall: gameState.reputation,
        factions: [],
        relationships: []
      },
      unlockedContent: [],
      achievements: [],
      settings: { difficulty: 'normal', musicVolume: 1, sfxVolume: 1 }
    };

    // Execute the show using the internal method
    const outcome = this.executeShowInternal(band, venue, show.ticketPrice, fullGameState);
    
    // Return the result in the expected format
    return outcome.result;
  }
}

export const showExecutor = new ShowExecutor();
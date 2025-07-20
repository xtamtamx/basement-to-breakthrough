import { Band, Venue, GameState, IncidentType } from '@game/types';

export interface Incident {
  type: IncidentType;
  description: string;
  effects: {
    attendanceChange?: number; // Percentage change
    reputationChange?: number; // Flat change
    moneyChange?: number; // Flat change
    stressChange?: number; // Flat change
  };
  preventable: boolean;
  preventionCost?: number;
}

class IncidentSystem {
  private incidents: Record<IncidentType, Incident[]> = {
    [IncidentType.EQUIPMENT_FAILURE]: [
      {
        type: IncidentType.EQUIPMENT_FAILURE,
        description: "The PA system blows out mid-set!",
        effects: { attendanceChange: -20, reputationChange: -5 },
        preventable: true,
        preventionCost: 100,
      },
      {
        type: IncidentType.EQUIPMENT_FAILURE,
        description: "Guitar amp catches fire during the show!",
        effects: { attendanceChange: -30, reputationChange: -10, stressChange: 15 },
        preventable: true,
        preventionCost: 150,
      },
    ],
    [IncidentType.POLICE_SHUTDOWN]: [
      {
        type: IncidentType.POLICE_SHUTDOWN,
        description: "Cops shut down the show for noise complaints!",
        effects: { attendanceChange: -100, reputationChange: 5, moneyChange: -200 },
        preventable: false,
      },
      {
        type: IncidentType.POLICE_SHUTDOWN,
        description: "Police raid - everyone scattered!",
        effects: { attendanceChange: -100, reputationChange: 10, stressChange: 20 },
        preventable: false,
      },
    ],
    [IncidentType.BAND_DRAMA]: [
      {
        type: IncidentType.BAND_DRAMA,
        description: "Band members get in a fistfight on stage!",
        effects: { reputationChange: -15, stressChange: 25 },
        preventable: false,
      },
      {
        type: IncidentType.BAND_DRAMA,
        description: "Lead singer storms off mid-set!",
        effects: { attendanceChange: -50, reputationChange: -20 },
        preventable: false,
      },
    ],
    [IncidentType.CROWD_INCIDENT]: [
      {
        type: IncidentType.CROWD_INCIDENT,
        description: "Mosh pit gets out of control!",
        effects: { attendanceChange: -10, reputationChange: 5, stressChange: 10 },
        preventable: true,
        preventionCost: 50,
      },
      {
        type: IncidentType.CROWD_INCIDENT,
        description: "Stage diving accident - someone got hurt!",
        effects: { attendanceChange: -25, reputationChange: -10, moneyChange: -100 },
        preventable: true,
        preventionCost: 75,
      },
    ],
    [IncidentType.VENUE_ISSUE]: [
      {
        type: IncidentType.VENUE_ISSUE,
        description: "Venue double-booked the night!",
        effects: { attendanceChange: -50, reputationChange: -5 },
        preventable: false,
      },
      {
        type: IncidentType.VENUE_ISSUE,
        description: "Power outage hits the venue!",
        effects: { attendanceChange: -40, moneyChange: -100 },
        preventable: false,
      },
    ],
    [IncidentType.RIVAL_SABOTAGE]: [
      {
        type: IncidentType.RIVAL_SABOTAGE,
        description: "Rival band spreads rumors about cancellation!",
        effects: { attendanceChange: -30, reputationChange: -5 },
        preventable: false,
      },
      {
        type: IncidentType.RIVAL_SABOTAGE,
        description: "Someone slashed the van tires!",
        effects: { moneyChange: -150, stressChange: 15 },
        preventable: false,
      },
    ],
  };

  checkForIncidents(band: Band, venue: Venue, gameState: GameState): Incident[] {
    const triggeredIncidents: Incident[] = [];
    
    // Base incident chance
    let incidentChance = 0.15; // 15% base chance
    
    // Modifiers based on various factors
    if (venue.hasSecurity) {
      incidentChance -= 0.05;
    }
    
    if (band.traits.some(t => t.name.includes('Chaotic'))) {
      incidentChance += 0.1;
    }
    
    if (gameState.resources.reputation > 50) {
      incidentChance -= 0.02;
    }
    
    // High stress increases incident chance
    if (gameState.resources.stress > 50) {
      incidentChance += 0.1;
    }
    
    // Roll for incident
    if (Math.random() < incidentChance) {
      const incident = this.selectIncident(band, venue, gameState);
      if (incident) {
        triggeredIncidents.push(incident);
      }
    }
    
    // Small chance for multiple incidents
    if (Math.random() < 0.05 && triggeredIncidents.length > 0) {
      const secondIncident = this.selectIncident(band, venue, gameState, triggeredIncidents[0].type);
      if (secondIncident) {
        triggeredIncidents.push(secondIncident);
      }
    }
    
    return triggeredIncidents;
  }

  private selectIncident(
    band: Band,
    venue: Venue,
    gameState: GameState,
    excludeType?: IncidentType
  ): Incident | null {
    // Weight different incident types based on context
    const weights: Partial<Record<IncidentType, number>> = {};
    
    // Equipment failure more likely in larger venues
    weights[IncidentType.EQUIPMENT_FAILURE] = venue.capacity > 100 ? 3 : 1;
    
    // Police shutdown more likely based on location
    weights[IncidentType.POLICE_SHUTDOWN] = venue.location.policePresence / 20;
    
    // Band drama based on stress
    weights[IncidentType.BAND_DRAMA] = gameState.resources.stress > 30 ? 2 : 0.5;
    
    // Crowd incidents in energetic shows
    weights[IncidentType.CROWD_INCIDENT] = band.energy > 80 ? 2 : 1;
    
    // Venue issues are random
    weights[IncidentType.VENUE_ISSUE] = 1;
    
    // Rival sabotage if low reputation
    weights[IncidentType.RIVAL_SABOTAGE] = gameState.resources.reputation < 30 ? 2 : 0.5;
    
    // Remove excluded type
    if (excludeType) {
      delete weights[excludeType];
    }
    
    // Select incident type
    const selectedType = this.weightedRandom(weights);
    if (!selectedType) return null;
    
    // Select specific incident
    const possibleIncidents = this.incidents[selectedType];
    return possibleIncidents[Math.floor(Math.random() * possibleIncidents.length)];
  }

  private weightedRandom(weights: Partial<Record<IncidentType, number>>): IncidentType | null {
    const entries = Object.entries(weights) as [IncidentType, number][];
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    
    if (totalWeight === 0) return null;
    
    let random = Math.random() * totalWeight;
    
    for (const [type, weight] of entries) {
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }
    
    return entries[0][0]; // Fallback
  }

  // Get incident description with band/venue names filled in
  getIncidentDescription(incident: Incident, band: Band, venue: Venue): string {
    return incident.description
      .replace('{band}', band.name)
      .replace('{venue}', venue.name);
  }

  // Check if an incident can be prevented
  canPreventIncident(incident: Incident, gameState: GameState): boolean {
    if (!incident.preventable) return false;
    if (!incident.preventionCost) return true;
    return gameState.resources.money >= incident.preventionCost;
  }
}

export const incidentSystem = new IncidentSystem();
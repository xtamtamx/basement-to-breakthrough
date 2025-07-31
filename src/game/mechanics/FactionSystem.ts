import { Faction, Band, Venue, VenueType, Show, FactionEvent, FactionEventType, FactionValues, FactionModifiers, FactionChoice, FactionChoiceEffects, Resources, TraitType } from '@game/types';
import { SATIRICAL_FACTION_DESCRIPTIONS } from '@game/data/satiricalText';

class FactionSystem {
  private factions: Map<string, Faction> = new Map();
  private playerStandings: Map<string, number> = new Map();
  private factionEvents: FactionEvent[] = [];

  constructor() {
    this.initializeFactions();
  }

  private initializeFactions() {
    // Define the 5 core factions
    const factionData: Faction[] = [
      {
        id: 'diy-purists',
        name: SATIRICAL_FACTION_DESCRIPTIONS.DIY_PURISTS.name,
        description: SATIRICAL_FACTION_DESCRIPTIONS.DIY_PURISTS.description,
        values: {
          authenticity: 100,
          technicalSkill: 30,
          popularity: -50,
          tradition: 80,
          innovation: 40
        },
        modifiers: {
          fanBonus: 0.8,
          reputationMultiplier: 1.5,
          moneyModifier: -0.3,
          capacityBonus: 0,
          dramaChance: 0.2
        },
        relationships: {},
        memberBands: [],
        controlledVenues: [],
        iconColor: '#8B4513',
        traits: ['authentic', 'anti-commercial', 'community-focused']
      },
      {
        id: 'metal-elite',
        name: 'Metal Elite',
        description: 'Technical prowess above all. Shredding is a way of life.',
        values: {
          authenticity: 60,
          technicalSkill: 100,
          popularity: 40,
          tradition: 70,
          innovation: 50
        },
        modifiers: {
          fanBonus: 1.2,
          reputationMultiplier: 1.1,
          moneyModifier: 0.1,
          capacityBonus: 0.1,
          dramaChance: 0.3
        },
        relationships: {},
        memberBands: [],
        controlledVenues: [],
        iconColor: '#000000',
        traits: ['technical', 'elitist', 'competitive']
      },
      {
        id: 'indie-crowd',
        name: 'Indie Crowd',
        description: 'Art for art\'s sake. Aesthetic and emotion over everything.',
        values: {
          authenticity: 70,
          technicalSkill: 50,
          popularity: 60,
          tradition: 30,
          innovation: 90
        },
        modifiers: {
          fanBonus: 1.0,
          reputationMultiplier: 1.2,
          moneyModifier: 0,
          capacityBonus: 0,
          dramaChance: 0.4
        },
        relationships: {},
        memberBands: [],
        controlledVenues: [],
        iconColor: '#FF69B4',
        traits: ['artistic', 'experimental', 'trendy']
      },
      {
        id: 'old-guard',
        name: 'Old Guard',
        description: 'Keepers of the flame. Respect the history or get out.',
        values: {
          authenticity: 80,
          technicalSkill: 70,
          popularity: 20,
          tradition: 100,
          innovation: 10
        },
        modifiers: {
          fanBonus: 0.9,
          reputationMultiplier: 1.3,
          moneyModifier: -0.1,
          capacityBonus: 0.2,
          dramaChance: 0.5
        },
        relationships: {},
        memberBands: [],
        controlledVenues: [],
        iconColor: '#4B0082',
        traits: ['traditional', 'gatekeeping', 'respected']
      },
      {
        id: 'new-wave',
        name: 'New Wave',
        description: 'Breaking boundaries and mixing genres. The future is now.',
        values: {
          authenticity: 50,
          technicalSkill: 60,
          popularity: 80,
          tradition: 20,
          innovation: 100
        },
        modifiers: {
          fanBonus: 1.3,
          reputationMultiplier: 0.9,
          moneyModifier: 0.2,
          capacityBonus: 0,
          dramaChance: 0.6
        },
        relationships: {},
        memberBands: [],
        controlledVenues: [],
        iconColor: '#00CED1',
        traits: ['innovative', 'crossover', 'polarizing']
      }
    ];

    // Initialize factions and relationships
    factionData.forEach(faction => {
      this.factions.set(faction.id, faction);
      this.playerStandings.set(faction.id, 0); // Start neutral
    });

    // Set initial faction relationships
    this.setFactionRelationship('diy-purists', 'metal-elite', -30);
    this.setFactionRelationship('diy-purists', 'new-wave', -70);
    this.setFactionRelationship('diy-purists', 'old-guard', 50);
    this.setFactionRelationship('metal-elite', 'indie-crowd', -40);
    this.setFactionRelationship('old-guard', 'new-wave', -80);
    this.setFactionRelationship('indie-crowd', 'new-wave', 60);
  }

  private setFactionRelationship(faction1Id: string, faction2Id: string, value: number) {
    const faction1 = this.factions.get(faction1Id);
    const faction2 = this.factions.get(faction2Id);
    if (faction1 && faction2) {
      faction1.relationships[faction2Id] = value;
      faction2.relationships[faction1Id] = value;
    }
  }

  // Calculate how well a band aligns with a faction
  calculateBandAlignment(band: Band, factionId: string): number {
    const faction = this.factions.get(factionId);
    if (!faction) return 0;

    let alignment = 0;
    
    // Compare values
    alignment += (100 - Math.abs(band.authenticity - faction.values.authenticity)) * 0.3;
    alignment += (100 - Math.abs(band.technicalSkill - faction.values.technicalSkill)) * 0.2;
    
    // Special handling for popularity - negative values mean faction prefers low popularity
    if (faction.values.popularity < 0) {
      // Faction prefers low popularity - higher band popularity is worse
      alignment += (100 - band.popularity) * 0.2;
    } else {
      alignment += (100 - Math.abs(band.popularity - faction.values.popularity)) * 0.2;
    }
    
    // Check for matching traits
    band.traits.forEach(trait => {
      if (faction.traits.includes(trait.type.toLowerCase())) {
        alignment += 10;
      }
    });

    return Math.max(0, Math.min(100, alignment));
  }

  // Get faction modifiers for a show
  getShowModifiers(band: Band, _venue: Venue): FactionModifiers {
    const combinedModifiers: FactionModifiers = {
      fanBonus: 1,
      reputationMultiplier: 1,
      moneyModifier: 0,
      capacityBonus: 0,
      dramaChance: 0
    };

    // Check each faction's influence
    this.factions.forEach((faction, factionId) => {
      const standing = this.playerStandings.get(factionId) || 0;
      const alignment = this.calculateBandAlignment(band, factionId);
      
      // Apply modifiers based on standing and alignment
      if (standing > 50 && alignment > 70) {
        // Strong positive relationship
        combinedModifiers.fanBonus *= faction.modifiers.fanBonus * 1.2;
        combinedModifiers.reputationMultiplier *= faction.modifiers.reputationMultiplier * 1.1;
        combinedModifiers.moneyModifier += faction.modifiers.moneyModifier * 0.5;
      } else if (standing < -50 && alignment > 70) {
        // Negative relationship with aligned faction
        combinedModifiers.fanBonus *= 0.7;
        combinedModifiers.reputationMultiplier *= 0.8;
        combinedModifiers.dramaChance += 0.3;
      }
    });

    return combinedModifiers;
  }

  // Update standings based on show results
  updateStandingsFromShow(band: Band, venue: Venue, showSuccess: boolean) {
    this.factions.forEach((faction, factionId) => {
      const alignment = this.calculateBandAlignment(band, factionId);
      let standingChange = 0;

      if (alignment > 70) {
        // Faction likes this band
        standingChange = showSuccess ? 5 : -2;
      } else if (alignment < 30) {
        // Faction dislikes this band
        standingChange = showSuccess ? -3 : 1;
      }

      // Venue alignment also matters
      if (faction.controlledVenues.includes(venue.id)) {
        standingChange += showSuccess ? 3 : -5;
      }

      this.adjustStanding(factionId, standingChange);
    });

    // Check for faction events
    this.checkForFactionEvents();
  }


  // Generate faction events based on current state
  private checkForFactionEvents() {
    const events: FactionEvent[] = [];

    // Check for conflicts
    this.factions.forEach((faction1, faction1Id) => {
      this.factions.forEach((faction2, faction2Id) => {
        if (faction1Id < faction2Id) { // Avoid duplicates
          const standing1 = this.playerStandings.get(faction1Id) || 0;
          const standing2 = this.playerStandings.get(faction2Id) || 0;
          const relationship = faction1.relationships[faction2Id] || 0;

          // Conflict event if supporting opposing factions
          if (relationship < -50 && standing1 > 30 && standing2 > 30) {
            events.push(this.createConflictEvent(faction1, faction2));
          }
        }
      });
    });

    this.factionEvents.push(...events);
  }

  private createConflictEvent(faction1: Faction, faction2: Faction): FactionEvent {
    const factionChanges1: Record<string, number> = {
      [faction1.id]: 20,
      [faction2.id]: -30
    };
    
    const factionChanges2: Record<string, number> = {
      [faction1.id]: -30,
      [faction2.id]: 20
    };
    
    const factionChangesNeutral: Record<string, number> = {
      [faction1.id]: -10,
      [faction2.id]: -10
    };

    return {
      id: `conflict-${faction1.id}-${faction2.id}-${Date.now()}`,
      type: FactionEventType.CONFLICT,
      factionId: faction1.id,
      title: `${faction1.name} vs ${faction2.name}`,
      description: `Tensions are rising between ${faction1.name} and ${faction2.name}. You must choose a side or try to stay neutral.`,
      choices: [
        {
          id: 'side-with-1',
          text: `Support ${faction1.name}`,
          effects: {
            factionChanges: factionChanges1,
            resourceChanges: { reputation: 5 } as Partial<Resources>
          }
        },
        {
          id: 'side-with-2', 
          text: `Support ${faction2.name}`,
          effects: {
            factionChanges: factionChanges2,
            resourceChanges: { reputation: 5 } as Partial<Resources>
          }
        },
        {
          id: 'stay-neutral',
          text: 'Try to stay neutral',
          effects: {
            factionChanges: factionChangesNeutral,
            resourceChanges: { reputation: -5, stress: 10 } as Partial<Resources>
          }
        }
      ],
      triggered: false
    };
  }

  // Get current faction events
  getPendingEvents(): FactionEvent[] {
    return this.factionEvents.filter(event => !event.triggered);
  }

  // Get current event (for UI/testing)
  getCurrentEvent(): FactionEvent | null {
    return this.factionEvents.length > 0 ? this.factionEvents[0] : null;
  }

  // Apply player choice to faction event
  applyEventChoice(eventId: string, choiceId: string) {
    const event = this.factionEvents.find(e => e.id === eventId);
    if (!event) return;

    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Apply faction changes
    Object.entries(choice.effects.factionChanges).forEach(([factionId, change]) => {
      this.adjustStanding(factionId, change);
    });

    // Mark event as triggered
    event.triggered = true;

    return choice.effects;
  }

  // Get all faction data for UI
  getAllFactionData(): Array<Faction & { playerStanding: number }> {
    const data: Array<Faction & { playerStanding: number }> = [];
    this.factions.forEach((faction, id) => {
      data.push({
        ...faction,
        playerStanding: this.playerStandings.get(id) || 0
      });
    });
    return data;
  }

  // Get standing with a specific faction
  getStanding(factionId: string): number {
    return this.playerStandings.get(factionId) || 0;
  }

  // Set standing directly (for testing/save loading)
  setStanding(factionId: string, standing: number): void {
    this.playerStandings.set(factionId, Math.max(-100, Math.min(100, standing)));
  }

  // Adjust standing by a delta
  adjustStanding(factionId: string, change: number) {
    const current = this.playerStandings.get(factionId) || 0;
    const newStanding = Math.max(-100, Math.min(100, current + change));
    this.playerStandings.set(factionId, newStanding);

    // Check for relationship cascades
    const faction = this.factions.get(factionId);
    if (faction && Math.abs(change) > 5) {
      Object.entries(faction.relationships).forEach(([otherFactionId, relationship]) => {
        if (relationship > 50) {
          // Allied faction
          this.adjustStanding(otherFactionId, change * 0.3);
        } else if (relationship < -50) {
          // Enemy faction
          this.adjustStanding(otherFactionId, -change * 0.3);
        }
      });
    }
  }

  // Generate faction events (public for testing)
  generateFactionEvents(): FactionEvent[] {
    const events: FactionEvent[] = [];
    
    // Check each faction's standing
    this.factions.forEach((faction, factionId) => {
      const standing = this.playerStandings.get(factionId) || 0;
      
      // Generate events based on standing thresholds
      if (standing > 70) {
        // High standing - generate positive events occasionally
        events.push(this.createPositiveEvent(faction, standing));
      } else if (standing < -50) {
        // Low standing - generate negative events
        events.push(this.createNegativeEvent(faction, standing));
      }
    });
    
    // Check for faction conflicts
    this.checkForFactionEvents();
    
    // Add generated events to the faction events array
    this.factionEvents.push(...events);
    
    return events;
  }

  private createPositiveEvent(faction: Faction, _standing: number): FactionEvent {
    const factionChanges: Record<string, number> = {
      [faction.id]: 5
    };
    
    return {
      id: `${faction.id}-positive-${Date.now()}`,
      type: FactionEventType.ALLIANCE,
      title: `${faction.name} Support`,
      description: `The ${faction.name} appreciate your dedication to their values.`,
      factionId: faction.id,
      choices: [
        {
          id: 'accept',
          text: 'Accept their support',
          effects: {
            reputation: 10,
            factionChanges,
            bandRelations: {}
          }
        }
      ],
      triggered: false
    };
  }

  private createNegativeEvent(faction: Faction, _standing: number): FactionEvent {
    const factionChanges: Record<string, number> = {
      [faction.id]: -10
    };
    
    return {
      id: `${faction.id}-negative-${Date.now()}`,
      type: FactionEventType.DRAMA,
      title: `${faction.name} Displeasure`,
      description: `The ${faction.name} are unhappy with your recent actions.`,
      factionId: faction.id,
      choices: [
        {
          id: 'apologize',
          text: 'Try to make amends',
          effects: {
            reputation: -5,
            factionChanges: { [faction.id]: 10 },
            bandRelations: {}
          }
        },
        {
          id: 'ignore',
          text: 'Ignore their complaints',
          effects: {
            reputation: 5,
            factionChanges,
            bandRelations: {}
          }
        }
      ],
      triggered: false
    };
  }

  // Get all factions
  getAllFactions() {
    return Array.from(this.factions.values());
  }

  // Check if a band is favored by a faction
  isBandFavored(band: Band, factionId: string): boolean {
    const alignment = this.calculateBandAlignment(band, factionId);
    return alignment > 70;
  }

  // Check if a venue is favored by a faction
  isVenueFavored(venue: Venue, factionId: string): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) return false;
    
    // Check based on venue type and faction preferences
    switch (factionId) {
      case 'diy-purists':
        return venue.type === VenueType.BASEMENT || venue.type === VenueType.DIY_SPACE;
      case 'metal-elite':
        return venue.type === VenueType.METAL_BAR || venue.capacity > 200;
      case 'indie-crowd':
        return venue.type === VenueType.COFFEE_SHOP || venue.type === VenueType.GALLERY;
      case 'old-guard':
        return venue.type === VenueType.DIVE_BAR || venue.type === VenueType.LEGION_HALL;
      case 'new-wave':
        return venue.type === VenueType.THEATER || venue.type === VenueType.CONCERT_HALL;
      default:
        return false;
    }
  }


  // Get faction modifiers for calculations
  getFactionModifiers(factionId: string): FactionModifiers {
    const faction = this.factions.get(factionId);
    return faction?.modifiers || {
      fanBonus: 1,
      reputationMultiplier: 1,
      moneyModifier: 0,
      capacityBonus: 0,
      dramaChance: 0
    };
  }

  // Calculate reputation change for faction actions
  calculateReputationChange(action: string, band: Band, _venue: Venue): Map<string, number> {
    const changes = new Map<string, number>();
    
    this.factions.forEach((faction, factionId) => {
      const alignment = this.calculateBandAlignment(band, factionId);
      let change = 0;
      
      switch (action) {
        case 'successful_show':
          change = alignment > 70 ? 3 : alignment < 30 ? -2 : 0;
          break;
        case 'failed_show':
          change = alignment > 70 ? -2 : alignment < 30 ? 1 : 0;
          break;
      }
      
      if (change !== 0) {
        changes.set(factionId, change);
      }
    });
    
    return changes;
  }

  // Apply reputation changes
  applyReputationChanges(changes: Map<string, number>) {
    changes.forEach((change, factionId) => {
      this.adjustStanding(factionId, change);
    });
  }

  // Assign bands to factions based on alignment
  assignBandToFaction(band: Band) {
    let bestFaction: string | null = null;
    let bestAlignment = 0;

    this.factions.forEach((faction, factionId) => {
      const alignment = this.calculateBandAlignment(band, factionId);
      if (alignment > bestAlignment && alignment > 60) {
        bestFaction = factionId;
        bestAlignment = alignment;
      }
    });

    if (bestFaction) {
      const faction = this.factions.get(bestFaction);
      if (faction && !faction.memberBands.includes(band.id)) {
        faction.memberBands.push(band.id);
      }
    }

    return bestFaction;
  }

  // Get faction info
  getFaction(factionId: string): Faction | undefined {
    return this.factions.get(factionId);
  }

  // Get player standing with faction
  getPlayerStanding(factionId: string): number {
    return this.playerStandings.get(factionId) || 0;
  }

  // Methods for save/load functionality
  getPlayerStandings(): Map<string, number> {
    return new Map(this.playerStandings);
  }


  restoreEvents(events: FactionEvent[]): void {
    this.factionEvents = [...events];
  }
}

export const factionSystem = new FactionSystem();
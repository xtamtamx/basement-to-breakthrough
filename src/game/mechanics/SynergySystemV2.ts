import { Band, Venue, Genre, VenueType, TraitType } from '@game/types';

export interface Synergy {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'common' | 'rare' | 'legendary' | 'mythic';
  multiplier: number; // Base multiplier for score/revenue
  conditions: SynergyCondition[];
  discovered: boolean;
  timesTriggered: number;
  effects: SynergyEffect[];
}

export interface SynergyCondition {
  type: 'band_genre' | 'venue_type' | 'band_trait' | 'band_count' | 'venue_modifier' | 'district' | 'time' | 'weather';
  value: any;
  operator: 'equals' | 'includes' | 'greater_than' | 'less_than';
}

export interface SynergyEffect {
  type: 'multiply_revenue' | 'multiply_fans' | 'multiply_authenticity' | 'unlock_content' | 'chain_trigger';
  value: number | string;
  description: string;
}

export interface BandUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements: UpgradeRequirement[];
  effects: UpgradeEffect[];
  icon: string;
}

export interface VenueUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number; // Turns to complete
  requirements: UpgradeRequirement[];
  effects: UpgradeEffect[];
  icon: string;
}

export interface UpgradeRequirement {
  type: 'reputation' | 'fans' | 'money' | 'synergy_discovered' | 'shows_played';
  value: number | string;
}

export interface UpgradeEffect {
  type: 'stat_boost' | 'new_trait' | 'synergy_unlock' | 'capacity_increase' | 'new_modifier';
  target: string; // Which stat or property to affect
  value: number | string;
}

class SynergySystemV2 {
  private synergies: Map<string, Synergy> = new Map();
  private bandUpgrades: Map<string, BandUpgrade[]> = new Map();
  private venueUpgrades: Map<string, VenueUpgrade[]> = new Map();
  
  constructor() {
    this.initializeSynergies();
    this.initializeUpgrades();
  }
  
  private initializeSynergies() {
    // Common Synergies
    this.addSynergy({
      id: 'punk_basement',
      name: 'DIY or Die',
      description: 'Punk bands in basement venues embody true DIY spirit',
      icon: '🏚️',
      tier: 'common',
      multiplier: 1.5,
      conditions: [
        { type: 'band_genre', value: Genre.PUNK, operator: 'equals' },
        { type: 'venue_type', value: VenueType.BASEMENT, operator: 'equals' }
      ],
      discovered: false,
      timesTriggered: 0,
      effects: [
        { type: 'multiply_authenticity', value: 2, description: 'Double authenticity gains' },
        { type: 'multiply_fans', value: 1.2, description: '20% more fans' }
      ]
    });
    
    this.addSynergy({
      id: 'metal_warehouse',
      name: 'Industrial Mayhem',
      description: 'Metal shows in warehouses create legendary chaos',
      icon: '🏭',
      tier: 'common',
      multiplier: 1.8,
      conditions: [
        { type: 'band_genre', value: Genre.METAL, operator: 'equals' },
        { type: 'venue_type', value: VenueType.WAREHOUSE, operator: 'equals' }
      ],
      discovered: false,
      timesTriggered: 0,
      effects: [
        { type: 'multiply_revenue', value: 1.5, description: '50% more revenue' },
        { type: 'multiply_fans', value: 1.5, description: '50% more fans' }
      ]
    });
    
    // Rare Synergies
    this.addSynergy({
      id: 'triple_punk_chaos',
      name: 'Punk Rock Riot',
      description: 'Three punk bands create unstoppable energy',
      icon: '🔥',
      tier: 'rare',
      multiplier: 3,
      conditions: [
        { type: 'band_genre', value: Genre.PUNK, operator: 'equals' },
        { type: 'band_count', value: 3, operator: 'equals' }
      ],
      discovered: false,
      timesTriggered: 0,
      effects: [
        { type: 'multiply_revenue', value: 2, description: 'Double revenue' },
        { type: 'multiply_fans', value: 3, description: 'Triple fan gain' },
        { type: 'chain_trigger', value: 'circle_pit_madness', description: 'May trigger Circle Pit Madness' }
      ]
    });
    
    this.addSynergy({
      id: 'doom_dive_depression',
      name: 'Existential Dread Hour',
      description: 'Doom metal in a dive bar creates beautiful misery',
      icon: '💀',
      tier: 'rare',
      multiplier: 2.5,
      conditions: [
        { type: 'band_genre', value: Genre.DOOM, operator: 'equals' },
        { type: 'venue_type', value: VenueType.DIVE_BAR, operator: 'equals' }
      ],
      discovered: false,
      timesTriggered: 0,
      effects: [
        { type: 'multiply_revenue', value: 2.5, description: 'Bar sales skyrocket' },
        { type: 'multiply_authenticity', value: 3, description: 'Triple authenticity' }
      ]
    });
    
    // Legendary Synergies
    this.addSynergy({
      id: 'genre_collision',
      name: 'Genre Annihilation',
      description: 'Mixing opposing genres creates new movements',
      icon: '💥',
      tier: 'legendary',
      multiplier: 5,
      conditions: [
        { type: 'band_genre', value: [Genre.METAL, Genre.EXPERIMENTAL], operator: 'includes' },
        { type: 'band_count', value: 2, operator: 'greater_than' }
      ],
      discovered: false,
      timesTriggered: 0,
      effects: [
        { type: 'multiply_revenue', value: 3, description: 'Triple revenue' },
        { type: 'multiply_fans', value: 5, description: '5x fan gain' },
        { type: 'unlock_content', value: 'new_genre_fusion', description: 'Unlocks fusion genre' }
      ]
    });
    
    // Mythic Synergies
    this.addSynergy({
      id: 'perfect_storm',
      name: 'The Perfect Storm',
      description: 'All elements align for a legendary show',
      icon: '⚡',
      tier: 'mythic',
      multiplier: 10,
      conditions: [
        { type: 'venue_type', value: VenueType.WAREHOUSE, operator: 'equals' },
        { type: 'band_count', value: 3, operator: 'equals' },
        { type: 'district', value: 'industrial', operator: 'equals' }
      ],
      discovered: false,
      timesTriggered: 0,
      effects: [
        { type: 'multiply_revenue', value: 5, description: '5x revenue' },
        { type: 'multiply_fans', value: 10, description: '10x fan gain' },
        { type: 'unlock_content', value: 'legendary_venue', description: 'Unlocks legendary venue' },
        { type: 'chain_trigger', value: 'scene_explosion', description: 'Triggers Scene Explosion' }
      ]
    });
  }
  
  private initializeUpgrades() {
    // Band Upgrades
    this.addBandUpgrade('b1', {
      id: 'stage_presence',
      name: 'Stage Presence',
      description: 'Improve live performance energy',
      cost: 100,
      requirements: [
        { type: 'shows_played', value: 3 }
      ],
      effects: [
        { type: 'stat_boost', target: 'energy', value: 15 }
      ],
      icon: '🎤'
    });
    
    this.addBandUpgrade('b1', {
      id: 'underground_cred',
      name: 'Underground Credibility',
      description: 'Gain respect in the scene',
      cost: 200,
      requirements: [
        { type: 'reputation', value: 50 }
      ],
      effects: [
        { type: 'stat_boost', target: 'authenticity', value: 20 },
        { type: 'new_trait', target: 'traits', value: 'scene_veteran' }
      ],
      icon: '🏴'
    });
    
    // Venue Upgrades
    this.addVenueUpgrade('v1', {
      id: 'soundproofing',
      name: 'Soundproofing',
      description: 'Reduce noise complaints',
      cost: 300,
      duration: 2,
      requirements: [
        { type: 'money', value: 300 }
      ],
      effects: [
        { type: 'stat_boost', target: 'acoustics', value: 20 },
        { type: 'new_modifier', target: 'modifiers', value: 'noise_resistant' }
      ],
      icon: '🔇'
    });
    
    this.addVenueUpgrade('v2', {
      id: 'vip_section',
      name: 'VIP Section',
      description: 'Add exclusive area for big spenders',
      cost: 500,
      duration: 3,
      requirements: [
        { type: 'reputation', value: 100 }
      ],
      effects: [
        { type: 'capacity_increase', target: 'capacity', value: 20 },
        { type: 'stat_boost', target: 'revenue_multiplier', value: 1.5 }
      ],
      icon: '👑'
    });
  }
  
  private addSynergy(synergy: Synergy) {
    this.synergies.set(synergy.id, synergy);
  }
  
  private addBandUpgrade(bandId: string, upgrade: BandUpgrade) {
    if (!this.bandUpgrades.has(bandId)) {
      this.bandUpgrades.set(bandId, []);
    }
    this.bandUpgrades.get(bandId)!.push(upgrade);
  }
  
  private addVenueUpgrade(venueId: string, upgrade: VenueUpgrade) {
    if (!this.venueUpgrades.has(venueId)) {
      this.venueUpgrades.set(venueId, []);
    }
    this.venueUpgrades.get(venueId)!.push(upgrade);
  }
  
  checkSynergies(bands: Band[], venue: Venue, context: any = {}): Synergy[] {
    const triggeredSynergies: Synergy[] = [];
    
    for (const synergy of this.synergies.values()) {
      if (this.checkConditions(synergy.conditions, bands, venue, context)) {
        triggeredSynergies.push(synergy);
        synergy.timesTriggered++;
        if (!synergy.discovered) {
          synergy.discovered = true;
          // Trigger discovery animation/notification
        }
      }
    }
    
    // Sort by tier importance
    return triggeredSynergies.sort((a, b) => {
      const tierOrder = { common: 0, rare: 1, legendary: 2, mythic: 3 };
      return tierOrder[b.tier] - tierOrder[a.tier];
    });
  }
  
  private checkConditions(conditions: SynergyCondition[], bands: Band[], venue: Venue, context: any): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, bands, venue, context)) {
        return false;
      }
    }
    return true;
  }
  
  private evaluateCondition(condition: SynergyCondition, bands: Band[], venue: Venue, context: any): boolean {
    switch (condition.type) {
      case 'band_genre':
        if (condition.operator === 'equals') {
          return bands.some(b => b.genre === condition.value);
        } else if (condition.operator === 'includes' && Array.isArray(condition.value)) {
          return condition.value.every(genre => bands.some(b => b.genre === genre));
        }
        break;
        
      case 'venue_type':
        return venue.type === condition.value;
        
      case 'band_count':
        if (condition.operator === 'equals') {
          return bands.length === condition.value;
        } else if (condition.operator === 'greater_than') {
          return bands.length > condition.value;
        }
        break;
        
      case 'district':
        return venue.location.id === condition.value;
    }
    
    return false;
  }
  
  calculateTotalMultiplier(synergies: Synergy[]): number {
    // Multiplicative stacking for insane combos
    return synergies.reduce((total, synergy) => total * synergy.multiplier, 1);
  }
  
  getBandUpgrades(bandId: string): BandUpgrade[] {
    return this.bandUpgrades.get(bandId) || [];
  }
  
  getVenueUpgrades(venueId: string): VenueUpgrade[] {
    return this.venueUpgrades.get(venueId) || [];
  }
  
  getDiscoveredSynergies(): Synergy[] {
    return Array.from(this.synergies.values()).filter(s => s.discovered);
  }
  
  getUndiscoveredSynergiesCount(): number {
    return Array.from(this.synergies.values()).filter(s => !s.discovered).length;
  }
}

export const synergySystemV2 = new SynergySystemV2();
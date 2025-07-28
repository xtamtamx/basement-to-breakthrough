import { Band, Venue, Genre, VenueType, TraitType } from '@game/types';
import { SATIRICAL_SYNERGY_DATA } from '@game/data/satiricalText';

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
      name: SATIRICAL_SYNERGY_DATA.punk_basement.name,
      description: SATIRICAL_SYNERGY_DATA.punk_basement.description,
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
        { type: 'multiply_authenticity', value: 2, description: 'Street cred through the roof (basement ceiling)' },
        { type: 'multiply_fans', value: 1.2, description: '20% more people pretending they were there' }
      ]
    });
    
    this.addSynergy({
      id: 'metal_warehouse',
      name: SATIRICAL_SYNERGY_DATA.metal_warehouse.name,
      description: SATIRICAL_SYNERGY_DATA.metal_warehouse.description,
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
        { type: 'multiply_revenue', value: 1.5, description: 'Insurance premiums also multiplied' },
        { type: 'multiply_fans', value: 1.5, description: 'Emergency room visits up 150%' }
      ]
    });
    
    // Rare Synergies
    this.addSynergy({
      id: 'triple_punk_chaos',
      name: SATIRICAL_SYNERGY_DATA.triple_punk_chaos.name,
      description: SATIRICAL_SYNERGY_DATA.triple_punk_chaos.description,
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
        { type: 'multiply_revenue', value: 2, description: 'Money printer go brrr (until cops arrive)' },
        { type: 'multiply_fans', value: 3, description: 'Instagram stories through the roof' },
        { type: 'chain_trigger', value: 'circle_pit_madness', description: 'Physics laws temporarily suspended' }
      ]
    });
    
    this.addSynergy({
      id: 'doom_dive_depression',
      name: SATIRICAL_SYNERGY_DATA.doom_dive_depression?.name || 'Existential Dread Hour',
      description: SATIRICAL_SYNERGY_DATA.doom_dive_depression?.description || 'Doom metal in a dive bar creates beautiful misery',
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
        { type: 'multiply_revenue', value: 2.5, description: 'Alcohol sales match collective despair levels' },
        { type: 'multiply_authenticity', value: 3, description: 'Misery loves company (and pays cover)' }
      ]
    });
    
    // Legendary Synergies
    this.addSynergy({
      id: 'genre_collision',
      name: SATIRICAL_SYNERGY_DATA.genre_collision?.name || 'Genre Annihilation',
      description: SATIRICAL_SYNERGY_DATA.genre_collision?.description || 'Mixing opposing genres creates new movements',
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
        { type: 'multiply_revenue', value: 3, description: 'Confused fans buy everything to fit in' },
        { type: 'multiply_fans', value: 5, description: 'Music blogs lose their minds trying to categorize this' },
        { type: 'unlock_content', value: 'new_genre_fusion', description: 'Creates genre that Spotify can\'t classify' }
      ]
    });
    
    // Mythic Synergies
    this.addSynergy({
      id: 'perfect_storm',
      name: SATIRICAL_SYNERGY_DATA.perfect_storm.name,
      description: SATIRICAL_SYNERGY_DATA.perfect_storm.description,
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
        { type: 'multiply_revenue', value: 5, description: 'Money appears from parallel dimensions' },
        { type: 'multiply_fans', value: 10, description: 'Everyone claims they were there (only 200 actually were)' },
        { type: 'unlock_content', value: 'legendary_venue', description: 'Venue achieves historical landmark status' },
        { type: 'chain_trigger', value: 'scene_explosion', description: 'Documentary crews materialize from thin air' }
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
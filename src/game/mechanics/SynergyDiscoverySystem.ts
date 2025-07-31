import { Band, Venue, Equipment, Show, Genre, VenueType } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';
import { safeStorage } from '@utils/safeStorage';
import { achievementSynergySystem } from './AchievementSynergySystem';
import { synergyChainSystem, ChainReaction } from './SynergyChainSystem';
import { synergyMasterySystem } from './SynergyMasterySystem';

// Types for the discovery system
export interface SynergyCombo {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  requirements: SynergyRequirement[];
  effects: SynergyEffect[];
  discovered: boolean;
  timesTriggered: number;
  flavorText?: string;
}

export interface SynergyRequirement {
  type: 'band_genre' | 'venue_type' | 'band_trait' | 'equipment' | 'bill_size' | 'time_of_day' | 'faction' | 'authenticity' | 'energy';
  value: string | number | string[];
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface SynergyEffect {
  type: 'multiply_attendance' | 'multiply_revenue' | 'bonus_reputation' | 'reduce_stress' | 'unlock_content' | 'transform_card' | 'spawn_event';
  value: number | string;
  description: string;
}

export interface DiscoveryNotification {
  combo: SynergyCombo;
  firstTime: boolean;
  bonusReward?: {
    type: 'fame' | 'legacy' | 'unlock';
    value: number | string;
  };
}

interface SynergyContext {
  genres: string[];
  venue: Venue;
  traits: string[];
  equipmentTypes: string[];
  billSize: number;
  avgAuthenticity: number;
  avgEnergy: number;
  timeOfDay: string;
}

interface ShowResultData {
  attendance: number;
  revenue: number;
  reputationChange: number;
  stressIncrease: number;
  fanGain: number;
  incidentOccurred: boolean;
  [key: string]: number | boolean | string;
}

class SynergyDiscoverySystem {
  private combos: Map<string, SynergyCombo> = new Map();
  private discoveredCombos: Set<string> = new Set();
  private comboHistory: { comboId: string; timestamp: number; context: SynergyContext }[] = [];
  
  constructor() {
    this.initializeCombos();
    this.loadDiscoveredCombos();
  }
  
  private initializeCombos() {
    // Basic genre synergies
    this.addCombo({
      id: 'punk_in_basement',
      name: 'DIY Spirit',
      description: 'Punk bands thrive in basement venues',
      icon: '🏚️',
      rarity: 'common',
      requirements: [
        { type: 'band_genre', value: Genre.PUNK },
        { type: 'venue_type', value: VenueType.BASEMENT }
      ],
      effects: [
        { type: 'multiply_attendance', value: 1.5, description: '+50% attendance' },
        { type: 'bonus_reputation', value: 10, description: '+10 scene cred' }
      ],
      flavorText: "Where it all began..."
    });
    
    this.addCombo({
      id: 'metal_warehouse',
      name: 'Industrial Strength',
      description: 'Metal bands + warehouse = maximum brutality',
      icon: '🏭',
      rarity: 'common',
      requirements: [
        { type: 'band_genre', value: Genre.METAL },
        { type: 'venue_type', value: VenueType.WAREHOUSE }
      ],
      effects: [
        { type: 'multiply_revenue', value: 1.3, description: '+30% revenue' },
        { type: 'bonus_reputation', value: 15, description: '+15 reputation' }
      ]
    });
    
    // Advanced trait combos
    this.addCombo({
      id: 'straight_edge_matinee',
      name: 'Positive Scene',
      description: 'Straight edge bands + all ages venue = community building',
      icon: '☀️',
      rarity: 'uncommon',
      requirements: [
        { type: 'band_trait', value: 'Straight Edge' },
        { type: 'venue_type', value: VenueType.BASEMENT },
        { type: 'time_of_day', value: 'afternoon' }
      ],
      effects: [
        { type: 'reduce_stress', value: -20, description: '-20 stress' },
        { type: 'bonus_reputation', value: 25, description: '+25 positive scene rep' }
      ],
      flavorText: "Building a better tomorrow"
    });
    
    // Bill synergies
    this.addCombo({
      id: 'genre_clash',
      name: 'Crossover Appeal',
      description: 'Mixed genre bill attracts diverse crowd',
      icon: '🎭',
      rarity: 'uncommon',
      requirements: [
        { type: 'bill_size', value: 3, operator: 'greater_than' },
        { type: 'band_genre', value: 'mixed' } // Special check for multiple genres
      ],
      effects: [
        { type: 'multiply_attendance', value: 1.4, description: '+40% attendance' },
        { type: 'spawn_event', value: 'genre_fusion', description: 'May create genre fusion' }
      ]
    });
    
    // Equipment combos
    this.addCombo({
      id: 'pro_sound_metal',
      name: 'Wall of Sound',
      description: 'Professional PA + Metal band = sonic devastation',
      icon: '🔊',
      rarity: 'rare',
      requirements: [
        { type: 'band_genre', value: Genre.METAL },
        { type: 'equipment', value: 'professional_pa' },
        { type: 'energy', value: 80, operator: 'greater_than' }
      ],
      effects: [
        { type: 'multiply_revenue', value: 1.5, description: '+50% revenue' },
        { type: 'bonus_reputation', value: 30, description: '+30 reputation' },
        { type: 'spawn_event', value: 'noise_complaint', description: 'May trigger noise complaints' }
      ]
    });
    
    // Legendary combos
    this.addCombo({
      id: 'perfect_storm',
      name: 'The Perfect Storm',
      description: 'All elements align for a legendary show',
      icon: '⚡',
      rarity: 'legendary',
      requirements: [
        { type: 'authenticity', value: 90, operator: 'greater_than' },
        { type: 'energy', value: 90, operator: 'greater_than' },
        { type: 'venue_type', value: VenueType.WAREHOUSE },
        { type: 'bill_size', value: 4, operator: 'equals' },
        { type: 'equipment', value: 'professional_pa' }
      ],
      effects: [
        { type: 'multiply_attendance', value: 2.0, description: 'Double attendance' },
        { type: 'multiply_revenue', value: 2.0, description: 'Double revenue' },
        { type: 'bonus_reputation', value: 50, description: '+50 reputation' },
        { type: 'unlock_content', value: 'legendary_venue', description: 'Unlocks legendary venue' }
      ],
      flavorText: "The stuff of scene legends..."
    });
    
    // Hidden/Easter egg combos
    this.addCombo({
      id: 'basement_to_breakthrough',
      name: 'From Basement to Breakthrough',
      description: 'A band\'s journey from humble beginnings',
      icon: '🌟',
      rarity: 'legendary',
      requirements: [
        { type: 'band_trait', value: 'Scene Veterans' },
        { type: 'venue_type', value: VenueType.FESTIVAL },
        { type: 'authenticity', value: 100, operator: 'equals' }
      ],
      effects: [
        { type: 'transform_card', value: 'legendary_band', description: 'Band becomes legendary' },
        { type: 'bonus_reputation', value: 100, description: '+100 reputation' },
        { type: 'unlock_content', value: 'hall_of_fame', description: 'Unlocks Hall of Fame' }
      ],
      flavorText: "They never forgot where they came from"
    });
  }
  
  private addCombo(combo: SynergyCombo) {
    combo.discovered = false;
    combo.timesTriggered = 0;
    this.combos.set(combo.id, combo);
  }
  
  // Check potential synergies without triggering them (for preview)
  checkPotentialSynergies(show: Show, bands: Band[], venue: Venue, equipment: Equipment[]): SynergyCombo[] {
    const context = this.buildContext(show, bands, venue, equipment);
    const potential: SynergyCombo[] = [];
    
    for (const [, combo] of this.combos) {
      if (this.meetsRequirements(combo, context)) {
        potential.push(combo);
      }
    }
    
    return potential;
  }
  
  // Check band-only synergies (for bill preview)
  checkBandSynergies(bands: Band[]): SynergyCombo[] {
    const mockContext = {
      bands,
      genres: [...new Set(bands.map(b => b.genre))],
      traits: bands.flatMap(b => b.traits.map(t => t.name)),
      avgAuthenticity: bands.reduce((sum, b) => sum + b.authenticity, 0) / bands.length,
      avgEnergy: bands.reduce((sum, b) => sum + b.energy, 0) / bands.length,
      billSize: bands.length,
      timeOfDay: this.getTimeOfDay(),
      equipmentTypes: []
    };
    
    const potential: SynergyCombo[] = [];
    
    for (const [, combo] of this.combos) {
      // Only check band-related requirements
      const bandOnlyReqs = combo.requirements.filter(r => 
        ['band_genre', 'band_trait', 'bill_size', 'authenticity', 'energy'].includes(r.type)
      );
      
      if (bandOnlyReqs.length > 0 && bandOnlyReqs.length === combo.requirements.filter(r => 
        !['venue_type', 'equipment', 'time_of_day', 'faction'].includes(r.type)
      ).length) {
        if (bandOnlyReqs.every(req => this.meetsRequirements({ requirements: [req] } as SynergyCombo, mockContext))) {
          potential.push(combo);
        }
      }
    }
    
    return potential;
  }
  
  // Check for synergies when a show is booked
  checkForSynergies(show: Show, bands: Band[], venue: Venue, equipment: Equipment[]): DiscoveryNotification[] {
    const notifications: DiscoveryNotification[] = [];
    const context = this.buildContext(show, bands, venue, equipment);
    
    for (const [, combo] of this.combos) {
      if (this.meetsRequirements(combo, context)) {
        const firstTime = !this.discoveredCombos.has(id);
        
        if (firstTime) {
          this.discoveredCombos.add(id);
          combo.discovered = true;
          this.saveDiscoveredCombos();
          
          // First discovery bonus
          notifications.push({
            combo,
            firstTime: true,
            bonusReward: this.getDiscoveryBonus(combo)
          });
          
          // Special effects
          haptics.success();
          audio.play('discovery');
        } else {
          notifications.push({
            combo,
            firstTime: false
          });
        }
        
        combo.timesTriggered++;
        this.comboHistory.push({ comboId: id, timestamp: Date.now(), context });
      }
    }
    
    // Check achievement synergies
    const achievementSynergies = achievementSynergySystem.checkAchievementSynergies(bands, venue);
    achievementSynergies.forEach(combo => {
      notifications.push({
        combo,
        firstTime: false, // Achievement synergies are pre-unlocked
        bonusReward: undefined
      });
    });
    
    // Apply mastery enhancements to discovered synergies
    const enhancedNotifications = notifications.map(notification => {
      const masteredVersion = synergyMasterySystem.getMasteredSynergy(notification.combo);
      if (masteredVersion) {
        return {
          ...notification,
          combo: masteredVersion
        };
      }
      return notification;
    });
    
    return enhancedNotifications;
  }
  
  private buildContext(show: Show, bands: Band[], venue: Venue, equipment: Equipment[]) {
    const genres = [...new Set(bands.map(b => b.genre))];
    const traits = bands.flatMap(b => b.traits.map(t => t.name));
    const avgAuthenticity = bands.reduce((sum, b) => sum + b.authenticity, 0) / bands.length;
    const avgEnergy = bands.reduce((sum, b) => sum + b.energy, 0) / bands.length;
    
    return {
      show,
      bands,
      venue,
      equipment,
      genres,
      traits,
      avgAuthenticity,
      avgEnergy,
      billSize: bands.length,
      timeOfDay: this.getTimeOfDay(),
      equipmentTypes: equipment.map(e => e.type)
    };
  }
  
  private meetsRequirements(combo: SynergyCombo, context: SynergyContext): boolean {
    return combo.requirements.every(req => {
      switch (req.type) {
        case 'band_genre':
          if (req.value === 'mixed') {
            return context.genres.length > 1;
          }
          return context.genres.includes(req.value);
          
        case 'venue_type':
          return context.venue.type === req.value;
          
        case 'band_trait':
          return context.traits.includes(req.value);
          
        case 'equipment':
          return context.equipmentTypes.includes(req.value);
          
        case 'bill_size':
          return this.compareValue(context.billSize, req.value, req.operator);
          
        case 'authenticity':
          return this.compareValue(context.avgAuthenticity, req.value, req.operator);
          
        case 'energy':
          return this.compareValue(context.avgEnergy, req.value, req.operator);
          
        case 'time_of_day':
          return context.timeOfDay === req.value;
          
        default:
          return false;
      }
    });
  }
  
  private compareValue(actual: number, expected: number, operator?: string): boolean {
    switch (operator) {
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'equals':
      default:
        return actual === expected;
    }
  }
  
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }
  
  private getDiscoveryBonus(combo: SynergyCombo): { type: 'fame' | 'legacy' | 'unlock'; value: number | string } | undefined {
    switch (combo.rarity) {
      case 'common':
        return { type: 'fame', value: 10 };
      case 'uncommon':
        return { type: 'fame', value: 25 };
      case 'rare':
        return { type: 'fame', value: 50 };
      case 'legendary':
        return { type: 'legacy', value: 1 };
      default:
        return undefined;
    }
  }
  
  // Apply synergy effects to show results
  applySynergyEffects(baseResults: ShowResultData, synergies: SynergyCombo[], bands?: Band[], venue?: Venue, equipment?: Equipment[]): ShowResultData {
    const modifiedResults = { ...baseResults };
    
    // Build current effects map for chain checking
    const currentEffects = new Map<string, number>();
    for (const synergy of synergies) {
      for (const effect of synergy.effects) {
        const current = currentEffects.get(effect.type) || 0;
        currentEffects.set(effect.type, current + effect.value);
      }
    }
    
    // Check for chain reactions
    let chains: ChainReaction[] = [];
    if (bands && venue) {
      chains = synergyChainSystem.checkForChainReactions(
        synergies,
        { bands, venue, equipment: equipment || [], currentEffects }
      );
      
      // Store chains in results for visualization
      modifiedResults.chainReactions = chains;
    }
    
    // Apply base synergy effects
    for (const synergy of synergies) {
      for (const effect of synergy.effects) {
        switch (effect.type) {
          case 'multiply_attendance':
            modifiedResults.attendance = Math.floor(modifiedResults.attendance * (effect.value as number));
            break;
            
          case 'multiply_revenue':
            modifiedResults.revenue = Math.floor(modifiedResults.revenue * (effect.value as number));
            break;
            
          case 'bonus_reputation':
            modifiedResults.reputationChange += effect.value as number;
            break;
            
          case 'reduce_stress':
            modifiedResults.stressChange = (modifiedResults.stressChange || 0) + (effect.value as number);
            break;
            
          case 'spawn_event':
            modifiedResults.triggeredEvents = modifiedResults.triggeredEvents || [];
            modifiedResults.triggeredEvents.push(effect.value);
            break;
            
          case 'unlock_content':
            modifiedResults.unlocks = modifiedResults.unlocks || [];
            modifiedResults.unlocks.push(effect.value);
            break;
            
          case 'transform_card':
            modifiedResults.transformations = modifiedResults.transformations || [];
            modifiedResults.transformations.push({ type: effect.value });
            break;
        }
      }
    }
    
    // Apply chain multipliers if any chains were triggered
    if (chains.length > 0) {
      const chainMultipliedEffects = synergyChainSystem.applyChainMultipliers(currentEffects, chains);
      
      // Apply the multiplied effects to results
      for (const [effectType, value] of chainMultipliedEffects) {
        switch (effectType) {
          case 'attendance':
            modifiedResults.attendance = Math.floor(modifiedResults.attendance * (1 + value / 100));
            break;
          case 'reputation':
            modifiedResults.reputationChange = Math.floor(modifiedResults.reputationChange * (1 + value / 100));
            break;
          case 'money':
          case 'revenue':
            modifiedResults.revenue = Math.floor(modifiedResults.revenue * (1 + value / 100));
            break;
          case 'stress_reduction':
            modifiedResults.stressChange = (modifiedResults.stressChange || 0) - value;
            break;
        }
      }
      
      // Add chain bonus to score
      const maxChainMultiplier = Math.max(...chains.map(c => c.totalMultiplier));
      modifiedResults.chainBonus = Math.floor(1000 * (maxChainMultiplier - 1));
    }
    
    // Record synergy usage for mastery
    const scoreGenerated = modifiedResults.revenue + (modifiedResults.reputationChange * 10) + (modifiedResults.attendance * 5);
    for (const synergy of synergies) {
      synergyMasterySystem.recordSynergyUse(synergy.id, scoreGenerated);
    }
    
    return modifiedResults;
  }
  
  // Get discovered combos for UI
  getDiscoveredCombos(): SynergyCombo[] {
    return Array.from(this.combos.values()).filter(combo => combo.discovered);
  }
  
  // Get synergy by ID
  getSynergyById(id: string): SynergyCombo | null {
    return this.combos.get(id) || null;
  }
  
  // Get combo progress
  getComboProgress(): { discovered: number; total: number; byRarity: Record<string, { discovered: number; total: number }> } {
    const all = Array.from(this.combos.values());
    const discovered = all.filter(c => c.discovered);
    
    const byRarity: Record<string, { discovered: number; total: number }> = {};
    
    ['common', 'uncommon', 'rare', 'legendary'].forEach(rarity => {
      const rarityTotal = all.filter(c => c.rarity === rarity);
      const rarityDiscovered = discovered.filter(c => c.rarity === rarity);
      byRarity[rarity] = {
        discovered: rarityDiscovered.length,
        total: rarityTotal.length
      };
    });
    
    return {
      discovered: discovered.length,
      total: all.length,
      byRarity
    };
  }
  
  // Persistence
  private saveDiscoveredCombos() {
    safeStorage.setItem('discovered_synergies', JSON.stringify(Array.from(this.discoveredCombos)));
  }
  
  private loadDiscoveredCombos() {
    const saved = safeStorage.getItem('discovered_synergies');
    if (saved) {
      const discovered = JSON.parse(saved) as string[];
      discovered.forEach(id => {
        this.discoveredCombos.add(id);
        const combo = this.combos.get(id);
        if (combo) {
          combo.discovered = true;
        }
      });
    }
  }
  
  // Get hints for undiscovered combos
  getHints(): string[] {
    const undiscovered = Array.from(this.combos.values())
      .filter(c => !c.discovered)
      .sort((a, b) => {
        const rarityOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      });
    
    // Return hints for the next 3 easiest undiscovered combos
    return undiscovered.slice(0, 3).map(combo => {
      const reqDesc = combo.requirements[0];
      switch (reqDesc.type) {
        case 'band_genre':
          return `Try booking a ${reqDesc.value} band...`;
        case 'venue_type':
          return `Something special happens in ${reqDesc.value} venues...`;
        case 'band_trait':
          return `Bands with "${reqDesc.value}" have hidden potential...`;
        default:
          return 'Keep experimenting with different combinations!';
      }
    });
  }
}

export const synergyDiscoverySystem = new SynergyDiscoverySystem();
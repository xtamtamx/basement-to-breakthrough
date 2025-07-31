import { Band, Venue, TraitType, VenueType, Genre } from '@game/types';
import { bandGenerator } from './BandGenerator';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export interface TransformationRule {
  id: string;
  name: string;
  description: string;
  type: 'band' | 'venue';
  requirements: TransformationRequirement[];
  result: TransformationResult;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface TransformationRequirement {
  type: 'shows_played' | 'reputation_reached' | 'synergies_triggered' | 'perfect_shows' | 'venue_type' | 'band_genre' | 'has_trait' | 'equipment_count';
  value: string | number | string[] | Genre | VenueType | TraitType;
  operator?: 'equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface TransformationResult {
  type: 'evolve' | 'fuse' | 'corrupt' | 'ascend';
  modifications: {
    stats?: Partial<Band | Venue>;
    addTraits?: string[];
    removeTraits?: string[];
    changeGenre?: Genre;
    changeType?: VenueType;
    newName?: string;
    newDescription?: string;
    visualEffect?: 'glow' | 'pulse' | 'lightning' | 'fire';
  };
}

export interface TransformationEvent {
  cardId: string;
  transformation: TransformationRule;
  timestamp: number;
}

class CardTransformationSystem {
  private transformationRules: Map<string, TransformationRule> = new Map();
  private cardStats: Map<string, CardStats> = new Map();
  private transformationHistory: TransformationEvent[] = [];
  
  constructor() {
    this.initializeTransformationRules();
  }
  
  private initializeTransformationRules() {
    // Band transformations
    this.addRule({
      id: 'punk_to_hardcore',
      name: 'Hardcore Evolution',
      description: 'Punk band evolves into hardcore after intense shows',
      type: 'band',
      icon: '🔥',
      rarity: 'common',
      requirements: [
        { type: 'band_genre', value: Genre.PUNK },
        { type: 'shows_played', value: 5, operator: 'greater_than' },
        { type: 'reputation_reached', value: 50, operator: 'greater_than' }
      ],
      result: {
        type: 'evolve',
        modifications: {
          changeGenre: Genre.HARDCORE,
          stats: {
            energy: 15,
            technicalSkill: 10,
            popularity: -10
          },
          addTraits: ['Intense'],
          newDescription: 'Evolved from punk roots into a harder sound'
        }
      }
    });
    
    this.addRule({
      id: 'band_supergroup',
      name: 'Supergroup Formation',
      description: 'Multiple successful bands merge into a supergroup',
      type: 'band',
      icon: '⭐',
      rarity: 'rare',
      requirements: [
        { type: 'shows_played', value: 10, operator: 'greater_than' },
        { type: 'perfect_shows', value: 5, operator: 'greater_than' },
        { type: 'reputation_reached', value: 70, operator: 'greater_than' }
      ],
      result: {
        type: 'fuse',
        modifications: {
          stats: {
            popularity: 30,
            technicalSkill: 20,
            authenticity: -15
          },
          addTraits: ['Supergroup', 'Scene Veterans'],
          newName: 'Legendary Alliance',
          visualEffect: 'glow'
        }
      }
    });
    
    this.addRule({
      id: 'sellout_transformation',
      name: 'Corporate Sellout',
      description: 'Band loses authenticity but gains popularity',
      type: 'band',
      icon: '💰',
      rarity: 'uncommon',
      requirements: [
        { type: 'shows_played', value: 15, operator: 'greater_than' },
        { type: 'reputation_reached', value: 80, operator: 'greater_than' }
      ],
      result: {
        type: 'corrupt',
        modifications: {
          stats: {
            popularity: 40,
            authenticity: -50,
            energy: -20
          },
          addTraits: ['Commercial', 'Radio Friendly'],
          removeTraits: ['DIY', 'Underground'],
          visualEffect: 'pulse'
        }
      }
    });
    
    this.addRule({
      id: 'legendary_ascension',
      name: 'Scene Legend',
      description: 'Band achieves legendary status in the scene',
      type: 'band',
      icon: '👑',
      rarity: 'legendary',
      requirements: [
        { type: 'shows_played', value: 20, operator: 'greater_than' },
        { type: 'perfect_shows', value: 10, operator: 'greater_than' },
        { type: 'synergies_triggered', value: 15, operator: 'greater_than' },
        { type: 'has_trait', value: 'Scene Veterans' }
      ],
      result: {
        type: 'ascend',
        modifications: {
          stats: {
            popularity: 50,
            authenticity: 100,
            energy: 100,
            technicalSkill: 30
          },
          addTraits: ['Legendary', 'Influential', 'Timeless'],
          newDescription: 'A band that defined a generation',
          visualEffect: 'lightning'
        }
      }
    });
    
    // Venue transformations
    this.addRule({
      id: 'basement_to_club',
      name: 'Venue Expansion',
      description: 'Basement venue grows into a proper club',
      type: 'venue',
      icon: '🏢',
      rarity: 'common',
      requirements: [
        { type: 'venue_type', value: VenueType.BASEMENT },
        { type: 'shows_played', value: 10, operator: 'greater_than' },
        { type: 'equipment_count', value: 3, operator: 'greater_than' }
      ],
      result: {
        type: 'evolve',
        modifications: {
          changeType: VenueType.SMALL_CLUB,
          stats: {
            capacity: 50,
            acoustics: 20,
            atmosphere: 10
          },
          newName: 'The Underground Club'
        }
      }
    });
    
    this.addRule({
      id: 'venue_legendary',
      name: 'Legendary Venue',
      description: 'Venue becomes a scene landmark',
      type: 'venue',
      icon: '🏛️',
      rarity: 'legendary',
      requirements: [
        { type: 'shows_played', value: 50, operator: 'greater_than' },
        { type: 'perfect_shows', value: 20, operator: 'greater_than' },
        { type: 'synergies_triggered', value: 30, operator: 'greater_than' }
      ],
      result: {
        type: 'ascend',
        modifications: {
          stats: {
            capacity: 100,
            acoustics: 50,
            atmosphere: 50,
            authenticity: 100
          },
          newDescription: 'A venue that launched a thousand bands',
          visualEffect: 'fire'
        }
      }
    });
  }
  
  private addRule(rule: TransformationRule) {
    this.transformationRules.set(rule.id, rule);
  }
  
  // Track card statistics
  updateCardStats(cardId: string, event: CardStatEvent) {
    if (!this.cardStats.has(cardId)) {
      this.cardStats.set(cardId, {
        showsPlayed: 0,
        perfectShows: 0,
        synergiesTriggered: 0,
        totalRevenue: 0,
        totalAttendance: 0,
        equipmentCount: 0
      });
    }
    
    const stats = this.cardStats.get(cardId)!;
    
    switch (event.type) {
      case 'show_played':
        stats.showsPlayed++;
        if (event.data.isPerfect) stats.perfectShows++;
        stats.totalRevenue += event.data.revenue || 0;
        stats.totalAttendance += event.data.attendance || 0;
        break;
      case 'synergy_triggered':
        stats.synergiesTriggered++;
        break;
      case 'equipment_added':
        stats.equipmentCount++;
        break;
    }
  }
  
  // Check if a card can transform
  checkTransformations(card: Band | Venue, cardType: 'band' | 'venue'): TransformationRule[] {
    const availableTransformations: TransformationRule[] = [];
    const stats = this.cardStats.get(card.id) || {
      showsPlayed: 0,
      perfectShows: 0,
      synergiesTriggered: 0,
      totalRevenue: 0,
      totalAttendance: 0,
      equipmentCount: 0
    };
    
    for (const [id, rule] of this.transformationRules) {
      if (rule.type !== cardType) continue;
      
      // Check if already transformed (prevent multiple transformations)
      if (this.transformationHistory.some(t => t.cardId === card.id && t.transformation.id === id)) {
        continue;
      }
      
      const meetsRequirements = rule.requirements.every(req => {
        switch (req.type) {
          case 'shows_played':
            return this.compareValue(stats.showsPlayed, req.value, req.operator);
          case 'perfect_shows':
            return this.compareValue(stats.perfectShows, req.value, req.operator);
          case 'synergies_triggered':
            return this.compareValue(stats.synergiesTriggered, req.value, req.operator);
          case 'reputation_reached':
            // This would need to be passed in from game state
            return true; // Placeholder
          case 'band_genre':
            return cardType === 'band' && (card as Band).genre === req.value;
          case 'venue_type':
            return cardType === 'venue' && (card as Venue).type === req.value;
          case 'has_trait':
            return cardType === 'band' && (card as Band).traits.some(t => t.name === req.value);
          case 'equipment_count':
            return this.compareValue(stats.equipmentCount, req.value, req.operator);
          default:
            return false;
        }
      });
      
      if (meetsRequirements) {
        availableTransformations.push(rule);
      }
    }
    
    return availableTransformations;
  }
  
  // Apply transformation to a card
  applyTransformation(card: Band | Venue, transformation: TransformationRule): Band | Venue {
    const transformed = { ...card };
    const mods = transformation.result.modifications;
    
    // Apply stat changes
    if (mods.stats) {
      Object.entries(mods.stats).forEach(([key, value]) => {
        if (key in transformed) {
          (transformed as any)[key] = Math.max(0, Math.min(100, (transformed as any)[key] + value));
        }
      });
    }
    
    // Apply trait changes for bands
    if (card.id.startsWith('band-') && mods.addTraits) {
      const band = transformed as Band;
      mods.addTraits.forEach(traitName => {
        if (!band.traits.some(t => t.name === traitName)) {
          band.traits.push({
            id: `trait-${Date.now()}-${Math.random()}`,
            name: traitName,
            type: TraitType.PERFORMANCE,
            description: `Gained through ${transformation.name}`,
            effects: {}
          });
        }
      });
    }
    
    if (card.id.startsWith('band-') && mods.removeTraits) {
      const band = transformed as Band;
      band.traits = band.traits.filter(t => !mods.removeTraits!.includes(t.name));
    }
    
    // Apply genre change
    if (mods.changeGenre && card.id.startsWith('band-')) {
      (transformed as Band).genre = mods.changeGenre;
    }
    
    // Apply venue type change
    if (mods.changeType && card.id.startsWith('venue-')) {
      (transformed as Venue).type = mods.changeType;
    }
    
    // Apply name change
    if (mods.newName) {
      transformed.name = mods.newName;
    }
    
    // Apply description change
    if (mods.newDescription) {
      (transformed as any).description = mods.newDescription;
    }
    
    // Record transformation
    this.transformationHistory.push({
      cardId: card.id,
      transformation,
      timestamp: Date.now()
    });
    
    // Play effects
    haptics.heavy();
    audio.play('achievement');
    
    return transformed;
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
  
  // Get transformation history
  getTransformationHistory(cardId?: string): TransformationEvent[] {
    if (cardId) {
      return this.transformationHistory.filter(t => t.cardId === cardId);
    }
    return this.transformationHistory;
  }
  
  // Get card statistics
  getCardStats(cardId: string): CardStats | undefined {
    return this.cardStats.get(cardId);
  }
}

interface CardStats {
  showsPlayed: number;
  perfectShows: number;
  synergiesTriggered: number;
  totalRevenue: number;
  totalAttendance: number;
  equipmentCount: number;
}

interface CardStatEvent {
  type: 'show_played' | 'synergy_triggered' | 'equipment_added';
  data: Record<string, unknown>;
}

export const cardTransformationSystem = new CardTransformationSystem();
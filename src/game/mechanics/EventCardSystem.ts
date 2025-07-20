import { Band, Venue, Equipment } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export interface EventCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'opportunity' | 'crisis' | 'wildcard' | 'legendary';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  duration: 'instant' | 'turn' | 'persistent';
  effects: EventEffect[];
  requirements?: EventRequirement[];
  choices?: EventChoice[];
  flavorText?: string;
  artStyle?: 'concert_poster' | 'backstage_pass' | 'tour_flyer' | 'press_release';
}

export interface EventEffect {
  type: 'modify_stat' | 'spawn_card' | 'transform_card' | 'trigger_synergy' | 'scene_change' | 'resource_change';
  target: 'all_bands' | 'all_venues' | 'random_band' | 'random_venue' | 'player' | 'specific';
  value: any;
  duration?: number; // turns
  description: string;
}

export interface EventRequirement {
  type: 'turn_number' | 'reputation' | 'scene_state' | 'active_synergies' | 'card_count';
  value: any;
  operator: 'greater_than' | 'less_than' | 'equals';
}

export interface EventChoice {
  id: string;
  text: string;
  effects: EventEffect[];
  cost?: { type: 'money' | 'reputation' | 'stress'; amount: number };
}

export interface ActiveEvent {
  card: EventCard;
  turnsRemaining: number;
  appliedEffects: EventEffect[];
}

class EventCardSystem {
  private eventCards: Map<string, EventCard> = new Map();
  private activeEvents: ActiveEvent[] = [];
  private eventHistory: { cardId: string; turn: number; choice?: string }[] = [];
  
  constructor() {
    this.initializeEventCards();
  }
  
  private initializeEventCards() {
    // Opportunity Events
    this.addEventCard({
      id: 'music_festival_announced',
      name: 'Festival Season',
      description: 'A major festival is looking for underground acts!',
      icon: '🎪',
      type: 'opportunity',
      rarity: 'uncommon',
      duration: 'turn',
      effects: [{
        type: 'modify_stat',
        target: 'all_bands',
        value: { popularity: 10, energy: 5 },
        description: 'All bands gain popularity and energy'
      }],
      choices: [
        {
          id: 'apply_all',
          text: 'Submit all bands for consideration',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { connections: -2 },
            description: 'Costs connections to submit'
          }]
        },
        {
          id: 'select_best',
          text: 'Only submit your best band',
          effects: [{
            type: 'modify_stat',
            target: 'random_band',
            value: { popularity: 25 },
            description: 'One band gets major boost'
          }]
        }
      ],
      flavorText: "The underground is about to go mainstream...",
      artStyle: 'tour_flyer'
    });
    
    this.addEventCard({
      id: 'record_label_scout',
      name: 'A&R Scout in Town',
      description: 'Major label scouts are checking out the scene',
      icon: '👔',
      type: 'opportunity',
      rarity: 'rare',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'sell_out',
          text: 'Let them sign your bands',
          effects: [
            {
              type: 'modify_stat',
              target: 'all_bands',
              value: { popularity: 30, authenticity: -40 },
              description: 'Fame at the cost of credibility'
            },
            {
              type: 'resource_change',
              target: 'player',
              value: { money: 500 },
              description: 'Big payday!'
            }
          ]
        },
        {
          id: 'stay_true',
          text: 'Reject the corporate machine',
          effects: [
            {
              type: 'modify_stat',
              target: 'all_bands',
              value: { authenticity: 20 },
              description: 'Scene respect increased'
            },
            {
              type: 'trigger_synergy',
              target: 'all_bands',
              value: 'diy_spirit',
              description: 'Triggers DIY synergies'
            }
          ]
        }
      ],
      artStyle: 'backstage_pass'
    });
    
    // Crisis Events
    this.addEventCard({
      id: 'police_crackdown',
      name: 'Police Crackdown',
      description: 'Cops are shutting down DIY venues!',
      icon: '🚔',
      type: 'crisis',
      rarity: 'common',
      duration: 'turn',
      effects: [{
        type: 'modify_stat',
        target: 'all_venues',
        value: { capacity: -20 },
        description: 'All venues have reduced capacity'
      }],
      requirements: [{
        type: 'scene_state',
        value: 'underground',
        operator: 'equals'
      }],
      flavorText: "The man is trying to keep us down!",
      artStyle: 'press_release'
    });
    
    this.addEventCard({
      id: 'venue_fire',
      name: 'Venue Fire',
      description: 'Electrical fire damages a venue!',
      icon: '🔥',
      type: 'crisis',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [{
        type: 'transform_card',
        target: 'random_venue',
        value: { closed: true },
        description: 'One venue temporarily closes'
      }],
      choices: [
        {
          id: 'fundraiser',
          text: 'Organize benefit shows',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { money: -100, reputation: 20 },
            description: 'Spend money to gain scene cred'
          }],
          cost: { type: 'money', amount: 100 }
        },
        {
          id: 'ignore',
          text: 'Focus on other venues',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { reputation: -10 },
            description: 'Lose respect for not helping'
          }]
        }
      ]
    });
    
    // Wildcard Events
    this.addEventCard({
      id: 'battle_of_bands',
      name: 'Battle of the Bands',
      description: 'Competition brings out the best (and worst) in everyone',
      icon: '⚔️',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'compete',
          text: 'Enter the competition',
          effects: [
            {
              type: 'modify_stat',
              target: 'all_bands',
              value: { energy: 20, stress: 15 },
              description: 'Bands get pumped but stressed'
            },
            {
              type: 'spawn_card',
              target: 'player',
              value: { type: 'trophy_band' },
              description: 'Winner gets special status'
            }
          ]
        },
        {
          id: 'boycott',
          text: 'Boycott competitive culture',
          effects: [{
            type: 'modify_stat',
            target: 'all_bands',
            value: { authenticity: 15 },
            description: 'Unity over competition'
          }]
        }
      ],
      artStyle: 'concert_poster'
    });
    
    this.addEventCard({
      id: 'documentary_crew',
      name: 'Documentary Filming',
      description: 'Film crew wants to document the scene',
      icon: '📹',
      type: 'wildcard',
      rarity: 'rare',
      duration: 'persistent',
      effects: [{
        type: 'modify_stat',
        target: 'all_bands',
        value: { popularity: 5 },
        duration: 3,
        description: 'Ongoing exposure boost'
      }],
      choices: [
        {
          id: 'full_access',
          text: 'Give them full access',
          effects: [{
            type: 'scene_change',
            target: 'player',
            value: { exposure: 'high' },
            description: 'Scene goes viral'
          }]
        },
        {
          id: 'controlled',
          text: 'Control the narrative',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { stress: 10 },
            description: 'Stressful to manage'
          }]
        }
      ]
    });
    
    // Legendary Events
    this.addEventCard({
      id: 'reunion_show',
      name: 'Legendary Reunion',
      description: 'A scene-defining band reunites for one show!',
      icon: '👑',
      type: 'legendary',
      rarity: 'legendary',
      duration: 'instant',
      requirements: [{
        type: 'turn_number',
        value: 10,
        operator: 'greater_than'
      }],
      effects: [
        {
          type: 'spawn_card',
          target: 'player',
          value: { type: 'legendary_band' },
          description: 'Legendary band available for one show'
        },
        {
          type: 'modify_stat',
          target: 'all_bands',
          value: { energy: 25, popularity: 15 },
          description: 'Everyone is inspired'
        },
        {
          type: 'trigger_synergy',
          target: 'all_bands',
          value: 'scene_unity',
          description: 'Scene comes together'
        }
      ],
      flavorText: "One night only... history in the making!",
      artStyle: 'concert_poster'
    });
    
    this.addEventCard({
      id: 'perfect_storm',
      name: 'The Perfect Storm',
      description: 'Everything aligns for an epic night',
      icon: '⚡',
      type: 'legendary',
      rarity: 'legendary',
      duration: 'turn',
      requirements: [
        {
          type: 'active_synergies',
          value: 5,
          operator: 'greater_than'
        },
        {
          type: 'reputation',
          value: 80,
          operator: 'greater_than'
        }
      ],
      effects: [
        {
          type: 'modify_stat',
          target: 'all_bands',
          value: { 
            popularity: 50,
            energy: 100,
            authenticity: 100,
            technicalSkill: 30
          },
          description: 'All bands reach peak performance'
        },
        {
          type: 'resource_change',
          target: 'player',
          value: { 
            money: 1000,
            reputation: 50,
            legacy: 1
          },
          description: 'Massive rewards'
        }
      ],
      flavorText: "Decades from now, they'll still talk about this night..."
    });
  }
  
  private addEventCard(card: EventCard) {
    this.eventCards.set(card.id, card);
  }
  
  // Draw a random event card based on current game state
  drawEventCard(gameState: any): EventCard | null {
    const availableCards = Array.from(this.eventCards.values()).filter(card => {
      // Check requirements
      if (card.requirements) {
        return card.requirements.every(req => {
          switch (req.type) {
            case 'turn_number':
              return this.compareValue(gameState.turn, req.value, req.operator);
            case 'reputation':
              return this.compareValue(gameState.reputation, req.value, req.operator);
            case 'scene_state':
              return gameState.sceneState === req.value;
            case 'active_synergies':
              return this.compareValue(gameState.activeSynergies, req.value, req.operator);
            case 'card_count':
              return this.compareValue(gameState.totalCards, req.value, req.operator);
            default:
              return true;
          }
        });
      }
      return true;
    });
    
    if (availableCards.length === 0) return null;
    
    // Weight by rarity
    const weights = {
      common: 4,
      uncommon: 3,
      rare: 2,
      legendary: 1
    };
    
    const weightedCards = availableCards.flatMap(card => 
      Array(weights[card.rarity]).fill(card)
    );
    
    const selected = weightedCards[Math.floor(Math.random() * weightedCards.length)];
    
    // Play sound based on type
    if (selected.type === 'crisis') {
      haptics.heavy();
      audio.play('alarm');
    } else if (selected.type === 'legendary') {
      haptics.success();
      audio.play('achievement');
    } else {
      haptics.medium();
      audio.play('notification');
    }
    
    return selected;
  }
  
  // Apply event choice
  applyEventChoice(card: EventCard, choiceId: string | null, gameState: any): any {
    const choice = choiceId ? card.choices?.find(c => c.id === choiceId) : null;
    const effects = choice ? choice.effects : card.effects;
    
    const results = {
      appliedEffects: effects,
      modifiedCards: [] as any[],
      resourceChanges: {} as any,
      spawnedCards: [] as any[]
    };
    
    // Apply each effect
    effects.forEach(effect => {
      switch (effect.type) {
        case 'modify_stat':
          // This would modify actual game cards
          results.modifiedCards.push({
            target: effect.target,
            modifications: effect.value
          });
          break;
          
        case 'resource_change':
          results.resourceChanges = effect.value;
          break;
          
        case 'spawn_card':
          results.spawnedCards.push(effect.value);
          break;
          
        case 'trigger_synergy':
          // Trigger specific synergies
          break;
          
        case 'scene_change':
          // Modify scene state
          break;
      }
    });
    
    // Track active events if persistent
    if (card.duration === 'persistent' || card.duration === 'turn') {
      this.activeEvents.push({
        card,
        turnsRemaining: card.duration === 'turn' ? 1 : 3,
        appliedEffects: effects
      });
    }
    
    // Record history
    this.eventHistory.push({
      cardId: card.id,
      turn: gameState.turn,
      choice: choiceId || undefined
    });
    
    return results;
  }
  
  // Process turn-based event effects
  processTurnEffects(): any[] {
    const expiredEffects: any[] = [];
    
    this.activeEvents = this.activeEvents.filter(event => {
      event.turnsRemaining--;
      
      if (event.turnsRemaining <= 0) {
        expiredEffects.push(event);
        return false;
      }
      return true;
    });
    
    return expiredEffects;
  }
  
  private compareValue(actual: number, expected: number, operator: string): boolean {
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
  
  // Get active events
  getActiveEvents(): ActiveEvent[] {
    return this.activeEvents;
  }
  
  // Get event history
  getEventHistory(): any[] {
    return this.eventHistory;
  }
}

export const eventCardSystem = new EventCardSystem();
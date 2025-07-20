import { Band, Venue, GamePhase } from '@game/types';

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  rarity: EventRarity;
  triggerConditions: TriggerCondition[];
  effects: EventEffect[];
  choices?: EventChoice[];
  weight: number;
}

export enum EventType {
  SCENE = 'SCENE', // Affects the overall scene
  BAND = 'BAND', // Affects specific bands
  VENUE = 'VENUE', // Affects venues
  ECONOMIC = 'ECONOMIC', // Money/cost related
  REPUTATION = 'REPUTATION', // Fame related
  CRISIS = 'CRISIS', // Major negative events
  OPPORTUNITY = 'OPPORTUNITY', // Major positive events
}

export enum EventRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

export interface TriggerCondition {
  type: 'turn' | 'reputation' | 'money' | 'stress' | 'random';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
}

export interface EventEffect {
  type: 'money' | 'reputation' | 'stress' | 'connections' | 'band_stat' | 'venue_stat' | 'unlock';
  target?: 'all' | 'random' | string; // For band/venue effects
  value: number | string;
  duration?: number; // Turns the effect lasts
}

export interface EventChoice {
  id: string;
  text: string;
  requirements?: { resource: string; amount: number }[];
  effects: EventEffect[];
  successChance?: number; // 0-1, if not 100% guaranteed
}

export interface ActiveEvent {
  event: RandomEvent;
  turnsRemaining?: number;
  choiceMade?: string;
}

class RandomEventManager {
  private eventPool: RandomEvent[] = [];
  private activeEvents: ActiveEvent[] = [];
  private eventHistory: string[] = [];
  
  constructor() {
    this.initializeEvents();
  }
  
  private initializeEvents() {
    // Common Events
    this.eventPool.push({
      id: 'noise_complaint',
      name: 'Noise Complaint',
      description: 'Neighbors are complaining about the noise from last night\'s show.',
      type: EventType.CRISIS,
      rarity: EventRarity.COMMON,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.1 }
      ],
      effects: [],
      choices: [
        {
          id: 'pay_fine',
          text: 'Pay the fine ($50)',
          requirements: [{ resource: 'money', amount: 50 }],
          effects: [{ type: 'money', value: -50 }]
        },
        {
          id: 'apologize',
          text: 'Apologize and promise to keep it down',
          effects: [
            { type: 'stress', value: 10 },
            { type: 'reputation', value: -5 }
          ]
        },
        {
          id: 'ignore',
          text: 'Ignore the complaints',
          effects: [{ type: 'reputation', value: -10 }],
          successChance: 0.5
        }
      ],
      weight: 10
    });
    
    this.eventPool.push({
      id: 'equipment_failure',
      name: 'Equipment Failure',
      description: 'The PA system is acting up. You need to decide how to handle it.',
      type: EventType.CRISIS,
      rarity: EventRarity.COMMON,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.1 }
      ],
      effects: [],
      choices: [
        {
          id: 'repair',
          text: 'Emergency repair ($100)',
          requirements: [{ resource: 'money', amount: 100 }],
          effects: [{ type: 'money', value: -100 }]
        },
        {
          id: 'diy_fix',
          text: 'Try to fix it yourself',
          effects: [{ type: 'stress', value: 15 }],
          successChance: 0.7
        },
        {
          id: 'play_acoustic',
          text: 'Play an acoustic set instead',
          effects: [
            { type: 'reputation', value: 5 },
            { type: 'money', value: -30 }
          ]
        }
      ],
      weight: 8
    });
    
    // Uncommon Events
    this.eventPool.push({
      id: 'touring_band',
      name: 'Touring Band Wants In',
      description: 'A well-known touring band wants to play a secret show at one of your venues!',
      type: EventType.OPPORTUNITY,
      rarity: EventRarity.UNCOMMON,
      triggerConditions: [
        { type: 'reputation', operator: '>', value: 30 },
        { type: 'random', operator: '>', value: 0.2 }
      ],
      effects: [],
      choices: [
        {
          id: 'book_them',
          text: 'Book the show!',
          effects: [
            { type: 'reputation', value: 15 },
            { type: 'money', value: 200 },
            { type: 'stress', value: 20 }
          ]
        },
        {
          id: 'exclusive_deal',
          text: 'Negotiate an exclusive deal',
          requirements: [{ resource: 'connections', amount: 10 }],
          effects: [
            { type: 'reputation', value: 25 },
            { type: 'money', value: 100 },
            { type: 'connections', value: -10 }
          ]
        },
        {
          id: 'pass',
          text: 'Pass on the opportunity',
          effects: [{ type: 'stress', value: -10 }]
        }
      ],
      weight: 5
    });
    
    this.eventPool.push({
      id: 'venue_raid',
      name: 'Police Raid!',
      description: 'The cops are raiding one of your venues during a show!',
      type: EventType.CRISIS,
      rarity: EventRarity.UNCOMMON,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.05 }
      ],
      effects: [],
      choices: [
        {
          id: 'shut_down',
          text: 'Shut down the show immediately',
          effects: [
            { type: 'reputation', value: -10 },
            { type: 'money', value: -50 }
          ]
        },
        {
          id: 'talk_way_out',
          text: 'Try to talk your way out',
          requirements: [{ resource: 'connections', amount: 15 }],
          effects: [{ type: 'connections', value: -5 }],
          successChance: 0.8
        },
        {
          id: 'run',
          text: 'Everyone scatter!',
          effects: [
            { type: 'reputation', value: -20 },
            { type: 'stress', value: 30 }
          ]
        }
      ],
      weight: 3
    });
    
    // Rare Events
    this.eventPool.push({
      id: 'viral_moment',
      name: 'Viral Video!',
      description: 'A video from one of your shows just went viral on social media!',
      type: EventType.OPPORTUNITY,
      rarity: EventRarity.RARE,
      triggerConditions: [
        { type: 'reputation', operator: '>', value: 50 },
        { type: 'random', operator: '>', value: 0.02 }
      ],
      effects: [],
      choices: [
        {
          id: 'embrace_fame',
          text: 'Embrace the attention',
          effects: [
            { type: 'reputation', value: 30 },
            { type: 'money', value: 300 },
            { type: 'band_stat', target: 'all', value: 10 } // Popularity boost
          ]
        },
        {
          id: 'stay_underground',
          text: 'Try to stay underground',
          effects: [
            { type: 'reputation', value: 10 },
            { type: 'connections', value: 20 }
          ]
        }
      ],
      weight: 2
    });
    
    this.eventPool.push({
      id: 'legendary_performance',
      name: 'Legendary Performance!',
      description: 'Last night\'s show was absolutely legendary. Word is spreading fast!',
      type: EventType.OPPORTUNITY,
      rarity: EventRarity.RARE,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.01 }
      ],
      effects: [
        { type: 'reputation', value: 20 },
        { type: 'band_stat', target: 'random', value: 15 }
      ],
      weight: 1
    });
    
    // Legendary Events
    this.eventPool.push({
      id: 'scene_explosion',
      name: 'Scene Explosion!',
      description: 'The underground scene is exploding! Major labels and media are taking notice.',
      type: EventType.OPPORTUNITY,
      rarity: EventRarity.LEGENDARY,
      triggerConditions: [
        { type: 'reputation', operator: '>', value: 80 },
        { type: 'turn', operator: '>', value: 20 },
        { type: 'random', operator: '>', value: 0.005 }
      ],
      effects: [],
      choices: [
        {
          id: 'sell_out',
          text: 'Cash in on the hype',
          effects: [
            { type: 'money', value: 1000 },
            { type: 'reputation', value: -30 }
          ]
        },
        {
          id: 'protect_scene',
          text: 'Protect the underground',
          effects: [
            { type: 'reputation', value: 50 },
            { type: 'connections', value: 30 },
            { type: 'unlock', value: 'true_underground' }
          ]
        }
      ],
      weight: 0.5
    });
  }
  
  // Check for and trigger random events
  checkForEvents(gameState: any): RandomEvent | null {
    // Don't trigger events every turn
    if (Math.random() > 0.3) return null;
    
    // Filter events by trigger conditions
    const eligibleEvents = this.eventPool.filter(event => {
      // Check if event was recently triggered
      if (this.eventHistory.includes(event.id) && 
          this.eventHistory.slice(-5).includes(event.id)) {
        return false;
      }
      
      // Check all trigger conditions
      return event.triggerConditions.every(condition => {
        switch (condition.type) {
          case 'turn':
            return this.compareValue(gameState.turn, condition.operator, condition.value);
          case 'reputation':
            return this.compareValue(gameState.reputation, condition.operator, condition.value);
          case 'money':
            return this.compareValue(gameState.money, condition.operator, condition.value);
          case 'stress':
            return this.compareValue(gameState.stress, condition.operator, condition.value);
          case 'random':
            return Math.random() < condition.value;
          default:
            return false;
        }
      });
    });
    
    if (eligibleEvents.length === 0) return null;
    
    // Weight-based selection
    const totalWeight = eligibleEvents.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const event of eligibleEvents) {
      random -= event.weight;
      if (random <= 0) {
        this.eventHistory.push(event.id);
        return event;
      }
    }
    
    return eligibleEvents[0];
  }
  
  private compareValue(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>': return value > target;
      case '<': return value < target;
      case '=': return value === target;
      case '>=': return value >= target;
      case '<=': return value <= target;
      default: return false;
    }
  }
  
  // Apply event choice
  applyEventChoice(event: RandomEvent, choiceId: string, gameState: any): {
    success: boolean;
    effects: EventEffect[];
    message?: string;
  } {
    const choice = event.choices?.find(c => c.id === choiceId);
    if (!choice) {
      return { success: false, effects: [], message: 'Invalid choice' };
    }
    
    // Check requirements
    if (choice.requirements) {
      for (const req of choice.requirements) {
        if (gameState[req.resource] < req.amount) {
          return { 
            success: false, 
            effects: [], 
            message: `Insufficient ${req.resource}` 
          };
        }
      }
    }
    
    // Check success chance
    if (choice.successChance !== undefined && Math.random() > choice.successChance) {
      return { 
        success: false, 
        effects: [], 
        message: 'The attempt failed!' 
      };
    }
    
    // Apply immediate effects if no choices
    const effectsToApply = choice ? choice.effects : event.effects;
    
    // Track active event if it has duration
    const hasDuration = effectsToApply.some(e => e.duration);
    if (hasDuration) {
      const maxDuration = Math.max(...effectsToApply.map(e => e.duration || 0));
      this.activeEvents.push({
        event,
        turnsRemaining: maxDuration,
        choiceMade: choiceId
      });
    }
    
    return { 
      success: true, 
      effects: effectsToApply 
    };
  }
  
  // Process ongoing events
  processActiveEvents(): EventEffect[] {
    const ongoingEffects: EventEffect[] = [];
    
    this.activeEvents = this.activeEvents.filter(active => {
      if (!active.turnsRemaining) return false;
      
      active.turnsRemaining--;
      
      // Add ongoing effects
      const choice = active.event.choices?.find(c => c.id === active.choiceMade);
      const effects = choice ? choice.effects : active.event.effects;
      
      effects.forEach(effect => {
        if (effect.duration) {
          ongoingEffects.push(effect);
        }
      });
      
      return active.turnsRemaining > 0;
    });
    
    return ongoingEffects;
  }
  
  // Get active events
  getActiveEvents(): ActiveEvent[] {
    return this.activeEvents;
  }
  
  // Add custom events (for unlockables)
  addCustomEvent(event: RandomEvent) {
    this.eventPool.push(event);
  }
  
  // Get event by ID
  getEvent(eventId: string): RandomEvent | undefined {
    return this.eventPool.find(e => e.id === eventId);
  }
}

export const randomEventManager = new RandomEventManager();
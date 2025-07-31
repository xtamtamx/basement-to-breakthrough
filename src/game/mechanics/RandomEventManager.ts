
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
      name: 'Man Who "Used to Be in a Band" Files 37th Noise Complaint This Year',
      description: 'Local resident Brad Thompson, 42, who played bass "professionally" for three weeks in 2003, has filed another noise complaint. Sources confirm he was seen measuring decibel levels with an app he downloaded specifically for this purpose.',
      type: EventType.CRISIS,
      rarity: EventRarity.COMMON,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.1 }
      ],
      effects: [],
      choices: [
        {
          id: 'pay_fine',
          text: 'Pay the fine ($50) while Brad watches from his window',
          requirements: [{ resource: 'money', amount: 50 }],
          effects: [{ type: 'money', value: -50 }]
        },
        {
          id: 'apologize',
          text: 'Listen to his "glory days" stories for 45 minutes',
          effects: [
            { type: 'stress', value: 10 },
            { type: 'reputation', value: -5 }
          ]
        },
        {
          id: 'ignore',
          text: 'Blast his least favorite subgenre out of spite',
          effects: [{ type: 'reputation', value: -10 }],
          successChance: 0.5
        }
      ],
      weight: 10
    });
    
    this.eventPool.push({
      id: 'equipment_failure',
      name: 'PA System Achieves Sentience, Immediately Quits',
      description: 'The venue\'s 1987 Peavey mixing board has gained consciousness just long enough to realize what it\'s been playing for 35 years. It\'s now refusing to work, citing "irreconcilable creative differences" and demanding hazard pay for exposure to that many Wonderwall covers.',
      type: EventType.CRISIS,
      rarity: EventRarity.COMMON,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.1 }
      ],
      effects: [],
      choices: [
        {
          id: 'repair',
          text: 'Call your "sound guy" (someone\'s roommate) for $100',
          requirements: [{ resource: 'money', amount: 100 }],
          effects: [{ type: 'money', value: -100 }]
        },
        {
          id: 'diy_fix',
          text: 'Hit it repeatedly while yelling "CHECK, CHECK"',
          effects: [{ type: 'stress', value: 15 }],
          successChance: 0.7
        },
        {
          id: 'play_acoustic',
          text: 'Pretend this was always meant to be an "intimate acoustic experience"',
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
      name: 'Band With 3,000 Spotify Listeners Demands "Secret Show" at Your Venue',
      description: 'Moderately Successful Indie Band "Flannel Daddy Issues" wants to play an "intimate secret show" at your venue after their van broke down nearby. Their manager (the guitarist\'s girlfriend) assures you they\'re "basically the next big thing" and mentions their song was featured in a Canadian web series for 4 seconds.',
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
          text: 'Book them and pretend it\'s Coachella-level exclusive',
          effects: [
            { type: 'reputation', value: 15 },
            { type: 'money', value: 200 },
            { type: 'stress', value: 20 }
          ]
        },
        {
          id: 'exclusive_deal',
          text: 'Negotiate for 15% of their kombucha rider',
          requirements: [{ resource: 'connections', amount: 10 }],
          effects: [
            { type: 'reputation', value: 25 },
            { type: 'money', value: 100 },
            { type: 'connections', value: -10 }
          ]
        },
        {
          id: 'pass',
          text: 'Claim you\'re already booked (with literally nothing)',
          effects: [{ type: 'stress', value: -10 }]
        }
      ],
      weight: 5
    });
    
    this.eventPool.push({
      id: 'venue_raid',
      name: 'Police Confuse Hardcore Show for "Gang Activity," Awkwardness Ensues',
      description: 'Local PD\'s gang unit has arrived after receiving reports of "coordinated violent movements" and "ritualistic chanting." Officer Johnson is now trying to decode what "ACAB" means while his partner asks if "straight edge" is a new street drug. The K-9 unit is just vibing to the blast beats.',
      type: EventType.CRISIS,
      rarity: EventRarity.UNCOMMON,
      triggerConditions: [
        { type: 'random', operator: '>', value: 0.05 }
      ],
      effects: [],
      choices: [
        {
          id: 'shut_down',
          text: 'Announce it\'s actually a prayer meeting',
          effects: [
            { type: 'reputation', value: -10 },
            { type: 'money', value: -50 }
          ]
        },
        {
          id: 'talk_way_out',
          text: 'Explain that the mosh pit is "interpretive dance"',
          requirements: [{ resource: 'connections', amount: 15 }],
          effects: [{ type: 'connections', value: -5 }],
          successChance: 0.8
        },
        {
          id: 'run',
          text: 'Yell "COPS!" and watch 200 people try to fit through one door',
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
      name: 'TikTok Teen Films Pit, Becomes Scene\'s Worst Nightmare',
      description: 'A 16-year-old named Madison has posted a video titled "Giving Scary Punk Boys Makeovers at Underground Show!!!" It now has 2.3 million views. Comments include "why are they so angry lol" and "the one in the Discharge shirt is kinda cute tho." Your venue is tagged as "that place with the scary bathroom."',
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
          text: 'Lean into it and start selling "Scary Bathroom" merch',
          effects: [
            { type: 'reputation', value: 30 },
            { type: 'money', value: 300 },
            { type: 'band_stat', target: 'all', value: 10 } // Popularity boost
          ]
        },
        {
          id: 'stay_underground',
          text: 'Change venue name and pretend it never happened',
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
      name: 'Show So Good, Even the Bartender Put Down Their Phone',
      description: 'Witnesses report seeing the venue\'s notoriously jaded bartender actually watching the performance instead of scrolling Instagram. One patron claims they saw a single tear roll down the bartender\'s face during the breakdown, though this remains unconfirmed. The bathroom line reportedly stopped moving as people refused to miss any part of the set.',
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
      name: 'Pitchfork Gives Local Scene 7.3, Everything Immediately Goes to Hell',
      description: 'A Pitchfork writer who got lost on the way to a craft brewery has stumbled into your venue and written a think piece titled "The Last Real Scene in America (That We Just Discovered)." Property values have increased 400% overnight. Someone is already planning a documentary. Your regular crowd is having an existential crisis in the group chat.',
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
          text: 'Open a second location in a strip mall',
          effects: [
            { type: 'money', value: 1000 },
            { type: 'reputation', value: -30 }
          ]
        },
        {
          id: 'protect_scene',
          text: 'Institute a "No Music Journalists" door policy',
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
  applyEventChoice(event: RandomEvent, choiceId: string): {
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
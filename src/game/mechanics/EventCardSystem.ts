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
      name: 'Coachella Accidentally Books Local Doom Band After Intern Mishears "Dune"',
      description: 'Festival organizers reportedly spent three hours debating whether "Sludgelord" was a typo before deciding to "lean into the underground vibe." The $150,000 performance fee remains unchanged despite the band\'s usual draw of 12 people.',
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
          text: 'Submit every band with a pulse and a Bandcamp page',
          effects: [{
            type: 'resource_change',
            target: 'player',
            value: { connections: -2 },
            description: 'Costs connections to submit'
          }]
        },
        {
          id: 'select_best',
          text: 'Only submit the band that showers most frequently',
          effects: [{
            type: 'modify_stat',
            target: 'random_band',
            value: { popularity: 25 },
            description: 'One band gets major boost'
          }]
        }
      ],
      flavorText: "Sources close to the festival confirm they still don\'t know what shoegaze is.",
      artStyle: 'tour_flyer'
    });
    
    this.addEventCard({
      id: 'record_label_scout',
      name: 'Atlantic Records A&R Rep Googles "What Is Hardcore" During Show',
      description: 'Witnesses report seeing a confused man in a $3,000 suit frantically texting "These guys are just yelling?" while standing directly in the pit. His assistant was later hospitalized after attempting to crowdsurf in loafers.',
      icon: '👔',
      type: 'opportunity',
      rarity: 'rare',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'sell_out',
          text: 'Sign that 360 deal and start practicing your radio voice',
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
          text: 'Tell him the bathroom is actually the merch table',
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
      name: 'Police Mistake House Show for "Satanic Ritual" Due to Corpse Paint',
      description: 'Local PD\'s "Gang Unit" spent six hours analyzing black metal logos before concluding they were "definitely summoning something." The lead officer\'s report noted suspicious "upside-down crosses" that were later identified as the letter T.',
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
      flavorText: "Department training video now includes a slide titled \'Mosh Pit vs. Demonic Possession: Know the Difference.\'",
      artStyle: 'press_release'
    });
    
    this.addEventCard({
      id: 'venue_fire',
      name: 'DIY Venue\'s "Vintage" Wiring Finally Achieves Dream of Becoming Fire',
      description: 'After 40 years of code violations, the electrical system at The Rat\'s Nest has fulfilled its lifelong ambition. Fire marshal quoted as saying "I\'m honestly surprised it took this long" while standing in a puddle of what neighbors describe as "definitely not up to code."',
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
          text: 'Organize benefit show called "Burn This Mother Down" (too soon?)',
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
          text: 'Post "thoughts and prayers" on Instagram and move on',
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
      name: 'Guitar Center Hosts Battle of the Bands, Winner Gets $50 Gift Card',
      description: 'Local musicians reportedly spending upwards of $2,000 on new gear to compete for store credit that "technically expires in 90 days." Judge panel consists of three employees who "mostly work in the keyboard section."',
      icon: '⚔️',
      type: 'wildcard',
      rarity: 'uncommon',
      duration: 'instant',
      effects: [],
      choices: [
        {
          id: 'compete',
          text: 'Dust off that Wonderwall cover for the finals',
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
          text: 'Start rival event at the abandoned Arby\'s',
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
      name: 'Vice Documentarian Can\'t Stop Asking "But Why Are You So Angry?"',
      description: 'Film student with wealthy parents spending $80,000 on thesis about "The Dark Underbelly of DIY." Has been spotted asking the sound guy if he "ever smiles" and whether the mosh pit represents "societal collapse or just bad parenting."',
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
          text: 'Let them film everything, including the bathroom graffiti',
          effects: [{
            type: 'scene_change',
            target: 'player',
            value: { exposure: 'high' },
            description: 'Scene goes viral'
          }]
        },
        {
          id: 'controlled',
          text: 'Assign someone to explain that it\'s actually about community',
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
      name: 'Band That "Broke Up Forever" in 2019 Announces Reunion Tour',
      description: 'Members of Throat Punch, who famously burned their instruments on stage and declared "rock is dead," seen at Guitar Center pricing flame-retardant guitars. Lead singer\'s statement that he "never said forever-forever" has already spawned 47 memes.',
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
      flavorText: "Ticket prices start at $180 for \'authentic DIY experience.\'",
      artStyle: 'concert_poster'
    });
    
    this.addEventCard({
      id: 'perfect_storm',
      name: 'Every Band\'s Van Breaks Down at Same Gas Station, Accidentally Creates Festival',
      description: 'What started as 17 separate radiator failures has transformed a Shell station into "GasStock 2024." Attendant quoted as saying he "just wanted to close at 10" while reluctantly becoming the event\'s de facto stage manager. Local news already calling it "Woodstock for people with AAA memberships."',
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
      flavorText: "The bathroom key is now being treated as a holy relic."
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
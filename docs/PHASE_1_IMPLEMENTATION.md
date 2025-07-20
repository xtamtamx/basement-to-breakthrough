# Phase 1: Scene Politics & Faction System - Implementation Guide

## Overview
This phase adds depth to the game through faction relationships, band politics, and scene dynamics. This will transform the game from simple show booking to navigating complex social and political landscapes.

## Step-by-Step Implementation

### Step 1: Define Faction System Types

First, update `/src/game/types/core.ts` to add faction-related types:

```typescript
// Add to core.ts

export interface Faction {
  id: string;
  name: string;
  description: string;
  values: FactionValues;
  modifiers: FactionModifiers;
  relationships: Map<string, number>; // faction id -> relationship (-100 to 100)
  memberBands: string[]; // band ids
  controlledVenues: string[]; // venue ids
  iconColor: string;
  traits: string[];
}

export interface FactionValues {
  authenticity: number; // How much they value authenticity
  technicalSkill: number; // How much they value skill
  popularity: number; // How much they value mainstream success
  tradition: number; // How much they value scene history
  innovation: number; // How much they value new ideas
}

export interface FactionModifiers {
  fanBonus: number; // Multiplier for fan gain
  reputationMultiplier: number; // Multiplier for reputation
  moneyModifier: number; // Modifier for ticket prices
  capacityBonus: number; // Bonus venue capacity
  dramaChance: number; // Chance of drama events
}

export interface FactionEvent {
  id: string;
  type: FactionEventType;
  factionId: string;
  title: string;
  description: string;
  choices: FactionChoice[];
  triggered: boolean;
}

export enum FactionEventType {
  CONFLICT = 'CONFLICT',
  ALLIANCE = 'ALLIANCE',
  TERRITORY = 'TERRITORY',
  IDEOLOGY = 'IDEOLOGY',
  DRAMA = 'DRAMA'
}

export interface FactionChoice {
  id: string;
  text: string;
  effects: FactionChoiceEffects;
}

export interface FactionChoiceEffects {
  factionChanges: Map<string, number>; // faction id -> reputation change
  resourceChanges?: Partial<Resources>;
  unlocks?: string[];
  consequences?: string[]; // event ids to trigger later
}
```

### Step 2: Create FactionSystem.ts

Create `/src/game/mechanics/FactionSystem.ts`:

```typescript
import { Faction, Band, Venue, Show, FactionEvent, FactionEventType } from '@game/types';

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
        name: 'DIY Purists',
        description: 'True believers in the DIY ethic. No sellouts, no compromises.',
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
        relationships: new Map(),
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
        relationships: new Map(),
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
        relationships: new Map(),
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
        relationships: new Map(),
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
        relationships: new Map(),
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
      faction1.relationships.set(faction2Id, value);
      faction2.relationships.set(faction1Id, value);
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
    alignment += (100 - Math.abs(band.popularity - faction.values.popularity)) * 0.2;
    
    // Check for matching traits
    band.traits.forEach(trait => {
      if (faction.traits.includes(trait.type.toLowerCase())) {
        alignment += 10;
      }
    });

    return Math.max(0, Math.min(100, alignment));
  }

  // Get faction modifiers for a show
  getShowModifiers(band: Band, venue: Venue): FactionModifiers {
    let combinedModifiers: FactionModifiers = {
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

  private adjustStanding(factionId: string, change: number) {
    const current = this.playerStandings.get(factionId) || 0;
    const newStanding = Math.max(-100, Math.min(100, current + change));
    this.playerStandings.set(factionId, newStanding);

    // Check for relationship cascades
    const faction = this.factions.get(factionId);
    if (faction && Math.abs(change) > 5) {
      faction.relationships.forEach((relationship, otherFactionId) => {
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

  // Generate faction events based on current state
  private checkForFactionEvents() {
    const events: FactionEvent[] = [];

    // Check for conflicts
    this.factions.forEach((faction1, faction1Id) => {
      this.factions.forEach((faction2, faction2Id) => {
        if (faction1Id < faction2Id) { // Avoid duplicates
          const standing1 = this.playerStandings.get(faction1Id) || 0;
          const standing2 = this.playerStandings.get(faction2Id) || 0;
          const relationship = faction1.relationships.get(faction2Id) || 0;

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
            factionChanges: new Map([
              [faction1.id, 20],
              [faction2.id, -30]
            ]),
            resourceChanges: { reputation: 5 }
          }
        },
        {
          id: 'side-with-2', 
          text: `Support ${faction2.name}`,
          effects: {
            factionChanges: new Map([
              [faction1.id, -30],
              [faction2.id, 20]
            ]),
            resourceChanges: { reputation: 5 }
          }
        },
        {
          id: 'stay-neutral',
          text: 'Try to stay neutral',
          effects: {
            factionChanges: new Map([
              [faction1.id, -10],
              [faction2.id, -10]
            ]),
            resourceChanges: { reputation: -5, stress: 10 }
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

  // Apply player choice to faction event
  applyEventChoice(eventId: string, choiceId: string) {
    const event = this.factionEvents.find(e => e.id === eventId);
    if (!event) return;

    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Apply faction changes
    choice.effects.factionChanges.forEach((change, factionId) => {
      this.adjustStanding(factionId, change);
    });

    // Mark event as triggered
    event.triggered = true;

    return choice.effects;
  }

  // Get all faction data for UI
  getAllFactionData() {
    const data: any[] = [];
    this.factions.forEach((faction, id) => {
      data.push({
        ...faction,
        playerStanding: this.playerStandings.get(id) || 0
      });
    });
    return data;
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
}

export const factionSystem = new FactionSystem();
```

### Step 3: Create Band Relationship System

Create `/src/game/mechanics/BandRelationships.ts`:

```typescript
import { Band } from '@game/types';

interface BandRelationship {
  band1Id: string;
  band2Id: string;
  relationship: number; // -100 to 100
  history: RelationshipEvent[];
}

interface RelationshipEvent {
  type: 'show_together' | 'conflict' | 'collaboration' | 'drama';
  description: string;
  impact: number;
  turn: number;
}

class BandRelationshipSystem {
  private relationships: Map<string, BandRelationship> = new Map();

  getRelationshipKey(band1Id: string, band2Id: string): string {
    return [band1Id, band2Id].sort().join('-');
  }

  getRelationship(band1Id: string, band2Id: string): number {
    const key = this.getRelationshipKey(band1Id, band2Id);
    return this.relationships.get(key)?.relationship || 0;
  }

  updateRelationship(
    band1Id: string, 
    band2Id: string, 
    change: number, 
    event: Omit<RelationshipEvent, 'turn'>
  ) {
    const key = this.getRelationshipKey(band1Id, band2Id);
    let relationship = this.relationships.get(key);

    if (!relationship) {
      relationship = {
        band1Id: band1Id < band2Id ? band1Id : band2Id,
        band2Id: band1Id < band2Id ? band2Id : band1Id,
        relationship: 0,
        history: []
      };
      this.relationships.set(key, relationship);
    }

    relationship.relationship = Math.max(-100, Math.min(100, relationship.relationship + change));
    relationship.history.push({
      ...event,
      turn: 0 // Will be set by game state
    });
  }

  checkLineupConflicts(bandIds: string[]): string[] {
    const conflicts: string[] = [];

    for (let i = 0; i < bandIds.length; i++) {
      for (let j = i + 1; j < bandIds.length; j++) {
        const relationship = this.getRelationship(bandIds[i], bandIds[j]);
        
        if (relationship < -50) {
          conflicts.push(`Bands won't play together due to bad blood`);
        } else if (relationship < -30) {
          conflicts.push(`Tension between bands may cause problems`);
        }
      }
    }

    return conflicts;
  }

  calculateLineupSynergy(bandIds: string[]): number {
    if (bandIds.length < 2) return 1;

    let totalSynergy = 0;
    let pairCount = 0;

    for (let i = 0; i < bandIds.length; i++) {
      for (let j = i + 1; j < bandIds.length; j++) {
        const relationship = this.getRelationship(bandIds[i], bandIds[j]);
        totalSynergy += relationship;
        pairCount++;
      }
    }

    const avgRelationship = totalSynergy / pairCount;
    
    // Convert to multiplier (0.5 to 1.5)
    return 1 + (avgRelationship / 200);
  }

  generateDramaEvent(band1: Band, band2: Band): string | null {
    const relationship = this.getRelationship(band1.id, band2.id);
    
    if (relationship < -70) {
      const events = [
        `${band1.name} refuses to share equipment with ${band2.name}`,
        `Members of ${band1.name} and ${band2.name} get into a backstage argument`,
        `${band1.name} starts their set late to spite ${band2.name}`
      ];
      return events[Math.floor(Math.random() * events.length)];
    } else if (relationship > 70) {
      const events = [
        `${band1.name} brings out ${band2.name} for an epic collaboration`,
        `${band1.name} and ${band2.name} share gear to save costs`,
        `Fans love seeing ${band1.name} and ${band2.name} support each other`
      ];
      return events[Math.floor(Math.random() * events.length)];
    }
    
    return null;
  }
}

export const bandRelationships = new BandRelationshipSystem();
```

### Step 4: Update ShowExecutor

Update `/src/game/mechanics/ShowExecutor.ts` to integrate faction and relationship systems:

```typescript
// Add to imports
import { factionSystem } from './FactionSystem';
import { bandRelationships } from './BandRelationships';

// Update executeShow method to include faction effects
executeShow(
  show: Show,
  band: Band,
  venue: Venue,
  gameState: GameState
): ShowResult {
  // ... existing code ...

  // Get faction modifiers
  const factionMods = factionSystem.getShowModifiers(band, venue);
  
  // Apply faction modifiers
  let attendance = result.attendance * factionMods.fanBonus;
  let reputation = result.reputationChange * factionMods.reputationMultiplier;
  let revenue = result.revenue * (1 + factionMods.moneyModifier);
  
  // Check for faction-related drama
  if (Math.random() < factionMods.dramaChance) {
    result.incidents.push({
      type: 'FACTION_DRAMA',
      severity: 5,
      description: 'Faction tensions cause problems at the show',
      consequences: [{ type: 'REPUTATION_LOSS', value: 5 }]
    });
  }
  
  // Update faction standings
  factionSystem.updateStandingsFromShow(band, venue, result.success);
  
  // ... rest of method ...
}
```

### Step 5: Create Faction UI Components

Create `/src/components/game/FactionDisplay.tsx`:

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { factionSystem } from '@game/mechanics/FactionSystem';

export const FactionDisplay: React.FC = () => {
  const factions = factionSystem.getAllFactionData();

  const getStandingColor = (standing: number) => {
    if (standing > 50) return 'var(--pixel-green)';
    if (standing > 20) return 'var(--pixel-cyan)';
    if (standing < -50) return 'var(--pixel-red)';
    if (standing < -20) return 'var(--pixel-orange)';
    return 'var(--pixel-gray)';
  };

  const getStandingText = (standing: number) => {
    if (standing > 80) return 'ALLIED';
    if (standing > 50) return 'FRIENDLY';
    if (standing > 20) return 'NEUTRAL+';
    if (standing < -80) return 'HOSTILE';
    if (standing < -50) return 'UNFRIENDLY';
    if (standing < -20) return 'NEUTRAL-';
    return 'NEUTRAL';
  };

  return (
    <div className="glass-panel p-3">
      <h3 className="pixel-text pixel-text-sm mb-3" style={{ color: 'var(--pixel-yellow)' }}>
        FACTION STANDINGS
      </h3>
      
      <div className="space-y-2">
        {factions.map((faction) => (
          <motion.div
            key={faction.id}
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 pixel-border"
                style={{ backgroundColor: faction.iconColor }}
              />
              <span className="pixel-text pixel-text-xs">
                {faction.name.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 pixel-border bg-black relative">
                <motion.div
                  className="absolute h-full"
                  style={{ 
                    backgroundColor: getStandingColor(faction.playerStanding),
                    width: `${Math.abs(faction.playerStanding)}%`,
                    left: faction.playerStanding < 0 ? `${50 + faction.playerStanding / 2}%` : '50%'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(faction.playerStanding)}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>
              <span 
                className="pixel-text pixel-text-xs"
                style={{ color: getStandingColor(faction.playerStanding) }}
              >
                {getStandingText(faction.playerStanding)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-metal-800">
        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
          FACTION STANDING AFFECTS SHOW OUTCOMES
        </p>
      </div>
    </div>
  );
};
```

Create `/src/components/game/FactionEventModal.tsx`:

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FactionEvent } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface FactionEventModalProps {
  event: FactionEvent | null;
  onChoice: (eventId: string, choiceId: string) => void;
}

export const FactionEventModal: React.FC<FactionEventModalProps> = ({ event, onChoice }) => {
  if (!event) return null;

  const handleChoice = (choiceId: string) => {
    haptics.medium();
    audio.play('click');
    onChoice(event.id, choiceId);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="glass-panel p-6 max-w-md w-full"
        >
          <div className="text-center mb-4">
            <h2 className="pixel-text pixel-text-lg pixel-text-shadow" 
                style={{ color: 'var(--pixel-red)' }}>
              FACTION EVENT
            </h2>
          </div>

          <h3 className="pixel-text pixel-text-sm mb-3" 
              style={{ color: 'var(--pixel-yellow)' }}>
            {event.title}
          </h3>

          <p className="pixel-text pixel-text-xs mb-6" 
             style={{ color: 'var(--pixel-white)', lineHeight: '1.5' }}>
            {event.description}
          </p>

          <div className="space-y-3">
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                className="w-full glass-button p-3 text-left hover:scale-102 transition-transform"
              >
                <span className="pixel-text pixel-text-sm">
                  {choice.text}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
```

### Step 6: Update Game Store

Update `/src/stores/gameStore.ts`:

```typescript
// Add to interface
interface GameStore {
  // ... existing properties ...
  factionStandings: Map<string, number>;
  currentFactionEvent: FactionEvent | null;
  
  // Actions
  updateFactionStanding: (factionId: string, change: number) => void;
  setFactionEvent: (event: FactionEvent | null) => void;
  applyFactionChoice: (eventId: string, choiceId: string) => void;
}

// Update store implementation
export const useGameStore = create<GameStore>((set, get) => ({
  // ... existing code ...
  
  factionStandings: new Map(),
  currentFactionEvent: null,
  
  updateFactionStanding: (factionId, change) => {
    set((state) => {
      const newStandings = new Map(state.factionStandings);
      const current = newStandings.get(factionId) || 0;
      newStandings.set(factionId, Math.max(-100, Math.min(100, current + change)));
      return { factionStandings: newStandings };
    });
  },
  
  setFactionEvent: (event) => set({ currentFactionEvent: event }),
  
  applyFactionChoice: (eventId, choiceId) => {
    const effects = factionSystem.applyEventChoice(eventId, choiceId);
    if (effects) {
      // Apply resource changes
      if (effects.resourceChanges) {
        const state = get();
        if (effects.resourceChanges.money) {
          state.addMoney(effects.resourceChanges.money);
        }
        if (effects.resourceChanges.reputation) {
          state.addReputation(effects.resourceChanges.reputation);
        }
      }
    }
    set({ currentFactionEvent: null });
  }
}));
```

### Step 7: Integrate into UnifiedGameView

Update `/src/components/game/UnifiedGameView.tsx`:

```typescript
// Add imports
import { FactionDisplay } from './FactionDisplay';
import { FactionEventModal } from './FactionEventModal';
import { factionSystem } from '@game/mechanics/FactionSystem';

// Add to component
const { currentFactionEvent, setFactionEvent, applyFactionChoice } = useGameStore();

// Check for faction events after each turn
useEffect(() => {
  const events = factionSystem.getPendingEvents();
  if (events.length > 0 && !currentFactionEvent) {
    setFactionEvent(events[0]);
  }
}, [currentTurn]);

// Add to render
return (
  <div className="relative min-h-screen p-4 pb-20">
    {/* Add faction display */}
    <FactionDisplay />
    
    {/* ... existing game content ... */}
    
    {/* Faction event modal */}
    <FactionEventModal
      event={currentFactionEvent}
      onChoice={applyFactionChoice}
    />
  </div>
);
```

### Step 8: Update Band Generator

Update `/src/game/mechanics/BandGenerator.ts` to assign bands to factions:

```typescript
// In generateBand method
const band = {
  // ... existing band generation ...
};

// Assign to faction
const faction = factionSystem.assignBandToFaction(band);
if (faction) {
  band.traits.push({
    id: `faction-${faction}`,
    name: `${faction} Member`,
    description: `Aligned with ${faction} values`,
    type: TraitType.SOCIAL,
    modifier: {}
  });
}

return band;
```

### Step 9: Test Implementation

1. Start the game and book shows
2. Watch faction standings change based on band choices
3. Trigger faction events by supporting opposing factions
4. Test band relationships affecting show outcomes
5. Verify UI updates properly

### Step 10: Polish and Balance

1. Adjust faction standing changes for balance
2. Fine-tune drama event frequency
3. Add more faction event types
4. Create faction-specific rewards
5. Add faction tooltips and help text

## Next Steps

Once Phase 1 is complete and tested:
1. Document any balance changes needed
2. Gather feedback on faction system
3. Prepare for Phase 2: Infrastructure & Equipment
4. Consider faction-specific venues and equipment in Phase 2

## Success Metrics

- Players actively consider faction standings when booking
- Faction events create meaningful choices
- Band relationships affect player strategy
- Increased replayability through different faction paths
- Political depth without overwhelming complexity
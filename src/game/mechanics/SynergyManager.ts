/**
 * SynergyManager - THE authoritative synergy system for Phase A
 *
 * Rules (per PRD.md):
 * - BASE_MAX_SYNERGIES = 3 slots
 * - Slot modifiers can increase max
 * - HARD_CAP_EFFECTIVE_SYNERGIES = 5
 * - Acquiring when full forces replacement decision
 * - All effects visible and explainable
 */

import {
  BASE_MAX_SYNERGIES,
  HARD_CAP_EFFECTIVE_SYNERGIES,
} from '../constants/runConstants';

// ============= Types =============

export type SynergyTrigger = 'TURN_START' | 'TURN_END' | 'SHOW_START' | 'SHOW_END' | 'PASSIVE';

export type SynergyEffectType =
  | 'MONEY_FLAT'
  | 'MONEY_PERCENT'
  | 'REPUTATION_FLAT'
  | 'REPUTATION_PERCENT'
  | 'FANS_FLAT'
  | 'FANS_PERCENT'
  | 'STRESS_FLAT'
  | 'STRESS_PERCENT'
  | 'ATTENDANCE_PERCENT'
  | 'COST_REDUCTION_PERCENT'
  | 'INCIDENT_REDUCTION_PERCENT';

export interface SynergyEffect {
  type: SynergyEffectType;
  value: number;
  description: string;
}

export type SynergyRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export interface Synergy {
  id: string;
  name: string;
  description: string;
  rarity: SynergyRarity;
  trigger: SynergyTrigger;
  effects: SynergyEffect[];
  /** Optional condition for activation */
  condition?: SynergyCondition;
  /** Visual icon/emoji */
  icon: string;
}

export interface SynergyCondition {
  type: 'MIN_REPUTATION' | 'MIN_FANS' | 'MAX_STRESS' | 'VENUE_TYPE' | 'GENRE_MATCH' | 'TURN_RANGE';
  value: number | string | string[];
  description: string;
}

export interface EquippedSynergy {
  synergy: Synergy;
  slotIndex: number;
  timesTriggered: number;
  acquiredOnTurn: number;
}

export interface SlotModifier {
  id: string;
  name: string;
  slots: number; // +1 or -1
  source: string; // Where this modifier came from
}

export interface SynergyTriggerResult {
  synergyId: string;
  synergyName: string;
  triggered: boolean;
  effects: {
    type: SynergyEffectType;
    value: number;
    description: string;
  }[];
  conditionMet: boolean;
  conditionDescription?: string;
}

export interface SynergyState {
  equippedSynergies: EquippedSynergy[];
  slotModifiers: SlotModifier[];
  pendingSynergy: Synergy | null; // Synergy waiting for replacement decision
}

// ============= Starter Synergies (10-12 per PRD) =============

export const STARTER_SYNERGIES: Synergy[] = [
  // COMMON (6)
  {
    id: 'diy_hustle',
    name: 'DIY Hustle',
    description: 'Small money boost at turn start',
    rarity: 'COMMON',
    trigger: 'TURN_START',
    effects: [{ type: 'MONEY_FLAT', value: 10, description: '+$10 at turn start' }],
    icon: '🔧',
  },
  {
    id: 'word_of_mouth',
    name: 'Word of Mouth',
    description: 'Gain extra fans after shows',
    rarity: 'COMMON',
    trigger: 'SHOW_END',
    effects: [{ type: 'FANS_PERCENT', value: 10, description: '+10% fans from shows' }],
    icon: '📢',
  },
  {
    id: 'stress_relief',
    name: 'Stress Relief',
    description: 'Reduce stress at turn end',
    rarity: 'COMMON',
    trigger: 'TURN_END',
    effects: [{ type: 'STRESS_FLAT', value: -5, description: '-5 stress at turn end' }],
    icon: '😌',
  },
  {
    id: 'scene_cred',
    name: 'Scene Cred',
    description: 'Bonus reputation from shows',
    rarity: 'COMMON',
    trigger: 'SHOW_END',
    effects: [{ type: 'REPUTATION_PERCENT', value: 10, description: '+10% reputation from shows' }],
    icon: '🎸',
  },
  {
    id: 'budget_booker',
    name: 'Budget Booker',
    description: 'Reduce show costs',
    rarity: 'COMMON',
    trigger: 'PASSIVE',
    effects: [{ type: 'COST_REDUCTION_PERCENT', value: 10, description: '-10% show costs' }],
    icon: '💰',
  },
  {
    id: 'lucky_break',
    name: 'Lucky Break',
    description: 'Fewer incidents at shows',
    rarity: 'COMMON',
    trigger: 'PASSIVE',
    effects: [{ type: 'INCIDENT_REDUCTION_PERCENT', value: 15, description: '-15% incident chance' }],
    icon: '🍀',
  },

  // UNCOMMON (4)
  {
    id: 'basement_legend',
    name: 'Basement Legend',
    description: 'Big rep boost when stress is low',
    rarity: 'UNCOMMON',
    trigger: 'SHOW_END',
    effects: [{ type: 'REPUTATION_PERCENT', value: 25, description: '+25% reputation when stress < 30' }],
    condition: { type: 'MAX_STRESS', value: 30, description: 'Stress must be below 30' },
    icon: '🏠',
  },
  {
    id: 'crowd_surfer',
    name: 'Crowd Surfer',
    description: 'More attendance at packed shows',
    rarity: 'UNCOMMON',
    trigger: 'SHOW_START',
    effects: [{ type: 'ATTENDANCE_PERCENT', value: 15, description: '+15% attendance' }],
    icon: '🏄',
  },
  {
    id: 'merch_master',
    name: 'Merch Master',
    description: 'Extra money from shows',
    rarity: 'UNCOMMON',
    trigger: 'SHOW_END',
    effects: [{ type: 'MONEY_PERCENT', value: 20, description: '+20% money from shows' }],
    icon: '👕',
  },
  {
    id: 'scene_politics',
    name: 'Scene Politics',
    description: 'Rep bonus when you have fans',
    rarity: 'UNCOMMON',
    trigger: 'TURN_END',
    effects: [{ type: 'REPUTATION_FLAT', value: 3, description: '+3 reputation when fans > 100' }],
    condition: { type: 'MIN_FANS', value: 100, description: 'Must have at least 100 fans' },
    icon: '🎭',
  },

  // RARE (2)
  {
    id: 'underground_network',
    name: 'Underground Network',
    description: 'Passive income and fan growth',
    rarity: 'RARE',
    trigger: 'TURN_START',
    effects: [
      { type: 'MONEY_FLAT', value: 25, description: '+$25 at turn start' },
      { type: 'FANS_FLAT', value: 5, description: '+5 fans at turn start' },
    ],
    icon: '🕸️',
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Major stress reduction, slight rep penalty',
    rarity: 'RARE',
    trigger: 'TURN_END',
    effects: [
      { type: 'STRESS_FLAT', value: -15, description: '-15 stress at turn end' },
      { type: 'REPUTATION_FLAT', value: -2, description: '-2 reputation at turn end' },
    ],
    icon: '🛡️',
  },
];

// ============= SynergyManager Class =============

class SynergyManager {
  private state: SynergyState = {
    equippedSynergies: [],
    slotModifiers: [],
    pendingSynergy: null,
  };

  // Get current max slots (base + modifiers, capped)
  getMaxSlots(): number {
    const modifierTotal = this.state.slotModifiers.reduce((sum, mod) => sum + mod.slots, 0);
    const effective = BASE_MAX_SYNERGIES + modifierTotal;
    return Math.min(Math.max(effective, 1), HARD_CAP_EFFECTIVE_SYNERGIES);
  }

  // Get current equipped synergies
  getEquippedSynergies(): EquippedSynergy[] {
    return [...this.state.equippedSynergies];
  }

  // Get available slots
  getAvailableSlots(): number {
    return this.getMaxSlots() - this.state.equippedSynergies.length;
  }

  // Check if slots are full
  isFull(): boolean {
    return this.state.equippedSynergies.length >= this.getMaxSlots();
  }

  // Get pending synergy (waiting for replacement decision)
  getPendingSynergy(): Synergy | null {
    return this.state.pendingSynergy;
  }

  // Acquire a new synergy (may trigger replacement flow)
  acquireSynergy(synergy: Synergy, currentTurn: number): { success: boolean; requiresReplacement: boolean } {
    // Check if already equipped
    if (this.state.equippedSynergies.some(eq => eq.synergy.id === synergy.id)) {
      return { success: false, requiresReplacement: false };
    }

    if (this.isFull()) {
      // Store as pending, UI must handle replacement
      this.state.pendingSynergy = synergy;
      return { success: false, requiresReplacement: true };
    }

    // Find first available slot
    const usedSlots = new Set(this.state.equippedSynergies.map(eq => eq.slotIndex));
    let slotIndex = 0;
    while (usedSlots.has(slotIndex) && slotIndex < this.getMaxSlots()) {
      slotIndex++;
    }

    this.state.equippedSynergies.push({
      synergy,
      slotIndex,
      timesTriggered: 0,
      acquiredOnTurn: currentTurn,
    });

    return { success: true, requiresReplacement: false };
  }

  // Replace a synergy (used when slots are full)
  replaceSynergy(replaceSlotIndex: number, currentTurn: number): boolean {
    if (!this.state.pendingSynergy) {
      return false;
    }

    const existingIndex = this.state.equippedSynergies.findIndex(eq => eq.slotIndex === replaceSlotIndex);
    if (existingIndex === -1) {
      return false;
    }

    // Remove old synergy
    this.state.equippedSynergies.splice(existingIndex, 1);

    // Add new synergy
    this.state.equippedSynergies.push({
      synergy: this.state.pendingSynergy,
      slotIndex: replaceSlotIndex,
      timesTriggered: 0,
      acquiredOnTurn: currentTurn,
    });

    this.state.pendingSynergy = null;
    return true;
  }

  // Cancel pending synergy acquisition
  cancelPendingSynergy(): void {
    this.state.pendingSynergy = null;
  }

  // Remove a synergy from a slot
  removeSynergy(slotIndex: number): boolean {
    const index = this.state.equippedSynergies.findIndex(eq => eq.slotIndex === slotIndex);
    if (index === -1) return false;
    this.state.equippedSynergies.splice(index, 1);
    return true;
  }

  // Add a slot modifier
  addSlotModifier(modifier: SlotModifier): void {
    this.state.slotModifiers.push(modifier);
  }

  // Remove a slot modifier
  removeSlotModifier(modifierId: string): void {
    const index = this.state.slotModifiers.findIndex(m => m.id === modifierId);
    if (index !== -1) {
      this.state.slotModifiers.splice(index, 1);
    }

    // If we now have more synergies than slots, we need to handle overflow
    // For now, the oldest synergies stay - UI should warn player
  }

  // Trigger synergies for a specific trigger point
  triggerSynergies(
    trigger: SynergyTrigger,
    context: {
      currentTurn: number;
      money: number;
      reputation: number;
      fans: number;
      stress: number;
      venueType?: string;
      bandGenre?: string;
    }
  ): SynergyTriggerResult[] {
    const results: SynergyTriggerResult[] = [];

    for (const equipped of this.state.equippedSynergies) {
      const { synergy } = equipped;

      // Check if this synergy triggers now
      if (synergy.trigger !== trigger && synergy.trigger !== 'PASSIVE') {
        continue;
      }

      // For passive synergies, only include in results if specifically requested
      if (synergy.trigger === 'PASSIVE' && trigger !== 'PASSIVE') {
        continue;
      }

      // Check condition
      let conditionMet = true;
      let conditionDescription: string | undefined;

      if (synergy.condition) {
        conditionDescription = synergy.condition.description;

        switch (synergy.condition.type) {
          case 'MIN_REPUTATION':
            conditionMet = context.reputation >= (synergy.condition.value as number);
            break;
          case 'MIN_FANS':
            conditionMet = context.fans >= (synergy.condition.value as number);
            break;
          case 'MAX_STRESS':
            conditionMet = context.stress < (synergy.condition.value as number);
            break;
          case 'VENUE_TYPE':
            conditionMet = context.venueType === synergy.condition.value;
            break;
          case 'GENRE_MATCH':
            conditionMet = (synergy.condition.value as string[]).includes(context.bandGenre || '');
            break;
          case 'TURN_RANGE': {
            // Value is "start-end" string
            const [start, end] = (synergy.condition.value as string).split('-').map(Number);
            conditionMet = context.currentTurn >= start && context.currentTurn <= end;
            break;
          }
        }
      }

      if (conditionMet) {
        equipped.timesTriggered++;
      }

      results.push({
        synergyId: synergy.id,
        synergyName: synergy.name,
        triggered: conditionMet,
        effects: conditionMet ? synergy.effects : [],
        conditionMet,
        conditionDescription,
      });
    }

    return results;
  }

  // Get passive effects (always active)
  getPassiveEffects(): SynergyEffect[] {
    const effects: SynergyEffect[] = [];

    for (const equipped of this.state.equippedSynergies) {
      if (equipped.synergy.trigger === 'PASSIVE') {
        effects.push(...equipped.synergy.effects);
      }
    }

    return effects;
  }

  // Sum the value of a given effect type across the TRIGGERED results passed in.
  // NOTE: passive effects are deliberately NOT rolled up here — this is called
  // once per phase AND multiple times per show, so re-adding passives each call
  // multiplied them in repeatedly. Passive effects (incident/cost reduction) are
  // read at their single point of use via getPassiveEffects() instead.
  calculateEffectTotal(effectType: SynergyEffectType, triggerResults: SynergyTriggerResult[]): number {
    let total = 0;

    for (const result of triggerResults) {
      if (result.triggered) {
        for (const effect of result.effects) {
          if (effect.type === effectType) {
            total += effect.value;
          }
        }
      }
    }

    return total;
  }

  // Reset state (for new run)
  reset(): void {
    this.state = {
      equippedSynergies: [],
      slotModifiers: [],
      pendingSynergy: null,
    };
  }

  // Serialize state for save/load (used by durable resume)
  serialize(): SynergyState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Deserialize state
  deserialize(state: SynergyState): void {
    this.state = state;
  }

  // Get a random synergy from the starter pool (excluding already equipped)
  getRandomAvailableSynergy(): Synergy | null {
    const equippedIds = new Set(this.state.equippedSynergies.map(eq => eq.synergy.id));
    const available = STARTER_SYNERGIES.filter(s => !equippedIds.has(s.id));

    if (available.length === 0) return null;

    // Weight by rarity (common more likely)
    const weights: Record<SynergyRarity, number> = {
      'COMMON': 50,
      'UNCOMMON': 30,
      'RARE': 15,
      'LEGENDARY': 5,
    };

    const weighted: Synergy[] = [];
    for (const synergy of available) {
      const weight = weights[synergy.rarity];
      for (let i = 0; i < weight; i++) {
        weighted.push(synergy);
      }
    }

    return weighted[Math.floor(Math.random() * weighted.length)];
  }
}

// Export singleton instance
export const synergyManager = new SynergyManager();

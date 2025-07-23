import { SynergyCombo, SynergyEffect } from './SynergyDiscoverySystem';
import { Band, Venue, Equipment } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';
import { synergyMasterySystem } from './SynergyMasterySystem';

export interface ChainLink {
  synergy: SynergyCombo;
  triggeredBy: string | null; // ID of the synergy that triggered this one
  multiplier: number; // Effect multiplier based on chain position
  depth: number; // How deep in the chain this synergy is
}

export interface ChainReaction {
  id: string;
  links: ChainLink[];
  totalMultiplier: number;
  interrupted: boolean;
  interruptedBy?: string; // What caused the interruption
  timestamp: number;
}

export interface ChainTrigger {
  fromSynergyId: string;
  toSynergyId: string;
  conditions: ChainCondition[];
  multiplierBonus: number; // Additional multiplier when this chain occurs
}

export interface ChainCondition {
  type: 'effect_threshold' | 'synergy_count' | 'specific_combo' | 'no_conflict';
  value: any;
}

export interface ChainConflict {
  synergyId: string;
  conflictsWith: string[];
  reason: string;
}

class SynergyChainSystem {
  private chainTriggers: Map<string, ChainTrigger[]> = new Map();
  private chainConflicts: Map<string, ChainConflict> = new Map();
  private activeChains: ChainReaction[] = [];
  private maxChainDepth = 5; // Prevent infinite loops
  
  constructor() {
    this.initializeChainTriggers();
    this.initializeChainConflicts();
  }
  
  private initializeChainTriggers() {
    // Genre progression chains
    this.addChainTrigger({
      fromSynergyId: 'punk_unity',
      toSynergyId: 'scene_explosion',
      conditions: [
        { type: 'effect_threshold', value: { effect: 'authenticity', threshold: 50 } }
      ],
      multiplierBonus: 0.5
    });
    
    // Mastery-enabled chains
    this.addChainTrigger({
      fromSynergyId: 'punk_unity',
      toSynergyId: 'punk_revolution',
      conditions: [
        { type: 'specific_combo', value: 'mastery_level_3' }
      ],
      multiplierBonus: 1.0
    });
    
    this.addChainTrigger({
      fromSynergyId: 'scene_explosion',
      toSynergyId: 'underground_legend',
      conditions: [
        { type: 'synergy_count', value: 3 }
      ],
      multiplierBonus: 1.0
    });
    
    // Energy cascade chains
    this.addChainTrigger({
      fromSynergyId: 'high_energy',
      toSynergyId: 'mosh_pit_madness',
      conditions: [
        { type: 'effect_threshold', value: { effect: 'energy', threshold: 80 } }
      ],
      multiplierBonus: 0.3
    });
    
    this.addChainTrigger({
      fromSynergyId: 'mosh_pit_madness',
      toSynergyId: 'crowd_singalong',
      conditions: [
        { type: 'effect_threshold', value: { effect: 'attendance', threshold: 100 } }
      ],
      multiplierBonus: 0.5
    });
    
    // Technical skill chains
    this.addChainTrigger({
      fromSynergyId: 'technical_masters',
      toSynergyId: 'virtuoso_showcase',
      conditions: [
        { type: 'effect_threshold', value: { effect: 'technical_skill', threshold: 90 } }
      ],
      multiplierBonus: 0.4
    });
    
    // Venue-based chains
    this.addChainTrigger({
      fromSynergyId: 'basement_intimacy',
      toSynergyId: 'diy_ethos',
      conditions: [
        { type: 'no_conflict', value: 'commercial_venue' }
      ],
      multiplierBonus: 0.3
    });
    
    this.addChainTrigger({
      fromSynergyId: 'diy_ethos',
      toSynergyId: 'scene_builder',
      conditions: [
        { type: 'effect_threshold', value: { effect: 'authenticity', threshold: 70 } }
      ],
      multiplierBonus: 0.6
    });
    
    // Equipment chains
    this.addChainTrigger({
      fromSynergyId: 'wall_of_sound',
      toSynergyId: 'sonic_assault',
      conditions: [
        { type: 'specific_combo', value: 'heavy_distortion' }
      ],
      multiplierBonus: 0.8
    });
    
    // Multi-band chains
    this.addChainTrigger({
      fromSynergyId: 'perfect_bill',
      toSynergyId: 'legendary_show',
      conditions: [
        { type: 'synergy_count', value: 4 },
        { type: 'no_conflict', value: 'band_drama' }
      ],
      multiplierBonus: 1.5
    });
    
    // Achievement-based chains
    this.addChainTrigger({
      fromSynergyId: 'scene_veteran_bonus',
      toSynergyId: 'master_promoter',
      conditions: [
        { type: 'effect_threshold', value: { effect: 'reputation', threshold: 20 } }
      ],
      multiplierBonus: 0.4
    });
    
    // Genre fusion chains
    this.addChainTrigger({
      fromSynergyId: 'crossover_appeal',
      toSynergyId: 'genre_transcendence',
      conditions: [
        { type: 'specific_combo', value: 'genre_fusion' }
      ],
      multiplierBonus: 0.7
    });
    
    // Legendary chains (rare but powerful)
    this.addChainTrigger({
      fromSynergyId: 'legendary_show',
      toSynergyId: 'scene_defining_moment',
      conditions: [
        { type: 'synergy_count', value: 5 },
        { type: 'effect_threshold', value: { effect: 'attendance', threshold: 200 } }
      ],
      multiplierBonus: 2.0
    });
  }
  
  private initializeChainConflicts() {
    // Conflicting synergies that break chains
    this.chainConflicts.set('commercial_sellout', {
      synergyId: 'commercial_sellout',
      conflictsWith: ['diy_ethos', 'basement_intimacy', 'underground_legend'],
      reason: 'Commercial approach breaks DIY chain'
    });
    
    this.chainConflicts.set('band_drama', {
      synergyId: 'band_drama',
      conflictsWith: ['perfect_bill', 'scene_unity', 'legendary_show'],
      reason: 'Band conflicts disrupt harmony chains'
    });
    
    this.chainConflicts.set('technical_failure', {
      synergyId: 'technical_failure',
      conflictsWith: ['wall_of_sound', 'sonic_assault', 'virtuoso_showcase'],
      reason: 'Equipment problems break technical chains'
    });
    
    this.chainConflicts.set('venue_shutdown', {
      synergyId: 'venue_shutdown',
      conflictsWith: ['scene_explosion', 'underground_legend'],
      reason: 'Venue issues interrupt scene growth'
    });
  }
  
  private addChainTrigger(trigger: ChainTrigger) {
    const triggers = this.chainTriggers.get(trigger.fromSynergyId) || [];
    triggers.push(trigger);
    this.chainTriggers.set(trigger.fromSynergyId, triggers);
  }
  
  // Check for chain reactions when synergies are activated
  checkForChainReactions(
    activeSynergies: SynergyCombo[],
    context: {
      bands: Band[];
      venue: Venue;
      equipment: Equipment[];
      currentEffects: Map<string, number>;
    }
  ): ChainReaction[] {
    const chains: ChainReaction[] = [];
    const processedSynergies = new Set<string>();
    
    // Start chains from each active synergy
    for (const synergy of activeSynergies) {
      if (!processedSynergies.has(synergy.id)) {
        const chain = this.buildChain(synergy, activeSynergies, context, processedSynergies);
        if (chain.links.length > 1) {
          chains.push(chain);
        }
      }
    }
    
    // Store active chains for reference
    this.activeChains = chains;
    
    return chains;
  }
  
  private buildChain(
    startSynergy: SynergyCombo,
    allSynergies: SynergyCombo[],
    context: any,
    processedSynergies: Set<string>,
    depth = 0
  ): ChainReaction {
    const chain: ChainReaction = {
      id: `chain-${Date.now()}-${Math.random()}`,
      links: [{
        synergy: startSynergy,
        triggeredBy: null,
        multiplier: 1.0,
        depth: 0
      }],
      totalMultiplier: 1.0,
      interrupted: false,
      timestamp: Date.now()
    };
    
    processedSynergies.add(startSynergy.id);
    
    // Check if this synergy is interrupted by conflicts
    const conflicts = this.checkForConflicts(startSynergy.id, allSynergies);
    if (conflicts.length > 0) {
      chain.interrupted = true;
      chain.interruptedBy = conflicts[0].reason;
      return chain;
    }
    
    // Recursively build the chain
    this.expandChain(chain, startSynergy, allSynergies, context, processedSynergies, depth);
    
    // Calculate total multiplier
    chain.totalMultiplier = chain.links.reduce((total, link) => total * link.multiplier, 1.0);
    
    return chain;
  }
  
  private expandChain(
    chain: ChainReaction,
    currentSynergy: SynergyCombo,
    allSynergies: SynergyCombo[],
    context: any,
    processedSynergies: Set<string>,
    depth: number
  ) {
    if (depth >= this.maxChainDepth) return;
    
    const triggers = this.chainTriggers.get(currentSynergy.id) || [];
    
    // Check for mastery-enabled chains
    const masteredVersion = synergyMasterySystem.getMasteredSynergy(currentSynergy);
    if (masteredVersion && masteredVersion.unlocksChains) {
      // Add mastery-unlocked chain triggers dynamically
      for (const unlockedChain of masteredVersion.unlocksChains) {
        triggers.push({
          fromSynergyId: currentSynergy.id,
          toSynergyId: unlockedChain,
          conditions: [],
          multiplierBonus: 0.5 + (masteredVersion.masteryLevel * 0.1)
        });
      }
    }
    
    for (const trigger of triggers) {
      // Check if the target synergy is active
      const targetSynergy = allSynergies.find(s => s.id === trigger.toSynergyId);
      if (!targetSynergy || processedSynergies.has(targetSynergy.id)) continue;
      
      // Check if conditions are met
      if (this.checkChainConditions(trigger.conditions, chain, context, currentSynergy)) {
        // Add to chain
        const link: ChainLink = {
          synergy: targetSynergy,
          triggeredBy: currentSynergy.id,
          multiplier: 1.0 + trigger.multiplierBonus + (depth * 0.1), // Bonus for chain depth
          depth: depth + 1
        };
        
        chain.links.push(link);
        processedSynergies.add(targetSynergy.id);
        
        // Check for conflicts at this link
        const conflicts = this.checkForConflicts(targetSynergy.id, allSynergies);
        if (conflicts.length > 0) {
          chain.interrupted = true;
          chain.interruptedBy = conflicts[0].reason;
          return;
        }
        
        // Continue the chain
        this.expandChain(chain, targetSynergy, allSynergies, context, processedSynergies, depth + 1);
      }
    }
  }
  
  private checkChainConditions(
    conditions: ChainCondition[],
    chain: ChainReaction,
    context: any,
    currentSynergy?: SynergyCombo
  ): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'effect_threshold':
          const effectValue = context.currentEffects.get(condition.value.effect) || 0;
          if (effectValue < condition.value.threshold) return false;
          break;
          
        case 'synergy_count':
          if (chain.links.length < condition.value) return false;
          break;
          
        case 'specific_combo':
          const hasCombo = chain.links.some(link => 
            link.synergy.id === condition.value || 
            link.synergy.name.toLowerCase().includes(condition.value)
          );
          if (!hasCombo) return false;
          break;
          
        case 'no_conflict':
          const hasConflict = this.chainConflicts.has(condition.value);
          if (hasConflict) return false;
          break;
      }
    }
    
    return true;
  }
  
  private checkForConflicts(synergyId: string, allSynergies: SynergyCombo[]): ChainConflict[] {
    const conflicts: ChainConflict[] = [];
    const activeSynergyIds = new Set(allSynergies.map(s => s.id));
    
    for (const [conflictId, conflict] of this.chainConflicts) {
      if (activeSynergyIds.has(conflictId) && conflict.conflictsWith.includes(synergyId)) {
        conflicts.push(conflict);
      }
    }
    
    return conflicts;
  }
  
  // Apply chain multipliers to effects
  applyChainMultipliers(
    baseEffects: Map<string, number>,
    chains: ChainReaction[]
  ): Map<string, number> {
    const multipliedEffects = new Map(baseEffects);
    
    for (const chain of chains) {
      if (chain.interrupted) continue;
      
      // Apply exponential multipliers for each link in the chain
      for (const link of chain.links) {
        for (const effect of link.synergy.effects) {
          const currentValue = multipliedEffects.get(effect.type) || 0;
          const chainBonus = effect.value * (link.multiplier - 1);
          multipliedEffects.set(effect.type, currentValue + chainBonus);
        }
      }
    }
    
    return multipliedEffects;
  }
  
  // Get chain description for UI
  getChainDescription(chain: ChainReaction): string {
    const linkNames = chain.links.map(link => link.synergy.name).join(' → ');
    const multiplier = chain.totalMultiplier.toFixed(1);
    
    if (chain.interrupted) {
      return `${linkNames} (×${multiplier} - INTERRUPTED: ${chain.interruptedBy})`;
    }
    
    return `${linkNames} (×${multiplier} MULTIPLIER!)`;
  }
  
  // Check if a specific chain combo has been discovered
  hasDiscoveredChain(chainPattern: string[]): boolean {
    return this.activeChains.some(chain => {
      const chainIds = chain.links.map(link => link.synergy.id);
      return chainPattern.every(id => chainIds.includes(id));
    });
  }
  
  // Get potential chains that could be triggered
  getPotentialChains(activeSynergies: SynergyCombo[]): string[] {
    const potential: string[] = [];
    
    for (const synergy of activeSynergies) {
      const triggers = this.chainTriggers.get(synergy.id) || [];
      for (const trigger of triggers) {
        potential.push(`${synergy.name} → ${trigger.toSynergyId}`);
      }
    }
    
    return potential;
  }
}

export const synergyChainSystem = new SynergyChainSystem();
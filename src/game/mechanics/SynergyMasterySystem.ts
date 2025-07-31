import { SynergyCombo, SynergyEffect } from './SynergyDiscoverySystem';
import { Achievement } from '@game/types';
import { metaProgressionManager } from './MetaProgressionManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';
import { safeStorage } from '@utils/safeStorage';

export interface SynergyMastery {
  synergyId: string;
  usageCount: number;
  masteryLevel: number; // 0-5
  masteryProgress: number; // 0-100% towards next level
  unlockedEnhancements: string[];
  totalScore: number; // Cumulative score generated with this synergy
  lastUsed: number; // Timestamp
}

export interface MasteryEnhancement {
  id: string;
  synergyId: string;
  requiredLevel: number;
  type: 'effect_boost' | 'new_effect' | 'chain_enable' | 'transform_enable';
  enhancement: {
    multiplier?: number;
    bonus?: number;
    newEffect?: SynergyEffect;
    enableChaining?: boolean;
    transformTo?: string;
  };
  description: string;
}

export interface MasteredSynergy extends SynergyCombo {
  masteryLevel: number;
  enhancedEffects: SynergyEffect[];
  unlocksChains?: string[]; // IDs of chains this mastered synergy can trigger
}

class SynergyMasterySystem {
  private masteryData: Map<string, SynergyMastery> = new Map();
  private enhancements: Map<string, MasteryEnhancement[]> = new Map();
  private masteryThresholds = [0, 5, 15, 30, 50, 100]; // Uses needed per level
  
  constructor() {
    this.loadMasteryData();
    this.initializeEnhancements();
  }
  
  private loadMasteryData() {
    const saved = safeStorage.getItem('synergy-mastery');
    if (saved) {
      const data = JSON.parse(saved);
      this.masteryData = new Map(Object.entries(data));
    }
  }
  
  private saveMasteryData() {
    const data = Object.fromEntries(this.masteryData);
    safeStorage.setItem('synergy-mastery', JSON.stringify(data));
  }
  
  private initializeEnhancements() {
    // Punk Unity mastery enhancements
    this.addEnhancements('punk_unity', [
      {
        id: 'punk_unity_boost_1',
        synergyId: 'punk_unity',
        requiredLevel: 1,
        type: 'effect_boost',
        enhancement: { effect: 'authenticity', multiplier: 1.5 },
        description: 'Authenticity bonus increased by 50%'
      },
      {
        id: 'punk_unity_chain_1',
        synergyId: 'punk_unity',
        requiredLevel: 3,
        type: 'chain_enable',
        enhancement: { enablesChain: 'punk_revolution' },
        description: 'Can trigger Punk Revolution chain'
      },
      {
        id: 'punk_unity_master',
        synergyId: 'punk_unity',
        requiredLevel: 5,
        type: 'new_effect',
        enhancement: { type: 'unlock_legendary_punk_bands', value: 1 },
        description: 'Unlocks legendary punk bands'
      }
    ]);
    
    // Metal Brotherhood mastery
    this.addEnhancements('metal_brotherhood', [
      {
        id: 'metal_boost_1',
        synergyId: 'metal_brotherhood',
        requiredLevel: 1,
        type: 'effect_boost',
        enhancement: { effect: 'technical_skill', multiplier: 1.5 },
        description: 'Technical skill bonus increased by 50%'
      },
      {
        id: 'metal_new_effect',
        synergyId: 'metal_brotherhood',
        requiredLevel: 2,
        type: 'new_effect',
        enhancement: { type: 'intimidation', value: 20 },
        description: 'Adds intimidation effect'
      },
      {
        id: 'metal_master_chain',
        synergyId: 'metal_brotherhood',
        requiredLevel: 4,
        type: 'chain_enable',
        enhancement: { enablesChain: 'metal_apocalypse' },
        description: 'Can trigger Metal Apocalypse chain'
      }
    ]);
    
    // Perfect Bill mastery
    this.addEnhancements('perfect_bill', [
      {
        id: 'bill_boost_1',
        synergyId: 'perfect_bill',
        requiredLevel: 1,
        type: 'effect_boost',
        enhancement: { effect: 'bill_chemistry', multiplier: 2.0 },
        description: 'Bill chemistry doubled'
      },
      {
        id: 'bill_drama_immune',
        synergyId: 'perfect_bill',
        requiredLevel: 3,
        type: 'new_effect',
        enhancement: { type: 'drama_immunity', value: 100 },
        description: 'Immune to band drama'
      },
      {
        id: 'bill_legendary_chain',
        synergyId: 'perfect_bill',
        requiredLevel: 5,
        type: 'chain_enable',
        enhancement: { enablesChain: 'perfect_harmony' },
        description: 'Enables Perfect Harmony mega-chain'
      }
    ]);
    
    // Venue mastery enhancements
    this.addEnhancements('basement_intimacy', [
      {
        id: 'basement_boost',
        synergyId: 'basement_intimacy',
        requiredLevel: 1,
        type: 'effect_boost',
        enhancement: { effect: 'fan_loyalty', multiplier: 1.5 },
        description: 'Fan loyalty increased by 50%'
      },
      {
        id: 'basement_transform',
        synergyId: 'basement_intimacy',
        requiredLevel: 4,
        type: 'transform_enable',
        enhancement: { transformTo: 'legendary_basement' },
        description: 'Can transform venue to Legendary Basement'
      }
    ]);
    
    // Equipment mastery
    this.addEnhancements('wall_of_sound', [
      {
        id: 'wall_boost',
        synergyId: 'wall_of_sound',
        requiredLevel: 2,
        type: 'effect_boost',
        enhancement: { effect: 'attendance', multiplier: 1.75 },
        description: 'Attendance boost increased by 75%'
      },
      {
        id: 'wall_chain',
        synergyId: 'wall_of_sound',
        requiredLevel: 3,
        type: 'chain_enable',
        enhancement: { enablesChain: 'sonic_transcendence' },
        description: 'Enables Sonic Transcendence chain'
      }
    ]);
    
    // Cross-genre mastery
    this.addEnhancements('crossover_appeal', [
      {
        id: 'crossover_boost',
        synergyId: 'crossover_appeal',
        requiredLevel: 1,
        type: 'effect_boost',
        enhancement: { effect: 'genre_fusion_chance', multiplier: 2.0 },
        description: 'Genre fusion chance doubled'
      },
      {
        id: 'crossover_master',
        synergyId: 'crossover_appeal',
        requiredLevel: 5,
        type: 'new_effect',
        enhancement: { type: 'create_fusion_genre', value: 1 },
        description: 'Can create new fusion genres'
      }
    ]);
  }
  
  private addEnhancements(synergyId: string, enhancements: MasteryEnhancement[]) {
    this.enhancements.set(synergyId, enhancements);
  }
  
  // Record synergy usage
  recordSynergyUse(synergyId: string, scoreGenerated: number) {
    let mastery = this.masteryData.get(synergyId);
    
    if (!mastery) {
      mastery = {
        synergyId,
        usageCount: 0,
        masteryLevel: 0,
        masteryProgress: 0,
        unlockedEnhancements: [],
        totalScore: 0,
        lastUsed: Date.now()
      };
    }
    
    mastery.usageCount++;
    mastery.totalScore += scoreGenerated;
    mastery.lastUsed = Date.now();
    
    // Check for level up
    const oldLevel = mastery.masteryLevel;
    const newLevel = this.calculateMasteryLevel(mastery.usageCount);
    
    if (newLevel > oldLevel) {
      mastery.masteryLevel = newLevel;
      mastery.masteryProgress = 0;
      
      // Unlock new enhancements
      const synergyEnhancements = this.enhancements.get(synergyId) || [];
      const newEnhancements = synergyEnhancements.filter(e => 
        e.requiredLevel === newLevel && !mastery.unlockedEnhancements.includes(e.id)
      );
      
      newEnhancements.forEach(enhancement => {
        mastery.unlockedEnhancements.push(enhancement.id);
        this.onEnhancementUnlocked(enhancement);
      });
      
      // Trigger achievement for mastery milestones
      if (newLevel === 5) {
        metaProgressionManager.unlockAchievement(`master_${synergyId}`);
      }
      
      haptics.heavy();
      audio.play('achievement');
    } else {
      // Update progress
      const currentThreshold = this.masteryThresholds[mastery.masteryLevel];
      const nextThreshold = this.masteryThresholds[mastery.masteryLevel + 1] || 100;
      const progress = ((mastery.usageCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      mastery.masteryProgress = Math.min(progress, 100);
    }
    
    this.masteryData.set(synergyId, mastery);
    this.saveMasteryData();
  }
  
  private calculateMasteryLevel(usageCount: number): number {
    for (let i = this.masteryThresholds.length - 1; i >= 0; i--) {
      if (usageCount >= this.masteryThresholds[i]) {
        return i;
      }
    }
    return 0;
  }
  
  private onEnhancementUnlocked(enhancement: MasteryEnhancement) {
    devLog.log(`Unlocked enhancement: ${enhancement.description}`);
    
    // Special handling for chain enables
    if (enhancement.type === 'chain_enable') {
      // This will be picked up by the chain system
      devLog.log(`New chain available: ${enhancement.enhancement.enablesChain}`);
    }
  }
  
  // Get mastered version of a synergy
  getMasteredSynergy(baseSynergy: SynergyCombo): MasteredSynergy | null {
    const mastery = this.masteryData.get(baseSynergy.id);
    if (!mastery || mastery.masteryLevel === 0) return null;
    
    const enhancedEffects = [...baseSynergy.effects];
    const unlocksChains: string[] = [];
    
    // Apply all unlocked enhancements
    const synergyEnhancements = this.enhancements.get(baseSynergy.id) || [];
    for (const enhancement of synergyEnhancements) {
      if (!mastery.unlockedEnhancements.includes(enhancement.id)) continue;
      
      switch (enhancement.type) {
        case 'effect_boost': {
          // Boost existing effects
          const targetEffect = enhancedEffects.find(e => e.type === enhancement.enhancement.effect);
          if (targetEffect) {
            targetEffect.value *= enhancement.enhancement.multiplier;
          }
          break;
        }
          
        case 'new_effect':
          // Add new effect
          enhancedEffects.push({
            type: enhancement.enhancement.type,
            value: enhancement.enhancement.value,
            isPercentage: false
          });
          break;
          
        case 'chain_enable':
          // Enable new chain
          unlocksChains.push(enhancement.enhancement.enablesChain);
          break;
      }
    }
    
    return {
      ...baseSynergy,
      masteryLevel: mastery.masteryLevel,
      enhancedEffects,
      unlocksChains: unlocksChains.length > 0 ? unlocksChains : undefined
    };
  }
  
  // Get mastery data for a synergy
  getSynergyMastery(synergyId: string): SynergyMastery | null {
    return this.masteryData.get(synergyId) || null;
  }
  
  // Get all mastery data for UI
  getAllMasteryData(): SynergyMastery[] {
    return Array.from(this.masteryData.values());
  }
  
  // Check if synergy has reached specific mastery level
  hasMasteryLevel(synergyId: string, level: number): boolean {
    const mastery = this.masteryData.get(synergyId);
    return mastery ? mastery.masteryLevel >= level : false;
  }
  
  // Get next unlock for a synergy
  getNextUnlock(synergyId: string): MasteryEnhancement | null {
    const mastery = this.masteryData.get(synergyId);
    if (!mastery) return null;
    
    const enhancements = this.enhancements.get(synergyId) || [];
    return enhancements.find(e => 
      e.requiredLevel > mastery.masteryLevel
    ) || null;
  }
  
  // Get mastery achievements
  getMasteryAchievements(): Achievement[] {
    const achievements: Achievement[] = [];
    
    // Total mastery points achievement
    const totalMasteryLevels = Array.from(this.masteryData.values())
      .reduce((sum, m) => sum + m.masteryLevel, 0);
    
    if (totalMasteryLevels >= 10) {
      achievements.push({
        id: 'mastery_apprentice',
        name: 'Synergy Apprentice',
        description: 'Reach 10 total mastery levels',
        progress: 100,
        unlockedAt: Date.now()
      });
    }
    
    if (totalMasteryLevels >= 25) {
      achievements.push({
        id: 'mastery_expert',
        name: 'Synergy Expert',
        description: 'Reach 25 total mastery levels',
        progress: 100,
        unlockedAt: Date.now()
      });
    }
    
    if (totalMasteryLevels >= 50) {
      achievements.push({
        id: 'mastery_master',
        name: 'Synergy Master',
        description: 'Reach 50 total mastery levels',
        progress: 100,
        unlockedAt: Date.now()
      });
    }
    
    // Specific synergy mastery achievements
    for (const [synergyId, mastery] of this.masteryData) {
      if (mastery.masteryLevel === 5) {
        achievements.push({
          id: `master_${synergyId}`,
          name: `Master of ${synergyId}`,
          description: `Fully master the ${synergyId} synergy`,
          progress: 100,
          unlockedAt: Date.now()
        });
      }
    }
    
    return achievements;
  }
  
  // Reset mastery (for testing or new game+)
  resetMastery() {
    this.masteryData.clear();
    this.saveMasteryData();
  }
}

export const synergyMasterySystem = new SynergyMasterySystem();
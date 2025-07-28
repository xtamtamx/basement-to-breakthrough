import { Band, Venue, Achievement } from '@game/types';
import { SynergyCombo, SynergyEffect } from './SynergyDiscoverySystem';
import { metaProgressionManager } from './MetaProgressionManager';
import { SATIRICAL_ACHIEVEMENTS, SATIRICAL_SYNERGIES } from '@game/data/satiricalText';

export interface AchievementSynergy extends SynergyCombo {
  requiredAchievement: string;
  unlockProgress?: number; // Progress towards unlocking (0-100)
}

class AchievementSynergySystem {
  private achievementSynergies: Map<string, AchievementSynergy> = new Map();
  
  constructor() {
    this.initializeAchievementSynergies();
  }
  
  private initializeAchievementSynergies() {
    // Scene Veteran synergies (unlocked by playing many shows)
    this.achievementSynergies.set('scene_veteran_bonus', {
      id: 'scene_veteran_bonus',
      name: SATIRICAL_SYNERGIES.SCENE_UNITY.name,
      description: SATIRICAL_SYNERGIES.SCENE_UNITY.description,
      icon: '🎖️',
      rarity: 'uncommon',
      requiredAchievement: 'shows_100',
      trigger: {
        type: 'always',
        conditions: []
      },
      effects: [
        { type: 'reputation', value: 5, isPercentage: true },
        { type: 'stress_reduction', value: 10, isPercentage: true }
      ]
    });
    
    // Perfect Run synergies
    this.achievementSynergies.set('perfectionist', {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'No mistakes allowed - massive bonuses for flawless shows',
      icon: '✨',
      rarity: 'rare',
      requiredAchievement: 'perfect_run',
      trigger: {
        type: 'show_result',
        conditions: [
          { type: 'no_incidents', value: true }
        ]
      },
      effects: [
        { type: 'reputation', value: 20, isPercentage: true },
        { type: 'money', value: 25, isPercentage: true }
      ]
    });
    
    // Genre Master synergies
    this.achievementSynergies.set('punk_master', {
      id: 'punk_master',
      name: 'Punk Authority',
      description: 'Your deep knowledge of punk maximizes band potential',
      icon: '🎸',
      rarity: 'rare',
      requiredAchievement: 'punk_shows_50',
      trigger: {
        type: 'band_genre',
        conditions: [
          { type: 'has_genre', value: 'PUNK' }
        ]
      },
      effects: [
        { type: 'authenticity', value: 15, isPercentage: true },
        { type: 'energy', value: 10, isPercentage: true }
      ]
    });
    
    this.achievementSynergies.set('metal_master', {
      id: 'metal_master',
      name: 'Metal Authority',
      description: 'Your deep knowledge of metal maximizes band potential',
      icon: '🤘',
      rarity: 'rare',
      requiredAchievement: 'metal_shows_50',
      trigger: {
        type: 'band_genre',
        conditions: [
          { type: 'has_genre', value: 'METAL' }
        ]
      },
      effects: [
        { type: 'technical_skill', value: 15, isPercentage: true },
        { type: 'crowd_draw', value: 10, isPercentage: true }
      ]
    });
    
    // Economic mastery
    this.achievementSynergies.set('financial_genius', {
      id: 'financial_genius',
      name: 'Financial Genius',
      description: 'Turn every show into profit with your business acumen',
      icon: '💰',
      rarity: 'rare',
      requiredAchievement: 'revenue_100k',
      trigger: {
        type: 'always',
        conditions: []
      },
      effects: [
        { type: 'money', value: 15, isPercentage: true },
        { type: 'venue_cost_reduction', value: 20, isPercentage: true }
      ]
    });
    
    // Social network synergies
    this.achievementSynergies.set('scene_connector', {
      id: 'scene_connector',
      name: 'Scene Connector',
      description: 'Your vast network makes everything easier',
      icon: '🤝',
      rarity: 'uncommon',
      requiredAchievement: 'connections_50',
      trigger: {
        type: 'always',
        conditions: []
      },
      effects: [
        { type: 'connections_gain', value: 1, isPercentage: false },
        { type: 'booking_cost_reduction', value: 10, isPercentage: true }
      ]
    });
    
    // Legendary achievement synergies
    this.achievementSynergies.set('underground_legend', {
      id: 'underground_legend',
      name: 'Underground Legend',
      description: 'Your name alone draws crowds and opens doors',
      icon: '👑',
      rarity: 'legendary',
      requiredAchievement: 'reputation_1000',
      trigger: {
        type: 'always',
        conditions: []
      },
      effects: [
        { type: 'attendance', value: 50, isPercentage: true },
        { type: 'reputation', value: 2, isPercentage: false },
        { type: 'unlock_legendary_bands', value: 1, isPercentage: false }
      ]
    });
    
    // Faction-specific achievement synergies
    this.achievementSynergies.set('diy_champion', {
      id: 'diy_champion',
      name: 'DIY Champion',
      description: 'DIY Collective trusts you completely',
      icon: '🔧',
      rarity: 'rare',
      requiredAchievement: 'diy_standing_max',
      trigger: {
        type: 'faction',
        conditions: [
          { type: 'faction_involved', value: 'diy_collective' }
        ]
      },
      effects: [
        { type: 'authenticity', value: 25, isPercentage: true },
        { type: 'venue_upgrade_discount', value: 30, isPercentage: true }
      ]
    });
    
    // Multi-band show mastery
    this.achievementSynergies.set('bill_curator', {
      id: 'bill_curator',
      name: 'Master Bill Curator',
      description: 'Create perfect lineups that maximize synergies',
      icon: '📋',
      rarity: 'rare',
      requiredAchievement: 'perfect_bills_25',
      trigger: {
        type: 'multi_band',
        conditions: [
          { type: 'min_bands', value: 3 }
        ]
      },
      effects: [
        { type: 'bill_chemistry', value: 30, isPercentage: true },
        { type: 'drama_prevention', value: 50, isPercentage: true }
      ]
    });
    
    // Comeback kid synergy
    this.achievementSynergies.set('comeback_kid', {
      id: 'comeback_kid',
      name: 'Comeback Kid',
      description: 'Turn disasters into triumphs',
      icon: '🔥',
      rarity: 'rare',
      requiredAchievement: 'recover_from_bankruptcy',
      trigger: {
        type: 'resource_threshold',
        conditions: [
          { type: 'money_below', value: 100 }
        ]
      },
      effects: [
        { type: 'money', value: 50, isPercentage: true },
        { type: 'fan_loyalty', value: 100, isPercentage: true }
      ]
    });
  }
  
  // Check which achievement synergies are available
  getAvailableAchievementSynergies(): AchievementSynergy[] {
    const achievements = metaProgressionManager.getAchievements();
    const unlockedAchievementIds = new Set(achievements.map(a => a.id));
    
    return Array.from(this.achievementSynergies.values()).filter(synergy => 
      unlockedAchievementIds.has(synergy.requiredAchievement)
    );
  }
  
  // Check which achievement synergies are close to being unlocked
  getNearlyUnlockedSynergies(): AchievementSynergy[] {
    const achievements = metaProgressionManager.getAchievements();
    const nearlyComplete = achievements.filter(a => a.progress >= 80 && a.progress < 100);
    
    return Array.from(this.achievementSynergies.values()).filter(synergy => 
      nearlyComplete.some(a => a.id === synergy.requiredAchievement)
    ).map(synergy => ({
      ...synergy,
      unlockProgress: achievements.find(a => a.id === synergy.requiredAchievement)?.progress || 0
    }));
  }
  
  // Check if achievement synergies apply to a show
  checkAchievementSynergies(
    bands: Band[], 
    venue: Venue,
    showResult?: any
  ): SynergyCombo[] {
    const availableSynergies = this.getAvailableAchievementSynergies();
    const activeSynergies: SynergyCombo[] = [];
    
    for (const synergy of availableSynergies) {
      let triggered = false;
      
      switch (synergy.trigger.type) {
        case 'always':
          triggered = true;
          break;
          
        case 'band_genre':
          triggered = bands.some(band => 
            synergy.trigger.conditions.some(cond => 
              cond.type === 'has_genre' && band.genre === cond.value
            )
          );
          break;
          
        case 'show_result':
          if (showResult) {
            triggered = synergy.trigger.conditions.every(cond => {
              if (cond.type === 'no_incidents') {
                return showResult.incidents?.length === 0;
              }
              return false;
            });
          }
          break;
          
        case 'multi_band':
          triggered = synergy.trigger.conditions.every(cond => {
            if (cond.type === 'min_bands') {
              return bands.length >= (cond.value as number);
            }
            return false;
          });
          break;
          
        case 'resource_threshold':
          // This would need access to game state
          // For now, assume the calling code handles this
          triggered = true;
          break;
          
        case 'faction':
          // This would need faction state
          triggered = true;
          break;
      }
      
      if (triggered) {
        activeSynergies.push(synergy);
      }
    }
    
    return activeSynergies;
  }
  
  // Get description of what achievement is needed for a synergy
  getSynergyRequirementDescription(synergyId: string): string | null {
    const synergy = this.achievementSynergies.get(synergyId);
    if (!synergy) return null;
    
    const achievement = metaProgressionManager.getAchievements()
      .find(a => a.id === synergy.requiredAchievement);
      
    if (!achievement) {
      return `Unlock achievement: ${synergy.requiredAchievement}`;
    }
    
    if (achievement.progress < 100) {
      return `${achievement.name}: ${achievement.progress}% complete`;
    }
    
    return null; // Already unlocked
  }
  
  // Check if a specific achievement synergy is unlocked
  isSynergyUnlocked(synergyId: string): boolean {
    const synergy = this.achievementSynergies.get(synergyId);
    if (!synergy) return false;
    
    const achievements = metaProgressionManager.getAchievements();
    return achievements.some(a => 
      a.id === synergy.requiredAchievement && a.progress >= 100
    );
  }
}

export const achievementSynergySystem = new AchievementSynergySystem();
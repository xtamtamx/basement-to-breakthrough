import { Achievement } from '@game/types';
import { safeStorage } from '@utils/safeStorage';
import { devLog } from '@utils/devLogger';

export interface MetaProgression {
  totalRuns: number;
  totalScore: number;
  achievements: Achievement[];
  unlocks: string[]; // IDs of unlocked content
  currency: {
    fame: number; // Meta currency earned from runs
    legacy: number; // Premium meta currency for special unlocks
  };
  stats: MetaStats;
  upgrades: MetaUpgrade[];
  // Run ids whose end-of-run fame has already been banked. Persisted so that
  // loading a mid-run save and replaying to conclusion can't re-credit fame
  // for a run that already paid out.
  bankedRunIds: string[];
}

export interface MetaStats {
  totalShows: number;
  totalRevenue: number;
  totalFans: number;
  bandsManaged: number;
  venuesUnlocked: number;
  perfectRuns: number;
  bestScores: Record<string, number>; // Per run type
}

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  cost: { fame?: number; legacy?: number };
  maxLevel: number;
  currentLevel: number;
  effects: MetaUpgradeEffect[];
}

export interface MetaUpgradeEffect {
  // NOTE: 'roster_slot' = permanent +N band roster slots (the slot-cap
  // cap). Distinct from 'unlock_slot' (legacy synergy-slot unlock).
  type: 'starting_money' | 'starting_reputation' | 'starting_fans' | 'band_quality' | 'venue_discount' | 'stress_reduction' | 'unlock_slot' | 'roster_slot';
  value: number;
  description: string;
}

export interface UnlockableItem {
  id: string;
  type: 'band' | 'venue' | 'equipment' | 'trait' | 'event' | 'modifier';
  name: string;
  description: string;
  cost: { fame?: number; legacy?: number; achievement?: string };
  tier: number;
  content: Record<string, unknown[]>; // The actual unlockable data
}

class MetaProgressionManager {
  private progression: MetaProgression;
  private unlockableItems: Map<string, UnlockableItem> = new Map();
  
  constructor() {
    this.progression = this.loadProgression();
    this.initializeUnlockables();
    this.initializeUpgrades();
  }
  
  private loadProgression(): MetaProgression {
    // Default progression — also the safe fallback if the stored blob is
    // missing, malformed, or from an older shape.
    const defaults: MetaProgression = {
      totalRuns: 0,
      totalScore: 0,
      achievements: [],
      unlocks: ['starter_pack'], // Start with basic unlocks
      currency: {
        fame: 0,
        legacy: 0
      },
      stats: {
        totalShows: 0,
        totalRevenue: 0,
        totalFans: 0,
        bandsManaged: 0,
        venuesUnlocked: 0,
        perfectRuns: 0,
        bestScores: {}
      },
      upgrades: [],
      bankedRunIds: []
    };

    const stored = safeStorage.getItem('btb-meta-progression');
    if (!stored) return defaults;

    // Deep-merge over defaults so a partial/legacy blob can't leave required
    // fields (currency, upgrades, stats) undefined. A bad parse would throw at
    // module-eval (the singleton is constructed eagerly) and white-screen the
    // whole app, so failures fall back to defaults instead.
    try {
      const parsed = JSON.parse(stored) as Partial<MetaProgression>;
      return {
        ...defaults,
        ...parsed,
        currency: { ...defaults.currency, ...(parsed.currency ?? {}) },
        stats: { ...defaults.stats, ...(parsed.stats ?? {}) },
        achievements: parsed.achievements ?? defaults.achievements,
        unlocks: parsed.unlocks ?? defaults.unlocks,
        upgrades: parsed.upgrades ?? defaults.upgrades,
        bankedRunIds: parsed.bankedRunIds ?? defaults.bankedRunIds,
      };
    } catch (e) {
      devLog.warn('Corrupt meta-progression blob; resetting to defaults', e);
      return defaults;
    }
  }
  
  private saveProgression() {
    safeStorage.setItem('btb-meta-progression', JSON.stringify(this.progression));
  }
  
  private initializeUnlockables() {
    // Band unlocks
    this.unlockableItems.set('band_punk_legends', {
      id: 'band_punk_legends',
      type: 'band',
      name: 'Punk Legends Pack',
      description: 'Unlock legendary punk bands with unique traits',
      cost: { fame: 500 },
      tier: 2,
      content: {
        bandTemplates: [
          {
            name: 'The Refused',
            genre: 'HARDCORE',
            baseStats: { popularity: 40, energy: 95, authenticity: 100, technicalSkill: 85 },
            traits: ['legendary', 'influential', 'intense']
          },
          {
            name: 'Minor Threat',
            genre: 'HARDCORE',
            baseStats: { popularity: 35, energy: 90, authenticity: 100, technicalSkill: 80 },
            traits: ['straight_edge', 'influential', 'DIY']
          }
        ]
      }
    });
    
    // Venue unlocks
    this.unlockableItems.set('venue_underground_circuit', {
      id: 'venue_underground_circuit',
      type: 'venue',
      name: 'Underground Circuit',
      description: 'Access to legendary underground venues',
      cost: { fame: 750 },
      tier: 2,
      content: {
        venueTemplates: [
          {
            name: 'CBGB',
            type: 'LEGENDARY_CLUB',
            capacity: 350,
            authenticity: 100,
            reputation: 50
          },
          {
            name: 'The Smell',
            type: 'DIY_VENUE',
            capacity: 150,
            authenticity: 95,
            reputation: 30
          }
        ]
      }
    });
    
    // Equipment unlocks
    this.unlockableItems.set('equipment_boutique_gear', {
      id: 'equipment_boutique_gear',
      type: 'equipment',
      name: 'Boutique Gear',
      description: 'High-end equipment for discerning venues',
      cost: { fame: 1000 },
      tier: 3,
      content: {
        equipment: [
          {
            name: 'Vintage Neve Console',
            type: 'MIXING_BOARD',
            quality: 5,
            effects: { acousticsBonus: 50, reputationMultiplier: 1.5 }
          }
        ]
      }
    });
    
    // Trait unlocks
    this.unlockableItems.set('traits_legendary_pack', {
      id: 'traits_legendary_pack',
      type: 'trait',
      name: 'Legendary Traits',
      description: 'Rare band traits that create powerful synergies',
      cost: { fame: 600, legacy: 10 },
      tier: 3,
      content: {
        traits: [
          {
            id: 'scene_builder',
            name: 'Scene Builder',
            description: 'This band attracts other bands to the scene',
            effects: { sceneGrowth: 0.2, bandAttraction: 0.3 }
          },
          {
            id: 'crossover_appeal',
            name: 'Crossover Appeal',
            description: 'Appeals to multiple genres',
            effects: { genreBonus: ['all'], audienceMultiplier: 1.3 }
          }
        ]
      }
    });
    
    // Event unlocks
    this.unlockableItems.set('events_chaos_pack', {
      id: 'events_chaos_pack',
      type: 'event',
      name: 'Chaos Events',
      description: 'Add unpredictable events to your runs',
      cost: { achievement: 'chaos_master' },
      tier: 2,
      content: {
        events: [
          {
            id: 'venue_raid',
            name: 'Venue Raid',
            description: 'Police raid a venue mid-show',
            weight: 0.05
          },
          {
            id: 'viral_moment',
            name: 'Viral Moment',
            description: 'A show clip goes viral',
            weight: 0.1
          }
        ]
      }
    });
  }
  
  private initializeUpgrades() {
    const defaultUpgrades: MetaUpgrade[] = [
      {
        id: 'starting_funds',
        name: 'Starting Capital',
        description: 'Begin runs with extra money',
        cost: { fame: 100 },
        maxLevel: 5,
        currentLevel: 0,
        effects: [{
          type: 'starting_money',
          value: 100, // Per level
          description: '+$100 starting money per level'
        }]
      },
      {
        id: 'scene_reputation',
        name: 'Scene Cred',
        description: 'Start with higher reputation',
        cost: { fame: 150 },
        maxLevel: 5,
        currentLevel: 0,
        effects: [{
          type: 'starting_reputation',
          value: 5,
          description: '+5 starting reputation per level'
        }]
      },
      {
        id: 'talent_scout',
        name: 'Talent Scout',
        description: 'Higher quality starting bands',
        cost: { fame: 200 },
        maxLevel: 3,
        currentLevel: 0,
        effects: [{
          type: 'band_quality',
          value: 10,
          description: '+10% band quality per level'
        }]
      },
      {
        id: 'venue_connections',
        name: 'Venue Connections',
        description: 'Reduced venue rental costs',
        cost: { fame: 250 },
        maxLevel: 3,
        currentLevel: 0,
        effects: [{
          type: 'venue_discount',
          value: 0.1,
          description: '10% venue discount per level'
        }]
      },
      {
        id: 'stress_management',
        name: 'Zen Master',
        description: 'Reduced stress gain',
        cost: { fame: 300 },
        maxLevel: 3,
        currentLevel: 0,
        effects: [{
          type: 'stress_reduction',
          value: 0.15,
          description: '15% less stress per level'
        }]
      },
      {
        id: 'scene_expansion',
        name: 'Scene Expansion',
        description: 'Manage a bigger roster — more band slots',
        cost: { fame: 250 },
        maxLevel: 2,
        currentLevel: 0,
        effects: [{
          type: 'roster_slot',
          value: 1,
          description: '+1 roster slot per level'
        }]
      },
      {
        id: 'demo_tape',
        name: 'Demo Tape Buzz',
        description: 'That old demo still circulates — start with a small fanbase',
        cost: { fame: 200 },
        maxLevel: 3,
        currentLevel: 0,
        effects: [{
          type: 'starting_fans',
          value: 40,
          description: '+40 starting fans per level'
        }]
      },
      {
        id: 'merch_startup',
        name: 'Pre-Printed Merch',
        description: 'Show up with a box of shirts already screen-printed',
        cost: { fame: 150 },
        maxLevel: 2,
        currentLevel: 0,
        effects: [{
          type: 'starting_money',
          value: 75,
          description: '+$75 starting money per level'
        }]
      }
    ];
    
    // Load saved upgrade levels
    const savedUpgrades = this.progression.upgrades;
    this.progression.upgrades = defaultUpgrades.map(upgrade => {
      const saved = savedUpgrades.find(u => u.id === upgrade.id);
      return saved ? { ...upgrade, currentLevel: saved.currentLevel } : upgrade;
    });
  }
  
  // Add fame/legacy from run
  addCurrency(fame: number, legacy: number = 0) {
    this.progression.currency.fame += fame;
    this.progression.currency.legacy += legacy;
    this.saveProgression();
  }

  // Bank a run's end-of-run fame exactly once per run id. Returns false (and
  // does nothing) if this run already paid out — so loading a mid-run save and
  // replaying the same run to conclusion can't double-credit fame. Returns true
  // on the first (real) bank.
  bankRunOnce(runId: string, fame: number): boolean {
    if (this.progression.bankedRunIds.includes(runId)) {
      return false;
    }
    this.progression.currency.fame += fame;
    this.progression.bankedRunIds.push(runId);
    this.saveProgression();
    return true;
  }
  
  // Purchase an upgrade
  purchaseUpgrade(upgradeId: string): { success: boolean; error?: string } {
    const upgrade = this.progression.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }
    
    if (upgrade.currentLevel >= upgrade.maxLevel) {
      return { success: false, error: 'Upgrade already at max level' };
    }
    
    // Calculate cost for next level
    const levelMultiplier = upgrade.currentLevel + 1;
    const fameCost = (upgrade.cost.fame || 0) * levelMultiplier;
    const legacyCost = (upgrade.cost.legacy || 0) * levelMultiplier;
    
    if (this.progression.currency.fame < fameCost || this.progression.currency.legacy < legacyCost) {
      return { success: false, error: 'Insufficient currency' };
    }
    
    // Purchase upgrade
    this.progression.currency.fame -= fameCost;
    this.progression.currency.legacy -= legacyCost;
    upgrade.currentLevel++;
    
    this.saveProgression();
    return { success: true };
  }
  
  // Purchase unlockable content
  purchaseUnlock(unlockId: string): { success: boolean; error?: string } {
    const unlock = this.unlockableItems.get(unlockId);
    if (!unlock) {
      return { success: false, error: 'Unlock not found' };
    }
    
    if (this.progression.unlocks.includes(unlockId)) {
      return { success: false, error: 'Already unlocked' };
    }
    
    // Check cost
    if (unlock.cost.fame && this.progression.currency.fame < unlock.cost.fame) {
      return { success: false, error: 'Insufficient fame' };
    }
    
    if (unlock.cost.legacy && this.progression.currency.legacy < unlock.cost.legacy) {
      return { success: false, error: 'Insufficient legacy' };
    }
    
    if (unlock.cost.achievement && !this.hasAchievement(unlock.cost.achievement)) {
      return { success: false, error: 'Achievement requirement not met' };
    }
    
    // Purchase unlock
    if (unlock.cost.fame) this.progression.currency.fame -= unlock.cost.fame;
    if (unlock.cost.legacy) this.progression.currency.legacy -= unlock.cost.legacy;
    
    this.progression.unlocks.push(unlockId);
    this.saveProgression();
    
    return { success: true };
  }
  
  // Check if has achievement
  hasAchievement(achievementId: string): boolean {
    return this.progression.achievements.some(a => a.id === achievementId);
  }
  
  // Add achievements
  addAchievements(achievements: Achievement[]) {
    achievements.forEach(achievement => {
      if (!this.hasAchievement(achievement.id)) {
        this.progression.achievements.push(achievement);
      }
    });
    this.saveProgression();
  }
  
  // Update meta stats from run
  updateStats(runStats: {
    score?: number;
    totalShows?: number;
    totalRevenue?: number;
    totalFans?: number;
    bandsManaged?: number;
  }) {
    this.progression.totalRuns++;
    this.progression.totalScore += runStats.score || 0;
    this.progression.stats.totalShows += runStats.totalShows || 0;
    this.progression.stats.totalRevenue += runStats.totalRevenue || 0;
    this.progression.stats.totalFans += runStats.totalFans || 0;
    this.progression.stats.bandsManaged += runStats.bandsManaged || 0;
    
    this.saveProgression();
  }
  
  // Get upgrade effects for run start
  getRunStartBonuses() {
    const bonuses = {
      startingMoney: 0,
      startingReputation: 0,
      startingFans: 0,
      bandQualityMultiplier: 1,
      venueDiscountMultiplier: 1,
      stressReductionMultiplier: 1,
      rosterSlotBonus: 0
    };
    
    this.progression.upgrades.forEach(upgrade => {
      if (upgrade.currentLevel > 0) {
        upgrade.effects.forEach(effect => {
          const totalValue = effect.value * upgrade.currentLevel;
          
          switch (effect.type) {
            case 'starting_money':
              bonuses.startingMoney += totalValue;
              break;
            case 'starting_reputation':
              bonuses.startingReputation += totalValue;
              break;
            case 'starting_fans':
              bonuses.startingFans += totalValue;
              break;
            case 'band_quality':
              bonuses.bandQualityMultiplier += totalValue / 100;
              break;
            case 'venue_discount':
              bonuses.venueDiscountMultiplier -= totalValue;
              break;
            case 'stress_reduction':
              bonuses.stressReductionMultiplier -= totalValue;
              break;
            case 'roster_slot':
              bonuses.rosterSlotBonus += totalValue;
              break;
          }
        });
      }
    });
    
    return bonuses;
  }
  
  // Get unlocked content for run
  getUnlockedContent() {
    const content = {
      bands: [] as unknown[],
      venues: [] as unknown[],
      equipment: [] as unknown[],
      traits: [] as unknown[],
      events: [] as unknown[],
      modifiers: [] as unknown[]
    };
    
    this.progression.unlocks.forEach(unlockId => {
      const unlock = this.unlockableItems.get(unlockId);
      if (unlock) {
        switch (unlock.type) {
          case 'band':
            content.bands.push(...(unlock.content.bandTemplates || []));
            break;
          case 'venue':
            content.venues.push(...(unlock.content.venueTemplates || []));
            break;
          case 'equipment':
            content.equipment.push(...(unlock.content.equipment || []));
            break;
          case 'trait':
            content.traits.push(...(unlock.content.traits || []));
            break;
          case 'event':
            content.events.push(...(unlock.content.events || []));
            break;
          case 'modifier':
            content.modifiers.push(...(unlock.content.modifiers || []));
            break;
        }
      }
    });
    
    return content;
  }
  
  // Get progression data
  getProgression(): MetaProgression {
    return this.progression;
  }

  // Has a piece of content been unlocked? (criteria-met OR purchased)
  hasUnlock(unlockId: string): boolean {
    return this.progression.unlocks.includes(unlockId);
  }

  // Record a criteria-met unlock (no cost — e.g. a city reached by reputation).
  // Returns true only the first time, so callers can fire a "newly unlocked!"
  // notification. Persists cross-run.
  recordUnlock(unlockId: string): boolean {
    if (this.progression.unlocks.includes(unlockId)) return false;
    this.progression.unlocks.push(unlockId);
    this.saveProgression();
    return true;
  }
  
  // Get available unlocks
  getAvailableUnlocks(): UnlockableItem[] {
    return Array.from(this.unlockableItems.values())
      .filter(item => !this.progression.unlocks.includes(item.id));
  }
  
  // Calculate fame earned from run
  calculateFameEarned(score: number, runType: string): number {
    let fame = Math.floor(score / 10);
    
    // Bonus fame for harder runs
    const runMultipliers: Record<string, number> = {
      classic: 1.0,
      speed: 1.3,
      hardcore: 1.5,
      festival: 1.2
    };
    
    fame = Math.floor(fame * (runMultipliers[runType] || 1.0));
    
    return fame;
  }
}

export const metaProgressionManager = new MetaProgressionManager();
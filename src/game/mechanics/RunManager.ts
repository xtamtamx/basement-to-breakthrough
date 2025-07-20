import { Band, Venue, Equipment, Achievement, UnlockableContent } from '@game/types';

export interface RunConfig {
  id: string;
  name: string;
  description: string;
  startingMoney: number;
  startingReputation: number;
  startingConnections: number;
  maxTurns: number;
  winConditions: WinCondition[];
  modifiers: RunModifier[];
}

export interface WinCondition {
  type: 'reputation' | 'money' | 'fans' | 'shows' | 'custom';
  target: number;
  description: string;
}

export interface RunModifier {
  id: string;
  name: string;
  description: string;
  effects: {
    moneyMultiplier?: number;
    reputationMultiplier?: number;
    stressMultiplier?: number;
    startingBandQuality?: number;
    venueRentMultiplier?: number;
  };
}

export interface RunState {
  runId: string;
  config: RunConfig;
  currentTurn: number;
  startTime: Date;
  endTime?: Date;
  score: number;
  achievements: string[];
  unlocks: string[];
  stats: RunStats;
}

export interface RunStats {
  totalShows: number;
  totalRevenue: number;
  totalFans: number;
  peakReputation: number;
  bandsManaged: number;
  venuesPlayed: number;
  billsCreated: number;
  perfectShows: number;
  disasters: number;
}

export interface RunResult {
  success: boolean;
  score: number;
  achievements: Achievement[];
  unlocks: UnlockableContent[];
  stats: RunStats;
  newHighScore: boolean;
}

class RunManager {
  private currentRun: RunState | null = null;
  private runConfigs: Map<string, RunConfig> = new Map();
  
  constructor() {
    this.initializeRunConfigs();
  }
  
  private initializeRunConfigs() {
    // Classic Run - Standard experience
    this.runConfigs.set('classic', {
      id: 'classic',
      name: 'Classic Run',
      description: 'Build your scene from basement shows to legendary venues',
      startingMoney: 500,
      startingReputation: 10,
      startingConnections: 5,
      maxTurns: 50,
      winConditions: [
        { type: 'reputation', target: 100, description: 'Reach 100 reputation' }
      ],
      modifiers: []
    });
    
    // Speed Run - Shorter, more intense
    this.runConfigs.set('speed', {
      id: 'speed',
      name: 'Speed Run',
      description: 'Can you make it big in just 20 turns?',
      startingMoney: 1000,
      startingReputation: 15,
      startingConnections: 10,
      maxTurns: 20,
      winConditions: [
        { type: 'reputation', target: 80, description: 'Reach 80 reputation in 20 turns' }
      ],
      modifiers: [
        {
          id: 'fast_scene',
          name: 'Fast Scene',
          description: 'Everything moves faster',
          effects: {
            reputationMultiplier: 1.5,
            stressMultiplier: 1.5
          }
        }
      ]
    });
    
    // Hardcore Run - For experts
    this.runConfigs.set('hardcore', {
      id: 'hardcore',
      name: 'Hardcore',
      description: 'No room for mistakes. One bankruptcy and it\'s over.',
      startingMoney: 200,
      startingReputation: 5,
      startingConnections: 2,
      maxTurns: 100,
      winConditions: [
        { type: 'reputation', target: 150, description: 'Reach legendary status (150 rep)' },
        { type: 'money', target: 10000, description: 'Bank $10,000' }
      ],
      modifiers: [
        {
          id: 'brutal_scene',
          name: 'Brutal Scene',
          description: 'Everything costs more, bands are pickier',
          effects: {
            venueRentMultiplier: 1.5,
            startingBandQuality: -10,
            moneyMultiplier: 0.8
          }
        }
      ]
    });
    
    // Festival Run - Big shows focus
    this.runConfigs.set('festival', {
      id: 'festival',
      name: 'Festival Organizer',
      description: 'Focus on multi-band bills and large venues',
      startingMoney: 2000,
      startingReputation: 25,
      startingConnections: 15,
      maxTurns: 40,
      winConditions: [
        { type: 'shows', target: 20, description: 'Run 20 successful multi-band shows' },
        { type: 'fans', target: 10000, description: 'Attract 10,000 total fans' }
      ],
      modifiers: [
        {
          id: 'bill_bonus',
          name: 'Bill Specialist',
          description: 'Multi-band shows give bonus reputation',
          effects: {
            reputationMultiplier: 1.3
          }
        }
      ]
    });
  }
  
  // Start a new run
  startRun(configId: string): RunState {
    const config = this.runConfigs.get(configId);
    if (!config) {
      throw new Error(`Run config ${configId} not found`);
    }
    
    this.currentRun = {
      runId: `run-${Date.now()}`,
      config,
      currentTurn: 1,
      startTime: new Date(),
      score: 0,
      achievements: [],
      unlocks: [],
      stats: {
        totalShows: 0,
        totalRevenue: 0,
        totalFans: 0,
        peakReputation: 0,
        bandsManaged: 0,
        venuesPlayed: 0,
        billsCreated: 0,
        perfectShows: 0,
        disasters: 0
      }
    };
    
    return this.currentRun;
  }
  
  // Update run stats
  updateRunStats(updates: Partial<RunStats>) {
    if (!this.currentRun) return;
    
    this.currentRun.stats = {
      ...this.currentRun.stats,
      ...updates
    };
    
    // Update peak reputation
    if (updates.peakReputation && updates.peakReputation > this.currentRun.stats.peakReputation) {
      this.currentRun.stats.peakReputation = updates.peakReputation;
    }
  }
  
  // Check win conditions
  checkWinConditions(gameState: any): boolean {
    if (!this.currentRun) return false;
    
    const { winConditions } = this.currentRun.config;
    
    return winConditions.every(condition => {
      switch (condition.type) {
        case 'reputation':
          return gameState.reputation >= condition.target;
        case 'money':
          return gameState.money >= condition.target;
        case 'fans':
          return this.currentRun.stats.totalFans >= condition.target;
        case 'shows':
          return this.currentRun.stats.totalShows >= condition.target;
        default:
          return false;
      }
    });
  }
  
  // Check if run should end
  shouldEndRun(gameState: any): { shouldEnd: boolean; reason?: string } {
    if (!this.currentRun) return { shouldEnd: false };
    
    // Check turn limit
    if (this.currentRun.currentTurn >= this.currentRun.config.maxTurns) {
      return { shouldEnd: true, reason: 'Turn limit reached' };
    }
    
    // Check bankruptcy (hardcore mode)
    if (this.currentRun.config.id === 'hardcore' && gameState.money < 0) {
      return { shouldEnd: true, reason: 'Bankruptcy in hardcore mode' };
    }
    
    // Check win conditions
    if (this.checkWinConditions(gameState)) {
      return { shouldEnd: true, reason: 'Victory conditions met!' };
    }
    
    return { shouldEnd: false };
  }
  
  // End the current run
  endRun(gameState: any): RunResult {
    if (!this.currentRun) {
      throw new Error('No active run to end');
    }
    
    this.currentRun.endTime = new Date();
    
    // Calculate score
    const score = this.calculateScore(this.currentRun, gameState);
    
    // Check achievements
    const achievements = this.checkAchievements(this.currentRun, gameState);
    
    // Check unlocks
    const unlocks = this.checkUnlocks(this.currentRun, score);
    
    // Check if new high score
    const newHighScore = this.isNewHighScore(this.currentRun.config.id, score);
    
    const result: RunResult = {
      success: this.checkWinConditions(gameState),
      score,
      achievements,
      unlocks,
      stats: this.currentRun.stats,
      newHighScore
    };
    
    // Save run history
    this.saveRunHistory(this.currentRun, result);
    
    // Clear current run
    this.currentRun = null;
    
    return result;
  }
  
  // Calculate run score
  private calculateScore(run: RunState, gameState: any): number {
    let score = 0;
    
    // Base score from stats
    score += run.stats.totalRevenue * 0.1;
    score += run.stats.totalFans * 1;
    score += run.stats.peakReputation * 10;
    score += run.stats.perfectShows * 100;
    score -= run.stats.disasters * 50;
    
    // Multipliers from run config
    const turnEfficiency = run.config.maxTurns / run.currentTurn;
    score *= turnEfficiency;
    
    // Difficulty multiplier
    const difficultyMultipliers: Record<string, number> = {
      classic: 1.0,
      speed: 1.5,
      hardcore: 2.0,
      festival: 1.3
    };
    score *= difficultyMultipliers[run.config.id] || 1.0;
    
    return Math.floor(score);
  }
  
  // Check achievements earned this run
  private checkAchievements(run: RunState, gameState: any): Achievement[] {
    const achievements: Achievement[] = [];
    
    // Perfect Run - No disasters
    if (run.stats.disasters === 0 && run.stats.totalShows >= 10) {
      achievements.push({
        id: 'perfect_run',
        name: 'Perfect Promoter',
        description: 'Complete a run with 10+ shows and no disasters',
        icon: '⭐',
        unlockedAt: new Date()
      });
    }
    
    // Speed Demon - Win speed run
    if (run.config.id === 'speed' && this.checkWinConditions(gameState)) {
      achievements.push({
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Win a speed run',
        icon: '⚡',
        unlockedAt: new Date()
      });
    }
    
    // More achievements...
    
    return achievements;
  }
  
  // Check unlocks earned from score
  private checkUnlocks(run: RunState, score: number): UnlockableContent[] {
    const unlocks: UnlockableContent[] = [];
    
    // Unlock new bands at score thresholds
    if (score >= 1000) {
      unlocks.push({
        id: 'band_tier2',
        type: 'band_tier',
        name: 'Professional Bands',
        description: 'Unlock higher quality starting bands'
      });
    }
    
    if (score >= 2500) {
      unlocks.push({
        id: 'venue_tier2',
        type: 'venue_tier',
        name: 'Better Venues',
        description: 'Start with access to better venues'
      });
    }
    
    if (score >= 5000) {
      unlocks.push({
        id: 'equipment_tier2',
        type: 'equipment_tier',
        name: 'Pro Equipment',
        description: 'Unlock professional grade equipment'
      });
    }
    
    return unlocks;
  }
  
  // Check if score is a new high score
  private isNewHighScore(configId: string, score: number): boolean {
    const highScores = this.getHighScores();
    const currentHigh = highScores[configId] || 0;
    return score > currentHigh;
  }
  
  // Get high scores from storage
  private getHighScores(): Record<string, number> {
    const stored = localStorage.getItem('btb-highscores');
    return stored ? JSON.parse(stored) : {};
  }
  
  // Save run history
  private saveRunHistory(run: RunState, result: RunResult) {
    const history = this.getRunHistory();
    history.push({
      ...run,
      result,
      endTime: new Date()
    });
    
    // Keep only last 50 runs
    if (history.length > 50) {
      history.shift();
    }
    
    localStorage.setItem('btb-run-history', JSON.stringify(history));
    
    // Update high scores if needed
    if (result.newHighScore) {
      const highScores = this.getHighScores();
      highScores[run.config.id] = result.score;
      localStorage.setItem('btb-highscores', JSON.stringify(highScores));
    }
  }
  
  // Get run history
  private getRunHistory(): any[] {
    const stored = localStorage.getItem('btb-run-history');
    return stored ? JSON.parse(stored) : [];
  }
  
  // Get available run configs
  getRunConfigs(): RunConfig[] {
    return Array.from(this.runConfigs.values());
  }
  
  // Get current run
  getCurrentRun(): RunState | null {
    return this.currentRun;
  }
  
  // Advance turn
  advanceTurn() {
    if (this.currentRun) {
      this.currentRun.currentTurn++;
    }
  }
}

export const runManager = new RunManager();
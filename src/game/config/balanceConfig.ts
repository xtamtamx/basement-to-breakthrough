/**
 * Game Balance Configuration
 * Central location for all game balance values
 */

export const BALANCE_CONFIG = {
  // Starting resources
  STARTING: {
    MONEY: 500,
    REPUTATION: 10,
    FANS: 0,
    STRESS: 0,
    CONNECTIONS: 3,
  },

  // Economic balance
  ECONOMY: {
    // Venue costs (base values before difficulty scaling)
    VENUE_RENT: {
      DIY_SPACE: 50,
      DIVE_BAR: 100,
      SMALL_CLUB: 200,
      MID_SIZE_VENUE: 500,
      LARGE_VENUE: 1000,
      FESTIVAL: 2000,
    },
    
    // Band costs
    BAND_FEES: {
      LOCAL_OPENER: 25,
      TOURING_BAND: 100,
      ESTABLISHED_ACT: 250,
      HEADLINER: 500,
    },
    
    // Ticket pricing
    TICKETS: {
      MIN_PRICE: 5,
      MAX_PRICE: 50,
      SWEET_SPOT: 15, // Optimal price for attendance
      PRICE_SENSITIVITY: 0.1, // How much each dollar affects attendance
    },
    
    // Revenue sources
    BAR_REVENUE_PER_PERSON: 5,
    MERCH_REVENUE_MULTIPLIER: 0.2, // % of ticket revenue
    
    // Equipment costs
    EQUIPMENT: {
      PA_SYSTEM: { cost: 500, maintenanceCost: 50 },
      LIGHTING_RIG: { cost: 300, maintenanceCost: 30 },
      BACKLINE: { cost: 400, maintenanceCost: 40 },
      MERCH_BOOTH: { cost: 200, maintenanceCost: 20 },
    },
  },

  // Progression rates
  PROGRESSION: {
    // Reputation gains/losses
    REPUTATION: {
      GREAT_SHOW: 5,
      GOOD_SHOW: 3,
      AVERAGE_SHOW: 1,
      BAD_SHOW: -2,
      TERRIBLE_SHOW: -5,
      PASSIVE_DECAY_PER_TURN: 1,
      MAX_REPUTATION: 100,
    },
    
    // Fan growth
    FANS: {
      PER_ATTENDEE_CHANCE: 0.1, // 10% chance each attendee becomes a fan
      WORD_OF_MOUTH_MULTIPLIER: 0.05, // Fans bring friends
      MAX_FANS_PER_SHOW: 50,
      FAN_LOSS_ON_BAD_SHOW: 0.1, // Lose 10% of fans
    },
    
    // Stress management
    STRESS: {
      BASE_INCREASE_PER_TURN: 2,
      SHOW_STRESS: 5,
      FAILED_SHOW_STRESS: 15,
      DAY_JOB_STRESS: 5,
      STRESS_RELIEF_ACTIVITY: -10,
      BURNOUT_THRESHOLD: 80,
      MAX_STRESS: 100,
    },
  },

  // Show mechanics
  SHOWS: {
    // Attendance calculation
    ATTENDANCE: {
      BASE_POPULARITY_WEIGHT: 0.6,
      VENUE_ATMOSPHERE_WEIGHT: 0.2,
      PROMOTION_WEIGHT: 0.2,
      OVERSATURATION_PENALTY: 0.8, // If too many shows same night
    },
    
    // Show quality thresholds
    QUALITY: {
      GREAT: 0.9, // 90%+ capacity
      GOOD: 0.7,
      AVERAGE: 0.5,
      POOR: 0.3,
      DISASTER: 0, // Below 30%
    },
    
    // Synergy bonuses
    SYNERGIES: {
      GENRE_MATCH: 1.2,
      SCENE_UNITY: 1.3,
      PERFECT_LINEUP: 1.5,
      LEGENDARY_COMBO: 2.0,
    },
  },

  // Difficulty scaling
  DIFFICULTY: {
    // Round-based scaling
    ROUNDS: {
      EASY: { start: 1, end: 10 },
      MEDIUM: { start: 11, end: 25 },
      HARD: { start: 26, end: 50 },
      EXTREME: { start: 51, end: 100 },
      ENDLESS: { start: 101, end: Infinity },
    },
    
    // Scaling factors per difficulty
    MULTIPLIERS: {
      EASY: {
        COSTS: 1.0,
        EXPECTATIONS: 1.0,
        RISKS: 0.5,
      },
      MEDIUM: {
        COSTS: 1.25,
        EXPECTATIONS: 1.5,
        RISKS: 1.0,
      },
      HARD: {
        COSTS: 1.5,
        EXPECTATIONS: 2.0,
        RISKS: 1.5,
      },
      EXTREME: {
        COSTS: 2.0,
        EXPECTATIONS: 2.5,
        RISKS: 2.0,
      },
      ENDLESS: {
        COSTS: 2.5,
        EXPECTATIONS: 3.0,
        RISKS: 2.5,
      },
    },
  },

  // Random events
  EVENTS: {
    // Positive events
    POSITIVE: {
      VIRAL_MOMENT: { chance: 0.05, fanGain: 100 },
      PRESS_COVERAGE: { chance: 0.1, reputationGain: 10 },
      GENEROUS_PATRON: { chance: 0.08, moneyGain: 200 },
    },
    
    // Negative events
    NEGATIVE: {
      EQUIPMENT_FAILURE: { chance: 0.1, cost: 100 },
      BAND_DRAMA: { chance: 0.15, stressGain: 10 },
      VENUE_ISSUES: { chance: 0.08, showCancelled: true },
      POLICE_SHUTDOWN: { chance: 0.05, reputationLoss: 5 },
    },
  },

  // Victory conditions
  VICTORY: {
    ENDINGS: {
      SELLOUT: { fans: 10000, reputation: 50 },
      UNDERGROUND_LEGEND: { fans: 5000, reputation: 80 },
      SCENE_BUILDER: { venuesUnlocked: 10, bandsDiscovered: 20 },
      SURVIVOR: { rounds: 100 },
    },
  },

  // Meta progression
  META: {
    XP_PER_SHOW: 10,
    XP_PER_ACHIEVEMENT: 50,
    UNLOCK_COSTS: {
      NEW_BAND: 100,
      NEW_VENUE: 200,
      NEW_EQUIPMENT: 150,
      NEW_GENRE: 300,
    },
  },
} as const;

// Helper functions for balance calculations
export const BalanceHelpers = {
  // Calculate show success rating
  getShowRating(attendance: number, capacity: number): keyof typeof BALANCE_CONFIG.SHOWS.QUALITY {
    const ratio = attendance / capacity;
    if (ratio >= BALANCE_CONFIG.SHOWS.QUALITY.GREAT) return 'GREAT';
    if (ratio >= BALANCE_CONFIG.SHOWS.QUALITY.GOOD) return 'GOOD';
    if (ratio >= BALANCE_CONFIG.SHOWS.QUALITY.AVERAGE) return 'AVERAGE';
    if (ratio >= BALANCE_CONFIG.SHOWS.QUALITY.POOR) return 'POOR';
    return 'DISASTER';
  },

  // Get current difficulty tier
  getDifficultyTier(round: number): keyof typeof BALANCE_CONFIG.DIFFICULTY.ROUNDS {
    for (const [tier, range] of Object.entries(BALANCE_CONFIG.DIFFICULTY.ROUNDS)) {
      if (round >= range.start && round <= range.end) {
        return tier as keyof typeof BALANCE_CONFIG.DIFFICULTY.ROUNDS;
      }
    }
    return 'ENDLESS';
  },

  // Calculate venue rent with difficulty
  getScaledVenueCost(baseRent: number, round: number): number {
    const tier = BalanceHelpers.getDifficultyTier(round);
    const multiplier = BALANCE_CONFIG.DIFFICULTY.MULTIPLIERS[tier].COSTS;
    return Math.floor(baseRent * multiplier);
  },

  // Calculate stress gain
  calculateStressGain(showRating: keyof typeof BALANCE_CONFIG.SHOWS.QUALITY): number {
    switch (showRating) {
      case 'GREAT':
      case 'GOOD':
        return BALANCE_CONFIG.PROGRESSION.STRESS.SHOW_STRESS;
      case 'AVERAGE':
        return BALANCE_CONFIG.PROGRESSION.STRESS.SHOW_STRESS * 1.5;
      case 'POOR':
      case 'DISASTER':
        return BALANCE_CONFIG.PROGRESSION.STRESS.FAILED_SHOW_STRESS;
    }
  },

  // Check if player can afford something
  canAfford(cost: number, currentMoney: number, buffer: number = 100): boolean {
    return currentMoney >= cost + buffer; // Keep buffer for emergencies
  },
};
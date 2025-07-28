import { useGameStore } from '@stores/gameStore';

export enum ProgressionPath {
  NONE = 'NONE',
  DIY_COLLECTIVE = 'DIY_COLLECTIVE',
  CORPORATE = 'CORPORATE'
}

export enum PathTier {
  FOUNDATION = 1,
  ORGANIZATION = 2,
  EXPANSION = 3,
  IDEOLOGY = 4,
  ULTIMATE = 5
}

export interface PathChoice {
  id: string;
  name: string;
  description: string;
  tier: PathTier;
  path: ProgressionPath;
  requirements?: {
    reputation?: number;
    fans?: number;
    money?: number;
    previousChoice?: string;
  };
  conflicts?: string[]; // IDs of choices this conflicts with
  permanent?: boolean;
  effects: {
    immediate?: {
      money?: number;
      reputation?: number;
      fans?: number;
      stress?: number;
    };
    modifiers?: {
      ticketPriceMultiplier?: number;
      bandHappinessModifier?: number;
      venueRentMultiplier?: number;
      fanGrowthRate?: number;
      reputationGrowthRate?: number;
    };
    unlocks?: {
      venueTypes?: string[];
      equipment?: string[];
      features?: string[];
    };
    restrictions?: {
      maxTicketPrice?: number;
      bannedVenueTypes?: string[];
      maxVenueCapacity?: number;
    };
  };
  satiricalFlavor: string;
}

const PATH_CHOICES: Record<string, PathChoice> = {
  // DIY Collective Tier 1
  community_fund: {
    id: 'community_fund',
    name: 'Community Show Fund',
    description: 'Pool resources to help bands tour and venues stay open',
    tier: PathTier.FOUNDATION,
    path: ProgressionPath.DIY_COLLECTIVE,
    effects: {
      modifiers: {
        venueRentMultiplier: 0.8,
        ticketPriceMultiplier: 0.8,
        bandHappinessModifier: 0.2
      }
    },
    satiricalFlavor: "Everyone chips in $5 and somehow it works"
  },
  
  consensus_booking: {
    id: 'consensus_booking',
    name: 'Consensus Booking',
    description: 'All booking decisions made democratically',
    tier: PathTier.FOUNDATION,
    path: ProgressionPath.DIY_COLLECTIVE,
    conflicts: ['community_fund'],
    effects: {
      modifiers: {
        bandHappinessModifier: 0.3,
        fanGrowthRate: 1.1
      },
      unlocks: {
        features: ['democratic_voting']
      }
    },
    satiricalFlavor: "Democracy is messy, loud, and takes forever. Perfect for punk rock."
  },

  // DIY Collective Tier 2
  all_ages_pledge: {
    id: 'all_ages_pledge',
    name: 'All Ages Forever Pledge',
    description: 'Commit to never booking 21+ shows',
    tier: PathTier.ORGANIZATION,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 30 },
    permanent: true,
    effects: {
      restrictions: {
        maxTicketPrice: 15
      },
      modifiers: {
        fanGrowthRate: 1.3,
        reputationGrowthRate: 1.2
      }
    },
    satiricalFlavor: "Teaching kids to stage dive responsibly since forever"
  },

  safer_spaces: {
    id: 'safer_spaces',
    name: 'Safer Spaces Policy',
    description: 'Implement community accountability and support structures',
    tier: PathTier.ORGANIZATION,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 40 },
    effects: {
      immediate: {
        reputation: 20
      },
      modifiers: {
        bandHappinessModifier: 0.25,
        fanGrowthRate: 1.15
      }
    },
    satiricalFlavor: "Mosh pits with mutual respect and consent forms"
  },

  // DIY Collective Tier 3
  venue_collective: {
    id: 'venue_collective',
    name: 'Venue Worker Co-op',
    description: 'Transform venues into worker-owned cooperatives',
    tier: PathTier.EXPANSION,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 75, fans: 1000 },
    permanent: true,
    effects: {
      modifiers: {
        venueRentMultiplier: 0.5,
        bandHappinessModifier: 0.4
      },
      unlocks: {
        venueTypes: ['WORKER_COOP']
      }
    },
    satiricalFlavor: "The bartenders now vote on which bands play"
  },

  mutual_aid: {
    id: 'mutual_aid',
    name: 'Mutual Aid Network',
    description: 'Build support systems beyond just music',
    tier: PathTier.EXPANSION,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 80 },
    effects: {
      modifiers: {
        fanGrowthRate: 1.25,
        reputationGrowthRate: 1.3
      },
      unlocks: {
        features: ['benefit_shows', 'community_support']
      }
    },
    satiricalFlavor: "Food Not Bombs meets Bands Not Bummers"
  },

  // DIY Collective Tier 4
  abolish_headliners: {
    id: 'abolish_headliners',
    name: 'Abolish Headliners',
    description: 'All bands play equal time, get equal pay',
    tier: PathTier.IDEOLOGY,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 100 },
    permanent: true,
    conflicts: ['pay_to_play'],
    effects: {
      modifiers: {
        bandHappinessModifier: 0.5,
        ticketPriceMultiplier: 0.7
      },
      restrictions: {
        maxTicketPrice: 20
      }
    },
    satiricalFlavor: "Alphabetical order is the only fair way"
  },

  no_corporate_venues: {
    id: 'no_corporate_venues',
    name: 'No Corporate Venues',
    description: 'Boycott all corporate-owned spaces',
    tier: PathTier.IDEOLOGY,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 120 },
    permanent: true,
    effects: {
      restrictions: {
        bannedVenueTypes: ['CORPORATE_VENUE', 'ARENA', 'AMPHITHEATER']
      },
      modifiers: {
        reputationGrowthRate: 1.5,
        fanGrowthRate: 0.8
      }
    },
    satiricalFlavor: "Live Nation? More like Dead Corporation"
  },

  // DIY Collective Tier 5
  autonomous_zone: {
    id: 'autonomous_zone',
    name: 'Autonomous Music Zone',
    description: 'Create a completely independent music ecosystem',
    tier: PathTier.ULTIMATE,
    path: ProgressionPath.DIY_COLLECTIVE,
    requirements: { reputation: 200, fans: 5000 },
    permanent: true,
    effects: {
      modifiers: {
        ticketPriceMultiplier: 0.5,
        bandHappinessModifier: 0.6,
        reputationGrowthRate: 2.0
      },
      unlocks: {
        features: ['commune_mode', 'barter_economy']
      }
    },
    satiricalFlavor: "We don't need roads where we're going"
  },

  // Corporate Path Tier 1
  professional_booking: {
    id: 'professional_booking',
    name: 'Professional Booking Agency',
    description: 'Hire professionals to maximize profits',
    tier: PathTier.FOUNDATION,
    path: ProgressionPath.CORPORATE,
    effects: {
      modifiers: {
        ticketPriceMultiplier: 1.3,
        bandHappinessModifier: -0.1
      },
      immediate: {
        money: -500
      }
    },
    satiricalFlavor: "They wear suits to punk shows"
  },

  exclusive_contracts: {
    id: 'exclusive_contracts',
    name: 'Exclusive Band Contracts',
    description: 'Lock bands into multi-show deals',
    tier: PathTier.FOUNDATION,
    path: ProgressionPath.CORPORATE,
    conflicts: ['professional_booking'],
    effects: {
      modifiers: {
        bandHappinessModifier: -0.2,
        venueRentMultiplier: 0.9
      },
      unlocks: {
        features: ['contract_system']
      }
    },
    satiricalFlavor: "360 deals but for basement shows"
  },

  // Corporate Path Tier 2
  vip_packages: {
    id: 'vip_packages',
    name: 'VIP Experience Packages',
    description: 'Sell meet-and-greets and exclusive merch',
    tier: PathTier.ORGANIZATION,
    path: ProgressionPath.CORPORATE,
    requirements: { money: 1000 },
    effects: {
      modifiers: {
        ticketPriceMultiplier: 1.5
      },
      unlocks: {
        features: ['vip_tickets']
      },
      restrictions: {
        maxTicketPrice: 100
      }
    },
    satiricalFlavor: "$200 to awkwardly stand near the band"
  },

  corporate_sponsors: {
    id: 'corporate_sponsors',
    name: 'Corporate Sponsorships',
    description: 'Partner with brands for show funding',
    tier: PathTier.ORGANIZATION,
    path: ProgressionPath.CORPORATE,
    requirements: { fans: 1000 },
    effects: {
      immediate: {
        money: 2000
      },
      modifiers: {
        reputationGrowthRate: 0.7,
        fanGrowthRate: 1.2
      }
    },
    satiricalFlavor: "This breakdown is brought to you by Monster Energy!"
  },

  // Corporate Path Tier 3
  ticketing_fees: {
    id: 'ticketing_fees',
    name: 'Convenience Fees',
    description: 'Add mysterious fees to every ticket',
    tier: PathTier.EXPANSION,
    path: ProgressionPath.CORPORATE,
    requirements: { money: 3000 },
    permanent: true,
    effects: {
      modifiers: {
        ticketPriceMultiplier: 1.4,
        fanGrowthRate: 0.9
      }
    },
    satiricalFlavor: "$5 processing fee to process the processing"
  },

  venue_monopoly: {
    id: 'venue_monopoly',
    name: 'Venue Acquisition',
    description: 'Start buying out independent venues',
    tier: PathTier.EXPANSION,
    path: ProgressionPath.CORPORATE,
    requirements: { money: 5000 },
    effects: {
      modifiers: {
        venueRentMultiplier: 0.6
      },
      unlocks: {
        features: ['venue_ownership']
      }
    },
    satiricalFlavor: "If you can't beat them, buy them"
  },

  // Corporate Path Tier 4
  pay_to_play: {
    id: 'pay_to_play',
    name: 'Pay-to-Play System',
    description: 'Bands must sell tickets or pay to perform',
    tier: PathTier.IDEOLOGY,
    path: ProgressionPath.CORPORATE,
    requirements: { money: 10000 },
    permanent: true,
    conflicts: ['abolish_headliners'],
    effects: {
      modifiers: {
        bandHappinessModifier: -0.4,
        ticketPriceMultiplier: 1.6
      }
    },
    satiricalFlavor: "Dreams are free but stage time costs $300"
  },

  data_driven: {
    id: 'data_driven',
    name: 'Algorithm-Based Booking',
    description: 'Let AI decide which bands will sell',
    tier: PathTier.IDEOLOGY,
    path: ProgressionPath.CORPORATE,
    requirements: { fans: 10000 },
    effects: {
      modifiers: {
        fanGrowthRate: 1.4,
        reputationGrowthRate: 0.5
      },
      unlocks: {
        features: ['ai_booking', 'trend_analysis']
      }
    },
    satiricalFlavor: "The algorithm says ska is coming back"
  },

  // Corporate Path Tier 5
  music_monopoly: {
    id: 'music_monopoly',
    name: 'Total Scene Control',
    description: 'Control every aspect of the local music ecosystem',
    tier: PathTier.ULTIMATE,
    path: ProgressionPath.CORPORATE,
    requirements: { money: 50000, fans: 20000 },
    permanent: true,
    effects: {
      modifiers: {
        ticketPriceMultiplier: 2.0,
        bandHappinessModifier: -0.6,
        fanGrowthRate: 1.5,
        reputationGrowthRate: 0.1
      },
      unlocks: {
        features: ['monopoly_mode', 'market_manipulation']
      }
    },
    satiricalFlavor: "We are become Live Nation, destroyer of scenes"
  }
};

interface ProgressionState {
  currentPath: ProgressionPath;
  currentTier: PathTier;
  unlockedChoices: string[];
  lockedIn: boolean;
}

export class ProgressionPathSystem {
  private state: ProgressionState = {
    currentPath: ProgressionPath.NONE,
    currentTier: PathTier.FOUNDATION,
    unlockedChoices: [],
    lockedIn: false
  };

  // Check if the progression system is unlocked
  isUnlocked(gameStats: { fans: number; reputation: number; totalShows: number }): boolean {
    return gameStats.fans >= 500 || gameStats.reputation >= 50 || gameStats.totalShows >= 10;
  }

  // Get unlock requirements and progress
  getUnlockRequirements(gameStats: { fans: number; reputation: number; totalShows: number }) {
    const requirements = [
      { 
        name: 'Build a Following', 
        description: 'Reach 500 fans',
        current: gameStats.fans,
        required: 500,
        met: gameStats.fans >= 500
      },
      { 
        name: 'Earn Respect', 
        description: 'Reach 50 reputation',
        current: gameStats.reputation,
        required: 50,
        met: gameStats.reputation >= 50
      },
      { 
        name: 'Prove Yourself', 
        description: 'Complete 10 shows',
        current: gameStats.totalShows,
        required: 10,
        met: gameStats.totalShows >= 10
      }
    ];

    return {
      requirements,
      isUnlocked: requirements.some(r => r.met),
      description: "Choose your path when you've proven yourself in the scene"
    };
  }

  // Choose a progression path
  choosePath(path: ProgressionPath): boolean {
    if (this.state.currentPath !== ProgressionPath.NONE) {
      return false; // Already chosen
    }

    if (path === ProgressionPath.NONE) {
      return false; // Invalid choice
    }

    this.state.currentPath = path;
    this.state.lockedIn = true;
    return true;
  }

  // Get available choices for current tier
  getAvailableChoices(): PathChoice[] {
    if (this.state.currentPath === ProgressionPath.NONE) {
      return [];
    }

    const store = useGameStore.getState();
    
    return Object.values(PATH_CHOICES).filter(choice => {
      // Must match current path
      if (choice.path !== this.state.currentPath) return false;
      
      // Must match current tier
      if (choice.tier !== this.state.currentTier) return false;
      
      // Must not already be unlocked
      if (this.state.unlockedChoices.includes(choice.id)) return false;
      
      // Check requirements
      if (choice.requirements) {
        if (choice.requirements.reputation && store.reputation < choice.requirements.reputation) return false;
        if (choice.requirements.fans && store.fans < choice.requirements.fans) return false;
        if (choice.requirements.money && store.money < choice.requirements.money) return false;
        if (choice.requirements.previousChoice && !this.state.unlockedChoices.includes(choice.requirements.previousChoice)) return false;
      }
      
      // Check conflicts
      if (choice.conflicts) {
        for (const conflictId of choice.conflicts) {
          if (this.state.unlockedChoices.includes(conflictId)) return false;
        }
      }
      
      return true;
    });
  }

  // Make a choice
  makeChoice(choiceId: string): boolean {
    const choice = PATH_CHOICES[choiceId];
    if (!choice) return false;

    // Verify it's available
    const available = this.getAvailableChoices();
    if (!available.find(c => c.id === choiceId)) return false;

    // Apply immediate effects
    if (choice.effects.immediate) {
      const store = useGameStore.getState();
      if (choice.effects.immediate.money) store.addMoney(choice.effects.immediate.money);
      if (choice.effects.immediate.reputation) store.addReputation(choice.effects.immediate.reputation);
      if (choice.effects.immediate.fans) store.addFans(choice.effects.immediate.fans);
      if (choice.effects.immediate.stress) store.addStress(choice.effects.immediate.stress);
    }

    // Record the choice
    this.state.unlockedChoices.push(choiceId);

    // Check if we should advance tier
    const currentTierChoices = Object.values(PATH_CHOICES).filter(
      c => c.path === this.state.currentPath && c.tier === this.state.currentTier
    );
    const unlockedInTier = currentTierChoices.filter(
      c => this.state.unlockedChoices.includes(c.id)
    );

    // Advance tier if we've made at least one choice in current tier
    if (unlockedInTier.length >= 1 && this.state.currentTier < PathTier.ULTIMATE) {
      this.state.currentTier++;
    }

    return true;
  }

  // Get all active effects from chosen path
  getCurrentEffects() {
    const modifiers = {
      ticketPriceMultiplier: 1.0,
      bandHappinessModifier: 0,
      venueRentMultiplier: 1.0,
      fanGrowthRate: 1.0,
      reputationGrowthRate: 1.0
    };

    const unlocks = {
      venueTypes: [] as string[],
      equipment: [] as string[],
      features: [] as string[]
    };

    const restrictions = {
      maxTicketPrice: undefined as number | undefined,
      bannedVenueTypes: [] as string[],
      maxVenueCapacity: undefined as number | undefined
    };

    // Aggregate all effects from unlocked choices
    for (const choiceId of this.state.unlockedChoices) {
      const choice = PATH_CHOICES[choiceId];
      if (!choice) continue;

      // Apply modifiers
      if (choice.effects.modifiers) {
        if (choice.effects.modifiers.ticketPriceMultiplier !== undefined) {
          modifiers.ticketPriceMultiplier *= choice.effects.modifiers.ticketPriceMultiplier;
        }
        if (choice.effects.modifiers.bandHappinessModifier !== undefined) {
          modifiers.bandHappinessModifier += choice.effects.modifiers.bandHappinessModifier;
        }
        if (choice.effects.modifiers.venueRentMultiplier !== undefined) {
          modifiers.venueRentMultiplier *= choice.effects.modifiers.venueRentMultiplier;
        }
        if (choice.effects.modifiers.fanGrowthRate !== undefined) {
          modifiers.fanGrowthRate *= choice.effects.modifiers.fanGrowthRate;
        }
        if (choice.effects.modifiers.reputationGrowthRate !== undefined) {
          modifiers.reputationGrowthRate *= choice.effects.modifiers.reputationGrowthRate;
        }
      }

      // Apply unlocks
      if (choice.effects.unlocks) {
        if (choice.effects.unlocks.venueTypes) {
          unlocks.venueTypes.push(...choice.effects.unlocks.venueTypes);
        }
        if (choice.effects.unlocks.equipment) {
          unlocks.equipment.push(...choice.effects.unlocks.equipment);
        }
        if (choice.effects.unlocks.features) {
          unlocks.features.push(...choice.effects.unlocks.features);
        }
      }

      // Apply restrictions
      if (choice.effects.restrictions) {
        if (choice.effects.restrictions.maxTicketPrice !== undefined) {
          if (restrictions.maxTicketPrice === undefined || choice.effects.restrictions.maxTicketPrice < restrictions.maxTicketPrice) {
            restrictions.maxTicketPrice = choice.effects.restrictions.maxTicketPrice;
          }
        }
        if (choice.effects.restrictions.bannedVenueTypes) {
          restrictions.bannedVenueTypes.push(...choice.effects.restrictions.bannedVenueTypes);
        }
        if (choice.effects.restrictions.maxVenueCapacity !== undefined) {
          if (restrictions.maxVenueCapacity === undefined || choice.effects.restrictions.maxVenueCapacity < restrictions.maxVenueCapacity) {
            restrictions.maxVenueCapacity = choice.effects.restrictions.maxVenueCapacity;
          }
        }
      }
    }

    return { modifiers, unlocks, restrictions };
  }

  // Get current progression state
  getProgression(): ProgressionState {
    return { ...this.state };
  }

  // Serialize for save/load
  serialize(): string {
    return JSON.stringify(this.state);
  }

  // Deserialize from save
  deserialize(data: string): void {
    try {
      this.state = JSON.parse(data);
    } catch (e) {
      console.error('Failed to deserialize progression state:', e);
    }
  }
}

export const progressionPathSystem = new ProgressionPathSystem();
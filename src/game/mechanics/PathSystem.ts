// Path system - DIY vs Corporate moral choices


// Simplified game state interface for path system
export interface PathGameState {
  money: number;
  reputation: number;
  authenticity: number;
  stress: number;
  diyPoints: number;
  pathAlignment: PathAlignment;
  pathChoices: string[];
}

export enum PathAlignment {
  PURE_DIY = 'PURE_DIY',
  DIY_LEANING = 'DIY_LEANING', 
  BALANCED = 'BALANCED',
  CORPORATE_LEANING = 'CORPORATE_LEANING',
  FULL_SELLOUT = 'FULL_SELLOUT'
}

export interface PathChoice {
  id: string;
  name: string;
  description: string;
  category: 'venue' | 'show' | 'band' | 'sponsor' | 'festival';
  diyPoints: number; // Negative for corporate choices
  immediateEffects: {
    money?: number;
    reputation?: number;
    authenticity?: number;
    stress?: number;
  };
  longTermEffects: {
    sceneReaction?: 'positive' | 'negative' | 'mixed';
    unlocksVenues?: string[];
    unlocksBands?: string[];
    locksOut?: string[]; // Things you can't access after this choice
  };
  requirements?: {
    minReputation?: number;
    minMoney?: number;
    pathAlignment?: PathAlignment[];
  };
}

export const PATH_CHOICES: PathChoice[] = [
  // Venue Choices
  {
    id: 'accept_bar_sponsorship',
    name: 'Accept Bar Sponsorship',
    description: 'Let Pabst Blue Ribbon sponsor your venue for steady income',
    category: 'venue',
    diyPoints: -10,
    immediateEffects: {
      money: 500,
      authenticity: -10
    },
    longTermEffects: {
      sceneReaction: 'mixed',
      unlocksVenues: ['sponsored_venue']
    }
  },
  {
    id: 'refuse_noise_ordinance',
    name: 'Refuse Noise Ordinance',
    description: 'Keep playing loud despite neighbor complaints',
    category: 'venue',
    diyPoints: 15,
    immediateEffects: {
      reputation: 10,
      authenticity: 15,
      stress: 10
    },
    longTermEffects: {
      sceneReaction: 'positive',
      locksOut: ['city_permit_venues']
    }
  },
  
  // Show Choices
  {
    id: 'livestream_partnership',
    name: 'Livestream Partnership',
    description: 'Partner with streaming platform for show broadcasts',
    category: 'show',
    diyPoints: -20,
    immediateEffects: {
      money: 1000,
      reputation: 20,
      authenticity: -20
    },
    longTermEffects: {
      sceneReaction: 'negative',
      unlocksVenues: ['streaming_studio']
    }
  },
  {
    id: 'all_ages_only',
    name: 'All Ages Only Policy',
    description: 'Commit to only booking all-ages shows',
    category: 'show',
    diyPoints: 25,
    immediateEffects: {
      money: -200,
      reputation: 15,
      authenticity: 30
    },
    longTermEffects: {
      sceneReaction: 'positive',
      unlocksBands: ['youth_crew_bands']
    }
  },
  
  // Band Choices
  {
    id: 'sign_distribution_deal',
    name: 'Sign Distribution Deal',
    description: 'Help a band sign with major label subsidiary',
    category: 'band',
    diyPoints: -30,
    immediateEffects: {
      money: 2000,
      reputation: -10,
      authenticity: -25
    },
    longTermEffects: {
      sceneReaction: 'negative',
      locksOut: ['diy_purist_bands']
    }
  },
  {
    id: 'start_collective',
    name: 'Start Booking Collective',
    description: 'Form a cooperative booking collective',
    category: 'band',
    diyPoints: 30,
    immediateEffects: {
      money: -500,
      reputation: 25,
      authenticity: 35,
      stress: -10
    },
    longTermEffects: {
      sceneReaction: 'positive',
      unlocksBands: ['collective_bands'],
      unlocksVenues: ['collective_spaces']
    }
  },
  
  // Sponsor Choices
  {
    id: 'energy_drink_sponsor',
    name: 'Energy Drink Sponsorship',
    description: 'Monster Energy wants to sponsor your shows',
    category: 'sponsor',
    diyPoints: -40,
    immediateEffects: {
      money: 5000,
      reputation: 30,
      authenticity: -40
    },
    longTermEffects: {
      sceneReaction: 'negative',
      unlocksVenues: ['corporate_venues'],
      locksOut: ['diy_spaces']
    }
  },
  {
    id: 'mutual_aid_fund',
    name: 'Start Mutual Aid Fund',
    description: 'Create a fund to help struggling bands and venues',
    category: 'sponsor',
    diyPoints: 40,
    immediateEffects: {
      money: -1000,
      reputation: 30,
      authenticity: 50
    },
    longTermEffects: {
      sceneReaction: 'positive',
      unlocksBands: ['activist_bands']
    }
  },
  
  // Festival Choices
  {
    id: 'vip_packages',
    name: 'Introduce VIP Packages',
    description: 'Sell expensive VIP festival experiences',
    category: 'festival',
    diyPoints: -50,
    immediateEffects: {
      money: 10000,
      reputation: -20,
      authenticity: -50
    },
    longTermEffects: {
      sceneReaction: 'negative',
      unlocksVenues: ['vip_areas']
    },
    requirements: {
      minReputation: 300
    }
  },
  {
    id: 'pay_what_you_can',
    name: 'Pay What You Can Festival',
    description: 'Make festival accessible to everyone',
    category: 'festival',
    diyPoints: 50,
    immediateEffects: {
      money: -5000,
      reputation: 50,
      authenticity: 60
    },
    longTermEffects: {
      sceneReaction: 'positive',
      unlocksBands: ['legendary_diy_bands']
    },
    requirements: {
      minReputation: 300
    }
  }
];

// Path-based festival variations
export interface PathFestival {
  id: string;
  name: string;
  pathAlignment: PathAlignment;
  description: string;
  characteristics: string[];
  capacity: number;
  sponsorTypes: string[];
  ticketPriceRange: { min: number; max: number };
  authenticityModifier: number;
  profitModifier: number;
}

export const PATH_FESTIVALS: PathFestival[] = [
  {
    id: 'diy_or_die_fest',
    name: 'DIY or Die Festival',
    pathAlignment: PathAlignment.PURE_DIY,
    description: 'A purely DIY festival with no corporate involvement',
    characteristics: [
      'All Ages',
      'Donation Based',
      'Community Run',
      'No Sponsors',
      'Mutual Aid Tables'
    ],
    capacity: 5000,
    sponsorTypes: [],
    ticketPriceRange: { min: 0, max: 25 },
    authenticityModifier: 2.0,
    profitModifier: 0.3
  },
  {
    id: 'underground_united',
    name: 'Underground United',
    pathAlignment: PathAlignment.DIY_LEANING,
    description: 'Mostly DIY with minimal ethical sponsorships',
    characteristics: [
      'Local Business Sponsors',
      'Sliding Scale Tickets',
      'Community Vendors',
      'Harm Reduction',
    ],
    capacity: 8000,
    sponsorTypes: ['local_business', 'record_labels'],
    ticketPriceRange: { min: 20, max: 60 },
    authenticityModifier: 1.5,
    profitModifier: 0.7
  },
  {
    id: 'crossroads_festival',
    name: 'Crossroads Festival',
    pathAlignment: PathAlignment.BALANCED,
    description: 'A mix of underground and mainstream elements',
    characteristics: [
      'Mixed Sponsorships',
      'Tiered Pricing',
      'Some VIP Areas',
      'Diverse Lineup'
    ],
    capacity: 12000,
    sponsorTypes: ['local_business', 'music_brands', 'streaming'],
    ticketPriceRange: { min: 50, max: 150 },
    authenticityModifier: 1.0,
    profitModifier: 1.0
  },
  {
    id: 'sponsored_showcase',
    name: 'Sponsored Showcase',
    pathAlignment: PathAlignment.CORPORATE_LEANING,
    description: 'Corporate sponsored but retaining some underground cred',
    characteristics: [
      'Major Sponsors',
      'VIP Experiences',
      'Brand Activations',
      'Media Partnerships'
    ],
    capacity: 20000,
    sponsorTypes: ['energy_drinks', 'alcohol', 'tech_companies', 'fashion'],
    ticketPriceRange: { min: 80, max: 300 },
    authenticityModifier: 0.5,
    profitModifier: 2.0
  },
  {
    id: 'corporate_music_fest',
    name: 'Corporate Music Festival',
    pathAlignment: PathAlignment.FULL_SELLOUT,
    description: 'Full SxSW-style corporate music festival',
    characteristics: [
      'Platinum Sponsors',
      'Luxury VIP',
      'Brand Everywhere',
      'Industry Focus',
      'Influencer Areas'
    ],
    capacity: 30000,
    sponsorTypes: ['mega_corps', 'banks', 'crypto', 'luxury_brands'],
    ticketPriceRange: { min: 200, max: 1000 },
    authenticityModifier: 0.1,
    profitModifier: 5.0
  }
];

// Calculate current path alignment based on choices
export function calculatePathAlignment(diyPoints: number): PathAlignment {
  if (typeof diyPoints !== 'number' || isNaN(diyPoints)) {
    prodLog.error('Invalid DIY points value:', diyPoints);
    return PathAlignment.BALANCED;
  }
  
  if (diyPoints >= 100) return PathAlignment.PURE_DIY;
  if (diyPoints >= 25) return PathAlignment.DIY_LEANING;
  if (diyPoints >= -25) return PathAlignment.BALANCED;
  if (diyPoints >= -100) return PathAlignment.CORPORATE_LEANING;
  return PathAlignment.FULL_SELLOUT;
}

// Get available path choices based on current state
export function getAvailablePathChoices(
  gameState: PathGameState,
  pastChoices: string[]
): PathChoice[] {
  if (!gameState) {
    prodLog.error('Game state is required for path choices');
    return [];
  }
  
  if (!Array.isArray(pastChoices)) {
    prodLog.error('Past choices must be an array');
    pastChoices = [];
  }
  
  return PATH_CHOICES.filter(choice => {
    // Don't show already made choices
    if (pastChoices.includes(choice.id)) return false;
    
    // Check requirements
    if (choice.requirements) {
      const req = choice.requirements;
      if (req.minReputation && gameState.reputation < req.minReputation) return false;
      if (req.minMoney && gameState.money < req.minMoney) return false;
      if (req.pathAlignment && !req.pathAlignment.includes(gameState.pathAlignment)) return false;
    }
    
    return true;
  });
}

// Apply path choice effects
export function applyPathChoice(
  choice: PathChoice,
  gameState: PathGameState
): PathGameState {
  if (!choice || !gameState) {
    throw new Error('Choice and game state are required');
  }
  
  const newState = { ...gameState };
  
  // Apply immediate effects
  if (choice.immediateEffects.money) {
    newState.money += choice.immediateEffects.money;
  }
  if (choice.immediateEffects.reputation) {
    newState.reputation += choice.immediateEffects.reputation;
  }
  if (choice.immediateEffects.authenticity) {
    newState.authenticity = Math.max(0, Math.min(100, 
      (newState.authenticity || 50) + choice.immediateEffects.authenticity
    ));
  }
  if (choice.immediateEffects.stress) {
    newState.stress += choice.immediateEffects.stress;
  }
  
  // Update DIY points
  newState.diyPoints = (newState.diyPoints || 0) + choice.diyPoints;
  newState.pathAlignment = calculatePathAlignment(newState.diyPoints);
  
  // Track choice
  newState.pathChoices = [...(newState.pathChoices || []), choice.id];
  
  return newState;
}

// Get the appropriate final festival based on path
export function getFinalFestival(pathAlignment: PathAlignment): PathFestival {
  return PATH_FESTIVALS.find(f => f.pathAlignment === pathAlignment) || PATH_FESTIVALS[2]; // Default to balanced
}

// Calculate scene reaction to player's path
export function calculateSceneReaction(diyPoints: number): {
  diyFaction: number; // -100 to 100
  corporateFaction: number; // -100 to 100
  neutralFaction: number; // -100 to 100
} {
  // DIY faction loves positive points, hates negative
  const diyFaction = Math.max(-100, Math.min(100, diyPoints));
  
  // Corporate faction is opposite
  const corporateFaction = Math.max(-100, Math.min(100, -diyPoints));
  
  // Neutral faction prefers balance
  const neutralFaction = Math.max(-100, Math.min(100, 100 - Math.abs(diyPoints)));
  
  return { diyFaction, corporateFaction, neutralFaction };
}
// Festival end-game system

import { Band, Venue, VenueType, Show, Genre } from '@game/types/core';

interface FestivalGameState {
  reputation: number;
  fans: number;
  connections: number;
  showHistory: unknown[];
  rosterBandIds: string[];
  venues: Venue[];
  allBands: Band[];
}

export interface Festival {
  id: string;
  name: string;
  tier: FestivalTier;
  capacity: number;
  stages: FestivalStage[];
  requirements: FestivalRequirements;
  baseCost: number;
  reputationRequired: number;
  description: string;
  unlocked: boolean;
}

export enum FestivalTier {
  MICRO = 'MICRO',      // 500-1000 capacity
  SMALL = 'SMALL',      // 1000-3000 capacity  
  MEDIUM = 'MEDIUM',    // 3000-5000 capacity
  LARGE = 'LARGE',      // 5000-10000 capacity
  MEGA = 'MEGA'         // 10000+ capacity
}

export interface FestivalStage {
  id: string;
  name: string;
  capacity: number;
  slots: number; // Number of bands that can play
  genrePreference?: Genre[];
}

export interface FestivalRequirements {
  minReputation: number;
  minFans: number;
  minConnections: number;
  minShowsHosted: number;
  minBandsInRoster: number;
  requiredVenueTypes?: VenueType[];
  requiredGenreDiversity?: number; // Number of different genres
}

export interface FestivalLineup {
  festivalId: string;
  headliners: Band[]; // Main stage headliners
  stages: {
    stageId: string;
    bands: Band[];
  }[];
  totalBands: number;
  genreDiversity: string[];
}

export interface FestivalResult {
  festivalId: string;
  success: boolean;
  attendance: number;
  revenue: number;
  costs: number;
  profit: number;
  reputationGain: number;
  fansGained: number;
  connectionsGained: number;
  mediaAttention: number; // Affects future opportunities
  incidents: string[];
  unlockedContent?: {
    bands?: Band[];
    venues?: Venue[];
    festivals?: Festival[];
  };
}

// Festival definitions
export const FESTIVALS: Festival[] = [
  {
    id: 'backyard_fest',
    name: 'Backyard Fest',
    tier: FestivalTier.MICRO,
    capacity: 500,
    stages: [
      {
        id: 'main',
        name: 'Main Stage',
        capacity: 500,
        slots: 8
      }
    ],
    requirements: {
      minReputation: 50,
      minFans: 500,
      minConnections: 20,
      minShowsHosted: 10,
      minBandsInRoster: 5,
      requiredGenreDiversity: 2
    },
    baseCost: 2000,
    reputationRequired: 50,
    description: 'A DIY festival in someone\'s backyard',
    unlocked: false
  },
  {
    id: 'warehouse_weekend',
    name: 'Warehouse Weekend',
    tier: FestivalTier.SMALL,
    capacity: 1500,
    stages: [
      {
        id: 'main',
        name: 'Main Stage',
        capacity: 1000,
        slots: 10
      },
      {
        id: 'side',
        name: 'Side Stage',
        capacity: 500,
        slots: 8
      }
    ],
    requirements: {
      minReputation: 150,
      minFans: 2000,
      minConnections: 50,
      minShowsHosted: 25,
      minBandsInRoster: 10,
      requiredVenueTypes: [VenueType.WAREHOUSE],
      requiredGenreDiversity: 3
    },
    baseCost: 5000,
    reputationRequired: 150,
    description: 'Multi-day warehouse festival',
    unlocked: false
  },
  {
    id: 'underground_united',
    name: 'Underground United',
    tier: FestivalTier.MEDIUM,
    capacity: 4000,
    stages: [
      {
        id: 'main',
        name: 'Main Stage',
        capacity: 2000,
        slots: 12,
        genrePreference: [Genre.PUNK, Genre.HARDCORE]
      },
      {
        id: 'metal',
        name: 'Metal Stage',
        capacity: 1500,
        slots: 10,
        genrePreference: [Genre.METAL]
      },
      {
        id: 'experimental',
        name: 'Experimental Stage',
        capacity: 500,
        slots: 8,
        genrePreference: [Genre.EXPERIMENTAL, Genre.NOISE]
      }
    ],
    requirements: {
      minReputation: 300,
      minFans: 5000,
      minConnections: 100,
      minShowsHosted: 50,
      minBandsInRoster: 20,
      requiredVenueTypes: [VenueType.WAREHOUSE, VenueType.UNDERGROUND],
      requiredGenreDiversity: 4
    },
    baseCost: 15000,
    reputationRequired: 300,
    description: 'The underground scene comes together',
    unlocked: false
  },
  {
    id: 'riot_fest_tribute',
    name: 'Riot Fest Tribute',
    tier: FestivalTier.LARGE,
    capacity: 8000,
    stages: [
      {
        id: 'main',
        name: 'Riot Stage',
        capacity: 4000,
        slots: 15
      },
      {
        id: 'roots',
        name: 'Roots Stage',
        capacity: 2000,
        slots: 12
      },
      {
        id: 'rebel',
        name: 'Rebel Stage',
        capacity: 1500,
        slots: 10
      },
      {
        id: 'rise',
        name: 'Rise Stage',
        capacity: 500,
        slots: 8
      }
    ],
    requirements: {
      minReputation: 500,
      minFans: 10000,
      minConnections: 200,
      minShowsHosted: 100,
      minBandsInRoster: 40,
      requiredGenreDiversity: 5
    },
    baseCost: 50000,
    reputationRequired: 500,
    description: 'A proper punk rock festival',
    unlocked: false
  },
  {
    id: 'underground_apocalypse',
    name: 'Underground Apocalypse',
    tier: FestivalTier.MEGA,
    capacity: 15000,
    stages: [
      {
        id: 'apocalypse',
        name: 'Apocalypse Stage',
        capacity: 8000,
        slots: 20
      },
      {
        id: 'chaos',
        name: 'Chaos Stage',
        capacity: 4000,
        slots: 15
      },
      {
        id: 'anarchy',
        name: 'Anarchy Stage',
        capacity: 2000,
        slots: 12
      },
      {
        id: 'underground',
        name: 'Underground Stage',
        capacity: 1000,
        slots: 10
      }
    ],
    requirements: {
      minReputation: 1000,
      minFans: 25000,
      minConnections: 500,
      minShowsHosted: 200,
      minBandsInRoster: 75,
      requiredGenreDiversity: 6
    },
    baseCost: 150000,
    reputationRequired: 1000,
    description: 'The ultimate underground music festival',
    unlocked: false
  }
];

// Check if a festival is available to the player
export function checkFestivalRequirements(
  festival: Festival,
  gameState: FestivalGameState
): boolean {
  const req = festival.requirements;
  
  if (gameState.reputation < req.minReputation) return false;
  if (gameState.fans < req.minFans) return false;
  if (gameState.connections < req.minConnections) return false;
  if (gameState.showHistory.length < req.minShowsHosted) return false;
  if (gameState.rosterBandIds.length < req.minBandsInRoster) return false;
  
  // Check venue type requirements
  if (req.requiredVenueTypes) {
    const venueTypes = new Set(gameState.venues.map((v: Venue) => v.type));
    const hasAllTypes = req.requiredVenueTypes.every(type => venueTypes.has(type));
    if (!hasAllTypes) return false;
  }
  
  // Check genre diversity
  if (req.requiredGenreDiversity) {
    const genres = new Set(gameState.allBands
      .filter((b: Band) => gameState.rosterBandIds.includes(b.id))
      .map((b: Band) => b.genre)
    );
    if (genres.size < req.requiredGenreDiversity) return false;
  }
  
  return true;
}

// Calculate festival costs including all factors
export function calculateFestivalCosts(
  festival: Festival,
  lineup: FestivalLineup
): number {
  let totalCost = festival.baseCost;
  
  // Band fees (bigger bands cost more)
  lineup.stages.forEach(stage => {
    stage.bands.forEach(band => {
      const bandFee = 100 + (band.popularity * 10);
      totalCost += bandFee;
    });
  });
  
  // Headliner fees are higher
  lineup.headliners.forEach(band => {
    const headlinerFee = 500 + (band.popularity * 20);
    totalCost += headlinerFee;
  });
  
  // Stage costs
  totalCost += festival.stages.length * 1000;
  
  // Security and infrastructure
  totalCost += Math.floor(festival.capacity * 2);
  
  return totalCost;
}

// Calculate festival results
export function calculateFestivalResults(
  festival: Festival,
  lineup: FestivalLineup,
  gameState: any
): FestivalResult {
  const costs = calculateFestivalCosts(festival, lineup);
  
  // Calculate attendance based on band popularity and diversity
  const avgPopularity = [...lineup.headliners, ...lineup.stages.flatMap(s => s.bands)]
    .reduce((sum, band) => sum + band.popularity, 0) / lineup.totalBands;
    
  const diversityBonus = lineup.genreDiversity.length * 0.1;
  const attendanceRate = Math.min(1, (avgPopularity / 100) + diversityBonus);
  const attendance = Math.floor(festival.capacity * attendanceRate * (0.8 + Math.random() * 0.4));
  
  // Revenue calculation
  const ticketPrice = 20 + (festival.tier === FestivalTier.MEGA ? 80 :
                            festival.tier === FestivalTier.LARGE ? 50 :
                            festival.tier === FestivalTier.MEDIUM ? 30 : 10);
  const revenue = attendance * ticketPrice;
  
  // Success metrics
  const profit = revenue - costs;
  const success = profit > 0 && attendance > festival.capacity * 0.6;
  
  // Gains
  const reputationGain = success ? festival.tier === FestivalTier.MEGA ? 200 :
                                   festival.tier === FestivalTier.LARGE ? 100 :
                                   festival.tier === FestivalTier.MEDIUM ? 50 : 25
                                 : -20;
  
  const fansGained = Math.floor(attendance * (success ? 0.3 : 0.1));
  const connectionsGained = Math.floor(lineup.totalBands * (success ? 2 : 0.5));
  const mediaAttention = success ? lineup.genreDiversity.length * 10 : 0;
  
  // Potential incidents
  const incidents: string[] = [];
  if (Math.random() < 0.2) incidents.push('Equipment malfunction on side stage');
  if (Math.random() < 0.1) incidents.push('Band no-show - had to reshuffle lineup');
  if (attendance > festival.capacity) incidents.push('Overcrowding issues');
  
  return {
    festivalId: festival.id,
    success,
    attendance,
    revenue,
    costs,
    profit,
    reputationGain,
    fansGained,
    connectionsGained,
    mediaAttention,
    incidents,
    unlockedContent: success && festival.tier === FestivalTier.MEGA ? {
      festivals: [FESTIVALS.find(f => f.tier === FestivalTier.MEGA)!]
    } : undefined
  };
}

// Get next available festival tier
export function getNextFestivalTier(completedFestivals: string[]): Festival | null {
  const completedTiers = completedFestivals
    .map(id => FESTIVALS.find(f => f.id === id))
    .filter(Boolean)
    .map(f => f!.tier);
    
  const tierOrder = [
    FestivalTier.MICRO,
    FestivalTier.SMALL,
    FestivalTier.MEDIUM,
    FestivalTier.LARGE,
    FestivalTier.MEGA
  ];
  
  for (const tier of tierOrder) {
    if (!completedTiers.includes(tier)) {
      return FESTIVALS.find(f => f.tier === tier) || null;
    }
  }
  
  return null;
}
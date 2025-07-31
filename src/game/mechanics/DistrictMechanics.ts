// District mechanics system - how districts affect gameplay

import { DistrictType, District } from '@game/types/core';
import { Show, ShowResult } from '@game/types/core';
import { Venue } from '@game/types/core';
import { isValidDistrict, normalizeDistrict } from '@game/utils/districtUtils';
import { GENTRIFICATION_CONSTANTS, GAME_LIMITS, DISTRICT_CONSTANTS } from '@game/constants/GameConstants';

import { devLog, prodLog } from '../../utils/devLogger';
export interface DistrictModifiers {
  // Show performance modifiers
  audienceMultiplier: number;      // Affects crowd size
  revenueMultiplier: number;       // Affects money earned
  authenticityBonus: number;       // Affects scene cred
  stressModifier: number;          // Affects stress gain/loss
  
  // Venue operation modifiers
  rentMultiplier: number;          // Affects venue costs
  policeRiskMultiplier: number;    // Affects police shutdown risk
  
  // Band compatibility
  preferredGenres: string[];       // Genres that do well here
  discouragedGenres: string[];     // Genres that struggle here
  
  // Special effects
  networkingBonus: number;         // Connection gain modifier
  gentrificationRate: number;      // How fast the district changes
}

// District-specific mechanics
export const DISTRICT_MODIFIERS: Record<DistrictType, DistrictModifiers> = {
  [DistrictType.WAREHOUSE]: {
    audienceMultiplier: 1.2,
    revenueMultiplier: 0.9,
    authenticityBonus: 15,
    stressModifier: -5,
    rentMultiplier: 0.7,
    policeRiskMultiplier: 1.5,
    preferredGenres: ['PUNK', 'HARDCORE', 'NOISE', 'EXPERIMENTAL'],
    discouragedGenres: ['INDIE'],
    networkingBonus: 1.3,
    gentrificationRate: 0.02
  },
  
  [DistrictType.DOWNTOWN]: {
    audienceMultiplier: 1.5,
    revenueMultiplier: 1.3,
    authenticityBonus: -10,
    stressModifier: 10,
    rentMultiplier: 1.5,
    policeRiskMultiplier: 0.5,
    preferredGenres: ['INDIE', 'GRUNGE'],
    discouragedGenres: ['PUNK', 'HARDCORE'],
    networkingBonus: 1.5,
    gentrificationRate: 0.05
  },
  
  [DistrictType.COLLEGE]: {
    audienceMultiplier: 1.3,
    revenueMultiplier: 0.8,
    authenticityBonus: 5,
    stressModifier: -10,
    rentMultiplier: 0.9,
    policeRiskMultiplier: 0.7,
    preferredGenres: ['INDIE', 'EXPERIMENTAL', 'PUNK'],
    discouragedGenres: ['METAL'],
    networkingBonus: 1.2,
    gentrificationRate: 0.01
  },
  
  [DistrictType.RESIDENTIAL]: {
    audienceMultiplier: 0.8,
    revenueMultiplier: 0.7,
    authenticityBonus: 20,
    stressModifier: -15,
    rentMultiplier: 0.5,
    policeRiskMultiplier: 2.0,
    preferredGenres: ['PUNK', 'HARDCORE', 'GRUNGE'],
    discouragedGenres: ['METAL', 'NOISE'],
    networkingBonus: 0.8,
    gentrificationRate: 0.03
  },
  
  [DistrictType.ARTS]: {
    audienceMultiplier: 1.1,
    revenueMultiplier: 1.0,
    authenticityBonus: 10,
    stressModifier: 0,
    rentMultiplier: 1.1,
    policeRiskMultiplier: 0.8,
    preferredGenres: ['EXPERIMENTAL', 'NOISE', 'INDIE'],
    discouragedGenres: ['HARDCORE'],
    networkingBonus: 1.4,
    gentrificationRate: 0.04
  }
};

// District events that can trigger
export interface DistrictEvent {
  id: string;
  name: string;
  description: string;
  districtType: DistrictType;
  probability: number; // 0-1
  effects: {
    rentChange?: number;
    policePresenceChange?: number;
    sceneStrengthChange?: number;
    gentrificationChange?: number;
  };
  duration: number; // turns
}

export const DISTRICT_EVENTS: DistrictEvent[] = [
  {
    id: 'police_crackdown',
    name: 'Police Crackdown',
    description: 'Increased police presence after noise complaints',
    districtType: DistrictType.WAREHOUSE,
    probability: 0.2,
    effects: {
      policePresenceChange: 30,
      sceneStrengthChange: -10
    },
    duration: 3
  },
  {
    id: 'art_walk',
    name: 'Monthly Art Walk',
    description: 'The arts district hosts its monthly event',
    districtType: DistrictType.ARTS,
    probability: 0.3,
    effects: {
      sceneStrengthChange: 10,
      gentrificationChange: 5
    },
    duration: 1
  },
  {
    id: 'student_break',
    name: 'Student Break',
    description: 'College students are on break',
    districtType: DistrictType.COLLEGE,
    probability: 0.25,
    effects: {
      sceneStrengthChange: -20
    },
    duration: 2
  },
  {
    id: 'developer_interest',
    name: 'Developer Interest',
    description: 'Real estate developers eye the neighborhood',
    districtType: DistrictType.WAREHOUSE,
    probability: 0.15,
    effects: {
      rentChange: 20,
      gentrificationChange: 15
    },
    duration: 4
  },
  {
    id: 'neighborhood_meeting',
    name: 'Neighborhood Meeting',
    description: 'Residents organize against noise',
    districtType: DistrictType.RESIDENTIAL,
    probability: 0.3,
    effects: {
      policePresenceChange: 20,
      sceneStrengthChange: -5
    },
    duration: 2
  }
];

// Apply district modifiers to show results
export function applyDistrictModifiers(
  show: Show,
  venue: Venue,
  baseResult: ShowResult,
  districtType: DistrictType
): ShowResult {
  const modifiers = DISTRICT_MODIFIERS[districtType];
  
  if (!modifiers) {
    prodLog.error(`Invalid district type: ${districtType}`);
    return baseResult; // Return unmodified result as fallback
  }
  
  if (!baseResult) {
    throw new Error('Base result is required for district modifiers');
  }
  
  // Apply audience modifier
  const audienceSize = Math.floor(baseResult.attendance * modifiers.audienceMultiplier);
  
  // Apply revenue modifier
  const revenue = Math.floor(baseResult.revenue * modifiers.revenueMultiplier);
  
  // Apply authenticity bonus
  const reputationGain = (baseResult.reputationGain || 0) + modifiers.authenticityBonus;
  
  // Apply stress modifier
  const stressGain = Math.max(0, (baseResult.stressGain || 0) + modifiers.stressModifier);
  
  // Apply networking bonus
  const connectionsGain = Math.floor((baseResult.connectionsGain || 0) * modifiers.networkingBonus);
  
  // Genre compatibility bonus/penalty
  let genreModifier = DISTRICT_CONSTANTS.GENRE_NEUTRAL;
  const showGenre = show.genre;
  if (showGenre) {
    if (modifiers.preferredGenres.includes(showGenre)) {
      genreModifier = DISTRICT_CONSTANTS.GENRE_MATCH_BONUS;
    } else if (modifiers.discouragedGenres.includes(showGenre)) {
      genreModifier = DISTRICT_CONSTANTS.GENRE_MISMATCH_PENALTY;
    }
  }
  
  return {
    ...baseResult,
    attendance: Math.floor(audienceSize * genreModifier),
    revenue: Math.floor(revenue * genreModifier),
    reputationGain: Math.floor(reputationGain * genreModifier),
    stressGain,
    connectionsGain,
    districtBonus: {
      type: districtType,
      description: getDistrictBonusDescription(districtType, genreModifier)
    }
  };
}

// Calculate police risk for a show
export function calculatePoliceRisk(
  venue: Venue,
  districtType: DistrictType,
  baseRisk: number
): number {
  const modifiers = DISTRICT_MODIFIERS[districtType];
  
  if (!modifiers) {
    prodLog.error(`Invalid district type: ${districtType}`);
    return baseRisk; // Return unmodified risk as fallback
  }
  
  const risk = baseRisk * modifiers.policeRiskMultiplier;
  return Math.max(0, Math.min(100, risk));
}

// Calculate venue rent with district modifier
export function calculateVenueRent(
  baseRent: number,
  districtType: DistrictType
): number {
  if (baseRent < 0) {
    prodLog.error(`Invalid base rent: ${baseRent}`);
    return 0;
  }
  
  const modifiers = DISTRICT_MODIFIERS[districtType];
  
  if (!modifiers) {
    prodLog.error(`Invalid district type: ${districtType}`);
    return baseRent; // Return unmodified rent as fallback
  }
  
  return Math.max(0, Math.floor(baseRent * modifiers.rentMultiplier));
}

// Get description of district bonus/penalty
function getDistrictBonusDescription(
  districtType: DistrictType,
  genreModifier: number
): string {
  const base = {
    [DistrictType.WAREHOUSE]: 'Warehouse District: Authentic underground vibes',
    [DistrictType.DOWNTOWN]: 'Downtown: High visibility, high costs',
    [DistrictType.COLLEGE]: 'College Town: Young, energetic crowd',
    [DistrictType.RESIDENTIAL]: 'Residential: Intimate but risky',
    [DistrictType.ARTS]: 'Arts District: Creative and connected'
  };
  
  const genreText = genreModifier > 1 ? ' (Genre match!)' : 
                    genreModifier < 1 ? ' (Genre mismatch)' : '';
  
  return base[districtType] + genreText;
}

// Check if a district event should trigger
export function checkDistrictEvents(
  districtType: DistrictType,
  currentTurn: number
): DistrictEvent | null {
  const relevantEvents = DISTRICT_EVENTS.filter(e => e.districtType === districtType);
  
  for (const event of relevantEvents) {
    if (Math.random() < event.probability) {
      return event;
    }
  }
  
  return null;
}

// Apply gentrification effects over time
export function applyGentrification(
  district: District,
  districtType: DistrictType
): District {
  if (!isValidDistrict(district)) {
    devLog.warn('Invalid district passed to applyGentrification');
    return normalizeDistrict(district);
  }
  
  const modifiers = DISTRICT_MODIFIERS[districtType];
  const gentrificationIncrease = modifiers.gentrificationRate * DISTRICT_CONSTANTS.GENTRIFICATION_RATE_MULTIPLIER;
  
  // Create new district object (immutable update)
  const updatedDistrict = { ...district };
  
  // Increase gentrification level
  updatedDistrict.gentrificationLevel = Math.min(
    GAME_LIMITS.MAX_GENTRIFICATION, 
    district.gentrificationLevel + gentrificationIncrease
  );
  
  // As gentrification increases:
  if (updatedDistrict.gentrificationLevel > GENTRIFICATION_CONSTANTS.GENTRIFICATION_THRESHOLD) {
    // Rent goes up (with max limit)
    updatedDistrict.rentMultiplier = Math.min(
      GENTRIFICATION_CONSTANTS.MAX_RENT_MULTIPLIER,
      district.rentMultiplier * GENTRIFICATION_CONSTANTS.RENT_INCREASE_RATE
    );
    
    // Police presence increases slightly
    updatedDistrict.policePresence = Math.min(
      GAME_LIMITS.MAX_POLICE_PRESENCE,
      district.policePresence + GENTRIFICATION_CONSTANTS.POLICE_PRESENCE_INCREASE
    );
    
    // Scene strength decreases
    updatedDistrict.sceneStrength = Math.max(
      GAME_LIMITS.MIN_VALUE,
      district.sceneStrength - GENTRIFICATION_CONSTANTS.SCENE_STRENGTH_DECREASE
    );
  }
  
  return updatedDistrict;
}
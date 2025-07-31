// Gentrification pressure system - districts evolve based on player actions

import { District, Show, ShowResult, DistrictType } from '@game/types/core';
import { DISTRICT_MODIFIERS } from './DistrictMechanics';
import { GENTRIFICATION_CONSTANTS, GAME_LIMITS } from '@game/constants/GameConstants';
import { isValidDistrict } from '@game/utils/districtUtils';

export interface GentrificationEvent {
  id: string;
  name: string;
  description: string;
  triggerConditions: {
    minGentrificationLevel?: number;
    maxGentrificationLevel?: number;
    minSceneStrength?: number;
    minShowsInDistrict?: number;
    districtTypes?: DistrictType[];
  };
  effects: {
    gentrificationChange: number;
    sceneStrengthChange: number;
    rentMultiplierChange: number;
    policePresenceChange: number;
  };
  duration: number; // turns
  isPositive: boolean; // for player
}

export const GENTRIFICATION_EVENTS: GentrificationEvent[] = [
  {
    id: 'coffee_shop_invasion',
    name: 'Coffee Shop Invasion',
    description: 'Artisanal coffee shops start opening in the neighborhood',
    triggerConditions: {
      minGentrificationLevel: 30,
      maxGentrificationLevel: 60,
      districtTypes: [DistrictType.WAREHOUSE, DistrictType.ARTS]
    },
    effects: {
      gentrificationChange: 10,
      sceneStrengthChange: -5,
      rentMultiplierChange: 0.1,
      policePresenceChange: -5
    },
    duration: 3,
    isPositive: false
  },
  {
    id: 'developer_buyout',
    name: 'Developer Buyout',
    description: 'Real estate developers buy up multiple buildings',
    triggerConditions: {
      minGentrificationLevel: 60,
      districtTypes: [DistrictType.WAREHOUSE]
    },
    effects: {
      gentrificationChange: 20,
      sceneStrengthChange: -15,
      rentMultiplierChange: 0.3,
      policePresenceChange: 0
    },
    duration: 5,
    isPositive: false
  },
  {
    id: 'underground_resistance',
    name: 'Underground Resistance',
    description: 'The scene fights back against gentrification',
    triggerConditions: {
      minSceneStrength: 70,
      minShowsInDistrict: 20,
      maxGentrificationLevel: 50
    },
    effects: {
      gentrificationChange: -15,
      sceneStrengthChange: 10,
      rentMultiplierChange: -0.1,
      policePresenceChange: 10
    },
    duration: 4,
    isPositive: true
  },
  {
    id: 'noise_complaints',
    name: 'Noise Complaints',
    description: 'New residents complain about venue noise',
    triggerConditions: {
      minGentrificationLevel: 50,
      districtTypes: [DistrictType.RESIDENTIAL, DistrictType.DOWNTOWN]
    },
    effects: {
      gentrificationChange: 5,
      sceneStrengthChange: -10,
      rentMultiplierChange: 0,
      policePresenceChange: 20
    },
    duration: 2,
    isPositive: false
  },
  {
    id: 'arts_grant',
    name: 'Arts Grant',
    description: 'City provides arts funding to the district',
    triggerConditions: {
      minSceneStrength: 60,
      districtTypes: [DistrictType.ARTS]
    },
    effects: {
      gentrificationChange: -5,
      sceneStrengthChange: 15,
      rentMultiplierChange: -0.2,
      policePresenceChange: -10
    },
    duration: 6,
    isPositive: true
  },
  {
    id: 'venue_closure_wave',
    name: 'Venue Closure Wave',
    description: 'Rising rents force multiple venues to close',
    triggerConditions: {
      minGentrificationLevel: 80
    },
    effects: {
      gentrificationChange: 10,
      sceneStrengthChange: -25,
      rentMultiplierChange: 0.2,
      policePresenceChange: -10
    },
    duration: 3,
    isPositive: false
  },
  {
    id: 'squatter_movement',
    name: 'Squatter Movement',
    description: 'Activists occupy abandoned buildings',
    triggerConditions: {
      minSceneStrength: 50,
      maxGentrificationLevel: 40,
      districtTypes: [DistrictType.WAREHOUSE, DistrictType.RESIDENTIAL]
    },
    effects: {
      gentrificationChange: -20,
      sceneStrengthChange: 20,
      rentMultiplierChange: -0.3,
      policePresenceChange: 30
    },
    duration: 5,
    isPositive: true
  }
];

// Track gentrification pressure from shows
export function calculateShowGentrificationImpact(
  show: Show,
  result: ShowResult,
  districtType: DistrictType
): number {
  if (!show || !result) {
    prodLog.error('Show and result are required for gentrification calculation');
    return 0;
  }
  
  let impact = 0;
  
  // Successful shows increase gentrification slightly
  if (result.success) {
    impact += GENTRIFICATION_CONSTANTS.SUCCESS_SHOW_IMPACT;
  }
  
  // High attendance shows attract more attention
  if (result.attendance > GENTRIFICATION_CONSTANTS.HIGH_ATTENDANCE_THRESHOLD) {
    impact += GENTRIFICATION_CONSTANTS.HIGH_ATTENDANCE_IMPACT;
  }
  
  // High revenue venues accelerate gentrification
  if (result.revenue > GENTRIFICATION_CONSTANTS.HIGH_REVENUE_THRESHOLD) {
    impact += GENTRIFICATION_CONSTANTS.HIGH_REVENUE_IMPACT;
  }
  
  // District-specific modifiers
  const districtMod = DISTRICT_MODIFIERS[districtType];
  if (districtMod) {
    impact *= districtMod.gentrificationRate * GENTRIFICATION_CONSTANTS.GENTRIFICATION_MULTIPLIER;
  }
  
  return impact;
}

// Check if any gentrification events should trigger
export function checkGentrificationEvents(
  district: District & { type?: DistrictType },
  showsInDistrict: number
): GentrificationEvent | null {
  for (const event of GENTRIFICATION_EVENTS) {
    const conditions = event.triggerConditions;
    
    // Check gentrification level
    if (conditions.minGentrificationLevel !== undefined && 
        district.gentrificationLevel < conditions.minGentrificationLevel) continue;
    if (conditions.maxGentrificationLevel !== undefined && 
        district.gentrificationLevel > conditions.maxGentrificationLevel) continue;
    
    // Check scene strength
    if (conditions.minSceneStrength !== undefined && 
        district.sceneStrength < conditions.minSceneStrength) continue;
    
    // Check shows in district
    if (conditions.minShowsInDistrict !== undefined && 
        showsInDistrict < conditions.minShowsInDistrict) continue;
    
    // Check district type
    if (conditions.districtTypes && district.type && 
        !conditions.districtTypes.includes(district.type)) continue;
    
    // All conditions met - trigger with probability
    if (Math.random() < GENTRIFICATION_CONSTANTS.EVENT_TRIGGER_CHANCE) {
      return event;
    }
  }
  
  return null;
}

// Apply gentrification event effects to a district
export function applyGentrificationEvent(
  district: District,
  event: GentrificationEvent
): District {
  if (!isValidDistrict(district)) {
    prodLog.error('Invalid district passed to applyGentrificationEvent');
    return district;
  }
  
  if (!event || !event.effects) {
    prodLog.error('Invalid event passed to applyGentrificationEvent');
    return district;
  }
  
  const effects = event.effects;
  
  return {
    ...district,
    gentrificationLevel: Math.max(0, Math.min(100, 
      district.gentrificationLevel + effects.gentrificationChange
    )),
    sceneStrength: Math.max(0, Math.min(100,
      district.sceneStrength + effects.sceneStrengthChange
    )),
    rentMultiplier: Math.max(0.5, Math.min(3,
      district.rentMultiplier + effects.rentMultiplierChange
    )),
    policePresence: Math.max(0, Math.min(100,
      district.policePresence + effects.policePresenceChange
    ))
  };
}

// Calculate district stability (resistance to change)
export function calculateDistrictStability(district: District): number {
  if (!isValidDistrict(district)) {
    prodLog.error('Invalid district passed to calculateDistrictStability');
    return 50; // Return neutral stability
  }
  
  // High scene strength provides stability
  const sceneStability = district.sceneStrength * 0.5;
  
  // Moderate gentrification is most unstable
  const gentrificationInstability = Math.abs(district.gentrificationLevel - 50) * -1 + 50;
  
  // Police presence adds some stability
  const policeStability = district.policePresence * 0.2;
  
  return Math.max(0, Math.min(100, 
    sceneStability - gentrificationInstability + policeStability
  ));
}

// Get warning messages for districts under pressure
export function getDistrictWarnings(district: District): string[] {
  const warnings: string[] = [];
  
  if (district.gentrificationLevel > 70) {
    warnings.push('⚠️ Critical gentrification levels - venues at risk!');
  } else if (district.gentrificationLevel > 50) {
    warnings.push('⚠️ Rising rents threatening the scene');
  }
  
  if (district.sceneStrength < 30) {
    warnings.push('⚠️ Scene strength critically low');
  }
  
  if (district.policePresence > 70) {
    warnings.push('⚠️ Heavy police presence affecting shows');
  }
  
  if (district.rentMultiplier > 2) {
    warnings.push('⚠️ Venue costs doubled due to gentrification');
  }
  
  return warnings;
}

// Predict future district state
export function predictDistrictFuture(
  district: District,
  turnsAhead: number = 5
): {
  gentrificationLevel: number;
  sceneStrength: number;
  rentMultiplier: number;
} {
  // Simple linear projection based on current trends
  const gentrificationTrend = district.gentrificationLevel > 50 ? 2 : -1;
  const sceneTrend = district.sceneStrength > 50 ? 1 : -2;
  const rentTrend = district.gentrificationLevel > 60 ? 0.05 : 0;
  
  return {
    gentrificationLevel: Math.min(100, district.gentrificationLevel + (gentrificationTrend * turnsAhead)),
    sceneStrength: Math.max(0, district.sceneStrength + (sceneTrend * turnsAhead)),
    rentMultiplier: Math.min(3, district.rentMultiplier + (rentTrend * turnsAhead))
  };
}
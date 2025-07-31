// Type-safe district utilities

import { DistrictType, District } from '@game/types/core';
import { DISTRICT_TYPE_MAP } from '@game/constants/GameConstants';
import { devLog } from '@utils/devLogger';

// Type guard for DistrictType
export function isDistrictType(value: string): value is DistrictType {
  return Object.values(DistrictType).includes(value as DistrictType);
}

// Safe district type conversion
export function getDistrictType(name: string): DistrictType {
  const normalized = name.toLowerCase().trim();
  const mapped = DISTRICT_TYPE_MAP[normalized];
  
  if (mapped && isDistrictType(mapped)) {
    return mapped as DistrictType;
  }
  
  // Try direct match
  for (const [, value] of Object.entries(DistrictType)) {
    if (normalized === value.toLowerCase()) {
      return value;
    }
  }
  
  // Default fallback
  devLog.warn(`Unknown district type: ${name}, defaulting to DOWNTOWN`);
  return DistrictType.DOWNTOWN;
}

// Type guard for District
export function isValidDistrict(district: unknown): district is District {
  return district &&
    typeof district.id === 'string' &&
    typeof district.name === 'string' &&
    typeof district.sceneStrength === 'number' &&
    typeof district.gentrificationLevel === 'number' &&
    typeof district.policePresence === 'number' &&
    typeof district.rentMultiplier === 'number';
}

// Safe district property access
export function getDistrictProperty<K extends keyof District>(
  district: District | undefined | null,
  property: K,
  defaultValue: District[K]
): District[K] {
  if (!district || !isValidDistrict(district)) {
    return defaultValue;
  }
  return district[property] ?? defaultValue;
}

// Validate and normalize district data
export function normalizeDistrict(district: Partial<District>): District {
  return {
    id: district.id || 'unknown',
    name: district.name || 'Unknown District',
    sceneStrength: Math.max(0, Math.min(100, district.sceneStrength || 50)),
    gentrificationLevel: Math.max(0, Math.min(100, district.gentrificationLevel || 0)),
    policePresence: Math.max(0, Math.min(100, district.policePresence || 20)),
    rentMultiplier: Math.max(0.5, Math.min(5, district.rentMultiplier || 1)),
    bounds: district.bounds || { x: 0, y: 0, width: 100, height: 100 },
    color: district.color || '#666666'
  };
}
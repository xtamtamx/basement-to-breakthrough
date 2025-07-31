// Type definitions for the JRPG-style city map system

export interface MapTile {
  x: number;
  y: number;
  type: 'building' | 'street' | 'park' | 'venue' | 'workplace' | 'empty';
  district: DistrictType;
  spriteId: string; // References sprite color/type
  interactable?: boolean;
  data?: VenueData | WorkplaceData;
  animated?: boolean; // For active venues
}

export interface VenueData {
  id: string;
  name: string;
  capacity: number;
  hasActiveShow?: boolean;
  venueType?: string;
}

export interface WorkplaceData {
  id: string;
  name: string;
  jobType: string;
  wage: number;
  stress: number;
  available: boolean;
}

export interface CityMap {
  width: number; // In tiles
  height: number; // In tiles
  tileSize: number; // 32px for mobile readability
  tiles: MapTile[][];
  districts: District[];
}

export interface District {
  id: string;
  type: DistrictType;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CameraState {
  x: number; // World position
  y: number; // World position
  zoom: number; // 0.5x to 2.0x
  targetX?: number; // For smooth camera movement
  targetY?: number;
}

export enum DistrictType {
  DOWNTOWN = 'downtown',
  WAREHOUSE = 'warehouse',
  COLLEGE = 'college',
  RESIDENTIAL = 'residential',
  ARTS = 'arts'
}

// Placeholder tile colors for initial implementation
export const TILE_COLORS: Record<string, string> = {
  building_downtown: '#333333',
  building_warehouse: '#1A1A1A',
  building_college: '#2D2D2D',
  building_residential: '#404040',
  building_arts: '#2A2A2A',
  street: '#0A0A0A',
  street_marking: '#1A1A1A',
  venue_active: '#8B5CF6', // Pulsing purple for active venues
  venue_inactive: '#4A5568',
  workplace: '#06B6D4', // Cyan for workplaces
  park: '#065F46',
  empty: '#000000'
};
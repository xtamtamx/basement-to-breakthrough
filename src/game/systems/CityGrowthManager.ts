// City Growth Manager - Handles dynamic city evolution based on player actions
import { MapTile, DistrictType } from '@/components/map/MapTypes';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { calculateDevelopmentLevel, shouldSpawnBuilding } from '@/components/map/sprites/DynamicSprites';
import { haptics } from '@/utils/mobile';

export interface GrowthEvent {
  type: 'spawn' | 'upgrade' | 'construction';
  x: number;
  y: number;
  fromLevel?: string;
  toLevel: string;
  district: DistrictType;
}

export class CityGrowthManager {
  private growthEvents: GrowthEvent[] = [];
  
  // Track player actions for growth calculations
  private playerMetrics = {
    showsBookedThisTurn: 0,
    venuesBuiltThisTurn: 0,
    jobsWorkedThisTurn: 0,
    totalShowsBooked: 0,
    totalVenuesBuilt: 0,
    totalJobsWorked: 0,
  };

  // Update the city based on player actions
  public updateCityGrowth(): GrowthEvent[] {
    this.growthEvents = [];
    const gameStore = useGameStore.getState();
    const mapStore = useMapStore.getState();
    
    if (!mapStore.cityMap) return [];

    // Calculate district activity scores
    const districtActivity = this.calculateDistrictActivity();
    
    // Process each tile for potential growth
    const tiles = mapStore.cityMap.tiles;
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        if (tile.type === 'street' || tile.type === 'park') continue;
        
        // Get district info
        const district = gameStore.districts.find(d => 
          d.type === tile.district
        );
        if (!district) continue;
        
        // Calculate if this tile should evolve
        this.processTileGrowth(tile, district, districtActivity[district.type] || 0);
      }
    }
    
    // Apply growth events to the map
    this.applyGrowthEvents();
    
    // Reset turn metrics
    this.playerMetrics.showsBookedThisTurn = 0;
    this.playerMetrics.venuesBuiltThisTurn = 0;
    this.playerMetrics.jobsWorkedThisTurn = 0;
    
    return this.growthEvents;
  }

  private calculateDistrictActivity(): Record<DistrictType, number> {
    const gameStore = useGameStore.getState();
    const activity: Partial<Record<DistrictType, number>> = {};
    
    // Initialize all districts with base activity
    for (const district of gameStore.districts) {
      activity[district.type] = district.sceneStrength * 0.01;
    }
    
    // Add activity based on venues with shows
    gameStore.venues.forEach(venue => {
      const hasShow = gameStore.scheduledShows.some(
        show => show.venueId === venue.id && 
        show.round === gameStore.currentRound
      );
      
      if (hasShow) {
        // Boost activity in venue's district
        const venueDistrict = this.getVenueDistrict(venue.type);
        if (venueDistrict && activity[venueDistrict]) {
          activity[venueDistrict]! += 0.15;
        }
      }
    });
    
    // Add activity based on player actions
    if (activity[DistrictType.WAREHOUSE]) {
      activity[DistrictType.WAREHOUSE]! += this.playerMetrics.showsBookedThisTurn * 0.1;
    }
    if (activity[DistrictType.ARTS]) {
      activity[DistrictType.ARTS]! += gameStore.sceneReputation * 0.002;
    }
    if (activity[DistrictType.DOWNTOWN]) {
      activity[DistrictType.DOWNTOWN]! += this.playerMetrics.jobsWorkedThisTurn * 0.05;
    }
    
    return activity as Record<DistrictType, number>;
  }

  private processTileGrowth(
    tile: MapTile,
    district: any,
    activityScore: number
  ): void {
    const currentLevel = tile.developmentLevel || 'empty';
    
    // Calculate growth probability based on various factors
    let growthChance = activityScore;
    
    // Adjust based on current development level
    switch (currentLevel) {
      case 'empty':
        growthChance *= 1.5; // Empty lots are easier to develop
        break;
      case 'construction':
        growthChance *= 2.0; // Construction sites are very likely to complete
        break;
      case 'basic':
        growthChance *= 0.8; // Harder to upgrade existing buildings
        break;
      case 'developed':
        growthChance *= 0.4; // Much harder to reach thriving
        break;
      case 'thriving':
        return; // Can't grow further
    }
    
    // Add some randomness and proximity bonus
    growthChance += Math.random() * 0.1;
    
    // Check if growth should occur
    if (Math.random() < growthChance) {
      const newLevel = this.getNextDevelopmentLevel(currentLevel);
      
      this.growthEvents.push({
        type: currentLevel === 'empty' ? 'spawn' : 'upgrade',
        x: tile.x,
        y: tile.y,
        fromLevel: currentLevel,
        toLevel: newLevel,
        district: tile.district,
      });
    }
  }

  private getNextDevelopmentLevel(current: string): string {
    switch (current) {
      case 'empty':
        return Math.random() < 0.7 ? 'construction' : 'basic';
      case 'construction':
        return 'basic';
      case 'basic':
        return 'developed';
      case 'developed':
        return 'thriving';
      default:
        return 'basic';
    }
  }

  private applyGrowthEvents(): void {
    if (this.growthEvents.length === 0) return;
    
    const mapStore = useMapStore.getState();
    if (!mapStore.cityMap) return;
    
    // Apply each growth event
    this.growthEvents.forEach(event => {
      mapStore.updateTile(event.x, event.y, {
        developmentLevel: event.toLevel as any,
        type: event.toLevel === 'empty' ? 'empty' : 'building',
        // Randomize variation for visual diversity
        variation: Math.floor(Math.random() * 3),
      });
    });
    
    // Trigger haptic feedback for growth
    if (this.growthEvents.length > 0) {
      haptics.light();
    }
  }

  private getVenueDistrict(venueType: string): DistrictType | null {
    // Map venue types to their most likely districts
    const mapping: Record<string, DistrictType> = {
      'basement': DistrictType.RESIDENTIAL,
      'garage': DistrictType.RESIDENTIAL,
      'house_show': DistrictType.RESIDENTIAL,
      'diy_space': DistrictType.ARTS,
      'dive_bar': DistrictType.DOWNTOWN,
      'punk_club': DistrictType.DOWNTOWN,
      'metal_venue': DistrictType.DOWNTOWN,
      'warehouse': DistrictType.WAREHOUSE,
      'underground': DistrictType.WAREHOUSE,
      'theater': DistrictType.ARTS,
      'concert_hall': DistrictType.DOWNTOWN,
      'arena': DistrictType.DOWNTOWN,
      'festival_grounds': DistrictType.WAREHOUSE,
    };
    
    return mapping[venueType.toLowerCase()] || null;
  }

  // Public methods to track player actions
  public recordShowBooked(): void {
    this.playerMetrics.showsBookedThisTurn++;
    this.playerMetrics.totalShowsBooked++;
  }

  public recordVenueBuilt(): void {
    this.playerMetrics.venuesBuiltThisTurn++;
    this.playerMetrics.totalVenuesBuilt++;
  }

  public recordJobWorked(): void {
    this.playerMetrics.jobsWorkedThisTurn++;
    this.playerMetrics.totalJobsWorked++;
  }

  public getPlayerMetrics() {
    return { ...this.playerMetrics };
  }
}

// Singleton instance
export const cityGrowthManager = new CityGrowthManager();
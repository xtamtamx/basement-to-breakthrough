import { Venue, VenueUpgrade, VenueUpgradeType, Equipment, EquipmentType } from '@game/types';
import { useGameStore } from '@stores/gameStore';

export interface UpgradeDefinition extends Omit<VenueUpgrade, 'id'> {
  id: string;
}

// Equipment catalog with different qualities
export const EQUIPMENT_CATALOG: Equipment[] = [
  // PA Systems
  {
    id: 'pa-basic',
    name: 'Basic PA System',
    description: 'Entry-level sound system suitable for small venues',
    type: EquipmentType.PA_SYSTEM,
    quality: 1,
    condition: 100,
    maintenanceCost: 10,
    purchasePrice: 500,
    rentalPrice: 50,
    owned: false,
    effects: {
      acousticsBonus: 10,
      capacityBonus: 0,
      atmosphereBonus: 5,
    },
    requirements: {
      minCapacity: 50,
    }
  },
  {
    id: 'pa-professional',
    name: 'Professional PA System',
    description: 'High-quality sound system with clear output',
    type: EquipmentType.PA_SYSTEM,
    quality: 3,
    condition: 100,
    maintenanceCost: 30,
    purchasePrice: 2000,
    rentalPrice: 150,
    owned: false,
    effects: {
      acousticsBonus: 25,
      capacityBonus: 10,
      atmosphereBonus: 15,
      reputationMultiplier: 1.1,
    },
    requirements: {
      minCapacity: 100,
      powerRequirements: 2,
    }
  },
  {
    id: 'pa-touring',
    name: 'Touring-Grade PA System',
    description: 'Professional touring system used by major acts',
    type: EquipmentType.PA_SYSTEM,
    quality: 5,
    condition: 100,
    maintenanceCost: 75,
    purchasePrice: 5000,
    rentalPrice: 400,
    owned: false,
    effects: {
      acousticsBonus: 40,
      capacityBonus: 20,
      atmosphereBonus: 25,
      reputationMultiplier: 1.25,
      incidentReduction: 20,
    },
    requirements: {
      minCapacity: 200,
      powerRequirements: 5,
      spaceRequirements: 3,
    }
  },
  
  // Lighting Systems
  {
    id: 'lights-basic',
    name: 'Basic Stage Lights',
    description: 'Simple colored lights for ambiance',
    type: EquipmentType.LIGHTING,
    quality: 1,
    condition: 100,
    maintenanceCost: 5,
    purchasePrice: 300,
    rentalPrice: 30,
    owned: false,
    effects: {
      atmosphereBonus: 10,
    }
  },
  {
    id: 'lights-led',
    name: 'LED Light System',
    description: 'Programmable LED lights with effects',
    type: EquipmentType.LIGHTING,
    quality: 3,
    condition: 100,
    maintenanceCost: 20,
    purchasePrice: 1500,
    rentalPrice: 100,
    owned: false,
    effects: {
      atmosphereBonus: 20,
      reputationMultiplier: 1.05,
    },
    requirements: {
      powerRequirements: 2,
    }
  },
  {
    id: 'lights-laser',
    name: 'Laser Light Show System',
    description: 'Professional laser system for spectacular shows',
    type: EquipmentType.LIGHTING,
    quality: 5,
    condition: 100,
    maintenanceCost: 50,
    purchasePrice: 4000,
    rentalPrice: 300,
    owned: false,
    effects: {
      atmosphereBonus: 35,
      reputationMultiplier: 1.2,
      capacityBonus: 10, // Draws bigger crowds
    },
    requirements: {
      minCapacity: 300,
      powerRequirements: 4,
      spaceRequirements: 2,
    }
  },
  
  // Backline Equipment
  {
    id: 'backline-basic',
    name: 'House Backline',
    description: 'Basic amps and drum kit for bands',
    type: EquipmentType.BACKLINE,
    quality: 2,
    condition: 100,
    maintenanceCost: 15,
    purchasePrice: 1000,
    rentalPrice: 75,
    owned: false,
    effects: {
      stressReduction: 10, // Bands appreciate not hauling gear
      acousticsBonus: 5,
    }
  },
  {
    id: 'backline-pro',
    name: 'Professional Backline',
    description: 'High-end amplifiers and instruments',
    type: EquipmentType.BACKLINE,
    quality: 4,
    condition: 100,
    maintenanceCost: 40,
    purchasePrice: 3000,
    rentalPrice: 200,
    owned: false,
    effects: {
      stressReduction: 25,
      acousticsBonus: 15,
      reputationMultiplier: 1.1,
      incidentReduction: 15, // Less equipment failures
    },
    requirements: {
      minCapacity: 150,
    }
  },
  
  // Recording Equipment
  {
    id: 'recording-basic',
    name: 'Basic Recording Setup',
    description: 'Simple recording equipment for live sessions',
    type: EquipmentType.RECORDING,
    quality: 2,
    condition: 100,
    maintenanceCost: 20,
    purchasePrice: 1500,
    rentalPrice: 100,
    owned: false,
    effects: {
      reputationMultiplier: 1.1, // Bands love being recorded
      atmosphereBonus: 5,
    }
  },
  {
    id: 'recording-studio',
    name: 'Professional Recording Studio',
    description: 'Full studio setup for high-quality recordings',
    type: EquipmentType.RECORDING,
    quality: 5,
    condition: 100,
    maintenanceCost: 60,
    purchasePrice: 8000,
    rentalPrice: 500,
    owned: false,
    effects: {
      reputationMultiplier: 1.3,
      atmosphereBonus: 10,
      // TODO: Add ability to generate revenue from recordings
    },
    requirements: {
      powerRequirements: 3,
      spaceRequirements: 4,
    }
  }
];

// Venue upgrades catalog
export const VENUE_UPGRADES: UpgradeDefinition[] = [
  // Capacity Upgrades
  {
    id: 'capacity-small',
    name: 'Expand Floor Space',
    description: 'Remove some furniture to fit more people',
    cost: 500,
    type: VenueUpgradeType.CAPACITY,
    requirements: {
      minCapacity: 50,
    },
    effects: {
      capacity: 25,
      authenticity: -5, // Cramming people in isn't very authentic
    }
  },
  {
    id: 'capacity-medium',
    name: 'Renovate Layout',
    description: 'Professional renovation to maximize space',
    cost: 2000,
    type: VenueUpgradeType.CAPACITY,
    requirements: {
      minCapacity: 100,
      minReputation: 30,
    },
    effects: {
      capacity: 50,
      atmosphere: 10,
    }
  },
  {
    id: 'capacity-outdoor',
    name: 'Add Outdoor Area',
    description: 'Expand to outdoor space for larger crowds',
    cost: 5000,
    type: VenueUpgradeType.CAPACITY,
    requirements: {
      minCapacity: 200,
      minReputation: 50,
      venueTypes: ['BAR', 'WAREHOUSE', 'THEATER'],
    },
    effects: {
      capacity: 100,
      atmosphere: 20,
      incidentChance: 5, // Weather can be an issue
    }
  },
  
  // Security Upgrades
  {
    id: 'security-basic',
    name: 'Hire Security',
    description: 'Basic security staff to handle crowds',
    cost: 1000,
    type: VenueUpgradeType.SECURITY,
    effects: {
      incidentChance: -20,
      authenticity: -10, // Security can kill the vibe
    },
    upkeepCost: 50,
  },
  {
    id: 'security-professional',
    name: 'Professional Security Team',
    description: 'Experienced security that knows the scene',
    cost: 3000,
    type: VenueUpgradeType.SECURITY,
    requirements: {
      minCapacity: 150,
      minReputation: 40,
    },
    effects: {
      incidentChance: -40,
      authenticity: -5, // Better at not killing the vibe
      capacity: 25, // Can handle more people safely
    },
    upkeepCost: 150,
  },
  
  // Atmosphere Upgrades
  {
    id: 'atmosphere-graffiti',
    name: 'Commission Graffiti Art',
    description: 'Local artists create authentic murals',
    cost: 800,
    type: VenueUpgradeType.ATMOSPHERE,
    effects: {
      atmosphere: 15,
      authenticity: 20,
    }
  },
  {
    id: 'atmosphere-vip',
    name: 'VIP Area',
    description: 'Exclusive area for special guests',
    cost: 2500,
    type: VenueUpgradeType.ATMOSPHERE,
    requirements: {
      minCapacity: 150,
      minReputation: 35,
    },
    effects: {
      atmosphere: 10,
      revenue: 20, // Percentage increase
      authenticity: -15, // VIP areas are not very punk
    }
  },
  
  // Bar Upgrades
  {
    id: 'bar-basic',
    name: 'Install Bar',
    description: 'Basic bar setup for drink sales',
    cost: 2000,
    type: VenueUpgradeType.BAR,
    requirements: {
      venueTypes: ['BASEMENT', 'WAREHOUSE', 'THEATER'],
    },
    effects: {
      revenue: 30,
      atmosphere: 10,
      allAges: false, // Can't be all-ages with a bar
    },
    upkeepCost: 100,
  },
  {
    id: 'bar-craft',
    name: 'Craft Beer Selection',
    description: 'Partner with local breweries',
    cost: 1000,
    type: VenueUpgradeType.BAR,
    requirements: {
      minReputation: 25,
    },
    effects: {
      revenue: 15,
      atmosphere: 15,
      authenticity: 10, // Supporting local business
    },
    upkeepCost: 50,
  },
  
  // Stage Upgrades
  {
    id: 'stage-basic',
    name: 'Build Stage',
    description: 'Raised platform for better visibility',
    cost: 1500,
    type: VenueUpgradeType.STAGE,
    effects: {
      atmosphere: 20,
      acoustics: 10,
      capacity: 10, // Better sightlines = more capacity
    }
  },
  {
    id: 'stage-pro',
    name: 'Professional Stage',
    description: 'Full stage with wings and backdrop',
    cost: 4000,
    type: VenueUpgradeType.STAGE,
    requirements: {
      minCapacity: 200,
      minReputation: 45,
    },
    effects: {
      atmosphere: 30,
      acoustics: 20,
      capacity: 20,
      reputationMultiplier: 1.1,
    }
  }
];

export class VenueUpgradeSystem {
  // Get available upgrades for a venue
  getAvailableUpgrades(venue: Venue): UpgradeDefinition[] {
    const store = useGameStore.getState();
    const appliedUpgradeIds = venue.upgrades?.map(u => u.id) || [];
    
    return VENUE_UPGRADES.filter(upgrade => {
      // Already applied?
      if (appliedUpgradeIds.includes(upgrade.id)) return false;
      
      // Can afford?
      if (store.money < upgrade.cost) return false;
      
      // Meet requirements?
      if (upgrade.requirements) {
        const reqs = upgrade.requirements;
        
        if (reqs.minCapacity && venue.capacity < reqs.minCapacity) return false;
        if (reqs.minReputation && store.reputation < reqs.minReputation) return false;
        if (reqs.venueTypes && !reqs.venueTypes.includes(venue.type)) return false;
      }
      
      return true;
    });
  }
  
  // Get available equipment for a venue
  getAvailableEquipment(venue: Venue): Equipment[] {
    const ownedEquipmentIds = venue.equipment.map(e => e.id);
    
    return EQUIPMENT_CATALOG.filter(equipment => {
      // Already own it?
      if (ownedEquipmentIds.includes(equipment.id)) return false;
      
      // Meet requirements?
      if (equipment.requirements) {
        const reqs = equipment.requirements;
        
        if (reqs.minCapacity && venue.capacity < reqs.minCapacity) return false;
        if (reqs.venueType && !reqs.venueType.includes(venue.type)) return false;
        
        // TODO: Check power and space requirements against venue
      }
      
      return true;
    });
  }
  
  // Apply an upgrade to a venue
  applyUpgrade(venueId: string, upgradeId: string): boolean {
    const store = useGameStore.getState();
    const venue = store.venues.find(v => v.id === venueId);
    const upgrade = VENUE_UPGRADES.find(u => u.id === upgradeId);
    
    if (!venue || !upgrade) return false;
    
    // Check if can afford
    if (store.money < upgrade.cost) return false;
    
    // Deduct cost
    store.addMoney(-upgrade.cost);
    
    // Apply effects
    const updatedVenue = { ...venue };
    
    if (upgrade.effects.capacity) {
      updatedVenue.capacity += upgrade.effects.capacity;
    }
    if (upgrade.effects.acoustics) {
      updatedVenue.acoustics = Math.min(100, updatedVenue.acoustics + upgrade.effects.acoustics);
    }
    if (upgrade.effects.atmosphere) {
      updatedVenue.atmosphere = Math.min(100, updatedVenue.atmosphere + upgrade.effects.atmosphere);
    }
    if (upgrade.effects.authenticity) {
      updatedVenue.authenticity = Math.max(0, Math.min(100, updatedVenue.authenticity + upgrade.effects.authenticity));
    }
    
    // Add to venue's upgrade list
    updatedVenue.upgrades = [...(updatedVenue.upgrades || []), upgrade as VenueUpgrade];
    
    // Special effects
    if (upgrade.effects.allAges === false) {
      updatedVenue.allowsAllAges = false;
    }
    if (upgrade.type === VenueUpgradeType.BAR) {
      updatedVenue.hasBar = true;
    }
    if (upgrade.type === VenueUpgradeType.SECURITY) {
      updatedVenue.hasSecurity = true;
    }
    if (upgrade.type === VenueUpgradeType.STAGE) {
      updatedVenue.hasStage = true;
    }
    
    // Update venue in store
    store.updateVenue(updatedVenue);
    
    return true;
  }
  
  // Purchase equipment for a venue
  purchaseEquipment(venueId: string, equipmentId: string): boolean {
    const store = useGameStore.getState();
    const venue = store.venues.find(v => v.id === venueId);
    const equipment = EQUIPMENT_CATALOG.find(e => e.id === equipmentId);
    
    if (!venue || !equipment) return false;
    
    // Check if can afford
    if (store.money < equipment.purchasePrice) return false;
    
    // Deduct cost
    store.addMoney(-equipment.purchasePrice);
    
    // Add equipment to venue
    const ownedEquipment = { ...equipment, owned: true };
    const updatedVenue = {
      ...venue,
      equipment: [...venue.equipment, ownedEquipment]
    };
    
    // Apply immediate effects
    if (equipment.effects.acousticsBonus) {
      updatedVenue.acoustics = Math.min(100, updatedVenue.acoustics + equipment.effects.acousticsBonus);
    }
    if (equipment.effects.atmosphereBonus) {
      updatedVenue.atmosphere = Math.min(100, updatedVenue.atmosphere + equipment.effects.atmosphereBonus);
    }
    
    // Update venue in store
    store.updateVenue(updatedVenue);
    
    return true;
  }
  
  // Rent equipment for a single show
  rentEquipment(venueId: string, equipmentId: string): boolean {
    const store = useGameStore.getState();
    const equipment = EQUIPMENT_CATALOG.find(e => e.id === equipmentId);
    
    if (!equipment) return false;
    
    // Check if can afford
    if (store.money < equipment.rentalPrice) return false;
    
    // Deduct rental cost
    store.addMoney(-equipment.rentalPrice);
    
    // Add temporary equipment bonus for next show
    // TODO: Implement temporary equipment system
    
    return true;
  }
  
  // Calculate total upkeep costs for a venue
  calculateUpkeepCost(venue: Venue): number {
    let totalUpkeep = 0;
    
    // Upgrade upkeep
    venue.upgrades?.forEach(upgrade => {
      if (upgrade.upkeepCost) {
        totalUpkeep += upgrade.upkeepCost;
      }
    });
    
    // Equipment maintenance
    venue.equipment.forEach(equipment => {
      if (equipment.owned) {
        totalUpkeep += equipment.maintenanceCost;
      }
    });
    
    return totalUpkeep;
  }
  
  // Degrade equipment condition over time
  degradeEquipment(venue: Venue): void {
    const store = useGameStore.getState();
    const updatedVenue = { ...venue };
    
    updatedVenue.equipment = updatedVenue.equipment.map(equipment => {
      if (equipment.owned && equipment.condition > 0) {
        // Degrade by 1-3% per turn
        const degradation = 1 + Math.random() * 2;
        return {
          ...equipment,
          condition: Math.max(0, equipment.condition - degradation)
        };
      }
      return equipment;
    });
    
    store.updateVenue(updatedVenue);
  }
  
  // Repair equipment
  repairEquipment(venueId: string, equipmentId: string): boolean {
    const store = useGameStore.getState();
    const venue = store.venues.find(v => v.id === venueId);
    if (!venue) return false;
    
    const equipment = venue.equipment.find(e => e.id === equipmentId);
    if (!equipment || !equipment.owned) return false;
    
    // Calculate repair cost based on condition
    const repairCost = Math.floor(equipment.purchasePrice * 0.2 * (1 - equipment.condition / 100));
    
    if (store.money < repairCost) return false;
    
    // Deduct cost and repair
    store.addMoney(-repairCost);
    
    const updatedVenue = {
      ...venue,
      equipment: venue.equipment.map(e => 
        e.id === equipmentId 
          ? { ...e, condition: 100 }
          : e
      )
    };
    
    store.updateVenue(updatedVenue);
    
    return true;
  }
}

export const venueUpgradeSystem = new VenueUpgradeSystem();
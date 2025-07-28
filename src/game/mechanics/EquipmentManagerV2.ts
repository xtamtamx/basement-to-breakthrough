import { Equipment, EquipmentType, Band, Venue, EquipmentEffects, VenueType } from '@game/types';
import { SATIRICAL_EQUIPMENT } from '@game/data/satiricalText';

interface EquipmentInventory {
  owned: Equipment[];
  rented: Equipment[];
  installedAtVenues: Map<string, Equipment[]>; // venueId -> equipment
}

class EquipmentManagerV2 {
  private inventory: EquipmentInventory = {
    owned: [],
    rented: [],
    installedAtVenues: new Map()
  };

  private equipmentCatalog: Equipment[] = [
    {
      id: 'pa-basic',
      name: SATIRICAL_EQUIPMENT['pa-basic']?.name || 'Basic PA System',
      description: SATIRICAL_EQUIPMENT['pa-basic']?.description,
      type: EquipmentType.PA_SYSTEM,
      quality: 1,
      condition: 100,
      maintenanceCost: 10,
      purchasePrice: 500,
      rentalPrice: 50,
      owned: false,
      effects: {
        capacityBonus: 10,
        acousticsBonus: 10
      }
    },
    {
      id: 'pa-pro',
      name: SATIRICAL_EQUIPMENT['pa-pro']?.name || 'Professional PA System',
      description: SATIRICAL_EQUIPMENT['pa-pro']?.description,
      type: EquipmentType.PA_SYSTEM,
      quality: 3,
      condition: 100,
      maintenanceCost: 30,
      purchasePrice: 2000,
      rentalPrice: 150,
      owned: false,
      effects: {
        capacityBonus: 25,
        acousticsBonus: 30,
        reputationMultiplier: 1.2
      },
      requirements: {
        minCapacity: 100
      }
    },
    {
      id: 'pa-line-array',
      name: 'Line Array PA System',
      type: EquipmentType.PA_SYSTEM,
      quality: 5,
      condition: 100,
      maintenanceCost: 75,
      purchasePrice: 8000,
      rentalPrice: 400,
      owned: false,
      effects: {
        capacityBonus: 50,
        acousticsBonus: 50,
        reputationMultiplier: 1.5,
        incidentReduction: 0.3
      },
      requirements: {
        minCapacity: 300,
        venueType: [VenueType.WAREHOUSE, VenueType.THEATER, VenueType.CONCERT_HALL, VenueType.ARENA]
      }
    },
    {
      id: 'lights-basic',
      name: SATIRICAL_EQUIPMENT['lights-basic']?.name || 'Basic Stage Lights',
      description: SATIRICAL_EQUIPMENT['lights-basic']?.description,
      type: EquipmentType.LIGHTING,
      quality: 1,
      condition: 100,
      maintenanceCost: 5,
      purchasePrice: 300,
      rentalPrice: 30,
      owned: false,
      effects: {
        atmosphereBonus: 15,
        stressReduction: 5
      }
    },
    {
      id: 'lights-led',
      name: 'LED Light Show System',
      type: EquipmentType.LIGHTING,
      quality: 4,
      condition: 100,
      maintenanceCost: 25,
      purchasePrice: 3000,
      rentalPrice: 200,
      owned: false,
      effects: {
        atmosphereBonus: 40,
        reputationMultiplier: 1.3,
        stressReduction: 10
      },
      requirements: {
        powerRequirements: 2,
        minCapacity: 150
      }
    },
    {
      id: 'lights-laser',
      name: 'Laser Light System',
      type: EquipmentType.LIGHTING,
      quality: 5,
      condition: 100,
      maintenanceCost: 50,
      purchasePrice: 6000,
      rentalPrice: 350,
      owned: false,
      effects: {
        atmosphereBonus: 60,
        reputationMultiplier: 1.4,
        stressReduction: 15,
        capacityBonus: 10
      },
      requirements: {
        powerRequirements: 3,
        minCapacity: 200,
        venueType: [VenueType.WAREHOUSE, VenueType.THEATER, VenueType.CONCERT_HALL, VenueType.ARENA]
      }
    },
    {
      id: 'stage-riser',
      name: 'Stage Riser Platform',
      type: EquipmentType.STAGE,
      quality: 2,
      condition: 100,
      maintenanceCost: 5,
      purchasePrice: 800,
      rentalPrice: 60,
      owned: false,
      effects: {
        capacityBonus: 15,
        atmosphereBonus: 10,
        incidentReduction: 0.2
      }
    },
    {
      id: 'stage-pro',
      name: 'Professional Stage Setup',
      type: EquipmentType.STAGE,
      quality: 4,
      condition: 100,
      maintenanceCost: 20,
      purchasePrice: 4000,
      rentalPrice: 250,
      owned: false,
      effects: {
        capacityBonus: 30,
        atmosphereBonus: 25,
        incidentReduction: 0.4,
        stressReduction: 20
      },
      requirements: {
        minCapacity: 150,
        spaceRequirements: 2
      }
    },
    {
      id: 'backline-basic',
      name: 'Basic Backline Gear',
      type: EquipmentType.BACKLINE,
      quality: 2,
      condition: 100,
      maintenanceCost: 15,
      purchasePrice: 1200,
      rentalPrice: 80,
      owned: false,
      effects: {
        stressReduction: 15,
        incidentReduction: 0.3
      }
    },
    {
      id: 'backline-pro',
      name: 'Professional Backline',
      type: EquipmentType.BACKLINE,
      quality: 4,
      condition: 100,
      maintenanceCost: 40,
      purchasePrice: 5000,
      rentalPrice: 300,
      owned: false,
      effects: {
        stressReduction: 30,
        incidentReduction: 0.5,
        reputationMultiplier: 1.1
      }
    },
    {
      id: 'recording-basic',
      name: 'Basic Recording Setup',
      type: EquipmentType.RECORDING,
      quality: 2,
      condition: 100,
      maintenanceCost: 20,
      purchasePrice: 2500,
      rentalPrice: 100,
      owned: false,
      effects: {
        reputationMultiplier: 1.2
      }
    },
    {
      id: 'recording-studio',
      name: 'Mobile Studio Setup',
      type: EquipmentType.RECORDING,
      quality: 5,
      condition: 100,
      maintenanceCost: 60,
      purchasePrice: 10000,
      rentalPrice: 500,
      owned: false,
      effects: {
        reputationMultiplier: 1.5,
        atmosphereBonus: 20
      },
      requirements: {
        powerRequirements: 2
      }
    }
  ];

  // Get available equipment for purchase/rental
  getAvailableEquipment(): Equipment[] {
    return this.equipmentCatalog.filter(eq => 
      !this.inventory.owned.some(owned => owned.id === eq.id)
    );
  }

  // Get catalog equipment by id
  getCatalogEquipment(equipmentId: string): Equipment | undefined {
    return this.equipmentCatalog.find(eq => eq.id === equipmentId);
  }

  // Purchase equipment
  purchaseEquipment(equipmentId: string): { success: boolean; cost: number; error?: string } {
    const equipment = this.equipmentCatalog.find(eq => eq.id === equipmentId);
    if (!equipment) {
      return { success: false, cost: 0, error: 'Equipment not found' };
    }

    if (this.inventory.owned.some(eq => eq.id === equipmentId)) {
      return { success: false, cost: 0, error: 'Already owned' };
    }

    const ownedEquipment = { ...equipment, owned: true };
    this.inventory.owned.push(ownedEquipment);

    return { success: true, cost: equipment.purchasePrice };
  }

  // Rent equipment for a show
  rentEquipment(equipmentId: string): { success: boolean; cost: number; error?: string } {
    const equipment = this.equipmentCatalog.find(eq => eq.id === equipmentId);
    if (!equipment) {
      return { success: false, cost: 0, error: 'Equipment not found' };
    }

    // Check if already renting same type
    const alreadyRentingType = this.inventory.rented.some(eq => eq.type === equipment.type);
    if (alreadyRentingType) {
      return { success: false, cost: 0, error: 'Already renting equipment of this type' };
    }

    const rentedEquipment = { ...equipment, owned: false };
    this.inventory.rented.push(rentedEquipment);

    return { success: true, cost: equipment.rentalPrice };
  }

  // Install equipment at venue
  installAtVenue(equipmentId: string, venueId: string, venue: Venue): { success: boolean; error?: string } {
    const equipment = this.inventory.owned.find(eq => eq.id === equipmentId);
    if (!equipment) {
      return { success: false, error: 'Equipment not owned' };
    }

    // Check if already installed somewhere
    for (const [vId, eqs] of this.inventory.installedAtVenues) {
      if (eqs.some(eq => eq.id === equipmentId)) {
        if (vId === venueId) {
          return { success: false, error: 'Already installed at this venue' };
        } else {
          return { success: false, error: 'Already installed at another venue' };
        }
      }
    }

    // Check requirements
    if (equipment.requirements) {
      if (equipment.requirements.minCapacity && venue.capacity < equipment.requirements.minCapacity) {
        return { success: false, error: `Venue too small (needs ${equipment.requirements.minCapacity}+ capacity)` };
      }
      if (equipment.requirements.venueType && !equipment.requirements.venueType.includes(venue.type)) {
        return { success: false, error: 'Wrong venue type' };
      }
    }

    const venueEquipment = this.inventory.installedAtVenues.get(venueId) || [];
    venueEquipment.push(equipment);
    this.inventory.installedAtVenues.set(venueId, venueEquipment);

    return { success: true };
  }

  // Uninstall equipment from venue
  uninstallFromVenue(equipmentId: string, venueId: string): { success: boolean; error?: string } {
    const venueEquipment = this.inventory.installedAtVenues.get(venueId);
    if (!venueEquipment) {
      return { success: false, error: 'No equipment at venue' };
    }

    const index = venueEquipment.findIndex(eq => eq.id === equipmentId);
    if (index === -1) {
      return { success: false, error: 'Equipment not found at venue' };
    }

    venueEquipment.splice(index, 1);
    if (venueEquipment.length === 0) {
      this.inventory.installedAtVenues.delete(venueId);
    }

    return { success: true };
  }

  // Get equipment at venue
  getVenueEquipment(venueId: string): Equipment[] {
    return this.inventory.installedAtVenues.get(venueId) || [];
  }

  // Get all owned equipment
  getOwnedEquipment(): Equipment[] {
    return this.inventory.owned;
  }

  // Get currently rented equipment
  getRentedEquipment(): Equipment[] {
    return this.inventory.rented;
  }

  // Get equipment effects for a venue (including rented)
  getVenueEquipmentEffects(venueId: string): EquipmentEffects {
    const equipment = this.inventory.installedAtVenues.get(venueId) || [];
    const rentedForShow = this.inventory.rented;
    const allEquipment = [...equipment, ...rentedForShow];

    const combinedEffects: EquipmentEffects = {
      capacityBonus: 0,
      acousticsBonus: 0,
      atmosphereBonus: 0,
      reputationMultiplier: 1,
      stressReduction: 0,
      incidentReduction: 0
    };

    allEquipment.forEach(eq => {
      // Apply condition degradation
      const conditionMultiplier = eq.condition / 100;

      if (eq.effects.capacityBonus) {
        combinedEffects.capacityBonus! += eq.effects.capacityBonus * conditionMultiplier;
      }
      if (eq.effects.acousticsBonus) {
        combinedEffects.acousticsBonus! += eq.effects.acousticsBonus * conditionMultiplier;
      }
      if (eq.effects.atmosphereBonus) {
        combinedEffects.atmosphereBonus! += eq.effects.atmosphereBonus * conditionMultiplier;
      }
      if (eq.effects.reputationMultiplier) {
        combinedEffects.reputationMultiplier! *= (1 + (eq.effects.reputationMultiplier - 1) * conditionMultiplier);
      }
      if (eq.effects.stressReduction) {
        combinedEffects.stressReduction! += eq.effects.stressReduction * conditionMultiplier;
      }
      if (eq.effects.incidentReduction) {
        combinedEffects.incidentReduction! += eq.effects.incidentReduction * conditionMultiplier;
      }
    });

    return combinedEffects;
  }

  // Apply equipment degradation
  degradeEquipment(showCount: number = 1) {
    // Degrade all installed equipment
    this.inventory.installedAtVenues.forEach(equipment => {
      equipment.forEach(eq => {
        eq.condition = Math.max(0, eq.condition - (showCount * 2)); // 2% per show
      });
    });

    // Also degrade owned equipment not installed (from wear in storage)
    this.inventory.owned.forEach(eq => {
      let isInstalled = false;
      this.inventory.installedAtVenues.forEach(venueEq => {
        if (venueEq.some(e => e.id === eq.id)) {
          isInstalled = true;
        }
      });
      if (!isInstalled) {
        eq.condition = Math.max(0, eq.condition - (showCount * 0.5)); // 0.5% in storage
      }
    });

    // Clear rented equipment after show
    this.inventory.rented = [];
  }

  // Calculate maintenance costs
  getMaintenanceCosts(): number {
    return this.inventory.owned.reduce((total, eq) => {
      // Higher maintenance cost for damaged equipment
      const conditionMultiplier = eq.condition < 50 ? 1.5 : 1;
      return total + (eq.maintenanceCost * conditionMultiplier);
    }, 0);
  }

  // Repair equipment
  repairEquipment(equipmentId: string): { success: boolean; cost: number } {
    const equipment = this.inventory.owned.find(eq => eq.id === equipmentId);
    if (!equipment) {
      return { success: false, cost: 0 };
    }

    const repairCost = Math.floor((100 - equipment.condition) * equipment.purchasePrice / 200);
    equipment.condition = 100;

    return { success: true, cost: repairCost };
  }

  // Check band requirements
  checkBandRequirements(band: Band, venue: Venue): { met: boolean; missing: EquipmentType[] } {
    const requiredTypes: Set<EquipmentType> = new Set();
    
    // Basic requirements based on band technical skill
    if (band.technicalSkill > 60) {
      requiredTypes.add(EquipmentType.PA_SYSTEM);
    }
    if (band.technicalSkill > 70) {
      requiredTypes.add(EquipmentType.LIGHTING);
    }
    if (band.technicalSkill > 85) {
      requiredTypes.add(EquipmentType.BACKLINE);
    }

    // Genre-specific requirements
    if (band.genre === 'METAL') {
      requiredTypes.add(EquipmentType.PA_SYSTEM);
      requiredTypes.add(EquipmentType.BACKLINE);
    }

    // Check what's available at venue (including rented)
    const venueEquipment = this.inventory.installedAtVenues.get(venue.id) || [];
    const rentedEquipment = this.inventory.rented;
    const allEquipment = [...venueEquipment, ...rentedEquipment];
    const availableTypes = new Set(allEquipment.map(eq => eq.type));
    
    const missing = Array.from(requiredTypes).filter(type => !availableTypes.has(type));
    
    return {
      met: missing.length === 0,
      missing
    };
  }

  // Clear all data (for new game)
  clearAll() {
    this.inventory = {
      owned: [],
      rented: [],
      installedAtVenues: new Map()
    };
  }
}

export const equipmentManagerV2 = new EquipmentManagerV2();
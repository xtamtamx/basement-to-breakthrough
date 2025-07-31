import { Venue, VenueUpgrade, VenueUpgradeType as UpgradeType, VenueType, EquipmentType } from '@game/types';

interface UpgradeState {
  venueId: string;
  upgradeId: string;
  turnsRemaining: number;
}

class VenueUpgradeManager {
  private activeUpgrades: Map<string, VenueUpgrade[]> = new Map(); // venueId -> completed upgrades
  private upgradeProgress: UpgradeState[] = [];

  private upgradeCatalog: VenueUpgrade[] = [
    {
      id: 'expand-basement',
      name: 'Basement Expansion',
      description: 'Knock down a wall to fit more people',
      type: UpgradeType.CAPACITY,
      cost: 500,
      duration: 2,
      effects: {
        capacityIncrease: 15
      },
      requirements: {
        minReputation: 10
      }
    },
    {
      id: 'soundproofing-basic',
      name: 'Basic Soundproofing',
      description: 'Reduce noise complaints from neighbors',
      type: UpgradeType.ACOUSTICS,
      cost: 300,
      duration: 1,
      effects: {
        acousticsIncrease: 20
      }
    },
    {
      id: 'soundproofing-pro',
      name: 'Professional Soundproofing',
      description: 'Studio-quality acoustic treatment',
      type: UpgradeType.ACOUSTICS,
      cost: 1500,
      duration: 3,
      effects: {
        acousticsIncrease: 40,
        atmosphereIncrease: 10
      },
      requirements: {
        minReputation: 25
      }
    },
    {
      id: 'stage-platform',
      name: 'Build Stage Platform',
      description: 'Elevate the performers',
      type: UpgradeType.INFRASTRUCTURE,
      cost: 800,
      duration: 3,
      effects: {
        atmosphereIncrease: 25,
        unlockEquipment: [EquipmentType.STAGE]
      }
    },
    {
      id: 'warehouse-conversion',
      name: 'Warehouse Conversion',
      description: 'Convert space into proper venue',
      type: UpgradeType.INFRASTRUCTURE,
      cost: 5000,
      duration: 5,
      effects: {
        capacityIncrease: 100,
        atmosphereIncrease: 30,
        acousticsIncrease: 20
      },
      requirements: {
        minReputation: 50,
        minConnections: 20
      }
    },
    {
      id: 'bar-installation',
      name: 'Install Bar',
      description: 'Start serving drinks for extra revenue',
      type: UpgradeType.AMENITIES,
      cost: 2000,
      duration: 4,
      effects: {
        // This would enable bar revenue in show calculations
        maintenanceCost: 100
      },
      requirements: {
        minReputation: 25,
        minConnections: 10
      }
    },
    {
      id: 'green-room',
      name: 'Build Green Room',
      description: 'Give bands a place to relax',
      type: UpgradeType.AMENITIES,
      cost: 1200,
      duration: 2,
      effects: {
        atmosphereIncrease: 15
      }
    },
    {
      id: 'security-basic',
      name: 'Basic Security',
      description: 'Keep the peace at shows',
      type: UpgradeType.SECURITY,
      cost: 100,
      duration: 0, // Instant
      effects: {
        maintenanceCost: 50 // Per turn
      }
    },
    {
      id: 'security-pro',
      name: 'Professional Security Team',
      description: 'Experienced crowd control',
      type: UpgradeType.SECURITY,
      cost: 500,
      duration: 1,
      effects: {
        maintenanceCost: 150
      },
      requirements: {
        minReputation: 40,
        minConnections: 15
      }
    },
    {
      id: 'power-upgrade',
      name: 'Electrical Upgrade',
      description: 'Support more equipment',
      type: UpgradeType.INFRASTRUCTURE,
      cost: 1000,
      duration: 2,
      effects: {
        unlockEquipment: [EquipmentType.LIGHTING, EquipmentType.PA_SYSTEM]
      }
    },
    {
      id: 'ventilation',
      name: 'Ventilation System',
      description: 'Keep the air breathable',
      type: UpgradeType.INFRASTRUCTURE,
      cost: 800,
      duration: 2,
      effects: {
        capacityIncrease: 10,
        atmosphereIncrease: 15
      }
    },
    {
      id: 'parking-lot',
      name: 'Parking Area',
      description: 'Make it easier for fans to attend',
      type: UpgradeType.AMENITIES,
      cost: 3000,
      duration: 4,
      effects: {
        capacityIncrease: 20
      },
      requirements: {
        minReputation: 30
      }
    }
  ];

  // Get catalog upgrade by id
  getCatalogUpgrade(upgradeId: string): VenueUpgrade | undefined {
    return this.upgradeCatalog.find(u => u.id === upgradeId);
  }

  // Get available upgrades for a venue
  getAvailableUpgrades(venue: Venue, reputation: number, connections: number): VenueUpgrade[] {
    const venueUpgrades = this.activeUpgrades.get(venue.id) || [];
    const completedIds = venueUpgrades.map(u => u.id);
    const inProgressIds = this.upgradeProgress
      .filter(p => p.venueId === venue.id)
      .map(p => p.upgradeId);
    
    return this.upgradeCatalog.filter(upgrade => {
      // Not already applied or in progress
      if (completedIds.includes(upgrade.id) || inProgressIds.includes(upgrade.id)) {
        return false;
      }
      
      // Check requirements
      if (upgrade.requirements) {
        if (upgrade.requirements.minReputation && reputation < upgrade.requirements.minReputation) {
          return false;
        }
        if (upgrade.requirements.minConnections && connections < upgrade.requirements.minConnections) {
          return false;
        }
      }
      
      // Check venue type compatibility
      // Some upgrades might only work for certain venue types
      if (upgrade.type === UpgradeType.CAPACITY && venue.type === VenueType.HOUSE_SHOW) {
        // Can't expand house shows much
        return upgrade.effects.capacityIncrease && upgrade.effects.capacityIncrease <= 20;
      }
      
      return true;
    });
  }

  // Start an upgrade
  startUpgrade(venueId: string, upgradeId: string): { success: boolean; error?: string } {
    const upgrade = this.upgradeCatalog.find(u => u.id === upgradeId);
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }

    // Check if already upgrading this venue
    const existingUpgrade = this.upgradeProgress.find(p => 
      p.venueId === venueId && p.upgradeId === upgradeId
    );
    if (existingUpgrade) {
      return { success: false, error: 'Upgrade already in progress' };
    }

    // Add to progress
    this.upgradeProgress.push({
      venueId,
      upgradeId,
      turnsRemaining: upgrade.duration
    });
    
    // If instant upgrade (duration 0), complete immediately
    if (upgrade.duration === 0) {
      this.completeUpgrade(venueId, upgradeId);
    }
    
    return { success: true };
  }

  // Process turn (advance upgrade progress)
  processTurn(): string[] {
    const completed: string[] = [];
    
    // Update all upgrades
    this.upgradeProgress = this.upgradeProgress.filter(progress => {
      progress.turnsRemaining--;
      
      if (progress.turnsRemaining <= 0) {
        // Complete the upgrade
        this.completeUpgrade(progress.venueId, progress.upgradeId);
        completed.push(progress.upgradeId);
        return false; // Remove from progress
      }
      
      return true; // Keep in progress
    });

    return completed;
  }

  // Complete an upgrade
  private completeUpgrade(venueId: string, upgradeId: string) {
    const upgrade = this.upgradeCatalog.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const venueUpgrades = this.activeUpgrades.get(venueId) || [];
    venueUpgrades.push(upgrade);
    this.activeUpgrades.set(venueId, venueUpgrades);
  }

  // Get ongoing upgrades
  getOngoingUpgrades(venueId?: string): UpgradeState[] {
    if (venueId) {
      return this.upgradeProgress.filter(p => p.venueId === venueId);
    }
    return [...this.upgradeProgress];
  }

  // Get completed upgrades for a venue
  getVenueUpgrades(venueId: string): VenueUpgrade[] {
    return this.activeUpgrades.get(venueId) || [];
  }

  // Calculate total effects for a venue
  getVenueUpgradeEffects(venueId: string) {
    const upgrades = this.activeUpgrades.get(venueId) || [];
    
    const effects = {
      capacityIncrease: 0,
      acousticsIncrease: 0,
      atmosphereIncrease: 0,
      maintenanceCost: 0,
      unlockedEquipment: new Set<EquipmentType>()
    };

    upgrades.forEach(upgrade => {
      if (upgrade.effects.capacityIncrease) {
        effects.capacityIncrease += upgrade.effects.capacityIncrease;
      }
      if (upgrade.effects.acousticsIncrease) {
        effects.acousticsIncrease += upgrade.effects.acousticsIncrease;
      }
      if (upgrade.effects.atmosphereIncrease) {
        effects.atmosphereIncrease += upgrade.effects.atmosphereIncrease;
      }
      if (upgrade.effects.maintenanceCost) {
        effects.maintenanceCost += upgrade.effects.maintenanceCost;
      }
      if (upgrade.effects.unlockEquipment) {
        upgrade.effects.unlockEquipment.forEach(eq => effects.unlockedEquipment.add(eq));
      }
    });

    return {
      ...effects,
      unlockedEquipment: Array.from(effects.unlockedEquipment)
    };
  }

  // Calculate total maintenance costs
  getMaintenanceCosts(venueId: string): number {
    const upgrades = this.activeUpgrades.get(venueId) || [];
    return upgrades.reduce((total, upgrade) => {
      return total + (upgrade.effects.maintenanceCost || 0);
    }, 0);
  }

  // Clear all data (for new game)
  clearAll() {
    this.activeUpgrades.clear();
    this.upgradeProgress = [];
  }

  // Apply an upgrade directly (for save/load)
  applyUpgrade(venueId: string, upgradeId: string): void {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    if (!this.activeUpgrades.has(venueId)) {
      this.activeUpgrades.set(venueId, []);
    }

    const venueUpgrades = this.activeUpgrades.get(venueId)!;
    if (!venueUpgrades.includes(upgradeId)) {
      venueUpgrades.push(upgradeId);
    }
  }
}

export const venueUpgradeManager = new VenueUpgradeManager();
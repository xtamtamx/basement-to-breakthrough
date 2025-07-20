# Phase 2: Infrastructure & Equipment Systems - Implementation Guide

## Overview
This phase adds the infrastructure building aspect to the game, allowing players to invest in equipment, upgrade venues, and manage a more complex resource system. This transforms the game from simple show booking to strategic scene building.

## Core Systems to Implement

### 1. Equipment Management
- PA systems, lighting rigs, stages, backline gear
- Equipment quality levels (1-5 stars)
- Equipment condition and maintenance
- Equipment requirements for bands
- Rental vs ownership options

### 2. Venue Infrastructure
- Venue upgrades (capacity, atmosphere, acoustics)
- Permanent improvements vs temporary modifications
- Equipment installations at venues
- Venue prestige system

### 3. Expanded Resources
- Add "Connections" resource for networking
- Implement stress management mechanics
- Equipment maintenance costs
- Infrastructure ROI calculations

## Step-by-Step Implementation

### Step 1: Update Equipment Types in core.ts

Add comprehensive equipment system types:

```typescript
// Add to core.ts

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  quality: number; // 1-5 stars
  condition: number; // 0-100%
  maintenanceCost: number;
  purchasePrice: number;
  rentalPrice: number;
  owned: boolean;
  effects: EquipmentEffects;
  requirements?: EquipmentRequirements;
}

export interface EquipmentEffects {
  capacityBonus?: number; // Percentage increase
  acousticsBonus?: number; // Flat bonus to venue acoustics
  atmosphereBonus?: number; // Flat bonus to venue atmosphere
  reputationMultiplier?: number; // Show reputation multiplier
  stressReduction?: number; // Reduces band stress
  incidentReduction?: number; // Reduces chance of technical failures
}

export interface EquipmentRequirements {
  venueType?: VenueType[]; // Can only be used in certain venues
  minCapacity?: number; // Minimum venue capacity needed
  powerRequirements?: number; // Electrical needs
  spaceRequirements?: number; // Physical space needed
}

export interface VenueUpgrade {
  id: string;
  name: string;
  description: string;
  type: UpgradeType;
  cost: number;
  duration: number; // Turns to complete
  effects: VenueUpgradeEffects;
  requirements?: VenueRequirements;
}

export enum UpgradeType {
  CAPACITY = 'CAPACITY',
  ACOUSTICS = 'ACOUSTICS',
  ATMOSPHERE = 'ATMOSPHERE',
  AMENITIES = 'AMENITIES',
  SECURITY = 'SECURITY',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}

export interface VenueUpgradeEffects {
  capacityIncrease?: number;
  acousticsIncrease?: number;
  atmosphereIncrease?: number;
  maintenanceCost?: number; // Ongoing cost
  unlockEquipment?: EquipmentType[]; // Enables certain equipment
}

export interface VenueRequirements {
  minReputation?: number;
  minConnections?: number;
  factionStanding?: { factionId: string; minStanding: number };
}
```

### Step 2: Create Enhanced EquipmentManager

Update `/src/game/mechanics/EquipmentManager.ts`:

```typescript
import { Equipment, EquipmentType, Band, Venue, EquipmentEffects } from '@game/types';

interface EquipmentInventory {
  owned: Equipment[];
  rented: Equipment[];
  installedAtVenues: Map<string, Equipment[]>; // venueId -> equipment
}

class EquipmentManager {
  private inventory: EquipmentInventory = {
    owned: [],
    rented: [],
    installedAtVenues: new Map()
  };

  private equipmentCatalog: Equipment[] = [
    {
      id: 'pa-basic',
      name: 'Basic PA System',
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
      name: 'Professional PA System',
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
      id: 'lights-basic',
      name: 'Basic Stage Lights',
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
    }
  ];

  // Get available equipment for purchase/rental
  getAvailableEquipment(): Equipment[] {
    return this.equipmentCatalog.filter(eq => 
      !this.inventory.owned.some(owned => owned.id === eq.id)
    );
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

    // Check requirements
    if (equipment.requirements) {
      if (equipment.requirements.minCapacity && venue.capacity < equipment.requirements.minCapacity) {
        return { success: false, error: 'Venue too small' };
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

  // Get equipment effects for a venue
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
      if (eq.effects.capacityBonus) {
        combinedEffects.capacityBonus! += eq.effects.capacityBonus;
      }
      if (eq.effects.acousticsBonus) {
        combinedEffects.acousticsBonus! += eq.effects.acousticsBonus;
      }
      if (eq.effects.atmosphereBonus) {
        combinedEffects.atmosphereBonus! += eq.effects.atmosphereBonus;
      }
      if (eq.effects.reputationMultiplier) {
        combinedEffects.reputationMultiplier! *= eq.effects.reputationMultiplier;
      }
      if (eq.effects.stressReduction) {
        combinedEffects.stressReduction! += eq.effects.stressReduction;
      }
      if (eq.effects.incidentReduction) {
        combinedEffects.incidentReduction! += eq.effects.incidentReduction;
      }
    });

    return combinedEffects;
  }

  // Apply equipment degradation
  degradeEquipment(showCount: number = 1) {
    this.inventory.owned.forEach(eq => {
      eq.condition = Math.max(0, eq.condition - (showCount * 2)); // 2% per show
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
    const requiredTypes: EquipmentType[] = [];
    
    // Basic requirements based on band technical skill
    if (band.technicalSkill > 70) {
      requiredTypes.push(EquipmentType.PA_SYSTEM);
      requiredTypes.push(EquipmentType.LIGHTING);
    }
    if (band.technicalSkill > 85) {
      requiredTypes.push(EquipmentType.BACKLINE);
    }

    // Check what's available at venue
    const venueEquipment = this.inventory.installedAtVenues.get(venue.id) || [];
    const availableTypes = new Set(venueEquipment.map(eq => eq.type));
    
    const missing = requiredTypes.filter(type => !availableTypes.has(type));
    
    return {
      met: missing.length === 0,
      missing
    };
  }
}

export const equipmentManager = new EquipmentManager();
```

### Step 3: Create Equipment Shop UI

Create `/src/components/game/EquipmentShop.tsx`:

```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Equipment, EquipmentType } from '@game/types';
import { equipmentManager } from '@game/mechanics/EquipmentManager';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface EquipmentShopProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (equipment: Equipment) => void;
  onRent: (equipment: Equipment) => void;
}

export const EquipmentShop: React.FC<EquipmentShopProps> = ({
  isOpen,
  onClose,
  onPurchase,
  onRent
}) => {
  const { money } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<EquipmentType | 'ALL'>('ALL');
  const availableEquipment = equipmentManager.getAvailableEquipment();

  const categories = [
    { id: 'ALL', name: 'ALL', icon: '🎵' },
    { id: EquipmentType.PA_SYSTEM, name: 'PA SYSTEMS', icon: '🔊' },
    { id: EquipmentType.LIGHTING, name: 'LIGHTING', icon: '💡' },
    { id: EquipmentType.STAGE, name: 'STAGES', icon: '🎭' },
    { id: EquipmentType.BACKLINE, name: 'BACKLINE', icon: '🎸' },
    { id: EquipmentType.RECORDING, name: 'RECORDING', icon: '🎙️' }
  ];

  const filteredEquipment = selectedCategory === 'ALL' 
    ? availableEquipment 
    : availableEquipment.filter(eq => eq.type === selectedCategory);

  const getQualityStars = (quality: number) => {
    return '⭐'.repeat(quality) + '☆'.repeat(5 - quality);
  };

  const canAfford = (price: number) => money >= price;

  const handlePurchase = (equipment: Equipment) => {
    if (canAfford(equipment.purchasePrice)) {
      haptics.success();
      audio.play('purchase');
      onPurchase(equipment);
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  const handleRent = (equipment: Equipment) => {
    if (canAfford(equipment.rentalPrice)) {
      haptics.light();
      audio.play('click');
      onRent(equipment);
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-yellow)' }}>
              EQUIPMENT SHOP
            </h2>
            <button
              onClick={onClose}
              className="pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-red)' }}
            >
              <span className="pixel-text">X</span>
            </button>
          </div>

          {/* Budget Display */}
          <div className="glass-panel p-3 mb-4">
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              BUDGET: ${money}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`pixel-button p-2 flex items-center gap-2 ${
                  selectedCategory === cat.id ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <span>{cat.icon}</span>
                <span className="pixel-text pixel-text-xs">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Equipment List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredEquipment.map(equipment => (
              <motion.div
                key={equipment.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="glass-panel p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                      {equipment.name}
                    </h3>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      {getQualityStars(equipment.quality)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                      BUY: ${equipment.purchasePrice}
                    </p>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                      RENT: ${equipment.rentalPrice}
                    </p>
                  </div>
                </div>

                {/* Effects */}
                <div className="mb-3 space-y-1">
                  {equipment.effects.capacityBonus && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                      +{equipment.effects.capacityBonus}% CAPACITY
                    </p>
                  )}
                  {equipment.effects.acousticsBonus && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                      +{equipment.effects.acousticsBonus} ACOUSTICS
                    </p>
                  )}
                  {equipment.effects.atmosphereBonus && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-magenta)' }}>
                      +{equipment.effects.atmosphereBonus} ATMOSPHERE
                    </p>
                  )}
                  {equipment.effects.reputationMultiplier && equipment.effects.reputationMultiplier > 1 && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                      x{equipment.effects.reputationMultiplier} REPUTATION
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePurchase(equipment)}
                    disabled={!canAfford(equipment.purchasePrice)}
                    className={`flex-1 pixel-button p-2 ${
                      canAfford(equipment.purchasePrice) 
                        ? 'hover:scale-105' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ 
                      backgroundColor: canAfford(equipment.purchasePrice) 
                        ? 'var(--pixel-green)' 
                        : 'var(--pixel-gray)'
                    }}
                  >
                    <span className="pixel-text pixel-text-xs">BUY</span>
                  </button>
                  <button
                    onClick={() => handleRent(equipment)}
                    disabled={!canAfford(equipment.rentalPrice)}
                    className={`flex-1 pixel-button p-2 ${
                      canAfford(equipment.rentalPrice) 
                        ? 'hover:scale-105' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ 
                      backgroundColor: canAfford(equipment.rentalPrice) 
                        ? 'var(--pixel-yellow)' 
                        : 'var(--pixel-gray)'
                    }}
                  >
                    <span className="pixel-text pixel-text-xs">RENT</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
```

### Step 4: Create Venue Upgrade System

Create `/src/game/mechanics/VenueUpgradeManager.ts`:

```typescript
import { Venue, VenueUpgrade, UpgradeType, VenueType } from '@game/types';

class VenueUpgradeManager {
  private activeUpgrades: Map<string, VenueUpgrade[]> = new Map(); // venueId -> upgrades
  private upgradeProgress: Map<string, number> = new Map(); // upgradeId -> turns remaining

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
      id: 'soundproofing',
      name: 'Soundproofing',
      description: 'Reduce noise complaints from neighbors',
      type: UpgradeType.ACOUSTICS,
      cost: 300,
      duration: 1,
      effects: {
        acousticsIncrease: 20
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
      id: 'bar-installation',
      name: 'Install Bar',
      description: 'Start serving drinks for extra revenue',
      type: UpgradeType.AMENITIES,
      cost: 2000,
      duration: 4,
      effects: {
        // This would enable bar revenue in show calculations
      },
      requirements: {
        minReputation: 25,
        minConnections: 10
      }
    },
    {
      id: 'security-upgrade',
      name: 'Hire Security',
      description: 'Keep the peace at rowdy shows',
      type: UpgradeType.SECURITY,
      cost: 100,
      duration: 0, // Instant
      effects: {
        maintenanceCost: 50 // Per turn
      }
    }
  ];

  // Get available upgrades for a venue
  getAvailableUpgrades(venue: Venue, reputation: number, connections: number): VenueUpgrade[] {
    const venueUpgrades = this.activeUpgrades.get(venue.id) || [];
    const completedIds = venueUpgrades.map(u => u.id);
    
    return this.upgradeCatalog.filter(upgrade => {
      // Not already applied
      if (completedIds.includes(upgrade.id)) return false;
      
      // Check requirements
      if (upgrade.requirements) {
        if (upgrade.requirements.minReputation && reputation < upgrade.requirements.minReputation) {
          return false;
        }
        if (upgrade.requirements.minConnections && connections < upgrade.requirements.minConnections) {
          return false;
        }
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

    // Check if already upgrading
    if (this.upgradeProgress.has(upgradeId)) {
      return { success: false, error: 'Upgrade already in progress' };
    }

    this.upgradeProgress.set(upgradeId, upgrade.duration);
    
    return { success: true };
  }

  // Process turn (advance upgrade progress)
  processTurn() {
    const completed: string[] = [];
    
    this.upgradeProgress.forEach((turnsRemaining, upgradeId) => {
      const newTurns = turnsRemaining - 1;
      if (newTurns <= 0) {
        completed.push(upgradeId);
      } else {
        this.upgradeProgress.set(upgradeId, newTurns);
      }
    });

    // Complete upgrades
    completed.forEach(upgradeId => {
      this.upgradeProgress.delete(upgradeId);
      // Apply upgrade effects would happen here
    });

    return completed;
  }

  // Get ongoing upgrades
  getOngoingUpgrades(): Array<{ upgradeId: string; turnsRemaining: number }> {
    const ongoing: Array<{ upgradeId: string; turnsRemaining: number }> = [];
    
    this.upgradeProgress.forEach((turns, id) => {
      ongoing.push({ upgradeId: id, turnsRemaining: turns });
    });
    
    return ongoing;
  }

  // Calculate total maintenance costs
  getMaintenanceCosts(venueId: string): number {
    const upgrades = this.activeUpgrades.get(venueId) || [];
    return upgrades.reduce((total, upgrade) => {
      return total + (upgrade.effects.maintenanceCost || 0);
    }, 0);
  }
}

export const venueUpgradeManager = new VenueUpgradeManager();
```

### Step 5: Update Game Store for New Resources

Update `/src/stores/gameStore.ts`:

```typescript
// Add to GameStore interface
connections: number;
stress: number;

// Add actions
addConnections: (amount: number) => void;
addStress: (amount: number) => void;

// Update initial state
connections: 0,
stress: 0,

// Add implementations
addConnections: (amount) =>
  set((state) => ({ connections: Math.max(0, state.connections + amount) })),
  
addStress: (amount) =>
  set((state) => ({ stress: Math.max(0, Math.min(100, state.stress + amount)) })),
```

### Step 6: Integrate Equipment into Show Execution

Update ShowExecutor to consider equipment:

```typescript
// In ShowExecutor.executeShow method, add:

// Get equipment effects
const equipmentEffects = equipmentManager.getVenueEquipmentEffects(venue.id);

// Apply equipment modifiers
if (equipmentEffects.capacityBonus) {
  finalAttendance *= (1 + equipmentEffects.capacityBonus / 100);
}

if (equipmentEffects.reputationMultiplier) {
  reputationMultiplier *= equipmentEffects.reputationMultiplier;
}

// Check band equipment requirements
const requirements = equipmentManager.checkBandRequirements(band, venue);
if (!requirements.met) {
  // Reduce attendance and add stress
  finalAttendance *= 0.7;
  stress += 20;
  
  incidents.push({
    type: 'EQUIPMENT_MISSING',
    description: `Missing required equipment: ${requirements.missing.join(', ')}`,
    effects: { attendanceChange: -30, stressIncrease: 20 }
  });
}

// Apply stress reduction from equipment
if (equipmentEffects.stressReduction) {
  stress -= equipmentEffects.stressReduction;
}
```

### Step 7: Create Equipment Management UI

Create a component to display owned equipment and allow venue installations:

```typescript
// Create EquipmentInventory.tsx component
// Show owned equipment
// Allow installing at venues
// Show maintenance costs
// Allow repairs
```

### Step 8: Testing Points

1. Purchase equipment and see effects on shows
2. Rent equipment for single shows
3. Install equipment at venues
4. Watch equipment degrade over time
5. Upgrade venues and see capacity/quality improvements
6. Balance costs vs benefits
7. Test band requirements system

## Next Steps

Once Phase 2 is complete:
1. Equipment should meaningfully impact show success
2. Venue upgrades should provide long-term benefits
3. Infrastructure investment should feel rewarding
4. Resource management becomes more complex
5. Players have more strategic choices

This phase transforms the game from simple booking to infrastructure management!
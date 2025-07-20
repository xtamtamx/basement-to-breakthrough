import { Equipment, EquipmentEffect, EQUIPMENT_CATALOG } from '@game/types/equipment';
import { Band, Venue } from '@game/types';

export interface OwnedEquipment {
  equipmentId: string;
  quantity: number;
  equipped: boolean;
}

class EquipmentManager {
  private ownedEquipment: Map<string, OwnedEquipment> = new Map();
  private equippedItems: Set<string> = new Set();

  // Purchase equipment
  purchaseEquipment(equipmentId: string): boolean {
    const equipment = EQUIPMENT_CATALOG.find(eq => eq.id === equipmentId);
    if (!equipment) return false;

    const owned = this.ownedEquipment.get(equipmentId);
    
    if (owned) {
      // Check if stackable
      if (equipment.stackable && (!equipment.maxStacks || owned.quantity < equipment.maxStacks)) {
        owned.quantity++;
        return true;
      }
      return false; // Already owned and not stackable
    } else {
      // New equipment
      this.ownedEquipment.set(equipmentId, {
        equipmentId,
        quantity: 1,
        equipped: false,
      });
      return true;
    }
  }

  // Equip/unequip equipment
  toggleEquipment(equipmentId: string): boolean {
    const owned = this.ownedEquipment.get(equipmentId);
    if (!owned) return false;

    if (owned.equipped) {
      owned.equipped = false;
      this.equippedItems.delete(equipmentId);
    } else {
      owned.equipped = true;
      this.equippedItems.add(equipmentId);
    }

    return true;
  }

  // Get all owned equipment
  getOwnedEquipment(): OwnedEquipment[] {
    return Array.from(this.ownedEquipment.values());
  }

  // Get equipped items
  getEquippedItems(): Equipment[] {
    return Array.from(this.equippedItems)
      .map(id => EQUIPMENT_CATALOG.find(eq => eq.id === id))
      .filter((eq): eq is Equipment => eq !== undefined);
  }

  // Calculate total effects from equipped items
  calculateEffects(band?: Band, venue?: Venue): Map<string, number> {
    const effects = new Map<string, number>();
    
    // Initialize base values
    effects.set('attendance_multiply', 1);
    effects.set('revenue_multiply', 1);
    effects.set('reputation_multiply', 1);
    effects.set('fans_multiply', 1);
    effects.set('incidents_multiply', 1);
    effects.set('stress_multiply', 1);
    
    effects.set('attendance_add', 0);
    effects.set('revenue_add', 0);
    effects.set('reputation_add', 0);
    effects.set('fans_add', 0);
    effects.set('stress_reduce', 0);

    // Apply effects from equipped items
    this.getEquippedItems().forEach(equipment => {
      const owned = this.ownedEquipment.get(equipment.id);
      const quantity = owned?.quantity || 1;

      equipment.effects.forEach(effect => {
        // Check condition
        if (effect.condition && !this.checkCondition(effect.condition, band, venue)) {
          return;
        }

        const key = `${effect.target}_${effect.type}`;
        const currentValue = effects.get(key) || (effect.type === 'multiply' ? 1 : 0);

        switch (effect.type) {
          case 'multiply':
            // Multiplicative stacking
            effects.set(key, currentValue * Math.pow(effect.value, quantity));
            break;
          case 'add':
            // Additive stacking
            effects.set(key, currentValue + (effect.value * quantity));
            break;
          case 'reduce':
            // Reduction stacking (multiplicative)
            effects.set(key, currentValue * Math.pow(1 - effect.value, quantity));
            break;
          case 'prevent':
            // Prevention doesn't stack
            effects.set(key, effect.value);
            break;
        }
      });
    });

    return effects;
  }

  // Check if a condition is met
  private checkCondition(condition: string, band?: Band, venue?: Venue): boolean {
    switch (condition) {
      case 'metal_bands':
        return band?.genre === 'METAL';
      case 'punk_bands':
        return band?.genre === 'PUNK';
      case 'small_venues':
        return venue ? venue.capacity < 50 : false;
      case 'diy_space':
        return venue?.type === 'DIY_SPACE';
      case 'crowd_incident':
        // This would be checked during incident calculation
        return true;
      default:
        return true;
    }
  }

  // Apply equipment effects to show results
  applyEffectsToShow(
    baseAttendance: number,
    baseRevenue: number,
    baseReputation: number,
    baseFans: number,
    band?: Band,
    venue?: Venue
  ): {
    attendance: number;
    revenue: number;
    reputation: number;
    fans: number;
  } {
    const effects = this.calculateEffects(band, venue);

    const attendance = Math.floor(
      (baseAttendance * (effects.get('attendance_multiply') || 1)) +
      (effects.get('attendance_add') || 0)
    );

    const revenue = Math.floor(
      (baseRevenue * (effects.get('revenue_multiply') || 1)) +
      (effects.get('revenue_add') || 0)
    );

    const reputation = Math.floor(
      (baseReputation * (effects.get('reputation_multiply') || 1)) +
      (effects.get('reputation_add') || 0)
    );

    const fans = Math.floor(
      (baseFans * (effects.get('fans_multiply') || 1)) +
      (effects.get('fans_add') || 0)
    );

    return { attendance, revenue, reputation, fans };
  }

  // Get incident chance modifier
  getIncidentModifier(): number {
    const effects = this.calculateEffects();
    const incidentMultiplier = effects.get('incidents_multiply') || 1;
    const incidentReduce = 1 - (effects.get('incidents_reduce') || 0);
    return incidentMultiplier * incidentReduce;
  }

  // Get stress modifier
  getStressModifier(): number {
    const effects = this.calculateEffects();
    return effects.get('stress_reduce') || 0;
  }

  // Save/load functionality
  serialize(): string {
    return JSON.stringify({
      owned: Array.from(this.ownedEquipment.entries()),
      equipped: Array.from(this.equippedItems),
    });
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.ownedEquipment = new Map(parsed.owned);
      this.equippedItems = new Set(parsed.equipped);
    } catch (error) {
      console.error('Failed to deserialize equipment data:', error);
    }
  }
}

export const equipmentManager = new EquipmentManager();
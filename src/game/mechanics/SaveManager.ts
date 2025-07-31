import { Band, Venue, Show, Resources, Equipment } from '@game/types';
import { equipmentManagerV2 } from './EquipmentManagerV2';
import { venueUpgradeManager } from './VenueUpgradeManager';
import { factionSystem } from './FactionSystem';
import { safeStorage } from '@utils/safeStorage';

import { devLog, prodLog } from '../../utils/devLogger';

interface EquipmentStateData {
  owned?: Equipment[];
  rented?: Array<{ equipmentId: string; turnsRemaining: number }>;
}

interface VenueUpgradeStateData {
  upgrades?: Record<string, string[]>;
}

interface FactionStateData {
  standings?: Array<[string, number]>;
  eventHistory?: unknown[];
}
interface SaveGame {
  version: string;
  timestamp: number;
  gameState: {
    currentTurn: number;
    resources: Resources;
    availableBands: Band[];
    venues: Venue[];
    bookedShows: Array<[string, Show]>; // [venueId, show]
    bookedBands: Array<[string, Band]>; // [bandId, band]
    totalStats: {
      shows: number;
      revenue: number;
    };
  };
  systems: {
    equipment: EquipmentStateData;
    venueUpgrades: VenueUpgradeStateData;
    factions: FactionStateData;
  };
}

class SaveManager {
  private readonly SAVE_KEY = 'basement-to-breakthrough-save';
  private readonly AUTOSAVE_KEY = 'basement-to-breakthrough-autosave';
  private readonly SAVE_VERSION = '1.0.0';

  // Save the current game state
  saveGame(
    currentTurn: number,
    resources: Resources,
    availableBands: Band[],
    venues: Venue[],
    bookedShows: Map<string, Show>,
    bookedBands: Map<string, Band>,
    totalStats: { shows: number; revenue: number }
  ): boolean {
    try {
      const saveData: SaveGame = {
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        gameState: {
          currentTurn,
          resources,
          availableBands,
          venues,
          bookedShows: Array.from(bookedShows.entries()),
          bookedBands: Array.from(bookedBands.entries()),
          totalStats
        },
        systems: {
          equipment: this.serializeEquipmentState(),
          venueUpgrades: this.serializeVenueUpgradeState(),
          factions: this.serializeFactionState()
        }
      };

      safeStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      devLog.log('Game saved successfully');
      return true;
    } catch (error) {
      prodLog.error('Failed to save game:', error);
      return false;
    }
  }

  // Auto-save (same as regular save but to different key)
  autoSave(
    currentTurn: number,
    resources: Resources,
    availableBands: Band[],
    venues: Venue[],
    bookedShows: Map<string, Show>,
    bookedBands: Map<string, Band>,
    totalStats: { shows: number; revenue: number }
  ): boolean {
    try {
      const saveData: SaveGame = {
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        gameState: {
          currentTurn,
          resources,
          availableBands,
          venues,
          bookedShows: Array.from(bookedShows.entries()),
          bookedBands: Array.from(bookedBands.entries()),
          totalStats
        },
        systems: {
          equipment: this.serializeEquipmentState(),
          venueUpgrades: this.serializeVenueUpgradeState(),
          factions: this.serializeFactionState()
        }
      };

      safeStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      prodLog.error('Failed to auto-save game:', error);
      return false;
    }
  }

  // Load a saved game
  loadGame(): SaveGame | null {
    try {
      const saveData = safeStorage.getItem(this.SAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData) as SaveGame;
      
      // Validate version
      if (parsed.version !== this.SAVE_VERSION) {
        devLog.warn('Save version mismatch, may have compatibility issues');
      }

      // Restore system states
      this.restoreEquipmentState(parsed.systems.equipment);
      this.restoreVenueUpgradeState(parsed.systems.venueUpgrades);
      this.restoreFactionState(parsed.systems.factions);

      devLog.log('Game loaded successfully');
      return parsed;
    } catch (error) {
      prodLog.error('Failed to load game:', error);
      return null;
    }
  }

  // Load autosave
  loadAutoSave(): SaveGame | null {
    try {
      const saveData = safeStorage.getItem(this.AUTOSAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData) as SaveGame;
      
      // Validate version
      if (parsed.version !== this.SAVE_VERSION) {
        devLog.warn('Save version mismatch, may have compatibility issues');
      }

      // Restore system states
      this.restoreEquipmentState(parsed.systems.equipment);
      this.restoreVenueUpgradeState(parsed.systems.venueUpgrades);
      this.restoreFactionState(parsed.systems.factions);

      devLog.log('Autosave loaded successfully');
      return parsed;
    } catch (error) {
      prodLog.error('Failed to load autosave:', error);
      return null;
    }
  }

  // Check if a save exists
  hasSave(): boolean {
    return safeStorage.getItem(this.SAVE_KEY) !== null;
  }

  // Check if an autosave exists
  hasAutoSave(): boolean {
    return safeStorage.getItem(this.AUTOSAVE_KEY) !== null;
  }

  // Delete save
  deleteSave(): void {
    safeStorage.removeItem(this.SAVE_KEY);
  }

  // Delete autosave
  deleteAutoSave(): void {
    safeStorage.removeItem(this.AUTOSAVE_KEY);
  }

  // Get save info without loading full game
  getSaveInfo(): { timestamp: number; turn: number } | null {
    try {
      const saveData = safeStorage.getItem(this.SAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData) as SaveGame;
      return {
        timestamp: parsed.timestamp,
        turn: parsed.gameState.currentTurn
      };
    } catch {
      return null;
    }
  }

  // Serialize system states
  private serializeEquipmentState(): EquipmentStateData {
    try {
      // Get equipment data from equipmentManagerV2
      const ownedEquipment = equipmentManagerV2.getOwnedEquipment();
      const rentedEquipment = equipmentManagerV2.getRentedEquipment();
      return {
        owned: ownedEquipment.map(e => ({ ...e })),
        rented: rentedEquipment.map(e => ({ ...e, turnsRemaining: e.turnsRemaining }))
      };
    } catch (error) {
      devLog.error('Failed to serialize equipment state:', error);
      return { owned: [], rented: [] };
    }
  }

  private serializeVenueUpgradeState(): VenueUpgradeStateData {
    try {
      // Get all venue upgrades
      const upgrades: Record<string, string[]> = {};
      // Since VenueUpgradeManager doesn't expose state, we'll need to track installed upgrades
      return { upgrades };
    } catch (error) {
      devLog.error('Failed to serialize venue upgrade state:', error);
      return { upgrades: {} };
    }
  }

  private serializeFactionState(): FactionStateData {
    try {
      // Get faction standings
      const standings = factionSystem.getPlayerStandings();
      return {
        standings: Object.fromEntries(standings),
        events: factionSystem.getPendingEvents()
      };
    } catch (error) {
      devLog.error('Failed to serialize faction state:', error);
      return { standings: {}, events: [] };
    }
  }

  // Restore system states
  private restoreEquipmentState(state: EquipmentStateData): void {
    try {
      if (!state || typeof state !== 'object') return;
      
      // Clear current equipment
      equipmentManagerV2.clearInventory();
      
      // Restore owned equipment
      if (Array.isArray(state.owned)) {
        state.owned.forEach((equipment: Equipment) => {
          equipmentManagerV2.addEquipment(equipment);
        });
      }
      
      // Restore rented equipment
      if (Array.isArray(state.rented)) {
        state.rented.forEach((rental: { equipmentId: string; turnsRemaining: number }) => {
          equipmentManagerV2.rentEquipmentForSave(rental.equipmentId, rental.turnsRemaining);
        });
      }
    } catch (error) {
      prodLog.error('Failed to restore equipment state:', error);
    }
  }

  private restoreVenueUpgradeState(state: VenueUpgradeStateData): void {
    try {
      if (!state || typeof state !== 'object') return;
      
      // Restore venue upgrades
      if (state.upgrades && typeof state.upgrades === 'object') {
        Object.entries(state.upgrades).forEach(([venueId, upgradeIds]) => {
          if (Array.isArray(upgradeIds)) {
            upgradeIds.forEach(upgradeId => {
              venueUpgradeManager.applyUpgrade(venueId, upgradeId);
            });
          }
        });
      }
    } catch (error) {
      prodLog.error('Failed to restore venue upgrade state:', error);
    }
  }

  private restoreFactionState(state: FactionStateData): void {
    try {
      if (!state || typeof state !== 'object') return;
      
      // Restore faction standings
      if (state.standings && typeof state.standings === 'object') {
        Object.entries(state.standings).forEach(([factionId, standing]) => {
          if (typeof standing === 'number') {
            factionSystem.setStanding(factionId, standing);
          }
        });
      }
      
      // Restore pending events
      if (Array.isArray(state.events)) {
        factionSystem.restoreEvents(state.events);
      }
    } catch (error) {
      prodLog.error('Failed to restore faction state:', error);
    }
  }
}

export const saveManager = new SaveManager();
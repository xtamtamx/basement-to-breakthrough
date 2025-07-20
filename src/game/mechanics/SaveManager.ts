import { GameState, Band, Venue, Show, Resources } from '@game/types';
import { equipmentManagerV2 } from './EquipmentManagerV2';
import { venueUpgradeManager } from './VenueUpgradeManager';
import { factionSystem } from './FactionSystem';

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
    equipment: any; // Equipment manager state
    venueUpgrades: any; // Venue upgrade manager state
    factions: any; // Faction system state
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

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
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

      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to auto-save game:', error);
      return false;
    }
  }

  // Load a saved game
  loadGame(): SaveGame | null {
    try {
      const saveData = localStorage.getItem(this.SAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData) as SaveGame;
      
      // Validate version
      if (parsed.version !== this.SAVE_VERSION) {
        console.warn('Save version mismatch, may have compatibility issues');
      }

      // Restore system states
      this.restoreEquipmentState(parsed.systems.equipment);
      this.restoreVenueUpgradeState(parsed.systems.venueUpgrades);
      this.restoreFactionState(parsed.systems.factions);

      console.log('Game loaded successfully');
      return parsed;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  // Load autosave
  loadAutoSave(): SaveGame | null {
    try {
      const saveData = localStorage.getItem(this.AUTOSAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData) as SaveGame;
      
      // Validate version
      if (parsed.version !== this.SAVE_VERSION) {
        console.warn('Save version mismatch, may have compatibility issues');
      }

      // Restore system states
      this.restoreEquipmentState(parsed.systems.equipment);
      this.restoreVenueUpgradeState(parsed.systems.venueUpgrades);
      this.restoreFactionState(parsed.systems.factions);

      console.log('Autosave loaded successfully');
      return parsed;
    } catch (error) {
      console.error('Failed to load autosave:', error);
      return null;
    }
  }

  // Check if a save exists
  hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  // Check if an autosave exists
  hasAutoSave(): boolean {
    return localStorage.getItem(this.AUTOSAVE_KEY) !== null;
  }

  // Delete save
  deleteSave(): void {
    localStorage.removeItem(this.SAVE_KEY);
  }

  // Delete autosave
  deleteAutoSave(): void {
    localStorage.removeItem(this.AUTOSAVE_KEY);
  }

  // Get save info without loading full game
  getSaveInfo(): { timestamp: number; turn: number } | null {
    try {
      const saveData = localStorage.getItem(this.SAVE_KEY);
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
  private serializeEquipmentState(): any {
    // This would need to be implemented in EquipmentManagerV2
    // For now, return empty object
    return {};
  }

  private serializeVenueUpgradeState(): any {
    // This would need to be implemented in VenueUpgradeManager
    // For now, return empty object
    return {};
  }

  private serializeFactionState(): any {
    // This would need to be implemented in FactionSystem
    // For now, return empty object
    return {};
  }

  // Restore system states
  private restoreEquipmentState(state: any): void {
    // This would need to be implemented in EquipmentManagerV2
  }

  private restoreVenueUpgradeState(state: any): void {
    // This would need to be implemented in VenueUpgradeManager
  }

  private restoreFactionState(state: any): void {
    // This would need to be implemented in FactionSystem
  }
}

export const saveManager = new SaveManager();
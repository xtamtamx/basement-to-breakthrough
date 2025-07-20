import { GameState } from '@game/types';
import { db } from '@utils/db';

export interface SaveGame {
  id: string;
  name: string;
  timestamp: number;
  gameState: GameState;
  stats: {
    totalShows: number;
    totalRevenue: number;
    highestReputation: number;
    turnsPlayed: number;
  };
  version: string;
}

class SaveSystem {
  private readonly SAVE_VERSION = '1.0.0';
  private readonly AUTO_SAVE_KEY = 'auto_save';

  // Save game to IndexedDB
  async saveGame(name: string, gameState: GameState, stats?: SaveGame['stats']): Promise<void> {
    const saveGame: SaveGame = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      gameState,
      stats: stats || {
        totalShows: 0,
        totalRevenue: 0,
        highestReputation: gameState.resources.reputation,
        turnsPlayed: gameState.turn,
      },
      version: this.SAVE_VERSION,
    };

    try {
      await db.saveGame(saveGame);
      console.log(`Game saved: ${name}`);
    } catch (error) {
      console.error('Failed to save game:', error);
      throw new Error('Failed to save game');
    }
  }

  // Load game from IndexedDB
  async loadGame(saveId: string): Promise<SaveGame | null> {
    try {
      const save = await db.loadGame(saveId);
      if (!save) {
        console.error('Save not found');
        return null;
      }

      // Check version compatibility
      if (save.version !== this.SAVE_VERSION) {
        console.warn(`Save version mismatch: ${save.version} vs ${this.SAVE_VERSION}`);
        // In a real game, you'd handle migration here
      }

      return save;
    } catch (error) {
      console.error('Failed to load game:', error);
      throw new Error('Failed to load game');
    }
  }

  // Get all saves
  async getAllSaves(): Promise<SaveGame[]> {
    try {
      return await db.getAllSaves();
    } catch (error) {
      console.error('Failed to get saves:', error);
      return [];
    }
  }

  // Delete a save
  async deleteSave(saveId: string): Promise<void> {
    try {
      await db.deleteSave(saveId);
      console.log(`Save deleted: ${saveId}`);
    } catch (error) {
      console.error('Failed to delete save:', error);
      throw new Error('Failed to delete save');
    }
  }

  // Auto-save functionality
  async autoSave(gameState: GameState, stats?: SaveGame['stats']): Promise<void> {
    await this.saveGame('Auto Save', gameState, stats);
    localStorage.setItem(this.AUTO_SAVE_KEY, Date.now().toString());
  }

  // Check if auto-save exists
  async hasAutoSave(): Promise<boolean> {
    const saves = await this.getAllSaves();
    return saves.some(save => save.name === 'Auto Save');
  }

  // Get last auto-save time
  getLastAutoSaveTime(): number | null {
    const time = localStorage.getItem(this.AUTO_SAVE_KEY);
    return time ? parseInt(time, 10) : null;
  }

  // Export save to JSON (for sharing)
  exportSave(save: SaveGame): string {
    return JSON.stringify(save, null, 2);
  }

  // Import save from JSON
  importSave(jsonString: string): SaveGame {
    try {
      const save = JSON.parse(jsonString) as SaveGame;
      
      // Validate save structure
      if (!save.name || !save.gameState || !save.version) {
        throw new Error('Invalid save file format');
      }

      return save;
    } catch (error) {
      console.error('Failed to import save:', error);
      throw new Error('Failed to import save file');
    }
  }

  // Create a quick save
  async quickSave(gameState: GameState): Promise<void> {
    const quickSaveNumber = await this.getQuickSaveNumber();
    await this.saveGame(`Quick Save ${quickSaveNumber}`, gameState);
  }

  private async getQuickSaveNumber(): Promise<number> {
    const saves = await this.getAllSaves();
    const quickSaves = saves.filter(s => s.name.startsWith('Quick Save'));
    return quickSaves.length + 1;
  }

  // Save game settings separately
  saveSettings(settings: any): void {
    localStorage.setItem('game_settings', JSON.stringify(settings));
  }

  loadSettings(): any {
    const settings = localStorage.getItem('game_settings');
    return settings ? JSON.parse(settings) : null;
  }
}

export const saveSystem = new SaveSystem();

// React hook for save/load functionality
import { useState, useEffect } from 'react';

export const useSaveGame = () => {
  const [saves, setSaves] = useState<SaveGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = async () => {
    setLoading(true);
    try {
      const allSaves = await saveSystem.getAllSaves();
      setSaves(allSaves.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      setError('Failed to load saves');
    } finally {
      setLoading(false);
    }
  };

  const save = async (name: string, gameState: GameState, stats?: SaveGame['stats']) => {
    setLoading(true);
    setError(null);
    try {
      await saveSystem.saveGame(name, gameState, stats);
      await loadSaves(); // Refresh saves list
    } catch (err) {
      setError('Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  const load = async (saveId: string): Promise<SaveGame | null> => {
    setLoading(true);
    setError(null);
    try {
      return await saveSystem.loadGame(saveId);
    } catch (err) {
      setError('Failed to load game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSave = async (saveId: string) => {
    setLoading(true);
    setError(null);
    try {
      await saveSystem.deleteSave(saveId);
      await loadSaves(); // Refresh saves list
    } catch (err) {
      setError('Failed to delete save');
    } finally {
      setLoading(false);
    }
  };

  return {
    saves,
    loading,
    error,
    save,
    load,
    deleteSave,
    refreshSaves: loadSaves,
  };
};
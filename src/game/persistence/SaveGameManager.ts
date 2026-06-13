import { GameState, useGameStore } from '@stores/gameStore';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * The fields the LIVE Zustand store actually exposes (flat money/currentRound),
 * which differ from the core GameState shape (turn/resources) this module is
 * typed against. Save metadata is read through this view.
 */
interface LiveSnapshot {
  currentRound?: number;
  money?: number;
  reputation?: number;
  fans?: number;
}

/**
 * SaveGameManager — the SINGLE save-slot system for the game.
 *
 * Persists named/auto save slots to IndexedDB (database "BasementToBreakthrough",
 * stores 'saves' + 'settings') via `idb`. Initialized from the main game view
 * (initialize() + startAutoSave(5)); gameStore's saveGame/loadGame actions and
 * the SaveLoadModal UI go through this class.
 *
 * Relationship to the zustand `persist` middleware in gameStore
 * (localStorage key "diy-indie-empire-storage", safeZustandStorage):
 * the two layers are complementary, not redundant.
 *   - zustand persist = LIVE-STATE layer. It continuously mirrors the current
 *     (partialized) store state to localStorage so a page refresh/crash resumes
 *     the session in progress. One implicit slot, no user interaction.
 *   - SaveGameManager = SAVE-SLOT layer. Explicit, user-visible snapshots
 *     (multiple slots, metadata, import/export, delete) plus the 5-minute
 *     auto-save. Loading a slot rehydrates the store via gameStore.loadGame(),
 *     after which zustand persist resumes mirroring the restored state.
 * Do not fold one into the other.
 *
 * History: two other persistence layers were consolidated into this one on
 * 2026-06-12 — src/utils/db.ts (a second, unused idb wrapper on a separate
 * database; deleted) and src/game/mechanics/SaveManager.ts (legacy localStorage
 * serializer; deprecated, pending removal of its last component consumers).
 */

// Define the database schema
interface BasementToBThroughDB extends DBSchema {
  saves: {
    key: string;
    value: SaveGame;
    indexes: { 'by-date': Date };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

export interface SaveGame {
  id: string;
  name: string;
  timestamp: Date;
  playTime: number; // in seconds
  turnNumber: number;
  gameState: Partial<GameState>;
  version: string;
  thumbnail?: string; // Base64 encoded screenshot
}

export interface SaveMetadata {
  id: string;
  name: string;
  timestamp: Date;
  playTime: number;
  turnNumber: number;
  money: number;
  reputation: number;
  fans: number;
  version: string;
  thumbnail?: string;
}

const DB_NAME = 'BasementToBreakthrough';
const DB_VERSION = 1;
const CURRENT_SAVE_VERSION = '1.0.0';

export class SaveGameManager {
  private db: IDBPDatabase<BasementToBThroughDB> | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<BasementToBThroughDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create saves object store
          if (!db.objectStoreNames.contains('saves')) {
            const saveStore = db.createObjectStore('saves', { keyPath: 'id' });
            saveStore.createIndex('by-date', 'timestamp');
          }
          
          // Create settings object store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });
      
      console.log('SaveGameManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SaveGameManager:', error);
      throw error;
    }
  }
  
  async saveGame(gameState: Partial<GameState>, saveName?: string): Promise<string> {
    if (!this.db) {
      await this.initialize();
    }
    
    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const playTime = this.calculatePlayTime();
    
    const saveGame: SaveGame = {
      id: saveId,
      name: saveName || this.generateSaveName(gameState),
      timestamp: new Date(),
      playTime,
      // The live store uses flat fields (currentRound/money/...), not the
      // core GameState shape (turn/resources) this is typed against.
      turnNumber: (gameState as unknown as LiveSnapshot).currentRound ?? 0,
      gameState: this.sanitizeGameState(gameState),
      version: CURRENT_SAVE_VERSION,
      thumbnail: await this.captureGameThumbnail(),
    };
    
    try {
      await this.db!.put('saves', saveGame);
      console.log(`Game saved successfully: ${saveId}`);
      return saveId;
    } catch (error) {
      console.error('Failed to save game:', error);
      throw error;
    }
  }
  
  async loadGame(saveId: string): Promise<Partial<GameState> | null> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      const saveGame = await this.db!.get('saves', saveId);
      if (!saveGame) {
        console.error(`Save game not found: ${saveId}`);
        return null;
      }
      
      // Check version compatibility
      if (!this.isVersionCompatible(saveGame.version)) {
        console.warn(`Save game version mismatch: ${saveGame.version} vs ${CURRENT_SAVE_VERSION}`);
        // Could implement migration here
      }
      
      return saveGame.gameState;
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }
  
  async getSaveList(): Promise<SaveMetadata[]> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      const saves = await this.db!.getAllFromIndex('saves', 'by-date');
      
      // Sort by timestamp descending (newest first)
      saves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return saves.map(save => ({
        id: save.id,
        name: save.name,
        timestamp: save.timestamp,
        playTime: save.playTime,
        turnNumber: save.turnNumber,
        money: (save.gameState as unknown as LiveSnapshot).money ?? 0,
        reputation: (save.gameState as unknown as LiveSnapshot).reputation ?? 0,
        fans: (save.gameState as unknown as LiveSnapshot).fans ?? 0,
        version: save.version,
        thumbnail: save.thumbnail,
      }));
    } catch (error) {
      console.error('Failed to get save list:', error);
      return [];
    }
  }
  
  async deleteSave(saveId: string): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      await this.db!.delete('saves', saveId);
      console.log(`Save deleted: ${saveId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }
  
  async exportSave(saveId: string): Promise<Blob> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      const saveGame = await this.db!.get('saves', saveId);
      if (!saveGame) {
        throw new Error(`Save game not found: ${saveId}`);
      }
      
      const exportData = JSON.stringify(saveGame, null, 2);
      return new Blob([exportData], { type: 'application/json' });
    } catch (error) {
      console.error('Failed to export save:', error);
      throw error;
    }
  }
  
  async importSave(file: File): Promise<string> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      const text = await file.text();
      const saveGame = JSON.parse(text) as SaveGame;
      
      // Generate new ID to avoid conflicts
      saveGame.id = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      saveGame.name = `${saveGame.name} (Imported)`;
      saveGame.timestamp = new Date();
      
      await this.db!.put('saves', saveGame);
      console.log(`Save imported successfully: ${saveGame.id}`);
      return saveGame.id;
    } catch (error) {
      console.error('Failed to import save:', error);
      throw error;
    }
  }
  
  // Auto-save functionality
  startAutoSave(intervalMinutes: number = 5): void {
    this.stopAutoSave(); // Clear any existing interval
    
    const intervalMs = intervalMinutes * 60 * 1000;
    this.autoSaveInterval = setInterval(async () => {
      try {
        // Get current game state from store
        const { useGameStore } = await import('@stores/gameStore');
        const gameState = useGameStore.getState();
        
        await this.saveGame(gameState, 'Auto Save');
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);
  }
  
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
  
  // Settings management
  async getSetting(key: string): Promise<unknown> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      return await this.db!.get('settings', key);
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  }
  
  async setSetting(key: string, value: unknown): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    
    try {
      await this.db!.put('settings', value, key);
    } catch (error) {
      console.error(`Failed to set setting ${key}:`, error);
    }
  }
  
  // Helper methods
  private sanitizeGameState(gameState: Partial<GameState>): Partial<GameState> {
    // Zustand mixes its action functions into the store state. IndexedDB's
    // structured-clone algorithm cannot serialize functions, so strip every
    // function-valued property. This replaces a fragile hardcoded blacklist of
    // action names that missed entries (e.g. setPhase = (phase) => set({ phase })),
    // causing DataCloneError on every save.
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(gameState)) {
      if (typeof value === 'function') continue;
      sanitized[key] = value;
    }
    return sanitized as Partial<GameState>;
  }
  
  private generateSaveName(gameState: Partial<GameState>): string {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const live = gameState as unknown as LiveSnapshot;
    const turn = live.currentRound ?? 0;
    const money = live.money ?? 0;

    return `Turn ${turn} - $${money} - ${date} ${time}`;
  }

  private calculatePlayTime(): number {
    // This would need to track actual play time
    // For now, estimate based on turn number
    const turn =
      (useGameStore.getState() as unknown as LiveSnapshot).currentRound ?? 0;
    return turn * 180; // Assume 3 minutes per turn
  }
  
  private async captureGameThumbnail(): Promise<string | undefined> {
    // This would capture a screenshot of the game
    // For now, return undefined
    // In a real implementation, you could use html2canvas or similar
    return undefined;
  }
  
  private isVersionCompatible(saveVersion: string): boolean {
    // Simple version check - could be more sophisticated
    const [saveMajor] = saveVersion.split('.');
    const [currentMajor] = CURRENT_SAVE_VERSION.split('.');
    return saveMajor === currentMajor;
  }
}

// Singleton instance
export const saveGameManager = new SaveGameManager();
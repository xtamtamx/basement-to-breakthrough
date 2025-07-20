import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SaveGame } from '@types/game.types';
import { Card } from '@types/card.types';

interface GameDB extends DBSchema {
  saves: {
    key: string;
    value: SaveGame;
    indexes: { 'by-timestamp': number };
  };
  cards: {
    key: string;
    value: Card;
    indexes: { 'by-type': string; 'by-rarity': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

class Database {
  private db: IDBPDatabase<GameDB> | null = null;

  async init() {
    this.db = await openDB<GameDB>('basement-to-breakthrough', 1, {
      upgrade(db) {
        const savesStore = db.createObjectStore('saves', {
          keyPath: 'id',
        });
        savesStore.createIndex('by-timestamp', 'timestamp');

        const cardsStore = db.createObjectStore('cards', {
          keyPath: 'id',
        });
        cardsStore.createIndex('by-type', 'type');
        cardsStore.createIndex('by-rarity', 'rarity');

        db.createObjectStore('settings');
      },
    });
  }

  async saveGame(save: SaveGame) {
    if (!this.db) await this.init();
    return this.db!.put('saves', save);
  }

  async loadGame(id: string) {
    if (!this.db) await this.init();
    return this.db!.get('saves', id);
  }

  async getAllSaves() {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('saves', 'by-timestamp');
  }

  async deleteSave(id: string) {
    if (!this.db) await this.init();
    return this.db!.delete('saves', id);
  }

  async saveCard(card: Card) {
    if (!this.db) await this.init();
    return this.db!.put('cards', card);
  }

  async getCardsByType(type: string) {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('cards', 'by-type', type);
  }

  async saveSetting(key: string, value: any) {
    if (!this.db) await this.init();
    return this.db!.put('settings', value, key);
  }

  async getSetting(key: string) {
    if (!this.db) await this.init();
    return this.db!.get('settings', key);
  }
}

export const db = new Database();
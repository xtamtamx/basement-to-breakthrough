import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveManager } from '../SaveManager';
import { Resources, Band, Venue, Show, Genre, VenueType } from '@game/types';
import { safeStorage } from '@utils/safeStorage';

// Mock safeStorage
vi.mock('@utils/safeStorage', () => ({
  safeStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
  }
}));

// Mock equipment and faction managers
vi.mock('../EquipmentManagerV2', () => ({
  equipmentManagerV2: {
    getOwnedEquipment: vi.fn().mockReturnValue([]),
    getRentedEquipment: vi.fn().mockReturnValue([]),
    clearInventory: vi.fn(),
    addEquipment: vi.fn(),
    rentEquipmentForSave: vi.fn(),
  }
}));

vi.mock('../VenueUpgradeManager', () => ({
  venueUpgradeManager: {
    applyUpgrade: vi.fn(),
  }
}));

vi.mock('../FactionSystem', () => ({
  factionSystem: {
    getPlayerStandings: vi.fn().mockReturnValue(new Map()),
    getAllFactionData: vi.fn().mockReturnValue([]),
    getPendingEvents: vi.fn().mockReturnValue([]),
    setStanding: vi.fn(),
    restoreEvents: vi.fn(),
  }
}));

describe('SaveManager', () => {
  const mockResources: Resources = {
    money: 1000,
    reputation: 50,
    fans: 100,
    influence: 25,
  };

  const mockBand: Band = {
    id: 'b1',
    name: 'Test Band',
    genre: Genre.PUNK,
    isRealArtist: false,
    subgenres: [],
    traits: [],
    popularity: 50,
    authenticity: 80,
    energy: 70,
    technicalSkill: 60,
    technicalRequirements: [],
  };

  const mockVenue: Venue = {
    id: 'v1',
    name: 'Test Venue',
    type: VenueType.DIY_SPACE,
    capacity: 100,
    acoustics: 70,
    authenticity: 80,
    atmosphere: 75,
    location: {
      id: 'downtown',
      name: 'Downtown',
      sceneStrength: 75,
      gentrificationLevel: 30,
      policePresence: 40,
      rentMultiplier: 1.5,
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      color: '#FF0000'
    },
    rent: 200,
    equipment: [],
    modifiers: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 3,
  };

  const mockShow: Show = {
    id: 'show1',
    venueId: 'v1',
    date: new Date(),
    bill: [{
      bandId: 'b1',
      slot: 'HEADLINER',
      guaranteedPayment: 100
    }],
    ticketPrice: 10,
    expectedAttendance: 50,
    promotionLevel: 'STANDARD',
    equipmentQuality: 'BASIC',
    isAllAges: true,
    hasSpecialGuest: false,
    theme: null,
    isFestival: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('save functionality', () => {
    it('should save game state successfully', () => {
      const result = saveManager.saveGame(
        5,
        mockResources,
        [mockBand],
        [mockVenue],
        new Map([['v1', mockShow]]),
        new Map([['b1', mockBand]]),
        { shows: 10, revenue: 5000 }
      );

      expect(result).toBe(true);
      expect(vi.mocked(safeStorage.setItem)).toHaveBeenCalledWith(
        'basement-to-breakthrough-save',
        expect.any(String)
      );
    });

    it('should create auto-save', () => {
      const result = saveManager.autoSave(
        3,
        mockResources,
        [mockBand],
        [mockVenue],
        new Map(),
        new Map(),
        { shows: 5, revenue: 2500 }
      );

      expect(result).toBe(true);
      expect(vi.mocked(safeStorage.setItem)).toHaveBeenCalledWith(
        'basement-to-breakthrough-autosave',
        expect.any(String)
      );
    });

    it('should handle save errors gracefully', () => {
      vi.mocked(safeStorage.setItem).mockImplementation(() => {
        throw new Error('Storage full');
      });

      const result = saveManager.saveGame(
        1,
        mockResources,
        [],
        [],
        new Map(),
        new Map(),
        { shows: 0, revenue: 0 }
      );

      expect(result).toBe(false);
    });
  });

  describe('load functionality', () => {
    const mockSaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: {
        currentTurn: 5,
        resources: mockResources,
        availableBands: [mockBand],
        venues: [mockVenue],
        bookedShows: [['v1', mockShow]],
        bookedBands: [['b1', mockBand]],
        totalStats: { shows: 10, revenue: 5000 }
      },
      systems: {
        equipment: { owned: [], rented: [] },
        venueUpgrades: { upgrades: {} },
        factions: { standings: {}, events: [] }
      }
    };

    it('should load saved game successfully', () => {
      vi.mocked(safeStorage.getItem).mockReturnValue(JSON.stringify(mockSaveData));

      const result = saveManager.loadGame();

      expect(result).toBeDefined();
      expect(result?.gameState.currentTurn).toBe(5);
      expect(result?.gameState.resources).toEqual(mockResources);
    });

    it('should return null for non-existent save', () => {
      vi.mocked(safeStorage.getItem).mockReturnValue(null);

      const result = saveManager.loadGame();

      expect(result).toBeNull();
    });

    it('should handle corrupted save data', () => {
      vi.mocked(safeStorage.getItem).mockReturnValue('invalid json {');

      const result = saveManager.loadGame();

      expect(result).toBeNull();
    });

    it('should load auto-save', () => {
      vi.mocked(safeStorage.getItem).mockReturnValue(JSON.stringify(mockSaveData));

      const result = saveManager.loadAutoSave();

      expect(result).toBeDefined();
      expect(vi.mocked(safeStorage.getItem)).toHaveBeenCalledWith('basement-to-breakthrough-autosave');
    });
  });

  describe('save management', () => {
    it('should check if save exists', () => {
      vi.mocked(safeStorage.getItem).mockReturnValue('save data');

      const exists = saveManager.hasSave();

      expect(exists).toBe(true);
      expect(vi.mocked(safeStorage.getItem)).toHaveBeenCalledWith('basement-to-breakthrough-save');
    });

    it('should delete save', () => {
      saveManager.deleteSave();

      expect(vi.mocked(safeStorage.removeItem)).toHaveBeenCalledWith('basement-to-breakthrough-save');
    });

    it('should get save info', () => {
      const mockSaveData = {
        version: '1.0.0',
        timestamp: 1234567890,
        gameState: { currentTurn: 10 }
      };
      vi.mocked(safeStorage.getItem).mockReturnValue(JSON.stringify(mockSaveData));

      const info = saveManager.getSaveInfo();

      expect(info).toEqual({
        timestamp: 1234567890,
        turn: 10
      });
    });
  });
});
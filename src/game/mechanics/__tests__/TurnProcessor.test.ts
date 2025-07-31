import { describe, it, expect, beforeEach, vi } from 'vitest';
import { turnProcessor } from '../TurnProcessor';
import { useGameStore } from '@stores/gameStore';
import { GamePhase, VenueType, Genre } from '@game/types';

// Mock dependencies
vi.mock('@stores/gameStore');
vi.mock('../ShowExecutor');
vi.mock('../SynergySystemV2');
vi.mock('../WalkerSystem');
vi.mock('../DayJobSystem');
vi.mock('../DifficultySystem');
vi.mock('../ShowPromotionSystem');

// Import after mocking
import { showPromotionSystem, ScheduledShow } from '../ShowPromotionSystem';
import { difficultySystem } from '../DifficultySystem';
import { dayJobSystem } from '../DayJobSystem';
import { showExecutor } from '../ShowExecutor';
import { synergySystemV2 } from '../SynergySystemV2';
import type { Synergy, ShowResult } from '@game/types';

describe('TurnProcessor', () => {
  const mockBand = {
    id: 'b1',
    name: 'Test Band',
    genre: Genre.PUNK,
    isRealArtist: false,
    subgenres: [],
    traits: [],
    popularity: 50,
    authenticity: 70,
    energy: 80,
    technicalSkill: 60,
    technicalRequirements: [],
    reputation: 40,
    fanbase: 100,
    stress: 20,
  };

  const mockVenue = {
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

  const mockShow = {
    id: 'show1',
    venueId: 'v1',
    date: new Date(),
    bill: [{
      bandId: 'b1',
      slot: 'HEADLINER' as const,
      guaranteedPayment: 100
    }],
    ticketPrice: 10,
    expectedAttendance: 50,
    promotionLevel: 'STANDARD' as const,
    equipmentQuality: 'BASIC' as const,
    isAllAges: true,
    hasSpecialGuest: false,
    theme: null,
    isFestival: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock showPromotionSystem
    vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
      showsToExecute: [] as ScheduledShow[],
      promotionUpdates: [] as string[]
    });
    
    // Mock difficultySystem
    vi.mocked(difficultySystem).applyPassiveDifficulty = vi.fn().mockReturnValue({
      reputationLost: 0,
      message: ''
    });
    vi.mocked(difficultySystem).getDifficultyMilestone = vi.fn().mockReturnValue(null);
    vi.mocked(difficultySystem).getShowDifficultyModifiers = vi.fn().mockReturnValue({
      attendanceMultiplier: 1,
      revenueMultiplier: 1
    });
    vi.mocked(difficultySystem).getScaledVenueCost = vi.fn().mockImplementation((cost: number) => cost);
    
    // Mock synergySystemV2
    vi.mocked(synergySystemV2).checkSynergies = vi.fn().mockReturnValue([] as Synergy[]);
    vi.mocked(synergySystemV2).calculateTotalMultiplier = vi.fn().mockReturnValue(1);
    
    // Mock dayJobSystem
    vi.mocked(dayJobSystem).processTurn = vi.fn().mockReturnValue(null);
    vi.mocked(dayJobSystem).processJobIncome = vi.fn().mockReturnValue(null);
    
    // Mock showExecutor
    vi.mocked(showExecutor).executeShow = vi.fn().mockResolvedValue({
      showId: 'show1',
      success: true,
      attendance: 80,
      revenue: 500,
      reputationChange: 5,
      fansGained: 10,
      incidentOccurred: false,
      incidents: [],
      isSuccess: true,
      financials: {
        revenue: 500,
        costs: 100,
        profit: 400
      }
    } as ShowResult);
    
    // Mock the game store
    const mockGetState = vi.fn().mockReturnValue({
      currentRound: 1,
      reputation: 50,
      money: 1000,
      fans: 100,
      stress: 20,
      connections: 10,
      phase: GamePhase.EARLY,
      difficulty: 'NORMAL',
      scheduledShows: [mockShow],
      venues: [mockVenue],
      allBands: [mockBand],
      rosterBandIds: ['b1'],
      showHistory: [],
      lastTurnResults: [],
      discoveredSynergies: [],
      completedFestivals: [],
      districts: [{
        id: 'downtown',
        name: 'Downtown',
        sceneStrength: 75,
        gentrificationLevel: 30,
        policePresence: 40,
        rentMultiplier: 1.5,
        bounds: { x: 0, y: 0, width: 10, height: 10 },
        color: '#FF0000'
      }],
      walkers: [],
      // Add store methods
      nextRound: vi.fn(),
      addMoney: vi.fn(),
      addFans: vi.fn(),
      adjustReputation: vi.fn(),
      adjustStress: vi.fn(),
      completeShow: vi.fn(),
      setPhase: vi.fn(),
      resetGame: vi.fn(),
      setDifficulty: vi.fn(),
      initializeGame: vi.fn(),
      addConnections: vi.fn(),
      addBandToRoster: vi.fn(),
      removeBandFromRoster: vi.fn(),
      updateBand: vi.fn(),
      scheduleShow: vi.fn(),
      setFactionEvent: vi.fn(),
      applyFactionChoice: vi.fn(),
      discoverSynergy: vi.fn(),
      updatePathAlignment: vi.fn(),
      loadAllBands: vi.fn(),
      loadAllVenues: vi.fn(),
      saveGame: vi.fn(),
      loadGame: vi.fn(),
    });
    
    // Mock useGameStore to have a getState property directly
    vi.mocked(useGameStore).getState = mockGetState;
  });

  describe('processNextTurn', () => {
    it('should process turn and return results', () => {
      const result = turnProcessor.processNextTurn();
      
      expect(result).toBeDefined();
      expect(result.showResults).toBeDefined();
      expect(result.totalVenueRent).toBeDefined();
      expect(Array.isArray(result.showResults)).toBe(true);
      expect(typeof result.totalVenueRent).toBe('number');
    });

    it('should advance the round counter', () => {
      turnProcessor.processNextTurn();
      
      const { nextRound } = useGameStore.getState();
      expect(nextRound).toHaveBeenCalled();
    });

    it('should calculate venue rent correctly', () => {
      const result = turnProcessor.processNextTurn();
      
      // Venue rent should be 200 (base rent of the test venue)
      expect(result.totalVenueRent).toBe(200);
    });

    it('should return day job results when applicable', () => {
      // Mock dayJobSystem to return a result
      vi.mocked(dayJobSystem).processJobIncome = vi.fn().mockReturnValue({
        money: 50,
        reputationLoss: 2,
        fanLoss: 1,
        stressGain: 5,
        message: 'Worked at the record store'
      });
      
      const result = turnProcessor.processNextTurn();
      
      expect(result.dayJobResult).toBeDefined();
      expect(result.dayJobResult.money).toBe(50);
    });

    it('should handle shows with missing venue or band gracefully', () => {
      // Update the mock to have a show with invalid venue ID
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [{
          ...mockShow,
          venueId: 'invalid-venue-id'
        } as ScheduledShow],
        promotionUpdates: [] as string[]
      });
      
      const result = turnProcessor.processNextTurn();
      
      // Should create a failed show result
      expect(result.showResults).toHaveLength(1);
      expect(result.showResults[0].success).toBe(false);
      expect(result.showResults[0].reputationChange).toBeLessThan(0);
    });

    it('should update band and venue stats after shows', () => {
      // Mock showPromotionSystem to return a show to execute
      vi.mocked(showPromotionSystem).processScheduledShows = vi.fn().mockReturnValue({
        showsToExecute: [mockShow as ScheduledShow],
        promotionUpdates: [] as string[]
      });
      
      turnProcessor.processNextTurn();
      
      const { completeShow } = useGameStore.getState();
      expect(completeShow).toHaveBeenCalled();
    });

    it('should respect phase and difficulty modifiers', () => {
      // Mock difficulty system to return an event
      vi.mocked(difficultySystem).applyPassiveDifficulty = vi.fn().mockReturnValue({
        reputationLost: 0,
        message: 'Increased police presence in the area'
      });
      
      const result = turnProcessor.processNextTurn();
      
      // Should include the difficulty event
      expect(result.difficultyEvent).toBeDefined();
      expect(result.difficultyEvent.message).toBe('Increased police presence in the area');
    });
  });
});
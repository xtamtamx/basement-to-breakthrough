import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { GamePhase, Difficulty } from '@/game/types';
import { CONSTRAINTS } from '@/utils/validation';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      currentRound: 1,
      reputation: 0,
      money: 200,
      fans: 0,
      stress: 0,
      connections: 0,
      phase: GamePhase.MENU,
      difficulty: Difficulty.NORMAL,
      allBands: [
        {
          id: 'b1',
          name: 'Test Band 1',
          genre: 'PUNK',
          isRealArtist: false,
          subgenres: [],
          traits: [],
          popularity: 50,
          authenticity: 80,
          energy: 70,
          technicalSkill: 60,
          technicalRequirements: [],
        },
        {
          id: 'b2',
          name: 'Test Band 2',
          genre: 'METAL',
          isRealArtist: false,
          subgenres: [],
          traits: [],
          popularity: 60,
          authenticity: 70,
          energy: 80,
          technicalSkill: 65,
          technicalRequirements: [],
        },
      ],
      rosterBandIds: [],
    });
  });

  describe('Resource Management', () => {
    it('should add money with validation', () => {
      const { addMoney } = useGameStore.getState();
      
      addMoney(100);
      expect(useGameStore.getState().money).toBe(300);
      
      // Test clamping at max
      addMoney(CONSTRAINTS.MAX_MONEY);
      expect(useGameStore.getState().money).toBe(CONSTRAINTS.MAX_MONEY);
    });

    it('should allow negative money (debt) up to limit', () => {
      const { addMoney } = useGameStore.getState();
      
      addMoney(-500);
      expect(useGameStore.getState().money).toBe(-300);
      
      // Test clamping at min
      addMoney(-CONSTRAINTS.MAX_MONEY);
      expect(useGameStore.getState().money).toBe(CONSTRAINTS.MIN_MONEY);
    });

    it('should add fans with validation', () => {
      const { addFans } = useGameStore.getState();
      
      addFans(50);
      expect(useGameStore.getState().fans).toBe(50);
      
      // Test that fans cannot go negative
      addFans(-100);
      expect(useGameStore.getState().fans).toBe(0);
    });

    it('should clamp reputation between 0 and 100', () => {
      const { addReputation } = useGameStore.getState();
      
      addReputation(50);
      expect(useGameStore.getState().reputation).toBe(50);
      
      addReputation(60);
      expect(useGameStore.getState().reputation).toBe(100); // clamped at max
      
      addReputation(-150);
      expect(useGameStore.getState().reputation).toBe(0); // clamped at min
    });

    it('should manage stress levels', () => {
      const { addStress } = useGameStore.getState();
      
      addStress(30);
      expect(useGameStore.getState().stress).toBe(30);
      
      addStress(80);
      expect(useGameStore.getState().stress).toBe(100); // clamped at max
      
      addStress(-200);
      expect(useGameStore.getState().stress).toBe(0); // clamped at min
    });
  });

  describe('Game Flow', () => {
    it('should advance rounds', () => {
      const { nextRound } = useGameStore.getState();
      
      nextRound();
      expect(useGameStore.getState().currentRound).toBe(2);
      expect(useGameStore.getState().phase).toBe(GamePhase.PLANNING);
    });

    it('should reset game to initial state', () => {
      const { addMoney, addFans, nextRound, resetGame } = useGameStore.getState();
      
      // Make some changes
      addMoney(1000);
      addFans(500);
      nextRound();
      
      // Reset
      resetGame();
      
      const state = useGameStore.getState();
      expect(state.money).toBe(200);
      expect(state.fans).toBe(0);
      expect(state.currentRound).toBe(1);
      expect(state.phase).toBe(GamePhase.MENU);
    });

    it('should change game phase', () => {
      const { setPhase } = useGameStore.getState();
      
      setPhase(GamePhase.BOOKING);
      expect(useGameStore.getState().phase).toBe(GamePhase.BOOKING);
      
      setPhase(GamePhase.PERFORMANCE);
      expect(useGameStore.getState().phase).toBe(GamePhase.PERFORMANCE);
    });
  });

  describe('Band Management', () => {
    it('should add band to roster', () => {
      const { addBandToRoster } = useGameStore.getState();
      
      addBandToRoster('b4');
      expect(useGameStore.getState().rosterBandIds).toContain('b4');
    });

    it('should remove band from roster', () => {
      const { removeBandFromRoster } = useGameStore.getState();
      
      removeBandFromRoster('b1');
      expect(useGameStore.getState().rosterBandIds).not.toContain('b1');
    });

    it('should update band properties', () => {
      const { updateBand } = useGameStore.getState();
      
      updateBand('b1', { popularity: 75 });
      
      const updatedBand = useGameStore.getState().allBands.find(b => b.id === 'b1');
      expect(updatedBand?.popularity).toBe(75);
    });
  });

  describe('Show Management', () => {
    it('should schedule shows', () => {
      const { scheduleShow } = useGameStore.getState();
      
      const show = {
        id: 'show1',
        bandId: 'b1',
        venueId: 'v1',
        date: new Date(),
        ticketPrice: 10,
        status: 'SCHEDULED' as const,
      };
      
      scheduleShow(show);
      expect(useGameStore.getState().scheduledShows).toHaveLength(1);
      expect(useGameStore.getState().scheduledShows[0]).toEqual(show);
    });
  });

  describe('Synergy Discovery', () => {
    it('should track discovered synergies', () => {
      const { discoverSynergy, hasSynergyDiscovered } = useGameStore.getState();
      
      expect(hasSynergyDiscovered('synergy1')).toBe(false);
      
      discoverSynergy('synergy1');
      expect(hasSynergyDiscovered('synergy1')).toBe(true);
      expect(useGameStore.getState().discoveredSynergies).toContain('synergy1');
    });
  });

  describe('Path System', () => {
    it('should track path choices and update alignment', () => {
      const { makePathChoice, updatePathAlignment } = useGameStore.getState();
      
      makePathChoice('diy-choice-1', 30);
      expect(useGameStore.getState().diyPoints).toBe(30);
      expect(useGameStore.getState().pathChoices).toContain('diy-choice-1');
      
      updatePathAlignment();
      expect(useGameStore.getState().pathAlignment).toBe('DIY_LEANING');
      
      makePathChoice('corporate-choice-1', -60);
      expect(useGameStore.getState().diyPoints).toBe(-30);
      
      updatePathAlignment();
      expect(useGameStore.getState().pathAlignment).toBe('CORPORATE_LEANING');
    });
  });
});
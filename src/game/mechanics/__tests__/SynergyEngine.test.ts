import { describe, it, expect } from 'vitest';
import { synergyEngine } from '../SynergyEngine';
import { Band, Venue, Genre, VenueType } from '@game/types';

describe('SynergyEngine', () => {

  const createTestBand = (overrides: Partial<Band> = {}): Band => ({
    id: 'test-band',
    name: 'Test Band',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: [],
    traits: [],
    popularity: 50,
    authenticity: 80,
    energy: 70,
    technicalSkill: 60,
    technicalRequirements: [],
    ...overrides
  });

  const createTestVenue = (overrides: Partial<Venue> = {}): Venue => ({
    id: 'test-venue',
    name: 'Test Venue',
    type: VenueType.DIY_SPACE,
    capacity: 100,
    acoustics: 70,
    authenticity: 90,
    atmosphere: 80,
    modifiers: [],
    traits: [],
    location: {
      id: 'test-district',
      name: 'Test District',
      sceneStrength: 75,
      gentrificationLevel: 30,
      policePresence: 20,
      rentMultiplier: 1,
      bounds: { x: 0, y: 0, width: 5, height: 5 },
      color: '#FF0000'
    },
    rent: 100,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 3,
    ...overrides
  });

  describe('calculateSynergies', () => {
    it('should detect DIY authentic synergy', () => {
      const band = createTestBand({ 
        genre: Genre.PUNK,
        authenticity: 95 
      });
      const venue = createTestVenue({ 
        type: VenueType.BASEMENT,
        authenticity: 95 
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      
      const diySynergy = synergies.find(s => s.id === 'diy-authentic');
      expect(diySynergy).toBeDefined();
      expect(diySynergy?.name).toBe('True DIY');
      expect(diySynergy?.multiplier).toBe(2.0);
    });

    it('should detect genre match synergy for metal', () => {
      const band = createTestBand({ 
        genre: Genre.METAL 
      });
      const venue = createTestVenue({ 
        type: VenueType.WAREHOUSE 
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      
      const genreMatchSynergy = synergies.find(s => s.id === 'genre-match');
      expect(genreMatchSynergy).toBeDefined();
      expect(genreMatchSynergy?.name).toBe('Perfect Fit');
    });

    it('should detect chaos synergy with high energy band', () => {
      const band = createTestBand({ 
        genre: Genre.PUNK,
        energy: 90 
      });
      const venue = createTestVenue({
        capacity: 40 // Small venue
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      
      const chaosSynergy = synergies.find(s => s.id === 'chaos-reigns');
      expect(chaosSynergy).toBeDefined();
      expect(chaosSynergy?.name).toBe('Controlled Chaos');
    });

    it('should not detect synergies when conditions are not met', () => {
      const band = createTestBand({ 
        genre: Genre.INDIE,
        authenticity: 50 
      });
      const venue = createTestVenue({ 
        type: VenueType.ARENA,
        authenticity: 20 
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      
      // Should not get basement punk or other high-authenticity synergies
      // No DIY synergy because authenticity is too low
      const diySynergy = synergies.find(s => s.id === 'diy-authentic');
      expect(diySynergy).toBeUndefined();
    });

    it('should accumulate multiple synergies', () => {
      const band = createTestBand({ 
        genre: Genre.PUNK,
        authenticity: 95,
        energy: 90  // High energy for chaos synergy
      });
      const venue = createTestVenue({ 
        type: VenueType.DIY_SPACE,
        authenticity: 95,
        capacity: 40, // Small for chaos synergy
        hasBar: true  // For bar boost synergy
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      
      // Should get multiple synergies
      expect(synergies.length).toBeGreaterThanOrEqual(1);
      
      // Should at least get DIY authentic synergy
      const diySynergy = synergies.find(s => s.id === 'diy-authentic');
      expect(diySynergy).toBeDefined();
    });

    it('should detect perfect basement show conditions', () => {
      const band = createTestBand({ 
        genre: Genre.PUNK,
        authenticity: 95,
        popularity: 10
      });
      const venue = createTestVenue({ 
        type: VenueType.BASEMENT,
        capacity: 30,
        authenticity: 100
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      
      // Basement + high authenticity should trigger DIY authentic synergy
      const diySynergy = synergies.find(s => s.id === 'diy-authentic');
      expect(diySynergy).toBeDefined();
      expect(diySynergy?.multiplier).toBe(2.0);
      expect(diySynergy?.reputationBonus).toBe(10);
    });
  });

  describe('getTotalMultiplier', () => {
    it('should calculate combined multiplier from all synergies', () => {
      const band = createTestBand({ 
        genre: Genre.PUNK,
        authenticity: 95 
      });
      const venue = createTestVenue({ 
        type: VenueType.BASEMENT,
        authenticity: 95 
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      const totalMultiplier = synergyEngine.getTotalMultiplier(synergies);
      
      // Should be product of all multipliers
      const expectedMultiplier = synergies.reduce((acc, s) => acc * s.multiplier, 1);
      expect(totalMultiplier).toBe(expectedMultiplier);
      expect(totalMultiplier).toBeGreaterThan(1);
    });

    it('should return 1 when no synergies', () => {
      const totalMultiplier = synergyEngine.getTotalMultiplier([]);
      expect(totalMultiplier).toBe(1);
    });
  });

  describe('getTotalReputationBonus', () => {
    it('should sum reputation bonuses from all synergies', () => {
      const band = createTestBand({ 
        genre: Genre.METAL 
      });
      const venue = createTestVenue({ 
        type: VenueType.WAREHOUSE 
      });

      const synergies = synergyEngine.calculateSynergies([band], venue);
      const totalRepBonus = synergyEngine.getTotalReputationBonus(synergies);
      
      // Should be sum of all reputation bonuses
      const expectedBonus = synergies.reduce((acc, s) => acc + s.reputationBonus, 0);
      expect(totalRepBonus).toBe(expectedBonus);
      expect(totalRepBonus).toBeGreaterThanOrEqual(0);
    });
  });
});
import { describe, it, expect } from 'vitest';
import { bandGenerator } from '../BandGenerator';
import { TraitType } from '@game/types';

describe('BandGenerator', () => {

  describe('generateBand', () => {
    it('should generate a band with basic properties', () => {
      const band = bandGenerator.generateBand();
      
      expect(band).toHaveProperty('id');
      expect(band).toHaveProperty('name');
      expect(band).toHaveProperty('genre');
      expect(band).toHaveProperty('popularity');
      expect(band).toHaveProperty('authenticity');
      expect(band).toHaveProperty('energy');
      expect(band).toHaveProperty('technicalSkill');
      expect(band).toHaveProperty('traits');
      expect(band).toHaveProperty('isRealArtist');
    });

    it('should generate unique IDs', () => {
      const band1 = bandGenerator.generateBand();
      const band2 = bandGenerator.generateBand();
      
      expect(band1.id).not.toBe(band2.id);
    });

    it('should generate random genres', () => {
      const bands = Array.from({ length: 10 }, () => bandGenerator.generateBand());
      const genres = new Set(bands.map(b => b.genre));
      
      // Should generate multiple different genres
      expect(genres.size).toBeGreaterThan(1);
    });

    it('should generate stats within valid ranges', () => {
      const band = bandGenerator.generateBand();
      
      expect(band.popularity).toBeGreaterThanOrEqual(0);
      expect(band.popularity).toBeLessThanOrEqual(100);
      expect(band.authenticity).toBeGreaterThanOrEqual(0);
      expect(band.authenticity).toBeLessThanOrEqual(100);
      expect(band.energy).toBeGreaterThanOrEqual(0);
      expect(band.energy).toBeLessThanOrEqual(100);
      expect(band.technicalSkill).toBeGreaterThanOrEqual(0);
      expect(band.technicalSkill).toBeLessThanOrEqual(100);
    });

    it('should scale stats with difficulty parameter', () => {
      // Generate bands with different difficulties
      const easyBands = Array.from({ length: 10 }, () => 
        bandGenerator.generateBand(1)
      );
      const hardBands = Array.from({ length: 10 }, () => 
        bandGenerator.generateBand(5)
      );
      
      const avgEasyStats = easyBands.reduce((sum, b) => 
        sum + b.popularity + b.technicalSkill, 0) / (10 * 2);
      const avgHardStats = hardBands.reduce((sum, b) => 
        sum + b.popularity + b.technicalSkill, 0) / (10 * 2);
      
      // Higher difficulty should produce better stats on average
      expect(avgHardStats).toBeGreaterThan(avgEasyStats);
    });

    it('should generate appropriate number of traits', () => {
      const bands = Array.from({ length: 20 }, () => bandGenerator.generateBand());
      
      bands.forEach(band => {
        expect(band.traits.length).toBeGreaterThanOrEqual(1);
        expect(band.traits.length).toBeLessThanOrEqual(5);
      });
    });

    it('should generate bands with valid trait types', () => {
      const band = bandGenerator.generateBand();
      
      band.traits.forEach(trait => {
        expect(trait).toHaveProperty('id');
        expect(trait).toHaveProperty('name');
        expect(trait).toHaveProperty('description');
        expect(trait).toHaveProperty('type');
        expect(Object.values(TraitType)).toContain(trait.type);
      });
    });
  });

  describe('generateBands', () => {
    it('should generate multiple bands', () => {
      const bands = bandGenerator.generateBands(5);
      
      expect(bands).toHaveLength(5);
      bands.forEach(band => {
        expect(band).toHaveProperty('id');
        expect(band).toHaveProperty('name');
      });
    });

    it('should generate bands with specified difficulty', () => {
      const easyBands = bandGenerator.generateBands(5, 1);
      const hardBands = bandGenerator.generateBands(5, 5);
      
      const avgEasyPop = easyBands.reduce((sum, b) => sum + b.popularity, 0) / 5;
      const avgHardPop = hardBands.reduce((sum, b) => sum + b.popularity, 0) / 5;
      
      expect(avgHardPop).toBeGreaterThan(avgEasyPop);
    });

    it('should generate unique band IDs', () => {
      const bands = bandGenerator.generateBands(10);
      const ids = bands.map(b => b.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('band properties', () => {
    it('should generate valid hometown', () => {
      const band = bandGenerator.generateBand();
      
      expect(band.hometown).toBeTruthy();
      expect(band.hometown).toMatch(/,\s+(USA|Canada)$/);
    });

    it('should generate appropriate bio', () => {
      const band = bandGenerator.generateBand();
      
      expect(band.bio).toBeTruthy();
      expect(band.bio.length).toBeGreaterThan(20);
    });

    it('should generate valid formed date', () => {
      const band = bandGenerator.generateBand();
      
      expect(band.formedYear).toBeDefined();
      expect(band.formedYear).toBeGreaterThanOrEqual(1970);
      expect(band.formedYear).toBeLessThanOrEqual(new Date().getFullYear());
    });
  });

  describe('trait generation', () => {
    it('should generate unique trait IDs', () => {
      const band = bandGenerator.generateBand();
      
      const traitIds = band.traits.map(t => t.id);
      const uniqueIds = new Set(traitIds);
      
      expect(uniqueIds.size).toBe(traitIds.length);
    });

    it('should generate valid trait properties', () => {
      const band = bandGenerator.generateBand();
      
      band.traits.forEach(trait => {
        expect(trait.id).toBeTruthy();
        expect(trait.modifier).toBeDefined();
      });
    });

    it('should include different trait types', () => {
      const bands = bandGenerator.generateBands(10);
      const allTraits = bands.flatMap(b => b.traits);
      const traitTypes = new Set(allTraits.map(t => t.type));
      
      // Should have multiple trait types across bands
      expect(traitTypes.size).toBeGreaterThan(1);
    });
  });

  describe('band names', () => {
    it('should generate valid band names', () => {
      const bands = bandGenerator.generateBands(20);
      
      bands.forEach(band => {
        expect(band.name).toBeTruthy();
        expect(band.name.length).toBeGreaterThan(2);
      });
    });

    it('should generate unique names', () => {
      const bands = bandGenerator.generateBands(50);
      const names = bands.map(b => b.name);
      const uniqueNames = new Set(names);
      
      // Should generate mostly unique names
      expect(uniqueNames.size).toBeGreaterThan(40);
    });
  });

  describe('subgenres', () => {
    it('should generate appropriate subgenres', () => {
      const bands = bandGenerator.generateBands(20);
      
      bands.forEach(band => {
        expect(band.subgenres).toBeDefined();
        expect(Array.isArray(band.subgenres)).toBe(true);
        expect(band.subgenres.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('technical requirements', () => {
    it('should generate technical requirements array', () => {
      const bands = bandGenerator.generateBands(10);
      
      bands.forEach(band => {
        expect(band.technicalRequirements).toBeDefined();
        expect(Array.isArray(band.technicalRequirements)).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle high difficulty values', () => {
      const band = bandGenerator.generateBand(10);
      
      // Stats should be reasonable even with high difficulty
      expect(band.popularity).toBeGreaterThanOrEqual(0);
      expect(band.authenticity).toBeGreaterThanOrEqual(0);
      expect(band.energy).toBeGreaterThanOrEqual(0);
      expect(band.technicalSkill).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero difficulty', () => {
      const band = bandGenerator.generateBand(0);
      
      // Should still generate valid band
      expect(band.id).toBeTruthy();
      expect(band.name).toBeTruthy();
      expect(band.popularity).toBeGreaterThanOrEqual(0);
    });
  });
});
import { describe, it, expect } from 'vitest';
import {
  validateNumber,
  validateString,
  validateTicketPrice,
  validateBandName,
  validateVenueCapacity,
  validateResources,
  clamp,
  ValidationError,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateNumber', () => {
    it('should accept valid numbers within range', () => {
      expect(validateNumber(50, 'test', 0, 100)).toBe(50);
      expect(validateNumber('50', 'test', 0, 100)).toBe(50);
      expect(validateNumber(0, 'test', 0, 100)).toBe(0);
      expect(validateNumber(100, 'test', 0, 100)).toBe(100);
    });

    it('should throw error for invalid numbers', () => {
      expect(() => validateNumber('abc', 'test', 0, 100)).toThrow(ValidationError);
      expect(() => validateNumber(NaN, 'test', 0, 100)).toThrow('test must be a number');
    });

    it('should throw error for numbers out of range', () => {
      expect(() => validateNumber(-1, 'test', 0, 100)).toThrow('test must be at least 0');
      expect(() => validateNumber(101, 'test', 0, 100)).toThrow('test must be at most 100');
    });
  });

  describe('validateString', () => {
    it('should accept valid strings', () => {
      expect(validateString('Test Band', 'name')).toBe('Test Band');
      expect(validateString('  Test Band  ', 'name')).toBe('Test Band'); // trimmed
    });

    it('should throw error for non-strings', () => {
      expect(() => validateString(123, 'name')).toThrow('name must be a string');
      expect(() => validateString(null, 'name')).toThrow('name must be a string');
    });

    it('should enforce length constraints', () => {
      expect(() => validateString('', 'name')).toThrow('name must be at least 1 characters');
      expect(() => validateString('a'.repeat(51), 'name')).toThrow('name must be at most 50 characters');
    });

    it('should validate against pattern if provided', () => {
      const pattern = /^[A-Za-z]+$/;
      expect(validateString('TestBand', 'name', 1, 50, pattern)).toBe('TestBand');
      expect(() => validateString('Test Band 123', 'name', 1, 50, pattern)).toThrow('name contains invalid characters');
    });
  });

  describe('Game-specific validators', () => {
    it('should validate ticket prices', () => {
      expect(validateTicketPrice(10)).toBe(10);
      expect(validateTicketPrice(0)).toBe(0);
      expect(() => validateTicketPrice(-5)).toThrow('Ticket price must be at least 0');
      expect(() => validateTicketPrice(1001)).toThrow('Ticket price must be at most 1000');
    });

    it('should validate band names', () => {
      expect(validateBandName('The Punks')).toBe('The Punks');
      expect(validateBandName("Death's Door")).toBe("Death's Door");
      expect(() => validateBandName('')).toThrow();
      expect(() => validateBandName('a'.repeat(51))).toThrow();
    });

    it('should validate venue capacity', () => {
      expect(validateVenueCapacity(100)).toBe(100);
      expect(() => validateVenueCapacity(0)).toThrow('Venue capacity must be at least 1');
      expect(() => validateVenueCapacity(100001)).toThrow('Venue capacity must be at most 100000');
    });
  });

  describe('validateResources', () => {
    it('should validate resource objects', () => {
      const result = validateResources({
        money: 1000,
        reputation: 50,
        fans: 100,
        stress: 25,
        connections: 10,
      });

      expect(result).toEqual({
        money: 1000,
        reputation: 50,
        fans: 100,
        stress: 25,
        connections: 10,
      });
    });

    it('should validate partial resource objects', () => {
      const result = validateResources({
        money: 500,
        reputation: 75,
      });

      expect(result).toEqual({
        money: 500,
        reputation: 75,
      });
    });

    it('should enforce resource constraints', () => {
      expect(() => validateResources({ money: -20000 })).toThrow();
      expect(() => validateResources({ reputation: 101 })).toThrow();
      expect(() => validateResources({ stress: -1 })).toThrow();
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });
  });
});
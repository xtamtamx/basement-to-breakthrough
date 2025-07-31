import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeStorage } from '../safeStorage';

describe('Safe Storage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getItem', () => {
    it('should get item from localStorage', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(safeStorage.getItem('test-key')).toBe('test-value');
    });

    it('should return null if item does not exist', () => {
      expect(safeStorage.getItem('non-existent')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(safeStorage.getItem('test')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get item from localStorage: test',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('setItem', () => {
    it('should set item in localStorage', () => {
      const result = safeStorage.setItem('test-key', 'test-value');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(safeStorage.setItem('test', 'value')).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set item in localStorage: test',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should handle quota exceeded error', () => {
      const quotaError = new DOMException('QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });
      
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      const clearOldDataSpy = vi.spyOn(safeStorage, 'clearOldData').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(safeStorage.setItem('test', 'value')).toBe(false);
      expect(clearOldDataSpy).toHaveBeenCalled();
      
      clearOldDataSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      localStorage.setItem('test-key', 'test-value');
      const result = safeStorage.removeItem('test-key');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(safeStorage.removeItem('test')).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(safeStorage.isAvailable()).toBe(true);
    });

    it('should return false when localStorage is not available', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage not available');
      });

      expect(safeStorage.isAvailable()).toBe(false);
    });
  });

  describe('getSize', () => {
    it('should calculate total storage size', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      
      const size = safeStorage.getSize();
      // key1(4) + value1(6) + key2(4) + value2(6) = 20
      expect(size).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', () => {
      const keysSpy = vi.spyOn(Object, 'keys').mockImplementation(() => {
        throw new Error('Keys error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(safeStorage.getSize()).toBe(0);
      consoleSpy.mockRestore();
      keysSpy.mockRestore();
    });
  });

  describe('clearOldData', () => {
    it('should remove old save files keeping only recent ones', () => {
      // Create 10 old save files
      for (let i = 0; i < 10; i++) {
        localStorage.setItem(`btb-save-${i}`, 'save data');
      }

      safeStorage.clearOldData();

      // Should keep only the 5 most recent (5-9)
      for (let i = 0; i < 5; i++) {
        expect(localStorage.getItem(`btb-save-${i}`)).toBeNull();
      }
      for (let i = 5; i < 10; i++) {
        expect(localStorage.getItem(`btb-save-${i}`)).toBe('save data');
      }
    });

    it('should remove completed tutorial data', () => {
      localStorage.setItem('tutorialProgress', JSON.stringify({ completed: true }));
      safeStorage.clearOldData();
      expect(localStorage.getItem('tutorialProgress')).toBeNull();
    });

    it('should keep incomplete tutorial data', () => {
      const tutorialData = JSON.stringify({ completed: false, step: 3 });
      localStorage.setItem('tutorialProgress', tutorialData);
      safeStorage.clearOldData();
      expect(localStorage.getItem('tutorialProgress')).toBe(tutorialData);
    });
  });
});
import { devLog, prodLog } from "./devLogger";

/**
 * Safe localStorage wrapper with error handling
 * Prevents crashes when localStorage is disabled or full
 */

export const safeStorage = {
  /**
   * Safely get item from localStorage
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      devLog.warn(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  },

  /**
   * Safely set item in localStorage
   */
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      devLog.warn(`Failed to set item in localStorage: ${key}`, error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        // Try to clear old data
        this.clearOldData();
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          prodLog.error(
            "localStorage is full and cannot be cleared",
            retryError,
          );
          return false;
        }
      }
      return false;
    }
  },

  /**
   * Safely remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      devLog.warn(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  },

  /**
   * Safely clear all localStorage
   */
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      devLog.warn("Failed to clear localStorage", error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = "__localStorage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get storage size in bytes
   */
  getSize(): number {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      devLog.warn("Failed to calculate localStorage size", error);
      return 0;
    }
  },

  /**
   * Clear old data to make room
   */
  clearOldData(): void {
    try {
      // Clear old save data
      const keys = Object.keys(localStorage);
      const oldSaveKeys = keys
        .filter((key) => key.startsWith("btb-save-") && !key.includes("auto"))
        .sort();

      // Remove oldest saves, keep 5 most recent
      if (oldSaveKeys.length > 5) {
        oldSaveKeys.slice(0, -5).forEach((key) => {
          localStorage.removeItem(key);
        });
      }

      // Clear old tutorial data
      const tutorialKey = "tutorialProgress";
      const tutorialData = localStorage.getItem(tutorialKey);
      if (tutorialData) {
        try {
          const parsed = JSON.parse(tutorialData);
          // If tutorial is completed, remove it
          if (parsed.completed) {
            localStorage.removeItem(tutorialKey);
          }
        } catch {
          // Invalid data, remove it
          localStorage.removeItem(tutorialKey);
        }
      }
    } catch (error) {
      devLog.warn("Failed to clear old data", error);
    }
  },
};

// Export convenience functions
export const getStorageItem = safeStorage.getItem.bind(safeStorage);
export const setStorageItem = safeStorage.setItem.bind(safeStorage);
export const removeStorageItem = safeStorage.removeItem.bind(safeStorage);
export const isStorageAvailable = safeStorage.isAvailable.bind(safeStorage);

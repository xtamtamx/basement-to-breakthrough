import { StateStorage } from "zustand/middleware";
import { safeStorage } from "./safeStorage";

import { prodLog } from "./devLogger";
/**
 * Safe storage adapter for Zustand persist middleware
 */
export const safeZustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return safeStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    const success = safeStorage.setItem(name, value);
    if (!success) {
      prodLog.error(
        `Failed to save game state to localStorage. Game progress may be lost.`,
      );
      // Optionally dispatch an event to show a warning to the user
      window.dispatchEvent(
        new CustomEvent("storage-error", {
          detail: {
            type: "save-failed",
            message: "Unable to save game. Storage may be full or disabled.",
          },
        }),
      );
    }
  },
  removeItem: (name: string): void => {
    safeStorage.removeItem(name);
  },
};

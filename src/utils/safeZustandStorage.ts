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
      // Optionally dispatch an event to show a warning to the user.
      // Guard `window` — a persist write can fire after a test's jsdom env is
      // torn down (or in SSR/Node), where `window` is undefined; that unhandled
      // ReferenceError was failing CI even though all tests passed.
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("storage-error", {
            detail: {
              type: "save-failed",
              message: "Unable to save game. Storage may be full or disabled.",
            },
          }),
        );
      }
    }
  },
  removeItem: (name: string): void => {
    safeStorage.removeItem(name);
  },
};

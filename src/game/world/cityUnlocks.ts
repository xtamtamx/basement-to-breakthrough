/**
 * cityUnlocks - which tour cities are reachable.
 *
 * Cities unlock by hitting their reputation threshold, and the unlock is
 * recorded in MetaProgression so it PERSISTS ACROSS RUNS (Balatro-style): once
 * you've reached, say, 40 rep in any run, Nasheattle stays on the map forever.
 * Home (unlock.type === 'default') is always open.
 */
import { City } from "@game/types";
import { metaProgressionManager } from "@game/mechanics/MetaProgressionManager";

export const cityUnlockId = (cityId: string): string => `city_${cityId}`;

/** Is this city currently reachable? */
export function isCityUnlocked(city: City): boolean {
  if (city.unlock.type === "default") return true;
  return metaProgressionManager.hasUnlock(cityUnlockId(city.id));
}

/** A short "how do I unlock this?" line for the Tour screen. */
export function unlockRequirement(city: City): string {
  if (city.unlock.type === "reputation") {
    return city.unlock.label ?? `Reach ${city.unlock.value} reputation`;
  }
  return city.unlock.label ?? "Locked";
}

/**
 * Record any cities whose reputation threshold is now met (called per turn).
 * Returns the cities unlocked THIS call so the caller can announce them.
 */
export function recordCityUnlocks(cities: City[], reputation: number): City[] {
  const freshlyUnlocked: City[] = [];
  for (const city of cities) {
    if (city.unlock.type !== "reputation") continue;
    const threshold = city.unlock.value ?? Infinity;
    if (reputation < threshold) continue;
    if (metaProgressionManager.recordUnlock(cityUnlockId(city.id))) {
      freshlyUnlocked.push(city);
    }
  }
  return freshlyUnlocked;
}

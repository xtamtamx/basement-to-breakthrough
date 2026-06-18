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

/**
 * Cities that, once unlocked (cross-run), permanently grant +1 roster slot —
 * breaking into a bigger market expands your operation. Reaching these in ANY
 * run is a lasting Balatro-style upgrade applied at the next run's start.
 * (Chicaustin = the mid-game leap; New Angeles = the industry-town endgame.)
 */
const SLOT_GRANTING_CITIES = ["chicaustin", "newangeles"] as const;

/** Permanent +roster-slots earned from unlocked cities (0 if none yet). */
export function cityRosterSlotBonus(): number {
  return SLOT_GRANTING_CITIES.reduce(
    (sum, id) => sum + (metaProgressionManager.hasUnlock(cityUnlockId(id)) ? 1 : 0),
    0,
  );
}

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

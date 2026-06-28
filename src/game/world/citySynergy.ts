/**
 * citySynergy - the city↔band "scene fit" interlock.
 *
 * Every city has a primaryGenre (its scene's sound). Booking a band whose genre
 * matches — or is adjacent to — that sound draws a bigger, hotter crowd: the
 * local scene turns out for its own. A grunge band crushes it in Nasheattle; a
 * trap act owns Atlando. Mismatches aren't penalised (you can still play
 * anywhere) — they just don't get the hometown boost.
 */
import { Genre } from "@game/types";

// Genres that "vibe together" — an adjacent match gets a smaller boost than an
// exact one. Symmetric in spirit; listed per key for lookup.
const AFFINITY: Partial<Record<Genre, Genre[]>> = {
  [Genre.PUNK]: [Genre.HARDCORE, Genre.EMO, Genre.GRUNGE],
  [Genre.HARDCORE]: [Genre.PUNK, Genre.POWERVIOLENCE, Genre.METAL],
  [Genre.GRUNGE]: [Genre.ALTERNATIVE, Genre.PUNK, Genre.NOISE],
  [Genre.METAL]: [Genre.DOOM, Genre.SLUDGE, Genre.HARDCORE],
  [Genre.DOOM]: [Genre.METAL, Genre.SLUDGE],
  [Genre.SLUDGE]: [Genre.METAL, Genre.DOOM, Genre.NOISE],
  [Genre.EMO]: [Genre.PUNK, Genre.INDIE, Genre.ALTERNATIVE],
  [Genre.INDIE]: [Genre.ALTERNATIVE, Genre.EMO, Genre.EXPERIMENTAL],
  [Genre.ALTERNATIVE]: [Genre.INDIE, Genre.GRUNGE, Genre.EMO],
  [Genre.ELECTRONIC]: [Genre.EXPERIMENTAL, Genre.NOISE],
  [Genre.EXPERIMENTAL]: [Genre.NOISE, Genre.ELECTRONIC, Genre.INDIE],
  [Genre.NOISE]: [Genre.EXPERIMENTAL, Genre.POWERVIOLENCE, Genre.ELECTRONIC],
  [Genre.POWERVIOLENCE]: [Genre.HARDCORE, Genre.NOISE],
};

export type SceneFitTier = "perfect" | "good" | "neutral";

export interface SceneFit {
  tier: SceneFitTier;
  multiplier: number; // applied to attendance + reputation gain
  label: string;
}

/** How well a band's genre fits a city's scene. */
export function cityGenreFit(cityGenre: Genre | undefined, bandGenre: Genre): SceneFit {
  if (!cityGenre) return { tier: "neutral", multiplier: 1, label: "" };
  if (bandGenre === cityGenre) return { tier: "perfect", multiplier: 1.3, label: "Hometown sound" };
  if ((AFFINITY[cityGenre] ?? []).includes(bandGenre)) return { tier: "good", multiplier: 1.12, label: "Scene fit" };
  return { tier: "neutral", multiplier: 1, label: "" };
}

/** Crowd bonus when a band plays its OWN home city — the hometown turns out for
 *  one of their own. Band-specific (vs cityGenreFit's genre match); the two stack:
 *  a band playing its home scene in its home genre is a guaranteed packed room. */
export const HOME_CITY_MULT = 1.25;
export function homeCityFit(
  bandHomeCity: string | undefined,
  currentCityId: string,
): { isHome: boolean; multiplier: number; label: string } {
  if (bandHomeCity && bandHomeCity === currentCityId) {
    return { isHome: true, multiplier: HOME_CITY_MULT, label: "Hometown crowd" };
  }
  return { isHome: false, multiplier: 1, label: "" };
}

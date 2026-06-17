/**
 * citySignatures - what makes each city PLAY differently, not just look it.
 *
 * Every city carries a signature set of show modifiers, so where you tour is a
 * real strategic choice: a cheap, low-drama starter town vs a lucrative-but-
 * brutal-rent industry city vs a rowdy mosh pit that draws fans and trouble in
 * equal measure. All multipliers default to 1 (no effect) when omitted.
 */
import { CityThemeKey } from "@game/types";

export interface CitySignature {
  label: string;
  blurb: string;
  attendanceMult?: number; // crowd size
  revenueMult?: number; // door + bar take
  rentMult?: number; // venue rent
  repMult?: number; // reputation gained per show
  fanMult?: number; // fans gained per show
  incidentMult?: number; // base incident chance
}

// Keyed by city theme key (== city id). Cities not listed have no signature.
const SIGNATURES: Partial<Record<CityThemeKey, CitySignature>> = {
  home: {
    label: "Suburban Grind",
    blurb: "Cheap rooms, modest turnouts — a place to cut your teeth.",
    rentMult: 0.85,
  },
  bostland: {
    label: "Townie Pit",
    blurb: "Rowdy straight-edge pits: more fans, more broken noses.",
    fanMult: 1.15,
    incidentMult: 1.4,
  },
  detroleans: {
    label: "Rust & Soul",
    blurb: "Cheap, soulful, and a little dangerous after dark.",
    rentMult: 0.8,
    repMult: 1.1,
    incidentMult: 1.2,
  },
  nasheattle: {
    label: "Slow Burn",
    blurb: "Quiet, cheap, low-drama — crowds build slow but steady.",
    rentMult: 0.85,
    attendanceMult: 0.9,
    incidentMult: 0.7,
  },
  chicaustin: {
    label: "Festival Town",
    blurb: "Huge crowds — but everyone wants a cut of the door.",
    attendanceMult: 1.2,
    rentMult: 1.25,
  },
  atlando: {
    label: "Tourist Trap",
    blurb: "Theme-park money flows; scene cred does not.",
    revenueMult: 1.25,
    fanMult: 1.15,
    repMult: 0.9,
  },
  santampa: {
    label: "Mosh Swamp",
    blurb: "The gators mosh hardest — huge energy, frequent chaos.",
    fanMult: 1.2,
    incidentMult: 1.6,
  },
  newangeles: {
    label: "Industry Town",
    blurb: "Big money, brutal rent, and the slow creep of selling out.",
    revenueMult: 1.3,
    fanMult: 1.2,
    rentMult: 1.5,
    repMult: 0.85,
  },
};

export function getCitySignature(cityId: string): CitySignature | undefined {
  return SIGNATURES[cityId as CityThemeKey];
}

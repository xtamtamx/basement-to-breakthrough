/**
 * cities.ts - the tour roster.
 *
 * Each City is its own self-contained scene: 4 districts (reusing the canonical
 * quarter ids so the map/renderer lookups keep working), a venue pool, a vibe,
 * and a visual `theme` the map renderer keys off. Home reuses the hand-authored
 * districts + venues; the others are themed via a small generator so each city
 * looks and books distinctly. Cities unlock across runs (meta progression).
 */

import { City, District, Genre, Venue, VenueType } from "@game/types";
import { ALL_DISTRICTS } from "./districts";
// NOTE: the home city's venues are loaded lazily (via gameStore.loadInitialGameData
// → dynamic import of ./initialVenues) to preserve code-splitting. Do NOT statically
// import initialVenues here, or it bloats the initial bundle and breaks lazy-load.

// Canonical quarter ids/bounds — every city reuses these four slots so the
// renderer (FILLER_BUILDINGS, planTown) and CityView lookups stay valid.
const QUARTER_BOUNDS = {
  eastside: { x: 0, y: 0, width: 4, height: 4 },
  downtown: { x: 4, y: 0, width: 4, height: 4 },
  industrial: { x: 0, y: 4, width: 4, height: 4 },
  university: { x: 4, y: 4, width: 4, height: 4 },
} as const;

type QuarterId = keyof typeof QUARTER_BOUNDS;

interface DistrictSpec {
  name: string;
  sceneStrength: number;
  gentrificationLevel: number;
  policePresence: number;
  rentMultiplier: number;
  color: string;
}

function makeDistricts(specs: Record<QuarterId, DistrictSpec>): District[] {
  return (Object.keys(QUARTER_BOUNDS) as QuarterId[]).map((id) => ({
    id,
    name: specs[id].name,
    sceneStrength: specs[id].sceneStrength,
    gentrificationLevel: specs[id].gentrificationLevel,
    policePresence: specs[id].policePresence,
    rentMultiplier: specs[id].rentMultiplier,
    bounds: { ...QUARTER_BOUNDS[id] },
    color: specs[id].color,
  }));
}

// Standard venue archetypes (a capacity ramp). Each city themes the names.
interface VenueSpec {
  key: string;
  type: VenueType;
  districtId: QuarterId;
  capacity: number;
  acoustics: number;
  authenticity: number;
  atmosphere: number;
  rent: number;
  bookingDifficulty: number;
  hasBar?: boolean;
  hasSecurity?: boolean;
  hasStage?: boolean;
  allowsAllAges?: boolean;
  isPermanent?: boolean;
}

const VENUE_ARCHETYPES: VenueSpec[] = [
  { key: "basement", type: VenueType.BASEMENT, districtId: "eastside", capacity: 30, acoustics: 20, authenticity: 100, atmosphere: 80, rent: 0, bookingDifficulty: 1, allowsAllAges: true, isPermanent: true },
  { key: "diy", type: VenueType.DIY_SPACE, districtId: "eastside", capacity: 80, acoustics: 50, authenticity: 85, atmosphere: 65, rent: 90, bookingDifficulty: 2, allowsAllAges: true, isPermanent: true },
  { key: "warehouse", type: VenueType.WAREHOUSE, districtId: "industrial", capacity: 150, acoustics: 40, authenticity: 90, atmosphere: 75, rent: 60, bookingDifficulty: 3, allowsAllAges: true, isPermanent: false },
  { key: "dive", type: VenueType.DIVE_BAR, districtId: "industrial", capacity: 120, acoustics: 60, authenticity: 70, atmosphere: 85, rent: 180, bookingDifficulty: 4, hasBar: true, isPermanent: true },
  { key: "club", type: VenueType.PUNK_CLUB, districtId: "downtown", capacity: 220, acoustics: 70, authenticity: 60, atmosphere: 78, rent: 340, bookingDifficulty: 5, hasBar: true, hasSecurity: true, isPermanent: true },
  { key: "theater", type: VenueType.THEATER, districtId: "downtown", capacity: 500, acoustics: 90, authenticity: 40, atmosphere: 55, rent: 800, bookingDifficulty: 6, hasBar: true, hasSecurity: true, hasStage: true, allowsAllAges: true, isPermanent: true },
  { key: "special", type: VenueType.UNDERGROUND, districtId: "university", capacity: 60, acoustics: 55, authenticity: 100, atmosphere: 95, rent: 120, bookingDifficulty: 3, allowsAllAges: true, isPermanent: true },
];

function makeVenues(
  cityId: string,
  districts: District[],
  names: Record<string, string>,
): Venue[] {
  const byId: Record<string, District> = Object.fromEntries(
    districts.map((d) => [d.id, d]),
  );
  return VENUE_ARCHETYPES.map((a) => ({
    id: `${cityId}-${a.key}`,
    name: names[a.key] ?? a.key,
    type: a.type,
    capacity: a.capacity,
    acoustics: a.acoustics,
    authenticity: a.authenticity,
    atmosphere: a.atmosphere,
    modifiers: [],
    traits: [],
    location: byId[a.districtId],
    rent: a.rent,
    equipment: [],
    allowsAllAges: a.allowsAllAges ?? false,
    hasBar: a.hasBar ?? false,
    hasSecurity: a.hasSecurity ?? false,
    hasStage: a.hasStage,
    isPermanent: a.isPermanent ?? true,
    bookingDifficulty: a.bookingDifficulty,
  }));
}

// --- Rust Belt: sludge, smokestacks, the heaviest crowds -----------------
const rustDistricts = makeDistricts({
  eastside: { name: "The Foundry", sceneStrength: 85, gentrificationLevel: 15, policePresence: 35, rentMultiplier: 0.9, color: "#b06a3a" },
  downtown: { name: "Slag Heights", sceneStrength: 60, gentrificationLevel: 55, policePresence: 55, rentMultiplier: 1.3, color: "#8a8a8a" },
  industrial: { name: "Tannery Row", sceneStrength: 75, gentrificationLevel: 10, policePresence: 65, rentMultiplier: 0.7, color: "#7a5230" },
  university: { name: "Steel Tech", sceneStrength: 55, gentrificationLevel: 35, policePresence: 30, rentMultiplier: 1.1, color: "#c0843e" },
});

// --- Seaside: sunny, salt-stained pop-punk -------------------------------
const seasideDistricts = makeDistricts({
  eastside: { name: "The Boardwalk", sceneStrength: 75, gentrificationLevel: 45, policePresence: 25, rentMultiplier: 1.2, color: "#22b3c0" },
  downtown: { name: "Marina Bay", sceneStrength: 50, gentrificationLevel: 70, policePresence: 40, rentMultiplier: 1.6, color: "#3b82f6" },
  industrial: { name: "The Docks", sceneStrength: 80, gentrificationLevel: 20, policePresence: 45, rentMultiplier: 0.9, color: "#0d9488" },
  university: { name: "Surf College", sceneStrength: 60, gentrificationLevel: 40, policePresence: 20, rentMultiplier: 1.2, color: "#f59e0b" },
});

// --- The Capital: sellout central, all-glass and brand activations -------
const capitalDistricts = makeDistricts({
  eastside: { name: "Gallery Row", sceneStrength: 55, gentrificationLevel: 75, policePresence: 30, rentMultiplier: 1.8, color: "#a855f7" },
  downtown: { name: "Financial District", sceneStrength: 35, gentrificationLevel: 95, policePresence: 70, rentMultiplier: 2.2, color: "#64748b" },
  industrial: { name: "Media Mile", sceneStrength: 45, gentrificationLevel: 80, policePresence: 50, rentMultiplier: 1.7, color: "#0ea5e9" },
  university: { name: "The Quad", sceneStrength: 50, gentrificationLevel: 60, policePresence: 35, rentMultiplier: 1.5, color: "#f43f5e" },
});

export const CITIES: City[] = [
  {
    id: "home",
    name: "Basement City",
    blurb: "Where the scene started. Your scrappy DIY hometown.",
    vibe: "scrappy DIY punk",
    primaryGenre: Genre.PUNK,
    theme: "home",
    districts: ALL_DISTRICTS,
    venues: [], // populated lazily by loadInitialGameData (see note above)
    unlock: { type: "default", label: "Home turf" },
  },
  {
    id: "rust",
    name: "Rust Belt",
    blurb: "Smokestacks, cheap rent, and the heaviest crowds in the country.",
    vibe: "sludge metal",
    primaryGenre: Genre.SLUDGE,
    theme: "rust",
    districts: rustDistricts,
    venues: makeVenues("rust", rustDistricts, {
      basement: "The Boiler Room",
      diy: "Local 161 Union Hall",
      warehouse: "Foundry Floor",
      dive: "The Slag Heap",
      club: "Corrosion",
      theater: "The Carnegie (RIP)",
      special: "Tunnel Seven",
    }),
    unlock: { type: "reputation", value: 25, label: "Reach 25 reputation" },
  },
  {
    id: "seaside",
    name: "Seaside",
    blurb: "Sun, salt, and pop-punk that never grew up.",
    vibe: "sunny pop-punk",
    primaryGenre: Genre.EMO,
    theme: "seaside",
    districts: seasideDistricts,
    venues: makeVenues("seaside", seasideDistricts, {
      basement: "Tito's Garage",
      diy: "The Shell Shack",
      warehouse: "Pier 9 Warehouse",
      dive: "The Salty Dog",
      club: "High Tide",
      theater: "Seabreeze Pavilion",
      special: "The Tide Pool",
    }),
    unlock: { type: "reputation", value: 50, label: "Reach 50 reputation" },
  },
  {
    id: "capital",
    name: "The Capital",
    blurb: "Where scenes go to get a brand deal. Mind the velvet rope.",
    vibe: "industry-plant indie",
    primaryGenre: Genre.INDIE,
    theme: "capital",
    districts: capitalDistricts,
    venues: makeVenues("capital", capitalDistricts, {
      basement: "The Influencer's Loft",
      diy: "WeWork Commons",
      warehouse: "The Brand Activation Space",
      dive: "Speakeasy (Ironic)",
      club: "Verified",
      theater: "The Synergy Center",
      special: "Pop-Up Experience",
    }),
    unlock: { type: "reputation", value: 75, label: "Reach 75 reputation" },
  },
];

export const HOME_CITY_ID = "home";

export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

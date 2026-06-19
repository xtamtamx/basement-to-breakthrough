/**
 * cities.ts - the tour roster.
 *
 * Each City is its own self-contained scene: 4 districts (reusing the canonical
 * quarter ids so the map/renderer lookups keep working), a venue pool, a vibe,
 * and a visual `theme` the map renderer keys off. Home reuses the hand-authored
 * districts + venues; the tour stops are goofy PORTMANTEAU blends of two real
 * music markets (parody names only — no real trademarks) so each city carries
 * twice the scene flavor. Cities unlock across runs (meta progression).
 */

import { City, District, Genre, Venue, VenueType } from "@game/types";
import { ALL_DISTRICTS } from "./districts";
// NOTE: the home city's venues are loaded lazily (via gameStore.loadInitialGameData
// → dynamic import of ./initialVenues) to preserve code-splitting. Do NOT statically
// import initialVenues here, or it bloats the initial bundle and breaks lazy-load.

// Canonical quarter ids/bounds — every city reuses these four slots so the
// renderer (DISTRICT_POOLS, planTown) and CityView lookups stay valid.
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

// Compose districts from just NAMES + COLORS (the flavor) plus a stat bias, so
// the satirical naming stays separate from the balance numbers. bias scales how
// gentrified/expensive the whole city is: 'diy' = scrappy, 'sellout' = soulless.
type CityBias = "diy" | "mixed" | "sellout";
type Quarter = { name: string; color: string };

const BASE_STATS: Record<QuarterId, { scene: number; gent: number; police: number }> = {
  eastside: { scene: 80, gent: 25, police: 25 },
  downtown: { scene: 55, gent: 55, police: 50 },
  industrial: { scene: 72, gent: 18, police: 55 },
  university: { scene: 58, gent: 40, police: 30 },
};

function cityDistricts(flavor: Record<QuarterId, Quarter>, bias: CityBias): District[] {
  const g = bias === "diy" ? 0.7 : bias === "sellout" ? 1.7 : 1.0;
  const specs = {} as Record<QuarterId, DistrictSpec>;
  (Object.keys(BASE_STATS) as QuarterId[]).forEach((id) => {
    const b = BASE_STATS[id];
    const gent = Math.max(5, Math.min(98, Math.round(b.gent * g)));
    specs[id] = {
      name: flavor[id].name,
      color: flavor[id].color,
      sceneStrength: Math.round(bias === "sellout" ? b.scene - 12 : b.scene),
      gentrificationLevel: gent,
      policePresence: b.police,
      rentMultiplier: +(0.8 + (gent / 100) * 1.0).toFixed(2),
    };
  });
  return makeDistricts(specs);
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

// --- Tour stops: goofy two-market portmanteau blends ------------------------
const bostlandDistricts = cityDistricts({
  eastside: { name: "Pawtucky Heights", color: "#7b3f9e" },
  downtown: { name: "Beanflannel Sq.", color: "#c0392b" },
  industrial: { name: "Kombucha Wharf", color: "#4a6b5a" },
  university: { name: "Cardigan Yard", color: "#2e5c8a" },
}, "diy");

const detroleansDistricts = cityDistricts({
  eastside: { name: "Coney Quarter", color: "#7a3fb5" },
  downtown: { name: "Motorgras Row", color: "#d4a017" },
  industrial: { name: "The Foundry Wards", color: "#b3501f" },
  university: { name: "Brassmore Campus", color: "#2f9e8f" },
}, "diy");

const nasheattleDistricts = cityDistricts({
  eastside: { name: "Twangter Park", color: "#6b8e5a" },
  downtown: { name: "Lower Bootsy Row", color: "#c2562f" },
  industrial: { name: "Flannel Gulch", color: "#4a5560" },
  university: { name: "Grad Steel Hill", color: "#7a6ca8" },
}, "mixed");

const chicaustinDistricts = cityDistricts({
  eastside: { name: "Keepin' It Weird Side", color: "#b5482e" },
  downtown: { name: "The Windy Loop", color: "#5a86c2" },
  industrial: { name: "Deep-Dish Stockyards", color: "#7a5a3a" },
  university: { name: "Sixth & Studious", color: "#e0a32a" },
}, "mixed");

const atlandoDistricts = cityDistricts({
  eastside: { name: "Eastside Auto-Trap", color: "#7a2bd6" },
  downtown: { name: "Downtempo Loop", color: "#1f8fe0" },
  industrial: { name: "Strip-Mall 808 Row", color: "#c9522a" },
  university: { name: "Mouseketeer Commons", color: "#e84fa0" },
}, "mixed");

const sanTampaDistricts = cityDistricts({
  eastside: { name: "Gator Gulch", color: "#4a5d23" },
  downtown: { name: "Blast Beach", color: "#2e6b8c" },
  industrial: { name: "The Morrisound Mile", color: "#5c4033" },
  university: { name: "Thrash State College", color: "#c9a227" },
}, "mixed");

const newAngelesDistricts = cityDistricts({
  eastside: { name: "Sunset Bushwick", color: "#e0457b" },
  downtown: { name: "No-Wave-ho", color: "#2b2d42" },
  industrial: { name: "The Brokelyn Docks", color: "#5a6473" },
  university: { name: "Tisch & Tan U.", color: "#3fa796" },
}, "sellout");

export const CITIES: City[] = [
  {
    id: "home",
    name: "Strong Island",
    blurb: "Long Island's finest: VFW emo, strip-mall riffs, and a 9:40 last train home.",
    vibe: "parkway pop-punk emo",
    primaryGenre: Genre.EMO,
    theme: "home",
    districts: ALL_DISTRICTS,
    venues: [], // populated lazily by loadInitialGameData (see note above)
    unlock: { type: "default", label: "Home turf" },
  },
  {
    id: "bostland",
    name: "Bostland",
    blurb: "Where straight-edge bruisers and bird-on-it baristas share one wicked weird pit.",
    vibe: "twee-edge mosh",
    primaryGenre: Genre.HARDCORE,
    theme: "bostland",
    districts: bostlandDistricts,
    venues: makeVenues("bostland", bostlandDistricts, {
      basement: "The Wicked Cellah",
      diy: "O'Bryan's All-Ages Pub",
      warehouse: "The Channel-Changer",
      dive: "Dunkin' & Bruisin'",
      club: "Misissi-Pit Studios",
      theater: "The Crystal Ballgown",
      special: "The Rathskellah",
    }),
    unlock: { type: "reputation", value: 15, label: "Reach 15 reputation" },
  },
  {
    id: "detroleans",
    name: "Detroleans",
    blurb: "Where the assembly line of the soul gets second-lined straight into a ditch.",
    vibe: "assembly-line second-line",
    primaryGenre: Genre.EXPERIMENTAL,
    theme: "detroleans",
    districts: detroleansDistricts,
    venues: makeVenues("detroleans", detroleansDistricts, {
      basement: "The Crawdad Cellar",
      diy: "Motown Bounce Hall",
      warehouse: "The U.F.O. Foundry",
      dive: "Snake & Drake's Xmas Dive",
      club: "The Magic Drumstick",
      theater: "The Grand Marquee Ballroom",
      special: "Reservation Hall",
    }),
    unlock: { type: "reputation", value: 25, label: "Reach 25 reputation" },
  },
  {
    id: "nasheattle",
    name: "Nasheattle",
    blurb: "Every flannel hides a pedal steel and every latte is two chords short of a breakdown.",
    vibe: "honky-tonk grunge",
    primaryGenre: Genre.GRUNGE,
    theme: "nasheattle",
    districts: nasheattleDistricts,
    venues: makeVenues("nasheattle", nasheattleDistricts, {
      basement: "The Drippin' Cellar",
      diy: "The Veranda Project",
      warehouse: "The Off Rambler",
      dive: "The Comet Honky-Tavern",
      club: "The Crocodial-Tone",
      theater: "The Grand Ole Showbox",
      special: "The Bluejay Cafe",
    }),
    unlock: { type: "reputation", value: 40, label: "Reach 40 reputation" },
  },
  {
    id: "chicaustin",
    name: "Chicaustin",
    blurb: "Deep-dish blues meets badge-overload weird — keep it loud, keep it gritty.",
    vibe: "windy outlaw blues",
    primaryGenre: Genre.ALTERNATIVE,
    theme: "chicaustin",
    districts: chicaustinDistricts,
    venues: makeVenues("chicaustin", chicaustinDistricts, {
      basement: "The Whole in the Wall",
      diy: "Liberty Brunch",
      warehouse: "Wax Tracks Yard",
      dive: "The Empty Growler",
      club: "Emoji's",
      theater: "Dahlia Hall",
      special: "The Hidey-Hole",
    }),
    unlock: { type: "reputation", value: 55, label: "Reach 55 reputation" },
  },
  {
    id: "atlando",
    name: "Atlando",
    blurb: "Where the 808 hits so hard it knocks the ears off a knockoff cartoon mouse.",
    vibe: "bubblegum trap",
    primaryGenre: Genre.ELECTRONIC,
    theme: "atlando",
    districts: atlandoDistricts,
    venues: makeVenues("atlando", atlandoDistricts, {
      basement: "The Dungeon Family Room",
      diy: "The All-Ages Block",
      warehouse: "Terminal Best",
      dive: "Won't's Pub",
      club: "The Masquerave",
      theater: "The Beachfront Vaudeville",
      special: "Tragic City",
    }),
    unlock: { type: "reputation", value: 70, label: "Reach 70 reputation" },
  },
  {
    id: "santampa",
    name: "San Tampa",
    blurb: "The gators mosh harder than the trust-fund thrashers who priced out the swamp.",
    vibe: "swampy techno-thrash",
    primaryGenre: Genre.METAL,
    theme: "santampa",
    districts: sanTampaDistricts,
    venues: makeVenues("santampa", sanTampaDistricts, {
      basement: "The Sourfog Cellar",
      diy: "926 Gillman Co-op",
      warehouse: "The Mabuhay Garage",
      dive: "The Brass Pug",
      club: "On Broadway Pressed",
      theater: "The Glitz Ybor",
      special: "Ruthie's Out",
    }),
    unlock: { type: "reputation", value: 85, label: "Reach 85 reputation" },
  },
  {
    id: "newangeles",
    name: "New Angeles",
    blurb: "Where your basement demo gets an A&R deal, a brand sponsor, and a betrayal arc by Tuesday.",
    vibe: "no-wave hair-metal hustle",
    primaryGenre: Genre.INDIE,
    theme: "newangeles",
    districts: newAngelesDistricts,
    venues: makeVenues("newangeles", newAngelesDistricts, {
      basement: "286 Kent-Adjacent",
      diy: "The Smelle",
      warehouse: "Bushwick Market Motel",
      dive: "Saint Vinyl's",
      club: "Whisky a No-No",
      theater: "The Browery Ballroom",
      special: "CB's & OMFUG Annex",
    }),
    unlock: { type: "reputation", value: 100, label: "Reach 100 reputation" },
  },
];

export const HOME_CITY_ID = "home";

export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

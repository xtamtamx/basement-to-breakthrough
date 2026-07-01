import { create } from "zustand";
export type { GameState } from "@game/types";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GamePhase,
  Difficulty,
  FactionEvent,
  City,
  District,
  Venue,
  Walker,
  VenueType,
  Band,
  Genre,
  TraitType,
  Show,
  ShowResult,
  RunObjectives,
} from "@game/types";
import { objectiveManager } from "@game/mechanics/ObjectiveManager";
import { safeZustandStorage } from "@utils/safeZustandStorage";
import type { RuntimeSnapshot } from "@game/persistence/runtimeSnapshot";
import type { Synergy } from "@game/mechanics/SynergyManager";
import { eventCardSystem, type EventCard } from "@game/mechanics/EventCardSystem";
import { factionSystem } from "@game/mechanics/FactionSystem";
import { showPromotionSystem } from "@game/mechanics/ShowPromotionSystem";
import { bandDeposit } from "@game/mechanics/bandEconomy";
import { VENUE_TRAITS } from "@game/data/venueTraits";
import { SATIRICAL_VENUE_DESCRIPTIONS } from "@game/data/satiricalText";
import { gameAudio } from "@utils/gameAudio";
import { clamp, CONSTRAINTS } from "@utils/validation";
import { performanceMetrics } from "@utils/performanceMetrics";
import { ALL_DISTRICTS } from "../data/districts";
import { CITIES, HOME_CITY_ID } from "../data/cities";
import { BASE_ROSTER_SLOTS, ROSTER_SLOT_FLOOR, nextBookingManagerCost } from "@game/constants/runConstants";
import { isBandUnlocked } from "@game/world/bandUnlocks";
import { TOURING_ENABLED } from "@/config/featureFlags";

// Lazy load initial data
let initialDataPromise: Promise<{ bands: Band[], venues: Venue[] }> | null = null;
const loadInitialData = async () => {
  if (!initialDataPromise) {
    initialDataPromise = performanceMetrics.trackLazyLoad('initial-game-data', async () => {
      const [bandsModule, venuesModule] = await Promise.all([
        performanceMetrics.trackLazyLoad('initial-bands', () => import("../data/initialBands")),
        performanceMetrics.trackLazyLoad('initial-venues', () => import("../data/initialVenues"))
      ]) as [typeof import("../data/initialBands"), typeof import("../data/initialVenues")];

      return {
        bands: bandsModule.initialBands,
        venues: venuesModule.initialVenues
      };
    }) as Promise<{ bands: Band[], venues: Venue[] }>;
  }
  return initialDataPromise;
};

/**
 * Prune dangling band/venue references from a restored run.
 *
 * After a data-file patch (a band/venue removed or its id renamed), a persisted
 * save's scheduledShows / rosterBandIds — and the ShowPromotionSystem's
 * in-memory Map — can reference ids that no longer resolve against the current
 * allBands/venues. Left in place, executeShow treats a dangling show as a
 * failed show and docks reputation, which is unfair to the player. This runs
 * once after the run state is restored (loadGame + onRehydrateStorage) and
 * treats anything unresolved as silently cancelled.
 *
 * Defensive: a no-op (returns the same data unchanged) when everything
 * resolves. Mutates `showPromotionSystem` and returns the cleaned store slices.
 */
function pruneDanglingReferences(opts: {
  allBands: Band[];
  venues: Venue[];
  scheduledShows: Show[];
  rosterBandIds: string[];
}): { scheduledShows: Show[]; rosterBandIds: string[] } {
  const validBandIds = new Set((opts.allBands ?? []).map((b) => b.id));
  const validVenueIds = new Set((opts.venues ?? []).map((v) => v.id));

  // Drop dangling shows from the in-memory promotion Map so they never reach
  // executeShow as "failed" shows.
  showPromotionSystem.pruneDangling(validBandIds, validVenueIds);

  const scheduledShows = (opts.scheduledShows ?? []).filter(
    (s) => validBandIds.has(s.bandId) && validVenueIds.has(s.venueId),
  );
  const rosterBandIds = (opts.rosterBandIds ?? []).filter((id) =>
    validBandIds.has(id),
  );

  return { scheduledShows, rosterBandIds };
}

interface GameStore {
  // Game state
  money: number;
  reputation: number;
  /** Highest reputation reached this run — gates the venue scene-growth ladder
   *  one-way so opened venues never vanish after a rep dip. */
  peakReputation: number;
  fans: number;
  stress: number;
  connections: number;
  currentRound: number;
  phase: GamePhase;
  difficulty: Difficulty;

  // City state
  districts: District[];
  venues: Venue[];
  /** Tour roster; the active city's districts/venues mirror into the fields above. */
  cities: City[];
  currentCityId: string;
  walkers: Walker[];

  // Band state
  allBands: Band[];
  rosterBandIds: string[];
  /** Roster slot cap; set at run start from
   *  base + per-mode delta + meta upgrades + city unlocks, then bumped
   *  in-run by each Booking Manager hire. */
  maxRosterSize: number;
  /** Booking Managers hired THIS run (each +1 slot; drives the next hire cost). */
  hiredManagers: number;
  /** Snapshot of the run-start slot contributions (for the "where do my slots
   *  come from?" breakdown). hiredManagers is added on top, live. */
  rosterSlotSources: { base: number; mode: number; meta: number; city: number };

  // Show state
  scheduledShows: Show[];
  showHistory: Show[];
  lastTurnResults: ShowResult[];

  // Durable-resume state (persisted so a refresh/load resumes the run intact)
  consecutiveBrokeTurns: number;
  runtimeSnapshot: RuntimeSnapshot | null;

  // Faction state
  currentFactionEvent: FactionEvent | null;
  /** Player standing (-100..100) per faction id; empty = all neutral. Persisted;
   *  the FactionSystem singleton is a stateless calculator hydrated from this. */
  factionStandings: Record<string, number>;
  /** Transient, single-turn capacity penalty (>=0) applied to ALL venues by a
   *  crisis event (e.g. police_crackdown). Read at show resolution as an EFFECTIVE
   *  reduction — never written into base venue capacity — then cleared after the
   *  turn resolves, so it can't compound a venue toward 0. Mirrors the
   *  gentrification multiplier pattern. */
  eventCapacityPenalty: number;

  // Discovery state
  discoveredSynergies: string[]; // List of discovered synergy IDs
  runObjectives: RunObjectives; // Optional run challenges (meta-fame rewards)

  // Transient: a milestone-offered equipped synergy ("instinct") awaiting the
  // player's accept/replace decision. The reactive bridge to the off-Zustand
  // synergyManager singleton; NOT persisted (re-derives at the next milestone).
  pendingSynergyOffer: Synergy | null;

  // Transient: a drawn event card awaiting the player's choice (band-drama /
  // scene crisis). Mirrors pendingSynergyOffer; NOT persisted.
  pendingEventCard: EventCard | null;

  // Festival state
  completedFestivals: string[]; // List of completed festival IDs
  festivalHistory: { festivalId: string; result: ShowResult; date: Date }[]; // Festival results history

  // Path state
  diyPoints: number;
  pathChoices: string[]; // History of path choices made
  pathAlignment: string; // Current alignment

  // Actions
  setPhase: (phase: GamePhase) => void;
  addMoney: (amount: number) => void;
  addFans: (amount: number) => void;
  addReputation: (amount: number) => void;
  addStress: (amount: number) => void;
  addConnections: (amount: number) => void;
  nextRound: () => void;
  resetGame: () => void;
  loadInitialGameData: () => Promise<void>;
  
  // Save/Load
  saveGame: (saveName?: string) => Promise<string>;
  loadGame: (saveId: string) => Promise<boolean>;

  // City actions
  updateDistricts: (districts: District[]) => void;
  updateVenues: (venues: Venue[]) => void;
  updateVenue: (venue: Venue) => void;
  updateWalkers: (walkers: Walker[]) => void;
  addVenue: (venue: Venue) => void;
  /** Travel to another city: swaps the active districts/venues (state persists per-city). */
  switchCity: (cityId: string) => void;

  // Band actions
  addBandToRoster: (bandId: string) => void;
  removeBandFromRoster: (bandId: string) => void;
  /** Hire a Booking Manager: spend cash for +1 roster slot, applied now. */
  hireBookingManager: () => void;
  updateBand: (bandId: string, updates: Partial<Band>) => void;

  // Show actions
  scheduleShow: (show: Show, turnsInAdvance?: number) => void;
  cancelAllScheduledShows: () => void;
  completeShow: (showId: string, result: ShowResult) => void;

  // Faction actions
  setFactionEvent: (event: FactionEvent | null) => void;
  setFactionStandings: (standings: Record<string, number>) => void;
  applyFactionChoice: (eventId: string, choiceId: string) => void;

  // Discovery actions
  discoverSynergy: (synergyId: string) => void;
  hasSynergyDiscovered: (synergyId: string) => boolean;
  setPendingSynergyOffer: (offer: Synergy | null) => void;
  setPendingEventCard: (card: EventCard | null) => void;
  applyEventCardChoice: (choiceId: string | null) => void;

  // Festival actions
  completeFestival: (festivalId: string, result: ShowResult) => void;
  hasFestivalCompleted: (festivalId: string) => boolean;

  // District actions
  updateDistrictGentrification: (
    districtId: string,
    changes: Partial<District>,
  ) => void;

  // Path actions
  makePathChoice: (choiceId: string, diyPointsChange: number) => void;
  updatePathAlignment: () => void;

  // Lazy loading actions
  loadAllBands: () => void;
  loadAllVenues: () => void;
}

// Initial districts for the city — single source of truth in data/districts.ts
const initialDistricts: District[] = ALL_DISTRICTS;

// Initial venues for the city
const initialVenues: Venue[] = [
  {
    id: "v1",
    name: SATIRICAL_VENUE_DESCRIPTIONS.BASEMENT.name,
    type: VenueType.BASEMENT,
    capacity: 30,
    acoustics: 45,
    authenticity: 100,
    atmosphere: 85,
    modifiers: [],
    traits: [VENUE_TRAITS.GRIMY_FLOORS, VENUE_TRAITS.INTIMATE_SETTING].filter(
      Boolean,
    ),
    location: initialDistricts[0], // Eastside
    rent: 0,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    hasStage: false,
    isPermanent: true,
    bookingDifficulty: 2,
    gridPosition: { x: 1, y: 1 },
    upgrades: [],
  },
  {
    id: "v2",
    name: "The Broken Bottle",
    type: VenueType.DIVE_BAR,
    capacity: 80,
    acoustics: 60,
    authenticity: 75,
    atmosphere: 70,
    modifiers: [],
    traits: [VENUE_TRAITS.GRIMY_FLOORS, VENUE_TRAITS.SCENE_HANGOUT].filter(
      Boolean,
    ),
    location: initialDistricts[1], // Downtown
    rent: 150,
    equipment: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    hasStage: true,
    isPermanent: true,
    bookingDifficulty: 4,
    gridPosition: { x: 5, y: 2 },
    upgrades: [],
  },
  {
    id: "v3",
    name: "Warehouse 23",
    type: VenueType.WAREHOUSE,
    capacity: 150,
    acoustics: 50,
    authenticity: 90,
    atmosphere: 95,
    modifiers: [],
    traits: [VENUE_TRAITS.CUSTOM_ACOUSTICS, VENUE_TRAITS.POLICE_MAGNET].filter(
      Boolean,
    ),
    location: initialDistricts[2], // Industrial
    rent: 300,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    hasStage: false,
    isPermanent: false,
    bookingDifficulty: 6,
    gridPosition: { x: 2, y: 6 },
    upgrades: [],
  },
  {
    id: "v4",
    name: "Sarah's Garage",
    type: VenueType.GARAGE,
    capacity: 45,
    acoustics: 40,
    authenticity: 95,
    atmosphere: 80,
    modifiers: [],
    traits: [VENUE_TRAITS.BLOWN_SPEAKERS, VENUE_TRAITS.INTIMATE_SETTING].filter(
      Boolean,
    ),
    location: initialDistricts[0], // Eastside
    rent: 25,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    hasStage: false,
    isPermanent: true,
    bookingDifficulty: 2,
    gridPosition: { x: 3, y: 2 },
    upgrades: [],
  },
  {
    id: "v5",
    name: "DIY Space 101",
    type: VenueType.DIY_SPACE,
    capacity: 100,
    acoustics: 55,
    authenticity: 85,
    atmosphere: 90,
    modifiers: [],
    traits: [
      VENUE_TRAITS.ARTIST_FRIENDLY,
      VENUE_TRAITS.BOOKING_COLLECTIVE,
    ].filter(Boolean),
    location: initialDistricts[3], // University
    rent: 75,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    hasStage: true,
    isPermanent: true,
    bookingDifficulty: 3,
    gridPosition: { x: 6, y: 6 },
    upgrades: [],
  },
  {
    id: "v6",
    name: "The Pit",
    type: VenueType.UNDERGROUND,
    capacity: 120,
    acoustics: 65,
    authenticity: 100,
    atmosphere: 100,
    modifiers: [],
    traits: [VENUE_TRAITS.LEGENDARY_GRAFFITI, VENUE_TRAITS.CURSED_STAGE].filter(
      Boolean,
    ),
    location: initialDistricts[2], // Industrial
    rent: 200,
    equipment: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: false,
    hasStage: true,
    isPermanent: false,
    bookingDifficulty: 5,
    gridPosition: { x: 1, y: 5 },
    upgrades: [],
  },
];

// Initial bands for the game
const initialBands: Band[] = [
  {
    id: "b1",
    name: "Hüsker Don’t",
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ["hardcore punk", "noise"],
    popularity: 15,
    authenticity: 95,
    energy: 85,
    technicalSkill: 60,
    traits: [
      {
        id: "t1",
        name: "DIY Ethics",
        description: "True to the scene",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 10 },
      },
      {
        id: "t2",
        name: "Chaotic Live Shows",
        description: "Unpredictable energy",
        type: TraitType.PERFORMANCE,
        modifier: { popularity: 5 },
      },
    ],
    technicalRequirements: [],
    hometown: "Portland, OR",
    formedYear: 2021,
  },
  {
    id: "b2",
    name: "Panthera",
    isRealArtist: true,
    artistId: "real-1",
    genre: Genre.METAL,
    subgenres: ["doom", "sludge"],
    popularity: 45,
    authenticity: 75,
    energy: 70,
    technicalSkill: 85,
    traits: [
      {
        id: "t3",
        name: "Technical Masters",
        description: "Incredible musicianship",
        type: TraitType.TECHNICAL,
        modifier: { popularity: 10 },
      },
      {
        id: "t4",
        name: "Scene Veterans",
        description: "10+ years in the game",
        type: TraitType.SOCIAL,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    bio: "Crushing riffs and existential dread since 2013.",
    hometown: "Seattle, WA",
  },
  {
    id: "b3",
    name: "Bikini Bill",
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ["riot grrrl", "feminist punk"],
    popularity: 35,
    authenticity: 90,
    energy: 95,
    technicalSkill: 50,
    traits: [
      {
        id: "t5",
        name: "Political Message",
        description: "Strong social commentary",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 15 },
      },
      {
        id: "t6",
        name: "All Ages Champion",
        description: "Supports young fans",
        type: TraitType.SOCIAL,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "Olympia, WA",
    formedYear: 2022,
  },
  {
    id: "b4",
    name: "Mayheck",
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ["black metal", "atmospheric"],
    popularity: 25,
    authenticity: 85,
    energy: 60,
    technicalSkill: 90,
    traits: [
      {
        id: "t7",
        name: "Corpse Paint",
        description: "Traditional black metal aesthetic",
        type: TraitType.PERFORMANCE,
        modifier: { popularity: 10 },
      },
      {
        id: "t8",
        name: "Underground Legends",
        description: "Never sold out",
        type: TraitType.SOCIAL,
        modifier: { authenticity: 20 },
      },
    ],
    technicalRequirements: [],
    hometown: "Oslo, Norway",
    formedYear: 2019,
  },
  {
    id: "b5",
    name: "Guerilla Biscuits",
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ["hardcore", "youth crew"],
    popularity: 55,
    authenticity: 70,
    energy: 100,
    technicalSkill: 65,
    traits: [
      {
        id: "t9",
        name: "Circle Pit Masters",
        description: "Gets the crowd moving",
        type: TraitType.PERFORMANCE,
        modifier: { popularity: 15 },
      },
      {
        id: "t10",
        name: "Straight Edge",
        description: "No drugs or alcohol",
        type: TraitType.PERSONALITY,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "Boston, MA",
    formedYear: 2020,
  },
  {
    id: "b6",
    name: "Pg. 98",
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ["death metal", "technical"],
    popularity: 40,
    authenticity: 80,
    energy: 75,
    technicalSkill: 95,
    traits: [
      {
        id: "t11",
        name: "Blast Beat Specialists",
        description: "Lightning fast drumming",
        type: TraitType.TECHNICAL,
        modifier: {},
      },
      {
        id: "t12",
        name: "Gear Nerds",
        description: "Obsessed with equipment",
        type: TraitType.PERSONALITY,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "Tampa, FL",
    formedYear: 2018,
  },
  {
    id: "b7",
    name: "Sum 42",
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ["pop punk", "skate punk"],
    popularity: 65,
    authenticity: 60,
    energy: 85,
    technicalSkill: 70,
    traits: [
      {
        id: "t13",
        name: "Catchy Hooks",
        description: "Memorable choruses",
        type: TraitType.PERFORMANCE,
        modifier: { popularity: 15 },
      },
      {
        id: "t14",
        name: "Skater Friendly",
        description: "Popular with the skate scene",
        type: TraitType.SOCIAL,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "San Diego, CA",
    formedYear: 2021,
  },
  {
    id: "b8",
    name: "Amoebix",
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ["crust punk", "d-beat"],
    popularity: 30,
    authenticity: 95,
    energy: 90,
    technicalSkill: 55,
    traits: [
      {
        id: "t15",
        name: "Anti-Establishment",
        description: "No compromise politics",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 20 },
      },
      {
        id: "t16",
        name: "DIY or Die",
        description: "Self-releases only",
        type: TraitType.SOCIAL,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "Minneapolis, MN",
    formedYear: 2019,
  },
  {
    id: "b9",
    name: "Throne of Thorns",
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ["progressive metal", "djent"],
    popularity: 50,
    authenticity: 65,
    energy: 65,
    technicalSkill: 100,
    traits: [
      {
        id: "t17",
        name: "Polyrhythmic Masters",
        description: "Complex time signatures",
        type: TraitType.TECHNICAL,
        modifier: {},
      },
      {
        id: "t18",
        name: "Studio Perfectionists",
        description: "Incredible production quality",
        type: TraitType.PERFORMANCE,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "Austin, TX",
    formedYear: 2017,
  },
  {
    id: "b10",
    name: "The Rejects",
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ["street punk", "oi!"],
    popularity: 45,
    authenticity: 85,
    energy: 95,
    technicalSkill: 60,
    traits: [
      {
        id: "t19",
        name: "Working Class Heroes",
        description: "Blue collar anthems",
        type: TraitType.PERSONALITY,
        modifier: { authenticity: 10 },
      },
      {
        id: "t20",
        name: "Pub Rock Masters",
        description: "Perfect for dive bars",
        type: TraitType.PERFORMANCE,
        modifier: {},
      },
    ],
    technicalRequirements: [],
    hometown: "Philadelphia, PA",
    formedYear: 2020,
  },
];

/**
 * Reconcile persisted cities/districts against the current CITIES data file and
 * drop a currentCityId no longer present, taking fresh names/colors/venues while
 * preserving each district's gentrification drift. Shared by onRehydrateStorage
 * (page refresh) AND loadGame (save slot) so BOTH resume paths get the same
 * migration — a save predating a cities/roster rework no longer strands the
 * player on a removed city id with stale districts. Mutates the passed draft.
 */
function reconcileCitiesAgainstData(draft: {
  cities: City[];
  currentCityId: string;
  districts: District[];
}): void {
  const savedById = new Map(
    (Array.isArray(draft.cities) ? draft.cities : []).map((c) => [c.id, c]),
  );
  const mergeDrift = (fresh: District[], saved?: District[]): District[] => {
    const byId = new Map((saved ?? []).map((d) => [d.id, d]));
    return fresh.map((fd) => {
      const sd = byId.get(fd.id);
      return sd
        ? {
            ...fd,
            sceneStrength: sd.sceneStrength,
            gentrificationLevel: sd.gentrificationLevel,
            policePresence: sd.policePresence,
            rentMultiplier: sd.rentMultiplier,
          }
        : fd;
    });
  };
  draft.cities = CITIES.map((fresh) => {
    const saved = savedById.get(fresh.id);
    if (!saved) return fresh;
    return {
      ...fresh,
      venues: saved.venues?.length ? saved.venues : fresh.venues,
      districts: mergeDrift(fresh.districts, saved.districts),
    };
  });
  if (!CITIES.some((c) => c.id === draft.currentCityId)) {
    draft.currentCityId = HOME_CITY_ID;
  }
  const curCity = draft.cities.find((c) => c.id === draft.currentCityId);
  if (curCity && Array.isArray(draft.districts)) {
    const canon = new Map(curCity.districts.map((d) => [d.id, d]));
    draft.districts = draft.districts.map((d) => {
      const c = canon.get(d.id);
      return c ? { ...d, name: c.name, color: c.color } : d;
    });
  }
}

/**
 * Refresh each persisted band's authored CONTENT (name, bio, genre, subgenres,
 * traits, requirements…) from the current data file by id, while preserving the
 * run-mutated STATS (event-card deltas + the run-start quality shift). `allBands`
 * is persisted in the save, so without this an in-progress run keeps showing stale
 * band names/bios after a content patch — the bands' equivalent of the cities bug
 * reconcileCitiesAgainstData solves. Shared by loadGame (save slot) AND
 * onRehydrateStorage (refresh/relaunch) so both resume paths get the same refresh.
 * The authored roster is passed in (dynamically imported at the call sites) so the
 * band data stays out of the initial bundle. AUTHORED-AUTHORITATIVE (like
 * reconcileCitiesAgainstData): `allBands` becomes exactly the authored roster —
 * bands no longer in the data file are DROPPED (e.g. the parked touring roster
 * after the Long Island swap), so a stale save can't resurrect them;
 * pruneDanglingReferences then clears any orphaned roster/show refs. Mutates draft.
 */
const BAND_RUN_STATS = ["popularity", "authenticity", "energy", "technicalSkill"] as const;
function reconcileBandsAgainstData(draft: { allBands: Band[] }, authored: Band[]): void {
  // Nothing restored yet (e.g. menu boot) — let loadInitialGameData seed instead.
  if (!Array.isArray(draft.allBands) || draft.allBands.length === 0) return;
  if (!Array.isArray(authored) || authored.length === 0) return;
  const savedById = new Map(draft.allBands.map((b) => [b.id, b]));
  // Rebuild allBands as EXACTLY the authored roster, carrying over run-mutated
  // stats for any band the save already had. Save-only bands (not in the data
  // file) are dropped — that's what gets the parked touring roster off an old save.
  draft.allBands = authored.map((fresh) => {
    const prior = savedById.get(fresh.id);
    if (!prior) return fresh;
    const merged: Band = { ...fresh };
    for (const k of BAND_RUN_STATS) {
      if (typeof prior[k] === "number") merged[k] = prior[k];
    }
    return merged;
  });
}

// Lazy initialization function
const getInitialState = () => ({
  currentRound: 1,
  reputation: 0,
  peakReputation: 0,
  money: 200, // Starting money - barely enough for 1-2 small shows
  fans: 0,
  stress: 0,
  connections: 0,
  phase: GamePhase.MENU,
  difficulty: Difficulty.NORMAL,
  currentFactionEvent: null,
  factionStandings: {},
  eventCapacityPenalty: 0,
  districts: initialDistricts,
  venues: [], // Will be loaded lazily
  cities: CITIES,
  currentCityId: HOME_CITY_ID,
  walkers: [],
  allBands: [], // Will be loaded lazily
  rosterBandIds: [], // Will be populated after bands load
  maxRosterSize: BASE_ROSTER_SLOTS, // recomputed at run start (modifiers)
  hiredManagers: 0,
  rosterSlotSources: { base: BASE_ROSTER_SLOTS, mode: 0, meta: 0, city: 0 },
  scheduledShows: [],
  showHistory: [],
  lastTurnResults: [],
  consecutiveBrokeTurns: 0,
  runtimeSnapshot: null,
  discoveredSynergies: [],
  runObjectives: objectiveManager.emptyState(),
  pendingSynergyOffer: null as Synergy | null,
  pendingEventCard: null as EventCard | null,
  completedFestivals: [],
  festivalHistory: [],
  diyPoints: 0,
  pathChoices: [],
  pathAlignment: "BALANCED",
});

const initialState = getInitialState();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),

      addMoney: (amount) =>
        set((state) => {
          if (amount > 0) {
            gameAudio.moneyGain();
          }
          return {
            money: clamp(
              state.money + amount,
              CONSTRAINTS.MIN_MONEY,
              CONSTRAINTS.MAX_MONEY,
            ),
          };
        }),

      addFans: (amount) =>
        set((state) => ({
          fans: clamp(
            state.fans + amount,
            CONSTRAINTS.MIN_FANS,
            CONSTRAINTS.MAX_FANS,
          ),
        })),

      addReputation: (amount) =>
        set((state) => ({
          reputation: clamp(
            state.reputation + amount,
            CONSTRAINTS.MIN_REPUTATION,
            CONSTRAINTS.MAX_REPUTATION,
          ),
        })),

      addStress: (amount) =>
        set((state) => ({
          stress: clamp(
            state.stress + amount,
            CONSTRAINTS.MIN_STRESS,
            CONSTRAINTS.MAX_STRESS,
          ),
        })),

      addConnections: (amount) =>
        set((state) => ({
          connections: clamp(
            state.connections + amount,
            CONSTRAINTS.MIN_CONNECTIONS,
            CONSTRAINTS.MAX_CONNECTIONS,
          ),
        })),

      nextRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
          phase: GamePhase.PLANNING,
        })),

      resetGame: () => set(initialState),

      loadInitialGameData: async () => {
        const { bands, venues } = await loadInitialData();
        // Auto-sign the first UNLOCKED band (basement-punks today, but never seed
        // a locked band if the array order ever changes).
        const firstSigned = bands.find((b) => isBandUnlocked(b.id)) ?? bands[0];
        // Load the FULL home venue ladder; the scene-growth gate (unlockReputation
        // vs peakReputation) decides which actually show on the map / are bookable,
        // so the town opens with just the DIY rooms and grows from there.
        const homeVenues = venues;
        set((state) => ({
          // Surface the FULL authored roster as the free-agent pool — the roster
          // slot cap (base 4) is what makes signing a "who makes the cut" choice,
          // not an artificial pool cap. (Was slice(0,8), which silently hid 28
          // authored bands.) Sim stays balance-neutral: it signs the first-3 by
          // array order, which is unchanged.
          allBands: bands,
          venues: homeVenues,
          // Start with a SINGLE signed act — signing more is the player's first
          // real decision (and the onboarding walkthrough's first hands-on step).
          // The other first-5 bands are unsigned "Available" free agents.
          rosterBandIds: firstSigned ? [firstSigned.id] : [],
          // Backfill the home city's lazily-loaded venues so travelling back restores them
          cities: state.cities.map((c) =>
            c.id === HOME_CITY_ID ? { ...c, venues: homeVenues } : c,
          ),
        }));
      },
      
      // Save/Load
      saveGame: async (saveName?: string) => {
        try {
          const { saveGameManager } = await import('@game/persistence/SaveGameManager');
          const state = get();
          const saveId = await saveGameManager.saveGame(state, saveName);
          console.log('Game saved successfully:', saveId);
          return saveId;
        } catch (error) {
          console.error('Failed to save game:', error);
          throw error;
        }
      },
      
      loadGame: async (saveId: string) => {
        try {
          const { saveGameManager } = await import('@game/persistence/SaveGameManager');
          const savedState = await saveGameManager.loadGame(saveId);
          
          if (!savedState) {
            console.error('Failed to load save:', saveId);
            return false;
          }
          
          // Merge saved state with current state to preserve functions
          set((state) => ({
            ...state,
            ...savedState,
            // pendingSynergyOffer / pendingEventCard are transient UI intent; an
            // auto-save taken with either modal open must not re-pop it on load
            // (sanitizeGameState keeps all non-function data fields). They
            // re-derive at the next milestone / event turn.
            pendingSynergyOffer: null,
            pendingEventCard: null,
          }));

          // A save-slot load bypasses zustand's rehydrate, so it misses the
          // city/currentCityId reconciliation onRehydrateStorage performs. Run it
          // explicitly or an old save can strand the player on a removed city id.
          set((s) => {
            const draft = { cities: s.cities, currentCityId: s.currentCityId, districts: s.districts };
            reconcileCitiesAgainstData(draft);
            return draft;
          });

          // Bands are persisted too, so refresh their authored content from the
          // data file (names/bios/genre/traits) while preserving run-mutated stats.
          // Import lazily so the roster data stays out of the initial bundle.
          {
            const { initialBands: authoredBands } = await import("../data/initialBands");
            set((s) => {
              const draft = { allBands: s.allBands };
              reconcileBandsAgainstData(draft, authoredBands);
              return draft;
            });
          }

          // Rehydrate the run's singletons (active run, scheduled-show Map,
          // difficulty blocks, synergies) from the restored snapshot, or the
          // resumed run loses its win conditions and strands booked shows.
          const { restoreRuntimeSnapshot } = await import(
            '@game/persistence/runtimeSnapshot'
          );
          restoreRuntimeSnapshot(get().runtimeSnapshot);

          // One-time prune of dangling band/venue references that a data-file
          // patch may have orphaned in the loaded save. Treats anything that no
          // longer resolves as silently cancelled (no rep loss in executeShow).
          {
            const s = get();
            const cleaned = pruneDanglingReferences({
              allBands: s.allBands,
              venues: s.venues,
              scheduledShows: s.scheduledShows,
              rosterBandIds: s.rosterBandIds,
            });
            set(cleaned);
          }

          console.log('Game loaded successfully:', saveId);
          return true;
        } catch (error) {
          console.error('Failed to load game:', error);
          return false;
        }
      },

      // City actions
      updateDistricts: (districts) => set({ districts }),
      updateVenues: (venues) => set({ venues }),
      switchCity: (cityId) => {
        // Single-city demo: travel is disabled, the game stays on Strong Island.
        if (!TOURING_ENABLED) return;
        const state = get();
        const target = state.cities.find((c) => c.id === cityId);
        if (!target || cityId === state.currentCityId) return;
        // Write the active scene's live districts/venues back into its city so
        // per-city gentrification / venue state survives the round trip.
        const cities = state.cities.map((c) =>
          c.id === state.currentCityId
            ? { ...c, districts: state.districts, venues: state.venues }
            : c,
        );
        set({
          cities,
          currentCityId: cityId,
          districts: target.districts,
          venues: target.venues,
        });
        // The day-job pool is per-city (DayJobSystem derives it from the active
        // districts/shops). Clear the held job (its shop only exists in the city
        // you left — otherwise it keeps paying out / draining stats for a vanished
        // shop, the travel-time sibling of the cross-run bleed) and regenerate the
        // pool for the new scene. Dynamic import avoids a circular dependency.
        import('@game/mechanics/DayJobSystem').then(({ dayJobSystem }) => {
          dayJobSystem.setJob(null);
          dayJobSystem.refreshJobs();
        });
      },
      updateVenue: (venue) =>
        set((state) => ({
          venues: state.venues.map(v => v.id === venue.id ? venue : v)
        })),
      updateWalkers: (walkers) => set({ walkers }),
      addVenue: (venue) => {
        // Import dynamically to avoid circular dependency
        import('@/game/systems/CityGrowthManager').then(({ cityGrowthManager }) => {
          cityGrowthManager.recordVenueBuilt();
        });
        
        set((state) => ({ venues: [...state.venues, venue] }));
      },

      // Band actions
      addBandToRoster: (bandId) =>
        set((state) => {
          // Roster slot cap: silently no-op when full, already signed, or the
          // band is still LOCKED (Balatro unlock gate). UI disables the Sign
          // button + shows X/Y + locked cards, so this is the safety net for any
          // non-UI caller.
          if (
            state.rosterBandIds.includes(bandId) ||
            state.rosterBandIds.length >= state.maxRosterSize ||
            !isBandUnlocked(bandId)
          ) {
            return {};
          }
          return { rosterBandIds: [...state.rosterBandIds, bandId] };
        }),

      removeBandFromRoster: (bandId) =>
        set((state) => ({
          rosterBandIds: state.rosterBandIds.filter((id) => id !== bandId),
        })),

      // Hire a Booking Manager: pay the escalating fee for +1 roster slot,
      // applied immediately (the cap is dynamic). Capped at one slot per band
      // in town (no point managing more acts than exist), and a no-op if broke.
      hireBookingManager: () =>
        set((state) => {
          const cost = nextBookingManagerCost(state.hiredManagers);
          if (state.money < cost || state.maxRosterSize >= state.allBands.length) {
            return {};
          }
          return {
            money: state.money - cost,
            hiredManagers: state.hiredManagers + 1,
            maxRosterSize: state.maxRosterSize + 1,
          };
        }),

      updateBand: (bandId, updates) =>
        set((state) => ({
          allBands: state.allBands.map((band) =>
            band.id === bandId ? { ...band, ...updates } : band,
          ),
        })),

      // Show actions
      // Booking a show is the single canonical entry point. It registers the
      // show with the ShowPromotionSystem — the execution + promotion owner that
      // the Promo tab reads and that TurnResolutionEngine runs each turn — AND
      // mirrors it into `scheduledShows` for reactive display (nav badges, map
      // markers) and for completeShow's payout lookup. Both lists are cleared
      // together when the show resolves. Without the promotion-system
      // registration the booked show would sit here forever and never execute.
      // turnsInAdvance is clamped to the system's 1-5 window so registration
      // can never silently fail and strand an unrunnable show in the display list.
      scheduleShow: (show, turnsInAdvance = 3) => {
        const turns = Math.max(1, Math.min(5, Math.round(turnsInAdvance)));

        // Hold a deposit at booking so the player can't book more shows than they
        // can afford against one balance (refunded when the show resolves; the full
        // cost is charged at execution). The deposit = venue rent + a slice of any
        // BIG act's fee (small local acts book on a handshake). Full band fees are
        // still charged on show day — the deposit is a cash-flow commitment, not an
        // extra charge (it's refunded at resolution, same as the rent hold).
        const venue = get().venues.find((v) => v.id === show.venueId);
        const rentDeposit = venue ? Math.max(0, venue.rent) : 0;
        const bookingState = get();
        const bandDepositSum = (show.lineup ?? [show.bandId]).reduce((sum, id) => {
          const b = bookingState.allBands.find((x) => x.id === id);
          return b ? sum + bandDeposit(b.popularity, bookingState.rosterBandIds.includes(b.id)) : sum;
        }, 0);
        const deposit = rentDeposit + bandDepositSum;
        // Store the amount ACTUALLY debited (after the MIN_MONEY clamp) as the
        // deposit, so the resolve-time refund can't over-credit a near-broke
        // player whose debit was clamped short of the full rent.
        const currentMoney = get().money;
        const actualDeposit =
          currentMoney - clamp(currentMoney - deposit, CONSTRAINTS.MIN_MONEY, CONSTRAINTS.MAX_MONEY);
        // Absolute turn this plays on, so the UI can show a reactive countdown
        // (scheduledTurn - currentRound) without polling the promotion singleton.
        const bookedShow = { ...show, bookingDeposit: actualDeposit, scheduledTurn: get().currentRound + turns };

        showPromotionSystem.scheduleShow(bookedShow, turns);

        // Import dynamically to avoid circular dependency
        import('@/game/systems/CityGrowthManager').then(({ cityGrowthManager }) => {
          cityGrowthManager.recordShowBooked();
        });

        set((state) => ({
          money: clamp(
            state.money - deposit,
            CONSTRAINTS.MIN_MONEY,
            CONSTRAINTS.MAX_MONEY,
          ),
          scheduledShows: [
            ...state.scheduledShows.slice(-199), // Keep last 200 shows
            bookedShow,
          ],
        }));

        // Capture the singleton snapshot so this booking survives a refresh
        // (the show now lives in the in-memory promotion Map).
        import('@game/persistence/runtimeSnapshot').then(
          ({ captureRuntimeSnapshot }) => {
            set({ runtimeSnapshot: captureRuntimeSnapshot() });
          },
        );
      },

      // Cancel every booked-but-unplayed show, refunding each booking deposit.
      // Used when the player leaves town (you can't play a show in a city you've
      // toured away from) — clears both the promotion Map and the display list.
      cancelAllScheduledShows: () =>
        set((state) => {
          let refund = 0;
          state.scheduledShows.forEach((s) => {
            refund += s.bookingDeposit ?? 0;
            showPromotionSystem.cancelShow(s.id);
          });
          import('@game/persistence/runtimeSnapshot').then(
            ({ captureRuntimeSnapshot }) => {
              set({ runtimeSnapshot: captureRuntimeSnapshot() });
            },
          );
          return {
            money: clamp(
              state.money + refund,
              CONSTRAINTS.MIN_MONEY,
              CONSTRAINTS.MAX_MONEY,
            ),
            scheduledShows: [],
          };
        }),

      completeShow: (showId, result) =>
        set((state) => {
          const show = state.scheduledShows.find((s) => s.id === showId);
          if (!show) return state;

          // Apply district modifiers if available
          const finalResult = result;
          // District bonuses are already applied in the result

          // Bank GROSS revenue unconditionally (?? not ||): a zero-revenue
          // show must add 0, NOT fall through to financials.profit (which is
          // negative once costs exist) — the engine deducts costs separately.
          // Route every resource through the same clamps the addX actions use
          // so reputation/connections can't exceed [0,100] etc.
          const repDelta =
            finalResult.reputationGain ?? result.reputationChange ?? 0;
          return {
            scheduledShows: state.scheduledShows.filter((s) => s.id !== showId),
            showHistory: [
              ...state.showHistory,
              { ...show, status: "COMPLETED" },
            ],
            money: clamp(
              state.money + (finalResult.revenue ?? 0),
              CONSTRAINTS.MIN_MONEY,
              CONSTRAINTS.MAX_MONEY,
            ),
            fans: clamp(
              state.fans + (finalResult.fansGained || 0),
              CONSTRAINTS.MIN_FANS,
              CONSTRAINTS.MAX_FANS,
            ),
            reputation: clamp(
              state.reputation + repDelta,
              CONSTRAINTS.MIN_REPUTATION,
              CONSTRAINTS.MAX_REPUTATION,
            ),
            stress: clamp(
              state.stress + (finalResult.stressGain || 0),
              CONSTRAINTS.MIN_STRESS,
              CONSTRAINTS.MAX_STRESS,
            ),
            connections: clamp(
              state.connections + (finalResult.connectionsGain || 0),
              CONSTRAINTS.MIN_CONNECTIONS,
              CONSTRAINTS.MAX_CONNECTIONS,
            ),
            lastTurnResults: [finalResult],
          };
        }),

      // Faction actions
      setFactionEvent: (event) => set({ currentFactionEvent: event }),
      setFactionStandings: (standings) => set({ factionStandings: standings }),

      applyFactionChoice: (eventId, choiceId) => {
        const effects = factionSystem.applyEventChoice(eventId, choiceId);
        if (effects) {
          // Apply resource changes
          if (effects.resourceChanges) {
            const state = get();
            if (effects.resourceChanges.money) {
              state.addMoney(effects.resourceChanges.money);
            }
            if (effects.resourceChanges.reputation) {
              state.addReputation(effects.resourceChanges.reputation);
            }
            if (effects.resourceChanges.stress) {
              state.addStress(effects.resourceChanges.stress);
            }
            if (effects.resourceChanges.connections) {
              state.addConnections(effects.resourceChanges.connections);
            }
          }
        }
        set({ currentFactionEvent: null });
      },

      // Discovery actions
      discoverSynergy: (synergyId) =>
        set((state) => ({
          discoveredSynergies: state.discoveredSynergies.includes(synergyId)
            ? state.discoveredSynergies
            : [...state.discoveredSynergies, synergyId],
        })),

      setPendingSynergyOffer: (offer) => set({ pendingSynergyOffer: offer }),

      setPendingEventCard: (card) => set({ pendingEventCard: card }),

      // Resolve the player's choice on the pending event card: translate the
      // EventCardSystem result into real store mutations (resources, band/venue
      // stats, combo discoveries, and the sell-out diyPoints fork), then clear.
      applyEventCardChoice: (choiceId) => {
        const card = get().pendingEventCard;
        if (!card) return;
        const result = eventCardSystem.applyEventChoice(card, choiceId, {
          turn: get().currentRound,
        });
        const s = get();

        const rc = result.resourceChanges;
        if (rc.money) s.addMoney(rc.money);
        if (rc.reputation) s.addReputation(rc.reputation);
        if (rc.fans) s.addFans(rc.fans);
        if (rc.stress) s.addStress(rc.stress);
        if (rc.connections) s.addConnections(rc.connections);

        // Stat changes, target-aware. Bands only have popularity/authenticity/
        // energy/technicalSkill (a stat `stress` routes to the player; `capacity`
        // belongs to venues). All values clamped to sane bounds.
        const bandKeys = ['popularity', 'authenticity', 'energy', 'technicalSkill'] as const;
        result.modifiedCards.forEach(({ target, modifications }) => {
          if (target === 'all_bands' || target === 'random_band') {
            const pool = target === 'random_band' && s.allBands.length
              ? [s.allBands[Math.floor(Math.random() * s.allBands.length)]]
              : s.allBands;
            pool.forEach((b) => {
              const updates: Partial<Band> = {};
              bandKeys.forEach((k) => {
                const delta = modifications[k];
                if (delta !== undefined) updates[k] = clamp((b[k] ?? 0) + delta, 0, 100);
              });
              if (Object.keys(updates).length) s.updateBand(b.id, updates);
            });
            if (modifications.stress) s.addStress(modifications.stress);
          } else if (target === 'all_venues' || target === 'random_venue') {
            // A crisis event's capacity hit (e.g. police_crackdown) is a single-turn
            // EFFECTIVE penalty read at show resolution — never written into base
            // venue capacity — so repeat crises can't compound a venue down to 0 /
            // unbookable. Cleared once the turn resolves; positive deltas pay it back
            // down. (All authored capacity events target all_venues.)
            if (modifications.capacity !== undefined) {
              const capDelta = modifications.capacity;
              set((state) => ({
                eventCapacityPenalty: Math.max(0, state.eventCapacityPenalty - capDelta),
              }));
            }
          }
        });

        result.triggeredSynergies.forEach((id) => s.discoverSynergy(id));
        result.sceneChanges.forEach((sc) => {
          if (sc.exposure === 'high' || sc.exposure === 'mainstream') s.makePathChoice('event_exposure', -10);
          else if (sc.exposure === 'underground') s.makePathChoice('event_exposure', 10);
        });

        // Faction-flavored choices shift where the player stands with the scene's
        // tribes — the persisted factionStandings the show engine reads each turn.
        if (Object.keys(result.factionChanges).length) {
          set((state) => {
            const next = { ...state.factionStandings };
            Object.entries(result.factionChanges).forEach(([fid, v]) => {
              next[fid] = clamp((next[fid] ?? 0) + v, -100, 100);
            });
            return { factionStandings: next };
          });
        }

        // The marquee sell-out vs stay-true fork moves the Living City axis.
        if (choiceId === 'sell_out') s.makePathChoice('event_sellout', -30);
        else if (choiceId === 'stay_true') s.makePathChoice('event_staytrue', 20);

        set({ pendingEventCard: null });
      },

      hasSynergyDiscovered: (synergyId) => {
        const state = get();
        return state.discoveredSynergies.includes(synergyId);
      },

      // Festival actions
      completeFestival: (festivalId, result) =>
        set((state) => ({
          completedFestivals: [...state.completedFestivals, festivalId],
          festivalHistory: [
            ...state.festivalHistory.slice(-99), // Keep last 100 entries
            { festivalId, result, date: new Date() },
          ],
          money: state.money + (result.revenue || 0),
          reputation: state.reputation + (result.reputationGain || 0),
          fans: state.fans + (result.fansGained || 0),
          connections: state.connections + (result.connectionsGain || 0),
        })),

      hasFestivalCompleted: (festivalId) => {
        const state = get();
        return state.completedFestivals.includes(festivalId);
      },

      // District actions
      updateDistrictGentrification: (districtId, changes) =>
        set((state) => ({
          districts: state.districts.map((district) =>
            district.id === districtId ? { ...district, ...changes } : district,
          ),
        })),

      // Path actions
      makePathChoice: (choiceId, diyPointsChange) =>
        set((state) => {
          const newDiyPoints = state.diyPoints + diyPointsChange;
          const newAlignment =
            newDiyPoints >= 100
              ? "PURE_DIY"
              : newDiyPoints >= 25
                ? "DIY_LEANING"
                : newDiyPoints >= -25
                  ? "BALANCED"
                  : newDiyPoints >= -100
                    ? "CORPORATE_LEANING"
                    : "FULL_SELLOUT";

          return {
            pathChoices: [...state.pathChoices, choiceId],
            diyPoints: newDiyPoints,
            pathAlignment: newAlignment,
          };
        }),

      updatePathAlignment: () =>
        set((state) => {
          const newAlignment =
            state.diyPoints >= 100
              ? "PURE_DIY"
              : state.diyPoints >= 25
                ? "DIY_LEANING"
                : state.diyPoints >= -25
                  ? "BALANCED"
                  : state.diyPoints >= -100
                    ? "CORPORATE_LEANING"
                    : "FULL_SELLOUT";
          return { pathAlignment: newAlignment };
        }),

      // Lazy loading implementations
      loadAllBands: () =>
        set((state) => {
          // Only load if not already loaded
          if (state.allBands.length < initialBands.length) {
            return { allBands: initialBands };
          }
          return state;
        }),

      loadAllVenues: () =>
        set((state) => {
          // Only load if not already loaded
          if (state.venues.length < initialVenues.length) {
            return { venues: initialVenues };
          }
          return state;
        }),
    }),
    {
      name: "diy-indie-empire-storage", // unique name for localStorage key
      storage: createJSONStorage(() => safeZustandStorage), // use safe localStorage wrapper
      partialize: (state) => ({
        // Only persist essential game state, not UI state
        money: state.money,
        reputation: state.reputation,
        peakReputation: state.peakReputation,
        fans: state.fans,
        stress: state.stress,
        connections: state.connections,
        currentRound: state.currentRound,
        phase: state.phase,
        difficulty: state.difficulty,
        districts: state.districts,
        venues: state.venues,
        cities: state.cities,
        currentCityId: state.currentCityId,
        allBands: state.allBands,
        rosterBandIds: state.rosterBandIds,
        maxRosterSize: state.maxRosterSize,
        hiredManagers: state.hiredManagers,
        rosterSlotSources: state.rosterSlotSources,
        scheduledShows: state.scheduledShows,
        showHistory: state.showHistory,
        consecutiveBrokeTurns: state.consecutiveBrokeTurns,
        runtimeSnapshot: state.runtimeSnapshot,
        discoveredSynergies: state.discoveredSynergies,
        runObjectives: state.runObjectives,
        completedFestivals: state.completedFestivals,
        festivalHistory: state.festivalHistory,
        diyPoints: state.diyPoints,
        pathChoices: state.pathChoices,
        pathAlignment: state.pathAlignment,
        factionStandings: state.factionStandings,
        // Persisted so a mid-turn save/load (after a crisis event fires, before its
        // turn resolves) keeps the pending one-turn venue penalty.
        eventCapacityPenalty: state.eventCapacityPenalty,
        // Don't persist: walkers, lastTurnResults, currentFactionEvent (transient state)
      }),
      // On page refresh, rebuild the run's in-memory singletons from the
      // persisted snapshot so a resumed run keeps its win conditions, banked
      // fame, booked shows, and loss state instead of silently resetting.
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Saves written before the roster slot cap won't have maxRosterSize.
        // Default it (startNewRun recomputes from modifiers); never trim the
        // restored roster — the cap only gates NEW signs, not earned bands.
        if (typeof state.maxRosterSize !== "number" || state.maxRosterSize < ROSTER_SLOT_FLOOR) {
          state.maxRosterSize = BASE_ROSTER_SLOTS;
        }
        if (typeof state.hiredManagers !== "number") state.hiredManagers = 0;
        // Old saves predate the venue ladder; seed peak from current rep.
        if (typeof state.peakReputation !== "number") {
          state.peakReputation = state.reputation ?? 0;
        }
        // Old saves lack the slot-source snapshot; attribute the whole run-start
        // cap to "base" so the breakdown still sums to maxRosterSize.
        if (!state.rosterSlotSources || typeof state.rosterSlotSources.base !== "number") {
          state.rosterSlotSources = {
            base: state.maxRosterSize - state.hiredManagers,
            mode: 0,
            meta: 0,
            city: 0,
          };
        }

        // Reconcile the persisted city roster against the current data file: a
        // save may have been written with an older/smaller roster (or older
        // names), so rebuild from CITIES — taking fresh names/colors/venues but
        // preserving each district's gentrification drift (scene/gent/police/
        // rent) so a mid-run save keeps its progress. Drop a currentCityId that
        // points at a city no longer in the roster.
        reconcileCitiesAgainstData(state);

        // Bands are persisted in `allBands`, so likewise refresh their authored
        // content (names/bios/genre/traits) from the data file while keeping
        // run-mutated stats — otherwise an in-progress save shows stale band
        // names/bios after a content patch (this is what just bit the roster).
        // Imported lazily (keeps the roster out of the initial bundle); the .then
        // runs after the store is committed, so setState here re-renders the views.
        import("../data/initialBands")
          .then(({ initialBands: authoredBands }) => {
            useGameStore.setState((s) => {
              const draft = { allBands: s.allBands };
              reconcileBandsAgainstData(draft, authoredBands);
              return draft;
            });
          })
          .catch(() => {
            // Offline/chunk-load failure: keep the persisted roster as-is rather
            // than crash the resume. Names refresh on the next successful load.
          });

        // One-time prune of dangling band/venue references orphaned by a
        // data-file patch since this save was written. Runs on every refresh
        // but is a no-op when everything resolves.
        const prune = () => {
          // Mutate the rehydrated state in place — at this point it isn't
          // committed to the live store yet, so set()/get() aren't usable here.
          const cleaned = pruneDanglingReferences({
            allBands: state.allBands,
            venues: state.venues,
            scheduledShows: state.scheduledShows,
            rosterBandIds: state.rosterBandIds,
          });
          state.scheduledShows = cleaned.scheduledShows;
          state.rosterBandIds = cleaned.rosterBandIds;
        };

        if (!state.runtimeSnapshot) {
          // No snapshot to restore; the promotion Map is empty, so only the
          // store slices need pruning.
          prune();
          return;
        }
        import('@game/persistence/runtimeSnapshot').then(
          ({ restoreRuntimeSnapshot }) => {
            restoreRuntimeSnapshot(state.runtimeSnapshot);
            // Prune AFTER the snapshot repopulates the promotion Map, so
            // dangling shows are dropped from the live Map too (not just the
            // store's display list).
            prune();
          },
        );
      },
    },
  ),
);

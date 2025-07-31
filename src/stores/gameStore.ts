import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GamePhase,
  Difficulty,
  FactionEvent,
  District,
  Venue,
  Walker,
  VenueType,
  Band,
  Genre,
  TraitType,
  Show,
  ShowResult,
} from "@game/types";
import { safeZustandStorage } from "@utils/safeZustandStorage";
import { factionSystem } from "@game/mechanics/FactionSystem";
import { VENUE_TRAITS } from "@game/data/venueTraits";
import { SATIRICAL_VENUE_DESCRIPTIONS } from "@game/data/satiricalText";
import { gameAudio } from "@utils/gameAudio";
import { clamp, CONSTRAINTS } from "@utils/validation";
import { performanceMetrics } from "@utils/performanceMetrics";

// Lazy load initial data
let initialDataPromise: Promise<{ bands: Band[], venues: Venue[] }> | null = null;
const loadInitialData = async () => {
  if (!initialDataPromise) {
    initialDataPromise = performanceMetrics.trackLazyLoad('initial-game-data', async () => {
      const [bandsModule, venuesModule] = await Promise.all([
        performanceMetrics.trackLazyLoad('initial-bands', () => import("../data/initialBands")),
        performanceMetrics.trackLazyLoad('initial-venues', () => import("../data/initialVenues"))
      ]);
      
      return {
        bands: bandsModule.initialBands,
        venues: venuesModule.initialVenues
      };
    }) as Promise<{ bands: Band[], venues: Venue[] }>;
  }
  return initialDataPromise;
};

interface GameStore {
  // Game state
  money: number;
  reputation: number;
  fans: number;
  stress: number;
  connections: number;
  currentRound: number;
  phase: GamePhase;
  difficulty: Difficulty;

  // City state
  districts: District[];
  venues: Venue[];
  walkers: Walker[];

  // Band state
  allBands: Band[];
  rosterBandIds: string[];

  // Show state
  scheduledShows: Show[];
  showHistory: Show[];
  lastTurnResults: ShowResult[];

  // Faction state
  currentFactionEvent: FactionEvent | null;

  // Discovery state
  discoveredSynergies: string[]; // List of discovered synergy IDs

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

  // City actions
  updateDistricts: (districts: District[]) => void;
  updateVenues: (venues: Venue[]) => void;
  updateWalkers: (walkers: Walker[]) => void;
  addVenue: (venue: Venue) => void;

  // Band actions
  addBandToRoster: (bandId: string) => void;
  removeBandFromRoster: (bandId: string) => void;
  updateBand: (bandId: string, updates: Partial<Band>) => void;

  // Show actions
  scheduleShow: (show: Show) => void;
  completeShow: (showId: string, result: ShowResult) => void;

  // Faction actions
  setFactionEvent: (event: FactionEvent | null) => void;
  applyFactionChoice: (eventId: string, choiceId: string) => void;

  // Discovery actions
  discoverSynergy: (synergyId: string) => void;
  hasSynergyDiscovered: (synergyId: string) => boolean;

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

// Initial districts for the city
const initialDistricts: District[] = [
  {
    id: "eastside",
    name: "Eastside",
    sceneStrength: 80,
    gentrificationLevel: 30,
    policePresence: 20,
    rentMultiplier: 1,
    bounds: { x: 0, y: 0, width: 4, height: 4 },
    color: "#ec4899",
  },
  {
    id: "downtown",
    name: "Downtown",
    sceneStrength: 60,
    gentrificationLevel: 70,
    policePresence: 50,
    rentMultiplier: 1.5,
    bounds: { x: 4, y: 0, width: 4, height: 4 },
    color: "#3b82f6",
  },
  {
    id: "industrial",
    name: "Industrial",
    sceneStrength: 70,
    gentrificationLevel: 20,
    policePresence: 60,
    rentMultiplier: 0.8,
    bounds: { x: 0, y: 4, width: 4, height: 4 },
    color: "#10b981",
  },
  {
    id: "university",
    name: "University",
    sceneStrength: 50,
    gentrificationLevel: 40,
    policePresence: 30,
    rentMultiplier: 1.2,
    bounds: { x: 4, y: 4, width: 4, height: 4 },
    color: "#f59e0b",
  },
];

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
    name: "Basement Dwellers",
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
    name: "Death Magnetic",
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
    name: "Riot Grrrl Revival",
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
    name: "Blackened Skies",
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
    name: "The Mosh Pit Kids",
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
    name: "Void Screams",
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
    name: "Suburban Revolt",
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
    name: "Crust Lords",
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

// Lazy initialization function
const getInitialState = () => ({
  currentRound: 1,
  reputation: 0,
  money: 200, // Starting money - barely enough for 1-2 small shows
  fans: 0,
  stress: 0,
  connections: 0,
  phase: GamePhase.MENU,
  difficulty: Difficulty.NORMAL,
  currentFactionEvent: null,
  districts: initialDistricts,
  venues: [], // Will be loaded lazily
  walkers: [],
  allBands: [], // Will be loaded lazily
  rosterBandIds: [], // Will be populated after bands load
  scheduledShows: [],
  showHistory: [],
  lastTurnResults: [],
  discoveredSynergies: [],
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
        set({
          allBands: bands.slice(0, 5), // Start with first 5 bands
          venues: venues.slice(0, 3), // Start with first 3 venues
          rosterBandIds: bands.slice(0, 3).map(b => b.id), // First 3 bands in roster
        });
      },

      // City actions
      updateDistricts: (districts) => set({ districts }),
      updateVenues: (venues) => set({ venues }),
      updateWalkers: (walkers) => set({ walkers }),
      addVenue: (venue) =>
        set((state) => ({ venues: [...state.venues, venue] })),

      // Band actions
      addBandToRoster: (bandId) =>
        set((state) => ({
          rosterBandIds: [...state.rosterBandIds, bandId],
        })),

      removeBandFromRoster: (bandId) =>
        set((state) => ({
          rosterBandIds: state.rosterBandIds.filter((id) => id !== bandId),
        })),

      updateBand: (bandId, updates) =>
        set((state) => ({
          allBands: state.allBands.map((band) =>
            band.id === bandId ? { ...band, ...updates } : band,
          ),
        })),

      // Show actions
      scheduleShow: (show) =>
        set((state) => ({
          scheduledShows: [
            ...state.scheduledShows.slice(-199), // Keep last 200 shows
            show
          ],
        })),

      completeShow: (showId, result) =>
        set((state) => {
          const show = state.scheduledShows.find((s) => s.id === showId);
          if (!show) return state;

          // Apply district modifiers if available
          const finalResult = result;
          // District bonuses are already applied in the result

          return {
            scheduledShows: state.scheduledShows.filter((s) => s.id !== showId),
            showHistory: [
              ...state.showHistory,
              { ...show, status: "COMPLETED" },
            ],
            money:
              state.money +
              (finalResult.revenue || result.financials?.profit || 0),
            fans: state.fans + (finalResult.fansGained || 0),
            reputation:
              state.reputation +
              (finalResult.reputationGain || result.reputationChange || 0),
            stress: Math.min(100, state.stress + (finalResult.stressGain || 0)),
            connections: state.connections + (finalResult.connectionsGain || 0),
            lastTurnResults: [finalResult],
          };
        }),

      // Faction actions
      setFactionEvent: (event) => set({ currentFactionEvent: event }),

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
        fans: state.fans,
        stress: state.stress,
        connections: state.connections,
        currentRound: state.currentRound,
        phase: state.phase,
        difficulty: state.difficulty,
        districts: state.districts,
        venues: state.venues,
        allBands: state.allBands,
        rosterBandIds: state.rosterBandIds,
        scheduledShows: state.scheduledShows,
        showHistory: state.showHistory,
        discoveredSynergies: state.discoveredSynergies,
        completedFestivals: state.completedFestivals,
        festivalHistory: state.festivalHistory,
        diyPoints: state.diyPoints,
        pathChoices: state.pathChoices,
        pathAlignment: state.pathAlignment,
        // Don't persist: walkers, lastTurnResults, currentFactionEvent (transient state)
      }),
    },
  ),
);

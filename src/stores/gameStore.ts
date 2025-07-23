import { create } from 'zustand';
import { GamePhase, Difficulty, FactionEvent, District, Venue, Walker, VenueType, Band, Genre, TraitType, Show, ShowResult } from '@game/types';
import { factionSystem } from '@game/mechanics/FactionSystem';
import { VENUE_TRAITS, DEFAULT_VENUE_TRAITS } from '@game/data/venueTraits';

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
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  addMoney: (amount: number) => void;
  addFans: (amount: number) => void;
  addReputation: (amount: number) => void;
  addStress: (amount: number) => void;
  addConnections: (amount: number) => void;
  nextRound: () => void;
  resetGame: () => void;
  
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
}

// Initial districts for the city
const initialDistricts: District[] = [
  {
    id: 'eastside',
    name: 'Eastside',
    sceneStrength: 80,
    gentrificationLevel: 30,
    policePresence: 20,
    rentMultiplier: 1,
    bounds: { x: 0, y: 0, width: 4, height: 4 },
    color: '#ec4899'
  },
  {
    id: 'downtown',
    name: 'Downtown',
    sceneStrength: 60,
    gentrificationLevel: 70,
    policePresence: 50,
    rentMultiplier: 1.5,
    bounds: { x: 4, y: 0, width: 4, height: 4 },
    color: '#3b82f6'
  },
  {
    id: 'industrial',
    name: 'Industrial',
    sceneStrength: 70,
    gentrificationLevel: 20,
    policePresence: 60,
    rentMultiplier: 0.8,
    bounds: { x: 0, y: 4, width: 4, height: 4 },
    color: '#10b981'
  },
  {
    id: 'university',
    name: 'University',
    sceneStrength: 50,
    gentrificationLevel: 40,
    policePresence: 30,
    rentMultiplier: 1.2,
    bounds: { x: 4, y: 4, width: 4, height: 4 },
    color: '#f59e0b'
  }
];

// Initial venues for the city
const initialVenues: Venue[] = [
  {
    id: 'v1',
    name: "Jake's Basement",
    type: VenueType.BASEMENT,
    capacity: 30,
    acoustics: 45,
    authenticity: 100,
    atmosphere: 85,
    modifiers: [],
    traits: [
      VENUE_TRAITS.GRIMY_FLOORS,
      VENUE_TRAITS.INTIMATE_SETTING
    ].filter(Boolean),
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
    upgrades: []
  },
  {
    id: 'v2',
    name: 'The Broken Bottle',
    type: VenueType.DIVE_BAR,
    capacity: 80,
    acoustics: 60,
    authenticity: 75,
    atmosphere: 70,
    modifiers: [],
    traits: [
      VENUE_TRAITS.GRIMY_FLOORS,
      VENUE_TRAITS.SCENE_HANGOUT
    ].filter(Boolean),
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
    upgrades: []
  },
  {
    id: 'v3',
    name: 'Warehouse 23',
    type: VenueType.WAREHOUSE,
    capacity: 150,
    acoustics: 50,
    authenticity: 90,
    atmosphere: 95,
    modifiers: [],
    traits: [
      VENUE_TRAITS.CUSTOM_ACOUSTICS,
      VENUE_TRAITS.POLICE_MAGNET
    ].filter(Boolean),
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
    upgrades: []
  },
  {
    id: 'v4',
    name: "Sarah's Garage",
    type: VenueType.GARAGE,
    capacity: 45,
    acoustics: 40,
    authenticity: 95,
    atmosphere: 80,
    modifiers: [],
    traits: [
      VENUE_TRAITS.BLOWN_SPEAKERS,
      VENUE_TRAITS.INTIMATE_SETTING
    ].filter(Boolean),
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
    upgrades: []
  },
  {
    id: 'v5',
    name: 'DIY Space 101',
    type: VenueType.DIY_SPACE,
    capacity: 100,
    acoustics: 55,
    authenticity: 85,
    atmosphere: 90,
    modifiers: [],
    traits: [
      VENUE_TRAITS.ARTIST_FRIENDLY,
      VENUE_TRAITS.BOOKING_COLLECTIVE
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
    upgrades: []
  },
  {
    id: 'v6',
    name: 'The Pit',
    type: VenueType.UNDERGROUND,
    capacity: 120,
    acoustics: 65,
    authenticity: 100,
    atmosphere: 100,
    modifiers: [],
    traits: [
      VENUE_TRAITS.LEGENDARY_GRAFFITI,
      VENUE_TRAITS.CURSED_STAGE
    ].filter(Boolean),
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
    upgrades: []
  }
];

// Initial bands for the game
const initialBands: Band[] = [
  {
    id: 'b1',
    name: 'Basement Dwellers',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['hardcore punk', 'noise'],
    popularity: 15,
    authenticity: 95,
    energy: 85,
    technicalSkill: 60,
    traits: [
      { id: 't1', name: 'DIY Ethics', description: 'True to the scene', type: TraitType.PERSONALITY, modifier: { authenticity: 10 } },
      { id: 't2', name: 'Chaotic Live Shows', description: 'Unpredictable energy', type: TraitType.PERFORMANCE, modifier: { popularity: 5 } },
    ],
    technicalRequirements: [],
    hometown: 'Portland, OR',
    formedYear: 2021,
  },
  {
    id: 'b2',
    name: 'Death Magnetic',
    isRealArtist: true,
    artistId: 'real-1',
    genre: Genre.METAL,
    subgenres: ['doom', 'sludge'],
    popularity: 45,
    authenticity: 75,
    energy: 70,
    technicalSkill: 85,
    traits: [
      { id: 't3', name: 'Technical Masters', description: 'Incredible musicianship', type: TraitType.TECHNICAL, modifier: { popularity: 10 } },
      { id: 't4', name: 'Scene Veterans', description: '10+ years in the game', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    bio: 'Crushing riffs and existential dread since 2013.',
    hometown: 'Seattle, WA',
  },
  {
    id: 'b3',
    name: 'Riot Grrrl Revival',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['riot grrrl', 'feminist punk'],
    popularity: 35,
    authenticity: 90,
    energy: 95,
    technicalSkill: 50,
    traits: [
      { id: 't5', name: 'Political Message', description: 'Strong social commentary', type: TraitType.PERSONALITY, modifier: { authenticity: 15 } },
      { id: 't6', name: 'All Ages Champion', description: 'Supports young fans', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Olympia, WA',
    formedYear: 2022,
  },
  {
    id: 'b4',
    name: 'Blackened Skies',
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ['black metal', 'atmospheric'],
    popularity: 25,
    authenticity: 85,
    energy: 60,
    technicalSkill: 90,
    traits: [
      { id: 't7', name: 'Corpse Paint', description: 'Traditional black metal aesthetic', type: TraitType.PERFORMANCE, modifier: { energy: 10 } },
      { id: 't8', name: 'Underground Legends', description: 'Never sold out', type: TraitType.SOCIAL, modifier: { authenticity: 20 } },
    ],
    technicalRequirements: [],
    hometown: 'Oslo, Norway',
    formedYear: 2019,
  },
  {
    id: 'b5',
    name: 'The Mosh Pit Kids',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['hardcore', 'youth crew'],
    popularity: 55,
    authenticity: 70,
    energy: 100,
    technicalSkill: 65,
    traits: [
      { id: 't9', name: 'Circle Pit Masters', description: 'Gets the crowd moving', type: TraitType.PERFORMANCE, modifier: { energy: 15 } },
      { id: 't10', name: 'Straight Edge', description: 'No drugs or alcohol', type: TraitType.PERSONALITY, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Boston, MA',
    formedYear: 2020,
  },
  {
    id: 'b6',
    name: 'Void Screams',
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ['death metal', 'technical'],
    popularity: 40,
    authenticity: 80,
    energy: 75,
    technicalSkill: 95,
    traits: [
      { id: 't11', name: 'Blast Beat Specialists', description: 'Lightning fast drumming', type: TraitType.TECHNICAL, modifier: { technicalSkill: 10 } },
      { id: 't12', name: 'Gear Nerds', description: 'Obsessed with equipment', type: TraitType.PERSONALITY, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Tampa, FL',
    formedYear: 2018,
  },
  {
    id: 'b7',
    name: 'Suburban Revolt',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['pop punk', 'skate punk'],
    popularity: 65,
    authenticity: 60,
    energy: 85,
    technicalSkill: 70,
    traits: [
      { id: 't13', name: 'Catchy Hooks', description: 'Memorable choruses', type: TraitType.PERFORMANCE, modifier: { popularity: 15 } },
      { id: 't14', name: 'Skater Friendly', description: 'Popular with the skate scene', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'San Diego, CA',
    formedYear: 2021,
  },
  {
    id: 'b8',
    name: 'Crust Lords',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['crust punk', 'd-beat'],
    popularity: 30,
    authenticity: 95,
    energy: 90,
    technicalSkill: 55,
    traits: [
      { id: 't15', name: 'Anti-Establishment', description: 'No compromise politics', type: TraitType.PERSONALITY, modifier: { authenticity: 20 } },
      { id: 't16', name: 'DIY or Die', description: 'Self-releases only', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Minneapolis, MN',
    formedYear: 2019,
  },
  {
    id: 'b9',
    name: 'Throne of Thorns',
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ['progressive metal', 'djent'],
    popularity: 50,
    authenticity: 65,
    energy: 65,
    technicalSkill: 100,
    traits: [
      { id: 't17', name: 'Polyrhythmic Masters', description: 'Complex time signatures', type: TraitType.TECHNICAL, modifier: { technicalSkill: 15 } },
      { id: 't18', name: 'Studio Perfectionists', description: 'Incredible production quality', type: TraitType.PERFORMANCE, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Austin, TX',
    formedYear: 2017,
  },
  {
    id: 'b10',
    name: 'The Rejects',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['street punk', 'oi!'],
    popularity: 45,
    authenticity: 85,
    energy: 95,
    technicalSkill: 60,
    traits: [
      { id: 't19', name: 'Working Class Heroes', description: 'Blue collar anthems', type: TraitType.PERSONALITY, modifier: { authenticity: 10 } },
      { id: 't20', name: 'Pub Rock Masters', description: 'Perfect for dive bars', type: TraitType.PERFORMANCE, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Philadelphia, PA',
    formedYear: 2020,
  },
];

const initialState = {
  currentRound: 1,
  reputation: 0,
  money: 500, // Starting money - enough for 3-4 shows and some buffer
  fans: 0,
  stress: 0,
  connections: 0,
  phase: GamePhase.MENU,
  difficulty: Difficulty.NORMAL,
  currentFactionEvent: null,
  districts: initialDistricts,
  venues: initialVenues,
  walkers: [],
  allBands: initialBands,
  rosterBandIds: ['b1', 'b2', 'b3'], // Start with first 3 bands in roster
  scheduledShows: [],
  showHistory: [],
  lastTurnResults: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setPhase: (phase) => set({ phase }),
  
  addMoney: (amount) => 
    set((state) => ({ money: Math.max(0, state.money + amount) })),
  
  addFans: (amount) => 
    set((state) => ({ fans: Math.max(0, state.fans + amount) })),
  
  addReputation: (amount) => 
    set((state) => ({ reputation: Math.max(0, state.reputation + amount) })),
    
  addStress: (amount) =>
    set((state) => ({ stress: Math.max(0, Math.min(100, state.stress + amount)) })),
    
  addConnections: (amount) =>
    set((state) => ({ connections: Math.max(0, state.connections + amount) })),
  
  nextRound: () => 
    set((state) => ({ 
      currentRound: state.currentRound + 1,
      phase: GamePhase.PLANNING 
    })),
  
  resetGame: () => set(initialState),
  
  // City actions
  updateDistricts: (districts) => set({ districts }),
  updateVenues: (venues) => set({ venues }),
  updateWalkers: (walkers) => set({ walkers }),
  addVenue: (venue) => set((state) => ({ venues: [...state.venues, venue] })),
  
  // Band actions
  addBandToRoster: (bandId) => set((state) => ({
    rosterBandIds: [...state.rosterBandIds, bandId]
  })),
  
  removeBandFromRoster: (bandId) => set((state) => ({
    rosterBandIds: state.rosterBandIds.filter(id => id !== bandId)
  })),
  
  updateBand: (bandId, updates) => set((state) => ({
    allBands: state.allBands.map(band => 
      band.id === bandId ? { ...band, ...updates } : band
    )
  })),
  
  // Show actions
  scheduleShow: (show) => set((state) => ({
    scheduledShows: [...state.scheduledShows, show]
  })),
  
  completeShow: (showId, result) => set((state) => {
    const show = state.scheduledShows.find(s => s.id === showId);
    if (!show) return state;
    
    return {
      scheduledShows: state.scheduledShows.filter(s => s.id !== showId),
      showHistory: [...state.showHistory, { ...show, status: 'COMPLETED' }],
      money: state.money + result.financials.profit,
      fans: state.fans + result.fansGained,
      reputation: state.reputation + result.reputationChange
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
  }
}));
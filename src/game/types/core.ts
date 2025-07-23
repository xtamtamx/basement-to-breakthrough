// Core type definitions - The "Game Bible" for Basement to Breakthrough

// ============= Artist Integration Types =============
export interface ArtistSocialMedia {
  spotify?: string;
  bandcamp?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

export interface AudioSample {
  id: string;
  url: string;
  duration: number; // seconds
  title: string;
  isPreview: boolean;
}

// ============= Band Types =============
export interface Band {
  id: string;
  name: string;
  isRealArtist: boolean; // Distinguishes real vs procedural
  artistId?: string; // Links to real artist data
  genre: Genre;
  subgenres: string[];
  traits: BandTrait[];
  popularity: number; // 0-100
  authenticity: number; // 0-100, affects scene cred
  energy: number; // 0-100, performance energy
  technicalSkill: number; // 0-100
  technicalRequirements: TechRequirement[];
  socialMedia?: ArtistSocialMedia; // For real artists
  musicSamples?: AudioSample[]; // Web Audio API integration
  bio?: string;
  imageUrl?: string;
  hometown?: string;
  formedYear?: number;
}

export enum Genre {
  PUNK = 'PUNK',
  METAL = 'METAL',
  HARDCORE = 'HARDCORE',
  GRUNGE = 'GRUNGE',
  INDIE = 'INDIE',
  EXPERIMENTAL = 'EXPERIMENTAL',
  NOISE = 'NOISE',
  DOOM = 'DOOM',
  SLUDGE = 'SLUDGE',
  POWERVIOLENCE = 'POWERVIOLENCE',
}

export interface BandTrait {
  id: string;
  name: string;
  description: string;
  type: TraitType;
  modifier: TraitModifier;
}

export enum TraitType {
  PERSONALITY = 'PERSONALITY',
  PERFORMANCE = 'PERFORMANCE',
  SOCIAL = 'SOCIAL',
  TECHNICAL = 'TECHNICAL',
}

export interface TraitModifier {
  popularity?: number;
  authenticity?: number;
  venueCompatibility?: VenueType[];
  synergyTags?: string[];
}

export interface TechRequirement {
  type: EquipmentType;
  minimumQuality: number; // 1-5
}

// ============= Venue Types =============
export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  capacity: number;
  acoustics: number; // 0-100
  authenticity: number; // 0-100, Basement = high, corporate = low
  atmosphere: number; // 0-100
  modifiers: VenueModifier[];
  traits: VenueTrait[];
  location: District;
  rent: number;
  equipment: Equipment[];
  allowsAllAges: boolean;
  hasBar: boolean; // Affects revenue model
  hasSecurity: boolean;
  hasStage?: boolean; // Affects performance quality
  isPermanent: boolean; // vs popup/temporary
  bookingDifficulty: number; // 1-10
  imageUrl?: string;
  gridPosition?: { x: number; y: number }; // Position on city grid
  upgrades?: VenueUpgrade[]; // List of upgrades applied
}

export enum VenueType {
  BASEMENT = 'BASEMENT',
  GARAGE = 'GARAGE',
  HOUSE_SHOW = 'HOUSE_SHOW',
  DIY_SPACE = 'DIY_SPACE',
  DIVE_BAR = 'DIVE_BAR',
  PUNK_CLUB = 'PUNK_CLUB',
  METAL_VENUE = 'METAL_VENUE',
  WAREHOUSE = 'WAREHOUSE',
  UNDERGROUND = 'UNDERGROUND',
  THEATER = 'THEATER',
  CONCERT_HALL = 'CONCERT_HALL',
  ARENA = 'ARENA',
  FESTIVAL_GROUNDS = 'FESTIVAL_GROUNDS',
}

export interface VenueModifier {
  id: string;
  name: string;
  type: ModifierType;
  effect: ModifierEffect;
}

export enum ModifierType {
  REPUTATION = 'REPUTATION',
  CAPACITY = 'CAPACITY',
  REVENUE = 'REVENUE',
  SCENE_POLITICS = 'SCENE_POLITICS',
}

export interface ModifierEffect {
  value: number;
  isPercentage: boolean;
  condition?: string;
}

// ============= Venue Traits & Upgrades =============
export interface VenueTrait {
  id: string;
  name: string;
  description: string;
  type: VenueTraitType;
  modifier?: {
    capacity?: number;
    acoustics?: number;
    authenticity?: number;
    atmosphere?: number;
    revenue?: number;
    reputation?: number;
  };
  synergyTags?: string[]; // Tags that interact with band traits
}

export enum VenueTraitType {
  ATMOSPHERE = 'ATMOSPHERE',
  TECHNICAL = 'TECHNICAL',
  SOCIAL = 'SOCIAL',
  LEGENDARY = 'LEGENDARY',
}

export interface VenueUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: VenueUpgradeType;
  requirements?: {
    minCapacity?: number;
    minReputation?: number;
    venueTypes?: VenueType[];
  };
  effects: {
    capacity?: number;
    acoustics?: number;
    authenticity?: number;
    atmosphere?: number;
    rent?: number;
    unlockTrait?: string; // Trait ID to unlock
  };
  tier: number; // 1-3
}

export enum VenueUpgradeType {
  SOUND_SYSTEM = 'SOUND_SYSTEM',
  CAPACITY = 'CAPACITY',
  AMENITIES = 'AMENITIES',
  SECURITY = 'SECURITY',
  SPECIAL = 'SPECIAL',
}

export interface District {
  id: string;
  name: string;
  sceneStrength: number; // 0-100
  gentrificationLevel: number; // 0-100
  policePresence: number; // 0-100
  rentMultiplier: number;
  bounds: { x: number; y: number; width: number; height: number }; // Grid bounds
  color: string; // Visual identifier
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  quality: number; // 1-5 stars
  condition: number; // 0-100%
  maintenanceCost: number;
  purchasePrice: number;
  rentalPrice: number;
  owned: boolean;
  effects: EquipmentEffects;
  requirements?: EquipmentRequirements;
}

export interface EquipmentEffects {
  capacityBonus?: number; // Percentage increase
  acousticsBonus?: number; // Flat bonus to venue acoustics
  atmosphereBonus?: number; // Flat bonus to venue atmosphere
  reputationMultiplier?: number; // Show reputation multiplier
  stressReduction?: number; // Reduces band stress
  incidentReduction?: number; // Reduces chance of technical failures
}

export interface EquipmentRequirements {
  venueType?: VenueType[]; // Can only be used in certain venues
  minCapacity?: number; // Minimum venue capacity needed
  powerRequirements?: number; // Electrical needs
  spaceRequirements?: number; // Physical space needed
}

export enum EquipmentType {
  PA_SYSTEM = 'PA_SYSTEM',
  LIGHTING = 'LIGHTING',
  STAGE = 'STAGE',
  BACKLINE = 'BACKLINE',
  RECORDING = 'RECORDING',
}

// ============= Venue Upgrade Types =============
export interface VenueUpgrade {
  id: string;
  name: string;
  description: string;
  type: UpgradeType;
  cost: number;
  duration: number; // Turns to complete
  effects: VenueUpgradeEffects;
  requirements?: VenueRequirements;
}

export enum UpgradeType {
  CAPACITY = 'CAPACITY',
  ACOUSTICS = 'ACOUSTICS',
  ATMOSPHERE = 'ATMOSPHERE',
  AMENITIES = 'AMENITIES',
  SECURITY = 'SECURITY',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}

export interface VenueUpgradeEffects {
  capacityIncrease?: number;
  acousticsIncrease?: number;
  atmosphereIncrease?: number;
  maintenanceCost?: number; // Ongoing cost
  unlockEquipment?: EquipmentType[]; // Enables certain equipment
}

export interface VenueRequirements {
  minReputation?: number;
  minConnections?: number;
  factionStanding?: { factionId: string; minStanding: number };
}

// ============= Touch Interaction Types =============
export interface TouchInteraction {
  type: TouchType;
  target: InteractionTarget;
  gesture?: GestureType;
  position: Position;
  timestamp: number;
}

export enum TouchType {
  TAP = 'TAP',
  DOUBLE_TAP = 'DOUBLE_TAP',
  LONG_PRESS = 'LONG_PRESS',
  SWIPE = 'SWIPE',
  DRAG = 'DRAG',
  PINCH = 'PINCH',
}

export enum InteractionTarget {
  BAND_CARD = 'BAND_CARD',
  VENUE_CARD = 'VENUE_CARD',
  UI_BUTTON = 'UI_BUTTON',
  GAME_BOARD = 'GAME_BOARD',
  MENU = 'MENU',
}

export interface GestureType {
  direction?: SwipeDirection;
  distance?: number;
  velocity?: number;
  scale?: number; // For pinch gestures
}

export enum SwipeDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Position {
  x: number;
  y: number;
}

// ============= Game State Types =============
export interface GameState {
  id: string;
  turn: number;
  phase: GamePhase;
  resources: Resources;
  currentVenue?: Venue;
  bookedShows: Show[];
  availableBands: Band[];
  sceneReputation: SceneReputation;
  unlockedContent: string[];
  achievements: Achievement[];
  settings: GameSettings;
}

export enum GamePhase {
  MENU = 'MENU',
  SETUP = 'SETUP',
  PLANNING = 'PLANNING',
  BOOKING = 'BOOKING',
  PROMOTION = 'PROMOTION',
  PERFORMANCE = 'PERFORMANCE',
  SHOW_NIGHT = 'SHOW_NIGHT',
  AFTERMATH = 'AFTERMATH',
  SCENE_POLITICS = 'SCENE_POLITICS',
  GAME_OVER = 'GAME_OVER',
}

export interface Resources {
  money: number;
  reputation: number;
  connections: number;
  stress: number; // Managing stress is part of the game
  fans: number; // Total fan count
}

export interface Show {
  id: string;
  bandId: string;
  venueId: string;
  date: Date;
  ticketPrice: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  actualAttendance?: number;
  revenue?: number;
  incidents?: Incident[];
  bill?: Bill; // Multiple bands in order
}

export interface Bill {
  headliner: string; // Band ID
  openers: string[]; // Band IDs in order (first opens first)
  dynamics: BillDynamics;
}

export interface BillDynamics {
  chemistryScore: number; // How well the bands work together
  dramaRisk: number; // Chance of band conflicts
  crowdAppeal: number; // Combined draw power
  sceneAlignment: number; // How well the bill fits the scene
}

export interface ShowResult {
  showId: string;
  success: boolean;
  attendance: number;
  revenue: number;
  reputationChange: number;
  fansGained: number;
  incidentOccurred: boolean;
  financials: {
    revenue: number;
    costs: number;
    profit: number;
  };
  incidents: Incident[];
  isSuccess: boolean;
  venueSynergies?: {
    name: string;
    description: string;
  }[];
}

export interface Incident {
  type: IncidentType;
  severity: number; // 1-10
  description: string;
  consequences: Consequence[];
}

export enum IncidentType {
  COPS_CALLED = 'COPS_CALLED',
  NOISE_COMPLAINT = 'NOISE_COMPLAINT',
  FIGHT = 'FIGHT',
  EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE',
  BAND_NO_SHOW = 'BAND_NO_SHOW',
  VENUE_DAMAGE = 'VENUE_DAMAGE',
}

export interface Consequence {
  type: ConsequenceType;
  value: number;
}

export enum ConsequenceType {
  MONEY_LOSS = 'MONEY_LOSS',
  REPUTATION_LOSS = 'REPUTATION_LOSS',
  VENUE_BANNED = 'VENUE_BANNED',
  SCENE_DRAMA = 'SCENE_DRAMA',
}

// ============= Scene Politics Types =============
export interface SceneReputation {
  overall: number; // 0-100
  factions: FactionReputation[];
  relationships: BandRelationship[];
}

export interface FactionReputation {
  factionId: string;
  name: string;
  reputation: number; // -100 to 100
  description: string;
}

export interface BandRelationship {
  bandId: string;
  relationship: number; // -100 to 100
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  type: string;
  description: string;
  impact: number;
  timestamp: number;
}

// ============= Progression Types =============
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: number; // timestamp
  progress: number; // 0-100
  reward?: Reward;
}

export interface Reward {
  type: RewardType;
  value: number | string;
  unlockId?: string;
}

export enum RewardType {
  MONEY = 'MONEY',
  REPUTATION = 'REPUTATION',
  UNLOCK_BAND = 'UNLOCK_BAND',
  UNLOCK_VENUE = 'UNLOCK_VENUE',
  UNLOCK_EQUIPMENT = 'UNLOCK_EQUIPMENT',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

// ============= Settings Types =============
export interface GameSettings {
  difficulty: Difficulty;
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  hapticFeedback: boolean;
  autoSave: boolean;
  performanceMode: PerformanceMode;
  accessibility: AccessibilitySettings;
}

export enum Difficulty {
  EASY = 'EASY', // Forgiving, good for learning
  NORMAL = 'NORMAL', // Balanced challenge
  HARD = 'HARD', // Tough but fair
  NIGHTMARE = 'NIGHTMARE', // For masochists
}

export enum PerformanceMode {
  BATTERY_SAVER = 'BATTERY_SAVER',
  BALANCED = 'BALANCED',
  HIGH_PERFORMANCE = 'HIGH_PERFORMANCE',
}

export interface AccessibilitySettings {
  colorblindMode: ColorblindMode;
  reduceMotion: boolean;
  largerTouchTargets: boolean;
  screenReaderOptimized: boolean;
}

export enum ColorblindMode {
  OFF = 'OFF',
  PROTANOPIA = 'PROTANOPIA',
  DEUTERANOPIA = 'DEUTERANOPIA',
  TRITANOPIA = 'TRITANOPIA',
}

// ============= Faction System Types =============
export interface Faction {
  id: string;
  name: string;
  description: string;
  values: FactionValues;
  modifiers: FactionModifiers;
  relationships: Map<string, number>; // faction id -> relationship (-100 to 100)
  memberBands: string[]; // band ids
  controlledVenues: string[]; // venue ids
  iconColor: string;
  traits: string[];
}

export interface FactionValues {
  authenticity: number; // How much they value authenticity
  technicalSkill: number; // How much they value skill
  popularity: number; // How much they value mainstream success
  tradition: number; // How much they value scene history
  innovation: number; // How much they value new ideas
}

export interface FactionModifiers {
  fanBonus: number; // Multiplier for fan gain
  reputationMultiplier: number; // Multiplier for reputation
  moneyModifier: number; // Modifier for ticket prices
  capacityBonus: number; // Bonus venue capacity
  dramaChance: number; // Chance of drama events
}

export interface FactionEvent {
  id: string;
  type: FactionEventType;
  factionId: string;
  title: string;
  description: string;
  choices: FactionChoice[];
  triggered: boolean;
}

export enum FactionEventType {
  CONFLICT = 'CONFLICT',
  ALLIANCE = 'ALLIANCE',
  TERRITORY = 'TERRITORY',
  IDEOLOGY = 'IDEOLOGY',
  DRAMA = 'DRAMA'
}

export interface FactionChoice {
  id: string;
  text: string;
  effects: FactionChoiceEffects;
}

export interface FactionChoiceEffects {
  factionChanges: Map<string, number>; // faction id -> reputation change
  resourceChanges?: Partial<Resources>;
  unlocks?: string[];
  consequences?: string[]; // event ids to trigger later
}

// ============= Artist Agreement Types =============
export interface ArtistAgreement {
  artistId: string;
  attribution: string;
  contentUsage: ContentUsageLevel;
  revenueShare: number; // 0 for most, small % for major contributors
  approvalRequired: boolean;
  updateRights: boolean;
  signedDate: number;
  expiryDate?: number;
}

export enum ContentUsageLevel {
  BASIC = 'BASIC', // Name, genre, basic traits
  STANDARD = 'STANDARD', // + Photos, bio, music samples
  PREMIUM = 'PREMIUM', // + Custom events, narrative content
  COLLABORATION = 'COLLABORATION', // + Input on mechanics, scene representation
}

// ============= Walker System Types =============
export interface Walker {
  id: string;
  type: WalkerType;
  name: string;
  x: number; // Current grid position
  y: number;
  targetX?: number; // Destination
  targetY?: number;
  path: { x: number; y: number }[]; // Path to follow
  speed: number; // Grid cells per second
  state: WalkerState;
  data?: any; // Type-specific data (band info, equipment, etc)
}

export enum WalkerType {
  MUSICIAN = 'MUSICIAN',
  FAN = 'FAN',
  PROMOTER = 'PROMOTER',
  EQUIPMENT_TECH = 'EQUIPMENT_TECH',
  POLICE = 'POLICE',
  GENTRIFIER = 'GENTRIFIER'
}

export enum WalkerState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  AT_VENUE = 'AT_VENUE',
  PERFORMING = 'PERFORMING',
  LEAVING = 'LEAVING'
}
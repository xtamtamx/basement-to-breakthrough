export enum EquipmentType {
  SOUND = 'SOUND',
  LIGHTING = 'LIGHTING',
  TRANSPORT = 'TRANSPORT',
  PROMOTION = 'PROMOTION',
  SECURITY = 'SECURITY',
  SPECIAL = 'SPECIAL',
}

export enum EquipmentRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

export interface EquipmentEffect {
  type: 'multiply' | 'add' | 'reduce' | 'prevent';
  target: 'attendance' | 'revenue' | 'reputation' | 'fans' | 'incidents' | 'stress';
  value: number;
  condition?: string; // e.g., "metal_bands", "small_venues", "rainy_night"
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  type: EquipmentType;
  rarity: EquipmentRarity;
  cost: number;
  effects: EquipmentEffect[];
  flavorText?: string;
  stackable: boolean;
  maxStacks?: number;
  unlockRequirement?: {
    reputation?: number;
    fans?: number;
    showsPlayed?: number;
  };
}

// Predefined equipment cards
export const EQUIPMENT_CATALOG: Equipment[] = [
  // SOUND Equipment
  {
    id: 'eq-pa-basic',
    name: 'Basic PA System',
    description: 'A decent sound system that gets the job done.',
    type: EquipmentType.SOUND,
    rarity: EquipmentRarity.COMMON,
    cost: 100,
    effects: [
      { type: 'multiply', target: 'attendance', value: 1.1 }
    ],
    flavorText: 'It\'s not much, but it\'s loud.',
    stackable: false,
  },
  {
    id: 'eq-pa-pro',
    name: 'Professional Sound Rig',
    description: 'Crystal clear sound that makes every band sound better.',
    type: EquipmentType.SOUND,
    rarity: EquipmentRarity.RARE,
    cost: 500,
    effects: [
      { type: 'multiply', target: 'attendance', value: 1.25 },
      { type: 'add', target: 'reputation', value: 5 }
    ],
    flavorText: 'Now we\'re talking!',
    stackable: false,
    unlockRequirement: { reputation: 50 },
  },

  // LIGHTING Equipment
  {
    id: 'eq-lights-basic',
    name: 'DIY Light Show',
    description: 'Christmas lights and strobes. Classic punk aesthetic.',
    type: EquipmentType.LIGHTING,
    rarity: EquipmentRarity.COMMON,
    cost: 50,
    effects: [
      { type: 'add', target: 'fans', value: 10 }
    ],
    flavorText: 'Seizure warning not included.',
    stackable: true,
    maxStacks: 3,
  },
  {
    id: 'eq-lights-fog',
    name: 'Fog Machine',
    description: 'Everything looks more mysterious in fog.',
    type: EquipmentType.LIGHTING,
    rarity: EquipmentRarity.UNCOMMON,
    cost: 150,
    effects: [
      { type: 'multiply', target: 'fans', value: 1.15 },
      { type: 'add', target: 'attendance', value: 20, condition: 'metal_bands' }
    ],
    flavorText: 'Can\'t see the stage? That\'s the point.',
    stackable: false,
  },

  // TRANSPORT Equipment
  {
    id: 'eq-van-rusty',
    name: 'Rusty Van',
    description: 'It runs... most of the time.',
    type: EquipmentType.TRANSPORT,
    rarity: EquipmentRarity.COMMON,
    cost: 200,
    effects: [
      { type: 'reduce', target: 'stress', value: 5 },
      { type: 'add', target: 'incidents', value: 0.1 } // 10% more incident chance
    ],
    flavorText: 'Held together by duct tape and dreams.',
    stackable: false,
  },
  {
    id: 'eq-van-tour',
    name: 'Tour Van',
    description: 'A reliable vehicle for serious touring.',
    type: EquipmentType.TRANSPORT,
    rarity: EquipmentRarity.RARE,
    cost: 800,
    effects: [
      { type: 'reduce', target: 'stress', value: 15 },
      { type: 'multiply', target: 'revenue', value: 1.1 },
      { type: 'reduce', target: 'incidents', value: 0.2 }
    ],
    flavorText: 'No more breakdowns on the highway!',
    stackable: false,
    unlockRequirement: { showsPlayed: 20 },
  },

  // PROMOTION Equipment
  {
    id: 'eq-flyers',
    name: 'DIY Flyers',
    description: 'Photocopied at the library. Wheat paste included.',
    type: EquipmentType.PROMOTION,
    rarity: EquipmentRarity.COMMON,
    cost: 25,
    effects: [
      { type: 'add', target: 'attendance', value: 15 }
    ],
    flavorText: 'Stick \'em everywhere!',
    stackable: true,
    maxStacks: 5,
  },
  {
    id: 'eq-social-media',
    name: 'Social Media Manager',
    description: 'Someone who actually knows how to use the internet.',
    type: EquipmentType.PROMOTION,
    rarity: EquipmentRarity.UNCOMMON,
    cost: 300,
    effects: [
      { type: 'multiply', target: 'attendance', value: 1.2 },
      { type: 'multiply', target: 'fans', value: 1.3 }
    ],
    flavorText: 'Going viral in the underground.',
    stackable: false,
  },

  // SECURITY Equipment
  {
    id: 'eq-security-friend',
    name: 'Big Friend',
    description: 'Your buddy who works out. Keeps things chill.',
    type: EquipmentType.SECURITY,
    rarity: EquipmentRarity.COMMON,
    cost: 50,
    effects: [
      { type: 'reduce', target: 'incidents', value: 0.15 }
    ],
    flavorText: 'Nobody messes with Big Mike.',
    stackable: true,
    maxStacks: 3,
  },
  {
    id: 'eq-security-pro',
    name: 'Professional Security',
    description: 'Experienced crew that knows the scene.',
    type: EquipmentType.SECURITY,
    rarity: EquipmentRarity.RARE,
    cost: 400,
    effects: [
      { type: 'reduce', target: 'incidents', value: 0.5 },
      { type: 'prevent', target: 'incidents', value: 1, condition: 'crowd_incident' }
    ],
    flavorText: 'Safe but not sterile.',
    stackable: false,
    unlockRequirement: { reputation: 40 },
  },

  // SPECIAL Equipment
  {
    id: 'eq-lucky-pick',
    name: 'Lucky Guitar Pick',
    description: 'Found at a legendary show. Brings good fortune.',
    type: EquipmentType.SPECIAL,
    rarity: EquipmentRarity.LEGENDARY,
    cost: 1000,
    effects: [
      { type: 'multiply', target: 'revenue', value: 1.5 },
      { type: 'multiply', target: 'reputation', value: 2 },
      { type: 'reduce', target: 'incidents', value: 0.9 }
    ],
    flavorText: 'Is that... is that from Lemmy?',
    stackable: false,
    unlockRequirement: { reputation: 100, fans: 1000 },
  },
  {
    id: 'eq-underground-map',
    name: 'Underground Scene Map',
    description: 'Secret venues and hidden connections.',
    type: EquipmentType.SPECIAL,
    rarity: EquipmentRarity.RARE,
    cost: 300,
    effects: [
      { type: 'multiply', target: 'reputation', value: 1.25 },
      { type: 'add', target: 'revenue', value: 100, condition: 'diy_space' }
    ],
    flavorText: 'X marks the spot.',
    stackable: false,
  },
  {
    id: 'eq-tape-recorder',
    name: 'Four-Track Recorder',
    description: 'Record demos between shows.',
    type: EquipmentType.SPECIAL,
    rarity: EquipmentRarity.UNCOMMON,
    cost: 250,
    effects: [
      { type: 'add', target: 'fans', value: 25 },
      { type: 'add', target: 'revenue', value: 50 }
    ],
    flavorText: 'Lo-fi or die.',
    stackable: false,
  },
];
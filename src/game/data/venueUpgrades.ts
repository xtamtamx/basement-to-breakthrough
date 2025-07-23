import { VenueUpgrade, VenueUpgradeType, VenueType } from '@game/types';

export const VENUE_UPGRADES: Record<string, VenueUpgrade> = {
  // Sound System Upgrades
  BASIC_PA: {
    id: 'BASIC_PA',
    name: 'Basic PA System',
    description: 'A decent sound system that gets the job done',
    cost: 200,
    type: VenueUpgradeType.SOUND_SYSTEM,
    tier: 1,
    effects: {
      acoustics: 15,
    },
  },
  
  PRO_SOUND_SYSTEM: {
    id: 'PRO_SOUND_SYSTEM',
    name: 'Professional Sound System',
    description: 'Top-tier audio equipment for crystal clear sound',
    cost: 800,
    type: VenueUpgradeType.SOUND_SYSTEM,
    tier: 2,
    requirements: {
      minCapacity: 100,
    },
    effects: {
      acoustics: 30,
      unlockTrait: 'PROFESSIONAL_PA',
    },
  },
  
  STUDIO_GRADE_SETUP: {
    id: 'STUDIO_GRADE_SETUP',
    name: 'Studio Grade Setup',
    description: 'Recording-quality sound system with mixing board',
    cost: 2000,
    type: VenueUpgradeType.SOUND_SYSTEM,
    tier: 3,
    requirements: {
      minCapacity: 200,
      minReputation: 50,
    },
    effects: {
      acoustics: 40,
      unlockTrait: 'RECORDING_CAPABILITY',
    },
  },
  
  // Capacity Upgrades
  KNOCK_OUT_WALL: {
    id: 'KNOCK_OUT_WALL',
    name: 'Knock Out Wall',
    description: 'Expand the space by removing non-load bearing walls',
    cost: 500,
    type: VenueUpgradeType.CAPACITY,
    tier: 1,
    requirements: {
      venueTypes: [VenueType.BASEMENT, VenueType.GARAGE, VenueType.DIY_SPACE],
    },
    effects: {
      capacity: 20,
      authenticity: -5,
    },
  },
  
  OUTDOOR_AREA: {
    id: 'OUTDOOR_AREA',
    name: 'Outdoor Area',
    description: 'Add an outdoor space for overflow crowds',
    cost: 1000,
    type: VenueUpgradeType.CAPACITY,
    tier: 2,
    requirements: {
      venueTypes: [VenueType.DIVE_BAR, VenueType.WAREHOUSE, VenueType.DIY_SPACE],
    },
    effects: {
      capacity: 50,
      atmosphere: 10,
    },
  },
  
  SECOND_STAGE: {
    id: 'SECOND_STAGE',
    name: 'Second Stage',
    description: 'Add a secondary performance area',
    cost: 3000,
    type: VenueUpgradeType.CAPACITY,
    tier: 3,
    requirements: {
      minCapacity: 300,
    },
    effects: {
      capacity: 100,
      revenue: 20,
    },
  },
  
  // Amenities Upgrades
  BEER_LICENSE: {
    id: 'BEER_LICENSE',
    name: 'Beer License',
    description: 'Legal permission to sell alcohol',
    cost: 300,
    type: VenueUpgradeType.AMENITIES,
    tier: 1,
    effects: {
      revenue: 25,
      authenticity: -10,
    },
  },
  
  CRAFT_BAR: {
    id: 'CRAFT_BAR',
    name: 'Craft Beer Bar',
    description: 'Upscale bar with local craft selections',
    cost: 1200,
    type: VenueUpgradeType.AMENITIES,
    tier: 2,
    requirements: {
      minReputation: 30,
    },
    effects: {
      revenue: 40,
      atmosphere: 15,
      authenticity: -15,
    },
  },
  
  GREEN_ROOM: {
    id: 'GREEN_ROOM',
    name: 'Green Room',
    description: 'Private space for bands to prepare',
    cost: 600,
    type: VenueUpgradeType.AMENITIES,
    tier: 2,
    effects: {
      reputation: 20,
      unlockTrait: 'ARTIST_FRIENDLY',
    },
  },
  
  // Security Upgrades
  BASIC_SECURITY: {
    id: 'BASIC_SECURITY',
    name: 'Basic Security',
    description: 'A couple of friends who help keep things calm',
    cost: 150,
    type: VenueUpgradeType.SECURITY,
    tier: 1,
    effects: {
      capacity: 10,
      authenticity: -5,
    },
  },
  
  PROFESSIONAL_SECURITY: {
    id: 'PROFESSIONAL_SECURITY',
    name: 'Professional Security',
    description: 'Licensed security team',
    cost: 500,
    type: VenueUpgradeType.SECURITY,
    tier: 2,
    requirements: {
      minCapacity: 150,
    },
    effects: {
      capacity: 30,
      authenticity: -20,
      rent: -10,
    },
  },
  
  // Special Upgrades
  UNDERGROUND_ENTRANCE: {
    id: 'UNDERGROUND_ENTRANCE',
    name: 'Underground Entrance',
    description: 'Secret entrance for when cops show up',
    cost: 400,
    type: VenueUpgradeType.SPECIAL,
    tier: 1,
    requirements: {
      venueTypes: [VenueType.BASEMENT, VenueType.WAREHOUSE, VenueType.UNDERGROUND],
    },
    effects: {
      authenticity: 25,
      unlockTrait: 'POLICE_MAGNET',
    },
  },
  
  HISTORIC_DESIGNATION: {
    id: 'HISTORIC_DESIGNATION',
    name: 'Historic Designation',
    description: 'Official recognition of cultural importance',
    cost: 1500,
    type: VenueUpgradeType.SPECIAL,
    tier: 3,
    requirements: {
      minReputation: 70,
    },
    effects: {
      rent: -30,
      reputation: 30,
      unlockTrait: 'HALLOWED_GROUND',
    },
  },
  
  ACOUSTIC_TREATMENT: {
    id: 'ACOUSTIC_TREATMENT',
    name: 'Acoustic Treatment',
    description: 'Professional soundproofing and acoustic panels',
    cost: 800,
    type: VenueUpgradeType.SPECIAL,
    tier: 2,
    effects: {
      acoustics: 20,
      atmosphere: 10,
      unlockTrait: 'CUSTOM_ACOUSTICS',
    },
  },
  
  LEGENDARY_STATUS: {
    id: 'LEGENDARY_STATUS',
    name: 'Legendary Status',
    description: 'This venue has become the stuff of legends',
    cost: 5000,
    type: VenueUpgradeType.SPECIAL,
    tier: 3,
    requirements: {
      minReputation: 90,
    },
    effects: {
      reputation: 50,
      revenue: 50,
      atmosphere: 40,
      unlockTrait: 'HALLOWED_GROUND',
    },
  },
};

// Venue type to available upgrades mapping
export const VENUE_UPGRADE_AVAILABILITY: Record<string, string[]> = {
  BASEMENT: ['BASIC_PA', 'KNOCK_OUT_WALL', 'BASIC_SECURITY', 'UNDERGROUND_ENTRANCE'],
  GARAGE: ['BASIC_PA', 'KNOCK_OUT_WALL', 'BEER_LICENSE'],
  DIY_SPACE: ['BASIC_PA', 'PRO_SOUND_SYSTEM', 'KNOCK_OUT_WALL', 'OUTDOOR_AREA', 'GREEN_ROOM'],
  DIVE_BAR: ['PRO_SOUND_SYSTEM', 'OUTDOOR_AREA', 'CRAFT_BAR', 'BASIC_SECURITY'],
  WAREHOUSE: ['PRO_SOUND_SYSTEM', 'OUTDOOR_AREA', 'UNDERGROUND_ENTRANCE', 'ACOUSTIC_TREATMENT'],
  UNDERGROUND: ['BASIC_PA', 'UNDERGROUND_ENTRANCE', 'LEGENDARY_STATUS'],
  PUNK_CLUB: ['PRO_SOUND_SYSTEM', 'STUDIO_GRADE_SETUP', 'CRAFT_BAR', 'PROFESSIONAL_SECURITY'],
  METAL_VENUE: ['PRO_SOUND_SYSTEM', 'STUDIO_GRADE_SETUP', 'SECOND_STAGE', 'PROFESSIONAL_SECURITY'],
};
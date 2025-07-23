import { VenueTrait, VenueTraitType } from '@game/types';

export const VENUE_TRAITS: Record<string, VenueTrait> = {
  // Atmosphere Traits
  GRIMY_FLOORS: {
    id: 'GRIMY_FLOORS',
    name: 'Grimy Floors',
    description: 'Years of spilled beer and sweat have created the perfect punk atmosphere',
    type: VenueTraitType.ATMOSPHERE,
    modifier: {
      authenticity: 15,
      atmosphere: 10,
      reputation: -5,
    },
    synergyTags: ['punk', 'hardcore', 'crust'],
  },
  
  LEGENDARY_GRAFFITI: {
    id: 'LEGENDARY_GRAFFITI',
    name: 'Legendary Graffiti',
    description: 'The walls tell stories of shows past',
    type: VenueTraitType.ATMOSPHERE,
    modifier: {
      authenticity: 20,
      atmosphere: 15,
    },
    synergyTags: ['underground', 'diy', 'punk'],
  },
  
  INTIMATE_SETTING: {
    id: 'INTIMATE_SETTING',
    name: 'Intimate Setting',
    description: 'Small space creates intense connection between bands and crowd',
    type: VenueTraitType.ATMOSPHERE,
    modifier: {
      atmosphere: 25,
      capacity: -20,
    },
    synergyTags: ['emotional', 'acoustic', 'experimental'],
  },
  
  SMOKE_MACHINE: {
    id: 'SMOKE_MACHINE',
    name: 'Smoke Machine',
    description: 'Creates that classic metal venue atmosphere',
    type: VenueTraitType.ATMOSPHERE,
    modifier: {
      atmosphere: 15,
    },
    synergyTags: ['metal', 'doom', 'gothic'],
  },
  
  // Technical Traits
  PROFESSIONAL_PA: {
    id: 'PROFESSIONAL_PA',
    name: 'Professional PA System',
    description: 'Crystal clear sound that makes every band sound better',
    type: VenueTraitType.TECHNICAL,
    modifier: {
      acoustics: 30,
      revenue: 10,
    },
    synergyTags: ['technical', 'progressive', 'professional'],
  },
  
  CUSTOM_ACOUSTICS: {
    id: 'CUSTOM_ACOUSTICS',
    name: 'Custom Acoustics',
    description: 'Professionally designed room acoustics',
    type: VenueTraitType.TECHNICAL,
    modifier: {
      acoustics: 25,
      atmosphere: 10,
    },
    synergyTags: ['jazz', 'experimental', 'technical'],
  },
  
  RECORDING_CAPABILITY: {
    id: 'RECORDING_CAPABILITY',
    name: 'Recording Capability',
    description: 'Built-in recording setup for live albums',
    type: VenueTraitType.TECHNICAL,
    modifier: {
      revenue: 20,
      reputation: 15,
    },
    synergyTags: ['professional', 'established'],
  },
  
  BLOWN_SPEAKERS: {
    id: 'BLOWN_SPEAKERS',
    name: 'Blown Speakers',
    description: 'The distortion adds character... right?',
    type: VenueTraitType.TECHNICAL,
    modifier: {
      acoustics: -20,
      authenticity: 10,
    },
    synergyTags: ['noise', 'punk', 'lofi'],
  },
  
  // Social Traits
  SCENE_HANGOUT: {
    id: 'SCENE_HANGOUT',
    name: 'Scene Hangout',
    description: 'Where the cool kids gather between shows',
    type: VenueTraitType.SOCIAL,
    modifier: {
      reputation: 20,
      atmosphere: 15,
    },
    synergyTags: ['scene', 'social', 'network'],
  },
  
  ARTIST_FRIENDLY: {
    id: 'ARTIST_FRIENDLY',
    name: 'Artist Friendly',
    description: 'Known for treating bands well',
    type: VenueTraitType.SOCIAL,
    modifier: {
      reputation: 25,
      revenue: -10,
    },
    synergyTags: ['diy', 'community', 'supportive'],
  },
  
  POLICE_MAGNET: {
    id: 'POLICE_MAGNET',
    name: 'Police Magnet',
    description: 'Cops always seem to show up here',
    type: VenueTraitType.SOCIAL,
    modifier: {
      capacity: -15,
      authenticity: 20,
    },
    synergyTags: ['dangerous', 'underground', 'rebel'],
  },
  
  BOOKING_COLLECTIVE: {
    id: 'BOOKING_COLLECTIVE',
    name: 'Booking Collective',
    description: 'Run by a collective of scene veterans',
    type: VenueTraitType.SOCIAL,
    modifier: {
      reputation: 15,
      authenticity: 20,
    },
    synergyTags: ['diy', 'community', 'collective'],
  },
  
  // Legendary Traits
  HALLOWED_GROUND: {
    id: 'HALLOWED_GROUND',
    name: 'Hallowed Ground',
    description: 'Legendary bands got their start here',
    type: VenueTraitType.LEGENDARY,
    modifier: {
      reputation: 40,
      atmosphere: 30,
      revenue: 25,
    },
    synergyTags: ['legendary', 'historic', 'pilgrimage'],
  },
  
  CURSED_STAGE: {
    id: 'CURSED_STAGE',
    name: 'Cursed Stage',
    description: 'Strange things happen during shows here',
    type: VenueTraitType.LEGENDARY,
    modifier: {
      atmosphere: 35,
      authenticity: 30,
      acoustics: -10,
    },
    synergyTags: ['occult', 'doom', 'black_metal'],
  },
  
  RIOT_HISTORY: {
    id: 'RIOT_HISTORY',
    name: 'Riot History',
    description: 'Site of the infamous \'89 punk riot',
    type: VenueTraitType.LEGENDARY,
    modifier: {
      authenticity: 40,
      reputation: 30,
      capacity: -10,
    },
    synergyTags: ['punk', 'hardcore', 'anarchist'],
  },
};

// Venue type to default traits mapping
export const DEFAULT_VENUE_TRAITS: Record<string, string[]> = {
  BASEMENT: ['GRIMY_FLOORS', 'INTIMATE_SETTING'],
  GARAGE: ['BLOWN_SPEAKERS', 'INTIMATE_SETTING'],
  DIVE_BAR: ['GRIMY_FLOORS', 'SCENE_HANGOUT'],
  WAREHOUSE: ['CUSTOM_ACOUSTICS', 'POLICE_MAGNET'],
  UNDERGROUND: ['LEGENDARY_GRAFFITI', 'CURSED_STAGE'],
  DIY_SPACE: ['ARTIST_FRIENDLY', 'BOOKING_COLLECTIVE'],
  PUNK_CLUB: ['PROFESSIONAL_PA', 'SCENE_HANGOUT'],
  METAL_VENUE: ['SMOKE_MACHINE', 'PROFESSIONAL_PA'],
};
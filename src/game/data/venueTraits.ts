import { VenueTrait, VenueTraitType } from '@game/types';

// Venue CHARACTER data. Traits are assigned per-room in initialVenues.ts and
// surfaced as flavor chips on booking surfaces. NOTE: each trait's `modifier`
// block is DISPLAY-ONLY lore — the ladder's hand-tuned venue stats already
// price these quirks in, so no system re-applies the numbers at runtime
// (wiring them up would double-count and force a balance re-sim).
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

// One-line room flavor for the Strong Island ladder, keyed by venue id
// (initialVenues.ts). Lives HERE, not in initialVenues.ts, because that module
// is lazy-loaded for code-splitting and booking UI needs these synchronously.
// Voice: warm curmudgeon, same register as the band bios — no real proper
// nouns, nothing grim.
export const VENUE_BLURBS: Record<string, string> = {
  'the-basement':
    'Low ceiling, lower stakes — the only room in town that never asks for a deposit.',
  'vfw-hall':
    'The vets unlock the hall at six, count heads from the doorway, and pretend to hate the music.',
  'the-rec-center':
    "Nobody's signed a waiver since '09. The folding chairs are load-bearing.",
  'mr-brewskis':
    "The floor's been sticky since before your headliner was born. The regulars call it heritage.",
  'ground-floor':
    'The stage is in the basement and the green room is a stairwell landing. The name is aspirational.',
  'metro-bowl-lanes':
    'The pin machines keep running during the set. Good drummers learn to play around them.',
  'looney-burro':
    'Everyone on the wall of photos got famous or broke up, usually both. The burro has seen it all.',
  'the-elks-lodge':
    "Cash only, questions never. The antler chandelier has witnessed things the minutes don't record.",
  'my-fathers-place':
    'The room that launched a hundred legends now hosts a brunch series. The acoustics forgive everything else.',
  'jones-beach':
    'The ocean breeze is complimentary. Everything else has a convenience fee.',
};
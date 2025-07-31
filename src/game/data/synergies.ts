// Synergy definitions for band/venue combinations

import { Band, Venue } from '@game/types';

export interface Synergy {
  id: string;
  name: string;
  description: string;
  requirements: {
    bandTraits?: string[];
    venueTraits?: string[];
    bandGenre?: string[];
    venueType?: string[];
    minPopularity?: number;
    minAuthenticity?: number;
  };
  effects: {
    popularityMultiplier?: number;
    authenticityMultiplier?: number;
    moneyMultiplier?: number;
    fansMultiplier?: number;
    stressReduction?: number;
  };
}

export const SYNERGIES: Synergy[] = [
  {
    id: 'basement_punks',
    name: 'Basement Punks',
    description: 'DIY bands thrive in basement shows',
    requirements: {
      bandTraits: ['DIY Ethics'],
      venueType: ['BASEMENT']
    },
    effects: {
      authenticityMultiplier: 1.5,
      fansMultiplier: 1.2
    }
  },
  {
    id: 'dive_bar_legends',
    name: 'Dive Bar Legends',
    description: 'Grimy venues love grimy bands',
    requirements: {
      venueTraits: ['GRIMY_FLOORS'],
      bandGenre: ['PUNK', 'HARDCORE']
    },
    effects: {
      popularityMultiplier: 1.3,
      moneyMultiplier: 1.2
    }
  },
  {
    id: 'technical_masters',
    name: 'Technical Masters',
    description: 'Technical bands impress in proper venues',
    requirements: {
      bandTraits: ['Technical Masters'],
      venueTraits: ['CUSTOM_ACOUSTICS']
    },
    effects: {
      popularityMultiplier: 1.4,
      authenticityMultiplier: 1.1
    }
  },
  {
    id: 'all_ages_champions',
    name: 'All Ages Champions',
    description: 'Youth-friendly bands pack youth-friendly venues',
    requirements: {
      bandTraits: ['All Ages Champion'],
      venueType: ['DIY_SPACE', 'BASEMENT', 'GARAGE']
    },
    effects: {
      fansMultiplier: 1.5,
      stressReduction: 10
    }
  },
  {
    id: 'underground_legends',
    name: 'Underground Legends',
    description: 'The most authentic bands in the most authentic venues',
    requirements: {
      bandTraits: ['Underground Legends'],
      venueType: ['UNDERGROUND'],
      minAuthenticity: 80
    },
    effects: {
      authenticityMultiplier: 2.0,
      popularityMultiplier: 1.3
    }
  },
  {
    id: 'corpse_paint_chaos',
    name: 'Corpse Paint Chaos',
    description: 'Black metal aesthetic terrifies and excites',
    requirements: {
      bandTraits: ['Corpse Paint'],
      venueType: ['WAREHOUSE', 'UNDERGROUND']
    },
    effects: {
      popularityMultiplier: 1.4,
      authenticityMultiplier: 1.3
    }
  },
  {
    id: 'scene_veterans_network',
    name: 'Scene Veterans Network',
    description: 'Veterans know how to work the scene',
    requirements: {
      bandTraits: ['Scene Veterans'],
      minPopularity: 40
    },
    effects: {
      moneyMultiplier: 1.4,
      popularityMultiplier: 1.2
    }
  },
  {
    id: 'political_message_movement',
    name: 'Political Message Movement',
    description: 'Political bands energize activist spaces',
    requirements: {
      bandTraits: ['Political Message'],
      venueTraits: ['BOOKING_COLLECTIVE', 'ARTIST_FRIENDLY']
    },
    effects: {
      authenticityMultiplier: 1.6,
      fansMultiplier: 1.3
    }
  },
  {
    id: 'circle_pit_masters',
    name: 'Circle Pit Masters',
    description: 'High energy bands create legendary pits',
    requirements: {
      bandTraits: ['Circle Pit Masters'],
      venueType: ['WAREHOUSE', 'DIY_SPACE'],
      minPopularity: 50
    },
    effects: {
      popularityMultiplier: 1.5,
      fansMultiplier: 1.4,
      stressReduction: -10 // Actually increases stress!
    }
  },
  {
    id: 'intimate_setting_magic',
    name: 'Intimate Setting Magic',
    description: 'Small venues create unforgettable experiences',
    requirements: {
      venueTraits: ['INTIMATE_SETTING'],
      bandGenre: ['INDIE', 'EXPERIMENTAL']
    },
    effects: {
      authenticityMultiplier: 1.4,
      fansMultiplier: 1.2
    }
  }
];

// Helper function to check if a synergy applies
export function checkSynergy(synergy: Synergy, band: Band, venue: Venue): boolean {
  const req = synergy.requirements;
  
  // Check band traits
  if (req.bandTraits?.length) {
    const hasTrait = req.bandTraits.some(trait => 
      band.traits?.some(t => t.name === trait)
    );
    if (!hasTrait) return false;
  }
  
  // Check venue traits
  if (req.venueTraits?.length) {
    const hasTrait = req.venueTraits.some(trait => 
      venue.traits?.some(t => t.id === trait)
    );
    if (!hasTrait) return false;
  }
  
  // Check band genre
  if (req.bandGenre?.length) {
    if (!req.bandGenre.includes(band.genre)) return false;
  }
  
  // Check venue type
  if (req.venueType?.length) {
    if (!req.venueType.includes(venue.type)) return false;
  }
  
  // Check popularity
  if (req.minPopularity !== undefined && band.popularity < req.minPopularity) {
    return false;
  }
  
  // Check authenticity
  if (req.minAuthenticity !== undefined && band.authenticity < req.minAuthenticity) {
    return false;
  }
  
  return true;
}
// Emergent cultural movements system - the scene evolves over time

import { Genre, Band, District } from '@game/types/core';

export interface CulturalMovement {
  id: string;
  name: string;
  description: string;
  primaryGenre: Genre;
  relatedGenres: Genre[];
  characteristics: string[];
  triggerConditions: {
    minTurn?: number;
    minSceneStrength?: number;
    minBandsOfGenre?: number;
    requiredGenreMix?: Genre[];
    districtConditions?: {
      type?: string;
      minGentrificationLevel?: number;
      maxGentrificationLevel?: number;
    };
  };
  effects: {
    bandPopularityModifier: Record<Genre, number>; // Multipliers by genre
    venueCapacityModifier: number;
    authenticityModifier: number;
    newBandChance: number; // Chance of new bands joining the scene
  };
  lifespan: number; // Turns the movement lasts
  peakTurn: number; // When the movement is strongest
}

export const CULTURAL_MOVEMENTS: CulturalMovement[] = [
  {
    id: 'revival_punk',
    name: 'Punk Revival',
    description: 'A return to raw, authentic punk rock',
    primaryGenre: Genre.PUNK,
    relatedGenres: [Genre.HARDCORE],
    characteristics: ['DIY Ethics', 'Raw Energy', 'Anti-Commercial'],
    triggerConditions: {
      minTurn: 10,
      minSceneStrength: 60,
      minBandsOfGenre: 5,
      districtConditions: {
        maxGentrificationLevel: 50
      }
    },
    effects: {
      bandPopularityModifier: {
        [Genre.PUNK]: 1.5,
        [Genre.HARDCORE]: 1.3,
        [Genre.INDIE]: 0.8,
        [Genre.METAL]: 1.0,
        [Genre.GRUNGE]: 1.1,
        [Genre.EXPERIMENTAL]: 1.0,
        [Genre.NOISE]: 1.0
      },
      venueCapacityModifier: 1.2,
      authenticityModifier: 1.4,
      newBandChance: 0.3
    },
    lifespan: 20,
    peakTurn: 10
  },
  {
    id: 'crossover_thrash',
    name: 'Crossover Thrash Movement',
    description: 'Punk and metal scenes merge',
    primaryGenre: Genre.METAL,
    relatedGenres: [Genre.PUNK, Genre.HARDCORE],
    characteristics: ['High Energy', 'Genre Blending', 'Mosh Pits'],
    triggerConditions: {
      minTurn: 15,
      minBandsOfGenre: 3,
      requiredGenreMix: [Genre.PUNK, Genre.METAL]
    },
    effects: {
      bandPopularityModifier: {
        [Genre.PUNK]: 1.2,
        [Genre.HARDCORE]: 1.4,
        [Genre.INDIE]: 0.9,
        [Genre.METAL]: 1.5,
        [Genre.GRUNGE]: 1.0,
        [Genre.EXPERIMENTAL]: 1.1,
        [Genre.NOISE]: 1.2
      },
      venueCapacityModifier: 1.3,
      authenticityModifier: 1.2,
      newBandChance: 0.4
    },
    lifespan: 25,
    peakTurn: 12
  },
  {
    id: 'noise_underground',
    name: 'Noise Underground',
    description: 'Experimental noise music takes over basements',
    primaryGenre: Genre.NOISE,
    relatedGenres: [Genre.EXPERIMENTAL],
    characteristics: ['Avant-Garde', 'Challenging', 'Underground'],
    triggerConditions: {
      minTurn: 20,
      minSceneStrength: 70,
      minBandsOfGenre: 4,
      districtConditions: {
        type: 'warehouse',
        minGentrificationLevel: 30
      }
    },
    effects: {
      bandPopularityModifier: {
        [Genre.PUNK]: 1.0,
        [Genre.HARDCORE]: 0.9,
        [Genre.INDIE]: 0.7,
        [Genre.METAL]: 1.1,
        [Genre.GRUNGE]: 0.8,
        [Genre.EXPERIMENTAL]: 1.6,
        [Genre.NOISE]: 1.8
      },
      venueCapacityModifier: 0.8, // Smaller, more intimate shows
      authenticityModifier: 1.6,
      newBandChance: 0.2
    },
    lifespan: 15,
    peakTurn: 8
  },
  {
    id: 'indie_explosion',
    name: 'Indie Explosion',
    description: 'Indie rock breaks into the mainstream',
    primaryGenre: Genre.INDIE,
    relatedGenres: [Genre.GRUNGE],
    characteristics: ['Melodic', 'Accessible', 'College Radio'],
    triggerConditions: {
      minTurn: 25,
      minBandsOfGenre: 6,
      districtConditions: {
        minGentrificationLevel: 50
      }
    },
    effects: {
      bandPopularityModifier: {
        [Genre.PUNK]: 0.9,
        [Genre.HARDCORE]: 0.8,
        [Genre.INDIE]: 1.8,
        [Genre.METAL]: 0.9,
        [Genre.GRUNGE]: 1.4,
        [Genre.EXPERIMENTAL]: 1.1,
        [Genre.NOISE]: 0.7
      },
      venueCapacityModifier: 1.5,
      authenticityModifier: 0.8, // Less authentic, more commercial
      newBandChance: 0.5
    },
    lifespan: 30,
    peakTurn: 15
  },
  {
    id: 'underground_resistance',
    name: 'Underground Resistance',
    description: 'All genres unite against gentrification',
    primaryGenre: Genre.PUNK, // Led by punk ethos
    relatedGenres: [Genre.HARDCORE, Genre.METAL, Genre.EXPERIMENTAL, Genre.NOISE],
    characteristics: ['Unity', 'Anti-Gentrification', 'Community'],
    triggerConditions: {
      minTurn: 30,
      minSceneStrength: 50,
      districtConditions: {
        minGentrificationLevel: 70
      }
    },
    effects: {
      bandPopularityModifier: {
        [Genre.PUNK]: 1.3,
        [Genre.HARDCORE]: 1.3,
        [Genre.INDIE]: 1.0,
        [Genre.METAL]: 1.3,
        [Genre.GRUNGE]: 1.2,
        [Genre.EXPERIMENTAL]: 1.3,
        [Genre.NOISE]: 1.3
      },
      venueCapacityModifier: 1.0,
      authenticityModifier: 1.5,
      newBandChance: 0.3
    },
    lifespan: 40,
    peakTurn: 20
  }
];

// Track active movements
export interface ActiveMovement {
  movement: CulturalMovement;
  startTurn: number;
  currentStrength: number; // 0-100
}

// Check if a cultural movement should emerge
export function checkCulturalMovements(
  currentTurn: number,
  bands: Band[],
  districts: District[],
  activeMovements: ActiveMovement[]
): CulturalMovement | null {
  
  for (const movement of CULTURAL_MOVEMENTS) {
    // Skip if already active
    if (activeMovements.find(am => am.movement.id === movement.id)) continue;
    
    const conditions = movement.triggerConditions;
    
    // Check turn requirement
    if (conditions.minTurn && currentTurn < conditions.minTurn) continue;
    
    // Check scene strength
    if (conditions.minSceneStrength) {
      const avgSceneStrength = districts.reduce((sum, d) => sum + d.sceneStrength, 0) / districts.length;
      if (avgSceneStrength < conditions.minSceneStrength) continue;
    }
    
    // Check bands of genre
    if (conditions.minBandsOfGenre) {
      const bandsOfGenre = bands.filter(b => b.genre === movement.primaryGenre).length;
      if (bandsOfGenre < conditions.minBandsOfGenre) continue;
    }
    
    // Check genre mix
    if (conditions.requiredGenreMix) {
      const presentGenres = new Set(bands.map(b => b.genre));
      const hasAllGenres = conditions.requiredGenreMix.every(g => presentGenres.has(g));
      if (!hasAllGenres) continue;
    }
    
    // Check district conditions
    if (conditions.districtConditions) {
      const dc = conditions.districtConditions;
      const matchingDistrict = districts.find(d => {
        if (dc.type && d.name.toLowerCase() !== dc.type) return false;
        if (dc.minGentrificationLevel && d.gentrificationLevel < dc.minGentrificationLevel) return false;
        if (dc.maxGentrificationLevel && d.gentrificationLevel > dc.maxGentrificationLevel) return false;
        return true;
      });
      if (!matchingDistrict) continue;
    }
    
    // All conditions met - chance to trigger
    if (Math.random() < 0.4) { // 40% chance when conditions are met
      return movement;
    }
  }
  
  return null;
}

// Calculate movement strength over time
export function calculateMovementStrength(
  movement: CulturalMovement,
  turnsActive: number
): number {
  if (turnsActive > movement.lifespan) return 0;
  
  // Bell curve peaking at peakTurn
  const peak = movement.peakTurn;
  const spread = movement.lifespan / 4;
  
  const strength = 100 * Math.exp(-Math.pow(turnsActive - peak, 2) / (2 * spread * spread));
  
  return Math.max(0, Math.min(100, strength));
}

// Apply movement effects to the scene
export function applyMovementEffects(
  bands: Band[],
  movement: CulturalMovement,
  strength: number
): Band[] {
  const strengthMultiplier = strength / 100;
  
  return bands.map(band => {
    const genreModifier = movement.effects.bandPopularityModifier[band.genre] || 1.0;
    const popularityChange = (genreModifier - 1) * strengthMultiplier * 10;
    
    return {
      ...band,
      popularity: Math.max(0, Math.min(100, band.popularity + popularityChange)),
      authenticity: Math.max(0, Math.min(100, 
        band.authenticity * (1 + (movement.effects.authenticityModifier - 1) * strengthMultiplier)
      ))
    };
  });
}

// Generate new bands during cultural movements
export function generateMovementBands(
  movement: CulturalMovement,
  strength: number,
  existingBandCount: number
): Partial<Band>[] {
  const newBands: Partial<Band>[] = [];
  const bandChance = movement.effects.newBandChance * (strength / 100);
  
  if (Math.random() < bandChance) {
    const genres = [movement.primaryGenre, ...movement.relatedGenres];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    
    newBands.push({
      name: generateMovementBandName(movement, genre),
      genre,
      traits: movement.characteristics.map(c => ({ 
        name: c, 
        description: `Emerged from ${movement.name}`,
        type: 'SCENE' as any
      })),
      popularity: 20 + Math.floor(Math.random() * 30),
      authenticity: 70 + Math.floor(Math.random() * 20),
      energy: 60 + Math.floor(Math.random() * 30),
      technicalSkill: 40 + Math.floor(Math.random() * 40)
    });
  }
  
  return newBands;
}

// Generate band names based on movement
function generateMovementBandName(movement: CulturalMovement, genre: Genre): string {
  const prefixes = {
    [Genre.PUNK]: ['The', 'Dead', 'Rotten', 'Street', 'City'],
    [Genre.METAL]: ['Black', 'Death', 'Iron', 'Steel', 'Blood'],
    [Genre.HARDCORE]: ['Youth', 'Minor', 'Negative', 'Bad', 'Sick'],
    [Genre.INDIE]: ['The', 'Sunny', 'Beach', 'Dream', 'Cloud'],
    [Genre.EXPERIMENTAL]: ['Post', 'Anti', 'Neo', 'Meta', 'Ultra'],
    [Genre.NOISE]: ['Static', 'Void', 'Null', 'Error', 'Glitch'],
    [Genre.GRUNGE]: ['Mud', 'Rain', 'Grey', 'Rust', 'Dirt']
  };
  
  const suffixes = {
    [Genre.PUNK]: ['Punks', 'Rats', 'Dogs', 'Kids', 'Rejects'],
    [Genre.METAL]: ['Throne', 'Hammer', 'Blade', 'Legion', 'Cult'],
    [Genre.HARDCORE]: ['Threat', 'Brigade', 'Front', 'Crew', 'Force'],
    [Genre.INDIE]: ['Days', 'Club', 'Society', 'Orchestra', 'Collective'],
    [Genre.EXPERIMENTAL]: ['Project', 'Experiment', 'Theory', 'Concept', 'System'],
    [Genre.NOISE]: ['Generator', 'Machine', 'Unit', 'Module', 'Array'],
    [Genre.GRUNGE]: ['Garden', 'Honey', 'Chain', 'Hole', 'Box']
  };
  
  const prefix = prefixes[genre]?.[Math.floor(Math.random() * prefixes[genre].length)] || 'The';
  const suffix = suffixes[genre]?.[Math.floor(Math.random() * suffixes[genre].length)] || 'Band';
  
  return `${prefix} ${suffix}`;
}
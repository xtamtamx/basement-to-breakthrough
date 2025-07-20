import { Band, Genre, TraitType } from '@game/types';
import { bandGenerator } from './BandGenerator';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export interface GenreFusion {
  id: string;
  name: string;
  description: string;
  parentGenres: [Genre, Genre];
  resultGenre: Genre;
  icon: string;
  requirements: FusionRequirement[];
  bonusTraits: string[];
  statModifiers: {
    popularity?: number;
    authenticity?: number;
    energy?: number;
    technicalSkill?: number;
  };
  flavorText: string;
}

export interface FusionRequirement {
  type: 'chemistry_score' | 'shows_together' | 'both_have_trait' | 'combined_skill' | 'scene_alignment';
  value: number | string;
  operator?: 'greater_than' | 'equals' | 'contains';
}

export interface FusionEvent {
  bands: [string, string]; // Band IDs
  fusion: GenreFusion;
  timestamp: number;
  resultingBandId?: string;
}

// Extended Genre enum for fusion genres
export enum FusionGenre {
  CROSSOVER_THRASH = 'CROSSOVER_THRASH',
  MELODIC_HARDCORE = 'MELODIC_HARDCORE',
  BLACKENED_CRUST = 'BLACKENED_CRUST',
  POST_HARDCORE = 'POST_HARDCORE',
  SLUDGE = 'SLUDGE',
  MATHCORE = 'MATHCORE',
  POWERVIOLENCE = 'POWERVIOLENCE',
  DARK_HARDCORE = 'DARK_HARDCORE'
}

class GenreFusionSystem {
  private fusions: Map<string, GenreFusion> = new Map();
  private fusionHistory: FusionEvent[] = [];
  private bandCollaborations: Map<string, Map<string, number>> = new Map(); // Track shows played together
  
  constructor() {
    this.initializeFusions();
  }
  
  private initializeFusions() {
    // Crossover Thrash (Metal + Punk)
    this.addFusion({
      id: 'crossover_thrash',
      name: 'Crossover Thrash',
      description: 'When metal meets punk, brutality ensues',
      parentGenres: [Genre.METAL, Genre.PUNK],
      resultGenre: Genre.HARDCORE, // Using existing genre, would be CROSSOVER_THRASH ideally
      icon: '⚡',
      requirements: [
        { type: 'chemistry_score', value: 70, operator: 'greater_than' },
        { type: 'shows_together', value: 3, operator: 'greater_than' }
      ],
      bonusTraits: ['Crossover Masters', 'Genre Benders'],
      statModifiers: {
        energy: 20,
        technicalSkill: 15,
        popularity: 10
      },
      flavorText: "Neither punk enough for the punks, nor metal enough for the metalheads - perfect!"
    });
    
    // Melodic Hardcore (Hardcore + Emo)
    this.addFusion({
      id: 'melodic_hardcore',
      name: 'Melodic Hardcore',
      description: 'Hardcore intensity with emotional depth',
      parentGenres: [Genre.HARDCORE, Genre.EMO],
      resultGenre: Genre.HARDCORE, // Would be MELODIC_HARDCORE
      icon: '💔',
      requirements: [
        { type: 'chemistry_score', value: 60, operator: 'greater_than' },
        { type: 'combined_skill', value: 140, operator: 'greater_than' }
      ],
      bonusTraits: ['Emotional Intensity', 'Melodic'],
      statModifiers: {
        technicalSkill: 20,
        authenticity: 15,
        energy: -10
      },
      flavorText: "For when you want to mosh AND cry"
    });
    
    // Blackened Crust (Black Metal + Crust Punk)
    this.addFusion({
      id: 'blackened_crust',
      name: 'Blackened Crust',
      description: 'The darkest, dirtiest sound imaginable',
      parentGenres: [Genre.BLACKMETAL, Genre.CRUST],
      resultGenre: Genre.BLACKMETAL, // Would be BLACKENED_CRUST
      icon: '🔥',
      requirements: [
        { type: 'both_have_trait', value: 'DIY' },
        { type: 'scene_alignment', value: 80, operator: 'greater_than' }
      ],
      bonusTraits: ['Apocalyptic', 'Anti-Everything'],
      statModifiers: {
        authenticity: 30,
        energy: 25,
        popularity: -20
      },
      flavorText: "The sound of civilization collapsing"
    });
    
    // Sludge (Metal + Doom)
    this.addFusion({
      id: 'sludge',
      name: 'Sludge',
      description: 'Slow, heavy, and absolutely crushing',
      parentGenres: [Genre.METAL, Genre.DOOM],
      resultGenre: Genre.DOOM, // Would be SLUDGE
      icon: '🌊',
      requirements: [
        { type: 'chemistry_score', value: 50, operator: 'greater_than' },
        { type: 'combined_skill', value: 120, operator: 'greater_than' }
      ],
      bonusTraits: ['Heavy', 'Crushing'],
      statModifiers: {
        energy: -20,
        technicalSkill: 25,
        authenticity: 20
      },
      flavorText: "Like being slowly buried in tar"
    });
    
    // Post-Hardcore (Hardcore + Indie)
    this.addFusion({
      id: 'post_hardcore',
      name: 'Post-Hardcore',
      description: 'Experimental hardcore with artistic ambitions',
      parentGenres: [Genre.HARDCORE, Genre.INDIE],
      resultGenre: Genre.INDIE, // Would be POST_HARDCORE
      icon: '🎨',
      requirements: [
        { type: 'chemistry_score', value: 65, operator: 'greater_than' },
        { type: 'both_have_trait', value: 'Experimental' }
      ],
      bonusTraits: ['Innovative', 'Artistic'],
      statModifiers: {
        technicalSkill: 30,
        popularity: 15,
        authenticity: -10
      },
      flavorText: "Too weird for radio, too accessible for the underground"
    });
  }
  
  private addFusion(fusion: GenreFusion) {
    this.fusions.set(fusion.id, fusion);
  }
  
  // Track bands playing together
  recordCollaboration(band1Id: string, band2Id: string) {
    if (!this.bandCollaborations.has(band1Id)) {
      this.bandCollaborations.set(band1Id, new Map());
    }
    if (!this.bandCollaborations.has(band2Id)) {
      this.bandCollaborations.set(band2Id, new Map());
    }
    
    const count1 = this.bandCollaborations.get(band1Id)!.get(band2Id) || 0;
    const count2 = this.bandCollaborations.get(band2Id)!.get(band1Id) || 0;
    
    this.bandCollaborations.get(band1Id)!.set(band2Id, count1 + 1);
    this.bandCollaborations.get(band2Id)!.set(band1Id, count2 + 1);
  }
  
  // Check if two bands can fuse genres
  checkFusionPossibility(band1: Band, band2: Band, chemistryScore: number, sceneAlignment: number): GenreFusion | null {
    // Check if bands have already fused
    const alreadyFused = this.fusionHistory.some(event => 
      (event.bands[0] === band1.id && event.bands[1] === band2.id) ||
      (event.bands[0] === band2.id && event.bands[1] === band1.id)
    );
    
    if (alreadyFused) return null;
    
    // Check all possible fusions
    for (const [id, fusion] of this.fusions) {
      // Check if genres match (in any order)
      const genresMatch = 
        (fusion.parentGenres[0] === band1.genre && fusion.parentGenres[1] === band2.genre) ||
        (fusion.parentGenres[0] === band2.genre && fusion.parentGenres[1] === band1.genre);
      
      if (!genresMatch) continue;
      
      // Check requirements
      const meetsRequirements = fusion.requirements.every(req => {
        switch (req.type) {
          case 'chemistry_score':
            return this.compareValue(chemistryScore, req.value as number, req.operator);
            
          case 'shows_together':
            const shows = this.getShowsTogether(band1.id, band2.id);
            return this.compareValue(shows, req.value as number, req.operator);
            
          case 'both_have_trait':
            const traitName = req.value as string;
            return band1.traits.some(t => t.name === traitName) && 
                   band2.traits.some(t => t.name === traitName);
                   
          case 'combined_skill':
            const combinedSkill = band1.technicalSkill + band2.technicalSkill;
            return this.compareValue(combinedSkill, req.value as number, req.operator);
            
          case 'scene_alignment':
            return this.compareValue(sceneAlignment, req.value as number, req.operator);
            
          default:
            return false;
        }
      });
      
      if (meetsRequirements) {
        return fusion;
      }
    }
    
    return null;
  }
  
  // Apply genre fusion to create a new band
  applyFusion(band1: Band, band2: Band, fusion: GenreFusion): Band {
    // Create a new "supergroup" band
    const fusedBand = bandGenerator.generateBand(
      Math.max(band1.popularity, band2.popularity) + 20, // Bonus popularity
      fusion.resultGenre
    );
    
    // Update band properties
    fusedBand.name = `${band1.name} × ${band2.name}`;
    fusedBand.genre = fusion.resultGenre;
    fusedBand.formedYear = new Date().getFullYear();
    
    // Apply stat modifiers
    if (fusion.statModifiers.popularity) {
      fusedBand.popularity = Math.min(100, fusedBand.popularity + fusion.statModifiers.popularity);
    }
    if (fusion.statModifiers.authenticity) {
      fusedBand.authenticity = Math.min(100, Math.max(0, fusedBand.authenticity + fusion.statModifiers.authenticity));
    }
    if (fusion.statModifiers.energy) {
      fusedBand.energy = Math.min(100, Math.max(0, fusedBand.energy + fusion.statModifiers.energy));
    }
    if (fusion.statModifiers.technicalSkill) {
      fusedBand.technicalSkill = Math.min(100, fusedBand.technicalSkill + fusion.statModifiers.technicalSkill);
    }
    
    // Add bonus traits
    fusion.bonusTraits.forEach(traitName => {
      fusedBand.traits.push({
        id: `trait-${Date.now()}-${Math.random()}`,
        name: traitName,
        type: TraitType.PERFORMANCE,
        description: `Gained through genre fusion`,
        effects: {}
      });
    });
    
    // Add fusion history trait
    fusedBand.traits.push({
      id: `trait-fusion-${Date.now()}`,
      name: fusion.name,
      type: TraitType.SPECIAL,
      description: fusion.description,
      effects: {}
    });
    
    // Record the fusion
    this.fusionHistory.push({
      bands: [band1.id, band2.id],
      fusion,
      timestamp: Date.now(),
      resultingBandId: fusedBand.id
    });
    
    // Effects
    haptics.heavy();
    audio.play('achievement');
    
    return fusedBand;
  }
  
  // Create a side project instead of replacing bands
  createSideProject(band1: Band, band2: Band, fusion: GenreFusion): Band {
    const sideProject = this.applyFusion(band1, band2, fusion);
    sideProject.name = `${band1.name.split(' ')[0]}/${band2.name.split(' ')[0]}`;
    
    // Side projects have slightly different stats
    sideProject.popularity = Math.floor((band1.popularity + band2.popularity) / 2);
    sideProject.energy = Math.min(100, sideProject.energy + 10); // Fresh energy
    
    // Add side project trait
    sideProject.traits.push({
      id: `trait-sideproject-${Date.now()}`,
      name: 'Side Project',
      type: TraitType.SPECIAL,
      description: 'A collaborative effort between established bands',
      effects: {}
    });
    
    return sideProject;
  }
  
  private getShowsTogether(band1Id: string, band2Id: string): number {
    if (!this.bandCollaborations.has(band1Id)) return 0;
    return this.bandCollaborations.get(band1Id)!.get(band2Id) || 0;
  }
  
  private compareValue(actual: number, expected: number, operator?: string): boolean {
    switch (operator) {
      case 'greater_than':
        return actual > expected;
      case 'equals':
      default:
        return actual === expected;
    }
  }
  
  // Get fusion history
  getFusionHistory(): FusionEvent[] {
    return this.fusionHistory;
  }
  
  // Get all available fusions
  getAllFusions(): GenreFusion[] {
    return Array.from(this.fusions.values());
  }
  
  // Check if a band is a fusion result
  isFusionBand(bandId: string): boolean {
    return this.fusionHistory.some(event => event.resultingBandId === bandId);
  }
  
  // Get parent bands of a fusion
  getFusionParents(bandId: string): [string, string] | null {
    const fusion = this.fusionHistory.find(event => event.resultingBandId === bandId);
    return fusion ? fusion.bands : null;
  }
}

export const genreFusionSystem = new GenreFusionSystem();
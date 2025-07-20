import { Band, Genre, Trait, TraitType } from '@game/types';
import { factionSystem } from './FactionSystem';

interface BandTemplate {
  namePatterns: string[];
  genreWeights: Record<Genre, number>;
  subgenres: Record<Genre, string[]>;
  traits: Trait[];
  statRanges: {
    popularity: [number, number];
    authenticity: [number, number];
    energy: [number, number];
    technicalSkill: [number, number];
  };
}

class BandGenerator {
  private nameComponents = {
    prefixes: [
      'The', 'Dead', 'Black', 'Blood', 'Dark', 'Iron', 'Steel', 'Savage',
      'Toxic', 'Nuclear', 'Electric', 'Burning', 'Frozen', 'Silent', 'Screaming',
      'Broken', 'Fallen', 'Rising', 'Crimson', 'Neon', 'Chaos', 'Urban', 'Street',
    ],
    nouns: [
      'Wolves', 'Ravens', 'Serpents', 'Dragons', 'Knights', 'Warriors', 'Rebels',
      'Prophets', 'Demons', 'Angels', 'Ghosts', 'Shadows', 'Flames', 'Thorns',
      'Roses', 'Daggers', 'Hammers', 'Chains', 'Skulls', 'Hearts', 'Souls',
      'Dreams', 'Nightmares', 'Legends', 'Outcasts', 'Sinners', 'Saints',
    ],
    suffixes: [
      'Cult', 'Legion', 'Brigade', 'Society', 'Collective', 'Syndicate',
      'Alliance', 'Empire', 'Kingdom', 'Ritual', 'Theory', 'Project',
      'Experience', 'Experiment', 'Movement', 'Revolution',
    ],
    singleWords: [
      'Voidwalker', 'Doomslayer', 'Hellraiser', 'Soulburner', 'Mindbreaker',
      'Deathwish', 'Killswitch', 'Overdrive', 'Breakdown', 'Blackout',
      'Riot', 'Anarchy', 'Mayhem', 'Havoc', 'Turmoil', 'Bedlam',
    ],
  };

  private cities = [
    'New York', 'Los Angeles', 'Chicago', 'Seattle', 'Portland', 'Austin',
    'Nashville', 'Detroit', 'Philadelphia', 'Boston', 'San Francisco',
    'Denver', 'Atlanta', 'Miami', 'Minneapolis', 'Cleveland', 'Pittsburgh',
    'Baltimore', 'Washington DC', 'Richmond', 'Charlotte', 'New Orleans',
  ];

  private traitPool: Trait[] = [
    // Personality Traits
    { id: 'trait_1', name: 'Stage Presence', description: 'Commands attention', type: TraitType.PERSONALITY, modifier: { popularity: 10 } },
    { id: 'trait_2', name: 'DIY Ethic', description: 'True to the underground', type: TraitType.PERSONALITY, modifier: { authenticity: 15 } },
    { id: 'trait_3', name: 'Controversial', description: 'Polarizing but memorable', type: TraitType.PERSONALITY, modifier: { popularity: 15, authenticity: -5 } },
    { id: 'trait_4', name: 'Mysterious', description: 'Nobody knows their real names', type: TraitType.PERSONALITY, modifier: { authenticity: 10 } },
    
    // Performance Traits
    { id: 'trait_5', name: 'High Energy', description: 'Non-stop intensity', type: TraitType.PERFORMANCE, modifier: { energy: 20 } },
    { id: 'trait_6', name: 'Theatrical', description: 'Puts on a show', type: TraitType.PERFORMANCE, modifier: { popularity: 10, energy: 10 } },
    { id: 'trait_7', name: 'Raw Power', description: 'Unfiltered aggression', type: TraitType.PERFORMANCE, modifier: { energy: 15, authenticity: 10 } },
    { id: 'trait_8', name: 'Crowd Interaction', description: 'Gets the pit moving', type: TraitType.PERFORMANCE, modifier: { energy: 10 } },
    
    // Technical Traits
    { id: 'trait_9', name: 'Virtuoso', description: 'Master musicians', type: TraitType.TECHNICAL, modifier: { technicalSkill: 25 } },
    { id: 'trait_10', name: 'Lo-Fi Sound', description: 'Intentionally rough', type: TraitType.TECHNICAL, modifier: { authenticity: 20, technicalSkill: -10 } },
    { id: 'trait_11', name: 'Progressive', description: 'Complex compositions', type: TraitType.TECHNICAL, modifier: { technicalSkill: 20 } },
    { id: 'trait_12', name: 'Minimalist', description: 'Less is more', type: TraitType.TECHNICAL, modifier: { authenticity: 15 } },
    
    // Social Traits
    { id: 'trait_13', name: 'Scene Veterans', description: 'Been around forever', type: TraitType.SOCIAL, modifier: { authenticity: 20 } },
    { id: 'trait_14', name: 'Rising Stars', description: 'The next big thing', type: TraitType.SOCIAL, modifier: { popularity: 20 } },
    { id: 'trait_15', name: 'Cult Following', description: 'Small but devoted fanbase', type: TraitType.SOCIAL, modifier: { authenticity: 15 } },
    { id: 'trait_16', name: 'Crossover Appeal', description: 'Brings in new fans', type: TraitType.SOCIAL, modifier: { popularity: 15 } },
  ];

  generateBand(difficulty: number = 1): Band {
    const genre = this.selectGenre();
    const subgenres = this.selectSubgenres(genre);
    const traits = this.selectTraits(2 + Math.floor(Math.random() * 2));
    const stats = this.generateStats(difficulty);
    
    const band: Band = {
      id: `band_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateBandName(),
      isRealArtist: false,
      genre,
      subgenres,
      popularity: stats.popularity,
      authenticity: stats.authenticity,
      energy: stats.energy,
      technicalSkill: stats.technicalSkill,
      traits,
      technicalRequirements: [],
      hometown: this.selectHometown(),
      formedYear: 2020 + Math.floor(Math.random() * 4),
      bio: this.generateBio(genre),
    };
    
    // Assign to faction
    const faction = factionSystem.assignBandToFaction(band);
    if (faction) {
      const factionData = factionSystem.getFaction(faction);
      if (factionData) {
        band.traits.push({
          id: `faction-${faction}`,
          name: `${factionData.name} Member`,
          description: `Aligned with ${factionData.name} values`,
          type: TraitType.SOCIAL,
          modifier: {}
        });
      }
    }
    
    return band;
  }

  private generateBandName(): string {
    const patterns = [
      () => `${this.random(this.nameComponents.prefixes)} ${this.random(this.nameComponents.nouns)}`,
      () => `${this.random(this.nameComponents.nouns)} ${this.random(this.nameComponents.suffixes)}`,
      () => this.random(this.nameComponents.singleWords),
      () => `${this.random(this.nameComponents.prefixes)} ${this.random(this.nameComponents.nouns)} ${this.random(this.nameComponents.suffixes)}`,
    ];

    return this.random(patterns)();
  }

  private selectGenre(): Genre {
    // Weight genres for variety
    const weights = {
      [Genre.PUNK]: 40,
      [Genre.METAL]: 40,
      [Genre.ELECTRONIC]: 10,
      [Genre.EXPERIMENTAL]: 10,
    };

    return this.weightedRandom(weights);
  }

  private selectSubgenres(genre: Genre): string[] {
    const subgenreMap: Record<Genre, string[]> = {
      [Genre.PUNK]: ['hardcore', 'crust', 'street punk', 'anarcho-punk', 'post-punk', 'skate punk'],
      [Genre.METAL]: ['thrash', 'death', 'black', 'doom', 'sludge', 'grindcore', 'crossover'],
      [Genre.ELECTRONIC]: ['industrial', 'darkwave', 'synthpunk', 'noise'],
      [Genre.EXPERIMENTAL]: ['avant-garde', 'art punk', 'math rock', 'no wave'],
    };

    const available = subgenreMap[genre] || [];
    const count = 1 + Math.floor(Math.random() * 2);
    return this.shuffle(available).slice(0, count);
  }

  private selectTraits(count: number): Trait[] {
    const shuffled = this.shuffle([...this.traitPool]);
    return shuffled.slice(0, count).map((trait, index) => ({
      ...trait,
      id: `${trait.id}_${Date.now()}_${index}`,
    }));
  }

  private generateStats(difficulty: number): {
    popularity: number;
    authenticity: number;
    energy: number;
    technicalSkill: number;
  } {
    // Higher difficulty = better stats on average
    const baseRange = [20, 60];
    const difficultyBonus = difficulty * 10;

    return {
      popularity: this.randomInRange(baseRange[0], baseRange[1]) + Math.floor(Math.random() * difficultyBonus),
      authenticity: this.randomInRange(40, 90) + Math.floor(Math.random() * 10),
      energy: this.randomInRange(50, 95),
      technicalSkill: this.randomInRange(30, 80) + Math.floor(Math.random() * difficultyBonus),
    };
  }

  private selectHometown(): string {
    return `${this.random(this.cities)}, ${this.random(['USA', 'USA', 'USA', 'Canada'])}`;
  }

  private generateBio(genre: Genre): string {
    const templates = {
      [Genre.PUNK]: [
        'Formed in the basement shows of {hometown}, bringing raw energy to every performance.',
        'DIY or die. No compromise, no surrender, just pure punk fury.',
        'Taking the underground by storm with their uncompromising sound.',
      ],
      [Genre.METAL]: [
        'Crushing riffs and brutal breakdowns define their devastating sound.',
        'Forged in the fires of the underground metal scene.',
        'Bringing darkness and chaos to every stage they demolish.',
      ],
      [Genre.ELECTRONIC]: [
        'Pushing boundaries with aggressive electronic experimentation.',
        'Where punk attitude meets electronic innovation.',
        'Industrial strength beats for the underground masses.',
      ],
      [Genre.EXPERIMENTAL]: [
        'Defying categorization and challenging expectations.',
        'Art meets anarchy in their genre-defying performances.',
        'Not for the faint of heart or closed of mind.',
      ],
    };

    const bioTemplate = this.random(templates[genre] || templates[Genre.PUNK]);
    return bioTemplate.replace('{hometown}', this.cities[0]);
  }

  // Utility functions
  private random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private weightedRandom<T>(weights: Record<string, number>): T {
    const entries = Object.entries(weights);
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [key, weight] of entries) {
      random -= weight;
      if (random <= 0) {
        return key as unknown as T;
      }
    }

    return entries[0][0] as unknown as T;
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate multiple bands at once
  generateBands(count: number, difficulty: number = 1): Band[] {
    return Array.from({ length: count }, () => this.generateBand(difficulty));
  }
}

export const bandGenerator = new BandGenerator();
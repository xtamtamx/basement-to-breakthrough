import { Band, Venue, Genre, VenueType } from '@game/types';

/**
 * Represents a synergy - a special bonus activated by specific band/venue combinations
 */
export interface Synergy {
  /** Unique identifier for the synergy */
  id: string;
  /** Display name of the synergy */
  name: string;
  /** Description of what triggers and benefits from this synergy */
  description: string;
  /** Multiplier applied to base show metrics (1.0 = no change, 2.0 = double) */
  multiplier: number;
  /** Flat reputation bonus added when this synergy activates */
  reputationBonus: number;
}

/**
 * Core engine for detecting and calculating synergies between bands and venues
 * Manages the complex interactions that create emergent gameplay
 * 
 * @example
 * const engine = new SynergyEngine();
 * const synergies = engine.calculateSynergies([punkBand], diyVenue);
 */
export class SynergyEngine {
  /** Registry of all synergy calculators indexed by synergy ID */
  private synergies: Map<string, (bands: Band[], venue: Venue) => Synergy | null> = new Map();

  constructor() {
    this.registerDefaultSynergies();
  }

  /**
   * Calculates all applicable synergies for a show
   * @param bands - Array of bands performing (supports multi-band bills)
   * @param venue - The venue hosting the show
   * @returns Array of active synergies that apply to this combination
   */
  calculateSynergies(bands: Band[], venue: Venue): Synergy[] {
    const activeSynergies: Synergy[] = [];

    for (const [, calculator] of this.synergies) {
      const synergy = calculator(bands, venue);
      if (synergy) {
        activeSynergies.push(synergy);
      }
    }

    return activeSynergies;
  }

  /**
   * Registers a new synergy calculator
   * @param id - Unique identifier for the synergy
   * @param calculator - Function that determines if synergy applies and returns it
   */
  registerSynergy(
    id: string, 
    calculator: (bands: Band[], venue: Venue) => Synergy | null
  ): void {
    this.synergies.set(id, calculator);
  }

  /**
   * Registers all built-in synergies
   * Called automatically on engine initialization
   * @private
   */
  private registerDefaultSynergies(): void {
    // DIY Authenticity - DIY bands in DIY spaces
    this.registerSynergy('diy-authentic', (bands, venue) => {
      const allDIY = bands.every(b => b.authenticity > 90);
      const diyVenue = venue.authenticity > 90 && 
        (venue.type === VenueType.BASEMENT || venue.type === VenueType.DIY_SPACE);
      
      if (allDIY && diyVenue) {
        return {
          id: 'diy-authentic',
          name: 'True DIY',
          description: 'Authentic underground vibes double the impact',
          multiplier: 2.0,
          reputationBonus: 10,
        };
      }
      return null;
    });

    // Genre Match - Band genre matches venue specialty
    this.registerSynergy('genre-match', (bands, venue) => {
      const band = bands[0];
      const genreVenueMap: Partial<Record<Genre, VenueType[]>> = {
        [Genre.PUNK]: [VenueType.PUNK_CLUB, VenueType.DIY_SPACE],
        [Genre.METAL]: [VenueType.METAL_VENUE, VenueType.WAREHOUSE],
        [Genre.HARDCORE]: [VenueType.BASEMENT, VenueType.DIY_SPACE],
      };

      const preferredVenues = genreVenueMap[band.genre] || [];
      if (preferredVenues.includes(venue.type)) {
        return {
          id: 'genre-match',
          name: 'Perfect Fit',
          description: `${band.genre} bands thrive in this venue`,
          multiplier: 1.5,
          reputationBonus: 5,
        };
      }
      return null;
    });

    // Hometown Heroes - Local bands get a boost
    this.registerSynergy('hometown-heroes', (bands, venue) => {
      const band = bands[0];
      if (band.hometown && band.hometown.includes(venue.location.name)) {
        return {
          id: 'hometown-heroes',
          name: 'Hometown Heroes',
          description: 'Local support boosts attendance',
          multiplier: 1.3,
          reputationBonus: 3,
        };
      }
      return null;
    });

    // Legendary Pairing - High skill bands in high-end venues
    this.registerSynergy('legendary-pairing', (bands, venue) => {
      const band = bands[0];
      const isLegendaryBand = band.technicalSkill > 80 && band.popularity > 70;
      const isPremiumVenue = venue.type === VenueType.CONCERT_HALL || 
                            venue.type === VenueType.THEATER;
      
      if (isLegendaryBand && isPremiumVenue) {
        return {
          id: 'legendary-pairing',
          name: 'Legendary Performance',
          description: 'Master musicians in a proper venue',
          multiplier: 1.8,
          reputationBonus: 15,
        };
      }
      return null;
    });

    // Chaos Reigns - High energy in small spaces
    this.registerSynergy('chaos-reigns', (bands, venue) => {
      const band = bands[0];
      const isChaoticBand = band.energy > 85;
      const isSmallVenue = venue.capacity < 50;
      
      if (isChaoticBand && isSmallVenue) {
        return {
          id: 'chaos-reigns',
          name: 'Controlled Chaos',
          description: 'Insane energy in tight quarters creates legendary shows',
          multiplier: 1.6,
          reputationBonus: 8,
        };
      }
      return null;
    });

    // Bar Revenue Boost - Older crowds in bar venues
    this.registerSynergy('bar-boost', (bands, venue) => {
      const band = bands[0];
      const matureAudience = band.popularity > 40 && !band.traits.some(t => t.name === 'Youth Crew');
      
      if (venue.hasBar && matureAudience) {
        return {
          id: 'bar-boost',
          name: 'Thirsty Crowd',
          description: 'Bar sales through the roof',
          multiplier: 1.2,
          reputationBonus: 0, // Money bonus instead
        };
      }
      return null;
    });

    // Underground Network - Multiple underground bands
    this.registerSynergy('underground-network', (bands) => {
      if (bands.length < 2) return null;
      
      const allUnderground = bands.every(b => b.authenticity > 70 && b.popularity < 30);
      if (allUnderground) {
        return {
          id: 'underground-network',
          name: 'Scene Unity',
          description: 'Underground bands supporting each other',
          multiplier: 1.4,
          reputationBonus: 6,
        };
      }
      return null;
    });

    // Real Artist Spotlight - Real artists get special bonus
    this.registerSynergy('real-artist', (bands) => {
      const hasRealArtist = bands.some(b => b.isRealArtist);
      if (hasRealArtist) {
        return {
          id: 'real-artist',
          name: 'Authentic Experience',
          description: 'Featuring real underground artists',
          multiplier: 1.25,
          reputationBonus: 7,
        };
      }
      return null;
    });
  }

  // Get synergy preview for planning
  previewSynergies(bands: Band[], venue: Venue): string[] {
    const synergies = this.calculateSynergies(bands, venue);
    return synergies.map(s => `${s.name}: ${s.description}`);
  }

  // Calculate total multiplier from synergies array
  getTotalMultiplier(synergies: Synergy[]): number {
    return synergies.reduce((total, synergy) => total * synergy.multiplier, 1);
  }

  // Calculate total reputation bonus from synergies array
  getTotalReputationBonus(synergies: Synergy[]): number {
    return synergies.reduce((total, synergy) => total + synergy.reputationBonus, 0);
  }
}

export const synergyEngine = new SynergyEngine();
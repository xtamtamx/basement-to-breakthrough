import { Band, Venue, Genre, VenueType } from '@game/types';

/**
 * A band+venue COMBO synergy: a situational bonus activated by a specific
 * bill+venue combination. (Distinct from SynergyManager's equipped "joker"
 * Synergy — that's a persistent run-long slot modifier.)
 */
export interface ComboSynergy {
  /** Unique identifier for the synergy */
  id: string;
  /** Display name of the synergy */
  name: string;
  /** Description of what triggers and benefits from this synergy */
  description: string;
  /** Attendance multiplier applied to the show (1.0 = no change). Tuned modest:
   *  combos stack multiplicatively and are capped by COMBO_MULT_CAP. */
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
  private synergies: Map<string, (bands: Band[], venue: Venue) => ComboSynergy | null> = new Map();

  constructor() {
    this.registerDefaultSynergies();
  }

  /**
   * Calculates all applicable synergies for a show
   * @param bands - Array of bands performing (supports multi-band bills)
   * @param venue - The venue hosting the show
   * @returns Array of active synergies that apply to this combination
   */
  calculateSynergies(bands: Band[], venue: Venue): ComboSynergy[] {
    const activeSynergies: ComboSynergy[] = [];

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
    calculator: (bands: Band[], venue: Venue) => ComboSynergy | null
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
          description: 'Authentic underground vibes pack the room.',
          multiplier: 1.5,
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
          multiplier: 1.3,
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
          multiplier: 1.2,
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
          multiplier: 1.4,
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
          multiplier: 1.35,
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
          multiplier: 1.15,
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
          multiplier: 1.25,
          reputationBonus: 6,
        };
      }
      return null;
    });

    // Basement Magic - Your most authentic act in the rawest room. Looser than
    // True DIY (one headliner, auth>80, basement/house only) so it rewards early
    // basement gigs without overlapping the all-DIY legendary combo.
    this.registerSynergy('basement-magic', (bands, venue) => {
      const headliner = bands[0];
      const isRawRoom = venue.type === VenueType.BASEMENT || venue.type === VenueType.HOUSE_SHOW;
      if (headliner.authenticity > 80 && isRawRoom) {
        return {
          id: 'basement-magic',
          name: 'Basement Magic',
          description: 'A true believer in a low-ceiling room — this is what it is all about',
          multiplier: 1.25,
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
          multiplier: 1.15,
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
  getTotalMultiplier(synergies: ComboSynergy[]): number {
    return synergies.reduce((total, synergy) => total * synergy.multiplier, 1);
  }

  // Calculate total reputation bonus from synergies array
  getTotalReputationBonus(synergies: ComboSynergy[]): number {
    return synergies.reduce((total, synergy) => total + synergy.reputationBonus, 0);
  }
}

export const synergyEngine = new SynergyEngine();

/** Static metadata for every band+venue combo, so the Synergy Discovery codex
 *  has a real denominator and can render locked ("???") entries. Tier is derived
 *  from each combo's attendance multiplier (>=1.4 legendary, >=1.25 rare, else common). */
export const COMBO_CATALOG: {
  id: string;
  name: string;
  description: string;
  tier: 'common' | 'rare' | 'legendary';
}[] = [
  { id: 'diy-authentic', name: 'True DIY', description: 'All-DIY bands in an authentic underground space pack the room.', tier: 'legendary' },
  { id: 'legendary-pairing', name: 'Legendary Performance', description: 'Master musicians in a proper theater or hall.', tier: 'legendary' },
  { id: 'chaos-reigns', name: 'Controlled Chaos', description: 'A high-energy band crammed into a tiny room makes legend.', tier: 'rare' },
  { id: 'genre-match', name: 'Perfect Fit', description: "A band that matches the venue's specialty thrives.", tier: 'rare' },
  { id: 'underground-network', name: 'Scene Unity', description: 'A bill of underground bands supporting each other.', tier: 'rare' },
  { id: 'basement-magic', name: 'Basement Magic', description: 'Nothing says real like a low ceiling and one working outlet.', tier: 'rare' },
  { id: 'hometown-heroes', name: 'Hometown Heroes', description: 'Local support packs the room.', tier: 'common' },
  { id: 'real-artist', name: 'Authentic Experience', description: 'Featuring a real underground artist.', tier: 'common' },
  { id: 'bar-boost', name: 'Thirsty Crowd', description: 'An older crowd at a bar venue drinks the place dry.', tier: 'common' },
];

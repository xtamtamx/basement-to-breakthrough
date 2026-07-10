import { Band, Venue, Genre, VenueType, EquipmentType } from '@game/types';

/**
 * A band+venue COMBO synergy: a situational bonus activated by a specific
 * bill+venue combination. (Distinct from SynergyManager's equipped "instinct"
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

    // Hometown Heroes - a band that's bigger at home than anywhere else. Keyed
    // off the Hometown Heroes trait: the demo roster never sets `hometown`, so
    // the trait IS the "playing at home" signal (the whole roster is local).
    // The hometown-field branch stays for post-launch multi-city rosters.
    this.registerSynergy('hometown-heroes', (bands, venue) => {
      const band = bands[0];
      const localLegend = band.traits.some(t => t.id === 'hometown-heroes');
      const homeField = !!band.hometown && band.hometown.includes(venue.location.name);
      if (localLegend || homeField) {
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

    // Authentic Experience - the real thing, up close, no age gate. The
    // isRealArtist branch is post-launch scaffolding (v1 ships all-fictional);
    // until then an all-ages room with a true-believer headliner earns the
    // same crowd trust, so the codex entry is actually reachable in the demo.
    this.registerSynergy('real-artist', (bands, venue) => {
      const hasRealArtist = bands.some(b => b.isRealArtist);
      const allAgesAuthentic = venue.allowsAllAges && bands[0].authenticity > 85;
      if (hasRealArtist || allAgesAuthentic) {
        return {
          id: 'real-artist',
          name: 'Authentic Experience',
          description: 'The real thing, up close — no barrier, no age gate',
          multiplier: 1.15,
          reputationBonus: 7,
        };
      }
      return null;
    });

    // Basement Democracy - several authentic acts crammed into a tiny basement.
    // Distinct from True DIY (needs the WHOLE bill at auth>90) and Basement Magic
    // (one headliner): this rewards a deep, scrappy, collective bill.
    this.registerSynergy('basement-democracy', (bands, venue) => {
      const tinyRawRoom =
        (venue.type === VenueType.BASEMENT || venue.type === VenueType.HOUSE_SHOW) &&
        venue.capacity < 75;
      const deepAuthenticBill = bands.length >= 3 && bands.every(b => b.authenticity > 75);
      if (deepAuthenticBill && tinyRawRoom) {
        return {
          id: 'basement-democracy',
          name: 'Basement Democracy',
          description: 'A deep bill of true believers in one sweaty basement — consensus through volume',
          multiplier: 1.2,
          reputationBonus: 8,
        };
      }
      return null;
    });

    // Skipped Record Store - a recording rig in a room where physical media moves.
    this.registerSynergy('vinyl-revival', (bands, venue) => {
      const band = bands[0];
      const hasRecordingGear = venue.equipment.some(
        e => e.owned && e.type === EquipmentType.RECORDING,
      );
      const vinylRoom = venue.type === VenueType.DIVE_BAR || venue.type === VenueType.PUNK_CLUB;
      if (hasRecordingGear && vinylRoom && band.authenticity > 60) {
        return {
          id: 'vinyl-revival',
          name: 'Skipped Record Store',
          description: 'A live rig in a room where people still buy the tape — physical media moves',
          multiplier: 1.15,
          reputationBonus: 4,
        };
      }
      return null;
    });

    // Scene Savior - a high-energy band reviving a dormant corner of town. The
    // sceneStrength branch only moves post-launch (demo districts are frozen at
    // 50-80), so the demo's "dormant corner" is the Underground/Warehouse room
    // nobody's booked back to life yet.
    this.registerSynergy('underground-rescue', (bands, venue) => {
      const band = bands[0];
      const dormantCorner =
        venue.location.sceneStrength < 40 ||
        venue.type === VenueType.UNDERGROUND ||
        venue.type === VenueType.WAREHOUSE;
      if (band.energy > 80 && dormantCorner) {
        return {
          id: 'underground-rescue',
          name: 'Scene Savior',
          description: 'Rebuilding a dormant corner of town one high-octane show at a time',
          multiplier: 1.25,
          reputationBonus: 12,
        };
      }
      return null;
    });

    // --- 2026-06 content pass: +3 combos (all <= COMBO_MULT_CAP) ---
    // DIY Purist - a deep, ultra-authentic, low-popularity bill in a raw room.
    this.registerSynergy('diy-purist', (bands, venue) => {
      const rawRoom =
        venue.type === VenueType.BASEMENT ||
        venue.type === VenueType.HOUSE_SHOW ||
        venue.type === VenueType.DIY_SPACE;
      const purist = bands.length >= 2 && bands.every(b => b.authenticity > 85 && b.popularity < 50);
      if (rawRoom && purist) {
        return {
          id: 'diy-purist',
          name: 'DIY Purist',
          description: 'Everyone here would rather break even than break big.',
          multiplier: 1.28,
          reputationBonus: 9,
        };
      }
      return null;
    });

    // Genre Riot - a focused single-genre bill in a small room.
    this.registerSynergy('genre-riot', (bands, venue) => {
      if (bands.length >= 3 && venue.capacity < 150 && bands.every(b => b.genre === bands[0].genre)) {
        return {
          id: 'genre-riot',
          name: 'Genre Riot',
          description: 'One sound, one room, one collective ringing in your ears for days.',
          multiplier: 1.22,
          reputationBonus: 7,
        };
      }
      return null;
    });

    // Sweat Equity - a high-energy headliner in a tiny, no-barricade room.
    this.registerSynergy('sweat-equity', (bands, venue) => {
      const headliner = bands[0];
      if (headliner && headliner.energy > 85 && venue.capacity < 60 && venue.hasSecurity === false) {
        return {
          id: 'sweat-equity',
          name: 'Sweat Equity',
          description: 'No barricade, no bouncer, no survivors — just the band and the pit.',
          multiplier: 1.3,
          reputationBonus: 10,
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

// ============= Cross-run combo codex persistence =============
// The discovery compendium is META progression: store.discoveredSynergies is
// deliberately run-scoped (it feeds in-run balance gates — landmark
// discoveredCount, event-card totalCards — and MUST reset each run), so the
// codex keeps its own storage key and SynergyView renders the UNION of the two.
// Never seed the store from this set.
const COMBO_CODEX_KEY = 'btb-combo-codex-v1';

export function loadDiscoveredCombos(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMBO_CODEX_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Fold newly discovered combo ids into the persistent codex (idempotent).
 *  Called by startNewRun (before the store wipe) and by SynergyView on view. */
export function persistDiscoveredCombos(ids: string[]): void {
  if (ids.length === 0) return;
  try {
    const merged = Array.from(new Set([...loadDiscoveredCombos(), ...ids]));
    localStorage.setItem(COMBO_CODEX_KEY, JSON.stringify(merged));
  } catch {
    /* storage unavailable — the codex just stays run-scoped */
  }
}

/** Static metadata for every band+venue combo, so the Synergy Discovery codex
 *  has a real denominator and can render locked ("???") entries. Tier is derived
 *  from each combo's attendance multiplier (>=1.4 legendary, >=1.25 rare, else common). */
export const COMBO_CATALOG: {
  id: string;
  name: string;
  description: string;
  tier: 'common' | 'rare' | 'legendary';
  /** Attendance multiplier (mirrors the calculator above) — for the codex. */
  multiplier: number;
  /** Flat reputation bonus (mirrors the calculator). */
  reputationBonus: number;
  /** Player-facing paraphrase of the recipe — what bill+venue makes it fire. */
  recipe: string;
}[] = [
  { id: 'diy-authentic', name: 'True DIY', description: 'All-DIY bands in an authentic underground space pack the room.', tier: 'legendary', multiplier: 1.5, reputationBonus: 10, recipe: 'Every band on the bill at 90+ authenticity, in a Basement or DIY space.' },
  { id: 'legendary-pairing', name: 'Legendary Performance', description: 'Master musicians in a proper theater or hall.', tier: 'legendary', multiplier: 1.4, reputationBonus: 15, recipe: 'A virtuoso headliner (skill 80+, popularity 70+) in a Concert Hall or Theater.' },
  { id: 'chaos-reigns', name: 'Controlled Chaos', description: 'A high-energy band crammed into a tiny room makes legend.', tier: 'rare', multiplier: 1.35, reputationBonus: 8, recipe: 'A high-energy headliner (energy 85+) in a room under 50 capacity.' },
  { id: 'genre-match', name: 'Perfect Fit', description: "A band that matches the venue's specialty thrives.", tier: 'rare', multiplier: 1.3, reputationBonus: 5, recipe: 'A band on its home turf — punk→club/DIY, metal→warehouse, hardcore→basement.' },
  { id: 'underground-network', name: 'Scene Unity', description: 'A bill of underground bands supporting each other.', tier: 'rare', multiplier: 1.25, reputationBonus: 6, recipe: '2+ bands, all underground (authenticity 70+, popularity under 30).' },
  { id: 'basement-magic', name: 'Basement Magic', description: 'Nothing says real like a low ceiling and one working outlet.', tier: 'rare', multiplier: 1.25, reputationBonus: 6, recipe: 'Your headliner at 80+ authenticity in a Basement or House show.' },
  { id: 'hometown-heroes', name: 'Hometown Heroes', description: 'Local support packs the room.', tier: 'common', multiplier: 1.2, reputationBonus: 3, recipe: 'A headliner with the Hometown Heroes trait — bigger at home than anywhere else.' },
  { id: 'real-artist', name: 'Authentic Experience', description: 'The real thing, up close — no barrier, no age gate.', tier: 'common', multiplier: 1.15, reputationBonus: 7, recipe: 'An all-ages room with a headliner at 85+ authenticity.' },
  { id: 'bar-boost', name: 'Thirsty Crowd', description: 'An older crowd at a bar venue drinks the place dry.', tier: 'common', multiplier: 1.15, reputationBonus: 0, recipe: 'A draw (popularity 40+, not youth-crew) at a venue with a bar — pays in cash.' },
  { id: 'basement-democracy', name: 'Basement Democracy', description: 'A deep bill of true believers crammed into one tiny basement.', tier: 'rare', multiplier: 1.2, reputationBonus: 8, recipe: '3+ bands, all 75+ authenticity, in a Basement/House under 75 capacity.' },
  { id: 'vinyl-revival', name: 'Skipped Record Store', description: 'A live recording rig in a dive where physical media still moves.', tier: 'common', multiplier: 1.15, reputationBonus: 4, recipe: 'Owned recording gear at a Dive Bar or Punk Club, headliner 60+ authenticity.' },
  { id: 'underground-rescue', name: 'Scene Savior', description: 'A high-energy band rebuilding a forgotten corner of the city.', tier: 'rare', multiplier: 1.25, reputationBonus: 12, recipe: 'A high-energy headliner (80+) in an Underground room, Warehouse, or fading neighborhood.' },
  { id: 'diy-purist', name: 'DIY Purist', description: 'A deep, ultra-authentic, low-popularity bill in a raw DIY room.', tier: 'rare', multiplier: 1.28, reputationBonus: 9, recipe: '2+ bands, all 85+ authenticity and under 50 popularity, in a raw room.' },
  { id: 'genre-riot', name: 'Genre Riot', description: 'Three-plus bands of one genre crammed into a small room.', tier: 'common', multiplier: 1.22, reputationBonus: 7, recipe: '3+ bands of the SAME genre, in a room under 150 capacity.' },
  { id: 'sweat-equity', name: 'Sweat Equity', description: 'A high-energy headliner in a tiny room with no security.', tier: 'rare', multiplier: 1.3, reputationBonus: 10, recipe: 'A high-energy headliner (85+) in a tiny room (<60) with no security.' },
];

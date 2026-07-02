import { Band, Genre } from '@game/types';

/**
 * Per-band LOGO STYLES — each parody band's wordmark is a nod to its source
 * act's iconic logo language, translated into a CSS-expressible archetype.
 *
 * HOW FIDELITY MORPHS WITH THE DIY↔SELLOUT METER (the whole point):
 *   pure-diy          → THE band logos: archetype font + structure, full send
 *   diy-leaning       → cut-&-paste versions: archetype font on pasted scraps
 *   balanced (start)  → hand-drawn versions: the STRUCTURE (caps/arch/stretch/
 *                       deco) rendered in your own marker hand
 *   corporate-leaning → uniform handwriting: every band in the same neat script
 *   full-sellout      → uniform ticket print: identical Helvetica caps
 * The rendering lives in BandLogo.tsx + skins.css ([data-skin] rules); this
 * module is only the authored data.
 *
 * Archetypes map to font stacks that ship with iOS/macOS or our bundle
 * (Bebas Neue / Oswald) — never @import (offline-first, capacitor://).
 */

export type LogoArchetype =
  | 'metal-cut'       // condensed caps, first+last letters flared (Metallica gesture)
  | 'horror-serif'    // heavy tight Didot caps (horror-punk)
  | 'thrash-jagged'   // condensed caps, chaotic skew
  | 'script'          // flowing cursive (romantic emo)
  | 'typewriter'      // American Typewriter (confessional/lit emo)
  | 'collegiate'      // Copperplate wide caps (youth-crew varsity)
  | 'heavy-condensed' // Oswald 700 caps (NYHC block stamp)
  | 'rounded-pop'     // Arial Rounded (bouncy pop-punk)
  | 'geometric'       // Futura wide caps (new-wave/mod)
  | 'grunge-serif'    // Bodoni wide-tracked caps (understated serif)
  | 'italic-sans'     // Helvetica bold italic (motion/skate)
  | 'elegant-serif'   // Didot title case (piano-man elegance)
  | 'hand-marker'     // the real logo IS a scrawl — stays marker at full fidelity
  | 'ransom';         // the real logo IS collage — stays cut-out at full fidelity

export interface BandLogoStyle {
  archetype: LogoArchetype;
  /** Wordmark casing — per band (Glassjaw shouts, The Sleeping whispers). */
  casing: 'upper' | 'lower' | 'title' | 'mixed';
  /** First+last letters enlarged & skewed outward (hero only). */
  stretchEnds?: boolean;
  /** −1..1: + bows up (classic metal arch), − sags (punk slump). Hero only. */
  arch?: number;
  /** Whole-lockup lean in degrees (−8..8). */
  slant?: number;
  /** Marker/ink decoration around the lockup (hero only). */
  deco?: 'none' | 'underline' | 'box' | 'rules';
  /** The source act's iconic mark (LogoSigil name) — the bat, the star, the
   *  cat head. Shown at the DIY-side tiers (you even hand-draw their sigil on
   *  your flyer at balanced); the sellout tiers erase it. */
  sigil?: string;
  /** Print-grade wordmark device — only renders at pure-diy ("the actual
   *  logo"): 3D extrude / thick outline / stripes through the letters. */
  device?: 'extrude' | 'outline' | 'stripes';
}

/**
 * Authored per-band assignments (band.id → style). Filled from the source-act
 * inference pass; unmapped bands (e.g. the parked touring roster) fall back to
 * genre defaults below so nothing ever renders unstyled.
 */
export const BAND_LOGO_STYLES: Record<string, BandLogoStyle> = {
  // The Constant Ache → Iron Chic
  'the-constant-ache': { archetype: 'heavy-condensed', casing: 'upper', device: 'outline' },
  // Stain My Memory → Somerset Thrower
  'stain-my-memory': { archetype: 'grunge-serif', casing: 'upper' },
  // Stuck On Repeat → Rule Them All
  'stuck-on-repeat': { archetype: 'collegiate', casing: 'upper', arch: 0.25, deco: 'underline', sigil: 'crest' },
  // Tend Your Plot → Victory Garden
  'tend-your-plot': { archetype: 'hand-marker', casing: 'mixed', slant: -2, sigil: 'sprout' },
  // Cost of Leaving → Incendiary
  'cost-of-leaving': { archetype: 'grunge-serif', casing: 'upper', deco: 'rules', sigil: 'flame' },
  // A Practice in Patients → Stand Still
  'a-practice-in-patients': { archetype: 'italic-sans', casing: 'upper', slant: 6 },
  // Would You Even Notice? → Koyo
  'would-you-even-notice': { archetype: 'grunge-serif', casing: 'upper', sigil: 'leaf' },
  // The Walking Worried → Bayside
  'the-walking-worried': { archetype: 'horror-serif', casing: 'upper', sigil: 'bat' },
  // Liminal Criminals → Stray From the Path
  'liminal-criminals': { archetype: 'heavy-condensed', casing: 'upper', deco: 'box', device: 'outline' },
  // Automedication → Mind Over Matter
  'automedication': { archetype: 'hand-marker', casing: 'lower', sigil: 'pill' },
  // Life of a Speculator → Silent Majority
  'life-of-a-speculator': { archetype: 'heavy-condensed', casing: 'upper' },
  // Seven Miles to Wall Drug → Inside
  'seven-miles-to-wall-drug': { archetype: 'typewriter', casing: 'lower', sigil: 'vinyl' },
  // She Was a Dead End → Clockwise
  'she-was-a-dead-end': { archetype: 'typewriter', casing: 'lower', deco: 'underline', sigil: 'clock' },
  // Darker Halftime → Backtrack
  'darker-halftime': { archetype: 'heavy-condensed', casing: 'upper', arch: 0.25, device: 'outline' },
  // Felony in Mono Is Dead → Crime in Stereo
  'felony-in-mono-is-dead': { archetype: 'geometric', casing: 'lower' },
  // Get Warner → Bomb the Music Industry!
  'get-warner': { archetype: 'hand-marker', casing: 'mixed', slant: -2, sigil: 'bomb' },
  // Into the Floodlights → As Tall As Lions
  'into-the-floodlights': { archetype: 'elegant-serif', casing: 'title', sigil: 'rays' },
  // Lucy Grave → Envy on the Coast
  'lucy-grave': { archetype: 'script', casing: 'title', slant: 3, sigil: 'bird' },
  // This Is Just the Ending → Kill Your Idols
  'this-is-just-the-ending': { archetype: 'hand-marker', casing: 'upper', slant: -3, sigil: 'xmark' },
  // Weight of the Word → This Is Hell
  'weight-of-the-word': { archetype: 'heavy-condensed', casing: 'upper', device: 'outline' },
  // Believe What We Sold You → The Sleeping
  'believe-what-we-sold-you': { archetype: 'geometric', casing: 'lower', sigil: 'moon' },
  // Termites in His Teeth → Sons of Abraham
  'termites-in-his-teeth': { archetype: 'thrash-jagged', casing: 'upper', slant: 3 },
  // Save Each Otter → Patent Pending
  'save-each-otter': { archetype: 'rounded-pop', casing: 'title', arch: 0.15, sigil: 'otter' },
  // Monocultured → Sainthood Reps
  'monocultured': { archetype: 'grunge-serif', casing: 'upper' },
  // No Foolin' Eyes → Zebra
  'no-foolin-eyes': { archetype: 'geometric', casing: 'upper', deco: 'rules', device: 'stripes' },
  // Built for Greased → Stray Cats
  'built-for-greased': { archetype: 'script', casing: 'title', slant: 6, deco: 'underline', sigil: 'cathead' },
  // Pictures and Sentences → Dream Theater
  'pictures-and-sentences': { archetype: 'elegant-serif', casing: 'title', deco: 'rules', sigil: 'majesty' },
  // Needles in the Spaces → Straylight Run
  'needles-in-the-spaces': { archetype: 'hand-marker', casing: 'lower', slant: -2 },
  // Too Bad, So Beautiful → From Autumn to Ashes
  'too-bad-so-beautiful': { archetype: 'horror-serif', casing: 'upper', deco: 'rules', sigil: 'ornament' },
  // We Are Still Awake → Latterman
  'we-are-still-awake': { archetype: 'hand-marker', casing: 'mixed', slant: 2, deco: 'underline', sigil: 'heart' },
  // From Bliss to Eviction → Vision of Disorder
  'bliss-to-eviction': { archetype: 'heavy-condensed', casing: 'upper', deco: 'box', device: 'outline' },
  // Forty Hour Delay → The Movielife
  'forty-hour-delay': { archetype: 'italic-sans', casing: 'lower', sigil: 'train' },
  // Worship and Trouble → Glassjaw
  'worship-and-trouble': { archetype: 'geometric', casing: 'upper', sigil: 'star4' },
  // Your Favorite Weakness → Brand New
  'your-favorite-weakness': { archetype: 'typewriter', casing: 'lower' },
  // Tyranny and Mutiny → Blue Öyster Cult
  'tyranny-and-mutiny': { archetype: 'horror-serif', casing: 'title', arch: 0.15, sigil: 'hookcross' },
  // Stay Angry → Twisted Sister
  'stay-angry': { archetype: 'heavy-condensed', casing: 'upper', slant: 5, device: 'extrude' },
  // Tell All Your Frenemies → Taking Back Sunday
  'tell-all-frenemies': { archetype: 'typewriter', casing: 'lower', deco: 'underline', sigil: 'tally' },
  // An Affluent Man → Billy Joel
  'an-affluent-man': { archetype: 'elegant-serif', casing: 'title', sigil: 'pianokeys' },
};

/** Genre-family fallback so every band always has a coherent archetype. */
export function fallbackLogoStyle(genre: Genre): BandLogoStyle {
  switch (genre) {
    case Genre.METAL:
    case Genre.DOOM:
    case Genre.SLUDGE:
      return { archetype: 'metal-cut', casing: 'upper', stretchEnds: true, arch: 0.6 };
    case Genre.PUNK:
    case Genre.GRUNGE:
      return { archetype: 'hand-marker', casing: 'upper', slant: -3, deco: 'underline' };
    case Genre.HARDCORE:
    case Genre.POWERVIOLENCE:
      return { archetype: 'heavy-condensed', casing: 'upper', deco: 'box' };
    case Genre.EMO:
      return { archetype: 'typewriter', casing: 'lower' };
    case Genre.INDIE:
    case Genre.ALTERNATIVE:
      return { archetype: 'grunge-serif', casing: 'upper' };
    case Genre.NOISE:
    case Genre.EXPERIMENTAL:
      return { archetype: 'ransom', casing: 'upper' };
    case Genre.ELECTRONIC:
      return { archetype: 'geometric', casing: 'upper' };
    default:
      return { archetype: 'hand-marker', casing: 'title' };
  }
}

export function logoStyleFor(band: Pick<Band, 'id' | 'genre'>): BandLogoStyle {
  return BAND_LOGO_STYLES[band.id] ?? fallbackLogoStyle(band.genre);
}

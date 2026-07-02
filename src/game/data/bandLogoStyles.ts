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

/* ============================================================= *
 * LOCKUPS — the composed logo itself: which words stack on which line at
 * which scale, what stretches to fill the block, where the mark integrates.
 * This is what makes it a LOGO instead of a typeset name.
 * ============================================================= */

export interface LockupLine {
  text: string;
  /** Font-size in viewBox units (block is 400 wide). */
  size: number;
  /** Justify the line to the full block width (the band-logo move). */
  fill?: boolean;
  /** Extra letter-spacing in viewBox units. */
  tracking?: number;
  /** Bow the line: + arches up, − sags. Rise in viewBox units. */
  arc?: number;
  /** Force the script face for this line regardless of archetype. */
  script?: boolean;
}

export interface LockupRecipe {
  lines: LockupLine[];
  mark?: 'crown' | 'behind' | 'left' | 'seal' | 'tail' | 'none';
  sigil?: string;
  frame?: 'none' | 'box' | 'rules';
}

export const BAND_LOCKUPS: Record<string, LockupRecipe> = {
  // Iron Chic — chunky org-punk block, outlined
  'the-constant-ache': { lines: [{ text: 'THE', size: 20, tracking: 16 }, { text: 'CONSTANT', size: 56, fill: true }, { text: 'ACHE', size: 56, fill: true }] },
  // Somerset Thrower — dusty serif record-sleeve type
  'stain-my-memory': { lines: [{ text: 'STAIN MY', size: 34, tracking: 8 }, { text: 'MEMORY', size: 54, fill: true, tracking: 6 }] },
  // Rule Them All — varsity seal: ringed crest + stacked athletics caps
  'stuck-on-repeat': { mark: 'seal', sigil: 'crest', lines: [{ text: 'STUCK ON', size: 36, fill: true }, { text: 'REPEAT', size: 50, fill: true }] },
  // Victory Garden — sprout crowning a marker scrawl
  'tend-your-plot': { mark: 'crown', sigil: 'sprout', lines: [{ text: 'TEND YOUR', size: 32 }, { text: 'PLOT', size: 58, fill: true }] },
  // Incendiary — broadsheet serif with the flame flanking
  'cost-of-leaving': { mark: 'left', sigil: 'flame', frame: 'rules', lines: [{ text: 'COST OF', size: 30, tracking: 8 }, { text: 'LEAVING', size: 50, fill: true }] },
  // Stand Still — forward-leaning italic block
  'a-practice-in-patients': { lines: [{ text: 'A PRACTICE IN', size: 26, tracking: 6 }, { text: 'PATIENTS', size: 56, fill: true }] },
  // Koyo — wistful serif with the autumn leaf crowning
  'would-you-even-notice': { mark: 'crown', sigil: 'leaf', lines: [{ text: 'WOULD YOU', size: 30, tracking: 4 }, { text: 'EVEN NOTICE?', size: 42, fill: true }] },
  // Bayside — THE bat over stacked gothic serif
  'the-walking-worried': { mark: 'crown', sigil: 'bat', lines: [{ text: 'THE', size: 18, tracking: 14 }, { text: 'WALKING', size: 50, fill: true }, { text: 'WORRIED', size: 50, fill: true }] },
  // Stray From the Path — boxed agitprop warning label
  'liminal-criminals': { frame: 'box', lines: [{ text: 'LIMINAL', size: 52, fill: true }, { text: 'CRIMINALS', size: 52, fill: true }] },
  // Mind Over Matter — lowercase scrawl, pill at the tail
  'automedication': { mark: 'tail', sigil: 'pill', lines: [{ text: 'automedication', size: 40, fill: true }] },
  // Silent Majority — plainspoken LIHC block
  'life-of-a-speculator': { lines: [{ text: 'LIFE OF A', size: 26, tracking: 8 }, { text: 'SPECULATOR', size: 48, fill: true }] },
  // Inside — typewriter 7-inch sleeve, record at the tail
  'seven-miles-to-wall-drug': { mark: 'tail', sigil: 'vinyl', lines: [{ text: 'seven miles to', size: 26 }, { text: 'wall drug', size: 44, fill: true }] },
  // Clockwise — typewriter with the clock flanking
  'she-was-a-dead-end': { mark: 'left', sigil: 'clock', lines: [{ text: 'she was', size: 26 }, { text: 'a dead end', size: 42, fill: true }] },
  // Backtrack — arched hoodie block
  'darker-halftime': { lines: [{ text: 'DARKER', size: 54, fill: true, arc: 10 }, { text: 'HALFTIME', size: 40, fill: true }] },
  // Crime in Stereo — gallery-minimal lowercase
  'felony-in-mono-is-dead': { lines: [{ text: 'felony in mono', size: 34, fill: true, tracking: 4 }, { text: 'is dead', size: 24, tracking: 12 }] },
  // BTMI! — bomb beside the scrawl
  'get-warner': { mark: 'left', sigil: 'bomb', lines: [{ text: 'GET', size: 34 }, { text: 'WARNER', size: 56, fill: true }] },
  // As Tall As Lions — floodlight rays crowning bookish serif
  'into-the-floodlights': { mark: 'crown', sigil: 'rays', lines: [{ text: 'Into the', size: 24 }, { text: 'Floodlights', size: 46, fill: true }] },
  // Envy on the Coast — swooping script, sparrow at the tail
  'lucy-grave': { mark: 'tail', sigil: 'bird', lines: [{ text: 'Lucy Grave', size: 54, fill: true, arc: 8, script: true }] },
  // Kill Your Idols — scrawl with the hardcore X
  'this-is-just-the-ending': { mark: 'left', sigil: 'xmark', lines: [{ text: 'THIS IS JUST', size: 28 }, { text: 'THE ENDING', size: 44, fill: true }] },
  // This Is Hell — stacked stamp with a small OF THE
  'weight-of-the-word': { lines: [{ text: 'WEIGHT', size: 52, fill: true }, { text: 'OF THE', size: 18, tracking: 18 }, { text: 'WORD', size: 52, fill: true }] },
  // The Sleeping — spacey lowercase, crescent flanking
  'believe-what-we-sold-you': { mark: 'left', sigil: 'moon', lines: [{ text: 'believe what', size: 32, fill: true }, { text: 'we sold you', size: 32, fill: true }] },
  // Sons of Abraham — sagging chaos line
  'termites-in-his-teeth': { lines: [{ text: 'TERMITES', size: 50, fill: true, arc: -8 }, { text: 'IN HIS TEETH', size: 26, tracking: 8 }] },
  // Patent Pending — party arch with the otter crowning
  'save-each-otter': { mark: 'crown', sigil: 'otter', lines: [{ text: 'SAVE EACH', size: 30, arc: 8 }, { text: 'OTTER', size: 54, fill: true }] },
  // Sainthood Reps — one understated wide line
  'monocultured': { lines: [{ text: 'MONOCULTURED', size: 40, fill: true, tracking: 4 }] },
  // Zebra — striped arena rules
  'no-foolin-eyes': { frame: 'rules', lines: [{ text: "NO FOOLIN'", size: 38, fill: true }, { text: 'EYES', size: 52, fill: true, tracking: 20 }] },
  // Stray Cats — cat head over rising diner script
  'built-for-greased': { mark: 'crown', sigil: 'cathead', lines: [{ text: 'Built for', size: 30, arc: 6, script: true }, { text: 'Greased', size: 54, fill: true, arc: 8, script: true }] },
  // Dream Theater — Majesty sigil beside playbill serif
  'pictures-and-sentences': { mark: 'left', sigil: 'majesty', frame: 'rules', lines: [{ text: 'Pictures', size: 42, fill: true }, { text: 'and Sentences', size: 26 }] },
  // Straylight Run — quiet pencil scrawl
  'needles-in-the-spaces': { lines: [{ text: 'needles in', size: 34 }, { text: 'the spaces', size: 34 }] },
  // From Autumn to Ashes — ornament crowning funeral serif
  'too-bad-so-beautiful': { mark: 'crown', sigil: 'ornament', frame: 'rules', lines: [{ text: 'TOO BAD,', size: 32 }, { text: 'SO BEAUTIFUL', size: 42, fill: true }] },
  // Latterman — posi scrawl, heart at the tail
  'we-are-still-awake': { mark: 'tail', sigil: 'heart', lines: [{ text: 'WE ARE', size: 30 }, { text: 'STILL AWAKE', size: 44, fill: true }] },
  // Vision of Disorder — boxed distressed stamp
  'bliss-to-eviction': { frame: 'box', lines: [{ text: 'FROM BLISS', size: 36, fill: true }, { text: 'TO EVICTION', size: 36, fill: true }] },
  // The Movielife — train beside forward italic
  'forty-hour-delay': { mark: 'left', sigil: 'train', lines: [{ text: 'forty hour', size: 30 }, { text: 'delay', size: 56, fill: true }] },
  // Glassjaw — huge ghosted star BEHIND wide-tracked caps
  'worship-and-trouble': { mark: 'behind', sigil: 'star4', lines: [{ text: 'WORSHIP', size: 44, fill: true, tracking: 10 }, { text: 'AND TROUBLE', size: 20, tracking: 16 }] },
  // Brand New — typeset restraint IS the logo
  'your-favorite-weakness': { lines: [{ text: 'your favorite', size: 28 }, { text: 'weakness', size: 46, fill: true }] },
  // Blue Öyster Cult — hook-and-cross beside occult serif
  'tyranny-and-mutiny': { mark: 'left', sigil: 'hookcross', lines: [{ text: 'Tyranny', size: 42, fill: true }, { text: 'and Mutiny', size: 26 }] },
  // Twisted Sister — extruded arena block
  'stay-angry': { lines: [{ text: 'STAY', size: 56, fill: true }, { text: 'ANGRY', size: 56, fill: true }] },
  // Taking Back Sunday — tally beside notebook typewriter
  'tell-all-frenemies': { mark: 'left', sigil: 'tally', lines: [{ text: 'tell all your', size: 24 }, { text: 'frenemies', size: 42, fill: true }] },
  // Billy Joel — piano keys crowning marquee serif
  'an-affluent-man': { mark: 'crown', sigil: 'pianokeys', lines: [{ text: 'An', size: 20 }, { text: 'Affluent Man', size: 42, fill: true }] },
};

/** Fallback lockup for unmapped bands (touring roster): last word fills. */
export function defaultLockup(name: string): LockupRecipe {
  const words = name.split(' ');
  if (words.length <= 2) {
    return { lines: words.map((w) => ({ text: w, size: 48, fill: true })) };
  }
  const head = words.slice(0, -1).join(' ');
  const tail = words[words.length - 1];
  return { lines: [{ text: head, size: 28 }, { text: tail, size: 50, fill: true }] };
}

export function lockupFor(band: Pick<Band, 'id' | 'name'>): LockupRecipe {
  return BAND_LOCKUPS[band.id] ?? defaultLockup(band.name);
}

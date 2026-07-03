import { Band, Genre } from '@game/types';

/**
 * Per-band LOGO STYLES — each parody band's wordmark is a nod to its source
 * act's iconic logo LANGUAGE (typeface genre, layout, symbol concept),
 * translated into a CSS-expressible archetype. We extract the *feel* of the
 * real logo to inspire an ORIGINAL parody — never trace or reproduce it
 * (consistent with the roster's no-verbatim-names rule).
 *
 * The recipes below were tuned from a source-logo research pass (2026-07-02):
 *   - MARK-FORWARD acts (Bayside's bird, Dream Theater's heraldic crest, Stray
 *     Cats' greaser cat, Blue Öyster Cult's occult glyph) invest in the mark.
 *   - TYPE-DRIVEN acts (Brand New, Crime in Stereo's stacked-justified block,
 *     Taking Back Sunday's road-worn slab, Billy Joel's handwritten signature)
 *     carry the identity in the lettering/layout, with no bolted-on badge.
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
 * research pass; unmapped bands (e.g. the parked touring roster) fall back to
 * genre defaults below so nothing ever renders unstyled.
 */
export const BAND_LOGO_STYLES: Record<string, BandLogoStyle> = {
  // The Constant Ache → Iron Chic (chunky rounded-slab caps, warm illustrated)
  'the-constant-ache': { archetype: 'heavy-condensed', casing: 'upper' },
  // Stain My Memory → Somerset Thrower (thin lowercase, hazy shoegaze quiet)
  'stain-my-memory': { archetype: 'italic-sans', casing: 'lower' },
  // Stuck On Repeat → Rule Them All (stark blocky LIHC caps, no mascot)
  'stuck-on-repeat': { archetype: 'heavy-condensed', casing: 'upper', deco: 'rules' },
  // Tend Your Plot → Victory Garden (utilitarian stencil caps + sprout)
  'tend-your-plot': { archetype: 'heavy-condensed', casing: 'upper', sigil: 'sprout' },
  // Cost of Leaving → Incendiary (heavy spiked horror-serif, smoldering)
  'cost-of-leaving': { archetype: 'horror-serif', casing: 'upper', sigil: 'flame' },
  // A Practice in Patients → Stand Still (bold athletic italic, forward)
  'a-practice-in-patients': { archetype: 'italic-sans', casing: 'lower', slant: 6 },
  // Would You Even Notice? → Koyo (slick rounded corporate product mark + leaf)
  'would-you-even-notice': { archetype: 'rounded-pop', casing: 'lower', sigil: 'leaf' },
  // The Walking Worried → Bayside (MARK-FIRST: the bird carries it, type quiet)
  'the-walking-worried': { archetype: 'italic-sans', casing: 'upper', sigil: 'bird' },
  // Liminal Criminals → Stray From the Path (tall condensed gothic, masthead)
  'liminal-criminals': { archetype: 'heavy-condensed', casing: 'upper' },
  // Automedication → Mind Over Matter (bold lowercase slab in a ruled masthead)
  'automedication': { archetype: 'grunge-serif', casing: 'lower' },
  // Life of a Speculator → Silent Majority (scratchy scrawl boxed with a halo)
  'life-of-a-speculator': { archetype: 'hand-marker', casing: 'upper' },
  // Seven Miles to Wall Drug → Inside (engraved plain-sans nameplate/plaque)
  'seven-miles-to-wall-drug': { archetype: 'geometric', casing: 'upper' },
  // She Was a Dead End → Clockwise (quiet DIY typewriter + tiny clock nod)
  'she-was-a-dead-end': { archetype: 'typewriter', casing: 'lower', deco: 'underline', sigil: 'clock' },
  // Darker Halftime → Backtrack (arched block caps, hard offset drop-shadow)
  'darker-halftime': { archetype: 'heavy-condensed', casing: 'upper', arch: 0.25, device: 'extrude' },
  // Felony in Mono Is Dead → Crime in Stereo (THE stacked-justified block)
  'felony-in-mono-is-dead': { archetype: 'geometric', casing: 'upper' },
  // Get Warner → Bomb the Music Industry! (spray-stencil caps + aerosol bomb)
  'get-warner': { archetype: 'hand-marker', casing: 'upper', sigil: 'bomb' },
  // Into the Floodlights → As Tall As Lions (airy light serif, faint glow)
  'into-the-floodlights': { archetype: 'elegant-serif', casing: 'title', sigil: 'rays' },
  // Lucy Grave → Envy on the Coast (surreal display serif, "pretty but off")
  'lucy-grave': { archetype: 'grunge-serif', casing: 'title', slant: 3, sigil: 'moon' },
  // This Is Just the Ending → Kill Your Idols (blunt block caps + hardcore X)
  'this-is-just-the-ending': { archetype: 'heavy-condensed', casing: 'upper', sigil: 'xmark' },
  // Weight of the Word → This Is Hell (hand-inked high-contrast stamp)
  'weight-of-the-word': { archetype: 'heavy-condensed', casing: 'upper' },
  // Believe What We Sold You → The Sleeping (bold urgent heavy caps, slight lean)
  'believe-what-we-sold-you': { archetype: 'heavy-condensed', casing: 'upper', slant: 2 },
  // Termites in His Teeth → Sons of Abraham (restrained serif over imagery)
  'termites-in-his-teeth': { archetype: 'grunge-serif', casing: 'upper', slant: 2 },
  // Save Each Otter → Patent Pending (full cartoon mascot, bouncy rounded-pop)
  'save-each-otter': { archetype: 'rounded-pop', casing: 'title', arch: 0.15, sigil: 'otter' },
  // Monocultured → Sainthood Reps (deliberately plain muted-indie wordmark)
  'monocultured': { archetype: 'geometric', casing: 'title' },
  // No Foolin' Eyes → Zebra (glossy wide-tracked arena caps, striped letters)
  'no-foolin-eyes': { archetype: 'geometric', casing: 'upper', deco: 'rules', device: 'stripes' },
  // Built for Greased → Stray Cats (rockabilly brush script + greaser cat head)
  'built-for-greased': { archetype: 'script', casing: 'title', slant: 6, deco: 'underline', sigil: 'cathead' },
  // Pictures and Sentences → Dream Theater (heraldic crest crowning refined serif)
  'pictures-and-sentences': { archetype: 'elegant-serif', casing: 'title', sigil: 'majesty' },
  // Needles in the Spaces → Straylight Run (thin airy lowercase, fragile)
  'needles-in-the-spaces': { archetype: 'italic-sans', casing: 'lower', slant: -2 },
  // Too Bad, So Beautiful → From Autumn to Ashes (jagged aggressive wordmark)
  'too-bad-so-beautiful': { archetype: 'thrash-jagged', casing: 'upper', sigil: 'ornament' },
  // We Are Still Awake → Latterman (earnest posi scrawl + tiny doodle heart)
  'we-are-still-awake': { archetype: 'hand-marker', casing: 'mixed', slant: 2, deco: 'underline', sigil: 'heart' },
  // From Bliss to Eviction → Vision of Disorder (dripping graffiti tag, boxed)
  'bliss-to-eviction': { archetype: 'thrash-jagged', casing: 'upper' },
  // Forty Hour Delay → The Movielife (clean lowercase, no mark)
  'forty-hour-delay': { archetype: 'italic-sans', casing: 'lower' },
  // Worship and Trouble → Glassjaw (brutal Helvetica-bold billboard block)
  'worship-and-trouble': { archetype: 'heavy-condensed', casing: 'upper' },
  // Your Favorite Weakness → Brand New (anti-logo typewriter restraint)
  'your-favorite-weakness': { archetype: 'typewriter', casing: 'lower' },
  // Tyranny and Mutiny → Blue Öyster Cult (occult hook-glyph + vintage serif)
  'tyranny-and-mutiny': { archetype: 'horror-serif', casing: 'title', arch: 0.15, sigil: 'hookcross' },
  // Stay Angry → Twisted Sister (glam extruded arena block, loud)
  'stay-angry': { archetype: 'heavy-condensed', casing: 'upper', slant: 5, device: 'extrude' },
  // Tell All Your Frenemies → Taking Back Sunday (road-worn slab in a sign box)
  'tell-all-frenemies': { archetype: 'grunge-serif', casing: 'upper' },
  // An Affluent Man → Billy Joel (flowing handwritten-signature autograph)
  'an-affluent-man': { archetype: 'script', casing: 'mixed', deco: 'underline' },
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
  // Iron Chic — chunky org-punk block, warm and earnest
  'the-constant-ache': { lines: [{ text: 'THE', size: 20, tracking: 16 }, { text: 'CONSTANT', size: 56, fill: true }, { text: 'ACHE', size: 56, fill: true }] },
  // Somerset Thrower — quiet lowercase floating soft over a hazy field
  'stain-my-memory': { lines: [{ text: 'stain my', size: 30, tracking: 4 }, { text: 'memory', size: 48, fill: true }] },
  // Rule Them All — stark stacked LIHC block bracketed by rules
  'stuck-on-repeat': { frame: 'rules', lines: [{ text: 'STUCK ON', size: 40, fill: true }, { text: 'REPEAT', size: 52, fill: true }] },
  // Victory Garden — sprout crowning a utilitarian stencil block
  'tend-your-plot': { mark: 'crown', sigil: 'sprout', lines: [{ text: 'TEND YOUR', size: 30 }, { text: 'PLOT', size: 58, fill: true }] },
  // Incendiary — heavy spiked serif, the ember flanking it
  'cost-of-leaving': { mark: 'left', sigil: 'flame', lines: [{ text: 'COST OF', size: 30, tracking: 8 }, { text: 'LEAVING', size: 50, fill: true }] },
  // Stand Still — forward-leaning athletic italic block
  'a-practice-in-patients': { lines: [{ text: 'A PRACTICE IN', size: 26, tracking: 6 }, { text: 'PATIENTS', size: 56, fill: true }] },
  // Koyo — slick lowercase corporate wordmark, autumn leaf crowning ("kōyō")
  'would-you-even-notice': { mark: 'crown', sigil: 'leaf', lines: [{ text: 'would you', size: 30 }, { text: 'even notice?', size: 44, fill: true }] },
  // Bayside — THE bird is the hero, the quiet wordmark stacks beneath
  'the-walking-worried': { mark: 'crown', sigil: 'bird', lines: [{ text: 'THE', size: 18, tracking: 14 }, { text: 'WALKING', size: 50, fill: true }, { text: 'WORRIED', size: 50, fill: true }] },
  // Stray From the Path — tall condensed gothic, full-width masthead
  'liminal-criminals': { frame: 'rules', lines: [{ text: 'LIMINAL', size: 52, fill: true }, { text: 'CRIMINALS', size: 52, fill: true }] },
  // Mind Over Matter — bold lowercase slab sandwiched in a ruled nameplate
  'automedication': { frame: 'rules', lines: [{ text: 'automedication', size: 40, fill: true }] },
  // Silent Majority — scratchy scrawl jammed inside a hand-drawn box
  'life-of-a-speculator': { frame: 'box', lines: [{ text: 'LIFE OF A', size: 26, tracking: 8 }, { text: 'SPECULATOR', size: 46, fill: true }] },
  // Inside — plain sans engraved into a beveled nameplate/plaque
  'seven-miles-to-wall-drug': { frame: 'box', lines: [{ text: 'SEVEN MILES', size: 26, tracking: 4 }, { text: 'TO WALL DRUG', size: 34, fill: true }] },
  // Clockwise — quiet typewriter, tiny clock as a wink at the tail
  'she-was-a-dead-end': { mark: 'tail', sigil: 'clock', lines: [{ text: 'she was', size: 26 }, { text: 'a dead end', size: 42, fill: true }] },
  // Backtrack — arched hoodie block with a hard offset shadow
  'darker-halftime': { lines: [{ text: 'DARKER', size: 54, fill: true, arc: 10 }, { text: 'HALFTIME', size: 40, fill: true }] },
  // Crime in Stereo — THE stacked-justified block (each line to equal width)
  'felony-in-mono-is-dead': { lines: [{ text: 'FELONY IN', size: 40, fill: true }, { text: 'MONO IS', size: 40, fill: true }, { text: 'DEAD', size: 40, fill: true }] },
  // BTMI! — spray-stencil scrawl, aerosol bomb beside it
  'get-warner': { mark: 'left', sigil: 'bomb', lines: [{ text: 'GET', size: 34 }, { text: 'WARNER', size: 56, fill: true }] },
  // As Tall As Lions — airy bookish serif, a faint light-glow behind
  'into-the-floodlights': { mark: 'behind', sigil: 'rays', lines: [{ text: 'Into the', size: 24 }, { text: 'Floodlights', size: 46, fill: true }] },
  // Envy on the Coast — surreal serif, a dreamlike moon ghosted behind
  'lucy-grave': { mark: 'behind', sigil: 'moon', lines: [{ text: 'Lucy Grave', size: 52, fill: true }] },
  // Kill Your Idols — blunt block caps with the hardcore X
  'this-is-just-the-ending': { mark: 'left', sigil: 'xmark', lines: [{ text: 'THIS IS JUST', size: 28 }, { text: 'THE ENDING', size: 44, fill: true }] },
  // This Is Hell — stacked hand-inked stamp with a small OF THE
  'weight-of-the-word': { lines: [{ text: 'WEIGHT', size: 52, fill: true }, { text: 'OF THE', size: 18, tracking: 18 }, { text: 'WORD', size: 52, fill: true }] },
  // The Sleeping — bold urgent stacked block, built to read big on a tee
  'believe-what-we-sold-you': { lines: [{ text: 'BELIEVE WHAT', size: 30, fill: true }, { text: 'WE SOLD YOU', size: 34, fill: true }] },
  // Sons of Abraham — restrained serif, a slight sag over imagery
  'termites-in-his-teeth': { lines: [{ text: 'TERMITES', size: 50, fill: true, arc: -6 }, { text: 'IN HIS TEETH', size: 26, tracking: 8 }] },
  // Patent Pending — party arch with the cartoon otter crowning
  'save-each-otter': { mark: 'crown', sigil: 'otter', lines: [{ text: 'SAVE EACH', size: 30, arc: 8 }, { text: 'OTTER', size: 54, fill: true }] },
  // Sainthood Reps — one deliberately plain, quiet wide line
  'monocultured': { lines: [{ text: 'Monocultured', size: 40, fill: true, tracking: 2 }] },
  // Zebra — striped arena rules, wide-tracked and glossy
  'no-foolin-eyes': { frame: 'rules', lines: [{ text: "NO FOOLIN'", size: 38, fill: true }, { text: 'EYES', size: 52, fill: true, tracking: 20 }] },
  // Stray Cats — greaser cat head over rising rockabilly diner script
  'built-for-greased': { mark: 'crown', sigil: 'cathead', lines: [{ text: 'Built for', size: 30, arc: 6, script: true }, { text: 'Greased', size: 54, fill: true, arc: 8, script: true }] },
  // Dream Theater — heraldic crest crowning refined playbill serif
  'pictures-and-sentences': { mark: 'crown', sigil: 'majesty', lines: [{ text: 'Pictures', size: 44, fill: true }, { text: 'and Sentences', size: 26 }] },
  // Straylight Run — quiet fragile pencil scrawl, lots of air
  'needles-in-the-spaces': { lines: [{ text: 'needles in', size: 34 }, { text: 'the spaces', size: 34 }] },
  // From Autumn to Ashes — jagged funeral serif, ornament crowning
  'too-bad-so-beautiful': { mark: 'crown', sigil: 'ornament', lines: [{ text: 'TOO BAD,', size: 32 }, { text: 'SO BEAUTIFUL', size: 42, fill: true }] },
  // Latterman — earnest posi scrawl, tiny doodle heart at the tail
  'we-are-still-awake': { mark: 'tail', sigil: 'heart', lines: [{ text: 'WE ARE', size: 30 }, { text: 'STILL AWAKE', size: 44, fill: true }] },
  // Vision of Disorder — boxed, dripping distressed graffiti tag
  'bliss-to-eviction': { frame: 'box', lines: [{ text: 'FROM BLISS', size: 36, fill: true }, { text: 'TO EVICTION', size: 36, fill: true }] },
  // The Movielife — clean forward lowercase, type over imagery, no mark
  'forty-hour-delay': { lines: [{ text: 'forty hour', size: 30 }, { text: 'delay', size: 56, fill: true }] },
  // Glassjaw — brutal Helvetica-bold billboard block, ruled masthead
  'worship-and-trouble': { frame: 'rules', lines: [{ text: 'WORSHIP', size: 46, fill: true }, { text: 'AND TROUBLE', size: 30, fill: true }] },
  // Brand New — typeset restraint IS the logo
  'your-favorite-weakness': { lines: [{ text: 'your favorite', size: 28 }, { text: 'weakness', size: 46, fill: true }] },
  // Blue Öyster Cult — occult hook-and-cross glyph beside vintage serif
  'tyranny-and-mutiny': { mark: 'left', sigil: 'hookcross', lines: [{ text: 'Tyranny', size: 42, fill: true }, { text: 'and Mutiny', size: 26 }] },
  // Twisted Sister — extruded glam arena block
  'stay-angry': { lines: [{ text: 'STAY', size: 56, fill: true }, { text: 'ANGRY', size: 56, fill: true }] },
  // Taking Back Sunday — road-worn slab caps inside a highway-sign box
  'tell-all-frenemies': { frame: 'box', lines: [{ text: 'TELL ALL YOUR', size: 24, tracking: 4 }, { text: 'FRENEMIES', size: 46, fill: true }] },
  // Billy Joel — a single flowing handwritten-signature autograph
  'an-affluent-man': { lines: [{ text: 'An Affluent Man', size: 44, fill: true, script: true }] },
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

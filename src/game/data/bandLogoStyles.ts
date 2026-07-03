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
  // Believe What We Sold You → The Sleeping (bold urgent heavy caps + rabbit mark)
  'believe-what-we-sold-you': { archetype: 'heavy-condensed', casing: 'upper', slant: 2, sigil: 'rabbit' },
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
  // Iron Chic "Timecop" (Demo '08) — chunky org-punk block
  'the-constant-ache': { lines: [{ text: 'TIMECOP', size: 64, fill: true }] },
  // Somerset Thrower "Cache Memory" (Demo '13) — quiet hazy lowercase
  'stain-my-memory': { lines: [{ text: 'cache', size: 34, tracking: 4 }, { text: 'memory', size: 52, fill: true }] },
  // Rule Them All "So It Starts…" — stark stacked LIHC block bracketed by rules
  'stuck-on-repeat': { frame: 'rules', lines: [{ text: 'SO IT', size: 40, fill: true }, { text: 'STARTS', size: 52, fill: true }] },
  // Victory Garden "Isolation 101" — sprout crowning a utilitarian stencil block
  'tend-your-plot': { mark: 'crown', sigil: 'sprout', lines: [{ text: 'ISOLATION', size: 38, fill: true }, { text: '101', size: 56, fill: true, tracking: 12 }] },
  // Incendiary "Choosing Sides" (Demo '07) — heavy spiked serif, ember flanking
  'cost-of-leaving': { mark: 'left', sigil: 'flame', lines: [{ text: 'CHOOSING', size: 32, tracking: 4 }, { text: 'SIDES', size: 52, fill: true }] },
  // Stand Still "There's No Autumn Here" — forward-leaning athletic italic block
  'a-practice-in-patients': { lines: [{ text: 'no autumn', size: 34 }, { text: 'here', size: 58, fill: true }] },
  // Koyo "Heaven So Heavy" — slick lowercase corporate wordmark, autumn leaf crowning
  'would-you-even-notice': { mark: 'crown', sigil: 'leaf', lines: [{ text: 'heaven', size: 32 }, { text: 'so heavy', size: 48, fill: true }] },
  // Bayside "Foot Impressions" — THE bird is the hero, quiet wordmark stacks beneath
  'the-walking-worried': { mark: 'crown', sigil: 'bird', lines: [{ text: 'FOOT', size: 30, tracking: 8 }, { text: 'IMPERSONATIONS', size: 34, fill: true }] },
  // Stray From the Path "Amnesia Hero" — tall condensed gothic masthead
  'liminal-criminals': { frame: 'rules', lines: [{ text: 'AMNESIA', size: 48, fill: true }, { text: 'HERO', size: 52, fill: true, tracking: 14 }] },
  // Mind Over Matter "Hectic Thinking" (1993 EP) — bold lowercase slab in a ruled nameplate
  'automedication': { frame: 'rules', lines: [{ text: 'hectic thinking', size: 40, fill: true }] },
  // Silent Majority "Polar Bear Club" (twisted — it's a real band) — scratchy scrawl boxed
  'life-of-a-speculator': { frame: 'box', lines: [{ text: 'BIPOLAR', size: 28, tracking: 6 }, { text: 'BEAR CLUB', size: 44, fill: true }] },
  // Inside "Postcard Memories" — plain sans engraved into a beveled plaque
  'seven-miles-to-wall-drug': { frame: 'box', lines: [{ text: 'POSTCARD', size: 30, tracking: 4 }, { text: 'MEMORIES', size: 38, fill: true }] },
  // Clockwise "She Was" — quiet typewriter, tiny clock as a wink at the tail
  'she-was-a-dead-end': { mark: 'tail', sigil: 'clock', lines: [{ text: 'she', size: 30 }, { text: 'was', size: 56, fill: true }] },
  // Backtrack "Paused Progress" (Demo '08) — arched block with a hard offset shadow
  'darker-halftime': { lines: [{ text: 'PAUSED', size: 52, fill: true, arc: 10 }, { text: 'PROGRESS', size: 40, fill: true }] },
  // Crime in Stereo "Amsterdamned!" — clean modern-hardcore block
  'felony-in-mono-is-dead': { lines: [{ text: 'AMSTERDAMNED!', size: 40, fill: true }] },
  // BTMI! "I'm Too Coooool for Music" — spray-stencil scrawl, aerosol bomb beside it
  'get-warner': { mark: 'left', sigil: 'bomb', lines: [{ text: 'TOO COOOOOL', size: 26 }, { text: 'FOR MUSIC', size: 46, fill: true }] },
  // As Tall As Lions "Dancing in the Rearview" — airy bookish serif, faint light-glow behind
  'into-the-floodlights': { mark: 'behind', sigil: 'rays', lines: [{ text: 'Dancing in the', size: 24 }, { text: 'Rearview', size: 48, fill: true }] },
  // Envy on the Coast "Temper Temper" — surreal serif, dreamlike moon ghosted behind
  'lucy-grave': { mark: 'behind', sigil: 'moon', lines: [{ text: 'Temper', size: 46, fill: true }, { text: 'Temper', size: 46, fill: true }] },
  // Kill Your Idols "Small Man Big Mouth" — blunt block caps with the hardcore X
  'this-is-just-the-ending': { mark: 'left', sigil: 'xmark', lines: [{ text: 'SMALL MAN', size: 30 }, { text: 'BIG MOUTH', size: 44, fill: true }] },
  // This Is Hell "Heaven Sent, Hell Bound" — stacked hand-inked stamp
  'weight-of-the-word': { lines: [{ text: 'HEAVEN SENT,', size: 30, fill: true }, { text: 'HELL BOUND', size: 40, fill: true }] },
  // The Sleeping "Through Airwaves" (2003 demo) — rabbit crowning the bold block
  'believe-what-we-sold-you': { mark: 'crown', sigil: 'rabbit', lines: [{ text: 'THROUGH', size: 32, tracking: 4 }, { text: 'AIRWAVES', size: 44, fill: true }] },
  // Sons of Abraham "Termites In His Smile" — restrained serif, a slight sag
  'termites-in-his-teeth': { lines: [{ text: 'TERMITES', size: 48, fill: true, arc: -6 }, { text: 'IN HIS SMILE', size: 26, tracking: 8 }] },
  // Patent Pending "67 Dollars And No Sense" — party arch with the cartoon otter crowning
  'save-each-otter': { mark: 'crown', sigil: 'otter', lines: [{ text: '67 Dollars', size: 30, arc: 8 }, { text: '& No Sense', size: 44, fill: true }] },
  // Sainthood Reps "Mount Condor" (2010 split) — one deliberately plain wide line
  'monocultured': { lines: [{ text: 'Mount Condor', size: 44, fill: true, tracking: 2 }] },
  // Zebra "Who's Behind the Door?" — striped arena rules, wide-tracked and glossy
  'no-foolin-eyes': { frame: 'rules', lines: [{ text: "WHO'S BEHIND", size: 30, fill: true }, { text: 'THE DOOR?', size: 44, fill: true, tracking: 6 }] },
  // Stray Cats "Runaway Boys" (debut single) — greaser cat head over rockabilly script
  'built-for-greased': { mark: 'crown', sigil: 'cathead', lines: [{ text: 'Runaway', size: 34, arc: 6, script: true }, { text: 'Boys', size: 56, fill: true, arc: 8, script: true }] },
  // Dream Theater "The Ytse Jam" (Majesty demos) — heraldic crest crowning refined serif
  'pictures-and-sentences': { mark: 'crown', sigil: 'majesty', lines: [{ text: 'The', size: 20 }, { text: 'Ytse Jam', size: 48, fill: true }] },
  // Straylight Run "Existentialism on Prom Night" — quiet fragile pencil scrawl
  'needles-in-the-spaces': { lines: [{ text: 'existentialism', size: 24 }, { text: 'on prom night', size: 34, fill: true }] },
  // From Autumn to Ashes "A Lie Will Always Defeat the Truth" (2000 demo) — jagged funeral serif
  'too-bad-so-beautiful': { mark: 'crown', sigil: 'ornament', lines: [{ text: 'A LIE WILL', size: 24 }, { text: 'ALWAYS DEFEAT', size: 26, fill: true }, { text: 'THE TRUTH', size: 34, fill: true }] },
  // Latterman "Rebellion Vs. The Alarm Clock" — earnest posi scrawl, heart at the tail
  'we-are-still-awake': { mark: 'tail', sigil: 'heart', lines: [{ text: 'Rebellion vs.', size: 24 }, { text: 'the Alarm Clock', size: 30, fill: true }] },
  // Vision of Disorder "Formula For Failure" — boxed, dripping distressed tag
  'bliss-to-eviction': { frame: 'box', lines: [{ text: 'FORMULA', size: 36, fill: true }, { text: 'FOR FAILURE', size: 36, fill: true }] },
  // The Movielife "One Way Ticket" — clean forward lowercase, no mark
  'forty-hour-delay': { lines: [{ text: 'one way', size: 30 }, { text: 'ticket', size: 56, fill: true }] },
  // Glassjaw "Star Above My Bed" — brutal Helvetica-bold billboard block, ruled masthead
  'worship-and-trouble': { frame: 'rules', lines: [{ text: 'STAR ABOVE', size: 34, fill: true }, { text: 'MY BED', size: 46, fill: true, tracking: 8 }] },
  // Brand New "Jude Law and a Semester Abroad" (trimmed off the celeb name) — typeset restraint
  'your-favorite-weakness': { lines: [{ text: 'semester', size: 30 }, { text: 'abroad', size: 50, fill: true }] },
  // Blue Öyster Cult "Bonomo's Turkish Taffy" (1968 demo, trimmed the brand) — occult hook glyph
  'tyranny-and-mutiny': { mark: 'left', sigil: 'hookcross', lines: [{ text: 'Turkish', size: 42, fill: true }, { text: 'Taffy', size: 34 }] },
  // Twisted Sister "Bad Boys (Of Rock N' Roll)" — extruded glam arena block
  'stay-angry': { lines: [{ text: 'BAD BOYS', size: 46, fill: true }, { text: 'OF ROCK N ROLL', size: 24, fill: true }] },
  // Taking Back Sunday "Timberwolves at New Jersey" — road-worn slab in a highway-sign box
  'tell-all-frenemies': { frame: 'box', lines: [{ text: 'TIMBERWOLVES', size: 32, fill: true }, { text: 'AT NJ', size: 46, fill: true, tracking: 14 }] },
  // Billy Joel — kept the capstone as the Piano-Man persona riff (the Hassles/Attila
  // deep cuts wouldn't read as Billy Joel): a single flowing signature autograph
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

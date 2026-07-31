/**
 * bandTraits — the band trait CATALOGUE and what each trait actually does.
 *
 * Traits used to be inert: every roster trait carried a `modifier` that nothing
 * ever read, 25 of 38 bands shared two labels, and exactly one id (hometown-heroes)
 * was wired to anything. So past name/logo/bio and four stats, bands blurred.
 *
 * Now a trait is a BOOKING-CONDITIONED effect: it fires (or doesn't) based on the
 * bill you build, which makes each band a reason to pick THIS act for THIS room.
 * Every condition is knowable at booking time — room size, all-ages vs bar, solo
 * vs full bill — so the show preview can show exactly what resolution will apply.
 *
 * Every trait is a REASON, never a strict upgrade: the big-stage band is dead
 * weight in a basement, the perfect opener wants company on the bill, and the
 * volatile one brings stress with the crowd.
 *
 * TRAITS ARE TWO-SIDED: each carries an `otherwise` miss-case, so the wrong band
 * in the wrong room is a real cost, not just a forgone bonus.
 *
 * MAGNITUDES ARE DELIBERATELY ASYMMETRIC. Crowd is the master stat — it feeds
 * fans AND reputation AND money at once — so attendance traits sit near +8-15%
 * and are clamped tighter (ATTENDANCE_MULT_MAX) than the single-currency ones at
 * +20-25%. The first pass used +15-25% crowd across the board and pulled the
 * Classic median win from turn ~23 down to 15 while making No Future a 100%
 * pushover; these numbers are sim-verified, so re-check the sim if you touch them.
 */
import { BandTrait, TraitType } from '@game/types';

/** When a trait fires. All of it is known while you are still building the bill. */
export type TraitCondition =
  | 'always'
  | 'smallRoom'   // cap <= 90 — basements, halls, the rec center
  | 'bigRoom'     // cap >= 300 — the lodge, the theater, the beach
  | 'allAges'     // venue.allowsAllAges
  | 'bar'         // venue.hasBar
  | 'soloBill'    // this act alone
  | 'fullBill';   // 2+ acts on the bill

export interface TraitEffect {
  when: TraitCondition;
  /** Crowd multiplier (1.2 = +20% attendance). */
  attendanceMult?: number;
  /** Reputation multiplier on the show's rep gain. */
  repMult?: number;
  /** Money multiplier on the night's take. */
  moneyMult?: number;
  /** Fan multiplier on fans gained. */
  fanMult?: number;
  /** Booking-fee multiplier (0.7 = they work for 30% less). Applied at booking. */
  feeMult?: number;
  /** Flat stress added (+) or shaved (-) by putting this act on the bill. */
  stressDelta?: number;
}

export interface CatalogEntry {
  trait: BandTrait;
  effect: TraitEffect;
  /** What happens when the condition is NOT met. This is what keeps traits a
   *  SIDEWAYS choice instead of a global power-up: a one-sided bonus that every
   *  band always carries just makes the whole roster stronger and compresses the
   *  run (measured: Classic median win fell 23 -> 15). With a miss-case, booking
   *  the wrong act into the wrong room actively costs you, so the average band is
   *  ~neutral and the DECISION carries the value. Omitted for 'always' traits,
   *  which pay their cost another way (stress) or are pure economy (fees). */
  otherwise?: Omit<TraitEffect, 'when'>;
  /** One line shown on the band card / booking preview, in the band's own voice. */
  blurb: string;
}

const t = (
  id: string,
  name: string,
  description: string,
  type: TraitType,
): BandTrait => ({ id, name, description, type });

export const BAND_TRAIT_CATALOG: Record<string, CatalogEntry> = {
  'pit-igniter': {
    trait: t('pit-igniter', 'Pit Igniter', 'Turns a low ceiling into a dent', TraitType.PERFORMANCE),
    effect: { when: 'smallRoom', attendanceMult: 1.1 },
    otherwise: { attendanceMult: 0.92 },
    blurb: 'Give them a low ceiling and they will put a dent in it.',
  },
  'scene-revered': {
    trait: t('scene-revered', 'Scene Revered', 'Cred money cannot buy', TraitType.PERSONALITY),
    effect: { when: 'allAges', repMult: 1.12 },
    otherwise: { repMult: 0.92 },
    blurb: 'Cred money cannot buy — and they will still play the all-ages room for gas.',
  },
  'bar-band': {
    trait: t('bar-band', 'Bar Band', 'Twelve years of last calls', TraitType.PERFORMANCE),
    effect: { when: 'bar', moneyMult: 1.2 },
    otherwise: { moneyMult: 0.9 },
    blurb: 'Twelve years of last calls. They know exactly when to start the slow one.',
  },
  'all-ages-lifer': {
    trait: t('all-ages-lifer', 'All-Ages Lifer', 'Sharpie on the back of the hand', TraitType.PERSONALITY),
    effect: { when: 'allAges', fanMult: 1.12 },
    otherwise: { fanMult: 0.92 },
    blurb: 'Had X’s on their hands before it was theirs to give.',
  },
  'festival-ready': {
    trait: t('festival-ready', 'Festival Ready', 'Built for a field', TraitType.PERFORMANCE),
    effect: { when: 'bigRoom', attendanceMult: 1.1 },
    otherwise: { attendanceMult: 0.92 },
    blurb: 'Made for a field. A basement just swallows them.',
  },
  'perfect-opener': {
    trait: t('perfect-opener', 'Perfect Opener', 'Warms a room like a struck match', TraitType.SOCIAL),
    effect: { when: 'fullBill', attendanceMult: 1.06 },
    otherwise: { attendanceMult: 0.9 },
    blurb: 'Never headlined, never needed to. They warm a room like a struck match.',
  },
  'headline-draw': {
    trait: t('headline-draw', 'Headline Draw', 'The name alone moves tickets', TraitType.SOCIAL),
    effect: { when: 'soloBill', attendanceMult: 1.12 },
    otherwise: { attendanceMult: 0.92 },
    blurb: 'The name alone moves tickets. Do not bury them mid-bill.',
  },
  'gas-money': {
    trait: t('gas-money', 'Works For Gas Money', 'Cheap, and not bitter about it', TraitType.PERSONALITY),
    effect: { when: 'always', feeMult: 0.7 },
    blurb: 'They will take a tank of gas and a pizza, and mean it.',
  },
  'volatile': {
    trait: t('volatile', 'Volatile', 'Incandescent or a car crash', TraitType.PERFORMANCE),
    effect: { when: 'always', attendanceMult: 1.1, stressDelta: 4 },
    blurb: 'Incandescent or a car crash. Nobody looks away either way.',
  },
  'players-players': {
    trait: t('players-players', 'Players’ Players', 'Musicians’ musicians', TraitType.TECHNICAL),
    effect: { when: 'fullBill', repMult: 1.1 },
    otherwise: { repMult: 0.94 },
    blurb: 'Every other band on the bill plays a little better that night.',
  },
  'hometown-heroes': {
    trait: t('hometown-heroes', 'Hometown Heroes', 'Everyone here knows someone on stage', TraitType.SOCIAL),
    effect: { when: 'smallRoom', fanMult: 1.1 },
    otherwise: { fanMult: 0.94 },
    blurb: 'Everyone in the room went to school with someone on stage.',
  },
  'road-dogs': {
    trait: t('road-dogs', 'Road Dogs', 'Two hundred shows a year', TraitType.PERSONALITY),
    effect: { when: 'always', stressDelta: -3 },
    blurb: 'Two hundred shows a year. Nothing rattles them anymore.',
  },
};

export const TRAIT_IDS = Object.keys(BAND_TRAIT_CATALOG);

/** Human-readable condition, for the card and the booking preview. */
export const CONDITION_LABEL: Record<TraitCondition, string> = {
  always: 'always',
  smallRoom: 'in small rooms',
  bigRoom: 'in big rooms',
  allAges: 'at all-ages shows',
  bar: 'at rooms with a bar',
  soloBill: 'playing alone',
  fullBill: 'on a shared bill',
};

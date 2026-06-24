import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';

/**
 * The title screen is a live diorama of the player's career: it grows from a tiny
 * basement gig to a stadium-sized festival as you rack up cumulative score across
 * runs. Mirrors the game's whole arc — "from breaking even to breaking through."
 */
export type TitleTierId = 'basement' | 'dive' | 'theater' | 'festival';

export interface TitleTier {
  id: TitleTierId;
  index: number;
  /** Venue name shown under the logo. */
  venue: string;
  /** One-line flavor. */
  blurb: string;
  /** Tier 3 spills outdoors (dusk sky + city skyline behind the fest). */
  outdoor: boolean;
  /** How many cute pixel figures pack the crowd. */
  crowd: number;
  /** Accent / stage-light color for this tier. */
  accent: string;
}

export const TITLE_TIERS: TitleTier[] = [
  { id: 'basement', index: 0, venue: 'The Basement', blurb: 'Five bucks at the door', outdoor: false, crowd: 6,  accent: '#f72585' },
  { id: 'dive',     index: 1, venue: 'The Dive Bar', blurb: 'Sticky floors, louder amps', outdoor: false, crowd: 11, accent: '#4cc9f0' },
  { id: 'theater',  index: 2, venue: 'The Theater',  blurb: 'Your name on the marquee', outdoor: false, crowd: 18, accent: '#ffd23f' },
  { id: 'festival', index: 3, venue: 'The Festival', blurb: 'Breakthrough', outdoor: true, crowd: 34, accent: '#3ad17e' },
];

// Cumulative-score thresholds (totalScore never decreases, unlike spendable fame).
// A single breakthrough win is worth tens of thousands, so these gate roughly on
// "a few wins → a strong career". Tunable; the diorama just reads the bracket.
const THRESHOLDS = [0, 45_000, 160_000, 450_000];

/** Resolve the current title tier from meta progression (with a ?tier=0..3 dev override). */
export function getTitleTier(): TitleTier {
  if (typeof window !== 'undefined') {
    const forced = new URLSearchParams(window.location.search).get('tier');
    if (forced != null && forced !== '') {
      const i = Math.max(0, Math.min(TITLE_TIERS.length - 1, parseInt(forced, 10) || 0));
      return TITLE_TIERS[i];
    }
  }
  let score = 0;
  try {
    const p = metaProgressionManager.getProgression();
    // totalScore is the cumulative career metric; fall back to best single score.
    score = p.totalScore || Math.max(0, ...Object.values(p.stats?.bestScores ?? { _: 0 }));
  } catch {
    /* meta not ready (first launch) → basement */
  }
  let tier = TITLE_TIERS[0];
  for (let i = 0; i < TITLE_TIERS.length; i++) {
    if (score >= THRESHOLDS[i]) tier = TITLE_TIERS[i];
  }
  return tier;
}

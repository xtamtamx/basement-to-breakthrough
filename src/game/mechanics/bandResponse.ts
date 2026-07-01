/**
 * bandResponse — how a band reacts to WHO you are as a promoter.
 *
 * A band weighs your Scene Identity (the DIY↔sellout axis, from `diyPoints`) and
 * your reputation against its own lean, and bends its asking price accordingly:
 *  - A purist (high-authenticity) act cuts a DIY promoter a break and plays for
 *    the cred — but distrusts a sellout and charges a premium to slum it.
 *  - A commercial (low-authenticity) act wants a name behind it: a small, cred-only
 *    promoter pays up, while reach (high rep) or a fellow careerist earns a discount.
 *  - Middle-of-the-road acts don't care who you are.
 *
 * Choices have consequences — but nobody flatly refuses (yet), so the scene stays
 * playable. Pure: no mutation, safe from render, the preview, AND the resolver, so
 * the previewed fee always equals what actually gets charged (given the same state).
 * The card shows the RESULT ("−20% · respects your DIY cred"), never the math.
 */
import { Band } from '@game/types';
import { getSceneIdentityTier } from './sceneIdentity';

/** Authenticity at/above which a band reads as a DIY purist. */
export const PURIST_AUTHENTICITY = 75;
/** Authenticity at/below which a band reads as a commercial act. */
export const COMMERCIAL_AUTHENTICITY = 50;

export interface BandResponse {
  /** Multiplier on the band's booking fee (1 = neutral, <1 discount, >1 premium). */
  costMult: number;
  /** Short player-facing note (the result + why), or null when the band is neutral. */
  note: string | null;
  /** Tint for the note. */
  tone: 'good' | 'bad' | 'neutral';
}

const NEUTRAL: BandResponse = { costMult: 1, note: null, tone: 'neutral' };

/** How the given band responds to a promoter of this alignment + reputation. */
export function bandResponse(band: Band, diyPoints: number, reputation: number): BandResponse {
  const tier = getSceneIdentityTier(diyPoints).key;
  const auth = band.authenticity;

  // Purist act: rewards cred, resents a sellout.
  if (auth >= PURIST_AUTHENTICITY) {
    switch (tier) {
      case 'PURE_DIY':
        return { costMult: 0.75, note: '−25% · down for the cause', tone: 'good' };
      case 'DIY_LEANING':
        return { costMult: 0.85, note: '−15% · respects your cred', tone: 'good' };
      case 'CORPORATE_LEANING':
        return { costMult: 1.25, note: "+25% · doesn't trust your motives", tone: 'bad' };
      case 'FULL_SELLOUT':
        return { costMult: 1.5, note: '+50% · barely tolerates you', tone: 'bad' };
      default:
        return NEUTRAL; // BALANCED
    }
  }

  // Commercial act: wants a name/stage. A small cred-only promoter pays up;
  // reach (rep) or a fellow careerist gets a break.
  if (auth <= COMMERCIAL_AUTHENTICITY) {
    const diyLeaning = tier === 'DIY_LEANING' || tier === 'PURE_DIY';
    const selloutLeaning = tier === 'CORPORATE_LEANING' || tier === 'FULL_SELLOUT';
    if (reputation < 30 && diyLeaning) {
      return { costMult: 1.3, note: '+30% · wants a bigger name', tone: 'bad' };
    }
    if (reputation >= 60 || selloutLeaning) {
      return { costMult: 0.85, note: '−15% · likes your reach', tone: 'good' };
    }
    return NEUTRAL;
  }

  // Middle-of-the-road: doesn't care who you are.
  return NEUTRAL;
}

/** Convenience: the fee multiplier only. */
export function bandResponseMult(band: Band, diyPoints: number, reputation: number): number {
  return bandResponse(band, diyPoints, reputation).costMult;
}

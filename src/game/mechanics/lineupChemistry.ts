import { Band } from '@game/types';
import { factionSystem } from './FactionSystem';
import { bandRelationships } from './BandRelationships';

/**
 * Bill chemistry — how the bands on a multi-band bill get along, and what that
 * does to the crowd. The effective relationship for a pair is their PURE faction
 * affinity (same scene = friendly, rival factions = bad blood) PLUS the co-billing
 * drift that accrues across the run (BandRelationships). Computing it purely (no
 * singleton mutation) means the ShowBuilder preview and executeShow agree exactly.
 */
export interface LineupChemistry {
  /** Compressed + clamped attendance multiplier (felt ~0.88..1.12). 1 for solo bills. */
  mult: number;
  /** Average effective pair relationship (−100..100). 0 for solo bills. */
  avg: number;
  /** Human-readable warnings for hostile pairs (drives the Bill Chemistry panel). */
  conflicts: string[];
  /** True when at least one pair is openly hostile (effective < −30). */
  hostile: boolean;
}

/** Effective relationship between two bands: faction affinity + co-billing drift. */
export function pairRelationship(b1: Band, b2: Band): number {
  const base = factionSystem.factionPairAffinity(b1, b2);
  const drift = bandRelationships.getRelationship(b1.id, b2.id);
  return Math.max(-100, Math.min(100, base + drift));
}

export function computeLineupChemistry(bands: Band[]): LineupChemistry {
  if (bands.length < 2) return { mult: 1, avg: 0, conflicts: [], hostile: false };

  let total = 0;
  let pairs = 0;
  const conflicts: string[] = [];
  let hostile = false;

  for (let i = 0; i < bands.length; i++) {
    for (let j = i + 1; j < bands.length; j++) {
      const r = pairRelationship(bands[i], bands[j]);
      total += r;
      pairs += 1;
      if (r < -50) { conflicts.push(`${bands[i].name} & ${bands[j].name} — bad blood`); hostile = true; }
      else if (r < -30) { conflicts.push(`${bands[i].name} & ${bands[j].name} — tension`); hostile = true; }
      else if (r > 50) conflicts.push(`${bands[i].name} & ${bands[j].name} — tight`);
    }
  }

  const avg = total / pairs;
  // BandRelationships' own scale: 1 + avg/200 → 0.5..1.5. Swing-compress by 0.4
  // and clamp so a bill's chemistry stays a side-grade (smaller than +20%/band),
  // never a ceiling-raiser — protects the balance sim.
  const raw = 1 + avg / 200;
  const mult = Math.max(0.88, Math.min(1.12, 1 + (raw - 1) * 0.4));
  return { mult, avg, conflicts, hostile };
}

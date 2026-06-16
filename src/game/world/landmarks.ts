/**
 * landmarks - permanent monuments your scene earns (living-city Pillar B).
 *
 * As you discover synergies and rack up cross-run unlocks, your town grows
 * landmarks that reflect WHO YOU ARE:
 *   - DIY scene anchors (a legendary record store, an all-ages hall) that
 *     protect their district from gentrification.
 *   - Sellout monuments (a label HQ, a sponsor arena) that pay passive money.
 *   - Scene history (founders' plaques) — cosmetic, a visible record of the run.
 *
 * Like cityShops, landmarks are a PURE function of accumulated state (alignment,
 * in-run discoveries, cross-run meta progress). They accrete across runs because
 * the meta-progress input only grows. No imperative "plant" events, no new
 * persisted state — the map renderer, GentrificationSystem and the turn economy
 * all derive the same list and stay in lockstep.
 */
import { District } from '@game/types';

export type LandmarkAlignment = 'diy' | 'corporate' | 'history';

export enum LandmarkKind {
  // DIY scene anchors
  RECORD_SHRINE = 'RECORD_SHRINE',
  ALLAGES_HALL = 'ALLAGES_HALL',
  ZINE_ARCHIVE = 'ZINE_ARCHIVE',
  // Sellout monuments
  LABEL_HQ = 'LABEL_HQ',
  SPONSOR_ARENA = 'SPONSOR_ARENA',
  BRAND_TOWER = 'BRAND_TOWER',
  // Scene history
  FOUNDERS_PLAQUE = 'FOUNDERS_PLAQUE',
  FIRST_STAGE = 'FIRST_STAGE',
}

export interface LandmarkEffect {
  /** Multiplier on this district's gentrification creep (0.5 = half). */
  creepMult?: number;
  /** Scene strength can't fall below this floor while the landmark stands. */
  sceneFloor?: number;
  /** Passive $/turn the landmark generates. */
  passiveMoney?: number;
}

export interface CityLandmark {
  id: string;
  name: string;
  kind: LandmarkKind;
  alignment: LandmarkAlignment;
  districtId: string;
  blurb: string;
  effect: LandmarkEffect;
}

export interface LandmarkContext {
  /** DIY (+) ↔ sellout (−) alignment, −100..+100. Decides the landmark's pole. */
  diyPoints?: number;
  /** Synergies discovered this run — immediate in-run progress. */
  discoveredCount?: number;
  /** Cross-run meta progress (totalRuns + unlocks + achievements). Only grows. */
  metaProgress?: number;
}

interface KindDef { name: string; blurb: string; effect: LandmarkEffect }

const DIY_KINDS: Record<string, KindDef> = {
  [LandmarkKind.RECORD_SHRINE]: { name: 'The Vinyl Cathedral', blurb: 'A record store so legendary the dust is collectible. Keeps the block honest.', effect: { creepMult: 0.5, sceneFloor: 55 } },
  [LandmarkKind.ALLAGES_HALL]: { name: 'The All-Ages Hall', blurb: 'No booze, no bouncers, no barriers. Where the next generation is born.', effect: { creepMult: 0.5, sceneFloor: 55 } },
  [LandmarkKind.ZINE_ARCHIVE]: { name: 'The Zine Archive', blurb: 'Decades of cut-and-paste history, photocopied and immortal.', effect: { creepMult: 0.55, sceneFloor: 50 } },
};
const CORP_KINDS: Record<string, KindDef> = {
  [LandmarkKind.LABEL_HQ]: { name: 'Monolith Records HQ', blurb: 'They signed you, then signed everyone. The checks clear, the soul does not.', effect: { passiveMoney: 65 } },
  [LandmarkKind.SPONSOR_ARENA]: { name: 'The OmniDome', blurb: 'Twenty thousand seats, presented by a soft-drink conglomerate.', effect: { passiveMoney: 75 } },
  [LandmarkKind.BRAND_TOWER]: { name: 'Brand Tower', blurb: 'A glass spire of synergy decks and "authentic engagement" metrics.', effect: { passiveMoney: 60 } },
};
const HIST_KINDS: Record<string, KindDef> = {
  [LandmarkKind.FOUNDERS_PLAQUE]: { name: "Founders' Plaque", blurb: 'On this spot, against all advice, the scene began.', effect: {} },
  [LandmarkKind.FIRST_STAGE]: { name: 'The First Stage', blurb: 'A plywood riser, preserved. You played your first show here.', effect: {} },
};

const POOLS: Record<LandmarkAlignment, { kind: LandmarkKind; def: KindDef }[]> = {
  diy: Object.entries(DIY_KINDS).map(([kind, def]) => ({ kind: kind as LandmarkKind, def })),
  corporate: Object.entries(CORP_KINDS).map(([kind, def]) => ({ kind: kind as LandmarkKind, def })),
  history: Object.entries(HIST_KINDS).map(([kind, def]) => ({ kind: kind as LandmarkKind, def })),
};

// progress (meta + in-run) → how many landmarks the scene has earned.
const THRESHOLDS = [2, 5, 9, 14];

function alignmentFor(diy: number): LandmarkAlignment {
  if (diy >= 15) return 'diy';
  if (diy <= -15) return 'corporate';
  return 'history';
}

/**
 * Derive the city's landmarks. Earned count grows with progress (capped at the
 * number of districts so it never clutters); each lands in a distinct district —
 * DIY anchors gravitate to the strongest scenes, monuments to the most
 * gentrified blocks, history to the oldest.
 */
export function getCityLandmarks(districts: District[], ctx: LandmarkContext = {}): CityLandmark[] {
  if (districts.length === 0) return [];
  const diy = ctx.diyPoints ?? 0;
  const progress = (ctx.metaProgress ?? 0) + (ctx.discoveredCount ?? 0);
  const earned = Math.min(
    THRESHOLDS.filter((t) => progress >= t).length,
    districts.length,
  );
  if (earned === 0) return [];

  const alignment = alignmentFor(diy);
  const pool = POOLS[alignment];

  // Pick host districts: strongest scenes for DIY, most gentrified for sellout,
  // else by id (stable). One landmark per district.
  const hosts = [...districts].sort((a, b) =>
    alignment === 'corporate'
      ? b.gentrificationLevel - a.gentrificationLevel
      : alignment === 'diy'
        ? b.sceneStrength - a.sceneStrength
        : a.id.localeCompare(b.id),
  );

  const out: CityLandmark[] = [];
  for (let i = 0; i < earned; i++) {
    const host = hosts[i];
    const { kind, def } = pool[i % pool.length];
    out.push({
      id: `landmark_${host.id}_${kind}`,
      name: def.name,
      kind,
      alignment,
      districtId: host.id,
      blurb: def.blurb,
      effect: def.effect,
    });
  }
  return out;
}

/** Per-district gentrification modifiers from any anchors standing there. */
export function districtLandmarkMods(landmarks: CityLandmark[]): Map<string, { creepMult: number; sceneFloor: number }> {
  const m = new Map<string, { creepMult: number; sceneFloor: number }>();
  for (const l of landmarks) {
    if (l.effect.creepMult == null && l.effect.sceneFloor == null) continue;
    const prev = m.get(l.districtId) ?? { creepMult: 1, sceneFloor: 0 };
    m.set(l.districtId, {
      creepMult: Math.min(prev.creepMult, l.effect.creepMult ?? 1),
      sceneFloor: Math.max(prev.sceneFloor, l.effect.sceneFloor ?? 0),
    });
  }
  return m;
}

/** Total passive $/turn from every monument in the city. */
export function landmarkPassiveMoney(landmarks: CityLandmark[]): number {
  return landmarks.reduce((sum, l) => sum + (l.effect.passiveMoney ?? 0), 0);
}

/** Cross-run progress signal — monotonic across runs, so landmarks accrete. */
export function metaProgressValue(p: { totalRuns: number; unlocks: string[]; achievements: unknown[] }): number {
  return p.totalRuns + p.unlocks.length + p.achievements.length;
}

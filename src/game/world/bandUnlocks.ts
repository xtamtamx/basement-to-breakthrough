/**
 * bandUnlocks — which Long Island bands are signable yet.
 *
 * Balatro-style drip tuned for REPLAY VARIETY. You start with ~12 scrappy low-pop
 * locals (every genre represented) and unlock the bigger acts — up to the home-town
 * legends — by playing DIFFERENTLY: win each mode, climb the stakes, win DIY and
 * sellout, run clean, sell rooms out, plus a few cumulative gates for a steady early
 * drip. Each unlock persists cross-run in MetaProgression, so it stays earned.
 *
 * Mirrors the cityUnlocks.ts pattern (hasUnlock/recordUnlock + a `band_${id}`
 * namespace). "Locked" is a pure meta overlay — `allBands` holds the full roster, so
 * the sim and save-resume paths are untouched; the UI renders locked bands as "???"
 * teaser cards and refuses to sign them.
 */
import { metaProgressionManager } from "@game/mechanics/MetaProgressionManager";
import { isModeBeaten, MODE_ORDER } from "@game/mechanics/modeUnlocks";
import { stakesManager, STAKE_TIERS } from "@game/mechanics/StakesManager";

export const bandUnlockId = (bandId: string): string => `band_${bandId}`;

/**
 * Always-unlocked from the first game: the lowest-popularity locals, one-or-more of
 * every genre, so the opening roster is playable and varied while the famous acts
 * stay as unlock bait. The balance sim signs the first-3 bands by array order
 * (lowest popularity) and wins on them — keep these in the starter set.
 */
export const STARTER_BAND_IDS: ReadonlySet<string> = new Set([
  "automedication",          // EMO
  "life-of-a-speculator",    // PUNK
  "the-constant-ache",       // PUNK
  "darker-halftime",         // HARDCORE
  "felony-in-mono-is-dead",  // EMO
  "get-warner",              // PUNK
  "into-the-floodlights",    // INDIE
  "lucy-grave",              // EMO
  "this-is-just-the-ending", // HARDCORE
  "weight-of-the-word",      // METAL
  "believe-what-we-sold-you",// ALTERNATIVE
  "termites-in-his-teeth",   // METAL
]);

/**
 * No hidden/secret bands in the single-city demo — the Long Island roster IS the
 * game. Kept (empty) so callers asking "is this band hidden from the roster
 * entirely?" still resolve to false.
 */
export const SECRET_BAND_IDS: ReadonlySet<string> = new Set();

const MODE_NAME: Record<string, string> = {
  classic: "Classic", speed: "Speed", festival: "Festival", hardcore: "Hardcore",
};

/** Recorded run-end achievement flags (a band gate can require one). */
export const FEAT = {
  winDiy: "feat_win_diy",
  winSellout: "feat_win_sellout",
  flawless: "feat_flawless",
  soldOut: "feat_sold_out",
  winNoFuture: "feat_win_no_future",
} as const;

type Cond =
  | { kind: "runs"; value: number }
  | { kind: "shows"; value: number }
  | { kind: "fans"; value: number }
  | { kind: "revenue"; value: number }
  | { kind: "beatMode"; mode: string }
  | { kind: "stakeTier"; value: number } // max unlocked stake tier across modes >= value
  | { kind: "feat"; flag: string; label: string };

interface BandUnlockRule { id: string; cond: Cond }

/**
 * The 20 locked bands, lowest-pop first. Cumulative + run-count gates front-load the
 * early drip; mode/stake/feat gates reward playing differently. The home-town
 * legends sit at the end behind the hardest asks.
 */
const BAND_UNLOCKS: BandUnlockRule[] = [
  // Steady early drip (cumulative + runs)
  { id: "save-each-otter", cond: { kind: "shows", value: 10 } },
  { id: "cost-of-leaving", cond: { kind: "runs", value: 2 } },
  { id: "monocultured", cond: { kind: "fans", value: 600 } },
  { id: "making-mountains", cond: { kind: "revenue", value: 4000 } },
  { id: "no-foolin-eyes", cond: { kind: "shows", value: 25 } },
  { id: "built-for-greased", cond: { kind: "runs", value: 3 } },
  { id: "pictures-and-sentences", cond: { kind: "fans", value: 2000 } },
  { id: "needles-in-the-spaces", cond: { kind: "revenue", value: 10000 } },
  { id: "release-the-cured", cond: { kind: "shows", value: 50 } },
  { id: "too-bad-so-beautiful", cond: { kind: "runs", value: 5 } },
  // The modern wave — the current scene rises as your own matures
  { id: "would-you-even-notice", cond: { kind: "fans", value: 5000 } },
  { id: "a-practice-in-patients", cond: { kind: "shows", value: 75 } },
  { id: "stuck-on-repeat", cond: { kind: "runs", value: 8 } },
  { id: "tend-your-plot", cond: { kind: "fans", value: 8000 } },
  { id: "stain-my-memory", cond: { kind: "revenue", value: 25000 } },
  // Play differently (variety + skill)
  { id: "we-are-still-awake", cond: { kind: "feat", flag: FEAT.winDiy, label: "Win a DIY-aligned run" } },
  { id: "bliss-to-eviction", cond: { kind: "beatMode", mode: "festival" } },
  { id: "the-walking-worried", cond: { kind: "beatMode", mode: "speed" } },
  { id: "forty-hour-delay", cond: { kind: "beatMode", mode: "classic" } },
  { id: "worship-and-trouble", cond: { kind: "feat", flag: FEAT.flawless, label: "Win with zero disasters" } },
  { id: "liminal-criminals", cond: { kind: "feat", flag: FEAT.soldOut, label: "Sell out 3 shows in a run" } },
  { id: "your-favorite-weakness", cond: { kind: "stakeTier", value: 2 } },  // win Pay to Play
  { id: "tyranny-and-mutiny", cond: { kind: "stakeTier", value: 3 } },      // win Sellout Pressure
  { id: "stay-angry", cond: { kind: "feat", flag: FEAT.winSellout, label: "Win a sellout-aligned run" } },
  { id: "tell-all-frenemies", cond: { kind: "feat", flag: FEAT.winNoFuture, label: "Win a No Future run" } },
];

const RULE_BY_ID = new Map(BAND_UNLOCKS.map((r) => [r.id, r]));
/** The only ids that can be locked. Anything else (starters, or a future band not
 *  yet added to the table) defaults to UNLOCKED — never accidentally hidden. */
const LOCKED_IDS: ReadonlySet<string> = new Set(BAND_UNLOCKS.map((r) => r.id));
const FEAT_FLAGS = Object.values(FEAT);

export interface MetaSnapshot {
  totalRuns: number;
  totalShows: number;
  totalFans: number;
  totalRevenue: number;
  beaten: ReadonlySet<string>;
  maxStakeTier: number;
  feats: ReadonlySet<string>;
}

/** Persistent cross-run signals the unlock conditions test against. */
export function metaSnapshot(): MetaSnapshot {
  const p = metaProgressionManager.getProgression();
  return {
    totalRuns: p.totalRuns,
    totalShows: p.stats.totalShows,
    totalFans: p.stats.totalFans,
    totalRevenue: p.stats.totalRevenue,
    beaten: new Set(MODE_ORDER.filter((m) => isModeBeaten(m))),
    maxStakeTier: Math.max(0, ...MODE_ORDER.map((m) => stakesManager.getUnlockedTier(m))),
    feats: new Set(FEAT_FLAGS.filter((f) => metaProgressionManager.hasUnlock(f))),
  };
}

const condMet = (c: Cond, s: MetaSnapshot): boolean => {
  switch (c.kind) {
    case "runs": return s.totalRuns >= c.value;
    case "shows": return s.totalShows >= c.value;
    case "fans": return s.totalFans >= c.value;
    case "revenue": return s.totalRevenue >= c.value;
    case "beatMode": return s.beaten.has(c.mode);
    case "stakeTier": return s.maxStakeTier >= c.value;
    case "feat": return s.feats.has(c.flag);
  }
};

const condProgress = (c: Cond, s: MetaSnapshot): { current: number; target: number } | null => {
  switch (c.kind) {
    case "runs": return { current: s.totalRuns, target: c.value };
    case "shows": return { current: s.totalShows, target: c.value };
    case "fans": return { current: s.totalFans, target: c.value };
    case "revenue": return { current: s.totalRevenue, target: c.value };
    default: return null; // variety milestones are binary — hint only
  }
};

const condHint = (c: Cond): string => {
  switch (c.kind) {
    case "runs": return c.value === 1 ? "Finish your first run" : `Finish ${c.value} runs`;
    case "shows": return `Book ${c.value} shows all-time`;
    case "fans": return `Reach ${c.value.toLocaleString()} total fans`;
    case "revenue": return `Earn $${c.value.toLocaleString()} all-time`;
    case "beatMode": return `Win a ${MODE_NAME[c.mode] ?? c.mode} run`;
    case "stakeTier": return `Win a ${STAKE_TIERS[c.value - 1]?.name ?? `tier ${c.value}`} run`;
    case "feat": return c.label;
  }
};

/** Is this band signable right now? Locked only if it's in the locked table and
 *  hasn't been earned yet — starters and any unknown id are always unlocked. */
export function isBandUnlocked(bandId: string): boolean {
  if (!LOCKED_IDS.has(bandId)) return true;
  return metaProgressionManager.hasUnlock(bandUnlockId(bandId));
}

/** Hidden from the roster entirely (secret AND not yet unlocked). No secret bands
 *  exist in the demo, so this is always false — kept for the BandsView call site. */
export function isBandHidden(bandId: string): boolean {
  return SECRET_BAND_IDS.has(bandId) && !isBandUnlocked(bandId);
}

export interface BandLockInfo {
  unlocked: boolean;
  hint: string | null;
  progress: { current: number; target: number } | null;
}

/** UI helper: lock state + hint + (numeric) progress for a single band. */
export function bandLockInfo(bandId: string, snap: MetaSnapshot = metaSnapshot()): BandLockInfo {
  if (isBandUnlocked(bandId)) return { unlocked: true, hint: null, progress: null };
  const rule = RULE_BY_ID.get(bandId);
  if (!rule) return { unlocked: true, hint: null, progress: null };
  return { unlocked: false, hint: condHint(rule.cond), progress: condProgress(rule.cond, snap) };
}

export interface RunFeatContext {
  isWin: boolean;
  pathAlignment: string;
  stakeTier: number;
  disasters: number;
  perfectShows: number;
}

/**
 * Record the variety FEAT flags earned by a finished run (DIY/sellout win, clean
 * run, sold-out streak, top-stake win). Persistent + idempotent. Call at run end
 * BEFORE recordBandUnlocks so the feat-gated bands see the new flag this same run.
 */
export function recordRunFeats(ctx: RunFeatContext): void {
  if (!ctx.isWin) return;
  const diy = ctx.pathAlignment === "PURE_DIY" || ctx.pathAlignment === "DIY_LEANING";
  const sellout = ctx.pathAlignment === "FULL_SELLOUT" || ctx.pathAlignment === "CORPORATE_LEANING";
  if (diy) metaProgressionManager.recordUnlock(FEAT.winDiy);
  if (sellout) metaProgressionManager.recordUnlock(FEAT.winSellout);
  if (ctx.disasters === 0) metaProgressionManager.recordUnlock(FEAT.flawless);
  if (ctx.perfectShows >= 3) metaProgressionManager.recordUnlock(FEAT.soldOut);
  if (ctx.stakeTier >= 3) metaProgressionManager.recordUnlock(FEAT.winNoFuture);
}

/**
 * Record any locked bands whose milestone is now met. Returns the bands unlocked
 * THIS call so the run-end ceremony can announce them. Idempotent (replay-safe).
 */
export function recordBandUnlocks(allBands: { id: string; name: string }[]): { id: string; name: string }[] {
  const snap = metaSnapshot();
  const nameById = new Map(allBands.map((b) => [b.id, b.name]));
  const fresh: { id: string; name: string }[] = [];
  for (const rule of BAND_UNLOCKS) {
    if (metaProgressionManager.hasUnlock(bandUnlockId(rule.id))) continue;
    if (!condMet(rule.cond, snap)) continue;
    if (metaProgressionManager.recordUnlock(bandUnlockId(rule.id))) {
      fresh.push({ id: rule.id, name: nameById.get(rule.id) ?? rule.id });
    }
  }
  return fresh;
}

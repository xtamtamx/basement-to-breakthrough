/**
 * bandUnlocks — which bands are signable yet.
 *
 * Balatro-style drip tuned to encourage REPLAY VARIETY: a STARTER set is always
 * available, and the rest unlock cross-run by playing DIFFERENTLY — win each mode,
 * clear higher stakes, tour new cities, win on both the DIY and sellout paths, run
 * clean or sell a room out — rather than grinding the same Classic run. A handful
 * of cumulative + run-count gates keep a steady early drip. Each unlock persists in
 * MetaProgression, so it stays earned forever.
 *
 * Mirrors the cityUnlocks.ts pattern (hasUnlock/recordUnlock + a `band_${id}` id
 * namespace). "Locked" is a pure meta overlay — `allBands` still holds the full
 * authored roster, so the sim and save-resume paths are untouched.
 */
import { metaProgressionManager } from "@game/mechanics/MetaProgressionManager";
import { isModeBeaten, MODE_ORDER } from "@game/mechanics/modeUnlocks";
import { stakesManager, STAKE_TIERS } from "@game/mechanics/StakesManager";
import { cityUnlockId } from "@game/world/cityUnlocks";

export const bandUnlockId = (bandId: string): string => `band_${bandId}`;

/**
 * Always-unlocked from the first game: the three weakest punk bands at array
 * indices 0-2 (the balance sim signs the first-3 by order and wins on them) PLUS
 * one band of every other genre, so the opening roster has full genre variety
 * while ~2/3 of the roster stays as unlock bait.
 */
export const STARTER_BAND_IDS: ReadonlySet<string> = new Set([
  "basement-punks", "angry-neighbors", "broken-strings", // punk trio — sim floor, keep first
  "doom-bringers",        // METAL
  "pit-warriors",         // HARDCORE
  "noise-collective",     // EXPERIMENTAL
  "flannel-core",         // GRUNGE
  "swamp-lords",          // SLUDGE
  "30-second-songs",      // POWERVIOLENCE
  "indie-darlings",       // INDIE
  "group-chat-silence",   // EMO
  "tinnitus-as-intended", // NOISE
  "the-snooze-button",    // DOOM
  "almost-licensed",      // ALTERNATIVE
]);

const MODE_NAME: Record<string, string> = {
  classic: "Classic", speed: "Speed", festival: "Festival", hardcore: "Hardcore",
};

/** Tour cities a band can be gated behind (id → display name). */
const CITY_NAME: Record<string, string> = {
  bostland: "Bostland", detroleans: "Detroleans", nasheattle: "Nasheattle",
  chicaustin: "Chicaustin", newangeles: "New Angeles",
};

/** Recorded run-end achievement flags (a band gate can require one). */
export const FEAT = {
  winDiy: "feat_win_diy",
  winSellout: "feat_win_sellout",
  flawless: "feat_flawless",
  soldOut: "feat_sold_out",
  winNoFuture: "feat_win_no_future",
  // Hidden gate for the Long Island scene — set ONLY by a private/secret trigger
  // (friends/demo), never by normal play. Until then the LI bands stay invisible.
  longIsland: "feat_long_island",
} as const;

type Cond =
  // cumulative counters (numeric progress) — a steady baseline drip
  | { kind: "runs"; value: number }
  | { kind: "shows"; value: number }
  | { kind: "fans"; value: number }
  | { kind: "revenue"; value: number }
  // variety milestones (binary — each pulls a DIFFERENT kind of run)
  | { kind: "beatMode"; mode: string }
  | { kind: "stakeTier"; value: number } // max unlocked stake tier across modes >= value
  | { kind: "city"; city: string }       // toured (rep-unlocked) this city
  | { kind: "feat"; flag: string; label: string };

interface BandUnlockRule { id: string; cond: Cond }

/**
 * The 22 locked bands, weighted toward VARIETY: 4 mode wins, 2 stake clears + the
 * top-stake feat, 5 city tours, DIY/sellout/clean/sold-out feats, run-count
 * dedication, and a few cumulative keepers. Chasing the full roster means winning
 * across modes, stakes, cities, and playstyles — i.e. replaying differently.
 */
const BAND_UNLOCKS: BandUnlockRule[] = [
  // Win each mode
  { id: "frostbitten-cul-de-sac", cond: { kind: "beatMode", mode: "classic" } },
  { id: "blink-twice-fastcore", cond: { kind: "beatMode", mode: "speed" } },
  { id: "gentrify-this", cond: { kind: "beatMode", mode: "festival" } },
  { id: "direct-deposit-doom", cond: { kind: "beatMode", mode: "hardcore" } },
  // Climb the stakes
  { id: "technical-death", cond: { kind: "stakeTier", value: 2 } },        // win Pay to Play
  { id: "thrift-store-messiah", cond: { kind: "stakeTier", value: 3 } },   // win Sellout Pressure
  { id: "x-disappointed-dad-x", cond: { kind: "feat", flag: FEAT.winNoFuture, label: "Win a No Future run" } },
  // Tour the map
  { id: "road-dogs", cond: { kind: "city", city: "bostland" } },
  { id: "audience-of-phones", cond: { kind: "city", city: "detroleans" } },
  { id: "no-wave-goodbye", cond: { kind: "city", city: "nasheattle" } },
  { id: "soundcheck-forever", cond: { kind: "city", city: "chicaustin" } },
  { id: "two-drink-minimum", cond: { kind: "city", city: "newangeles" } },
  // Play different ways
  { id: "mutual-aid-abettors", cond: { kind: "feat", flag: FEAT.winDiy, label: "Win a DIY-aligned run" } },
  { id: "thrift-store-cobain", cond: { kind: "feat", flag: FEAT.winSellout, label: "Win a sellout-aligned run" } },
  { id: "scene-veterans", cond: { kind: "feat", flag: FEAT.flawless, label: "Win with zero disasters" } },
  { id: "blastbeat-yourself-up", cond: { kind: "feat", flag: FEAT.soldOut, label: "Sell out 3 shows in a run" } },
  // Keep coming back
  { id: "reply-guys", cond: { kind: "runs", value: 3 } },
  { id: "frostbite-and-filing", cond: { kind: "runs", value: 7 } },
  { id: "the-loud-part", cond: { kind: "runs", value: 12 } },
  // Cumulative keepers (steady drip)
  { id: "landlord-deathwish", cond: { kind: "shows", value: 30 } },
  { id: "quarter-life-crisis", cond: { kind: "fans", value: 2000 } },
  { id: "couch-fort-collapse", cond: { kind: "revenue", value: 12000 } },

  // Long Island Easter egg — the home scene's legends. HIDDEN (SECRET_BAND_IDS)
  // AND gated on a private flag normal play never sets, so they're a friends/demo
  // unlock, not something a public playtester can stumble into. Flip the flag via
  // unlockLongIsland() (a deliberate secret trigger) to reveal all five at once.
  { id: "tell-all-frenemies", cond: { kind: "feat", flag: FEAT.longIsland, label: "Long Island" } },
  { id: "forty-hour-delay", cond: { kind: "feat", flag: FEAT.longIsland, label: "Long Island" } },
  { id: "your-favorite-weakness", cond: { kind: "feat", flag: FEAT.longIsland, label: "Long Island" } },
  { id: "worship-and-trouble", cond: { kind: "feat", flag: FEAT.longIsland, label: "Long Island" } },
  { id: "bliss-to-eviction", cond: { kind: "feat", flag: FEAT.longIsland, label: "Long Island" } },
];

/**
 * SECRET bands — the Long Island Easter egg. They don't show as "???" teaser
 * cards while locked (unlike the normal locked roster); they simply appear, with
 * the run-end "new band" beat, once their milestone is met — the home scene's
 * legends emerging as you earn your stripes. (Still recorded the same way.)
 */
export const SECRET_BAND_IDS: ReadonlySet<string> = new Set([
  "tell-all-frenemies", "your-favorite-weakness", "worship-and-trouble",
  "forty-hour-delay", "bliss-to-eviction",
]);
/** Hidden from the roster entirely (secret AND not yet unlocked). */
export function isBandHidden(bandId: string): boolean {
  return SECRET_BAND_IDS.has(bandId) && !isBandUnlocked(bandId);
}

/** Has the private Long Island scene been revealed on this device? */
export function isLongIslandUnlocked(): boolean {
  return metaProgressionManager.hasUnlock(FEAT.longIsland);
}

/**
 * The secret trigger (friends/demo): flip the hidden flag AND reveal the five LI
 * bands immediately (no run boundary needed). Persists cross-run. Wire this to
 * whatever private gesture/code we choose; normal play never calls it. Returns
 * true the first time it reveals the scene.
 */
export function unlockLongIsland(): boolean {
  const first = metaProgressionManager.recordUnlock(FEAT.longIsland);
  for (const id of SECRET_BAND_IDS) metaProgressionManager.recordUnlock(bandUnlockId(id));
  return first;
}

const RULE_BY_ID = new Map(BAND_UNLOCKS.map((r) => [r.id, r]));
/** The only ids that can be locked. Anything else (starters, or a future band not
 *  yet added to the table) defaults to UNLOCKED — never accidentally hidden. */
const LOCKED_IDS: ReadonlySet<string> = new Set(BAND_UNLOCKS.map((r) => r.id));
const TOUR_CITY_IDS = Object.keys(CITY_NAME);
const FEAT_FLAGS = Object.values(FEAT);

export interface MetaSnapshot {
  totalRuns: number;
  totalShows: number;
  totalFans: number;
  totalRevenue: number;
  beaten: ReadonlySet<string>;
  maxStakeTier: number;
  cities: ReadonlySet<string>;
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
    cities: new Set(TOUR_CITY_IDS.filter((c) => metaProgressionManager.hasUnlock(cityUnlockId(c)))),
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
    case "city": return s.cities.has(c.city);
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
    // stakeTier value N requires unlocking tier N = winning tier N-1.
    case "stakeTier": return `Win a ${STAKE_TIERS[c.value - 1]?.name ?? `tier ${c.value}`} run`;
    case "city": return `Tour ${CITY_NAME[c.city] ?? c.city}`;
    case "feat": return c.label;
  }
};

/** Is this band signable right now? Locked only if it's in the locked table and
 *  hasn't been earned yet — starters and any unknown id are always unlocked. */
export function isBandUnlocked(bandId: string): boolean {
  if (!LOCKED_IDS.has(bandId)) return true;
  return metaProgressionManager.hasUnlock(bandUnlockId(bandId));
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

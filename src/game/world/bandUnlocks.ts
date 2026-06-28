/**
 * bandUnlocks — which bands are signable yet.
 *
 * Balatro-style drip: a STARTER set is always available, and the rest unlock
 * cross-run by hitting cumulative milestones (lifetime shows / fans / revenue /
 * runs, or beating a mode). Each unlock is recorded in MetaProgression so it
 * PERSISTS ACROSS RUNS — once earned, the band stays signable forever. Front-
 * loaded thresholds mean most early runs pop at least one new band.
 *
 * Mirrors the cityUnlocks.ts pattern (hasUnlock/recordUnlock + a `band_${id}`
 * id namespace). "Locked" is a pure meta overlay — `allBands` still holds the
 * full authored roster, so the sim and save-resume paths are untouched; the UI
 * just renders locked bands as teaser cards and refuses to sign them.
 */
import { metaProgressionManager } from "@game/mechanics/MetaProgressionManager";
import { isModeBeaten, MODE_ORDER } from "@game/mechanics/modeUnlocks";

export const bandUnlockId = (bandId: string): string => `band_${bandId}`;

/**
 * Always-unlocked from the first game. Keeps the three weakest punk bands at
 * array indices 0-2 (the balance sim signs the first-3 by order and wins on
 * them — see balanceSim.sim.ts) PLUS one band of every other genre, so the
 * opening roster has full genre variety while ~2/3 of the roster stays as
 * unlock bait.
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

type Cond =
  | { kind: "runs"; value: number }
  | { kind: "shows"; value: number }
  | { kind: "fans"; value: number }
  | { kind: "revenue"; value: number }
  | { kind: "beatMode"; mode: string };

interface BandUnlockRule { id: string; cond: Cond }

/**
 * The 22 locked bands. Tiers are tuned against the sim baseline (~12 shows /
 * ~550 fans / ~3,800 revenue per winning run) so Tier 1 fires during/after run
 * 1, then the drip spaces out — the Balatro unlock curve.
 */
const BAND_UNLOCKS: BandUnlockRule[] = [
  // Tier 1 — first run or two (generous early drip)
  { id: "two-drink-minimum", cond: { kind: "runs", value: 1 } },
  { id: "road-dogs", cond: { kind: "shows", value: 8 } },
  { id: "thrift-store-cobain", cond: { kind: "fans", value: 400 } },
  { id: "scene-veterans", cond: { kind: "revenue", value: 2500 } },
  { id: "frostbitten-cul-de-sac", cond: { kind: "beatMode", mode: "classic" } },
  // Tier 2 — runs 2-3
  { id: "technical-death", cond: { kind: "shows", value: 25 } },
  { id: "reply-guys", cond: { kind: "runs", value: 2 } },
  { id: "audience-of-phones", cond: { kind: "fans", value: 1500 } },
  { id: "couch-fort-collapse", cond: { kind: "revenue", value: 8000 } },
  // Tier 3 — runs 3-5
  { id: "landlord-deathwish", cond: { kind: "shows", value: 50 } },
  { id: "quarter-life-crisis", cond: { kind: "fans", value: 3500 } },
  { id: "no-wave-goodbye", cond: { kind: "runs", value: 4 } },
  { id: "frostbite-and-filing", cond: { kind: "revenue", value: 18000 } },
  // Tier 4 — mode-win milestones (skill gates)
  { id: "blink-twice-fastcore", cond: { kind: "beatMode", mode: "speed" } },
  { id: "gentrify-this", cond: { kind: "beatMode", mode: "festival" } },
  { id: "direct-deposit-doom", cond: { kind: "beatMode", mode: "hardcore" } },
  // Tier 5 — long tail
  { id: "blastbeat-yourself-up", cond: { kind: "shows", value: 120 } },
  { id: "thrift-store-messiah", cond: { kind: "fans", value: 10000 } },
  { id: "soundcheck-forever", cond: { kind: "revenue", value: 50000 } },
  { id: "mutual-aid-abettors", cond: { kind: "runs", value: 8 } },
  { id: "the-loud-part", cond: { kind: "shows", value: 200 } },
  { id: "x-disappointed-dad-x", cond: { kind: "fans", value: 25000 } },
];

const RULE_BY_ID = new Map(BAND_UNLOCKS.map((r) => [r.id, r]));
/** The only ids that can be locked. Anything else (starters, or a future band
 *  not yet added to the table) defaults to UNLOCKED — never accidentally hidden. */
const LOCKED_IDS: ReadonlySet<string> = new Set(BAND_UNLOCKS.map((r) => r.id));

export interface MetaSnapshot {
  totalRuns: number;
  totalShows: number;
  totalFans: number;
  totalRevenue: number;
  beaten: ReadonlySet<string>;
}

/** Cumulative cross-run counters that unlock conditions test against. */
export function metaSnapshot(): MetaSnapshot {
  const p = metaProgressionManager.getProgression();
  return {
    totalRuns: p.totalRuns,
    totalShows: p.stats.totalShows,
    totalFans: p.stats.totalFans,
    totalRevenue: p.stats.totalRevenue,
    beaten: new Set(MODE_ORDER.filter((m) => isModeBeaten(m))),
  };
}

const condMet = (c: Cond, s: MetaSnapshot): boolean => {
  switch (c.kind) {
    case "runs": return s.totalRuns >= c.value;
    case "shows": return s.totalShows >= c.value;
    case "fans": return s.totalFans >= c.value;
    case "revenue": return s.totalRevenue >= c.value;
    case "beatMode": return s.beaten.has(c.mode);
  }
};

const condProgress = (c: Cond, s: MetaSnapshot): { current: number; target: number } | null => {
  switch (c.kind) {
    case "runs": return { current: s.totalRuns, target: c.value };
    case "shows": return { current: s.totalShows, target: c.value };
    case "fans": return { current: s.totalFans, target: c.value };
    case "revenue": return { current: s.totalRevenue, target: c.value };
    case "beatMode": return null;
  }
};

const condHint = (c: Cond): string => {
  switch (c.kind) {
    case "runs": return c.value === 1 ? "Finish your first run" : `Finish ${c.value} runs`;
    case "shows": return `Book ${c.value} shows all-time`;
    case "fans": return `Reach ${c.value.toLocaleString()} total fans`;
    case "revenue": return `Earn $${c.value.toLocaleString()} all-time`;
    case "beatMode": return `Win a ${MODE_NAME[c.mode] ?? c.mode} run`;
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
  /** "How do I unlock this?" line (null when already unlocked). */
  hint: string | null;
  /** Numeric progress toward the threshold (null for unlocked or milestone gates). */
  progress: { current: number; target: number } | null;
}

/** UI helper: lock state + a hint + progress for a single band. */
export function bandLockInfo(bandId: string, snap: MetaSnapshot = metaSnapshot()): BandLockInfo {
  if (isBandUnlocked(bandId)) return { unlocked: true, hint: null, progress: null };
  const rule = RULE_BY_ID.get(bandId);
  // Unknown id (not in the locked table and not a starter) — treat as unlocked
  // so a future data-file band is never accidentally hidden forever.
  if (!rule) return { unlocked: true, hint: null, progress: null };
  return { unlocked: false, hint: condHint(rule.cond), progress: condProgress(rule.cond, snap) };
}

/**
 * Record any locked bands whose milestone is now met (called once at run end,
 * AFTER this run's stats are folded into the lifetime totals). Returns the bands
 * unlocked THIS call so the run-end ceremony can announce them. Idempotent via
 * recordUnlock — a replayed conclusion won't re-fire.
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

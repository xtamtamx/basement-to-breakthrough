/**
 * Scene Identity — the player-facing read of the sellout↔DIY axis the game
 * already tracks via `diyPoints` (travel choices + event path forks feed it).
 *
 * The axis is a spectrum, not a binary: a pure-DIY lifer at one pole, a fully
 * cashed-out label mascot at the other, and a pragmatic striver in the middle
 * with one boot in the pit and one eye on the deal. These are fictional,
 * satirical archetypes — the cred-vs-comfort tension the underground argues
 * about forever, with none of the real names attached.
 *
 * Thresholds MIRROR the store's `pathAlignment` ladder (gameStore makePathChoice)
 * so the visible label never disagrees with the alignment the engine reasons
 * about. Tier is derived straight from `diyPoints` (the single source of truth)
 * rather than the stored string, so it can never go stale.
 */
export type SceneIdentityKey =
  | "PURE_DIY"
  | "DIY_LEANING"
  | "BALANCED"
  | "CORPORATE_LEANING"
  | "FULL_SELLOUT";

export interface SceneIdentityTier {
  key: SceneIdentityKey;
  /** Inclusive lower bound on diyPoints for this tier. */
  min: number;
  /** Short fictional archetype name shown on the meter. */
  label: string;
  /** One-line satirical flavor, revealed when the meter is expanded. */
  flavor: string;
  /** snes.css palette hex for this tier (green=cred … red=sellout). */
  color: string;
}

/**
 * Ordered DIY → sellout (highest diyPoints first), so a top-down `.find` on
 * `diyPoints >= min` lands on the correct tier. The last entry is the −∞ floor.
 */
export const SCENE_IDENTITY_TIERS: SceneIdentityTier[] = [
  {
    key: "PURE_DIY",
    min: 100,
    label: "DIY Lifer",
    flavor: "Plays basements for gas money — and means it.",
    color: "#3ad17e",
  },
  {
    key: "DIY_LEANING",
    min: 25,
    label: "Scene Builder",
    flavor: "Cred in the bank, ramen in the cupboard.",
    color: "#4cc9f0",
  },
  {
    key: "BALANCED",
    min: -25,
    label: "The Striver",
    flavor: "One boot in the pit, one eye on the deal.",
    color: "#ffd23f",
  },
  {
    key: "CORPORATE_LEANING",
    min: -100,
    label: "Buzz Chaser",
    flavor: "The merch table has a card reader now.",
    color: "#f72585",
  },
  {
    key: "FULL_SELLOUT",
    min: -Infinity,
    label: "Label Mascot",
    flavor: "Your old scene won't say your name out loud.",
    color: "#ff5c57",
  },
];

/** Maps raw `diyPoints` to its identity tier. Total — always returns a tier. */
export function getSceneIdentityTier(diyPoints: number): SceneIdentityTier {
  return (
    SCENE_IDENTITY_TIERS.find((t) => diyPoints >= t.min) ??
    SCENE_IDENTITY_TIERS[SCENE_IDENTITY_TIERS.length - 1]
  );
}

/**
 * Marker position on a sellout(0) → DIY(1) bar. `diyPoints` is clamped to ±100
 * (the practical alignment range), so 0 cred sits dead-center.
 */
export function sceneIdentityPct(diyPoints: number): number {
  const clamped = Math.max(-100, Math.min(100, diyPoints));
  return (clamped + 100) / 200;
}

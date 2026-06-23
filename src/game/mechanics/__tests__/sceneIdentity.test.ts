import { describe, it, expect } from "vitest";
import {
  getSceneIdentityTier,
  sceneIdentityPct,
  SCENE_IDENTITY_TIERS,
} from "../sceneIdentity";

describe("sceneIdentity", () => {
  // These boundaries MUST stay in lockstep with gameStore.makePathChoice's
  // pathAlignment ladder (>=100, >=25, >=-25, >=-100, else). If that ladder
  // moves, this table is the canary.
  it("maps diyPoints onto the same tiers as the store's pathAlignment", () => {
    expect(getSceneIdentityTier(200).key).toBe("PURE_DIY");
    expect(getSceneIdentityTier(100).key).toBe("PURE_DIY");
    expect(getSceneIdentityTier(99).key).toBe("DIY_LEANING");
    expect(getSceneIdentityTier(25).key).toBe("DIY_LEANING");
    expect(getSceneIdentityTier(24).key).toBe("BALANCED");
    expect(getSceneIdentityTier(0).key).toBe("BALANCED");
    expect(getSceneIdentityTier(-25).key).toBe("BALANCED");
    expect(getSceneIdentityTier(-26).key).toBe("CORPORATE_LEANING");
    expect(getSceneIdentityTier(-100).key).toBe("CORPORATE_LEANING");
    expect(getSceneIdentityTier(-101).key).toBe("FULL_SELLOUT");
    expect(getSceneIdentityTier(-9999).key).toBe("FULL_SELLOUT");
  });

  it("a fresh run (0 cred) is the centered middle archetype", () => {
    expect(getSceneIdentityTier(0).key).toBe("BALANCED");
    expect(sceneIdentityPct(0)).toBe(0.5);
  });

  it("places the marker on a sellout(0)→DIY(1) axis, clamped to ±100", () => {
    expect(sceneIdentityPct(100)).toBe(1); // DIY pole
    expect(sceneIdentityPct(-100)).toBe(0); // sellout pole
    expect(sceneIdentityPct(50)).toBe(0.75);
    // Beyond the practical range stays pinned at the poles.
    expect(sceneIdentityPct(500)).toBe(1);
    expect(sceneIdentityPct(-500)).toBe(0);
  });

  it("every tier has a distinct key, label, and color", () => {
    expect(SCENE_IDENTITY_TIERS).toHaveLength(5);
    expect(new Set(SCENE_IDENTITY_TIERS.map((t) => t.key)).size).toBe(5);
    expect(new Set(SCENE_IDENTITY_TIERS.map((t) => t.label)).size).toBe(5);
    expect(new Set(SCENE_IDENTITY_TIERS.map((t) => t.color)).size).toBe(5);
  });
});

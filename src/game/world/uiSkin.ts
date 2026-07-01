/**
 * uiSkin — maps the player's DIY↔sellout standing to a UI "skin" name that
 * drives the whole design system's production style (see src/styles/skins.css).
 * The 5 scene-identity tiers map 1:1 to the 5-step aesthetic morph.
 */
import { getSceneIdentityTier, SceneIdentityKey } from '@game/mechanics/sceneIdentity';

export type UiSkin =
  | 'pure-diy'
  | 'diy-leaning'
  | 'balanced'
  | 'corporate-leaning'
  | 'full-sellout';

const TIER_TO_SKIN: Record<SceneIdentityKey, UiSkin> = {
  PURE_DIY: 'pure-diy',
  DIY_LEANING: 'diy-leaning',
  BALANCED: 'balanced',
  CORPORATE_LEANING: 'corporate-leaning',
  FULL_SELLOUT: 'full-sellout',
};

/** The skin the UI should wear at this DIY-points standing. */
export function uiSkinForDiy(diyPoints: number): UiSkin {
  return TIER_TO_SKIN[getSceneIdentityTier(diyPoints).key];
}

/** Set the skin on <html> so it cascades to every screen + portaled modal.
 *  Idempotent + SSR-safe. */
export function applyUiSkin(diyPoints: number): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.skin = uiSkinForDiy(diyPoints);
  }
}

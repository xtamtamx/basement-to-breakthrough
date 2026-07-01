import { Band } from '@game/types';
import { factionSystem } from '@game/mechanics/FactionSystem';

/**
 * Shared faction display helpers. The authored faction iconColors include
 * near-black / deep-indigo that vanish on the dark UI, so we map each faction
 * to a tint that actually reads. Used by the Scene Politics meter, the Bands
 * roster, and the Show builder so a band's allegiance looks the same everywhere.
 */
export const FACTION_DISPLAY_COLOR: Record<string, string> = {
  'diy-purists': '#d08a4f',
  'metal-elite': '#c2c2cc',
  'indie-crowd': '#ff79c0',
  'old-guard': '#a07ce0',
  'new-wave': '#3ad7dd',
};

// Compact labels for chips/cards — the authored diy-purists name ("The DIY
// Purists Collective") is too long to sit in a badge.
export const FACTION_SHORT_NAME: Record<string, string> = {
  'diy-purists': 'DIY Purists',
  'metal-elite': 'Metal Elite',
  'indie-crowd': 'Indie Crowd',
  'old-guard': 'Old Guard',
  'new-wave': 'New Wave',
};

export interface FactionBadge {
  id: string;
  name: string;
  color: string;
}

/** The faction badge to show on a band card — ONLY an explicitly authored
 *  `faction-<id>` membership trait, never a guessed affiliation. `getBandFaction`
 *  falls back to a crude authenticity/skill/popularity alignment when a band has
 *  no faction trait, which mislabels the curated roster (e.g. tagging a modern
 *  hardcore act "Old Guard"). Surfacing a guess AS a band's identity reads as a
 *  bug, so we don't: authored bands with no faction trait show no badge. Gameplay
 *  (chemistry, standings) still uses getBandFaction's alignment elsewhere — this
 *  only governs the visible label. Pure; safe to call from render. */
export function bandFactionBadge(band: Band): FactionBadge | null {
  const trait = band.traits.find((t) => t.id.startsWith('faction-'));
  if (!trait) return null;
  const id = trait.id.slice('faction-'.length);
  const f = factionSystem.getFaction(id);
  return { id, name: FACTION_SHORT_NAME[id] ?? f?.name ?? id, color: FACTION_DISPLAY_COLOR[id] ?? '#b9b3d6' };
}

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

/** The faction a band reads as (membership trait or best alignment), for display
 *  — or null if unaffiliated. Pure; safe to call from render. */
export function bandFactionBadge(band: Band): FactionBadge | null {
  const id = factionSystem.getBandFaction(band);
  if (!id) return null;
  const f = factionSystem.getFaction(id);
  return { id, name: FACTION_SHORT_NAME[id] ?? f?.name ?? id, color: FACTION_DISPLAY_COLOR[id] ?? '#b9b3d6' };
}

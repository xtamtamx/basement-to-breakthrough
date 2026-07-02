import React from 'react';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { factionSystem } from '@game/mechanics/FactionSystem';
import { FACTION_DISPLAY_COLOR, FACTION_SHORT_NAME } from '@game/world/factionDisplay';

/**
 * Read-only surface for the "Manage Politics" pillar: where the player stands
 * with each of the five scene factions. Standings are the persisted store field
 * (factionStandings); the FactionSystem singleton supplies only the static defs.
 * Tap to expand the full ladder. Pure read — no gameplay logic. Sits under the
 * Scene Identity meter in the "More" menu (pass `inline`).
 */

const standingColor = (s: number): string => (s > 0 ? 'var(--snes-green)' : s < 0 ? 'var(--snes-red)' : 'var(--snes-ink-mute)');

// −100..100 → 0..1 for the bar marker.
const pct = (s: number): number => (Math.max(-100, Math.min(100, s)) + 100) / 200;

export const FactionStandingsMeter: React.FC<{ open: boolean; onToggle: () => void; inline?: boolean }> = ({ open, onToggle, inline = false }) => {
  const standings = useGameStore((s) => s.factionStandings);

  const factions = factionSystem.getAllFactions();
  const rows = factions.map((f) => ({
    id: f.id,
    name: FACTION_SHORT_NAME[f.id] ?? f.name,
    color: FACTION_DISPLAY_COLOR[f.id] ?? 'var(--snes-ink-dim)',
    standing: Math.round(standings[f.id] ?? 0),
  }));

  return (
    <button
      type="button"
      onClick={() => { onToggle(); haptics.light(); }}
      aria-expanded={open}
      aria-label="Faction standings. Tap to expand."
      className="snes-panel"
      style={{
        ...(inline
          ? { position: 'relative', width: '100%' }
          : { position: 'absolute', top: '92px', left: '12px', width: open ? '212px' : '168px', zIndex: 5 }),
        padding: '8px 9px',
        border: '2px solid var(--snes-void)',
        boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
        borderRadius: 0,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'none',
      }}
    >
      {/* Title row */}
      <div
        className="snes-pixel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          letterSpacing: 0,
          color: 'var(--snes-ink-dim)',
          marginBottom: '7px',
        }}
      >
        <span>SCENE POLITICS</span>
        <span>{open ? '▲' : '▼'}</span>
      </div>

      {/* Collapsed: a row of 5 faction dots, tinted, with their standing below */}
      {!open && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span style={{
                width: '9px', height: '9px', background: r.color, borderRadius: '50%',
                boxShadow: '0 0 0 1px var(--snes-void)', opacity: r.standing === 0 ? 0.5 : 1,
              }} />
              <span className="snes-pixel" style={{ fontSize: '9px', letterSpacing: 0, color: standingColor(r.standing) }}>
                {r.standing > 0 ? '+' : ''}{r.standing}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: the full ladder, each with a −100..+100 standing bar */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {rows.map((r) => (
            <div key={r.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span className="snes-pixel" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', letterSpacing: 0, color: 'var(--snes-ink-dim)' }}>
                  <span style={{ width: '7px', height: '7px', background: r.color, borderRadius: '50%', boxShadow: '0 0 0 1px var(--snes-void)', flexShrink: 0 }} />
                  {r.name}
                </span>
                <span className="snes-pixel" style={{ fontSize: '11px', letterSpacing: 0, color: standingColor(r.standing) }}>
                  {r.standing > 0 ? '+' : ''}{r.standing}
                </span>
              </div>
              {/* bar: red ◄ neutral ► green, marker at the standing */}
              <div style={{ position: 'relative', height: '6px', background: 'linear-gradient(90deg, var(--snes-red) 0%, var(--snes-line) 50%, var(--snes-green) 100%)', boxShadow: 'inset 0 0 0 1px var(--snes-void)' }}>
                <div aria-hidden style={{ position: 'absolute', top: '-2px', bottom: '-2px', left: `${pct(r.standing) * 100}%`, width: '3px', marginLeft: '-1.5px', background: 'var(--snes-ink)', boxShadow: '0 0 0 1px var(--snes-edge-lt)' }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: '9px', lineHeight: 1.5, color: 'var(--snes-ink-mute)', margin: '2px 0 0', fontStyle: 'italic' }}>
            Play a faction's kind of bands to win its favor — at high standing their shows draw and earn more.
          </p>
        </div>
      )}
    </button>
  );
};

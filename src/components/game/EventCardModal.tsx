/**
 * EventCardModal — presents a drawn event card (band-drama / scene crisis) and
 * its choices. Blocks until the player picks. Mirrors SynergyAcquireModal chrome.
 */

import React, { useEffect } from 'react';
import { EventCard, EventChoice, EventEffect } from '@game/mechanics/EventCardSystem';
import { FACTION_SHORT_NAME } from '@game/world/factionDisplay';
import { useGameStore } from '@stores/gameStore';
import { SnesModal } from '@components/ui/SnesModal';
import { PixelIcon } from '@components/ui/PixelIcon';
import { audio } from '@utils/simpleAudio';
import { haptics } from '@utils/mobile';

interface EventCardModalProps {
  event: EventCard;
  onClose: () => void;
}

/** Event type → neon-punk SNES accent. */
const TYPE_COLOR: Record<EventCard['type'], string> = {
  opportunity: 'var(--snes-green)',
  crisis: 'var(--snes-red)',
  wildcard: 'var(--snes-gold)',
  legendary: 'var(--snes-purple)',
};

// Resource → PixelIcon glyph name (icon inherits currentColor from the delta pill).
const RES_ICON: Record<string, string> = { money: 'money', reputation: 'fame', fans: 'fans', stress: 'stress', connections: 'faction' };
// Band/venue stat → short pill label (must stay skimmable at 9px pixel font).
const STAT_LABEL: Record<string, string> = { popularity: 'POP', authenticity: 'AUTH', energy: 'NRG', technicalSkill: 'SKILL', capacity: 'VENUE CAP' };
// A delta helps the player if positive — except stress, where less is better.
const isGood = (res: string, delta: number) => (res === 'stress' ? delta < 0 : delta > 0);

interface PreviewPill {
  key: string;
  delta: number;
  good: boolean;
  icon?: string; // PixelIcon glyph (resources)
  label?: string; // text tag (stats, factions)
}
interface EffectPreview {
  pills: PreviewPill[];
  /** Dim sub-lines for consequences with no numeric pill (synergies, exposure,
   *  one-band scoping) — the effects' already-authored description strings. */
  notes: string[];
}

// EVERY consequence of an effect list, summed into typed pills — resource,
// band-stat, and faction deltas alike. Costs are already baked in as negatives
// (e.g. -$100), so this shows the WHOLE trade, and what's shown here is exactly
// what applyEventCardChoice commits (preview == resolution).
function previewEffects(effects: EventEffect[]): EffectPreview {
  const res: Record<string, number> = {};
  const stats: Record<string, number> = {};
  const factions: Record<string, number> = {};
  const notes: string[] = [];
  let oneBand = false;
  effects.forEach((e) => {
    switch (e.type) {
      case 'resource_change':
        Object.entries(e.value).forEach(([k, v]) => {
          if (typeof v === 'number' && v !== 0) res[k] = (res[k] || 0) + v;
        });
        break;
      case 'modify_stat':
        Object.entries(e.value).forEach(([k, v]) => {
          if (typeof v !== 'number' || v === 0) return;
          if (k === 'stress') res.stress = (res.stress || 0) + v; // stat `stress` routes to the player
          else stats[k] = (stats[k] || 0) + v;
        });
        if (e.target === 'random_band') oneBand = true;
        break;
      case 'faction_change':
        Object.entries(e.value).forEach(([fid, v]) => {
          if (v !== 0) factions[fid] = (factions[fid] || 0) + v;
        });
        break;
      default: // trigger_synergy / scene_change / spawn_card / transform_card
        if (e.description) notes.push(e.description);
    }
  });
  if (oneBand) notes.unshift('Band boost lands on one random band');
  return {
    pills: [
      ...Object.entries(res).map(([k, v]) => ({ key: `res-${k}`, delta: v, good: isGood(k, v), icon: RES_ICON[k], label: RES_ICON[k] ? undefined : k })),
      ...Object.entries(stats).map(([k, v]) => ({ key: `stat-${k}`, delta: v, good: v > 0, label: STAT_LABEL[k] ?? k })),
      ...Object.entries(factions).map(([k, v]) => ({ key: `fac-${k}`, delta: v, good: v > 0, label: FACTION_SHORT_NAME[k] ?? k })),
    ],
    notes,
  };
}

const PILL_STYLE: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', letterSpacing: 0 };

const Pill: React.FC<{ p: PreviewPill }> = ({ p }) => (
  <span className="snes-pixel" style={{ ...PILL_STYLE, color: p.good ? 'var(--snes-green)' : 'var(--snes-red)' }}>
    {p.delta > 0 ? '+' : ''}{p.delta}
    {p.icon ? <PixelIcon name={p.icon} size={12} /> : <span>{p.label}</span>}
  </span>
);

// DIY↔sellout axis pill — colors match the SceneIdentityMeter's pole gradient
// (green = DIY end, red = sellout end), so the trade reads in the same visual
// language as the meter it moves.
const DiyPill: React.FC<{ delta: number }> = ({ delta }) => (
  <span className="snes-pixel" style={{ ...PILL_STYLE, color: delta > 0 ? 'var(--snes-green)' : 'var(--snes-red)' }}>
    {delta > 0 ? `DIY +${delta}` : `SELLOUT ${delta}`}
  </span>
);

// Pills row + dim authored-description sub-lines for one effect list.
const EffectPreviewBlock: React.FC<{ preview: EffectPreview; diyDelta?: number }> = ({ preview, diyDelta }) => (
  <>
    {(preview.pills.length > 0 || diyDelta !== undefined) && (
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '7px' }}>
        {preview.pills.map((p) => <Pill key={p.key} p={p} />)}
        {diyDelta !== undefined && <DiyPill delta={diyDelta} />}
      </span>
    )}
    {preview.notes.map((note) => (
      <span key={note} style={{ display: 'block', marginTop: '5px', fontSize: '10px', fontStyle: 'italic', lineHeight: 1.4, color: 'var(--snes-ink-dim)' }}>
        {note}
      </span>
    ))}
  </>
);

export const EventCardModal: React.FC<EventCardModalProps> = ({ event, onClose }) => {
  const applyEventCardChoice = useGameStore((s) => s.applyEventCardChoice);
  const accent = TYPE_COLOR[event.type];
  const glow = event.type === 'legendary' ? '0 0 10px 0 rgba(199, 125, 255, 0.6)' : '';

  // Ring the card in by type the moment it's drawn — crises sting, opportunities
  // chime, legendaries blare. Fires once on mount.
  useEffect(() => {
    switch (event.type) {
      case 'crisis':
        audio.error();
        haptics.heavy();
        break;
      case 'opportunity':
        audio.coin();
        haptics.success();
        break;
      case 'legendary':
        audio.achievement();
        haptics.heavy();
        break;
      default: // wildcard
        audio.synergy();
        haptics.medium();
    }
  }, [event.type]);

  const pick = (choiceId: string | null) => {
    applyEventCardChoice(choiceId);
    onClose();
  };

  // The card's base effects apply on EVERY resolution — on top of whichever
  // choice is picked, or behind the bare OK on choiceless cards. Surface them
  // in the card body so nothing lands invisibly.
  const basePreview = previewEffects(event.effects || []);
  const hasBase = basePreview.pills.length > 0 || basePreview.notes.length > 0;
  const hasChoices = !!(event.choices && event.choices.length > 0);

  // Choices (or a single OK when the card has none) — rendered via SnesModal's
  // pinned footer so the buttons never scroll below the fold on the short
  // landscape screen (the card cannot be dismissed any other way). The strip
  // keeps its own bg-2 + border-top so it still reads as part of the card.
  const choicesStrip = (
    <div
      style={{
        padding: '16px 20px',
        borderTop: '2px solid var(--snes-void)',
        backgroundColor: 'var(--snes-bg-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {event.choices && event.choices.length > 0 ? (
        event.choices.map((choice: EventChoice) => {
          const preview = previewEffects(choice.effects);
          const hasAny = preview.pills.length > 0 || preview.notes.length > 0 || choice.diyDelta !== undefined;
          return (
            <button
              key={choice.id}
              onClick={() => pick(choice.id)}
              className="snes-btn"
              style={{
                width: '100%',
                minHeight: '44px',
                fontSize: '11px',
                textAlign: 'left',
                lineHeight: 1.5,
                cursor: 'pointer',
                whiteSpace: 'normal',
              }}
            >
              {choice.text}
              {hasAny ? (
                <EffectPreviewBlock preview={preview} diyDelta={choice.diyDelta} />
              ) : choice.cost ? (
                // Fallback: a gate-only cost with no effects to display.
                <span style={{ color: 'var(--snes-red)', marginLeft: '6px' }}>(−{choice.cost.amount} {choice.cost.type})</span>
              ) : null}
            </button>
          );
        })
      ) : (
        <button
          onClick={() => pick(null)}
          className="snes-btn snes-btn--green"
          style={{ width: '100%', minHeight: '44px', fontSize: '11px', cursor: 'pointer' }}
        >
          OK
        </button>
      )}
    </div>
  );

  return (
    <SnesModal
      onClose={onClose}
      ariaLabel={event.name}
      accent={accent}
      maxWidth={440}
      hideClose
      closeOnBackdrop={false}
      footer={choicesStrip}
      className={`btb-pop ${event.type === 'crisis' ? 'btb-shake' : ''} ${event.type === 'legendary' ? 'btb-glow' : ''}`}
    >
      <div
        style={{
          backgroundColor: 'var(--snes-bg)',
          overflow: 'hidden',
          boxShadow: glow
            ? `inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void), ${glow}`
            : 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '2px solid var(--snes-void)',
            backgroundColor: 'var(--snes-bg-2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <PixelIcon name={event.icon} size={32} style={{ flexShrink: 0, color: accent }} />
          <div style={{ minWidth: 0 }}>
            <span
              className="snes-pixel"
              style={{
                fontSize: '9px',
                color: accent,
                letterSpacing: 0,
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '6px',
              }}
            >
              {event.type}
            </span>
            <h2
              className="snes-pixel"
              style={{ fontSize: '11px', color: 'var(--snes-ink)', margin: 0, letterSpacing: 0, lineHeight: 1.5 }}
            >
              {event.name}
            </h2>
          </div>
        </div>

        {/* Content — scrolls via the SnesModal body; choices stay pinned below. */}
        <div style={{ padding: '20px' }}>
          <p style={{ color: 'var(--snes-ink-dim)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
            {event.description}
          </p>
          {hasBase && (
            <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: 'var(--snes-bg-2)', boxShadow: 'inset 0 0 0 2px var(--snes-void)' }}>
              <span className="snes-pixel" style={{ display: 'block', fontSize: '9px', letterSpacing: 0, color: accent, textTransform: 'uppercase' }}>
                {hasChoices ? 'Either way' : 'Effect'}
              </span>
              <EffectPreviewBlock preview={basePreview} />
            </div>
          )}
          {event.flavorText && (
            <p style={{ color: 'var(--snes-ink-dim)', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.5, margin: '14px 0 0' }}>
              {event.flavorText}
            </p>
          )}
        </div>
      </div>
    </SnesModal>
  );
};

export default EventCardModal;

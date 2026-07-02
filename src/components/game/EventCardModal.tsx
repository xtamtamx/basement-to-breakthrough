/**
 * EventCardModal — presents a drawn event card (band-drama / scene crisis) and
 * its choices. Blocks until the player picks. Mirrors SynergyAcquireModal chrome.
 */

import React, { useEffect } from 'react';
import { EventCard } from '@game/mechanics/EventCardSystem';
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
// A choice's NET resource deltas — its resource_change effects, summed. The cost
// is already baked in here as a negative (e.g. -$100), so this shows the WHOLE
// trade (what you pay AND what you get), not just the cost.
type ChoiceLike = { effects?: Array<{ type: string; value?: unknown }>; cost?: { amount: number; type: string } };
function choiceOutcomes(choice: ChoiceLike): Array<{ res: string; delta: number }> {
  const acc: Record<string, number> = {};
  (choice.effects || []).forEach((e) => {
    if (e.type === 'resource_change' && e.value && typeof e.value === 'object') {
      Object.entries(e.value as Record<string, unknown>).forEach(([k, v]) => {
        if (typeof v === 'number' && v !== 0) acc[k] = (acc[k] || 0) + v;
      });
    }
  });
  return Object.entries(acc).map(([res, delta]) => ({ res, delta }));
}
// A delta helps the player if positive — except stress, where less is better.
const isGood = (res: string, delta: number) => (res === 'stress' ? delta < 0 : delta > 0);

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
        event.choices.map((choice) => (
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
            {(() => {
              const outs = choiceOutcomes(choice);
              if (outs.length > 0) {
                return (
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '7px' }}>
                    {outs.map(({ res, delta }) => (
                      <span key={res} className="snes-pixel" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', letterSpacing: 0, color: isGood(res, delta) ? 'var(--snes-green)' : 'var(--snes-red)' }}>
                        {delta > 0 ? '+' : ''}{delta}
                        {RES_ICON[res] ? <PixelIcon name={RES_ICON[res]} size={12} /> : <span>{res}</span>}
                      </span>
                    ))}
                  </span>
                );
              }
              // Fallback: a gate-only cost with no resource effects to display.
              if (choice.cost) {
                return <span style={{ color: 'var(--snes-red)', marginLeft: '6px' }}>(−{choice.cost.amount} {choice.cost.type})</span>;
              }
              return null;
            })()}
          </button>
        ))
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
          <span style={{ fontSize: '32px', lineHeight: 1, flexShrink: 0 }}>{event.icon}</span>
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

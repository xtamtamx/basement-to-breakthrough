/**
 * EventCardModal — presents a drawn event card (band-drama / scene crisis) and
 * its choices. Blocks until the player picks. Mirrors SynergyAcquireModal chrome.
 */

import React, { useEffect } from 'react';
import { EventCard } from '@game/mechanics/EventCardSystem';
import { useGameStore } from '@stores/gameStore';
import { SnesModal } from '@components/ui/SnesModal';
import { audio } from '@utils/simpleAudio';
import { haptics } from '@utils/mobile';

interface EventCardModalProps {
  event: EventCard;
  onClose: () => void;
}

/** Event type → neon-punk SNES accent. */
const TYPE_COLOR: Record<EventCard['type'], string> = {
  opportunity: '#3ad17e',
  crisis: '#ff5c57',
  wildcard: '#ffd23f',
  legendary: '#c77dff',
};

const RES_ICON: Record<string, string> = { money: '$', reputation: '★', fans: '♦', stress: '⚠', connections: '🔗' };
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

  return (
    <SnesModal
      onClose={onClose}
      ariaLabel={event.name}
      accent={accent}
      maxWidth={440}
      hideClose
      closeOnBackdrop={false}
      className={`btb-pop ${event.type === 'crisis' ? 'btb-shake' : ''} ${event.type === 'legendary' ? 'btb-glow' : ''}`}
    >
      <div
        style={{
          backgroundColor: '#171327',
          overflow: 'hidden',
          boxShadow: glow
            ? `inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, ${glow}`
            : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '2px solid #0a0814',
            backgroundColor: '#0f0b1e',
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
                fontSize: '8px',
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
              style={{ fontSize: '11px', color: '#ffffff', margin: 0, letterSpacing: 0, lineHeight: 1.5 }}
            >
              {event.name}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <p style={{ color: '#b9b3d6', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
            {event.description}
          </p>
          {event.flavorText && (
            <p style={{ color: '#6f6796', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.5, margin: '14px 0 0' }}>
              {event.flavorText}
            </p>
          )}
        </div>

        {/* Choices (or a single OK when the card has none) */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '2px solid #0a0814',
            backgroundColor: '#0f0b1e',
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
                  fontSize: '9px',
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
                          <span key={res} className="snes-pixel" style={{ fontSize: '8px', letterSpacing: 0, color: isGood(res, delta) ? '#3ad17e' : '#ff5c57' }}>
                            {delta > 0 ? '+' : ''}{delta} {RES_ICON[res] || res}
                          </span>
                        ))}
                      </span>
                    );
                  }
                  // Fallback: a gate-only cost with no resource effects to display.
                  if (choice.cost) {
                    return <span style={{ color: '#ff5c57', marginLeft: '6px' }}>(−{choice.cost.amount} {choice.cost.type})</span>;
                  }
                  return null;
                })()}
              </button>
            ))
          ) : (
            <button
              onClick={() => pick(null)}
              className="snes-btn snes-btn--green"
              style={{ width: '100%', minHeight: '44px', fontSize: '10px', cursor: 'pointer' }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </SnesModal>
  );
};

export default EventCardModal;

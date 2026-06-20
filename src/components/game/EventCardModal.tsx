/**
 * EventCardModal — presents a drawn event card (band-drama / scene crisis) and
 * its choices. Blocks until the player picks. Mirrors SynergyAcquireModal chrome.
 */

import React from 'react';
import { EventCard } from '@game/mechanics/EventCardSystem';
import { useGameStore } from '@stores/gameStore';

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

export const EventCardModal: React.FC<EventCardModalProps> = ({ event, onClose }) => {
  const applyEventCardChoice = useGameStore((s) => s.applyEventCardChoice);
  const accent = TYPE_COLOR[event.type];
  const glow = event.type === 'legendary' ? '0 0 10px 0 rgba(199, 125, 255, 0.6)' : '';

  const pick = (choiceId: string | null) => {
    applyEventCardChoice(choiceId);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 6, 18, 0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="btb-pop"
        style={{
          backgroundColor: '#171327',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          border: `2px solid ${accent}`,
          borderRadius: 0,
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
                {choice.cost && (
                  <span style={{ color: '#ff5c57', marginLeft: '6px' }}>
                    (−{choice.cost.amount} {choice.cost.type})
                  </span>
                )}
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
    </div>
  );
};

export default EventCardModal;

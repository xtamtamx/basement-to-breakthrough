/**
 * SynergyAcquireModal - Modal for acquiring or replacing synergies
 */

import React, { useState, useEffect } from 'react';
import { audio } from '@utils/simpleAudio';
import { haptics } from '@utils/mobile';
import {
  synergyManager,
  Synergy,
  SynergyRarity,
} from '@game/mechanics/SynergyManager';
import { useGameStore } from '@stores/gameStore';
import { useEscapeToClose } from '@hooks/useEscapeToClose';

interface SynergyAcquireModalProps {
  synergy: Synergy;
  onClose: () => void;
  onAcquired: () => void;
}

/** Rarity → neon-punk SNES accent color (header / borders). */
const RARITY_COLOR: Record<SynergyRarity, string> = {
  COMMON: '#6f6796',
  UNCOMMON: '#3ad17e',
  RARE: '#4cc9f0',
  LEGENDARY: '#c77dff',
};

/** LEGENDARY gets a subtle outer glow; others are flat. */
const RARITY_GLOW: Record<SynergyRarity, string> = {
  COMMON: '',
  UNCOMMON: '',
  RARE: '',
  LEGENDARY: '0 0 10px 0 rgba(199, 125, 255, 0.6)',
};

export const SynergyAcquireModal: React.FC<SynergyAcquireModalProps> = ({
  synergy,
  onClose,
  onAcquired,
}) => {
  const currentTurn = useGameStore(state => state.currentRound);
  const [selectedReplaceSlot, setSelectedReplaceSlot] = useState<number | null>(null);
  useEscapeToClose(onClose);

  const isFull = synergyManager.isFull();
  const equipped = synergyManager.getEquippedSynergies();
  const accent = RARITY_COLOR[synergy.rarity];
  const glow = RARITY_GLOW[synergy.rarity];

  // A milestone instinct offer is a celebration — ring it in on open.
  useEffect(() => {
    audio.synergy();
    haptics.success();
  }, []);

  const handleAcquire = () => {
    if (isFull && selectedReplaceSlot === null) {
      return; // Must select a slot to replace
    }

    if (isFull && selectedReplaceSlot !== null) {
      // Set as pending and replace
      synergyManager.acquireSynergy(synergy, currentTurn);
      synergyManager.replaceSynergy(selectedReplaceSlot, currentTurn);
    } else {
      synergyManager.acquireSynergy(synergy, currentTurn);
    }

    onAcquired();
  };

  const handleDiscard = () => {
    synergyManager.cancelPendingSynergy();
    onClose();
  };

  const acquireDisabled = isFull && selectedReplaceSlot === null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 6, 18, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className={`btb-pop ${glow ? 'btb-glow' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`New synergy offered: ${synergy.name}`}
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
          <span style={{ fontSize: '32px', lineHeight: 1, flexShrink: 0 }}>{synergy.icon}</span>
          <div style={{ minWidth: 0 }}>
            <h2
              className="snes-pixel"
              style={{ fontSize: '12px', color: '#ffffff', margin: 0, letterSpacing: 0, lineHeight: 1.5 }}
            >
              {synergy.name}
            </h2>
            <span
              className="snes-pixel"
              style={{
                fontSize: '8px',
                color: accent,
                letterSpacing: 0,
                textTransform: 'uppercase',
                display: 'inline-block',
                marginTop: '6px',
              }}
            >
              {synergy.rarity}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <p style={{ color: '#b9b3d6', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            {synergy.description}
          </p>

          {/* Effects */}
          <div
            style={{
              backgroundColor: '#0f0b1e',
              border: '2px solid #0a0814',
              borderRadius: 0,
              boxShadow: 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #2a2350',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <h3
              className="snes-pixel"
              style={{ fontSize: '9px', color: '#ffffff', margin: '0 0 10px 0', letterSpacing: 0, lineHeight: 1.4 }}
            >
              Effects
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {synergy.effects.map((effect, i) => (
                <li
                  key={i}
                  style={{ fontSize: '12px', color: '#3ad17e', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.5 }}
                >
                  {/* Neutral bullet — the description carries its own sign (a "+"
                      marker turned reductions like "-15%" into "+ -15%"). */}
                  <span style={{ color: '#3ad17e', fontWeight: 700 }}>▸</span>
                  <span>{effect.description}</span>
                </li>
              ))}
            </ul>
            {synergy.condition && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #2a2350' }}>
                <span style={{ fontSize: '11px', color: '#ffd23f', lineHeight: 1.5 }}>
                  Condition: {synergy.condition.description}
                </span>
              </div>
            )}
          </div>

          {/* Trigger Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6f6796' }}>
            <span>Triggers:</span>
            <span
              className="snes-pixel"
              style={{
                fontSize: '8px',
                letterSpacing: 0,
                color: '#ffffff',
                background: '#1f1a3a',
                border: '2px solid #0a0814',
                borderRadius: 0,
                padding: '4px 6px',
                textTransform: 'uppercase',
              }}
            >
              {synergy.trigger.replace('_', ' ')}
            </span>
          </div>

          {/* Replacement Selection (if full) */}
          {isFull && (
            <div
              style={{
                marginTop: '16px',
                backgroundColor: '#0f0b1e',
                border: '2px solid #ff5c57',
                borderRadius: 0,
                padding: '12px',
              }}
            >
              <h3
                className="snes-pixel"
                style={{ fontSize: '9px', color: '#ff5c57', margin: '0 0 10px 0', letterSpacing: 0, lineHeight: 1.4 }}
              >
                Slots full! Choose one to replace:
              </h3>
              <p style={{ fontSize: '8px', color: '#6f6796', margin: '-4px 0 10px 0', lineHeight: 1.5 }}>
                Tap one above to swap it out — or "Skip This One" to keep your current loadout.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {equipped.map((eq) => {
                  const selected = selectedReplaceSlot === eq.slotIndex;
                  return (
                    <button
                      key={eq.slotIndex}
                      onClick={() => setSelectedReplaceSlot(eq.slotIndex)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        minHeight: '44px',
                        background: selected ? '#2a1218' : '#1f1a3a',
                        border: `2px solid ${selected ? '#ff5c57' : '#0a0814'}`,
                        borderRadius: 0,
                        boxShadow: selected ? 'none' : 'inset 1px 1px 0 0 #3a2f5c',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>{eq.synergy.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#ffffff', fontWeight: 500, fontSize: '13px' }}>
                            {eq.synergy.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6f6796', lineHeight: 1.4 }}>
                            {eq.synergy.description}
                          </div>
                        </div>
                        {selected && (
                          <span
                            className="snes-pixel"
                            style={{ fontSize: '7px', letterSpacing: 0, color: '#ff5c57', flexShrink: 0 }}
                          >
                            REPLACE
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '2px solid #0a0814',
            backgroundColor: '#0f0b1e',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={handleDiscard}
            className="snes-btn snes-btn--ghost"
            style={{ flex: 1, minHeight: '44px', fontSize: '10px', cursor: 'pointer' }}
          >
            Skip This One
          </button>
          <button
            onClick={handleAcquire}
            disabled={acquireDisabled}
            className="snes-btn snes-btn--green"
            style={{ flex: 1, minHeight: '44px', fontSize: '10px', cursor: acquireDisabled ? 'not-allowed' : 'pointer' }}
          >
            {isFull ? 'Replace & Acquire' : 'Acquire'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SynergyAcquireModal;

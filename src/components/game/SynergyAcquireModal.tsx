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
import { SnesModal } from '@components/ui/SnesModal';

interface SynergyAcquireModalProps {
  synergy: Synergy;
  onClose: () => void;
  onAcquired: () => void;
}

/** Rarity → neon-punk SNES accent color (header / borders). */
const RARITY_COLOR: Record<SynergyRarity, string> = {
  COMMON: 'var(--snes-ink-mute)',
  UNCOMMON: 'var(--snes-green)',
  RARE: 'var(--snes-cyan)',
  LEGENDARY: 'var(--snes-purple)',
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
    <SnesModal
      onClose={handleDiscard}
      ariaLabel={`New synergy offered: ${synergy.name}`}
      maxWidth={440}
      accent={accent}
      closeOnBackdrop={false}
      className={glow ? 'btb-glow' : undefined}
      footer={
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDiscard}
            className="snes-btn snes-btn--ghost"
            style={{ flex: 1, minHeight: '44px', cursor: 'pointer' }}
          >
            Skip This One
          </button>
          <button
            onClick={handleAcquire}
            disabled={acquireDisabled}
            className="snes-btn snes-btn--green"
            style={{ flex: 1, minHeight: '44px', cursor: acquireDisabled ? 'not-allowed' : 'pointer' }}
          >
            {isFull ? 'Replace & Acquire' : 'Acquire'}
          </button>
        </div>
      }
    >
      <div>
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            border: '2px solid var(--snes-void)',
            backgroundColor: 'var(--snes-bg-2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '32px', lineHeight: 1, flexShrink: 0 }}>{synergy.icon}</span>
          <div style={{ minWidth: 0 }}>
            <h2
              className="snes-pixel"
              style={{ fontSize: '12px', color: 'var(--snes-ink)', margin: 0, letterSpacing: 0, lineHeight: 1.5 }}
            >
              {synergy.name}
            </h2>
            <span
              className="snes-pixel"
              style={{
                fontSize: '9px',
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
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ color: 'var(--snes-ink-dim)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            {synergy.description}
          </p>

          {/* Effects */}
          <div
            style={{
              backgroundColor: 'var(--snes-bg-2)',
              border: '2px solid var(--snes-void)',
              borderRadius: 0,
              boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <h3
              className="snes-pixel"
              style={{ fontSize: '9px', color: 'var(--snes-ink)', margin: '0 0 10px 0', letterSpacing: 0, lineHeight: 1.4 }}
            >
              Effects
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {synergy.effects.map((effect, i) => (
                <li
                  key={i}
                  style={{ fontSize: '12px', color: 'var(--snes-green)', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.5 }}
                >
                  {/* Neutral bullet — the description carries its own sign (a "+"
                      marker turned reductions like "-15%" into "+ -15%"). */}
                  <span style={{ color: 'var(--snes-green)', fontWeight: 700 }}>▸</span>
                  <span>{effect.description}</span>
                </li>
              ))}
            </ul>
            {synergy.condition && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid var(--snes-line)' }}>
                <span style={{ fontSize: '11px', color: 'var(--snes-gold)', lineHeight: 1.5 }}>
                  Condition: {synergy.condition.description}
                </span>
              </div>
            )}
          </div>

          {/* Trigger Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--snes-ink-mute)' }}>
            <span>Triggers:</span>
            <span
              className="snes-pixel"
              style={{
                fontSize: '9px',
                letterSpacing: 0,
                color: 'var(--snes-ink)',
                background: 'var(--snes-bg-3)',
                border: '2px solid var(--snes-void)',
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
                backgroundColor: 'var(--snes-bg-2)',
                border: '2px solid var(--snes-red)',
                borderRadius: 0,
                padding: '12px',
              }}
            >
              <h3
                className="snes-pixel"
                style={{ fontSize: '9px', color: 'var(--snes-red)', margin: '0 0 10px 0', letterSpacing: 0, lineHeight: 1.4 }}
              >
                Slots full! Choose one to replace:
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', margin: '-4px 0 10px 0', lineHeight: 1.5 }}>
                Tap one below to swap it out — or "Skip This One" to keep your current loadout.
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
                        background: selected
                          ? 'color-mix(in srgb, var(--snes-red) 18%, var(--snes-bg-3))'
                          : 'var(--snes-bg-3)',
                        border: `2px solid ${selected ? 'var(--snes-red)' : 'var(--snes-void)'}`,
                        borderRadius: 0,
                        boxShadow: selected ? 'none' : 'inset 1px 1px 0 0 var(--snes-edge-lt)',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>{eq.synergy.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--snes-ink)', fontWeight: 500, fontSize: '13px' }}>
                            {eq.synergy.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', lineHeight: 1.4 }}>
                            {eq.synergy.description}
                          </div>
                        </div>
                        {selected && (
                          <span
                            className="snes-pixel"
                            style={{ fontSize: '9px', letterSpacing: 0, color: 'var(--snes-red)', flexShrink: 0 }}
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
      </div>
    </SnesModal>
  );
};

export default SynergyAcquireModal;

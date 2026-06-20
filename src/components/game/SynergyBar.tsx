/**
 * SynergyBar - Always-visible synergy slot display
 * Shows equipped synergies with their effects
 */

import React from 'react';
import { synergyManager, EquippedSynergy, SynergyRarity } from '@game/mechanics/SynergyManager';

interface SynergyBarProps {
  onSlotClick?: (slotIndex: number, equipped: EquippedSynergy | null) => void;
  compact?: boolean;
}

/** Rarity → neon-punk SNES accent color (borders / glows). */
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
  LEGENDARY: '0 0 6px 0 rgba(199, 125, 255, 0.7)',
};

export const SynergyBar: React.FC<SynergyBarProps> = ({ onSlotClick, compact = false }) => {
  const maxSlots = synergyManager.getMaxSlots();
  const equipped = synergyManager.getEquippedSynergies();

  // Create slots array
  const slots: (EquippedSynergy | null)[] = [];
  for (let i = 0; i < maxSlots; i++) {
    const equippedInSlot = equipped.find(eq => eq.slotIndex === i);
    slots.push(equippedInSlot || null);
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {slots.map((slot, index) => (
          <CompactSlot
            key={index}
            slot={slot}
            index={index}
            onClick={() => onSlotClick?.(index, slot)}
          />
        ))}
      </div>
    );
  }

  // Default render: a short horizontal strip that mounts just under the HUD.
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '40px',
        padding: '0 8px',
        background: '#0f0b1e',
        border: '2px solid #0a0814',
        borderRadius: 0,
        boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
        overflowX: 'auto',
      }}
    >
      <span
        className="snes-pixel"
        style={{ fontSize: '8px', letterSpacing: 0, color: '#6f6796', flexShrink: 0 }}
      >
        <span style={{ color: '#c77dff' }}>♦</span> {equipped.length}/{maxSlots}
      </span>
      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
        {slots.map((slot, index) => (
          <StripSlot
            key={index}
            slot={slot}
            index={index}
            onClick={() => onSlotClick?.(index, slot)}
          />
        ))}
      </div>
    </div>
  );
};

interface SlotProps {
  slot: EquippedSynergy | null;
  index: number;
  onClick?: () => void;
}

/**
 * Strip tile — small square used in the under-HUD horizontal strip.
 * Filled: rarity-bordered with the synergy icon + a gold trigger-count badge.
 * Empty: dashed-border tile with a '+'.
 */
const StripSlot: React.FC<SlotProps> = ({ slot, index, onClick }) => {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        style={{
          width: '30px',
          height: '30px',
          minHeight: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0814',
          border: '2px dashed #2a2350',
          borderRadius: 0,
          color: '#6f6796',
          fontSize: '14px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: 0,
          touchAction: 'manipulation',
        }}
        aria-label={`Empty synergy slot ${index + 1}`}
      >
        +
      </button>
    );
  }

  const { synergy, timesTriggered } = slot;
  const accent = RARITY_COLOR[synergy.rarity];
  const glow = RARITY_GLOW[synergy.rarity];

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '30px',
        height: '30px',
        minHeight: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f1a3a',
        border: `2px solid ${accent}`,
        borderRadius: 0,
        fontSize: '15px',
        lineHeight: 1,
        cursor: 'pointer',
        padding: 0,
        touchAction: 'manipulation',
        boxShadow: glow || 'inset 1px 1px 0 0 #3a2f5c',
      }}
      aria-label={`${synergy.name} - ${synergy.description}`}
    >
      <span>{synergy.icon}</span>
      {timesTriggered > 0 && (
        <span
          className="snes-pixel"
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            minWidth: '13px',
            height: '13px',
            padding: '0 2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffd23f',
            color: '#3a2e00',
            border: '1px solid #0a0814',
            borderRadius: 0,
            fontSize: '7px',
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          {timesTriggered}
        </span>
      )}
    </button>
  );
};

const CompactSlot: React.FC<SlotProps> = ({ slot, index, onClick }) => {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0814',
          border: '2px dashed #2a2350',
          borderRadius: 0,
          color: '#6f6796',
          fontSize: '12px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: 0,
          touchAction: 'manipulation',
        }}
        aria-label={`Empty synergy slot ${index + 1}`}
      >
        +
      </button>
    );
  }

  const { synergy } = slot;
  const accent = RARITY_COLOR[synergy.rarity];
  const glow = RARITY_GLOW[synergy.rarity];

  return (
    <button
      onClick={onClick}
      style={{
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f1a3a',
        border: `2px solid ${accent}`,
        borderRadius: 0,
        fontSize: '13px',
        lineHeight: 1,
        cursor: 'pointer',
        padding: 0,
        touchAction: 'manipulation',
        boxShadow: glow || 'inset 1px 1px 0 0 #3a2f5c',
      }}
      title={`${synergy.name}: ${synergy.description}`}
    >
      <span>{synergy.icon}</span>
    </button>
  );
};

export default SynergyBar;

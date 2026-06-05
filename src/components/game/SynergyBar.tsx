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

const RARITY_COLORS: Record<SynergyRarity, string> = {
  COMMON: 'bg-gray-600 border-gray-500',
  UNCOMMON: 'bg-green-800 border-green-600',
  RARE: 'bg-blue-800 border-blue-500',
  LEGENDARY: 'bg-purple-800 border-purple-500',
};

const RARITY_GLOW: Record<SynergyRarity, string> = {
  COMMON: '',
  UNCOMMON: 'shadow-green-500/30',
  RARE: 'shadow-blue-500/50',
  LEGENDARY: 'shadow-purple-500/70 animate-pulse',
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
      <div className="flex gap-1">
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

  return (
    <div className="bg-gray-900/90 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white">Synergies</h3>
        <span className="text-xs text-gray-400">
          {equipped.length}/{maxSlots} slots
        </span>
      </div>

      <div className="flex gap-2">
        {slots.map((slot, index) => (
          <SynergySlot
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

const SynergySlot: React.FC<SlotProps> = ({ slot, index, onClick }) => {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-600
                   flex items-center justify-center text-gray-500
                   hover:border-gray-500 hover:bg-gray-800/50 transition-all
                   touch-manipulation min-h-[44px]"
        aria-label={`Empty synergy slot ${index + 1}`}
      >
        <span className="text-2xl">+</span>
      </button>
    );
  }

  const { synergy, timesTriggered } = slot;
  const rarityClass = RARITY_COLORS[synergy.rarity];
  const glowClass = RARITY_GLOW[synergy.rarity];

  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-lg border-2 ${rarityClass} ${glowClass}
                 flex flex-col items-center justify-center
                 hover:brightness-110 transition-all shadow-lg
                 touch-manipulation min-h-[44px] relative`}
      aria-label={`${synergy.name} - ${synergy.description}`}
    >
      <span className="text-2xl">{synergy.icon}</span>
      <span className="text-[10px] text-white/80 truncate w-full text-center px-1">
        {synergy.name}
      </span>
      {timesTriggered > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px]
                        rounded-full w-4 h-4 flex items-center justify-center font-bold">
          {timesTriggered}
        </span>
      )}
    </button>
  );
};

const CompactSlot: React.FC<SlotProps> = ({ slot, onClick }) => {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        className="w-8 h-8 rounded border border-dashed border-gray-600
                   flex items-center justify-center text-gray-500 text-sm
                   hover:border-gray-500 transition-all touch-manipulation"
      >
        +
      </button>
    );
  }

  const { synergy } = slot;
  const rarityClass = RARITY_COLORS[synergy.rarity];

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded border ${rarityClass}
                 flex items-center justify-center
                 hover:brightness-110 transition-all touch-manipulation`}
      title={`${synergy.name}: ${synergy.description}`}
    >
      <span className="text-sm">{synergy.icon}</span>
    </button>
  );
};

export default SynergyBar;

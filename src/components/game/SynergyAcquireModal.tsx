/**
 * SynergyAcquireModal - Modal for acquiring or replacing synergies
 */

import React, { useState } from 'react';
import {
  synergyManager,
  Synergy,
  SynergyRarity,
} from '@game/mechanics/SynergyManager';
import { useGameStore } from '@stores/gameStore';

interface SynergyAcquireModalProps {
  synergy: Synergy;
  onClose: () => void;
  onAcquired: () => void;
}

const RARITY_COLORS: Record<SynergyRarity, { bg: string; border: string; text: string }> = {
  COMMON: { bg: 'bg-gray-700', border: 'border-gray-500', text: 'text-gray-300' },
  UNCOMMON: { bg: 'bg-green-900', border: 'border-green-500', text: 'text-green-300' },
  RARE: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300' },
  LEGENDARY: { bg: 'bg-purple-900', border: 'border-purple-400', text: 'text-purple-300' },
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
  const colors = RARITY_COLORS[synergy.rarity];

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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${colors.bg} ${colors.border} border-2 rounded-xl max-w-md w-full
                      shadow-2xl animate-fadeIn`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{synergy.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{synergy.name}</h2>
              <span className={`text-xs uppercase font-bold ${colors.text}`}>
                {synergy.rarity}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-gray-300">{synergy.description}</p>

          {/* Effects */}
          <div className="bg-black/30 rounded-lg p-3">
            <h3 className="text-sm font-bold text-white mb-2">Effects</h3>
            <ul className="space-y-1">
              {synergy.effects.map((effect, i) => (
                <li key={i} className="text-sm text-green-400 flex items-center gap-2">
                  <span className="text-green-500">+</span>
                  {effect.description}
                </li>
              ))}
            </ul>
            {synergy.condition && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="text-xs text-yellow-400">
                  Condition: {synergy.condition.description}
                </span>
              </div>
            )}
          </div>

          {/* Trigger Type */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Triggers:</span>
            <span className="bg-gray-800 px-2 py-1 rounded text-white">
              {synergy.trigger.replace('_', ' ')}
            </span>
          </div>

          {/* Replacement Selection (if full) */}
          {isFull && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
              <h3 className="text-sm font-bold text-red-400 mb-2">
                Synergy slots full! Choose one to replace:
              </h3>
              <div className="space-y-2">
                {equipped.map((eq) => (
                  <button
                    key={eq.slotIndex}
                    onClick={() => setSelectedReplaceSlot(eq.slotIndex)}
                    className={`w-full p-2 rounded border-2 text-left transition-all
                              ${selectedReplaceSlot === eq.slotIndex
                                ? 'border-red-500 bg-red-900/50'
                                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                              }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{eq.synergy.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{eq.synergy.name}</div>
                        <div className="text-xs text-gray-400">
                          {eq.synergy.description}
                        </div>
                      </div>
                      {selectedReplaceSlot === eq.slotIndex && (
                        <span className="text-red-400 text-sm">REPLACE</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={handleDiscard}
            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600
                     text-white rounded-lg font-medium transition-colors
                     touch-manipulation min-h-[44px]"
          >
            Discard
          </button>
          <button
            onClick={handleAcquire}
            disabled={isFull && selectedReplaceSlot === null}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors
                       touch-manipulation min-h-[44px]
                       ${isFull && selectedReplaceSlot === null
                         ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                         : 'bg-green-600 hover:bg-green-500 text-white'
                       }`}
          >
            {isFull ? 'Replace & Acquire' : 'Acquire'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SynergyAcquireModal;

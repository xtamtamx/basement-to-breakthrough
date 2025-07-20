import React, { useState } from 'react';
import { EquipmentCard } from './EquipmentCard';
import { Equipment, EquipmentType, EQUIPMENT_CATALOG } from '@game/types/equipment';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface EquipmentShopProps {
  ownedEquipment: Set<string>;
  onPurchase: (equipment: Equipment) => void;
}

export const EquipmentShop: React.FC<EquipmentShopProps> = ({
  ownedEquipment,
  onPurchase,
}) => {
  const [selectedType, setSelectedType] = useState<EquipmentType | 'ALL'>('ALL');
  const { money, reputation, fans } = useGameStore();

  // Filter available equipment
  const availableEquipment = EQUIPMENT_CATALOG.filter(eq => {
    // Check if already owned (and not stackable)
    if (ownedEquipment.has(eq.id) && !eq.stackable) {
      return false;
    }

    // Check unlock requirements
    if (eq.unlockRequirement) {
      const req = eq.unlockRequirement;
      if (req.reputation && reputation < req.reputation) return false;
      if (req.fans && fans < req.fans) return false;
      // TODO: Track shows played
    }

    // Filter by type
    if (selectedType !== 'ALL' && eq.type !== selectedType) {
      return false;
    }

    return true;
  });

  const handleTypeFilter = (type: EquipmentType | 'ALL') => {
    setSelectedType(type);
    haptics.light();
    audio.tap();
  };

  const handlePurchase = (equipment: Equipment) => {
    if (money >= equipment.cost) {
      onPurchase(equipment);
      audio.success();
    }
  };

  const typeFilters: Array<{ type: EquipmentType | 'ALL'; label: string; icon: string }> = [
    { type: 'ALL', label: 'All', icon: '🎯' },
    { type: EquipmentType.SOUND, label: 'Sound', icon: '🔊' },
    { type: EquipmentType.LIGHTING, label: 'Lights', icon: '💡' },
    { type: EquipmentType.TRANSPORT, label: 'Transport', icon: '🚐' },
    { type: EquipmentType.PROMOTION, label: 'Promo', icon: '📢' },
    { type: EquipmentType.SECURITY, label: 'Security', icon: '🛡️' },
    { type: EquipmentType.SPECIAL, label: 'Special', icon: '⭐' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-metal-900 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2">Equipment Shop</h2>
        <p className="text-sm text-metal-400">
          Upgrade your gear to improve your shows!
        </p>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(filter => (
          <button
            key={filter.type}
            onClick={() => handleTypeFilter(filter.type)}
            className={`
              px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1
              transition-all active:scale-95
              ${selectedType === filter.type
                ? 'bg-punk-600 text-white'
                : 'bg-metal-800 text-metal-300 hover:bg-metal-700'
              }
            `}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Equipment Grid */}
      {availableEquipment.length === 0 ? (
        <div className="text-center py-8 text-metal-500">
          <p>No equipment available in this category.</p>
          <p className="text-sm mt-2">Check back after gaining more reputation!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableEquipment.map(equipment => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              owned={ownedEquipment.has(equipment.id)}
              canAfford={money >= equipment.cost}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-metal-900 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm text-metal-400">Your Balance:</span>
        <span className="text-lg font-bold text-green-400">${money}</span>
      </div>
    </div>
  );
};
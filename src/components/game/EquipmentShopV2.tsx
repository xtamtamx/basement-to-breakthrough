import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Equipment, EquipmentType } from '@game/types';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface EquipmentShopProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EquipmentShopV2: React.FC<EquipmentShopProps> = ({
  isOpen,
  onClose
}) => {
  const { money, addMoney } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<EquipmentType | 'ALL'>('ALL');
  const [view, setView] = useState<'shop' | 'owned'>('shop');
  const availableEquipment = equipmentManagerV2.getAvailableEquipment();
  const ownedEquipment = equipmentManagerV2.getOwnedEquipment();

  const categories = [
    { id: 'ALL', name: 'ALL', icon: '🎵' },
    { id: EquipmentType.PA_SYSTEM, name: 'PA', icon: '🔊' },
    { id: EquipmentType.LIGHTING, name: 'LIGHTS', icon: '💡' },
    { id: EquipmentType.STAGE, name: 'STAGE', icon: '🎭' },
    { id: EquipmentType.BACKLINE, name: 'GEAR', icon: '🎸' },
    { id: EquipmentType.RECORDING, name: 'REC', icon: '🎙️' }
  ];

  const filteredEquipment = selectedCategory === 'ALL' 
    ? (view === 'shop' ? availableEquipment : ownedEquipment)
    : (view === 'shop' ? availableEquipment : ownedEquipment).filter(eq => eq.type === selectedCategory);

  const getQualityStars = (quality: number) => {
    return '⭐'.repeat(quality) + '☆'.repeat(5 - quality);
  };

  const getConditionColor = (condition: number) => {
    if (condition > 80) return 'var(--pixel-green)';
    if (condition > 50) return 'var(--pixel-yellow)';
    if (condition > 20) return 'var(--pixel-orange)';
    return 'var(--pixel-red)';
  };

  const canAfford = (price: number) => money >= price;

  const handlePurchase = (equipment: Equipment) => {
    if (canAfford(equipment.purchasePrice)) {
      const result = equipmentManagerV2.purchaseEquipment(equipment.id);
      if (result.success) {
        addMoney(-result.cost);
        haptics.success();
        audio.play('purchase');
      }
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  const handleRent = (equipment: Equipment) => {
    if (canAfford(equipment.rentalPrice)) {
      const result = equipmentManagerV2.rentEquipment(equipment.id);
      if (result.success) {
        addMoney(-result.cost);
        haptics.light();
        audio.play('click');
      } else {
        haptics.error();
        // Show error message
      }
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  const handleRepair = (equipment: Equipment) => {
    const repairCost = Math.floor((100 - equipment.condition) * equipment.purchasePrice / 200);
    if (canAfford(repairCost)) {
      const result = equipmentManagerV2.repairEquipment(equipment.id);
      if (result.success) {
        addMoney(-result.cost);
        haptics.success();
        audio.play('success');
      }
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-yellow)' }}>
              EQUIPMENT {view === 'shop' ? 'SHOP' : 'INVENTORY'}
            </h2>
            <button
              onClick={onClose}
              className="pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-red)' }}
            >
              <span className="pixel-text">X</span>
            </button>
          </div>

          {/* Budget Display */}
          <div className="glass-panel p-3 mb-4 flex justify-between items-center">
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              BUDGET: ${money}
            </p>
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-orange)' }}>
              MAINTENANCE: ${equipmentManagerV2.getMaintenanceCosts()}/TURN
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('shop')}
              className={`flex-1 pixel-button p-2 ${view === 'shop' ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <span className="pixel-text">SHOP</span>
            </button>
            <button
              onClick={() => setView('owned')}
              className={`flex-1 pixel-button p-2 ${view === 'owned' ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <span className="pixel-text">OWNED ({ownedEquipment.length})</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`pixel-button p-2 flex items-center gap-2 whitespace-nowrap ${
                  selectedCategory === cat.id ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <span>{cat.icon}</span>
                <span className="pixel-text pixel-text-xs">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Equipment List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredEquipment.length === 0 ? (
              <div className="text-center py-8">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  {view === 'shop' ? 'NO EQUIPMENT AVAILABLE' : 'NO EQUIPMENT OWNED'}
                </p>
              </div>
            ) : (
              filteredEquipment.map(equipment => (
                <motion.div
                  key={equipment.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="glass-panel p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                        {equipment.name}
                      </h3>
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                        {getQualityStars(equipment.quality)}
                      </p>
                      {equipment.description && (
                        <p className="pixel-text pixel-text-xs mt-1" style={{ 
                          color: 'var(--pixel-gray)', 
                          fontStyle: 'italic',
                          opacity: 0.8 
                        }}>
                          "{equipment.description}"
                        </p>
                      )}
                      {view === 'owned' && (
                        <p className="pixel-text pixel-text-xs flex items-center gap-2 mt-1">
                          <span style={{ color: 'var(--pixel-gray)' }}>CONDITION:</span>
                          <span style={{ color: getConditionColor(equipment.condition) }}>
                            {equipment.condition}%
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {view === 'shop' ? (
                        <>
                          <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                            BUY: ${equipment.purchasePrice}
                          </p>
                          <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                            RENT: ${equipment.rentalPrice}
                          </p>
                        </>
                      ) : (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                          MAINT: ${equipment.maintenanceCost}/TURN
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Effects */}
                  <div className="mb-3 space-y-1">
                    {equipment.effects.capacityBonus && (
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                        +{equipment.effects.capacityBonus}% CAPACITY
                      </p>
                    )}
                    {equipment.effects.acousticsBonus && (
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                        +{equipment.effects.acousticsBonus} ACOUSTICS
                      </p>
                    )}
                    {equipment.effects.atmosphereBonus && (
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-magenta)' }}>
                        +{equipment.effects.atmosphereBonus} ATMOSPHERE
                      </p>
                    )}
                    {equipment.effects.reputationMultiplier && equipment.effects.reputationMultiplier > 1 && (
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                        x{equipment.effects.reputationMultiplier} REPUTATION
                      </p>
                    )}
                    {equipment.effects.stressReduction && (
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-blue)' }}>
                        -{equipment.effects.stressReduction} STRESS
                      </p>
                    )}
                    {equipment.effects.incidentReduction && (
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-purple)' }}>
                        -{Math.round(equipment.effects.incidentReduction * 100)}% INCIDENTS
                      </p>
                    )}
                  </div>

                  {/* Requirements */}
                  {equipment.requirements && (
                    <div className="mb-3 space-y-1">
                      {equipment.requirements.minCapacity && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
                          REQUIRES {equipment.requirements.minCapacity}+ CAPACITY
                        </p>
                      )}
                      {equipment.requirements.powerRequirements && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
                          POWER: {equipment.requirements.powerRequirements}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {view === 'shop' ? (
                      <>
                        <button
                          onClick={() => handlePurchase(equipment)}
                          disabled={!canAfford(equipment.purchasePrice)}
                          className={`flex-1 pixel-button p-2 ${
                            canAfford(equipment.purchasePrice) 
                              ? 'hover:scale-105' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{ 
                            backgroundColor: canAfford(equipment.purchasePrice) 
                              ? 'var(--pixel-green)' 
                              : 'var(--pixel-gray)'
                          }}
                        >
                          <span className="pixel-text pixel-text-xs">BUY</span>
                        </button>
                        <button
                          onClick={() => handleRent(equipment)}
                          disabled={!canAfford(equipment.rentalPrice)}
                          className={`flex-1 pixel-button p-2 ${
                            canAfford(equipment.rentalPrice) 
                              ? 'hover:scale-105' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{ 
                            backgroundColor: canAfford(equipment.rentalPrice) 
                              ? 'var(--pixel-yellow)' 
                              : 'var(--pixel-gray)'
                          }}
                        >
                          <span className="pixel-text pixel-text-xs">RENT FOR NEXT SHOW</span>
                        </button>
                      </>
                    ) : (
                      equipment.condition < 100 && (
                        <button
                          onClick={() => handleRepair(equipment)}
                          disabled={!canAfford(Math.floor((100 - equipment.condition) * equipment.purchasePrice / 200))}
                          className={`flex-1 pixel-button p-2 ${
                            canAfford(Math.floor((100 - equipment.condition) * equipment.purchasePrice / 200))
                              ? 'hover:scale-105' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{ 
                            backgroundColor: canAfford(Math.floor((100 - equipment.condition) * equipment.purchasePrice / 200))
                              ? 'var(--pixel-cyan)' 
                              : 'var(--pixel-gray)'
                          }}
                        >
                          <span className="pixel-text pixel-text-xs">
                            REPAIR (${Math.floor((100 - equipment.condition) * equipment.purchasePrice / 200)})
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Rented Equipment Display */}
          {equipmentManagerV2.getRentedEquipment().length > 0 && (
            <div className="mt-4 glass-panel p-3">
              <p className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-yellow)' }}>
                RENTED FOR NEXT SHOW:
              </p>
              <div className="space-y-1">
                {equipmentManagerV2.getRentedEquipment().map(eq => (
                  <p key={eq.id} className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                    • {eq.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
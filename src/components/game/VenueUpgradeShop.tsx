import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Venue, VenueUpgrade, UpgradeType } from '@game/types';
import { venueUpgradeManager } from '@game/mechanics/VenueUpgradeManager';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface VenueUpgradeShopProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
}

export const VenueUpgradeShop: React.FC<VenueUpgradeShopProps> = ({
  isOpen,
  onClose,
  venue
}) => {
  const { money, reputation, connections, addMoney } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<UpgradeType | 'ALL'>('ALL');
  
  if (!venue) return null;
  
  const availableUpgrades = venueUpgradeManager.getAvailableUpgrades(venue, reputation, connections);
  const ongoingUpgrades = venueUpgradeManager.getOngoingUpgrades(venue.id);
  const completedUpgrades = venueUpgradeManager.getVenueUpgrades(venue.id);

  const categories = [
    { id: 'ALL', name: 'ALL', icon: '🏗️' },
    { id: UpgradeType.CAPACITY, name: 'CAPACITY', icon: '📏' },
    { id: UpgradeType.ACOUSTICS, name: 'SOUND', icon: '🔊' },
    { id: UpgradeType.ATMOSPHERE, name: 'VIBE', icon: '✨' },
    { id: UpgradeType.AMENITIES, name: 'AMENITIES', icon: '🍺' },
    { id: UpgradeType.SECURITY, name: 'SECURITY', icon: '🛡️' },
    { id: UpgradeType.INFRASTRUCTURE, name: 'INFRA', icon: '⚡' }
  ];

  const filteredUpgrades = selectedCategory === 'ALL' 
    ? availableUpgrades 
    : availableUpgrades.filter(up => up.type === selectedCategory);

  const canAfford = (price: number) => money >= price;

  const handlePurchase = (upgrade: VenueUpgrade) => {
    if (canAfford(upgrade.cost)) {
      const result = venueUpgradeManager.startUpgrade(venue.id, upgrade.id);
      if (result.success) {
        addMoney(-upgrade.cost);
        haptics.success();
        audio.play('purchase');
      } else {
        haptics.error();
        audio.play('error');
      }
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  const getUpgradeStatusIcon = (upgrade: VenueUpgrade) => {
    const ongoing = ongoingUpgrades.find(o => o.upgradeId === upgrade.id);
    if (ongoing) {
      return `⏳ ${ongoing.turnsRemaining} TURNS`;
    }
    if (completedUpgrades.some(c => c.id === upgrade.id)) {
      return '✅ COMPLETE';
    }
    return null;
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
            <div>
              <h2 className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-yellow)' }}>
                UPGRADE {venue.name.toUpperCase()}
              </h2>
              <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-gray)' }}>
                IMPROVE YOUR VENUE TO ATTRACT BETTER BANDS
              </p>
            </div>
            <button
              onClick={onClose}
              className="pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-red)' }}
            >
              <span className="pixel-text">X</span>
            </button>
          </div>

          {/* Budget & Requirements Display */}
          <div className="glass-panel p-3 mb-4 flex justify-between items-center">
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              BUDGET: ${money}
            </p>
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
              REP: {reputation} | CONN: {connections}
            </p>
          </div>

          {/* Current Venue Stats */}
          <div className="glass-panel p-3 mb-4">
            <p className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-cyan)' }}>
              CURRENT STATS:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                CAPACITY: {venue.capacity}
              </p>
              <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                ACOUSTICS: {venue.acoustics}
              </p>
              <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                ATMOSPHERE: {venue.atmosphere}
              </p>
            </div>
          </div>

          {/* Ongoing Upgrades */}
          {ongoingUpgrades.length > 0 && (
            <div className="glass-panel p-3 mb-4" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
              <p className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-yellow)' }}>
                UPGRADES IN PROGRESS:
              </p>
              <div className="space-y-1">
                {ongoingUpgrades.map(ongoing => {
                  const upgrade = venueUpgradeManager.getCatalogUpgrade(ongoing.upgradeId);
                  if (!upgrade) return null;
                  return (
                    <p key={ongoing.upgradeId} className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
                      • {upgrade.name} - {ongoing.turnsRemaining} TURNS REMAINING
                    </p>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Upgrade List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredUpgrades.length === 0 ? (
              <div className="text-center py-8">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  NO UPGRADES AVAILABLE
                </p>
                {selectedCategory !== 'ALL' && (
                  <p className="pixel-text pixel-text-xs mt-2" style={{ color: 'var(--pixel-gray)' }}>
                    CHECK REQUIREMENTS OR TRY ANOTHER CATEGORY
                  </p>
                )}
              </div>
            ) : (
              filteredUpgrades.map(upgrade => {
                const status = getUpgradeStatusIcon(upgrade);
                const isOngoing = ongoingUpgrades.some(o => o.upgradeId === upgrade.id);
                const isCompleted = completedUpgrades.some(c => c.id === upgrade.id);
                const canPurchase = canAfford(upgrade.cost) && !isOngoing && !isCompleted;

                return (
                  <motion.div
                    key={upgrade.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="glass-panel p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                          {upgrade.name}
                        </h3>
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                          {upgrade.description}
                        </p>
                        {status && (
                          <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-yellow)' }}>
                            {status}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                          ${upgrade.cost}
                        </p>
                        {upgrade.duration > 0 && (
                          <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
                            {upgrade.duration} TURNS
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Effects */}
                    <div className="mb-3 space-y-1">
                      {upgrade.effects.capacityIncrease && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                          +{upgrade.effects.capacityIncrease} CAPACITY
                        </p>
                      )}
                      {upgrade.effects.acousticsIncrease && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                          +{upgrade.effects.acousticsIncrease} ACOUSTICS
                        </p>
                      )}
                      {upgrade.effects.atmosphereIncrease && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-magenta)' }}>
                          +{upgrade.effects.atmosphereIncrease} ATMOSPHERE
                        </p>
                      )}
                      {upgrade.effects.maintenanceCost && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
                          ${upgrade.effects.maintenanceCost}/TURN MAINTENANCE
                        </p>
                      )}
                      {upgrade.effects.unlockEquipment && upgrade.effects.unlockEquipment.length > 0 && (
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-purple)' }}>
                          UNLOCKS: {upgrade.effects.unlockEquipment.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Requirements */}
                    {upgrade.requirements && (
                      <div className="mb-3 space-y-1">
                        {upgrade.requirements.minReputation && (
                          <p className="pixel-text pixel-text-xs" style={{ 
                            color: reputation >= upgrade.requirements.minReputation 
                              ? 'var(--pixel-green)' 
                              : 'var(--pixel-red)' 
                          }}>
                            {reputation >= upgrade.requirements.minReputation ? '✓' : '✗'} 
                            {' '}REQUIRES {upgrade.requirements.minReputation} REPUTATION
                          </p>
                        )}
                        {upgrade.requirements.minConnections && (
                          <p className="pixel-text pixel-text-xs" style={{ 
                            color: connections >= upgrade.requirements.minConnections 
                              ? 'var(--pixel-green)' 
                              : 'var(--pixel-red)' 
                          }}>
                            {connections >= upgrade.requirements.minConnections ? '✓' : '✗'}
                            {' '}REQUIRES {upgrade.requirements.minConnections} CONNECTIONS
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {!isCompleted && !isOngoing && (
                      <button
                        onClick={() => handlePurchase(upgrade)}
                        disabled={!canPurchase}
                        className={`w-full pixel-button p-2 ${
                          canPurchase 
                            ? 'hover:scale-105' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        style={{ 
                          backgroundColor: canPurchase 
                            ? 'var(--pixel-green)' 
                            : 'var(--pixel-gray)'
                        }}
                      >
                        <span className="pixel-text pixel-text-xs">
                          {!canAfford(upgrade.cost) ? 'INSUFFICIENT FUNDS' : 'START UPGRADE'}
                        </span>
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Completed Upgrades Summary */}
          {completedUpgrades.length > 0 && (
            <div className="mt-4 glass-panel p-3">
              <p className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-green)' }}>
                COMPLETED UPGRADES: {completedUpgrades.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {completedUpgrades.map(upgrade => (
                  <span 
                    key={upgrade.id} 
                    className="pixel-badge"
                    style={{ backgroundColor: 'var(--pixel-green)', color: 'white' }}
                  >
                    {upgrade.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
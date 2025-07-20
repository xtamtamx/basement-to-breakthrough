import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synergyDiscoverySystem } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface SynergyCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SynergyCollectionModal: React.FC<SynergyCollectionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  
  const discovered = synergyDiscoverySystem.getDiscoveredCombos();
  const progress = synergyDiscoverySystem.getComboProgress();
  const hints = synergyDiscoverySystem.getHints();
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'var(--pixel-gray)';
      case 'uncommon': return 'var(--pixel-green)';
      case 'rare': return 'var(--pixel-blue)';
      case 'legendary': return 'var(--pixel-purple)';
      default: return 'var(--pixel-white)';
    }
  };
  
  const filteredCombos = selectedRarity === 'all' 
    ? discovered 
    : discovered.filter(c => c.rarity === selectedRarity);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="pixel-panel p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="pixel-text pixel-text-xl" style={{ color: 'var(--pixel-yellow)' }}>
                SYNERGY COLLECTION
              </h2>
              <button
                onClick={onClose}
                className="pixel-button p-2"
                style={{ backgroundColor: 'var(--pixel-red)' }}
              >
                <span className="pixel-text">CLOSE</span>
              </button>
            </div>
            
            {/* Progress Overview */}
            <div className="pixel-panel-inset p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                  TOTAL PROGRESS
                </p>
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                  {progress.discovered} / {progress.total}
                </p>
              </div>
              <div className="pixel-progress-bar h-4">
                <div 
                  className="pixel-progress-fill"
                  style={{ 
                    width: `${(progress.discovered / progress.total) * 100}%`,
                    backgroundColor: 'var(--pixel-green)'
                  }}
                />
              </div>
              
              {/* Rarity Breakdown */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {['common', 'uncommon', 'rare', 'legendary'].map(rarity => (
                  <div key={rarity} className="text-center">
                    <p className="pixel-text pixel-text-xs" style={{ color: getRarityColor(rarity) }}>
                      {rarity.toUpperCase()}
                    </p>
                    <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
                      {progress.byRarity[rarity].discovered}/{progress.byRarity[rarity].total}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedRarity('all')}
                className={`pixel-button p-2 ${selectedRarity === 'all' ? 'ring-2 ring-yellow-400' : ''}`}
                style={{ backgroundColor: selectedRarity === 'all' ? 'var(--pixel-cyan)' : 'var(--pixel-gray)' }}
              >
                <span className="pixel-text pixel-text-xs">ALL</span>
              </button>
              {['common', 'uncommon', 'rare', 'legendary'].map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`pixel-button p-2 ${selectedRarity === rarity ? 'ring-2 ring-yellow-400' : ''}`}
                  style={{ backgroundColor: getRarityColor(rarity) }}
                >
                  <span className="pixel-text pixel-text-xs">{rarity.toUpperCase()}</span>
                </button>
              ))}
            </div>
            
            {/* Combo Grid */}
            <div className="flex-1 overflow-y-auto">
              {filteredCombos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCombos.map((combo, i) => (
                    <motion.div
                      key={combo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="pixel-panel p-4"
                      style={{ borderColor: getRarityColor(combo.rarity) }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{combo.icon}</div>
                        <div className="flex-1">
                          <h3 className="pixel-text pixel-text-sm mb-1" style={{ color: getRarityColor(combo.rarity) }}>
                            {combo.name}
                          </h3>
                          <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-gray)' }}>
                            {combo.description}
                          </p>
                          <div className="space-y-1">
                            {combo.effects.map((effect, j) => (
                              <p key={j} className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-green)' }}>
                                ▸ {effect.description}
                              </p>
                            ))}
                          </div>
                          {combo.timesTriggered > 0 && (
                            <p className="pixel-text mt-2" style={{ fontSize: '6px', color: 'var(--pixel-cyan)' }}>
                              Triggered {combo.timesTriggered} time{combo.timesTriggered > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                    No {selectedRarity !== 'all' ? selectedRarity : ''} synergies discovered yet
                  </p>
                </div>
              )}
            </div>
            
            {/* Hints Section */}
            {hints.length > 0 && (
              <div className="pixel-panel-inset p-3 mt-4">
                <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-yellow)' }}>
                  HINTS:
                </p>
                {hints.map((hint, i) => (
                  <p key={i} className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    • {hint}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
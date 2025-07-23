import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synergyMasterySystem, SynergyMastery } from '@game/mechanics/SynergyMasterySystem';
import { synergyDiscoverySystem } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';

interface SynergyMasteryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const masteryColors = [
  '#666666', // Level 0 - Unmastered
  '#4A5568', // Level 1 - Novice
  '#22543D', // Level 2 - Apprentice
  '#2C5282', // Level 3 - Journeyman
  '#744210', // Level 4 - Expert
  '#FFD700', // Level 5 - Master
];

const masteryTitles = [
  'Unmastered',
  'Novice',
  'Apprentice', 
  'Journeyman',
  'Expert',
  'Master'
];

export const SynergyMasteryPanel: React.FC<SynergyMasteryPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [masteryData, setMasteryData] = useState<SynergyMastery[]>([]);
  const [selectedSynergy, setSelectedSynergy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mastered' | 'in-progress'>('all');
  
  useEffect(() => {
    if (isOpen) {
      const data = synergyMasterySystem.getAllMasteryData();
      setMasteryData(data.sort((a, b) => b.masteryLevel - a.masteryLevel || b.usageCount - a.usageCount));
    }
  }, [isOpen]);
  
  const filteredData = masteryData.filter(m => {
    if (filter === 'mastered') return m.masteryLevel === 5;
    if (filter === 'in-progress') return m.masteryLevel > 0 && m.masteryLevel < 5;
    return true;
  });
  
  const selectedMastery = selectedSynergy ? masteryData.find(m => m.synergyId === selectedSynergy) : null;
  const selectedEnhancement = selectedSynergy ? synergyMasterySystem.getNextUnlock(selectedSynergy) : null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="relative glass-panel max-w-4xl max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-metal-700">
              <div className="flex justify-between items-center">
                <h2 className="punk-headline text-2xl" style={{ color: 'var(--punk-neon-purple)' }}>
                  Synergy Mastery
                </h2>
                <button
                  onClick={onClose}
                  className="touch-target text-metal-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filter tabs */}
              <div className="flex gap-2 mt-4">
                {(['all', 'mastered', 'in-progress'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      haptics.light();
                    }}
                    className={`pixel-button py-2 px-4 ${
                      filter === f ? 'bg-purple-600' : 'bg-metal-700'
                    }`}
                  >
                    <span className="pixel-text pixel-text-xs">
                      {f.toUpperCase().replace('-', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {/* Synergy list */}
              <div className="space-y-2 overflow-y-auto max-h-[60vh]">
                {filteredData.length === 0 ? (
                  <p className="pixel-text text-center py-8" style={{ color: 'var(--pixel-gray)' }}>
                    No synergies match this filter
                  </p>
                ) : (
                  filteredData.map(mastery => {
                    const synergy = synergyDiscoverySystem.getSynergyById(mastery.synergyId);
                    if (!synergy) return null;
                    
                    const isSelected = selectedSynergy === mastery.synergyId;
                    const color = masteryColors[mastery.masteryLevel];
                    
                    return (
                      <motion.div
                        key={mastery.synergyId}
                        className={`glass-panel p-3 cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-purple-500' : ''
                        }`}
                        style={{ borderColor: color }}
                        onClick={() => {
                          setSelectedSynergy(mastery.synergyId);
                          haptics.light();
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon with mastery glow */}
                          <div className="relative">
                            <span className="text-2xl" style={{
                              filter: mastery.masteryLevel > 0 ? `drop-shadow(0 0 ${mastery.masteryLevel * 4}px ${color})` : 'none'
                            }}>
                              {synergy.icon}
                            </span>
                            {mastery.masteryLevel === 5 && (
                              <motion.div
                                className="absolute -top-1 -right-1"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  rotate: [0, 360]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                              >
                                <span className="text-xs">⭐</span>
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1">
                            <h4 className="pixel-text pixel-text-sm" style={{ color: color }}>
                              {synergy.name}
                            </h4>
                            <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                              {masteryTitles[mastery.masteryLevel]} • Used {mastery.usageCount} times
                            </p>
                            
                            {/* Progress bar */}
                            {mastery.masteryLevel < 5 && (
                              <div className="mt-2">
                                <div className="h-1 bg-metal-800 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full"
                                    style={{ backgroundColor: color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${mastery.masteryProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Mastery stars */}
                            <div className="flex gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${i < mastery.masteryLevel ? 'text-yellow-500' : 'text-metal-700'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
              
              {/* Detail panel */}
              <div className="glass-panel p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                {selectedMastery ? (
                  <motion.div
                    key={selectedSynergy}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="pixel-text pixel-text-lg mb-3" 
                      style={{ color: masteryColors[selectedMastery.masteryLevel] }}
                    >
                      {synergyDiscoverySystem.getSynergyById(selectedMastery.synergyId)?.name}
                    </h3>
                    
                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                          Total Uses:
                        </span>
                        <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                          {selectedMastery.usageCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                          Total Score:
                        </span>
                        <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                          {selectedMastery.totalScore.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                          Last Used:
                        </span>
                        <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                          {new Date(selectedMastery.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Current enhancements */}
                    {selectedMastery.unlockedEnhancements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-cyan)' }}>
                          Unlocked Enhancements
                        </h4>
                        <div className="space-y-1">
                          {selectedMastery.unlockedEnhancements.map((id, i) => (
                            <motion.div
                              key={id}
                              className="pixel-text pixel-text-xs pl-2"
                              style={{ color: 'var(--pixel-green)' }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              ✓ Level {i + 1} Enhancement
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Next unlock */}
                    {selectedEnhancement && (
                      <div className="border-t border-metal-700 pt-4">
                        <h4 className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-yellow)' }}>
                          Next Unlock at Level {selectedEnhancement.requiredLevel}
                        </h4>
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                          {selectedEnhancement.description}
                        </p>
                        
                        {/* Progress to next level */}
                        <div className="mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                              Progress:
                            </span>
                            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                              {selectedMastery.masteryProgress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-metal-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-yellow-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedMastery.masteryProgress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Master status */}
                    {selectedMastery.masteryLevel === 5 && (
                      <motion.div
                        className="border-t border-metal-700 pt-4 text-center"
                        animate={{
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      >
                        <p className="punk-headline text-2xl" style={{ color: '#FFD700' }}>
                          FULLY MASTERED!
                        </p>
                        <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-yellow)' }}>
                          All enhancements unlocked
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                      Select a synergy to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer stats */}
            <div className="p-4 border-t border-metal-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    TOTAL MASTERY
                  </p>
                  <p className="pixel-text pixel-text-lg" style={{ color: 'var(--punk-neon-cyan)' }}>
                    {masteryData.reduce((sum, m) => sum + m.masteryLevel, 0)}
                  </p>
                </div>
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    MASTERS
                  </p>
                  <p className="pixel-text pixel-text-lg" style={{ color: '#FFD700' }}>
                    {masteryData.filter(m => m.masteryLevel === 5).length}
                  </p>
                </div>
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    TOTAL USES
                  </p>
                  <p className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-green)' }}>
                    {masteryData.reduce((sum, m) => sum + m.usageCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
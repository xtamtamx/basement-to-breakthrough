import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { achievementSynergySystem } from '@game/mechanics/AchievementSynergySystem';
import { SynergyCombo } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';

interface AchievementSynergyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementSynergyPanel: React.FC<AchievementSynergyPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<'unlocked' | 'locked'>('unlocked');
  
  const unlockedSynergies = achievementSynergySystem.getAvailableAchievementSynergies();
  const nearlyUnlockedSynergies = achievementSynergySystem.getNearlyUnlockedSynergies();
  
  const rarityColors = {
    common: 'var(--pixel-gray)',
    uncommon: 'var(--pixel-green)',
    rare: 'var(--pixel-blue)',
    legendary: 'var(--pixel-gold)'
  };
  
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
            className="relative glass-panel max-w-2xl max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-metal-700">
              <div className="flex justify-between items-center">
                <h2 className="punk-headline text-2xl" style={{ color: 'var(--punk-neon-purple)' }}>
                  Achievement Synergies
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
              
              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedTab('unlocked');
                    haptics.light();
                  }}
                  className={`flex-1 pixel-button py-2 px-4 ${
                    selectedTab === 'unlocked' ? 'bg-purple-600' : 'bg-metal-700'
                  }`}
                >
                  <span className="pixel-text pixel-text-sm">
                    UNLOCKED ({unlockedSynergies.length})
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSelectedTab('locked');
                    haptics.light();
                  }}
                  className={`flex-1 pixel-button py-2 px-4 ${
                    selectedTab === 'locked' ? 'bg-purple-600' : 'bg-metal-700'
                  }`}
                >
                  <span className="pixel-text pixel-text-sm">
                    LOCKED ({nearlyUnlockedSynergies.length})
                  </span>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {selectedTab === 'unlocked' ? (
                <div className="space-y-3">
                  {unlockedSynergies.length === 0 ? (
                    <p className="pixel-text text-center py-8" style={{ color: 'var(--pixel-gray)' }}>
                      No achievement synergies unlocked yet
                    </p>
                  ) : (
                    unlockedSynergies.map((synergy, index) => (
                      <motion.div
                        key={synergy.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-panel p-4 border"
                        style={{ borderColor: rarityColors[synergy.rarity] }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{synergy.icon}</div>
                          <div className="flex-1">
                            <h3 className="pixel-text pixel-text-sm mb-1" 
                              style={{ color: rarityColors[synergy.rarity] }}
                            >
                              {synergy.name}
                            </h3>
                            <p className="pixel-text pixel-text-xs mb-2" 
                              style={{ color: 'var(--pixel-white)' }}
                            >
                              {synergy.description}
                            </p>
                            
                            {/* Effects */}
                            <div className="flex flex-wrap gap-2">
                              {synergy.effects.map((effect, i) => (
                                <span 
                                  key={i}
                                  className="pixel-badge text-xs px-2 py-1"
                                  style={{ backgroundColor: 'var(--pixel-dark-purple)' }}
                                >
                                  +{effect.value}{effect.isPercentage ? '%' : ''} {effect.type.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {nearlyUnlockedSynergies.length === 0 ? (
                    <p className="pixel-text text-center py-8" style={{ color: 'var(--pixel-gray)' }}>
                      No achievement synergies close to unlocking
                    </p>
                  ) : (
                    nearlyUnlockedSynergies.map((synergy, index) => (
                      <motion.div
                        key={synergy.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-panel p-4 border border-metal-700 opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl grayscale opacity-50">{synergy.icon}</div>
                          <div className="flex-1">
                            <h3 className="pixel-text pixel-text-sm mb-1" 
                              style={{ color: 'var(--pixel-gray)' }}
                            >
                              {synergy.name} (LOCKED)
                            </h3>
                            <p className="pixel-text pixel-text-xs mb-2" 
                              style={{ color: 'var(--pixel-gray)' }}
                            >
                              {synergy.description}
                            </p>
                            
                            {/* Progress bar */}
                            <div className="mb-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="pixel-text pixel-text-xs" 
                                  style={{ color: 'var(--pixel-yellow)' }}
                                >
                                  {achievementSynergySystem.getSynergyRequirementDescription(synergy.id)}
                                </span>
                                <span className="pixel-text pixel-text-xs" 
                                  style={{ color: 'var(--pixel-yellow)' }}
                                >
                                  {synergy.unlockProgress}%
                                </span>
                              </div>
                              <div className="h-2 bg-metal-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-yellow-500"
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${synergy.unlockProgress}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                            
                            {/* Preview effects */}
                            <div className="flex flex-wrap gap-2 opacity-50">
                              {synergy.effects.map((effect, i) => (
                                <span 
                                  key={i}
                                  className="pixel-badge text-xs px-2 py-1"
                                  style={{ backgroundColor: 'var(--pixel-dark)' }}
                                >
                                  +{effect.value}{effect.isPercentage ? '%' : ''} {effect.type.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Footer with stats */}
            <div className="p-4 border-t border-metal-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    TOTAL UNLOCKED
                  </p>
                  <p className="pixel-text pixel-text-sm" style={{ color: 'var(--punk-neon-cyan)' }}>
                    {unlockedSynergies.length} / {unlockedSynergies.length + nearlyUnlockedSynergies.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    ACTIVE BONUSES
                  </p>
                  <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                    {unlockedSynergies.reduce((sum, s) => sum + s.effects.length, 0)} EFFECTS
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
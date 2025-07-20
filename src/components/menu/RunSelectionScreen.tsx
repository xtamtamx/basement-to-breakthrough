import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runManager, RunConfig } from '@game/mechanics/RunManager';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface RunSelectionScreenProps {
  onStartRun: (runConfig: RunConfig) => void;
  onBack: () => void;
}

export const RunSelectionScreen: React.FC<RunSelectionScreenProps> = ({ onStartRun, onBack }) => {
  const [selectedRun, setSelectedRun] = useState<string>('classic');
  const [showUpgrades, setShowUpgrades] = useState(false);
  
  const runConfigs = runManager.getRunConfigs();
  const progression = metaProgressionManager.getProgression();
  const runBonuses = metaProgressionManager.getRunStartBonuses();
  
  const handleStartRun = () => {
    const config = runConfigs.find(r => r.id === selectedRun);
    if (config) {
      haptics.success();
      audio.play('success');
      onStartRun(config);
    }
  };
  
  const getHighScore = (runId: string): number => {
    return progression.stats.bestScores[runId] || 0;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            <h1 className="pixel-text pixel-text-2xl" style={{ color: 'var(--pixel-yellow)' }}>
              SELECT YOUR RUN
            </h1>
            <button
              onClick={onBack}
              className="pixel-button p-3"
              style={{ backgroundColor: 'var(--pixel-gray)' }}
            >
              <span className="pixel-text">BACK</span>
            </button>
          </div>
          
          {/* Currency Display */}
          <div className="flex gap-4 mt-4">
            <div className="pixel-panel p-3">
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                FAME: {progression.currency.fame}
              </p>
            </div>
            <div className="pixel-panel p-3">
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-purple)' }}>
                LEGACY: {progression.currency.legacy}
              </p>
            </div>
            <div className="pixel-panel p-3">
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                RUNS: {progression.totalRuns}
              </p>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Run Selection */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="pixel-text pixel-text-lg mb-4" style={{ color: 'var(--pixel-cyan)' }}>
              CHOOSE RUN TYPE
            </h2>
            
            {runConfigs.map(config => (
              <motion.div
                key={config.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRun(config.id);
                  haptics.light();
                  audio.play('click');
                }}
                className={`pixel-panel p-4 cursor-pointer transition-all ${
                  selectedRun === config.id ? 'ring-2 ring-yellow-400' : ''
                }`}
                style={{ 
                  backgroundColor: selectedRun === config.id ? 'var(--pixel-purple)' : 'var(--pixel-dark-purple)' 
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-yellow)' }}>
                    {config.name}
                  </h3>
                  <div className="text-right">
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      HIGH SCORE
                    </p>
                    <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                      {getHighScore(config.id).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <p className="pixel-text pixel-text-sm mb-3" style={{ color: 'var(--pixel-white)' }}>
                  {config.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      STARTING RESOURCES
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                        ${config.startingMoney + runBonuses.startingMoney}
                      </p>
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-magenta)' }}>
                        {config.startingReputation + runBonuses.startingReputation} REP
                      </p>
                      <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                        {config.startingConnections} CONN
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      LIMITS
                    </p>
                    <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-orange)' }}>
                      {config.maxTurns} TURNS
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-gray)' }}>
                    WIN CONDITIONS
                  </p>
                  {config.winConditions.map((condition, i) => (
                    <p key={i} className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                      • {condition.description}
                    </p>
                  ))}
                </div>
                
                {config.modifiers.length > 0 && (
                  <div className="mt-3">
                    <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-gray)' }}>
                      MODIFIERS
                    </p>
                    {config.modifiers.map(modifier => (
                      <div key={modifier.id} className="pixel-badge inline-block mr-2 mb-1">
                        {modifier.name}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Meta Progression Panel */}
          <div className="space-y-4">
            <h2 className="pixel-text pixel-text-lg mb-4" style={{ color: 'var(--pixel-purple)' }}>
              META PROGRESSION
            </h2>
            
            {/* Active Bonuses */}
            <div className="pixel-panel p-4">
              <h3 className="pixel-text pixel-text-sm mb-3" style={{ color: 'var(--pixel-yellow)' }}>
                ACTIVE BONUSES
              </h3>
              
              {runBonuses.startingMoney > 0 && (
                <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-green)' }}>
                  +${runBonuses.startingMoney} starting money
                </p>
              )}
              {runBonuses.startingReputation > 0 && (
                <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-magenta)' }}>
                  +{runBonuses.startingReputation} starting reputation
                </p>
              )}
              {runBonuses.bandQualityMultiplier > 1 && (
                <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-cyan)' }}>
                  {Math.round((runBonuses.bandQualityMultiplier - 1) * 100)}% better bands
                </p>
              )}
              {runBonuses.venueDiscountMultiplier < 1 && (
                <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-orange)' }}>
                  {Math.round((1 - runBonuses.venueDiscountMultiplier) * 100)}% venue discount
                </p>
              )}
              {runBonuses.stressReductionMultiplier < 1 && (
                <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-purple)' }}>
                  {Math.round((1 - runBonuses.stressReductionMultiplier) * 100)}% less stress
                </p>
              )}
              
              {Object.values(runBonuses).every(v => v === 0 || v === 1) && (
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  No bonuses active. Purchase upgrades!
                </p>
              )}
            </div>
            
            {/* Achievements Preview */}
            <div className="pixel-panel p-4">
              <h3 className="pixel-text pixel-text-sm mb-3" style={{ color: 'var(--pixel-yellow)' }}>
                ACHIEVEMENTS
              </h3>
              <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-white)' }}>
                {progression.achievements.length} / 50 unlocked
              </p>
              <div className="flex flex-wrap gap-2">
                {progression.achievements.slice(0, 6).map(achievement => (
                  <div key={achievement.id} className="text-2xl" title={achievement.name}>
                    {achievement.icon}
                  </div>
                ))}
                {progression.achievements.length > 6 && (
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    +{progression.achievements.length - 6} more
                  </p>
                )}
              </div>
            </div>
            
            {/* Upgrade Shop Button */}
            <button
              onClick={() => setShowUpgrades(true)}
              className="w-full pixel-button p-4"
              style={{ backgroundColor: 'var(--pixel-purple)' }}
            >
              <span className="pixel-text pixel-text-sm">UPGRADE SHOP</span>
            </button>
          </div>
        </div>
        
        {/* Start Run Button */}
        <div className="max-w-6xl mx-auto mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartRun}
            className="w-full pixel-button p-6"
            style={{
              background: 'linear-gradient(45deg, var(--pixel-green), var(--pixel-cyan))',
              boxShadow: '0 0 30px var(--pixel-green)'
            }}
          >
            <span className="pixel-text pixel-text-xl">START RUN</span>
          </motion.button>
        </div>
      </div>
      
      {/* Upgrade Shop Modal */}
      <AnimatePresence>
        {showUpgrades && (
          <UpgradeShopModal onClose={() => setShowUpgrades(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Upgrade Shop Modal Component
const UpgradeShopModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const progression = metaProgressionManager.getProgression();
  const [selectedTab, setSelectedTab] = useState<'upgrades' | 'unlocks'>('upgrades');
  
  const handlePurchaseUpgrade = (upgradeId: string) => {
    const result = metaProgressionManager.purchaseUpgrade(upgradeId);
    if (result.success) {
      haptics.success();
      audio.play('purchase');
    } else {
      haptics.error();
      audio.play('error');
    }
  };
  
  const handlePurchaseUnlock = (unlockId: string) => {
    const result = metaProgressionManager.purchaseUnlock(unlockId);
    if (result.success) {
      haptics.success();
      audio.play('purchase');
    } else {
      haptics.error();
      audio.play('error');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="pixel-text pixel-text-xl" style={{ color: 'var(--pixel-purple)' }}>
            UPGRADE SHOP
          </h2>
          <button
            onClick={onClose}
            className="pixel-button p-2"
            style={{ backgroundColor: 'var(--pixel-red)' }}
          >
            <span className="pixel-text">CLOSE</span>
          </button>
        </div>
        
        {/* Tab Selection */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedTab('upgrades')}
            className={`pixel-button p-3 ${selectedTab === 'upgrades' ? 'ring-2 ring-yellow-400' : ''}`}
            style={{ backgroundColor: selectedTab === 'upgrades' ? 'var(--pixel-cyan)' : 'var(--pixel-gray)' }}
          >
            <span className="pixel-text">UPGRADES</span>
          </button>
          <button
            onClick={() => setSelectedTab('unlocks')}
            className={`pixel-button p-3 ${selectedTab === 'unlocks' ? 'ring-2 ring-yellow-400' : ''}`}
            style={{ backgroundColor: selectedTab === 'unlocks' ? 'var(--pixel-cyan)' : 'var(--pixel-gray)' }}
          >
            <span className="pixel-text">UNLOCKS</span>
          </button>
        </div>
        
        {/* Content */}
        {selectedTab === 'upgrades' ? (
          <div className="space-y-4">
            {progression.upgrades.map(upgrade => (
              <div key={upgrade.id} className="glass-panel p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                      {upgrade.name}
                    </h3>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                      {upgrade.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      LEVEL {upgrade.currentLevel}/{upgrade.maxLevel}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="pixel-progress-bar h-3 mb-3">
                  <div 
                    className="pixel-progress-fill"
                    style={{ 
                      width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%`,
                      backgroundColor: 'var(--pixel-green)'
                    }}
                  />
                </div>
                
                {/* Effects */}
                <div className="mb-3">
                  {upgrade.effects.map((effect, i) => (
                    <p key={i} className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                      {effect.description}
                    </p>
                  ))}
                </div>
                
                {/* Purchase Button */}
                {upgrade.currentLevel < upgrade.maxLevel && (
                  <button
                    onClick={() => handlePurchaseUpgrade(upgrade.id)}
                    disabled={progression.currency.fame < (upgrade.cost.fame || 0) * (upgrade.currentLevel + 1)}
                    className="pixel-button p-2 w-full"
                    style={{ 
                      backgroundColor: progression.currency.fame >= (upgrade.cost.fame || 0) * (upgrade.currentLevel + 1) 
                        ? 'var(--pixel-green)' 
                        : 'var(--pixel-gray)' 
                    }}
                  >
                    <span className="pixel-text pixel-text-xs">
                      UPGRADE - {(upgrade.cost.fame || 0) * (upgrade.currentLevel + 1)} FAME
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {metaProgressionManager.getAvailableUnlocks().map(unlock => (
              <div key={unlock.id} className="glass-panel p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                      {unlock.name}
                    </h3>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                      {unlock.description}
                    </p>
                  </div>
                  <span className="pixel-badge" style={{ backgroundColor: 'var(--pixel-purple)' }}>
                    TIER {unlock.tier}
                  </span>
                </div>
                
                {/* Cost */}
                <div className="mb-3">
                  {unlock.cost.fame && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                      Cost: {unlock.cost.fame} Fame
                    </p>
                  )}
                  {unlock.cost.legacy && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-purple)' }}>
                      Cost: {unlock.cost.legacy} Legacy
                    </p>
                  )}
                  {unlock.cost.achievement && (
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
                      Requires: {unlock.cost.achievement}
                    </p>
                  )}
                </div>
                
                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchaseUnlock(unlock.id)}
                  disabled={
                    (unlock.cost.fame && progression.currency.fame < unlock.cost.fame) ||
                    (unlock.cost.legacy && progression.currency.legacy < unlock.cost.legacy) ||
                    (unlock.cost.achievement && !metaProgressionManager.hasAchievement(unlock.cost.achievement))
                  }
                  className="pixel-button p-2 w-full"
                  style={{ 
                    backgroundColor: 'var(--pixel-green)'
                  }}
                >
                  <span className="pixel-text pixel-text-xs">UNLOCK</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
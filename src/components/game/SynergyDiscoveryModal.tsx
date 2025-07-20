import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SynergyCombo, DiscoveryNotification } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface SynergyDiscoveryModalProps {
  notifications: DiscoveryNotification[];
  onClose: () => void;
}

export const SynergyDiscoveryModal: React.FC<SynergyDiscoveryModalProps> = ({
  notifications,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingEffects, setShowingEffects] = useState(false);
  
  const current = notifications[currentIndex];
  if (!current) return null;
  
  const handleNext = () => {
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowingEffects(false);
      haptics.light();
      audio.play('click');
    } else {
      onClose();
    }
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'var(--pixel-gray)';
      case 'uncommon': return 'var(--pixel-green)';
      case 'rare': return 'var(--pixel-blue)';
      case 'legendary': return 'var(--pixel-purple)';
      default: return 'var(--pixel-white)';
    }
  };
  
  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '0 0 30px var(--pixel-purple)';
      case 'rare': return '0 0 20px var(--pixel-blue)';
      case 'uncommon': return '0 0 15px var(--pixel-green)';
      default: return '';
    }
  };
  
  useEffect(() => {
    if (current.firstTime) {
      // Delay showing effects for dramatic reveal
      const timer = setTimeout(() => setShowingEffects(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowingEffects(true);
    }
  }, [current]);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={handleNext}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="pixel-panel p-6 max-w-md w-full"
          style={{ 
            boxShadow: getRarityGlow(current.combo.rarity),
            borderColor: getRarityColor(current.combo.rarity)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Discovery Header */}
          {current.firstTime && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-4"
            >
              <p className="pixel-text pixel-text-sm pixel-blink" style={{ color: 'var(--pixel-yellow)' }}>
                NEW SYNERGY DISCOVERED!
              </p>
            </motion.div>
          )}
          
          {/* Icon and Name */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center mb-4"
          >
            <div className="text-6xl mb-2">{current.combo.icon}</div>
            <h2 className="pixel-text pixel-text-lg" style={{ color: getRarityColor(current.combo.rarity) }}>
              {current.combo.name}
            </h2>
            <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-gray)' }}>
              {current.combo.rarity.toUpperCase()} SYNERGY
            </p>
          </motion.div>
          
          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-4"
          >
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
              {current.combo.description}
            </p>
            {current.combo.flavorText && (
              <p className="pixel-text pixel-text-xs mt-2 italic" style={{ color: 'var(--pixel-gray)' }}>
                "{current.combo.flavorText}"
              </p>
            )}
          </motion.div>
          
          {/* Effects */}
          <AnimatePresence>
            {showingEffects && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pixel-panel-inset p-3 mb-4"
              >
                <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-cyan)' }}>
                  EFFECTS:
                </p>
                {current.combo.effects.map((effect, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 mb-1"
                  >
                    <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
                      ▸
                    </span>
                    <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                      {effect.description}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* First Time Bonus */}
          {current.firstTime && current.bonusReward && showingEffects && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="text-center mb-4"
            >
              <div className="pixel-badge" style={{ backgroundColor: 'var(--pixel-yellow)' }}>
                DISCOVERY BONUS: +{current.bonusReward.value} {current.bonusReward.type.toUpperCase()}
              </div>
            </motion.div>
          )}
          
          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={handleNext}
            className="w-full pixel-button p-3"
            style={{
              backgroundColor: getRarityColor(current.combo.rarity),
              boxShadow: getRarityGlow(current.combo.rarity)
            }}
          >
            <span className="pixel-text pixel-text-sm">
              {currentIndex < notifications.length - 1 ? 'NEXT DISCOVERY' : 'CONTINUE'}
            </span>
          </motion.button>
          
          {/* Progress dots */}
          {notifications.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {notifications.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i === currentIndex ? getRarityColor(current.combo.rarity) : 'var(--pixel-gray)',
                    opacity: i === currentIndex ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
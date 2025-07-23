import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SynergyCombo } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface SynergyRevealAnimationProps {
  synergy: SynergyCombo;
  position: { x: number; y: number };
  onComplete: () => void;
  isNew?: boolean;
}

const rarityColors = {
  common: { bg: '#4A5568', glow: '#718096', particles: '#A0AEC0' },
  uncommon: { bg: '#22543D', glow: '#38A169', particles: '#68D391' },
  rare: { bg: '#2C5282', glow: '#3182CE', particles: '#63B3ED' },
  legendary: { bg: '#744210', glow: '#D69E2E', particles: '#F6E05E' }
};

const rarityHaptics = {
  common: () => haptics.light(),
  uncommon: () => haptics.medium(),
  rare: () => haptics.heavy(),
  legendary: () => {
    haptics.heavy();
    setTimeout(() => haptics.heavy(), 100);
    setTimeout(() => haptics.heavy(), 200);
  }
};

const rarityAudio = {
  common: () => audio.play('success'),
  uncommon: () => audio.play('success'),
  rare: () => audio.play('achievement'),
  legendary: () => {
    audio.play('achievement');
    setTimeout(() => audio.play('success'), 200);
  }
};

export const SynergyRevealAnimation: React.FC<SynergyRevealAnimationProps> = ({
  synergy,
  position,
  onComplete,
  isNew = true
}) => {
  const colors = rarityColors[synergy.rarity];
  
  useEffect(() => {
    if (isNew) {
      // Trigger haptic feedback based on rarity
      rarityHaptics[synergy.rarity]();
      
      // Play sound effect
      rarityAudio[synergy.rarity]();
    }
    
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [synergy.rarity, onComplete, isNew]);
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed pointer-events-none"
        style={{ 
          left: position.x,
          top: position.y,
          zIndex: 3000
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        {/* Background burst effect */}
        <motion.div
          className="absolute -inset-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1.2],
            opacity: [0, 0.5, 0]
          }}
          transition={{ duration: 1 }}
        >
          <div 
            className="w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              filter: 'blur(20px)'
            }}
          />
        </motion.div>
        
        {/* Particle effects */}
        {[...Array(synergy.rarity === 'legendary' ? 12 : 8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            initial={{ 
              x: 0, 
              y: 0,
              scale: 0
            }}
            animate={{ 
              x: Math.cos(i * Math.PI / 4) * 100,
              y: Math.sin(i * Math.PI / 4) * 100,
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.1,
              ease: "easeOut"
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: colors.particles,
                boxShadow: `0 0 10px ${colors.particles}`
              }}
            />
          </motion.div>
        ))}
        
        {/* Main card */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [180, 0],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 0.8,
            times: [0, 0.6, 1]
          }}
        >
          <div 
            className="glass-panel p-4 border-2"
            style={{ 
              borderColor: colors.glow,
              backgroundColor: colors.bg,
              minWidth: '250px',
              boxShadow: `
                0 0 30px ${colors.glow},
                0 0 60px ${colors.glow}33,
                inset 0 0 20px ${colors.glow}33
              `
            }}
          >
            {/* Icon with glow effect */}
            <motion.div 
              className="text-center mb-3"
              animate={{
                scale: [1, 1.2, 1],
                rotate: synergy.rarity === 'legendary' ? [0, 360] : 0
              }}
              transition={{
                duration: synergy.rarity === 'legendary' ? 3 : 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <span className="text-4xl" style={{ 
                filter: `drop-shadow(0 0 20px ${colors.glow})` 
              }}>
                {synergy.icon}
              </span>
            </motion.div>
            
            {/* Synergy name with punk styling */}
            <motion.h3 
              className="pixel-text pixel-text-sm text-center mb-2 punk-stencil"
              style={{ color: colors.glow }}
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              {synergy.name}
            </motion.h3>
            
            {/* Rarity badge */}
            <motion.div 
              className="text-center mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span 
                className="pixel-badge px-3 py-1"
                style={{ 
                  backgroundColor: colors.glow,
                  color: '#000',
                  fontSize: '8px',
                  boxShadow: `0 0 10px ${colors.glow}`
                }}
              >
                {synergy.rarity.toUpperCase()}
              </span>
            </motion.div>
            
            {/* Description */}
            <motion.p 
              className="pixel-text pixel-text-xs text-center mb-3"
              style={{ color: '#E8E8E8' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {synergy.description}
            </motion.p>
            
            {/* Effects preview */}
            {synergy.effects.length > 0 && (
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {synergy.effects.slice(0, 2).map((effect, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center justify-center gap-1"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2 + i * 0.1 }}
                  >
                    <span className="pixel-text" style={{ 
                      fontSize: '8px', 
                      color: colors.particles 
                    }}>
                      +{effect.value}{effect.isPercentage ? '%' : ''} {effect.type.replace('_', ' ')}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* New discovery text */}
            {isNew && (
              <motion.div 
                className="text-center mt-3"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity
                }}
              >
                <span className="pixel-text pixel-text-xs punk-neon-cyan" 
                  style={{ color: 'var(--punk-neon-cyan)' }}
                >
                  NEW SYNERGY DISCOVERED!
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
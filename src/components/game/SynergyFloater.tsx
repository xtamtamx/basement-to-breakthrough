import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SynergyCombo } from '@game/mechanics/SynergyDiscoverySystem';

interface SynergyFloaterProps {
  synergy: SynergyCombo;
  position: { x: number; y: number };
  onComplete: () => void;
}

const rarityColors = {
  common: 'var(--pixel-gray)',
  uncommon: 'var(--pixel-green)', 
  rare: 'var(--pixel-blue)',
  legendary: 'var(--pixel-gold)'
};

const rarityGlows = {
  common: 'rgba(156, 163, 175, 0.3)',
  uncommon: 'rgba(34, 197, 94, 0.3)',
  rare: 'rgba(59, 130, 246, 0.3)', 
  legendary: 'rgba(251, 191, 36, 0.3)'
};

export const SynergyFloater: React.FC<SynergyFloaterProps> = ({
  synergy,
  position,
  onComplete
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  const color = rarityColors[synergy.rarity];
  const glow = rarityGlows[synergy.rarity];
  
  return (
    <motion.div
      className="absolute glass-panel p-3 pointer-events-none"
      style={{ 
        left: position.x,
        top: position.y,
        minWidth: '200px',
        zIndex: 2000,
        boxShadow: `0 0 30px ${glow}`
      }}
      initial={{ opacity: 0, scale: 0.5, y: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.1, 1, 1],
        y: [0, -10, -20, -60]
      }}
      transition={{ 
        duration: 3,
        times: [0, 0.2, 0.3, 1]
      }}
    >
      <div className="text-center">
        {/* Synergy Icon */}
        <div className="text-3xl mb-2 animate-pulse">
          {synergy.icon}
        </div>
        
        {/* Synergy Name */}
        <h3 className="pixel-text pixel-text-sm mb-1" style={{ color }}>
          {synergy.name}
        </h3>
        
        {/* Rarity Badge */}
        <div className="inline-block px-2 py-1 mb-2" 
          style={{ 
            backgroundColor: glow,
            border: `1px solid ${color}`
          }}
        >
          <span className="pixel-text pixel-text-xs" style={{ color }}>
            {synergy.rarity.toUpperCase()}
          </span>
        </div>
        
        {/* Description */}
        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
          {synergy.description}
        </p>
        
        {/* Effect Preview */}
        {synergy.effects.length > 0 && (
          <div className="mt-2 space-y-1">
            {synergy.effects.slice(0, 2).map((effect, i) => (
              <div key={i} className="flex items-center justify-center gap-1">
                <span className="pixel-text" style={{ fontSize: '8px', color: 'var(--pixel-green)' }}>
                  +{effect.value}{effect.isPercentage ? '%' : ''} {effect.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Discovery Text */}
        <motion.p 
          className="pixel-text pixel-text-xs mt-2" 
          style={{ color: 'var(--pixel-yellow)' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SYNERGY DISCOVERED!
        </motion.p>
      </div>
    </motion.div>
  );
};
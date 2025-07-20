import React from 'react';
import { motion } from 'framer-motion';
import { factionSystem } from '@game/mechanics/FactionSystem';

export const FactionDisplay: React.FC = () => {
  const factions = factionSystem.getAllFactionData();

  const getStandingColor = (standing: number) => {
    if (standing > 50) return 'var(--pixel-green)';
    if (standing > 20) return 'var(--pixel-cyan)';
    if (standing < -50) return 'var(--pixel-red)';
    if (standing < -20) return 'var(--pixel-orange)';
    return 'var(--pixel-gray)';
  };

  const getStandingText = (standing: number) => {
    if (standing > 80) return 'ALLIED';
    if (standing > 50) return 'FRIENDLY';
    if (standing > 20) return 'NEUTRAL+';
    if (standing < -80) return 'HOSTILE';
    if (standing < -50) return 'UNFRIENDLY';
    if (standing < -20) return 'NEUTRAL-';
    return 'NEUTRAL';
  };

  return (
    <div className="glass-panel p-3 mb-4">
      <h3 className="pixel-text pixel-text-sm mb-3" style={{ color: 'var(--pixel-yellow)' }}>
        FACTION STANDINGS
      </h3>
      
      <div className="space-y-2">
        {factions.map((faction) => (
          <motion.div
            key={faction.id}
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 pixel-border"
                style={{ backgroundColor: faction.iconColor }}
              />
              <span className="pixel-text pixel-text-xs">
                {faction.name.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 pixel-border bg-black relative">
                <motion.div
                  className="absolute h-full"
                  style={{ 
                    backgroundColor: getStandingColor(faction.playerStanding),
                    width: `${Math.abs(faction.playerStanding)}%`,
                    left: faction.playerStanding < 0 ? `${50 + faction.playerStanding / 2}%` : '50%'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(faction.playerStanding)}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>
              <span 
                className="pixel-text pixel-text-xs"
                style={{ color: getStandingColor(faction.playerStanding) }}
              >
                {getStandingText(faction.playerStanding)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-metal-800">
        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
          FACTION STANDING AFFECTS SHOW OUTCOMES
        </p>
      </div>
    </div>
  );
};
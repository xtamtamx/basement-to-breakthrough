import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Venue } from '@game/types';
import { synergyDiscoverySystem, SynergyCombo } from '@game/mechanics/SynergyDiscoverySystem';
import { synergyChainSystem } from '@game/mechanics/SynergyChainSystem';
import { haptics } from '@utils/mobile';

interface ChainReactionPreviewProps {
  bands: Band[];
  venue: Venue | null;
  className?: string;
}

export const ChainReactionPreview: React.FC<ChainReactionPreviewProps> = ({
  bands,
  venue,
  className = ''
}) => {
  const [potentialChains, setPotentialChains] = useState<string[]>([]);
  const [activeSynergies, setActiveSynergies] = useState<SynergyCombo[]>([]);
  
  useEffect(() => {
    if (bands.length === 0 || !venue) {
      setPotentialChains([]);
      setActiveSynergies([]);
      return;
    }
    
    // Check what synergies would be active
    const bandSynergies = synergyDiscoverySystem.checkBandSynergies(bands);
    const venueSynergies = synergyDiscoverySystem.checkVenueSynergies(bands, venue);
    const allSynergies = [...bandSynergies, ...venueSynergies];
    
    setActiveSynergies(allSynergies);
    
    // Check for potential chains
    const chains = synergyChainSystem.getPotentialChains(allSynergies);
    setPotentialChains(chains);
    
    // Haptic feedback if chain potential detected
    if (chains.length > 0) {
      haptics.light();
    }
  }, [bands, venue]);
  
  if (potentialChains.length === 0) return null;
  
  return (
    <motion.div
      className={`glass-panel p-3 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.1))',
        border: '2px solid var(--pixel-gold)'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          className="text-2xl"
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
          ⚡
        </motion.span>
        <h4 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gold)' }}>
          CHAIN POTENTIAL!
        </h4>
      </div>
      
      <div className="space-y-1">
        {potentialChains.slice(0, 3).map((chain, index) => (
          <motion.div
            key={chain}
            className="pixel-text pixel-text-xs"
            style={{ color: 'var(--pixel-yellow)' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {chain}
          </motion.div>
        ))}
        
        {potentialChains.length > 3 && (
          <motion.div
            className="pixel-text pixel-text-xs"
            style={{ color: 'var(--pixel-orange)' }}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          >
            +{potentialChains.length - 3} more chains possible!
          </motion.div>
        )}
      </div>
      
      {/* Active synergy count indicator */}
      <div className="mt-2 pt-2 border-t border-metal-700">
        <div className="flex justify-between items-center">
          <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
            Active Synergies:
          </span>
          <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
            {activeSynergies.length}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
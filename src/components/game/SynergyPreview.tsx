import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Venue } from '@game/types';
import { synergyDiscoverySystem, SynergyCombo } from '@game/mechanics/SynergyDiscoverySystem';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';

interface SynergyPreviewProps {
  sourceBand?: Band;
  targetBands?: Band[];
  targetVenue?: Venue;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const SynergyPreview: React.FC<SynergyPreviewProps> = ({
  sourceBand,
  targetBands = [],
  targetVenue,
  isVisible,
  position
}) => {
  const [potentialSynergies, setPotentialSynergies] = useState<SynergyCombo[]>([]);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [undiscoveredCount, setUndiscoveredCount] = useState(0);
  
  useEffect(() => {
    if (!isVisible || !sourceBand) {
      setPotentialSynergies([]);
      setDiscoveredCount(0);
      setUndiscoveredCount(0);
      return;
    }
    
    // Create a mock show to test synergies
    const allBands = [...targetBands, sourceBand];
    
    if (targetVenue) {
      const equipment = equipmentManagerV2.getVenueEquipment(targetVenue.id);
      const mockShow = {
        id: 'preview',
        bandId: sourceBand.id,
        venueId: targetVenue.id,
        date: new Date(),
        ticketPrice: 10,
        status: 'SCHEDULED' as const
      };
      
      // Get all potential synergies without triggering them
      const synergies = synergyDiscoverySystem.checkPotentialSynergies(
        mockShow,
        allBands,
        targetVenue,
        equipment
      );
      
      setPotentialSynergies(synergies);
      setDiscoveredCount(synergies.filter(s => s.discovered).length);
      setUndiscoveredCount(synergies.filter(s => !s.discovered).length);
    } else if (targetBands.length > 0) {
      // Just checking band-to-band synergies
      const synergies = synergyDiscoverySystem.checkBandSynergies(allBands);
      setPotentialSynergies(synergies);
      setDiscoveredCount(synergies.filter(s => s.discovered).length);
      setUndiscoveredCount(synergies.filter(s => !s.discovered).length);
    } else {
      setPotentialSynergies([]);
      setDiscoveredCount(0);
      setUndiscoveredCount(0);
    }
  }, [sourceBand?.id, targetBands.length, targetVenue?.id, isVisible]);
  
  if (!isVisible || potentialSynergies.length === 0) return null;
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'var(--pixel-gray)';
      case 'uncommon': return 'var(--pixel-green)';
      case 'rare': return 'var(--pixel-blue)';
      case 'legendary': return 'var(--pixel-purple)';
      default: return 'var(--pixel-white)';
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="fixed z-[100] pointer-events-none"
        style={{
          left: position.x + 20,
          top: position.y - 60,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="relative">
          {/* Main preview bubble */}
          <motion.div
            className="pixel-panel p-3 relative"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              minWidth: '200px'
            }}
          >
            {/* Synergy indicators */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                  POTENTIAL SYNERGIES
                </p>
                <div className="flex gap-2 mt-1">
                  {discoveredCount > 0 && (
                    <span className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-green)' }}>
                      {discoveredCount} KNOWN
                    </span>
                  )}
                  {undiscoveredCount > 0 && (
                    <span className="pixel-text pixel-blink" style={{ fontSize: '6px', color: 'var(--pixel-cyan)' }}>
                      {undiscoveredCount} NEW!
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Synergy list */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {potentialSynergies.slice(0, 3).map((synergy, i) => (
                <motion.div
                  key={synergy.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm">{synergy.icon}</span>
                  <div className="flex-1">
                    <p 
                      className="pixel-text" 
                      style={{ 
                        fontSize: '7px', 
                        color: synergy.discovered ? getRarityColor(synergy.rarity) : 'var(--pixel-gray)'
                      }}
                    >
                      {synergy.discovered ? synergy.name : '???'}
                    </p>
                    {!synergy.discovered && (
                      <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}>
                        {synergy.rarity.toUpperCase()} SYNERGY
                      </p>
                    )}
                  </div>
                  {synergy.discovered && (
                    <span className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-green)' }}>
                      ✓
                    </span>
                  )}
                </motion.div>
              ))}
              
              {potentialSynergies.length > 3 && (
                <p className="pixel-text text-center mt-2" style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}>
                  +{potentialSynergies.length - 3} MORE
                </p>
              )}
            </div>
            
            {/* Legendary indicator */}
            {potentialSynergies.some(s => s.rarity === 'legendary' && !s.discovered) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 pixel-badge"
                style={{ 
                  backgroundColor: 'var(--pixel-purple)',
                  boxShadow: '0 0 10px var(--pixel-purple)'
                }}
              >
                <span className="pixel-text" style={{ fontSize: '6px' }}>LEGENDARY!</span>
              </motion.div>
            )}
          </motion.div>
          
          {/* Arrow pointing down */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--pixel-black)',
              bottom: '-6px'
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
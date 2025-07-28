import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SATIRICAL_SYNERGY_DATA } from '@game/data/satiricalText';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export interface SynergyDiscoveryProps {
  synergyId: string;
  name: string;
  tier: 'common' | 'rare' | 'legendary' | 'mythic';
  icon: string;
}

export const SynergyDiscoveryNotification: React.FC<{ discovery: SynergyDiscoveryProps | null }> = ({ discovery }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (discovery) {
      setShow(true);
      
      // Play effects based on tier
      switch (discovery.tier) {
        case 'mythic':
          haptics.heavy();
          audio.play('achievement');
          break;
        case 'legendary':
          haptics.medium();
          audio.play('synergy_legendary');
          break;
        case 'rare':
          haptics.light();
          audio.play('synergy_rare');
          break;
        default:
          haptics.light();
          audio.play('synergy_common');
      }

      // Auto-hide after delay
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [discovery]);

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'mythic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      case 'rare': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getTierGlow = (tier: string): string => {
    switch (tier) {
      case 'mythic': return '0 0 30px rgba(139, 92, 246, 0.8)';
      case 'legendary': return '0 0 25px rgba(245, 158, 11, 0.8)';
      case 'rare': return '0 0 20px rgba(59, 130, 246, 0.8)';
      default: return '0 0 15px rgba(16, 185, 129, 0.8)';
    }
  };

  const getDiscoveryText = (): string => {
    if (!discovery) return '';
    const satiricalData = SATIRICAL_SYNERGY_DATA[discovery.synergyId];
    return satiricalData?.discoveryText || `${discovery.tier.toUpperCase()} SYNERGY DISCOVERED!`;
  };

  return (
    <AnimatePresence>
      {show && discovery && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'min(90vw, 500px)',
            backgroundColor: '#0a0a0a',
            border: `3px solid ${getTierColor(discovery.tier)}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: getTierGlow(discovery.tier),
          }}
        >
          {/* Tier Banner */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            right: '-1px',
            height: '30px',
            backgroundColor: getTierColor(discovery.tier),
            borderRadius: '10px 10px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#fff'
          }}>
            {discovery.tier} synergy discovered!
          </div>

          {/* Content */}
          <div style={{ marginTop: '20px' }}>
            {/* Icon and Name */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              marginBottom: '12px'
            }}>
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ fontSize: '48px' }}
              >
                {discovery.icon}
              </motion.span>
              <h3 style={{ 
                margin: 0, 
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {discovery.name}
              </h3>
            </div>

            {/* Discovery Text */}
            <p style={{
              margin: 0,
              color: '#d1d5db',
              fontSize: '14px',
              fontStyle: 'italic',
              lineHeight: 1.5
            }}>
              {getDiscoveryText()}
            </p>

            {/* Hint */}
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              Check the Synergy tab to see full effects
            </div>
          </div>

          {/* Particles Effect for Mythic */}
          {discovery.tier === 'mythic' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              borderRadius: '12px'
            }}>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 500 - 250,
                    y: Math.random() * 200 - 100,
                    opacity: 0
                  }}
                  animate={{ 
                    y: [null, -200],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '4px',
                    height: '4px',
                    backgroundColor: getTierColor(discovery.tier),
                    borderRadius: '50%',
                    filter: 'blur(1px)'
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
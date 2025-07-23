import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Band } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface PremiumBandCardProps {
  band: Band;
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  onDrop?: (position: { x: number; y: number }) => void;
  isDragging?: boolean;
  initialPosition?: { x: number; y: number };
}

export const PremiumBandCard: React.FC<PremiumBandCardProps> = ({
  band,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging = false,
  initialPosition = { x: 0, y: 0 }
}) => {
  const [isLifted, setIsLifted] = useState(false);
  const controls = useAnimation();
  
  // Motion values for smooth physics
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  
  // Transform for tilt effect while dragging
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);
  
  const handleDragStart = () => {
    setIsLifted(true);
    haptics.light();
    audio.play('pickup');
    onDragStart?.();
    
    // Lift animation
    controls.start({
      scale: 1.1,
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      zIndex: 1000,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    });
  };
  
  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsLifted(false);
    
    const finalPosition = {
      x: initialPosition.x + info.offset.x,
      y: initialPosition.y + info.offset.y
    };
    
    // Drop animation
    controls.start({
      scale: 1,
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      zIndex: 'auto',
      transition: { type: 'spring', stiffness: 500, damping: 30 }
    });
    
    // Haptic feedback
    haptics.medium();
    audio.play('drop');
    
    onDragEnd?.(finalPosition);
    onDrop?.(finalPosition);
  };
  
  return (
    <motion.div
      className="touch-target"
      style={{
        x,
        y,
        position: 'absolute',
        minWidth: '240px',
        minHeight: '44px', // 44px minimum touch target
        cursor: 'grab',
        touchAction: 'none'
      }}
      drag
      dragElastic={0.15}
      dragMomentum={false}
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98, cursor: 'grabbing' }}
    >
      <motion.div
        className="relative punk-polaroid"
        style={{
          rotateX: isLifted ? rotateX : 0,
          rotateY: isLifted ? rotateY : 0,
          transformStyle: 'preserve-3d',
          transform: isLifted ? 'translateZ(50px)' : 'translateZ(0)'
        }}
      >
        {/* Polaroid Image Area */}
        <div className="punk-polaroid-image mb-2" style={{ minHeight: '120px' }}>
          {/* Band visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="text-center"
              animate={{
                scale: isLifted ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.6,
                repeat: isLifted ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <div className="text-4xl mb-2 opacity-80">
                {band.genre === 'PUNK' ? '🎸' : 
                 band.genre === 'METAL' ? '🤘' :
                 band.genre === 'HARDCORE' ? '💀' :
                 band.genre === 'GRUNGE' ? '🎵' : '🎤'}
              </div>
              <div className="punk-stencil text-xs px-2">
                {band.genre}
              </div>
            </motion.div>
          </div>
          
          {/* Real artist badge */}
          {band.isRealArtist && (
            <motion.div 
              className="absolute top-2 right-2"
              animate={{
                rotate: isLifted ? [0, -5, 5, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: isLifted ? Infinity : 0,
              }}
            >
              <span className="pixel-badge" style={{ 
                backgroundColor: 'var(--punk-neon-purple)', 
                fontSize: '6px',
                boxShadow: '0 0 10px var(--punk-neon-purple)'
              }}>
                REAL
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Polaroid "Written" Area */}
        <div className="px-2 pb-2">
          <h3 className="pixel-text pixel-text-sm mb-1" style={{ 
            color: '#333',
            textShadow: 'none',
            fontFamily: 'monospace',
            transform: 'rotate(-1deg)'
          }}>
            {band.name}
          </h3>

          {/* Stats in handwritten style */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span style={{ 
                fontSize: '9px', 
                color: '#444',
                fontFamily: 'monospace'
              }}>
                POP: {band.popularity}
              </span>
              <span style={{ 
                fontSize: '9px', 
                color: '#444',
                fontFamily: 'monospace'
              }}>
                {band.hometown || 'Underground'}
              </span>
            </div>

            {/* Compact Stats as stamps */}
            <div className="flex gap-2">
              <div className="transform rotate-2" style={{
                padding: '2px 4px',
                border: '1px solid #666',
                borderRadius: '2px',
                fontSize: '8px',
                color: '#666',
                fontFamily: 'monospace'
              }}>
                AUTH {band.authenticity}
              </div>
              <div className="transform -rotate-1" style={{
                padding: '2px 4px',
                border: '1px solid #666',
                borderRadius: '2px',
                fontSize: '8px',
                color: '#666',
                fontFamily: 'monospace'
              }}>
                NRG {band.energy}
              </div>
            </div>

            {/* Traits as small notes */}
            {band.traits && band.traits.length > 0 && (
              <div className="mt-1">
                <div style={{
                  fontSize: '7px',
                  color: '#555',
                  fontFamily: 'monospace',
                  fontStyle: 'italic'
                }}>
                  {band.traits.map(t => t.name).join(' • ')}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Drag indicator for mobile */}
        {isLifted && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="pixel-text pixel-text-xs punk-neon-cyan" 
              style={{ color: 'var(--punk-neon-cyan)' }}
            >
              DRAGGING
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
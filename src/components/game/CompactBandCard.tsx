import React from 'react';
import { motion } from 'framer-motion';
import { Band } from '@game/types';
import { haptics } from '@utils/mobile';

interface CompactBandCardProps {
  band: Band;
  onDragStart: () => void;
  isDragging?: boolean;
}

export const CompactBandCard: React.FC<CompactBandCardProps> = ({
  band,
  onDragStart,
  isDragging = false
}) => {
  const handleDragStart = () => {
    onDragStart();
    haptics.light();
  };

  return (
    <motion.div
      className={`
        relative punk-polaroid cursor-move
        ${isDragging ? 'opacity-50' : ''}
      `}
      whileHover={{ transform: 'rotate(0deg) scale(1.05)' }}
      whileTap={{ scale: 0.95 }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('band', JSON.stringify(band));
        handleDragStart();
      }}
      layout
      style={{ maxWidth: '240px' }}
    >
      {/* Polaroid Image Area */}
      <div className="punk-polaroid-image mb-2">
        {/* Band visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2 opacity-80">
              {band.genre === 'PUNK' ? '🎸' : 
               band.genre === 'METAL' ? '🤘' :
               band.genre === 'HARDCORE' ? '💀' :
               band.genre === 'GRUNGE' ? '🎵' : '🎤'}
            </div>
            <div className="punk-stencil text-xs px-2">
              {band.genre}
            </div>
          </div>
        </div>
        
        {/* Real artist badge */}
        {band.isRealArtist && (
          <div className="absolute top-2 right-2">
            <span className="pixel-badge" style={{ 
              backgroundColor: 'var(--punk-neon-purple)', 
              fontSize: '6px',
              boxShadow: '0 0 10px var(--punk-neon-purple)'
            }}>
              REAL
            </span>
          </div>
        )}
      </div>
      
      {/* Polaroid "Written" Area */}
      <div className="px-1">
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
    </motion.div>
  );
};
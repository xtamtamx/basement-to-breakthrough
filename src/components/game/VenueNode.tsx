import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Venue, Band, VenueType } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface VenueNodeProps {
  venue: Venue;
  position: { x: string; y: string };
  isBooked: boolean;
  isHovered: boolean;
  onDrop: (lineup: Band[]) => void;
  onHover: (isHovered: boolean) => void;
}

const venueTypeColors: Record<VenueType, string> = {
  [VenueType.BASEMENT]: 'var(--punk-neon-purple)',
  [VenueType.GARAGE]: '#666666',
  [VenueType.HOUSE_SHOW]: 'var(--punk-neon-cyan)',
  [VenueType.DIY_SPACE]: 'var(--pixel-magenta)',
  [VenueType.DIVE_BAR]: '#FF4500',
  [VenueType.PUNK_CLUB]: 'var(--pixel-red)',
  [VenueType.METAL_VENUE]: '#8B0000',
  [VenueType.WAREHOUSE]: 'var(--punk-neon-cyan)',
  [VenueType.UNDERGROUND]: 'var(--punk-neon-purple)',
  [VenueType.THEATER]: '#4169E1',
  [VenueType.CONCERT_HALL]: '#FFD700',
  [VenueType.ARENA]: '#FFD700',
  [VenueType.FESTIVAL_GROUNDS]: '#32CD32'
};

const venueIcons: Record<VenueType, string> = {
  [VenueType.BASEMENT]: '🏚️',
  [VenueType.GARAGE]: '🚗',
  [VenueType.HOUSE_SHOW]: '🏠',
  [VenueType.DIY_SPACE]: '🔧',
  [VenueType.DIVE_BAR]: '🍺',
  [VenueType.PUNK_CLUB]: '🎸',
  [VenueType.METAL_VENUE]: '💀',
  [VenueType.WAREHOUSE]: '🏭',
  [VenueType.UNDERGROUND]: '⚡',
  [VenueType.THEATER]: '🎭',
  [VenueType.CONCERT_HALL]: '🎼',
  [VenueType.ARENA]: '🏟️',
  [VenueType.FESTIVAL_GROUNDS]: '🎪'
};

interface VenueNodeProps {
  venue: Venue;
  position: { x: string | number; y: string | number };
  isBooked: boolean;
  isHovered: boolean;
  onDrop: (lineup: Band[]) => void;
  onHover: (isHovered: boolean) => void;
}

export const VenueNode: React.FC<VenueNodeProps> = ({
  venue,
  position,
  isBooked,
  isHovered,
  onDrop,
  onHover
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isBooked) {
      setIsDragOver(true);
      onHover(true);
    }
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
    onHover(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onHover(false);
    
    if (!isBooked) {
      // Parse lineup data from drag event
      const lineupData = e.dataTransfer.getData('lineup');
      if (lineupData) {
        try {
          const lineup = JSON.parse(lineupData);
          onDrop(lineup);
          haptics.success();
          audio.play('success');
        } catch (err) {
          console.error('Failed to parse lineup data:', err);
        }
      }
    }
  };
  
  const nodeSize = Math.min(80, Math.max(40, venue.capacity / 10));
  const color = venueTypeColors[venue.type] || 'var(--pixel-gray)';
  const icon = venueIcons[venue.type] || '📍';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDragOver ? 1.2 : (isHovered ? 1.1 : 1),
        opacity: isBooked ? 0.5 : 1
      }}
      transition={{ type: 'spring', damping: 20 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Node Circle with venue texture */}
      <div 
        className={`
          relative rounded-full transition-all cursor-pointer punk-grunge
          ${isBooked ? 'opacity-50' : ''}
          ${isDragOver ? 'ring-4 ring-cyan-400 animate-pulse' : ''}
        `}
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          backgroundColor: 'var(--punk-concrete)',
          border: `2px solid ${color}`,
          boxShadow: isHovered ? `0 0 30px ${color}, 0 0 50px ${color}` : `0 0 15px ${color}`
        }}
      >
        {/* Venue Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: `${nodeSize * 0.4}px` }}>
            {icon}
          </span>
        </div>
        
        {/* Capacity Ring */}
        <svg className="absolute inset-0" width={nodeSize} height={nodeSize}>
          <circle
            cx={nodeSize / 2}
            cy={nodeSize / 2}
            r={(nodeSize / 2) - 4}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={`${(venue.capacity / 1000) * 2 * Math.PI * ((nodeSize / 2) - 4)} ${2 * Math.PI * ((nodeSize / 2) - 4)}`}
            opacity="0.5"
          />
        </svg>
        
        {/* Booked Indicator */}
        {isBooked && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
      
      {/* Venue Info Tooltip */}
      {(isHovered || isDragOver) && (
        <motion.div
          className="absolute punk-venue-card p-3 pointer-events-none punk-xerox"
          style={{ 
            top: `${nodeSize / 2 + 10}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: '180px',
            zIndex: 100,
            border: `1px solid ${color}`,
            boxShadow: `0 0 20px rgba(0,0,0,0.8)`
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="pixel-text pixel-text-sm mb-1 punk-stencil" style={{ color }}>
            {venue.name}
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                CAP:
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                {venue.capacity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                RENT:
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
                ${venue.rent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                AUTH:
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-magenta)' }}>
                {venue.authenticity}%
              </span>
            </div>
            {isBooked && (
              <div className="text-center mt-2">
                <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-red)' }}>
                  BOOKED
                </span>
              </div>
            )}
            {isDragOver && !isBooked && (
              <div className="text-center mt-2">
                <span className="pixel-text pixel-text-xs animate-pulse" style={{ color: 'var(--pixel-cyan)' }}>
                  DROP TO BOOK
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
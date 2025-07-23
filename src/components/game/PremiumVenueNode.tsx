import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Venue, Band, VenueType } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface PremiumVenueNodeProps {
  venue: Venue;
  position: { x: string | number; y: string | number };
  isBooked: boolean;
  isHovered: boolean;
  onDrop: (lineup: Band[]) => void;
  onHover: (isHovered: boolean) => void;
  isDragTarget?: boolean;
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

export const PremiumVenueNode: React.FC<PremiumVenueNodeProps> = ({
  venue,
  position,
  isBooked,
  isHovered,
  onDrop,
  onHover,
  isDragTarget = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const controls = useAnimation();
  const pulseControls = useAnimation();
  
  const nodeSize = Math.min(80, Math.max(44, venue.capacity / 10)); // Min 44px for touch
  const color = venueTypeColors[venue.type] || 'var(--pixel-gray)';
  const icon = venueIcons[venue.type] || '📍';
  
  // Drag target animation
  useEffect(() => {
    if (isDragTarget && !isBooked) {
      pulseControls.start({
        scale: [1, 1.1, 1],
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    } else {
      pulseControls.stop();
      pulseControls.set({ scale: 1 });
    }
  }, [isDragTarget, isBooked, pulseControls]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isBooked) {
      setIsDragOver(true);
      onHover(true);
      haptics.light();
      
      controls.start({
        scale: 1.2,
        transition: { type: 'spring', stiffness: 300 }
      });
    }
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
    onHover(false);
    
    controls.start({
      scale: 1,
      transition: { type: 'spring', stiffness: 300 }
    });
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
          
          // Success feedback
          haptics.success();
          audio.play('success');
          
          // Booking animation
          controls.start({
            scale: [1.2, 0.9, 1],
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.5 }
          });
        } catch (err) {
          console.error('Failed to parse lineup data:', err);
          haptics.error();
          audio.play('error');
        }
      }
    } else {
      // Error feedback for already booked
      haptics.error();
      audio.play('error');
      
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      });
    }
  };
  
  const handleClick = () => {
    if (!isBooked) {
      haptics.light();
      onHover(!isHovered);
    }
  };
  
  return (
    <motion.div
      className="absolute touch-target"
      style={{ 
        left: position.x, 
        top: position.y, 
        transform: 'translate(-50%, -50%)',
        minWidth: '44px',
        minHeight: '44px'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={controls}
      whileHover={{ scale: isBooked ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <motion.div animate={pulseControls}>
        {/* Node Circle with venue texture */}
        <motion.div 
          className={`
            relative rounded-full transition-all cursor-pointer punk-grunge
            ${isBooked ? 'opacity-50' : ''}
          `}
          style={{
            width: `${nodeSize}px`,
            height: `${nodeSize}px`,
            backgroundColor: 'var(--punk-concrete)',
            border: `2px solid ${color}`,
            boxShadow: isHovered || isDragOver ? 
              `0 0 30px ${color}, 0 0 50px ${color}, inset 0 0 20px ${color}` : 
              `0 0 15px ${color}`
          }}
          animate={{
            borderWidth: isDragOver ? '4px' : '2px',
          }}
        >
          {/* Venue Icon */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotate: isDragOver ? [0, 360] : 0,
            }}
            transition={{
              duration: 2,
              repeat: isDragOver ? Infinity : 0,
              ease: "linear"
            }}
          >
            <span style={{ fontSize: `${nodeSize * 0.4}px` }}>
              {icon}
            </span>
          </motion.div>
          
          {/* Capacity Ring */}
          <svg className="absolute inset-0" width={nodeSize} height={nodeSize}>
            <motion.circle
              cx={nodeSize / 2}
              cy={nodeSize / 2}
              r={(nodeSize / 2) - 4}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={`${(venue.capacity / 1000) * 2 * Math.PI * ((nodeSize / 2) - 4)} ${2 * Math.PI * ((nodeSize / 2) - 4)}`}
              opacity="0.5"
              animate={{
                strokeWidth: isDragOver ? '4' : '2',
                opacity: isDragOver ? 1 : 0.5
              }}
            />
          </svg>
          
          {/* Booked Indicator */}
          {isBooked && (
            <motion.div 
              className="absolute -top-1 -right-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <motion.div 
                className="w-4 h-4 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}
          
          {/* Drag Over Effect */}
          {isDragOver && !isBooked && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            />
          )}
        </motion.div>
      </motion.div>
      
      {/* Enhanced Venue Info Tooltip */}
      <AnimatePresence>
        {(isHovered || isDragOver) && (
          <motion.div
            className="absolute punk-venue-card p-3 pointer-events-none punk-xerox"
            style={{ 
              top: `${nodeSize / 2 + 10}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              minWidth: '200px',
              zIndex: 100,
              border: `2px solid ${color}`,
              boxShadow: `0 0 20px rgba(0,0,0,0.8), 0 0 40px ${color}33`
            }}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
                <motion.div 
                  className="text-center mt-2"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                >
                  <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-red)' }}>
                    BOOKED
                  </span>
                </motion.div>
              )}
              {isDragOver && !isBooked && (
                <motion.div 
                  className="text-center mt-2"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                  }}
                >
                  <span className="pixel-text pixel-text-xs punk-neon-cyan" style={{ color: 'var(--punk-neon-cyan)' }}>
                    DROP TO BOOK
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band } from '@game/types';
import { useSwipeableCard } from '@hooks';
import { haptics } from '@utils/mobile';

interface GlassPixelBandCardProps {
  band: Band;
  onSelect?: (band: Band) => void;
  onSwipeLeft?: (band: Band) => void;
  onSwipeRight?: (band: Band) => void;
  selected?: boolean;
  disabled?: boolean;
  index?: number;
}

export const GlassPixelBandCard: React.FC<GlassPixelBandCardProps> = ({
  band,
  onSelect,
  onSwipeLeft,
  onSwipeRight,
  selected = false,
  disabled = false,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { bind, ref } = useSwipeableCard(
    onSwipeLeft ? () => onSwipeLeft(band) : undefined,
    onSwipeRight ? () => onSwipeRight(band) : undefined,
    onSelect ? () => {
      haptics.light();
      onSelect(band);
    } : undefined
  );

  const getGenreClass = (genre: string) => {
    switch (genre.toLowerCase()) {
      case 'punk': return 'glass-panel-punk box-glow-punk';
      case 'metal': return 'glass-panel-metal box-glow-metal';
      default: return 'glass-panel box-glow-cyan';
    }
  };

  const getStatBar = (value: number, maxSegments = 5) => {
    const filled = Math.ceil((value / 100) * maxSegments);
    return Array.from({ length: maxSegments }, (_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: i < filled ? 1 : 0.5, 
          opacity: i < filled ? 1 : 0.3 
        }}
        transition={{ 
          delay: index * 0.1 + i * 0.05,
          type: "spring",
          stiffness: 300,
          damping: 15
        }}
        className={`w-2 h-2 ${i < filled ? 'bg-current' : 'bg-white/20'}`}
        style={{ 
          boxShadow: i < filled ? '0 0 10px currentColor' : 'none',
          borderRadius: '2px'
        }}
      />
    ));
  };

  return (
    <motion.div
      ref={ref}
      {...bind}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => !showDetails && onSelect?.(band)}
      className={`
        relative overflow-hidden cursor-pointer
        ${getGenreClass(band.genre)}
        ${selected ? 'ring-2 ring-white/50' : ''}
        ${disabled ? 'opacity-50' : ''}
        glass-card glass-card-hover p-4 mb-3
        min-h-touch
      `}
    >
      {/* Animated background pattern */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        animate={{ 
          backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%'
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.05) 10px,
            rgba(255,255,255,0.05) 20px
          )`,
          backgroundSize: '200% 200%',
        }}
      />

      {/* Holographic shimmer */}
      {selected && <div className="absolute inset-0 holographic opacity-20" />}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-start justify-between mb-3"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.1 }}
        >
          <div>
            <h3 className="pixel-text pixel-text-lg neon-glow-punk mb-1">
              {band.name.toUpperCase()}
            </h3>
            <p className="pixel-text pixel-text-sm opacity-80">
              {band.genre} • {band.hometown?.split(',')[0]}
            </p>
          </div>
          
          {band.isRealArtist && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: index * 0.1 + 0.3,
                type: "spring",
                stiffness: 200
              }}
              className="pixel-badge"
              style={{ 
                background: 'linear-gradient(45deg, #e94560, #ffeb3b)',
                padding: '4px 8px',
                fontSize: '8px'
              }}
            >
              REAL
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <motion.div 
            className="space-y-1"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <span className="pixel-text pixel-text-sm text-yellow-400">POPULARITY</span>
            <div className="flex gap-1 items-center">
              {getStatBar(band.popularity)}
              <span className="pixel-text pixel-text-sm ml-2 text-yellow-400">
                {band.popularity}
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-1"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.25 }}
          >
            <span className="pixel-text pixel-text-sm text-green-400">AUTHENTICITY</span>
            <div className="flex gap-1 items-center">
              {getStatBar(band.authenticity)}
              <span className="pixel-text pixel-text-sm ml-2 text-green-400">
                {band.authenticity}
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-1"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <span className="pixel-text pixel-text-sm text-orange-400">ENERGY</span>
            <div className="flex gap-1 items-center">
              {getStatBar(band.energy)}
              <span className="pixel-text pixel-text-sm ml-2 text-orange-400">
                {band.energy}
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-1"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.35 }}
          >
            <span className="pixel-text pixel-text-sm text-blue-400">TECHNICAL</span>
            <div className="flex gap-1 items-center">
              {getStatBar(band.technicalSkill)}
              <span className="pixel-text pixel-text-sm ml-2 text-blue-400">
                {band.technicalSkill}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Traits */}
        <motion.div 
          className="flex flex-wrap gap-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          {band.traits.slice(0, 2).map((trait, i) => (
            <motion.div
              key={trait.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: index * 0.1 + 0.5 + i * 0.1,
                type: "spring",
                stiffness: 300
              }}
              className="glass-panel px-3 py-1 rounded"
              style={{ borderRadius: '4px' }}
            >
              <span className="pixel-text pixel-text-sm">
                {trait.name.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Hover Effects */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Indicator */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
            style={{ boxShadow: '0 0 20px #ffeb3b' }}
          >
            <span className="pixel-text text-black" style={{ fontSize: '16px' }}>✓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
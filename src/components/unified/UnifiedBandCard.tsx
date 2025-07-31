import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band } from '@game/types';
import { useSwipeableCard } from '@hooks/useGesture';
import { haptics } from '@utils/mobile';
import { cn } from '@utils/cn';
import { useFactionColor } from '@hooks/useColorblindStyles';

export type BandCardVariant = 'default' | 'pixel' | 'glass' | 'compact' | 'premium' | 'draggable';

interface UnifiedBandCardProps {
  band: Band;
  variant?: BandCardVariant;
  onSelect?: (band: Band) => void;
  onSwipeLeft?: (band: Band) => void;
  onSwipeRight?: (band: Band) => void;
  onLongPress?: (band: Band) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  isDragging?: boolean;
  showStats?: boolean;
  className?: string;
}

export const UnifiedBandCard: React.FC<UnifiedBandCardProps> = ({
  band,
  variant = 'default',
  onSelect,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onDragStart,
  onDragEnd,
  selected = false,
  disabled = false,
  compact = false,
  isDragging = false,
  showStats = true,
  className,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const genreColor = useFactionColor(band.genre.toLowerCase());

  const { bind, ref } = useSwipeableCard(
    (direction) => {
      if (direction === 'left' && onSwipeLeft) {
        haptics.light();
        onSwipeLeft(band);
      } else if (direction === 'right' && onSwipeRight) {
        haptics.light();
        onSwipeRight(band);
      }
    },
    () => {
      if (onLongPress) {
        haptics.medium();
        onLongPress(band);
      }
    }
  );

  const handleClick = () => {
    if (!disabled && onSelect) {
      haptics.light();
      onSelect(band);
    }
  };

  const handleDragStart = () => {
    if (onDragStart) {
      haptics.light();
      onDragStart();
    }
  };

  // Genre color is now handled by the useFactionColor hook
  const getGenreColor = () => genreColor;

  // Variant-specific class names
  const variantClasses = {
    default: `
      bg-bg-card border-2 border-border-default 
      hover:border-punk-pink transition-all duration-200
      ${selected ? 'border-punk-pink shadow-punk-glow' : ''}
    `,
    pixel: `
      pixel-card bg-bg-card border-4 border-black
      ${selected ? 'pixel-glow' : ''}
    `,
    glass: `
      glass-card backdrop-blur-md bg-white/5 border border-white/10
      ${selected ? 'ring-2 ring-punk-pink ring-offset-2 ring-offset-transparent' : ''}
    `,
    compact: `
      punk-polaroid cursor-move
      ${isDragging ? 'opacity-50' : ''}
    `,
    premium: `
      premium-card bg-gradient-to-br from-bg-card to-bg-tertiary
      border-2 border-gradient-to-r from-punk-pink to-punk-magenta
      ${selected ? 'shadow-premium-glow' : ''}
    `,
    draggable: `
      draggable-card bg-bg-card border-2 border-border-default
      cursor-grab active:cursor-grabbing
      ${isDragging ? 'rotate-3 scale-105' : ''}
    `
  };

  const baseClasses = cn(
    'relative rounded-lg overflow-hidden',
    disabled && 'opacity-50 cursor-not-allowed',
    variantClasses[variant],
    className
  );

  // Render content based on variant
  const renderContent = () => {
    if (variant === 'compact' || compact) {
      return (
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{band.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-text-secondary">{band.genre}</span>
            <div className="flex gap-1">
              <span className="text-xs">⭐ {band.popularity}</span>
              <span className="text-xs">🔥 {band.energy}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className={cn(
              'font-display text-lg leading-tight',
              variant === 'pixel' && 'pixel-text'
            )}>
              {band.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: getGenreColor() + '20', color: getGenreColor() }}
              >
                {band.genre}
              </span>
              {band.isRealArtist && (
                <span className="text-xs text-punk-pink">🎸 Real Artist</span>
              )}
            </div>
          </div>
          {variant === 'premium' && (
            <div className="text-2xl animate-pulse">⚡</div>
          )}
        </div>

        {/* Stats */}
        {showStats && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Popularity</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-punk-pink to-punk-magenta"
                    style={{ width: `${band.popularity}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{band.popularity}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Energy</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    style={{ width: `${band.energy}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{band.energy}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Authenticity</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${band.authenticity}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{band.authenticity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Traits */}
        {band.traits && band.traits.length > 0 && !compact && (
          <div className="mt-3 flex flex-wrap gap-1">
            {band.traits.slice(0, 3).map((trait, idx) => (
              <span
                key={trait.id || idx}
                className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  variant === 'pixel' ? 'pixel-badge' : 'bg-bg-tertiary'
                )}
              >
                {trait.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const cardElement = (
    <div
      ref={ref}
      className={baseClasses}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      draggable={variant === 'draggable' || variant === 'compact'}
      style={{
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.1s ease'
      }}
      {...bind()}
    >
      {renderContent()}
      
      {/* Selection indicator */}
      {selected && variant !== 'compact' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-punk-pink/10" />
          <div className="absolute top-2 right-2 w-6 h-6 bg-punk-pink rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
        </div>
      )}
    </div>
  );

  // Wrap with motion for draggable variants
  if (variant === 'compact' || variant === 'draggable') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isDragging ? 3 : 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {cardElement}
      </motion.div>
    );
  }

  return cardElement;
};

// Export convenience components for common variants
export const BandCard = (props: Omit<UnifiedBandCardProps, 'variant'>) => 
  <UnifiedBandCard {...props} variant="default" />;

export const PixelBandCard = (props: Omit<UnifiedBandCardProps, 'variant'>) => 
  <UnifiedBandCard {...props} variant="pixel" />;

export const GlassBandCard = (props: Omit<UnifiedBandCardProps, 'variant'>) => 
  <UnifiedBandCard {...props} variant="glass" />;

export const CompactBandCard = (props: Omit<UnifiedBandCardProps, 'variant'>) => 
  <UnifiedBandCard {...props} variant="compact" />;

export const PremiumBandCard = (props: Omit<UnifiedBandCardProps, 'variant'>) => 
  <UnifiedBandCard {...props} variant="premium" />;

export const DraggableBandCard = (props: Omit<UnifiedBandCardProps, 'variant'>) => 
  <UnifiedBandCard {...props} variant="draggable" />;
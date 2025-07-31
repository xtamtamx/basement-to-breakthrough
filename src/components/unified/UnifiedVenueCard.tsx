import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Venue } from '@game/types';
import { useSwipeableCard } from '@hooks/useGesture';
import { haptics } from '@utils/mobile';
import { cn } from '@utils/cn';

export type VenueCardVariant = 'default' | 'pixel' | 'glass' | 'compact' | 'premium' | 'node';

interface UnifiedVenueCardProps {
  venue: Venue;
  variant?: VenueCardVariant;
  onSelect?: (venue: Venue) => void;
  onSwipeLeft?: (venue: Venue) => void;
  onSwipeRight?: (venue: Venue) => void;
  onLongPress?: (venue: Venue) => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  showStats?: boolean;
  showEquipment?: boolean;
  className?: string;
}

export const UnifiedVenueCard: React.FC<UnifiedVenueCardProps> = ({
  venue,
  variant = 'default',
  onSelect,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  selected = false,
  disabled = false,
  compact = false,
  showStats = true,
  showEquipment = false,
  className,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { bind, ref } = useSwipeableCard(
    (direction) => {
      if (direction === 'left' && onSwipeLeft) {
        haptics.light();
        onSwipeLeft(venue);
      } else if (direction === 'right' && onSwipeRight) {
        haptics.light();
        onSwipeRight(venue);
      }
    },
    () => {
      if (onLongPress) {
        haptics.medium();
        onLongPress(venue);
      }
    }
  );

  const handleClick = () => {
    if (!disabled && onSelect) {
      haptics.light();
      onSelect(venue);
    }
  };

  // Get venue type color
  const getVenueTypeColor = () => {
    switch (venue.type) {
      case 'BASEMENT': return 'var(--punk-pink)';
      case 'DIY_SPACE': return 'var(--indie-purple)';
      case 'SMALL_VENUE': return 'var(--electronic-blue)';
      case 'MEDIUM_VENUE': return 'var(--warning-amber)';
      case 'LARGE_VENUE': return 'var(--metal-red)';
      case 'WAREHOUSE': return 'var(--text-secondary)';
      case 'ARENA': return 'var(--success-green)';
      default: return 'var(--text-secondary)';
    }
  };

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
      bg-bg-tertiary border border-border-default
      ${selected ? 'border-punk-pink' : ''}
    `,
    premium: `
      premium-card bg-gradient-to-br from-bg-card to-bg-tertiary
      border-2 border-gradient-to-r from-punk-pink to-punk-magenta
      ${selected ? 'shadow-premium-glow' : ''}
    `,
    node: `
      venue-node bg-bg-card border-2 border-border-bright
      hover:scale-105 transition-all duration-200
      ${selected ? 'ring-2 ring-punk-pink' : ''}
    `
  };

  const baseClasses = cn(
    'relative rounded-lg overflow-hidden cursor-pointer',
    disabled && 'opacity-50 cursor-not-allowed',
    variantClasses[variant],
    className
  );

  // Render content based on variant
  const renderContent = () => {
    if (variant === 'compact' || compact) {
      return (
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{venue.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-text-secondary">{venue.type.replace(/_/g, ' ')}</span>
            <span className="text-xs">👥 {venue.capacity}</span>
          </div>
        </div>
      );
    }

    if (variant === 'node') {
      return (
        <div className="p-4 text-center">
          <div className="text-3xl mb-2">🏢</div>
          <h3 className="font-bold text-sm truncate">{venue.name}</h3>
          <span className="text-xs text-text-secondary">Cap: {venue.capacity}</span>
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
              {venue.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: getVenueTypeColor() + '20', color: getVenueTypeColor() }}
              >
                {venue.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-text-secondary">
                👥 {venue.capacity}
              </span>
            </div>
          </div>
          {variant === 'premium' && (
            <div className="text-2xl animate-pulse">🏛️</div>
          )}
        </div>

        {/* Location */}
        {venue.location && (
          <div className="text-xs text-text-secondary mb-2">
            📍 {venue.location.name}
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Acoustics</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${venue.acoustics}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{venue.acoustics}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Atmosphere</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${venue.atmosphere}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{venue.atmosphere}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Authenticity</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${venue.authenticity}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{venue.authenticity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Equipment */}
        {showEquipment && venue.equipment && venue.equipment.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-text-secondary mb-1">Equipment:</p>
            <div className="flex flex-wrap gap-1">
              {venue.equipment.slice(0, 3).map((eq, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    variant === 'pixel' ? 'pixel-badge' : 'bg-bg-tertiary'
                  )}
                >
                  {eq.name || eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          {venue.allowsAllAges && <span>🔞 All Ages</span>}
          {venue.hasBar && <span>🍺 Bar</span>}
          {venue.hasSecurity && <span>🛡️ Security</span>}
        </div>

        {/* Cost */}
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-text-secondary">Rent</span>
          <span className="text-sm font-bold text-punk-pink">${venue.rent}</span>
        </div>
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
      style={{
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.1s ease'
      }}
      {...bind()}
    >
      {renderContent()}
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-punk-pink/10" />
          <div className="absolute top-2 right-2 w-6 h-6 bg-punk-pink rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
        </div>
      )}
    </div>
  );

  // Wrap with motion for animated variants
  if (variant === 'node') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {cardElement}
      </motion.div>
    );
  }

  return cardElement;
};

// Export convenience components for common variants
export const VenueCard = (props: Omit<UnifiedVenueCardProps, 'variant'>) => 
  <UnifiedVenueCard {...props} variant="default" />;

export const PixelVenueCard = (props: Omit<UnifiedVenueCardProps, 'variant'>) => 
  <UnifiedVenueCard {...props} variant="pixel" />;

export const GlassVenueCard = (props: Omit<UnifiedVenueCardProps, 'variant'>) => 
  <UnifiedVenueCard {...props} variant="glass" />;

export const CompactVenueCard = (props: Omit<UnifiedVenueCardProps, 'variant'>) => 
  <UnifiedVenueCard {...props} variant="compact" />;

export const PremiumVenueCard = (props: Omit<UnifiedVenueCardProps, 'variant'>) => 
  <UnifiedVenueCard {...props} variant="premium" />;

export const VenueNode = (props: Omit<UnifiedVenueCardProps, 'variant'>) => 
  <UnifiedVenueCard {...props} variant="node" />;
import React, { useState } from 'react';
import { Band } from '@game/types';
import { useSwipeableCard } from '@hooks';
import { haptics } from '@utils/mobile';

interface BandCardProps {
  band: Band;
  onSelect?: (band: Band) => void;
  onSwipeLeft?: (band: Band) => void;
  onSwipeRight?: (band: Band) => void;
  onLongPress?: (band: Band) => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export const BandCard: React.FC<BandCardProps> = ({
  band,
  onSelect,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  selected = false,
  disabled = false,
  compact = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { bind, ref } = useSwipeableCard(
    onSwipeLeft ? () => onSwipeLeft(band) : undefined,
    onSwipeRight ? () => onSwipeRight(band) : undefined,
    onSelect ? () => {
      haptics.light();
      onSelect(band);
    } : undefined
  );

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(band);
    } else {
      setShowDetails(!showDetails);
    }
  };

  const getAuthenticityColor = (authenticity: number) => {
    if (authenticity >= 80) return 'text-punk-400';
    if (authenticity >= 60) return 'text-punk-500';
    if (authenticity >= 40) return 'text-metal-400';
    return 'text-metal-500';
  };

  const getPopularityDisplay = (popularity: number) => {
    const bars = Math.ceil(popularity / 20);
    return '▮'.repeat(bars) + '▯'.repeat(5 - bars);
  };

  return (
    <div
      ref={ref}
      {...bind}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative overflow-hidden
        ${compact ? 'p-3' : 'p-4'}
        ${selected ? 'ring-2 ring-punk-500 bg-punk-900/20' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${isPressed ? 'scale-[0.98]' : ''}
        card-interactive min-h-touch
        transition-all duration-50
      `}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 left-2 bg-punk-500 text-white text-xs px-2 py-1 rounded-full">
          ✓ SELECTED
        </div>
      )}
      
      {/* Real Artist Badge */}
      {band.isRealArtist && (
        <div className="absolute top-2 right-2 bg-punk-600 text-white text-xs px-2 py-1 rounded-full">
          REAL ARTIST
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start gap-3">
        {/* Band Image or Placeholder */}
        <div className="flex-shrink-0">
          {band.imageUrl ? (
            <img
              src={band.imageUrl}
              alt={band.name}
              className="w-16 h-16 rounded-lg object-cover bg-metal-800"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-metal-800 flex items-center justify-center">
              <span className="text-2xl font-metal">
                {band.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Band Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{band.name}</h3>
          
          <div className="flex items-center gap-2 text-sm text-metal-300">
            <span className="uppercase">{band.genre}</span>
            {band.hometown && (
              <>
                <span>•</span>
                <span className="truncate">{band.hometown}</span>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-metal-400">POP:</span>
              <span className="font-mono">{getPopularityDisplay(band.popularity)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-metal-400">AUTH:</span>
              <span className={getAuthenticityColor(band.authenticity)}>
                {band.authenticity}%
              </span>
            </div>
          </div>

          {/* Traits */}
          {!compact && band.traits.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {band.traits.slice(0, 3).map((trait) => (
                <span
                  key={trait.id}
                  className="text-xs bg-metal-800 px-2 py-1 rounded-full"
                >
                  {trait.name}
                </span>
              ))}
              {band.traits.length > 3 && (
                <span className="text-xs text-metal-500">
                  +{band.traits.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && !compact && (
        <div className="mt-3 pt-3 border-t border-metal-800 space-y-2 animate-in slide-in-from-top-2">
          {band.bio && (
            <p className="text-sm text-metal-200 line-clamp-3">{band.bio}</p>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-metal-400">Energy:</span>
              <span className="ml-1">{band.energy}%</span>
            </div>
            <div>
              <span className="text-metal-400">Technical:</span>
              <span className="ml-1">{band.technicalSkill}%</span>
            </div>
          </div>

          {band.socialMedia && (
            <div className="flex gap-2 mt-2">
              {band.socialMedia.spotify && (
                <a
                  href={band.socialMedia.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-punk-400 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Spotify
                </a>
              )}
              {band.socialMedia.bandcamp && (
                <a
                  href={band.socialMedia.bandcamp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-punk-400 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Bandcamp
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Swipe Indicators */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-red-500 to-transparent opacity-0 transition-opacity pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-green-500 to-transparent opacity-0 transition-opacity pointer-events-none" />
    </div>
  );
};
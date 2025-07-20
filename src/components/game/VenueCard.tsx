import React, { useState } from 'react';
import { Venue, VenueType } from '@game/types';
import { useGesture } from '@hooks';
import { haptics } from '@utils/mobile';

interface VenueCardProps {
  venue: Venue;
  onSelect?: (venue: Venue) => void;
  onLongPress?: (venue: Venue) => void;
  selected?: boolean;
  disabled?: boolean;
  showCapacity?: boolean;
  currentOccupancy?: number;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onSelect,
  onLongPress,
  selected = false,
  disabled = false,
  showCapacity = true,
  currentOccupancy = 0,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { bind, ref } = useGesture({
    onTap: onSelect ? () => {
      haptics.light();
      onSelect(venue);
    } : undefined,
    onLongPress: () => {
      if (onLongPress) {
        onLongPress(venue);
      } else {
        setShowDetails(!showDetails);
      }
    },
  });

  const getVenueIcon = (type: VenueType) => {
    const icons: Record<VenueType, string> = {
      [VenueType.BASEMENT]: '🏠',
      [VenueType.GARAGE]: '🚗',
      [VenueType.HOUSE_SHOW]: '🏘️',
      [VenueType.DIY_SPACE]: '🔨',
      [VenueType.DIVE_BAR]: '🍺',
      [VenueType.PUNK_CLUB]: '🎸',
      [VenueType.METAL_VENUE]: '🤘',
      [VenueType.WAREHOUSE]: '🏭',
      [VenueType.THEATER]: '🎭',
      [VenueType.CONCERT_HALL]: '🏛️',
      [VenueType.ARENA]: '🏟️',
      [VenueType.FESTIVAL_GROUNDS]: '🎪',
    };
    return icons[type] || '📍';
  };

  const getCapacityColor = () => {
    if (!showCapacity) return '';
    const occupancyRate = currentOccupancy / venue.capacity;
    if (occupancyRate >= 0.9) return 'text-red-500';
    if (occupancyRate >= 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAuthenticityStars = (authenticity: number) => {
    const stars = Math.round(authenticity / 20);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
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
        p-4
        ${selected ? 'ring-2 ring-punk-500 bg-punk-900/20' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${isPressed ? 'scale-[0.98]' : ''}
        card-interactive min-h-touch
        transition-all duration-50
      `}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 left-2 bg-punk-500 text-white text-xs px-2 py-1 rounded-full z-10">
          ✓ SELECTED
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Venue Icon */}
          <div className="text-3xl flex-shrink-0">
            {getVenueIcon(venue.type)}
          </div>

          {/* Venue Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{venue.name}</h3>
            <div className="text-sm text-metal-300">
              {venue.location.name} • {venue.type.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Capacity Indicator */}
        {showCapacity && (
          <div className={`text-right ${getCapacityColor()}`}>
            <div className="text-lg font-bold">
              {currentOccupancy}/{venue.capacity}
            </div>
            <div className="text-xs text-metal-400">capacity</div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-metal-400">Authenticity:</span>
          <div className="text-punk-400 font-mono">
            {getAuthenticityStars(venue.authenticity)}
          </div>
        </div>
        <div>
          <span className="text-metal-400">Acoustics:</span>
          <div className="font-mono">
            {venue.acoustics}%
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-3 flex flex-wrap gap-2">
        {venue.allowsAllAges && (
          <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
            ALL AGES
          </span>
        )}
        {venue.hasBar && (
          <span className="text-xs bg-metal-800 px-2 py-1 rounded-full">
            BAR
          </span>
        )}
        {venue.hasSecurity && (
          <span className="text-xs bg-metal-800 px-2 py-1 rounded-full">
            SECURITY
          </span>
        )}
        {!venue.isPermanent && (
          <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full">
            POPUP
          </span>
        )}
      </div>

      {/* Rent */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-metal-400">Rent:</span>
        <span className="text-lg font-bold">${venue.rent}/night</span>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-metal-800 space-y-2 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-metal-400">Atmosphere:</span>
              <span className="ml-1">{venue.atmosphere}%</span>
            </div>
            <div>
              <span className="text-metal-400">Difficulty:</span>
              <span className="ml-1">{venue.bookingDifficulty}/10</span>
            </div>
          </div>

          {venue.modifiers.length > 0 && (
            <div>
              <p className="text-xs text-metal-400 mb-1">Modifiers:</p>
              <div className="flex flex-wrap gap-1">
                {venue.modifiers.map((mod) => (
                  <span
                    key={mod.id}
                    className="text-xs bg-metal-800 px-2 py-1 rounded"
                  >
                    {mod.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scene Politics Warning */}
          {venue.location.policePresence > 70 && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              ⚠️ High police presence in area
            </div>
          )}
          {venue.location.gentrificationLevel > 60 && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              ⚠️ Gentrifying neighborhood
            </div>
          )}
        </div>
      )}
    </div>
  );
};
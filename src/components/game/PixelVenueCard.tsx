import React from 'react';
import { Venue, VenueType } from '@game/types';
import { haptics } from '@utils/mobile';

interface PixelVenueCardProps {
  venue: Venue;
  onSelect?: (venue: Venue) => void;
  selected?: boolean;
  disabled?: boolean;
  occupancy?: number;
  isBooked?: boolean;
}

export const PixelVenueCard: React.FC<PixelVenueCardProps> = ({
  venue,
  onSelect,
  selected = false,
  disabled = false,
  occupancy = 0,
  isBooked = false,
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      haptics.light();
      onSelect(venue);
    }
  };

  const getVenueIcon = (type: VenueType) => {
    switch (type) {
      case VenueType.BASEMENT: return '🏠';
      case VenueType.DIVE_BAR: return '🍺';
      case VenueType.PUNK_CLUB: return '🎵';
      case VenueType.METAL_VENUE: return '🎤';
      case VenueType.CONCERT_HALL: return '🏟️';
      case VenueType.FESTIVAL_GROUNDS: return '⛺';
      case VenueType.WAREHOUSE: return '🏭';
      case VenueType.UNDERGROUND: return '🚇';
      default: return '📍';
    }
  };

  const getVenueColor = (type: VenueType) => {
    switch (type) {
      case VenueType.BASEMENT: return 'var(--pixel-purple)';
      case VenueType.DIVE_BAR: return 'var(--pixel-orange)';
      case VenueType.PUNK_CLUB: return 'var(--pixel-blue)';
      case VenueType.METAL_VENUE: return 'var(--pixel-cyan)';
      case VenueType.CONCERT_HALL: return 'var(--pixel-yellow)';
      case VenueType.FESTIVAL_GROUNDS: return 'var(--pixel-green)';
      case VenueType.WAREHOUSE: return 'var(--pixel-red)';
      case VenueType.UNDERGROUND: return 'var(--pixel-magenta)';
      default: return 'var(--pixel-gray)';
    }
  };


  const occupancyPercent = Math.round((occupancy / venue.capacity) * 100);
  const isFull = occupancyPercent >= 90;

  return (
    <div
      onClick={handleClick}
      className={`
        pixel-card pixel-card-venue relative p-3
        ${selected ? 'pixel-shake' : ''}
        ${disabled || isFull ? 'opacity-50' : ''}
        ${!disabled && !isFull ? 'cursor-pointer' : 'cursor-not-allowed'}
        min-h-touch transition-none
      `}
      style={{
        borderColor: selected ? 'var(--pixel-yellow)' : 'var(--pixel-black)',
        borderWidth: selected ? '4px' : '3px',
      }}
    >
      {/* Venue type pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            ${getVenueColor(venue.type)} 4px,
            ${getVenueColor(venue.type)} 8px
          )`
        }}
      />

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute -top-2 -left-2 pixel-badge pixel-badge-yellow pixel-pulse">
          SEL
        </div>
      )}

      {/* Status Badge */}
      {(isFull || isBooked) && (
        <div className={`absolute -top-2 -right-2 pixel-badge ${isBooked ? 'pixel-badge-yellow' : 'pixel-badge-red'} ${isFull ? 'pixel-blink' : ''}`}>
          {isBooked ? 'BOOKED' : 'FULL'}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header with icon and name */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-2xl" style={{ filter: 'grayscale(1) contrast(2)' }}>
            {getVenueIcon(venue.type)}
          </span>
          <div className="flex-1">
            <h3 className="pixel-text pixel-text-shadow" style={{ color: 'var(--pixel-white)' }}>
              {venue.name.toUpperCase()}
            </h3>
            <div className="pixel-text pixel-text-sm" style={{ color: getVenueColor(venue.type) }}>
              {venue.type.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-gray)' }}>
          📍 {venue.location.name.toUpperCase()}
        </div>

        {/* Capacity */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
              CAPACITY
            </span>
            <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
              {occupancy}/{venue.capacity}
            </span>
          </div>
          <div className="pixel-progress" style={{ height: '8px' }}>
            <div 
              className="pixel-progress-fill"
              style={{ 
                width: `${occupancyPercent}%`,
                background: isFull ? 'var(--pixel-red)' : undefined,
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>ACOUSTICS</span>
            <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
              {'◆'.repeat(Math.ceil(venue.acoustics / 20))}{'◇'.repeat(5 - Math.ceil(venue.acoustics / 20))}
            </div>
          </div>
          <div>
            <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>AUTH</span>
            <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              {'◆'.repeat(Math.ceil(venue.authenticity / 20))}{'◇'.repeat(5 - Math.ceil(venue.authenticity / 20))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {venue.allowsAllAges && (
            <span className="pixel-badge" style={{ 
              backgroundColor: 'var(--pixel-green)', 
              fontSize: '6px',
              padding: '2px 4px',
            }}>
              ALL AGES
            </span>
          )}
          {venue.hasBar && (
            <span className="pixel-badge" style={{ 
              backgroundColor: 'var(--pixel-orange)', 
              fontSize: '6px',
              padding: '2px 4px',
            }}>
              BAR
            </span>
          )}
          {venue.hasSecurity && (
            <span className="pixel-badge" style={{ 
              backgroundColor: 'var(--pixel-blue)', 
              fontSize: '6px',
              padding: '2px 4px',
            }}>
              SECURITY
            </span>
          )}
          {venue.rent > 0 && (
            <span className="pixel-badge" style={{ 
              backgroundColor: 'var(--pixel-red)', 
              fontSize: '6px',
              padding: '2px 4px',
              color: 'var(--pixel-white)',
            }}>
              ${venue.rent}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
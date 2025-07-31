import React, { useState } from 'react';
import { Band } from '@game/types';
import { useSwipeableCard } from '@hooks/useGesture';
import { haptics } from '@utils/mobile';

interface PixelBandCardProps {
  band: Band;
  onSelect?: (band: Band) => void;
  onSwipeLeft?: (band: Band) => void;
  onSwipeRight?: (band: Band) => void;
  onLongPress?: (band: Band) => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export const PixelBandCard: React.FC<PixelBandCardProps> = ({
  band,
  onSelect,
  onSwipeLeft,
  onSwipeRight,
  selected = false,
  disabled = false,
  compact = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showDetails] = useState(false);

  const { bind, ref } = useSwipeableCard(
    onSwipeLeft ? () => onSwipeLeft(band) : undefined,
    onSwipeRight ? () => onSwipeRight(band) : undefined,
    onSelect ? () => {
      haptics.light();
      onSelect(band);
    } : undefined
  );


  const getGenreColor = (genre: string) => {
    switch (genre.toLowerCase()) {
      case 'punk': return 'var(--pixel-magenta)';
      case 'metal': return 'var(--pixel-red)';
      case 'electronic': return 'var(--pixel-cyan)';
      case 'experimental': return 'var(--pixel-green)';
      default: return 'var(--pixel-purple)';
    }
  };

  const getStatBar = (value: number, maxSegments = 10) => {
    const filledSegments = Math.ceil((value / 100) * maxSegments);
    const emptySegments = maxSegments - filledSegments;
    return '█'.repeat(filledSegments) + '░'.repeat(emptySegments);
  };

  return (
    <div
      ref={ref}
      onTouchStart={(e) => {
        setIsPressed(true);
        (bind.onTouchStart as React.TouchEventHandler<HTMLDivElement>)(e);
      }}
      onTouchEnd={(e) => {
        setIsPressed(false);
        (bind.onTouchEnd as React.TouchEventHandler<HTMLDivElement>)(e);
      }}
      onMouseDown={(e) => {
        setIsPressed(true);
        (bind.onMouseDown as React.MouseEventHandler<HTMLDivElement>)(e);
      }}
      onMouseUp={(e) => {
        setIsPressed(false);
        (bind.onMouseUp as React.MouseEventHandler<HTMLDivElement>)(e);
      }}
      onTouchMove={bind.onTouchMove as React.TouchEventHandler<HTMLDivElement>}
      onMouseMove={bind.onMouseMove as React.MouseEventHandler<HTMLDivElement>}
      className={`
        pixel-card pixel-card-band relative
        ${compact ? 'p-2' : 'p-3'}
        ${selected ? 'pixel-shake' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${isPressed ? 'transform translate-x-1 translate-y-1' : ''}
        min-h-touch cursor-pointer
        transition-none
      `}
      style={{
        borderColor: selected ? 'var(--pixel-yellow)' : 'var(--pixel-black)',
        borderWidth: selected ? '4px' : '3px',
      }}
    >
      {/* Pixel art pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${getGenreColor(band.genre)} 2px,
            ${getGenreColor(band.genre)} 4px
          )`
        }}
      />

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute -top-2 -left-2 pixel-badge pixel-badge-yellow pixel-pulse">
          SEL
        </div>
      )}
      
      {/* Real Artist Badge */}
      {band.isRealArtist && (
        <div className="absolute -top-2 -right-2 pixel-badge pixel-badge-red">
          REAL
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {/* Band Name */}
        <h3 className="pixel-text pixel-text-shadow mb-2" style={{ color: 'var(--pixel-white)' }}>
          {band.name.toUpperCase()}
        </h3>

        {/* Genre and Location */}
        <div className="pixel-text pixel-text-sm mb-2" style={{ color: getGenreColor(band.genre) }}>
          {band.genre} • {band.hometown?.split(',')[0] || 'UNKNOWN'}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1 mb-2">
          <div>
            <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>POP</span>
            <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
              {getStatBar(band.popularity, 5)}
            </div>
          </div>
          <div>
            <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>AUTH</span>
            <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              {getStatBar(band.authenticity, 5)}
            </div>
          </div>
          {!compact && (
            <>
              <div>
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>NRG</span>
                <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-orange)' }}>
                  {getStatBar(band.energy, 5)}
                </div>
              </div>
              <div>
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>TECH</span>
                <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-blue)' }}>
                  {getStatBar(band.technicalSkill, 5)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Traits */}
        {!compact && band.traits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {band.traits.slice(0, 2).map((trait) => (
              <span
                key={trait.id}
                className="pixel-badge"
                style={{ 
                  backgroundColor: 'var(--pixel-dark-purple)',
                  color: 'var(--pixel-white)',
                  fontSize: '6px',
                  padding: '2px 4px',
                }}
              >
                {trait.name.toUpperCase().slice(0, 8)}
              </span>
            ))}
            {band.traits.length > 2 && (
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                +{band.traits.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && !compact && (
        <div className="mt-2 pt-2 border-t-2 border-dashed" style={{ borderColor: 'var(--pixel-dark-gray)' }}>
          {band.bio && (
            <p className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-gray)', lineHeight: '1.5' }}>
              {band.bio.toUpperCase().slice(0, 100)}...
            </p>
          )}
          
          {band.socialMedia && (
            <div className="flex gap-2">
              {band.socialMedia.spotify && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (band.socialMedia?.spotify) window.open(band.socialMedia.spotify, '_blank');
                  }}
                  className="pixel-button"
                  style={{ 
                    padding: '4px 8px',
                    fontSize: '6px',
                    backgroundColor: 'var(--pixel-green)',
                  }}
                >
                  SPOTIFY
                </button>
              )}
              {band.socialMedia.bandcamp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (band.socialMedia?.bandcamp) window.open(band.socialMedia.bandcamp, '_blank');
                  }}
                  className="pixel-button"
                  style={{ 
                    padding: '4px 8px',
                    fontSize: '6px',
                    backgroundColor: 'var(--pixel-orange)',
                  }}
                >
                  BANDCAMP
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
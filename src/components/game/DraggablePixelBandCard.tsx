import React from 'react';
import { Band } from '@game/types';

interface DraggablePixelBandCardProps {
  band: Band;
  isDragging?: boolean;
  disabled?: boolean;
}

export const DraggablePixelBandCard: React.FC<DraggablePixelBandCardProps> = ({
  band,
  isDragging = false,
  disabled = false,
}) => {
  const getGenreColor = (genre: string) => {
    switch (genre.toLowerCase()) {
      case 'punk': return 'var(--pixel-magenta)';
      case 'metal': return 'var(--pixel-red)';
      default: return 'var(--pixel-purple)';
    }
  };

  return (
    <div
      className={`
        glass-panel p-3 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-80 scale-105 rotate-2' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        transition-transform duration-150
      `}
      style={{
        borderColor: isDragging ? 'var(--pixel-yellow)' : 'var(--pixel-black)',
        boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.3)' : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Genre indicator */}
        <div 
          className="w-3 h-3 rounded-full"
          style={{ 
            backgroundColor: getGenreColor(band.genre),
            boxShadow: `0 0 10px ${getGenreColor(band.genre)}`
          }}
        />
        
        {/* Band info */}
        <div className="flex-1">
          <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
            {band.name.toUpperCase()}
          </h3>
          <div className="flex gap-3 mt-1">
            <span className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-yellow)' }}>
              POP {band.popularity}
            </span>
            <span className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-green)' }}>
              AUTH {band.authenticity}
            </span>
          </div>
        </div>

        {/* Real artist badge */}
        {band.isRealArtist && (
          <div className="pixel-badge pixel-badge-red" style={{ fontSize: '6px', padding: '2px 4px' }}>
            REAL
          </div>
        )}
      </div>
    </div>
  );
};
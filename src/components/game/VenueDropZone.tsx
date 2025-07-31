import React, { useState, useEffect } from 'react';
import { Venue, Band, VenueType } from '@game/types';
import { useDropZone } from '@hooks/useDropZone';
import { useDragContext } from '@contexts/DragContext';
import { synergyEngine } from '@game/mechanics/SynergyEngine';

interface VenueDropZoneProps {
  venue: Venue;
  bookedBand?: Band;
  onBook?: (band: Band, venue: Venue) => void;
}

export const VenueDropZone: React.FC<VenueDropZoneProps> = ({
  venue,
  bookedBand,
  onBook,
}) => {
  const { draggedItem, draggedType } = useDragContext();
  const [isHighlighted, setIsHighlighted] = useState(false);

  const { ref, isOver, canDrop } = useDropZone({
    onDrop: (band: Band) => {
      if (band && !bookedBand) {
        onBook?.(band, venue);
      }
    },
    accepts: ['band'],
    disabled: !!bookedBand,
  });

  const { registerDropZone, unregisterDropZone } = useDragContext();

  useEffect(() => {
    registerDropZone(venue.id, (item) => {
      if (!bookedBand && 'genre' in item) { // Type guard to check if it's a Band
        onBook?.(item as Band, venue);
      }
    });

    return () => {
      unregisterDropZone(venue.id);
    };
  }, [venue.id, bookedBand, onBook, registerDropZone, unregisterDropZone]);

  // Preview synergies when dragging
  const previewSynergies = draggedType === 'band' && isOver && draggedItem
    ? synergyEngine.calculateSynergies([draggedItem as Band], venue)
    : [];

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
      [VenueType.UNDERGROUND]: '🚇',
    };
    return icons[type] || '📍';
  };

  return (
    <div
      ref={ref}
      data-dropzone-id={venue.id}
      className={`
        relative w-64 min-h-[200px] bg-metal-950 rounded-lg p-4 border-2 
        ${isOver && canDrop ? 'border-punk-500 bg-punk-900/20 scale-105' : 'border-metal-800'}
        ${bookedBand ? 'border-green-600' : ''}
        transition-all duration-200
      `}
    >
      {/* Venue Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <div className="text-3xl">{getVenueIcon(venue.type)}</div>
          <div>
            <h3 className="font-bold text-sm">{venue.name}</h3>
            <p className="text-xs text-metal-400">{venue.location.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-metal-500">Capacity</p>
          <p className="font-bold">{venue.capacity}</p>
        </div>
      </div>

      {/* Venue Stats */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-metal-500">Rent:</span>
          <span className="font-bold">${venue.rent}/night</span>
        </div>
        <div className="flex justify-between">
          <span className="text-metal-500">Authenticity:</span>
          <span className="text-punk-400">{'★'.repeat(Math.round(venue.authenticity / 20))}</span>
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-1 mt-2">
        {venue.allowsAllAges && (
          <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">
            ALL AGES
          </span>
        )}
        {venue.hasBar && (
          <span className="text-xs bg-metal-800 px-2 py-0.5 rounded">
            BAR
          </span>
        )}
      </div>

      {/* Drop Zone Indicator */}
      {isOver && canDrop && !bookedBand && (
        <div className="absolute inset-0 flex items-center justify-center bg-punk-600/20 rounded-lg">
          <p className="text-punk-300 font-bold">Drop Band Here!</p>
        </div>
      )}

      {/* Booked Band Display */}
      {bookedBand && (
        <div className="mt-3 p-2 bg-green-900/20 rounded border border-green-600">
          <p className="text-xs text-green-400 mb-1">BOOKED:</p>
          <p className="font-bold text-sm">{bookedBand.name}</p>
          {previewSynergies.length > 0 && (
            <div className="mt-1">
              {previewSynergies.map(s => (
                <p key={s.id} className="text-xs text-punk-400">
                  🔥 {s.name}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Synergy Preview */}
      {isOver && canDrop && previewSynergies.length > 0 && (
        <div className="mt-2 p-2 bg-punk-900/40 rounded text-xs">
          <p className="text-punk-400 font-bold mb-1">Active Synergies:</p>
          {previewSynergies.map(synergy => (
            <p key={synergy.id} className="text-punk-300">
              • {synergy.name} ({synergy.multiplier}x)
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
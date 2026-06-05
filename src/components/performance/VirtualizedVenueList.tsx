import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Venue } from '@game/types';
import { useIsMobile } from '@utils/mobile';

type VenueCardVariant = 'default' | 'pixel' | 'glass' | 'compact' | 'premium' | 'node';

interface UnifiedVenueCardProps {
  venue: Venue;
  variant?: VenueCardVariant;
  selected?: boolean;
  onSelect?: (venue: Venue) => void;
}

const UnifiedVenueCard: React.FC<UnifiedVenueCardProps> = ({
  venue,
  selected = false,
  onSelect,
}) => (
  <button
    type="button"
    onClick={() => onSelect?.(venue)}
    className={`w-full h-full text-left rounded-lg border px-4 py-3 transition-colors ${
      selected
        ? 'border-pink-500 bg-pink-950/30'
        : 'border-gray-700 bg-gray-800 hover:border-gray-500'
    }`}
  >
    <div className="font-bold text-white truncate">{venue.name}</div>
    <div className="text-xs text-gray-400">{venue.type}</div>
    <div className="mt-1 flex gap-3 text-xs text-gray-500">
      <span>Cap {venue.capacity}</span>
      <span>Rent ${venue.rent}</span>
    </div>
  </button>
);

interface VirtualizedVenueListProps {
  venues: Venue[];
  onSelectVenue?: (venue: Venue) => void;
  selectedVenueId?: string;
  variant?: 'default' | 'pixel' | 'glass' | 'compact' | 'premium' | 'node';
  itemHeight?: number;
  gap?: number;
  className?: string;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    venues: Venue[];
    onSelectVenue?: (venue: Venue) => void;
    selectedVenueId?: string;
    variant: 'default' | 'pixel' | 'glass' | 'compact' | 'premium' | 'node';
    gap: number;
  };
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const { venues, onSelectVenue, selectedVenueId, variant, gap } = data;
  const venue = venues[index];
  
  if (!venue) return null;
  
  return (
    <div 
      style={{
        ...style,
        paddingBottom: gap,
      }}
    >
      <UnifiedVenueCard
        venue={venue}
        variant={variant}
        onSelect={onSelectVenue}
        selected={selectedVenueId === venue.id}
      />
    </div>
  );
};

export const VirtualizedVenueList: React.FC<VirtualizedVenueListProps> = ({
  venues,
  onSelectVenue,
  selectedVenueId,
  variant = 'default',
  itemHeight = 150,
  gap = 12,
  className = '',
}) => {
  const isMobile = useIsMobile();
  
  // Adjust item height for mobile
  const actualItemHeight = isMobile ? itemHeight : itemHeight + 20;
  
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    venues,
    onSelectVenue,
    selectedVenueId,
    variant,
    gap,
  }), [venues, onSelectVenue, selectedVenueId, variant, gap]);
  
  // Calculate overscan for better scrolling experience
  const overscanCount = isMobile ? 2 : 3;
  
  return (
    <div className={`w-full h-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={venues.length}
            itemSize={actualItemHeight + gap}
            width={width}
            itemData={itemData}
            overscanCount={overscanCount}
            className="custom-scrollbar"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};
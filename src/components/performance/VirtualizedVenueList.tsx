import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Venue } from '@game/types';
import { UnifiedVenueCard } from '@components/unified';
import { useIsMobile } from '@utils/mobile';

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
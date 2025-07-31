import React, { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Band } from '@game/types';
import { UnifiedBandCard } from '@components/unified';
import { useIsMobile } from '@utils/mobile';

interface VirtualizedBandListProps {
  bands: Band[];
  onSelectBand?: (band: Band) => void;
  onSwipeLeft?: (band: Band) => void;
  onSwipeRight?: (band: Band) => void;
  selectedBandId?: string;
  variant?: 'default' | 'pixel' | 'glass' | 'compact' | 'premium';
  itemHeight?: number;
  gap?: number;
  className?: string;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    bands: Band[];
    onSelectBand?: (band: Band) => void;
    onSwipeLeft?: (band: Band) => void;
    onSwipeRight?: (band: Band) => void;
    selectedBandId?: string;
    variant: 'default' | 'pixel' | 'glass' | 'compact' | 'premium';
    gap: number;
  };
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const { bands, onSelectBand, onSwipeLeft, onSwipeRight, selectedBandId, variant, gap } = data;
  const band = bands[index];
  
  if (!band) return null;
  
  return (
    <div 
      style={{
        ...style,
        paddingBottom: gap,
      }}
    >
      <UnifiedBandCard
        band={band}
        variant={variant}
        onSelect={onSelectBand}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        selected={selectedBandId === band.id}
      />
    </div>
  );
};

export const VirtualizedBandList: React.FC<VirtualizedBandListProps> = ({
  bands,
  onSelectBand,
  onSwipeLeft,
  onSwipeRight,
  selectedBandId,
  variant = 'default',
  itemHeight = 120,
  gap = 8,
  className = '',
}) => {
  const isMobile = useIsMobile();
  
  // Adjust item height for mobile
  const actualItemHeight = isMobile ? itemHeight : itemHeight + 20;
  
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    bands,
    onSelectBand,
    onSwipeLeft,
    onSwipeRight,
    selectedBandId,
    variant,
    gap,
  }), [bands, onSelectBand, onSwipeLeft, onSwipeRight, selectedBandId, variant, gap]);
  
  // Calculate overscan for better scrolling experience
  const overscanCount = isMobile ? 2 : 3;
  
  return (
    <div className={`w-full h-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={bands.length}
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
import React, { useState, useCallback } from 'react';
import { Venue } from '@game/types';
import { VenueCard } from './VenueCard';
import { useDraggable } from '@hooks';

interface VenueGridProps {
  venues: Venue[];
  onVenueSelect?: (venue: Venue) => void;
  selectedVenueId?: string;
  occupancy?: Record<string, number>; // venueId -> current occupancy
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export const VenueGrid: React.FC<VenueGridProps> = ({
  venues,
  onVenueSelect,
  selectedVenueId,
  occupancy = {},
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
}) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((delta: { x: number; y: number }) => {
    setIsDragging(true);
    setDragOffset(delta);
  }, []);

  const handleDragEnd = useCallback(() => {
    // Snap to grid or handle navigation
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      // Could implement page navigation here
    }
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [dragOffset]);

  const { bind, ref } = useDraggable(handleDrag, handleDragEnd);

  // Generate responsive grid classes
  const getGridClasses = () => {
    let classes = `grid gap-4 grid-cols-${columns.default}`;
    if (columns.sm) classes += ` sm:grid-cols-${columns.sm}`;
    if (columns.md) classes += ` md:grid-cols-${columns.md}`;
    if (columns.lg) classes += ` lg:grid-cols-${columns.lg}`;
    return classes;
  };

  return (
    <div className="relative w-full">
      {/* Scrollable Container */}
      <div
        ref={ref}
        {...bind}
        className={`
          ${getGridClasses()}
          transition-transform duration-300
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          transform: `translateX(${dragOffset.x}px)`,
        }}
      >
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            onSelect={onVenueSelect}
            selected={selectedVenueId === venue.id}
            currentOccupancy={occupancy[venue.id] || 0}
            disabled={isDragging}
          />
        ))}
      </div>

      {/* Empty State */}
      {venues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-metal-400 text-lg">No venues available</p>
          <p className="text-metal-500 text-sm mt-2">
            Check back later or expand to new districts
          </p>
        </div>
      )}
    </div>
  );
};

// Mobile-optimized scrollable venue list
interface VenueListProps {
  venues: Venue[];
  onVenueSelect?: (venue: Venue) => void;
  selectedVenueId?: string;
  occupancy?: Record<string, number>;
  groupBy?: 'type' | 'district' | 'none';
}

export const VenueList: React.FC<VenueListProps> = ({
  venues,
  onVenueSelect,
  selectedVenueId,
  occupancy = {},
  groupBy = 'none',
}) => {
  // Group venues if needed
  const groupedVenues = React.useMemo(() => {
    if (groupBy === 'none') return { all: venues };
    
    return venues.reduce((groups, venue) => {
      const key = groupBy === 'type' ? venue.type : venue.location.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(venue);
      return groups;
    }, {} as Record<string, Venue[]>);
  }, [venues, groupBy]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedVenues).map(([group, groupVenues]) => (
        <div key={group}>
          {groupBy !== 'none' && (
            <h3 className="text-sm font-bold text-metal-400 uppercase tracking-wider mb-3 px-4">
              {group.replace(/_/g, ' ')}
            </h3>
          )}
          
          <div className="space-y-3">
            {groupVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onSelect={onVenueSelect}
                selected={selectedVenueId === venue.id}
                currentOccupancy={occupancy[venue.id] || 0}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Compact venue selector for mobile
interface VenueSliderProps {
  venues: Venue[];
  onVenueSelect?: (venue: Venue) => void;
  selectedVenueId?: string;
}

export const VenueSlider: React.FC<VenueSliderProps> = ({
  venues,
  onVenueSelect,
  selectedVenueId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, venues.length - 1));
  };

  const handleSwipeRight = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentVenue = venues[currentIndex];

  if (!currentVenue) return null;

  return (
    <div className="relative">
      <VenueCard
        venue={currentVenue}
        onSelect={onVenueSelect}
        selected={selectedVenueId === currentVenue.id}
      />
      
      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {venues.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index === currentIndex 
                ? 'w-6 bg-punk-500' 
                : 'bg-metal-600'
              }
            `}
            aria-label={`Go to venue ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
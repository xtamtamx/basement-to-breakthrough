import React from 'react';
import { Venue } from '@game/types';
import { PixelVenueCard } from './PixelVenueCard';

interface PixelVenueListProps {
  venues: Venue[];
  onVenueSelect?: (venue: Venue) => void;
  selectedVenueId?: string;
  occupancy?: Record<string, number>;
}

export const PixelVenueList: React.FC<PixelVenueListProps> = ({
  venues,
  onVenueSelect,
  selectedVenueId,
  occupancy = {},
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
      {venues.map((venue) => (
        <PixelVenueCard
          key={venue.id}
          venue={venue}
          onSelect={onVenueSelect}
          selected={selectedVenueId === venue.id}
          occupancy={occupancy[venue.id] || 0}
        />
      ))}
    </div>
  );
};
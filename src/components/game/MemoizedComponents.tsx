import React from "react";
import { Band, Venue } from "@/game/types";

// Memoized BandCard for performance
export const MemoizedBandCard = React.memo<{
  band: Band;
  onClick?: () => void;
}>(
  ({ band, onClick }) => {
    return (
      <div className="band-card" onClick={onClick}>
        <h3>{band.name}</h3>
        <p>
          {band.genre} • {band.popularity}% popularity
        </p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if band data actually changed
    return (
      prevProps.band.id === nextProps.band.id &&
      prevProps.band.popularity === nextProps.band.popularity &&
      prevProps.band.energy === nextProps.band.energy &&
      prevProps.onClick === nextProps.onClick
    );
  },
);

// Memoized VenueCard for performance
export const MemoizedVenueCard = React.memo<{
  venue: Venue;
  onClick?: () => void;
}>(
  ({ venue, onClick }) => {
    return (
      <div className="venue-card" onClick={onClick}>
        <h3>{venue.name}</h3>
        <p>
          Capacity: {venue.capacity} • Rent: ${venue.rent}
        </p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return (
      prevProps.venue.id === nextProps.venue.id &&
      prevProps.venue.capacity === nextProps.venue.capacity &&
      prevProps.venue.rent === nextProps.venue.rent &&
      prevProps.onClick === nextProps.onClick
    );
  },
);

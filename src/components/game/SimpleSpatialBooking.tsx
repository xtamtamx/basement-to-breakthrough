import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Venue, GamePhase } from '@game/types';
import { CompactBandCard } from './CompactBandCard';
import { VenueNode } from './VenueNode';
import { billManager } from '@game/mechanics/BillManager';
import { synergyDiscoverySystem } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface SimpleSpatialBookingProps {
  bands: Band[];
  venues: Venue[];
  onBookShow: (bands: Band[], venue: Venue) => void;
  phase: GamePhase;
  turn: number;
}

export const SimpleSpatialBooking: React.FC<SimpleSpatialBookingProps> = ({
  bands,
  venues,
  onBookShow,
  phase,
  turn
}) => {
  const [draggedBand, setDraggedBand] = useState<Band | null>(null);
  const [selectedBands, setSelectedBands] = useState<Band[]>([]);
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [bookedShows, setBookedShows] = useState<Map<string, Band[]>>(new Map());

  // Handle band selection
  const handleBandClick = useCallback((band: Band) => {
    setSelectedBands(prev => {
      const isSelected = prev.some(b => b.id === band.id);
      if (isSelected) {
        return prev.filter(b => b.id !== band.id);
      } else {
        return [...prev, band];
      }
    });
    haptics.light();
  }, []);

  // Handle venue click - book selected bands
  const handleVenueClick = useCallback((venue: Venue) => {
    if (selectedBands.length === 0) {
      haptics.error();
      return;
    }

    // Check if venue already booked
    if (bookedShows.has(venue.id)) {
      haptics.error();
      return;
    }

    // Book the show
    onBookShow(selectedBands, venue);
    setBookedShows(prev => new Map(prev).set(venue.id, selectedBands));
    setSelectedBands([]);
    haptics.success();
    audio.play('success');
  }, [selectedBands, bookedShows, onBookShow]);

  // Handle drag start
  const handleDragStart = useCallback((band: Band) => {
    setDraggedBand(band);
    haptics.medium();
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedBand(null);
  }, []);

  // Handle drop on venue
  const handleVenueDrop = useCallback((venue: Venue) => {
    if (!draggedBand) return;

    // Check if venue already booked
    if (bookedShows.has(venue.id)) {
      haptics.error();
      return;
    }

    // Book the show with dragged band
    const lineup = selectedBands.includes(draggedBand) 
      ? selectedBands 
      : [draggedBand];
    
    onBookShow(lineup, venue);
    setBookedShows(prev => new Map(prev).set(venue.id, lineup));
    setSelectedBands([]);
    setDraggedBand(null);
    haptics.success();
    audio.play('success');
  }, [draggedBand, selectedBands, bookedShows, onBookShow]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Main Layout - Simple 2 column */}
      <div className="flex h-full">
        
        {/* Left Side - Venues */}
        <div className="w-1/2 p-6 border-r" style={{ borderColor: 'rgba(219, 39, 119, 0.3)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#ec4899' }}>
            VENUES
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {venues.map((venue) => {
              const isBooked = bookedShows.has(venue.id);
              const bookedBands = bookedShows.get(venue.id) || [];
              
              return (
                <motion.div
                  key={venue.id}
                  className="relative p-4 rounded-lg cursor-pointer transition-all"
                  style={{
                    backgroundColor: isBooked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(45, 45, 45, 0.8)',
                    border: `2px solid ${isBooked ? '#10b981' : hoveredVenue === venue.id ? '#ec4899' : 'rgba(219, 39, 119, 0.5)'}`,
                    borderStyle: draggedBand ? 'dashed' : 'solid',
                    boxShadow: hoveredVenue === venue.id ? '0 0 20px rgba(236, 72, 153, 0.5)' : 'none'
                  }}
                  onClick={() => handleVenueClick(venue)}
                  onMouseEnter={() => setHoveredVenue(venue.id)}
                  onMouseLeave={() => setHoveredVenue(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredVenue(venue.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleVenueDrop(venue);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#ffffff' }}>{venue.name}</h3>
                  <p className="text-sm mb-2" style={{ color: '#9ca3af' }}>
                    Capacity: {venue.capacity} | ${venue.rent}
                  </p>
                  
                  {isBooked && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(219, 39, 119, 0.3)' }}>
                      <p className="text-xs mb-1" style={{ color: '#10b981' }}>BOOKED:</p>
                      {bookedBands.map(band => (
                        <p key={band.id} className="text-sm" style={{ color: '#d1d5db' }}>
                          • {band.name}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Bands */}
        <div className="w-1/2 p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#ec4899' }}>
            AVAILABLE BANDS
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {bands.map((band) => {
              const isSelected = selectedBands.some(b => b.id === band.id);
              const isBooked = Array.from(bookedShows.values()).some(lineup => 
                lineup.some(b => b.id === band.id)
              );
              
              return (
                <motion.div
                  key={band.id}
                  className="relative p-4 rounded-lg cursor-pointer transition-all"
                  style={{
                    backgroundColor: isBooked ? 'rgba(75, 75, 75, 0.5)' : isSelected ? 'rgba(236, 72, 153, 0.3)' : 'rgba(45, 45, 45, 0.8)',
                    border: `2px solid ${isSelected ? '#ec4899' : 'rgba(219, 39, 119, 0.5)'}`,
                    opacity: isBooked ? 0.5 : 1
                  }}
                  onClick={() => !isBooked && handleBandClick(band)}
                  draggable={!isBooked}
                  onDragStart={() => handleDragStart(band)}
                  onDragEnd={handleDragEnd}
                  whileHover={!isBooked ? { scale: 1.02 } : {}}
                  whileTap={!isBooked ? { scale: 0.98 } : {}}
                >
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#ffffff' }}>{band.name}</h3>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>
                    {band.genre} | Pop: {band.popularity}
                  </p>
                  {isBooked && (
                    <p className="text-xs mt-2" style={{ color: '#6b7280' }}>ALREADY BOOKED</p>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <span style={{ color: '#ec4899', fontSize: '20px' }}>✓</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Selected Band Instructions */}
          {selectedBands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                border: '1px solid rgba(236, 72, 153, 0.5)'
              }}
            >
              <p className="text-sm" style={{ color: '#fbbf24' }}>
                {selectedBands.length} band{selectedBands.length > 1 ? 's' : ''} selected. 
                Click a venue to book or drag to a venue.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="px-6 py-3 rounded-lg" style={{ 
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          border: '1px solid rgba(236, 72, 153, 0.5)'
        }}>
          <p className="text-sm text-center" style={{ color: '#d1d5db' }}>
            Click bands to select, then click a venue to book. Or drag bands directly to venues.
          </p>
        </div>
      </div>

      {/* Execute Button */}
      <motion.button
        className="absolute bottom-6 right-6 px-8 py-4 rounded-lg font-bold text-lg transition-all"
        style={{
          backgroundColor: bookedShows.size > 0 ? '#ec4899' : '#4b5563',
          color: bookedShows.size > 0 ? '#ffffff' : '#9ca3af',
          cursor: bookedShows.size > 0 ? 'pointer' : 'not-allowed',
          boxShadow: bookedShows.size > 0 ? '0 0 20px rgba(236, 72, 153, 0.5)' : 'none'
        }}
        onClick={() => {
          if (bookedShows.size > 0) {
            haptics.success();
            // Execute shows will be handled by parent
          }
        }}
        whileHover={bookedShows.size > 0 ? { scale: 1.05 } : {}}
        whileTap={bookedShows.size > 0 ? { scale: 0.95 } : {}}
        disabled={bookedShows.size === 0}
      >
        EXECUTE SHOWS ({bookedShows.size})
      </motion.button>
    </div>
  );
};
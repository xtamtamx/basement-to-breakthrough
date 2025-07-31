import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { Band, Venue, Show } from '@/game/types/core';
import { haptics } from '@/utils/mobile';
import { calculateVenueRent, DISTRICT_MODIFIERS } from '@/game/mechanics/DistrictMechanics';
import { getDistrictType } from '@/game/utils/districtUtils';
import { gameAudio } from '@/utils/gameAudio';

interface ShowSlot {
  id: string;
  band: Band | null;
  venue: Venue | null;
  ticketPrice: number;
  date: Date;
}

interface MultiShowBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiShowBookingModal: React.FC<MultiShowBookingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { money, reputation, allBands, venues, scheduleShow } = useGameStore();
  const [showSlots, setShowSlots] = useState<ShowSlot[]>([
    { id: '1', band: null, venue: null, ticketPrice: 10, date: new Date() },
    { id: '2', band: null, venue: null, ticketPrice: 10, date: new Date() },
    { id: '3', band: null, venue: null, ticketPrice: 10, date: new Date() }
  ]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Calculate total cost for all shows
  const calculateTotalCost = () => {
    return showSlots.reduce((total, slot) => {
      if (slot.venue) {
        const districtType = getDistrictType(slot.venue.location.name);
        const rent = calculateVenueRent(slot.venue.rent, districtType);
        return total + rent;
      }
      return total;
    }, 0);
  };
  
  const totalCost = calculateTotalCost();
  const canAfford = money >= totalCost;
  const validShows = showSlots.filter(slot => slot.band && slot.venue);
  
  const handleBookShows = () => {
    if (!canAfford || validShows.length === 0) return;
    
    validShows.forEach(slot => {
      const show: Show = {
        id: `show-${Date.now()}-${slot.id}`,
        bandId: slot.band!.id,
        venueId: slot.venue!.id,
        date: slot.date,
        ticketPrice: slot.ticketPrice,
        status: 'SCHEDULED',
        supportBandIds: [],
        attendance: 0,
        incidents: []
      };
      
      scheduleShow(show);
    });
    
    haptics.success();
    gameAudio.bookShow();
    onClose();
  };
  
  const updateSlot = (slotId: string, updates: Partial<ShowSlot>) => {
    setShowSlots(slots => slots.map(slot => 
      slot.id === slotId ? { ...slot, ...updates } : slot
    ));
  };
  
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
    maxWidth: '600px',
    maxHeight: 'calc(100vh - 20px)',
    margin: '0 auto',
    backgroundColor: '#000',
    border: '2px solid #fff',
    boxShadow: '0 0 0 2px #000, 0 0 0 4px #fff',
    fontFamily: 'monospace',
    imageRendering: 'pixelated',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    overflow: 'hidden'
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 9998
            }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '12px',
              borderBottom: '2px solid #fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#fff',
                textTransform: 'uppercase'
              }}>
                MULTI-SHOW BOOKING
              </h2>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                X
              </button>
            </div>
            
            {/* Content */}
            <div style={{
              padding: '12px',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#111'
            }}>
              {/* Show Slots */}
              <div style={{ marginBottom: '16px' }}>
                {showSlots.map((slot, index) => (
                  <div
                    key={slot.id}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: selectedSlot === slot.id ? '#222' : '#1a1a1a',
                      border: selectedSlot === slot.id ? '2px solid #fff' : '2px solid #333',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#888',
                      marginBottom: '8px'
                    }}>
                      SHOW SLOT {index + 1}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {/* Band Selection */}
                      <div>
                        <label style={{ fontSize: '11px', color: '#aaa' }}>BAND</label>
                        <select
                          value={slot.band?.id || ''}
                          onChange={(e) => {
                            const band = allBands.find(b => b.id === e.target.value);
                            updateSlot(slot.id, { band });
                            haptics.light();
                          }}
                          style={{
                            width: '100%',
                            padding: '4px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: '1px solid #333',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}
                        >
                          <option value="">Select Band</option>
                          {allBands.map(band => (
                            <option key={band.id} value={band.id}>
                              {band.name} ({band.genre})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Venue Selection */}
                      <div>
                        <label style={{ fontSize: '11px', color: '#aaa' }}>VENUE</label>
                        <select
                          value={slot.venue?.id || ''}
                          onChange={(e) => {
                            const venue = venues.find(v => v.id === e.target.value);
                            updateSlot(slot.id, { venue });
                            haptics.light();
                          }}
                          style={{
                            width: '100%',
                            padding: '4px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: '1px solid #333',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}
                        >
                          <option value="">Select Venue</option>
                          {venues.map(venue => {
                            const districtType = getDistrictType(venue.location.name);
                            const rent = calculateVenueRent(venue.rent, districtType);
                            return (
                              <option key={venue.id} value={venue.id}>
                                {venue.name} (${rent}, {venue.capacity} cap)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    
                    {/* Ticket Price */}
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#aaa' }}>
                        TICKET PRICE: ${slot.ticketPrice}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={slot.ticketPrice}
                        onChange={(e) => {
                          updateSlot(slot.id, { ticketPrice: Number(e.target.value) });
                          haptics.light();
                        }}
                        style={{
                          width: '100%',
                          height: '4px',
                          marginTop: '4px'
                        }}
                      />
                    </div>
                    
                    {/* District Info */}
                    {slot.venue && (
                      <div style={{
                        marginTop: '8px',
                        padding: '4px',
                        backgroundColor: '#000',
                        border: '1px solid #333',
                        fontSize: '11px',
                        color: '#888'
                      }}>
                        {slot.venue.location.name} District
                        {(() => {
                          const districtType = getDistrictType(slot.venue.location.name);
                          const mods = DISTRICT_MODIFIERS[districtType];
                          if (mods && slot.band) {
                            const genreBonus = mods.preferredGenres.includes(slot.band.genre) ? '✓' :
                                              mods.discouragedGenres.includes(slot.band.genre) ? '✗' : '';
                            return (
                              <span style={{ color: genreBonus === '✓' ? '#10b981' : genreBonus === '✗' ? '#ef4444' : '#888' }}>
                                {genreBonus && ` • Genre ${genreBonus}`}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              <div style={{
                padding: '12px',
                backgroundColor: '#1a1a1a',
                border: '2px solid #333'
              }}>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                  BOOKING SUMMARY
                </div>
                <div style={{ fontSize: '14px', color: '#fff' }}>
                  Shows to Book: {validShows.length}
                </div>
                <div style={{ fontSize: '14px', color: totalCost > money ? '#ef4444' : '#10b981' }}>
                  Total Cost: ${totalCost}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  Available Money: ${money}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div style={{
              borderTop: '2px solid #fff',
              padding: '12px',
              backgroundColor: '#222',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleBookShows}
                disabled={!canAfford || validShows.length === 0}
                style={{
                  backgroundColor: !canAfford || validShows.length === 0 ? '#444' : '#10b981',
                  color: !canAfford || validShows.length === 0 ? '#666' : '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  cursor: !canAfford || validShows.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: !canAfford || validShows.length === 0 ? 0.5 : 1
                }}
              >
                BOOK {validShows.length} SHOWS
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Venue, Show } from '@/game/types';
import { useGameStore } from '@/stores/gameStore';
import { haptics } from '@/utils/mobile';
import { PixelButton } from '@/components/ui/PixelButton';

interface VenueBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
}

export const VenueBookingModal: React.FC<VenueBookingModalProps> = ({
  isOpen,
  onClose,
  venue
}) => {
  const {
    allBands,
    rosterBandIds,
    money,
    scheduleShow,
    scheduledShows
  } = useGameStore();

  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [ticketPrice, setTicketPrice] = useState(10);

  // Get roster bands
  const rosterBands = useMemo(() => {
    return allBands.filter(band => rosterBandIds.includes(band.id));
  }, [allBands, rosterBandIds]);

  // Filter available bands (not already booked this round)
  const availableBands = useMemo(() => {
    const bookedBandIds = scheduledShows
      .filter(show => show.status === 'SCHEDULED')
      .map(show => show.bandId);
    
    return rosterBands.filter(band => !bookedBandIds.includes(band.id));
  }, [rosterBands, scheduledShows]);

  // Calculate expected attendance based on band popularity and venue
  const calculateExpectedAttendance = () => {
    if (!venue || selectedBandIds.length === 0) return 0;
    
    const selectedBands = allBands.filter(b => selectedBandIds.includes(b.id));
    const avgPopularity = selectedBands.reduce((sum, b) => sum + b.popularity, 0) / selectedBands.length;
    const venueAppeal = (venue.atmosphere + venue.authenticity) / 200;
    
    const baseAttendance = Math.floor(venue.capacity * (avgPopularity / 100) * venueAppeal);
    return Math.min(baseAttendance, venue.capacity);
  };

  // Calculate show costs
  const calculateCosts = () => {
    if (!venue) return 0;
    return venue.rent || 50;
  };

  // Calculate expected revenue
  const expectedAttendance = calculateExpectedAttendance();
  const expectedRevenue = expectedAttendance * ticketPrice;
  const costs = calculateCosts();
  const expectedProfit = expectedRevenue - costs;

  const handleBandToggle = (bandId: string) => {
    setSelectedBandIds(prev => {
      if (prev.includes(bandId)) {
        return prev.filter(id => id !== bandId);
      }
      // Max 3 bands per show
      if (prev.length >= 3) {
        haptics.error();
        return prev;
      }
      haptics.light();
      return [...prev, bandId];
    });
  };

  const handleBookShow = () => {
    if (!venue || selectedBandIds.length === 0) return;
    
    if (money < costs) {
      haptics.error();
      alert("Not enough money to book this venue!");
      return;
    }

    // For now, book the first band as headliner
    const headlinerId = selectedBandIds[0];
    const openerIds = selectedBandIds.slice(1);
    
    const show: Show = {
      id: `show-${Date.now()}`,
      bandId: headlinerId,
      venueId: venue.id,
      date: new Date(),
      ticketPrice,
      status: 'SCHEDULED',
      actualAttendance: 0,
      revenue: 0,
      bill: openerIds.length > 0 ? {
        headliner: headlinerId,
        openers: openerIds
      } : undefined
    };

    scheduleShow(show);
    haptics.success();
    onClose();
  };

  if (!venue) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-metal-950 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-metal-700"
            style={{
              imageRendering: 'pixelated',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b-2 border-metal-800 bg-gradient-to-r from-punk-600/20 to-metal-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold mb-1">{venue.name}</h2>
                  <div className="flex gap-4 text-sm text-metal-400">
                    <span>📍 {venue.location}</span>
                    <span>👥 {venue.capacity} capacity</span>
                    <span>💵 ${venue.rent}/show</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="touch-target text-metal-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Band Selection */}
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-metal-300">Select Bands (Max 3)</h3>
                <div className="space-y-2">
                  {availableBands.map(band => (
                    <div
                      key={band.id}
                      onClick={() => handleBandToggle(band.id)}
                      className={`p-3 rounded border-2 cursor-pointer transition-all ${
                        selectedBandIds.includes(band.id)
                          ? 'border-punk-500 bg-punk-900/20'
                          : 'border-metal-700 hover:border-metal-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{band.name}</div>
                          <div className="text-sm text-metal-400">
                            {band.genre} • Popularity: {band.popularity}/100
                          </div>
                        </div>
                        <div className={`w-6 h-6 border-2 rounded ${
                          selectedBandIds.includes(band.id)
                            ? 'bg-punk-500 border-punk-500'
                            : 'border-metal-600'
                        }`}>
                          {selectedBandIds.includes(band.id) && (
                            <svg className="w-full h-full" fill="white" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Price */}
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-metal-300">Ticket Price</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="flex-1 h-2 bg-metal-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${ticketPrice * 2}%, #4b5563 ${ticketPrice * 2}%, #4b5563 100%)`,
                    }}
                  />
                  <div className="text-xl font-bold w-16 text-right">${ticketPrice}</div>
                </div>
                <div className="text-xs text-metal-500 mt-1">
                  Higher prices = fewer attendees, lower prices = more attendees
                </div>
              </div>

              {/* Show Preview */}
              <div className="bg-metal-900/50 rounded-lg p-4 space-y-2">
                <h3 className="font-bold mb-2 text-metal-300">Show Preview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-metal-500">Expected Attendance</div>
                    <div className="font-bold text-lg">{expectedAttendance}/{venue.capacity}</div>
                  </div>
                  <div>
                    <div className="text-metal-500">Venue Cost</div>
                    <div className="font-bold text-lg text-red-400">-${costs}</div>
                  </div>
                  <div>
                    <div className="text-metal-500">Expected Revenue</div>
                    <div className="font-bold text-lg text-green-400">+${expectedRevenue}</div>
                  </div>
                  <div>
                    <div className="text-metal-500">Expected Profit</div>
                    <div className={`font-bold text-lg ${expectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {expectedProfit >= 0 ? '+' : ''}{expectedProfit}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-metal-800 bg-metal-900/30">
              <div className="flex gap-3">
                <PixelButton
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </PixelButton>
                <PixelButton
                  onClick={handleBookShow}
                  variant="primary"
                  disabled={selectedBandIds.length === 0 || money < costs}
                  className="flex-1"
                >
                  Book Show (${costs})
                </PixelButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
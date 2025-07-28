import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { Band, Venue, Show } from '@game/types';
import { haptics } from '@utils/mobile';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { showPromotionSystem } from '@game/mechanics/ShowPromotionSystem';

type BookingStep = 'bands' | 'venue' | 'timing' | 'confirm';

export const ShowBuilderView: React.FC = () => {
  const { 
    allBands, 
    rosterBandIds, 
    venues, 
    money, 
    scheduledShows,
    scheduleShow 
  } = useGameStore();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('bands');
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [ticketPrice, setTicketPrice] = useState(10);
  const [turnsInAdvance, setTurnsInAdvance] = useState(3);

  const handleBandToggle = (bandId: string) => {
    setSelectedBandIds(prev => {
      if (prev.includes(bandId)) {
        return prev.filter(id => id !== bandId);
      }
      if (prev.length < 3) {
        return [...prev, bandId];
      }
      return prev;
    });
    haptics.light();
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    haptics.light();
  };

  const handleBookShow = () => {
    if (!selectedVenue || selectedBandIds.length === 0) return;

    const showCost = selectedVenue.rent + (selectedBandIds.length * 50);
    if (money < showCost) {
      haptics.error();
      return;
    }

    const newShow: Show = {
      id: `show-${Date.now()}`,
      bandId: selectedBandIds[0],
      venueId: selectedVenue.id,
      date: new Date(),
      ticketPrice,
      status: 'SCHEDULED',
      bill: selectedBandIds.length > 1 ? {
        headliner: selectedBandIds[0],
        openers: selectedBandIds.slice(1),
        dynamics: {
          chemistryScore: 75,
          dramaRisk: 20,
          crowdAppeal: 85,
          sceneAlignment: 80
        }
      } : undefined
    };

    // Schedule the show with promotion system
    const scheduledShow = showPromotionSystem.scheduleShow(newShow, turnsInAdvance);
    if (scheduledShow) {
      // Don't add to game store's scheduledShows - let the promotion system handle it
      useGameStore.getState().addMoney(-showCost);
      
      // Reset
      setSelectedBandIds([]);
      setSelectedVenue(null);
      setCurrentStep('bands');
      setTicketPrice(10);
      setTurnsInAdvance(3);
      
      haptics.success();
    } else {
      haptics.error();
    }
  };

  const showCost = selectedVenue ? selectedVenue.rent + (selectedBandIds.length * 50) : 0;
  const selectedBands = allBands.filter(b => selectedBandIds.includes(b.id));

  return (
    <div className="show-builder-view">
      {/* Minimal Progress Bar */}
      <div className="progress-bar">
        <div className={`progress-dot ${currentStep === 'bands' ? 'active' : selectedBandIds.length > 0 ? 'done' : ''}`} />
        <div className="progress-line" />
        <div className={`progress-dot ${currentStep === 'venue' ? 'active' : selectedVenue ? 'done' : ''}`} />
        <div className="progress-line" />
        <div className={`progress-dot ${currentStep === 'timing' ? 'active' : turnsInAdvance ? 'done' : ''}`} />
        <div className="progress-line" />
        <div className={`progress-dot ${currentStep === 'confirm' ? 'active' : ''}`} />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Band Selection */}
        {currentStep === 'bands' && (
          <motion.div
            key="bands"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="step-container"
          >
            {/* Header with counter */}
            <div className="compact-header">
              <span className="header-text">Select Bands</span>
              <span className="counter">{selectedBandIds.length}/3</span>
            </div>

            {/* Selected Bands (Compact) */}
            {selectedBandIds.length > 0 && (
              <div className="selected-compact">
                {selectedBands.map((band, idx) => (
                  <div key={band.id} className="selected-chip">
                    <span className="chip-role">
                      {idx === 0 ? '👑' : idx === selectedBands.length - 1 ? '🎸' : '🎵'}
                    </span>
                    <span className="chip-name">{band.name}</span>
                    <button 
                      className="chip-remove"
                      onClick={() => handleBandToggle(band.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Band Grid */}
            <div className="band-grid-container">
              {allBands.map(band => (
                <motion.div
                  key={band.id}
                  className={`band-tile ${selectedBandIds.includes(band.id) ? 'selected' : ''}`}
                  onClick={() => handleBandToggle(band.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="tile-header">
                    <span className="tile-name">{band.name}</span>
                    {rosterBandIds.includes(band.id) && (
                      <span className="roster-tag">R</span>
                    )}
                  </div>
                  <div className="tile-stats">
                    <span>{band.genre}</span>
                    <span>⭐{band.popularity}</span>
                  </div>
                  {selectedBandIds.includes(band.id) && (
                    <div className="selection-number">
                      {selectedBandIds.indexOf(band.id) + 1}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Action */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentStep('venue')}
              disabled={selectedBandIds.length === 0}
              fullWidth
            >
              Choose Venue →
            </Button>
          </motion.div>
        )}

        {/* Step 2: Venue Selection */}
        {currentStep === 'venue' && (
          <motion.div
            key="venue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="step-container"
          >
            <div className="compact-header">
              <span className="header-text">Choose Venue</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep('bands')}
              >
                ← Back
              </Button>
            </div>

            <div className="venue-list">
              {venues.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  isSelected={selectedVenue?.id === venue.id}
                  isBooked={scheduledShows.some(s => s.venueId === venue.id)}
                  onClick={() => handleVenueSelect(venue)}
                />
              ))}
            </div>

            <div className="step-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep('timing')}
                disabled={!selectedVenue}
                fullWidth
              >
                Set Timing →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Timing */}
        {currentStep === 'timing' && (
          <motion.div
            key="timing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="step-container"
          >
            <div className="compact-header">
              <span className="header-text">Schedule Show</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep('venue')}
              >
                ← Back
              </Button>
            </div>

            <Card variant="punk" className="timing-card">
              <h3>When should the show happen?</h3>
              <p className="timing-description">
                Schedule in advance to have time for promotion. Shows booked further out can build more hype!
              </p>
              
              <div className="timing-options">
                {[1, 2, 3, 4, 5].map(turns => (
                  <motion.div
                    key={turns}
                    className={`timing-option ${turnsInAdvance === turns ? 'selected' : ''}`}
                    onClick={() => setTurnsInAdvance(turns)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="timing-value">{turns}</div>
                    <div className="timing-label">
                      {turns === 1 ? 'Next Turn' : `In ${turns} Turns`}
                    </div>
                    <div className="timing-detail">
                      {turns === 1 && 'Rush job - no time to promote'}
                      {turns === 2 && 'Minimal promotion time'}
                      {turns === 3 && 'Standard booking'}
                      {turns === 4 && 'Good promotion window'}
                      {turns === 5 && 'Maximum hype potential'}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="promotion-preview">
                <h4>Promotion Opportunities</h4>
                <p>You'll have <strong>{turnsInAdvance - 1}</strong> turn{turnsInAdvance > 2 ? 's' : ''} to promote this show</p>
              </div>
            </Card>

            <div className="step-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep('confirm')}
                fullWidth
              >
                Review Booking →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="step-container"
          >
            <div className="compact-header">
              <span className="header-text">Confirm Booking</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep('timing')}
              >
                ← Back
              </Button>
            </div>

            <Card variant="punk" className="booking-summary">
              {/* Lineup */}
              <div className="summary-section">
                <h3>Lineup</h3>
                {selectedBands.map((band, idx) => (
                  <div key={band.id} className="lineup-item">
                    <span className="role">
                      {idx === 0 ? 'Headliner' : 
                       idx === selectedBands.length - 1 ? 'Opener' : 'Support'}
                    </span>
                    <span className="name">{band.name}</span>
                  </div>
                ))}
              </div>

              {/* Venue */}
              <div className="summary-section">
                <h3>Venue</h3>
                <div className="venue-summary">
                  <span>{selectedVenue?.name}</span>
                  <span className="capacity">Cap: {selectedVenue?.capacity}</span>
                </div>
              </div>

              {/* Timing */}
              <div className="summary-section">
                <h3>Timing</h3>
                <div className="timing-summary">
                  <span>Show in {turnsInAdvance} turn{turnsInAdvance > 1 ? 's' : ''}</span>
                  <span className="promotion-time">{turnsInAdvance - 1} turn{turnsInAdvance > 2 ? 's' : ''} to promote</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="summary-section">
                <h3>Ticket Price</h3>
                <div className="price-control">
                  <span className="price-min">$5</span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="price-slider"
                  />
                  <span className="price-max">$50</span>
                  <span className="price-current">${ticketPrice}</span>
                </div>
              </div>

              {/* Costs */}
              <div className="cost-summary">
                <div className="cost-line">
                  <span>Venue</span>
                  <span>${selectedVenue?.rent || 0}</span>
                </div>
                <div className="cost-line">
                  <span>Bands</span>
                  <span>${selectedBandIds.length * 50}</span>
                </div>
                <div className="cost-line total">
                  <span>Total</span>
                  <span className={money >= showCost ? 'affordable' : 'expensive'}>
                    ${showCost}
                  </span>
                </div>
              </div>
            </Card>

            <div className="step-actions">
              <Button
                variant="success"
                size="lg"
                onClick={handleBookShow}
                disabled={money < showCost}
                fullWidth
              >
                Book Show (${showCost})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .show-builder-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          padding: 12px;
          max-width: 800px;
          margin: 0 auto;
          overflow: hidden;
        }

        .progress-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          padding: 0 40px;
          flex-shrink: 0;
        }

        .progress-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          transition: all var(--transition-base);
        }

        .progress-dot.active {
          width: 16px;
          height: 16px;
          background: var(--punk-magenta);
          border-color: var(--punk-magenta);
          box-shadow: 0 0 12px rgba(236, 72, 153, 0.5);
        }

        .progress-dot.done {
          background: var(--success-green);
          border-color: var(--success-green);
        }

        .progress-line {
          flex: 1;
          height: 2px;
          background: var(--border-default);
          max-width: 80px;
        }

        .step-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
          overflow: hidden;
        }

        .compact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
          flex-shrink: 0;
        }

        .header-text {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--punk-magenta);
        }

        .counter {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .selected-compact {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .selected-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-secondary);
          padding: 6px 10px;
          border-radius: 20px;
          border: 1px solid var(--punk-magenta);
          font-size: 12px;
        }

        .chip-role {
          font-size: 14px;
        }

        .chip-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .chip-remove {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chip-remove:hover {
          color: var(--metal-red);
        }

        .band-grid-container {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 8px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px;
          min-height: 0;
        }

        .band-tile {
          position: relative;
          padding: 10px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .band-tile:hover {
          border-color: var(--punk-magenta);
          transform: translateY(-1px);
        }

        .band-tile.selected {
          border-color: var(--punk-magenta);
          background: var(--bg-hover);
        }

        .tile-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .tile-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .roster-tag {
          background: var(--success-green);
          color: white;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .tile-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .selection-number {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background: var(--punk-magenta);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .band-grid-container::-webkit-scrollbar {
          width: 6px;
        }

        .band-grid-container::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 3px;
        }

        .band-grid-container::-webkit-scrollbar-thumb {
          background: var(--border-light);
          border-radius: 3px;
        }

        .band-grid-container::-webkit-scrollbar-thumb:hover {
          background: var(--punk-magenta);
        }

        .venue-list {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          padding-right: 8px;
          min-height: 0;
          align-content: start;
        }

        .venue-list::-webkit-scrollbar {
          width: 6px;
        }

        .venue-list::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 3px;
        }

        .venue-list::-webkit-scrollbar-thumb {
          background: var(--border-light);
          border-radius: 3px;
        }

        .venue-list::-webkit-scrollbar-thumb:hover {
          background: var(--punk-magenta);
        }

        .step-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 12px;
          flex-shrink: 0;
        }

        .booking-summary {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
          min-height: 0;
        }

        .summary-section {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
        }

        .summary-section:last-child {
          border-bottom: none;
        }

        .summary-section h3 {
          margin: 0 0 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .lineup-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .role {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .name {
          font-weight: 600;
        }

        .venue-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .capacity {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .price-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .price-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          background: var(--border-default);
          border-radius: 2px;
          outline: none;
        }

        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--punk-magenta);
          border-radius: 50%;
          cursor: pointer;
        }

        .price-min, .price-max {
          font-size: 12px;
          color: var(--text-muted);
        }

        .price-current {
          font-size: 20px;
          font-weight: 700;
          color: var(--success-green);
          min-width: 50px;
          text-align: right;
        }

        .cost-summary {
          background: var(--bg-tertiary);
          padding: 16px;
          border-radius: 8px;
        }

        .cost-line {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }

        .cost-line.total {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border-default);
          font-weight: 700;
          font-size: 16px;
        }

        .affordable {
          color: var(--success-green);
        }

        .expensive {
          color: var(--metal-red);
        }

        .timing-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
          min-height: 0;
          padding: 20px;
        }

        .timing-card h3 {
          margin: 0;
          font-size: 18px;
          color: var(--punk-magenta);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .timing-description {
          color: var(--text-secondary);
          margin: 0;
          font-size: 13px;
        }

        .timing-options {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          padding: 0;
        }

        .timing-option {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 10px;
          padding: 16px 12px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 100px;
        }

        .timing-option:hover {
          border-color: var(--punk-magenta);
          transform: translateY(-2px);
          background: var(--bg-hover);
        }

        .timing-option.selected {
          border-color: var(--punk-magenta);
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, transparent 100%);
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
        }

        .timing-value {
          font-size: 28px;
          font-weight: 900;
          color: var(--punk-magenta);
          line-height: 1;
          text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }

        .timing-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .timing-detail {
          font-size: 11px;
          color: var(--text-secondary);
          font-style: italic;
          line-height: 1.3;
        }

        .promotion-preview {
          background: var(--bg-tertiary);
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          margin-top: auto;
        }

        .promotion-preview h4 {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .promotion-preview p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .promotion-preview strong {
          color: var(--punk-magenta);
        }

        .timing-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .promotion-time {
          font-size: 13px;
          color: var(--text-secondary);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .show-builder-view {
            padding: 8px;
          }

          .band-grid-container {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 6px;
          }

          .band-tile {
            padding: 8px;
          }

          .tile-name {
            font-size: 12px;
          }

          .venue-list {
            grid-template-columns: 1fr;
          }

          .timing-options {
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
          }

          .timing-option {
            min-height: 80px;
            padding: 12px 8px;
          }

          .timing-value {
            font-size: 24px;
          }

          .timing-label {
            font-size: 11px;
          }

          .progress-bar {
            margin-bottom: 8px;
          }
          
          .timing-options {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .timing-option {
            padding: 16px 12px;
            min-height: 120px;
          }
          
          .timing-value {
            font-size: 28px;
          }
          
          .timing-label {
            font-size: 12px;
          }
          
          .timing-detail {
            font-size: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .timing-card {
            padding: 16px;
          }

          .timing-options {
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
          }

          .timing-option {
            min-height: 70px;
            padding: 10px 6px;
          }

          .timing-value {
            font-size: 20px;
          }

          .timing-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

// Venue Card Component
const VenueCard: React.FC<{
  venue: Venue;
  isSelected: boolean;
  isBooked: boolean;
  onClick: () => void;
}> = ({ venue, isSelected, isBooked, onClick }) => (
  <motion.div
    className={`venue-item ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
    onClick={!isBooked ? onClick : undefined}
    whileHover={!isBooked ? { y: -2 } : undefined}
    whileTap={!isBooked ? { scale: 0.98 } : undefined}
  >
    <div className="venue-header">
      <h4 className="venue-name">{venue.name}</h4>
      {isBooked && <span className="booked-badge">Booked</span>}
    </div>
    <div className="venue-type">{venue.type}</div>
    
    {/* Venue Traits */}
    {venue.traits && venue.traits.length > 0 && (
      <div className="venue-traits">
        {venue.traits.map(trait => (
          <span 
            key={trait.id}
            className={`trait-badge ${trait.type.toLowerCase()}`}
            title={trait.description}
          >
            {trait.name}
          </span>
        ))}
      </div>
    )}
    
    <div className="venue-stats">
      <div className="stat">
        <span className="label">Capacity</span>
        <span className="value">{venue.capacity}</span>
      </div>
      <div className="stat">
        <span className="label">Rent</span>
        <span className="value">${venue.rent}</span>
      </div>
      <div className="stat">
        <span className="label">Auth</span>
        <span className="value">{venue.authenticity}%</span>
      </div>
    </div>
    <style jsx>{`
      .venue-item {
        padding: 20px;
        background: var(--bg-card);
        border: 2px solid var(--border-default);
        border-radius: 8px;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .venue-item:hover:not(.booked) {
        border-color: var(--punk-magenta);
        background: var(--bg-hover);
        transform: translateY(-2px);
      }

      .venue-item.selected {
        border-color: var(--punk-magenta);
        background: var(--bg-hover);
        box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
      }

      .venue-item.booked {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .venue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .venue-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .booked-badge {
        background: var(--metal-red);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .venue-type {
        font-size: 12px;
        color: var(--text-secondary);
        text-transform: uppercase;
        margin-bottom: 12px;
      }

      .venue-traits {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .trait-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: help;
      }

      .trait-badge.atmosphere {
        background: rgba(236, 72, 153, 0.2);
        color: var(--punk-magenta);
        border: 1px solid rgba(236, 72, 153, 0.3);
      }

      .trait-badge.technical {
        background: rgba(139, 92, 246, 0.2);
        color: var(--info-purple);
        border: 1px solid rgba(139, 92, 246, 0.3);
      }

      .trait-badge.social {
        background: rgba(16, 185, 129, 0.2);
        color: var(--success-green);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .trait-badge.legendary {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning-amber);
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      .venue-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .stat {
        text-align: center;
      }

      .label {
        display: block;
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .value {
        display: block;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
      }
    `}</style>
  </motion.div>
);
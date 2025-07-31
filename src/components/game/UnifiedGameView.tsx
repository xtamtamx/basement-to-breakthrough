import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Band, Venue, Show, GamePhase, VenueType } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { DraggablePixelBandCard } from './DraggablePixelBandCard';
import { PixelVenueCard } from './PixelVenueCard';
import { AnimatedShowResults } from './AnimatedShowResults';
import { GameOverScreen } from './GameOverScreen';
import { TurnDisplay } from './TurnDisplay';
import { FactionDisplay } from './FactionDisplay';
import { FactionEventModal } from './FactionEventModal';
import { EquipmentShopV2 } from './EquipmentShopV2';
import { VenueUpgradeShop } from './VenueUpgradeShop';
import { bandGenerator } from '@game/mechanics/BandGenerator';
import { showExecutor } from '@game/mechanics/ShowExecutor';
import { bookingSystem } from '@game/mechanics/BookingSystem';
import { turnManager } from '@game/mechanics/TurnManager';
import { factionSystem } from '@game/mechanics/FactionSystem';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';
import { venueUpgradeManager } from '@game/mechanics/VenueUpgradeManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface UnifiedGameViewProps {
  initialBands?: Band[];
  initialVenues?: Venue[];
}

export const UnifiedGameView: React.FC<UnifiedGameViewProps> = ({
  initialBands = [],
  initialVenues = [],
}) => {
  // Game state
  const [availableBands, setAvailableBands] = useState<Band[]>(initialBands);
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [bookedShows, setBookedShows] = useState<Map<string, Show>>(new Map());
  const [showResults, setShowResults] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [gameOver, setGameOver] = useState<{ reason: 'bankruptcy' | 'victory' | 'scene_collapse', stats: any } | null>(null);
  const [totalStats, setTotalStats] = useState({ shows: 0, revenue: 0 });
  const [isEquipmentShopOpen, setIsEquipmentShopOpen] = useState(false);
  const [selectedVenueForUpgrade, setSelectedVenueForUpgrade] = useState<Venue | null>(null);
  
  // Store
  const { 
    phase, 
    setPhase, 
    money, 
    addMoney,
    reputation,
    addReputation,
    fans,
    addFans,
    connections,
    addConnections,
    stress,
    addStress,
    currentFactionEvent,
    setFactionEvent,
    applyFactionChoice
  } = useGameStore();

  // Initialize game
  useEffect(() => {
    if (availableBands.length === 0) {
      // Generate initial bands
      const newBands = bandGenerator.generateBands(5, 1);
      setAvailableBands(newBands);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = (result: any) => {
    devLog.log('Drag ended:', result);
    
    if (!result.destination) {
      devLog.log('No destination');
      return;
    }

    const { source, destination } = result;

    // Band to venue booking
    if (source.droppableId === 'band-pool' && destination.droppableId.startsWith('venue-')) {
      const bandIndex = source.index;
      const venueId = destination.droppableId.replace('venue-', '');
      
      const band = availableBands[bandIndex];
      const venue = venues.find(v => v.id === venueId);
      
      if (band && venue && !bookedShows.has(venueId)) {
        // Check if booking is valid
        // const canBook = bookingSystem.bookShow(band, venue, new Date(), 10, {} as any);
        
        if (true) { // Simplified booking check
          // Create show
          // Calculate ticket price based on band popularity and venue
          const basePrice = venue.type === VenueType.BASEMENT ? 5 : 
                           venue.type === VenueType.DIVE_BAR ? 10 : 15;
          const popularityMultiplier = 1 + (band.popularity / 200);
          
          const show: Show = {
            id: `show-${Date.now()}`,
            bandId: band.id,
            venueId: venue.id,
            date: new Date(),
            ticketPrice: Math.floor(basePrice * popularityMultiplier),
            status: 'SCHEDULED',
          };
          
          // Update state
          setBookedShows(new Map(bookedShows.set(venueId, show)));
          setAvailableBands(availableBands.filter((_, i) => i !== bandIndex));
          
          // Deduct booking cost
          if (venue.rent > 0) {
            addMoney(-venue.rent);
          }
          
          // Feedback
          haptics.success();
          audio.play('cardDrop');
        } else {
          // Show why booking failed
          haptics.error();
          devLog.log('Cannot book:', canBook.reasons);
        }
      }
    }
  };

  // Execute all shows
  const executeShows = async () => {
    if (bookedShows.size === 0) return;

    setPhase(GamePhase.PERFORMANCE);
    
    const results = [];
    
    for (const [venueId, show] of bookedShows) {
      const band = [...availableBands, ...initialBands].find(b => b.id === show.bandId);
      const venue = venues.find(v => v.id === venueId);
      
      if (band && venue) {
        const result = await showExecutor.executeShow(show, band, venue, {
          reputation,
          factionStandings: {},
        });
        
        // Format result for display
        const displayResult = {
          venueName: venue.name,
          bandName: band.name,
          attendance: result.attendance,
          capacity: venue.capacity,
          financials: result.financials,
          reputationChange: result.reputationChange,
          incidents: result.incidents.map(i => i.description),
          isSuccess: result.isSuccess,
        };
        
        results.push(displayResult);
        
        // Update resources
        addMoney(result.financials.profit);
        addReputation(result.reputationGain || 0);
        addFans(result.attendance);
        
        // Gain connections from successful shows
        if (result.isSuccess) {
          addConnections(Math.floor(Math.random() * 3) + 1); // 1-3 connections per successful show
        }
        
        // Add stress from show
        // if (showOutcome.show.stress) {
        //   addStress(showOutcome.show.stress);
        // }
        
        // Update total stats
        setTotalStats(prev => ({
          shows: prev.shows + 1,
          revenue: prev.revenue + result.financials.revenue
        }));
      }
    }
    
    // Show results
    setShowResults(results);
    
    // Clear bookings
    setBookedShows(new Map());
    
    // Process turn-based systems
    // 1. Deduct maintenance costs
    const maintenanceCost = equipmentManagerV2.getMaintenanceCosts();
    if (maintenanceCost > 0) {
      addMoney(-maintenanceCost);
    }
    
    // 2. Process venue upgrades
    const completedUpgrades = venueUpgradeManager.processTurn();
    if (completedUpgrades.length > 0) {
      // Apply upgrade effects to venues
      venues.forEach(venue => {
        const effects = venueUpgradeManager.getVenueUpgradeEffects(venue.id);
        venue.capacity += effects.capacityIncrease;
        venue.acoustics = Math.min(100, venue.acoustics + effects.acousticsIncrease);
        venue.atmosphere = Math.min(100, venue.atmosphere + effects.atmosphereIncrease);
      });
      setVenues([...venues]); // Trigger re-render
    }
    
    // Generate new bands for next turn
    const newBands = bandGenerator.generateBands(3, currentTurn);
    setAvailableBands([...availableBands, ...newBands]);
    
    // Advance turn
    setCurrentTurn(currentTurn + 1);
    setPhase(GamePhase.PLANNING);
    
    haptics.heavy();
    audio.play('success');
  };

  // Check for faction events after each turn
  useEffect(() => {
    if (phase === GamePhase.PLANNING && currentTurn > 1) {
      const events = factionSystem.getPendingEvents();
      if (events.length > 0 && !currentFactionEvent) {
        setFactionEvent(events[0]);
      }
    }
  }, [currentTurn, phase, currentFactionEvent, setFactionEvent]);

  // Check game over conditions
  useEffect(() => {
    if (money < 0) {
      setPhase(GamePhase.GAME_OVER);
      setGameOver({
        reason: 'bankruptcy',
        stats: {
          turnsPlayed: currentTurn,
          totalShows: totalStats.shows,
          totalRevenue: totalStats.revenue,
          finalReputation: reputation,
          finalFans: fans,
        }
      });
    }
    
    if (reputation >= 100) {
      setPhase(GamePhase.GAME_OVER);
      setGameOver({
        reason: 'victory',
        stats: {
          turnsPlayed: currentTurn,
          totalShows: totalStats.shows,
          totalRevenue: totalStats.revenue,
          finalReputation: reputation,
          finalFans: fans,
        }
      });
    }
  }, [money, reputation, currentTurn, totalStats, fans]);

  return (
    <div className="relative min-h-screen p-4 pb-20">
      {/* Turn and Phase Display */}
      <div className="glass-panel p-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
              TURN {currentTurn}
            </p>
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
              {phase.replace('_', ' ')}
            </p>
          </div>
          <div className="text-right">
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              ${money}
            </p>
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-magenta)' }}>
              {reputation} REP
            </p>
            <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
              {connections} CONN
            </p>
            <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
              {stress}% STRESS
            </p>
          </div>
        </div>
        
        {/* Equipment & Upgrades Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setIsEquipmentShopOpen(true)}
            className="flex-1 pixel-button p-2"
            style={{ backgroundColor: 'var(--pixel-blue)' }}
          >
            <span className="pixel-text pixel-text-xs">🔧 EQUIPMENT</span>
          </button>
          <button
            onClick={() => setSelectedVenueForUpgrade(venues[0])} // TODO: Add venue selection
            className="flex-1 pixel-button p-2"
            style={{ backgroundColor: 'var(--pixel-purple)' }}
          >
            <span className="pixel-text pixel-text-xs">🏗️ UPGRADES</span>
          </button>
        </div>
        
        {/* Maintenance Costs Display */}
        {equipmentManagerV2.getMaintenanceCosts() > 0 && (
          <p className="pixel-text pixel-text-xs mt-2" style={{ color: 'var(--pixel-orange)' }}>
            MAINTENANCE: ${equipmentManagerV2.getMaintenanceCosts()}/TURN
          </p>
        )}
      </div>

      {/* Faction Display */}
      <FactionDisplay />

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Available Bands */}
        <div className="glass-panel p-3 mb-4">
          <h2 className="pixel-text pixel-text-shadow mb-3" style={{ color: 'var(--pixel-cyan)' }}>
            AVAILABLE BANDS
          </h2>
          <Droppable droppableId="band-pool">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[100px] ${
                  snapshot.isDraggingOver ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <AnimatePresence>
                  {availableBands.map((band, index) => (
                    <Draggable 
                      key={band.id} 
                      draggableId={band.id} 
                      index={index}
                      isDragDisabled={phase !== GamePhase.PLANNING}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={provided.draggableProps.style}
                        >
                          <DraggablePixelBandCard
                            band={band}
                            isDragging={snapshot.isDragging}
                            disabled={phase !== GamePhase.PLANNING}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Venues */}
        <div className="space-y-3 mb-4">
          <h2 className="pixel-text pixel-text-shadow" style={{ color: 'var(--pixel-green)' }}>
            VENUES
          </h2>
          {venues.map((venue) => {
            const show = bookedShows.get(venue.id);
            const bookedBand = show ? 
              [...availableBands, ...initialBands].find(b => b.id === show.bandId) : 
              null;
            
            return (
              <Droppable key={venue.id} droppableId={`venue-${venue.id}`} isDropDisabled={!!show}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      relative min-h-[120px] mb-3
                      ${snapshot.isDraggingOver ? 'ring-2 ring-yellow-400 scale-102' : ''}
                      transition-all duration-200
                    `}
                  >
                    <PixelVenueCard
                      venue={venue}
                      disabled={phase !== GamePhase.PLANNING || !!show}
                      isBooked={!!show}
                      onSelect={() => {
                        if (!show && phase === GamePhase.PLANNING) {
                          setSelectedVenueForUpgrade(venue);
                        }
                      }}
                    />
                    
                    {/* Booked band overlay */}
                    {bookedBand && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.7)',
                          borderRadius: 'inherit'
                        }}
                      >
                        <div className="text-center">
                          <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                            BOOKED
                          </p>
                          <p className="pixel-text" style={{ color: 'var(--pixel-white)' }}>
                            {bookedBand.name.toUpperCase()}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Drop zone indicator */}
                    {!show && snapshot.isDraggingOver && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ zIndex: 10 }}
                      >
                        <div className="pixel-panel-raised p-3" style={{ backgroundColor: 'rgba(255, 235, 59, 0.2)' }}>
                          <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                            DROP HERE
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>

        {/* Execute Shows Button */}
        {bookedShows.size > 0 && phase === GamePhase.PLANNING && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-20 left-4 right-4 z-30"
          >
            <button
              onClick={executeShows}
              className="w-full glass-button p-4 text-center"
              style={{
                background: 'linear-gradient(45deg, var(--pixel-green), var(--pixel-cyan))',
                boxShadow: '0 0 30px var(--pixel-green)',
              }}
            >
              <span className="pixel-text pixel-text-lg">
                EXECUTE {bookedShows.size} SHOW{bookedShows.size > 1 ? 'S' : ''}
              </span>
            </button>
          </motion.div>
        )}
      </DragDropContext>

      {/* Show Results Modal */}
      <AnimatePresence>
        {showResults && (
          <AnimatedShowResults
            results={showResults}
            onClose={() => setShowResults(null)}
          />
        )}
      </AnimatePresence>

      {/* Instructions */}
      {availableBands.length > 0 && bookedShows.size === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
            DRAG BANDS TO VENUES TO BOOK SHOWS
          </p>
        </motion.div>
      )}
      
      {/* Game Over Screen */}
      {gameOver && (
        <GameOverScreen
          reason={gameOver.reason}
          stats={gameOver.stats}
          onRestart={() => {
            // Reset game state
            setGameOver(null);
            setCurrentTurn(1);
            setAvailableBands(bandGenerator.generateBands(5, 1));
            setBookedShows(new Map());
            setTotalStats({ shows: 0, revenue: 0 });
            useGameStore.getState().resetGame();
            setPhase(GamePhase.PLANNING);
          }}
          onMainMenu={() => {
            // Go back to main menu
            window.location.reload();
          }}
        />
      )}
      
      {/* Faction Event Modal */}
      <FactionEventModal
        event={currentFactionEvent}
        onChoice={applyFactionChoice}
      />
      
      {/* Equipment Shop Modal */}
      <EquipmentShopV2
        isOpen={isEquipmentShopOpen}
        onClose={() => setIsEquipmentShopOpen(false)}
      />
      
      {/* Venue Upgrade Shop Modal */}
      <VenueUpgradeShop
        isOpen={!!selectedVenueForUpgrade}
        onClose={() => setSelectedVenueForUpgrade(null)}
        venue={selectedVenueForUpgrade}
      />
    </div>
  );
};
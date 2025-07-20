import React, { useState } from 'react';
import { DragProvider } from '@contexts/DragContext';
import { DraggableBandCard } from './DraggableBandCard';
import { VenueDropZone } from './VenueDropZone';
import { ShowResultsModal } from './ShowResultsModal';
import { TurnDisplay } from './TurnDisplay';
import { FactionDisplay } from './FactionDisplay';
import { Band, Venue } from '@game/types';
import { bookingSystem } from '@game/mechanics/BookingSystem';
import { showExecutor, ShowOutcome } from '@game/mechanics/ShowExecutor';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { useCardStack } from '@hooks/useCardStack';

interface GameBoardProps {
  bands: Band[];
  venues: Venue[];
}

interface Booking {
  band: Band;
  venue: Venue;
  ticketPrice: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ bands, venues }) => {
  const initialPositions = bands.map((band, index) => ({
    id: band.id,
    x: 20 + (index % 3) * 220,
    y: 20 + Math.floor(index / 3) * 180,
  }));

  const {
    positions,
    stacks,
    handleCardDrop,
    updatePosition,
    fanStack,
    collapseStack,
  } = useCardStack(initialPositions, {
    stackThreshold: 80,
    stackOffset: 8,
    maxStackSize: 4,
  });

  const [bookings, setBookings] = useState<Map<string, Booking>>(new Map());
  const [expandedStack, setExpandedStack] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<ShowOutcome[] | null>(null);
  const gameStore = useGameStore();

  const handleBook = (band: Band, venue: Venue) => {
    // Check if can book
    const canBookResult = bookingSystem.canBook(band, venue, {
      id: 'current',
      turn: 1,
      phase: 'BOOKING' as any,
      resources: {
        money: gameStore.money,
        reputation: gameStore.reputation,
        connections: 0,
        stress: 0,
      },
      bookedShows: [],
      availableBands: [],
      sceneReputation: { overall: gameStore.reputation, factions: [], relationships: [] },
      unlockedContent: [],
      achievements: [],
      settings: {} as any,
    });

    if (!canBookResult.valid) {
      haptics.error();
      console.error(canBookResult.reason);
      return;
    }

    // Create booking
    setBookings(prev => {
      const newBookings = new Map(prev);
      newBookings.set(venue.id, {
        band,
        venue,
        ticketPrice: 10, // Default ticket price
      });
      return newBookings;
    });

    // Remove card from board by moving it off-screen
    updatePosition(band.id, { x: -1000, y: -1000 });

    haptics.success();
  };

  const handleStackClick = (stackId: string) => {
    if (expandedStack === stackId) {
      collapseStack(stackId);
      setExpandedStack(null);
    } else {
      if (expandedStack) {
        collapseStack(expandedStack);
      }
      fanStack(stackId);
      setExpandedStack(stackId);
    }
    haptics.light();
  };

  const getBookedBand = (venueId: string): Band | undefined => {
    return bookings.get(venueId)?.band;
  };

  const remainingBands = bands.filter(band => 
    !Array.from(bookings.values()).some(booking => booking.band.id === band.id) &&
    positions.some(p => p.id === band.id && p.x > -500) // Not removed
  );

  const handleRunShows = () => {
    if (bookings.size === 0) {
      haptics.error();
      return;
    }

    // Create game state for show execution
    const gameState = {
      id: 'current',
      turn: 1,
      phase: 'SHOW' as any,
      resources: {
        money: gameStore.money,
        reputation: gameStore.reputation,
        connections: 0,
        stress: 0,
      },
      bookedShows: [],
      availableBands: bands,
      sceneReputation: { overall: gameStore.reputation, factions: [], relationships: [] },
      unlockedContent: [],
      achievements: [],
      settings: {} as any,
    };

    // Execute all shows
    const results = showExecutor.executeAllShows(
      Array.from(bookings.values()).map(b => ({
        band: b.band,
        venue: b.venue,
        ticketPrice: b.ticketPrice,
      })),
      gameState
    );

    setShowResults(results);
    haptics.success();
  };

  const handleResultsClose = () => {
    setShowResults(null);
    // Clear bookings and reset board
    setBookings(new Map());
    
    // Reset band positions
    const resetPositions = bands.map((band, index) => ({
      id: band.id,
      x: 20 + (index % 3) * 220,
      y: 20 + Math.floor(index / 3) * 180,
    }));
    
    positions.forEach((pos, index) => {
      updatePosition(pos.id, resetPositions[index] || { x: 0, y: 0 });
    });
  };

  const handleResourcesUpdate = (money: number, reputation: number, fans: number) => {
    gameStore.addMoney(money);
    gameStore.addReputation(reputation);
    gameStore.addFans(fans);
  };

  return (
    <DragProvider>
      <div className="relative w-full h-screen bg-black overflow-auto">
        {/* Instructions */}
        <div className="absolute top-4 left-4 right-4 bg-metal-900/80 rounded-lg p-3 z-10">
          <h2 className="font-bold text-lg mb-1">Drag bands onto venues to book shows!</h2>
          <p className="text-sm text-metal-300">
            Stack cards by dragging them close together. Tap stacks to expand them.
          </p>
        </div>

        {/* Band Cards Area */}
        <div 
          className="absolute top-20 left-0 right-0 h-[40%] border-b border-metal-800"
          data-tutorial="band-area"
        >
          <div className="absolute top-2 left-4 text-xs text-metal-500 uppercase tracking-wider">
            Available Bands ({remainingBands.length})
          </div>
          
          {/* Render stacks */}
          {stacks.map(stack => (
            <div
              key={stack.id}
              className="absolute cursor-pointer"
              style={{ left: stack.x, top: stack.y }}
              onClick={() => handleStackClick(stack.id)}
            >
              <div className="relative">
                {stack.cards.map((cardId, index) => {
                  const band = bands.find(b => b.id === cardId);
                  if (!band) return null;
                  
                  const position = positions.find(p => p.id === cardId);
                  if (!position || position.x < -500) return null;
                  
                  return (
                    <div
                      key={cardId}
                      className="absolute"
                      style={{
                        left: position.x - stack.x,
                        top: position.y - stack.y,
                        zIndex: index,
                      }}
                    >
                      <DraggableBandCard
                        band={band}
                        position={{ x: 0, y: 0 }}
                        onPositionChange={(pos) => handleCardDrop(band.id, pos)}
                      />
                    </div>
                  );
                })}
              </div>
              {stack.cards.length > 1 && (
                <div className="absolute -top-2 -right-2 bg-punk-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {stack.cards.length}
                </div>
              )}
            </div>
          ))}
          
          {/* Render individual cards */}
          {remainingBands.map(band => {
            const position = positions.find(p => p.id === band.id);
            if (!position || position.stackId) return null;
            
            return (
              <DraggableBandCard
                key={band.id}
                band={band}
                position={position}
                onPositionChange={(pos) => handleCardDrop(band.id, pos)}
              />
            );
          })}
        </div>

        {/* Venues Area */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[55%] p-4"
          data-tutorial="venue-area"
        >
          <div className="absolute top-2 left-4 text-xs text-metal-500 uppercase tracking-wider">
            Venues
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            {venues.map(venue => (
              <VenueDropZone
                key={venue.id}
                venue={venue}
                bookedBand={getBookedBand(venue.id)}
                onBook={handleBook}
              />
            ))}
          </div>
        </div>

        {/* Turn Display */}
        <div className="fixed top-20 left-4 w-64 z-20 space-y-3">
          <TurnDisplay />
          <FactionDisplay />
        </div>

        {/* Stats Display */}
        <div 
          className="fixed bottom-4 right-4 bg-metal-900/90 rounded-lg p-3 text-sm"
          data-tutorial="resources"
        >
          <div className="flex gap-4">
            <div>
              <span className="text-metal-400">Money:</span>
              <span className="ml-1 font-bold">${gameStore.money}</span>
            </div>
            <div>
              <span className="text-metal-400">Rep:</span>
              <span className="ml-1 font-bold">{gameStore.reputation}</span>
            </div>
            <div>
              <span className="text-metal-400">Fans:</span>
              <span className="ml-1 font-bold">{gameStore.fans}</span>
            </div>
          </div>
        </div>

        {/* Bookings Summary */}
        {bookings.size > 0 && (
          <div className="fixed top-20 right-4 bg-metal-900/90 rounded-lg p-3 text-sm w-64">
            <h3 className="font-bold mb-2">Tonight's Shows</h3>
            {Array.from(bookings.values()).map(booking => (
              <div key={booking.venue.id} className="mb-2">
                <p className="font-bold">{booking.band.name}</p>
                <p className="text-xs text-metal-400">@ {booking.venue.name}</p>
              </div>
            ))}
            <button 
              onClick={handleRunShows}
              className="punk-button w-full mt-3 text-sm"
              data-tutorial="run-shows"
            >
              Run Shows
            </button>
          </div>
        )}
      </div>

      {/* Show Results Modal */}
      {showResults && (
        <ShowResultsModal
          results={showResults}
          onClose={handleResultsClose}
          onResourcesUpdate={handleResourcesUpdate}
        />
      )}
    </DragProvider>
  );
};
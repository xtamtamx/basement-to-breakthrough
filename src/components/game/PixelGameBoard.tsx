import React, { useState } from 'react';
import { Band, Venue } from '@game/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface PixelGameBoardProps {
  bands: Band[];
  venues: Venue[];
}

export const PixelGameBoard: React.FC<PixelGameBoardProps> = ({ bands, venues }) => {
  const [bandStack, setBandStack] = useState<Band[]>(bands);
  const [venueStack] = useState<Venue[]>(venues);
  const [matchedPairs, setMatchedPairs] = useState<{ band: Band; venue: Venue }[]>([]);
  const { addMoney, addReputation, addFans } = useGameStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Handle band to venue matching
    if (source.droppableId === 'bands' && destination.droppableId.startsWith('venue-')) {
      const bandIndex = source.index;
      const venueId = destination.droppableId.replace('venue-', '');
      const venue = venueStack.find(v => v.id === venueId);
      
      if (venue) {
        const band = bandStack[bandIndex];
        
        // Create match
        setMatchedPairs([...matchedPairs, { band, venue }]);
        setBandStack(bandStack.filter((_, i) => i !== bandIndex));
        
        // Play success sound and haptics
        audio.success();
        haptics.success();
        
        // Calculate rewards
        const baseReward = venue.capacity * 10;
        const popularityBonus = band.popularity * 5;
        const authenticityBonus = band.authenticity * 3;
        
        addMoney(baseReward + popularityBonus);
        addReputation(Math.floor(authenticityBonus / 10));
        addFans(Math.floor(venue.capacity * (band.popularity / 100)));
      }
    }
  };

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: 'var(--pixel-dark-purple)' }}>
      {/* Header */}
      <div className="pixel-panel-inset p-3">
        <h2 className="pixel-text pixel-text-lg pixel-text-shadow text-center" style={{ color: 'var(--pixel-yellow)' }}>
          DRAG BANDS TO VENUES
        </h2>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Band Stack */}
        <div className="pixel-panel p-3">
          <h3 className="pixel-text pixel-text-shadow mb-3" style={{ color: 'var(--pixel-cyan)' }}>
            AVAILABLE BANDS
          </h3>
          <Droppable droppableId="bands">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[100px]"
              >
                {bandStack.map((band, index) => (
                  <Draggable key={band.id} draggableId={band.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          pixel-card p-2
                          ${snapshot.isDragging ? 'pixel-shake' : ''}
                        `}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: 'var(--pixel-magenta)',
                          cursor: 'grab',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="pixel-text pixel-text-sm">🎸</span>
                          <div className="flex-1">
                            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
                              {band.name.toUpperCase()}
                            </p>
                            <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-yellow)' }}>
                              {band.genre} • POP: {band.popularity}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Venue Slots */}
        <div className="space-y-3">
          <h3 className="pixel-text pixel-text-shadow" style={{ color: 'var(--pixel-green)' }}>
            VENUES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {venueStack.map((venue) => {
              const match = matchedPairs.find(p => p.venue.id === venue.id);
              
              return (
                <Droppable key={venue.id} droppableId={`venue-${venue.id}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        pixel-panel p-3 min-h-[120px]
                        ${snapshot.isDraggingOver ? 'pixel-panel-raised' : ''}
                        ${match ? 'opacity-75' : ''}
                      `}
                      style={{
                        borderColor: snapshot.isDraggingOver ? 'var(--pixel-yellow)' : 'var(--pixel-black)',
                      }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xl">🏢</span>
                        <div className="flex-1">
                          <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
                            {venue.name.toUpperCase()}
                          </p>
                          <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}>
                            CAP: {venue.capacity} • ${venue.rent}
                          </p>
                        </div>
                      </div>
                      
                      {match && (
                        <div className="pixel-card mt-2 p-2" style={{ backgroundColor: 'var(--pixel-green)' }}>
                          <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-black)' }}>
                            ✓ {match.band.name.toUpperCase()}
                          </p>
                        </div>
                      )}
                      
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>

        {/* Matched Shows */}
        {matchedPairs.length > 0 && (
          <div className="pixel-panel-raised p-3">
            <h3 className="pixel-text pixel-text-shadow mb-3" style={{ color: 'var(--pixel-yellow)' }}>
              BOOKED SHOWS
            </h3>
            <div className="space-y-2">
              {matchedPairs.map((pair, index) => (
                <div key={index} className="pixel-card p-2" style={{ backgroundColor: 'var(--pixel-green)' }}>
                  <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-black)' }}>
                    {pair.band.name.toUpperCase()} @ {pair.venue.name.toUpperCase()}
                  </p>
                  <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-dark-gray)' }}>
                    CAPACITY: {pair.venue.capacity} • PROFIT: ${pair.venue.capacity * 10}
                  </p>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                // Execute all shows
                audio.coin();
                haptics.medium();
                setMatchedPairs([]);
              }}
              className="pixel-button pixel-button-green w-full mt-3"
            >
              EXECUTE SHOWS
            </button>
          </div>
        )}
      </DragDropContext>
    </div>
  );
};
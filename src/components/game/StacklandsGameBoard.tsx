import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Band, Venue, Show, GamePhase, Bill } from '@game/types';
import { StackableCard } from './StackableCard';
import { BillPreview } from './BillPreview';
import { SynergyPreview } from './SynergyPreview';
import { EventCard } from './EventCard';
import { ParticleEffect } from '@components/effects/ParticleEffect';
import { SynergyParticleEffect } from '@components/effects/SynergyParticleEffect';
import { useGameStore } from '@stores/gameStore';
import { billManager } from '@game/mechanics/BillManager';
import { synergyDiscoverySystem } from '@game/mechanics/SynergyDiscoverySystem';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';
import { eventCardSystem, EventCard as EventCardType } from '@game/mechanics/EventCardSystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface CardPosition {
  id: string;
  x: number;
  y: number;
  type: 'band' | 'venue';
  data: Band | Venue;
  stackId?: string; // ID of the card this is stacked on
}

interface CardStack {
  id: string;
  cards: string[]; // IDs of cards in the stack
}

interface StacklandsGameBoardProps {
  bands: Band[];
  venues: Venue[];
  onBookShow: (band: Band, venue: Venue) => void;
  onBookMultiBandShow?: (bands: Band[], venue: Venue) => void;
  phase: GamePhase;
  turn?: number;
  reputation?: number;
  onEventChoice?: (eventCard: EventCardType, choiceId: string) => void;
}

export const StacklandsGameBoard: React.FC<StacklandsGameBoardProps> = ({
  bands,
  venues,
  onBookShow,
  onBookMultiBandShow,
  phase,
  turn = 1,
  reputation = 0,
  onEventChoice,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(new Map());
  const [stacks, setStacks] = useState<Map<string, CardStack>>(new Map());
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [previewBill, setPreviewBill] = useState<{ bands: Band[], bill: Bill } | null>(null);
  const [particleEffects, setParticleEffects] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [synergyParticles, setSynergyParticles] = useState<{ id: number; x: number; y: number; type: 'common' | 'uncommon' | 'rare' | 'legendary'; icon: string }[]>([]);
  const [synergyPreview, setSynergyPreview] = useState<{
    sourceBand?: Band;
    targetBands?: Band[];
    targetVenue?: Venue;
    position: { x: number; y: number };
  } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeEventCards, setActiveEventCards] = useState<{ card: EventCardType; id: string; position: { x: number; y: number } }[]>([]);

  // Initialize card positions
  useEffect(() => {
    setCardPositions(prev => {
      const newPositions = new Map(prev);
      
      // Position bands on the left
      bands.forEach((band, index) => {
        if (!newPositions.has(band.id)) {
          newPositions.set(band.id, {
            id: band.id,
            x: 50 + (index % 3) * 220,
            y: 50 + Math.floor(index / 3) * 200,
            type: 'band',
            data: band,
          });
        }
      });
      
      // Position venues on the right
      venues.forEach((venue, index) => {
        if (!newPositions.has(venue.id)) {
          newPositions.set(venue.id, {
            id: venue.id,
            x: window.innerWidth - 450 + (index % 2) * 220,
            y: 50 + Math.floor(index / 2) * 200,
            type: 'venue',
            data: venue,
          });
        }
      });
      
      return newPositions;
    });
  }, [bands, venues]);
  
  // Spawn event cards periodically
  useEffect(() => {
    if (phase !== GamePhase.PLANNING) return;
    
    // Check for event cards every few turns
    if (turn > 1 && turn % 3 === 0) {
      const gameState = {
        turn,
        reputation,
        activeSynergies: synergyDiscoverySystem.getDiscoveredCombos().length,
        totalCards: bands.length + venues.length,
        sceneState: reputation > 70 ? 'mainstream' : 'underground'
      };
      
      const eventCard = eventCardSystem.drawEventCard(gameState);
      if (eventCard) {
        // Spawn event card at a random position
        const x = window.innerWidth / 2 - 100 + (Math.random() - 0.5) * 200;
        const y = 100 + Math.random() * 100;
        
        setActiveEventCards(prev => [...prev, {
          card: eventCard,
          id: `event-${Date.now()}`,
          position: { x, y }
        }]);
      }
    }
  }, [turn, phase, reputation, bands.length, venues.length]);
  
  // Cleanup throttle on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  const handleCardPositionChange = (cardId: string, position: { x: number; y: number }) => {
    setCardPositions(prev => {
      const newPositions = new Map(prev);
      const card = newPositions.get(cardId);
      if (card) {
        newPositions.set(cardId, { ...card, x: position.x, y: position.y });
      }
      return newPositions;
    });
  };

  const handleDragStart = (cardId: string) => {
    setDraggingCardId(cardId);
    
    // Clear previews
    setPreviewBill(null);
    setSynergyPreview(null);
    
    // Remove from any existing stack
    setStacks(prev => {
      const newStacks = new Map(prev);
      newStacks.forEach(stack => {
        stack.cards = stack.cards.filter(id => id !== cardId);
      });
      return newStacks;
    });
    
    setCardPositions(prev => {
      const newPositions = new Map(prev);
      const card = newPositions.get(cardId);
      if (card) {
        newPositions.set(cardId, { ...card, stackId: undefined });
      }
      return newPositions;
    });
  };

  // Throttle helper
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleDrag = useCallback((cardId: string, position: { x: number; y: number }) => {
    setDragPosition(position);
    
    // Throttle synergy preview updates
    if (throttleRef.current) return;
    
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null;
      
      const draggedCard = cardPositions.get(cardId);
      if (!draggedCard || draggedCard.type !== 'band') {
        setSynergyPreview(null);
        return;
      }
      
      // Find what we're hovering over
      let closestCard: { id: string; distance: number; card: CardPosition } | null = null;
      
      cardPositions.forEach((card, id) => {
        if (id === cardId) return;
        
        const dx = position.x - card.x;
        const dy = position.y - card.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          if (!closestCard || distance < closestCard.distance) {
            closestCard = { id, distance, card };
          }
        }
      });
      
      if (closestCard) {
        const sourceBand = draggedCard.data as Band;
        
        if (closestCard.card.type === 'venue') {
          // Hovering over venue - show synergy preview
          const targetVenue = closestCard.card.data as Venue;
          
          // Get bands already in venue stack if any
          const venueStack = stacks.get(closestCard.id);
          const targetBands: Band[] = [];
          
          if (venueStack) {
            venueStack.cards.forEach(cardId => {
              const card = cardPositions.get(cardId);
              if (card && card.type === 'band') {
                targetBands.push(card.data as Band);
              }
            });
          }
          
          setSynergyPreview({
            sourceBand,
            targetBands,
            targetVenue,
            position: { x: closestCard.card.x + 100, y: closestCard.card.y }
          });
        } else if (closestCard.card.type === 'band') {
          // Hovering over band - show potential bill synergies
          const targetBand = closestCard.card.data as Band;
          
          // Get all bands in the target stack
          const targetStack = stacks.get(closestCard.card.stackId || closestCard.id);
          const targetBands: Band[] = [targetBand];
          
          if (targetStack) {
            targetStack.cards.forEach(cardId => {
              const card = cardPositions.get(cardId);
              if (card && card.type === 'band' && card.id !== targetBand.id) {
                targetBands.push(card.data as Band);
              }
            });
          }
          
          setSynergyPreview({
            sourceBand,
            targetBands,
            position: { x: closestCard.card.x + 100, y: closestCard.card.y }
          });
        }
      } else {
        setSynergyPreview(null);
      }
    }, 50); // 50ms throttle
  }, [cardPositions, stacks]);

  const handleDragEnd = (cardId: string, position: { x: number; y: number }) => {
    setDraggingCardId(null);
    setSynergyPreview(null);
  };

  const handleStack = (sourceId: string, targetId: string) => {
    const sourceCard = cardPositions.get(sourceId);
    const targetCard = cardPositions.get(targetId);
    
    if (!sourceCard || !targetCard) return;
    
    // Check if this is a valid stack
    if (sourceCard.type === 'band' && targetCard.type === 'band') {
      // Band-to-band stacking (creating a bill)
      const sourceBand = sourceCard.data as Band;
      const targetBand = targetCard.data as Band;
      
      // Create or update stack
      setStacks(prev => {
        const newStacks = new Map(prev);
        
        // Check if target is already in a stack
        let stackId = targetId;
        let existingStack = newStacks.get(targetId);
        
        // If target band is already stacked on another card, add to that stack
        if (targetCard.stackId) {
          stackId = targetCard.stackId;
          existingStack = newStacks.get(stackId);
        }
        
        if (!existingStack) {
          existingStack = { id: stackId, cards: [] };
        }
        
        // Add source band to the stack
        if (!existingStack.cards.includes(targetId) && stackId === targetId) {
          existingStack.cards.push(targetId);
        }
        existingStack.cards.push(sourceId);
        newStacks.set(stackId, existingStack);
        
        // Calculate bill preview
        const stackedBands: Band[] = [];
        existingStack.cards.forEach(cardId => {
          const card = cardPositions.get(cardId);
          if (card && card.type === 'band') {
            stackedBands.push(card.data as Band);
          }
        });
        
        if (stackedBands.length >= 2) {
          const bill = billManager.analyzeBill(stackedBands);
          setPreviewBill({ bands: stackedBands, bill });
        }
        
        haptics.success();
        audio.play('cardDrop');
        
        // Add particle effect
        setParticleEffects(prev => [...prev, {
          id: Date.now(),
          x: targetCard.x + 100,
          y: targetCard.y + 50,
          color: 'var(--pixel-cyan)'
        }]);
        
        return newStacks;
      });
      
      // Update card position to stack on target
      setCardPositions(prev => {
        const newPositions = new Map(prev);
        const stackId = targetCard.stackId || targetId;
        
        // Get the stack to determine the offset
        const stack = stacks.get(stackId);
        const stackIndex = stack ? stack.cards.indexOf(sourceId) : 0;
        
        newPositions.set(sourceId, {
          ...sourceCard,
          x: targetCard.x,
          y: targetCard.y,
          stackId: stackId,
        });
        return newPositions;
      });
      
    } else if (sourceCard.type === 'band' && targetCard.type === 'venue') {
      // Band (or band stack) on venue
      const venue = targetCard.data as Venue;
      
      // Get all bands in the source stack
      const bandsToBook: Band[] = [];
      
      // Check if source is part of a stack
      const sourceStack = stacks.get(sourceCard.stackId || sourceId);
      if (sourceStack && sourceCard.stackId) {
        // Add all bands in the stack
        sourceStack.cards.forEach(cardId => {
          const card = cardPositions.get(cardId);
          if (card && card.type === 'band') {
            bandsToBook.push(card.data as Band);
          }
        });
      } else {
        // Just the single band
        bandsToBook.push(sourceCard.data as Band);
      }
      
      // Check if venue already has bands
      const existingStack = stacks.get(targetId);
      if (existingStack && existingStack.cards.length > 0) {
        haptics.error();
        audio.play('error');
        return;
      }
      
      // Create or update stack
      setStacks(prev => {
        const newStacks = new Map(prev);
        const venueStack = newStacks.get(targetId) || { id: targetId, cards: [] };
        
        // Add all bands to venue stack
        if (sourceCard.stackId) {
          const bandStack = newStacks.get(sourceCard.stackId);
          if (bandStack) {
            venueStack.cards.push(...bandStack.cards);
            // Remove the band stack
            newStacks.delete(sourceCard.stackId);
          }
        } else {
          venueStack.cards.push(sourceId);
        }
        
        newStacks.set(targetId, venueStack);
        return newStacks;
      });
      
      // Book the show with all bands (outside of setState)
      setTimeout(() => {
        // Check for potential synergies immediately
        const mockShow = {
          id: 'preview',
          bandId: bandsToBook[0].id,
          venueId: venue.id,
          date: new Date(),
          ticketPrice: 10,
          status: 'SCHEDULED' as const
        };
        
        const equipment = equipmentManagerV2.getVenueEquipment(venue.id);
        const potentialSynergies = synergyDiscoverySystem.checkPotentialSynergies(
          mockShow,
          bandsToBook,
          venue,
          equipment
        );
        
        // Show synergy particle effects if there are synergies
        if (potentialSynergies.length > 0) {
          // Get the highest rarity synergy for the effect
          const highestRarity = potentialSynergies.reduce((highest, synergy) => {
            const rarityOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
            return rarityOrder[synergy.rarity] > rarityOrder[highest.rarity] ? synergy : highest;
          }, potentialSynergies[0]);
          
          setSynergyParticles(prev => [...prev, {
            id: Date.now(),
            x: targetCard.x + 100,
            y: targetCard.y + 50,
            type: highestRarity.rarity,
            icon: highestRarity.icon
          }]);
          
          // Play enhanced sound for rare/legendary synergies
          if (highestRarity.rarity === 'legendary') {
            haptics.heavy();
            audio.play('achievement');
          } else if (highestRarity.rarity === 'rare') {
            haptics.medium();
            audio.play('success');
          }
        }
        
        if (bandsToBook.length === 1) {
          onBookShow(bandsToBook[0], venue);
        } else if (onBookMultiBandShow) {
          onBookMultiBandShow(bandsToBook, venue);
        } else {
          // Fallback to single band booking
          console.log('Multi-band booking not implemented, booking headliner only');
          onBookShow(bandsToBook[0], venue);
        }
        
        haptics.success();
        audio.play('cardDrop');
        
        // Add particle effect for venue booking
        setParticleEffects(prev => [...prev, {
          id: Date.now(),
          x: targetCard.x + 100,
          y: targetCard.y + 50,
          color: 'var(--pixel-green)'
        }]);
      }, 0);
      
      // Update all band positions to stack on venue
      if (sourceCard.stackId) {
        const bandStack = stacks.get(sourceCard.stackId);
        if (bandStack) {
          setCardPositions(prev => {
            const newPositions = new Map(prev);
            bandStack.cards.forEach((cardId, index) => {
              const card = newPositions.get(cardId);
              if (card) {
                newPositions.set(cardId, {
                  ...card,
                  x: targetCard.x,
                  y: targetCard.y,
                  stackId: targetId,
                });
              }
            });
            return newPositions;
          });
        }
      } else {
        setCardPositions(prev => {
          const newPositions = new Map(prev);
          newPositions.set(sourceId, {
            ...sourceCard,
            x: targetCard.x,
            y: targetCard.y,
            stackId: targetId,
          });
          return newPositions;
        });
      }
    } else {
      haptics.error();
    }
};

  const handleCardClick = (cardId: string, event: React.MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setSelectedCards(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(cardId)) {
          newSelected.delete(cardId);
        } else {
          newSelected.add(cardId);
        }
        return newSelected;
      });
      haptics.light();
    }
  };

  const getCardZIndex = (cardId: string): number => {
    const card = cardPositions.get(cardId);
    if (!card) return 1;
    
    if (draggingCardId === cardId) return 1000;
    if (card.stackId) {
      const stack = stacks.get(card.stackId);
      if (stack) {
        return 100 + stack.cards.indexOf(cardId);
      }
    }
    return card.type === 'venue' ? 10 : 20;
  };

  const getStackOffset = (cardId: string): number => {
    const card = cardPositions.get(cardId);
    if (!card || !card.stackId) return 0;
    
    const stack = stacks.get(card.stackId);
    if (stack) {
      return stack.cards.indexOf(cardId);
    }
    return 0;
  };

  return (
    <div 
      ref={boardRef}
      className="relative w-full h-screen overflow-hidden bg-gray-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
      }}
    >
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="glass-panel p-3">
          <p className="pixel-text pixel-text-sm text-center" style={{ color: 'var(--pixel-yellow)' }}>
            DRAG BANDS ONTO VENUES TO BOOK SHOWS
          </p>
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #444 0, #444 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #444 0, #444 1px, transparent 1px, transparent 40px)',
        }}
      />

      {/* Cards */}
      {Array.from(cardPositions.values()).map((card) => (
        <StackableCard
          key={card.id}
          id={card.id}
          type={card.type}
          data={card.data}
          initialPosition={{ x: card.x, y: card.y }}
          onPositionChange={handleCardPositionChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
          onStack={handleStack}
          isDragging={draggingCardId === card.id}
          isStacked={!!card.stackId}
          stackOffset={getStackOffset(card.id)}
          zIndex={getCardZIndex(card.id)}
          disabled={phase !== GamePhase.PLANNING}
        />
      ))}

      {/* Zone indicators */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <div className="glass-panel p-3 opacity-50">
          <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
            BANDS
          </p>
        </div>
      </div>
      
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="glass-panel p-3 opacity-50">
          <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
            VENUES
          </p>
        </div>
      </div>
      
      {/* Bill Preview */}
      <BillPreview
        bands={previewBill?.bands || []}
        bill={previewBill?.bill || { headliner: '', openers: [], dynamics: { chemistryScore: 0, dramaRisk: 0, crowdAppeal: 0, sceneAlignment: 0 } }}
        isVisible={!!previewBill}
      />
      
      {/* Synergy Preview */}
      <SynergyPreview
        sourceBand={synergyPreview?.sourceBand}
        targetBands={synergyPreview?.targetBands}
        targetVenue={synergyPreview?.targetVenue}
        isVisible={!!synergyPreview}
        position={synergyPreview?.position || { x: 0, y: 0 }}
      />
      
      {/* Particle Effects */}
      {particleEffects.map(effect => (
        <ParticleEffect
          key={effect.id}
          x={effect.x}
          y={effect.y}
          color={effect.color}
        />
      ))}
      
      {/* Synergy Particle Effects */}
      {synergyParticles.map(effect => (
        <SynergyParticleEffect
          key={effect.id}
          x={effect.x}
          y={effect.y}
          synergyType={effect.type}
          icon={effect.icon}
          onComplete={() => {
            setSynergyParticles(prev => prev.filter(p => p.id !== effect.id));
          }}
        />
      ))}
      
      {/* Event Cards */}
      {activeEventCards.map(event => (
        <EventCard
          key={event.id}
          card={event.card}
          initialPosition={event.position}
          onChoose={(choiceId) => {
            if (onEventChoice) {
              onEventChoice(event.card, choiceId);
            }
            // Remove the card after choice
            setActiveEventCards(prev => prev.filter(e => e.id !== event.id));
          }}
          onDismiss={() => {
            // Remove the card
            setActiveEventCards(prev => prev.filter(e => e.id !== event.id));
            haptics.light();
          }}
          disabled={phase !== GamePhase.PLANNING}
        />
      ))}
    </div>
  );
};
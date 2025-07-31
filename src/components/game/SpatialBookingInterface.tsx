import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Venue, GamePhase } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { PremiumBandCard } from './PremiumBandCard';
import { PremiumVenueNode } from './PremiumVenueNode';
import { SynergyRevealAnimation } from './SynergyRevealAnimation';
import { BookingErrorFeedback } from './BookingErrorFeedback';
import { PhaseTransition } from './PhaseTransition';
import { ChainReactionPreview } from './ChainReactionPreview';
import { ChainReactionVisualizer } from './ChainReactionVisualizer';
import { LineupWorkspace } from './LineupWorkspace';
import { FactionImpactDisplay } from './FactionImpactDisplay';
import { SynergyFloater } from './SynergyFloater';
import { billManager } from '@game/mechanics/BillManager';
import { synergyDiscoverySystem, SynergyCombo } from '@game/mechanics/SynergyDiscoverySystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface SpatialBookingInterfaceProps {
  bands: Band[];
  venues: Venue[];
  onBookShow: (bands: Band[], venue: Venue) => void;
  phase: GamePhase;
  turn: number;
}

interface DraggedBand {
  band: Band;
  origin: 'hand' | 'workspace' | 'venue';
  originId?: string;
}

interface LineupStack {
  id: string;
  bands: Band[];
  position: { x: number; y: number };
  synergies: SynergyCombo[];
}

interface BookedShow {
  venueId: string;
  lineup: Band[];
}

export const SpatialBookingInterface: React.FC<SpatialBookingInterfaceProps> = ({
  bands,
  venues,
  onBookShow,
  phase,
  turn
}) => {
  const { money } = useGameStore();
  const workspaceRef = useRef<HTMLDivElement>(null);
  
  // State
  const [bandHand, setBandHand] = useState<Band[]>(bands);
  const [lineupStacks, setLineupStacks] = useState<LineupStack[]>([]);
  const [bookedShows, setBookedShows] = useState<BookedShow[]>([]);
  const [draggedBand, setDraggedBand] = useState<DraggedBand | null>(null);
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [activeSynergies, setActiveSynergies] = useState<SynergyCombo[]>([]);
  const [factionImpact] = useState<{ factionId: string; impact: number } | null>(null);
  const [discoveredSynergies, setDiscoveredSynergies] = useState<SynergyCombo[]>([]);
  const [showSynergyReveal, setShowSynergyReveal] = useState<{ synergy: SynergyCombo; position: { x: number; y: number } } | null>(null);
  const [venuePositions, setVenuePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [bookingError, setBookingError] = useState<{ type: 'insufficient_funds' | 'venue_booked' | 'invalid_lineup' | 'capacity_exceeded'; message: string; position: { x: number; y: number } } | null>(null);
  const [previousPhase, setPreviousPhase] = useState<GamePhase | null>(null);
  const [previewLineup, setPreviewLineup] = useState<Band[]>([]);
  const [previewVenue, setPreviewVenue] = useState<Venue | null>(null);
  const [showChainReaction, setShowChainReaction] = useState<{ chain: unknown; position: { x: number; y: number } } | null>(null);
  
  // Update band hand when new bands arrive
  useEffect(() => {
    setBandHand(bands.filter(band => 
      !lineupStacks.some(stack => stack.bands.some(b => b.id === band.id)) &&
      !bookedShows.some(show => show.lineup.some(b => b.id === band.id))
    ));
  }, [bands, lineupStacks, bookedShows]);
  
  // Track phase changes
  useEffect(() => {
    if (phase !== previousPhase && previousPhase !== null) {
      setPreviousPhase(phase);
    }
  }, [phase, previousPhase]);
  
  // Store venue positions
  useEffect(() => {
    const positions = [
      { x: 60, y: 80 },   // Top left
      { x: 200, y: 60 },  // Top right
      { x: 40, y: 200 },  // Mid left
      { x: 220, y: 220 }, // Mid right
      { x: 80, y: 320 },  // Bottom left
      { x: 180, y: 340 }, // Bottom right
    ];
    
    const newPositions = new Map<string, { x: number; y: number }>();
    venues.forEach((venue, index) => {
      const pos = positions[index % positions.length];
      newPositions.set(venue.id, pos);
    });
    setVenuePositions(newPositions);
  }, [venues]);
  
  // Handle band drag start
  const handleBandDragStart = useCallback((band: Band, origin: 'hand' | 'workspace' | 'venue', originId?: string) => {
    setDraggedBand({ band, origin, originId });
    haptics.light();
    audio.play('pickup');
  }, []);
  
  // Handle band drop in workspace
  const handleWorkspaceDrop = useCallback((position: { x: number; y: number }) => {
    if (!draggedBand || !workspaceRef.current) return;
    
    const relativePosition = {
      x: position.x,
      y: position.y
    };
    
    // Check if dropping near existing stack
    const nearbyStack = lineupStacks.find(stack => {
      const distance = Math.sqrt(
        Math.pow(stack.position.x - relativePosition.x, 2) +
        Math.pow(stack.position.y - relativePosition.y, 2)
      );
      return distance < 100;
    });
    
    if (nearbyStack) {
      // Add to existing stack
      setLineupStacks(prev => prev.map(stack => 
        stack.id === nearbyStack.id
          ? { ...stack, bands: [...stack.bands, draggedBand.band] }
          : stack
      ));
    } else {
      // Create new stack
      const newStack: LineupStack = {
        id: `stack-${Date.now()}`,
        bands: [draggedBand.band],
        position: relativePosition,
        synergies: []
      };
      setLineupStacks(prev => [...prev, newStack]);
    }
    
    // Remove from origin
    if (draggedBand.origin === 'hand') {
      setBandHand(prev => prev.filter(b => b.id !== draggedBand.band.id));
    } else if (draggedBand.origin === 'workspace' && draggedBand.originId) {
      setLineupStacks(prev => prev.map(stack => 
        stack.id === draggedBand.originId
          ? { ...stack, bands: stack.bands.filter(b => b.id !== draggedBand.band.id) }
          : stack
      ).filter(stack => stack.bands.length > 0));
    }
    
    setDraggedBand(null);
    haptics.success();
    audio.play('drop');
  }, [draggedBand, lineupStacks]);
  
  // Handle lineup drop on venue
  const handleVenueBook = useCallback((venueId: string, lineup: Band[]) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;
    
    // Check if can afford
    if (money < venue.rent) {
      haptics.error();
      audio.play('error');
      
      // Find venue position from the positions array
      const venueIndex = venues.findIndex(v => v.id === venueId);
      const positions = [
        { x: 60, y: 80 },   // Top left
        { x: 200, y: 60 },  // Top right
        { x: 40, y: 200 },  // Mid left
        { x: 220, y: 220 }, // Mid right
        { x: 80, y: 320 },  // Bottom left
        { x: 180, y: 340 }, // Bottom right
      ];
      const venuePos = positions[venueIndex % positions.length];
      
      if (venuePos) {
        // Convert relative to absolute position
        const leftPanel = 300; // Width of left panel
        const absoluteX = leftPanel + venuePos.x;
        const absoluteY = venuePos.y + 50; // Offset for header
        
        setBookingError({
          type: 'insufficient_funds',
          message: `Need $${venue.rent - money} more`,
          position: { x: absoluteX, y: absoluteY }
        });
      }
      return;
    }
    
    // Check capacity
    const totalFans = lineup.reduce((sum, band) => sum + band.popularity * 10, 0);
    if (totalFans > venue.capacity * 2) {
      haptics.error();
      audio.play('error');
      
      // Find venue position from the positions array
      const venueIndex = venues.findIndex(v => v.id === venueId);
      const positions = [
        { x: 60, y: 80 },   // Top left
        { x: 200, y: 60 },  // Top right
        { x: 40, y: 200 },  // Mid left
        { x: 220, y: 220 }, // Mid right
        { x: 80, y: 320 },  // Bottom left
        { x: 180, y: 340 }, // Bottom right
      ];
      const venuePos = positions[venueIndex % positions.length];
      
      if (venuePos) {
        // Convert relative to absolute position
        const leftPanel = 300; // Width of left panel
        const absoluteX = leftPanel + venuePos.x;
        const absoluteY = venuePos.y + 50; // Offset for header
        
        setBookingError({
          type: 'capacity_exceeded',
          message: `${totalFans} fans > ${venue.capacity * 2} max`,
          position: { x: absoluteX, y: absoluteY }
        });
      }
      return;
    }
    
    // Check for synergies before booking
    const synergies = synergyDiscoverySystem.checkBandSynergies(lineup);
    const allSynergies = [...synergies];
    
    // Show synergy reveal for the highest rarity
    if (allSynergies.length > 0) {
      const highestSynergy = allSynergies.reduce((highest, synergy) => {
        const rarityOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
        return rarityOrder[synergy.rarity as keyof typeof rarityOrder] > rarityOrder[highest.rarity as keyof typeof rarityOrder] ? synergy : highest;
      }, allSynergies[0]);
      
      // Check if this is a new discovery
      const isNew = !discoveredSynergies.some(s => s.id === highestSynergy.id);
      if (isNew) {
        setDiscoveredSynergies(prev => [...prev, highestSynergy]);
      }
      
      // Show reveal animation
      const venuePos = venuePositions.get(venueId);
      if (venuePos) {
        setShowSynergyReveal({
          synergy: highestSynergy,
          position: venuePos
        });
      }
    }
    
    // Book the show
    onBookShow(lineup, venue);
    setBookedShows(prev => [...prev, { venueId, lineup }]);
    
    // Remove lineup from workspace
    setLineupStacks(prev => prev.filter(stack => 
      !lineup.every(band => stack.bands.some(b => b.id === band.id))
    ));
    
    haptics.heavy();
    audio.play('success');
  }, [venues, money, onBookShow, discoveredSynergies, venuePositions]);
  
  
  // Update preview when hovering venues with lineups
  const handleVenueHover = useCallback((venue: Venue | null, isHovered: boolean) => {
    if (isHovered && venue) {
      setPreviewVenue(venue);
      // Get the lineup being dragged or from workspace
      if (draggedBand) {
        setPreviewLineup([draggedBand.band]);
      } else {
        // Find the closest lineup stack
        const nearestStack = lineupStacks.find(stack => stack.bands.length > 0);
        if (nearestStack) {
          setPreviewLineup(nearestStack.bands);
        }
      }
    } else {
      setPreviewVenue(null);
      setPreviewLineup([]);
    }
    setHoveredVenue(isHovered ? venue?.id || null : null);
  }, [draggedBand, lineupStacks]);
  
  return (
    <div className="h-full w-full overflow-hidden">
      {/* Stable board container */}
      <div className="relative w-full h-full max-w-[1600px] max-h-[900px] mx-auto">
        
        {/* Main Layout Grid */}
        <div className="relative h-full grid grid-cols-[300px_1fr_280px] gap-4 p-4">
        
        {/* Left: Venue Map */}
        <div className="relative">
          <div className="punk-venue-card h-full p-4 border-2" style={{ borderColor: 'var(--punk-neon-purple)' }}>
            <h2 className="pixel-text pixel-text-sm mb-4 punk-neon-glow" style={{ color: 'var(--punk-neon-purple)' }}>
              UNDERGROUND VENUES
            </h2>
            
            <div className="relative h-full" style={{ minHeight: '400px' }}>
              {/* Venue nodes positioned spatially */}
              {venues.map((venue, index) => {
                const positions = [
                  { x: '60px', y: '80px' },   // Top left
                  { x: '200px', y: '60px' },  // Top right
                  { x: '40px', y: '200px' },  // Mid left
                  { x: '220px', y: '220px' }, // Mid right
                  { x: '80px', y: '320px' },  // Bottom left
                  { x: '180px', y: '340px' }, // Bottom right
                ];
                const pos = positions[index % positions.length];
                const isBooked = bookedShows.some(show => show.venueId === venue.id);
                
                return (
                  <PremiumVenueNode
                    key={venue.id}
                    venue={venue}
                    position={{ x: pos.x, y: pos.y }}
                    isBooked={isBooked}
                    isHovered={hoveredVenue === venue.id}
                    onDrop={(lineup) => handleVenueBook(venue.id, lineup)}
                    onHover={(isHovered) => handleVenueHover(venue, isHovered)}
                    isDragTarget={!!draggedBand}
                  />
                );
              })}
              
              {/* Connection lines between venues */}
              <svg className="absolute inset-0 pointer-events-none">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Draw connections based on district/scene */}
                <line
                  x1="60" y1="80"
                  x2="200" y2="60"
                  stroke="var(--pixel-cyan)"
                  strokeWidth="1"
                  opacity="0.3"
                  filter="url(#glow)"
                />
                <line
                  x1="40" y1="200"
                  x2="220" y2="220"
                  stroke="var(--pixel-magenta)"
                  strokeWidth="1"
                  opacity="0.3"
                  filter="url(#glow)"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Center: Lineup Workspace */}
        <div className="relative">
          <LineupWorkspace
            ref={workspaceRef}
            lineupStacks={lineupStacks}
            onDrop={handleWorkspaceDrop}
            onBandDragStart={handleBandDragStart}
            onStackUpdate={setLineupStacks}
            draggedBand={draggedBand}
          />
          
          {/* Faction Impact Display */}
          {factionImpact && (
            <FactionImpactDisplay
              impact={factionImpact}
              position={{ x: '50%', y: '10%' }}
            />
          )}
        </div>
        
        {/* Right: Band Hand */}
        <div className="relative">
          <div className="h-full p-4 overflow-hidden punk-venue-card" 
            style={{ 
              backgroundColor: 'var(--punk-void)',
              border: '2px solid var(--punk-neon-purple)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="pixel-text pixel-text-sm punk-neon-glow" style={{ color: 'var(--punk-neon-purple)' }}>
                BAND ROSTER
              </h2>
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                {bandHand.length} / {bands.length}
              </span>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-40px)] space-y-3" style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#4a4a4a #1a1a1a',
              padding: '4px' // Add padding for touch safety
            }}>
              <AnimatePresence mode="popLayout">
                {bandHand.map((band, index) => (
                  <motion.div
                    key={band.id}
                    layout
                    initial={{ opacity: 0, x: 50, rotate: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      rotate: 0,
                      transition: {
                        delay: index * 0.05,
                        type: 'spring',
                        stiffness: 300,
                        damping: 25
                      }
                    }}
                    exit={{ opacity: 0, x: -50, rotate: 10 }}
                    className="touch-target"
                    style={{ minHeight: '44px' }}
                  >
                    <PremiumBandCard
                      band={band}
                      onDragStart={() => handleBandDragStart(band, 'hand')}
                      isDragging={draggedBand?.band.id === band.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Synergy Floaters */}
      <AnimatePresence>
        {activeSynergies.map((synergy, index) => (
          <SynergyFloater
            key={`${synergy.id}-${index}`}
            synergy={synergy}
            position={synergy.position}
            onComplete={() => {
              setActiveSynergies(prev => prev.filter((_, i) => i !== index));
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Synergy Reveal Animation */}
      {showSynergyReveal && (
        <SynergyRevealAnimation
          synergy={showSynergyReveal.synergy}
          position={showSynergyReveal.position}
          onComplete={() => setShowSynergyReveal(null)}
          isNew={!discoveredSynergies.some(s => s.id === showSynergyReveal.synergy.id)}
        />
      )}
      
      {/* Booking Error Feedback */}
      <BookingErrorFeedback
        error={bookingError}
        onDismiss={() => setBookingError(null)}
      />
      
      {/* Phase Transition Animation */}
      <PhaseTransition
        currentPhase={phase}
        previousPhase={previousPhase}
        onComplete={() => setPreviousPhase(phase)}
      />
      
      {/* Chain Reaction Preview */}
      {previewLineup.length > 0 && previewVenue && (
        <div className="fixed bottom-24 right-4 z-50">
          <ChainReactionPreview
            bands={previewLineup}
            venue={previewVenue}
          />
        </div>
      )}
      
      {/* Chain Reaction Visualizer */}
      {showChainReaction && (
        <ChainReactionVisualizer
          chain={showChainReaction}
          onComplete={() => setShowChainReaction(null)}
        />
      )}
      
        {/* Phase Indicator */}
        {phase === GamePhase.PLANNING && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <motion.div 
              className="glass-panel px-6 py-2 border-2 border-yellow-500"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                BOOKING PHASE - TURN {turn}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
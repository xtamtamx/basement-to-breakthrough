import React, { useState, useEffect, useRef } from 'react';
import { Band, Venue, GamePhase, ShowResult, GameOver, VenueType } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { GameLayout } from './GameLayout';
import { GameHUD } from './GameHUD';
import { ModalManager } from './ModalManager';
import { SpatialBookingInterface } from './SpatialBookingInterface';
import { StacklandsGameBoard } from './StacklandsGameBoard';
import { EquipmentShopV2 } from './EquipmentShopV2';
import { VenueUpgradeShop } from './VenueUpgradeShop';
import { StressReliefModal } from './StressReliefModal';
import { AnimatedShowResults } from './AnimatedShowResults';
import { GameOverScreen } from './GameOverScreen';
import { StacklandsTutorial } from '../tutorial/StacklandsTutorial';
import { FactionEventModal } from './FactionEventModal';
import { RandomEventModal } from './RandomEventModal';
import { SynergyDiscoveryModal } from './SynergyDiscoveryModal';
import { SynergyCollectionModal } from './SynergyCollectionModal';
import { ChainReactionVisualizer } from './ChainReactionVisualizer';
import { SynergyMasteryPanel } from './SynergyMasteryPanel';
import { bandGenerator } from '@game/mechanics/BandGenerator';
import { venueUpgradeManager } from '@game/mechanics/VenueUpgradeManager';
import { randomEventManager } from '@game/mechanics/RandomEventManager';
import { showExecutor } from '@game/mechanics/ShowExecutor';
import { billManager } from '@game/mechanics/BillManager';
import { synergyDiscoverySystem } from '@game/mechanics/SynergyDiscoverySystem';
import { synergyChainSystem } from '@game/mechanics/SynergyChainSystem';
import { synergyMasterySystem } from '@game/mechanics/SynergyMasterySystem';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';
import { factionSystem, FactionEvent } from '@game/mechanics/FactionSystem';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';
import { audio } from '@utils/audio';
import { haptics } from '@utils/mobile';

// Clean UI implementation with proper layout management
export const StacklandsGameViewClean: React.FC = () => {
  const {
    money, reputation, connections, stress, fans,
    addMoney, addReputation, addConnections, addStress, addFans
  } = useGameStore();

  // Core game state
  const [currentTurn, setCurrentTurn] = useState(1);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PLANNING);
  const [availableBands, setAvailableBands] = useState<Band[]>([]);
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);
  const [bookedShows, setBookedShows] = useState<Map<string, { bands: Band[]; venue: Venue }>>(new Map());
  const [bookedBands, setBookedBands] = useState<Map<string, boolean>>(new Map());
  const [showResults, setShowResults] = useState<ShowResult[] | null>(null);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);
  const [totalStats, setTotalStats] = useState({ shows: 0, revenue: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // UI state
  const [isEquipmentShopOpen, setIsEquipmentShopOpen] = useState(false);
  const [selectedVenueForUpgrade, setSelectedVenueForUpgrade] = useState<Venue | null>(null);
  const [isStressReliefOpen, setIsStressReliefOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSynergyCollection, setShowSynergyCollection] = useState(false);
  const [showMasteryPanel, setShowMasteryPanel] = useState(false);
  const [synergyNotifications, setSynergyNotifications] = useState<any[]>([]);
  const [activeChainReaction, setActiveChainReaction] = useState<any>(null);

  // Event state
  const [currentFactionEvent, setCurrentFactionEvent] = useState<FactionEvent | null>(null);
  const [currentRandomEvent, setCurrentRandomEvent] = useState<any>(null);

  // Initialize game
  useEffect(() => {
    setAvailableBands(bandGenerator.generateBands(6, currentTurn));
    
    // Initialize venues
    const initialVenues: Venue[] = [
      {
        id: 'basement-1',
        name: "Jake's Basement",
        type: VenueType.BASEMENT,
        capacity: 30,
        acoustics: 40,
        authenticity: 95,
        atmosphere: 85,
        modifiers: [],
        location: { id: 'suburbs', name: 'Suburbs', sceneStrength: 60, gentrificationLevel: 10, policePresence: 5, rentMultiplier: 0.8 },
        rent: 0,
        equipment: [],
        allowsAllAges: true,
        hasBar: false,
        hasSecurity: false,
        isPermanent: false,
        bookingDifficulty: 2,
      },
      {
        id: 'dive-1',
        name: "The Rusty Nail",
        type: VenueType.DIVE_BAR,
        capacity: 100,
        acoustics: 50,
        authenticity: 75,
        atmosphere: 80,
        modifiers: [],
        location: { id: 'downtown', name: 'Downtown', sceneStrength: 70, gentrificationLevel: 30, policePresence: 20, rentMultiplier: 1 },
        rent: 150,
        equipment: [],
        allowsAllAges: false,
        hasBar: true,
        hasSecurity: true,
        isPermanent: true,
        bookingDifficulty: 3,
      },
    ];
    setAvailableVenues(initialVenues);
    
    const hasSeenTutorial = localStorage.getItem('stacklands_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  // Handle booking shows
  const handleBookShow = (bands: Band[], venue: Venue) => {
    if (bands.length === 0) return;

    // Check if bands are already booked
    for (const band of bands) {
      if (bookedBands.has(band.id)) {
        haptics.error();
        return;
      }
    }

    // Check if venue is already booked
    if (bookedShows.has(venue.id)) {
      haptics.error();
      return;
    }

    // Book the show
    setBookedShows(prev => new Map(prev).set(venue.id, { bands, venue }));
    bands.forEach(band => setBookedBands(prev => new Map(prev).set(band.id, true)));
    
    haptics.success();
    audio.play('book_show');
  };

  // Execute shows
  const executeShows = async () => {
    if (isProcessing || bookedShows.size === 0) return;
    
    setIsProcessing(true);
    const results: ShowResult[] = [];

    for (const [venueId, booking] of bookedShows) {
      const { bands, venue } = booking;
      
      // Simulate show
      const result = await showExecutor.executeShow({ id: `show-${venueId}`, bands: bands.map(b => b.id), venueId, turn: currentTurn }, bands[0], venue, {
        reputation,
        turn: currentTurn,
        equipment: equipmentManagerV2.getActiveEquipment(),
        factionStandings: factionSystem.getAllStandings()
      });

      // Process synergies and chains
      const activeSynergies = synergyDiscoverySystem.checkShowSynergies(bands, venue);
      let modifiedResult = { ...result };

      if (activeSynergies.length > 0) {
        activeSynergies.forEach(synergy => {
          synergyMasterySystem.recordSynergyUse(synergy.id, synergy.effects.scoreMultiplier || 1);
          modifiedResult = synergyDiscoverySystem.applySynergyEffects(synergy, modifiedResult);
        });

        // Check for chain reactions
        const chainContext = {
          bands,
          venue,
          turn: currentTurn,
          gameState: { money, reputation, connections, stress, fans }
        };

        const chain = synergyChainSystem.checkForChainReaction(activeSynergies, chainContext);
        if (chain) {
          setActiveChainReaction(chain);
          modifiedResult = synergyChainSystem.applyChainEffects(chain, modifiedResult);
        }
      }

      // Create display result
      const displayResult: ShowResult = {
        bandNames: bands.map(b => b.name),
        venueName: venue.name,
        metrics: {
          attendance: modifiedResult.attendance,
          revenue: modifiedResult.revenue,
          reputationChange: modifiedResult.reputationChange,
          profit: modifiedResult.revenue - venue.rent,
        },
        isSuccess: modifiedResult.success,
        synergies: activeSynergies.map(s => s.name),
      };

      results.push(displayResult);

      // Update resources
      addMoney(modifiedResult.revenue - venue.rent);
      addReputation(modifiedResult.reputationChange);
      addFans(modifiedResult.attendance);
      
      if (modifiedResult.success) {
        addConnections(Math.floor(Math.random() * 3) + 1);
      }
      
      const stressChange = Math.floor(Math.random() * 10) + 5 + (modifiedResult.stressChange || 0);
      addStress(Math.max(0, stressChange));

      // Update total stats
      setTotalStats(prev => ({
        shows: prev.shows + 1,
        revenue: prev.revenue + modifiedResult.revenue
      }));
    }

    // Show results
    setShowResults(results);
    setBookedShows(new Map());
    setBookedBands(new Map());
    
    // Process turn
    const maintenanceCost = equipmentManagerV2.getMaintenanceCosts();
    if (maintenanceCost > 0) {
      addMoney(-maintenanceCost);
    }

    // Check for random events
    if (Math.random() < 0.3) {
      const event = randomEventManager.generateEvent({ turn: currentTurn, reputation, stress });
      if (event) {
        setCurrentRandomEvent(event);
      }
    }

    // Check for faction events
    const factionEvent = factionSystem.checkForEvents();
    if (factionEvent) {
      setCurrentFactionEvent(factionEvent);
    }

    setIsProcessing(false);
    setPhase(GamePhase.RESOLUTION);
  };

  // Start next turn
  const startNextTurn = () => {
    setCurrentTurn(prev => prev + 1);
    setPhase(GamePhase.PLANNING);
    setShowResults(null);
    
    // Generate new bands
    setAvailableBands(bandGenerator.generateBands(6, currentTurn + 1));
    
    // Update available venues based on reputation
    // TODO: Add more venues as reputation grows
  };

  // Check game over conditions
  useEffect(() => {
    if (money < -1000) {
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
    } else if (reputation <= 0) {
      setGameOver({
        reason: 'reputation_loss',
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

  // Active modal determination
  const activeModal = (() => {
    if (showResults) {
      return (
        <AnimatedShowResults
          results={showResults}
          onClose={() => {
            setShowResults(null);
            startNextTurn();
          }}
        />
      );
    }
    if (gameOver) {
      return (
        <GameOverScreen
          reason={gameOver.reason}
          stats={gameOver.stats}
          onRestart={() => {
            window.location.reload();
          }}
          onMainMenu={() => {
            window.location.reload();
          }}
        />
      );
    }
    if (currentFactionEvent) {
      return (
        <FactionEventModal
          event={currentFactionEvent}
          onChoice={(choice) => {
            factionSystem.applyEventChoice(currentFactionEvent, choice);
            setCurrentFactionEvent(null);
          }}
        />
      );
    }
    if (currentRandomEvent) {
      return (
        <RandomEventModal
          event={currentRandomEvent}
          onChoice={(choiceId) => {
            const gameState = { money, reputation, connections, stress, fans };
            const result = randomEventManager.applyEventChoice(currentRandomEvent, choiceId, gameState);
            
            if (result.success) {
              result.effects.forEach(effect => {
                switch (effect.type) {
                  case 'money':
                    addMoney(effect.value as number);
                    break;
                  case 'reputation':
                    addReputation(effect.value as number);
                    break;
                  case 'stress':
                    addStress(effect.value as number);
                    break;
                  case 'connections':
                    addConnections(effect.value as number);
                    break;
                }
              });
            }
            
            setCurrentRandomEvent(null);
          }}
        />
      );
    }
    if (isEquipmentShopOpen) {
      return <EquipmentShopV2 isOpen={true} onClose={() => setIsEquipmentShopOpen(false)} />;
    }
    if (selectedVenueForUpgrade) {
      return (
        <VenueUpgradeShop
          isOpen={true}
          onClose={() => setSelectedVenueForUpgrade(null)}
          venue={selectedVenueForUpgrade}
        />
      );
    }
    if (isStressReliefOpen) {
      return <StressReliefModal isOpen={true} onClose={() => setIsStressReliefOpen(false)} />;
    }
    if (showTutorial) {
      return <StacklandsTutorial onComplete={() => setShowTutorial(false)} />;
    }
    if (synergyNotifications.length > 0) {
      return (
        <SynergyDiscoveryModal
          notifications={synergyNotifications}
          onClose={() => setSynergyNotifications([])}
        />
      );
    }
    if (showSynergyCollection) {
      return (
        <SynergyCollectionModal
          isOpen={true}
          onClose={() => setShowSynergyCollection(false)}
        />
      );
    }
    if (activeChainReaction) {
      return (
        <ChainReactionVisualizer
          chain={activeChainReaction}
          onComplete={() => setActiveChainReaction(null)}
        />
      );
    }
    if (showMasteryPanel) {
      return (
        <SynergyMasteryPanel
          isOpen={true}
          onClose={() => setShowMasteryPanel(false)}
        />
      );
    }
    return null;
  })();

  return (
    <GameLayout
      hud={
        <GameHUD
          currentTurn={currentTurn}
          phase={phase}
          onEquipmentShop={() => setIsEquipmentShopOpen(true)}
          onStressRelief={() => setIsStressReliefOpen(true)}
          onSynergyCollection={() => setShowSynergyCollection(true)}
          onMasteryPanel={() => setShowMasteryPanel(true)}
          onExecuteShows={phase === GamePhase.PLANNING ? executeShows : undefined}
          canExecute={bookedShows.size > 0 && !isProcessing}
        />
      }
      modals={<ModalManager>{activeModal}</ModalManager>}
    >
      {/* Game Board */}
      {phase === GamePhase.PLANNING ? (
        <SpatialBookingInterface
          bands={availableBands}
          venues={availableVenues}
          onBookShow={handleBookShow}
          phase={phase}
          turn={currentTurn}
        />
      ) : (
        <StacklandsGameBoard
          bands={availableBands}
          bookedBands={bookedBands}
          onBookBand={(bandId) => setBookedBands(prev => new Map(prev).set(bandId, true))}
          onUnbookBand={(bandId) => setBookedBands(prev => {
            const next = new Map(prev);
            next.delete(bandId);
            return next;
          })}
        />
      )}
    </GameLayout>
  );
};
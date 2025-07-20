import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Venue, Show, GamePhase, VenueType } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { StacklandsGameBoard } from './StacklandsGameBoard';
import { AnimatedShowResults } from './AnimatedShowResults';
import { GameOverScreen } from './GameOverScreen';
import { FactionDisplay } from './FactionDisplay';
import { FactionEventModal } from './FactionEventModal';
import { RandomEventModal } from './RandomEventModal';
import { EquipmentShopV2 } from './EquipmentShopV2';
import { VenueUpgradeShop } from './VenueUpgradeShop';
import { StressReliefModal } from './StressReliefModal';
import { StacklandsTutorial } from '@components/tutorial/StacklandsTutorial';
import { SynergyDiscoveryModal } from './SynergyDiscoveryModal';
import { SynergyCollectionModal } from './SynergyCollectionModal';
import { bandGenerator } from '@game/mechanics/BandGenerator';
import { showExecutor } from '@game/mechanics/ShowExecutor';
import { bookingSystem } from '@game/mechanics/BookingSystem';
import { factionSystem } from '@game/mechanics/FactionSystem';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';
import { venueUpgradeManager } from '@game/mechanics/VenueUpgradeManager';
import { billManager } from '@game/mechanics/BillManager';
import { saveManager } from '@game/mechanics/SaveManager';
import { runManager } from '@game/mechanics/RunManager';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';
import { randomEventManager, RandomEvent } from '@game/mechanics/RandomEventManager';
import { synergyDiscoverySystem } from '@game/mechanics/SynergyDiscoverySystem';
import { eventCardSystem } from '@game/mechanics/EventCardSystem';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export const StacklandsGameView: React.FC = () => {
  // Game state
  const [availableBands, setAvailableBands] = useState<Band[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookedShows, setBookedShows] = useState<Map<string, Show>>(new Map());
  const [showResults, setShowResults] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [gameOver, setGameOver] = useState<{ reason: 'bankruptcy' | 'victory' | 'scene_collapse', stats: any } | null>(null);
  const [totalStats, setTotalStats] = useState({ shows: 0, revenue: 0 });
  const [isEquipmentShopOpen, setIsEquipmentShopOpen] = useState(false);
  const [selectedVenueForUpgrade, setSelectedVenueForUpgrade] = useState<Venue | null>(null);
  const [isStressReliefOpen, setIsStressReliefOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem('stacklands-tutorial-completed'));
  const [currentRandomEvent, setCurrentRandomEvent] = useState<RandomEvent | null>(null);
  const [synergyNotifications, setSynergyNotifications] = useState<any[]>([]);
  const [showSynergyCollection, setShowSynergyCollection] = useState(false);
  
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

  // Save game function
  const saveGame = () => {
    const success = saveManager.saveGame(
      currentTurn,
      { money, reputation, connections, stress, fans },
      availableBands,
      venues,
      bookedShows,
      bookedBands,
      totalStats
    );
    
    if (success) {
      haptics.success();
      console.log('Game saved!');
    } else {
      haptics.error();
      console.error('Failed to save game');
    }
  };

  // Load game function
  const loadGame = () => {
    const saveData = saveManager.loadGame();
    if (saveData) {
      // Restore game state
      setCurrentTurn(saveData.gameState.currentTurn);
      setAvailableBands(saveData.gameState.availableBands);
      setVenues(saveData.gameState.venues);
      setBookedShows(new Map(saveData.gameState.bookedShows));
      setBookedBands(new Map(saveData.gameState.bookedBands));
      setTotalStats(saveData.gameState.totalStats);
      
      // Restore resources through store
      const resources = saveData.gameState.resources;
      useGameStore.setState({
        money: resources.money,
        reputation: resources.reputation,
        connections: resources.connections,
        stress: resources.stress,
        fans: resources.fans
      });
      
      haptics.success();
      console.log('Game loaded!');
    } else {
      haptics.error();
      console.error('No save found');
    }
  };

  // Auto-save after each turn
  useEffect(() => {
    if (phase === GamePhase.PLANNING && currentTurn > 1) {
      saveManager.autoSave(
        currentTurn,
        { money, reputation, connections, stress, fans },
        availableBands,
        venues,
        bookedShows,
        bookedBands,
        totalStats
      );
    }
  }, [phase, currentTurn]);

  // Initialize game
  useEffect(() => {
    if (availableBands.length === 0) {
      // Generate initial bands
      const newBands = bandGenerator.generateBands(6, 1);
      setAvailableBands(newBands);
      
      // Create initial venues
      const initialVenues: Venue[] = [
        {
          id: 'basement-1',
          name: "Joey's Basement",
          type: VenueType.BASEMENT,
          capacity: 30,
          acoustics: 20,
          authenticity: 90,
          atmosphere: 60,
          modifiers: [],
          location: { id: 'downtown', name: 'Downtown', sceneStrength: 70, gentrificationLevel: 30, policePresence: 20, rentMultiplier: 1 },
          rent: 0,
          equipment: [],
          allowsAllAges: true,
          hasBar: false,
          hasSecurity: false,
          isPermanent: true,
          bookingDifficulty: 1,
        },
        {
          id: 'garage-1',
          name: "Abandoned Garage",
          type: VenueType.GARAGE,
          capacity: 50,
          acoustics: 30,
          authenticity: 85,
          atmosphere: 70,
          modifiers: [],
          location: { id: 'downtown', name: 'Downtown', sceneStrength: 70, gentrificationLevel: 30, policePresence: 20, rentMultiplier: 1 },
          rent: 50,
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
      setVenues(initialVenues);
      
      setPhase(GamePhase.PLANNING);
    }
  }, []);

  // Track booked bands separately
  const [bookedBands, setBookedBands] = useState<Map<string, Band>>(new Map());

  // Handle booking a show
  const handleBookShow = (band: Band, venue: Venue) => {
    if (bookedShows.has(venue.id)) {
      haptics.error();
      return;
    }
    
    const canBook = bookingSystem.canBook(band, venue, { 
      resources: { money, reputation, connections, stress, fans },
      id: 'current',
      turn: currentTurn,
      phase: phase,
      bookedShows: [],
      availableBands: [],
      sceneReputation: { overall: reputation, factions: [], relationships: [] },
      unlockedContent: [],
      achievements: [],
      settings: {} as any
    } as GameState);
    if (canBook.valid) {
      const basePrice = venue.type === VenueType.BASEMENT ? 5 :
                       venue.type === VenueType.GARAGE ? 8 :
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
      setBookedShows(new Map(bookedShows.set(venue.id, show)));
      setBookedBands(new Map(bookedBands.set(band.id, band)));
      setAvailableBands(availableBands.filter(b => b.id !== band.id));
      
      // Deduct booking cost
      if (venue.rent > 0) {
        addMoney(-venue.rent);
      }
      
      // Feedback
      haptics.success();
      audio.play('cardDrop');
    } else {
      haptics.error();
      console.log('Cannot book:', canBook.reason);
    }
  };

  // Handle booking a multi-band show
  const handleBookMultiBandShow = (bands: Band[], venue: Venue) => {
    if (bookedShows.has(venue.id)) {
      haptics.error();
      return;
    }
    
    // Check if we can afford the venue
    const canAfford = money >= venue.rent;
    if (!canAfford) {
      haptics.error();
      console.log('Cannot afford venue');
      return;
    }
    
    // Analyze the bill
    const bill = billManager.analyzeBill(bands);
    
    // Calculate combined ticket price
    const headliner = bands.find(b => b.id === bill.headliner);
    if (!headliner) {
      haptics.error();
      console.error('Could not find headliner in bands');
      return;
    }
    const basePrice = venue.type === VenueType.BASEMENT ? 5 :
                     venue.type === VenueType.GARAGE ? 8 :
                     venue.type === VenueType.DIVE_BAR ? 10 : 15;
    const popularityMultiplier = 1 + (headliner.popularity / 150); // Slightly higher for multi-band
    
    const show: Show = {
      id: `show-${Date.now()}`,
      bandId: bill.headliner, // Primary band is headliner
      venueId: venue.id,
      date: new Date(),
      ticketPrice: Math.floor(basePrice * popularityMultiplier * 1.2), // 20% premium for multi-band
      status: 'SCHEDULED',
      bill: bill,
    };
    
    // Update state
    setBookedShows(new Map(bookedShows.set(venue.id, show)));
    
    // Store all bands
    bands.forEach(band => {
      setBookedBands(new Map(bookedBands.set(band.id, band)));
    });
    
    // Remove bands from available
    setAvailableBands(availableBands.filter(b => !bands.some(bb => bb.id === b.id)));
    
    // Deduct booking cost
    if (venue.rent > 0) {
      addMoney(-venue.rent);
    }
    
    // Feedback
    haptics.success();
    audio.play('success');
    
    console.log('Booked multi-band show:', {
      venue: venue.name,
      headliner: headliner.name,
      openers: bill.openers.map(id => bands.find(b => b.id === id)?.name),
      dynamics: bill.dynamics
    });
  };

  // Execute all shows
  const executeShows = async () => {
    if (bookedShows.size === 0) return;

    setPhase(GamePhase.PERFORMANCE);
    
    const results = [];
    
    for (const [venueId, show] of bookedShows) {
      const band = bookedBands.get(show.bandId);
      const venue = venues.find(v => v.id === venueId);
      
      if (band && venue) {
        // Check for synergies before executing show
        const bandsInShow = show.bill ? 
          show.bill.openers.concat(show.bill.headliner).map(id => bookedBands.get(id)).filter(Boolean) as Band[] :
          [band];
        
        const equipment = equipmentManagerV2.getVenueEquipment(venue.id);
        const discoveries = synergyDiscoverySystem.checkForSynergies(show, bandsInShow, venue, equipment);
        
        // Store discoveries to show after all shows
        if (discoveries.length > 0) {
          setSynergyNotifications(prev => [...prev, ...discoveries]);
        }
        
        const result = await showExecutor.executeShow(show, band, venue, {
          reputation,
          factionStandings: {},
        });
        
        // Apply synergy effects to results
        const activeSynergies = discoveries.map(d => d.combo);
        const modifiedResult = synergyDiscoverySystem.applySynergyEffects(result, activeSynergies);
        
        // Get show outcome details
        const incidents = modifiedResult.incidentOccurred ? [{
          type: 'GENERIC',
          description: 'Something happened during the show',
          effects: {}
        }] : [];
        
        // Check for bill-related drama
        if (show.bill) {
          const drama = billManager.checkForDrama(show.bill.dynamics);
          if (drama.occurred && drama.description) {
            incidents.push({
              type: 'BAND_DRAMA',
              description: drama.description,
              effects: { reputationChange: -5, stressIncrease: 15 }
            });
          }
          
          // Apply bill modifiers to results
          const attendanceModifier = billManager.getBillAttendanceModifier(show.bill.dynamics);
          const reputationModifier = billManager.getBillReputationModifier(show.bill.dynamics);
          
          modifiedResult.attendance = Math.floor(modifiedResult.attendance * attendanceModifier);
          modifiedResult.reputationChange = Math.floor(modifiedResult.reputationChange * reputationModifier);
        }
        
        const displayResult = {
          venueName: venue.name,
          bandName: band.name,
          attendance: modifiedResult.attendance,
          capacity: venue.capacity,
          reputationChange: modifiedResult.reputationChange,
          incidents: incidents.map(i => typeof i === 'string' ? i : i.description),
          financials: {
            revenue: modifiedResult.revenue,
            costs: venue.rent,
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
        
        // Gain connections from successful shows
        if (modifiedResult.success) {
          addConnections(Math.floor(Math.random() * 3) + 1);
        }
        
        // Add stress from show (handle stress reduction from synergies)
        const baseStress = Math.floor(Math.random() * 10) + 5;
        const stressChange = baseStress + (modifiedResult.stressChange || 0);
        addStress(Math.max(0, stressChange));
        
        // Handle unlocks from synergies
        if (modifiedResult.unlocks) {
          modifiedResult.unlocks.forEach(unlock => {
            metaProgressionManager.unlockContent(unlock);
          });
        }
        
        // Update total stats
        setTotalStats(prev => ({
          shows: prev.shows + 1,
          revenue: prev.revenue + modifiedResult.revenue
        }));
      }
    }
    
    // Show results
    setShowResults(results);
    
    // Clear bookings
    setBookedShows(new Map());
    setBookedBands(new Map());
    
    // Process turn-based systems
    const maintenanceCost = equipmentManagerV2.getMaintenanceCosts();
    if (maintenanceCost > 0) {
      addMoney(-maintenanceCost);
    }
    
    const completedUpgrades = venueUpgradeManager.processTurn();
    if (completedUpgrades.length > 0) {
      venues.forEach(venue => {
        const effects = venueUpgradeManager.getVenueUpgradeEffects(venue.id);
        venue.capacity += effects.capacityIncrease;
        venue.acoustics = Math.min(100, venue.acoustics + effects.acousticsIncrease);
        venue.atmosphere = Math.min(100, venue.atmosphere + effects.atmosphereIncrease);
      });
      setVenues([...venues]);
    }
    
    // Generate new bands for next turn
    const newBands = bandGenerator.generateBands(3, currentTurn);
    setAvailableBands([...availableBands, ...newBands]);
    
    // Advance turn
    setCurrentTurn(currentTurn + 1);
    setPhase(GamePhase.PLANNING);
    
    // Update run manager
    runManager.advanceTurn();
    runManager.updateRunStats({
      totalShows: results.length,
      totalRevenue: results.reduce((sum, r) => sum + r.revenue, 0),
      totalFans: results.reduce((sum, r) => sum + r.attendance, 0),
      peakReputation: reputation,
      bandsManaged: bookedBands.size,
      venuesPlayed: new Set(Array.from(bookedShows.values()).map(s => s.venueId)).size,
      billsCreated: results.filter(r => r.bill).length,
      perfectShows: results.filter(r => r.isSuccess && r.incidents.length === 0).length,
      disasters: results.filter(r => !r.isSuccess).length
    });
    
    // Check run end conditions
    const currentRun = runManager.getCurrentRun();
    if (currentRun) {
      const shouldEnd = runManager.shouldEndRun({ 
        money, 
        reputation, 
        fans,
        connections,
        stress 
      });
      
      if (shouldEnd.shouldEnd) {
        // End the run
        const runResult = runManager.endRun({ 
          money, 
          reputation, 
          fans,
          connections,
          stress 
        });
        
        // Update meta progression
        metaProgressionManager.updateStats(runResult.stats);
        metaProgressionManager.addAchievements(runResult.achievements);
        
        // Calculate and add fame
        const fameEarned = metaProgressionManager.calculateFameEarned(
          runResult.score, 
          currentRun.config.id
        );
        metaProgressionManager.addCurrency(fameEarned);
        
        // Show run end screen
        setGameOver({
          reason: runResult.success ? 'victory' : 'bankruptcy',
          stats: {
            turnsPlayed: currentTurn,
            totalShows: runResult.stats.totalShows,
            totalRevenue: runResult.stats.totalRevenue,
            finalReputation: reputation,
            finalFans: fans,
            score: runResult.score,
            fameEarned,
            newHighScore: runResult.newHighScore,
            achievements: runResult.achievements,
            unlocks: runResult.unlocks
          }
        });
        
        setPhase(GamePhase.GAME_OVER);
        return;
      }
    }
    
    haptics.heavy();
    audio.play('success');
  };

  // Check for faction events
  useEffect(() => {
    if (phase === GamePhase.PLANNING && currentTurn > 1) {
      const events = factionSystem.getPendingEvents();
      if (events.length > 0 && !currentFactionEvent) {
        setFactionEvent(events[0]);
      }
    }
  }, [currentTurn, phase, currentFactionEvent, setFactionEvent]);
  
  // Check for random events
  useEffect(() => {
    if (phase === GamePhase.PLANNING && currentTurn > 1 && !currentFactionEvent && !currentRandomEvent) {
      const gameState = {
        turn: currentTurn,
        money,
        reputation,
        stress,
        connections,
        fans
      };
      
      const event = randomEventManager.checkForEvents(gameState);
      if (event) {
        setCurrentRandomEvent(event);
        haptics.heavy();
        audio.play('notification');
      }
    }
  }, [currentTurn, phase, money, reputation, stress, connections, fans, currentFactionEvent]);

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
    <div className="relative min-h-screen">
      {/* HUD Overlay */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4">
        <div className="glass-panel p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                TURN {currentTurn}
              </p>
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                {phase.replace('_', ' ')}
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                  ${money}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  MONEY
                </p>
              </div>
              <div>
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-magenta)' }}>
                  {reputation}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  REP
                </p>
              </div>
              <div>
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                  {connections}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  CONN
                </p>
              </div>
              <div>
                <button
                  onClick={() => setIsStressReliefOpen(true)}
                  className="hover:scale-105 transition-transform"
                  style={{ 
                    color: stress > 70 ? 'var(--pixel-red)' : 
                           stress > 40 ? 'var(--pixel-orange)' : 
                           'var(--pixel-green)' 
                  }}
                >
                  <p className="pixel-text pixel-text-sm">
                    {stress}%
                  </p>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    STRESS
                  </p>
                </button>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIsEquipmentShopOpen(true)}
              className="flex-1 pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-blue)' }}
            >
              <span className="pixel-text pixel-text-xs">🔧 EQUIPMENT</span>
            </button>
            <button
              onClick={() => {
                // Open venue selection modal
                haptics.light();
                audio.play('click');
                // For now, cycle through venues
                const currentIndex = selectedVenueForUpgrade ? 
                  venues.findIndex(v => v.id === selectedVenueForUpgrade.id) : -1;
                const nextIndex = (currentIndex + 1) % venues.length;
                setSelectedVenueForUpgrade(venues[nextIndex]);
              }}
              className="flex-1 pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-purple)' }}
            >
              <span className="pixel-text pixel-text-xs">🏗️ UPGRADES</span>
            </button>
            <button
              onClick={() => {
                setShowSynergyCollection(true);
                haptics.light();
                audio.play('click');
              }}
              className="flex-1 pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-cyan)' }}
            >
              <span className="pixel-text pixel-text-xs">⚡ SYNERGIES</span>
            </button>
          </div>
          
        </div>
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

      {/* Faction Display */}
      <div className="fixed bottom-4 left-4 z-40">
        <FactionDisplay />
      </div>

      {/* Game Board */}
      <StacklandsGameBoard
        bands={availableBands}
        venues={venues}
        onBookShow={handleBookShow}
        onBookMultiBandShow={handleBookMultiBandShow}
        phase={phase}
        turn={currentTurn}
        reputation={reputation}
        onEventChoice={(eventCard, choiceId) => {
          const gameState = {
            turn: currentTurn,
            money,
            reputation,
            stress,
            connections,
            fans
          };
          
          const result = eventCardSystem.applyEventChoice(eventCard, choiceId, gameState);
          
          // Apply resource changes
          if (result.resourceChanges.money) addMoney(result.resourceChanges.money);
          if (result.resourceChanges.reputation) addReputation(result.resourceChanges.reputation);
          if (result.resourceChanges.stress) addStress(result.resourceChanges.stress);
          if (result.resourceChanges.connections) addConnections(result.resourceChanges.connections);
          
          // Apply card modifications (simplified for now)
          if (result.modifiedCards.length > 0) {
            result.modifiedCards.forEach(mod => {
              if (mod.target === 'all_bands') {
                setAvailableBands(bands => bands.map(band => ({
                  ...band,
                  ...mod.modifications
                })));
              }
            });
          }
          
          haptics.success();
          audio.play('success');
        }}
      />

      {/* Show Results Modal */}
      <AnimatePresence>
        {showResults && (
          <AnimatedShowResults
            results={showResults}
            onClose={() => setShowResults(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Game Over Screen */}
      {gameOver && (
        <GameOverScreen
          reason={gameOver.reason}
          stats={gameOver.stats}
          onRestart={() => {
            setGameOver(null);
            setCurrentTurn(1);
            setAvailableBands(bandGenerator.generateBands(6, 1));
            setBookedShows(new Map());
            setTotalStats({ shows: 0, revenue: 0 });
            useGameStore.getState().resetGame();
            setPhase(GamePhase.PLANNING);
          }}
          onMainMenu={() => {
            window.location.reload();
          }}
        />
      )}
      
      {/* Faction Event Modal */}
      <FactionEventModal
        event={currentFactionEvent}
        onChoice={applyFactionChoice}
      />
      
      {/* Random Event Modal */}
      <RandomEventModal
        event={currentRandomEvent}
        onChoice={(choiceId) => {
          if (!currentRandomEvent) return;
          
          const gameState = { money, reputation, connections, stress, fans };
          const result = randomEventManager.applyEventChoice(currentRandomEvent, choiceId, gameState);
          
          if (result.success) {
            // Apply effects
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
                case 'band_stat':
                  // Apply to bands based on target
                  if (effect.target === 'all') {
                    setAvailableBands(bands => bands.map(band => ({
                      ...band,
                      popularity: band.popularity + (effect.value as number)
                    })));
                  } else if (effect.target === 'random') {
                    const randomBand = availableBands[Math.floor(Math.random() * availableBands.length)];
                    if (randomBand) {
                      setAvailableBands(bands => bands.map(band => 
                        band.id === randomBand.id 
                          ? { ...band, popularity: band.popularity + (effect.value as number) }
                          : band
                      ));
                    }
                  }
                  break;
              }
            });
            
            haptics.success();
            audio.play('success');
          } else {
            haptics.error();
            audio.play('error');
          }
          
          setCurrentRandomEvent(null);
        }}
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
      
      {/* Stress Relief Modal */}
      <StressReliefModal
        isOpen={isStressReliefOpen}
        onClose={() => setIsStressReliefOpen(false)}
      />
      
      {/* Tutorial */}
      {showTutorial && (
        <StacklandsTutorial
          onComplete={() => setShowTutorial(false)}
        />
      )}
      
      {/* Synergy Discovery Modal */}
      {synergyNotifications.length > 0 && (
        <SynergyDiscoveryModal
          notifications={synergyNotifications}
          onClose={() => setSynergyNotifications([])}
        />
      )}
      
      {/* Synergy Collection Modal */}
      <SynergyCollectionModal
        isOpen={showSynergyCollection}
        onClose={() => setShowSynergyCollection(false)}
      />
    </div>
  );
};
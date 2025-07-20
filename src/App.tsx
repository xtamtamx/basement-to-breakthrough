import { useState } from 'react';
import { motion } from 'framer-motion';
import { MobileLayout, MobileHeader, NavItem } from '@components/ui';
import { BandCard, VenueList } from '@components/game';
import { UnifiedGameView } from '@components/game/UnifiedGameView';
import { StacklandsGameView } from '@components/game/StacklandsGameView';
import { MainMenu } from '@components/menu/MainMenu';
import { SimpleHybridLayout } from '@components/layouts';
import { Band, Venue, Genre, VenueType, TraitType } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { PerformanceDisplay } from '@components/debug/PerformanceDisplay';
import { SettingsModal } from '@components/ui/SettingsModal';
import { SimpleTutorial } from '@components/tutorial/SimpleTutorial';
import { RunConfig, runManager } from '@game/mechanics/RunManager';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

// Demo data
const demoBands: Band[] = [
  {
    id: '1',
    name: 'Basement Dwellers',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['hardcore punk', 'noise'],
    popularity: 15,
    authenticity: 95,
    energy: 85,
    technicalSkill: 60,
    traits: [
      { id: 't1', name: 'DIY Ethics', description: 'True to the scene', type: TraitType.PERSONALITY, modifier: { authenticity: 10 } },
      { id: 't2', name: 'Chaotic Live Shows', description: 'Unpredictable energy', type: TraitType.PERFORMANCE, modifier: { popularity: 5 } },
    ],
    technicalRequirements: [],
    hometown: 'Portland, OR',
    formedYear: 2021,
  },
  {
    id: '2',
    name: 'Death Magnetic',
    isRealArtist: true,
    artistId: 'real-1',
    genre: Genre.METAL,
    subgenres: ['doom', 'sludge'],
    popularity: 45,
    authenticity: 75,
    energy: 70,
    technicalSkill: 85,
    traits: [
      { id: 't3', name: 'Technical Masters', description: 'Incredible musicianship', type: TraitType.TECHNICAL, modifier: { popularity: 10 } },
      { id: 't4', name: 'Scene Veterans', description: '10+ years in the game', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    bio: 'Crushing riffs and existential dread since 2013.',
    hometown: 'Seattle, WA',
    socialMedia: {
      spotify: 'https://spotify.com',
      bandcamp: 'https://bandcamp.com',
    },
  },
  {
    id: '3',
    name: 'Riot Grrrl Revival',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['riot grrrl', 'feminist punk'],
    popularity: 35,
    authenticity: 90,
    energy: 95,
    technicalSkill: 50,
    traits: [
      { id: 't5', name: 'Political Message', description: 'Strong social commentary', type: TraitType.PERSONALITY, modifier: { authenticity: 15 } },
      { id: 't6', name: 'All Ages Champion', description: 'Supports young fans', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Olympia, WA',
    formedYear: 2022,
  },
  {
    id: '4',
    name: 'Blackened Skies',
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ['black metal', 'atmospheric'],
    popularity: 25,
    authenticity: 85,
    energy: 60,
    technicalSkill: 90,
    traits: [
      { id: 't7', name: 'Corpse Paint', description: 'Traditional black metal aesthetic', type: TraitType.PERFORMANCE, modifier: { energy: 10 } },
      { id: 't8', name: 'Underground Legends', description: 'Never sold out', type: TraitType.SOCIAL, modifier: { authenticity: 20 } },
    ],
    technicalRequirements: [],
    hometown: 'Oslo, Norway',
    formedYear: 2019,
  },
  {
    id: '5',
    name: 'The Mosh Pit Kids',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['hardcore', 'youth crew'],
    popularity: 55,
    authenticity: 70,
    energy: 100,
    technicalSkill: 65,
    traits: [
      { id: 't9', name: 'Circle Pit Masters', description: 'Gets the crowd moving', type: TraitType.PERFORMANCE, modifier: { energy: 15 } },
      { id: 't10', name: 'Straight Edge', description: 'No drugs or alcohol', type: TraitType.PERSONALITY, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Boston, MA',
    formedYear: 2020,
  },
];

const demoVenues: Venue[] = [
  {
    id: 'v1',
    name: "Jake's Basement",
    type: VenueType.BASEMENT,
    capacity: 30,
    acoustics: 45,
    authenticity: 100,
    atmosphere: 85,
    modifiers: [],
    location: { id: 'dist1', name: 'Eastside', sceneStrength: 80, gentrificationLevel: 30, policePresence: 20, rentMultiplier: 1 },
    rent: 0,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 2,
  },
  {
    id: 'v2',
    name: 'The Broken Bottle',
    type: VenueType.DIVE_BAR,
    capacity: 80,
    acoustics: 60,
    authenticity: 75,
    atmosphere: 70,
    modifiers: [],
    location: { id: 'dist2', name: 'Downtown', sceneStrength: 60, gentrificationLevel: 70, policePresence: 50, rentMultiplier: 1.5 },
    rent: 150,
    equipment: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    isPermanent: true,
    bookingDifficulty: 4,
  },
  {
    id: 'v3',
    name: 'Warehouse 23',
    type: VenueType.WAREHOUSE,
    capacity: 150,
    acoustics: 50,
    authenticity: 90,
    atmosphere: 95,
    modifiers: [],
    location: { id: 'dist3', name: 'Industrial', sceneStrength: 70, gentrificationLevel: 20, policePresence: 60, rentMultiplier: 0.8 },
    rent: 300,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: false,
    bookingDifficulty: 6,
  },
  {
    id: 'v4',
    name: 'The Underground',
    type: VenueType.UNDERGROUND,
    capacity: 200,
    acoustics: 70,
    authenticity: 85,
    atmosphere: 80,
    modifiers: [],
    location: { id: 'dist2', name: 'Downtown', sceneStrength: 60, gentrificationLevel: 70, policePresence: 50, rentMultiplier: 1.5 },
    rent: 400,
    equipment: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    isPermanent: true,
    bookingDifficulty: 8,
  },
];

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem('tutorialCompleted'));
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRun, setCurrentRun] = useState<RunConfig | null>(null);
  const [showMainMenu, setShowMainMenu] = useState(true);
  
  const { money, reputation, fans, resetGame } = useGameStore();
  
  const handleStartGame = (runConfig?: RunConfig) => {
    if (runConfig) {
      // Start a new run with selected config
      const run = runManager.startRun(runConfig.id);
      setCurrentRun(runConfig);
      
      // Apply meta progression bonuses
      const bonuses = metaProgressionManager.getRunStartBonuses();
      const store = useGameStore.getState();
      
      // Set starting resources with bonuses
      store.addMoney(-store.money + runConfig.startingMoney + bonuses.startingMoney);
      store.addReputation(-store.reputation + runConfig.startingReputation + bonuses.startingReputation);
      store.addConnections(-store.connections + runConfig.startingConnections);
    } else {
      // Quick play - use classic run
      const classicConfig = runManager.getRunConfigs().find(r => r.id === 'classic');
      if (classicConfig) {
        handleStartGame(classicConfig);
        return;
      }
    }
    
    setShowMainMenu(false);
    setGameStarted(true);
    haptics.success();
    audio.play('success');
  };

  if (showMainMenu) {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  return (
    <SimpleHybridLayout>
      <PerformanceDisplay show={!import.meta.env.PROD} />
      <MobileLayout
        header={
          <MobileHeader
            title={currentRun ? currentRun.name : "Basement to Breakthrough"}
            subtitle={
              <div className="flex gap-3 justify-center">
                <span style={{ color: 'var(--pixel-yellow)' }}>${money}</span>
                <span style={{ color: 'var(--pixel-magenta)' }}>{reputation} REP</span>
                <span style={{ color: 'var(--pixel-cyan)' }}>{fans} FANS</span>
                {currentRun && (
                  <span style={{ color: 'var(--pixel-orange)' }}>
                    TURN {runManager.getCurrentRun()?.currentTurn || 1}/{currentRun.maxTurns}
                  </span>
                )}
              </div>
            }
            rightAction={
              <button 
                onClick={() => setShowSettings(true)}
                className="touch-target text-metal-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            }
          />
        }
      bottomNav={null}
    >
      <StacklandsGameView />
    </MobileLayout>
    
    {/* Settings Modal */}
    <SettingsModal
      isOpen={showSettings}
      onClose={() => setShowSettings(false)}
    />
    
    {/* Tutorial */}
    {showTutorial && gameStarted && (
      <SimpleTutorial
        onComplete={() => setShowTutorial(false)}
      />
    )}
    </SimpleHybridLayout>
  );
}

export default App;
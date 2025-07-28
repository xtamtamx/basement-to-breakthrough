import { useState } from 'react';
import { MainGameView } from '@components/game/MainGameView';
import { PixelArtMainMenu } from '@components/game/PixelArtMainMenu';
import { useGameStore } from '@stores/gameStore';
import { SettingsModal } from '@components/ui/SettingsModal';
import { SimpleTutorial } from '@components/tutorial/SimpleTutorial';
import { RunConfig, runManager } from '@game/mechanics/RunManager';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';
import { dayJobSystem } from '@game/mechanics/DayJobSystem';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem('tutorialCompleted'));
  const [gameStarted, setGameStarted] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  
  const handleStartGame = (runConfig?: RunConfig) => {
    if (runConfig) {
      // Start a new run with selected config
      runManager.startRun(runConfig.id);
      
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
    
    // Initialize job system
    dayJobSystem.refreshJobs();
    
    setShowMainMenu(false);
    setGameStarted(true);
    haptics.success();
    audio.play('success');
  };

  if (showMainMenu) {
    const hasSavedGame = localStorage.getItem('gameStore') !== null;
    return (
      <PixelArtMainMenu 
        onStartGame={() => handleStartGame()} 
        onContinueGame={hasSavedGame ? () => {
          setShowMainMenu(false);
          setGameStarted(true);
          haptics.success();
        } : undefined}
        hasSavedGame={hasSavedGame}
      />
    );
  }

  return (
    <>
      <MainGameView />
    
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
    </>
  );
}

export default App;
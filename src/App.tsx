import { useState } from "react";
import { MainGameView } from "@components/game/MainGameView";
import { PixelArtMainMenu } from "@components/game/PixelArtMainMenu";
import { useGameStore } from "@stores/gameStore";
import { SettingsModal } from "@components/ui/SettingsModal";
import { TutorialOverlay } from "@components/tutorial/TutorialOverlay";
import { RunConfig, runManager } from "@game/mechanics/RunManager";
import { metaProgressionManager } from "@game/mechanics/MetaProgressionManager";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";
import { dayJobSystem } from "@game/mechanics/DayJobSystem";
import { safeStorage } from "@utils/safeStorage";
import { AppErrorBoundary } from "@components/ErrorBoundary";
import { ColorblindProvider } from "@contexts/ColorblindContext";
import { ColorblindMode } from "@game/types";
import { SaveLoadTest } from "@components/SaveLoadTest";
import { AudioMemoryTest } from "@components/AudioMemoryTest";
import { LazyLoadTest } from "@components/LazyLoadTest";
import { PerformanceMetricsView } from "@components/PerformanceMetricsView";
import { PerformanceTest } from "@components/PerformanceTest";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showSaveLoadTest, setShowSaveLoadTest] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [showLazyLoadTest, setShowLazyLoadTest] = useState(false);
  const [showPerfMetrics, setShowPerfMetrics] = useState(false);
  const [showPerfTest, setShowPerfTest] = useState(false);
  
  // Load colorblind mode from storage
  const savedColorblindMode = safeStorage.getItem("colorblind-mode") as ColorblindMode || ColorblindMode.OFF;
  
  // Check for test modes in URL
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test');
  if (testMode === 'saveload' && !showSaveLoadTest) {
    setShowSaveLoadTest(true);
  } else if (testMode === 'audio' && !showAudioTest) {
    setShowAudioTest(true);
  } else if (testMode === 'lazy' && !showLazyLoadTest) {
    setShowLazyLoadTest(true);
  } else if (testMode === 'metrics' && !showPerfMetrics) {
    setShowPerfMetrics(true);
  } else if (testMode === 'perf' && !showPerfTest) {
    setShowPerfTest(true);
  }

  const handleStartGame = (runConfig?: RunConfig) => {
    if (runConfig) {
      // Start a new run with selected config
      runManager.startRun(runConfig.id);

      // Apply meta progression bonuses
      const bonuses = metaProgressionManager.getRunStartBonuses();
      const store = useGameStore.getState();

      // Set starting resources with bonuses
      store.addMoney(
        -store.money + runConfig.startingMoney + bonuses.startingMoney,
      );
      store.addReputation(
        -store.reputation +
          runConfig.startingReputation +
          bonuses.startingReputation,
      );
      store.addConnections(-store.connections + runConfig.startingConnections);
    } else {
      // Quick play - use classic run
      const classicConfig = runManager
        .getRunConfigs()
        .find((r) => r.id === "classic");
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
    audio.play("success");
  };

  // Show save/load test if requested
  if (showSaveLoadTest) {
    return <SaveLoadTest />;
  }
  
  // Show audio test if requested
  if (showAudioTest) {
    return <AudioMemoryTest />;
  }
  
  // Show lazy load test if requested
  if (showLazyLoadTest) {
    return <LazyLoadTest />;
  }
  
  // Show performance metrics if requested
  if (showPerfMetrics) {
    return <PerformanceMetricsView />;
  }
  
  // Show performance test if requested
  if (showPerfTest) {
    return <PerformanceTest />;
  }

  if (showMainMenu) {
    const hasSavedGame =
      safeStorage.getItem("diy-indie-empire-storage") !== null;
    return (
      <ColorblindProvider initialMode={savedColorblindMode}>
        <AppErrorBoundary>
          <PixelArtMainMenu
            onStartGame={() => handleStartGame()}
            onContinueGame={
              hasSavedGame
                ? () => {
                    setShowMainMenu(false);
                    setGameStarted(true);
                    haptics.success();
                  }
                : undefined
            }
            onSettings={() => setShowSettings(true)}
            hasSavedGame={hasSavedGame}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </AppErrorBoundary>
      </ColorblindProvider>
    );
  }

  return (
    <ColorblindProvider initialMode={savedColorblindMode}>
      <AppErrorBoundary>
        <MainGameView />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Tutorial */}
        {gameStarted && <TutorialOverlay />}
      </AppErrorBoundary>
    </ColorblindProvider>
  );
}

export default App;

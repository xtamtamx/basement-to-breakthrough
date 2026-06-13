import { useState } from "react";
import { MainGameView } from "@components/game/MainGameView";
import { PixelArtMainMenu } from "@components/game/PixelArtMainMenu";
import { useGameStore } from "@stores/gameStore";
import { SettingsModal } from "@components/ui/SettingsModal";
import { TutorialOverlay } from "@components/tutorial/TutorialOverlay";
import { RunConfig } from "@game/mechanics/RunManager";
import { startNewRun } from "@game/mechanics/runLifecycle";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";
import { safeStorage } from "@utils/safeStorage";
import { AppErrorBoundary } from "@components/ErrorBoundary/AppErrorBoundary";
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

  const handleStartGame = async (runConfig?: RunConfig) => {
    // One canonical start path (config resources + meta bonuses + fresh
    // engine/store) — shared with the run-end screen's "Play Again"
    await startNewRun(runConfig?.id ?? "classic");

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
                ? async () => {
                    const store = useGameStore.getState();
                    await store.loadInitialGameData();
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
        <MainGameView
          onExitToMenu={() => {
            setGameStarted(false);
            setShowMainMenu(true);
          }}
        />

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

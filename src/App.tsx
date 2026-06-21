import { useState } from "react";
import { MainGameView } from "@components/game/MainGameView";
import { PixelArtMainMenu } from "@components/game/PixelArtMainMenu";
import { RunModeSelector } from "@components/game/RunModeSelector";
import { MetaProgressionShop } from "@components/game/MetaProgressionShop";
import { useGameStore } from "@stores/gameStore";
import { GamePhase } from "@game/types";
import { SettingsModal } from "@components/ui/SettingsModal";
import { TutorialOverlay } from "@components/tutorial/TutorialOverlay";
import { tutorialManager } from "@game/tutorial/TutorialManager";
import { RunConfig } from "@game/mechanics/RunManager";
import { startNewRun } from "@game/mechanics/runLifecycle";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";
import { safeStorage } from "@utils/safeStorage";
import { AppErrorBoundary } from "@components/ErrorBoundary/AppErrorBoundary";
import { ColorblindProvider } from "@contexts/ColorblindContext";
import { ColorblindMode } from "@game/types";
import { AudioMemoryTest } from "@components/AudioMemoryTest";
import { LazyLoadTest } from "@components/LazyLoadTest";
import { PerformanceMetricsView } from "@components/PerformanceMetricsView";
import { PerformanceTest } from "@components/PerformanceTest";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showRunModePicker, setShowRunModePicker] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [showLazyLoadTest, setShowLazyLoadTest] = useState(false);
  const [showPerfMetrics, setShowPerfMetrics] = useState(false);
  const [showPerfTest, setShowPerfTest] = useState(false);
  
  // Load colorblind mode from storage
  const savedColorblindMode = safeStorage.getItem("colorblind-mode") as ColorblindMode || ColorblindMode.OFF;
  
  // Check for test modes in URL
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test');
  if (testMode === 'audio' && !showAudioTest) {
    setShowAudioTest(true);
  } else if (testMode === 'lazy' && !showLazyLoadTest) {
    setShowLazyLoadTest(true);
  } else if (testMode === 'metrics' && !showPerfMetrics) {
    setShowPerfMetrics(true);
  } else if (testMode === 'perf' && !showPerfTest) {
    setShowPerfTest(true);
  }

  const handleStartGame = async (runConfig?: RunConfig, stakeTier = 0) => {
    // One canonical start path (config resources + meta bonuses + fresh
    // engine/store) — shared with the run-end screen's "Play Again"
    await startNewRun(runConfig?.id ?? "classic", stakeTier);

    setShowMainMenu(false);
    setGameStarted(true);
    // Brand-new players get the interactive walkthrough (gated on real actions);
    // it no-ops once they've finished or skipped it. Continue does NOT trigger it.
    tutorialManager.maybeStartForNewGame();
    haptics.success();
    audio.play("success");
  };

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
    // Offer Continue only for an IN-PROGRESS run: a finished (GAME_OVER) run
    // must not be resumable, or Continue drops the player onto a dead board
    // with no end screen.
    const hasSavedGame =
      safeStorage.getItem("diy-indie-empire-storage") !== null &&
      useGameStore.getState().phase !== GamePhase.GAME_OVER;
    return (
      <ColorblindProvider initialMode={savedColorblindMode}>
        <AppErrorBoundary>
          <PixelArtMainMenu
            onStartGame={() => setShowRunModePicker(true)}
            onContinueGame={
              hasSavedGame
                ? async () => {
                    const store = useGameStore.getState();
                    // The persisted store already holds the run's bands/venues/
                    // roster (rehydrated by zustand persist). Only seed defaults
                    // if nothing was restored — otherwise we'd clobber the
                    // resumed roster with a fresh one.
                    if (store.venues.length === 0) {
                      await store.loadInitialGameData();
                    }
                    setShowMainMenu(false);
                    setGameStarted(true);
                    haptics.success();
                  }
                : undefined
            }
            onSettings={() => setShowSettings(true)}
            onUpgrades={() => setShowUpgrades(true)}
            hasSavedGame={hasSavedGame}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />

          {/* Meta-progression fame shop */}
          {showUpgrades && (
            <MetaProgressionShop onClose={() => setShowUpgrades(false)} />
          )}

          {/* Run mode picker — choose a mode, then start (NEW GAME → here → run) */}
          {showRunModePicker && (
            <RunModeSelector
              onSelect={(config, stakeTier) => {
                setShowRunModePicker(false);
                handleStartGame(config, stakeTier);
              }}
              onClose={() => setShowRunModePicker(false)}
            />
          )}
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

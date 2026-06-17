import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CityView } from "./views/CityView";
import { BandsView } from "./views/BandsView";
import { ShowBuilderView } from "./views/ShowBuilderView";
import { SynergyView } from "./views/SynergyView";
import { DayJobView } from "./views/DayJobView";
import { PromotionView } from "./views/PromotionView";
import { ProgressionView } from "./views/ProgressionView";
import { TourView } from "./views/TourView";
import { MobileBottomNav } from "./MobileBottomNav";
import { TurnResultsModal } from "@components/ui/TurnResultsModal";
import { SettingsModal } from "@components/ui/SettingsModal";
import { SaveLoadModal } from "@components/ui/SaveLoadModal";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { turnResolutionEngine, TurnResult, RunCeremony } from "@game/mechanics/TurnResolutionEngine";
import { startNewRun } from "@game/mechanics/runLifecycle";
import { runManager } from "@game/mechanics/RunManager";
import { RunEndScreen } from "./RunEndScreen";
import { RunEndState } from "@game/constants/runConstants";
import { gameAudio } from "@utils/gameAudio";
import { GameErrorBoundary } from "@components/ErrorBoundary";
import { saveGameManager } from "@game/persistence/SaveGameManager";
import { Settings, Save } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { QuickStartGuide } from './QuickStartGuide';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression" | "tour";

interface MainGameViewProps {
  onExitToMenu?: () => void;
}

const EMPTY_TURN_RESULT: TurnResult = {
  showResults: [],
  totalUpkeep: 0,
  turn: 0,
  isEscalation: false,
  warnings: [],
  runEnd: null,
  ceremony: null,
  synergyEffects: [],
};

export const MainGameView: React.FC<MainGameViewProps> = ({ onExitToMenu }) => {
  const [currentView, setCurrentView] = useState<ViewType>("city");
  const [showTurnResults, setShowTurnResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [runEnd, setRunEnd] = useState<RunEndState | null>(null);
  const [ceremony, setCeremony] = useState<RunCeremony | null>(null);
  const [turnResults, setTurnResults] = useState<TurnResult>(EMPTY_TURN_RESULT);
  // Re-entrancy guard: blocks a same-tick double-tap (and taps while the
  // results modal is up) from resolving the same turn twice.
  const resolvingRef = useRef(false);

  const { money, reputation, fans, stress } = useGameStore();

  // Start background music + auto-save (the new-game intro is QuickStartGuide;
  // the element-highlight TutorialOverlay is launched on demand from Settings).
  useEffect(() => {
    gameAudio.startBackgroundMusic("chill");

    // Initialize save manager and start auto-save
    saveGameManager.initialize().then(() => {
      saveGameManager.startAutoSave(5); // Auto-save every 5 minutes
    });

    return () => {
      gameAudio.stopBackgroundMusic();
      saveGameManager.stopAutoSave();
    };
  }, []);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    haptics.light();
  };

  const handleNextTurn = async () => {
    if (resolvingRef.current) return; // ignore re-entrant taps
    resolvingRef.current = true;
    const results = await turnResolutionEngine.executeFullTurn();
    setTurnResults(results);
    setShowTurnResults(true);
    haptics.success();
  };

  // The run-end screen appears once the player closes the final turn's results
  const handleTurnResultsClose = () => {
    setShowTurnResults(false);
    resolvingRef.current = false; // ready for the next turn
    if (turnResults.runEnd) {
      setRunEnd(turnResults.runEnd);
      setCeremony(turnResults.ceremony);
    }
  };

  // Same path as the main menu's start — config resources + meta bonuses
  const handlePlayAgain = async () => {
    await startNewRun();
    setRunEnd(null);
    setCeremony(null);
    setTurnResults(EMPTY_TURN_RESULT);
    setCurrentView("city");
    haptics.success();
  };

  const handleMainMenu = () => {
    setRunEnd(null);
    setCeremony(null);
    // Drop the active run without scoring it, and clear its persisted runtime
    // so a later "Continue" doesn't resume a run the player abandoned.
    runManager.abandonRun();
    useGameStore.setState({ runtimeSnapshot: null });
    onExitToMenu?.();
  };

  // Swipe navigation
  const viewOrder: ViewType[] = ["city", "bands", "shows", "promotion", "jobs", "synergies", "progression", "tour"];
  const currentIndex = viewOrder.indexOf(currentView);
  
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < viewOrder.length - 1) {
        handleViewChange(viewOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        handleViewChange(viewOrder[currentIndex - 1]);
      }
    },
    trackMouse: false
  });

  const views = {
    city: CityView,
    bands: BandsView,
    shows: ShowBuilderView,
    promotion: PromotionView,
    jobs: DayJobView,
    synergies: SynergyView,
    progression: ProgressionView,
    tour: TourView,
  };

  const CurrentViewComponent = views[currentView];

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0814' }}>
      {/* Ultra-Compact Header — neon-punk SNES HUD */}
      <header
        className="snes-bar snes-bar--top flex-shrink-0"
        style={{ padding: '7px 10px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Resources */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="snes-chip"><span style={{ color: '#3ad17e' }}>$</span><span>{money}</span></span>
            <span className="snes-chip"><span style={{ color: '#ffd23f' }}>★</span><span>{reputation}</span></span>
            <span className="snes-chip"><span style={{ color: '#c77dff' }}>♦</span><span>{fans}</span></span>
            {stress > 50 && (
              <span className="snes-chip" style={{ borderColor: stress > 80 ? '#ff5c57' : '#ffd23f' }}>
                <span style={{ color: stress > 80 ? '#ff5c57' : '#ffd23f' }}>⚠</span><span>{stress}</span>
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setShowSaveLoad(true)}
              aria-label="Save/Load"
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f1a3a', color: '#b9b3d6', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
            >
              <Save size={15} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f1a3a', color: '#b9b3d6', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* View Content with Swipe Support */}
      <main className="flex-1 overflow-hidden relative" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            <GameErrorBoundary viewName={currentView}>
              {currentView === "promotion" ? (
                <PromotionView onNavigate={handleViewChange} />
              ) : currentView === "tour" ? (
                <TourView onNavigate={handleViewChange} />
              ) : (
                <CurrentViewComponent />
              )}
            </GameErrorBoundary>
          </motion.div>
        </AnimatePresence>
        
        {/* Swipe Indicators */}
        <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {viewOrder.map((view, index) => (
            <div
              key={view}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-6 bg-pink-500' 
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
        onNextTurn={handleNextTurn}
      />

      {/* Modals */}
      <TurnResultsModal
        isOpen={showTurnResults}
        onClose={handleTurnResultsClose}
        showResults={turnResults.showResults}
        totalUpkeep={turnResults.totalUpkeep}
        dayJobResult={turnResults.dayJobResult}
        difficultyEvent={turnResults.difficultyEvent}
      />

      {runEnd && (
        <RunEndScreen
          result={runEnd}
          ceremony={ceremony}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <SaveLoadModal
        isOpen={showSaveLoad}
        onClose={() => setShowSaveLoad(false)}
      />

      {/* Quick Start Guide */}
      <QuickStartGuide />
    </div>
  );
};
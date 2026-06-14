import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CityView } from "./views/CityView";
import { BandsView } from "./views/BandsView";
import { ShowBuilderView } from "./views/ShowBuilderView";
import { SynergyView } from "./views/SynergyView";
import { DayJobView } from "./views/DayJobView";
import { PromotionView } from "./views/PromotionView";
import { ProgressionView } from "./views/ProgressionView";
import { MobileBottomNav } from "./MobileBottomNav";
import { TurnResultsModal } from "@components/ui/TurnResultsModal";
import { SettingsModal } from "@components/ui/SettingsModal";
import { SaveLoadModal } from "@components/ui/SaveLoadModal";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { turnResolutionEngine, TurnResult, RunCeremony } from "@game/mechanics/TurnResolutionEngine";
import { startNewRun } from "@game/mechanics/runLifecycle";
import { RunEndScreen } from "./RunEndScreen";
import { RunEndState } from "@game/constants/runConstants";
import { gameAudio } from "@utils/gameAudio";
import { GameErrorBoundary } from "@components/ErrorBoundary";
import { saveGameManager } from "@game/persistence/SaveGameManager";
import { Settings, Save } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { QuickStartGuide } from './QuickStartGuide';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

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
    onExitToMenu?.();
  };

  // Swipe navigation
  const viewOrder: ViewType[] = ["city", "bands", "shows", "promotion", "jobs", "synergies", "progression"];
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
  };

  const CurrentViewComponent = views[currentView];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Ultra-Compact Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Resources */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-green-400">$</span>
              <span className="font-semibold">{money}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="font-semibold">{reputation}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-purple-400">♦</span>
              <span className="font-semibold">{fans}</span>
            </div>
            {stress > 50 && (
              <div className={`flex items-center gap-1 ${stress > 80 ? 'text-red-400' : 'text-orange-400'}`}>
                <span className="text-xs">⚠</span>
                <span className="font-semibold">{stress}</span>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSaveLoad(true)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              aria-label="Save/Load"
            >
              <Save size={16} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              aria-label="Settings"
            >
              <Settings size={16} />
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
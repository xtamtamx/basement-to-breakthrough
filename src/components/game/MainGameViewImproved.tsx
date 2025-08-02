import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CityView } from "./views/CityView";
import { BandsView } from "./views/BandsViewFixed";
import { ShowBuilderView } from "./views/ShowBuilderViewFixed";
import { SynergyView } from "./views/SynergyViewFixed";
import { DayJobView } from "./views/DayJobViewFixed";
import { PromotionView } from "./views/PromotionViewFixed";
import { ProgressionView } from "./views/ProgressionViewFixed";
import { MobileBottomNav } from "./MobileBottomNav";
import { TurnResultsModal } from "@components/ui/TurnResultsModal";
import { SettingsModal } from "@components/ui/SettingsModal";
import { SaveLoadModal } from "@components/ui/SaveLoadModal";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { turnProcessor } from "@game/mechanics/TurnProcessor";
import { ShowResult } from "@game/types";
import { gameAudio } from "@utils/gameAudio";
import { GameErrorBoundary } from "@components/ErrorBoundary";
import { saveGameManager } from "@game/persistence/SaveGameManager";
import { tutorialManager } from '@game/tutorial/TutorialManager';
import { Settings, Save, DollarSign, Star, Users as UsersIcon } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { QuickStartGuide } from './QuickStartGuide';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

export const MainGameView: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("city");
  const [showTurnResults, setShowTurnResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [turnResults, setTurnResults] = useState<{
    showResults: ShowResult[];
    totalVenueRent: number;
    dayJobResult?: any;
    difficultyEvent?: any;
  }>({ showResults: [], totalVenueRent: 0 });
  
  const { currentRound, money, reputation, fans, stress } = useGameStore();

  // Start background music and tutorial
  useEffect(() => {
    gameAudio.startBackgroundMusic("chill");
    
    // Initialize save manager and start auto-save
    saveGameManager.initialize().then(() => {
      saveGameManager.startAutoSave(5); // Auto-save every 5 minutes
    });

    // Check if tutorial should start
    if (tutorialManager.shouldShowTutorial({ turn: currentRound } as any)) {
      setTimeout(() => {
        tutorialManager.startTutorial();
      }, 1000);
    }

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
    const results = await turnProcessor.processNextTurn();
    setTurnResults(results);
    setShowTurnResults(true);
    haptics.success();
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
        onClose={() => setShowTurnResults(false)}
        showResults={turnResults.showResults}
        totalVenueRent={turnResults.totalVenueRent}
        dayJobResult={turnResults.dayJobResult}
        difficultyEvent={turnResults.difficultyEvent}
      />

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
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
import { SynergyBar } from "./SynergyBar";
import { SynergyAcquireModal } from "./SynergyAcquireModal";
import { EventCardModal } from "./EventCardModal";
import { captureRuntimeSnapshot } from "@game/persistence/runtimeSnapshot";
import { TurnResultsModal } from "@components/ui/TurnResultsModal";
import { SettingsModal } from "@components/ui/SettingsModal";
import { SaveLoadModal } from "@components/ui/SaveLoadModal";
import { ObjectivesModal } from "./ObjectivesModal";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/simpleAudio";
import { turnResolutionEngine, TurnResult, RunCeremony } from "@game/mechanics/TurnResolutionEngine";
import { startNewRun } from "@game/mechanics/runLifecycle";
import { runManager } from "@game/mechanics/RunManager";
import { RunEndScreen } from "./RunEndScreen";
import { RunModeSelector } from "./RunModeSelector";
import { RunEndState } from "@game/constants/runConstants";
import { gameAudio } from "@utils/gameAudio";
import { GameErrorBoundary } from "@components/ErrorBoundary";
import { saveGameManager } from "@game/persistence/SaveGameManager";
import { Settings, Save, MapPin, Target } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

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
  const [showObjectives, setShowObjectives] = useState(false);
  const objectives = useGameStore((s) => s.runObjectives);
  const objectivesDone = objectives?.progress.filter((p) => p.completed).length ?? 0;
  const objectivesTotal = objectives?.progress.length ?? 0;
  const [runEnd, setRunEnd] = useState<RunEndState | null>(null);
  const [ceremony, setCeremony] = useState<RunCeremony | null>(null);
  const [showPlayAgainPicker, setShowPlayAgainPicker] = useState(false);
  const [turnResults, setTurnResults] = useState<TurnResult>(EMPTY_TURN_RESULT);
  // Re-entrancy guard: blocks a same-tick double-tap (and taps while the
  // results modal is up) from resolving the same turn twice.
  const resolvingRef = useRef(false);

  // synergyManager is a singleton OUTSIDE Zustand, so the SynergyBar won't
  // re-render on acquire/replace unless we bump this counter to force it.
  const [synergyVersion, setSynergyVersion] = useState(0);
  const pendingSynergyOffer = useGameStore((s) => s.pendingSynergyOffer);
  const pendingEventCard = useGameStore((s) => s.pendingEventCard);
  const setPendingEventCard = useGameStore((s) => s.setPendingEventCard);
  const setPendingSynergyOffer = useGameStore((s) => s.setPendingSynergyOffer);
  const currentRound = useGameStore((s) => s.currentRound);

  // Close out a milestone synergy offer: clear it, persist the new equipped
  // loadout immediately, and refresh the bar.
  const handleSynergyOfferDone = () => {
    setPendingSynergyOffer(null);
    useGameStore.setState({ runtimeSnapshot: captureRuntimeSnapshot() });
    setSynergyVersion((v) => v + 1);
  };

  const { money, reputation, fans, stress } = useGameStore();
  const currentCityName = useGameStore(
    (s) => s.cities.find((c) => c.id === s.currentCityId)?.name ?? "",
  );

  // Start background music + auto-save. (New-player onboarding is the
  // interactive TutorialOverlay, auto-started from App on a fresh run.)
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
    // Outcome-tiered audio + haptics are owned by TurnResultsModal's open effect
    // (single source of truth — this block used to double-fire the same stinger).
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

  // Play Again reopens the run-mode picker so you can switch modes between runs
  // (rather than silently replaying the last one).
  const handlePlayAgain = () => setShowPlayAgainPicker(true);

  // Same path as the main menu's start — config resources + meta bonuses.
  const startRunWithMode = async (configId: string) => {
    await startNewRun(configId);
    setShowPlayAgainPicker(false);
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
          <div data-tut="resources" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="snes-chip"><span style={{ color: '#3ad17e' }}>$</span><span>{money}</span></span>
            <span className="snes-chip"><span style={{ color: '#ffd23f' }}>★</span><span>{reputation}</span></span>
            <span className="snes-chip"><span style={{ color: '#c77dff' }}>♦</span><span>{fans}</span></span>
            {stress > 50 && (
              <span className="snes-chip" style={{ borderColor: stress > 80 ? '#ff5c57' : '#ffd23f' }}>
                <span style={{ color: stress > 80 ? '#ff5c57' : '#ffd23f' }}>⚠</span><span>{stress}</span>
              </span>
            )}
          </div>

          {/* Current city — always know where you're touring */}
          <div className="snes-pixel" style={{ flex: 1, minWidth: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#f72585', fontSize: '8px', letterSpacing: 0, padding: '0 6px' }}>
            <MapPin size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentCityName}</span>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {objectivesTotal > 0 && (
              <button
                onClick={() => setShowObjectives(true)}
                aria-label="Challenges"
                style={{ height: 32, minWidth: 32, padding: '0 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#1f1a3a', color: objectivesDone > 0 ? '#3ad17e' : '#c77dff', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
              >
                <Target size={14} />
                <span className="snes-pixel" style={{ fontSize: '8px', letterSpacing: 0 }}>{objectivesDone}/{objectivesTotal}</span>
              </button>
            )}
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

      {/* Equipped synergies ("jokers") — always visible just under the HUD.
          Keyed on version+round so the singleton-backed bar re-renders on
          acquire and after each turn (trigger counts). */}
      <div style={{ flexShrink: 0, padding: '6px 10px 0' }}>
        <SynergyBar
          key={`${synergyVersion}-${currentRound}`}
          onSlotClick={() => handleViewChange('synergies')}
        />
      </div>

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
        synergyEffects={turnResults.synergyEffects}
        passiveIncome={turnResults.passiveIncome}
      />

      {/* Milestone synergy offer ("joker" reward). Gated behind the turn-results
          modal so the two never stack (both are z-9999) and their entrance audio
          plays in sequence, not on top of each other. */}
      {!showTurnResults && pendingSynergyOffer && (
        <SynergyAcquireModal
          synergy={pendingSynergyOffer}
          onClose={handleSynergyOfferDone}
          onAcquired={() => {
            audio.play("achievement");
            haptics.success();
            handleSynergyOfferDone();
          }}
        />
      )}

      {/* Event card (band-drama / scene crisis) — pauses for a choice. Also gated
          behind the results modal; appears once the player closes the report. */}
      {!showTurnResults && pendingEventCard && (
        <EventCardModal
          event={pendingEventCard}
          onClose={() => setPendingEventCard(null)}
        />
      )}

      {runEnd && (
        <RunEndScreen
          result={runEnd}
          ceremony={ceremony}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Pick a mode for the next run (over the run-end screen); close = stay */}
      {showPlayAgainPicker && (
        <RunModeSelector
          onSelect={(config) => startRunWithMode(config.id)}
          onClose={() => setShowPlayAgainPicker(false)}
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

      {showObjectives && <ObjectivesModal onClose={() => setShowObjectives(false)} />}
    </div>
  );
};
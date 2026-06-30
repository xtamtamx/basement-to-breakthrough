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
import { useConfirm } from "@components/ui/ConfirmDialog";
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

/** A HUD resource chip that flashes (green up / red down + btb-pop) when its
 *  value changes — so a turn's payoff registers on the HUD it returns to, not
 *  just in the results modal. Reduced-motion users get the color tint without
 *  the pop (btb-pop is gated off in snes.css). */
const FlashChip: React.FC<{ icon: string; color: string; value: number }> = ({ icon, color, value }) => {
  const prev = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? 'up' : 'down');
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [value]);
  const fc = flash === 'up' ? '#3ad17e' : '#ff5c57';
  return (
    <span
      className={`snes-chip${flash ? ' btb-pop' : ''}`}
      style={flash ? { borderColor: fc, boxShadow: `0 0 8px ${fc}66` } : undefined}
    >
      <span style={{ color }}>{icon}</span><span>{value}</span>
    </span>
  );
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
  const [announcement, setAnnouncement] = useState(''); // screen-reader aria-live
  // Re-entrancy guard: blocks a same-tick double-tap (and taps while the
  // results modal is up) from resolving the same turn twice.
  const resolvingRef = useRef(false);
  const confirm = useConfirm();

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

  // Atomic selectors — subscribing without a selector re-renders this root shell
  // (and its whole subtree) on ANY store write; these only fire on the 4 HUD numbers.
  const money = useGameStore((s) => s.money);
  const reputation = useGameStore((s) => s.reputation);
  const fans = useGameStore((s) => s.fans);
  const stress = useGameStore((s) => s.stress);
  const currentCityName = useGameStore(
    (s) => s.cities.find((c) => c.id === s.currentCityId)?.name ?? "",
  );

  // The bed intensifies as the scene grows: chill basements → driving punk →
  // a bright festival singalong near breakthrough. Recomputed as rep climbs.
  const musicTrack: "chill" | "intense" | "festival" =
    reputation >= 70 ? "festival" : reputation >= 30 ? "intense" : "chill";

  // Start background music + auto-save. (New-player onboarding is the
  // interactive TutorialOverlay, auto-started from App on a fresh run.)
  useEffect(() => {
    gameAudio.startBackgroundMusic(musicTrack);

    // Initialize save manager and start auto-save
    saveGameManager.initialize().then(() => {
      saveGameManager.startAutoSave(5); // Auto-save every 5 minutes
    });

    return () => {
      gameAudio.stopBackgroundMusic();
      saveGameManager.stopAutoSave();
    };
    // Initial track only; tier changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the bed when the scene crosses a tier (no-op within a tier).
  useEffect(() => {
    gameAudio.setMusicTrack(musicTrack);
  }, [musicTrack]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    haptics.light();
  };

  const handleNextTurn = async () => {
    if (resolvingRef.current) return; // ignore re-entrant taps
    // Guard the most common run-ending mistake: advancing with nothing booked
    // silently burns a finite turn (you just pay rent). Confirm first.
    if (useGameStore.getState().scheduledShows.length === 0) {
      haptics.warning();
      const proceed = await confirm({
        title: 'No shows booked',
        message: "End the turn anyway? You'll just pay rent and lose ground.",
        confirmLabel: 'End Turn',
        cancelLabel: 'Go Back',
      });
      if (!proceed) return;
    }
    resolvingRef.current = true;
    try {
      const results = await turnResolutionEngine.executeFullTurn();
      setTurnResults(results);
      setShowTurnResults(true);
      // Announce the new state to screen readers (the visual HUD/modal say nothing
      // to assistive tech otherwise).
      const s = useGameStore.getState();
      setAnnouncement(`Turn resolved. Money $${s.money}, reputation ${s.reputation}, ${s.fans} fans, stress ${s.stress} of 100.`);
      // Outcome-tiered audio + haptics are owned by TurnResultsModal's open effect
      // (single source of truth — this block used to double-fire the same stinger).
    } catch (err) {
      // A throw mid-resolution must NEVER brick the run. Without this, resolvingRef
      // would stay true forever and every future "Next Turn" tap would no-op.
      console.error('Turn resolution failed:', err);
      haptics.error();
      setAnnouncement('Something went wrong resolving the turn. Your progress is safe — please try again.');
      void confirm({
        title: 'Turn hiccup',
        message: 'Something went wrong resolving the turn.\nYour progress is safe — just try the turn again.',
        notice: true,
      });
    } finally {
      // Always clear the guard so the player can retry (success path also clears
      // it on results-close, which is now redundant but harmless).
      resolvingRef.current = false;
    }
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
  const startRunWithMode = async (configId: string, stakeTier = 0) => {
    await startNewRun(configId, stakeTier);
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
    <div
      className="h-full flex flex-col"
      style={{
        background: '#0a0814',
        // Keep the HUD + content clear of the notch / Dynamic Island (which sits
        // on a SIDE in landscape) and the top inset (portrait). The fixed bottom
        // nav handles its own insets.
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Screen-reader-only live region — announces turn outcomes to assistive
          tech (the visual HUD/modal are otherwise silent). */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {announcement}
      </div>
      {/* Ultra-Compact Header — neon-punk SNES HUD */}
      <header
        className="snes-bar snes-bar--top flex-shrink-0"
        style={{ padding: '7px 10px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Resources */}
          <div data-tut="resources" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <FlashChip icon="$" color="#3ad17e" value={money} />
            <FlashChip icon="★" color="#ffd23f" value={reputation} />
            <FlashChip icon="♦" color="#c77dff" value={fans} />
            {/* Always-on stress gauge — burnout is a loss condition, so the trend
                must be visible, not a surprise that pops in only at 50. */}
            <span
              className="snes-chip"
              style={{ borderColor: stress > 80 ? '#ff5c57' : stress > 50 ? '#ffd23f' : '#2a2350' }}
              title={`Stress ${stress}/100 — band burns out at 100`}
            >
              <span style={{ color: stress > 80 ? '#ff5c57' : stress > 50 ? '#ffd23f' : '#6f6796' }}>⚠</span>
              <span style={{ color: stress > 50 ? undefined : '#9b94c0' }}>{stress}</span>
            </span>
          </div>

          {/* Current city pin. Single-city demo: always Strong Island (scene flavor). */}
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
                data-tut="challenges"
                style={{ height: 44, minWidth: 44, padding: '0 9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#1f1a3a', color: objectivesDone > 0 ? '#3ad17e' : '#c77dff', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
              >
                <Target size={14} />
                <span className="snes-pixel" style={{ fontSize: '8px', letterSpacing: 0 }}>{objectivesDone}/{objectivesTotal}</span>
              </button>
            )}
            <button
              onClick={() => setShowSaveLoad(true)}
              aria-label="Save/Load"
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f1a3a', color: '#b9b3d6', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
            >
              <Save size={15} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f1a3a', color: '#b9b3d6', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Equipped synergies (player-facing: "instincts") — always visible just
          under the HUD. Keyed on version+round so the singleton-backed bar
          re-renders on acquire and after each turn (trigger counts). */}
      <div data-tut="instincts" style={{ flexShrink: 0, padding: '6px 10px 0' }}>
        <SynergyBar
          key={`${synergyVersion}-${currentRound}`}
          onSlotClick={() => handleViewChange('synergies')}
        />
      </div>

      {/* View Content. Navigation is tap-only via the bottom nav — the old
          swipe-to-switch gesture was too touchy and kept hijacking the map's
          drag and flipping tabs by accident. */}
      <main className="flex-1 overflow-hidden relative">
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

      {/* Milestone synergy offer ("instinct" reward). Gated behind the turn-results
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
          onClimb={
            ceremony
              ? () => startRunWithMode(ceremony.configId, ceremony.stakeTier + 1)
              : undefined
          }
        />
      )}

      {/* Pick a mode for the next run (over the run-end screen); close = stay */}
      {showPlayAgainPicker && (
        <RunModeSelector
          onSelect={(config, stakeTier) => startRunWithMode(config.id, stakeTier)}
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
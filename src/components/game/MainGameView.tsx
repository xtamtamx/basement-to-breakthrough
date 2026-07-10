import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CityView } from "./views/CityView";
import { BandsView } from "./views/BandsView";
import { ShowBuilderView } from "./views/ShowBuilderView";
import { SynergyView } from "./views/SynergyView";
import { DayJobView } from "./views/DayJobView";
import { PromotionView } from "./views/PromotionView";
import { ProgressionView } from "./views/ProgressionView";
import { TourView } from "./views/TourView";
import { MobileBottomNav } from "./MobileBottomNav";
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
import { synergyManager } from "@game/mechanics/SynergyManager";
import { applyUiSkin } from "@game/world/uiSkin";
import {
  getSceneIdentityTier,
  SCENE_IDENTITY_TIERS,
  type SceneIdentityKey,
} from "@game/mechanics/sceneIdentity";
import { PixelIcon } from "@components/ui/PixelIcon";

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
const FlashChip: React.FC<{ icon: React.ReactNode; color: string; value: number }> = ({ icon, color, value }) => {
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
  // Per-faction standing deltas from the turn just resolved — diffed around
  // executeFullTurn so the results modal can attribute the meter's drift.
  const [factionShifts, setFactionShifts] = useState<{ id: string; delta: number }[]>([]);
  const [announcement, setAnnouncement] = useState(''); // screen-reader aria-live
  // Re-entrancy guard: blocks a same-tick double-tap (and taps while the
  // results modal is up) from resolving the same turn twice.
  const resolvingRef = useRef(false);
  const confirm = useConfirm();

  // synergyManager is a singleton OUTSIDE Zustand, so the HUD instinct chip
  // won't re-derive on acquire/replace unless we bump this counter to force it.
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
  // The UI's whole production style morphs with the DIY↔sellout standing —
  // set the skin on <html> so it cascades everywhere (incl. portaled modals).
  const diyPoints = useGameStore((s) => s.diyPoints);
  useEffect(() => { applyUiSkin(diyPoints); }, [diyPoints]);

  // One-line in-fiction acknowledgment when the DIY↔sellout identity TIER shifts —
  // without it the skin morph reads as a mute palette swap. Primed silently on
  // mount, on a new run, and while the save/load modal is open (resets and loads
  // must never read as "the scene noticed you changed").
  const [identityNotice, setIdentityNotice] = useState<{ line: string; flavor: string; color: string } | null>(null);
  const identityTierRef = useRef<SceneIdentityKey | null>(null);
  const suppressIdentityToastRef = useRef(false);
  useEffect(() => {
    const tier = getSceneIdentityTier(diyPoints);
    if (identityTierRef.current === null || suppressIdentityToastRef.current || showSaveLoad) {
      identityTierRef.current = tier.key;
      return;
    }
    if (identityTierRef.current === tier.key) return;
    // SCENE_IDENTITY_TIERS is ordered DIY-first, so a smaller index = more DIY.
    const idx = (k: SceneIdentityKey) => SCENE_IDENTITY_TIERS.findIndex((t) => t.key === k);
    const towardDiy = idx(tier.key) < idx(identityTierRef.current);
    identityTierRef.current = tier.key;
    setIdentityNotice({
      line: towardDiy
        ? `The scene's pulling you back in — word is you're a ${tier.label} now.`
        : `The scene clocked the change — word is you're a ${tier.label} now.`,
      flavor: tier.flavor,
      color: tier.color,
    });
    haptics.light();
  }, [diyPoints, showSaveLoad]);
  // Auto-dismiss; re-arms if another tier change lands while one is showing.
  useEffect(() => {
    if (!identityNotice) return;
    const t = setTimeout(() => setIdentityNotice(null), 6000);
    return () => clearTimeout(t);
  }, [identityNotice]);

  const currentCityName = useGameStore(
    (s) => s.cities.find((c) => c.id === s.currentCityId)?.name ?? "",
  );
  // Instinct counts for the HUD chip. synergyManager is a singleton outside
  // Zustand, so re-derive when an instinct is acquired (synergyVersion) or a
  // turn resolves (currentRound) rather than on every store write.
  const { equippedInstincts, maxInstincts } = React.useMemo(
    () => ({
      equippedInstincts: synergyManager.getEquippedSynergies().length,
      maxInstincts: synergyManager.getMaxSlots(),
    }),
    // Re-derive on instinct acquire (synergyVersion) / turn resolve (currentRound),
    // not on every store write — the singleton's getters aren't reactive deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [synergyVersion, currentRound],
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
      // Diff faction standings around the resolution so the results modal can show
      // WHO shifted and by how much (the engine moves them per-show with hidden
      // ally/enemy cascades — totals-only drift teaches nothing).
      const preStandings = { ...useGameStore.getState().factionStandings };
      const results = await turnResolutionEngine.executeFullTurn();
      const postStandings = useGameStore.getState().factionStandings ?? {};
      const factionIds = new Set([...Object.keys(preStandings), ...Object.keys(postStandings)]);
      setFactionShifts(
        [...factionIds]
          .map((id) => ({
            id,
            delta: Math.round(((postStandings[id] ?? 0) - (preStandings[id] ?? 0)) * 10) / 10,
          }))
          // Sub-half-point cascade dust isn't a story worth a chip.
          .filter((s) => Math.abs(s.delta) >= 0.5),
      );
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
    // A new run resets diyPoints — suppress BEFORE the await (the store reset
    // re-renders mid-flight) so the reset never reads as an identity change.
    suppressIdentityToastRef.current = true;
    await startNewRun(configId, stakeTier);
    identityTierRef.current = getSceneIdentityTier(useGameStore.getState().diyPoints).key;
    suppressIdentityToastRef.current = false;
    setIdentityNotice(null);
    setShowPlayAgainPicker(false);
    setRunEnd(null);
    setCeremony(null);
    setTurnResults(EMPTY_TURN_RESULT);
    setFactionShifts([]);
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
        background: 'var(--snes-void)',
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
            <FlashChip icon={<PixelIcon name="money" size={12} />} color="var(--snes-green)" value={money} />
            <FlashChip icon={<PixelIcon name="fame" size={12} />} color="var(--snes-gold)" value={reputation} />
            <FlashChip icon={<PixelIcon name="fans" size={12} />} color="var(--snes-purple)" value={fans} />
            {/* Always-on stress gauge — burnout is a loss condition, so the trend
                must be visible, not a surprise that pops in only at 50. */}
            <span
              className="snes-chip"
              style={{ borderColor: stress > 80 ? 'var(--snes-red)' : stress > 50 ? 'var(--snes-gold)' : 'var(--snes-line)' }}
              title={`Stress ${stress}/100 — band burns out at 100`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', color: stress > 80 ? 'var(--snes-red)' : stress > 50 ? 'var(--snes-gold)' : 'var(--snes-ink-dim)' }}><PixelIcon name="stress" size={12} /></span>
              <span style={{ color: stress > 50 ? undefined : 'var(--snes-ink-dim)' }}>{stress}</span>
            </span>
          </div>

          {/* Current city pin. Single-city demo: always Strong Island (scene flavor). */}
          <div className="snes-pixel" style={{ flex: 1, minWidth: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--snes-magenta)', fontSize: '11px', letterSpacing: 0, padding: '0 6px' }}>
            <PixelIcon name="pin" size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentCityName}</span>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Instincts — count folded up from the old always-on under-HUD strip.
                Tap to view & slot in the Synergies view. Carries the tutorial anchor. */}
            <button
              onClick={() => handleViewChange('synergies')}
              data-tut="instincts"
              aria-label={`Instincts ${equippedInstincts} of ${maxInstincts}`}
              title="Instincts — tap to view & slot"
              className="snes-hud-btn"
              style={{ color: 'var(--snes-purple)' }}
            >
              <PixelIcon name="instinct" size={14} />
              <span className="snes-pixel" style={{ fontSize: '11px', letterSpacing: 0 }}>{equippedInstincts}/{maxInstincts}</span>
            </button>
            {objectivesTotal > 0 && (
              <button
                onClick={() => setShowObjectives(true)}
                aria-label="Challenges"
                data-tut="challenges"
                className="snes-hud-btn"
                style={{ color: objectivesDone > 0 ? 'var(--snes-green)' : 'var(--snes-purple)' }}
              >
                <PixelIcon name="target" size={14} />
                <span className="snes-pixel" style={{ fontSize: '11px', letterSpacing: 0 }}>{objectivesDone}/{objectivesTotal}</span>
              </button>
            )}
            <button
              onClick={() => setShowSaveLoad(true)}
              aria-label="Save/Load"
              className="snes-hud-btn"
              style={{ color: 'var(--snes-ink-dim)' }}
            >
              <PixelIcon name="save" size={15} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              className="snes-hud-btn"
              style={{ color: 'var(--snes-ink-dim)' }}
            >
              <PixelIcon name="gear" size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* View Content. Navigation is tap-only via the bottom nav — the old
          swipe-to-switch gesture was too touchy and kept hijacking the map's
          drag and flipping tabs by accident. */}
      {/* No AnimatePresence here on purpose: mode="wait" made every tab switch
          a fade-out THEN fade-in (a dead ~400ms black gap between views — felt
          clunky, and stalled forever in throttled tabs). Instant swap + a quick
          fade-in of the incoming view reads snappy and can't hang. */}
      <main className="flex-1 overflow-hidden relative">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
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
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
        onNextTurn={handleNextTurn}
      />

      {/* Scene-voice toast: acknowledges a DIY↔sellout identity-tier crossing
          (the moment the whole UI skin morphs). Self-dismisses; never blocks taps. */}
      {identityNotice && (
        <div
          className="btb-pop"
          role="status"
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top) + 48px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 8000,
            maxWidth: 'min(440px, 90vw)',
            pointerEvents: 'none',
            backgroundColor: 'var(--snes-bg-2)',
            border: '2px solid var(--snes-void)',
            borderLeft: `4px solid ${identityNotice.color}`,
            padding: '8px 12px',
            boxShadow: '0 4px 0 rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="snes-pixel" style={{ fontSize: '10px', color: identityNotice.color, letterSpacing: 0, lineHeight: 1.6 }}>
            {identityNotice.line}
          </div>
          <div style={{ color: 'var(--snes-ink-dim)', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: 1.5 }}>
            {identityNotice.flavor}
          </div>
        </div>
      )}

      {/* Modals */}
      <TurnResultsModal
        isOpen={showTurnResults}
        onClose={handleTurnResultsClose}
        showResults={turnResults.showResults}
        totalUpkeep={turnResults.totalUpkeep}
        turn={turnResults.turn}
        isEscalation={turnResults.isEscalation}
        warnings={turnResults.warnings}
        venueUnlocks={turnResults.venueUnlocks}
        objectivesCompleted={turnResults.objectivesCompleted}
        factionShifts={factionShifts}
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
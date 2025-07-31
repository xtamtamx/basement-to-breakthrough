import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CityView } from "./views/CityView";
import { BandsView } from "./views/BandsView";
import { ShowBuilderView } from "./views/ShowBuilderView";
import { SynergyView } from "./views/SynergyView";
import { DayJobView } from "./views/DayJobView";
import { PromotionView } from "./views/PromotionView";
import { ProgressionView } from "./views/ProgressionView";
import { TurnResultsModal } from "@components/ui/TurnResultsModal";
import { SettingsModal } from "@components/ui/SettingsModal";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { turnProcessor } from "@game/mechanics/TurnProcessor";
import { ShowResult } from "@game/types";
import { showPromotionSystem } from "@game/mechanics/ShowPromotionSystem";
import { progressionPathSystem } from "@game/mechanics/ProgressionPathSystem";
import { gameAudio } from "@utils/gameAudio";
import { GameErrorBoundary } from "@components/ErrorBoundary";
import { FPSMonitor } from "@components/FPSMonitor";
import { getResourceAriaLabel, prefersReducedMotion } from "@utils/accessibility";
import { useAnnouncement, useLiveRegion } from "@hooks/useAccessibility";
import { AccessibleTooltip } from "@components/ui/AccessibleTooltip";

type ViewType =
  | "city"
  | "bands"
  | "shows"
  | "promotion"
  | "synergies"
  | "jobs"
  | "progression";

export const MainGameViewAccessible: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("city");
  const [showTurnResults, setShowTurnResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [turnResults, setTurnResults] = useState<{
    showResults: ShowResult[];
    totalVenueRent: number;
    dayJobResult?: any;
    difficultyEvent?: any;
  }>({ showResults: [], totalVenueRent: 0 });
  
  const {
    currentRound,
    scheduledShows,
    money,
    reputation,
    fans,
    stress,
    showHistory,
  } = useGameStore();

  const announce = useAnnouncement();
  const { announce: announceResource, LiveRegion } = useLiveRegion();
  const reducedMotion = prefersReducedMotion();

  // Start background music
  useEffect(() => {
    gameAudio.startBackgroundMusic("chill");
    return () => {
      gameAudio.stopBackgroundMusic();
    };
  }, []);

  // Announce resource changes
  useEffect(() => {
    announceResource(`Current resources: ${getResourceAriaLabel('money', money)}, ${getResourceAriaLabel('reputation', reputation)}, ${getResourceAriaLabel('fans', fans)}`);
  }, [money, reputation, fans, announceResource]);

  // Check if progression system is unlocked
  const progressionUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length,
  });

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    haptics.light();
    announce(`Switched to ${views[view].label} view`);
  };

  const handleNextTurn = () => {
    const results = turnProcessor.processNextTurn();
    setTurnResults(results);
    setShowTurnResults(true);
    haptics.success();
    announce(`Turn ${currentRound} complete. Opening results.`);
  };

  const views = {
    city: { component: CityView, icon: "🏙️", label: "City" },
    bands: { component: BandsView, icon: "🎸", label: "Bands" },
    shows: { component: ShowBuilderView, icon: "🎫", label: "Shows" },
    promotion: { component: PromotionView, icon: "📢", label: "Promotion" },
    jobs: { component: DayJobView, icon: "💼", label: "Day Jobs" },
    synergies: { component: SynergyView, icon: "🔥", label: "Synergies" },
    progression: { component: ProgressionView, icon: "📈", label: "Progression" },
  };

  const CurrentViewComponent = views[currentView].component;

  // Calculate difficulty level for display
  const difficultyLevel = Math.min(Math.floor(currentRound / 10) + 1, 5);

  return (
    <div className="main-game-view">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Single Compact Header */}
      <header className="game-header" role="banner">
        <div className="header-left">
          <h1 className="game-logo">DIY</h1>
          <span className="round-badge" aria-label={`Round ${currentRound}`}>
            R{currentRound}
          </span>
          <div
            className="difficulty-indicator"
            role="img"
            aria-label={`Difficulty level ${difficultyLevel} out of 5`}
          >
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`difficulty-bar ${i < difficultyLevel ? "active" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <nav className="nav-tabs" role="navigation" aria-label="Game views">
          {Object.entries(views).map(([key, view]) => {
            if (key === "progression" && !progressionUnlocked) {
              return null;
            }

            const isActive = currentView === key;
            const showCount = key === "shows" ? scheduledShows.length :
                            key === "promotion" ? showPromotionSystem.getScheduledShows().length :
                            0;
            const hasAlert = key === "progression" && progressionUnlocked && 
                           !progressionPathSystem.getProgression().currentPath;

            return (
              <button
                key={key}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleViewChange(key as ViewType)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${view.label} view${showCount ? `, ${showCount} scheduled` : ''}${hasAlert ? ', attention needed' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true">{view.icon}</span>
                <span className="nav-label">{view.label}</span>
                {showCount > 0 && (
                  <span className="nav-badge" aria-hidden="true">{showCount}</span>
                )}
                {hasAlert && (
                  <span className="nav-badge nav-badge-alert" aria-hidden="true">!</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="header-right">
          <div className="resources" role="group" aria-label="Game resources">
            <AccessibleTooltip content="Current money">
              <div className="resource" aria-label={getResourceAriaLabel('money', money)}>
                <span className="resource-icon" aria-hidden="true">💰</span>
                <span className="resource-value">${money}</span>
              </div>
            </AccessibleTooltip>
            
            <AccessibleTooltip content="Current reputation">
              <div className="resource" aria-label={getResourceAriaLabel('reputation', reputation)}>
                <span className="resource-icon" aria-hidden="true">⭐</span>
                <span className="resource-value">{reputation}</span>
              </div>
            </AccessibleTooltip>
            
            <AccessibleTooltip content="Current fans">
              <div className="resource" aria-label={getResourceAriaLabel('fans', fans)}>
                <span className="resource-icon" aria-hidden="true">👥</span>
                <span className="resource-value">{fans}</span>
              </div>
            </AccessibleTooltip>
            
            {stress > 0 && (
              <AccessibleTooltip content={`Stress level: ${stress > 80 ? 'Critical' : stress > 50 ? 'High' : 'Moderate'}`}>
                <div
                  className={`resource ${stress > 80 ? "danger" : stress > 50 ? "warning" : ""}`}
                  aria-label={getResourceAriaLabel('stress', stress)}
                >
                  <span className="resource-icon" aria-hidden="true">😰</span>
                  <span className="resource-value">{stress}%</span>
                </div>
              </AccessibleTooltip>
            )}
          </div>
          
          <div className="header-actions">
            <button
              className="settings-btn"
              onClick={() => {
                setShowSettings(true);
                haptics.light();
              }}
              aria-label="Open settings"
            >
              <span aria-hidden="true">⚙️</span>
            </button>
            
            <button 
              className="next-turn-btn" 
              onClick={handleNextTurn}
              aria-label="End turn and proceed to next round"
            >
              <span>Next Turn</span>
              <span className="btn-icon" aria-hidden="true">⏭️</span>
            </button>
          </div>
        </div>
      </header>

      {/* View Content */}
      <main id="main-content" className="view-content" role="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={reducedMotion ? false : { opacity: 1, y: 0 }}
            exit={reducedMotion ? false : { opacity: 0, y: -20 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="view-wrapper"
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
      </main>

      {/* Turn Results Modal */}
      <TurnResultsModal
        isOpen={showTurnResults}
        onClose={() => setShowTurnResults(false)}
        showResults={turnResults.showResults}
        totalVenueRent={turnResults.totalVenueRent}
        dayJobResult={turnResults.dayJobResult}
        difficultyEvent={turnResults.difficultyEvent}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Floating End Turn Button */}
      <button 
        className="floating-end-turn" 
        onClick={handleNextTurn}
        aria-label="End turn and proceed to next round"
      >
        <span className="turn-icon" aria-hidden="true">⏭️</span>
        <span className="turn-text">End Turn</span>
      </button>

      {/* Live announcements for screen readers */}
      <LiveRegion />

      {/* FPS Monitor for performance tracking */}
      {process.env.NODE_ENV === 'development' && (
        <FPSMonitor 
          position="top-left" 
          targetFPS={60} 
          showGraph={true}
        />
      )}

      <style>{`
        /* Existing styles remain the same */
        .main-game-view {
          position: fixed;
          inset: 0;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .game-header {
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--border-default);
          padding: 0 20px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-shrink: 0;
        }

        /* ... rest of the styles remain the same ... */
      `}</style>
    </div>
  );
};
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
import { GameErrorBoundary, withErrorBoundary } from "@components/ErrorBoundary";
import { FPSMonitor } from "@components/FPSMonitor";

type ViewType =
  | "city"
  | "bands"
  | "shows"
  | "promotion"
  | "synergies"
  | "jobs"
  | "progression";

export const MainGameView: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("city");
  const [showTurnResults, setShowTurnResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [turnResults, setTurnResults] = useState<{
    showResults: ShowResult[];
    totalVenueRent: number;
    dayJobResult?: {
      money: number;
      reputationLoss: number;
      fanLoss: number;
      stressGain: number;
      message: string;
      randomEvent?: {
        message: string;
        effects: {
          money?: number;
          reputation?: number;
          fans?: number;
          stress?: number;
        };
      };
    };
    difficultyEvent?: {
      message: string;
      reputationLost: number;
    };
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

  // Start background music
  useEffect(() => {
    gameAudio.startBackgroundMusic("chill");

    return () => {
      gameAudio.stopBackgroundMusic();
    };
  }, []);

  // Check if progression system is unlocked
  const progressionUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length,
  });

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    haptics.light();
  };

  const handleNextTurn = () => {
    const results = turnProcessor.processNextTurn();
    setTurnResults(results);
    setShowTurnResults(true);
    haptics.success();
  };

  const views = {
    city: { component: CityView, icon: "🏙️", label: "City" },
    bands: { component: BandsView, icon: "🎸", label: "Bands" },
    shows: { component: ShowBuilderView, icon: "🎫", label: "Shows" },
    promotion: { component: PromotionView, icon: "📢", label: "Promo" },
    jobs: { component: DayJobView, icon: "💼", label: "Jobs" },
    synergies: { component: SynergyView, icon: "🔥", label: "Synergies" },
    progression: { component: ProgressionView, icon: "📈", label: "Path" },
  };

  const CurrentViewComponent = views[currentView].component;

  // Calculate difficulty level for display
  const difficultyLevel = Math.min(Math.floor(currentRound / 10) + 1, 5);
  const difficultyColors = [
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#dc2626",
    "#991b1b",
  ];

  return (
    <div className="main-game-view">
      {/* Single Compact Header */}
      <header className="game-header">
        <div className="header-left">
          <h1 className="game-logo">DIY</h1>
          <span className="round-badge">R{currentRound}</span>
          <div
            className="difficulty-indicator"
            title={`Difficulty Level ${difficultyLevel}`}
          >
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`difficulty-bar ${i < difficultyLevel ? "active" : ""}`}
                style={{
                  backgroundColor:
                    i < difficultyLevel
                      ? difficultyColors[difficultyLevel - 1]
                      : "var(--bg-tertiary)",
                }}
              />
            ))}
          </div>
        </div>

        <nav className="nav-tabs">
          {Object.entries(views).map(([key, view]) => {
            // Hide progression tab if not unlocked
            if (key === "progression" && !progressionUnlocked) {
              return null;
            }

            return (
              <button
                key={key}
                className={`nav-item ${currentView === key ? "active" : ""}`}
                onClick={() => handleViewChange(key as ViewType)}
              >
                <span className="nav-icon">{view.icon}</span>
                <span className="nav-label">{view.label}</span>
                {key === "shows" && scheduledShows.length > 0 && (
                  <span className="nav-badge">{scheduledShows.length}</span>
                )}
                {key === "promotion" &&
                  showPromotionSystem.getScheduledShows().length > 0 && (
                    <span className="nav-badge">
                      {showPromotionSystem.getScheduledShows().length}
                    </span>
                  )}
                {key === "progression" &&
                  progressionUnlocked &&
                  !progressionPathSystem.getProgression().currentPath && (
                    <span className="nav-badge nav-badge-alert">!</span>
                  )}
              </button>
            );
          })}
        </nav>

        <div className="header-right">
          <div className="resources">
            <div className="resource">
              <span className="resource-icon">💰</span>
              <span className="resource-value">${money}</span>
            </div>
            <div className="resource">
              <span className="resource-icon">⭐</span>
              <span className="resource-value">{reputation}</span>
            </div>
            <div className="resource">
              <span className="resource-icon">👥</span>
              <span className="resource-value">{fans}</span>
            </div>
            {stress > 0 && (
              <div
                className={`resource ${stress > 80 ? "danger" : stress > 50 ? "warning" : ""}`}
              >
                <span className="resource-icon">😰</span>
                <span className="resource-value">{stress}%</span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button
              className="settings-btn"
              onClick={() => {
                setShowSettings(true);
                haptics.light();
              }}
              title="Settings"
            >
              ⚙️
            </button>
            <button className="next-turn-btn" onClick={handleNextTurn}>
              <span>Next Turn</span>
              <span className="btn-icon">⏭️</span>
            </button>
          </div>
        </div>
      </header>

      {/* Compact Stats Bar */}
      <div className="stats-bar">
        <div className="stat-compact">
          <span className="stat-icon">💰</span>
          <span className="stat-value">${money}</span>
        </div>
        <div className="stat-compact">
          <span className="stat-icon">⭐</span>
          <span className="stat-value">{reputation}</span>
        </div>
        <div className="stat-compact">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{fans}</span>
        </div>
        {stress > 0 && (
          <div
            className={`stat-compact ${stress > 80 ? "danger" : stress > 50 ? "warning" : ""}`}
          >
            <span className="stat-icon">😰</span>
            <span className="stat-value">{stress}%</span>
          </div>
        )}
      </div>

      {/* View Content */}
      <main className="view-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
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
      <button className="floating-end-turn" onClick={handleNextTurn}>
        <span className="turn-icon">⏭️</span>
        <span className="turn-text">End Turn</span>
      </button>

      <style>{`
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

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .game-logo {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: var(--punk-magenta);
          text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }

        .round-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        .difficulty-indicator {
          display: flex;
          gap: 3px;
          align-items: center;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }
        
        .difficulty-bar {
          width: 3px;
          height: 12px;
          border-radius: 2px;
          transition: all var(--transition-base);
          opacity: 0.3;
        }
        
        .difficulty-bar.active {
          opacity: 1;
          box-shadow: 0 0 4px currentColor;
        }

        .nav-tabs {
          display: flex;
          gap: 4px;
          justify-content: center;
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: none;
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--bg-tertiary);
          color: var(--punk-magenta);
          box-shadow: inset 0 0 0 1px var(--punk-magenta);
        }

        .nav-icon {
          font-size: 16px;
        }

        .nav-label {
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .nav-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--info-purple);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 10px;
          min-width: 16px;
          text-align: center;
        }
        
        .nav-badge-alert {
          background: var(--warning-amber);
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .settings-btn {
          padding: 6px 10px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 16px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .settings-btn:hover {
          background: var(--bg-hover);
          border-color: var(--punk-magenta);
          transform: translateY(-1px);
        }

        .resources {
          display: flex;
          gap: 12px;
        }

        .resource {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }

        .resource-icon {
          font-size: 12px;
        }

        .resource-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .next-turn-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: linear-gradient(135deg, var(--success-emerald) 0%, var(--success-green) 100%);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .next-turn-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-icon {
          font-size: 14px;
        }

        .view-content {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .view-wrapper {
          position: absolute;
          inset: 0;
        }

        .floating-end-turn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, var(--punk-magenta) 0%, var(--metal-red) 100%);
          border: none;
          border-radius: 28px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transition: all var(--transition-fast);
          z-index: 100;
        }

        .floating-end-turn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(236, 72, 153, 0.4);
        }

        .floating-end-turn:active {
          transform: translateY(0);
        }

        .turn-icon {
          font-size: 18px;
        }

        .stats-bar {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-default);
          padding: 8px 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          flex-shrink: 0;
        }

        .stat-compact {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .stat-compact .stat-icon {
          font-size: 14px;
        }

        .stat-compact .stat-value {
          color: var(--text-primary);
        }

        .stat-compact.warning {
          color: var(--warning-amber);
        }

        .stat-compact.danger {
          color: var(--danger-red);
        }

        @media (max-width: 768px) {
          .game-header {
            padding: 0 12px;
            height: 44px;
          }

          .nav-label {
            display: none;
          }

          .nav-item {
            padding: 6px 12px;
          }

          .resources {
            gap: 8px;
          }

          .resource {
            padding: 4px 6px;
          }

          .next-turn-btn span:first-child {
            display: none;
          }

          .next-turn-btn {
            padding: 6px 10px;
          }
        }

        @media (max-width: 480px) {
          .header-left {
            gap: 8px;
          }

          .nav-tabs {
            gap: 2px;
          }
          
          .difficulty-indicator {
            display: none;
          }

          .nav-item {
            padding: 6px 8px;
            font-size: 10px;
          }

          .nav-icon {
            font-size: 14px;
          }

          .resources {
            gap: 4px;
          }
          
          .resource {
            padding: 2px 4px;
            font-size: 11px;
            gap: 2px;
          }

          .resource-icon {
            font-size: 12px;
          }

          .resource-value {
            font-size: 11px;
          }

          .game-header {
            gap: 8px;
          }

          .floating-end-turn {
            bottom: 16px;
            right: 16px;
            padding: 10px 16px;
          }

          .turn-text {
            display: none;
          }

          .turn-icon {
            font-size: 20px;
          }

          .stats-bar {
            padding: 6px 12px;
            gap: 12px;
            font-size: 12px;
          }

          .stat-compact {
            font-size: 12px;
          }

          .stat-compact .stat-icon {
            font-size: 13px;
          }
        }
      `}</style>
      
      {/* FPS Monitor for performance tracking */}
      {process.env.NODE_ENV === 'development' && (
        <FPSMonitor 
          position="top-left" 
          targetFPS={60} 
          showGraph={true}
        />
      )}
    </div>
  );
};

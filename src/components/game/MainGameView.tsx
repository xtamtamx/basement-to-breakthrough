import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CityView } from './views/CityView';
import { BandsView } from './views/BandsView';
import { ShowBuilderView } from './views/ShowBuilderView';
import { SynergyView } from './views/SynergyView';
import { TurnResultsModal } from '@components/ui/TurnResultsModal';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { turnProcessor } from '@game/mechanics/TurnProcessor';
import { ShowResult } from '@game/types';

type ViewType = 'city' | 'bands' | 'shows' | 'synergies';

export const MainGameView: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('city');
  const [showTurnResults, setShowTurnResults] = useState(false);
  const [turnResults, setTurnResults] = useState<{ showResults: ShowResult[], totalVenueRent: number }>({ showResults: [], totalVenueRent: 0 });
  const { currentRound, scheduledShows, money, reputation, fans } = useGameStore();

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
    city: { component: CityView, icon: '🏙️', label: 'City' },
    bands: { component: BandsView, icon: '🎸', label: 'Bands' },
    shows: { component: ShowBuilderView, icon: '🎫', label: 'Shows' },
    synergies: { component: SynergyView, icon: '🔥', label: 'Synergies' }
  };

  const CurrentViewComponent = views[currentView].component;

  return (
    <div className="main-game-view">
      {/* Single Compact Header */}
      <header className="game-header">
        <div className="header-left">
          <h1 className="game-logo">B2B</h1>
          <span className="round-badge">R{currentRound}</span>
        </div>
        
        <nav className="nav-tabs">
          {Object.entries(views).map(([key, view]) => (
            <button
              key={key}
              className={`nav-item ${currentView === key ? 'active' : ''}`}
              onClick={() => handleViewChange(key as ViewType)}
            >
              <span className="nav-icon">{view.icon}</span>
              <span className="nav-label">{view.label}</span>
              {key === 'shows' && scheduledShows.length > 0 && (
                <span className="nav-badge">{scheduledShows.length}</span>
              )}
            </button>
          ))}
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
          </div>
          <button 
            className="next-turn-btn"
            onClick={handleNextTurn}
          >
            <span>Next Turn</span>
            <span className="btn-icon">⏭️</span>
          </button>
        </div>
      </header>

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
            <CurrentViewComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Turn Results Modal */}
      <TurnResultsModal
        isOpen={showTurnResults}
        onClose={() => setShowTurnResults(false)}
        showResults={turnResults.showResults}
        totalVenueRent={turnResults.totalVenueRent}
      />

      <style jsx>{`
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

        .nav-tabs {
          display: flex;
          gap: 4px;
          flex: 1;
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

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
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

          .nav-item {
            padding: 6px 8px;
          }

          .resources {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
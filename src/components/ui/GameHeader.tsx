import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';

interface GameHeaderProps {
  currentRound: number;
  scheduledShows: number;
  compact?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ currentRound, scheduledShows, compact = false }) => {
  const { money, reputation, fans } = useGameStore();
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.header 
      className={`game-header ${compact ? 'compact' : ''}`}
      animate={{ height: expanded && !compact ? 80 : 50 }}
      transition={{ duration: 0.2 }}
    >
      <div className="header-content">
        {/* Compact Logo */}
        <div className="logo-section">
          <motion.h1 
            className="logo-compact"
            whileHover={{ scale: 1.05 }}
            onClick={() => !compact && setExpanded(!expanded)}
            animate={{ fontSize: compact ? 16 : 20 }}
          >
            B2B
          </motion.h1>
          <motion.div 
            className="round-badge"
            animate={{ scale: compact ? 0.9 : 1 }}
          >
            R{currentRound}
          </motion.div>
        </div>

        {/* Compact Resources */}
        <div className="resources-compact">
          <div className="resource-mini">
            <span className="resource-icon">💰</span>
            <span className="resource-value">${money < 1000 ? money : `${(money/1000).toFixed(1)}k`}</span>
          </div>
          <div className="resource-mini">
            <span className="resource-icon">⭐</span>
            <span className="resource-value">{reputation}</span>
          </div>
          <div className="resource-mini">
            <span className="resource-icon">👥</span>
            <span className="resource-value">{fans < 1000 ? fans : `${(fans/1000).toFixed(1)}k`}</span>
          </div>
          {scheduledShows > 0 && (
            <motion.div 
              className="resource-mini shows"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <span className="resource-icon">🎫</span>
              <span className="resource-value">{scheduledShows}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Expanded Info */}
      <AnimatePresence>
        {expanded && !compact && (
          <motion.div
            className="expanded-info"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="full-title">
              <span className="title-basement">BASEMENT</span>
              <span className="title-to">TO</span>
              <span className="title-breakthrough">BREAKTHROUGH</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .game-header {
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--border-default);
          position: relative;
          z-index: 10;
          overflow: hidden;
          transition: all var(--transition-base);
        }

        .game-header.compact {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          height: 50px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-compact {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: var(--punk-magenta);
          text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
          cursor: pointer;
          user-select: none;
        }

        .round-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .resources-compact {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .resource-mini {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          transition: all var(--transition-fast);
        }

        .compact .resource-mini {
          padding: 4px 8px;
          gap: 4px;
        }

        .resource-mini:hover {
          background: var(--bg-hover);
          transform: translateY(-1px);
        }

        .resource-mini.shows {
          border: 1px solid var(--info-purple);
        }

        .resource-icon {
          font-size: 14px;
        }

        .compact .resource-icon {
          font-size: 12px;
        }

        .resource-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .compact .resource-value {
          font-size: 12px;
        }

        .expanded-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0 20px 8px;
          display: flex;
          align-items: center;
        }

        .full-title {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .title-basement {
          color: var(--punk-magenta);
        }

        .title-to {
          color: var(--text-muted);
          font-size: 12px;
        }

        .title-breakthrough {
          color: var(--success-green);
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 0 16px;
          }

          .resources-compact {
            gap: 8px;
          }

          .resource-mini {
            padding: 4px 8px;
          }

          .resource-icon {
            font-size: 12px;
          }

          .resource-value {
            font-size: 12px;
          }
        }
      `}</style>
    </motion.header>
  );
};
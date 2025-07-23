import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@utils/mobile';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface NavigationTabsProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNextTurn?: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ 
  items, 
  activeTab, 
  onTabChange,
  onNextTurn 
}) => {
  return (
    <nav className="navigation-tabs">
      <div className="tabs-container">
        <div className="tabs-list">
          {items.map((item) => (
            <motion.button
              key={item.id}
              className={`tab-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(item.id);
                haptics.light();
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="tab-icon">{item.icon}</span>
              <span className="tab-label">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <motion.span 
                  className="tab-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {item.badge}
                </motion.span>
              )}
              {activeTab === item.id && (
                <motion.div
                  className="tab-indicator"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
        
        {onNextTurn && (
          <motion.button
            className="next-turn-button"
            onClick={() => {
              onNextTurn();
              haptics.success();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-text">Next Turn</span>
            <span className="button-icon">⏭️</span>
            <motion.div
              className="button-glow"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.button>
        )}
      </div>

      <style jsx>{`
        .navigation-tabs {
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--border-default);
          position: relative;
          z-index: 5;
        }

        .tabs-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 20px;
          height: 44px;
        }

        .tabs-list {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 100%;
        }

        .tab-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          height: 100%;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.025em;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-item:hover {
          color: var(--text-primary);
        }

        .tab-item.active {
          color: var(--punk-magenta);
        }

        .tab-icon {
          font-size: 18px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .tab-label {
          text-transform: uppercase;
        }

        .tab-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--info-purple);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            var(--punk-magenta) 50%, 
            transparent 100%
          );
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }

        .next-turn-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--success-emerald) 0%, var(--success-green) 100%);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all var(--transition-fast);
          overflow: hidden;
        }

        .next-turn-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .button-text {
          position: relative;
          z-index: 1;
        }

        .button-icon {
          font-size: 18px;
          position: relative;
          z-index: 1;
        }

        .button-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .tabs-container {
            padding: 0 16px;
            height: 48px;
          }

          .tab-item {
            padding: 0 12px;
            font-size: 12px;
          }

          .tab-icon {
            font-size: 18px;
          }

          .tab-label {
            display: none;
          }

          .next-turn-button {
            padding: 8px 16px;
            font-size: 12px;
          }

          .button-text {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};
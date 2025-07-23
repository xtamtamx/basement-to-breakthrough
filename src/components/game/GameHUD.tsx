import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { GamePhase } from '@game/types';
import { FactionDisplay } from './FactionDisplay';

interface GameHUDProps {
  currentTurn: number;
  phase: GamePhase;
  onEquipmentShop: () => void;
  onStressRelief: () => void;
  onSynergyCollection: () => void;
  onMasteryPanel: () => void;
  onExecuteShows?: () => void;
  canExecute?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentTurn,
  phase,
  onEquipmentShop,
  onStressRelief,
  onSynergyCollection,
  onMasteryPanel,
  onExecuteShows,
  canExecute
}) => {
  const { money, reputation, connections, stress, fans } = useGameStore();

  return (
    <>
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="glass-panel p-3 max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            {/* Turn & Phase Info */}
            <div>
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                TURN {currentTurn}
              </p>
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                {phase.replace('_', ' ')}
              </p>
            </div>

            {/* Resources */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                  ${money}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  MONEY
                </p>
              </div>
              <div className="text-center">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-magenta)' }}>
                  {reputation}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  REP
                </p>
              </div>
              <div className="text-center">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                  {connections}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  CONN
                </p>
              </div>
              <div className="text-center">
                <p className="pixel-text pixel-text-sm" style={{ 
                  color: stress > 70 ? 'var(--pixel-red)' : stress > 40 ? 'var(--pixel-yellow)' : 'var(--pixel-green)' 
                }}>
                  {stress}%
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  STRESS
                </p>
              </div>
              <div className="text-center">
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-blue)' }}>
                  {fans}
                </p>
                <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                  FANS
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={onEquipmentShop}
                className="pixel-button pixel-button-sm"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                GEAR
              </button>
              <button
                onClick={onStressRelief}
                className="pixel-button pixel-button-sm"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                RELIEF
              </button>
              <button
                onClick={onSynergyCollection}
                className="pixel-button pixel-button-sm"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                SYNERGIES
              </button>
              <button
                onClick={onMasteryPanel}
                className="pixel-button pixel-button-sm"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                MASTERY
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Elements */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          {/* Faction Display */}
          <div className="flex-shrink-0">
            <FactionDisplay />
          </div>

          {/* Execute Shows Button (Planning Phase) */}
          {phase === GamePhase.PLANNING && onExecuteShows && (
            <div className="flex-shrink-0">
              <motion.button
                onClick={onExecuteShows}
                disabled={!canExecute}
                className={`
                  pixel-button pixel-button-lg
                  ${canExecute ? 'pixel-button-primary' : 'pixel-button-disabled'}
                `}
                style={{ 
                  minWidth: '200px',
                  minHeight: '60px',
                  fontSize: '18px'
                }}
                whileHover={canExecute ? { scale: 1.05 } : {}}
                whileTap={canExecute ? { scale: 0.95 } : {}}
              >
                EXECUTE SHOWS
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
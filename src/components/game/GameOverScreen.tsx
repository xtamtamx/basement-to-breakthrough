import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';

interface GameOverScreenProps {
  reason: 'bankruptcy' | 'victory' | 'scene_collapse' | 'defeat';
  stats: {
    turnsPlayed: number;
    totalShows: number;
    totalRevenue: number;
    finalReputation: number;
    finalFans: number;
    score?: number;
    fameEarned?: number;
    newHighScore?: boolean;
    achievements?: any[];
    unlocks?: any[];
  };
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  reason,
  stats,
  onRestart,
  onMainMenu,
}) => {
  const isVictory = reason === 'victory';
  
  const getTitle = () => {
    switch (reason) {
      case 'bankruptcy': return 'BANKRUPT!';
      case 'victory': return 'LEGENDARY STATUS!';
      case 'scene_collapse': return 'SCENE COLLAPSED!';
      case 'defeat': return 'RUN ENDED';
    }
  };

  const getSubtitle = () => {
    switch (reason) {
      case 'bankruptcy': return 'You ran out of money...';
      case 'victory': return 'You built an underground empire!';
      case 'scene_collapse': return 'The scene rejected you...';
      case 'defeat': return 'Better luck next time...';
    }
  };

  const getColor = () => {
    return isVictory ? 'var(--pixel-yellow)' : 'var(--pixel-red)';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
        className="glass-panel p-6 max-w-md w-full text-center"
      >
        {/* Title */}
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pixel-text pixel-text-xl pixel-text-shadow mb-2"
          style={{ color: getColor(), textShadow: `0 0 30px ${getColor()}` }}
        >
          {getTitle()}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pixel-text pixel-text-sm mb-6"
          style={{ color: 'var(--pixel-gray)' }}
        >
          {getSubtitle()}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-6"
        >
          <div className="glass-panel-inset p-3">
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                TURNS SURVIVED
              </span>
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                {stats.turnsPlayed}
              </span>
            </div>
          </div>

          <div className="glass-panel-inset p-3">
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                SHOWS PLAYED
              </span>
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                {stats.totalShows}
              </span>
            </div>
          </div>

          <div className="glass-panel-inset p-3">
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                TOTAL REVENUE
              </span>
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                ${stats.totalRevenue}
              </span>
            </div>
          </div>

          <div className="glass-panel-inset p-3">
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                FINAL REPUTATION
              </span>
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-magenta)' }}>
                {stats.finalReputation}
              </span>
            </div>
          </div>

          <div className="glass-panel-inset p-3">
            <div className="flex justify-between">
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                FANS GATHERED
              </span>
              <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                {stats.finalFans}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Score and Fame */}
        {stats.score !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            className="glass-panel-raised p-4 mb-4"
            style={{ borderColor: isVictory ? 'var(--pixel-yellow)' : 'var(--pixel-cyan)' }}
          >
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
              FINAL SCORE
            </p>
            <p className="pixel-text pixel-text-xl" style={{ 
              color: isVictory ? 'var(--pixel-yellow)' : 'var(--pixel-cyan)',
              textShadow: `0 0 20px ${isVictory ? 'var(--pixel-yellow)' : 'var(--pixel-cyan)'}`
            }}>
              {stats.score.toLocaleString()}
            </p>
            {stats.newHighScore && (
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="pixel-text pixel-text-xs mt-2"
                style={{ color: 'var(--pixel-green)' }}
              >
                NEW HIGH SCORE!
              </motion.p>
            )}
          </motion.div>
        )}
        
        {/* Fame Earned */}
        {stats.fameEarned !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-panel p-3 mb-4"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
          >
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-purple)' }}>
              +{stats.fameEarned} FAME EARNED
            </p>
          </motion.div>
        )}
        
        {/* Achievements */}
        {stats.achievements && stats.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-4"
          >
            <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-gray)' }}>
              ACHIEVEMENTS UNLOCKED
            </p>
            <div className="flex justify-center gap-2">
              {stats.achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="text-2xl"
                  title={achievement.name}
                >
                  {achievement.icon}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={() => {
              haptics.heavy();
              onRestart();
            }}
            className="w-full glass-button p-3"
            style={{
              background: isVictory ? 
                'linear-gradient(45deg, var(--pixel-yellow), var(--pixel-green))' :
                'linear-gradient(45deg, var(--pixel-magenta), var(--pixel-cyan))'
            }}
          >
            <span className="pixel-text pixel-text-sm">TRY AGAIN</span>
          </button>

          <button
            onClick={() => {
              haptics.light();
              onMainMenu();
            }}
            className="w-full glass-button p-3"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <span className="pixel-text pixel-text-sm">MAIN MENU</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
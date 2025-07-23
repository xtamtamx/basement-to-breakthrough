import React from 'react';
import { motion } from 'framer-motion';
import { RunConfig } from '@game/mechanics/RunManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface CleanMainMenuProps {
  onStartGame: (runConfig?: RunConfig) => void;
}

export const CleanMainMenu: React.FC<CleanMainMenuProps> = ({ onStartGame }) => {
  const handleQuickPlay = () => {
    haptics.success();
    audio.play('success');
    onStartGame();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        backgroundImage: `
          linear-gradient(rgba(236,72,153,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(236,72,153,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          zIndex: 10
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '60px' }}
        >
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ec4899',
            marginBottom: '10px',
            letterSpacing: '2px'
          }}>
            BASEMENT TO
          </h1>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: '20px',
            letterSpacing: '2px'
          }}>
            BREAKTHROUGH
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            letterSpacing: '1px'
          }}>
            Build Your Underground Music Empire
          </p>
        </motion.div>

        {/* Menu Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center'
        }}>
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickPlay}
            style={{
              padding: '20px 60px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            START GAME
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '15px 50px',
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '2px solid #374151',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.color = '#ec4899';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            HOW TO PLAY
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '15px 50px',
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '2px solid #374151',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.color = '#ec4899';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            SETTINGS
          </motion.button>
        </div>

        {/* Version Info */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#4b5563'
        }}>
          v1.0.0 - Premium Edition
        </div>
      </motion.div>
    </div>
  );
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RunSelectionScreen } from './RunSelectionScreen';
import { RunConfig } from '@game/mechanics/RunManager';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface MainMenuProps {
  onStartGame: (runConfig?: RunConfig) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [showRunSelection, setShowRunSelection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  
  const handleQuickPlay = () => {
    haptics.success();
    audio.play('success');
    onStartGame(); // Start with default settings
  };
  
  const handleRunSelect = () => {
    haptics.light();
    audio.play('click');
    setShowRunSelection(true);
  };
  
  const handleStartRun = (runConfig: RunConfig) => {
    setShowRunSelection(false);
    onStartGame(runConfig);
  };
  
  if (showRunSelection) {
    return (
      <RunSelectionScreen 
        onStartRun={handleStartRun}
        onBack={() => setShowRunSelection(false)}
      />
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gray-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
      }}
    >
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #444 0, #444 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #444 0, #444 1px, transparent 1px, transparent 40px)',
        }}
      />
      
      {/* Logo/Title */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="pixel-text pixel-text-4xl mb-4" style={{ color: 'var(--pixel-yellow)' }}>
            BASEMENT TO
          </h1>
          <h1 className="pixel-text pixel-text-4xl mb-8" style={{ color: 'var(--pixel-cyan)' }}>
            BREAKTHROUGH
          </h1>
          <p className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-white)' }}>
            Build Your Underground Music Empire
          </p>
        </motion.div>
        
        {/* Menu Options */}
        <div className="space-y-4 w-full max-w-md">
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickPlay}
            className="w-full pixel-button p-6"
            style={{ backgroundColor: 'var(--pixel-green)' }}
          >
            <span className="pixel-text pixel-text-xl">QUICK PLAY</span>
          </motion.button>
          
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRunSelect}
            className="w-full pixel-button p-6"
            style={{
              background: 'linear-gradient(45deg, var(--pixel-purple), var(--pixel-magenta))',
            }}
          >
            <span className="pixel-text pixel-text-xl">NEW RUN</span>
            <p className="pixel-text pixel-text-xs mt-1" style={{ opacity: 0.8 }}>
              Choose difficulty & unlock rewards
            </p>
          </motion.button>
          
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptics.light();
              audio.play('click');
              setShowSettings(true);
            }}
            className="w-full pixel-button p-4"
            style={{ backgroundColor: 'var(--pixel-blue)' }}
          >
            <span className="pixel-text pixel-text-lg">SETTINGS</span>
          </motion.button>
          
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptics.light();
              audio.play('click');
              setShowCredits(true);
            }}
            className="w-full pixel-button p-4"
            style={{ backgroundColor: 'var(--pixel-orange)' }}
          >
            <span className="pixel-text pixel-text-lg">CREDITS</span>
          </motion.button>
        </div>
        
        {/* Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-4 right-4"
        >
          <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
            v0.1.0 ALPHA
          </p>
        </motion.div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 max-w-md w-full"
            >
              <h2 className="pixel-text pixel-text-xl mb-6" style={{ color: 'var(--pixel-yellow)' }}>
                SETTINGS
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
                    Master Volume
                  </label>
                  <input type="range" className="w-full mt-2" />
                </div>
                
                <div>
                  <label className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
                    Haptics
                  </label>
                  <input type="checkbox" className="mt-2" defaultChecked />
                </div>
                
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="pixel-button p-3 w-full"
                  style={{ backgroundColor: 'var(--pixel-red)' }}
                >
                  <span className="pixel-text">RESET ALL DATA</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowSettings(false)}
                className="pixel-button p-3 w-full mt-6"
                style={{ backgroundColor: 'var(--pixel-gray)' }}
              >
                <span className="pixel-text">CLOSE</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Credits Modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 max-w-md w-full text-center"
            >
              <h2 className="pixel-text pixel-text-xl mb-6" style={{ color: 'var(--pixel-yellow)' }}>
                CREDITS
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-cyan)' }}>
                    GAME DESIGN & DEVELOPMENT
                  </p>
                  <p className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-white)' }}>
                    Your Studio Name
                  </p>
                </div>
                
                <div>
                  <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-magenta)' }}>
                    SPECIAL THANKS
                  </p>
                  <p className="pixel-text" style={{ color: 'var(--pixel-white)' }}>
                    The Underground Music Scene
                  </p>
                </div>
                
                <div>
                  <p className="pixel-text pixel-text-xs mt-8" style={{ color: 'var(--pixel-gray)' }}>
                    Made with ❤️ for the underground
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowCredits(false)}
                className="pixel-button p-3 w-full mt-6"
                style={{ backgroundColor: 'var(--pixel-gray)' }}
              >
                <span className="pixel-text">CLOSE</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamePhase } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface PhaseTransitionProps {
  currentPhase: GamePhase;
  previousPhase: GamePhase | null;
  onComplete?: () => void;
}

const phaseMessages: Record<GamePhase, { title: string; subtitle: string; color: string }> = {
  [GamePhase.MENU]: { title: 'MAIN MENU', subtitle: 'Welcome to the underground', color: 'var(--punk-neon-purple)' },
  [GamePhase.SETUP]: { title: 'SETUP', subtitle: 'Preparing your scene', color: 'var(--punk-neon-cyan)' },
  [GamePhase.PLANNING]: { title: 'BOOKING PHASE', subtitle: 'Build your lineups', color: 'var(--pixel-yellow)' },
  [GamePhase.BOOKING]: { title: 'BOOKING', subtitle: 'Securing venues', color: 'var(--pixel-green)' },
  [GamePhase.PROMOTION]: { title: 'PROMOTION', subtitle: 'Spread the word', color: 'var(--pixel-orange)' },
  [GamePhase.PERFORMANCE]: { title: 'SHOWTIME', subtitle: 'The bands take the stage', color: 'var(--pixel-red)' },
  [GamePhase.SHOW_NIGHT]: { title: 'SHOW NIGHT', subtitle: 'Live from the underground', color: 'var(--punk-neon-purple)' },
  [GamePhase.AFTERMATH]: { title: 'AFTERMATH', subtitle: 'Counting the damage', color: 'var(--pixel-magenta)' },
  [GamePhase.SCENE_POLITICS]: { title: 'SCENE POLITICS', subtitle: 'Navigate the drama', color: 'var(--pixel-blue)' },
  [GamePhase.GAME_OVER]: { title: 'GAME OVER', subtitle: 'The scene remembers', color: 'var(--pixel-red)' }
};

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({
  currentPhase,
  previousPhase,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (previousPhase && previousPhase !== currentPhase) {
      setIsVisible(true);
      
      // Haptic feedback
      haptics.medium();
      
      // Audio feedback
      audio.play('success');
      
      // Auto hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [currentPhase, previousPhase, onComplete]);
  
  const phaseInfo = phaseMessages[currentPhase];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 5000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background fade */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Phase announcement */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [180, 0],
              }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                duration: 0.6,
                type: 'spring',
                stiffness: 200
              }}
            >
              <div className="text-center">
                {/* Glitch effect background */}
                <motion.div
                  className="absolute inset-0 -z-10"
                  animate={{
                    x: [0, -5, 5, -5, 5, 0],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: 3
                  }}
                >
                  <h1 
                    className="punk-headline text-6xl md:text-8xl"
                    style={{ 
                      color: phaseInfo.color,
                      filter: 'blur(2px)'
                    }}
                  >
                    {phaseInfo.title}
                  </h1>
                </motion.div>
                
                {/* Main title */}
                <motion.h1 
                  className="punk-headline text-6xl md:text-8xl mb-4"
                  style={{ 
                    color: phaseInfo.color,
                    textShadow: `
                      0 0 10px ${phaseInfo.color},
                      0 0 20px ${phaseInfo.color},
                      0 0 30px ${phaseInfo.color},
                      0 0 40px ${phaseInfo.color}
                    `
                  }}
                  animate={{
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                >
                  {phaseInfo.title}
                </motion.h1>
                
                {/* Subtitle */}
                <motion.p 
                  className="pixel-text pixel-text-lg"
                  style={{ color: 'var(--pixel-white)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {phaseInfo.subtitle}
                </motion.p>
                
                {/* Loading bars */}
                <motion.div 
                  className="flex justify-center gap-2 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-2"
                      style={{ backgroundColor: phaseInfo.color }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        delay: 0.7 + i * 0.1,
                        duration: 0.3
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
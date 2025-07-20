import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@utils/mobile';

interface SimpleTutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "WELCOME TO THE UNDERGROUND",
    content: "Build your music empire from basement shows to legendary venues!",
    highlight: null,
  },
  {
    title: "BOOK SHOWS",
    content: "Drag bands to venues to book shows. Match band styles with venue vibes for best results!",
    highlight: "bands",
  },
  {
    title: "MANAGE RESOURCES",
    content: "Keep an eye on your money, reputation, and fans. Run out of money and it's game over!",
    highlight: "resources",
  },
  {
    title: "EXECUTE SHOWS",
    content: "Once you've booked shows, hit the execute button to see how they perform!",
    highlight: "execute",
  },
  {
    title: "REACH LEGENDARY STATUS",
    content: "Get to 100 reputation to achieve legendary status and win the game!",
    highlight: null,
  },
];

export const SimpleTutorial: React.FC<SimpleTutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    haptics.light();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('tutorialCompleted', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    haptics.light();
    localStorage.setItem('tutorialCompleted', 'true');
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        {/* Tutorial Card */}
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="glass-panel p-6 max-w-md w-full text-center"
        >
          {/* Progress */}
          <div className="flex justify-center gap-1 mb-4">
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i <= currentStep ? 'var(--pixel-yellow)' : 'var(--pixel-gray)',
                  opacity: i <= currentStep ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <motion.h2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pixel-text pixel-text-lg pixel-text-shadow mb-4"
            style={{ color: 'var(--pixel-yellow)' }}
          >
            {step.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="pixel-text pixel-text-sm mb-6"
            style={{ color: 'var(--pixel-white)', lineHeight: '1.5' }}
          >
            {step.content}
          </motion.p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 glass-button p-3"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <span className="pixel-text pixel-text-sm">SKIP</span>
            </button>
            <button
              onClick={handleNext}
              className="flex-1 glass-button p-3"
              style={{
                background: 'linear-gradient(45deg, var(--pixel-magenta), var(--pixel-cyan))',
                boxShadow: '0 0 20px var(--pixel-magenta)',
              }}
            >
              <span className="pixel-text pixel-text-sm">
                {currentStep < tutorialSteps.length - 1 ? 'NEXT' : 'START GAME'}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Visual hints */}
        {step.highlight === 'bands' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/4 left-1/2 transform -translate-x-1/2"
          >
            <div className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
              ↓ DRAG THESE ↓
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
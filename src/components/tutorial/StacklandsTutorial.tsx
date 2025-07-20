import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  highlight?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'center';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'WELCOME TO BASEMENT TO BREAKTHROUGH!',
    content: 'Build your underground music empire using a card-based system. Drag cards around freely to organize your scene.',
    position: 'center'
  },
  {
    id: 'bands',
    title: 'BAND CARDS',
    content: 'These are your bands. Each has unique stats like Popularity, Energy, and Authenticity. Drag them around to organize.',
    position: 'top'
  },
  {
    id: 'venues',
    title: 'VENUE CARDS',
    content: 'Venues host your shows. Each has different capacity, atmosphere, and rent costs.',
    position: 'top'
  },
  {
    id: 'booking',
    title: 'BOOKING SHOWS',
    content: 'Drag a band card onto a venue card to book a show. The cards will snap together!',
    position: 'center'
  },
  {
    id: 'bills',
    title: 'CREATING BILLS',
    content: 'Stack multiple bands together FIRST, then drag the stack to a venue for multi-band shows!',
    position: 'center'
  },
  {
    id: 'resources',
    title: 'MANAGE RESOURCES',
    content: 'Keep an eye on your Money, Reputation, Connections, and Stress levels at the top.',
    position: 'top'
  },
  {
    id: 'stress',
    title: 'STRESS MANAGEMENT',
    content: 'Click on your stress percentage to access stress relief options. High stress hurts performance!',
    position: 'top'
  },
  {
    id: 'equipment',
    title: 'EQUIPMENT & UPGRADES',
    content: 'Use the Equipment and Upgrades buttons to improve your venues and buy gear.',
    position: 'top'
  },
  {
    id: 'execute',
    title: 'EXECUTE SHOWS',
    content: 'Once you\'ve booked shows, click the EXECUTE button at the bottom to run them and see results!',
    position: 'bottom'
  },
  {
    id: 'factions',
    title: 'SCENE POLITICS',
    content: 'Different factions in the scene will react to your choices. Build relationships wisely!',
    position: 'bottom'
  }
];

interface StacklandsTutorialProps {
  onComplete: () => void;
}

export const StacklandsTutorial: React.FC<StacklandsTutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const step = tutorialSteps[currentStep];
  
  const handleNext = () => {
    haptics.light();
    audio.play('click');
    
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete tutorial
      localStorage.setItem('stacklands-tutorial-completed', 'true');
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }
  };
  
  const handleSkip = () => {
    haptics.light();
    audio.play('click');
    localStorage.setItem('stacklands-tutorial-completed', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Tutorial Box */}
        <motion.div
          key={step.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className={`absolute ${
            step.position === 'top' ? 'top-20 left-1/2 -translate-x-1/2' :
            step.position === 'bottom' ? 'bottom-32 left-1/2 -translate-x-1/2' :
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          } w-[90%] max-w-md pointer-events-auto`}
        >
          <div className="glass-panel p-6">
            {/* Progress */}
            <div className="flex gap-1 mb-4">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className="h-1 flex-1 rounded"
                  style={{
                    backgroundColor: index <= currentStep 
                      ? 'var(--pixel-cyan)' 
                      : 'var(--pixel-gray)'
                  }}
                />
              ))}
            </div>
            
            {/* Content */}
            <h3 className="pixel-text pixel-text-lg mb-3" style={{ color: 'var(--pixel-yellow)' }}>
              {step.title}
            </h3>
            <p className="pixel-text pixel-text-sm mb-6" style={{ color: 'var(--pixel-white)' }}>
              {step.content}
            </p>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="pixel-button px-4 py-2"
                style={{ backgroundColor: 'var(--pixel-gray)' }}
              >
                <span className="pixel-text pixel-text-xs">SKIP</span>
              </button>
              <button
                onClick={handleNext}
                className="flex-1 pixel-button px-4 py-2"
                style={{ backgroundColor: 'var(--pixel-green)' }}
              >
                <span className="pixel-text pixel-text-xs">
                  {currentStep < tutorialSteps.length - 1 ? 'NEXT' : 'START PLAYING'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Arrows for specific steps */}
        {step.id === 'bands' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute left-10 top-1/3 pointer-events-none"
          >
            <div className="text-4xl animate-bounce">👈</div>
          </motion.div>
        )}
        
        {step.id === 'venues' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-10 top-1/3 pointer-events-none"
          >
            <div className="text-4xl animate-bounce">👉</div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
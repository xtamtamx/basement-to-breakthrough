import React, { useState, useEffect } from 'react';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';
import { tutorialManager, TutorialStep } from '@game/mechanics/TutorialSystem';
import { UI_CONSTANTS } from '@game/constants/GameConstants';

export const TutorialOverlay: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Subscribe to tutorial step changes
    tutorialManager.onStepChangeHandler((step) => {
      setCurrentStep(step);
      
      // Update highlighted element
      if (step?.target) {
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('tutorial-highlight');
        } else {
          setHighlightedElement(null);
        }
      } else {
        setHighlightedElement(null);
      }
    });
    
    // Check if we should start tutorial
    if (tutorialManager.shouldShowTutorial()) {
      setTimeout(() => tutorialManager.startTutorial(), 500);
    }
    
    // Cleanup
    return () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, []);

  const handleNext = () => {
    haptics.light();
    audio.tap();
    tutorialManager.nextStep();
  };

  const handlePrevious = () => {
    haptics.light();
    audio.tap();
    tutorialManager.previousStep();
  };

  const handleSkip = () => {
    haptics.light();
    audio.tap();
    if (confirm('Skip the tutorial? You can restart it from settings later.')) {
      tutorialManager.skipTutorial();
    }
  };

  const getTooltipPosition = () => {
    if (!highlightedElement || !currentStep?.position) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const positions = {
      top: {
        bottom: `${window.innerHeight - rect.top + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      bottom: {
        top: `${rect.bottom + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      left: {
        top: `${rect.top + rect.height / 2}px`,
        right: `${window.innerWidth - rect.left + 10}px`,
        transform: 'translateY(-50%)',
      },
      right: {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 10}px`,
        transform: 'translateY(-50%)',
      },
      center: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
    };

    return positions[currentStep.position] || positions.center;
  };
  
  if (!currentStep) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/80 z-50" onClick={handleNext}>
        {/* Highlight cutout */}
        {highlightedElement && (
          <div
            className="absolute bg-black"
            style={{
              clipPath: `polygon(
                0 0,
                0 100%,
                ${highlightedElement.offsetLeft - 8}px 100%,
                ${highlightedElement.offsetLeft - 8}px ${highlightedElement.offsetTop - 8}px,
                ${highlightedElement.offsetLeft + highlightedElement.offsetWidth + 8}px ${highlightedElement.offsetTop - 8}px,
                ${highlightedElement.offsetLeft + highlightedElement.offsetWidth + 8}px ${highlightedElement.offsetTop + highlightedElement.offsetHeight + 8}px,
                ${highlightedElement.offsetLeft - 8}px ${highlightedElement.offsetTop + highlightedElement.offsetHeight + 8}px,
                ${highlightedElement.offsetLeft - 8}px 100%,
                100% 100%,
                100% 0
              )`,
            }}
          />
        )}
      </div>

      {/* Tutorial tooltip */}
      <div
        className="fixed z-50 bg-metal-900 rounded-lg p-4 max-w-sm shadow-2xl border-2 border-punk-600"
        style={getTooltipPosition()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress indicator */}
        <div className="flex gap-1 mb-3">
          <div className="h-1 flex-1 rounded-full bg-punk-600" />
        </div>

        {/* Content */}
        <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
        <p className="text-sm text-metal-300 mb-4">{currentStep.description}</p>

        {/* Action hint */}
        {currentStep.action && (
          <div className="bg-metal-800 rounded p-2 mb-4 text-xs text-punk-400">
            💡 Complete action to continue
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={handleNext}
            className="flex-1 py-2 px-4 bg-punk-600 rounded font-bold text-sm hover:bg-punk-700 active:scale-95"
          >
            {currentStep.action ? 'Waiting...' : 'Next'}
          </button>

          <button
            onClick={handleSkip}
            className="py-2 px-4 text-metal-500 text-sm hover:text-white"
          >
            Skip
          </button>
        </div>
      </div>
    </>
  );
};
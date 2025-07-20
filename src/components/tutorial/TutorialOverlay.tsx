import React, { useState, useEffect } from 'react';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string; // Required action to proceed
  showSkip?: boolean;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip?: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const step = steps[currentStep];

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class
        element.classList.add('tutorial-highlight');
        
        return () => {
          element.classList.remove('tutorial-highlight');
        };
      }
    } else {
      setHighlightedElement(null);
    }
  }, [step]);

  const handleNext = () => {
    haptics.light();
    audio.tap();
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    haptics.light();
    audio.tap();
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    haptics.light();
    audio.tap();
    onSkip?.();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement || !step.position) {
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

    return positions[step.position] || positions.center;
  };

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
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-punk-600' : 'bg-metal-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-sm text-metal-300 mb-4">{step.content}</p>

        {/* Action hint */}
        {step.action && (
          <div className="bg-metal-800 rounded p-2 mb-4 text-xs text-punk-400">
            💡 {step.action}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-2 px-4 bg-metal-800 rounded font-bold text-sm hover:bg-metal-700 active:scale-95"
            >
              Back
            </button>
          )}
          
          <button
            onClick={handleNext}
            className="flex-1 py-2 px-4 bg-punk-600 rounded font-bold text-sm hover:bg-punk-700 active:scale-95"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>

          {step.showSkip && onSkip && (
            <button
              onClick={handleSkip}
              className="py-2 px-4 text-metal-500 text-sm hover:text-white"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </>
  );
};
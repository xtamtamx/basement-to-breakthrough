import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@utils/mobile';
import { tutorialManager, TutorialStep } from '@game/tutorial/TutorialManager';

export const TutorialOverlay: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [highlightBounds, setHighlightBounds] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to tutorial updates
    const unsubscribe = tutorialManager.onUpdate(() => {
      setCurrentStep(tutorialManager.getCurrentStep());
      setProgress(tutorialManager.getCurrentProgress());
    });

    // Initialize current state
    setCurrentStep(tutorialManager.getCurrentStep());
    setProgress(tutorialManager.getCurrentProgress());

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentStep?.target) {
      // Find target element and calculate bounds
      const targetElement = document.querySelector(currentStep.target);
      if (targetElement) {
        const bounds = targetElement.getBoundingClientRect();
        setHighlightBounds(bounds);

        // Set up click listener if needed
        if (currentStep.nextTrigger === 'action' || currentStep.action === 'click') {
          const handleClick = () => {
            tutorialManager.nextStep();
            haptics.light();
          };
          targetElement.addEventListener('click', handleClick);
          return () => targetElement.removeEventListener('click', handleClick);
        }
      }
    } else {
      setHighlightBounds(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    tutorialManager.nextStep();
    haptics.light();
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip the tutorial? You can resume it later from settings.')) {
      tutorialManager.skipTutorial();
      haptics.light();
    }
  };

  const getTooltipPosition = () => {
    if (!highlightBounds || !currentStep.position) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate

    switch (currentStep.position) {
      case 'top':
        return {
          top: highlightBounds.top - tooltipHeight - padding,
          left: highlightBounds.left + highlightBounds.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
      case 'bottom':
        return {
          top: highlightBounds.bottom + padding,
          left: highlightBounds.left + highlightBounds.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
      case 'left':
        return {
          top: highlightBounds.top + highlightBounds.height / 2 - tooltipHeight / 2,
          left: highlightBounds.left - tooltipWidth - padding,
          transform: 'none'
        };
      case 'right':
        return {
          top: highlightBounds.top + highlightBounds.height / 2 - tooltipHeight / 2,
          left: highlightBounds.right + padding,
          transform: 'none'
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };
  
  if (!currentStep) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop with highlight cutout */}
        <div className="tutorial-backdrop">
          {highlightBounds && (
            <div
              className="tutorial-highlight"
              style={{
                top: highlightBounds.top - (currentStep.highlightPadding || 5),
                left: highlightBounds.left - (currentStep.highlightPadding || 5),
                width: highlightBounds.width + (currentStep.highlightPadding || 5) * 2,
                height: highlightBounds.height + (currentStep.highlightPadding || 5) * 2,
              }}
            />
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          className="tutorial-tooltip"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={getTooltipPosition()}
        >
          {/* Progress indicator */}
          <div className="tutorial-progress">
            <div className="progress-dots">
              {Array.from({ length: progress.total }, (_, i) => (
                <div
                  key={i}
                  className={`progress-dot ${i < progress.current ? 'active' : ''}`}
                />
              ))}
            </div>
            <button
              className="skip-button"
              onClick={handleSkip}
              title="Skip tutorial"
            >
              Skip
            </button>
          </div>

          {/* Content */}
          <div className="tutorial-content">
            <h3 className="tutorial-title">{currentStep.title}</h3>
            <div 
              className="tutorial-description"
              dangerouslySetInnerHTML={{ __html: currentStep.content.replace(/\n/g, '<br>') }}
            />
          </div>

          {/* Actions */}
          <div className="tutorial-actions">
            {currentStep.nextTrigger === 'click' && (
              <button
                className="tutorial-button tutorial-button-primary"
                onClick={handleNext}
              >
                Next
              </button>
            )}
            {currentStep.nextTrigger === 'action' && (
              <div className="tutorial-hint">
                {currentStep.action === 'click' ? '👆 Click the highlighted element' : 'Complete the action to continue'}
              </div>
            )}
            {currentStep.nextTrigger === 'auto' && (
              <div className="tutorial-hint">Continuing automatically...</div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
        }

        .tutorial-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          pointer-events: all;
        }

        .tutorial-highlight {
          position: absolute;
          border: 3px solid var(--punk-magenta);
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
          animation: pulse-highlight 2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 
              0 0 0 9999px rgba(0, 0, 0, 0.8),
              0 0 20px rgba(236, 72, 153, 0.5);
          }
          50% {
            box-shadow: 
              0 0 0 9999px rgba(0, 0, 0, 0.8),
              0 0 40px rgba(236, 72, 153, 0.8);
          }
        }

        .tutorial-tooltip {
          position: absolute;
          width: 320px;
          max-width: calc(100vw - 40px);
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          pointer-events: all;
          overflow: hidden;
        }

        .tutorial-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-default);
        }

        .progress-dots {
          display: flex;
          gap: 6px;
        }

        .progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--bg-hover);
          transition: all var(--transition-fast);
        }

        .progress-dot.active {
          background: var(--punk-magenta);
          box-shadow: 0 0 8px rgba(236, 72, 153, 0.5);
        }

        .skip-button {
          padding: 4px 12px;
          background: none;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .skip-button:hover {
          border-color: var(--danger-red);
          color: var(--danger-red);
        }

        .tutorial-content {
          padding: 20px;
        }

        .tutorial-title {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tutorial-description {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }

        .tutorial-description strong {
          color: var(--text-primary);
          font-weight: 600;
        }

        .tutorial-actions {
          padding: 16px 20px;
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border-default);
        }

        .tutorial-button {
          width: 100%;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tutorial-button-primary {
          background: var(--punk-magenta);
          color: white;
        }

        .tutorial-button-primary:hover {
          background: var(--metal-red);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
        }

        .tutorial-hint {
          text-align: center;
          color: var(--text-secondary);
          font-size: 13px;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .tutorial-tooltip {
            width: calc(100vw - 32px);
            margin: 0 16px;
          }

          .tutorial-content {
            padding: 16px;
          }

          .tutorial-title {
            font-size: 16px;
          }

          .tutorial-description {
            font-size: 13px;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};
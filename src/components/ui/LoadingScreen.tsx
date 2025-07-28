import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomSatiricalText } from '@game/data/satiricalText';

interface LoadingScreenProps {
  isLoading?: boolean;
  message?: string;
  customMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading = true, message, customMessage }) => {
  const [currentTip, setCurrentTip] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // Set initial tip
      setCurrentTip(getRandomSatiricalText('loadingTips'));
      
      // Rotate tips every 3 seconds
      const interval = setInterval(() => {
        setCurrentTip(getRandomSatiricalText('loadingTips'));
        setTipIndex(prev => prev + 1);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="loading-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="loading-content">
          <motion.div
            className="loading-logo"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <h1 className="loading-title">
              {customMessage ? (
                <span className="punk">{customMessage}</span>
              ) : (
                <>
                  <span className="punk">DIY</span>
                  <span className="metal">INDIE</span>
                  <span className="empire">EMPIRE</span>
                </>
              )}
            </h1>
          </motion.div>

          <div className="loading-spinner">
            <motion.div
              className="spinner-ring"
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          {message && (
            <motion.p
              className="loading-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.p>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              className="loading-tip"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <span className="tip-label">SCENE REPORT:</span>
              <p className="tip-text">{currentTip}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <style jsx>{`
          .loading-screen {
            position: fixed;
            inset: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }

          .loading-content {
            text-align: center;
            max-width: 600px;
            padding: 20px;
          }

          .loading-logo {
            margin-bottom: 40px;
          }

          .loading-title {
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 900;
            letter-spacing: 0.05em;
            margin: 0;
          }

          .punk {
            color: var(--punk-magenta);
            text-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
          }

          .metal {
            color: var(--metal-red);
            text-shadow: 0 0 20px rgba(220, 38, 38, 0.8);
            margin: 0 0.2em;
          }

          .empire {
            color: var(--success-green);
            text-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
          }

          .loading-spinner {
            width: 60px;
            height: 60px;
            margin: 0 auto 30px;
            position: relative;
          }

          .spinner-ring {
            position: absolute;
            inset: 0;
            border: 3px solid rgba(236, 72, 153, 0.2);
            border-top-color: var(--punk-magenta);
            border-radius: 50%;
          }

          .loading-message {
            font-size: 1.1rem;
            color: var(--text-primary);
            margin-bottom: 30px;
            font-weight: 600;
          }

          .loading-tip {
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 8px;
            padding: 20px;
            text-align: left;
            margin-top: 20px;
          }

          .tip-label {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--punk-magenta);
            margin-bottom: 8px;
          }

          .tip-text {
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--text-secondary);
            margin: 0;
            font-style: italic;
          }

          @media (max-width: 768px) {
            .loading-content {
              padding: 16px;
            }

            .loading-title {
              font-size: 1.5rem;
            }

            .loading-tip {
              padding: 16px;
              font-size: 0.85rem;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};
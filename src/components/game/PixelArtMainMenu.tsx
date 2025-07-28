import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalkerSprite } from '@components/graphics/PixelArtSprites';
import { PixelButton } from '@components/ui/PixelButton';
import { haptics } from '@utils/mobile';

interface PixelArtMainMenuProps {
  onStartGame: () => void;
  onContinueGame?: () => void;
  onSettings?: () => void;
  hasSavedGame?: boolean;
}

export const PixelArtMainMenu: React.FC<PixelArtMainMenuProps> = ({
  onStartGame,
  onContinueGame,
  onSettings,
  hasSavedGame = false,
}) => {
  const [glitchText, setGlitchText] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pixel-main-menu">
      {/* Animated background elements */}
      <div className="background-walkers">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="walker"
            initial={{ x: -50, y: 50 + i * 100 }}
            animate={{
              x: window.innerWidth + 50,
              y: 50 + i * 100 + Math.sin(i) * 20,
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2,
            }}
          >
            <WalkerSprite pixelSize={3} />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="menu-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title */}
        <motion.div
          className="game-title"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <h1 className={`title-text ${glitchText ? 'glitch' : ''}`}>
            DIY INDIE
          </h1>
          <h2 className="subtitle-text">
            EMPIRE
          </h2>
          <p className="tagline">
            Underground Music Scene Simulator
          </p>
        </motion.div>

        {/* Menu buttons */}
        <motion.div
          className="menu-buttons"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {hasSavedGame && onContinueGame && (
            <PixelButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                haptics.medium();
                onContinueGame();
              }}
              icon="▶️"
            >
              Continue
            </PixelButton>
          )}
          
          <PixelButton
            variant={hasSavedGame ? "secondary" : "primary"}
            size="lg"
            fullWidth
            onClick={() => {
              haptics.medium();
              onStartGame();
            }}
            icon="🎸"
          >
            New Game
          </PixelButton>
          
          {onSettings && (
            <PixelButton
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => {
                haptics.light();
                onSettings();
              }}
              icon="⚙️"
            >
              Settings
            </PixelButton>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="menu-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="credits">
            A game about DIY ethics vs selling out
          </p>
          <p className="version">
            v1.0.0 • Made with ❤️ and 🤘
          </p>
        </motion.div>
      </motion.div>

      <style>{`
        .pixel-main-menu {
          position: relative;
          min-height: 100vh;
          background: #0A0A0A;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: monospace;
        }

        .background-walkers {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.3;
        }

        .walker {
          position: absolute;
        }

        .menu-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 400px;
          padding: 20px;
          text-align: center;
        }

        .game-title {
          margin-bottom: 48px;
        }

        .title-text {
          font-size: 56px;
          font-weight: 900;
          color: #FF0066;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
          text-shadow: 
            4px 4px 0px #8B0000,
            8px 8px 0px #000,
            8px 8px 20px rgba(255, 0, 102, 0.5);
          image-rendering: pixelated;
          transform: perspective(300px) rotateY(-5deg);
        }

        .title-text.glitch {
          animation: glitch 100ms steps(2);
        }

        @keyframes glitch {
          0% {
            text-shadow: 
              4px 4px 0px #8B0000,
              8px 8px 0px #000,
              8px 8px 20px rgba(255, 0, 102, 0.5);
          }
          50% {
            text-shadow: 
              -4px 4px 0px #00FF00,
              4px -4px 0px #0088FF,
              8px 8px 0px #000,
              8px 8px 20px rgba(255, 0, 102, 0.5);
          }
          100% {
            text-shadow: 
              4px 4px 0px #8B0000,
              8px 8px 0px #000,
              8px 8px 20px rgba(255, 0, 102, 0.5);
          }
        }

        .subtitle-text {
          font-size: 36px;
          font-weight: 700;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: -10px 0 0;
          text-shadow: 
            2px 2px 0px #2D2D2D,
            4px 4px 0px #000;
        }

        .tagline {
          font-size: 14px;
          color: #8B8B8B;
          margin: 16px 0 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 48px;
        }

        .menu-footer {
          text-align: center;
        }

        .credits {
          font-size: 12px;
          color: #5A5A5A;
          margin: 0 0 8px;
          letter-spacing: 0.05em;
        }

        .version {
          font-size: 10px;
          color: #2D2D2D;
          margin: 0;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .title-text {
            font-size: 42px;
          }

          .subtitle-text {
            font-size: 28px;
          }

          .tagline {
            font-size: 12px;
          }

          .menu-content {
            padding: 20px 16px;
          }
        }

        @media (max-height: 700px) {
          .game-title {
            margin-bottom: 32px;
          }

          .menu-buttons {
            margin-bottom: 32px;
          }
        }
      `}</style>
    </div>
  );
};
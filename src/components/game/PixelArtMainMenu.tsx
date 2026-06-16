import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalkerSprite } from '@components/graphics/PixelArtSprites';
import { PixelButton } from '@components/ui/PixelButton';
import { haptics } from '@utils/mobile';

interface PixelArtMainMenuProps {
  onStartGame: () => void;
  onContinueGame?: () => void;
  onSettings?: () => void;
  onUpgrades?: () => void;
  hasSavedGame?: boolean;
}

export const PixelArtMainMenu: React.FC<PixelArtMainMenuProps> = ({
  onStartGame,
  onContinueGame,
  onSettings,
  onUpgrades,
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
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
          
          {onUpgrades && (
            <PixelButton
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => {
                haptics.light();
                onUpgrades();
              }}
              icon="⭐"
            >
              Scene Cred
            </PixelButton>
          )}

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
          background: #0a0814;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
          font-family: 'Press Start 2P', ui-monospace, monospace;
          -webkit-font-smoothing: none;
          padding: 40px 20px;
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
          padding: 40px 20px 20px;
          text-align: center;
        }

        .game-title {
          margin-bottom: 40px;
          margin-top: 0;
        }

        .title-text {
          font-size: 26px;
          font-weight: 400;
          color: #f72585;
          text-transform: uppercase;
          letter-spacing: 0;
          margin: 0;
          padding: 0;
          line-height: 1.4;
          text-shadow:
            3px 3px 0px #0a0814,
            4px 4px 0px #5a1740;
          image-rendering: pixelated;
          transform: none;
        }

        .title-text.glitch {
          animation: glitch 100ms steps(2);
        }

        @keyframes glitch {
          0% {
            text-shadow: 3px 3px 0px #0a0814, 4px 4px 0px #5a1740;
          }
          50% {
            text-shadow:
              -3px 2px 0px #4cc9f0,
              3px -2px 0px #f72585,
              3px 3px 0px #0a0814;
          }
          100% {
            text-shadow: 3px 3px 0px #0a0814, 4px 4px 0px #5a1740;
          }
        }

        .subtitle-text {
          font-size: 32px;
          font-weight: 400;
          color: #ffd23f;
          text-transform: uppercase;
          letter-spacing: 0;
          margin: 12px 0 0;
          line-height: 1.4;
          text-shadow:
            3px 3px 0px #0a0814,
            4px 4px 0px #6b5410;
        }

        .tagline {
          font-size: 9px;
          color: #b9b3d6;
          margin: 18px 0 0;
          letter-spacing: 0;
          line-height: 1.7;
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
          font-size: 8px;
          color: #8079a6;
          margin: 0 0 10px;
          letter-spacing: 0;
          line-height: 1.7;
        }

        .version {
          font-size: 7px;
          color: #6f6796;
          margin: 0;
          letter-spacing: 0;
          line-height: 1.7;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .title-text {
            font-size: 19px;
            text-shadow:
              2px 2px 0px #0a0814,
              3px 3px 0px #5a1740;
          }

          .subtitle-text {
            font-size: 24px;
          }

          .tagline {
            font-size: 8px;
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
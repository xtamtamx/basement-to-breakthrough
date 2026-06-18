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

// Drifting pixel music notes for the menu backdrop (CSS-animated, transform-only).
const NOTES = [
  { glyph: '♪', left: '12%', size: '18px', dur: 13, delay: 0, color: '#f72585' },
  { glyph: '♫', left: '28%', size: '14px', dur: 17, delay: 3, color: '#4cc9f0' },
  { glyph: '♩', left: '46%', size: '22px', dur: 15, delay: 6, color: '#ffd23f' },
  { glyph: '♬', left: '66%', size: '16px', dur: 19, delay: 2, color: '#c77dff' },
  { glyph: '♪', left: '82%', size: '14px', dur: 14, delay: 8, color: '#3ad17e' },
  { glyph: '♫', left: '92%', size: '18px', dur: 21, delay: 5, color: '#f72585' },
];

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
      {/* Animated walkers (the scene wandering through) */}
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

      {/* Drifting music notes */}
      <div className="floating-notes">
        {NOTES.map((n, i) => (
          <span
            key={i}
            className="note"
            style={{ left: n.left, fontSize: n.size, color: n.color, animationDuration: `${n.dur}s`, animationDelay: `${n.delay}s` }}
          >
            {n.glyph}
          </span>
        ))}
      </div>

      {/* CRT scanlines */}
      <div className="crt-scanlines" />

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
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className={`title-text ${glitchText ? 'glitch' : ''}`}>
            SETTLING
          </h1>
          <h2 className="subtitle-text">
            UP
          </h2>
          <p className="tagline">
            From breaking even to breaking through
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
            A game about DIY ethics vs. selling out
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
          background:
            radial-gradient(120% 90% at 50% 0%, #1a0f2e 0%, #0a0814 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
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

        .floating-notes {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .note {
          position: absolute;
          bottom: -48px;
          opacity: 0;
          image-rendering: pixelated;
          text-shadow: 2px 2px 0 #0a0814;
          animation-name: float-up;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }

        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          12%  { opacity: 0.55; }
          88%  { opacity: 0.55; }
          100% { transform: translateY(-112vh) translateX(24px) rotate(12deg); opacity: 0; }
        }

        .crt-scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 6;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.18) 0px,
            rgba(0, 0, 0, 0.18) 1px,
            transparent 1px,
            transparent 3px
          );
          opacity: 0.35;
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
          margin-bottom: 44px;
          margin-top: 0;
        }

        .title-text {
          font-size: 30px;
          font-weight: 400;
          color: #f72585;
          text-transform: uppercase;
          letter-spacing: 0;
          margin: 0;
          padding: 0;
          line-height: 1.3;
          text-shadow:
            3px 3px 0px #0a0814,
            4px 4px 0px #5a1740;
          image-rendering: pixelated;
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
          font-size: 56px;
          font-weight: 400;
          color: #ffd23f;
          text-transform: uppercase;
          letter-spacing: 0;
          margin: 6px 0 0;
          line-height: 1.1;
          text-shadow:
            4px 4px 0px #0a0814,
            5px 5px 0px #6b5410;
        }

        .tagline {
          font-size: 9px;
          color: #b9b3d6;
          margin: 22px 0 0;
          letter-spacing: 0;
          line-height: 1.8;
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
            font-size: 22px;
            text-shadow:
              2px 2px 0px #0a0814,
              3px 3px 0px #5a1740;
          }

          .subtitle-text {
            font-size: 44px;
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

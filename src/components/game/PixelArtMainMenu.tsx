import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

// A few twinkling stars up in the night sky.
const STARS = [
  { l: '8%', t: '12%', d: 0 }, { l: '22%', t: '22%', d: 1.4 }, { l: '37%', t: '9%', d: 0.7 },
  { l: '54%', t: '18%', d: 2.1 }, { l: '69%', t: '11%', d: 1.0 }, { l: '83%', t: '24%', d: 0.4 },
  { l: '91%', t: '15%', d: 1.8 }, { l: '15%', t: '32%', d: 2.4 }, { l: '78%', t: '34%', d: 0.9 },
  { l: '46%', t: '30%', d: 1.6 },
];

// The neon-town skyline (the hero). Each building: x, width, height (px up from the
// 220 baseline). `marquee` = the venue with a glowing sign. Window colours cycle.
const BUILDINGS = [
  { x: -4, w: 40, h: 64 }, { x: 38, w: 28, h: 104 }, { x: 68, w: 34, h: 78 },
  { x: 104, w: 24, h: 132 }, { x: 130, w: 44, h: 70, marquee: true }, { x: 176, w: 30, h: 110 },
  { x: 208, w: 38, h: 86 }, { x: 248, w: 26, h: 150 }, { x: 276, w: 40, h: 72 },
  { x: 318, w: 30, h: 116 }, { x: 350, w: 32, h: 80 },
];
const WIN = ['#ffd23f', '#f72585', '#4cc9f0', '#3ad17e'];

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
      {/* Night sky: moon + twinkling stars */}
      <div className="sky">
        <div className="moon" />
        {STARS.map((s, i) => (
          <span key={i} className="star" style={{ left: s.l, top: s.t, animationDelay: `${s.d}s` }} />
        ))}
      </div>

      {/* Neon-town skyline silhouette at the horizon — the hero visual */}
      <svg className="skyline" viewBox="0 0 375 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="glow" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f72585" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#7b1d52" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7b1d52" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* magenta horizon glow behind the buildings */}
        <rect x="0" y="40" width="375" height="180" fill="url(#glow)" />
        {BUILDINGS.map((b, bi) => {
          const top = 220 - b.h;
          const cells: React.ReactNode[] = [];
          // window grid — a lit window every so often, colour cycling
          for (let wy = top + 8; wy < 216; wy += 9) {
            for (let wx = b.x + 5; wx < b.x + b.w - 4; wx += 8) {
              if ((wx + wy + bi) % 3 === 0) {
                cells.push(
                  <rect key={`${wx}-${wy}`} x={wx} y={wy} width="3" height="4"
                    fill={WIN[(wx + wy) % WIN.length]} opacity="0.85" />,
                );
              }
            }
          }
          return (
            <g key={bi}>
              <rect x={b.x} y={top} width={b.w} height={b.h} fill="#1b1030" />
              <rect x={b.x} y={top} width={b.w} height="2" fill="#2c1c4a" />
              {cells}
              {b.marquee && (
                <>
                  {/* the venue's glowing marquee */}
                  <rect x={b.x + 4} y={top + 6} width={b.w - 8} height="7" fill="#f72585" />
                  <rect x={b.x + 4} y={top + 6} width={b.w - 8} height="7" fill="#ff7ab8" opacity="0.5" />
                  <rect x={b.x + 6} y={top - 2} width="2" height="8" fill="#3a2350" />
                  <rect x={b.x + b.w - 8} y={top - 2} width="2" height="8" fill="#3a2350" />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* CRT scanlines */}
      <div className="crt-scanlines" />

      {/* Drifting music notes (rise out of the skyline) */}
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
          <h1 className={`title-text ${glitchText ? 'glitch' : ''}`}>SETTLING</h1>
          <h2 className="subtitle-text">UP</h2>
          <p className="tagline">From breaking even to breaking through</p>
        </motion.div>

        {/* Menu buttons */}
        <motion.div
          className="menu-buttons"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {hasSavedGame && onContinueGame && (
            <PixelButton variant="primary" size="lg" fullWidth onClick={() => { haptics.medium(); onContinueGame(); }} icon="▶️">
              Continue
            </PixelButton>
          )}
          <PixelButton variant={hasSavedGame ? 'secondary' : 'primary'} size="lg" fullWidth onClick={() => { haptics.medium(); onStartGame(); }} icon="🎸">
            New Game
          </PixelButton>
          {onUpgrades && (
            <PixelButton variant="secondary" size="lg" fullWidth onClick={() => { haptics.light(); onUpgrades(); }} icon="⭐">
              Scene Cred
            </PixelButton>
          )}
          {onSettings && (
            <PixelButton variant="ghost" size="lg" fullWidth onClick={() => { haptics.light(); onSettings(); }} icon="⚙️">
              Settings
            </PixelButton>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div className="menu-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <p className="credits">A game about DIY ethics vs. selling out</p>
          <p className="version">v1.0.0 • Made with ❤️ and 🤘</p>
        </motion.div>
      </motion.div>

      <style>{`
        .pixel-main-menu {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(180deg, #0a0814 0%, #160b28 48%, #24123f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          /* Scroll rather than clip — a short landscape viewport must never hide
             the title or buttons outright. */
          overflow-x: hidden;
          overflow-y: auto;
          font-family: 'Press Start 2P', ui-monospace, monospace;
          -webkit-font-smoothing: none;
          /* Respect the notch / Dynamic Island / home indicator. On the iPhone in
             landscape these insets are on the LEFT/RIGHT edges, so pad all four. */
          padding:
            max(24px, env(safe-area-inset-top))
            max(20px, env(safe-area-inset-right))
            max(24px, env(safe-area-inset-bottom))
            max(20px, env(safe-area-inset-left));
        }

        .sky { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .moon {
          position: absolute; top: 9%; right: 16%;
          width: 36px; height: 36px; border-radius: 50%;
          background: #fff3c4; box-shadow: 0 0 26px 6px rgba(255, 243, 196, 0.35);
        }
        .moon::after {
          content: ''; position: absolute; top: -6px; left: 10px;
          width: 30px; height: 30px; border-radius: 50%; background: #160b28;
        }
        .star {
          position: absolute; width: 2px; height: 2px; background: #fff;
          opacity: 0.85; animation: twinkle 3.2s ease-in-out infinite;
        }
        @keyframes twinkle { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.9; } }

        .skyline {
          position: absolute; left: 0; right: 0; bottom: 0;
          width: 100%; height: 46vh; min-height: 240px;
          z-index: 2; pointer-events: none;
          image-rendering: pixelated;
        }

        .background-walkers { position: absolute; inset: 0; pointer-events: none; opacity: 0.3; }

        .floating-notes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .note {
          position: absolute; bottom: 22%; opacity: 0;
          image-rendering: pixelated; text-shadow: 2px 2px 0 #0a0814;
          animation-name: float-up; animation-iteration-count: infinite; animation-timing-function: linear;
        }
        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          12%  { opacity: 0.6; }
          88%  { opacity: 0.6; }
          100% { transform: translateY(-92vh) translateX(24px) rotate(12deg); opacity: 0; }
        }

        .crt-scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 6;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px);
          opacity: 0.3;
        }

        .menu-content {
          position: relative; z-index: 10; width: 100%; max-width: 400px;
          padding: 24px 20px 20px; text-align: center;
          margin-bottom: 14vh; /* float the content above the skyline */
        }

        .game-title { margin-bottom: 40px; margin-top: 0; }

        .title-text {
          font-size: 34px; font-weight: 400; color: #f72585; text-transform: uppercase;
          letter-spacing: 2px; margin: 0; padding: 0; line-height: 1.1;
          text-shadow: 3px 3px 0 #0a0814, 0 0 18px rgba(247, 37, 133, 0.55);
          image-rendering: pixelated;
        }
        .title-text.glitch { animation: glitch 100ms steps(2); }
        @keyframes glitch {
          0% { text-shadow: 3px 3px 0 #0a0814, 0 0 18px rgba(247,37,133,0.55); }
          50% { text-shadow: -3px 2px 0 #4cc9f0, 3px -2px 0 #f72585, 3px 3px 0 #0a0814; }
          100% { text-shadow: 3px 3px 0 #0a0814, 0 0 18px rgba(247,37,133,0.55); }
        }

        .subtitle-text {
          font-size: 60px; font-weight: 400; color: #ffd23f; text-transform: uppercase;
          letter-spacing: 4px; margin: 4px 0 0; line-height: 1;
          text-shadow: 4px 4px 0 #0a0814, 0 0 22px rgba(255, 210, 63, 0.5);
        }

        .tagline {
          font-size: 9px; color: #c9c2e6; margin: 20px 0 0; letter-spacing: 1px;
          line-height: 1.8; text-transform: uppercase;
        }

        .menu-buttons { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }

        .menu-footer { text-align: center; }
        .credits { font-size: 8px; color: #8079a6; margin: 0 0 10px; letter-spacing: 0; line-height: 1.7; }
        .version { font-size: 7px; color: #6f6796; margin: 0; letter-spacing: 0; line-height: 1.7; text-transform: uppercase; }

        @media (max-width: 768px) {
          .title-text { font-size: 26px; text-shadow: 2px 2px 0 #0a0814, 0 0 14px rgba(247,37,133,0.55); }
          .subtitle-text { font-size: 48px; }
          .tagline { font-size: 8px; }
          .menu-content { padding: 20px 16px; }
        }
        @media (max-height: 700px) {
          .game-title { margin-bottom: 22px; }
          .menu-content { margin-bottom: 8vh; }
        }
        /* Landscape phones: a very short viewport (~360–430px tall, as the game is
           landscape-locked on device). Drop the upward float entirely, shrink the
           title stack, shorten + dim the skyline, and hide the footer so the title
           AND every button fit on screen without clipping. */
        @media (max-height: 540px) {
          .menu-content { margin-bottom: 0; padding: 8px 12px; max-width: 460px; }
          .game-title { margin-bottom: 12px; }
          .title-text { font-size: 20px; letter-spacing: 1px; }
          .subtitle-text { font-size: 30px; margin-top: 2px; }
          .tagline { font-size: 7px; margin: 8px 0 0; line-height: 1.5; }
          .menu-buttons { gap: 9px; margin-bottom: 12px; }
          .skyline { height: 32vh; min-height: 0; opacity: 0.7; }
          .menu-footer { display: none; }
        }
      `}</style>
    </div>
  );
};

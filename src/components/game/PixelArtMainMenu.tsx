import React, { useState, useEffect } from 'react';
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
  { glyph: '♪', left: '10%', size: '18px', dur: 13, delay: 0, color: '#f72585' },
  { glyph: '♫', left: '24%', size: '14px', dur: 17, delay: 3, color: '#4cc9f0' },
  { glyph: '♩', left: '44%', size: '22px', dur: 15, delay: 6, color: '#ffd23f' },
  { glyph: '♬', left: '63%', size: '16px', dur: 19, delay: 2, color: '#c77dff' },
  { glyph: '♪', left: '80%', size: '14px', dur: 14, delay: 8, color: '#3ad17e' },
  { glyph: '♫', left: '91%', size: '18px', dur: 21, delay: 5, color: '#f72585' },
];

// A few twinkling stars up in the night sky.
const STARS = [
  { l: '8%', t: '14%', d: 0 }, { l: '22%', t: '26%', d: 1.4 }, { l: '37%', t: '10%', d: 0.7 },
  { l: '54%', t: '20%', d: 2.1 }, { l: '69%', t: '12%', d: 1.0 }, { l: '83%', t: '28%', d: 0.4 },
  { l: '91%', t: '17%', d: 1.8 }, { l: '15%', t: '36%', d: 2.4 }, { l: '78%', t: '40%', d: 0.9 },
  { l: '46%', t: '34%', d: 1.6 }, { l: '30%', t: '8%', d: 3.0 }, { l: '62%', t: '30%', d: 2.7 },
];

// The neon-town skyline (the hero backdrop). Each building: x, width, height (px up
// from the 220 baseline). `marquee` = the venue with a glowing sign.
const BUILDINGS = [
  { x: -4, w: 40, h: 64 }, { x: 38, w: 28, h: 104 }, { x: 68, w: 34, h: 78 },
  { x: 104, w: 24, h: 132 }, { x: 130, w: 44, h: 70, marquee: true }, { x: 176, w: 30, h: 110 },
  { x: 208, w: 38, h: 86 }, { x: 248, w: 26, h: 150 }, { x: 276, w: 40, h: 72 },
  { x: 318, w: 30, h: 116 }, { x: 350, w: 32, h: 80 },
];
const WIN = ['#ffd23f', '#f72585', '#4cc9f0', '#3ad17e'];
// Marquee bulb chase — 7 bulbs along the sign's top edge.
const BULBS = [0, 1, 2, 3, 4, 5, 6];

export const PixelArtMainMenu: React.FC<PixelArtMainMenuProps> = ({
  onStartGame,
  onContinueGame,
  onSettings,
  onUpgrades,
  hasSavedGame = false,
}) => {
  // Reveal state machine. The static boot splash (index.html) is crossfading out
  // right now; flipping `revealed` a beat after mount fires the CSS "power-on" of
  // the marquee + the staggered rise of the skyline and buttons, so the splash
  // reads as morphing INTO the title rather than a hard cut.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setTimeout(() => setRevealed(true), 80));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="pixel-main-menu" data-revealed={revealed}>
      {/* Night sky: moon + twinkling stars */}
      <div className="sky">
        <div className="moon" />
        {STARS.map((s, i) => (
          <span key={i} className="star" style={{ left: s.l, top: s.t, animationDelay: `${s.d}s` }} />
        ))}
      </div>

      {/* Neon-town skyline silhouette at the horizon */}
      <svg className="skyline" viewBox="0 0 375 220" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="glow" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff2e8f" stopOpacity="0.72" />
            <stop offset="45%" stopColor="#9b2566" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7b1d52" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="20" width="375" height="200" fill="url(#glow)" />
        {BUILDINGS.map((b, bi) => {
          const top = 220 - b.h;
          const cells: React.ReactNode[] = [];
          for (let wy = top + 7; wy < 217; wy += 8) {
            for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 7) {
              if ((wx + wy + bi) % 2 === 0) {
                cells.push(
                  <rect key={`${wx}-${wy}`} x={wx} y={wy} width="4" height="5"
                    fill={WIN[(wx + wy) % WIN.length]} opacity="0.92" />,
                );
              }
            }
          }
          return (
            <g key={bi}>
              <rect x={b.x} y={top} width={b.w} height={b.h} fill="#0b0918" />
              <rect x={b.x} y={top} width={b.w} height="2" fill="#6a45a8" />
              <rect x={b.x} y={top} width="2" height={b.h} fill="#3a2360" opacity="0.8" />
              {cells}
              {b.marquee && (
                <>
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

      {/* Drifting music notes */}
      <div className="floating-notes">
        {NOTES.map((n, i) => (
          <span key={i} className="note"
            style={{ left: n.left, fontSize: n.size, color: n.color, animationDuration: `${n.dur}s`, animationDelay: `${n.delay}s` }}>
            {n.glyph}
          </span>
        ))}
      </div>

      <div className="crt-scanlines" />
      <div className="vignette" />

      {/* Stage: hero + menu. Two columns in landscape, stacked in portrait. */}
      <div className="menu-stage">
        <div className="hero-col">
          {/* The marquee: a neon venue sign that powers on with the reveal. */}
          <div className="title-marquee">
            <div className="marquee-bulbs marquee-bulbs--top">
              {BULBS.map((b) => <span key={b} className="bulb" style={{ animationDelay: `${b * 0.12}s` }} />)}
            </div>
            <h1 className="title-text">SETTLING</h1>
            <h2 className="subtitle-text">UP</h2>
            <div className="marquee-bulbs marquee-bulbs--bottom">
              {BULBS.map((b) => <span key={b} className="bulb" style={{ animationDelay: `${b * 0.12 + 0.06}s` }} />)}
            </div>
          </div>
          <p className="tagline">From breaking even to breaking through</p>
        </div>

        <div className="menu-col">
          <div className="menu-buttons">
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
          </div>
          <div className="menu-footer">
            <p className="credits">DIY ethics vs. selling out</p>
            <p className="version">v1.0.0 • Made with ❤ and 🤘</p>
          </div>
        </div>
      </div>

      <style>{`
        .pixel-main-menu {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          background:
            radial-gradient(120% 80% at 50% -10%, #2a1450 0%, rgba(42,20,80,0) 55%),
            linear-gradient(180deg, #0a0814 0%, #150b27 50%, #20103a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-x: hidden;
          overflow-y: auto;
          font-family: 'Press Start 2P', ui-monospace, monospace;
          -webkit-font-smoothing: none;
          padding:
            max(20px, env(safe-area-inset-top))
            max(28px, env(safe-area-inset-right))
            max(20px, env(safe-area-inset-bottom))
            max(28px, env(safe-area-inset-left));
        }

        .sky { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .moon {
          position: absolute; top: 7%; left: 9%;
          width: 38px; height: 38px; border-radius: 50%;
          background: #fff3c4; box-shadow: 0 0 30px 8px rgba(255, 243, 196, 0.4);
          opacity: 0; transition: opacity 1s ease 0.5s;
        }
        .moon::after {
          content: ''; position: absolute; top: -7px; left: 11px;
          width: 32px; height: 32px; border-radius: 50%; background: #120a24;
        }
        [data-revealed="true"] .moon { opacity: 1; }
        .star {
          position: absolute; width: 2px; height: 2px; background: #fff;
          opacity: 0.85; animation: twinkle 3.2s ease-in-out infinite;
        }
        @keyframes twinkle { 0%, 100% { opacity: 0.16; } 50% { opacity: 0.95; } }

        .skyline {
          position: absolute; left: 0; right: 0; bottom: 0;
          width: 100%; height: 42vh; min-height: 180px; max-height: 280px;
          z-index: 2; pointer-events: none; image-rendering: pixelated;
          transform: translateY(28px); opacity: 0;
          transition: transform 0.9s cubic-bezier(0.18,0.9,0.3,1) 0.15s, opacity 0.9s ease 0.15s;
        }
        [data-revealed="true"] .skyline { transform: translateY(0); opacity: 1; }

        .floating-notes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .note {
          position: absolute; bottom: 20%; opacity: 0;
          image-rendering: pixelated; text-shadow: 2px 2px 0 #0a0814;
          animation-name: float-up; animation-iteration-count: infinite; animation-timing-function: linear;
        }
        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          12%  { opacity: 0.6; }
          88%  { opacity: 0.6; }
          100% { transform: translateY(-86vh) translateX(24px) rotate(12deg); opacity: 0; }
        }

        .crt-scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 6;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px);
          opacity: 0.35;
        }
        .vignette {
          position: absolute; inset: 0; pointer-events: none; z-index: 7;
          background: radial-gradient(135% 115% at 50% 36%, transparent 62%, rgba(6,4,14,0.42) 100%);
        }

        /* ---- Stage layout ---- */
        .menu-stage {
          position: relative; z-index: 10;
          width: 100%; max-width: 1000px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: clamp(18px, 5vh, 44px);
          padding-bottom: 8vh; /* float above the skyline */
        }
        .hero-col { text-align: center; }
        .menu-col { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 18px; }

        /* ---- Marquee + title ---- */
        .title-marquee {
          position: relative; display: inline-block;
          padding: clamp(14px, 3vh, 22px) clamp(26px, 6vw, 48px);
          border: 3px solid rgba(247, 37, 133, 0.65);
          box-shadow:
            0 0 0 3px #0a0814,
            0 0 22px rgba(247, 37, 133, 0.4),
            inset 0 0 34px rgba(247, 37, 133, 0.1);
          background: rgba(10, 8, 22, 0.35);
          opacity: 0.18;
        }
        [data-revealed="true"] .title-marquee { animation: power-on 1.1s ease-out forwards; }
        @keyframes power-on {
          0% { opacity: 0.18; }
          8% { opacity: 0.95; } 11% { opacity: 0.28; }
          16% { opacity: 1; } 20% { opacity: 0.4; }
          27% { opacity: 1; } 33% { opacity: 0.72; }
          40% { opacity: 1; } 100% { opacity: 1; }
        }

        .marquee-bulbs {
          position: absolute; left: 8px; right: 8px;
          display: flex; justify-content: space-between; pointer-events: none;
        }
        .marquee-bulbs--top { top: -5px; }
        .marquee-bulbs--bottom { bottom: -5px; }
        .bulb {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ffd23f; box-shadow: 0 0 6px 1px rgba(255, 210, 63, 0.9);
          animation: bulb-blink 1.1s steps(1, end) infinite;
        }
        @keyframes bulb-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .title-text {
          font-size: clamp(20px, 4.6vw, 46px); font-weight: 400; color: #ff4da3;
          text-transform: uppercase; letter-spacing: clamp(2px, 1vw, 8px);
          margin: 0; padding: 0; line-height: 1; image-rendering: pixelated;
          text-shadow:
            0 0 4px #fff0f7,
            3px 3px 0 #0a0814,
            0 0 16px #f72585,
            0 0 38px rgba(247, 37, 133, 0.8),
            0 0 74px rgba(247, 37, 133, 0.45);
        }
        .subtitle-text {
          font-size: clamp(48px, 12.5vw, 108px); font-weight: 400; color: #ffe45e;
          text-transform: uppercase; letter-spacing: clamp(4px, 2vw, 14px);
          margin: clamp(6px, 1.5vh, 14px) 0 0; line-height: 0.95;
          text-shadow:
            0 0 5px #fff7e0,
            4px 4px 0 #0a0814,
            0 0 22px #ffd23f,
            0 0 48px rgba(255, 210, 63, 0.8),
            0 0 96px rgba(255, 210, 63, 0.45);
        }
        [data-revealed="true"] .title-text,
        [data-revealed="true"] .subtitle-text { animation: neon-flicker 6s ease-in-out 1.2s infinite; }
        @keyframes neon-flicker {
          0%, 100% { filter: brightness(1); }
          48% { filter: brightness(1); } 50% { filter: brightness(1.12); } 52% { filter: brightness(1); }
          92% { filter: brightness(0.92); } 94% { filter: brightness(1.14); } 96% { filter: brightness(1); }
        }

        .tagline {
          font-family: 'Bebas Neue', 'Oswald', 'Press Start 2P', sans-serif;
          font-size: clamp(13px, 1.8vw, 19px); color: #c9c2e6; letter-spacing: 3px;
          margin: clamp(14px, 3vh, 26px) 0 0; text-transform: uppercase;
          opacity: 0; transform: translateY(6px);
          transition: opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s;
        }
        [data-revealed="true"] .tagline { opacity: 0.92; transform: translateY(0); }

        /* ---- Buttons ---- */
        .menu-buttons { display: flex; flex-direction: column; gap: 14px; }
        .menu-buttons > * {
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        [data-revealed="true"] .menu-buttons > * { opacity: 1; transform: translateY(0); }
        [data-revealed="true"] .menu-buttons > *:nth-child(1) { transition-delay: 0.55s; }
        [data-revealed="true"] .menu-buttons > *:nth-child(2) { transition-delay: 0.66s; }
        [data-revealed="true"] .menu-buttons > *:nth-child(3) { transition-delay: 0.77s; }
        [data-revealed="true"] .menu-buttons > *:nth-child(4) { transition-delay: 0.88s; }

        .menu-footer { text-align: center; margin-top: 4px;
          opacity: 0; transition: opacity 0.6s ease 1s; }
        [data-revealed="true"] .menu-footer { opacity: 1; }
        .credits { font-size: 8px; color: #8079a6; margin: 0 0 9px; letter-spacing: 1px; line-height: 1.7; text-transform: uppercase; }
        .version { font-size: 7px; color: #6f6796; margin: 0; letter-spacing: 1px; line-height: 1.7; text-transform: uppercase; }

        /* ---- Landscape (the device default): two columns so the hero can be huge ---- */
        @media (min-aspect-ratio: 13/10) and (max-height: 600px) {
          .menu-stage {
            flex-direction: row; align-items: center; justify-content: center;
            gap: clamp(28px, 6vw, 72px); padding-bottom: 16vh;
          }
          .hero-col { flex: 0 1 auto; }
          .menu-col { flex: 0 0 auto; max-width: 320px; }
          .menu-buttons { gap: 11px; }
          .tagline { margin-top: 14px; }
          /* The skyline is the bottom hero in landscape; the footer would overlap
             its lit windows and become unreadable, so drop it here (kept in portrait). */
          .menu-footer { display: none; }
        }

        /* Portrait phones / narrow web: tighten the title a touch. */
        @media (max-width: 560px) and (min-aspect-ratio: 10/13) {
          .menu-col { max-width: 340px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skyline, .title-marquee, .tagline, .menu-buttons > *, .menu-footer, .moon { transition: none !important; animation: none !important; opacity: 1 !important; transform: none !important; }
          .title-marquee { opacity: 1 !important; }
          .note, .bulb, .star { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

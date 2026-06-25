import React, { useState, useEffect } from 'react';
import { PixelButton } from '@components/ui/PixelButton';
import { haptics } from '@utils/mobile';
import { getTitleTier } from '@game/world/titleStage';

interface PixelArtMainMenuProps {
  onStartGame: () => void;
  onContinueGame?: () => void;
  onSettings?: () => void;
  onUpgrades?: () => void;
  hasSavedGame?: boolean;
}

const PROP_BASE = '/title/props';
const PROP_SIZE: Record<string, [number, number]> = {
  string_lights: [28, 14], floor_amp: [16, 14], pa_speaker_stack: [16, 26],
  mic_stand: [12, 24], poster_wall: [18, 20],
};
const Prop: React.FC<{ name: keyof typeof PROP_SIZE; s?: number; className?: string; style?: React.CSSProperties }> =
  ({ name, s = 4, className, style }) => {
    const [w, h] = PROP_SIZE[name];
    return <img src={`${PROP_BASE}/${name}.png`} alt="" aria-hidden className={className}
      style={{ width: w * s, height: h * s, imageRendering: 'pixelated', ...style }} />;
  };

// Real Fantasy-Dreamland character. 96x96 idle sheet = 4 rows (Down/Left/Right/Up)
// x 4 frames. dir 0 = facing viewer (band); dir 3 = back, facing the stage (crowd).
const CHAR_SRC = '/assets/sprites/characters';
const FdSprite: React.FC<{ id: string; s?: number; dir?: number; className?: string; style?: React.CSSProperties }> =
  ({ id, s = 3, dir = 0, className, style }) => (
    <div aria-hidden className={className} style={{
      width: 24 * s, height: 24 * s, imageRendering: 'pixelated',
      backgroundImage: `url(${CHAR_SRC}/FD_Character_${id}_Idle.png)`,
      backgroundSize: `${96 * s}px ${96 * s}px`,
      backgroundPosition: `0px ${-dir * 24 * s}px`,
      backgroundRepeat: 'no-repeat', ...style,
    }} />
  );

// REAL instrument sprites (ELV "instrument & more" pack), sliced into
// public/title/band. Native px sizes → nearest-neighbour scaled.
const BAND_SRC = '/title/band';
const INSTR_SIZE: Record<string, [number, number]> = {
  guitar: [15, 48], bass: [15, 52], micstand: [15, 60], drumkit: [94, 85], amp: [28, 43],
};
const Instr: React.FC<{ name: keyof typeof INSTR_SIZE; s?: number; className?: string }> = ({ name, s = 1.4, className }) => {
  const [w, h] = INSTR_SIZE[name];
  return <img src={`${BAND_SRC}/${name}.png`} alt="" aria-hidden className={className}
    style={{ width: w * s, height: h * s, imageRendering: 'pixelated' }} />;
};

// The band — [guitarist, singer, bassist, drummer]. Red-spiky punk on the mic.
const BAND = ['010', '004', '008', '015'];


export const PixelArtMainMenu: React.FC<PixelArtMainMenuProps> = ({
  onStartGame, onContinueGame, onSettings, onUpgrades, hasSavedGame = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const tier = getTitleTier();

  useEffect(() => {
    const id = requestAnimationFrame(() => setTimeout(() => setRevealed(true), 80));
    return () => cancelAnimationFrame(id);
  }, []);

  // Crowd: real characters, EVENLY spaced, all the same size, all facing the stage
  // (backs to camera), grounded on the floor. Darkened as a foreground silhouette.
  const crowdN = tier.crowd;
  const crowd = Array.from({ length: crowdN }, (_, i) => ({
    id: String(((i * 9 + 1) % 40) + 1).padStart(3, '0'),
    // even spread with a tiny deterministic jitter so it's not a perfect grid
    left: ((i + 0.5) / crowdN) * 100 + (((i * 7) % 3) - 1) * 1.4,
    lift: (i % 2) * 6,             // slight 2-row depth
    delay: (i % 6) * 0.12,
  }));

  return (
    <div className="pixel-main-menu" data-revealed={revealed} data-tier={tier.id} data-outdoor={tier.outdoor}>
      {/* ===== ROOM ===== */}
      <div className="room">
        {tier.outdoor ? (
          <div className="sky">
            <div className="dusk-stars">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ left: `${(i * 61) % 100}%`, top: `${(i * 29) % 42}%`, animationDelay: `${(i % 5) * 0.5}s` }} />)}</div>
            <svg className="fest-skyline" viewBox="0 0 375 110" preserveAspectRatio="none" aria-hidden>
              {Array.from({ length: 15 }, (_, i) => {
                const w = 20 + (i % 3) * 7, x = i * 26 - 6, h = 38 + ((i * 41) % 60);
                return <g key={i}><rect x={x} y={110 - h} width={w} height={h} fill="#160d28" />
                  {Array.from({ length: 7 }, (_, j) => (j + i) % 2 === 0 && <rect key={j} x={x + 3 + (j % 3) * 5} y={110 - h + 6 + j * 7} width="3" height="4" fill={['#ffd23f', '#f72585', '#4cc9f0'][j % 3]} opacity=".9" />)}
                </g>;
              })}
            </svg>
          </div>
        ) : (
          <div className="wall"><Prop name="poster_wall" s={3} className="wall-poster" /></div>
        )}
        <div className="stage-wash" />
        <div className="floor" />
        <div className="floor-line" />
      </div>

      {/* string lights swag across the top */}
      <div className="lights-row">
        {Array.from({ length: 9 }, (_, i) => <Prop key={i} name="string_lights" s={3.2} className="lights" />)}
      </div>


      {/* ===== STAGE + BAND (focal point) ===== */}
      <div className="stage">
        <div className="spot" />
        <div className="backline">
          <Prop name="pa_speaker_stack" s={2.5} className="pa pa-l" />
          <div className="band">
            <span className="bandmate b0 guitarist"><FdSprite id={BAND[0]} s={3} /><Instr name="guitar" s={1.3} className="gtr" /></span>
            <span className="bandmate b1 singer"><FdSprite id={BAND[1]} s={3} /><Instr name="micstand" s={0.82} className="mic-stand" /></span>
            <span className="bandmate b2 bassist"><FdSprite id={BAND[2]} s={3} /><Instr name="bass" s={1.3} className="bass" /></span>
            <span className="bandmate b3 drummer"><FdSprite id={BAND[3]} s={2.5} /><Instr name="drumkit" s={0.72} className="kit" /></span>
          </div>
          <Prop name="pa_speaker_stack" s={2.5} className="pa pa-r" />
        </div>
        <div className="platform" />
      </div>

      {/* ===== CROWD (backs to camera, watching the band) ===== */}
      <div className="crowd">
        {crowd.map((c, i) => (
          <span key={i} className="fan" style={{ left: `${c.left}%`, bottom: `${c.lift}px`, animationDelay: `${c.delay}s` }}>
            <FdSprite id={c.id} dir={3} s={2.7} />
          </span>
        ))}
      </div>

      <div className="vignette" />

      {/* ===== LOGO + MENU ===== */}
      <div className="menu-stage">
        <div className="hero-col">
          <div className="banner">
            <span className="banner-pin pin-l" /><span className="banner-pin pin-r" />
            <h1 className="title-text">SETTLING</h1>
            <h2 className="subtitle-text">UP</h2>
          </div>
          <p className="tagline"><span className="venue">{tier.venue}</span> — {tier.blurb}</p>
        </div>
        <div className="menu-col">
          <div className="menu-buttons">
            {hasSavedGame && onContinueGame && (
              <PixelButton variant="primary" size="lg" fullWidth onClick={() => { haptics.medium(); onContinueGame(); }} icon="▶️">Continue</PixelButton>
            )}
            <PixelButton variant={hasSavedGame ? 'secondary' : 'primary'} size="lg" fullWidth onClick={() => { haptics.medium(); onStartGame(); }} icon="🎸">New Game</PixelButton>
            {onUpgrades && (
              <PixelButton variant="secondary" size="lg" fullWidth onClick={() => { haptics.light(); onUpgrades(); }} icon="⭐">Scene Points</PixelButton>
            )}
            {onSettings && (
              <PixelButton variant="ghost" size="lg" fullWidth onClick={() => { haptics.light(); onSettings(); }} icon="⚙️">Settings</PixelButton>
            )}
          </div>
          <div className="menu-footer"><p className="version">v1.0.0 • Made with ❤ and 🤘</p></div>
        </div>
      </div>

      <style>{`
        .pixel-main-menu {
          position: relative; min-height: 100vh; min-height: 100dvh; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Press Start 2P', ui-monospace, monospace; -webkit-font-smoothing: none;
          background: #140a1e;
          padding: max(14px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
        }

        /* ===== ROOM: back wall + floor with a clear seam ===== */
        .room { position: absolute; inset: 0; z-index: 1; }
        .wall { position: absolute; left: 0; right: 0; top: 0; bottom: 33%;
          background:
            linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,0) 30%),
            repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 1px, transparent 1px 30px),
            repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 1px, transparent 1px 15px),
            linear-gradient(180deg, #3a2440 0%, #2c1a34 55%, #221428 100%);
          opacity: 0; transition: opacity .5s ease; }
        [data-revealed="true"] .wall { opacity: 1; }
        .wall-poster { position: absolute; left: 7%; bottom: 8%; filter: drop-shadow(0 2px 0 rgba(0,0,0,.4)); }
        .sky { position: absolute; left: 0; right: 0; top: 0; bottom: 30%;
          background: linear-gradient(180deg, #1d1140 0%, #5a2b66 55%, #b5556a 100%); }
        .dusk-stars span { position: absolute; width: 2px; height: 2px; background: #fff; opacity: .85; animation: tw 3s ease-in-out infinite; }
        @keyframes tw { 0%,100%{opacity:.2} 50%{opacity:.95} }
        .fest-skyline { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 70%; image-rendering: pixelated; }

        /* warm glow on the back wall behind the stage */
        .stage-wash { position: absolute; left: 50%; transform: translateX(-50%); bottom: 30%; width: 64%; height: 46%; z-index: 1; pointer-events: none;
          background: radial-gradient(60% 80% at 50% 100%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 72%);
          opacity: 0; transition: opacity .8s ease .4s; mix-blend-mode: screen; }
        [data-revealed="true"] .stage-wash { opacity: 1; }

        .floor { position: absolute; left: 0; right: 0; bottom: 0; height: 33%; z-index: 1;
          background:
            repeating-linear-gradient(90deg, rgba(0,0,0,.14) 0 1px, transparent 1px 34px),
            linear-gradient(180deg, #4a3324 0%, #38261a 60%, #2a1c12 100%);
          opacity: 0; transition: opacity .5s ease; }
        [data-revealed="true"] .floor { opacity: 1; }
        [data-outdoor="true"] .floor { background:
          repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 1px, transparent 1px 30px),
          linear-gradient(180deg, #6a4a36 0%, #4a3122 100%); }
        .floor-line { position: absolute; left: 0; right: 0; bottom: 33%; height: 8px; z-index: 1; pointer-events: none;
          background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.55)); }
        [data-outdoor="true"] .floor-line { display: none; }

        /* ===== string lights ===== */
        .lights-row { position: absolute; top: max(2px, env(safe-area-inset-top)); left: -3%; right: -3%; z-index: 7; display: flex; justify-content: space-between; pointer-events: none;
          transform: translateY(-130%); transition: transform .7s cubic-bezier(.2,.9,.3,1) .15s; filter: drop-shadow(0 0 8px rgba(255,210,120,.55)); }
        [data-revealed="true"] .lights-row { transform: translateY(0); }

        /* ===== stage + band (centered focal element) ===== */
        /* base = portrait: band sits low (below the button stack, above the crowd) */
        .stage { position: absolute; left: 50%; transform: translateX(-50%); bottom: 13%; z-index: 4;
          display: flex; flex-direction: column; align-items: center; pointer-events: none;
          opacity: 0; transition: opacity .5s ease .35s; }
        [data-revealed="true"] .stage { opacity: 1; }
        .spot { position: absolute; bottom: -24%; left: 50%; transform: translateX(-50%); width: 150%; height: 150%;
          background: radial-gradient(46% 64% at 50% 92%, color-mix(in srgb, var(--accent) 62%, transparent), transparent 70%); mix-blend-mode: screen; }
        .backline { position: relative; display: flex; align-items: flex-end; justify-content: center; gap: 14px; }
        .pa { filter: drop-shadow(0 3px 0 rgba(0,0,0,.45)); }
        .band { position: relative; display: flex; align-items: flex-end; gap: 14px; padding: 0 18px; }
        .bandmate { position: relative; transform-origin: bottom center; animation: headbang 0.62s ease-in-out infinite; filter: drop-shadow(0 2px 0 rgba(0,0,0,.4)); }
        .b1 { animation-delay: .1s; animation-duration: .54s } .b2 { animation-delay: .26s; animation-duration: .7s }
        @keyframes headbang { 0%,100%{transform:translateY(0) rotate(0)} 30%{transform:translateY(-3px) rotate(-3deg)} 60%{transform:translateY(-1px) rotate(3deg)} }
        /* REAL instrument sprites, positioned on/around the players */
        .gtr { position: absolute; left: 6%; bottom: 4%; transform: rotate(-28deg); transform-origin: bottom center; z-index: 3; pointer-events: none; filter: drop-shadow(1px 2px 0 rgba(0,0,0,.5)); }
        .bass { position: absolute; left: 4%; bottom: 4%; transform: rotate(26deg); transform-origin: bottom center; z-index: 3; pointer-events: none; filter: drop-shadow(1px 2px 0 rgba(0,0,0,.5)); }
        .mic-stand { position: absolute; left: 50%; bottom: -8%; transform: translateX(-44%); z-index: 4; pointer-events: none; filter: drop-shadow(1px 2px 0 rgba(0,0,0,.5)); }
        .drummer { z-index: 1; }
        .kit { position: absolute; left: 50%; bottom: -16%; transform: translateX(-50%); z-index: 3; pointer-events: none; filter: drop-shadow(0 3px 0 rgba(0,0,0,.45)); }
        .platform { width: clamp(150px, 26vw, 240px); height: clamp(10px, 2.4vh, 16px); margin-top: -2px;
          background: linear-gradient(180deg, #5a3f2a 0%, #3e2a1a 100%); border-top: 2px solid #6e4d33;
          box-shadow: 0 5px 10px rgba(0,0,0,.5); }

        /* ===== crowd (uniform backs, evenly spaced, grounded) ===== */
        .crowd { position: absolute; left: 0; right: 0; bottom: 2%; height: 30%; z-index: 5; pointer-events: none; }
        .fan { position: absolute; transform: translateX(-50%); transform-origin: bottom;
          filter: brightness(.42) contrast(1.05); animation: jump .72s ease-in-out infinite;
          opacity: 0; transition: opacity .4s ease; }
        [data-revealed="true"] .fan { opacity: 1; }
        @keyframes jump { 0%,100%{transform:translateX(-50%) translateY(0)} 45%{transform:translateX(-50%) translateY(-4px)} }

        .vignette { position: absolute; inset: 0; z-index: 6; pointer-events: none;
          background: radial-gradient(125% 90% at 50% 42%, transparent 58%, rgba(8,4,14,.6) 100%); }

        /* ===== logo + menu ===== */
        .menu-stage { position: relative; z-index: 10; width: 100%; max-width: 1000px;
          display: flex; flex-direction: column; align-items: center; gap: clamp(12px,3vh,24px); }
        .hero-col { text-align: center; }
        .banner { position: relative; display: inline-block; padding: 13px clamp(26px,6vw,54px) 15px;
          background: linear-gradient(180deg, #fbe9c8, #f0cf98); color: #2a1020; border-radius: 2px;
          box-shadow: 0 0 0 3px #3a210f, 0 9px 20px rgba(0,0,0,.55);
          clip-path: polygon(0 7%, 3% 0, 97% 0, 100% 7%, 100% 86%, 96% 100%, 4% 100%, 0 86%);
          transform: translateY(-16px) rotate(-1deg); opacity: 0;
          transition: transform .7s cubic-bezier(.2,1.3,.4,1) .2s, opacity .5s ease .2s; }
        [data-revealed="true"] .banner { transform: translateY(0) rotate(-1deg); opacity: 1; }
        .banner-pin { position: absolute; top: -7px; width: 9px; height: 9px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ff5da2, #b3245e); box-shadow: 0 0 5px rgba(247,37,133,.8); }
        .pin-l { left: 12px } .pin-r { right: 12px }
        .title-text { margin: 0; line-height: 1; color: #c81e63; text-transform: uppercase;
          font-size: clamp(16px, 3.3vw, 32px); letter-spacing: clamp(2px,.7vw,6px); text-shadow: 2px 2px 0 #fbe9c8, 3px 3px 0 #7a1540; }
        .subtitle-text { margin: 2px 0 0; line-height: .95; color: #e23b18; text-transform: uppercase;
          font-size: clamp(34px, 8.4vw, 72px); letter-spacing: clamp(3px,1.3vw,10px); text-shadow: 2px 2px 0 #fbe9c8, 4px 4px 0 #7a1540; }
        .tagline { margin: clamp(10px,2.5vh,18px) 0 0; font-family: 'Bebas Neue','Oswald',sans-serif;
          font-size: clamp(12px,1.6vw,17px); letter-spacing: 2px; color: #f0d9b8; text-transform: uppercase; text-shadow: 1px 1px 2px #000;
          opacity: 0; transition: opacity .6s ease .7s; }
        [data-revealed="true"] .tagline { opacity: .96; }
        .venue { color: var(--accent); }

        .menu-col { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 13px; }
        .menu-buttons { display: flex; flex-direction: column; gap: 13px; }
        .menu-buttons > * { opacity: 0; transform: translateY(12px); transition: opacity .5s ease, transform .5s ease; }
        [data-revealed="true"] .menu-buttons > * { opacity: 1; transform: translateY(0); }
        [data-revealed="true"] .menu-buttons > *:nth-child(1){transition-delay:.5s}
        [data-revealed="true"] .menu-buttons > *:nth-child(2){transition-delay:.6s}
        [data-revealed="true"] .menu-buttons > *:nth-child(3){transition-delay:.7s}
        [data-revealed="true"] .menu-buttons > *:nth-child(4){transition-delay:.8s}
        .menu-footer { text-align: center; opacity: 0; transition: opacity .6s ease 1s; }
        [data-revealed="true"] .menu-footer { opacity: 1; }
        .version { font-size: 7px; color: #c2b2d2; margin: 0; letter-spacing: 1px; text-transform: uppercase; text-shadow: 1px 1px 1px #000; }

        .pixel-main-menu { --accent: #f72585; }
        .pixel-main-menu[data-tier="dive"] { --accent: #4cc9f0; }
        .pixel-main-menu[data-tier="theater"] { --accent: #ffd23f; }
        .pixel-main-menu[data-tier="festival"] { --accent: #3ad17e; }

        /* ===== landscape: logo+menu on the right half; the show fills behind ===== */
        @media (min-aspect-ratio: 13/10) and (max-height: 600px) {
          /* show on the LEFT (band on stage + crowd), menu on the RIGHT — they
             never overlap. Children positioned independently. */
          .menu-stage { display: contents; }
          .hero-col { position: absolute; top: max(34px, env(safe-area-inset-top)); left: 30%; transform: translateX(-50%); z-index: 10; text-align: center; max-width: 56%; }
          .menu-col { position: absolute; right: clamp(16px,4vw,48px); top: 50%; transform: translateY(-50%); z-index: 10; width: clamp(250px,32vw,310px); max-width: none; }
          .menu-footer { display: none; }
          .stage { left: 30%; bottom: 34%; }
          .crowd { left: -4%; right: 36%; bottom: 1%; height: 36%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wall,.floor,.floor-line,.stage-wash,.lights-row,.stage,.fan,.banner,.tagline,.menu-buttons>*,.menu-footer { transition: none !important; opacity: 1 !important; transform: none !important; }
          .bandmate,.fan,.dusk-stars span { animation: none !important; }
          .lights-row { transform: none !important; }
          .fan { transform: translateX(-50%) !important; }
        }
      `}</style>
    </div>
  );
};

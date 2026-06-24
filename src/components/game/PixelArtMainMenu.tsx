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
// native px sizes of the source sprites (see public/title/props)
const PROP_SIZE: Record<string, [number, number]> = {
  string_lights: [28, 14], stage_riser: [20, 12], floor_amp: [16, 14],
  pa_speaker_stack: [16, 26], mic_stand: [12, 24], poster_wall: [18, 20],
  guitar_case: [12, 20], keg_cooler: [12, 16], crate_stack: [16, 18], flyer_pole: [14, 26],
};

/** A real game prop sprite, nearest-neighbour scaled. */
const Prop: React.FC<{ name: keyof typeof PROP_SIZE; s?: number; className?: string; style?: React.CSSProperties }> =
  ({ name, s = 4, className, style }) => {
    const [w, h] = PROP_SIZE[name];
    return (
      <img src={`${PROP_BASE}/${name}.png`} alt="" aria-hidden className={className}
        style={{ width: w * s, height: h * s, imageRendering: 'pixelated', ...style }} />
    );
  };

// Cute pixel person — mirrors the town walkers' drawPerson() recipe. `cheer` raises
// the arms (audience), `play`/`sing` are the band poses.
const HAIR = ['#f72585', '#4cc9f0', '#7cf06a', '#ffd23f', '#b072e0', '#ff7a4d', '#ff5da2', '#5ad1c4'];
const PixelPerson: React.FC<{ hair: string; shirt: string; skin?: string; pose?: 'cheer' | 'idle' | 'play' | 'sing'; s?: number; silhouette?: boolean }> =
  ({ hair, shirt, skin = '#e0b58a', pose = 'idle', s = 4, silhouette = false }) => {
    const body = silhouette ? '#0c0a16' : shirt;
    const head = silhouette ? '#15101f' : skin;
    const legs = silhouette ? '#0c0a16' : '#2a2330';
    const armsUp = pose === 'cheer';
    return (
      <svg width={7 * s} height={13 * s} viewBox="0 0 7 13" style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible' }} aria-hidden>
        {/* legs */}
        <rect x="2" y="9" width="1" height="3" fill={legs} />
        <rect x="4" y="9" width="1" height="3" fill={legs} />
        {/* arms */}
        {armsUp ? (
          <>
            <rect x="0" y="3" width="1" height="3" fill={body} />
            <rect x="6" y="3" width="1" height="3" fill={body} />
            <rect x="0" y="2" width="1" height="1" fill={head} />
            <rect x="6" y="2" width="1" height="1" fill={head} />
          </>
        ) : (
          <>
            <rect x="0" y="6" width="1" height="3" fill={body} />
            <rect x="6" y="6" width="1" height="3" fill={body} />
          </>
        )}
        {/* torso */}
        <rect x="1" y="5" width="5" height="4" fill={body} />
        {/* head + hair */}
        <rect x="2" y="2" width="3" height="3" fill={head} />
        <rect x="2" y="1" width="3" height="1" fill={hair} />
        <rect x="3" y="0" width="1" height="1" fill={hair} />
        {/* sing: a little mic dot; play: a guitar slab */}
        {pose === 'sing' && <rect x="6" y="4" width="1" height="2" fill="#cfd3df" />}
        {pose === 'play' && <rect x="5" y="6" width="3" height="2" fill="#7a3df0" />}
      </svg>
    );
  };

export const PixelArtMainMenu: React.FC<PixelArtMainMenuProps> = ({
  onStartGame, onContinueGame, onSettings, onUpgrades, hasSavedGame = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const tier = getTitleTier();

  useEffect(() => {
    const id = requestAnimationFrame(() => setTimeout(() => setRevealed(true), 80));
    return () => cancelAnimationFrame(id);
  }, []);

  // Crowd: deterministic colours by index so it's stable across renders.
  const crowd = Array.from({ length: tier.crowd }, (_, i) => ({
    hair: HAIR[i % HAIR.length],
    // spread along the front, two rows for bigger tiers
    left: 2 + ((i * 137) % 94),
    row: i % 2,
    delay: (i % 7) * 0.13,
    s: 4.8 + ((i * 7) % 5) * 0.4,
  }));

  return (
    <div className="pixel-main-menu" data-revealed={revealed} data-tier={tier.id} data-outdoor={tier.outdoor}>
      {/* ---- BACKDROP: interior wall (basement→theater) or dusk sky + skyline (festival) ---- */}
      <div className="backdrop">
        {tier.outdoor && (
          <>
            <div className="dusk-stars">{Array.from({ length: 14 }, (_, i) => <span key={i} style={{ left: `${(i * 67) % 100}%`, top: `${(i * 23) % 38}%`, animationDelay: `${(i % 5) * 0.6}s` }} />)}</div>
            <svg className="fest-skyline" viewBox="0 0 375 120" preserveAspectRatio="none" aria-hidden>
              {Array.from({ length: 16 }, (_, i) => {
                const w = 18 + (i % 4) * 6, x = i * 24 - 4, h = 40 + ((i * 37) % 70);
                return <g key={i}><rect x={x} y={120 - h} width={w} height={h} fill="#120c22" />
                  {Array.from({ length: 8 }, (_, j) => (j + i) % 2 === 0 && <rect key={j} x={x + 3 + (j % 3) * 5} y={120 - h + 6 + j * 6} width="3" height="4" fill={['#ffd23f', '#f72585', '#4cc9f0'][j % 3]} opacity="0.85" />)}
                </g>;
              })}
            </svg>
          </>
        )}
        {!tier.outdoor && <div className="wall" />}
        {/* back-wall DIY dressing */}
        <Prop name="poster_wall" s={3.4} className="prop poster" />
        <Prop name="flyer_pole" s={3.2} className="prop flyerpole" />
      </div>

      {/* ---- STRING LIGHTS across the top ---- */}
      <div className="lights-row">
        {Array.from({ length: 8 }, (_, i) => <Prop key={i} name="string_lights" s={3.4} className="lights" />)}
      </div>

      {/* ---- STAGE: spotlight + backline + band ---- */}
      <div className="stage">
        <div className="spotlight" />
        <div className="backline">
          <Prop name="pa_speaker_stack" s={5} className="prop pa pa-l" />
          <div className="band">
            <span className="player p-sing"><PixelPerson hair="#ffd23f" shirt="#b3245e" pose="sing" s={6} /></span>
            <span className="player p-guitar"><PixelPerson hair="#4cc9f0" shirt="#243a6e" pose="play" s={5.4} /></span>
            <span className="player p-drum"><PixelPerson hair="#7cf06a" shirt="#2a2a35" pose="cheer" s={4.8} /></span>
            <Prop name="mic_stand" s={5} className="prop mic" />
            <Prop name="floor_amp" s={4.6} className="prop amp" />
          </div>
          <Prop name="pa_speaker_stack" s={5} className="prop pa pa-r" />
          <Prop name="stage_riser" s={9} className="prop riser" />
        </div>
      </div>

      {/* ---- CROWD (foreground, backlit by the floor wash) ---- */}
      <div className="floor-glow" />
      <div className="crowd">
        {crowd.map((c, i) => (
          <span key={i} className="fan" style={{ left: `${c.left}%`, bottom: c.row ? '34%' : '0', animationDelay: `${c.delay}s`, zIndex: c.row ? 3 : 4 }}>
            <PixelPerson hair={c.hair} shirt="#0c0a16" pose="cheer" s={c.s} silhouette />
          </span>
        ))}
      </div>

      {/* side props */}
      <Prop name="crate_stack" s={3.4} className="prop crates" />
      <Prop name="keg_cooler" s={3.4} className="prop keg" />
      <Prop name="guitar_case" s={3.2} className="prop gcase" />

      <div className="haze" />

      {/* ---- LOGO BANNER + MENU ---- */}
      <div className="menu-stage">
        <div className="hero-col">
          <div className="banner">
            <span className="banner-pin pin-l" />
            <span className="banner-pin pin-r" />
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
              <PixelButton variant="secondary" size="lg" fullWidth onClick={() => { haptics.light(); onUpgrades(); }} icon="⭐">Scene Cred</PixelButton>
            )}
            {onSettings && (
              <PixelButton variant="ghost" size="lg" fullWidth onClick={() => { haptics.light(); onSettings(); }} icon="⚙️">Settings</PixelButton>
            )}
          </div>
          <div className="menu-footer"><p className="version">v1.0.0 • Made with ❤ and 🤘</p></div>
        </div>
      </div>

      <div className="crt-scanlines" />

      <style>{`
        .pixel-main-menu {
          position: relative; min-height: 100vh; min-height: 100dvh; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Press Start 2P', ui-monospace, monospace; -webkit-font-smoothing: none;
          background: linear-gradient(180deg, #0a0814 0%, #150b27 60%, #1d1338 100%);
          padding: max(16px, env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(22px, env(safe-area-inset-left));
        }
        .pixel-main-menu[data-outdoor="true"] { background: linear-gradient(180deg, #241140 0%, #5a2b66 42%, #b5556a 78%, #e88a6a 100%); }

        /* ---- backdrop ---- */
        .backdrop { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
        .wall {
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 46px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 24px),
            linear-gradient(180deg, #2c1d33 0%, #241629 60%, #160e1d 100%);
          opacity: 0; transition: opacity 0.6s ease 0.1s;
        }
        [data-revealed="true"] .wall { opacity: 1; }
        .dusk-stars span { position: absolute; width: 2px; height: 2px; background: #fff; opacity: .8; animation: twinkle 3s ease-in-out infinite; }
        @keyframes twinkle { 0%,100%{opacity:.2} 50%{opacity:.95} }
        .fest-skyline { position: absolute; left: 0; right: 0; bottom: 28%; width: 100%; height: 34vh; image-rendering: pixelated; opacity: .9; }

        .prop { position: absolute; image-rendering: pixelated; pointer-events: none; }
        .poster { bottom: 38%; left: 7%; opacity: 0; transition: opacity .5s ease .3s; filter: drop-shadow(0 4px 0 rgba(0,0,0,.4)); }
        .flyerpole { bottom: 30%; right: 9%; opacity: 0; transition: opacity .5s ease .4s; }
        [data-revealed="true"] .poster, [data-revealed="true"] .flyerpole { opacity: 1; }
        [data-outdoor="true"] .poster, [data-outdoor="true"] .flyerpole { display: none; }

        /* ---- string lights ---- */
        .lights-row { position: absolute; top: max(8px, env(safe-area-inset-top)); left: -2%; right: -2%; z-index: 8; display: flex; justify-content: space-between; pointer-events: none;
          transform: translateY(-120%); transition: transform .7s cubic-bezier(.2,.9,.3,1) .15s; filter: drop-shadow(0 0 7px rgba(255,210,120,.5)); }
        [data-revealed="true"] .lights-row { transform: translateY(0); }
        .lights { flex: 0 0 auto; }

        /* ---- stage ---- */
        .stage { position: absolute; left: 0; right: 0; bottom: 8%; z-index: 2; display: flex; justify-content: center; align-items: flex-end; pointer-events: none; }
        .spotlight { position: absolute; bottom: -20%; left: 50%; transform: translateX(-50%); width: 80%; height: 170%;
          background: radial-gradient(58% 82% at 50% 100%, color-mix(in srgb, var(--accent) 60%, transparent) 0%, transparent 72%);
          opacity: 0; transition: opacity .9s ease .5s; mix-blend-mode: screen; }
        [data-revealed="true"] .spotlight { opacity: 1; }
        .floor-glow { position: absolute; left: 0; right: 0; bottom: 0; height: 42%; z-index: 4; pointer-events: none;
          background:
            radial-gradient(90% 120% at 50% 100%, color-mix(in srgb, var(--accent) 38%, transparent) 0%, transparent 68%),
            linear-gradient(0deg, rgba(255,150,90,.22), transparent 60%);
          opacity: 0; transition: opacity .9s ease .5s; mix-blend-mode: screen; }
        [data-revealed="true"] .floor-glow { opacity: .85; }
        .backline { position: relative; display: flex; align-items: flex-end; gap: 0; }
        .riser { position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); z-index: -1; filter: drop-shadow(0 6px 0 rgba(0,0,0,.45)); }
        .band { display: flex; align-items: flex-end; gap: 8px; padding: 0 6px 10px; }
        .player { animation: bob 1.4s ease-in-out infinite; }
        .p-guitar { animation-delay: .2s; } .p-drum { animation-delay: .4s; }
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .pa { align-self: flex-end; filter: drop-shadow(0 5px 0 rgba(0,0,0,.4)); }
        .mic { position: absolute; left: 4px; bottom: 8px; }
        .amp { position: absolute; right: 8px; bottom: 8px; }

        /* ---- crowd ---- */
        .crowd { position: absolute; left: 0; right: 0; bottom: 6%; height: 22%; z-index: 5; pointer-events: none; }
        .fan { position: absolute; transform-origin: bottom; animation: jump 0.7s ease-in-out infinite;
          opacity: 0; transition: opacity .4s ease; }
        [data-revealed="true"] .fan { opacity: 1; }
        @keyframes jump { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-5px)} }

        .crates { bottom: 7%; left: 4%; z-index: 6; opacity:0; transition:opacity .5s ease .5s; }
        .keg { bottom: 7%; left: 12%; z-index: 6; opacity:0; transition:opacity .5s ease .55s; }
        .gcase { bottom: 7%; right: 5%; z-index: 6; opacity:0; transition:opacity .5s ease .6s; }
        [data-revealed="true"] .crates, [data-revealed="true"] .keg, [data-revealed="true"] .gcase { opacity: 1; }

        .haze { position: absolute; inset: 0; z-index: 7; pointer-events: none;
          background: radial-gradient(130% 90% at 50% 36%, transparent 56%, rgba(8,5,16,.5) 100%); }

        /* ---- logo banner + menu ---- */
        .menu-stage { position: relative; z-index: 10; width: 100%; max-width: 1000px;
          display: flex; flex-direction: column; align-items: center; gap: clamp(14px,4vh,30px); }
        .hero-col { text-align: center; }

        .banner {
          position: relative; display: inline-block; padding: 14px clamp(28px,7vw,60px) 16px;
          background: linear-gradient(180deg, #fbe9c8 0%, #f3d6a0 100%);
          color: #2a1020; border-radius: 2px;
          box-shadow: 0 0 0 3px #3a210f, 0 10px 22px rgba(0,0,0,.5);
          clip-path: polygon(0 6%, 3% 0, 97% 0, 100% 6%, 100% 88%, 96% 100%, 4% 100%, 0 88%);
          transform: translateY(-18px) rotate(-1deg); opacity: 0;
          transition: transform .7s cubic-bezier(.2,1.3,.4,1) .25s, opacity .5s ease .25s;
        }
        [data-revealed="true"] .banner { transform: translateY(0) rotate(-1deg); opacity: 1; }
        .banner-pin { position: absolute; top: -7px; width: 9px; height: 9px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ff5da2, #b3245e); box-shadow: 0 0 5px rgba(247,37,133,.8); }
        .pin-l { left: 10px; } .pin-r { right: 10px; }

        .title-text { margin: 0; line-height: 1; color: #c81e63; text-transform: uppercase;
          font-size: clamp(17px, 3.6vw, 34px); letter-spacing: clamp(2px,.8vw,6px);
          text-shadow: 2px 2px 0 #fbe9c8, 3px 3px 0 #7a1540; }
        .subtitle-text { margin: 2px 0 0; line-height: .95; color: #e23b18; text-transform: uppercase;
          font-size: clamp(36px, 9vw, 78px); letter-spacing: clamp(3px,1.4vw,10px);
          text-shadow: 2px 2px 0 #fbe9c8, 4px 4px 0 #7a1540; }

        .tagline { margin: clamp(12px,3vh,20px) 0 0; font-family: 'Bebas Neue','Oswald','Press Start 2P',sans-serif;
          font-size: clamp(12px,1.7vw,17px); letter-spacing: 2px; color: #f0d9b8; text-transform: uppercase;
          text-shadow: 1px 1px 2px #000; opacity: 0; transition: opacity .6s ease .7s; }
        [data-revealed="true"] .tagline { opacity: .96; }
        .venue { color: var(--accent); }

        .menu-col { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 14px; }
        .menu-buttons { display: flex; flex-direction: column; gap: 13px; }
        .menu-buttons > * { opacity: 0; transform: translateY(12px); transition: opacity .5s ease, transform .5s ease; }
        [data-revealed="true"] .menu-buttons > * { opacity: 1; transform: translateY(0); }
        [data-revealed="true"] .menu-buttons > *:nth-child(1){transition-delay:.55s}
        [data-revealed="true"] .menu-buttons > *:nth-child(2){transition-delay:.65s}
        [data-revealed="true"] .menu-buttons > *:nth-child(3){transition-delay:.75s}
        [data-revealed="true"] .menu-buttons > *:nth-child(4){transition-delay:.85s}
        .menu-footer { text-align: center; opacity: 0; transition: opacity .6s ease 1s; }
        [data-revealed="true"] .menu-footer { opacity: 1; }
        .version { font-size: 7px; color: #b9a9c9; margin: 0; letter-spacing: 1px; text-transform: uppercase; text-shadow: 1px 1px 1px #000; }

        .crt-scanlines { position: absolute; inset: 0; z-index: 11; pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 1px, transparent 1px 3px); opacity: .3; }

        /* accent var per tier */
        .pixel-main-menu { --accent: #f72585; }
        .pixel-main-menu[data-tier="dive"] { --accent: #4cc9f0; }
        .pixel-main-menu[data-tier="theater"] { --accent: #ffd23f; }
        .pixel-main-menu[data-tier="festival"] { --accent: #3ad17e; }

        /* ---- landscape: hero + menu side by side; show fills the floor ---- */
        @media (min-aspect-ratio: 13/10) and (max-height: 600px) {
          .menu-stage { flex-direction: row; align-items: center; justify-content: space-between; gap: clamp(20px,4vw,56px); padding: 0 clamp(8px,3vw,40px); }
          .hero-col { flex: 1 1 auto; }
          .menu-col { flex: 0 0 auto; max-width: 300px; }
          .menu-buttons { gap: 10px; }
          .menu-footer { display: none; }
          .stage { bottom: 4%; }
          .crowd { bottom: 2%; height: 26%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wall,.poster,.flyerpole,.lights-row,.spotlight,.fan,.crates,.keg,.gcase,.banner,.tagline,.menu-buttons>*,.menu-footer { transition: none !important; opacity: 1 !important; transform: none !important; }
          .player,.fan,.dusk-stars span { animation: none !important; }
          .lights-row { transform: none !important; }
        }
      `}</style>
    </div>
  );
};

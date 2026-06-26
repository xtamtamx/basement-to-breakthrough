import React, { useState, useEffect, useRef } from 'react';
import { PixelButton } from '@components/ui/PixelButton';
import { haptics } from '@utils/mobile';
import { getTitleTier } from '@game/world/titleStage';
import { gameAudio } from '@utils/gameAudio';

// The title theme bed per career tier, and its BPM (mirrors gameAudio's MUSIC_TRACKS)
// for the drummer's self-clock when audio is suspended (iOS pre-gesture).
const TITLE_TRACK: Record<string, 'chill' | 'intense' | 'festival'> = {
  basement: 'chill', dive: 'intense', theater: 'festival', festival: 'festival',
};
const TRACK_BPM: Record<string, number> = { chill: 96, intense: 142, festival: 124 };

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
  mic_stand: [12, 24], poster_wall: [18, 20], crate_stack: [16, 18],
  road_case: [18, 14], guitar_case: [12, 20], cable_coil: [14, 8],
  keg_cooler: [12, 16], flyer_pole: [14, 26], sandwich_board: [16, 18],
  stage_riser: [20, 12], pipe_run: [34, 9], duct_vent: [22, 14],
  basement_window: [28, 18], water_heater: [16, 28], support_post: [9, 70],
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

// Band members — each is ONE baked sprite: an ELV chibi character composited with a
// downscaled real instrument + hand-drawn sleeved arms gripping it, so they actually
// read as PLAYING (not an instrument floating on a plain idle pose). Authored by
// scripts/makeBandMembers.mjs → public/title/band/members/{name}.png.
const BAND_SRC = '/title/band';
const MEMBER_SIZE: Record<string, [number, number]> = {
  guitar: [42, 36], sing: [34, 36], bass: [42, 36], drum: [46, 38],
};
const Member: React.FC<{ name: keyof typeof MEMBER_SIZE; s?: number; className?: string }> = ({ name, s = 3, className }) => {
  const [w, h] = MEMBER_SIZE[name];
  return <img src={`${BAND_SRC}/members/${name}.png`} alt="" aria-hidden className={className}
    style={{ width: w * s, height: h * s, imageRendering: 'pixelated' }} />;
};

// The logo styled as a venue DRINK TICKET: a manila stub with a perforated tear-off
// ("GOOD FOR ONE DRINK"), an "ADMIT ONE" kicker, and the title as the event.
const Ticket: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`ticket${className ? ` ${className}` : ''}`}>
    <div className="t-body">
      <span className="t-kicker">★ ADMIT ONE ★</span>
      <h1 className="t-title">SETTLING</h1>
      <h2 className="t-sub">UP</h2>
    </div>
    <div className="t-stub" aria-hidden>
      <span className="t-stub-text">★ ONE DRINK ★</span>
    </div>
  </div>
);


export const PixelArtMainMenu: React.FC<PixelArtMainMenuProps> = ({
  onStartGame, onContinueGame, onSettings, onUpgrades, hasSavedGame = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  // The logo holds as a "touch to start" splash; the first touch IS the gesture that
  // unlocks iOS audio, so the theme music kicks in exactly when the show reveals.
  const [started, setStarted] = useState(false);
  const tier = getTitleTier();
  const titleTrack = TITLE_TRACK[tier.id] ?? 'chill';

  const start = () => {
    if (started) return;
    setStarted(true);
    setRevealed(true);
    haptics.medium();
    try { gameAudio.resume(); gameAudio.startBackgroundMusic(titleTrack); } catch { /* audio optional */ }
  };

  // Drummer layers — the kit is planted; only these animate on the beat.
  const drumBodyRef = useRef<HTMLImageElement>(null);
  const drumSticksRef = useRef<HTMLImageElement>(null);
  const fxKickRef = useRef<HTMLSpanElement>(null);
  const fxSnareRef = useRef<HTMLSpanElement>(null);
  const fxHatRef = useRef<HTMLSpanElement>(null);

  // Keyboard fallback for the "touch to start" gate (Enter/Space).
  useEffect(() => {
    if (started) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') start(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Title theme bed + the drummer playing IN TIME with it. The kit stays still;
  // sticks tap and each drum (kick/snare/hat) reacts on its own hit. Driven by
  // gameAudio's beat events when the music sounds; a self-clock at the track BPM
  // keeps the drummer alive when the AudioContext is still suspended (iOS, pre-gesture).
  useEffect(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // play the theme bed (sounds once audio unlocks; no-op if audio is disabled)
    gameAudio.startBackgroundMusic(titleTrack);
    if (reduce) return; // honor reduced-motion: no drummer animation

    const restart = (el: HTMLElement | null) => {
      if (!el) return;
      el.classList.remove('hit');
      void el.offsetWidth; // reflow to retrigger the one-shot animation
      el.classList.add('hit');
    };
    const play = (b: { kick: boolean; snare: boolean; hat: boolean }) => {
      if (b.kick) { restart(fxKickRef.current); restart(drumSticksRef.current); restart(drumBodyRef.current); }
      if (b.snare) { restart(fxSnareRef.current); restart(drumSticksRef.current); }
      if (b.hat) restart(fxHatRef.current);
    };

    let lastAudioBeat = 0;
    const off = gameAudio.onMusicBeat((b) => { lastAudioBeat = performance.now(); play(b); });

    // Self-clock fallback: only drives when no audio beats have arrived recently.
    const stepMs = 60000 / (TRACK_BPM[titleTrack] ?? 96) / 4; // 16th notes
    let step = 0;
    const clock = window.setInterval(() => {
      if (performance.now() - lastAudioBeat < 400) return; // audio is driving
      const inBar = step % 16; step = (step + 1) % 16;
      play({ kick: inBar === 0 || inBar === 8, snare: inBar === 4 || inBar === 12, hat: inBar % 4 === 2 });
    }, stepMs);

    return () => { off(); window.clearInterval(clock); };
    // Do NOT stop the bed on unmount — it flows seamlessly into the in-game music.
  }, [titleTrack]);

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

  // Per-tier ROOM DRESSING — grows with the venue (basement→theater). Festival is the
  // outdoor path and dresses itself (sky/skyline). Kept LEFT of ~30% so it never reaches
  // the right-side menu column in landscape.
  const ROOM: Record<string, { flyers: number; hero: 'bulb' | 'barglow' | 'marquee' | null; backline: string[]; riser: boolean; fg: string[]; board: boolean; ceiling: 'joists' | 'clean' | null; window: boolean; corner: boolean }> = {
    basement: { flyers: 6, hero: 'bulb',    backline: ['floor_amp', 'crate_stack', 'floor_amp'],            riser: false, fg: ['guitar_case', 'cable_coil'], board: false, ceiling: 'joists', window: true,  corner: true },
    dive:     { flyers: 4, hero: 'barglow', backline: ['floor_amp', 'road_case', 'floor_amp', 'floor_amp'], riser: false, fg: ['keg_cooler', 'cable_coil'],   board: true,  ceiling: 'joists', window: true,  corner: false },
    theater:  { flyers: 2, hero: 'marquee', backline: ['road_case', 'crate_stack'],                          riser: true,  fg: [],                            board: false, ceiling: 'clean',  window: false, corner: false },
    festival: { flyers: 0, hero: null,      backline: [],                                                    riser: true,  fg: [],                            board: false, ceiling: null,     window: false, corner: false },
  };
  const room = ROOM[tier.id] ?? ROOM.basement;
  // plastered flyers, upper-LEFT focal wall: varied position / tilt / scale, overlapping.
  const flyers = Array.from({ length: room.flyers }, (_, i) => ({
    left: 3 + (i % 3) * 8.5 + ((i * 5) % 3) * 1.5,           // 3–22%
    top: 9 + Math.floor(i / 3) * 17 + ((i * 7) % 3) * 3,     // stacked rows on the upper wall
    rot: ((i * 11) % 7) - 3,                                  // −3…3°
    s: 2.1 + ((i * 3) % 3) * 0.3,
  }));

  return (
    <div className="pixel-main-menu" data-revealed={revealed} data-started={started} data-tier={tier.id} data-outdoor={tier.outdoor}>
      {/* ===== ROOM ===== */}
      <div className="room">
        {/* low basement ceiling: exposed joists + pipes + an HVAC duct */}
        {!tier.outdoor && room.ceiling && (
          <div className="ceiling" data-ceil={room.ceiling}>
            {room.ceiling === 'joists' && (
              <>
                <Prop name="pipe_run" s={3.2} className="pipe pipe-1" />
                <Prop name="pipe_run" s={2.7} className="pipe pipe-2" />
                <Prop name="duct_vent" s={3} className="duct" />
              </>
            )}
          </div>
        )}
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
          <div className="wall">
            {flyers.map((f, i) => (
              <Prop key={i} name="poster_wall" s={f.s} className="flyer"
                style={{ position: 'absolute', left: `${f.left}%`, top: `${f.top}%`, transform: `rotate(${f.rot}deg)`, zIndex: 3 }} />
            ))}
            {room.flyers > 0 && (
              <Prop name="flyer_pole" s={2.4} className="flyer"
                style={{ position: 'absolute', left: '25%', bottom: '3%', zIndex: 3 }} />
            )}
            {room.window && <Prop name="basement_window" s={3.2} className="bsmt-window" />}
          </div>
        )}
        {/* back-corner basement clutter: support column + water heater */}
        {!tier.outdoor && room.corner && (
          <div className="bsmt-corner">
            <Prop name="support_post" s={2.3} className="post" />
            <Prop name="water_heater" s={2.6} className="heater" />
          </div>
        )}
        {/* motivated warm hero light (per tier) + dusty light shaft over the band */}
        {!tier.outdoor && room.hero === 'bulb' && <div className="bulb" />}
        {!tier.outdoor && room.hero === 'barglow' && <div className="bar-glow" />}
        {!tier.outdoor && room.hero === 'marquee' && <div className="marquee">{tier.venue.toUpperCase()}</div>}
        <div className="light-shaft" />
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
        {room.backline.length > 0 && (
          <div className="backline-gear">
            {room.backline.map((g, i) => <Prop key={i} name={g as keyof typeof PROP_SIZE} s={2.3} />)}
          </div>
        )}
        <div className="backline">
          <Prop name="pa_speaker_stack" s={2.5} className="pa pa-l" />
          <div className="band">
            <span className="drum-riser" aria-hidden />
            <span className="bandmate b0"><Member name="guitar" /></span>
            <span className="bandmate b1"><Member name="sing" /></span>
            <span className="bandmate b2"><Member name="bass" /></span>
            <span className="bandmate b3 drummer">
              <span className="drum-rig" style={{ width: 46 * 3, height: 38 * 3 }}>
                <img ref={drumBodyRef} className="drum-l drum-body" src={`${BAND_SRC}/members/drum_body.png`} alt="" aria-hidden />
                <img className="drum-l drum-kit" src={`${BAND_SRC}/members/drum_kit.png`} alt="" aria-hidden />
                <img ref={drumSticksRef} className="drum-l drum-sticks" src={`${BAND_SRC}/members/drum_sticks.png`} alt="" aria-hidden />
                <span ref={fxKickRef} className="drum-fx kick" />
                <span ref={fxSnareRef} className="drum-fx snare" />
                <span ref={fxHatRef} className="drum-fx hat" />
              </span>
            </span>
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

      {/* ===== FOREGROUND FRAME (darkest plane, lower corners only) ===== */}
      {room.fg.length > 0 && (
        <div className="foreground">
          {room.fg.map((g, i) => (
            <Prop key={i} name={g as keyof typeof PROP_SIZE} s={2.6} className="fg-prop" style={{ left: `${3 + i * 7}%` }} />
          ))}
          {room.board && (
            <Prop name="sandwich_board" s={2.6} className="fg-prop fg-board" style={{ left: '22%' }} />
          )}
        </div>
      )}

      <div className="vignette" />

      {/* ===== LOGO + MENU ===== */}
      <div className="menu-stage">
        <div className="hero-col">
          <Ticket />
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

      {/* ===== "TOUCH TO START" splash gate (also unlocks audio on first touch) ===== */}
      <div className="splash-gate" data-on={!started} onPointerDown={start} role="button" tabIndex={0} aria-label="Touch to start">
        <div className="splash-inner">
          <Ticket className="splash-ticket" />
          <p className="splash-tag"><span className="venue">{tier.venue}</span> — {tier.blurb}</p>
          <div className="touch-hint">TOUCH TO START</div>
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
        /* BASEMENT base: poured concrete, faint horizontal form-tie streaks (NOT a tile grid),
           hard-banded warm-purple, depth-fade to top+right, corner soot. */
        .wall { position: absolute; left: 0; right: 0; top: 0; bottom: 33%;
          --wall-a: #3a2a3e; --wall-b: #241a2c; --mortar: rgba(0,0,0,.10);
          background:
            repeating-linear-gradient(0deg, var(--mortar) 0 2px, transparent 2px 24px),
            linear-gradient(180deg, var(--wall-a) 0 60%, var(--wall-b) 60% 100%);
          opacity: 0; transition: opacity .5s ease; }
        [data-revealed="true"] .wall { opacity: 1; }
        .wall::before { content: ""; position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(90deg, transparent 21.5%, rgba(0,0,0,.30) 22%, transparent 22.5%),
            linear-gradient(90deg, transparent 70.5%, rgba(0,0,0,.30) 71%, transparent 71.5%),
            radial-gradient(120% 95% at 30% 100%, transparent 34%, rgba(10,6,18,.74) 100%); }
        .wall::after { content: ""; position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(circle at 14% 16%, rgba(0,0,0,.34), transparent 24%),
            radial-gradient(circle at 86% 96%, rgba(0,0,0,.30), transparent 30%); }
        /* DIVE: painted cinderblock — the ONLY grid tier, BIG 2:1 (92x46) cells. */
        .pixel-main-menu[data-tier="dive"] .wall {
          --wall-a: #3d2a3a; --wall-b: #2a1826;
          background:
            repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 46px),
            repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 2px, transparent 2px 46px),
            repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0 2px, transparent 2px 92px),
            linear-gradient(180deg, var(--wall-a) 0 60%, var(--wall-b) 60% 100%); }
        /* THEATER: clean papered wainscot + gold dado rail at 60% (clean = earned, not empty). */
        .pixel-main-menu[data-tier="theater"] .wall {
          --wall-a: #3e2c46; --wall-b: #2c1e34;
          background:
            linear-gradient(180deg, rgba(255,210,120,.10) 0 2px, transparent 2px 4px) 0 60% / 100% 4px no-repeat,
            linear-gradient(180deg, var(--wall-a) 0 60%, var(--wall-b) 60% 100%); }
        .pixel-main-menu[data-tier="theater"] .wall::after { background: none; }
        .wall-poster { position: absolute; left: 7%; bottom: 8%; filter: drop-shadow(0 2px 0 rgba(0,0,0,.4)); }

        /* ===== basement structure: low exposed-joist ceiling, pipes, window, clutter ===== */
        .ceiling { position: absolute; top: 0; left: 0; right: 0; height: 13%; z-index: 2; pointer-events: none;
          background:
            repeating-linear-gradient(90deg, #271a11 0 15px, #33241850 15px 17px),
            linear-gradient(180deg, #1b120b 0%, #2a1c11 70%, #1d130b 100%);
          box-shadow: inset 0 -3px 7px rgba(0,0,0,.5), 0 3px 7px rgba(0,0,0,.55);
          border-bottom: 2px solid #100b06; opacity: 0; transition: opacity .5s ease; }
        [data-revealed="true"] .ceiling { opacity: 1; }
        .ceiling[data-ceil="clean"] { height: 7%; background: linear-gradient(180deg, #30223a, #241a2c);
          border-bottom: 2px solid color-mix(in srgb, var(--accent) 40%, #6a4a20); box-shadow: 0 2px 5px rgba(0,0,0,.4); }
        .pipe { position: absolute; image-rendering: pixelated; filter: drop-shadow(0 2px 0 rgba(0,0,0,.45)); }
        .pipe-1 { left: 5%; bottom: -16%; }
        .pipe-2 { left: 50%; bottom: 18%; }
        .duct { position: absolute; right: 33%; bottom: -2%; image-rendering: pixelated; filter: drop-shadow(0 2px 0 rgba(0,0,0,.5)); }
        .bsmt-window { position: absolute; left: 25%; top: 20%; z-index: 1; filter: drop-shadow(0 2px 0 rgba(0,0,0,.4)); }
        .bsmt-corner { position: absolute; left: 1%; bottom: 31%; z-index: 1; display: flex; align-items: flex-end; gap: 3px;
          filter: brightness(.66) saturate(.9); opacity: 0; transition: opacity .5s ease; }
        [data-revealed="true"] .bsmt-corner { opacity: 1; }
        .sky { position: absolute; left: 0; right: 0; top: 0; bottom: 30%;
          background: linear-gradient(180deg, #1d1140 0%, #5a2b66 55%, #b5556a 100%); }
        .dusk-stars span { position: absolute; width: 2px; height: 2px; background: #fff; opacity: .85; animation: tw 3s ease-in-out infinite; }
        @keyframes tw { 0%,100%{opacity:.2} 50%{opacity:.95} }
        .fest-skyline { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 70%; image-rendering: pixelated; }

        /* warm glow on the back wall behind the stage */
        .stage-wash { position: absolute; left: 50%; transform: translateX(-50%); bottom: 30%; width: 64%; height: 46%; z-index: 1; pointer-events: none;
          background: radial-gradient(60% 80% at 50% 100%, color-mix(in srgb, color-mix(in srgb, var(--accent) 55%, rgb(255,200,120)) 32%, transparent), transparent 72%);
          opacity: 0; transition: opacity .8s ease .4s; mix-blend-mode: screen; }
        [data-revealed="true"] .stage-wash { opacity: 1; }

        /* ===== motivated warm lighting (bare bulb → light shaft → warmed spot) ===== */
        .bulb { position: absolute; left: 30%; top: 8%; z-index: 3; pointer-events: none; transform: translateX(-50%);
          width: 10px; height: 10px; border-radius: 50%;
          background: radial-gradient(circle at 40% 35%, #fff 0 25%, #ffce7a 55%, #c98a30 100%);
          box-shadow: 0 0 0 1px rgba(0,0,0,.4); }
        .bulb::before { content: ""; position: absolute; left: 50%; top: -60px; width: 1px; height: 60px; background: rgba(0,0,0,.45); transform: translateX(-50%); }
        .bulb::after { content: ""; position: absolute; left: 50%; top: 50%; width: 170px; height: 170px; transform: translate(-50%,-50%); border-radius: 50%;
          background: radial-gradient(circle, rgba(255,200,120,.50), transparent 60%); mix-blend-mode: screen;
          animation: bulbBreathe 5s ease-in-out infinite; }
        @keyframes bulbBreathe { 0%,100%{opacity:.82} 50%{opacity:1} }
        .light-shaft { position: absolute; left: 30%; top: 6%; bottom: 33%; width: 46%; z-index: 2; transform: translateX(-50%); pointer-events: none;
          background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 24%, rgba(255,220,150,.18)) 0%, transparent 78%);
          clip-path: polygon(40% 0, 60% 0, 80% 100%, 20% 100%); mix-blend-mode: screen; opacity: .5;
          animation: bulbBreathe 5s ease-in-out infinite .3s; }
        [data-outdoor="true"] .light-shaft { background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, rgba(255,200,120,.16)) 0%, transparent 80%); }
        /* dive hero: warm bar-glow panel; theater hero: lit marquee plate */
        .bar-glow { position: absolute; left: 22%; top: 16%; z-index: 3; width: 54px; height: 30px; transform: translateX(-50%); pointer-events: none; border-radius: 3px;
          background: linear-gradient(180deg,#1a0f18,#2a1620); box-shadow: 0 2px 0 rgba(0,0,0,.5); }
        .bar-glow::after { content: ""; position: absolute; left: 50%; top: 50%; width: 104px; height: 74px; transform: translate(-50%,-50%);
          background: radial-gradient(circle, color-mix(in srgb, var(--accent) 46%, rgba(255,190,110,.32)), transparent 66%); mix-blend-mode: screen; opacity: .78;
          animation: bulbBreathe 4s ease-in-out infinite; }
        .marquee { position: absolute; left: 22%; top: 13%; z-index: 3; transform: translateX(-50%); pointer-events: none;
          padding: 3px 9px; border-radius: 2px; background: #1a1208; color: #ffe9b0;
          font-family: 'Bebas Neue','Oswald',sans-serif; font-size: 11px; letter-spacing: 2px;
          box-shadow: 0 0 0 2px var(--accent), 0 0 16px color-mix(in srgb, var(--accent) 55%, rgba(255,200,120,.6)); }

        /* plastered flyers on the wall */
        .flyer { filter: drop-shadow(1px 2px 0 rgba(0,0,0,.5)); }
        /* midground backline gear — a DARKER value plane behind the band */
        .backline-gear { position: absolute; left: 50%; transform: translateX(-50%); bottom: 4px; z-index: -1;
          display: flex; align-items: flex-end; justify-content: center; gap: 12px; pointer-events: none;
          filter: brightness(.58) saturate(.9); }
        /* foreground frame: lowest darkest plane, hugging the bottom-left corner */
        .foreground { position: absolute; left: 0; right: 0; bottom: 0; height: 30%; z-index: 6; pointer-events: none; }
        .fg-prop { position: absolute; bottom: 1%; filter: brightness(.5) drop-shadow(0 2px 0 rgba(0,0,0,.55)); image-rendering: pixelated; }

        /* Floor recedes (dark far / lit near) + catches the stage glow as a reflected puddle. */
        .floor { position: absolute; left: 0; right: 0; bottom: 0; height: 33%; z-index: 1;
          background:
            linear-gradient(180deg, rgba(0,0,0,.34), transparent 42%),
            repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 1px, transparent 1px 9px),
            repeating-linear-gradient(90deg, rgba(0,0,0,.14) 0 1px, transparent 1px 34px),
            linear-gradient(180deg, #4a3324 0%, #38261a 60%, #2a1c12 100%);
          opacity: 0; transition: opacity .5s ease; }
        [data-revealed="true"] .floor { opacity: 1; }
        .floor::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 60%; pointer-events: none;
          background: radial-gradient(46% 78% at 50% 0%, color-mix(in srgb, var(--accent) 22%, rgba(255,200,120,.16)), transparent 70%);
          mix-blend-mode: screen; }
        .pixel-main-menu[data-tier="basement"] .floor { filter: saturate(.85) brightness(.94); }
        .pixel-main-menu[data-tier="dive"] .floor::after { content: ""; position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(circle at 24% 55%, rgba(0,0,0,.50), transparent 9%),
            radial-gradient(circle at 40% 72%, rgba(0,0,0,.42), transparent 7%); }
        .pixel-main-menu[data-tier="theater"] .floor { background:
          linear-gradient(180deg, rgba(0,0,0,.28), transparent 42%),
          repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 1px, transparent 1px 9px),
          repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 1px, transparent 1px 40px),
          linear-gradient(180deg, #5a4030 0%, #45301f 60%, #341f12 100%); }
        [data-outdoor="true"] .floor { background:
          repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 1px, transparent 1px 30px),
          linear-gradient(180deg, #6a4a36 0%, #4a3122 100%); }
        [data-outdoor="true"] .floor::before { background: radial-gradient(46% 78% at 50% 0%, color-mix(in srgb, var(--accent) 20%, rgba(255,200,120,.14)), transparent 70%); mix-blend-mode: screen; }

        /* Built baseboard: lit top lip + molding body + dark cast-shadow underside. */
        .floor-line { position: absolute; left: 0; right: 0; bottom: 33%; height: 12px; z-index: 2; pointer-events: none;
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--accent) 16%, #2a1c2e) 0 2px,
            #241830 2px 6px,
            rgba(0,0,0,.50) 6px 12px);
          box-shadow: 0 1px 0 color-mix(in srgb, var(--accent) 18%, transparent); }
        .pixel-main-menu[data-tier="basement"] .floor-line { background:
          linear-gradient(180deg, #2a2230 0 3px, #1a1018 3px 8px, rgba(0,0,0,.5) 8px 12px); box-shadow: none; }
        .pixel-main-menu[data-tier="dive"] .floor-line { background:
          linear-gradient(180deg, #4a3320 0 2px, #2a1c12 2px 7px, rgba(0,0,0,.5) 7px 12px); }
        .pixel-main-menu[data-tier="theater"] .floor-line { height: 14px; background:
          linear-gradient(180deg, #ffd23f 0 1px, #6a4a20 1px 3px, #2c1e10 3px 8px, rgba(0,0,0,.5) 8px 14px); }
        [data-outdoor="true"] .floor-line { display: none; }

        /* ===== string lights ===== */
        .lights-row { position: absolute; top: 11%; left: -3%; right: -3%; z-index: 7; display: flex; justify-content: space-between; pointer-events: none;
          transform: translateY(-130%); transition: transform .7s cubic-bezier(.2,.9,.3,1) .15s; filter: drop-shadow(0 0 8px rgba(255,210,120,.55)); }
        [data-revealed="true"] .lights-row { transform: translateY(0); }

        /* ===== stage + band (centered focal element) ===== */
        /* base = portrait: band sits low (below the button stack, above the crowd) */
        .stage { position: absolute; left: 50%; transform: translateX(-50%); bottom: 13%; z-index: 4;
          display: flex; flex-direction: column; align-items: center; pointer-events: none;
          opacity: 0; transition: opacity .5s ease .35s; }
        [data-revealed="true"] .stage { opacity: 1; }
        .spot { position: absolute; bottom: -24%; left: 50%; transform: translateX(-50%); width: 150%; height: 150%;
          background: radial-gradient(46% 64% at 50% 92%, color-mix(in srgb, color-mix(in srgb, var(--accent) 60%, rgb(255,200,120)) 62%, transparent), transparent 70%); mix-blend-mode: screen; }
        .backline { position: relative; display: flex; align-items: flex-end; justify-content: center; gap: 14px; }
        .pa { filter: drop-shadow(0 3px 0 rgba(0,0,0,.45)); }
        /* Real-band stage formation: drummer raised at BACK-CENTER, singer FRONT-CENTER
           at the mic, guitarist front-LEFT, bassist front-RIGHT. */
        .band { position: relative; width: clamp(330px, 58vw, 460px); height: clamp(124px, 27vh, 168px); }
        .bandmate { position: absolute; transform-origin: bottom center; filter: drop-shadow(0 2px 0 rgba(0,0,0,.45)); }
        .bandmate img { display: block; }
        .bandmate > img { animation: headbang 0.62s ease-in-out infinite; transform-origin: bottom center; }
        .b0 { left: 3%; bottom: 0; z-index: 3; }                         /* guitar, front-left */
        .b1 { left: 50%; margin-left: -51px; bottom: 0; z-index: 4; }    /* singer, front-center (102/2) */
        .b1 > img { animation-delay: .1s; animation-duration: .54s; }
        .b2 { right: 3%; bottom: 0; z-index: 3; }                        /* bass, front-right */
        .b2 > img { animation-delay: .26s; animation-duration: .7s; }
        /* drummer raised at the back, smaller (further); kit planted, only player +
           sticks + each drum's hit-flash animate, in time with the music. */
        .drummer { left: 50%; margin-left: -69px; top: 5%; transform: scale(.72); transform-origin: top center; z-index: 1; }
        /* drum riser — grounds the raised drummer so it doesn't float */
        .drum-riser { position: absolute; left: 50%; transform: translateX(-50%); bottom: 0; height: 46%; width: 112px; z-index: 0;
          background: linear-gradient(180deg, #4c3623 0%, #382616 55%, #2a1c12 100%); border-top: 3px solid #62482f;
          box-shadow: 0 5px 10px rgba(0,0,0,.5); }
        @keyframes headbang { 0%,100%{transform:translateY(0) rotate(0)} 30%{transform:translateY(-3px) rotate(-3deg)} 60%{transform:translateY(-1px) rotate(3deg)} }
        .drum-rig { position: relative; display: block; }
        .drum-l { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
        .drum-body { z-index: 1; transform-origin: 50% 100%; }
        .drum-kit { z-index: 2; }
        .drum-sticks { z-index: 3; transform-origin: 50% 35%; }
        .drum-sticks.hit { animation: stickTap .12s ease-out; }
        .drum-body.hit { animation: drumBodyHit .16s ease-out; }
        .drum-fx { position: absolute; transform: translate(-50%,-50%) scale(.5); border-radius: 50%; pointer-events: none; opacity: 0; z-index: 4;
          background: radial-gradient(circle, rgba(255,242,214,.92), rgba(255,210,150,.34) 46%, transparent 72%); mix-blend-mode: screen; }
        .drum-fx.kick { left: 50%; top: 82%; width: 44%; height: 32%; }
        .drum-fx.snare { left: 37%; top: 62%; width: 28%; height: 22%; }
        /* hat = the left (hi-hat) cymbal shimmers */
        .drum-fx.hat { left: 24%; top: 42%; width: 26%; height: 24%; }
        .drum-fx.hit { animation: drumFlash .2s ease-out; }
        @keyframes stickTap { 0%{transform:translateY(0)} 40%{transform:translateY(3px)} 100%{transform:translateY(0)} }
        @keyframes drumBodyHit { 0%{transform:translateY(0)} 35%{transform:translateY(1.5px)} 100%{transform:translateY(0)} }
        @keyframes drumFlash { 0%{opacity:0; transform:translate(-50%,-50%) scale(.5)} 22%{opacity:.9; transform:translate(-50%,-50%) scale(1)} 100%{opacity:0; transform:translate(-50%,-50%) scale(1.18)} }
        .platform { width: clamp(300px, 60vw, 470px); height: clamp(10px, 2.4vh, 16px); margin-top: -2px;
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
        /* ===== logo as a venue DRINK TICKET ===== */
        .ticket { position: relative; display: inline-flex; align-items: stretch;
          background: linear-gradient(180deg, #f6e2b0 0%, #ecce8c 100%); color: #2a1020;
          border: 3px solid #3a210f; border-radius: 4px;
          box-shadow: inset 0 0 0 1px #fbeec6, 0 9px 20px rgba(0,0,0,.55);
          transform: translateY(-16px) rotate(-1.6deg); opacity: 0;
          transition: transform .7s cubic-bezier(.2,1.3,.4,1) .2s, opacity .5s ease .2s; }
        [data-revealed="true"] .ticket { transform: translateY(0) rotate(-1.6deg); opacity: 1; }
        .ticket::before { content: ""; position: absolute; inset: 4px; border: 1px solid #b07b38; border-radius: 2px; pointer-events: none; }
        .t-body { padding: 9px clamp(16px,3.6vw,34px) 11px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .t-kicker { font-family: 'Bebas Neue','Oswald',sans-serif; letter-spacing: clamp(2px,.7vw,5px); font-size: clamp(10px,1.5vw,15px); color: #9a3b1e; margin-bottom: 3px; }
        .t-title { margin: 0; line-height: 1; color: #c81e63; text-transform: uppercase;
          font-size: clamp(15px, 3vw, 30px); letter-spacing: clamp(2px,.7vw,6px); text-shadow: 2px 2px 0 #fbeec6; }
        .t-sub { margin: 1px 0 0; line-height: .95; color: #e23b18; text-transform: uppercase;
          font-size: clamp(32px, 8vw, 68px); letter-spacing: clamp(3px,1.2vw,10px); text-shadow: 2px 2px 0 #fbeec6, 4px 4px 0 rgba(0,0,0,.18); }
        .t-stub { display: flex; align-items: center; justify-content: center; padding: 0 clamp(7px,1.5vw,13px);
          border-left: 2px dashed #3a210f; background: linear-gradient(180deg, #eed79c 0%, #e1bf73 100%); border-radius: 0 2px 2px 0; }
        .t-stub-text { writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'Bebas Neue','Oswald',sans-serif;
          letter-spacing: clamp(2px,.5vw,4px); font-size: clamp(10px,1.5vw,16px); color: #6a3c12; white-space: nowrap; font-weight: 700; }

        /* ===== "touch to start" splash gate ===== */
        .splash-gate { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(125% 100% at 50% 28%, #1d1232 0%, #0c0712 100%); cursor: pointer;
          transition: opacity .55s ease; }
        .splash-gate[data-on="false"] { opacity: 0; pointer-events: none; }
        .splash-inner { display: flex; flex-direction: column; align-items: center; gap: clamp(16px,4.5vh,36px);
          padding: max(14px, env(safe-area-inset-top)) 20px max(14px, env(safe-area-inset-bottom)); }
        .splash-ticket { opacity: 1; transform: rotate(-2deg); }
        .splash-tag { margin: 0; font-family: 'Bebas Neue','Oswald',sans-serif; letter-spacing: 2px; color: #f0d9b8;
          font-size: clamp(12px,1.7vw,18px); text-transform: uppercase; text-shadow: 1px 1px 2px #000; }
        .touch-hint { font-family: 'Press Start 2P', ui-monospace, monospace; font-size: clamp(8px,1.3vw,12px); letter-spacing: 2px;
          color: #ffd23f; text-shadow: 1px 1px 0 rgba(0,0,0,.6); animation: touchPulse 1.25s ease-in-out infinite; }
        @keyframes touchPulse { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
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
          .bandmate,.fan,.dusk-stars span,.bulb::after,.light-shaft,.bar-glow::after,.drum-sticks,.drum-body,.drum-fx,.touch-hint { animation: none !important; }
          .lights-row { transform: none !important; }
          .fan { transform: translateX(-50%) !important; }
          .light-shaft { opacity: .5 !important; }
        }
      `}</style>
    </div>
  );
};

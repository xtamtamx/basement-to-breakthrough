/**
 * MapFXLayer — a transparent PixiJS (WebGL) particle overlay that floats neon
 * "scene energy" motes above the Canvas-2D town map. This is the project's first
 * live Pixi integration: cheap, additive, and gated by the FX-quality tier.
 *
 * Design (per the perf review): NO per-frame full-canvas texture upload (that
 * would blow the 60fps low-end budget) — Pixi only composites its own small
 * geometry. Motes share one soft glow texture + additive blend (so they batch
 * into ~one draw call) and twinkle/drift in screen space. On the HIGH tier a
 * real GPU GlowFilter is layered on for extra bloom; on LOW it's plain additive;
 * OFF renders nothing. If the GPU context fails to init, it silently no-ops and
 * the map is unaffected.
 *
 * pixi.js + pixi-filters are DYNAMICALLY imported inside the effect, so the
 * ~450KB renderer stays OUT of the initial bundle and only loads when the
 * overlay actually runs (high/low tier). Type-only imports are erased at build.
 *
 * Mounted as a pointer-events:none sibling INSIDE PixelCityMap's container, at a
 * z-index above the map canvas but below the CRT scanlines + zoom controls.
 */
import { useEffect, useRef } from 'react';
import type { Application, Sprite, Ticker } from 'pixi.js';
import { useFxQuality, fxParticleCount } from '@utils/fxQuality';
import { audio } from '@utils/simpleAudio';

const DEFAULT_ACCENTS = [0xf72585, 0x4cc9f0, 0xffd23f, 0x3ad17e, 0xc77dff, 0xff5c57];

/** Live screen-space point (CSS px) the surge-motes stream toward, or null. */
export type SurgePoint = { x: number; y: number } | null;

interface MapFXLayerProps {
  /** Per-city neon tints for the motes (hex ints). Defaults to the full palette. */
  accents?: number[];
  /** 0..1 show-night surge — brightens + livens the motes. Default 0. */
  intensity?: number;
  /** Stable ref to the playing venue's screen position; surge-motes stream to it. */
  surgeRef?: React.RefObject<SurgePoint>;
}

interface Mote {
  sp: Sprite;
  vy: number;
  drift: number;
  phase: number;
  tw: number;
  base: number;
  ai: number; // accent index (for re-tinting on city change)
  streamer: boolean; // a fraction of motes stream toward the playing venue
}

export const MapFXLayer: React.FC<MapFXLayerProps> = ({ accents, intensity = 0, surgeRef }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const quality = useFxQuality((s) => s.quality);
  // Reactive state read by the Pixi ticker — updated WITHOUT tearing down the app.
  const stateRef = useRef({ accents: accents?.length ? accents : DEFAULT_ACCENTS, intensity });
  const motesRef = useRef<Mote[]>([]);
  const audioLevelRef = useRef(0); // smoothed audio amplitude

  // City accents / show-night intensity change often (travel, per turn); fold them
  // into the ticker-read ref + re-tint live motes instead of re-initing Pixi.
  useEffect(() => {
    const acc = accents?.length ? accents : DEFAULT_ACCENTS;
    stateRef.current.accents = acc;
    stateRef.current.intensity = intensity;
    for (const m of motesRef.current) m.sp.tint = acc[m.ai % acc.length];
  }, [accents, intensity]);

  useEffect(() => {
    const host = hostRef.current;
    const count = fxParticleCount(quality);
    if (!host || count === 0) return;

    let destroyed = false;
    let app: Application | null = null;
    let removeTicker: (() => void) | null = null;

    (async () => {
      const PIXI = await import('pixi.js'); // lazy: keep Pixi out of the initial bundle
      if (destroyed) return;

      const a = new PIXI.Application();
      try {
        await a.init({
          backgroundAlpha: 0,
          antialias: false,
          resolution: Math.min(window.devicePixelRatio || 1, 1.5), // overlay needn't match dpr2
          autoDensity: true,
          preference: 'webgl', // WebGL2 = broadest low-end coverage
          resizeTo: host,
        });
      } catch {
        a.destroy(true); // GPU init failed — leave the map alone
        return;
      }
      if (destroyed) {
        a.destroy(true);
        return;
      }
      app = a;
      a.canvas.style.position = 'absolute';
      a.canvas.style.inset = '0';
      a.canvas.style.pointerEvents = 'none';
      host.appendChild(a.canvas);

      // Soft white radial-gradient dot, tinted per mote + additively blended.
      const gcv = document.createElement('canvas');
      gcv.width = gcv.height = 32;
      const gctx = gcv.getContext('2d')!;
      const grad = gctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 32, 32);
      const tex = new PIXI.Texture({ source: new PIXI.CanvasSource({ resource: gcv }) });

      const layer = new PIXI.Container();
      a.stage.addChild(layer);

      // HIGH tier only: a genuine GPU glow shader for extra bloom on the motes.
      if (quality === 'high') {
        try {
          const { GlowFilter } = await import('pixi-filters');
          if (!destroyed) {
            layer.filters = [new GlowFilter({ distance: 6, outerStrength: 1.1, innerStrength: 0, quality: 0.15 })];
          }
        } catch {
          /* pixi-filters unavailable → additive glow only, still looks good */
        }
      }

      const motes: Mote[] = [];
      const accents0 = stateRef.current.accents;
      for (let i = 0; i < count; i++) {
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5);
        sp.blendMode = 'add';
        sp.tint = accents0[i % accents0.length];
        sp.x = Math.random() * a.screen.width;
        sp.y = Math.random() * a.screen.height;
        sp.scale.set(0.22 + Math.random() * 0.5);
        layer.addChild(sp);
        motes.push({
          sp,
          vy: 4 + Math.random() * 10,
          drift: 4 + Math.random() * 8,
          phase: Math.random() * Math.PI * 2,
          tw: 0.5 + Math.random() * 1.5,
          base: 0.22 + Math.random() * 0.42,
          ai: i,
          streamer: Math.random() < 0.4, // ~40% stream toward the playing venue
        });
      }
      motesRef.current = motes;

      let t = 0;
      const tick = (ticker: Ticker) => {
        const dt = ticker.deltaTime;
        t += dt;
        const w = a.screen.width;
        const h = a.screen.height;
        const surge = stateRef.current.intensity; // show-night liveliness 0..1
        // Audio-reactive: ease toward the live amplitude so motes pulse on sound.
        const lvl = audio.getLevel();
        audioLevelRef.current += (lvl - audioLevelRef.current) * Math.min(1, 0.2 * dt);
        const beat = audioLevelRef.current;
        const speed = 1 + surge * 0.7 + beat * 0.5;
        const glow = 1 + surge * 0.9 + beat * 1.1; // flare on every sound
        const target = surgeRef?.current ?? null; // playing-venue screen pos
        for (const m of motes) {
          // On show-nights, ~40% of motes stream toward the playing venue.
          if (target && m.streamer && surge > 0) {
            const dx = target.x - m.sp.x;
            const dy = target.y - m.sp.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pull = (0.5 + surge) * 0.6;
            m.sp.x += (dx / dist) * pull * dt;
            m.sp.y += (dy / dist) * pull * dt;
            m.sp.x += Math.sin(m.phase) * (m.drift / 90) * dt; // a little wander
            m.phase += 0.03 * dt;
            const near = 1 + Math.max(0, 1 - dist / 140) * 0.8; // brighter near the venue
            m.sp.alpha = m.base * (0.5 + 0.5 * Math.sin(t * 0.04 * m.tw + m.phase)) * glow * near;
            if (dist < 14) { // reached it → respawn at an edge to keep the stream flowing
              m.sp.x = Math.random() * w;
              m.sp.y = h + 16;
            }
            continue;
          }
          m.sp.y -= ((m.vy * speed) / 60) * dt; // drift upward like embers
          m.phase += 0.02 * speed * dt;
          m.sp.x += Math.sin(m.phase) * (m.drift / 60) * dt;
          m.sp.alpha = m.base * (0.45 + 0.55 * Math.sin(t * 0.03 * m.tw + m.phase)) * glow; // twinkle + surge
          if (m.sp.y < -16) {
            m.sp.y = h + 16;
            m.sp.x = Math.random() * w;
          }
          if (m.sp.x < -16) m.sp.x = w + 16;
          else if (m.sp.x > w + 16) m.sp.x = -16;
        }
      };
      a.ticker.add(tick);
      removeTicker = () => a.ticker.remove(tick);
    })();

    return () => {
      destroyed = true;
      motesRef.current = [];
      if (removeTicker) removeTicker();
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
    // surgeRef is a stable ref (identity never changes) — listed to satisfy the
    // linter; it does NOT cause a re-init. Init is effectively keyed on quality.
  }, [quality, surgeRef]);

  return <div ref={hostRef} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }} />;
};

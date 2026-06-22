/**
 * MapCompositor — the OPT-IN "ultra" FX tier: a PixiJS (WebGL) post-process that
 * composites the live Canvas-2D map through real GPU shaders (AdvancedBloom +
 * CRT). This is the "shader ceiling" — only mounted when the user deliberately
 * selects the ultra tier (off by default), because a per-frame full-canvas GPU
 * upload is the most expensive thing on entry-class mobile.
 *
 * How it works (verified Pixi v8 / pixi-filters v6 architecture):
 * - The 2D map canvas keeps rendering every frame (it's the texture source) and
 *   stays mounted + hit-testable, just visually hidden (opacity:0) by the parent.
 * - We wrap it in ONE persistent CanvasSource/Texture and re-upload it to the GPU
 *   on a ~30Hz throttle, drawing a single filtered Sprite that the user sees.
 * - All pan/pinch/tap/zoom still land on the transparent 2D canvas beneath
 *   (this host is pointerEvents:none).
 * - On GPU-init / tainted-canvas failure we call onFail() so the parent un-hides
 *   the plain 2D map — the map can never disappear.
 * - The parent skips its own CPU bloom under ultra (the GPU bloom replaces it).
 *
 * pixi.js + pixi-filters are dynamically imported, so this ~450KB never touches
 * the initial bundle for the (default) non-ultra users.
 */
import { useEffect, useRef } from 'react';

interface MapCompositorProps {
  /** The live 2D map canvas (the texture source). */
  sourceCanvas: React.RefObject<HTMLCanvasElement | null>;
  /** CSS width/height of the map (sprite is drawn at this size). */
  width: number;
  height: number;
  /** Device pixel ratio — a change means the source backing store resized. */
  dpr: number;
  /** Called if the GPU path can't run, so the parent restores the plain map. */
  onFail?: () => void;
}

export const MapCompositor: React.FC<MapCompositorProps> = ({ sourceCanvas, width, height, dpr, onFail }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  // Latest props funneled through a ref so the heavy init effect can stay mount-once.
  const cfgRef = useRef({ width, height, onFail });
  cfgRef.current = { width, height, onFail };
  const ctrlRef = useRef<{ resize: (w: number, h: number, canvas: HTMLCanvasElement | null) => void } | null>(null);

  // Init once on mount; teardown on unmount. Reactive size handled separately.
  useEffect(() => {
    const host = hostRef.current;
    const srcInit = sourceCanvas.current;
    if (!host || !srcInit) {
      cfgRef.current.onFail?.();
      return;
    }
    let destroyed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const PIXI = await import('pixi.js');
      const filters = await import('pixi-filters').catch(() => null);
      if (destroyed) return;

      const app = new PIXI.Application();
      try {
        await app.init({
          backgroundAlpha: 0, // motes + CSS scanlines above still composite
          antialias: false,
          resolution: Math.min(window.devicePixelRatio || 1, 1.5), // clamp upload + filter cost
          autoDensity: true,
          preference: 'webgl', // WebGL2 = broadest low-end coverage
          resizeTo: host,
        });
      } catch {
        app.destroy(true);
        cfgRef.current.onFail?.(); // un-hide the plain 2D map
        return;
      }
      if (destroyed) {
        app.destroy(true);
        return;
      }
      app.canvas.style.position = 'absolute';
      app.canvas.style.inset = '0';
      app.canvas.style.pointerEvents = 'none';
      host.appendChild(app.canvas);

      let srcCanvas = srcInit;
      let source: import('pixi.js').CanvasSource;
      let mapTexture: import('pixi.js').Texture;
      try {
        source = new PIXI.CanvasSource({ resource: srcCanvas, resolution: 1 });
        mapTexture = new PIXI.Texture({ source });
      } catch {
        app.destroy(true);
        cfgRef.current.onFail?.(); // e.g. tainted canvas
        return;
      }

      const sprite = new PIXI.Sprite(mapTexture);
      sprite.width = cfgRef.current.width;
      sprite.height = cfgRef.current.height;

      // GPU shader stack: soft bloom on the bright neon, then a gentle CRT screen.
      let crt: import('pixi-filters').CRTFilter | null = null;
      if (filters) {
        try {
          const bloom = new filters.AdvancedBloomFilter({
            threshold: 0.6, bloomScale: 0.7, brightness: 1, blur: 4, quality: 4, pixelSize: { x: 1, y: 1 },
          });
          crt = new filters.CRTFilter({
            curvature: 1.5, lineWidth: 1.1, lineContrast: 0.18, verticalLine: false,
            noise: 0.06, noiseSize: 1, vignetting: 0.5, vignettingAlpha: 0.4, vignettingBlur: 0.5, time: 0,
          });
          sprite.filters = [bloom, crt];
        } catch {
          /* a filter ctor failed → raw map sprite still shows */
        }
      }
      app.stage.addChild(sprite);

      let acc = 0;
      const tick = (t: import('pixi.js').Ticker) => {
        acc += t.deltaMS;
        if (acc >= 33) { // ~30Hz upload throttle; filter render stays at 60Hz
          acc = 0;
          try { source.update(); } catch { /* transient */ }
        }
        if (crt) crt.time += t.deltaTime * 0.5; // animate scanlines
      };
      app.ticker.add(tick);

      ctrlRef.current = {
        resize: (w, h, canvas) => {
          if (canvas && canvas !== srcCanvas) {
            // React swapped the <canvas> element identity → rebuild the source
            srcCanvas = canvas;
            const old = mapTexture;
            source = new PIXI.CanvasSource({ resource: srcCanvas, resolution: 1 });
            mapTexture = new PIXI.Texture({ source });
            sprite.texture = mapTexture;
            old.destroy(true);
          } else {
            try { source.resize(srcCanvas.width, srcCanvas.height, 1); } catch { /* noop */ }
          }
          sprite.width = w;
          sprite.height = h;
          app.renderer.resize(w, h);
        },
      };

      cleanup = () => {
        app.ticker.remove(tick);
        mapTexture.destroy(true);
        app.destroy(true, { children: true });
      };
    })();

    return () => {
      destroyed = true;
      ctrlRef.current = null;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize the renderer + sprite + source when the map size / dpr changes.
  useEffect(() => {
    ctrlRef.current?.resize(width, height, sourceCanvas.current);
  }, [width, height, dpr, sourceCanvas]);

  return <div ref={hostRef} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
};

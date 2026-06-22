/**
 * pixelPalette — lock arbitrary images to the game's neon-punk palette.
 *
 * Purpose: fold EXTERNAL or AI-generated pixel art (e.g. PixelLab / Retro
 * Diffusion output, or a hand-drawn sprite from another palette) into the
 * hand-authored look. It quantises every pixel to the nearest on-brand colour
 * so imported sprites match the buttons / HUD / town instead of clashing.
 *
 * The core (hex math, distance, `snapPixels` over a raw RGBA buffer) is pure and
 * DOM-free, so it's unit-testable. A thin canvas wrapper (`snapImageToCanvas`)
 * handles HTMLImage/Canvas sources in the browser and is the entry point you'd
 * call after fetching a generated sprite.
 */

export type RGB = [number, number, number];

/**
 * Canonical palette — mirrors `src/styles/snes.css` (the single source of truth
 * for the UI). Snapped art lands on the exact same colours as the chrome.
 */
export const SNES_CORE = {
  void: '#0a0814',
  bg2: '#0f0b1e',
  bg: '#171327',
  line: '#2a2350',
  edge: '#3a2f5c',
  magenta: '#f72585',
  cyan: '#4cc9f0',
  gold: '#ffd23f',
  green: '#3ad17e',
  purple: '#c77dff',
  red: '#ff5c57',
  inkMute: '#6f6796',
  inkDim: '#b9b3d6',
  ink: '#ffffff',
} as const;

/** The tight 14-colour brand palette (matches the UI exactly). */
export const GAME_PALETTE: string[] = Object.values(SNES_CORE);

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb: RGB): string {
  return (
    '#' +
    rgb
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/** Lighten (amt > 0) or darken (amt < 0) a colour in HSL-lightness space. */
export function shade(hex: string, amt: number): string {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(h, s, Math.max(0, Math.min(1, l + amt))));
}

/** A small dark→base→light ramp around a colour, for shading depth. */
export function ramp(hex: string, spread = 0.18): string[] {
  return [shade(hex, -spread), hex, shade(hex, spread)];
}

/**
 * Extended palette: the 14 brand colours plus ±shade ramps on the six accents
 * and two neutral mids. ~28 colours — enough range to snap real shaded art onto
 * while staying entirely on-brand. This is the sensible default for sprites.
 */
export const GAME_PALETTE_RICH: string[] = (() => {
  const accents = [
    SNES_CORE.magenta,
    SNES_CORE.cyan,
    SNES_CORE.gold,
    SNES_CORE.green,
    SNES_CORE.purple,
    SNES_CORE.red,
  ];
  const out = new Set<string>(GAME_PALETTE);
  for (const a of accents) {
    out.add(shade(a, -0.16));
    out.add(shade(a, 0.16));
  }
  out.add('#241c40'); // mid shadow (between structure darks and ink-mute)
  out.add('#4a4170'); // mid tone
  return [...out];
})();

// Weighted "redmean" RGB distance — a cheap perceptual approximation that beats
// plain Euclidean for picking the nearest swatch.
function dist2(a: RGB, b: RGB): number {
  const rmean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return (((512 + rmean) * dr * dr) | 0) / 256 + 4 * dg * dg + (((767 - rmean) * db * db) | 0) / 256;
}

/** Nearest palette colour to `rgb` (palette pre-parsed to RGB triples). */
export function nearest(rgb: RGB, palette: RGB[]): RGB {
  let best = palette[0];
  let bestD = Infinity;
  for (const p of palette) {
    const d = dist2(rgb, p);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export interface SnapOptions {
  /** Palette to snap to (hex strings). Default: GAME_PALETTE_RICH. */
  palette?: string[];
  /** Alpha at/below this is forced fully transparent (kills fringe). Default 8. */
  alphaThreshold?: number;
}

/**
 * Snap an RGBA buffer (e.g. from `ctx.getImageData().data`) IN PLACE to the
 * palette. Pure — no DOM — so it's directly unit-testable.
 */
export function snapPixels(data: Uint8ClampedArray | number[], opts: SnapOptions = {}): void {
  const pal = (opts.palette ?? GAME_PALETTE_RICH).map(hexToRgb);
  const aT = opts.alphaThreshold ?? 8;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] <= aT) {
      data[i + 3] = 0;
      continue;
    }
    const [r, g, b] = nearest([data[i], data[i + 1], data[i + 2]], pal);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

export interface SnapImageOptions extends SnapOptions {
  /**
   * Chunky-pixel factor. >1 downsamples to (w/scale × h/scale) with nearest
   * sampling before snapping, then the canvas is left at the small size — turns
   * smooth/AI art into true low-res pixel art. Default 1 (no resampling).
   */
  pixelScale?: number;
}

/**
 * Browser entry point: draw a source image/canvas, snap it to the palette, and
 * return a new canvas. Throws if no 2D context is available (non-DOM env).
 */
export function snapImageToCanvas(
  src: CanvasImageSource,
  w: number,
  h: number,
  opts: SnapImageOptions = {},
): HTMLCanvasElement {
  const scale = Math.max(1, Math.floor(opts.pixelScale ?? 1));
  const tw = Math.max(1, Math.round(w / scale));
  const th = Math.max(1, Math.round(h / scale));
  const cv = document.createElement('canvas');
  cv.width = tw;
  cv.height = th;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('pixelPalette: 2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, tw, th);
  const img = ctx.getImageData(0, 0, tw, th);
  snapPixels(img.data, opts);
  ctx.putImageData(img, 0, 0);
  return cv;
}

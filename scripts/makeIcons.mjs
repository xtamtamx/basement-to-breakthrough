/**
 * makeIcons.mjs — generates the app icon set for "Settling Up" (PWA + iOS + favicon).
 *
 * A clean, on-brand neon-punk mark: the void-dark background of the game with a
 * row of equalizer bars in the SNES palette (magenta / cyan / yellow / green) on
 * a magenta stage line — instantly reads as "music" and scales crisply. The motif
 * sits inside the central safe zone so it survives maskable cropping.
 *
 * Run: node scripts/makeIcons.mjs   (writes to public/)
 */
import { encodePng } from './lib/png.mjs';
import { writeFileSync } from 'node:fs';

const BG = [10, 8, 20, 255];        // #0a0814 void
const PANEL = [23, 19, 39, 255];    // #171327 inset
const FRAME = [58, 47, 92, 255];    // #3a2f5c bevel
const BARS = [
  [247, 37, 133, 255], // #f72585 magenta
  [76, 201, 240, 255], // #4cc9f0 cyan
  [255, 210, 63, 255], // #ffd23f yellow
  [58, 209, 126, 255], // #3ad17e green
];
const STAGE = [247, 37, 133, 255];  // magenta stage line
const HEIGHTS = [0.34, 0.52, 0.26, 0.44]; // bar heights as fraction of size

function draw(S) {
  const rgba = Buffer.alloc(S * S * 4);
  const px = (x, y, c) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = c[3];
  };
  const rect = (x0, y0, w, h, c) => {
    for (let y = Math.round(y0); y < Math.round(y0 + h); y++)
      for (let x = Math.round(x0); x < Math.round(x0 + w); x++) px(x, y, c);
  };

  // Background + a rounded-ish inset panel with a bevel frame (kept full-bleed so
  // maskable crops don't reveal transparent corners).
  rect(0, 0, S, S, BG);
  const m = Math.round(S * 0.10); // frame margin
  rect(m, m, S - 2 * m, S - 2 * m, FRAME);
  const b = Math.round(S * 0.022);
  rect(m + b, m + b, S - 2 * (m + b), S - 2 * (m + b), PANEL);

  // Equalizer bars, centered, sitting on a stage line.
  const baseline = S * 0.72;
  const barW = S * 0.105;
  const gap = S * 0.05;
  const total = BARS.length * barW + (BARS.length - 1) * gap;
  let x = (S - total) / 2;
  for (let i = 0; i < BARS.length; i++) {
    const h = S * HEIGHTS[i];
    rect(x, baseline - h, barW, h, BARS[i]);
    // a brighter cap so each bar reads with a little depth
    rect(x, baseline - h, barW, Math.max(1, S * 0.02), [255, 255, 255, 90]);
    x += barW + gap;
  }
  // Stage line under the bars.
  rect(S * 0.18, baseline, S * 0.64, Math.max(1, S * 0.035), STAGE);

  return encodePng(S, S, rgba);
}

// PWA manifest icons + iOS touch icon + favicon + shortcut icon.
const OUT = [
  ['public/icon-96.png', 96],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/icon-1024.png', 1024],
  ['public/apple-touch-icon.png', 180],
  ['public/favicon.png', 48],
];

for (const [file, size] of OUT) {
  writeFileSync(file, draw(size));
  console.log(`wrote ${file} (${size}x${size})`);
}
console.log('Done. App icons generated for Settling Up.');

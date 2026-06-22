#!/usr/bin/env node
/**
 * makeDemoSprites — write a few on-brand placeholder PNGs into art/sprites/demo/
 * so the pack pipeline has real input. Dependency-free: encodes PNGs with Node's
 * built-in zlib. These double as palette-correct neon placeholder icons.
 *
 * Run `npm run sprites:demo` (then `npm run pack:sprites`).
 */
import zlib from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'art/sprites/demo');

// --- minimal PNG encoder (RGBA, no external deps) ---------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --- tiny raster helpers ----------------------------------------------------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function makeCanvas(w, h) {
  const buf = Buffer.alloc(w * h * 4); // transparent
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };
  return { w, h, buf, set };
}

// --- neon brand placeholder sprites ----------------------------------------
const C = {
  magenta: hex('#f72585'),
  cyan: hex('#4cc9f0'),
  gold: hex('#ffd23f'),
  green: hex('#3ad17e'),
  ink: hex('#0a0814'),
  white: hex('#ffffff'),
};

function diamond(size, col) {
  const cv = makeCanvas(size, size);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.abs(x - c) + Math.abs(y - c);
      if (d <= c) cv.set(x, y, col);
      else if (d <= c + 1) cv.set(x, y, C.ink); // 1px dark outline
    }
  return cv;
}
function ring(size, col) {
  const cv = makeCanvas(size, size);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d <= c && d >= c - 3) cv.set(x, y, col);
      else if (d <= c && d > c - 3.8) cv.set(x, y, C.ink);
    }
  return cv;
}
function orb(size, col) {
  const cv = makeCanvas(size, size);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d <= c - 1) cv.set(x, y, col);
      else if (d <= c) cv.set(x, y, C.ink);
      // tiny specular highlight
      if (Math.hypot(x - (c - 2), y - (c - 2)) < 1.5) cv.set(x, y, C.white);
    }
  return cv;
}
function amp(w, h, col) {
  const cv = makeCanvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      cv.set(x, y, edge ? C.ink : col); // cabinet
    }
  // speaker cone
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= Math.min(w, h) / 2 - 2) cv.set(x, y, C.ink);
      if (d <= Math.min(w, h) / 2 - 4) cv.set(x, y, C.white);
    }
  return cv;
}

const SPRITES = {
  diamond: diamond(16, C.magenta),
  ring: ring(20, C.cyan),
  orb: orb(16, C.gold),
  amp: amp(22, 18, C.green),
};

await mkdir(OUT, { recursive: true });
for (const [name, cv] of Object.entries(SPRITES)) {
  await writeFile(path.join(OUT, `${name}.png`), encodePng(cv.w, cv.h, cv.buf));
}
console.log(`[demo-sprites] wrote ${Object.keys(SPRITES).length} PNGs → art/sprites/demo/`);

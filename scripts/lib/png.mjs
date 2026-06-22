/**
 * png.mjs — dependency-free PNG encoder (Node zlib) + a tiny pixel-art raster
 * toolkit. Shared by the sprite-authoring scripts so there is ONE encoder.
 */
import zlib from 'node:zlib';

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

/** Encode an RGBA Buffer (w*h*4) into a PNG Buffer. */
export function encodePng(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/** '#rrggbb' → [r,g,b]. */
export const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/**
 * A small mutable RGBA sprite with alpha-over drawing primitives.
 * Origin top-left; (0,0) is the top-left pixel.
 */
export function makeSprite(w, h) {
  const buf = Buffer.alloc(w * h * 4);
  const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;

  // alpha-over a single pixel
  const px = (x, y, col, a = 255) => {
    x = Math.round(x);
    y = Math.round(y);
    if (!inb(x, y) || a <= 0) return;
    const i = (y * w + x) * 4;
    const af = a / 255;
    const bi = buf[i + 3] / 255;
    const oa = af + bi * (1 - af);
    if (oa <= 0) return;
    buf[i] = Math.round((col[0] * af + buf[i] * bi * (1 - af)) / oa);
    buf[i + 1] = Math.round((col[1] * af + buf[i + 1] * bi * (1 - af)) / oa);
    buf[i + 2] = Math.round((col[2] * af + buf[i + 2] * bi * (1 - af)) / oa);
    buf[i + 3] = Math.round(oa * 255);
  };

  const rect = (x, y, rw, rh, col, a = 255) => {
    for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) px(x + xx, y + yy, col, a);
  };
  const hline = (x0, x1, y, col, a = 255) => {
    const a0 = Math.min(x0, x1), a1 = Math.max(x0, x1);
    for (let x = a0; x <= a1; x++) px(x, y, col, a);
  };
  const vline = (x, y0, y1, col, a = 255) => {
    const a0 = Math.min(y0, y1), a1 = Math.max(y0, y1);
    for (let y = a0; y <= a1; y++) px(x, y, col, a);
  };
  // Bresenham-ish line
  const line = (x0, y0, x1, y1, col, a = 255) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      px(x0, y0, col, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  const fillEllipse = (cx, cy, rx, ry, col, a = 255) => {
    for (let yy = -Math.ceil(ry); yy <= Math.ceil(ry); yy++)
      for (let xx = -Math.ceil(rx); xx <= Math.ceil(rx); xx++)
        if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) <= 1) px(cx + xx, cy + yy, col, a);
  };
  const ringCircle = (cx, cy, r, col, a = 255) => {
    for (let d = 0; d < 360; d += 4) {
      px(cx + Math.cos((d * Math.PI) / 180) * r, cy + Math.sin((d * Math.PI) / 180) * r, col, a);
    }
  };
  // soft elliptical contact shadow at the foot (bottom-center)
  const shadow = (cx, cy, rx, ry, a = 60) => {
    fillEllipse(cx, cy, rx, ry, [0, 0, 0], a);
    fillEllipse(cx, cy, rx * 0.6, ry * 0.7, [0, 0, 0], Math.round(a * 0.6));
  };

  return { w, h, buf, px, rect, hline, vline, line, fillEllipse, ringCircle, shadow };
}

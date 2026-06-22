import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  shade,
  ramp,
  nearest,
  snapPixels,
  GAME_PALETTE,
  GAME_PALETTE_RICH,
  SNES_CORE,
} from '../pixelPalette';

describe('pixelPalette hex math', () => {
  it('round-trips hex → rgb → hex', () => {
    expect(rgbToHex(hexToRgb('#f72585'))).toBe('#f72585');
    expect(rgbToHex(hexToRgb('#4cc9f0'))).toBe('#4cc9f0');
  });

  it('parses shorthand hex', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000')).toEqual([0, 0, 0]);
  });

  it('shade lightens and darkens', () => {
    const base = SNES_CORE.magenta;
    const lighter = hexToRgb(shade(base, 0.2));
    const darker = hexToRgb(shade(base, -0.2));
    const sum = (c: number[]) => c[0] + c[1] + c[2];
    expect(sum(lighter)).toBeGreaterThan(sum(hexToRgb(base)));
    expect(sum(darker)).toBeLessThan(sum(hexToRgb(base)));
  });

  it('ramp returns dark → base → light', () => {
    const [d, m, l] = ramp(SNES_CORE.cyan).map(hexToRgb);
    const sum = (c: number[]) => c[0] + c[1] + c[2];
    expect(sum(d)).toBeLessThan(sum(m));
    expect(sum(l)).toBeGreaterThan(sum(m));
  });
});

describe('nearest', () => {
  const pal = GAME_PALETTE.map(hexToRgb);

  it('maps an exact palette colour to itself', () => {
    expect(nearest(hexToRgb('#ffd23f'), pal)).toEqual(hexToRgb('#ffd23f'));
  });

  it('maps a near-magenta to magenta, not cyan', () => {
    // slightly-off magenta should resolve to the brand magenta
    const result = rgbToHex(nearest([0xf0, 0x28, 0x80], pal));
    expect(result).toBe('#f72585');
  });

  it('maps pure white to ink', () => {
    expect(rgbToHex(nearest([255, 255, 255], pal))).toBe('#ffffff');
  });
});

describe('snapPixels', () => {
  it('snaps every opaque pixel onto the palette', () => {
    // two off-palette pixels + one transparent
    const data = new Uint8ClampedArray([
      0xf0, 0x28, 0x80, 255, // near magenta
      0x50, 0xc0, 0xe8, 255, // near cyan
      12, 34, 56, 4, // transparent (below threshold)
    ]);
    snapPixels(data);
    const palSet = new Set(GAME_PALETTE_RICH);
    expect(palSet.has(rgbToHex([data[0], data[1], data[2]]))).toBe(true);
    expect(palSet.has(rgbToHex([data[4], data[5], data[6]]))).toBe(true);
    // sub-threshold alpha forced to 0
    expect(data[11]).toBe(0);
  });

  it('respects a custom palette', () => {
    const data = new Uint8ClampedArray([100, 100, 100, 255]);
    snapPixels(data, { palette: ['#000000', '#ffffff'] });
    expect([rgbToHex([data[0], data[1], data[2]])]).toContainEqual(
      expect.stringMatching(/#000000|#ffffff/),
    );
  });
});

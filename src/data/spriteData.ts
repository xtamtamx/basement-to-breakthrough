import { PIXEL_PALETTE } from '../constants/pixelArt';

// Type definitions
export type PixelData = number[][];
export type ColorMap = { [key: number]: string };

export interface AnimationFrame {
  data: PixelData;
  duration: number;
}

export interface SpriteDefinition {
  name: string;
  data: PixelData;
  colorMap: ColorMap;
  animated?: boolean;
  frames?: AnimationFrame[];
}

// Color maps
export const PUNK_COLOR_MAP: ColorMap = {
  0: 'transparent',
  1: PIXEL_PALETTE.black,
  2: PIXEL_PALETTE.punkPink,
  3: PIXEL_PALETTE.darkGray,
  4: PIXEL_PALETTE.skinLight,
  5: PIXEL_PALETTE.white,
};

export const METAL_COLOR_MAP: ColorMap = {
  0: 'transparent',
  1: PIXEL_PALETTE.black,
  2: PIXEL_PALETTE.metalSilver,
  3: PIXEL_PALETTE.darkGray,
  4: PIXEL_PALETTE.skinMedium,
};

export const INDIE_COLOR_MAP: ColorMap = {
  0: 'transparent',
  1: PIXEL_PALETTE.black,
  2: PIXEL_PALETTE.darkBlue,
  3: PIXEL_PALETTE.lightBlue,
  4: PIXEL_PALETTE.skinLight,
};

export const VENUE_COLOR_MAP: ColorMap = {
  0: 'transparent',
  1: PIXEL_PALETTE.black,
  2: PIXEL_PALETTE.darkGray,
  3: PIXEL_PALETTE.gray,
  4: PIXEL_PALETTE.lightGray,
  5: PIXEL_PALETTE.venueNeon,
  6: PIXEL_PALETTE.darkRed,
  7: PIXEL_PALETTE.darkBlue,
};

export const UI_COLOR_MAP: ColorMap = {
  0: 'transparent',
  1: PIXEL_PALETTE.black,
  2: PIXEL_PALETTE.darkGray,
  3: PIXEL_PALETTE.gray,
  4: PIXEL_PALETTE.lightGray,
};

// Sprite data definitions would go here, but I'll need to copy them from the original file
// For now, these are placeholders - the actual data needs to be moved from PixelArtSprites.tsx

export const PUNK_IDLE: PixelData = [];
export const METAL_IDLE: PixelData = [];
export const INDIE_IDLE: PixelData = [];
export const WALKER_FRAME_1: PixelData = [];
export const WALKER_FRAME_2: PixelData = [];
export const DIVE_BAR: PixelData = [];
export const WAREHOUSE: PixelData = [];
export const PIXEL_BUTTON: PixelData = [];
export const PIXEL_PANEL: PixelData = [];

// Sprite sheet definition
export const SPRITE_SHEET: { [key: string]: SpriteDefinition } = {
  punkIdle: {
    name: 'punkIdle',
    data: PUNK_IDLE,
    colorMap: PUNK_COLOR_MAP,
  },
  metalIdle: {
    name: 'metalIdle',
    data: METAL_IDLE,
    colorMap: METAL_COLOR_MAP,
  },
  indieIdle: {
    name: 'indieIdle',
    data: INDIE_IDLE,
    colorMap: INDIE_COLOR_MAP,
  },
  punkWalk: {
    name: 'punkWalk',
    data: WALKER_FRAME_1,
    colorMap: PUNK_COLOR_MAP,
    animated: true,
    frames: [
      { data: WALKER_FRAME_1, duration: 200 },
      { data: WALKER_FRAME_2, duration: 200 },
    ],
  },
  diveBar: {
    name: 'diveBar',
    data: DIVE_BAR,
    colorMap: VENUE_COLOR_MAP,
  },
  warehouse: {
    name: 'warehouse',
    data: WAREHOUSE,
    colorMap: VENUE_COLOR_MAP,
  },
  button: {
    name: 'button',
    data: PIXEL_BUTTON,
    colorMap: UI_COLOR_MAP,
  },
  panel: {
    name: 'panel',
    data: PIXEL_PANEL,
    colorMap: UI_COLOR_MAP,
  },
};
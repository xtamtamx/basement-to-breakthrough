/**
 * townAtlas - named slice definitions for the 16-bit town tilesets.
 *
 * All rects are source-pixel coordinates into the sheet images. The base unit
 * is a 16px tile; buildings are multi-tile slices. Every rect below was
 * verified visually in-browser against the sheets (contact-sheet passes,
 * 2026-06-12) — don't adjust without re-checking.
 */

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const TILE = 16;

export const SHEETS = {
  city: '/assets/sprites/town/city-tileset.png',
  grass: '/assets/sprites/town/grasslands-tileset.png',
  houses: '/assets/sprites/town/houses-tileset.png',
} as const;

export type SheetName = keyof typeof SHEETS;

export interface AtlasSprite {
  sheet: SheetName;
  rect: TileRect;
}

const city = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'city',
  rect: { x, y, w, h },
});
const grass = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'grass',
  rect: { x, y, w, h },
});
const houses = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'houses',
  rect: { x, y, w, h },
});

// --- Ground -----------------------------------------------------------------
export const GROUND = {
  grass: grass(112, 112, 16, 16), // textured mid green
  grassDark: grass(192, 112, 16, 16), // textured darker green
  path: city(80, 64, 16, 16), // tan sidewalk
} as const;

// --- Roads (16px tiles, verified in-game) ------------------------------------
export const ROAD = {
  horizontal: city(16, 80, 16, 16),
  vertical: city(0, 64, 16, 16),
  cross: city(16, 64, 16, 16),
  plain: city(48, 80, 16, 16),
} as const;

// --- Vegetation / props -------------------------------------------------------
export const PROPS = {
  tree: grass(384, 136, 32, 56), // round tree with trunk
  treeB: grass(448, 136, 32, 56), // slimmer variant
  bushes: city(144, 0, 32, 32), // two rounded bushes
  flowers: city(176, 96, 16, 16),
  hedge: city(192, 96, 16, 16),
  lamp: city(320, 128, 16, 32), // street lamp
} as const;

// --- Houses (pitched-roof RPG style; the Stardew/FF look) ---------------------
// Straight gables are 7x8 tiles, L-shaped variants 9x8.
export const BUILDINGS = {
  houseBlue: houses(0, 0, 112, 128),
  houseBlueL: houses(128, 0, 144, 128),
  houseRed: houses(0, 256, 112, 128),
  houseRedL: houses(288, 256, 112, 128),
  houseDark: houses(0, 512, 112, 128),
  houseDarkL: houses(288, 512, 112, 128),
} as const;

export type BuildingKey = keyof typeof BUILDINGS;

// --- Image loading ------------------------------------------------------------
const imageCache = new Map<SheetName, HTMLImageElement>();
const pending = new Map<SheetName, Promise<HTMLImageElement>>();

export function loadSheet(name: SheetName): Promise<HTMLImageElement> {
  const cached = imageCache.get(name);
  if (cached) return Promise.resolve(cached);

  const inFlight = pending.get(name);
  if (inFlight) return inFlight;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(name, img);
      pending.delete(name);
      resolve(img);
    };
    img.onerror = () => {
      pending.delete(name);
      reject(new Error(`Failed to load tileset: ${SHEETS[name]}`));
    };
    img.src = SHEETS[name];
  });
  pending.set(name, promise);
  return promise;
}

export function loadAllSheets(): Promise<Record<SheetName, HTMLImageElement>> {
  const names = Object.keys(SHEETS) as SheetName[];
  return Promise.all(names.map(loadSheet)).then((imgs) => {
    const out = {} as Record<SheetName, HTMLImageElement>;
    names.forEach((n, i) => {
      out[n] = imgs[i];
    });
    return out;
  });
}

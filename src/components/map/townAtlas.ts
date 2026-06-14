/**
 * townAtlas - named slice definitions for the cohesive town look.
 *
 * The ground, paths, town square, water and flora are drawn PROCEDURALLY in
 * PixelCityMap (one controlled cozy palette → no cross-pack clash). Only the
 * two sprite sheets whose art actually matches are sampled here:
 *   - houses-tileset: pitched-roof RPG houses (the buildings)
 *   - grasslands-tileset: round trees (the only sprite props we composite)
 *
 * The old Pokémon-GBA `city-tileset` (asphalt roads, blocky roofs) was dropped
 * 2026-06-14 — its style/palette clashed with everything else and was the main
 * reason the map read as incoherent. Rects below are source-pixel coords; the
 * base unit is a 16px tile.
 */

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const TILE = 16;

export const SHEETS = {
  grass: '/assets/sprites/town/grasslands-tileset.png',
  houses: '/assets/sprites/town/houses-tileset.png',
} as const;

export type SheetName = keyof typeof SHEETS;

export interface AtlasSprite {
  sheet: SheetName;
  rect: TileRect;
}

const grass = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'grass',
  rect: { x, y, w, h },
});
const houses = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'houses',
  rect: { x, y, w, h },
});

// --- Vegetation sprites (round trees from the grasslands sheet) ---------------
export const PROPS = {
  tree: grass(384, 136, 32, 56), // round tree with trunk
  treeB: grass(448, 136, 32, 56), // slimmer variant
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

/**
 * townAtlas - verified sprite rects for the SNES town art.
 *
 * Rects were detected PROGRAMMATICALLY (connected-component bounding boxes on
 * the sheets' transparent/black backgrounds), not eyeballed — so buildings are
 * complete and trees aren't cropped. Buildings come from the detailed
 * `houses-sprite-sheet` (complete cottages/shops/halls with roofs, walls, doors
 * and windows); trees from `grasslands-tileset`.
 */

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const TILE = 16;

export const SHEETS = {
  buildings: '/assets/sprites/town/houses-sprite-sheet.png',
  grass: '/assets/sprites/town/grasslands-tileset.png',
  village: '/assets/sprites/town/village-tileset.png',
} as const;

export type SheetName = keyof typeof SHEETS;

export interface AtlasSprite {
  sheet: SheetName;
  rect: TileRect;
}

const b = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'buildings',
  rect: { x, y, w, h },
});
const g = (x: number, y: number, w: number, h: number): AtlasSprite => ({
  sheet: 'grass',
  rect: { x, y, w, h },
});
const v = (x: number, y: number): AtlasSprite => ({
  sheet: 'village',
  rect: { x, y, w: 16, h: 16 },
});

// --- Terrain fill tiles (village-tileset; seamless, detected by edge-wrap) ----
// Real textured ground that matches the detailed building art, replacing the
// old flat procedural fills.
export const TERRAIN = {
  grass: [v(32, 0), v(96, 0), v(16, 16)], // seamless grass variants
  dirt: v(320, 16), // tan dirt/gravel road
  stone: v(304, 16), // clean smooth flagstone (sidewalk / plaza) — not the dotted one
  water: v(192, 48), // water
} as const;

// --- Complete buildings (detected col-0 variants of houses-sprite-sheet) -----
export const BUILDINGS = {
  tudor: b(49, 41, 56, 68), // timber-frame cottage
  cottage: b(33, 501, 92, 57), // dormer cottage (wide)
  townhouse: b(47, 1384, 64, 80), // two-storey apartment
  stone: b(44, 2590, 70, 64), // grey stone house
  manor: b(37, 790, 84, 71), // gabled manor
  shopAwning: b(52, 204, 54, 54), // small awninged shop
  greyShop: b(31, 1692, 96, 68), // wide storefront
  teal: b(40, 2446, 78, 54), // teal-roof shop
  arch: b(52, 2885, 54, 75), // arched two-storey
  redClub: b(33, 934, 92, 76), // bold red A-frame
  civic: b(52, 1098, 54, 53), // green-columned civic hall
  modern: b(47, 638, 71, 78), // concrete/glass block
  darkHall: b(41, 2737, 76, 65), // dark slate A-frame
  glassHall: b(43, 1989, 72, 64), // glass-arch market hall
  rotunda: b(37, 1844, 84, 63), // octagonal rotunda
} as const;

export type BuildingKey = keyof typeof BUILDINGS;

// --- Trees (verified — not cropped) -----------------------------------------
export const PROPS = {
  tree: g(386, 136, 44, 56), // full round tree with trunk
  treeB: g(456, 144, 32, 48), // slimmer tree
} as const;

// --- Image loading ----------------------------------------------------------
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

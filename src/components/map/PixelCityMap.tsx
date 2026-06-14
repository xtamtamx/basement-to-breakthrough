/**
 * PixelCityMap - cozy top-down town renderer for the city overview.
 *
 * Stardew / Earthbound feel: the ground, dirt paths, cobblestone town square,
 * flower gardens and flora texture are drawn PROCEDURALLY in one controlled
 * warm palette (so nothing clashes), and the genuinely-matching sprite art —
 * pitched-roof houses + round trees — is composited on top. The whole static
 * world is baked once into an offscreen canvas; only the live bits (venue show
 * markers, district signposts) redraw each frame.
 *
 * Driven by real game data: one quarter per district, the player's venues as
 * marked houses near the crossroads, pulsing indicators for venues with shows.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { soundManager } from '@/game/audio/SoundManager';
import { District, Venue, VenueType } from '@game/types';
import {
  AtlasSprite,
  BUILDINGS,
  BuildingKey,
  PROPS,
  SheetName,
  TILE,
  loadAllSheets,
} from './townAtlas';

interface PixelCityMapProps {
  onDistrictClick?: (district: District) => void;
  onVenueClick?: (venue: Venue) => void;
}

// --- World layout (in 16px tiles) -------------------------------------------
const WORLD_W = 64;
const WORLD_H = 52;
const ROAD_X = 31; // vertical path tiles: ROAD_X, ROAD_X + 1
const ROAD_Y = 25; // horizontal path tiles: ROAD_Y, ROAD_Y + 1
const SCALE = 2;
const PLAZA_R = 3; // cobble town-square radius around the crossroads (tiles)

const QUARTER_MARGIN = 2; // tiles of breathing room inside each quarter

// --- Cozy palette (one source of truth → no cross-pack clash) ---------------
const GRASS = ['#4d7838', '#578741', '#65984a', '#74a957']; // dark → light
const GRASS_BLADE = '#83bb64';
const GRASS_SHADE = '#3f6630';
const PATH = '#bd9159';
const PATH_LIGHT = '#cda66c';
const PATH_DARK = '#9c7341';
const PATH_SPECK = '#8a6236';
const COBBLE = '#b3a892';
const COBBLE_LIGHT = '#c4baa6';
const COBBLE_DARK = '#9a8e78';
const COBBLE_GROUT = '#6f6552';
const SOIL = '#73492c';
const SOIL_DARK = '#5d3a23';
const GARDEN_FLOWERS = ['#ef5a8a', '#f4cf4f', '#ffffff', '#b072e0', '#ff8c4d'];
const WILD_FLOWERS = ['#f4d04f', '#ffffff', '#ef6f9c', '#9c7be0'];

// House palette per district flavor (roof colors carry the district identity)
const FILLER_BUILDINGS: Record<string, BuildingKey[]> = {
  eastside: ['houseRed', 'houseRed', 'houseBlue'],
  downtown: ['houseBlue', 'houseDark', 'houseBlue'],
  industrial: ['houseDark', 'houseRed', 'houseDark'],
  university: ['houseBlue', 'houseBlue', 'houseRed'],
};
const DEFAULT_FILLERS: BuildingKey[] = ['houseRed', 'houseBlue', 'houseDark'];

const VENUE_BUILDINGS: Partial<Record<VenueType, BuildingKey>> = {
  [VenueType.BASEMENT]: 'houseRed',
  [VenueType.HOUSE_SHOW]: 'houseRed',
  [VenueType.GARAGE]: 'houseRed',
  [VenueType.DIY_SPACE]: 'houseBlue',
  [VenueType.DIVE_BAR]: 'houseBlue',
  [VenueType.PUNK_CLUB]: 'houseBlue',
  [VenueType.METAL_VENUE]: 'houseDark',
  [VenueType.WAREHOUSE]: 'houseDark',
  [VenueType.UNDERGROUND]: 'houseDark',
  [VenueType.THEATER]: 'houseBlue',
  [VenueType.CONCERT_HALL]: 'houseDark',
};

// Deterministic tiny hash for stable per-tile variation
function hash2(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Smooth value noise (bilinear-interpolated hash) → blobby grass regions
// instead of a per-tile checkerboard.
function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(x0, y0);
  const n10 = hash2(x0 + 1, y0);
  const n01 = hash2(x0, y0 + 1);
  const n11 = hash2(x0 + 1, y0 + 1);
  const a = n00 + (n10 - n00) * sx;
  const b = n01 + (n11 - n01) * sx;
  return a + (b - a) * sy;
}

interface Quarter {
  district: District;
  tx: number;
  ty: number;
  tw: number;
  th: number;
}

interface PlacedBuilding {
  sprite: AtlasSprite;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  venue?: Venue;
}

interface PlacedProp {
  sprite: AtlasSprite;
  tx: number;
  ty: number;
}

interface Garden {
  tx: number;
  ty: number;
  tw: number;
  th: number;
  seed: number;
}

interface TownPlan {
  quarters: Quarter[];
  buildings: PlacedBuilding[];
  trees: PlacedProp[];
  gardens: Garden[];
  paving: { tx: number; ty: number }[];
}

// Lay out districts into the four path-divided quarters; venues claim the plots
// nearest the crossroads, the rest get filler houses, pocket parks and gardens.
function planTown(districts: District[], venues: Venue[]): TownPlan {
  const quarters: Quarter[] = districts.slice(0, 4).map((district) => {
    const east = district.bounds.x >= 4;
    const south = district.bounds.y >= 4;
    const tx = (east ? ROAD_X + 2 : 1) + QUARTER_MARGIN - 1;
    const ty = (south ? ROAD_Y + 2 : 1) + QUARTER_MARGIN - 1;
    const tw =
      (east ? WORLD_W - 1 - (ROAD_X + 2) : ROAD_X - 1 - 1) - QUARTER_MARGIN;
    const th =
      (south ? WORLD_H - 1 - (ROAD_Y + 2) : ROAD_Y - 1 - 1) - QUARTER_MARGIN;
    return { district, tx, ty, tw, th };
  });

  const buildings: PlacedBuilding[] = [];
  const trees: PlacedProp[] = [];
  const gardens: Garden[] = [];
  const paving: { tx: number; ty: number }[] = [];

  for (const quarter of quarters) {
    const seed = hashString(quarter.district.id);
    const south = quarter.district.bounds.y >= 4;

    const plotW = 9;
    const plotH = 10;
    const cols = Math.max(1, Math.floor(quarter.tw / plotW));
    const rows = Math.max(1, Math.floor(quarter.th / plotH));

    const plots: { tx: number; ty: number; row: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        plots.push({
          tx: quarter.tx + c * plotW + 1,
          ty: quarter.ty + r * plotH + 1,
          row: r,
        });
      }
    }

    // Venues claim the plots nearest the crossroads so they sit front and
    // center in the default view
    const cx = ROAD_X + 1;
    const cy = ROAD_Y + 1;
    plots.sort(
      (a, b) =>
        Math.hypot(a.tx + 3.5 - cx, a.ty + 4 - cy) -
        Math.hypot(b.tx + 3.5 - cx, b.ty + 4 - cy),
    );

    const districtVenues = venues.filter(
      (v) => v.location?.id === quarter.district.id,
    );
    const fillers = FILLER_BUILDINGS[quarter.district.id] ?? DEFAULT_FILLERS;

    plots.forEach((plot, i) => {
      const venue = districtVenues[i];
      let key: BuildingKey | null = null;

      if (!venue) {
        const roll = hash2(seed + i, seed);
        if (roll < 0.12) {
          // pocket park with a tree
          trees.push({
            sprite: hash2(seed, i) < 0.5 ? PROPS.tree : PROPS.treeB,
            tx: plot.tx + 2,
            ty: plot.ty + 3,
          });
          return;
        }
        if (roll < 0.28) {
          // flower garden plot
          gardens.push({
            tx: plot.tx + 1,
            ty: plot.ty + 2,
            tw: 5,
            th: 4,
            seed: seed + i * 31,
          });
          // a tree tucked beside the garden for variety
          if (hash2(i, seed) < 0.5) {
            trees.push({ sprite: PROPS.treeB, tx: plot.tx + 6, ty: plot.ty + 1 });
          }
          return;
        }
      }

      key = venue
        ? VENUE_BUILDINGS[venue.type] ?? 'houseBlue'
        : fillers[(seed + i) % fillers.length];

      const sprite = BUILDINGS[key];
      const tw = sprite.rect.w / TILE;
      const th = sprite.rect.h / TILE;
      buildings.push({ sprite, tx: plot.tx, ty: plot.ty, tw, th, venue });

      // Walkway: apron under the house + a stub from the door toward the road
      const footY = plot.ty + th;
      for (let i2 = 1; i2 < tw - 1; i2++) {
        paving.push({ tx: plot.tx + i2, ty: footY });
      }
      const doorTx = plot.tx + Math.floor(tw / 2);
      const isRoadRow = !south && plot.row === rows - 1;
      const stubEnd = isRoadRow ? ROAD_Y - 1 : footY + 2;
      for (let py = footY + 1; py <= Math.min(stubEnd, WORLD_H - 2); py++) {
        paving.push({ tx: doorTx, ty: py });
      }
    });
  }

  // World-border greenery — a leafy frame around the town
  for (let tx = 0; tx < WORLD_W - 2; tx += 3) {
    if (Math.abs(tx - ROAD_X) > 2) {
      trees.push({ sprite: PROPS.tree, tx, ty: -2 });
      trees.push({ sprite: PROPS.tree, tx: tx + 1, ty: WORLD_H - 4 });
    }
  }
  for (let ty = 1; ty < WORLD_H - 4; ty += 4) {
    if (Math.abs(ty - ROAD_Y) > 2) {
      trees.push({ sprite: PROPS.treeB, tx: 0, ty: ty - 1 });
      trees.push({ sprite: PROPS.treeB, tx: WORLD_W - 2, ty: ty - 1 });
    }
  }

  return { quarters, buildings, trees, gardens, paving };
}

// True for the cobblestone town-square footprint at the crossroads.
function inPlaza(tx: number, ty: number): boolean {
  const dx = tx - (ROAD_X + 0.5);
  const dy = ty - (ROAD_Y + 0.5);
  return Math.abs(dx) <= PLAZA_R && Math.abs(dy) <= PLAZA_R;
}

// True for the dirt main roads (the two-wide cross), excluding the plaza.
function isRoad(tx: number, ty: number): boolean {
  return tx === ROAD_X || tx === ROAD_X + 1 || ty === ROAD_Y || ty === ROAD_Y + 1;
}

// --- Static world bake -------------------------------------------------------
// Draws the entire non-animated town into an offscreen canvas at 1x world px.
function buildStaticWorld(
  plan: TownPlan,
  sheets: Record<SheetName, HTMLImageElement>,
): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W * TILE;
  cv.height = WORLD_H * TILE;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  const pavingSet = new Set(plan.paving.map((p) => `${p.tx},${p.ty}`));

  // 1. Ground — grass blobs (value noise) with blade/shade speckle + wildflowers
  for (let ty = 0; ty < WORLD_H; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      const n = valueNoise(tx / 5.5, ty / 5.5);
      const shade =
        n < 0.34 ? GRASS[0] : n < 0.6 ? GRASS[1] : n < 0.84 ? GRASS[2] : GRASS[3];
      px(tx * TILE, ty * TILE, TILE, TILE, shade);

      const h = hash2(tx, ty);
      const ox = (h * 11) % (TILE - 3);
      const oy = (h * 27) % (TILE - 3);
      if (h > 0.62) px(tx * TILE + ox, ty * TILE + oy + 2, 2, 3, GRASS_BLADE);
      if (h < 0.16) px(tx * TILE + oy, ty * TILE + ox + 1, 2, 2, GRASS_SHADE);
      if (h > 0.965) {
        const c = WILD_FLOWERS[Math.floor(h * 1000) % WILD_FLOWERS.length];
        px(tx * TILE + ox, ty * TILE + oy, 2, 2, c);
        px(tx * TILE + ox, ty * TILE + oy + 2, 1, 1, GRASS_SHADE);
      }
    }
  }

  // 2. Dirt roads + walkways (skip plaza tiles — those get cobbled)
  const drawDirt = (tx: number, ty: number) => {
    if (inPlaza(tx, ty)) return;
    const x = tx * TILE;
    const y = ty * TILE;
    px(x, y, TILE, TILE, PATH);
    // lighter worn center, darker edges where dirt meets grass
    px(x + 2, y + 2, TILE - 4, TILE - 4, PATH_LIGHT);
    const edgeUp = !isRoad(tx, ty - 1) && !pavingSet.has(`${tx},${ty - 1}`);
    const edgeDn = !isRoad(tx, ty + 1) && !pavingSet.has(`${tx},${ty + 1}`);
    const edgeL = !isRoad(tx - 1, ty) && !pavingSet.has(`${tx - 1},${ty}`);
    const edgeR = !isRoad(tx + 1, ty) && !pavingSet.has(`${tx + 1},${ty}`);
    if (edgeUp) px(x, y, TILE, 2, PATH_DARK);
    if (edgeDn) px(x, y + TILE - 2, TILE, 2, PATH_DARK);
    if (edgeL) px(x, y, 2, TILE, PATH_DARK);
    if (edgeR) px(x + TILE - 2, y, 2, TILE, PATH_DARK);
    // pebble speckle
    const h = hash2(tx * 7, ty * 13);
    px(x + ((h * 12) % (TILE - 2)), y + ((h * 30) % (TILE - 2)), 2, 2, PATH_SPECK);
  };
  for (let tx = 0; tx < WORLD_W; tx++) {
    drawDirt(tx, ROAD_Y);
    drawDirt(tx, ROAD_Y + 1);
  }
  for (let ty = 0; ty < WORLD_H; ty++) {
    drawDirt(ROAD_X, ty);
    drawDirt(ROAD_X + 1, ty);
  }
  plan.paving.forEach((p) => drawDirt(p.tx, p.ty));

  // 3. Cobblestone town square at the crossroads
  for (let ty = 0; ty < WORLD_H; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      if (!inPlaza(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      px(x, y, TILE, TILE, COBBLE_GROUT);
      // 2x2 grid of stones per tile with gentle tonal variation
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const h = hash2(tx * 2 + sx, ty * 2 + sy);
          const tone = h < 0.22 ? COBBLE_DARK : h > 0.86 ? COBBLE_LIGHT : COBBLE;
          px(x + sx * 8 + 1, y + sy * 8 + 1, 6, 6, tone);
        }
      }
    }
  }

  // 3b. Town-square roundabout: stone ring + grass mound + a big central tree
  {
    const cxp = (ROAD_X + 1) * TILE;
    const cyp = (ROAD_Y + 1) * TILE;
    const ellipse = (rx: number, ry: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cxp, cyp, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    ellipse(30, 27, COBBLE_DARK);
    ellipse(26, 23, COBBLE_GROUT);
    ellipse(23, 20, GRASS[2]);
    for (let a = 0; a < 12; a++) {
      const ang = a * 2.399;
      const rr = 5 + (a % 3) * 5;
      const fx = cxp + Math.cos(ang) * rr;
      const fy = cyp + Math.sin(ang) * rr * 0.9;
      px(Math.round(fx), Math.round(fy), 2, 2, GARDEN_FLOWERS[a % GARDEN_FLOWERS.length]);
    }
    ctx.fillStyle = 'rgba(28, 44, 26, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cxp, cyp + 4, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const tree = PROPS.tree;
    ctx.drawImage(
      sheets[tree.sheet],
      tree.rect.x,
      tree.rect.y,
      tree.rect.w,
      tree.rect.h,
      cxp - tree.rect.w / 2,
      cyp + 6 - tree.rect.h,
      tree.rect.w,
      tree.rect.h,
    );
  }

  // 4. Flower gardens (tilled soil + bright blooms, framed by a low border)
  plan.gardens.forEach((g) => {
    const x = g.tx * TILE;
    const y = g.ty * TILE;
    const w = g.tw * TILE;
    const h = g.th * TILE;
    px(x, y, w, h, SOIL);
    px(x, y, w, 2, SOIL_DARK);
    px(x, y + h - 2, w, 2, SOIL_DARK);
    px(x, y, 2, h, SOIL_DARK);
    px(x + w - 2, y, 2, h, SOIL_DARK);
    for (let fy = 3; fy < h - 3; fy += 5) {
      for (let fx = 3; fx < w - 3; fx += 5) {
        const r = hash2(g.seed + fx, g.seed + fy);
        if (r < 0.25) continue;
        const c = GARDEN_FLOWERS[(g.seed + fx + fy) % GARDEN_FLOWERS.length];
        px(x + fx, y + fy, 3, 3, c);
        px(x + fx + 1, y + fy + 3, 1, 2, GRASS[0]); // tiny stem
      }
    }
  });

  // 5. Buildings + trees, depth-sorted by foot Y, with grounding shadows
  const depthSorted: Array<PlacedBuilding | (PlacedProp & { th: number })> = [
    ...plan.buildings,
    ...plan.trees.map((t) => ({ ...t, th: t.sprite.rect.h / TILE })),
  ].sort((a, b) => a.ty + a.th - (b.ty + b.th));

  depthSorted.forEach((b) => {
    const isBuilding = 'venue' in b;
    const sprite = b.sprite;
    const sw = sprite.rect.w;
    const sh = sprite.rect.h;
    const w = sw / TILE;

    // soft elliptical shadow under the footprint
    ctx.fillStyle = 'rgba(28, 44, 26, 0.22)';
    ctx.beginPath();
    ctx.ellipse(
      (b.tx + w / 2) * TILE,
      (b.ty + b.th - 0.3) * TILE,
      (w / 2) * TILE * 0.82,
      0.7 * TILE,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.drawImage(
      sheets[sprite.sheet],
      sprite.rect.x,
      sprite.rect.y,
      sw,
      sh,
      b.tx * TILE,
      b.ty * TILE,
      sw,
      sh,
    );
    void isBuilding;
  });

  return cv;
}

export const PixelCityMap: React.FC<PixelCityMapProps> = ({
  onDistrictClick,
  onVenueClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sheets, setSheets] = useState<Record<
    SheetName,
    HTMLImageElement
  > | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const districts = useGameStore((s) => s.districts);
  const venues = useGameStore((s) => s.venues);
  const scheduledShows = useGameStore((s) => s.scheduledShows);

  const plan = useMemo(() => planTown(districts, venues), [districts, venues]);

  // Bake the static world once per plan/sheet change
  const staticWorld = useMemo(
    () => (sheets ? buildStaticWorld(plan, sheets) : null),
    [plan, sheets],
  );

  const venuesWithShows = useMemo(() => {
    const ids = new Set<string>();
    scheduledShows.forEach((s) => {
      if (s.status === 'SCHEDULED') ids.add(s.venueId);
    });
    return ids;
  }, [scheduledShows]);

  // Camera in world pixels (top-left of viewport)
  const cameraRef = useRef({
    x: (WORLD_W * TILE * SCALE) / 2,
    y: (WORLD_H * TILE * SCALE) / 2,
  });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    camX: number;
    camY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    loadAllSheets().then(setSheets).catch(console.error);
  }, []);

  // Dev-only inspection hook
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as Window & { __pixelCityDebug?: unknown }).__pixelCityDebug = {
        plan,
        cameraRef,
        size,
        scale: SCALE,
        tile: TILE,
      };
    }
  }, [plan, size]);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clampCamera = useCallback(
    (x: number, y: number) => {
      const maxX = WORLD_W * TILE * SCALE - size.w;
      const maxY = WORLD_H * TILE * SCALE - size.h;
      return {
        x: Math.max(0, Math.min(x, Math.max(0, maxX))),
        y: Math.max(0, Math.min(y, Math.max(0, maxY))),
      };
    },
    [size.w, size.h],
  );

  // Center on the town square so the plaza + the nearest venues are in frame
  useEffect(() => {
    if (size.w === 0) return;
    cameraRef.current = clampCamera(
      (ROAD_X + 1) * TILE * SCALE - size.w / 2,
      (ROAD_Y - 1) * TILE * SCALE - size.h / 2,
    );
  }, [size.w, size.h, clampCamera]);

  const screenToTile = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const wx = (clientX - rect.left + cameraRef.current.x) / SCALE;
    const wy = (clientY - rect.top + cameraRef.current.y) / SCALE;
    return { tx: wx / TILE, ty: wy / TILE };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    try {
      canvasRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // best-effort
    }
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      camX: cameraRef.current.x,
      camY: cameraRef.current.y,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
      cameraRef.current = clampCamera(drag.camX - dx, drag.camY - dy);
    },
    [clampCamera],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || drag.moved) return; // it was a pan, not a tap

      const pos = screenToTile(e.clientX, e.clientY);
      if (!pos) return;

      const hitBuilding = plan.buildings.find(
        (b) =>
          b.venue &&
          pos.tx >= b.tx &&
          pos.tx <= b.tx + b.tw &&
          pos.ty >= b.ty - 1.5 &&
          pos.ty <= b.ty + b.th,
      );
      if (hitBuilding?.venue && onVenueClick) {
        haptics.light();
        soundManager.playClick();
        onVenueClick(hitBuilding.venue);
        return;
      }

      const quarter = plan.quarters.find(
        (q) =>
          pos.tx >= q.tx - 1 &&
          pos.tx <= q.tx + q.tw + 1 &&
          pos.ty >= q.ty - 1 &&
          pos.ty <= q.ty + q.th + 1,
      );
      if (quarter && onDistrictClick) {
        haptics.light();
        soundManager.playClick();
        onDistrictClick(quarter.district);
      }
    },
    [plan, onDistrictClick, onVenueClick, screenToTile],
  );

  // --- Rendering -------------------------------------------------------------
  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !staticWorld || size.w === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // sky/void behind the world
      ctx.fillStyle = '#1a2a1e';
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.save();
      ctx.translate(
        -Math.round(cameraRef.current.x),
        -Math.round(cameraRef.current.y),
      );
      ctx.scale(SCALE, SCALE);

      // 1. Baked static world (ground, paths, plaza, gardens, buildings, trees)
      ctx.drawImage(staticWorld, 0, 0);

      // 2. Live venue indicators (pulse + bobbing music-note badge)
      plan.buildings.forEach((b) => {
        if (!b.venue) return;
        const venue = b.venue;
        const cx = (b.tx + b.tw / 2) * TILE;
        const bob = Math.sin(time / 280) * 2;
        const my = (b.ty - 0.5) * TILE + bob;

        if (venuesWithShows.has(venue.id)) {
          const pulse = 0.5 + Math.sin(time / 180) * 0.35;
          ctx.fillStyle = `rgba(247, 37, 133, ${pulse.toFixed(2)})`;
          ctx.fillRect(b.tx * TILE, (b.ty + b.th) * TILE + 1, b.tw * TILE, 2);
        }

        ctx.fillStyle = 'rgba(10, 10, 14, 0.85)';
        ctx.fillRect(cx - 7, my - 7, 14, 14);
        ctx.strokeStyle = '#f72585';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 7.5, my - 7.5, 15, 15);
        ctx.fillStyle = '#f72585';
        ctx.fillRect(cx - 2, my - 5, 2, 8);
        ctx.fillRect(cx - 5, my + 1, 4, 3);
        ctx.fillRect(cx, my - 5, 5, 2);
      });

      // 3. District signposts
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textBaseline = 'middle';
      plan.quarters.forEach((q) => {
        const label = q.district.name.toUpperCase();
        const w = ctx.measureText(label).width + 12;
        const cx = (q.tx + q.tw / 2) * TILE;
        const y = (q.ty - 1) * TILE;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.82)';
        ctx.fillRect(cx - w / 2, y, w, 14);
        ctx.strokeStyle = q.district.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - w / 2 + 0.5, y + 0.5, w - 1, 13);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, cx - w / 2 + 6, y + 7.5);
      });

      ctx.restore();

      // 4. Cohesion grade: warm wash + soft vignette (the cozy "framed" feel)
      ctx.fillStyle = 'rgba(255, 214, 150, 0.05)';
      ctx.fillRect(0, 0, size.w, size.h);
      const vg = ctx.createRadialGradient(
        size.w / 2,
        size.h / 2,
        Math.min(size.w, size.h) * 0.35,
        size.w / 2,
        size.h / 2,
        Math.max(size.w, size.h) * 0.72,
      );
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vg.addColorStop(1, 'rgba(8, 10, 16, 0.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    [staticWorld, size.w, size.h, plan, venuesWithShows],
  );

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      render(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [render]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        width={Math.max(1, Math.round(size.w * dpr))}
        height={Math.max(1, Math.round(size.h * dpr))}
        style={{
          width: size.w,
          height: size.h,
          imageRendering: 'pixelated',
          touchAction: 'none',
          cursor: 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      />
    </div>
  );
};

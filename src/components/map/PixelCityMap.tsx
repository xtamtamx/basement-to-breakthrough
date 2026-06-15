/**
 * PixelCityMap - cozy top-down town renderer for the city overview.
 *
 * Stardew / Earthbound feel, drawn ENTIRELY PROCEDURALLY in one controlled
 * palette per city — grass, dirt paths, a cobblestone town square, flower
 * gardens, cottages (walls + pitched roof + door + windows), round trees,
 * bushes and lamps. No imported tilesets (they read as unfinished/clashing),
 * so everything is consistent and "finished". The whole static world is baked
 * once into an offscreen canvas; only the live bits (wandering townsfolk, venue
 * show markers, district signposts) redraw each frame.
 *
 * Driven by real game data: one quarter per district, the player's venues as
 * marked cottages near the crossroads, pulsing indicators for venues with shows.
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
import { CityThemeKey, District, Venue, VenueType } from '@game/types';

interface PixelCityMapProps {
  onDistrictClick?: (district: District) => void;
  onVenueClick?: (venue: Venue) => void;
}

// --- World layout (in 16px tiles) -------------------------------------------
const TILE = 16;
const WORLD_W = 64;
const WORLD_H = 52;
const ROAD_X = 31; // vertical path tiles: ROAD_X, ROAD_X + 1
const ROAD_Y = 25; // horizontal path tiles: ROAD_Y, ROAD_Y + 1
const SCALE = 2;
const PLAZA_R = 3; // cobble town-square radius around the crossroads (tiles)
const QUARTER_MARGIN = 2;
const BW = 5; // building footprint width (tiles)
const BH = 5; // building footprint height (tiles)

// --- Cottage palettes (roof keys carry the district/venue identity) ---------
interface HousePalette {
  roof: string;
  roofDark: string;
  wall: string;
  wallDark: string;
  door: string;
  doorDark: string;
  outline: string;
}
type RoofKey = 'red' | 'blue' | 'dark' | 'green';
const HOUSES: Record<RoofKey, HousePalette> = {
  red: { roof: '#c95040', roofDark: '#9c3a2e', wall: '#ecdcb6', wallDark: '#ccba8e', door: '#6e4a2c', doorDark: '#4f3419', outline: '#37291f' },
  blue: { roof: '#4a78b4', roofDark: '#345e92', wall: '#ecdcb6', wallDark: '#ccba8e', door: '#6e4a2c', doorDark: '#4f3419', outline: '#262833' },
  dark: { roof: '#565a66', roofDark: '#3a3d48', wall: '#dccfb2', wallDark: '#bcae8c', door: '#5b4326', doorDark: '#3e2c18', outline: '#22232b' },
  green: { roof: '#4f9457', roofDark: '#387641', wall: '#ecdcb6', wallDark: '#ccba8e', door: '#6e4a2c', doorDark: '#4f3419', outline: '#26331f' },
};

// --- Tree palettes -----------------------------------------------------------
interface TreePalette {
  bark: string;
  barkDark: string;
  leafDark: string;
  leaf: string;
  leafLight: string;
}

// --- Per-city map themes (one controlled palette each) ----------------------
interface MapTheme {
  grass: string[]; // 4 shades, dark → light
  grassBlade: string;
  grassShade: string;
  path: string;
  pathLight: string;
  pathSpeck: string;
  pathDark: string;
  cobble: string;
  cobbleLight: string;
  cobbleDark: string;
  cobbleGrout: string;
  soil: string;
  soilDark: string;
  gardenFlowers: string[];
  wildFlowers: string[];
  tree: TreePalette;
  roofMix: RoofKey[];
  void: string;
}

const THEMES: Record<CityThemeKey, MapTheme> = {
  // Basement City — bright cozy hometown green
  home: {
    grass: ['#57933f', '#66a54c', '#77b65a', '#8ac66a'],
    grassBlade: '#9ad277',
    grassShade: '#3f7232',
    path: '#c79a5e',
    pathLight: '#d8ac6e',
    pathSpeck: '#a8814c',
    pathDark: '#a07843',
    cobble: '#bcae90',
    cobbleLight: '#ccc0a4',
    cobbleDark: '#a3957a',
    cobbleGrout: '#7a6f58',
    soil: '#7a4d2d',
    soilDark: '#5f3c23',
    gardenFlowers: ['#ef5a8a', '#f4cf4f', '#ffffff', '#b072e0', '#ff8c4d'],
    wildFlowers: ['#f4d04f', '#ffffff', '#ef6f9c', '#9c7be0'],
    tree: { bark: '#6e4a2c', barkDark: '#4f3419', leafDark: '#2f7a38', leaf: '#46974c', leafLight: '#69bb60' },
    roofMix: ['red', 'blue', 'green'],
    void: '#21331f',
  },
  // Rust Belt — olive grass, autumnal foliage, sooty roofs
  rust: {
    grass: ['#5c6535', '#6b743e', '#7a8349', '#8a9255'],
    grassBlade: '#9aa564',
    grassShade: '#474f29',
    path: '#a6824e',
    pathLight: '#b8945d',
    pathSpeck: '#7c5f37',
    pathDark: '#86663a',
    cobble: '#9a958c',
    cobbleLight: '#aea99f',
    cobbleDark: '#7d7970',
    cobbleGrout: '#544f48',
    soil: '#5e4427',
    soilDark: '#49351e',
    gardenFlowers: ['#d8783a', '#c9a13a', '#d0d0d0', '#a06a3a', '#e0913a'],
    wildFlowers: ['#c9a13a', '#cacaca', '#d8783a', '#a8b06a'],
    tree: { bark: '#5e4023', barkDark: '#422c16', leafDark: '#5e6b2c', leaf: '#8a7a30', leafLight: '#bb9a3a' },
    roofMix: ['dark', 'dark', 'red'],
    void: '#26211a',
  },
  // Seaside — vivid spring green, sandy paths, sea backdrop
  seaside: {
    grass: ['#5ea24e', '#6fb35a', '#80c468', '#93d577'],
    grassBlade: '#a6e188',
    grassShade: '#4a8440',
    path: '#e0c98e',
    pathLight: '#eed8a1',
    pathSpeck: '#c0a96a',
    pathDark: '#c6af74',
    cobble: '#cdc3a4',
    cobbleLight: '#ddd4b8',
    cobbleDark: '#b1a888',
    cobbleGrout: '#8c8468',
    soil: '#8a6a3e',
    soilDark: '#6e5430',
    gardenFlowers: ['#ff8cb0', '#ffe066', '#ffffff', '#7ad0e6', '#ff9e6b'],
    wildFlowers: ['#ffe066', '#ffffff', '#ff8cb0', '#7ad0e6'],
    tree: { bark: '#7a5530', barkDark: '#583c20', leafDark: '#2f8a48', leaf: '#46a85e', leafLight: '#6fcf7e' },
    roofMix: ['blue', 'red', 'blue'],
    void: '#16363f',
  },
  // The Capital — cool, clean, manicured grey-green
  capital: {
    grass: ['#54795a', '#638967', '#739a77', '#86ab8a'],
    grassBlade: '#97bb9a',
    grassShade: '#43614a',
    path: '#bdb7a8',
    pathLight: '#cfc9ba',
    pathSpeck: '#8e8a76',
    pathDark: '#9d988b',
    cobble: '#b2b4bc',
    cobbleLight: '#c8cad0',
    cobbleDark: '#94969c',
    cobbleGrout: '#5e6068',
    soil: '#6a5a48',
    soilDark: '#534639',
    gardenFlowers: ['#c98ad0', '#8ab0e0', '#ffffff', '#e0a0c0', '#9ad0c0'],
    wildFlowers: ['#c98ad0', '#ffffff', '#8ab0e0', '#9ad0c0'],
    tree: { bark: '#6a513a', barkDark: '#4d3a28', leafDark: '#3a7a52', leaf: '#52975f', leafLight: '#79b884' },
    roofMix: ['blue', 'dark', 'blue'],
    void: '#191c24',
  },
};

const FILLER_BUILDINGS: Record<string, RoofKey[]> = {
  eastside: ['red', 'red', 'blue'],
  downtown: ['blue', 'dark', 'blue'],
  industrial: ['dark', 'red', 'dark'],
  university: ['green', 'blue', 'red'],
};

const VENUE_ROOFS: Partial<Record<VenueType, RoofKey>> = {
  [VenueType.BASEMENT]: 'red',
  [VenueType.HOUSE_SHOW]: 'red',
  [VenueType.GARAGE]: 'red',
  [VenueType.DIY_SPACE]: 'green',
  [VenueType.DIVE_BAR]: 'blue',
  [VenueType.PUNK_CLUB]: 'blue',
  [VenueType.METAL_VENUE]: 'dark',
  [VenueType.WAREHOUSE]: 'dark',
  [VenueType.UNDERGROUND]: 'dark',
  [VenueType.THEATER]: 'blue',
  [VenueType.CONCERT_HALL]: 'dark',
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

// Smooth value noise (bilinear-interpolated hash) → soft blobby regions.
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
  roof: RoofKey;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  venue?: Venue;
}
interface PlacedTree {
  tx: number;
  ty: number;
  big: boolean;
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
  trees: PlacedTree[];
  gardens: Garden[];
  paving: { tx: number; ty: number }[];
}

// Lay out districts into the four path-divided quarters; venues claim the plots
// nearest the crossroads, the rest get cottages, pocket parks and gardens.
function planTown(
  districts: District[],
  venues: Venue[],
  roofMix: RoofKey[],
): TownPlan {
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
  const trees: PlacedTree[] = [];
  const gardens: Garden[] = [];
  const paving: { tx: number; ty: number }[] = [];

  for (const quarter of quarters) {
    const seed = hashString(quarter.district.id);
    const south = quarter.district.bounds.y >= 4;

    const plotW = 7;
    const plotH = 7;
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

    const cx = ROAD_X + 1;
    const cy = ROAD_Y + 1;
    plots.sort(
      (a, b) =>
        Math.hypot(a.tx + BW / 2 - cx, a.ty + BH / 2 - cy) -
        Math.hypot(b.tx + BW / 2 - cx, b.ty + BH / 2 - cy),
    );

    const districtVenues = venues.filter(
      (v) => v.location?.id === quarter.district.id,
    );
    const fillers = roofMix ?? FILLER_BUILDINGS[quarter.district.id];

    plots.forEach((plot, i) => {
      const venue = districtVenues[i];

      if (!venue) {
        const roll = hash2(seed + i, seed);
        if (roll < 0.1) {
          trees.push({ tx: plot.tx + 2, ty: plot.ty + 2, big: hash2(seed, i) < 0.4 });
          return;
        }
        if (roll < 0.24) {
          gardens.push({ tx: plot.tx, ty: plot.ty + 1, tw: 5, th: 4, seed: seed + i * 31 });
          if (hash2(i, seed) < 0.5) trees.push({ tx: plot.tx + 5, ty: plot.ty, big: false });
          return;
        }
      }

      const roof: RoofKey = venue
        ? VENUE_ROOFS[venue.type] ?? 'blue'
        : fillers[(seed + i) % fillers.length];
      buildings.push({ roof, tx: plot.tx, ty: plot.ty, tw: BW, th: BH, venue });

      // Walkway: apron under the cottage + a stub toward the road
      const footY = plot.ty + BH;
      for (let i2 = 1; i2 < BW - 1; i2++) paving.push({ tx: plot.tx + i2, ty: footY });
      const doorTx = plot.tx + Math.floor(BW / 2);
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
      trees.push({ tx, ty: -1, big: false });
      trees.push({ tx: tx + 1, ty: WORLD_H - 3, big: false });
    }
  }
  for (let ty = 1; ty < WORLD_H - 4; ty += 4) {
    if (Math.abs(ty - ROAD_Y) > 2) {
      trees.push({ tx: 0, ty, big: false });
      trees.push({ tx: WORLD_W - 2, ty, big: false });
    }
  }

  return { quarters, buildings, trees, gardens, paving };
}

function inPlaza(tx: number, ty: number): boolean {
  const dx = tx - (ROAD_X + 0.5);
  const dy = ty - (ROAD_Y + 0.5);
  return Math.abs(dx) <= PLAZA_R && Math.abs(dy) <= PLAZA_R;
}
function isRoad(tx: number, ty: number): boolean {
  return tx === ROAD_X || tx === ROAD_X + 1 || ty === ROAD_Y || ty === ROAD_Y + 1;
}

// --- Procedural cottage ------------------------------------------------------
// (x,y) = top-left of the BW×BH box in world px.
function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pal: HousePalette,
): void {
  const W = BW * TILE;
  const H = BH * TILE;
  const wallX = x + 10;
  const wallW = W - 20;
  const roofBaseY = y + 36;
  const apexY = y + 4;
  const wallTopY = roofBaseY - 2;
  const wallBotY = y + H - 6;
  const wallH = wallBotY - wallTopY;

  // grounding shadow
  ctx.fillStyle = 'rgba(20,35,20,0.22)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, wallBotY + 2, wallW / 2 + 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // walls
  ctx.fillStyle = pal.wall;
  ctx.fillRect(wallX, wallTopY, wallW, wallH);
  ctx.fillStyle = pal.wallDark;
  ctx.fillRect(wallX + wallW - 4, wallTopY, 4, wallH);
  ctx.fillRect(wallX, wallBotY - 3, wallW, 3);
  ctx.fillStyle = pal.outline;
  ctx.fillRect(wallX - 1, wallTopY, 1, wallH);
  ctx.fillRect(wallX + wallW, wallTopY, 1, wallH);

  // pitched roof (gable) with shaded right slope + eaves
  ctx.fillStyle = pal.roof;
  ctx.beginPath();
  ctx.moveTo(x + 2, roofBaseY);
  ctx.lineTo(x + W / 2, apexY);
  ctx.lineTo(x + W - 2, roofBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = pal.roofDark;
  ctx.beginPath();
  ctx.moveTo(x + W / 2, apexY);
  ctx.lineTo(x + W - 2, roofBaseY);
  ctx.lineTo(x + W / 2, roofBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = pal.roofDark;
  ctx.fillRect(x + 2, roofBaseY - 2, W - 4, 2); // eave shadow

  // door
  const doorW = 14;
  const doorH = 18;
  const doorX = x + W / 2 - doorW / 2;
  ctx.fillStyle = pal.door;
  ctx.fillRect(doorX, wallBotY - doorH, doorW, doorH);
  ctx.fillStyle = pal.doorDark;
  ctx.fillRect(doorX, wallBotY - doorH, 2, doorH);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(doorX + doorW - 4, wallBotY - doorH / 2, 2, 2); // knob

  // windows (warm-lit)
  const winY = wallTopY + 7;
  for (const wx of [wallX + 6, wallX + wallW - 16]) {
    ctx.fillStyle = pal.outline;
    ctx.fillRect(wx - 1, winY - 1, 12, 12);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(wx, winY, 10, 10);
    ctx.fillStyle = '#e6c878';
    ctx.fillRect(wx, winY + 5, 10, 5);
    ctx.fillStyle = pal.outline;
    ctx.fillRect(wx + 4, winY, 2, 10);
    ctx.fillRect(wx, winY + 4, 10, 2);
  }
}

// --- Procedural tree ---------------------------------------------------------
// (cx, footY) = centre/base in world px.
function drawTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  footY: number,
  pal: TreePalette,
  big: boolean,
): void {
  const s = big ? 1.2 : 1;
  const trunkW = Math.round(5 * s);
  const trunkH = Math.round(11 * s);

  ctx.fillStyle = 'rgba(20,35,20,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, footY, 11 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pal.bark;
  ctx.fillRect(cx - trunkW / 2, footY - trunkH, trunkW, trunkH);
  ctx.fillStyle = pal.barkDark;
  ctx.fillRect(cx - trunkW / 2, footY - trunkH, 2, trunkH);

  const cyc = footY - trunkH - 11 * s;
  const blob = (dx: number, dy: number, r: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx + dx, cyc + dy, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  blob(0, 4 * s, 16 * s, pal.leafDark);
  blob(-9 * s, 2 * s, 10 * s, pal.leafDark);
  blob(9 * s, 2 * s, 10 * s, pal.leafDark);
  blob(0, -1 * s, 14 * s, pal.leaf);
  blob(-6 * s, -3 * s, 8 * s, pal.leaf);
  blob(6 * s, -3 * s, 8 * s, pal.leaf);
  blob(-3 * s, -8 * s, 7 * s, pal.leafLight);
  blob(4 * s, -6 * s, 5 * s, pal.leafLight);
}

// --- Wandering townsfolk -----------------------------------------------------
const WALKER_HAIR = ['#f72585', '#4cc9f0', '#7cf06a', '#ffd23f', '#b072e0', '#ff7a4d'];
const WALKER_SHIRT = ['#1f2430', '#2a2a35', '#3a2a3f', '#26303a', '#33283a'];
const WALKER_SKIN = ['#e0b58a', '#c98a5a', '#8a5a3a', '#f0c9a0'];

interface Walker {
  x: number;
  y: number;
  tx: number;
  ty: number;
  ptx: number;
  pty: number;
  ntx: number;
  nty: number;
  hair: string;
  shirt: string;
  skin: string;
  speed: number;
  phase: number;
}

function pickNextTile(w: Walker, walkable: Set<string>): void {
  const cands = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
    .map(([dx, dy]) => ({ tx: w.tx + dx, ty: w.ty + dy }))
    .filter((c) => walkable.has(`${c.tx},${c.ty}`));
  if (cands.length === 0) return;
  const forward = cands.filter((c) => !(c.tx === w.ptx && c.ty === w.pty));
  const pool = forward.length ? forward : cands;
  const next = pool[Math.floor(Math.random() * pool.length)];
  w.ptx = w.tx;
  w.pty = w.ty;
  w.ntx = next.tx;
  w.nty = next.ty;
}

function drawPerson(ctx: CanvasRenderingContext2D, w: Walker): void {
  const x = Math.round(w.x);
  const y = Math.round(w.y);
  const walk = Math.sin(w.phase);
  const bob = walk > 0 ? -1 : 0;
  const headTop = y - 9 + bob;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 3.2, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2a2330';
  ctx.fillRect(x - 2 + (walk > 0 ? 1 : 0), y - 3, 1, 3);
  ctx.fillRect(x + 1 - (walk > 0 ? 1 : 0), y - 3, 1, 3);
  ctx.fillStyle = w.shirt;
  ctx.fillRect(x - 2, headTop + 3, 4, 4);
  ctx.fillStyle = w.skin;
  ctx.fillRect(x - 1, headTop, 3, 3);
  ctx.fillStyle = w.hair;
  ctx.fillRect(x - 1, headTop - 1, 3, 1);
  ctx.fillRect(x, headTop - 2, 1, 1);
}

// --- Static world bake -------------------------------------------------------
function buildStaticWorld(plan: TownPlan, theme: MapTheme): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W * TILE;
  cv.height = WORLD_H * TILE;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const GRASS = theme.grass;
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // 1. Ground — grass sampled at 8px sub-cells (smoother than per-tile blocks),
  //    two noise octaves, with sparse blades/wildflowers.
  for (let y = 0; y < WORLD_H * TILE; y += 8) {
    for (let x = 0; x < WORLD_W * TILE; x += 8) {
      const n =
        valueNoise(x / 88, y / 88) * 0.7 + valueNoise(x / 26 + 9, y / 26 + 9) * 0.3;
      const shade =
        n < 0.36 ? GRASS[0] : n < 0.58 ? GRASS[1] : n < 0.8 ? GRASS[2] : GRASS[3];
      px(x, y, 8, 8, shade);
    }
  }
  for (let ty = 0; ty < WORLD_H; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      const h = hash2(tx, ty);
      const ox = (h * 11) % (TILE - 3);
      const oy = (h * 27) % (TILE - 3);
      if (h > 0.74) px(tx * TILE + ox, ty * TILE + oy + 2, 2, 2, theme.grassBlade);
      else if (h < 0.1) px(tx * TILE + oy, ty * TILE + ox + 1, 2, 2, theme.grassShade);
      if (h > 0.975) {
        const c = theme.wildFlowers[Math.floor(h * 1000) % theme.wildFlowers.length];
        px(tx * TILE + ox, ty * TILE + oy, 2, 2, c);
      }
    }
  }

  // 2. Dirt roads + walkways — flat fill + soft mottle, dark only at grass edge
  //    (no per-tile inset → no grid look).
  const pavingSet = new Set(plan.paving.map((p) => `${p.tx},${p.ty}`));
  const drawDirt = (tx: number, ty: number) => {
    if (inPlaza(tx, ty)) return;
    const x = tx * TILE;
    const y = ty * TILE;
    px(x, y, TILE, TILE, theme.path);
    const h = hash2(tx * 7, ty * 13);
    if (h > 0.5) px(x + ((h * 73) % 11), y + ((h * 131) % 11), 3, 2, theme.pathLight);
    if (h < 0.42) px(x + ((h * 251) % 12), y + ((h * 313) % 12), 2, 2, theme.pathSpeck);
    if (!isRoad(tx, ty - 1) && !pavingSet.has(`${tx},${ty - 1}`)) px(x, y, TILE, 2, theme.pathDark);
    if (!isRoad(tx, ty + 1) && !pavingSet.has(`${tx},${ty + 1}`)) px(x, y + TILE - 2, TILE, 2, theme.pathDark);
    if (!isRoad(tx - 1, ty) && !pavingSet.has(`${tx - 1},${ty}`)) px(x, y, 2, TILE, theme.pathDark);
    if (!isRoad(tx + 1, ty) && !pavingSet.has(`${tx + 1},${ty}`)) px(x + TILE - 2, y, 2, TILE, theme.pathDark);
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
      px(x, y, TILE, TILE, theme.cobbleGrout);
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const h = hash2(tx * 2 + sx, ty * 2 + sy);
          const tone = h < 0.22 ? theme.cobbleDark : h > 0.86 ? theme.cobbleLight : theme.cobble;
          px(x + sx * 8 + 1, y + sy * 8 + 1, 6, 6, tone);
        }
      }
    }
  }

  // 3b. Town-square roundabout: stone ring + grass mound + a big central tree
  {
    const cxp = (ROAD_X + 1) * TILE;
    const cyp = (ROAD_Y + 1) * TILE;
    ell(cxp, cyp, 30, 27, theme.cobbleDark);
    ell(cxp, cyp, 26, 23, theme.cobbleGrout);
    ell(cxp, cyp, 23, 20, GRASS[2]);
    for (let a = 0; a < 12; a++) {
      const ang = a * 2.399;
      const rr = 6 + (a % 3) * 5;
      px(
        Math.round(cxp + Math.cos(ang) * rr),
        Math.round(cyp + Math.sin(ang) * rr * 0.9),
        2,
        2,
        theme.gardenFlowers[a % theme.gardenFlowers.length],
      );
    }
    drawTree(ctx, cxp, cyp + 9, theme.tree, true);
  }

  // 4. Flower gardens (tilled soil + bright blooms, framed border)
  plan.gardens.forEach((g) => {
    const x = g.tx * TILE;
    const y = g.ty * TILE;
    const w = g.tw * TILE;
    const h = g.th * TILE;
    px(x, y, w, h, theme.soil);
    px(x, y, w, 2, theme.soilDark);
    px(x, y + h - 2, w, 2, theme.soilDark);
    px(x, y, 2, h, theme.soilDark);
    px(x + w - 2, y, 2, h, theme.soilDark);
    for (let fy = 5; fy < h - 4; fy += 7) {
      for (let fx = 5; fx < w - 4; fx += 7) {
        const r = hash2(g.seed + fx * 3, g.seed + fy * 3);
        if (r < 0.38) continue;
        px(x + fx, y + fy + 3, 3, 2, theme.tree.leafDark); // foliage
        const c = theme.gardenFlowers[Math.floor(r * 97) % theme.gardenFlowers.length];
        px(x + fx, y + fy, 3, 3, c); // bloom
        px(x + fx + 1, y + fy + 1, 1, 1, '#ffffff'); // highlight
      }
    }
  });

  // 4b. Bushes on open grass + lamp posts along the roads
  const occupied = new Set<string>();
  const mark = (tx0: number, ty0: number, w: number, h: number) => {
    for (let yy = ty0 - 1; yy < ty0 + h + 1; yy++)
      for (let xx = tx0 - 1; xx < tx0 + w + 1; xx++) occupied.add(`${xx},${yy}`);
  };
  plan.buildings.forEach((b) => mark(b.tx, b.ty, b.tw, b.th));
  plan.gardens.forEach((g) => mark(g.tx, g.ty, g.tw, g.th));
  plan.trees.forEach((t) => mark(t.tx, t.ty, 2, 2));
  plan.paving.forEach((p) => occupied.add(`${p.tx},${p.ty}`));

  const bush = (cx: number, cy: number) => {
    ell(cx, cy + 3, 7, 2.4, 'rgba(28,44,26,0.20)');
    ell(cx, cy, 7, 5, theme.tree.leafDark);
    ell(cx - 3, cy - 1, 4, 3, theme.tree.leaf);
    ell(cx + 3, cy - 1, 4, 3, theme.tree.leaf);
    ell(cx, cy - 2, 3, 2, theme.tree.leafLight);
  };
  const lamp = (x: number, y: number) => {
    ell(x + 1, y + 1, 3, 1.4, 'rgba(20,30,18,0.25)');
    px(x, y - 12, 2, 12, '#2f271e');
    px(x - 1, y - 1, 4, 2, '#5a4a36');
    ell(x + 1, y - 13, 6, 6, 'rgba(255,227,154,0.22)');
    px(x - 1, y - 15, 4, 4, '#ffe39a');
  };

  for (const q of plan.quarters) {
    for (let ty = q.ty; ty < q.ty + q.th; ty++) {
      for (let tx = q.tx; tx < q.tx + q.tw; tx++) {
        if (isRoad(tx, ty) || inPlaza(tx, ty) || occupied.has(`${tx},${ty}`)) continue;
        if (hash2(tx * 5 + 1, ty * 5 + 3) > 0.9) {
          bush(tx * TILE + 8, ty * TILE + 10);
          occupied.add(`${tx},${ty}`);
        }
      }
    }
  }
  for (let ty = 5; ty < WORLD_H - 4; ty += 9) {
    if (Math.abs(ty - ROAD_Y) > PLAZA_R + 1) {
      lamp((ROAD_X - 1) * TILE + 6, ty * TILE + 14);
      lamp((ROAD_X + 2) * TILE + 10, ty * TILE + 14);
    }
  }
  for (let tx = 5; tx < WORLD_W - 4; tx += 9) {
    if (Math.abs(tx - ROAD_X) > PLAZA_R + 1) {
      lamp(tx * TILE + 8, (ROAD_Y - 1) * TILE + 6);
      lamp(tx * TILE + 8, (ROAD_Y + 2) * TILE + 14);
    }
  }

  // 5. Cottages + trees, depth-sorted by foot Y
  type Drawable = { foot: number; kind: 'house'; b: PlacedBuilding } | { foot: number; kind: 'tree'; t: PlacedTree };
  const drawables: Drawable[] = [
    ...plan.buildings.map((b) => ({ foot: b.ty + b.th, kind: 'house' as const, b })),
    ...plan.trees.map((t) => ({ foot: t.ty + 2, kind: 'tree' as const, t })),
  ].sort((a, b) => a.foot - b.foot);

  drawables.forEach((d) => {
    if (d.kind === 'house') {
      drawHouse(ctx, d.b.tx * TILE, d.b.ty * TILE, HOUSES[d.b.roof]);
    } else {
      drawTree(ctx, (d.t.tx + 1) * TILE, (d.t.ty + 2) * TILE, theme.tree, d.t.big);
    }
  });

  return cv;
}

export const PixelCityMap: React.FC<PixelCityMapProps> = ({
  onDistrictClick,
  onVenueClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const districts = useGameStore((s) => s.districts);
  const venues = useGameStore((s) => s.venues);
  const scheduledShows = useGameStore((s) => s.scheduledShows);
  const themeKey = useGameStore(
    (s) => s.cities.find((c) => c.id === s.currentCityId)?.theme ?? 'home',
  );
  const theme = THEMES[themeKey];

  const plan = useMemo(
    () => planTown(districts, venues, theme.roofMix),
    [districts, venues, theme],
  );

  const staticWorld = useMemo(
    () => buildStaticWorld(plan, theme),
    [plan, theme],
  );

  const venuesWithShows = useMemo(() => {
    const ids = new Set<string>();
    scheduledShows.forEach((s) => {
      if (s.status === 'SCHEDULED') ids.add(s.venueId);
    });
    return ids;
  }, [scheduledShows]);

  const walkable = useMemo(() => {
    const set = new Set<string>();
    const list: { tx: number; ty: number }[] = [];
    const add = (tx: number, ty: number) => {
      const k = `${tx},${ty}`;
      if (!set.has(k)) {
        set.add(k);
        list.push({ tx, ty });
      }
    };
    for (let ty = 1; ty < WORLD_H - 1; ty++)
      for (let tx = 1; tx < WORLD_W - 1; tx++)
        if (isRoad(tx, ty) || inPlaza(tx, ty)) add(tx, ty);
    plan.paving.forEach((p) => add(p.tx, p.ty));
    return { set, list };
  }, [plan]);

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
  const walkersRef = useRef<Walker[]>([]);
  const lastTimeRef = useRef(0);

  // Spawn townsfolk on the walkable network (re-seeded when the layout changes)
  useEffect(() => {
    const { list } = walkable;
    if (list.length === 0) {
      walkersRef.current = [];
      return;
    }
    const count = Math.max(8, Math.min(18, Math.floor(list.length / 12)));
    const ws: Walker[] = [];
    for (let i = 0; i < count; i++) {
      const t = list[Math.floor(Math.random() * list.length)];
      ws.push({
        x: (t.tx + 0.5) * TILE,
        y: (t.ty + 0.9) * TILE,
        tx: t.tx,
        ty: t.ty,
        ptx: t.tx,
        pty: t.ty,
        ntx: t.tx,
        nty: t.ty,
        hair: WALKER_HAIR[i % WALKER_HAIR.length],
        shirt: WALKER_SHIRT[i % WALKER_SHIRT.length],
        skin: WALKER_SKIN[i % WALKER_SKIN.length],
        speed: 11 + Math.random() * 9,
        phase: Math.random() * 6.28,
      });
    }
    walkersRef.current = ws;
  }, [walkable]);

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
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
      if (!drag || drag.moved) return;

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

  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !staticWorld || size.w === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = theme.void;
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.save();
      ctx.translate(-Math.round(cameraRef.current.x), -Math.round(cameraRef.current.y));
      ctx.scale(SCALE, SCALE);

      ctx.drawImage(staticWorld, 0, 0);

      // Wandering townsfolk
      {
        const dt = Math.min(0.05, lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0);
        lastTimeRef.current = time;
        const wset = walkable.set;
        walkersRef.current.forEach((w) => {
          const tgx = (w.ntx + 0.5) * TILE;
          const tgy = (w.nty + 0.9) * TILE;
          const dx = tgx - w.x;
          const dy = tgy - w.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.7) {
            w.tx = w.ntx;
            w.ty = w.nty;
            pickNextTile(w, wset);
          } else {
            const v = w.speed * dt;
            w.x += (dx / d) * v;
            w.y += (dy / d) * v;
            w.phase += v * 0.6;
          }
          drawPerson(ctx, w);
        });
      }

      // Live venue indicators (pulse + bobbing music-note badge)
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

      // District signposts
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

      // Gentle cohesion grade: light warm wash + soft vignette
      ctx.fillStyle = 'rgba(255, 220, 160, 0.04)';
      ctx.fillRect(0, 0, size.w, size.h);
      const vg = ctx.createRadialGradient(
        size.w / 2,
        size.h / 2,
        Math.min(size.w, size.h) * 0.42,
        size.w / 2,
        size.h / 2,
        Math.max(size.w, size.h) * 0.78,
      );
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vg.addColorStop(1, 'rgba(10, 14, 20, 0.22)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    [staticWorld, size.w, size.h, plan, venuesWithShows, walkable, theme],
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
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
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

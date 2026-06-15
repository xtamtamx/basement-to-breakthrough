/**
 * PixelCityMap - cozy SNES top-down town renderer for the city overview.
 *
 * Real pixel-art SPRITES for the things that read as "buildings/trees" (complete
 * houses from houses-sprite-sheet, round trees from grasslands-tileset — rects
 * verified by programmatic bbox detection so nothing is cropped), composited
 * over a PROCEDURAL ground/paths/town-square/gardens drawn in one controlled
 * per-city palette. The whole static world is baked once into an offscreen
 * canvas; only the live bits (wandering townsfolk, venue markers, signposts)
 * redraw each frame.
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
const ROAD_X = 31;
const ROAD_Y = 25;
const SCALE = 2;
const SPR = 0.6; // sprite draw-scale into the world (net screen ≈ native × 1.2)
const PLAZA_R = 3;
const QUARTER_MARGIN = 2;

interface TreePalette {
  bark: string;
  barkDark: string;
  leafDark: string;
  leaf: string;
  leafLight: string;
}
interface MapTheme {
  grass: string[];
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
  tree: TreePalette; // used for procedural bushes
  roofMix: BuildingKey[]; // filler-building bias for this city
  void: string;
}

const THEMES: Record<CityThemeKey, MapTheme> = {
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
    roofMix: ['tudor', 'cottage', 'townhouse'],
    void: '#21331f',
  },
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
    roofMix: ['darkHall', 'greyShop', 'manor'],
    void: '#26211a',
  },
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
    roofMix: ['teal', 'shopAwning', 'cottage'],
    void: '#16363f',
  },
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
    roofMix: ['stone', 'arch', 'greyShop'],
    void: '#191c24',
  },
};

const VENUE_BUILDINGS: Partial<Record<VenueType, BuildingKey>> = {
  [VenueType.BASEMENT]: 'tudor',
  [VenueType.HOUSE_SHOW]: 'tudor',
  [VenueType.GARAGE]: 'tudor',
  [VenueType.DIY_SPACE]: 'shopAwning',
  [VenueType.DIVE_BAR]: 'greyShop',
  [VenueType.PUNK_CLUB]: 'redClub',
  [VenueType.METAL_VENUE]: 'darkHall',
  [VenueType.WAREHOUSE]: 'glassHall',
  [VenueType.UNDERGROUND]: 'darkHall',
  [VenueType.THEATER]: 'civic',
  [VenueType.CONCERT_HALL]: 'glassHall',
  [VenueType.ARENA]: 'modern',
  [VenueType.FESTIVAL_GROUNDS]: 'rotunda',
};

// footprint of a sprite in tiles, at SPR
const fpW = (s: AtlasSprite) => Math.max(1, Math.round((s.rect.w * SPR) / TILE));
const fpH = (s: AtlasSprite) => Math.max(1, Math.round((s.rect.h * SPR) / TILE));

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
interface PlacedTree {
  sprite: AtlasSprite;
  tx: number;
  ty: number;
  th: number;
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

function planTown(
  districts: District[],
  venues: Venue[],
  roofMix: BuildingKey[],
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

  const pushTree = (s: AtlasSprite, tx: number, ty: number) =>
    trees.push({ sprite: s, tx, ty, th: fpH(s) });

  for (const quarter of quarters) {
    const seed = hashString(quarter.district.id);
    const south = quarter.district.bounds.y >= 4;
    const plotW = 7;
    const plotH = 7;
    const cols = Math.max(1, Math.floor(quarter.tw / plotW));
    const rows = Math.max(1, Math.floor(quarter.th / plotH));

    const plots: { tx: number; ty: number; row: number }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        plots.push({ tx: quarter.tx + c * plotW + 1, ty: quarter.ty + r * plotH + 1, row: r });

    const cx = ROAD_X + 1;
    const cy = ROAD_Y + 1;
    plots.sort(
      (a, b) =>
        Math.hypot(a.tx + 2 - cx, a.ty + 2 - cy) - Math.hypot(b.tx + 2 - cx, b.ty + 2 - cy),
    );

    const districtVenues = venues.filter((v) => v.location?.id === quarter.district.id);

    plots.forEach((plot, i) => {
      const venue = districtVenues[i];
      if (!venue) {
        const roll = hash2(seed + i, seed);
        if (roll < 0.1) {
          pushTree(hash2(seed, i) < 0.4 ? PROPS.tree : PROPS.treeB, plot.tx + 2, plot.ty + 2);
          return;
        }
        if (roll < 0.24) {
          gardens.push({ tx: plot.tx, ty: plot.ty + 1, tw: 5, th: 4, seed: seed + i * 31 });
          if (hash2(i, seed) < 0.5) pushTree(PROPS.treeB, plot.tx + 5, plot.ty);
          return;
        }
      }

      const key: BuildingKey = venue
        ? VENUE_BUILDINGS[venue.type] ?? 'cottage'
        : roofMix[(seed + i) % roofMix.length];
      const sprite = BUILDINGS[key];
      const tw = fpW(sprite);
      const th = fpH(sprite);
      buildings.push({ sprite, tx: plot.tx, ty: plot.ty, tw, th, venue });

      const footY = plot.ty + th;
      for (let i2 = 1; i2 < tw - 1; i2++) paving.push({ tx: plot.tx + i2, ty: footY });
      const doorTx = plot.tx + Math.floor(tw / 2);
      const isRoadRow = !south && plot.row === rows - 1;
      const stubEnd = isRoadRow ? ROAD_Y - 1 : footY + 2;
      for (let py = footY + 1; py <= Math.min(stubEnd, WORLD_H - 2); py++)
        paving.push({ tx: doorTx, ty: py });
    });
  }

  for (let tx = 0; tx < WORLD_W - 2; tx += 3) {
    if (Math.abs(tx - ROAD_X) > 2) {
      pushTree(PROPS.tree, tx, -1);
      pushTree(PROPS.tree, tx + 1, WORLD_H - 3);
    }
  }
  for (let ty = 1; ty < WORLD_H - 4; ty += 4) {
    if (Math.abs(ty - ROAD_Y) > 2) {
      pushTree(PROPS.treeB, 0, ty);
      pushTree(PROPS.treeB, WORLD_W - 2, ty);
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

// --- Wandering townsfolk -----------------------------------------------------
const WALKER_HAIR = ['#f72585', '#4cc9f0', '#7cf06a', '#ffd23f', '#b072e0', '#ff7a4d'];
const WALKER_SHIRT = ['#1f2430', '#2a2a35', '#3a2a3f', '#26303a', '#33283a'];
const WALKER_SKIN = ['#e0b58a', '#c98a5a', '#8a5a3a', '#f0c9a0'];
interface Walker {
  x: number; y: number; tx: number; ty: number; ptx: number; pty: number;
  ntx: number; nty: number; hair: string; shirt: string; skin: string; speed: number; phase: number;
}
function pickNextTile(w: Walker, walkable: Set<string>): void {
  const cands = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ tx: w.tx + dx, ty: w.ty + dy }))
    .filter((c) => walkable.has(`${c.tx},${c.ty}`));
  if (cands.length === 0) return;
  const forward = cands.filter((c) => !(c.tx === w.ptx && c.ty === w.pty));
  const pool = forward.length ? forward : cands;
  const next = pool[Math.floor(Math.random() * pool.length)];
  w.ptx = w.tx; w.pty = w.ty; w.ntx = next.tx; w.nty = next.ty;
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
function buildStaticWorld(
  plan: TownPlan,
  sheets: Record<SheetName, HTMLImageElement>,
  theme: MapTheme,
): HTMLCanvasElement {
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
  // blit a sprite at SPR with its bottom-centre at (footCx, footY) world px
  const blitFoot = (s: AtlasSprite, footCx: number, footY: number, scale = SPR) => {
    const w = s.rect.w * scale;
    const h = s.rect.h * scale;
    ctx.drawImage(sheets[s.sheet], s.rect.x, s.rect.y, s.rect.w, s.rect.h, Math.round(footCx - w / 2), Math.round(footY - h), Math.round(w), Math.round(h));
  };

  // 1. Ground — grass sampled at 8px sub-cells with two noise octaves
  for (let y = 0; y < WORLD_H * TILE; y += 8) {
    for (let x = 0; x < WORLD_W * TILE; x += 8) {
      const n = valueNoise(x / 88, y / 88) * 0.7 + valueNoise(x / 26 + 9, y / 26 + 9) * 0.3;
      const shade = n < 0.36 ? GRASS[0] : n < 0.58 ? GRASS[1] : n < 0.8 ? GRASS[2] : GRASS[3];
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
      if (h > 0.975) px(tx * TILE + ox, ty * TILE + oy, 2, 2, theme.wildFlowers[Math.floor(h * 1000) % theme.wildFlowers.length]);
    }
  }

  // 2. Dirt roads + walkways
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
  for (let tx = 0; tx < WORLD_W; tx++) { drawDirt(tx, ROAD_Y); drawDirt(tx, ROAD_Y + 1); }
  for (let ty = 0; ty < WORLD_H; ty++) { drawDirt(ROAD_X, ty); drawDirt(ROAD_X + 1, ty); }
  plan.paving.forEach((p) => drawDirt(p.tx, p.ty));

  // 3. Cobblestone town square
  for (let ty = 0; ty < WORLD_H; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      if (!inPlaza(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      px(x, y, TILE, TILE, theme.cobbleGrout);
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const h = hash2(tx * 2 + sx, ty * 2 + sy);
          const tone = h < 0.22 ? theme.cobbleDark : h > 0.86 ? theme.cobbleLight : theme.cobble;
          px(x + sx * 8 + 1, y + sy * 8 + 1, 6, 6, tone);
        }
    }
  }

  // 3b. Roundabout + central tree (sprite)
  {
    const cxp = (ROAD_X + 1) * TILE;
    const cyp = (ROAD_Y + 1) * TILE;
    ell(cxp, cyp, 30, 27, theme.cobbleDark);
    ell(cxp, cyp, 26, 23, theme.cobbleGrout);
    ell(cxp, cyp, 23, 20, GRASS[2]);
    for (let a = 0; a < 12; a++) {
      const ang = a * 2.399;
      const rr = 6 + (a % 3) * 5;
      px(Math.round(cxp + Math.cos(ang) * rr), Math.round(cyp + Math.sin(ang) * rr * 0.9), 2, 2, theme.gardenFlowers[a % theme.gardenFlowers.length]);
    }
    ell(cxp, cyp + 6, 14, 5, 'rgba(20,35,20,0.22)');
    blitFoot(PROPS.tree, cxp, cyp + 9, SPR * 1.5);
  }

  // 4. Flower gardens
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
    for (let fy = 5; fy < h - 4; fy += 7)
      for (let fx = 5; fx < w - 4; fx += 7) {
        const r = hash2(g.seed + fx * 3, g.seed + fy * 3);
        if (r < 0.38) continue;
        px(x + fx, y + fy + 3, 3, 2, theme.tree.leafDark);
        px(x + fx, y + fy, 3, 3, theme.gardenFlowers[Math.floor(r * 97) % theme.gardenFlowers.length]);
        px(x + fx + 1, y + fy + 1, 1, 1, '#ffffff');
      }
  });

  // 4b. Bushes + lamps on open grass
  const occupied = new Set<string>();
  const mark = (tx0: number, ty0: number, w: number, h: number) => {
    for (let yy = ty0 - 1; yy < ty0 + h + 1; yy++)
      for (let xx = tx0 - 1; xx < tx0 + w + 1; xx++) occupied.add(`${xx},${yy}`);
  };
  plan.buildings.forEach((bd) => mark(bd.tx, bd.ty, bd.tw, bd.th));
  plan.gardens.forEach((gd) => mark(gd.tx, gd.ty, gd.tw, gd.th));
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
  for (const q of plan.quarters)
    for (let ty = q.ty; ty < q.ty + q.th; ty++)
      for (let tx = q.tx; tx < q.tx + q.tw; tx++) {
        if (isRoad(tx, ty) || inPlaza(tx, ty) || occupied.has(`${tx},${ty}`)) continue;
        if (hash2(tx * 5 + 1, ty * 5 + 3) > 0.9) { bush(tx * TILE + 8, ty * TILE + 10); occupied.add(`${tx},${ty}`); }
      }
  for (let ty = 5; ty < WORLD_H - 4; ty += 9)
    if (Math.abs(ty - ROAD_Y) > PLAZA_R + 1) { lamp((ROAD_X - 1) * TILE + 6, ty * TILE + 14); lamp((ROAD_X + 2) * TILE + 10, ty * TILE + 14); }
  for (let tx = 5; tx < WORLD_W - 4; tx += 9)
    if (Math.abs(tx - ROAD_X) > PLAZA_R + 1) { lamp(tx * TILE + 8, (ROAD_Y - 1) * TILE + 6); lamp(tx * TILE + 8, (ROAD_Y + 2) * TILE + 14); }

  // 5. Buildings + trees, depth-sorted by foot Y, with grounding shadows
  type D = { foot: number; kind: 'b'; b: PlacedBuilding } | { foot: number; kind: 't'; t: PlacedTree };
  const draws: D[] = [
    ...plan.buildings.map((b) => ({ foot: b.ty + b.th, kind: 'b' as const, b })),
    ...plan.trees.map((t) => ({ foot: t.ty + t.th, kind: 't' as const, t })),
  ].sort((a, b) => a.foot - b.foot);

  draws.forEach((d) => {
    if (d.kind === 'b') {
      const bd = d.b;
      const footCx = (bd.tx + bd.tw / 2) * TILE;
      const footY = (bd.ty + bd.th) * TILE;
      ell(footCx, footY - 2, (bd.tw / 2) * TILE * 0.85, 4, 'rgba(20,35,20,0.24)');
      blitFoot(bd.sprite, footCx, footY);
    } else {
      const t = d.t;
      blitFoot(t.sprite, (t.tx + 1) * TILE, (t.ty + t.th) * TILE);
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
  const [sheets, setSheets] = useState<Record<SheetName, HTMLImageElement> | null>(null);
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
    () => (sheets ? buildStaticWorld(plan, sheets, theme) : null),
    [plan, sheets, theme],
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
      if (!set.has(k)) { set.add(k); list.push({ tx, ty }); }
    };
    for (let ty = 1; ty < WORLD_H - 1; ty++)
      for (let tx = 1; tx < WORLD_W - 1; tx++)
        if (isRoad(tx, ty) || inPlaza(tx, ty)) add(tx, ty);
    plan.paving.forEach((p) => add(p.tx, p.ty));
    return { set, list };
  }, [plan]);

  const cameraRef = useRef({ x: (WORLD_W * TILE * SCALE) / 2, y: (WORLD_H * TILE * SCALE) / 2 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; camX: number; camY: number; moved: boolean } | null>(null);
  const walkersRef = useRef<Walker[]>([]);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    loadAllSheets().then(setSheets).catch(console.error);
  }, []);

  useEffect(() => {
    const { list } = walkable;
    if (list.length === 0) { walkersRef.current = []; return; }
    const count = Math.max(8, Math.min(18, Math.floor(list.length / 12)));
    const ws: Walker[] = [];
    for (let i = 0; i < count; i++) {
      const t = list[Math.floor(Math.random() * list.length)];
      ws.push({
        x: (t.tx + 0.5) * TILE, y: (t.ty + 0.9) * TILE, tx: t.tx, ty: t.ty, ptx: t.tx, pty: t.ty, ntx: t.tx, nty: t.ty,
        hair: WALKER_HAIR[i % WALKER_HAIR.length], shirt: WALKER_SHIRT[i % WALKER_SHIRT.length], skin: WALKER_SKIN[i % WALKER_SKIN.length],
        speed: 11 + Math.random() * 9, phase: Math.random() * 6.28,
      });
    }
    walkersRef.current = ws;
  }, [walkable]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as Window & { __pixelCityDebug?: unknown }).__pixelCityDebug = { plan, cameraRef, size, scale: SCALE, tile: TILE };
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
      return { x: Math.max(0, Math.min(x, Math.max(0, maxX))), y: Math.max(0, Math.min(y, Math.max(0, maxY))) };
    },
    [size.w, size.h],
  );

  useEffect(() => {
    if (size.w === 0) return;
    // Frame between the player's venues and the town square so buildings are
    // in view on open (not just the empty plaza).
    const vs = plan.buildings.filter((b) => b.venue);
    let cxTile = ROAD_X + 1;
    let cyTile = ROAD_Y + 1;
    if (vs.length) {
      const ax = vs.reduce((s, b) => s + b.tx + b.tw / 2, 0) / vs.length;
      const ay = vs.reduce((s, b) => s + b.ty + b.th / 2, 0) / vs.length;
      cxTile = (ax + ROAD_X + 1) / 2;
      cyTile = (ay + ROAD_Y + 1) / 2;
    }
    cameraRef.current = clampCamera(cxTile * TILE * SCALE - size.w / 2, cyTile * TILE * SCALE - size.h / 2);
  }, [size.w, size.h, clampCamera, plan]);

  const screenToTile = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const wx = (clientX - rect.left + cameraRef.current.x) / SCALE;
    const wy = (clientY - rect.top + cameraRef.current.y) / SCALE;
    return { tx: wx / TILE, ty: wy / TILE };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch { /* best-effort */ }
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y, moved: false };
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
        (b) => b.venue && pos.tx >= b.tx && pos.tx <= b.tx + b.tw && pos.ty >= b.ty - 1.5 && pos.ty <= b.ty + b.th,
      );
      if (hitBuilding?.venue && onVenueClick) { haptics.light(); soundManager.playClick(); onVenueClick(hitBuilding.venue); return; }
      const quarter = plan.quarters.find(
        (q) => pos.tx >= q.tx - 1 && pos.tx <= q.tx + q.tw + 1 && pos.ty >= q.ty - 1 && pos.ty <= q.ty + q.th + 1,
      );
      if (quarter && onDistrictClick) { haptics.light(); soundManager.playClick(); onDistrictClick(quarter.district); }
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
          if (d < 0.7) { w.tx = w.ntx; w.ty = w.nty; pickNextTile(w, wset); }
          else { const v = w.speed * dt; w.x += (dx / d) * v; w.y += (dy / d) * v; w.phase += v * 0.6; }
          drawPerson(ctx, w);
        });
      }

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

      ctx.fillStyle = 'rgba(255, 220, 160, 0.04)';
      ctx.fillRect(0, 0, size.w, size.h);
      const vg = ctx.createRadialGradient(size.w / 2, size.h / 2, Math.min(size.w, size.h) * 0.42, size.w / 2, size.h / 2, Math.max(size.w, size.h) * 0.78);
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vg.addColorStop(1, 'rgba(10, 14, 20, 0.22)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    [staticWorld, size.w, size.h, plan, venuesWithShows, walkable, theme],
  );

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => { render(t); raf = requestAnimationFrame(loop); };
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
        style={{ width: size.w, height: size.h, imageRendering: 'pixelated', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null; }}
      />
    </div>
  );
};

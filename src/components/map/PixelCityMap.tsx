/**
 * PixelCityMap - cozy SNES top-down TOWN renderer for the city overview.
 *
 * A street grid (dirt streets + a cobble town square) with COMPLETE SNES
 * buildings packed in rows along the streets — reads as a town, not buildings
 * on a lawn. Real pixel-art sprites (houses-sprite-sheet buildings, grasslands
 * trees; rects verified by bbox detection) composited over a procedural ground
 * in one per-city palette. Pinch / wheel / button ZOOM. The static world bakes
 * once to an offscreen canvas; only townsfolk + venue markers + signposts redraw.
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
const WORLD_W = 60;
const WORLD_H = 46;
const ROAD_X = 29; // main vertical street (2-wide: 29,30)
const ROAD_Y = 23; // main horizontal street (2-wide: 23,24)
const PLAZA_R = 3;

// Street grid — every street is 2 tiles wide (s, s+1). The mains are in here.
const STREET_V = [7, 18, ROAD_X, 40, 51];
const STREET_H = [6, 14, ROAD_Y, 32, 40];

const ZOOM_MIN = 1.3;
const ZOOM_MAX = 5;
const ZOOM_DEFAULT = 2.4;
const SPR = 0.6; // sprite draw-scale into the world

const streetColSet = new Set<number>();
STREET_V.forEach((s) => { streetColSet.add(s); streetColSet.add(s + 1); });
const streetRowSet = new Set<number>();
STREET_H.forEach((s) => { streetRowSet.add(s); streetRowSet.add(s + 1); });
const isStreetCol = (tx: number) => streetColSet.has(tx);
const isStreetRow = (ty: number) => streetRowSet.has(ty);
const isStreet = (tx: number, ty: number) => isStreetCol(tx) || isStreetRow(ty);

function inPlaza(tx: number, ty: number): boolean {
  return Math.abs(tx - (ROAD_X + 0.5)) <= PLAZA_R && Math.abs(ty - (ROAD_Y + 0.5)) <= PLAZA_R;
}

interface TreePalette { bark: string; barkDark: string; leafDark: string; leaf: string; leafLight: string }
interface MapTheme {
  grass: string[]; grassBlade: string; grassShade: string;
  path: string; pathLight: string; pathSpeck: string; pathDark: string;
  cobble: string; cobbleLight: string; cobbleDark: string; cobbleGrout: string;
  soil: string; soilDark: string; gardenFlowers: string[]; wildFlowers: string[];
  tree: TreePalette; roofMix: BuildingKey[]; void: string;
  streetPaved: boolean; // cobblestone streets (urban) vs dirt
  waterfront: boolean; // draw water along the south edge
  water: string; waterLight: string; waterDark: string; sand: string;
}

const THEMES: Record<CityThemeKey, MapTheme> = {
  home: {
    grass: ['#57933f', '#66a54c', '#77b65a', '#8ac66a'], grassBlade: '#9ad277', grassShade: '#3f7232',
    path: '#c79a5e', pathLight: '#d8ac6e', pathSpeck: '#a8814c', pathDark: '#a07843',
    cobble: '#bcae90', cobbleLight: '#ccc0a4', cobbleDark: '#a3957a', cobbleGrout: '#7a6f58',
    soil: '#7a4d2d', soilDark: '#5f3c23',
    gardenFlowers: ['#ef5a8a', '#f4cf4f', '#ffffff', '#b072e0', '#ff8c4d'], wildFlowers: ['#f4d04f', '#ffffff', '#ef6f9c', '#9c7be0'],
    tree: { bark: '#6e4a2c', barkDark: '#4f3419', leafDark: '#2f7a38', leaf: '#46974c', leafLight: '#69bb60' },
    roofMix: ['tudor', 'cottage', 'townhouse', 'stone', 'manor', 'shopAwning', 'tudor', 'cottage'], void: '#21331f',
    streetPaved: false, waterfront: false, water: '#3f9bd6', waterLight: '#62b6e6', waterDark: '#2a7cb4', sand: '#e6d3a0',
  },
  rust: {
    grass: ['#5c6535', '#6b743e', '#7a8349', '#8a9255'], grassBlade: '#9aa564', grassShade: '#474f29',
    path: '#a6824e', pathLight: '#b8945d', pathSpeck: '#7c5f37', pathDark: '#86663a',
    cobble: '#9a958c', cobbleLight: '#aea99f', cobbleDark: '#7d7970', cobbleGrout: '#544f48',
    soil: '#5e4427', soilDark: '#49351e',
    gardenFlowers: ['#d8783a', '#c9a13a', '#d0d0d0', '#a06a3a', '#e0913a'], wildFlowers: ['#c9a13a', '#cacaca', '#d8783a', '#a8b06a'],
    tree: { bark: '#5e4023', barkDark: '#422c16', leafDark: '#5e6b2c', leaf: '#8a7a30', leafLight: '#bb9a3a' },
    roofMix: ['darkHall', 'greyShop', 'manor', 'townhouse', 'stone', 'tudor', 'greyShop'], void: '#26211a',
    streetPaved: false, waterfront: false, water: '#4a7a86', waterLight: '#6a9aa4', waterDark: '#35606a', sand: '#b0a07a',
  },
  seaside: {
    grass: ['#5ea24e', '#6fb35a', '#80c468', '#93d577'], grassBlade: '#a6e188', grassShade: '#4a8440',
    path: '#e0c98e', pathLight: '#eed8a1', pathSpeck: '#c0a96a', pathDark: '#c6af74',
    cobble: '#cdc3a4', cobbleLight: '#ddd4b8', cobbleDark: '#b1a888', cobbleGrout: '#8c8468',
    soil: '#8a6a3e', soilDark: '#6e5430',
    gardenFlowers: ['#ff8cb0', '#ffe066', '#ffffff', '#7ad0e6', '#ff9e6b'], wildFlowers: ['#ffe066', '#ffffff', '#ff8cb0', '#7ad0e6'],
    tree: { bark: '#7a5530', barkDark: '#583c20', leafDark: '#2f8a48', leaf: '#46a85e', leafLight: '#6fcf7e' },
    roofMix: ['teal', 'shopAwning', 'cottage', 'stone', 'townhouse', 'tudor', 'teal'], void: '#16363f',
    streetPaved: false, waterfront: true, water: '#2bb0c0', waterLight: '#5fcdd8', waterDark: '#1d8a99', sand: '#e8d7a8',
  },
  capital: {
    grass: ['#54795a', '#638967', '#739a77', '#86ab8a'], grassBlade: '#97bb9a', grassShade: '#43614a',
    path: '#bdb7a8', pathLight: '#cfc9ba', pathSpeck: '#8e8a76', pathDark: '#9d988b',
    cobble: '#b2b4bc', cobbleLight: '#c8cad0', cobbleDark: '#94969c', cobbleGrout: '#5e6068',
    soil: '#6a5a48', soilDark: '#534639',
    gardenFlowers: ['#c98ad0', '#8ab0e0', '#ffffff', '#e0a0c0', '#9ad0c0'], wildFlowers: ['#c98ad0', '#ffffff', '#8ab0e0', '#9ad0c0'],
    tree: { bark: '#6a513a', barkDark: '#4d3a28', leafDark: '#3a7a52', leaf: '#52975f', leafLight: '#79b884' },
    roofMix: ['stone', 'arch', 'greyShop', 'townhouse', 'glassHall', 'civic', 'stone'], void: '#191c24',
    streetPaved: true, waterfront: false, water: '#3f9bd6', waterLight: '#62b6e6', waterDark: '#2a7cb4', sand: '#cfc9ba',
  },
};

const VENUE_BUILDINGS: Partial<Record<VenueType, BuildingKey>> = {
  [VenueType.BASEMENT]: 'tudor', [VenueType.HOUSE_SHOW]: 'tudor', [VenueType.GARAGE]: 'tudor',
  [VenueType.DIY_SPACE]: 'shopAwning', [VenueType.DIVE_BAR]: 'greyShop', [VenueType.PUNK_CLUB]: 'redClub',
  [VenueType.METAL_VENUE]: 'darkHall', [VenueType.WAREHOUSE]: 'glassHall', [VenueType.UNDERGROUND]: 'darkHall',
  [VenueType.THEATER]: 'civic', [VenueType.CONCERT_HALL]: 'glassHall', [VenueType.ARENA]: 'modern',
  [VenueType.FESTIVAL_GROUNDS]: 'rotunda',
};

const fpW = (s: AtlasSprite) => Math.max(1, Math.round((s.rect.w * SPR) / TILE));
const fpH = (s: AtlasSprite) => Math.max(1, Math.round((s.rect.h * SPR) / TILE));

function hash2(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(x0, y0), n10 = hash2(x0 + 1, y0), n01 = hash2(x0, y0 + 1), n11 = hash2(x0 + 1, y0 + 1);
  const a = n00 + (n10 - n00) * sx;
  const b = n01 + (n11 - n01) * sx;
  return a + (b - a) * sy;
}

interface Quarter { district: District; tx: number; ty: number; tw: number; th: number }
interface PlacedBuilding { sprite: AtlasSprite; tx: number; ty: number; tw: number; th: number; venue?: Venue; district?: District }
interface PlacedTree { sprite: AtlasSprite; tx: number; ty: number; th: number }
interface TownPlan {
  quarters: Quarter[];
  buildings: PlacedBuilding[];
  trees: PlacedTree[];
  paving: { tx: number; ty: number }[];
}

function planTown(districts: District[], venues: Venue[], roofMix: BuildingKey[]): TownPlan {
  // Quarters (for signposts + click hit-testing) — the four grid regions.
  const quarters: Quarter[] = districts.slice(0, 4).map((district) => {
    const east = district.bounds.x >= 4;
    const south = district.bounds.y >= 4;
    return {
      district,
      tx: east ? ROAD_X + 2 : 2,
      ty: south ? ROAD_Y + 2 : 2,
      tw: east ? WORLD_W - ROAD_X - 4 : ROAD_X - 3,
      th: south ? WORLD_H - ROAD_Y - 4 : ROAD_Y - 3,
    };
  });
  const districtAt = (tx: number, ty: number): District => {
    const east = tx >= ROAD_X;
    const south = ty >= ROAD_Y;
    return (
      districts.find((d) => (d.bounds.x >= 4) === east && (d.bounds.y >= 4) === south) ??
      districts[0]
    );
  };

  const buildings: PlacedBuilding[] = [];
  const trees: PlacedTree[] = [];
  const paving: { tx: number; ty: number }[] = [];
  const occ = (tx: number, ty: number) => isStreet(tx, ty) || inPlaza(tx, ty);
  const bocc = new Set<string>();
  const markB = (b: PlacedBuilding) => {
    for (let r = b.ty; r < b.ty + b.th; r++) for (let c = b.tx; c < b.tx + b.tw; c++) bocc.add(`${c},${r}`);
  };
  const fits = (tx: number, ty: number, tw: number, th: number) => {
    if (tx < 2 || tx + tw > WORLD_W - 2 || ty < 1 || ty + th > WORLD_H - 1) return false;
    for (let r = ty; r < ty + th; r++) for (let c = tx; c < tx + tw; c++) if (occ(c, r) || bocc.has(`${c},${r}`)) return false;
    return true;
  };

  // Pack a row of buildings along a street. mode 'bottom' = north side (feet at
  // the street, fronts facing it); 'top' = south side (roofs toward the street)
  // so both sides of every street are lined → dense blocks.
  const placeRow = (anchor: number, mode: 'bottom' | 'top') => {
    let tx = 3;
    while (tx < WORLD_W - 4) {
      const key = roofMix[Math.floor(hash2(tx * 7, anchor * 17) * 997) % roofMix.length];
      const sprite = BUILDINGS[key];
      const tw = fpW(sprite);
      const th = fpH(sprite);
      const ty = mode === 'bottom' ? anchor - th + 1 : anchor;
      if (!fits(tx, ty, tw, th)) { tx++; continue; }
      if (hash2(tx * 13, anchor * 31) < 0.1) {
        trees.push({ sprite: PROPS.tree, tx, ty: Math.max(0, ty), th: fpH(PROPS.tree) });
        tx += 3;
        continue;
      }
      const b: PlacedBuilding = { sprite, tx, ty, tw, th, district: districtAt(tx + (tw >> 1), ty + th) };
      buildings.push(b);
      markB(b);
      if (mode === 'bottom') paving.push({ tx: tx + Math.floor(tw / 2), ty: anchor + 1 });
      tx += tw + 1;
    }
  };
  for (const sy of STREET_H) {
    if (sy >= 5) placeRow(sy - 1, 'bottom');
    if (sy + 2 < WORLD_H - 5) placeRow(sy + 2, 'top');
  }

  // Assign venues to the buildings nearest the town square in their district.
  const cx = ROAD_X + 1;
  const cy = ROAD_Y + 1;
  for (const v of venues) {
    const cands = buildings
      .filter((b) => !b.venue && b.district?.id === v.location?.id)
      .sort((a, z) => Math.hypot(a.tx - cx, a.ty - cy) - Math.hypot(z.tx - cx, z.ty - cy));
    const b = cands[0];
    if (!b) continue;
    b.venue = v;
    b.sprite = BUILDINGS[VENUE_BUILDINGS[v.type] ?? 'cottage'];
    const nw = fpW(b.sprite);
    const nh = fpH(b.sprite);
    b.ty = b.ty + b.th - nh; // keep the same foot row
    b.tw = nw;
    b.th = nh;
  }

  // Street trees: a tidy row on the grass shoulder just south of each street.
  const overlapsBuilding = (tx: number, ty: number) =>
    buildings.some((b) => tx >= b.tx - 1 && tx <= b.tx + b.tw && ty >= b.ty && ty <= b.ty + b.th);
  for (const sy of STREET_H) {
    const row = sy + 2;
    if (row >= WORLD_H - 3) continue;
    for (let tx = 4; tx < WORLD_W - 3; tx += 5) {
      if (isStreet(tx, row) || inPlaza(tx, row) || overlapsBuilding(tx, row)) continue;
      trees.push({ sprite: PROPS.treeB, tx, ty: row, th: fpH(PROPS.treeB) });
    }
  }

  // Periphery greenery — a leafy frame outside the street grid.
  for (let tx = 1; tx < WORLD_W - 2; tx += 3) {
    trees.push({ sprite: hash2(tx, 0) < 0.5 ? PROPS.tree : PROPS.treeB, tx, ty: 0, th: fpH(PROPS.tree) });
    trees.push({ sprite: hash2(tx, 9) < 0.5 ? PROPS.tree : PROPS.treeB, tx, ty: WORLD_H - 4, th: fpH(PROPS.tree) });
  }

  return { quarters, buildings, trees, paving };
}

// --- Wandering townsfolk -----------------------------------------------------
const WALKER_HAIR = ['#f72585', '#4cc9f0', '#7cf06a', '#ffd23f', '#b072e0', '#ff7a4d'];
const WALKER_SHIRT = ['#1f2430', '#2a2a35', '#3a2a3f', '#26303a', '#33283a'];
const WALKER_SKIN = ['#e0b58a', '#c98a5a', '#8a5a3a', '#f0c9a0'];
interface Walker { x: number; y: number; tx: number; ty: number; ptx: number; pty: number; ntx: number; nty: number; hair: string; shirt: string; skin: string; speed: number; phase: number }
function pickNextTile(w: Walker, walkable: Set<string>): void {
  const cands = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ tx: w.tx + dx, ty: w.ty + dy }))
    .filter((c) => walkable.has(`${c.tx},${c.ty}`));
  if (cands.length === 0) return;
  const fwd = cands.filter((c) => !(c.tx === w.ptx && c.ty === w.pty));
  const pool = fwd.length ? fwd : cands;
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
function buildStaticWorld(plan: TownPlan, sheets: Record<SheetName, HTMLImageElement>, theme: MapTheme): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W * TILE;
  cv.height = WORLD_H * TILE;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const GRASS = theme.grass;
  const px = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const blitFoot = (s: AtlasSprite, footCx: number, footY: number, scale = SPR) => {
    const w = s.rect.w * scale, h = s.rect.h * scale;
    ctx.drawImage(sheets[s.sheet], s.rect.x, s.rect.y, s.rect.w, s.rect.h, Math.round(footCx - w / 2), Math.round(footY - h), Math.round(w), Math.round(h));
  };

  // 1. Grass ground (8px sub-cells, two-octave noise)
  for (let y = 0; y < WORLD_H * TILE; y += 8)
    for (let x = 0; x < WORLD_W * TILE; x += 8) {
      const n = valueNoise(x / 88, y / 88) * 0.7 + valueNoise(x / 26 + 9, y / 26 + 9) * 0.3;
      px(x, y, 8, 8, n < 0.36 ? GRASS[0] : n < 0.58 ? GRASS[1] : n < 0.8 ? GRASS[2] : GRASS[3]);
    }
  for (let ty = 0; ty < WORLD_H; ty++)
    for (let tx = 0; tx < WORLD_W; tx++) {
      const h = hash2(tx, ty);
      const ox = (h * 11) % (TILE - 3), oy = (h * 27) % (TILE - 3);
      if (h > 0.74) px(tx * TILE + ox, ty * TILE + oy + 2, 2, 2, theme.grassBlade);
      else if (h < 0.1) px(tx * TILE + oy, ty * TILE + ox + 1, 2, 2, theme.grassShade);
      if (h > 0.975) px(tx * TILE + ox, ty * TILE + oy, 2, 2, theme.wildFlowers[Math.floor(h * 1000) % theme.wildFlowers.length]);
    }

  // 1b. Seaside waterfront along the south edge (sand transition + water)
  if (theme.waterfront) {
    const wy0 = (WORLD_H - 3) * TILE;
    px(0, wy0 - 6, WORLD_W * TILE, 6, theme.sand);
    for (let y = wy0; y < WORLD_H * TILE; y += 4)
      for (let x = 0; x < WORLD_W * TILE; x += 4) {
        const h = hash2(x + 7, y + 3);
        px(x, y, 4, 4, h < 0.3 ? theme.waterDark : h > 0.82 ? theme.waterLight : theme.water);
      }
  }

  // 2. Street grid (dirt or cobble per city) + doorstep paving
  const pavingSet = new Set(plan.paving.map((p) => `${p.tx},${p.ty}`));
  const isPaved = (tx: number, ty: number) => isStreet(tx, ty) || pavingSet.has(`${tx},${ty}`);
  const drawStreet = (tx: number, ty: number) => {
    if (inPlaza(tx, ty)) return;
    const x = tx * TILE, y = ty * TILE;
    if (theme.streetPaved) {
      px(x, y, TILE, TILE, theme.cobbleGrout);
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const h = hash2(tx * 2 + sx + 99, ty * 2 + sy + 99);
          px(x + sx * 8 + 1, y + sy * 8 + 1, 6, 6, h < 0.22 ? theme.cobbleDark : h > 0.86 ? theme.cobbleLight : theme.cobble);
        }
      if (!isPaved(tx, ty - 1)) px(x, y, TILE, 1, theme.cobbleDark);
      if (!isPaved(tx, ty + 1)) px(x, y + TILE - 1, TILE, 1, theme.cobbleDark);
      if (!isPaved(tx - 1, ty)) px(x, y, 1, TILE, theme.cobbleDark);
      if (!isPaved(tx + 1, ty)) px(x + TILE - 1, y, 1, TILE, theme.cobbleDark);
    } else {
      px(x, y, TILE, TILE, theme.path);
      const h = hash2(tx * 7, ty * 13);
      if (h > 0.5) px(x + ((h * 73) % 11), y + ((h * 131) % 11), 3, 2, theme.pathLight);
      if (h < 0.42) px(x + ((h * 251) % 12), y + ((h * 313) % 12), 2, 2, theme.pathSpeck);
      // stone sidewalk curb where the street meets grass
      if (!isPaved(tx, ty - 1)) { px(x, y, TILE, 3, theme.cobble); px(x, y, TILE, 1, theme.cobbleDark); }
      if (!isPaved(tx, ty + 1)) { px(x, y + TILE - 3, TILE, 3, theme.cobble); px(x, y + TILE - 1, TILE, 1, theme.cobbleDark); }
      if (!isPaved(tx - 1, ty)) { px(x, y, 3, TILE, theme.cobble); px(x, y, 1, TILE, theme.cobbleDark); }
      if (!isPaved(tx + 1, ty)) { px(x + TILE - 3, y, 3, TILE, theme.cobble); px(x + TILE - 1, y, 1, TILE, theme.cobbleDark); }
    }
  };
  for (let ty = 0; ty < WORLD_H; ty++)
    for (let tx = 0; tx < WORLD_W; tx++)
      if (isStreet(tx, ty)) drawStreet(tx, ty);
  plan.paving.forEach((p) => drawStreet(p.tx, p.ty));

  // 3. Cobblestone town square
  for (let ty = 0; ty < WORLD_H; ty++)
    for (let tx = 0; tx < WORLD_W; tx++) {
      if (!inPlaza(tx, ty)) continue;
      const x = tx * TILE, y = ty * TILE;
      px(x, y, TILE, TILE, theme.cobbleGrout);
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const h = hash2(tx * 2 + sx, ty * 2 + sy);
          px(x + sx * 8 + 1, y + sy * 8 + 1, 6, 6, h < 0.22 ? theme.cobbleDark : h > 0.86 ? theme.cobbleLight : theme.cobble);
        }
    }
  // roundabout + central tree
  {
    const cxp = (ROAD_X + 1) * TILE, cyp = (ROAD_Y + 1) * TILE;
    ell(cxp, cyp, 30, 27, theme.cobbleDark);
    ell(cxp, cyp, 26, 23, theme.cobbleGrout);
    ell(cxp, cyp, 23, 20, GRASS[2]);
    for (let a = 0; a < 12; a++) {
      const ang = a * 2.399, rr = 6 + (a % 3) * 5;
      px(Math.round(cxp + Math.cos(ang) * rr), Math.round(cyp + Math.sin(ang) * rr * 0.9), 2, 2, theme.gardenFlowers[a % theme.gardenFlowers.length]);
    }
    ell(cxp, cyp + 6, 14, 5, 'rgba(20,35,20,0.22)');
    blitFoot(PROPS.tree, cxp, cyp + 9, SPR * 1.5);

    // a little gig stage in front of the town tree (the scene's beating heart)
    const sx = cxp;
    const sy = cyp + 28;
    px(sx - 14, sy + 1, 28, 2, 'rgba(20,35,20,0.25)'); // shadow
    px(sx - 16, sy - 5, 32, 6, '#7a5230'); // deck
    px(sx - 16, sy - 5, 32, 2, '#9a6e40'); // deck highlight
    px(sx - 16, sy + 1, 32, 1, '#553418');
    px(sx - 15, sy + 2, 2, 3, '#4a2f15');
    px(sx + 13, sy + 2, 2, 3, '#4a2f15');
    // banner on poles
    px(sx - 15, sy - 19, 1, 14, '#6e4a2c');
    px(sx + 14, sy - 19, 1, 14, '#6e4a2c');
    px(sx - 14, sy - 19, 28, 5, '#f72585');
    px(sx - 14, sy - 19, 28, 1, '#ff9ecb');
    // amp stacks
    const stageAmp = (ax: number) => {
      px(ax - 3, sy - 9, 7, 9, '#15151a');
      px(ax - 2, sy - 8, 5, 4, '#2a2a32');
      ctx.fillStyle = '#3a3a44';
      ctx.beginPath();
      ctx.ellipse(ax, sy - 6, 1.6, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    stageAmp(sx - 11);
    stageAmp(sx + 11);
    // mic stand
    px(sx, sy - 9, 1, 8, '#9a9aa0');
    ctx.fillStyle = '#c0c0c8';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 10, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3c. Crosswalks on the main streets at the four approaches to the square
  {
    const CW = 'rgba(240,240,230,0.8)';
    [ROAD_Y - 3, ROAD_Y + 4].forEach((ty) => {
      if (ty < 1 || ty >= WORLD_H) return;
      for (let i = 0; i < 5; i++) px(ROAD_X * TILE + i * 7 + 1, ty * TILE + 4, 3, 9, CW);
    });
    [ROAD_X - 3, ROAD_X + 4].forEach((tx) => {
      if (tx < 1 || tx >= WORLD_W) return;
      for (let i = 0; i < 5; i++) px(tx * TILE + 4, ROAD_Y * TILE + i * 7 + 1, 9, 3, CW);
    });
  }

  // 4. Bushes on leftover grass + lamps along the streets
  const occupied = new Set<string>();
  const mark = (tx0: number, ty0: number, w: number, h: number) => {
    for (let yy = ty0 - 1; yy < ty0 + h + 1; yy++)
      for (let xx = tx0 - 1; xx < tx0 + w + 1; xx++) occupied.add(`${xx},${yy}`);
  };
  plan.buildings.forEach((bd) => mark(bd.tx, bd.ty, bd.tw, bd.th));
  plan.trees.forEach((t) => mark(t.tx, t.ty, 2, 2));
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
  for (let ty = 1; ty < WORLD_H - 1; ty++)
    for (let tx = 1; tx < WORLD_W - 1; tx++) {
      if (isStreet(tx, ty) || inPlaza(tx, ty) || occupied.has(`${tx},${ty}`)) continue;
      const hv = hash2(tx * 5 + 1, ty * 5 + 3);
      if (hv > 0.93) { bush(tx * TILE + 8, ty * TILE + 10); occupied.add(`${tx},${ty}`); }
      else if (hv > 0.84) { px(tx * TILE + 4, ty * TILE + 6, 3, 3, theme.gardenFlowers[Math.floor(hv * 311) % theme.gardenFlowers.length]); px(tx * TILE + 9, ty * TILE + 9, 2, 2, theme.gardenFlowers[Math.floor(hv * 733) % theme.gardenFlowers.length]); }
    }
  // street-corner lamps
  for (const sy of STREET_H)
    for (const sx of STREET_V)
      if (!(Math.abs(sx - ROAD_X) <= 1 && Math.abs(sy - ROAD_Y) <= 1))
        lamp(sx * TILE - 3, sy * TILE - 2);

  // 5. Buildings + trees, depth-sorted, with grounding shadows
  type D = { foot: number; b?: PlacedBuilding; t?: PlacedTree };
  const draws: D[] = [
    ...plan.buildings.map((b) => ({ foot: b.ty + b.th, b })),
    ...plan.trees.map((t) => ({ foot: t.ty + t.th, t })),
  ].sort((a, z) => a.foot - z.foot);
  draws.forEach((d) => {
    if (d.b) {
      const footCx = (d.b.tx + d.b.tw / 2) * TILE;
      const footY = (d.b.ty + d.b.th) * TILE;
      ell(footCx, footY - 2, (d.b.tw / 2) * TILE * 0.85, 4, 'rgba(20,35,20,0.24)');
      blitFoot(d.b.sprite, footCx, footY);
    } else if (d.t) {
      blitFoot(d.t.sprite, (d.t.tx + 1) * TILE, (d.t.ty + d.t.th) * TILE);
    }
  });

  // 6. Music-scene props: flyers on walls everywhere, a tour van + amp at venues
  const VAN_COLORS = ['#b34a3a', '#3a6ab0', '#4a9a52', '#c9a13a', '#7a4ab0'];
  const FLYER = ['#f4d04f', '#ef5a8a', '#4cc9f0', '#ffffff'];
  const drawVan = (cx: number, foot: number, color: string) => {
    cx = Math.round(cx); foot = Math.round(foot);
    ell(cx, foot, 9, 1.6, 'rgba(0,0,0,0.2)');
    px(cx - 9, foot - 8, 18, 7, color);
    px(cx - 9, foot - 8, 18, 2, 'rgba(255,255,255,0.18)');
    px(cx - 9, foot - 2, 18, 1, '#2a2a2a');
    px(cx + 3, foot - 7, 5, 3, '#bfe6f0');
    px(cx - 6, foot - 7, 8, 3, '#9fc8d8');
    ctx.fillStyle = '#15151a';
    ctx.beginPath();
    ctx.ellipse(cx - 6, foot - 1, 2, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 5, foot - 1, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const drawAmp = (x: number, foot: number) => {
    x = Math.round(x); foot = Math.round(foot);
    ell(x, foot, 4, 1.4, 'rgba(0,0,0,0.22)');
    px(x - 3, foot - 9, 7, 9, '#15151a');
    px(x - 2, foot - 8, 5, 4, '#2a2a32');
    ctx.fillStyle = '#3a3a44';
    ctx.beginPath();
    ctx.ellipse(x, foot - 6, 1.6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    px(x - 2, foot - 3, 5, 2, '#222');
  };
  plan.buildings.forEach((b) => {
    if (hash2(b.tx * 9, b.ty * 7) > 0.66) {
      const side = hash2(b.tx, b.ty) > 0.5 ? 6 : -9;
      const fx = (b.tx + b.tw / 2) * TILE + side;
      const fy = (b.ty + b.th) * TILE - 9;
      px(fx, fy, 3, 4, FLYER[(b.tx + b.ty) % FLYER.length]);
      px(fx, fy, 3, 1, 'rgba(0,0,0,0.3)');
    }
    if (!b.venue) return;
    const cx = (b.tx + b.tw / 2) * TILE;
    const foot = (b.ty + b.th) * TILE;
    drawVan(cx - 3, foot + 9, VAN_COLORS[(b.tx * 31 + b.ty * 17) % VAN_COLORS.length]);
    drawAmp(cx + (b.tw / 2) * TILE - 1, foot - 1);
  });

  return cv;
}

export const PixelCityMap: React.FC<PixelCityMapProps> = ({ onDistrictClick, onVenueClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sheets, setSheets] = useState<Record<SheetName, HTMLImageElement> | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const districts = useGameStore((s) => s.districts);
  const venues = useGameStore((s) => s.venues);
  const scheduledShows = useGameStore((s) => s.scheduledShows);
  const themeKey = useGameStore((s) => s.cities.find((c) => c.id === s.currentCityId)?.theme ?? 'home');
  const theme = THEMES[themeKey];

  const plan = useMemo(() => planTown(districts, venues, theme.roofMix), [districts, venues, theme]);
  const staticWorld = useMemo(() => (sheets ? buildStaticWorld(plan, sheets, theme) : null), [plan, sheets, theme]);

  const venuesWithShows = useMemo(() => {
    const ids = new Set<string>();
    scheduledShows.forEach((s) => { if (s.status === 'SCHEDULED') ids.add(s.venueId); });
    return ids;
  }, [scheduledShows]);

  const walkable = useMemo(() => {
    const set = new Set<string>();
    const list: { tx: number; ty: number }[] = [];
    const add = (tx: number, ty: number) => { const k = `${tx},${ty}`; if (!set.has(k)) { set.add(k); list.push({ tx, ty }); } };
    for (let ty = 1; ty < WORLD_H - 1; ty++)
      for (let tx = 1; tx < WORLD_W - 1; tx++)
        if (isStreet(tx, ty) || inPlaza(tx, ty)) add(tx, ty);
    plan.paving.forEach((p) => add(p.tx, p.ty));
    return { set, list };
  }, [plan]);

  const zoomRef = useRef(ZOOM_DEFAULT);
  const cameraRef = useRef({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panRef = useRef<{ startX: number; startY: number; camX: number; camY: number; moved: boolean } | null>(null);
  const pinchRef = useRef<{ dist: number } | null>(null);
  const walkersRef = useRef<Walker[]>([]);
  const lastTimeRef = useRef(0);

  useEffect(() => { loadAllSheets().then(setSheets).catch(console.error); }, []);

  useEffect(() => {
    const { list } = walkable;
    if (list.length === 0) { walkersRef.current = []; return; }
    const count = Math.max(14, Math.min(30, Math.floor(list.length / 9)));
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
    if (import.meta.env.DEV) (window as Window & { __pixelCityDebug?: unknown }).__pixelCityDebug = { plan, cameraRef, zoomRef, size, tile: TILE };
  }, [plan, size]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => { const e = entries[0]; if (e) setSize({ w: e.contentRect.width, h: e.contentRect.height }); });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clampCamera = useCallback(
    (x: number, y: number) => {
      const z = zoomRef.current;
      const maxX = WORLD_W * TILE * z - size.w;
      const maxY = WORLD_H * TILE * z - size.h;
      return { x: Math.max(0, Math.min(x, Math.max(0, maxX))), y: Math.max(0, Math.min(y, Math.max(0, maxY))) };
    },
    [size.w, size.h],
  );

  // Frame between the player's venues and the square so buildings are in view.
  useEffect(() => {
    if (size.w === 0) return;
    const z = zoomRef.current;
    const vs = plan.buildings.filter((b) => b.venue);
    let cxTile = ROAD_X + 1, cyTile = ROAD_Y + 1;
    if (vs.length) {
      const ax = vs.reduce((s, b) => s + b.tx + b.tw / 2, 0) / vs.length;
      const ay = vs.reduce((s, b) => s + b.ty + b.th / 2, 0) / vs.length;
      cxTile = (ax + ROAD_X + 1) / 2;
      cyTile = (ay + ROAD_Y + 1) / 2;
    }
    cameraRef.current = clampCamera(cxTile * TILE * z - size.w / 2, cyTile * TILE * z - size.h / 2);
  }, [size.w, size.h, clampCamera, plan]);

  const zoomAt = useCallback(
    (sx: number, sy: number, factor: number) => {
      const z0 = zoomRef.current;
      const z1 = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z0 * factor));
      if (z1 === z0) return;
      const wx = (cameraRef.current.x + sx) / z0;
      const wy = (cameraRef.current.y + sy) / z0;
      zoomRef.current = z1;
      cameraRef.current = clampCamera(wx * z1 - sx, wy * z1 - sy);
    },
    [clampCamera],
  );

  const screenToTile = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const z = zoomRef.current;
    return { tx: (clientX - rect.left + cameraRef.current.x) / z / TILE, ty: (clientY - rect.top + cameraRef.current.y) / z / TILE };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch { /* best-effort */ }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      panRef.current = { startX: e.clientX, startY: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y, moved: false };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      panRef.current = null;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pt = pointersRef.current.get(e.pointerId);
      if (!pt) return;
      pt.x = e.clientX; pt.y = e.clientY;
      if (pointersRef.current.size >= 2 && pinchRef.current) {
        const [a, b] = [...pointersRef.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const rect = canvasRef.current?.getBoundingClientRect();
        const midX = (a.x + b.x) / 2 - (rect?.left ?? 0);
        const midY = (a.y + b.y) / 2 - (rect?.top ?? 0);
        if (pinchRef.current.dist > 0) zoomAt(midX, midY, dist / pinchRef.current.dist);
        pinchRef.current.dist = dist;
      } else if (panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        if (Math.abs(dx) + Math.abs(dy) > 8) panRef.current.moved = true;
        cameraRef.current = clampCamera(panRef.current.camX - dx, panRef.current.camY - dy);
      }
    },
    [clampCamera, zoomAt],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent, tap: boolean) => {
      const pan = panRef.current;
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 0) panRef.current = null;
      if (!tap || !pan || pan.moved || pinchRef.current) return;
      const pos = screenToTile(e.clientX, e.clientY);
      if (!pos) return;
      const hit = plan.buildings.find((b) => b.venue && pos.tx >= b.tx && pos.tx <= b.tx + b.tw && pos.ty >= b.ty - 1.5 && pos.ty <= b.ty + b.th);
      if (hit?.venue && onVenueClick) { haptics.light(); soundManager.playClick(); onVenueClick(hit.venue); return; }
      const q = plan.quarters.find((qu) => pos.tx >= qu.tx - 1 && pos.tx <= qu.tx + qu.tw + 1 && pos.ty >= qu.ty - 1 && pos.ty <= qu.ty + qu.th + 1);
      if (q && onDistrictClick) { haptics.light(); soundManager.playClick(); onDistrictClick(q.district); }
    },
    [plan, onDistrictClick, onVenueClick, screenToTile],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      zoomAt(e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0), e.deltaY < 0 ? 1.12 : 1 / 1.12);
    },
    [zoomAt],
  );

  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !staticWorld || size.w === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const z = zoomRef.current;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = theme.void;
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.save();
      ctx.translate(-Math.round(cameraRef.current.x), -Math.round(cameraRef.current.y));
      ctx.scale(z, z);
      ctx.drawImage(staticWorld, 0, 0);

      // warm glow around venues (gigs spilling onto the street)
      plan.buildings.forEach((b) => {
        if (!b.venue) return;
        const gx = (b.tx + b.tw / 2) * TILE;
        const gy = (b.ty + b.th / 2) * TILE;
        const pulse = 0.55 + Math.sin(time / 520 + b.tx) * 0.2;
        const rad = Math.max(b.tw, b.th) * TILE * 0.95;
        const g = ctx.createRadialGradient(gx, gy, 3, gx, gy, rad);
        g.addColorStop(0, `rgba(255, 176, 92, ${(0.2 * pulse).toFixed(2)})`);
        g.addColorStop(1, 'rgba(255, 176, 92, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
      });

      {
        const dt = Math.min(0.05, lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0);
        lastTimeRef.current = time;
        const wset = walkable.set;
        walkersRef.current.forEach((w) => {
          const tgx = (w.ntx + 0.5) * TILE, tgy = (w.nty + 0.9) * TILE;
          const dx = tgx - w.x, dy = tgy - w.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.7) { w.tx = w.ntx; w.ty = w.nty; pickNextTile(w, wset); }
          else { const v = w.speed * dt; w.x += (dx / d) * v; w.y += (dy / d) * v; w.phase += v * 0.6; }
          drawPerson(ctx, w);
        });
      }

      // chimney smoke drifting up from some houses
      plan.buildings.forEach((b) => {
        if (hash2(b.tx + 1, b.ty + 1) < 0.78) return;
        const cxs = (b.tx + b.tw * 0.72) * TILE;
        const top = b.ty * TILE + 2;
        for (let i = 0; i < 3; i++) {
          const t = ((time / 1100 + i * 0.34) % 1);
          const syp = top - t * 22;
          const sxp = cxs + Math.sin(time / 620 + i + b.tx) * (2 + t * 5);
          const r = 1.4 + t * 2.6;
          ctx.fillStyle = `rgba(208, 208, 214, ${(0.32 * (1 - t)).toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(sxp, syp, r, r, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      plan.buildings.forEach((b) => {
        if (!b.venue) return;
        const cx = (b.tx + b.tw / 2) * TILE;
        const my = (b.ty - 0.5) * TILE + Math.sin(time / 280) * 2;
        if (venuesWithShows.has(b.venue.id)) {
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
        const y = Math.max(2, (q.ty - 1)) * TILE;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.82)';
        ctx.fillRect(cx - w / 2, y, w, 14);
        ctx.strokeStyle = q.district.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - w / 2 + 0.5, y + 0.5, w - 1, 13);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, cx - w / 2 + 6, y + 7.5);
      });

      ctx.restore();

      // golden-hour grade: warm top light → cooler base, plus soft vignette
      const grade = ctx.createLinearGradient(0, 0, 0, size.h);
      grade.addColorStop(0, 'rgba(255, 212, 148, 0.10)');
      grade.addColorStop(0.55, 'rgba(255, 208, 150, 0.035)');
      grade.addColorStop(1, 'rgba(70, 46, 92, 0.07)');
      ctx.fillStyle = grade;
      ctx.fillRect(0, 0, size.w, size.h);
      const vg = ctx.createRadialGradient(size.w / 2, size.h / 2, Math.min(size.w, size.h) * 0.45, size.w / 2, size.h / 2, Math.max(size.w, size.h) * 0.8);
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vg.addColorStop(1, 'rgba(12, 10, 22, 0.24)');
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
  const zoomBtn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8, border: '1px solid #374151', background: 'rgba(17,24,39,0.9)',
    color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={Math.max(1, Math.round(size.w * dpr))}
        height={Math.max(1, Math.round(size.h * dpr))}
        style={{ width: size.w, height: size.h, imageRendering: 'pixelated', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => endPointer(e, true)}
        onPointerCancel={(e) => endPointer(e, false)}
        onWheel={handleWheel}
      />
      <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 5 }}>
        <button style={zoomBtn} aria-label="Zoom in" onClick={() => { zoomAt(size.w / 2, size.h / 2, 1.3); haptics.light(); }}>+</button>
        <button style={zoomBtn} aria-label="Zoom out" onClick={() => { zoomAt(size.w / 2, size.h / 2, 1 / 1.3); haptics.light(); }}>−</button>
      </div>
    </div>
  );
};

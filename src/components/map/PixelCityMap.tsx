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
  TERRAIN,
  TILE,
  loadAllSheets,
} from './townAtlas';
import { GENERATED_SPRITES } from './generatedAtlas';
import { MapFXLayer } from '@components/effects/MapFXLayer';
import { getCityShops, CityShop, ShopKind } from '@game/world/cityShops';
import { getCityLandmarks, metaProgressValue, CityLandmark, LandmarkKind } from '@game/world/landmarks';
import { unlockedVenues } from '@game/world/venueProgression';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';

interface PixelCityMapProps {
  onDistrictClick?: (district: District) => void;
  onVenueClick?: (venue: Venue) => void;
  onShopClick?: (shop: CityShop) => void;
  onLandmarkClick?: (landmark: CityLandmark) => void;
}

// --- Post-FX ----------------------------------------------------------------
// Neon bloom: downsample factor (higher = softer/cheaper), additive mix amount,
// and a master toggle (perf escape hatch for low-end devices).
const BLOOM_ON = true;
const BLOOM_SCALE = 3;
const BLOOM_STRENGTH = 1.1;

// --- World layout (in 16px tiles) -------------------------------------------
const WORLD_W = 60;
const WORLD_H = 46;
const ROAD_X = 30; // main vertical road (road 30,31; sidewalks 29,32)
const ROAD_Y = 27; // main horizontal road (road 27,28; sidewalks 26,29)
const PLAZA_R = 4; // roundabout footprint radius (tiles) around the crossroads

// Each street is a paved CORRIDOR: 1-tile flagstone sidewalk | 2-tile dirt road
// | 1-tile sidewalk. Townsfolk walk the sidewalks; the road centre is for looks.
// Spacing is deliberately IRREGULAR (varied gaps, not a uniform 12-tile grid) so
// the town reads hand-built, not graph paper. The central crossroads stays at
// ROAD_X/ROAD_Y; only the side streets shift, so the plaza + quarters + all
// venue/shop/landmark placement (which is plaza-relative, not grid-indexed) hold.
const STREET_V = [5, 19, ROAD_X, 43]; // gaps: 14 · 11 · 13 · 17
const STREET_H = [4, 17, ROAD_Y, 39]; // gaps: 13 · 10 · 12 · 7

const ZOOM_MIN = 1.3;
const ZOOM_MAX = 5;
const ZOOM_DEFAULT = 2.4;
const SPR = 0.6; // sprite draw-scale into the world

const roadColSet = new Set<number>();
STREET_V.forEach((s) => { roadColSet.add(s); roadColSet.add(s + 1); });
const roadRowSet = new Set<number>();
STREET_H.forEach((s) => { roadRowSet.add(s); roadRowSet.add(s + 1); });
const swColSet = new Set<number>();
STREET_V.forEach((s) => { swColSet.add(s - 1); swColSet.add(s + 2); });
const swRowSet = new Set<number>();
STREET_H.forEach((s) => { swRowSet.add(s - 1); swRowSet.add(s + 2); });
const isRoad = (tx: number, ty: number) => roadColSet.has(tx) || roadRowSet.has(ty);
const isSidewalk = (tx: number, ty: number) => !isRoad(tx, ty) && (swColSet.has(tx) || swRowSet.has(ty));
const isStreet = (tx: number, ty: number) => isRoad(tx, ty) || isSidewalk(tx, ty); // whole corridor

function inPlaza(tx: number, ty: number): boolean {
  return Math.abs(tx - (ROAD_X + 0.5)) <= PLAZA_R && Math.abs(ty - (ROAD_Y + 0.5)) <= PLAZA_R;
}

interface TreePalette { bark: string; barkDark: string; leafDark: string; leaf: string; leafLight: string }
// Per-locale coastline character: a warm sand BEACH, a working wooden HARBOR
// wharf, a muddy RIVER bank, or landlocked NONE. Keeps Detroit off the ocean
// and gives Boston/Seattle/Brooklyn docks instead of a sunbathing beach.
type ShoreKind = 'none' | 'beach' | 'harbor' | 'river';
interface MapTheme {
  grass: string[]; grassBlade: string; grassShade: string;
  path: string; pathLight: string; pathSpeck: string; pathDark: string;
  cobble: string; cobbleLight: string; cobbleDark: string; cobbleGrout: string;
  soil: string; soilDark: string; gardenFlowers: string[]; wildFlowers: string[];
  tree: TreePalette; roofMix: BuildingKey[]; void: string;
  streetPaved: boolean; // cobblestone streets (urban) vs dirt
  shore: ShoreKind; // how the south-edge coast reads per locale (see ShoreKind)
  water: string; waterLight: string; waterDark: string; sand: string;
  dock: string; dockLight: string; dockDark: string; // wharf decking for shore: 'harbor'
  tint: string; // per-city wash over the real terrain tiles (rgba)
}

// Strong Island (home) — warm suburban green; the shared base every other
// city's palette derives from via mkTheme(overrides).
const baseTheme: MapTheme = {
  grass: ['#57933f', '#66a54c', '#77b65a', '#8ac66a'], grassBlade: '#9ad277', grassShade: '#3f7232',
  path: '#c79a5e', pathLight: '#d8ac6e', pathSpeck: '#a8814c', pathDark: '#a07843',
  cobble: '#bcae90', cobbleLight: '#ccc0a4', cobbleDark: '#a3957a', cobbleGrout: '#7a6f58',
  soil: '#7a4d2d', soilDark: '#5f3c23',
  gardenFlowers: ['#ef5a8a', '#f4cf4f', '#ffffff', '#b072e0', '#ff8c4d'], wildFlowers: ['#f4d04f', '#ffffff', '#ef6f9c', '#9c7be0'],
  tree: { bark: '#6e4a2c', barkDark: '#4f3419', leafDark: '#2f7a38', leaf: '#46974c', leafLight: '#69bb60' },
  roofMix: ['tudor', 'cottage', 'townhouse', 'stone', 'manor', 'shopAwning', 'tudor', 'cottage'], void: '#21331f',
  streetPaved: false, shore: 'none', water: '#3f9bd6', waterLight: '#62b6e6', waterDark: '#2a7cb4', sand: '#e6d3a0',
  dock: '#6b4f34', dockLight: '#8a6743', dockDark: '#4a3520',
  tint: 'rgba(255,236,182,0.05)',
};
const mkTheme = (o: Partial<MapTheme>): MapTheme => ({ ...baseTheme, ...o });

// Per-city neon accent palettes for the Pixi mote overlay — each town's
// "scene energy" drifts in its own colours (newangeles magenta-purple, atlando
// candy-tropical, chicaustin gold, etc.) so the atmosphere reads per-place.
const CITY_ACCENTS: Record<CityThemeKey, number[]> = {
  home: [0xf72585, 0x4cc9f0, 0xffd23f, 0x3ad17e],
  bostland: [0x4cc9f0, 0xc4632e, 0xffd23f, 0x5a86a0],
  detroleans: [0xffd23f, 0xc49a4a, 0xff5c57, 0x6e9460],
  nasheattle: [0x4cc9f0, 0x447059, 0xb9b3d6, 0x557480],
  chicaustin: [0xffd23f, 0xa4bb52, 0xff8c4d, 0x54acc4],
  atlando: [0xff5ab0, 0x7ad0e6, 0xffd23f, 0x3ad17e],
  santampa: [0x4a814c, 0x6a8a4e, 0x4cc9f0, 0xb9b3d6],
  newangeles: [0xf72585, 0xc77dff, 0x4cc9f0, 0xffd23f],
};

// Each tour city gets a bespoke palette + terrain so it reads as its own place.
const THEMES: Record<CityThemeKey, MapTheme> = {
  home: baseTheme,
  // Boston × Portland — cool New England maritime, evergreen w/ autumn-orange tips, harbour.
  bostland: mkTheme({
    grass: ['#5a8a5e', '#4d7c54', '#41704a', '#355e3d'], grassBlade: '#7aa86c', grassShade: '#2a4d32',
    tree: { bark: '#6b4a2e', barkDark: '#48301a', leafDark: '#23533a', leaf: '#2f7048', leafLight: '#c4632e' },
    void: '#1a2630', water: '#39627a', waterLight: '#5a86a0', waterDark: '#284959', sand: '#cdbd9a',
    tint: 'rgba(108,134,158,0.13)', shore: 'harbor', streetPaved: true,
  }),
  // Detroit × New Orleans — muddy industrial olive, brass-warm wash, murky river.
  detroleans: mkTheme({
    grass: ['#779a73', '#668a66', '#577a5a', '#4a6b4e'], grassBlade: '#8aab7e', grassShade: '#384f3a',
    tree: { bark: '#6a5236', barkDark: '#473521', leafDark: '#2c5238', leaf: '#46714a', leafLight: '#6e9460' },
    void: '#1d2a1c', water: '#5a6e58', waterLight: '#76896c', waterDark: '#44543f', sand: '#9a8a64',
    tint: 'rgba(196,150,74,0.13)', shore: 'river', streetPaved: true,
  }),
  // Nashville × Seattle — rainy overcast grey-green, wet dark evergreen, Puget Sound piers.
  nasheattle: mkTheme({
    grass: ['#5f7d6a', '#52715f', '#456354', '#384f44'], grassBlade: '#6e8c79', grassShade: '#2c3e36',
    tree: { bark: '#4a3a2e', barkDark: '#332720', leafDark: '#1f3a30', leaf: '#2e5343', leafLight: '#447059' },
    void: '#1b2723', water: '#3a5560', waterLight: '#557480', waterDark: '#283d46', sand: '#9aa096',
    tint: 'rgba(118,134,150,0.16)', shore: 'harbor', streetPaved: false,
  }),
  // Chicago × Austin — golden prairie, big warm sky, Lake Michigan, paved urban core.
  chicaustin: mkTheme({
    grass: ['#8a9a3c', '#79892f', '#687726', '#56641e'], grassBlade: '#a8b84f', grassShade: '#454f16',
    tree: { bark: '#6f4a26', barkDark: '#4d3217', leafDark: '#5a7a2c', leaf: '#7c9a38', leafLight: '#a4bb52' },
    void: '#2a2410', water: '#2f8aa8', waterLight: '#54acc4', waterDark: '#1f6a86', sand: '#dcc486',
    tint: 'rgba(240,186,82,0.12)', shore: 'beach', streetPaved: true,
  }),
  // Atlanta × Orlando — bright tropical greens, candy-pink wash, beachy teal water.
  atlando: mkTheme({
    grass: ['#5fbf4a', '#74cf5a', '#8bdd6a', '#a3eb7c'], grassBlade: '#bcf590', grassShade: '#3f9636',
    tree: { bark: '#9a6a3c', barkDark: '#6e4724', leafDark: '#2f9a48', leaf: '#4fbf5e', leafLight: '#86e57f' },
    gardenFlowers: ['#ff5ab0', '#ffd23f', '#ffffff', '#7ad0e6', '#ff8c4d'],
    void: '#1a3a4a', water: '#22cbd6', waterLight: '#6fe6ec', waterDark: '#16a0b0', sand: '#f2e2b0',
    tint: 'rgba(255,138,196,0.12)', shore: 'beach', streetPaved: true,
  }),
  // Tampa × SF Bay — humid swamp, grey-green fog wash, murky gulf, dirt roads.
  santampa: mkTheme({
    grass: ['#4e6b3f', '#42603a', '#395433', '#2f482b'], grassBlade: '#6a8a4e', grassShade: '#243a22',
    tree: { bark: '#4a3a26', barkDark: '#31261a', leafDark: '#1f3f2a', leaf: '#2f5e3a', leafLight: '#4a814c' },
    void: '#16241c', water: '#2f6a5e', waterLight: '#4a8c7c', waterDark: '#1f4d44', sand: '#9aa07a',
    tint: 'rgba(110,134,118,0.15)', shore: 'beach', streetPaved: false,
  }),
  // NYC × LA — cool concrete megacity, neon magenta-purple wash, harbour docks, paved.
  newangeles: mkTheme({
    grass: ['#4a8f6e', '#3f7d62', '#346b55', '#295748'], grassBlade: '#5fa67e', grassShade: '#21443a',
    cobble: '#a8a6b0', cobbleLight: '#c0bec8', cobbleDark: '#88868f', cobbleGrout: '#54525c',
    tree: { bark: '#5a4763', barkDark: '#3a2c42', leafDark: '#2a6b58', leaf: '#3d8a6c', leafLight: '#5cab7e' },
    void: '#1a1226', water: '#2f8fb0', waterLight: '#54b4cf', waterDark: '#1e6a8a', sand: '#b8b0c4',
    tint: 'rgba(196,72,210,0.13)', shore: 'harbor', streetPaved: true,
  }),
};

const VENUE_BUILDINGS: Partial<Record<VenueType, BuildingKey>> = {
  [VenueType.BASEMENT]: 'tudor', [VenueType.HOUSE_SHOW]: 'tudor', [VenueType.GARAGE]: 'tudor',
  [VenueType.DIY_SPACE]: 'shopAwning', [VenueType.DIVE_BAR]: 'greyShop', [VenueType.PUNK_CLUB]: 'redClub',
  [VenueType.METAL_VENUE]: 'darkHall', [VenueType.WAREHOUSE]: 'glassHall', [VenueType.UNDERGROUND]: 'darkHall',
  [VenueType.THEATER]: 'civic', [VenueType.CONCERT_HALL]: 'glassHall', [VenueType.ARENA]: 'modern',
  [VenueType.FESTIVAL_GROUNDS]: 'rotunda',
};

// Commerce uses the storefront sprites; civic buildings use the grander civic
// sprites (columned hall, glass market, rotunda) so they read as institutions.
const SHOP_BUILDINGS: Record<ShopKind, BuildingKey> = {
  [ShopKind.RECORD_STORE]: 'teal', [ShopKind.MUSIC_STORE]: 'teal', [ShopKind.INSTRUMENT_SHOP]: 'teal',
  [ShopKind.COFFEE_SHOP]: 'shopAwning', [ShopKind.THRIFT_STORE]: 'shopAwning',
  [ShopKind.BOOKSTORE]: 'greyShop', [ShopKind.CORNER_STORE]: 'greyShop', [ShopKind.CHAIN_STORE]: 'modern',
  [ShopKind.POLICE_STATION]: 'stone', [ShopKind.FIRE_STATION]: 'redClub', [ShopKind.HOSPITAL]: 'glassHall',
  [ShopKind.POST_OFFICE]: 'civic', [ShopKind.SCHOOL]: 'arch', [ShopKind.LIBRARY]: 'rotunda',
};

// Landmarks (Pillar B) use the grandest sprites so they read as monuments.
const LANDMARK_BUILDINGS: Record<LandmarkKind, BuildingKey> = {
  [LandmarkKind.RECORD_SHRINE]: 'redClub', [LandmarkKind.ALLAGES_HALL]: 'darkHall', [LandmarkKind.ZINE_ARCHIVE]: 'arch',
  [LandmarkKind.LABEL_HQ]: 'modern', [LandmarkKind.SPONSOR_ARENA]: 'glassHall', [LandmarkKind.BRAND_TOWER]: 'rotunda',
  [LandmarkKind.FOUNDERS_PLAQUE]: 'manor', [LandmarkKind.FIRST_STAGE]: 'redClub',
};
// Per-alignment landmark marker colour (gold DIY anchor / red sellout / white history).
const LANDMARK_ACCENT: Record<CityLandmark['alignment'], string> = { diy: '#fbbf24', corporate: '#ef4444', history: '#e5e7eb' };

// CEIL (not round): the footprint must fully contain the drawn sprite, else the
// sprite spills past its reserved tiles and overlaps the neighbouring building.
const fpW = (s: AtlasSprite) => Math.max(1, Math.ceil((s.rect.w * SPR) / TILE));
const fpH = (s: AtlasSprite) => Math.max(1, Math.ceil((s.rect.h * SPR) / TILE));

// Hand-authored live-music PROP sprites (art/sprites/town → generated atlas).
// Drawn FOOT-anchored at scale 1 (crisp, no resample) as venue-adjacent dressing.
const gp = (name: keyof typeof GENERATED_SPRITES): AtlasSprite => ({ sheet: 'generated', rect: GENERATED_SPRITES[name] });
const TOWN_PROPS = {
  pa: gp('town_pa_speaker_stack'),
  amp: gp('town_floor_amp'),
  mic: gp('town_mic_stand'),
  roadCase: gp('town_road_case'),
  cable: gp('town_cable_coil'),
  lights: gp('town_string_lights'),
  crate: gp('town_crate_stack'),
  keg: gp('town_keg_cooler'),
  guitar: gp('town_guitar_case'),
  riser: gp('town_stage_riser'),
  flyer: gp('town_flyer_pole'),
  flyerB: gp('town_flyer_pole_b'),
  board: gp('town_sandwich_board'),
  poster: gp('town_poster_wall'),
} as const;
// Gear clusters around venues; paper/board dressing along street shoulders.
const VENUE_GEAR = [
  TOWN_PROPS.pa, TOWN_PROPS.amp, TOWN_PROPS.mic, TOWN_PROPS.roadCase, TOWN_PROPS.cable,
  TOWN_PROPS.lights, TOWN_PROPS.crate, TOWN_PROPS.keg, TOWN_PROPS.guitar, TOWN_PROPS.riser,
];
const STREET_DRESS = [TOWN_PROPS.flyer, TOWN_PROPS.flyerB, TOWN_PROPS.board, TOWN_PROPS.poster];

function hash2(x: number, y: number): number {
  // Math.imul keeps the multiplies in 32-bit; the old plain `*` overflowed JS
  // float precision for larger inputs and biased the output into [0, 0.5],
  // which silently disabled every hash gate above ~0.5 (bushes, flowers, props).
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
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

// --- Dual-grid terrain transitions (rounded SNES-style seams) ---------------
// Materials, low→high priority. Each higher material is painted over the lower
// with rounded edges so two terrains never meet on a straight grid line.
const M_SIDEWALK = 1, M_ROAD = 2, M_SAND = 3, M_WATER = 4;

// The display grid is offset half a tile from the logical grid; each display
// tile reads the 4 logical cell-centres at its corners (bits TL=1 TR=2 BL=4
// BR=8 → 16 cases). Corner cases use a quarter-disc (radius = TILE/2) so the
// boundary curves through tile interiors. dgPath = the filled material shape;
// dgContour = just the grass-facing boundary curve (for the bevelled kerb).
const HT = TILE / 2;
const PI = Math.PI;
function dgPath(ctx: CanvasRenderingContext2D, key: number, ox: number, oy: number): void {
  const pie = (cx: number, cy: number, a0: number, a1: number) => { ctx.moveTo(ox + cx, oy + cy); ctx.arc(ox + cx, oy + cy, HT, a0, a1); ctx.closePath(); };
  const rect = (x: number, y: number, w: number, h: number) => ctx.rect(ox + x, oy + y, w, h);
  switch (key) {
    case 1: pie(0, 0, 0, PI / 2); break;
    case 2: pie(TILE, 0, PI / 2, PI); break;
    case 4: pie(0, TILE, -PI / 2, 0); break;
    case 8: pie(TILE, TILE, PI, 1.5 * PI); break;
    case 3: rect(0, 0, TILE, HT); break;
    case 12: rect(0, HT, TILE, HT); break;
    case 5: rect(0, 0, HT, TILE); break;
    case 10: rect(HT, 0, HT, TILE); break;
    case 6: pie(TILE, 0, PI / 2, PI); pie(0, TILE, -PI / 2, 0); break;
    case 9: pie(0, 0, 0, PI / 2); pie(TILE, TILE, PI, 1.5 * PI); break;
    case 7: rect(0, 0, TILE, TILE); pie(TILE, TILE, PI, 1.5 * PI); break;
    case 11: rect(0, 0, TILE, TILE); pie(0, TILE, -PI / 2, 0); break;
    case 13: rect(0, 0, TILE, TILE); pie(TILE, 0, PI / 2, PI); break;
    case 14: rect(0, 0, TILE, TILE); pie(0, 0, 0, PI / 2); break;
    case 15: rect(0, 0, TILE, TILE); break;
  }
}
function dgContour(ctx: CanvasRenderingContext2D, key: number, ox: number, oy: number): void {
  const arc = (cx: number, cy: number, a0: number, a1: number) => { ctx.moveTo(ox + cx + HT * Math.cos(a0), oy + cy + HT * Math.sin(a0)); ctx.arc(ox + cx, oy + cy, HT, a0, a1); };
  const line = (x0: number, y0: number, x1: number, y1: number) => { ctx.moveTo(ox + x0, oy + y0); ctx.lineTo(ox + x1, oy + y1); };
  switch (key) {
    case 1: case 14: arc(0, 0, 0, PI / 2); break;
    case 2: case 13: arc(TILE, 0, PI / 2, PI); break;
    case 4: case 11: arc(0, TILE, -PI / 2, 0); break;
    case 8: case 7: arc(TILE, TILE, PI, 1.5 * PI); break;
    case 3: case 12: line(0, HT, TILE, HT); break;
    case 5: case 10: line(HT, 0, HT, TILE); break;
    case 6: arc(TILE, 0, PI / 2, PI); arc(0, TILE, -PI / 2, 0); break;
    case 9: arc(0, 0, 0, PI / 2); arc(TILE, TILE, PI, 1.5 * PI); break;
  }
}

interface Quarter { district: District; tx: number; ty: number; tw: number; th: number }
interface PlacedBuilding { sprite: AtlasSprite; tx: number; ty: number; tw: number; th: number; venue?: Venue; shop?: CityShop; landmark?: CityLandmark; district?: District }
interface PlacedTree { sprite: AtlasSprite; tx: number; ty: number; th: number }
interface PlacedProp { sprite: AtlasSprite; tx: number; ty: number } // ty = foot row
interface ParkingLot { tx: number; ty: number; tw: number; th: number }
interface TownPlan {
  quarters: Quarter[];
  buildings: PlacedBuilding[];
  trees: PlacedTree[];
  props: PlacedProp[];
  paving: { tx: number; ty: number }[];
  parkingLots: ParkingLot[];
}

// Per-district building pools — each neighbourhood draws from a cohesive set so
// regions read distinctly (grey/slate = industrial, bright = arts, tall/grand =
// downtown, brick/stone = college) instead of the same houses everywhere.
const DISTRICT_POOLS: Record<string, BuildingKey[]> = {
  ARTS: ['redClub', 'teal', 'arch', 'shopAwning', 'manor', 'cottageTan'],
  DOWNTOWN: ['townhouse', 'glassHall', 'rotunda', 'tower', 'grandHall', 'modern', 'civic'],
  WAREHOUSE: ['modern', 'darkHall', 'glassHall', 'greyShop', 'tower', 'stone'],
  COLLEGE: ['stone', 'manor', 'tudor', 'lodge', 'civic', 'arch'],
  RESIDENTIAL: ['cottage', 'tudor', 'townhouse', 'stone', 'manor', 'cottageTan', 'lodge'],
};
// Quarter ids are stable across every city (eastside/downtown/industrial/university).
const DISTRICT_KIND: Record<string, keyof typeof DISTRICT_POOLS> = {
  eastside: 'ARTS', downtown: 'DOWNTOWN', industrial: 'WAREHOUSE', university: 'COLLEGE',
};
// Per-CITY building pools (by district id) so each town's architecture differs,
// not just its palette — New Angeles glass towers, Nasheattle timber, San Tampa
// dark swamp wood, etc. Cities not listed fall back to the generic DISTRICT_POOLS
// (home keeps the verified look that way).
const CITY_ARCHITECTURE: Partial<Record<CityThemeKey, Record<string, BuildingKey[]>>> = {
  // Home: the downtown quarter is literally named "The Strip Mall", so give it
  // low retail storefronts + a big-box anchor (it already gets a parking lot) so
  // it reads as a strip mall, not a cluster of glass high-rises. Other home
  // quarters fall through to the verified DISTRICT_POOLS look.
  home: {
    downtown: ['greyShop', 'shopAwning', 'teal', 'greyShop', 'modern', 'shopAwning'],
  },
  bostland: {
    eastside: ['redClub', 'arch', 'teal', 'shopAwning', 'townhouse', 'manor'],
    downtown: ['townhouse', 'stone', 'glassHall', 'tower', 'civic', 'rotunda'],
    industrial: ['darkHall', 'modern', 'greyShop', 'stone', 'glassHall', 'lodge'],
    university: ['stone', 'manor', 'tudor', 'arch', 'civic', 'lodge'],
  },
  detroleans: {
    eastside: ['redClub', 'teal', 'arch', 'shopAwning', 'manor'],
    downtown: ['townhouse', 'tower', 'glassHall', 'modern', 'grandHall', 'civic'],
    industrial: ['modern', 'darkHall', 'greyShop', 'tower', 'stone'],
    university: ['stone', 'manor', 'tudor', 'lodge', 'arch'],
  },
  nasheattle: {
    eastside: ['redClub', 'teal', 'arch', 'shopAwning', 'manor', 'cottageTan'],
    downtown: ['townhouse', 'glassHall', 'tower', 'grandHall', 'modern', 'civic'],
    industrial: ['darkHall', 'modern', 'greyShop', 'stone', 'tower', 'glassHall'],
    university: ['stone', 'manor', 'tudor', 'lodge', 'civic', 'arch'],
  },
  chicaustin: {
    eastside: ['redClub', 'shopAwning', 'arch', 'teal', 'townhouse'],
    downtown: ['modern', 'tower', 'glassHall', 'arch', 'greyShop', 'civic'],
    industrial: ['darkHall', 'greyShop', 'lodge', 'modern', 'townhouse'],
    university: ['stone', 'manor', 'arch', 'rotunda', 'grandHall'],
  },
  atlando: {
    eastside: ['redClub', 'arch', 'teal', 'shopAwning', 'townhouse'],
    downtown: ['tower', 'modern', 'glassHall', 'greyShop', 'rotunda'],
    industrial: ['modern', 'darkHall', 'greyShop', 'lodge'],
    university: ['stone', 'civic', 'rotunda', 'grandHall', 'manor'],
  },
  santampa: {
    eastside: ['redClub', 'darkHall', 'teal', 'shopAwning', 'arch', 'lodge'],
    downtown: ['tower', 'glassHall', 'modern', 'townhouse', 'rotunda', 'grandHall'],
    industrial: ['modern', 'darkHall', 'greyShop', 'tower', 'stone', 'glassHall'],
    university: ['stone', 'arch', 'manor', 'civic', 'tudor', 'lodge'],
  },
  newangeles: {
    eastside: ['redClub', 'teal', 'arch', 'shopAwning', 'townhouse', 'modern'],
    downtown: ['tower', 'glassHall', 'modern', 'rotunda', 'grandHall', 'civic'],
    industrial: ['modern', 'greyShop', 'darkHall', 'tower', 'glassHall', 'stone'],
    university: ['stone', 'arch', 'manor', 'civic', 'rotunda', 'townhouse'],
  },
};
const poolFor = (d: District, themeKey: CityThemeKey, fallback: BuildingKey[]): BuildingKey[] => {
  const cityPool = CITY_ARCHITECTURE[themeKey]?.[d.id];
  if (cityPool && cityPool.length) return cityPool;
  const kind = DISTRICT_KIND[d.id] ?? (d.type as keyof typeof DISTRICT_POOLS | undefined);
  return (kind && DISTRICT_POOLS[kind]) || fallback;
};

function planTown(districts: District[], venues: Venue[], roofMix: BuildingKey[], diyPoints: number, landmarks: CityLandmark[], themeKey: CityThemeKey): TownPlan {
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
    // Start each row at a varied offset so buildings DON'T line up in perfect
    // columns across rows (the biggest "graph paper" tell after the grid itself).
    let tx = 3 + ((Math.abs(anchor) * 2) % 5);
    while (tx < WORLD_W - 4) {
      const pool = poolFor(districtAt(tx, anchor), themeKey, roofMix);
      const key = pool[Math.floor(hash2(tx * 7, anchor * 17) * 997) % pool.length];
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
      // Vary the gap to the next building — usually 1 tile, sometimes a wider
      // yard/vacant lot — so blocks aren't an evenly-packed wall of facades.
      tx += tw + 1 + (hash2(tx * 3 + 1, anchor * 5 + 2) < 0.28 ? 1 + Math.floor(hash2(tx, anchor) * 2) : 0);
    }
  };
  // Reserve a parking lot fronting a central street in each quarter BEFORE
  // packing buildings, so they flow around it (open-area scans never fit a lot).
  const parkingLots: ParkingLot[] = [];
  quarters.forEach((q) => {
    const cyTile = q.ty + q.th / 2;
    const sy = STREET_H.filter((s) => s > q.ty + 2 && s < q.ty + q.th - 2)
      .sort((a, b) => Math.abs(a - cyTile) - Math.abs(b - cyTile))[0] ?? STREET_H[0];
    const lw = 5, lh = 3, ty0 = Math.max(1, sy - 2 - lh + 1);
    const clashes = (x: number) => {
      for (let c = x; c < x + lw; c++) for (let r = ty0; r < ty0 + lh; r++) if (isStreet(c, r) || inPlaza(c, r) || bocc.has(`${c},${r}`)) return true;
      return false;
    };
    let tx0 = q.tx + 2;
    while (tx0 < q.tx + q.tw - lw - 1 && clashes(tx0)) tx0++;
    if (clashes(tx0)) return;
    for (let r = ty0; r < ty0 + lh; r++) for (let c = tx0; c < tx0 + lw; c++) bocc.add(`${c},${r}`);
    parkingLots.push({ tx: tx0, ty: ty0, tw: lw, th: lh });
  });

  for (const sy of STREET_H) {
    if (sy - 2 >= 2) placeRow(sy - 2, 'bottom'); // north row, behind the north sidewalk
    if (sy + 3 < WORLD_H - 4) placeRow(sy + 3, 'top'); // south row, behind the south sidewalk
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

  // Assign landmarks (Pillar B monuments) before shops — they get a prominent
  // building near the square and re-sprite to the grandest structures.
  for (const lm of landmarks) {
    const b = buildings
      .filter((bd) => !bd.venue && !bd.shop && !bd.landmark && bd.district?.id === lm.districtId)
      .sort((a, z) => Math.hypot(a.tx - cx, a.ty - cy) - Math.hypot(z.tx - cx, z.ty - cy))[0];
    if (!b) continue;
    b.landmark = lm;
    b.sprite = BUILDINGS[LANDMARK_BUILDINGS[lm.kind]];
    const nw = fpW(b.sprite), nh = fpH(b.sprite);
    b.ty = b.ty + b.th - nh; // keep the same foot row
    b.tw = nw;
    b.th = nh;
  }

  // Assign shops (commerce / day-job sources) to the next-nearest buildings in
  // each district, re-spriting them as storefronts so they read as commerce.
  for (const shop of getCityShops(districts, { diyPoints, cityId: themeKey })) {
    const b = buildings
      .filter((bd) => !bd.venue && !bd.shop && !bd.landmark && bd.district?.id === shop.districtId)
      .sort((a, z) => Math.hypot(a.tx - cx, a.ty - cy) - Math.hypot(z.tx - cx, z.ty - cy))[0];
    if (!b) continue;
    b.shop = shop;
    b.sprite = BUILDINGS[SHOP_BUILDINGS[shop.kind]];
    const nw = fpW(b.sprite), nh = fpH(b.sprite);
    b.ty = b.ty + b.th - nh; // keep the same foot row
    b.tw = nw;
    b.th = nh;
  }

  // Street trees on the grass shoulder south of each street — IRREGULARLY spaced
  // (varied gaps, two sizes, occasional clusters + bare stretches) so the shoulder
  // reads planted-by-hand, not a stamped row every 5 tiles.
  const overlapsBuilding = (tx: number, ty: number) =>
    buildings.some((b) => tx >= b.tx - 1 && tx <= b.tx + b.tw && ty >= b.ty && ty <= b.ty + b.th);
  const freeFor = (tx: number, ty: number) => !(isStreet(tx, ty) || inPlaza(tx, ty) || overlapsBuilding(tx, ty));
  for (const sy of STREET_H) {
    const row = sy + 2;
    if (row >= WORLD_H - 3) continue;
    let tx = 4 + (Math.abs(sy) % 3);
    while (tx < WORLD_W - 3) {
      const hv = hash2(tx * 9 + 1, sy * 7 + 3);
      if (hv > 0.24 && freeFor(tx, row)) {
        const big = hv > 0.55;
        const sprite = big ? PROPS.treeB : PROPS.tree;
        trees.push({ sprite, tx, ty: row, th: fpH(sprite) });
        // a big tree sometimes gets a smaller buddy beside it → a little cluster
        if (big && hv > 0.74 && freeFor(tx + 1, row))
          trees.push({ sprite: PROPS.tree, tx: tx + 1, ty: row - (hv > 0.88 ? 1 : 0), th: fpH(PROPS.tree) });
      }
      tx += 3 + Math.floor(hash2(tx * 5, sy * 3) * 4); // step 3–6
    }
  }

  // Live-music PROP dressing: gear clusters hug each venue's frontage, and a few
  // flyer poles / sandwich boards line the street shoulders — so the scene
  // clutter concentrates where shows happen and the rest of town stays cozy.
  const props: PlacedProp[] = [];
  const propOcc = new Set<string>(trees.map((t) => `${t.tx},${t.ty}`));
  const propFree = (tx: number, ty: number) =>
    tx > 1 && ty > 1 && tx < WORLD_W - 2 && ty < WORLD_H - 2 && freeFor(tx, ty) && !propOcc.has(`${tx},${ty}`);
  const placeProp = (sprite: AtlasSprite, tx: number, ty: number) => {
    props.push({ sprite, tx, ty });
    propOcc.add(`${tx},${ty}`);
    propOcc.add(`${tx + 1},${ty}`); // reserve a little elbow room
  };
  // venue gear: 2–3 pieces on the nearest free grass around each venue foot
  // (venues sit at the dense square, so search a small box, not just the ring).
  for (const b of buildings) {
    if (!b.venue) continue;
    const cx = b.tx + b.tw / 2;
    const fy = b.ty + b.th;
    const cands: [number, number, number][] = [];
    for (let dy = -2; dy <= 4; dy++)
      for (let dx = -3; dx <= b.tw + 2; dx++) {
        const tx = b.tx + dx;
        const ty = fy + dy;
        if (propFree(tx, ty)) cands.push([tx, ty, Math.hypot(tx + 0.5 - cx, ty + 0.5 - fy)]);
      }
    cands.sort((a, z) => a[2] - z[2]);
    const want = 2 + Math.floor(hash2(b.tx * 7, b.ty * 5) * 2); // 2–3
    let placed = 0;
    for (const [tx, ty] of cands) {
      if (placed >= want) break;
      // per-venue seed + placed*2 so a venue gets a VARIED cluster, not dupes
      if (propFree(tx, ty)) { placeProp(VENUE_GEAR[(b.tx * 3 + b.ty + placed * 2) % VENUE_GEAR.length], tx, ty); placed++; }
    }
  }
  // street-shoulder paper: flyer poles + boards along the grass verge
  for (const sy of STREET_H) {
    const row = sy + 3;
    if (row >= WORLD_H - 3) continue;
    let tx = 6 + (Math.abs(sy * 3) % 6);
    while (tx < WORLD_W - 3) {
      const hv = hash2(tx * 17 + 3, sy * 13 + 1);
      if (hv > 0.66 && propFree(tx, row)) placeProp(STREET_DRESS[Math.floor(hv * 97) % STREET_DRESS.length], tx, row);
      tx += 5 + Math.floor(hash2(tx * 7, sy * 5) * 4);
    }
  }

  return { quarters, buildings, trees, props, paving, parkingLots };
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
  // strongly prefer the sidewalk; only step onto the road to cross
  const sw = pool.filter((c) => isSidewalk(c.tx, c.ty));
  const finalPool = sw.length ? sw : pool;
  const next = finalPool[Math.floor(Math.random() * finalPool.length)];
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

// --- Per-frame object drawing (depth-sorted with walkers) -------------------
const VAN_COLORS = ['#b34a3a', '#3a6ab0', '#4a9a52', '#c9a13a', '#7a4ab0'];
const FLYER = ['#f4d04f', '#ef5a8a', '#4cc9f0', '#ffffff'];
type Sheets = Record<SheetName, HTMLImageElement>;

// Pre-downsample each sprite to its on-screen size ONCE, then blit it 1:1 so a
// building pixel == a terrain-tile pixel (same chunkiness). Drawing the full-res
// sprite scaled at paint time instead made buildings look higher-res than the
// 16px terrain ("terrain zoomed out compared to the houses").
const dsCache = new Map<string, HTMLCanvasElement>();
function getDS(img: HTMLImageElement, s: AtlasSprite, scale: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(s.rect.w * scale)), h = Math.max(1, Math.round(s.rect.h * scale));
  const key = `${s.sheet}:${s.rect.x},${s.rect.y},${s.rect.w},${s.rect.h}@${w}x${h}`;
  let cv = dsCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(img, s.rect.x, s.rect.y, s.rect.w, s.rect.h, 0, 0, w, h);
    dsCache.set(key, cv);
  }
  return cv;
}
function spriteBlit(ctx: CanvasRenderingContext2D, sheets: Sheets, s: AtlasSprite, footCx: number, footY: number, scale: number) {
  const ds = getDS(sheets[s.sheet], s, scale);
  ctx.drawImage(ds, Math.round(footCx - ds.width / 2), Math.round(footY - ds.height));
}
function drawVanM(ctx: CanvasRenderingContext2D, cx: number, foot: number, color: string) {
  cx = Math.round(cx); foot = Math.round(foot);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx, foot, 9, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(cx - 9, foot - 8, 18, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - 9, foot - 8, 18, 2);
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(cx - 9, foot - 2, 18, 1);
  ctx.fillStyle = '#bfe6f0'; ctx.fillRect(cx + 3, foot - 7, 5, 3);
  ctx.fillStyle = '#9fc8d8'; ctx.fillRect(cx - 6, foot - 7, 8, 3);
  ctx.fillStyle = '#15151a'; ctx.beginPath(); ctx.ellipse(cx - 6, foot - 1, 2, 2, 0, 0, Math.PI * 2); ctx.ellipse(cx + 5, foot - 1, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
}
function drawAmpM(ctx: CanvasRenderingContext2D, x: number, foot: number) {
  x = Math.round(x); foot = Math.round(foot);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, foot, 4, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#15151a'; ctx.fillRect(x - 3, foot - 9, 7, 9);
  ctx.fillStyle = '#2a2a32'; ctx.fillRect(x - 2, foot - 8, 5, 4);
  ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.ellipse(x, foot - 6, 1.6, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222'; ctx.fillRect(x - 2, foot - 3, 5, 2);
}
function drawBuildingObj(ctx: CanvasRenderingContext2D, sheets: Sheets, b: PlacedBuilding) {
  const footCx = (b.tx + b.tw / 2) * TILE, footY = (b.ty + b.th) * TILE;
  ctx.fillStyle = 'rgba(20,35,20,0.24)'; ctx.beginPath(); ctx.ellipse(footCx, footY - 2, (b.tw / 2) * TILE * 0.85, 4, 0, 0, Math.PI * 2); ctx.fill();
  spriteBlit(ctx, sheets, b.sprite, footCx, footY, SPR);
  if (hash2(b.tx * 9, b.ty * 7) > 0.66) {
    const side = hash2(b.tx, b.ty) > 0.5 ? 6 : -9;
    const fx = footCx + side, fy = footY - 9;
    ctx.fillStyle = FLYER[(b.tx + b.ty) % FLYER.length]; ctx.fillRect(fx, fy, 3, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(fx, fy, 3, 1);
  }
  if (b.venue) {
    // park the tour van on the nearest ROAD below the venue (never the sidewalk)
    const cxr = b.tx + (b.tw >> 1);
    let vy = -1;
    for (let r = b.ty + b.th; r <= b.ty + b.th + 3 && vy < 0; r++) if (isRoad(cxr, r)) vy = r;
    if (vy >= 0) drawVanM(ctx, footCx - 3, vy * TILE + 13, VAN_COLORS[(b.tx * 31 + b.ty * 17) % VAN_COLORS.length]);
    drawAmpM(ctx, footCx + (b.tw / 2) * TILE - 1, footY - 1);
  }
}
function drawTreeObj(ctx: CanvasRenderingContext2D, sheets: Sheets, t: PlacedTree) {
  spriteBlit(ctx, sheets, t.sprite, (t.tx + 1) * TILE, (t.ty + t.th) * TILE, SPR);
}
function drawPropObj(ctx: CanvasRenderingContext2D, sheets: Sheets, p: PlacedProp) {
  // scale 1 = crisp (no resample); sprite bakes its own ground shadow
  spriteBlit(ctx, sheets, p.sprite, (p.tx + 0.5) * TILE, (p.ty + 1) * TILE, 1);
}

// --- Ground bake (terrain + streets + plaza + low props; NO buildings/trees) -
function buildGround(plan: TownPlan, sheets: Sheets, theme: MapTheme): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W * TILE;
  cv.height = WORLD_H * TILE;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const px = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const blitFoot = (s: AtlasSprite, footCx: number, footY: number, scale = SPR) => {
    const ds = getDS(sheets[s.sheet], s, scale);
    ctx.drawImage(ds, Math.round(footCx - ds.width / 2), Math.round(footY - ds.height));
  };

  // 16px tile → 16px world tile, 1:1 (crisp, no scaling)
  const tile = (s: AtlasSprite, tx: number, ty: number) =>
    ctx.drawImage(sheets[s.sheet], s.rect.x, s.rect.y, 16, 16, tx * TILE, ty * TILE, TILE, TILE);

  // 1. Grass ground — real seamless village grass tiles (variant by value-noise)
  for (let ty = 0; ty < WORLD_H; ty++)
    for (let tx = 0; tx < WORLD_W; tx++) {
      const n = valueNoise(tx / 5, ty / 5);
      tile(TERRAIN.grass[n < 0.5 ? 0 : 1], tx, ty);
      const x = tx * TILE, y = ty * TILE;
      // fine blade tufts at hashed positions (the variation lives in the 3 tile
      // variants + these blades, NOT a blocky tile-aligned tonal overlay).
      for (let k = 0; k < 4; k++) {
        const hk = hash2(tx * 7 + k * 31 + 5, ty * 11 + k * 17 + 3);
        if (hk > 0.62) px(x + (Math.floor(hk * 211) % 14) + 1, y + (Math.floor(hk * 307) % 13) + 1, 1, hk > 0.86 ? 2 : 1, hk > 0.93 ? theme.grassBlade : theme.grassShade);
      }
      const h = hash2(tx, ty);
      // occasional 3-blade clump for a bit of relief
      if (h > 0.9 && h <= 0.965) {
        const cx0 = x + 4 + (Math.floor(h * 90) % 7), cy0 = y + 9 + (Math.floor(h * 50) % 4);
        px(cx0, cy0, 1, 3, theme.grassShade); px(cx0 + 2, cy0 - 1, 1, 4, theme.grassShade); px(cx0 + 4, cy0, 1, 3, theme.grassShade); px(cx0 + 2, cy0 - 2, 1, 1, theme.grassBlade);
      }
      // wildflowers (small two-tone dots)
      if (h > 0.965) { const fc = theme.wildFlowers[Math.floor(h * 1000) % theme.wildFlowers.length]; px(x + 5, y + 7, 2, 2, fc); px(x + 5, y + 6, 1, 1, '#ffffff'); }
    }

  // 2. Logical terrain grid — the truth the dual-grid samples. Streets become a
  // SIDEWALK | ROAD | SIDEWALK corridor; the seaside south edge is SAND→WATER.
  const mat = new Uint8Array(WORLD_W * WORLD_H);
  const matAt = (tx: number, ty: number) => (tx >= 0 && ty >= 0 && tx < WORLD_W && ty < WORLD_H ? mat[ty * WORLD_W + tx] : 0);
  const setMat = (tx: number, ty: number, v: number) => { if (tx >= 0 && ty >= 0 && tx < WORLD_W && ty < WORLD_H) mat[ty * WORLD_W + tx] = v; };
  for (let ty = 0; ty < WORLD_H; ty++)
    for (let tx = 0; tx < WORLD_W; tx++) {
      if (isRoad(tx, ty)) setMat(tx, ty, M_ROAD);
      else if (isSidewalk(tx, ty)) setMat(tx, ty, M_SIDEWALK);
    }
  // South-edge coast, styled per locale (theme.shore). A beach or harbour gets a
  // 1-tile shore band (M_SAND = warm sand OR wharf decking, decided at paint) over
  // a 3-tile sea; a river is just the bank — water meets the land with no strip.
  if (theme.shore === 'beach' || theme.shore === 'harbor') {
    for (let tx = 0; tx < WORLD_W; tx++) setMat(tx, WORLD_H - 4, M_SAND);
    for (let ty = WORLD_H - 3; ty < WORLD_H; ty++)
      for (let tx = 0; tx < WORLD_W; tx++) setMat(tx, ty, M_WATER);
  } else if (theme.shore === 'river') {
    for (let ty = WORLD_H - 3; ty < WORLD_H; ty++)
      for (let tx = 0; tx < WORLD_W; tx++) setMat(tx, ty, M_WATER);
  }

  // Beach district: paint its quarter as sand, with ocean along the world-edge
  // sides it touches — so the south-shore quarter reads as a real coastline.
  const beachDist = plan.quarters.find((q) => q.district.isBeach)?.district;
  if (beachDist) {
    const east = beachDist.bounds.x >= 4;
    const south = beachDist.bounds.y >= 4;
    const x0 = east ? ROAD_X : 0, x1 = east ? WORLD_W : ROAD_X;
    const y0 = south ? ROAD_Y : 0, y1 = south ? WORLD_H : ROAD_Y;
    const built = new Set<string>();
    plan.buildings.forEach((b) => {
      for (let r = b.ty; r < b.ty + b.th; r++)
        for (let c = b.tx; c < b.tx + b.tw; c++) built.add(`${c},${r}`);
    });
    for (let ty = y0; ty < y1; ty++)
      for (let tx = x0; tx < x1; tx++) {
        if (isRoad(tx, ty) || isSidewalk(tx, ty)) continue; // keep the boardwalk streets
        const nearEdge =
          (east ? tx >= WORLD_W - 3 : tx < 3) ||
          (south ? ty >= WORLD_H - 3 : ty < 3);
        setMat(tx, ty, nearEdge && !built.has(`${tx},${ty}`) ? M_WATER : M_SAND);
      }
  }

  // Building front walks + venue driveways become sidewalk so they round & bevel
  // along with the corridor instead of being stamped squares.
  plan.buildings.forEach((b) => {
    const cxr = b.tx + (b.tw >> 1);
    const walk: number[] = [];
    let reached = false, roadR = -1;
    for (let r = b.ty + b.th; r <= b.ty + b.th + 3; r++) {
      if (inPlaza(cxr, r)) break;
      if (isRoad(cxr, r)) { reached = true; roadR = r; break; }
      if (isSidewalk(cxr, r)) { reached = true; break; }
      walk.push(r);
    }
    if (!reached) return;
    walk.forEach((r) => setMat(cxr, r, M_SIDEWALK));
    if (b.venue && roadR >= 0) for (let r = b.ty + b.th; r < roadR; r++) if (!inPlaza(cxr, r)) setMat(cxr, r, M_SIDEWALK);
  });

  // The town square = one paved SIDEWALK surface with a central grass garden
  // island, set in the mat grid so the dual-grid rounds + bevels its edges
  // seamlessly with the corridors (no hard plaza seam).
  for (let ty = ROAD_Y - 3; ty <= ROAD_Y + 4; ty++)
    for (let tx = ROAD_X - 3; tx <= ROAD_X + 4; tx++) {
      if (!inPlaza(tx, ty)) continue;
      const island = tx >= 29 && tx < 33 && ty >= 26 && ty < 30;
      setMat(tx, ty, island ? 0 : M_SIDEWALK);
    }

  // 2a. Dual-grid paint: each material drawn over the lower terrain with rounded
  // edges + a bevelled raised kerb (lit top, shadowed front face, cast shadow).
  const blit4 = (s: AtlasSprite, tx: number, ty: number) => { tile(s, tx, ty); tile(s, tx + 1, ty); tile(s, tx, ty + 1); tile(s, tx + 1, ty + 1); };
  interface LayerCfg { field: (tx: number, ty: number) => boolean; matTile?: AtlasSprite; fill?: string; rim: string; frontShadow: string; highSide?: 'material' | 'lower'; tint?: string; kerb?: boolean; varies?: boolean; planks?: boolean; plankLine?: string; plankSeam?: string }
  const paintLayer = (cfg: LayerCfg) => {
    const f = cfg.field;
    for (let ty = -1; ty < WORLD_H; ty++)
      for (let tx = -1; tx < WORLD_W; tx++) {
        const key = (f(tx, ty) ? 1 : 0) | (f(tx + 1, ty) ? 2 : 0) | (f(tx, ty + 1) ? 4 : 0) | (f(tx + 1, ty + 1) ? 8 : 0);
        if (key === 0) continue;
        const ox = tx * TILE + HT, oy = ty * TILE + HT;
        ctx.save();
        ctx.beginPath(); dgPath(ctx, key, ox, oy); ctx.clip('evenodd');
        if (cfg.fill) {
          // flat palette fill (clips cleanly to rounded edges — no cut-up tile grid)
          ctx.fillStyle = cfg.fill; ctx.fillRect(ox, oy, TILE, TILE);
          if (cfg.planks) {
            // wharf decking: vertical board joints + horizontal plank seams. Drawn
            // inside the clipped dual-grid shape, so the wood reads only on the dock.
            ctx.fillStyle = cfg.plankSeam ?? cfg.frontShadow;
            for (let bx = ox + 5; bx < ox + TILE; bx += 6) ctx.fillRect(bx, oy, 1, TILE);
            ctx.fillStyle = cfg.plankLine ?? cfg.rim;
            ctx.fillRect(ox, oy + 3, TILE, 1); ctx.fillRect(ox, oy + TILE - 4, TILE, 1);
          }
        } else if (cfg.matTile) {
          blit4(cfg.matTile, tx, ty);
        }
        if (cfg.tint) { ctx.fillStyle = cfg.tint; ctx.fillRect(ox, oy, TILE, TILE); }
        ctx.restore();
        if (key !== 15 && cfg.kerb) {
          const hiInside = cfg.highSide !== 'lower';
          // highlight along the high-side rim
          ctx.save(); ctx.beginPath();
          if (hiInside) dgPath(ctx, key, ox, oy); else { ctx.rect(ox, oy, TILE, TILE); dgPath(ctx, key, ox, oy); }
          ctx.clip('evenodd');
          ctx.beginPath(); dgContour(ctx, key, ox, oy); ctx.lineWidth = 2; ctx.strokeStyle = cfg.rim; ctx.stroke();
          ctx.restore();
          // cast shadow + dark front face on the low side
          ctx.save(); ctx.beginPath();
          if (hiInside) { ctx.rect(ox, oy, TILE, TILE); dgPath(ctx, key, ox, oy); } else dgPath(ctx, key, ox, oy);
          ctx.clip('evenodd');
          ctx.beginPath(); dgContour(ctx, key, ox, oy); ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke();
          ctx.beginPath(); dgContour(ctx, key, ox, oy); ctx.lineWidth = 1; ctx.strokeStyle = cfg.frontShadow; ctx.stroke();
          ctx.restore();
        }
      }
  };
  const isMat = (tx: number, ty: number, ...ms: number[]) => ms.includes(matAt(tx, ty));
  // sidewalk first (whole paved corridor + town square over grass), then road.
  // The plaza is part of the SIDEWALK field now, so its edges round + bevel like
  // the corridors and the garden island gets a rounded sidewalk surround.
  paintLayer({ field: (tx, ty) => isMat(tx, ty, M_SIDEWALK, M_ROAD), fill: theme.cobble, kerb: true, highSide: 'material', rim: theme.cobbleLight, frontShadow: theme.cobbleDark });
  paintLayer({ field: (tx, ty) => isMat(tx, ty, M_ROAD), matTile: TERRAIN.road, kerb: true, highSide: 'lower', rim: theme.cobbleLight, frontShadow: 'rgba(0,0,0,0.28)', tint: 'rgba(140,110,70,0.06)' });
  if (theme.shore !== 'none' || beachDist) {
    const dock = theme.shore === 'harbor'; // wooden wharf decking vs warm sand
    paintLayer({ field: (tx, ty) => isMat(tx, ty, M_SAND, M_WATER), fill: dock ? theme.dock : theme.sand, kerb: true, highSide: 'material', rim: dock ? theme.dockLight : theme.sand, frontShadow: dock ? theme.dockDark : theme.soilDark, planks: dock, plankLine: theme.dockLight, plankSeam: theme.dockDark });
    paintLayer({ field: (tx, ty) => isMat(tx, ty, M_WATER), matTile: TERRAIN.water, kerb: true, highSide: 'material', rim: theme.waterLight, frontShadow: theme.waterDark, varies: false });
  }

  // 2b. Dashed lane lines down the centre of every road (skip intersections/plaza)
  ctx.fillStyle = 'rgba(244,244,230,0.42)';
  for (const s of STREET_H) {
    const y = (s + 1) * TILE - 1;
    for (let x = 6; x < WORLD_W * TILE; x += 13) {
      const tx = Math.floor(x / TILE);
      if (roadColSet.has(tx) || inPlaza(tx, s)) continue;
      ctx.fillRect(x, y, 6, 2);
    }
  }
  for (const s of STREET_V) {
    const x = (s + 1) * TILE - 1;
    for (let y = 6; y < WORLD_H * TILE; y += 13) {
      const ty = Math.floor(y / TILE);
      if (roadRowSet.has(ty) || inPlaza(s, ty)) continue;
      ctx.fillRect(x, y, 2, 6);
    }
  }

  // 3. Town square garden — the cobble plaza + the rounded island surround are
  //    painted by the dual-grid (mat). Here we only dress the central grass island.
  {
    const ISx0 = 29, ISy0 = 26, ISw = 4, ISh = 4;     // central garden island
    const cgx = (ISx0 + ISw / 2) * TILE, cgy = (ISy0 + ISh / 2) * TILE;
    for (let ty = ISy0; ty < ISy0 + ISh; ty++) for (let tx = ISx0; tx < ISx0 + ISw; tx++) {
      const hk = hash2(tx * 7 + 3, ty * 11 + 5);
      if (hk > 0.5) px(tx * TILE + (Math.floor(hk * 97) % 13) + 1, ty * TILE + (Math.floor(hk * 61) % 13) + 1, 1, hk > 0.85 ? 2 : 1, hk > 0.9 ? theme.grassBlade : theme.grassShade);
    }
    for (let a = 0; a < 14; a++) { const ang = a * 2.399, rr = 10 + (a % 3) * 5; px(Math.round(cgx + Math.cos(ang) * rr), Math.round(cgy + Math.sin(ang) * rr * 0.85), 2, 2, theme.gardenFlowers[a % theme.gardenFlowers.length]); }
    const lampInline = (lx: number, ly: number) => { ell(lx + 1, ly + 1, 3, 1.4, 'rgba(20,30,18,0.25)'); px(lx, ly - 12, 2, 12, '#2f271e'); px(lx - 1, ly - 1, 4, 2, '#5a4a36'); ell(lx + 1, ly - 13, 6, 6, 'rgba(255,227,154,0.22)'); px(lx - 1, ly - 15, 4, 4, '#ffe39a'); };
    const benchInline = (bx: number, by: number, faceUp = false) => {
      ell(bx, by + 1, 8, 2, 'rgba(0,0,0,0.20)');
      if (!faceUp) {
        px(bx - 6, by - 2, 2, 3, '#4f3419'); px(bx + 4, by - 2, 2, 3, '#4f3419');
        px(bx - 7, by - 5, 14, 3, '#8a6238'); px(bx - 7, by - 5, 14, 1, '#a87a48');
        px(bx - 7, by - 11, 14, 2, '#7a5530');
        px(bx - 6, by - 9, 1, 4, '#6e4a2c'); px(bx - 2, by - 9, 1, 4, '#6e4a2c'); px(bx + 2, by - 9, 1, 4, '#6e4a2c'); px(bx + 5, by - 9, 1, 4, '#6e4a2c');
      } else {
        px(bx - 7, by - 9, 14, 3, '#8a6238'); px(bx - 7, by - 9, 14, 1, '#a87a48');
        px(bx - 6, by - 7, 1, 4, '#6e4a2c'); px(bx - 2, by - 7, 1, 4, '#6e4a2c'); px(bx + 2, by - 7, 1, 4, '#6e4a2c'); px(bx + 5, by - 7, 1, 4, '#6e4a2c');
        px(bx - 7, by - 4, 14, 2, '#7a5530');
        px(bx - 6, by - 3, 2, 2, '#4f3419'); px(bx + 4, by - 3, 2, 2, '#4f3419');
      }
    };
    lampInline((ISx0 - 1) * TILE + 8, (ISy0 - 1) * TILE + 14);
    lampInline((ISx0 + ISw) * TILE + 8, (ISy0 - 1) * TILE + 14);
    lampInline((ISx0 - 1) * TILE + 8, (ISy0 + ISh) * TILE + 6);
    lampInline((ISx0 + ISw) * TILE + 8, (ISy0 + ISh) * TILE + 6);
    benchInline(cgx, (ISy0 - 1) * TILE + 12); // north of the green, faces down toward it
    benchInline(cgx, (ISy0 + ISh) * TILE + 6, true); // south of the green, faces up toward it
    ell(cgx, cgy + 6, 13, 5, 'rgba(20,35,20,0.25)');
    blitFoot(PROPS.tree, cgx, cgy + 9, SPR * 1.4);
  }

  // 4. Bushes on leftover grass + lamps along the streets
  const occupied = new Set<string>();
  const mark = (tx0: number, ty0: number, w: number, h: number) => {
    for (let yy = ty0 - 1; yy < ty0 + h + 1; yy++)
      for (let xx = tx0 - 1; xx < tx0 + w + 1; xx++) occupied.add(`${xx},${yy}`);
  };
  plan.buildings.forEach((bd) => mark(bd.tx, bd.ty, bd.tw, bd.th));
  plan.trees.forEach((t) => mark(t.tx, t.ty, 2, 2));
  plan.props.forEach((p) => mark(p.tx, p.ty, 2, 2));

  // 4a. Parking lots (reserved per quarter in planTown) — asphalt + painted
  // stalls + a few parked cars; marked occupied so bushes/props avoid them.
  const drawCarStatic = (cx: number, foot: number, color: string) => {
    cx = Math.round(cx); foot = Math.round(foot);
    ell(cx, foot, 6, 1.5, 'rgba(0,0,0,0.22)');
    px(cx - 5, foot - 12, 10, 12, color);
    px(cx - 5, foot - 12, 10, 2, 'rgba(255,255,255,0.18)');
    px(cx - 4, foot - 10, 8, 3, '#bfe6f0');
    px(cx - 4, foot - 4, 8, 2, '#9fc8d8');
    px(cx - 5, foot - 6, 10, 1, 'rgba(0,0,0,0.25)');
    px(cx - 6, foot - 9, 1, 3, '#15151a'); px(cx + 5, foot - 9, 1, 3, '#15151a');
    px(cx - 6, foot - 4, 1, 3, '#15151a'); px(cx + 5, foot - 4, 1, 3, '#15151a');
  };
  plan.parkingLots.forEach((lot, qi) => {
    const lx = lot.tx * TILE, ly = lot.ty * TILE, lw = lot.tw * TILE, lh = lot.th * TILE;
    for (let r = lot.ty; r < lot.ty + lot.th; r++) for (let c = lot.tx; c < lot.tx + lot.tw; c++) { tile(TERRAIN.road, c, r); occupied.add(`${c},${r}`); }
    px(lx, ly, lw, lh, 'rgba(140,110,70,0.06)');
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);
    ctx.fillStyle = 'rgba(244,244,230,0.45)';
    for (let s = 1; s < lot.tw; s++) ctx.fillRect(lx + s * TILE, ly + 2, 1, lh - 4);
    for (let s = 0; s < lot.tw; s++) { const hh = hash2(lot.tx * 9 + s * 5, lot.ty * 7 + qi * 3); if (hh > 0.4) drawCarStatic(lx + s * TILE + TILE / 2, ly + lh - 3, VAN_COLORS[Math.floor(hh * 97) % VAN_COLORS.length]); }
  });

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
  const trashCan = (x: number, y: number) => {
    ell(x, y + 1, 3, 1.2, 'rgba(0,0,0,0.2)');
    px(x - 3, y - 7, 6, 7, '#3a4a3a');
    px(x - 3, y - 8, 6, 2, '#2a352a');
    px(x - 1, y - 9, 2, 1, '#2a352a');
    px(x - 3, y - 7, 6, 1, '#586a55');
    px(x - 2, y - 5, 1, 4, 'rgba(255,255,255,0.08)');
  };
  const hydrant = (x: number, y: number) => {
    ell(x, y + 1, 2.4, 1, 'rgba(0,0,0,0.2)');
    px(x - 2, y - 6, 4, 6, '#c0392b');
    px(x - 2, y - 7, 4, 1, '#e05545');
    px(x - 3, y - 4, 1, 2, '#9a2b20'); px(x + 2, y - 4, 1, 2, '#9a2b20');
    px(x - 2, y - 6, 4, 1, 'rgba(255,255,255,0.18)');
  };
  // A proper little park bench (backrest + slatted seat + legs). `faceUp` flips
  // it so it can face the road/plaza it sits beside, instead of every bench in
  // town facing the same way.
  const bench = (x: number, y: number, faceUp = false) => {
    ell(x, y + 1, 8, 2, 'rgba(0,0,0,0.20)');
    if (!faceUp) {
      px(x - 6, y - 2, 2, 3, '#4f3419'); px(x + 4, y - 2, 2, 3, '#4f3419'); // legs (front)
      px(x - 7, y - 5, 14, 3, '#8a6238'); px(x - 7, y - 5, 14, 1, '#a87a48'); // seat
      px(x - 7, y - 11, 14, 2, '#7a5530'); // backrest rail (back)
      px(x - 6, y - 9, 1, 4, '#6e4a2c'); px(x - 2, y - 9, 1, 4, '#6e4a2c');
      px(x + 2, y - 9, 1, 4, '#6e4a2c'); px(x + 5, y - 9, 1, 4, '#6e4a2c'); // slats
    } else {
      px(x - 7, y - 9, 14, 3, '#8a6238'); px(x - 7, y - 9, 14, 1, '#a87a48'); // seat (back)
      px(x - 6, y - 7, 1, 4, '#6e4a2c'); px(x - 2, y - 7, 1, 4, '#6e4a2c');
      px(x + 2, y - 7, 1, 4, '#6e4a2c'); px(x + 5, y - 7, 1, 4, '#6e4a2c'); // slats
      px(x - 7, y - 4, 14, 2, '#7a5530'); // backrest rail (front)
      px(x - 6, y - 3, 2, 2, '#4f3419'); px(x + 4, y - 3, 2, 2, '#4f3419'); // legs (back)
    }
  };
  const mailbox = (x: number, y: number) => {
    ell(x, y + 1, 2.4, 1, 'rgba(0,0,0,0.2)');
    px(x - 1, y - 6, 2, 6, '#2f271e');
    px(x - 3, y - 10, 6, 4, '#2a6ad0');
    px(x - 3, y - 10, 6, 1, '#4a8ae0');
    px(x + 3, y - 9, 1, 2, '#c0392b');
  };
  for (let ty = 1; ty < WORLD_H - 1; ty++)
    for (let tx = 1; tx < WORLD_W - 1; tx++) {
      if (isStreet(tx, ty) || inPlaza(tx, ty) || occupied.has(`${tx},${ty}`)) continue;
      const hv = hash2(tx * 5 + 1, ty * 5 + 3);
      if (hv > 0.93) { bush(tx * TILE + 8, ty * TILE + 10); occupied.add(`${tx},${ty}`); }
      else if (hv > 0.84) { px(tx * TILE + 4, ty * TILE + 6, 3, 3, theme.gardenFlowers[Math.floor(hv * 311) % theme.gardenFlowers.length]); px(tx * TILE + 9, ty * TILE + 9, 2, 2, theme.gardenFlowers[Math.floor(hv * 733) % theme.gardenFlowers.length]); }
    }
  // lamp posts on the sidewalk corners of intersections — hash-gated to ~55% so
  // it reads as a lived-in town, not a rigid grid of a lamp at every single corner.
  for (const sy of STREET_H)
    for (const sx of STREET_V)
      if (!(Math.abs(sx - ROAD_X) <= 2 && Math.abs(sy - ROAD_Y) <= 2) && hash2(sx * 7 + 3, sy * 7 + 5) > 0.45)
        lamp((sx - 1) * TILE + 8, (sy - 1) * TILE + 13);

  // 4b. Street furniture scattered along the sidewalks — lamps, trash cans,
  // hydrants, benches, mailboxes. Spaced out (>=2 tiles apart) so it reads as
  // tidy town clutter, not a junkyard.
  const propAt = new Set<string>();
  const nearProp = (tx: number, ty: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (propAt.has(`${tx + dx},${ty + dy}`)) return true;
    return false;
  };
  for (let ty = 1; ty < WORLD_H - 1; ty++)
    for (let tx = 1; tx < WORLD_W - 1; tx++) {
      // sidewalk tiles are never building/lot footprints (those sit at sy-2 and
      // above), so don't gate on `occupied` — its building padding covers the
      // sidewalk in front of every building and would block almost all furniture.
      if (!isSidewalk(tx, ty) || inPlaza(tx, ty)) continue;
      const h = hash2(tx * 11 + 2, ty * 13 + 7);
      if (h < 0.62 || nearProp(tx, ty)) continue;
      const x = tx * TILE + 8, base = ty * TILE + 13;
      // weighted mix — mostly lamps/cans/hydrants, benches & mailboxes are rare
      const t = Math.floor(hash2(tx * 17 + 9, ty * 5 + 1) * 100);
      if (t < 34) lamp(x, base);
      else if (t < 64) trashCan(x, base);
      else if (t < 87) hydrant(x, base);
      else if (t < 96) bench(x, base, (isRoad(tx, ty - 1) || isRoad(tx, ty - 2)) && !(isRoad(tx, ty + 1) || isRoad(tx, ty + 2)));
      else mailbox(x, base);
      propAt.add(`${tx},${ty}`);
    }

  // (Buildings, trees and their props are drawn PER-FRAME, depth-sorted with the
  // walkers, so townsfolk are correctly occluded by anything in front of them.)

  return cv;
}

export const PixelCityMap: React.FC<PixelCityMapProps> = ({ onDistrictClick, onVenueClick, onShopClick, onLandmarkClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Offscreen buffers for the neon-bloom post-FX (downsampled bright-pass).
  const fxLoRef = useRef<HTMLCanvasElement | null>(null);
  const fxLo2Ref = useRef<HTMLCanvasElement | null>(null);
  const [sheets, setSheets] = useState<Record<SheetName, HTMLImageElement> | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const districts = useGameStore((s) => s.districts);
  const allVenues = useGameStore((s) => s.venues);
  const peakReputation = useGameStore((s) => s.peakReputation);
  // Scene-growth ladder: only venues the scene has unlocked are placed on the
  // map, so the town visibly fills in (DIY rooms → the Burro → the amphitheater)
  // as reputation climbs.
  const venues = useMemo(() => unlockedVenues(allVenues, peakReputation), [allVenues, peakReputation]);
  const scheduledShows = useGameStore((s) => s.scheduledShows);
  const diyPoints = useGameStore((s) => s.diyPoints);
  const discoveredCount = useGameStore((s) => s.discoveredSynergies.length);
  const currentCityId = useGameStore((s) => s.currentCityId);
  const themeKey = useGameStore((s) => s.cities.find((c) => c.id === s.currentCityId)?.theme ?? 'home');
  const theme = THEMES[themeKey];

  // Landmarks (Pillar B) derive from alignment + in-run discoveries + cross-run
  // meta progress; their names are city-flavored. Recompute when those change.
  const landmarks = useMemo(
    () => getCityLandmarks(districts, { diyPoints, discoveredCount, cityId: currentCityId, metaProgress: metaProgressValue(metaProgressionManager.getProgression()) }),
    [districts, diyPoints, discoveredCount, currentCityId],
  );

  // diyPoints + district state (scene/gentrification) drive which establishments
  // exist, so the plan must recompute as the city evolves — keep them in deps.
  const plan = useMemo(() => planTown(districts, venues, theme.roofMix, diyPoints, landmarks, themeKey), [districts, venues, theme, diyPoints, landmarks, themeKey]);
  const ground = useMemo(() => (sheets ? buildGround(plan, sheets, theme) : null), [plan, sheets, theme]);

  // Static depth-sortable objects (buildings + trees + props); walkers merge in per-frame.
  type DepthObj =
    | { footY: number; kind: 'building'; b: PlacedBuilding }
    | { footY: number; kind: 'tree'; t: PlacedTree }
    | { footY: number; kind: 'prop'; p: PlacedProp };
  const objects = useMemo<DepthObj[]>(() => {
    const list: DepthObj[] = [];
    plan.buildings.forEach((b) => list.push({ footY: (b.ty + b.th) * TILE, kind: 'building', b }));
    plan.trees.forEach((t) => list.push({ footY: (t.ty + t.th) * TILE, kind: 'tree', t }));
    plan.props.forEach((p) => list.push({ footY: (p.ty + 1) * TILE, kind: 'prop', p }));
    return list;
  }, [plan]);

  const venuesWithShows = useMemo(() => {
    const ids = new Set<string>();
    scheduledShows.forEach((s) => { if (s.status === 'SCHEDULED') ids.add(s.venueId); });
    return ids;
  }, [scheduledShows]);

  const walkable = useMemo(() => {
    const set = new Set<string>();
    const list: { tx: number; ty: number }[] = [];
    const add = (tx: number, ty: number) => { const k = `${tx},${ty}`; if (!set.has(k)) { set.add(k); list.push({ tx, ty }); } };
    // Streets + plaza only — one connected network, no dead-end doorstep spurs.
    for (let ty = 1; ty < WORLD_H - 1; ty++)
      for (let tx = 1; tx < WORLD_W - 1; tx++)
        if (isStreet(tx, ty) || inPlaza(tx, ty)) add(tx, ty);
    return { set, list };
  }, []);

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
    const swList = list.filter((t) => isSidewalk(t.tx, t.ty));
    const spawn = swList.length ? swList : list;
    if (spawn.length === 0) { walkersRef.current = []; return; }
    const count = Math.max(14, Math.min(32, Math.floor(spawn.length / 6)));
    const ws: Walker[] = [];
    for (let i = 0; i < count; i++) {
      const t = spawn[Math.floor(Math.random() * spawn.length)];
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
      const inBldg = (b: PlacedBuilding) => pos.tx >= b.tx && pos.tx <= b.tx + b.tw && pos.ty >= b.ty - 1.5 && pos.ty <= b.ty + b.th;
      const hit = plan.buildings.find((b) => b.venue && inBldg(b));
      if (hit?.venue && onVenueClick) { haptics.light(); soundManager.playClick(); onVenueClick(hit.venue); return; }
      const lmHit = plan.buildings.find((b) => b.landmark && inBldg(b));
      if (lmHit?.landmark && onLandmarkClick) { haptics.light(); soundManager.playClick(); onLandmarkClick(lmHit.landmark); return; }
      const shopHit = plan.buildings.find((b) => b.shop && inBldg(b));
      if (shopHit?.shop && onShopClick) { haptics.light(); soundManager.playClick(); onShopClick(shopHit.shop); return; }
      const q = plan.quarters.find((qu) => pos.tx >= qu.tx - 1 && pos.tx <= qu.tx + qu.tw + 1 && pos.ty >= qu.ty - 1 && pos.ty <= qu.ty + qu.th + 1);
      if (q && onDistrictClick) { haptics.light(); soundManager.playClick(); onDistrictClick(q.district); }
    },
    [plan, onDistrictClick, onVenueClick, onShopClick, onLandmarkClick, screenToTile],
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
      if (!canvas || !ground || !sheets || size.w === 0) return;
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
      ctx.drawImage(ground, 0, 0);

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

      // advance the townsfolk (movement only; drawing is depth-sorted below)
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
        });
      }

      // depth-sorted draw: buildings, trees and townsfolk by foot Y so walkers
      // are correctly occluded by anything standing in front of them.
      const depth: Array<{ y: number; o?: DepthObj; w?: Walker }> = objects.map((o) => ({ y: o.footY, o }));
      walkersRef.current.forEach((w) => depth.push({ y: w.y, w }));
      depth.sort((a, b) => a.y - b.y);
      depth.forEach((d) => {
        if (d.w) drawPerson(ctx, d.w);
        else if (d.o!.kind === 'building') drawBuildingObj(ctx, sheets, d.o!.b);
        else if (d.o!.kind === 'tree') drawTreeObj(ctx, sheets, d.o!.t);
        else drawPropObj(ctx, sheets, d.o!.p);
      });

      plan.buildings.forEach((b) => {
        if (!b.venue) return;
        const cx = (b.tx + b.tw / 2) * TILE;
        const my = (b.ty - 0.5) * TILE + Math.sin(time / 280) * 2;
        if (venuesWithShows.has(b.venue.id)) {
          // Show tonight: warm light spills onto the street + a crowd gathers.
          const footX = (b.tx + b.tw / 2) * TILE;
          const footY = (b.ty + b.th) * TILE;
          const glow = ctx.createRadialGradient(footX, footY + 4, 2, footX, footY + 4, b.tw * TILE * 0.95);
          glow.addColorStop(0, 'rgba(255, 196, 130, 0.34)');
          glow.addColorStop(1, 'rgba(255, 196, 130, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(footX - b.tw * TILE, footY - 6, b.tw * TILE * 2, b.th * TILE * 0.7 + 12);
          const n = 5;
          for (let i = 0; i < n; i++) {
            const hx = footX + (i - (n - 1) / 2) * 5 + Math.sin(time / 420 + i * 2.1) * 1.3;
            const hy = footY + 4 + (i % 2) * 2;
            const bob = Math.sin(time / 190 + i * 1.7) * 0.8;
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            ctx.ellipse(hx, hy + 1, 2.2, 1, 0, 0, PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2a2330';
            ctx.fillRect(hx - 1, hy - 3 + bob, 3, 3);
            ctx.fillStyle = WALKER_HAIR[(b.tx + i) % WALKER_HAIR.length];
            ctx.fillRect(hx - 1, hy - 5 + bob, 3, 2);
          }
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

      // establishment markers — tap to browse that place's day jobs.
      // Commerce = cyan shopping bag; civic = gold classical-building badge.
      plan.buildings.forEach((b) => {
        if (!b.shop) return;
        const civic = b.shop.category === 'civic';
        const accent = civic ? '#f0c040' : '#06b6d4';
        const cx = (b.tx + b.tw / 2) * TILE;
        const my = (b.ty - 0.5) * TILE + Math.sin(time / 300 + b.tx) * 2;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.85)';
        ctx.fillRect(cx - 7, my - 7, 14, 14);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 7.5, my - 7.5, 15, 15);
        ctx.fillStyle = accent;
        if (civic) {
          // classical institution: pediment + columns + steps
          ctx.beginPath();
          ctx.moveTo(cx - 5, my - 1);
          ctx.lineTo(cx, my - 5);
          ctx.lineTo(cx + 5, my - 1);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(cx - 5, my - 1, 10, 1);
          ctx.fillRect(cx - 4, my, 1, 4);
          ctx.fillRect(cx - 1, my, 1, 4);
          ctx.fillRect(cx + 2, my, 1, 4);
          ctx.fillRect(cx - 5, my + 4, 10, 1);
        } else {
          // little shopping bag
          ctx.fillRect(cx - 4, my - 2, 8, 7);
          ctx.fillRect(cx - 3, my - 5, 1, 3);
          ctx.fillRect(cx + 2, my - 5, 1, 3);
          ctx.fillRect(cx - 3, my - 5, 6, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(cx - 4, my - 2, 8, 1);
        }
      });

      // landmark markers (Pillar B) — a star badge + name, coloured by alignment
      // (gold DIY anchor / red sellout monument / white scene history).
      const starPath = (sx: number, sy: number, r: number) => {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const ang = -PI / 2 + (i * PI) / 5;
          const rr = i % 2 === 0 ? r : r * 0.45;
          const px = sx + Math.cos(ang) * rr, py = sy + Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      };
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textBaseline = 'top';
      plan.buildings.forEach((b) => {
        if (!b.landmark) return;
        const accent = LANDMARK_ACCENT[b.landmark.alignment];
        const cx = (b.tx + b.tw / 2) * TILE;
        const my = (b.ty - 0.5) * TILE + Math.sin(time / 300 + b.tx) * 2;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.85)';
        ctx.fillRect(cx - 8, my - 8, 16, 16);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 8.5, my - 8.5, 17, 17);
        starPath(cx, my, 6);
        ctx.fillStyle = accent;
        ctx.fill();
        const nm = b.landmark.name.toUpperCase();
        ctx.textAlign = 'center';
        const lw = ctx.measureText(nm).width + 8;
        const ly = my + 11;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.82)';
        ctx.fillRect(cx - lw / 2, ly, lw, 11);
        ctx.strokeRect(cx - lw / 2 + 0.5, ly + 0.5, lw - 1, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(nm, cx, ly + 2.5);
        ctx.textAlign = 'left';
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

      // ── Neon bloom ──────────────────────────────────────────────────────
      // Cheap CRT-style glow: downsample the rendered frame, square it (multiply
      // by itself) to keep only the brights, then add the blurred result back.
      // Makes lit windows / venue marquees / city neon bloom without any
      // per-pixel JS — just four GPU drawImage calls at 1/3 resolution.
      if (BLOOM_ON) {
        const lw = Math.max(1, Math.round(size.w / BLOOM_SCALE));
        const lh = Math.max(1, Math.round(size.h / BLOOM_SCALE));
        let lo = fxLoRef.current;
        let lo2 = fxLo2Ref.current;
        if (!lo) lo = fxLoRef.current = document.createElement('canvas');
        if (!lo2) lo2 = fxLo2Ref.current = document.createElement('canvas');
        if (lo.width !== lw || lo.height !== lh) {
          lo.width = lo2.width = lw;
          lo.height = lo2.height = lh;
        }
        const lctx = lo.getContext('2d');
        const l2ctx = lo2.getContext('2d');
        if (lctx && l2ctx) {
          // 1. downsample the full frame
          lctx.globalCompositeOperation = 'source-over';
          lctx.globalAlpha = 1;
          lctx.imageSmoothingEnabled = true;
          lctx.clearRect(0, 0, lw, lh);
          lctx.drawImage(canvas, 0, 0, lw, lh);
          // 2. bright-pass = scene^3 (cubed: only the very brightest neon / lit
          //    windows / lamp glows survive; mid-bright pavement falls off, so we
          //    bloom the lights without hazing the whole street out).
          l2ctx.globalCompositeOperation = 'source-over';
          l2ctx.globalAlpha = 1;
          l2ctx.imageSmoothingEnabled = true;
          l2ctx.clearRect(0, 0, lw, lh);
          l2ctx.drawImage(lo, 0, 0);
          l2ctx.globalCompositeOperation = 'multiply';
          l2ctx.drawImage(lo, 0, 0);
          l2ctx.drawImage(lo, 0, 0);
          l2ctx.globalCompositeOperation = 'source-over';
          // 3. add it back, upscaled (= blurred) and additive
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = BLOOM_STRENGTH;
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(lo2, 0, 0, size.w, size.h);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.imageSmoothingEnabled = false;
        }
      }

      // per-city colour wash (ties the whole scene to the city's palette)
      ctx.fillStyle = theme.tint;
      ctx.fillRect(0, 0, size.w, size.h);

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

      // gentle day↔dusk breathing — a very slow cool wash drifts in and out
      // (~2 min cycle, capped low so the scene never actually goes dark).
      const dusk = 0.5 + Math.sin(time / 19000) * 0.5;
      ctx.fillStyle = `rgba(58, 46, 98, ${(dusk * 0.1).toFixed(3)})`;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    [ground, sheets, objects, size.w, size.h, plan, venuesWithShows, walkable, theme],
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
      {/* Pixi (WebGL) neon-mote overlay — floats above the map, below the CRT.
          Tinted to the city's palette + surges on show-nights. */}
      <MapFXLayer accents={CITY_ACCENTS[themeKey]} intensity={Math.min(1, venuesWithShows.size / 3)} />
      {/* CRT scanlines — faint horizontal rule overlay for a premium retro feel.
          Pure CSS (zero per-frame cost), non-interactive, sits above the canvas. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)',
          opacity: 0.55,
          mixBlendMode: 'multiply',
        }}
      />
      <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 5 }}>
        <button style={zoomBtn} aria-label="Zoom in" onClick={() => { zoomAt(size.w / 2, size.h / 2, 1.3); haptics.light(); }}>+</button>
        <button style={zoomBtn} aria-label="Zoom out" onClick={() => { zoomAt(size.w / 2, size.h / 2, 1 / 1.3); haptics.light(); }}>−</button>
      </div>
    </div>
  );
};

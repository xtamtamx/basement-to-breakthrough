/**
 * PixelCityMap - 16-bit tile-map renderer for the city overview.
 *
 * Draws a Final Fantasy / Stardew style town from the tilesets, driven by
 * real game data: one quarter per district (roof colors match the district's
 * flavor), the player's venues as marked houses near the crossroads, and
 * pulsing indicators for venues with scheduled shows.
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
  GROUND,
  PROPS,
  ROAD,
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
const ROAD_X = 31; // vertical road tiles: ROAD_X, ROAD_X + 1
const ROAD_Y = 25; // horizontal road tiles: ROAD_Y, ROAD_Y + 1
const SCALE = 2;

const QUARTER_MARGIN = 2; // tiles of breathing room inside each quarter

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

interface Quarter {
  district: District;
  tx: number; // tile origin x
  ty: number;
  tw: number;
  th: number;
}

interface PlacedBuilding {
  sprite: AtlasSprite;
  tx: number;
  ty: number;
  tw: number; // footprint in tiles
  th: number;
  venue?: Venue;
}

interface PlacedProp {
  sprite: AtlasSprite;
  tx: number;
  ty: number;
}

interface TownPlan {
  quarters: Quarter[];
  buildings: PlacedBuilding[];
  trees: PlacedProp[];
  paving: { tx: number; ty: number }[];
}

// Lay out districts into the four road-divided quarters; venues claim the
// plots nearest the crossroads, the rest get filler houses and pocket parks.
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
  const paving: { tx: number; ty: number }[] = [];

  for (const quarter of quarters) {
    const seed = hashString(quarter.district.id);
    const south = quarter.district.bounds.y >= 4;

    // Plot grid for 7x8 houses (plus walkway gap)
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

      if (venue) {
        key = VENUE_BUILDINGS[venue.type] ?? 'houseBlue';
      } else if (hash2(seed + i, seed) < 0.22) {
        // pocket park with a tree
        trees.push({
          sprite: hash2(seed, i) < 0.5 ? PROPS.tree : PROPS.treeB,
          tx: plot.tx + 2,
          ty: plot.ty + 3,
        });
        return;
      } else {
        key = fillers[(seed + i) % fillers.length];
      }

      const sprite = BUILDINGS[key];
      const tw = sprite.rect.w / TILE;
      const th = sprite.rect.h / TILE;
      buildings.push({ sprite, tx: plot.tx, ty: plot.ty, tw, th, venue });

      // Walkway: apron under the house + a stub from the door, extended all
      // the way to the main road for the road-facing row
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

  // World-border greenery joins the depth-sorted draw list
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

  return { quarters, buildings, trees, paving };
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

  // Dev-only inspection hook for the canvas (no DOM to query otherwise)
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
        setSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
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

  // Center camera between the crossroads and the north venue row so houses
  // are in frame even on short landscape viewports
  useEffect(() => {
    if (size.w === 0) return;
    cameraRef.current = clampCamera(
      (ROAD_X + 1) * TILE * SCALE - size.w / 2,
      (ROAD_Y - 4) * TILE * SCALE - size.h / 2,
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
      // pointer capture is best-effort (fails for synthetic events)
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

      // Venues (and their markers) first
      const hitBuilding = plan.buildings.find(
        (b) =>
          b.venue &&
          pos.tx >= b.tx &&
          pos.tx <= b.tx + b.tw &&
          pos.ty >= b.ty - 1.5 && // include the marker above the roof
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
      if (!canvas || !sheets || size.w === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = '#0c1410';
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.save();
      ctx.translate(
        -Math.round(cameraRef.current.x),
        -Math.round(cameraRef.current.y),
      );
      ctx.scale(SCALE, SCALE);

      const draw = (s: AtlasSprite, x: number, y: number) => {
        ctx.drawImage(
          sheets[s.sheet],
          s.rect.x,
          s.rect.y,
          s.rect.w,
          s.rect.h,
          x * TILE,
          y * TILE,
          s.rect.w,
          s.rect.h,
        );
      };

      // Visible tile range (cull)
      const minTx = Math.floor(cameraRef.current.x / SCALE / TILE) - 1;
      const minTy = Math.floor(cameraRef.current.y / SCALE / TILE) - 1;
      const maxTx = minTx + Math.ceil(size.w / SCALE / TILE) + 10;
      const maxTy = minTy + Math.ceil(size.h / SCALE / TILE) + 10;

      // 1. Ground: grass with deterministic variation
      for (let ty = Math.max(0, minTy); ty < Math.min(WORLD_H, maxTy); ty++) {
        for (
          let tx = Math.max(0, minTx);
          tx < Math.min(WORLD_W, maxTx);
          tx++
        ) {
          const r = hash2(tx, ty);
          draw(r < 0.15 ? GROUND.grassDark : GROUND.grass, tx, ty);
          if (r > 0.974) draw(PROPS.flowers, tx, ty);
          else if (r > 0.958) draw(PROPS.hedge, tx, ty);
        }
      }

      // 2. Roads with crosswalk intersection
      for (let tx = 0; tx < WORLD_W; tx++) {
        draw(ROAD.plain, tx, ROAD_Y);
        draw(ROAD.horizontal, tx, ROAD_Y + 1);
      }
      for (let ty = 0; ty < WORLD_H; ty++) {
        draw(ROAD.plain, ROAD_X, ty);
        draw(ROAD.vertical, ROAD_X + 1, ty);
      }
      draw(ROAD.cross, ROAD_X, ROAD_Y);
      draw(ROAD.cross, ROAD_X + 1, ROAD_Y);
      draw(ROAD.cross, ROAD_X, ROAD_Y + 1);
      draw(ROAD.cross, ROAD_X + 1, ROAD_Y + 1);

      // 3. Walkways (aprons + door paths)
      plan.paving.forEach((p) => draw(GROUND.path, p.tx, p.ty));

      // 4. Lamps along the roads
      for (let tx = 4; tx < WORLD_W - 2; tx += 9) {
        if (Math.abs(tx - ROAD_X) > 2) {
          draw(PROPS.lamp, tx, ROAD_Y - 2);
        }
      }
      for (let ty = 4; ty < WORLD_H - 2; ty += 9) {
        if (Math.abs(ty - ROAD_Y) > 2) {
          draw(PROPS.lamp, ROAD_X - 1, ty - 1);
        }
      }

      // 5. Buildings and trees (sorted by foot y for correct overlap)
      const depthSorted: Array<PlacedBuilding | (PlacedProp & { th: number })> =
        [
          ...plan.buildings,
          ...plan.trees.map((t) => ({
            ...t,
            th: t.sprite.rect.h / TILE,
          })),
        ].sort((a, b) => a.ty + a.th - (b.ty + b.th));

      depthSorted.forEach((b) => {
        const isBuilding = 'venue' in b;

        // Grounding shadow under houses
        if (isBuilding) {
          const bb = b as PlacedBuilding;
          ctx.fillStyle = 'rgba(12, 24, 14, 0.30)';
          ctx.fillRect(
            (bb.tx + 0.3) * TILE,
            (bb.ty + bb.th - 0.4) * TILE,
            (bb.tw - 0.6) * TILE,
            0.8 * TILE,
          );
        }

        draw(b.sprite, b.tx, b.ty);

        if (isBuilding && (b as PlacedBuilding).venue) {
          const bb = b as PlacedBuilding;
          const venue = bb.venue as Venue;
          const cx = (bb.tx + bb.tw / 2) * TILE;
          const bob = Math.sin(time / 280) * 2;
          const my = (bb.ty - 0.5) * TILE + bob;

          // Show tonight: pulsing strip under the walkway apron
          if (venuesWithShows.has(venue.id)) {
            const pulse = 0.5 + Math.sin(time / 180) * 0.35;
            ctx.fillStyle = `rgba(247, 37, 133, ${pulse.toFixed(2)})`;
            ctx.fillRect(
              bb.tx * TILE,
              (bb.ty + bb.th) * TILE + 1,
              bb.tw * TILE,
              2,
            );
          }

          // Pixel music-note marker on a dark badge above the roof
          ctx.fillStyle = 'rgba(10, 10, 14, 0.85)';
          ctx.fillRect(cx - 7, my - 7, 14, 14);
          ctx.strokeStyle = '#f72585';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 7.5, my - 7.5, 15, 15);
          ctx.fillStyle = '#f72585';
          ctx.fillRect(cx - 2, my - 5, 2, 8); // stem
          ctx.fillRect(cx - 5, my + 1, 4, 3); // note head
          ctx.fillRect(cx, my - 5, 5, 2); // flag
        }
      });

      // 6. District signposts
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
    },
    [sheets, size.w, size.h, plan, venuesWithShows],
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

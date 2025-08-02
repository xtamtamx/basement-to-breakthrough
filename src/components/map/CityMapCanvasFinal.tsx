import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { MapTile, TILE_COLORS, VenueData, WorkplaceData } from "./MapTypes";
import { useMapStore } from "@/stores/mapStore";
import { useGameStore } from "@/stores/gameStore";
import {
  clampCamera,
  smoothCameraMovement,
  getDistanceBetweenPoints,
  getMidpoint,
} from "@/utils/cameraUtils";
import { haptics } from "@/utils/mobile";
import {
  SPRITES,
  scaleSprite,
  getSpriteForTile,
  SpriteData,
} from "./sprites/PixelSprites";
import { useMapInteraction } from "@/hooks/useMapInteraction";

interface TouchInfo {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export const CityMapCanvasFinal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const touchesRef = useRef<Map<number, TouchInfo>>(new Map());
  const pinchStartDistanceRef = useRef<number>(0);
  const pinchStartZoomRef = useRef<number>(1);
  const [isDragging, setIsDragging] = useState(false);

  // Store state
  const {
    cityMap,
    camera,
    setCamera,
    setCameraTarget,
    selectedTile,
    setSelectedTile,
    setHoveredTile,
    activeVenues,
    playerPosition,
    initializeMap,
    updateTile,
  } = useMapStore();

  const { venues, jobs } = useGameStore();
  const { handleTileClick } = useMapInteraction();

  // Initialize map on mount
  useEffect(() => {
    if (!cityMap) {
      initializeMap();
    }
  }, [cityMap, initializeMap]);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 100,
  });

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 100,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pre-render sprites to offscreen canvas
  const spriteCache = useMemo(() => {
    const cache = new Map<string, ImageData>();

    if (typeof window !== "undefined" && spriteCanvasRef.current) {
      const ctx = spriteCanvasRef.current.getContext("2d");
      if (!ctx) return cache;

      // Render each sprite type at different scales
      const scales = [1, 2, 4];
      Object.entries(SPRITES).forEach(([key, sprite]) => {
        scales.forEach((scale) => {
          const scaledSprite = scaleSprite(sprite, scale);
          const size = scaledSprite.length;

          // Create ImageData for sprite
          const imageData = ctx.createImageData(size, size);

          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              const color = scaledSprite[y][x];
              if (color === "transparent") continue;

              // Parse hex color
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);

              const idx = (y * size + x) * 4;
              imageData.data[idx] = r;
              imageData.data[idx + 1] = g;
              imageData.data[idx + 2] = b;
              imageData.data[idx + 3] = 255;
            }
          }

          cache.set(`${key}_${scale}`, imageData);
        });
      });
    }

    return cache;
  }, []);

  // Camera constraints
  const getCameraConstraints = useCallback(() => {
    if (!cityMap)
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZoom: 0.5, maxZoom: 2 };

    const worldWidth = cityMap.width * cityMap.tileSize;
    const worldHeight = cityMap.height * cityMap.tileSize;
    const halfViewWidth = dimensions.width / (2 * camera.zoom);
    const halfViewHeight = dimensions.height / (2 * camera.zoom);

    return {
      minX: halfViewWidth,
      maxX: worldWidth - halfViewWidth,
      minY: halfViewHeight,
      maxY: worldHeight - halfViewHeight,
      minZoom: 0.5,
      maxZoom: 2,
    };
  }, [cityMap, camera.zoom, dimensions]);

  // Animation state
  const animationTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  // Convert world to screen coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: (worldX - camera.x) * camera.zoom + dimensions.width / 2,
        y: (worldY - camera.y) * camera.zoom + dimensions.height / 2,
      };
    },
    [camera, dimensions],
  );

  // Convert screen to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - dimensions.width / 2) / camera.zoom + camera.x,
        y: (screenY - dimensions.height / 2) / camera.zoom + camera.y,
      };
    },
    [camera, dimensions],
  );

  // Render tile with pixel art sprites
  const renderTile = useCallback(
    (ctx: CanvasRenderingContext2D, tile: MapTile, time: number) => {
      if (!cityMap) return;

      const tileSize = cityMap.tileSize * camera.zoom;
      const worldPos = {
        x: tile.x * cityMap.tileSize,
        y: tile.y * cityMap.tileSize,
      };
      const screenPos = worldToScreen(worldPos.x, worldPos.y);

      // Skip tiles outside viewport
      if (
        screenPos.x < -tileSize ||
        screenPos.x > dimensions.width + tileSize ||
        screenPos.y < -tileSize ||
        screenPos.y > dimensions.height + tileSize
      ) {
        return;
      }

      // Determine appropriate sprite
      let spriteKey = tile.spriteId;

      // Adjust sprite for street direction
      if (tile.type === "street") {
        const hasNorth =
          tile.y > 0 && cityMap.tiles[tile.y - 1][tile.x].type === "street";
        const hasSouth =
          tile.y < cityMap.height - 1 &&
          cityMap.tiles[tile.y + 1][tile.x].type === "street";
        const hasEast =
          tile.x < cityMap.width - 1 &&
          cityMap.tiles[tile.y][tile.x + 1].type === "street";
        const hasWest =
          tile.x > 0 && cityMap.tiles[tile.y][tile.x - 1].type === "street";

        if ((hasNorth || hasSouth) && (hasEast || hasWest)) {
          spriteKey = "street_intersection";
        } else if (hasNorth || hasSouth) {
          spriteKey = "street_vertical";
        } else {
          spriteKey = "street_horizontal";
        }
      }

      // Override sprite key with actual sprite name from SPRITES
      if (tile.type === "building" && tile.district) {
        spriteKey = `building_${tile.district}`;
      } else if (tile.type === "venue") {
        spriteKey = tile.animated ? "venue_active" : "venue_inactive";
      } else if (tile.type === "workplace") {
        spriteKey = "workplace";
      } else if (tile.type === "park") {
        spriteKey = "park";
      }

      // Get sprite data
      const sprite = getSpriteForTile(tile.type, tile.district);

      if (sprite && camera.zoom >= 0.5) {
        // Use pixel art sprite
        const scale = camera.zoom < 1 ? 1 : camera.zoom < 1.5 ? 2 : 4;
        const spriteData = spriteCache.get(`${spriteKey}_${scale}`);

        if (spriteData) {
          // Special effects for active venues
          if (
            tile.type === "venue" &&
            (tile.data as VenueData)?.hasActiveShow
          ) {
            ctx.save();
            const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
            ctx.globalAlpha = pulse;
            ctx.shadowColor = "#FF00FF";
            ctx.shadowBlur = 10 * camera.zoom;
          }

          // Draw sprite pixel by pixel
          const spriteSize = Math.sqrt(spriteData.data.length / 4); // Get actual sprite size
          const pixelSize = tileSize / 8; // Always scale to 8x8 base

          for (let y = 0; y < spriteSize; y++) {
            for (let x = 0; x < spriteSize; x++) {
              const idx = (y * spriteSize + x) * 4;
              if (spriteData.data[idx + 3] > 0) {
                // Has alpha
                const r = spriteData.data[idx];
                const g = spriteData.data[idx + 1];
                const b = spriteData.data[idx + 2];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(
                  Math.floor(screenPos.x + x * pixelSize),
                  Math.floor(screenPos.y + y * pixelSize),
                  Math.ceil(pixelSize),
                  Math.ceil(pixelSize),
                );
              }
            }
          }

          if (
            tile.type === "venue" &&
            (tile.data as VenueData)?.hasActiveShow
          ) {
            ctx.restore();
          }
        } else {
          // Fallback to colored rectangle
          drawColoredTile(ctx, tile, screenPos, tileSize, time);
        }
      } else {
        // Use colored rectangles at low zoom
        drawColoredTile(ctx, tile, screenPos, tileSize, time);
      }

      // Highlight selected tile
      if (
        selectedTile &&
        selectedTile.x === tile.x &&
        selectedTile.y === tile.y
      ) {
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          Math.floor(screenPos.x),
          Math.floor(screenPos.y),
          Math.ceil(tileSize),
          Math.ceil(tileSize),
        );
      }

      // Debug grid lines
      if (camera.zoom > 1.5) {
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          Math.floor(screenPos.x),
          Math.floor(screenPos.y),
          Math.ceil(tileSize),
          Math.ceil(tileSize),
        );
      }
    },
    [
      cityMap,
      camera.zoom,
      worldToScreen,
      dimensions,
      selectedTile,
      spriteCache,
    ],
  );

  // Fallback colored tile rendering
  const drawColoredTile = (
    ctx: CanvasRenderingContext2D,
    tile: MapTile,
    screenPos: { x: number; y: number },
    tileSize: number,
    time: number,
  ) => {
    const color = TILE_COLORS[tile.spriteId] || TILE_COLORS.empty;

    // Apply animation for active venues
    if (tile.animated && tile.type === "venue") {
      const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
    }

    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(screenPos.x),
      Math.floor(screenPos.y),
      Math.ceil(tileSize),
      Math.ceil(tileSize),
    );

    ctx.globalAlpha = 1;

    // Tile border
    if (tile.type !== "street") {
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.floor(screenPos.x),
        Math.floor(screenPos.y),
        Math.ceil(tileSize),
        Math.ceil(tileSize),
      );
    }
  };

  // Render particles for effects
  const renderParticles = useCallback(
    (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vy += 0.0001 * deltaTime; // Gravity
        particle.life -= deltaTime;

        if (particle.life <= 0) return false;

        const screenPos = worldToScreen(particle.x, particle.y);
        ctx.save();
        ctx.globalAlpha = (particle.life / 1000) * 0.8;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          screenPos.x - particle.size / 2,
          screenPos.y - particle.size / 2,
          particle.size,
          particle.size,
        );
        ctx.restore();

        return true;
      });
    },
    [worldToScreen],
  );

  // Spawn particles at venue
  const spawnVenueParticles = useCallback(
    (tile: MapTile) => {
      if (!cityMap) return;

      const worldX = tile.x * cityMap.tileSize + cityMap.tileSize / 2;
      const worldY = tile.y * cityMap.tileSize + cityMap.tileSize / 2;

      // Musical notes
      const notes = ["♪", "♫", "♬"];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particlesRef.current.push({
          x: worldX,
          y: worldY,
          vx: Math.cos(angle) * 0.05,
          vy: Math.sin(angle) * 0.05 - 0.1,
          life: 2000,
          color: ["#FF00FF", "#00FFFF", "#FFD700"][i % 3],
          size: 4,
        });
      }
    },
    [cityMap],
  );

  // Main render loop
  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !cityMap) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Calculate delta time
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Update camera smooth movement
      if (camera.targetX !== undefined && camera.targetY !== undefined) {
        const newCamera = smoothCameraMovement(
          camera,
          { x: camera.targetX, y: camera.targetY, zoom: camera.zoom },
          deltaTime,
        );

        const constraints = getCameraConstraints();
        const clampedCamera = clampCamera(
          newCamera.x,
          newCamera.y,
          newCamera.zoom,
          constraints,
        );
        setCamera(clampedCamera);

        // Clear target when close enough
        if (
          Math.abs(camera.x - camera.targetX) < 1 &&
          Math.abs(camera.y - camera.targetY) < 1
        ) {
          setCamera({ targetX: undefined, targetY: undefined });
        }
      }

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw grid background pattern
      if (camera.zoom > 1) {
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;

        const gridSize = cityMap.tileSize * camera.zoom;
        const offsetX =
          (dimensions.width / 2 - camera.x * camera.zoom) % gridSize;
        const offsetY =
          (dimensions.height / 2 - camera.y * camera.zoom) % gridSize;

        for (let x = offsetX; x < dimensions.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, dimensions.height);
          ctx.stroke();
        }

        for (let y = offsetY; y < dimensions.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(dimensions.width, y);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Render all tiles
      for (let y = 0; y < cityMap.height; y++) {
        for (let x = 0; x < cityMap.width; x++) {
          const tile = cityMap.tiles[y][x];
          renderTile(ctx, tile, time);
        }
      }

      // Render player position
      if (playerPosition) {
        const worldPos = {
          x: playerPosition.x * cityMap.tileSize + cityMap.tileSize / 2,
          y: playerPosition.y * cityMap.tileSize + cityMap.tileSize / 2,
        };
        const screenPos = worldToScreen(worldPos.x, worldPos.y);

        ctx.save();

        // Player shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(
          screenPos.x,
          screenPos.y + 4,
          10 * camera.zoom,
          6 * camera.zoom,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Player sprite (simple circle for now)
        const playerGlow = Math.sin(time * 0.003) * 0.2 + 0.8;
        ctx.shadowColor = "#00FF00";
        ctx.shadowBlur = 10 * playerGlow;
        ctx.fillStyle = "#00FF00";
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 8 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Render particles
      renderParticles(ctx, deltaTime);

      // Render district labels
      if (camera.zoom < 0.8) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        cityMap.districts.forEach((district) => {
          const centerX =
            (district.bounds.x + district.bounds.width / 2) * cityMap.tileSize;
          const centerY =
            (district.bounds.y + district.bounds.height / 2) * cityMap.tileSize;
          const screenPos = worldToScreen(centerX, centerY);

          // District glow effect
          const glow = Math.sin(time * 0.002 + district.bounds.x) * 0.1 + 0.9;

          // Draw label background
          const text = district.name.toUpperCase();
          ctx.font = `bold ${16 / camera.zoom}px monospace`;
          const metrics = ctx.measureText(text);

          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.fillRect(
            screenPos.x - metrics.width / 2 - 10,
            screenPos.y - 12,
            metrics.width + 20,
            24,
          );

          // Draw label border
          ctx.strokeStyle = `rgba(139,92,246,${glow})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            screenPos.x - metrics.width / 2 - 10,
            screenPos.y - 12,
            metrics.width + 20,
            24,
          );

          // Draw label text
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(text, screenPos.x, screenPos.y);
        });

        ctx.restore();
      }

      // Render venue overlays
      if (camera.zoom > 0.7) {
        ctx.save();

        // Iterate through venues with active shows
        for (let y = 0; y < cityMap.height; y++) {
          for (let x = 0; x < cityMap.width; x++) {
            const tile = cityMap.tiles[y][x];
            if (
              tile.type === "venue" &&
              (tile.data as VenueData)?.hasActiveShow
            ) {
              const worldPos = {
                x: tile.x * cityMap.tileSize + cityMap.tileSize / 2,
                y: tile.y * cityMap.tileSize,
              };
              const screenPos = worldToScreen(worldPos.x, worldPos.y);

              // Animated indicator
              const bounce = Math.sin(time * 0.004) * 5;
              ctx.fillStyle = "#FF00FF";
              ctx.font = `${12 * camera.zoom}px monospace`;
              ctx.textAlign = "center";
              ctx.fillText(
                "LIVE",
                screenPos.x,
                screenPos.y - 10 * camera.zoom + bounce,
              );
            }
          }
        }

        ctx.restore();
      }

      // Store animation time
      animationTimeRef.current = time;

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(render);
    },
    [
      cityMap,
      camera,
      dimensions,
      getCameraConstraints,
      playerPosition,
      renderTile,
      renderParticles,
      setCamera,
      worldToScreen,
    ],
  );

  // Touch and interaction handlers (same as enhanced version)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        touchesRef.current.set(touch.identifier, {
          id: touch.identifier,
          startX: touch.clientX,
          startY: touch.clientY,
          currentX: touch.clientX,
          currentY: touch.clientY,
        });
      }

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        pinchStartDistanceRef.current = getDistanceBetweenPoints(
          { x: touch1.clientX, y: touch1.clientY },
          { x: touch2.clientX, y: touch2.clientY },
        );
        pinchStartZoomRef.current = camera.zoom;
      } else if (e.touches.length === 1) {
        setIsDragging(true);
      }
    },
    [camera.zoom],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchInfo = touchesRef.current.get(touch.identifier);
        if (touchInfo) {
          touchInfo.currentX = touch.clientX;
          touchInfo.currentY = touch.clientY;
        }
      }

      if (e.touches.length === 2 && touchesRef.current.size === 2) {
        const touches = Array.from(touchesRef.current.values());
        const currentDistance = getDistanceBetweenPoints(
          { x: touches[0].currentX, y: touches[0].currentY },
          { x: touches[1].currentX, y: touches[1].currentY },
        );

        const scale = currentDistance / pinchStartDistanceRef.current;
        const newZoom = pinchStartZoomRef.current * scale;

        const constraints = getCameraConstraints();
        const clampedZoom = Math.max(
          constraints.minZoom,
          Math.min(constraints.maxZoom, newZoom),
        );

        const midpoint = getMidpoint(
          { x: touches[0].currentX, y: touches[0].currentY },
          { x: touches[1].currentX, y: touches[1].currentY },
        );

        const worldMidpoint = screenToWorld(midpoint.x, midpoint.y);

        const zoomRatio = clampedZoom / camera.zoom;
        const newCameraX =
          worldMidpoint.x - (worldMidpoint.x - camera.x) * zoomRatio;
        const newCameraY =
          worldMidpoint.y - (worldMidpoint.y - camera.y) * zoomRatio;

        const clampedCamera = clampCamera(
          newCameraX,
          newCameraY,
          clampedZoom,
          constraints,
        );
        setCamera(clampedCamera);
      } else if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        const touchInfo = touchesRef.current.get(touch.identifier);
        if (!touchInfo) return;

        const deltaX = (touchInfo.currentX - touchInfo.startX) / camera.zoom;
        const deltaY = (touchInfo.currentY - touchInfo.startY) / camera.zoom;

        const constraints = getCameraConstraints();
        const clampedCamera = clampCamera(
          camera.x - deltaX,
          camera.y - deltaY,
          camera.zoom,
          constraints,
        );

        setCamera(clampedCamera);

        touchInfo.startX = touchInfo.currentX;
        touchInfo.startY = touchInfo.currentY;
      }
    },
    [camera, getCameraConstraints, isDragging, screenToWorld, setCamera],
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.changedTouches.length === 1 && touchesRef.current.size === 1) {
      const touch = e.changedTouches[0];
      const touchInfo = touchesRef.current.get(touch.identifier);

      if (touchInfo) {
        const moveDistance = getDistanceBetweenPoints(
          { x: touchInfo.startX, y: touchInfo.startY },
          { x: touchInfo.currentX, y: touchInfo.currentY },
        );

        if (moveDistance < 10) {
          handleTap(touchInfo.currentX, touchInfo.currentY);
        }
      }
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      touchesRef.current.delete(e.changedTouches[i].identifier);
    }

    if (touchesRef.current.size === 0) {
      setIsDragging(false);
    }
  }, []);

  // Handle tap/click
  const handleTap = useCallback(
    (x: number, y: number) => {
      if (!cityMap || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = x - rect.left;
      const canvasY = y - rect.top;

      const worldPos = screenToWorld(canvasX, canvasY);
      const tileX = Math.floor(worldPos.x / cityMap.tileSize);
      const tileY = Math.floor(worldPos.y / cityMap.tileSize);

      if (
        tileX >= 0 &&
        tileX < cityMap.width &&
        tileY >= 0 &&
        tileY < cityMap.height
      ) {
        const tile = cityMap.tiles[tileY][tileX];

        if (tile.interactable) {
          haptics.light();
          setSelectedTile(tile);

          // Spawn particles for feedback
          spawnVenueParticles(tile);

          // Handle tile interaction
          handleTileClick(tile);
        }
      }
    },
    [
      cityMap,
      screenToWorld,
      setSelectedTile,
      spawnVenueParticles,
      handleTileClick,
    ],
  );

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    touchesRef.current.set(-1, {
      id: -1,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const touchInfo = touchesRef.current.get(-1);
      if (!touchInfo) return;

      const deltaX = (e.clientX - touchInfo.startX) / camera.zoom;
      const deltaY = (e.clientY - touchInfo.startY) / camera.zoom;

      const constraints = getCameraConstraints();
      const clampedCamera = clampCamera(
        camera.x - deltaX,
        camera.y - deltaY,
        camera.zoom,
        constraints,
      );

      setCamera(clampedCamera);

      touchInfo.startX = e.clientX;
      touchInfo.startY = e.clientY;
    },
    [camera, getCameraConstraints, isDragging, setCamera],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const touchInfo = touchesRef.current.get(-1);

      if (touchInfo) {
        const moveDistance = getDistanceBetweenPoints(
          { x: touchInfo.startX, y: touchInfo.startY },
          { x: e.clientX, y: e.clientY },
        );

        if (moveDistance < 10) {
          handleTap(e.clientX, e.clientY);
        }
      }

      setIsDragging(false);
      touchesRef.current.clear();
    },
    [handleTap],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const zoomSpeed = 0.001;
      const newZoom = camera.zoom * (1 - e.deltaY * zoomSpeed);

      const constraints = getCameraConstraints();
      const clampedZoom = Math.max(
        constraints.minZoom,
        Math.min(constraints.maxZoom, newZoom),
      );

      const worldMouse = screenToWorld(e.clientX, e.clientY);
      const zoomRatio = clampedZoom / camera.zoom;
      const newCameraX = worldMouse.x - (worldMouse.x - camera.x) * zoomRatio;
      const newCameraY = worldMouse.y - (worldMouse.y - camera.y) * zoomRatio;

      const clampedCamera = clampCamera(
        newCameraX,
        newCameraY,
        clampedZoom,
        constraints,
      );
      setCamera(clampedCamera);
    },
    [camera, getCameraConstraints, screenToWorld, setCamera],
  );

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
    }

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, render]);

  if (!cityMap) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          color: "#FFFFFF",
          fontFamily: "monospace",
        }}
      >
        <div>
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            LOADING CITY...
          </div>
          <div
            style={{
              width: "200px",
              height: "4px",
              backgroundColor: "#333333",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: "50%",
                backgroundColor: "#8B5CF6",
                animation: "loading 1s ease-in-out infinite",
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="city-map-container"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#000000",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {/* Hidden canvas for sprite rendering */}
      <canvas
        ref={spriteCanvasRef}
        width={128}
        height={128}
        style={{ display: "none" }}
      />

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          width: "100%",
          height: "100%",
        }}
      />

      {/* UI Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      >
        {/* Top info bar */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            right: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {/* Camera info */}
          <div
            style={{
              color: "#FFFFFF",
              fontFamily: "monospace",
              fontSize: "12px",
              backgroundColor: "rgba(0,0,0,0.8)",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #333333",
            }}
          >
            <div>ZOOM: {(camera.zoom * 100).toFixed(0)}%</div>
            <div
              style={{ fontSize: "10px", color: "#888888", marginTop: "2px" }}
            >
              DRAG TO PAN • PINCH TO ZOOM
            </div>
          </div>

          {/* Mini map toggle (future feature) */}
          <button
            style={{
              backgroundColor: "rgba(139,92,246,0.8)",
              border: "none",
              color: "#FFFFFF",
              padding: "8px 12px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
            onClick={() => devLog.log("Toggle minimap")}
          >
            MAP
          </button>
        </div>

        {/* Selected tile info */}
        {selectedTile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: "absolute",
              bottom: 80,
              left: 10,
              right: 10,
              maxWidth: "400px",
              margin: "0 auto",
              color: "#FFFFFF",
              fontFamily: "monospace",
              fontSize: "14px",
              backgroundColor: "rgba(0,0,0,0.9)",
              padding: "15px",
              borderRadius: "8px",
              border: "2px solid #8B5CF6",
              boxShadow: "0 0 20px rgba(139,92,246,0.5)",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#8B5CF6", marginBottom: "5px" }}>
                  {selectedTile.type.toUpperCase()}
                </div>
                {selectedTile.data && "name" in selectedTile.data && (
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    {selectedTile.data.name}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888888",
                    marginTop: "5px",
                  }}
                >
                  {selectedTile.district.toUpperCase()} DISTRICT
                </div>
              </div>

              {selectedTile.type === "venue" && (
                <button
                  style={{
                    backgroundColor: "#8B5CF6",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => devLog.log("Book venue")}
                >
                  BOOK
                </button>
              )}

              {selectedTile.type === "workplace" && (
                <button
                  style={{
                    backgroundColor: "#06B6D4",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => devLog.log("Apply for job")}
                >
                  APPLY
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => {
              const newZoom = Math.min(camera.zoom * 1.2, 2);
              setCamera({ zoom: newZoom });
              haptics.light();
            }}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "2px solid #8B5CF6",
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "#8B5CF6",
              fontSize: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              const newZoom = Math.max(camera.zoom * 0.8, 0.5);
              setCamera({ zoom: newZoom });
              haptics.light();
            }}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "2px solid #8B5CF6",
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "#8B5CF6",
              fontSize: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
};

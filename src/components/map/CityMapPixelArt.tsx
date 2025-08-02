import React, { useRef, useEffect, useCallback, useState } from "react";
import { MapTile, VenueData, WorkplaceData } from "./MapTypes";
import { useMapStore } from "@/stores/mapStore";
import { useGameStore } from "@/stores/gameStore";
import {
  clampCamera,
  getDistanceBetweenPoints,
  getMidpoint,
} from "@/utils/cameraUtils";
import { haptics } from "@/utils/mobile";
import { useMapInteraction } from "@/hooks/useMapInteraction";
import {
  SPRITES_16BIT,
  SPRITE_COLORS_16BIT,
} from "./sprites/PixelSprites16Bit";

interface TouchInfo {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const CityMapPixelArt: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    selectedTile,
    setSelectedTile,
    activeVenues,
    playerPosition,
    initializeMap,
  } = useMapStore();

  const { handleTileClick } = useMapInteraction();

  // Initialize map on mount
  useEffect(() => {
    if (!cityMap) {
      initializeMap();
    }
  }, [cityMap, initializeMap]);

  // Canvas dimensions - get actual container size
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 100,
  });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial size
    updateDimensions();

    // Update on resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Camera constraints
  const getCameraConstraints = useCallback(() => {
    if (!cityMap)
      return {
        minX: 320,
        maxX: 320,
        minY: 240,
        maxY: 240,
        minZoom: 0.5,
        maxZoom: 2,
      };

    const worldWidth = cityMap.width * cityMap.tileSize;
    const worldHeight = cityMap.height * cityMap.tileSize;

    // Simple constraints - just keep camera within world bounds
    return {
      minX: 0,
      maxX: worldWidth,
      minY: 0,
      maxY: worldHeight,
      minZoom: 0.5,
      maxZoom: 2,
    };
  }, [cityMap]);

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

  // Draw a single pixel art tile
  const drawPixelArtTile = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tile: MapTile,
      screenPos: { x: number; y: number },
      tileSize: number,
      time: number,
    ) => {
      if (!cityMap) return;
      // Determine sprite to use
      let sprite = null;

      if (tile.type === "building" && tile.district) {
        sprite = SPRITES_16BIT[`building_${tile.district}`];
      } else if (tile.type === "venue") {
        sprite =
          tile.animated || (tile.data as VenueData)?.hasActiveShow
            ? SPRITES_16BIT.venue_active
            : SPRITES_16BIT.venue_inactive;
      } else if (tile.type === "workplace") {
        sprite = SPRITES_16BIT.workplace;
      } else if (tile.type === "park") {
        sprite = SPRITES_16BIT.park;
      } else if (tile.type === "street") {
        // Determine street direction based on neighbors
        if (!cityMap) {
          sprite = SPRITES_16BIT.street_horizontal;
        } else {
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
            sprite = SPRITES_16BIT.street_intersection;
          } else if (hasNorth || hasSouth) {
            sprite = SPRITES_16BIT.street_vertical;
          } else {
            sprite = SPRITES_16BIT.street_horizontal;
          }
        }
      }

      if (sprite) {
        // Draw sprite as 16x16 grid of pixels
        const spriteSize = sprite.length; // Should be 16 for 16-bit sprites
        const pixelSize = tileSize / spriteSize;

        // Add pulsing effect for active venues
        if (
          tile.type === "venue" &&
          (tile.animated || (tile.data as VenueData)?.hasActiveShow)
        ) {
          ctx.save();
          const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
          ctx.globalAlpha = pulse;
        }

        // Draw each pixel
        for (let y = 0; y < spriteSize; y++) {
          for (let x = 0; x < spriteSize; x++) {
            const color = sprite[y][x];
            if (color !== "transparent") {
              ctx.fillStyle = color;
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
          (tile.animated || (tile.data as VenueData)?.hasActiveShow)
        ) {
          ctx.restore();
        }

        // Add subtle district tinting to buildings
        if (tile.type === "building") {
          ctx.save();
          ctx.globalAlpha = 0.1;
          const districtTints: Record<string, string> = {
            downtown: "#4A90E2",
            warehouse: "#B7410E",
            college: "#228B22",
            residential: "#F4A460",
            arts: "#9370DB",
          };
          if (tile.district && districtTints[tile.district]) {
            ctx.fillStyle = districtTints[tile.district];
            ctx.fillRect(
              Math.floor(screenPos.x),
              Math.floor(screenPos.y),
              Math.ceil(tileSize),
              Math.ceil(tileSize),
            );
          }
          ctx.restore();
        }
      } else {
        // Fallback to solid color based on tile type
        const fallbackColors: Record<string, string> = {
          building: "#4A4A4A",
          street: "#2C2C2C",
          park: "#228B22",
          venue: "#8B5CF6",
          workplace: "#4A90E2",
          empty: "#1A1A1A",
        };
        ctx.fillStyle = fallbackColors[tile.type] || "#333333";
        ctx.fillRect(
          Math.floor(screenPos.x),
          Math.floor(screenPos.y),
          Math.ceil(tileSize),
          Math.ceil(tileSize),
        );
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
    },
    [selectedTile, cityMap],
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

      // Clear canvas with black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Enable pixel-perfect rendering
      ctx.imageSmoothingEnabled = false;

      // Render tiles
      const tileSize = cityMap.tileSize * camera.zoom;

      for (let y = 0; y < cityMap.height; y++) {
        for (let x = 0; x < cityMap.width; x++) {
          const tile = cityMap.tiles[y][x];
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
            continue;
          }

          drawPixelArtTile(ctx, tile, screenPos, tileSize, time);
        }
      }

      // Draw district boundaries and labels when zoomed out
      if (camera.zoom <= 1.2 && cityMap.districts) {
        // Draw district boundaries first
        ctx.save();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.3;

        cityMap.districts.forEach((district) => {
          const x = district.bounds.x * cityMap.tileSize;
          const y = district.bounds.y * cityMap.tileSize;
          const width = district.bounds.width * cityMap.tileSize;
          const height = district.bounds.height * cityMap.tileSize;

          const topLeft = worldToScreen(x, y);
          const bottomRight = worldToScreen(x + width, y + height);

          ctx.strokeRect(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y,
          );
        });

        ctx.restore();
      }

      // Draw district labels when zoomed out
      if (camera.zoom <= 1.0 && cityMap.districts) {
        ctx.save();
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.fillStyle = "#FFFFFF";

        cityMap.districts.forEach((district) => {
          const centerX =
            (district.bounds.x + district.bounds.width / 2) * cityMap.tileSize;
          const centerY =
            (district.bounds.y + district.bounds.height / 2) * cityMap.tileSize;
          const screenPos = worldToScreen(centerX, centerY);

          // Add background for better readability
          ctx.save();
          ctx.globalAlpha = 0.7;
          const metrics = ctx.measureText(district.name.toUpperCase());
          ctx.fillStyle = "#000000";
          ctx.fillRect(
            screenPos.x - metrics.width / 2 - 5,
            screenPos.y - 10,
            metrics.width + 10,
            20,
          );
          ctx.restore();

          // Draw text with outline
          ctx.strokeText(district.name.toUpperCase(), screenPos.x, screenPos.y);
          ctx.fillText(district.name.toUpperCase(), screenPos.x, screenPos.y);
        });

        ctx.restore();
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(render);
    },
    [
      cityMap,
      camera,
      dimensions,
      getCameraConstraints,
      setCamera,
      worldToScreen,
      drawPixelArtTile,
    ],
  );

  // Touch handling
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
        // Start pinch zoom
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

      // Update touch positions
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchInfo = touchesRef.current.get(touch.identifier);
        if (touchInfo) {
          touchInfo.currentX = touch.clientX;
          touchInfo.currentY = touch.clientY;
        }
      }

      if (e.touches.length === 2 && touchesRef.current.size >= 2) {
        // Handle pinch zoom
        const touches = Array.from(touchesRef.current.values()).slice(0, 2);

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

        setCamera((prevCamera) => ({
          ...prevCamera,
          zoom: clampedZoom,
        }));
      } else if (
        e.touches.length === 1 &&
        isDragging &&
        touchesRef.current.size >= 1
      ) {
        // Handle pan
        const touch = e.touches[0];
        const touchInfo = touchesRef.current.get(touch.identifier);
        if (!touchInfo) return;

        // Calculate delta in screen space first
        const screenDeltaX = touchInfo.currentX - touchInfo.startX;
        const screenDeltaY = touchInfo.currentY - touchInfo.startY;

        // Only update if movement is significant (in screen pixels)
        if (Math.abs(screenDeltaX) > 2 || Math.abs(screenDeltaY) > 2) {
          // Convert to world space
          const worldDeltaX = screenDeltaX / camera.zoom;
          const worldDeltaY = screenDeltaY / camera.zoom;

          setCamera((prevCamera) => {
            const constraints = getCameraConstraints();
            const newX = prevCamera.x - worldDeltaX;
            const newY = prevCamera.y - worldDeltaY;

            return {
              x: Math.max(constraints.minX, Math.min(constraints.maxX, newX)),
              y: Math.max(constraints.minY, Math.min(constraints.maxY, newY)),
              zoom: prevCamera.zoom,
            };
          });

          // Update start position for continuous dragging
          touchInfo.startX = touchInfo.currentX;
          touchInfo.startY = touchInfo.currentY;
        }
      }
    },
    [camera.zoom, getCameraConstraints, isDragging, setCamera],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      // Check for tap (no movement) - only if we weren't dragging
      if (
        !isDragging &&
        e.changedTouches.length === 1 &&
        touchesRef.current.size === 1
      ) {
        const touch = e.changedTouches[0];
        const touchInfo = touchesRef.current.get(touch.identifier);

        if (touchInfo) {
          const moveDistance = getDistanceBetweenPoints(
            { x: touchInfo.startX, y: touchInfo.startY },
            { x: touchInfo.currentX, y: touchInfo.currentY },
          );

          if (moveDistance < 10) {
            // Handle tap
            handleTap(touchInfo.currentX, touchInfo.currentY);
          }
        }
      }

      // Remove ended touches
      for (let i = 0; i < e.changedTouches.length; i++) {
        touchesRef.current.delete(e.changedTouches[i].identifier);
      }

      if (touchesRef.current.size === 0) {
        setIsDragging(false);
      }
    },
    [isDragging],
  );

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
          handleTileClick(tile);
        } else {
          // Deselect if tapping non-interactable tile
          setSelectedTile(null);
        }
      }
    },
    [cityMap, screenToWorld, setSelectedTile, handleTileClick],
  );

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
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

      const screenDeltaX = e.clientX - touchInfo.startX;
      const screenDeltaY = e.clientY - touchInfo.startY;

      if (Math.abs(screenDeltaX) > 2 || Math.abs(screenDeltaY) > 2) {
        const worldDeltaX = screenDeltaX / camera.zoom;
        const worldDeltaY = screenDeltaY / camera.zoom;

        setCamera((prevCamera) => {
          const constraints = getCameraConstraints();
          const newX = prevCamera.x - worldDeltaX;
          const newY = prevCamera.y - worldDeltaY;

          return {
            x: Math.max(constraints.minX, Math.min(constraints.maxX, newX)),
            y: Math.max(constraints.minY, Math.min(constraints.maxY, newY)),
            zoom: prevCamera.zoom,
          };
        });

        touchInfo.startX = e.clientX;
        touchInfo.startY = e.clientY;
        touchInfo.currentX = e.clientX;
        touchInfo.currentY = e.clientY;
      }
    },
    [isDragging, camera.zoom, getCameraConstraints, setCamera],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const touchInfo = touchesRef.current.get(-1);

      if (touchInfo && isDragging) {
        const moveDistance = getDistanceBetweenPoints(
          { x: touchInfo.startX, y: touchInfo.startY },
          { x: e.clientX, y: e.clientY },
        );

        if (moveDistance < 10) {
          handleTap(e.clientX, e.clientY);
        }
      }

      setIsDragging(false);
      touchesRef.current.delete(-1);
    },
    [isDragging, handleTap],
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

      setCamera((prevCamera) => ({
        ...prevCamera,
        zoom: clampedZoom,
      }));
    },
    [camera.zoom, getCameraConstraints, setCamera],
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

  // Set up touch event listeners with non-passive option
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchStartHandler = (e: TouchEvent) => handleTouchStart(e as any);
    const touchMoveHandler = (e: TouchEvent) => handleTouchMove(e as any);
    const touchEndHandler = (e: TouchEvent) => handleTouchEnd(e as any);

    // Add non-passive event listeners
    canvas.addEventListener("touchstart", touchStartHandler, {
      passive: false,
    });
    canvas.addEventListener("touchmove", touchMoveHandler, { passive: false });
    canvas.addEventListener("touchend", touchEndHandler, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", touchStartHandler);
      canvas.removeEventListener("touchmove", touchMoveHandler);
      canvas.removeEventListener("touchend", touchEndHandler);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!cityMap) {
    return <div>Loading map...</div>;
  }

  return (
    <div
      ref={containerRef}
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
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          imageRendering: "pixelated", // For crisp pixels
        }}
      />

      {/* UI Overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "#FFFFFF",
          fontFamily: "monospace",
          fontSize: "12px",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "5px",
          borderRadius: "3px",
        }}
      >
        Zoom: {camera.zoom.toFixed(2)}x
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 80, // Moved up to avoid End Turn button
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          onClick={() => {
            const newZoom = Math.min(camera.zoom * 1.2, 2);
            setCamera({ zoom: newZoom });
            haptics.light();
          }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(139, 92, 246, 0.8)",
            color: "#FFFFFF",
            fontSize: "20px",
            cursor: "pointer",
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
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(139, 92, 246, 0.8)",
            color: "#FFFFFF",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          −
        </button>
      </div>
    </div>
  );
};

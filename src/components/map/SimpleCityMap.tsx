import React, { useRef, useEffect, useCallback, useState } from "react";
import { MapTile, VenueData } from "./MapTypes";
import { useMapStore } from "@/stores/mapStore";
import { haptics } from "@/utils/mobile";
import { SPRITES_16BIT } from "./sprites/PixelSprites16Bit";
import { useMapInteraction } from "@/contexts/MapInteractionContext";

interface SimpleCityMapProps {
  onTileClick?: (tile: MapTile) => void;
}

export const SimpleCityMap: React.FC<SimpleCityMapProps> = ({
  onTileClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });

  // Store state
  const {
    cityMap,
    camera,
    setCamera,
    selectedTile,
    setSelectedTile,
    initializeMap,
  } = useMapStore();

  // Get handleTileClick from context if not provided as prop
  const { handleTileClick: contextHandleTileClick } = useMapInteraction();
  const tileClickHandler = onTileClick || contextHandleTileClick;

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
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 100,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

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
        if (cityMap) {
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
        } else {
          sprite = SPRITES_16BIT.street_horizontal;
        }
      }

      if (sprite) {
        const spriteSize = sprite.length;
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

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
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

      // Draw district labels when zoomed out
      if (camera.zoom <= 1.0 && cityMap.districts) {
        ctx.save();
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;

        cityMap.districts.forEach((district) => {
          const centerX =
            (district.bounds.x + district.bounds.width / 2) * cityMap.tileSize;
          const centerY =
            (district.bounds.y + district.bounds.height / 2) * cityMap.tileSize;
          const screenPos = worldToScreen(centerX, centerY);

          ctx.strokeText(district.name.toUpperCase(), screenPos.x, screenPos.y);
          ctx.fillText(district.name.toUpperCase(), screenPos.x, screenPos.y);
        });

        ctx.restore();
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(render);
    },
    [cityMap, camera, dimensions, worldToScreen, drawPixelArtTile],
  );

  // Simple pointer down handler
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setCameraStart({ x: camera.x, y: camera.y });
    },
    [camera],
  );

  // Simple pointer move handler
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const deltaX = (e.clientX - dragStart.x) / camera.zoom;
      const deltaY = (e.clientY - dragStart.y) / camera.zoom;

      setCamera({
        x: cameraStart.x - deltaX,
        y: cameraStart.y - deltaY,
        zoom: camera.zoom,
      });
    },
    [isDragging, dragStart, cameraStart, camera.zoom, setCamera],
  );

  // Simple pointer up handler
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const deltaX = Math.abs(e.clientX - dragStart.x);
      const deltaY = Math.abs(e.clientY - dragStart.y);

      // If barely moved, treat as a tap
      if (deltaX < 5 && deltaY < 5 && cityMap && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const worldPos = screenToWorld(x, y);
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
            if (tileClickHandler) {
              tileClickHandler(tile);
            }
          } else {
            setSelectedTile(null);
          }
        }
      }

      setIsDragging(false);
    },
    [
      isDragging,
      dragStart,
      cityMap,
      screenToWorld,
      setSelectedTile,
      tileClickHandler,
    ],
  );

  // Zoom handlers with centering
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(camera.zoom * 1.2, 2);
    setCamera({ zoom: newZoom });
    haptics.light();
  }, [camera.zoom, setCamera]);

  const handleZoomOut = useCallback(() => {
    if (!cityMap) return;

    const newZoom = Math.max(camera.zoom * 0.8, 0.5);
    const mapCenterX = (cityMap.width * cityMap.tileSize) / 2;
    const mapCenterY = (cityMap.height * cityMap.tileSize) / 2;

    // Interpolate camera position towards center as we zoom out
    const centeringFactor = 1 - newZoom; // More centering as zoom decreases
    const newX = camera.x + (mapCenterX - camera.x) * centeringFactor * 0.3;
    const newY = camera.y + (mapCenterY - camera.y) * centeringFactor * 0.3;

    setCamera({
      x: newX,
      y: newY,
      zoom: newZoom,
    });
    haptics.light();
  }, [camera, cityMap, setCamera]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!cityMap) return;

      const zoomSpeed = 0.001;
      const newZoom = Math.max(
        0.5,
        Math.min(2, camera.zoom * (1 - e.deltaY * zoomSpeed)),
      );

      if (e.deltaY > 0) {
        // Zooming out
        const mapCenterX = (cityMap.width * cityMap.tileSize) / 2;
        const mapCenterY = (cityMap.height * cityMap.tileSize) / 2;

        // Interpolate camera position towards center as we zoom out
        const centeringFactor = 1 - newZoom;
        const newX = camera.x + (mapCenterX - camera.x) * centeringFactor * 0.1;
        const newY = camera.y + (mapCenterY - camera.y) * centeringFactor * 0.1;

        setCamera({
          x: newX,
          y: newY,
          zoom: newZoom,
        });
      } else {
        setCamera({ zoom: newZoom });
      }
    },
    [camera, cityMap, setCamera],
  );

  // Set up canvas and wheel handler
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

    // Add wheel event listener with passive: false
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      // Convert native WheelEvent to React.WheelEvent-like structure
      handleWheel({
        deltaY: e.deltaY,
        preventDefault: () => e.preventDefault(),
        nativeEvent: e,
      } as React.WheelEvent);
    };

    canvas.addEventListener("wheel", wheelHandler, { passive: false });

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener("wheel", wheelHandler);
    };
  }, [dimensions, render, handleWheel]);

  if (!cityMap) {
    return <div>Loading map...</div>;
  }

  return (
    <div
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
        }}
      />

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          onClick={handleZoomIn}
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
          onClick={handleZoomOut}
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

      {/* Info display */}
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
    </div>
  );
};

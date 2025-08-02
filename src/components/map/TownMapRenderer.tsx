import React, { useRef, useEffect, useCallback, useState } from "react";
import { ProperTownGenerator } from "@/game/generation/ProperTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import {
  TOPDOWN_COLORS,
  renderTopDownSprite,
  HOUSE_TOPDOWN,
  SHOP_TOPDOWN,
  VENUE_TOPDOWN,
  TREE_TOPDOWN,
  FOUNTAIN_TOPDOWN,
  GRASS_TOPDOWN,
  ROAD_H_TOPDOWN,
  ROAD_V_TOPDOWN,
  PLAZA_TOPDOWN,
  COMMUNITY_TOPDOWN,
  ROAD_CROSS,
} from "./sprites/TopDownSprites";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface TownMapRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const TownMapRenderer: React.FC<TownMapRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });

  const gameStore = useGameStore();
  const tileSize = 16; // 16x16 pixel tiles for cleaner look

  // Generate town based on player progress
  useEffect(() => {
    const generator = new ProperTownGenerator(60, 40);
    const playerStats = {
      showsBooked:
        (gameStore.scheduledShows?.length || 0) +
        (gameStore.showHistory?.length || 0),
      venuesOwned: gameStore.venues?.length || 0,
      bandsManaged: gameStore.allBands?.length || 0,
      sceneReputation: gameStore.reputation || 0,
    };

    const generatedTown = generator.generateTown(playerStats);
    setTown(generatedTown);

    // Center camera on town square with appropriate zoom
    if (generatedTown.townSquare) {
      setCamera({
        x:
          generatedTown.townSquare.x * tileSize +
          (generatedTown.townSquare.width * tileSize) / 2,
        y:
          generatedTown.townSquare.y * tileSize +
          (generatedTown.townSquare.height * tileSize) / 2,
        zoom: window.innerWidth < 768 ? 1.5 : 2.5, // Better zoom for town view
      });
    }
  }, [
    gameStore.scheduledShows?.length,
    gameStore.showHistory?.length,
    gameStore.venues?.length,
    gameStore.allBands?.length,
    gameStore.reputation,
  ]);

  // Convert world to screen coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: (worldX - camera.x) * camera.zoom + width / 2,
        y: (worldY - camera.y) * camera.zoom + height / 2,
      };
    },
    [camera, width, height],
  );

  // Convert screen to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - width / 2) / camera.zoom + camera.x,
        y: (screenY - height / 2) / camera.zoom + camera.y,
      };
    },
    [camera, width, height],
  );

  // Handle mouse/touch events
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setDragStart({ x, y });
      setCameraStart({ x: camera.x, y: camera.y });

      // Check if clicking on a building
      if (town && onBuildingClick) {
        const worldPos = screenToWorld(x, y);
        const tileX = Math.floor(worldPos.x / tileSize);
        const tileY = Math.floor(worldPos.y / tileSize);

        const clickedBuilding = town.buildings.find(
          (b) =>
            tileX >= b.x &&
            tileX < b.x + b.width &&
            tileY >= b.y &&
            tileY < b.y + b.height,
        );

        if (clickedBuilding) {
          onBuildingClick(clickedBuilding);
          haptics.light();
        }
      }
    },
    [camera, screenToWorld, town, onBuildingClick],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = (x - dragStart.x) / camera.zoom;
      const dy = (y - dragStart.y) / camera.zoom;

      setCamera({
        ...camera,
        x: cameraStart.x - dx,
        y: cameraStart.y - dy,
      });
    },
    [isDragging, dragStart, cameraStart, camera],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newZoom = Math.max(
        1,
        Math.min(4, camera.zoom - e.deltaY * zoomSpeed),
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera],
  );

  // Render town
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with grass color
    ctx.fillStyle = "#4CAF50"; // Nice green background
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    // Draw grass tiles as background with variation
    const startTileX = Math.floor(screenToWorld(0, 0).x / tileSize) - 1;
    const endTileX = Math.ceil(screenToWorld(width, 0).x / tileSize) + 1;
    const startTileY = Math.floor(screenToWorld(0, 0).y / tileSize) - 1;
    const endTileY = Math.ceil(screenToWorld(0, height).y / tileSize) + 1;

    // First pass: Draw all grass
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const screenPos = worldToScreen(x * tileSize, y * tileSize);

        // Use a simple pattern for grass variation
        if ((x + y) % 7 === 0 || (x * y) % 13 === 0) {
          // Draw slightly darker grass for variation
          ctx.fillStyle = "#45A049";
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
            tileSize * camera.zoom,
          );
        } else {
          ctx.fillStyle = "#4CAF50";
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
            tileSize * camera.zoom,
          );
        }
      }
    }

    // Draw roads properly
    town.roads.forEach((road) => {
      road.points.forEach((point, index) => {
        const nextPoint = road.points[index + 1];
        if (!nextPoint && index > 0) return; // Skip last point unless it's the only one

        // Determine road direction and check for intersections
        const isHorizontal =
          !nextPoint ||
          Math.abs(nextPoint.x - point.x) > Math.abs(nextPoint.y - point.y);

        // Check if this is an intersection
        const isIntersection = town.roads.some((otherRoad) => {
          if (otherRoad === road) return false;
          return otherRoad.points.some(
            (p) => Math.abs(p.x - point.x) < 1 && Math.abs(p.y - point.y) < 1,
          );
        });

        const roadSprite = renderTopDownSprite(
          isIntersection
            ? ROAD_CROSS
            : isHorizontal
              ? ROAD_H_TOPDOWN
              : ROAD_V_TOPDOWN,
        );

        // Draw road tiles based on width
        for (let w = 0; w < road.width; w++) {
          const tileX = isHorizontal
            ? point.x
            : point.x - Math.floor(road.width / 2) + w;
          const tileY = isHorizontal
            ? point.y - Math.floor(road.width / 2) + w
            : point.y;

          const screenPos = worldToScreen(tileX * tileSize, tileY * tileSize);
          drawSprite(
            ctx,
            roadSprite,
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
          );
        }
      });
    });

    // Draw town square with stone tiles
    const square = town.townSquare;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const tileX = square.x + x;
        const tileY = square.y + y;
        const screenPos = worldToScreen(tileX * tileSize, tileY * tileSize);

        // Draw plaza tiles
        const plazaSprite = renderTopDownSprite(PLAZA_TOPDOWN);
        drawSprite(
          ctx,
          plazaSprite,
          screenPos.x,
          screenPos.y,
          tileSize * camera.zoom,
        );
      }
    }

    // Draw fountain in center
    if (square.features.includes("fountain")) {
      const fountainX = square.x + square.width / 2 - 1;
      const fountainY = square.y + square.height / 2 - 1;
      const fountainScreen = worldToScreen(
        fountainX * tileSize,
        fountainY * tileSize,
      );
      const fountainSprite = renderTopDownSprite(FOUNTAIN_TOPDOWN);
      // Draw 2x2 fountain
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          drawSprite(
            ctx,
            fountainSprite,
            fountainScreen.x + dx * tileSize * camera.zoom,
            fountainScreen.y + dy * tileSize * camera.zoom,
            tileSize * camera.zoom,
          );
        }
      }
    }

    // Draw green spaces
    town.greenSpaces.forEach((green) => {
      const screenPos = worldToScreen(green.x * tileSize, green.y * tileSize);

      // Draw trees in a more natural pattern
      const numTrees = Math.floor(green.radius * 1.5);
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2 + Math.random() * 0.5;
        const distance =
          green.radius * 0.5 + Math.random() * green.radius * 0.5;
        const treeX =
          screenPos.x + Math.cos(angle) * distance * tileSize * camera.zoom;
        const treeY =
          screenPos.y + Math.sin(angle) * distance * tileSize * camera.zoom;

        const treeSprite = renderTopDownSprite(TREE_TOPDOWN);
        drawSprite(
          ctx,
          treeSprite,
          treeX - (tileSize * camera.zoom) / 2,
          treeY - (tileSize * camera.zoom) / 2,
          tileSize * camera.zoom,
        );
      }
    });

    // Sort buildings by Y position for proper layering
    const sortedBuildings = [...town.buildings].sort((a, b) => a.y - b.y);

    // Draw buildings with shadows
    sortedBuildings.forEach((building) => {
      const screenPos = worldToScreen(
        building.x * tileSize,
        building.y * tileSize,
      );

      // Draw building shadow (smaller for 16x16)
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(
        screenPos.x + 2,
        screenPos.y + 2,
        building.width * tileSize * camera.zoom,
        building.height * tileSize * camera.zoom,
      );

      // Select appropriate sprite
      let sprite;
      switch (building.type) {
        case "house":
          sprite = HOUSE_TOPDOWN;
          break;
        case "shop":
        case "workplace":
          sprite = SHOP_TOPDOWN;
          break;
        case "venue":
          sprite = VENUE_TOPDOWN;
          break;
        case "park":
          // Draw a small tree cluster for parks
          const treeSprite = renderTopDownSprite(TREE_TOPDOWN);
          drawSprite(
            ctx,
            treeSprite,
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
          );
          return; // Skip the rest
        case "community":
          sprite = COMMUNITY_TOPDOWN;
          break;
        default:
          sprite = HOUSE_TOPDOWN;
      }

      const coloredSprite = renderTopDownSprite(sprite);

      // Apply rotation if needed
      if (building.rotation !== 0) {
        ctx.save();
        ctx.translate(
          screenPos.x + (building.width * tileSize * camera.zoom) / 2,
          screenPos.y + (building.height * tileSize * camera.zoom) / 2,
        );
        ctx.rotate((building.rotation * Math.PI) / 180);
        ctx.translate(
          -(screenPos.x + (building.width * tileSize * camera.zoom) / 2),
          -(screenPos.y + (building.height * tileSize * camera.zoom) / 2),
        );
      }

      drawSprite(
        ctx,
        coloredSprite,
        screenPos.x,
        screenPos.y,
        tileSize * camera.zoom,
      );

      if (building.rotation !== 0) {
        ctx.restore();
      }

      // Add subtle life to venues
      if (building.type === "venue" && gameStore.scheduledShows?.length > 0) {
        // Draw a small music note occasionally
        if (Math.random() < 0.05) {
          ctx.fillStyle = TOPDOWN_COLORS["M"];
          ctx.font = "12px Arial";
          ctx.fillText(
            "♪",
            screenPos.x + (building.width * tileSize * camera.zoom) / 2,
            screenPos.y - 5,
          );
        }
      }
    });

    // Draw cleaner UI overlay
    const padding = 10;
    const lineHeight = 20;

    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    const metrics = [
      `Population: ${town.population}`,
      `Growth: ${town.growthStage}/5`,
      `Buildings: ${town.buildings.length}`,
    ];

    const maxWidth =
      Math.max(...metrics.map((m) => ctx.measureText(m).width)) + 20;
    ctx.fillRect(padding, padding, maxWidth, metrics.length * lineHeight + 10);

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    metrics.forEach((metric, i) => {
      ctx.fillText(metric, padding + 10, padding + 20 + i * lineHeight);
    });
  }, [town, camera, width, height, worldToScreen, screenToWorld]);

  // Helper function to draw a sprite
  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    sprite: string[][],
    x: number,
    y: number,
    size: number,
  ) => {
    const pixelSize = size / 16; // 16x16 sprites

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const color = sprite[row][col];
        if (color !== "transparent") {
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(x + col * pixelSize),
            Math.floor(y + row * pixelSize),
            Math.ceil(pixelSize),
            Math.ceil(pixelSize),
          );
        }
      }
    }
  };

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};

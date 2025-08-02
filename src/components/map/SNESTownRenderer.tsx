import React, { useRef, useEffect, useCallback, useState } from "react";
import { ProperTownGenerator } from "@/game/generation/ProperTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import {
  SNES_PALETTE,
  renderSNESSprite,
  SNES_HOUSE,
  SNES_SHOP,
  SNES_VENUE,
  SNES_TREE,
  SNES_FOUNTAIN,
  SNES_GRASS,
  SNES_ROAD_H,
  SNES_ROAD_V,
  SNES_PLAZA,
  SNES_TOWNHALL,
  TILE_DEPTHS,
} from "./sprites/SNESTileset";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface SNESTownRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const SNESTownRenderer: React.FC<SNESTownRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });

  const gameStore = useGameStore();
  const tileSize = 16;

  // Generate town
  useEffect(() => {
    const generator = new ProperTownGenerator(64, 48);
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

    // Center on town square
    if (generatedTown.townSquare) {
      setCamera({
        x:
          generatedTown.townSquare.x * tileSize +
          (generatedTown.townSquare.width * tileSize) / 2,
        y:
          generatedTown.townSquare.y * tileSize +
          (generatedTown.townSquare.height * tileSize) / 2,
        zoom: window.innerWidth < 768 ? 2 : 3,
      });
    }
  }, [
    gameStore.scheduledShows?.length,
    gameStore.showHistory?.length,
    gameStore.venues?.length,
    gameStore.allBands?.length,
    gameStore.reputation,
  ]);

  // Coordinate conversions
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: (worldX - camera.x) * camera.zoom + width / 2,
        y: (worldY - camera.y) * camera.zoom + height / 2,
      };
    },
    [camera, width, height],
  );

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - width / 2) / camera.zoom + camera.x,
        y: (screenY - height / 2) / camera.zoom + camera.y,
      };
    },
    [camera, width, height],
  );

  // Input handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setDragStart({ x, y });
      setCameraStart({ x: camera.x, y: camera.y });

      // Check building clicks
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
        1.5,
        Math.min(5, camera.zoom - e.deltaY * zoomSpeed),
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera],
  );

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with nice sky color
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#98D8E8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Calculate visible tiles
    const startTileX = Math.floor(screenToWorld(0, 0).x / tileSize) - 2;
    const endTileX = Math.ceil(screenToWorld(width, 0).x / tileSize) + 2;
    const startTileY = Math.floor(screenToWorld(0, 0).y / tileSize) - 2;
    const endTileY = Math.ceil(screenToWorld(0, height).y / tileSize) + 2;

    // Layer 1: Grass base
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const screenPos = worldToScreen(x * tileSize, y * tileSize);
        const grassSprite = renderSNESSprite(SNES_GRASS);
        drawSprite(
          ctx,
          grassSprite,
          screenPos.x,
          screenPos.y,
          tileSize * camera.zoom,
        );
      }
    }

    // Layer 2: Roads
    const roadTiles = new Set<string>();
    town.roads.forEach((road) => {
      road.points.forEach((point) => {
        for (let w = 0; w < road.width; w++) {
          const tileX = Math.floor(point.x);
          const tileY = Math.floor(point.y - road.width / 2 + w);
          roadTiles.add(`${tileX},${tileY}`);
        }
      });
    });

    roadTiles.forEach((tileKey) => {
      const [x, y] = tileKey.split(",").map(Number);
      const screenPos = worldToScreen(x * tileSize, y * tileSize);

      // Check if this is a horizontal or vertical road
      const hasNorth = roadTiles.has(`${x},${y - 1}`);
      const hasSouth = roadTiles.has(`${x},${y + 1}`);
      const hasEast = roadTiles.has(`${x + 1},${y}`);
      const hasWest = roadTiles.has(`${x - 1},${y}`);

      const isVertical = hasNorth || hasSouth;
      const isHorizontal = hasEast || hasWest;

      const roadSprite = renderSNESSprite(
        isVertical && !isHorizontal ? SNES_ROAD_V : SNES_ROAD_H,
      );
      drawSprite(
        ctx,
        roadSprite,
        screenPos.x,
        screenPos.y,
        tileSize * camera.zoom,
      );
    });

    // Layer 3: Town square
    const square = town.townSquare;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const tileX = square.x + x;
        const tileY = square.y + y;
        const screenPos = worldToScreen(tileX * tileSize, tileY * tileSize);
        const plazaSprite = renderSNESSprite(SNES_PLAZA);
        drawSprite(
          ctx,
          plazaSprite,
          screenPos.x,
          screenPos.y,
          tileSize * camera.zoom,
        );
      }
    }

    // Fountain in center
    if (square.features.includes("fountain")) {
      const fountainX = square.x + Math.floor(square.width / 2) - 1;
      const fountainY = square.y + Math.floor(square.height / 2) - 1;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const screenPos = worldToScreen(
            (fountainX + dx) * tileSize,
            (fountainY + dy) * tileSize,
          );
          const fountainSprite = renderSNESSprite(SNES_FOUNTAIN);
          drawSprite(
            ctx,
            fountainSprite,
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
          );
        }
      }
    }

    // Layer 4: Green spaces
    town.greenSpaces.forEach((green) => {
      // Plant trees in a natural pattern
      const numTrees = Math.floor(green.radius * green.radius * 0.8);
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2 + i * 0.618; // Golden ratio
        const distance = green.radius * (0.3 + (i % 3) * 0.3);
        const treeX = green.x + Math.cos(angle) * distance;
        const treeY = green.y + Math.sin(angle) * distance;

        const screenPos = worldToScreen(treeX * tileSize, treeY * tileSize);
        const treeSprite = renderSNESSprite(SNES_TREE);
        drawSprite(
          ctx,
          treeSprite,
          screenPos.x,
          screenPos.y,
          tileSize * camera.zoom,
        );
      }
    });

    // Layer 5: Buildings (sorted by Y for depth)
    const sortedBuildings = [...town.buildings].sort((a, b) => a.y - b.y);

    sortedBuildings.forEach((building) => {
      const screenPos = worldToScreen(
        building.x * tileSize,
        building.y * tileSize,
      );

      // Draw building shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(
        screenPos.x + 3,
        screenPos.y + 3,
        building.width * tileSize * camera.zoom,
        building.height * tileSize * camera.zoom,
      );

      // Select sprite based on type
      let sprites: string[][] = [];
      switch (building.type) {
        case "house":
          sprites = [renderSNESSprite(SNES_HOUSE)];
          break;
        case "shop":
        case "workplace":
          sprites = [renderSNESSprite(SNES_SHOP)];
          break;
        case "venue":
          sprites = [renderSNESSprite(SNES_VENUE)];
          break;
        case "community":
          sprites = [renderSNESSprite(SNES_TOWNHALL)];
          break;
        case "park":
          // Parks are just trees
          const treeSprite = renderSNESSprite(SNES_TREE);
          drawSprite(
            ctx,
            treeSprite,
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
          );
          return;
        default:
          sprites = [renderSNESSprite(SNES_HOUSE)];
      }

      // Draw the building
      sprites.forEach((sprite) => {
        drawSprite(
          ctx,
          sprite,
          screenPos.x,
          screenPos.y,
          tileSize * camera.zoom,
        );
      });

      // Add life to venues
      if (building.type === "venue" && gameStore.scheduledShows?.length > 0) {
        if (Math.random() < 0.02) {
          ctx.save();
          ctx.fillStyle = SNES_PALETTE["m"];
          ctx.font = `${12 * camera.zoom}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText(
            "♪",
            screenPos.x + (building.width * tileSize * camera.zoom) / 2,
            screenPos.y - 5 * camera.zoom,
          );
          ctx.restore();
        }
      }
    });

    // UI Overlay
    drawUI(ctx, town);
  }, [
    town,
    camera,
    width,
    height,
    worldToScreen,
    screenToWorld,
    gameStore.scheduledShows?.length,
  ]);

  // Helper to draw sprites
  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    sprite: string[][],
    x: number,
    y: number,
    size: number,
  ) => {
    const pixelSize = size / 16;

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

  // Draw UI
  const drawUI = (ctx: CanvasRenderingContext2D, town: GeneratedTown) => {
    // SNES-style window
    const padding = 8;
    const boxWidth = 200;
    const boxHeight = 72;

    // Window background
    ctx.fillStyle = "#1a237e";
    ctx.fillRect(padding, padding, boxWidth, boxHeight);

    // Window border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    // Inner border
    ctx.strokeStyle = "#3949ab";
    ctx.lineWidth = 1;
    ctx.strokeRect(padding + 4, padding + 4, boxWidth - 8, boxHeight - 8);

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("TOWN INFO", padding + 12, padding + 20);

    ctx.font = "12px monospace";
    ctx.fillText(`Population: ${town.population}`, padding + 12, padding + 38);
    ctx.fillText(`Growth: ${town.growthStage}/5`, padding + 12, padding + 52);
    ctx.fillText(
      `Buildings: ${town.buildings.length}`,
      padding + 12,
      padding + 66,
    );
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
        imageRendering: "pixelated",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};

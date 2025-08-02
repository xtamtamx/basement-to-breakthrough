import React, { useRef, useEffect, useCallback, useState } from "react";
import { ProperTownGenerator } from "@/game/generation/ProperTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import {
  ISO_PALETTE,
  renderIsoSprite,
  ISO_HOUSE,
  ISO_SHOP,
  ISO_VENUE,
  ISO_TREE,
  ISO_FOUNTAIN,
  ISO_GRASS,
  ISO_ROAD_H,
  ISO_PLAZA,
  cartToIso,
  isoToCart,
} from "./sprites/IsometricStardewTiles";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface IsometricTownRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

interface RenderableObject {
  x: number;
  y: number;
  z: number;
  sprite: string[][];
  type: string;
  data?: any;
}

export const IsometricTownRenderer: React.FC<IsometricTownRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });

  const gameStore = useGameStore();
  const tileSize = 32; // Base tile size for isometric tiles

  // Generate town
  useEffect(() => {
    const generator = new ProperTownGenerator(48, 36);
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
      const isoCenter = cartToIso(
        generatedTown.townSquare.x + generatedTown.townSquare.width / 2,
        generatedTown.townSquare.y + generatedTown.townSquare.height / 2,
      );
      setCamera({
        x: isoCenter.x,
        y: isoCenter.y,
        zoom: window.innerWidth < 768 ? 1.5 : 2,
      });
    }
  }, [
    gameStore.scheduledShows?.length,
    gameStore.showHistory?.length,
    gameStore.venues?.length,
    gameStore.allBands?.length,
    gameStore.reputation,
  ]);

  // Coordinate conversions with camera
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
        const cartPos = isoToCart(worldPos.x, worldPos.y);

        const clickedBuilding = town.buildings.find((b) => {
          // Rough hit detection for isometric buildings
          const buildingIso = cartToIso(b.x + b.width / 2, b.y + b.height / 2);
          const distance = Math.sqrt(
            Math.pow(worldPos.x - buildingIso.x, 2) +
              Math.pow(worldPos.y - buildingIso.y, 2),
          );
          return distance < tileSize * camera.zoom;
        });

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

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.5, "#98D8E8");
    gradient.addColorStop(1, "#B8E8F8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = false;

    // Collect all objects to render
    const renderables: RenderableObject[] = [];

    // Add grass tiles
    const visibleStartX =
      Math.floor(isoToCart(screenToWorld(0, 0).x, screenToWorld(0, 0).y).x) - 5;
    const visibleEndX =
      Math.ceil(
        isoToCart(screenToWorld(width, 0).x, screenToWorld(width, 0).y).x,
      ) + 5;
    const visibleStartY =
      Math.floor(
        isoToCart(screenToWorld(0, height).x, screenToWorld(0, height).y).y,
      ) - 5;
    const visibleEndY =
      Math.ceil(
        isoToCart(
          screenToWorld(width, height).x,
          screenToWorld(width, height).y,
        ).y,
      ) + 5;

    // Add grass base
    for (let y = visibleStartY; y <= visibleEndY; y++) {
      for (let x = visibleStartX; x <= visibleEndX; x++) {
        const isoPos = cartToIso(x, y);
        renderables.push({
          x: isoPos.x,
          y: isoPos.y,
          z: 0,
          sprite: renderIsoSprite(ISO_GRASS),
          type: "grass",
        });
      }
    }

    // Add roads
    const roadTiles = new Set<string>();
    town.roads.forEach((road) => {
      road.points.forEach((point) => {
        for (let w = 0; w < road.width; w++) {
          roadTiles.add(
            `${Math.floor(point.x)},${Math.floor(point.y - road.width / 2 + w)}`,
          );
        }
      });
    });

    roadTiles.forEach((tileKey) => {
      const [x, y] = tileKey.split(",").map(Number);
      const isoPos = cartToIso(x, y);
      renderables.push({
        x: isoPos.x,
        y: isoPos.y,
        z: 0.1,
        sprite: renderIsoSprite(ISO_ROAD_H),
        type: "road",
      });
    });

    // Add plaza
    const square = town.townSquare;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const isoPos = cartToIso(square.x + x, square.y + y);
        renderables.push({
          x: isoPos.x,
          y: isoPos.y,
          z: 0.2,
          sprite: renderIsoSprite(ISO_PLAZA),
          type: "plaza",
        });
      }
    }

    // Add fountain
    if (square.features.includes("fountain")) {
      const fountainX = square.x + Math.floor(square.width / 2);
      const fountainY = square.y + Math.floor(square.height / 2);
      const isoPos = cartToIso(fountainX, fountainY);
      renderables.push({
        x: isoPos.x - 16, // Center fountain
        y: isoPos.y - 16,
        z: 1,
        sprite: renderIsoSprite(ISO_FOUNTAIN),
        type: "fountain",
      });
    }

    // Add trees
    town.greenSpaces.forEach((green) => {
      const numTrees = Math.floor(green.radius * green.radius * 0.6);
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2 + i * 0.618;
        const distance = green.radius * (0.3 + (i % 3) * 0.25);
        const treeX = green.x + Math.cos(angle) * distance;
        const treeY = green.y + Math.sin(angle) * distance;
        const isoPos = cartToIso(treeX, treeY);

        renderables.push({
          x: isoPos.x - 16,
          y: isoPos.y - 24,
          z: treeY + 1,
          sprite: renderIsoSprite(ISO_TREE),
          type: "tree",
        });
      }
    });

    // Add buildings
    town.buildings.forEach((building) => {
      let sprite: string[];
      switch (building.type) {
        case "house":
          sprite = ISO_HOUSE;
          break;
        case "shop":
        case "workplace":
          sprite = ISO_SHOP;
          break;
        case "venue":
          sprite = ISO_VENUE;
          break;
        case "community":
          sprite = ISO_HOUSE; // Use house for now
          break;
        default:
          sprite = ISO_HOUSE;
      }

      const isoPos = cartToIso(
        building.x + building.width / 2,
        building.y + building.height / 2,
      );
      renderables.push({
        x: isoPos.x - 16,
        y: isoPos.y - 24,
        z: building.y + building.height,
        sprite: renderIsoSprite(sprite),
        type: "building",
        data: building,
      });
    });

    // Sort by depth (painter's algorithm)
    renderables.sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      return a.y - b.y;
    });

    // Draw all objects
    renderables.forEach((obj) => {
      const screenPos = worldToScreen(obj.x, obj.y);
      drawSprite(ctx, obj.sprite, screenPos.x, screenPos.y, camera.zoom);
    });

    // Draw UI
    drawUI(ctx, town);
  }, [town, camera, width, height, worldToScreen, screenToWorld]);

  // Helper to draw sprites
  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    sprite: string[][],
    x: number,
    y: number,
    zoom: number,
  ) => {
    const pixelSize = zoom;

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
    // Stardew Valley style UI box
    const padding = 12;
    const boxWidth = 240;
    const boxHeight = 80;

    // Outer box
    ctx.fillStyle = "#3a2f0b";
    ctx.fillRect(padding - 2, padding - 2, boxWidth + 4, boxHeight + 4);

    // Inner box
    ctx.fillStyle = "#f4e4c1";
    ctx.fillRect(padding, padding, boxWidth, boxHeight);

    // Border
    ctx.strokeStyle = "#8b6f47";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding + 2, padding + 2, boxWidth - 4, boxHeight - 4);

    // Text
    ctx.fillStyle = "#3a2f0b";
    ctx.font = "bold 16px monospace";
    ctx.fillText("Town of Harmony", padding + 14, padding + 24);

    ctx.font = "14px monospace";
    ctx.fillText(`Population: ${town.population}`, padding + 14, padding + 44);
    ctx.fillText(
      `Growth: ${["Hamlet", "Village", "Town", "City", "Metropolis"][town.growthStage - 1]}`,
      padding + 14,
      padding + 60,
    );

    // Mini icons
    ctx.font = "12px monospace";
    ctx.fillText(
      `🏠 ${town.buildings.filter((b) => b.type === "house").length}`,
      padding + 160,
      padding + 44,
    );
    ctx.fillText(
      `🏪 ${town.buildings.filter((b) => b.type === "shop").length}`,
      padding + 190,
      padding + 44,
    );
    ctx.fillText(
      `🎸 ${town.buildings.filter((b) => b.type === "venue").length}`,
      padding + 160,
      padding + 60,
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

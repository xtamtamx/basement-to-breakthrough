import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface ModernCityRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

// Clean, modern colors
const COLORS = {
  // Base colors
  background: "#E8EAF0",
  grass: "#7CB342",
  grassLight: "#8BC34A",
  road: "#455A64",
  roadLine: "#FFC107",
  sidewalk: "#90A4AE",

  // Building colors
  buildingLight: "#FFFFFF",
  buildingMid: "#F5F5F5",
  buildingDark: "#E0E0E0",
  buildingShadow: "rgba(0, 0, 0, 0.15)",

  // Roofs
  roofRed: "#F44336",
  roofBlue: "#2196F3",
  roofGreen: "#4CAF50",
  roofGray: "#607D8B",
  roofOrange: "#FF9800",

  // Details
  window: "#64B5F6",
  windowDark: "#1976D2",
  door: "#795548",

  // UI
  uiDark: "#263238",
  uiMid: "#37474F",
  uiLight: "#ECEFF1",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0BEC5",
};

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  roofColor: string;
  baseColor: string;
  floors: number;
}

export const ModernCityRenderer: React.FC<ModernCityRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [buildings, setBuildings] = useState<Building[]>([]);

  const gameStore = useGameStore();
  const blockSize = 120; // Size of city blocks
  const streetWidth = 40;

  // Generate city layout
  useEffect(() => {
    const newBuildings: Building[] = [];

    // Calculate growth
    const growth = Math.min(
      5,
      1 +
        Math.floor(
          ((gameStore.venues?.length || 0) * 2 +
            (gameStore.allBands?.length || 0) +
            (gameStore.reputation || 0) * 0.1) /
            5,
        ),
    );

    // City center
    const centerX = 600;
    const centerY = 400;

    // Downtown buildings (always present)
    // Office building
    newBuildings.push({
      x: centerX - 180,
      y: centerY - 60,
      width: 80,
      height: 100,
      type: "office",
      roofColor: COLORS.roofBlue,
      baseColor: COLORS.buildingLight,
      floors: 4,
    });

    // Shop
    newBuildings.push({
      x: centerX - 80,
      y: centerY - 60,
      width: 60,
      height: 80,
      type: "shop",
      roofColor: COLORS.roofRed,
      baseColor: COLORS.buildingMid,
      floors: 2,
    });

    // Music venue
    newBuildings.push({
      x: centerX + 20,
      y: centerY - 60,
      width: 100,
      height: 80,
      type: "venue",
      roofColor: COLORS.roofOrange,
      baseColor: COLORS.buildingDark,
      floors: 1,
    });

    // Expand outward based on growth
    if (growth >= 2) {
      // North residential
      for (let i = 0; i < 6; i++) {
        newBuildings.push({
          x: centerX - 250 + (i % 3) * 90,
          y: centerY - 250 + Math.floor(i / 3) * 70,
          width: 60,
          height: 50,
          type: "house",
          roofColor: COLORS.roofGreen,
          baseColor: COLORS.buildingLight,
          floors: 1,
        });
      }
    }

    if (growth >= 3) {
      // East commercial
      for (let i = 0; i < 4; i++) {
        newBuildings.push({
          x: centerX + 200,
          y: centerY - 150 + i * 80,
          width: 70,
          height: 60,
          type: "shop",
          roofColor: COLORS.roofBlue,
          baseColor: COLORS.buildingMid,
          floors: 2,
        });
      }
    }

    if (growth >= 4) {
      // South residential
      for (let i = 0; i < 9; i++) {
        newBuildings.push({
          x: centerX - 200 + (i % 3) * 80,
          y: centerY + 150 + Math.floor(i / 3) * 60,
          width: 50,
          height: 40,
          type: "house",
          roofColor: COLORS.roofGray,
          baseColor: COLORS.buildingLight,
          floors: 1,
        });
      }

      // Additional venue
      newBuildings.push({
        x: centerX - 100,
        y: centerY + 80,
        width: 80,
        height: 70,
        type: "venue",
        roofColor: COLORS.roofOrange,
        baseColor: COLORS.buildingDark,
        floors: 1,
      });
    }

    setBuildings(newBuildings);

    // Center camera
    setCamera({
      x: centerX,
      y: centerY,
      zoom: window.innerWidth < 768 ? 1.5 : 2.5,
    });
  }, [
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

  // Mouse/touch handlers
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
      if (onBuildingClick) {
        const worldPos = screenToWorld(x, y);

        const clickedBuilding = buildings.find(
          (b) =>
            worldPos.x >= b.x &&
            worldPos.x <= b.x + b.width &&
            worldPos.y >= b.y &&
            worldPos.y <= b.y + b.height,
        );

        if (clickedBuilding) {
          onBuildingClick(clickedBuilding);
          haptics.light();
        }
      }
    },
    [camera, screenToWorld, buildings, onBuildingClick],
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
        0.5,
        Math.min(4, camera.zoom - e.deltaY * zoomSpeed),
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera],
  );

  // Draw a clean, modern building
  const drawBuilding = (ctx: CanvasRenderingContext2D, building: Building) => {
    const pos = worldToScreen(building.x, building.y);
    const w = building.width * camera.zoom;
    const h = building.height * camera.zoom;

    // Shadow
    ctx.fillStyle = COLORS.buildingShadow;
    ctx.fillRect(pos.x + 4, pos.y + 4, w, h);

    // Building base
    ctx.fillStyle = building.baseColor;
    ctx.fillRect(pos.x, pos.y, w, h);

    // Building outline
    ctx.strokeStyle = COLORS.buildingDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x, pos.y, w, h);

    // Roof
    const roofHeight = 20 * camera.zoom;
    ctx.fillStyle = building.roofColor;
    ctx.fillRect(pos.x - 2, pos.y - 2, w + 4, roofHeight);

    // Windows
    if (building.type !== "house") {
      ctx.fillStyle = COLORS.window;
      const windowWidth = 8 * camera.zoom;
      const windowHeight = 12 * camera.zoom;
      const windowSpacingX = 16 * camera.zoom;
      const windowSpacingY = 20 * camera.zoom;

      for (let floor = 0; floor < building.floors; floor++) {
        for (let wx = 0; wx < Math.floor(building.width / 20); wx++) {
          ctx.fillRect(
            pos.x + 8 * camera.zoom + wx * windowSpacingX,
            pos.y + roofHeight + 8 * camera.zoom + floor * windowSpacingY,
            windowWidth,
            windowHeight,
          );
        }
      }
    }

    // Door
    if (building.type === "house" || building.type === "shop") {
      ctx.fillStyle = COLORS.door;
      ctx.fillRect(
        pos.x + w / 2 - 8 * camera.zoom,
        pos.y + h - 20 * camera.zoom,
        16 * camera.zoom,
        20 * camera.zoom,
      );
    }

    // Venue sign
    if (building.type === "venue") {
      ctx.fillStyle = COLORS.roofOrange;
      ctx.fillRect(
        pos.x + 10 * camera.zoom,
        pos.y + 30 * camera.zoom,
        w - 20 * camera.zoom,
        20 * camera.zoom,
      );
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font = `${10 * camera.zoom}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("VENUE", pos.x + w / 2, pos.y + 45 * camera.zoom);
    }
  };

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Draw grass base
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, width, height);

    // Draw roads in a grid pattern
    const centerX = 600;
    const centerY = 400;

    // Main roads
    const roads = [
      // Horizontal
      {
        x1: 0,
        y1: centerY - streetWidth / 2,
        x2: 1200,
        y2: centerY + streetWidth / 2,
      },
      {
        x1: 0,
        y1: centerY - 200 - streetWidth / 2,
        x2: 1200,
        y2: centerY - 200 + streetWidth / 2,
      },
      {
        x1: 0,
        y1: centerY + 200 - streetWidth / 2,
        x2: 1200,
        y2: centerY + 200 + streetWidth / 2,
      },
      // Vertical
      {
        x1: centerX - streetWidth / 2,
        y1: 0,
        x2: centerX + streetWidth / 2,
        y2: 800,
      },
      {
        x1: centerX - 300 - streetWidth / 2,
        y1: 0,
        x2: centerX - 300 + streetWidth / 2,
        y2: 800,
      },
      {
        x1: centerX + 300 - streetWidth / 2,
        y1: 0,
        x2: centerX + 300 + streetWidth / 2,
        y2: 800,
      },
    ];

    roads.forEach((road) => {
      const start = worldToScreen(road.x1, road.y1);
      const end = worldToScreen(road.x2, road.y2);

      // Road surface
      ctx.fillStyle = COLORS.road;
      ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);

      // Center line
      if (road.x1 === road.x2) {
        // Vertical road
        ctx.strokeStyle = COLORS.roadLine;
        ctx.lineWidth = 2 * camera.zoom;
        ctx.setLineDash([20 * camera.zoom, 20 * camera.zoom]);
        ctx.beginPath();
        ctx.moveTo((start.x + end.x) / 2, start.y);
        ctx.lineTo((start.x + end.x) / 2, end.y);
        ctx.stroke();
      } else {
        // Horizontal road
        ctx.strokeStyle = COLORS.roadLine;
        ctx.lineWidth = 2 * camera.zoom;
        ctx.setLineDash([20 * camera.zoom, 20 * camera.zoom]);
        ctx.beginPath();
        ctx.moveTo(start.x, (start.y + end.y) / 2);
        ctx.lineTo(end.x, (start.y + end.y) / 2);
        ctx.stroke();
      }
    });
    ctx.setLineDash([]);

    // Draw sidewalks
    ctx.fillStyle = COLORS.sidewalk;
    roads.forEach((road) => {
      const start = worldToScreen(road.x1, road.y1);
      const end = worldToScreen(road.x2, road.y2);

      if (road.x1 === road.x2) {
        // Vertical sidewalks
        ctx.fillRect(
          start.x - 8 * camera.zoom,
          start.y,
          8 * camera.zoom,
          end.y - start.y,
        );
        ctx.fillRect(end.x, start.y, 8 * camera.zoom, end.y - start.y);
      } else {
        // Horizontal sidewalks
        ctx.fillRect(
          start.x,
          start.y - 8 * camera.zoom,
          end.x - start.x,
          8 * camera.zoom,
        );
        ctx.fillRect(start.x, end.y, end.x - start.x, 8 * camera.zoom);
      }
    });

    // Draw trees
    const trees = [
      { x: 480, y: 320 },
      { x: 520, y: 340 },
      { x: 720, y: 320 },
      { x: 760, y: 340 },
      { x: 480, y: 460 },
      { x: 520, y: 480 },
      { x: 720, y: 460 },
      { x: 760, y: 480 },
    ];

    trees.forEach((tree) => {
      const pos = worldToScreen(tree.x, tree.y);

      // Tree shadow
      ctx.fillStyle = COLORS.buildingShadow;
      ctx.beginPath();
      ctx.ellipse(
        pos.x + 2,
        pos.y + 25 * camera.zoom,
        20 * camera.zoom,
        10 * camera.zoom,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Tree trunk
      ctx.fillStyle = COLORS.door;
      ctx.fillRect(
        pos.x - 4 * camera.zoom,
        pos.y + 10 * camera.zoom,
        8 * camera.zoom,
        15 * camera.zoom,
      );

      // Tree foliage
      ctx.fillStyle = COLORS.roofGreen;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.grassLight;
      ctx.beginPath();
      ctx.arc(
        pos.x - 5 * camera.zoom,
        pos.y - 5 * camera.zoom,
        15 * camera.zoom,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    // Sort and draw buildings
    const sortedBuildings = [...buildings].sort((a, b) => a.y - b.y);
    sortedBuildings.forEach((building) => drawBuilding(ctx, building));

    // Draw UI
    drawUI(ctx);
  }, [camera, width, height, worldToScreen, buildings]);

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Clean status bar
    const barHeight = 60;
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(0, 0, width, barHeight);

    // City name
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
    ctx.fillText("Harmony City", 20, 35);

    // Stats
    const stats = [
      { icon: "👥", value: buildings.length * 15, label: "Population" },
      {
        icon: "🎸",
        value: buildings.filter((b) => b.type === "venue").length,
        label: "Venues",
      },
      { icon: "💰", value: gameStore.money || 0, label: "Funds" },
    ];

    stats.forEach((stat, i) => {
      const x = 250 + i * 150;
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
      ctx.fillText(stat.icon + " " + stat.label, x, 20);
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font =
        'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
      ctx.fillText(stat.value.toString(), x, 42);
    });
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

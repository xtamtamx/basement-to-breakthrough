import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "shop" | "venue" | "workplace" | "community" | "park";
  color: string;
}

interface NormalTownRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const NormalTownRenderer: React.FC<NormalTownRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 400, y: 300, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });

  const gameStore = useGameStore();

  // Simple town layout
  const buildings: Building[] = [];

  // Main street - horizontal through center
  const mainStreetY = 300;
  const mainStreetWidth = 60;

  // Town square in center
  const townSquareX = 350;
  const townSquareY = 270;
  const townSquareSize = 100;

  // Buildings along main street - north side
  for (let i = 0; i < 8; i++) {
    if (i === 3 || i === 4) continue; // Skip town square area
    buildings.push({
      x: 100 + i * 80,
      y: mainStreetY - mainStreetWidth - 40,
      width: 60,
      height: 40,
      type: i % 3 === 0 ? "shop" : "house",
      color: i % 3 === 0 ? "#E57373" : "#81C784",
    });
  }

  // Buildings along main street - south side
  for (let i = 0; i < 8; i++) {
    if (i === 3 || i === 4) continue; // Skip town square area
    buildings.push({
      x: 100 + i * 80,
      y: mainStreetY + mainStreetWidth,
      width: 60,
      height: 40,
      type: i % 4 === 0 ? "venue" : i % 2 === 0 ? "workplace" : "house",
      color: i % 4 === 0 ? "#9C27B0" : i % 2 === 0 ? "#FF9800" : "#81C784",
    });
  }

  // Side streets with houses
  const sideStreetXPositions = [200, 500];
  sideStreetXPositions.forEach((streetX) => {
    // North residential
    for (let i = 0; i < 4; i++) {
      buildings.push({
        x: streetX - 80,
        y: 50 + i * 50,
        width: 50,
        height: 35,
        type: "house",
        color: "#81C784",
      });
      buildings.push({
        x: streetX + 30,
        y: 50 + i * 50,
        width: 50,
        height: 35,
        type: "house",
        color: "#81C784",
      });
    }

    // South residential
    for (let i = 0; i < 4; i++) {
      buildings.push({
        x: streetX - 80,
        y: 400 + i * 50,
        width: 50,
        height: 35,
        type: "house",
        color: "#81C784",
      });
      buildings.push({
        x: streetX + 30,
        y: 400 + i * 50,
        width: 50,
        height: 35,
        type: "house",
        color: "#81C784",
      });
    }
  });

  // Add important buildings around town square
  buildings.push({
    x: townSquareX - 70,
    y: townSquareY + 20,
    width: 60,
    height: 60,
    type: "community",
    color: "#3F51B5",
  });

  buildings.push({
    x: townSquareX + townSquareSize + 10,
    y: townSquareY + 20,
    width: 60,
    height: 60,
    type: "venue",
    color: "#9C27B0",
  });

  // Scale buildings based on game progress
  const growthFactor = Math.min(5, 1 + (gameStore.venues?.length || 0) * 0.5);
  const visibleBuildings = buildings.slice(
    0,
    Math.floor(buildings.length * (growthFactor / 5)),
  );

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
      if (onBuildingClick) {
        const worldPos = screenToWorld(x, y);

        const clickedBuilding = visibleBuildings.find(
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
    [camera, screenToWorld, onBuildingClick, visibleBuildings],
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
        Math.min(2, camera.zoom - e.deltaY * zoomSpeed),
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera],
  );

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with nice background
    ctx.fillStyle = "#E8F5E9";
    ctx.fillRect(0, 0, width, height);

    // Draw grass/ground
    ctx.fillStyle = "#66BB6A";
    ctx.fillRect(0, 0, width, height);

    // Draw roads
    ctx.fillStyle = "#424242";

    // Main street
    const mainStreetScreen = worldToScreen(
      0,
      mainStreetY - mainStreetWidth / 2,
    );
    const mainStreetEndScreen = worldToScreen(
      800,
      mainStreetY + mainStreetWidth / 2,
    );
    ctx.fillRect(
      mainStreetScreen.x,
      mainStreetScreen.y,
      mainStreetEndScreen.x - mainStreetScreen.x,
      mainStreetEndScreen.y - mainStreetScreen.y,
    );

    // Draw road lines
    ctx.strokeStyle = "#FDD835";
    ctx.lineWidth = 2 * camera.zoom;
    ctx.setLineDash([10 * camera.zoom, 10 * camera.zoom]);
    ctx.beginPath();
    const centerLine = worldToScreen(0, mainStreetY);
    const centerLineEnd = worldToScreen(800, mainStreetY);
    ctx.moveTo(centerLine.x, centerLine.y);
    ctx.lineTo(centerLineEnd.x, centerLineEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Side streets
    sideStreetXPositions.forEach((streetX) => {
      const sideStreetStart = worldToScreen(streetX - 20, 0);
      const sideStreetEnd = worldToScreen(streetX + 20, 600);
      ctx.fillStyle = "#424242";
      ctx.fillRect(
        sideStreetStart.x,
        sideStreetStart.y,
        sideStreetEnd.x - sideStreetStart.x,
        sideStreetEnd.y - sideStreetStart.y,
      );
    });

    // Draw sidewalks
    ctx.fillStyle = "#BDBDBD";
    // North sidewalk
    const northSidewalk = worldToScreen(
      0,
      mainStreetY - mainStreetWidth / 2 - 10,
    );
    const northSidewalkEnd = worldToScreen(
      800,
      mainStreetY - mainStreetWidth / 2,
    );
    ctx.fillRect(
      northSidewalk.x,
      northSidewalk.y,
      northSidewalkEnd.x - northSidewalk.x,
      northSidewalkEnd.y - northSidewalk.y,
    );
    // South sidewalk
    const southSidewalk = worldToScreen(0, mainStreetY + mainStreetWidth / 2);
    const southSidewalkEnd = worldToScreen(
      800,
      mainStreetY + mainStreetWidth / 2 + 10,
    );
    ctx.fillRect(
      southSidewalk.x,
      southSidewalk.y,
      southSidewalkEnd.x - southSidewalk.x,
      southSidewalkEnd.y - southSidewalk.y,
    );

    // Draw town square
    const squarePos = worldToScreen(townSquareX, townSquareY);
    const squareEnd = worldToScreen(
      townSquareX + townSquareSize,
      townSquareY + townSquareSize,
    );
    ctx.fillStyle = "#E0E0E0";
    ctx.fillRect(
      squarePos.x,
      squarePos.y,
      squareEnd.x - squarePos.x,
      squareEnd.y - squarePos.y,
    );

    // Draw fountain
    const fountainCenter = worldToScreen(
      townSquareX + townSquareSize / 2,
      townSquareY + townSquareSize / 2,
    );
    ctx.fillStyle = "#64B5F6";
    ctx.beginPath();
    ctx.arc(
      fountainCenter.x,
      fountainCenter.y,
      20 * camera.zoom,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Draw trees
    const treePositions = [
      { x: 150, y: 150 },
      { x: 250, y: 100 },
      { x: 450, y: 150 },
      { x: 550, y: 100 },
      { x: 650, y: 150 },
      { x: 150, y: 450 },
      { x: 250, y: 500 },
      { x: 450, y: 450 },
      { x: 550, y: 500 },
      { x: 650, y: 450 },
    ];

    treePositions.forEach((tree) => {
      const treePos = worldToScreen(tree.x, tree.y);
      ctx.fillStyle = "#2E7D32";
      ctx.beginPath();
      ctx.arc(treePos.x, treePos.y, 15 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6D4C41";
      ctx.fillRect(
        treePos.x - 3 * camera.zoom,
        treePos.y + 10 * camera.zoom,
        6 * camera.zoom,
        10 * camera.zoom,
      );
    });

    // Draw buildings
    visibleBuildings.forEach((building) => {
      const pos = worldToScreen(building.x, building.y);
      const endPos = worldToScreen(
        building.x + building.width,
        building.y + building.height,
      );

      // Building shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(
        pos.x + 3 * camera.zoom,
        pos.y + 3 * camera.zoom,
        endPos.x - pos.x,
        endPos.y - pos.y,
      );

      // Building
      ctx.fillStyle = building.color;
      ctx.fillRect(pos.x, pos.y, endPos.x - pos.x, endPos.y - pos.y);

      // Roof
      ctx.fillStyle = "#795548";
      ctx.fillRect(pos.x, pos.y, endPos.x - pos.x, (endPos.y - pos.y) * 0.3);

      // Windows
      if (building.type === "house" || building.type === "shop") {
        ctx.fillStyle = "#FFEB3B";
        const windowSize = 8 * camera.zoom;
        ctx.fillRect(
          pos.x + 10 * camera.zoom,
          pos.y + (endPos.y - pos.y) * 0.5,
          windowSize,
          windowSize,
        );
        ctx.fillRect(
          endPos.x - 10 * camera.zoom - windowSize,
          pos.y + (endPos.y - pos.y) * 0.5,
          windowSize,
          windowSize,
        );
      }

      // Label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${12 * camera.zoom}px Arial`;
      ctx.textAlign = "center";
      const label =
        building.type === "house"
          ? "🏠"
          : building.type === "shop"
            ? "🏪"
            : building.type === "venue"
              ? "🎸"
              : building.type === "workplace"
                ? "💼"
                : building.type === "community"
                  ? "🏛️"
                  : "";
      ctx.fillText(
        label,
        (pos.x + endPos.x) / 2,
        (pos.y + endPos.y) / 2 + 5 * camera.zoom,
      );
    });

    // Draw UI
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Harmony Heights", 20, 30);
    ctx.font = "14px Arial";
    ctx.fillText(`Population: ${50 + visibleBuildings.length * 4}`, 20, 50);
    ctx.fillText(`Buildings: ${visibleBuildings.length}`, 120, 50);
  }, [camera, width, height, worldToScreen, visibleBuildings]);

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

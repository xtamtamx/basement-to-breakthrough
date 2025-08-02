import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface SimCityTownRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

// SimCity 2000 style colors
const COLORS = {
  // Terrain
  grass: "#4a7c3c",
  grassDark: "#3d6b2f",
  road: "#5a5a5a",
  roadLine: "#c8c800",
  sidewalk: "#8a8a8a",

  // Zones
  residential: "#1e7e34",
  commercial: "#0069d9",
  industrial: "#ffc107",

  // Buildings
  houseSiding: "#f8f9fa",
  houseRoof: "#6c757d",
  shopBase: "#e3f2fd",
  shopRoof: "#1976d2",
  venueBase: "#f3e5f5",
  venueRoof: "#7b1fa2",
  officeBase: "#fff3e0",
  officeRoof: "#f57c00",

  // UI
  gridLine: "rgba(255, 255, 255, 0.1)",
  water: "#4fc3f7",
};

export const SimCityTownRenderer: React.FC<SimCityTownRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });

  const gameStore = useGameStore();
  const tileSize = 32;
  const mapWidth = 64;
  const mapHeight = 64;

  // Generate city blocks
  const [cityData, setCityData] = useState<any>(null);

  useEffect(() => {
    // Calculate development level
    const stats = {
      shows:
        (gameStore.scheduledShows?.length || 0) +
        (gameStore.showHistory?.length || 0),
      venues: gameStore.venues?.length || 0,
      bands: gameStore.allBands?.length || 0,
      reputation: gameStore.reputation || 0,
    };

    const developmentLevel = Math.min(
      5,
      Math.floor(
        (stats.shows * 0.1 +
          stats.venues * 0.3 +
          stats.bands * 0.2 +
          stats.reputation * 0.01) /
          2,
      ),
    );

    // Create city grid
    const grid = Array(mapHeight)
      .fill(null)
      .map(() => Array(mapWidth).fill("grass"));
    const buildings = [];

    // Main roads - create a proper grid
    const mainRoadInterval = 8;
    for (let x = 0; x < mapWidth; x += mainRoadInterval) {
      for (let y = 0; y < mapHeight; y++) {
        if (x < mapWidth) grid[y][x] = "road";
      }
    }
    for (let y = 0; y < mapHeight; y += mainRoadInterval) {
      for (let x = 0; x < mapWidth; x++) {
        if (y < mapHeight) grid[y][x] = "road";
      }
    }

    // Downtown area (center)
    const downtownX = Math.floor(mapWidth / 2) - 8;
    const downtownY = Math.floor(mapHeight / 2) - 8;

    // Place initial buildings in downtown
    const buildingTypes = [
      {
        type: "office",
        width: 2,
        height: 2,
        color: COLORS.officeBase,
        roof: COLORS.officeRoof,
      },
      {
        type: "shop",
        width: 2,
        height: 2,
        color: COLORS.shopBase,
        roof: COLORS.shopRoof,
      },
      {
        type: "venue",
        width: 3,
        height: 3,
        color: COLORS.venueBase,
        roof: COLORS.venueRoof,
      },
      {
        type: "house",
        width: 1,
        height: 1,
        color: COLORS.houseSiding,
        roof: COLORS.houseRoof,
      },
    ];

    // Place buildings in city blocks
    for (let blockY = 0; blockY < 4; blockY++) {
      for (let blockX = 0; blockX < 4; blockX++) {
        const baseX = downtownX + blockX * mainRoadInterval + 1;
        const baseY = downtownY + blockY * mainRoadInterval + 1;

        if (Math.random() < 0.7 - blockY * 0.1) {
          // Less density as we go out
          const buildingType =
            buildingTypes[Math.floor(Math.random() * buildingTypes.length)];

          // Check if space is available
          let canPlace = true;
          for (let dy = 0; dy < buildingType.height; dy++) {
            for (let dx = 0; dx < buildingType.width; dx++) {
              if (
                baseX + dx >= mapWidth ||
                baseY + dy >= mapHeight ||
                grid[baseY + dy][baseX + dx] !== "grass"
              ) {
                canPlace = false;
                break;
              }
            }
          }

          if (canPlace) {
            buildings.push({
              x: baseX,
              y: baseY,
              width: buildingType.width,
              height: buildingType.height,
              type: buildingType.type,
              color: buildingType.color,
              roof: buildingType.roof,
              floors: Math.floor(Math.random() * 3) + 1,
            });

            // Mark grid
            for (let dy = 0; dy < buildingType.height; dy++) {
              for (let dx = 0; dx < buildingType.width; dx++) {
                grid[baseY + dy][baseX + dx] = "building";
              }
            }
          }
        }
      }
    }

    // Residential areas
    if (developmentLevel >= 1) {
      // Northwest residential
      for (let y = 4; y < 20; y += 2) {
        for (let x = 4; x < 20; x += 2) {
          if (grid[y][x] === "grass" && Math.random() < 0.6) {
            buildings.push({
              x,
              y,
              width: 1,
              height: 1,
              type: "house",
              color: COLORS.houseSiding,
              roof: COLORS.houseRoof,
              floors: 1,
            });
            grid[y][x] = "building";
          }
        }
      }
    }

    // More development based on progress
    if (developmentLevel >= 2) {
      // Southeast commercial
      for (let y = 36; y < 48; y += 3) {
        for (let x = 36; x < 48; x += 3) {
          if (
            grid[y][x] === "grass" &&
            grid[y + 1] &&
            grid[y][x + 1] &&
            grid[y + 1][x] === "grass" &&
            grid[y][x + 1] === "grass" &&
            grid[y + 1][x + 1] === "grass" &&
            Math.random() < 0.5
          ) {
            buildings.push({
              x,
              y,
              width: 2,
              height: 2,
              type: "shop",
              color: COLORS.shopBase,
              roof: COLORS.shopRoof,
              floors: Math.floor(Math.random() * 2) + 1,
            });
            grid[y][x] = "building";
            grid[y + 1][x] = "building";
            grid[y][x + 1] = "building";
            grid[y + 1][x + 1] = "building";
          }
        }
      }
    }

    // Parks/green spaces
    const parks = [];
    if (developmentLevel >= 1) {
      parks.push({ x: 12, y: 12, width: 4, height: 4 });
      if (developmentLevel >= 3) {
        parks.push({ x: 44, y: 44, width: 3, height: 3 });
      }
    }

    setCityData({ grid, buildings, parks, developmentLevel });

    // Center camera
    setCamera({
      x: (mapWidth * tileSize) / 2,
      y: (mapHeight * tileSize) / 2,
      zoom: window.innerWidth < 768 ? 1.5 : 2,
    });
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
      if (cityData && onBuildingClick) {
        const worldPos = screenToWorld(x, y);
        const tileX = Math.floor(worldPos.x / tileSize);
        const tileY = Math.floor(worldPos.y / tileSize);

        const clickedBuilding = cityData.buildings.find(
          (b: any) =>
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
    [camera, screenToWorld, cityData, onBuildingClick],
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
        0.8,
        Math.min(4, camera.zoom - e.deltaY * zoomSpeed),
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera],
  );

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cityData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible tiles
    const startTileX = Math.max(
      0,
      Math.floor(screenToWorld(0, 0).x / tileSize),
    );
    const endTileX = Math.min(
      mapWidth,
      Math.ceil(screenToWorld(width, 0).x / tileSize),
    );
    const startTileY = Math.max(
      0,
      Math.floor(screenToWorld(0, 0).y / tileSize),
    );
    const endTileY = Math.min(
      mapHeight,
      Math.ceil(screenToWorld(0, height).y / tileSize),
    );

    // Draw terrain
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const screenPos = worldToScreen(x * tileSize, y * tileSize);
        const tile = cityData.grid[y]?.[x];

        if (tile === "grass") {
          // Grass with subtle variation
          ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassDark;
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
            tileSize * camera.zoom,
          );
        } else if (tile === "road") {
          // Road
          ctx.fillStyle = COLORS.road;
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            tileSize * camera.zoom,
            tileSize * camera.zoom,
          );

          // Road markings
          const nextX = cityData.grid[y]?.[x + 1];
          const nextY = cityData.grid[y + 1]?.[x];

          if (nextX === "road" && x % 2 === 0) {
            ctx.fillStyle = COLORS.roadLine;
            ctx.fillRect(
              screenPos.x + tileSize * camera.zoom * 0.45,
              screenPos.y + tileSize * camera.zoom * 0.1,
              tileSize * camera.zoom * 0.1,
              tileSize * camera.zoom * 0.8,
            );
          }

          if (nextY === "road" && y % 2 === 0) {
            ctx.fillStyle = COLORS.roadLine;
            ctx.fillRect(
              screenPos.x + tileSize * camera.zoom * 0.1,
              screenPos.y + tileSize * camera.zoom * 0.45,
              tileSize * camera.zoom * 0.8,
              tileSize * camera.zoom * 0.1,
            );
          }
        }
      }
    }

    // Draw parks
    cityData.parks.forEach((park: any) => {
      const screenPos = worldToScreen(park.x * tileSize, park.y * tileSize);
      const endPos = worldToScreen(
        (park.x + park.width) * tileSize,
        (park.y + park.height) * tileSize,
      );

      // Park base
      ctx.fillStyle = "#66bb6a";
      ctx.fillRect(
        screenPos.x,
        screenPos.y,
        endPos.x - screenPos.x,
        endPos.y - screenPos.y,
      );

      // Trees
      for (let i = 0; i < (park.width * park.height) / 2; i++) {
        const treeX = park.x + Math.random() * park.width;
        const treeY = park.y + Math.random() * park.height;
        const treeScreen = worldToScreen(treeX * tileSize, treeY * tileSize);

        ctx.fillStyle = "#2e7d32";
        ctx.beginPath();
        ctx.arc(treeScreen.x, treeScreen.y, 4 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Sort buildings by Y for proper layering
    const sortedBuildings = [...cityData.buildings].sort(
      (a: any, b: any) => a.y - b.y,
    );

    // Draw buildings
    sortedBuildings.forEach((building: any) => {
      const screenPos = worldToScreen(
        building.x * tileSize,
        building.y * tileSize,
      );
      const buildingWidth = building.width * tileSize * camera.zoom;
      const buildingHeight = building.height * tileSize * camera.zoom;

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(
        screenPos.x + 2 * camera.zoom,
        screenPos.y + 2 * camera.zoom,
        buildingWidth,
        buildingHeight,
      );

      // Building base
      ctx.fillStyle = building.color;
      ctx.fillRect(screenPos.x, screenPos.y, buildingWidth, buildingHeight);

      // Building details
      if (building.type === "office" || building.type === "shop") {
        // Windows
        ctx.fillStyle = "rgba(64, 64, 64, 0.3)";
        const windowSize = 4 * camera.zoom;
        const windowSpacing = 8 * camera.zoom;

        for (let floor = 0; floor < building.floors; floor++) {
          for (let wx = 0; wx < building.width; wx++) {
            ctx.fillRect(
              screenPos.x + wx * windowSpacing + 4 * camera.zoom,
              screenPos.y + floor * windowSpacing + 4 * camera.zoom,
              windowSize,
              windowSize,
            );
          }
        }
      }

      // Roof
      ctx.fillStyle = building.roof;
      ctx.fillRect(
        screenPos.x - 1 * camera.zoom,
        screenPos.y - 1 * camera.zoom,
        buildingWidth + 2 * camera.zoom,
        4 * camera.zoom,
      );

      // Venue lights
      if (building.type === "venue" && gameStore.scheduledShows?.length > 0) {
        ctx.fillStyle = "#ffeb3b";
        ctx.globalAlpha = 0.8;
        ctx.fillRect(
          screenPos.x + buildingWidth * 0.2,
          screenPos.y + buildingHeight * 0.3,
          buildingWidth * 0.6,
          buildingHeight * 0.4,
        );
        ctx.globalAlpha = 1;
      }
    });

    // Draw grid overlay (subtle)
    if (camera.zoom > 1.5) {
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 1;

      for (let y = startTileY; y <= endTileY; y++) {
        const screenY = worldToScreen(0, y * tileSize).y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
        ctx.stroke();
      }

      for (let x = startTileX; x <= endTileX; x++) {
        const screenX = worldToScreen(x * tileSize, 0).x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
        ctx.stroke();
      }
    }

    // UI
    drawUI(ctx);
  }, [
    cityData,
    camera,
    width,
    height,
    worldToScreen,
    screenToWorld,
    gameStore.scheduledShows?.length,
  ]);

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // SimCity style info panel
    const panelHeight = 80;
    ctx.fillStyle = "#263238";
    ctx.fillRect(0, 0, width, panelHeight);

    ctx.fillStyle = "#37474f";
    ctx.fillRect(0, panelHeight - 2, width, 2);

    // City name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("New Harmony", 20, 30);

    // Stats
    ctx.font = "14px Arial";
    ctx.fillStyle = "#b0bec5";

    const stats = [
      {
        label: "Population",
        value: cityData?.buildings.length * 12 || 0,
        x: 20,
      },
      {
        label: "Venues",
        value:
          cityData?.buildings.filter((b: any) => b.type === "venue").length ||
          0,
        x: 150,
      },
      {
        label: "Development",
        value: `${(cityData?.developmentLevel || 0) * 20}%`,
        x: 250,
      },
      { label: "Funds", value: `$${gameStore.money || 0}`, x: 380 },
    ];

    stats.forEach((stat) => {
      ctx.fillText(stat.label, stat.x, 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Arial";
      ctx.fillText(stat.value.toString(), stat.x, 68);
      ctx.fillStyle = "#b0bec5";
      ctx.font = "14px Arial";
    });

    // Zone indicator
    const zoneColors = [
      { type: "Residential", color: COLORS.residential },
      { type: "Commercial", color: COLORS.commercial },
      { type: "Music Venues", color: COLORS.venueRoof },
    ];

    zoneColors.forEach((zone, i) => {
      ctx.fillStyle = zone.color;
      ctx.fillRect(width - 200 + i * 60, 20, 15, 15);
      ctx.fillStyle = "#b0bec5";
      ctx.font = "11px Arial";
      ctx.fillText(zone.type, width - 200 + i * 60, 50);
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
        backgroundColor: "#37474f",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};

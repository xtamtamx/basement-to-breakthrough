import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface Building {
  id: string;
  x: number; // Tile position
  y: number;
  type: 'house' | 'shop' | 'venue' | 'workplace' | 'community';
  name: string;
  spriteRow: number; // Which row in sprite sheet
  spriteCol: number; // Which column in sprite sheet
}

interface ProperStardewRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const ProperStardewRenderer: React.FC<ProperStardewRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 400, y: 300, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [houseSprites, setHouseSprites] = useState<HTMLImageElement | null>(null);
  const [terrainSprites, setTerrainSprites] = useState<HTMLImageElement | null>(null);
  
  const gameStore = useGameStore();
  const TILE_SIZE = 16; // Base tile size
  const BUILDING_SIZE = 32; // Buildings are 32x32
  const MAP_WIDTH = 30;
  const MAP_HEIGHT = 25;
  
  // Load sprites
  useEffect(() => {
    const houseImg = new Image();
    houseImg.src = "/assets/sprites/town/houses-sprite-sheet.png";
    houseImg.onload = () => setHouseSprites(houseImg);
    
    const terrainImg = new Image();
    terrainImg.src = "/assets/sprites/town/grasslands-tileset.png";
    terrainImg.onload = () => setTerrainSprites(terrainImg);
  }, []);
  
  // Create town layout
  useEffect(() => {
    const newBuildings: Building[] = [];
    let id = 0;
    
    // Town center area
    const centerX = Math.floor(MAP_WIDTH / 2);
    const centerY = Math.floor(MAP_HEIGHT / 2);
    
    // Main venue - The Basement (purple building)
    newBuildings.push({
      id: `venue-${id++}`,
      x: centerX * TILE_SIZE,
      y: (centerY - 2) * TILE_SIZE,
      type: 'venue',
      name: 'The Basement',
      spriteRow: 8, // Purple buildings row
      spriteCol: 0
    });
    
    // Coffee Shop (brown shop)
    newBuildings.push({
      id: `shop-${id++}`,
      x: (centerX - 3) * TILE_SIZE,
      y: (centerY - 2) * TILE_SIZE,
      type: 'shop',
      name: 'Coffee Shop',
      spriteRow: 10, // Brown buildings row
      spriteCol: 2
    });
    
    // Music Store (green shop)
    newBuildings.push({
      id: `shop-${id++}`,
      x: (centerX + 3) * TILE_SIZE,
      y: (centerY - 2) * TILE_SIZE,
      type: 'shop',
      name: 'Music Store',
      spriteRow: 7, // Green buildings row
      spriteCol: 1
    });
    
    // Record Shop (gray building)
    newBuildings.push({
      id: `shop-${id++}`,
      x: (centerX - 3) * TILE_SIZE,
      y: (centerY + 2) * TILE_SIZE,
      type: 'shop',
      name: 'Record Shop',
      spriteRow: 1, // Gray buildings row
      spriteCol: 0
    });
    
    // Office/Workplace (tall building)
    newBuildings.push({
      id: `workplace-${id++}`,
      x: (centerX + 3) * TILE_SIZE,
      y: (centerY + 2) * TILE_SIZE,
      type: 'workplace',
      name: 'Day Job Office',
      spriteRow: 9, // Tall office buildings
      spriteCol: 0
    });
    
    // Community Center (large building)
    newBuildings.push({
      id: `community-${id++}`,
      x: centerX * TILE_SIZE,
      y: (centerY + 2) * TILE_SIZE,
      type: 'community',
      name: 'Community Center',
      spriteRow: 11, // Warehouse/community buildings
      spriteCol: 1
    });
    
    // Residential houses around the edges
    // Top row of houses
    for (let i = 0; i < 6; i++) {
      newBuildings.push({
        id: `house-${id++}`,
        x: (5 + i * 3) * TILE_SIZE,
        y: 3 * TILE_SIZE,
        type: 'house',
        name: 'House',
        spriteRow: i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 6, // Vary house styles
        spriteCol: i % 4
      });
    }
    
    // Bottom row of houses
    for (let i = 0; i < 6; i++) {
      newBuildings.push({
        id: `house-${id++}`,
        x: (5 + i * 3) * TILE_SIZE,
        y: (MAP_HEIGHT - 4) * TILE_SIZE,
        type: 'house',
        name: 'House',
        spriteRow: i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 6,
        spriteCol: (i + 2) % 4
      });
    }
    
    // Add second venue if reputation is good
    if (gameStore.reputation > 30) {
      newBuildings.push({
        id: `venue-${id++}`,
        x: (centerX - 6) * TILE_SIZE,
        y: centerY * TILE_SIZE,
        type: 'venue',
        name: 'Rock Club',
        spriteRow: 4, // Blue buildings
        spriteCol: 1
      });
    }
    
    setBuildings(newBuildings);
  }, [gameStore.reputation]);
  
  // Coordinate conversions
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: (worldX - camera.x) * camera.zoom + width / 2,
        y: (worldY - camera.y) * camera.zoom + height / 2,
      };
    },
    [camera, width, height]
  );
  
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - width / 2) / camera.zoom + camera.x,
        y: (screenY - height / 2) / camera.zoom + camera.y,
      };
    },
    [camera, width, height]
  );
  
  // Mouse handlers
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
      const worldPos = screenToWorld(x, y);
      
      const clickedBuilding = buildings.find(b => 
        worldPos.x >= b.x &&
        worldPos.x <= b.x + BUILDING_SIZE &&
        worldPos.y >= b.y &&
        worldPos.y <= b.y + BUILDING_SIZE
      );
      
      if (clickedBuilding && onBuildingClick) {
        onBuildingClick(clickedBuilding);
        haptics.light();
        soundManager.playBuildingSelect();
      }
    },
    [camera, screenToWorld, buildings, onBuildingClick]
  );
  
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (isDragging) {
        const dx = (x - dragStart.x) / camera.zoom;
        const dy = (y - dragStart.y) / camera.zoom;
        
        setCamera({
          ...camera,
          x: cameraStart.x - dx,
          y: cameraStart.y - dy,
        });
      } else {
        const worldPos = screenToWorld(x, y);
        
        const building = buildings.find(b => 
          worldPos.x >= b.x &&
          worldPos.x <= b.x + BUILDING_SIZE &&
          worldPos.y >= b.y &&
          worldPos.y <= b.y + BUILDING_SIZE
        );
        setHoveredBuilding(building || null);
      }
    },
    [isDragging, dragStart, cameraStart, camera, screenToWorld, buildings]
  );
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newZoom = Math.max(1, Math.min(4, camera.zoom - e.deltaY * zoomSpeed));
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera]
  );
  
  // Draw terrain tile
  const drawTerrainTile = (ctx: CanvasRenderingContext2D, tileX: number, tileY: number, x: number, y: number, size: number) => {
    if (!terrainSprites) return;
    
    ctx.drawImage(
      terrainSprites,
      tileX * 16, tileY * 16, 16, 16, // Source
      x, y, size, size // Destination
    );
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !terrainSprites || !houseSprites) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grass tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        const tileType = (x + y * 7) % 3;
        
        // Use different grass tiles for variety
        drawTerrainTile(ctx, tileType, 0, pos.x, pos.y, TILE_SIZE * camera.zoom);
      }
    }
    
    // Draw paths
    const centerX = Math.floor(MAP_WIDTH / 2);
    const centerY = Math.floor(MAP_HEIGHT / 2);
    
    // Horizontal main path
    for (let x = 3; x < MAP_WIDTH - 3; x++) {
      const pos = worldToScreen(x * TILE_SIZE, centerY * TILE_SIZE);
      drawTerrainTile(ctx, 0, 6, pos.x, pos.y, TILE_SIZE * camera.zoom); // Path tile
    }
    
    // Vertical path
    for (let y = 3; y < MAP_HEIGHT - 3; y++) {
      const pos = worldToScreen(centerX * TILE_SIZE, y * TILE_SIZE);
      drawTerrainTile(ctx, 0, 6, pos.x, pos.y, TILE_SIZE * camera.zoom);
    }
    
    // Draw town square (stone tiles around center)
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      for (let y = centerY - 1; y <= centerY + 1; y++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        drawTerrainTile(ctx, 3, 6, pos.x, pos.y, TILE_SIZE * camera.zoom); // Stone tile
      }
    }
    
    // Draw some trees
    const treePositions = [
      {x: 2, y: 5}, {x: 3, y: 8}, {x: MAP_WIDTH - 3, y: 6},
      {x: MAP_WIDTH - 4, y: 9}, {x: 8, y: 2}, {x: 20, y: 2},
      {x: 5, y: MAP_HEIGHT - 2}, {x: 15, y: MAP_HEIGHT - 2}
    ];
    
    treePositions.forEach(tree => {
      const pos = worldToScreen(tree.x * TILE_SIZE, tree.y * TILE_SIZE);
      // Trees are at column 6-7, row 4-5 in tileset (32x32)
      ctx.drawImage(
        terrainSprites,
        96, 64, 32, 32, // Source
        pos.x - TILE_SIZE * camera.zoom / 2,
        pos.y - TILE_SIZE * camera.zoom,
        TILE_SIZE * 2 * camera.zoom,
        TILE_SIZE * 2 * camera.zoom
      );
    });
    
    // Draw buildings
    buildings.forEach(building => {
      const pos = worldToScreen(building.x, building.y);
      
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        pos.x + 2 * camera.zoom,
        pos.y + 2 * camera.zoom,
        BUILDING_SIZE * camera.zoom,
        BUILDING_SIZE * camera.zoom
      );
      
      // Draw building from sprite sheet
      ctx.drawImage(
        houseSprites,
        building.spriteCol * 32, // Each building is 32x32
        building.spriteRow * 32,
        32, 32,
        pos.x,
        pos.y,
        BUILDING_SIZE * camera.zoom,
        BUILDING_SIZE * camera.zoom
      );
      
      // Hover effect
      if (hoveredBuilding === building) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2 * camera.zoom;
        ctx.strokeRect(
          pos.x,
          pos.y,
          BUILDING_SIZE * camera.zoom,
          BUILDING_SIZE * camera.zoom
        );
        
        // Name tooltip
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        const textWidth = building.name.length * 8;
        ctx.fillRect(
          pos.x + (BUILDING_SIZE * camera.zoom - textWidth) / 2,
          pos.y - 20 * camera.zoom,
          textWidth,
          18 * camera.zoom
        );
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${12 * camera.zoom}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          building.name,
          pos.x + BUILDING_SIZE * camera.zoom / 2,
          pos.y - 6 * camera.zoom
        );
        ctx.textAlign = "left";
      }
      
      // Venue indicator
      if (building.type === 'venue') {
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold ${10 * camera.zoom}px Arial`;
        ctx.fillText("♪", pos.x + 2 * camera.zoom, pos.y + 12 * camera.zoom);
      }
    });
    
    // UI
    ctx.fillStyle = "rgba(44, 62, 80, 0.9)";
    ctx.fillRect(0, 0, width, 50);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Underground Town", 20, 30);
    
    // Stats
    const venues = buildings.filter(b => b.type === 'venue').length;
    const shops = buildings.filter(b => b.type === 'shop').length;
    const workplaces = buildings.filter(b => b.type === 'workplace').length;
    const houses = buildings.filter(b => b.type === 'house').length;
    
    ctx.font = "14px Arial";
    ctx.fillText(`♪ Venues: ${venues}`, 180, 30);
    ctx.fillText(`🛍️ Shops: ${shops}`, 270, 30);
    ctx.fillText(`💼 Work: ${workplaces}`, 350, 30);
    ctx.fillText(`🏠 Homes: ${houses}`, 430, 30);
  }, [camera, width, height, buildings, hoveredBuilding, terrainSprites, houseSprites, worldToScreen, screenToWorld]);
  
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
        cursor: isDragging ? "grabbing" : hoveredBuilding ? "pointer" : "grab",
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
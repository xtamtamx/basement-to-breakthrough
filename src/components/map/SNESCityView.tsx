import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'venue' | 'shop' | 'workplace' | 'house' | 'apartment';
  name: string;
  color: 'red' | 'gray' | 'blue' | 'brown';
}

interface SNESCityViewProps {
  onBuildingClick?: (building: Building) => void;
  width?: number;
  height?: number;
}

export const SNESCityView: React.FC<SNESCityViewProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  
  const gameStore = useGameStore();
  const TILE_SIZE = 16;
  const CITY_WIDTH = 40;
  const CITY_HEIGHT = 30;
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Generate city layout
  useEffect(() => {
    const newBuildings: Building[] = [];
    let id = 0;
    
    // Downtown area - center of map
    // Main venue
    newBuildings.push({
      id: `venue-${id++}`,
      x: 18,
      y: 12,
      width: 4,
      height: 4,
      type: 'venue',
      name: 'The Basement',
      color: 'red'
    });
    
    // Second venue
    newBuildings.push({
      id: `venue-${id++}`,
      x: 24,
      y: 12,
      width: 4,
      height: 4,
      type: 'venue',
      name: 'Rock Club',
      color: 'blue'
    });
    
    // Shops
    newBuildings.push({
      id: `shop-${id++}`,
      x: 12,
      y: 8,
      width: 4,
      height: 4,
      type: 'shop',
      name: 'Music Store',
      color: 'brown'
    });
    
    newBuildings.push({
      id: `shop-${id++}`,
      x: 18,
      y: 8,
      width: 4,
      height: 4,
      type: 'shop',
      name: 'Coffee Shop',
      color: 'gray'
    });
    
    newBuildings.push({
      id: `shop-${id++}`,
      x: 24,
      y: 8,
      width: 4,
      height: 4,
      type: 'shop',
      name: 'Record Shop',
      color: 'red'
    });
    
    // Workplaces
    newBuildings.push({
      id: `workplace-${id++}`,
      x: 12,
      y: 18,
      width: 4,
      height: 4,
      type: 'workplace',
      name: 'Office Tower',
      color: 'gray'
    });
    
    newBuildings.push({
      id: `workplace-${id++}`,
      x: 30,
      y: 12,
      width: 4,
      height: 4,
      type: 'workplace',
      name: 'Day Job Inc',
      color: 'blue'
    });
    
    // Residential buildings - left side
    for (let i = 0; i < 4; i++) {
      newBuildings.push({
        id: `house-${id++}`,
        x: 4,
        y: 8 + i * 5,
        width: 3,
        height: 3,
        type: 'house',
        name: `House ${i + 1}`,
        color: i % 2 === 0 ? 'red' : 'brown'
      });
    }
    
    // Apartments - right side
    newBuildings.push({
      id: `apartment-${id++}`,
      x: 34,
      y: 8,
      width: 4,
      height: 4,
      type: 'apartment',
      name: 'City Apartments',
      color: 'gray'
    });
    
    newBuildings.push({
      id: `apartment-${id++}`,
      x: 34,
      y: 18,
      width: 4,
      height: 4,
      type: 'apartment',
      name: 'Modern Flats',
      color: 'blue'
    });
    
    setBuildings(newBuildings);
  }, []);
  
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
      const tileX = Math.floor(worldPos.x / TILE_SIZE);
      const tileY = Math.floor(worldPos.y / TILE_SIZE);
      
      const clickedBuilding = buildings.find(b => 
        tileX >= b.x && tileX < b.x + b.width &&
        tileY >= b.y && tileY < b.y + b.height
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
        const tileX = Math.floor(worldPos.x / TILE_SIZE);
        const tileY = Math.floor(worldPos.y / TILE_SIZE);
        
        const building = buildings.find(b => 
          tileX >= b.x && tileX < b.x + b.width &&
          tileY >= b.y && tileY < b.y + b.height
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
  
  // Draw tile from tileset
  const drawTile = (
    ctx: CanvasRenderingContext2D,
    tileX: number,
    tileY: number,
    destX: number,
    destY: number,
    scale: number = 1
  ) => {
    if (!cityTileset) return;
    
    ctx.drawImage(
      cityTileset,
      tileX * 16,
      tileY * 16,
      16,
      16,
      destX,
      destY,
      TILE_SIZE * camera.zoom * scale,
      TILE_SIZE * camera.zoom * scale
    );
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cityTileset) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear with dark background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw ground/pavement
    for (let y = 0; y < CITY_HEIGHT; y++) {
      for (let x = 0; x < CITY_WIDTH; x++) {
        const screenPos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Use dark pavement tiles from tileset (row 11-12)
        drawTile(ctx, 1, 11, screenPos.x, screenPos.y);
      }
    }
    
    // Draw roads
    // Main horizontal road
    for (let x = 0; x < CITY_WIDTH; x++) {
      const screenPos = worldToScreen(x * TILE_SIZE, 15 * TILE_SIZE);
      drawTile(ctx, 0, 11, screenPos.x, screenPos.y); // Road tile
    }
    
    // Main vertical road
    for (let y = 0; y < CITY_HEIGHT; y++) {
      const screenPos = worldToScreen(20 * TILE_SIZE, y * TILE_SIZE);
      drawTile(ctx, 0, 11, screenPos.x, screenPos.y);
    }
    
    // Draw buildings
    buildings.forEach(building => {
      // Building tile positions based on color
      const colorMap = {
        red: { baseY: 19 },    // Red buildings at row 19-22
        gray: { baseY: 23 },   // Gray buildings at row 23-26
        blue: { baseY: 27 },   // Blue buildings at row 27-30
        brown: { baseY: 31 }   // Brown buildings at row 31-34
      };
      
      const baseY = colorMap[building.color].baseY;
      
      // Draw building tiles (buildings are 4x4 tiles)
      for (let by = 0; by < building.height; by++) {
        for (let bx = 0; bx < building.width; bx++) {
          const screenPos = worldToScreen(
            (building.x + bx) * TILE_SIZE,
            (building.y + by) * TILE_SIZE
          );
          
          // Map to the correct tile in the building
          let tileX = 0;
          let tileY = baseY;
          
          // Top-left corner
          if (bx === 0 && by === 0) {
            tileX = 0;
            tileY = baseY;
          }
          // Top-right corner
          else if (bx === building.width - 1 && by === 0) {
            tileX = 3;
            tileY = baseY;
          }
          // Bottom-left corner
          else if (bx === 0 && by === building.height - 1) {
            tileX = 0;
            tileY = baseY + 3;
          }
          // Bottom-right corner
          else if (bx === building.width - 1 && by === building.height - 1) {
            tileX = 3;
            tileY = baseY + 3;
          }
          // Top edge
          else if (by === 0) {
            tileX = 1;
            tileY = baseY;
          }
          // Bottom edge
          else if (by === building.height - 1) {
            tileX = 1;
            tileY = baseY + 3;
          }
          // Left edge
          else if (bx === 0) {
            tileX = 0;
            tileY = baseY + 1;
          }
          // Right edge
          else if (bx === building.width - 1) {
            tileX = 3;
            tileY = baseY + 1;
          }
          // Center
          else {
            tileX = 1;
            tileY = baseY + 1;
          }
          
          drawTile(ctx, tileX, tileY, screenPos.x, screenPos.y);
        }
      }
      
      // Hover effect
      if (hoveredBuilding === building) {
        const buildingScreen = worldToScreen(
          building.x * TILE_SIZE,
          building.y * TILE_SIZE
        );
        
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          buildingScreen.x,
          buildingScreen.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
      }
    });
    
    // Draw some trees/decoration (from tileset rows 1-4)
    const treePositions = [
      {x: 8, y: 6}, {x: 32, y: 6}, {x: 8, y: 24}, {x: 32, y: 24}
    ];
    
    treePositions.forEach(tree => {
      const screenPos = worldToScreen(tree.x * TILE_SIZE, tree.y * TILE_SIZE);
      
      // Draw a 2x2 tree
      for (let ty = 0; ty < 2; ty++) {
        for (let tx = 0; tx < 2; tx++) {
          drawTile(
            ctx,
            tx + 1,
            ty + 1,
            screenPos.x + tx * TILE_SIZE * camera.zoom,
            screenPos.y + ty * TILE_SIZE * camera.zoom
          );
        }
      }
    });
    
    // Draw street lights (from tileset)
    const lightPositions = [
      {x: 16, y: 15}, {x: 24, y: 15}, {x: 20, y: 10}, {x: 20, y: 20}
    ];
    
    lightPositions.forEach(light => {
      const screenPos = worldToScreen(light.x * TILE_SIZE, light.y * TILE_SIZE);
      drawTile(ctx, 6, 5, screenPos.x, screenPos.y); // Street light tile
    });
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Underground City", 20, 40);
    
    // Stats
    const venues = buildings.filter(b => b.type === 'venue').length;
    const shops = buildings.filter(b => b.type === 'shop').length;
    const workplaces = buildings.filter(b => b.type === 'workplace').length;
    const residential = buildings.filter(b => b.type === 'house' || b.type === 'apartment').length;
    
    ctx.font = "16px Arial";
    ctx.fillText(`♪ ${venues} Venues`, 250, 25);
    ctx.fillText(`🛍️ ${shops} Shops`, 350, 25);
    ctx.fillText(`💼 ${workplaces} Work`, 450, 25);
    ctx.fillText(`🏠 ${residential} Homes`, 550, 25);
    
    // Building hover info
    if (hoveredBuilding) {
      const infoX = width - 200;
      const infoY = 70;
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(infoX, infoY, 190, 60);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.fillText(hoveredBuilding.name, infoX + 10, infoY + 25);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(hoveredBuilding.type, infoX + 10, infoY + 45);
    }
  }, [cityTileset, camera, buildings, hoveredBuilding, width, height, worldToScreen, screenToWorld]);
  
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
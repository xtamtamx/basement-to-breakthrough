import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface Building {
  id: string;
  x: number; // Grid position
  y: number;
  type: 'house' | 'shop' | 'venue' | 'workplace' | 'community';
  name: string;
  spriteX: number; // Sprite sheet position
  spriteY: number;
}

interface StardewCityRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const StardewCityRenderer: React.FC<StardewCityRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 320, y: 240, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [houseSprites, setHouseSprites] = useState<HTMLImageElement | null>(null);
  
  const gameStore = useGameStore();
  const TILE_SIZE = 32; // Stardew Valley uses 32x32 tiles
  const GRID_WIDTH = 25;
  const GRID_HEIGHT = 20;
  
  // Load house sprites
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/houses-sprite-sheet.png";
    img.onload = () => {
      setHouseSprites(img);
    };
    img.onerror = () => {
      console.error("Failed to load house sprites");
    };
  }, []);
  
  // Create Stardew Valley-style town layout
  useEffect(() => {
    const newBuildings: Building[] = [];
    let id = 0;
    
    // Town square in center
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    
    // Main street shops (horizontal row)
    const shopRow = centerY - 2;
    
    // Music Store
    newBuildings.push({
      id: `shop-${id++}`,
      x: centerX - 3,
      y: shopRow,
      type: 'shop',
      name: 'Music Store',
      spriteX: 32, // Row 1, Col 1 in sprite sheet
      spriteY: 32
    });
    
    // Coffee Shop  
    newBuildings.push({
      id: `shop-${id++}`,
      x: centerX - 1,
      y: shopRow,
      type: 'shop',
      name: 'Coffee Shop',
      spriteX: 224, // Row 7, Col 0
      spriteY: 0
    });
    
    // The Basement (main venue)
    newBuildings.push({
      id: `venue-${id++}`,
      x: centerX + 1,
      y: shopRow,
      type: 'venue',
      name: 'The Basement',
      spriteX: 128, // Row 4, Col 0
      spriteY: 0
    });
    
    // Record Shop
    newBuildings.push({
      id: `shop-${id++}`,
      x: centerX + 3,
      y: shopRow,
      type: 'shop',
      name: 'Record Shop',
      spriteX: 224, // Row 7, Col 1
      spriteY: 32
    });
    
    // Community Center
    newBuildings.push({
      id: `community-${id++}`,
      x: centerX,
      y: centerY + 2,
      type: 'community',
      name: 'Community Center',
      spriteX: 384, // Row 12, Col 0
      spriteY: 0
    });
    
    // Workplace buildings (left side)
    newBuildings.push({
      id: `workplace-${id++}`,
      x: 3,
      y: centerY - 1,
      type: 'workplace',
      name: 'Office Building',
      spriteX: 320, // Row 10, Col 0
      spriteY: 0
    });
    
    newBuildings.push({
      id: `workplace-${id++}`,
      x: 3,
      y: centerY + 1,
      type: 'workplace',
      name: 'Day Job Inc',
      spriteX: 320, // Row 10, Col 1
      spriteY: 32
    });
    
    // Additional venue (if player has progressed)
    if (gameStore.reputation > 20) {
      newBuildings.push({
        id: `venue-${id++}`,
        x: centerX - 4,
        y: centerY,
        type: 'venue',
        name: 'Rock Club',
        spriteX: 160, // Row 5, Col 0
        spriteY: 0
      });
    }
    
    // Residential area (top)
    for (let x = 5; x < GRID_WIDTH - 5; x += 2) {
      for (let y = 2; y < 5; y++) {
        if (Math.abs(x - centerX) > 3 || y < shopRow - 1) {
          newBuildings.push({
            id: `house-${id++}`,
            x,
            y,
            type: 'house',
            name: 'House',
            spriteX: (x % 3) * 32, // Vary house styles
            spriteY: ((y + x) % 3) * 64 // Different rows for variety
          });
        }
      }
    }
    
    // Residential area (bottom)
    for (let x = 6; x < GRID_WIDTH - 6; x += 2) {
      for (let y = GRID_HEIGHT - 5; y < GRID_HEIGHT - 2; y++) {
        newBuildings.push({
          id: `house-${id++}`,
          x,
          y,
          type: 'house',
          name: 'House',
          spriteX: ((x + 1) % 3) * 32,
          spriteY: ((y + x) % 3) * 64
        });
      }
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
      const gridX = Math.floor(worldPos.x / TILE_SIZE);
      const gridY = Math.floor(worldPos.y / TILE_SIZE);
      
      const clickedBuilding = buildings.find(b => 
        b.x === gridX && b.y === gridY
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
        const gridX = Math.floor(worldPos.x / TILE_SIZE);
        const gridY = Math.floor(worldPos.y / TILE_SIZE);
        
        const building = buildings.find(b => 
          b.x === gridX && b.y === gridY
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
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
    
    // Clear with grass
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grass tiles with variation
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Grass variation
        const variation = (x * 7 + y * 11) % 5;
        if (variation === 0) ctx.fillStyle = "#52C752";
        else if (variation === 1) ctx.fillStyle = "#4AD14A";
        else if (variation === 2) ctx.fillStyle = "#45B545";
        else ctx.fillStyle = "#4CAF50";
        
        ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
      }
    }
    
    // Draw paths/roads
    ctx.fillStyle = "#D2B48C"; // Sandy path color
    
    // Main horizontal path
    const pathY = Math.floor(GRID_HEIGHT / 2) - 2;
    for (let x = 2; x < GRID_WIDTH - 2; x++) {
      const pos = worldToScreen(x * TILE_SIZE, (pathY - 1) * TILE_SIZE);
      ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
    }
    
    // Vertical paths
    const centerX = Math.floor(GRID_WIDTH / 2);
    for (let y = 2; y < GRID_HEIGHT - 2; y++) {
      const pos = worldToScreen(centerX * TILE_SIZE, y * TILE_SIZE);
      ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
    }
    
    // Town square (cobblestone)
    ctx.fillStyle = "#8B7355";
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      for (let y = pathY + 2; y <= pathY + 4; y++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
        
        // Add cobblestone pattern
        ctx.strokeStyle = "#7A6248";
        ctx.strokeRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
      }
    }
    
    // Draw buildings
    if (houseSprites) {
      buildings.forEach(building => {
        const pos = worldToScreen(building.x * TILE_SIZE, building.y * TILE_SIZE);
        
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(
          pos.x + 2 * camera.zoom,
          pos.y + 2 * camera.zoom,
          TILE_SIZE * camera.zoom,
          TILE_SIZE * camera.zoom
        );
        
        // Draw building sprite
        ctx.drawImage(
          houseSprites,
          building.spriteX,
          building.spriteY,
          32, 32,
          pos.x,
          pos.y,
          TILE_SIZE * camera.zoom,
          TILE_SIZE * camera.zoom
        );
        
        // Hover effect
        if (hoveredBuilding === building) {
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2 * camera.zoom;
          ctx.strokeRect(
            pos.x,
            pos.y,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
          
          // Name tooltip
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          const textWidth = building.name.length * 8;
          ctx.fillRect(
            pos.x + (TILE_SIZE * camera.zoom - textWidth) / 2,
            pos.y - 20 * camera.zoom,
            textWidth,
            18 * camera.zoom
          );
          
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `${12 * camera.zoom}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText(
            building.name,
            pos.x + TILE_SIZE * camera.zoom / 2,
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
    }
    
    // Draw some decorative elements
    // Trees
    ctx.fillStyle = "#228B22";
    const treePositions = [
      {x: 2, y: 6}, {x: 3, y: 8}, {x: GRID_WIDTH - 3, y: 5},
      {x: GRID_WIDTH - 4, y: 7}, {x: 8, y: 2}, {x: 16, y: 2}
    ];
    
    treePositions.forEach(tree => {
      const pos = worldToScreen(tree.x * TILE_SIZE, tree.y * TILE_SIZE);
      
      // Simple tree
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(
        pos.x + TILE_SIZE * 0.4 * camera.zoom,
        pos.y + TILE_SIZE * 0.6 * camera.zoom,
        TILE_SIZE * 0.2 * camera.zoom,
        TILE_SIZE * 0.4 * camera.zoom
      );
      
      ctx.fillStyle = "#228B22";
      ctx.beginPath();
      ctx.arc(
        pos.x + TILE_SIZE * 0.5 * camera.zoom,
        pos.y + TILE_SIZE * 0.4 * camera.zoom,
        TILE_SIZE * 0.4 * camera.zoom,
        0, Math.PI * 2
      );
      ctx.fill();
    });
    
    // UI
    ctx.fillStyle = "rgba(44, 62, 80, 0.9)";
    ctx.fillRect(0, 0, width, 50);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Music Town", 20, 30);
    
    // Stats
    const venues = buildings.filter(b => b.type === 'venue').length;
    const shops = buildings.filter(b => b.type === 'shop').length;
    const workplaces = buildings.filter(b => b.type === 'workplace').length;
    const houses = buildings.filter(b => b.type === 'house').length;
    
    ctx.font = "14px Arial";
    ctx.fillText(`♪ Venues: ${venues}`, 150, 30);
    ctx.fillText(`🛍️ Shops: ${shops}`, 240, 30);
    ctx.fillText(`💼 Work: ${workplaces}`, 320, 30);
    ctx.fillText(`🏠 Homes: ${houses}`, 400, 30);
  }, [camera, width, height, buildings, hoveredBuilding, houseSprites, worldToScreen, screenToWorld]);
  
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
import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface District {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  type: 'downtown' | 'residential' | 'commercial' | 'industrial';
}

interface TilesetBasedCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

// Tileset coordinates for different elements
const TILES = {
  // Ground tiles
  grass: { x: 0, y: 0 },
  concrete: { x: 1, y: 9 },
  road_horizontal: { x: 1, y: 11 },
  road_vertical: { x: 2, y: 11 },
  road_cross: { x: 3, y: 11 },
  sidewalk: { x: 4, y: 11 },
  
  // Trees (32x32, so 2x2 tiles)
  tree1: { x: 2, y: 1, w: 2, h: 2 },
  tree2: { x: 4, y: 1, w: 2, h: 2 },
  
  // Street furniture
  lamp: { x: 6, y: 5 },
  bench: { x: 7, y: 5 },
  
  // Building parts (each color has same pattern)
  // Red buildings start at row 19
  // Gray buildings start at row 23
  // Blue buildings start at row 27
  // Brown buildings start at row 31
  building: {
    red: { row: 19 },
    gray: { row: 23 },
    blue: { row: 27 },
    brown: { row: 31 }
  }
};

export const TilesetBasedCity: React.FC<TilesetBasedCityProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const TILE_SIZE = 32;
  const MAP_WIDTH = 25;
  const MAP_HEIGHT = 20;
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Define districts
  const districts: District[] = [
    {
      id: 'downtown',
      name: 'Downtown',
      bounds: { x: 10, y: 8, width: 8, height: 6 },
      type: 'downtown'
    },
    {
      id: 'residential',
      name: 'Residential',
      bounds: { x: 2, y: 7, width: 7, height: 8 },
      type: 'residential'
    },
    {
      id: 'commercial',
      name: 'Shopping',
      bounds: { x: 19, y: 9, width: 5, height: 5 },
      type: 'commercial'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      bounds: { x: 10, y: 2, width: 8, height: 5 },
      type: 'industrial'
    }
  ];
  
  // City layout grid
  const [cityLayout] = useState(() => {
    const layout: string[][] = [];
    
    // Initialize with grass
    for (let y = 0; y < MAP_HEIGHT; y++) {
      layout[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        layout[y][x] = 'grass';
      }
    }
    
    // Main roads
    // Horizontal main road
    for (let x = 0; x < MAP_WIDTH; x++) {
      layout[10][x] = 'road';
      layout[11][x] = 'road';
    }
    
    // Vertical main road
    for (let y = 0; y < MAP_HEIGHT; y++) {
      layout[y][12] = 'road';
      layout[y][13] = 'road';
    }
    
    // Intersections
    layout[10][12] = 'cross';
    layout[10][13] = 'cross';
    layout[11][12] = 'cross';
    layout[11][13] = 'cross';
    
    // District areas
    districts.forEach(district => {
      const { x, y, width, height } = district.bounds;
      
      // Add sidewalks around district
      for (let dy = y - 1; dy <= y + height; dy++) {
        for (let dx = x - 1; dx <= x + width; dx++) {
          if (dy >= 0 && dy < MAP_HEIGHT && dx >= 0 && dx < MAP_WIDTH) {
            if (dy === y - 1 || dy === y + height || dx === x - 1 || dx === x + width) {
              if (layout[dy][dx] === 'grass') {
                layout[dy][dx] = 'sidewalk';
              }
            }
          }
        }
      }
      
      // Fill district ground
      for (let dy = y; dy < y + height; dy++) {
        for (let dx = x; dx < x + width; dx++) {
          if (dy >= 0 && dy < MAP_HEIGHT && dx >= 0 && dx < MAP_WIDTH) {
            if (district.type === 'downtown' || district.type === 'commercial') {
              layout[dy][dx] = 'concrete';
            } else if (district.type === 'industrial') {
              layout[dy][dx] = 'concrete';
            }
            // residential stays grass
          }
        }
      }
    });
    
    return layout;
  });
  
  // Draw a tile from the tileset
  const drawTile = (
    ctx: CanvasRenderingContext2D,
    tileX: number,
    tileY: number,
    destX: number,
    destY: number,
    tileWidth: number = 1,
    tileHeight: number = 1
  ) => {
    if (!cityTileset) return;
    
    ctx.drawImage(
      cityTileset,
      tileX * 16,
      tileY * 16,
      tileWidth * 16,
      tileHeight * 16,
      destX,
      destY,
      TILE_SIZE * tileWidth,
      TILE_SIZE * tileHeight
    );
  };
  
  // Draw a building using the tileset parts
  const drawBuilding = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: 'red' | 'gray' | 'blue' | 'brown'
  ) => {
    const baseRow = TILES.building[color].row;
    
    // Draw building tiles
    for (let by = 0; by < height; by++) {
      for (let bx = 0; bx < width; bx++) {
        let tileCol = 1; // default middle
        let tileRow = baseRow + 1; // default middle row
        
        // Determine which tile to use
        if (bx === 0 && by === 0) {
          // Top-left corner
          tileCol = 0;
          tileRow = baseRow;
        } else if (bx === width - 1 && by === 0) {
          // Top-right corner
          tileCol = 3;
          tileRow = baseRow;
        } else if (bx === 0 && by === height - 1) {
          // Bottom-left corner
          tileCol = 0;
          tileRow = baseRow + 3;
        } else if (bx === width - 1 && by === height - 1) {
          // Bottom-right corner
          tileCol = 3;
          tileRow = baseRow + 3;
        } else if (by === 0) {
          // Top edge
          tileCol = 1 + (bx % 2);
          tileRow = baseRow;
        } else if (by === height - 1) {
          // Bottom edge
          tileCol = 1 + (bx % 2);
          tileRow = baseRow + 3;
        } else if (bx === 0) {
          // Left edge
          tileCol = 0;
          tileRow = baseRow + 1 + (by % 2);
        } else if (bx === width - 1) {
          // Right edge
          tileCol = 3;
          tileRow = baseRow + 1 + (by % 2);
        } else {
          // Middle tiles
          tileCol = 1 + (bx % 2);
          tileRow = baseRow + 1 + (by % 2);
        }
        
        drawTile(ctx, tileCol, tileRow, x + bx * TILE_SIZE, y + by * TILE_SIZE);
      }
    }
  };
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check district click
    const tileX = Math.floor((x - camera.x) / TILE_SIZE);
    const tileY = Math.floor((y - camera.y) / TILE_SIZE);
    
    const clickedDistrict = districts.find(d =>
      tileX >= d.bounds.x && tileX < d.bounds.x + d.bounds.width &&
      tileY >= d.bounds.y && tileY < d.bounds.y + d.bounds.height
    );
    
    if (clickedDistrict && onDistrictClick) {
      haptics.light();
      soundManager.playClick();
      onDistrictClick(clickedDistrict);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
    }
  }, [camera, onDistrictClick]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setCamera({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const tileX = Math.floor((x - camera.x) / TILE_SIZE);
      const tileY = Math.floor((y - camera.y) / TILE_SIZE);
      
      const district = districts.find(d =>
        tileX >= d.bounds.x && tileX < d.bounds.x + d.bounds.width &&
        tileY >= d.bounds.y && tileY < d.bounds.y + d.bounds.height
      );
      
      setHoveredDistrict(district || null);
    }
  }, [isDragging, dragStart, camera]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cityTileset) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw base tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tileType = cityLayout[y][x];
        const destX = camera.x + x * TILE_SIZE;
        const destY = camera.y + y * TILE_SIZE;
        
        // Skip if outside view
        if (destX < -TILE_SIZE || destX > width || destY < -TILE_SIZE || destY > height) continue;
        
        switch (tileType) {
          case 'grass':
            drawTile(ctx, TILES.grass.x, TILES.grass.y, destX, destY);
            break;
          case 'road':
            drawTile(ctx, TILES.road_horizontal.x, TILES.road_horizontal.y, destX, destY);
            break;
          case 'cross':
            drawTile(ctx, TILES.road_cross.x, TILES.road_cross.y, destX, destY);
            break;
          case 'concrete':
            drawTile(ctx, TILES.concrete.x, TILES.concrete.y, destX, destY);
            break;
          case 'sidewalk':
            drawTile(ctx, TILES.sidewalk.x, TILES.sidewalk.y, destX, destY);
            break;
        }
      }
    }
    
    // Draw buildings in districts
    districts.forEach(district => {
      const { x, y, width, height } = district.bounds;
      
      if (district.type === 'downtown') {
        // Large office buildings
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 3, 2, 'gray');
        drawBuilding(ctx, camera.x + (x + 5) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 2, 2, 'blue');
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 4) * TILE_SIZE, 2, 2, 'red');
        drawBuilding(ctx, camera.x + (x + 4) * TILE_SIZE, camera.y + (y + 4) * TILE_SIZE, 3, 2, 'gray');
      } else if (district.type === 'residential') {
        // Small houses
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 2, 2, 'red');
        drawBuilding(ctx, camera.x + (x + 4) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 2, 2, 'brown');
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 4) * TILE_SIZE, 2, 2, 'blue');
        drawBuilding(ctx, camera.x + (x + 4) * TILE_SIZE, camera.y + (y + 4) * TILE_SIZE, 2, 2, 'red');
        
        // Add trees
        drawTile(ctx, TILES.tree1.x, TILES.tree1.y, 
          camera.x + (x + 3) * TILE_SIZE, camera.y + (y + 6) * TILE_SIZE, 2, 2);
      } else if (district.type === 'commercial') {
        // Shops
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 3, 2, 'blue');
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 3) * TILE_SIZE, 3, 2, 'brown');
      } else if (district.type === 'industrial') {
        // Factories
        drawBuilding(ctx, camera.x + (x + 1) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 3, 3, 'gray');
        drawBuilding(ctx, camera.x + (x + 5) * TILE_SIZE, camera.y + (y + 1) * TILE_SIZE, 2, 3, 'gray');
      }
    });
    
    // Draw street furniture
    // Lamps along main roads
    for (let x = 2; x < MAP_WIDTH; x += 4) {
      drawTile(ctx, TILES.lamp.x, TILES.lamp.y, 
        camera.x + x * TILE_SIZE, camera.y + 9 * TILE_SIZE);
      drawTile(ctx, TILES.lamp.x, TILES.lamp.y, 
        camera.x + x * TILE_SIZE, camera.y + 12 * TILE_SIZE);
    }
    
    // Trees in parks
    drawTile(ctx, TILES.tree2.x, TILES.tree2.y, 
      camera.x + 6 * TILE_SIZE, camera.y + 15 * TILE_SIZE, 2, 2);
    drawTile(ctx, TILES.tree1.x, TILES.tree1.y, 
      camera.x + 16 * TILE_SIZE, camera.y + 5 * TILE_SIZE, 2, 2);
    
    // Hover effect
    if (hoveredDistrict) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE,
        hoveredDistrict.bounds.width * TILE_SIZE,
        hoveredDistrict.bounds.height * TILE_SIZE
      );
    }
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.fillText("Click a district to explore • Drag to pan", width - 300, 40);
    
    // District info
    if (hoveredDistrict) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(20, height - 100, 250, 80);
      
      const districtColors = {
        downtown: "#6B7280",
        residential: "#10B981",
        commercial: "#3B82F6",
        industrial: "#6B7280"
      };
      
      ctx.fillStyle = districtColors[hoveredDistrict.type];
      ctx.fillRect(20, height - 100, 5, 80);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px Arial";
      ctx.fillText(hoveredDistrict.name, 35, height - 70);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(`Type: ${hoveredDistrict.type}`, 35, height - 45);
      ctx.fillText("Click to enter", 35, height - 25);
    }
  }, [cityTileset, cityLayout, camera, hoveredDistrict, width, height]);
  
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
        cursor: isDragging ? "grabbing" : hoveredDistrict ? "pointer" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
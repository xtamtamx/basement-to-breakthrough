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

interface SNESCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

// City layout using tile indices
// 0 = grass, 1 = dirt path, 2 = stone path, 3+ = buildings
const CITY_LAYOUT = [
  [0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,11,12,12,13,0,31,32,33,1,2,1,41,42,43,0,0,51,52,53,0,0,0,0],
  [0,21,22,22,23,0,31,32,33,1,2,1,41,42,43,0,0,51,52,53,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,11,12,13,0,11,12,13,0,1,2,1,61,62,62,62,63,0,71,72,73,0,0,0],
  [0,21,22,23,0,21,22,23,0,1,2,1,61,62,62,62,63,0,71,72,73,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,2,1,61,62,62,62,63,0,71,72,73,0,0,0],
  [0,31,32,33,0,31,32,33,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,31,32,33,0,31,32,33,0,1,2,1,0,0,0,0,0,51,52,53,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,51,52,53,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
];

export const SNESCity: React.FC<SNESCityProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [townTileset, setTownTileset] = useState<HTMLImageElement | null>(null);
  const [groundTileset, setGroundTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 50, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const TILE_SIZE = 32;
  const SPRITE_SIZE = 16;
  
  // Load tilesets
  useEffect(() => {
    const town = new Image();
    town.src = "/assets/sprites/town/KE_Town.png";
    town.onload = () => setTownTileset(town);
    
    const ground = new Image();
    ground.src = "/assets/sprites/town/KE_Ground_Tiles.png";
    ground.onload = () => setGroundTileset(ground);
  }, []);
  
  // Define districts
  const districts: District[] = [
    {
      id: 'residential',
      name: 'Residential District',
      bounds: { x: 1, y: 8, width: 8, height: 6 },
      type: 'residential'
    },
    {
      id: 'downtown',
      name: 'Downtown',
      bounds: { x: 12, y: 8, width: 6, height: 6 },
      type: 'downtown'
    },
    {
      id: 'commercial',
      name: 'Shopping District',
      bounds: { x: 17, y: 1, width: 5, height: 3 },
      type: 'commercial'
    },
    {
      id: 'industrial',
      name: 'Industrial Zone',
      bounds: { x: 1, y: 1, width: 8, height: 3 },
      type: 'industrial'
    }
  ];
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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
  
  // Draw tile from tileset
  const drawTile = (
    ctx: CanvasRenderingContext2D, 
    tileset: HTMLImageElement,
    srcX: number, 
    srcY: number, 
    destX: number, 
    destY: number,
    width: number = SPRITE_SIZE,
    height: number = SPRITE_SIZE
  ) => {
    ctx.drawImage(
      tileset,
      srcX * SPRITE_SIZE, srcY * SPRITE_SIZE, width, height,
      destX, destY, 
      width * (TILE_SIZE / SPRITE_SIZE), 
      height * (TILE_SIZE / SPRITE_SIZE)
    );
  };
  
  // Draw building based on tile code
  const drawBuilding = (
    ctx: CanvasRenderingContext2D,
    tileCode: number,
    x: number,
    y: number
  ) => {
    if (!townTileset) return;
    
    // Building mapping
    // 11-13, 21-23 = Red house (row 1)
    // 31-33 = Green house (row 2)
    // 41-43 = Gray house (row 3)
    // 51-53 = Shops/commercial
    // 61-63 = Large building
    // 71-73 = Industrial
    
    let srcX = 0, srcY = 0;
    
    // Red houses
    if (tileCode >= 11 && tileCode <= 13) {
      srcX = (tileCode - 11) + 3;
      srcY = 1;
    } else if (tileCode >= 21 && tileCode <= 23) {
      srcX = (tileCode - 21) + 3;
      srcY = 2;
    }
    // Green houses
    else if (tileCode >= 31 && tileCode <= 33) {
      srcX = (tileCode - 31) + 6;
      srcY = 1;
    }
    // Gray houses
    else if (tileCode >= 41 && tileCode <= 43) {
      srcX = (tileCode - 41) + 9;
      srcY = 1;
    }
    // Commercial buildings
    else if (tileCode >= 51 && tileCode <= 53) {
      srcX = (tileCode - 51) + 0;
      srcY = 5;
    }
    // Large buildings
    else if (tileCode >= 61 && tileCode <= 63) {
      srcX = (tileCode - 61) + 3;
      srcY = 5;
    }
    // Industrial
    else if (tileCode >= 71 && tileCode <= 73) {
      srcX = (tileCode - 71) + 6;
      srcY = 5;
    }
    
    if (srcX > 0 || srcY > 0) {
      drawTile(ctx, townTileset, srcX, srcY, x, y);
    }
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !groundTileset || !townTileset) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw city
    for (let y = 0; y < CITY_LAYOUT.length; y++) {
      for (let x = 0; x < CITY_LAYOUT[y].length; x++) {
        const tile = CITY_LAYOUT[y][x];
        const destX = camera.x + x * TILE_SIZE;
        const destY = camera.y + y * TILE_SIZE;
        
        // Skip if outside view
        if (destX < -TILE_SIZE || destX > width || destY < -TILE_SIZE || destY > height) continue;
        
        // Draw ground first
        if (tile === 0) {
          // Grass
          drawTile(ctx, groundTileset, 0, 0, destX, destY);
        } else if (tile === 1) {
          // Dirt path
          drawTile(ctx, groundTileset, 3, 0, destX, destY);
        } else if (tile === 2) {
          // Stone path
          drawTile(ctx, groundTileset, 2, 1, destX, destY);
        } else if (tile > 10) {
          // Buildings - draw grass underneath first
          drawTile(ctx, groundTileset, 0, 0, destX, destY);
          // Then draw the building
          drawBuilding(ctx, tile, destX, destY);
        }
      }
    }
    
    // Draw additional decorations
    // Trees
    drawTile(ctx, townTileset, 0, 7, camera.x + 3 * TILE_SIZE, camera.y + 3 * TILE_SIZE, 32, 32);
    drawTile(ctx, townTileset, 0, 7, camera.x + 15 * TILE_SIZE, camera.y + 6 * TILE_SIZE, 32, 32);
    
    // District hover
    if (hoveredDistrict) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE,
        hoveredDistrict.bounds.width * TILE_SIZE,
        hoveredDistrict.bounds.height * TILE_SIZE
      );
      
      // District label
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      const labelWidth = hoveredDistrict.name.length * 9 + 20;
      ctx.fillRect(
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE - 28,
        labelWidth,
        24
      );
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(
        hoveredDistrict.name,
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE + 10,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE - 10
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
  }, [townTileset, groundTileset, camera, hoveredDistrict, width, height]);
  
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
        imageRendering: "pixelated",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
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

interface RealTileCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

// City map layout - each number represents a different tile type
const CITY_MAP = [
  // 0 = grass, 1 = road, 2 = sidewalk, 3 = building base
  // 4 = red building, 5 = gray building, 6 = blue building, 7 = park
  [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,7,7,7,0,0,4,4,4,0,1,1,0,5,5,5,0,0,6,6,6,0,0,0,0],
  [0,7,7,7,0,0,4,4,4,0,1,1,0,5,5,5,0,0,6,6,6,0,0,0,0],
  [0,7,7,7,0,0,4,4,4,0,1,1,0,5,5,5,0,0,6,6,6,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,4,4,0,0,4,4,0,0,0,1,1,0,5,5,5,5,5,0,0,6,6,6,0,0],
  [0,4,4,0,0,4,4,0,0,0,1,1,0,5,5,5,5,5,0,0,6,6,6,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,0,5,5,5,5,5,0,0,6,6,6,0,0],
  [0,4,4,0,0,4,4,0,0,0,1,1,0,5,5,5,5,5,0,0,0,0,0,0,0],
  [0,4,4,0,0,4,4,0,0,0,1,1,0,0,0,0,0,0,0,0,6,6,6,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,6,6,6,0,0],
  [0,0,7,7,7,7,0,0,0,0,1,1,0,0,5,5,5,0,0,0,0,0,0,0,0],
  [0,0,7,7,7,7,0,0,0,0,1,1,0,0,5,5,5,0,0,0,0,0,0,0,0],
];

export const RealTileCity: React.FC<RealTileCityProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const TILE_SIZE = 32;
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Define districts based on the map
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
      bounds: { x: 13, y: 8, width: 6, height: 6 },
      type: 'downtown'
    },
    {
      id: 'commercial',
      name: 'Shopping District',
      bounds: { x: 18, y: 1, width: 5, height: 3 },
      type: 'commercial'
    },
    {
      id: 'industrial',
      name: 'Industrial Zone',
      bounds: { x: 6, y: 1, width: 4, height: 3 },
      type: 'industrial'
    }
  ];
  
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
  
  // Draw a single tile
  const drawTile = (ctx: CanvasRenderingContext2D, tileType: number, x: number, y: number) => {
    if (!cityTileset) return;
    
    let sx = 0, sy = 0;
    
    switch(tileType) {
      case 0: // Grass
        sx = 0; sy = 0;
        break;
      case 1: // Road
        sx = 0; sy = 176;
        break;
      case 2: // Sidewalk
        sx = 64; sy = 240;
        break;
      case 4: // Red building
        sx = 0; sy = 304;
        break;
      case 5: // Gray building
        sx = 0; sy = 368;
        break;
      case 6: // Blue building
        sx = 0; sy = 432;
        break;
      case 7: // Park/tree
        sx = 32; sy = 16;
        break;
    }
    
    ctx.drawImage(
      cityTileset,
      sx, sy, 16, 16,
      x, y, TILE_SIZE, TILE_SIZE
    );
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw city map
    for (let y = 0; y < CITY_MAP.length; y++) {
      for (let x = 0; x < CITY_MAP[y].length; x++) {
        const tileType = CITY_MAP[y][x];
        const destX = camera.x + x * TILE_SIZE;
        const destY = camera.y + y * TILE_SIZE;
        
        // Skip if outside view
        if (destX < -TILE_SIZE || destX > width || destY < -TILE_SIZE || destY > height) continue;
        
        drawTile(ctx, tileType, destX, destY);
      }
    }
    
    // Draw district boundaries for hovered district
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
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE - 25,
        hoveredDistrict.name.length * 8 + 10,
        22
      );
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(
        hoveredDistrict.name,
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE + 5,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE - 8
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
  }, [cityTileset, camera, hoveredDistrict, width, height]);
  
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
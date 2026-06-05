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

interface ProperModernCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

// Modern city layout - proper grid with blocks
const CITY_GRID = {
  width: 40,
  height: 30,
  blockSize: 4,
  roadWidth: 2
};

export const ProperModernCity: React.FC<ProperModernCityProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 50, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const TILE_SIZE = 16;
  const SCALE = 2; // Scale tiles up for better visibility
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Define districts as city blocks
  const districts: District[] = [
    {
      id: 'downtown',
      name: 'Downtown',
      bounds: { x: 15, y: 10, width: 10, height: 10 },
      type: 'downtown'
    },
    {
      id: 'residential',
      name: 'Residential',
      bounds: { x: 3, y: 8, width: 10, height: 14 },
      type: 'residential'
    },
    {
      id: 'commercial',
      name: 'Shopping District',
      bounds: { x: 27, y: 12, width: 10, height: 8 },
      type: 'commercial'
    },
    {
      id: 'industrial',
      name: 'Industrial Zone',
      bounds: { x: 15, y: 2, width: 10, height: 6 },
      type: 'industrial'
    }
  ];
  
  // Generate city layout
  const [cityLayout] = useState(() => {
    const layout: number[][] = [];
    
    // Initialize with empty/grass
    for (let y = 0; y < CITY_GRID.height; y++) {
      layout[y] = [];
      for (let x = 0; x < CITY_GRID.width; x++) {
        layout[y][x] = 0; // Empty/grass
      }
    }
    
    // Add main roads (cross pattern)
    // Horizontal main street
    for (let x = 0; x < CITY_GRID.width; x++) {
      layout[14][x] = 1; // Road
      layout[15][x] = 1; // Road
    }
    
    // Vertical main street
    for (let y = 0; y < CITY_GRID.height; y++) {
      layout[y][20] = 1; // Road
      layout[y][21] = 1; // Road
    }
    
    // Add city blocks with streets
    for (let by = 0; by < CITY_GRID.height; by += 6) {
      for (let bx = 0; bx < CITY_GRID.width; bx += 6) {
        // Streets around blocks
        for (let x = bx; x < Math.min(bx + 6, CITY_GRID.width); x++) {
          if (by < CITY_GRID.height) layout[by][x] = 1;
          if (by + 5 < CITY_GRID.height) layout[by + 5][x] = 1;
        }
        for (let y = by; y < Math.min(by + 6, CITY_GRID.height); y++) {
          if (bx < CITY_GRID.width) layout[y][bx] = 1;
          if (bx + 5 < CITY_GRID.width) layout[y][bx + 5] = 1;
        }
        
        // Sidewalks
        for (let x = bx + 1; x < Math.min(bx + 5, CITY_GRID.width - 1); x++) {
          if (by + 1 < CITY_GRID.height) layout[by + 1][x] = 2;
          if (by + 4 < CITY_GRID.height) layout[by + 4][x] = 2;
        }
        for (let y = by + 1; y < Math.min(by + 5, CITY_GRID.height - 1); y++) {
          if (bx + 1 < CITY_GRID.width) layout[y][bx + 1] = 2;
          if (bx + 4 < CITY_GRID.width) layout[y][bx + 4] = 2;
        }
        
        // Building area (will be drawn on top)
        for (let y = by + 2; y < Math.min(by + 4, CITY_GRID.height - 2); y++) {
          for (let x = bx + 2; x < Math.min(bx + 4, CITY_GRID.width - 2); x++) {
            layout[y][x] = 3; // Building zone
          }
        }
      }
    }
    
    return layout;
  });
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const tileX = Math.floor((x - camera.x) / (TILE_SIZE * SCALE));
    const tileY = Math.floor((y - camera.y) / (TILE_SIZE * SCALE));
    
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
      
      const tileX = Math.floor((x - camera.x) / (TILE_SIZE * SCALE));
      const tileY = Math.floor((y - camera.y) / (TILE_SIZE * SCALE));
      
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
    tileX: number,
    tileY: number,
    destX: number,
    destY: number
  ) => {
    if (!cityTileset) return;
    
    ctx.drawImage(
      cityTileset,
      tileX * 16, tileY * 16, 16, 16,
      destX, destY,
      TILE_SIZE * SCALE, TILE_SIZE * SCALE
    );
  };
  
  // Draw a building
  const drawBuilding = (
    ctx: CanvasRenderingContext2D,
    type: 'residential' | 'commercial' | 'office' | 'industrial',
    x: number,
    y: number,
    width: number = 2,
    height: number = 2
  ) => {
    if (!cityTileset) return;
    
    // Building tile mappings from the tileset
    const buildingTypes = {
      residential: { baseX: 0, baseY: 19 }, // Red houses
      commercial: { baseX: 0, baseY: 27 },  // Blue buildings
      office: { baseX: 0, baseY: 23 },      // Gray buildings
      industrial: { baseX: 0, baseY: 31 }   // Brown buildings
    };
    
    const building = buildingTypes[type];
    
    // Draw building using 4x4 tile pattern
    for (let by = 0; by < height; by++) {
      for (let bx = 0; bx < width; bx++) {
        let tileOffsetX = 1; // Default middle
        let tileOffsetY = 1; // Default middle
        
        // Corners and edges
        if (bx === 0 && by === 0) { tileOffsetX = 0; tileOffsetY = 0; } // Top-left
        else if (bx === width - 1 && by === 0) { tileOffsetX = 3; tileOffsetY = 0; } // Top-right
        else if (bx === 0 && by === height - 1) { tileOffsetX = 0; tileOffsetY = 3; } // Bottom-left
        else if (bx === width - 1 && by === height - 1) { tileOffsetX = 3; tileOffsetY = 3; } // Bottom-right
        else if (by === 0) { tileOffsetX = 1 + (bx % 2); tileOffsetY = 0; } // Top edge
        else if (by === height - 1) { tileOffsetX = 1 + (bx % 2); tileOffsetY = 3; } // Bottom edge
        else if (bx === 0) { tileOffsetX = 0; tileOffsetY = 1 + (by % 2); } // Left edge
        else if (bx === width - 1) { tileOffsetX = 3; tileOffsetY = 1 + (by % 2); } // Right edge
        else { tileOffsetX = 1 + (bx % 2); tileOffsetY = 1 + (by % 2); } // Middle
        
        drawTile(
          ctx,
          building.baseX + tileOffsetX,
          building.baseY + tileOffsetY,
          x + bx * TILE_SIZE * SCALE,
          y + by * TILE_SIZE * SCALE
        );
      }
    }
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
    
    // Draw base tiles
    for (let y = 0; y < CITY_GRID.height; y++) {
      for (let x = 0; x < CITY_GRID.width; x++) {
        const tile = cityLayout[y][x];
        const destX = camera.x + x * TILE_SIZE * SCALE;
        const destY = camera.y + y * TILE_SIZE * SCALE;
        
        // Skip if outside view
        if (destX < -TILE_SIZE * SCALE || destX > width || 
            destY < -TILE_SIZE * SCALE || destY > height) continue;
        
        if (cityTileset) {
          switch (tile) {
            case 0: // Grass
              drawTile(ctx, 0, 0, destX, destY);
              break;
            case 1: // Road
              drawTile(ctx, 0, 11, destX, destY);
              break;
            case 2: // Sidewalk
              drawTile(ctx, 2, 15, destX, destY);
              break;
            case 3: // Concrete (under buildings)
              drawTile(ctx, 1, 15, destX, destY);
              break;
          }
        }
      }
    }
    
    // Draw buildings in districts
    districts.forEach(district => {
      const { x: dx, y: dy, width: dw, height: dh } = district.bounds;
      
      // Draw buildings in a grid pattern within each district
      for (let by = dy + 2; by < dy + dh - 2; by += 3) {
        for (let bx = dx + 2; bx < dx + dw - 2; bx += 3) {
          const buildingX = camera.x + bx * TILE_SIZE * SCALE;
          const buildingY = camera.y + by * TILE_SIZE * SCALE;
          
          if (district.type === 'downtown') {
            drawBuilding(ctx, 'office', buildingX, buildingY, 2, 2);
          } else if (district.type === 'residential') {
            drawBuilding(ctx, 'residential', buildingX, buildingY, 2, 2);
          } else if (district.type === 'commercial') {
            drawBuilding(ctx, 'commercial', buildingX, buildingY, 2, 2);
          } else if (district.type === 'industrial') {
            drawBuilding(ctx, 'industrial', buildingX, buildingY, 2, 2);
          }
        }
      }
    });
    
    // Draw trees and decorations
    if (cityTileset) {
      // Trees in residential areas
      drawTile(ctx, 2, 1, camera.x + 5 * TILE_SIZE * SCALE, camera.y + 12 * TILE_SIZE * SCALE);
      drawTile(ctx, 2, 1, camera.x + 8 * TILE_SIZE * SCALE, camera.y + 18 * TILE_SIZE * SCALE);
      
      // Street lamps
      for (let x = 10; x < 30; x += 5) {
        drawTile(ctx, 6, 5, camera.x + x * TILE_SIZE * SCALE, camera.y + 13 * TILE_SIZE * SCALE);
        drawTile(ctx, 6, 5, camera.x + x * TILE_SIZE * SCALE, camera.y + 16 * TILE_SIZE * SCALE);
      }
    }
    
    // District hover
    if (hoveredDistrict) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE * SCALE,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE * SCALE,
        hoveredDistrict.bounds.width * TILE_SIZE * SCALE,
        hoveredDistrict.bounds.height * TILE_SIZE * SCALE
      );
      
      // District label
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      const labelWidth = hoveredDistrict.name.length * 9 + 20;
      ctx.fillRect(
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE * SCALE,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE * SCALE - 28,
        labelWidth,
        24
      );
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(
        hoveredDistrict.name,
        camera.x + hoveredDistrict.bounds.x * TILE_SIZE * SCALE + 10,
        camera.y + hoveredDistrict.bounds.y * TILE_SIZE * SCALE - 10
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
        imageRendering: "pixelated",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
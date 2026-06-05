import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface District {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  type: 'downtown' | 'residential' | 'commercial' | 'industrial';
  color: string;
}

interface ActualModernCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const ActualModernCity: React.FC<ActualModernCityProps> = ({
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
  const CITY_WIDTH = 30;
  const CITY_HEIGHT = 20;
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Define city districts
  const districts: District[] = [
    {
      id: 'downtown',
      name: 'Downtown',
      bounds: { x: 10, y: 7, width: 10, height: 8 },
      type: 'downtown',
      color: '#E74C3C'
    },
    {
      id: 'residential',
      name: 'Residential',
      bounds: { x: 2, y: 5, width: 7, height: 10 },
      type: 'residential',
      color: '#27AE60'
    },
    {
      id: 'commercial',
      name: 'Shopping District',
      bounds: { x: 21, y: 8, width: 7, height: 7 },
      type: 'commercial',
      color: '#3498DB'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      bounds: { x: 12, y: 1, width: 8, height: 5 },
      type: 'industrial',
      color: '#7F8C8D'
    }
  ];
  
  // City grid - simple representation
  const [cityGrid] = useState(() => {
    const grid: number[][] = [];
    
    // Initialize with grass
    for (let y = 0; y < CITY_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < CITY_WIDTH; x++) {
        grid[y][x] = 0; // grass
      }
    }
    
    // Add main roads
    // Horizontal main street
    for (let x = 0; x < CITY_WIDTH; x++) {
      grid[10][x] = 1; // road
      grid[11][x] = 1; // road
    }
    
    // Vertical main street
    for (let y = 0; y < CITY_HEIGHT; y++) {
      grid[y][15] = 1; // road
      grid[y][16] = 1; // road
    }
    
    // Add district roads
    districts.forEach(district => {
      const { x, y, width, height } = district.bounds;
      
      // Border roads
      for (let dx = x - 1; dx <= x + width; dx++) {
        if (dx >= 0 && dx < CITY_WIDTH) {
          if (y - 1 >= 0) grid[y - 1][dx] = 1;
          if (y + height < CITY_HEIGHT) grid[y + height][dx] = 1;
        }
      }
      
      for (let dy = y - 1; dy <= y + height; dy++) {
        if (dy >= 0 && dy < CITY_HEIGHT) {
          if (x - 1 >= 0) grid[dy][x - 1] = 1;
          if (x + width < CITY_WIDTH) grid[dy][x + width] = 1;
        }
      }
      
      // Fill district with appropriate ground
      for (let dy = y; dy < y + height; dy++) {
        for (let dx = x; dx < x + width; dx++) {
          if (dx >= 0 && dx < CITY_WIDTH && dy >= 0 && dy < CITY_HEIGHT) {
            if (district.type === 'downtown' || district.type === 'commercial') {
              grid[dy][dx] = 2; // concrete
            } else if (district.type === 'industrial') {
              grid[dy][dx] = 3; // industrial floor
            }
            // residential stays as grass
          }
        }
      }
    });
    
    return grid;
  });
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a district
    const clickedDistrict = districts.find(d => {
      const dx = (x - camera.x) / TILE_SIZE;
      const dy = (y - camera.y) / TILE_SIZE;
      return dx >= d.bounds.x && dx < d.bounds.x + d.bounds.width &&
             dy >= d.bounds.y && dy < d.bounds.y + d.bounds.height;
    });
    
    if (clickedDistrict && onDistrictClick) {
      haptics.light();
      soundManager.playClick();
      onDistrictClick(clickedDistrict);
    } else {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  }, [camera, onDistrictClick]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging) {
      setCamera({
        x: camera.x + (x - dragStart.x),
        y: camera.y + (y - dragStart.y)
      });
      setDragStart({ x, y });
    } else {
      // Check hover
      const district = districts.find(d => {
        const dx = (x - camera.x) / TILE_SIZE;
        const dy = (y - camera.y) / TILE_SIZE;
        return dx >= d.bounds.x && dx < d.bounds.x + d.bounds.width &&
               dy >= d.bounds.y && dy < d.bounds.y + d.bounds.height;
      });
      setHoveredDistrict(district || null);
    }
  }, [isDragging, dragStart, camera]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Render city
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw city grid
    if (cityTileset) {
      ctx.imageSmoothingEnabled = false;
      
      // Draw base tiles
      for (let y = 0; y < CITY_HEIGHT; y++) {
        for (let x = 0; x < CITY_WIDTH; x++) {
          const tileX = camera.x + x * TILE_SIZE;
          const tileY = camera.y + y * TILE_SIZE;
          
          // Skip if outside view
          if (tileX < -TILE_SIZE || tileX > width || tileY < -TILE_SIZE || tileY > height) continue;
          
          const tile = cityGrid[y][x];
          
          // Draw appropriate tile
          switch (tile) {
            case 0: // grass
              ctx.drawImage(cityTileset, 0, 0, 16, 16, tileX, tileY, TILE_SIZE, TILE_SIZE);
              break;
            case 1: // road
              ctx.drawImage(cityTileset, 0, 176, 16, 16, tileX, tileY, TILE_SIZE, TILE_SIZE);
              break;
            case 2: // concrete
              ctx.drawImage(cityTileset, 16, 240, 16, 16, tileX, tileY, TILE_SIZE, TILE_SIZE);
              break;
            case 3: // industrial
              ctx.drawImage(cityTileset, 0, 368, 16, 16, tileX, tileY, TILE_SIZE, TILE_SIZE);
              break;
          }
        }
      }
      
      // Draw buildings for each district
      districts.forEach(district => {
        const { x, y, width, height } = district.bounds;
        
        if (district.type === 'downtown') {
          // Draw office buildings
          for (let i = 0; i < 4; i++) {
            const bx = x + 2 + (i % 2) * 4;
            const by = y + 2 + Math.floor(i / 2) * 3;
            
            // Draw a 2x2 building using tileset
            for (let dy = 0; dy < 2; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                const px = camera.x + (bx + dx) * TILE_SIZE;
                const py = camera.y + (by + dy) * TILE_SIZE;
                
                // Red building tiles
                let sx = 0 + dx * 16;
                let sy = 304 + dy * 16;
                if (dx === 1) sx = 48; // right side
                if (dy === 1) sy = 352; // bottom
                
                ctx.drawImage(cityTileset, sx, sy, 16, 16, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
          }
        } else if (district.type === 'residential') {
          // Draw houses
          for (let i = 0; i < 6; i++) {
            const hx = x + 1 + (i % 3) * 2;
            const hy = y + 1 + Math.floor(i / 3) * 3;
            
            const px = camera.x + hx * TILE_SIZE;
            const py = camera.y + hy * TILE_SIZE;
            
            // Small house - use different colored houses
            const houseColors = [[0, 304], [64, 304], [0, 432], [64, 432]];
            const [sx, sy] = houseColors[i % houseColors.length];
            
            ctx.drawImage(cityTileset, sx, sy, 16, 16, px, py, TILE_SIZE, TILE_SIZE);
          }
        } else if (district.type === 'commercial') {
          // Draw shops
          for (let i = 0; i < 3; i++) {
            const sx = x + 1 + i * 2;
            const sy = y + 2;
            
            const px = camera.x + sx * TILE_SIZE;
            const py = camera.y + sy * TILE_SIZE;
            
            // Shop building
            ctx.drawImage(cityTileset, 128, 432, 32, 32, px, py, TILE_SIZE * 2, TILE_SIZE * 2);
          }
        } else if (district.type === 'industrial') {
          // Draw factories
          for (let i = 0; i < 2; i++) {
            const fx = x + 1 + i * 3;
            const fy = y + 1;
            
            const px = camera.x + fx * TILE_SIZE;
            const py = camera.y + fy * TILE_SIZE;
            
            // Factory building
            ctx.drawImage(cityTileset, 0, 368, 48, 48, px, py, TILE_SIZE * 3, TILE_SIZE * 3);
          }
        }
      });
      
      // Draw trees in residential areas
      const treePositions = [
        {x: 3, y: 6}, {x: 5, y: 9}, {x: 7, y: 7}, {x: 4, y: 12}
      ];
      
      treePositions.forEach(tree => {
        const px = camera.x + tree.x * TILE_SIZE;
        const py = camera.y + tree.y * TILE_SIZE;
        ctx.drawImage(cityTileset, 32, 16, 32, 32, px, py, TILE_SIZE, TILE_SIZE * 1.5);
      });
    } else {
      // Fallback rendering without tileset
      // Draw ground
      for (let y = 0; y < CITY_HEIGHT; y++) {
        for (let x = 0; x < CITY_WIDTH; x++) {
          const tileX = camera.x + x * TILE_SIZE;
          const tileY = camera.y + y * TILE_SIZE;
          
          const tile = cityGrid[y][x];
          
          switch (tile) {
            case 0: // grass
              ctx.fillStyle = "#4CAF50";
              break;
            case 1: // road
              ctx.fillStyle = "#555555";
              break;
            case 2: // concrete
              ctx.fillStyle = "#888888";
              break;
            case 3: // industrial
              ctx.fillStyle = "#666666";
              break;
          }
          
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        }
      }
      
      // Draw simple buildings
      districts.forEach(district => {
        ctx.fillStyle = district.color;
        const { x, y, width, height } = district.bounds;
        
        if (district.type === 'downtown') {
          for (let i = 0; i < 4; i++) {
            const bx = camera.x + (x + 2 + (i % 2) * 4) * TILE_SIZE;
            const by = camera.y + (y + 2 + Math.floor(i / 2) * 3) * TILE_SIZE;
            ctx.fillRect(bx, by, TILE_SIZE * 2, TILE_SIZE * 2);
          }
        } else if (district.type === 'residential') {
          for (let i = 0; i < 6; i++) {
            const hx = camera.x + (x + 1 + (i % 3) * 2) * TILE_SIZE;
            const hy = camera.y + (y + 1 + Math.floor(i / 3) * 3) * TILE_SIZE;
            ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE);
          }
        }
      });
    }
    
    // Hover effect
    if (hoveredDistrict) {
      ctx.strokeStyle = "#FFD700";
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
      
      ctx.fillStyle = hoveredDistrict.color;
      ctx.fillRect(20, height - 100, 5, 80);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px Arial";
      ctx.fillText(hoveredDistrict.name, 35, height - 70);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(`Type: ${hoveredDistrict.type}`, 35, height - 45);
      ctx.fillText("Click to enter", 35, height - 25);
    }
  }, [cityTileset, cityGrid, camera, hoveredDistrict, width, height]);
  
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
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
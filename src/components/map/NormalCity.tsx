import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface District {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'downtown' | 'residential' | 'commercial' | 'industrial';
}

interface NormalCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const NormalCity: React.FC<NormalCityProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Simple districts
  const districts: District[] = [
    { id: 'downtown', name: 'Downtown', x: 300, y: 200, width: 200, height: 150, type: 'downtown' },
    { id: 'residential', name: 'Residential', x: 100, y: 180, width: 180, height: 180, type: 'residential' },
    { id: 'commercial', name: 'Shopping', x: 520, y: 220, width: 160, height: 120, type: 'commercial' },
    { id: 'industrial', name: 'Industrial', x: 280, y: 60, width: 240, height: 120, type: 'industrial' }
  ];
  
  // Mouse handlers
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clicked = districts.find(d =>
      x >= d.x && x <= d.x + d.width &&
      y >= d.y && y <= d.y + d.height
    );
    
    if (clicked && onDistrictClick) {
      haptics.light();
      soundManager.playClick();
      onDistrictClick(clicked);
    }
  }, [onDistrictClick]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hovered = districts.find(d =>
      x >= d.x && x <= d.x + d.width &&
      y >= d.y && y <= d.y + d.height
    );
    
    setHoveredDistrict(hovered || null);
  }, []);
  
  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear with light gray
    ctx.fillStyle = "#E5E7EB";
    ctx.fillRect(0, 0, width, height);
    
    if (cityTileset) {
      ctx.imageSmoothingEnabled = false;
      
      // Draw a simple city background using tileset
      // Just fill with grass tiles as base
      for (let y = 0; y < height; y += 32) {
        for (let x = 0; x < width; x += 32) {
          ctx.drawImage(cityTileset, 0, 0, 16, 16, x, y, 32, 32);
        }
      }
      
      // Draw main roads
      ctx.fillStyle = "#9CA3AF";
      ctx.fillRect(0, 250, width, 40); // Horizontal main road
      ctx.fillRect(390, 0, 40, height); // Vertical main road
      
      // Draw districts as simple colored areas with buildings
      districts.forEach(district => {
        // District background
        ctx.fillStyle = district.type === 'downtown' ? "#D1D5DB" :
                       district.type === 'residential' ? "#D1FAE5" :
                       district.type === 'commercial' ? "#DBEAFE" :
                       "#E5E7EB";
        ctx.fillRect(district.x, district.y, district.width, district.height);
        
        // Draw some simple building representations from tileset
        if (district.type === 'downtown') {
          // Office buildings - use gray building tiles
          for (let i = 0; i < 4; i++) {
            const bx = district.x + 20 + (i % 2) * 80;
            const by = district.y + 20 + Math.floor(i / 2) * 60;
            // Draw 3x3 building
            for (let dy = 0; dy < 3; dy++) {
              for (let dx = 0; dx < 3; dx++) {
                ctx.drawImage(cityTileset, 
                  16 + dx * 16, 368 + dy * 16, 16, 16,
                  bx + dx * 20, by + dy * 20, 20, 20);
              }
            }
          }
        } else if (district.type === 'residential') {
          // Houses - use red building tiles
          for (let i = 0; i < 6; i++) {
            const hx = district.x + 20 + (i % 3) * 50;
            const hy = district.y + 20 + Math.floor(i / 3) * 70;
            // Draw 2x2 house
            ctx.drawImage(cityTileset, 0, 304, 32, 32, hx, hy, 40, 40);
          }
        } else if (district.type === 'commercial') {
          // Shops - use blue building tiles
          for (let i = 0; i < 2; i++) {
            const sx = district.x + 20 + i * 70;
            const sy = district.y + 30;
            ctx.drawImage(cityTileset, 0, 432, 48, 48, sx, sy, 60, 60);
          }
        } else if (district.type === 'industrial') {
          // Factories - use gray tiles
          for (let i = 0; i < 2; i++) {
            const fx = district.x + 30 + i * 100;
            const fy = district.y + 30;
            ctx.drawImage(cityTileset, 0, 368, 64, 48, fx, fy, 80, 60);
          }
        }
        
        // District border
        ctx.strokeStyle = hoveredDistrict === district ? "#F59E0B" : "#9CA3AF";
        ctx.lineWidth = hoveredDistrict === district ? 3 : 1;
        ctx.strokeRect(district.x, district.y, district.width, district.height);
        
        // District label
        ctx.fillStyle = "#374151";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(district.name, district.x + district.width / 2, district.y - 5);
      });
      
    } else {
      // Fallback without tileset
      ctx.fillStyle = "#9CA3AF";
      ctx.fillRect(0, 250, width, 40);
      ctx.fillRect(390, 0, 40, height);
      
      districts.forEach(district => {
        const colors = {
          downtown: "#60A5FA",
          residential: "#34D399", 
          commercial: "#FBBF24",
          industrial: "#9CA3AF"
        };
        
        ctx.fillStyle = colors[district.type] + "40";
        ctx.fillRect(district.x, district.y, district.width, district.height);
        
        ctx.strokeStyle = hoveredDistrict === district ? "#F59E0B" : colors[district.type];
        ctx.lineWidth = hoveredDistrict === district ? 3 : 2;
        ctx.strokeRect(district.x, district.y, district.width, district.height);
        
        // Simple building representations
        ctx.fillStyle = colors[district.type];
        if (district.type === 'downtown') {
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(
              district.x + 20 + (i % 2) * 80,
              district.y + 20 + Math.floor(i / 2) * 60,
              60, 40
            );
          }
        } else if (district.type === 'residential') {
          for (let i = 0; i < 6; i++) {
            ctx.fillRect(
              district.x + 20 + (i % 3) * 50,
              district.y + 20 + Math.floor(i / 3) * 70,
              30, 30
            );
          }
        }
        
        ctx.fillStyle = "#1F2937";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(district.name, district.x + district.width / 2, district.y - 10);
      });
    }
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Click a district to explore", width - 20, 40);
    
    // Hover info
    if (hoveredDistrict) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(20, height - 80, 200, 60);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(hoveredDistrict.name, 30, height - 55);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText("Click to enter", 30, height - 30);
    }
  }, [cityTileset, hoveredDistrict, width, height]);
  
  useEffect(() => {
    render();
  }, [render]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ cursor: hoveredDistrict ? "pointer" : "default" }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    />
  );
};
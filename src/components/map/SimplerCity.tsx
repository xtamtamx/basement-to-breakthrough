import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
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

interface SimplerCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const SimplerCity: React.FC<SimplerCityProps> = ({
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
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Define districts (static — memoized so callbacks can depend on it stably)
  const districts = useMemo<District[]>(() => [
    {
      id: 'downtown',
      name: 'Downtown',
      x: 240,
      y: 160,
      width: 200,
      height: 160,
      type: 'downtown'
    },
    {
      id: 'residential',
      name: 'Residential',
      x: 40,
      y: 120,
      width: 180,
      height: 200,
      type: 'residential'
    },
    {
      id: 'commercial',
      name: 'Shopping',
      x: 460,
      y: 180,
      width: 160,
      height: 120,
      type: 'commercial'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      x: 280,
      y: 40,
      width: 160,
      height: 100,
      type: 'industrial'
    }
  ], []);
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const worldX = x - camera.x;
    const worldY = y - camera.y;
    
    const clickedDistrict = districts.find(d =>
      worldX >= d.x && worldX <= d.x + d.width &&
      worldY >= d.y && worldY <= d.y + d.height
    );
    
    if (clickedDistrict && onDistrictClick) {
      haptics.light();
      soundManager.playClick();
      onDistrictClick(clickedDistrict);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
    }
  }, [camera, onDistrictClick, districts]);
  
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
      
      const worldX = x - camera.x;
      const worldY = y - camera.y;
      
      const district = districts.find(d =>
        worldX >= d.x && worldX <= d.x + d.width &&
        worldY >= d.y && worldY <= d.y + d.height
      );
      
      setHoveredDistrict(district || null);
    }
  }, [isDragging, dragStart, camera, districts]);
  
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
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(camera.x, camera.y);

    // Draw grass tiles as base — cover the whole visible viewport (pans with camera)
    const tile = 32;
    const startX = Math.floor(-camera.x / tile) * tile - tile;
    const endX = -camera.x + width + tile;
    const startY = Math.floor(-camera.y / tile) * tile - tile;
    const endY = -camera.y + height + tile;
    for (let y = startY; y < endY; y += tile) {
      for (let x = startX; x < endX; x += tile) {
        ctx.drawImage(cityTileset, 0, 0, 16, 16, x, y, tile, tile);
      }
    }

    // Roads — asphalt with dashed lane markings, spanning the viewport
    const roadW = 40;
    const hRoadY = 240;
    const vRoadX = 316;
    ctx.fillStyle = "#404040";
    ctx.fillRect(startX, hRoadY, endX - startX, roadW);
    ctx.fillRect(vRoadX, startY, roadW, endY - startY);
    ctx.strokeStyle = "#f2c200";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(startX, hRoadY + roadW / 2);
    ctx.lineTo(endX, hRoadY + roadW / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vRoadX + roadW / 2, startY);
    ctx.lineTo(vRoadX + roadW / 2, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw districts
    districts.forEach(district => {
      const accent = district.type === 'downtown' ? "120, 130, 150" :
                     district.type === 'residential' ? "110, 190, 110" :
                     district.type === 'commercial' ? "110, 140, 210" :
                     "190, 140, 80";
      // Subtle plot fill + clean border so each district reads as a defined plot
      ctx.fillStyle = `rgba(${accent}, 0.16)`;
      ctx.fillRect(district.x, district.y, district.width, district.height);
      ctx.strokeStyle = `rgba(${accent}, 0.9)`;
      ctx.lineWidth = 2;
      ctx.strokeRect(district.x + 1, district.y + 1, district.width - 2, district.height - 2);
      
      // Draw buildings
      if (district.type === 'downtown') {
        // Gray office buildings - using the 4x4 tile buildings
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            ctx.drawImage(cityTileset, 0, 368, 64, 64, 
              district.x + 20 + i * 80, 
              district.y + 20 + j * 70, 
              64, 64);
          }
        }
      } else if (district.type === 'residential') {
        // Red houses
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            ctx.drawImage(cityTileset, (i % 2) * 64, 304, 64, 64,
              district.x + 10 + i * 55,
              district.y + 10 + j * 60,
              48, 48);
          }
        }
      } else if (district.type === 'commercial') {
        // Blue shops
        ctx.drawImage(cityTileset, 0, 432, 64, 64, district.x + 20, district.y + 20, 64, 64);
        ctx.drawImage(cityTileset, 64, 432, 64, 64, district.x + 90, district.y + 20, 64, 64);
      } else if (district.type === 'industrial') {
        // Brown/industrial buildings
        ctx.drawImage(cityTileset, 0, 496, 128, 64, district.x + 20, district.y + 20, 128, 64);
      }
    });

    // District hover
    if (hoveredDistrict) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        hoveredDistrict.x,
        hoveredDistrict.y,
        hoveredDistrict.width,
        hoveredDistrict.height
      );
      
      // Label
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(hoveredDistrict.x, hoveredDistrict.y - 25, hoveredDistrict.name.length * 9 + 10, 22);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(hoveredDistrict.name, hoveredDistrict.x + 5, hoveredDistrict.y - 8);
    }
    
    ctx.restore();
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.fillText("Click a district to explore • Drag to pan", width - 300, 40);
  }, [cityTileset, camera, hoveredDistrict, width, height, districts]);
  
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
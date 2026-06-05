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

interface FinalCityViewProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

// Building layouts from the tileset
// Using the actual building layouts shown in the tileset
const BUILDINGS = {
  // Red building (residential) - starts at y=304
  red: {
    small: { x: 0, y: 19, w: 64, h: 64 },
    large: { x: 0, y: 19, w: 128, h: 128 }
  },
  // Gray building (office) - starts at y=368  
  gray: {
    small: { x: 0, y: 23, w: 64, h: 64 },
    large: { x: 0, y: 23, w: 128, h: 128 }
  },
  // Blue building (commercial) - starts at y=432
  blue: {
    small: { x: 0, y: 27, w: 64, h: 64 },
    large: { x: 0, y: 27, w: 128, h: 128 }
  },
  // Brown building (industrial) - starts at y=496
  brown: {
    small: { x: 0, y: 31, w: 64, h: 64 },
    large: { x: 0, y: 31, w: 128, h: 128 }
  }
};

export const FinalCityView: React.FC<FinalCityViewProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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
      x: 300,
      y: 200,
      width: 256,
      height: 192,
      type: 'downtown'
    },
    {
      id: 'residential',
      name: 'Residential',
      x: 50,
      y: 150,
      width: 192,
      height: 256,
      type: 'residential'
    },
    {
      id: 'commercial',
      name: 'Shopping District',
      x: 600,
      y: 250,
      width: 192,
      height: 128,
      type: 'commercial'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      x: 350,
      y: 50,
      width: 192,
      height: 128,
      type: 'industrial'
    }
  ];
  
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
      
      const worldX = x - camera.x;
      const worldY = y - camera.y;
      
      const district = districts.find(d =>
        worldX >= d.x && worldX <= d.x + d.width &&
        worldY >= d.y && worldY <= d.y + d.height
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
    
    // Clear with grass color
    ctx.fillStyle = "#4a5d3a";
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(camera.x, camera.y);
    
    // Draw grass background
    for (let y = -100; y < 1000; y += 16) {
      for (let x = -100; x < 1000; x += 16) {
        ctx.drawImage(cityTileset, 0, 0, 16, 16, x, y, 16, 16);
      }
    }
    
    // Draw main roads
    // Horizontal road
    for (let x = 0; x < 900; x += 16) {
      ctx.drawImage(cityTileset, 0, 176, 16, 16, x, 300, 16, 16);
      ctx.drawImage(cityTileset, 0, 176, 16, 16, x, 316, 16, 16);
    }
    
    // Vertical road
    for (let y = 0; y < 600; y += 16) {
      ctx.drawImage(cityTileset, 0, 176, 16, 16, 400, y, 16, 16);
      ctx.drawImage(cityTileset, 0, 176, 16, 16, 416, y, 16, 16);
    }
    
    // Draw districts
    districts.forEach(district => {
      // Draw sidewalks around district
      ctx.fillStyle = "#999999";
      ctx.fillRect(district.x - 8, district.y - 8, district.width + 16, district.height + 16);
      
      // Draw concrete base
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(district.x, district.y, district.width, district.height);
      
      // Draw buildings based on district type
      if (district.type === 'downtown') {
        // Large gray office buildings
        ctx.drawImage(cityTileset, 0, 368, 128, 128, district.x + 20, district.y + 20, 128, 128);
        ctx.drawImage(cityTileset, 128, 368, 64, 64, district.x + 170, district.y + 20, 64, 64);
        ctx.drawImage(cityTileset, 128, 368, 64, 64, district.x + 170, district.y + 100, 64, 64);
      } else if (district.type === 'residential') {
        // Red houses
        ctx.drawImage(cityTileset, 0, 304, 64, 64, district.x + 20, district.y + 20, 64, 64);
        ctx.drawImage(cityTileset, 64, 304, 64, 64, district.x + 100, district.y + 20, 64, 64);
        ctx.drawImage(cityTileset, 0, 304, 64, 64, district.x + 20, district.y + 100, 64, 64);
        ctx.drawImage(cityTileset, 64, 304, 64, 64, district.x + 100, district.y + 100, 64, 64);
        
        // Add some trees
        ctx.drawImage(cityTileset, 32, 16, 32, 32, district.x + 50, district.y + 180, 32, 32);
        ctx.drawImage(cityTileset, 64, 16, 32, 32, district.x + 120, district.y + 180, 32, 32);
      } else if (district.type === 'commercial') {
        // Blue shops
        ctx.drawImage(cityTileset, 0, 432, 128, 64, district.x + 20, district.y + 20, 128, 64);
        ctx.drawImage(cityTileset, 128, 432, 64, 64, district.x + 20, district.y + 90, 64, 64);
      } else if (district.type === 'industrial') {
        // Brown factories
        ctx.drawImage(cityTileset, 0, 496, 128, 128, district.x + 20, district.y + 20, 128, 128);
      }
      
      // District label
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(district.x, district.y - 25, district.name.length * 8 + 10, 22);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(district.name, district.x + 5, district.y - 8);
    });
    
    // Draw street decorations
    // Street lamps
    for (let x = 100; x < 800; x += 100) {
      ctx.drawImage(cityTileset, 96, 80, 16, 32, x, 280, 16, 32);
      ctx.drawImage(cityTileset, 96, 80, 16, 32, x, 320, 16, 32);
    }
    
    // District hover effect
    if (hoveredDistrict) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        hoveredDistrict.x - 2,
        hoveredDistrict.y - 2,
        hoveredDistrict.width + 4,
        hoveredDistrict.height + 4
      );
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
    
    // Hover info
    if (hoveredDistrict) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(20, height - 80, 200, 60);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.fillText(hoveredDistrict.name, 30, height - 55);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText("Click to enter", 30, height - 30);
    }
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
        imageRendering: "pixelated",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
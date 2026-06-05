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
  color: string;
}

interface ModernCityMapProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const ModernCityMap: React.FC<ModernCityMapProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const gameStore = useGameStore();
  
  // City districts - realistic modern city layout
  const districts: District[] = [
    {
      id: 'downtown',
      name: 'Downtown',
      x: 300,
      y: 200,
      width: 200,
      height: 200,
      type: 'downtown',
      color: '#E74C3C'
    },
    {
      id: 'eastside',
      name: 'East Side',
      x: 520,
      y: 220,
      width: 180,
      height: 160,
      type: 'residential',
      color: '#27AE60'
    },
    {
      id: 'westend',
      name: 'West End',
      x: 80,
      y: 240,
      width: 200,
      height: 140,
      type: 'commercial',
      color: '#3498DB'
    },
    {
      id: 'northside',
      name: 'North Industrial',
      x: 250,
      y: 60,
      width: 300,
      height: 120,
      type: 'industrial',
      color: '#7F8C8D'
    },
    {
      id: 'southside',
      name: 'South Side',
      x: 280,
      y: 420,
      width: 240,
      height: 100,
      type: 'residential',
      color: '#2ECC71'
    }
  ];
  
  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check which district is hovered
    const district = districts.find(d => 
      x >= d.x && x <= d.x + d.width &&
      y >= d.y && y <= d.y + d.height
    );
    
    setHoveredDistrict(district || null);
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hoveredDistrict && onDistrictClick) {
      haptics.light();
      soundManager.playClick();
      onDistrictClick(hoveredDistrict);
    }
  }, [hoveredDistrict, onDistrictClick]);
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear with city background color
    ctx.fillStyle = "#2C3E50";
    ctx.fillRect(0, 0, width, height);
    
    // Draw water/river
    ctx.fillStyle = "#34495E";
    ctx.fillRect(0, 400, width, 50);
    ctx.fillRect(550, 0, 50, height);
    
    // Draw main roads/highways
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 8;
    
    // Main east-west highway
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(width, 300);
    ctx.stroke();
    
    // Main north-south highway
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, height);
    ctx.stroke();
    
    // Secondary roads
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 4;
    
    // Connect districts
    ctx.beginPath();
    ctx.moveTo(180, 310);
    ctx.lineTo(300, 300);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(500, 300);
    ctx.lineTo(610, 300);
    ctx.stroke();
    
    // Draw districts
    districts.forEach(district => {
      const isHovered = hoveredDistrict === district;
      
      // District base
      ctx.fillStyle = district.color;
      ctx.globalAlpha = isHovered ? 0.8 : 0.6;
      ctx.fillRect(district.x, district.y, district.width, district.height);
      ctx.globalAlpha = 1;
      
      // District border
      ctx.strokeStyle = isHovered ? "#FFD700" : district.color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeRect(district.x, district.y, district.width, district.height);
      
      // Draw mini buildings to show district type
      ctx.fillStyle = "#FFF";
      const buildingSize = 8;
      const spacing = 12;
      
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const bx = district.x + 20 + i * spacing;
          const by = district.y + 20 + j * spacing;
          
          if (bx < district.x + district.width - 20 && 
              by < district.y + district.height - 20) {
            
            // Vary building heights based on district type
            let bh = buildingSize;
            if (district.type === 'downtown') {
              bh = buildingSize + Math.random() * 8;
            } else if (district.type === 'industrial') {
              bh = buildingSize - 2;
            }
            
            ctx.fillRect(bx, by - (bh - buildingSize), buildingSize, bh);
          }
        }
      }
      
      // District name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        district.name,
        district.x + district.width / 2,
        district.y + district.height / 2
      );
    });
    
    // Draw some landmarks
    // Stadium (south of downtown)
    ctx.fillStyle = "#9B59B6";
    ctx.beginPath();
    ctx.ellipse(400, 450, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.fillText("Stadium", 400, 455);
    
    // Park (between districts)
    ctx.fillStyle = "#27AE60";
    ctx.fillRect(520, 120, 60, 80);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Park", 550, 165);
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.fillText("Click a district to explore", width - 200, 40);
    
    // Hover info
    if (hoveredDistrict) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      const infoY = height - 100;
      ctx.fillRect(20, infoY, 300, 80);
      
      ctx.fillStyle = hoveredDistrict.color;
      ctx.fillRect(20, infoY, 5, 80);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px Arial";
      ctx.fillText(hoveredDistrict.name, 35, infoY + 25);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(`Type: ${hoveredDistrict.type}`, 35, infoY + 45);
      ctx.fillText("Click to enter district", 35, infoY + 65);
    }
  }, [width, height, hoveredDistrict]);
  
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
        cursor: hoveredDistrict ? "pointer" : "default",
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    />
  );
};
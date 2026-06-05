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

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface SimpleCleanCityProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const SimpleCleanCity: React.FC<SimpleCleanCityProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Simple city layout - centered in view
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Define districts as simple rectangles
  const districts: District[] = [
    {
      id: 'downtown',
      name: 'Downtown',
      x: centerX - 100,
      y: centerY - 80,
      width: 200,
      height: 160,
      type: 'downtown',
      color: '#3B82F6'
    },
    {
      id: 'residential',
      name: 'Residential',
      x: centerX - 320,
      y: centerY - 120,
      width: 180,
      height: 200,
      type: 'residential',
      color: '#10B981'
    },
    {
      id: 'commercial',
      name: 'Shopping District',
      x: centerX + 140,
      y: centerY - 60,
      width: 180,
      height: 140,
      type: 'commercial',
      color: '#F59E0B'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      x: centerX - 150,
      y: centerY - 260,
      width: 300,
      height: 120,
      type: 'industrial',
      color: '#6B7280'
    }
  ];
  
  // Generate buildings for each district
  const generateBuildings = (district: District): Building[] => {
    const buildings: Building[] = [];
    const padding = 20;
    const spacing = 10;
    
    switch (district.type) {
      case 'downtown':
        // Large office buildings
        for (let i = 0; i < 6; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          buildings.push({
            x: district.x + padding + col * 60,
            y: district.y + padding + row * 70,
            width: 50,
            height: 60,
            color: '#1E40AF'
          });
        }
        break;
        
      case 'residential':
        // Small houses
        for (let i = 0; i < 12; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          buildings.push({
            x: district.x + padding + col * 50,
            y: district.y + padding + row * 45,
            width: 40,
            height: 35,
            color: '#059669'
          });
        }
        break;
        
      case 'commercial':
        // Mixed shops
        for (let i = 0; i < 4; i++) {
          const row = Math.floor(i / 2);
          const col = i % 2;
          buildings.push({
            x: district.x + padding + col * 80,
            y: district.y + padding + row * 60,
            width: 70,
            height: 50,
            color: '#D97706'
          });
        }
        break;
        
      case 'industrial':
        // Factories
        for (let i = 0; i < 3; i++) {
          buildings.push({
            x: district.x + padding + i * 90,
            y: district.y + padding,
            width: 80,
            height: 80,
            color: '#4B5563'
          });
        }
        break;
    }
    
    return buildings;
  };
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left - camera.x;
    const y = e.clientY - rect.top - camera.y;
    
    // Check if clicking on a district
    const clickedDistrict = districts.find(d => 
      x >= d.x && x <= d.x + d.width &&
      y >= d.y && y <= d.y + d.height
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
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    if (isDragging) {
      setCamera({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      const x = e.clientX - rect.left - camera.x;
      const y = e.clientY - rect.top - camera.y;
      
      const district = districts.find(d => 
        x >= d.x && x <= d.x + d.width &&
        y >= d.y && y <= d.y + d.height
      );
      setHoveredDistrict(district || null);
    }
  }, [isDragging, dragStart, camera]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(camera.x, camera.y);
    
    // Draw roads
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 40;
    
    // Main horizontal road
    ctx.beginPath();
    ctx.moveTo(centerX - 400, centerY);
    ctx.lineTo(centerX + 400, centerY);
    ctx.stroke();
    
    // Main vertical road
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 300);
    ctx.lineTo(centerX, centerY + 200);
    ctx.stroke();
    
    // District connector roads
    ctx.lineWidth = 20;
    districts.forEach(district => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(district.x + district.width / 2, district.y + district.height / 2);
      ctx.stroke();
    });
    
    // Draw districts
    districts.forEach(district => {
      // District base
      ctx.fillStyle = district.color + "20";
      ctx.fillRect(district.x, district.y, district.width, district.height);
      
      // District border
      ctx.strokeStyle = district.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(district.x, district.y, district.width, district.height);
      
      // Draw buildings
      const buildings = generateBuildings(district);
      buildings.forEach(building => {
        // Building
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Building shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(
          building.x + 2,
          building.y + building.height,
          building.width,
          4
        );
        
        // Windows for larger buildings
        if (building.width > 50) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          for (let wy = 0; wy < building.height - 10; wy += 15) {
            for (let wx = 0; wx < building.width - 10; wx += 15) {
              ctx.fillRect(
                building.x + wx + 5,
                building.y + wy + 5,
                8,
                8
              );
            }
          }
        }
      });
      
      // District label
      ctx.fillStyle = district.color;
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        district.name,
        district.x + district.width / 2,
        district.y - 10
      );
    });
    
    // Parks and green spaces
    const parks = [
      { x: centerX - 60, y: centerY + 100, r: 40 },
      { x: centerX + 200, y: centerY - 180, r: 30 }
    ];
    
    parks.forEach(park => {
      ctx.fillStyle = "#86EFAC";
      ctx.beginPath();
      ctx.arc(park.x, park.y, park.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Trees
      ctx.fillStyle = "#22C55E";
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const tx = park.x + Math.cos(angle) * park.r * 0.6;
        const ty = park.y + Math.sin(angle) * park.r * 0.6;
        ctx.beginPath();
        ctx.arc(tx, ty, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Hover effect
    if (hoveredDistrict) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 5;
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
    ctx.textAlign = "left";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Click a district to explore • Drag to pan", width - 20, 40);
    
    // District info
    if (hoveredDistrict) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(20, height - 100, 250, 80);
      
      ctx.fillStyle = hoveredDistrict.color;
      ctx.fillRect(20, height - 100, 5, 80);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.fillText(hoveredDistrict.name, 35, height - 70);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(`Type: ${hoveredDistrict.type}`, 35, height - 45);
      ctx.fillText("Click to enter", 35, height - 25);
    }
  }, [camera, hoveredDistrict, width, height]);
  
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
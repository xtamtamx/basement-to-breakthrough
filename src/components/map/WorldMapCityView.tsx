import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface District {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  type: 'downtown' | 'residential' | 'commercial' | 'industrial';
  buildings: {
    venues: number;
    shops: number;
    workplaces: number;
    houses: number;
  };
}

interface WorldMapCityViewProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const WorldMapCityView: React.FC<WorldMapCityViewProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const gameStore = useGameStore();
  
  // Initialize districts based on game progress
  useEffect(() => {
    const progress = Math.floor(
      ((gameStore.venues?.length || 0) * 2 + 
       (gameStore.reputation || 0) * 0.1) / 5
    );
    
    const newDistricts: District[] = [
      {
        id: 'downtown',
        name: 'Downtown',
        x: width / 2,
        y: height / 2,
        size: 80,
        type: 'downtown',
        buildings: {
          venues: 2 + Math.floor(progress / 2),
          shops: 4 + progress,
          workplaces: 2,
          houses: 0
        }
      },
      {
        id: 'eastside',
        name: 'East Side',
        x: width * 0.75,
        y: height * 0.5,
        size: 60,
        type: 'residential',
        buildings: {
          venues: 0,
          shops: 2,
          workplaces: 0,
          houses: 15 + progress * 3
        }
      },
      {
        id: 'westend',
        name: 'West End',
        x: width * 0.25,
        y: height * 0.5,
        size: 60,
        type: 'commercial',
        buildings: {
          venues: progress > 2 ? 1 : 0,
          shops: 3 + progress,
          workplaces: 3 + Math.floor(progress / 2),
          houses: 5
        }
      }
    ];
    
    // Add more districts as player progresses
    if (progress > 3) {
      newDistricts.push({
        id: 'northside',
        name: 'North Side',
        x: width * 0.5,
        y: height * 0.25,
        size: 50,
        type: 'industrial',
        buildings: {
          venues: 1,
          shops: 1,
          workplaces: 5,
          houses: 3
        }
      });
    }
    
    setDistricts(newDistricts);
  }, [gameStore.venues?.length, gameStore.reputation, width, height]);
  
  // Handle mouse/touch
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check which district is hovered
    const district = districts.find(d => {
      const distance = Math.sqrt((x - d.x) ** 2 + (y - d.y) ** 2);
      return distance < d.size;
    });
    
    setHoveredDistrict(district || null);
  }, [districts]);
  
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
    
    // Background - world map style
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw terrain features
    ctx.fillStyle = "#2d4059";
    // Mountains in background
    ctx.beginPath();
    ctx.moveTo(0, height * 0.3);
    ctx.lineTo(width * 0.2, height * 0.15);
    ctx.lineTo(width * 0.35, height * 0.25);
    ctx.lineTo(width * 0.5, height * 0.1);
    ctx.lineTo(width * 0.7, height * 0.2);
    ctx.lineTo(width * 0.85, height * 0.15);
    ctx.lineTo(width, height * 0.3);
    ctx.lineTo(width, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    
    // River
    ctx.strokeStyle = "#3282b8";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width * 0.8, 0);
    ctx.quadraticCurveTo(width * 0.7, height * 0.3, width * 0.6, height);
    ctx.stroke();
    
    // Draw districts
    districts.forEach(district => {
      const isHovered = hoveredDistrict === district;
      
      // District glow effect
      if (isHovered) {
        const glowGradient = ctx.createRadialGradient(
          district.x, district.y, 0,
          district.x, district.y, district.size * 1.5
        );
        glowGradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
        glowGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          district.x - district.size * 1.5,
          district.y - district.size * 1.5,
          district.size * 3,
          district.size * 3
        );
      }
      
      // District circle
      const districtGradient = ctx.createRadialGradient(
        district.x, district.y, 0,
        district.x, district.y, district.size
      );
      
      // Color based on district type
      const colors = {
        downtown: ["#e74c3c", "#c0392b"],
        residential: ["#27ae60", "#229954"],
        commercial: ["#3498db", "#2874a6"],
        industrial: ["#7f8c8d", "#626567"]
      };
      
      const [light, dark] = colors[district.type];
      districtGradient.addColorStop(0, light);
      districtGradient.addColorStop(1, dark);
      
      ctx.fillStyle = districtGradient;
      ctx.beginPath();
      ctx.arc(district.x, district.y, district.size, 0, Math.PI * 2);
      ctx.fill();
      
      // District border
      ctx.strokeStyle = isHovered ? "#ffd700" : "#ecf0f1";
      ctx.lineWidth = isHovered ? 4 : 2;
      ctx.stroke();
      
      // District icon/buildings representation
      ctx.fillStyle = "#ffffff";
      const iconSize = district.size * 0.3;
      
      // Simple building shapes
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const bx = district.x + Math.cos(angle) * district.size * 0.5;
        const by = district.y + Math.sin(angle) * district.size * 0.5;
        
        ctx.fillRect(
          bx - iconSize / 2,
          by - iconSize / 2,
          iconSize,
          iconSize * (0.8 + Math.random() * 0.4)
        );
      }
      
      // District name
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${16}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(district.name, district.x, district.y - district.size - 10);
      
      // Building count
      if (isHovered) {
        ctx.font = "12px Arial";
        ctx.fillText(
          `♪ ${district.buildings.venues} | 🛍️ ${district.buildings.shops}`,
          district.x,
          district.y + district.size + 20
        );
        ctx.fillText(
          `💼 ${district.buildings.workplaces} | 🏠 ${district.buildings.houses}`,
          district.x,
          district.y + district.size + 35
        );
      }
    });
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "14px Arial";
    ctx.fillStyle = "#ecf0f1";
    ctx.fillText("Click a district to explore", width - 200, 40);
    
    // Total stats
    const totals = districts.reduce((acc, d) => ({
      venues: acc.venues + d.buildings.venues,
      shops: acc.shops + d.buildings.shops,
      workplaces: acc.workplaces + d.buildings.workplaces,
      houses: acc.houses + d.buildings.houses
    }), { venues: 0, shops: 0, workplaces: 0, houses: 0 });
    
    ctx.font = "16px Arial";
    ctx.fillText(`Total: ♪ ${totals.venues} venues`, 250, 25);
    ctx.fillText(`🛍️ ${totals.shops} shops`, 250, 45);
    ctx.fillText(`💼 ${totals.workplaces} workplaces`, 400, 25);
    ctx.fillText(`🏠 ${totals.houses} homes`, 400, 45);
  }, [districts, hoveredDistrict, width, height]);
  
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
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    />
  );
};
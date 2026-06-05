import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface District {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'downtown' | 'residential' | 'commercial' | 'industrial';
}

interface OverworldCityMapProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const OverworldCityMap: React.FC<OverworldCityMapProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 320, y: 240, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  
  const gameStore = useGameStore();
  const TILE_SIZE = 16;
  const MAP_WIDTH = 40;
  const MAP_HEIGHT = 30;
  
  // Define districts on the world map
  const districts: District[] = [
    { id: 'downtown', name: 'Downtown', x: 20, y: 15, type: 'downtown' },
    { id: 'eastside', name: 'East Side', x: 28, y: 18, type: 'residential' },
    { id: 'westend', name: 'West End', x: 12, y: 12, type: 'commercial' },
    { id: 'northside', name: 'North Side', x: 20, y: 8, type: 'industrial' }
  ];
  
  // Coordinate conversions
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: (worldX - camera.x) * camera.zoom + width / 2,
        y: (worldY - camera.y) * camera.zoom + height / 2,
      };
    },
    [camera, width, height]
  );
  
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - width / 2) / camera.zoom + camera.x,
        y: (screenY - height / 2) / camera.zoom + camera.y,
      };
    },
    [camera, width, height]
  );
  
  // Mouse handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if clicking on a district
      const worldPos = screenToWorld(x, y);
      const clickedDistrict = districts.find(d => {
        const dx = Math.abs(worldPos.x - d.x * TILE_SIZE);
        const dy = Math.abs(worldPos.y - d.y * TILE_SIZE);
        return dx < TILE_SIZE * 3 && dy < TILE_SIZE * 3;
      });
      
      if (clickedDistrict && onDistrictClick) {
        haptics.light();
        soundManager.playClick();
        onDistrictClick(clickedDistrict);
      } else {
        setIsDragging(true);
        setDragStart({ x, y });
        setCameraStart({ x: camera.x, y: camera.y });
      }
    },
    [camera, screenToWorld, onDistrictClick]
  );
  
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (isDragging) {
        const dx = (x - dragStart.x) / camera.zoom;
        const dy = (y - dragStart.y) / camera.zoom;
        
        setCamera({
          ...camera,
          x: cameraStart.x - dx,
          y: cameraStart.y - dy,
        });
      } else {
        // Check hover
        const worldPos = screenToWorld(x, y);
        const district = districts.find(d => {
          const dx = Math.abs(worldPos.x - d.x * TILE_SIZE);
          const dy = Math.abs(worldPos.y - d.y * TILE_SIZE);
          return dx < TILE_SIZE * 3 && dy < TILE_SIZE * 3;
        });
        setHoveredDistrict(district || null);
      }
    },
    [isDragging, dragStart, cameraStart, camera, screenToWorld]
  );
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Draw world map background
    // Ocean blue
    ctx.fillStyle = "#2E86AB";
    ctx.fillRect(0, 0, width, height);
    
    // Main landmass
    ctx.fillStyle = "#4CAF50";
    for (let y = 5; y < 25; y++) {
      for (let x = 5; x < 35; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Create irregular coastline
        if ((x === 5 || x === 34) && Math.random() > 0.3) continue;
        if ((y === 5 || y === 24) && Math.random() > 0.3) continue;
        
        ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
      }
    }
    
    // Mountains
    ctx.fillStyle = "#8B7355";
    const mountainRanges = [
      {x: 8, y: 10, w: 3, h: 8},
      {x: 30, y: 8, w: 4, h: 6}
    ];
    
    mountainRanges.forEach(range => {
      for (let y = range.y; y < range.y + range.h; y++) {
        for (let x = range.x; x < range.x + range.w; x++) {
          const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
          ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
        }
      }
    });
    
    // Roads connecting districts
    ctx.strokeStyle = "#D4A373";
    ctx.lineWidth = 2 * camera.zoom;
    
    // Downtown to East Side
    ctx.beginPath();
    ctx.moveTo(...Object.values(worldToScreen(20 * TILE_SIZE, 15 * TILE_SIZE)));
    ctx.lineTo(...Object.values(worldToScreen(28 * TILE_SIZE, 18 * TILE_SIZE)));
    ctx.stroke();
    
    // Downtown to West End
    ctx.beginPath();
    ctx.moveTo(...Object.values(worldToScreen(20 * TILE_SIZE, 15 * TILE_SIZE)));
    ctx.lineTo(...Object.values(worldToScreen(12 * TILE_SIZE, 12 * TILE_SIZE)));
    ctx.stroke();
    
    // Downtown to North Side
    ctx.beginPath();
    ctx.moveTo(...Object.values(worldToScreen(20 * TILE_SIZE, 15 * TILE_SIZE)));
    ctx.lineTo(...Object.values(worldToScreen(20 * TILE_SIZE, 8 * TILE_SIZE)));
    ctx.stroke();
    
    // Draw districts as small town representations
    districts.forEach(district => {
      const pos = worldToScreen(district.x * TILE_SIZE, district.y * TILE_SIZE);
      const isHovered = hoveredDistrict === district;
      
      // District shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        pos.x - TILE_SIZE * camera.zoom * 2 + 4,
        pos.y - TILE_SIZE * camera.zoom * 2 + 4,
        TILE_SIZE * camera.zoom * 4,
        TILE_SIZE * camera.zoom * 4
      );
      
      // Draw mini buildings to represent district
      const buildingColors = {
        downtown: "#E74C3C",
        residential: "#27AE60", 
        commercial: "#3498DB",
        industrial: "#7F8C8D"
      };
      
      ctx.fillStyle = buildingColors[district.type];
      
      // Center building
      ctx.fillRect(
        pos.x - TILE_SIZE * camera.zoom,
        pos.y - TILE_SIZE * camera.zoom,
        TILE_SIZE * camera.zoom * 2,
        TILE_SIZE * camera.zoom * 2
      );
      
      // Surrounding smaller buildings
      const positions = [
        {x: -2, y: -2}, {x: 0, y: -2}, {x: 2, y: -2},
        {x: -2, y: 0}, {x: 2, y: 0},
        {x: -2, y: 2}, {x: 0, y: 2}, {x: 2, y: 2}
      ];
      
      positions.forEach((offset, i) => {
        if (i % 2 === 0) {
          ctx.fillRect(
            pos.x + offset.x * TILE_SIZE * camera.zoom * 0.6,
            pos.y + offset.y * TILE_SIZE * camera.zoom * 0.6,
            TILE_SIZE * camera.zoom * 0.8,
            TILE_SIZE * camera.zoom * 0.8
          );
        }
      });
      
      // Hover effect
      if (isHovered) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          pos.x - TILE_SIZE * camera.zoom * 3,
          pos.y - TILE_SIZE * camera.zoom * 3,
          TILE_SIZE * camera.zoom * 6,
          TILE_SIZE * camera.zoom * 6
        );
        
        // District name
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(
          pos.x - 40,
          pos.y - TILE_SIZE * camera.zoom * 4,
          80,
          20
        );
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(district.name, pos.x, pos.y - TILE_SIZE * camera.zoom * 3.5);
        ctx.textAlign = "left";
      }
    });
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.fillText("Click a district to enter", width - 200, 40);
  }, [camera, width, height, hoveredDistrict, worldToScreen]);
  
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
        imageRendering: "pixelated",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};
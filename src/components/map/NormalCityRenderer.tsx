import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'house' | 'apartment' | 'shop' | 'office' | 'venue' | 'workplace';
  name: string;
  color: string;
  roofColor: string;
}

interface NormalCityRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const NormalCityRenderer: React.FC<NormalCityRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 400, y: 300, zoom: 1.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  
  const gameStore = useGameStore();
  const TILE_SIZE = 20; // 20px per tile for good visibility
  
  // Generate city layout
  useEffect(() => {
    const newBuildings: Building[] = [];
    let buildingId = 0;
    
    // Main street (horizontal through center)
    const mainStreetY = 15;
    
    // Downtown area - North side of main street
    // Music venues
    newBuildings.push({
      id: `venue-${buildingId++}`,
      x: 10, y: 8,
      width: 4, height: 3,
      type: 'venue',
      name: 'The Basement',
      color: '#8B4513',
      roofColor: '#D2691E'
    });
    
    newBuildings.push({
      id: `venue-${buildingId++}`,
      x: 15, y: 8,
      width: 3, height: 3,
      type: 'venue',
      name: 'Rock Club',
      color: '#4B0082',
      roofColor: '#6A0DAD'
    });
    
    // Shops
    newBuildings.push({
      id: `shop-${buildingId++}`,
      x: 19, y: 8,
      width: 3, height: 3,
      type: 'shop',
      name: 'Music Store',
      color: '#FF6347',
      roofColor: '#DC143C'
    });
    
    newBuildings.push({
      id: `shop-${buildingId++}`,
      x: 23, y: 8,
      width: 3, height: 3,
      type: 'shop',
      name: 'Coffee Shop',
      color: '#D2691E',
      roofColor: '#8B4513'
    });
    
    // Offices/Workplaces
    newBuildings.push({
      id: `office-${buildingId++}`,
      x: 27, y: 8,
      width: 4, height: 3,
      type: 'office',
      name: 'Record Label',
      color: '#4682B4',
      roofColor: '#191970'
    });
    
    newBuildings.push({
      id: `workplace-${buildingId++}`,
      x: 32, y: 8,
      width: 3, height: 3,
      type: 'workplace',
      name: 'Day Job Office',
      color: '#708090',
      roofColor: '#2F4F4F'
    });
    
    // South side of main street - Mixed use
    newBuildings.push({
      id: `shop-${buildingId++}`,
      x: 10, y: 18,
      width: 3, height: 3,
      type: 'shop',
      name: 'Convenience Store',
      color: '#32CD32',
      roofColor: '#228B22'
    });
    
    newBuildings.push({
      id: `venue-${buildingId++}`,
      x: 14, y: 18,
      width: 4, height: 3,
      type: 'venue',
      name: 'Jazz Lounge',
      color: '#8B008B',
      roofColor: '#4B0082'
    });
    
    newBuildings.push({
      id: `workplace-${buildingId++}`,
      x: 19, y: 18,
      width: 3, height: 3,
      type: 'workplace',
      name: 'Retail Job',
      color: '#FF8C00',
      roofColor: '#FF4500'
    });
    
    // Residential area - East side
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      newBuildings.push({
        id: `house-${buildingId++}`,
        x: 38 + col * 4,
        y: 8 + row * 5,
        width: 3, height: 3,
        type: 'house',
        name: `House ${i + 1}`,
        color: '#F4A460',
        roofColor: '#A52A2A'
      });
    }
    
    // Apartment buildings - West side
    newBuildings.push({
      id: `apartment-${buildingId++}`,
      x: 2, y: 8,
      width: 4, height: 5,
      type: 'apartment',
      name: 'Garden Apartments',
      color: '#DEB887',
      roofColor: '#8B7355'
    });
    
    newBuildings.push({
      id: `apartment-${buildingId++}`,
      x: 2, y: 18,
      width: 4, height: 5,
      type: 'apartment',
      name: 'City View Apartments',
      color: '#D2B48C',
      roofColor: '#8B7355'
    });
    
    // More venues based on player progress
    const extraVenues = Math.min(3, Math.floor(gameStore.reputation / 20));
    for (let i = 0; i < extraVenues; i++) {
      newBuildings.push({
        id: `venue-${buildingId++}`,
        x: 10 + i * 8,
        y: 25,
        width: 4, height: 3,
        type: 'venue',
        name: `Venue ${i + 4}`,
        color: '#483D8B',
        roofColor: '#191970'
      });
    }
    
    setBuildings(newBuildings);
  }, [gameStore.reputation]);
  
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
      
      setIsDragging(true);
      setDragStart({ x, y });
      setCameraStart({ x: camera.x, y: camera.y });
      
      // Check building clicks
      const worldPos = screenToWorld(x, y);
      const clickedBuilding = buildings.find(b => 
        worldPos.x >= b.x * TILE_SIZE &&
        worldPos.x <= (b.x + b.width) * TILE_SIZE &&
        worldPos.y >= b.y * TILE_SIZE &&
        worldPos.y <= (b.y + b.height) * TILE_SIZE
      );
      
      if (clickedBuilding && onBuildingClick) {
        onBuildingClick(clickedBuilding);
        haptics.light();
        soundManager.playBuildingSelect();
      }
    },
    [camera, screenToWorld, buildings, onBuildingClick]
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
        const building = buildings.find(b => 
          worldPos.x >= b.x * TILE_SIZE &&
          worldPos.x <= (b.x + b.width) * TILE_SIZE &&
          worldPos.y >= b.y * TILE_SIZE &&
          worldPos.y <= (b.y + b.height) * TILE_SIZE
        );
        setHoveredBuilding(building || null);
      }
    },
    [isDragging, dragStart, cameraStart, camera, screenToWorld, buildings]
  );
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newZoom = Math.max(0.5, Math.min(3, camera.zoom - e.deltaY * zoomSpeed));
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera]
  );
  
  // Draw building
  const drawBuilding = (ctx: CanvasRenderingContext2D, building: Building) => {
    const pos = worldToScreen(building.x * TILE_SIZE, building.y * TILE_SIZE);
    const w = building.width * TILE_SIZE * camera.zoom;
    const h = building.height * TILE_SIZE * camera.zoom;
    
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(pos.x + 4, pos.y + 4, w, h);
    
    // Building base
    ctx.fillStyle = building.color;
    ctx.fillRect(pos.x, pos.y, w, h);
    
    // Roof
    ctx.fillStyle = building.roofColor;
    ctx.fillRect(pos.x, pos.y, w, h * 0.3);
    
    // Windows
    ctx.fillStyle = "rgba(255, 255, 200, 0.8)";
    const windowSize = 8 * camera.zoom;
    const windowSpacing = 12 * camera.zoom;
    
    for (let wx = windowSpacing; wx < w - windowSize; wx += windowSpacing) {
      for (let wy = h * 0.4; wy < h - windowSize; wy += windowSpacing) {
        ctx.fillRect(pos.x + wx, pos.y + wy, windowSize, windowSize);
      }
    }
    
    // Door
    ctx.fillStyle = "#654321";
    const doorW = 12 * camera.zoom;
    const doorH = 20 * camera.zoom;
    ctx.fillRect(pos.x + w/2 - doorW/2, pos.y + h - doorH, doorW, doorH);
    
    // Hover effect
    if (hoveredBuilding === building) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x - 2, pos.y - 2, w + 4, h + 4);
    }
    
    // Building label
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${10 * camera.zoom}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(building.name, pos.x + w/2, pos.y - 5);
    
    // Type icon
    const icons: Record<string, string> = {
      venue: "♪",
      house: "🏠",
      apartment: "🏢",
      shop: "🛍️",
      office: "🏢",
      workplace: "💼"
    };
    
    if (icons[building.type]) {
      ctx.font = `${16 * camera.zoom}px Arial`;
      ctx.fillText(icons[building.type], pos.x + w/2, pos.y + h/2);
    }
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear with grass color
    ctx.fillStyle = "#90EE90";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grass texture
    ctx.fillStyle = "#7CFC00";
    for (let x = 0; x < width; x += 50) {
      for (let y = 0; y < height; y += 50) {
        if ((x + y) % 100 === 0) {
          ctx.fillRect(x, y, 50, 50);
        }
      }
    }
    
    // Draw roads
    ctx.fillStyle = "#505050";
    
    // Main street (horizontal)
    const mainStreetScreen = worldToScreen(0, 15 * TILE_SIZE);
    ctx.fillRect(
      mainStreetScreen.x,
      mainStreetScreen.y,
      60 * TILE_SIZE * camera.zoom,
      3 * TILE_SIZE * camera.zoom
    );
    
    // Cross streets (vertical)
    const crossStreets = [8, 20, 35];
    crossStreets.forEach(streetX => {
      const streetScreen = worldToScreen(streetX * TILE_SIZE, 0);
      ctx.fillRect(
        streetScreen.x,
        streetScreen.y,
        2 * TILE_SIZE * camera.zoom,
        40 * TILE_SIZE * camera.zoom
      );
    });
    
    // Road lines
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    // Main street center line
    ctx.beginPath();
    const lineY = worldToScreen(0, 16.5 * TILE_SIZE);
    ctx.moveTo(lineY.x, lineY.y);
    ctx.lineTo(lineY.x + 60 * TILE_SIZE * camera.zoom, lineY.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw sidewalks
    ctx.fillStyle = "#C0C0C0";
    // North sidewalk
    const northWalk = worldToScreen(0, 14.5 * TILE_SIZE);
    ctx.fillRect(northWalk.x, northWalk.y, 60 * TILE_SIZE * camera.zoom, 0.5 * TILE_SIZE * camera.zoom);
    // South sidewalk
    const southWalk = worldToScreen(0, 18 * TILE_SIZE);
    ctx.fillRect(southWalk.x, southWalk.y, 60 * TILE_SIZE * camera.zoom, 0.5 * TILE_SIZE * camera.zoom);
    
    // Draw buildings
    buildings.forEach(building => drawBuilding(ctx, building));
    
    // Draw trees
    ctx.fillStyle = "#228B22";
    const treePositions = [
      { x: 5, y: 5 }, { x: 7, y: 25 }, { x: 45, y: 5 },
      { x: 43, y: 25 }, { x: 25, y: 5 }, { x: 25, y: 25 }
    ];
    
    treePositions.forEach(tree => {
      const treeScreen = worldToScreen(tree.x * TILE_SIZE, tree.y * TILE_SIZE);
      
      // Tree shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.ellipse(
        treeScreen.x,
        treeScreen.y + 15 * camera.zoom,
        15 * camera.zoom,
        8 * camera.zoom,
        0, 0, Math.PI * 2
      );
      ctx.fill();
      
      // Tree trunk
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(
        treeScreen.x - 5 * camera.zoom,
        treeScreen.y,
        10 * camera.zoom,
        20 * camera.zoom
      );
      
      // Tree foliage
      ctx.fillStyle = "#228B22";
      ctx.beginPath();
      ctx.arc(treeScreen.x, treeScreen.y - 10 * camera.zoom, 20 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // UI Overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground City", 20, 35);
    
    // Stats
    ctx.font = "14px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`🎵 Venues: ${buildings.filter(b => b.type === 'venue').length}`, 200, 25);
    ctx.fillStyle = "#90EE90";
    ctx.fillText(`💼 Workplaces: ${buildings.filter(b => b.type === 'workplace').length}`, 200, 45);
    ctx.fillStyle = "#87CEEB";
    ctx.fillText(`🏠 Housing: ${buildings.filter(b => b.type === 'house' || b.type === 'apartment').length}`, 320, 25);
    ctx.fillStyle = "#FFB6C1";
    ctx.fillText(`🛍️ Shops: ${buildings.filter(b => b.type === 'shop').length}`, 320, 45);
    
    // Hover info
    if (hoveredBuilding) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(width - 200, 70, 190, 60);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Arial";
      ctx.fillText(hoveredBuilding.name, width - 190, 90);
      
      ctx.font = "12px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(`Type: ${hoveredBuilding.type}`, width - 190, 110);
      ctx.fillText("Click to interact", width - 190, 125);
    }
  }, [camera, width, height, buildings, hoveredBuilding, worldToScreen]);
  
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
        cursor: isDragging ? "grabbing" : hoveredBuilding ? "pointer" : "grab",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};
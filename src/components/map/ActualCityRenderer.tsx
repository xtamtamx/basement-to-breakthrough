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

interface ActualCityRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const ActualCityRenderer: React.FC<ActualCityRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 400, y: 300, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [spriteSheet, setSpriteSheet] = useState<HTMLImageElement | null>(null);
  
  const gameStore = useGameStore();
  
  // Load sprites
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/houses-sprite-sheet.png";
    img.onload = () => setSpriteSheet(img);
  }, []);
  
  // Generate actual city
  useEffect(() => {
    const newBuildings: Building[] = [];
    let id = 0;
    
    // City parameters
    const BUILDING_SIZE = 40;
    const SMALL_BUILDING = 30;
    const STREET_WIDTH = 15;
    const SIDEWALK = 3;
    
    // Main streets layout
    const mainStreetY = 300;
    const mainStreetX = 400;
    
    // Downtown core (dense commercial/venues)
    // North of main street
    for (let x = 200; x < 600; x += BUILDING_SIZE + 5) {
      for (let y = 150; y < mainStreetY - STREET_WIDTH; y += BUILDING_SIZE + 5) {
        if (Math.random() > 0.2) {
          const isVenue = x > 350 && x < 450 && Math.random() > 0.7;
          const isShop = !isVenue && Math.random() > 0.5;
          
          newBuildings.push({
            id: `building-${id++}`,
            x,
            y,
            width: BUILDING_SIZE,
            height: BUILDING_SIZE,
            type: isVenue ? 'venue' : isShop ? 'shop' : 'office',
            name: isVenue ? ['The Basement', 'Rock Club', 'Jazz Bar'][id % 3] : 
                  isShop ? ['Music Store', 'Coffee Shop', 'Diner'][id % 3] : 
                  'Office Building',
            color: isVenue ? '#8B008B' : isShop ? '#CD853F' : '#4682B4',
            roofColor: isVenue ? '#4B0082' : isShop ? '#8B4513' : '#191970'
          });
        }
      }
    }
    
    // South of main street (mixed use)
    for (let x = 200; x < 600; x += BUILDING_SIZE + 5) {
      for (let y = mainStreetY + STREET_WIDTH + 10; y < 450; y += BUILDING_SIZE + 5) {
        if (Math.random() > 0.3) {
          const type = Math.random() > 0.7 ? 'workplace' : 
                       Math.random() > 0.5 ? 'shop' : 'apartment';
          
          newBuildings.push({
            id: `building-${id++}`,
            x,
            y,
            width: BUILDING_SIZE,
            height: type === 'apartment' ? BUILDING_SIZE + 10 : BUILDING_SIZE,
            type,
            name: type === 'workplace' ? 'Day Job Co.' : 
                  type === 'shop' ? 'Store' : 'Apartments',
            color: type === 'workplace' ? '#708090' : 
                   type === 'shop' ? '#DEB887' : '#BC8F8F',
            roofColor: type === 'workplace' ? '#2F4F4F' : 
                       type === 'shop' ? '#A0522D' : '#8B4513'
          });
        }
      }
    }
    
    // Residential neighborhoods (east and west)
    // West side
    for (let x = 50; x < 180; x += SMALL_BUILDING + 8) {
      for (let y = 100; y < 500; y += SMALL_BUILDING + 8) {
        if (Math.random() > 0.3) {
          newBuildings.push({
            id: `house-${id++}`,
            x,
            y,
            width: SMALL_BUILDING,
            height: SMALL_BUILDING,
            type: 'house',
            name: 'House',
            color: '#F4A460',
            roofColor: '#A52A2A'
          });
        }
      }
    }
    
    // East side
    for (let x = 620; x < 780; x += SMALL_BUILDING + 8) {
      for (let y = 100; y < 500; y += SMALL_BUILDING + 8) {
        if (Math.random() > 0.3) {
          const isApartment = Math.random() > 0.8;
          newBuildings.push({
            id: `residence-${id++}`,
            x,
            y,
            width: isApartment ? BUILDING_SIZE : SMALL_BUILDING,
            height: isApartment ? BUILDING_SIZE + 15 : SMALL_BUILDING,
            type: isApartment ? 'apartment' : 'house',
            name: isApartment ? 'Apartment Building' : 'House',
            color: isApartment ? '#D2B48C' : '#FFDEAD',
            roofColor: isApartment ? '#696969' : '#CD853F'
          });
        }
      }
    }
    
    // Add some larger buildings for variety
    // City hall
    newBuildings.push({
      id: 'city-hall',
      x: 380,
      y: 250,
      width: 60,
      height: 40,
      type: 'office',
      name: 'City Hall',
      color: '#B0C4DE',
      roofColor: '#483D8B'
    });
    
    // Large venue
    if (gameStore.reputation > 10) {
      newBuildings.push({
        id: 'arena',
        x: 300,
        y: 180,
        width: 50,
        height: 50,
        type: 'venue',
        name: 'The Arena',
        color: '#8B008B',
        roofColor: '#4B0082'
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
      
      const worldPos = screenToWorld(x, y);
      const clickedBuilding = buildings.find(b => 
        worldPos.x >= b.x &&
        worldPos.x <= b.x + b.width &&
        worldPos.y >= b.y &&
        worldPos.y <= b.y + b.height
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
        const worldPos = screenToWorld(x, y);
        const building = buildings.find(b => 
          worldPos.x >= b.x &&
          worldPos.x <= b.x + b.width &&
          worldPos.y >= b.y &&
          worldPos.y <= b.y + b.height
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
  
  // Draw building with sprites or fallback
  const drawBuilding = (ctx: CanvasRenderingContext2D, building: Building) => {
    const pos = worldToScreen(building.x, building.y);
    const w = building.width * camera.zoom;
    const h = building.height * camera.zoom;
    
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(pos.x + 3, pos.y + 3, w, h);
    
    if (spriteSheet && building.width >= 30) {
      // Use sprites for larger buildings
      const spriteMap: Record<string, {row: number, col: number}> = {
        'venue': {row: 4, col: 0},
        'house': {row: 0, col: 0},
        'apartment': {row: 9, col: 0},
        'shop': {row: 1, col: 0},
        'office': {row: 14, col: 0},
        'workplace': {row: 10, col: 0}
      };
      
      const sprite = spriteMap[building.type] || {row: 0, col: 0};
      
      ctx.drawImage(
        spriteSheet,
        sprite.col * 32,
        sprite.row * 32,
        32, 32,
        pos.x, pos.y, w, h
      );
    } else {
      // Fallback or small buildings
      // Building base
      ctx.fillStyle = building.color;
      ctx.fillRect(pos.x, pos.y, w, h);
      
      // Roof
      ctx.fillStyle = building.roofColor;
      ctx.fillRect(pos.x, pos.y, w, h * 0.3);
      
      // Simple windows
      if (building.width >= 30) {
        ctx.fillStyle = "rgba(255, 255, 200, 0.7)";
        const windowSize = 4 * camera.zoom;
        for (let wx = windowSize; wx < w - windowSize; wx += windowSize * 2) {
          for (let wy = h * 0.4; wy < h - windowSize; wy += windowSize * 2) {
            ctx.fillRect(pos.x + wx, pos.y + wy, windowSize, windowSize);
          }
        }
      }
    }
    
    // Hover effect
    if (hoveredBuilding === building) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - 1, pos.y - 1, w + 2, h + 2);
    }
    
    // Venue indicator
    if (building.type === 'venue') {
      ctx.fillStyle = "#FFD700";
      ctx.font = `${12 * camera.zoom}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("♪", pos.x + w/2, pos.y + h/2);
    }
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Background (concrete/asphalt base)
    ctx.fillStyle = "#696969";
    ctx.fillRect(0, 0, width, height);
    
    // Add some ground texture
    for (let x = 0; x < width; x += 100) {
      for (let y = 0; y < height; y += 100) {
        ctx.fillStyle = Math.random() > 0.5 ? "#656565" : "#6D6D6D";
        const worldPos = screenToWorld(x, y);
        const screenPos = worldToScreen(
          Math.floor(worldPos.x / 20) * 20,
          Math.floor(worldPos.y / 20) * 20
        );
        ctx.fillRect(screenPos.x, screenPos.y, 20 * camera.zoom, 20 * camera.zoom);
      }
    }
    
    // Main streets
    ctx.fillStyle = "#2C3E50";
    
    // Horizontal main street
    const mainY = worldToScreen(0, 300);
    ctx.fillRect(0, mainY.y, width, 15 * camera.zoom);
    
    // Vertical main street  
    const mainX = worldToScreen(400, 0);
    ctx.fillRect(mainX.x, 0, 15 * camera.zoom, height);
    
    // Secondary streets
    ctx.fillStyle = "#34495E";
    
    // Horizontal streets
    [200, 400, 500].forEach(y => {
      const streetY = worldToScreen(0, y);
      ctx.fillRect(0, streetY.y, width, 10 * camera.zoom);
    });
    
    // Vertical streets
    [200, 300, 500, 600].forEach(x => {
      const streetX = worldToScreen(x, 0);
      ctx.fillRect(streetX.x, 0, 10 * camera.zoom, height);
    });
    
    // Sidewalks
    ctx.fillStyle = "#95A5A6";
    
    // Main street sidewalks
    const sidewalkY1 = worldToScreen(0, 295);
    const sidewalkY2 = worldToScreen(0, 315);
    ctx.fillRect(0, sidewalkY1.y, width, 5 * camera.zoom);
    ctx.fillRect(0, sidewalkY2.y, width, 5 * camera.zoom);
    
    // Draw all buildings
    const sortedBuildings = [...buildings].sort((a, b) => a.y - b.y);
    sortedBuildings.forEach(building => drawBuilding(ctx, building));
    
    // Add some trees/greenery
    ctx.fillStyle = "#228B22";
    const treeSpots = [
      {x: 150, y: 250}, {x: 650, y: 350}, {x: 350, y: 450},
      {x: 450, y: 150}, {x: 250, y: 380}, {x: 550, y: 220}
    ];
    
    treeSpots.forEach(tree => {
      const pos = worldToScreen(tree.x, tree.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Street lights
    ctx.fillStyle = "#F39C12";
    [300, 400, 500].forEach(x => {
      [250, 350].forEach(y => {
        const pos = worldToScreen(x, y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    // UI
    ctx.fillStyle = "rgba(44, 62, 80, 0.95)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Underground City", 20, 35);
    
    // Count buildings
    const venues = buildings.filter(b => b.type === 'venue').length;
    const workplaces = buildings.filter(b => b.type === 'workplace').length;
    const shops = buildings.filter(b => b.type === 'shop').length;
    const homes = buildings.filter(b => b.type === 'house' || b.type === 'apartment').length;
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#E74C3C";
    ctx.fillText(`♪ ${venues} Venues`, 250, 35);
    
    ctx.fillStyle = "#3498DB";
    ctx.fillText(`💼 ${workplaces} Workplaces`, 350, 35);
    
    ctx.fillStyle = "#F39C12";
    ctx.fillText(`🛍️ ${shops} Shops`, 480, 35);
    
    ctx.fillStyle = "#2ECC71";
    ctx.fillText(`🏠 ${homes} Homes`, 580, 35);
    
    // Hover tooltip
    if (hoveredBuilding) {
      const pos = worldToScreen(hoveredBuilding.x, hoveredBuilding.y);
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(pos.x, pos.y - 25, hoveredBuilding.name.length * 8, 20);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(hoveredBuilding.name, pos.x + 5, pos.y - 10);
    }
  }, [camera, width, height, buildings, hoveredBuilding, worldToScreen, screenToWorld, spriteSheet]);
  
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
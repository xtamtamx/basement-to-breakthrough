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
  spriteRow: number;
  spriteCol: number;
}

interface ProperScaleCityRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const ProperScaleCityRenderer: React.FC<ProperScaleCityRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 600, y: 400, zoom: 1.2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [spriteSheet, setSpriteSheet] = useState<HTMLImageElement | null>(null);
  
  const gameStore = useGameStore();
  const BLOCK_SIZE = 120; // Size of a city block
  const STREET_WIDTH = 20; // Width of streets
  const BUILDING_PADDING = 10; // Padding within blocks
  
  // Load sprite sheet
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/houses-sprite-sheet.png";
    img.onload = () => {
      setSpriteSheet(img);
    };
  }, []);
  
  // Generate reasonable city
  useEffect(() => {
    const newBuildings: Building[] = [];
    let buildingId = 0;
    
    // Calculate player progress
    const progress = Math.min(5, 
      Math.floor(
        ((gameStore.venues?.length || 0) * 2 + 
         (gameStore.allBands?.length || 0) + 
         (gameStore.reputation || 0) * 0.1) / 10
      )
    );
    
    // City grid layout - 10x8 blocks
    const gridWidth = 10;
    const gridHeight = 8;
    
    // Start with a small downtown area (2-3 venues max to start)
    const venueCount = Math.min(3, 1 + progress);
    const workplaceCount = Math.min(4, 2 + Math.floor(progress / 2));
    const shopCount = Math.min(6, 3 + progress);
    const houseCount = 15 + progress * 5;
    const apartmentCount = 2 + Math.floor(progress / 2);
    
    // Place buildings in city blocks
    let placedVenues = 0;
    let placedWorkplaces = 0;
    let placedShops = 0;
    let placedHouses = 0;
    let placedApartments = 0;
    
    // Downtown area (center blocks)
    for (let y = 3; y <= 4; y++) {
      for (let x = 4; x <= 5; x++) {
        const blockX = x * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        const blockY = y * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        
        // Place 1-2 buildings per downtown block
        if (placedVenues < venueCount && Math.random() > 0.3) {
          newBuildings.push({
            id: `venue-${buildingId++}`,
            x: blockX + BUILDING_PADDING,
            y: blockY + BUILDING_PADDING,
            width: BLOCK_SIZE - BUILDING_PADDING * 2,
            height: BLOCK_SIZE - BUILDING_PADDING * 2,
            type: 'venue',
            name: ['The Basement', 'Rock Club', 'Jazz Lounge', 'Metal Den'][placedVenues],
            spriteRow: 4 + (placedVenues % 3),
            spriteCol: placedVenues % 3
          });
          placedVenues++;
        } else if (placedShops < shopCount / 2) {
          newBuildings.push({
            id: `shop-${buildingId++}`,
            x: blockX + BUILDING_PADDING,
            y: blockY + BUILDING_PADDING,
            width: BLOCK_SIZE - BUILDING_PADDING * 2,
            height: BLOCK_SIZE - BUILDING_PADDING * 2,
            type: 'shop',
            name: ['Music Store', 'Coffee Shop', 'Record Shop'][placedShops % 3],
            spriteRow: 1,
            spriteCol: placedShops % 3
          });
          placedShops++;
        }
      }
    }
    
    // Commercial area (near downtown)
    for (let y = 2; y <= 5; y++) {
      for (let x = 2; x <= 7; x++) {
        // Skip downtown blocks
        if (x >= 4 && x <= 5 && y >= 3 && y <= 4) continue;
        
        const blockX = x * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        const blockY = y * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        
        if (placedWorkplaces < workplaceCount && Math.random() > 0.6) {
          newBuildings.push({
            id: `workplace-${buildingId++}`,
            x: blockX + BUILDING_PADDING,
            y: blockY + BUILDING_PADDING,
            width: BLOCK_SIZE - BUILDING_PADDING * 2,
            height: BLOCK_SIZE - BUILDING_PADDING * 2,
            type: 'workplace',
            name: ['Office Building', 'Day Job Inc', 'Corporate Tower'][placedWorkplaces % 3],
            spriteRow: 10,
            spriteCol: placedWorkplaces % 3
          });
          placedWorkplaces++;
        } else if (placedShops < shopCount && Math.random() > 0.5) {
          newBuildings.push({
            id: `shop-${buildingId++}`,
            x: blockX + BUILDING_PADDING,
            y: blockY + BUILDING_PADDING,
            width: BLOCK_SIZE - BUILDING_PADDING * 2,
            height: BLOCK_SIZE - BUILDING_PADDING * 2,
            type: 'shop',
            name: ['Grocery Store', 'Clothing Shop', 'Electronics'][placedShops % 3],
            spriteRow: 7,
            spriteCol: placedShops % 3
          });
          placedShops++;
        }
      }
    }
    
    // Residential areas (outer blocks)
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        // Skip downtown and commercial areas
        if (x >= 2 && x <= 7 && y >= 2 && y <= 5) continue;
        
        const blockX = x * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        const blockY = y * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        
        // Place 2-4 houses per residential block
        const housesInBlock = 2 + Math.floor(Math.random() * 3);
        for (let h = 0; h < housesInBlock && placedHouses < houseCount; h++) {
          const houseX = blockX + BUILDING_PADDING + (h % 2) * (BLOCK_SIZE / 2);
          const houseY = blockY + BUILDING_PADDING + Math.floor(h / 2) * (BLOCK_SIZE / 2);
          
          newBuildings.push({
            id: `house-${buildingId++}`,
            x: houseX,
            y: houseY,
            width: BLOCK_SIZE / 2 - BUILDING_PADDING * 1.5,
            height: BLOCK_SIZE / 2 - BUILDING_PADDING * 1.5,
            type: 'house',
            name: `House ${placedHouses + 1}`,
            spriteRow: [0, 2, 6][Math.floor(placedHouses / 10) % 3],
            spriteCol: placedHouses % 3
          });
          placedHouses++;
        }
        
        // Occasionally place apartments
        if (placedApartments < apartmentCount && Math.random() > 0.9) {
          newBuildings.push({
            id: `apartment-${buildingId++}`,
            x: blockX + BUILDING_PADDING,
            y: blockY + BUILDING_PADDING,
            width: BLOCK_SIZE - BUILDING_PADDING * 2,
            height: BLOCK_SIZE - BUILDING_PADDING * 2,
            type: 'apartment',
            name: `Apartment Complex ${placedApartments + 1}`,
            spriteRow: 9,
            spriteCol: placedApartments % 3
          });
          placedApartments++;
        }
      }
    }
    
    setBuildings(newBuildings);
  }, [gameStore.venues?.length, gameStore.allBands?.length, gameStore.reputation]);
  
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
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Background
    ctx.fillStyle = "#2C3E50";
    ctx.fillRect(0, 0, width, height);
    
    // Draw city blocks
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 10; x++) {
        const blockX = x * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        const blockY = y * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH;
        const blockPos = worldToScreen(blockX, blockY);
        
        // Grass blocks
        ctx.fillStyle = "#27AE60";
        ctx.fillRect(
          blockPos.x,
          blockPos.y,
          BLOCK_SIZE * camera.zoom,
          BLOCK_SIZE * camera.zoom
        );
        
        // Add some texture
        ctx.fillStyle = "#229954";
        for (let i = 0; i < 5; i++) {
          const grassX = blockPos.x + Math.random() * BLOCK_SIZE * camera.zoom;
          const grassY = blockPos.y + Math.random() * BLOCK_SIZE * camera.zoom;
          ctx.fillRect(grassX, grassY, 10 * camera.zoom, 10 * camera.zoom);
        }
      }
    }
    
    // Draw streets (horizontal)
    ctx.fillStyle = "#34495E";
    for (let y = 0; y <= 8; y++) {
      const streetY = y * (BLOCK_SIZE + STREET_WIDTH);
      const streetPos = worldToScreen(0, streetY);
      ctx.fillRect(
        streetPos.x,
        streetPos.y,
        10 * (BLOCK_SIZE + STREET_WIDTH) * camera.zoom,
        STREET_WIDTH * camera.zoom
      );
    }
    
    // Draw streets (vertical)
    for (let x = 0; x <= 10; x++) {
      const streetX = x * (BLOCK_SIZE + STREET_WIDTH);
      const streetPos = worldToScreen(streetX, 0);
      ctx.fillRect(
        streetPos.x,
        streetPos.y,
        STREET_WIDTH * camera.zoom,
        8 * (BLOCK_SIZE + STREET_WIDTH) * camera.zoom
      );
    }
    
    // Draw yellow lines on main streets
    ctx.strokeStyle = "#F1C40F";
    ctx.lineWidth = 2 * camera.zoom;
    ctx.setLineDash([20 * camera.zoom, 20 * camera.zoom]);
    
    // Main horizontal street
    const mainY = 4 * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH / 2;
    const mainStart = worldToScreen(0, mainY);
    const mainEnd = worldToScreen(10 * (BLOCK_SIZE + STREET_WIDTH), mainY);
    ctx.beginPath();
    ctx.moveTo(mainStart.x, mainStart.y);
    ctx.lineTo(mainEnd.x, mainEnd.y);
    ctx.stroke();
    
    // Main vertical street
    const mainX = 5 * (BLOCK_SIZE + STREET_WIDTH) + STREET_WIDTH / 2;
    const vertStart = worldToScreen(mainX, 0);
    const vertEnd = worldToScreen(mainX, 8 * (BLOCK_SIZE + STREET_WIDTH));
    ctx.beginPath();
    ctx.moveTo(vertStart.x, vertStart.y);
    ctx.lineTo(vertEnd.x, vertEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw buildings
    buildings.forEach(building => {
      const pos = worldToScreen(building.x, building.y);
      
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        pos.x + 4 * camera.zoom,
        pos.y + 4 * camera.zoom,
        building.width * camera.zoom,
        building.height * camera.zoom
      );
      
      if (spriteSheet) {
        // Draw sprite
        ctx.drawImage(
          spriteSheet,
          building.spriteCol * 32,
          building.spriteRow * 32,
          32, 32,
          pos.x,
          pos.y,
          building.width * camera.zoom,
          building.height * camera.zoom
        );
      } else {
        // Fallback
        const colors: Record<string, string> = {
          house: "#E67E22",
          apartment: "#95A5A6",
          shop: "#E74C3C",
          venue: "#9B59B6",
          workplace: "#3498DB",
          office: "#2980B9"
        };
        
        ctx.fillStyle = colors[building.type] || "#7F8C8D";
        ctx.fillRect(pos.x, pos.y, building.width * camera.zoom, building.height * camera.zoom);
      }
      
      // Hover effect
      if (hoveredBuilding === building) {
        ctx.strokeStyle = "#F1C40F";
        ctx.lineWidth = 3 * camera.zoom;
        ctx.strokeRect(
          pos.x - 2,
          pos.y - 2,
          building.width * camera.zoom + 4,
          building.height * camera.zoom + 4
        );
        
        // Name label
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(
          pos.x,
          pos.y - 25 * camera.zoom,
          building.name.length * 8 * camera.zoom,
          20 * camera.zoom
        );
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${12 * camera.zoom}px Arial`;
        ctx.fillText(building.name, pos.x + 5 * camera.zoom, pos.y - 10 * camera.zoom);
      }
      
      // Venue music note
      if (building.type === 'venue') {
        ctx.fillStyle = "#F1C40F";
        ctx.font = `bold ${20 * camera.zoom}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          "♪",
          pos.x + building.width * camera.zoom / 2,
          pos.y + building.height * camera.zoom / 2
        );
        ctx.textAlign = "left";
      }
    });
    
    // UI
    ctx.fillStyle = "rgba(44, 62, 80, 0.95)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Underground City", 20, 35);
    
    // Reasonable stats
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
  }, [camera, width, height, buildings, hoveredBuilding, spriteSheet, worldToScreen]);
  
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
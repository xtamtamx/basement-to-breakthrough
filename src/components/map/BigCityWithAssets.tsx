import React, { useRef, useEffect, useCallback, useState } from "react";
import { RealisticTownGenerator } from "@/game/generation/RealisticTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface BigCityWithAssetsProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const BigCityWithAssets: React.FC<BigCityWithAssetsProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 800, y: 600, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [houseSprites, setHouseSprites] = useState<HTMLImageElement | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<any>(null);
  
  const gameStore = useGameStore();
  const TILE_SIZE = 32; // Bigger tiles for better visibility
  
  // Load house sprites
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/houses-sprite-sheet.png";
    img.onload = () => {
      setHouseSprites(img);
      setSpritesLoaded(true);
    };
    img.onerror = () => {
      console.warn("Failed to load sprites, using fallback rendering");
      setSpritesLoaded(false);
    };
  }, []);
  
  // Generate big city
  useEffect(() => {
    const generator = new RealisticTownGenerator(100, 80); // Much bigger city
    const playerStats = {
      showsBooked:
        (gameStore.scheduledShows?.length || 0) +
        (gameStore.showHistory?.length || 0) + 30, // Boost for bigger city
      venuesOwned: (gameStore.venues?.length || 0) + 10,
      bandsManaged: (gameStore.allBands?.length || 0) + 15,
      sceneReputation: (gameStore.reputation || 0) + 75,
    };
    
    const generatedTown = generator.generateTown(playerStats);
    setTown(generatedTown);
    
    // Center camera on town square
    if (generatedTown.townSquare) {
      setCamera({
        x:
          generatedTown.townSquare.x * TILE_SIZE +
          (generatedTown.townSquare.width * TILE_SIZE) / 2,
        y:
          generatedTown.townSquare.y * TILE_SIZE +
          (generatedTown.townSquare.height * TILE_SIZE) / 2,
        zoom: window.innerWidth < 768 ? 0.6 : 1,
      });
    }
  }, [
    gameStore.scheduledShows?.length,
    gameStore.showHistory?.length,
    gameStore.venues?.length,
    gameStore.allBands?.length,
    gameStore.reputation,
  ]);
  
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
  
  // Mouse/touch handlers
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
      if (town && onBuildingClick) {
        const worldPos = screenToWorld(x, y);
        const tileX = Math.floor(worldPos.x / TILE_SIZE);
        const tileY = Math.floor(worldPos.y / TILE_SIZE);
        
        const clickedBuilding = town.buildings.find(
          (b) =>
            tileX >= b.x &&
            tileX < b.x + b.width &&
            tileY >= b.y &&
            tileY < b.y + b.height
        );
        
        if (clickedBuilding) {
          onBuildingClick(clickedBuilding);
          haptics.light();
          soundManager.playBuildingSelect();
        }
      }
    },
    [camera, screenToWorld, town, onBuildingClick]
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
        if (town) {
          const worldPos = screenToWorld(x, y);
          const tileX = Math.floor(worldPos.x / TILE_SIZE);
          const tileY = Math.floor(worldPos.y / TILE_SIZE);
          
          const building = town.buildings.find(
            (b) =>
              tileX >= b.x &&
              tileX < b.x + b.width &&
              tileY >= b.y &&
              tileY < b.y + b.height
          );
          
          setHoveredBuilding(building || null);
        }
      }
    },
    [isDragging, dragStart, cameraStart, camera, screenToWorld, town]
  );
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newZoom = Math.max(
        0.3,
        Math.min(2, camera.zoom - e.deltaY * zoomSpeed)
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera]
  );
  
  // Get sprite coordinates for a building type
  const getSpriteCoords = (building: any): { sx: number; sy: number } => {
    // Map building types to sprite sheet positions (32x32 sprites)
    const spriteMap: Record<string, { row: number; col: number }[]> = {
      house: [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
        { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
      ],
      apartment: [
        { row: 9, col: 0 }, { row: 9, col: 1 }, { row: 9, col: 2 },
        { row: 14, col: 0 }, { row: 14, col: 1 },
      ],
      shop: [
        { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
        { row: 7, col: 0 }, { row: 7, col: 1 },
      ],
      venue: [
        { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 },
        { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
        { row: 11, col: 0 }, { row: 11, col: 1 },
      ],
      workplace: [
        { row: 10, col: 0 }, { row: 10, col: 1 }, { row: 10, col: 2 },
      ],
      office: [
        { row: 14, col: 0 }, { row: 14, col: 1 }, { row: 14, col: 2 },
      ],
      community: [
        { row: 12, col: 0 }, { row: 12, col: 1 }, { row: 12, col: 2 },
      ],
    };
    
    const options = spriteMap[building.type] || spriteMap.house;
    const selected = options[(building.x + building.y * 7) % options.length];
    
    return {
      sx: selected.col * 32,
      sy: selected.row * 32,
    };
  };
  
  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Enable pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    
    // Clear with grass color
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, width, height);
    
    // Calculate visible area
    const startTileX = Math.floor(screenToWorld(0, 0).x / TILE_SIZE) - 2;
    const endTileX = Math.ceil(screenToWorld(width, 0).x / TILE_SIZE) + 2;
    const startTileY = Math.floor(screenToWorld(0, 0).y / TILE_SIZE) - 2;
    const endTileY = Math.ceil(screenToWorld(0, height).y / TILE_SIZE) + 2;
    
    // Layer 1: Grass with patterns
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Grass variation
        if ((x + y) % 7 === 0) {
          ctx.fillStyle = "#3E8E41";
        } else if ((x * 2 + y) % 11 === 0) {
          ctx.fillStyle = "#52C752";
        } else {
          ctx.fillStyle = "#4CAF50";
        }
        
        ctx.fillRect(pos.x, pos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
      }
    }
    
    // Layer 2: Roads
    ctx.fillStyle = "#2C3E50"; // Dark asphalt
    town.roads.forEach((road) => {
      const isAvenue = road.type === "avenue";
      ctx.fillStyle = isAvenue ? "#1A252F" : "#2C3E50";
      
      road.points.forEach((point) => {
        for (let w = 0; w < road.width; w++) {
          const isHorizontal = road.points.length > 1 && 
            Math.abs(road.points[1].x - road.points[0].x) > Math.abs(road.points[1].y - road.points[0].y);
          
          const roadX = isHorizontal ? point.x : point.x + w;
          const roadY = isHorizontal ? point.y + w : point.y;
          
          const roadPos = worldToScreen(roadX * TILE_SIZE, roadY * TILE_SIZE);
          ctx.fillRect(roadPos.x, roadPos.y, TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom);
        }
      });
      
      // Draw road lines for avenues
      if (isAvenue) {
        ctx.strokeStyle = "#F39C12";
        ctx.lineWidth = 2 * camera.zoom;
        ctx.setLineDash([20 * camera.zoom, 20 * camera.zoom]);
        
        const isHorizontal = road.points.length > 1 &&
          Math.abs(road.points[1].x - road.points[0].x) > Math.abs(road.points[1].y - road.points[0].y);
        
        if (isHorizontal) {
          const centerY = road.points[0].y + road.width / 2;
          const start = worldToScreen(0, centerY * TILE_SIZE);
          const end = worldToScreen(100 * TILE_SIZE, centerY * TILE_SIZE);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        } else {
          const centerX = road.points[0].x + road.width / 2;
          const start = worldToScreen(centerX * TILE_SIZE, 0);
          const end = worldToScreen(centerX * TILE_SIZE, 80 * TILE_SIZE);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      }
    });
    ctx.setLineDash([]);
    
    // Layer 3: Town square/plaza
    const square = town.townSquare;
    ctx.fillStyle = "#95A5A6";
    const squarePos = worldToScreen(square.x * TILE_SIZE, square.y * TILE_SIZE);
    ctx.fillRect(
      squarePos.x,
      squarePos.y,
      square.width * TILE_SIZE * camera.zoom,
      square.height * TILE_SIZE * camera.zoom
    );
    
    // Plaza pattern
    ctx.strokeStyle = "#7F8C8D";
    ctx.lineWidth = 1;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const tilePos = worldToScreen(
          (square.x + x) * TILE_SIZE,
          (square.y + y) * TILE_SIZE
        );
        ctx.strokeRect(
          tilePos.x,
          tilePos.y,
          TILE_SIZE * camera.zoom,
          TILE_SIZE * camera.zoom
        );
      }
    }
    
    // Fountain
    if (square.features.includes("fountain")) {
      const fountainX = square.x + square.width / 2;
      const fountainY = square.y + square.height / 2;
      const fountainPos = worldToScreen(fountainX * TILE_SIZE, fountainY * TILE_SIZE);
      
      ctx.fillStyle = "#3498DB";
      ctx.beginPath();
      ctx.arc(fountainPos.x, fountainPos.y, TILE_SIZE * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#5DADE2";
      ctx.beginPath();
      ctx.arc(fountainPos.x, fountainPos.y, TILE_SIZE * 0.7 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Layer 4: Parks
    town.greenSpaces.forEach((green) => {
      if (green.type === "park") {
        const parkPos = worldToScreen(
          (green.x - green.radius) * TILE_SIZE,
          (green.y - green.radius) * TILE_SIZE
        );
        
        ctx.fillStyle = "#27AE60";
        ctx.fillRect(
          parkPos.x,
          parkPos.y,
          green.radius * 2 * TILE_SIZE * camera.zoom,
          green.radius * 2 * TILE_SIZE * camera.zoom
        );
        
        // Trees in park
        for (let i = 0; i < green.radius * 2; i++) {
          const angle = (i / (green.radius * 2)) * Math.PI * 2;
          const dist = green.radius * 0.7;
          const treeX = green.x + Math.cos(angle) * dist;
          const treeY = green.y + Math.sin(angle) * dist;
          const treePos = worldToScreen(treeX * TILE_SIZE, treeY * TILE_SIZE);
          
          // Simple tree
          ctx.fillStyle = "#0B5345";
          ctx.beginPath();
          ctx.arc(treePos.x, treePos.y, TILE_SIZE * 0.5 * camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    
    // Layer 5: Buildings (sorted for depth)
    const sortedBuildings = [...town.buildings].sort((a, b) => a.y - b.y);
    
    sortedBuildings.forEach((building) => {
      const pos = worldToScreen(building.x * TILE_SIZE, building.y * TILE_SIZE);
      
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        pos.x + 4 * camera.zoom,
        pos.y + 4 * camera.zoom,
        building.width * TILE_SIZE * camera.zoom,
        building.height * TILE_SIZE * camera.zoom
      );
      
      if (spritesLoaded && houseSprites) {
        // Use actual sprites
        const { sx, sy } = getSpriteCoords(building);
        
        ctx.drawImage(
          houseSprites,
          sx, sy, 32, 32, // Source rectangle
          pos.x,
          pos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
      } else {
        // Fallback rendering
        const colorMap: Record<string, { base: string; roof: string }> = {
          house: { base: "#DEB887", roof: "#8B4513" },
          apartment: { base: "#D2B48C", roof: "#696969" },
          shop: { base: "#FFE4B5", roof: "#DC143C" },
          venue: { base: "#8B008B", roof: "#4B0082" },
          workplace: { base: "#B0C4DE", roof: "#4682B4" },
          office: { base: "#778899", roof: "#2F4F4F" },
          community: { base: "#F0E68C", roof: "#BDB76B" },
        };
        
        const colors = colorMap[building.type] || colorMap.house;
        
        // Building base
        ctx.fillStyle = colors.base;
        ctx.fillRect(
          pos.x,
          pos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
        
        // Roof
        ctx.fillStyle = colors.roof;
        ctx.fillRect(
          pos.x,
          pos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * 0.3 * camera.zoom
        );
      }
      
      // Hover effect
      if (hoveredBuilding === building) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3 * camera.zoom;
        ctx.strokeRect(
          pos.x - 2,
          pos.y - 2,
          building.width * TILE_SIZE * camera.zoom + 4,
          building.height * TILE_SIZE * camera.zoom + 4
        );
      }
      
      // Venue indicator
      if (building.type === "venue") {
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold ${14 * camera.zoom}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          "♪",
          pos.x + (building.width * TILE_SIZE * camera.zoom) / 2,
          pos.y - 5 * camera.zoom
        );
      }
    });
    
    // UI Overlay
    drawUI(ctx, town);
  }, [town, camera, width, height, worldToScreen, screenToWorld, spritesLoaded, houseSprites, hoveredBuilding]);
  
  const drawUI = (ctx: CanvasRenderingContext2D, town: GeneratedTown) => {
    // Top bar
    const gradient = ctx.createLinearGradient(0, 0, 0, 70);
    gradient.addColorStop(0, "rgba(44, 62, 80, 0.95)");
    gradient.addColorStop(1, "rgba(44, 62, 80, 0.85)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 70);
    
    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground City", 20, 35);
    
    // Stats
    const venues = town.buildings.filter(b => b.type === "venue").length;
    const workplaces = town.buildings.filter(b => b.type === "workplace" || b.type === "office").length;
    const shops = town.buildings.filter(b => b.type === "shop").length;
    const residential = town.buildings.filter(b => b.type === "house" || b.type === "apartment").length;
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#E74C3C";
    ctx.fillText(`♪ ${venues} Venues`, 20, 58);
    
    ctx.fillStyle = "#3498DB";
    ctx.fillText(`💼 ${workplaces} Workplaces`, 140, 58);
    
    ctx.fillStyle = "#2ECC71";
    ctx.fillText(`🛍️ ${shops} Shops`, 280, 58);
    
    ctx.fillStyle = "#F39C12";
    ctx.fillText(`🏠 ${residential} Homes`, 380, 58);
    
    ctx.fillStyle = "#9B59B6";
    ctx.fillText(`👥 ${town.population} Population`, 490, 58);
    
    // Zoom indicator
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`Zoom: ${Math.round(camera.zoom * 100)}%`, width - 20, 58);
    
    // Building hover info
    if (hoveredBuilding) {
      const infoX = width - 220;
      const infoY = 80;
      
      ctx.fillStyle = "rgba(44, 62, 80, 0.95)";
      ctx.fillRect(infoX, infoY, 210, 90);
      
      ctx.strokeStyle = "#3498DB";
      ctx.lineWidth = 2;
      ctx.strokeRect(infoX, infoY, 210, 90);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(hoveredBuilding.type.toUpperCase(), infoX + 10, infoY + 25);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#BDC3C7";
      ctx.fillText(`District: ${hoveredBuilding.district || "downtown"}`, infoX + 10, infoY + 45);
      ctx.fillText(`Age: ${hoveredBuilding.age || "normal"}`, infoX + 10, infoY + 65);
      ctx.fillText("Click to interact", infoX + 10, infoY + 85);
    }
  };
  
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
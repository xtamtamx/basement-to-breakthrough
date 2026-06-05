import React, { useRef, useEffect, useCallback, useState } from "react";
import { RealisticTownGenerator } from "@/game/generation/RealisticTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { ProfessionalSpriteLoader } from "@/game/sprites/ProfessionalSpriteLoader";
import { soundManager } from "@/game/audio/SoundManager";

interface ProfessionalCityRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const ProfessionalCityRenderer: React.FC<ProfessionalCityRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [lastSoundTime, setLastSoundTime] = useState(0);
  
  const gameStore = useGameStore();
  const spriteLoader = useRef(new ProfessionalSpriteLoader());
  
  // Tile size (we'll scale to 32x32 for better visibility)
  const TILE_SIZE = 32;
  const GRID_WIDTH = 80;
  const GRID_HEIGHT = 60;
  
  // Load sprites
  useEffect(() => {
    spriteLoader.current.loadAll().then(() => {
      setAssetsLoaded(true);
    }).catch(err => {
      console.error("Failed to load sprites:", err);
      setAssetsLoaded(true); // Continue with fallback rendering
    });
  }, []);
  
  // Generate town
  useEffect(() => {
    const generator = new RealisticTownGenerator(80, 60);
    const playerStats = {
      showsBooked:
        (gameStore.scheduledShows?.length || 0) +
        (gameStore.showHistory?.length || 0) + 20, // Start with decent progress
      venuesOwned: (gameStore.venues?.length || 0) + 5,
      bandsManaged: (gameStore.allBands?.length || 0) + 10,
      sceneReputation: (gameStore.reputation || 0) + 50,
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
        zoom: window.innerWidth < 768 ? 0.8 : 1.2, // Zoom out to see more of the city
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
      if (!isDragging) return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = (x - dragStart.x) / camera.zoom;
      const dy = (y - dragStart.y) / camera.zoom;
      
      setCamera({
        ...camera,
        x: cameraStart.x - dx,
        y: cameraStart.y - dy,
      });
    },
    [isDragging, dragStart, cameraStart, camera]
  );
  
  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      // Play subtle sound when finishing camera movement
      const now = Date.now();
      if (now - lastSoundTime > 500) { // Throttle sound
        soundManager.playCameraMove();
        setLastSoundTime(now);
      }
    }
    setIsDragging(false);
  }, [isDragging, lastSoundTime]);
  
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newZoom = Math.max(
        0.5,
        Math.min(4, camera.zoom - e.deltaY * zoomSpeed)
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera]
  );
  
  // Get building sprite based on type and district
  const getBuildingSprite = (building: any): string => {
    // Downtown buildings are fancier
    if (building.district === "downtown") {
      if (building.type === "venue") {
        const venueSprites = ["venue_modern", "venue_modern_2", "venue_purple", "venue_purple_2"];
        return venueSprites[(building.x + building.y) % venueSprites.length];
      }
      if (building.type === "office") {
        const officeSprites = ["office_tall", "office_tall_2", "office_blue", "office_blue_2"];
        return officeSprites[(building.x + building.y) % officeSprites.length];
      }
    }
    
    // Commercial district
    if (building.district === "commercial") {
      if (building.type === "shop") {
        const shopSprites = ["shop_green", "shop_green_2", "shop_brown", "shop_brown_2"];
        return shopSprites[(building.x + building.y) % shopSprites.length];
      }
    }
    
    // Residential buildings
    if (building.type === "house") {
      const age = building.age || "normal";
      if (age === "new") {
        const newHouses = ["house_fancy_red", "house_fancy_red_2", "house_medium_beige", "house_medium_beige_2"];
        return newHouses[(building.x + building.y) % newHouses.length];
      } else {
        const normalHouses = ["house_small_brown", "house_small_brown_2", "house_small_brown_3"];
        return normalHouses[(building.x + building.y) % normalHouses.length];
      }
    }
    
    if (building.type === "apartment") {
      return building.subtype === "large" ? "office_tall" : "office_blue";
    }
    
    // Default mapping
    const typeToSprite: Record<string, string[]> = {
      shop: ["shop_gray", "shop_gray_2"],
      venue: ["venue_blue", "venue_blue_2", "venue_red", "venue_red_2"],
      workplace: ["office_blue", "office_blue_2"],
      office: ["office_tall", "office_tall_2"],
      community: ["warehouse_gray", "warehouse_gray_2"]
    };
    
    const sprites = typeToSprite[building.type] || ["house_small_brown"];
    const index = building.style || ((building.x + building.y * 7) % sprites.length);
    return sprites[index % sprites.length];
  };
  
  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas with grass color
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, width, height);
    
    if (!assetsLoaded || !spriteLoader.current.isLoaded()) {
      // Show loading message
      ctx.fillStyle = "#263238";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading town assets...", width / 2, height / 2);
      return;
    }
    
    // Calculate visible area
    const startTileX = Math.floor(screenToWorld(0, 0).x / TILE_SIZE) - 2;
    const endTileX = Math.ceil(screenToWorld(width, 0).x / TILE_SIZE) + 2;
    const startTileY = Math.floor(screenToWorld(0, 0).y / TILE_SIZE) - 2;
    const endTileY = Math.ceil(screenToWorld(0, height).y / TILE_SIZE) + 2;
    
    // Get terrain image
    const terrainImg = spriteLoader.current.getImage("terrain");
    if (!terrainImg) return;
    
    // Layer 1: Terrain - Draw grass tiles
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const screenPos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Vary grass tiles for visual interest
        const grassVariant = ((x + y * 7) % 3);
        const grassTileX = grassVariant;
        const grassTileY = 0;
        
        // Draw 16x16 grass tile scaled to 32x32
        ctx.drawImage(
          terrainImg,
          grassTileX * 16,
          grassTileY * 16,
          16,
          16,
          screenPos.x,
          screenPos.y,
          TILE_SIZE * camera.zoom,
          TILE_SIZE * camera.zoom
        );
      }
    }
    
    // Layer 2: Roads - Proper asphalt streets
    town.roads.forEach((road) => {
      const isAvenue = road.type === "avenue";
      const roadColor = isAvenue ? "#2C3E50" : "#34495E"; // Darker for avenues
      const lineColor = "#F39C12"; // Yellow road lines
      
      road.points.forEach((point, idx) => {
        const screenPos = worldToScreen(point.x * TILE_SIZE, point.y * TILE_SIZE);
        
        // Draw road surface
        ctx.fillStyle = roadColor;
        for (let w = 0; w < road.width; w++) {
          const isHorizontal = idx === 0 || 
            (road.points[1] && Math.abs(road.points[1].x - point.x) > Math.abs(road.points[1].y - point.y));
          
          const offsetX = isHorizontal ? 0 : w * TILE_SIZE;
          const offsetY = isHorizontal ? w * TILE_SIZE : 0;
          
          ctx.fillRect(
            worldToScreen(point.x * TILE_SIZE + offsetX, point.y * TILE_SIZE + offsetY).x,
            worldToScreen(point.x * TILE_SIZE + offsetX, point.y * TILE_SIZE + offsetY).y,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
        }
      });
      
      // Draw center lines for avenues
      if (isAvenue && road.points.length > 1) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2 * camera.zoom;
        ctx.setLineDash([10 * camera.zoom, 10 * camera.zoom]);
        
        const isHorizontal = Math.abs(road.points[1].x - road.points[0].x) > 
                           Math.abs(road.points[1].y - road.points[0].y);
        
        if (isHorizontal) {
          const y = road.points[0].y + road.width / 2;
          const startScreen = worldToScreen(0, y * TILE_SIZE);
          const endScreen = worldToScreen(GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
          ctx.beginPath();
          ctx.moveTo(startScreen.x, startScreen.y);
          ctx.lineTo(endScreen.x, endScreen.y);
          ctx.stroke();
        } else {
          const x = road.points[0].x + road.width / 2;
          const startScreen = worldToScreen(x * TILE_SIZE, 0);
          const endScreen = worldToScreen(x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
          ctx.beginPath();
          ctx.moveTo(startScreen.x, startScreen.y);
          ctx.lineTo(endScreen.x, endScreen.y);
          ctx.stroke();
        }
      }
    });
    ctx.setLineDash([]);
    
    // Add sidewalks along roads
    ctx.fillStyle = "#95A5A6"; // Concrete color
    town.roads.forEach((road) => {
      if (road.type === "street") {
        road.points.forEach((point) => {
          const isHorizontal = road.points.length > 1 && 
            Math.abs(road.points[1].x - road.points[0].x) > Math.abs(road.points[1].y - road.points[0].y);
          
          if (isHorizontal) {
            // Top sidewalk
            const topScreen = worldToScreen(point.x * TILE_SIZE, (point.y - 0.5) * TILE_SIZE);
            ctx.fillRect(topScreen.x, topScreen.y, TILE_SIZE * camera.zoom, TILE_SIZE * 0.5 * camera.zoom);
            // Bottom sidewalk
            const bottomScreen = worldToScreen(point.x * TILE_SIZE, (point.y + road.width) * TILE_SIZE);
            ctx.fillRect(bottomScreen.x, bottomScreen.y, TILE_SIZE * camera.zoom, TILE_SIZE * 0.5 * camera.zoom);
          } else {
            // Left sidewalk
            const leftScreen = worldToScreen((point.x - 0.5) * TILE_SIZE, point.y * TILE_SIZE);
            ctx.fillRect(leftScreen.x, leftScreen.y, TILE_SIZE * 0.5 * camera.zoom, TILE_SIZE * camera.zoom);
            // Right sidewalk
            const rightScreen = worldToScreen((point.x + road.width) * TILE_SIZE, point.y * TILE_SIZE);
            ctx.fillRect(rightScreen.x, rightScreen.y, TILE_SIZE * 0.5 * camera.zoom, TILE_SIZE * camera.zoom);
          }
        });
      }
    });
    
    // Layer 3: Town square - beautiful plaza
    const square = town.townSquare;
    const plazaGradient = ctx.createRadialGradient(
      worldToScreen((square.x + square.width/2) * TILE_SIZE, (square.y + square.height/2) * TILE_SIZE).x,
      worldToScreen((square.x + square.width/2) * TILE_SIZE, (square.y + square.height/2) * TILE_SIZE).y,
      0,
      worldToScreen((square.x + square.width/2) * TILE_SIZE, (square.y + square.height/2) * TILE_SIZE).x,
      worldToScreen((square.x + square.width/2) * TILE_SIZE, (square.y + square.height/2) * TILE_SIZE).y,
      square.width * TILE_SIZE * camera.zoom
    );
    plazaGradient.addColorStop(0, "#B8B8B8");
    plazaGradient.addColorStop(1, "#909090");
    
    ctx.fillStyle = plazaGradient;
    const plazaScreen = worldToScreen(square.x * TILE_SIZE, square.y * TILE_SIZE);
    ctx.fillRect(
      plazaScreen.x,
      plazaScreen.y,
      square.width * TILE_SIZE * camera.zoom,
      square.height * TILE_SIZE * camera.zoom
    );
    
    // Add plaza pattern
    ctx.strokeStyle = "#808080";
    ctx.lineWidth = 1;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const tileScreen = worldToScreen(
          (square.x + x) * TILE_SIZE,
          (square.y + y) * TILE_SIZE
        );
        ctx.strokeRect(
          tileScreen.x,
          tileScreen.y,
          TILE_SIZE * camera.zoom,
          TILE_SIZE * camera.zoom
        );
      }
    }
    
    // Fountain in town square
    if (square.features.includes("fountain")) {
      const fountainX = square.x + Math.floor(square.width / 2);
      const fountainY = square.y + Math.floor(square.height / 2);
      const screenPos = worldToScreen(fountainX * TILE_SIZE, fountainY * TILE_SIZE);
      
      // Draw fountain (simple for now)
      ctx.fillStyle = "#4A90E2";
      ctx.beginPath();
      ctx.arc(
        screenPos.x + (TILE_SIZE * camera.zoom) / 2,
        screenPos.y + (TILE_SIZE * camera.zoom) / 2,
        TILE_SIZE * camera.zoom,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Layer 4: Trees and parks
    town.greenSpaces.forEach((green) => {
      if (green.type === "park") {
        // Draw park area with darker grass
        ctx.fillStyle = "#2ECC71";
        ctx.globalAlpha = 0.3;
        const parkScreen = worldToScreen(
          (green.x - green.radius) * TILE_SIZE,
          (green.y - green.radius) * TILE_SIZE
        );
        ctx.fillRect(
          parkScreen.x,
          parkScreen.y,
          green.radius * 2 * TILE_SIZE * camera.zoom,
          green.radius * 2 * TILE_SIZE * camera.zoom
        );
        ctx.globalAlpha = 1;
      }
      
      const numTrees = Math.floor(green.radius * 2);
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2;
        const distance = green.radius * 0.8;
        const treeX = green.x + Math.cos(angle) * distance;
        const treeY = green.y + Math.sin(angle) * distance;
        
        const screenPos = worldToScreen(treeX * TILE_SIZE, treeY * TILE_SIZE);
        
        // Simple tree rendering
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(
          screenPos.x,
          screenPos.y + TILE_SIZE * camera.zoom * 0.8,
          TILE_SIZE * camera.zoom * 0.6,
          TILE_SIZE * camera.zoom * 0.3,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Trunk
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(
          screenPos.x - TILE_SIZE * camera.zoom * 0.1,
          screenPos.y,
          TILE_SIZE * camera.zoom * 0.2,
          TILE_SIZE * camera.zoom * 0.5
        );
        
        // Foliage
        ctx.fillStyle = "#228B22";
        ctx.beginPath();
        ctx.arc(
          screenPos.x,
          screenPos.y - TILE_SIZE * camera.zoom * 0.2,
          TILE_SIZE * camera.zoom * 0.6,
          0, Math.PI * 2
        );
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = "#32CD32";
        ctx.beginPath();
        ctx.arc(
          screenPos.x - TILE_SIZE * camera.zoom * 0.1,
          screenPos.y - TILE_SIZE * camera.zoom * 0.3,
          TILE_SIZE * camera.zoom * 0.3,
          0, Math.PI * 2
        );
        ctx.fill();
      }
    });
    
    // Add street lights at intersections
    town.roads.forEach((road, idx) => {
      if (road.type === "street" && idx % 3 === 0) {
        const point = road.points[0];
        const lightScreen = worldToScreen(point.x * TILE_SIZE, point.y * TILE_SIZE);
        
        // Light pole
        ctx.fillStyle = "#34495E";
        ctx.fillRect(
          lightScreen.x - 2 * camera.zoom,
          lightScreen.y - TILE_SIZE * camera.zoom,
          4 * camera.zoom,
          TILE_SIZE * camera.zoom
        );
        
        // Light
        ctx.fillStyle = "#F1C40F";
        ctx.beginPath();
        ctx.arc(
          lightScreen.x,
          lightScreen.y - TILE_SIZE * camera.zoom,
          6 * camera.zoom,
          0, Math.PI * 2
        );
        ctx.fill();
      }
    });
    
    // Layer 5: Buildings (sorted for depth)
    const sortedBuildings = [...town.buildings].sort((a, b) => a.y - b.y);
    
    sortedBuildings.forEach((building) => {
      const screenPos = worldToScreen(
        building.x * TILE_SIZE,
        building.y * TILE_SIZE
      );
      
      // Get the sprite name for this building
      const spriteName = getBuildingSprite(building);
      
      // Draw building shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(
        screenPos.x + 4,
        screenPos.y + 4,
        building.width * TILE_SIZE * camera.zoom,
        building.height * TILE_SIZE * camera.zoom
      );
      
      // Draw the building sprite
      spriteLoader.current.drawSprite(
        ctx,
        "houses",
        spriteName,
        screenPos.x,
        screenPos.y,
        building.width * TILE_SIZE * camera.zoom,
        building.height * TILE_SIZE * camera.zoom
      );
      
      // Add building labels for venues
      if (building.type === "venue") {
        ctx.fillStyle = "#000000";
        ctx.font = `${10 * camera.zoom}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          "♪",
          screenPos.x + (building.width * TILE_SIZE * camera.zoom) / 2,
          screenPos.y - 5 * camera.zoom
        );
      }
    });
    
    // UI Overlay
    drawUI(ctx, town);
  }, [town, camera, width, height, worldToScreen, screenToWorld, assetsLoaded]);
  
  const drawUI = (ctx: CanvasRenderingContext2D, town: GeneratedTown) => {
    // Top bar background
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, "rgba(38, 50, 56, 0.95)");
    gradient.addColorStop(1, "rgba(38, 50, 56, 0.8)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 80);
    
    // Town name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground District", 20, 35);
    
    // Stats
    const stats = [
      { label: "Population", value: town.population, icon: "👥" },
      { label: "Venues", value: town.buildings.filter(b => b.type === "venue").length, icon: "🎸" },
      { label: "Scene Rep", value: gameStore.reputation || 0, icon: "⭐" },
      { label: "Funds", value: `$${(gameStore.money || 0).toLocaleString()}`, icon: "💰" },
    ];
    
    stats.forEach((stat, i) => {
      const x = 20 + i * 150;
      ctx.fillStyle = "#B0BEC5";
      ctx.font = "12px Arial";
      ctx.fillText(stat.label, x, 55);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`${stat.icon} ${stat.value}`, x, 72);
    });
    
    // Growth indicator
    const growthPercent = (town.growthStage / 5) * 100;
    const barX = width - 220;
    const barY = 25;
    const barWidth = 200;
    const barHeight = 30;
    
    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(barX, barY, (barWidth * growthPercent) / 100, barHeight);
    
    // Border
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Growth: Stage ${town.growthStage}/5`, barX + barWidth / 2, barY + 20);
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
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        imageRendering: "pixelated", // Keep pixel art crisp
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};
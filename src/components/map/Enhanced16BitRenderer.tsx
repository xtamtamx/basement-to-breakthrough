import React, { useRef, useEffect, useCallback, useState } from "react";
import { ProperTownGenerator } from "@/game/generation/ProperTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";
import { ProfessionalSpriteLoader } from "@/game/sprites/ProfessionalSpriteLoader";

// Import our original 16-bit sprites for the base rendering
import {
  TOPDOWN_COLORS,
  renderTopDownSprite,
  HOUSE_TOPDOWN,
  SHOP_TOPDOWN,
  VENUE_TOPDOWN,
  TREE_TOPDOWN,
  FOUNTAIN_TOPDOWN,
  GRASS_TOPDOWN,
  ROAD_H_TOPDOWN,
  ROAD_V_TOPDOWN,
  PLAZA_TOPDOWN,
  COMMUNITY_TOPDOWN,
  ROAD_CROSS,
} from "./sprites/TopDownSprites";

interface Enhanced16BitRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

export const Enhanced16BitRenderer: React.FC<Enhanced16BitRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 2.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [hoveredBuilding, setHoveredBuilding] = useState<any>(null);
  
  const gameStore = useGameStore();
  const spriteLoader = useRef(new ProfessionalSpriteLoader());
  const tileSize = 16; // Keep 16x16 for that retro feel
  
  // Load professional sprites
  useEffect(() => {
    spriteLoader.current.loadAll().then(() => {
      setAssetsLoaded(true);
    }).catch(err => {
      console.warn("Using built-in sprites:", err);
      setAssetsLoaded(false);
    });
  }, []);
  
  // Generate town based on player progress
  useEffect(() => {
    const generator = new ProperTownGenerator(60, 40);
    const playerStats = {
      showsBooked:
        (gameStore.scheduledShows?.length || 0) +
        (gameStore.showHistory?.length || 0),
      venuesOwned: gameStore.venues?.length || 0,
      bandsManaged: gameStore.allBands?.length || 0,
      sceneReputation: gameStore.reputation || 0,
    };
    
    const generatedTown = generator.generateTown(playerStats);
    setTown(generatedTown);
    
    // Center camera on town square
    if (generatedTown.townSquare) {
      setCamera({
        x:
          generatedTown.townSquare.x * tileSize +
          (generatedTown.townSquare.width * tileSize) / 2,
        y:
          generatedTown.townSquare.y * tileSize +
          (generatedTown.townSquare.height * tileSize) / 2,
        zoom: window.innerWidth < 768 ? 2 : 3,
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
        const tileX = Math.floor(worldPos.x / tileSize);
        const tileY = Math.floor(worldPos.y / tileSize);
        
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
        // Check for building hover
        if (town) {
          const worldPos = screenToWorld(x, y);
          const tileX = Math.floor(worldPos.x / tileSize);
          const tileY = Math.floor(worldPos.y / tileSize);
          
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
        1,
        Math.min(5, camera.zoom - e.deltaY * zoomSpeed)
      );
      setCamera({ ...camera, zoom: newZoom });
    },
    [camera]
  );
  
  // Render a building with enhanced sprites if available
  const renderBuilding = useCallback(
    (ctx: CanvasRenderingContext2D, building: any) => {
      const pos = worldToScreen(building.x * tileSize, building.y * tileSize);
      const isHovered = hoveredBuilding === building;
      
      // Draw building shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        pos.x + 2 * camera.zoom,
        pos.y + 2 * camera.zoom,
        building.width * tileSize * camera.zoom,
        building.height * tileSize * camera.zoom
      );
      
      if (assetsLoaded && spriteLoader.current.isLoaded()) {
        // Use professional sprites when available
        const spriteName = getBuildingSpriteName(building);
        spriteLoader.current.drawSprite(
          ctx,
          "houses",
          spriteName,
          pos.x,
          pos.y,
          building.width * tileSize * camera.zoom,
          building.height * tileSize * camera.zoom
        );
      } else {
        // Fall back to our original 16-bit sprites
        let sprite;
        switch (building.type) {
          case "house":
            sprite = HOUSE_TOPDOWN;
            break;
          case "shop":
            sprite = SHOP_TOPDOWN;
            break;
          case "venue":
            sprite = VENUE_TOPDOWN;
            break;
          case "community":
            sprite = COMMUNITY_TOPDOWN;
            break;
          default:
            sprite = HOUSE_TOPDOWN;
        }
        
        renderTopDownSprite(
          ctx,
          sprite,
          pos.x,
          pos.y,
          tileSize * camera.zoom,
          TOPDOWN_COLORS
        );
      }
      
      // Add hover effect
      if (isHovered) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2 * camera.zoom;
        ctx.strokeRect(
          pos.x - 1,
          pos.y - 1,
          building.width * tileSize * camera.zoom + 2,
          building.height * tileSize * camera.zoom + 2
        );
      }
      
      // Add venue music note
      if (building.type === "venue") {
        ctx.fillStyle = "#FFD700";
        ctx.font = `${12 * camera.zoom}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          "♪",
          pos.x + (building.width * tileSize * camera.zoom) / 2,
          pos.y - 4 * camera.zoom
        );
      }
    },
    [worldToScreen, camera, hoveredBuilding, assetsLoaded]
  );
  
  // Get sprite name for professional assets
  const getBuildingSpriteName = (building: any): string => {
    const typeMap: Record<string, string[]> = {
      house: ["house_small_brown", "house_medium_beige", "house_fancy_red"],
      shop: ["shop_gray", "shop_green", "shop_brown"],
      venue: ["venue_blue", "venue_red", "venue_purple", "venue_modern"],
      workplace: ["office_blue", "office_tall"],
      community: ["warehouse_gray"],
    };
    
    const options = typeMap[building.type] || typeMap.house;
    return options[(building.x + building.y) % options.length];
  };
  
  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false; // Keep pixels crisp
    
    // Clear with grass color
    ctx.fillStyle = TOPDOWN_COLORS.grass;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate visible area
    const startTileX = Math.floor(screenToWorld(0, 0).x / tileSize) - 2;
    const endTileX = Math.ceil(screenToWorld(width, 0).x / tileSize) + 2;
    const startTileY = Math.floor(screenToWorld(0, 0).y / tileSize) - 2;
    const endTileY = Math.ceil(screenToWorld(0, height).y / tileSize) + 2;
    
    // Layer 1: Grass with variation
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const pos = worldToScreen(x * tileSize, y * tileSize);
        
        // Add grass variation
        if ((x + y * 7) % 13 === 0) {
          ctx.fillStyle = "#3A7D44"; // Darker grass patches
        } else if ((x * 3 + y) % 11 === 0) {
          ctx.fillStyle = "#5FBF6F"; // Lighter grass
        } else {
          ctx.fillStyle = TOPDOWN_COLORS.grass;
        }
        
        ctx.fillRect(pos.x, pos.y, tileSize * camera.zoom, tileSize * camera.zoom);
      }
    }
    
    // Layer 2: Roads with proper sprites
    town.roads.forEach((road) => {
      road.points.forEach((point) => {
        const pos = worldToScreen(point.x * tileSize, point.y * tileSize);
        
        for (let w = 0; w < road.width; w++) {
          const isHorizontal = road.type === "main" || 
            (road.points[1] && Math.abs(road.points[1].x - point.x) > Math.abs(road.points[1].y - point.y));
          
          const offsetX = isHorizontal ? 0 : w * tileSize;
          const offsetY = isHorizontal ? w * tileSize : 0;
          
          const roadPos = worldToScreen(
            point.x * tileSize + offsetX,
            point.y * tileSize + offsetY
          );
          
          // Use sprite or solid color
          if (isHorizontal) {
            renderTopDownSprite(
              ctx,
              ROAD_H_TOPDOWN,
              roadPos.x,
              roadPos.y,
              tileSize * camera.zoom,
              TOPDOWN_COLORS
            );
          } else {
            renderTopDownSprite(
              ctx,
              ROAD_V_TOPDOWN,
              roadPos.x,
              roadPos.y,
              tileSize * camera.zoom,
              TOPDOWN_COLORS
            );
          }
        }
      });
    });
    
    // Layer 3: Town square
    const square = town.townSquare;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const pos = worldToScreen(
          (square.x + x) * tileSize,
          (square.y + y) * tileSize
        );
        
        renderTopDownSprite(
          ctx,
          PLAZA_TOPDOWN,
          pos.x,
          pos.y,
          tileSize * camera.zoom,
          TOPDOWN_COLORS
        );
      }
    }
    
    // Fountain in center
    if (square.features.includes("fountain")) {
      const fountainX = square.x + Math.floor(square.width / 2);
      const fountainY = square.y + Math.floor(square.height / 2);
      const fountainPos = worldToScreen(fountainX * tileSize, fountainY * tileSize);
      
      renderTopDownSprite(
        ctx,
        FOUNTAIN_TOPDOWN,
        fountainPos.x - tileSize * camera.zoom / 2,
        fountainPos.y - tileSize * camera.zoom / 2,
        tileSize * camera.zoom,
        TOPDOWN_COLORS
      );
    }
    
    // Layer 4: Trees
    town.greenSpaces.forEach((green) => {
      const numTrees = Math.floor(green.radius * 1.5);
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2;
        const distance = green.radius * 0.8;
        const treeX = Math.floor(green.x + Math.cos(angle) * distance);
        const treeY = Math.floor(green.y + Math.sin(angle) * distance);
        
        const treePos = worldToScreen(treeX * tileSize, treeY * tileSize);
        
        renderTopDownSprite(
          ctx,
          TREE_TOPDOWN,
          treePos.x,
          treePos.y,
          tileSize * camera.zoom,
          TOPDOWN_COLORS
        );
      }
    });
    
    // Layer 5: Buildings (sorted for depth)
    const sortedBuildings = [...town.buildings].sort((a, b) => a.y - b.y);
    sortedBuildings.forEach((building) => renderBuilding(ctx, building));
    
    // UI Overlay
    drawUI(ctx, town);
  }, [town, camera, width, height, worldToScreen, screenToWorld, renderBuilding]);
  
  const drawUI = (ctx: CanvasRenderingContext2D, town: GeneratedTown) => {
    // Top bar with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, "rgba(38, 50, 56, 0.95)");
    gradient.addColorStop(1, "rgba(38, 50, 56, 0.85)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 60);
    
    // Town name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Underground District", 16, 25);
    
    // Stats in pixel font style
    ctx.font = "14px monospace";
    ctx.fillStyle = "#4CAF50";
    ctx.fillText(`Population: ${town.population}`, 16, 45);
    
    ctx.fillStyle = "#2196F3";
    ctx.fillText(`Venues: ${town.buildings.filter(b => b.type === "venue").length}`, 140, 45);
    
    ctx.fillStyle = "#FF9800";
    ctx.fillText(`Growth: ${town.growthStage}/5`, 230, 45);
    
    // Hover info
    if (hoveredBuilding) {
      const infoX = width - 200;
      const infoY = 70;
      
      ctx.fillStyle = "rgba(38, 50, 56, 0.9)";
      ctx.fillRect(infoX, infoY, 190, 80);
      
      ctx.strokeStyle = "#4CAF50";
      ctx.lineWidth = 2;
      ctx.strokeRect(infoX, infoY, 190, 80);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px monospace";
      ctx.fillText(hoveredBuilding.type.toUpperCase(), infoX + 10, infoY + 20);
      
      ctx.font = "12px monospace";
      ctx.fillStyle = "#B0BEC5";
      ctx.fillText(`Age: ${hoveredBuilding.age || "normal"}`, infoX + 10, infoY + 40);
      ctx.fillText(`Style: ${hoveredBuilding.style || 0}`, infoX + 10, infoY + 55);
      
      if (hoveredBuilding.type === "venue") {
        ctx.fillStyle = "#FFD700";
        ctx.fillText("♪ Music Venue", infoX + 10, infoY + 70);
      }
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
        imageRendering: "pixelated",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};
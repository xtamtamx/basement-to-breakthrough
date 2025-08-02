import React, { useRef, useEffect, useCallback, useState } from "react";
import { ProperTownGenerator } from "@/game/generation/ProperTownGenerator";
import { GeneratedTown } from "@/game/generation/TownGenerator";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface AssetBasedTownRendererProps {
  onBuildingClick?: (building: any) => void;
  width?: number;
  height?: number;
}

// Asset manifest - replace with actual paths when assets are available
const SPRITE_MANIFEST = {
  // Terrain
  grass_01: "/assets/sprites/town/terrain/grass_01.png",
  grass_02: "/assets/sprites/town/terrain/grass_02.png",
  road_h: "/assets/sprites/town/terrain/road_horizontal.png",
  road_v: "/assets/sprites/town/terrain/road_vertical.png",
  road_cross: "/assets/sprites/town/terrain/road_cross.png",
  plaza: "/assets/sprites/town/terrain/plaza.png",
  
  // Buildings
  house_small_01: "/assets/sprites/town/buildings/house_small_01.png",
  house_small_02: "/assets/sprites/town/buildings/house_small_02.png",
  house_medium_01: "/assets/sprites/town/buildings/house_medium_01.png",
  shop_01: "/assets/sprites/town/buildings/shop_01.png",
  shop_02: "/assets/sprites/town/buildings/shop_02.png",
  venue_basement: "/assets/sprites/town/buildings/venue_basement.png",
  venue_club: "/assets/sprites/town/buildings/venue_club.png",
  venue_theater: "/assets/sprites/town/buildings/venue_theater.png",
  workplace_coffee: "/assets/sprites/town/buildings/workplace_coffee.png",
  workplace_record: "/assets/sprites/town/buildings/workplace_record.png",
  community_townhall: "/assets/sprites/town/buildings/community_townhall.png",
  
  // Decorations
  tree_01: "/assets/sprites/town/decorations/tree_01.png",
  tree_02: "/assets/sprites/town/decorations/tree_02.png",
  fountain: "/assets/sprites/town/decorations/fountain.png",
  bench: "/assets/sprites/town/decorations/bench.png",
};

// Sprite loader class
class SpriteLoader {
  private sprites: Map<string, HTMLImageElement> = new Map();
  private loadPromise: Promise<void> | null = null;
  
  async loadSprites(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = this.loadAllSprites();
    return this.loadPromise;
  }
  
  private async loadAllSprites(): Promise<void> {
    const loadPromises = Object.entries(SPRITE_MANIFEST).map(
      async ([key, path]) => {
        try {
          const img = new Image();
          img.src = path;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          this.sprites.set(key, img);
        } catch (error) {
          console.warn(`Failed to load sprite: ${key} from ${path}`);
          // Create placeholder
          const placeholder = new Image();
          placeholder.width = 32;
          placeholder.height = 32;
          this.sprites.set(key, placeholder);
        }
      }
    );
    
    await Promise.all(loadPromises);
  }
  
  getSprite(key: string): HTMLImageElement | null {
    return this.sprites.get(key) || null;
  }
  
  hasSprite(key: string): boolean {
    return this.sprites.has(key);
  }
}

export const AssetBasedTownRenderer: React.FC<AssetBasedTownRendererProps> = ({
  onBuildingClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [town, setTown] = useState<GeneratedTown | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const gameStore = useGameStore();
  const spriteLoader = useRef(new SpriteLoader());
  
  // Tile configuration
  const TILE_SIZE = 32; // Base tile size (can be 32x32 or 64x64)
  const ISOMETRIC = false; // Set to true when using isometric assets
  
  // Load sprites
  useEffect(() => {
    spriteLoader.current.loadSprites().then(() => {
      setAssetsLoaded(true);
    });
  }, []);
  
  // Generate town
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
    
    // Center camera
    if (generatedTown.townSquare) {
      setCamera({
        x:
          generatedTown.townSquare.x * TILE_SIZE +
          (generatedTown.townSquare.width * TILE_SIZE) / 2,
        y:
          generatedTown.townSquare.y * TILE_SIZE +
          (generatedTown.townSquare.height * TILE_SIZE) / 2,
        zoom: window.innerWidth < 768 ? 1.5 : 2,
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
      if (ISOMETRIC) {
        // Isometric projection
        const isoX = (worldX - worldY) * (TILE_SIZE / 2);
        const isoY = (worldX + worldY) * (TILE_SIZE / 4);
        return {
          x: (isoX - camera.x) * camera.zoom + width / 2,
          y: (isoY - camera.y) * camera.zoom + height / 2,
        };
      } else {
        // Top-down view
        return {
          x: (worldX - camera.x) * camera.zoom + width / 2,
          y: (worldY - camera.y) * camera.zoom + height / 2,
        };
      }
    },
    [camera, width, height]
  );
  
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (ISOMETRIC) {
        // Reverse isometric projection
        const localX = (screenX - width / 2) / camera.zoom + camera.x;
        const localY = (screenY - height / 2) / camera.zoom + camera.y;
        return {
          x: (localX / (TILE_SIZE / 2) + localY / (TILE_SIZE / 4)) / 2,
          y: (localY / (TILE_SIZE / 4) - localX / (TILE_SIZE / 2)) / 2,
        };
      } else {
        return {
          x: (screenX - width / 2) / camera.zoom + camera.x,
          y: (screenY - height / 2) / camera.zoom + camera.y,
        };
      }
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
    setIsDragging(false);
  }, []);
  
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
  
  // Get sprite key for building
  const getBuildingSpriteKey = (building: any): string => {
    switch (building.type) {
      case "house":
        return building.age === "new" ? "house_medium_01" : "house_small_01";
      case "shop":
        return `shop_0${(building.style % 2) + 1}`;
      case "venue":
        if (building.subtype === "basement") return "venue_basement";
        if (building.subtype === "club") return "venue_club";
        return "venue_theater";
      case "workplace":
        return building.subtype === "coffee" ? "workplace_coffee" : "workplace_record";
      case "community":
        return "community_townhall";
      default:
        return "house_small_01";
    }
  };
  
  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !town) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, width, height);
    
    if (!assetsLoaded) {
      // Show loading screen
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
    
    // Layer 1: Terrain
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const screenPos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Use grass sprite or fallback
        const grassSprite = spriteLoader.current.getSprite(
          (x + y) % 3 === 0 ? "grass_02" : "grass_01"
        );
        
        if (grassSprite && grassSprite.complete) {
          ctx.drawImage(
            grassSprite,
            screenPos.x,
            screenPos.y,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
        } else {
          // Fallback to solid color
          ctx.fillStyle = "#4CAF50";
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
        }
      }
    }
    
    // Layer 2: Roads
    town.roads.forEach((road) => {
      road.points.forEach((point) => {
        const screenPos = worldToScreen(point.x * TILE_SIZE, point.y * TILE_SIZE);
        
        // Determine road sprite
        const isHorizontal = road.type === "main" || 
          (road.points[1] && Math.abs(road.points[1].x - point.x) > Math.abs(road.points[1].y - point.y));
        
        const roadSprite = spriteLoader.current.getSprite(
          isHorizontal ? "road_h" : "road_v"
        );
        
        if (roadSprite && roadSprite.complete) {
          for (let w = 0; w < road.width; w++) {
            const offsetX = isHorizontal ? 0 : w * TILE_SIZE * camera.zoom;
            const offsetY = isHorizontal ? w * TILE_SIZE * camera.zoom : 0;
            
            ctx.drawImage(
              roadSprite,
              screenPos.x + offsetX,
              screenPos.y + offsetY,
              TILE_SIZE * camera.zoom,
              TILE_SIZE * camera.zoom
            );
          }
        } else {
          // Fallback to solid color
          ctx.fillStyle = "#455A64";
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            road.width * TILE_SIZE * camera.zoom,
            road.width * TILE_SIZE * camera.zoom
          );
        }
      });
    });
    
    // Layer 3: Town square
    const square = town.townSquare;
    for (let y = 0; y < square.height; y++) {
      for (let x = 0; x < square.width; x++) {
        const screenPos = worldToScreen(
          (square.x + x) * TILE_SIZE,
          (square.y + y) * TILE_SIZE
        );
        
        const plazaSprite = spriteLoader.current.getSprite("plaza");
        if (plazaSprite && plazaSprite.complete) {
          ctx.drawImage(
            plazaSprite,
            screenPos.x,
            screenPos.y,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
        } else {
          ctx.fillStyle = "#90A4AE";
          ctx.fillRect(
            screenPos.x,
            screenPos.y,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
        }
      }
    }
    
    // Fountain
    if (square.features.includes("fountain")) {
      const fountainX = square.x + square.width / 2;
      const fountainY = square.y + square.height / 2;
      const screenPos = worldToScreen(fountainX * TILE_SIZE, fountainY * TILE_SIZE);
      
      const fountainSprite = spriteLoader.current.getSprite("fountain");
      if (fountainSprite && fountainSprite.complete) {
        ctx.drawImage(
          fountainSprite,
          screenPos.x - TILE_SIZE * camera.zoom,
          screenPos.y - TILE_SIZE * camera.zoom,
          TILE_SIZE * 2 * camera.zoom,
          TILE_SIZE * 2 * camera.zoom
        );
      }
    }
    
    // Layer 4: Decorations (trees in parks)
    town.greenSpaces.forEach((green) => {
      const numTrees = Math.floor(green.radius * 2);
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2;
        const distance = green.radius * 0.6;
        const treeX = green.x + Math.cos(angle) * distance;
        const treeY = green.y + Math.sin(angle) * distance;
        
        const screenPos = worldToScreen(treeX * TILE_SIZE, treeY * TILE_SIZE);
        const treeSprite = spriteLoader.current.getSprite(i % 2 === 0 ? "tree_01" : "tree_02");
        
        if (treeSprite && treeSprite.complete) {
          ctx.drawImage(
            treeSprite,
            screenPos.x - (TILE_SIZE * camera.zoom) / 2,
            screenPos.y - (TILE_SIZE * camera.zoom) / 2,
            TILE_SIZE * camera.zoom,
            TILE_SIZE * camera.zoom
          );
        }
      }
    });
    
    // Layer 5: Buildings (sorted for depth)
    const sortedBuildings = [...town.buildings].sort((a, b) => {
      if (ISOMETRIC) {
        return (a.y + a.x) - (b.y + b.x);
      }
      return a.y - b.y;
    });
    
    sortedBuildings.forEach((building) => {
      const screenPos = worldToScreen(
        building.x * TILE_SIZE,
        building.y * TILE_SIZE
      );
      
      const spriteKey = getBuildingSpriteKey(building);
      const buildingSprite = spriteLoader.current.getSprite(spriteKey);
      
      if (buildingSprite && buildingSprite.complete) {
        // Draw shadow first
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000000";
        ctx.fillRect(
          screenPos.x + 4,
          screenPos.y + 4,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
        ctx.globalAlpha = 1;
        
        // Draw building sprite
        ctx.drawImage(
          buildingSprite,
          screenPos.x,
          screenPos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
      } else {
        // Fallback rendering
        ctx.fillStyle = "#E0E0E0";
        ctx.fillRect(
          screenPos.x,
          screenPos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
        ctx.strokeStyle = "#757575";
        ctx.strokeRect(
          screenPos.x,
          screenPos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
      }
    });
    
    // UI Overlay
    drawUI(ctx, town);
  }, [town, camera, width, height, worldToScreen, screenToWorld, assetsLoaded]);
  
  const drawUI = (ctx: CanvasRenderingContext2D, town: GeneratedTown) => {
    const padding = 16;
    const boxHeight = 80;
    
    // Background
    ctx.fillStyle = "rgba(38, 50, 56, 0.95)";
    ctx.fillRect(padding, padding, 250, boxHeight);
    
    // Border
    ctx.strokeStyle = "#ECEFF1";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, 250, boxHeight);
    
    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Town Overview", padding + 16, padding + 28);
    
    ctx.font = "14px Arial";
    ctx.fillText(`Population: ${town.population}`, padding + 16, padding + 48);
    ctx.fillText(`Growth Stage: ${town.growthStage}/5`, padding + 16, padding + 66);
    ctx.fillText(`Buildings: ${town.buildings.length}`, padding + 140, padding + 48);
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
        imageRendering: ISOMETRIC ? "auto" : "pixelated",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};
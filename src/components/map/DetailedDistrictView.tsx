import React, { useRef, useEffect, useCallback, useState } from "react";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'venue' | 'shop' | 'workplace' | 'house';
  name: string;
  buildingStyle: 'red' | 'gray' | 'blue' | 'brown';
}

interface DetailedDistrictViewProps {
  districtId: string;
  districtName: string;
  districtType: 'downtown' | 'residential' | 'commercial' | 'industrial';
  onBuildingClick?: (building: Building) => void;
  onExitDistrict?: () => void;
  width?: number;
  height?: number;
}

export const DetailedDistrictView: React.FC<DetailedDistrictViewProps> = ({
  districtName,
  districtType,
  onBuildingClick,
  onExitDistrict,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [camera, setCamera] = useState({ x: 240, y: 180, zoom: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  
  const TILE_SIZE = 16;
  const DISTRICT_WIDTH = 30;
  const DISTRICT_HEIGHT = 25;
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Generate district buildings based on type
  useEffect(() => {
    const newBuildings: Building[] = [];
    let id = 0;
    
    switch (districtType) {
      case 'downtown':
        // Main street with venues and shops
        newBuildings.push({
          id: `venue-${id++}`,
          x: 12, y: 10,
          width: 4, height: 4,
          type: 'venue',
          name: 'The Basement',
          buildingStyle: 'red'
        });
        
        newBuildings.push({
          id: `venue-${id++}`,
          x: 18, y: 10,
          width: 4, height: 4,
          type: 'venue',
          name: 'Rock Club',
          buildingStyle: 'blue'
        });
        
        newBuildings.push({
          id: `shop-${id++}`,
          x: 8, y: 10,
          width: 3, height: 3,
          type: 'shop',
          name: 'Music Store',
          buildingStyle: 'brown'
        });
        
        newBuildings.push({
          id: `shop-${id++}`,
          x: 23, y: 10,
          width: 3, height: 3,
          type: 'shop',
          name: 'Coffee Shop',
          buildingStyle: 'gray'
        });
        
        // Workplaces
        newBuildings.push({
          id: `workplace-${id++}`,
          x: 10, y: 16,
          width: 4, height: 4,
          type: 'workplace',
          name: 'Record Label',
          buildingStyle: 'gray'
        });
        break;
        
      case 'residential':
        // Houses in neighborhood layout
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 4; col++) {
            newBuildings.push({
              id: `house-${id++}`,
              x: 6 + col * 5,
              y: 8 + row * 6,
              width: 3, height: 3,
              type: 'house',
              name: `House ${id}`,
              buildingStyle: (row + col) % 2 === 0 ? 'red' : 'brown'
            });
          }
        }
        break;
        
      case 'commercial': {
        // Mix of shops and workplaces
        const commercialBuildings = [
          { x: 8, y: 8, type: 'shop' as const, name: 'Grocery Store' },
          { x: 14, y: 8, type: 'shop' as const, name: 'Clothing Store' },
          { x: 20, y: 8, type: 'shop' as const, name: 'Electronics' },
          { x: 8, y: 14, type: 'workplace' as const, name: 'Office Building' },
          { x: 16, y: 14, type: 'workplace' as const, name: 'Day Job Corp' },
        ];
        
        commercialBuildings.forEach((b, i) => {
          newBuildings.push({
            id: `${b.type}-${id++}`,
            x: b.x, y: b.y,
            width: 4, height: 4,
            type: b.type,
            name: b.name,
            buildingStyle: i % 2 === 0 ? 'blue' : 'gray'
          });
        });
        break;
      }
    }
    
    setBuildings(newBuildings);
  }, [districtType]);
  
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
      const tileX = Math.floor(worldPos.x / TILE_SIZE);
      const tileY = Math.floor(worldPos.y / TILE_SIZE);
      
      const clickedBuilding = buildings.find(b => 
        tileX >= b.x && tileX < b.x + b.width &&
        tileY >= b.y && tileY < b.y + b.height
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
        const tileX = Math.floor(worldPos.x / TILE_SIZE);
        const tileY = Math.floor(worldPos.y / TILE_SIZE);
        
        const building = buildings.find(b => 
          tileX >= b.x && tileX < b.x + b.width &&
          tileY >= b.y && tileY < b.y + b.height
        );
        setHoveredBuilding(building || null);
      }
    },
    [isDragging, dragStart, cameraStart, camera, screenToWorld, buildings]
  );
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Draw tile from tileset
  const drawTile = useCallback((
    ctx: CanvasRenderingContext2D,
    tileX: number,
    tileY: number,
    destX: number,
    destY: number
  ) => {
    if (!cityTileset) return;

    ctx.drawImage(
      cityTileset,
      tileX * 16, tileY * 16, 16, 16,
      destX, destY,
      TILE_SIZE * camera.zoom, TILE_SIZE * camera.zoom
    );
  }, [cityTileset, camera]);
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cityTileset) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    
    // Draw ground based on district type
    for (let y = 0; y < DISTRICT_HEIGHT; y++) {
      for (let x = 0; x < DISTRICT_WIDTH; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        if (districtType === 'downtown' || districtType === 'commercial') {
          // Pavement/concrete
          drawTile(ctx, 1, 15, pos.x, pos.y);
        } else {
          // Grass
          drawTile(ctx, 0, 0, pos.x, pos.y);
        }
      }
    }
    
    // Draw roads
    if (districtType === 'downtown' || districtType === 'commercial') {
      // Main horizontal road
      for (let x = 0; x < DISTRICT_WIDTH; x++) {
        const pos = worldToScreen(x * TILE_SIZE, 13 * TILE_SIZE);
        drawTile(ctx, 0, 11, pos.x, pos.y);
      }
      
      // Vertical roads
      [10, 15, 20].forEach(roadX => {
        for (let y = 0; y < DISTRICT_HEIGHT; y++) {
          const pos = worldToScreen(roadX * TILE_SIZE, y * TILE_SIZE);
          drawTile(ctx, 0, 11, pos.x, pos.y);
        }
      });
    } else if (districtType === 'residential') {
      // Suburban streets
      for (let x = 0; x < DISTRICT_WIDTH; x++) {
        [7, 13, 19].forEach(roadY => {
          const pos = worldToScreen(x * TILE_SIZE, roadY * TILE_SIZE);
          drawTile(ctx, 2, 15, pos.x, pos.y); // Lighter road
        });
      }
    }
    
    // Draw buildings
    buildings.forEach(building => {
      // Building styles from tileset
      const styleMap = {
        red: 19,
        gray: 23,
        blue: 27,
        brown: 31
      };
      
      const baseRow = styleMap[building.buildingStyle];
      
      // Draw building tiles
      for (let by = 0; by < building.height; by++) {
        for (let bx = 0; bx < building.width; bx++) {
          const pos = worldToScreen(
            (building.x + bx) * TILE_SIZE,
            (building.y + by) * TILE_SIZE
          );
          
          // Determine which part of the building to draw
          let tileCol = 1; // Default center
          let tileRow = baseRow + 1; // Default middle
          
          // Corners and edges
          if (bx === 0 && by === 0) {
            tileCol = 0; tileRow = baseRow; // Top-left
          } else if (bx === building.width - 1 && by === 0) {
            tileCol = 3; tileRow = baseRow; // Top-right
          } else if (bx === 0 && by === building.height - 1) {
            tileCol = 0; tileRow = baseRow + 3; // Bottom-left
          } else if (bx === building.width - 1 && by === building.height - 1) {
            tileCol = 3; tileRow = baseRow + 3; // Bottom-right
          } else if (by === 0) {
            tileCol = 1; tileRow = baseRow; // Top edge
          } else if (by === building.height - 1) {
            tileCol = 1; tileRow = baseRow + 3; // Bottom edge
          } else if (bx === 0) {
            tileCol = 0; tileRow = baseRow + 1; // Left edge
          } else if (bx === building.width - 1) {
            tileCol = 3; tileRow = baseRow + 1; // Right edge
          }
          
          drawTile(ctx, tileCol, tileRow, pos.x, pos.y);
        }
      }
      
      // Building shadow
      const shadowPos = worldToScreen(
        building.x * TILE_SIZE,
        (building.y + building.height) * TILE_SIZE
      );
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(
        shadowPos.x,
        shadowPos.y,
        building.width * TILE_SIZE * camera.zoom,
        TILE_SIZE * camera.zoom * 0.5
      );
      
      // Hover effect
      if (hoveredBuilding === building) {
        const buildingPos = worldToScreen(
          building.x * TILE_SIZE,
          building.y * TILE_SIZE
        );
        
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          buildingPos.x,
          buildingPos.y,
          building.width * TILE_SIZE * camera.zoom,
          building.height * TILE_SIZE * camera.zoom
        );
      }
    });
    
    // Draw decorations
    if (districtType === 'residential') {
      // Trees
      const treePositions = [
        {x: 4, y: 5}, {x: 25, y: 5}, {x: 4, y: 20}, {x: 25, y: 20}
      ];
      
      treePositions.forEach(tree => {
        const pos = worldToScreen(tree.x * TILE_SIZE, tree.y * TILE_SIZE);
        // Tree tiles from city tileset
        for (let ty = 0; ty < 2; ty++) {
          for (let tx = 0; tx < 2; tx++) {
            drawTile(ctx, tx + 2, ty + 1, 
              pos.x + tx * TILE_SIZE * camera.zoom, 
              pos.y + ty * TILE_SIZE * camera.zoom
            );
          }
        }
      });
    } else if (districtType === 'downtown') {
      // Street lights
      [8, 16, 24].forEach(lightX => {
        const pos = worldToScreen(lightX * TILE_SIZE, 12 * TILE_SIZE);
        drawTile(ctx, 6, 5, pos.x, pos.y);
      });
    }
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    ctx.fillRect(0, height - 40, width, 40);
    
    // District name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText(districtName, 20, 40);
    
    // Exit button
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(width - 100, 10, 80, 40);
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeRect(width - 100, 10, 80, 40);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Exit", width - 60, 35);
    ctx.textAlign = "left";
    
    // Instructions
    ctx.font = "14px Arial";
    ctx.fillText("Click buildings to interact • Drag to pan", 20, height - 20);
    
    // Building info
    if (hoveredBuilding) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(width - 200, 70, 190, 60);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px Arial";
      ctx.fillText(hoveredBuilding.name, width - 190, 95);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(hoveredBuilding.type, width - 190, 115);
    }
  }, [cityTileset, camera, buildings, hoveredBuilding, districtName, districtType, width, height, worldToScreen, drawTile]);
  
  // Handle exit button click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking exit button
    if (x >= width - 100 && x <= width - 20 && y >= 10 && y <= 50) {
      if (onExitDistrict) {
        haptics.light();
        onExitDistrict();
      }
    }
  }, [width, onExitDistrict]);
  
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
      onClick={handleCanvasClick}
    />
  );
};
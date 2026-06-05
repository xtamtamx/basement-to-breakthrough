import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface CityBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'residential' | 'commercial' | 'industrial' | 'park' | 'venue';
  buildings: Building[];
}

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  height_levels: number;
  type: 'house' | 'apartment' | 'office' | 'shop' | 'venue' | 'factory';
  style: number;
}

interface District {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'downtown' | 'residential' | 'commercial' | 'industrial';
  blocks: CityBlock[];
}

interface ProperCityViewProps {
  onDistrictClick?: (district: District) => void;
  width?: number;
  height?: number;
}

export const ProperCityView: React.FC<ProperCityViewProps> = ({
  onDistrictClick,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [camera, setCamera] = useState({ x: 512, y: 384, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraStart, setCameraStart] = useState({ x: 0, y: 0 });
  
  const gameStore = useGameStore();
  const TILE_SIZE = 16;
  const CITY_WIDTH = 64; // tiles
  const CITY_HEIGHT = 48; // tiles
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Generate city layout
  const [districts] = useState<District[]>(() => {
    const newDistricts: District[] = [];
    
    // Downtown - center of city
    const downtown: District = {
      id: 'downtown',
      name: 'Downtown',
      x: 24,
      y: 18,
      width: 16,
      height: 12,
      type: 'downtown',
      blocks: []
    };
    
    // Generate downtown blocks
    for (let by = 0; by < 3; by++) {
      for (let bx = 0; bx < 4; bx++) {
        const block: CityBlock = {
          x: downtown.x + bx * 4,
          y: downtown.y + by * 4,
          width: 3,
          height: 3,
          type: bx === 1 && by === 1 ? 'venue' : 'commercial',
          buildings: []
        };
        
        // Add buildings to block
        if (block.type === 'venue') {
          block.buildings.push({
            x: block.x,
            y: block.y,
            width: 3,
            height: 3,
            height_levels: 2,
            type: 'venue',
            style: 0
          });
        } else {
          // Office buildings
          block.buildings.push({
            x: block.x,
            y: block.y,
            width: 2,
            height: 2,
            height_levels: 3 + Math.floor(Math.random() * 3),
            type: 'office',
            style: Math.floor(Math.random() * 3)
          });
          
          block.buildings.push({
            x: block.x + 2,
            y: block.y + 1,
            width: 1,
            height: 2,
            height_levels: 2 + Math.floor(Math.random() * 2),
            type: 'shop',
            style: Math.floor(Math.random() * 3)
          });
        }
        
        downtown.blocks.push(block);
      }
    }
    
    newDistricts.push(downtown);
    
    // Residential - west side
    const residential: District = {
      id: 'residential',
      name: 'Residential',
      x: 8,
      y: 16,
      width: 14,
      height: 16,
      type: 'residential',
      blocks: []
    };
    
    // Generate residential blocks
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 3; bx++) {
        const block: CityBlock = {
          x: residential.x + bx * 4 + 1,
          y: residential.y + by * 4,
          width: 3,
          height: 3,
          type: 'residential',
          buildings: []
        };
        
        // Add houses
        for (let hy = 0; hy < 2; hy++) {
          for (let hx = 0; hx < 2; hx++) {
            block.buildings.push({
              x: block.x + hx * 1.5,
              y: block.y + hy * 1.5,
              width: 1,
              height: 1,
              height_levels: 1,
              type: 'house',
              style: Math.floor(Math.random() * 4)
            });
          }
        }
        
        residential.blocks.push(block);
      }
    }
    
    // Add a park
    residential.blocks.push({
      x: residential.x + 7,
      y: residential.y + 8,
      width: 4,
      height: 4,
      type: 'park',
      buildings: []
    });
    
    newDistricts.push(residential);
    
    // Commercial - east side
    const commercial: District = {
      id: 'commercial',
      name: 'Shopping District',
      x: 42,
      y: 20,
      width: 14,
      height: 10,
      type: 'commercial',
      blocks: []
    };
    
    // Generate commercial blocks
    for (let by = 0; by < 2; by++) {
      for (let bx = 0; bx < 3; bx++) {
        const block: CityBlock = {
          x: commercial.x + bx * 4 + 1,
          y: commercial.y + by * 4 + 1,
          width: 3,
          height: 3,
          type: 'commercial',
          buildings: []
        };
        
        // Mixed shops and apartments
        block.buildings.push({
          x: block.x,
          y: block.y,
          width: 3,
          height: 2,
          height_levels: 2,
          type: 'shop',
          style: Math.floor(Math.random() * 3)
        });
        
        block.buildings.push({
          x: block.x + 1,
          y: block.y + 2,
          width: 2,
          height: 1,
          height_levels: 1,
          type: 'shop',
          style: Math.floor(Math.random() * 3)
        });
        
        commercial.blocks.push(block);
      }
    }
    
    newDistricts.push(commercial);
    
    // Industrial - north
    const industrial: District = {
      id: 'industrial',
      name: 'Industrial Zone',
      x: 20,
      y: 4,
      width: 24,
      height: 10,
      type: 'industrial',
      blocks: []
    };
    
    // Generate industrial blocks
    for (let by = 0; by < 2; by++) {
      for (let bx = 0; bx < 4; bx++) {
        const block: CityBlock = {
          x: industrial.x + bx * 5 + 2,
          y: industrial.y + by * 4 + 1,
          width: 4,
          height: 3,
          type: 'industrial',
          buildings: []
        };
        
        block.buildings.push({
          x: block.x,
          y: block.y,
          width: 4,
          height: 3,
          height_levels: 1,
          type: 'factory',
          style: 0
        });
        
        industrial.blocks.push(block);
      }
    }
    
    newDistricts.push(industrial);
    
    return newDistricts;
  });
  
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
      const tileX = Math.floor(worldPos.x / TILE_SIZE);
      const tileY = Math.floor(worldPos.y / TILE_SIZE);
      
      const clickedDistrict = districts.find(d => 
        tileX >= d.x && tileX < d.x + d.width &&
        tileY >= d.y && tileY < d.y + d.height
      );
      
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
    [camera, screenToWorld, districts, onDistrictClick]
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
        const tileX = Math.floor(worldPos.x / TILE_SIZE);
        const tileY = Math.floor(worldPos.y / TILE_SIZE);
        
        const district = districts.find(d => 
          tileX >= d.x && tileX < d.x + d.width &&
          tileY >= d.y && tileY < d.y + d.height
        );
        setHoveredDistrict(district || null);
      }
    },
    [isDragging, dragStart, cameraStart, camera, screenToWorld, districts]
  );
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, camera.zoom * delta));
    setCamera({ ...camera, zoom: newZoom });
  }, [camera]);
  
  // Draw tile from tileset
  const drawTile = (
    ctx: CanvasRenderingContext2D,
    tileX: number,
    tileY: number,
    destX: number,
    destY: number,
    scale: number = 1
  ) => {
    if (!cityTileset) return;
    
    ctx.drawImage(
      cityTileset,
      tileX * 16, tileY * 16, 16, 16,
      destX, destY,
      TILE_SIZE * camera.zoom * scale, TILE_SIZE * camera.zoom * scale
    );
  };
  
  // Draw building
  const drawBuilding = (
    ctx: CanvasRenderingContext2D,
    building: Building,
    block: CityBlock
  ) => {
    const pos = worldToScreen(building.x * TILE_SIZE, building.y * TILE_SIZE);
    
    // Building base style mapping
    const styleMap: Record<string, { col: number; row: number }[]> = {
      house: [
        { col: 0, row: 19 }, // red house
        { col: 4, row: 19 }, // blue house  
        { col: 0, row: 27 }, // green house
        { col: 4, row: 27 }  // brown house
      ],
      apartment: [
        { col: 0, row: 23 }, // gray apartment
        { col: 4, row: 23 },
        { col: 0, row: 31 },
      ],
      office: [
        { col: 8, row: 19 }, // modern office
        { col: 12, row: 19 },
        { col: 8, row: 23 },
      ],
      shop: [
        { col: 8, row: 27 }, // shop fronts
        { col: 12, row: 27 },
        { col: 8, row: 31 },
      ],
      venue: [
        { col: 0, row: 19 }, // special red building for venue
      ],
      factory: [
        { col: 0, row: 23 }, // industrial gray
      ]
    };
    
    const styles = styleMap[building.type] || styleMap.house;
    const style = styles[building.style % styles.length];
    
    // Draw building base
    for (let by = 0; by < building.height; by++) {
      for (let bx = 0; bx < building.width; bx++) {
        const tilePos = worldToScreen(
          (building.x + bx) * TILE_SIZE,
          (building.y + by) * TILE_SIZE
        );
        
        // Determine which part of the building to draw
        let tileCol = style.col + 1; // Default center
        let tileRow = style.row + 1; // Default middle
        
        // Corners and edges
        if (bx === 0 && by === 0) {
          tileCol = style.col; tileRow = style.row; // Top-left
        } else if (bx === building.width - 1 && by === 0) {
          tileCol = style.col + 3; tileRow = style.row; // Top-right
        } else if (bx === 0 && by === building.height - 1) {
          tileCol = style.col; tileRow = style.row + 3; // Bottom-left
        } else if (bx === building.width - 1 && by === building.height - 1) {
          tileCol = style.col + 3; tileRow = style.row + 3; // Bottom-right
        } else if (by === 0) {
          tileCol = style.col + 1 + (bx % 2); tileRow = style.row; // Top edge
        } else if (by === building.height - 1) {
          tileCol = style.col + 1 + (bx % 2); tileRow = style.row + 3; // Bottom edge
        } else if (bx === 0) {
          tileCol = style.col; tileRow = style.row + 1 + (by % 2); // Left edge
        } else if (bx === building.width - 1) {
          tileCol = style.col + 3; tileRow = style.row + 1 + (by % 2); // Right edge
        } else {
          // Interior tiles - add some variation
          tileCol = style.col + 1 + (bx % 2);
          tileRow = style.row + 1 + (by % 2);
        }
        
        drawTile(ctx, tileCol, tileRow, tilePos.x, tilePos.y);
      }
    }
    
    // Draw additional height levels for tall buildings
    if (building.height_levels > 1 && (building.type === 'office' || building.type === 'apartment')) {
      for (let level = 1; level < building.height_levels; level++) {
        const levelOffset = -level * TILE_SIZE * 0.5 * camera.zoom;
        
        for (let by = 0; by < Math.min(2, building.height); by++) {
          for (let bx = 0; bx < building.width; bx++) {
            const tilePos = worldToScreen(
              (building.x + bx) * TILE_SIZE,
              (building.y + by) * TILE_SIZE
            );
            
            drawTile(ctx, style.col + 1 + (bx % 2), style.row + 1, 
              tilePos.x, tilePos.y + levelOffset, 0.9);
          }
        }
      }
    }
    
    // Building shadow
    const shadowPos = worldToScreen(
      building.x * TILE_SIZE,
      (building.y + building.height) * TILE_SIZE
    );
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(
      shadowPos.x + 4,
      shadowPos.y,
      building.width * TILE_SIZE * camera.zoom,
      TILE_SIZE * camera.zoom * 0.5
    );
  };
  
  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cityTileset) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    // Clear with city background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw base ground
    for (let y = 0; y < CITY_HEIGHT; y++) {
      for (let x = 0; x < CITY_WIDTH; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        
        // Skip if outside view
        if (pos.x < -TILE_SIZE * camera.zoom || pos.x > width ||
            pos.y < -TILE_SIZE * camera.zoom || pos.y > height) continue;
        
        // Default concrete/asphalt
        drawTile(ctx, 1, 15, pos.x, pos.y);
      }
    }
    
    // Draw main roads
    // Horizontal main avenue
    for (let x = 0; x < CITY_WIDTH; x++) {
      for (let y = 30; y < 32; y++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        drawTile(ctx, 0, 11, pos.x, pos.y); // road tile
      }
    }
    
    // Vertical main avenue
    for (let y = 0; y < CITY_HEIGHT; y++) {
      for (let x = 31; x < 33; x++) {
        const pos = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        drawTile(ctx, 0, 11, pos.x, pos.y); // road tile
      }
    }
    
    // Draw district roads and blocks
    districts.forEach(district => {
      // District boundary roads
      for (let x = district.x - 1; x <= district.x + district.width; x++) {
        const topPos = worldToScreen(x * TILE_SIZE, (district.y - 1) * TILE_SIZE);
        const bottomPos = worldToScreen(x * TILE_SIZE, (district.y + district.height) * TILE_SIZE);
        drawTile(ctx, 0, 11, topPos.x, topPos.y);
        drawTile(ctx, 0, 11, bottomPos.x, bottomPos.y);
      }
      
      for (let y = district.y - 1; y <= district.y + district.height; y++) {
        const leftPos = worldToScreen((district.x - 1) * TILE_SIZE, y * TILE_SIZE);
        const rightPos = worldToScreen((district.x + district.width) * TILE_SIZE, y * TILE_SIZE);
        drawTile(ctx, 0, 11, leftPos.x, leftPos.y);
        drawTile(ctx, 0, 11, rightPos.x, rightPos.y);
      }
      
      // Draw blocks
      district.blocks.forEach(block => {
        // Block ground
        if (block.type === 'park') {
          // Draw grass for parks
          for (let by = 0; by < block.height; by++) {
            for (let bx = 0; bx < block.width; bx++) {
              const pos = worldToScreen(
                (block.x + bx) * TILE_SIZE,
                (block.y + by) * TILE_SIZE
              );
              drawTile(ctx, 0, 0, pos.x, pos.y); // grass tile
            }
          }
          
          // Add some trees
          const treePositions = [
            {x: block.x + 1, y: block.y + 1},
            {x: block.x + block.width - 2, y: block.y + 1},
            {x: block.x + 1, y: block.y + block.height - 2},
            {x: block.x + block.width - 2, y: block.y + block.height - 2}
          ];
          
          treePositions.forEach(tree => {
            const pos = worldToScreen(tree.x * TILE_SIZE, tree.y * TILE_SIZE);
            drawTile(ctx, 2, 1, pos.x, pos.y); // tree tile
          });
        } else {
          // Sidewalks around buildings
          for (let by = -1; by <= block.height; by++) {
            for (let bx = -1; bx <= block.width; bx++) {
              if (by === -1 || by === block.height || bx === -1 || bx === block.width) {
                const pos = worldToScreen(
                  (block.x + bx) * TILE_SIZE,
                  (block.y + by) * TILE_SIZE
                );
                drawTile(ctx, 2, 15, pos.x, pos.y); // sidewalk tile
              }
            }
          }
        }
        
        // Draw buildings
        block.buildings.forEach(building => {
          drawBuilding(ctx, building, block);
        });
      });
      
      // Hover effect for district
      if (hoveredDistrict === district) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
        ctx.lineWidth = 3;
        const districtPos = worldToScreen(
          district.x * TILE_SIZE,
          district.y * TILE_SIZE
        );
        ctx.strokeRect(
          districtPos.x,
          districtPos.y,
          district.width * TILE_SIZE * camera.zoom,
          district.height * TILE_SIZE * camera.zoom
        );
      }
    });
    
    // Draw street decorations
    // Street lights
    [10, 20, 30, 40, 50].forEach(lightX => {
      [10, 20, 35, 40].forEach(lightY => {
        const pos = worldToScreen(lightX * TILE_SIZE, lightY * TILE_SIZE);
        drawTile(ctx, 6, 5, pos.x, pos.y); // street light
      });
    });
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 60);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Underground City", 20, 40);
    
    ctx.font = "16px Arial";
    ctx.fillText("Click a district to explore • Scroll to zoom • Drag to pan", width - 420, 40);
    
    // District info
    if (hoveredDistrict) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(20, height - 120, 300, 100);
      
      const districtColors = {
        downtown: "#E74C3C",
        residential: "#27AE60",
        commercial: "#3498DB",
        industrial: "#7F8C8D"
      };
      
      ctx.fillStyle = districtColors[hoveredDistrict.type];
      ctx.fillRect(20, height - 120, 5, 100);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Arial";
      ctx.fillText(hoveredDistrict.name, 35, height - 90);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(`Type: ${hoveredDistrict.type}`, 35, height - 65);
      ctx.fillText(`Blocks: ${hoveredDistrict.blocks.length}`, 35, height - 45);
      ctx.fillText("Click to enter district", 35, height - 25);
    }
  }, [cityTileset, camera, districts, hoveredDistrict, width, height, worldToScreen]);
  
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
      onWheel={handleWheel}
    />
  );
};
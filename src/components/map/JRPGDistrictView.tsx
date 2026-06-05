import React, { useRef, useEffect, useCallback, useState } from "react";
import { haptics } from "@utils/mobile";
import { soundManager } from "@/game/audio/SoundManager";

interface Building {
  id: string;
  x: number; // Grid position
  y: number;
  type: 'venue' | 'shop' | 'workplace' | 'house';
  name: string;
  tileType: 'red' | 'blue' | 'brown' | 'gray';
}

interface JRPGDistrictViewProps {
  districtName: string;
  districtType: 'downtown' | 'residential' | 'commercial' | 'industrial';
  onBuildingEnter?: (building: Building) => void;
  onExitDistrict?: () => void;
  width?: number;
  height?: number;
}

export const JRPGDistrictView: React.FC<JRPGDistrictViewProps> = ({
  districtName,
  districtType,
  onBuildingEnter,
  onExitDistrict,
  width = window.innerWidth,
  height = window.innerHeight - 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cityTileset, setCityTileset] = useState<HTMLImageElement | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 15 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  
  const TILE_SIZE = 16;
  const SCALE = 3; // SNES style scaling
  const MAP_WIDTH = 20;
  const MAP_HEIGHT = 20;
  
  // Load tileset
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sprites/town/city-tileset.png";
    img.onload = () => setCityTileset(img);
  }, []);
  
  // Generate district layout based on type
  useEffect(() => {
    const newBuildings: Building[] = [];
    
    switch (districtType) {
      case 'downtown':
        // Main street with venues and shops
        newBuildings.push({
          id: 'venue1',
          x: 5, y: 8,
          type: 'venue',
          name: 'The Basement',
          tileType: 'red'
        });
        newBuildings.push({
          id: 'venue2',
          x: 14, y: 8,
          type: 'venue',
          name: 'Rock Club',
          tileType: 'blue'
        });
        newBuildings.push({
          id: 'shop1',
          x: 8, y: 5,
          type: 'shop',
          name: 'Music Store',
          tileType: 'gray'
        });
        newBuildings.push({
          id: 'shop2',
          x: 11, y: 5,
          type: 'shop',
          name: 'Coffee Shop',
          tileType: 'brown'
        });
        break;
        
      case 'residential':
        // Houses in rows
        for (let i = 0; i < 8; i++) {
          newBuildings.push({
            id: `house${i}`,
            x: 4 + (i % 4) * 3,
            y: 5 + Math.floor(i / 4) * 4,
            type: 'house',
            name: `House ${i + 1}`,
            tileType: i % 2 === 0 ? 'blue' : 'brown'
          });
        }
        break;
        
      case 'commercial':
        // Mix of shops and workplaces
        newBuildings.push({
          id: 'shop3',
          x: 6, y: 6,
          type: 'shop',
          name: 'Record Shop',
          tileType: 'red'
        });
        newBuildings.push({
          id: 'workplace1',
          x: 12, y: 6,
          type: 'workplace',
          name: 'Office Building',
          tileType: 'gray'
        });
        newBuildings.push({
          id: 'workplace2',
          x: 9, y: 11,
          type: 'workplace',
          name: 'Day Job Inc',
          tileType: 'blue'
        });
        break;
    }
    
    setBuildings(newBuildings);
  }, [districtType]);
  
  // Update camera to follow player
  useEffect(() => {
    const targetX = playerPos.x * TILE_SIZE * SCALE - width / 2;
    const targetY = playerPos.y * TILE_SIZE * SCALE - height / 2;
    
    setCamera({
      x: Math.max(0, Math.min(targetX, MAP_WIDTH * TILE_SIZE * SCALE - width)),
      y: Math.max(0, Math.min(targetY, MAP_HEIGHT * TILE_SIZE * SCALE - height))
    });
  }, [playerPos, width, height]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      let newX = playerPos.x;
      let newY = playerPos.y;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          newY = Math.max(0, playerPos.y - 1);
          break;
        case 'ArrowDown':
        case 's':
          newY = Math.min(MAP_HEIGHT - 1, playerPos.y + 1);
          break;
        case 'ArrowLeft':
        case 'a':
          newX = Math.max(0, playerPos.x - 1);
          break;
        case 'ArrowRight':
        case 'd':
          newX = Math.min(MAP_WIDTH - 1, playerPos.x + 1);
          break;
        case 'Enter':
        case ' ':
          // Check if standing at building entrance
          const building = buildings.find(b => 
            Math.abs(b.x - playerPos.x) <= 1 && 
            b.y === playerPos.y + 1
          );
          if (building && onBuildingEnter) {
            soundManager.playClick();
            onBuildingEnter(building);
          }
          break;
        case 'Escape':
          if (onExitDistrict) {
            onExitDistrict();
          }
          break;
      }
      
      // Check collision with buildings
      const collision = buildings.some(b => 
        newX >= b.x - 1 && newX <= b.x + 1 &&
        newY >= b.y - 1 && newY <= b.y + 1
      );
      
      if (!collision) {
        setPlayerPos({ x: newX, y: newY });
        haptics.light();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerPos, buildings, onBuildingEnter, onExitDistrict]);
  
  // Draw tile from tileset
  const drawTile = (
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
      destX - camera.x, destY - camera.y,
      TILE_SIZE * SCALE, TILE_SIZE * SCALE
    );
  };
  
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
    
    // Draw ground tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const destX = x * TILE_SIZE * SCALE;
        const destY = y * TILE_SIZE * SCALE;
        
        // Skip if outside camera view
        if (destX + TILE_SIZE * SCALE < camera.x || destX > camera.x + width ||
            destY + TILE_SIZE * SCALE < camera.y || destY > camera.y + height) {
          continue;
        }
        
        // Use different ground tiles based on district
        if (districtType === 'downtown') {
          // Stone/pavement
          drawTile(ctx, 1, 15, destX, destY);
        } else {
          // Grass/dirt
          drawTile(ctx, 0, 15, destX, destY);
        }
      }
    }
    
    // Draw roads
    if (districtType === 'downtown' || districtType === 'commercial') {
      // Horizontal main road
      for (let x = 0; x < MAP_WIDTH; x++) {
        drawTile(ctx, 2, 15, x * TILE_SIZE * SCALE, 10 * TILE_SIZE * SCALE);
      }
    }
    
    // Draw buildings
    buildings.forEach(building => {
      const destX = building.x * TILE_SIZE * SCALE;
      const destY = building.y * TILE_SIZE * SCALE;
      
      // Building tile positions in tileset
      const tilePositions = {
        red: { x: 0, y: 19 },    // Red building at row 19
        blue: { x: 0, y: 22 },   // Blue building at row 22
        brown: { x: 10, y: 19 }, // Brown building
        gray: { x: 10, y: 22 }   // Gray building
      };
      
      const tilePos = tilePositions[building.tileType];
      
      // Draw 2x2 building
      for (let by = 0; by < 2; by++) {
        for (let bx = 0; bx < 2; bx++) {
          drawTile(
            ctx,
            tilePos.x + bx,
            tilePos.y + by,
            destX + bx * TILE_SIZE * SCALE,
            destY + by * TILE_SIZE * SCALE
          );
        }
      }
      
      // Building name (when close)
      const distance = Math.abs(building.x - playerPos.x) + Math.abs(building.y - playerPos.y);
      if (distance < 4) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(
          destX - camera.x,
          destY - camera.y - 20,
          building.name.length * 8,
          18
        );
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "14px Arial";
        ctx.fillText(
          building.name,
          destX - camera.x + 4,
          destY - camera.y - 6
        );
      }
    });
    
    // Draw trees/decorations
    if (districtType === 'residential') {
      const treePositions = [
        {x: 2, y: 3}, {x: 17, y: 4}, {x: 3, y: 14}, {x: 16, y: 15}
      ];
      treePositions.forEach(tree => {
        // Tree tiles from tileset
        drawTile(ctx, 2, 1, tree.x * TILE_SIZE * SCALE, tree.y * TILE_SIZE * SCALE);
      });
    }
    
    // Draw player
    const playerX = playerPos.x * TILE_SIZE * SCALE - camera.x;
    const playerY = playerPos.y * TILE_SIZE * SCALE - camera.y;
    
    // Simple player sprite (use a character from tileset or draw simple shape)
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(
      playerX + TILE_SIZE * SCALE * 0.25,
      playerY + TILE_SIZE * SCALE * 0.25,
      TILE_SIZE * SCALE * 0.5,
      TILE_SIZE * SCALE * 0.5
    );
    
    // Player indicator
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(playerX, playerY, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
    
    // UI overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, 50);
    ctx.fillRect(0, height - 60, width, 60);
    
    // District name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.fillText(districtName, 20, 35);
    
    // Instructions
    ctx.font = "14px Arial";
    ctx.fillText("Arrow keys to move • Enter to enter building • ESC to exit district", 20, height - 35);
    ctx.fillText(`Position: ${playerPos.x}, ${playerPos.y}`, 20, height - 15);
    
    // Mini-map
    const miniMapSize = 100;
    const miniMapX = width - miniMapSize - 20;
    const miniMapY = 70;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(miniMapX - 5, miniMapY - 5, miniMapSize + 10, miniMapSize + 10);
    
    // Mini-map content
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    
    // Buildings on mini-map
    buildings.forEach(building => {
      const mx = miniMapX + (building.x / MAP_WIDTH) * miniMapSize;
      const my = miniMapY + (building.y / MAP_HEIGHT) * miniMapSize;
      
      ctx.fillStyle = building.type === 'venue' ? "#E74C3C" : 
                      building.type === 'shop' ? "#3498DB" :
                      building.type === 'workplace' ? "#95A5A6" : "#27AE60";
      ctx.fillRect(mx - 2, my - 2, 4, 4);
    });
    
    // Player on mini-map
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(
      miniMapX + (playerPos.x / MAP_WIDTH) * miniMapSize - 2,
      miniMapY + (playerPos.y / MAP_HEIGHT) * miniMapSize - 2,
      4, 4
    );
  }, [cityTileset, camera, playerPos, buildings, districtName, districtType, width, height]);
  
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
        imageRendering: "pixelated",
      }}
    />
  );
};
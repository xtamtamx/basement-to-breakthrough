import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CityMap, MapTile, CameraState, TILE_COLORS } from './MapTypes';
import { generateTestMap } from '@/utils/mapGeneration';

interface CityMapCanvasProps {
  width?: number;
  height?: number;
  onTileClick?: (tile: MapTile) => void;
  selectedLocation?: { x: number; y: number };
  activeVenues?: string[];
}

export const CityMapCanvas: React.FC<CityMapCanvasProps> = ({
  width = window.innerWidth,
  height = window.innerHeight - 100, // Account for header
  onTileClick,
  selectedLocation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [map] = useState<CityMap>(() => generateTestMap(20, 15));
  const [camera] = useState<CameraState>({
    x: 0,
    y: 0,
    zoom: 1
  });
  
  // Animation state for pulsing venues
  const animationTimeRef = useRef(0);
  
  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: (worldX * map.tileSize - camera.x) * camera.zoom + width / 2,
      y: (worldY * map.tileSize - camera.y) * camera.zoom + height / 2
    };
  }, [camera, width, height, map.tileSize]);
  
  // Render a single tile
  const renderTile = useCallback((
    ctx: CanvasRenderingContext2D, 
    tile: MapTile,
    time: number
  ) => {
    const tileSize = map.tileSize * camera.zoom;
    const screenPos = worldToScreen(tile.x, tile.y);
    
    // Skip tiles outside viewport (with 1 tile border)
    if (screenPos.x < -tileSize || screenPos.x > width + tileSize ||
        screenPos.y < -tileSize || screenPos.y > height + tileSize) {
      return;
    }
    
    // Get base color for tile
    const color = TILE_COLORS[tile.spriteId] || TILE_COLORS.empty;
    
    // Apply animation for active venues
    if (tile.animated && tile.type === 'venue') {
      const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
      // Blend with purple for pulsing effect
      ctx.globalAlpha = pulse;
    }
    
    // Draw tile
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(screenPos.x),
      Math.floor(screenPos.y),
      Math.ceil(tileSize),
      Math.ceil(tileSize)
    );
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    // Draw tile borders for buildings (subtle grid effect)
    if (tile.type !== 'street') {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.floor(screenPos.x),
        Math.floor(screenPos.y),
        Math.ceil(tileSize),
        Math.ceil(tileSize)
      );
    }
    
    // Highlight selected location
    if (selectedLocation && 
        selectedLocation.x === tile.x && 
        selectedLocation.y === tile.y) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        Math.floor(screenPos.x),
        Math.floor(screenPos.y),
        Math.ceil(tileSize),
        Math.ceil(tileSize)
      );
    }
    
    // Draw icons for special tiles
    if (tile.interactable && tileSize > 16) {
      ctx.font = `${Math.floor(tileSize * 0.5)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (tile.type === 'venue') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('♪', screenPos.x + tileSize / 2, screenPos.y + tileSize / 2);
      } else if (tile.type === 'workplace') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('💼', screenPos.x + tileSize / 2, screenPos.y + tileSize / 2);
      }
    }
  }, [camera.zoom, worldToScreen, width, height, map.tileSize, selectedLocation]);
  
  // Main render loop
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Render all tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x];
        renderTile(ctx, tile, time);
      }
    }
    
    // Draw district labels when zoomed out
    if (camera.zoom < 0.8) {
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.7;
      
      map.districts.forEach(district => {
        const centerX = district.bounds.x + district.bounds.width / 2;
        const centerY = district.bounds.y + district.bounds.height / 2;
        const screenPos = worldToScreen(centerX, centerY);
        
        ctx.fillText(district.name.toUpperCase(), screenPos.x, screenPos.y);
      });
      
      ctx.globalAlpha = 1;
    }
    
    // Store animation time
    animationTimeRef.current = time;
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, [map, renderTile, worldToScreen, camera.zoom, width, height]);
  
  // Set up canvas and start render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Enable pixel-perfect rendering
      ctx.imageSmoothingEnabled = false;
    }
    
    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, render]);
  
  // Handle click events
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTileClick) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldX = Math.floor(((clickX - width / 2) / camera.zoom + camera.x) / map.tileSize);
    const worldY = Math.floor(((clickY - height / 2) / camera.zoom + camera.y) / map.tileSize);
    
    // Check if click is within map bounds
    if (worldX >= 0 && worldX < map.width && worldY >= 0 && worldY < map.height) {
      const tile = map.tiles[worldY][worldX];
      if (tile.interactable) {
        onTileClick(tile);
      }
    }
  }, [camera, map, onTileClick, width, height]);
  
  return (
    <div className="city-map-container" style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      backgroundColor: '#000000',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          cursor: 'grab',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      />
      
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontSize: '12px',
        pointerEvents: 'none',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '5px',
        borderRadius: '3px'
      }}>
        Camera: ({Math.floor(camera.x)}, {Math.floor(camera.y)}) Zoom: {camera.zoom.toFixed(2)}
      </div>
    </div>
  );
};
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MapTile, TILE_COLORS, VenueData, WorkplaceData } from './MapTypes';
import { useMapStore } from '@/stores/mapStore';
import { useGameStore } from '@/stores/gameStore';
import { clampCamera, smoothCameraMovement, getDistanceBetweenPoints, getMidpoint } from '@/utils/cameraUtils';
import { haptics } from '@/utils/mobile';
import { useMapInteraction } from '@/hooks/useMapInteraction';

interface TouchInfo {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const CityMapCanvasEnhanced: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const touchesRef = useRef<Map<number, TouchInfo>>(new Map());
  const pinchStartDistanceRef = useRef<number>(0);
  const pinchStartZoomRef = useRef<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  
  // Store state
  const { 
    cityMap, 
    camera, 
    setCamera, 
    setCameraTarget,
    selectedTile,
    setSelectedTile,
    setHoveredTile,
    activeVenues,
    playerPosition,
    initializeMap,
    updateTile
  } = useMapStore();
  const { handleTileClick } = useMapInteraction();
  
  // Initialize map on mount
  useEffect(() => {
    if (!cityMap) {
      initializeMap();
    }
  }, [cityMap, initializeMap]);
  
  // Canvas dimensions
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 100
  });
  
  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 100
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Camera constraints
  const getCameraConstraints = useCallback(() => {
    if (!cityMap) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZoom: 0.5, maxZoom: 2 };
    
    const worldWidth = cityMap.width * cityMap.tileSize;
    const worldHeight = cityMap.height * cityMap.tileSize;
    const halfViewWidth = dimensions.width / (2 * camera.zoom);
    const halfViewHeight = dimensions.height / (2 * camera.zoom);
    
    return {
      minX: halfViewWidth,
      maxX: worldWidth - halfViewWidth,
      minY: halfViewHeight,
      maxY: worldHeight - halfViewHeight,
      minZoom: 0.5,
      maxZoom: 2
    };
  }, [cityMap, camera.zoom, dimensions]);
  
  // Animation state
  const animationTimeRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }>>([]);
  
  // Convert world to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: (worldX - camera.x) * camera.zoom + dimensions.width / 2,
      y: (worldY - camera.y) * camera.zoom + dimensions.height / 2
    };
  }, [camera, dimensions]);
  
  // Convert screen to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - dimensions.width / 2) / camera.zoom + camera.x,
      y: (screenY - dimensions.height / 2) / camera.zoom + camera.y
    };
  }, [camera, dimensions]);
  
  // Render enhanced tile with effects
  const renderTile = useCallback((
    ctx: CanvasRenderingContext2D,
    tile: MapTile,
    time: number
  ) => {
    if (!cityMap) return;
    
    const tileSize = cityMap.tileSize * camera.zoom;
    const worldPos = {
      x: tile.x * cityMap.tileSize,
      y: tile.y * cityMap.tileSize
    };
    const screenPos = worldToScreen(worldPos.x, worldPos.y);
    
    // Skip tiles outside viewport
    if (screenPos.x < -tileSize || screenPos.x > dimensions.width + tileSize ||
        screenPos.y < -tileSize || screenPos.y > dimensions.height + tileSize) {
      return;
    }
    
    // Base tile color
    const color = TILE_COLORS[tile.spriteId] || TILE_COLORS.empty;
    
    // Special rendering for venues
    if (tile.type === 'venue') {
      const venueData = tile.data as VenueData;
      if (venueData?.hasActiveShow) {
        // Pulsing effect for active venues
        const pulse = Math.sin(time * 0.005) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;
        
        // Glow effect
        ctx.shadowColor = '#8B5CF6';
        ctx.shadowBlur = 10 * camera.zoom;
      }
    }
    
    // Draw tile
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(screenPos.x),
      Math.floor(screenPos.y),
      Math.ceil(tileSize),
      Math.ceil(tileSize)
    );
    
    // Reset effects
    if (tile.type === 'venue' && (tile.data as VenueData)?.hasActiveShow) {
      ctx.restore();
    }
    
    // Tile border
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
    
    // Highlight selected tile
    if (selectedTile && selectedTile.x === tile.x && selectedTile.y === tile.y) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        Math.floor(screenPos.x),
        Math.floor(screenPos.y),
        Math.ceil(tileSize),
        Math.ceil(tileSize)
      );
    }
    
    // Interactive tile indicators
    if (tile.interactable && tileSize > 16) {
      ctx.save();
      ctx.font = `${Math.floor(tileSize * 0.6)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (tile.type === 'venue') {
        const venueData = tile.data as VenueData;
        ctx.fillStyle = venueData?.hasActiveShow ? '#FFD700' : '#FFFFFF';
        ctx.fillText('♪', screenPos.x + tileSize / 2, screenPos.y + tileSize / 2);
        
        // Show capacity if zoomed in
        if (camera.zoom > 1.2 && venueData) {
          ctx.font = `${Math.floor(tileSize * 0.2)}px monospace`;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(
            `${venueData.capacity}`, 
            screenPos.x + tileSize / 2, 
            screenPos.y + tileSize * 0.8
          );
        }
      } else if (tile.type === 'workplace') {
        const workData = tile.data as WorkplaceData;
        ctx.fillStyle = workData?.available ? '#00FF00' : '#FF0000';
        ctx.fillText('💼', screenPos.x + tileSize / 2, screenPos.y + tileSize / 2);
      }
      
      ctx.restore();
    }
  }, [cityMap, camera.zoom, worldToScreen, dimensions, selectedTile]);
  
  // Render particles for effects
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D, deltaTime: number) => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= deltaTime;
      
      if (particle.life <= 0) return false;
      
      const screenPos = worldToScreen(particle.x, particle.y);
      ctx.save();
      ctx.globalAlpha = particle.life / 1000;
      ctx.fillStyle = particle.color;
      ctx.fillRect(screenPos.x - 2, screenPos.y - 2, 4, 4);
      ctx.restore();
      
      return true;
    });
  }, [worldToScreen]);
  
  // Spawn particles at venue
  const spawnVenueParticles = useCallback((tile: MapTile) => {
    if (!cityMap) return;
    
    const worldX = tile.x * cityMap.tileSize + cityMap.tileSize / 2;
    const worldY = tile.y * cityMap.tileSize + cityMap.tileSize / 2;
    
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      particlesRef.current.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * 0.05,
        vy: Math.sin(angle) * 0.05,
        life: 1000,
        color: '#8B5CF6'
      });
    }
  }, [cityMap]);
  
  // Main render loop
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !cityMap) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }
    
    // Calculate delta time
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    // Update camera smooth movement
    if (camera.targetX !== undefined && camera.targetY !== undefined) {
      const newCamera = smoothCameraMovement(
        camera,
        { x: camera.targetX, y: camera.targetY, zoom: camera.zoom },
        deltaTime
      );
      
      const constraints = getCameraConstraints();
      const clampedCamera = clampCamera(newCamera.x, newCamera.y, newCamera.zoom, constraints);
      setCamera(clampedCamera);
      
      // Clear target when close enough
      if (Math.abs(camera.x - camera.targetX) < 1 && Math.abs(camera.y - camera.targetY) < 1) {
        setCamera({ targetX: undefined, targetY: undefined });
      }
    }
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Render tiles
    for (let y = 0; y < cityMap.height; y++) {
      for (let x = 0; x < cityMap.width; x++) {
        const tile = cityMap.tiles[y][x];
        renderTile(ctx, tile, time);
      }
    }
    
    // Render player position
    if (playerPosition) {
      const worldPos = {
        x: playerPosition.x * cityMap.tileSize + cityMap.tileSize / 2,
        y: playerPosition.y * cityMap.tileSize + cityMap.tileSize / 2
      };
      const screenPos = worldToScreen(worldPos.x, worldPos.y);
      
      ctx.save();
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 8 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Render particles
    renderParticles(ctx, deltaTime);
    
    // Render district labels
    if (camera.zoom < 0.8) {
      ctx.save();
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.8;
      
      cityMap.districts.forEach(district => {
        const centerX = (district.bounds.x + district.bounds.width / 2) * cityMap.tileSize;
        const centerY = (district.bounds.y + district.bounds.height / 2) * cityMap.tileSize;
        const screenPos = worldToScreen(centerX, centerY);
        
        // Draw label background
        const text = district.name.toUpperCase();
        const metrics = ctx.measureText(text);
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(
          screenPos.x - metrics.width / 2 - 5,
          screenPos.y - 10,
          metrics.width + 10,
          20
        );
        
        // Draw label text
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.fillText(text, screenPos.x, screenPos.y);
      });
      
      ctx.restore();
    }
    
    // Store animation time
    animationTimeRef.current = time;
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, [cityMap, camera, dimensions, getCameraConstraints, playerPosition, renderTile, renderParticles, setCamera, worldToScreen]);
  
  // Touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      touchesRef.current.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY
      });
    }
    
    if (e.touches.length === 2) {
      // Start pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      pinchStartDistanceRef.current = getDistanceBetweenPoints(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
      pinchStartZoomRef.current = camera.zoom;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
    }
  }, [camera.zoom]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    // Update touch positions
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const touchInfo = touchesRef.current.get(touch.identifier);
      if (touchInfo) {
        touchInfo.currentX = touch.clientX;
        touchInfo.currentY = touch.clientY;
      }
    }
    
    if (e.touches.length === 2 && touchesRef.current.size === 2) {
      // Handle pinch zoom
      const touches = Array.from(touchesRef.current.values());
      const currentDistance = getDistanceBetweenPoints(
        { x: touches[0].currentX, y: touches[0].currentY },
        { x: touches[1].currentX, y: touches[1].currentY }
      );
      
      const scale = currentDistance / pinchStartDistanceRef.current;
      const newZoom = pinchStartZoomRef.current * scale;
      
      const constraints = getCameraConstraints();
      const clampedZoom = Math.max(constraints.minZoom, Math.min(constraints.maxZoom, newZoom));
      
      // Zoom towards midpoint
      const midpoint = getMidpoint(
        { x: touches[0].currentX, y: touches[0].currentY },
        { x: touches[1].currentX, y: touches[1].currentY }
      );
      
      const worldMidpoint = screenToWorld(midpoint.x, midpoint.y);
      
      // Adjust camera to keep midpoint stable
      const zoomRatio = clampedZoom / camera.zoom;
      const newCameraX = worldMidpoint.x - (worldMidpoint.x - camera.x) * zoomRatio;
      const newCameraY = worldMidpoint.y - (worldMidpoint.y - camera.y) * zoomRatio;
      
      const clampedCamera = clampCamera(newCameraX, newCameraY, clampedZoom, constraints);
      setCamera(clampedCamera);
      
    } else if (e.touches.length === 1 && isDragging) {
      // Handle pan
      const touch = e.touches[0];
      const touchInfo = touchesRef.current.get(touch.identifier);
      if (!touchInfo) return;
      
      const deltaX = (touchInfo.currentX - touchInfo.startX) / camera.zoom;
      const deltaY = (touchInfo.currentY - touchInfo.startY) / camera.zoom;
      
      const constraints = getCameraConstraints();
      const clampedCamera = clampCamera(
        camera.x - deltaX,
        camera.y - deltaY,
        camera.zoom,
        constraints
      );
      
      setCamera(clampedCamera);
      
      // Update start position for continuous dragging
      touchInfo.startX = touchInfo.currentX;
      touchInfo.startY = touchInfo.currentY;
    }
  }, [camera, getCameraConstraints, isDragging, screenToWorld, setCamera]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    // Check for tap (no movement)
    if (e.changedTouches.length === 1 && touchesRef.current.size === 1) {
      const touch = e.changedTouches[0];
      const touchInfo = touchesRef.current.get(touch.identifier);
      
      if (touchInfo) {
        const moveDistance = getDistanceBetweenPoints(
          { x: touchInfo.startX, y: touchInfo.startY },
          { x: touchInfo.currentX, y: touchInfo.currentY }
        );
        
        if (moveDistance < 10) {
          // Handle tap
          handleTap(touchInfo.currentX, touchInfo.currentY);
        }
      }
    }
    
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      touchesRef.current.delete(e.changedTouches[i].identifier);
    }
    
    if (touchesRef.current.size === 0) {
      setIsDragging(false);
    }
  }, []);
  
  // Mouse handling for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    touchesRef.current.set(-1, {
      id: -1,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    });
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const touchInfo = touchesRef.current.get(-1);
    if (!touchInfo) return;
    
    const deltaX = (e.clientX - touchInfo.startX) / camera.zoom;
    const deltaY = (e.clientY - touchInfo.startY) / camera.zoom;
    
    const constraints = getCameraConstraints();
    const clampedCamera = clampCamera(
      camera.x - deltaX,
      camera.y - deltaY,
      camera.zoom,
      constraints
    );
    
    setCamera(clampedCamera);
    
    touchInfo.startX = e.clientX;
    touchInfo.startY = e.clientY;
  }, [camera, getCameraConstraints, isDragging, setCamera]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const touchInfo = touchesRef.current.get(-1);
    
    if (touchInfo) {
      const moveDistance = getDistanceBetweenPoints(
        { x: touchInfo.startX, y: touchInfo.startY },
        { x: e.clientX, y: e.clientY }
      );
      
      if (moveDistance < 10) {
        handleTap(e.clientX, e.clientY);
      }
    }
    
    setIsDragging(false);
    touchesRef.current.clear();
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomSpeed = 0.001;
    const newZoom = camera.zoom * (1 - e.deltaY * zoomSpeed);
    
    const constraints = getCameraConstraints();
    const clampedZoom = Math.max(constraints.minZoom, Math.min(constraints.maxZoom, newZoom));
    
    // Zoom towards mouse position
    const worldMouse = screenToWorld(e.clientX, e.clientY);
    const zoomRatio = clampedZoom / camera.zoom;
    const newCameraX = worldMouse.x - (worldMouse.x - camera.x) * zoomRatio;
    const newCameraY = worldMouse.y - (worldMouse.y - camera.y) * zoomRatio;
    
    const clampedCamera = clampCamera(newCameraX, newCameraY, clampedZoom, constraints);
    setCamera(clampedCamera);
  }, [camera, getCameraConstraints, screenToWorld, setCamera]);
  
  // Handle tap/click
  const handleTap = useCallback((x: number, y: number) => {
    if (!cityMap || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    const worldPos = screenToWorld(canvasX, canvasY);
    const tileX = Math.floor(worldPos.x / cityMap.tileSize);
    const tileY = Math.floor(worldPos.y / cityMap.tileSize);
    
    if (tileX >= 0 && tileX < cityMap.width && tileY >= 0 && tileY < cityMap.height) {
      const tile = cityMap.tiles[tileY][tileX];
      
      if (tile.interactable) {
        haptics.light();
        setSelectedTile(tile);
        
        // Spawn particles for feedback
        spawnVenueParticles(tile);
        
        // Handle tile interaction
        handleTileClick(tile);
      }
    }
  }, [cityMap, screenToWorld, setSelectedTile, spawnVenueParticles]);
  
  // Double tap to center
  const lastTapTimeRef = useRef(0);
  const handleDoubleTap = useCallback((x: number, y: number) => {
    const worldPos = screenToWorld(x, y);
    setCameraTarget(worldPos.x, worldPos.y);
    haptics.medium();
  }, [screenToWorld, setCameraTarget]);
  
  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
    }
    
    animationFrameRef.current = requestAnimationFrame(render);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, render]);
  
  if (!cityMap) {
    return <div>Loading map...</div>;
  }
  
  return (
    <div className="city-map-container" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#000000',
      overflow: 'hidden',
      touchAction: 'none'
    }}>
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        pointerEvents: 'none'
      }}>
        {/* Camera info */}
        <div style={{
          color: '#FFFFFF',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '5px',
          borderRadius: '3px',
          display: 'inline-block'
        }}>
          Zoom: {camera.zoom.toFixed(2)}x | FPS: {Math.round(1000 / 16)}
        </div>
        
        {/* Selected tile info */}
        {selectedTile && (
          <div style={{
            position: 'absolute',
            top: 40,
            left: 0,
            color: '#FFFFFF',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #8B5CF6'
          }}>
            <div>{selectedTile.type.toUpperCase()} - {selectedTile.district}</div>
            {selectedTile.data && 'name' in selectedTile.data && (
              <div>{selectedTile.data.name}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => {
            const newZoom = Math.min(camera.zoom * 1.2, 2);
            setCamera({ zoom: newZoom });
            haptics.light();
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            color: '#FFFFFF',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(camera.zoom * 0.8, 0.5);
            setCamera({ zoom: newZoom });
            haptics.light();
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            color: '#FFFFFF',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          −
        </button>
      </div>
    </div>
  );
};
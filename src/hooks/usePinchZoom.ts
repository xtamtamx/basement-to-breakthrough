import { useRef, useEffect, useCallback } from 'react';
import { haptics } from '@utils/mobile';

interface PinchZoomConfig {
  minScale?: number;
  maxScale?: number;
  onZoomStart?: (scale: number) => void;
  onZoomChange?: (scale: number) => void;
  onZoomEnd?: (scale: number) => void;
  enableHaptics?: boolean;
}

export const usePinchZoom = (config: PinchZoomConfig = {}) => {
  const {
    minScale = 1,
    maxScale = 3,
    onZoomStart,
    onZoomChange,
    onZoomEnd,
    enableHaptics = true
  } = config;

  const scaleRef = useRef(1);
  const initialDistanceRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);
  const lastScaleRef = useRef(1);

  const getDistance = (touches: TouchList): number => {
    const [touch1, touch2] = Array.from(touches);
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      initialDistanceRef.current = getDistance(e.touches);
      lastScaleRef.current = scaleRef.current;
      
      if (enableHaptics) {
        haptics.light();
      }
      
      onZoomStart?.(scaleRef.current);
    }
  }, [onZoomStart, enableHaptics]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPinchingRef.current || e.touches.length !== 2 || !initialDistanceRef.current) {
      return;
    }

    e.preventDefault();

    const currentDistance = getDistance(e.touches);
    const scale = (currentDistance / initialDistanceRef.current) * lastScaleRef.current;
    
    // Clamp scale to min/max
    const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
    
    // Haptic feedback at boundaries
    if (enableHaptics) {
      if (clampedScale === minScale || clampedScale === maxScale) {
        if (scaleRef.current !== clampedScale) {
          haptics.warning();
        }
      }
    }
    
    scaleRef.current = clampedScale;
    onZoomChange?.(clampedScale);
  }, [minScale, maxScale, onZoomChange, enableHaptics]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isPinchingRef.current && e.touches.length < 2) {
      isPinchingRef.current = false;
      initialDistanceRef.current = null;
      
      if (enableHaptics) {
        haptics.light();
      }
      
      onZoomEnd?.(scaleRef.current);
    }
  }, [onZoomEnd, enableHaptics]);

  const pinchZoomHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      touchAction: 'none' // Prevent browser zoom
    }
  };

  const reset = useCallback(() => {
    scaleRef.current = 1;
    onZoomChange?.(1);
  }, [onZoomChange]);

  return {
    scale: scaleRef.current,
    pinchZoomHandlers,
    reset,
    setScale: (scale: number) => {
      scaleRef.current = Math.max(minScale, Math.min(maxScale, scale));
      onZoomChange?.(scaleRef.current);
    }
  };
};
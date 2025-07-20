import { useRef, useEffect, useCallback } from 'react';
import { TouchType, SwipeDirection, Position } from '@game/types';
import { haptics } from '@utils/mobile';

interface TouchConfig {
  onTap?: (position: Position) => void;
  onDoubleTap?: (position: Position) => void;
  onLongPress?: (position: Position) => void;
  onSwipe?: (direction: SwipeDirection, distance: number) => void;
  onDragStart?: (position: Position) => void;
  onDragMove?: (position: Position, delta: Position) => void;
  onDragEnd?: (position: Position) => void;
  enableHaptics?: boolean;
  longPressDelay?: number; // ms
  swipeThreshold?: number; // pixels
  doubleTapDelay?: number; // ms
}

export const useTouch = (config: TouchConfig) => {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onDragStart,
    onDragMove,
    onDragEnd,
    enableHaptics = true,
    longPressDelay = 500,
    swipeThreshold = 50,
    doubleTapDelay = 300,
  } = config;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<Position | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getPosition = (e: TouchEvent | MouseEvent): Position => {
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    return {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
    const position = getPosition(e);
    const time = Date.now();
    
    touchStartRef.current = { ...position, time };
    
    // Start long press timer
    if (onLongPress) {
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current && !isDraggingRef.current) {
          if (enableHaptics) haptics.medium();
          onLongPress(position);
          touchStartRef.current = null; // Prevent tap after long press
        }
      }, longPressDelay);
    }
    
    // Check for drag start
    if (onDragStart || onDragMove || onDragEnd) {
      dragStartPosRef.current = position;
    }
  }, [onLongPress, onDragStart, onDragMove, onDragEnd, longPressDelay, enableHaptics, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!touchStartRef.current) return;
    
    const currentPos = getPosition(e);
    const startPos = touchStartRef.current;
    const distance = Math.sqrt(
      Math.pow(currentPos.x - startPos.x, 2) + 
      Math.pow(currentPos.y - startPos.y, 2)
    );
    
    // Cancel long press if moved too much
    if (distance > 10) {
      clearLongPressTimer();
      
      // Start dragging
      if (!isDraggingRef.current && dragStartPosRef.current && (onDragStart || onDragMove)) {
        isDraggingRef.current = true;
        if (onDragStart) {
          if (enableHaptics) haptics.light();
          onDragStart(dragStartPosRef.current);
        }
      }
      
      // Continue dragging
      if (isDraggingRef.current && onDragMove && dragStartPosRef.current) {
        const delta = {
          x: currentPos.x - dragStartPosRef.current.x,
          y: currentPos.y - dragStartPosRef.current.y,
        };
        onDragMove(currentPos, delta);
      }
    }
  }, [onDragStart, onDragMove, enableHaptics, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: TouchEvent | MouseEvent) => {
    clearLongPressTimer();
    
    if (!touchStartRef.current) return;
    
    const endPos = getPosition(e);
    const endTime = Date.now();
    const startPos = touchStartRef.current;
    const duration = endTime - startPos.time;
    
    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    touchEndRef.current = { ...endPos, time: endTime };
    
    // Handle drag end
    if (isDraggingRef.current && onDragEnd) {
      if (enableHaptics) haptics.light();
      onDragEnd(endPos);
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
      touchStartRef.current = null;
      return;
    }
    
    // Handle swipe
    if (distance > swipeThreshold && duration < 500 && onSwipe) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      let direction: SwipeDirection;
      if (absX > absY) {
        direction = deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
      } else {
        direction = deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
      }
      
      if (enableHaptics) haptics.light();
      onSwipe(direction, distance);
      touchStartRef.current = null;
      return;
    }
    
    // Handle tap/double tap
    if (distance < 10 && duration < 200) {
      const timeSinceLastTap = endTime - lastTapRef.current;
      
      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        // Double tap
        if (enableHaptics) haptics.medium();
        onDoubleTap(endPos);
        lastTapRef.current = 0;
      } else {
        // Single tap
        if (enableHaptics) haptics.light();
        if (onTap) onTap(endPos);
        lastTapRef.current = endTime;
      }
    }
    
    touchStartRef.current = null;
    isDraggingRef.current = false;
    dragStartPosRef.current = null;
  }, [
    onTap,
    onDoubleTap,
    onSwipe,
    onDragEnd,
    swipeThreshold,
    doubleTapDelay,
    enableHaptics,
    clearLongPressTimer,
  ]);

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleTouchStart,
    onMouseMove: handleTouchMove,
    onMouseUp: handleTouchEnd,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return touchHandlers;
};
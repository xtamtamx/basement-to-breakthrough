import { useRef, useState, useCallback, useEffect } from 'react';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  initialPosition: { x: number; y: number };
}

interface UseDraggableOptions {
  onDragStart?: (position: { x: number; y: number }) => void;
  onDragMove?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  disabled?: boolean;
}

export const useDraggable = (
  id: string,
  options: UseDraggableOptions = {}
) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
  });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (options.disabled) return;
    
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const offset = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    setDragState({
      isDragging: true,
      dragOffset: offset,
      initialPosition: { x: rect.left, y: rect.top },
    });

    haptics.light();
    audio.cardPickup();
    options.onDragStart?.({ x: clientX, y: clientY });
  }, [options]);

  const lastMoveTime = useRef(0);
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging || options.disabled) return;

    const element = elementRef.current;
    if (!element) return;

    // Throttle move updates to 60fps
    const now = performance.now();
    if (now - lastMoveTime.current < 16.67) return;
    lastMoveTime.current = now;

    const x = clientX - dragState.dragOffset.x;
    const y = clientY - dragState.dragOffset.y;

    // Use transform instead of position for better performance
    element.style.position = 'fixed';
    element.style.transform = `translate(${x}px, ${y}px)`;
    element.style.zIndex = '1000';
    element.style.cursor = 'grabbing';

    options.onDragMove?.({ x: clientX, y: clientY });
  }, [dragState, options]);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;

    const element = elementRef.current;
    if (element) {
      element.style.position = '';
      element.style.transform = '';
      element.style.zIndex = '';
      element.style.cursor = '';
    }

    setDragState({
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      initialPosition: { x: 0, y: 0 },
    });

    haptics.light();
    audio.cardDrop();
    options.onDragEnd?.({ x: clientX, y: clientY });
  }, [dragState, options]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    handleEnd(touch.clientX, touch.clientY);
  }, [handleEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    handleEnd(e.clientX, e.clientY);
  }, [handleEnd]);

  // Global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    ref: elementRef,
    isDragging: dragState.isDragging,
    bind: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      style: {
        cursor: dragState.isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none' as const,
      },
    },
  };
};
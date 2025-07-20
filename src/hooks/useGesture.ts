import { useCallback, useRef } from 'react';
import { useTouch } from './useTouch';
import { SwipeDirection, Position } from '@game/types';

interface GestureHandlers {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDrag?: (delta: Position) => void;
  onDragEnd?: () => void;
}

interface GestureOptions {
  enableHaptics?: boolean;
  preventScroll?: boolean;
  disabled?: boolean;
}

export const useGesture = (
  handlers: GestureHandlers,
  options: GestureOptions = {}
) => {
  const { enableHaptics = true, preventScroll = true, disabled = false } = options;
  const elementRef = useRef<HTMLElement | null>(null);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (disabled) return;
      
      switch (direction) {
        case SwipeDirection.LEFT:
          handlers.onSwipeLeft?.();
          break;
        case SwipeDirection.RIGHT:
          handlers.onSwipeRight?.();
          break;
        case SwipeDirection.UP:
          handlers.onSwipeUp?.();
          break;
        case SwipeDirection.DOWN:
          handlers.onSwipeDown?.();
          break;
      }
    },
    [handlers, disabled]
  );

  const touchHandlers = useTouch({
    onTap: disabled ? undefined : handlers.onTap ? () => handlers.onTap!() : undefined,
    onDoubleTap: disabled ? undefined : handlers.onDoubleTap ? () => handlers.onDoubleTap!() : undefined,
    onLongPress: disabled ? undefined : handlers.onLongPress ? () => handlers.onLongPress!() : undefined,
    onSwipe: disabled ? undefined : handleSwipe,
    onDragMove: disabled ? undefined : handlers.onDrag ? (_, delta) => handlers.onDrag!(delta) : undefined,
    onDragEnd: disabled ? undefined : handlers.onDragEnd ? () => handlers.onDragEnd!() : undefined,
    enableHaptics,
  });

  const bindGestures = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    
    elementRef.current = el;
    
    // Prevent default touch behaviors if needed
    if (preventScroll) {
      const preventDefault = (e: TouchEvent) => {
        if (!disabled) {
          e.preventDefault();
        }
      };
      
      el.addEventListener('touchmove', preventDefault, { passive: false });
      
      return () => {
        el.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [preventScroll, disabled]);

  return {
    bind: touchHandlers,
    ref: bindGestures,
  };
};

// Convenience hook for swipeable cards
export const useSwipeableCard = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onTap?: () => void
) => {
  return useGesture({
    onSwipeLeft,
    onSwipeRight,
    onTap,
  });
};

// Convenience hook for draggable elements
export const useDraggable = (
  onDrag: (delta: Position) => void,
  onDragEnd?: () => void
) => {
  return useGesture({
    onDrag,
    onDragEnd,
  });
};
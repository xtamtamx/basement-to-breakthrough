import React, { useRef, useEffect, ReactNode } from 'react';
import { useTouch } from '@hooks/useTouch';
import { SwipeDirection } from '@game/types';

interface MobileScrollProps {
  children: ReactNode;
  horizontal?: boolean;
  snap?: boolean;
  snapPoints?: number[];
  onScrollEnd?: (position: number) => void;
  className?: string;
  showScrollbar?: boolean;
  momentum?: boolean;
}

export const MobileScroll: React.FC<MobileScrollProps> = ({
  children,
  horizontal = false,
  snap = false,
  snapPoints = [],
  onScrollEnd,
  className = '',
  showScrollbar = false,
  momentum = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);
  const lastPosRef = useRef(0);
  const animationRef = useRef<number>();

  const findNearestSnapPoint = (position: number): number => {
    if (!snap || snapPoints.length === 0) return position;
    
    return snapPoints.reduce((prev, curr) => 
      Math.abs(curr - position) < Math.abs(prev - position) ? curr : prev
    );
  };

  const animateToPosition = (targetPos: number) => {
    if (!scrollRef.current) return;
    
    const startPos = horizontal 
      ? scrollRef.current.scrollLeft 
      : scrollRef.current.scrollTop;
    
    const distance = targetPos - startPos;
    const duration = Math.min(300, Math.abs(distance) * 2);
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPos = startPos + (distance * eased);
      
      if (horizontal) {
        scrollRef.current!.scrollLeft = currentPos;
      } else {
        scrollRef.current!.scrollTop = currentPos;
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onScrollEnd?.(targetPos);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMomentum = () => {
    if (!momentum || Math.abs(velocityRef.current) < 0.5) {
      if (snap) {
        const currentPos = horizontal 
          ? scrollRef.current!.scrollLeft 
          : scrollRef.current!.scrollTop;
        const snapPos = findNearestSnapPoint(currentPos);
        animateToPosition(snapPos);
      }
      return;
    }
    
    const deceleration = 0.95;
    velocityRef.current *= deceleration;
    
    if (horizontal) {
      scrollRef.current!.scrollLeft += velocityRef.current;
    } else {
      scrollRef.current!.scrollTop += velocityRef.current;
    }
    
    animationRef.current = requestAnimationFrame(handleMomentum);
  };

  const touchHandlers = useTouch({
    onDragStart: (pos) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastPosRef.current = horizontal ? pos.x : pos.y;
      velocityRef.current = 0;
    },
    onDragMove: (pos, delta) => {
      if (!scrollRef.current) return;
      
      const currentPos = horizontal ? pos.x : pos.y;
      const diff = lastPosRef.current - currentPos;
      
      if (horizontal) {
        scrollRef.current.scrollLeft += diff;
      } else {
        scrollRef.current.scrollTop += diff;
      }
      
      velocityRef.current = diff;
      lastPosRef.current = currentPos;
    },
    onDragEnd: () => {
      handleMomentum();
    },
    onSwipe: (direction: SwipeDirection, distance: number) => {
      if (!snap || snapPoints.length === 0) return;
      
      const currentPos = horizontal 
        ? scrollRef.current!.scrollLeft 
        : scrollRef.current!.scrollTop;
      
      let targetIndex = snapPoints.findIndex(p => p >= currentPos);
      
      if (horizontal) {
        if (direction === SwipeDirection.LEFT && targetIndex < snapPoints.length - 1) {
          targetIndex++;
        } else if (direction === SwipeDirection.RIGHT && targetIndex > 0) {
          targetIndex--;
        }
      } else {
        if (direction === SwipeDirection.UP && targetIndex < snapPoints.length - 1) {
          targetIndex++;
        } else if (direction === SwipeDirection.DOWN && targetIndex > 0) {
          targetIndex--;
        }
      }
      
      if (targetIndex >= 0 && targetIndex < snapPoints.length) {
        animateToPosition(snapPoints[targetIndex]);
      }
    }
  });

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const scrollbarClass = showScrollbar 
    ? '' 
    : horizontal 
      ? 'scrollbar-hide-x' 
      : 'scrollbar-hide-y';

  return (
    <div
      ref={scrollRef}
      className={`
        ${horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'}
        ${scrollbarClass}
        ${className}
      `}
      {...touchHandlers}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: snap ? 'auto' : 'smooth'
      }}
    >
      {children}
    </div>
  );
};
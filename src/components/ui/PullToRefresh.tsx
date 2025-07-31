import React, { useState, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { haptics } from '@utils/mobile';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  const startYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    // Only start pull if at top of scroll
    if (scrollTop === 0) {
      startYRef.current = touch.clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startYRef.current || disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    
    // Apply resistance
    const resistedDistance = Math.min(distance * 0.5, threshold * 2);
    setPullDistance(resistedDistance);
    
    // Trigger haptic when crossing threshold
    if (resistedDistance >= threshold && !hasTriggered) {
      haptics.medium();
      setHasTriggered(true);
    } else if (resistedDistance < threshold && hasTriggered) {
      haptics.light();
      setHasTriggered(false);
    }
    
    // Prevent default scrolling when pulling
    if (distance > 0) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!startYRef.current || disabled || isRefreshing) return;
    
    const shouldRefresh = pullDistance >= threshold;
    
    if (shouldRefresh) {
      setIsRefreshing(true);
      haptics.success();
      
      try {
        await onRefresh();
      } catch (error) {
        haptics.error();
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setHasTriggered(false);
    startYRef.current = null;
  };

  const getIndicatorOpacity = () => {
    if (isRefreshing) return 1;
    return Math.min(pullDistance / threshold, 1);
  };

  const getIndicatorScale = () => {
    if (isRefreshing) return 1;
    return 0.5 + (Math.min(pullDistance / threshold, 1) * 0.5);
  };

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10"
        style={{
          transform: `translateY(${isRefreshing ? 20 : pullDistance - 40}px)`,
          opacity: getIndicatorOpacity(),
          transition: isRefreshing ? 'transform 0.2s ease' : 'none'
        }}
      >
        <div
          className="bg-gray-800 rounded-full p-3 shadow-lg"
          style={{
            transform: `scale(${getIndicatorScale()})`,
            transition: isRefreshing ? 'transform 0.2s ease' : 'none'
          }}
        >
          <RefreshCw 
            className={`w-6 h-6 text-white ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 2}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s ease'
            }}
          />
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease' : 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </div>
    </div>
  );
};
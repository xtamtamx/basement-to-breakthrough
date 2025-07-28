import React, { useMemo } from 'react';
import { Walker, WalkerType, WalkerState } from '@game/types';

interface WalkerSpriteProps {
  walker: Walker;
  cellSize: number;
  gridBounds: { x: number; y: number; width: number; height: number };
}

export const WalkerSprite: React.FC<WalkerSpriteProps> = ({ walker, cellSize, gridBounds }) => {
  // Calculate walker position relative to current view
  const position = useMemo(() => {
    const relativeX = walker.x - gridBounds.x;
    const relativeY = walker.y - gridBounds.y;
    return {
      x: relativeX * cellSize + cellSize / 2,
      y: relativeY * cellSize + cellSize / 2
    };
  }, [walker.x, walker.y, cellSize, gridBounds]);

  // Calculate walking direction for sprite rotation
  const direction = useMemo(() => {
    if (walker.path.length === 0) return 'down';
    const next = walker.path[0];
    const dx = next.x - Math.floor(walker.x);
    const dy = next.y - Math.floor(walker.y);
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }, [walker.x, walker.y, walker.path]);

  // Animation frame based on time
  const animationFrame = useMemo(() => {
    if (walker.state !== WalkerState.WALKING) return 0;
    return Math.floor(Date.now() / 200) % 4; // 4 frame walk cycle
  }, [walker.state]);

  const getSpriteStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'translate(-50%, -50%)',
      transition: walker.state === WalkerState.WALKING ? 'left 0.1s linear, top 0.1s linear' : 'none',
      zIndex: Math.floor(walker.y * 10) + 100
    };

    switch (walker.type) {
      case WalkerType.MUSICIAN:
        return {
          ...baseStyle,
          width: cellSize * 0.4,
          height: cellSize * 0.5,
        };
      case WalkerType.FAN:
        return {
          ...baseStyle,
          width: cellSize * 0.3,
          height: cellSize * 0.4,
        };
      default:
        return baseStyle;
    }
  };

  const renderMusicianSprite = () => {
    const bounceOffset = walker.state === WalkerState.WALKING ? Math.sin(Date.now() / 150) * 2 : 0;
    const rotation = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 32"
        style={{
          filter: walker.state === WalkerState.PERFORMING ? 'drop-shadow(0 0 8px #ec4899)' : undefined,
          transform: rotation
        }}
      >
        {/* Shadow */}
        <ellipse cx="12" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
        
        {/* Body */}
        <g transform={`translate(0, ${bounceOffset})`}>
          {/* Instrument (guitar) */}
          <rect x="14" y="16" width="8" height="2" fill="#8B4513" transform="rotate(30 14 16)" />
          <circle cx="20" cy="20" r="3" fill="#8B4513" />
          
          {/* Body */}
          <rect x="8" y="14" width="8" height="10" rx="1" fill="#333" />
          
          {/* Arms */}
          <rect x="6" y="14" width="2" height="8" rx="1" fill="#f4a261" />
          <rect x="16" y="14" width="2" height="8" rx="1" fill="#f4a261" />
          
          {/* Legs */}
          <rect x="9" y="22" width="3" height="8" rx="1" fill="#1e40af" />
          <rect x="12" y="22" width="3" height="8" rx="1" fill="#1e40af" />
          
          {/* Head */}
          <circle cx="12" cy="8" r="5" fill="#f4a261" />
          
          {/* Hair */}
          <path
            d="M7 8 Q12 2 17 8"
            fill={walker.type === WalkerType.MUSICIAN ? '#ec4899' : '#333'}
          />
          
          {/* Face */}
          {walker.state === WalkerState.PERFORMING && (
            <>
              <circle cx="10" cy="8" r="0.5" fill="#000" />
              <circle cx="14" cy="8" r="0.5" fill="#000" />
              <path d="M10 10 Q12 12 14 10" stroke="#000" strokeWidth="0.5" fill="none" />
            </>
          )}
        </g>
        
        {/* Walking animation - leg movement */}
        {walker.state === WalkerState.WALKING && (
          <g transform={`translate(0, ${bounceOffset})`}>
            {/* Left foot */}
            <circle 
              cx="10" 
              cy={30 + (animationFrame === 0 || animationFrame === 1 ? -1 : 0)} 
              r="1.5" 
              fill="#000"
              opacity={animationFrame === 0 || animationFrame === 3 ? 0.5 : 1}
            />
            {/* Right foot */}
            <circle 
              cx="14" 
              cy={30 + (animationFrame === 2 || animationFrame === 3 ? -1 : 0)} 
              r="1.5" 
              fill="#000"
              opacity={animationFrame === 1 || animationFrame === 2 ? 0.5 : 1}
            />
          </g>
        )}
      </svg>
    );
  };

  const renderFanSprite = () => {
    const bounceOffset = walker.state === WalkerState.WALKING ? Math.sin(Date.now() / 200) * 1.5 : 0;
    
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 18 24"
        style={{
          filter: walker.state === WalkerState.AT_VENUE ? 'drop-shadow(0 0 4px #10b981)' : undefined
        }}
      >
        {/* Shadow */}
        <ellipse cx="9" cy="22" rx="6" ry="1.5" fill="rgba(0,0,0,0.3)" />
        
        {/* Body */}
        <g transform={`translate(0, ${bounceOffset})`}>
          {/* T-shirt */}
          <rect x="5" y="10" width="8" height="8" rx="1" fill="#10b981" />
          
          {/* Arms */}
          <rect x="3" y="10" width="2" height="6" rx="1" fill="#f4a261" />
          <rect x="13" y="10" width="2" height="6" rx="1" fill="#f4a261" />
          
          {/* Legs */}
          <rect x="6" y="16" width="2.5" height="6" rx="1" fill="#374151" />
          <rect x="9.5" y="16" width="2.5" height="6" rx="1" fill="#374151" />
          
          {/* Head */}
          <circle cx="9" cy="6" r="4" fill="#f4a261" />
          
          {/* Hair */}
          <circle cx="9" cy="4" r="3" fill="#6b7280" />
          
          {/* Excited expression when at venue */}
          {walker.state === WalkerState.AT_VENUE && (
            <>
              <circle cx="7.5" cy="6" r="0.5" fill="#000" />
              <circle cx="10.5" cy="6" r="0.5" fill="#000" />
              <ellipse cx="9" cy="8" rx="2" ry="1" fill="#000" />
            </>
          )}
        </g>
        
        {/* Phone in hand (taking videos) */}
        {walker.state === WalkerState.AT_VENUE && (
          <rect 
            x="14" 
            y="8" 
            width="3" 
            height="5" 
            rx="0.5" 
            fill="#1f2937"
            transform={`translate(0, ${bounceOffset})`}
          />
        )}
      </svg>
    );
  };

  const renderPoliceSprite = () => {
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 32">
        {/* Police car or officer sprite */}
        <rect x="4" y="10" width="16" height="8" rx="2" fill="#1e40af" />
        <rect x="6" y="8" width="12" height="4" fill="#60a5fa" />
        <circle cx="8" cy="20" r="2" fill="#333" />
        <circle cx="16" cy="20" r="2" fill="#333" />
        {/* Flashing lights */}
        <circle cx="8" cy="6" r="2" fill="#ef4444" opacity={Math.sin(Date.now() / 100) > 0 ? 1 : 0.3} />
        <circle cx="16" cy="6" r="2" fill="#3b82f6" opacity={Math.sin(Date.now() / 100) < 0 ? 1 : 0.3} />
      </svg>
    );
  };

  const renderSupplierSprite = () => {
    const bounceOffset = walker.state === WalkerState.WALKING ? Math.sin(Date.now() / 180) * 1 : 0;
    
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 32">
        {/* Delivery truck */}
        <g transform={`translate(0, ${bounceOffset})`}>
          <rect x="2" y="12" width="20" height="12" rx="1" fill="#6b7280" />
          <rect x="2" y="8" width="12" height="8" fill="#9ca3af" />
          <circle cx="6" cy="26" r="2" fill="#333" />
          <circle cx="18" cy="26" r="2" fill="#333" />
          {/* Cargo */}
          <rect x="14" y="14" width="6" height="8" fill="#8b5cf6" />
        </g>
      </svg>
    );
  };

  // Don't render if walker is outside current view
  if (walker.x < gridBounds.x || walker.x >= gridBounds.x + gridBounds.width ||
      walker.y < gridBounds.y || walker.y >= gridBounds.y + gridBounds.height) {
    return null;
  }

  return (
    <div style={getSpriteStyle()} className="walker-sprite">
      {walker.type === WalkerType.MUSICIAN && renderMusicianSprite()}
      {walker.type === WalkerType.FAN && renderFanSprite()}
      {walker.type === WalkerType.POLICE && renderPoliceSprite()}
      {walker.type === WalkerType.SUPPLIER && renderSupplierSprite()}
      
      {/* Particle effects */}
      {walker.state === WalkerState.PERFORMING && (
        <div className="performance-particles">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="music-note"
              style={{
                animationDelay: `${i * 0.3}s`,
                left: `${-10 + i * 10}px`
              }}
            >
              ♪
            </div>
          ))}
        </div>
      )}
      
      {/* Arrival effect */}
      {walker.state === WalkerState.AT_VENUE && (
        <div className="arrival-pulse" />
      )}
      
      <style jsx>{`
        .walker-sprite {
          user-select: none;
          pointer-events: none;
        }
        
        .performance-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .music-note {
          position: absolute;
          bottom: 100%;
          color: #ec4899;
          font-size: 16px;
          animation: float-up 2s ease-out infinite;
          text-shadow: 0 0 10px rgba(236, 72, 153, 0.8);
        }
        
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px) scale(0.5);
            opacity: 0;
          }
        }
        
        .arrival-pulse {
          position: absolute;
          inset: -20px;
          border: 2px solid #10b981;
          border-radius: 50%;
          animation: pulse-out 1s ease-out;
        }
        
        @keyframes pulse-out {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
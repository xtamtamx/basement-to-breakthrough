import React, { useEffect, useRef, useState } from 'react';

interface FPSStats {
  fps: number;
  min: number;
  max: number;
  avg: number;
  frames: number;
}

interface FPSMonitorProps {
  targetFPS?: number;
  updateInterval?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showGraph?: boolean;
}

export const FPSMonitor: React.FC<FPSMonitorProps> = ({
  targetFPS = 60,
  updateInterval = 1000,
  position = 'top-right',
  showGraph = true
}) => {
  const [stats, setStats] = useState<FPSStats>({
    fps: 0,
    min: Infinity,
    max: 0,
    avg: 0,
    frames: 0
  });
  
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const animationIdRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let totalFrames = 0;
    let fpsSum = 0;

    const measureFPS = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Calculate instantaneous FPS
      const instantFPS = deltaTime > 0 ? 1000 / deltaTime : 0;
      
      // Store frame time
      frameTimesRef.current.push(deltaTime);
      
      // Keep only last second of frame times
      const oneSecondAgo = currentTime - 1000;
      frameTimesRef.current = frameTimesRef.current.filter((_, i) => {
        const frameTime = currentTime - (frameTimesRef.current.length - i) * 16.67;
        return frameTime > oneSecondAgo;
      });

      // Update stats at interval
      if (currentTime - lastUpdateRef.current >= updateInterval) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const currentFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
        
        totalFrames++;
        fpsSum += currentFPS;
        
        setStats(prev => ({
          fps: Math.round(currentFPS),
          min: Math.min(prev.min === Infinity ? currentFPS : prev.min, currentFPS),
          max: Math.max(prev.max, currentFPS),
          avg: fpsSum / totalFrames,
          frames: prev.frames + frameTimesRef.current.length
        }));
        
        // Update history for graph
        setFpsHistory(prev => {
          const newHistory = [...prev, Math.round(currentFPS)];
          return newHistory.slice(-30); // Keep last 30 samples
        });
        
        lastUpdateRef.current = currentTime;
        frameTimesRef.current = [];
      }

      animationIdRef.current = requestAnimationFrame(measureFPS);
    };

    animationIdRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [updateInterval]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getFPSColor = (fps: number) => {
    if (fps >= targetFPS * 0.95) return 'text-green-400';
    if (fps >= targetFPS * 0.8) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} bg-black/80 text-white p-2 rounded-lg font-mono text-xs z-50 select-none pointer-events-none`}
      style={{ minWidth: '150px' }}
    >
      <div className="space-y-1">
        <div className={`text-lg font-bold ${getFPSColor(stats.fps)}`}>
          {stats.fps} FPS
        </div>
        <div className="text-gray-400">
          <div>Min: {Math.round(stats.min)}</div>
          <div>Max: {Math.round(stats.max)}</div>
          <div>Avg: {Math.round(stats.avg)}</div>
        </div>
      </div>
      
      {showGraph && fpsHistory.length > 1 && (
        <div className="mt-2 h-12 relative border-t border-gray-600 pt-1">
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${fpsHistory.length * 4} 40`}
            preserveAspectRatio="none"
            className="absolute inset-0"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className={getFPSColor(stats.fps)}
              points={fpsHistory.map((fps, i) => 
                `${i * 4},${40 - (fps / targetFPS) * 35}`
              ).join(' ')}
            />
            {/* Target FPS line */}
            <line
              x1="0"
              y1="5"
              x2={fpsHistory.length * 4}
              y2="5"
              stroke="gray"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          </svg>
          <div className="absolute right-0 top-0 text-gray-500" style={{ fontSize: '8px' }}>
            {targetFPS}
          </div>
        </div>
      )}
      
      <div className="mt-1 text-gray-500" style={{ fontSize: '10px' }}>
        {stats.frames} frames
      </div>
    </div>
  );
};

// Hook for programmatic FPS monitoring
export const useFPSMonitor = (updateInterval = 1000) => {
  const [fps, setFps] = useState(0);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let animationId: number;

    const measureFPS = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      frameTimesRef.current.push(deltaTime);
      
      if (currentTime - lastUpdateRef.current >= updateInterval) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const currentFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
        
        setFps(Math.round(currentFPS));
        
        lastUpdateRef.current = currentTime;
        frameTimesRef.current = [];
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [updateInterval]);

  return fps;
};
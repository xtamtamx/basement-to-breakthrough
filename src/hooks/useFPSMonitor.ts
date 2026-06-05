import { useEffect, useRef, useState } from 'react';

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

import React from "react";
import { usePerformanceMonitor } from "@utils/performance";

interface PerformanceDisplayProps {
  show?: boolean;
}

export const PerformanceDisplay: React.FC<PerformanceDisplayProps> = ({
  show = true,
}) => {
  const metrics = usePerformanceMonitor();

  if (!show || import.meta.env.PROD) return null;

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return "text-green-400";
    if (fps >= 30) return "text-yellow-400";
    return "text-red-400";
  };

  const getMemoryColor = (used: number, limit: number) => {
    const ratio = used / limit;
    if (ratio < 0.5) return "text-green-400";
    if (ratio < 0.8) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="fixed top-16 right-4 bg-black/90 text-xs font-mono p-2 rounded-lg z-50 min-w-[140px]">
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-metal-500">FPS:</span>
          <span className={getFPSColor(metrics.fps)}>{metrics.fps}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-metal-500">Frame:</span>
          <span className="text-metal-300">
            {metrics.frameTime.toFixed(1)}ms
          </span>
        </div>

        {metrics.memory && (
          <>
            <div className="border-t border-metal-800 my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-metal-500">Memory:</span>
              <span
                className={getMemoryColor(
                  metrics.memory.used,
                  metrics.memory.limit,
                )}
              >
                {metrics.memory.used}MB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-metal-500">Limit:</span>
              <span className="text-metal-400">{metrics.memory.limit}MB</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FactionImpactDisplayProps {
  impact: {
    factionName: string;
    change: number;
    description: string;
  };
  position: { x: string; y: string };
}

export const FactionImpactDisplay: React.FC<FactionImpactDisplayProps> = ({
  impact,
  position,
}) => {
  const isPositive = impact.change > 0;
  const color = isPositive ? "var(--pixel-green)" : "var(--pixel-red)";
  const icon = isPositive ? "↑" : "↓";

  return (
    <AnimatePresence>
      <motion.div
        className="absolute glass-panel p-3 pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          minWidth: "200px",
          zIndex: 1000,
        }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <h3 className="pixel-text pixel-text-sm mb-2" style={{ color }}>
            FACTION IMPACT
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="pixel-text pixel-text-lg" style={{ color }}>
                {icon}
              </span>
              <span
                className="pixel-text pixel-text-md"
                style={{ color: "var(--pixel-white)" }}
              >
                {impact.factionName}
              </span>
              <span className="pixel-text pixel-text-lg" style={{ color }}>
                {impact.change > 0 ? "+" : ""}
                {impact.change}
              </span>
            </div>

            <p
              className="pixel-text pixel-text-xs"
              style={{ color: "var(--pixel-gray)" }}
            >
              {impact.description}
            </p>
          </div>

          {/* Visual effect bars */}
          <div className="mt-3 flex justify-center gap-1">
            {[...Array(Math.abs(Math.floor(impact.change / 10)))].map(
              (_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-4"
                  style={{ backgroundColor: color }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.1 }}
                />
              ),
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

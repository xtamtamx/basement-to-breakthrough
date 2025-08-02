import React, { useEffect, useState } from "react";
import { GrowthEvent } from "@/game/systems/CityGrowthManager";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Hammer, Sparkles } from "lucide-react";

interface GrowthEffectsProps {
  events: GrowthEvent[];
  tileSize: number;
  camera: { x: number; y: number; zoom: number };
  dimensions: { width: number; height: number };
}

export const GrowthEffects: React.FC<GrowthEffectsProps> = ({
  events,
  tileSize,
  camera,
  dimensions,
}) => {
  const [activeEffects, setActiveEffects] = useState<
    (GrowthEvent & { id: string })[]
  >([]);

  useEffect(() => {
    if (events.length === 0) return;

    // Add unique IDs to events and set them as active
    const newEffects = events.map((event) => ({
      ...event,
      id: `${event.x}-${event.y}-${Date.now()}-${Math.random()}`,
    }));

    setActiveEffects((prev) => [...prev, ...newEffects]);

    // Remove effects after animation completes
    const timeout = setTimeout(() => {
      setActiveEffects((prev) =>
        prev.filter((effect) => !newEffects.some((ne) => ne.id === effect.id)),
      );
    }, 3000);

    return () => clearTimeout(timeout);
  }, [events]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => {
    return {
      x: (worldX * tileSize - camera.x) * camera.zoom + dimensions.width / 2,
      y: (worldY * tileSize - camera.y) * camera.zoom + dimensions.height / 2,
    };
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <AnimatePresence>
        {activeEffects.map((effect) => {
          const screenPos = worldToScreen(effect.x, effect.y);
          const effectSize = tileSize * camera.zoom;

          // Skip if off-screen
          if (
            screenPos.x < -effectSize ||
            screenPos.x > dimensions.width + effectSize ||
            screenPos.y < -effectSize ||
            screenPos.y > dimensions.height + effectSize
          ) {
            return null;
          }

          return (
            <motion.div
              key={effect.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              style={{
                position: "absolute",
                left: screenPos.x,
                top: screenPos.y,
                width: effectSize,
                height: effectSize,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Background pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0.2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: 1,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "100%",
                  height: "100%",
                  transform: "translate(-50%, -50%)",
                  borderRadius: "8px",
                  backgroundColor: getEffectColor(effect),
                }}
              />

              {/* Icon */}
              <motion.div
                animate={{
                  y: [-20, -40, -20],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#ffffff",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                }}
              >
                {getEffectIcon(effect)}
              </motion.div>

              {/* Particle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0.5,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 6) * effectSize * 0.8,
                    y: Math.sin((i * Math.PI * 2) / 6) * effectSize * 0.8,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: getParticleColor(effect),
                  }}
                />
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

function getEffectColor(event: GrowthEvent): string {
  switch (event.district) {
    case "downtown":
      return "rgba(6, 182, 212, 0.3)"; // Cyan
    case "warehouse":
      return "rgba(239, 68, 68, 0.3)"; // Red
    case "college":
      return "rgba(16, 185, 129, 0.3)"; // Green
    case "residential":
      return "rgba(251, 146, 60, 0.3)"; // Orange
    case "arts":
      return "rgba(147, 51, 234, 0.3)"; // Purple
    default:
      return "rgba(236, 72, 153, 0.3)"; // Pink
  }
}

function getParticleColor(event: GrowthEvent): string {
  switch (event.toLevel) {
    case "construction":
      return "#fbbf24"; // Yellow
    case "basic":
      return "#10b981"; // Green
    case "developed":
      return "#3b82f6"; // Blue
    case "thriving":
      return "#ec4899"; // Pink
    default:
      return "#ffffff";
  }
}

function getEffectIcon(event: GrowthEvent): React.ReactNode {
  const size = 24;

  switch (event.toLevel) {
    case "construction":
      return <Hammer size={size} />;
    case "thriving":
      return <Sparkles size={size} />;
    default:
      return <Building2 size={size} />;
  }
}

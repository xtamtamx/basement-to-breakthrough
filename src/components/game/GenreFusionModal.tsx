import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Band } from "@game/types";
import { GenreFusion } from "@game/mechanics/GenreFusionSystem";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";

interface GenreFusionModalProps {
  band1: Band | null;
  band2: Band | null;
  fusion: GenreFusion | null;
  onCreateSupergroup: () => void;
  onCreateSideProject: () => void;
  onCancel: () => void;
}

export const GenreFusionModal: React.FC<GenreFusionModalProps> = ({
  band1,
  band2,
  fusion,
  onCreateSupergroup,
  onCreateSideProject,
  onCancel,
}) => {
  const [showLightning, setShowLightning] = useState(false);
  const [choice, setChoice] = useState<"supergroup" | "sideproject" | null>(
    null,
  );

  useEffect(() => {
    if (band1 && band2 && fusion) {
      setShowLightning(true);
      haptics.heavy();
      audio.play("notification");

      // Reset lightning effect
      const timer = setTimeout(() => setShowLightning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [band1, band2, fusion]);

  if (!band1 || !band2 || !fusion) return null;

  const handleChoice = (type: "supergroup" | "sideproject") => {
    setChoice(type);
    haptics.success();
    audio.play("success");

    setTimeout(() => {
      if (type === "supergroup") {
        onCreateSupergroup();
      } else {
        onCreateSideProject();
      }
    }, 500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
      >
        {/* Lightning effect */}
        {showLightning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0, 1, 0],
              scale: [1, 1.1, 1, 1.1, 1],
            }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
              filter: "blur(20px)",
            }}
          />
        )}

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative max-w-lg w-full"
        >
          <div
            className="pixel-panel p-6"
            style={{
              backgroundColor: "rgba(10, 10, 10, 0.98)",
              boxShadow: "0 0 100px rgba(255, 255, 255, 0.2)",
              border: "3px solid var(--pixel-cyan)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  rotate: [0, 360, 720],
                }}
                transition={{ duration: 1 }}
                className="text-5xl mb-4"
              >
                {fusion.icon}
              </motion.div>

              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pixel-text pixel-text-xl pixel-text-shadow mb-2"
                style={{ color: "var(--pixel-yellow)" }}
              >
                GENRE FUSION DETECTED!
              </motion.h2>

              <p
                className="pixel-text pixel-text-sm"
                style={{ color: "var(--pixel-gray)" }}
              >
                Musical chemistry is off the charts!
              </p>
            </div>

            {/* Band combination */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <div className="text-center">
                <div className="glass-panel-raised p-3 mb-2">
                  <p
                    className="pixel-text pixel-text-sm"
                    style={{ color: "var(--pixel-cyan)" }}
                  >
                    {band1.name}
                  </p>
                  <p
                    className="pixel-text"
                    style={{ fontSize: "8px", color: "var(--pixel-gray)" }}
                  >
                    {band1.genre}
                  </p>
                </div>
              </div>

              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { repeat: Infinity, duration: 3, ease: "linear" },
                  scale: { repeat: Infinity, duration: 1.5 },
                }}
                className="text-2xl"
              >
                ⚡
              </motion.div>

              <div className="text-center">
                <div className="glass-panel-raised p-3 mb-2">
                  <p
                    className="pixel-text pixel-text-sm"
                    style={{ color: "var(--pixel-magenta)" }}
                  >
                    {band2.name}
                  </p>
                  <p
                    className="pixel-text"
                    style={{ fontSize: "8px", color: "var(--pixel-gray)" }}
                  >
                    {band2.genre}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Fusion details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="glass-panel-inset p-4 mb-6"
              style={{ borderColor: "var(--pixel-yellow)" }}
            >
              <h3
                className="pixel-text pixel-text-sm text-center mb-3"
                style={{ color: "var(--pixel-yellow)" }}
              >
                {fusion.name.toUpperCase()}
              </h3>

              <p
                className="pixel-text pixel-text-xs text-center mb-3"
                style={{ color: "var(--pixel-white)" }}
              >
                {fusion.description}
              </p>

              <p
                className="pixel-text text-center mb-4"
                style={{
                  fontSize: "8px",
                  color: "var(--pixel-gray)",
                  fontStyle: "italic",
                }}
              >
                "{fusion.flavorText}"
              </p>

              {/* Stat modifiers */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(fusion.statModifiers).map(([stat, value]) => (
                  <div
                    key={stat}
                    className="pixel-badge text-center"
                    style={{
                      backgroundColor:
                        value > 0 ? "var(--pixel-green)" : "var(--pixel-red)",
                      fontSize: "7px",
                    }}
                  >
                    {stat.toUpperCase()} {value > 0 ? "+" : ""}
                    {value}
                  </div>
                ))}
              </div>

              {/* Bonus traits */}
              {fusion.bonusTraits.length > 0 && (
                <div className="mt-3">
                  <p
                    className="pixel-text text-center mb-1"
                    style={{ fontSize: "8px", color: "var(--pixel-cyan)" }}
                  >
                    NEW TRAITS:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {fusion.bonusTraits.map((trait) => (
                      <span
                        key={trait}
                        className="pixel-badge"
                        style={{
                          backgroundColor: "var(--pixel-purple)",
                          fontSize: "6px",
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Choice buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <button
                onClick={() => handleChoice("supergroup")}
                disabled={choice !== null}
                className="w-full glass-button p-3"
                style={{
                  background:
                    choice === "supergroup"
                      ? "var(--pixel-green)"
                      : "linear-gradient(45deg, var(--pixel-yellow), var(--pixel-orange))",
                  opacity: choice && choice !== "supergroup" ? 0.5 : 1,
                }}
              >
                <span className="pixel-text pixel-text-sm">
                  CREATE SUPERGROUP
                </span>
                <p
                  className="pixel-text mt-1"
                  style={{ fontSize: "8px", opacity: 0.8 }}
                >
                  Merge bands into one powerful entity
                </p>
              </button>

              <button
                onClick={() => handleChoice("sideproject")}
                disabled={choice !== null}
                className="w-full glass-button p-3"
                style={{
                  background:
                    choice === "sideproject"
                      ? "var(--pixel-green)"
                      : "linear-gradient(45deg, var(--pixel-cyan), var(--pixel-blue))",
                  opacity: choice && choice !== "sideproject" ? 0.5 : 1,
                }}
              >
                <span className="pixel-text pixel-text-sm">
                  CREATE SIDE PROJECT
                </span>
                <p
                  className="pixel-text mt-1"
                  style={{ fontSize: "8px", opacity: 0.8 }}
                >
                  Keep original bands, add new fusion band
                </p>
              </button>

              <button
                onClick={onCancel}
                disabled={choice !== null}
                className="w-full glass-button p-3"
                style={{
                  backgroundColor: "var(--pixel-gray)",
                  opacity: choice ? 0.5 : 0.8,
                }}
              >
                <span className="pixel-text pixel-text-sm">
                  KEEP THEM SEPARATE
                </span>
              </button>
            </motion.div>

            {/* Choice confirmation */}
            {choice && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                    className="text-4xl mb-3"
                  >
                    🎸
                  </motion.div>
                  <p
                    className="pixel-text pixel-text-lg"
                    style={{ color: "var(--pixel-green)" }}
                  >
                    CREATING{" "}
                    {choice === "supergroup" ? "SUPERGROUP" : "SIDE PROJECT"}...
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

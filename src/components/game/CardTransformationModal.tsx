import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Band, Venue } from "@game/types";
import { TransformationRule } from "@game/mechanics/CardTransformationSystem";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";

interface CardTransformationModalProps {
  card: Band | Venue | null;
  transformation: TransformationRule | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CardTransformationModal: React.FC<
  CardTransformationModalProps
> = ({ card, transformation, onConfirm, onCancel }) => {
  const [showEffect, setShowEffect] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (card && transformation) {
      setShowEffect(true);
      haptics.heavy();
      audio.play("notification");
    }
  }, [card, transformation]);

  if (!card || !transformation) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "var(--pixel-gray)";
      case "uncommon":
        return "var(--pixel-green)";
      case "rare":
        return "var(--pixel-blue)";
      case "legendary":
        return "var(--pixel-purple)";
      default:
        return "var(--pixel-white)";
    }
  };

  const getTransformTypeIcon = (type: string) => {
    switch (type) {
      case "evolve":
        return "📈";
      case "fuse":
        return "🔀";
      case "corrupt":
        return "👿";
      case "ascend":
        return "✨";
      default:
        return "🔄";
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    haptics.success();
    audio.play("achievement");

    setTimeout(() => {
      onConfirm();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
      >
        {/* Background effect */}
        {showEffect && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 2, 1.5],
              opacity: [0, 1, 0.3],
            }}
            transition={{ duration: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${getRarityColor(transformation.rarity)} 0%, transparent 50%)`,
              filter: "blur(50px)",
            }}
          />
        )}

        <motion.div
          initial={{ scale: 0.8, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          exit={{ scale: 0.8, rotateY: 180 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative max-w-md w-full"
        >
          <div
            className="pixel-panel p-6"
            style={{
              backgroundColor: "rgba(10, 10, 10, 0.95)",
              boxShadow: `0 0 50px ${getRarityColor(transformation.rarity)}`,
              border: `2px solid ${getRarityColor(transformation.rarity)}`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2 }}
                className="text-4xl mb-3"
              >
                {transformation.icon}
              </motion.div>

              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pixel-text pixel-text-xl pixel-text-shadow mb-2"
                style={{ color: getRarityColor(transformation.rarity) }}
              >
                TRANSFORMATION AVAILABLE!
              </motion.h2>

              <p
                className="pixel-text pixel-text-sm"
                style={{ color: "var(--pixel-gray)" }}
              >
                {card.name} can undergo a transformation
              </p>
            </div>

            {/* Transformation details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-panel-inset p-4 mb-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">
                  {getTransformTypeIcon(transformation.result.type)}
                </span>
                <div>
                  <h3
                    className="pixel-text pixel-text-sm"
                    style={{ color: getRarityColor(transformation.rarity) }}
                  >
                    {transformation.name}
                  </h3>
                  <p
                    className="pixel-text"
                    style={{ fontSize: "8px", color: "var(--pixel-gray)" }}
                  >
                    {transformation.rarity.toUpperCase()}{" "}
                    {transformation.result.type.toUpperCase()}
                  </p>
                </div>
              </div>

              <p
                className="pixel-text pixel-text-xs mb-3"
                style={{ color: "var(--pixel-white)" }}
              >
                {transformation.description}
              </p>

              {/* Show modifications */}
              <div className="space-y-2">
                {transformation.result.modifications.stats && (
                  <div>
                    <p
                      className="pixel-text"
                      style={{ fontSize: "8px", color: "var(--pixel-yellow)" }}
                    >
                      STAT CHANGES:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(
                        transformation.result.modifications.stats,
                      ).map(([stat, value]) => (
                        <span
                          key={stat}
                          className="pixel-badge"
                          style={{
                            backgroundColor:
                              value > 0
                                ? "var(--pixel-green)"
                                : "var(--pixel-red)",
                            fontSize: "6px",
                          }}
                        >
                          {stat.toUpperCase()} {value > 0 ? "+" : ""}
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {transformation.result.modifications.addTraits && (
                  <div>
                    <p
                      className="pixel-text"
                      style={{ fontSize: "8px", color: "var(--pixel-cyan)" }}
                    >
                      NEW TRAITS:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {transformation.result.modifications.addTraits.map(
                        (trait) => (
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
                        ),
                      )}
                    </div>
                  </div>
                )}

                {transformation.result.modifications.newName && (
                  <p
                    className="pixel-text pixel-text-xs"
                    style={{ color: "var(--pixel-magenta)" }}
                  >
                    NEW NAME: {transformation.result.modifications.newName}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Warning for corrupt transformations */}
            {transformation.result.type === "corrupt" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="glass-panel-inset p-2 mb-4"
                style={{ borderColor: "var(--pixel-red)" }}
              >
                <p
                  className="pixel-text pixel-text-xs text-center"
                  style={{ color: "var(--pixel-red)" }}
                >
                  ⚠️ WARNING: This transformation may have negative effects!
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={confirmed}
                className="flex-1 glass-button p-3"
                style={{
                  background: confirmed
                    ? "var(--pixel-gray)"
                    : `linear-gradient(45deg, ${getRarityColor(transformation.rarity)}, var(--pixel-cyan))`,
                  opacity: confirmed ? 0.5 : 1,
                }}
              >
                <span className="pixel-text pixel-text-sm">
                  {confirmed ? "TRANSFORMING..." : "ACCEPT TRANSFORMATION"}
                </span>
              </button>

              <button
                onClick={onCancel}
                disabled={confirmed}
                className="flex-1 glass-button p-3"
                style={{
                  backgroundColor: "var(--pixel-gray)",
                  opacity: confirmed ? 0.5 : 1,
                }}
              >
                <span className="pixel-text pixel-text-sm">MAYBE LATER</span>
              </button>
            </div>

            {/* Rarity indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-3 -right-3"
            >
              <div
                className="pixel-badge"
                style={{
                  backgroundColor: getRarityColor(transformation.rarity),
                  boxShadow: `0 0 20px ${getRarityColor(transformation.rarity)}`,
                }}
              >
                <span className="pixel-text" style={{ fontSize: "8px" }}>
                  {transformation.rarity.toUpperCase()}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Transformation effect animation */}
          {confirmed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: [0, 1.5, 2],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${getRarityColor(transformation.rarity)} 0%, transparent 70%)`,
                filter: "blur(20px)",
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

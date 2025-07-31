import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChainReaction } from "@game/mechanics/SynergyChainSystem";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/simpleAudio";

interface ChainReactionVisualizerProps {
  chain: ChainReaction | null;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

const rarityColors = {
  common: { bg: "#4A5568", glow: "#718096", spark: "#A0AEC0" },
  uncommon: { bg: "#22543D", glow: "#38A169", spark: "#68D391" },
  rare: { bg: "#2C5282", glow: "#3182CE", spark: "#63B3ED" },
  legendary: { bg: "#744210", glow: "#D69E2E", spark: "#F6E05E" },
};

export const ChainReactionVisualizer: React.FC<
  ChainReactionVisualizerProps
> = ({ chain, onComplete }) => {
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const [showMultiplier, setShowMultiplier] = useState(false);

  const animateChain = useCallback(async () => {
    if (!chain) return;

    // Initial burst
    haptics.heavy();
    audio.play("achievement");

    // Animate each link in sequence
    for (let i = 0; i < chain.links.length; i++) {
      setCurrentLinkIndex(i);

      // Haptic feedback intensity based on chain depth
      if (i === 0) {
        haptics.medium();
      } else if (i < 3) {
        haptics.heavy();
      } else {
        // Double haptic for deep chains
        haptics.heavy();
        setTimeout(() => haptics.heavy(), 100);
      }

      // Audio feedback
      audio.play("success");

      // Wait for link animation
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Show final multiplier
    setShowMultiplier(true);
    haptics.heavy();
    audio.play("achievement");

    // Complete after showing multiplier
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  }, [chain, onComplete]);

  useEffect(() => {
    if (!chain) return;

    // Reset state
    setCurrentLinkIndex(0);
    setShowMultiplier(false);

    // Start the chain animation
    animateChain();
  }, [chain, animateChain]);

  if (!chain) return null;

  // Default rarity for chain reactions
  const isInterrupted = chain.interrupted;
  const finalMultiplier = chain.totalMultiplier;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dark overlay */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        />

        {/* Chain visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Connection lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ width: "800px", height: "400px" }}
            >
              {chain.links.slice(0, currentLinkIndex).map((link, i) => {
                if (i === 0) return null;
                const startX = 150 + (i - 1) * 150;
                const endX = 150 + i * 150;
                const y = 200;

                return (
                  <motion.line
                    key={i}
                    x1={startX}
                    y1={y}
                    x2={endX}
                    y2={y}
                    stroke={
                      isInterrupted && i >= chain.links.length - 1
                        ? "#FF0000"
                        : "#FFD700"
                    }
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    filter="url(#glow)"
                  />
                );
              })}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            {/* Chain links */}
            <div
              className="relative flex items-center gap-8"
              style={{ minWidth: "800px" }}
            >
              {chain.links.map((link, index) => {
                const isActive = index <= currentLinkIndex;
                const colors = rarityColors[link.synergy.rarity];

                return (
                  <motion.div
                    key={link.synergy.id}
                    className="relative"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={
                      isActive
                        ? {
                            scale: [0, 1.2, 1],
                            opacity: 1,
                          }
                        : {}
                    }
                    transition={{ delay: index * 0.3, duration: 0.5 }}
                  >
                    {/* Lightning effect for active link */}
                    {isActive && index === currentLinkIndex && (
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [1, 0],
                        }}
                        transition={{ duration: 0.8 }}
                      >
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-full h-full"
                            style={{
                              background: `linear-gradient(${i * 45}deg, transparent 40%, ${colors.spark} 50%, transparent 60%)`,
                            }}
                            animate={{
                              rotate: i * 45,
                              scale: [1, 3],
                              opacity: [1, 0],
                            }}
                            transition={{ duration: 0.8 }}
                          />
                        ))}
                      </motion.div>
                    )}

                    {/* Synergy card */}
                    <motion.div
                      className="glass-panel p-4 border-2"
                      style={{
                        borderColor: colors.glow,
                        backgroundColor: colors.bg,
                        minWidth: "120px",
                        boxShadow: isActive
                          ? `
                          0 0 30px ${colors.glow},
                          0 0 60px ${colors.glow}33,
                          inset 0 0 20px ${colors.glow}33
                        `
                          : "none",
                      }}
                      whileHover={isActive ? { scale: 1.05 } : {}}
                    >
                      {/* Icon */}
                      <motion.div
                        className="text-center mb-2"
                        animate={
                          isActive
                            ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 360],
                              }
                            : {}
                        }
                        transition={{
                          duration: 2,
                          repeat: isActive ? Infinity : 0,
                          ease: "linear",
                        }}
                      >
                        <span
                          className="text-3xl"
                          style={{
                            filter: isActive
                              ? `drop-shadow(0 0 20px ${colors.glow})`
                              : "none",
                          }}
                        >
                          {link.synergy.icon}
                        </span>
                      </motion.div>

                      {/* Name */}
                      <h4
                        className="pixel-text pixel-text-xs text-center mb-1"
                        style={{ color: isActive ? colors.glow : "#666" }}
                      >
                        {link.synergy.name}
                      </h4>

                      {/* Multiplier */}
                      {isActive && (
                        <motion.div
                          className="text-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span
                            className="pixel-text pixel-text-xs"
                            style={{ color: "#FFD700" }}
                          >
                            ×{link.multiplier.toFixed(1)}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Chain arrow */}
                    {index < chain.links.length - 1 && isActive && (
                      <motion.div
                        className="absolute -right-4 top-1/2 transform -translate-y-1/2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <span className="text-2xl" style={{ color: "#FFD700" }}>
                          →
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Final multiplier display */}
            <AnimatePresence>
              {showMultiplier && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="glass-panel p-8 border-4"
                    style={{
                      borderColor: isInterrupted ? "#FF0000" : "#FFD700",
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      boxShadow: `0 0 50px ${isInterrupted ? "#FF0000" : "#FFD700"}`,
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                      scale: [0, 1.5, 1.2],
                      rotate: 0,
                    }}
                    transition={{ duration: 0.8, type: "spring" }}
                  >
                    {isInterrupted ? (
                      <>
                        <h2
                          className="punk-headline text-4xl text-center mb-2"
                          style={{ color: "#FF0000" }}
                        >
                          CHAIN BROKEN!
                        </h2>
                        <p
                          className="pixel-text pixel-text-sm text-center"
                          style={{ color: "#FF6666" }}
                        >
                          {chain.interruptedBy}
                        </p>
                      </>
                    ) : (
                      <>
                        <h2
                          className="punk-headline text-5xl text-center mb-2"
                          style={{ color: "#FFD700" }}
                        >
                          ×{finalMultiplier.toFixed(1)}
                        </h2>
                        <p
                          className="pixel-text pixel-text-sm text-center"
                          style={{ color: "#FFA500" }}
                        >
                          CHAIN REACTION!
                        </p>

                        {/* Particle explosion for big multipliers */}
                        {finalMultiplier >= 3 && (
                          <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                  left: "50%",
                                  top: "50%",
                                  backgroundColor: "#FFD700",
                                }}
                                initial={{
                                  x: 0,
                                  y: 0,
                                  scale: 0,
                                }}
                                animate={{
                                  x: Math.cos((i * Math.PI) / 10) * 200,
                                  y: Math.sin((i * Math.PI) / 10) * 200,
                                  scale: [0, 2, 0],
                                  opacity: [1, 1, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  ease: "easeOut",
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

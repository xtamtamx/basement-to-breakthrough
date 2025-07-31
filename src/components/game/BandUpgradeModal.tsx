import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Band } from "@game/types";
import { synergySystemV2, BandUpgrade } from "@game/mechanics/SynergySystemV2";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface BandUpgradeModalProps {
  band: Band;
  isOpen: boolean;
  onClose: () => void;
}

export const BandUpgradeModal: React.FC<BandUpgradeModalProps> = ({
  band,
  isOpen,
  onClose,
}) => {
  const { money, reputation } = useGameStore();
  const [selectedUpgrade, setSelectedUpgrade] = useState<BandUpgrade | null>(
    null,
  );
  const upgrades = synergySystemV2.getBandUpgrades(band.id);

  const canAffordUpgrade = (upgrade: BandUpgrade): boolean => {
    if (upgrade.cost > money) return false;

    for (const req of upgrade.requirements) {
      switch (req.type) {
        case "money":
          if (money < (req.value as number)) return false;
          break;
        case "reputation":
          if (reputation < (req.value as number)) return false;
          break;
        // Add more requirement checks as needed
      }
    }

    return true;
  };

  const handlePurchaseUpgrade = (upgrade: BandUpgrade) => {
    if (canAffordUpgrade(upgrade)) {
      useGameStore.getState().addMoney(-upgrade.cost);
      // Apply upgrade effects to band
      haptics.success();
      setSelectedUpgrade(upgrade);

      // Show success animation
      setTimeout(() => {
        setSelectedUpgrade(null);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: "#111",
            border: "2px solid #ec4899",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", color: "#ec4899" }}>
                Upgrade {band.name}
              </h2>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "14px" }}>
                Enhance your band's abilities
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* Current Stats */}
          <div
            style={{
              backgroundColor: "#1f2937",
              padding: "16px",
              borderRadius: "4px",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ margin: "0 0 12px", color: "#fff", fontSize: "16px" }}>
              Current Stats
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  Popularity
                </span>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {band.popularity}
                </div>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  Authenticity
                </span>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {band.authenticity}
                </div>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  Energy
                </span>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {band.energy}
                </div>
              </div>
              <div>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  Technical Skill
                </span>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {band.technicalSkill}
                </div>
              </div>
            </div>
          </div>

          {/* Available Upgrades */}
          <h3 style={{ margin: "0 0 16px", color: "#fff" }}>
            Available Upgrades
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {upgrades.length > 0 ? (
              upgrades.map((upgrade) => (
                <motion.div
                  key={upgrade.id}
                  style={{
                    backgroundColor: "#1f2937",
                    border:
                      "2px solid " +
                      (canAffordUpgrade(upgrade) ? "#374151" : "#1f2937"),
                    borderRadius: "4px",
                    padding: "16px",
                    cursor: canAffordUpgrade(upgrade)
                      ? "pointer"
                      : "not-allowed",
                    opacity: canAffordUpgrade(upgrade) ? 1 : 0.5,
                  }}
                  whileHover={
                    canAffordUpgrade(upgrade)
                      ? { scale: 1.02, borderColor: "#ec4899" }
                      : {}
                  }
                  whileTap={canAffordUpgrade(upgrade) ? { scale: 0.98 } : {}}
                  onClick={() =>
                    canAffordUpgrade(upgrade) && handlePurchaseUpgrade(upgrade)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>{upgrade.icon}</span>
                        <h4 style={{ margin: 0, color: "#fff" }}>
                          {upgrade.name}
                        </h4>
                      </div>
                      <p
                        style={{
                          margin: "0 0 12px",
                          color: "#d1d5db",
                          fontSize: "14px",
                        }}
                      >
                        {upgrade.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          fontSize: "12px",
                        }}
                      >
                        {upgrade.effects.map((effect, index) => (
                          <div key={index} style={{ color: "#10b981" }}>
                            {effect.type === "stat_boost" &&
                              `+${effect.value} ${effect.target}`}
                            {effect.type === "new_trait" &&
                              `New Trait: ${effect.value}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          color: "#10b981",
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        ${upgrade.cost}
                      </div>
                      {upgrade.requirements.map((req, index) => (
                        <div
                          key={index}
                          style={{ fontSize: "12px", color: "#9ca3af" }}
                        >
                          {req.type}: {req.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  padding: "32px",
                }}
              >
                No upgrades available for this band yet. Play more shows to
                unlock upgrades!
              </div>
            )}
          </div>

          {/* Success Animation */}
          <AnimatePresence>
            {selectedUpgrade && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    style={{ fontSize: "64px", marginBottom: "16px" }}
                  >
                    ✨
                  </motion.div>
                  <h3 style={{ color: "#10b981", margin: "0 0 8px" }}>
                    Upgrade Purchased!
                  </h3>
                  <p style={{ color: "#d1d5db" }}>
                    {selectedUpgrade.name} applied to {band.name}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

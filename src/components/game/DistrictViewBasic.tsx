import React from "react";
import { motion } from "framer-motion";
import { DistrictInfo } from "@/game/generation/CityGenerator";

interface DistrictViewBasicProps {
  districtId: string;
  districtInfo?: DistrictInfo;
}

// Token aliases (BandsView convention) so this reads in the canonical language.
const C = {
  void: "var(--snes-void)",
  ink: "var(--snes-ink)",
  dim: "var(--snes-ink-dim)",
  mute: "var(--snes-ink-mute)",
  magenta: "var(--snes-magenta)",
  cyan: "var(--snes-cyan)",
  gold: "var(--snes-gold)",
  green: "var(--snes-green)",
};
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

/**
 * District detail card — a clean, on-brand read of the ONE district you tapped.
 * (Rebuilt 2026-07-01: the old version was raw Tailwind grays with hardcoded fake
 * data — '0' venues, '3' jobs, generic district types that don't match the demo.
 * districtInfo actually arrives with cells:[]/neighbors:[] too, so size/connections
 * were always 0. Now it shows only the real, reliable fields.)
 */
export const DistrictViewBasic: React.FC<DistrictViewBasicProps> = ({
  districtInfo,
}) => {
  const name = districtInfo?.name || "District";
  const scene = Math.max(0, Math.min(100, Math.round(districtInfo?.sceneStrength ?? 0)));
  const rent = districtInfo?.rentMultiplier ?? 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: C.void,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="snes-panel"
        style={{ width: "100%", maxWidth: "540px", padding: "20px", borderColor: C.magenta }}
      >
        <h2
          className="snes-pixel"
          style={{ fontSize: "14px", color: C.magenta, margin: 0, letterSpacing: 0, textShadow: `2px 2px 0 ${C.void}` }}
        >
          {name}
        </h2>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: C.dim, margin: "8px 0 16px", lineHeight: 1.5 }}>
          The scene here is only as loud as you make it. Book the rooms, work the block, and watch this corner of the Island grow.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          <div className="snes-panel-inset" style={{ flex: 1, padding: "12px" }}>
            <div className="snes-pixel" style={{ fontSize: "9px", color: C.mute, letterSpacing: 0, marginBottom: "8px" }}>
              SCENE STRENGTH
            </div>
            <div className="snes-progress" style={{ height: "10px", marginBottom: "6px" }}>
              <div className="snes-progress__fill" style={{ width: `${scene}%`, background: C.cyan }} />
            </div>
            <div className="snes-pixel" style={{ fontSize: "12px", color: C.cyan, letterSpacing: 0 }}>{scene}%</div>
          </div>

          <div className="snes-panel-inset" style={{ flex: 1, padding: "12px" }}>
            <div className="snes-pixel" style={{ fontSize: "9px", color: C.mute, letterSpacing: 0, marginBottom: "8px" }}>
              RENT
            </div>
            <div className="snes-pixel" style={{ fontSize: "18px", color: rent > 1 ? C.gold : C.green, letterSpacing: 0 }}>
              {rent}×
            </div>
            <div style={{ fontFamily: SANS, fontSize: "11px", color: C.dim, marginTop: "4px" }}>
              {rent > 1 ? "pricier rooms" : "affordable rooms"}
            </div>
          </div>
        </div>

        <p style={{ fontFamily: SANS, fontSize: "12px", color: C.mute, margin: "16px 0 0", lineHeight: 1.5 }}>
          Tap <span style={{ color: C.dim }}>Back</span> to the map, then tap a venue to book a show — or a shop to pick up work.
        </p>
      </motion.div>
    </div>
  );
};

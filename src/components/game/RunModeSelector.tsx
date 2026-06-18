import React from "react";
import { runManager, RunConfig } from "@game/mechanics/RunManager";
import { BASE_ROSTER_SLOTS } from "@game/constants/runConstants";
import { haptics } from "@utils/mobile";
import { X, DollarSign, Clock, Users, Trophy } from "lucide-react";

interface RunModeSelectorProps {
  onSelect: (config: RunConfig) => void;
  onClose: () => void;
}

const MODE_ICON: Record<string, string> = {
  classic: "🎸",
  speed: "⚡",
  hardcore: "💀",
  festival: "🎪",
};

const MODE_ACCENT: Record<string, string> = {
  classic: "#f72585",
  speed: "#4cc9f0",
  hardcore: "#ff5c57",
  festival: "#ffd23f",
};

/** Total roster slots a mode opens with (base + its slot-delta modifiers). */
const rosterSlotsFor = (config: RunConfig): number =>
  BASE_ROSTER_SLOTS +
  config.modifiers.reduce((sum, m) => sum + (m.effects.rosterSlotDelta ?? 0), 0);

/** Short "what bends in this mode" chips, derived from the run modifiers. */
const perkChips = (config: RunConfig): { label: string; good: boolean }[] => {
  const chips: { label: string; good: boolean }[] = [];
  config.modifiers.forEach((m) => {
    const e = m.effects;
    if (e.reputationMultiplier && e.reputationMultiplier !== 1)
      chips.push({ label: `${e.reputationMultiplier}× rep`, good: e.reputationMultiplier > 1 });
    if (e.fansMultiplier && e.fansMultiplier !== 1)
      chips.push({ label: `${e.fansMultiplier}× fans`, good: e.fansMultiplier > 1 });
    if (e.stressMultiplier && e.stressMultiplier !== 1)
      chips.push({ label: `${e.stressMultiplier}× stress`, good: e.stressMultiplier < 1 });
    if (e.venueRentMultiplier && e.venueRentMultiplier !== 1)
      chips.push({ label: `${e.venueRentMultiplier}× rent`, good: e.venueRentMultiplier < 1 });
    if (e.startingBandQuality && e.startingBandQuality < 0)
      chips.push({ label: "weaker bands", good: false });
  });
  return chips;
};

export const RunModeSelector: React.FC<RunModeSelectorProps> = ({ onSelect, onClose }) => {
  const configs = runManager.getRunConfigs();

  const pick = (config: RunConfig) => {
    haptics.success();
    onSelect(config);
  };

  return (
    <div className="snes-modal" onClick={onClose}>
      <div
        className="snes-modal__sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
          <div>
            <h2 className="snes-pixel" style={{ fontSize: "13px", color: "#f72585", margin: "0 0 4px", letterSpacing: 0, textShadow: "2px 2px 0 #0a0814" }}>
              Pick Your Run
            </h2>
            <p style={{ fontSize: "11px", color: "#b9b3d6", margin: 0 }}>
              Each mode plays differently — money, length, and band slots all shift.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Back"
            style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1f1a3a", color: "#b9b3d6", border: "2px solid #0a0814", boxShadow: "inset 1px 1px 0 #3a2f5c", cursor: "pointer", borderRadius: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
          {configs.map((config) => {
            const accent = MODE_ACCENT[config.id] ?? "#f72585";
            const slots = rosterSlotsFor(config);
            const perks = perkChips(config);
            return (
              <button
                key={config.id}
                onClick={() => pick(config)}
                className="snes-panel"
                style={{
                  textAlign: "left",
                  padding: "12px",
                  cursor: "pointer",
                  border: `2px solid ${accent}`,
                  boxShadow: `inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px ${accent}`,
                  borderRadius: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>{MODE_ICON[config.id] ?? "🎸"}</span>
                  <h3 className="snes-pixel" style={{ fontSize: "11px", color: "#ffffff", margin: 0, letterSpacing: 0 }}>{config.name}</h3>
                </div>
                <p style={{ fontSize: "12px", color: "#b9b3d6", margin: "0 0 8px", lineHeight: 1.4, fontStyle: "italic" }}>{config.description}</p>

                {/* Key stats */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: perks.length ? "6px" : 0 }}>
                  <span className="snes-chip" style={{ fontSize: "8px", color: "#3ad17e" }}>
                    <DollarSign size={11} />{config.startingMoney}
                  </span>
                  <span className="snes-chip" style={{ fontSize: "8px", color: "#b9b3d6" }}>
                    <Clock size={11} />{config.maxTurns} turns
                  </span>
                  <span className="snes-chip" style={{ fontSize: "8px", color: accent, borderColor: accent }}>
                    <Users size={11} />{slots} slots
                  </span>
                </div>

                {/* Modifier perks */}
                {perks.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {perks.map((p, i) => (
                      <span key={i} className="snes-pixel" style={{ fontSize: "7px", letterSpacing: 0, color: p.good ? "#3ad17e" : "#ff5c57", backgroundColor: "#0f0b1e", border: `2px solid ${p.good ? "#3ad17e" : "#ff5c57"}`, padding: "3px 6px" }}>
                        {p.good ? "▲" : "▼"} {p.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Win conditions */}
                <div style={{ display: "flex", alignItems: "start", gap: "6px", fontSize: "11px", color: "#6f6796" }}>
                  <Trophy size={12} color="#ffd23f" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ lineHeight: 1.4 }}>{config.winConditions.map((w) => w.description).join(" + ")}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

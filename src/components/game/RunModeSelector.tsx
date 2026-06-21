import React, { useState } from "react";
import { runManager, RunConfig } from "@game/mechanics/RunManager";
import { stakesManager, STAKE_TIERS } from "@game/mechanics/StakesManager";
import { BASE_ROSTER_SLOTS } from "@game/constants/runConstants";
import { haptics } from "@utils/mobile";
import { X, DollarSign, Clock, Users, Trophy, Lock, Flame } from "lucide-react";

interface RunModeSelectorProps {
  onSelect: (config: RunConfig, stakeTier: number) => void;
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

/** What the chosen stake makes harder, as red "▼" chips (Open Mic = none). */
const stakeChips = (tier: number): string[] => {
  const s = STAKE_TIERS[tier];
  if (!s || s.tier === 0) return [];
  const chips: string[] = [];
  if (s.rentMult !== 1) chips.push(`${s.rentMult}× rent`);
  if (s.gainMult !== 1) chips.push(`${s.gainMult}× gains`);
  if (s.incidentMult !== 1) chips.push(`${s.incidentMult}× chaos`);
  if (s.turnMult !== 1) chips.push(`−${Math.round((1 - s.turnMult) * 100)}% turns`);
  return chips;
};

export const RunModeSelector: React.FC<RunModeSelectorProps> = ({ onSelect, onClose }) => {
  const configs = runManager.getRunConfigs();
  // Selected stake tier per mode (defaults to Open Mic so newcomers aren't walled).
  const [tiers, setTiers] = useState<Record<string, number>>({});

  const pick = (config: RunConfig, tier: number) => {
    haptics.success();
    onSelect(config, tier);
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
              Choose a mode and a stake. Win a stake to unlock the next, harder one.
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
            const tier = tiers[config.id] ?? 0;
            const stake = STAKE_TIERS[tier];
            const effTurns = Math.max(5, Math.round(config.maxTurns * stake.turnMult));
            const harder = stakeChips(tier);
            return (
              <div
                key={config.id}
                className="snes-panel"
                style={{
                  textAlign: "left",
                  padding: "12px",
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

                {/* Key stats (turns reflect the chosen stake) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: perks.length ? "6px" : "8px" }}>
                  <span className="snes-chip" style={{ fontSize: "8px", color: "#3ad17e" }}>
                    <DollarSign size={11} />{config.startingMoney}
                  </span>
                  <span className="snes-chip" style={{ fontSize: "8px", color: "#b9b3d6" }}>
                    <Clock size={11} />{effTurns} turns
                  </span>
                  <span className="snes-chip" style={{ fontSize: "8px", color: accent, borderColor: accent }}>
                    <Users size={11} />{slots} slots
                  </span>
                </div>

                {/* Mode perks */}
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
                <div style={{ display: "flex", alignItems: "start", gap: "6px", fontSize: "11px", color: "#6f6796", marginBottom: "10px" }}>
                  <Trophy size={12} color="#ffd23f" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ lineHeight: 1.4 }}>{config.winConditions.map((w) => w.description).join(" + ")}</span>
                </div>

                {/* Stake selector */}
                <div style={{ borderTop: "2px solid #2a2350", paddingTop: "10px" }}>
                  <div className="snes-pixel" style={{ fontSize: "7px", color: "#c77dff", letterSpacing: 0, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Flame size={11} color="#c77dff" /> STAKE
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "6px" }}>
                    {STAKE_TIERS.map((s) => {
                      const unlocked = stakesManager.isUnlocked(config.id, s.tier);
                      const selected = s.tier === tier;
                      return (
                        <button
                          key={s.tier}
                          disabled={!unlocked}
                          onClick={() => { setTiers((t) => ({ ...t, [config.id]: s.tier })); haptics.light(); }}
                          className="snes-pixel"
                          style={{
                            fontSize: "7px",
                            letterSpacing: 0,
                            padding: "4px 7px",
                            minHeight: "28px",
                            cursor: unlocked ? "pointer" : "not-allowed",
                            color: selected ? "#0a0814" : unlocked ? "#c77dff" : "#4b4470",
                            backgroundColor: selected ? "#c77dff" : "#0f0b1e",
                            border: `2px solid ${selected ? "#c77dff" : unlocked ? "#3a2f5c" : "#241f3d"}`,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          {!unlocked && <Lock size={9} />}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "11px", color: "#6f6796", margin: "0 0 8px", lineHeight: 1.4 }}>{stake.blurb}</p>
                  {harder.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                      {harder.map((h, i) => (
                        <span key={i} className="snes-pixel" style={{ fontSize: "7px", letterSpacing: 0, color: "#ff5c57", backgroundColor: "#0f0b1e", border: "2px solid #ff5c57", padding: "3px 6px" }}>
                          ▼ {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => pick(config, tier)}
                    className="snes-btn snes-pixel"
                    style={{ width: "100%", minHeight: "44px", fontSize: "9px", cursor: "pointer", color: "#ffffff", backgroundColor: accent, borderColor: accent }}
                  >
                    ▶ Play — {stake.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

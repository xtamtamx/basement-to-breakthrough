import React, { useState } from "react";
import { runManager, RunConfig } from "@game/mechanics/RunManager";
import { stakesManager, STAKE_TIERS } from "@game/mechanics/StakesManager";
import { isModeUnlocked, modeUnlockRequiresId, modeOrderIndex } from "@game/mechanics/modeUnlocks";
import { TOURING_ENABLED } from "@/config/featureFlags";
import { BASE_ROSTER_SLOTS } from "@game/constants/runConstants";
import { haptics } from "@utils/mobile";
import { DollarSign, Clock, Users } from "lucide-react";
import { PixelIcon } from "@components/ui/PixelIcon";
import { SnesModal } from "@components/ui/SnesModal";

interface RunModeSelectorProps {
  onSelect: (config: RunConfig, stakeTier: number) => void;
  onClose: () => void;
}

const MODE_ICON: Record<string, string> = {
  classic: "guitar",
  speed: "energy",
  hardcore: "skull",
  festival: "building",
};

const MODE_ACCENT: Record<string, string> = {
  classic: "var(--snes-magenta)",
  speed: "var(--snes-cyan)",
  hardcore: "var(--snes-red)",
  festival: "var(--snes-gold)",
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
  // Lay modes out in progression order; locked modes are gated behind wins.
  // The single-city demo holds Hardcore for the full game (it's tuned around travel).
  const configs = [...runManager.getRunConfigs()]
    .filter((c) => TOURING_ENABLED || c.id !== "hardcore")
    .sort((a, b) => modeOrderIndex(a.id) - modeOrderIndex(b.id));
  const nameById = Object.fromEntries(configs.map((c) => [c.id, c.name]));
  // Selected stake tier per mode (defaults to Open Mic so newcomers aren't walled).
  const [tiers, setTiers] = useState<Record<string, number>>({});

  const pick = (config: RunConfig, tier: number) => {
    haptics.success();
    onSelect(config, tier);
  };

  return (
    <SnesModal title="Pick Your Run" ariaLabel="Choose a run mode" maxWidth={480} onClose={onClose}>
      <p style={{ fontSize: "11px", color: "var(--snes-ink-dim)", margin: 0 }}>
        Win a run to unlock the next mode. Win a stake to unlock the next, harder one.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
          {configs.map((config) => {
            const accent = MODE_ACCENT[config.id] ?? "var(--snes-magenta)";

            // Locked mode — gated behind beating the previous mode in the ladder.
            if (!isModeUnlocked(config.id)) {
              const reqId = modeUnlockRequiresId(config.id);
              const reqName = reqId ? (nameById[reqId] ?? reqId) : "a run";
              return (
                <div
                  key={config.id}
                  className="snes-panel"
                  aria-label={`${config.name}, locked. Win ${reqName} to unlock.`}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    border: "2px solid var(--snes-line)",
                    boxShadow: "inset 2px 2px 0 0 var(--snes-line), inset -2px -2px 0 0 var(--snes-void)",
                    borderRadius: 0,
                    opacity: 0.85,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ lineHeight: 1, opacity: 0.5, color: "var(--snes-ink-mute)", display: "flex" }}><PixelIcon name={MODE_ICON[config.id] ?? "guitar"} size={18} /></span>
                    <h3 className="snes-pixel" style={{ fontSize: "11px", color: "var(--snes-ink-mute)", margin: 0, letterSpacing: 0, flex: 1 }}>{config.name}</h3>
                    <PixelIcon name="lock" size={14} color="var(--snes-ink-mute)" />
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--snes-ink-mute)", margin: "0 0 8px", lineHeight: 1.4, fontStyle: "italic" }}>{config.description}</p>
                  <div className="snes-pixel" style={{ fontSize: "11px", letterSpacing: 0, color: "var(--snes-gold)", backgroundColor: "var(--snes-bg-2)", border: "2px solid var(--snes-edge-lt)", padding: "7px 8px", display: "flex", alignItems: "center", gap: "6px", lineHeight: 1.5 }}>
                    <PixelIcon name="lock" size={12} color="var(--snes-gold)" style={{ flexShrink: 0 }} />
                    Win {reqName} to unlock this mode
                  </div>
                </div>
              );
            }

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
                  boxShadow: `inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void), 0 0 0 1px ${accent}`,
                  borderRadius: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ lineHeight: 1, color: accent, display: "flex" }}><PixelIcon name={MODE_ICON[config.id] ?? "guitar"} size={18} /></span>
                  <h3 className="snes-pixel" style={{ fontSize: "11px", color: "var(--snes-ink)", margin: 0, letterSpacing: 0 }}>{config.name}</h3>
                </div>
                <p style={{ fontSize: "12px", color: "var(--snes-ink-dim)", margin: "0 0 8px", lineHeight: 1.4, fontStyle: "italic" }}>{config.description}</p>

                {/* Key stats (turns reflect the chosen stake) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: perks.length ? "6px" : "8px" }}>
                  <span className="snes-chip" style={{ fontSize: "10px", color: "var(--snes-green)" }}>
                    <DollarSign size={11} />{config.startingMoney}
                  </span>
                  <span className="snes-chip" style={{ fontSize: "10px", color: "var(--snes-ink-dim)" }}>
                    <Clock size={11} />{effTurns} turns
                  </span>
                  <span className="snes-chip" style={{ fontSize: "10px", color: accent, borderColor: accent }}>
                    <Users size={11} />{slots} slots
                  </span>
                </div>

                {/* Mode perks */}
                {perks.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {perks.map((p, i) => (
                      <span key={i} className="snes-chip" style={{ fontSize: "10px", color: p.good ? "var(--snes-green)" : "var(--snes-red)", borderColor: p.good ? "var(--snes-green)" : "var(--snes-red)" }}>
                        {p.good ? "▲" : "▼"} {p.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Win conditions */}
                <div style={{ display: "flex", alignItems: "start", gap: "6px", fontSize: "11px", color: "var(--snes-ink-dim)", marginBottom: "10px" }}>
                  <PixelIcon name="trophy" size={12} color="var(--snes-gold)" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ lineHeight: 1.4 }}>{config.winConditions.map((w) => w.description).join(" + ")}</span>
                </div>

                {/* Stake selector */}
                <div style={{ borderTop: "2px solid var(--snes-line)", paddingTop: "10px" }}>
                  <div className="snes-pixel" style={{ fontSize: "9px", color: "var(--snes-purple)", letterSpacing: 0, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <PixelIcon name="fire" size={11} color="var(--snes-purple)" /> STAKE
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                    {STAKE_TIERS.map((s) => {
                      const unlocked = stakesManager.isUnlocked(config.id, s.tier);
                      const selected = s.tier === tier;
                      return (
                        <button
                          key={s.tier}
                          disabled={!unlocked}
                          onClick={() => { setTiers((t) => ({ ...t, [config.id]: s.tier })); haptics.light(); }}
                          title={unlocked ? s.blurb : `${s.name} — locked. Win the previous stake on this mode to unlock it.`}
                          aria-label={unlocked ? s.name : `${s.name}, locked. Win the previous stake to unlock.`}
                          className="snes-pixel"
                          style={{
                            fontSize: "11px",
                            letterSpacing: 0,
                            padding: "6px 10px",
                            minHeight: "44px",
                            cursor: unlocked ? "pointer" : "not-allowed",
                            color: selected ? "#f7efe0" : unlocked ? "var(--snes-purple)" : "#4b4470",
                            backgroundColor: selected ? "var(--snes-purple)" : "var(--snes-bg-2)",
                            border: `2px solid ${selected ? "var(--snes-purple)" : unlocked ? "var(--snes-edge-lt)" : "var(--snes-line)"}`,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          {!unlocked && <PixelIcon name="lock" size={10} />}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--snes-ink-mute)", margin: "0 0 8px", lineHeight: 1.4 }}>{stake.blurb}</p>
                  {harder.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                      {harder.map((h, i) => (
                        <span key={i} className="snes-chip" style={{ fontSize: "10px", color: "var(--snes-red)", borderColor: "var(--snes-red)" }}>
                          ▼ {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => pick(config, tier)}
                    className="snes-btn snes-pixel"
                    style={{ width: "100%", minHeight: "44px", fontSize: "11px", cursor: "pointer", color: "#f7efe0", backgroundColor: accent, borderColor: accent, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <PixelIcon name="play" size={12} /> Play — {stake.name}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </SnesModal>
  );
};

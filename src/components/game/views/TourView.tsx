import React, { useState } from "react";
import { useGameStore } from "@stores/gameStore";
import { isCityUnlocked, unlockRequirement } from "@game/world/cityUnlocks";
import { rollTravelOffer, TravelOffer, TravelEffects } from "@game/world/travelModes";
import { haptics } from "@utils/mobile";
import { City } from "@game/types";
import { Lock, MapPin, X, RefreshCw, Check } from "lucide-react";

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression" | "tour";

interface TourViewProps {
  onNavigate?: (view: ViewType) => void;
}

const ALIGN_ACCENT: Record<TravelOffer["alignment"], string> = {
  diy: "#3ad17e",
  balanced: "#4cc9f0",
  sellout: "#f72585",
};

// One effect → a coloured pixel chip ("+$60", "+14 stress", "-6 cred"…).
const effectChips = (e: TravelEffects) => {
  const chips: { label: string; color: string }[] = [];
  if (e.money) chips.push({ label: `${e.money > 0 ? "+" : "-"}$${Math.abs(e.money)}`, color: e.money > 0 ? "#3ad17e" : "#ff5c57" });
  if (e.stress) chips.push({ label: `${e.stress > 0 ? "+" : ""}${e.stress} stress`, color: e.stress > 0 ? "#ffd23f" : "#3ad17e" });
  if (e.fans) chips.push({ label: `${e.fans > 0 ? "+" : ""}${e.fans} fans`, color: e.fans > 0 ? "#c77dff" : "#ff5c57" });
  if (e.diyPoints) chips.push({ label: `${e.diyPoints > 0 ? "+" : ""}${e.diyPoints} cred`, color: e.diyPoints > 0 ? "#3ad17e" : "#ff5c57" });
  return chips;
};

export const TourView: React.FC<TourViewProps> = ({ onNavigate }) => {
  const cities = useGameStore((s) => s.cities);
  const currentCityId = useGameStore((s) => s.currentCityId);
  const reputation = useGameStore((s) => s.reputation);
  const switchCity = useGameStore((s) => s.switchCity);
  const addMoney = useGameStore((s) => s.addMoney);
  const addStress = useGameStore((s) => s.addStress);
  const addFans = useGameStore((s) => s.addFans);
  const makePathChoice = useGameStore((s) => s.makePathChoice);

  const [dest, setDest] = useState<City | null>(null);
  const [offer, setOffer] = useState<TravelOffer[]>([]);

  const openTravel = (city: City) => {
    setDest(city);
    setOffer(rollTravelOffer({ reputation }));
    haptics.light();
  };

  const reroll = () => {
    setOffer(rollTravelOffer({ reputation }));
    haptics.light();
  };

  const pick = (mode: TravelOffer) => {
    if (!dest) return;
    const e = mode.effects;
    if (e.money) addMoney(e.money);
    if (e.stress) addStress(e.stress);
    if (e.fans) addFans(e.fans);
    if (e.diyPoints) makePathChoice(`travel_${mode.id}`, e.diyPoints);
    switchCity(dest.id);
    haptics.success();
    setDest(null);
    onNavigate?.("city");
  };

  const chip = (label: string, color: string) => (
    <span key={label} className="snes-pixel" style={{ fontSize: "8px", color, backgroundColor: "#0f0b1e", border: `2px solid ${color}`, padding: "3px 6px", letterSpacing: 0 }}>
      {label}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0a0814", overflow: "hidden" }}>
      {/* Header */}
      <div className="snes-bar snes-bar--top" style={{ padding: "10px 14px", paddingTop: "calc(10px + env(safe-area-inset-top))", flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
        <MapPin size={18} color="#f72585" />
        <div style={{ minWidth: 0 }}>
          <h2 className="snes-pixel" style={{ fontSize: "12px", color: "#ffffff", margin: 0, letterSpacing: 0 }}>The Tour</h2>
          <p style={{ fontSize: "11px", color: "#b9b3d6", margin: "3px 0 0" }}>
            Take the scene on the road — book a way to the next town.
          </p>
        </div>
      </div>

      {/* City roster */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", paddingBottom: "calc(88px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: "10px" }}>
        {cities.map((city) => {
          const isCurrent = city.id === currentCityId;
          const unlocked = isCityUnlocked(city);
          const accent = isCurrent ? "#ffd23f" : unlocked ? "#4cc9f0" : "#2a2350";
          return (
            <div key={city.id} className={`snes-panel${isCurrent ? " snes-panel--gold" : unlocked ? " snes-panel--cyan" : ""}`} style={{ padding: "12px", opacity: unlocked || isCurrent ? 1 : 0.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    {!unlocked && <Lock size={12} color="#6f6796" />}
                    <h3 className="snes-pixel" style={{ fontSize: "11px", color: unlocked || isCurrent ? "#ffffff" : "#6f6796", margin: 0, letterSpacing: 0 }}>{city.name}</h3>
                  </div>
                  <p className="snes-pixel" style={{ fontSize: "7px", color: accent, margin: "0 0 6px", letterSpacing: 0, textTransform: "uppercase" }}>{city.vibe}</p>
                  <p style={{ fontSize: "12px", color: "#b9b3d6", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                    {unlocked || isCurrent ? city.blurb : `🔒 ${unlockRequirement(city)} (you: ${reputation})`}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isCurrent ? (
                    <span className="snes-pixel" style={{ fontSize: "7px", color: "#ffd23f", border: "2px solid #ffd23f", padding: "5px 7px", display: "inline-block", textAlign: "center", lineHeight: 1.4 }}>YOU<br />ARE<br />HERE</span>
                  ) : unlocked ? (
                    <button className="snes-btn snes-btn--cyan snes-btn--sm" onClick={() => openTravel(city)} style={{ minHeight: "44px" }}>Travel</button>
                  ) : (
                    <Lock size={20} color="#6f6796" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Travel-mode choice modal */}
      {dest && (
        <div className="snes-modal" onClick={() => setDest(null)}>
          <div className="snes-modal__sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "36px", height: "3px", backgroundColor: "#374151", borderRadius: "2px", margin: "0 auto 12px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
              <div>
                <h2 className="snes-pixel" style={{ fontSize: "12px", color: "#ffffff", margin: "0 0 4px", letterSpacing: 0 }}>Get to {dest.name}</h2>
                <p style={{ fontSize: "11px", color: "#b9b3d6", margin: 0 }}>How you travel says who you are.</p>
              </div>
              <button onClick={() => setDest(null)} aria-label="Cancel" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#1f1a3a", color: "#b9b3d6", border: "2px solid #0a0814", boxShadow: "inset 1px 1px 0 #3a2f5c", cursor: "pointer", borderRadius: 0 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "12px 0" }}>
              {offer.map((mode) => {
                const ac = ALIGN_ACCENT[mode.alignment];
                return (
                  <div key={mode.id} className="snes-panel-inset" style={{ padding: "12px", border: `2px solid ${ac}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "20px", lineHeight: 1 }}>{mode.icon}</span>
                      <h3 className="snes-pixel" style={{ fontSize: "10px", color: "#ffffff", margin: 0, letterSpacing: 0 }}>{mode.name}</h3>
                    </div>
                    <p style={{ fontSize: "12px", color: "#b9b3d6", margin: "0 0 8px", lineHeight: 1.4, fontStyle: "italic" }}>{mode.tagline}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      {effectChips(mode.effects).map((c) => chip(c.label, c.color))}
                    </div>
                    <button className="snes-btn snes-btn--sm" style={{ width: "100%", minHeight: "40px", background: ac, color: "#0a0814" }} onClick={() => pick(mode)}>
                      <Check size={14} /> Take it
                    </button>
                  </div>
                );
              })}
            </div>

            <button className="snes-btn snes-btn--ghost snes-btn--sm" style={{ width: "100%", minHeight: "40px" }} onClick={reroll}>
              <RefreshCw size={14} /> Re-roll the options
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

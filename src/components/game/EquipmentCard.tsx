import React from "react";
import {
  Equipment,
  EquipmentType,
  EquipmentRarity,
} from "@game/types/equipment";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";

interface EquipmentCardProps {
  equipment: Equipment;
  owned?: boolean;
  canAfford?: boolean;
  onPurchase?: (equipment: Equipment) => void;
  onSelect?: (equipment: Equipment) => void;
  compact?: boolean;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  owned = false,
  canAfford = true,
  onPurchase,
  onSelect,
  compact = false,
}) => {
  const getRarityColor = (rarity: EquipmentRarity): string => {
    const colors = {
      [EquipmentRarity.COMMON]: "border-metal-600",
      [EquipmentRarity.UNCOMMON]: "border-green-600",
      [EquipmentRarity.RARE]: "border-blue-600",
      [EquipmentRarity.LEGENDARY]: "border-punk-600",
    };
    return colors[rarity];
  };

  const getRarityGlow = (rarity: EquipmentRarity): string => {
    const glows = {
      [EquipmentRarity.COMMON]: "",
      [EquipmentRarity.UNCOMMON]: "shadow-green-600/20",
      [EquipmentRarity.RARE]: "shadow-blue-600/30",
      [EquipmentRarity.LEGENDARY]: "shadow-punk-600/40 animate-pulse",
    };
    return glows[rarity];
  };

  const getTypeIcon = (type: EquipmentType): string => {
    const icons = {
      [EquipmentType.SOUND]: "🔊",
      [EquipmentType.LIGHTING]: "💡",
      [EquipmentType.TRANSPORT]: "🚐",
      [EquipmentType.PROMOTION]: "📢",
      [EquipmentType.SECURITY]: "🛡️",
      [EquipmentType.SPECIAL]: "⭐",
    };
    return icons[type];
  };

  const handleClick = () => {
    if (owned) {
      onSelect?.(equipment);
      haptics.light();
      audio.tap();
    } else if (canAfford && onPurchase) {
      onPurchase(equipment);
      haptics.success();
      audio.coin();
    } else {
      haptics.error();
      audio.error();
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`
          relative p-2 rounded-lg border-2 transition-all
          ${getRarityColor(equipment.rarity)}
          ${owned ? "bg-metal-800" : "bg-metal-900"}
          ${!owned && !canAfford ? "opacity-50" : ""}
          hover:scale-105 active:scale-95
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(equipment.type)}</span>
          <div className="text-left">
            <p className="font-bold text-xs">{equipment.name}</p>
            {!owned && (
              <p
                className={`text-xs ${canAfford ? "text-green-400" : "text-red-400"}`}
              >
                ${equipment.cost}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className={`
        relative bg-metal-900 rounded-lg p-4 border-2 transition-all
        ${getRarityColor(equipment.rarity)}
        ${getRarityGlow(equipment.rarity)}
        ${owned ? "bg-metal-800" : ""}
        ${!owned && !canAfford ? "opacity-50" : ""}
        shadow-lg
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <span className="text-3xl">{getTypeIcon(equipment.type)}</span>
          <div>
            <h3 className="font-bold text-sm">{equipment.name}</h3>
            <p className="text-xs text-metal-400 uppercase">
              {equipment.rarity}
            </p>
          </div>
        </div>
        {!owned && (
          <div className="text-right">
            <p
              className={`font-bold text-lg ${canAfford ? "text-green-400" : "text-red-400"}`}
            >
              ${equipment.cost}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-metal-300 mb-3">{equipment.description}</p>

      {/* Effects */}
      <div className="space-y-1 mb-3">
        {equipment.effects.map((effect, index) => (
          <div key={index} className="text-xs">
            <span className="text-metal-500">•</span>
            <span
              className={`ml-1 ${effect.value > 0 ? "text-green-400" : "text-red-400"}`}
            >
              {effect.type === "multiply" &&
                `${((effect.value - 1) * 100).toFixed(0)}% `}
              {effect.type === "add" && `+${effect.value} `}
              {effect.type === "reduce" &&
                `-${(effect.value * 100).toFixed(0)}% `}
              {effect.type === "prevent" && "Prevents "}
              {effect.target}
              {effect.condition && (
                <span className="text-metal-500"> ({effect.condition})</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Flavor Text */}
      {equipment.flavorText && (
        <p className="text-xs text-metal-500 italic mb-3">
          "{equipment.flavorText}"
        </p>
      )}

      {/* Action Button */}
      {!owned && onPurchase && (
        <button
          onClick={handleClick}
          disabled={!canAfford}
          className={`
            w-full py-2 px-4 rounded font-bold text-sm transition-all
            ${
              canAfford
                ? "bg-punk-600 hover:bg-punk-700 active:scale-95"
                : "bg-metal-800 text-metal-600 cursor-not-allowed"
            }
          `}
        >
          {canAfford ? "Purchase" : "Cannot Afford"}
        </button>
      )}

      {/* Owned Badge */}
      {owned && (
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
          OWNED
        </div>
      )}

      {/* Stackable Info */}
      {equipment.stackable && (
        <div className="absolute bottom-2 right-2 text-xs text-metal-500">
          Stack: {equipment.maxStacks}
        </div>
      )}
    </div>
  );
};

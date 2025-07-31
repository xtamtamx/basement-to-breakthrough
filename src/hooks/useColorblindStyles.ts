import { useMemo } from "react";
import { useColorblind } from "@contexts/ColorblindContext";

interface ColorblindStyles {
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Semantic colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Game-specific colors
  money: string;
  reputation: string;
  stress: string;
  fans: string;
  
  // Faction colors
  factionPunk: string;
  factionMetal: string;
  factionIndie: string;
  factionElectronic: string;
  
  // Synergy colors
  synergyActive: string;
  synergyPotential: string;
  synergyConflict: string;
  
  // Background colors
  bg: string;
  bgSecondary: string;
  bgCard: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderBright: string;
}

export const useColorblindStyles = (): ColorblindStyles => {
  const { getSemantic, colors } = useColorblind();
  
  return useMemo(() => ({
    // Text colors
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    
    // Semantic colors
    success: getSemantic("success"),
    error: getSemantic("error"),
    warning: getSemantic("warning"),
    info: getSemantic("info"),
    
    // Game-specific colors
    money: getSemantic("resources.money"),
    reputation: getSemantic("resources.reputation"),
    stress: getSemantic("resources.stress"),
    fans: getSemantic("resources.fans"),
    
    // Faction colors
    factionPunk: getSemantic("faction.punk"),
    factionMetal: getSemantic("faction.metal"),
    factionIndie: getSemantic("faction.indie"),
    factionElectronic: getSemantic("faction.electronic"),
    
    // Synergy colors
    synergyActive: getSemantic("synergy.active"),
    synergyPotential: getSemantic("synergy.potential"),
    synergyConflict: getSemantic("synergy.conflict"),
    
    // Background colors
    bg: colors.bg.primary,
    bgSecondary: colors.bg.secondary,
    bgCard: colors.bg.card,
    
    // Border colors
    border: colors.border.default,
    borderLight: colors.border.light,
    borderBright: colors.border.bright,
  }), [getSemantic, colors]);
};

// Utility function for inline colorblind-safe styles
export const useColorStyle = (colorPath: string): string => {
  const { getColor } = useColorblind();
  return getColor(colorPath);
};

// Hook for faction-specific styles
export const useFactionColor = (faction: string): string => {
  const { getSemantic } = useColorblind();
  return getSemantic(`faction.${faction.toLowerCase()}`);
};

// Hook for resource-specific styles
export const useResourceColor = (resource: "money" | "reputation" | "stress" | "fans"): string => {
  const { getSemantic } = useColorblind();
  return getSemantic(`resources.${resource}`);
};
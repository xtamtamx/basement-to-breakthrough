import { ColorblindMode } from "@game/types";
import { theme } from "./theme";

// Colorblind-friendly color palettes based on research and accessibility guidelines
// These use colors that are distinguishable for different types of color blindness

export const colorblindPalettes = {
  [ColorblindMode.OFF]: theme.colors,
  
  [ColorblindMode.PROTANOPIA]: {
    // Red-blind (1% of males) - avoid red/green distinction
    punk: {
      pink: "#0077BB", // Blue instead of pink
      magenta: "#33BBEE", // Light blue instead of magenta
      neon: "#009988", // Teal instead of neon pink
    },
    metal: {
      red: "#EE7733", // Orange instead of red
      blood: "#CC6677", // Reddish purple instead of blood red
      rust: "#AA4499", // Magenta instead of rust
    },
    success: {
      green: "#0077BB", // Blue for success
      emerald: "#0055AA", // Darker blue
      mint: "#33BBEE", // Light blue
    },
    warning: {
      yellow: "#EE7733", // Orange (kept similar)
      amber: "#DD5511", // Darker orange
      gold: "#FFAA44", // Light orange
    },
    info: theme.colors.info, // Purple/violet work well
    bg: theme.colors.bg,
    border: theme.colors.border,
    text: theme.colors.text,
  },
  
  [ColorblindMode.DEUTERANOPIA]: {
    // Green-blind (6% of males) - most common, avoid red/green distinction
    punk: {
      pink: "#CC79A7", // Reddish purple
      magenta: "#EE7733", // Orange
      neon: "#F0E442", // Yellow
    },
    metal: {
      red: "#D55E00", // Vermillion
      blood: "#AA3322", // Dark vermillion
      rust: "#882255", // Wine
    },
    success: {
      green: "#0072B2", // Blue for success
      emerald: "#005588", // Darker blue
      mint: "#56B4E9", // Sky blue
    },
    warning: {
      yellow: "#F0E442", // Yellow (kept)
      amber: "#E69F00", // Orange
      gold: "#FFD92F", // Light yellow
    },
    info: {
      purple: "#CC79A7", // Reddish purple
      violet: "#AA3377", // Darker reddish purple
      indigo: "#882255", // Wine
    },
    bg: theme.colors.bg,
    border: theme.colors.border,
    text: theme.colors.text,
  },
  
  [ColorblindMode.TRITANOPIA]: {
    // Blue-blind (very rare) - avoid blue/yellow distinction
    punk: {
      pink: "#E69F00", // Orange
      magenta: "#D55E00", // Vermillion
      neon: "#CC79A7", // Pink
    },
    metal: {
      red: "#990000", // Deep red
      blood: "#660000", // Darker red
      rust: "#AA4400", // Brown orange
    },
    success: {
      green: "#009E73", // Bluish green
      emerald: "#006644", // Darker bluish green
      mint: "#33CC99", // Light bluish green
    },
    warning: {
      yellow: "#D55E00", // Vermillion instead of yellow
      amber: "#CC4400", // Darker vermillion
      gold: "#FF7744", // Light vermillion
    },
    info: {
      purple: "#CC0066", // Magenta
      violet: "#990055", // Darker magenta
      indigo: "#660044", // Deep magenta
    },
    bg: theme.colors.bg,
    border: theme.colors.border,
    text: theme.colors.text,
  },
  
  [ColorblindMode.ACHROMATOPSIA]: {
    // Complete color blindness - use only grayscale
    punk: {
      pink: "#FFFFFF", // White
      magenta: "#E0E0E0", // Light gray
      neon: "#C0C0C0", // Gray
    },
    metal: {
      red: "#808080", // Medium gray
      blood: "#606060", // Darker gray
      rust: "#404040", // Dark gray
    },
    success: {
      green: "#FFFFFF", // White for positive
      emerald: "#E0E0E0", // Light gray
      mint: "#F0F0F0", // Very light gray
    },
    warning: {
      yellow: "#C0C0C0", // Gray for warning
      amber: "#A0A0A0", // Darker gray
      gold: "#D0D0D0", // Light gray
    },
    info: {
      purple: "#909090", // Medium gray
      violet: "#707070", // Darker gray
      indigo: "#505050", // Dark gray
    },
    bg: theme.colors.bg,
    border: {
      default: "#404040",
      light: "#606060",
      bright: "#808080",
    },
    text: theme.colors.text,
  },
};

// Helper function to get colorblind-safe colors
export const getColorblindSafeColor = (
  colorPath: string,
  mode: ColorblindMode
): string => {
  const palette = colorblindPalettes[mode];
  const keys = colorPath.split(".");
  
  let value: unknown = palette;
  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key];
  }
  
  return value || theme.colors.text.primary;
};

// Semantic color mapping for game elements
export const semanticColors = {
  success: "success.green",
  error: "metal.red",
  warning: "warning.yellow",
  info: "info.purple",
  faction: {
    punk: "punk.pink",
    metal: "metal.red",
    indie: "info.purple",
    electronic: "info.indigo",
  },
  synergy: {
    active: "success.mint",
    potential: "warning.gold",
    conflict: "metal.blood",
  },
  resources: {
    money: "success.green",
    reputation: "punk.magenta",
    stress: "metal.red",
    fans: "info.purple",
  },
};

// Get semantic color with colorblind mode support
export const getSemanticColor = (
  semantic: string,
  mode: ColorblindMode
): string => {
  const colorPath = semantic.split(".").reduce((path, key) => {
    return (path as Record<string, unknown>)?.[key] || path;
  }, semanticColors as Record<string, unknown>);
  
  if (typeof colorPath === "string") {
    return getColorblindSafeColor(colorPath, mode);
  }
  
  return theme.colors.text.primary;
};
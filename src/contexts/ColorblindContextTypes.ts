import { createContext } from "react";
import { ColorblindMode } from "@game/types";
import { theme } from "@styles/theme";

export interface ColorblindContextValue {
  mode: ColorblindMode;
  setMode: (mode: ColorblindMode) => void;
  colors: typeof theme.colors;
  getColor: (colorPath: string) => string;
  getSemantic: (semantic: string) => string;
}

// The context instance lives in this (component-free) module so the Provider
// file can export only its component — required for React Fast Refresh.
export const ColorblindContext = createContext<ColorblindContextValue | null>(
  null,
);
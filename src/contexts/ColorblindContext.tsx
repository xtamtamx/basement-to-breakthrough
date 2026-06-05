import React, { useEffect, useState } from "react";
import { ColorblindMode } from "@game/types";
import { colorblindPalettes, getColorblindSafeColor, getSemanticColor } from "@styles/colorblind";
import { ColorblindContext, ColorblindContextValue } from "./ColorblindContextTypes";

interface ColorValueMap {
  [key: string]: ColorValue;
}
type ColorValue = string | ColorValueMap;

interface ColorblindProviderProps {
  children: React.ReactNode;
  initialMode?: ColorblindMode;
}

export const ColorblindProvider: React.FC<ColorblindProviderProps> = ({
  children,
  initialMode = ColorblindMode.OFF,
}) => {
  const [mode, setModeInternal] = useState<ColorblindMode>(initialMode);
  
  // Save mode to storage when it changes
  const setMode = (newMode: ColorblindMode) => {
    setModeInternal(newMode);
    import("@utils/safeStorage").then(({ safeStorage }) => {
      safeStorage.setItem("colorblind-mode", newMode);
    });
  };
  
  // Apply CSS custom properties for colorblind mode
  useEffect(() => {
    const root = document.documentElement;
    const palette = colorblindPalettes[mode];
    
    // Set CSS variables for all colors
    const setCssVars = (obj: ColorValue | Record<string, ColorValue>, prefix = "--color") => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "object") {
          setCssVars(value, `${prefix}-${key}`);
        } else {
          root.style.setProperty(`${prefix}-${key}`, value as string);
        }
      });
    };
    
    setCssVars(palette);
    
    // Add mode class to body for additional styling
    document.body.className = document.body.className
      .replace(/colorblind-mode-\w+/g, "")
      .trim() + ` colorblind-mode-${mode.toLowerCase()}`;
  }, [mode]);
  
  const value: ColorblindContextValue = {
    mode,
    setMode,
    colors: colorblindPalettes[mode],
    getColor: (colorPath: string) => getColorblindSafeColor(colorPath, mode),
    getSemantic: (semantic: string) => getSemanticColor(semantic, mode),
  };
  
  return (
    <ColorblindContext.Provider value={value}>
      {children}
    </ColorblindContext.Provider>
  );
};
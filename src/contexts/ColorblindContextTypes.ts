import { ColorblindMode } from "@game/types";
import { theme } from "@styles/theme";

export interface ColorblindContextValue {
  mode: ColorblindMode;
  setMode: (mode: ColorblindMode) => void;
  colors: typeof theme.colors;
  getColor: (colorPath: string) => string;
  getSemantic: (semantic: string) => string;
}
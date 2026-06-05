import { useContext } from "react";
import { ColorblindContext } from "@contexts/ColorblindContextTypes";

export const useColorblind = () => {
  const context = useContext(ColorblindContext);
  if (!context) {
    throw new Error("useColorblind must be used within ColorblindProvider");
  }
  return context;
};
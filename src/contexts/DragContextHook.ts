import { useContext } from "react";
import { DragContext } from "./DragContext";

export const useDragContext = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDragContext must be used within DragProvider");
  }
  return context;
};
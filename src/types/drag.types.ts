// Type definitions for the drag and drop system
import { Band, Venue } from "@/game/types";

// Union type for all draggable items in the game
export type DraggableItem = Band | Venue;

// Type for identifying what kind of item is being dragged
export type DragType = "band" | "venue";

// Position information for drop events
export interface DropPosition {
  x: number;
  y: number;
}

// Handler function type for drop zones
export type DropHandler<T extends DraggableItem = DraggableItem> = (
  item: T,
  position: DropPosition,
) => void;

// Type guard functions
export function isBand(item: DraggableItem): item is Band {
  return "genre" in item && "popularity" in item;
}

export function isVenue(item: DraggableItem): item is Venue {
  return "capacity" in item && "acoustics" in item;
}

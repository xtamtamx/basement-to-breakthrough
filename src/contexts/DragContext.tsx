import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  DraggableItem,
  DragType,
  DropHandler,
} from "@/types/drag.types";

interface DragContextType {
  draggedItem: DraggableItem | null;
  draggedType: DragType | null;
  setDraggedItem: (item: DraggableItem, type: DragType) => void;
  clearDraggedItem: () => void;
  dropZones: Map<string, DropHandler>;
  registerDropZone: (id: string, handler: DropHandler) => void;
  unregisterDropZone: (id: string) => void;
  handleDragMove: (x: number, y: number) => void;
  handleDrop: (x: number, y: number) => boolean;
}

export const DragContext = createContext<DragContextType | null>(null);

interface DragProviderProps {
  children: ReactNode;
}

export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  const [draggedItem, setDraggedItemState] = useState<DraggableItem | null>(
    null,
  );
  const [draggedType, setDraggedType] = useState<DragType | null>(null);
  const [dropZones] = useState(new Map<string, DropHandler>());
  const [_activeDropZones, setActiveDropZones] = useState<Set<string>>(
    new Set(),
  );

  const setDraggedItem = useCallback((item: DraggableItem, type: DragType) => {
    setDraggedItemState(item);
    setDraggedType(type);
  }, []);

  const clearDraggedItem = useCallback(() => {
    setDraggedItemState(null);
    setDraggedType(null);
    setActiveDropZones(new Set());
  }, []);

  const registerDropZone = useCallback(
    (id: string, handler: DropHandler) => {
      dropZones.set(id, handler);
    },
    [dropZones],
  );

  const unregisterDropZone = useCallback(
    (id: string) => {
      dropZones.delete(id);
    },
    [dropZones],
  );

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      // Check which drop zones are under the cursor
      const newActiveZones = new Set<string>();

      dropZones.forEach((handler, id) => {
        const element = document.querySelector(`[data-dropzone-id="${id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            newActiveZones.add(id);
          }
        }
      });

      setActiveDropZones(newActiveZones);
    },
    [dropZones],
  );

  const handleDrop = useCallback(
    (x: number, y: number): boolean => {
      if (!draggedItem) return false;

      // Find the drop zone at the position
      let dropped = false;
      dropZones.forEach((handler, id) => {
        const element = document.querySelector(`[data-dropzone-id="${id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            handler(draggedItem, { x, y });
            dropped = true;
          }
        }
      });

      clearDraggedItem();
      return dropped;
    },
    [draggedItem, dropZones, clearDraggedItem],
  );

  return (
    <DragContext.Provider
      value={{
        draggedItem,
        draggedType,
        setDraggedItem,
        clearDraggedItem,
        dropZones,
        registerDropZone,
        unregisterDropZone,
        handleDragMove,
        handleDrop,
      }}
    >
      {children}
    </DragContext.Provider>
  );
};

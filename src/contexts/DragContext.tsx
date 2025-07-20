import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DragContextType {
  draggedItem: any | null;
  draggedType: string | null;
  setDraggedItem: (item: any, type: string) => void;
  clearDraggedItem: () => void;
  dropZones: Map<string, (data: any, position: { x: number; y: number }) => void>;
  registerDropZone: (id: string, handler: (data: any, position: { x: number; y: number }) => void) => void;
  unregisterDropZone: (id: string) => void;
  handleDragMove: (x: number, y: number) => void;
  handleDrop: (x: number, y: number) => boolean;
}

const DragContext = createContext<DragContextType | null>(null);

export const useDragContext = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within DragProvider');
  }
  return context;
};

interface DragProviderProps {
  children: ReactNode;
}

export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  const [draggedItem, setDraggedItemState] = useState<any | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [dropZones] = useState(new Map<string, (data: any, position: { x: number; y: number }) => void>());
  const [activeDropZones, setActiveDropZones] = useState<Set<string>>(new Set());

  const setDraggedItem = useCallback((item: any, type: string) => {
    setDraggedItemState(item);
    setDraggedType(type);
  }, []);

  const clearDraggedItem = useCallback(() => {
    setDraggedItemState(null);
    setDraggedType(null);
    setActiveDropZones(new Set());
  }, []);

  const registerDropZone = useCallback((id: string, handler: (data: any, position: { x: number; y: number }) => void) => {
    dropZones.set(id, handler);
  }, [dropZones]);

  const unregisterDropZone = useCallback((id: string) => {
    dropZones.delete(id);
  }, [dropZones]);

  const handleDragMove = useCallback((x: number, y: number) => {
    // Check which drop zones are under the cursor
    const newActiveZones = new Set<string>();
    
    dropZones.forEach((handler, id) => {
      const element = document.querySelector(`[data-dropzone-id="${id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          newActiveZones.add(id);
        }
      }
    });

    setActiveDropZones(newActiveZones);
  }, [dropZones]);

  const handleDrop = useCallback((x: number, y: number) => {
    if (!draggedItem) return;

    // Find the drop zone at the position
    let dropped = false;
    dropZones.forEach((handler, id) => {
      const element = document.querySelector(`[data-dropzone-id="${id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          handler(draggedItem, { x, y });
          dropped = true;
        }
      }
    });

    clearDraggedItem();
    return dropped;
  }, [draggedItem, dropZones, clearDraggedItem]);

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
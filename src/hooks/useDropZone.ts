import { useRef, useState, useCallback } from 'react';
import { haptics } from '@utils/mobile';

interface UseDropZoneOptions {
  onDrop?: (data: any, position: { x: number; y: number }) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  accepts?: string[];
  disabled?: boolean;
}

export const useDropZone = (options: UseDropZoneOptions = {}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);

  const checkIfOverElement = useCallback((x: number, y: number) => {
    const element = elementRef.current;
    if (!element || options.disabled) return false;

    const rect = element.getBoundingClientRect();
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }, [options.disabled]);

  const handleDragOver = useCallback((x: number, y: number) => {
    const overElement = checkIfOverElement(x, y);
    
    if (overElement && !isOver) {
      setIsOver(true);
      setCanDrop(true);
      options.onDragEnter?.();
      haptics.light();
    } else if (!overElement && isOver) {
      setIsOver(false);
      setCanDrop(false);
      options.onDragLeave?.();
    }
  }, [checkIfOverElement, isOver, options]);

  const handleDrop = useCallback((data: any, x: number, y: number) => {
    if (checkIfOverElement(x, y) && !options.disabled) {
      options.onDrop?.(data, { x, y });
      haptics.success();
    }
    setIsOver(false);
    setCanDrop(false);
  }, [checkIfOverElement, options]);

  return {
    ref: elementRef,
    isOver,
    canDrop,
    handleDragOver,
    handleDrop,
  };
};
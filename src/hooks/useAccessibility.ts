import { useEffect, useRef, useCallback } from 'react';
import { 
  trapFocus, 
  announceToScreenReader, 
  KEYS, 
  isActivationKey,
  handleGridKeyNavigation 
} from '@utils/accessibility';

/**
 * Hook for managing focus trap (useful for modals and overlays)
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const cleanup = trapFocus(containerRef.current);
    
    // Focus first focusable element
    const firstFocusable = containerRef.current.querySelector<HTMLElement>(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    
    return cleanup;
  }, [isActive]);
  
  return containerRef;
};

/**
 * Hook for escape key handling
 */
export const useEscapeKey = (onEscape: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYS.ESCAPE) {
        e.preventDefault();
        onEscape();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
};

/**
 * Hook for announcing status updates to screen readers
 */
export const useAnnouncement = () => {
  const announce = useCallback((message: string, priority?: 'polite' | 'assertive') => {
    announceToScreenReader(message, priority);
  }, []);
  
  return announce;
};

/**
 * Hook for keyboard-accessible button behavior
 */
export const useAccessibleButton = (onClick: () => void, disabled?: boolean) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (isActivationKey(e.key)) {
      e.preventDefault();
      onClick();
    }
  }, [onClick, disabled]);
  
  return {
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled,
    onKeyDown: handleKeyDown,
    onClick: disabled ? undefined : onClick
  };
};

/**
 * Hook for grid navigation
 */
export const useGridNavigation = (
  totalItems: number,
  columns: number,
  onSelect: (index: number) => void
) => {
  const currentIndexRef = useRef(0);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isActivationKey(e.key)) {
      e.preventDefault();
      onSelect(currentIndexRef.current);
      return;
    }
    
    handleGridKeyNavigation(
      e as unknown as KeyboardEvent,
      currentIndexRef.current,
      totalItems,
      columns,
      (newIndex) => {
        currentIndexRef.current = newIndex;
        // Focus the new item
        const items = e.currentTarget.querySelectorAll('[role="gridcell"]');
        (items[newIndex] as HTMLElement)?.focus();
      }
    );
  }, [totalItems, columns, onSelect]);
  
  const getGridCellProps = useCallback((index: number) => ({
    role: 'gridcell',
    tabIndex: index === currentIndexRef.current ? 0 : -1,
    onFocus: () => {
      currentIndexRef.current = index;
    }
  }), []);
  
  return {
    gridProps: {
      role: 'grid',
      onKeyDown: handleKeyDown
    },
    getGridCellProps
  };
};

/**
 * Hook for managing ARIA live regions
 */
export const useLiveRegion = (initialMessage?: string) => {
  const regionRef = useRef<HTMLDivElement>(null);
  
  const announce = useCallback((message: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = message;
    }
  }, []);
  
  const LiveRegion = useCallback(() => (
    <div
      ref={regionRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {initialMessage}
    </div>
  ), [initialMessage]);
  
  return { announce, LiveRegion };
};
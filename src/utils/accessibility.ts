/**
 * Accessibility utilities for the game
 * Provides helpers for keyboard navigation, screen readers, and focus management
 */

/**
 * Announce message to screen readers using aria-live region
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within an element (useful for modals)
 */
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Get appropriate ARIA label for game resources
 */
export const getResourceAriaLabel = (resource: string, value: number): string => {
  const resourceLabels: Record<string, string> = {
    money: `${value} dollars`,
    reputation: `${value} reputation points`,
    fans: `${value} fans`,
    stress: `${value}% stress level`,
    connections: `${value} connections`
  };
  
  return resourceLabels[resource] || `${value} ${resource}`;
};

/**
 * Get ARIA description for band cards
 */
export const getBandAriaDescription = (band: {
  name: string;
  genre: string;
  stats: { popularity: number; skill: number; reliability: number };
}): string => {
  return `${band.name}, ${band.genre} band. Popularity: ${band.stats.popularity}, Skill: ${band.stats.skill}, Reliability: ${band.stats.reliability}`;
};

/**
 * Get ARIA description for venue cards
 */
export const getVenueAriaDescription = (venue: {
  name: string;
  type: string;
  capacity: number;
  rent: number;
}): string => {
  return `${venue.name}, ${venue.type}. Capacity: ${venue.capacity} people, Rent: ${venue.rent} dollars`;
};

/**
 * Keyboard navigation helpers
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
} as const;

/**
 * Check if key is an activation key (Enter or Space)
 */
export const isActivationKey = (key: string): boolean => {
  return key === KEYS.ENTER || key === KEYS.SPACE;
};

/**
 * Handle grid navigation with arrow keys
 */
export const handleGridKeyNavigation = (
  e: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  columns: number,
  onNavigate: (newIndex: number) => void
) => {
  let newIndex = currentIndex;
  
  switch (e.key) {
    case KEYS.ARROW_LEFT:
      if (currentIndex % columns !== 0) {
        newIndex = currentIndex - 1;
      }
      break;
    case KEYS.ARROW_RIGHT:
      if (currentIndex % columns !== columns - 1 && currentIndex < totalItems - 1) {
        newIndex = currentIndex + 1;
      }
      break;
    case KEYS.ARROW_UP:
      if (currentIndex >= columns) {
        newIndex = currentIndex - columns;
      }
      break;
    case KEYS.ARROW_DOWN:
      if (currentIndex < totalItems - columns) {
        newIndex = currentIndex + columns;
      }
      break;
    case KEYS.HOME:
      newIndex = 0;
      break;
    case KEYS.END:
      newIndex = totalItems - 1;
      break;
    default:
      return;
  }
  
  if (newIndex !== currentIndex) {
    e.preventDefault();
    onNavigate(newIndex);
  }
};

/**
 * Create skip link for keyboard navigation
 */
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'skip-link';
  link.textContent = text;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  });
  return link;
};

/**
 * Reduced motion preference check
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * High contrast mode check
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};
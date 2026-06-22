import { useEffect } from 'react';

/**
 * Close a modal/overlay when the user presses Escape. Pass `active=false` to
 * disable (e.g. when the modal isn't open) so it's safe to call before an
 * `if (!isOpen) return null` early return without breaking rules-of-hooks.
 */
export function useEscapeToClose(onClose: () => void, active = true): void {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, active]);
}

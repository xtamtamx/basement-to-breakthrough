import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEscapeToClose } from '@hooks/useEscapeToClose';
import { useFocusTrap } from '@hooks/useAccessibility';
import { haptics } from '@utils/mobile';

interface SnesModalProps {
  onClose: () => void;
  /** Accessible name. Falls back to a stringified `title` when omitted. */
  ariaLabel?: string;
  /** Optional header title (rendered as the pixel modal heading). */
  title?: React.ReactNode;
  /** Extra content on the right of the header, left of the close button. */
  headerRight?: React.ReactNode;
  /** Optional pinned footer (e.g. the primary CTA) — stays in view while the body
   *  scrolls, so the action never scrolls off the short landscape screen. */
  footer?: React.ReactNode;
  /** 'center' (default) or 'sheet' (slides up from the bottom edge, full-width). */
  variant?: 'center' | 'sheet';
  /** Override the sheet max-width (center variant only). */
  maxWidth?: number | string;
  /** Top-border accent color (defaults to the magenta in snes.css). */
  accent?: string;
  /** Close when the backdrop is tapped (default true). */
  closeOnBackdrop?: boolean;
  /** Hide the X button (rare — e.g. a forced choice). */
  hideClose?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The one canonical dialog shell. Wraps the snes.css `.snes-modal`/`__sheet` frame
 * and bakes in everything the hand-rolled modals were missing or doing differently:
 * portal, standard backdrop + entrance animation, Escape-to-close, focus trap +
 * focus restore, body-scroll lock, role="dialog"/aria-modal, and a shared 44px
 * close button. Every dialog in the app should route through this.
 */
export const SnesModal: React.FC<SnesModalProps> = ({
  onClose,
  ariaLabel,
  title,
  headerRight,
  footer,
  variant = 'center',
  maxWidth,
  accent,
  closeOnBackdrop = true,
  hideClose = false,
  className,
  children,
}) => {
  const sheetRef = useFocusTrap(true);
  const restoreRef = useRef<HTMLElement | null>(null);
  useEscapeToClose(onClose);

  // Restore focus to the trigger on close + lock body scroll while open.
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // The focus-trap focuses the first control on open, which can scroll the sheet
    // and clip the header — pin it back to the top once focus settles.
    const id = requestAnimationFrame(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; });
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [sheetRef]);

  const close = () => { haptics.light(); onClose(); };

  return createPortal(
    <div
      className={`snes-modal${variant === 'sheet' ? ' snes-modal--sheet' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : 'Dialog')}
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) close(); } : undefined}
    >
      <div
        ref={sheetRef}
        className={`snes-modal__sheet${className ? ` ${className}` : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ ...(maxWidth != null ? { maxWidth } : {}), ...(accent ? { borderTopColor: accent } : {}) }}
      >
        {(title != null || headerRight != null || !hideClose) && (
          <div className="snes-modal__header">
            {title != null ? <h2 className="snes-modal__title">{title}</h2> : <span />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
              {headerRight}
              {!hideClose && (
                <button type="button" className="snes-close" onClick={close} aria-label="Close">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="snes-modal__body">{children}</div>
        {footer != null && <div className="snes-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

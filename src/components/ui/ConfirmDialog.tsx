import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { SnesModal } from './SnesModal';
import { haptics } from '@utils/mobile';

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive (red). */
  danger?: boolean;
  /** Single-button acknowledge (no Cancel) — for in-app notices/alerts. */
  notice?: boolean;
}

/** Controlled confirm dialog on the canonical SnesModal shell. */
export const ConfirmDialog: React.FC<ConfirmOptions & { onConfirm: () => void; onCancel: () => void }> = ({
  title, message, confirmLabel, cancelLabel = 'Cancel', danger, notice, onConfirm, onCancel,
}) => (
  <SnesModal
    onClose={onCancel}
    title={title ?? (notice ? 'Heads up' : danger ? 'Are you sure?' : 'Confirm')}
    ariaLabel={title ?? 'Confirm'}
    accent={danger ? 'var(--snes-red)' : undefined}
    maxWidth={360}
  >
    <p style={{ fontSize: 'var(--t-md)', color: 'var(--snes-ink-dim)', lineHeight: 1.5, margin: '0 0 var(--s4)', whiteSpace: 'pre-line' }}>
      {message}
    </p>
    <div style={{ display: 'flex', gap: 'var(--s2)' }}>
      {!notice && (
        <button type="button" className="snes-btn snes-btn--ghost" style={{ flex: 1 }} onClick={onCancel}>
          {cancelLabel}
        </button>
      )}
      <button
        type="button"
        className={`snes-btn${danger ? ' snes-btn--danger' : ''}`}
        style={{ flex: 1 }}
        onClick={() => { (danger ? haptics.heavy : haptics.medium)?.(); onConfirm(); }}
      >
        {confirmLabel ?? (notice ? 'OK' : 'Confirm')}
      </button>
    </div>
  </SnesModal>
);

// ---- imperative useConfirm() — replaces scattered native window.confirm() ----
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setPending(opts);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const settle = (value: boolean) => { resolver.current?.(value); resolver.current = null; setPending(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmDialog {...pending} onConfirm={() => settle(true)} onCancel={() => settle(false)} />
      )}
    </ConfirmContext.Provider>
  );
};

/** Returns an async confirm(opts) → boolean. Falls back to window.confirm if used
 *  outside the provider (so call sites never crash). */
// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  return ctx ?? (async (opts) => window.confirm(typeof opts.message === 'string' ? opts.message : 'Are you sure?'));
};

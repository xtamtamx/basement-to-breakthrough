import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { tutorialManager, TutorialStep } from '@game/tutorial/TutorialManager';
import { haptics } from '@utils/mobile';

const RING_PAD = 6; // px of breathing room around a highlighted target
const ANCHOR_GAP = 14; // px between target and an above/below tooltip
const TOOLTIP_MAX = 340; // px

/**
 * Coachmark layer for the first-show walkthrough. The overlay never blocks
 * input (root is pointer-events:none, only the tooltip is interactive) so the
 * real buttons the tutorial points at stay tappable — gating is driven by the
 * player actually doing each step, polled live so a view transition can't
 * leave a stale highlight behind.
 */
export const TutorialOverlay: React.FC = () => {
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [bounds, setBounds] = useState<DOMRect | null>(null);
  const boundElRef = useRef<Element | null>(null);

  // Track the manager's current step / progress.
  useEffect(() => {
    const sync = () => {
      setStep(tutorialManager.getCurrentStep());
      setProgress(tutorialManager.getCurrentProgress());
    };
    sync();
    return tutorialManager.onUpdate(sync);
  }, []);

  // Drive 'state'-gated steps off real game-state changes.
  useEffect(() => {
    const unsub = useGameStore.subscribe(() => tutorialManager.evaluateState(useGameStore.getState()));
    return unsub;
  }, []);

  // Per-step: poll for the target so the highlight + any tap binding survive
  // view transitions, scrolling and layout shifts. Also re-check a state gate
  // on entry in case it's already satisfied.
  const stepId = step?.id;
  useEffect(() => {
    boundElRef.current = null;
    setBounds(null);

    if (!step) return;
    if (step.gate.kind === 'state') tutorialManager.evaluateState(useGameStore.getState());
    if (!step.target) return;

    const target = step.target;
    const isTap = step.gate.kind === 'tap';
    const onTap = () => {
      tutorialManager.tapAdvance();
      haptics.light();
    };

    const tick = () => {
      const el = document.querySelector(target);
      if (!el) {
        if (boundElRef.current) {
          boundElRef.current.removeEventListener('click', onTap);
          boundElRef.current = null;
        }
        setBounds(null);
        return;
      }
      setBounds(el.getBoundingClientRect());
      if (isTap && el !== boundElRef.current) {
        boundElRef.current?.removeEventListener('click', onTap);
        el.addEventListener('click', onTap);
        boundElRef.current = el;
      }
    };

    tick();
    const interval = window.setInterval(tick, 150);
    return () => {
      window.clearInterval(interval);
      boundElRef.current?.removeEventListener('click', onTap);
      boundElRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  if (!step) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640;
  const width = Math.min(TOOLTIP_MAX, vw - 24);

  // ── Spotlight geometry ──────────────────────────────────────────────────
  const hole = bounds
    ? {
        x0: bounds.left - RING_PAD,
        y0: bounds.top - RING_PAD,
        x1: bounds.right + RING_PAD,
        y1: bounds.bottom + RING_PAD,
      }
    : null;

  // ── Tooltip position ──────────────────────────────────────────────────────
  const tipStyle: React.CSSProperties = { width, pointerEvents: 'auto' };
  const place = step.placement;
  if (place === 'above' && bounds) {
    tipStyle.bottom = vh - bounds.top + ANCHOR_GAP;
    tipStyle.left = Math.max(12, Math.min(bounds.left + bounds.width / 2 - width / 2, vw - width - 12));
  } else if (place === 'below' && bounds) {
    tipStyle.top = bounds.bottom + ANCHOR_GAP;
    tipStyle.left = Math.max(12, Math.min(bounds.left + bounds.width / 2 - width / 2, vw - width - 12));
  } else if (place === 'center') {
    tipStyle.top = '50%';
    tipStyle.left = '50%';
    tipStyle.transform = 'translate(-50%, -50%)';
  } else if (place === 'screen-bottom') {
    tipStyle.bottom = 'calc(env(safe-area-inset-bottom) + 96px)';
    tipStyle.left = '50%';
    tipStyle.transform = 'translateX(-50%)';
  } else {
    // screen-top — and the fallback for above/below before the target is found
    tipStyle.top = 'calc(env(safe-area-inset-top) + 12px)';
    tipStyle.left = '50%';
    tipStyle.transform = 'translateX(-50%)';
  }

  const dim = 'rgba(8, 6, 18, 0.74)';
  const showFullDim = !hole && place === 'center';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
      {/* Dimmer — spotlight cutout around a target, full dim for centered intro,
          nothing for the hands-on steps so the view stays bright and usable. */}
      {hole ? (
        <>
          <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: Math.max(0, hole.y0), background: dim }} />
          <div style={{ position: 'fixed', left: 0, top: hole.y1, width: '100vw', height: Math.max(0, vh - hole.y1), background: dim }} />
          <div style={{ position: 'fixed', left: 0, top: hole.y0, width: Math.max(0, hole.x0), height: hole.y1 - hole.y0, background: dim }} />
          <div style={{ position: 'fixed', left: hole.x1, top: hole.y0, width: Math.max(0, vw - hole.x1), height: hole.y1 - hole.y0, background: dim }} />
          <div
            className="tut-ring"
            style={{
              position: 'fixed',
              left: hole.x0,
              top: hole.y0,
              width: hole.x1 - hole.x0,
              height: hole.y1 - hole.y0,
              border: '3px solid #f72585',
              borderRadius: 4,
            }}
          />
        </>
      ) : showFullDim ? (
        <div style={{ position: 'fixed', inset: 0, background: dim }} />
      ) : null}

      {/* Tooltip card */}
      <div
        className="snes-panel snes-panel--magenta"
        style={{ position: 'fixed', padding: '14px 16px', maxWidth: 'calc(100vw - 24px)', ...tipStyle }}
      >
        {/* Header: progress squares + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: progress.total }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  border: '2px solid #0a0814',
                  background: i < progress.current ? '#f72585' : '#0f0b1e',
                  boxShadow: i < progress.current ? '0 0 6px rgba(247,37,133,0.7)' : 'inset 1px 1px 0 #2a2350',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => {
              tutorialManager.skipTutorial();
              haptics.light();
            }}
            className="snes-pixel"
            style={{
              background: 'none',
              border: 'none',
              color: '#6f6796',
              fontSize: '7px',
              letterSpacing: 0,
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            Skip ✕
          </button>
        </div>

        {/* Content */}
        <h3 className="snes-pixel" style={{ fontSize: '11px', color: '#ffffff', margin: '0 0 8px', letterSpacing: 0, lineHeight: 1.5 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: '12px', color: '#b9b3d6', margin: 0, lineHeight: 1.55 }}>{step.body}</p>

        {/* Footer: button for 'button' gates, hint for tap/state gates */}
        {step.gate.kind === 'button' ? (
          <button
            onClick={() => {
              tutorialManager.advance();
              haptics.light();
            }}
            className="snes-btn snes-btn--sm"
            style={{ width: '100%', marginTop: '14px', minHeight: '40px' }}
          >
            {step.gate.label}
          </button>
        ) : (
          step.hint && (
            <p
              className="snes-pixel"
              style={{ fontSize: '8px', color: '#ffd23f', margin: '12px 0 0', letterSpacing: 0, lineHeight: 1.6, textAlign: 'center' }}
            >
              {step.hint}
            </p>
          )
        )}
      </div>

      <style>{`
        .tut-ring {
          box-shadow: 0 0 0 2px #0a0814, 0 0 18px 2px rgba(247, 37, 133, 0.65);
          animation: tut-ring-pulse 1.4s ease-in-out infinite;
        }
        @keyframes tut-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 2px #0a0814, 0 0 14px 1px rgba(247, 37, 133, 0.45); }
          50% { box-shadow: 0 0 0 2px #0a0814, 0 0 26px 4px rgba(247, 37, 133, 0.85); }
        }
      `}</style>
    </div>
  );
};

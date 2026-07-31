/**
 * ObjectivesModal — the run's optional challenges and live progress. Rewards are
 * meta fame only (banked at run end), so this is pure "what can I chase" surface.
 */

import React from 'react';
import { useGameStore } from '@stores/gameStore';
import { objectiveManager } from '@game/mechanics/ObjectiveManager';
import { SnesModal } from '@components/ui/SnesModal';
import { PixelIcon } from '@components/ui/PixelIcon';

interface ObjectivesModalProps {
  onClose: () => void;
}

export const ObjectivesModal: React.FC<ObjectivesModalProps> = ({ onClose }) => {
  const runObjectives = useGameStore((s) => s.runObjectives);
  const progress = runObjectives?.progress ?? [];
  const stats = runObjectives?.stats;

  return (
    <SnesModal
      onClose={onClose}
      title={
        <span className="snes-pixel" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: 0, lineHeight: 1.5 }}>
          <PixelIcon name="target" size={14} />
          Challenges
        </span>
      }
      ariaLabel="Challenges"
      maxWidth={460}
      accent="var(--snes-purple)"
    >
      <div>
        <p style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Optional goals for this run. Clearing one banks bonus Scene Points at the end — no effect on the run itself.
        </p>

        {progress.length === 0 ? (
          <p style={{ color: 'var(--snes-ink-mute)', textAlign: 'center', padding: '24px 12px', fontSize: '12px' }}>
            No challenges this run.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {progress.map((p) => {
              const def = objectiveManager.getDefinition(p.id);
              if (!def) return null;
              const blown = !p.completed && objectiveManager.isBlown(p.id, stats);
              // A blown avoidance goal must not sit at a hopeful full bar.
              const pct = blown ? 100 : Math.min(100, Math.round((p.current / p.target) * 100));
              const accent = p.completed
                ? 'var(--snes-green)'
                : blown
                  ? 'var(--snes-red)'
                  : 'var(--snes-purple)';
              return (
                <div key={p.id} className="snes-panel-inset" style={{ padding: '12px', opacity: p.completed ? 1 : 0.96 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px', marginBottom: '6px' }}>
                    <h3 className="snes-pixel" style={{ fontSize: '11px', color: p.completed ? 'var(--snes-green)' : 'var(--snes-ink)', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>
                      {p.completed ? '✓ ' : ''}{def.title}
                    </h3>
                    <span className="snes-pixel" style={{ fontSize: '10px', color: 'var(--snes-magenta)', letterSpacing: 0, flexShrink: 0 }}>
                      +{def.fameReward} SP
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', margin: '0 0 8px', lineHeight: 1.4 }}>{def.description}</p>
                  <div className="snes-progress" style={{ height: '8px' }}>
                    <div className="snes-progress__fill" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                  {!p.completed && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: blown ? 'var(--snes-red)' : 'var(--snes-ink-mute)', marginTop: '4px' }}>
                      <span>
                        {def.finalizeOnly && (blown ? 'Blown — no coming back from it' : 'Still clean — settles at run’s end')}
                      </span>
                      <span style={{ flexShrink: 0 }}>{def.finalizeOnly && p.target <= 1 ? '' : `${Math.min(p.current, p.target)}/${p.target}`}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SnesModal>
  );
};

export default ObjectivesModal;

/**
 * ObjectivesModal — the run's optional challenges and live progress. Rewards are
 * meta fame only (banked at run end), so this is pure "what can I chase" surface.
 */

import React from 'react';
import { useGameStore } from '@stores/gameStore';
import { objectiveManager } from '@game/mechanics/ObjectiveManager';
import { SnesModal } from '@components/ui/SnesModal';

interface ObjectivesModalProps {
  onClose: () => void;
}

export const ObjectivesModal: React.FC<ObjectivesModalProps> = ({ onClose }) => {
  const runObjectives = useGameStore((s) => s.runObjectives);
  const progress = runObjectives?.progress ?? [];

  return (
    <SnesModal onClose={onClose} title="🎯 Challenges" ariaLabel="Challenges" maxWidth={460} accent="#c77dff">
      <div>
        <p style={{ fontSize: '11px', color: '#6f6796', margin: '0 0 14px', lineHeight: 1.5 }}>
          Optional goals for this run. Clearing one banks bonus Scene Points at the end — no effect on the run itself.
        </p>

        {progress.length === 0 ? (
          <p style={{ color: '#6f6796', textAlign: 'center', padding: '24px 12px', fontSize: '12px' }}>
            No challenges this run.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {progress.map((p) => {
              const def = objectiveManager.getDefinition(p.id);
              if (!def) return null;
              const pct = Math.min(100, Math.round((p.current / p.target) * 100));
              const accent = p.completed ? '#3ad17e' : '#c77dff';
              return (
                <div key={p.id} className="snes-panel-inset" style={{ padding: '12px', opacity: p.completed ? 1 : 0.96 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px', marginBottom: '6px' }}>
                    <h3 className="snes-pixel" style={{ fontSize: '9px', color: p.completed ? '#3ad17e' : '#ffffff', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>
                      {p.completed ? '✓ ' : ''}{def.title}
                    </h3>
                    <span className="snes-pixel" style={{ fontSize: '8px', color: '#f472b6', letterSpacing: 0, flexShrink: 0 }}>
                      +{def.fameReward}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#b9b3d6', margin: '0 0 8px', lineHeight: 1.4 }}>{def.description}</p>
                  <div className="snes-progress" style={{ height: '8px' }}>
                    <div className="snes-progress__fill" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                  {!def.finalizeOnly && !p.completed && (
                    <div style={{ fontSize: '10px', color: '#6f6796', marginTop: '4px', textAlign: 'right' }}>
                      {p.current}/{p.target}
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

/**
 * RunEndScreen - end-of-run ceremony: verdict, final stats, score/fame, legacy.
 * Inline-styled (house style) and compact enough for landscape phones.
 */

import React from 'react';
import { RunEndState, RunEndReason } from '@game/constants/runConstants';
import { RunCeremony } from '@game/mechanics/TurnResolutionEngine';

interface RunEndScreenProps {
  result: RunEndState;
  /** Score/fame/legacy payload from the engine; null for informal runs */
  ceremony?: RunCeremony | null;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const RESULT_CONFIGS: Record<
  RunEndReason,
  {
    title: string;
    subtitle: string;
    icon: string;
    accent: string;
    gradient: string;
  }
> = {
  BREAKTHROUGH_WIN: {
    title: 'BREAKTHROUGH!',
    subtitle: 'From a moldy basement to the big stage. The scene will pretend it always believed in you.',
    icon: '🎸',
    accent: '#eab308',
    gradient: 'linear-gradient(180deg, #713f12 0%, #7c2d12 100%)',
  },
  BURNOUT_LOSS: {
    title: 'BURNOUT',
    subtitle: 'The stress was too much. Even your tinnitus needs a vacation.',
    icon: '😵',
    accent: '#ef4444',
    gradient: 'linear-gradient(180deg, #7f1d1d 0%, #111827 100%)',
  },
  EVICTION_LOSS: {
    title: 'EVICTED',
    subtitle: "Can't pay rent, can't book shows. Your parents' couch awaits.",
    icon: '🏠',
    accent: '#9ca3af',
    gradient: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
  },
  FADE_OUT_LOSS: {
    title: 'FADE OUT',
    subtitle: 'The scene moved on without you. Another name for the "whatever happened to..." thread.',
    icon: '👻',
    accent: '#a855f7',
    gradient: 'linear-gradient(180deg, #581c87 0%, #111827 100%)',
  },
};

export const RunEndScreen: React.FC<RunEndScreenProps> = ({
  result,
  ceremony,
  onPlayAgain,
  onMainMenu,
}) => {
  const config = RESULT_CONFIGS[result.reason];
  const isWin = result.reason === 'BREAKTHROUGH_WIN';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '12px',
      }}
    >
      <div
        style={{
          backgroundImage: config.gradient,
          border: `3px solid ${config.accent}`,
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '40px', lineHeight: 1 }}>{config.icon}</div>
          <div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 900,
                margin: 0,
                color: isWin ? '#fde047' : '#ffffff',
                letterSpacing: '0.02em',
              }}
            >
              {config.title}
            </h1>
            <p style={{ color: '#d1d5db', fontSize: '13px', margin: '2px 0 0' }}>
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px 20px' }}>
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              color: '#9ca3af',
              fontWeight: 700,
              marginBottom: '8px',
              letterSpacing: '0.06em',
            }}
          >
            Final Stats
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            <StatBox label="Turn" value={result.turn} suffix="/35" highlight={result.turn >= 31} />
            <StatBox label="Shows" value={result.finalStats.showsPlayed} icon="🎤" />
            <StatBox
              label="Reputation"
              value={result.finalStats.reputation}
              icon="⭐"
              highlight={result.finalStats.reputation >= 80}
            />
            <StatBox
              label="Fans"
              value={result.finalStats.fans}
              icon="👥"
              highlight={result.finalStats.fans >= 500}
            />
            <StatBox
              label="Money"
              value={result.finalStats.money}
              prefix="$"
              negative={result.finalStats.money < 0}
            />
            <StatBox
              label="Stress"
              value={result.finalStats.stress}
              suffix="/100"
              negative={result.finalStats.stress >= 80}
            />
          </div>
        </div>

        {/* Ceremony: score, fame, and scene legacy */}
        {ceremony && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '12px 20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    fontWeight: 700,
                  }}
                >
                  Final Score
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
                  {ceremony.score.toLocaleString()}
                  {ceremony.newHighScore && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#fde047',
                      }}
                    >
                      ★ NEW BEST
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    fontWeight: 700,
                  }}
                >
                  Fame Earned
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#f472b6' }}>
                  +{ceremony.fameEarned}
                </div>
              </div>
            </div>

            {ceremony.achievements.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {ceremony.achievements.map((a) => (
                  <div key={a.id} style={{ fontSize: '12px', color: '#fef08a' }}>
                    🏆 {a.name}
                    <span style={{ color: '#9ca3af' }}> — {a.description}</span>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#9ca3af',
                flexWrap: 'wrap',
                gap: '4px',
              }}
            >
              <span>
                Scene legacy: run #{ceremony.lifetime.totalRuns} ·{' '}
                {ceremony.lifetime.fame.toLocaleString()} fame banked
              </span>
              {(ceremony.nextRunBonuses.startingMoney > 0 ||
                ceremony.nextRunBonuses.startingReputation > 0) && (
                <span style={{ color: '#4ade80' }}>
                  Next run: +${ceremony.nextRunBonuses.startingMoney} · +
                  {ceremony.nextRunBonuses.startingReputation} rep
                </span>
              )}
            </div>
          </div>
        )}

        {/* Win condition reminder */}
        {!isWin && (
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.15)',
              padding: '8px 20px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            Win by reaching <span style={{ color: '#fde047' }}>80 reputation</span> and{' '}
            <span style={{ color: '#fde047' }}>500 fans</span> before turn 35
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: '12px' }}>
          <button
            onClick={onMainMenu}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Main Menu
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isWin ? '#ca8a04' : '#16a34a',
              color: isWin ? '#111827' : '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {isWin ? 'Play Again' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatBoxProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: string;
  highlight?: boolean;
  negative?: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  prefix = '',
  suffix = '',
  icon,
  highlight,
  negative,
}) => {
  const color = negative ? '#f87171' : highlight ? '#fde047' : '#ffffff';

  return (
    <div
      style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: '8px 10px',
      }}
    >
      <div
        style={{
          fontSize: '9px',
          color: '#9ca3af',
          textTransform: 'uppercase',
          marginBottom: '2px',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {icon && <span style={{ fontSize: '13px' }}>{icon}</span>}
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </div>
    </div>
  );
};

export default RunEndScreen;

/**
 * RunEndScreen - end-of-run ceremony: verdict, final stats, score/fame, legacy.
 * Inline-styled (house style) and compact enough for landscape phones.
 */

import React, { useEffect } from 'react';
import { RunEndState, RunEndReason } from '@game/constants/runConstants';
import { RunCeremony } from '@game/mechanics/TurnResolutionEngine';
import { audio } from '@utils/simpleAudio';
import { haptics } from '@utils/mobile';
import { PixelIcon } from '@components/ui/PixelIcon';

interface RunEndScreenProps {
  result: RunEndState;
  /** Score/fame/legacy payload from the engine; null for informal runs */
  ceremony?: RunCeremony | null;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  /** One-tap re-launch of the same mode at the next stake (a win that opened it). */
  onClimb?: () => void;
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
    icon: 'guitar',
    accent: 'var(--snes-gold)',
    gradient: 'linear-gradient(180deg, #713f12 0%, #7c2d12 100%)',
  },
  BURNOUT_LOSS: {
    title: 'BURNOUT',
    subtitle: 'The stress was too much. Even your tinnitus needs a vacation.',
    icon: 'skull',
    accent: 'var(--snes-red)',
    gradient: 'linear-gradient(180deg, #7f1d1d 0%, #111827 100%)',
  },
  EVICTION_LOSS: {
    title: 'EVICTED',
    subtitle: "Can't pay rent, can't book shows. Your parents' couch awaits.",
    icon: 'home',
    accent: '#9ca3af',
    gradient: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
  },
  FADE_OUT_LOSS: {
    title: 'FADE OUT',
    subtitle: 'The scene moved on without you. Another name for the "whatever happened to..." thread.',
    icon: 'skull',
    accent: 'var(--snes-purple)',
    gradient: 'linear-gradient(180deg, #581c87 0%, #111827 100%)',
  },
};

export const RunEndScreen: React.FC<RunEndScreenProps> = ({
  result,
  ceremony,
  onPlayAgain,
  onMainMenu,
  onClimb,
}) => {
  const config = RESULT_CONFIGS[result.reason];
  const isWin = result.reason === 'BREAKTHROUGH_WIN';
  // A win that opened the next stake → offer a one-tap climb (same mode, +1 stake).
  const canClimb = isWin && !!ceremony?.unlockedStakeName && !!onClimb;

  // The run's climax used to land in silence — ring it in (and harder on a win).
  useEffect(() => {
    if (isWin) {
      audio.achievement();
      haptics.success();
    } else {
      audio.error();
      haptics.heavy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Clear the notch / Dynamic Island (on a SIDE in landscape) + home indicator.
        padding: 'calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${config.title} — ${config.subtitle}`}
        style={{
          backgroundImage: config.gradient,
          border: `3px solid ${config.accent}`,
          borderRadius: 0, // SNES frame: square corners, void outer ring + hard drop
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.12), inset -2px -2px 0 0 rgba(0,0,0,0.5), 0 0 0 3px var(--snes-void), 6px 6px 0 0 var(--snes-void)',
        }}
      >
        {/* Scrollable body — keeps the action buttons pinned on short
            (landscape phone) viewports */}
        <div style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: '14px 20px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ lineHeight: 1, color: config.accent, flexShrink: 0 }}>
            <PixelIcon name={config.icon} size={36} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              className="snes-pixel"
              style={{
                fontSize: '16px',
                margin: 0,
                color: isWin ? 'var(--snes-gold)' : 'var(--snes-ink)',
                letterSpacing: 0,
                lineHeight: 1.35,
              }}
            >
              {config.title}
            </h1>
            <p style={{ color: 'var(--snes-ink-dim)', fontSize: '13px', margin: '6px 0 0' }}>
              {config.subtitle}
            </p>
          </div>
          {/* Grade reveal — graded by the stake you beat (Open Mic→C … No Future→S),
              bumped a letter by a new high score. The run's emotional payoff. */}
          {(() => {
            const GRADES = ['C', 'B', 'A', 'S'];
            const GRADE_COLOR: Record<string, string> = { S: 'var(--snes-gold)', A: 'var(--snes-purple)', B: 'var(--snes-cyan)', C: 'var(--snes-green)', F: 'var(--snes-red)' };
            const idx = Math.min(3, (ceremony?.stakeTier ?? 0) + (ceremony?.newHighScore ? 1 : 0));
            const grade = isWin ? GRADES[idx] : 'F';
            const color = GRADE_COLOR[grade];
            return (
              <div
                className={`btb-pop${grade === 'S' ? ' btb-glow' : ''}`}
                style={{
                  flexShrink: 0,
                  width: '58px',
                  height: '58px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${color}`,
                  color,
                  fontSize: '34px',
                  fontWeight: 900,
                  lineHeight: 1,
                  background: 'rgba(0,0,0,0.35)',
                  boxShadow: `0 0 12px 0 ${color}66`,
                }}
                aria-label={`Grade ${grade}`}
              >
                {grade}
              </div>
            );
          })()}
        </div>

        {/* Stats */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px 20px' }}>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--snes-ink-dim)',
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
            <StatBox label="Turn" value={result.turn} suffix={`/${result.maxTurns}`} highlight={result.turn >= result.maxTurns - 4} />
            <StatBox label="Shows" value={result.finalStats.showsPlayed} icon="note" />
            <StatBox
              label="Reputation"
              value={result.finalStats.reputation}
              icon="fame"
              highlight={result.finalStats.reputation >= 80}
            />
            <StatBox
              label="Fans"
              value={result.finalStats.fans}
              icon="fans"
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
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: 'var(--snes-ink-dim)',
                    fontWeight: 700,
                  }}
                >
                  Final Score
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--snes-ink)' }}>
                  {ceremony.score.toLocaleString()}
                  {ceremony.newHighScore && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: 'var(--snes-gold)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <PixelIcon name="fame" size={12} /> NEW BEST
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: 'var(--snes-ink-dim)',
                    fontWeight: 700,
                  }}
                >
                  Scene Points Earned
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--snes-magenta)' }}>
                  +{ceremony.fameEarned}
                </div>
                {ceremony.stakeFameMult > 1 && (
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--snes-gold)' }}>
                    stake bonus ×{ceremony.stakeFameMult}
                  </div>
                )}
              </div>
            </div>

            {isWin && ceremony.stakesCleared > 0 && (
              <div
                className="btb-pop"
                style={{
                  marginTop: '10px', padding: '10px 12px',
                  border: '2px solid var(--snes-cyan)', background: 'rgba(76,201,240,0.12)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <PixelIcon name="trophy" size={18} color="var(--snes-cyan)" />
                <span style={{ fontSize: '12px', color: '#cdeffd', fontWeight: 700 }}>
                  Stakes cleared this mode:{' '}
                  <span style={{ color: 'var(--snes-cyan)' }}>{ceremony.stakesCleared}/{ceremony.stakeCount}</span>
                </span>
              </div>
            )}

            {ceremony.achievements.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {ceremony.achievements.map((a) => (
                  <div key={a.id} style={{ fontSize: '12px', color: 'var(--snes-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PixelIcon name="trophy" size={12} />
                    <span>{a.name}<span style={{ color: 'var(--snes-ink-dim)' }}> — {a.description}</span></span>
                  </div>
                ))}
              </div>
            )}

            {ceremony.completedObjectives.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--snes-ink-dim)', fontWeight: 700, marginBottom: '2px' }}>
                  Challenges Cleared (+{ceremony.objectiveBonus} Scene Points)
                </div>
                {ceremony.completedObjectives.map((o) => (
                  <div key={o.id} style={{ fontSize: '12px', color: 'var(--snes-purple)', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><PixelIcon name="target" size={12} /> {o.title}</span>
                    <span style={{ color: 'var(--snes-magenta)', flexShrink: 0 }}>+{o.fameReward}</span>
                  </div>
                ))}
              </div>
            )}

            {ceremony.unlockedStakeName && (
              <div
                className="btb-pop"
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  border: '2px solid var(--snes-purple)',
                  background: 'rgba(199,125,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PixelIcon name="fire" size={18} color="var(--snes-purple)" />
                <span style={{ fontSize: '12px', color: '#e9d5ff', fontWeight: 700 }}>
                  New stake unlocked: <span style={{ color: 'var(--snes-purple)' }}>{ceremony.unlockedStakeName}</span> — play it for a tougher run.
                </span>
              </div>
            )}

            {ceremony.unlockedModeName && (
              <div
                className="btb-pop"
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  border: '2px solid var(--snes-gold)',
                  background: 'rgba(255,210,63,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PixelIcon name="unlock" size={18} color="var(--snes-gold)" />
                <span style={{ fontSize: '12px', color: '#fff3c4', fontWeight: 700 }}>
                  New mode unlocked: <span style={{ color: 'var(--snes-gold)' }}>{ceremony.unlockedModeName}</span>! Choose it from New Game.
                </span>
              </div>
            )}

            {ceremony.unlockedBandNames.length > 0 && (
              <div
                className="btb-pop"
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  border: '2px solid var(--snes-green)',
                  background: 'rgba(58,209,126,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PixelIcon name="guitar" size={18} color="var(--snes-green)" />
                <span style={{ fontSize: '12px', color: '#c8f5dd', fontWeight: 700 }}>
                  {ceremony.unlockedBandNames.length === 1
                    ? <>New band unlocked: <span style={{ color: 'var(--snes-green)' }}>{ceremony.unlockedBandNames[0]}</span> — sign them next run!</>
                    : <>{ceremony.unlockedBandNames.length} new bands unlocked: <span style={{ color: 'var(--snes-green)' }}>{ceremony.unlockedBandNames.join(', ')}</span>!</>}
                </span>
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
                color: 'var(--snes-ink-dim)',
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
                <span style={{ color: 'var(--snes-green)' }}>
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
              color: 'var(--snes-ink-dim)',
            }}
          >
            Win by hitting this mode's <span style={{ color: 'var(--snes-gold)' }}>reputation and fan targets</span>{' '}
            before turn <span style={{ color: 'var(--snes-gold)' }}>{result.maxTurns}</span>
          </div>
        )}
        </div>
        {/* End scrollable body */}

        {/* Actions (pinned footer) */}
        <div
          style={{
            padding: '12px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}
        >
          {canClimb && (
            <button
              onClick={onClimb}
              className="snes-pixel btb-press"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'var(--snes-purple)',
                color: '#f7efe0',
                border: '2px solid var(--snes-void)',
                borderRadius: 0,
                boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.4), inset -2px -2px 0 0 rgba(0,0,0,0.4)',
                fontSize: '11px',
                letterSpacing: 0,
                cursor: 'pointer',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <PixelIcon name="play" size={12} /> Climb · {ceremony?.unlockedStakeName}
            </button>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onMainMenu}
            className="snes-pixel"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'var(--snes-bg)',
              color: 'var(--snes-ink)',
              border: '2px solid var(--snes-void)',
              borderRadius: 0,
              boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
              fontSize: '10px',
              letterSpacing: 0,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Main Menu
          </button>
          <button
            onClick={onPlayAgain}
            className="snes-pixel"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isWin ? 'var(--snes-gold)' : 'var(--snes-green)',
              color: isWin ? '#1e1509' : '#f7efe0',
              border: '2px solid var(--snes-void)',
              borderRadius: 0,
              boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.4), inset -2px -2px 0 0 rgba(0,0,0,0.4)',
              fontSize: '10px',
              letterSpacing: 0,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {canClimb ? 'New Game' : isWin ? 'Play Again' : 'Try Again'}
          </button>
          </div>
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
  const color = negative ? 'var(--snes-red)' : highlight ? 'var(--snes-gold)' : 'var(--snes-ink)';

  return (
    <div
      style={{
        backgroundColor: 'var(--snes-bg-2)',
        border: '2px solid var(--snes-void)',
        boxShadow: 'inset 1px 1px 0 0 var(--snes-line)',
        borderRadius: 0,
        padding: '8px 10px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'var(--snes-ink-dim)',
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
        {icon && <PixelIcon name={icon} size={13} />}
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </div>
    </div>
  );
};

export default RunEndScreen;

/**
 * RunEndScreen - end-of-run ceremony: verdict, final stats, score/fame, legacy.
 * Inline-styled (house style) and compact enough for landscape phones.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  RunEndState,
  RunEndReason,
  BREAKTHROUGH_REPUTATION_THRESHOLD,
  BREAKTHROUGH_FANS_THRESHOLD,
} from '@game/constants/runConstants';
import { RunCeremony } from '@game/mechanics/TurnResolutionEngine';
import { runManager, WinCondition } from '@game/mechanics/RunManager';
import { stakesManager, STAKE_TIERS } from '@game/mechanics/StakesManager';
import { initialBands } from '@/data/initialBands';
import { audio } from '@utils/simpleAudio';
import { safeStorage } from '@utils/safeStorage';
import { haptics } from '@utils/mobile';
import { PixelIcon } from '@components/ui/PixelIcon';
import { BandLogo } from '@components/ui/BandLogo';

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
  }
> = {
  BREAKTHROUGH_WIN: {
    title: 'BREAKTHROUGH!',
    subtitle: 'From a moldy basement to the big stage. The scene will pretend it always believed in you.',
    icon: 'guitar',
    accent: 'var(--snes-gold)',
  },
  BURNOUT_LOSS: {
    title: 'BURNOUT',
    subtitle: 'The stress was too much. Even your tinnitus needs a vacation.',
    icon: 'skull',
    accent: 'var(--snes-red)',
  },
  EVICTION_LOSS: {
    title: 'EVICTED',
    subtitle: "Can't pay rent, can't book shows. Your parents' couch awaits.",
    icon: 'home',
    accent: '#9ca3af',
  },
  FADE_OUT_LOSS: {
    title: 'FADE OUT',
    subtitle: 'The scene moved on without you. Another name for the "whatever happened to..." thread.',
    icon: 'skull',
    accent: 'var(--snes-purple)',
  },
};

// Ceremony pacing: unlock chips land one at a time, the grade slams in LAST.
const CHIP_BASE_MS = 350;
const CHIP_STEP_MS = 240;

const BAND_BY_NAME = new Map(initialBands.map((b) => [b.name, b]));
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
/** First sentence of a bio — the reveal tease (full bio waits in the roster). */
const bioTease = (bio?: string): string | null =>
  bio ? bio.match(/^[^.!?]*[.!?]/)?.[0] ?? bio : null;

/** 'bills' progress isn't in RunEndState (the engine nulls the run before this
 *  screen mounts) — read it off the just-saved run-history entry instead. */
const lastRunBills = (): number | null => {
  try {
    const raw = safeStorage.getItem('btb-run-history');
    const hist = raw ? (JSON.parse(raw) as { stats?: { billsCreated?: number } }[]) : [];
    const bills = hist[hist.length - 1]?.stats?.billsCreated;
    return typeof bills === 'number' ? bills : null;
  } catch {
    return null;
  }
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

  // The mode's REAL win conditions (per-mode targets — never hardcode Classic's).
  const modeConfig = useMemo(
    () => (ceremony ? runManager.getRunConfigs().find((c) => c.id === ceremony.configId) ?? null : null),
    [ceremony],
  );
  const targetOf = (type: WinCondition['type']): number | null =>
    modeConfig?.winConditions.find((w) => w.type === type)?.target ?? null;
  const repTarget = targetOf('reputation') ?? BREAKTHROUGH_REPUTATION_THRESHOLD;
  const fansTarget = targetOf('fans') ?? BREAKTHROUGH_FANS_THRESHOLD;

  // Per-condition progress so a loss teaches: WHICH bar was missed, and by how much.
  const winProgress = useMemo(() => {
    if (!modeConfig) return [];
    const currentOf = (type: WinCondition['type']): number | null => {
      switch (type) {
        case 'reputation': return result.finalStats.reputation;
        case 'fans': return result.finalStats.fans;
        case 'money': return result.finalStats.money;
        case 'shows': return result.finalStats.showsPlayed;
        case 'bills': return lastRunBills();
        default: return null;
      }
    };
    return modeConfig.winConditions
      .map((w) => ({ description: w.description, target: w.target, current: currentOf(w.type) }))
      .filter((p): p is { description: string; target: number; current: number } => p.current !== null);
  }, [modeConfig, result]);

  // Fresh band unlocks get a REAL reveal (logo + bio tease) — the logos are the reward.
  const unlockedBands = useMemo(
    () => (ceremony?.unlockedBandNames ?? []).map((name) => ({ name, band: BAND_BY_NAME.get(name) ?? null })),
    [ceremony],
  );

  // Climb is offered on EVERY win where a higher stake sits open (grinding a
  // cleared stake is normal) — not just the first clear that unlocked it.
  const nextTier = (ceremony?.stakeTier ?? 0) + 1;
  const nextStakeName =
    isWin && ceremony && nextTier < ceremony.stakeCount && stakesManager.isUnlocked(ceremony.configId, nextTier)
      ? STAKE_TIERS[nextTier].name
      : null;
  const canClimb = !!nextStakeName && !!onClimb;

  // Stagger the unlock chips in DOM order; the grade lands after the last one.
  const chipCount =
    (isWin && (ceremony?.stakesCleared ?? 0) > 0 ? 1 : 0) +
    (ceremony?.unlockedStakeName ? 1 : 0) +
    (ceremony?.unlockedModeName ? 1 : 0) +
    unlockedBands.length;
  const gradeDelayMs = CHIP_BASE_MS + chipCount * CHIP_STEP_MS + 260;
  let chipIdx = 0;
  const chipDelay = (): React.CSSProperties => ({ animationDelay: `${CHIP_BASE_MS + chipIdx++ * CHIP_STEP_MS}ms` });

  // The run's climax used to land in silence — ring it in (and harder on a win):
  // arpeggio on mount, sparkle as the chips land, fanfare on the grade slam.
  useEffect(() => {
    const timers: number[] = [];
    if (isWin) {
      audio.achievement();
      haptics.success();
      if (chipCount > 0) timers.push(window.setTimeout(() => audio.synergy(), CHIP_BASE_MS));
      timers.push(window.setTimeout(() => { audio.soldOut(); haptics.medium(); }, gradeDelayMs));
    } else {
      audio.error();
      haptics.heavy();
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
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
          /* Paper sheet per skin — the win/loss identity lives in the accent
             border + title, not a dark legacy gradient (which drowned the text). */
          backgroundColor: 'var(--snes-bg)',
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
              bumped a letter by a new high score. The run's emotional payoff, so it
              slams in LAST, after every unlock chip has landed. (Glow lives on an
              inner span: btb-pop and btb-glow both set `animation`, so stacking
              them on one element would cancel the pop.) */}
          {(() => {
            const GRADES = ['C', 'B', 'A', 'S'];
            const GRADE_COLOR: Record<string, string> = { S: 'var(--snes-gold)', A: 'var(--snes-purple)', B: 'var(--snes-cyan)', C: 'var(--snes-green)', F: 'var(--snes-red)' };
            const idx = Math.min(3, (ceremony?.stakeTier ?? 0) + (ceremony?.newHighScore ? 1 : 0));
            const grade = isWin ? GRADES[idx] : 'F';
            const color = GRADE_COLOR[grade];
            return (
              <div
                className="btb-pop"
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
                  background: 'var(--snes-bg-2)',
                  boxShadow: `0 0 12px 0 ${color}66`,
                  animationDelay: `${gradeDelayMs}ms`,
                }}
                aria-label={`Grade ${grade}`}
              >
                <span className={grade === 'S' ? 'btb-glow' : undefined}>{grade}</span>
              </div>
            );
          })()}
        </div>

        {/* Stats */}
        <div style={{ backgroundColor: 'var(--snes-bg-2)', padding: '12px 20px' }}>
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
              highlight={result.finalStats.reputation >= repTarget}
            />
            <StatBox
              label="Fans"
              value={result.finalStats.fans}
              icon="fans"
              highlight={result.finalStats.fans >= fansTarget}
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
          <div style={{ backgroundColor: 'var(--snes-bg-2)', padding: '12px 20px' }}>
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
                  <CountUp value={ceremony.score} />
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
                  <CountUp value={ceremony.fameEarned} prefix="+" />
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
                  ...chipDelay(),
                  marginTop: '10px', padding: '10px 12px',
                  border: '2px solid var(--snes-cyan)', background: 'rgba(76,201,240,0.12)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <PixelIcon name="trophy" size={18} color="var(--snes-cyan)" />
                <span style={{ fontSize: '12px', color: 'var(--snes-ink)', fontWeight: 700 }}>
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
                  ...chipDelay(),
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
                <span style={{ fontSize: '12px', color: 'var(--snes-ink)', fontWeight: 700 }}>
                  New stake unlocked: <span style={{ color: 'var(--snes-purple)' }}>{ceremony.unlockedStakeName}</span> — play it for a tougher run.
                </span>
              </div>
            )}

            {ceremony.unlockedModeName && (
              <div
                className="btb-pop"
                style={{
                  ...chipDelay(),
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
                <span style={{ fontSize: '12px', color: 'var(--snes-ink)', fontWeight: 700 }}>
                  New mode unlocked: <span style={{ color: 'var(--snes-gold)' }}>{ceremony.unlockedModeName}</span>! Choose it from New Game.
                </span>
              </div>
            )}

            {/* Band unlocks are a REVEAL, not a log line: each fresh band gets its
                logo lockup + genre + a one-sentence bio tease. Sign them next run. */}
            {unlockedBands.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--snes-green)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.06em' }}>
                  <PixelIcon name="guitar" size={14} color="var(--snes-green)" />
                  {unlockedBands.length === 1 ? 'New band unlocked — sign them next run!' : `${unlockedBands.length} new bands unlocked — sign them next run!`}
                </div>
                {unlockedBands.map(({ name, band }) => (
                  <div
                    key={name}
                    className="btb-pop"
                    style={{
                      ...chipDelay(),
                      marginBottom: '6px',
                      padding: '8px 12px',
                      border: '2px solid var(--snes-green)',
                      background: 'rgba(58,209,126,0.12)',
                    }}
                  >
                    {band ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <BandLogo band={band} variant="card" style={{ color: 'var(--snes-ink)' }} />
                          <span className="snes-pixel" style={{ flexShrink: 0, fontSize: '9px', color: 'var(--snes-green)', letterSpacing: 0, border: '2px solid var(--snes-green)', padding: '2px 5px' }}>
                            {titleCase(band.genre)}
                          </span>
                        </div>
                        {bioTease(band.bio) && (
                          <p style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', margin: '4px 0 0', lineHeight: 1.4 }}>
                            {bioTease(band.bio)}
                          </p>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--snes-ink)', fontWeight: 700 }}>
                        New band unlocked: <span style={{ color: 'var(--snes-green)' }}>{name}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid var(--snes-ink-mute)',
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

        {/* Loss teaching: the mode's REAL win conditions with live progress, so a
            FADE_OUT says exactly which bar was missed and how close it was. */}
        {!isWin && (
          <div style={{ backgroundColor: 'var(--snes-bg-2)', padding: '10px 20px 12px' }}>
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
              The win needed — by turn <span style={{ color: 'var(--snes-gold)' }}>{result.maxTurns}</span>
            </div>
            {winProgress.length > 0 ? (
              winProgress.map((p) => {
                const met = p.current >= p.target;
                const pct = Math.max(0, Math.min(100, Math.round((p.current / p.target) * 100)));
                return (
                  <div key={p.description} style={{ marginBottom: '7px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--snes-ink)' }}>{p.description}</span>
                      <span style={{ color: met ? 'var(--snes-green)' : 'var(--snes-gold)', fontWeight: 700, flexShrink: 0 }}>
                        {p.current.toLocaleString()}/{p.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="snes-progress">
                      <div
                        className="snes-progress__fill"
                        style={{ width: `${pct}%`, background: met ? 'var(--snes-green)' : 'var(--snes-gold)' }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--snes-ink-dim)' }}>
                Win by hitting this mode's targets before the final turn.
              </div>
            )}
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
            backgroundColor: 'var(--snes-bg-2)',
          }}
        >
          {canClimb && (
            <button
              onClick={onClimb}
              className="snes-btn"
              style={{
                width: '100%',
                minHeight: '48px',
              }}
            >
              <PixelIcon name="play" size={12} /> Climb · {nextStakeName}
            </button>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onMainMenu}
            className="snes-btn snes-btn--ghost"
            style={{
              flex: 1,
              minHeight: '44px',
            }}
          >
            Main Menu
          </button>
          <button
            onClick={onPlayAgain}
            className={isWin ? 'snes-btn snes-btn--gold' : 'snes-btn snes-btn--green'}
            style={{
              flex: 1,
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

/** Rolls a number up from 0 — the score/fame payout should feel COUNTED, not stated. */
const CountUp: React.FC<{ value: number; duration?: number; prefix?: string }> = ({
  value,
  duration = 700,
  prefix = '',
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - k, 3)))); // ease-out cubic
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <>
      {prefix}
      {display.toLocaleString()}
    </>
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

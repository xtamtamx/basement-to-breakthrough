import React, { useEffect, useState } from 'react';
import { ShowResult } from '@game/types';
import { SnesModal } from '@components/ui/SnesModal';
import { useGameStore } from '@stores/gameStore';
import { pickTurnHeadline, getTurnSceneLine } from '@game/data/satiricalText';
import { STARTER_SYNERGIES, type SynergyTriggerResult } from '@game/mechanics/SynergyManager';
import { COMBO_CATALOG } from '@game/mechanics/SynergyEngine';
import { objectiveManager } from '@game/mechanics/ObjectiveManager';
import { FACTION_DISPLAY_COLOR, FACTION_SHORT_NAME } from '@game/world/factionDisplay';

// Maps an instinct id → a player-readable "fires at" label, so the results modal
// can teach WHEN/WHY an instinct kicked in (not just what it did).
const TRIGGER_LABEL: Record<string, string> = {
  TURN_START: 'turn start', TURN_END: 'turn end', SHOW_START: 'show start', SHOW_END: 'show end', PASSIVE: 'always on',
};
const instinctTriggerLabel = (id: string): string | null => {
  const j = STARTER_SYNERGIES.find((s) => s.id === id);
  return j ? (TRIGGER_LABEL[j.trigger] ?? j.trigger.toLowerCase()) : null;
};
import { audio } from '@utils/simpleAudio';
import { haptics } from '@utils/mobile';
import { mapFx } from '@components/effects/mapFxBus';
import { PixelIcon } from '@components/ui/PixelIcon';
import { Users, DollarSign, Star } from 'lucide-react';

interface TurnResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showResults: ShowResult[];
  /** Flat living costs + equipment upkeep for the turn */
  totalUpkeep: number;
  /** The turn just resolved — seeds the deterministic headline/footer copy. */
  turn?: number;
  /** The endgame pressure window is live (its warning renders in the danger strip). */
  isEscalation?: boolean;
  /** Engine warnings — eviction fuse, escalation, burnout (the run's tension coda). */
  warnings?: string[];
  /** Venues newly opened by this turn's rep climb ("name (N cap)") — the ascent beat. */
  venueUnlocks?: string[];
  /** Optional run challenges completed THIS turn (mid-run payoff beat). */
  objectivesCompleted?: { id: string; name: string }[];
  /** Per-faction standing deltas from tonight's bookings (turn-level attribution). */
  factionShifts?: { id: string; delta: number }[];
  dayJobResult?: {
    money: number;
    reputationLoss: number;
    fanLoss: number;
    stressGain: number;
    message: string;
    randomEvent?: {
      message: string;
      effects: unknown;
    };
  };
  difficultyEvent?: {
    message: string;
    reputationLost: number;
  };
  /** Equipped-synergy (player-facing: "instinct") triggers that fired this turn. */
  synergyEffects?: SynergyTriggerResult[];
  /** Per-turn passive payout from owned gear + sellout landmarks. */
  passiveIncome?: { money: number; fans: number };
}

/** Animated count-up for the payoff numbers — tweens 0→value (ease-out) on mount.
 *  Mounts/unmounts with the modal, so its hooks are always rules-of-hooks safe.
 *  Honors prefers-reduced-motion by snapping straight to the value. */
const CountUp: React.FC<{ value: number; plus?: boolean; duration?: number }> = ({ value, plus, duration = 550 }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || value === 0) { setV(value); return; }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
      else setV(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{plus && value >= 0 ? '+' : ''}{v}</>;
};

// Staged reveal (Balatro-style build): shows pop first, then the fan/rep tallies,
// then the money tally (the biggest number lands last), then the extras. Tap
// anywhere in the report to skip to the full breakdown.
const REVEAL_DONE = 4;
const REVEAL_DELAYS_MS = [250, 550, 850, 1150];

/** '+5' / '-1.5' — standings move in 0.3× ally/enemy cascades, so keep one decimal
 *  when fractional rather than lying by rounding to 0. */
const fmtShift = (d: number) => `${d > 0 ? '+' : ''}${Number.isInteger(d) ? d : d.toFixed(1)}`;

/** "Basement Magic — +25% crowd, +6 rep" for a discovered combo id (the discovery
 *  beat must NAME what was found, or it teaches nothing). */
const comboBlurb = (id: string): string => {
  const c = COMBO_CATALOG.find((x) => x.id === id);
  if (!c) return id;
  const parts = [`+${Math.round((c.multiplier - 1) * 100)}% crowd`];
  if (c.reputationBonus > 0) parts.push(`+${c.reputationBonus} rep`);
  return `${c.name} — ${parts.join(', ')}`;
};

export const TurnResultsModal: React.FC<TurnResultsModalProps> = ({
  isOpen,
  onClose,
  showResults = [],
  totalUpkeep = 0,
  turn = 0,
  isEscalation = false,
  warnings = [],
  venueUnlocks = [],
  objectivesCompleted = [],
  factionShifts = [],
  dayJobResult,
  difficultyEvent,
  synergyEffects = [],
  passiveIncome
}) => {
  const allBands = useGameStore((state) => state.allBands);
  const venues = useGameStore((state) => state.venues);
  const scheduledShows = useGameStore((state) => state.scheduledShows);
  const showHistory = useGameStore((state) => state.showHistory);
  // A synergy-offer or event modal opens right after this report is dismissed and
  // plays its own entrance sound — so we let it own the "something special" cue.
  const followUpModalPending = useGameStore(
    (state) => state.pendingSynergyOffer != null || state.pendingEventCard != null,
  );

  const getShowDetails = (showId: string) => {
    // A resolved show is moved out of scheduledShows into showHistory before this
    // modal renders, so fall back to history — otherwise every result row reads
    // "Unknown Band @ Unknown Venue".
    const show =
      scheduledShows.find((s) => s.id === showId) ??
      showHistory.find((s) => s.id === showId);
    const band = show ? allBands.find((b) => b.id === show.bandId) : undefined;
    const venue = show ? venues.find((v) => v.id === show.venueId) : undefined;
    return {
      bandName: band?.name ?? 'Unknown Band',
      venueName: venue?.name ?? 'Unknown Venue',
      capacity: venue?.capacity ?? 0,
    };
  };

  const totalRevenue = showResults.reduce((sum, result) => sum + result.revenue, 0);
  const totalCosts = showResults.reduce((sum, result) => sum + result.financials.costs, 0) + totalUpkeep;
  const totalProfit = totalRevenue - totalCosts;
  // Include passive fans (gear/landmarks) so the Fans box matches the real
  // balance change — otherwise passive fan gain is buried in a footnote.
  const totalFans =
    showResults.reduce((sum, result) => sum + result.fansGained, 0) + (passiveIncome?.fans ?? 0);
  const totalRep = showResults.reduce((sum, result) => sum + (result.reputationChange ?? result.reputationGain ?? 0), 0);

  const getTurnResultMessage = () => {
    if (showResults.length === 0) return pickTurnHeadline('NO_SHOWS', turn);
    if (totalProfit > 100) return pickTurnHeadline('GREAT_NIGHT', turn);
    if (totalProfit > 0) return pickTurnHeadline('DECENT_NIGHT', turn);
    if (totalProfit > -50) return pickTurnHeadline('BROKE_EVEN', turn);
    return pickTurnHeadline('BAD_NIGHT', turn);
  };

  const getReputationMessage = () => {
    if (totalRep > 10) return pickTurnHeadline('REPUTATION_UP', turn);
    if (totalRep < -10) return pickTurnHeadline('REPUTATION_DOWN', turn);
    return "";
  };

  const anySoldOut = showResults.some((r) => {
    const d = getShowDetails(r.showId);
    return d.capacity > 0 && r.attendance >= d.capacity;
  });
  const anyDiscovery = showResults.some((r) => (r.combosDiscovered?.length ?? 0) > 0);
  const anyIncident = showResults.some((r) => r.incidentOccurred);

  // The engine routes the touring-gated "NEW CITY UNLOCKED" line through warnings,
  // but it's a celebration, not a threat — split it out of the danger strip.
  const cityUnlocks = warnings.filter((w) => w.startsWith('NEW CITY'));
  const dangerWarnings = warnings.filter((w) => !w.startsWith('NEW CITY'));
  const hasCelebration =
    venueUnlocks.length > 0 || objectivesCompleted.length > 0 || cityUnlocks.length > 0;

  const bigNight = anySoldOut || anyDiscovery || totalProfit > 100 || hasCelebration;

  // Staged reveal — see REVEAL_DELAYS_MS above. Reduced-motion (and empty rent
  // turns, which have nothing to build to) snap straight to the full report.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || showResults.length === 0) { setStage(REVEAL_DONE); return; }
    setStage(0);
    const timers = REVEAL_DELAYS_MS.map((ms, i) =>
      setTimeout(() => setStage((s) => Math.max(s, i + 1)), ms),
    );
    return () => timers.forEach(clearTimeout);
    // Restart the sequence once per open (showResults is a snapshot of this turn).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Closing reveals the map behind this overlay — so fire the celebratory burst
  // HERE (not while open + hidden). Discovery = spark, a big night = confetti;
  // both can co-fire. No-op when the FX layer is off (mapFx bus is null).
  const closeWithBurst = () => {
    if (anyDiscovery) mapFx.burst(null, null, { kind: 'spark', colors: [0xffd23f, 0xc77dff] });
    if (anySoldOut || totalProfit > 100) mapFx.burst(null, null, { kind: 'confetti' });
    onClose();
  };

  // The turn used to resolve in silence. Fire one outcome-tiered stinger + a
  // matching haptic when the report opens, so a great night actually lands.
  useEffect(() => {
    if (!isOpen) return;
    if (hasCelebration) audio.achievement();
    else if (anyDiscovery && !followUpModalPending) audio.synergy();
    else if (anySoldOut) audio.soldOut();
    else if (totalProfit > 100) audio.coin();
    else if (totalProfit >= 0) audio.success();
    else audio.error();
    if ((totalProfit >= 0 && !anyIncident) || hasCelebration) haptics.success();
    else haptics.error();
    // Fire once per open; the derived flags are snapshots of this turn's result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <SnesModal
      onClose={closeWithBurst}
      ariaLabel="Turn results"
      maxWidth={500}
      accent={bigNight ? 'var(--snes-gold)' : (dangerWarnings.length > 0 || isEscalation) ? 'var(--snes-red)' : 'var(--snes-magenta)'}
      title={
        <span className={`snes-pixel${bigNight ? ' btb-shake' : ''}`} style={{
          fontSize: '12px',
          color: bigNight ? 'var(--snes-gold)' : 'var(--snes-magenta)',
          letterSpacing: 0,
          lineHeight: 1.5,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>{anySoldOut ? <><PixelIcon name="soldout" size={14} />Sold-Out Night!</> : 'Post-Show Damage Report'}</span>
      }
      footer={
        <button
          onClick={closeWithBurst}
          className="snes-btn"
          style={{
            width: '100%',
            minHeight: '44px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Continue
        </button>
      }
    >
          {/* Content — tap anywhere to skip the staged reveal */}
          <div style={{ padding: '8px' }} onClick={() => setStage(REVEAL_DONE)}>
            {/* Danger strip — escalation / eviction fuse / burnout. The engine
                computes these every turn; they must be LOUD, not a loss-screen
                surprise. */}
            {dangerWarnings.length > 0 && (
              <div style={{
                backgroundColor: 'var(--snes-bg-2)',
                padding: '10px 12px',
                marginBottom: '12px',
                border: '2px solid var(--snes-red)',
                borderLeft: '4px solid var(--snes-red)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {dangerWarnings.map((w) => (
                  <div key={w} className="snes-pixel" style={{
                    fontSize: '10px', color: 'var(--snes-red)', letterSpacing: 0, lineHeight: 1.6,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <PixelIcon name="warning" size={12} style={{ flexShrink: 0 }} /> {w}
                  </div>
                ))}
              </div>
            )}

            {/* Turn Summary Message */}
            <div style={{
              backgroundColor: 'var(--snes-bg-2)',
              borderRadius: 0,
              padding: '16px',
              marginBottom: '20px',
              border: '2px solid var(--snes-void)',
              borderLeft: '4px solid var(--snes-magenta)'
            }}>
              <p style={{
                color: 'var(--snes-ink-dim)',
                fontSize: '13px',
                lineHeight: '1.6',
                margin: 0,
                fontStyle: 'italic'
              }}>{getTurnResultMessage()}</p>
              {getReputationMessage() && (
                <p style={{
                  color: 'var(--snes-ink-dim)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  margin: '8px 0 0 0',
                  fontStyle: 'italic'
                }}>{getReputationMessage()}</p>
              )}
            </div>

            {/* Show Results — first beat of the reveal */}
            {stage >= 1 && showResults.length > 0 && (
              <div className="btb-pop" style={{ marginBottom: '20px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px',
                  color: 'var(--snes-ink)',
                  marginTop: 0,
                  marginBottom: '12px',
                  letterSpacing: 0,
                  lineHeight: 1.4
                }}>Tonight's Shows</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {showResults.map((result, index) => {
                    const details = getShowDetails(result.showId);
                    // Names of combos first discovered TONIGHT — their chips go
                    // gold while already-known combos stay green.
                    const newComboNames = new Set(
                      (result.combosDiscovered ?? []).map((id) => COMBO_CATALOG.find((c) => c.id === id)?.name ?? id),
                    );
                    return (
                    <div key={index} className="snes-panel-inset" style={{
                      padding: '12px',
                      fontSize: '14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <span style={{ color: 'var(--snes-ink)', fontWeight: '500', fontSize: '13px' }}>
                          {details.bandName} @ {details.venueName}
                        </span>
                        <span className="snes-pixel" style={{
                          fontSize: '11px',
                          letterSpacing: 0,
                          color: result.revenue - result.financials.costs > 0 ? 'var(--snes-green)' : 'var(--snes-red)'
                        }}>
                          ${result.revenue - result.financials.costs}
                        </span>
                      </div>
                      <div style={{ color: 'var(--snes-ink-mute)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{result.attendance}/{details.capacity} attended • +{result.fansGained} fans</span>
                        {details.capacity > 0 && result.attendance >= details.capacity && (
                          <span className="snes-pixel btb-pop btb-shake" style={{
                            fontSize: '9px', letterSpacing: 0, color: '#1e1509',
                            backgroundColor: 'var(--snes-gold)', padding: '2px 5px',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}><PixelIcon name="soldout" size={10} /> SOLD OUT</span>
                        )}
                        {result.incidentOccurred && (
                          <span className="snes-pixel btb-pop" style={{
                            fontSize: '9px', letterSpacing: 0, color: '#f7efe0',
                            backgroundColor: 'var(--snes-red)', padding: '2px 5px',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}><PixelIcon name="warning" size={10} /> INCIDENT</span>
                        )}
                      </div>
                      {result.venueSynergies && result.venueSynergies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {result.venueSynergies.map((s, i) => {
                            const isNew = newComboNames.has(s.name);
                            return (
                            <span key={i} className="snes-pixel" title={s.description} style={{
                              fontSize: '9px', letterSpacing: 0,
                              color: isNew ? 'var(--snes-gold)' : 'var(--snes-green)',
                              border: `2px solid ${isNew ? 'var(--snes-gold)' : 'var(--snes-green)'}`,
                              backgroundColor: 'var(--snes-bg-2)', padding: '3px 5px',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}><PixelIcon name={isNew ? 'sparkle' : 'fire'} size={10} /> {s.name}</span>
                            );
                          })}
                        </div>
                      )}
                      {result.politics && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {(result.politics.factionAttendancePct !== 0 || result.politics.factionRepPct !== 0) && (
                            <span className="snes-pixel" style={{
                              fontSize: '9px', letterSpacing: 0, color: 'var(--snes-purple)',
                              border: '2px solid var(--snes-purple)', backgroundColor: 'var(--snes-bg-2)', padding: '3px 5px',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}><PixelIcon name="faction" size={10} /> Faction{result.politics.factionAttendancePct !== 0 ? ` ${result.politics.factionAttendancePct >= 0 ? '+' : ''}${result.politics.factionAttendancePct}% crowd` : ''}{result.politics.factionRepPct !== 0 ? ` ${result.politics.factionRepPct >= 0 ? '+' : ''}${result.politics.factionRepPct}% rep` : ''}</span>
                          )}
                          {result.politics.lineupPct !== 0 && (
                            <span className="snes-pixel" style={{
                              fontSize: '9px', letterSpacing: 0, color: 'var(--snes-green)',
                              border: '2px solid var(--snes-green)', backgroundColor: 'var(--snes-bg-2)', padding: '3px 5px',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}><PixelIcon name="guitar" size={10} /> Bill {result.politics.lineupPct >= 0 ? '+' : ''}{result.politics.lineupPct}% crowd</span>
                          )}
                          {result.politics.conflicts.map((c, i) => (
                            <span key={i} className="snes-pixel" style={{
                              fontSize: '9px', letterSpacing: 0, color: 'var(--snes-red)',
                              border: '2px solid var(--snes-red)', backgroundColor: 'var(--snes-bg-2)', padding: '3px 5px',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}><PixelIcon name="energy" size={10} /> {c}</span>
                          ))}
                        </div>
                      )}
                      {result.combosDiscovered && result.combosDiscovered.length > 0 && (
                        <div className="btb-pop btb-glow" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {result.combosDiscovered.map((id) => (
                            <div key={id} className="snes-pixel" style={{
                              fontSize: '11px', letterSpacing: 0, color: 'var(--snes-gold)',
                              display: 'flex', alignItems: 'center', gap: '5px', lineHeight: 1.4
                            }}><PixelIcon name="sparkle" size={12} style={{ flexShrink: 0 }} /> NEW: {comboBlurb(id)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats Changes */}
            {stage >= 2 && (
            <div className="btb-pop" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: 'var(--snes-bg-2)',
                borderRadius: 0,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '2px solid var(--snes-purple)'
              }}>
                <Users size={20} color="var(--snes-purple)" />
                <div>
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink-dim)', fontSize: '11px', letterSpacing: 0, marginBottom: '6px' }}>Fans</div>
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink)', fontSize: '10px', letterSpacing: 0 }}>
                    <CountUp value={totalFans} plus />
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--snes-bg-2)',
                borderRadius: 0,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '2px solid var(--snes-gold)'
              }}>
                <Star size={20} color="var(--snes-gold)" />
                <div>
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink-dim)', fontSize: '11px', letterSpacing: 0, marginBottom: '6px' }}>Reputation</div>
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink)', fontSize: '10px', letterSpacing: 0 }}>
                    <CountUp value={totalRep} plus />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Financial Summary — the money tally lands last so the profit
                count-up is the reveal's climax, not background noise. */}
            {stage >= 3 && (
            <div className="snes-panel-inset btb-pop" style={{
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 className="snes-pixel" style={{
                fontSize: '10px',
                color: 'var(--snes-ink)',
                marginTop: 0,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: 0,
                lineHeight: 1.4
              }}>
                <DollarSign size={16} color="var(--snes-green)" />
                Financial Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--snes-ink-dim)', fontSize: '13px' }}>Revenue</span>
                  <span className="snes-pixel" style={{ color: 'var(--snes-green)', fontSize: '11px', letterSpacing: 0 }}>+${totalRevenue}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--snes-ink-dim)', fontSize: '13px' }}>Costs</span>
                  <span className="snes-pixel" style={{ color: 'var(--snes-red)', fontSize: '11px', letterSpacing: 0 }}>-${totalCosts}</span>
                </div>
                {totalUpkeep > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--snes-ink-mute)', fontSize: '12px' }}>└ Living Costs (rent, ramen, regret)</span>
                    <span style={{ color: 'var(--snes-red)', fontSize: '12px' }}>-${totalUpkeep}</span>
                  </div>
                )}
                {passiveIncome && passiveIncome.money > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--snes-ink-mute)', fontSize: '12px' }}>
                      └ Gear & Landmarks (merch, EPs sold)
                    </span>
                    <span style={{ color: 'var(--snes-green)', fontSize: '12px' }}>+${passiveIncome.money}</span>
                  </div>
                )}
                <div style={{
                  borderTop: '2px solid var(--snes-line)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span className="snes-pixel" style={{ color: 'var(--snes-ink)', fontSize: '11px', letterSpacing: 0 }}>Net Profit</span>
                  <span className="snes-pixel" style={{
                    color: totalProfit >= 0 ? 'var(--snes-green)' : 'var(--snes-red)',
                    fontSize: '11px',
                    letterSpacing: 0
                  }}>
                    <CountUp value={totalProfit} plus />
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* Celebration rows — the ladder climbed (new venues/cities) and
                challenges cleared. The closing beat of the reveal. */}
            {stage >= REVEAL_DONE && hasCelebration && (
              <div className="btb-pop btb-glow" style={{
                backgroundColor: 'var(--snes-bg-2)',
                padding: '12px',
                marginBottom: '20px',
                border: '2px solid var(--snes-gold)',
                borderLeft: '4px solid var(--snes-gold)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {venueUnlocks.map((v) => (
                  <div key={v} className="snes-pixel" style={{
                    fontSize: '10px', color: 'var(--snes-gold)', letterSpacing: 0, lineHeight: 1.6,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <PixelIcon name="unlock" size={12} style={{ flexShrink: 0 }} /> NEW VENUE OPENED: {v}
                  </div>
                ))}
                {cityUnlocks.map((w) => (
                  <div key={w} className="snes-pixel" style={{
                    fontSize: '10px', color: 'var(--snes-gold)', letterSpacing: 0, lineHeight: 1.6,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <PixelIcon name="pin" size={12} style={{ flexShrink: 0 }} /> {w}
                  </div>
                ))}
                {objectivesCompleted.map((o) => {
                  const fame = objectiveManager.getDefinition(o.id)?.fameReward;
                  return (
                    <div key={o.id} className="snes-pixel" style={{
                      fontSize: '10px', color: 'var(--snes-gold)', letterSpacing: 0, lineHeight: 1.6,
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <PixelIcon name="trophy" size={12} style={{ flexShrink: 0 }} /> CHALLENGE CLEARED: {o.name}{fame ? ` — +${fame} Scene Points banked` : ''}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Faction standing shifts — turn-level, with the cause spelled out so
                the meter's drift is attributable, not mysterious. */}
            {stage >= REVEAL_DONE && factionShifts.length > 0 && (
              <div className="btb-pop" style={{ marginBottom: '20px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px', color: 'var(--snes-purple)', marginTop: 0, marginBottom: '10px',
                  letterSpacing: 0, lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '6px'
                }}>Scene Politics <PixelIcon name="faction" size={12} /></h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {factionShifts.map((f) => (
                    <span key={f.id} className="snes-pixel" style={{
                      fontSize: '9px', letterSpacing: 0,
                      color: FACTION_DISPLAY_COLOR[f.id] ?? 'var(--snes-ink)',
                      border: `2px solid ${FACTION_DISPLAY_COLOR[f.id] ?? 'var(--snes-line)'}`,
                      backgroundColor: 'var(--snes-bg-2)', padding: '3px 5px',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {FACTION_SHORT_NAME[f.id] ?? f.id}
                      <span style={{ color: f.delta > 0 ? 'var(--snes-green)' : 'var(--snes-red)' }}>{fmtShift(f.delta)}</span>
                    </span>
                  ))}
                </div>
                <div style={{ color: 'var(--snes-ink-mute)', fontSize: '11px', fontStyle: 'italic', marginTop: '6px', lineHeight: 1.5 }}>
                  Word of who you booked — and where — got around.
                </div>
              </div>
            )}

            {/* Equipped synergies (player-facing: "instincts") that kicked in this turn */}
            {stage >= REVEAL_DONE && synergyEffects.filter((s) => s.triggered).length > 0 && (
              <div className="btb-pop" style={{ marginBottom: '20px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px', color: 'var(--snes-purple)', marginTop: 0, marginBottom: '12px', letterSpacing: 0,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>Instincts That Kicked In <PixelIcon name="instinct" size={13} /></h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {synergyEffects.filter((s) => s.triggered).map((s, i) => (
                    <div key={i} style={{
                      backgroundColor: 'var(--snes-bg-2)', border: '2px solid var(--snes-void)',
                      borderLeft: '4px solid var(--snes-purple)', padding: '8px 10px'
                    }}>
                      <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-purple)', letterSpacing: 0 }}>
                        {s.synergyName}
                      </span>
                      <div style={{ color: 'var(--snes-ink-dim)', fontSize: '11px', marginTop: '3px' }}>
                        {s.effects.map((e) => e.description).join(' · ')}
                      </div>
                      {(() => {
                        const t = instinctTriggerLabel(s.synergyId);
                        return (t || s.conditionDescription) ? (
                          <div style={{ color: 'var(--snes-ink-dim)', fontSize: '11px', marginTop: '4px' }}>
                            {t && `fires at ${t}`}{t && s.conditionDescription ? ' · ' : ''}{s.conditionDescription}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day Job Result */}
            {stage >= REVEAL_DONE && dayJobResult && (
              <div className="btb-pop" style={{
                backgroundColor: 'var(--snes-bg-2)',
                borderRadius: 0,
                padding: '16px',
                marginBottom: '20px',
                border: '2px solid var(--snes-void)',
                borderLeft: '4px solid var(--snes-gold)'
              }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px',
                  color: 'var(--snes-ink)',
                  marginTop: 0,
                  marginBottom: '10px',
                  letterSpacing: 0,
                  lineHeight: 1.4
                }}>Day Job</h3>
                <p style={{ color: 'var(--snes-ink-dim)', fontSize: '13px', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {dayJobResult.message}
                </p>
                <div className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', letterSpacing: 0, lineHeight: 1.6 }}>
                  +${dayJobResult.money} • Stress +{dayJobResult.stressGain}%
                  {dayJobResult.reputationLoss > 0 ? ` • −${dayJobResult.reputationLoss} rep` : ''}
                  {dayJobResult.fanLoss > 0 ? ` • −${dayJobResult.fanLoss} fans` : ''}
                </div>
              </div>
            )}

            {/* Difficulty Event */}
            {stage >= REVEAL_DONE && difficultyEvent && (
              <div className="btb-pop" style={{
                backgroundColor: 'var(--snes-bg-2)',
                borderRadius: 0,
                padding: '16px',
                border: '2px solid var(--snes-red)',
                borderLeft: '4px solid var(--snes-red)'
              }}>
                <p style={{ color: 'var(--snes-red)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  {difficultyEvent.message}
                </p>
              </div>
            )}

            {/* Rotating scene-texture line — one per turn, deterministic, so the
                game feels like it knows the scene every single week. */}
            {stage >= REVEAL_DONE && (
              <div className="btb-pop" style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '2px solid var(--snes-line)',
                color: 'var(--snes-ink-mute)',
                fontSize: '11px',
                fontStyle: 'italic',
                lineHeight: 1.5
              }}>
                {getTurnSceneLine(turn)}
              </div>
            )}
          </div>
    </SnesModal>
  );
};

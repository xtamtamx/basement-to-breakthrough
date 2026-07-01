import React, { useEffect, useState } from 'react';
import { ShowResult } from '@game/types';
import { SnesModal } from '@components/ui/SnesModal';
import { useGameStore } from '@stores/gameStore';
import { SATIRICAL_TURN_RESULTS } from '@game/data/satiricalText';
import { STARTER_SYNERGIES, type SynergyTriggerResult } from '@game/mechanics/SynergyManager';

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
import { Users, DollarSign, Star } from 'lucide-react';

interface TurnResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showResults: ShowResult[];
  /** Flat living costs + equipment upkeep for the turn */
  totalUpkeep: number;
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

export const TurnResultsModal: React.FC<TurnResultsModalProps> = ({
  isOpen,
  onClose,
  showResults = [],
  totalUpkeep = 0,
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
    if (showResults.length === 0) {
      return "No Shows Booked: Scene Holds Its Breath in Collective Indifference";
    }
    if (totalProfit > 100) {
      return SATIRICAL_TURN_RESULTS.GREAT_NIGHT;
    }
    if (totalProfit > 0) {
      return SATIRICAL_TURN_RESULTS.DECENT_NIGHT;
    }
    if (totalProfit > -50) {
      return SATIRICAL_TURN_RESULTS.BROKE_EVEN;
    }
    return SATIRICAL_TURN_RESULTS.BAD_NIGHT;
  };

  const getReputationMessage = () => {
    if (totalRep > 10) {
      return SATIRICAL_TURN_RESULTS.REPUTATION_UP;
    }
    if (totalRep < -10) {
      return SATIRICAL_TURN_RESULTS.REPUTATION_DOWN;
    }
    return "";
  };

  const anySoldOut = showResults.some((r) => {
    const d = getShowDetails(r.showId);
    return d.capacity > 0 && r.attendance >= d.capacity;
  });
  const anyDiscovery = showResults.some((r) => (r.combosDiscovered?.length ?? 0) > 0);
  const anyIncident = showResults.some((r) => r.incidentOccurred);
  const bigNight = anySoldOut || anyDiscovery || totalProfit > 100;

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
    if (anyDiscovery && !followUpModalPending) audio.synergy();
    else if (anySoldOut) audio.soldOut();
    else if (totalProfit > 100) audio.coin();
    else if (totalProfit >= 0) audio.success();
    else audio.error();
    if (totalProfit >= 0 && !anyIncident) haptics.success();
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
      accent={bigNight ? 'var(--snes-gold)' : 'var(--snes-magenta)'}
      title={
        <span className={`snes-pixel${bigNight ? ' btb-shake' : ''}`} style={{
          fontSize: '12px',
          color: bigNight ? 'var(--snes-gold)' : 'var(--snes-magenta)',
          letterSpacing: 0,
          lineHeight: 1.5
        }}>{anySoldOut ? '🎉 Sold-Out Night!' : 'Post-Show Damage Report'}</span>
      }
    >
          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
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

            {/* Financial Summary */}
            <div style={{
              backgroundColor: 'var(--snes-bg-2)',
              borderRadius: 0,
              padding: '20px',
              marginBottom: '20px',
              border: '2px solid var(--snes-void)',
              boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814'
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
                  <span className="snes-pixel" style={{ color: 'var(--snes-green)', fontSize: '9px', letterSpacing: 0 }}>+${totalRevenue}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--snes-ink-dim)', fontSize: '13px' }}>Costs</span>
                  <span className="snes-pixel" style={{ color: 'var(--snes-red)', fontSize: '9px', letterSpacing: 0 }}>-${totalCosts}</span>
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
                  <span className="snes-pixel" style={{ color: 'var(--snes-ink)', fontSize: '9px', letterSpacing: 0 }}>Net Profit</span>
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

            {/* Stats Changes */}
            <div style={{
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
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink-dim)', fontSize: '7px', letterSpacing: 0, marginBottom: '6px' }}>Fans</div>
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
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink-dim)', fontSize: '7px', letterSpacing: 0, marginBottom: '6px' }}>Reputation</div>
                  <div className="snes-pixel" style={{ color: 'var(--snes-ink)', fontSize: '10px', letterSpacing: 0 }}>
                    <CountUp value={totalRep} plus />
                  </div>
                </div>
              </div>
            </div>

            {/* Show Results */}
            {showResults.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
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
                    return (
                    <div key={index} style={{
                      backgroundColor: 'var(--snes-bg-2)',
                      borderRadius: 0,
                      padding: '12px',
                      fontSize: '14px',
                      border: '2px solid var(--snes-void)',
                      boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814'
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
                          fontSize: '9px',
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
                            fontSize: '7px', letterSpacing: 0, color: '#1e1509',
                            backgroundColor: 'var(--snes-gold)', padding: '2px 5px'
                          }}>🎉 SOLD OUT</span>
                        )}
                        {result.incidentOccurred && (
                          <span className="snes-pixel btb-pop" style={{
                            fontSize: '7px', letterSpacing: 0, color: '#f7efe0',
                            backgroundColor: 'var(--snes-red)', padding: '2px 5px'
                          }}>🚨 INCIDENT</span>
                        )}
                      </div>
                      {result.venueSynergies && result.venueSynergies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {result.venueSynergies.map((s, i) => (
                            <span key={i} className="snes-pixel" title={s.description} style={{
                              fontSize: '7px', letterSpacing: 0, color: 'var(--snes-green)',
                              border: '2px solid var(--snes-green)', backgroundColor: '#0a1410', padding: '3px 5px'
                            }}>🔥 {s.name}</span>
                          ))}
                        </div>
                      )}
                      {result.politics && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {(result.politics.factionAttendancePct !== 0 || result.politics.factionRepPct !== 0) && (
                            <span className="snes-pixel" style={{
                              fontSize: '7px', letterSpacing: 0, color: 'var(--snes-purple)',
                              border: '2px solid var(--snes-purple)', backgroundColor: '#160f24', padding: '3px 5px'
                            }}>🎭 Faction{result.politics.factionAttendancePct !== 0 ? ` ${result.politics.factionAttendancePct >= 0 ? '+' : ''}${result.politics.factionAttendancePct}% crowd` : ''}{result.politics.factionRepPct !== 0 ? ` ${result.politics.factionRepPct >= 0 ? '+' : ''}${result.politics.factionRepPct}% rep` : ''}</span>
                          )}
                          {result.politics.lineupPct !== 0 && (
                            <span className="snes-pixel" style={{
                              fontSize: '7px', letterSpacing: 0, color: 'var(--snes-green)',
                              border: '2px solid var(--snes-green)', backgroundColor: '#0a1410', padding: '3px 5px'
                            }}>🎸 Bill {result.politics.lineupPct >= 0 ? '+' : ''}{result.politics.lineupPct}% crowd</span>
                          )}
                          {result.politics.conflicts.map((c, i) => (
                            <span key={i} className="snes-pixel" style={{
                              fontSize: '7px', letterSpacing: 0, color: 'var(--snes-red)',
                              border: '2px solid var(--snes-red)', backgroundColor: '#1f0f0f', padding: '3px 5px'
                            }}>⚡ {c}</span>
                          ))}
                        </div>
                      )}
                      {result.combosDiscovered && result.combosDiscovered.length > 0 && (
                        <div className="snes-pixel btb-pop btb-glow" style={{
                          fontSize: '8px', letterSpacing: 0, color: 'var(--snes-gold)', marginTop: '8px'
                        }}>✨ NEW SYNERGY DISCOVERED!</div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Equipped synergies (player-facing: "instincts") that kicked in this turn */}
            {synergyEffects.filter((s) => s.triggered).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px', color: 'var(--snes-purple)', marginTop: 0, marginBottom: '12px', letterSpacing: 0
                }}>Instincts That Kicked In 🧠</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {synergyEffects.filter((s) => s.triggered).map((s, i) => (
                    <div key={i} style={{
                      backgroundColor: 'var(--snes-bg-2)', border: '2px solid var(--snes-void)',
                      borderLeft: '4px solid var(--snes-purple)', padding: '8px 10px'
                    }}>
                      <span className="snes-pixel" style={{ fontSize: '8px', color: 'var(--snes-purple)', letterSpacing: 0 }}>
                        {s.synergyName}
                      </span>
                      <div style={{ color: 'var(--snes-ink-dim)', fontSize: '11px', marginTop: '3px' }}>
                        {s.effects.map((e) => e.description).join(' · ')}
                      </div>
                      {(() => {
                        const t = instinctTriggerLabel(s.synergyId);
                        return (t || s.conditionDescription) ? (
                          <div style={{ color: 'var(--snes-ink-mute)', fontSize: '9px', marginTop: '4px' }}>
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
            {dayJobResult && (
              <div style={{
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
                <div className="snes-pixel" style={{ fontSize: '8px', color: 'var(--snes-ink-dim)', letterSpacing: 0, lineHeight: 1.6 }}>
                  +${dayJobResult.money} • Stress +{dayJobResult.stressGain}%
                  {dayJobResult.reputationLoss > 0 ? ` • −${dayJobResult.reputationLoss} rep` : ''}
                  {dayJobResult.fanLoss > 0 ? ` • −${dayJobResult.fanLoss} fans` : ''}
                </div>
              </div>
            )}

            {/* Difficulty Event */}
            {difficultyEvent && (
              <div style={{
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
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '2px solid var(--snes-void)',
            backgroundColor: 'var(--snes-bg-2)'
          }}>
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
          </div>
    </SnesModal>
  );
};
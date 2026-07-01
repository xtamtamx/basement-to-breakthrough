import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem, PromotionType, PROMOTION_ACTIVITIES } from '@game/mechanics/ShowPromotionSystem';
import { captureRuntimeSnapshot } from '@game/persistence/runtimeSnapshot';
import { haptics } from '@utils/mobile';
import { Megaphone, Radio, Globe, Users, TrendingUp, Clock, Star, Handshake } from 'lucide-react';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

interface PromotionViewProps {
  onNavigate?: (view: ViewType) => void;
}

// Prose/name font — card titles read as names, not chrome (canon: Inter).
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

export const PromotionView: React.FC<PromotionViewProps> = ({ onNavigate }) => {
  const { money, reputation, connections, allBands, venues } = useGameStore();
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const scheduledShows = showPromotionSystem.getScheduledShows();

  const handlePromote = (showId: string, promotionType: PromotionType) => {
    const activity = PROMOTION_ACTIVITIES[promotionType];
    if (!activity) return;

    // Check if player can afford it
    if (money < activity.cost) {
      haptics.error();
      return;
    }

    if (showPromotionSystem.promoteShow(showId, promotionType)) {
      haptics.success();
      // promoteShow debits persisted money but mutates only the in-memory show
      // (hype/effectiveness). Snapshot now, or a refresh reverts the promotion the
      // player just paid for while the money stays gone.
      useGameStore.setState({ runtimeSnapshot: captureRuntimeSnapshot() });
    } else {
      haptics.error();
    }
  };

  const selectedShow = scheduledShows.find(s => s.id === selectedShowId);
  const promotionReport = selectedShowId ? showPromotionSystem.getPromotionReport(selectedShowId) : null;

  const getPromotionIcon = (type: PromotionType) => {
    switch (type) {
      case PromotionType.SOCIAL_MEDIA: return <Globe size={20} />;
      case PromotionType.FLYERS: return <Megaphone size={20} />;
      case PromotionType.RADIO: return <Radio size={20} />;
      case PromotionType.WORD_OF_MOUTH: return <Users size={20} />;
      default: return <Megaphone size={20} />;
    }
  };

  // Reusable pill for the header resource readout.
  const StatPill: React.FC<{
    icon: React.ReactNode;
    value: React.ReactNode;
    color: string;
  }> = ({ icon, value, color }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: 'var(--snes-bg-2)',
      border: '2px solid var(--snes-void)',
      boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
      borderRadius: 0,
      padding: '4px 10px',
    }}>
      {icon}
      <span className="snes-pixel" style={{ color, fontSize: '9px', letterSpacing: 0 }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--snes-void)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="snes-bar snes-bar--top" style={{
        padding: '10px 14px',
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Megaphone size={18} color="var(--snes-magenta)" />
          <div style={{ minWidth: 0 }}>
            <h2 className="snes-pixel" style={{
              fontSize: '12px',
              color: 'var(--snes-ink)',
              margin: 0,
              letterSpacing: 0
            }}>Promote</h2>
            <p style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', margin: '3px 0 0' }}>
              Get butts in the door before showtime
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '6px',
          flexShrink: 0
        }}>
          <StatPill
            icon={<Star size={12} color="var(--snes-gold)" />}
            value={reputation}
            color="var(--snes-ink)"
          />
          <StatPill
            icon={<Handshake size={12} color="var(--snes-cyan)" />}
            value={connections}
            color="var(--snes-ink)"
          />
          <StatPill
            icon={<span className="snes-pixel" style={{ color: money >= 100 ? 'var(--snes-green)' : 'var(--snes-red)', fontSize: '9px', letterSpacing: 0 }}>$</span>}
            value={money}
            color={money >= 100 ? 'var(--snes-green)' : 'var(--snes-red)'}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: 'calc(88px + env(safe-area-inset-bottom))'
      }}>
        {scheduledShows.length === 0 ? (
          <div className="snes-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--snes-ink-dim)'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '14px', lineHeight: 1 }}>📢</div>
            <h3 className="snes-pixel" style={{
              fontSize: '12px',
              color: 'var(--snes-ink)',
              margin: '0 0 10px',
              letterSpacing: 0
            }}>Nothing to Hype Yet</h3>
            <p style={{ fontSize: '13px', margin: '0 0 18px', maxWidth: '280px', lineHeight: 1.5 }}>
              Book shows a few turns ahead so there's time to paper the town with flyers.
            </p>
            {onNavigate && (
              <button
                className="snes-btn"
                onClick={() => onNavigate('shows')}
                style={{
                  minHeight: '44px'
                }}
              >
                Go to Show Builder
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Show List */}
            <section style={{ marginBottom: '16px' }}>
              <h3 className="snes-pixel" style={{
                fontSize: '9px',
                color: 'var(--snes-ink-mute)',
                textTransform: 'uppercase',
                letterSpacing: 0,
                margin: '0 0 8px 2px'
              }}>Upcoming Shows</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {scheduledShows.map(show => {
                  const isSelected = show.id === selectedShowId;
                  const report = showPromotionSystem.getPromotionReport(show.id);
                  const showBandIds = show.lineup ?? [show.bandId];
                  const bandNames = showBandIds
                    .map(id => allBands.find(b => b.id === id)?.name)
                    .filter((name): name is string => Boolean(name))
                    .join(' + ');
                  const showVenue = venues.find(v => v.id === show.venueId);

                  return (
                    <div
                      key={show.id}
                      onClick={() => {
                        setSelectedShowId(show.id);
                        haptics.light();
                      }}
                      style={{
                        backgroundColor: 'var(--snes-bg)',
                        border: isSelected ? '2px solid var(--snes-magenta)' : '2px solid var(--snes-void)',
                        boxShadow: isSelected
                          ? 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)'
                          : 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                        borderRadius: 0,
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'none',
                        minHeight: '44px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 className="snes-pixel" style={{
                            fontSize: '10px',
                            color: 'var(--snes-ink)',
                            margin: '0 0 4px',
                            letterSpacing: 0,
                            lineHeight: 1.4
                          }}>
                            {bandNames}
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: 'var(--snes-ink-dim)',
                            margin: 0
                          }}>
                            @ {showVenue?.name}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '6px'
                          }}>
                            <span className="snes-pixel" style={{
                              fontSize: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--snes-ink-dim)',
                              letterSpacing: 0
                            }}>
                              <Clock size={11} color="var(--snes-ink-dim)" />
                              {show.turnsUntilShow} turns
                            </span>
                            <span className="snes-pixel" style={{
                              fontSize: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--snes-magenta)',
                              letterSpacing: 0
                            }}>
                              <TrendingUp size={11} color="var(--snes-magenta)" />
                              Level {report?.currentLevel ?? 0}/5
                            </span>
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'center',
                          backgroundColor: 'var(--snes-bg-2)',
                          border: '2px solid var(--snes-void)',
                          boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                          borderRadius: 0,
                          padding: '6px 10px',
                          flexShrink: 0
                        }}>
                          <p className="snes-pixel" style={{
                            fontSize: '9px',
                            color: 'var(--snes-ink-mute)',
                            margin: '0 0 4px',
                            textTransform: 'uppercase',
                            letterSpacing: 0
                          }}>Expected</p>
                          <p className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-green)', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{report?.expectedAttendance ?? 0}</p>
                        </div>
                      </div>

                      {/* Promotion Progress Bar */}
                      <div style={{ marginTop: '10px' }}>
                        <div className="snes-progress" style={{ height: '8px' }}>
                          <div
                            className="snes-progress__fill"
                            style={{
                              backgroundColor: 'var(--snes-magenta)',
                              width: `${((report?.currentLevel ?? 0) / 5) * 100}%`,
                              transition: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Selected Show Promotion Options */}
            {selectedShow && promotionReport && (
              <section>
                <h3 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: 'var(--snes-ink-mute)',
                  textTransform: 'uppercase',
                  letterSpacing: 0,
                  margin: '0 0 8px 2px'
                }}>Promotion Activities</h3>

                {/* Active Promotions */}
                {promotionReport.activePromotions.length > 0 && (
                  <div className="snes-panel-inset" style={{
                    border: '2px solid var(--snes-green)',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <h4 className="snes-pixel" style={{
                      fontSize: '9px',
                      color: 'var(--snes-green)',
                      textTransform: 'uppercase',
                      letterSpacing: 0,
                      margin: '0 0 8px'
                    }}>Active Promotions</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {promotionReport.activePromotions.map((promo, i) => (
                        <div key={i} className="snes-pixel" style={{
                          fontSize: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--snes-ink)',
                          backgroundColor: 'var(--snes-bg-2)',
                          border: '2px solid var(--snes-void)',
                          boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                          borderRadius: 0,
                          padding: '4px 10px',
                          letterSpacing: 0
                        }}>
                          {React.cloneElement(getPromotionIcon(promo), { size: 13, color: 'var(--snes-green)' })}
                          <span>{PROMOTION_ACTIVITIES[promo].name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Activities */}
                <div style={{ display: 'grid', gap: '8px' }}>
                  {Object.entries(PROMOTION_ACTIVITIES).map(([type, activity]) => {
                    const promotionType = type as PromotionType;
                    const isActive = promotionReport.activePromotions.includes(promotionType);
                    const canAfford = money >= activity.cost;
                    const meetsRequirements =
                      (!activity.requiresConnections || connections > 0) &&
                      (!activity.requiresReputation || reputation >= activity.requiresReputation);
                    const isDisabled = isActive || !canAfford || !meetsRequirements;

                    return (
                      <div
                        key={type}
                        className="snes-panel"
                        style={{
                          padding: '12px',
                          opacity: isDisabled ? 0.55 : 1,
                          transition: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                          <div style={{
                            flexShrink: 0,
                            width: '38px',
                            height: '38px',
                            borderRadius: 0,
                            backgroundColor: 'var(--snes-bg-2)',
                            border: '2px solid var(--snes-magenta)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--snes-magenta)'
                          }}>
                            {React.cloneElement(getPromotionIcon(promotionType), { size: 20 })}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                              fontFamily: SANS,
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--snes-ink)',
                              margin: '0 0 6px',
                              letterSpacing: 0,
                              lineHeight: 1.3
                            }}>{activity.name}</h4>
                            <p style={{
                              fontSize: '12px',
                              color: 'var(--snes-ink-dim)',
                              margin: '0 0 8px',
                              lineHeight: 1.4
                            }}>{activity.description}</p>

                            {/* Requirements */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px'
                            }}>
                              <span className="snes-pixel" style={{
                                fontSize: '9px',
                                color: !canAfford ? 'var(--snes-red)' : 'var(--snes-ink-dim)',
                                backgroundColor: 'var(--snes-bg-2)',
                                border: '2px solid var(--snes-void)',
                                boxShadow: 'inset 1px 1px 0 0 var(--snes-edge-lt), inset -1px -1px 0 0 var(--snes-void)',
                                borderRadius: 0,
                                padding: '3px 8px',
                                letterSpacing: 0
                              }}>
                                ${activity.cost}
                              </span>
                              {activity.requiresConnections && (
                                <span className="snes-pixel" style={{
                                  fontSize: '9px',
                                  color: connections <= 0 ? 'var(--snes-red)' : 'var(--snes-ink-dim)',
                                  backgroundColor: 'var(--snes-bg-2)',
                                  border: '2px solid var(--snes-void)',
                                  boxShadow: 'inset 1px 1px 0 0 var(--snes-edge-lt), inset -1px -1px 0 0 var(--snes-void)',
                                  borderRadius: 0,
                                  padding: '3px 8px',
                                  letterSpacing: 0
                                }}>
                                  Needs connections
                                </span>
                              )}
                              {activity.requiresReputation && (
                                <span className="snes-pixel" style={{
                                  fontSize: '9px',
                                  color: reputation < activity.requiresReputation ? 'var(--snes-red)' : 'var(--snes-ink-dim)',
                                  backgroundColor: 'var(--snes-bg-2)',
                                  border: '2px solid var(--snes-void)',
                                  boxShadow: 'inset 1px 1px 0 0 var(--snes-edge-lt), inset -1px -1px 0 0 var(--snes-void)',
                                  borderRadius: 0,
                                  padding: '3px 8px',
                                  letterSpacing: 0
                                }}>
                                  {activity.requiresReputation}+ REP
                                </span>
                              )}
                            </div>

                            {/* Effects */}
                            <div className="snes-pixel" style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: '8px',
                              fontSize: '9px',
                              color: 'var(--snes-green)',
                              letterSpacing: 0
                            }}>
                              {(activity.attendanceMultiplier ?? 0) > 1 && (
                                <span>{activity.attendanceMultiplier}x attendance</span>
                              )}
                              {(activity.reputationBonus ?? 0) > 0 && (
                                <span>+{activity.reputationBonus} REP</span>
                              )}
                              {(activity.fansGained ?? 0) > 0 && (
                                <span>+{activity.fansGained} fans</span>
                              )}
                            </div>
                          </div>

                          {/* Action Button / Status */}
                          {!isActive && canAfford && meetsRequirements ? (
                            <button
                              className="snes-btn snes-btn--sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote(selectedShow.id, promotionType);
                              }}
                              style={{
                                flexShrink: 0,
                                alignSelf: 'center',
                                minHeight: '44px'
                              }}
                            >
                              Promote
                            </button>
                          ) : isActive ? (
                            <span className="snes-pixel" style={{
                              flexShrink: 0,
                              alignSelf: 'center',
                              fontSize: '9px',
                              color: 'var(--snes-green)',
                              letterSpacing: 0
                            }}>Active</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promotion Summary */}
                <div className="snes-panel snes-panel--magenta" style={{
                  padding: '14px',
                  marginTop: '14px'
                }}>
                  <h4 className="snes-pixel" style={{
                    fontSize: '9px',
                    color: 'var(--snes-ink-mute)',
                    textTransform: 'uppercase',
                    letterSpacing: 0,
                    margin: '0 0 12px'
                  }}>Promotion Summary</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '9px', color: 'var(--snes-ink-mute)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Base Attendance</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-ink)', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{promotionReport.baseAttendance}</p>
                    </div>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '9px', color: 'var(--snes-ink-mute)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Promotion Boost</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-magenta)', margin: 0, lineHeight: 1, letterSpacing: 0 }}>
                        +{((promotionReport.totalMultiplier - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '9px', color: 'var(--snes-ink-mute)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Expected Total</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-green)', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{promotionReport.expectedAttendance}</p>
                    </div>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '9px', color: 'var(--snes-ink-mute)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Promotion Level</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-ink)', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{promotionReport.currentLevel}/5</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

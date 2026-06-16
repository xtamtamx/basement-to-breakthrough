import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem, PromotionType, PROMOTION_ACTIVITIES } from '@game/mechanics/ShowPromotionSystem';
import { haptics } from '@utils/mobile';
import { Megaphone, Radio, Globe, Users, TrendingUp, Clock, Star, Handshake } from 'lucide-react';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

interface PromotionViewProps {
  onNavigate?: (view: ViewType) => void;
}

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
      backgroundColor: '#0f0b1e',
      border: '2px solid #0a0814',
      boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
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
      backgroundColor: '#0a0814',
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
          <Megaphone size={18} color="#f72585" />
          <div style={{ minWidth: 0 }}>
            <h2 className="snes-pixel" style={{
              fontSize: '12px',
              color: '#ffffff',
              margin: 0,
              letterSpacing: 0
            }}>Promote</h2>
            <p style={{ fontSize: '11px', color: '#b9b3d6', margin: '3px 0 0' }}>
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
            icon={<Star size={12} color="#ffd23f" />}
            value={reputation}
            color="#ffffff"
          />
          <StatPill
            icon={<Handshake size={12} color="#4cc9f0" />}
            value={connections}
            color="#ffffff"
          />
          <StatPill
            icon={<span className="snes-pixel" style={{ color: money >= 100 ? '#3ad17e' : '#ff5c57', fontSize: '9px', letterSpacing: 0 }}>$</span>}
            value={money}
            color={money >= 100 ? '#3ad17e' : '#ff5c57'}
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
            color: '#b9b3d6'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '14px', lineHeight: 1 }}>📢</div>
            <h3 className="snes-pixel" style={{
              fontSize: '12px',
              color: '#ffffff',
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
                color: '#6f6796',
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
                        backgroundColor: '#171327',
                        border: isSelected ? '2px solid #f72585' : '2px solid #0a0814',
                        boxShadow: isSelected
                          ? 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814'
                          : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
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
                            color: '#ffffff',
                            margin: '0 0 4px',
                            letterSpacing: 0,
                            lineHeight: 1.4
                          }}>
                            {bandNames}
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: '#b9b3d6',
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
                              fontSize: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#b9b3d6',
                              letterSpacing: 0
                            }}>
                              <Clock size={11} color="#b9b3d6" />
                              {show.turnsUntilShow} turns
                            </span>
                            <span className="snes-pixel" style={{
                              fontSize: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#f72585',
                              letterSpacing: 0
                            }}>
                              <TrendingUp size={11} color="#f72585" />
                              Level {report?.currentLevel ?? 0}/5
                            </span>
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'center',
                          backgroundColor: '#0f0b1e',
                          border: '2px solid #0a0814',
                          boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                          borderRadius: 0,
                          padding: '6px 10px',
                          flexShrink: 0
                        }}>
                          <p className="snes-pixel" style={{
                            fontSize: '7px',
                            color: '#6f6796',
                            margin: '0 0 4px',
                            textTransform: 'uppercase',
                            letterSpacing: 0
                          }}>Expected</p>
                          <p className="snes-pixel" style={{ fontSize: '12px', color: '#3ad17e', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{report?.expectedAttendance ?? 0}</p>
                        </div>
                      </div>

                      {/* Promotion Progress Bar */}
                      <div style={{ marginTop: '10px' }}>
                        <div className="snes-progress" style={{ height: '8px' }}>
                          <div
                            className="snes-progress__fill"
                            style={{
                              backgroundColor: '#f72585',
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
                  color: '#6f6796',
                  textTransform: 'uppercase',
                  letterSpacing: 0,
                  margin: '0 0 8px 2px'
                }}>Promotion Activities</h3>

                {/* Active Promotions */}
                {promotionReport.activePromotions.length > 0 && (
                  <div className="snes-panel-inset" style={{
                    border: '2px solid #3ad17e',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <h4 className="snes-pixel" style={{
                      fontSize: '8px',
                      color: '#3ad17e',
                      textTransform: 'uppercase',
                      letterSpacing: 0,
                      margin: '0 0 8px'
                    }}>Active Promotions</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {promotionReport.activePromotions.map((promo, i) => (
                        <div key={i} className="snes-pixel" style={{
                          fontSize: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#ffffff',
                          backgroundColor: '#0f0b1e',
                          border: '2px solid #0a0814',
                          boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                          borderRadius: 0,
                          padding: '4px 10px',
                          letterSpacing: 0
                        }}>
                          {React.cloneElement(getPromotionIcon(promo), { size: 13, color: '#3ad17e' })}
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
                            backgroundColor: '#0f0b1e',
                            border: '2px solid #f72585',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f72585'
                          }}>
                            {React.cloneElement(getPromotionIcon(promotionType), { size: 20 })}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 className="snes-pixel" style={{
                              fontSize: '10px',
                              color: '#ffffff',
                              margin: '0 0 6px',
                              letterSpacing: 0,
                              lineHeight: 1.4
                            }}>{activity.name}</h4>
                            <p style={{
                              fontSize: '12px',
                              color: '#b9b3d6',
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
                                fontSize: '8px',
                                color: !canAfford ? '#ff5c57' : '#b9b3d6',
                                backgroundColor: '#0f0b1e',
                                border: '2px solid #0a0814',
                                boxShadow: 'inset 1px 1px 0 0 #3a2f5c, inset -1px -1px 0 0 #0a0814',
                                borderRadius: 0,
                                padding: '3px 8px',
                                letterSpacing: 0
                              }}>
                                ${activity.cost}
                              </span>
                              {activity.requiresConnections && (
                                <span className="snes-pixel" style={{
                                  fontSize: '8px',
                                  color: connections <= 0 ? '#ff5c57' : '#b9b3d6',
                                  backgroundColor: '#0f0b1e',
                                  border: '2px solid #0a0814',
                                  boxShadow: 'inset 1px 1px 0 0 #3a2f5c, inset -1px -1px 0 0 #0a0814',
                                  borderRadius: 0,
                                  padding: '3px 8px',
                                  letterSpacing: 0
                                }}>
                                  Needs connections
                                </span>
                              )}
                              {activity.requiresReputation && (
                                <span className="snes-pixel" style={{
                                  fontSize: '8px',
                                  color: reputation < activity.requiresReputation ? '#ff5c57' : '#b9b3d6',
                                  backgroundColor: '#0f0b1e',
                                  border: '2px solid #0a0814',
                                  boxShadow: 'inset 1px 1px 0 0 #3a2f5c, inset -1px -1px 0 0 #0a0814',
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
                              fontSize: '8px',
                              color: '#3ad17e',
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
                              fontSize: '8px',
                              color: '#3ad17e',
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
                    color: '#6f6796',
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
                      <p className="snes-pixel" style={{ fontSize: '7px', color: '#6f6796', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Base Attendance</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: '#ffffff', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{promotionReport.baseAttendance}</p>
                    </div>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '7px', color: '#6f6796', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Promotion Boost</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: '#f72585', margin: 0, lineHeight: 1, letterSpacing: 0 }}>
                        +{((promotionReport.totalMultiplier - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '7px', color: '#6f6796', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Expected Total</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: '#3ad17e', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{promotionReport.expectedAttendance}</p>
                    </div>
                    <div>
                      <p className="snes-pixel" style={{ fontSize: '7px', color: '#6f6796', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0 }}>Promotion Level</p>
                      <p className="snes-pixel" style={{ fontSize: '12px', color: '#ffffff', margin: 0, lineHeight: 1, letterSpacing: 0 }}>{promotionReport.currentLevel}/5</p>
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

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
      backgroundColor: 'rgba(0,0,0,0.3)',
      border: '1px solid #1f2937',
      borderRadius: '999px',
      padding: '4px 10px',
    }}>
      {icon}
      <span style={{ color, fontWeight: 700, fontSize: '12px' }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundImage: 'linear-gradient(to bottom, #1a1030, #0c0a14)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        borderBottom: '1px solid #1f2937',
        padding: '10px 14px',
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Megaphone size={18} color="#ec4899" />
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 900,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '0.02em'
            }}>Promote</h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '1px 0 0' }}>
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
            icon={<Star size={12} color="#f59e0b" />}
            value={reputation}
            color="#ffffff"
          />
          <StatPill
            icon={<Handshake size={12} color="#06b6d4" />}
            value={connections}
            color="#ffffff"
          />
          <StatPill
            icon={<span style={{ color: money >= 100 ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: '12px' }}>$</span>}
            value={money}
            color={money >= 100 ? '#10b981' : '#ef4444'}
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '14px', lineHeight: 1 }}>📢</div>
            <h3 style={{
              fontSize: '17px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px'
            }}>Nothing to Hype Yet</h3>
            <p style={{ fontSize: '13px', margin: '0 0 18px', maxWidth: '280px', lineHeight: 1.5 }}>
              Book shows a few turns ahead so there's time to paper the town with flyers.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('shows')}
                style={{
                  padding: '12px 22px',
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
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
              <h3 style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
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
                        backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.08)' : '#111827',
                        border: isSelected ? '1px solid #ec4899' : '1px solid #1f2937',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '44px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: '0 0 2px'
                          }}>
                            {bandNames}
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: '#9ca3af',
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
                            <span style={{
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              color: '#9ca3af'
                            }}>
                              <Clock size={11} />
                              {show.turnsUntilShow} turns
                            </span>
                            <span style={{
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              color: '#ec4899'
                            }}>
                              <TrendingUp size={11} />
                              Level {report?.currentLevel ?? 0}/5
                            </span>
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'center',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: '1px solid #1f2937',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          flexShrink: 0
                        }}>
                          <p style={{
                            fontSize: '9px',
                            color: '#9ca3af',
                            margin: '0 0 2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Expected</p>
                          <p style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', margin: 0, lineHeight: 1 }}>{report?.expectedAttendance ?? 0}</p>
                        </div>
                      </div>

                      {/* Promotion Progress Bar */}
                      <div style={{ marginTop: '10px' }}>
                        <div style={{
                          height: '5px',
                          backgroundColor: '#1f2937',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div
                            style={{
                              height: '100%',
                              backgroundImage: 'linear-gradient(to right, #ec4899, #a855f7)',
                              width: `${((report?.currentLevel ?? 0) / 5) * 100}%`,
                              transition: 'width 0.3s'
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
                <h3 style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 8px 2px'
                }}>Promotion Activities</h3>

                {/* Active Promotions */}
                {promotionReport.activePromotions.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid #10b981',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#10b981',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px'
                    }}>Active Promotions</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {promotionReport.activePromotions.map((promo, i) => (
                        <div key={i} style={{
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#ffffff',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: '1px solid #1f2937',
                          borderRadius: '999px',
                          padding: '4px 10px'
                        }}>
                          {React.cloneElement(getPromotionIcon(promo), { size: 13, color: '#10b981' })}
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
                        style={{
                          backgroundColor: '#111827',
                          border: '1px solid #1f2937',
                          borderRadius: '12px',
                          padding: '12px',
                          opacity: isDisabled ? 0.55 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                          <div style={{
                            flexShrink: 0,
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(236, 72, 153, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ec4899'
                          }}>
                            {React.cloneElement(getPromotionIcon(promotionType), { size: 20 })}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#ffffff',
                              margin: '0 0 2px'
                            }}>{activity.name}</h4>
                            <p style={{
                              fontSize: '12px',
                              color: '#9ca3af',
                              margin: '0 0 8px',
                              lineHeight: 1.4
                            }}>{activity.description}</p>

                            {/* Requirements */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              fontSize: '11px'
                            }}>
                              <span style={{
                                color: !canAfford ? '#ef4444' : '#9ca3af',
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontWeight: 600
                              }}>
                                ${activity.cost}
                              </span>
                              {activity.requiresConnections && (
                                <span style={{
                                  color: connections <= 0 ? '#ef4444' : '#9ca3af',
                                  backgroundColor: 'rgba(0,0,0,0.3)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontWeight: 600
                                }}>
                                  Needs connections
                                </span>
                              )}
                              {activity.requiresReputation && (
                                <span style={{
                                  color: reputation < activity.requiresReputation ? '#ef4444' : '#9ca3af',
                                  backgroundColor: 'rgba(0,0,0,0.3)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontWeight: 600
                                }}>
                                  {activity.requiresReputation}+ REP
                                </span>
                              )}
                            </div>

                            {/* Effects */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginTop: '6px',
                              fontSize: '11px',
                              color: '#10b981',
                              fontWeight: 600
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote(selectedShow.id, promotionType);
                              }}
                              style={{
                                flexShrink: 0,
                                alignSelf: 'center',
                                padding: '8px 14px',
                                backgroundColor: '#ec4899',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                minHeight: '44px'
                              }}
                            >
                              Promote
                            </button>
                          ) : isActive ? (
                            <span style={{
                              flexShrink: 0,
                              alignSelf: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#10b981'
                            }}>Active</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promotion Summary */}
                <div style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(168, 85, 247, 0.12))',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                  padding: '14px',
                  marginTop: '14px'
                }}>
                  <h4 style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 10px'
                  }}>Promotion Summary</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Attendance</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1 }}>{promotionReport.baseAttendance}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promotion Boost</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#ec4899', margin: 0, lineHeight: 1 }}>
                        +{((promotionReport.totalMultiplier - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Total</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', margin: 0, lineHeight: 1 }}>{promotionReport.expectedAttendance}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promotion Level</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1 }}>{promotionReport.currentLevel}/5</p>
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

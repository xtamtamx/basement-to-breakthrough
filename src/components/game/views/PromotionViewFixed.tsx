import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem, PromotionType, PROMOTION_ACTIVITIES } from '@game/mechanics/ShowPromotionSystem';
import { haptics } from '@utils/mobile';
import { Megaphone, Radio, Globe, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

interface PromotionViewProps {
  onNavigate?: (view: ViewType) => void;
}

export const PromotionView: React.FC<PromotionViewProps> = ({ onNavigate }) => {
  const { money, reputation, connections, fans } = useGameStore();
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        borderBottom: '1px solid #374151',
        padding: '8px 12px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ec4899',
          margin: 0
        }}>Promote</h2>
        <div style={{
          display: 'flex',
          gap: '10px',
          fontSize: '11px'
        }}>
          <span style={{ color: money >= 100 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            ${money}
          </span>
          <span style={{ color: '#9ca3af' }}>
            ⭐ {reputation}
          </span>
          <span style={{ color: '#9ca3af' }}>
            🤝 {connections}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: '80px'
      }}>
        {scheduledShows.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>No Shows Scheduled</h3>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Book shows in advance to have time for promotion!
            </p>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('shows')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
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
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px'
              }}>Upcoming Shows</h3>
              <div style={{ display: 'grid', gap: '6px' }}>
                {scheduledShows.map(show => {
                  const isSelected = show.id === selectedShowId;
                  const report = showPromotionSystem.getPromotionReport(show.id);
                  
                  return (
                    <div
                      key={show.id}
                      onClick={() => {
                        setSelectedShowId(show.id);
                        haptics.light();
                      }}
                      style={{
                        backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.1)' : '#1f2937',
                        border: isSelected ? '2px solid #ec4899' : '1px solid #374151',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '44px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '2px'
                          }}>
                            {show.bands.map(b => b.name).join(' + ')}
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: '#9ca3af'
                          }}>
                            @ {show.venue.name}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '4px'
                          }}>
                            <span style={{
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: '#9ca3af'
                            }}>
                              <Clock size={10} />
                              {show.turnsUntilShow} turns
                            </span>
                            <span style={{
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: '#ec4899'
                            }}>
                              <TrendingUp size={10} />
                              Level {report.currentLevel}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '10px', color: '#9ca3af' }}>Expected</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{report.expectedAttendance}</p>
                        </div>
                      </div>
                      
                      {/* Promotion Progress Bar */}
                      <div style={{ marginTop: '8px' }}>
                        <div style={{
                          height: '4px',
                          backgroundColor: '#374151',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div 
                            style={{
                              height: '100%',
                              backgroundImage: 'linear-gradient(to right, #ec4899, #a855f7)',
                              width: `${(report.currentLevel / 5) * 100}%`,
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>Promotion Activities</h3>
                
                {/* Active Promotions */}
                {promotionReport.activePromotions.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#10b981',
                      marginBottom: '6px'
                    }}>Active Promotions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {promotionReport.activePromotions.map((promo, i) => (
                        <div key={i} style={{
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#ffffff'
                        }}>
                          {React.cloneElement(getPromotionIcon(promo), { size: 14 })}
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
                    
                    return (
                      <div
                        key={type}
                        style={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '10px',
                          padding: '12px',
                          opacity: (isActive || !canAfford || !meetsRequirements) ? 0.5 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                          <div style={{ fontSize: '20px', flexShrink: 0 }}>
                            {React.cloneElement(getPromotionIcon(promotionType), { size: 24 })}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#ffffff',
                              marginBottom: '2px'
                            }}>{activity.name}</h4>
                            <p style={{
                              fontSize: '12px',
                              color: '#9ca3af',
                              marginBottom: '6px'
                            }}>{activity.description}</p>
                            
                            {/* Requirements */}
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              fontSize: '11px'
                            }}>
                              <span style={{ color: !canAfford ? '#ef4444' : '#9ca3af' }}>
                                Cost: ${activity.cost}
                              </span>
                              {activity.requiresConnections && (
                                <span style={{ color: connections <= 0 ? '#ef4444' : '#9ca3af' }}>
                                  Needs connections
                                </span>
                              )}
                              {activity.requiresReputation && (
                                <span style={{ color: reputation < activity.requiresReputation ? '#ef4444' : '#9ca3af' }}>
                                  {activity.requiresReputation}+ REP
                                </span>
                              )}
                            </div>
                            
                            {/* Effects */}
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              marginTop: '4px',
                              fontSize: '11px',
                              color: '#10b981'
                            }}>
                              {activity.attendanceMultiplier > 1 && (
                                <span>{activity.attendanceMultiplier}x attendance</span>
                              )}
                              {activity.reputationBonus > 0 && (
                                <span>+{activity.reputationBonus} REP</span>
                              )}
                              {activity.fansGained > 0 && (
                                <span>+{activity.fansGained} fans</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          {!isActive && canAfford && meetsRequirements && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote(selectedShow.id, promotionType);
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#ec4899',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                minHeight: '32px'
                              }}
                            >
                              Promote
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Promotion Summary */}
                <div style={{
                  backgroundImage: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))',
                  border: '1px solid #374151',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '12px'
                }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px'
                  }}>Promotion Summary</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>Base Attendance</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>{promotionReport.baseAttendance}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>Promotion Boost</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#ec4899' }}>
                        {((promotionReport.totalMultiplier - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>Expected Total</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>{promotionReport.expectedAttendance}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>Promotion Level</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>{promotionReport.currentLevel}/5</p>
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
import React, { useState } from 'react';
import { synergySystemV2, Synergy } from '@game/mechanics/SynergySystemV2';
import { Zap, Lock, Trophy, Sparkles } from 'lucide-react';

// View model describing the synergy fields this screen renders.
interface SynergyViewModel {
  id: string;
  name: string;
  description: string;
  tier: Synergy['tier'];
  discovered: boolean;
  timesTriggered: number;
  hints?: string;
  requirements?: {
    bands?: string[];
    venueTypes?: string[];
    traits?: string[];
  };
  effects: {
    attendanceMultiplier: number;
    reputationBonus: number;
    fansGained: number;
  };
}

const toViewModel = (synergy: Synergy): SynergyViewModel => ({
  id: synergy.id,
  name: synergy.name,
  description: synergy.description,
  tier: synergy.tier,
  discovered: synergy.discovered,
  timesTriggered: synergy.timesTriggered,
  effects: {
    attendanceMultiplier: synergy.multiplier,
    reputationBonus: 0,
    fansGained: 0,
  },
});

export const SynergyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'discovered' | 'hints'>('discovered');
  const discoveredSynergies: SynergyViewModel[] = synergySystemV2
    .getDiscoveredSynergies()
    .map(toViewModel);
  const undiscoveredCount = synergySystemV2.getUndiscoveredSynergiesCount();
  const allSynergies: SynergyViewModel[] = discoveredSynergies;
  
  // SNES neon-punk tier palette (direct hexes — mythic=gold, legendary=purple,
  // rare=cyan, common=lavender). Replaces the old Tailwind-class string parsing.
  const getTierHex = (tier: string): string => {
    switch (tier) {
      case 'mythic': return '#ffd23f';
      case 'legendary': return '#c77dff';
      case 'rare': return '#4cc9f0';
      default: return '#b9b3d6';
    }
  };

  // Translucent fill matching the tier accent for card backgrounds.
  const getTierFill = (tier: string): string => {
    switch (tier) {
      case 'mythic': return 'rgba(255, 210, 63, 0.12)';
      case 'legendary': return 'rgba(199, 125, 255, 0.12)';
      case 'rare': return 'rgba(76, 201, 240, 0.12)';
      default: return 'rgba(185, 179, 214, 0.1)';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'mythic': return <Sparkles size={16} />;
      case 'legendary': return <Trophy size={16} />;
      case 'rare': return <Zap size={16} />;
      default: return <Zap size={16} />;
    }
  };

  const filteredSynergies = filter === 'discovered' 
    ? discoveredSynergies
    : filter === 'hints'
    ? allSynergies.filter(s => !s.discovered && s.hints)
    : allSynergies;

  // Group synergies by tier
  const synergyByTier = filteredSynergies.reduce((acc, synergy) => {
    if (!acc[synergy.tier]) acc[synergy.tier] = [];
    acc[synergy.tier].push(synergy);
    return acc;
  }, {} as Record<string, typeof filteredSynergies>);

  const tierOrder = ['mythic', 'legendary', 'rare', 'common'];

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
        padding: '10px 12px',
        flexShrink: 0
      }}>
        <h2 className="snes-pixel" style={{
          fontSize: '12px',
          color: '#f72585',
          margin: 0
        }}>Synergy Discovery</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px'
        }}>
          <span className="snes-chip snes-pixel" style={{ fontSize: '8px' }}>
            <Lock size={11} color="#6f6796" />
            <span style={{ color: '#b9b3d6' }}>{undiscoveredCount} Hidden</span>
          </span>
          <span className="snes-chip snes-pixel" style={{ fontSize: '8px' }}>
            <Zap size={11} color="#f72585" />
            <span style={{ color: '#f72585' }}>{discoveredSynergies.length} Found</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: '#171327',
        borderBottom: '2px solid #2a2350'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            ['discovered', 'Discovered'],
            ['hints', 'Hints'],
            ['all', 'All'],
          ] as const).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="snes-pixel"
                style={{
                  padding: '10px 12px',
                  backgroundColor: active ? '#f72585' : '#0f0b1e',
                  color: active ? '#1a0a14' : '#6f6796',
                  border: '2px solid #0a0814',
                  borderRadius: 0,
                  fontSize: '8px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  minHeight: '44px',
                  boxShadow: active
                    ? 'inset 2px 2px 0 0 rgba(255,255,255,0.45), inset -2px -2px 0 0 rgba(0,0,0,0.45)'
                    : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                  transition: 'none'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: '80px'
      }}>
        {filteredSynergies.length === 0 ? (
          <div className="snes-panel-inset" style={{
            textAlign: 'center',
            padding: '40px 20px',
            margin: '8px 0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h3 className="snes-pixel" style={{
              fontSize: '12px',
              color: '#ffffff',
              marginBottom: '12px'
            }}>No Synergies Found</h3>
            <p style={{ fontSize: '13px', color: '#b9b3d6', lineHeight: 1.5 }}>
              {filter === 'discovered'
                ? 'Book shows with different band combinations to discover synergies!'
                : 'No synergies match your filter'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tierOrder.map(tier => {
              const synergies = synergyByTier[tier];
              if (!synergies || synergies.length === 0) return null;
              
              return (
                <section key={tier}>
                  <h3 className="snes-pixel" style={{
                    fontSize: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                    color: getTierHex(tier)
                  }}>
                    {React.cloneElement(getTierIcon(tier), { size: 14, color: getTierHex(tier) })}
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                  </h3>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {synergies.map(synergy => {
                      const isDiscovered = synergy.discovered;
                      const showHint = !isDiscovered && filter === 'hints';
                      
                      return (
                        <div
                          key={synergy.id}
                          style={{
                            backgroundColor: getTierFill(synergy.tier),
                            border: `2px solid ${getTierHex(synergy.tier)}`,
                            borderRadius: 0,
                            padding: '12px',
                            opacity: !isDiscovered ? 0.6 : 1,
                            boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                            transition: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                            <div style={{ fontSize: '20px', flexShrink: 0 }}>
                              {isDiscovered ? (
                                React.cloneElement(getTierIcon(synergy.tier), { size: 20, color: getTierHex(synergy.tier) })
                              ) : (
                                <Lock size={20} color="#6f6796" />
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <h4 className="snes-pixel" style={{
                                fontSize: '10px',
                                color: '#ffffff',
                                marginBottom: '8px',
                                lineHeight: 1.4
                              }}>
                                {isDiscovered ? synergy.name : '???'}
                              </h4>

                              {isDiscovered && (
                                <>
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#b9b3d6',
                                    marginBottom: '8px',
                                    lineHeight: 1.5
                                  }}>
                                    {synergy.description}
                                  </p>

                                  {/* Requirements */}
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#6f6796',
                                    marginBottom: '8px',
                                    lineHeight: 1.5
                                  }}>
                                    {synergy.requirements?.bands && (
                                      <p style={{ margin: '2px 0' }}>Bands: {synergy.requirements?.bands.join(' + ')}</p>
                                    )}
                                    {synergy.requirements?.venueTypes && (
                                      <p style={{ margin: '2px 0' }}>Venues: {synergy.requirements?.venueTypes.join(', ')}</p>
                                    )}
                                    {synergy.requirements?.traits && (
                                      <p style={{ margin: '2px 0' }}>Traits: {synergy.requirements?.traits.join(', ')}</p>
                                    )}
                                  </div>
                                  
                                  {/* Effects */}
                                  <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '4px'
                                  }}>
                                    <span className="snes-pixel" style={{
                                      padding: '4px 6px',
                                      backgroundColor: '#0f0b1e',
                                      color: '#3ad17e',
                                      fontSize: '8px',
                                      border: '2px solid #0a0814',
                                      borderRadius: 0,
                                      boxShadow: 'inset 1px 1px 0 0 #2a2350'
                                    }}>
                                      {synergy.effects.attendanceMultiplier}x attendance
                                    </span>
                                    {synergy.effects.reputationBonus > 0 && (
                                      <span className="snes-pixel" style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#0f0b1e',
                                        color: '#ffd23f',
                                        fontSize: '8px',
                                        border: '2px solid #0a0814',
                                        borderRadius: 0,
                                        boxShadow: 'inset 1px 1px 0 0 #2a2350'
                                      }}>
                                        +{synergy.effects.reputationBonus} rep
                                      </span>
                                    )}
                                    {synergy.effects.fansGained > 0 && (
                                      <span className="snes-pixel" style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#0f0b1e',
                                        color: '#c77dff',
                                        fontSize: '8px',
                                        border: '2px solid #0a0814',
                                        borderRadius: 0,
                                        boxShadow: 'inset 1px 1px 0 0 #2a2350'
                                      }}>
                                        +{synergy.effects.fansGained} fans
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Times Triggered */}
                                  {synergy.timesTriggered > 0 && (
                                    <p className="snes-pixel" style={{
                                      fontSize: '7px',
                                      color: '#6f6796',
                                      marginTop: '8px'
                                    }}>
                                      Triggered {synergy.timesTriggered} times
                                    </p>
                                  )}
                                </>
                              )}

                              {showHint && synergy.hints && (
                                <div className="snes-panel-inset" style={{
                                  borderColor: '#ffd23f',
                                  padding: '8px',
                                  marginTop: '6px'
                                }}>
                                  <p style={{
                                    fontSize: '12px',
                                    fontStyle: 'italic',
                                    color: '#b9b3d6',
                                    lineHeight: 1.5
                                  }}>
                                    💡 {synergy.hints}
                                  </p>
                                </div>
                              )}

                              {!isDiscovered && !showHint && (
                                <p style={{
                                  fontSize: '12px',
                                  color: '#6f6796',
                                  fontStyle: 'italic'
                                }}>
                                  Book shows to discover this synergy...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        
        {/* Discovery Progress */}
        <div className="snes-panel snes-panel--magenta" style={{
          marginTop: '24px',
          padding: '12px'
        }}>
          <h3 className="snes-pixel" style={{
            fontSize: '10px',
            color: '#ffffff',
            marginBottom: '12px',
            textTransform: 'uppercase'
          }}>Discovery Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span className="snes-pixel" style={{ fontSize: '8px', color: '#b9b3d6' }}>Overall</span>
                <span className="snes-pixel" style={{ fontSize: '8px', color: '#ffffff' }}>
                  {discoveredSynergies.length}/{allSynergies.length}
                </span>
              </div>
              <div className="snes-progress" style={{ height: '10px' }}>
                <div
                  className="snes-progress__fill"
                  style={{
                    width: `${(discoveredSynergies.length / allSynergies.length) * 100}%`
                  }}
                />
              </div>
            </div>
            
            {tierOrder.map(tier => {
              const tierSynergies = allSynergies.filter(s => s.tier === tier);
              const discoveredInTier = tierSynergies.filter(s => s.discovered).length;
              
              if (tierSynergies.length === 0) return null;
              
              return (
                <div key={tier}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span className="snes-pixel" style={{
                      fontSize: '7px',
                      color: getTierHex(tier)
                    }}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </span>
                    <span className="snes-pixel" style={{ fontSize: '7px', color: '#ffffff' }}>
                      {discoveredInTier}/{tierSynergies.length}
                    </span>
                  </div>
                  <div className="snes-progress" style={{ height: '8px' }}>
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: getTierHex(tier),
                        width: `${(discoveredInTier / tierSynergies.length) * 100}%`,
                        boxShadow: 'inset 0 2px 0 0 rgba(255,255,255,0.3)',
                        transition: 'none'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { synergySystemV2 } from '@game/mechanics/SynergySystemV2';
import { haptics } from '@utils/mobile';
import { Zap, Lock, Trophy, Sparkles, Filter } from 'lucide-react';

export const SynergyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'discovered' | 'hints'>('discovered');
  const discoveredSynergies = synergySystemV2.getDiscoveredSynergies();
  const undiscoveredCount = synergySystemV2.getUndiscoveredSynergiesCount();
  const allSynergies = synergySystemV2.getAllSynergies();
  
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'mythic': return 'text-purple-400 bg-purple-500/20 border-purple-500';
      case 'legendary': return 'text-amber-400 bg-amber-500/20 border-amber-500';
      case 'rare': return 'text-blue-400 bg-blue-500/20 border-blue-500';
      default: return 'text-emerald-400 bg-emerald-500/20 border-emerald-500';
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
      backgroundColor: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        borderBottom: '1px solid #374151',
        padding: '8px 12px',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ec4899',
          margin: 0
        }}>Synergy Discovery</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '4px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Lock size={12} color="#9ca3af" />
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{undiscoveredCount} Hidden</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Zap size={12} color="#ec4899" />
            <span style={{ fontSize: '11px', color: '#ec4899' }}>{discoveredSynergies.length} Discovered</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        padding: '8px 12px 0',
        backgroundColor: '#111827'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilter('discovered')}
            style={{
              padding: '6px 12px',
              backgroundColor: filter === 'discovered' ? '#ec4899' : '#1f2937',
              color: filter === 'discovered' ? '#ffffff' : '#9ca3af',
              border: '1px solid',
              borderColor: filter === 'discovered' ? '#ec4899' : '#374151',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            Discovered
          </button>
          <button
            onClick={() => setFilter('hints')}
            style={{
              padding: '6px 12px',
              backgroundColor: filter === 'hints' ? '#ec4899' : '#1f2937',
              color: filter === 'hints' ? '#ffffff' : '#9ca3af',
              border: '1px solid',
              borderColor: filter === 'hints' ? '#ec4899' : '#374151',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            Hints
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 12px',
              backgroundColor: filter === 'all' ? '#ec4899' : '#1f2937',
              color: filter === 'all' ? '#ffffff' : '#9ca3af',
              border: '1px solid',
              borderColor: filter === 'all' ? '#ec4899' : '#374151',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            All
          </button>
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
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>No Synergies Found</h3>
            <p style={{ fontSize: '14px' }}>
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
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: getTierColor(tier).split(' ')[0].replace('text-', '#').replace('purple-400', 'a855f7').replace('amber-400', 'fbbf24').replace('blue-400', '60a5fa').replace('emerald-400', '34d399')
                  }}>
                    {React.cloneElement(getTierIcon(tier), { size: 14 })}
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
                            backgroundColor: getTierColor(synergy.tier).split(' ')[1].replace('bg-', 'rgba(').replace('purple-500/20', '168, 85, 247, 0.2)').replace('amber-500/20', '251, 191, 36, 0.2)').replace('blue-500/20', '96, 165, 250, 0.2)').replace('emerald-500/20', '52, 211, 153, 0.2)'),
                            border: `1px solid ${getTierColor(synergy.tier).split(' ')[2].replace('border-', '#').replace('purple-500', 'a855f7').replace('amber-500', 'fbbf24').replace('blue-500', '60a5fa').replace('emerald-500', '34d399')}`,
                            borderRadius: '10px',
                            padding: '12px',
                            opacity: !isDiscovered ? 0.6 : 1,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                            <div style={{ fontSize: '20px', flexShrink: 0 }}>
                              {isDiscovered ? (
                                React.cloneElement(getTierIcon(synergy.tier), { size: 20 })
                              ) : (
                                <Lock size={20} color="#6b7280" />
                              )}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                marginBottom: '4px'
                              }}>
                                {isDiscovered ? synergy.name : '???'}
                              </h4>
                              
                              {isDiscovered && (
                                <>
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    marginBottom: '6px'
                                  }}>
                                    {synergy.description}
                                  </p>
                                  
                                  {/* Requirements */}
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#9ca3af',
                                    marginBottom: '6px'
                                  }}>
                                    {synergy.requirements.bands && (
                                      <p style={{ margin: '2px 0' }}>Bands: {synergy.requirements.bands.join(' + ')}</p>
                                    )}
                                    {synergy.requirements.venueTypes && (
                                      <p style={{ margin: '2px 0' }}>Venues: {synergy.requirements.venueTypes.join(', ')}</p>
                                    )}
                                    {synergy.requirements.traits && (
                                      <p style={{ margin: '2px 0' }}>Traits: {synergy.requirements.traits.join(', ')}</p>
                                    )}
                                  </div>
                                  
                                  {/* Effects */}
                                  <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '4px'
                                  }}>
                                    <span style={{
                                      padding: '2px 6px',
                                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                      color: '#10b981',
                                      fontSize: '11px',
                                      borderRadius: '4px',
                                      fontWeight: '500'
                                    }}>
                                      {synergy.effects.attendanceMultiplier}x attendance
                                    </span>
                                    {synergy.effects.reputationBonus > 0 && (
                                      <span style={{
                                        padding: '2px 6px',
                                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                                        color: '#fbbf24',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                      }}>
                                        +{synergy.effects.reputationBonus} rep
                                      </span>
                                    )}
                                    {synergy.effects.fansGained > 0 && (
                                      <span style={{
                                        padding: '2px 6px',
                                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                                        color: '#ec4899',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                      }}>
                                        +{synergy.effects.fansGained} fans
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Times Triggered */}
                                  {synergy.timesTriggered > 0 && (
                                    <p style={{
                                      fontSize: '11px',
                                      color: '#9ca3af',
                                      marginTop: '6px'
                                    }}>
                                      Triggered {synergy.timesTriggered} times
                                    </p>
                                  )}
                                </>
                              )}
                              
                              {showHint && synergy.hints && (
                                <div style={{
                                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  marginTop: '6px'
                                }}>
                                  <p style={{
                                    fontSize: '12px',
                                    fontStyle: 'italic',
                                    color: '#9ca3af'
                                  }}>
                                    💡 {synergy.hints}
                                  </p>
                                </div>
                              )}
                              
                              {!isDiscovered && !showHint && (
                                <p style={{
                                  fontSize: '12px',
                                  color: '#9ca3af',
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
        <div style={{
          marginTop: '24px',
          backgroundImage: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))',
          border: '1px solid #374151',
          borderRadius: '10px',
          padding: '12px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '10px'
          }}>Discovery Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#d1d5db' }}>Overall Progress</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                  {discoveredSynergies.length}/{allSynergies.length}
                </span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: '#374151',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    height: '100%',
                    backgroundImage: 'linear-gradient(to right, #ec4899, #a855f7)',
                    width: `${(discoveredSynergies.length / allSynergies.length) * 100}%`,
                    transition: 'width 0.3s'
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
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: getTierColor(tier).split(' ')[0].replace('text-', '#').replace('purple-400', 'a855f7').replace('amber-400', 'fbbf24').replace('blue-400', '60a5fa').replace('emerald-400', '34d399')
                    }}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>
                      {discoveredInTier}/{tierSynergies.length}
                    </span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#374151',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        height: '100%',
                        backgroundColor: getTierColor(tier).split(' ')[0].replace('text-', '#').replace('purple-400', 'a855f7').replace('amber-400', 'fbbf24').replace('blue-400', '60a5fa').replace('emerald-400', '34d399'),
                        width: `${(discoveredInTier / tierSynergies.length) * 100}%`,
                        transition: 'width 0.3s'
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
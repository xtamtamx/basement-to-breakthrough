import React, { useState } from 'react';
import { Band, Genre } from '@game/types';
import { haptics } from '@utils/mobile';
import { BandUpgradeModal } from '../BandUpgradeModal';
import { synergySystemV2 } from '@game/mechanics/SynergySystemV2';
import { useGameStore } from '@stores/gameStore';
import { Users, UserPlus, UserMinus, TrendingUp, Star, Zap, Music } from 'lucide-react';

export const BandsView: React.FC = () => {
  const { allBands, rosterBandIds, addBandToRoster, removeBandFromRoster } = useGameStore();
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'roster'>('all');
  const [upgradeModalBand, setUpgradeModalBand] = useState<Band | null>(null);

  const handleAddToRoster = (bandId: string) => {
    if (!rosterBandIds.includes(bandId)) {
      addBandToRoster(bandId);
      haptics.success();
    }
  };

  const handleRemoveFromRoster = (bandId: string) => {
    removeBandFromRoster(bandId);
    haptics.light();
  };

  const handleBandClick = (band: Band) => {
    setSelectedBand(band.id === selectedBand?.id ? null : band);
    haptics.light();
  };

  const filteredBands = allBands.filter(band => {
    if (filter === 'roster') return rosterBandIds.includes(band.id);
    if (filter === 'available') return !rosterBandIds.includes(band.id);
    return true;
  });

  const getGenreIcon = (genre: Genre) => {
    switch (genre) {
      case Genre.PUNK: return '🎸';
      case Genre.METAL: return '🤘';
      case Genre.INDIE: return '🎵';
      case Genre.HIPHOP: return '🎤';
      case Genre.ELECTRONIC: return '🎹';
      default: return '🎵';
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
        }}>Bands</h2>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '4px 10px',
              backgroundColor: filter === 'all' ? '#ec4899' : 'transparent',
              color: filter === 'all' ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            All ({allBands.length})
          </button>
          <button
            onClick={() => setFilter('roster')}
            style={{
              padding: '4px 10px',
              backgroundColor: filter === 'roster' ? '#ec4899' : 'transparent',
              color: filter === 'roster' ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Roster ({rosterBandIds.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            style={{
              padding: '4px 10px',
              backgroundColor: filter === 'available' ? '#ec4899' : 'transparent',
              color: filter === 'available' ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Available
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
        {filteredBands.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎸</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>No bands found</h3>
            <p style={{ fontSize: '14px' }}>
              {filter === 'roster' ? 'Add some bands to your roster!' : 'No bands match your filter'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredBands.map(band => {
              const isInRoster = rosterBandIds.includes(band.id);
              const isSelected = selectedBand?.id === band.id;
              
              return (
                <div key={band.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Band Card */}
                  <div 
                    style={{
                      backgroundColor: '#1f2937',
                      border: isSelected ? '2px solid #ec4899' : '1px solid #374151',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '44px'
                    }}
                    onClick={() => handleBandClick(band)}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Band Icon */}
                      <div style={{
                        fontSize: '24px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#111827',
                        borderRadius: '8px'
                      }}>
                        {getGenreIcon(band.genre)}
                      </div>
                      
                      {/* Band Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '4px',
                          gap: '8px'
                        }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 style={{
                              fontSize: '15px',
                              fontWeight: 'bold',
                              color: '#ffffff',
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{band.name}</h3>
                            <p style={{
                              fontSize: '12px',
                              color: '#9ca3af',
                              margin: '2px 0 0 0'
                            }}>
                              {band.genre} • {band.hometown}
                            </p>
                          </div>
                          
                          {/* Badges */}
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            {isInRoster && (
                              <span style={{
                                padding: '2px 6px',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: '600',
                                borderRadius: '4px'
                              }}>Roster</span>
                            )}
                            {band.isRealArtist && (
                              <span style={{
                                padding: '2px 6px',
                                backgroundColor: '#ec4899',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: '600',
                                borderRadius: '4px'
                              }}>Real</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Stats Preview */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          marginTop: '6px'
                        }}>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '2px'
                            }}>
                              <span style={{ fontSize: '10px', color: '#6b7280' }}>Pop</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ec4899' }}>{band.popularity}</span>
                            </div>
                            <div style={{
                              height: '3px',
                              backgroundColor: '#374151',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div 
                                style={{
                                  height: '100%',
                                  backgroundColor: '#ec4899',
                                  width: `${band.popularity}%`,
                                  transition: 'width 0.3s'
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '2px'
                            }}>
                              <span style={{ fontSize: '10px', color: '#6b7280' }}>Energy</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{band.energy}</span>
                            </div>
                            <div style={{
                              height: '3px',
                              backgroundColor: '#374151',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div 
                                style={{
                                  height: '100%',
                                  backgroundColor: '#fbbf24',
                                  width: `${band.energy}%`,
                                  transition: 'width 0.3s'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isSelected && (
                    <div style={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '10px',
                      padding: '12px',
                      animation: 'slideDown 0.2s ease-out'
                    }}>
                      {band.bio && (
                        <p style={{
                          fontSize: '12px',
                          color: '#d1d5db',
                          marginBottom: '10px',
                          lineHeight: '1.5'
                        }}>{band.bio}</p>
                      )}
                      
                      {/* Full Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          backgroundColor: '#111827',
                          borderRadius: '6px',
                          padding: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '2px'
                          }}>
                            <Star size={12} color="#ec4899" />
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Popularity</span>
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>{band.popularity}</div>
                        </div>
                        <div style={{
                          backgroundColor: '#111827',
                          borderRadius: '6px',
                          padding: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '2px'
                          }}>
                            <Zap size={12} color="#fbbf24" />
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Energy</span>
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>{band.energy}</div>
                        </div>
                      </div>
                      
                      {/* Synergies */}
                      {band.relationships && Object.keys(band.relationships).length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ec4899',
                            marginBottom: '8px'
                          }}>Band Relationships</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.entries(band.relationships).map(([bandId, type]) => (
                              <span
                                key={bandId}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: type === 'friends' ? '#10b981' : '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  borderRadius: '4px'
                                }}
                              >
                                {type === 'friends' ? '👫' : '⚔️'} {allBands.find(b => b.id === bandId)?.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isInRoster ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromRoster(band.id);
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                          >
                            <UserMinus size={16} />
                            Remove from Roster
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToRoster(band.id);
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                          >
                            <UserPlus size={16} />
                            Add to Roster
                          </button>
                        )}
                        
                        {band.upgrades && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpgradeModalBand(band);
                            }}
                            style={{
                              padding: '10px 16px',
                              backgroundColor: '#374151',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                          >
                            <TrendingUp size={16} />
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Band Upgrade Modal */}
      {upgradeModalBand && (
        <BandUpgradeModal
          band={upgradeModalBand}
          isOpen={true}
          onClose={() => setUpgradeModalBand(null)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      ` }} />
    </div>
  );
};
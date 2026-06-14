import React, { useState } from 'react';
import { Band, Genre } from '@game/types';
import { haptics } from '@utils/mobile';
import { BandUpgradeModal } from '../BandUpgradeModal';
import { useGameStore } from '@stores/gameStore';
import { UserPlus, UserMinus, TrendingUp, Star, Zap } from 'lucide-react';

type Filter = 'all' | 'available' | 'roster';

export const BandsView: React.FC = () => {
  const { allBands, rosterBandIds, addBandToRoster, removeBandFromRoster } = useGameStore();
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
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
      case Genre.ELECTRONIC: return '🎹';
      default: return '🎵';
    }
  };

  const availableCount = allBands.length - rosterBandIds.length;
  const filterTabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allBands.length },
    { id: 'roster', label: 'Roster', count: rosterBandIds.length },
    { id: 'available', label: 'Available', count: availableCount },
  ];

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
        backgroundColor: 'rgba(10, 8, 18, 0.6)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1f2937',
        padding: 'calc(8px + env(safe-area-inset-top)) 14px 8px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: '17px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>The Roster</h2>
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            margin: '1px 0 0'
          }}>Scout the scene, sign the legends.</p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          border: '1px solid #1f2937',
          borderRadius: '10px',
          padding: '3px',
          flexShrink: 0
        }}>
          {filterTabs.map(tab => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: active ? '#ec4899' : 'transparent',
                  color: active ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label} <span style={{ opacity: 0.7 }}>{tab.count}</span>
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
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
      }}>
        {filteredBands.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid #1f2937',
            borderRadius: '14px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '12px', opacity: 0.85 }}>🎸</div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 6px'
            }}>{filter === 'roster' ? 'Empty roster' : 'No bands here'}</h3>
            <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              {filter === 'roster'
                ? 'Sign some acts and start a scene worth bragging about.'
                : 'Nothing matches this filter — try another tab.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredBands.map(band => {
              const isInRoster = rosterBandIds.includes(band.id);
              const isSelected = selectedBand?.id === band.id;

              return (
                <div key={band.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Band Card */}
                  <div
                    style={{
                      backgroundColor: '#111827',
                      border: isSelected ? '1px solid #ec4899' : '1px solid #1f2937',
                      boxShadow: isSelected ? '0 0 0 1px #ec4899, 0 6px 16px rgba(236,72,153,0.18)' : 'none',
                      borderRadius: '12px',
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
                        fontSize: '22px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        border: '1px solid #1f2937',
                        borderRadius: '10px'
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
                              fontWeight: 700,
                              color: '#ffffff',
                              margin: 0,
                              letterSpacing: '-0.01em',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{band.name}</h3>
                            <p style={{
                              fontSize: '11px',
                              color: '#9ca3af',
                              margin: '2px 0 0 0'
                            }}>
                              {band.genre}{band.hometown ? ` • ${band.hometown}` : ''}
                            </p>
                          </div>

                          {/* Badges */}
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            {isInRoster && (
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: 'rgba(16,185,129,0.15)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '999px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em'
                              }}>Signed</span>
                            )}
                            {band.isRealArtist && (
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: 'rgba(236,72,153,0.15)',
                                border: '1px solid #ec4899',
                                color: '#f9a8d4',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '999px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em'
                              }}>Real</span>
                            )}
                          </div>
                        </div>

                        {/* Stats Preview */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          marginTop: '8px'
                        }}>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '3px'
                            }}>
                              <span style={{
                                fontSize: '9px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontWeight: 700
                              }}>Pop</span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ec4899' }}>{band.popularity}</span>
                            </div>
                            <div style={{
                              height: '4px',
                              backgroundColor: '#1f2937',
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
                              marginBottom: '3px'
                            }}>
                              <span style={{
                                fontSize: '9px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontWeight: 700
                              }}>Energy</span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>{band.energy}</span>
                            </div>
                            <div style={{
                              height: '4px',
                              backgroundColor: '#1f2937',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div
                                style={{
                                  height: '100%',
                                  backgroundColor: '#f59e0b',
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
                      backgroundColor: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '12px',
                      padding: '12px',
                      animation: 'slideDown 0.2s ease-out'
                    }}>
                      {band.bio && (
                        <p style={{
                          fontSize: '12px',
                          color: '#d1d5db',
                          margin: '0 0 12px',
                          lineHeight: '1.5'
                        }}>{band.bio}</p>
                      )}

                      {/* Full Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: '1px solid #1f2937',
                          borderRadius: '10px',
                          padding: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            <Star size={12} color="#ec4899" />
                            <span style={{
                              fontSize: '10px',
                              color: '#9ca3af',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontWeight: 700
                            }}>Popularity</span>
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{band.popularity}</div>
                        </div>
                        <div style={{
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: '1px solid #1f2937',
                          borderRadius: '10px',
                          padding: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            <Zap size={12} color="#f59e0b" />
                            <span style={{
                              fontSize: '10px',
                              color: '#9ca3af',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontWeight: 700
                            }}>Energy</span>
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{band.energy}</div>
                        </div>
                      </div>

                      {/* Synergies */}
                      {band.relationships && band.relationships.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <h4 style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#9ca3af',
                            margin: '0 0 8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Band Relationships</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {band.relationships.map((rel) => {
                              const isFriendly = rel.relationship >= 0;
                              return (
                                <span
                                  key={rel.bandId}
                                  style={{
                                    padding: '4px 10px',
                                    backgroundColor: isFriendly ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                    border: `1px solid ${isFriendly ? '#10b981' : '#ef4444'}`,
                                    color: isFriendly ? '#34d399' : '#f87171',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '999px'
                                  }}
                                >
                                  {isFriendly ? '👫' : '⚔️'} {allBands.find(b => b.id === rel.bandId)?.name}
                                </span>
                              );
                            })}
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
                              padding: '12px',
                              backgroundColor: 'transparent',
                              color: '#f87171',
                              border: '1px solid #b91c1c',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(185,28,28,0.18)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <UserMinus size={16} />
                            Drop from Roster
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToRoster(band.id);
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundImage: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                              transition: 'transform 0.15s'
                            }}
                            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            <UserPlus size={16} />
                            Sign to Roster
                          </button>
                        )}

                        {band.upgrades && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpgradeModalBand(band);
                            }}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              color: '#ffffff',
                              border: '1px solid #1f2937',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#374151'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f2937'; }}
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

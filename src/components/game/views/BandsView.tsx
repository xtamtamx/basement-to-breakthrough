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
      backgroundColor: '#0a0814',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="snes-bar snes-bar--top" style={{
        padding: 'calc(8px + env(safe-area-inset-top)) 14px 8px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="snes-pixel" style={{
            fontSize: '12px',
            color: '#ffffff',
            margin: 0,
            letterSpacing: 0
          }}>The Roster</h2>
          <p style={{
            fontSize: '11px',
            color: '#b9b3d6',
            margin: '3px 0 0'
          }}>Scout the scene, sign the legends.</p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#0f0b1e',
          border: '2px solid #0a0814',
          boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
          borderRadius: 0,
          padding: '3px',
          flexShrink: 0
        }}>
          {filterTabs.map(tab => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="snes-pixel"
                style={{
                  padding: '8px 10px',
                  minHeight: '44px',
                  backgroundColor: active ? '#f72585' : 'transparent',
                  color: active ? '#ffffff' : '#6f6796',
                  border: 'none',
                  borderRadius: 0,
                  fontSize: '8px',
                  letterSpacing: 0,
                  cursor: 'pointer',
                  transition: 'none',
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
          <div className="snes-panel-inset" style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '2px solid #ffd23f',
            borderRadius: 0,
            color: '#b9b3d6'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎸</div>
            <h3 className="snes-pixel" style={{
              fontSize: '11px',
              color: '#ffffff',
              margin: '0 0 10px',
              letterSpacing: 0
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
                      backgroundColor: '#171327',
                      border: isSelected ? '2px solid #f72585' : '2px solid #0a0814',
                      boxShadow: isSelected
                        ? 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #f72585'
                        : 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                      borderRadius: 0,
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'none',
                      minHeight: '44px'
                    }}
                    onClick={() => handleBandClick(band)}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Band Icon */}
                      <div className="snes-panel-inset" style={{
                        fontSize: '22px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: 0
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
                            <h3 className="snes-pixel" style={{
                              fontSize: '10px',
                              color: '#ffffff',
                              margin: 0,
                              letterSpacing: 0,
                              lineHeight: 1.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{band.name}</h3>
                            <p style={{
                              fontSize: '11px',
                              color: '#b9b3d6',
                              margin: '5px 0 0 0'
                            }}>
                              {band.genre}{band.hometown ? ` • ${band.hometown}` : ''}
                            </p>
                          </div>

                          {/* Badges */}
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            {isInRoster && (
                              <span className="snes-pixel" style={{
                                padding: '4px 8px',
                                backgroundColor: '#0f0b1e',
                                border: '2px solid #3ad17e',
                                color: '#3ad17e',
                                fontSize: '7px',
                                borderRadius: 0,
                                textTransform: 'uppercase',
                                letterSpacing: 0
                              }}>Signed</span>
                            )}
                            {band.isRealArtist && (
                              <span className="snes-pixel" style={{
                                padding: '4px 8px',
                                backgroundColor: '#0f0b1e',
                                border: '2px solid #f72585',
                                color: '#f72585',
                                fontSize: '7px',
                                borderRadius: 0,
                                textTransform: 'uppercase',
                                letterSpacing: 0
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
                              marginBottom: '4px'
                            }}>
                              <span className="snes-pixel" style={{
                                fontSize: '7px',
                                color: '#6f6796',
                                textTransform: 'uppercase',
                                letterSpacing: 0
                              }}>Pop</span>
                              <span className="snes-pixel" style={{ fontSize: '8px', color: '#f72585', letterSpacing: 0 }}>{band.popularity}</span>
                            </div>
                            <div style={{
                              height: '6px',
                              backgroundColor: '#0f0b1e',
                              border: '2px solid #0a0814',
                              borderRadius: 0,
                              overflow: 'hidden'
                            }}>
                              <div
                                style={{
                                  height: '100%',
                                  backgroundColor: '#f72585',
                                  width: `${band.popularity}%`,
                                  transition: 'none'
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '4px'
                            }}>
                              <span className="snes-pixel" style={{
                                fontSize: '7px',
                                color: '#6f6796',
                                textTransform: 'uppercase',
                                letterSpacing: 0
                              }}>Energy</span>
                              <span className="snes-pixel" style={{ fontSize: '8px', color: '#ffd23f', letterSpacing: 0 }}>{band.energy}</span>
                            </div>
                            <div style={{
                              height: '6px',
                              backgroundColor: '#0f0b1e',
                              border: '2px solid #0a0814',
                              borderRadius: 0,
                              overflow: 'hidden'
                            }}>
                              <div
                                style={{
                                  height: '100%',
                                  backgroundColor: '#ffd23f',
                                  width: `${band.energy}%`,
                                  transition: 'none'
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
                    <div className="snes-panel" style={{
                      borderRadius: 0,
                      padding: '12px'
                    }}>
                      {band.bio && (
                        <p style={{
                          fontSize: '12px',
                          color: '#b9b3d6',
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
                        <div className="snes-panel-inset" style={{
                          borderRadius: 0,
                          padding: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px'
                          }}>
                            <Star size={12} color="#f72585" />
                            <span className="snes-pixel" style={{
                              fontSize: '7px',
                              color: '#b9b3d6',
                              textTransform: 'uppercase',
                              letterSpacing: 0
                            }}>Popularity</span>
                          </div>
                          <div className="snes-pixel" style={{ fontSize: '16px', color: '#ffffff', lineHeight: 1, letterSpacing: 0 }}>{band.popularity}</div>
                        </div>
                        <div className="snes-panel-inset" style={{
                          borderRadius: 0,
                          padding: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px'
                          }}>
                            <Zap size={12} color="#ffd23f" />
                            <span className="snes-pixel" style={{
                              fontSize: '7px',
                              color: '#b9b3d6',
                              textTransform: 'uppercase',
                              letterSpacing: 0
                            }}>Energy</span>
                          </div>
                          <div className="snes-pixel" style={{ fontSize: '16px', color: '#ffffff', lineHeight: 1, letterSpacing: 0 }}>{band.energy}</div>
                        </div>
                      </div>

                      {/* Synergies */}
                      {band.relationships && band.relationships.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <h4 className="snes-pixel" style={{
                            fontSize: '8px',
                            color: '#b9b3d6',
                            margin: '0 0 8px',
                            textTransform: 'uppercase',
                            letterSpacing: 0
                          }}>Band Relationships</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {band.relationships.map((rel) => {
                              const isFriendly = rel.relationship >= 0;
                              return (
                                <span
                                  key={rel.bandId}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#0f0b1e',
                                    border: `2px solid ${isFriendly ? '#3ad17e' : '#ff5c57'}`,
                                    color: isFriendly ? '#3ad17e' : '#ff5c57',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: 0
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
                            className="snes-btn snes-btn--danger snes-pixel"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromRoster(band.id);
                            }}
                            style={{
                              flex: 1,
                              fontSize: '9px',
                              cursor: 'pointer',
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'none'
                            }}
                          >
                            <UserMinus size={16} />
                            Drop from Roster
                          </button>
                        ) : (
                          <button
                            className="snes-btn snes-btn--green snes-pixel"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToRoster(band.id);
                            }}
                            style={{
                              flex: 1,
                              fontSize: '9px',
                              cursor: 'pointer',
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'none'
                            }}
                          >
                            <UserPlus size={16} />
                            Sign to Roster
                          </button>
                        )}

                        {band.upgrades && (
                          <button
                            className="snes-btn snes-btn--ghost snes-pixel"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpgradeModalBand(band);
                            }}
                            style={{
                              fontSize: '9px',
                              cursor: 'pointer',
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'none'
                            }}
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
    </div>
  );
};

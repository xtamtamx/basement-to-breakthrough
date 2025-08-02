import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { ModernCityRenderer } from '@/components/map/ModernCityRenderer';
import { haptics } from '@utils/mobile';
import { DistrictViewBasic } from '../DistrictViewBasic';
import { DistrictInfo } from '@/game/generation/CityGenerator';
import { VenueUpgradeModal } from '@/components/venue/VenueUpgradeModal';
import { Plus, ZoomOut, Building2, TrendingUp, MapPin, Users, X } from 'lucide-react';
import { MapTile, VenueData, WorkplaceData } from '@/components/map/MapTypes';

const animationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

export const CityView: React.FC = () => {
  const gameStore = useGameStore();
  const [viewMode, setViewMode] = useState<'overview' | 'district'>('overview');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedDistrictInfo, setSelectedDistrictInfo] = useState<DistrictInfo | null>(null);
  const [selectedTileData, setSelectedTileData] = useState<{ tile: MapTile; venue?: any } | null>(null);
  const [showVenueUpgrade, setShowVenueUpgrade] = useState(false);

  // Ensure initial data is loaded
  useEffect(() => {
    if (gameStore.venues.length === 0) {
      gameStore.loadInitialGameData();
    }
  }, []);



  const handleDistrictClick = (districtId: string, districtInfo: DistrictInfo) => {
    setSelectedDistrictId(districtId);
    setSelectedDistrictInfo(districtInfo);
    setViewMode('district');
    haptics.light();
  };

  const handleZoomOut = () => {
    setViewMode('overview');
    setSelectedDistrictId(null);
    setSelectedDistrictInfo(null);
    haptics.light();
  };

  const handlePlaceVenue = () => {
    // TODO: Implement venue placement
    haptics.medium();
  };

  const handleBuildingClick = (building: any) => {
    haptics.medium();
    
    if (building.type === 'venue') {
      // Find a matching venue in the game store
      const gameVenue = gameStore.venues[0]; // For now, just use the first venue
      setSelectedTileData({ 
        tile: {
          x: building.x,
          y: building.y,
          type: 'venue',
          district: 'downtown',
          spriteId: 'venue',
          interactable: true,
          data: {
            id: gameVenue?.id || 'venue-1',
            name: gameVenue?.name || 'The Basement',
            capacity: gameVenue?.capacity || 50,
            venueType: gameVenue?.type || 'basement',
            hasActiveShow: false,
          } as VenueData
        },
        venue: gameVenue 
      });
    } else if (building.type === 'workplace') {
      setSelectedTileData({
        tile: {
          x: building.x,
          y: building.y,
          type: 'workplace',
          district: 'downtown',
          spriteId: 'workplace',
          interactable: true,
          data: {
            id: `job-${building.x}-${building.y}`,
            name: building.subtype || 'Coffee Shop',
            jobType: building.subtype || 'Barista',
            wage: 30,
            stress: 20,
            available: true,
          } as WorkplaceData
        }
      });
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
      {/* Minimal Header for district view */}
      {viewMode === 'district' && (
        <div style={{
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ec4899',
              margin: 0
            }}>{selectedDistrictInfo?.name || 'District'}</h3>
            <div style={{
              display: 'flex',
              gap: '12px',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '2px'
            }}>
              <span>🏘️ {selectedDistrictInfo?.sceneStrength}%</span>
              <span>💰 {selectedDistrictInfo?.rentMultiplier}x</span>
            </div>
          </div>
          <button
            onClick={handleZoomOut}
            style={{
              padding: '6px 12px',
              backgroundColor: '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '32px'
            }}
          >
            <ZoomOut size={14} />
            Back
          </button>
        </div>
      )}

      {/* Map Content */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a'
      }}>
        {viewMode === 'overview' ? (
          <>
            {/* Full screen map */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#0a0a0a'
            }}>
              <ModernCityRenderer onBuildingClick={handleBuildingClick} />
            </div>
            
            {/* Compact Stats Overlay */}
            <div style={{
              position: 'absolute',
              left: '12px',
              bottom: 'calc(5rem + env(safe-area-inset-bottom))',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '6px',
                padding: '6px 10px',
                border: '1px solid #374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px'
              }}>
                <Building2 size={12} color="#ec4899" />
                <span style={{ color: '#9ca3af' }}>Venues:</span>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>{gameStore.venues.length}</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '6px',
                padding: '6px 10px',
                border: '1px solid #374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px'
              }}>
                <TrendingUp size={12} color="#10b981" />
                <span style={{ color: '#9ca3af' }}>Scene:</span>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>
                  {Math.round(gameStore.districts.reduce((acc, d) => acc + d.sceneStrength, 0) / gameStore.districts.length)}%
                </span>
              </div>
            </div>

          </>
        ) : (
          <DistrictViewBasic 
            districtId={selectedDistrictId || ''} 
            districtInfo={selectedDistrictInfo || undefined}
          />
        )}
      </div>

      {/* Floating Action Button for district view */}
      {viewMode === 'district' && (
        <button
          onClick={handlePlaceVenue}
          style={{
            position: 'fixed',
            right: '80px',
            bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 0.5rem)',
            width: '48px',
            height: '48px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          aria-label="Place new venue"
        >
          <Plus size={20} />
        </button>
      )}

      {/* Venue Modal */}
      {selectedTileData && selectedTileData.tile.type === 'venue' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
          padding: '20px'
        }} onClick={(e) => {
          e.stopPropagation();
          setSelectedTileData(null);
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            borderTop: '2px solid #ec4899',
            borderLeft: '1px solid #374151',
            borderRight: '1px solid #374151',
            borderRadius: '16px',
            padding: '16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '80vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out',
            marginBottom: '0'
          }} onClick={e => e.stopPropagation()}>
            {/* Pull handle */}
            <div style={{
              width: '36px',
              height: '3px',
              backgroundColor: '#374151',
              borderRadius: '2px',
              margin: '0 auto 12px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 4px',
                  letterSpacing: '-0.01em'
                }}>{(selectedTileData.tile.data as VenueData).name}</h2>
                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={12} color="#ec4899" />
                  <span>{selectedTileData.tile.district?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown District'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTileData(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #374151',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#111827',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #1f2937',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Capacity</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ec4899',
                  lineHeight: '1'
                }}>{(selectedTileData.tile.data as VenueData).capacity}</div>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>people</div>
              </div>
              <div style={{
                backgroundColor: '#111827',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #1f2937',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Type</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  lineHeight: '1'
                }}>{((selectedTileData.tile.data as VenueData).venueType || 'Venue').replace(/_/g, ' ')}</div>
              </div>
            </div>

            {/* Modifiers and Synergies */}
            <div style={{
              marginBottom: '16px'
            }}>
              <h4 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Venue Traits</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{
                  backgroundColor: '#111827',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  border: '1px solid #1f2937',
                  fontSize: '11px'
                }}>
                  <span style={{ color: '#9ca3af' }}>Acoustics: </span>
                  <span style={{ color: '#ec4899', fontWeight: '600' }}>Good</span>
                </div>
                <div style={{
                  backgroundColor: '#111827',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  border: '1px solid #1f2937',
                  fontSize: '11px'
                }}>
                  <span style={{ color: '#9ca3af' }}>Vibe: </span>
                  <span style={{ color: '#ec4899', fontWeight: '600' }}>Intimate</span>
                </div>
              </div>
              
              {/* Synergies */}
              <div style={{
                backgroundColor: '#111827',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #1f2937'
              }}>
                <h4 style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Synergies</h4>
                <p style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  margin: '0 0 6px 0',
                  lineHeight: '1.4'
                }}>
                  • +20% audience energy for punk bands<br/>
                  • Perfect for acoustic sets under 50 people<br/>
                  • Unlocks "Underground Legend" achievement
                </p>
                {(selectedTileData.tile.data as VenueData).hasActiveShow && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #1f2937',
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    🎸 Show in Progress!
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #1f2937'
            }}>
              {selectedTileData.venue ? (
                (() => {
                  const hasUpgrades = selectedTileData.venue.upgrades && 
                    selectedTileData.venue.upgrades.length > 0;
                  
                  return (
                    <button
                      onClick={() => {
                        if (hasUpgrades) {
                          setShowVenueUpgrade(true);
                          haptics.light();
                        }
                      }}
                      disabled={!hasUpgrades}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundImage: hasUpgrades 
                          ? 'linear-gradient(135deg, #ec4899, #db2777)'
                          : 'none',
                        backgroundColor: hasUpgrades 
                          ? 'transparent' 
                          : '#374151',
                        color: hasUpgrades 
                          ? '#ffffff' 
                          : '#6b7280',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: hasUpgrades 
                          ? 'pointer' 
                          : 'not-allowed',
                        minHeight: '40px',
                        boxShadow: hasUpgrades 
                          ? '0 4px 12px rgba(236, 72, 153, 0.3)' 
                          : 'none',
                        transition: 'transform 0.2s',
                        opacity: hasUpgrades ? 1 : 0.6
                      }}
                      onMouseDown={(e) => {
                        if (hasUpgrades) {
                          e.currentTarget.style.transform = 'scale(0.98)';
                        }
                      }}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {hasUpgrades ? 'View Upgrades' : 'No Upgrades Available'}
                    </button>
                  );
                })()
              ) : (
                <div style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#111827',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0
                  }}>Not currently managed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workplace Modal */}
      {selectedTileData && selectedTileData.tile.type === 'workplace' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
          padding: '20px'
        }} onClick={(e) => {
          e.stopPropagation();
          setSelectedTileData(null);
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            borderTop: '2px solid #06b6d4',
            borderLeft: '1px solid #374151',
            borderRight: '1px solid #374151',
            borderRadius: '16px',
            padding: '16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '80vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out',
            marginBottom: '0'
          }} onClick={e => e.stopPropagation()}>
            {/* Pull handle */}
            <div style={{
              width: '36px',
              height: '3px',
              backgroundColor: '#374151',
              borderRadius: '2px',
              margin: '0 auto 12px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 4px',
                  letterSpacing: '-0.01em'
                }}>{(selectedTileData.tile.data as WorkplaceData).name}</h2>
                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={12} color="#06b6d4" />
                  <span>{selectedTileData.tile.district?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown District'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTileData(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #374151',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Job Type Display */}
            <div style={{
              backgroundColor: '#111827',
              borderRadius: '8px',
              padding: '8px',
              marginBottom: '10px',
              textAlign: 'center',
              border: '1px solid #1f2937'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#06b6d4',
                textTransform: 'uppercase'
              }}>{(selectedTileData.tile.data as WorkplaceData).jobType}</div>
            </div>

            {/* Job Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#111827',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #1f2937',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Hourly Wage</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#10b981',
                  lineHeight: '1'
                }}>${(selectedTileData.tile.data as WorkplaceData).wage}</div>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '2px'
                }}>per turn</div>
              </div>
              <div style={{
                backgroundColor: '#111827',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #1f2937',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Stress Level</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: (selectedTileData.tile.data as WorkplaceData).stress > 30 ? '#ef4444' : '#f59e0b',
                  lineHeight: '1'
                }}>{(selectedTileData.tile.data as WorkplaceData).stress}%</div>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '2px'
                }}>{(selectedTileData.tile.data as WorkplaceData).stress > 30 ? 'high' : 'moderate'}</div>
              </div>
            </div>

            {/* Modifiers and Synergies */}
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #1f2937'
            }}>
              {/* Job Modifiers */}
              <div style={{
                marginBottom: '12px'
              }}>
                <h4 style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Modifiers</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  <div style={{
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #1f2937',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#9ca3af' }}>Creativity: </span>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>+2</span>
                  </div>
                  <div style={{
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #1f2937',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#9ca3af' }}>Network: </span>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>+1</span>
                  </div>
                  <div style={{
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #1f2937',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#9ca3af' }}>Time: </span>
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>-3</span>
                  </div>
                  <div style={{
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid #1f2937',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#9ca3af' }}>Energy: </span>
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>-2</span>
                  </div>
                </div>
              </div>

              {/* Synergies */}
              <div style={{
                backgroundColor: '#111827',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #1f2937',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Synergies</h4>
                <p style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  • +1 Creativity when working with other musicians<br/>
                  • Unlocks "Studio Access" perk at level 3
                </p>
              </div>
              
              {/* Upgrade Info */}
              {(() => {
                // TODO: Check for actual workplace perks/upgrades
                const hasPerks = false; // Placeholder - replace with actual perk check
                
                return (
                  <button
                    onClick={() => {
                      if (hasPerks) {
                        // TODO: Show workplace upgrades/perks
                        haptics.light();
                      }
                    }}
                    disabled={!hasPerks}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundImage: hasPerks 
                        ? 'linear-gradient(135deg, #06b6d4, #0891b2)'
                        : 'none',
                      backgroundColor: hasPerks 
                        ? 'transparent' 
                        : '#374151',
                      color: hasPerks 
                        ? '#ffffff' 
                        : '#6b7280',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: hasPerks 
                        ? 'pointer' 
                        : 'not-allowed',
                      minHeight: '40px',
                      boxShadow: hasPerks 
                        ? '0 4px 12px rgba(6, 182, 212, 0.3)' 
                        : 'none',
                      transition: 'transform 0.2s',
                      opacity: hasPerks ? 1 : 0.6
                    }}
                    onMouseDown={(e) => {
                      if (hasPerks) {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }
                    }}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {hasPerks ? 'View Job Perks' : 'No Perks Available'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Venue Upgrade Modal */}
      {selectedTileData?.venue && showVenueUpgrade && (
        <VenueUpgradeModal
          venue={selectedTileData.venue}
          isOpen={true}
          onClose={() => {
            setShowVenueUpgrade(false);
          }}
        />
      )}

      
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
    </div>
  );
};
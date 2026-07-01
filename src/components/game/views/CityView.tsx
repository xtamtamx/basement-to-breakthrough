import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { PixelCityMap } from '@/components/map/PixelCityMap';
import { haptics } from '@utils/mobile';
import { DistrictViewBasic } from '../DistrictViewBasic';
import { DistrictInfo } from '@/game/generation/CityGenerator';
import { VenueUpgradeModal } from '@/components/venue/VenueUpgradeModal';
import { SnesModal } from '@/components/ui/SnesModal';
import { ZoomOut, Building2, TrendingUp, MapPin, X } from 'lucide-react';
import { MapTile, VenueData, WorkplaceData } from '@/components/map/MapTypes';
import { DistrictType as CoreDistrictType } from '@/game/types/core';
import { Venue } from '@game/types';
import { CityShop, SHOP_DEFS } from '@game/world/cityShops';
import { CityLandmark } from '@game/world/landmarks';
import { unlockedVenues } from '@game/world/venueProgression';
import { dayJobSystem } from '@game/mechanics/DayJobSystem';

// Maps store district ids onto the core DistrictType used by DistrictInfo.
const STORE_DISTRICT_TYPE: Record<string, CoreDistrictType> = {
  downtown: CoreDistrictType.DOWNTOWN,
  eastside: CoreDistrictType.ARTS,
  industrial: CoreDistrictType.WAREHOUSE,
  university: CoreDistrictType.COLLEGE,
};

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
      opacity: 1;
    }
    to {
      opacity: 1;
    }
  }
`;

export const CityView: React.FC = () => {
  const gameStore = useGameStore();
  const [viewMode, setViewMode] = useState<'overview' | 'district'>('overview');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedDistrictInfo, setSelectedDistrictInfo] = useState<DistrictInfo | null>(null);
  const [selectedTileData, setSelectedTileData] = useState<{ tile: MapTile; venue?: Venue } | null>(null);
  const [showVenueUpgrade, setShowVenueUpgrade] = useState(false);
  const [selectedShop, setSelectedShop] = useState<CityShop | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<CityLandmark | null>(null);
  const [jobRefresh, setJobRefresh] = useState(0);

  // Ensure initial data is loaded (run once on mount via getState to avoid
  // depending on the ever-changing store snapshot)
  useEffect(() => {
    const store = useGameStore.getState();
    if (store.venues.length === 0) {
      store.loadInitialGameData();
    }
  }, []);



  // Read the live store district for the header so its sceneStrength /
  // rentMultiplier track per-turn gentrification drift, rather than the frozen
  // snapshot captured into selectedDistrictInfo when the district was selected.
  const liveDistrict = gameStore.districts.find((d) => d.id === selectedDistrictId);

  const handleZoomOut = () => {
    setViewMode('overview');
    setSelectedDistrictId(null);
    setSelectedDistrictInfo(null);
    haptics.light();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0814',
      overflow: 'hidden'
    }}>
      {/* Minimal Header for district view */}
      {viewMode === 'district' && (
        <div className="snes-bar snes-bar--top" style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <h3 className="snes-pixel" style={{
              fontSize: '12px',
              color: '#f72585',
              margin: 0
            }}>{selectedDistrictInfo?.name || 'District'}</h3>
            <div style={{
              display: 'flex',
              gap: '12px',
              fontSize: '11px',
              color: '#b9b3d6',
              marginTop: '4px'
            }}>
              <span className="snes-pixel" style={{ fontSize: '8px', color: '#b9b3d6' }} title="Scene strength — how established the underground scene is in this district. Grows as you throw DIY shows; higher means bigger built-in crowds and unlocks more venues/landmarks here.">🏘️ Scene {liveDistrict?.sceneStrength ?? selectedDistrictInfo?.sceneStrength}%</span>
              <span className="snes-pixel" style={{ fontSize: '8px', color: '#b9b3d6' }} title="Rent multiplier — how pricey venues are in this district vs. baseline.">💰 Rent {liveDistrict?.rentMultiplier ?? selectedDistrictInfo?.rentMultiplier}x</span>
            </div>
          </div>
          <button
            onClick={handleZoomOut}
            className="snes-btn snes-btn--ghost snes-btn--sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '44px'
            }}
          >
            <ZoomOut size={14} color="#b9b3d6" />
            Back
          </button>
        </div>
      )}

      {/* Map Content */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0a0814'
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
              backgroundColor: '#0a0814'
            }}>
              <PixelCityMap
                paused={!!(selectedTileData || selectedShop || selectedLandmark || showVenueUpgrade)}
                onDistrictClick={(district) => {
                  setSelectedDistrictId(district.id);
                  setSelectedDistrictInfo({
                    id: district.id,
                    name: district.name,
                    type: STORE_DISTRICT_TYPE[district.id] ?? CoreDistrictType.DOWNTOWN,
                    cells: [], // DistrictViewBasic expects these
                    bounds: {
                      x: district.bounds.x,
                      y: district.bounds.y,
                      width: district.bounds.width,
                      height: district.bounds.height,
                    },
                    center: {
                      x: district.bounds.x + district.bounds.width / 2,
                      y: district.bounds.y + district.bounds.height / 2,
                    },
                    neighbors: [],
                    color: district.color,
                    sceneStrength: district.sceneStrength,
                    rentMultiplier: district.rentMultiplier,
                  });
                  setViewMode('district');
                }}
                onVenueClick={(venue: Venue) => {
                  setSelectedTileData({
                    tile: {
                      x: 0,
                      y: 0,
                      type: 'venue',
                      district:
                        STORE_DISTRICT_TYPE[venue.location?.id ?? ''] ??
                        CoreDistrictType.DOWNTOWN,
                      spriteId: 'venue',
                      interactable: true,
                      data: {
                        id: venue.id,
                        name: venue.name,
                        capacity: venue.capacity,
                        venueType: venue.type,
                        hasActiveShow: useGameStore
                          .getState()
                          .scheduledShows.some(
                            (s) =>
                              s.venueId === venue.id &&
                              s.status === 'SCHEDULED',
                          ),
                      },
                    },
                    venue,
                  });
                }}
                onShopClick={(shop) => { setSelectedShop(shop); haptics.light(); }}
                onLandmarkClick={(lm) => { setSelectedLandmark(lm); haptics.light(); }}
              />
            </div>

            {/* Compact city-stats overlay — pinned top-left, just under the HUD.
                (Was floating in the bottom-left where it stacked awkwardly with the
                fixed TURN indicator.) */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div className="snes-chip">
                <Building2 size={12} color="#f72585" />
                <span style={{ color: '#b9b3d6' }}>Venues</span>
                <span style={{ color: '#ffffff' }}>{unlockedVenues(gameStore.venues, gameStore.peakReputation).length}</span>
              </div>
              <div className="snes-chip" title="Scene strength (city average) — how established your underground scene is. Grows as you throw DIY shows; higher means bigger built-in crowds and unlocks more venues/landmarks.">
                <TrendingUp size={12} color="#3ad17e" />
                <span style={{ color: '#b9b3d6' }}>Scene</span>
                <span style={{ color: '#ffffff' }}>
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

      {/* Venue Modal */}
      {selectedTileData && selectedTileData.tile.type === 'venue' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(8, 6, 18, 0.86)',
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
            backgroundColor: '#171327',
            borderTop: '3px solid #f72585',
            border: '2px solid #0a0814',
            borderTopWidth: '3px',
            borderTopColor: '#f72585',
            boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
            borderRadius: '0',
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
              backgroundColor: '#3a2f5c',
              borderRadius: '0',
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
                <h2 className="snes-pixel" style={{
                  fontSize: '12px',
                  color: '#ffffff',
                  margin: '0 0 6px'
                }}>{(selectedTileData.tile.data as VenueData).name}</h2>
                <p style={{
                  fontSize: '12px',
                  color: '#b9b3d6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={12} color="#f72585" />
                  <span>{selectedTileData.tile.district?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown District'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTileData(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0',
                  backgroundColor: '#1f1a3a',
                  border: '2px solid #0a0814',
                  color: '#b9b3d6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'none'
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
              <div className="snes-panel-inset" style={{
                padding: '12px',
                textAlign: 'center'
              }}>
                <div className="snes-pixel" style={{
                  fontSize: '8px',
                  color: '#b9b3d6',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Capacity</div>
                <div className="snes-pixel" style={{
                  fontSize: '18px',
                  color: '#f72585',
                  lineHeight: '1'
                }}>{(selectedTileData.tile.data as VenueData).capacity}</div>
                <div style={{
                  fontSize: '11px',
                  color: '#b9b3d6',
                  marginTop: '6px'
                }}>people</div>
              </div>
              <div className="snes-panel-inset" style={{
                padding: '12px',
                textAlign: 'center'
              }}>
                <div className="snes-pixel" style={{
                  fontSize: '8px',
                  color: '#b9b3d6',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Type</div>
                <div className="snes-pixel" style={{
                  fontSize: '11px',
                  color: '#3ad17e',
                  textTransform: 'uppercase',
                  lineHeight: '1.4'
                }}>{((selectedTileData.tile.data as VenueData).venueType || 'Venue').replace(/_/g, ' ')}</div>
              </div>
            </div>

            {/* Modifiers and Synergies */}
            <div style={{
              marginBottom: '16px'
            }}>
              <h4 className="snes-pixel" style={{
                fontSize: '9px',
                color: '#ffffff',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>Venue Traits</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div className="snes-panel-inset" style={{
                  padding: '8px 12px',
                  fontSize: '11px'
                }}>
                  <span style={{ color: '#b9b3d6' }}>Acoustics: </span>
                  <span style={{ color: '#f72585', fontWeight: '600' }}>Good</span>
                </div>
                <div className="snes-panel-inset" style={{
                  padding: '8px 12px',
                  fontSize: '11px'
                }}>
                  <span style={{ color: '#b9b3d6' }}>Vibe: </span>
                  <span style={{ color: '#f72585', fontWeight: '600' }}>Intimate</span>
                </div>
              </div>

              {/* Synergies */}
              <div className="snes-panel-inset" style={{
                padding: '12px'
              }}>
                <h4 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: '#ffffff',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Synergies</h4>
                <p style={{
                  fontSize: '12px',
                  color: '#b9b3d6',
                  margin: '0 0 6px 0',
                  lineHeight: '1.5'
                }}>
                  • +20% audience energy for punk bands<br/>
                  • Perfect for acoustic sets under 50 people<br/>
                  • Unlocks "Underground Legend" achievement
                </p>
                {(selectedTileData.tile.data as VenueData).hasActiveShow && (
                  <div className="snes-pixel" style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '2px solid #2a2350',
                    fontSize: '8px',
                    color: '#3ad17e',
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
              borderTop: '2px solid #2a2350'
            }}>
              {selectedTileData.venue ? (
                // Always open the gear/upgrades shop — this modal is where you BUY
                // a venue's first upgrades + equipment, so gating it on
                // already-applied upgrades made the whole system unreachable.
                <button
                  onClick={() => {
                    setShowVenueUpgrade(true);
                    haptics.light();
                  }}
                  className="snes-btn"
                  style={{
                    flex: 1,
                    minHeight: '44px'
                  }}
                >
                  🔧 Gear &amp; Upgrades
                </button>
              ) : (
                <div className="snes-panel-inset" style={{
                  flex: 1,
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: '#6f6796',
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
          backgroundColor: 'rgba(8, 6, 18, 0.86)',
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
            backgroundColor: '#171327',
            border: '2px solid #0a0814',
            borderTopWidth: '3px',
            borderTopColor: '#4cc9f0',
            boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
            borderRadius: '0',
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
              backgroundColor: '#3a2f5c',
              borderRadius: '0',
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
                <h2 className="snes-pixel" style={{
                  fontSize: '12px',
                  color: '#ffffff',
                  margin: '0 0 6px'
                }}>{(selectedTileData.tile.data as WorkplaceData).name}</h2>
                <p style={{
                  fontSize: '12px',
                  color: '#b9b3d6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={12} color="#4cc9f0" />
                  <span>{selectedTileData.tile.district?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown District'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTileData(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0',
                  backgroundColor: '#1f1a3a',
                  border: '2px solid #0a0814',
                  color: '#b9b3d6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'none'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Job Type Display */}
            <div className="snes-panel-inset" style={{
              padding: '8px',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              <div className="snes-pixel" style={{
                fontSize: '9px',
                color: '#4cc9f0',
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
              <div className="snes-panel-inset" style={{
                padding: '10px',
                textAlign: 'center'
              }}>
                <div className="snes-pixel" style={{
                  fontSize: '8px',
                  color: '#b9b3d6',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>Hourly Wage</div>
                <div className="snes-pixel" style={{
                  fontSize: '16px',
                  color: '#3ad17e',
                  lineHeight: '1'
                }}>${(selectedTileData.tile.data as WorkplaceData).wage}</div>
                <div style={{
                  fontSize: '10px',
                  color: '#b9b3d6',
                  marginTop: '4px'
                }}>per turn</div>
              </div>
              <div className="snes-panel-inset" style={{
                padding: '10px',
                textAlign: 'center'
              }}>
                <div className="snes-pixel" style={{
                  fontSize: '8px',
                  color: '#b9b3d6',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>Stress Level</div>
                <div className="snes-pixel" style={{
                  fontSize: '16px',
                  color: (selectedTileData.tile.data as WorkplaceData).stress > 30 ? '#ff5c57' : '#ffd23f',
                  lineHeight: '1'
                }}>{(selectedTileData.tile.data as WorkplaceData).stress}%</div>
                <div style={{
                  fontSize: '10px',
                  color: '#b9b3d6',
                  marginTop: '4px'
                }}>{(selectedTileData.tile.data as WorkplaceData).stress > 30 ? 'high' : 'moderate'}</div>
              </div>
            </div>

            {/* Modifiers and Synergies */}
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '2px solid #2a2350'
            }}>
              {/* Job Modifiers */}
              <div style={{
                marginBottom: '12px'
              }}>
                <h4 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: '#ffffff',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Modifiers</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#b9b3d6' }}>Creativity: </span>
                    <span style={{ color: '#3ad17e', fontWeight: '600' }}>+2</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#b9b3d6' }}>Network: </span>
                    <span style={{ color: '#3ad17e', fontWeight: '600' }}>+1</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#b9b3d6' }}>Time: </span>
                    <span style={{ color: '#ff5c57', fontWeight: '600' }}>-3</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: '#b9b3d6' }}>Energy: </span>
                    <span style={{ color: '#ff5c57', fontWeight: '600' }}>-2</span>
                  </div>
                </div>
              </div>

              {/* Synergies */}
              <div className="snes-panel-inset" style={{
                padding: '12px',
                marginBottom: '12px'
              }}>
                <h4 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: '#ffffff',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Synergies</h4>
                <p style={{
                  fontSize: '12px',
                  color: '#b9b3d6',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  • +1 Creativity when working with other musicians<br/>
                  • Unlocks "Studio Access" perk at level 3
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Jobs Modal — commerce buildings are the city's day-job sources */}
      {selectedShop && (() => {
        const jobs = dayJobSystem.getAvailableJobs().filter((j) => j.location?.shopId === selectedShop.id);
        const currentJob = dayJobSystem.getCurrentJob();
        const chip = (label: string, color: string) => (
          <span className="snes-pixel" style={{ fontSize: '8px', color, backgroundColor: '#0f0b1e', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 0 #2a2350', borderRadius: '0', padding: '4px 7px', whiteSpace: 'nowrap' }}>{label}</span>
        );
        const accent = selectedShop.category === 'civic' ? '#ffd23f' : '#4cc9f0';
        return (
          <SnesModal variant="sheet" accent={accent} onClose={() => setSelectedShop(null)} title={selectedShop.name}>
              <p style={{ fontSize: '12px', color: accent, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color={accent} /><span>{SHOP_DEFS[selectedShop.kind].label} · Day Jobs</span>
              </p>
              {currentJob && (
                <div style={{ backgroundColor: 'var(--snes-bg-2)', border: '2px solid var(--snes-cyan)', borderRadius: '0', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: 'var(--snes-cyan)' }}>
                  Currently working: <span style={{ fontWeight: 700, color: 'var(--snes-ink)' }}>{currentJob.name}</span>
                </div>
              )}
              <div key={jobRefresh} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {jobs.length === 0 && (
                  <div className="snes-panel-inset" style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#6f6796' }}>No openings here right now.</div>
                )}
                {jobs.map((job) => {
                  const isCurrent = currentJob?.id === job.id || (!!currentJob && currentJob.name === job.name);
                  return (
                    <div key={job.id} className="snes-panel-inset" style={{ padding: '12px' }}>
                      <div className="snes-pixel" style={{ fontSize: '10px', color: '#ffffff', marginBottom: '6px', lineHeight: 1.4 }}>{job.name}</div>
                      <div style={{ fontSize: '12px', color: '#b9b3d6', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1.5 }}>{job.satiricalFlavor}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {chip(`+$${job.moneyPerTurn}/turn`, '#3ad17e')}
                        {job.reputationChange !== 0 && chip(`${job.reputationChange > 0 ? '+' : ''}${job.reputationChange} rep`, job.reputationChange > 0 ? '#3ad17e' : '#ff5c57')}
                        {job.fanChange !== 0 && chip(`${job.fanChange > 0 ? '+' : ''}${job.fanChange} fans`, job.fanChange > 0 ? '#3ad17e' : '#ff5c57')}
                        {chip(`+${job.stressGain} stress`, '#ffd23f')}
                        {!!job.connectionGain && chip(`+${job.connectionGain} conn`, '#4cc9f0')}
                      </div>
                      <button
                        disabled={isCurrent}
                        onClick={() => { if (dayJobSystem.setJob(job)) haptics.light(); setJobRefresh((n) => n + 1); }}
                        className={isCurrent ? 'snes-btn snes-btn--ghost' : 'snes-btn snes-btn--cyan'}
                        style={{ width: '100%', minHeight: '44px' }}
                      >{isCurrent ? '✓ Current job' : 'Take this job'}</button>
                    </div>
                  );
                })}
              </div>
          </SnesModal>
        );
      })()}

      {/* Landmark info modal (Pillar B) */}
      {selectedLandmark && (() => {
        const accent = selectedLandmark.alignment === 'diy' ? '#ffd23f' : selectedLandmark.alignment === 'corporate' ? '#ff5c57' : '#b9b3d6';
        const tag = selectedLandmark.alignment === 'diy' ? 'DIY Scene Anchor' : selectedLandmark.alignment === 'corporate' ? 'Sellout Monument' : 'Scene History';
        const fx: string[] = [];
        if (selectedLandmark.effect.creepMult != null) fx.push(`Slows gentrification here (×${selectedLandmark.effect.creepMult})`);
        if (selectedLandmark.effect.sceneFloor != null) fx.push(`Holds scene strength ≥ ${selectedLandmark.effect.sceneFloor}`);
        if (selectedLandmark.effect.passiveMoney != null) fx.push(`+$${selectedLandmark.effect.passiveMoney}/turn passive income`);
        return (
          <SnesModal variant="sheet" accent={accent} onClose={() => setSelectedLandmark(null)} title={`★ ${selectedLandmark.name}`}>
              <p className="snes-pixel" style={{ fontSize: '9px', color: accent, margin: '0 0 10px', letterSpacing: 0 }}>{tag}</p>
              <p style={{ fontSize: '13px', color: 'var(--snes-ink-dim)', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 12px' }}>{selectedLandmark.blurb}</p>
              {fx.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {fx.map((f, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#ffffff', backgroundColor: '#0f0b1e', border: `2px solid ${accent}`, borderRadius: '0', padding: '8px 12px' }}>{f}</div>
                  ))}
                </div>
              ) : (
                <div className="snes-panel-inset" style={{ fontSize: '12px', color: '#6f6796', padding: '8px 12px' }}>A monument to how far you&apos;ve come. No mechanical effect.</div>
              )}
          </SnesModal>
        );
      })()}

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
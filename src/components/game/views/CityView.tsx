import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { PixelCityMap } from '@/components/map/PixelCityMap';
import { haptics } from '@utils/mobile';
import { DistrictViewBasic } from '../DistrictViewBasic';
import { DistrictInfo } from '@/game/generation/CityGenerator';
import { VenueUpgradeModal } from '@/components/venue/VenueUpgradeModal';
import { SnesModal } from '@/components/ui/SnesModal';
import { ZoomOut, Building2, TrendingUp, MapPin } from 'lucide-react';
import { PixelIcon } from '@components/ui/PixelIcon';
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

// Buckets a 0-100 venue stat into a player-facing label.
const ratingLabel = (value: number): string =>
  value >= 80 ? 'Great' : value >= 60 ? 'Good' : value >= 40 ? 'Decent' : 'Rough';

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
  // Tap-to-expand help rows — `title` tooltips are unreachable on touch devices.
  const [showDistrictStatHelp, setShowDistrictStatHelp] = useState(false);
  const [showSceneHelp, setShowSceneHelp] = useState(false);

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
      backgroundColor: 'var(--snes-void)',
      overflow: 'hidden'
    }}>
      {/* Minimal Header for district view */}
      {viewMode === 'district' && (
        <div className="snes-bar snes-bar--top" style={{
          padding: '8px 12px',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <h3 className="snes-pixel" style={{
                fontSize: '12px',
                color: 'var(--snes-magenta)',
                margin: 0
              }}>{selectedDistrictInfo?.name || 'District'}</h3>
              <button
                type="button"
                onClick={() => { setShowDistrictStatHelp((v) => !v); haptics.light(); }}
                aria-expanded={showDistrictStatHelp}
                aria-label="What do Scene and Rent mean?"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11px',
                  color: 'var(--snes-ink-dim)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  minHeight: '44px',
                  cursor: 'pointer'
                }}
              >
                <span className="snes-pixel" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <PixelIcon name="home" size={12} /> Scene {liveDistrict?.sceneStrength ?? selectedDistrictInfo?.sceneStrength}%
                </span>
                <span className="snes-pixel" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <PixelIcon name="money" size={12} /> Rent {liveDistrict?.rentMultiplier ?? selectedDistrictInfo?.rentMultiplier}x
                </span>
              </button>
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
              <ZoomOut size={14} color="var(--snes-ink-dim)" />
              Back
            </button>
          </div>
          {showDistrictStatHelp && (
            <p style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', margin: '4px 0 0', lineHeight: 1.5 }}>
              Scene = how established the underground is here — grows as you throw DIY shows, bringing bigger built-in crowds and new unlocks. Rent = how pricey venues are vs. the city baseline.
            </p>
          )}
        </div>
      )}

      {/* Map Content */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--snes-void)'
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
              backgroundColor: 'var(--snes-void)'
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
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="snes-chip">
                  <Building2 size={12} color="var(--snes-magenta)" />
                  <span style={{ color: 'var(--snes-ink-dim)' }}>Venues</span>
                  <span style={{ color: 'var(--snes-ink)' }}>{unlockedVenues(gameStore.venues, gameStore.peakReputation).length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowSceneHelp((v) => !v); haptics.light(); }}
                  aria-expanded={showSceneHelp}
                  aria-label="What is Scene strength?"
                  style={{ background: 'transparent', border: 'none', padding: 0, minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <span className="snes-chip">
                    <TrendingUp size={12} color="var(--snes-green)" />
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Scene</span>
                    <span style={{ color: 'var(--snes-ink)' }}>
                      {Math.round(gameStore.districts.reduce((acc, d) => acc + d.sceneStrength, 0) / gameStore.districts.length)}%
                    </span>
                  </span>
                </button>
              </div>
              {showSceneHelp && (
                <div className="snes-panel-inset" style={{ maxWidth: '300px', padding: '8px 10px', fontSize: '11px', color: 'var(--snes-ink-dim)', lineHeight: 1.5 }}>
                  Scene strength (city average) — how established your underground scene is. Grows as you throw DIY shows; higher means bigger built-in crowds and unlocks more venues and landmarks.
                </div>
              )}
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
      {selectedTileData && selectedTileData.tile.type === 'venue' && (() => {
        const tileVenue = selectedTileData.tile.data as VenueData;
        const venue = selectedTileData.venue;
        const equipmentFlags = venue
          ? ([
              venue.allowsAllAges && 'All Ages',
              venue.hasBar && 'Bar',
              venue.hasSecurity && 'Security',
              venue.hasStage && 'Stage',
            ].filter(Boolean) as string[])
          : [];
        return (
          <SnesModal
            onClose={() => setSelectedTileData(null)}
            title={tileVenue.name}
            maxWidth={440}
            footer={venue ? (
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
                  width: '100%',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <PixelIcon name="gear" size={14} /> Gear &amp; Upgrades
              </button>
            ) : (
              <div className="snes-panel-inset" style={{
                width: '100%',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--snes-ink-mute)',
                  margin: 0
                }}>Not currently managed</p>
              </div>
            )}
          >
            <p style={{
              fontSize: '12px',
              color: 'var(--snes-ink-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              margin: '0 0 12px'
            }}>
              <MapPin size={12} color="var(--snes-magenta)" />
              <span>{selectedTileData.tile.district?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown District'}</span>
            </p>

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
                  fontSize: '9px',
                  color: 'var(--snes-ink-dim)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Capacity</div>
                <div className="snes-pixel" style={{
                  fontSize: '18px',
                  color: 'var(--snes-magenta)',
                  lineHeight: '1'
                }}>{tileVenue.capacity}</div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--snes-ink-dim)',
                  marginTop: '6px'
                }}>people</div>
              </div>
              <div className="snes-panel-inset" style={{
                padding: '12px',
                textAlign: 'center'
              }}>
                <div className="snes-pixel" style={{
                  fontSize: '9px',
                  color: 'var(--snes-ink-dim)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Type</div>
                <div className="snes-pixel" style={{
                  fontSize: '11px',
                  color: 'var(--snes-green)',
                  textTransform: 'uppercase',
                  lineHeight: '1.4'
                }}>{(tileVenue.venueType || 'Venue').replace(/_/g, ' ')}</div>
              </div>
            </div>

            {/* Venue traits — real data only; hidden when this tile has no managed venue */}
            {venue && (
              <div style={{ marginBottom: '16px' }}>
                <h4 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: 'var(--snes-ink)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Venue Traits</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: equipmentFlags.length > 0 ? '8px' : 0
                }}>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Acoustics: </span>
                    <span style={{ color: 'var(--snes-magenta)', fontWeight: '600' }}>{ratingLabel(venue.acoustics)}</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Vibe: </span>
                    <span style={{ color: 'var(--snes-magenta)', fontWeight: '600' }}>{ratingLabel(venue.atmosphere)}</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Rent: </span>
                    <span style={{ color: 'var(--snes-gold)', fontWeight: '600' }}>${venue.rent}/show</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Authenticity: </span>
                    <span style={{ color: 'var(--snes-magenta)', fontWeight: '600' }}>{ratingLabel(venue.authenticity)}</span>
                  </div>
                </div>
                {equipmentFlags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {equipmentFlags.map((flag) => (
                      <span key={flag} className="snes-chip" style={{ color: 'var(--snes-ink-dim)' }}>{flag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tileVenue.hasActiveShow && (
              <div className="snes-pixel" style={{
                marginBottom: '4px',
                padding: '8px',
                borderTop: '2px solid var(--snes-line)',
                fontSize: '11px',
                color: 'var(--snes-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <PixelIcon name="guitar" size={12} /> Show in Progress!
              </div>
            )}
          </SnesModal>
        );
      })()}

      {/* Workplace Modal */}
      {selectedTileData && selectedTileData.tile.type === 'workplace' && (
        <SnesModal
          onClose={() => setSelectedTileData(null)}
          title={(selectedTileData.tile.data as WorkplaceData).name}
          maxWidth={440}
          accent="var(--snes-cyan)"
        >
            <p style={{
              fontSize: '12px',
              color: 'var(--snes-ink-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              margin: '0 0 12px'
            }}>
              <MapPin size={12} color="var(--snes-cyan)" />
              <span>{selectedTileData.tile.district?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown District'}</span>
            </p>

            {/* Job Type Display */}
            <div className="snes-panel-inset" style={{
              padding: '8px',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              <div className="snes-pixel" style={{
                fontSize: '9px',
                color: 'var(--snes-cyan)',
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
                  fontSize: '9px',
                  color: 'var(--snes-ink-dim)',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>Hourly Wage</div>
                <div className="snes-pixel" style={{
                  fontSize: '16px',
                  color: 'var(--snes-green)',
                  lineHeight: '1'
                }}>${(selectedTileData.tile.data as WorkplaceData).wage}</div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--snes-ink-dim)',
                  marginTop: '4px'
                }}>per turn</div>
              </div>
              <div className="snes-panel-inset" style={{
                padding: '10px',
                textAlign: 'center'
              }}>
                <div className="snes-pixel" style={{
                  fontSize: '9px',
                  color: 'var(--snes-ink-dim)',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>Stress Level</div>
                <div className="snes-pixel" style={{
                  fontSize: '16px',
                  color: (selectedTileData.tile.data as WorkplaceData).stress > 30 ? 'var(--snes-red)' : 'var(--snes-gold)',
                  lineHeight: '1'
                }}>{(selectedTileData.tile.data as WorkplaceData).stress}%</div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--snes-ink-dim)',
                  marginTop: '4px'
                }}>{(selectedTileData.tile.data as WorkplaceData).stress > 30 ? 'high' : 'moderate'}</div>
              </div>
            </div>

            {/* Modifiers and Synergies */}
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '2px solid var(--snes-line)'
            }}>
              {/* Job Modifiers */}
              <div style={{
                marginBottom: '12px'
              }}>
                <h4 className="snes-pixel" style={{
                  fontSize: '9px',
                  color: 'var(--snes-ink)',
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
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Creativity: </span>
                    <span style={{ color: 'var(--snes-green)', fontWeight: '600' }}>+2</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Network: </span>
                    <span style={{ color: 'var(--snes-green)', fontWeight: '600' }}>+1</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Time: </span>
                    <span style={{ color: 'var(--snes-red)', fontWeight: '600' }}>-3</span>
                  </div>
                  <div className="snes-panel-inset" style={{
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--snes-ink-dim)' }}>Energy: </span>
                    <span style={{ color: 'var(--snes-red)', fontWeight: '600' }}>-2</span>
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
                  color: 'var(--snes-ink)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Synergies</h4>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--snes-ink-dim)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  • +1 Creativity when working with other musicians<br/>
                  • Unlocks "Studio Access" perk at level 3
                </p>
              </div>
            </div>
        </SnesModal>
      )}

      {/* Shop Jobs Modal — commerce buildings are the city's day-job sources */}
      {selectedShop && (() => {
        const jobs = dayJobSystem.getAvailableJobs().filter((j) => j.location?.shopId === selectedShop.id);
        const currentJob = dayJobSystem.getCurrentJob();
        const chip = (label: string, color: string) => (
          <span className="snes-pixel" style={{ fontSize: '11px', color, backgroundColor: 'var(--snes-bg-2)', border: '2px solid var(--snes-void)', boxShadow: 'inset 1px 1px 0 0 var(--snes-line)', borderRadius: '0', padding: '4px 7px', whiteSpace: 'nowrap' }}>{label}</span>
        );
        const accent = selectedShop.category === 'civic' ? 'var(--snes-gold)' : 'var(--snes-cyan)';
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
                  <div className="snes-panel-inset" style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--snes-ink-mute)' }}>No openings here right now.</div>
                )}
                {jobs.map((job) => {
                  const isCurrent = currentJob?.id === job.id || (!!currentJob && currentJob.name === job.name);
                  return (
                    <div key={job.id} className="snes-panel-inset" style={{ padding: '12px' }}>
                      <div className="snes-pixel" style={{ fontSize: '10px', color: 'var(--snes-ink)', marginBottom: '6px', lineHeight: 1.4 }}>{job.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1.5 }}>{job.satiricalFlavor}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {chip(`+$${job.moneyPerTurn}/turn`, 'var(--snes-green)')}
                        {job.reputationChange !== 0 && chip(`${job.reputationChange > 0 ? '+' : ''}${job.reputationChange} rep`, job.reputationChange > 0 ? 'var(--snes-green)' : 'var(--snes-red)')}
                        {job.fanChange !== 0 && chip(`${job.fanChange > 0 ? '+' : ''}${job.fanChange} fans`, job.fanChange > 0 ? 'var(--snes-green)' : 'var(--snes-red)')}
                        {chip(`+${job.stressGain} stress`, 'var(--snes-gold)')}
                        {!!job.connectionGain && chip(`+${job.connectionGain} conn`, 'var(--snes-cyan)')}
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
        const accent = selectedLandmark.alignment === 'diy' ? 'var(--snes-gold)' : selectedLandmark.alignment === 'corporate' ? 'var(--snes-red)' : 'var(--snes-ink-dim)';
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
                    <div key={i} style={{ fontSize: '12px', color: 'var(--snes-ink)', backgroundColor: 'var(--snes-bg-2)', border: `2px solid ${accent}`, borderRadius: '0', padding: '8px 12px' }}>{f}</div>
                  ))}
                </div>
              ) : (
                <div className="snes-panel-inset" style={{ fontSize: '12px', color: 'var(--snes-ink-mute)', padding: '8px 12px' }}>A monument to how far you&apos;ve come. No mechanical effect.</div>
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
    </div>
  );
};
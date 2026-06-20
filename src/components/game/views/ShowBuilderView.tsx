import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { Venue, Show } from '@game/types';
import { haptics } from '@utils/mobile';
import { synergyEngine } from '@game/mechanics/SynergyEngine';
import { difficultySystem } from '@game/mechanics/DifficultySystem';
import { cityGenreFit } from '@game/world/citySynergy';
import { isVenueUnlocked } from '@game/world/venueProgression';
import { tutorialManager } from '@game/tutorial/TutorialManager';
import { Calendar, MapPin, Users, Music, AlertCircle, TrendingUp, Check, Ban } from 'lucide-react';

/** Step header with a numbered pill that lights up once its step is reachable. */
const StepHeader: React.FC<{
  step: number;
  title: string;
  active: boolean;
  trailing?: React.ReactNode;
}> = ({ step, title, active, trailing }) => (
  <h3 className="snes-pixel" style={{
    fontSize: '10px',
    color: active ? '#ffffff' : '#6f6796',
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <span className="snes-pixel" style={{
      width: '22px',
      height: '22px',
      backgroundColor: active ? '#f72585' : '#0f0b1e',
      color: active ? '#1a0a14' : '#6f6796',
      border: '2px solid #0a0814',
      boxShadow: active
        ? 'inset 1px 1px 0 0 rgba(255,255,255,0.4)'
        : 'inset 1px 1px 0 0 #2a2350',
      borderRadius: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '9px',
      flexShrink: 0
    }}>{step}</span>
    {title}
    {trailing}
  </h3>
);

export const ShowBuilderView: React.FC = () => {
  const {
    allBands,
    rosterBandIds,
    venues: allVenues,
    peakReputation,
    money,
    scheduledShows,
    scheduleShow,
    cities,
    currentCityId,
  } = useGameStore();
  const currentCity = cities.find((c) => c.id === currentCityId);
  // Only venues the scene has unlocked are bookable (scene-growth ladder).
  const venues = allVenues.filter((v) => isVenueUnlocked(v, peakReputation));

  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [ticketPrice, setTicketPrice] = useState(15);

  const rosterBands = allBands.filter(b => rosterBandIds.includes(b.id));
  const selectedBands = allBands.filter(b => selectedBandIds.includes(b.id));

  const handleBandToggle = (bandId: string) => {
    if (difficultySystem.isBandUnavailable(bandId)) {
      haptics.error();
      return;
    }
    setSelectedBandIds(prev => {
      if (prev.includes(bandId)) {
        return prev.filter(id => id !== bandId);
      }
      // Max 3 bands per show
      if (prev.length < 3) {
        return [...prev, bandId];
      }
      return prev;
    });
    haptics.light();
  };

  const handleVenueSelect = (venue: Venue) => {
    if (difficultySystem.isVenueRaided(venue.id)) {
      haptics.error();
      return;
    }
    setSelectedVenue(venue);
    haptics.light();
  };

  const calculateShowPreview = () => {
    if (!selectedVenue || selectedBands.length === 0) return null;

    // Calculate synergies
    const synergies = synergyEngine.calculateSynergies(selectedBands, selectedVenue);
    const totalMultiplier = synergyEngine.getTotalMultiplier(synergies);

    // City scene fit: the local scene turns out for its own sound (headliner).
    const sceneFit = cityGenreFit(currentCity?.primaryGenre, selectedBands[0].genre);

    // Expected attendance — mirror the engine's deterministic shape (crowd scales
    // with venue atmosphere, +20% per extra band on the bill) so the preview
    // doesn't oversell the room. See TurnResolutionEngine.executeShow.
    const avgPopularity = selectedBands.reduce((sum, b) => sum + b.popularity, 0) / selectedBands.length;
    const venueBonus = selectedVenue.atmosphere / 100;
    const billMultiplier = 1 + 0.2 * Math.max(0, selectedBands.length - 1);
    const baseAttendance = Math.floor(selectedVenue.capacity * (avgPopularity / 100) * venueBonus);
    const expectedAttendance = Math.floor(baseAttendance * billMultiplier * totalMultiplier * sceneFit.multiplier);
    const finalAttendance = Math.min(expectedAttendance, selectedVenue.capacity);

    // Revenue includes bar sales where the venue has a bar (matches the engine).
    const grossRevenue = finalAttendance * ticketPrice + (selectedVenue.hasBar ? finalAttendance * 5 : 0);
    // Costs: the scaled venue rent PLUS the per-band fee paid to every act on the
    // bill. The old preview omitted band fees, so it promised a profit on bills
    // that actually lose money — the most misleading number in the game.
    const venueCost = Math.floor(difficultySystem.getScaledVenueCost(selectedVenue.rent));
    const bandCost = selectedBands.length * difficultySystem.getScaledBandCost();
    const netRevenue = grossRevenue - venueCost - bandCost;

    return {
      synergies,
      totalMultiplier,
      sceneFit,
      expectedAttendance: finalAttendance,
      grossRevenue,
      venueCost,
      bandCost,
      netRevenue,
      capacity: selectedVenue.capacity
    };
  };

  const preview = calculateShowPreview();
  // Gate booking on the TRUE outlay (rent + every band's fee), not just rent —
  // otherwise a near-broke player books a bill they can't afford to resolve.
  const canBook =
    selectedBands.length > 0 &&
    !!selectedVenue &&
    !!preview &&
    money >= preview.venueCost + preview.bandCost;

  const handleBookShow = () => {
    if (!canBook) return;

    // Create show object
    const show: Show = {
      id: `show-${Date.now()}`,
      venueId: selectedVenue!.id,
      bandId: selectedBands[0].id,
      lineup: selectedBands.map(b => b.id),
      ticketPrice,
      date: new Date(),
      status: "SCHEDULED",
      revenue: 0,
    };

    // During the guided tutorial, book the very first show only 1 turn out so the
    // single coached "Next Turn" actually resolves it and the player sees their
    // damage report (the default 3-turn promotion would leave that step empty).
    const duringTutorialBuild =
      tutorialManager.isActive() &&
      tutorialManager.getCurrentStep()?.id === 'build-show';
    scheduleShow(show, duringTutorialBuild ? 1 : undefined);
    haptics.success();

    // Reset selections
    setSelectedBandIds([]);
    setSelectedVenue(null);
    setTicketPrice(15);
  };

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
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="snes-pixel" style={{
            fontSize: '12px',
            color: '#f72585',
            margin: 0,
            letterSpacing: 0,
            textShadow: '2px 2px 0 #0a0814'
          }}>Book a Show</h2>
          <p style={{
            fontSize: '11px',
            color: '#b9b3d6',
            margin: '4px 0 0'
          }}>Lineup, venue, price — make it a night.</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          <span className="snes-chip snes-pixel" style={{
            fontSize: '9px'
          }}>
            <Music size={12} color="#4cc9f0" />
            {scheduledShows.length}
          </span>
          <span className="snes-chip snes-pixel" style={{
            fontSize: '9px',
            borderColor: '#0a0814',
            color: money >= 100 ? '#3ad17e' : '#ff5c57'
          }}>
            ${money}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
      }}>
        {/* Step 1: Select Bands */}
        <section style={{ marginBottom: '16px' }}>
          <StepHeader
            step={1}
            title="Pick the Lineup"
            active
            trailing={<span className="snes-pixel" style={{
              marginLeft: 'auto',
              fontSize: '9px',
              color: selectedBandIds.length > 0 ? '#f72585' : '#6f6796',
              letterSpacing: 0
            }}>{selectedBandIds.length}/3</span>}
          />

          {rosterBands.length === 0 ? (
            <div className="snes-panel-inset" style={{
              padding: '24px',
              textAlign: 'center',
              color: '#b9b3d6'
            }}>
              <Users size={28} color="#6f6796" style={{ marginBottom: '8px' }} />
              <p className="snes-pixel" style={{ margin: '0 0 8px', fontSize: '10px', color: '#ffffff' }}>No bands signed yet</p>
              <p style={{ fontSize: '12px', margin: 0, color: '#b9b3d6' }}>Head to the Bands tab and sign some acts first.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
              {rosterBands.map(band => {
                const isSelected = selectedBandIds.includes(band.id);
                const isUnavailable = difficultySystem.isBandUnavailable(band.id);
                const isBlocked = isUnavailable || (!isSelected && selectedBandIds.length >= 3);
                return (
                  <button
                    key={band.id}
                    onClick={() => handleBandToggle(band.id)}
                    disabled={isBlocked}
                    style={{
                      backgroundColor: isSelected ? '#171327' : '#0f0b1e',
                      border: '2px solid',
                      borderColor: isUnavailable ? '#ff5c57' : isSelected ? '#f72585' : '#0a0814',
                      boxShadow: isSelected
                        ? 'inset 1px 1px 0 0 #3a2f5c'
                        : 'inset 1px 1px 0 0 #2a2350',
                      borderRadius: 0,
                      padding: '10px 12px',
                      minHeight: '44px',
                      cursor: isBlocked ? 'not-allowed' : 'pointer',
                      opacity: isBlocked ? 0.55 : 1,
                      transition: 'none',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="snes-pixel" style={{
                          fontSize: '10px',
                          color: '#ffffff',
                          marginBottom: '6px',
                          letterSpacing: 0
                        }}>{band.name}</div>
                        <div style={{
                          fontSize: '11px',
                          color: isUnavailable ? '#ff5c57' : isSelected ? '#f72585' : '#b9b3d6'
                        }}>
                          {isUnavailable
                            ? 'On a drama break this turn'
                            : `${band.genre} • Pop ${band.popularity}`}
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {isUnavailable ? (
                          <Ban size={16} color="#ff5c57" />
                        ) : isSelected ? (
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: 0,
                            backgroundColor: '#f72585',
                            border: '2px solid #0a0814',
                            boxShadow: 'inset 1px 1px 0 0 rgba(255,255,255,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={14} color="#1a0a14" />
                          </span>
                        ) : (
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: 0,
                            backgroundColor: '#0f0b1e',
                            border: '2px solid #2a2350'
                          }} />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2: Select Venue */}
        <section style={{ marginBottom: '16px' }}>
          <StepHeader step={2} title="Choose a Venue" active={selectedBandIds.length > 0} />

          <div style={{ display: 'grid', gap: '8px' }}>
            {venues.map(venue => {
              const isSelected = selectedVenue?.id === venue.id;
              const isRaided = difficultySystem.isVenueRaided(venue.id);
              const canAfford = money >= venue.rent;
              const isBlocked = !canAfford || isRaided;

              return (
                <button
                  key={venue.id}
                  onClick={() => handleVenueSelect(venue)}
                  disabled={isBlocked}
                  style={{
                    backgroundColor: isSelected ? '#171327' : '#0f0b1e',
                    border: '2px solid',
                    borderColor: isRaided ? '#ff5c57' : isSelected ? '#f72585' : '#0a0814',
                    boxShadow: isSelected
                      ? 'inset 1px 1px 0 0 #3a2f5c'
                      : 'inset 1px 1px 0 0 #2a2350',
                    borderRadius: 0,
                    padding: '12px',
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    opacity: isBlocked ? 0.55 : 1,
                    transition: 'none',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="snes-pixel" style={{
                        fontSize: '10px',
                        color: '#ffffff',
                        marginBottom: '6px',
                        letterSpacing: 0
                      }}>{venue.name}</div>
                      <div style={{
                        fontSize: '12px',
                        color: isSelected ? '#f72585' : '#b9b3d6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={12} color="#4cc9f0" /> {venue.location.name}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={12} color="#c77dff" /> {venue.capacity}
                        </span>
                      </div>
                      {isRaided && (
                        <div style={{
                          fontSize: '11px',
                          color: '#ff5c57',
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Ban size={12} /> Police shutdown — closed this turn
                        </div>
                      )}
                    </div>
                    <span className="snes-pixel" style={{
                      flexShrink: 0,
                      fontSize: '10px',
                      color: canAfford ? '#3ad17e' : '#ff5c57'
                    }}>
                      ${venue.rent}
                    </span>
                  </div>
                  {!canAfford && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#ff5c57',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      Not enough cash for rent
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Set Ticket Price */}
        <section style={{ marginBottom: '16px' }}>
          <StepHeader step={3} title="Set Ticket Price" active={!!selectedVenue} />

          <div className="snes-panel" style={{
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span className="snes-pixel" style={{
                color: '#b9b3d6',
                fontSize: '8px',
                textTransform: 'uppercase',
                letterSpacing: 0
              }}>Door Price</span>
              <span className="snes-pixel" style={{ fontSize: '14px', color: '#3ad17e' }}>${ticketPrice}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(Number(e.target.value))}
              style={{
                width: '100%',
                height: '12px',
                borderRadius: 0,
                background: `linear-gradient(to right, #f72585 0%, #f72585 ${(ticketPrice - 5) / 45 * 100}%, #0f0b1e ${(ticketPrice - 5) / 45 * 100}%, #0f0b1e 100%)`,
                border: '2px solid #0a0814',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <div className="snes-pixel" style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '8px',
              color: '#6f6796'
            }}>
              <span>$5</span>
              <span>$50</span>
            </div>
          </div>
        </section>

        {/* Show Preview */}
        {preview && (
          <section style={{ marginBottom: '16px' }}>
            <h3 className="snes-pixel" style={{
              fontSize: '10px',
              color: '#ffffff',
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <TrendingUp size={14} color="#3ad17e" />
              The Night Ahead
            </h3>

            <div className="snes-panel" style={{
              padding: '16px'
            }}>
              {/* City scene fit — the local crowd loves its own sound */}
              {preview.sceneFit.tier !== 'neutral' && (
                <div className="snes-panel-inset" style={{
                  border: `2px solid ${preview.sceneFit.tier === 'perfect' ? '#ffd23f' : '#4cc9f0'}`,
                  padding: '8px 10px',
                  marginBottom: '16px',
                }}>
                  <span className="snes-pixel" style={{ fontSize: '8px', color: preview.sceneFit.tier === 'perfect' ? '#ffd23f' : '#4cc9f0', letterSpacing: 0 }}>
                    🔥 {preview.sceneFit.label} in {currentCity?.name} (+{Math.round((preview.sceneFit.multiplier - 1) * 100)}% crowd)
                  </span>
                </div>
              )}

              {/* Synergies */}
              {preview.synergies.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 className="snes-pixel" style={{
                    fontSize: '8px',
                    color: '#3ad17e',
                    margin: '0 0 8px',
                    textTransform: 'uppercase',
                    letterSpacing: 0
                  }}>Synergies Firing 🔥</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {preview.synergies.map((synergy, idx) => (
                      <span
                        key={idx}
                        className="snes-pixel"
                        style={{
                          padding: '5px 8px',
                          backgroundColor: '#0f0b1e',
                          border: '2px solid #3ad17e',
                          color: '#3ad17e',
                          fontSize: '8px',
                          letterSpacing: 0,
                          borderRadius: 0
                        }}
                      >
                        {synergy.name} (+{Math.round((synergy.multiplier - 1) * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <div className="snes-panel-inset" style={{
                  padding: '12px'
                }}>
                  <div className="snes-pixel" style={{
                    fontSize: '8px',
                    color: '#b9b3d6',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: 0
                  }}>Expected Crowd</div>
                  <div className="snes-pixel" style={{ fontSize: '12px', color: '#ffffff', lineHeight: 1.2 }}>
                    {preview.expectedAttendance}<span style={{ fontSize: '8px', color: '#6f6796' }}>/{preview.capacity}</span>
                  </div>
                  <div className="snes-progress" style={{
                    height: '8px',
                    marginTop: '8px'
                  }}>
                    <div
                      className="snes-progress__fill"
                      style={{
                        background: '#3ad17e',
                        width: `${(preview.expectedAttendance / preview.capacity) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="snes-panel-inset" style={{
                  padding: '12px'
                }}>
                  <div className="snes-pixel" style={{
                    fontSize: '8px',
                    color: '#b9b3d6',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: 0
                  }}>Hype Multiplier</div>
                  <div className="snes-pixel" style={{ fontSize: '12px', color: '#f72585', lineHeight: 1.2 }}>
                    {preview.totalMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '2px solid #2a2350'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#b9b3d6' }}>Gross Revenue</span>
                    <span className="snes-pixel" style={{ color: '#3ad17e', fontSize: '9px' }}>+${preview.grossRevenue}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#b9b3d6' }}>Venue Rent</span>
                    <span className="snes-pixel" style={{ color: '#ff5c57', fontSize: '9px' }}>-${preview.venueCost}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#b9b3d6' }}>Band Fees{selectedBands.length > 1 ? ` (×${selectedBands.length})` : ''}</span>
                    <span className="snes-pixel" style={{ color: '#ff5c57', fontSize: '9px' }}>-${preview.bandCost}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '2px solid #2a2350'
                  }}>
                    <span className="snes-pixel" style={{ color: '#ffffff', fontSize: '9px' }}>Net Profit</span>
                    <span className="snes-pixel" style={{ fontSize: '11px', color: preview.netRevenue >= 0 ? '#3ad17e' : '#ff5c57' }}>
                      {preview.netRevenue >= 0 ? '+' : '-'}${Math.abs(preview.netRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Book Show Button */}
        <button
          onClick={handleBookShow}
          disabled={!canBook}
          className={canBook ? 'snes-btn' : 'snes-btn snes-btn--ghost'}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '12px',
            minHeight: '44px',
            color: canBook ? '#1a0a14' : '#6f6796'
          }}
        >
          <Calendar size={20} />
          {!selectedBands.length ? 'Pick a Band First' :
           !selectedVenue ? 'Pick a Venue' :
           money < selectedVenue.rent ? 'Not Enough Cash' :
           'Book This Show'}
        </button>
      </div>
    </div>
  );
};

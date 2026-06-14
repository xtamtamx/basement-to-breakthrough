import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { Venue, Show } from '@game/types';
import { haptics } from '@utils/mobile';
import { synergyEngine } from '@game/mechanics/SynergyEngine';
import { difficultySystem } from '@game/mechanics/DifficultySystem';
import { Calendar, MapPin, Users, Music, AlertCircle, TrendingUp, Check, Ban } from 'lucide-react';

/** Step header with a numbered pill that lights up once its step is reachable. */
const StepHeader: React.FC<{
  step: number;
  title: string;
  active: boolean;
  trailing?: React.ReactNode;
}> = ({ step, title, active, trailing }) => (
  <h3 style={{
    fontSize: '11px',
    fontWeight: 700,
    color: '#9ca3af',
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <span style={{
      width: '20px',
      height: '20px',
      backgroundColor: active ? '#ec4899' : '#1f2937',
      color: active ? '#ffffff' : '#6b7280',
      border: active ? 'none' : '1px solid #374151',
      borderRadius: '999px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 800,
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
    venues,
    money,
    scheduledShows,
    scheduleShow
  } = useGameStore();

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

    // Calculate expected attendance
    const avgPopularity = selectedBands.reduce((sum, b) => sum + b.popularity, 0) / selectedBands.length;
    const baseAttendance = Math.floor(selectedVenue.capacity * 0.5 * (avgPopularity / 100));
    const expectedAttendance = Math.floor(baseAttendance * totalMultiplier);
    const finalAttendance = Math.min(expectedAttendance, selectedVenue.capacity);

    // Calculate revenue
    const grossRevenue = finalAttendance * ticketPrice;
    const venueCost = selectedVenue.rent;
    const netRevenue = grossRevenue - venueCost;

    return {
      synergies,
      totalMultiplier,
      expectedAttendance: finalAttendance,
      grossRevenue,
      venueCost,
      netRevenue,
      capacity: selectedVenue.capacity
    };
  };

  const preview = calculateShowPreview();
  const canBook = selectedBands.length > 0 && selectedVenue && money >= selectedVenue.rent;

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

    scheduleShow(show);
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
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: '17px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>Book a Show</h2>
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            margin: '1px 0 0'
          }}>Lineup, venue, price — make it a night.</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid #1f2937',
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '12px',
            color: '#9ca3af',
            fontWeight: 600
          }}>
            <Music size={12} color="#06b6d4" />
            {scheduledShows.length}
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: money >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${money >= 100 ? '#10b981' : '#ef4444'}`,
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '13px',
            color: money >= 100 ? '#34d399' : '#f87171',
            fontWeight: 800
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
            trailing={<span style={{
              marginLeft: 'auto',
              fontSize: '11px',
              color: selectedBandIds.length > 0 ? '#ec4899' : '#6b7280',
              fontWeight: 700,
              textTransform: 'none',
              letterSpacing: 0
            }}>{selectedBandIds.length}/3</span>}
          />

          {rosterBands.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <Users size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>No bands signed yet</p>
              <p style={{ fontSize: '12px', margin: 0 }}>Head to the Bands tab and sign some acts first.</p>
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
                      backgroundColor: isSelected ? 'rgba(236,72,153,0.15)' : '#111827',
                      border: '1px solid',
                      borderColor: isUnavailable ? '#b91c1c' : isSelected ? '#ec4899' : '#1f2937',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      minHeight: '44px',
                      cursor: isBlocked ? 'not-allowed' : 'pointer',
                      opacity: isBlocked ? 0.55 : 1,
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#ffffff',
                          marginBottom: '2px',
                          letterSpacing: '-0.01em'
                        }}>{band.name}</div>
                        <div style={{
                          fontSize: '11px',
                          color: isUnavailable ? '#f87171' : isSelected ? '#f9a8d4' : '#9ca3af'
                        }}>
                          {isUnavailable
                            ? 'On a drama break this turn'
                            : `${band.genre} • Pop ${band.popularity}`}
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {isUnavailable ? (
                          <Ban size={16} color="#f87171" />
                        ) : isSelected ? (
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '999px',
                            backgroundColor: '#ec4899',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={14} color="#ffffff" />
                          </span>
                        ) : (
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '999px',
                            border: '1px solid #374151'
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
                    backgroundColor: isSelected ? 'rgba(236,72,153,0.15)' : '#111827',
                    border: '1px solid',
                    borderColor: isRaided ? '#b91c1c' : isSelected ? '#ec4899' : '#1f2937',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    opacity: isBlocked ? 0.55 : 1,
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#ffffff',
                        marginBottom: '4px',
                        letterSpacing: '-0.01em'
                      }}>{venue.name}</div>
                      <div style={{
                        fontSize: '12px',
                        color: isSelected ? '#f9a8d4' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={12} /> {venue.location.name}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={12} /> {venue.capacity}
                        </span>
                      </div>
                      {isRaided && (
                        <div style={{
                          fontSize: '11px',
                          color: '#f87171',
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Ban size={12} /> Police shutdown — closed this turn
                        </div>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0,
                      fontSize: '14px',
                      fontWeight: 800,
                      color: canAfford ? '#34d399' : '#f87171'
                    }}>
                      ${venue.rent}
                    </span>
                  </div>
                  {!canAfford && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#f87171',
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

          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{
                color: '#9ca3af',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 700
              }}>Door Price</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#34d399' }}>${ticketPrice}</span>
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
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(ticketPrice - 5) / 45 * 100}%, #1f2937 ${(ticketPrice - 5) / 45 * 100}%, #1f2937 100%)`,
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '11px',
              color: '#6b7280'
            }}>
              <span>$5</span>
              <span>$50</span>
            </div>
          </div>
        </section>

        {/* Show Preview */}
        {preview && (
          <section style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9ca3af',
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <TrendingUp size={14} color="#10b981" />
              The Night Ahead
            </h3>

            <div style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #1f2937'
            }}>
              {/* Synergies */}
              {preview.synergies.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#34d399',
                    margin: '0 0 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Synergies Firing 🔥</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {preview.synergies.map((synergy, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: 'rgba(16,185,129,0.15)',
                          border: '1px solid #10b981',
                          color: '#34d399',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '999px'
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
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid #1f2937',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700
                  }}>Expected Crowd</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                    {preview.expectedAttendance}<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>/{preview.capacity}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#1f2937',
                    borderRadius: '2px',
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: '#10b981',
                        width: `${(preview.expectedAttendance / preview.capacity) * 100}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid #1f2937',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700
                  }}>Hype Multiplier</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>
                    {preview.totalMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #1f2937'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9ca3af' }}>Gross Revenue</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>+${preview.grossRevenue}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9ca3af' }}>Venue Rent</span>
                    <span style={{ color: '#f87171', fontWeight: 600 }}>-${preview.venueCost}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '15px',
                    fontWeight: 800,
                    paddingTop: '8px',
                    borderTop: '1px solid #1f2937'
                  }}>
                    <span style={{ color: '#ffffff' }}>Net Profit</span>
                    <span style={{ color: preview.netRevenue >= 0 ? '#34d399' : '#f87171' }}>
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
          style={{
            width: '100%',
            padding: '16px',
            backgroundImage: canBook ? 'linear-gradient(135deg, #ec4899, #db2777)' : 'none',
            backgroundColor: canBook ? 'transparent' : '#1f2937',
            color: canBook ? '#ffffff' : '#6b7280',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 800,
            cursor: canBook ? 'pointer' : 'not-allowed',
            minHeight: '44px',
            boxShadow: canBook ? '0 4px 16px rgba(236,72,153,0.35)' : 'none',
            transition: 'transform 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseDown={(e) => { if (canBook) e.currentTarget.style.transform = 'scale(0.99)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
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

import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { Venue, Show, Band } from '@game/types';
import { haptics } from '@utils/mobile';
import { showPromotionSystem } from '@game/mechanics/ShowPromotionSystem';
import { bookingSystem } from '@game/mechanics/BookingSystem';
import { synergyEngine } from '@game/mechanics/SynergyEngine';
import { Calendar, MapPin, Users, DollarSign, ChevronRight, Music, AlertCircle, TrendingUp, Check } from 'lucide-react';

export const ShowBuilderView: React.FC = () => {
  const { 
    allBands, 
    rosterBandIds, 
    venues, 
    money, 
    reputation,
    fans,
    scheduledShows,
    scheduleShow 
  } = useGameStore();
  
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [ticketPrice, setTicketPrice] = useState(15);
  const [showPreview, setShowPreview] = useState(false);

  const rosterBands = allBands.filter(b => rosterBandIds.includes(b.id));
  const selectedBands = allBands.filter(b => selectedBandIds.includes(b.id));
  
  const handleBandToggle = (bandId: string) => {
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
    setSelectedVenue(venue);
    haptics.light();
  };

  const calculateShowPreview = () => {
    if (!selectedVenue || selectedBands.length === 0) return null;
    
    // Calculate synergies
    const synergies = synergyEngine.calculateSynergies(selectedBands, selectedVenue);
    const totalMultiplier = synergyEngine.getTotalMultiplier(selectedBands, selectedVenue);
    
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
      venue: selectedVenue!,
      bands: selectedBands,
      ticketPrice,
      date: new Date(),
      isBooked: true,
      isCancelled: false,
      attendees: [],
      revenue: 0,
      reputation: 0,
      turnsUntilShow: 1,
      promotionLevel: 0
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
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ec4899',
          margin: 0
        }}>Shows</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px'
        }}>
          <span style={{ color: '#9ca3af' }}>
            <Music size={10} style={{ display: 'inline', marginRight: '2px' }} />
            {scheduledShows.length}
          </span>
          <span style={{ color: money >= 100 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            ${money}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: '80px'
      }}>
        {/* Step 1: Select Bands */}
        <section style={{ marginBottom: '16px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#ec4899',
              color: '#ffffff',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>1</span>
            Select Bands
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>({selectedBandIds.length}/3)</span>
          </h3>
          
          {rosterBands.length === 0 ? (
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>No bands in your roster yet!</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>Add bands from the Bands tab first.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
              {rosterBands.map(band => {
                const isSelected = selectedBandIds.includes(band.id);
                return (
                  <button
                    key={band.id}
                    onClick={() => handleBandToggle(band.id)}
                    disabled={!isSelected && selectedBandIds.length >= 3}
                    style={{
                      backgroundColor: isSelected ? '#ec4899' : '#1f2937',
                      border: '1px solid',
                      borderColor: isSelected ? '#ec4899' : '#374151',
                      borderRadius: '8px',
                      padding: '10px',
                      minHeight: '44px',
                      cursor: !isSelected && selectedBandIds.length >= 3 ? 'not-allowed' : 'pointer',
                      opacity: !isSelected && selectedBandIds.length >= 3 ? 0.5 : 1,
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#ffffff',
                          marginBottom: '2px'
                        }}>{band.name}</div>
                        <div style={{
                          fontSize: '11px',
                          color: isSelected ? '#fce7f3' : '#9ca3af'
                        }}>
                          {band.genre} • Pop: {band.popularity}
                        </div>
                      </div>
                      {isSelected && <Check size={14} color="#ffffff" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2: Select Venue */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '24px',
              height: '24px',
              backgroundColor: selectedBandIds.length > 0 ? '#ec4899' : '#4b5563',
              color: '#ffffff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>2</span>
            Select Venue
          </h3>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            {venues.map(venue => {
              const isSelected = selectedVenue?.id === venue.id;
              const canAfford = money >= venue.rent;
              
              return (
                <button
                  key={venue.id}
                  onClick={() => handleVenueSelect(venue)}
                  disabled={!canAfford}
                  style={{
                    backgroundColor: isSelected ? '#ec4899' : '#1f2937',
                    border: '1px solid',
                    borderColor: isSelected ? '#ec4899' : '#374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    opacity: canAfford ? 1 : 0.5,
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>{venue.name}</div>
                      <div style={{
                        fontSize: '12px',
                        color: isSelected ? '#fce7f3' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span><MapPin size={12} style={{ display: 'inline' }} /> {venue.district}</span>
                        <span><Users size={12} style={{ display: 'inline' }} /> {venue.capacity}</span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: canAfford ? '#10b981' : '#ef4444'
                    }}>
                      ${venue.rent}
                    </div>
                  </div>
                  {!canAfford && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      Not enough money
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Set Ticket Price */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '24px',
              height: '24px',
              backgroundColor: selectedVenue ? '#ec4899' : '#4b5563',
              color: '#ffffff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>3</span>
            Set Ticket Price
          </h3>
          
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>Ticket Price</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>${ticketPrice}</span>
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
                background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(ticketPrice - 5) / 45 * 100}%, #374151 ${(ticketPrice - 5) / 45 * 100}%, #374151 100%)`,
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <span>$5</span>
              <span>$50</span>
            </div>
          </div>
        </section>

        {/* Show Preview */}
        {preview && (
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={20} color="#10b981" />
              Show Preview
            </h3>
            
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #374151'
            }}>
              {/* Synergies */}
              {preview.synergies.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#10b981',
                    marginBottom: '8px'
                  }}>Active Synergies!</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {preview.synergies.map((synergy, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontSize: '12px',
                          borderRadius: '4px'
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
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#111827',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Expected Attendance</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                    {preview.expectedAttendance}/{preview.capacity}
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#374151',
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
                  backgroundColor: '#111827',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Multiplier</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ec4899' }}>
                    {preview.totalMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#9ca3af' }}>Gross Revenue</span>
                    <span style={{ color: '#10b981' }}>+${preview.grossRevenue}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#9ca3af' }}>Venue Cost</span>
                    <span style={{ color: '#ef4444' }}>-${preview.venueCost}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    paddingTop: '8px',
                    borderTop: '1px solid #374151'
                  }}>
                    <span style={{ color: '#ffffff' }}>Net Profit</span>
                    <span style={{ color: preview.netRevenue >= 0 ? '#10b981' : '#ef4444' }}>
                      {preview.netRevenue >= 0 ? '+' : ''}{preview.netRevenue}
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
            backgroundColor: canBook ? '#ec4899' : '#374151',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: canBook ? 'pointer' : 'not-allowed',
            opacity: canBook ? 1 : 0.5,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={20} />
          {!selectedBands.length ? 'Select Bands First' :
           !selectedVenue ? 'Select a Venue' :
           money < selectedVenue.rent ? 'Not Enough Money' :
           'Book This Show'}
        </button>
      </div>
    </div>
  );
};
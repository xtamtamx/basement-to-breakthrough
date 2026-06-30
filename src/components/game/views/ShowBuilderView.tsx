import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@stores/gameStore';
import { Venue, Show } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/simpleAudio';
import { synergyEngine } from '@game/mechanics/SynergyEngine';
import { computeLineupChemistry } from '@game/mechanics/lineupChemistry';
import { bandFactionBadge } from '@game/world/factionDisplay';
import { factionSystem } from '@game/mechanics/FactionSystem';
import { difficultySystem } from '@game/mechanics/DifficultySystem';
import { bandBookingFee } from '@game/mechanics/bandEconomy';
import { isBandUnlocked } from '@game/world/bandUnlocks';
import { cityGenreFit, homeCityFit } from '@game/world/citySynergy';
import { projectBaseAttendance } from '@game/mechanics/attendanceProjection';
import { isVenueUnlocked } from '@game/world/venueProgression';
import { tutorialManager } from '@game/tutorial/TutorialManager';
import { COMBO_MULT_CAP } from '@game/constants/runConstants';
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
    factionStandings,
    eventCapacityPenalty,
    currentRound,
    hasSynergyDiscovered,
  } = useGameStore();
  const currentCity = cities.find((c) => c.id === currentCityId);
  // Only venues the scene has unlocked are bookable (scene-growth ladder).
  const venues = allVenues.filter((v) => isVenueUnlocked(v, peakReputation));

  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [ticketPrice, setTicketPrice] = useState(15);
  const [leadTime, setLeadTime] = useState(3); // turns out to book — promo builds over the wait
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null); // tap-to-reveal explainer

  const isSigned = (id: string) => rosterBandIds.includes(id);
  // You can book any UNLOCKED band: signed acts cost only your cut, unsigned acts
  // are bookable as guests for their full guarantee. Signed first, then cheapest.
  const bookableBands = allBands
    .filter((b) => isBandUnlocked(b.id))
    .sort((a, b) => (isSigned(b.id) ? 1 : 0) - (isSigned(a.id) ? 1 : 0) || a.popularity - b.popularity);
  const selectedBands = allBands.filter(b => selectedBandIds.includes(b.id));
  // Per-act fee the player actually pays (popularity guarantee × difficulty, cut for signed).
  const bandFee = (b: { popularity: number; id: string }) =>
    difficultySystem.getScaledBandCost(bandBookingFee(b.popularity, isSigned(b.id)));

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

    // Band+venue combo synergies — but only surface the ones the promoter has
    // already DISCOVERED. An undiscovered synergy stays hidden until it fires and
    // is revealed when the show resolves (TurnResolutionEngine discovers it after
    // the fact), so listing/counting it here would spoil the reveal. The honest
    // crowd + cash still bake in EVERY synergy (projectBaseAttendance computes its
    // own full multiplier below), so the money never lies — we only hide the names,
    // count and ×N readout of combos the player hasn't learned yet.
    const synergies = synergyEngine
      .calculateSynergies(selectedBands, selectedVenue)
      .filter((s) => !!s.id && hasSynergyDiscovered(s.id));
    const totalMultiplier = Math.min(synergyEngine.getTotalMultiplier(synergies), COMBO_MULT_CAP);
    const reputationBonus = synergyEngine.getTotalReputationBonus(synergies);

    // City scene fit: the local scene turns out for its own sound (headliner).
    const sceneFit = cityGenreFit(currentCity?.primaryGenre, selectedBands[0].genre);
    // Hometown crowd: the headliner playing its OWN home city (band-specific, stacks).
    const homeFit = homeCityFit(selectedBands[0].homeCity, currentCityId);

    // Bill chemistry — how the bands get along (faction affinity + co-billing
    // drift). Pure, so this preview matches what executeShow applies. (Kept for the
    // chemistry display; the attendance number itself comes from the shared helper.)
    const lineupChem = computeLineupChemistry(selectedBands);
    // Faction show-modifier (your standing with the headliner's faction). Computed
    // PURELY from store standings via the same getShowModifiersFrom + clamps the
    // engine uses, so the previewed crowd/payoff matches resolution (identity at
    // neutral standings → no early-game effect).
    const fMods = factionSystem.getShowModifiersFrom(selectedBands[0], factionStandings);
    const factionAttMult = Math.max(0.92, Math.min(1.08, 1 + (fMods.fanBonus - 1) * 0.4));
    const factionMoneyMult = 1 + Math.max(-0.05, Math.min(0.05, fMods.moneyModifier));
    const factionAttPct = Math.round((factionAttMult - 1) * 100);
    // A live crisis (e.g. police_crackdown) shrinks every room's effective capacity
    // THIS turn — mirror the engine's floored reduction so the preview doesn't
    // oversell a room the cops just capped.
    const effectiveCapacity = Math.max(1, selectedVenue.capacity - (eventCapacityPenalty ?? 0));
    // Projected (pre-promo) crowd via the SHARED helper, so this preview and the
    // Promote screen's expected attendance can never disagree (projectBaseAttendance).
    const finalAttendance = projectBaseAttendance({
      bands: selectedBands,
      venue: selectedVenue,
      cityPrimaryGenre: currentCity?.primaryGenre,
      currentCityId,
      factionStandings,
      eventCapacityPenalty,
    });

    // Revenue includes bar sales where the venue has a bar (matches the engine),
    // times the faction money modifier.
    const grossRevenue = Math.floor((finalAttendance * ticketPrice + (selectedVenue.hasBar ? finalAttendance * 5 : 0)) * factionMoneyMult);
    // Costs: the scaled venue rent PLUS the per-band fee paid to every act on the
    // bill. The old preview omitted band fees, so it promised a profit on bills
    // that actually lose money — the most misleading number in the game.
    const venueCost = Math.floor(difficultySystem.getScaledVenueCost(selectedVenue.rent));
    const bandCost = selectedBands.reduce((sum, b) => sum + bandFee(b), 0);
    const netRevenue = grossRevenue - venueCost - bandCost;

    return {
      synergies,
      totalMultiplier,
      reputationBonus,
      sceneFit,
      homeFit,
      lineupChem,
      factionAttPct,
      expectedAttendance: finalAttendance,
      grossRevenue,
      venueCost,
      bandCost,
      netRevenue,
      capacity: effectiveCapacity
    };
  };

  const preview = calculateShowPreview();

  // The "ooh!" beat: when tweaking the bill lights up a NEW combo, ding +
  // buzz so build-craft feels alive. Only fires on an increase (not on un-picks
  // or ticket-price tweaks), tracked across renders by a ref.
  const synergyCount = preview?.synergies.length ?? 0;
  const prevSynergyCount = useRef(0);
  useEffect(() => {
    if (synergyCount > prevSynergyCount.current) {
      audio.synergy();
      haptics.medium();
    }
    prevSynergyCount.current = synergyCount;
  }, [synergyCount]);

  // Gate booking on the TRUE outlay (rent + every band's fee), not just rent —
  // otherwise a near-broke player books a bill they can't afford to resolve.
  const canBook =
    selectedBands.length > 0 &&
    !!selectedVenue &&
    !!preview &&
    money >= preview.venueCost + preview.bandCost;

  const handleBookShow = () => {
    if (!canBook) return;

    // Create show object. Timestamp + random suffix so two shows booked in the same
    // millisecond can't collide — the id is the key in the promotion Map, the
    // completeShow filter, and the snapshot dedup, all of which assume uniqueness.
    const show: Show = {
      id: `show-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
    scheduleShow(show, duringTutorialBuild ? 1 : leadTime);
    haptics.success();
    audio.play('cardDrop'); // satisfying "thunk" as the show lands on the calendar
    // A bill with combos stacked on it lands with a flourish, not just a thunk.
    if ((preview?.synergies.length ?? 0) > 0) audio.soldOut();

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

      {/* Content — landscape two-pane: build inputs scroll on the LEFT; the live
          payoff + Book stay pinned on the RIGHT, always in view while you pick. */}
      <div style={{ flex: 1, display: 'flex', gap: '12px', minHeight: 0, padding: '12px', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div style={{ flex: '1.5 1 0', overflowY: 'auto', minWidth: 0, paddingRight: '2px' }}>
        {/* Upcoming shows — what's booked and when it plays (reactive countdown). */}
        {scheduledShows.filter((s) => s.status === 'SCHEDULED').length > 0 && (
          <div className="snes-panel-inset" style={{ marginBottom: '16px', padding: '10px 12px' }}>
            <div className="snes-pixel" style={{ fontSize: '9px', color: '#ffd23f', letterSpacing: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} /> Upcoming Shows
            </div>
            {scheduledShows.filter((s) => s.status === 'SCHEDULED').map((s) => {
              const inTurns = (s.scheduledTurn ?? currentRound) - currentRound;
              const headliner = allBands.find((b) => b.id === (s.lineup?.[0] ?? s.bandId));
              const venue = allVenues.find((v) => v.id === s.venueId);
              return (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
                  <span style={{ fontSize: '11px', color: '#b9b3d6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {headliner?.name ?? '???'} · {venue?.name ?? '???'}
                  </span>
                  <span className="snes-pixel" style={{ flexShrink: 0, fontSize: '9px', letterSpacing: 0, color: inTurns <= 1 ? '#ff5c57' : '#3ad17e' }}>
                    {inTurns <= 0 ? 'tonight' : inTurns === 1 ? 'next turn' : `in ${inTurns} turns`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

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

          {bookableBands.length === 0 ? (
            <div className="snes-panel-inset" style={{
              padding: '24px',
              textAlign: 'center',
              color: '#b9b3d6'
            }}>
              <Users size={28} color="#6f6796" style={{ marginBottom: '8px' }} />
              <p className="snes-pixel" style={{ margin: '0 0 8px', fontSize: '10px', color: '#ffffff' }}>No bands available</p>
              <p style={{ fontSize: '12px', margin: 0, color: '#b9b3d6' }}>Unlock acts by playing — then sign them or book them as guests.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
              {bookableBands.map(band => {
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          color: '#ffffff',
                          marginBottom: '6px',
                          letterSpacing: 0
                        }}>
                          {/* Faction allegiance dot — scene politics at a glance */}
                          {(() => {
                            const fb = bandFactionBadge(band);
                            return fb ? <span title={fb.name} style={{ width: '8px', height: '8px', borderRadius: '50%', background: fb.color, flexShrink: 0 }} /> : null;
                          })()}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{band.name}</span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: isUnavailable ? '#ff5c57' : isSelected ? '#f72585' : '#b9b3d6'
                        }}>
                          {isUnavailable
                            ? 'On a drama break this turn'
                            : `${band.genre} • Pop ${band.popularity}`}
                        </div>
                        {!isUnavailable && (
                          <div className="snes-pixel" style={{ fontSize: '8px', marginTop: '5px', letterSpacing: 0, color: isSigned(band.id) ? '#3ad17e' : '#ffd23f' }}>
                            {isSigned(band.id)
                              ? `★ SIGNED · $${bandFee(band)} (your cut)`
                              : `GUEST · $${bandFee(band)} guarantee`}
                          </div>
                        )}
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
              onChange={(e) => { setTicketPrice(Number(e.target.value)); haptics.light(); }}
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
            {/* Live tradeoff readout — the price↔attendance relationship is the
                key micro-decision; surface it right at the slider, not buried in
                the preview below. */}
            {preview && (
              <div className="snes-pixel" style={{ marginTop: '8px', fontSize: '8px', color: '#b9b3d6', textAlign: 'center', letterSpacing: 0 }}>
                <span style={{ color: '#c77dff' }}>~{preview.expectedAttendance}</span> in
                <span style={{ color: '#6f6796' }}> · </span>
                <span style={{ color: '#3ad17e' }}>${preview.grossRevenue}</span> door
              </div>
            )}
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
          <section data-tut="combos" style={{ marginBottom: '16px' }}>
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

              {/* Hometown crowd — this band is from this city */}
              {preview.homeFit.isHome && (
                <div className="snes-panel-inset" style={{
                  border: '2px solid #3ad17e',
                  padding: '8px 10px',
                  marginBottom: '16px',
                }}>
                  <span className="snes-pixel" style={{ fontSize: '8px', color: '#3ad17e', letterSpacing: 0 }}>
                    🏠 {preview.homeFit.label} — {currentCity?.name} turns out (+{Math.round((preview.homeFit.multiplier - 1) * 100)}% crowd)
                  </span>
                </div>
              )}

              {/* Bill chemistry — how the bands on the bill get along (their
                  scenes/factions + shared history). Drama or tight bonds shift
                  the crowd; hostile pairs glow red. */}
              {(preview.lineupChem.mult !== 1 || preview.lineupChem.conflicts.length > 0) && (
                <div className="snes-panel-inset" style={{
                  border: `2px solid ${preview.lineupChem.hostile ? '#ff5c57' : '#3ad17e'}`,
                  padding: '8px 10px',
                  marginBottom: '16px',
                }}>
                  <div className="snes-pixel" style={{ fontSize: '8px', color: preview.lineupChem.hostile ? '#ff5c57' : '#3ad17e', letterSpacing: 0, marginBottom: preview.lineupChem.conflicts.length ? '6px' : 0 }}>
                    🎸 Bill Chemistry {Math.round((preview.lineupChem.mult - 1) * 100) >= 0 ? '+' : ''}{Math.round((preview.lineupChem.mult - 1) * 100)}% crowd
                  </div>
                  {preview.lineupChem.conflicts.map((c, i) => (
                    <div key={i} className="snes-pixel" style={{ fontSize: '7px', color: '#b9b3d6', letterSpacing: 0, lineHeight: 1.6 }}>{c}</div>
                  ))}
                </div>
              )}

              {/* Faction standing — your headliner's scene pulls (or repels) a crowd */}
              {preview.factionAttPct !== 0 && (
                <div className="snes-panel-inset" style={{
                  border: `2px solid ${preview.factionAttPct >= 0 ? '#c77dff' : '#ff5c57'}`,
                  padding: '8px 10px',
                  marginBottom: '16px',
                }}>
                  <div className="snes-pixel" style={{ fontSize: '8px', color: preview.factionAttPct >= 0 ? '#c77dff' : '#ff5c57', letterSpacing: 0 }}>
                    🎭 Faction Standing {preview.factionAttPct >= 0 ? '+' : ''}{preview.factionAttPct}% crowd
                  </div>
                </div>
              )}

              {/* Synergies */}
              {preview.synergies.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 className="snes-pixel btb-glow" style={{
                    fontSize: '8px',
                    color: '#3ad17e',
                    margin: '0 0 8px',
                    textTransform: 'uppercase',
                    letterSpacing: 0
                  }}>Synergies Firing 🔥</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {preview.synergies.map((synergy, idx) => {
                      const id = synergy.id ?? String(idx);
                      const open = expandedCombo === id;
                      return (
                        <button
                          key={id}
                          className="snes-pixel btb-pop"
                          onClick={() => { setExpandedCombo(open ? null : id); haptics.light(); }}
                          aria-expanded={open}
                          title={synergy.description}
                          style={{
                            padding: '6px 9px',
                            minHeight: '32px',
                            backgroundColor: open ? '#13301f' : '#0f0b1e',
                            border: '2px solid #3ad17e',
                            color: '#3ad17e',
                            fontSize: '8px',
                            letterSpacing: 0,
                            borderRadius: 0,
                            cursor: 'pointer'
                          }}
                        >
                          {synergy.name} (+{Math.round((synergy.multiplier - 1) * 100)}%)
                        </button>
                      );
                    })}
                  </div>
                  {/* Tap-to-reveal explainer — teaches what each combo did + why it fired */}
                  {expandedCombo && (() => {
                    const s = preview.synergies.find((x, i) => (x.id ?? String(i)) === expandedCombo);
                    if (!s) return null;
                    return (
                      <div className="snes-pixel" style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#0a1410', border: '2px solid #1f3a28', fontSize: '8px', lineHeight: 1.6, letterSpacing: 0 }}>
                        <div style={{ color: '#b9b3d6' }}>{s.description}</div>
                        <div style={{ marginTop: '6px', color: '#3ad17e' }}>
                          +{Math.round((s.multiplier - 1) * 100)}% crowd
                          {s.reputationBonus > 0 && <span style={{ color: '#ffd23f' }}> · +{s.reputationBonus} ★ rep</span>}
                        </div>
                      </div>
                    );
                  })()}
                  {preview.reputationBonus > 0 && (
                    <div className="snes-pixel" style={{ fontSize: '8px', color: '#ffd23f', letterSpacing: 0, marginTop: '6px' }}>
                      +{preview.reputationBonus} ★ rep from combos
                    </div>
                  )}
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

        {/* When the show plays — explicit lead time so you know what to budget for. */}
        <div className="snes-panel-inset" style={{ padding: '10px 12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="snes-pixel" style={{ fontSize: '9px', color: '#ffffff', letterSpacing: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} color="#f72585" /> When
            </span>
            <span className="snes-pixel" style={{ fontSize: '9px', color: '#3ad17e', letterSpacing: 0 }}>
              {leadTime === 1 ? 'plays next turn' : `plays in ${leadTime} turns`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => { setLeadTime(n); haptics.light(); }}
                className="snes-pixel btb-press"
                aria-label={`Book ${n} turn${n > 1 ? 's' : ''} out`}
                style={{
                  flex: 1, minHeight: '36px', fontSize: '10px', letterSpacing: 0, cursor: 'pointer',
                  background: leadTime === n ? '#f72585' : '#0a0814',
                  color: leadTime === n ? '#1a0a14' : '#6f6796',
                  border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 0 #2a2350', borderRadius: 0,
                }}
              >{n}</button>
            ))}
          </div>
          <p style={{ fontSize: '10px', color: '#6f6796', margin: '8px 0 0', lineHeight: 1.4 }}>
            More turns out = more time for promo to build hype (and to save up for the night).
          </p>
        </div>
        </div>{/* end LEFT pane */}

        {/* RIGHT pane — the night at a glance + Book, pinned in view */}
        <div style={{ flex: '1 1 0', overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {preview ? (
            <div className="snes-panel" style={{ padding: '14px' }}>
              <div className="snes-pixel" style={{ fontSize: '9px', color: '#3ad17e', letterSpacing: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={13} /> The Night
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#b9b3d6', marginBottom: '6px' }}>
                <span>Crowd</span><span className="snes-pixel" style={{ fontSize: '10px', color: '#ffffff' }}>{preview.expectedAttendance}/{preview.capacity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#b9b3d6', marginBottom: '6px' }}>
                <span>Door + bar</span><span className="snes-pixel" style={{ fontSize: '10px', color: '#3ad17e' }}>${preview.grossRevenue}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#b9b3d6', marginBottom: '8px' }}>
                <span>Costs</span><span className="snes-pixel" style={{ fontSize: '10px', color: '#ff5c57' }}>-${preview.venueCost + preview.bandCost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #2a2350', paddingTop: '8px' }}>
                <span className="snes-pixel" style={{ fontSize: '9px', color: '#ffffff', letterSpacing: 0 }}>Net</span>
                <span className="snes-pixel" style={{ fontSize: '13px', letterSpacing: 0, color: preview.netRevenue >= 0 ? '#3ad17e' : '#ff5c57' }}>{preview.netRevenue >= 0 ? '+' : ''}${preview.netRevenue}</span>
              </div>
              {preview.synergies.length > 0 && (
                <div className="snes-pixel" style={{ fontSize: '9px', color: '#ffd23f', letterSpacing: 0, marginTop: '10px' }}>🔥 {preview.synergies.length} combo{preview.synergies.length > 1 ? 's' : ''} firing</div>
              )}
              <div style={{ fontSize: '10px', color: '#6f6796', marginTop: '10px', lineHeight: 1.4 }}>
                {leadTime === 1 ? 'Plays next turn' : `Plays in ${leadTime} turns`} · full breakdown on the left
              </div>
            </div>
          ) : (
            <div className="snes-panel-inset" style={{ padding: '18px', textAlign: 'center', color: '#6f6796', fontSize: '12px', lineHeight: 1.5 }}>
              Pick a lineup and a venue to see the night ahead.
            </div>
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
           (preview && money < preview.venueCost + preview.bandCost) ? 'Not Enough Cash' :
           'Book This Show'}
        </button>
        </div>{/* end RIGHT pane */}
      </div>
    </div>
  );
};

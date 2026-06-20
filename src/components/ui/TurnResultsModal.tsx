import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShowResult } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { SATIRICAL_TURN_RESULTS } from '@game/data/satiricalText';
import type { SynergyTriggerResult } from '@game/mechanics/SynergyManager';
import { X, Users, DollarSign, Star } from 'lucide-react';

interface TurnResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showResults: ShowResult[];
  /** Flat living costs + equipment upkeep for the turn */
  totalUpkeep: number;
  dayJobResult?: {
    money: number;
    reputationLoss: number;
    fanLoss: number;
    stressGain: number;
    message: string;
    randomEvent?: {
      message: string;
      effects: unknown;
    };
  };
  difficultyEvent?: {
    message: string;
    reputationLost: number;
  };
  /** Equipped-synergy ("joker") triggers that fired this turn, for feedback. */
  synergyEffects?: SynergyTriggerResult[];
}

export const TurnResultsModal: React.FC<TurnResultsModalProps> = ({
  isOpen,
  onClose,
  showResults = [],
  totalUpkeep = 0,
  dayJobResult,
  difficultyEvent,
  synergyEffects = []
}) => {
  const allBands = useGameStore((state) => state.allBands);
  const venues = useGameStore((state) => state.venues);
  const scheduledShows = useGameStore((state) => state.scheduledShows);
  const showHistory = useGameStore((state) => state.showHistory);

  const getShowDetails = (showId: string) => {
    // A resolved show is moved out of scheduledShows into showHistory before this
    // modal renders, so fall back to history — otherwise every result row reads
    // "Unknown Band @ Unknown Venue".
    const show =
      scheduledShows.find((s) => s.id === showId) ??
      showHistory.find((s) => s.id === showId);
    const band = show ? allBands.find((b) => b.id === show.bandId) : undefined;
    const venue = show ? venues.find((v) => v.id === show.venueId) : undefined;
    return {
      bandName: band?.name ?? 'Unknown Band',
      venueName: venue?.name ?? 'Unknown Venue',
      capacity: venue?.capacity ?? 0,
    };
  };

  const totalRevenue = showResults.reduce((sum, result) => sum + result.revenue, 0);
  const totalCosts = showResults.reduce((sum, result) => sum + result.financials.costs, 0) + totalUpkeep;
  const totalProfit = totalRevenue - totalCosts;
  const totalFans = showResults.reduce((sum, result) => sum + result.fansGained, 0);
  const totalRep = showResults.reduce((sum, result) => sum + (result.reputationChange ?? result.reputationGain ?? 0), 0);

  const getTurnResultMessage = () => {
    if (showResults.length === 0) {
      return "No Shows Booked: Scene Holds Its Breath in Collective Indifference";
    }
    if (totalProfit > 100) {
      return SATIRICAL_TURN_RESULTS.GREAT_NIGHT;
    }
    if (totalProfit > 0) {
      return SATIRICAL_TURN_RESULTS.DECENT_NIGHT;
    }
    if (totalProfit > -50) {
      return SATIRICAL_TURN_RESULTS.BROKE_EVEN;
    }
    return SATIRICAL_TURN_RESULTS.BAD_NIGHT;
  };

  const getReputationMessage = () => {
    if (totalRep > 10) {
      return SATIRICAL_TURN_RESULTS.REPUTATION_UP;
    }
    if (totalRep < -10) {
      return SATIRICAL_TURN_RESULTS.REPUTATION_DOWN;
    }
    return "";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
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
          padding: '16px',
          overflowY: 'auto'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: '#171327',
            borderRadius: 0,
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            border: '2px solid #0a0814',
            borderTop: '3px solid #f72585',
            boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '2px solid #0a0814',
            backgroundColor: '#0f0b1e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h2 className="snes-pixel" style={{
              fontSize: '12px',
              color: '#f72585',
              margin: 0,
              letterSpacing: 0,
              lineHeight: 1.5
            }}>Post-Show Damage Report</h2>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1f1a3a',
                border: '2px solid #0a0814',
                borderRadius: 0,
                color: '#b9b3d6',
                cursor: 'pointer',
                padding: 0,
                transition: 'none'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
            {/* Turn Summary Message */}
            <div style={{
              backgroundColor: '#0f0b1e',
              borderRadius: 0,
              padding: '16px',
              marginBottom: '20px',
              border: '2px solid #0a0814',
              borderLeft: '4px solid #f72585'
            }}>
              <p style={{
                color: '#b9b3d6',
                fontSize: '13px',
                lineHeight: '1.6',
                margin: 0,
                fontStyle: 'italic'
              }}>{getTurnResultMessage()}</p>
              {getReputationMessage() && (
                <p style={{
                  color: '#b9b3d6',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  margin: '8px 0 0 0',
                  fontStyle: 'italic'
                }}>{getReputationMessage()}</p>
              )}
            </div>

            {/* Financial Summary */}
            <div style={{
              backgroundColor: '#0f0b1e',
              borderRadius: 0,
              padding: '20px',
              marginBottom: '20px',
              border: '2px solid #0a0814',
              boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814'
            }}>
              <h3 className="snes-pixel" style={{
                fontSize: '10px',
                color: '#ffffff',
                marginTop: 0,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: 0,
                lineHeight: 1.4
              }}>
                <DollarSign size={16} color="#3ad17e" />
                Financial Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#b9b3d6', fontSize: '13px' }}>Revenue</span>
                  <span className="snes-pixel" style={{ color: '#3ad17e', fontSize: '9px', letterSpacing: 0 }}>+${totalRevenue}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#b9b3d6', fontSize: '13px' }}>Costs</span>
                  <span className="snes-pixel" style={{ color: '#ff5c57', fontSize: '9px', letterSpacing: 0 }}>-${totalCosts}</span>
                </div>
                {totalUpkeep > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#6f6796', fontSize: '12px' }}>└ Living Costs (rent, ramen, regret)</span>
                    <span style={{ color: '#ff5c57', fontSize: '12px' }}>-${totalUpkeep}</span>
                  </div>
                )}
                <div style={{
                  borderTop: '2px solid #2a2350',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span className="snes-pixel" style={{ color: '#ffffff', fontSize: '9px', letterSpacing: 0 }}>Net Profit</span>
                  <span className="snes-pixel" style={{
                    color: totalProfit >= 0 ? '#3ad17e' : '#ff5c57',
                    fontSize: '11px',
                    letterSpacing: 0
                  }}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Changes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: '#0f0b1e',
                borderRadius: 0,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '2px solid #c77dff'
              }}>
                <Users size={20} color="#c77dff" />
                <div>
                  <div className="snes-pixel" style={{ color: '#b9b3d6', fontSize: '7px', letterSpacing: 0, marginBottom: '6px' }}>Fans</div>
                  <div className="snes-pixel" style={{ color: '#ffffff', fontSize: '10px', letterSpacing: 0 }}>
                    {totalFans > 0 ? '+' : ''}{totalFans}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#0f0b1e',
                borderRadius: 0,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '2px solid #ffd23f'
              }}>
                <Star size={20} color="#ffd23f" />
                <div>
                  <div className="snes-pixel" style={{ color: '#b9b3d6', fontSize: '7px', letterSpacing: 0, marginBottom: '6px' }}>Reputation</div>
                  <div className="snes-pixel" style={{ color: '#ffffff', fontSize: '10px', letterSpacing: 0 }}>
                    {totalRep > 0 ? '+' : ''}{totalRep}
                  </div>
                </div>
              </div>
            </div>

            {/* Show Results */}
            {showResults.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px',
                  color: '#ffffff',
                  marginTop: 0,
                  marginBottom: '12px',
                  letterSpacing: 0,
                  lineHeight: 1.4
                }}>Tonight's Shows</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {showResults.map((result, index) => {
                    const details = getShowDetails(result.showId);
                    return (
                    <div key={index} style={{
                      backgroundColor: '#0f0b1e',
                      borderRadius: 0,
                      padding: '12px',
                      fontSize: '14px',
                      border: '2px solid #0a0814',
                      boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <span style={{ color: '#ffffff', fontWeight: '500', fontSize: '13px' }}>
                          {details.bandName} @ {details.venueName}
                        </span>
                        <span className="snes-pixel" style={{
                          fontSize: '9px',
                          letterSpacing: 0,
                          color: result.revenue - result.financials.costs > 0 ? '#3ad17e' : '#ff5c57'
                        }}>
                          ${result.revenue - result.financials.costs}
                        </span>
                      </div>
                      <div style={{ color: '#6f6796', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{result.attendance}/{details.capacity} attended • +{result.fansGained} fans</span>
                        {details.capacity > 0 && result.attendance >= details.capacity && (
                          <span className="snes-pixel btb-pop" style={{
                            fontSize: '7px', letterSpacing: 0, color: '#1a0a14',
                            backgroundColor: '#ffd23f', padding: '2px 5px'
                          }}>🎉 SOLD OUT</span>
                        )}
                      </div>
                      {result.venueSynergies && result.venueSynergies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {result.venueSynergies.map((s, i) => (
                            <span key={i} className="snes-pixel" style={{
                              fontSize: '7px', letterSpacing: 0, color: '#3ad17e',
                              border: '2px solid #3ad17e', backgroundColor: '#0a1410', padding: '3px 5px'
                            }}>🔥 {s.name}</span>
                          ))}
                        </div>
                      )}
                      {result.combosDiscovered && result.combosDiscovered.length > 0 && (
                        <div className="snes-pixel btb-pop btb-glow" style={{
                          fontSize: '8px', letterSpacing: 0, color: '#ffd23f', marginTop: '8px'
                        }}>✨ NEW SYNERGY DISCOVERED!</div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Equipped synergies ("jokers") that fired this turn */}
            {synergyEffects.filter((s) => s.triggered).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px', color: '#c77dff', marginTop: 0, marginBottom: '12px', letterSpacing: 0
                }}>Jokers Fired 🃏</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {synergyEffects.filter((s) => s.triggered).map((s, i) => (
                    <div key={i} style={{
                      backgroundColor: '#0f0b1e', border: '2px solid #0a0814',
                      borderLeft: '4px solid #c77dff', padding: '8px 10px'
                    }}>
                      <span className="snes-pixel" style={{ fontSize: '8px', color: '#c77dff', letterSpacing: 0 }}>
                        {s.synergyName}
                      </span>
                      <div style={{ color: '#b9b3d6', fontSize: '11px', marginTop: '3px' }}>
                        {s.effects.map((e) => e.description).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day Job Result */}
            {dayJobResult && (
              <div style={{
                backgroundColor: '#0f0b1e',
                borderRadius: 0,
                padding: '16px',
                marginBottom: '20px',
                border: '2px solid #0a0814',
                borderLeft: '4px solid #ffd23f'
              }}>
                <h3 className="snes-pixel" style={{
                  fontSize: '10px',
                  color: '#ffffff',
                  marginTop: 0,
                  marginBottom: '10px',
                  letterSpacing: 0,
                  lineHeight: 1.4
                }}>Day Job</h3>
                <p style={{ color: '#b9b3d6', fontSize: '13px', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {dayJobResult.message}
                </p>
                <div className="snes-pixel" style={{ fontSize: '8px', color: '#b9b3d6', letterSpacing: 0, lineHeight: 1.6 }}>
                  +${dayJobResult.money} • Stress +{dayJobResult.stressGain}%
                </div>
              </div>
            )}

            {/* Difficulty Event */}
            {difficultyEvent && (
              <div style={{
                backgroundColor: '#0f0b1e',
                borderRadius: 0,
                padding: '16px',
                border: '2px solid #ff5c57',
                borderLeft: '4px solid #ff5c57'
              }}>
                <p style={{ color: '#ff5c57', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  {difficultyEvent.message}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '2px solid #0a0814',
            backgroundColor: '#0f0b1e'
          }}>
            <button
              onClick={onClose}
              className="snes-btn"
              style={{
                width: '100%',
                minHeight: '44px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
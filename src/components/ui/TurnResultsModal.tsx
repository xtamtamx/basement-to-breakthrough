import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShowResult } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { SATIRICAL_TURN_RESULTS } from '@game/data/satiricalText';
import { X, TrendingUp, TrendingDown, Users, DollarSign, Star } from 'lucide-react';

interface TurnResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showResults: ShowResult[];
  totalVenueRent: number;
  dayJobResult?: {
    money: number;
    reputationLoss: number;
    fanLoss: number;
    stressGain: number;
    message: string;
    randomEvent?: {
      message: string;
      effects: any;
    };
  };
  difficultyEvent?: {
    message: string;
    reputationLost: number;
  };
}

export const TurnResultsModal: React.FC<TurnResultsModalProps> = ({ 
  isOpen, 
  onClose,
  showResults = [],
  totalVenueRent = 0,
  dayJobResult,
  difficultyEvent
}) => {
  const { money, reputation, fans } = useGameStore();
  
  const totalRevenue = showResults.reduce((sum, result) => sum + result.revenue, 0);
  const totalCosts = showResults.reduce((sum, result) => sum + result.financials.costs, 0) + totalVenueRent;
  const totalProfit = totalRevenue - totalCosts;
  const totalFans = showResults.reduce((sum, result) => sum + result.fansGained, 0);
  const totalRep = showResults.reduce((sum, result) => sum + result.reputationChange, 0);

  const getTurnResultMessage = () => {
    if (showResults.length === 0) {
      return SATIRICAL_TURN_RESULTS.NO_SHOWS;
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
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
            backgroundColor: '#111827',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            border: '2px solid #ec4899',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ec4899',
              margin: 0
            }}>Post-Show Damage Report</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={24} />
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
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              borderLeft: '4px solid #ec4899'
            }}>
              <p style={{
                color: '#d1d5db',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
                fontStyle: 'italic'
              }}>{getTurnResultMessage()}</p>
              {getReputationMessage() && (
                <p style={{
                  color: '#d1d5db',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: '8px 0 0 0',
                  fontStyle: 'italic'
                }}>{getReputationMessage()}</p>
              )}
            </div>

            {/* Financial Summary */}
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <DollarSign size={18} />
                Financial Breakdown
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Revenue</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>+${totalRevenue}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Costs</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>-${totalCosts}</span>
                </div>
                {totalVenueRent > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>└ Venue Rent</span>
                    <span style={{ color: '#ef4444' }}>-${totalVenueRent}</span>
                  </div>
                )}
                <div style={{
                  borderTop: '1px solid #374151',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#ffffff', fontWeight: '600' }}>Net Profit</span>
                  <span style={{
                    color: totalProfit >= 0 ? '#10b981' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '18px'
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
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Users size={20} color="#a78bfa" />
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>Fans</div>
                  <div style={{ color: '#ffffff', fontWeight: '600' }}>
                    {totalFans > 0 ? '+' : ''}{totalFans}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Star size={20} color="#fbbf24" />
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>Reputation</div>
                  <div style={{ color: '#ffffff', fontWeight: '600' }}>
                    {totalRep > 0 ? '+' : ''}{totalRep}
                  </div>
                </div>
              </div>
            </div>

            {/* Show Results */}
            {showResults.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '12px'
                }}>Tonight's Shows</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {showResults.map((result, index) => (
                    <div key={index} style={{
                      backgroundColor: '#1f2937',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span style={{ color: '#ffffff', fontWeight: '500' }}>
                          {result.bandName} @ {result.venueName}
                        </span>
                        <span style={{
                          color: result.revenue - result.financials.costs > 0 ? '#10b981' : '#ef4444'
                        }}>
                          ${result.revenue - result.financials.costs}
                        </span>
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                        {result.attendance}/{result.capacity} attended • +{result.fansGained} fans
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day Job Result */}
            {dayJobResult && (
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>Day Job</h3>
                <p style={{ color: '#d1d5db', fontSize: '14px', margin: '0 0 8px 0' }}>
                  {dayJobResult.message}
                </p>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  +${dayJobResult.money} • Stress +{dayJobResult.stressGain}%
                </div>
              </div>
            )}

            {/* Difficulty Event */}
            {difficultyEvent && (
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '16px',
                borderLeft: '4px solid #ef4444'
              }}>
                <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>
                  {difficultyEvent.message}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #374151'
          }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                backgroundColor: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db2777'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ec4899'}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
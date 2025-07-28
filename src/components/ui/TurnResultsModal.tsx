import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShowResult } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { Button } from './Button';
import { SATIRICAL_TURN_RESULTS } from '@game/data/satiricalText';

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
  showResults,
  totalVenueRent,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="turn-results-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Post-Show Damage Report</h2>
              <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="results-content">
              {/* Show Results */}
              {showResults.length > 0 ? (
                <div className="shows-section">
                  <h3 className="section-title">Tonight's Disasters</h3>
                  <div className="show-results">
                    {showResults.map((result, index) => (
                      <motion.div
                        key={result.showId}
                        className={`show-result ${result.isSuccess ? 'success' : 'failure'}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="show-header">
                          <span className="show-icon">
                            {result.isSuccess ? '🎸' : '💔'}
                          </span>
                          <span className="show-status">
                            {result.isSuccess ? 'Somehow Didn\'t Fail' : 'Predictable Disaster'}
                          </span>
                        </div>
                        
                        <div className="show-stats">
                          <div className="stat">
                            <span className="stat-label">Attendance</span>
                            <span className="stat-value">{result.attendance}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Revenue</span>
                            <span className="stat-value">${result.revenue}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Profit</span>
                            <span className={`stat-value ${result.financials.profit > 0 ? 'positive' : 'negative'}`}>
                              ${result.financials.profit}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Fans</span>
                            <span className="stat-value">+{result.fansGained}</span>
                          </div>
                        </div>

                        {result.incidents.length > 0 && (
                          <div className="incidents">
                            {result.incidents.map((incident, i) => (
                              <div key={i} className="incident">
                                <span className="incident-icon">⚠️</span>
                                <span className="incident-text">{incident.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-shows">
                  <span className="no-shows-icon">📅</span>
                  <p className="no-shows-text">Another Night of Sitting Alone in Your "Office" (Bedroom)</p>
                </div>
              )}

              {/* Venue Costs */}
              <div className="costs-section">
                <h3 className="section-title">Landlord's Yacht Fund Contributions</h3>
                <div className="cost-item">
                  <span className="cost-label">Money You'll Never See Again</span>
                  <span className="cost-value negative">-${totalVenueRent}</span>
                </div>
              </div>

              {/* Day Job Results */}
              {dayJobResult && (
                <div className="day-job-section" style={{
                  background: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  border: '1px solid var(--border-default)'
                }}>
                  <h3 className="section-title">Soul-Crushing Employment Update</h3>
                  <div className="job-stats" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div className="stat">
                      <span className="stat-label">Wage Slavery Income</span>
                      <span className="stat-value positive">+${dayJobResult.money}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Street Cred Lost</span>
                      <span className="stat-value negative">-{dayJobResult.reputationLoss}</span>
                    </div>
                    {dayJobResult.fanLoss > 0 && (
                      <div className="stat">
                        <span className="stat-label">Disappointed Fans</span>
                        <span className="stat-value negative">-{dayJobResult.fanLoss}</span>
                      </div>
                    )}
                    <div className="stat">
                      <span className="stat-label">Mental Health</span>
                      <span className="stat-value negative">+{dayJobResult.stressGain}% stress</span>
                    </div>
                  </div>
                  <p style={{
                    fontStyle: 'italic',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    "{dayJobResult.message}"
                  </p>
                  
                  {dayJobResult.randomEvent && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--punk-magenta)'
                    }}>
                      <h4 style={{ 
                        fontSize: '14px',
                        margin: '0 0 8px 0',
                        color: 'var(--punk-magenta)',
                        textTransform: 'uppercase'
                      }}>
                        Random Work Event!
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '13px',
                        color: 'var(--text-primary)'
                      }}>
                        {dayJobResult.randomEvent.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Difficulty Event */}
              {difficultyEvent && (
                <div className="difficulty-event-section" style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '2px solid var(--metal-red)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <h3 className="section-title" style={{ color: 'var(--metal-red)' }}>
                    Scene Evolution
                  </h3>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6'
                  }}>
                    {difficultyEvent.message}
                  </p>
                  {difficultyEvent.reputationLost > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: 'var(--metal-red)'
                    }}>
                      <span>⭐</span>
                      <span>-{difficultyEvent.reputationLost} reputation from scene decay</span>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="summary-section">
                <h3 className="section-title">Financial Autopsy</h3>
                
                {/* Turn Result Message */}
                <div className="turn-message" style={{
                  padding: '16px',
                  background: totalProfit > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${totalProfit > 0 ? 'var(--success-green)' : 'var(--metal-red)'}`,
                  borderRadius: '8px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: totalProfit > 0 ? 'var(--success-green)' : 'var(--metal-red)'
                  }}>
                    {getTurnResultMessage()}
                  </p>
                  {getReputationMessage() && (
                    <p style={{
                      margin: '8px 0 0',
                      fontSize: '14px',
                      color: 'var(--text-muted)'
                    }}>
                      {getReputationMessage()}
                    </p>
                  )}
                </div>
                
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-label">Total Revenue</span>
                    <span className="summary-value positive">${totalRevenue}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Costs</span>
                    <span className="summary-value negative">-${totalCosts}</span>
                  </div>
                  <div className="summary-item profit">
                    <span className="summary-label">Net Profit</span>
                    <span className={`summary-value ${totalProfit > 0 ? 'positive' : 'negative'}`}>
                      ${totalProfit}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Fans Gained</span>
                    <span className="summary-value">{totalFans > 0 ? '+' : ''}{totalFans}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Reputation Change</span>
                    <span className={`summary-value ${totalRep > 0 ? 'positive' : 'negative'}`}>
                      {totalRep > 0 ? '+' : ''}{totalRep}
                    </span>
                  </div>
                </div>

                <div className="current-stats">
                  <div className="current-stat">
                    <span className="icon">💰</span>
                    <span className="value">${money}</span>
                  </div>
                  <div className="current-stat">
                    <span className="icon">⭐</span>
                    <span className="value">{reputation}</span>
                  </div>
                  <div className="current-stat">
                    <span className="icon">👥</span>
                    <span className="value">{fans}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="primary" size="lg" onClick={onClose}>
                {totalProfit > 0 ? 'Ride This High Into Next Turn' : 'Limp Into Another Day'}
              </Button>
            </div>

            <style jsx>{`
              .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
              }

              .turn-results-modal {
                background: var(--bg-secondary);
                border: 2px solid var(--border-default);
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
              }

              .modal-header {
                padding: 24px;
                border-bottom: 2px solid var(--border-default);
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .modal-title {
                margin: 0;
                font-size: 28px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--punk-magenta);
              }

              .close-button {
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 32px;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all var(--transition-fast);
              }

              .close-button:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
              }

              .results-content {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
              }

              .shows-section,
              .costs-section,
              .summary-section {
                margin-bottom: 24px;
              }

              .section-title {
                margin: 0 0 16px;
                font-size: 18px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--punk-magenta);
              }

              .show-results {
                display: flex;
                flex-direction: column;
                gap: 12px;
              }

              .show-result {
                background: var(--bg-tertiary);
                border: 2px solid var(--border-default);
                border-radius: 12px;
                padding: 16px;
              }

              .show-result.success {
                border-color: var(--success-emerald);
              }

              .show-result.failure {
                border-color: var(--metal-red);
              }

              .show-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
              }

              .show-icon {
                font-size: 24px;
              }

              .show-status {
                font-size: 16px;
                font-weight: 600;
              }

              .show-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
              }

              .stat {
                text-align: center;
              }

              .stat-label {
                display: block;
                font-size: 12px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 4px;
              }

              .stat-value {
                display: block;
                font-size: 16px;
                font-weight: 700;
                color: var(--text-secondary);
              }

              .stat-value.positive {
                color: var(--success-green);
              }

              .stat-value.negative {
                color: var(--metal-red);
              }

              .incidents {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--border-default);
              }

              .incident {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: var(--warning-amber);
              }

              .incident-icon {
                font-size: 16px;
              }

              .no-shows {
                text-align: center;
                padding: 40px;
              }

              .no-shows-icon {
                font-size: 48px;
                display: block;
                margin-bottom: 16px;
                opacity: 0.5;
              }

              .no-shows-text {
                color: var(--text-muted);
                font-size: 16px;
              }

              .cost-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: var(--bg-tertiary);
                border-radius: 8px;
              }

              .cost-label {
                font-size: 16px;
                color: var(--text-secondary);
              }

              .cost-value {
                font-size: 18px;
                font-weight: 700;
              }

              .cost-value.negative {
                color: var(--metal-red);
              }

              .summary-stats {
                background: var(--bg-tertiary);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
              }

              .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
              }

              .summary-item.profit {
                border-top: 2px solid var(--border-default);
                padding-top: 12px;
                margin-top: 4px;
              }

              .summary-label {
                font-size: 14px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }

              .summary-value {
                font-size: 18px;
                font-weight: 700;
                color: var(--text-secondary);
              }

              .summary-value.positive {
                color: var(--success-green);
              }

              .summary-value.negative {
                color: var(--metal-red);
              }

              .current-stats {
                display: flex;
                justify-content: center;
                gap: 32px;
                padding: 20px;
                background: var(--bg-primary);
                border-radius: 12px;
              }

              .current-stat {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .current-stat .icon {
                font-size: 24px;
              }

              .current-stat .value {
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary);
              }

              .modal-footer {
                padding: 24px;
                border-top: 2px solid var(--border-default);
              }

              @media (max-width: 768px) {
                .show-stats {
                  grid-template-columns: repeat(2, 1fr);
                }

                .current-stats {
                  gap: 16px;
                }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
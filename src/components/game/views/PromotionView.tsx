import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem, PromotionType, PROMOTION_ACTIVITIES } from '@game/mechanics/ShowPromotionSystem';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { haptics } from '@utils/mobile';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

interface PromotionViewProps {
  onNavigate?: (view: ViewType) => void;
}

export const PromotionView: React.FC<PromotionViewProps> = ({ onNavigate }) => {
  const { money, reputation, connections, fans, venues, allBands } = useGameStore();
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const scheduledShows = showPromotionSystem.getScheduledShows();
  
  const handlePromote = (showId: string, promotionType: PromotionType) => {
    if (showPromotionSystem.promoteShow(showId, promotionType)) {
      haptics.success();
    } else {
      haptics.error();
    }
  };
  
  const selectedShow = scheduledShows.find(s => s.id === selectedShowId);
  const promotionReport = selectedShowId ? showPromotionSystem.getPromotionReport(selectedShowId) : null;
  
  if (scheduledShows.length === 0) {
    return (
      <div className="promotion-view empty">
        <div className="empty-state">
          <h2>No Shows Scheduled</h2>
          <p>Book shows in advance to have time for promotion!</p>
          <Button variant="primary" size="lg" onClick={() => onNavigate?.('shows' as ViewType)}>
            Go to Show Builder →
          </Button>
        </div>
        
        <style jsx>{`
          .promotion-view {
            padding: 20px;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 16px;
          }
          
          .empty-state h2 {
            font-size: 24px;
            color: var(--punk-magenta);
            margin: 0;
          }
          
          .empty-state p {
            color: var(--text-secondary);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="promotion-view">
      <div className="view-header">
        <h2 className="view-title">SHOW PROMOTION</h2>
        <p className="view-subtitle">Build hype for your upcoming shows</p>
      </div>
      
      {/* Show List */}
      <div className="scheduled-shows">
        {scheduledShows.map(show => {
          const venue = venues.find(v => v.id === show.venueId);
          const band = allBands.find(b => b.id === show.bandId);
          
          return (
            <motion.div
              key={show.id}
              className={`show-card ${selectedShowId === show.id ? 'selected' : ''}`}
              onClick={() => setSelectedShowId(show.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="show-header">
                <div className="show-info">
                  <h3>{band?.name} @ {venue?.name}</h3>
                  <p className="show-timing">
                    {show.turnsUntilShow === 1 ? 'Next Turn!' : `In ${show.turnsUntilShow} turns`}
                  </p>
                </div>
                <div className="show-stats">
                  <div className="hype-meter">
                    <span className="hype-label">HYPE</span>
                    <div className="hype-bar">
                      <div 
                        className="hype-fill"
                        style={{ 
                          width: `${show.hype}%`,
                          background: show.hype > 80 ? 'var(--punk-magenta)' : 
                                     show.hype > 50 ? 'var(--success-green)' :
                                     show.hype > 20 ? 'var(--warning-amber)' : 'var(--metal-red)'
                        }}
                      />
                    </div>
                    <span className="hype-value">{show.hype}%</span>
                  </div>
                  <div className="expected-attendance">
                    <span className="attendance-label">Expected</span>
                    <span className="attendance-value">{show.expectedAttendance}/{venue?.capacity}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Promotion Activities */}
      {selectedShow && (
        <motion.div
          className="promotion-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Promote This Show</h3>
          
          {selectedShow.turnsUntilShow === 1 ? (
            <div className="no-time-warning">
              <span className="warning-icon">⚠️</span>
              <p>No time left to promote - the show is next turn!</p>
            </div>
          ) : (
            <>
              <div className="promotion-grid">
                {Object.values(PROMOTION_ACTIVITIES).map(activity => {
                  const meetsRequirements = !activity.requirements || (
                    (!activity.requirements.minReputation || reputation >= activity.requirements.minReputation) &&
                    (!activity.requirements.minConnections || connections >= activity.requirements.minConnections) &&
                    (!activity.requirements.minFans || fans >= activity.requirements.minFans)
                  );
                  
                  const canAfford = money >= activity.cost;
                  const timesUsed = selectedShow.promotionInvestment.get(activity.type) || 0;
                  const effectiveness = Math.pow(0.8, timesUsed); // Diminishing returns
                  
                  return (
                    <Card
                      key={activity.type}
                      variant={meetsRequirements && canAfford ? 'default' : 'disabled'}
                      className="promotion-card"
                    >
                      <h4>{activity.name}</h4>
                      <p className="activity-description">{activity.description}</p>
                      
                      <div className="activity-stats">
                        {activity.cost > 0 && (
                          <span className="stat">💰 ${activity.cost}</span>
                        )}
                        <span className="stat">📈 {Math.floor((activity.effectiveness - 1) * 100 * effectiveness)}%</span>
                        {activity.reputationBonus && (
                          <span className="stat">⭐ +{activity.reputationBonus}</span>
                        )}
                      </div>
                      
                      {timesUsed > 0 && (
                        <div className="diminishing-returns">
                          Used {timesUsed}x - {Math.floor(effectiveness * 100)}% effective
                        </div>
                      )}
                      
                      {activity.requirements && !meetsRequirements && (
                        <div className="requirements">
                          {activity.requirements.minReputation && reputation < activity.requirements.minReputation && (
                            <span>Need {activity.requirements.minReputation} rep</span>
                          )}
                          {activity.requirements.minConnections && connections < activity.requirements.minConnections && (
                            <span>Need {activity.requirements.minConnections} connections</span>
                          )}
                          {activity.requirements.minFans && fans < activity.requirements.minFans && (
                            <span>Need {activity.requirements.minFans} fans</span>
                          )}
                        </div>
                      )}
                      
                      <p className="flavor-text">{activity.satiricalFlavor}</p>
                      
                      <Button
                        variant={meetsRequirements && canAfford ? 'primary' : 'disabled'}
                        size="sm"
                        onClick={() => handlePromote(selectedShow.id, activity.type)}
                        disabled={!meetsRequirements || !canAfford}
                        fullWidth
                      >
                        {activity.cost > 0 ? `Promote ($${activity.cost})` : 'Promote'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
              
              {/* Promotion Summary */}
              {promotionReport && promotionReport.totalInvestment > 0 && (
                <div className="promotion-summary">
                  <h4>Campaign Summary</h4>
                  <div className="summary-stats">
                    <div className="stat">
                      <span>Total Spent</span>
                      <span>${promotionReport.totalInvestment}</span>
                    </div>
                    <div className="stat">
                      <span>Effectiveness</span>
                      <span>{Math.floor((promotionReport.effectiveness - 1) * 100)}%</span>
                    </div>
                    <div className="stat">
                      <span>Current Hype</span>
                      <span>{promotionReport.hype}%</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
      
      <style jsx>{`
        .promotion-view {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }
        
        .view-header {
          text-align: center;
        }
        
        .view-title {
          font-size: 2rem;
          font-weight: 900;
          color: var(--punk-magenta);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .view-subtitle {
          color: var(--text-secondary);
          margin-top: 8px;
        }
        
        .scheduled-shows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .show-card {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all var(--transition-base);
        }
        
        .show-card:hover {
          border-color: var(--punk-magenta);
        }
        
        .show-card.selected {
          border-color: var(--punk-magenta);
          background: var(--bg-tertiary);
        }
        
        .show-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        
        .show-info h3 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--text-primary);
        }
        
        .show-timing {
          margin: 4px 0 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        
        .show-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-end;
        }
        
        .hype-meter {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .hype-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        
        .hype-bar {
          width: 100px;
          height: 8px;
          background: var(--bg-primary);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .hype-fill {
          height: 100%;
          transition: all var(--transition-base);
        }
        
        .hype-value {
          font-size: 0.9rem;
          font-weight: 700;
          min-width: 40px;
          text-align: right;
        }
        
        .expected-attendance {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .attendance-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        
        .attendance-value {
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .promotion-panel {
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
        }
        
        .promotion-panel h3 {
          margin: 0 0 20px;
          color: var(--punk-magenta);
        }
        
        .no-time-warning {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--metal-red);
          border-radius: 8px;
        }
        
        .warning-icon {
          font-size: 24px;
        }
        
        .no-time-warning p {
          margin: 0;
          color: var(--metal-red);
        }
        
        .promotion-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .promotion-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .promotion-card h4 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        
        .activity-description {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .activity-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .activity-stats .stat {
          font-size: 0.85rem;
          font-weight: 600;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
        }
        
        .diminishing-returns {
          font-size: 0.85rem;
          color: var(--warning-amber);
          font-style: italic;
        }
        
        .requirements {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .requirements span {
          font-size: 0.8rem;
          color: var(--metal-red);
          background: rgba(239, 68, 68, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .flavor-text {
          margin: 0;
          font-size: 0.85rem;
          font-style: italic;
          color: var(--text-muted);
        }
        
        .promotion-summary {
          margin-top: 20px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }
        
        .promotion-summary h4 {
          margin: 0 0 12px;
          font-size: 1rem;
          color: var(--text-primary);
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .summary-stats .stat {
          text-align: center;
        }
        
        .summary-stats .stat span:first-child {
          display: block;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        
        .summary-stats .stat span:last-child {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--punk-magenta);
        }
        
        @media (max-width: 768px) {
          .promotion-view {
            padding: 12px;
          }
          
          .show-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .show-stats {
            align-items: flex-start;
            width: 100%;
          }
          
          .promotion-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
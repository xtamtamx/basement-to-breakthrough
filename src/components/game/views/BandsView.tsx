import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Genre, TraitType } from '@game/types';
import { haptics } from '@utils/mobile';
import { BandUpgradeModal } from '../BandUpgradeModal';
import { synergySystemV2 } from '@game/mechanics/SynergySystemV2';
import { useGameStore } from '@stores/gameStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { BandCard } from '@components/ui/BandCard';

export const BandsView: React.FC = () => {
  const { allBands, rosterBandIds, addBandToRoster, removeBandFromRoster } = useGameStore();
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'roster'>('all');
  const [upgradeModalBand, setUpgradeModalBand] = useState<Band | null>(null);

  const handleAddToRoster = (bandId: string) => {
    if (!rosterBandIds.includes(bandId)) {
      addBandToRoster(bandId);
      haptics.success();
    }
  };

  const handleRemoveFromRoster = (bandId: string) => {
    removeBandFromRoster(bandId);
    haptics.light();
  };

  const filteredBands = allBands.filter(band => {
    if (filter === 'roster') return rosterBandIds.includes(band.id);
    if (filter === 'available') return !rosterBandIds.includes(band.id);
    return true;
  });

  return (
    <div className="bands-view">
      {/* Main Content */}
      <div className="view-content">
        {/* Filter Buttons */}
        <div className="filter-panel">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Bands
          </Button>
          <Button
            variant={filter === 'roster' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('roster')}
          >
            Roster ({rosterBandIds.length})
          </Button>
          <Button
            variant={filter === 'available' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('available')}
          >
            Available
          </Button>
        </div>
        {/* Band Grid */}
        <div className="band-grid">
          <AnimatePresence>
            {filteredBands.map(band => (
              <motion.div
                key={band.id}
                className="band-card-wrapper"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <BandCard 
                  band={band} 
                  selected={selectedBand?.id === band.id}
                  onSelect={() => setSelectedBand(band)}
                />
                {/* Roster Badge */}
                {rosterBandIds.includes(band.id) && (
                  <div className="roster-badge">ROSTER</div>
                )}
                {/* Real Artist Badge */}
                {band.isRealArtist && (
                  <div className="real-badge">REAL</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedBand && (
            <motion.div
              className="detail-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card variant="punk" glow>
                <div className="band-header">
                  <div className="band-avatar">
                    {selectedBand.genre === Genre.PUNK ? '🎸' : '🤘'}
                  </div>
                  <div className="band-info">
                    <h2 className="band-name">{selectedBand.name}</h2>
                    <div className="band-meta">
                      {selectedBand.genre} • {selectedBand.hometown}
                    </div>
                    {selectedBand.formedYear && (
                      <div className="band-formed">
                        Formed {selectedBand.formedYear}
                      </div>
                    )}
                  </div>
                </div>

                {selectedBand.bio && (
                  <p className="band-bio">{selectedBand.bio}</p>
                )}

                {/* Stats */}
                <div className="stats-section">
                  <h3 className="section-title">Stats</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Popularity</div>
                      <div className="stat-bar">
                        <div className="stat-bar-track">
                          <div 
                            className="stat-bar-fill punk"
                            style={{ width: `${selectedBand.popularity}%` }}
                          />
                        </div>
                        <span className="stat-value">{selectedBand.popularity}</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Authenticity</div>
                      <div className="stat-bar">
                        <div className="stat-bar-track">
                          <div 
                            className="stat-bar-fill success"
                            style={{ width: `${selectedBand.authenticity}%` }}
                          />
                        </div>
                        <span className="stat-value">{selectedBand.authenticity}</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Energy</div>
                      <div className="stat-bar">
                        <div className="stat-bar-track">
                          <div 
                            className="stat-bar-fill warning"
                            style={{ width: `${selectedBand.energy}%` }}
                          />
                        </div>
                        <span className="stat-value">{selectedBand.energy}</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Technical Skill</div>
                      <div className="stat-bar">
                        <div className="stat-bar-track">
                          <div 
                            className="stat-bar-fill info"
                            style={{ width: `${selectedBand.technicalSkill}%` }}
                          />
                        </div>
                        <span className="stat-value">{selectedBand.technicalSkill}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Traits */}
                {selectedBand.traits.length > 0 && (
                  <div className="traits-section">
                    <h3 className="section-title">Traits</h3>
                    <div className="traits-list">
                      {selectedBand.traits.map(trait => (
                        <motion.div
                          key={trait.id}
                          className="trait-item"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="trait-name">{trait.name}</div>
                          <div className="trait-description">{trait.description}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                  {rosterBandIds.includes(selectedBand.id) ? (
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => handleRemoveFromRoster(selectedBand.id)}
                      icon="❌"
                    >
                      Remove from Roster
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      fullWidth
                      onClick={() => handleAddToRoster(selectedBand.id)}
                      icon="✅"
                    >
                      Add to Roster
                    </Button>
                  )}
                  
                  {rosterBandIds.includes(selectedBand.id) && synergySystemV2.getBandUpgrades(selectedBand.id).length > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => setUpgradeModalBand(selectedBand)}
                      icon="⬆️"
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Upgrade Modal */}
      {upgradeModalBand && (
        <BandUpgradeModal
          band={upgradeModalBand}
          isOpen={true}
          onClose={() => setUpgradeModalBand(null)}
        />
      )}

      <style jsx>{`
        .bands-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .filter-panel {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .view-content {
          flex: 1;
          display: flex;
          gap: 24px;
          padding: 64px 24px 24px;
          overflow: hidden;
          position: relative;
          min-height: 0; /* Allow flex children to shrink */
        }

        .band-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          align-content: start;
          overflow-y: auto;
          padding-right: 8px;
          position: relative;
          min-height: 0; /* Important for flex child scrolling */
          max-height: 100%;
        }

        /* Custom scrollbar for band grid */
        .band-grid::-webkit-scrollbar {
          width: 8px;
        }

        .band-grid::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 4px;
        }

        .band-grid::-webkit-scrollbar-thumb {
          background: var(--border-light);
          border-radius: 4px;
        }

        .band-grid::-webkit-scrollbar-thumb:hover {
          background: var(--punk-magenta);
        }

        .band-card-wrapper {
          position: relative;
          height: fit-content;
        }

        .roster-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--success-green);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          pointer-events: none;
        }

        .real-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--info-purple);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          pointer-events: none;
        }

        .detail-panel {
          width: 380px;
          overflow-y: auto;
        }

        .band-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .band-avatar {
          width: 80px;
          height: 80px;
          background: var(--bg-tertiary);
          border: 2px solid var(--punk-magenta);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          flex-shrink: 0;
        }

        .band-info {
          flex: 1;
        }

        .band-name {
          margin: 0 0 4px;
          font-size: 24px;
          font-weight: 700;
          color: var(--punk-magenta);
        }

        .band-meta {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .band-formed {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .band-bio {
          margin: 0 0 20px;
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 14px;
        }

        .stats-section,
        .traits-section {
          margin-bottom: 24px;
        }

        .section-title {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--punk-magenta);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .stat-bar {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-bar-track {
          flex: 1;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }

        .stat-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width var(--transition-base);
        }

        .stat-bar-fill.punk {
          background: var(--punk-magenta);
        }

        .stat-bar-fill.success {
          background: var(--success-green);
        }

        .stat-bar-fill.warning {
          background: var(--warning-amber);
        }

        .stat-bar-fill.info {
          background: var(--info-purple);
        }

        .stat-value {
          font-size: 14px;
          font-weight: 700;
          min-width: 30px;
          text-align: right;
        }

        .traits-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trait-item {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .trait-item:hover {
          border-color: var(--punk-magenta);
          background: var(--bg-hover);
        }

        .trait-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .trait-description {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .view-content {
            flex-direction: column;
          }

          .detail-panel {
            width: 100%;
          }

          .band-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};
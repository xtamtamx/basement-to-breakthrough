import React from 'react';
import { motion } from 'framer-motion';
import { Venue, VenueType } from '@game/types';
import { Card } from './Card';
import { haptics } from '@utils/mobile';

interface VenueCardProps {
  venue: Venue;
  onSelect?: () => void;
  selected?: boolean;
  interactive?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({ 
  venue, 
  onSelect, 
  selected = false,
  interactive = true 
}) => {
  const venueIcons: Record<VenueType, string> = {
    [VenueType.BASEMENT]: '🏠',
    [VenueType.GARAGE]: '🚗',
    [VenueType.HOUSE_SHOW]: '🏡',
    [VenueType.DIY_SPACE]: '🎨',
    [VenueType.DIVE_BAR]: '🍺',
    [VenueType.PUNK_CLUB]: '🎸',
    [VenueType.METAL_VENUE]: '🤘',
    [VenueType.WAREHOUSE]: '🏭',
    [VenueType.UNDERGROUND]: '🚇',
    [VenueType.THEATER]: '🎭',
    [VenueType.CONCERT_HALL]: '🎼',
    [VenueType.ARENA]: '🏟️',
    [VenueType.FESTIVAL_GROUNDS]: '🎪',
  };

  const handleClick = () => {
    if (onSelect && interactive) {
      haptics.light();
      onSelect();
    }
  };

  return (
    <motion.div
      className={`venue-card ${selected ? 'selected' : ''} ${interactive ? 'interactive' : ''}`}
      onClick={handleClick}
      whileHover={interactive ? { scale: 1.02, y: -4 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {/* Venue Icon */}
      <div className="venue-icon">
        {venueIcons[venue.type] || '🏢'}
      </div>

      {/* Venue Info */}
      <div className="venue-info">
        <h3 className="venue-name">{venue.name}</h3>
        <div className="venue-district">{venue.location.name}</div>
      </div>

      {/* Stats Grid */}
      <div className="venue-stats">
        <div className="stat">
          <span className="stat-label">CAP</span>
          <span className="stat-value">{venue.capacity}</span>
        </div>
        <div className="stat">
          <span className="stat-label">AUTH</span>
          <span className="stat-value">{venue.authenticity}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">RENT</span>
          <span className="stat-value">${venue.rent}</span>
        </div>
        <div className="stat">
          <span className="stat-label">BAR</span>
          <span className="stat-value">{venue.hasBar ? '✓' : '✗'}</span>
        </div>
      </div>

      {/* Venue Traits */}
      {venue.traits && venue.traits.length > 0 && (
        <div className="venue-traits">
          {venue.traits.map(trait => (
            <span 
              key={trait.id}
              className={`trait-badge ${trait.type.toLowerCase()}`}
              title={trait.description}
            >
              {trait.name}
            </span>
          ))}
        </div>
      )}

      {/* Special Features */}
      <div className="venue-features">
        {venue.hasStage && <span className="feature-badge">Stage</span>}
        {venue.hasBar && <span className="feature-badge bar">Bar</span>}
        {venue.acoustics >= 80 && <span className="feature-badge premium">Premium Sound</span>}
      </div>

      {/* Upgrades */}
      {venue.upgrades && venue.upgrades.length > 0 && (
        <div className="venue-upgrades">
          {venue.upgrades.map((upgrade) => (
            <span 
              key={upgrade.id} 
              className={`upgrade-pip tier-${upgrade.tier}`} 
              title={upgrade.name}
            />
          ))}
        </div>
      )}

      {selected && (
        <motion.div
          className="selected-glow"
          layoutId="selectedVenue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <style jsx>{`
        .venue-card {
          position: relative;
          background: var(--bg-card);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all var(--transition-base);
          overflow: hidden;
        }

        .venue-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(236, 72, 153, 0.1) 0%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity var(--transition-base);
          pointer-events: none;
        }

        .venue-card.interactive:hover::before {
          opacity: 1;
        }

        .venue-card.selected {
          border-color: var(--punk-magenta);
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, var(--bg-card) 100%);
        }

        .venue-icon {
          font-size: 36px;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .venue-info {
          margin-bottom: 16px;
        }

        .venue-name {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .venue-district {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .venue-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 12px 0;
          border-top: 1px solid var(--border-default);
          border-bottom: 1px solid var(--border-default);
        }

        .stat {
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .venue-traits {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .trait-badge {
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: help;
          transition: all var(--transition-fast);
        }

        .trait-badge.atmosphere {
          background: rgba(236, 72, 153, 0.2);
          color: var(--punk-magenta);
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .trait-badge.technical {
          background: rgba(139, 92, 246, 0.2);
          color: var(--info-purple);
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .trait-badge.social {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success-green);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .trait-badge.legendary {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .trait-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .venue-features {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .feature-badge {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .feature-badge.bar {
          background: var(--success-emerald);
          color: white;
        }

        .feature-badge.premium {
          background: var(--warning-amber);
          color: white;
        }

        .venue-upgrades {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
        }

        .upgrade-pip {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--info-purple);
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.6);
          cursor: help;
        }

        .upgrade-pip.tier-1 {
          background: var(--success-green);
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }

        .upgrade-pip.tier-2 {
          background: var(--info-purple);
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.6);
        }

        .upgrade-pip.tier-3 {
          background: var(--warning-amber);
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
        }

        .selected-glow {
          position: absolute;
          inset: -2px;
          border: 2px solid var(--punk-magenta);
          border-radius: 12px;
          pointer-events: none;
          box-shadow: 
            0 0 20px rgba(236, 72, 153, 0.5),
            inset 0 0 20px rgba(236, 72, 153, 0.1);
        }

        @media (max-width: 768px) {
          .venue-card {
            padding: 12px;
          }

          .venue-icon {
            font-size: 28px;
          }

          .venue-name {
            font-size: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { Band, Genre } from '@game/types';
import { Card } from './Card';
import { haptics } from '@utils/mobile';

interface BandCardProps {
  band: Band;
  onSelect?: () => void;
  selected?: boolean;
  interactive?: boolean;
}

export const BandCard: React.FC<BandCardProps> = ({ 
  band, 
  onSelect, 
  selected = false,
  interactive = true 
}) => {
  const genreColors: Record<Genre, string> = {
    [Genre.PUNK]: 'var(--punk-magenta)',
    [Genre.METAL]: 'var(--metal-red)',
    [Genre.HARDCORE]: 'var(--punk-pink)',
    [Genre.EMO]: 'var(--info-purple)',
    [Genre.INDIE]: 'var(--warning-amber)',
    [Genre.ALTERNATIVE]: 'var(--success-green)',
    [Genre.EXPERIMENTAL]: 'var(--info-violet)',
  };

  const genreGradients: Record<Genre, string> = {
    [Genre.PUNK]: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, transparent 100%)',
    [Genre.METAL]: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, transparent 100%)',
    [Genre.HARDCORE]: 'linear-gradient(135deg, rgba(255, 0, 110, 0.2) 0%, transparent 100%)',
    [Genre.EMO]: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, transparent 100%)',
    [Genre.INDIE]: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, transparent 100%)',
    [Genre.ALTERNATIVE]: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, transparent 100%)',
    [Genre.EXPERIMENTAL]: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, transparent 100%)',
  };

  const handleClick = () => {
    if (onSelect && interactive) {
      haptics.light();
      onSelect();
    }
  };

  return (
    <motion.div
      className={`band-card ${selected ? 'selected' : ''} ${interactive ? 'interactive' : ''}`}
      onClick={handleClick}
      whileHover={interactive ? { scale: 1.05, rotateZ: -2 } : undefined}
      whileTap={interactive ? { scale: 0.95, rotateZ: 0 } : undefined}
      style={{
        background: genreGradients[band.genre],
        borderColor: selected ? genreColors[band.genre] : 'var(--border-default)',
      }}
    >
      {/* Polaroid-style image */}
      <div className="band-image">
        <div className="image-placeholder" style={{ background: genreColors[band.genre] }}>
          <div className="band-icon-wrapper">
            <span className="genre-icon">
              {band.genre === Genre.PUNK && '🎸'}
              {band.genre === Genre.METAL && '🤘'}
              {band.genre === Genre.HARDCORE && '💀'}
              {band.genre === Genre.EMO && '🖤'}
              {band.genre === Genre.INDIE && '🎵'}
              {band.genre === Genre.ALTERNATIVE && '🎶'}
              {band.genre === Genre.EXPERIMENTAL && '🎛️'}
            </span>
            <span className="band-abbreviation">{band.name.split(' ').map(w => w[0]).join('').slice(0, 3)}</span>
          </div>
        </div>
      </div>

      {/* Band info */}
      <div className="band-info">
        <h3 className="band-name" title={band.name}>{band.name}</h3>
        <div className="band-genre" style={{ color: genreColors[band.genre] }}>
          {band.genre}
        </div>
      </div>

      {/* Stats */}
      <div className="band-stats">
        <div className="stat">
          <span className="stat-icon">⚡</span>
          <span className="stat-value">{band.hype}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{band.fanBase}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">🎸</span>
          <span className="stat-value">{band.skillLevel}</span>
        </div>
      </div>

      {/* Upgrades */}
      {band.upgrades && band.upgrades.length > 0 && (
        <div className="band-upgrades">
          {band.upgrades.map((upgrade, i) => (
            <span key={i} className="upgrade-dot" title={upgrade} />
          ))}
        </div>
      )}

      {selected && (
        <motion.div
          className="selected-indicator"
          layoutId="selectedBand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <style jsx>{`
        .band-card {
          position: relative;
          background: var(--bg-card);
          border: 3px solid var(--border-default);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all var(--transition-base);
          transform-origin: center bottom;
        }

        .band-card.selected {
          box-shadow: 0 0 30px currentColor;
        }

        .band-image {
          aspect-ratio: 1;
          background: white;
          padding: 8px;
          margin-bottom: 16px;
          border-radius: 4px;
          transform: rotate(-1deg);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .image-placeholder::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .band-icon-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 1;
        }

        .genre-icon {
          font-size: 32px;
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
        }

        .band-abbreviation {
          font-size: 14px;
          font-weight: 900;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .band-info {
          margin-bottom: 12px;
        }

        .band-name {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.2;
          min-height: 38px;
        }

        .band-genre {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .band-stats {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 0;
          border-top: 1px solid var(--border-default);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-icon {
          font-size: 14px;
          opacity: 0.7;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .band-upgrades {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
        }

        .upgrade-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--info-purple);
          box-shadow: 0 0 4px rgba(139, 92, 246, 0.5);
        }

        .selected-indicator {
          position: absolute;
          inset: -3px;
          border: 3px solid currentColor;
          border-radius: 8px;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .band-card {
            padding: 12px;
          }

          .genre-icon {
            font-size: 24px;
          }

          .band-abbreviation {
            font-size: 12px;
          }

          .band-name {
            font-size: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
};
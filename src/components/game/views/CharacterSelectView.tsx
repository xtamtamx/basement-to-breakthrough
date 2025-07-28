import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PunkSprite, MetalSprite, IndieSprite } from '@components/graphics/PixelArtSprites';
import { PixelPanel } from '@components/ui/PixelPanel';
import { PixelButton } from '@components/ui/PixelButton';
import { haptics } from '@utils/mobile';

interface CharacterType {
  id: string;
  name: string;
  description: string;
  sprite: React.FC<{ pixelSize?: number; className?: string }>;
  stats: {
    credibility: number;
    networking: number;
    hustle: number;
    creativity: number;
  };
  perks: string[];
  drawbacks: string[];
}

const CHARACTERS: CharacterType[] = [
  {
    id: 'punk',
    name: 'Punk Promoter',
    description: 'Started booking shows in basements, never stopped',
    sprite: PunkSprite,
    stats: {
      credibility: 90,
      networking: 60,
      hustle: 80,
      creativity: 70,
    },
    perks: [
      'Basement venues cost 50% less',
      'DIY bands trust you more',
      'Police heat rises slower',
    ],
    drawbacks: [
      'Corporate venues suspicious',
      'Bank loans harder to get',
      'Professional bands skeptical',
    ],
  },
  {
    id: 'metal',
    name: 'Metal Manager',
    description: 'Forged in the fires of underground metal',
    sprite: MetalSprite,
    stats: {
      credibility: 80,
      networking: 70,
      hustle: 90,
      creativity: 60,
    },
    perks: [
      'Metal bands perform better',
      'Equipment costs reduced',
      'Sound quality improved',
    ],
    drawbacks: [
      'Indie bands less interested',
      'All-ages shows harder',
      'Higher insurance costs',
    ],
  },
  {
    id: 'indie',
    name: 'Indie Impresario',
    description: 'Curating vibes since before it was cool',
    sprite: IndieSprite,
    stats: {
      credibility: 70,
      networking: 90,
      hustle: 60,
      creativity: 80,
    },
    perks: [
      'Social media reach doubled',
      'Art venues more available',
      'Hipster crowd attracted',
    ],
    drawbacks: [
      'Punk bands mock you',
      'Higher venue costs',
      'Gentrification accelerated',
    ],
  },
];

interface CharacterSelectViewProps {
  onSelect: (characterId: string) => void;
}

export const CharacterSelectView: React.FC<CharacterSelectViewProps> = ({ onSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);

  const handleSelect = (character: CharacterType) => {
    setSelectedCharacter(character);
    haptics.light();
  };

  const handleConfirm = () => {
    if (selectedCharacter) {
      haptics.success();
      onSelect(selectedCharacter.id);
    }
  };

  return (
    <div className="character-select-view">
      <motion.div 
        className="select-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="pixel-title">Choose Your Path</h1>
        <p className="pixel-subtitle">Every promoter has a story...</p>
      </motion.div>

      <div className="character-grid">
        {CHARACTERS.map((character, index) => {
          const Sprite = character.sprite;
          const isSelected = selectedCharacter?.id === character.id;
          const isHovered = hoveredCharacter === character.id;

          return (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <PixelPanel
                variant={isSelected ? 'punk' : 'default'}
                glow={isSelected}
                border
                className={`character-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => handleSelect(character)}
                onMouseEnter={() => setHoveredCharacter(character.id)}
                onMouseLeave={() => setHoveredCharacter(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="character-sprite">
                  <Sprite pixelSize={6} />
                </div>
                
                <h3 className="character-name">{character.name}</h3>
                <p className="character-description">{character.description}</p>
                
                <div className="character-stats">
                  <div className="stat-bar">
                    <span className="stat-label">CRED</span>
                    <div className="stat-fill" style={{ width: `${character.stats.credibility}%` }} />
                  </div>
                  <div className="stat-bar">
                    <span className="stat-label">NET</span>
                    <div className="stat-fill" style={{ width: `${character.stats.networking}%` }} />
                  </div>
                  <div className="stat-bar">
                    <span className="stat-label">HSTL</span>
                    <div className="stat-fill" style={{ width: `${character.stats.hustle}%` }} />
                  </div>
                  <div className="stat-bar">
                    <span className="stat-label">CRTV</span>
                    <div className="stat-fill" style={{ width: `${character.stats.creativity}%` }} />
                  </div>
                </div>
              </PixelPanel>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCharacter && (
          <motion.div
            className="character-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <PixelPanel variant="dialog" border>
              <h3>{selectedCharacter.name} Details</h3>
              
              <div className="perks-drawbacks">
                <div className="perks">
                  <h4>+ Perks</h4>
                  <ul>
                    {selectedCharacter.perks.map((perk, i) => (
                      <li key={i}>{perk}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="drawbacks">
                  <h4>- Drawbacks</h4>
                  <ul>
                    {selectedCharacter.drawbacks.map((drawback, i) => (
                      <li key={i}>{drawback}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="action-buttons">
                <PixelButton
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedCharacter(null)}
                >
                  Back
                </PixelButton>
                <PixelButton
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                >
                  Start Game
                </PixelButton>
              </div>
            </PixelPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .character-select-view {
          min-height: 100vh;
          background: #0A0A0A;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .select-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .pixel-title {
          font-family: monospace;
          font-size: 48px;
          font-weight: 700;
          color: #FF0066;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 16px;
          text-shadow: 
            2px 2px 0px #8B0000,
            4px 4px 0px #000;
        }

        .pixel-subtitle {
          font-family: monospace;
          font-size: 18px;
          color: #8B8B8B;
          margin: 0;
        }

        .character-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 1000px;
          width: 100%;
          margin-bottom: 32px;
        }

        .character-card {
          cursor: pointer;
          transition: all 200ms ease;
          padding: 24px !important;
        }

        .character-card.selected {
          transform: translateY(-4px);
        }

        .character-sprite {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          height: 96px;
          align-items: center;
        }

        .character-name {
          font-family: monospace;
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 8px;
          text-align: center;
        }

        .character-description {
          font-family: monospace;
          font-size: 12px;
          color: #8B8B8B;
          margin: 0 0 16px;
          text-align: center;
          font-style: italic;
        }

        .character-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-bar {
          position: relative;
          height: 16px;
          background: #1A1A1A;
          border: 2px solid #2D2D2D;
          display: flex;
          align-items: center;
        }

        .stat-label {
          position: absolute;
          left: 4px;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          color: #FFFFFF;
          z-index: 2;
          text-shadow: 1px 1px 0px #000;
        }

        .stat-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF0066 0%, #FF3380 100%);
          transition: width 300ms ease;
          box-shadow: inset -2px -2px 0px rgba(0,0,0,0.5);
        }

        .character-details {
          max-width: 600px;
          width: 100%;
        }

        .character-details h3 {
          font-family: monospace;
          font-size: 24px;
          font-weight: 700;
          color: #FF0066;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 24px;
          text-align: center;
        }

        .perks-drawbacks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .perks h4, .drawbacks h4 {
          font-family: monospace;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .perks h4 {
          color: #00FF00;
        }

        .drawbacks h4 {
          color: #FF0000;
        }

        .perks ul, .drawbacks ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .perks li, .drawbacks li {
          font-family: monospace;
          font-size: 12px;
          margin-bottom: 8px;
          padding-left: 16px;
          position: relative;
        }

        .perks li {
          color: #FFFFFF;
        }

        .perks li::before {
          content: '+';
          position: absolute;
          left: 0;
          color: #00FF00;
          font-weight: 700;
        }

        .drawbacks li {
          color: #8B8B8B;
        }

        .drawbacks li::before {
          content: '-';
          position: absolute;
          left: 0;
          color: #FF0000;
          font-weight: 700;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .character-select-view {
            padding: 20px 16px;
          }

          .pixel-title {
            font-size: 32px;
          }

          .pixel-subtitle {
            font-size: 14px;
          }

          .character-grid {
            grid-template-columns: 1fr;
          }

          .perks-drawbacks {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
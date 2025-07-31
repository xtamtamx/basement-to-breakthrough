import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { BaseSprite } from '../graphics/PixelArtSprites';

interface ProceduralCityMapProps {
  onDistrictClick?: (districtId: string) => void;
  selectedDistrict?: string;
}

// City tile types for procedural generation
const TILE_TYPES = {
  ROAD_H: 'road_h',
  ROAD_V: 'road_v',
  ROAD_CROSS: 'road_cross',
  BUILDING_SMALL: 'building_small',
  BUILDING_MEDIUM: 'building_medium',
  BUILDING_LARGE: 'building_large',
  PARK: 'park',
  EMPTY: 'empty',
};

// Pixel art tiles (8x8 each)
const TILE_SPRITES = {
  road_h: [
    'GGGGGGGG',
    'GGGGGGGG',
    'YYYYYYYY',
    'WWWWWWWW',
    'WWWWWWWW',
    'YYYYYYYY',
    'GGGGGGGG',
    'GGGGGGGG',
  ],
  road_v: [
    'GGYYWWYG',
    'GGYYWWYG',
    'GGYYWWYG',
    'GGYYWWYG',
    'GGYYWWYG',
    'GGYYWWYG',
    'GGYYWWYG',
    'GGYYWWYG',
  ],
  road_cross: [
    'GGYYWWYG',
    'GGYYWWYG',
    'YYYYYYYY',
    'WWWWWWWW',
    'WWWWWWWW',
    'YYYYYYYY',
    'GGYYWWYG',
    'GGYYWWYG',
  ],
  building_small: [
    'BBBBBBBB',
    'BWWWWWWB',
    'BWWWWWWB',
    'BWWWWWWB',
    'BWWWWWWB',
    'BWWWWWWB',
    'BBBBBBBB',
    'DDDDDDDD',
  ],
  building_medium: [
    'PPPPPPPP',
    'PWWPWWPP',
    'PWWPWWPP',
    'PPPPPPPP',
    'PWWPWWPP',
    'PWWPWWPP',
    'PPPPPPPP',
    'DDDDDDDD',
  ],
  building_large: [
    'MMMMMMMM',
    'MWWMWWMM',
    'MWWMWWMM',
    'MMMMMMMM',
    'MWWMWWMM',
    'MWWMWWMM',
    'MMMMMMMM',
    'DDDDDDDD',
  ],
  park: [
    'GGGGGGGG',
    'GTTGTTGG',
    'GTTGTTGG',
    'GGGGGGGG',
    'GGTTTTGG',
    'GTTTTTTG',
    'GGTTTTGG',
    'GGGGGGGG',
  ],
  empty: [
    'GGGGGGGG',
    'GGGGGGGG',
    'GGGGGGGG',
    'GGGGGGGG',
    'GGGGGGGG',
    'GGGGGGGG',
    'GGGGGGGG',
    'GGGGGGGG',
  ],
};

const DISTRICT_DATA = [
  {
    id: 'eastside',
    name: 'Eastside',
    x: 10,
    y: 15,
    width: 12,
    height: 10,
    color: '#E91E63',
    description: 'DIY venues & house shows',
  },
  {
    id: 'downtown',
    name: 'Downtown',
    x: 25,
    y: 20,
    width: 15,
    height: 12,
    color: '#3498DB',
    description: 'Corporate venues & clubs',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    x: 5,
    y: 30,
    width: 20,
    height: 8,
    color: '#FF6F00',
    description: 'Warehouses & underground spots',
  },
  {
    id: 'university',
    name: 'University',
    x: 30,
    y: 5,
    width: 10,
    height: 10,
    color: '#8B6914',
    description: 'Student venues & cafes',
  },
];

export const ProceduralCityMap: React.FC<ProceduralCityMapProps> = ({
  onDistrictClick,
  selectedDistrict,
}) => {
  useGameStore();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [cityGrid, setCityGrid] = useState<string[][]>([]);

  // Generate procedural city grid
  useEffect(() => {
    const width = 50;
    const height = 50;
    const grid: string[][] = [];

    // Initialize with empty tiles
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = TILE_TYPES.EMPTY;
      }
    }

    // Add main roads
    // Horizontal roads every 8 tiles
    for (let y = 8; y < height; y += 8) {
      for (let x = 0; x < width; x++) {
        if (x % 8 === 0 && y % 8 === 0) {
          grid[y][x] = TILE_TYPES.ROAD_CROSS;
        } else {
          grid[y][x] = TILE_TYPES.ROAD_H;
        }
      }
    }

    // Vertical roads every 8 tiles
    for (let x = 8; x < width; x += 8) {
      for (let y = 0; y < height; y++) {
        if (grid[y][x] === TILE_TYPES.ROAD_H) {
          grid[y][x] = TILE_TYPES.ROAD_CROSS;
        } else if (grid[y][x] === TILE_TYPES.EMPTY) {
          grid[y][x] = TILE_TYPES.ROAD_V;
        }
      }
    }

    // Add buildings
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === TILE_TYPES.EMPTY) {
          const rand = Math.random();
          if (rand < 0.4) {
            grid[y][x] = TILE_TYPES.BUILDING_SMALL;
          } else if (rand < 0.6) {
            grid[y][x] = TILE_TYPES.BUILDING_MEDIUM;
          } else if (rand < 0.7) {
            grid[y][x] = TILE_TYPES.BUILDING_LARGE;
          } else if (rand < 0.75) {
            grid[y][x] = TILE_TYPES.PARK;
          }
        }
      }
    }

    setCityGrid(grid);
  }, []);

  const tileColorMap = {
    'G': '#2D3436', // Dark gray (ground)
    'Y': '#FFD700', // Yellow (road lines)
    'W': '#636E72', // Gray (road)
    'B': '#74B9FF', // Blue (building)
    'P': '#E17055', // Pink (building)
    'M': '#A29BFE', // Purple (building)
    'T': '#00B894', // Green (trees)
    'D': '#2D3436', // Dark (shadows)
  };

  return (
    <div className="procedural-city-container">
      <div className="city-header">
        <h2 className="city-title">🌃 CITY OVERVIEW 🌃</h2>
        <p className="city-subtitle">Click a district to zoom in</p>
      </div>

      <div className="city-viewport">
        <svg 
          viewBox="0 0 400 400" 
          className="city-svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Render city tiles */}
          {cityGrid.map((row, y) => 
            row.map((tileType, x) => {
              if (x >= 50 || y >= 50) return null; // Bounds check
              const sprite = TILE_SPRITES[tileType as keyof typeof TILE_SPRITES];
              if (!sprite) return null;
              
              return (
                <g key={`${x}-${y}`} transform={`translate(${x * 8}, ${y * 8})`}>
                  <BaseSprite
                    data={sprite}
                    pixelSize={1}
                    colorMap={tileColorMap}
                  />
                </g>
              );
            })
          )}

          {/* Render districts overlay */}
          {DISTRICT_DATA.map((district) => (
            <motion.g
              key={district.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* District boundary */}
              <motion.rect
                x={district.x * 8}
                y={district.y * 8}
                width={district.width * 8}
                height={district.height * 8}
                fill={district.color}
                fillOpacity={hoveredDistrict === district.id ? 0.3 : 0.15}
                stroke={district.color}
                strokeWidth={selectedDistrict === district.id ? 3 : 2}
                strokeDasharray={selectedDistrict === district.id ? "0" : "4,2"}
                className="district-area"
                whileHover={{ fillOpacity: 0.3 }}
                onClick={() => onDistrictClick?.(district.id)}
                onMouseEnter={() => setHoveredDistrict(district.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* District label */}
              <text
                x={district.x * 8 + district.width * 4}
                y={district.y * 8 + district.height * 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                style={{ 
                  pointerEvents: 'none',
                  textShadow: '0 0 4px rgba(0,0,0,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {district.name}
              </text>
            </motion.g>
          ))}

          {/* Scene indicators */}
          <g className="scene-indicators">
            {/* Add pulsing dots for active venues */}
            {DISTRICT_DATA.map((district, i) => {
              if (i >= 3) return null; // Show max 3 venue indicators
              const x = district.x * 8 + Math.random() * district.width * 8;
              const y = district.y * 8 + Math.random() * district.height * 8;
              return (
                <motion.circle
                  key={`venue-${i}`}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="#FFD700"
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              );
            })}
          </g>
        </svg>

        {/* District info panel */}
        {hoveredDistrict && (
          <motion.div
            className="district-hover-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {(() => {
              const district = DISTRICT_DATA.find(d => d.id === hoveredDistrict);
              if (!district) return null;
              return (
                <>
                  <h3 style={{ color: district.color }}>{district.name}</h3>
                  <p>{district.description}</p>
                </>
              );
            })()}
          </motion.div>
        )}
      </div>

      <div className="city-stats">
        <div className="stat">
          <span className="label">Active Venues</span>
          <span className="value">{3}</span>
        </div>
        <div className="stat">
          <span className="label">Scene Health</span>
          <span className="value">{75}%</span>
        </div>
        <div className="stat">
          <span className="label">Gentrification</span>
          <span className="value danger">{25}%</span>
        </div>
      </div>

      <style>{`
        .procedural-city-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 10px;
          background: #0A0A0A;
          overflow: hidden;
        }

        .city-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .city-title {
          font-size: 24px;
          font-weight: bold;
          color: #E91E63;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .city-subtitle {
          font-size: 12px;
          color: #636E72;
          margin: 4px 0 0 0;
        }

        .city-viewport {
          flex: 1;
          position: relative;
          background: #1A1A1A;
          border: 2px solid #333;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        .city-svg {
          width: 100%;
          height: 100%;
          max-width: min(100%, 600px);
          max-height: min(100%, 600px);
        }

        .district-hover-info {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid currentColor;
          border-radius: 8px;
          padding: 12px 20px;
          pointer-events: none;
        }

        .district-hover-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .district-hover-info p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #B2BEC3;
        }

        .city-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 10px;
          padding: 10px;
          background: #1A1A1A;
          border: 1px solid #333;
          border-radius: 8px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat .label {
          font-size: 11px;
          color: #636E72;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat .value {
          font-size: 20px;
          font-weight: bold;
          color: #10B981;
        }

        .stat .value.danger {
          color: #EF4444;
        }
      `}</style>
    </div>
  );
};
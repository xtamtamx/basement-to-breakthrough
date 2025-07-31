import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DistrictType } from '@/game/types/core';

interface PixelCityGridProps {
  onDistrictClick?: (districtId: string, districtInfo: { name: string; type: DistrictType }) => void;
  selectedDistrict?: string;
}

// Pixel art patterns for different districts
const PIXEL_PATTERNS = {
  downtown: [
    ['#4A5568', '#718096', '#4A5568', '#718096'],
    ['#2D3748', '#4A5568', '#2D3748', '#4A5568'],
    ['#4A5568', '#718096', '#4A5568', '#718096'],
    ['#2D3748', '#4A5568', '#2D3748', '#4A5568'],
  ],
  warehouse: [
    ['#7F1D1D', '#991B1B', '#7F1D1D', '#991B1B'],
    ['#991B1B', '#7F1D1D', '#991B1B', '#7F1D1D'],
    ['#7F1D1D', '#991B1B', '#7F1D1D', '#991B1B'],
    ['#991B1B', '#7F1D1D', '#991B1B', '#7F1D1D'],
  ],
  college: [
    ['#065F46', '#047857', '#065F46', '#047857'],
    ['#047857', '#065F46', '#047857', '#065F46'],
    ['#065F46', '#047857', '#065F46', '#047857'],
    ['#047857', '#065F46', '#047857', '#065F46'],
  ],
  residential: [
    ['#92400E', '#B45309', '#92400E', '#B45309'],
    ['#B45309', '#92400E', '#B45309', '#92400E'],
    ['#92400E', '#B45309', '#92400E', '#B45309'],
    ['#B45309', '#92400E', '#B45309', '#92400E'],
  ],
  arts: [
    ['#5B21B6', '#6D28D9', '#5B21B6', '#6D28D9'],
    ['#6D28D9', '#5B21B6', '#6D28D9', '#5B21B6'],
    ['#5B21B6', '#6D28D9', '#5B21B6', '#6D28D9'],
    ['#6D28D9', '#5B21B6', '#6D28D9', '#5B21B6'],
  ],
};

// Building sprites for each district type
const BUILDING_SPRITES = {
  downtown: [
    '  ████  ',
    ' ██████ ',
    '████████',
    '██□□██□□',
    '████████',
    '██□□██□□',
    '████████',
    '████████',
  ],
  warehouse: [
    '████████',
    '█▄▄▄▄▄▄█',
    '████████',
    '█      █',
    '█      █',
    '████████',
    '██    ██',
    '████████',
  ],
  college: [
    '   ██   ',
    '  ████  ',
    ' ██████ ',
    '████████',
    '██□██□██',
    '████████',
    '██□██□██',
    '████████',
  ],
  residential: [
    '   ▲▲   ',
    '  ████  ',
    ' ██████ ',
    '██□██□██',
    '████████',
    '██□██□██',
    '████  ██',
    '████████',
  ],
  arts: [
    '  ◆◆◆◆  ',
    ' ██████ ',
    '████████',
    '██◯◯◯◯██',
    '████████',
    '██◯◯◯◯██',
    '████████',
    '████████',
  ],
};

const DISTRICTS = [
  { id: 'downtown', type: 'downtown' as DistrictType, name: 'Downtown', color: '#3B82F6', x: 0, y: 0, width: 2, height: 1.5 },
  { id: 'warehouse', type: 'warehouse' as DistrictType, name: 'Warehouse', color: '#EF4444', x: 2, y: 0, width: 2, height: 1.5 },
  { id: 'college', type: 'college' as DistrictType, name: 'College', color: '#10B981', x: 0, y: 1.5, width: 1.5, height: 1.5 },
  { id: 'residential', type: 'residential' as DistrictType, name: 'Residential', color: '#F59E0B', x: 1.5, y: 1.5, width: 1.5, height: 1.5 },
  { id: 'arts', type: 'arts' as DistrictType, name: 'Arts', color: '#8B5CF6', x: 3, y: 1.5, width: 1, height: 1.5 },
];

export const PixelCityGrid: React.FC<PixelCityGridProps> = ({
  onDistrictClick,
  selectedDistrict,
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const cellSize = 60;
  const gridWidth = 4;
  const gridHeight = 3;
  const pixelSize = 4;
  
  const renderPixelArt = (district: typeof DISTRICTS[0]) => {
    const pattern = PIXEL_PATTERNS[district.type];
    const building = BUILDING_SPRITES[district.type];
    const pixels = [];
    
    // Render tiled background pattern
    const tilesX = Math.ceil((district.width * cellSize) / (pattern[0].length * pixelSize));
    const tilesY = Math.ceil((district.height * cellSize) / (pattern.length * pixelSize));
    
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        for (let y = 0; y < pattern.length; y++) {
          for (let x = 0; x < pattern[y].length; x++) {
            const px = district.x * cellSize + tx * pattern[0].length * pixelSize + x * pixelSize;
            const py = district.y * cellSize + ty * pattern.length * pixelSize + y * pixelSize;
            
            if (px < (district.x + district.width) * cellSize && 
                py < (district.y + district.height) * cellSize) {
              pixels.push(
                <rect
                  key={`bg-${tx}-${ty}-${x}-${y}`}
                  x={px}
                  y={py}
                  width={pixelSize}
                  height={pixelSize}
                  fill={pattern[y][x]}
                  opacity={0.3}
                />
              );
            }
          }
        }
      }
    }
    
    // Render buildings
    const buildingScale = 3;
    const buildingsPerRow = Math.floor((district.width * cellSize) / (8 * buildingScale * pixelSize));
    const buildingRows = Math.floor((district.height * cellSize) / (8 * buildingScale * pixelSize));
    
    for (let row = 0; row < buildingRows; row++) {
      for (let col = 0; col < buildingsPerRow; col++) {
        const buildingX = district.x * cellSize + col * 8 * buildingScale * pixelSize + 10;
        const buildingY = district.y * cellSize + row * 8 * buildingScale * pixelSize + 10;
        
        building.forEach((line, y) => {
          [...line].forEach((char, x) => {
            let color = '#000000';
            let opacity = 1;
            
            switch(char) {
              case '█': color = district.type === 'downtown' ? '#4A5568' : 
                              district.type === 'warehouse' ? '#7F1D1D' :
                              district.type === 'college' ? '#065F46' :
                              district.type === 'residential' ? '#92400E' :
                              '#5B21B6'; break;
              case '□': color = '#FFD700'; opacity = 0.8; break;
              case '▄': color = '#374151'; break;
              case '▲': color = '#DC2626'; break;
              case '◆': color = '#8B5CF6'; break;
              case '◯': color = '#F3F4F6'; opacity = 0.7; break;
              case ' ': return; // Use return instead of continue in forEach
            }
            
            pixels.push(
              <rect
                key={`building-${row}-${col}-${x}-${y}`}
                x={buildingX + x * buildingScale * pixelSize}
                y={buildingY + y * buildingScale * pixelSize}
                width={buildingScale * pixelSize}
                height={buildingScale * pixelSize}
                fill={color}
                opacity={opacity}
              />
            );
          });
        });
      }
    }
    
    return pixels;
  };
  
  const renderStreetLights = () => {
    const lights = [];
    const lightSpacing = 120;
    
    // Horizontal streets
    for (let x = lightSpacing / 2; x < gridWidth * cellSize; x += lightSpacing) {
      lights.push(
        <g key={`light-h1-${x}`}>
          <rect x={x - 2} y={cellSize * 1.5 - 4} width={4} height={8} fill="#4B5563" />
          <circle cx={x} cy={cellSize * 1.5 - 8} r={4} fill="#FCD34D" opacity={0.8} />
        </g>
      );
    }
    
    // Vertical streets
    for (let y = lightSpacing / 2; y < gridHeight * cellSize; y += lightSpacing) {
      lights.push(
        <g key={`light-v1-${y}`}>
          <rect x={cellSize * 2 - 4} y={y - 2} width={8} height={4} fill="#4B5563" />
          <circle cx={cellSize * 2 - 8} cy={y} r={4} fill="#FCD34D" opacity={0.8} />
        </g>
      );
    }
    
    return lights;
  };
  
  return (
    <div className="pixel-city-container">
      <svg 
        viewBox={`0 0 ${gridWidth * cellSize} ${gridHeight * cellSize}`}
        className="city-svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Dark background */}
        <rect width={gridWidth * cellSize} height={gridHeight * cellSize} fill="#0F0F0F" />
        
        {/* Starry sky effect */}
        {Array.from({ length: 20 }).map((_, i) => (
          <circle
            key={`star-${i}`}
            cx={Math.random() * gridWidth * cellSize}
            cy={Math.random() * gridHeight * cellSize}
            r={Math.random() * 2}
            fill="#FFF"
            opacity={Math.random() * 0.5 + 0.2}
          />
        ))}
        
        {/* Streets with pixelated edges */}
        <g opacity={0.8}>
          <rect x={cellSize * 2 - 8} y={0} width={16} height={gridHeight * cellSize} fill="#1F2937" />
          <rect x={0} y={cellSize * 1.5 - 8} width={gridWidth * cellSize} height={16} fill="#1F2937" />
          
          {/* Street markings */}
          {Array.from({ length: Math.ceil(gridHeight * cellSize / 20) }).map((_, i) => (
            <rect
              key={`marking-v-${i}`}
              x={cellSize * 2 - 2}
              y={i * 20 + 5}
              width={4}
              height={10}
              fill="#F59E0B"
              opacity={0.6}
            />
          ))}
          {Array.from({ length: Math.ceil(gridWidth * cellSize / 20) }).map((_, i) => (
            <rect
              key={`marking-h-${i}`}
              x={i * 20 + 5}
              y={cellSize * 1.5 - 2}
              width={10}
              height={4}
              fill="#F59E0B"
              opacity={0.6}
            />
          ))}
        </g>
        
        {/* Districts with pixel art */}
        {DISTRICTS.map((district) => {
          const isHovered = hoveredDistrict === district.id;
          const isSelected = selectedDistrict === district.id;
          
          return (
            <g key={district.id}>
              {/* District background */}
              <rect
                x={district.x * cellSize}
                y={district.y * cellSize}
                width={district.width * cellSize}
                height={district.height * cellSize}
                fill={district.color}
                fillOpacity={0.1}
              />
              
              {/* Pixel art content */}
              {renderPixelArt(district)}
              
              {/* Interactive overlay */}
              <motion.rect
                x={district.x * cellSize + 2}
                y={district.y * cellSize + 2}
                width={district.width * cellSize - 4}
                height={district.height * cellSize - 4}
                fill="transparent"
                stroke={district.color}
                strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                strokeOpacity={isHovered || isSelected ? 1 : 0.5}
                rx={4}
                className="cursor-pointer"
                initial={{ strokeDasharray: "0 0" }}
                animate={{ strokeDasharray: isSelected ? "0 0" : "8 4" }}
                whileHover={{ strokeDasharray: "0 0" }}
                onClick={() => onDistrictClick?.(district.id, {
                  id: district.id,
                  type: district.type,
                  cells: [],
                  bounds: { minX: district.x, minY: district.y, maxX: district.x + district.width - 1, maxY: district.y + district.height - 1 },
                  center: { x: district.x + district.width / 2, y: district.y + district.height / 2 },
                  neighbors: [],
                  color: district.color
                })}
                onMouseEnter={() => setHoveredDistrict(district.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
              />
              
              {/* District label with pixel font style */}
              <text
                x={district.x * cellSize + district.width * cellSize / 2}
                y={district.y * cellSize + district.height * cellSize - 10}
                textAnchor="middle"
                fill="white"
                fontSize={10}
                fontFamily="monospace"
                fontWeight="bold"
                className="pointer-events-none select-none"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                }}
              >
                {district.name}
              </text>
            </g>
          );
        })}
        
        {/* Street lights */}
        {renderStreetLights()}
        
        {/* Animated neon sign in arts district */}
        <motion.g
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect x={cellSize * 3 + 10} y={cellSize * 2} width={30} height={20} fill="#E11D48" rx={2} />
          <text
            x={cellSize * 3 + 25}
            y={cellSize * 2 + 13}
            textAnchor="middle"
            fill="white"
            fontSize={8}
            fontFamily="monospace"
            fontWeight="bold"
          >
            LIVE
          </text>
        </motion.g>
      </svg>
      
      {/* Hover info with pixel border */}
      {hoveredDistrict && (
        <motion.div
          className="district-info-popup"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {(() => {
            const district = DISTRICTS.find(d => d.id === hoveredDistrict);
            return district ? (
              <>
                <h3>{district.name}</h3>
                <p>Click to explore</p>
              </>
            ) : null;
          })()}
        </motion.div>
      )}
      
      <style>{`
        .pixel-city-container {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          box-sizing: border-box;
          background: #000;
        }
        
        .city-svg {
          width: 100%;
          height: 100%;
          max-width: 600px;
          max-height: 100%;
          display: block;
          margin: 0 auto;
          border: 4px solid #1F2937;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        
        .district-info-popup {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #1F2937;
          border: 2px solid;
          border-image: linear-gradient(45deg, #3B82F6, #8B5CF6) 1;
          padding: 8px 16px;
          pointer-events: none;
          font-family: monospace;
        }
        
        .district-info-popup h3 {
          margin: 0;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          color: #F3F4F6;
        }
        
        .district-info-popup p {
          margin: 2px 0 0 0;
          font-size: 10px;
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};
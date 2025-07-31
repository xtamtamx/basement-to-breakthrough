import React, { useState } from 'react';
import { DistrictType } from '@/game/types/core';

interface SimplePixelCityProps {
  onDistrictClick?: (districtId: string, districtInfo: { name: string; type: DistrictType }) => void;
  selectedDistrict?: string;
}

const DISTRICTS = [
  { id: 'downtown', type: 'downtown' as DistrictType, name: 'Downtown', color: '#4A90E2', x: 0, y: 0, width: 2, height: 1.5 },
  { id: 'warehouse', type: 'warehouse' as DistrictType, name: 'Warehouse', color: '#E24444', x: 2, y: 0, width: 2, height: 1.5 },
  { id: 'college', type: 'college' as DistrictType, name: 'College', color: '#2ECC71', x: 0, y: 1.5, width: 1.5, height: 1.5 },
  { id: 'residential', type: 'residential' as DistrictType, name: 'Residential', color: '#F39C12', x: 1.5, y: 1.5, width: 1.5, height: 1.5 },
  { id: 'arts', type: 'arts' as DistrictType, name: 'Arts', color: '#9B59B6', x: 3, y: 1.5, width: 1, height: 1.5 },
];

export const SimplePixelCity: React.FC<SimplePixelCityProps> = ({
  onDistrictClick,
  selectedDistrict,
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const cellSize = 60;
  const gridWidth = 4;
  const gridHeight = 3;
  
  const renderBuilding = (x: number, y: number, width: number, height: number, color: string) => {
    const windows = [];
    const windowSize = 4;
    const windowGap = 3;
    
    // Create window grid
    for (let wy = 1; wy < height / (windowSize + windowGap) - 1; wy++) {
      for (let wx = 1; wx < width / (windowSize + windowGap) - 1; wx++) {
        const windowX = x + wx * (windowSize + windowGap) + windowGap;
        const windowY = y + wy * (windowSize + windowGap) + windowGap;
        
        windows.push(
          <rect
            key={`window-${wx}-${wy}`}
            x={windowX}
            y={windowY}
            width={windowSize}
            height={windowSize}
            fill={Math.random() > 0.3 ? '#FFEB3B' : '#2C3E50'}
          />
        );
      }
    }
    
    return (
      <g>
        {/* Building base */}
        <rect x={x} y={y} width={width} height={height} fill={color} />
        {/* Building shadow */}
        <rect x={x} y={y + height - 3} width={width} height={3} fill="#000" opacity={0.3} />
        {/* Windows */}
        {windows}
      </g>
    );
  };
  
  const renderDistrict = (district: typeof DISTRICTS[0]) => {
    const buildings = [];
    const districtX = district.x * cellSize;
    const districtY = district.y * cellSize;
    
    // Different building layouts per district type
    switch (district.type) {
      case 'downtown':
        // Tall buildings
        buildings.push(renderBuilding(districtX + 10, districtY + 20, 25, 60, '#34495E'));
        buildings.push(renderBuilding(districtX + 40, districtY + 10, 30, 70, '#2C3E50'));
        buildings.push(renderBuilding(districtX + 75, districtY + 25, 20, 55, '#34495E'));
        break;
        
      case 'warehouse':
        // Wide, low buildings
        buildings.push(renderBuilding(districtX + 10, districtY + 40, 40, 30, '#7F1D1D'));
        buildings.push(renderBuilding(districtX + 55, districtY + 35, 45, 35, '#8B0000'));
        break;
        
      case 'college':
        // Medium buildings with character
        buildings.push(renderBuilding(districtX + 10, districtY + 30, 25, 40, '#27AE60'));
        buildings.push(renderBuilding(districtX + 40, districtY + 35, 30, 35, '#229954'));
        break;
        
      case 'residential':
        // Small houses
        buildings.push(renderBuilding(districtX + 10, districtY + 45, 20, 25, '#E67E22'));
        buildings.push(renderBuilding(districtX + 35, districtY + 40, 20, 30, '#D35400'));
        buildings.push(renderBuilding(districtX + 60, districtY + 45, 20, 25, '#E67E22'));
        break;
        
      case 'arts':
        // Quirky buildings
        buildings.push(renderBuilding(districtX + 5, districtY + 35, 25, 35, '#8E44AD'));
        buildings.push(renderBuilding(districtX + 35, districtY + 40, 20, 30, '#9B59B6'));
        break;
    }
    
    return buildings;
  };
  
  return (
    <div className="pixel-city-container">
      <svg 
        viewBox={`0 0 ${gridWidth * cellSize} ${gridHeight * cellSize}`}
        className="city-svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Sky background */}
        <rect width={gridWidth * cellSize} height={gridHeight * cellSize} fill="#1A1A2E" />
        
        {/* Simple stars */}
        {Array.from({ length: 15 }).map((_, i) => (
          <circle
            key={`star-${i}`}
            cx={Math.random() * gridWidth * cellSize}
            cy={Math.random() * gridHeight * cellSize * 0.6}
            r={1}
            fill="#FFF"
            opacity={Math.random() * 0.8 + 0.2}
          />
        ))}
        
        {/* Ground */}
        <rect 
          x={0} 
          y={gridHeight * cellSize - 20} 
          width={gridWidth * cellSize} 
          height={20} 
          fill="#2C3E50" 
        />
        
        {/* Streets - simple lines */}
        <line 
          x1={cellSize * 2} 
          y1={0} 
          x2={cellSize * 2} 
          y2={gridHeight * cellSize} 
          stroke="#34495E" 
          strokeWidth={8} 
        />
        <line 
          x1={0} 
          y1={cellSize * 1.5} 
          x2={gridWidth * cellSize} 
          y2={cellSize * 1.5} 
          stroke="#34495E" 
          strokeWidth={8} 
        />
        
        {/* Districts */}
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
                fill="transparent"
                stroke={isHovered || isSelected ? district.color : 'transparent'}
                strokeWidth={isSelected ? 3 : 2}
                strokeDasharray={isSelected ? "0" : "5,5"}
                opacity={0.5}
                className="cursor-pointer"
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
              
              {/* Buildings */}
              {renderDistrict(district)}
              
              {/* District name */}
              <text
                x={district.x * cellSize + district.width * cellSize / 2}
                y={district.y * cellSize + 15}
                textAnchor="middle"
                fill="white"
                fontSize={10}
                fontFamily="monospace"
                fontWeight="bold"
                className="pointer-events-none"
                style={{ textTransform: 'uppercase' }}
              >
                {district.name}
              </text>
            </g>
          );
        })}
      </svg>
      
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
        }
        
        .city-svg {
          width: 100%;
          height: 100%;
          max-width: 600px;
          max-height: 100%;
          display: block;
          margin: 0 auto;
          border: 2px solid #34495E;
          background: #0F0F0F;
        }
      `}</style>
    </div>
  );
};
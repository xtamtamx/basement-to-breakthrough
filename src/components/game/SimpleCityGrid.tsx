import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DistrictType } from '@/game/types/core';

interface DistrictInfo {
  id: string;
  type: DistrictType;
  cells: never[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  center: { x: number; y: number };
  dominantType: DistrictType;
  stats: {
    sceneStrength: number;
    gentrificationLevel: number;
    policePresence: number;
    rentMultiplier: number;
  };
}

interface SimpleCityGridProps {
  onDistrictClick?: (districtId: string, districtInfo: DistrictInfo) => void;
  selectedDistrict?: string;
}

const DISTRICTS = [
  { id: 'downtown', type: 'downtown' as DistrictType, name: 'Downtown', color: '#3B82F6', x: 0, y: 0, width: 2, height: 1.5 },
  { id: 'warehouse', type: 'warehouse' as DistrictType, name: 'Warehouse', color: '#EF4444', x: 2, y: 0, width: 2, height: 1.5 },
  { id: 'college', type: 'college' as DistrictType, name: 'College', color: '#10B981', x: 0, y: 1.5, width: 1.5, height: 1.5 },
  { id: 'residential', type: 'residential' as DistrictType, name: 'Residential', color: '#F59E0B', x: 1.5, y: 1.5, width: 1.5, height: 1.5 },
  { id: 'arts', type: 'arts' as DistrictType, name: 'Arts', color: '#8B5CF6', x: 3, y: 1.5, width: 1, height: 1.5 },
];

export const SimpleCityGrid: React.FC<SimpleCityGridProps> = ({
  onDistrictClick,
  selectedDistrict,
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const cellSize = 60;
  const gridWidth = 4;
  const gridHeight = 3;
  
  return (
    <div className="simple-city-container">
      <svg 
        viewBox={`0 0 ${gridWidth * cellSize} ${gridHeight * cellSize}`}
        className="city-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width={gridWidth * cellSize} height={gridHeight * cellSize} fill="#0A0A0A" />
        
        {/* Grid lines */}
        <g opacity={0.1}>
          {Array.from({ length: gridWidth + 1 }).map((_, x) => (
            <line
              key={`v-${x}`}
              x1={x * cellSize}
              y1={0}
              x2={x * cellSize}
              y2={gridHeight * cellSize}
              stroke="#1F2937"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: gridHeight + 1 }).map((_, y) => (
            <line
              key={`h-${y}`}
              x1={0}
              y1={y * cellSize}
              x2={gridWidth * cellSize}
              y2={y * cellSize}
              stroke="#1F2937"
              strokeWidth={1}
            />
          ))}
        </g>
        
        {/* Districts */}
        {DISTRICTS.map((district) => {
          const isHovered = hoveredDistrict === district.id;
          const isSelected = selectedDistrict === district.id;
          
          return (
            <g key={district.id}>
              <motion.rect
                x={district.x * cellSize + 2}
                y={district.y * cellSize + 2}
                width={district.width * cellSize - 4}
                height={district.height * cellSize - 4}
                fill={district.color}
                fillOpacity={isHovered ? 0.5 : 0.3}
                stroke={district.color}
                strokeWidth={isSelected ? 3 : 2}
                strokeOpacity={isHovered || isSelected ? 1 : 0.7}
                rx={8}
                className="cursor-pointer"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: DISTRICTS.indexOf(district) * 0.1 }}
                whileHover={{ scale: 1.02 }}
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
              
              {/* District label */}
              <text
                x={district.x * cellSize + district.width * cellSize / 2}
                y={district.y * cellSize + district.height * cellSize / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={14}
                fontWeight="bold"
                className="pointer-events-none select-none"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textShadow: '0 0 4px rgba(0,0,0,0.8)'
                }}
              >
                {district.name}
              </text>
              
              {/* Mini icons */}
              <text
                x={district.x * cellSize + 10}
                y={district.y * cellSize + 20}
                fontSize={16}
                className="pointer-events-none"
                opacity={0.7}
              >
                {district.type === 'downtown' && '🏢'}
                {district.type === 'warehouse' && '🏭'}
                {district.type === 'college' && '🎓'}
                {district.type === 'residential' && '🏘️'}
                {district.type === 'arts' && '🎨'}
              </text>
            </g>
          );
        })}
        
        {/* Roads between districts */}
        <g opacity={0.2}>
          <line x1={cellSize * 2} y1={0} x2={cellSize * 2} y2={gridHeight * cellSize} stroke="#374151" strokeWidth={2} />
          <line x1={cellSize * 4} y1={0} x2={cellSize * 4} y2={gridHeight * cellSize} stroke="#374151" strokeWidth={2} />
          <line x1={0} y1={cellSize * 2} x2={gridWidth * cellSize} y2={cellSize * 2} stroke="#374151" strokeWidth={2} />
        </g>
      </svg>
      
      {/* Hover info */}
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
                <h3 style={{ color: district.color }}>{district.name}</h3>
                <p>Click to explore</p>
              </>
            ) : null;
          })()}
        </motion.div>
      )}
      
      <style>{`
        .simple-city-container {
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
        }
        
        .district-info-popup {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid currentColor;
          border-radius: 8px;
          padding: 8px 16px;
          pointer-events: none;
        }
        
        .district-info-popup h3 {
          margin: 0;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .district-info-popup p {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};
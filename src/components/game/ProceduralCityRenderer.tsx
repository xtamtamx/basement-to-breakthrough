import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CityGenerator, GeneratedCity, DistrictInfo } from '@/game/generation/CityGenerator';
import { DistrictType } from '@/game/types/core';

interface ProceduralCityRendererProps {
  onDistrictClick?: (districtId: string, districtInfo: DistrictInfo) => void;
  selectedDistrict?: string;
  showLabels?: boolean;
  interactive?: boolean;
}

// District visual styles
const DISTRICT_STYLES: Record<DistrictType, {
  fillColor: string;
  strokeColor: string;
  pattern?: string;
  opacity: number;
}> = {
  downtown: {
    fillColor: '#1E3A8A',
    strokeColor: '#60A5FA',
    pattern: 'grid',
    opacity: 0.4
  },
  warehouse: {
    fillColor: '#7F1D1D',
    strokeColor: '#F87171',
    pattern: 'brick',
    opacity: 0.4
  },
  college: {
    fillColor: '#064E3B',
    strokeColor: '#34D399',
    pattern: 'dots',
    opacity: 0.4
  },
  residential: {
    fillColor: '#78350F',
    strokeColor: '#FBBF24',
    pattern: 'hatch',
    opacity: 0.4
  },
  arts: {
    fillColor: '#4C1D95',
    strokeColor: '#A78BFA',
    pattern: 'cross',
    opacity: 0.4
  }
};

// Street styles
const STREET_STYLES = {
  main: { width: 2, color: '#1F2937', dash: [] },
  secondary: { width: 1.5, color: '#374151', dash: [4, 2] },
  alley: { width: 1, color: '#4B5563', dash: [2, 2] }
};

export const ProceduralCityRenderer: React.FC<ProceduralCityRendererProps> = ({
  onDistrictClick,
  selectedDistrict,
  showLabels = true,
  interactive = true
}) => {
  const [city, setCity] = useState<GeneratedCity | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate city on mount
  useEffect(() => {
    const generator = new CityGenerator(30, 20); // Smaller for better mobile display
    const generatedCity = generator.generateCity();
    setCity(generatedCity);
  }, []);

  // Create path for district boundaries - simplified version
  const getDistrictPath = (district: DistrictInfo): string => {
    const cellSize = 10;
    const padding = 2;
    
    // Create a simple rectangular path based on bounds
    const minX = district.bounds.minX * cellSize - padding;
    const minY = district.bounds.minY * cellSize - padding;
    const maxX = (district.bounds.maxX + 1) * cellSize + padding;
    const maxY = (district.bounds.maxY + 1) * cellSize + padding;
    
    // Create rounded rectangle path
    const radius = 8;
    return `
      M ${minX + radius} ${minY}
      L ${maxX - radius} ${minY}
      Q ${maxX} ${minY} ${maxX} ${minY + radius}
      L ${maxX} ${maxY - radius}
      Q ${maxX} ${maxY} ${maxX - radius} ${maxY}
      L ${minX + radius} ${maxY}
      Q ${minX} ${maxY} ${minX} ${maxY - radius}
      L ${minX} ${minY + radius}
      Q ${minX} ${minY} ${minX + radius} ${minY}
      Z
    `;
  };

  // Render individual cells for a district
  const renderDistrictCells = (district: DistrictInfo) => {
    const cellSize = 10;
    const cells = [];
    const style = DISTRICT_STYLES[district.type];
    
    for (const cell of district.cells) {
      if (!cell.isStreet) {
        cells.push(
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x * cellSize + 0.5}
            y={cell.y * cellSize + 0.5}
            width={cellSize - 1}
            height={cellSize - 1}
            fill={style.fillColor}
            fillOpacity={style.opacity}
            stroke={style.fillColor}
            strokeWidth={0.5}
            strokeOpacity={0.2}
          />
        );
      }
    }
    
    return cells;
  };

  // Handle pan and zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    
    const startX = e.clientX - offset.x;
    const startY = e.clientY - offset.y;
    
    const handleMouseMove = (e: MouseEvent) => {
      setOffset({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!city) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Generating city...</p>
      </div>
    );
  }

  const cellSize = 10;
  const viewBox = `0 0 ${city.width * cellSize} ${city.height * cellSize}`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="max-w-full max-h-full"
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          cursor: interactive ? 'grab' : 'default'
        }}
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        {/* Define patterns */}
        <defs>
          {/* Grid pattern for downtown */}
          <pattern id="grid" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.2" />
          </pattern>
          
          {/* Brick pattern for warehouse */}
          <pattern id="brick" x="0" y="0" width="8" height="4" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="2" fill="#fff" opacity="0.1" />
            <rect x="4" y="2" width="4" height="2" fill="#fff" opacity="0.1" />
          </pattern>
          
          {/* Dots pattern for college */}
          <pattern id="dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1" fill="#fff" opacity="0.2" />
          </pattern>
          
          {/* Hatch pattern for residential */}
          <pattern id="hatch" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M0,4 L4,0" stroke="#fff" strokeWidth="0.5" opacity="0.2" />
          </pattern>
          
          {/* Cross pattern for arts */}
          <pattern id="cross" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M3,0 L3,6 M0,3 L6,3" stroke="#fff" strokeWidth="0.5" opacity="0.2" />
          </pattern>
        </defs>

        {/* Background */}
        <rect width={city.width * cellSize} height={city.height * cellSize} fill="#0A0A0A" />
        
        {/* Grid background */}
        <g opacity={0.1}>
          {Array.from({ length: city.width + 1 }).map((_, x) => (
            <line
              key={`vg-${x}`}
              x1={x * cellSize}
              y1={0}
              x2={x * cellSize}
              y2={city.height * cellSize}
              stroke="#1F2937"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: city.height + 1 }).map((_, y) => (
            <line
              key={`hg-${y}`}
              x1={0}
              y1={y * cellSize}
              x2={city.width * cellSize}
              y2={y * cellSize}
              stroke="#1F2937"
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* Render districts */}
        {Array.from(city.districts.values()).map(district => {
          const style = DISTRICT_STYLES[district.type];
          const isHovered = hoveredDistrict === district.id;
          const isSelected = selectedDistrict === district.id;
          
          return (
            <g key={district.id}>
              {/* Render individual cells */}
              {renderDistrictCells(district)}
              
              {/* District boundary outline */}
              <motion.path
                d={getDistrictPath(district)}
                fill="none"
                stroke={style.strokeColor}
                strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                strokeOpacity={isHovered || isSelected ? 1 : 0.7}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
                className={interactive ? "cursor-pointer" : ""}
                onClick={() => onDistrictClick?.(district.id, district)}
                onMouseEnter={() => setHoveredDistrict(district.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
                pointerEvents="stroke"
              />
              
              {/* District label */}
              {showLabels && (
                <g pointerEvents="none">
                  {/* Label background */}
                  <rect
                    x={district.center.x * cellSize - 40}
                    y={district.center.y * cellSize - 10}
                    width={80}
                    height={20}
                    fill="black"
                    fillOpacity={0.7}
                    rx={4}
                  />
                  <text
                    x={district.center.x * cellSize}
                    y={district.center.y * cellSize}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={12}
                    fontWeight="bold"
                    opacity={0.9}
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {district.type}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render streets - only main roads */}
        {city.streets
          .filter(street => street.type === 'main')
          .map((street, i) => {
            const style = STREET_STYLES[street.type];
            return (
              <line
                key={i}
                x1={street.start.x * cellSize}
                y1={street.start.y * cellSize}
                x2={street.end.x * cellSize}
                y2={street.end.y * cellSize}
                stroke={style.color}
                strokeWidth={style.width}
                strokeDasharray={style.dash.join(' ')}
                opacity={0.3}
              />
            );
          })}

        {/* Grid overlay for debugging */}
        {(
          <g opacity={0.1}>
            {city && Array.from({ length: city!.height + 1 }).map((_, y) => (
              <line
                key={`h-${y}`}
                x1={0}
                y1={y * cellSize}
                x2={city?.width ? city.width * cellSize : 0}
                y2={y * cellSize}
                stroke="white"
                strokeWidth={0.5}
              />
            ))}
            {city && Array.from({ length: city!.width + 1 }).map((_, x) => (
              <line
                key={`v-${x}`}
                x1={x * cellSize}
                y1={0}
                x2={x * cellSize}
                y2={city?.height ? city.height * cellSize : 0}
                stroke="white"
                strokeWidth={0.5}
              />
            ))}
          </g>
        )}
      </svg>

      {/* Controls */}
      {interactive && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
          >
            -
          </button>
          <button
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => setScale(1)}
          >
            Reset
          </button>
          <button
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
          >
            +
          </button>
        </div>
      )}

      {/* District info tooltip */}
      {hoveredDistrict && city.districts.has(hoveredDistrict) && (
        <motion.div
          className="absolute top-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-bold text-white capitalize">
            {city.districts.get(hoveredDistrict)!.type} District
          </h3>
          <p className="text-sm text-gray-400">
            Size: {city.districts.get(hoveredDistrict)!.cells.length} blocks
          </p>
          <p className="text-sm text-gray-400">
            Connected to: {city.districts.get(hoveredDistrict)!.neighbors.length} districts
          </p>
        </motion.div>
      )}
    </div>
  );
};
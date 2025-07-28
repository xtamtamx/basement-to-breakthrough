import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Location } from '@/game/types/core';
import { useGameStore } from '@/stores/gameStore';
import { BaseSprite, PIXEL_PALETTE } from '../graphics/PixelArtSprites';

interface CityPixelMapProps {
  selectedLocation?: string;
  onLocationSelect?: (locationId: string) => void;
  districtId?: string;
}

// Pixel art building sprites
const BUILDING_SPRITES = {
  coffee: [
    '    BBBB    ',
    '   BWWWWB   ',
    '  BWWWWWWB  ',
    '  BWCCCCWB  ',
    '  BWCWWCWB  ',
    '  BWCCCCWB  ',
    '  BBBDDDBBB ',
    '  B      B  ',
  ],
  warehouse: [
    '  GGGGGGGG  ',
    '  GWWWWWWG  ',
    '  GWGGGGWG  ',
    '  GWGGGGWG  ',
    '  GWWWWWWG  ',
    '  GGGGGGGG  ',
    '  GG DD GG  ',
  ],
  office: [
    '   BBBBBB   ',
    '  BWWWWWWB  ',
    '  BWBWBWBB  ',
    '  BWWWWWWB  ',
    '  BWBWBWBB  ',
    '  BWWWWWWB  ',
    '  BWBWBWBB  ',
    '  BBB  BBB  ',
  ],
  record: [
    '   RRRRRR   ',
    '  RWWWWWWR  ',
    '  RWRRRRWR  ',
    '  RWRDDRWR  ',
    '  RWRRRRWR  ',
    '  RRRDDRR   ',
    '  R     R   ',
  ],
  university: [
    '    OOOO    ',
    '   OWWWWO   ',
    '  OWWWWWWO  ',
    '  OWOOOOOWO ',
    '  OWWWWWWWO ',
    '  OOODDOOO  ',
    '  O      O  ',
  ],
  downtown: [
    '  PPPPPPPP  ',
    '  PWWPWWPP  ',
    '  PWWPWWPP  ',
    '  PPPPPPPP  ',
    '  PWWPWWPP  ',
    '  PWWPWWPP  ',
    '  PPP  PPP  ',
  ],
};

const CITY_DISTRICTS = [
  {
    id: 'coffee_district',
    name: 'Coffee District',
    sprite: 'coffee',
    x: 2,
    y: 2,
    jobs: ['☕ Barista'],
    venues: ['Cozy Cafe'],
    effect: '+Hipster Scene',
    effectColor: '#8B6914',
  },
  {
    id: 'warehouse_district',
    name: 'Warehouse',
    sprite: 'warehouse',
    x: 5,
    y: 3,
    jobs: ['📦 Warehouse'],
    venues: ['DIY Space'],
    effect: '+Underground',
    effectColor: '#FF1744',
  },
  {
    id: 'office_park',
    name: 'Office Park',
    sprite: 'office',
    x: 8,
    y: 2,
    jobs: ['💼 Office Job'],
    venues: [],
    effect: '-DIY Cred',
    effectColor: '#1976D2',
  },
  {
    id: 'record_row',
    name: 'Record Row',
    sprite: 'record',
    x: 3,
    y: 5,
    jobs: ['🎵 Record Store'],
    venues: ['All Ages Venue'],
    effect: '+Music Scene',
    effectColor: '#E91E63',
  },
  {
    id: 'university',
    name: 'University',
    sprite: 'university',
    x: 6,
    y: 1,
    jobs: ['📚 TA'],
    venues: ['Student Center'],
    effect: '+Youth Culture',
    effectColor: '#FF6F00',
  },
  {
    id: 'downtown',
    name: 'Downtown',
    sprite: 'downtown',
    x: 5,
    y: 6,
    jobs: ['🛍️ Retail'],
    venues: ['Music Hall'],
    effect: '+Mainstream',
    effectColor: '#7C4DFF',
  },
];

export const CityPixelMap: React.FC<CityPixelMapProps> = ({
  selectedLocation,
  onLocationSelect,
  districtId,
}) => {
  const { scene, venues } = useGameStore();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  
  // Filter districts to show only the selected one if districtId is provided
  const displayDistricts = districtId 
    ? CITY_DISTRICTS.filter(d => d.id === districtId)
    : CITY_DISTRICTS;

  // Color mappings for sprites
  const colorMaps = {
    coffee: {
      'B': '#8B4513', // Brown
      'W': '#FFEAA7', // Light yellow
      'C': '#6C5CE7', // Purple (coffee)
      'D': '#2D3436', // Dark gray (door)
      'G': '#636E72', // Gray
    },
    warehouse: {
      'G': '#636E72', // Gray
      'W': '#DFE6E9', // Light gray
      'D': '#2D3436', // Dark (door)
    },
    office: {
      'B': '#3498DB', // Blue
      'W': '#ECF0F1', // White windows
      'D': '#2D3436', // Dark
    },
    record: {
      'R': '#E91E63', // Pink
      'W': '#FFEAA7', // Light
      'D': '#2D3436', // Dark
    },
    university: {
      'O': '#FF6F00', // Orange
      'W': '#FFF3E0', // Light
      'D': '#2D3436', // Dark
    },
    downtown: {
      'P': '#7C4DFF', // Purple
      'W': '#E1BEE7', // Light purple
      'D': '#2D3436', // Dark
    },
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Pixel art background pattern */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gray-700"
            style={{
              left: `${(i % 10) * 10}%`,
              top: `${Math.floor(i / 10) * 20}%`,
            }}
          />
        ))}
      </div>

      <div className="relative h-full flex flex-col p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-pink-500 pixel-text">
            🏙️ UNDERGROUND CITY 🏙️
          </h2>
          <p className="text-xs text-gray-400 mt-1">Choose a district to explore</p>
        </div>

        {/* City Grid */}
        <div className={`flex-1 relative grid ${districtId ? 'grid-cols-5 grid-rows-4' : 'grid-cols-10 grid-rows-8'} gap-1 p-4 bg-gray-800 rounded-lg`}>
          {/* Grid lines */}
          {Array.from({ length: districtId ? 20 : 80 }).map((_, i) => {
            const cols = districtId ? 5 : 10;
            const x = i % cols;
            const y = Math.floor(i / cols);
            const hasDistrict = displayDistricts.some(d => d.x === x && d.y === y);
            
            return (
              <div
                key={i}
                className={`relative border ${hasDistrict ? 'border-gray-600' : 'border-gray-700'} rounded`}
              />
            );
          })}

          {/* Districts */}
          {displayDistricts.map((district) => (
            <motion.div
              key={district.id}
              className="absolute cursor-pointer"
              style={{
                left: districtId ? '40%' : `${district.x * 10}%`,
                top: districtId ? '35%' : `${district.y * 12.5}%`,
                width: districtId ? '20%' : '10%',
                height: districtId ? '30%' : '12.5%',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2, zIndex: 10 }}
              onClick={() => onLocationSelect?.(district.id)}
              onHoverStart={() => setHoveredDistrict(district.id)}
              onHoverEnd={() => setHoveredDistrict(null)}
            >
              {/* Building sprite */}
              <div className="relative w-full h-full flex items-center justify-center">
                <svg 
                  viewBox="0 0 48 32" 
                  className="w-full h-full"
                  style={{ imageRendering: 'pixelated' }}
                >
                  <BaseSprite
                    data={BUILDING_SPRITES[district.sprite]}
                    pixelSize={4}
                    colorMap={colorMaps[district.sprite]}
                  />
                </svg>
              </div>

              {/* Selection indicator */}
              {selectedLocation === district.id && (
                <div className="absolute inset-0 border-2 border-yellow-400 rounded animate-pulse" />
              )}
            </motion.div>
          ))}
          
          {/* Show additional details when zoomed in */}
          {districtId && (
            <>
              {/* Venues in this district */}
              {venues.filter(v => v.location?.id === districtId).map((venue, i) => (
                <motion.div
                  key={venue.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${20 + (i % 3) * 25}%`,
                    top: `${10 + Math.floor(i / 3) * 20}%`,
                    width: '15%',
                    height: '15%',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => onLocationSelect?.(venue.id)}
                >
                  <div className="w-full h-full bg-pink-600 rounded-lg border-2 border-pink-400 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎵</span>
                  </div>
                  <div className="absolute -bottom-6 left-0 right-0 text-center">
                    <span className="text-xs text-white bg-black bg-opacity-75 px-1 rounded">
                      {venue.name}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {/* Job locations */}
              {displayDistricts[0]?.jobs.map((job, i) => (
                <motion.div
                  key={`job-${i}`}
                  className="absolute"
                  style={{
                    left: `${60 + (i % 2) * 20}%`,
                    top: `${60 + Math.floor(i / 2) * 20}%`,
                    width: '15%',
                    height: '15%',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <div className="w-full h-full bg-green-600 rounded-lg border-2 border-green-400 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{job.split(' ')[0]}</span>
                  </div>
                  <div className="absolute -bottom-6 left-0 right-0 text-center">
                    <span className="text-xs text-white bg-black bg-opacity-75 px-1 rounded">
                      {job}
                    </span>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* District Info Panel */}
        {hoveredDistrict && (
          <motion.div
            className="absolute bottom-4 left-4 right-4 bg-gray-800 border-2 border-gray-600 rounded-lg p-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {(() => {
              const district = displayDistricts.find(d => d.id === hoveredDistrict);
              if (!district) return null;
              
              return (
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white pixel-text">
                    {district.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {district.jobs.length > 0 && (
                      <span className="bg-green-600 text-white px-2 py-1 rounded">
                        Jobs: {district.jobs.join(', ')}
                      </span>
                    )}
                    {district.venues.length > 0 && (
                      <span className="bg-pink-600 text-white px-2 py-1 rounded">
                        Venues: {district.venues.join(', ')}
                      </span>
                    )}
                    <span 
                      className="text-white px-2 py-1 rounded"
                      style={{ backgroundColor: district.effectColor }}
                    >
                      {district.effect}
                    </span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded" />
            <span className="text-gray-400">Jobs Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-pink-600 rounded" />
            <span className="text-gray-400">Venues</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded" />
            <span className="text-gray-400">Selected</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pixel-text {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  );
};
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BaseSprite, 
  AnimatedSprite,
  WalkerSprite,
  DiveBarSprite,
  WarehouseSprite,
  PIXEL_PALETTE
} from '../graphics/PixelArtSprites';

// Types for the city map
interface District {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'industrial' | 'downtown' | 'underground' | 'suburban';
  color: string;
}

interface Venue {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'dive_bar' | 'warehouse' | 'basement' | 'club';
  district: string;
  capacity: number;
}

interface Walker {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  type: 'punk' | 'metal' | 'indie';
}

interface PixelArtCityMapProps {
  venues?: Venue[];
  selectedDistrict?: string | null;
  selectedVenue?: string | null;
  onDistrictClick?: (districtId: string) => void;
  onVenueClick?: (venueId: string) => void;
  className?: string;
}

// Pixel art data for map elements
const BUILDING_SMALL: string[][] = [
  '    CCCCCCCCCC    '.split(''),
  '   CWWWWWWWWWWC   '.split(''),
  '  CWBBWWWWWWBBWC  '.split(''),
  '  CWBBWWWWWWBBWC  '.split(''),
  '  CWWWWWWWWWWWWC  '.split(''),
  '  CWBBWWWWWWBBWC  '.split(''),
  '  CWBBWWWWWWBBWC  '.split(''),
  '  CWWWWWWWWWWWWC  '.split(''),
  '  CCCCCCCCCCCCCCC '.split(''),
  '  CCCCCCCCCCCCCCC '.split(''),
];

const BUILDING_TALL: string[][] = [
  '   GGGGGGGGGG   '.split(''),
  '  GWWWWWWWWWWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWWWWWWWWWWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWWWWWWWWWWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWWWWWWWWWWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GWBBWWWWBBWG  '.split(''),
  '  GGGGGGGGGGGG  '.split(''),
  '  GGGGGGGGGGGG  '.split(''),
];

const FACTORY: string[][] = [
  'CCCCCCCCCCCCCCCCCCCC'.split(''),
  'CWWWWWWWWWWWWWWWWWWC'.split(''),
  'CWCCCCCCCCCCCCCCCCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCWC'.split(''),
  'CWWWWWWWWWWWWWWWWWWC'.split(''),
  'CCCCCPPPPCCCCCPPPPCC'.split(''),
  'CCCCCPSSPCCCCCPSSPCC'.split(''),
  'CCCCCPSSPCCCCCPSSPCC'.split(''),
  'CCCCCPPPPCCCCPPPPCC'.split(''),
];

const SMOKE_FRAME_1: string[][] = [
  '  S  '.split(''),
  ' SSS '.split(''),
  'SSSSS'.split(''),
  ' SSS '.split(''),
  '  S  '.split(''),
];

const SMOKE_FRAME_2: string[][] = [
  '   S '.split(''),
  '  SSS'.split(''),
  ' SSSS'.split(''),
  'SSS  '.split(''),
  ' S   '.split(''),
];

const ROAD_HORIZONTAL: string[][] = [
  'AAAAAAAAAAAAAAAA'.split(''),
  'AWWWWWWWWWWWWWWA'.split(''),
  'AYYYYYYYYYYYYYY A'.split(''),
  'AWWWWWWWWWWWWWWA'.split(''),
  'AAAAAAAAAAAAAAAA'.split(''),
];

const ROAD_VERTICAL: string[][] = [
  'AAWAA'.split(''),
  'AWYWA'.split(''),
  'AWYWA'.split(''),
  'AWYWA'.split(''),
  'AWYWA'.split(''),
  'AWYWA'.split(''),
  'AWYWA'.split(''),
  'AWYWA'.split(''),
  'AAWAA'.split(''),
];

const TREE: string[][] = [
  '  GGG  '.split(''),
  ' GGGGG '.split(''),
  'GGGGGGG'.split(''),
  ' GGGGG '.split(''),
  '  BBB  '.split(''),
  '  BBB  '.split(''),
];

// Color maps
const BUILDING_COLOR_MAP = {
  'C': PIXEL_PALETTE.concrete,
  'G': PIXEL_PALETTE.darkGray,
  'W': PIXEL_PALETTE.white,
  'B': PIXEL_PALETTE.black,
  'P': PIXEL_PALETTE.midGray,
  'S': PIXEL_PALETTE.lightGray,
};

const ROAD_COLOR_MAP = {
  'A': PIXEL_PALETTE.darkGray,
  'W': PIXEL_PALETTE.white,
  'Y': PIXEL_PALETTE.uiWarning,
};

const NATURE_COLOR_MAP = {
  'G': PIXEL_PALETTE.hairGreen,
  'B': PIXEL_PALETTE.hairBrown,
};

// City layout data
const DISTRICTS: District[] = [
  {
    id: 'industrial',
    name: 'Industrial Zone',
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    type: 'industrial',
    color: PIXEL_PALETTE.concrete
  },
  {
    id: 'downtown',
    name: 'Downtown',
    x: 400,
    y: 50,
    width: 350,
    height: 250,
    type: 'downtown',
    color: PIXEL_PALETTE.darkGray
  },
  {
    id: 'underground',
    name: 'Underground District',
    x: 50,
    y: 300,
    width: 350,
    height: 200,
    type: 'underground',
    color: PIXEL_PALETTE.leather
  },
  {
    id: 'suburban',
    name: 'Suburban Edge',
    x: 450,
    y: 350,
    width: 300,
    height: 150,
    type: 'suburban',
    color: PIXEL_PALETTE.midGray
  }
];

const VENUES: Venue[] = [
  { id: 'v1', name: 'The Pit', x: 150, y: 120, type: 'warehouse', district: 'industrial', capacity: 500 },
  { id: 'v2', name: 'Rust Factory', x: 250, y: 180, type: 'warehouse', district: 'industrial', capacity: 800 },
  { id: 'v3', name: 'Neon Nights', x: 500, y: 150, type: 'club', district: 'downtown', capacity: 300 },
  { id: 'v4', name: 'The Dive', x: 600, y: 200, type: 'dive_bar', district: 'downtown', capacity: 150 },
  { id: 'v5', name: 'Basement X', x: 150, y: 380, type: 'basement', district: 'underground', capacity: 100 },
  { id: 'v6', name: 'The Bunker', x: 280, y: 420, type: 'warehouse', district: 'underground', capacity: 600 },
  { id: 'v7', name: 'Garage 77', x: 550, y: 400, type: 'basement', district: 'suburban', capacity: 80 },
];

export const PixelArtCityMap: React.FC<PixelArtCityMapProps> = ({
  venues: propVenues,
  selectedDistrict,
  selectedVenue,
  onDistrictClick,
  onVenueClick,
  className = ''
}) => {
  const venuesToRender = propVenues || VENUES;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [smokeFrame, setSmokeFrame] = useState(0);

  // Initialize walkers
  useEffect(() => {
    const initialWalkers: Walker[] = Array.from({ length: 8 }, (_, i) => ({
      id: `walker-${i}`,
      x: Math.random() * 800,
      y: Math.random() * 600,
      targetX: Math.random() * 800,
      targetY: Math.random() * 600,
      speed: 0.5 + Math.random() * 1,
      type: ['punk', 'metal', 'indie'][Math.floor(Math.random() * 3)] as Walker['type']
    }));
    setWalkers(initialWalkers);
  }, []);

  // Animate walkers
  useEffect(() => {
    const interval = setInterval(() => {
      setWalkers(prevWalkers => prevWalkers.map(walker => {
        const dx = walker.targetX - walker.x;
        const dy = walker.targetY - walker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          // Reached target, set new target
          return {
            ...walker,
            targetX: Math.random() * 800,
            targetY: Math.random() * 600
          };
        }

        // Move towards target
        const moveX = (dx / distance) * walker.speed;
        const moveY = (dy / distance) * walker.speed;

        return {
          ...walker,
          x: walker.x + moveX,
          y: walker.y + moveY
        };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Animate smoke
  useEffect(() => {
    const interval = setInterval(() => {
      setSmokeFrame(prev => (prev + 1) % 2);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check district hover
    let foundDistrict = false;
    for (const district of DISTRICTS) {
      if (x >= district.x && x <= district.x + district.width &&
          y >= district.y && y <= district.y + district.height) {
        setHoveredDistrict(district.id);
        foundDistrict = true;
        break;
      }
    }
    if (!foundDistrict) setHoveredDistrict(null);

    // Check venue hover
    let foundVenue = false;
    for (const venue of venuesToRender) {
      const venueSize = 40;
      if (x >= venue.x - venueSize/2 && x <= venue.x + venueSize/2 &&
          y >= venue.y - venueSize/2 && y <= venue.y + venueSize/2) {
        setHoveredVenue(venue.id);
        foundVenue = true;
        break;
      }
    }
    if (!foundVenue) setHoveredVenue(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check venue click first (higher priority)
    for (const venue of venuesToRender) {
      const venueSize = 40;
      if (x >= venue.x - venueSize/2 && x <= venue.x + venueSize/2 &&
          y >= venue.y - venueSize/2 && y <= venue.y + venueSize/2) {
        onVenueClick?.(venue.id);
        return;
      }
    }

    // Then check district click
    for (const district of DISTRICTS) {
      if (x >= district.x && x <= district.x + district.width &&
          y >= district.y && y <= district.y + district.height) {
        onDistrictClick?.(district.id);
        return;
      }
    }
  };

  console.log('PixelArtCityMap rendering with venues:', venuesToRender);
  
  return (
    <div className={`relative bg-black p-4 rounded-lg ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-pointer"
        style={{ imageRendering: 'pixelated', maxWidth: '800px' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => {
          setHoveredDistrict(null);
          setHoveredVenue(null);
        }}
      />

      {/* District labels */}
      {DISTRICTS.map(district => (
        <div
          key={district.id}
          className="absolute pointer-events-none"
          style={{
            left: `${(district.x + district.width / 2) / 800 * 100}%`,
            top: `${(district.y - 20) / 600 * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className={`
            px-2 py-1 rounded text-xs font-mono
            ${hoveredDistrict === district.id || selectedDistrict === district.id
              ? 'bg-purple-800 text-white' 
              : 'bg-black/80 text-gray-300'}
          `}>
            {district.name}
          </div>
        </div>
      ))}

      {/* Venue tooltips */}
      {hoveredVenue && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${(venuesToRender.find(v => v.id === hoveredVenue)!.x) / 800 * 100}%`,
            top: `${(venuesToRender.find(v => v.id === hoveredVenue)!.y - 60) / 600 * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-black/90 border border-purple-600 rounded px-2 py-1">
            <div className="text-white text-sm font-mono">
              {venuesToRender.find(v => v.id === hoveredVenue)!.name}
            </div>
            <div className="text-gray-400 text-xs">
              Capacity: {venuesToRender.find(v => v.id === hoveredVenue)!.capacity}
            </div>
          </div>
        </div>
      )}

      {/* Render pixel art elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Roads */}
        <div style={{ position: 'absolute', left: '0', top: '270px' }}>
          <BaseSprite 
            data={ROAD_HORIZONTAL} 
            pixelSize={3} 
            colorMap={ROAD_COLOR_MAP}
          />
        </div>
        <div style={{ position: 'absolute', left: '370px', top: '0' }}>
          <BaseSprite 
            data={ROAD_VERTICAL} 
            pixelSize={3} 
            colorMap={ROAD_COLOR_MAP}
          />
        </div>

        {/* Industrial buildings and smoke */}
        <div style={{ position: 'absolute', left: '80px', top: '80px' }}>
          <BaseSprite 
            data={FACTORY} 
            pixelSize={3} 
            colorMap={BUILDING_COLOR_MAP}
          />
          <div style={{ position: 'absolute', left: '15px', top: '-20px' }}>
            <BaseSprite 
              data={smokeFrame === 0 ? SMOKE_FRAME_1 : SMOKE_FRAME_2} 
              pixelSize={3} 
              colorMap={{ 'S': PIXEL_PALETTE.lightGray }}
            />
          </div>
        </div>

        {/* Downtown tall buildings */}
        <div style={{ position: 'absolute', left: '450px', top: '80px' }}>
          <BaseSprite 
            data={BUILDING_TALL} 
            pixelSize={3} 
            colorMap={BUILDING_COLOR_MAP}
          />
        </div>
        <div style={{ position: 'absolute', left: '550px', top: '100px' }}>
          <BaseSprite 
            data={BUILDING_TALL} 
            pixelSize={3} 
            colorMap={BUILDING_COLOR_MAP}
          />
        </div>

        {/* Underground area buildings */}
        <div style={{ position: 'absolute', left: '100px', top: '350px' }}>
          <BaseSprite 
            data={BUILDING_SMALL} 
            pixelSize={3} 
            colorMap={BUILDING_COLOR_MAP}
          />
        </div>

        {/* Suburban trees */}
        <div style={{ position: 'absolute', left: '500px', top: '380px' }}>
          <BaseSprite 
            data={TREE} 
            pixelSize={3} 
            colorMap={NATURE_COLOR_MAP}
          />
        </div>
        <div style={{ position: 'absolute', left: '650px', top: '420px' }}>
          <BaseSprite 
            data={TREE} 
            pixelSize={3} 
            colorMap={NATURE_COLOR_MAP}
          />
        </div>

        {/* Venue sprites */}
        {venuesToRender.map(venue => (
          <div
            key={venue.id}
            style={{
              position: 'absolute',
              left: `${venue.x - 20}px`,
              top: `${venue.y - 20}px`,
              transform: selectedVenue === venue.id ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s'
            }}
          >
            {venue.type === 'warehouse' && <WarehouseSprite pixelSize={2} />}
            {venue.type === 'dive_bar' && <DiveBarSprite pixelSize={2} />}
            {venue.type === 'basement' && (
              <BaseSprite 
                data={BUILDING_SMALL} 
                pixelSize={2} 
                colorMap={BUILDING_COLOR_MAP}
              />
            )}
            {venue.type === 'club' && (
              <BaseSprite 
                data={BUILDING_SMALL} 
                pixelSize={2} 
                colorMap={{
                  ...BUILDING_COLOR_MAP,
                  'W': PIXEL_PALETTE.neon
                }}
              />
            )}
          </div>
        ))}

        {/* Animated walkers */}
        {walkers.map(walker => (
          <div
            key={walker.id}
            style={{
              position: 'absolute',
              left: `${walker.x}px`,
              top: `${walker.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <WalkerSprite 
              pixelSize={2} 
              colorMap={walker.type === 'punk' ? undefined : 
                       walker.type === 'metal' ? {
                         'B': PIXEL_PALETTE.black,
                         'G': PIXEL_PALETTE.hairBlack,
                         'S': PIXEL_PALETTE.skinLight,
                         'R': PIXEL_PALETTE.bloodRed,
                         'L': PIXEL_PALETTE.leather,
                         'J': PIXEL_PALETTE.black,
                         'W': PIXEL_PALETTE.white,
                       } : {
                         'B': PIXEL_PALETTE.hairBrown,
                         'G': PIXEL_PALETTE.hairBrown,
                         'S': PIXEL_PALETTE.skinMid,
                         'R': PIXEL_PALETTE.brightRed,
                         'L': PIXEL_PALETTE.denim,
                         'J': PIXEL_PALETTE.darkDenim,
                         'W': PIXEL_PALETTE.midGray,
                       }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PixelArtCityMap;
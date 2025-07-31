import React from 'react';
import { motion } from 'framer-motion';
import { 
  DiveBarSprite,
  WarehouseSprite,
  BaseSprite,
  PIXEL_PALETTE
} from '../graphics/PixelArtSprites';

interface SimplePixelMapProps {
  venues?: Array<{ id: string; name: string; x?: number; y?: number; type?: string }>;
  selectedVenue?: string | null;
  onVenueClick?: (venueId: string) => void;
  className?: string;
}

// Simple building sprite
const SIMPLE_BUILDING: string[][] = [
  'CCCCCCCC'.split(''),
  'CWWWWWWC'.split(''),
  'CWBBBBWC'.split(''),
  'CWBBBBWC'.split(''),
  'CWWWWWWC'.split(''),
  'CWBBBBWC'.split(''),
  'CWBBBBWC'.split(''),
  'CCCCCCCC'.split(''),
];

const BUILDING_COLOR_MAP = {
  'C': PIXEL_PALETTE.concrete,
  'W': PIXEL_PALETTE.white,
  'B': PIXEL_PALETTE.black,
};

export const SimplePixelMap: React.FC<SimplePixelMapProps> = ({
  venues = [],
  selectedVenue,
  onVenueClick,
  className = ''
}) => {
  // Default demo venues if none provided
  const defaultVenues = [
    { id: 'v1', name: 'The Pit', type: 'warehouse', x: 100, y: 100 },
    { id: 'v2', name: 'The Dive', type: 'dive_bar', x: 300, y: 100 },
    { id: 'v3', name: 'Basement', type: 'basement', x: 200, y: 250 },
  ];

  const venuesToShow = venues.length > 0 ? venues : defaultVenues;
  
  devLog.log('SimplePixelMap rendering with venues:', venuesToShow);

  return (
    <div 
      className={`${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        background: '#0A0A0A',
        border: '4px solid #2D2D2D',
        imageRendering: 'pixelated',
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '400px',
          overflow: 'hidden',
        }}
      >
        {/* Grid background */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Render venues */}
        {venuesToShow.map(venue => (
          <motion.div
            key={venue.id}
            style={{
              position: 'absolute',
              left: venue.x || Math.random() * 400 + 50,
              top: venue.y || Math.random() * 300 + 50,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              filter: selectedVenue === venue.id ? 'drop-shadow(0 0 10px #FF0066)' : 'none',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onVenueClick?.(venue.id)}
          >
            {venue.type === 'warehouse' && <WarehouseSprite pixelSize={2} />}
            {venue.type === 'dive_bar' && <DiveBarSprite pixelSize={2} />}
            {venue.type === 'basement' && (
              <BaseSprite 
                data={SIMPLE_BUILDING} 
                pixelSize={3} 
                colorMap={BUILDING_COLOR_MAP}
              />
            )}
            {!['warehouse', 'dive_bar', 'basement'].includes(venue.type) && (
              <BaseSprite 
                data={SIMPLE_BUILDING} 
                pixelSize={3} 
                colorMap={BUILDING_COLOR_MAP}
              />
            )}
            
            <div 
              style={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid #FF0066',
                padding: '4px 8px',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 700,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              {venue.name}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
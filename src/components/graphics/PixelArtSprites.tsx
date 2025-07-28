import React, { useMemo } from 'react';

// Color palette for consistent pixel art aesthetic
export const PIXEL_PALETTE = {
  // Base colors
  black: '#000000',
  white: '#FFFFFF',
  
  // Grays
  darkGray: '#2D2D2D',
  midGray: '#5A5A5A',
  lightGray: '#8B8B8B',
  
  // Punk/Metal colors
  bloodRed: '#8B0000',
  brightRed: '#FF0000',
  leather: '#1A1A1A',
  denim: '#1560BD',
  darkDenim: '#0A3055',
  
  // Skin tones
  skinLight: '#FFD4A3',
  skinMid: '#D4A373',
  skinDark: '#8B6239',
  
  // Hair colors
  hairBlack: '#0A0A0A',
  hairBrown: '#4A2F1A',
  hairBlonde: '#E6C873',
  hairPink: '#FF69B4',
  hairGreen: '#00FF00',
  hairBlue: '#0088FF',
  
  // Venue colors
  brick: '#8B4513',
  concrete: '#696969',
  wood: '#6B4423',
  neon: '#FF00FF',
  stage: '#2B2B2B',
  
  // UI colors
  uiPrimary: '#FF0066',
  uiSecondary: '#00FFCC',
  uiDanger: '#FF3333',
  uiSuccess: '#00FF00',
  uiWarning: '#FFCC00',
} as const;

// Base types
type PixelData = string[] | string[][];
type AnimationFrame = { data: string[]; duration: number };
type ColorMap = { [key: string]: string };

// Props for base sprite component
interface BaseSpriteProps {
  data: PixelData;
  pixelSize?: number;
  colorMap?: ColorMap;
  className?: string;
}

// Base sprite component
export const BaseSprite: React.FC<BaseSpriteProps> = ({ 
  data, 
  pixelSize = 4, 
  colorMap = {},
  className = ''
}) => {
  const pixels = useMemo(() => {
    const result: JSX.Element[] = [];
    // Handle both string[] and string[][] formats
    const rows = typeof data[0] === 'string' ? data as string[] : data as string[][];
    
    if (typeof rows[0] === 'string') {
      // Handle string[] format
      (rows as string[]).forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const pixel = row[x];
          if (pixel !== ' ' && pixel !== '.') {
            const color = colorMap[pixel] || PIXEL_PALETTE.black;
            result.push(
              <rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={color}
              />
            );
          }
        }
      });
    } else {
      // Handle string[][] format
      (rows as string[][]).forEach((row, y) => {
        row.forEach((pixel, x) => {
          if (pixel !== ' ' && pixel !== '.') {
            const color = colorMap[pixel] || PIXEL_PALETTE.black;
            result.push(
              <rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={color}
              />
            );
          }
        });
      });
    }
    return result;
  }, [data, pixelSize, colorMap]);

  const width = typeof data[0] === 'string' ? (data[0] as string).length : (data[0] as string[])?.length || 0;
  const height = data.length;

  return (
    <svg
      width={width * pixelSize}
      height={height * pixelSize}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      {pixels}
    </svg>
  );
};

// Animated sprite component
interface AnimatedSpriteProps {
  frames: AnimationFrame[];
  pixelSize?: number;
  colorMap?: ColorMap;
  className?: string;
  loop?: boolean;
}

export const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
  frames,
  pixelSize = 4,
  colorMap = {},
  className = '',
  loop = true
}) => {
  const [currentFrame, setCurrentFrame] = React.useState(0);

  React.useEffect(() => {
    if (frames.length <= 1) return;

    const frame = frames[currentFrame];
    const timer = setTimeout(() => {
      const nextFrame = currentFrame + 1;
      if (nextFrame >= frames.length) {
        if (loop) setCurrentFrame(0);
      } else {
        setCurrentFrame(nextFrame);
      }
    }, frame.duration);

    return () => clearTimeout(timer);
  }, [currentFrame, frames, loop]);

  return (
    <BaseSprite
      data={frames[currentFrame].data}
      pixelSize={pixelSize}
      colorMap={colorMap}
      className={className}
    />
  );
};

// Character sprite data (16x16)
const PUNK_IDLE: PixelData = [
  '    BBBBBB      '.split(''),
  '   BGGGGGGGB    '.split(''),
  '  BGGGGGGGGGB   '.split(''),
  '  BGSSBSSBSSB   '.split(''),
  '  BGSBBSBBBSB   '.split(''),
  '  BGSSSSSSSSB   '.split(''),
  '   BSSRRRSSSB   '.split(''),
  '    BLLLLLLB    '.split(''),
  '   BLLLLLLLLB   '.split(''),
  '  BLLLBLLBLLLB  '.split(''),
  '  BLLBBLBBLLB   '.split(''),
  '  BJJBBJBBJJB   '.split(''),
  '  BJJJJJJJJJB   '.split(''),
  '  BWWWBBWWWWB   '.split(''),
  '  BWWWBBWWWWB   '.split(''),
  '  BBBB  BBBB    '.split(''),
];

const METAL_IDLE: PixelData = [
  '    HHHHHH      '.split(''),
  '   HHHHHHHHH    '.split(''),
  '  HHHHHHHHHHHH  '.split(''),
  '  HHSSBSSBSSHH  '.split(''),
  '  HHSBBSBBBSHH  '.split(''),
  '  HHSSSSSSSSSH  '.split(''),
  '   HSSRRRSSSSH  '.split(''),
  '    HLLLLLLLH   '.split(''),
  '   HLLLLLLLLLLH '.split(''),
  '  HLLLLLLLLLLLH '.split(''),
  '  HLLBLLLLBLLHH '.split(''),
  '  HLLBBBBBBLLLH '.split(''),
  '  HLLLLLLLLLLLH '.split(''),
  '  HWWWHHHHWWWWH '.split(''),
  '  HWWWHHHHWWWWH '.split(''),
  '  HHHH    HHHH  '.split(''),
];

const INDIE_IDLE: PixelData = [
  '    BBBBBB      '.split(''),
  '   BBBBBBBB     '.split(''),
  '  BBBBBBBBBB    '.split(''),
  '  BSSBSSBSSB    '.split(''),
  '  BSBBSBBBSB    '.split(''),
  '  BSSSSSSSSB    '.split(''),
  '   BSSRRRSSSB   '.split(''),
  '    BTTTTTTB    '.split(''),
  '   BTTTTTTTTB   '.split(''),
  '  BTTTTTTTTTTB  '.split(''),
  '  BTTTBTTBTTTTB '.split(''),
  '  BJJJBJBJJJJB  '.split(''),
  '  BJJJJJJJJJJB  '.split(''),
  '  BVVVBBVVVVVB  '.split(''),
  '  BVVVBBVVVVVB  '.split(''),
  '  BBBB  BBBB    '.split(''),
];

// Walker animation frames
const WALKER_FRAME_1: PixelData = [
  '    BBBBBB      '.split(''),
  '   BGGGGGGGB    '.split(''),
  '  BGGGGGGGGGB   '.split(''),
  '  BGSSBSSBSSB   '.split(''),
  '  BGSBBSBBBSB   '.split(''),
  '  BGSSSSSSSSB   '.split(''),
  '   BSSRRRSSSB   '.split(''),
  '    BLLLLLLB    '.split(''),
  '   BLLLLLLLLB   '.split(''),
  '  BLLLBLLBLLLB  '.split(''),
  '  BLLBBLBBLLB   '.split(''),
  '  BJJBBJBBJJB   '.split(''),
  '  BJJJJJJJJJB   '.split(''),
  '  BWWBBBWWWB    '.split(''),
  '  BWWWBBWWB     '.split(''),
  '  BBB   BB      '.split(''),
];

const WALKER_FRAME_2: PixelData = [
  '    BBBBBB      '.split(''),
  '   BGGGGGGGB    '.split(''),
  '  BGGGGGGGGGB   '.split(''),
  '  BGSSBSSBSSB   '.split(''),
  '  BGSBBSBBBSB   '.split(''),
  '  BGSSSSSSSSB   '.split(''),
  '   BSSRRRSSSB   '.split(''),
  '    BLLLLLLB    '.split(''),
  '   BLLLLLLLLB   '.split(''),
  '  BLLLBLLBLLLB  '.split(''),
  '  BLLBBLBBLLB   '.split(''),
  '  BJJBBJBBJJB   '.split(''),
  '  BJJJJJJJJJB   '.split(''),
  '  BWWWBBWWWB    '.split(''),
  '  BWWBBWWWB     '.split(''),
  '  BB    BBB     '.split(''),
];

// Venue sprite data (32x32)
const DIVE_BAR: PixelData = [
  '################################'.split(''),
  '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#'.split(''),
  '#RWWWWWWWWWWWWWWWWWWWWWWWWWWWWR#'.split(''),
  '#RWBBBBBBBBBBBBBBBBBBBBBBBBBBWR#'.split(''),
  '#RWBNNNNNNBBDDDDIIIIVVVVEEEBBWR#'.split(''),
  '#RWBNNNNNNBBDDDDIIIIVVVVEEEBBWR#'.split(''),
  '#RWBNNNNNNBBDDDDIIIIVVVVEEEBBWR#'.split(''),
  '#RWBNNNNNNBBDDDDIIIIVVVVEEEBBWR#'.split(''),
  '#RWBBBBBBBBBBBBBBBBBBBBBBBBBBWR#'.split(''),
  '#RWWWWWWWWWWWWWWWWWWWWWWWWWWWWR#'.split(''),
  '#RWWWWWWWWWWWWWWWWWWWWWWWWWWWWR#'.split(''),
  '#RWBBBBBBBBBBBBBBBBBBBBBBBBBBWR#'.split(''),
  '#RWBSSSSSSSSSSSSSSSSSSSSSSSSSBWR#'.split(''),
  '#RWBSSSSSSSSSSSSSSSSSSSSSSSSSBWR#'.split(''),
  '#RWBSSSSSSSSSSSSSSSSSSSSSSSSSBWR#'.split(''),
  '#RWBSSSSSSSSSSSSSSSSSSSSSSSSSBWR#'.split(''),
  '#RWBSSSSSSSSSSSSSSSSSSSSSSSSSBWR#'.split(''),
  '#RWBSSSSSSSSSSSSSSSSSSSSSSSSSBWR#'.split(''),
  '#RWBBBBBBBBBBBBBBBBBBBBBBBBBBWR#'.split(''),
  '#RWWWWWWWWWWWWWWWWWWWWWWWWWWWWR#'.split(''),
  '#RWCCCCCCCCCCCCCCCCCCCCCCCCCCWR#'.split(''),
  '#RWCCCCCCCCCCCCCCCCCCCCCCCCCCWR#'.split(''),
  '#RWCCCCCCCCCCCCCCCCCCCCCCCCCCWR#'.split(''),
  '#RWCCCCCCCCCCCCCCCCCCCCCCCCCCWR#'.split(''),
  '#RWWWWWWWWWWWWWWWWWWWWWWWWWWWWR#'.split(''),
  '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#'.split(''),
  '#######WWWWWWWWWWWWWWWWWW#######'.split(''),
  '#######WBBBBBBDDBBBBBBBBW#######'.split(''),
  '#######WBBBBBBDDBBBBBBBBW#######'.split(''),
  '#######WBBBBBBDDBBBBBBBBW#######'.split(''),
  '#######WBBBBBBDDBBBBBBBBW#######'.split(''),
  '################################'.split(''),
];

const WAREHOUSE: PixelData = [
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
  'CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC'.split(''),
  'CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWSSSSSSSSSSSSSSSSSSSSSSSSSSSCWC'.split(''),
  'CWCCCCCCCCCCCCCCCCCCCCCCCCCCCCWC'.split(''),
  'CWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWC'.split(''),
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCDDDDCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCDDDDCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCDDDDCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCDDDDCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCDDDDCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCDDDDCCCCCCCCCCCCCC'.split(''),
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'.split(''),
];

// UI Elements (16x16)
const PIXEL_BUTTON: PixelData = [
  'PPPPPPPPPPPPPPPP'.split(''),
  'PWWWWWWWWWWWWWWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWPPPPPPPPPPPPWP'.split(''),
  'PWGGGGGGGGGGGGWP'.split(''),
  'PWWWWWWWWWWWWWWP'.split(''),
  'PPPPPPPPPPPPPPPP'.split(''),
];

const PIXEL_PANEL: PixelData = [
  'GGGGGGGGGGGGGGGG'.split(''),
  'GWWWWWWWWWWWWWWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWGGGGGGGGGGGGWG'.split(''),
  'GWBBBBBBBBBBBBWG'.split(''),
  'GWWWWWWWWWWWWWWG'.split(''),
  'GGGGGGGGGGGGGGGG'.split(''),
];

// Color maps for different sprites
const PUNK_COLOR_MAP: ColorMap = {
  'B': PIXEL_PALETTE.black,
  'G': PIXEL_PALETTE.hairGreen,
  'S': PIXEL_PALETTE.skinMid,
  'R': PIXEL_PALETTE.brightRed,
  'L': PIXEL_PALETTE.leather,
  'J': PIXEL_PALETTE.darkDenim,
  'W': PIXEL_PALETTE.white,
};

const METAL_COLOR_MAP: ColorMap = {
  'H': PIXEL_PALETTE.hairBlack,
  'S': PIXEL_PALETTE.skinLight,
  'R': PIXEL_PALETTE.bloodRed,
  'L': PIXEL_PALETTE.leather,
  'W': PIXEL_PALETTE.white,
  'B': PIXEL_PALETTE.black,
};

const INDIE_COLOR_MAP: ColorMap = {
  'B': PIXEL_PALETTE.hairBrown,
  'S': PIXEL_PALETTE.skinMid,
  'R': PIXEL_PALETTE.brightRed,
  'T': PIXEL_PALETTE.denim,
  'J': PIXEL_PALETTE.darkDenim,
  'V': PIXEL_PALETTE.midGray,
};

const VENUE_COLOR_MAP: ColorMap = {
  '#': PIXEL_PALETTE.darkGray,
  'R': PIXEL_PALETTE.brick,
  'W': PIXEL_PALETTE.wood,
  'B': PIXEL_PALETTE.black,
  'N': PIXEL_PALETTE.neon,
  'D': PIXEL_PALETTE.bloodRed,
  'I': PIXEL_PALETTE.white,
  'V': PIXEL_PALETTE.denim,
  'E': PIXEL_PALETTE.hairGreen,
  'S': PIXEL_PALETTE.stage,
  'C': PIXEL_PALETTE.concrete,
};

const UI_COLOR_MAP: ColorMap = {
  'P': PIXEL_PALETTE.uiPrimary,
  'W': PIXEL_PALETTE.white,
  'G': PIXEL_PALETTE.darkGray,
  'B': PIXEL_PALETTE.black,
};

// Exported character sprites
export const PunkSprite: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={PUNK_IDLE}
    pixelSize={pixelSize}
    colorMap={PUNK_COLOR_MAP}
    className={className}
  />
);

export const MetalSprite: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={METAL_IDLE}
    pixelSize={pixelSize}
    colorMap={METAL_COLOR_MAP}
    className={className}
  />
);

export const IndieSprite: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={INDIE_IDLE}
    pixelSize={pixelSize}
    colorMap={INDIE_COLOR_MAP}
    className={className}
  />
);

// Exported walker sprite
export const WalkerSprite: React.FC<{ 
  pixelSize?: number; 
  className?: string;
  colorMap?: ColorMap;
}> = ({ 
  pixelSize = 4, 
  className = '',
  colorMap = PUNK_COLOR_MAP
}) => (
  <AnimatedSprite
    frames={[
      { data: WALKER_FRAME_1, duration: 200 },
      { data: WALKER_FRAME_2, duration: 200 },
    ]}
    pixelSize={pixelSize}
    colorMap={colorMap}
    className={className}
  />
);

// Exported venue sprites
export const DiveBarSprite: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={DIVE_BAR}
    pixelSize={pixelSize}
    colorMap={VENUE_COLOR_MAP}
    className={className}
  />
);

export const WarehouseSprite: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={WAREHOUSE}
    pixelSize={pixelSize}
    colorMap={VENUE_COLOR_MAP}
    className={className}
  />
);

// Exported UI element sprites
export const PixelButton: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={PIXEL_BUTTON}
    pixelSize={pixelSize}
    colorMap={UI_COLOR_MAP}
    className={className}
  />
);

export const PixelPanel: React.FC<{ pixelSize?: number; className?: string }> = ({ 
  pixelSize = 4, 
  className = '' 
}) => (
  <BaseSprite
    data={PIXEL_PANEL}
    pixelSize={pixelSize}
    colorMap={UI_COLOR_MAP}
    className={className}
  />
);

// Sprite sheet system
export interface SpriteDefinition {
  name: string;
  data: PixelData;
  colorMap: ColorMap;
  animated?: boolean;
  frames?: AnimationFrame[];
}

export const SPRITE_SHEET: { [key: string]: SpriteDefinition } = {
  punkIdle: {
    name: 'punkIdle',
    data: PUNK_IDLE,
    colorMap: PUNK_COLOR_MAP,
  },
  metalIdle: {
    name: 'metalIdle',
    data: METAL_IDLE,
    colorMap: METAL_COLOR_MAP,
  },
  indieIdle: {
    name: 'indieIdle',
    data: INDIE_IDLE,
    colorMap: INDIE_COLOR_MAP,
  },
  punkWalk: {
    name: 'punkWalk',
    data: WALKER_FRAME_1,
    colorMap: PUNK_COLOR_MAP,
    animated: true,
    frames: [
      { data: WALKER_FRAME_1, duration: 200 },
      { data: WALKER_FRAME_2, duration: 200 },
    ],
  },
  diveBar: {
    name: 'diveBar',
    data: DIVE_BAR,
    colorMap: VENUE_COLOR_MAP,
  },
  warehouse: {
    name: 'warehouse',
    data: WAREHOUSE,
    colorMap: VENUE_COLOR_MAP,
  },
  button: {
    name: 'button',
    data: PIXEL_BUTTON,
    colorMap: UI_COLOR_MAP,
  },
  panel: {
    name: 'panel',
    data: PIXEL_PANEL,
    colorMap: UI_COLOR_MAP,
  },
};

// Utility function to get sprite from sheet
export const getSpriteFromSheet = (
  spriteName: string,
  pixelSize: number = 4,
  className: string = ''
): JSX.Element | null => {
  const sprite = SPRITE_SHEET[spriteName];
  if (!sprite) return null;

  if (sprite.animated && sprite.frames) {
    return (
      <AnimatedSprite
        frames={sprite.frames}
        pixelSize={pixelSize}
        colorMap={sprite.colorMap}
        className={className}
      />
    );
  }

  return (
    <BaseSprite
      data={sprite.data}
      pixelSize={pixelSize}
      colorMap={sprite.colorMap}
      className={className}
    />
  );
};
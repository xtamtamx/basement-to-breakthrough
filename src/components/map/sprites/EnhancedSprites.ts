// Enhanced pixel art sprites with better visual quality
import { SpriteData } from './PixelSprites16Bit';

// Enhanced color palette with better contrast and vibrancy
export const ENHANCED_COLORS = {
  // Base colors
  TRANSPARENT: 'transparent',
  BLACK: '#000000',
  WHITE: '#ffffff',
  
  // Grays with better contrast
  GRAY_1: '#0a0a0a',
  GRAY_2: '#1a1a1a',
  GRAY_3: '#2a2a2a',
  GRAY_4: '#3a3a3a',
  GRAY_5: '#4a4a4a',
  GRAY_6: '#5a5a5a',
  GRAY_7: '#6a6a6a',
  GRAY_8: '#7a7a7a',
  GRAY_9: '#8a8a8a',
  GRAY_10: '#9a9a9a',
  
  // Downtown - Sleek blues and cyans
  GLASS_1: '#0891b2',
  GLASS_2: '#06b6d4',
  GLASS_3: '#22d3ee',
  GLASS_4: '#67e8f9',
  STEEL_1: '#0f172a',
  STEEL_2: '#1e293b',
  STEEL_3: '#334155',
  NEON_CYAN: '#00ffff',
  NEON_BLUE: '#0080ff',
  
  // Warehouse - Warm reds and oranges
  BRICK_1: '#450a0a',
  BRICK_2: '#7f1d1d',
  BRICK_3: '#991b1b',
  BRICK_4: '#b91c1c',
  RUST_1: '#431407',
  RUST_2: '#7c2d12',
  RUST_3: '#c2410c',
  GRAFFITI_PINK: '#ec4899',
  GRAFFITI_PURPLE: '#a855f7',
  
  // Nature
  GRASS_1: '#14532d',
  GRASS_2: '#166534',
  GRASS_3: '#16a34a',
  GRASS_4: '#22c55e',
  TREE_1: '#1c1917',
  TREE_2: '#292524',
  
  // Streets
  ASPHALT_1: '#030712',
  ASPHALT_2: '#111827',
  ASPHALT_3: '#1f2937',
  ROAD_LINE: '#fbbf24',
  SIDEWALK_1: '#374151',
  SIDEWALK_2: '#4b5563',
  
  // Lighting
  WINDOW_LIT: '#fbbf24',
  WINDOW_DARK: '#1f2937',
  LIGHT_GLOW: '#fef3c7',
};

// Downtown glass tower - modern and sleek
export const DOWNTOWN_TOWER = [
  '................',
  '....██████████..',
  '...████████████.',
  '..██░░██░░██░░██',
  '..██▒▒██▒▒██▒▒██',
  '..██░░██░░██░░██',
  '..██▒▒██▒▒██▒▒██',
  '..██░░██░░██░░██',
  '..██▒▒██▒▒██▒▒██',
  '..██░░██░░██░░██',
  '..██▒▒██▒▒██▒▒██',
  '..██░░██░░██░░██',
  '..██████████████',
  '..██▓▓▓▓▓▓▓▓▓██',
  '...████████████.',
  '████████████████'
];

// Warehouse with graffiti
export const WAREHOUSE_BUILDING = [
  '████████████████',
  '█░░░░░░░░░░░░░░█',
  '█▒▒▓▓▒▒▓▓▒▒▓▓▒█',
  '█▒█▓▓█▒▓▓▒█▓▓█▒█',
  '█░░░░░░░░░░░░░░█',
  '████████████████',
  '█▒▒▓▓▒▒▓▓▒▒▓▓▒█',
  '█▒█▓▓█▒▓▓▒█▓▓█▒█',
  '█░█▀▀█░██░█▀▀█░█',
  '█░████░██░████░█',
  '████████████████',
  '█░░░░░░░░░░░░░░█',
  '█░▓▓▓▓▓▓▓▓▓▓▓░█',
  '█░░░░░░░░░░░░░░█',
  '████████████████',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
];

// Residential house
export const RESIDENTIAL_HOUSE = [
  '................',
  '.....██████.....',
  '....████████....',
  '...██████████...',
  '..████████████..',
  '..██░░░░░░░░██..',
  '..██░██░░██░██..',
  '..██░██░░██░██..',
  '..██░░░░░░░░██..',
  '..██░██░░██░██..',
  '..██░██░░██░██..',
  '..██████▓▓████..',
  '..██████▓▓████..',
  '..████████████..',
  '...▓▓▓▓▓▓▓▓▓▓...',
  '████████████████'
];

// Empty lot variations
export const EMPTY_LOTS = {
  overgrown: [
    '▓▓░▓▓▓▓▓▓▓▓░▓▓▓',
    '▓░░░▓▓▓▓▓▓░░░▓▓',
    '░░░░░▓▓▓░░░░░░▓',
    '░░░░░░░░░░░░░░░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒░░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒▒░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒▒░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒▒░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒▒░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒▒░',
    '░▒▒▒▒▒▒▒▒▒▒▒▒▒░',
    '░░▒▒▒▒▒▒▒▒▒▒▒░░',
    '▓░░░▒▒▒▒▒▒▒░░░▓',
    '▓▓░░░░░░░░░░░▓▓',
    '▓▓▓░░░░░░░░░▓▓▓',
    '████████████████'
  ],
  parking: [
    '████████████████',
    '█░░░░░░░░░░░░░░█',
    '█░┌─┐░┌─┐░┌─┐░█',
    '█░│░│░│░│░│░│░█',
    '█░└─┘░└─┘░└─┘░█',
    '█░░░░░░░░░░░░░░█',
    '████████████████',
    '█░░░░░░░░░░░░░░█',
    '█░┌─┐░┌─┐░┌─┐░█',
    '█░│░│░│░│░│░│░█',
    '█░└─┘░└─┘░└─┘░█',
    '█░░░░░░░░░░░░░░█',
    '████████████████',
    '█░░░░░░░░░░░░░░█',
    '████████████████',
    '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
  ]
};

// Construction site
export const CONSTRUCTION_SITE = [
  '████████████████',
  '█▓▓▓▓▓▓▓▓▓▓▓▓▓▓█',
  '█▓░░░░░░░░░░░░▓█',
  '█▓░████████████▓█',
  '█▓░█░░░░░░░░░█▓█',
  '█▓░█░┌────┐░░█▓█',
  '█▓░█░│░░░░│░░█▓█',
  '█▓░█░│░░░░│░░█▓█',
  '█▓░█░│░░░░│░░█▓█',
  '█▓░█░└────┘░░█▓█',
  '█▓░█░░░░░░░░░█▓█',
  '█▓░████████████▓█',
  '█▓▓▓▓▓▓▓▓▓▓▓▓▓▓█',
  '████████████████',
  '█▀▀▀▀▀▀▀▀▀▀▀▀▀█',
  '████████████████'
];

// Convert pattern strings to sprite data with proper colors
export function convertPatternToSprite(
  pattern: string[],
  colorMap: Record<string, string>
): SpriteData {
  return pattern.map(row => 
    row.split('').map(char => colorMap[char] || ENHANCED_COLORS.TRANSPARENT)
  );
}

// Enhanced color mappings for different tile types
export const ENHANCED_SPRITE_COLORS = {
  downtown: {
    '.': ENHANCED_COLORS.TRANSPARENT,
    '█': ENHANCED_COLORS.STEEL_2,
    '▓': ENHANCED_COLORS.STEEL_1,
    '▒': ENHANCED_COLORS.GLASS_2,
    '░': ENHANCED_COLORS.GLASS_3,
    '▀': ENHANCED_COLORS.NEON_CYAN,
    '▄': ENHANCED_COLORS.NEON_BLUE,
  },
  warehouse: {
    '.': ENHANCED_COLORS.TRANSPARENT,
    '█': ENHANCED_COLORS.BRICK_2,
    '▓': ENHANCED_COLORS.BRICK_3,
    '▒': ENHANCED_COLORS.BRICK_1,
    '░': ENHANCED_COLORS.RUST_2,
    '▀': ENHANCED_COLORS.GRAFFITI_PINK,
    '▄': ENHANCED_COLORS.GRAFFITI_PURPLE,
  },
  residential: {
    '.': ENHANCED_COLORS.TRANSPARENT,
    '█': ENHANCED_COLORS.GRAY_6,
    '▓': ENHANCED_COLORS.GRAY_4,
    '▒': ENHANCED_COLORS.GRAY_7,
    '░': ENHANCED_COLORS.WINDOW_LIT,
  },
  nature: {
    '.': ENHANCED_COLORS.TRANSPARENT,
    '█': ENHANCED_COLORS.SIDEWALK_1,
    '▓': ENHANCED_COLORS.GRASS_2,
    '▒': ENHANCED_COLORS.GRASS_3,
    '░': ENHANCED_COLORS.GRASS_1,
  },
  construction: {
    '.': ENHANCED_COLORS.TRANSPARENT,
    '█': ENHANCED_COLORS.GRAY_5,
    '▓': ENHANCED_COLORS.GRAY_7,
    '▒': ENHANCED_COLORS.GRAY_3,
    '░': ENHANCED_COLORS.GRAY_9,
    '┌': ENHANCED_COLORS.RUST_3,
    '─': ENHANCED_COLORS.RUST_3,
    '┐': ENHANCED_COLORS.RUST_3,
    '│': ENHANCED_COLORS.RUST_3,
    '└': ENHANCED_COLORS.RUST_3,
    '┘': ENHANCED_COLORS.RUST_3,
    '▀': ENHANCED_COLORS.ROAD_LINE,
  }
};

// Create better venue sprite with neon sign
export const VENUE_SPRITE_ACTIVE = [
  '..████████████..',
  '.██▓▓▓▓▓▓▓▓▓▓██.',
  '.█▓▀▀▀▀▀▀▀▀▀▀▓█.',
  '.█▓▄▄▀▄▄▀▄▄▀▄▓█.',
  '.█▓▓▓▓▓▓▓▓▓▓▓▓█.',
  '.█░░░░░░░░░░░░█.',
  '.█░██░░██░░██░█.',
  '.█░▓▓░░▓▓░░▓▓░█.',
  '.█░██░░██░░██░█.',
  '.█░░░░░░░░░░░░█.',
  '.█░██░░██░░██░█.',
  '.█░▓▓░░▓▓░░▓▓░█.',
  '.█░░░░████░░░░█.',
  '.█░░░░█▓▓█░░░░█.',
  '.██████████████.',
  '████████████████'
];

// Better street patterns with road markings
export const STREET_HORIZONTAL = [
  '████████████████',
  '████████████████',
  '████████████████',
  '████████████████',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '────────────────',
  '▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀',
  '▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀',
  '────────────────',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '████████████████',
  '████████████████',
  '████████████████',
  '████████████████'
];

// Street color mapping
export const STREET_COLORS = {
  '█': ENHANCED_COLORS.SIDEWALK_1,
  '▓': ENHANCED_COLORS.ASPHALT_2,
  '─': ENHANCED_COLORS.ASPHALT_1,
  '▀': ENHANCED_COLORS.ROAD_LINE,
  '.': ENHANCED_COLORS.TRANSPARENT,
};
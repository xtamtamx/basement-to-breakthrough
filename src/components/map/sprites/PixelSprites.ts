// Pixel art sprite definitions for the city map
// Each sprite is 32x32 pixels, represented as a 2D array of color codes

export type SpriteData = string[][];

export const SPRITE_COLORS = {
  // Base colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY_DARK: '#1A1A1A',
  GRAY_MID: '#333333',
  GRAY_LIGHT: '#666666',
  
  // District colors
  DOWNTOWN_BLUE: '#3B82F6',
  DOWNTOWN_DARK: '#1E3A8A',
  WAREHOUSE_RED: '#EF4444',
  WAREHOUSE_DARK: '#7F1D1D',
  COLLEGE_GREEN: '#10B981',
  COLLEGE_DARK: '#064E3B',
  RESIDENTIAL_ORANGE: '#F59E0B',
  RESIDENTIAL_DARK: '#92400E',
  ARTS_PURPLE: '#8B5CF6',
  ARTS_DARK: '#4C1D95',
  
  // Accent colors
  NEON_CYAN: '#00FFFF',
  NEON_PURPLE: '#FF00FF',
  NEON_PINK: '#FF1493',
  WINDOW_YELLOW: '#FFD700',
  STREET_MARKING: '#FFB800',
  
  // Nature
  GRASS_GREEN: '#22C55E',
  TREE_GREEN: '#15803D',
  
  // Special
  TRANSPARENT: 'transparent'
};

// Convert simplified sprite format to full format
function createSprite(pattern: string[], colors: Record<string, string>): SpriteData {
  return pattern.map(row => 
    row.split('').map(char => colors[char] || SPRITE_COLORS.TRANSPARENT)
  );
}

// Building sprite patterns (8x8 simplified, will be scaled to 32x32)
const BUILDING_PATTERNS = {
  downtown: [
    '..BBBB..',
    '.BBWWBB.',
    'BBWWWWBB',
    'BWYWYWWB',
    'BWWWWWWB',
    'BWYWYWWB',
    'BWWWWWWB',
    'BBBBBBBB'
  ],
  warehouse: [
    'RRRRRRRR',
    'RWWWWWWR',
    'RWWWWWWR',
    'RRRRRRRR',
    'RWWWWWWR',
    'RWWWWWWR',
    'RWDDDDDDR',
    'RRRRRRRR'
  ],
  college: [
    '...GG...',
    '..GGGG..',
    '.GGWWGG.',
    'GGWWWWGG',
    'GWYWYWWG',
    'GWWWWWWG',
    'GWYWYWWG',
    'GGGGGGGG'
  ],
  residential: [
    '...OO...',
    '..OOOO..',
    '.OOOOOO.',
    'OOWWWWOO',
    'OWYWYWWO',
    'OWWWWWWO',
    'OWWDDWWO',
    'OOOOOOOO'
  ],
  arts: [
    '.PPPPPP.',
    'PPWWWWPP',
    'PWCWCWWP',
    'PWWWWWWP',
    'PWCWCWWP',
    'PWWWWWWP',
    'PPPPPPPP',
    'PDDDDDDDP'
  ]
};

// Color mappings for each building type
const BUILDING_COLORS = {
  downtown: {
    '.': SPRITE_COLORS.TRANSPARENT,
    'B': SPRITE_COLORS.DOWNTOWN_DARK,
    'W': SPRITE_COLORS.GRAY_MID,
    'Y': SPRITE_COLORS.WINDOW_YELLOW,
    'D': SPRITE_COLORS.GRAY_DARK
  },
  warehouse: {
    'R': SPRITE_COLORS.WAREHOUSE_DARK,
    'W': SPRITE_COLORS.GRAY_DARK,
    'D': SPRITE_COLORS.BLACK
  },
  college: {
    '.': SPRITE_COLORS.TRANSPARENT,
    'G': SPRITE_COLORS.COLLEGE_DARK,
    'W': SPRITE_COLORS.GRAY_MID,
    'Y': SPRITE_COLORS.WINDOW_YELLOW
  },
  residential: {
    '.': SPRITE_COLORS.TRANSPARENT,
    'O': SPRITE_COLORS.RESIDENTIAL_DARK,
    'W': SPRITE_COLORS.GRAY_LIGHT,
    'Y': SPRITE_COLORS.WINDOW_YELLOW,
    'D': SPRITE_COLORS.GRAY_MID
  },
  arts: {
    '.': SPRITE_COLORS.TRANSPARENT,
    'P': SPRITE_COLORS.ARTS_DARK,
    'W': SPRITE_COLORS.GRAY_MID,
    'C': SPRITE_COLORS.NEON_PURPLE,
    'D': SPRITE_COLORS.GRAY_DARK
  }
};

// Street patterns
const STREET_PATTERNS = {
  horizontal: [
    'SSSSSSSS',
    'SDDDDDDS',
    'SDMDMDDS',
    'SDDDDDDS',
    'SDDDDDDS',
    'SDMDMDDS',
    'SDDDDDDS',
    'SSSSSSSS'
  ],
  vertical: [
    'SSDDDDSS',
    'SSDDDDSS',
    'SSMDMDSS',
    'SSDDDDSS',
    'SSDDDDSS',
    'SSMDMDSS',
    'SSDDDDSS',
    'SSDDDDSS'
  ],
  intersection: [
    'SSDDDDSS',
    'SDDDDDDS',
    'DDMDMDDD',
    'DDDDDDDD',
    'DDDDDDDD',
    'DDMDMDDD',
    'SDDDDDDS',
    'SSDDDDSS'
  ]
};

const STREET_COLORS = {
  'S': SPRITE_COLORS.GRAY_DARK,
  'D': SPRITE_COLORS.BLACK,
  'M': SPRITE_COLORS.STREET_MARKING
};

// Special building sprites
const VENUE_PATTERN = [
  '..PPPP..',
  '.PPCCPP.',
  'PPCWWCPP',
  'PCWCCWCP',
  'PCWWWWCP',
  'PCWCCWCP',
  'PPCCCCPP',
  'PPPPPPPP'
];

const VENUE_COLORS = {
  '.': SPRITE_COLORS.TRANSPARENT,
  'P': SPRITE_COLORS.ARTS_PURPLE,
  'C': SPRITE_COLORS.NEON_CYAN,
  'W': SPRITE_COLORS.GRAY_MID
};

const WORKPLACE_PATTERN = [
  '..BBBB..',
  '.BBBBBB.',
  'BBWWWWBB',
  'BWWWWWWB',
  'BWWCCWWB',
  'BWWCCWWB',
  'BWWWWWWB',
  'BBBBBBBB'
];

const WORKPLACE_COLORS = {
  '.': SPRITE_COLORS.TRANSPARENT,
  'B': SPRITE_COLORS.DOWNTOWN_BLUE,
  'W': SPRITE_COLORS.GRAY_LIGHT,
  'C': SPRITE_COLORS.NEON_CYAN
};

// Park pattern
const PARK_PATTERN = [
  'GGGTGGGG',
    'GTTTTTGG',
  'GTTTTTTG',
  'GGTTTTGG',
  'GGGTGGGG',
  'GGGTGGGG',
  'GGGTGGGG',
  'GGGGGGGG'
];

const PARK_COLORS = {
  'G': SPRITE_COLORS.GRASS_GREEN,
  'T': SPRITE_COLORS.TREE_GREEN
};

// Create sprite cache
export const SPRITES = {
  // Buildings
  building_downtown: createSprite(BUILDING_PATTERNS.downtown, BUILDING_COLORS.downtown),
  building_warehouse: createSprite(BUILDING_PATTERNS.warehouse, BUILDING_COLORS.warehouse),
  building_college: createSprite(BUILDING_PATTERNS.college, BUILDING_COLORS.college),
  building_residential: createSprite(BUILDING_PATTERNS.residential, BUILDING_COLORS.residential),
  building_arts: createSprite(BUILDING_PATTERNS.arts, BUILDING_COLORS.arts),
  
  // Streets
  street_horizontal: createSprite(STREET_PATTERNS.horizontal, STREET_COLORS),
  street_vertical: createSprite(STREET_PATTERNS.vertical, STREET_COLORS),
  street_intersection: createSprite(STREET_PATTERNS.intersection, STREET_COLORS),
  
  // Special
  venue_inactive: createSprite(VENUE_PATTERN, VENUE_COLORS),
  venue_active: createSprite(VENUE_PATTERN, {
    ...VENUE_COLORS,
    'C': SPRITE_COLORS.NEON_PINK,
    'P': SPRITE_COLORS.NEON_PURPLE
  }),
  workplace: createSprite(WORKPLACE_PATTERN, WORKPLACE_COLORS),
  park: createSprite(PARK_PATTERN, PARK_COLORS)
};

// Scale up sprite from 8x8 to 32x32
export function scaleSprite(sprite: SpriteData, scale: number = 4): SpriteData {
  const scaled: SpriteData = [];
  
  for (let y = 0; y < sprite.length; y++) {
    for (let sy = 0; sy < scale; sy++) {
      const row: string[] = [];
      for (let x = 0; x < sprite[y].length; x++) {
        for (let sx = 0; sx < scale; sx++) {
          row.push(sprite[y][x]);
        }
      }
      scaled.push(row);
    }
  }
  
  return scaled;
}

// Get appropriate sprite for a tile
export function getSpriteForTile(tileType: string, districtType?: string): SpriteData | null {
  if (tileType === 'building' && districtType) {
    return SPRITES[`building_${districtType}`] || null;
  }
  
  if (tileType === 'street') {
    // TODO: Determine street direction based on neighbors
    return SPRITES.street_horizontal;
  }
  
  return SPRITES[tileType] || null;
}
// Clean, simple sprites that look good at any zoom level
// Using a 16x16 base for clarity

export const CLEAN_COLORS = {
  // Transparent
  '_': 'transparent',
  
  // Ground
  'G': '#7cb342', // Grass
  'g': '#689f38', // Dark grass
  'D': '#8d6e63', // Dirt
  'd': '#6d4c41', // Dark dirt
  'S': '#bdbdbd', // Stone
  's': '#9e9e9e', // Dark stone
  'A': '#424242', // Asphalt
  'a': '#303030', // Dark asphalt
  'Y': '#fdd835', // Yellow line
  
  // Building basics
  'W': '#f4e4c1', // Wall light
  'w': '#e6d7b3', // Wall medium
  'B': '#d7ccc8', // Brick
  'b': '#a1887f', // Dark brick
  'R': '#d32f2f', // Red roof
  'r': '#b71c1c', // Dark red roof
  'O': '#ff6f00', // Orange roof
  'o': '#e65100', // Dark orange roof
  'U': '#1976d2', // Blue roof
  'u': '#0d47a1', // Dark blue roof
  'T': '#5d4037', // Wood/timber
  't': '#3e2723', // Dark wood
  
  // Windows/doors
  'X': '#81d4fa', // Window
  'x': '#4fc3f7', // Window lit
  'H': '#6d4c41', // Door
  'h': '#4e342e', // Door dark
  'P': '#388e3c', // Door painted
  
  // Details
  'F': '#ffeb3b', // Flower/accent
  'f': '#f9a825', // Flower dark
  'N': '#2e7d32', // Tree/nature
  'n': '#1b5e20', // Tree dark
  'M': '#e91e63', // Music/neon
  'm': '#ad1457', // Music dark
  '1': '#ffffff', // White
  '2': '#000000', // Black
  '3': '#757575', // Gray
};

// Simple house (16x16)
export const HOUSE_CLEAN = [
  '____rrrrrrrr____',
  '___rRRRRRRRRr___',
  '__rRRRRRRRRRRr__',
  '__RRRRRRRRRRRR__',
  '__wwwwwwwwwwww__',
  '__wXXwwwwwXXww__',
  '__wxxwwwwwxxww__',
  '__wXXwwwwwXXww__',
  '__wwwwwwwwwwww__',
  '__wXXwwwwwXXww__',
  '__wxxwwwwwxxww__',
  '__wXXwwHHwXXww__',
  '__wwwwwhhwwwww__',
  '__33333333333___',
  '_gGGGGGGGGGGGg__',
  '________________'
];

// Shop (16x16)
export const SHOP_CLEAN = [
  '____UUUUUUUU____',
  '___UuuuuuuuuU___',
  '__UUUUUUUUUUUU__',
  '__1111111111111_',
  '__BBBBBBBBBBBB__',
  '__BXXXXXXXXXBB__',
  '__BxxxxxxxxxBB__',
  '__BxxxxxxxxxBB__',
  '__BXXXXXXXXXBB__',
  '__BBBBBBBBBBBB__',
  '__BBBHHHHHHBBB__',
  '__BBBHhhhHBBBB__',
  '__BBBBBBBBBBBB__',
  '__ssssssssssss__',
  '__SSSSSSSSSSSS__',
  '________________'
];

// Music venue (16x16)
export const VENUE_CLEAN = [
  '___2222222222___',
  '__222222222222__',
  '__2MMMMMMMMMM2__',
  '__2MmMmMmMmMm2__',
  '__2MMMMMMMMMM2__',
  '__bbbbbbbbbbbb__',
  '__bXXbXXbXXbbb__',
  '__bxxbxxbxxbbb__',
  '__bbbbbbbbbbbb__',
  '__bbbHHHHHbbbb__',
  '__bbbHhhhHbbbb__',
  '__bbbbbbbbbbbb__',
  '__aaaaaaaaaaaa__',
  '__AAAAAAAAAAAA__',
  '__AAAAAAAAAAAA__',
  '________________'
];

// Tree (16x16)
export const TREE_CLEAN = [
  '________________',
  '_____nnnnnn_____',
  '____nNNNNNNn____',
  '___nNNNNNNNNn___',
  '___nNNnNNnNNn___',
  '___nNNNNNNNNn___',
  '____nNNNNNNn____',
  '_____nNNNNn_____',
  '______TTT_______',
  '______tTt_______',
  '______TTT_______',
  '_____tTTTt______',
  '____gGGGGGg_____',
  '___gGGGGGGGg____',
  '________________',
  '________________'
];

// Road horizontal (16x16)
export const ROAD_H_CLEAN = [
  'SSSSSSSSSSSSSSSS',
  'ssssssssssssssss',
  'AAAAAAAAAAAAAAA',
  'aaaaaaaaaaaaaaaa',
  'AAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAA',
  'YYYYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYYYY',
  'AAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAA',
  'aaaaaaaaaaaaaaaa',
  'AAAAAAAAAAAAAAA',
  'ssssssssssssssss',
  'SSSSSSSSSSSSSSSS'
];

// Road vertical (16x16)
export const ROAD_V_CLEAN = [
  'SSssAAAAAAAAssSS',
  'SSssAaaAAAAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAYYYYAAssSS',
  'SSssAAYYYYAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAYYYYAAssSS',
  'SSssAAYYYYAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAaaAAAAAssSS',
  'SSssAAAAAAAAssSS',
  'SSssAAAAAAAAssSS'
];

// Grass tile (16x16)
export const GRASS_CLEAN = [
  'GGGGGGGGGGGgGGGG',
  'GGgGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGGgGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGGGGGGgGGGGGG',
  'gGGGGGGGGGGGGGGg',
  'GGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGgGGGGGGGGGgGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGGGGgGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
  'GgGGGGGGGGGGGGGG',
  'GGGGGGGGGGGgGGGG',
  'GGGGGGGGGGGGGGGG'
];

// Stone/plaza tile (16x16)
export const STONE_CLEAN = [
  'SSSSSSSSSSSSSSSS',
  'SsssssssssssssS',
  'SsSSSSSSSSSSssS',
  'SsSssssssssSssS',
  'SsSsSSSSSSsSssS',
  'SsSsSssssSsSssS',
  'SsSsSsSSsSsSssS',
  'SsSsSsSsSsSssS',
  'SsSsSsSsSsSssS',
  'SsSsSsSSsSsSssS',
  'SsSsSssssSsSssS',
  'SsSsSSSSSSsSssS',
  'SsSssssssssSssS',
  'SsSSSSSSSSSSssS',
  'SsssssssssssssS',
  'SSSSSSSSSSSSSSSS'
];

// Simple fountain (16x16)
export const FOUNTAIN_CLEAN = [
  '________________',
  '____ssssssss____',
  '___sSSSSSSSss___',
  '__sSS3333333Ss__',
  '__sS333XX333Ss__',
  '__sS33XxxX33Ss__',
  '__sS33XxxX33Ss__',
  '__sS33XxxX33Ss__',
  '__sS33XxxX33Ss__',
  '__sS333XX333Ss__',
  '__sSS3333333Ss__',
  '___sSSSSSSSss___',
  '____ssssssss____',
  '________________',
  '________________',
  '________________'
];

// Apply colors to sprite
export function renderCleanSprite(pattern: string[]): string[][] {
  return pattern.map(row => 
    row.split('').map(char => CLEAN_COLORS[char] || 'transparent')
  );
}
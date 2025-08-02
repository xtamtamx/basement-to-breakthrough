// 32x32 Stardew Valley-inspired town sprites
export type SpriteData32 = string[][];

// Warm, cozy color palette
export const TOWN_COLORS = {
  // Base colors
  TRANSPARENT: 'transparent',
  BLACK: '#1a0f0a',
  WHITE: '#fef9e7',
  
  // Building materials
  WOOD_LIGHT: '#deb887',
  WOOD_MEDIUM: '#cd853f',
  WOOD_DARK: '#8b4513',
  STONE_LIGHT: '#d3d3d3',
  STONE_MEDIUM: '#a9a9a9',
  STONE_DARK: '#696969',
  BRICK_LIGHT: '#ff6b6b',
  BRICK_MEDIUM: '#dc143c',
  BRICK_DARK: '#8b0000',
  
  // Roofing
  ROOF_RED: '#a52a2a',
  ROOF_BLUE: '#4682b4',
  ROOF_GREEN: '#228b22',
  ROOF_BROWN: '#654321',
  SHINGLE_LIGHT: '#bc9a6a',
  SHINGLE_DARK: '#8b6f47',
  
  // Windows and doors
  WINDOW_GLASS: '#87ceeb',
  WINDOW_DARK: '#4682b4',
  WINDOW_GLOW: '#ffffe0',
  DOOR_WOOD: '#8b4513',
  DOOR_PAINT: '#2e8b57',
  
  // Nature
  GRASS_LIGHT: '#90ee90',
  GRASS_MEDIUM: '#32cd32',
  GRASS_DARK: '#228b22',
  TREE_LEAVES: '#228b22',
  TREE_TRUNK: '#654321',
  FLOWER_PINK: '#ffb6c1',
  FLOWER_YELLOW: '#ffeb3b',
  FLOWER_PURPLE: '#9370db',
  
  // Roads and paths
  ROAD_ASPHALT: '#2c2c2c',
  ROAD_DIRT: '#8b7355',
  PATH_STONE: '#a9a9a9',
  PATH_GRAVEL: '#bc9a6a',
  
  // Special
  WATER_LIGHT: '#87ceeb',
  WATER_DARK: '#4682b4',
  FOUNTAIN_STONE: '#b0b0b0',
  NEON_PINK: '#ff1493',
  NEON_BLUE: '#00bfff',
  SMOKE: '#d3d3d3',
};

// Convert string pattern to sprite data
export function createSprite32(pattern: string[]): SpriteData32 {
  return pattern.map(row => row.split(''));
}

// Simple house (32x32) - Cozy cottage style
export const HOUSE_COTTAGE = createSprite32([
  '................................',
  '................................',
  '............RRRRRRRR............',
  '...........RRRRRRRRRR...........',
  '..........RRRRRRRRRRRRR.........',
  '.........RRRRRRRRRRRRRRRR.......',
  '........RRRRRRRRRRRRRRRRRR......',
  '.......RRRRRRRRRRRRRRRRRRRR.....',
  '......RRRRRRRRRRRRRRRRRRRRRRR...',
  '.....SSSSSSSSSSSSSSSSSSSSSSSS...',
  '.....SWWWWWWSSSSSSSSSWWWWWWWS...',
  '.....SWLLLLLWSSSSSSSWLLLLLWWS...',
  '.....SWLLLLLWSSSSSSSWLLLLLWWS...',
  '.....SWLLLLLWSSSSSSSWLLLLLWWS...',
  '.....SWWWWWWSSSSSSSSSWWWWWWWS...',
  '.....SSSSSSSSSSSSSSSSSSSSSSSS...',
  '.....SSSSSSSSSSSSSSSSSSSSSSSS...',
  '.....SWWWWWWSSSSSSSSSWWWWWWWS...',
  '.....SWLLLLLWSSSSSSSWLLLLLWWS...',
  '.....SWLLLLLWSSSSSSSWLLLLLWWS...',
  '.....SWLLLLLWSSSSSSSWLLLLLWWS...',
  '.....SWWWWWWSSSSSSSSSWWWWWWWS...',
  '.....SSSSSSSSDDDDDDSSSSSSSSSS...',
  '.....SSSSSSSSDDDDDDSSSSSSSSSS...',
  '.....SSSSSSSSDDDDDDSSSSSSSSSS...',
  '.....SSSSSSSSDDDDDDSSSSSSSSSS...',
  '.....GGGGGGGGGGGGGGGGGGGGGGGG...',
  '....GGFGGGGGGGGGGGGGGGGGGFGGG...',
  '....GGGGGGGGGGGGGGGGGGGGGGGGG...',
  '................................',
  '................................',
  '................................'
]);

// Color mapping for cottage
export const HOUSE_COTTAGE_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'R': TOWN_COLORS.ROOF_RED,
  'S': TOWN_COLORS.STONE_LIGHT,
  'W': TOWN_COLORS.WOOD_DARK,
  'L': TOWN_COLORS.WINDOW_GLOW,
  'D': TOWN_COLORS.DOOR_WOOD,
  'G': TOWN_COLORS.GRASS_MEDIUM,
  'F': TOWN_COLORS.FLOWER_PINK,
};

// Small shop (32x32)
export const SHOP_GENERAL = createSprite32([
  '................................',
  '................................',
  '........BBBBBBBBBBBBBBBB........',
  '.......BBBBBBBBBBBBBBBBBBB......',
  '......BBBBBBBBBBBBBBBBBBBBBB....',
  '.....BBBBBBBBBBBBBBBBBBBBBBBB...',
  '....BBBBBBBBBBBBBBBBBBBBBBBBBB..',
  '....MMMMMMMMMMMMMMMMMMMMMMMMMM..',
  '....MSSSSSSSSSSSSSSSSSSSSSSSSM..',
  '....MSAAAAAAAAAAAAAAAAAAAAAASM..',
  '....MSASSSSSSSSSSSSSSSSSSSSASM..',
  '....MSASGGGGGGGGGGGGGGGGGGSASM..',
  '....MSASGLLLLLLLLLLLLLLLLGSASM..',
  '....MSASGLLLLLLLLLLLLLLLLGSASM..',
  '....MSASGLLLLLLLLLLLLLLLLGSASM..',
  '....MSASGGGGGGGGGGGGGGGGGGSASM..',
  '....MSASSSSSSSSSSSSSSSSSSSSASM..',
  '....MSAAAAAAAAAAAAAAAAAAAAAASM..',
  '....MSASSSSSSSSSSSSSSSSSSSSASM..',
  '....MSASGGGGGGDDDDDGGGGGGGSASM..',
  '....MSASGGGGGGDPPPDGGGGGGGSASM..',
  '....MSASGGGGGGDPPPDGGGGGGGSASM..',
  '....MSASGGGGGGDDDDDGGGGGGGSASM..',
  '....MSASSSSSSSSSSSSSSSSSSSSASM..',
  '....MSSSSSSSSSSSSSSSSSSSSSSSSM..',
  '....MMMMMMMMMMMMMMMMMMMMMMMMMM..',
  '....PPPPPPPPPPPPPPPPPPPPPPPPPP..',
  '....PPPPPPPPPPPPPPPPPPPPPPPPPP..',
  '................................',
  '................................',
  '................................',
  '................................'
]);

// Shop colors
export const SHOP_GENERAL_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'B': TOWN_COLORS.ROOF_BLUE,
  'M': TOWN_COLORS.WOOD_DARK,
  'S': TOWN_COLORS.WOOD_MEDIUM,
  'A': TOWN_COLORS.WOOD_LIGHT,
  'G': TOWN_COLORS.WINDOW_GLASS,
  'L': TOWN_COLORS.WINDOW_GLOW,
  'D': TOWN_COLORS.DOOR_WOOD,
  'P': TOWN_COLORS.PATH_STONE,
};

// Music venue (32x32) - Cozy underground spot
export const VENUE_BASEMENT = createSprite32([
  '................................',
  '................................',
  '......DDDDDDDDDDDDDDDDDDDD......',
  '.....DDRRRRRRRRRRRRRRRRRRDD.....',
  '....DDRRRRRRRRRRRRRRRRRRRRRDD...',
  '...DDRRRRRRRRRRRRRRRRRRRRRRRRDD.',
  '...DRRRRRRRRRRRRRRRRRRRRRRRRRRD.',
  '...DRRMMMMMMMMMMMMMMMMMMMMMMMRD.',
  '...DRRMBBBBBBBBBBBBBBBBBBBBMMRD.',
  '...DRRMBNNNNNNNNNNNNNNNNNNNBMRD.',
  '...DRRMBNPPPPPPPPPPPPPPPPPPBMRD.',
  '...DRRMBNPPPPPPPPPPPPPPPPPPBMRD.',
  '...DRRMBNPPPMUSICPPCLUBPPPPBMRD.',
  '...DRRMBNPPPPPPPPPPPPPPPPPPBMRD.',
  '...DRRMBNPPPPPPPPPPPPPPPPPPBMRD.',
  '...DRRMBNNNNNNNNNNNNNNNNNNNBMRD.',
  '...DRRMBBBBBBBBBBBBBBBBBBBBMMRD.',
  '...DRRMMMMMMMMMMMMMMMMMMMMMMMRD.',
  '...DRRMWWWWWWWWWWWWWWWWWWWWMMRD.',
  '...DRRMWGGGGGGDDDDDGGGGGGGWMMRD.',
  '...DRRMWGGGGGGDSSSDGGGGGGGWMMRD.',
  '...DRRMWGGGGGGDSSSDGGGGGGGWMMRD.',
  '...DRRMWGGGGGGDDDDDGGGGGGGWMMRD.',
  '...DRRMWWWWWWWWWWWWWWWWWWWWMMRD.',
  '...DRRMMMMMMMMMMMMMMMMMMMMMMMRD.',
  '...DRRRRRRRRRRRRRRRRRRRRRRRRRD.',
  '....DDRRRRRRRRRRRRRRRRRRRRRDD...',
  '.....DDDDDDDDDDDDDDDDDDDDDD.....',
  '......SSSSSSSSSSSSSSSSSSSS......',
  '................................',
  '................................',
  '................................'
]);

// Venue colors
export const VENUE_BASEMENT_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'D': TOWN_COLORS.STONE_DARK,
  'R': TOWN_COLORS.BRICK_DARK,
  'M': TOWN_COLORS.BRICK_MEDIUM,
  'B': TOWN_COLORS.BLACK,
  'N': TOWN_COLORS.NEON_PINK,
  'P': TOWN_COLORS.NEON_BLUE,
  'W': TOWN_COLORS.WOOD_DARK,
  'G': TOWN_COLORS.WINDOW_DARK,
  'S': TOWN_COLORS.DOOR_PAINT,
  'MUSIC': TOWN_COLORS.WHITE,
  'CLUB': TOWN_COLORS.WHITE,
};

// Town square fountain (32x32)
export const FOUNTAIN = createSprite32([
  '................................',
  '................................',
  '................................',
  '................................',
  '..........SSSSSSSSSSSS..........',
  '.........SSSSSSSSSSSSSS.........',
  '........SSSWWWWWWWWWWSSS........',
  '.......SSSWWWWWWWWWWWWSSS.......',
  '......SSSWWWBBBBBBBWWWWSSS......',
  '.....SSSWWWBBBBBBBBBWWWWSSS.....',
  '.....SSWWWBBBWWWWWBBBWWWWSS.....',
  '....SSWWWBBBWWWWWWWBBBWWWWSS....',
  '....SSWWBBBWWWWWWWWWBBBWWWSS....',
  '....SSWWBBBWWWSSSWWWBBBWWWSS....',
  '....SSWWBBBWWWSSSWWWBBBWWWSS....',
  '....SSWWBBBWWWSSSWWWBBBWWWSS....',
  '....SSWWBBBWWWSSSWWWBBBWWWSS....',
  '....SSWWBBBWWWWWWWWWBBBWWWSS....',
  '....SSWWWBBBWWWWWWWBBBWWWWSS....',
  '.....SSWWWBBBWWWWWBBBWWWWSS.....',
  '.....SSSWWWBBBBBBBBBWWWWSSS.....',
  '......SSSWWWBBBBBBBWWWWSSS......',
  '.......SSSWWWWWWWWWWWSSS........',
  '........SSSWWWWWWWWWSSS.........',
  '.........SSSSSSSSSSSSSS.........',
  '..........SSSSSSSSSSSS..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
]);

// Fountain colors
export const FOUNTAIN_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'S': TOWN_COLORS.FOUNTAIN_STONE,
  'W': TOWN_COLORS.WATER_LIGHT,
  'B': TOWN_COLORS.WATER_DARK,
};

// Tree (32x32)
export const TREE_OAK = createSprite32([
  '................................',
  '................................',
  '................................',
  '..........LLLLLLLLLL............',
  '........LLLLLLLLLLLLLL..........',
  '.......LLLLLLLLLLLLLLLL.........',
  '......LLLLLLLLLLLLLLLLLL........',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '....LLLLLLLLLLLLLLLLLLLLLL......',
  '....LLLLLLLLLLLLLLLLLLLLLL......',
  '....LLLLLLLLLLLLLLLLLLLLLL......',
  '....LLLLLLLLLLLLLLLLLLLLLL......',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '......LLLLLLLLLLLLLLLLLL........',
  '.......LLLLLLLLLLLLLLLL.........',
  '........LLLLLLLLLLLLLL..........',
  '..........LLLLLLLLLL............',
  '............TTTTTT..............',
  '............TTTTTT..............',
  '............TTTTTT..............',
  '............TTTTTT..............',
  '............TTTTTT..............',
  '............TTTTTT..............',
  '...........TTTTTTTT.............',
  '..........TTTTTTTTTT............',
  '.........TTTTTTTTTTTT...........',
  '........GGGGGGGGGGGGGG..........',
  '........GGGGGGGGGGGGGG..........',
  '................................',
  '................................'
]);

// Tree colors
export const TREE_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'L': TOWN_COLORS.TREE_LEAVES,
  'T': TOWN_COLORS.TREE_TRUNK,
  'G': TOWN_COLORS.GRASS_DARK,
};

// Road tiles (32x32)
export const ROAD_HORIZONTAL = createSprite32([
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS'
]);

// Road colors
export const ROAD_COLORS: Record<string, string> = {
  'S': TOWN_COLORS.PATH_STONE,
  'A': TOWN_COLORS.ROAD_ASPHALT,
  'L': TOWN_COLORS.FLOWER_YELLOW,
};

// Grass tile (32x32)
export const GRASS_TILE = createSprite32([
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGDGGGGGGGGGDGGGGGGGDGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGDGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGDGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGDGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGDGGGGG',
  'GGGGGGGGGDGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGDGGGGGGGGGGGGGGGGGDGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGDGGGGGGGGGGGGGGGDGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGDGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGDGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGDGGGGGGGGGGGGGGGGGGGGGGGDGGGGG',
  'GGGGGGGGGGGGDGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGDGGGGGGGGGGGGDGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGDGGGGG',
  'GGDGGGGGGGGGDGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGDGGGGGGGGGGG',
  'GGGGGDGGGGGGGGGGGGGGGGGGGGGGDGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGDGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGDGGGGGGGGGGGGGDGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGDGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'
]);

// Grass colors
export const GRASS_COLORS: Record<string, string> = {
  'G': TOWN_COLORS.GRASS_MEDIUM,
  'D': TOWN_COLORS.GRASS_DARK,
};

// Town house (32x32) - Different style
export const HOUSE_TOWNHOUSE = createSprite32([
  '................................',
  '................................',
  '..........BBBBBBBBBB............',
  '.........BBBBBBBBBBBB...........',
  '........BBBBBBBBBBBBBB..........',
  '.......BBBBBBBBBBBBBBBB.........',
  '......BBBBBBBBBBBBBBBBBB........',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '.....LWWWWWWLLLLLLWWWWWWL.......',
  '.....LWDDDDDWLLLLWDDDDDWL.......',
  '.....LWDDDDDWLLLLWDDDDDWL.......',
  '.....LWDDDDDWLLLLWDDDDDWL.......',
  '.....LWWWWWWLLLLLLWWWWWWL.......',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '.....LLLLLLLLLLLLLLLLLLLL.......',
  '.....LWWWWWWLLLLLLWWWWWWL.......',
  '.....LWDDDDDWLLLLWDDDDDWL.......',
  '.....LWDDDDDWLLLLWDDDDDWL.......',
  '.....LWDDDDDWLLLLWDDDDDWL.......',
  '.....LWWWWWWLLLLLLWWWWWWL.......',
  '.....LLLLLLLLDDDDLLLLLLLL.......',
  '.....LLLLLLLLDDPDLLLLLLLL.......',
  '.....LLLLLLLLDDPDLLLLLLLL.......',
  '.....LLLLLLLLDDDDLLLLLLLL.......',
  '.....PPPPPPPPPPPPPPPPPPPP.......',
  '.....PPPPPPPPPPPPPPPPPPPP.......',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
]);

// Townhouse colors
export const HOUSE_TOWNHOUSE_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'B': TOWN_COLORS.ROOF_BROWN,
  'L': TOWN_COLORS.BRICK_LIGHT,
  'W': TOWN_COLORS.WOOD_MEDIUM,
  'D': TOWN_COLORS.WINDOW_DARK,
  'P': TOWN_COLORS.PATH_GRAVEL,
};

// Coffee shop / workplace (32x32)
export const WORKPLACE_COFFEE = createSprite32([
  '................................',
  '................................',
  '.......GGGGGGGGGGGGGGGG.........',
  '......GGGGGGGGGGGGGGGGGG........',
  '.....GGGGGGGGGGGGGGGGGGGG.......',
  '....GGGGGGGGGGGGGGGGGGGGGG......',
  '....WWWWWWWWWWWWWWWWWWWWWW......',
  '....WSSSSSSSSSSSSSSSSSSSSW......',
  '....WSCCCCCCCCCCCCCCCCCCSW......',
  '....WSCOFFEEEEEEEEEEEEECCSW......',
  '....WSCCCCCCCCCCCCCCCCCSW......',
  '....WSSSSSSSSSSSSSSSSSSSSW......',
  '....WGGGGGGGGGGGGGGGGGGGGW......',
  '....WGLLLLLLLLLLLLLLLLLLGW......',
  '....WGLLLLLLLLLLLLLLLLLLGW......',
  '....WGLLLLLLLLLLLLLLLLLLGW......',
  '....WGGGGGGGGGGGGGGGGGGGGW......',
  '....WSSSSSSSSSSSSSSSSSSSSW......',
  '....WSSSSSSSDDDDDSSSSSSSW......',
  '....WSSSSSSSDDPDDSSSSSSSSW......',
  '....WSSSSSSSDDPDDSSSSSSSSW......',
  '....WSSSSSSSDDDDDSSSSSSSW......',
  '....WWWWWWWWWWWWWWWWWWWWW......',
  '....PPPPPPPPPPPPPPPPPPPPPP......',
  '....PPPPPPPPPPPPPPPPPPPPPP......',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
]);

// Coffee shop colors
export const WORKPLACE_COFFEE_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'G': TOWN_COLORS.ROOF_GREEN,
  'W': TOWN_COLORS.WOOD_DARK,
  'S': TOWN_COLORS.WOOD_LIGHT,
  'C': TOWN_COLORS.WHITE,
  'L': TOWN_COLORS.WINDOW_GLOW,
  'D': TOWN_COLORS.DOOR_WOOD,
  'P': TOWN_COLORS.PATH_STONE,
  'COFFEE': TOWN_COLORS.BLACK,
  'E': TOWN_COLORS.BLACK,
};

// Park pavilion (32x32)
export const PARK_PAVILION = createSprite32([
  '................................',
  '................................',
  '................................',
  '............RRRRRR..............',
  '...........RRRRRRRR.............',
  '..........RRRRRRRRRR............',
  '.........RRRRRRRRRRRR...........',
  '........RRRRRRRRRRRRRR..........',
  '.......RRRRRRRRRRRRRRRR.........',
  '......WWWWWWWWWWWWWWWWWW........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......W................W........',
  '......WWWWWWWWWWWWWWWWWW........',
  '......SSSSSSSSSSSSSSSSSS........',
  '......SSSSSSSSSSSSSSSSSS........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
]);

// Pavilion colors
export const PARK_PAVILION_COLORS: Record<string, string> = {
  '.': TOWN_COLORS.TRANSPARENT,
  'R': TOWN_COLORS.ROOF_RED,
  'W': TOWN_COLORS.WOOD_MEDIUM,
  'S': TOWN_COLORS.STONE_LIGHT,
};

// Sprite collection
export const TOWN_SPRITES_32 = {
  // Buildings
  house_cottage: { pattern: HOUSE_COTTAGE, colors: HOUSE_COTTAGE_COLORS },
  house_townhouse: { pattern: HOUSE_TOWNHOUSE, colors: HOUSE_TOWNHOUSE_COLORS },
  shop_general: { pattern: SHOP_GENERAL, colors: SHOP_GENERAL_COLORS },
  venue_basement: { pattern: VENUE_BASEMENT, colors: VENUE_BASEMENT_COLORS },
  workplace_coffee: { pattern: WORKPLACE_COFFEE, colors: WORKPLACE_COFFEE_COLORS },
  park_pavilion: { pattern: PARK_PAVILION, colors: PARK_PAVILION_COLORS },
  
  // Nature
  tree_oak: { pattern: TREE_OAK, colors: TREE_COLORS },
  grass: { pattern: GRASS_TILE, colors: GRASS_COLORS },
  
  // Infrastructure
  road_horizontal: { pattern: ROAD_HORIZONTAL, colors: ROAD_COLORS },
  fountain: { pattern: FOUNTAIN, colors: FOUNTAIN_COLORS },
};

// Helper to apply colors to pattern
export function applyColors(pattern: SpriteData32, colors: Record<string, string>): string[][] {
  return pattern.map(row => 
    row.map(char => {
      // Handle multi-character color keys (like "MUSIC")
      for (const [key, color] of Object.entries(colors)) {
        if (key.length > 1 && row.join('').includes(key)) {
          return color;
        }
      }
      return colors[char] || TOWN_COLORS.TRANSPARENT;
    })
  );
}
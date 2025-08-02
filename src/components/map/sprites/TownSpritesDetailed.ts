// Detailed Stardew Valley style sprites with proper shading and detail
export type DetailedSprite = string[][];

// Rich color palette with shading
export const DETAILED_COLORS = {
  // Transparent
  '.': 'transparent',
  
  // Grass variations
  'g': '#4a7c3c', // Dark grass
  'G': '#5a8c4c', // Medium grass  
  'L': '#6a9c5c', // Light grass
  'f': '#7aac6c', // Bright grass
  
  // Road and path
  'a': '#3e3e3e', // Dark asphalt
  'A': '#4e4e4e', // Medium asphalt
  'R': '#5e5e5e', // Light asphalt
  'r': '#6e6e6e', // Worn asphalt
  'Y': '#f4d03f', // Road line
  'p': '#8b7355', // Dirt path
  'P': '#9b8365', // Light dirt
  's': '#b8b8b8', // Sidewalk
  'S': '#c8c8c8', // Light sidewalk
  
  // Building materials - Wood
  'w': '#654321', // Dark wood
  'W': '#8b6f47', // Medium wood
  'o': '#a0826d', // Light wood
  'O': '#deb887', // Very light wood
  
  // Building materials - Stone/Brick
  'b': '#8b4513', // Dark brick
  'B': '#a0522d', // Medium brick
  'k': '#cd853f', // Light brick
  'K': '#daa520', // Yellow brick
  'd': '#696969', // Dark stone
  'D': '#808080', // Medium stone
  't': '#a9a9a9', // Light stone
  'T': '#c0c0c0', // Very light stone
  
  // Roofing
  'q': '#4b0000', // Dark red roof
  'Q': '#8b0000', // Red roof
  'e': '#006400', // Dark green roof
  'E': '#228b22', // Green roof
  'u': '#191970', // Dark blue roof
  'U': '#4169e1', // Blue roof
  'i': '#654321', // Brown shingle
  'I': '#8b4513', // Light shingle
  
  // Windows and glass
  'c': '#1e90ff', // Window blue
  'C': '#87ceeb', // Window light
  'v': '#fffacd', // Window glow warm
  'V': '#ffffe0', // Window glow bright
  'x': '#2f4f4f', // Dark window
  'X': '#708090', // Window frame
  
  // Doors
  'h': '#654321', // Dark door
  'H': '#8b4513', // Medium door
  'j': '#228b22', // Green door
  'J': '#32cd32', // Light green door
  
  // Nature
  'n': '#228b22', // Tree green dark
  'N': '#32cd32', // Tree green medium
  'm': '#3cb371', // Tree green light
  'M': '#00ff00', // Tree green bright
  'z': '#654321', // Tree trunk dark
  'Z': '#8b4513', // Tree trunk light
  
  // Decorative
  '1': '#ff69b4', // Pink flower
  '2': '#ffff00', // Yellow flower
  '3': '#9370db', // Purple flower
  '4': '#ff0000', // Red accent
  '5': '#ffa500', // Orange accent
  '6': '#0000ff', // Blue accent
  '7': '#808080', // Gray detail
  '8': '#ffffff', // White detail
  '9': '#000000', // Black detail
};

// Detailed cottage house (32x32)
export const HOUSE_DETAILED = [
  '................................',
  '............iiIIIIii............',
  '...........iQQQQQQQQi...........',
  '..........iQQQQQQQQQQi..........',
  '.........iQQQqQQQqQQQQi.........',
  '........iQQQQQQQQQQQQQQi........',
  '.......iQQQqQQQQQQQqQQQQi.......',
  '......iQQQQQQQQQQQQQQQQQQi......',
  '.....iQQQqQQQQQQQQQQQqQQQQi.....',
  '.....tttttttttttttttttttttt.....',
  '.....tDDDDDDDDDDDDDDDDDDDDt.....',
  '.....tDWWWWWDDDDDDDWWWWWDDt.....',
  '.....tDWvvvWDDDDDDDWvvvWDDt.....',
  '.....tDWvCvWDDDDDDDWvCvWDDt.....',
  '.....tDWvvvWDDDDDDDWvvvWDDt.....',
  '.....tDWWWWWDDDDDDDWWWWWDDt.....',
  '.....tDDDDDDDDDDDDDDDDDDDDt.....',
  '.....tDWWWWWDDDDDDDWWWWWDDt.....',
  '.....tDWvvvWDDDDDDDWvvvWDDt.....',
  '.....tDWvCvWDDDDDDDWvCvWDDt.....',
  '.....tDWvvvWDDDDDDDWvvvWDDt.....',
  '.....tDWWWWWDDHHHDDWWWWWDDt.....',
  '.....tDDDDDDDDHjHDDDDDDDDDt.....',
  '.....tttttttttttttttttttttt.....',
  '.....sssssssssssssssssssssss....',
  '.....pppppppppppppppppppppp.....',
  '....GGfGGGGGGGGGGGGGGGGfGGG.....',
  '....GG1GGGGGGGGGGGGGGGG2GGG.....',
  '....GGGGGGGGGGGGGGGGGGGGGGG.....',
  '................................',
  '................................',
  '................................'
];

// Modern shop with awning (32x32)
export const SHOP_MODERN = [
  '................................',
  '................................',
  '.......UUUUUUUUUUUUUUUUU........',
  '......UUUUUUuUUUUuUUUUUUU.......',
  '.....UUUUUUUUUUUUUUUUUUUUu......',
  '.....8888888888888888888888.....',
  '.....84444488888888884444488....',
  '.....84444488888888884444488....',
  '.....8888888888888888888888.....',
  '.....TTTTTTTTTTTTTTTTTTTTTT.....',
  '.....TooooooooooooooooooooT.....',
  '.....ToCCCCCCCCCCCCCCCCCCoT.....',
  '.....ToCvvvvvvvvvvvvvvvvCoT.....',
  '.....ToCvvvvvvvvvvvvvvvvCoT.....',
  '.....ToCvvvvvvvvvvvvvvvvCoT.....',
  '.....ToCCCCCCCCCCCCCCCCCCoT.....',
  '.....TooooooooooooooooooooT.....',
  '.....ToooooooooooooooooooooT.....',
  '.....TooooooooHHHHoooooooooT.....',
  '.....TooooooooHJJHoooooooooT.....',
  '.....TooooooooHJJHoooooooooT.....',
  '.....TooooooooHHHHoooooooooT.....',
  '.....TTTTTTTTTTTTTTTTTTTTTT.....',
  '.....SSSSSSSSSSSSSSSSSSSSSS.....',
  '.....ssssssssssssssssssssss.....',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
];

// Underground music venue (32x32)
export const VENUE_UNDERGROUND = [
  '................................',
  '................................',
  '.......99999999999999999........',
  '......9bbbbbbbbbbbbbbbbb9.......',
  '.....9bBBBBBBBBBBBBBBBBBb9......',
  '.....9bB4444444444444444Bb9.....',
  '.....9bB4MUSIC44CLUB4444Bb9.....',
  '.....9bB4444444444444444Bb9.....',
  '.....9bBBBBBBBBBBBBBBBBBBb9.....',
  '.....9bbbbbbbbbbbbbbbbbbbb9.....',
  '.....9KKKKKKKKKKKKKKKKKKKK9.....',
  '.....9KwwwwwwwwwwwwwwwwwwK9.....',
  '.....9KwxxxwxxxxxxwxxxwxxK9.....',
  '.....9KwxxxwxxxxxxwxxxwxxK9.....',
  '.....9KwxxxwxxxxxxwxxxwxxK9.....',
  '.....9KwwwwwwwwwwwwwwwwwwK9.....',
  '.....9KKKKKKKKKKKKKKKKKKKK9.....',
  '.....9KKKKKKKKKKKKKKKKKKKk9.....',
  '.....9KKKKKKKHHHHKKKKKKKKk9.....',
  '.....9KKKKKKKHhhHKKKKKKKKk9.....',
  '.....9KKKKKKKHhhHKKKKKKKKk9.....',
  '.....9KKKKKKKHHHHKKKKKKKKk9.....',
  '.....9kkkkkkkkkkkkkkkkkkkk9.....',
  '.....999999999999999999999......',
  '.....aaaaaaaaaaaaaaaaaaaaa......',
  '.....AAAAAAAAAAAAAAAAAAAAA......',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
];

// Beautiful oak tree (32x32)
export const TREE_DETAILED = [
  '................................',
  '................................',
  '............mmmmmm..............',
  '...........mNNNNNNm.............',
  '..........mNNnnnNNNm............',
  '.........mNNnnnnnNNNm...........',
  '........mNNnnnnnnnNNNm..........',
  '.......mNNnnNNNNnnnNNNm.........',
  '......mNNnnnNNNNNnnnNNNm........',
  '.....mNNnnnNNNNNNnnnNNNNm.......',
  '.....mNNnnnNNNNNNnnnNNNNm.......',
  '.....mNNNnnNNNNNNnnNNNNNm.......',
  '.....mNNNNnnnNNnnnNNNNNNm.......',
  '......mNNNNnnNNnnNNNNNNm........',
  '.......mNNNNnNNnNNNNNNm.........',
  '........mNNNNNNNNNNNNm..........',
  '.........mmmNNNNNNmmm...........',
  '............ZZZZZZ..............',
  '............ZzzzzZ..............',
  '............ZzzzzZ..............',
  '............ZzzzzZ..............',
  '...........ZZzzzzZZ.............',
  '..........ZZZzzzzZZZ............',
  '.........gGGGGGGGGGGg...........',
  '.........GGGgggggGGGG...........',
  '.........GGGGGGGGGGGg...........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
];

// Decorative fountain (32x32)
export const FOUNTAIN_DETAILED = [
  '................................',
  '................................',
  '................................',
  '.........tttttttttttt...........',
  '........tTTTTTTTTTTTTt..........',
  '.......tTDDDDDDDDDDDDTt.........',
  '......tTDddddddddddddDTt........',
  '.....tTDd666666666666dDTt.......',
  '.....tTDd666666666666dDTt.......',
  '.....tTDd666cCCCc6666dDTt.......',
  '.....tTDd666CVVVC6666dDTt.......',
  '.....tTDd666CVVVC6666dDTt.......',
  '.....tTDd666CVVVC6666dDTt.......',
  '.....tTDd666cCCCc6666dDTt.......',
  '.....tTDd666666666666dDTt.......',
  '.....tTDd666666666666dDTt.......',
  '.....tTDddddddddddddddDTt.......',
  '......tTDDDDDDDDDDDDDDTt........',
  '.......tTTTTTTTTTTTTTTt.........',
  '........tttttttttttttt..........',
  '.........SSSSSSSSSSSS...........',
  '.........ssssssssssss...........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................'
];

// Grass tile with variations (32x32)
export const GRASS_DETAILED = [
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg',
  'GGGLGGGGGGGGgGGGGGGGgGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGgGGGG',
  'GgGGGGGfGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGgGGGGGGGGGGGGGGG',
  'GGGGGgGGGGGGGGGGGGGGGGfGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGgGGGG',
  'GGgGGGGGGgGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGgGGGGGGgGGGGGGGGGG',
  'GGLGGGGGGGGGGGGGGGGGGGGGGGGGGGGg',
  'GGGGGGGGGGGgGGGGGGGGGGGGGGgGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg',
  'GGGGGgGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGgGGGGGGGGGGGGGGG',
  'GgGGGGGGGGGGGGGGGGGGGGGfGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGgGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGgGGGGGGGGGGGGGGGG',
  'GGGGGgGGGGGGGGGGGGGGGgGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGgGGGGGGGGGGGGGGgGGGG',
  'GGgGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGgGGGGGGGGGGGG',
  'GGGGGGGGGfGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGgGGGGGGGGGGGGGGGGGGgGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGgGGGGGGGGGGGGGGGGGG',
  'GGLGGGGGGGGGGGGGGGGGGGGGGGGGGGGg',
  'GGGGGGGGGgGGGGGGGGgGGGGGGGGGGGGG',
  'GgGGGGGGGGGGGGGGGGGGGGGGGGGgGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'
];

// Road tile horizontal (32x32)
export const ROAD_DETAILED = [
  'ssssssssssssssssssssssssssssssss',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'ssssssssssssssssssssssssssssssss',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaA',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'ssssssssssssssssssssssssssssssss',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'ssssssssssssssssssssssssssssssss'
];

// Export sprite collection
export const DETAILED_SPRITES = {
  house: HOUSE_DETAILED,
  shop: SHOP_MODERN,
  venue: VENUE_UNDERGROUND,
  tree: TREE_DETAILED,
  fountain: FOUNTAIN_DETAILED,
  grass: GRASS_DETAILED,
  road: ROAD_DETAILED,
};

// Helper to convert sprite to colored pixels
export function applyDetailedColors(sprite: string[]): string[][] {
  return sprite.map(row => 
    row.split('').map(char => DETAILED_COLORS[char] || 'transparent')
  );
}
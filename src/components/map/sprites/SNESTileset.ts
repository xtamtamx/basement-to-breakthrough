// High-quality SNES JRPG-style tileset
// Using techniques from games like Chrono Trigger, Secret of Mana, Final Fantasy VI

export const SNES_PALETTE = {
  // Transparent
  '_': 'transparent',
  
  // Grass shades (vibrant JRPG greens)
  'A': '#2d5016', // Very dark grass
  'B': '#3e6f1f', // Dark grass
  'C': '#4f8b29', // Medium grass
  'D': '#60a633', // Light grass
  'E': '#71c23d', // Bright grass
  'F': '#82de47', // Very bright grass
  
  // Path/Road shades
  'G': '#4a3c28', // Dark dirt
  'H': '#5e4e3a', // Medium dirt
  'I': '#72614c', // Light dirt
  'J': '#3d3d3d', // Dark stone
  'K': '#525252', // Medium stone
  'L': '#676767', // Light stone
  'M': '#7c7c7c', // Very light stone
  
  // Building materials
  'N': '#8b4513', // Dark wood
  'O': '#a0522d', // Medium wood
  'P': '#cd853f', // Light wood
  'Q': '#daa520', // Golden wood
  'R': '#654321', // Very dark wood
  'S': '#d2691e', // Orange wood
  
  // Roof colors
  'T': '#b22222', // Dark red roof
  'U': '#dc143c', // Bright red roof
  'V': '#228b22', // Dark green roof
  'W': '#32cd32', // Bright green roof
  'X': '#4169e1', // Blue roof
  'Y': '#6495ed', // Light blue roof
  'Z': '#483d8b', // Dark purple roof
  
  // Wall colors
  'a': '#f5deb3', // Wheat wall
  'b': '#ffe4b5', // Light beige wall
  'c': '#ffdead', // Navajo white
  'd': '#d3d3d3', // Light gray
  'e': '#c0c0c0', // Silver
  'f': '#a9a9a9', // Dark gray
  'g': '#dcdcdc', // Gainsboro
  
  // Windows and details
  'h': '#87ceeb', // Sky blue window
  'i': '#4682b4', // Steel blue window
  'j': '#191970', // Midnight blue window
  'k': '#ffd700', // Gold detail
  'l': '#ff6347', // Tomato detail
  'm': '#da70d6', // Orchid detail
  'n': '#98fb98', // Pale green detail
  'o': '#ff69b4', // Hot pink detail
  
  // Special colors
  'p': '#000000', // Black
  'q': '#ffffff', // White
  'r': '#8b4513', // Saddle brown
  's': '#2f4f4f', // Dark slate gray
  't': '#708090', // Slate gray
  'u': '#b0c4de', // Light steel blue
  'v': '#f0e68c', // Khaki
  'w': '#fafad2', // Light golden rod
  'x': '#ff1493', // Deep pink
  'y': '#00ced1', // Dark turquoise
  'z': '#9370db', // Medium purple
};

// Beautiful house with depth and shading (16x16)
export const SNES_HOUSE = [
  '____TTTTTTTT____',
  '___TUUUUUUUUx___',
  '__TUUUUUUUUUUx__',
  '_TUUUttttttUUUx_',
  '_xaaaabbaaaaax_',
  '_xahhaabaahhax_',
  '_xaiiaabaaiiax_',
  '_xahhaabaahhax_',
  '_xaaaabbaaaaax_',
  '_xaaaaRRaaaaax_',
  '_xaaaaRNaaaaax_',
  '_xxxxxRRxxxxxx_',
  '__IIHHHHHHHII___',
  '__IIIIIIIIIII___',
  '___CCDDDDDDCC___',
  '________________'
];

// Fancy shop with awning (16x16)
export const SNES_SHOP = [
  '___kkkkkkkkk____',
  '__kllllllllkk___',
  '_klllllllllllk__',
  '_kggggggggggkk__',
  '_kghhhhhhhhgkk__',
  '_kghiiiiihggkk__',
  '_kghiiiiihggkk__',
  '_kghhhhhhhhgkk__',
  '_kggggggggggkk__',
  '_kgggRRRRgggkk__',
  '_kgggRNNRgggkk__',
  '_kkkkkRRkkkkkk__',
  '__LLKKKKKKKLL___',
  '__LLLLLLLLLL____',
  '___BCCCCCCBB____',
  '________________'
];

// Music venue with neon lights (16x16)
export const SNES_VENUE = [
  '___pppppppppp___',
  '__pzzzzzzzzzzp__',
  '_pzmzmzmzmzmzp__',
  '_pzzzzzzzzzzzp__',
  '_pssssssssssp___',
  '_psjjjjjjjjsp___',
  '_psjiiiiijjsp___',
  '_psjiiiiijjsp___',
  '_psjjjjjjjjsp___',
  '_pssssRRssssp___',
  '_psssRNNRsssp___',
  '_pppppppppppp___',
  '__JJJJJJJJJJ____',
  '__KKKKKKKKKK____',
  '___AABBBBAA_____',
  '________________'
];

// Beautiful tree with shadows (16x16)
export const SNES_TREE = [
  '________________',
  '____VVWWVV______',
  '___VWWWWWWV_____',
  '__VWWWWWWWWV____',
  '__VWWnnnnWWV____',
  '__VWWnnnnWWV____',
  '__VWWWWWWWWV____',
  '___VWWWWWWV_____',
  '____VVWWVV______',
  '______RR________',
  '______RN________',
  '______RR________',
  '_____AARR_______',
  '____AABBAA______',
  '___AAABBAAA_____',
  '________________'
];

// Decorative fountain (16x16)
export const SNES_FOUNTAIN = [
  '________________',
  '____tttttttt____',
  '___tuuuuuuuut___',
  '__tuuhhhhhhuut__',
  '__tuhyyyyyhuut__',
  '__tuhyhhhyhuut__',
  '__tuhyhqhyhuut__',
  '__tuhyhhhyhuut__',
  '__tuhyhhhyhuut__',
  '__tuhyyyyyhuut__',
  '__tuuhhhhhhuut__',
  '___tuuuuuuuut___',
  '____tttttttt____',
  '___KKKKKKKKKK___',
  '____LLLLLLLL____',
  '________________'
];

// High-quality road tile with detail (16x16)
export const SNES_ROAD_H = [
  'EEEDDDDDDDDDDEE',
  'EDDCCCCCCCCCCDE',
  'DCCBBBBBBBBBBCD',
  'KKKKKKKKKKKKKKKK',
  'LLLLLLLLLLLLLLLL',
  'LLLJJJJJJJJJJLLL',
  'LLJJqqqqqqqqJJLL',
  'LLJJqqqqqqqqJJLL',
  'LLJJqqqqqqqqJJLL',
  'LLJJqqqqqqqqJJLL',
  'LLLJJJJJJJJJJLLL',
  'LLLLLLLLLLLLLLLL',
  'KKKKKKKKKKKKKKKK',
  'DCCBBBBBBBBBBCD',
  'EDDCCCCCCCCCCDE',
  'EEEDDDDDDDDDDEE'
];

// Vertical road (16x16)
export const SNES_ROAD_V = [
  'EEDKLLLLLLLLKDE',
  'EDCKLLLLLLLKCDE',
  'DCBKLLLJJLLKBCD',
  'DCBKLLJJJJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLJJQQJLKBCD',
  'DCBKLLJJJJLKBCD',
  'DCBKLLLJJLLKBCD',
  'EDCKLLLLLLLKCDE',
  'EEDKLLLLLLLLKDE'
];

// Beautiful grass with flowers (16x16)
export const SNES_GRASS = [
  'DDEEEDDDEEEDDDEE',
  'DDDEEDDDEEDDDEED',
  'CDDDDCDDDDCDDDDD',
  'CCDDCCCDDCCCDDCC',
  'BCCCCBCCCCBCCCCC',
  'BBCBBBCBBBCBBBCB',
  'ABBBBABBBBABBBBA',
  'AABnAAAABAAAABAA',
  'AAAAAAAAoAAAAAAA',
  'AABAAABAAABAAAAB',
  'ABBBBABBBBABBBBA',
  'BBCBBBCBBBCBBBCB',
  'BCCCCBCCCCBCCCCC',
  'CCDDCCCDDCCCDDCC',
  'CDDDDCDDDDCDDDDD',
  'DDDEEDDDEEDDDEED'
];

// Plaza/courtyard stone (16x16)
export const SNES_PLAZA = [
  'eeggggeeggggeegg',
  'edddddedddddeddd',
  'edfffdedfffdedff',
  'edfffdedfffdedff',
  'edfffdedfffdedff',
  'edddddedddddeddd',
  'eeggggeeggggeegg',
  'gggggggggggggggg',
  'eeggggeeggggeegg',
  'edddddedddddeddd',
  'edfffdedfffdedff',
  'edfffdedfffdedff',
  'edfffdedfffdedff',
  'edddddedddddeddd',
  'eeggggeeggggeegg',
  'gggggggggggggggg'
];

// Town hall/community center (16x16)
export const SNES_TOWNHALL = [
  '___ZZZZZZZZZZ___',
  '__ZXXXXXXXXXXz__',
  '_ZXXYYYYYYYYXXz_',
  '_zeeeeeeeeeeez__',
  '_zehhhhhhhhhez__',
  '_zehiiiiiihez___',
  '_zehiiqqiihez___',
  '_zehiiiiiihez___',
  '_zehhhhhhhhhez__',
  '_zeeeeRReeeeez__',
  '_zeeeRNNReeeez__',
  '_zzzzzRRzzzzzz__',
  '__MMLLLLLLLMM___',
  '__MMMMMMMMMM____',
  '___BCCCCCCBB____',
  '________________'
];

// Apply SNES palette to sprite pattern
export function renderSNESSprite(pattern: string[]): string[][] {
  return pattern.map(row => 
    row.split('').map(char => SNES_PALETTE[char] || 'transparent')
  );
}

// Tile metadata for proper layering
export const TILE_DEPTHS = {
  grass: 0,
  road: 1,
  plaza: 1,
  building_shadow: 2,
  building: 3,
  tree: 4,
  decoration: 5
};
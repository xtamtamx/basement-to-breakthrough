// Top-down view sprites that actually look like buildings from above
// Using a limited, cohesive color palette for a clean look

export const TOPDOWN_COLORS = {
  // Transparent
  '_': 'transparent',
  
  // Roofs
  'R': '#8B4513', // Brown roof
  'r': '#A0522D', // Light brown roof
  'B': '#2F4F4F', // Dark slate roof
  'b': '#708090', // Light slate roof
  'G': '#556B2F', // Dark green roof
  'g': '#8FBC8F', // Light green roof
  'O': '#D2691E', // Orange tile roof
  'o': '#DEB887', // Light orange roof
  
  // Walls/Buildings
  'W': '#F5DEB3', // Wheat/beige wall
  'w': '#FFE4B5', // Light beige wall
  'S': '#D3D3D3', // Light gray stone
  's': '#A9A9A9', // Dark gray stone
  'K': '#8B7355', // Brick color
  'k': '#A0826D', // Light brick
  
  // Details
  'D': '#654321', // Dark brown (doors)
  'd': '#8B4513', // Medium brown
  'X': '#87CEEB', // Window blue
  'x': '#4682B4', // Dark window
  'Y': '#FFD700', // Yellow (lights)
  'P': '#FFC0CB', // Pink accent
  'p': '#FFB6C1', // Light pink
  'M': '#9370DB', // Purple (music venue)
  'm': '#BA55D3', // Light purple
  
  // Ground/Nature
  'T': '#228B22', // Tree green
  't': '#32CD32', // Light tree green
  'H': '#696969', // Dark path
  'h': '#808080', // Light path
  '1': '#000000', // Black
  '2': '#FFFFFF', // White
  '3': '#4169E1', // Blue
};

// Simple house - recognizable roof shape (16x16)
export const HOUSE_TOPDOWN = [
  '____RRRRRRRR____',
  '___RrrrrrrrrR___',
  '__RrrrrrrrrrrR__',
  '_RrrrrrrrrrrrrR_',
  '_RWWWWwwWWWWWR_',
  '_RWXXWwwWXXWWR_',
  '_RWXXWwwWXXWWR_',
  '_RWWWWwwWWWWWR_',
  '_RWWWWDDWWWWWR_',
  '_RWWWWddWWWWWR_',
  '_RWWWWWWWWWWWR_',
  '_RRRRRRRRRRRRRR_',
  '__hhhhhhhhhhh___',
  '__hHHHHHHHHHh___',
  '________________',
  '________________'
];

// Shop with distinct awning (16x16)
export const SHOP_TOPDOWN = [
  '___BBBBBBBBBB___',
  '__BbbbbbbbbbB__',
  '_BbbbbbbbbbbbbB_',
  '_BSSSSSSSSSSSB_',
  '_BSXXXXXXXXXXXB_',
  '_BSXXXshopXXXSB_',
  '_BSXXXXXXXXXXXB_',
  '_BSSSSSSSSSSSB_',
  '_BSSSDDDDDSSSB_',
  '_BSSSddddSSSSB_',
  '_BBBBBBBBBBBBB_',
  '___3333333333___',
  '__hHHHHHHHHHh___',
  '__hhhhhhhhhhh___',
  '________________',
  '________________'
];

// Music venue - industrial look (16x16)
export const VENUE_TOPDOWN = [
  '___1111111111___',
  '__111MMMMMM111__',
  '_11MmmmmmmmMM11_',
  '_1MmYYmmYYmmM1_',
  '_1MmYYmmYYmmM1_',
  '_1MmmmmmmmmmM1_',
  '_1KKKKKKKKKKKK1_',
  '_1KXXXkkkXXXK1_',
  '_1KXXXkkkXXXK1_',
  '_1KKKDDDDKKKK1_',
  '_1KKKddddKKKK1_',
  '_11111111111111_',
  '__hHHHHHHHHHh___',
  '__hhhhhhhhhhh___',
  '________________',
  '________________'
];

// Simple tree from above (16x16)
export const TREE_TOPDOWN = [
  '________________',
  '____tttttttt____',
  '___tTTTTTTTTt___',
  '__tTTttTTttTTt__',
  '__tTttttttttTt__',
  '__tTTttTTttTTt__',
  '__tTTTTTTTTTTt__',
  '__tTTTTTTTTTTt__',
  '__tTTTTTTTTTTt__',
  '___tTTTTTTTTt___',
  '____tttttttt____',
  '_____dddddd_____',
  '______dddd______',
  '________________',
  '________________',
  '________________'
];

// Road intersection piece (16x16)
export const ROAD_CROSS = [
  'hHHHHHHHHHHHHHHh',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHH2222222HHHHH',
  'HHHH2222222HHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHH2222222HHHHH',
  'HHHH2222222HHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'hHHHHHHHHHHHHHHh'
];

// Horizontal road (16x16)
export const ROAD_H_TOPDOWN = [
  '________________',
  '________________',
  '________________',
  'hhhhhhhhhhhhhhhh',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'HHHH222222222HHH',
  'HHHH222222222HHH',
  'HHHH222222222HHH',
  'HHHH222222222HHH',
  'HHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHH',
  'hhhhhhhhhhhhhhhh',
  '________________',
  '________________',
  '________________'
];

// Vertical road (16x16)
export const ROAD_V_TOPDOWN = [
  '___hHHHHHHHh____',
  '___hHHHHHHHh____',
  '___hHHHHHHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHH22HHHh____',
  '___hHHHHHHHh____',
  '___hHHHHHHHh____',
  '___hHHHHHHHh____',
  '________________'
];

// Grass with subtle variation (16x16)
export const GRASS_TOPDOWN = [
  'tTttTTttTTttTTtt',
  'TttTttTttTttTttT',
  'ttTTttTTttTTttTT',
  'TttTttTttTttTttT',
  'tTttTTttTTttTTtt',
  'TttTttTttTttTttT',
  'ttTTttTTttTTttTT',
  'TttTttTttTttTttT',
  'tTttTTttTTttTTtt',
  'TttTttTttTttTttT',
  'ttTTttTTttTTttTT',
  'TttTttTttTttTttT',
  'tTttTTttTTttTTtt',
  'TttTttTttTttTttT',
  'ttTTttTTttTTttTT',
  'TttTttTttTttTttT'
];

// Plaza/stone tiles (16x16)
export const PLAZA_TOPDOWN = [
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
export const FOUNTAIN_TOPDOWN = [
  '________________',
  '____ssssssss____',
  '___sSSSSSSSss___',
  '__sSS333333Sss__',
  '__sS33XXXX33Ss__',
  '__sS3XX33XX3Ss__',
  '__sS3X3333X3Ss__',
  '__sS3X3333X3Ss__',
  '__sS3X3333X3Ss__',
  '__sS3X3333X3Ss__',
  '__sS3XX33XX3Ss__',
  '__sS33XXXX33Ss__',
  '__sSS333333Sss__',
  '___sSSSSSSSss___',
  '____ssssssss____',
  '________________'
];

// Community center (16x16)
export const COMMUNITY_TOPDOWN = [
  '___OOOOOOOOOO___',
  '__OoooooooooO__',
  '_OooooooooooooO_',
  '_OWWWWWWWWWWWO_',
  '_OWXXXWWWXXXWO_',
  '_OWWWWWWWWWWWO_',
  '_OWWW2222WWWWO_',
  '_OWWW2CC2WWWWO_',
  '_OWWW2222WWWWO_',
  '_OWWWWDDWWWWWO_',
  '_OWWWWddWWWWWO_',
  '_OOOOOOOOOOOOO_',
  '__hHHHHHHHHHh___',
  '__hhhhhhhhhhh___',
  '________________',
  '________________'
];

// Apply colors to sprite
export function renderTopDownSprite(pattern: string[]): string[][] {
  return pattern.map(row => 
    row.split('').map(char => TOPDOWN_COLORS[char] || 'transparent')
  );
}
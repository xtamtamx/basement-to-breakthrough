// Isometric Stardew Valley-inspired tileset
// Combining clean vector-like isometric style with Stardew's warmth and charm
// Using 32x16 diamond tiles for isometric projection

export const ISO_PALETTE = {
  // Transparent
  '_': 'transparent',
  
  // Ground colors (warm, earthy tones like Stardew)
  'A': '#3a5f0b', // Very dark grass
  'B': '#4c7710', // Dark grass  
  'C': '#5e8f15', // Medium grass
  'D': '#70a71a', // Light grass
  'E': '#82bf1f', // Bright grass
  'F': '#94d724', // Very bright grass
  
  // Path/Road (warm grays and browns)
  'G': '#544741', // Dark dirt path
  'H': '#6b5d54', // Medium dirt path
  'I': '#827367', // Light dirt path
  'J': '#3d3a36', // Dark stone
  'K': '#524f4a', // Medium stone
  'L': '#67645e', // Light stone
  'M': '#7c7972', // Very light stone
  
  // Building materials (cozy Stardew colors)
  'N': '#8b6f47', // Warm wood dark
  'O': '#a0826d', // Warm wood medium
  'P': '#c09e7d', // Warm wood light
  'Q': '#d4b896', // Warm wood bright
  'R': '#f4e4c1', // Cream wall
  'S': '#e8d5a6', // Light cream wall
  'T': '#d2b48c', // Tan wall
  'U': '#c19a6b', // Dark tan wall
  
  // Roofs (varied like Stardew buildings)
  'V': '#7c2929', // Dark red roof
  'W': '#943838', // Medium red roof
  'X': '#ac4747', // Light red roof
  'Y': '#c45656', // Bright red roof
  'Z': '#2d4a2b', // Dark green roof
  'a': '#3e5f3c', // Medium green roof
  'b': '#4f744d', // Light green roof
  'c': '#60895e', // Bright green roof
  
  // Windows/Details
  'd': '#7ec8e3', // Sky blue window
  'e': '#5fb3d3', // Medium blue window
  'f': '#4682b4', // Dark blue window
  'g': '#ffd27f', // Warm light (evening)
  'h': '#ffeb9c', // Bright warm light
  'i': '#fff4b9', // Very bright light
  
  // Accents
  'j': '#dc143c', // Red accent
  'k': '#ff69b4', // Pink accent
  'l': '#da70d6', // Purple accent
  'm': '#9370db', // Medium purple
  'n': '#32cd32', // Bright green
  'o': '#ffd700', // Gold
  'p': '#ff8c00', // Orange
  
  // Structure
  'q': '#2f2f2f', // Dark shadow
  'r': '#1a1a1a', // Very dark shadow
  's': '#ffffff', // White highlight
  't': '#f0f0f0', // Light highlight
  'u': '#000000', // Black
  'v': '#696969', // Dim gray
};

// Isometric house with Stardew charm (32x32 for full building)
export const ISO_HOUSE = [
  '________________VVVVVVVV________',
  '_______________VWWWWWWWWV_______',
  '______________VWXXXXXXXXWV______',
  '_____________VWXXXXXXXXXXWV_____',
  '____________VWXXXXXXXXXXXXWV____',
  '___________VWXXXXXXXXXXXXXXWV___',
  '__________VWXXXXXXXXXXXXXXXXWV__',
  '_________VWXXXXXXXXXXXXXXXXXXWV_',
  '________RRRRRRRRRRRRRRRRRRRRRRR_',
  '_______RRRSSSSSSSSSSSSSSSSSSRRR_',
  '______RRRSRRRRRRRRRRRRRRRRRSdRR_',
  '_____RRRSRRdddRRRRRRRRdddRRSddR_',
  '____RRRSRRdeeeddRRRRdeeeddRSRRR_',
  '___RRRSRRRdddRRRRRRRRRdddRRSRRR_',
  '__RRRSRRRRRRRRRRRRRRRRRRRRRSqRR_',
  '_RRRSRRRRRRRRRRROOOORRRRRRRSqqR_',
  'RRRSSSSSSSSSSSSSPPPPSSSSSSSqqq__',
  'RRqqqqqqqqqqqqqqqqqqqqqqqqqq____',
  '_qqqqqqqqqqqqqqqqqqqqqqqqq______',
  '__qqqqqqqqqqqqqqqqqqqqqq________',
  '____qqqqqqqqqqqqqqqqqq__________',
  '______qqqqqqqqqqqqqq____________',
  '________qqqqqqqqqq______________',
  '__________qqqqqq________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Isometric shop with awning (32x32)
export const ISO_SHOP = [
  '________________pppppppp________',
  '_______________poooooooop_______',
  '______________pooppppppoop______',
  '_____________poooooooooooop_____',
  '____________kkkkkkkkkkkkkkkk____',
  '___________kkjjjjjjjjjjjjjjkk___',
  '__________kkjjjjjjjjjjjjjjjjkk__',
  '_________kkjjjjjjjjjjjjjjjjjjkk_',
  '________TTTTTTTTTTTTTTTTTTTTTTTT',
  '_______TTTUUUUUUUUUUUUUUUUUUTTTT',
  '______TTTUTTTTTTTTTTTTTTTTTUdTT_',
  '_____TTTUTdddddddddddddddddUddT_',
  '____TTTUTTdgggggggggggggggdUTTT_',
  '___TTTUTTTdgggggggggggggggdUTTT_',
  '__TTTUTTTTdddddddddddddddddUqTT_',
  '_TTTUTTTTTTTTTTTNNNNTTTTTTTUqqT_',
  'TTTUUUUUUUUUUUUUOOOOUUUUUUUqqq__',
  'TTqqqqqqqqqqqqqqqqqqqqqqqqqq____',
  '_qqqqqqqqqqqqqqqqqqqqqqqqq______',
  '__qqqqqqqqqqqqqqqqqqqqqq________',
  '____qqqqqqqqqqqqqqqqqq__________',
  '______qqqqqqqqqqqqqq____________',
  '________qqqqqqqqqq______________',
  '__________qqqqqq________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Isometric music venue (underground feel)
export const ISO_VENUE = [
  '________________uuuuuuuu________',
  '_______________urrrrrrru________',
  '______________urrmmmmmmru_______',
  '_____________urrmlllllmmru______',
  '____________urrmmmmmmmmmmru_____',
  '___________urrrrrrrrrrrrrru_____',
  '__________urrrrrrrrrrrrrrrru____',
  '_________urrrrrrrrrrrrrrrrru____',
  '________vvvvvvvvvvvvvvvvvvvv____',
  '_______vvvvvvvvvvvvvvvvvvvvvv___',
  '______vvvvfffffffffffffffffvv___',
  '_____vvvvffeeeeeeeeeeeeeeffvv___',
  '____vvvvffehhhhhhhhhhhhheffvv___',
  '___vvvvfffehhhhhhhhhhhhheffvv___',
  '__vvvvffffeeeeeeeeeeeeeeeffqv___',
  '_vvvvfffffffffffffNNNfffffvqq___',
  'vvvvvvvvvvvvvvvvvOOOvvvvvvqqq___',
  'vvqqqqqqqqqqqqqqqqqqqqqqqqq_____',
  '_qqqqqqqqqqqqqqqqqqqqqqqq_______',
  '__qqqqqqqqqqqqqqqqqqqqq_________',
  '____qqqqqqqqqqqqqqqqq___________',
  '______qqqqqqqqqqqqq_____________',
  '________qqqqqqqqq_______________',
  '__________qqqqq_________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Isometric tree (more 3D feel)
export const ISO_TREE = [
  '________________________________',
  '________________________________',
  '_______________ccccc____________',
  '______________cbbbbbc___________',
  '_____________cbbaaaabbc_________',
  '____________cbbaZZZaabbc________',
  '___________cbbaZZZZZaabbc_______',
  '__________cbbaZZZZZZZaabbc______',
  '_________cbbaZZZZZZZZZaabbc_____',
  '________cbbaZZZZZZZZZZZaabbc____',
  '_______cbbaZZZZZZZZZZZZZaabbc___',
  '______cbbaaZZZZZZZZZZZZZaabbbc__',
  '_____cbbbaaaZZZZZZZZZZaaaabbbbc_',
  '____ccbbbbaaaaaaaaaaaaaabbbbccc_',
  '_____cccbbbbbbaaaaabbbbbbbccc___',
  '_______cccccbbbbbbbbbccccc______',
  '___________ccccccccccc__________',
  '______________NNNN______________',
  '_____________NNONN______________',
  '_____________NNONN______________',
  '_____________qqOqq______________',
  '____________qqqqqq______________',
  '___________qqqqqqq______________',
  '__________qqqqqqqq______________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Isometric grass tile (32x16 diamond)
export const ISO_GRASS = [
  '________DDDDDDDDDDDDDDDD________',
  '______DDDEEEEEEEEEEEEEEDDD______',
  '____DDDEEEEEEEEEEEEEEEEEEDD_____',
  '___DDEEEEEEFFFFFFFFFFEEEEEDD____',
  '__DDEEEEFFFFFFFFFFFFFFFFFFEDD___',
  '_DDEEEFFFFFFFCCCCCCFFFFFFFEEDD__',
  '_DEEFFFFFFFFFFCCCCFFFFFFFFEEDD__',
  'DDEEFFFFFCCCCCCCCCCCCCCFFFFEEDD_',
  'DEEFFFFCCCCCCCCCCCCCCCCCCFFFEEDD',
  'DEEFFCCCCCCCCBBBBCCCCCCCCCCFEEDD',
  'DEEFCCCCCCCCBBBBBBCCCCCCCCCCFEDD',
  'DEEFCCCCCBBBBBBBBBBBBBCCCCCCCEDD',
  '_DEFCCCCBBBBBBBBBBBBBBBCCCCCCDD_',
  '_DDEFCCBBBBBBBAAABBBBBBBBCCCDDD_',
  '__DDEFCBBBBBAAAAAAAABBBBBCCDD___',
  '___DDEFCBBBAAAAAAAAAABBBBCDD____',
  '____DDEFCBBBAAAAAAAABBBCDD______',
  '_____DDEFCCBBBBAABBBBBCDD_______',
  '______DDEFCCCBBBBBBCCDD_________',
  '_______DDEFCCCCCCCCDD___________',
  '________DDEFFFFFEDD_____________',
  '_________DDEFFEDD_______________',
  '__________DDDDD_________________',
  '___________DDD__________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Isometric road tile (horizontal)
export const ISO_ROAD_H = [
  '________KKKKKKKKKKKKKKKK________',
  '______KKKLLLLLLLLLLLLLLKKKK_____',
  '____KKKLLLLLLLLLLLLLLLLLLKKKK___',
  '___KKLLLLLLLLLLLLLLLLLLLLLLLKK__',
  '__KKLLLLLLLMMMMMMMMMLLLLLLLLKKK_',
  '_KKLLLLLMMMMMMMMMMMMMMMLLLLLLKK_',
  '_KLLLLLMMMMMJJJJJJJMMMMMLLLLLKKK',
  'KKLLLLLMMJJJJJJJJJJJJJMMMLLLLKKK',
  'KLLLLLMMJJJJJJJJJJJJJJJJMMLLLKKK',
  'KLLLLLMJJJJJSSSSSSJJJJJJJMLLLKKK',
  'KLLLLLMJJJJSSSSSSSSJJJJJJMLLLKKK',
  'KLLLLLMJJJJJSSSSSSJJJJJJJMLLLKKK',
  '_KLLLLLMJJJJJJJJJJJJJJJJMLLLLKK_',
  '_KKLLLLLMJJJJJJJJJJJJJJMLLLLLKK_',
  '__KKLLLLLMMJJJJJJJJJJMMLLLLLKK__',
  '___KKLLLLLMMMMMMMMMMMMLLLLLKK___',
  '____KKLLLLLLLLLLLLLLLLLLLKKK____',
  '_____KKLLLLLLLLLLLLLLLLKKK______',
  '______KKKLLLLLLLLLLLLKKKK_______',
  '_______KKKKKKKKKKKKKKKK_________',
  '________KKKKKKKKKKKKKK__________',
  '__________KKKKKKKKKK____________',
  '____________KKKKKK______________',
  '______________KKK_______________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Isometric plaza/stone tile
export const ISO_PLAZA = [
  '________LLLLLLLLLLLLLLLL________',
  '______LLLMMMMMMMMMMMMMLLL_______',
  '____LLLMMMMMMMMMMMMMMMMLLL______',
  '___LLMMMMMMMMMMMMMMMMMMMMLL_____',
  '__LLMMMMMKKKKKKKKKKKMMMMMMLL____',
  '_LLMMMKKKKKKKKKKKKKKKKKMMMMLL___',
  '_LMMMKKKKKKKJJJJJKKKKKKKMMMMLL__',
  'LLMMKKKKKJJJJJJJJJJJKKKKKMMMLLL_',
  'LMMKKKKKJJJJJJJJJJJJJJKKKKMMMLLL',
  'LMMKKKKJJJJJJJJJJJJJJJJKKKKMMLLL',
  'LMMKKKKJJJJJJJJJJJJJJJJKKKKMMLLL',
  'LMMKKKKKJJJJJJJJJJJJJJKKKKKMMLLL',
  '_LMMKKKKKJJJJJJJJJJJJKKKKKMMLL__',
  '_LLMMKKKKKKKJJJJJKKKKKKKKMMLL___',
  '__LLMMMKKKKKKKKKKKKKKKKMMMLL____',
  '___LLMMMMMKKKKKKKKKKMMMMMLL_____',
  '____LLLMMMMMMMMMMMMMMMMLLL______',
  '_____LLLMMMMMMMMMMMMMMLLL_______',
  '______LLLLLMMMMMMMMLLLL_________',
  '_______LLLLLLLLLLLLLL___________',
  '________LLLLLLLLLLLL____________',
  '__________LLLLLLLL______________',
  '____________LLLL________________',
  '______________L_________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Fountain with water animation potential
export const ISO_FOUNTAIN = [
  '________________________________',
  '________________________________',
  '____________MMMMMMMM____________',
  '__________MMLLLLLLLMM___________',
  '_________MMLKKKKKKKKLMM_________',
  '________MMLKJJJJJJJJKLMM________',
  '_______MMLKJJJJJJJJJJKLMM_______',
  '______MMLKJJJDDDDDDJJJKLMM______',
  '_____MMLKJJJDDEEEDDJJJJKLMM_____',
  '____MMLKJJJDDEEEEEDDDJJJKLMM____',
  '____MLKJJJDDEEEEEEEDDJJJJKLM____',
  '___MMLKJJDDEEEIIIEEEDDJJJKLMM___',
  '___MLKJJJDDEEIIIIIEEDDJJJJKLM___',
  '___MLKJJJDDEEEIIIEEEDDJJJJKLM___',
  '___MMLKJJJDDEEEEEEEDDDJJJKLMM___',
  '____MLKJJJJDDEEEEEDDJJJJJKLM____',
  '____MMLKJJJJDDDDDDDJJJJJKLMM____',
  '_____MMLKJJJJJJJJJJJJJJKLMM_____',
  '______MMLKKJJJJJJJJJJKKLMM______',
  '_______MMLKKKJJJJJJKKKLMM_______',
  '________MMLKKKKKKKKKKLMM________',
  '_________MMLLLLLLLLLLLM_________',
  '__________MMMMMMMMMMMM__________',
  '____________MMMMMMMM____________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________',
  '________________________________'
];

// Helper to render isometric sprites
export function renderIsoSprite(pattern: string[]): string[][] {
  return pattern.map(row => 
    row.split('').map(char => ISO_PALETTE[char] || 'transparent')
  );
}

// Isometric coordinate helpers
export function cartToIso(x: number, y: number): { x: number, y: number } {
  return {
    x: (x - y) * 16, // Half tile width
    y: (x + y) * 8   // Quarter tile width for height
  };
}

export function isoToCart(isoX: number, isoY: number): { x: number, y: number } {
  return {
    x: (isoX / 16 + isoY / 8) / 2,
    y: (isoY / 8 - isoX / 16) / 2
  };
}
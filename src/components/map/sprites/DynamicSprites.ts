// Dynamic sprite system for evolving city visuals
import { SPRITE_COLORS_16BIT, createSprite } from './PixelSprites16Bit';

export type DevelopmentLevel = 'empty' | 'construction' | 'basic' | 'developed' | 'thriving';

// Empty lot patterns - grassy areas, abandoned lots, etc.
const EMPTY_LOT_PATTERNS = [
  // Overgrown lot with wildflowers
  [
    'GGGGGGGGGGGGGGGG',
    'GDGGGFGGGGFGGGDG',
    'GGGGGGGGGGGGGGGG',
    'GGFGGGGGGGGGFGGG',
    'GGGGGGWWWGGGGGGG',
    'GGGGGWWWWWGGGGGG',
    'GGGGWWWWWWWGGGGG',
    'GGGGGWWWWWGGGGGG',
    'GGGGGGWWWGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGFGGGGGGGGGFGGG',
    'GGGGGGGGGGGGGGGG',
    'GDGGGFGGGGFGGGDG',
    'GGGGGGGGGGGGGGGG',
    '................',
    'SSSSSSSSSSSSSSSS'
  ],
  // Small dirt parking area
  [
    'CCCCCCCCCCCCCCCC',
    'CDDDDDDDDDDDDDDC',
    'CDPPPPPPPPPPPPDC',
    'CDPLLPPPLLPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDPLLPPPLLPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDPLLPPPLLPPPDC',
    'CDPPPPPPPPPPPPDC',
    'CDDDDDDDDDDDDDDC',
    'CCCCCCCCCCCCCCCC',
    'SSSSSSSSSSSSSSSS'
  ],
  // Community garden plot
  [
    'WWWWWWWWWWWWWWWW',
    'WGGGDGGGGGDGGGGW',
    'WGPPPPPPPPPPPPGW',
    'WGPBBBPBBBPBBBGW',
    'WGPPPPPPPPPPPPGW',
    'WGPBBBPBBBPBBBGW',
    'WGPPPPPPPPPPPPGW',
    'WGPBBBPBBBPBBBGW',
    'WGPPPPPPPPPPPPGW',
    'WGPPPPPPPPPPPPGW',
    'WGGGDGGGGGDGGGGW',
    'WGGGGGGGGGGGGGW',
    'WGFGGGFGGGFGGGW',
    'WGGGGGGGGGGGGGW',
    'WWWWWWWWWWWWWWWW',
    'SSSSSSSSSSSSSSSS'
  ]
];

// Construction site patterns
const CONSTRUCTION_PATTERNS = [
  // Cozy construction site
  [
    '................',
    '..YYYYYYYYYYYY..',
    '.YOOOOOOOOOOOOOY.',
    '.YOBBBBBBBBBBOY.',
    '.YOBSSSSSSSSBOY.',
    '.YOBSHHHHHSBOY.',
    '.YOBSHHHHHSBOY.',
    '.YOBSHHHHHSBOY.',
    '.YOBSHHHHHSBOY.',
    '.YOBSSSSSSSSBOY.',
    '.YOBBBBBBBBBBOY.',
    '.YOOOOOOOOOOOOOY.',
    '.YYYYYYYYYYYYYYYY.',
    '..CCCCCCCCCCCC..',
    '................',
    'SSSSSSSSSSSSSSSS'
  ],
  // Foundation with materials
  [
    '................',
    '..CCCCCCCCCCCC..',
    '.CDDDDDDDDDDDDDC.',
    '.CDBBBBBBBBBBBDC.',
    '.CDBSSSSSSSSSBDC.',
    '.CDBSSSSSSSSSBDC.',
    '.CDBSSHHHHSSBDC.',
    '.CDBSSHHHHSSBDC.',
    '.CDBSSSSSSSSSBDC.',
    '.CDBSSSSSSSSSBDC.',
    '.CDBBBBBBBBBBBDC.',
    '.CDDDDDDDDDDDDDC.',
    '.CCCCCCCCCCCCCC.',
    '..OOOOOOOOOOOO..',
    '................',
    'SSSSSSSSSSSSSSSS'
  ]
];

// Building variations for each district type
const BUILDING_VARIATIONS = {
  downtown: {
    basic: [
      // Small office
      [
        '....SSSSSSSS....',
        '...SDDDDDDDDS...',
        '..SGGGGGGGGGGS..',
        '..SGWGWGWGWGGS..',
        '..SGGGGGGGGGGGS..',
        '..SGWGWGWGWGGS..',
        '..SGGGGGGGGGGGS..',
        '..SGWGWGWGWGGS..',
        '..SGGGGGGGGGGGS..',
        '..SGWGWGWGWGGS..',
        '..SGGGGGGGGGGGS..',
        '..SLLLLDDDLLLLS..',
        '..SSSSSSSSSSSSS..',
        '..DDDDDDDDDDDDD..',
        '................',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    developed: [
      // Glass tower
      [
        '....DDDDDDDD....',
        '...DSSSSSSSSD...',
        '..DSGGGGGGGGGD..',
        '..SGBGBGBGBGGS..',
        '..SGGGNGGGGGNS..',
        '..SGBGBGBGBGGS..',
        '..SGGGGGGGGGNS..',
        '..SGBGBGBGBGGS..',
        '..SGGGNGGGGGNS..',
        '..SGBGBGBGBGGS..',
        '..SGGGGGGGGGNS..',
        '..SGBGBGBGBGGS..',
        '..SLLLDDDLLLLS..',
        '..DSSSSSSSSSSD..',
        '..DDDWWWWWDDDD..',
        'SSSSSSSSSSSSSSSS'
      ],
      // Modern complex
      [
        '...MMMMMMMMMM...',
        '..MSSSSSSSSSSM..',
        '.MSGGGGGGGGGGSM.',
        '.MSGCCCCCCCGGSM.',
        '.MSGGGGGGGGGGSM.',
        '.MSGCCCCCCCGGSM.',
        '.MSGGGGGGGGGGSM.',
        '.MSGCCCCCCCGGSM.',
        '.MSGGGGGGGGGGSM.',
        '.MSGCCCCCCCGGSM.',
        '.MSGGGGGGGGGGSM.',
        '.MSLLLLDDDLLLSM.',
        '.MSSSSSSSSSSSSM.',
        '..MMMMMMMMMMMM..',
        '...DDDDDDDDDDD..',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    thriving: [
      // Neon-lit skyscraper
      [
        '....MMMMMMMM....',
        '...MNNNNNNNNM...',
        '..MNPPPPPPPPNM..',
        '.MNGGGGGGGGGGNM.',
        '.MNGCNCNCNCGGNM.',
        '.MNGGGGGGGGGGNM.',
        '.MNGCNCNCNCGGNM.',
        '.MNGGGGGGGGGGNM.',
        '.MNGCNCNCNCGGNM.',
        '.MNGGGGGGGGGGNM.',
        '.MNGCNCNCNCGGNM.',
        '.MNGGGGGGGGGGNM.',
        '.MNPPPPDDDPPPNM.',
        '.MNNNNNNNNNNNNM.',
        '..MMMMMMMMMMMM..',
        'SSSSSSSSSSSSSSSS'
      ]
    ]
  },
  warehouse: {
    basic: [
      // Small warehouse
      [
        'BBBBBBBBBBBBBBBB',
        'BDDDDDDDDDDDDDDB',
        'BRRRRRRRRRRRRRRB',
        'BRWWRRWWRRWWRRB',
        'BRRRRRRRRRRRRRRB',
        'BMMMMMMMMMMMMMMB',
        'BRRRRRRRRRRRRRRB',
        'BRWWRRWWRRWWRRB',
        'BRRRRRRRRRRRRRRB',
        'BMMMMMMMMMMMMMMB',
        'BWWWWWWWWWWWWWWB',
        'BWDDDDDDDDDDDWDB',
        'BWWWWWWWWWWWWWWB',
        'BBBBBBBBBBBBBBBB',
        'DDDDDDDDDDDDDDDD',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    developed: [
      // Industrial complex with graffiti
      [
        'BBBBBBBBBBBBBBBB',
        'BDDDDDDDDDDDDDDB',
        'BRRDBRDBRDBRRDRB',
        'BRRDGRDGRDGRRDGB',
        'BMMMMMMMMMMMMMMB',
        'BRRDBRDBRDBRRDRB',
        'BRRDGRDGRDGRRDGB',
        'BDDDDDDDDDDDDDDB',
        'BRRDBRDBRDBRRDRB',
        'BRRDGRDGRDGRRDGB',
        'BMMMMMMMMMMMMMMB',
        'BWWWWWWWWWWWWWWB',
        'BWDDDWDDDWDDDWDB',
        'BWWWWWWWWWWWWWWB',
        'BBBBBBBBBBBBBBBB',
        'SSSCSSSSSSSCSSSS'
      ]
    ],
    thriving: [
      // Converted arts space
      [
        'RRRRRRRRRRRRRRRR',
        'RPPPPPPPPPPPPPPR',
        'RPGGGPPPPPGGGPPR',
        'RPGNGPPPPPGNGPPR',
        'RPGGGPPPPPGGGPPR',
        'RPPPPWWWWWPPPPPR',
        'RPPPWCCCCCWPPPPR',
        'RPPPWCCCCCWPPPPR',
        'RPPPWCCCCCWPPPPR',
        'RPPPPWWWWWPPPPPR',
        'RPGGGPPPPPGGGPPR',
        'RPGNGPPPPPGNGPPR',
        'RPGGGPPPPPGGGPPR',
        'RPPPPPPPPPPPPPPR',
        'RRRRRRRRRRRRRRRR',
        'SSSCSSSSSSSCSSSS'
      ]
    ]
  },
  college: {
    basic: [
      // Small dorm
      [
        '....SSSSSSSS....',
        '...SDDDDDDDDS...',
        '..SSLLLLLLLLSS..',
        '..SWWSSWWSSWWS..',
        '..SDDSSDDSSDDS..',
        '..SWWSSWWSSWWS..',
        '..SSSSSSSSSSSS..',
        '..SWWSSWWSSWWS..',
        '..SDDSSDDSSDDS..',
        '..SWWSSWWSSWWS..',
        '..SSSSSSSSSSSS..',
        '..SSSDDDDDDSSS..',
        '..SSSPPPPPPSS...',
        '..SSSSSSSSSSSS..',
        '..GGGGGGGGGGGG..',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    developed: [
      // Campus building
      [
        '....SSSSSSSS....',
        '...SDDDDDDDDS...',
        '..SSIISSSIISSS..',
        '..SSISSISSPPSS..',
        '.SSWWSSWWSSWWSS.',
        '.SSDDSSDDSSDDS..',
        '.SSWWSSWWSSWWSS.',
        '.SSISSISSSISSS..',
        '.SSWWSSWWPPWWSS.',
        '.SSDDSSDDSSDDS..',
        '.SSWWSSWWSSWWSS.',
        '.SSISSISSSISSS..',
        '.SSSLDDDDDLSSS..',
        '.SSSSSSSSSSSS...',
        '..SSLLLLLLSS....',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    thriving: [
      // Modern library/student center
      [
        '...LLLLLLLLLL...',
        '..LGGGGGGGGGGL..',
        '.LGCCCCCCCCCGGL.',
        '.LGCPPPPPPPCGGL.',
        '.LGCCCCCCCCCGGL.',
        '.LGGGGGGGGGGGGL.',
        '.LGCCCCCCCCCGGL.',
        '.LGCPPPPPPPCGGL.',
        '.LGCCCCCCCCCGGL.',
        '.LGGGGGGGGGGGGL.',
        '.LGCCCCCCCCCGGL.',
        '.LGGGGGGGGGGGGL.',
        '.LLLDDDDDDDLLLL.',
        '..LLLLLLLLLLL...',
        '...GGGGGGGGGG...',
        'SSSSSSSSSSSSSSSS'
      ]
    ]
  },
  residential: {
    basic: [
      // Small house
      [
        '......RRRR......',
        '....RRRRRRRR....',
        '...RDDDDDDDR....',
        '..RDDDDDDDDDR...',
        '..SLLLLLLLLLLS..',
        '..SWWSSWWSSWWS..',
        '..SDDSSDDSSDDS..',
        '..SWWSSWWSSWWS..',
        '..SLLLLLLLLLLS..',
        '..SSSSSDDDSSSSS.',
        '..SSSDWAWDSSSS..',
        '..SSSSSSSSSSSS..',
        '..GGDGGGGGDGGG..',
        '..GGGGGGGGGGGG..',
        '................',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    developed: [
      // Townhouse
      [
        '....RRRRRRRR....',
        '...RDDDDDDDDR...',
        '..RDDDDDDDDDDR..',
        '..SLLLLLLLLLLS..',
        '..SWWSSWWSSWWS..',
        '..SAASSSSSAAAS..',
        '..SWWSSWWSSWWS..',
        '..SLLLLLLLLLLS..',
        '..SWWSSWWSSWWS..',
        '..SAASSSSSAAAS..',
        '..SWWSSWWSSWWS..',
        '..SLLLLDDDLLLS..',
        '..SSSDWAWDSSSS..',
        '..SSSSSSSSSSSS..',
        '..GGAGGGGGAGGG..',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    thriving: [
      // Modern apartment
      [
        '...LLLLLLLLLLL..',
        '..LDDDDDDDDDDDL.',
        '.LSAAAAAAAAAASL.',
        '.LSWWSWWSWWSWSL.',
        '.LSAAAAAAAAAASL.',
        '.LSWWSWWSWWSWSL.',
        '.LSAAAAAAAAAASL.',
        '.LSWWSWWSWWSWSL.',
        '.LSAAAAAAAAAASL.',
        '.LSWWSWWSWWSWSL.',
        '.LSAAAAAAAAAASL.',
        '.LSSSSDDDDSSSSSL.',
        '.LLLLLLLLLLLLLLL.',
        '..GGAGGGGGAGGG..',
        '..GGGGGGGGGGGG..',
        'SSSSSSSSSSSSSSSS'
      ]
    ]
  },
  arts: {
    basic: [
      // Small gallery
      [
        '.....PPPPPP.....',
        '....PDDDDDPP....',
        '...PPPPPPPPPP...',
        '..PPPTPPPPPTPPP.',
        '..PTPTPPPPPTPTP.',
        '..PPPPWWWWPPPP..',
        '..PTPTPPPPPTPTP.',
        '..PPPPWWWWPPPP..',
        '..PTPTPPPPPTPTP.',
        '..PPPPDDDDPPPP..',
        '..PPPPDTTDPPPP..',
        '..PPPPPPPPPPPP..',
        '...LLLLLLLLLL...',
        '................',
        '................',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    developed: [
      // Creative studio
      [
        '.....PPPPPP.....',
        '....PDDDDDPP....',
        '...PPOTTOTPP....',
        '..PPPTPPPPPTPPP.',
        '..PTPTPPPPPTPTP.',
        '..PPPPWWWWPPPP..',
        '..PTPTWDDWTPTP..',
        '..PPPPWWWWPPPP..',
        '..PTPTPPCPPTPTP.',
        '..PPPPWWWWPPPP..',
        '..PTPTWDDWTPTP..',
        '..PPPPLDDDLPPPP..',
        '..PPPPDOODPPPP..',
        '..PPPPPPPPPPPP..',
        '...LLLLLLLLLL...',
        'SSSSSSSSSSSSSSSS'
      ]
    ],
    thriving: [
      // Art collective with murals
      [
        '..TTTTTTTTTTTT..',
        '.TPPPPPPPPPPPPPT.',
        '.TPCCOCCOCCOCCPT.',
        '.TPPPPPPPPPPPPPT.',
        '.TPLLLLLLLLLLPPT.',
        '.TPWWWWWWWWWWPPT.',
        '.TPDDDDDDDDDDDPT.',
        '.TPWWWWWWWWWWPPT.',
        '.TPLLLLLLLLLLPPT.',
        '.TPWWWWWWWWWWPPT.',
        '.TPDDDDDDDDDDDPT.',
        '.TPPPPDOODPPPPT.',
        '.TPPPPPPPPPPPPPT.',
        '.TTTTTTTTTTTTTT.',
        '..OOOOOOOOOOOO..',
        'SSCSSSSSSSSCSSSS'
      ]
    ]
  }
};

// Color mappings for dynamic sprites
const DYNAMIC_COLORS = {
  empty: {
    '.': SPRITE_COLORS_16BIT.TRANSPARENT,
    'G': SPRITE_COLORS_16BIT.GRASS_GREEN,
    'D': SPRITE_COLORS_16BIT.GRASS_DARK,
    'C': SPRITE_COLORS_16BIT.GRAY_LIGHT,
    'W': SPRITE_COLORS_16BIT.TREE_TRUNK,
    'S': SPRITE_COLORS_16BIT.SIDEWALK,
    'A': SPRITE_COLORS_16BIT.ASPHALT,
    'L': SPRITE_COLORS_16BIT.STREET_LINE,
    'P': SPRITE_COLORS_16BIT.GRAY_MID,
    'F': SPRITE_COLORS_16BIT.ARTS_PINK,
    'B': SPRITE_COLORS_16BIT.TREE_GREEN
  },
  construction: {
    '.': SPRITE_COLORS_16BIT.TRANSPARENT,
    'Y': SPRITE_COLORS_16BIT.WINDOW_YELLOW,
    'B': SPRITE_COLORS_16BIT.GRAY_MID,
    'S': SPRITE_COLORS_16BIT.SIDEWALK,
    'H': SPRITE_COLORS_16BIT.GRAY_LIGHT,
    'O': SPRITE_COLORS_16BIT.ARTS_ORANGE,
    'C': SPRITE_COLORS_16BIT.GRAY_LIGHTER,
    'D': SPRITE_COLORS_16BIT.GRAY_DARK
  },
  downtown: {
    '.': SPRITE_COLORS_16BIT.TRANSPARENT,
    'S': SPRITE_COLORS_16BIT.DOWNTOWN_STEEL,
    'D': SPRITE_COLORS_16BIT.DOWNTOWN_STEEL_DARK,
    'G': SPRITE_COLORS_16BIT.DOWNTOWN_GLASS,
    'B': SPRITE_COLORS_16BIT.DOWNTOWN_GLASS_DARK,
    'L': SPRITE_COLORS_16BIT.DOWNTOWN_GLASS_LIGHT,
    'N': SPRITE_COLORS_16BIT.DOWNTOWN_NEON,
    'W': SPRITE_COLORS_16BIT.WINDOW_DARK,
    'M': SPRITE_COLORS_16BIT.DOWNTOWN_STEEL_DARK,
    'C': SPRITE_COLORS_16BIT.DOWNTOWN_GLASS_LIGHT
  },
  warehouse: {
    'B': SPRITE_COLORS_16BIT.WAREHOUSE_BRICK,
    'D': SPRITE_COLORS_16BIT.WAREHOUSE_BRICK_DARK,
    'R': SPRITE_COLORS_16BIT.WAREHOUSE_BRICK_LIGHT,
    'M': SPRITE_COLORS_16BIT.WAREHOUSE_METAL,
    'W': SPRITE_COLORS_16BIT.GRAY_DARK,
    'S': SPRITE_COLORS_16BIT.SIDEWALK,
    'C': SPRITE_COLORS_16BIT.SIDEWALK_CRACK,
    'G': SPRITE_COLORS_16BIT.WAREHOUSE_GRAFFITI,
    'P': SPRITE_COLORS_16BIT.NEON_PINK,
    'N': SPRITE_COLORS_16BIT.NEON_GREEN,
    'T': SPRITE_COLORS_16BIT.ARTS_TEAL
  },
  college: {
    '.': SPRITE_COLORS_16BIT.TRANSPARENT,
    'S': SPRITE_COLORS_16BIT.COLLEGE_STONE,
    'D': SPRITE_COLORS_16BIT.COLLEGE_STONE_DARK,
    'L': SPRITE_COLORS_16BIT.COLLEGE_STONE_LIGHT,
    'I': SPRITE_COLORS_16BIT.COLLEGE_IVY,
    'G': SPRITE_COLORS_16BIT.GRASS_GREEN,
    'W': SPRITE_COLORS_16BIT.WINDOW_BLUE,
    'P': SPRITE_COLORS_16BIT.COLLEGE_POSTER,
    'C': SPRITE_COLORS_16BIT.DOWNTOWN_GLASS_LIGHT
  },
  residential: {
    '.': SPRITE_COLORS_16BIT.TRANSPARENT,
    'S': SPRITE_COLORS_16BIT.RESIDENTIAL_SIDING,
    'D': SPRITE_COLORS_16BIT.RESIDENTIAL_SIDING_DARK,
    'L': SPRITE_COLORS_16BIT.RESIDENTIAL_SIDING_LIGHT,
    'R': SPRITE_COLORS_16BIT.RESIDENTIAL_ROOF,
    'W': SPRITE_COLORS_16BIT.WINDOW_YELLOW,
    'G': SPRITE_COLORS_16BIT.GRASS_GREEN,
    'A': SPRITE_COLORS_16BIT.RESIDENTIAL_ACCENT
  },
  arts: {
    '.': SPRITE_COLORS_16BIT.TRANSPARENT,
    'P': SPRITE_COLORS_16BIT.ARTS_PURPLE,
    'D': SPRITE_COLORS_16BIT.ARTS_PURPLE_DARK,
    'T': SPRITE_COLORS_16BIT.ARTS_TEAL,
    'C': SPRITE_COLORS_16BIT.ARTS_PINK,
    'W': SPRITE_COLORS_16BIT.WINDOW_BLUE,
    'L': SPRITE_COLORS_16BIT.ARTS_PURPLE_LIGHT,
    'O': SPRITE_COLORS_16BIT.ARTS_ORANGE,
    'S': SPRITE_COLORS_16BIT.SIDEWALK
  }
};

// Function to get appropriate sprite based on development level
export function getDevelopmentSprite(
  district: string,
  level: DevelopmentLevel,
  variation: number = 0
): { pattern: string[], colors: Record<string, string> } {
  switch (level) {
    case 'empty':
      const emptyVariation = variation % EMPTY_LOT_PATTERNS.length;
      return {
        pattern: EMPTY_LOT_PATTERNS[emptyVariation],
        colors: DYNAMIC_COLORS.empty
      };
    
    case 'construction':
      const constructionVariation = variation % CONSTRUCTION_PATTERNS.length;
      return {
        pattern: CONSTRUCTION_PATTERNS[constructionVariation],
        colors: DYNAMIC_COLORS.construction
      };
    
    case 'basic':
    case 'developed':
    case 'thriving':
      const districtVariations = BUILDING_VARIATIONS[district]?.[level];
      if (districtVariations) {
        const buildingVariation = variation % districtVariations.length;
        return {
          pattern: districtVariations[buildingVariation],
          colors: DYNAMIC_COLORS[district] || DYNAMIC_COLORS.downtown
        };
      }
      // Fallback to basic building
      return {
        pattern: BUILDING_VARIATIONS.downtown.basic[0],
        colors: DYNAMIC_COLORS.downtown
      };
  }
}

// Calculate development level based on scene metrics
export function calculateDevelopmentLevel(
  sceneStrength: number,
  venueCount: number,
  population: number
): DevelopmentLevel {
  const score = (sceneStrength * 0.5) + (venueCount * 5) + (population * 0.001);
  
  if (score < 10) return 'empty';
  if (score < 25) return 'construction';
  if (score < 50) return 'basic';
  if (score < 100) return 'developed';
  return 'thriving';
}

// Building spawn chance based on player actions
export function shouldSpawnBuilding(
  district: any,
  playerActions: {
    showsBooked: number;
    venuesBuilt: number;
    jobsWorked: number;
    sceneReputation: number;
  }
): boolean {
  // Base spawn chance
  let spawnChance = 0.1;
  
  // Increase based on player activity
  spawnChance += (playerActions.showsBooked * 0.02);
  spawnChance += (playerActions.venuesBuilt * 0.05);
  spawnChance += (playerActions.jobsWorked * 0.01);
  spawnChance += (playerActions.sceneReputation * 0.001);
  
  // District-specific modifiers
  if (district.type === 'warehouse' && playerActions.showsBooked > 10) {
    spawnChance += 0.1; // Warehouse district loves shows
  }
  if (district.type === 'arts' && playerActions.sceneReputation > 50) {
    spawnChance += 0.15; // Arts district attracts with reputation
  }
  
  return Math.random() < Math.min(spawnChance, 0.5);
}
# Town Renderer Art Asset Integration Guide

## Current State

We've built several town rendering systems that use programmatically generated sprites:
- TownMapRenderer (top-down view with 16x16 sprites)
- SNESTownRenderer (SNES JRPG-style with custom tileset)
- ModernCityRenderer (clean vector-style graphics)

While these renderers demonstrate the game mechanics and growth system, they use code-generated art that doesn't meet the professional quality standards needed for a premium mobile game.

## What You Need to Purchase

Based on your requirements for a "modern day remake of SimCity 2000" starting as a small town:

### Recommended Art Style
- **Isometric perspective** (2.5D view like SimCity 2000)
- **Tile-based sprites** (32x32 or 64x64 base tile size)
- **Modular building sets** (can combine to create variety)
- **Consistent art style** across all assets

### Essential Sprites Needed

1. **Terrain Tiles**
   - Grass (multiple variations)
   - Roads (straight, corners, intersections, T-junctions)
   - Sidewalks/paths
   - Plaza/town square tiles
   - Parks/green spaces

2. **Buildings** (multiple variations of each)
   - Houses (small, medium, large)
   - Shops/stores
   - Music venues (basement, club, theater, arena)
   - Workplaces (coffee shop, record store, etc.)
   - Community buildings (town hall, library)
   - Construction sites

3. **Decorations**
   - Trees (multiple types)
   - Fountains
   - Street lights
   - Benches
   - Signs

4. **UI Elements**
   - Building selection highlights
   - Grid overlays
   - Zone indicators

## Integration Instructions

Once you have professional art assets, here's how to integrate them:

### 1. Asset Preparation
```typescript
// Place assets in: /src/assets/sprites/town/
// Organize by category:
/src/assets/sprites/town/
  ├── terrain/
  │   ├── grass_01.png
  │   ├── road_straight_h.png
  │   └── ...
  ├── buildings/
  │   ├── house_small_01.png
  │   ├── venue_basement.png
  │   └── ...
  └── decorations/
      ├── tree_01.png
      └── ...
```

### 2. Create Sprite Loader
```typescript
// /src/game/sprites/AssetLoader.ts
export class AssetLoader {
  private sprites: Map<string, HTMLImageElement> = new Map();
  
  async loadSprites() {
    const spriteManifest = {
      'grass_01': '/assets/sprites/town/terrain/grass_01.png',
      'house_small_01': '/assets/sprites/town/buildings/house_small_01.png',
      // ... list all sprites
    };
    
    // Load all sprites
    const loadPromises = Object.entries(spriteManifest).map(
      async ([key, path]) => {
        const img = new Image();
        img.src = path;
        await img.decode();
        this.sprites.set(key, img);
      }
    );
    
    await Promise.all(loadPromises);
  }
  
  getSprite(key: string): HTMLImageElement {
    return this.sprites.get(key)!;
  }
}
```

### 3. Update Renderer
```typescript
// /src/components/map/ProfessionalTownRenderer.tsx
export const ProfessionalTownRenderer: React.FC = () => {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const assetLoader = useRef(new AssetLoader());
  
  useEffect(() => {
    assetLoader.current.loadSprites().then(() => {
      setAssetsLoaded(true);
    });
  }, []);
  
  const drawBuilding = (ctx: CanvasRenderingContext2D, building: Building) => {
    const sprite = assetLoader.current.getSprite(
      `${building.type}_${building.style}`
    );
    
    if (sprite) {
      ctx.drawImage(
        sprite,
        screenPos.x,
        screenPos.y,
        sprite.width * camera.zoom,
        sprite.height * camera.zoom
      );
    }
  };
};
```

### 4. Isometric Coordinate Mapping
If using isometric sprites:
```typescript
const cartesianToIsometric = (x: number, y: number) => {
  return {
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2)
  };
};

const isometricToCartesian = (x: number, y: number) => {
  return {
    x: (x / (TILE_WIDTH / 2) + y / (TILE_HEIGHT / 2)) / 2,
    y: (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
  };
};
```

## Asset Requirements Checklist

When purchasing/commissioning art:

- [ ] Consistent perspective (isometric recommended)
- [ ] Consistent color palette
- [ ] Transparent backgrounds (PNG format)
- [ ] Multiple variations for visual diversity
- [ ] Proper tile alignment (power of 2 dimensions)
- [ ] Shadow/depth layers if needed
- [ ] Seasonal variations (optional but nice)
- [ ] Night/day variations (optional)

## Example Asset Packs to Consider

Based on the links you provided:
- Vector Art Isometric City (good for modern look)
- Comic Style Tile Set Modern City (stylized option)
- City Buildings Tiny Assets (compact, mobile-friendly)

## Next Steps

1. Purchase appropriate asset pack(s)
2. Extract and organize sprites
3. Create sprite manifest
4. Implement AssetLoader
5. Update renderer to use real sprites
6. Test on various devices for performance

Remember: The procedural generation system (TownGenerator) is already built and working. It creates the town layout and growth. All we need is to replace the programmatic drawing with actual sprite rendering.
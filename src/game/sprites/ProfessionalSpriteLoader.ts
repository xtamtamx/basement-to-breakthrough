export interface SpriteDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  image: HTMLImageElement;
  sprites: Map<string, SpriteDefinition>;
}

export class ProfessionalSpriteLoader {
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private loadPromise: Promise<void> | null = null;

  async loadAll(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = this.loadAssets();
    return this.loadPromise;
  }

  private async loadAssets(): Promise<void> {
    // Load sprite sheets
    const imagesToLoad = [
      { key: "houses", path: "/assets/sprites/town/houses-sprite-sheet.png" },
      { key: "village", path: "/assets/sprites/town/village-tileset.png" },
      { key: "houses-detailed", path: "/assets/sprites/town/houses-tileset.png" },
      { key: "terrain", path: "/assets/sprites/town/grasslands-tileset.png" },
    ];

    const loadPromises = imagesToLoad.map(async ({ key, path }) => {
      const img = new Image();
      img.src = path;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      this.loadedImages.set(key, img);
    });

    await Promise.all(loadPromises);

    // Define sprite regions for the houses sprite sheet
    this.defineHousesSprites();
    this.defineVillageSprites();
    this.defineTerrainSprites();
  }

  private defineHousesSprites() {
    const img = this.loadedImages.get("houses")!;
    const sprites = new Map<string, SpriteDefinition>();
    
    // The houses sprite sheet has 16 columns and 21 rows of 32x32 sprites
    const spriteSize = 32;
    const columns = 16;
    
    // Define specific house types from the sprite sheet
    const houseTypes = [
      { row: 0, col: 0, name: "house_small_brown" },
      { row: 0, col: 1, name: "house_small_brown_2" },
      { row: 0, col: 2, name: "house_small_brown_3" },
      { row: 1, col: 0, name: "shop_gray" },
      { row: 1, col: 1, name: "shop_gray_2" },
      { row: 2, col: 0, name: "house_medium_beige" },
      { row: 2, col: 1, name: "house_medium_beige_2" },
      { row: 3, col: 0, name: "house_large_brown" },
      { row: 3, col: 1, name: "house_large_brown_2" },
      { row: 4, col: 0, name: "venue_blue" },
      { row: 4, col: 1, name: "venue_blue_2" },
      { row: 5, col: 0, name: "venue_red" },
      { row: 5, col: 1, name: "venue_red_2" },
      { row: 6, col: 0, name: "house_fancy_red" },
      { row: 6, col: 1, name: "house_fancy_red_2" },
      { row: 7, col: 0, name: "shop_green" },
      { row: 7, col: 1, name: "shop_green_2" },
      { row: 8, col: 0, name: "venue_purple" },
      { row: 8, col: 1, name: "venue_purple_2" },
      { row: 9, col: 0, name: "office_tall" },
      { row: 9, col: 1, name: "office_tall_2" },
      { row: 10, col: 0, name: "shop_brown" },
      { row: 10, col: 1, name: "shop_brown_2" },
      { row: 11, col: 0, name: "venue_modern" },
      { row: 11, col: 1, name: "venue_modern_2" },
      { row: 12, col: 0, name: "warehouse_gray" },
      { row: 12, col: 1, name: "warehouse_gray_2" },
      { row: 13, col: 0, name: "venue_round" },
      { row: 13, col: 1, name: "venue_round_2" },
      { row: 14, col: 0, name: "office_blue" },
      { row: 14, col: 1, name: "office_blue_2" },
    ];

    houseTypes.forEach(({ row, col, name }) => {
      sprites.set(name, {
        x: col * spriteSize,
        y: row * spriteSize,
        width: spriteSize,
        height: spriteSize,
      });
    });

    this.spriteSheets.set("houses", { image: img, sprites });
  }

  private defineVillageSprites() {
    const img = this.loadedImages.get("village")!;
    const sprites = new Map<string, SpriteDefinition>();
    
    // Village tileset has 16x16 tiles
    const tileSize = 16;
    
    // Define key sprites
    sprites.set("fence_horizontal", { x: 0, y: 64, width: 16, height: 16 });
    sprites.set("fence_vertical", { x: 16, y: 64, width: 16, height: 16 });
    sprites.set("fence_corner", { x: 32, y: 64, width: 16, height: 16 });
    sprites.set("barrel", { x: 48, y: 80, width: 16, height: 16 });
    sprites.set("crate", { x: 64, y: 80, width: 16, height: 16 });
    
    this.spriteSheets.set("village", { image: img, sprites });
  }

  private defineTerrainSprites() {
    const img = this.loadedImages.get("terrain")!;
    const sprites = new Map<string, SpriteDefinition>();
    
    // Terrain tileset is 16x16
    const tileSize = 16;
    
    // Grass variations
    sprites.set("grass_1", { x: 0, y: 0, width: 16, height: 16 });
    sprites.set("grass_2", { x: 16, y: 0, width: 16, height: 16 });
    sprites.set("grass_3", { x: 32, y: 0, width: 16, height: 16 });
    
    // Paths
    sprites.set("path_horizontal", { x: 0, y: 96, width: 16, height: 16 });
    sprites.set("path_vertical", { x: 16, y: 96, width: 16, height: 16 });
    sprites.set("path_cross", { x: 32, y: 96, width: 16, height: 16 });
    
    // Trees (32x32)
    sprites.set("tree_1", { x: 0, y: 192, width: 32, height: 32 });
    sprites.set("tree_2", { x: 32, y: 192, width: 32, height: 32 });
    sprites.set("tree_3", { x: 64, y: 192, width: 32, height: 32 });
    
    // Water
    sprites.set("water", { x: 0, y: 288, width: 16, height: 16 });
    
    this.spriteSheets.set("terrain", { image: img, sprites });
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    sheetName: string,
    spriteName: string,
    destX: number,
    destY: number,
    destWidth?: number,
    destHeight?: number
  ) {
    const sheet = this.spriteSheets.get(sheetName);
    if (!sheet) return;
    
    const sprite = sheet.sprites.get(spriteName);
    if (!sprite) return;
    
    ctx.drawImage(
      sheet.image,
      sprite.x,
      sprite.y,
      sprite.width,
      sprite.height,
      destX,
      destY,
      destWidth || sprite.width,
      destHeight || sprite.height
    );
  }

  drawTile(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    tileX: number,
    tileY: number,
    tileSize: number,
    destX: number,
    destY: number,
    destSize: number
  ) {
    ctx.drawImage(
      img,
      tileX * tileSize,
      tileY * tileSize,
      tileSize,
      tileSize,
      destX,
      destY,
      destSize,
      destSize
    );
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.loadedImages.get(key);
  }

  isLoaded(): boolean {
    return this.loadedImages.size > 0;
  }
}
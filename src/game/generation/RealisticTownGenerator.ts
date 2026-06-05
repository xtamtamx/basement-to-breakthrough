import { GeneratedTown } from "./TownGenerator";

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  buildings: any[];
}

export class RealisticTownGenerator {
  private gridWidth: number;
  private gridHeight: number;
  private blockSize: number = 8; // Standard city block size
  private streetWidth: number = 2; // Street width in tiles
  private avenueWidth: number = 3; // Main avenue width

  constructor(gridWidth: number = 80, gridHeight: number = 60) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
  }

  generateTown(playerStats: {
    showsBooked: number;
    venuesOwned: number;
    bandsManaged: number;
    sceneReputation: number;
  }): GeneratedTown {
    const buildings: any[] = [];
    const roads: any[] = [];
    const greenSpaces: any[] = [];
    const blocks: Block[] = [];

    // Calculate city size based on player progress
    const growthStage = Math.min(5, Math.floor(
      (playerStats.showsBooked * 0.1 + 
       playerStats.venuesOwned * 2 + 
       playerStats.bandsManaged * 0.5 + 
       playerStats.sceneReputation * 0.05) / 5
    )) || 1;

    // City center
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);

    // 1. Create main avenues (cross pattern through city center)
    // Main horizontal avenue
    roads.push({
      type: "avenue",
      width: this.avenueWidth,
      points: Array.from({ length: this.gridWidth }, (_, i) => ({
        x: i,
        y: centerY - Math.floor(this.avenueWidth / 2)
      }))
    });

    // Main vertical avenue
    roads.push({
      type: "avenue", 
      width: this.avenueWidth,
      points: Array.from({ length: this.gridHeight }, (_, i) => ({
        x: centerX - Math.floor(this.avenueWidth / 2),
        y: i
      }))
    });

    // 2. Create street grid
    const blockSpacing = this.blockSize + this.streetWidth;
    
    // Horizontal streets
    for (let y = 0; y < this.gridHeight; y += blockSpacing) {
      if (Math.abs(y - centerY) > this.avenueWidth) { // Don't overlap with avenue
        roads.push({
          type: "street",
          width: this.streetWidth,
          points: Array.from({ length: this.gridWidth }, (_, i) => ({
            x: i,
            y: y
          }))
        });
      }
    }

    // Vertical streets  
    for (let x = 0; x < this.gridWidth; x += blockSpacing) {
      if (Math.abs(x - centerX) > this.avenueWidth) { // Don't overlap with avenue
        roads.push({
          type: "street",
          width: this.streetWidth,
          points: Array.from({ length: this.gridHeight }, (_, i) => ({
            x: x,
            y: i
          }))
        });
      }
    }

    // 3. Define city blocks
    for (let x = 0; x < this.gridWidth - this.blockSize; x += blockSpacing) {
      for (let y = 0; y < this.gridHeight - this.blockSize; y += blockSpacing) {
        // Skip blocks that would overlap with main avenues
        if (Math.abs(x + this.blockSize/2 - centerX) < this.avenueWidth + 2 ||
            Math.abs(y + this.blockSize/2 - centerY) < this.avenueWidth + 2) {
          continue;
        }

        blocks.push({
          x: x + this.streetWidth,
          y: y + this.streetWidth,
          width: this.blockSize,
          height: this.blockSize,
          buildings: []
        });
      }
    }

    // 4. Create downtown/city center (always present)
    const townSquare = {
      x: centerX - 4,
      y: centerY - 4,
      width: 8,
      height: 8,
      features: ["fountain", "benches", "statue"]
    };

    // Add plaza/park in center
    greenSpaces.push({
      x: centerX,
      y: centerY,
      radius: 3,
      type: "plaza"
    });

    // 5. Fill blocks with buildings based on growth stage
    const maxBlocks = Math.min(blocks.length, 5 + growthStage * 8);
    const activeBlocks = this.selectBlocksByDistance(blocks, centerX, centerY, maxBlocks);

    activeBlocks.forEach((block, index) => {
      const distFromCenter = Math.sqrt(
        Math.pow(block.x + block.width/2 - centerX, 2) + 
        Math.pow(block.y + block.height/2 - centerY, 2)
      );
      
      // Determine district type based on location
      let districtType = "residential";
      if (distFromCenter < 15) {
        districtType = "downtown";
      } else if (distFromCenter < 25) {
        districtType = "commercial";
      }

      // Fill block with buildings
      this.fillBlock(block, buildings, districtType, growthStage);
    });

    // 6. Add parks and green spaces
    const numParks = Math.floor(growthStage * 1.5);
    for (let i = 0; i < numParks; i++) {
      const block = blocks[Math.floor(Math.random() * blocks.length)];
      if (block && Math.random() > 0.7) {
        greenSpaces.push({
          x: block.x + block.width / 2,
          y: block.y + block.height / 2,
          radius: 2,
          type: "park"
        });
        // Remove buildings from this block
        block.buildings = [];
      }
    }

    // Calculate population
    const population = buildings.reduce((sum, b) => {
      if (b.type === "house") return sum + 4;
      if (b.type === "apartment") return sum + 20;
      return sum + 2;
    }, 0);

    return {
      buildings,
      roads,
      greenSpaces,
      townSquare,
      districts: this.defineDistricts(centerX, centerY),
      growthStage,
      population
    };
  }

  private selectBlocksByDistance(blocks: Block[], centerX: number, centerY: number, count: number): Block[] {
    // Sort blocks by distance from center
    const sortedBlocks = [...blocks].sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.x + a.width/2 - centerX, 2) + 
        Math.pow(a.y + a.height/2 - centerY, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.x + b.width/2 - centerX, 2) + 
        Math.pow(b.y + b.height/2 - centerY, 2)
      );
      return distA - distB;
    });

    return sortedBlocks.slice(0, count);
  }

  private fillBlock(block: Block, buildings: any[], districtType: string, growthStage: number) {
    const buildingConfigs = this.getBuildingConfigs(districtType, growthStage);
    
    // Grid-based building placement within block
    const spotsX = Math.floor(block.width / 2);
    const spotsY = Math.floor(block.height / 2);
    
    for (let x = 0; x < spotsX; x++) {
      for (let y = 0; y < spotsY; y++) {
        if (Math.random() > 0.2) { // 80% chance of building
          const config = buildingConfigs[Math.floor(Math.random() * buildingConfigs.length)];
          
          buildings.push({
            x: block.x + x * 2,
            y: block.y + y * 2,
            width: config.width,
            height: config.height,
            type: config.type,
            subtype: config.subtype,
            style: Math.floor(Math.random() * 3),
            age: this.getBuildingAge(growthStage),
            district: districtType
          });
        }
      }
    }
  }

  private getBuildingConfigs(districtType: string, growthStage: number) {
    const configs = {
      downtown: [
        { type: "venue", subtype: "club", width: 2, height: 2 },
        { type: "venue", subtype: "bar", width: 2, height: 2 },
        { type: "shop", subtype: "music", width: 2, height: 2 },
        { type: "office", subtype: "label", width: 2, height: 2 },
        { type: "shop", subtype: "retail", width: 2, height: 2 }
      ],
      commercial: [
        { type: "shop", subtype: "general", width: 2, height: 2 },
        { type: "workplace", subtype: "office", width: 2, height: 2 },
        { type: "shop", subtype: "food", width: 2, height: 2 },
        { type: "venue", subtype: "small", width: 2, height: 2 }
      ],
      residential: [
        { type: "house", subtype: "small", width: 2, height: 2 },
        { type: "house", subtype: "medium", width: 2, height: 2 },
        { type: "apartment", subtype: "small", width: 2, height: 2 }
      ]
    };

    // Add larger buildings in later stages
    if (growthStage >= 3) {
      configs.downtown.push(
        { type: "venue", subtype: "arena", width: 2, height: 2 },
        { type: "office", subtype: "tower", width: 2, height: 2 }
      );
      configs.residential.push(
        { type: "apartment", subtype: "large", width: 2, height: 2 }
      );
    }

    return configs[districtType] || configs.residential;
  }

  private getBuildingAge(growthStage: number): string {
    const rand = Math.random();
    if (growthStage === 1) return "new";
    if (growthStage === 2) return rand > 0.5 ? "new" : "normal";
    if (growthStage === 3) return rand > 0.7 ? "new" : rand > 0.3 ? "normal" : "old";
    return rand > 0.8 ? "new" : rand > 0.4 ? "normal" : "old";
  }

  private defineDistricts(centerX: number, centerY: number) {
    return [
      {
        id: "downtown",
        name: "Downtown",
        x: centerX - 15,
        y: centerY - 15,
        width: 30,
        height: 30,
        color: "#FF6B6B",
        description: "City center with venues and shops"
      },
      {
        id: "eastside",
        name: "East Side",
        x: centerX + 15,
        y: centerY - 20,
        width: 25,
        height: 40,
        color: "#4ECDC4",
        description: "Commercial district"
      },
      {
        id: "westend",
        name: "West End",
        x: centerX - 40,
        y: centerY - 20,
        width: 25,
        height: 40,
        color: "#95E1D3",
        description: "Residential area"
      },
      {
        id: "northside",
        name: "North Side",
        x: centerX - 20,
        y: centerY - 40,
        width: 40,
        height: 20,
        color: "#F38181",
        description: "Mixed residential and commercial"
      }
    ];
  }
}
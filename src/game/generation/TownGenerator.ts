// Organic town generation for Stardew Valley-style growth
import { DistrictType } from "@/game/types/core";

export interface TownBuilding {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "shop" | "venue" | "workplace" | "community" | "park";
  subtype?: string;
  rotation: number;
  age: "new" | "established" | "old";
  style: number; // Variation for visual diversity
}

export interface TownRoad {
  points: Array<{ x: number; y: number }>;
  width: number;
  type: "main" | "side" | "path";
}

export interface TownSquare {
  x: number;
  y: number;
  width: number;
  height: number;
  features: Array<"fountain" | "statue" | "garden" | "market">;
}

export interface GeneratedTown {
  width: number;
  height: number;
  buildings: TownBuilding[];
  roads: TownRoad[];
  townSquare: TownSquare;
  greenSpaces: Array<{ x: number; y: number; radius: number }>;
  growthStage: number;
  population: number;
}

export class TownGenerator {
  private width: number;
  private height: number;
  private growthStage: number;
  private seed: number;

  constructor(
    width: number = 40,
    height: number = 30,
    growthStage: number = 1,
  ) {
    this.width = width;
    this.height = height;
    this.growthStage = growthStage;
    this.seed = Date.now();
  }

  generateTown(playerStats: {
    showsBooked: number;
    venuesOwned: number;
    bandsManaged: number;
    sceneReputation: number;
  }): GeneratedTown {
    // Calculate actual growth based on player progress
    const actualGrowth = this.calculateGrowthLevel(playerStats);

    // Start with town center
    const townSquare = this.createTownSquare();
    const buildings: TownBuilding[] = [];
    const roads: TownRoad[] = [];
    const greenSpaces: Array<{ x: number; y: number; radius: number }> = [];

    // Create main street through town square
    const mainStreet = this.createMainStreet(townSquare);
    roads.push(mainStreet);

    // Add initial buildings around town square (always present)
    this.addTownSquareBuildings(buildings, townSquare, mainStreet);

    // Add side streets based on growth
    if (actualGrowth >= 2) {
      const sideStreets = this.createSideStreets(
        mainStreet,
        townSquare,
        actualGrowth,
      );
      roads.push(...sideStreets);
    }

    // Add buildings along main street first
    if (actualGrowth >= 1) {
      this.addBuildingsAlongRoad(buildings, mainStreet, actualGrowth);
    }

    // Then add buildings along side streets
    if (actualGrowth >= 2) {
      roads
        .filter((r) => r.type === "side")
        .forEach((road) => {
          this.addBuildingsAlongRoad(buildings, road, actualGrowth);
        });
    }

    // Add residential neighborhoods
    if (actualGrowth >= 3) {
      this.addResidentialAreas(buildings, roads, townSquare, actualGrowth);
    }

    // Add one park near town square
    if (townSquare) {
      greenSpaces.push({
        x: townSquare.x - 5,
        y: townSquare.y + townSquare.height + 3,
        radius: 2,
      });
    }

    // Calculate population based on buildings
    const population = this.calculatePopulation(buildings);

    return {
      width: this.width,
      height: this.height,
      buildings,
      roads,
      townSquare,
      greenSpaces,
      growthStage: actualGrowth,
      population,
    };
  }

  private calculateGrowthLevel(playerStats: {
    showsBooked: number;
    venuesOwned: number;
    bandsManaged: number;
    sceneReputation: number;
  }): number {
    // Growth stages:
    // 1: Tiny village (5-10 buildings)
    // 2: Small town (15-25 buildings)
    // 3: Growing town (30-50 buildings)
    // 4: Bustling town (60-80 buildings)
    // 5: Small city (100+ buildings)

    const score =
      playerStats.showsBooked * 0.5 +
      playerStats.venuesOwned * 10 +
      playerStats.bandsManaged * 5 +
      playerStats.sceneReputation * 0.2;

    if (score < 10) return 1;
    if (score < 30) return 2;
    if (score < 60) return 3;
    if (score < 100) return 4;
    return 5;
  }

  private createTownSquare(): TownSquare {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    return {
      x: centerX - 3,
      y: centerY - 3,
      width: 6,
      height: 6,
      features: ["fountain"], // Start with just a fountain
    };
  }

  private createMainStreet(townSquare: TownSquare): TownRoad {
    const centerX = townSquare.x + townSquare.width / 2;
    const centerY = townSquare.y + townSquare.height / 2;

    // Create a straight main street through town
    const points: Array<{ x: number; y: number }> = [];

    // West to east through town
    for (let x = 3; x < this.width - 3; x++) {
      points.push({
        x,
        y: centerY,
      });
    }

    return {
      points,
      width: 2,
      type: "main",
    };
  }

  private createSideStreets(
    mainStreet: TownRoad,
    townSquare: TownSquare,
    growth: number,
  ): TownRoad[] {
    const streets: TownRoad[] = [];
    const centerX = townSquare.x + townSquare.width / 2;

    // Create perpendicular streets at regular intervals
    const streetSpacing = 8; // Space between streets
    const numStreets = Math.min(growth + 1, 5);

    for (let i = 0; i < numStreets; i++) {
      const xPos = centerX + (i - Math.floor(numStreets / 2)) * streetSpacing;

      // Skip if too close to town square
      if (Math.abs(xPos - centerX) < townSquare.width / 2 + 2) continue;

      const points: Array<{ x: number; y: number }> = [];

      // North-south street
      for (let y = 3; y < this.height - 3; y++) {
        points.push({
          x: xPos,
          y: y,
        });
      }

      streets.push({
        points,
        width: 1,
        type: "side",
      });
    }

    return streets;
  }

  private addTownSquareBuildings(
    buildings: TownBuilding[],
    townSquare: TownSquare,
    mainStreet: TownRoad,
  ) {
    // Essential town square buildings
    const essentials = [
      { type: "community" as const, subtype: "townhall", width: 3, height: 2 },
      { type: "shop" as const, subtype: "general", width: 2, height: 2 },
      { type: "venue" as const, subtype: "basement", width: 2, height: 2 },
      { type: "workplace" as const, subtype: "coffee", width: 2, height: 1 },
    ];

    // Place around town square
    const positions = [
      { x: townSquare.x - 3, y: townSquare.y }, // West
      { x: townSquare.x + townSquare.width + 1, y: townSquare.y }, // East
      { x: townSquare.x, y: townSquare.y - 3 }, // North
      { x: townSquare.x, y: townSquare.y + townSquare.height + 1 }, // South
    ];

    essentials.forEach((building, index) => {
      if (index < positions.length) {
        buildings.push({
          ...building,
          x: positions[index].x,
          y: positions[index].y,
          rotation: 0,
          age: "old",
          style: Math.floor(Math.random() * 3),
        });
      }
    });
  }

  private addBuildingsAlongRoad(
    buildings: TownBuilding[],
    road: TownRoad,
    growth: number,
  ) {
    const skipChance = 0.4 - growth * 0.08; // Decreases with growth

    // For main streets, place buildings more regularly
    const spacing = road.type === "main" ? 4 : 3;

    // Sample points along the road
    for (let i = 0; i < road.points.length; i += spacing) {
      const point = road.points[i];
      if (!point) continue;

      // Place buildings on both sides of the road
      for (const side of [-1, 1]) {
        if (Math.random() < skipChance) continue;

        const buildingType = this.chooseBuildingType(growth);
        const offset = road.width + 2; // Space from road

        const buildingX =
          road.type === "main"
            ? point.x - buildingType.width / 2
            : point.x + side * offset;

        const buildingY =
          road.type === "main"
            ? point.y + side * offset
            : point.y - buildingType.height / 2;

        // Check if building would be out of bounds
        if (
          buildingX < 2 ||
          buildingX + buildingType.width > this.width - 2 ||
          buildingY < 2 ||
          buildingY + buildingType.height > this.height - 2
        ) {
          continue;
        }

        // Check if too close to existing buildings
        const tooClose = buildings.some((b) => {
          const dx = Math.abs(
            b.x + b.width / 2 - (buildingX + buildingType.width / 2),
          );
          const dy = Math.abs(
            b.y + b.height / 2 - (buildingY + buildingType.height / 2),
          );
          return dx < 3 && dy < 3;
        });

        if (!tooClose) {
          buildings.push({
            x: buildingX,
            y: buildingY,
            width: buildingType.width,
            height: buildingType.height,
            type: buildingType.type,
            subtype: buildingType.subtype,
            rotation: 0,
            age: this.chooseBuildingAge(growth),
            style: Math.floor(Math.random() * 4),
          });
        }
      }
    }
  }

  private chooseBuildingType(growth: number): {
    type: TownBuilding["type"];
    subtype?: string;
    width: number;
    height: number;
  } {
    const types = [
      { type: "house" as const, width: 2, height: 2, weight: 5 },
      { type: "shop" as const, width: 2, height: 2, weight: 2 },
      { type: "workplace" as const, width: 2, height: 1, weight: 2 },
    ];

    if (growth >= 2) {
      types.push({ type: "venue" as const, width: 3, height: 2, weight: 1 });
    }

    if (growth >= 3) {
      types.push({
        type: "community" as const,
        width: 3,
        height: 3,
        weight: 1,
      });
    }

    // Weighted random selection
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const buildingType of types) {
      random -= buildingType.weight;
      if (random <= 0) {
        return {
          type: buildingType.type,
          width: buildingType.width,
          height: buildingType.height,
        };
      }
    }

    return types[0];
  }

  private chooseBuildingAge(growth: number): TownBuilding["age"] {
    const random = Math.random();
    if (growth <= 2) {
      return random < 0.7 ? "old" : "established";
    } else if (growth <= 4) {
      if (random < 0.4) return "old";
      if (random < 0.8) return "established";
      return "new";
    } else {
      if (random < 0.3) return "old";
      if (random < 0.6) return "established";
      return "new";
    }
  }

  private addResidentialAreas(
    buildings: TownBuilding[],
    roads: TownRoad[],
    townSquare: TownSquare,
    growth: number,
  ) {
    // Create residential blocks in corners of the map
    const positions = [
      { x: 5, y: 5 }, // Top-left
      { x: this.width - 10, y: 5 }, // Top-right
      { x: 5, y: this.height - 10 }, // Bottom-left
      { x: this.width - 10, y: this.height - 10 }, // Bottom-right
    ];

    const numNeighborhoods = Math.min(growth - 2, positions.length);

    for (let n = 0; n < numNeighborhoods; n++) {
      const pos = positions[n];

      // Create a grid of houses
      const gridSize = 2 + Math.floor(growth / 2);
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (Math.random() < 0.3) continue; // Some empty lots

          const houseX = pos.x + col * 3;
          const houseY = pos.y + row * 3;

          // Check bounds
          if (
            houseX < 2 ||
            houseX > this.width - 4 ||
            houseY < 2 ||
            houseY > this.height - 4
          ) {
            continue;
          }

          buildings.push({
            x: houseX,
            y: houseY,
            width: 2,
            height: 2,
            type: "house",
            rotation: 0,
            age: this.chooseBuildingAge(growth),
            style: Math.floor(Math.random() * 5),
          });
        }
      }

      // Add a simple connecting road
      const centerX = townSquare.x + townSquare.width / 2;
      const centerY = townSquare.y + townSquare.height / 2;

      roads.push({
        points: [
          { x: pos.x + gridSize, y: pos.y + gridSize },
          { x: centerX, y: centerY },
        ],
        width: 1,
        type: "path",
      });
    }
  }

  private addGreenSpaces(
    greenSpaces: Array<{ x: number; y: number; radius: number }>,
    buildings: TownBuilding[],
    growth: number,
  ) {
    const numParks = Math.floor(growth / 2) + 1;

    for (let i = 0; i < numParks; i++) {
      // Find a spot without buildings
      let attempts = 0;
      let placed = false;

      while (!placed && attempts < 50) {
        const x = 5 + Math.random() * (this.width - 10);
        const y = 5 + Math.random() * (this.height - 10);
        const radius = 2 + Math.random() * 2;

        // Check if it overlaps with buildings
        const overlaps = buildings.some((b) => {
          const dist = Math.sqrt(
            Math.pow(b.x + b.width / 2 - x, 2) +
              Math.pow(b.y + b.height / 2 - y, 2),
          );
          return dist < radius + Math.max(b.width, b.height);
        });

        if (!overlaps) {
          greenSpaces.push({ x, y, radius });

          // Sometimes add a park building
          if (Math.random() < 0.3) {
            buildings.push({
              x: x - 1,
              y: y - 1,
              width: 2,
              height: 2,
              type: "park",
              rotation: 0,
              age: "established",
              style: 0,
            });
          }

          placed = true;
        }

        attempts++;
      }
    }
  }

  private calculatePopulation(buildings: TownBuilding[]): number {
    let population = 50; // Base population

    buildings.forEach((building) => {
      switch (building.type) {
        case "house":
          population += 2 + Math.floor(Math.random() * 3);
          break;
        case "shop":
          population += 1;
          break;
        case "workplace":
          population += 2;
          break;
        case "venue":
          population += 5;
          break;
        case "community":
          population += 3;
          break;
      }
    });

    return population;
  }
}

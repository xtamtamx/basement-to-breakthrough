// A town generator that creates actual towns that look like real places
import { TownBuilding, TownRoad, GeneratedTown } from "./TownGenerator";

export class ProperTownGenerator {
  private width: number;
  private height: number;

  constructor(width: number = 60, height: number = 40) {
    this.width = width;
    this.height = height;
  }

  generateTown(playerStats: {
    showsBooked: number;
    venuesOwned: number;
    bandsManaged: number;
    sceneReputation: number;
  }): GeneratedTown {
    const growth = this.calculateGrowthLevel(playerStats);
    const buildings: TownBuilding[] = [];
    const roads: TownRoad[] = [];

    // Create the main street first - horizontal through center
    const mainStreetY = Math.floor(this.height / 2);
    const mainStreet: TownRoad = {
      points: [],
      width: 2,
      type: "main",
    };

    // Main street runs east-west
    for (let x = 0; x < this.width; x++) {
      mainStreet.points.push({ x, y: mainStreetY });
    }
    roads.push(mainStreet);

    // Add cross streets based on growth
    const crossStreetSpacing = 12;
    const numCrossStreets = Math.min(Math.floor(growth * 2), 5);
    const startX = Math.floor(
      (this.width - (numCrossStreets - 1) * crossStreetSpacing) / 2,
    );

    for (let i = 0; i < numCrossStreets; i++) {
      const crossX = startX + i * crossStreetSpacing;
      const crossStreet: TownRoad = {
        points: [],
        width: 1,
        type: "side",
      };

      // Cross streets run north-south
      for (let y = 5; y < this.height - 5; y++) {
        crossStreet.points.push({ x: crossX, y });
      }
      roads.push(crossStreet);
    }

    // Create town square at center
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const townSquare = {
      x: centerX - 4,
      y: centerY - 3,
      width: 8,
      height: 6,
      features: ["fountain"] as const,
    };

    // Place buildings along streets in a sensible pattern
    this.placeDowntownBuildings(
      buildings,
      mainStreet,
      roads,
      townSquare,
      growth,
    );

    // Add residential areas off the main drag
    if (growth >= 2) {
      this.placeResidentialBlocks(buildings, roads, townSquare, growth);
    }

    // Add some parks/green spaces
    const greenSpaces = this.placeParks(buildings, growth);

    const population = 50 + buildings.length * 4;

    return {
      width: this.width,
      height: this.height,
      buildings,
      roads,
      townSquare,
      greenSpaces,
      growthStage: growth,
      population,
    };
  }

  private calculateGrowthLevel(playerStats: {
    showsBooked: number;
    venuesOwned: number;
    bandsManaged: number;
    sceneReputation: number;
  }): number {
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

  private placeDowntownBuildings(
    buildings: TownBuilding[],
    mainStreet: TownRoad,
    allRoads: TownRoad[],
    townSquare: any,
    growth: number,
  ) {
    const mainY = mainStreet.points[0].y;

    // Place buildings on both sides of main street
    const buildingSpacing = 3;
    const startX = 8;
    const endX = this.width - 8;

    for (let x = startX; x < endX; x += buildingSpacing) {
      // Skip town square area
      if (x >= townSquare.x - 2 && x <= townSquare.x + townSquare.width + 2) {
        continue;
      }

      // Skip intersections
      const nearIntersection = allRoads.some(
        (road) => road.type === "side" && Math.abs(road.points[0].x - x) < 3,
      );
      if (nearIntersection) continue;

      // North side of street
      if (Math.random() < 0.7) {
        const buildingType = this.getDowntownBuildingType(growth);
        buildings.push({
          x: x,
          y: mainY - 3,
          width: 2,
          height: 2,
          type: buildingType,
          rotation: 0,
          age: "established",
          style: Math.floor(Math.random() * 3),
        });
      }

      // South side of street
      if (Math.random() < 0.7) {
        const buildingType = this.getDowntownBuildingType(growth);
        buildings.push({
          x: x,
          y: mainY + 2,
          width: 2,
          height: 2,
          type: buildingType,
          rotation: 0,
          age: "established",
          style: Math.floor(Math.random() * 3),
        });
      }
    }

    // Add important buildings around town square
    const squareBuildings = [
      { type: "community" as const, x: townSquare.x - 3, y: townSquare.y },
      {
        type: "shop" as const,
        x: townSquare.x + townSquare.width + 1,
        y: townSquare.y,
      },
      { type: "venue" as const, x: townSquare.x, y: townSquare.y - 3 },
      {
        type: "workplace" as const,
        x: townSquare.x,
        y: townSquare.y + townSquare.height + 1,
      },
    ];

    squareBuildings.forEach((b) => {
      if (
        b.x >= 0 &&
        b.x < this.width - 2 &&
        b.y >= 0 &&
        b.y < this.height - 2
      ) {
        buildings.push({
          ...b,
          width: 2,
          height: 2,
          rotation: 0,
          age: "old",
          style: 0,
        });
      }
    });
  }

  private getDowntownBuildingType(growth: number): TownBuilding["type"] {
    const rand = Math.random();
    if (rand < 0.4) return "shop";
    if (rand < 0.6) return "workplace";
    if (rand < 0.8 && growth >= 2) return "venue";
    return "house";
  }

  private placeResidentialBlocks(
    buildings: TownBuilding[],
    roads: TownRoad[],
    townSquare: any,
    growth: number,
  ) {
    // Create residential neighborhoods off the main roads
    const sideRoads = roads.filter((r) => r.type === "side");

    sideRoads.forEach((road, index) => {
      if (index >= growth) return; // Limit based on growth

      const roadX = road.points[0].x;

      // Place houses along the side streets
      for (let y = 8; y < this.height - 8; y += 3) {
        // Skip main street area
        if (Math.abs(y - townSquare.y - townSquare.height / 2) < 4) continue;

        // East side of street
        if (Math.random() < 0.6) {
          buildings.push({
            x: roadX + 2,
            y: y,
            width: 2,
            height: 2,
            type: "house",
            rotation: 0,
            age: index < 2 ? "established" : "new",
            style: Math.floor(Math.random() * 4),
          });
        }

        // West side of street
        if (Math.random() < 0.6) {
          buildings.push({
            x: roadX - 3,
            y: y,
            width: 2,
            height: 2,
            type: "house",
            rotation: 0,
            age: index < 2 ? "established" : "new",
            style: Math.floor(Math.random() * 4),
          });
        }
      }
    });
  }

  private placeParks(
    buildings: TownBuilding[],
    growth: number,
  ): Array<{ x: number; y: number; radius: number }> {
    const parks: Array<{ x: number; y: number; radius: number }> = [];

    // Always have at least one small park
    parks.push({
      x: 10,
      y: 10,
      radius: 2,
    });

    if (growth >= 3) {
      parks.push({
        x: this.width - 10,
        y: this.height - 10,
        radius: 3,
      });
    }

    return parks;
  }
}

// City generation system for DIY Indie Empire
import { DistrictType } from "@/game/types/core";

export interface CityCell {
  x: number;
  y: number;
  districtId: string | null;
  isStreet: boolean;
  buildingType: string | null;
  developmentLevel:
    | "empty"
    | "construction"
    | "basic"
    | "developed"
    | "thriving";
  elevation: number; // Used for district generation
  variation: number; // For sprite variety
}

export interface DistrictSeed {
  id: string;
  type: DistrictType;
  centerX: number;
  centerY: number;
  color: string;
  influence: number;
}

export interface GeneratedCity {
  width: number;
  height: number;
  cells: CityCell[][];
  districts: Map<string, DistrictInfo>;
  streets: StreetSegment[];
}

export interface DistrictInfo {
  id: string;
  name: string;
  type: DistrictType;
  cells: CityCell[];
  bounds: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  neighbors: string[];
  color: string;
  sceneStrength: number;
  rentMultiplier: number;
}

export interface StreetSegment {
  start: { x: number; y: number };
  end: { x: number; y: number };
  type: "main" | "secondary" | "alley";
}

export class CityGenerator {
  private width: number;
  private height: number;
  private cells: CityCell[][];
  private districtSeeds: DistrictSeed[];
  private districts: Map<string, DistrictInfo>;

  constructor(width: number = 30, height: number = 20) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.districtSeeds = [];
    this.districts = new Map();
  }

  generateCity(): GeneratedCity {
    // Step 1: Initialize grid
    this.initializeGrid();

    // Step 2: Place district seeds
    this.placeDistrictSeeds();

    // Step 3: Grow districts using Voronoi-like expansion
    this.growDistricts();

    // Step 4: Smooth district boundaries
    this.smoothBoundaries();

    // Step 5: Generate street network
    const streets = this.generateStreets();

    // Step 6: Analyze districts
    this.analyzeDistricts();

    // Step 7: Seed initial development (sparse buildings)
    this.seedInitialDevelopment();

    return {
      width: this.width,
      height: this.height,
      cells: this.cells,
      districts: this.districts,
      streets,
    };
  }

  private initializeGrid(): void {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = {
          x,
          y,
          districtId: null,
          isStreet: false,
          buildingType: null,
          developmentLevel: "empty",
          elevation: Math.random() * 0.2, // Small random variation
          variation: Math.floor(Math.random() * 3), // For sprite variety
        };
      }
    }

    // Add some terrain features for more organic shapes
    this.addNoiseToElevation();
  }

  private addNoiseToElevation(): void {
    // Simple Perlin-like noise for organic district shapes
    const scale = 0.1;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const noise = this.simplex2D(x * scale, y * scale);
        this.cells[y][x].elevation += noise * 0.5;
      }
    }
  }

  private simplex2D(x: number, y: number): number {
    // Simplified noise function
    const s = (x + y) * 0.5;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * 0.211;
    const X0 = i - t;
    const Y0 = j - t;

    return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  }

  private placeDistrictSeeds(): void {
    const districtTypes: Array<{
      type: DistrictType;
      color: string;
      count: number;
    }> = [
      { type: "downtown", color: "#3B82F6", count: 1 },
      { type: "warehouse", color: "#EF4444", count: 1 },
      { type: "college", color: "#10B981", count: 1 },
      { type: "residential", color: "#F59E0B", count: 1 },
      { type: "arts", color: "#8B5CF6", count: 1 },
    ];

    // Create a more structured grid placement
    const positions = [
      { x: this.width * 0.3, y: this.height * 0.3 }, // Top left
      { x: this.width * 0.7, y: this.height * 0.3 }, // Top right
      { x: this.width * 0.5, y: this.height * 0.5 }, // Center
      { x: this.width * 0.3, y: this.height * 0.7 }, // Bottom left
      { x: this.width * 0.7, y: this.height * 0.7 }, // Bottom right
    ];

    let id = 0;
    districtTypes.forEach((districtConfig, index) => {
      const pos = positions[index % positions.length];
      this.districtSeeds.push({
        id: `district_${id++}`,
        type: districtConfig.type,
        centerX: Math.floor(pos.x),
        centerY: Math.floor(pos.y),
        color: districtConfig.color,
        influence: 1.0,
      });
    });
  }

  private growDistricts(): void {
    // Simple Voronoi-like assignment based on nearest seed
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let minDist = Infinity;
        let nearestSeed = this.districtSeeds[0];

        // Find nearest district seed
        for (const seed of this.districtSeeds) {
          const dist = Math.sqrt(
            Math.pow(seed.centerX - x, 2) + Math.pow(seed.centerY - y, 2),
          );

          // Add minimal noise for slightly organic boundaries
          const noiseDist = dist + (Math.random() - 0.5) * 2;

          if (noiseDist < minDist) {
            minDist = noiseDist;
            nearestSeed = seed;
          }
        }

        this.cells[y][x].districtId = nearestSeed.id;
      }
    }
  }

  private fillEmptyCells(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x].districtId === null) {
          // Find nearest district
          let minDist = Infinity;
          let nearestDistrict = this.districtSeeds[0].id;

          for (const seed of this.districtSeeds) {
            const dist = Math.sqrt(
              Math.pow(seed.centerX - x, 2) + Math.pow(seed.centerY - y, 2),
            );
            if (dist < minDist) {
              minDist = dist;
              nearestDistrict = seed.id;
            }
          }

          this.cells[y][x].districtId = nearestDistrict;
        }
      }
    }
  }

  private generateStreets(): StreetSegment[] {
    const streets: StreetSegment[] = [];

    // Generate main streets connecting district centers
    for (let i = 0; i < this.districtSeeds.length; i++) {
      const seed1 = this.districtSeeds[i];

      // Connect to 2-3 nearest districts
      const distances = this.districtSeeds
        .filter((_, j) => j !== i)
        .map((seed2) => ({
          seed: seed2,
          dist: Math.sqrt(
            Math.pow(seed1.centerX - seed2.centerX, 2) +
              Math.pow(seed1.centerY - seed2.centerY, 2),
          ),
        }))
        .sort((a, b) => a.dist - b.dist);

      // Connect to nearest 2 districts
      for (let j = 0; j < Math.min(2, distances.length); j++) {
        const seed2 = distances[j].seed;

        // Create street path (simplified - straight line for now)
        const street: StreetSegment = {
          start: { x: Math.floor(seed1.centerX), y: Math.floor(seed1.centerY) },
          end: { x: Math.floor(seed2.centerX), y: Math.floor(seed2.centerY) },
          type: "main",
        };

        // Mark cells as streets
        this.markStreetCells(street);
        streets.push(street);
      }
    }

    // Add secondary streets along district boundaries
    this.addBoundaryStreets(streets);

    return streets;
  }

  private markStreetCells(street: StreetSegment): void {
    // Bresenham's line algorithm
    const dx = Math.abs(street.end.x - street.start.x);
    const dy = Math.abs(street.end.y - street.start.y);
    const sx = street.start.x < street.end.x ? 1 : -1;
    const sy = street.start.y < street.end.y ? 1 : -1;
    let err = dx - dy;

    let x = street.start.x;
    let y = street.start.y;

    while (true) {
      if (this.isValidCell(x, y)) {
        this.cells[y][x].isStreet = true;
        // Also mark adjacent cells for wider streets
        if (street.type === "main") {
          this.markAdjacentAsStreet(x, y);
        }
      }

      if (x === street.end.x && y === street.end.y) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private markAdjacentAsStreet(x: number, y: number): void {
    const adjacent = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    for (const pos of adjacent) {
      if (this.isValidCell(pos.x, pos.y)) {
        this.cells[pos.y][pos.x].isStreet = true;
      }
    }
  }

  private addBoundaryStreets(streets: StreetSegment[]): void {
    // Find district boundaries and add streets along them
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const currentDistrict = this.cells[y][x].districtId;
        const neighbors = [
          this.cells[y - 1][x].districtId,
          this.cells[y + 1][x].districtId,
          this.cells[y][x - 1].districtId,
          this.cells[y][x + 1].districtId,
        ];

        // If at boundary between districts
        if (neighbors.some((n) => n !== currentDistrict)) {
          // Randomly add boundary streets
          if (Math.random() < 0.3) {
            this.cells[y][x].isStreet = true;
          }
        }
      }
    }
  }

  private smoothBoundaries(): void {
    // Apply cellular automata-like smoothing
    for (let iteration = 0; iteration < 2; iteration++) {
      const newCells = JSON.parse(JSON.stringify(this.cells));

      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (this.cells[y][x].isStreet) continue;

          // Count neighbors of same district
          const currentDistrict = this.cells[y][x].districtId;
          const neighbors = this.getNeighborCells(x, y);
          const sameDistrictCount = neighbors.filter(
            (n) => n.districtId === currentDistrict,
          ).length;

          // If surrounded by different district, switch
          if (sameDistrictCount < 3) {
            const districtCounts = new Map<string, number>();
            for (const neighbor of neighbors) {
              if (neighbor.districtId) {
                districtCounts.set(
                  neighbor.districtId,
                  (districtCounts.get(neighbor.districtId) || 0) + 1,
                );
              }
            }

            // Switch to majority district
            let maxCount = 0;
            let newDistrict = currentDistrict;
            for (const [district, count] of districtCounts) {
              if (count > maxCount) {
                maxCount = count;
                newDistrict = district;
              }
            }

            newCells[y][x].districtId = newDistrict;
          }
        }
      }

      this.cells = newCells;
    }
  }

  private analyzeDistricts(): void {
    this.districts.clear();

    // Group cells by district
    const districtCells = new Map<string, CityCell[]>();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell.districtId && !cell.isStreet) {
          if (!districtCells.has(cell.districtId)) {
            districtCells.set(cell.districtId, []);
          }
          districtCells.get(cell.districtId)!.push(cell);
        }
      }
    }

    // Create district info
    for (const [districtId, cells] of districtCells) {
      const seed = this.districtSeeds.find((s) => s.id === districtId)!;

      // Calculate bounds
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      for (const cell of cells) {
        minX = Math.min(minX, cell.x);
        minY = Math.min(minY, cell.y);
        maxX = Math.max(maxX, cell.x);
        maxY = Math.max(maxY, cell.y);
      }

      // Find neighbors
      const neighbors = new Set<string>();
      for (const cell of cells) {
        const adjacentCells = this.getNeighborCells(cell.x, cell.y);
        for (const adjacent of adjacentCells) {
          if (adjacent.districtId && adjacent.districtId !== districtId) {
            neighbors.add(adjacent.districtId);
          }
        }
      }

      // Generate district name
      const districtNames = {
        downtown: ["Financial District", "City Center", "Metro Core"],
        warehouse: ["Industrial Zone", "Factory District", "The Docks"],
        college: ["University Hill", "Campus Quarter", "Student Village"],
        residential: ["Suburbs", "Oak Heights", "Riverside"],
        arts: ["Creative Quarter", "Gallery District", "Bohemian Village"],
      };

      const nameList = districtNames[seed.type] || ["Unknown District"];
      const name = nameList[Math.floor(Math.random() * nameList.length)];

      // Calculate initial stats
      const sceneStrength = Math.floor(Math.random() * 20) + 10;
      const rentMultiplier =
        seed.type === "downtown"
          ? 2.0
          : seed.type === "warehouse"
            ? 0.8
            : seed.type === "college"
              ? 1.2
              : seed.type === "arts"
                ? 1.5
                : 1.0;

      this.districts.set(districtId, {
        id: districtId,
        name,
        type: seed.type,
        cells,
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
        },
        center: { x: seed.centerX, y: seed.centerY },
        neighbors: Array.from(neighbors),
        color: seed.color,
        sceneStrength,
        rentMultiplier,
      });
    }
  }

  private seedInitialDevelopment(): void {
    // Start with very sparse development
    for (const [districtId, district] of this.districts) {
      const developmentChance = this.getInitialDevelopmentChance(district.type);

      for (const cell of district.cells) {
        if (cell.isStreet) continue;

        const random = Math.random();

        if (random < developmentChance.construction) {
          cell.developmentLevel = "construction";
          cell.buildingType = "construction";
        } else if (random < developmentChance.basic) {
          cell.developmentLevel = "basic";
          cell.buildingType = "building";
        } else if (random < developmentChance.developed) {
          cell.developmentLevel = "developed";
          cell.buildingType = "building";
        }
        // Most cells remain empty
      }
    }
  }

  private getInitialDevelopmentChance(type: DistrictType) {
    // Different districts start with different development levels
    switch (type) {
      case "downtown":
        return { construction: 0.05, basic: 0.15, developed: 0.2 };
      case "warehouse":
        return { construction: 0.02, basic: 0.08, developed: 0.1 };
      case "college":
        return { construction: 0.03, basic: 0.1, developed: 0.13 };
      case "residential":
        return { construction: 0.04, basic: 0.12, developed: 0.16 };
      case "arts":
        return { construction: 0.03, basic: 0.06, developed: 0.08 };
      default:
        return { construction: 0.02, basic: 0.05, developed: 0.07 };
    }
  }

  private getNeighborCells(x: number, y: number): CityCell[] {
    const neighbors: CityCell[] = [];
    const positions = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x - 1, y: y - 1 },
      { x: x + 1, y: y - 1 },
      { x: x - 1, y: y + 1 },
      { x: x + 1, y: y + 1 },
    ];

    for (const pos of positions) {
      if (this.isValidCell(pos.x, pos.y)) {
        neighbors.push(this.cells[pos.y][pos.x]);
      }
    }

    return neighbors;
  }

  private isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}

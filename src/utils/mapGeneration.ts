import {
  CityMap,
  MapTile,
  DistrictType,
  District,
  VenueData,
  WorkplaceData,
} from "@/components/map/MapTypes";
import { Venue, VenueType } from "@/game/types";

// Job types available in different districts
const DISTRICT_JOBS: Record<
  DistrictType,
  Array<{ name: string; wage: number; stress: number }>
> = {
  [DistrictType.DOWNTOWN]: [
    { name: "Coffee Shop Barista", wage: 30, stress: 20 },
    { name: "Record Store Clerk", wage: 35, stress: 15 },
    { name: "Office Temp", wage: 45, stress: 35 },
  ],
  [DistrictType.WAREHOUSE]: [
    { name: "Warehouse Worker", wage: 40, stress: 30 },
    { name: "Delivery Driver", wage: 38, stress: 25 },
    { name: "Night Security", wage: 42, stress: 40 },
  ],
  [DistrictType.COLLEGE]: [
    { name: "Campus Bookstore", wage: 28, stress: 15 },
    { name: "Tutor", wage: 32, stress: 20 },
    { name: "Lab Assistant", wage: 35, stress: 25 },
  ],
  [DistrictType.RESIDENTIAL]: [
    { name: "Grocery Clerk", wage: 30, stress: 20 },
    { name: "Dog Walker", wage: 25, stress: 10 },
    { name: "House Painter", wage: 45, stress: 35 },
  ],
  [DistrictType.ARTS]: [
    { name: "Gallery Assistant", wage: 28, stress: 15 },
    { name: "Theatre Usher", wage: 26, stress: 18 },
    { name: "Studio Tech", wage: 38, stress: 25 },
  ],
};

// Map venue types to districts
const VENUE_DISTRICT_MAPPING: Record<VenueType, DistrictType[]> = {
  [VenueType.BASEMENT]: [DistrictType.RESIDENTIAL, DistrictType.COLLEGE],
  [VenueType.GARAGE]: [DistrictType.RESIDENTIAL],
  [VenueType.HOUSE_SHOW]: [DistrictType.RESIDENTIAL, DistrictType.COLLEGE],
  [VenueType.DIY_SPACE]: [DistrictType.ARTS, DistrictType.COLLEGE],
  [VenueType.DIVE_BAR]: [DistrictType.DOWNTOWN, DistrictType.WAREHOUSE],
  [VenueType.PUNK_CLUB]: [DistrictType.DOWNTOWN, DistrictType.ARTS],
  [VenueType.METAL_VENUE]: [DistrictType.DOWNTOWN, DistrictType.ARTS],
  [VenueType.WAREHOUSE]: [DistrictType.WAREHOUSE],
  [VenueType.UNDERGROUND]: [DistrictType.WAREHOUSE, DistrictType.ARTS],
  [VenueType.THEATER]: [DistrictType.ARTS, DistrictType.DOWNTOWN],
  [VenueType.CONCERT_HALL]: [DistrictType.DOWNTOWN],
  [VenueType.ARENA]: [DistrictType.DOWNTOWN],
  [VenueType.FESTIVAL_GROUNDS]: [DistrictType.WAREHOUSE],
};

// Generate a city map with real game data
export function generateCityMap(gameVenues: Venue[]): CityMap {
  const width = 20;
  const height = 15;
  const tileSize = 32;
  const tiles: MapTile[][] = [];

  // Define smaller, more compact districts
  const districts: District[] = [
    {
      id: "downtown-1",
      type: DistrictType.DOWNTOWN,
      name: "Downtown",
      bounds: { x: 8, y: 0, width: 12, height: 7 },
    },
    {
      id: "warehouse-1",
      type: DistrictType.WAREHOUSE,
      name: "Warehouse District",
      bounds: { x: 0, y: 0, width: 8, height: 7 },
    },
    {
      id: "college-1",
      type: DistrictType.COLLEGE,
      name: "College Town",
      bounds: { x: 0, y: 7, width: 6, height: 8 },
    },
    {
      id: "residential-1",
      type: DistrictType.RESIDENTIAL,
      name: "Residential",
      bounds: { x: 6, y: 7, width: 8, height: 8 },
    },
    {
      id: "arts-1",
      type: DistrictType.ARTS,
      name: "Arts District",
      bounds: { x: 14, y: 7, width: 6, height: 8 },
    },
  ];

  // First pass: Generate base tiles
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      // Determine which district this tile belongs to
      const district = districts.find(
        (d) =>
          x >= d.bounds.x &&
          x < d.bounds.x + d.bounds.width &&
          y >= d.bounds.y &&
          y < d.bounds.y + d.bounds.height,
      );

      const districtType = district?.type || DistrictType.DOWNTOWN;

      // Create simple street grid - main streets every 4 tiles
      const isStreet = x % 4 === 2 || y % 4 === 2;

      let tile: MapTile;

      if (isStreet) {
        tile = {
          x,
          y,
          type: "street",
          district: districtType,
          spriteId: "street",
          interactable: false,
        };
      } else {
        // Default to empty building
        tile = {
          x,
          y,
          type: "building",
          district: districtType,
          spriteId: `building_${districtType}`,
          interactable: false,
        };
      }

      tiles[y][x] = tile;
    }
  }

  // Second pass: Place venues from game data
  const placedVenueIds = new Set<string>();

  gameVenues.forEach((venue) => {
    // Find suitable districts for this venue type
    const suitableDistricts = VENUE_DISTRICT_MAPPING[venue.type] || [
      DistrictType.DOWNTOWN,
    ];

    // Try to place venue in a suitable district
    for (const districtType of suitableDistricts) {
      const district = districts.find((d) => d.type === districtType);
      if (!district) continue;

      // Find a non-street tile in this district
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        const x =
          district.bounds.x + Math.floor(Math.random() * district.bounds.width);
        const y =
          district.bounds.y +
          Math.floor(Math.random() * district.bounds.height);

        if (
          tiles[y] &&
          tiles[y][x] &&
          tiles[y][x].type === "building" &&
          !tiles[y][x].data
        ) {
          // Convert to venue tile
          tiles[y][x] = {
            x,
            y,
            type: "venue",
            district: districtType,
            spriteId: "venue_inactive",
            interactable: true,
            animated: false,
            data: {
              id: venue.id,
              name: venue.name,
              capacity: venue.capacity,
              venueType: venue.type,
              hasActiveShow: false,
            } as VenueData,
          };

          placedVenueIds.add(venue.id);
          placed = true;
        }

        attempts++;
      }

      if (placed) break;
    }
  });

  // Third pass: Place workplaces
  districts.forEach((district) => {
    const jobs = DISTRICT_JOBS[district.type] || [];
    const numJobs = Math.floor(
      district.bounds.width * district.bounds.height * 0.08,
    ); // 8% of tiles are jobs in smaller city

    for (let i = 0; i < numJobs; i++) {
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 20) {
        const x =
          district.bounds.x + Math.floor(Math.random() * district.bounds.width);
        const y =
          district.bounds.y +
          Math.floor(Math.random() * district.bounds.height);

        if (
          tiles[y] &&
          tiles[y][x] &&
          tiles[y][x].type === "building" &&
          !tiles[y][x].data
        ) {
          tiles[y][x] = {
            x,
            y,
            type: "workplace",
            district: district.type,
            spriteId: "workplace",
            interactable: true,
            data: {
              id: `job-${x}-${y}`,
              name: job.name,
              jobType: job.name,
              wage: job.wage,
              stress: job.stress,
              available: Math.random() > 0.3,
            } as WorkplaceData,
          };

          placed = true;
        }

        attempts++;
      }
    }
  });

  // Fourth pass: Add parks randomly
  for (let i = 0; i < 4; i++) {
    // Fewer parks in smaller city
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);

    if (
      tiles[y] &&
      tiles[y][x] &&
      tiles[y][x].type === "building" &&
      !tiles[y][x].data
    ) {
      const district = districts.find(
        (d) =>
          x >= d.bounds.x &&
          x < d.bounds.x + d.bounds.width &&
          y >= d.bounds.y &&
          y < d.bounds.y + d.bounds.height,
      );

      tiles[y][x] = {
        x,
        y,
        type: "park",
        district: district?.type || DistrictType.DOWNTOWN,
        spriteId: "park",
        interactable: false,
      };
    }
  }

  return {
    width,
    height,
    tileSize,
    tiles,
    districts,
  };
}

// Generate a test map with different districts
export function generateTestMap(
  width: number = 20,
  height: number = 15,
): CityMap {
  const tileSize = 32;
  const tiles: MapTile[][] = [];

  // Define district boundaries
  const districts: District[] = [
    {
      id: "downtown-1",
      type: DistrictType.DOWNTOWN,
      name: "Downtown",
      bounds: { x: 0, y: 0, width: 10, height: 7 },
    },
    {
      id: "warehouse-1",
      type: DistrictType.WAREHOUSE,
      name: "Warehouse District",
      bounds: { x: 10, y: 0, width: 10, height: 7 },
    },
    {
      id: "college-1",
      type: DistrictType.COLLEGE,
      name: "College Town",
      bounds: { x: 0, y: 7, width: 7, height: 8 },
    },
    {
      id: "residential-1",
      type: DistrictType.RESIDENTIAL,
      name: "Residential",
      bounds: { x: 7, y: 7, width: 7, height: 8 },
    },
    {
      id: "arts-1",
      type: DistrictType.ARTS,
      name: "Arts District",
      bounds: { x: 14, y: 7, width: 6, height: 8 },
    },
  ];

  // Generate tiles
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      // Determine which district this tile belongs to
      const district = districts.find(
        (d) =>
          x >= d.bounds.x &&
          x < d.bounds.x + d.bounds.width &&
          y >= d.bounds.y &&
          y < d.bounds.y + d.bounds.height,
      );

      const districtType = district?.type || DistrictType.DOWNTOWN;

      // Create streets in a grid pattern
      const isStreet = x % 4 === 0 || y % 4 === 0;

      let tile: MapTile;

      if (isStreet) {
        tile = {
          x,
          y,
          type: "street",
          district: districtType,
          spriteId: "street",
          interactable: false,
        };
      } else {
        // Randomly place different building types
        const rand = Math.random();

        if (rand < 0.1) {
          // Venue
          tile = {
            x,
            y,
            type: "venue",
            district: districtType,
            spriteId: Math.random() > 0.5 ? "venue_active" : "venue_inactive",
            interactable: true,
            animated: Math.random() > 0.5,
            data: {
              id: `venue-${x}-${y}`,
              name: `Venue at ${x},${y}`,
              capacity: Math.floor(Math.random() * 200) + 50,
              hasActiveShow: Math.random() > 0.5,
            },
          };
        } else if (rand < 0.2) {
          // Workplace
          const workplaceTypes = [
            { name: "Indie Record Store", jobType: "Clerk" },
            { name: "Coffee Shop", jobType: "Barista" },
            { name: "Dive Bar", jobType: "Bartender" },
            { name: "Office Building", jobType: "Tech" },
          ];
          const workplace =
            workplaceTypes[Math.floor(Math.random() * workplaceTypes.length)];

          tile = {
            x,
            y,
            type: "workplace",
            district: districtType,
            spriteId: "workplace",
            interactable: true,
            data: {
              id: `workplace-${x}-${y}`,
              name: workplace.name,
              jobType: workplace.jobType,
              available: Math.random() > 0.3,
              wage: 10 + Math.floor(Math.random() * 20),
              stress: 20 + Math.floor(Math.random() * 30),
            },
          };
        } else if (rand < 0.25) {
          // Park
          tile = {
            x,
            y,
            type: "park",
            district: districtType,
            spriteId: "park",
            interactable: false,
          };
        } else {
          // Regular building
          tile = {
            x,
            y,
            type: "building",
            district: districtType,
            spriteId: `building_${districtType}`,
            interactable: false,
          };
        }
      }

      tiles[y][x] = tile;
    }
  }

  return {
    width,
    height,
    tileSize,
    tiles,
    districts,
  };
}

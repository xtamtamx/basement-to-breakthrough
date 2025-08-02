import {
  CityMap,
  MapTile,
  DistrictType,
  District,
  VenueData,
  WorkplaceData,
} from "@/components/map/MapTypes";
import { Venue, VenueType } from "@/game/types";
import { CityGenerator, CityCell, DistrictInfo } from "@/game/generation/CityGenerator";

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

// Convert CityCell to MapTile
function convertCellToTile(
  cell: CityCell,
  districtInfo: DistrictInfo | undefined
): MapTile {
  const districtType = districtInfo?.type || DistrictType.DOWNTOWN;
  
  if (cell.isStreet) {
    return {
      x: cell.x,
      y: cell.y,
      type: "street",
      district: districtType,
      spriteId: "street",
      interactable: false,
    };
  }
  
  // Handle different development levels
  if (cell.developmentLevel === 'empty') {
    return {
      x: cell.x,
      y: cell.y,
      type: "empty",
      district: districtType,
      spriteId: "empty",
      interactable: false,
      developmentLevel: cell.developmentLevel,
      variation: cell.variation,
    };
  }
  
  // Default to building
  return {
    x: cell.x,
    y: cell.y,
    type: "building",
    district: districtType,
    spriteId: `building_${districtType}`,
    interactable: false,
    developmentLevel: cell.developmentLevel,
    variation: cell.variation,
  };
}

// Generate an advanced city map with organic growth
export function generateAdvancedCityMap(gameVenues: Venue[]): CityMap {
  // Use the advanced city generator
  const generator = new CityGenerator(30, 20);
  const generatedCity = generator.generateCity();
  
  const width = generatedCity.width;
  const height = generatedCity.height;
  const tileSize = 32;
  const tiles: MapTile[][] = [];
  
  // Convert generated cells to MapTiles
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const cell = generatedCity.cells[y][x];
      const districtInfo = cell.districtId 
        ? generatedCity.districts.get(cell.districtId)
        : undefined;
      
      tiles[y][x] = convertCellToTile(cell, districtInfo);
    }
  }
  
  // Convert district info to the format expected by CityMap
  const districts: District[] = Array.from(generatedCity.districts.values()).map(info => ({
    id: info.id,
    type: info.type,
    name: info.name,
    bounds: info.bounds,
  }));
  
  // Place venues in suitable locations
  const placedVenueIds = new Set<string>();
  
  gameVenues.forEach((venue) => {
    const suitableDistrictTypes = VENUE_DISTRICT_MAPPING[venue.type] || [
      DistrictType.DOWNTOWN,
    ];
    
    // Find districts of suitable types
    const suitableDistricts = Array.from(generatedCity.districts.values())
      .filter(d => suitableDistrictTypes.includes(d.type));
    
    if (suitableDistricts.length === 0) return;
    
    // Pick a random suitable district
    const targetDistrict = suitableDistricts[
      Math.floor(Math.random() * suitableDistricts.length)
    ];
    
    // Find a suitable empty or basic building in the district
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 50) {
      const districtCells = targetDistrict.cells;
      const targetCell = districtCells[
        Math.floor(Math.random() * districtCells.length)
      ];
      
      if (
        !targetCell.isStreet &&
        targetCell.x < width &&
        targetCell.y < height &&
        tiles[targetCell.y][targetCell.x].type === "building" &&
        !tiles[targetCell.y][targetCell.x].data &&
        (targetCell.developmentLevel === 'basic' || 
         targetCell.developmentLevel === 'developed')
      ) {
        // Convert to venue
        tiles[targetCell.y][targetCell.x] = {
          x: targetCell.x,
          y: targetCell.y,
          type: "venue",
          district: targetDistrict.type,
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
  });
  
  // Place some initial workplaces in developed areas
  generatedCity.districts.forEach((districtInfo) => {
    const jobs = DISTRICT_JOBS[districtInfo.type] || [];
    if (jobs.length === 0) return;
    
    // Only place jobs in cells with some development
    const developedCells = districtInfo.cells.filter(
      c => !c.isStreet && 
      (c.developmentLevel === 'basic' || 
       c.developmentLevel === 'developed' ||
       c.developmentLevel === 'construction')
    );
    
    const numJobs = Math.min(
      Math.floor(developedCells.length * 0.15), // 15% of developed cells
      3 // Max 3 jobs per district initially
    );
    
    for (let i = 0; i < numJobs; i++) {
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const targetCell = developedCells[
        Math.floor(Math.random() * developedCells.length)
      ];
      
      if (
        targetCell &&
        targetCell.x < width &&
        targetCell.y < height &&
        tiles[targetCell.y][targetCell.x].type === "building" &&
        !tiles[targetCell.y][targetCell.x].data
      ) {
        tiles[targetCell.y][targetCell.x] = {
          x: targetCell.x,
          y: targetCell.y,
          type: "workplace",
          district: districtInfo.type,
          spriteId: "workplace",
          interactable: true,
          data: {
            id: `job-${targetCell.x}-${targetCell.y}`,
            name: job.name,
            jobType: job.name,
            wage: job.wage,
            stress: job.stress,
            available: Math.random() > 0.3,
          } as WorkplaceData,
        };
      }
    }
  });
  
  // Add a few parks in empty spaces
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    
    if (
      tiles[y] &&
      tiles[y][x] &&
      tiles[y][x].type === "empty" &&
      !tiles[y][x].data
    ) {
      const cell = generatedCity.cells[y][x];
      const districtInfo = cell.districtId 
        ? generatedCity.districts.get(cell.districtId)
        : undefined;
      
      tiles[y][x] = {
        x,
        y,
        type: "park",
        district: districtInfo?.type || DistrictType.DOWNTOWN,
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
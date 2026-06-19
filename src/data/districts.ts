import { District } from "@game/types";

// THE canonical district list. The gameStore's initial state and all venue
// locations reference these objects — keep ids in sync with
// CityView.STORE_DISTRICT_TYPE and PixelCityMap.FILLER_BUILDINGS.
export const DISTRICTS = {
  EASTSIDE: {
    id: "eastside",
    name: "Bagel Hamlet",
    sceneStrength: 80,
    gentrificationLevel: 30,
    policePresence: 20,
    rentMultiplier: 1,
    bounds: { x: 0, y: 0, width: 4, height: 4 },
    color: "#ec5b8a",
  } as District,

  DOWNTOWN: {
    id: "downtown",
    name: "The Strip Mall",
    sceneStrength: 60,
    gentrificationLevel: 70,
    policePresence: 50,
    rentMultiplier: 1.5,
    bounds: { x: 4, y: 0, width: 4, height: 4 },
    color: "#3b82f6",
  } as District,

  INDUSTRIAL: {
    id: "industrial",
    name: "Parkway Flats",
    sceneStrength: 70,
    gentrificationLevel: 20,
    policePresence: 60,
    rentMultiplier: 0.8,
    bounds: { x: 0, y: 4, width: 4, height: 4 },
    color: "#5a8a5a",
  } as District,

  // The south-shore beach quarter (was "Good School Dist."). Hosts the Jones
  // Beach amphitheater + the Field 6 boardwalk; rendered as sand + ocean.
  UNIVERSITY: {
    id: "university",
    name: "The Boardwalk",
    sceneStrength: 50,
    gentrificationLevel: 40,
    policePresence: 30,
    rentMultiplier: 1.2,
    bounds: { x: 4, y: 4, width: 4, height: 4 },
    color: "#e8c87a",
    isBeach: true,
  } as District,
};

export const ALL_DISTRICTS: District[] = [
  DISTRICTS.EASTSIDE,
  DISTRICTS.DOWNTOWN,
  DISTRICTS.INDUSTRIAL,
  DISTRICTS.UNIVERSITY,
];

import { District } from "@game/types";

// THE canonical district list. The gameStore's initial state and all venue
// locations reference these objects — keep ids in sync with
// CityViewTest.STORE_DISTRICT_TYPE and PixelCityMap.DISTRICT_LANDMARKS.
export const DISTRICTS = {
  EASTSIDE: {
    id: "eastside",
    name: "Eastside",
    sceneStrength: 80,
    gentrificationLevel: 30,
    policePresence: 20,
    rentMultiplier: 1,
    bounds: { x: 0, y: 0, width: 4, height: 4 },
    color: "#ec4899",
  } as District,

  DOWNTOWN: {
    id: "downtown",
    name: "Downtown",
    sceneStrength: 60,
    gentrificationLevel: 70,
    policePresence: 50,
    rentMultiplier: 1.5,
    bounds: { x: 4, y: 0, width: 4, height: 4 },
    color: "#3b82f6",
  } as District,

  INDUSTRIAL: {
    id: "industrial",
    name: "Industrial",
    sceneStrength: 70,
    gentrificationLevel: 20,
    policePresence: 60,
    rentMultiplier: 0.8,
    bounds: { x: 0, y: 4, width: 4, height: 4 },
    color: "#10b981",
  } as District,

  UNIVERSITY: {
    id: "university",
    name: "University",
    sceneStrength: 50,
    gentrificationLevel: 40,
    policePresence: 30,
    rentMultiplier: 1.2,
    bounds: { x: 4, y: 4, width: 4, height: 4 },
    color: "#f59e0b",
  } as District,
};

export const ALL_DISTRICTS: District[] = [
  DISTRICTS.EASTSIDE,
  DISTRICTS.DOWNTOWN,
  DISTRICTS.INDUSTRIAL,
  DISTRICTS.UNIVERSITY,
];

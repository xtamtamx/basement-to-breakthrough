import { District } from "@game/types";

export const DISTRICTS = {
  UNDERGROUND: {
    id: 'underground',
    name: 'Underground',
    sceneStrength: 80,
    gentrificationLevel: 20,
    policePresence: 30,
    rentMultiplier: 1,
    bounds: { x: 0, y: 0, width: 10, height: 10 },
    color: '#FF0000'
  } as District,
  
  INDUSTRIAL: {
    id: 'industrial',
    name: 'Industrial',
    sceneStrength: 70,
    gentrificationLevel: 30,
    policePresence: 40,
    rentMultiplier: 1.2,
    bounds: { x: 10, y: 0, width: 10, height: 10 },
    color: '#FFA500'
  } as District,
  
  DOWNTOWN: {
    id: 'downtown',
    name: 'Downtown',
    sceneStrength: 60,
    gentrificationLevel: 60,
    policePresence: 60,
    rentMultiplier: 2,
    bounds: { x: 5, y: 5, width: 10, height: 10 },
    color: '#0000FF'
  } as District,
  
  SUBURBS: {
    id: 'suburbs',
    name: 'Suburbs',
    sceneStrength: 40,
    gentrificationLevel: 80,
    policePresence: 80,
    rentMultiplier: 1.5,
    bounds: { x: 0, y: 10, width: 10, height: 10 },
    color: '#00FF00'
  } as District
};
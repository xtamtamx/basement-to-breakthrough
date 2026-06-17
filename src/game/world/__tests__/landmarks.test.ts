import { describe, it, expect } from 'vitest';
import {
  getCityLandmarks,
  districtLandmarkMods,
  landmarkPassiveMoney,
  metaProgressValue,
  LandmarkKind,
  CityLandmark,
} from '../landmarks';
import { District } from '@game/types';

const mkDistrict = (id: string, sceneStrength: number, gentrificationLevel: number): District => ({
  id,
  name: id,
  sceneStrength,
  gentrificationLevel,
  policePresence: 0,
  rentMultiplier: 1,
  bounds: { x: 0, y: 0, width: 1, height: 1 },
  color: '#fff',
});

const districts = [
  mkDistrict('a', 80, 20),
  mkDistrict('b', 40, 90),
  mkDistrict('c', 60, 50),
  mkDistrict('d', 20, 70),
];

describe('getCityLandmarks', () => {
  it('earns nothing until progress crosses the first threshold', () => {
    expect(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 1 })).toHaveLength(0);
    expect(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 2 })).toHaveLength(1);
  });

  it('earns more landmarks as progress grows, capped at the district count', () => {
    expect(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 5 })).toHaveLength(2);
    expect(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 9 })).toHaveLength(3);
    // Past all thresholds it caps at districts.length (4), never more.
    expect(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 100 })).toHaveLength(4);
  });

  it('folds in-run discoveries into progress', () => {
    // metaProgress 1 alone earns nothing; +1 discovery reaches threshold 2.
    expect(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 1, discoveredCount: 1 })).toHaveLength(1);
  });

  it('aligns to DIY when diyPoints is high, and anchors the strongest scene', () => {
    const [first] = getCityLandmarks(districts, { diyPoints: 40, metaProgress: 2 });
    expect(first.alignment).toBe('diy');
    expect(first.districtId).toBe('a'); // highest sceneStrength
    expect(first.effect.creepMult).toBeDefined();
  });

  it('aligns to corporate when sold out, and plants on the most gentrified block', () => {
    const [first] = getCityLandmarks(districts, { diyPoints: -40, metaProgress: 2 });
    expect(first.alignment).toBe('corporate');
    expect(first.districtId).toBe('b'); // highest gentrificationLevel
    expect(first.effect.passiveMoney).toBeGreaterThan(0);
  });

  it('aligns to history when balanced', () => {
    const [first] = getCityLandmarks(districts, { diyPoints: 0, metaProgress: 2 });
    expect(first.alignment).toBe('history');
  });

  it('uses city-flavored landmark names when a known cityId is given', () => {
    const [diyLm] = getCityLandmarks(districts, { diyPoints: 40, metaProgress: 2, cityId: 'newangeles' });
    expect(diyLm.name).toBe('Bootleg Bodega Records'); // New Angeles DIY anchor
    const [corpLm] = getCityLandmarks(districts, { diyPoints: -40, metaProgress: 2, cityId: 'newangeles' });
    expect(corpLm.name).toBe('A&R Shark Tower'); // New Angeles sellout monument
  });

  it('falls back to generic names for an unknown cityId', () => {
    const [lm] = getCityLandmarks(districts, { diyPoints: 40, metaProgress: 2, cityId: 'atlantis' });
    expect(lm.name).toBe('The Vinyl Cathedral'); // generic DIY default
  });

  it('places at most one landmark per district', () => {
    const lms = getCityLandmarks(districts, { diyPoints: 40, metaProgress: 100 });
    const ids = new Set(lms.map((l) => l.districtId));
    expect(ids.size).toBe(lms.length);
  });
});

describe('aggregators', () => {
  it('districtLandmarkMods takes the strongest creep reduction + highest floor per district', () => {
    const lms: CityLandmark[] = [
      { id: '1', name: 'x', kind: LandmarkKind.RECORD_SHRINE, alignment: 'diy', districtId: 'a', blurb: '', effect: { creepMult: 0.5, sceneFloor: 55 } },
      { id: '2', name: 'y', kind: LandmarkKind.ZINE_ARCHIVE, alignment: 'diy', districtId: 'a', blurb: '', effect: { creepMult: 0.55, sceneFloor: 50 } },
    ];
    const mods = districtLandmarkMods(lms);
    expect(mods.get('a')).toEqual({ creepMult: 0.5, sceneFloor: 55 });
  });

  it('landmarkPassiveMoney sums monument income', () => {
    const lms = getCityLandmarks(districts, { diyPoints: -40, metaProgress: 100 });
    expect(landmarkPassiveMoney(lms)).toBeGreaterThan(0);
    // DIY anchors produce no money.
    expect(landmarkPassiveMoney(getCityLandmarks(districts, { diyPoints: 40, metaProgress: 100 }))).toBe(0);
  });

  it('metaProgressValue grows with runs, unlocks and achievements', () => {
    expect(metaProgressValue({ totalRuns: 3, unlocks: ['a', 'b'], achievements: [{}] })).toBe(6);
  });
});

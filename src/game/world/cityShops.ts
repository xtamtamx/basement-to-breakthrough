/**
 * cityShops - deterministic commerce for a city.
 *
 * Shops are derived purely from the city's districts (stable id/name/kind per
 * district id), so the map renderer and the DayJobSystem agree on the exact same
 * set of shops without any shared mutable state. Shops are the city's day-job
 * sources: each shop offers a couple of retail jobs (see DayJobSystem), and the
 * map draws them as storefronts you can tap to browse their jobs.
 */
import { District } from '@game/types';

export enum ShopKind {
  RECORD_STORE = 'RECORD_STORE',
  COFFEE_SHOP = 'COFFEE_SHOP',
  BOOKSTORE = 'BOOKSTORE',
  THRIFT_STORE = 'THRIFT_STORE',
  CORNER_STORE = 'CORNER_STORE',
  INSTRUMENT_SHOP = 'INSTRUMENT_SHOP',
}

export interface CityShop {
  id: string;
  name: string;
  kind: ShopKind;
  districtId: string;
}

export interface ShopJobDef {
  title: string;
  moneyPerTurn: number;
  reputationChange: number;
  fanChange: number;
  stressGain: number;
  connectionGain?: number;
  minReputation?: number;
  flavor: string;
}

interface ShopDef { label: string; jobs: ShopJobDef[] }

// Per-kind label + the day jobs that shop offers. Indie shops trade pay for
// scene cred + connections; the corner store pays more but grinds you down.
export const SHOP_DEFS: Record<ShopKind, ShopDef> = {
  [ShopKind.RECORD_STORE]: {
    label: 'Record Store',
    jobs: [
      { title: 'Record Store Clerk', moneyPerTurn: 110, reputationChange: 2, fanChange: 1, stressGain: 6, connectionGain: 3, flavor: 'You judge everyone by their purchases. Quietly.' },
      { title: 'Crate Digger', moneyPerTurn: 90, reputationChange: 1, fanChange: 0, stressGain: 4, connectionGain: 2, flavor: 'Pricing used vinyl is basically a degree in music history.' },
    ],
  },
  [ShopKind.COFFEE_SHOP]: {
    label: 'Coffee Shop',
    jobs: [
      { title: 'Barista', moneyPerTurn: 120, reputationChange: 0, fanChange: 1, stressGain: 9, connectionGain: 2, flavor: 'Latte art will not pay your rent, but it helps.' },
      { title: 'Open-Mic Host', moneyPerTurn: 70, reputationChange: 4, fanChange: 2, stressGain: 5, connectionGain: 4, flavor: 'Three hours of acoustic Wonderwall. For the scene.' },
    ],
  },
  [ShopKind.BOOKSTORE]: {
    label: 'Bookstore',
    jobs: [
      { title: 'Bookseller', moneyPerTurn: 100, reputationChange: 1, fanChange: 0, stressGain: 5, connectionGain: 2, flavor: 'Shelving zines next to the philosophy section, as one does.' },
    ],
  },
  [ShopKind.THRIFT_STORE]: {
    label: 'Thrift Store',
    jobs: [
      { title: 'Thrift Sorter', moneyPerTurn: 95, reputationChange: 1, fanChange: 0, stressGain: 6, connectionGain: 1, flavor: 'You found a vintage band tee. You are keeping it.' },
    ],
  },
  [ShopKind.CORNER_STORE]: {
    label: 'Corner Store',
    jobs: [
      { title: 'Night Clerk', moneyPerTurn: 140, reputationChange: -1, fanChange: 0, stressGain: 11, connectionGain: 1, flavor: 'The graveyard shift: just you, the hum, and questionable nachos.' },
    ],
  },
  [ShopKind.INSTRUMENT_SHOP]: {
    label: 'Instrument Shop',
    jobs: [
      { title: 'Gear Slinger', moneyPerTurn: 130, reputationChange: 2, fanChange: 1, stressGain: 7, connectionGain: 4, minReputation: 10, flavor: 'Stairway to Heaven is, regrettably, still banned.' },
    ],
  },
};

const SHOP_NAMES: Record<ShopKind, string[]> = {
  [ShopKind.RECORD_STORE]: ['Wax Trax', 'Groove Merchants', 'Spinster Records', 'B-Side Bin'],
  [ShopKind.COFFEE_SHOP]: ['Drip Feed', 'Burnt Note Coffee', 'The Daily Grind', 'Espresso Yourself'],
  [ShopKind.BOOKSTORE]: ['Margin Notes', 'Dog-Eared Books', 'The Reading Room'],
  [ShopKind.THRIFT_STORE]: ['Second Set', 'Hand-Me-Down', 'Thrift Riff'],
  [ShopKind.CORNER_STORE]: ['Corner Stop', 'Quick Pick', 'Nite Owl Mart'],
  [ShopKind.INSTRUMENT_SHOP]: ['Fret Not', 'Low End Theory', 'String Theory'],
};

const KIND_ORDER = Object.values(ShopKind);

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// 1-2 stable shops per district, fully determined by the district id.
export function getDistrictShops(district: District): CityShop[] {
  const h = hashStr(district.id);
  const count = 1 + (h % 2); // 1 or 2
  const shops: CityShop[] = [];
  for (let i = 0; i < count; i++) {
    const kh = hashStr(`${district.id}:${i}`);
    const kind = KIND_ORDER[kh % KIND_ORDER.length];
    const names = SHOP_NAMES[kind];
    shops.push({ id: `shop_${district.id}_${i}`, name: names[(kh >>> 4) % names.length], kind, districtId: district.id });
  }
  return shops;
}

export function getCityShops(districts: District[]): CityShop[] {
  return districts.flatMap(getDistrictShops);
}

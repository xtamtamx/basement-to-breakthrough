/**
 * cityShops - deterministic establishments (commerce + civic) for a city.
 *
 * Every district yields a stable set of shops + a civic building, derived purely
 * from the district id, so the map renderer and DayJobSystem agree on the exact
 * same set without shared mutable state. Each establishment is a day-job source:
 * the map draws it (storefront / civic building) with a tappable marker, and
 * DayJobSystem turns its job defs into real day jobs.
 */
import { District } from '@game/types';

export type ShopCategory = 'commerce' | 'civic';

export enum ShopKind {
  // commerce
  RECORD_STORE = 'RECORD_STORE',
  MUSIC_STORE = 'MUSIC_STORE',
  INSTRUMENT_SHOP = 'INSTRUMENT_SHOP',
  COFFEE_SHOP = 'COFFEE_SHOP',
  BOOKSTORE = 'BOOKSTORE',
  THRIFT_STORE = 'THRIFT_STORE',
  CORNER_STORE = 'CORNER_STORE',
  // civic
  POLICE_STATION = 'POLICE_STATION',
  FIRE_STATION = 'FIRE_STATION',
  HOSPITAL = 'HOSPITAL',
  POST_OFFICE = 'POST_OFFICE',
  SCHOOL = 'SCHOOL',
  LIBRARY = 'LIBRARY',
}

export interface CityShop {
  id: string;
  name: string;
  kind: ShopKind;
  districtId: string;
  category: ShopCategory;
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

interface ShopDef { label: string; category: ShopCategory; jobs: ShopJobDef[] }

// Per-kind label, category + the day jobs it offers. Indie commerce trades pay
// for scene cred + connections; civic work pays steady (the cops cost you cred,
// the library/school/hospital build community).
export const SHOP_DEFS: Record<ShopKind, ShopDef> = {
  [ShopKind.RECORD_STORE]: {
    label: 'Record Store', category: 'commerce',
    jobs: [
      { title: 'Record Store Clerk', moneyPerTurn: 110, reputationChange: 2, fanChange: 1, stressGain: 6, connectionGain: 3, flavor: 'You judge everyone by their purchases. Quietly.' },
      { title: 'Crate Digger', moneyPerTurn: 90, reputationChange: 1, fanChange: 0, stressGain: 4, connectionGain: 2, flavor: 'Pricing used vinyl is basically a degree in music history.' },
    ],
  },
  [ShopKind.MUSIC_STORE]: {
    label: 'Music Store', category: 'commerce',
    jobs: [
      { title: 'Floor Staff', moneyPerTurn: 115, reputationChange: 2, fanChange: 2, stressGain: 6, connectionGain: 4, flavor: 'Demoing pedals to teenagers. Living the dream, sort of.' },
      { title: 'Lessons Instructor', moneyPerTurn: 100, reputationChange: 1, fanChange: 1, stressGain: 5, connectionGain: 3, minReputation: 10, flavor: 'Teaching the next generation the riffs that ruined your hearing.' },
    ],
  },
  [ShopKind.INSTRUMENT_SHOP]: {
    label: 'Instrument Shop', category: 'commerce',
    jobs: [
      { title: 'Gear Slinger', moneyPerTurn: 130, reputationChange: 2, fanChange: 1, stressGain: 7, connectionGain: 4, minReputation: 10, flavor: 'Stairway to Heaven is, regrettably, still banned.' },
    ],
  },
  [ShopKind.COFFEE_SHOP]: {
    label: 'Coffee Shop', category: 'commerce',
    jobs: [
      { title: 'Barista', moneyPerTurn: 120, reputationChange: 0, fanChange: 1, stressGain: 9, connectionGain: 2, flavor: 'Latte art will not pay your rent, but it helps.' },
      { title: 'Open-Mic Host', moneyPerTurn: 70, reputationChange: 4, fanChange: 2, stressGain: 5, connectionGain: 4, flavor: 'Three hours of acoustic Wonderwall. For the scene.' },
    ],
  },
  [ShopKind.BOOKSTORE]: {
    label: 'Bookstore', category: 'commerce',
    jobs: [
      { title: 'Bookseller', moneyPerTurn: 100, reputationChange: 1, fanChange: 0, stressGain: 5, connectionGain: 2, flavor: 'Shelving zines next to the philosophy section, as one does.' },
    ],
  },
  [ShopKind.THRIFT_STORE]: {
    label: 'Thrift Store', category: 'commerce',
    jobs: [
      { title: 'Thrift Sorter', moneyPerTurn: 95, reputationChange: 1, fanChange: 0, stressGain: 6, connectionGain: 1, flavor: 'You found a vintage band tee. You are keeping it.' },
    ],
  },
  [ShopKind.CORNER_STORE]: {
    label: 'Corner Store', category: 'commerce',
    jobs: [
      { title: 'Night Clerk', moneyPerTurn: 140, reputationChange: -1, fanChange: 0, stressGain: 11, connectionGain: 1, flavor: 'The graveyard shift: just you, the hum, and questionable nachos.' },
    ],
  },
  [ShopKind.POLICE_STATION]: {
    label: 'Police Station', category: 'civic',
    jobs: [
      { title: 'Evidence Room Clerk', moneyPerTurn: 160, reputationChange: -7, fanChange: -2, stressGain: 10, connectionGain: 0, flavor: 'Filing paperwork for the precinct. Your old bandmates would not approve.' },
      { title: 'Parking Enforcement', moneyPerTurn: 130, reputationChange: -5, fanChange: -1, stressGain: 8, flavor: 'You ticket the van you used to tour in. Cold world.' },
    ],
  },
  [ShopKind.FIRE_STATION]: {
    label: 'Fire Station', category: 'civic',
    jobs: [
      { title: 'Station Cook', moneyPerTurn: 120, reputationChange: 1, fanChange: 0, stressGain: 6, connectionGain: 2, flavor: 'You make chili for heroes. The Dalmatian respects you.' },
    ],
  },
  [ShopKind.HOSPITAL]: {
    label: 'Hospital', category: 'civic',
    jobs: [
      { title: 'Orderly', moneyPerTurn: 165, reputationChange: 2, fanChange: 0, stressGain: 13, connectionGain: 2, flavor: 'Twelve-hour shifts. At least the cafeteria coffee is free.' },
      { title: 'Night Janitor', moneyPerTurn: 135, reputationChange: 1, fanChange: 0, stressGain: 9, connectionGain: 1, flavor: 'Mopping the ER at 3am, writing lyrics in your head.' },
    ],
  },
  [ShopKind.POST_OFFICE]: {
    label: 'Post Office', category: 'civic',
    jobs: [
      { title: 'Mail Sorter', moneyPerTurn: 130, reputationChange: 0, fanChange: 0, stressGain: 8, connectionGain: 1, flavor: "You've memorized every venue's ZIP code from mailing flyers." },
    ],
  },
  [ShopKind.SCHOOL]: {
    label: 'School', category: 'civic',
    jobs: [
      { title: 'Substitute Teacher', moneyPerTurn: 110, reputationChange: 3, fanChange: 1, stressGain: 9, connectionGain: 3, flavor: 'Teaching music to kids who think you’re ancient. A few of them get it.' },
    ],
  },
  [ShopKind.LIBRARY]: {
    label: 'Library', category: 'civic',
    jobs: [
      { title: 'Library Page', moneyPerTurn: 90, reputationChange: 2, fanChange: 0, stressGain: 4, connectionGain: 3, flavor: 'Shhh. You run the all-ages zine archive out of the back room.' },
    ],
  },
};

const SHOP_NAMES: Record<ShopKind, string[]> = {
  [ShopKind.RECORD_STORE]: ['Wax Trax', 'Groove Merchants', 'Spinster Records', 'B-Side Bin'],
  [ShopKind.MUSIC_STORE]: ['Sound Off', 'Amped', 'Decibel', 'The Music Shop'],
  [ShopKind.INSTRUMENT_SHOP]: ['Fret Not', 'Low End Theory', 'String Theory'],
  [ShopKind.COFFEE_SHOP]: ['Drip Feed', 'Burnt Note Coffee', 'The Daily Grind', 'Espresso Yourself'],
  [ShopKind.BOOKSTORE]: ['Margin Notes', 'Dog-Eared Books', 'Paperback Riot'],
  [ShopKind.THRIFT_STORE]: ['Second Set', 'Hand-Me-Down', 'Thrift Riff'],
  [ShopKind.CORNER_STORE]: ['Corner Stop', 'Quick Pick', 'Nite Owl Mart'],
  [ShopKind.POLICE_STATION]: ['12th Precinct', 'Central Station', 'East Precinct'],
  [ShopKind.FIRE_STATION]: ['Engine Co. 9', 'Ladder 14', 'Station 6'],
  [ShopKind.HOSPITAL]: ['Mercy General', 'St. Vitus Hospital', 'County Medical'],
  [ShopKind.POST_OFFICE]: ['Postal Annex', 'Branch 21 Post', 'Central P.O.'],
  [ShopKind.SCHOOL]: ['Lincoln High', 'Eastside Middle', 'Garfield School'],
  [ShopKind.LIBRARY]: ['Public Library', 'Carnegie Branch', 'Westside Library'],
};

const ALL_KINDS = Object.values(ShopKind);
const COMMERCE_KINDS = ALL_KINDS.filter((k) => SHOP_DEFS[k].category === 'commerce');
const CIVIC_KINDS = ALL_KINDS.filter((k) => SHOP_DEFS[k].category === 'civic');

export const categoryOf = (kind: ShopKind): ShopCategory => SHOP_DEFS[kind].category;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Each district yields 1-2 commerce shops + 1 civic building, all stable.
export function getDistrictShops(district: District): CityShop[] {
  const out: CityShop[] = [];
  const count = 1 + (hashStr(district.id) % 2); // 1 or 2 commerce
  for (let i = 0; i < count; i++) {
    const kh = hashStr(`${district.id}:${i}`);
    const kind = COMMERCE_KINDS[kh % COMMERCE_KINDS.length];
    out.push({ id: `shop_${district.id}_${i}`, name: SHOP_NAMES[kind][(kh >>> 4) % SHOP_NAMES[kind].length], kind, districtId: district.id, category: 'commerce' });
  }
  const ch = hashStr(`${district.id}:civic`);
  const ck = CIVIC_KINDS[ch % CIVIC_KINDS.length];
  out.push({ id: `civic_${district.id}`, name: SHOP_NAMES[ck][(ch >>> 4) % SHOP_NAMES[ck].length], kind: ck, districtId: district.id, category: 'civic' });
  return out;
}

export function getCityShops(districts: District[]): CityShop[] {
  return districts.flatMap(getDistrictShops);
}

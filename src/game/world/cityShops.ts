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
  CHAIN_STORE = 'CHAIN_STORE', // corporate creep — appears as a district gentrifies
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
  [ShopKind.CHAIN_STORE]: {
    label: 'Chain Store', category: 'commerce',
    jobs: [
      { title: 'Shift Lead', moneyPerTurn: 175, reputationChange: -4, fanChange: 0, stressGain: 9, connectionGain: 0, flavor: 'Corporate lanyard, employee of the month, the slow death of the soul.' },
      { title: 'Brand Ambassador', moneyPerTurn: 150, reputationChange: -3, fanChange: -1, stressGain: 7, flavor: "Handing out samples of something you'd never be caught buying." },
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
  [ShopKind.CHAIN_STORE]: ['MegaMart', 'Brew Giant', 'ValueZone', 'QuickCorp'],
  [ShopKind.POLICE_STATION]: ['12th Precinct', 'Central Station', 'East Precinct'],
  [ShopKind.FIRE_STATION]: ['Engine Co. 9', 'Ladder 14', 'Station 6'],
  [ShopKind.HOSPITAL]: ['Mercy General', 'St. Vitus Hospital', 'County Medical'],
  [ShopKind.POST_OFFICE]: ['Postal Annex', 'Branch 21 Post', 'Central P.O.'],
  [ShopKind.SCHOOL]: ['Lincoln High', 'Eastside Middle', 'Garfield School'],
  [ShopKind.LIBRARY]: ['Public Library', 'Carnegie Branch', 'Westside Library'],
};

export const categoryOf = (kind: ShopKind): ShopCategory => SHOP_DEFS[kind].category;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
// Modulo-safe: tolerate any int (shifts can produce huge/negative values).
const pick = <T,>(arr: readonly T[], h: number) => arr[((Math.trunc(h) % arr.length) + arr.length) % arr.length];

// Kinds grouped by the vibe they project on the map.
const ANCHOR_KINDS = [ShopKind.CORNER_STORE, ShopKind.COFFEE_SHOP] as const;       // the basics, always there
const SCENE_KINDS = [ShopKind.RECORD_STORE, ShopKind.MUSIC_STORE, ShopKind.INSTRUMENT_SHOP, ShopKind.THRIFT_STORE, ShopKind.BOOKSTORE] as const; // bloom with a thriving DIY scene
const COMMUNITY_CIVIC = [ShopKind.LIBRARY, ShopKind.SCHOOL, ShopKind.HOSPITAL, ShopKind.FIRE_STATION, ShopKind.POST_OFFICE] as const; // civic goods a developed district earns

// Per-city shop name overrides — each scene's establishments read as the real
// (parodied) local spots, falling back to the generic pool for any kind/city
// not listed. Home = Long Island. Mirrors the per-city landmark naming.
const CITY_SHOP_NAMES: Record<string, Partial<Record<ShopKind, string[]>>> = {
  home: {
    // Everyday LI spots (the bagel place, the diner, the grocery, the beach snack bar)
    [ShopKind.CORNER_STORE]: ['Bagel Czar', 'The Colossal Diner', 'King Kolon', 'Field 6 Snack Bar'],
    // Big-box corporate creep — the supermall arrives as the neighborhood turns
    [ShopKind.CHAIN_STORE]: ['Teddyfelt Fields Mall', 'ShopWrong', 'BJ-Wholesale'],
    [ShopKind.COFFEE_SHOP]: ['Strong Bean', 'The Daily Grindstone', 'Java the Hutt'],
  },
  bostland: {
    [ShopKind.CORNER_STORE]: ["Mike's Pasti-Pit Bakery", 'The Spuckie Stop', 'Pine State Pit-Stop Biscuits', 'Voodoo Doughboy Donuts'],
    [ShopKind.CHAIN_STORE]: ["Dunkin' Dynasty", 'Powerful Books Megastore', 'Newbury Comix-Mart'],
    [ShopKind.COFFEE_SHOP]: ['Stumpedtown Coffee', 'Tatte-Tale Bakery', "Dunkin' Decaffeine"],
    [ShopKind.RECORD_STORE]: ['Music Millennium Bug Records', 'Everyday Twee Records', 'In Yer Eah Records'],
  },
  detroleans: {
    [ShopKind.CORNER_STORE]: ['Verti Smarte 24hr Po-Boys', "Two-Feudin' Coney Islands", "Frady's Faygo Stop", 'Better Maid Chip Shack'],
    [ShopKind.CHAIN_STORE]: ['Beignet Buy', 'Coney Barrel', 'Gentriville Galleria'],
    [ShopKind.COFFEE_SHOP]: ["PJ's Chicory Joe", "French Truckin' Coffee", 'Germack & Beignet'],
    [ShopKind.RECORD_STORE]: ['Fourth Man Records', "People's Second-Line Records", 'Louisiana Motown Factory'],
  },
  nasheattle: {
    [ShopKind.CORNER_STORE]: ["Hattie Bee's Hot Chicken Shack", "Prince's Soggy Biscuit Bodega", "Dick's Drizzle-In", 'The Loveless Latte Mart'],
    [ShopKind.CHAIN_STORE]: ['Boot Bonanza Megaplex', 'Opry-Land Outlet Mall', 'Grunge-Mart Superstore'],
    [ShopKind.COFFEE_SHOP]: ['The First Drip Coffee', 'Pedal Steel Espresso', 'Foggy Holler Roasters'],
    [ShopKind.RECORD_STORE]: ["Phonoluxe Pickin'", 'Sonic Buzz Records', 'Easy Street Twang Trax'],
  },
  chicaustin: {
    [ShopKind.CORNER_STORE]: ['Juan in a Jillion Taco Stand', "Lou Malarkey's Deep-Dish Counter", "Joe's Bakery & Bodega", "Portly Joe's Hot Dog Cart"],
    [ShopKind.CHAIN_STORE]: ['H-E-Buy-More', 'Whatachain Burger', "Buc-ee's Cousin Megamart"],
    [ShopKind.COFFEE_SHOP]: ['Intelligentsketchy Coffee', 'Bow Truss-Me Roasters', 'Taco-Deli Drip'],
    [ShopKind.RECORD_STORE]: ['Reckful Records', 'Dusty Groove Annex', "Antoinette's Record Shack"],
  },
  atlando: {
    [ShopKind.CORNER_STORE]: ['Awful House', 'The Varsfor-Tea Drive-In', 'Beefy Prince', 'Peachy Korner Mart'],
    [ShopKind.CHAIN_STORE]: ['MegaMall of Georgia', 'I-Drive Outlet Barn', 'Publux Supermarket'],
    [ShopKind.COFFEE_SHOP]: ['High-Octane Coffee Co.', 'Drunken Chimp Coffee Bar', 'Dancing Gators Espresso'],
    [ShopKind.RECORD_STORE]: ['Wuxtry-Buxtry Vinyl', 'Rock & Roll Heavenly', 'Trans Continental Wax'],
  },
  santampa: {
    [ShopKind.CORNER_STORE]: ['La Segunda Riff Bakery', 'Rooster Roll Bodega', 'Boudin & Brawl Sourdough', 'Cubano Crunch Counter'],
    [ShopKind.CHAIN_STORE]: ['Gator World of Music', 'Busch Garden Mall', 'Riffs-A-Roni Megastore'],
    [ShopKind.COFFEE_SHOP]: ["Fil's Thrash Mission", "Pete's Pit Roast", 'Buddy Brewtal'],
    [ShopKind.RECORD_STORE]: ["Rasputin's Riff Vault", 'Vinyl Fever Dream', 'Microgroove Mosh'],
  },
  newangeles: {
    [ShopKind.CORNER_STORE]: ['Happy 2 Serve U Deli', '1.50 Dollar-Slice Bros', "Randy's Doughnut-on-the-Roof", 'In-N-Outtake Burger'],
    [ShopKind.CHAIN_STORE]: ['Bowery Bath & Beyond', 'Sunset Strip Mall', 'Gentriffany & Co.'],
    [ShopKind.COFFEE_SHOP]: ['Smartsia Coffee', 'Nerve Coffee Roasters', "Fill's-Up Coffee"],
    [ShopKind.RECORD_STORE]: ['Ameba Music', 'Generation Why Records', 'A-1 Sauce Records'],
  },
};

export interface EvolutionContext {
  /** Player's DIY (+) ↔ sellout (−) alignment, −100..+100. Nudges the gates:
   *  a genuine DIY player makes scenes bloom sooner; a sellout invites corporate. */
  diyPoints?: number;
  /** Active city — picks that city's parody shop names (defaults to generic). */
  cityId?: string;
}

/**
 * Establishments are no longer fixed — they emerge from the district's *state*.
 * A district starts small (just an anchor) and grows in the player's image:
 *   - rising sceneStrength (from DIY shows) blooms record/music/instrument shops
 *   - rising gentrification / a sellout alignment invites chains + police
 * Pure & deterministic from (district state, diyPoints), so the map renderer and
 * DayJobSystem always agree and it survives save/load with zero extra state.
 */
export function getDistrictShops(district: District, ctx: EvolutionContext = {}): CityShop[] {
  const h = hashStr(district.id);
  const diy = ctx.diyPoints ?? 0;
  // A genuine DIY player coaxes scenes out sooner; selling out greases gentrification.
  const scene = clamp(district.sceneStrength + Math.max(0, diy) * 0.15, 0, 100);
  const gent = clamp(district.gentrificationLevel + Math.max(0, -diy) * 0.15, 0, 100);
  const police = district.policePresence ?? 0;

  // Resolve names from the active city's parody set (falls back to generic).
  const cityNames = CITY_SHOP_NAMES[ctx.cityId ?? ''];
  const mk = (d: District, idSuffix: string, kind: ShopKind, hh: number): CityShop => ({
    id: `${categoryOf(kind) === 'civic' ? 'civic' : 'shop'}_${d.id}_${idSuffix}`,
    name: pick(cityNames?.[kind] ?? SHOP_NAMES[kind], hh >>> 4),
    kind,
    districtId: d.id,
    category: categoryOf(kind),
  });

  const out: CityShop[] = [];

  // Anchor — the bodega/cafe that's there from day one.
  out.push(mk(district, 'anchor', pick(ANCHOR_KINDS, h), h));

  // Scene tier — up to three indie music spots bloom as the scene strengthens.
  // Step through SCENE_KINDS by index so the three are always distinct kinds.
  const sceneBase = h % SCENE_KINDS.length;
  if (scene >= 38) out.push(mk(district, 'scene0', SCENE_KINDS[sceneBase % SCENE_KINDS.length], h));
  if (scene >= 60) out.push(mk(district, 'scene1', SCENE_KINDS[(sceneBase + 1) % SCENE_KINDS.length], h >>> 3));
  if (scene >= 80) out.push(mk(district, 'scene2', SCENE_KINDS[(sceneBase + 2) % SCENE_KINDS.length], h >>> 6));

  // Corporate tier — the sellout creep.
  if (gent >= 46) out.push(mk(district, 'chain', ShopKind.CHAIN_STORE, h >>> 9));
  if (gent >= 60 || police >= 55) out.push(mk(district, 'police', ShopKind.POLICE_STATION, h >>> 12));

  // Community civic — public infrastructure a district earns once it's developed.
  if (scene >= 50 || gent >= 42) out.push(mk(district, 'civic', pick(COMMUNITY_CIVIC, h >>> 15), h >>> 15));

  return out;
}

export function getCityShops(districts: District[], ctx: EvolutionContext = {}): CityShop[] {
  return districts.flatMap((d) => getDistrictShops(d, ctx));
}

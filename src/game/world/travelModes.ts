/**
 * travelModes - how you get to the next city (the Balatro-style travel CHOICE).
 *
 * Travel isn't a button: each trip offers a few travel-mode cards with
 * trade-offs scaled by your fame. The DIY options (van, hitchhike) cost money
 * or stress but BUILD cred; the comfy/sellout options (flight, sponsored bus)
 * are easy on you but bleed cred — and bleed MORE the more famous you are
 * (a bigger name selling out is a bigger deal). Pick one, or re-roll the offer.
 */

export interface TravelEffects {
  money: number; // + gain / − cost
  stress: number;
  fans: number;
  diyPoints: number; // + cred (DIY) / − sellout
}

export type TravelAlignment = "diy" | "balanced" | "sellout";

export interface TravelOffer {
  id: string;
  name: string;
  icon: string; // emoji
  tagline: string;
  alignment: TravelAlignment;
  effects: TravelEffects;
}

export interface TravelState {
  reputation: number;
}

interface TravelModeDef {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  alignment: TravelAlignment;
  minReputation?: number;
  effects: (s: TravelState) => TravelEffects;
}

// Sellout cred-bleed scales with fame: a bigger name flying private is a bigger
// betrayal. 0 rep → +0, 100 rep → +5.
const repScale = (rep: number) => Math.floor(Math.max(0, rep) / 20);

const MODES: TravelModeDef[] = [
  {
    id: "van",
    name: "Pile in the Van",
    icon: "🚐",
    tagline: "Five to a bench seat, gas-station dinners, pure scene.",
    alignment: "diy",
    effects: () => ({ money: -60, stress: 14, fans: 3, diyPoints: 6 }),
  },
  {
    id: "bus",
    name: "The Megabus",
    icon: "🚌",
    tagline: "Cheap, slow, and the wifi never works.",
    alignment: "balanced",
    effects: () => ({ money: -40, stress: 8, fans: 0, diyPoints: 1 }),
  },
  {
    id: "train",
    name: "The Overnight Train",
    icon: "🚆",
    tagline: "Write three songs watching the country go by.",
    alignment: "balanced",
    effects: () => ({ money: -90, stress: 3, fans: 1, diyPoints: 2 }),
  },
  {
    id: "hitchhike",
    name: "Hitchhike",
    icon: "👍",
    tagline: "Free, terrifying, and great for the memoir.",
    alignment: "diy",
    effects: () => ({ money: 0, stress: 18, fans: 1, diyPoints: 8 }),
  },
  {
    id: "flight",
    name: "Red-Eye Flight",
    icon: "✈️",
    tagline: "Fast and comfy. The scene notices who flies.",
    alignment: "sellout",
    effects: (s) => ({ money: -180, stress: -4, fans: 0, diyPoints: -(4 + repScale(s.reputation)) }),
  },
  {
    id: "sponsoredBus",
    name: "Sponsored Tour Bus",
    icon: "🚍",
    tagline: "An energy-drink logo, a per-diem, and a piece of your soul.",
    alignment: "sellout",
    minReputation: 30,
    effects: (s) => ({ money: 60 + repScale(s.reputation) * 15, stress: -2, fans: 5, diyPoints: -(6 + repScale(s.reputation)) }),
  },
];

const resolve = (def: TravelModeDef, s: TravelState): TravelOffer => ({
  id: def.id,
  name: def.name,
  icon: def.icon,
  tagline: def.tagline,
  alignment: def.alignment,
  effects: def.effects(s),
});

/**
 * Roll a fresh set of travel-mode cards for this trip. Filters by fame gates,
 * shuffles, and takes `count` (resolving each card's effects for the state).
 */
export function rollTravelOffer(state: TravelState, count = 3): TravelOffer[] {
  const eligible = MODES.filter((m) => (m.minReputation ?? 0) <= state.reputation);
  // Fisher–Yates shuffle (Math.random is fine here — this is runtime UI, not a
  // workflow script).
  const pool = [...eligible];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).map((m) => resolve(m, state));
}

/**
 * StakesManager — Ante-style opt-in difficulty ladder.
 *
 * The base game (Stake I) is winnable by a competent player in every mode. Higher
 * stakes layer harder economics on top — pricier rent, colder scene (lower
 * rep/fan gain), more incidents, more stress, and a shorter fuse — WITHOUT raising
 * win targets (reputation caps at 100, so scaling targets would just wall you out).
 * Each stake unlocks the next when you WIN at it; unlock state persists cross-run.
 */

export interface StakeTier {
  tier: number; // 0-based index into STAKE_TIERS
  name: string;
  blurb: string;
  rentMult: number; // venue rent ×
  gainMult: number; // reputation + fans gain × (<1 = colder scene)
  stressMult: number; // show stress ×
  incidentMult: number; // incident chance ×
  turnMult: number; // fraction of the mode's turn budget (proportional, so it
  // bites short AND long modes equally — a fixed delta is nothing to 100-turn Hardcore)
  fameMult: number; // Scene Points reward × — climbing the ladder PAYS more, the
  // ascension carrot (offsets that a harsher economy scores lower → less base fame)
}

export const STAKE_TIERS: StakeTier[] = [
  {
    tier: 0,
    name: 'Open Mic',
    blurb: 'The base game. Learn the ropes, build the scene.',
    rentMult: 1.0,
    gainMult: 1.0,
    stressMult: 1.0,
    incidentMult: 1.0,
    turnMult: 1.0,
    fameMult: 1.0,
  },
  {
    tier: 1,
    name: 'Pay to Play',
    blurb: 'Rent climbs, the scene runs colder, and a little less time.',
    rentMult: 1.35,
    gainMult: 0.8,
    stressMult: 1.25,
    incidentMult: 1.9,
    turnMult: 0.88,
    fameMult: 1.3,
  },
  {
    tier: 2,
    name: 'Sellout Pressure',
    blurb: 'Costs bite hard, growth crawls, and the clock is shorter.',
    rentMult: 1.55,
    gainMult: 0.74,
    stressMult: 1.35,
    incidentMult: 2.2,
    turnMult: 0.84,
    fameMult: 1.6,
  },
  {
    tier: 3,
    name: 'No Future',
    blurb: 'A brutal economy, constant trouble, and barely any time. Only the best survive.',
    rentMult: 1.85,
    gainMult: 0.62,
    stressMult: 1.5,
    incidentMult: 2.8,
    turnMult: 0.76,
    fameMult: 2.0,
  },
];

const STORAGE_KEY = 'btb-stakes-v1';
const clampTier = (t: number) => Math.max(0, Math.min(STAKE_TIERS.length - 1, t | 0));

class StakesManager {
  /** mode id → highest unlocked tier (0 = only Open Mic). Persisted cross-run. */
  private unlocked: Record<string, number> = {};
  /** Tier selected for the current run (transient; rides runtimeSnapshot). */
  private selected = 0;

  constructor() {
    this.load();
  }

  getTiers(): StakeTier[] {
    return STAKE_TIERS;
  }
  getTier(tier: number): StakeTier {
    return STAKE_TIERS[clampTier(tier)];
  }
  getUnlockedTier(mode: string): number {
    return this.unlocked[mode] ?? 0;
  }
  isUnlocked(mode: string, tier: number): boolean {
    return tier <= this.getUnlockedTier(mode);
  }

  select(tier: number): void {
    this.selected = clampTier(tier);
  }
  getSelected(): number {
    return this.selected;
  }
  getSelectedTier(): StakeTier {
    return this.getTier(this.selected);
  }

  /**
   * Record a win at a stake; unlock the next tier for that mode if newly reached.
   * Returns the newly-unlocked tier index, or null if nothing changed.
   */
  recordWin(mode: string, tier: number): number | null {
    const next = clampTier(tier) + 1;
    if (next >= STAKE_TIERS.length) return null; // already at the top
    if (next > this.getUnlockedTier(mode)) {
      this.unlocked[mode] = next;
      this.save();
      return next;
    }
    return null;
  }

  /** For durable resume — the selected tier rides the run's runtimeSnapshot. */
  serializeSelected(): number {
    return this.selected;
  }
  restoreSelected(tier: number | undefined): void {
    this.selected = clampTier(tier ?? 0);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.unlocked = raw ? JSON.parse(raw) : {};
    } catch {
      this.unlocked = {};
    }
  }
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.unlocked));
    } catch {
      /* private mode — unlocks just won't persist this session */
    }
  }
}

export const stakesManager = new StakesManager();

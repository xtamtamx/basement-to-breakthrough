import { useGameStore } from '@stores/gameStore';
import { Show, Band } from '@game/types';
import { prodLog } from '@utils/devLogger';
import { projectBaseAttendance } from './attendanceProjection';

export enum PromotionType {
  FLYERS = 'FLYERS',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WORD_OF_MOUTH = 'WORD_OF_MOUTH',
  RADIO = 'RADIO',
  ZINE_AD = 'ZINE_AD',
  STREET_TEAM = 'STREET_TEAM'
}

export interface PromotionActivity {
  type: PromotionType;
  name: string;
  description: string;
  cost: number;
  timeInvestment: number; // How many "promotion actions" it takes
  effectiveness: number; // Base attendance multiplier
  reputationBonus?: number;
  /** UI: minimum reputation required to use this activity (mirrors requirements.minReputation). */
  requiresReputation?: number;
  /** UI: whether this activity needs scene connections (mirrors requirements.minConnections). */
  requiresConnections?: boolean;
  /** UI: attendance multiplier shown to the player (defaults to effectiveness). */
  attendanceMultiplier?: number;
  /** UI: fans gained from running this activity. */
  fansGained?: number;
  requirements?: {
    minReputation?: number;
    minConnections?: number;
    minFans?: number;
  };
  synergies?: {
    venueTypes?: string[];
    genres?: string[];
  };
  satiricalFlavor: string;
}

export interface ScheduledShow extends Show {
  turnsUntilShow: number;
  /** How many promotions this show can take, fixed at booking = the lead time.
   *  A night you booked tomorrow cannot be flyered for a month. Optional so a
   *  show restored from a save written before this falls back to its lead. */
  promoBudget?: number;
  promotionInvestment: Map<PromotionType, number>;
  totalPromotionEffectiveness: number;
  expectedAttendance: number;
  hype: number; // 0-100, affects attendance and merch sales
}

// JSON-safe form of ScheduledShow: the promotionInvestment Map becomes entries
// so it can ride the persistence layer and be rebuilt on resume.
export type SerializedScheduledShow = Omit<
  ScheduledShow,
  'promotionInvestment'
> & { promotionInvestment: [PromotionType, number][] };

/**
 * Room a promo's list price is quoted at. Above it you are papering a bigger
 * neighbourhood and buying a bigger radio spot; below it, a handful of flyers.
 */
export const PROMO_REFERENCE_CAPACITY = 100;

/**
 * Ceiling on what promotion alone can do to a crowd.
 *
 * There was none, and the six activities stack multiplicatively (1.15 × 1.2 ×
 * 1.25 × 1.3 × 1.25 × 1.35 = 3.15x) with no per-turn limit and two of them free.
 * The balance sim had never promoted at all, and the moment it did, a Classic run
 * fell from 22 turns to EIGHT at a 100% win rate, filling the 1200-cap room by
 * turn 8. Word only travels so far for one show.
 */
export const MAX_PROMO_EFFECTIVENESS = 1.1;

/**
 * Promotion is bounded by TIME, not just money — one push per turn the show is
 * still on the calendar. This is what `timeInvestment` was always reaching for
 * (authored on every activity, read by nothing), and it makes the lead-time
 * selector mean something: book a night five turns out and you can work it for
 * five turns; book it for tomorrow and you get one shot. Without a bound, six
 * activities stacked on every show in the pipeline every turn.
 */
export function promoBudgetFor(show: { promoBudget?: number; turnsUntilShow: number }): number {
  return Math.max(1, show.promoBudget ?? show.turnsUntilShow);
}

/** Promotions already spent on this show. */
export function promosUsed(show: { promotionInvestment: Map<PromotionType, number> }): number {
  let used = 0;
  show.promotionInvestment.forEach((n) => (used += n));
  return used;
}

/**
 * Hype a single promotion buys. Separate from the per-turn hype a show accrues
 * just by being on the calendar, which is the lead-time selector's payoff and is
 * deliberately left alone — this is the part you can BUY. It was 10, so six
 * activities on one show moved the crowd multiplier more than every promotion
 * effectiveness value combined, which is why capping effectiveness alone barely
 * moved the sim (22 turns -> 13 instead of 8).
 */
export const HYPE_PER_PROMO = 2;

/**
 * The list price of a promotion in the room it's promoting.
 *
 * Flat costs were the last unscaled price in the game: $30 of street team bought
 * ~5 extra heads in a basement and ~78 at the lodge, the same defect the
 * room-quoted guarantee retune fixed on the band side.
 */
export function promotionCost(
  activity: Pick<PromotionActivity, 'cost'>,
  venue?: { capacity: number },
): number {
  if (!activity.cost) return 0; // legwork is free of charge; it costs you instead
  const capacity = Math.max(1, venue?.capacity ?? PROMO_REFERENCE_CAPACITY);
  return Math.round(activity.cost * (capacity / PROMO_REFERENCE_CAPACITY));
}

/**
 * What doing it yourself costs you. The two free activities are free of MONEY,
 * not of effort — `timeInvestment` was authored on every activity and read by
 * nothing, which is exactly why "spam every free promo on every show" was
 * costless. Now the legwork lands on the promoter: you either pay for it or you
 * do it yourself.
 */
export function promotionStress(activity: Pick<PromotionActivity, 'cost' | 'timeInvestment'>): number {
  return activity.cost ? 0 : activity.timeInvestment;
}

// Promotion activities with different costs and effectiveness
export const PROMOTION_ACTIVITIES: Record<PromotionType, PromotionActivity> = {
  [PromotionType.FLYERS]: {
    type: PromotionType.FLYERS,
    name: "DIY Flyer Campaign",
    description: "Wheat paste and staple guns at 3am",
    cost: 20,
    timeInvestment: 1,
    effectiveness: 1.15,
    satiricalFlavor: "Half will be torn down by morning, but it's the thought that counts"
  },
  
  [PromotionType.SOCIAL_MEDIA]: {
    type: PromotionType.SOCIAL_MEDIA,
    name: "Social Media Blast",
    description: "Spam every platform until you're shadowbanned",
    cost: 0,
    timeInvestment: 1,
    effectiveness: 1.2,
    requirements: { minFans: 50 },
    satiricalFlavor: "The algorithm hates underground music, but you'll try anyway"
  },
  
  [PromotionType.WORD_OF_MOUTH]: {
    type: PromotionType.WORD_OF_MOUTH,
    name: "Scene Networking",
    description: "Tell everyone at every show for the next week",
    cost: 0,
    timeInvestment: 2,
    effectiveness: 1.25,
    reputationBonus: 2,
    requirements: { minConnections: 10 },
    satiricalFlavor: "The most punk rock promotion: actually talking to people"
  },
  
  [PromotionType.RADIO]: {
    type: PromotionType.RADIO,
    name: "College Radio Spot",
    description: "Beg the late-night DJ to mention your show",
    cost: 50,
    timeInvestment: 1,
    effectiveness: 1.3,
    requirements: { minReputation: 30 },
    synergies: { 
      venueTypes: ['DIVE_BAR', 'VENUE', 'UNDERGROUND'],
      genres: ['PUNK', 'METAL']
    },
    satiricalFlavor: "The DJ will mispronounce your band name, guaranteed"
  },
  
  [PromotionType.ZINE_AD]: {
    type: PromotionType.ZINE_AD,
    name: "Local Zine Ad",
    description: "Quarter-page in the scene's xeroxed bible",
    cost: 40,
    timeInvestment: 1,
    effectiveness: 1.25,
    reputationBonus: 3,
    requirements: { minReputation: 20 },
    satiricalFlavor: "Supporting independent media while promoting your show"
  },
  
  [PromotionType.STREET_TEAM]: {
    type: PromotionType.STREET_TEAM,
    name: "Street Team Campaign",
    description: "Deploy the loyal fans to spread the word",
    cost: 30,
    timeInvestment: 2,
    effectiveness: 1.35,
    requirements: { minFans: 100, minConnections: 20 },
    satiricalFlavor: "Your 'street team' is three enthusiastic teenagers with nothing better to do"
  }
};

export class ShowPromotionSystem {
  private scheduledShows: Map<string, ScheduledShow> = new Map();
  
  // Schedule a show for future turns
  scheduleShow(
    show: Show,
    turnsInAdvance: number = 3
  ): ScheduledShow | null {
    if (turnsInAdvance < 1 || turnsInAdvance > 5) {
      prodLog.error("Shows must be scheduled 1-5 turns in advance");
      return null;
    }
    
    const scheduledShow: ScheduledShow = {
      ...show,
      turnsUntilShow: turnsInAdvance,
      promoBudget: turnsInAdvance,
      promotionInvestment: new Map(),
      totalPromotionEffectiveness: 1.0,
      expectedAttendance: 0,
      hype: 10 // Base hype
    };
    
    this.scheduledShows.set(show.id, scheduledShow);
    this.calculateExpectedAttendance(scheduledShow);
    
    return scheduledShow;
  }
  
  // Apply a promotion activity to a scheduled show
  promoteShow(
    showId: string,
    promotionType: PromotionType
  ): boolean {
    const show = this.scheduledShows.get(showId);
    if (!show || show.turnsUntilShow <= 0) {
      return false;
    }
    
    // One push per turn the show has been on the calendar.
    if (promosUsed(show) >= promoBudgetFor(show)) {
      return false;
    }

    const activity = PROMOTION_ACTIVITIES[promotionType];
    const state = useGameStore.getState();
    
    // Check requirements
    if (activity.requirements) {
      if (activity.requirements.minReputation && state.reputation < activity.requirements.minReputation) {
        return false;
      }
      if (activity.requirements.minConnections && state.connections < activity.requirements.minConnections) {
        return false;
      }
      if (activity.requirements.minFans && state.fans < activity.requirements.minFans) {
        return false;
      }
    }
    
    // Priced for the room it is promoting, not as a flat fee.
    const venue = state.venues.find((v) => v.id === show.venueId);
    const cost = promotionCost(activity, venue);
    if (state.money < cost) {
      return false;
    }

    // Apply promotion. Paid activities cost money; the free ones cost the
    // promoter's own week.
    if (cost > 0) state.addMoney(-cost);
    const stress = promotionStress(activity);
    if (stress > 0) state.addStress(stress);
    
    // Track investment
    const currentInvestment = show.promotionInvestment.get(promotionType) || 0;
    show.promotionInvestment.set(promotionType, currentInvestment + 1);
    
    // Calculate effectiveness with diminishing returns
    const timesUsed = currentInvestment + 1;
    const diminishingFactor = Math.pow(0.8, timesUsed - 1); // Each additional use is 80% as effective
    const activityEffectiveness = 1 + ((activity.effectiveness - 1) * diminishingFactor);
    
    // Update total effectiveness (multiplicative), clamped — word only travels so
    // far for one show, however much you spend on it.
    show.totalPromotionEffectiveness = Math.min(
      MAX_PROMO_EFFECTIVENESS,
      show.totalPromotionEffectiveness * activityEffectiveness,
    );
    
    // Increase hype
    show.hype = Math.min(100, show.hype + HYPE_PER_PROMO * diminishingFactor);
    
    // Apply reputation bonus if any
    if (activity.reputationBonus) {
      state.addReputation(activity.reputationBonus);
    }
    
    // Recalculate expected attendance
    this.calculateExpectedAttendance(show);
    
    return true;
  }
  
  // Calculate expected attendance based on promotion. Uses the SAME projected-
  // crowd helper as the booking preview (projectBaseAttendance) so the Promote
  // screen agrees with what the player saw at booking and with the actual result —
  // then layers this show's promotion + hype on top.
  private calculateExpectedAttendance(show: ScheduledShow): void {
    const state = useGameStore.getState();
    const venue = state.venues.find(v => v.id === show.venueId);
    const lineupIds = show.lineup && show.lineup.length ? show.lineup : [show.bandId];
    const bands = lineupIds
      .map((id) => state.allBands.find((b) => b.id === id))
      .filter((b): b is Band => !!b);

    if (!venue || bands.length === 0) {
      show.expectedAttendance = 0;
      return;
    }

    const currentCity = state.cities?.find((c) => c.id === state.currentCityId);
    const base = projectBaseAttendance({
      bands,
      venue,
      cityPrimaryGenre: currentCity?.primaryGenre,
      currentCityId: state.currentCityId,
      factionStandings: state.factionStandings ?? {},
      eventCapacityPenalty: state.eventCapacityPenalty,
      ticketPrice: show.ticketPrice, // same price penalty the resolver applies, so the Promote screen's crowd matches
      deal: show.deal, // a bill on a door deal promotes itself — the crowd here has to know that
    });

    // Promotion effectiveness + hype bonus (up to 50% at max hype) on top.
    const hypeMultiplier = 1 + (show.hype / 200);
    const effectiveCapacity = Math.max(1, venue.capacity - (state.eventCapacityPenalty ?? 0));
    show.expectedAttendance = Math.min(
      Math.floor(base * show.totalPromotionEffectiveness * hypeMultiplier),
      effectiveCapacity,
    );
  }
  
  // Process scheduled shows (called each turn)
  processScheduledShows(): {
    showsToExecute: ScheduledShow[];
    promotionUpdates: string[];
  } {
    const showsToExecute: ScheduledShow[] = [];
    const promotionUpdates: string[] = [];
    
    this.scheduledShows.forEach((show, id) => {
      show.turnsUntilShow--;
      
      if (show.turnsUntilShow === 0) {
        // Show is happening this turn
        showsToExecute.push(show);
        this.scheduledShows.delete(id);
      } else {
        // Generate hype decay/growth
        if (show.hype > 50) {
          // High hype naturally grows
          show.hype = Math.min(100, show.hype + 5);
          promotionUpdates.push(`${show.turnsUntilShow} turns until show - Hype is building! (${show.hype}%)`);
        } else if (show.hype < 20) {
          // Low hype decays
          show.hype = Math.max(0, show.hype - 2);
          promotionUpdates.push(`${show.turnsUntilShow} turns until show - Need more promotion! (${show.hype}%)`);
        }
        
        // Recalculate expected attendance
        this.calculateExpectedAttendance(show);
      }
    });
    
    return { showsToExecute, promotionUpdates };
  }
  
  // Get all scheduled shows
  getScheduledShows(): ScheduledShow[] {
    return Array.from(this.scheduledShows.values());
  }

  // Clear the schedule. Called when a run resets so booked-but-unplayed shows
  // can't bleed into the next run and desync from the store's display list.
  reset(): void {
    this.scheduledShows.clear();
  }

  // --- durable resume: the scheduled-show Map is in-memory only, so it must
  // be serialized (promotionInvestment is a Map → entries) and rebuilt, or
  // booked shows are stranded after a refresh/load ---
  serialize(): SerializedScheduledShow[] {
    return Array.from(this.scheduledShows.values()).map((s) => ({
      ...s,
      promotionInvestment: Array.from(s.promotionInvestment.entries()),
    }));
  }

  restore(data?: SerializedScheduledShow[]): void {
    this.scheduledShows = new Map(
      (data ?? []).map((s) => [
        s.id,
        {
          ...s,
          promotionInvestment: new Map(s.promotionInvestment),
        } as ScheduledShow,
      ]),
    );
  }
  
  /**
   * Drop scheduled shows whose band or venue no longer exists in the current
   * data set. After a data-file patch (a band/venue removed or its id renamed)
   * a persisted save can reference ids that no longer resolve; left in the Map
   * they resolve as unfair "failed shows" (-rep). This silently cancels them.
   *
   * Defensive: a no-op when every show resolves. Returns the ids that were
   * pruned so callers can keep the store's display list in sync.
   */
  // Cancel a single booked show (e.g. when the player leaves town before it
  // plays). Returns whether it existed.
  cancelShow(id: string): boolean {
    return this.scheduledShows.delete(id);
  }

  pruneDangling(validBandIds: Set<string>, validVenueIds: Set<string>): string[] {
    const pruned: string[] = [];
    this.scheduledShows.forEach((show, id) => {
      if (!validBandIds.has(show.bandId) || !validVenueIds.has(show.venueId)) {
        this.scheduledShows.delete(id);
        pruned.push(id);
      }
    });
    return pruned;
  }

  // Check if a promotion creates synergy
  checkPromotionSynergy(
    show: ScheduledShow,
    promotionType: PromotionType
  ): number {
    const activity = PROMOTION_ACTIVITIES[promotionType];
    if (!activity.synergies) return 1.0;
    
    const state = useGameStore.getState();
    const venue = state.venues.find(v => v.id === show.venueId);
    const band = state.allBands.find(b => b.id === show.bandId);
    
    let synergyBonus = 1.0;
    
    // Check venue type synergy
    if (activity.synergies.venueTypes && venue) {
      if (activity.synergies.venueTypes.includes(venue.type)) {
        synergyBonus *= 1.2;
      }
    }
    
    // Check genre synergy
    if (activity.synergies.genres && band) {
      if (activity.synergies.genres.includes(band.genre)) {
        synergyBonus *= 1.15;
      }
    }
    
    return synergyBonus;
  }
  
  // Get promotion effectiveness for a show
  getPromotionReport(showId: string): {
    totalInvestment: number;
    effectiveness: number;
    activitiesUsed: PromotionType[];
    activePromotions: PromotionType[];
    currentLevel: number;
    baseAttendance: number;
    totalMultiplier: number;
    expectedAttendance: number;
    hype: number;
  } | null {
    const show = this.scheduledShows.get(showId);
    if (!show) return null;

    let totalInvestment = 0;
    const activitiesUsed: PromotionType[] = [];

    show.promotionInvestment.forEach((times, type) => {
      const activity = PROMOTION_ACTIVITIES[type];
      totalInvestment += activity.cost * times;
      activitiesUsed.push(type);
    });

    // Base (unpromoted) attendance for display purposes
    const state = useGameStore.getState();
    const venue = state.venues.find(v => v.id === show.venueId);
    const band = state.allBands.find(b => b.id === show.bandId);
    const baseAttendance = venue && band
      ? Math.floor(venue.capacity * (band.popularity / 100) * (venue.atmosphere / 100))
      : 0;

    return {
      totalInvestment,
      effectiveness: show.totalPromotionEffectiveness,
      activitiesUsed,
      activePromotions: activitiesUsed,
      currentLevel: Math.min(activitiesUsed.length, 5),
      baseAttendance,
      totalMultiplier: show.totalPromotionEffectiveness,
      expectedAttendance: show.expectedAttendance,
      hype: show.hype
    };
  }
}

export const showPromotionSystem = new ShowPromotionSystem();
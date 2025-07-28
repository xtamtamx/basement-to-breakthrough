import { useGameStore } from '@stores/gameStore';
import { Show, Band, Venue } from '@game/types';

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
  promotionInvestment: Map<PromotionType, number>;
  totalPromotionEffectiveness: number;
  expectedAttendance: number;
  hype: number; // 0-100, affects attendance and merch sales
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
      console.error("Shows must be scheduled 1-5 turns in advance");
      return null;
    }
    
    const scheduledShow: ScheduledShow = {
      ...show,
      turnsUntilShow: turnsInAdvance,
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
    
    // Check cost
    if (state.money < activity.cost) {
      return false;
    }
    
    // Apply promotion
    state.addMoney(-activity.cost);
    
    // Track investment
    const currentInvestment = show.promotionInvestment.get(promotionType) || 0;
    show.promotionInvestment.set(promotionType, currentInvestment + 1);
    
    // Calculate effectiveness with diminishing returns
    const timesUsed = currentInvestment + 1;
    const diminishingFactor = Math.pow(0.8, timesUsed - 1); // Each additional use is 80% as effective
    const activityEffectiveness = 1 + ((activity.effectiveness - 1) * diminishingFactor);
    
    // Update total effectiveness (multiplicative)
    show.totalPromotionEffectiveness *= activityEffectiveness;
    
    // Increase hype
    show.hype = Math.min(100, show.hype + (10 * diminishingFactor));
    
    // Apply reputation bonus if any
    if (activity.reputationBonus) {
      state.addReputation(activity.reputationBonus);
    }
    
    // Recalculate expected attendance
    this.calculateExpectedAttendance(show);
    
    return true;
  }
  
  // Calculate expected attendance based on promotion
  private calculateExpectedAttendance(show: ScheduledShow): void {
    const state = useGameStore.getState();
    const venue = state.venues.find(v => v.id === show.venueId);
    const band = state.allBands.find(b => b.id === show.bandId);
    
    if (!venue || !band) {
      show.expectedAttendance = 0;
      return;
    }
    
    // Base attendance calculation
    const baseAttendance = Math.floor(
      venue.capacity * 
      (band.popularity / 100) * 
      (venue.atmosphere / 100)
    );
    
    // Apply promotion effectiveness
    const promotedAttendance = Math.floor(baseAttendance * show.totalPromotionEffectiveness);
    
    // Apply hype bonus
    const hypeMultiplier = 1 + (show.hype / 200); // Up to 50% bonus at max hype
    
    show.expectedAttendance = Math.min(
      Math.floor(promotedAttendance * hypeMultiplier),
      venue.capacity
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
    
    return {
      totalInvestment,
      effectiveness: show.totalPromotionEffectiveness,
      activitiesUsed,
      hype: show.hype
    };
  }
}

export const showPromotionSystem = new ShowPromotionSystem();
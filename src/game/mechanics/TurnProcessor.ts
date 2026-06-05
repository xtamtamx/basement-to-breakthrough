/**
 * @deprecated TurnProcessor is being replaced by TurnResolutionEngine for Phase A.
 * Use turnResolutionEngine.executeFullTurn() for the authoritative turn resolution.
 * This file is kept for backwards compatibility during migration.
 */
import { useGameStore } from '@stores/gameStore';
import { Show, ShowResult, Incident, IncidentType, ConsequenceType } from '@game/types';
import { synergyManager } from './SynergyManager';
import { walkerSystem } from './WalkerSystem';
import { dayJobSystem } from './DayJobSystem';
import { difficultySystem } from './DifficultySystem';
import { showPromotionSystem } from './ShowPromotionSystem';
import { devLog } from '@utils/devLogger';
import {
  ESCALATION_START_TURN,
  ESCALATION_INCIDENT_MULTIPLIER,
} from '../constants/runConstants';

export class TurnProcessor {
  async processNextTurn(): Promise<{ 
    showResults: ShowResult[], 
    totalVenueRent: number,
    dayJobResult?: {
      money: number;
      reputationLoss: number;
      fanLoss: number;
      stressGain: number;
      message: string;
      randomEvent?: {
        message: string;
        effects: {
          money?: number;
          reputation?: number;
          fans?: number;
          stress?: number;
        };
      };
    },
    difficultyEvent?: {
      message: string;
      reputationLost: number;
    }
  }> {
    const store = useGameStore.getState();
    const { venues, allBands } = store;
    
    const showResults: ShowResult[] = [];
    
    // Process scheduled shows from promotion system
    const { showsToExecute } = showPromotionSystem.processScheduledShows();
    
    // Execute shows that are happening this turn
    showsToExecute.forEach(scheduledShow => {
      const result = this.executeShow(scheduledShow, scheduledShow.totalPromotionEffectiveness, scheduledShow.hype);
      showResults.push(result);
      store.completeShow(scheduledShow.id, result);
      
      // Create walkers for the show
      const venue = venues.find(v => v.id === scheduledShow.venueId);
      const band = allBands.find(b => b.id === scheduledShow.bandId);
      if (venue && band) {
        // Create musician walker
        if (venues[0] && venue) {
          walkerSystem.createMusicianWalker(band, venues[0], venue);
        }
        
        // Spawn walkers based on show results
        const success = result.financials.profit > 0 && result.attendance > venue.capacity * 0.5;
        walkerSystem.spawnShowResultWalkers(venue, result.attendance, success);
      }
    });
    
    
    // Import venue upgrade system
    const { venueUpgradeSystem } = await import('./VenueUpgradeSystem');
    
    // Calculate total venue costs with difficulty scaling
    let totalVenueCosts = 0;
    venues.forEach(venue => {
      const scaledRent = difficultySystem.getScaledVenueCost(venue.rent);
      const upkeepCost = venueUpgradeSystem.calculateUpkeepCost(venue);
      const totalCost = scaledRent + upkeepCost;
      
      totalVenueCosts += totalCost;
      store.addMoney(-totalCost);
      
      // Degrade equipment condition
      venueUpgradeSystem.degradeEquipment(venue);
    });
    
    // Process day job income
    const jobResult = dayJobSystem.processJobIncome();
    if (jobResult) {
      // The job system already applies the effects, but we can show a notification
      devLog.log(`Day job: +$${jobResult.money}, -${jobResult.reputationLoss} rep, "${jobResult.message}"`);
    }
    
    // Apply passive difficulty effects
    const difficultyEvent = difficultySystem.applyPassiveDifficulty();
    
    // Check for difficulty milestones
    const milestone = difficultySystem.getDifficultyMilestone(store.currentRound);
    if (milestone && difficultyEvent.message) {
      difficultyEvent.message = `${milestone} ${difficultyEvent.message}`;
    } else if (milestone) {
      difficultyEvent.message = milestone;
    }
    
    // Store the results
    useGameStore.setState({ lastTurnResults: showResults });
    
    // Update round counter
    store.nextRound();
    
    return {
      showResults,
      totalVenueRent: totalVenueCosts,
      dayJobResult: jobResult || undefined,
      difficultyEvent: difficultyEvent.message
        ? { message: difficultyEvent.message, reputationLost: difficultyEvent.reputationLost }
        : undefined
    };
  }
  
  private executeShow(
    show: Show, 
    promotionEffectiveness: number = 1.0,
    hype: number = 0
  ): ShowResult {
    const store = useGameStore.getState();
    const venue = store.venues.find(v => v.id === show.venueId);
    const mainBand = store.allBands.find(b => b.id === show.bandId);
    
    if (!venue || !mainBand) {
      return this.createFailedShowResult(show.id);
    }
    
    // Get all bands in the show
    const allShowBands = [mainBand];
    if (show.bill) {
      show.bill.openers.forEach(bandId => {
        const band = store.allBands.find(b => b.id === bandId);
        if (band) allShowBands.push(band);
      });
    }
    
    // Get synergy context for the new system
    const turn = useGameStore.getState().currentRound;
    const isEscalation = turn >= ESCALATION_START_TURN;

    // Trigger SHOW_START synergies from the new authoritative system
    const synergyContext = {
      currentTurn: turn,
      money: store.money,
      reputation: store.reputation,
      fans: store.fans,
      stress: store.stress,
      venueType: venue.type,
      bandGenre: mainBand.genre,
    };
    const synergyResults = synergyManager.triggerSynergies('SHOW_START', synergyContext);

    // Calculate synergy multiplier from new system
    const attendanceBonus = synergyManager.calculateEffectTotal('ATTENDANCE_PERCENT', synergyResults);

    // Calculate equipment effects
    let equipmentCapacityBonus = 1;
    let equipmentReputationMultiplier = 1;

    venue.equipment.forEach(equipment => {
      if (equipment.owned && equipment.condition > 20) { // Equipment needs 20%+ condition to work
        const effectMultiplier = equipment.condition / 100; // Effects scale with condition
        
        if (equipment.effects.capacityBonus) {
          equipmentCapacityBonus += (equipment.effects.capacityBonus / 100) * effectMultiplier;
        }
        if (equipment.effects.reputationMultiplier) {
          equipmentReputationMultiplier *= (1 + (equipment.effects.reputationMultiplier - 1) * effectMultiplier);
        }
      }
    });
    
    // Apply venue upgrades to capacity
    const upgradeCapacityBonus = venue.upgrades?.reduce((total, upgrade) => {
      return total + (upgrade.effects.capacity || 0);
    }, 0) || 0;
    
    const effectiveCapacity = Math.floor((venue.capacity + upgradeCapacityBonus) * equipmentCapacityBonus);
    
    // Calculate base attendance
    const avgPopularity = allShowBands.reduce((acc, b) => acc + b.popularity, 0) / allShowBands.length;
    const venueBonus = venue.atmosphere / 100;
    const baseAttendance = Math.floor(effectiveCapacity * (avgPopularity / 100) * venueBonus);
    
    // Apply synergy multipliers from the new system
    const synergyMultiplier = 1 + (attendanceBonus / 100);
    
    // Apply difficulty modifiers
    const difficultyModifiers = difficultySystem.getShowDifficultyModifiers(baseAttendance, show.ticketPrice);
    
    // Apply promotion effectiveness
    const promotedAttendance = baseAttendance * promotionEffectiveness;
    
    // Apply hype bonus
    const hypeMultiplier = 1 + (hype / 200); // Up to 50% bonus at max hype
    
    const finalAttendance = Math.min(
      Math.floor(promotedAttendance * synergyMultiplier * difficultyModifiers.attendanceMultiplier * hypeMultiplier), 
      effectiveCapacity
    );
    
    // Calculate revenue
    const ticketRevenue = finalAttendance * show.ticketPrice;
    const barRevenue = venue.hasBar ? finalAttendance * 5 : 0;
    const totalRevenue = ticketRevenue + barRevenue;
    
    // Apply revenue multipliers from the new synergy system
    const moneyBonus = synergyManager.calculateEffectTotal('MONEY_PERCENT', synergyResults);
    const revenueMultiplier = 1 + (moneyBonus / 100);

    const finalRevenue = Math.floor(totalRevenue * revenueMultiplier);
    
    // Calculate costs with difficulty scaling
    const bandCosts = allShowBands.length * difficultySystem.getScaledBandCost();
    const venueCost = difficultySystem.getScaledVenueCost(venue.rent);
    const totalCosts = bandCosts + venueCost;
    
    // Calculate reputation and fan gains with equipment bonus
    let reputationGain = Math.floor(finalAttendance / 10 * equipmentReputationMultiplier);
    let fanGain = Math.floor(finalAttendance / 5);
    
    // Apply synergy effects from the new system
    const fansBonus = synergyManager.calculateEffectTotal('FANS_PERCENT', synergyResults);
    const repBonus = synergyManager.calculateEffectTotal('REPUTATION_PERCENT', synergyResults);
    fanGain = Math.floor(fanGain * (1 + fansBonus / 100));
    reputationGain = Math.floor(reputationGain * (1 + repBonus / 100));
    
    // Check for incidents with escalation and synergy modifiers
    const passiveEffects = synergyManager.getPassiveEffects();
    const incidentReduction = passiveEffects
      .filter(e => e.type === 'INCIDENT_REDUCTION_PERCENT')
      .reduce((sum, e) => sum + e.value, 0);
    let incidentChance = 0.1; // 10% base chance
    if (isEscalation) {
      incidentChance *= ESCALATION_INCIDENT_MULTIPLIER;
    }
    incidentChance = Math.max(0, incidentChance - incidentReduction / 100);

    const incidents: Incident[] = [];
    if (Math.random() < incidentChance) {
      incidents.push({
        type: IncidentType.NOISE_COMPLAINT,
        severity: 3,
        description: 'Neighbors complained about the noise',
        consequences: [
          { type: ConsequenceType.REPUTATION_LOSS, value: 5 }
        ]
      });
      reputationGain -= 5;
    }
    
    return {
      showId: show.id,
      success: true,
      attendance: finalAttendance,
      revenue: finalRevenue,
      reputationChange: reputationGain,
      fansGained: fanGain,
      incidentOccurred: incidents.length > 0,
      financials: {
        revenue: finalRevenue,
        costs: totalCosts,
        profit: finalRevenue - totalCosts
      },
      incidents,
      isSuccess: finalRevenue > totalCosts
    };
  }
  
  private createFailedShowResult(showId: string): ShowResult {
    return {
      showId,
      success: false,
      attendance: 0,
      revenue: 0,
      reputationChange: -10,
      fansGained: 0,
      incidentOccurred: true,
      financials: {
        revenue: 0,
        costs: 0,
        profit: 0
      },
      incidents: [{
        type: IncidentType.BAND_NO_SHOW,
        severity: 8,
        description: 'Show could not be executed',
        consequences: [{ type: ConsequenceType.REPUTATION_LOSS, value: 10 }]
      }],
      isSuccess: false
    };
  }
}

export const turnProcessor = new TurnProcessor();
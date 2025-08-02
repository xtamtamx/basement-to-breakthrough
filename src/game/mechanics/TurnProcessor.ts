import { useGameStore } from '@stores/gameStore';
import { Show, ShowResult, Incident, IncidentType } from '@game/types';
import { synergySystemV2 } from './SynergySystemV2';
import { walkerSystem } from './WalkerSystem';
import { dayJobSystem } from './DayJobSystem';
import { difficultySystem } from './DifficultySystem';
import { showPromotionSystem } from './ShowPromotionSystem';
import { devLog } from '@utils/devLogger';

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
      totalVenueRent, 
      dayJobResult: jobResult || undefined,
      difficultyEvent: difficultyEvent.message ? difficultyEvent : undefined
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
    
    // Check synergies
    const synergies = synergySystemV2.checkSynergies(allShowBands, venue, {
      district: venue.location.id
    });
    
    // Calculate equipment effects
    let equipmentCapacityBonus = 1;
    let equipmentReputationMultiplier = 1;
    let equipmentIncidentReduction = 0;
    
    venue.equipment.forEach(equipment => {
      if (equipment.owned && equipment.condition > 20) { // Equipment needs 20%+ condition to work
        const effectMultiplier = equipment.condition / 100; // Effects scale with condition
        
        if (equipment.effects.capacityBonus) {
          equipmentCapacityBonus += (equipment.effects.capacityBonus / 100) * effectMultiplier;
        }
        if (equipment.effects.reputationMultiplier) {
          equipmentReputationMultiplier *= (1 + (equipment.effects.reputationMultiplier - 1) * effectMultiplier);
        }
        if (equipment.effects.incidentReduction) {
          equipmentIncidentReduction += equipment.effects.incidentReduction * effectMultiplier;
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
    
    // Apply synergy multipliers
    const synergyMultiplier = synergySystemV2.calculateTotalMultiplier(synergies);
    
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
    
    // Apply revenue multipliers from synergies
    const revenueMultiplier = synergies.reduce((total, synergy) => {
      const revenueEffect = synergy.effects.find(e => e.type === 'multiply_revenue');
      return total * (revenueEffect ? revenueEffect.value as number : 1);
    }, 1);
    
    const finalRevenue = Math.floor(totalRevenue * revenueMultiplier);
    
    // Calculate costs with difficulty scaling
    const bandCosts = allShowBands.length * difficultySystem.getScaledBandCost();
    const venueCost = difficultySystem.getScaledVenueCost(venue.rent);
    const totalCosts = bandCosts + venueCost;
    
    // Calculate reputation and fan gains with equipment bonus
    let reputationGain = Math.floor(finalAttendance / 10 * equipmentReputationMultiplier);
    let fanGain = Math.floor(finalAttendance / 5);
    
    // Apply synergy effects
    synergies.forEach(synergy => {
      synergy.effects.forEach(effect => {
        if (effect.type === 'multiply_fans') {
          fanGain = Math.floor(fanGain * (effect.value as number));
        }
        if (effect.type === 'multiply_authenticity') {
          reputationGain = Math.floor(reputationGain * (effect.value as number));
        }
      });
    });
    
    // Check for incidents
    const incidents: Incident[] = [];
    if (Math.random() < 0.1) { // 10% chance of incident
      incidents.push({
        type: IncidentType.NOISE_COMPLAINT,
        severity: 3,
        description: 'Neighbors complained about the noise',
        consequences: [
          { type: 'REPUTATION_LOSS', value: 5 }
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
        consequences: [{ type: 'REPUTATION_LOSS', value: 10 }]
      }],
      isSuccess: false
    };
  }
}

export const turnProcessor = new TurnProcessor();